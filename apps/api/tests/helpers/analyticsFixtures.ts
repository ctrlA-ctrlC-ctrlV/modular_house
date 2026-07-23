/**
 * Analytics fixture builders and injected-clock utilities for Phase 2 test suites.
 *
 * Provides deterministic, clock-driven helpers that insert `AnalyticsEvent` and
 * `AnalyticsVisitor` rows and produce `mh_vid` / `mh_sid` cookie headers for
 * supertest requests. Every timestamp originates from an injected clock — never
 * `Date.now()` — so session windows, realtime boundaries, range math, and the
 * E-TZ DST case are fully reproducible (constitution III, plan §4 preamble).
 *
 * Two reset helpers exist: `resetAnalyticsTables` (true blanket wipe — also
 * destroys the shared `db:seed` fixtures) and `resetAnalyticsTablesExceptSeed`
 * (same clean-slate guarantee, but spares rows keyed on `FIXED_VISITOR_IDS`).
 * Any suite whose own tests use only fresh `randomUUID()` ids — i.e. never
 * `FIXED_VISITOR_IDS`/`FIXED_SESSION_IDS` — MUST use the latter if it runs in
 * the same process as suites depending on the seed persisting (see each
 * function's docstring for the cross-file race this avoids).
 *
 * Usage:
 *   import { createAnalyticsClock, insertAnalyticsEvent, analyticsCookieHeader, … } from '../helpers/analyticsFixtures.js';
 *
 *   const clock = createAnalyticsClock();
 *   const visitorId = FIXED_VISITOR_IDS.visitorA;
 *   const sessionId = FIXED_SESSION_IDS.sessionA;
 *
 *   await upsertAnalyticsVisitor(prisma, { visitorId, firstSeenAt: clock.now() });
 *   await insertAnalyticsEvent(prisma, { occurredAt: clock.now(), path: '/', visitorId, sessionId });
 *
 *   const res = await agent
 *     .post('/api/analytics/events')
 *     .set('Cookie', analyticsCookieHeader(visitorId, sessionId))
 *     .send({ path: '/' });
 */

import { Prisma, type AnalyticsSourceGroup } from '@prisma/client';
import { createClock, type AdvanceableClock } from './clock.js';

/**
 * Accepts either a top-level `PrismaClient` or an interactive-transaction
 * client (`prisma.$transaction(async (tx) => ...)`). `PrismaClient` is
 * structurally assignable to `Prisma.TransactionClient` (a strict subset of
 * its surface, omitting `$connect`/`$disconnect`/`$transaction`/`$extends`),
 * so every existing call site keeps working unchanged; the widening only
 * unlocks callers that need transactional isolation (review-fix: see
 * `analyticsFixtures.test.ts`'s `resetAnalyticsTables` proof, which runs
 * inside a rolled-back transaction so its blanket wipe never becomes visible
 * to concurrent connections from other test files).
 */
type AnalyticsPrismaClient = Prisma.TransactionClient;

// ---------------------------------------------------------------------------
// Fixed "now" — the deterministic epoch all analytics suites share
// ---------------------------------------------------------------------------
// A midday UTC timestamp in July 2026 (BST / UTC+1). This gives suites a
// stable "today" in Europe/London (2026-07-15) and a DST-active period so
// the E-TZ 23:30/00:30 boundary case can be constructed by advancing the
// clock a few hours rather than jumping months.
export const ANALYTICS_FIXED_NOW = new Date('2026-07-15T12:00:00.000Z');

// ---------------------------------------------------------------------------
// Deterministic UUIDs — reproducible visitor/session identifiers
// ---------------------------------------------------------------------------
// Hardcoded v4 UUIDs so test assertions can compare exact values without
// generating random IDs at runtime. The UUIDs follow a recognisable pattern
// (hex digit repeated per group) for easy visual identification in debug
// output. Tests that need a fresh ID should use `crypto.randomUUID()` at
// call sites, not inside these helpers.
export const FIXED_VISITOR_IDS = {
  visitorA: 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1',
  visitorB: 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2',
  visitorC: 'c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3',
  visitorD: 'd4d4d4d4-d4d4-4d4d-8d4d-d4d4d4d4d4d4',
  visitorE: 'e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5',
} as const;

