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
 * share the stored `sessionId`; an event arriving with a fresh `mh_sid`
 * stores a new `sessionId` (plan §2.5 V1/K3, FR-009). The 30-minute session
 * inactivity window is implemented by the `mh_sid` cookie's rolling expiry
 * on the client (K3); the server does NOT enforce a time gap — it groups
 * purely by the cookie's `sessionId` value. The cookie-rolling boundary
 * itself (29m59s vs 30m01s) is asserted client-side in T-F5 / E-SESSION
 * (T109/T110), not here.
 *
 * Clock note: the ingest route uses the server's wall clock for `occurredAt`
 * (the Phase 1 integration-test pattern — `new Date()` through the route,
 * injected clock for direct-service-call unit tests such as T058/T091). The
 * happy-path `occurredAt` assertion therefore uses a [before, after] window
 * captured around the POST on the same machine, which is deterministic for a
 * local test. The exact-time determinism required by constitution III belongs
 * to the session-boundary (T109), realtime-window, range-math (T102), and DST
 * (T105) suites, all of which call the service directly with an injected clock.
 *
 * Seed isolation: the shared analytics seed (T006) reuses the
 * `FIXED_VISITOR_IDS` from `tests/helpers/analyticsFixtures.ts`. To avoid
 * colliding with those rows (and to avoid wiping the shared seed), every test
 * here mints a fresh `crypto.randomUUID()` visitor/session pair, queries
 * scoped to that visitor id, and cleans up only its own rows in `afterEach`.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app.js';
import { analyticsCookieHeader } from '../helpers/analyticsFixtures.js';

const prisma = new PrismaClient();

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
    await cleanupCreatedRows();
  });

  afterAll(async () => {
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

      // Capture a wall-clock window around the POST. The server's `occurredAt`
      // is `new Date()` at request-handling time, which falls within this
      // window on the same machine (deterministic for a local test).
      const before = Date.now();
      const res = await request(app)
        .post('/api/analytics/events')
        .set('Cookie', analyticsCookieHeader(visitorId, sessionId))
        .send({ path: '/garden-rooms' });
      const after = Date.now();

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
      // occurredAt is the server clock (M2: never client time), within the
      // [before, after] window captured around the POST.
      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after);
      // No referrer / utm / adClick in the payload -> DIRECT (plan §2.4 S3:
      // empty referrer classifies as DIRECT).
      expect(event.sourceGroup).toBe('DIRECT');

      // The visitor is upserted with server-authoritative firstSeenAt and
      // lastSeenAt (research R2). For a brand-new visitor the ingest upsert
      // inserts firstSeenAt = lastSeenAt = server-now (data-model §3 write
      // pattern); both fall within the same [before, after] window.
      const visitor = await prisma.analyticsVisitor.findUnique({
        where: { visitorId },
      });
      expect(visitor).not.toBeNull();
      // Narrow the nullable type without a non-null assertion (repo convention:
      // `as NonNullable<typeof x>` — see tests/unit/userPreference.test.ts).
      const v = visitor as NonNullable<typeof visitor>;
      expect(v.firstSeenAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(v.firstSeenAt.getTime()).toBeLessThanOrEqual(after);
      expect(v.lastSeenAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(v.lastSeenAt.getTime()).toBeLessThanOrEqual(after);
    });
  });

  // -------------------------------------------------------------------------
  // T040 — T-B2: session grouping by mh_sid cookie value
  // -------------------------------------------------------------------------
  describe('session grouping by mh_sid (T040, T-B2)', () => {
    it('two events with the same mh_sid share the stored sessionId (T-B2, V1)', async () => {
      const visitorId = randomUUID();
      const sessionId = randomUUID();
      createdVisitorIds.push(visitorId);

      // First page view of the session.
      const res1 = await request(app)
        .post('/api/analytics/events')
        .set('Cookie', analyticsCookieHeader(visitorId, sessionId))
        .send({ path: '/garden-rooms' });
      expect(res1.status).toBe(204);

      // Second page view, same mh_sid (the cookie is still valid — within the
      // 30-minute rolling window, which is a client-side concern K3). The
      // server must group both events under the same sessionId.
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
    });

    it('an event with a fresh mh_sid stores a new sessionId (T-B2, K3)', async () => {
      const visitorId = randomUUID();
      const sessionId1 = randomUUID();
      const sessionId2 = randomUUID();
      createdVisitorIds.push(visitorId);

      // First session.
      const res1 = await request(app)
        .post('/api/analytics/events')
        .set('Cookie', analyticsCookieHeader(visitorId, sessionId1))
        .send({ path: '/garden-rooms' });
      expect(res1.status).toBe(204);

      // The mh_sid cookie has since expired (30-min inactivity window, K3) and
      // the client minted a fresh mh_sid for the next page view — same visitor
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
    });
  });
});
