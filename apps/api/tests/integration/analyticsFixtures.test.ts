/**
 * Permanent round-trip verification for the analytics fixture helpers (T005).
 *
 * Exercises every exported builder from `tests/helpers/analyticsFixtures.ts` against the
 * seeded test DB to prove that fixture inserts round-trip correctly — the "Done when"
 * assertion from T005 that was originally verified with a temporary file and then
 * deleted. This file stays in the repo so the proof is reproducible (review NIT fix).
 *
 * Row-writing tests below use fresh `crypto.randomUUID()` ids, NOT the shared
 * `FIXED_VISITOR_IDS`/`FIXED_SESSION_IDS` constants (the same ids `prisma/seed.ts`
 * inserts) — reusing those here would require this file's own `beforeAll` to
 * blanket-wipe the table first (to guarantee a clean insert, not an upsert-onto-
 * existing-row), silently destroying the shared `db:seed` fixtures for any file
 * that runs afterward in the same process (review-fix: a previously observed
 * cross-file race). `resetAnalyticsTablesExceptSeed` gives this file the same
 * clean-slate guarantee for its own fresh ids while sparing the seed. The one
 * exception is the final test, which specifically proves the blanket
 * `resetAnalyticsTables` helper's full-wipe contract and therefore does
 * destroy the seed as a side effect — it restores the fixtures immediately
 * afterward via the same shared `seedAnalyticsFixtures` function
 * `prisma/seed.ts` uses (`src/seed/analyticsFixtureData.ts`); see its own
 * comment.
 *
 * Run with: `pnpm --filter @modular-house/api exec vitest run tests/integration/analyticsFixtures.test.ts`
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import {
  createAnalyticsClock,
  insertAnalyticsEvent,
  upsertAnalyticsVisitor,
  resetAnalyticsTables,
  resetAnalyticsTablesExceptSeed,
  analyticsCookieHeader,
  FIXED_VISITOR_IDS,
  FIXED_SESSION_IDS,
  ANALYTICS_FIXED_NOW,
  type InsertAnalyticsEventOptions,
} from '../helpers/analyticsFixtures.js';
import { seedAnalyticsFixtures } from '../../src/seed/analyticsFixtureData.js';

const prisma = new PrismaClient();

describe('T005 analyticsFixtures round-trip (permanent proof)', () => {
  beforeAll(async () => {
    await resetAnalyticsTablesExceptSeed(prisma);
  });

  afterAll(async () => {
    await resetAnalyticsTablesExceptSeed(prisma);
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
    const visitorId = randomUUID();
    const visitor = await upsertAnalyticsVisitor(prisma, {
      visitorId,
      firstSeenAt: clock.now(),
    });

    expect(visitor.visitorId).toBe(visitorId);
    expect(visitor.firstSeenAt.toISOString()).toBe(clock.now().toISOString());
    expect(visitor.lastSeenAt.toISOString()).toBe(clock.now().toISOString());
  });

  it('upsertAnalyticsVisitor updates lastSeenAt but preserves firstSeenAt on conflict', async () => {
    const clock = createAnalyticsClock();
    const initialTime = clock.now();
    const visitorId = randomUUID();

    // First insert
    await upsertAnalyticsVisitor(prisma, {
      visitorId,
      firstSeenAt: initialTime,
    });

    // Advance clock and upsert again — lastSeenAt should update, firstSeenAt should not
    clock.advance(60 * 60 * 1000); // +1 hour
    const updated = await upsertAnalyticsVisitor(prisma, {
      visitorId,
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
    const visitorId = randomUUID();
    const sessionId = randomUUID();

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
    const visitorId = randomUUID();
    const sessionId = randomUUID();

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
    const visitorId = randomUUID();
    const sessionId = randomUUID();

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
  /**
   * Deliberate exception to this file's "never touch the shared seed" rule:
   * proving `resetAnalyticsTables` truly empties BOTH tables (its documented
   * contract) requires the tables to genuinely become empty, which — if the
   * shared `db:seed` fixtures happen to be present when this test runs —
   * necessarily wipes them too. That is intentional and unavoidable here (a
   * blanket-wipe helper cannot be proven to wipe everything without wiping
   * everything); `resetAnalyticsTablesExceptSeed` is what every OTHER test in
   * this file, and every other suite that shares the seed, should use instead.
   * Restores the seed immediately afterward via the same shared
   * `seedAnalyticsFixtures` function `prisma/seed.ts` uses (test order
   * insurance), so this file's net effect on the shared table, from any
   * later-running suite's perspective, is unchanged either way.
   */
  it('resetAnalyticsTables removes all analytics rows', async () => {
    const clock = createAnalyticsClock();
    await insertAnalyticsEvent(prisma, {
      occurredAt: clock.now(),
      visitorId: randomUUID(),
      sessionId: randomUUID(),
    });

    expect(await prisma.analyticsEvent.count()).toBeGreaterThan(0);

    await resetAnalyticsTables(prisma);

    expect(await prisma.analyticsEvent.count()).toBe(0);
    expect(await prisma.analyticsVisitor.count()).toBe(0);

    // Restore the shared db:seed fixtures this call just destroyed.
    await seedAnalyticsFixtures(prisma);
  });
});