export const FIXED_SESSION_IDS = {
  sessionA: '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a1a',
  sessionB: '2b2b2b2b-2b2b-42b2-82b2-2b2b2b2b2b2b',
  sessionC: '3c3c3c3c-3c3c-43c3-83c3-3c3c3c3c3c3c',
  sessionD: '4d4d4d4d-4d4d-44d4-84d4-4d4d4d4d4d4d',
  sessionE: '5e5e5e5e-5e5e-45e5-85e5-5e5e5e5e5e5e',
} as const;

// ---------------------------------------------------------------------------
// Clock factory — wraps the Phase 1 `createClock` with the analytics fixed now
// ---------------------------------------------------------------------------

/**
 * Create an advanceable clock starting at `ANALYTICS_FIXED_NOW` (or a custom
 * `initial`). Analytics suites pass `clock.now` into service calls and
 * `advance(ms)` to cross session / realtime / range boundaries deterministically.
 */
export function createAnalyticsClock(initial?: Date): AdvanceableClock {
  return createClock(initial ?? ANALYTICS_FIXED_NOW);
}

// ---------------------------------------------------------------------------
// Cookie header builder — formats mh_vid + mh_sid for supertest's `Cookie` header
// ---------------------------------------------------------------------------

/**
 * Build a `Cookie` header string carrying `mh_vid` and `mh_sid`, suitable for
 * `.set('Cookie', analyticsCookieHeader(visitorId, sessionId))` in supertest.
 * Cookie names match plan §2.1 K1 (`mh_vid`, `mh_sid`).
 */
export function analyticsCookieHeader(visitorId: string, sessionId: string): string {
  return `mh_vid=${visitorId}; mh_sid=${sessionId}`;
}

// ---------------------------------------------------------------------------
// Row builders — insert AnalyticsEvent / AnalyticsVisitor with injected timestamps
// ---------------------------------------------------------------------------

