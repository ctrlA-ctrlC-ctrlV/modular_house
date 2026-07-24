/**
 * T060 / T061 / T063 / T064 — GET /api/admin/analytics/overview integration
 * tests (T-B5, T-B6 overview half, T-B3, T-B4).
 *
 * Exercises the authenticated admin overview endpoint against the real
 * Express app via supertest and the shared `db:seed` analytics fixtures
 * (T006) — unlike the T058 unit suite (which deliberately avoids the seed
 * for isolation), T060/T061 intentionally depend on it: T060's Do text
 * says "matching the seeded fixtures" and T-B6 needs enough distinct
 * source-group / path variety that only the shared seed conveniently
 * provides. `pnpm --filter @modular-house/api db:seed` must have populated
 * the fixtures (DoD-8) before this file runs.
 *
 * The endpoint does not exist yet — the route/handler is T066/T067/T068,
 * later Pass 2 work. All four tasks are red for that reason alone; every
 * expected value below was independently verified by calling
 * `analyticsQuery.getOverview` directly against the seeded test database
 * (bypassing the not-yet-existent HTTP layer) before being hard-coded here,
 * so this suite is expected to go green, not merely stop 404-ing, once
 * T066-T068 wire the route on top of the already-implemented T059 service.
 *
 * Seed reference (apps/api/prisma/seed.ts): 5 visitors (A-E), 12 events
 * across 2026-07-13/14/15 (London), one session per visitor, each session
 * covering a different one of the five source groups (S4). "Today" for the
 * fixtures is 2026-07-15 (London).
 *
 * T060 (T-B5): today (07-15) vs the immediately preceding equal window
 * (07-14) — every KPI's current/previous/deltaPercent, matching the seed.
 * T061 (T-B6, overview half): the 3-day range (07-13..07-15) to prove day
 * bucketing + the "no prior data" Q5 case (its preceding 3-day window has
 * no events at all — the range predates the first-ever stored event), and
 * the today-only query doubles as the <= 2-day hour-bucket case, whose
 * top-pages/sources shape (including a zero-valued group) is asserted here.
 *
 * T063 (T-B3) and T064 (T-B4), unlike T060/T061, deliberately do NOT read
 * the shared seed: each mints fresh `crypto.randomUUID()` visitor/session
 * ids scoped to a query range the seed never touches (2026-08-01/02, versus
 * the seed's 2026-07-13..15), so their KPI/source assertions are never
 * contaminated by the seed's five fixed visitors, and cleans up its own rows
 * in a `finally` block — mirroring the isolation pattern established in
 * analytics-ingest.test.ts.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import app from '../../src/app.js';
import { prisma, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';
import {
  createAnalyticsClock,
  insertAnalyticsEvent,
  upsertAnalyticsVisitor,
  analyticsCookieHeader,
} from '../helpers/analyticsFixtures.js';

/**
 * Complete login + verify-2fa for a fresh `admin`-role test user and return
 * the bearer access token, mirroring the established session-setup pattern
 * used throughout this test suite (e.g. edge-superadmin.test.ts) rather
 * than introducing a new shared helper for a single file's use. Contract:
 * "Authenticated (any admin role, Phase 2 - FR-017)" — `admin`, not
 * `super_admin`, exercises that any admin role suffices.
 */
