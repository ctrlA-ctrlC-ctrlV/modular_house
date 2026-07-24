/**
 * Public analytics ingest route (Phase 2, plan §2.3 M1, research R3).
 *
 * `POST /api/analytics/events` — the fire-and-forget beacon target. Applies
 * a dedicated 120 events/minute/IP rate limit (M6, T097), enforces the 4 KB
 * request-body cap (M2, T093), validates the payload with the existing
 * `validateBody` middleware (Zod → 400 on a malformed body, M2), and
 * delegates to `ingestAnalyticsEvent`, which stores exactly one anonymous
 * event or silently drops known bot traffic (M4) / `/admin` paths (M5).
 * Every drop reason responds **204** with an empty body (M1), identically to
 * a store, so callers cannot distinguish any drop from a store.
 *
 * The route is mounted under `/api/analytics` by `app.ts` (T044), so the full
 * path is `/api/analytics/events` — matching
 * contracts/analytics.openapi.yaml. Correlation-id logging comes from the
 * app-level `httpLogger` middleware (every request gets `req.id`); the
 * service emits its own Pino counter for the stored event (no PII — M7).
 *
 * Status codes (contract POST /api/analytics/events):
 *   - 204 — event stored, or deliberately dropped (bot — M4; admin path — M5)
 *   - 400 — malformed payload / unknown field / over-length / over-4KB body (M2)
 *   - 429 — IP rate limit exceeded (120/min, M6)
 */
import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { validateBody } from '../middleware/validate.js';
import { HttpError } from '../middleware/error.js';
import { logger } from '../middleware/logger.js';
import {
  ingestEventSchema,
  ingestAnalyticsEvent,
  type IngestCookies,
} from '../services/analyticsIngest.js';

const router: Router = Router();

/** M2: the ingest request body may not exceed 4 KB (4096 bytes). */
const MAX_INGEST_BODY_BYTES = 4096;

/**
 * Ingest-specific IP rate limit (M6): 120 events/minute/IP; excess -> 429.
 *
 * This replaces the generic `generalRateLimit` (100 requests/15 minutes)
 * that guarded this route through Pass 2 — the M6 boundary is a distinct
 * window and cap tailored to a high-volume, fire-and-forget public beacon
 * endpoint, not the shared admin-facing default the other middleware/
 * rateLimit.ts limiters use. Response shape mirrors those existing limiters'
 * flat `{ error, message, retryAfter }` body for consistency across the API
 * (the contract's nested `ErrorResponse` shape is a pre-existing, disclosed
 * doc-drift on this endpoint family — see review-log.md T069).
 */
const analyticsIngestRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute (M6)
  max: 120, // 120 events per IP per minute (M6)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp = forwardedFor
      ? (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0].trim())
      : req.socket?.remoteAddress || 'unknown';
    return `analytics-ingest:${clientIp}`;
  },
  // The rate-limited counter log (M6): a Pino warning line per throttled
  // request, external log aggregation derives the count from these — the
  // same convention as the bot-dropped / admin-dropped counters (T095/T096).
  handler: (req: Request, res: Response) => {
    logger.warn(
      {
        ip: req.socket?.remoteAddress || 'unknown',
        forwardedFor: req.headers['x-forwarded-for'],
        url: req.url,
        method: req.method,
        rateLimitType: 'analytics-ingest',
        windowMs: 60 * 1000,
        maxRequests: 120,
      },
      'Analytics ingest rate limit exceeded - dropping request',
    );

    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '1 minute',
    });
  },
});

/**
 * Reject any request whose declared body size exceeds the M2 4 KB cap.
 *
 * `app.ts` mounts an app-wide `express.json({ limit: '10mb' })` ahead of
 * every router (including this one), so by the time a request reaches this
 * middleware `body-parser` has already parsed `req.body` and marked
 * `req._body = true` — a second, stricter `express.json({ limit: '4kb' })`
 * chained here would be a silent no-op (body-parser skips re-parsing an
 * already-parsed body). Reading the client-supplied `Content-Length` header
 * instead lets this route enforce its own, narrower cap without altering the
 * app-wide parser or its 10 MB ceiling for every other route.
 *
 * The oversize case is forwarded to the shared `errorHandler` (via
 * `HttpError`) rather than written inline, so it flows through the same
 * error-handling path as every other operational error in the app.
 *
 * Known limitation (review T093 nit): `Content-Length` is a client-declared
 * header, not a measured byte count — a request that lies about it (declares
 * <= 4096 while actually streaming more) slips past this specific check.
 * This is deliberately not hardened further here: the worst case is still
 * bounded by the app-wide 10 MB `express.json` ceiling in `app.ts`, and M2's
 * 4 KB cap is a resource/abuse-protection rule for a public, unauthenticated
 * endpoint, not a hard security boundary that must resist a lying client.
 */
function enforceIngestBodySizeCap(req: Request, _res: Response, next: NextFunction): void {
  const contentLength = Number(req.headers['content-length']);

  if (Number.isFinite(contentLength) && contentLength > MAX_INGEST_BODY_BYTES) {
    next(new HttpError('Request body exceeds the 4 KB limit', 400));
    return;
  }

  next();
}

/**
 * POST /events — record one public-site page view.
 *
 * Middleware order: rate limit → body-size cap → validate → handler. Rate
 * limiting runs first so a flood of any kind of malformed or oversized
 * request is still throttled (defense in depth). The body-size cap runs
 * before schema validation so an oversized request is rejected on its own
 * terms rather than being evaluated field-by-field first. Validation runs
 * before the handler so `req.body` is the Zod-validated `IngestEventInput`
 * by the time the handler reads it (the `validateBody` middleware replaces
 * `req.body` with the parsed data on success and returns 400 on failure).
 */
router.post(
  '/events',
  analyticsIngestRateLimit,
  enforceIngestBodySizeCap,
  validateBody(ingestEventSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // M3: read the anonymous visitor/session identifiers from the request
      // cookies. cookie-parser (mounted app-wide) populates `req.cookies`; the
      // optional chaining is defensive in case the middleware is ever absent.
      // When a cookie is absent the service generates a one-off UUID.
      const cookies: IngestCookies = {
        mh_vid: req.cookies?.mh_vid,
        mh_sid: req.cookies?.mh_sid,
      };

      // The service evaluates `isbot` against the User-Agent header (M4) and
      // the canonicalized path against the `/admin` boundary (M5), dropping
      // either before any storage. Both drop reasons still respond 204 below
      // (M1: callers cannot distinguish a drop from a store).
      await ingestAnalyticsEvent(req.body, cookies, req.headers['user-agent']);

      // M1: a stored event responds 204 with an empty body — never an error
      // the page surfaces. The beacon ignores every response (R1).
      res.status(204).send();
    } catch (error) {
      // Prisma / unexpected errors propagate to the app-level error middleware
      // (app.ts mounts `errorHandler` last), which maps them to 5xx. The
      // validateBody middleware already handled 400 (validation) and
      // analyticsIngestRateLimit already handled 429 (rate limit) upstream.
      next(error);
    }
  },
);

export default router;
