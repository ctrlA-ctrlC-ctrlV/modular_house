/**
 * T039 / T040 — POST /api/analytics/events integration tests (T-B1, T-B2).
 *
 * Exercises the public ingest endpoint against the real Express app via
 * supertest and the seeded test DB. Both halves of the multi-task unit
 * T039–T044 live in this file; they stay red until T042 (service) + T043
 * (route) + T044 (app mount) land, then go green together.
 *
 * T039 (T-B1, happy path) — a valid payload carrying `mh_vid` / `mh_sid`
 * cookies responds 204; exactly one `analytics_events` row stores path /
 * occurredAt (server clock) / sourceGroup / visitorId / sessionId; the
 * `analytics_visitors` row is upserted with server-authoritative
 * firstSeenAt / lastSeenAt (plan §2.3 M1/M2, research R2/R3, FR-007).
 *
 * T040 (T-B2, session grouping) — two events posted with the same `mh_sid`
 * within 30 minutes share the stored `sessionId`; an event arriving with a
 * fresh `mh_sid` stores a new `sessionId` (plan §2.5 V1/K3, FR-009). The
 * 30-minute session inactivity window is implemented by the `mh_sid` cookie's
 * rolling expiry on the client (K3); the server does NOT enforce a time gap —
 * it groups purely by the cookie's `sessionId` value. The cookie-rolling
 * boundary itself (29m59s vs 30m01s) is asserted client-side in T-F5 /
 * E-SESSION (T109/T110), not here.
 *
 * Clock strategy (review-nit fix): the task texts say "Use T005 helpers,
 * injected clock" / "within 30 minutes (injected clock)". The T005
 * `createAnalyticsClock` / `ANALYTICS_FIXED_NOW` helpers provide the
 * deterministic epoch. Because the ingest route uses `new Date()` for
 * `occurredAt` (the service's default clock — not injectable through HTTP),
 * the integration test bridges the T005 injected clock to the route's
 * wall clock via `vi.useFakeTimers({ toFake: ['Date'] })`: only `Date` is
 * faked (so `new Date()` in the route returns the injected clock's value),
 * while `setTimeout` / `setInterval` / Prisma I/O stay real. The clock is
 * advanced between POSTs with `clock.advance()` + `vi.setSystemTime()`, and
 * `occurredAt` is asserted against the exact injected-clock value — never a
 * wall-clock range. The exact-time determinism required by constitution III
 * is thereby satisfied for the integration path too.
 *
 * Seed isolation: the shared analytics seed (T006) reuses the
 * `FIXED_VISITOR_IDS` from `tests/helpers/analyticsFixtures.ts`. To avoid
 * colliding with those rows (and to avoid wiping the shared seed), every test
 * here mints a fresh `crypto.randomUUID()` visitor/session pair, queries
 * scoped to that visitor id, and cleans up only its own rows in `beforeEach`.
 */
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app.js';
import {
  ANALYTICS_FIXED_NOW,
  createAnalyticsClock,
  analyticsCookieHeader,
} from '../helpers/analyticsFixtures.js';

const prisma = new PrismaClient();

/**
 * The T005 injected clock shared across all tests in this file. Reset to
 * `ANALYTICS_FIXED_NOW` in `beforeEach` so each test starts from the
 * deterministic epoch; advanced in-test with `clock.advance()` to cross the
 * 30-minute session boundary (T040) deterministically.
 */
const clock = createAnalyticsClock();

/**
 * Visitor ids minted by individual tests are tracked here so `afterEach` can
 * delete their rows without touching the shared seeded fixtures (which use the
 * `FIXED_VISITOR_IDS` set). Reset at the start of each test.
 */
const createdVisitorIds: string[] = [];

/**
 * Remove every event and visitor row for the ids this file has minted. The
 * shared seed is never deleted — only fresh `randomUUID()` ids are tracked
 * here, so cross-test interference with the overview / realtime suites is
 * impossible.
 */
