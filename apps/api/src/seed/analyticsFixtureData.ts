// ============================================================================
// Shared analytics fixture data (deterministic visitors + events, DoD-8).
// ============================================================================
// Single source of truth for the analytics rows consumed by BOTH the
// production seed (`prisma/seed.ts`, run via `pnpm db:seed`, test databases
// only) and any test suite that needs to restore this exact state after a
// full-table wipe (e.g. `analyticsFixtures.test.ts`'s proof that
// `resetAnalyticsTables` empties both tables, which necessarily destroys
// these rows as a side effect). Keeping the data and the insertion logic
// here — rather than duplicated in `prisma/seed.ts` and any test that needs
// to re-seed — means the two paths can never drift, mirroring the existing
// `seedData.ts` pattern for RBAC roles/permissions.
//
// The fixtures span three Europe/London calendar days (2026-07-13, 14, 15),
// cover all five source groups (one session per group — S4), and include
// both new visitors (B, D — firstSeenAt today) and returning visitors (A, C,
// E — firstSeenAt on an earlier London day). Visitor/session UUIDs match
// `FIXED_VISITOR_IDS`/`FIXED_SESSION_IDS` in `tests/helpers/analyticsFixtures.ts`
// so test assertions can reference the same identifiers. Timestamps are UTC
// and fall safely midday in London (BST / UTC+1 during July 2026) so each
// event's London calendar day is unambiguous. The fixed "today" for these
// fixtures is 2026-07-15 (London).
// ============================================================================

import { type PrismaClient, type AnalyticsSourceGroup } from '@prisma/client';

