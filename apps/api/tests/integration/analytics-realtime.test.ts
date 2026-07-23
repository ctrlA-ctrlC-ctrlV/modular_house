/**
 * T062 — GET /api/admin/analytics/realtime integration test (T-B6, realtime half).
 *
 * Exercises the authenticated admin realtime endpoint against the real Express
 * app via supertest. Unlike analytics-overview.test.ts (T060/T061), which
 * intentionally reads the shared `db:seed` fixtures, this suite mints its own
 * fresh visitor/session identifiers per test (`crypto.randomUUID()`, never the
 * `FIXED_VISITOR_IDS` from tests/helpers/analyticsFixtures.ts). The shared
 * seed's events all fall on 2026-07-13..15 (London); depending on the injected
 * "now" a realtime window could accidentally straddle seeded rows, so
 * isolation is achieved with disjoint identifiers and by deleting only this
 * file's own rows, mirroring the established pattern in
 * analytics-ingest.test.ts.
 *
 * The endpoint does not exist yet — the route/handler is T066/T067/T068,
 * later Pass 2 work — so every request below 404s for that reason alone.
 * Expected values were independently verified against the already-implemented
 * `analyticsQuery.getRealtime` (T058/T059) before being hard-coded here, so
 * this suite is expected to go green, not merely stop 404-ing, once
 * T066-T068 wire the route on top of that service.
 *
 * Clock strategy: the realtime route calls `getRealtime(prisma)` with its
 * default clock (`() => new Date()`) — not injectable through HTTP — so this
 * test bridges the T005 injected clock to the route's wall clock via
 * `vi.useFakeTimers({ toFake: ['Date'] })`, exactly as analytics-ingest.test.ts
 * does: only `Date` is faked (so `new Date()` inside the route/service
 * returns the injected clock's value), while `setTimeout` / `setInterval` /
 * Prisma I/O stay real. Every `occurredAt` below is a fixed, hand-computed
 * UTC instant relative to that injected "now" — never real wall-clock time
 * (constitution III).
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import app from '../../src/app.js';
import { prisma, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';
import {
  ANALYTICS_FIXED_NOW,
  createAnalyticsClock,
  insertAnalyticsEvent,
  upsertAnalyticsVisitor,
} from '../helpers/analyticsFixtures.js';

/**
 * Complete login + verify-2fa for a fresh `admin`-role test user and return
 * the bearer access token. Duplicated from analytics-overview.test.ts rather
 * than extracted to a shared helper — see that file's docstring for the
 * rationale (single-file usage pattern, established via edge-superadmin.test.ts).
 * Contract: "Authenticated (any admin role, Phase 2 - FR-017)".
 */
