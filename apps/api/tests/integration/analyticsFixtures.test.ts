/**
 * Permanent round-trip verification for the analytics fixture helpers (T005).
 *
 * Exercises every exported builder from `tests/helpers/analyticsFixtures.ts` against the
 * seeded test DB to prove that fixture inserts round-trip correctly — the "Done when"
 * assertion from T005 that was originally verified with a temporary file and then
 * deleted. This file stays in the repo so the proof is reproducible (review NIT fix).
 *
 * Run with: `pnpm --filter @modular-house/api exec vitest run tests/integration/analyticsFixtures.test.ts`
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  createAnalyticsClock,
  insertAnalyticsEvent,
  upsertAnalyticsVisitor,
  resetAnalyticsTables,
  analyticsCookieHeader,
  FIXED_VISITOR_IDS,
  FIXED_SESSION_IDS,
  ANALYTICS_FIXED_NOW,
  type InsertAnalyticsEventOptions,
} from '../helpers/analyticsFixtures.js';

const prisma = new PrismaClient();

describe('T005 analyticsFixtures round-trip (permanent proof)', () => {
  beforeAll(async () => {
    await resetAnalyticsTables(prisma);
  });

  afterAll(async () => {
    await resetAnalyticsTables(prisma);
    await prisma.$disconnect();
  });

  // -------------------------------------------------------------------------
  // Clock helper — deterministic epoch
  // -------------------------------------------------------------------------
  it('ANALYTICS_FIXED_NOW is the deterministic 2026-07-15T12:00:00.000Z epoch', () => {
    expect(ANALYTICS_FIXED_NOW.toISOString()).toBe('2026-07-15T12:00:00.000Z');
  });

  it('createAnalyticsClock starts at ANALYTICS_FIXED_NOW and advances deterministically', () => {
    const clock = createAnalyticsClock();
    expect(clock.now().toISOString()).toBe('2026-07-15T12:00:00.000Z');

    clock.advance(30 * 60 * 1000); // +30 minutes
    expect(clock.now().toISOString()).toBe('2026-07-15T12:30:00.000Z');

    clock.advance(30 * 60 * 1000 + 1000); // +30m1s (crosses the 30-minute session boundary)
    expect(clock.now().toISOString()).toBe('2026-07-15T13:00:01.000Z');
  });

  // -------------------------------------------------------------------------
  // Cookie header builder — K1 cookie names
  // -------------------------------------------------------------------------
  it('analyticsCookieHeader formats mh_vid + mh_sid with the exact K1 cookie names', () => {
    const header = analyticsCookieHeader(
      FIXED_VISITOR_IDS.visitorA,
      FIXED_SESSION_IDS.sessionA,
    );
    expect(header).toBe(
      `mh_vid=${FIXED_VISITOR_IDS.visitorA}; mh_sid=${FIXED_SESSION_IDS.sessionA}`,
    );
  });

  // -------------------------------------------------------------------------
  // Visitor upsert — insert on new, update lastSeenAt on conflict
  // -------------------------------------------------------------------------
  it('upsertAnalyticsVisitor inserts a new visitor with firstSeenAt = lastSeenAt', async () => {
    const clock = createAnalyticsClock();
    const visitor = await upsertAnalyticsVisitor(prisma, {
      visitorId: FIXED_VISITOR_IDS.visitorA,
      firstSeenAt: clock.now(),
    });

    expect(visitor.visitorId).toBe(FIXED_VISITOR_IDS.visitorA);
    expect(visitor.firstSeenAt.toISOString()).toBe(clock.now().toISOString());
    expect(visitor.lastSeenAt.toISOString()).toBe(clock.now().toISOString());
  });

  it('upsertAnalyticsVisitor updates lastSeenAt but preserves firstSeenAt on conflict', async () => {
    const clock = createAnalyticsClock();
    const initialTime = clock.now();

    // First insert
    await upsertAnalyticsVisitor(prisma, {
      visitorId: FIXED_VISITOR_IDS.visitorB,
      firstSeenAt: initialTime,
    });

    // Advance clock and upsert again — lastSeenAt should update, firstSeenAt should not
    clock.advance(60 * 60 * 1000); // +1 hour
    const updated = await upsertAnalyticsVisitor(prisma, {
      visitorId: FIXED_VISITOR_IDS.visitorB,
      firstSeenAt: initialTime,
      lastSeenAt: clock.now(),
    });

    expect(updated.firstSeenAt.toISOString()).toBe(initialTime.toISOString());
    expect(updated.lastSeenAt.toISOString()).toBe(clock.now().toISOString());
  });

  // -------------------------------------------------------------------------
  // Event insert — all fields round-trip
  // -------------------------------------------------------------------------
  it('insertAnalyticsEvent persists all fields and returns the row', async () => {
    const clock = createAnalyticsClock();
    const visitorId = FIXED_VISITOR_IDS.visitorC;
    const sessionId = FIXED_SESSION_IDS.sessionC;

    await upsertAnalyticsVisitor(prisma, {
      visitorId,
      firstSeenAt: clock.now(),
    });

    const eventOptions: InsertAnalyticsEventOptions = {
      occurredAt: clock.now(),
      path: '/garden-room',
      visitorId,
      sessionId,
      sourceGroup: 'SEARCH',
      referrerHost: 'www.google.com',
      utmSource: 'google',
      utmMedium: 'organic',
      utmCampaign: 'summer2026',
    };

    const event = await insertAnalyticsEvent(prisma, eventOptions);

    expect(event.id).toBeTypeOf('bigint');
    expect(event.id).toBeGreaterThan(0n);
    expect(event.occurredAt.toISOString()).toBe(eventOptions.occurredAt.toISOString());
    expect(event.path).toBe('/garden-room');
    expect(event.visitorId).toBe(visitorId);
    expect(event.sessionId).toBe(sessionId);
    expect(event.sourceGroup).toBe('SEARCH');
    expect(event.referrerHost).toBe('www.google.com');
    expect(event.utmSource).toBe('google');
    expect(event.utmMedium).toBe('organic');
    expect(event.utmCampaign).toBe('summer2026');
  });

  it('insertAnalyticsEvent defaults to DIRECT source and "/" path when omitted', async () => {
    const clock = createAnalyticsClock();
    const visitorId = FIXED_VISITOR_IDS.visitorD;
    const sessionId = FIXED_SESSION_IDS.sessionD;

    await upsertAnalyticsVisitor(prisma, {
      visitorId,
      firstSeenAt: clock.now(),
    });

    const event = await insertAnalyticsEvent(prisma, {
      occurredAt: clock.now(),
      visitorId,
      sessionId,
    });

    expect(event.path).toBe('/');
    expect(event.sourceGroup).toBe('DIRECT');
    expect(event.referrerHost).toBeNull();
    expect(event.utmSource).toBeNull();
    expect(event.utmMedium).toBeNull();
    expect(event.utmCampaign).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Round-trip query — verify the row is retrievable
  // -------------------------------------------------------------------------
  it('a round-trip query retrieves the inserted event with matching field values', async () => {
    const clock = createAnalyticsClock();
    const visitorId = FIXED_VISITOR_IDS.visitorE;
    const sessionId = FIXED_SESSION_IDS.sessionE;

    await upsertAnalyticsVisitor(prisma, {
      visitorId,
      firstSeenAt: clock.now(),
    });

    await insertAnalyticsEvent(prisma, {
      occurredAt: clock.now(),
      path: '/about',
      visitorId,
      sessionId,
      sourceGroup: 'SOCIAL',
      referrerHost: 'www.facebook.com',
    });

    const found = await prisma.analyticsEvent.findFirst({
      where: { visitorId, path: '/about' },
    });

    expect(found).not.toBeNull();
    expect(found?.sourceGroup).toBe('SOCIAL');
    expect(found?.referrerHost).toBe('www.facebook.com');
    expect(found?.sessionId).toBe(sessionId);
  });

  // -------------------------------------------------------------------------
  // Reset helper — clean slate
  // -------------------------------------------------------------------------
  it('resetAnalyticsTables removes all analytics rows', async () => {
    const clock = createAnalyticsClock();
    await insertAnalyticsEvent(prisma, {
      occurredAt: clock.now(),
      visitorId: FIXED_VISITOR_IDS.visitorA,
      sessionId: FIXED_SESSION_IDS.sessionA,
    });

    expect(await prisma.analyticsEvent.count()).toBeGreaterThan(0);

    await resetAnalyticsTables(prisma);

    expect(await prisma.analyticsEvent.count()).toBe(0);
    expect(await prisma.analyticsVisitor.count()).toBe(0);
  });
});
