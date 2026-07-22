/**
 * T058 — analyticsQuery service unit tests (T-B5/T-B6 basis).
 *
 * Exercises `analyticsQuery.ts` directly against the real test database (no
 * HTTP layer — the route wiring is Pass 2 later work, T066/T067). Every test
 * resets the two analytics tables to a known-empty state (`resetAnalyticsTables`)
 * and inserts its own fixture rows via the T005 helpers
 * (`insertAnalyticsEvent` / `upsertAnalyticsVisitor`), so this suite never
 * depends on the shared `db:seed` fixtures (T006) or on file execution order —
 * `analyticsFixtures.test.ts` (T005's own round-trip suite) already wipes both
 * tables in its own `afterAll`, so any test relying on the seed surviving past
 * that file would be order-dependent by accident, not by design.
 *
 * Every timestamp is a fixed, hand-computed UTC instant (never `Date.now()`,
 * constitution III) chosen so its Europe/London calendar date/hour is
 * unambiguous. August 2026 is used throughout (BST, UTC+1, no DST transition
 * in-month) so the arithmetic below stays simple; the DST boundary case
 * (E-TZ) is deliberately out of scope here — hardened in Pass 3.
 *
 * Covers (plan §2.5 V-series, §2.6 Q-series, §2.4 S4):
 *   - Q4: day buckets (span > 2 days) with zero-filled gaps.
 *   - Q4: hour buckets (span <= 2 days) with zero-filled gaps.
 *   - V2/V3/V4: unique visitors, returning-visitor rate, pages-per-session.
 *   - Q5: delta variants — normal, "no prior data" (previous null), and
 *     not-computable (previous = 0, deltaPercent null).
 *   - Q6: top-10 pages ranked by views with share; 11th+ page excluded.
 *   - S4/Q6: five-group source breakdown, zero-valued groups included,
 *     attributed by each session's FIRST stored event.
 *   - V5: realtime trailing-5-minute window, top-5 active pages.
 *
 * Done when: suite fails only because `analyticsQuery.ts` does not exist.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import {
  insertAnalyticsEvent,
  upsertAnalyticsVisitor,
  resetAnalyticsTables,
} from '../helpers/analyticsFixtures.js';
import { getOverview, getRealtime, type DateRange } from '../../src/services/analyticsQuery.js';

const prisma = new PrismaClient();

/**
 * Index into an array with a defined-ness assertion instead of a non-null
 * assertion, so a genuinely missing element fails with a clear expectation
 * error rather than a silent `undefined` access.
 */
function nth<T>(items: readonly T[], index: number): T {
  const item = items[index];
  expect(item).toBeDefined();
  return item as T;
}

/** A far-future placeholder previous window with no data, for tests that only care about the current window. */
const NO_OP_PREVIOUS: DateRange = {
  from: new Date('2000-01-01T00:00:00.000Z'),
  to: new Date('2000-01-02T00:00:00.000Z'),
};

beforeEach(async () => {
  await resetAnalyticsTables(prisma);
});

afterAll(async () => {
  await resetAnalyticsTables(prisma);
  await prisma.$disconnect();
});

