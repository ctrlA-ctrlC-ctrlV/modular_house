/**
 * Analytics query service (Phase 2, plan §2.5 V-series, §2.6 Q-series,
 * research R6/R7).
 *
 * Aggregates `AnalyticsEvent` / `AnalyticsVisitor` rows into the two payloads
 * the admin dashboard consumes: a range-scoped overview (KPIs with
 * period-over-period deltas, a zero-filled timeseries, top pages, and a
 * five-group source breakdown) and a cheap realtime snapshot (trailing
 * 5-minute window). This module owns every timezone- and DST-sensitive
 * computation via parameterized `$queryRaw` with `AT TIME ZONE
 * 'Europe/London'` (research R6) — Postgres, not application code, resolves
 * the DST rules. No rollup tables exist; every call aggregates directly from
 * `analytics_events` using the indexes in data-model.md (research R7). This
 * is the Open-Closed seam: routes and the contract are untouched if the
 * internals are later replaced (e.g. by a rollup strategy).
 *
 * Boundary contract for every `DateRange` this module receives:
 *   - `from` is an INCLUSIVE UTC instant.
 *   - `to` is an EXCLUSIVE UTC instant (half-open interval, `[from, to)`).
 *   Callers (the route layer, Pass 2 T066/T067, and later the frontend range
 *   presets, T070/T071) are responsible for resolving the Q1/Q2 `from`/`to`
 *   request forms — calendar-day strings vs. UTC datetimes — into concrete
 *   instants before calling this service, and for computing the Q5
 *   comparison-window boundaries (which differ by form: ending the day
 *   before `from` for calendar-day ranges, or at `from` exclusive for
 *   datetime ranges). This service is deliberately form-agnostic: it knows
 *   only "aggregate everything in `[from, to)`", keeping all Q1/Q2
 *   form-specific date math in one place outside the aggregation layer.
 *
 * Exports:
 *   - `DateRange`, `KpiValue`, `TimeseriesPoint`, `TopPage`, `SourceGroupName`,
 *     `SourceBreakdown`, `OverviewResult` — the service's result shapes.
 *   - `getOverview` — range-scoped KPIs/timeseries/topPages/sources (T-B5/T-B6).
 *   - `RealtimeTopPage`, `RealtimeResult` — the realtime snapshot shape.
 *   - `getRealtime` — the trailing-5-minute snapshot (T-B6 realtime half).
 */
import type { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Result shapes
// ---------------------------------------------------------------------------

/** A half-open UTC instant window: `from` inclusive, `to` exclusive. */
export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * One KPI's current value plus its Q5 period-over-period comparison.
 * `previous` is `null` only when the comparison window ends at or before the
 * first stored event ever ("no prior data"); otherwise a number, possibly
 * zero. `deltaPercent` is `null` when `previous` is `null` or `0` (a
 * not-computable delta, rendered "—" by the client) — never `NaN`/`Infinity`.
 */
export interface KpiValue {
  current: number;
  previous: number | null;
  deltaPercent: number | null;
}

/** One zero-filled timeseries bucket (Europe/London-aligned, Q4). */
export interface TimeseriesPoint {
  bucketStart: Date;
  pageViews: number;
  sessions: number;
}

/** One ranked entry in the top-pages list (Q6). */
export interface TopPage {
  path: string;
  views: number;
  share: number;
}

/** The five closed traffic-source groups (S1-S3), contract-cased. */
export type SourceGroupName = 'direct' | 'search' | 'social' | 'referral' | 'campaign';

/** One row of the always-five-groups source breakdown (S4, Q6). */
export interface SourceBreakdown {
  group: SourceGroupName;
  sessions: number;
  share: number;
}

/** The full range-scoped overview payload (contract `OverviewResponse` basis). */
export interface OverviewResult {
  bucket: 'hour' | 'day';
  kpis: {
    pageViews: KpiValue;
    uniqueVisitors: KpiValue;
    sessions: KpiValue;
    /** Share in [0, 1] per V3. */
    returningVisitorRate: KpiValue;
    pagesPerSession: KpiValue;
  };
  timeseries: TimeseriesPoint[];
  topPages: TopPage[];
  sources: SourceBreakdown[];
}

/** One ranked entry in the realtime top-active-pages list (V5). */
export interface RealtimeTopPage {
  path: string;
  activeVisitors: number;
}

/** The realtime snapshot payload (contract `RealtimeResponse` basis). */
export interface RealtimeResult {
  activeVisitors: number;
  topActivePages: RealtimeTopPage[];
  windowMinutes: 5;
}

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

/** Q4: hour buckets for spans this long or shorter; day buckets beyond it. */
const HOUR_BUCKET_MAX_SPAN_DAYS = 2;

/** Q6: the top-pages list is capped at this many entries. */
const TOP_PAGES_LIMIT = 10;

/** V5: the realtime window length and the top-active-pages cap. */
const REALTIME_WINDOW_MINUTES = 5;
const REALTIME_TOP_PAGES_LIMIT = 5;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Q4: hour buckets for a span <= 2 days, otherwise day buckets. Span is
 * measured in whole days between the half-open boundaries.
 */
function resolveBucket(range: DateRange): 'hour' | 'day' {
  const spanMs = range.to.getTime() - range.from.getTime();
  const spanDays = spanMs / (24 * 60 * 60 * 1000);
  return spanDays <= HOUR_BUCKET_MAX_SPAN_DAYS ? 'hour' : 'day';
}

/**
 * Q5: a signed percentage delta, guarding both stated null cases (no prior
 * data, not-computable zero-previous) and any residual non-finite result
 * (constitution: deltas never render NaN/Infinity).
 */
function computeDeltaPercent(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) {
    return null;
  }
  const delta = ((current - previous) / previous) * 100;
  return Number.isFinite(delta) ? delta : null;
}

