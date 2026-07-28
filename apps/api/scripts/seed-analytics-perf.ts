#!/usr/bin/env tsx
/**
 * Deterministic 32-month performance seed for the Phase 2 analytics tables
 * (plan §2.6 Q8, DoD-7/DoD-8, "Scale/Scope": "marketing-site traffic
 * (~10^3 views/day; <1 M rows over 32 months)").
 *
 * Bulk-populates `analytics_events` / `analytics_visitors` with a synthetic,
 * reproducible dataset so the `bench-analytics.ts` scripts (T120/T121)
 * measure ingest and overview-query latency against a realistically sized
 * table, not an empty one.
 *
 * This is a DIFFERENT dataset from the small deterministic fixture set
 * `db:seed` installs for functional test assertions
 * (`src/seed/analyticsFixtureData.ts`, DoD-8) — running this script DELETES
 * every existing row in both analytics tables before inserting the synthetic
 * dataset, so it must only be run against a disposable or dedicated
 * performance-test database, never the shared functional-test database other
 * suites depend on.
 *
 * Determinism (constitution III): every random choice below is drawn from a
 * seeded PRNG (mulberry32), never `Math.random()`, and the "now" the
 * 32-month window is anchored to is a fixed constant, not the wall clock —
 * repeated runs against a freshly reset database always produce the
 * identical row count and distribution, satisfying the task's "Deterministic
 * script" requirement and "populates the test DB reproducibly" Done-when.
 *
 * Usage:
 *   pnpm --filter @modular-house/api exec tsx scripts/seed-analytics-perf.ts --confirm
 *
 * The `--confirm` flag (or `PERF_SEED_CONFIRM=1`) is required — omitting it
 * exits without touching the database, guarding against an accidental wipe
 * of a database's analytics tables.
 */
import { PrismaClient, type AnalyticsSourceGroup } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32) — constitution III: no Math.random().
// ---------------------------------------------------------------------------

/** Fixed seed constant so every run of this script is byte-identical. */
const PRNG_SEED = 0x2026_0728;

/**
 * mulberry32: a small, fast, seedable PRNG returning floats in [0, 1).
 * Public-domain algorithm; adequate statistical quality for synthetic
 * test-data generation — not used for anything security-sensitive.
 */