async function createAuthenticatedSession(): Promise<string> {
  const role = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (!role) {
    throw new Error('admin role not found — seed required');
  }

  // A UUID, not `Date.now()`, guarantees a fresh email even when this helper
  // is called under a faked `Date` (T102/E-RANGE calls it under several fixed
  // fake instants to keep a session's token valid at a far-future faked
  // "now") — `Date.now()` would otherwise collide with a previous test run's
  // leftover row sharing the same fake instant, since no `afterEach` truncates
  // the `users` table between runs.
  const email = `analytics-overview-${randomUUID()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: 'unused-password-auth-bypassed-via-otp',
      roleId: role.id,
      isActive: true,
      failedLoginAttempts: 0,
    },
  });

  const clock = createClock(new Date());
  const loginCodeService = new LoginCodeService(prisma, clock.now);
  const { challengeId, code } = await loginCodeService.issue(user.id);

  const res = await request(app).post('/admin/auth/verify-2fa').send({ challengeId, code });
  if (res.status !== 200) {
    throw new Error(`verify-2fa failed: ${res.status}`);
  }
  return res.body.accessToken as string;
}

describe('GET /api/admin/analytics/overview', () => {
  let accessToken: string;

  beforeAll(async () => {
    accessToken = await createAuthenticatedSession();
  });

  afterAll(async () => {
    await disconnectDb();
  });

  // ---------------------------------------------------------------------------
  // T060 (T-B5) — KPI/delta happy path
  // ---------------------------------------------------------------------------
  describe('T060 (T-B5): KPIs with current/previous/deltaPercent', () => {
    it('returns today vs. yesterday, matching the seeded fixtures', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/overview')
        .query({ from: '2026-07-15', to: '2026-07-15' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const { kpis } = res.body;
      expect(kpis.pageViews).toMatchObject({ current: 5, previous: 4, deltaPercent: 25 });
      expect(kpis.uniqueVisitors.current).toBe(4);
      expect(kpis.uniqueVisitors.previous).toBe(3);
      expect(kpis.uniqueVisitors.deltaPercent).toBeCloseTo(33.333333, 4);
      expect(kpis.sessions.current).toBe(4);
      expect(kpis.sessions.previous).toBe(3);
      expect(kpis.sessions.deltaPercent).toBeCloseTo(33.333333, 4);
      expect(kpis.returningVisitorRate.current).toBeCloseTo(0.5, 10);
      expect(kpis.returningVisitorRate.previous).toBeCloseTo(0.666667, 4);
      expect(kpis.returningVisitorRate.deltaPercent).toBeCloseTo(-25, 4);
      expect(kpis.pagesPerSession.current).toBeCloseTo(1.25, 10);
      expect(kpis.pagesPerSession.previous).toBeCloseTo(1.333333, 4);
      expect(kpis.pagesPerSession.deltaPercent).toBeCloseTo(-6.25, 4);
    });

    it('renders "no prior data" (previous null) when the comparison window predates the first stored event', async () => {
      // The 3-day seeded range's immediately preceding 3-day window
      // (2026-07-10..12) has zero events, and ends before the very first
      // stored event (2026-07-13T11:00:00Z) — Q5's "no prior data" case.
      const res = await request(app)
        .get('/api/admin/analytics/overview')
        .query({ from: '2026-07-13', to: '2026-07-15' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.kpis.pageViews.current).toBe(12);
      expect(res.body.kpis.pageViews.previous).toBeNull();
      expect(res.body.kpis.pageViews.deltaPercent).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // T061 (T-B6, overview half) — range/shape: bucket echo, top pages, sources
  // ---------------------------------------------------------------------------
  describe('T061 (T-B6): range honored, bucket echo, top pages, five source groups', () => {
    it('buckets a <= 2-day span by hour and returns top pages + all five source groups (one zero-valued)', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/overview')
        .query({ from: '2026-07-15', to: '2026-07-15' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.range.bucket).toBe('hour');

      const paths = res.body.topPages.map((p: { path: string }) => p.path).sort();
      expect(paths).toEqual(['/', '/about', '/contact', '/garden-room']);
      const rootPage = res.body.topPages.find((p: { path: string }) => p.path === '/');
      expect(rootPage).toMatchObject({ views: 2, share: 0.4 });

      expect(res.body.sources).toHaveLength(5);
      const groups = res.body.sources.map((s: { group: string }) => s.group).sort();
      expect(groups).toEqual(['campaign', 'direct', 'referral', 'search', 'social']);
      const social = res.body.sources.find((s: { group: string }) => s.group === 'social');
      expect(social).toMatchObject({ sessions: 0, share: 0 });
      const search = res.body.sources.find((s: { group: string }) => s.group === 'search');
      expect(search).toMatchObject({ sessions: 1, share: 0.25 });
    });

    it('buckets a > 2-day span by day, echoing the validated range', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/overview')
        .query({ from: '2026-07-13', to: '2026-07-15' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.range).toMatchObject({ from: '2026-07-13', to: '2026-07-15', bucket: 'day' });
      expect(res.body.timeseries).toHaveLength(3);
      expect(res.body.timeseries.map((t: { pageViews: number }) => t.pageViews)).toEqual([3, 4, 5]);

      // Every source group present with the seed's documented one-session-
      // per-group distribution (S4: sessions counted, not events).
      expect(res.body.sources).toHaveLength(5);
      for (const entry of res.body.sources) {
        expect(entry.sessions).toBe(1);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // T063 (T-B3) — returning vs. new visitor classification (V3)
  // ---------------------------------------------------------------------------
  describe('T063 (T-B3): returning-visitor classification within a range', () => {
    it('counts a visitor with firstSeenAt yesterday as returning, and a same-day visitor as new', async () => {
      // Isolated from the shared db:seed fixtures (2026-07-13..15) by a
      // disjoint date and fresh randomUUID() ids, so uniqueVisitors /
      // returningVisitorRate below reflect only these two rows.
      const returningVisitorId = randomUUID();
      const newVisitorId = randomUUID();

      try {
        // Returning: firstSeenAt on the London day before the queried range,
        // with an in-range event today — V3: the first in-range event's
        // London day is strictly later than firstSeenAt's London day.
        await upsertAnalyticsVisitor(prisma, {
          visitorId: returningVisitorId,
          firstSeenAt: new Date('2026-07-31T11:00:00.000Z'),
        });
        await insertAnalyticsEvent(prisma, {
          occurredAt: new Date('2026-08-01T11:00:00.000Z'),
          path: '/t063-returning',
          visitorId: returningVisitorId,
          sessionId: randomUUID(),
        });

        // New: firstSeenAt falls on the same London day as the in-range event.
        await upsertAnalyticsVisitor(prisma, {
          visitorId: newVisitorId,
          firstSeenAt: new Date('2026-08-01T11:05:00.000Z'),
        });
        await insertAnalyticsEvent(prisma, {
          occurredAt: new Date('2026-08-01T11:05:00.000Z'),
          path: '/t063-new',
          visitorId: newVisitorId,
          sessionId: randomUUID(),
        });

        // T102/E-RANGE hardened the route's Q1 "to <= today" boundary, which
        // reads `new Date()` directly (no injectable clock parameter on this
        // route, mirroring the ingest route's own convention) — fake the
        // clock to a deterministic instant safely after 2026-08-01 so this
        // assertion never depends on the real wall clock (constitution III).
        vi.useFakeTimers({ now: new Date('2026-08-02T00:00:00.000Z'), toFake: ['Date'] });
        // The shared `accessToken` (minted in `beforeAll` at the real current
        // time) has exceeded its 15-minute TTL by this faked instant — mint a
        // fresh session so the token's own iat/exp are computed relative to
        // the faked clock instead.
        const token = await createAuthenticatedSession();
        const res = await request(app)
          .get('/api/admin/analytics/overview')
          .query({ from: '2026-08-01', to: '2026-08-01' })
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.kpis.uniqueVisitors.current).toBe(2);
        // 1 of 2 visitors classifies as returning (V3).
        expect(res.body.kpis.returningVisitorRate.current).toBeCloseTo(0.5, 10);
      } finally {
        vi.useRealTimers();
        const visitorIds = [returningVisitorId, newVisitorId];
        await prisma.analyticsEvent.deleteMany({ where: { visitorId: { in: visitorIds } } });
        await prisma.analyticsVisitor.deleteMany({ where: { visitorId: { in: visitorIds } } });
      }
    });
  });

  // ---------------------------------------------------------------------------
  // T064 (T-B4) — source attribution via the full ingest -> overview pipeline
  // ---------------------------------------------------------------------------
  describe('T064 (T-B4): referrer/utm permutations classify into the five source groups', () => {
    it('ingests one session per source group and attributes each session by its FIRST event (S4)', async () => {
      // The ingest route's `occurredAt` is the server clock (`new Date()`,
      // not injectable through HTTP) — bridged to a deterministic value via
      // `vi.useFakeTimers({ toFake: ['Date'] })`, mirroring
      // analytics-ingest.test.ts. Only `Date` is faked so Prisma I/O and
      // supertest stay real. The chosen date (2026-08-02) is disjoint from
      // the shared seed's 2026-07-13..15 range.
      const clock = createAnalyticsClock(new Date('2026-08-02T11:00:00.000Z'));
      vi.useFakeTimers({ now: clock.now(), toFake: ['Date'] });

      const visitorSearch = randomUUID();
      const sessionSearch = randomUUID();
      const visitorSocial = randomUUID();
      const sessionSocial = randomUUID();
      const visitorReferral = randomUUID();
      const sessionReferral = randomUUID();
      const visitorCampaign = randomUUID();
      const sessionCampaign = randomUUID();
      const visitorDirect = randomUUID();
      const sessionDirect = randomUUID();

      try {
        // Session A (SEARCH): first event via a Google referrer.
        await request(app)
          .post('/api/analytics/events')
          .set('Cookie', analyticsCookieHeader(visitorSearch, sessionSearch))
          .send({ path: '/t064-a', referrer: 'https://www.google.com/search?q=modular+house' });

        // Session A continues 1 minute later with a Facebook referrer — S4
        // requires the SESSION's group to stay SEARCH (first event wins),
        // even though this second event's own sourceGroup is SOCIAL.
        clock.advance(60 * 1000);
        vi.setSystemTime(clock.now());
        await request(app)
          .post('/api/analytics/events')
          .set('Cookie', analyticsCookieHeader(visitorSearch, sessionSearch))
          .send({ path: '/t064-a2', referrer: 'https://www.facebook.com/' });

        // Session B (SOCIAL): Instagram referrer.
        clock.advance(60 * 1000);
        vi.setSystemTime(clock.now());
        await request(app)
          .post('/api/analytics/events')
          .set('Cookie', analyticsCookieHeader(visitorSocial, sessionSocial))
          .send({ path: '/t064-b', referrer: 'https://www.instagram.com/' });

        // Session C (REFERRAL): an external host absent from the SEARCH/SOCIAL
        // lists and not the site's own host.
        clock.advance(60 * 1000);
        vi.setSystemTime(clock.now());
        await request(app)
          .post('/api/analytics/events')
          .set('Cookie', analyticsCookieHeader(visitorReferral, sessionReferral))
          .send({ path: '/t064-c', referrer: 'https://news.example.com/story' });

        // Session D (CAMPAIGN): utm-tagged — S1 outranks any referrer.
        clock.advance(60 * 1000);
        vi.setSystemTime(clock.now());
        await request(app)
          .post('/api/analytics/events')
          .set('Cookie', analyticsCookieHeader(visitorCampaign, sessionCampaign))
          .send({
            path: '/t064-d',
            utmSource: 'newsletter',
            utmMedium: 'email',
            utmCampaign: 'phase2-launch',
          });

        // Session E (DIRECT): no referrer, no campaign tags.
        clock.advance(60 * 1000);
        vi.setSystemTime(clock.now());
        await request(app)
          .post('/api/analytics/events')
          .set('Cookie', analyticsCookieHeader(visitorDirect, sessionDirect))
          .send({ path: '/t064-e' });

        // T102/E-RANGE hardened the route's Q1 "to <= today" boundary
        // (`new Date()`, no injectable clock on this route). Keep the clock
        // faked — advanced to an instant safely after the ingested events —
        // rather than restoring the real wall clock, so this assertion never
        // depends on when the suite happens to run (constitution III).
        vi.setSystemTime(new Date('2026-08-03T00:00:00.000Z'));

        // The shared `accessToken` (minted in `beforeAll` at the real current
        // time) has exceeded its 15-minute TTL by this faked instant — mint a
        // fresh session so the token's own iat/exp are computed relative to
        // the faked clock instead.
        const token = await createAuthenticatedSession();
        const res = await request(app)
          .get('/api/admin/analytics/overview')
          .query({ from: '2026-08-02', to: '2026-08-02' })
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.sources).toHaveLength(5);

        const byGroup = (group: string) =>
          res.body.sources.find((s: { group: string }) => s.group === group);

        // Sessions counted, not events (S4): each group has exactly the one
        // session attributed to it, out of five total sessions.
        expect(byGroup('search')).toMatchObject({ sessions: 1, share: 0.2 });
        expect(byGroup('social')).toMatchObject({ sessions: 1, share: 0.2 });
        expect(byGroup('referral')).toMatchObject({ sessions: 1, share: 0.2 });
        expect(byGroup('campaign')).toMatchObject({ sessions: 1, share: 0.2 });
        expect(byGroup('direct')).toMatchObject({ sessions: 1, share: 0.2 });
      } finally {
        vi.useRealTimers();
        const visitorIds = [visitorSearch, visitorSocial, visitorReferral, visitorCampaign, visitorDirect];
        await prisma.analyticsEvent.deleteMany({ where: { visitorId: { in: visitorIds } } });
        await prisma.analyticsVisitor.deleteMany({ where: { visitorId: { in: visitorIds } } });
      }
    });
  });

  // ---------------------------------------------------------------------------
  // T102 (E-RANGE) — Q1 range-validation boundaries, Q4 bucket boundary, Q5
  // zero-vs-null comparison-window edge cases.
  // ---------------------------------------------------------------------------
  // Every time-dependent case below fakes the JS `Date` global (`toFake:
  // ['Date']` only, so real timers keep async I/O/supertest working) rather
  // than relying on the real wall clock, per constitution III. The route
  // reads `new Date()` directly for its Q1 "to <= today"/"to <= now" boundary
  // (no injectable clock parameter on this route, mirroring the ingest
  // route's established convention — see analytics-ingest.test.ts). Query
  // dates below are chosen well clear of the shared db:seed range
  // (2026-07-13..15) and every other describe block's isolated dates in this
  // file (2026-08-01/02) to avoid any cross-test contamination.
  describe('T102 (E-RANGE): Q1 range validation + Q4/Q5 edge cases', () => {
    /** Format a Date's UTC calendar day as YYYY-MM-DD. Every fixed instant in
     * this block is anchored at noon UTC, which falls inside the same
     * Europe/London calendar day in both BST and GMT, so this simple
     * UTC-slice is equivalent to the London day for these fixtures. */
    function isoDay(instant: Date): string {
      return instant.toISOString().slice(0, 10);
    }

    /** A new Date `days` calendar days before `instant` (whole-day UTC shift). */
    function daysBefore(instant: Date, days: number): Date {
      const shifted = new Date(instant);
      shifted.setUTCDate(shifted.getUTCDate() - days);
      return shifted;
    }

    it('rejects from > to with 400 (date form)', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/overview')
        .query({ from: '2026-07-15', to: '2026-07-14' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatchObject({ message: expect.any(String) });
    });

    it('rejects to = tomorrow (date form) with 400', async () => {
      // Faked "today" (Europe/London) = 2026-07-20 (noon UTC during BST).
      const fakeNow = new Date('2026-07-20T12:00:00.000Z');
      vi.useFakeTimers({ now: fakeNow, toFake: ['Date'] });
      try {
        const res = await request(app)
          .get('/api/admin/analytics/overview')
          .query({ from: '2026-07-19', to: '2026-07-21' }) // to = tomorrow
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(400);
        expect(res.body.error).toMatchObject({ message: expect.any(String) });
      } finally {
        vi.useRealTimers();
      }
    });

    it('accepts a span of exactly 490 days (date form)', async () => {
      const fakeNow = new Date('2026-07-20T12:00:00.000Z');
      vi.useFakeTimers({ now: fakeNow, toFake: ['Date'] });
      try {
        const to = isoDay(fakeNow);
        // 490 inclusive calendar days: from .. to spans 490 days when from is
        // 489 calendar days before to.
        const from = isoDay(daysBefore(fakeNow, 489));

        const res = await request(app)
          .get('/api/admin/analytics/overview')
          .query({ from, to })
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
      } finally {
        vi.useRealTimers();
      }
    });

    it('rejects a span of 491 days with 400 (date form)', async () => {
      const fakeNow = new Date('2026-07-20T12:00:00.000Z');
      vi.useFakeTimers({ now: fakeNow, toFake: ['Date'] });
      try {
        const to = isoDay(fakeNow);
        // 491 inclusive calendar days: from is 490 calendar days before to.
        const from = isoDay(daysBefore(fakeNow, 490));

        const res = await request(app)
          .get('/api/admin/analytics/overview')
          .query({ from, to })
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(400);
        expect(res.body.error).toMatchObject({ message: expect.any(String) });
      } finally {
        vi.useRealTimers();
      }
    });

    it('rejects mixed date/datetime params with 400', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/overview')
        .query({ from: '2026-07-13', to: '2026-07-13T23:00:00.000Z' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatchObject({ message: expect.any(String) });
    });

    it('rejects a datetime-form to in the future with 400', async () => {
      const fakeNow = new Date('2026-07-20T12:00:00.000Z');
      vi.useFakeTimers({ now: fakeNow, toFake: ['Date'] });
      try {
        const res = await request(app)
          .get('/api/admin/analytics/overview')
          .query({
            from: '2026-07-19T12:00:00.000Z',
            to: '2026-07-20T13:00:00.000Z', // 1 hour after "now"
          })
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(400);
        expect(res.body.error).toMatchObject({ message: expect.any(String) });
      } finally {
        vi.useRealTimers();
      }
    });

    it('buckets an exact 2-day span by hour (Q4 boundary)', async () => {
      const fakeNow = new Date('2026-09-12T12:00:00.000Z');
      vi.useFakeTimers({ now: fakeNow, toFake: ['Date'] });
      try {
        // The shared `accessToken` (minted in `beforeAll` at the real current
        // time) has long exceeded its 15-minute TTL by this faked, far-future
        // instant — mint a fresh session so the token's own iat/exp are
        // computed relative to the faked clock instead.
        const token = await createAuthenticatedSession();
        const res = await request(app)
          .get('/api/admin/analytics/overview')
          .query({ from: '2026-09-10', to: '2026-09-11' }) // exactly 2 calendar days
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.range.bucket).toBe('hour');
      } finally {
        vi.useRealTimers();
      }
    });

    it('buckets a trailing-24h datetime span by hour', async () => {
      const fakeNow = new Date('2026-09-14T00:00:00.000Z');
      vi.useFakeTimers({ now: fakeNow, toFake: ['Date'] });
      try {
        // See the previous test: a fresh session is required once the faked
        // clock has moved well past the shared token's 15-minute TTL.
        const token = await createAuthenticatedSession();
        const res = await request(app)
          .get('/api/admin/analytics/overview')
          .query({
            from: '2026-09-12T15:00:00.000Z',
            to: '2026-09-13T15:00:00.000Z', // exactly 24 hours
          })
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.range.bucket).toBe('hour');
      } finally {
        vi.useRealTimers();
      }
    });

    it('renders previous: 0 with deltaPercent: null when the comparison window is measured but empty (Q5)', async () => {
      // Distinct from T060's "no prior data" case: here the comparison
      // window (2026-09-19) falls AFTER the very first stored event ever
      // (the shared db:seed's 2026-07-13 row), so it IS measured — it simply
      // contains zero events of its own, which must render previous: 0 with
      // a not-computable (null, never NaN) deltaPercent.
      const fakeNow = new Date('2026-09-21T00:00:00.000Z');
      vi.useFakeTimers({ now: fakeNow, toFake: ['Date'] });
      const visitorId = randomUUID();
      const sessionId = randomUUID();
      try {
        await insertAnalyticsEvent(prisma, {
          occurredAt: new Date('2026-09-20T12:00:00.000Z'),
          path: '/t102-zero-previous',
          visitorId,
          sessionId,
        });

        // See the earlier Q4-boundary tests: a fresh session is required once
        // the faked clock has moved well past the shared token's 15-minute TTL.
        const token = await createAuthenticatedSession();
        const res = await request(app)
          .get('/api/admin/analytics/overview')
          .query({ from: '2026-09-20', to: '2026-09-20' })
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.kpis.pageViews.current).toBe(1);
        expect(res.body.kpis.pageViews.previous).toBe(0);
        expect(res.body.kpis.pageViews.deltaPercent).toBeNull();
      } finally {
        vi.useRealTimers();
        await prisma.analyticsEvent.deleteMany({ where: { visitorId } });
        await prisma.analyticsVisitor.deleteMany({ where: { visitorId } });
      }
    });
  });
});
