/**
 * Public analytics ingest route (Phase 2, plan §2.3 M1, research R3).
 *
 * `POST /api/analytics/events` — the fire-and-forget beacon target. Enforces
 * the 4 KB request-body cap (M2, T093), validates the payload with the
 * existing `validateBody` middleware (Zod → 400 on a malformed body, M2),
 * applies the existing `generalRateLimit` middleware (429 on excess, M6 —
 * the analytics-specific 120/min boundary is configured and tested in Pass
 * 3), and delegates to `ingestAnalyticsEvent`, which stores exactly one
 * anonymous event or silently drops known bot traffic (M4, T095). Both
 * outcomes respond **204** with an empty body (M1); Pass 3 will extend the
 * service so `/admin`-path drops (M5) also respond 204, so callers cannot
 * distinguish any drop from a store.
 *
 * The route is mounted under `/api/analytics` by `app.ts` (T044), so the full
 * path is `/api/analytics/events` — matching
 * contracts/analytics.openapi.yaml. Correlation-id logging comes from the
 * app-level `httpLogger` middleware (every request gets `req.id`); the
 * service emits its own Pino counter for the stored event (no PII — M7).
 *
 * Status codes (contract POST /api/analytics/events):
 *   - 204 — event stored, or deliberately dropped (bot, M4; admin path in Pass 3, M5)
 *   - 400 — malformed payload / unknown field / over-length / over-4KB body (M2)
 *   - 429 — IP rate limit exceeded (generalRateLimit → M6; Pass 3 configures 120/min)
 */
import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate.js';
import { generalRateLimit } from '../middleware/rateLimit.js';
import { HttpError } from '../middleware/error.js';
import {
  ingestEventSchema,
  ingestAnalyticsEvent,
  type IngestCookies,
} from '../services/analyticsIngest.js';

const router: Router = Router();

/** M2: the ingest request body may not exceed 4 KB (4096 bytes). */
const MAX_INGEST_BODY_BYTES = 4096;

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
  generalRateLimit,
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

      // M4 (T095): the service evaluates `isbot` against the request's
      // User-Agent header and drops matching traffic before any storage;
      // `/admin`-path drops (M5) follow in T096. Both outcomes still respond
      // 204 below (M1: callers cannot distinguish a drop from a store).
      await ingestAnalyticsEvent(req.body, cookies, req.headers['user-agent']);

      // M1: a stored event responds 204 with an empty body — never an error
      // the page surfaces. The beacon ignores every response (R1).
      res.status(204).send();
    } catch (error) {
      // Prisma / unexpected errors propagate to the app-level error middleware
      // (app.ts mounts `errorHandler` last), which maps them to 5xx. The
      // validateBody middleware already handled 400 (validation) and
      // generalRateLimit already handled 429 (rate limit) upstream.
      next(error);
    }
  },
);

export default router;
