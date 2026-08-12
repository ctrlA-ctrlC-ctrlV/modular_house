/**
 * Admin analytics routes (Phase 2, plan §5.1, contracts/analytics.openapi.yaml).
 *
 * `GET /overview` — range-scoped KPIs with period-over-period deltas, a
 * zero-filled timeseries, top pages, and the five-group source breakdown
 * (T-B5/T-B6). `GET /realtime` — the trailing-5-minute active-visitors/
 * top-pages snapshot (T-B6 realtime half, V5). Both routes sit behind the
 * shared Phase 1 `authenticateJWT` gate (T-B7); per FR-017 the dashboard is
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
 * router's job. Full Q1 boundary validation is implemented here (T103):
 * both params must use the same form (calendar day or ISO datetime);
 * `from <= to`; `to` must not be in the future (`<= today` for the calendar
 * form, `<= now` for the datetime form, both evaluated against this
 * process's `Date` so fake-timer-based tests remain deterministic,
 * constitution III); and the resolved span must not exceed 490 days.
 * Violations respond 400 with the nested `ErrorResponse` shape
 * (`{ error: { message, details } }`), matching
 * `contracts/analytics.openapi.yaml`.
 */
import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../../middleware/auth.js';
import { getOverview, getRealtime, type DateRange } from '../../services/analyticsQuery.js';

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

/**
 * Resolve an arbitrary UTC instant to its Europe/London calendar-day string
 * (`YYYY-MM-DD`), used by the Q1 "to <= today" boundary check. The instant is
 * bound as a query parameter (never SQL's own `now()`), so this respects a
 * fake-timer-injected `Date` in tests exactly as `londonMidnightUtc` respects
 * one for the day-boundary conversion above (research R6 — Postgres owns
 * timezone/DST correctness, application code owns the "now" it asks about).
 */
async function londonCalendarDay(instant: Date): Promise<string> {
  const rows = await prisma.$queryRaw<{ day: string }[]>`
    SELECT ((${instant}::timestamptz AT TIME ZONE 'Europe/London')::date)::text AS day
  `;
  const row = rows[0];
  if (!row) {
    throw new Error('Unable to resolve the current Europe/London calendar day');
  }
  return row.day;
}

/** Q1: the resolved range must not span more than this many inclusive calendar days / this many days of wall-clock time. */
const MAX_SPAN_DAYS = 490;

/** Milliseconds in one day — the unit `MAX_SPAN_DAYS` and the day-form boundary math are expressed in. */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** One Q1 validation failure: which query parameter it concerns, and a human-readable explanation (contract `ErrorResponse.error.details[]`). */
interface RangeValidationError {
  field: 'from' | 'to';
  message: string;
}

/** The current/previous half-open UTC windows, plus the raw request strings to echo back verbatim (contract `range.from`/`range.to`). */
interface ResolvedRanges {
  current: DateRange;
  previous: DateRange;
  echoFrom: string;
  echoTo: string;
}

/**
 * Resolve the request's `from`/`to` query params into the current and
 * comparison (Q5) half-open UTC instant windows `analyticsQuery.getOverview`
 * expects, enforcing every Q1 boundary rule first. Accepts either the
 * calendar-day form (both `from` and `to` match `YYYY-MM-DD`) or the ISO 8601
 * UTC datetime form used by the 24-hour preset — mixing the two forms is
 * itself a Q1 violation. Returns a tagged union: either the resolved ranges,
 * or the first {@link RangeValidationError} encountered (checks run in a
 * fixed order — form consistency, then ordering, then the future-date
 * boundary, then the span cap — so a request violating several rules at once
 * still reports one clear reason).
 */