interface BasicAggregates {
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
}

/** V2: distinct visitors; pageViews: row count; sessions: distinct session ids — all within `[range.from, range.to)`. */
async function queryBasicAggregates(prisma: PrismaClient, range: DateRange): Promise<BasicAggregates> {
  const rows = await prisma.$queryRaw<{ page_views: number; unique_visitors: number; sessions: number }[]>`
    SELECT
      COUNT(*)::int AS page_views,
      COUNT(DISTINCT visitor_id)::int AS unique_visitors,
      COUNT(DISTINCT session_id)::int AS sessions
    FROM analytics_events
    WHERE occurred_at >= ${range.from} AND occurred_at < ${range.to}
  `;
  const row = rows[0];
  return {
    pageViews: row?.page_views ?? 0,
    uniqueVisitors: row?.unique_visitors ?? 0,
    sessions: row?.sessions ?? 0,
  };
}

/**
 * V3: the share (0..1) of in-range visitors whose `AnalyticsVisitor.firstSeenAt`
 * falls on a strictly earlier Europe/London calendar day than their first
 * in-range event's day. Guarded against division by zero (renders 0, never
 * NaN, when the range has no visitors).
 */
async function queryReturningVisitorRate(prisma: PrismaClient, range: DateRange): Promise<number> {
  const rows = await prisma.$queryRaw<{ total: number; returning: number }[]>`
    WITH visitor_first_event AS (
      SELECT visitor_id, MIN(occurred_at) AS first_event_in_range
      FROM analytics_events
      WHERE occurred_at >= ${range.from} AND occurred_at < ${range.to}
      GROUP BY visitor_id
    )
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (
        WHERE (av.first_seen_at AT TIME ZONE 'Europe/London')::date <
              (vfe.first_event_in_range AT TIME ZONE 'Europe/London')::date
      )::int AS returning
    FROM visitor_first_event vfe
    JOIN analytics_visitors av ON av.visitor_id = vfe.visitor_id
  `;
  const row = rows[0];
  const total = row?.total ?? 0;
  const returning = row?.returning ?? 0;
  return total > 0 ? returning / total : 0;
}

/** The server-authoritative timestamp of the very first analytics event ever stored, or `null` if the table is empty. */
async function queryFirstEverEventAt(prisma: PrismaClient): Promise<Date | null> {
  const rows = await prisma.$queryRaw<{ first_ever: Date | null }[]>`
    SELECT MIN(occurred_at) AS first_ever FROM analytics_events
  `;
  return rows[0]?.first_ever ?? null;
}

/**
 * Q4: the zero-filled timeseries for `range`, bucketed by `bucket` and
 * aligned to Europe/London bucket boundaries (research R6). Every bucket
 * between the range's start and end appears exactly once, even when no
 * events fall inside it (`LEFT JOIN` against the aggregated counts).
 */