async function cleanupCreatedRows(): Promise<void> {
  for (const visitorId of createdVisitorIds) {
    await prisma.analyticsEvent.deleteMany({ where: { visitorId } });
    await prisma.analyticsVisitor.deleteMany({ where: { visitorId } });
  }
  createdVisitorIds.length = 0;
}

describe('POST /api/analytics/events', () => {
  // Shared hooks — both the T039 (T-B1) and T040 (T-B2) groups start each
  // test from a clean slate for their own minted ids and release the Prisma
  // connection once at the end of the file.
  beforeEach(async () => {
    // Reset the T005 injected clock to the deterministic epoch and fake only
    // `Date` (not setTimeout/setInterval) so Prisma I/O and supertest stay
    // real while the route's `new Date()` returns the injected clock's value.
    clock.setNow(ANALYTICS_FIXED_NOW);
    vi.useFakeTimers({ now: clock.now(), toFake: ['Date'] });
    await cleanupCreatedRows();
  });

  afterAll(async () => {
    // Restore real timers before Prisma teardown so the disconnect is not
    // affected by the fake Date.
    vi.useRealTimers();
    await cleanupCreatedRows();
    await prisma.$disconnect();
  });

  // -------------------------------------------------------------------------
  // T039 — T-B1: happy-path store
  // -------------------------------------------------------------------------
  describe('happy path (T039, T-B1)', () => {
    it('returns 204 and stores one event + upserts the visitor (T-B1, M1/M2)', async () => {
      const visitorId = randomUUID();
      const sessionId = randomUUID();
      createdVisitorIds.push(visitorId);

      // The route's `new Date()` returns the faked system time
      // (ANALYTICS_FIXED_NOW) — the T005 injected clock's deterministic epoch.
      const res = await request(app)
        .post('/api/analytics/events')
        .set('Cookie', analyticsCookieHeader(visitorId, sessionId))
        .send({ path: '/garden-rooms' });

      // M1: a stored event responds 204 (never an error the page surfaces).
      expect(res.status).toBe(204);

      // Exactly one event row for this visitor. The query is scoped to the
      // minted visitorId so the shared seeded fixtures (different ids) are not
      // counted.
      const events = await prisma.analyticsEvent.findMany({ where: { visitorId } });
      expect(events).toHaveLength(1);

      const event = events[0];
      // M2: the stored path round-trips exactly.
      expect(event.path).toBe('/garden-rooms');
      // Identity comes from the request cookies (research R3 / M3).
      expect(event.visitorId).toBe(visitorId);
      expect(event.sessionId).toBe(sessionId);
      // occurredAt is the server clock (M2: never client time), now
      // deterministic via the T005 injected clock faked as the system Date —
      // asserted against the exact epoch, not a wall-clock range.
      expect(event.occurredAt.toISOString()).toBe(ANALYTICS_FIXED_NOW.toISOString());
      // No referrer / utm / adClick in the payload -> DIRECT (plan §2.4 S3:
      // empty referrer classifies as DIRECT).
      expect(event.sourceGroup).toBe('DIRECT');

      // The visitor is upserted with server-authoritative firstSeenAt and
      // lastSeenAt (research R2). For a brand-new visitor the ingest upsert
      // inserts firstSeenAt = lastSeenAt = server-now (data-model §3 write
      // pattern); both equal the injected clock's epoch.
      const visitor = await prisma.analyticsVisitor.findUnique({
        where: { visitorId },
      });
      expect(visitor).not.toBeNull();
      // Narrow the nullable type without a non-null assertion (repo convention:
      // `as NonNullable<typeof x>` — see tests/unit/userPreference.test.ts).
      const v = visitor as NonNullable<typeof visitor>;
      expect(v.firstSeenAt.toISOString()).toBe(ANALYTICS_FIXED_NOW.toISOString());
      expect(v.lastSeenAt.toISOString()).toBe(ANALYTICS_FIXED_NOW.toISOString());
    });
  });

  // -------------------------------------------------------------------------
  // T040 — T-B2: session grouping by mh_sid cookie value
  // -------------------------------------------------------------------------
  describe('session grouping by mh_sid (T040, T-B2)', () => {
    it('two events with the same mh_sid within 30 minutes share the stored sessionId (T-B2, V1)', async () => {
      const visitorId = randomUUID();
      const sessionId = randomUUID();
      createdVisitorIds.push(visitorId);

      // First page view at T0 (ANALYTICS_FIXED_NOW).
      const res1 = await request(app)
        .post('/api/analytics/events')
        .set('Cookie', analyticsCookieHeader(visitorId, sessionId))
        .send({ path: '/garden-rooms' });
      expect(res1.status).toBe(204);

      // Advance the T005 injected clock 5 minutes (within the 30-minute
      // session window, V1) and update the faked system Date to match so the
      // route's `new Date()` returns the advanced time for the second POST.
      clock.advance(5 * 60 * 1000);
      vi.setSystemTime(clock.now());

      // Second page view at T+5m, same mh_sid (the cookie is still valid —
      // within the 30-minute rolling window, which is a client-side concern
      // K3). The server must group both events under the same sessionId.
      const res2 = await request(app)
        .post('/api/analytics/events')
        .set('Cookie', analyticsCookieHeader(visitorId, sessionId))
        .send({ path: '/garden-rooms/configure' });
      expect(res2.status).toBe(204);

      const events = await prisma.analyticsEvent.findMany({
        where: { visitorId },
        orderBy: { id: 'asc' },
      });
      expect(events).toHaveLength(2);
      // Both events share the cookie's sessionId — the grouping assertion.
      expect(events[0].sessionId).toBe(sessionId);
      expect(events[1].sessionId).toBe(sessionId);
      // Both belong to the same visitor.
      expect(events[0].visitorId).toBe(visitorId);
      expect(events[1].visitorId).toBe(visitorId);
      // Exact occurredAt values from the injected clock: T0 and T+5m.
      expect(events[0].occurredAt.toISOString()).toBe(ANALYTICS_FIXED_NOW.toISOString());
      expect(events[1].occurredAt.toISOString()).toBe(clock.now().toISOString());
    });

    it('an event with a fresh mh_sid after 30 minutes stores a new sessionId (T-B2, K3)', async () => {
      const visitorId = randomUUID();
      const sessionId1 = randomUUID();
      const sessionId2 = randomUUID();
      createdVisitorIds.push(visitorId);

      // First session at T0.
      const res1 = await request(app)
        .post('/api/analytics/events')
        .set('Cookie', analyticsCookieHeader(visitorId, sessionId1))
        .send({ path: '/garden-rooms' });
      expect(res1.status).toBe(204);

      // Advance the injected clock 31 minutes — past the 30-minute inactivity
      // window (K3). The client would have minted a fresh mh_sid; here we
      // simulate that by sending a new sessionId in the cookie. The server's
      // system Date is updated to match so occurredAt reflects the elapsed
      // time.
      clock.advance(31 * 60 * 1000);
      vi.setSystemTime(clock.now());

      // Second page view at T+31m with a fresh mh_sid — same visitor
      // (mh_vid unchanged), new session id.
      const res2 = await request(app)
        .post('/api/analytics/events')
        .set('Cookie', analyticsCookieHeader(visitorId, sessionId2))
        .send({ path: '/about' });
      expect(res2.status).toBe(204);

      const events = await prisma.analyticsEvent.findMany({
        where: { visitorId },
        orderBy: { id: 'asc' },
      });
      expect(events).toHaveLength(2);
      // The first event keeps the original sessionId; the second stores the
      // fresh sessionId — a new session group.
      expect(events[0].sessionId).toBe(sessionId1);
      expect(events[1].sessionId).toBe(sessionId2);
      // Both events still belong to the same visitor (mh_vid unchanged).
      expect(events[0].visitorId).toBe(visitorId);
      expect(events[1].visitorId).toBe(visitorId);
      // Exact occurredAt values from the injected clock: T0 and T+31m.
      expect(events[0].occurredAt.toISOString()).toBe(ANALYTICS_FIXED_NOW.toISOString());
      expect(events[1].occurredAt.toISOString()).toBe(clock.now().toISOString());
    });
  });
});
