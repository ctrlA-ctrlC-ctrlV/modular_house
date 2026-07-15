/**
 * Admin analytics fixture-data module (Pass 1).
 *
 * Exports typed fixture payloads that mirror the contract schemas in
 * `specs/013-panel-phase-2/contracts/analytics.openapi.yaml`. Pass 1 widgets
 * and web tests consume ONLY this module for data — no live API calls, no
 * data wiring (plan §5.3, research R12).
 *
 * The three KpiValue variants per Q5 are represented:
 *   1. Numeric previous + numeric deltaPercent — normal period-over-period delta.
 *   2. `previous: null` — "no prior data" (comparison window ends before first stored event).
 *   3. `previous: 0` + `deltaPercent: null` — measured-but-zero prior, delta not computable ("—").
 * Deltas never render NaN/Infinity (Q5).
 */

// ---------------------------------------------------------------------------
// Types — mirror contracts/analytics.openapi.yaml components.schemas
// ---------------------------------------------------------------------------

/** The five traffic source groups (plan §2.4 S1–S3, Q6). Stored as lowercase. */
export type SourceGroup = 'direct' | 'search' | 'social' | 'referral' | 'campaign';

/** Bucket granularity: hour when span <= 2 days, else day (Q4). */
export type BucketGranularity = 'hour' | 'day';

/**
 * KPI value with period-over-period comparison (contract KpiValue).
 *
 * - `previous` is `null` only when the comparison window ends before the first
 *   stored event — rendered "no prior data" (Q5).
 * - `previous: 0` with `deltaPercent: null` means the prior period was measured
 *   but zero — the delta is not computable and rendered as "—" (Q5).
 * - `deltaPercent` is `null` whenever `previous` is `null` or `0`.
 * - Deltas never render NaN/Infinity (Q5).
 */
export interface KpiValue {
  current: number;
  previous: number | null;
  deltaPercent: number | null;
}

/** Range echo returned by the overview endpoint (contract OverviewResponse.range). */
export interface AnalyticsRange {
  from: string;
  to: string;
  bucket: BucketGranularity;
}

/** One timeseries bucket (contract OverviewResponse.timeseries items). */
export interface TimeseriesBucket {
  bucketStart: string;
  pageViews: number;
  sessions: number;
}

/** One top-pages entry (contract OverviewResponse.topPages items, max 10 per Q6). */
export interface TopPageEntry {
  path: string;
  views: number;
  share: number;
}

/** One source-breakdown entry (contract OverviewResponse.sources items, exactly 5 per Q6). */
export interface SourceEntry {
  group: SourceGroup;
  sessions: number;
  share: number;
}

/** Five KPIs with deltas (contract OverviewResponse.kpis). */
export interface OverviewKpis {
  pageViews: KpiValue;
  uniqueVisitors: KpiValue;
  sessions: KpiValue;
  returningVisitorRate: KpiValue;
  pagesPerSession: KpiValue;
}

/** Full overview response (contract OverviewResponse). */
export interface OverviewResponse {
  range: AnalyticsRange;
  kpis: OverviewKpis;
  timeseries: TimeseriesBucket[];
  topPages: TopPageEntry[];
  sources: SourceEntry[];
}

/** One realtime active-page entry (contract RealtimeResponse.topActivePages items, max 5 per V5). */
export interface RealtimePageEntry {
  path: string;
  activeVisitors: number;
}

/** Full realtime response (contract RealtimeResponse). */
export interface RealtimeResponse {
  activeVisitors: number;
  topActivePages: RealtimePageEntry[];
  windowMinutes: 5;
}

// ---------------------------------------------------------------------------
// Helper: five source groups with zero values (Q6 — zero-valued groups shown)
// ---------------------------------------------------------------------------

/**
 * Build the five source-group entries with zero sessions/share.
 * Used as the base for both empty and populated fixtures so all five groups
 * are always present (Q6).
 */
function emptySources(): SourceEntry[] {
  return (['direct', 'search', 'social', 'referral', 'campaign'] as const).map((group) => ({
    group,
    sessions: 0,
    share: 0,
  }));
}

// ---------------------------------------------------------------------------
// Fixture: Overview — populated with numeric deltas (Q5 variant 1)
// ---------------------------------------------------------------------------

/**
 * Overview fixture with all five KPIs having numeric `previous` and numeric
 * `deltaPercent` — the normal period-over-period delta case (Q5 variant 1).
 * Timeseries uses day buckets (3-month span > 2 days, Q4). Top pages has 5
 * entries (<= 10 per Q6). Sources has all five groups with non-zero sessions.
 */
