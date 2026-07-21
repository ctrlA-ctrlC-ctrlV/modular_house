/**
 * Public analytics ingest route (Phase 2, plan §2.3 M1, research R3).
 *
 * `POST /api/analytics/events` — the fire-and-forget beacon target. Validates
 * the payload with the existing `validateBody` middleware (Zod → 400 on a
 * malformed body, M2), applies the existing `generalRateLimit` middleware
 * (429 on excess, M6 — the analytics-specific 120/min boundary is configured
 * and tested in Pass 3), and delegates to `ingestAnalyticsEvent` which stores
 * exactly one anonymous event. A stored event responds **204** with an empty
 * body (M1); Pass 3 will extend the handler so bot (M4) and `/admin`-path
 * (M5) drops also respond 204 so callers cannot distinguish drop from store.
 *
 * The route is mounted under `/api/analytics` by `app.ts` (T044), so the full
 * path is `/api/analytics/events` — matching
 * contracts/analytics.openapi.yaml. Correlation-id logging comes from the
 * app-level `httpLogger` middleware (every request gets `req.id`); the
 * service emits its own Pino counter for the stored event (no PII — M7).
 *
 * Status codes (contract POST /api/analytics/events):
 *   - 204 — event stored (or, in Pass 3, deliberately dropped: bot / admin path)
 *   - 400 — malformed payload / unknown field / over-length (validateBody → M2)
 *   - 429 — IP rate limit exceeded (generalRateLimit → M6; Pass 3 configures 120/min)
 */
import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate.js';
import { generalRateLimit } from '../middleware/rateLimit.js';
import {
  ingestEventSchema,
  ingestAnalyticsEvent,
  type IngestCookies,
} from '../services/analyticsIngest.js';

const router: Router = Router();

/**
 * POST /events — record one public-site page view.
 *
 * Middleware order: rate limit → validate → handler. Rate limiting runs before
 * validation so a flood of malformed payloads is still throttled (defense in
 * depth). Validation runs before the handler so `req.body` is the Zod-validated
 * `IngestEventInput` by the time the handler reads it (the `validateBody`
 * middleware replaces `req.body` with the parsed data on success and returns
 * 400 on failure).
 */
router.post(
  '/events',
  generalRateLimit,
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

      // Happy-path store (T042). Pass 3 will add bot (M4) and `/admin`-path
      // (M5) drops here, still responding 204 (M1: callers cannot distinguish
      // drop from store).
      await ingestAnalyticsEvent(req.body, cookies);

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
