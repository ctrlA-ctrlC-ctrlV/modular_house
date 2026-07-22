/**
 * T060 / T061 — GET /api/admin/analytics/overview integration tests
 * (T-B5, T-B6 overview half).
 *
 * Exercises the authenticated admin overview endpoint against the real
 * Express app via supertest and the shared `db:seed` analytics fixtures
 * (T006) — unlike the T058 unit suite (which deliberately avoids the seed
 * for isolation), these tests intentionally depend on it: T060's Do text
 * says "matching the seeded fixtures" and T-B6 needs enough distinct
 * source-group / path variety that only the shared seed conveniently
 * provides. `pnpm --filter @modular-house/api db:seed` must have populated
 * the fixtures (DoD-8) before this file runs.
 *
 * The endpoint does not exist yet — the route/handler is T066/T067/T068,
 * later Pass 2 work. Both tasks are red for that reason alone; every
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
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';

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

  const email = `analytics-overview-${Date.now()}@example.com`;
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
});
