/**
 * Analytics fixture builders and injected-clock utilities for Phase 2 test suites.
 *
 * Provides deterministic, clock-driven helpers that insert `AnalyticsEvent` and
 * `AnalyticsVisitor` rows and produce `mh_vid` / `mh_sid` cookie headers for
 * supertest requests. Every timestamp originates from an injected clock — never
 * `Date.now()` — so session windows, realtime boundaries, range math, and the
 * E-TZ DST case are fully reproducible (constitution III, plan §4 preamble).
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

import { PrismaClient, type AnalyticsSourceGroup } from '@prisma/client';
import { createClock, type AdvanceableClock } from './clock.js';

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
  prisma: PrismaClient,
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
  prisma: PrismaClient,
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
 */
export async function resetAnalyticsTables(prisma: PrismaClient): Promise<void> {
  await prisma.analyticsEvent.deleteMany();
  await prisma.analyticsVisitor.deleteMany();
}