describe('analyticsQuery (T058)', () => {
  // ---------------------------------------------------------------------------
  // Q4 — day buckets (span > 2 days), zero-filled gaps
  // ---------------------------------------------------------------------------
  describe('Q4: day buckets with zero-filled gaps', () => {
    it('buckets a 3-day range by day, zero-filling a day with no events', async () => {
      // London midnight 2026-08-01 (BST, UTC+1) .. exclusive London midnight
      // 2026-08-04 -> three day buckets: Aug 1, Aug 2 (empty), Aug 3.
      const current: DateRange = {
        from: new Date('2026-07-31T23:00:00.000Z'),
        to: new Date('2026-08-03T23:00:00.000Z'),
      };

      const visitorId = randomUUID();
      await upsertAnalyticsVisitor(prisma, { visitorId, firstSeenAt: current.from });

      // Aug 1 (London): 2 events, 1 session.
      const sessionAug1 = randomUUID();
      await insertAnalyticsEvent(prisma, {
        occurredAt: new Date('2026-08-01T11:00:00.000Z'),
        path: '/a', visitorId, sessionId: sessionAug1,
      });
      await insertAnalyticsEvent(prisma, {
        occurredAt: new Date('2026-08-01T12:00:00.000Z'),
        path: '/b', visitorId, sessionId: sessionAug1,
      });

      // Aug 2 (London): deliberately no events — the zero-filled gap.

      // Aug 3 (London): 3 events across 2 sessions.
      const sessionAug3a = randomUUID();
      const sessionAug3b = randomUUID();
      await insertAnalyticsEvent(prisma, {
        occurredAt: new Date('2026-08-03T09:00:00.000Z'),
        path: '/c', visitorId, sessionId: sessionAug3a,
      });
      await insertAnalyticsEvent(prisma, {
        occurredAt: new Date('2026-08-03T10:00:00.000Z'),
        path: '/d', visitorId, sessionId: sessionAug3a,
      });
      await insertAnalyticsEvent(prisma, {
        occurredAt: new Date('2026-08-03T11:00:00.000Z'),
        path: '/e', visitorId, sessionId: sessionAug3b,
      });

      const result = await getOverview(prisma, { current, previous: NO_OP_PREVIOUS });

      expect(result.bucket).toBe('day');
      expect(result.timeseries).toHaveLength(3);
      expect(result.timeseries[0]).toMatchObject({ pageViews: 2, sessions: 1 });
      expect(result.timeseries[1]).toMatchObject({ pageViews: 0, sessions: 0 });
      expect(result.timeseries[2]).toMatchObject({ pageViews: 3, sessions: 2 });

      // Bucket boundaries are London midnights, one calendar day apart.
      expect(nth(result.timeseries, 0).bucketStart.toISOString()).toBe('2026-07-31T23:00:00.000Z');
      expect(nth(result.timeseries, 1).bucketStart.toISOString()).toBe('2026-08-01T23:00:00.000Z');
      expect(nth(result.timeseries, 2).bucketStart.toISOString()).toBe('2026-08-02T23:00:00.000Z');
    });
  });

  // ---------------------------------------------------------------------------
  // Q4 — hour buckets (span <= 2 days), zero-filled gaps
  // ---------------------------------------------------------------------------
  describe('Q4: hour buckets for a <= 2-day span', () => {
    it('buckets a 3-hour range by hour, zero-filling an hour with no events', async () => {
      const current: DateRange = {
        from: new Date('2026-08-01T10:00:00.000Z'),
        to: new Date('2026-08-01T13:00:00.000Z'),
      };
      const visitorId = randomUUID();
      await upsertAnalyticsVisitor(prisma, { visitorId, firstSeenAt: current.from });

      const session1 = randomUUID();
      await insertAnalyticsEvent(prisma, {
        occurredAt: new Date('2026-08-01T10:10:00.000Z'), path: '/x', visitorId, sessionId: session1,
      });
      await insertAnalyticsEvent(prisma, {
        occurredAt: new Date('2026-08-01T10:40:00.000Z'), path: '/y', visitorId, sessionId: session1,
      });
      // 11:00-12:00 bucket: deliberately empty.
      const session2 = randomUUID();
      await insertAnalyticsEvent(prisma, {
        occurredAt: new Date('2026-08-01T12:30:00.000Z'), path: '/z', visitorId, sessionId: session2,
      });

      const result = await getOverview(prisma, { current, previous: NO_OP_PREVIOUS });

      expect(result.bucket).toBe('hour');
      expect(result.timeseries).toHaveLength(3);
      expect(result.timeseries[0]).toMatchObject({ pageViews: 2, sessions: 1 });
      expect(result.timeseries[1]).toMatchObject({ pageViews: 0, sessions: 0 });
      expect(result.timeseries[2]).toMatchObject({ pageViews: 1, sessions: 1 });
      expect(nth(result.timeseries, 0).bucketStart.toISOString()).toBe('2026-08-01T10:00:00.000Z');
      expect(nth(result.timeseries, 1).bucketStart.toISOString()).toBe('2026-08-01T11:00:00.000Z');
      expect(nth(result.timeseries, 2).bucketStart.toISOString()).toBe('2026-08-01T12:00:00.000Z');
    });
  });

  // ---------------------------------------------------------------------------
  // V2 / V3 / V4 — KPI math
  // ---------------------------------------------------------------------------
  describe('V2/V3/V4: unique visitors, returning-visitor rate, pages per session', () => {
    it('computes exact KPI values from a known fixture set', async () => {
      const current: DateRange = {
        from: new Date('2026-07-31T23:00:00.000Z'), // London midnight Aug 1
        to: new Date('2026-08-01T23:00:00.000Z'),   // London midnight Aug 2 (exclusive)
      };

      // Visitor X: firstSeenAt well before the range -> returning (V3).
      const visitorX = randomUUID();
      await upsertAnalyticsVisitor(prisma, { visitorId: visitorX, firstSeenAt: new Date('2026-06-01T11:00:00.000Z') });
      const sessionX = randomUUID();
      await insertAnalyticsEvent(prisma, { occurredAt: new Date('2026-08-01T09:00:00.000Z'), path: '/', visitorId: visitorX, sessionId: sessionX });
      await insertAnalyticsEvent(prisma, { occurredAt: new Date('2026-08-01T09:05:00.000Z'), path: '/about', visitorId: visitorX, sessionId: sessionX });

      // Visitor Y: firstSeenAt on the SAME London day as their first in-range
      // event -> not returning (V3 requires a strictly earlier day).
      const visitorY = randomUUID();
      await upsertAnalyticsVisitor(prisma, { visitorId: visitorY, firstSeenAt: new Date('2026-08-01T10:00:00.000Z') });
      const sessionY = randomUUID();
      await insertAnalyticsEvent(prisma, { occurredAt: new Date('2026-08-01T10:00:00.000Z'), path: '/contact', visitorId: visitorY, sessionId: sessionY });
      await insertAnalyticsEvent(prisma, { occurredAt: new Date('2026-08-01T10:05:00.000Z'), path: '/gallery', visitorId: visitorY, sessionId: sessionY });

      const result = await getOverview(prisma, { current, previous: NO_OP_PREVIOUS });

      // V2: 2 distinct visitors.
      expect(result.kpis.uniqueVisitors.current).toBe(2);
      // V3: 1 of 2 visitors returning -> 0.5 exactly.
      expect(result.kpis.returningVisitorRate.current).toBeCloseTo(0.5, 10);
      // sessions: 2 distinct sessions.
      expect(result.kpis.sessions.current).toBe(2);
      // pageViews: 4 total events.
      expect(result.kpis.pageViews.current).toBe(4);
      // V4: 4 events / 2 sessions = 2.0 exactly.
      expect(result.kpis.pagesPerSession.current).toBeCloseTo(2, 10);
    });

    it('renders a 0 rate (never NaN) when the range has no visitors', async () => {
      const current: DateRange = {
        from: new Date('2026-07-31T23:00:00.000Z'),
        to: new Date('2026-08-01T23:00:00.000Z'),
      };

      const result = await getOverview(prisma, { current, previous: NO_OP_PREVIOUS });

      expect(result.kpis.uniqueVisitors.current).toBe(0);
      expect(result.kpis.returningVisitorRate.current).toBe(0);
      expect(result.kpis.pagesPerSession.current).toBe(0);
      expect(Number.isNaN(result.kpis.returningVisitorRate.current)).toBe(false);
      expect(Number.isNaN(result.kpis.pagesPerSession.current)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Q5 — comparison-period deltas
  // ---------------------------------------------------------------------------
  describe('Q5: comparison-period deltas', () => {
    it('computes a normal signed delta when both windows have data', async () => {
      const previous: DateRange = {
        from: new Date('2026-07-30T23:00:00.000Z'), // London midnight Jul 31
        to: new Date('2026-07-31T23:00:00.000Z'),   // London midnight Aug 1 (exclusive)
      };
      const current: DateRange = {
        from: new Date('2026-07-31T23:00:00.000Z'),
        to: new Date('2026-08-01T23:00:00.000Z'),
      };

      const visitorId = randomUUID();
      await upsertAnalyticsVisitor(prisma, { visitorId, firstSeenAt: previous.from });

      // Previous window: 2 page views.
      const prevSession = randomUUID();
      await insertAnalyticsEvent(prisma, { occurredAt: new Date('2026-07-31T10:00:00.000Z'), path: '/', visitorId, sessionId: prevSession });
      await insertAnalyticsEvent(prisma, { occurredAt: new Date('2026-07-31T10:05:00.000Z'), path: '/about', visitorId, sessionId: prevSession });

      // Current window: 4 page views -> +100% delta over the previous 2.
      const currSession = randomUUID();
      for (let i = 0; i < 4; i += 1) {
        await insertAnalyticsEvent(prisma, {
          occurredAt: new Date(`2026-08-01T10:0${i}:00.000Z`), path: `/p${i}`, visitorId, sessionId: currSession,
        });
      }

      const result = await getOverview(prisma, { current, previous });

      expect(result.kpis.pageViews.current).toBe(4);
      expect(result.kpis.pageViews.previous).toBe(2);
      expect(result.kpis.pageViews.deltaPercent).toBeCloseTo(100, 10);
    });

    it('renders previous = null ("no prior data") when the comparison window ends before the first stored event', async () => {
      const previous: DateRange = {
        from: new Date('2026-07-30T23:00:00.000Z'),
        to: new Date('2026-07-31T23:00:00.000Z'),
      };
      const current: DateRange = {
        from: new Date('2026-07-31T23:00:00.000Z'),
        to: new Date('2026-08-01T23:00:00.000Z'),
      };

      // The ONLY stored event in the whole table is inside the current
      // window, so the previous window ends before the first-ever event.
      const visitorId = randomUUID();
      await upsertAnalyticsVisitor(prisma, { visitorId, firstSeenAt: current.from });
      await insertAnalyticsEvent(prisma, { occurredAt: new Date('2026-08-01T10:00:00.000Z'), path: '/', visitorId, sessionId: randomUUID() });

      const result = await getOverview(prisma, { current, previous });

      expect(result.kpis.pageViews.current).toBe(1);
      expect(result.kpis.pageViews.previous).toBeNull();
      expect(result.kpis.pageViews.deltaPercent).toBeNull();
    });

    it('renders previous = 0 with a null (not-computable) delta when the window is measured but empty', async () => {
      const previous: DateRange = {
        from: new Date('2026-07-30T23:00:00.000Z'),
        to: new Date('2026-07-31T23:00:00.000Z'),
      };
      const current: DateRange = {
        from: new Date('2026-07-31T23:00:00.000Z'),
        to: new Date('2026-08-01T23:00:00.000Z'),
      };

      const visitorId = randomUUID();
      // Establishes a "first ever event" well before the previous window, so
      // the previous window is measured (not "no prior data") — it is simply
      // empty of events itself.
      await upsertAnalyticsVisitor(prisma, { visitorId, firstSeenAt: new Date('2026-01-01T00:00:00.000Z') });
      await insertAnalyticsEvent(prisma, { occurredAt: new Date('2026-01-01T00:00:00.000Z'), path: '/', visitorId, sessionId: randomUUID() });

      // Current window: 3 page views. Previous window: deliberately empty.
      const currSession = randomUUID();
      for (let i = 0; i < 3; i += 1) {
        await insertAnalyticsEvent(prisma, {
          occurredAt: new Date(`2026-08-01T10:0${i}:00.000Z`), path: `/q${i}`, visitorId, sessionId: currSession,
        });
      }

      const result = await getOverview(prisma, { current, previous });

      expect(result.kpis.pageViews.current).toBe(3);
      expect(result.kpis.pageViews.previous).toBe(0);
      expect(result.kpis.pageViews.deltaPercent).toBeNull();
      expect(Number.isNaN(result.kpis.pageViews.deltaPercent as number)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Q6 — top pages with share
  // ---------------------------------------------------------------------------
  describe('Q6: top-10 pages ranked by views, with share', () => {
    it('caps the list at 10 entries, ranked descending, excluding the 11th+ page', async () => {
      const current: DateRange = {
        from: new Date('2026-07-31T23:00:00.000Z'),
        to: new Date('2026-08-01T23:00:00.000Z'),
      };
      const visitorId = randomUUID();
      await upsertAnalyticsVisitor(prisma, { visitorId, firstSeenAt: current.from });

      // 11 distinct paths with descending view counts: /page0 has 11 views
      // down to /page10 with 1 view (sum 1..11 = 66 total page views).
      let totalViews = 0;
      for (let pageIndex = 0; pageIndex <= 10; pageIndex += 1) {
        const views = 11 - pageIndex;
        totalViews += views;
        for (let v = 0; v < views; v += 1) {
          await insertAnalyticsEvent(prisma, {
            occurredAt: new Date('2026-08-01T10:00:00.000Z'),
            path: `/page${pageIndex}`,
            visitorId,
            sessionId: randomUUID(),
          });
        }
      }

      const result = await getOverview(prisma, { current, previous: NO_OP_PREVIOUS });

      expect(result.topPages).toHaveLength(10);
      expect(result.topPages[0]).toMatchObject({ path: '/page0', views: 11 });
      expect(result.topPages[9]).toMatchObject({ path: '/page9', views: 2 });
      // /page10 (the 11th-ranked, 1-view page) never appears — the cap
      // excludes it entirely, not just truncates duplicate views.
      expect(result.topPages.some((p) => p.path === '/page10')).toBe(false);
      expect(nth(result.topPages, 0).share).toBeCloseTo(11 / totalViews, 10);
    });
  });

  // ---------------------------------------------------------------------------
  // S4 / Q6 — source breakdown
  // ---------------------------------------------------------------------------
  describe('S4/Q6: five-group source breakdown attributed by first stored event', () => {
    it('always returns exactly five groups, zero-valued groups included', async () => {
      const current: DateRange = {
        from: new Date('2026-07-31T23:00:00.000Z'),
        to: new Date('2026-08-01T23:00:00.000Z'),
      };
      const visitorId = randomUUID();
      await upsertAnalyticsVisitor(prisma, { visitorId, firstSeenAt: current.from });

      // Only a single DIRECT session all day — every other group is
      // zero-valued and must still appear.
      await insertAnalyticsEvent(prisma, {
        occurredAt: new Date('2026-08-01T10:00:00.000Z'), path: '/', visitorId, sessionId: randomUUID(), sourceGroup: 'DIRECT',
      });

      const result = await getOverview(prisma, { current, previous: NO_OP_PREVIOUS });

      expect(result.sources).toHaveLength(5);
      const groups = result.sources.map((s) => s.group).sort();
      expect(groups).toEqual(['campaign', 'direct', 'referral', 'search', 'social']);
      const direct = result.sources.find((s) => s.group === 'direct');
      expect(direct).toMatchObject({ sessions: 1, share: 1 });
      for (const zeroGroup of ['search', 'social', 'referral', 'campaign']) {
        const entry = result.sources.find((s) => s.group === zeroGroup);
        expect(entry).toMatchObject({ sessions: 0, share: 0 });
      }
    });

    it('attributes a session by its FIRST stored event, even when a later event in the same session differs (S4)', async () => {
      const current: DateRange = {
        from: new Date('2026-07-31T23:00:00.000Z'),
        to: new Date('2026-08-01T23:00:00.000Z'),
      };
      const visitorId = randomUUID();
      await upsertAnalyticsVisitor(prisma, { visitorId, firstSeenAt: current.from });
      const sessionId = randomUUID();

      // First event: SEARCH. Second event (same session, later): DIRECT.
      // The session must count once, under SEARCH — never DIRECT, and never
      // counted twice (S4: sessions counted, not events).
      await insertAnalyticsEvent(prisma, {
        occurredAt: new Date('2026-08-01T10:00:00.000Z'), path: '/', visitorId, sessionId, sourceGroup: 'SEARCH', referrerHost: 'www.google.com',
      });
      await insertAnalyticsEvent(prisma, {
        occurredAt: new Date('2026-08-01T10:30:00.000Z'), path: '/about', visitorId, sessionId, sourceGroup: 'DIRECT',
      });

      const result = await getOverview(prisma, { current, previous: NO_OP_PREVIOUS });

      const search = result.sources.find((s) => s.group === 'search');
      const direct = result.sources.find((s) => s.group === 'direct');
      expect(search).toMatchObject({ sessions: 1 });
      expect(direct).toMatchObject({ sessions: 0 });
    });
  });

  // ---------------------------------------------------------------------------
  // V5 — realtime
  // ---------------------------------------------------------------------------
  describe('V5: realtime — trailing 5-minute window, top-5 active pages', () => {
    it('counts only visitors with an event in the trailing 5 minutes, ranked top-5 by path', async () => {
      const now = new Date('2026-08-01T12:00:00.000Z');
      const clock = () => now;

      const visitorInWindow1 = randomUUID();
      const visitorInWindow2 = randomUUID();
      const visitorOutsideWindow = randomUUID();
      for (const visitorId of [visitorInWindow1, visitorInWindow2, visitorOutsideWindow]) {
        await upsertAnalyticsVisitor(prisma, { visitorId, firstSeenAt: now });
      }

      // Inside the trailing 5 minutes (11:56 and 11:59).
      await insertAnalyticsEvent(prisma, { occurredAt: new Date('2026-08-01T11:56:00.000Z'), path: '/live-a', visitorId: visitorInWindow1, sessionId: randomUUID() });
      await insertAnalyticsEvent(prisma, { occurredAt: new Date('2026-08-01T11:59:00.000Z'), path: '/live-a', visitorId: visitorInWindow2, sessionId: randomUUID() });

      // Outside the window (6 minutes ago) — must not count.
      await insertAnalyticsEvent(prisma, { occurredAt: new Date('2026-08-01T11:54:00.000Z'), path: '/live-b', visitorId: visitorOutsideWindow, sessionId: randomUUID() });

      const result = await getRealtime(prisma, clock);

      expect(result.windowMinutes).toBe(5);
      expect(result.activeVisitors).toBe(2);
      expect(result.topActivePages).toHaveLength(1);
      expect(result.topActivePages[0]).toMatchObject({ path: '/live-a', activeVisitors: 2 });
    });

    it('caps the active-pages list at 5 entries', async () => {
      const now = new Date('2026-08-01T12:00:00.000Z');
      const clock = () => now;

      for (let i = 0; i < 6; i += 1) {
        const visitorId = randomUUID();
        await upsertAnalyticsVisitor(prisma, { visitorId, firstSeenAt: now });
        await insertAnalyticsEvent(prisma, {
          occurredAt: new Date('2026-08-01T11:59:00.000Z'), path: `/live-${i}`, visitorId, sessionId: randomUUID(),
        });
      }

      const result = await getRealtime(prisma, clock);

      expect(result.activeVisitors).toBe(6);
      expect(result.topActivePages).toHaveLength(5);
    });

    it('returns a zero-valued snapshot when no one is active (never NaN)', async () => {
      const result = await getRealtime(prisma, () => new Date('2026-08-01T12:00:00.000Z'));

      expect(result.activeVisitors).toBe(0);
      expect(result.topActivePages).toEqual([]);
      expect(result.windowMinutes).toBe(5);
    });
  });
});