/** Analytics visitor fixture — one row per visitor id (data-model §3). */
export interface AnalyticsVisitorFixture {
  visitorId: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

/** Analytics event fixture — one row per stored page view (data-model §2). */
export interface AnalyticsEventFixture {
  occurredAt: Date;
  path: string;
  visitorId: string;
  sessionId: string;
  sourceGroup: AnalyticsSourceGroup;
  referrerHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// Five visitors: A/C/E are "returning" relative to today (firstSeenAt on an
// earlier London day than their first event today); B/D are "new" (firstSeenAt
// today). Visitor E's firstSeenAt (2026-07-12) predates the 3-day range start
// so E counts as returning even in a 2026-07-13..15 range.
export const ANALYTICS_FIXTURE_VISITORS: ReadonlyArray<AnalyticsVisitorFixture> = [
  { visitorId: 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', firstSeenAt: new Date('2026-07-13T11:00:00.000Z'), lastSeenAt: new Date('2026-07-15T11:00:00.000Z') },
  { visitorId: 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2', firstSeenAt: new Date('2026-07-15T11:00:00.000Z'), lastSeenAt: new Date('2026-07-15T11:20:00.000Z') },
  { visitorId: 'c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3', firstSeenAt: new Date('2026-07-14T11:00:00.000Z'), lastSeenAt: new Date('2026-07-15T11:40:00.000Z') },
  { visitorId: 'd4d4d4d4-d4d4-4d4d-8d4d-d4d4d4d4d4d4', firstSeenAt: new Date('2026-07-15T11:30:00.000Z'), lastSeenAt: new Date('2026-07-15T11:30:00.000Z') },
  { visitorId: 'e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5', firstSeenAt: new Date('2026-07-12T11:00:00.000Z'), lastSeenAt: new Date('2026-07-14T11:30:00.000Z') },
];

// Twelve events across three London calendar days (2026-07-13, 14, 15).
// Each session's FIRST event defines the session's source group (S4); the
// five sessions cover all five source groups exactly once.
export const ANALYTICS_FIXTURE_EVENTS: ReadonlyArray<AnalyticsEventFixture> = [
  // --- 2026-07-13 (London) ---
  // Session A — first event: SEARCH (session source = SEARCH per S4)
  { occurredAt: new Date('2026-07-13T11:00:00.000Z'), path: '/',             visitorId: 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', sessionId: '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a1a', sourceGroup: 'SEARCH',   referrerHost: 'www.google.com' },
  { occurredAt: new Date('2026-07-13T11:05:00.000Z'), path: '/garden-room',  visitorId: 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', sessionId: '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a1a', sourceGroup: 'SEARCH' },
  // Session E — first event: SOCIAL
  { occurredAt: new Date('2026-07-13T12:00:00.000Z'), path: '/',             visitorId: 'e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5', sessionId: '5e5e5e5e-5e5e-45e5-85e5-5e5e5e5e5e5e', sourceGroup: 'SOCIAL',   referrerHost: 'www.facebook.com' },

  // --- 2026-07-14 (London) ---
  // Session C — first event: DIRECT
  { occurredAt: new Date('2026-07-14T11:00:00.000Z'), path: '/',                 visitorId: 'c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3', sessionId: '3c3c3c3c-3c3c-43c3-83c3-3c3c3c3c3c3c', sourceGroup: 'DIRECT' },
  { occurredAt: new Date('2026-07-14T11:30:00.000Z'), path: '/house-extension',  visitorId: 'c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3', sessionId: '3c3c3c3c-3c3c-43c3-83c3-3c3c3c3c3c3c', sourceGroup: 'DIRECT' },
  // Session E continues (second event — source stays SOCIAL per S4)
  { occurredAt: new Date('2026-07-14T11:30:00.000Z'), path: '/garden-room',      visitorId: 'e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5', sessionId: '5e5e5e5e-5e5e-45e5-85e5-5e5e5e5e5e5e', sourceGroup: 'SOCIAL' },
  // Session A continues on day 2 (source stays SEARCH per S4)
  { occurredAt: new Date('2026-07-14T12:00:00.000Z'), path: '/about',            visitorId: 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', sessionId: '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a1a', sourceGroup: 'SEARCH' },

  // --- 2026-07-15 (London, "today") ---
  // Session A continues on day 3
  { occurredAt: new Date('2026-07-15T11:00:00.000Z'), path: '/',             visitorId: 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', sessionId: '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a1a', sourceGroup: 'SEARCH' },
  // Session B — first event: CAMPAIGN (utm-tagged)
  { occurredAt: new Date('2026-07-15T11:10:00.000Z'), path: '/about',       visitorId: 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2', sessionId: '2b2b2b2b-2b2b-42b2-82b2-2b2b2b2b2b2b', sourceGroup: 'CAMPAIGN', utmSource: 'newsletter', utmMedium: 'email', utmCampaign: 'summer2026' },
  { occurredAt: new Date('2026-07-15T11:20:00.000Z'), path: '/garden-room', visitorId: 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2', sessionId: '2b2b2b2b-2b2b-42b2-82b2-2b2b2b2b2b2b', sourceGroup: 'CAMPAIGN' },
  // Session D — first event: REFERRAL
  { occurredAt: new Date('2026-07-15T11:30:00.000Z'), path: '/',             visitorId: 'd4d4d4d4-d4d4-4d4d-8d4d-d4d4d4d4d4d4', sessionId: '4d4d4d4d-4d4d-44d4-84d4-4d4d4d4d4d4d', sourceGroup: 'REFERRAL', referrerHost: 'www.linkedin.com' },
  // Session C continues on day 3
  { occurredAt: new Date('2026-07-15T11:40:00.000Z'), path: '/contact',      visitorId: 'c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3', sessionId: '3c3c3c3c-3c3c-43c3-83c3-3c3c3c3c3c3c', sourceGroup: 'DIRECT' },
];

/**
 * Delete all existing analytics rows, then re-insert the deterministic
 * fixture set above. Idempotent — safe to call repeatedly (`db:seed` re-runs,
 * or a test restoring state after a full-table wipe) and always converges
 * on the same 5-visitor/12-event state. Events have auto-increment ids and
 * cannot be upserted, so a full reset before re-inserting is simplest.
 */
export async function seedAnalyticsFixtures(prisma: PrismaClient): Promise<void> {
  await prisma.analyticsEvent.deleteMany();
  await prisma.analyticsVisitor.deleteMany();

  for (const v of ANALYTICS_FIXTURE_VISITORS) {
    await prisma.analyticsVisitor.create({
      data: {
        visitorId: v.visitorId,
        firstSeenAt: v.firstSeenAt,
        lastSeenAt: v.lastSeenAt,
      },
    });
  }

  for (const e of ANALYTICS_FIXTURE_EVENTS) {
    await prisma.analyticsEvent.create({
      data: {
        occurredAt: e.occurredAt,
        path: e.path,
        visitorId: e.visitorId,
        sessionId: e.sessionId,
        sourceGroup: e.sourceGroup,
        referrerHost: e.referrerHost,
        utmSource: e.utmSource,
        utmMedium: e.utmMedium,
        utmCampaign: e.utmCampaign,
      },
    });
  }
}