async function queryTimeseries(
  prisma: PrismaClient,
  range: DateRange,
  bucket: 'hour' | 'day',
): Promise<TimeseriesPoint[]> {
  const truncUnit = bucket === 'hour' ? 'hour' : 'day';
  // A literal interval string (e.g. "1 hour") — NOT built via SQL string
  // concatenation, which cannot produce a valid `interval` literal (a bare
  // unit word like "hours" has no quantity and fails to parse).
  const stepInterval = bucket === 'hour' ? '1 hour' : '1 day';
  const rows = await prisma.$queryRaw<
    { bucket_start: Date; page_views: number; sessions: number }[]
  >`
    SELECT
      (bucket_series.local_start AT TIME ZONE 'Europe/London') AS bucket_start,
      COALESCE(agg.page_views, 0)::int AS page_views,
      COALESCE(agg.sessions, 0)::int AS sessions
    FROM generate_series(
      date_trunc(${truncUnit}, ${range.from} AT TIME ZONE 'Europe/London'),
      date_trunc(${truncUnit}, (${range.to} - interval '1 microsecond') AT TIME ZONE 'Europe/London'),
      ${stepInterval}::interval
    ) AS bucket_series(local_start)
    LEFT JOIN (
      SELECT
        date_trunc(${truncUnit}, occurred_at AT TIME ZONE 'Europe/London') AS local_start,
        COUNT(*)::int AS page_views,
        COUNT(DISTINCT session_id)::int AS sessions
      FROM analytics_events
      WHERE occurred_at >= ${range.from} AND occurred_at < ${range.to}
      GROUP BY 1
    ) AS agg ON agg.local_start = bucket_series.local_start
    ORDER BY bucket_series.local_start
  `;

  return rows.map((row) => ({
    bucketStart: row.bucket_start,
    pageViews: row.page_views,
    sessions: row.sessions,
  }));
}

/** Q6: the top-10 paths by view count within `range`, with each entry's share of the range's total page views. */
async function queryTopPages(prisma: PrismaClient, range: DateRange, totalPageViews: number): Promise<TopPage[]> {
  const rows = await prisma.$queryRaw<{ path: string; views: number }[]>`
    SELECT path, COUNT(*)::int AS views
    FROM analytics_events
    WHERE occurred_at >= ${range.from} AND occurred_at < ${range.to}
    GROUP BY path
    ORDER BY views DESC, path ASC
    LIMIT ${TOP_PAGES_LIMIT}
  `;

  return rows.map((row) => ({
    path: row.path,
    views: row.views,
    share: totalPageViews > 0 ? row.views / totalPageViews : 0,
  }));
}

/**
 * S4/Q6: exactly five source-group rows (zero-valued groups included),
 * counting SESSIONS attributed by each session's FIRST stored event within
 * `range` — never events, and never a later event's differing source.
 */
async function querySourceBreakdown(
  prisma: PrismaClient,
  range: DateRange,
  totalSessions: number,
): Promise<SourceBreakdown[]> {
  const rows = await prisma.$queryRaw<{ source_group: SourceGroupName; sessions: number }[]>`
    SELECT
      g::text AS source_group,
      COALESCE(counts.sessions, 0)::int AS sessions
    FROM unnest(enum_range(NULL::"AnalyticsSourceGroup")) AS g
    LEFT JOIN (
      SELECT source_group, COUNT(*)::int AS sessions
      FROM (
        SELECT DISTINCT ON (session_id) session_id, source_group
        FROM analytics_events
        WHERE occurred_at >= ${range.from} AND occurred_at < ${range.to}
        ORDER BY session_id, occurred_at ASC
      ) AS session_first_event
      GROUP BY source_group
    ) AS counts ON counts.source_group = g
    ORDER BY g
  `;

  return rows.map((row) => ({
    group: row.source_group,
    sessions: row.sessions,
    share: totalSessions > 0 ? row.sessions / totalSessions : 0,
  }));
}

// ---------------------------------------------------------------------------
// getOverview — range-scoped KPIs, deltas, timeseries, top pages, sources
// ---------------------------------------------------------------------------