/** Options for {@link insertAnalyticsEvent}. `occurredAt` is required (server clock). */
export interface InsertAnalyticsEventOptions {
  /** Server-clock time the event was received — never client time (data-model §2). */
  occurredAt: Date;
  /** Public page path, starts with "/", max 512 chars (M2). Defaults to "/". */
  path?: string;
  /** Anonymous visitor identifier (mh_vid cookie value or one-off UUID). */
  visitorId: string;
  /** Anonymous session identifier (mh_sid cookie value or one-off UUID). */
  sessionId: string;
  /** Source classification computed at ingest (S1–S3). Defaults to DIRECT. */
  sourceGroup?: AnalyticsSourceGroup;
  /** Referrer hostname only — never a full URL (S5). */
  referrerHost?: string;
  /** Standard campaign tags, max 100 chars each (M2). */
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/**
 * Insert a single `AnalyticsEvent` row with the given options.
 * Returns the persisted row so tests can assert on stored values.
 * No field defaults to `Date.now()` — `occurredAt` is always caller-supplied.
 */
export async function insertAnalyticsEvent(
  prisma: AnalyticsPrismaClient,
  options: InsertAnalyticsEventOptions,
) {
  return prisma.analyticsEvent.create({
    data: {
      occurredAt: options.occurredAt,
      path: options.path ?? '/',
      visitorId: options.visitorId,
      sessionId: options.sessionId,
      sourceGroup: options.sourceGroup ?? 'DIRECT',
      referrerHost: options.referrerHost,
      utmSource: options.utmSource,
      utmMedium: options.utmMedium,
      utmCampaign: options.utmCampaign,
    },
  });
}

/** Options for {@link upsertAnalyticsVisitor}. */
export interface UpsertAnalyticsVisitorOptions {
  /** Same value as the mh_vid cookie (or one-off UUID for cookieless events). */
  visitorId: string;
  /** Authoritative first-seen timestamp — never updated after insert (V3). */
  firstSeenAt: Date;
  /** Updated on every ingest; defaults to `firstSeenAt` when omitted. */
  lastSeenAt?: Date;
}

/**
 * Upsert an `AnalyticsVisitor` row: insert `{firstSeenAt, lastSeenAt}` on a
 * new visitor id, update only `lastSeenAt` on conflict — mirroring the ingest
 * write pattern (data-model §3, E-CONCURRENCY). Returns the persisted row.
 */
export async function upsertAnalyticsVisitor(
  prisma: AnalyticsPrismaClient,
  options: UpsertAnalyticsVisitorOptions,
) {
  return prisma.analyticsVisitor.upsert({
    where: { visitorId: options.visitorId },
    update: { lastSeenAt: options.lastSeenAt ?? options.firstSeenAt },
    create: {
      visitorId: options.visitorId,
      firstSeenAt: options.firstSeenAt,
      lastSeenAt: options.lastSeenAt ?? options.firstSeenAt,
    },
  });
}

// ---------------------------------------------------------------------------
// Reset helper — clean analytics tables between tests
// ---------------------------------------------------------------------------

/**
 * Delete all rows from `analytics_events` and `analytics_visitors`.
 * Call in `beforeEach` / `afterEach` to start each analytics test with a
 * clean slate. Order matters: events are deleted before visitors (though
 * there is no FK between them, this keeps the pattern consistent).
 *
 * WARNING: this is a true blanket wipe — it also destroys the shared
 * `db:seed` analytics fixtures (`prisma/seed.ts`, keyed on `FIXED_VISITOR_IDS`
 * below) that `analytics-overview.test.ts` / `analytics-realtime.test.ts`
 * assume persist for the whole test run. Suites that do not themselves
 * depend on those fixtures but run in the same process MUST use
 * {@link resetAnalyticsTablesExceptSeed} instead, or they silently wipe the
 * seed for whichever dependent file happens to run afterward (a real,
 * previously observed cross-file race). Reserve this blanket function for
 * suites that genuinely need (and prove) full-table-empty semantics — and
 * even then, call it inside a `prisma.$transaction(async (tx) => ...)` that
 * always rolls back (never resolves normally), passing `tx` here instead of
 * the top-level client, so the wipe never commits and is therefore never
 * visible to concurrent connections from other test files (review-fix: a
 * genuinely observed instance of exactly that visibility window trampling
 * unrelated suites' rows under `test:coverage`'s heavier scheduling).
 */
export async function resetAnalyticsTables(prisma: AnalyticsPrismaClient): Promise<void> {
  await prisma.analyticsEvent.deleteMany();
  await prisma.analyticsVisitor.deleteMany();
}

/**
 * Delete all rows from `analytics_events` and `analytics_visitors` EXCEPT
 * those belonging to the shared `db:seed` analytics fixtures — identified by
 * `FIXED_VISITOR_IDS`, the same ids `prisma/seed.ts` inserts (its own comment
 * documents that the two files share these values on purpose). Use this in
 * any suite whose own tests never touch `FIXED_VISITOR_IDS` themselves (they
 * mint fresh `crypto.randomUUID()` ids instead): it gives that suite the same
 * "clean slate before/after every test" guarantee as {@link resetAnalyticsTables}
 * for its own rows, without destroying the seed other suites in the same
 * test run depend on.
 */
export async function resetAnalyticsTablesExceptSeed(prisma: AnalyticsPrismaClient): Promise<void> {
  const seedVisitorIds = Object.values(FIXED_VISITOR_IDS);
  await prisma.analyticsEvent.deleteMany({ where: { visitorId: { notIn: seedVisitorIds } } });
  await prisma.analyticsVisitor.deleteMany({ where: { visitorId: { notIn: seedVisitorIds } } });
}