export const overviewPopulated: OverviewResponse = {
  range: {
    from: '2026-04-15',
    to: '2026-07-15',
    bucket: 'day',
  },
  kpis: {
    pageViews: { current: 4820, previous: 3950, deltaPercent: 22.0 },
    uniqueVisitors: { current: 1850, previous: 1620, deltaPercent: 14.2 },
    sessions: { current: 2100, previous: 1780, deltaPercent: 18.0 },
    returningVisitorRate: { current: 0.32, previous: 0.28, deltaPercent: 14.3 },
    pagesPerSession: { current: 2.3, previous: 2.22, deltaPercent: 3.6 },
  },
  timeseries: [
    { bucketStart: '2026-04-15T00:00:00.000Z', pageViews: 52, sessions: 24 },
    { bucketStart: '2026-04-16T00:00:00.000Z', pageViews: 48, sessions: 22 },
    { bucketStart: '2026-04-17T00:00:00.000Z', pageViews: 61, sessions: 28 },
    { bucketStart: '2026-04-18T00:00:00.000Z', pageViews: 55, sessions: 25 },
    { bucketStart: '2026-04-19T00:00:00.000Z', pageViews: 43, sessions: 20 },
    { bucketStart: '2026-04-20T00:00:00.000Z', pageViews: 38, sessions: 18 },
    { bucketStart: '2026-04-21T00:00:00.000Z', pageViews: 67, sessions: 30 },
  ],
  topPages: [
    { path: '/', views: 1820, share: 0.377 },
    { path: '/garden-room', views: 980, share: 0.203 },
    { path: '/house-extension', views: 720, share: 0.149 },
    { path: '/about', views: 540, share: 0.112 },
    { path: '/contact', views: 410, share: 0.085 },
  ],
  sources: [
    { group: 'search', sessions: 840, share: 0.4 },
    { group: 'direct', sessions: 630, share: 0.3 },
    { group: 'social', sessions: 315, share: 0.15 },
    { group: 'referral', sessions: 210, share: 0.1 },
    { group: 'campaign', sessions: 105, share: 0.05 },
  ],
};

// ---------------------------------------------------------------------------
// Fixture: Overview — "no prior data" (Q5 variant 2: previous = null)
// ---------------------------------------------------------------------------

/**
 * Overview fixture where every KPI has `previous: null` and
 * `deltaPercent: null` — the "no prior data" case (Q5 variant 2). This occurs
 * when the comparison window ends before the first stored event. Widgets
 * render "no prior data" instead of a delta badge.
 */
export const overviewNoPriorData: OverviewResponse = {
  range: {
    from: '2026-07-01',
    to: '2026-07-15',
    bucket: 'day',
  },
  kpis: {
    pageViews: { current: 1200, previous: null, deltaPercent: null },
    uniqueVisitors: { current: 480, previous: null, deltaPercent: null },
    sessions: { current: 540, previous: null, deltaPercent: null },
    returningVisitorRate: { current: 0.25, previous: null, deltaPercent: null },
    pagesPerSession: { current: 2.22, previous: null, deltaPercent: null },
  },
  timeseries: [
    { bucketStart: '2026-07-01T00:00:00.000Z', pageViews: 80, sessions: 36 },
    { bucketStart: '2026-07-02T00:00:00.000Z', pageViews: 92, sessions: 41 },
    { bucketStart: '2026-07-03T00:00:00.000Z', pageViews: 75, sessions: 34 },
  ],
  topPages: [
    { path: '/', views: 450, share: 0.375 },
    { path: '/garden-room', views: 280, share: 0.233 },
    { path: '/about', views: 180, share: 0.15 },
  ],
  sources: [
    { group: 'direct', sessions: 220, share: 0.407 },
    { group: 'search', sessions: 180, share: 0.333 },
    { group: 'social', sessions: 80, share: 0.148 },
    { group: 'referral', sessions: 40, share: 0.074 },
    { group: 'campaign', sessions: 20, share: 0.037 },
  ],
};

// ---------------------------------------------------------------------------
// Fixture: Overview — zero previous (Q5 variant 3: previous = 0, deltaPercent = null)
// ---------------------------------------------------------------------------

/**
 * Overview fixture where every KPI has `previous: 0` and `deltaPercent: null`
 * — the measured-but-zero prior case (Q5 variant 3). The prior period was
 * within the stored-event range but recorded zero events; the delta is not
 * computable and renders as "—".
 */
export const overviewZeroPrevious: OverviewResponse = {
  range: {
    from: '2026-07-10',
    to: '2026-07-15',
    bucket: 'day',
  },
  kpis: {
    pageViews: { current: 320, previous: 0, deltaPercent: null },
    uniqueVisitors: { current: 140, previous: 0, deltaPercent: null },
    sessions: { current: 160, previous: 0, deltaPercent: null },
    returningVisitorRate: { current: 0.3, previous: 0, deltaPercent: null },
    pagesPerSession: { current: 2.0, previous: 0, deltaPercent: null },
  },
  timeseries: [
    { bucketStart: '2026-07-10T00:00:00.000Z', pageViews: 55, sessions: 28 },
    { bucketStart: '2026-07-11T00:00:00.000Z', pageViews: 62, sessions: 31 },
    { bucketStart: '2026-07-12T00:00:00.000Z', pageViews: 48, sessions: 24 },
  ],
  topPages: [
    { path: '/', views: 120, share: 0.375 },
    { path: '/garden-room', views: 90, share: 0.281 },
    { path: '/contact', views: 60, share: 0.188 },
  ],
  sources: [
    { group: 'direct', sessions: 70, share: 0.438 },
    { group: 'search', sessions: 50, share: 0.313 },
    { group: 'social', sessions: 25, share: 0.156 },
    { group: 'campaign', sessions: 10, share: 0.063 },
    { group: 'referral', sessions: 5, share: 0.031 },
  ],
};

