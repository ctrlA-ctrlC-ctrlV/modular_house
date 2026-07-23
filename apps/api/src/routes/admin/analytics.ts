/**
 * Admin analytics routes (Phase 2, plan §5.1, contracts/analytics.openapi.yaml).
 *
 * `GET /overview` — range-scoped KPIs with period-over-period deltas, a
 * zero-filled timeseries, top pages, and the five-group source breakdown
 * (T-B5/T-B6). `GET /realtime` (T067, a later task in this same file) will
 * add the trailing-5-minute snapshot. Both routes sit behind the shared
 * Phase 1 `authenticateJWT` gate (T-B7); per FR-017 the dashboard is
 * readable by every admin role, so no additional `requirePermission` check
 * is layered on top — per-role analytics permissions are explicitly out of
 * scope this phase (plan §1.4).
 *
 * The router is mounted under `/api/admin/analytics` by `app.ts` (T068), so
 * the full path for this handler is `/api/admin/analytics/overview` —
 * matching `contracts/analytics.openapi.yaml`.
 *
 * Range resolution (Q1/Q2/Q5): `analyticsQuery.ts` is deliberately
 * form-agnostic about the request's `from`/`to` shapes (it only knows
 * "aggregate `[from, to)`") — resolving the Q1 request forms into concrete
 * half-open UTC instants, and deriving the Q5 comparison window, is this
 * router's job. This is the Pass 2 happy-path resolver only: full Q1
 * boundary validation (mixed forms, the 490-day span cap, future-date
 * rejection) is Pass 3 hardening (plan §5.3) and is deliberately absent
 * here, mirroring the ingest route's own happy-path-first precedent.
 */
import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../../middleware/auth.js';
import { getOverview, type DateRange } from '../../services/analyticsQuery.js';

const router: Router = Router();

// Module-level Prisma client — mirrors the established convention in
// routes/admin/auth.ts, routes/admin/settings.ts, and services/analyticsIngest.ts.
const prisma = new PrismaClient();

/** Matches the Q1 calendar-day request form (`YYYY-MM-DD`, Europe/London). */
const CALENDAR_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Resolve one Q1 calendar-day boundary to its Europe/London midnight UTC
 * instant. Delegated to Postgres via a parameterized `$queryRaw`, consistent
 * with the project convention (research R6) that Postgres — not application
 * code — owns timezone/DST correctness; `analyticsQuery.ts` uses the same
 * `AT TIME ZONE 'Europe/London'` technique for every bucket/day boundary.
 *
 * The cast MUST target `timestamp` (without time zone), not `date`: casting
 * to `date` resolves the `timestamp with time zone AT TIME ZONE` overload
 * (input treated as a UTC instant, output the LOCAL wall-clock reading —
 * the reverse of what is wanted here), silently shifting the boundary by
 * the current UTC offset instead of producing it. Casting to `timestamp`
 * resolves the other overload (naive input treated as LOCAL time, output
 * the correct UTC instant).
 */
async function londonMidnightUtc(calendarDay: string): Promise<Date> {
  const rows = await prisma.$queryRaw<{ utc_midnight: Date }[]>`
    SELECT (${calendarDay}::timestamp AT TIME ZONE 'Europe/London') AS utc_midnight
  `;
  const row = rows[0];
  if (!row) {
    throw new Error(`Unable to resolve calendar day boundary: ${calendarDay}`);
  }
  return row.utc_midnight;
}

/** The current/previous half-open UTC windows, plus the raw request strings to echo back verbatim (contract `range.from`/`range.to`). */
interface ResolvedRanges {
  current: DateRange;
  previous: DateRange;
  echoFrom: string;
  echoTo: string;
}

/**
 * Resolve the request's `from`/`to` query params (Q1) into the current and
 * comparison (Q5) half-open UTC instant windows `analyticsQuery.getOverview`
 * expects. Accepts either the calendar-day form (both `from` and `to` match
 * `YYYY-MM-DD`) or the ISO 8601 UTC datetime form used by the 24-hour
 * preset — happy path only (Pass 2); see the module docstring.
 */
async function resolveRanges(from: string, to: string): Promise<ResolvedRanges> {
  const isDateForm = CALENDAR_DAY_PATTERN.test(from) && CALENDAR_DAY_PATTERN.test(to);

  let currentFrom: Date;
  let currentTo: Date;

  if (isDateForm) {
    // Date form: both ends are inclusive Europe/London calendar days (Q1).
    // The exclusive upper boundary the service expects is midnight of the
    // day immediately AFTER `to`.
    currentFrom = await londonMidnightUtc(from);
    const toStart = await londonMidnightUtc(to);
    currentTo = new Date(toStart.getTime() + 24 * 60 * 60 * 1000);
  } else {
    // Datetime form (24-hour preset): `from`/`to` are already literal UTC
    // instants.
    currentFrom = new Date(from);
    currentTo = new Date(to);
  }

  // Q5: the immediately preceding window of equal length, ending exactly
  // where the current window begins (exclusive) — true for both request
  // forms, so no form-specific branching is needed here.
  const spanMs = currentTo.getTime() - currentFrom.getTime();
  const previousTo = currentFrom;
  const previousFrom = new Date(previousTo.getTime() - spanMs);

  return {
    current: { from: currentFrom, to: currentTo },
    previous: { from: previousFrom, to: previousTo },
    echoFrom: from,
    echoTo: to,
  };
}

/**
 * GET /overview — range-scoped KPIs, deltas, timeseries, top pages, and the
 * five-group source breakdown (contract `OverviewResponse`).
 */
router.get(
  '/overview',
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { from, to } = req.query;

      // Minimal presence/type guard — both query params are required by the
      // contract. Full Q1 boundary validation (span caps, mixed forms,
      // future-date rejection) is Pass 3 work; this only prevents a crash on
      // a missing/malformed request, it does not attempt full validation.
      if (typeof from !== 'string' || typeof to !== 'string') {
        res.status(400).json({
          error: { message: 'from and to query parameters are required' },
        });
        return;
      }

      const { current, previous, echoFrom, echoTo } = await resolveRanges(from, to);
      const result = await getOverview(prisma, { current, previous });

      // `timeseries[].bucketStart` is passed through as a `Date` — Express's
      // `res.json` serializes it via `JSON.stringify`, which calls
      // `Date.prototype.toJSON` (ISO 8601), matching the contract's
      // `format: date-time` requirement without an explicit remap.
      res.status(200).json({
        range: { from: echoFrom, to: echoTo, bucket: result.bucket },
        kpis: result.kpis,
        timeseries: result.timeseries,
        topPages: result.topPages,
        sources: result.sources,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