function mulberry32(seed: number): () => number {
  let a = seed;
  return function random(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(PRNG_SEED);

/** Uniformly random integer in [0, max). */
function randInt(max: number): number {
  return Math.floor(random() * max);
}

/** Weighted-random pick from a `[value, weight]` list. */
function weightedPick<T>(entries: ReadonlyArray<readonly [T, number]>): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

// ---------------------------------------------------------------------------
// Reference "now" (fixed, not wall-clock) and the 32-month window.
// ---------------------------------------------------------------------------

/** Fixed reference instant — never the live wall clock (determinism). */
const PERF_SEED_NOW = new Date('2026-07-28T12:00:00.000Z');
/** Plan Scale/Scope: "over 32 months". */
const PERF_SEED_MONTHS = 32;

function computeStartDate(now: Date, months: number): Date {
  const start = new Date(now);
  start.setUTCMonth(start.getUTCMonth() - months);
  return start;
}

// ---------------------------------------------------------------------------
// Realistic path/source/referrer distributions — the path pool mirrors the
// real site's routes (`apps/web/src/routes-metadata.ts`); the source weights
// and referrer hostnames mirror `services/trafficSource.ts`'s S2 SEARCH/
// SOCIAL lists so the synthetic dataset classifies exactly as real traffic
// would if replayed through the live ingest classifier.
// ---------------------------------------------------------------------------

const PATH_WEIGHTS: ReadonlyArray<readonly [string, number]> = [
  ['/', 40],
  ['/garden-rooms', 20],
  ['/house-extensions', 14],
  ['/gallery', 10],
  ['/about', 8],
  ['/contact', 6],
  ['/privacy', 1],
  ['/terms', 1],
];

const SOURCE_WEIGHTS: ReadonlyArray<readonly [AnalyticsSourceGroup, number]> = [
  ['SEARCH', 35],
  ['DIRECT', 30],
  ['SOCIAL', 15],
  ['REFERRAL', 12],
  ['CAMPAIGN', 8],
];

const SEARCH_REFERRERS = ['www.google.com', 'www.bing.com', 'duckduckgo.com'];
const SOCIAL_REFERRERS = ['www.facebook.com', 'www.instagram.com', 't.co', 'www.linkedin.com'];
const REFERRAL_REFERRERS = ['www.irishtimes.com', 'www.builder-directory.ie', 'www.homebuilding.co.uk'];
const CAMPAIGN_TAGS: ReadonlyArray<readonly [string, string, string]> = [
  ['newsletter', 'email', 'spring2026'],
  ['facebook', 'social', 'summer2026'],
  ['google', 'cpc', 'brand2026'],
];

/** Target average views/day (Scale/Scope: "~10^3 views/day"). */
const TARGET_AVG_VIEWS_PER_DAY = 900;
/** Hard cap so the total never approaches the <1 M-row ceiling. */
const MAX_TOTAL_EVENTS = 950_000;
/** Rows per `createMany` batch — large enough to be fast, small enough for one round trip. */
const INSERT_BATCH_SIZE = 5_000;

/** One synthetic page-view row, shaped exactly like `AnalyticsEvent`'s create input. */
interface PendingEvent {
  occurredAt: Date;
  path: string;
  visitorId: string;
  sessionId: string;
  sourceGroup: AnalyticsSourceGroup;
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

/** One synthetic visitor row, shaped exactly like `AnalyticsVisitor`'s create input. */
interface PendingVisitor {
  visitorId: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

/**
 * Generates the full synthetic dataset in memory, day by day from `start` to
 * `now`. Each day mints sessions (1-4 page views each) until that day's view
 * target is reached; each session's visitor is either a fresh one
 * (`crypto.randomUUID()`, first-seen now) or reused from the growing pool of
 * previously-seen visitors (a "returning" visitor), weighted 55% returning /
 * 45% new once the pool is non-empty — a rough but reasonable mix for
 * synthetic marketing-site traffic. Only a session's FIRST event carries the
 * referrer/utm signals that determined its source (S4: a session's source is
 * its first event's source), mirroring how a real multi-page visit looks —
 * subsequent in-session views are plain internal navigation.
 */
function generateDataset(
  start: Date,
  now: Date,
): { events: PendingEvent[]; visitors: Map<string, PendingVisitor> } {
  const events: PendingEvent[] = [];
  const visitors = new Map<string, PendingVisitor>();
  const visitorPool: string[] = [];

  const totalDays = Math.round((now.getTime() - start.getTime()) / 86_400_000);

  for (let day = 0; day < totalDays && events.length < MAX_TOTAL_EVENTS; day++) {
    const dayStart = new Date(start.getTime() + day * 86_400_000);
    // +/- 20% daily variance around the target average (realistic traffic noise).
    const dayTarget = Math.round(TARGET_AVG_VIEWS_PER_DAY * (0.8 + random() * 0.4));
    let viewsToday = 0;

    while (viewsToday < dayTarget && events.length < MAX_TOTAL_EVENTS) {
      const sessionId = randomUUID();
      const isReturning = visitorPool.length > 0 && random() < 0.55;
      const visitorId = isReturning ? visitorPool[randInt(visitorPool.length)] : randomUUID();

      const sourceGroup = weightedPick(SOURCE_WEIGHTS);
      const sessionMinuteOffset = randInt(24 * 60);
      const sessionStart = new Date(dayStart.getTime() + sessionMinuteOffset * 60_000);

      const pagesInSession = 1 + randInt(4); // 1-4 page views per session
      for (let p = 0; p < pagesInSession && viewsToday < dayTarget; p++) {
        const occurredAt = new Date(sessionStart.getTime() + p * (1 + randInt(8)) * 60_000);
        const path = weightedPick(PATH_WEIGHTS);

        let referrerHost: string | null = null;
        let utmSource: string | null = null;
        let utmMedium: string | null = null;
        let utmCampaign: string | null = null;
        if (p === 0) {
          if (sourceGroup === 'SEARCH') {
            referrerHost = SEARCH_REFERRERS[randInt(SEARCH_REFERRERS.length)];
          } else if (sourceGroup === 'SOCIAL') {
            referrerHost = SOCIAL_REFERRERS[randInt(SOCIAL_REFERRERS.length)];
          } else if (sourceGroup === 'REFERRAL') {
            referrerHost = REFERRAL_REFERRERS[randInt(REFERRAL_REFERRERS.length)];
          } else if (sourceGroup === 'CAMPAIGN') {
            const [utmSrc, utmMed, utmCamp] = CAMPAIGN_TAGS[randInt(CAMPAIGN_TAGS.length)];
            utmSource = utmSrc;
            utmMedium = utmMed;
            utmCampaign = utmCamp;
          }
        }

        events.push({
          occurredAt,
          path,
          visitorId,
          sessionId,
          sourceGroup,
          referrerHost,
          utmSource,
          utmMedium,
          utmCampaign,
        });

        const visitor = visitors.get(visitorId);
        if (!visitor) {
          visitors.set(visitorId, { visitorId, firstSeenAt: occurredAt, lastSeenAt: occurredAt });
          visitorPool.push(visitorId);
        } else if (occurredAt > visitor.lastSeenAt) {
          visitor.lastSeenAt = occurredAt;
        }

        viewsToday++;
      }
    }
  }

  return { events, visitors };
}

// ---------------------------------------------------------------------------
// Batched persistence
// ---------------------------------------------------------------------------

/** Inserts `rows` via `insert` in fixed-size chunks (one round trip per chunk). */
async function insertInBatches<T>(
  rows: T[],
  batchSize: number,
  insert: (batch: T[]) => Promise<unknown>,
): Promise<void> {
  for (let i = 0; i < rows.length; i += batchSize) {
    await insert(rows.slice(i, i + batchSize));
  }
}

async function main(): Promise<void> {
  const confirmed = process.argv.includes('--confirm') || process.env.PERF_SEED_CONFIRM === '1';
  if (!confirmed) {
    console.error(
      'seed-analytics-perf: refusing to run without --confirm (or PERF_SEED_CONFIRM=1).\n' +
        'This DELETES all existing analytics_events/analytics_visitors rows before\n' +
        'inserting ~32 months of synthetic data. Run only against a disposable or\n' +
        'dedicated performance-test database, never a shared functional-test DB.',
    );
    process.exitCode = 1;
    return;
  }

  const start = computeStartDate(PERF_SEED_NOW, PERF_SEED_MONTHS);
  console.log(`Generating synthetic dataset: ${start.toISOString()} .. ${PERF_SEED_NOW.toISOString()}`);

  const { events, visitors } = generateDataset(start, PERF_SEED_NOW);
  console.log(`Generated ${events.length} events across ${visitors.size} visitors.`);

  console.log('Clearing existing analytics rows...');
  await prisma.analyticsEvent.deleteMany();
  await prisma.analyticsVisitor.deleteMany();

  console.log('Inserting visitors...');
  await insertInBatches(Array.from(visitors.values()), INSERT_BATCH_SIZE, (batch) =>
    prisma.analyticsVisitor.createMany({ data: batch }),
  );

  console.log('Inserting events...');
  await insertInBatches(events, INSERT_BATCH_SIZE, (batch) =>
    prisma.analyticsEvent.createMany({ data: batch }),
  );

  console.log(`Done: ${visitors.size} visitors, ${events.length} events seeded.`);
}

main()
  .catch((error) => {
    console.error('seed-analytics-perf failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