// ---------------------------------------------------------------------------
// Fixture: Overview — empty state (all zeros, empty arrays)
// ---------------------------------------------------------------------------

/**
 * Overview fixture for the empty-state case (US3-9 / E-EMPTY). Every KPI has
 * zero current values; timeseries, topPages, and sources are empty or
 * zero-valued. The five source groups are always present with zero sessions
 * (Q6 — zero-valued groups shown).
 */
export const overviewEmpty: OverviewResponse = {
  range: {
    from: '2026-07-15',
    to: '2026-07-15',
    bucket: 'day',
  },
  kpis: {
    pageViews: { current: 0, previous: null, deltaPercent: null },
    uniqueVisitors: { current: 0, previous: null, deltaPercent: null },
    sessions: { current: 0, previous: null, deltaPercent: null },
    returningVisitorRate: { current: 0, previous: null, deltaPercent: null },
    pagesPerSession: { current: 0, previous: null, deltaPercent: null },
  },
  timeseries: [],
  topPages: [],
  sources: emptySources(),
};

// ---------------------------------------------------------------------------
// Fixture: Overview — hour buckets (span <= 2 days, Q4)
// ---------------------------------------------------------------------------

/**
 * Overview fixture with hour-bucket timeseries (Q4: hour when span <= 2 days).
 * Uses a 24-hour span with `bucket: 'hour'` and ISO-8601 datetime `from`/`to`
 * (Q1: sub-day ranges use UTC datetime form). KPIs have numeric deltas.
 */
export const overviewHourly: OverviewResponse = {
  range: {
    from: '2026-07-14T12:00:00.000Z',
    to: '2026-07-15T12:00:00.000Z',
    bucket: 'hour',
  },
  kpis: {
    pageViews: { current: 180, previous: 150, deltaPercent: 20.0 },
    uniqueVisitors: { current: 95, previous: 80, deltaPercent: 18.75 },
    sessions: { current: 110, previous: 90, deltaPercent: 22.2 },
    returningVisitorRate: { current: 0.28, previous: 0.25, deltaPercent: 12.0 },
    pagesPerSession: { current: 1.64, previous: 1.67, deltaPercent: -1.8 },
  },
  timeseries: [
    { bucketStart: '2026-07-14T12:00:00.000Z', pageViews: 12, sessions: 7 },
    { bucketStart: '2026-07-14T13:00:00.000Z', pageViews: 15, sessions: 9 },
    { bucketStart: '2026-07-14T14:00:00.000Z', pageViews: 10, sessions: 6 },
    { bucketStart: '2026-07-14T15:00:00.000Z', pageViews: 18, sessions: 11 },
    { bucketStart: '2026-07-14T16:00:00.000Z', pageViews: 22, sessions: 13 },
    { bucketStart: '2026-07-14T17:00:00.000Z', pageViews: 8, sessions: 5 },
  ],
  topPages: [
    { path: '/', views: 70, share: 0.389 },
    { path: '/garden-room', views: 45, share: 0.25 },
    { path: '/about', views: 35, share: 0.194 },
    { path: '/contact', views: 20, share: 0.111 },
    { path: '/house-extension', views: 10, share: 0.056 },
  ],
  sources: [
    { group: 'search', sessions: 45, share: 0.409 },
    { group: 'direct', sessions: 35, share: 0.318 },
    { group: 'social', sessions: 15, share: 0.136 },
    { group: 'referral', sessions: 10, share: 0.091 },
    { group: 'campaign', sessions: 5, share: 0.045 },
  ],
};

// ---------------------------------------------------------------------------
// Fixture: Realtime — populated (V5)
// ---------------------------------------------------------------------------

/**
 * Realtime fixture with active visitors and top-5 active pages (V5).
 * `windowMinutes` is always 5 (contract RealtimeResponse.windowMinutes enum: [5]).
 */
export const realtimePopulated: RealtimeResponse = {
  activeVisitors: 7,
  topActivePages: [
    { path: '/', activeVisitors: 3 },
    { path: '/garden-room', activeVisitors: 2 },
    { path: '/about', activeVisitors: 1 },
    { path: '/contact', activeVisitors: 1 },
  ],
  windowMinutes: 5,
};

// ---------------------------------------------------------------------------
// Fixture: Realtime — empty state (zero visitors, no pages)
// ---------------------------------------------------------------------------

/**
 * Realtime fixture for the zero-visitor empty state (E-EMPTY).
 * No active visitors, no active pages; `windowMinutes` stays 5.
 */
export const realtimeEmpty: RealtimeResponse = {
  activeVisitors: 0,
  topActivePages: [],
  windowMinutes: 5,
};