async function resolveRanges(
  from: string,
  to: string,
): Promise<{ ranges: ResolvedRanges } | { error: RangeValidationError }> {
  const fromIsDateForm = CALENDAR_DAY_PATTERN.test(from);
  const toIsDateForm = CALENDAR_DAY_PATTERN.test(to);

  if (fromIsDateForm !== toIsDateForm) {
    return {
      error: {
        field: 'to',
        message:
          'from and to must use the same form: both YYYY-MM-DD calendar days or both ISO 8601 UTC datetimes',
      },
    };
  }

  let currentFrom: Date;
  let currentTo: Date;

  if (fromIsDateForm) {
    // Date form: both ends are inclusive Europe/London calendar days (Q1).
    // Lexicographic string comparison is equivalent to calendar-day ordering
    // for the zero-padded YYYY-MM-DD form, so no parsing is needed yet.
    if (from > to) {
      return { error: { field: 'from', message: 'from must be on or before to' } };
    }

    const todayLondon = await londonCalendarDay(new Date());
    if (to > todayLondon) {
      return { error: { field: 'to', message: 'to must not be after today (Europe/London)' } };
    }

    // The exclusive upper boundary the service expects is midnight of the
    // day immediately AFTER `to`.
    currentFrom = await londonMidnightUtc(from);
    const toStart = await londonMidnightUtc(to);
    currentTo = new Date(toStart.getTime() + MS_PER_DAY);
  } else {
    // Datetime form (24-hour preset): `from`/`to` are literal UTC instants.
    const parsedFrom = new Date(from);
    const parsedTo = new Date(to);
    if (Number.isNaN(parsedFrom.getTime()) || Number.isNaN(parsedTo.getTime())) {
      return {
        error: { field: 'from', message: 'from and to must be valid ISO 8601 UTC datetimes' },
      };
    }
    if (parsedFrom.getTime() > parsedTo.getTime()) {
      return { error: { field: 'from', message: 'from must be on or before to' } };
    }

    const now = new Date();
    if (parsedTo.getTime() > now.getTime()) {
      return { error: { field: 'to', message: 'to must not be in the future' } };
    }

    currentFrom = parsedFrom;
    currentTo = parsedTo;
  }

  const spanDays = (currentTo.getTime() - currentFrom.getTime()) / MS_PER_DAY;
  if (spanDays > MAX_SPAN_DAYS) {
    return {
      error: { field: 'to', message: `the range must not exceed ${MAX_SPAN_DAYS} days` },
    };
  }

  // Q5: the immediately preceding window of equal length, ending exactly
  // where the current window begins (exclusive) — true for both request
  // forms, so no form-specific branching is needed here.
  const spanMs = currentTo.getTime() - currentFrom.getTime();
  const previousTo = currentFrom;
  const previousFrom = new Date(previousTo.getTime() - spanMs);

  return {
    ranges: {
      current: { from: currentFrom, to: currentTo },
      previous: { from: previousFrom, to: previousTo },
      echoFrom: from,
      echoTo: to,
    },
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
      // contract, ahead of the full Q1 boundary validation `resolveRanges`
      // performs on well-formed strings.
      if (typeof from !== 'string' || typeof to !== 'string') {
        res.status(400).json({
          error: { message: 'from and to query parameters are required' },
        });
        return;
      }

      const resolved = await resolveRanges(from, to);
      if ('error' in resolved) {
        res.status(400).json({
          error: { message: resolved.error.message, details: [resolved.error] },
        });
        return;
      }

      const { current, previous, echoFrom, echoTo } = resolved.ranges;
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

/**
 * GET /realtime — distinct visitors active in the trailing 5 minutes and the
 * top-5 active paths in that same window (contract `RealtimeResponse`, V5).
 * No query parameters: the window is fixed by `analyticsQuery.getRealtime`
 * (V5), which reads the server's real wall clock (no clock is threaded
 * through the route — only test suites inject one, by faking `Date` at the
 * process level, as `analytics-realtime.test.ts` does).
 */
router.get(
  '/realtime',
  authenticateJWT,
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await getRealtime(prisma);

      res.status(200).json({
        activeVisitors: result.activeVisitors,
        topActivePages: result.topActivePages,
        windowMinutes: result.windowMinutes,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