async function createAuthenticatedSession(): Promise<string> {
  const role = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (!role) {
    throw new Error('admin role not found — seed required');
  }

  const email = `analytics-realtime-${Date.now()}@example.com`;
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

/** The T005 injected clock bridging to the route's wall clock via faked `Date`. */
const analyticsClock = createAnalyticsClock();

/**
 * Visitor ids minted by this file's tests, tracked so `beforeEach` can delete
 * only their rows without touching the shared `db:seed` fixtures (which use
 * `FIXED_VISITOR_IDS`) relied upon by analytics-overview.test.ts.
 */
const createdVisitorIds: string[] = [];

/** Remove every event and visitor row for the ids this file has minted. */
async function cleanupCreatedRows(): Promise<void> {
  for (const visitorId of createdVisitorIds) {
    await prisma.analyticsEvent.deleteMany({ where: { visitorId } });
    await prisma.analyticsVisitor.deleteMany({ where: { visitorId } });
  }
  createdVisitorIds.length = 0;
}

describe('GET /api/admin/analytics/realtime', () => {
  let accessToken: string;

  beforeAll(async () => {
    // Minted under the real wall clock, before fake timers are installed per
    // test — the resulting JWT's `exp` is far past any injected "now" used
    // below, so faking `Date` afterward never invalidates this session.
    accessToken = await createAuthenticatedSession();
  });

  beforeEach(async () => {
    // Reset the injected clock to the deterministic epoch and fake only
    // `Date` (not setTimeout/setInterval) so Prisma I/O and supertest stay
    // real while the route's `new Date()` returns the injected clock's value.
    analyticsClock.setNow(ANALYTICS_FIXED_NOW);
    vi.useFakeTimers({ now: analyticsClock.now(), toFake: ['Date'] });
    await cleanupCreatedRows();
  });

  afterAll(async () => {
    // Restore real timers before Prisma teardown so the disconnect is not
    // affected by the fake Date.
    vi.useRealTimers();
    await cleanupCreatedRows();
    await disconnectDb();
  });

  // ---------------------------------------------------------------------------
  // T062 (T-B6, realtime half) — trailing-5-minute distinct visitors + top pages
  // ---------------------------------------------------------------------------
  describe('T062 (T-B6): trailing 5-minute distinct visitors and top-5 active pages', () => {
    it('counts only visitors with an event in the trailing 5 minutes, ranked by path', async () => {
      const visitorLiveA1 = randomUUID();
      const visitorLiveA2 = randomUUID();
      const visitorLiveB = randomUUID();
      const visitorStale = randomUUID();
      createdVisitorIds.push(visitorLiveA1, visitorLiveA2, visitorLiveB, visitorStale);

      for (const visitorId of [visitorLiveA1, visitorLiveA2, visitorLiveB, visitorStale]) {
        await upsertAnalyticsVisitor(prisma, { visitorId, firstSeenAt: ANALYTICS_FIXED_NOW });
      }

      // Inside the trailing 5 minutes (11:56 and 11:59 relative to the
      // 12:00:00 injected "now") — two distinct visitors on the same path.
      await insertAnalyticsEvent(prisma, {
        occurredAt: new Date('2026-07-15T11:56:00.000Z'),
        path: '/live-a',
        visitorId: visitorLiveA1,
        sessionId: randomUUID(),
      });
      await insertAnalyticsEvent(prisma, {
        occurredAt: new Date('2026-07-15T11:59:00.000Z'),
        path: '/live-a',
        visitorId: visitorLiveA2,
        sessionId: randomUUID(),
      });
      // Inside the window, a second path with a single distinct visitor.
      await insertAnalyticsEvent(prisma, {
        occurredAt: new Date('2026-07-15T11:57:00.000Z'),
        path: '/live-b',
        visitorId: visitorLiveB,
        sessionId: randomUUID(),
      });
      // Six minutes before the injected "now" — outside the 5-minute window,
      // must not contribute to activeVisitors or topActivePages.
      await insertAnalyticsEvent(prisma, {
        occurredAt: new Date('2026-07-15T11:54:00.000Z'),
        path: '/live-c',
        visitorId: visitorStale,
        sessionId: randomUUID(),
      });

      const res = await request(app)
        .get('/api/admin/analytics/realtime')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.windowMinutes).toBe(5);
      // Distinct visitors with >= 1 event in the window (V5) — the stale
      // visitor's 11:54 event is excluded, leaving three.
      expect(res.body.activeVisitors).toBe(3);

      const paths = res.body.topActivePages.map((p: { path: string }) => p.path);
      expect(paths).toEqual(['/live-a', '/live-b']);
      expect(res.body.topActivePages).not.toContainEqual(expect.objectContaining({ path: '/live-c' }));

      const liveA = res.body.topActivePages.find((p: { path: string }) => p.path === '/live-a');
      expect(liveA).toMatchObject({ path: '/live-a', activeVisitors: 2 });
      const liveB = res.body.topActivePages.find((p: { path: string }) => p.path === '/live-b');
      expect(liveB).toMatchObject({ path: '/live-b', activeVisitors: 1 });
    });
  });
});