/**
 * Aggregate the full range-scoped overview for `ranges.current`, with every
 * KPI's Q5 period-over-period comparison against `ranges.previous`.
 *
 * @param prisma   - a connected Prisma client.
 * @param ranges   - the current window to report on, and the previous window
 *                   to compare against (already resolved to concrete
 *                   half-open UTC instants by the caller — see the module
 *                   docstring's boundary contract).
 */
export async function getOverview(
  prisma: PrismaClient,
  ranges: { current: DateRange; previous: DateRange },
): Promise<OverviewResult> {
  const { current, previous } = ranges;

  const bucket = resolveBucket(current);

  const [currentBasics, previousBasics, currentReturningRate, previousReturningRate, firstEverEventAt, timeseries] =
    await Promise.all([
      queryBasicAggregates(prisma, current),
      queryBasicAggregates(prisma, previous),
      queryReturningVisitorRate(prisma, current),
      queryReturningVisitorRate(prisma, previous),
      queryFirstEverEventAt(prisma),
      queryTimeseries(prisma, current, bucket),
    ]);

  // Q5: "previous is null only when the comparison window ends before the
  // first stored event" — i.e. there is no data at or before the end of the
  // previous window, so it cannot be measured at all (distinct from a
  // measured-but-empty window, which yields previous = 0).
  const noPriorData = firstEverEventAt === null || previous.to <= firstEverEventAt;

  const currentPagesPerSession = currentBasics.sessions > 0 ? currentBasics.pageViews / currentBasics.sessions : 0;
  const previousPagesPerSession =
    previousBasics.sessions > 0 ? previousBasics.pageViews / previousBasics.sessions : 0;

  function buildKpi(currentValue: number, previousValue: number): KpiValue {
    const kpiPrevious = noPriorData ? null : previousValue;
    return {
      current: currentValue,
      previous: kpiPrevious,
      deltaPercent: computeDeltaPercent(currentValue, kpiPrevious),
    };
  }

  const [topPages, sources] = await Promise.all([
    queryTopPages(prisma, current, currentBasics.pageViews),
    querySourceBreakdown(prisma, current, currentBasics.sessions),
  ]);

  return {
    bucket,
    kpis: {
      pageViews: buildKpi(currentBasics.pageViews, previousBasics.pageViews),
      uniqueVisitors: buildKpi(currentBasics.uniqueVisitors, previousBasics.uniqueVisitors),
      sessions: buildKpi(currentBasics.sessions, previousBasics.sessions),
      returningVisitorRate: buildKpi(currentReturningRate, previousReturningRate),
      pagesPerSession: buildKpi(currentPagesPerSession, previousPagesPerSession),
    },
    timeseries,
    topPages,
    sources,
  };
}

// ---------------------------------------------------------------------------
// getRealtime — trailing 5-minute snapshot
// ---------------------------------------------------------------------------

/**
 * V5: the realtime snapshot — distinct visitors with >= 1 event in the
 * trailing 5 minutes, and the top-5 active paths ranked by distinct-visitor
 * count within that same window.
 *
 * @param clock - injectable clock for a deterministic "now" (constitution
 *                III); defaults to the real wall clock.
 */
export async function getRealtime(
  prisma: PrismaClient,
  clock: () => Date = () => new Date(),
): Promise<RealtimeResult> {
  const now = clock();
  const windowStart = new Date(now.getTime() - REALTIME_WINDOW_MINUTES * 60 * 1000);

  const [activeVisitorRows, topPageRows] = await Promise.all([
    prisma.$queryRaw<{ active_visitors: number }[]>`
      SELECT COUNT(DISTINCT visitor_id)::int AS active_visitors
      FROM analytics_events
      WHERE occurred_at >= ${windowStart} AND occurred_at < ${now}
    `,
    prisma.$queryRaw<{ path: string; active_visitors: number }[]>`
      SELECT path, COUNT(DISTINCT visitor_id)::int AS active_visitors
      FROM analytics_events
      WHERE occurred_at >= ${windowStart} AND occurred_at < ${now}
      GROUP BY path
      ORDER BY active_visitors DESC, path ASC
      LIMIT ${REALTIME_TOP_PAGES_LIMIT}
    `,
  ]);

  return {
    activeVisitors: activeVisitorRows[0]?.active_visitors ?? 0,
    topActivePages: topPageRows.map((row) => ({ path: row.path, activeVisitors: row.active_visitors })),
    windowMinutes: REALTIME_WINDOW_MINUTES,
  };
}
