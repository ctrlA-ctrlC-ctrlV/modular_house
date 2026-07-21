/**
 * T041 — analytics privacy-audit integration test (T-B8).
 *
 * Asserts the privacy floor pinned in plan §2.7 R2 / §2.3 M7 / §2.4 S5 and
 * the constitution's Data Minimization rule (constitution I): the analytics
 * tables store NO personal data — no IP address, no User-Agent string, and no
 * full referrer URL — and the stored `referrerHost` is always a bare hostname
 * (no scheme, path, or query string). The audit runs at two layers:
 *
 * 1. **Schema layer (green from T003).** Uses the Prisma DMMF
 *    (`Prisma.dmmf.datamodel.models`) to introspect the field set of
 *    `AnalyticsEvent` and `AnalyticsVisitor` and assert each model's columns
 *    are EXACTLY the data-model list (data-model.md §2/§3). An exact field-set
 *    equality proves no IP / UA / full-referrer-URL column exists, because any
 *    such column would widen the set. A targeted forbidden-name check makes
 *    the privacy intent legible to future readers. These assertions are
 *    independent of the ingest endpoint and pass as soon as the schema lands
 *    (T003 already shipped it).
 *
 * 2. **Row layer (red until T044 mounts the route).** Posts real events
 *    carrying an `X-Forwarded-For` IP and a `User-Agent` header plus a full
 *    referrer URL (`https://www.google.com/search?q=...`), then reads the
 *    stored rows back and asserts: the response is 204, exactly one event
 *    row exists, `referrerHost` is the bare hostname (no `://`, no `/`, no
 *    `?`), the row's keys are exactly the data-model columns (no IP/UA field
 *    leaked in), and a no-referrer event stores `referrerHost = null`. These
 *    assertions stay red — `expected 404 to be 204` — until T042 (service) +
 *    T043 (route) + T044 (app mount) land; they are the row-level red the
 *    task's "Done when" requires.
 *
 * Clock strategy: mirrors `analytics-ingest.test.ts` (T039/T040) — the T005
 * `createAnalyticsClock` / `ANALYTICS_FIXED_NOW` helpers provide the
 * deterministic epoch, and `vi.useFakeTimers({ toFake: ['Date'] })` bridges
 * the injected clock to the route's `new Date()` so `occurredAt` is
 * reproducible (constitution III). Prisma I/O and supertest stay real.
 *
 * Seed isolation: every test mints a fresh `crypto.randomUUID()` visitor /
 * session pair and cleans up only its own rows, so the shared analytics seed
 * (T006) and the overview / realtime suites are never disturbed.
 */
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { PrismaClient, Prisma } from '@prisma/client';
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
 * deterministic epoch (constitution III).
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

// ---------------------------------------------------------------------------
// The exact column names the data model permits on each analytics table
// (data-model.md §2 / §3). Any IP / UA / full-referrer-URL column would widen
// these sets, so exact equality is the privacy-floor proof.
// ---------------------------------------------------------------------------
const ANALYTICS_EVENT_FIELDS = [
  'id',
  'occurredAt',
  'path',
  'visitorId',
  'sessionId',
  'sourceGroup',
  'referrerHost',
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'createdAt',
] as const;

const ANALYTICS_VISITOR_FIELDS = [
  'visitorId',
  'firstSeenAt',
  'lastSeenAt',
] as const;

/**
 * Forbidden column names that would indicate personal-data storage (R2/M7).
 * Compared by exact (case-insensitive) string equality — never a substring
 * match — so legitimate fields like `referrerHost` and `visitorId` never
 * produce a false positive. The exact field-set equality above is the
 * definitive check; this list makes the privacy intent explicit for readers.
 */
const FORBIDDEN_COLUMN_NAMES = [
  'ip',
  'ipaddress',
  'clientip',
  'remoteip',
  'useragent',
  'user_agent',
  'ua',
  'referrer',
  'referrerurl',
  'fullreferrer',
];

/**
 * Assert every field name in `fieldNames` is absent from
 * `FORBIDDEN_COLUMN_NAMES` (case-insensitive exact match).
 */
function assertNoForbiddenColumns(fieldNames: string[]): void {
  for (const name of fieldNames) {
    const lower = name.toLowerCase();
    for (const forbidden of FORBIDDEN_COLUMN_NAMES) {
      expect(lower).not.toBe(forbidden);
    }
  }
}

/**
 * Read a model's field names from the Prisma DMMF. Returns the declared field
 * names (not the `@map` column names) so the assertion binds to the Prisma
 * schema the application code reads/writes through.
 */
function getModelFieldNames(modelName: string): string[] {
  const model = Prisma.dmmf.datamodel.models.find((m) => m.name === modelName);
  expect(model).toBeDefined();
  // Narrow the nullable type without a non-null assertion (repo convention:
  // `as NonNullable<typeof x>` — see analytics-ingest.test.ts).
  const m = model as NonNullable<typeof model>;
  return m.fields.map((f) => f.name);
}

describe('analytics privacy audit (T041, T-B8)', () => {
  // Shared hooks: reset the injected clock, fake only `Date` so Prisma I/O
  // and supertest stay real, and clean up this file's minted rows.
  beforeEach(async () => {
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
  // Schema layer — no personal-data columns (R2/M7). Green from T003.
  // -------------------------------------------------------------------------
  describe('schema — no personal-data columns (R2/M7)', () => {
    it('AnalyticsEvent has exactly the data-model fields — no IP/UA/full-referrer-URL column', () => {
      const fieldNames = getModelFieldNames('AnalyticsEvent');
      // Exact field-set equality: any IP / UA / full-referrer-URL column would
      // widen this set, so equality is the privacy-floor proof (data-model §2).
      expect(fieldNames.sort()).toEqual([...ANALYTICS_EVENT_FIELDS].sort());
      // Targeted check makes the privacy intent legible to future readers.
      assertNoForbiddenColumns(fieldNames);
    });

    it('AnalyticsVisitor has exactly the data-model fields — no IP/UA/full-referrer-URL column', () => {
      const fieldNames = getModelFieldNames('AnalyticsVisitor');
      // Exact field-set equality (data-model §3).
      expect(fieldNames.sort()).toEqual([...ANALYTICS_VISITOR_FIELDS].sort());
      assertNoForbiddenColumns(fieldNames);
    });
  });

  // -------------------------------------------------------------------------
  // Row layer — stored data is anonymous (R2/M7/S5). RED until T044.
  // -------------------------------------------------------------------------
  describe('rows — stored data is anonymous (R2/M7/S5)', () => {
    it('stores referrerHost as hostname only — no scheme, path, or query string (S5)', async () => {
      const visitorId = randomUUID();
      const sessionId = randomUUID();
      createdVisitorIds.push(visitorId);

      // Send a full referrer URL with scheme + path + query. The stored
      // `referrerHost` must be the bare hostname only (S5).
      const res = await request(app)
        .post('/api/analytics/events')
        .set('Cookie', analyticsCookieHeader(visitorId, sessionId))
        .send({
          path: '/garden-rooms',
          referrer: 'https://www.google.com/search?q=garden+rooms',
        });
      expect(res.status).toBe(204);

      const events = await prisma.analyticsEvent.findMany({ where: { visitorId } });
      expect(events).toHaveLength(1);
      const event = events[0];
      // S5: hostname only.
      expect(event.referrerHost).toBe('www.google.com');
      // No scheme, path, or query string ever leaks into the stored value.
      expect(event.referrerHost).not.toMatch(/:\/\//);
      expect(event.referrerHost).not.toMatch(/\//);
      expect(event.referrerHost).not.toMatch(/\?/);
    });

    it('stores a short-host referrer as hostname only (S5)', async () => {
      const visitorId = randomUUID();
      const sessionId = randomUUID();
      createdVisitorIds.push(visitorId);

      const res = await request(app)
        .post('/api/analytics/events')
        .set('Cookie', analyticsCookieHeader(visitorId, sessionId))
        .send({ path: '/about', referrer: 'https://t.co/abc123?utm=1' });
      expect(res.status).toBe(204);

      const events = await prisma.analyticsEvent.findMany({ where: { visitorId } });
      expect(events).toHaveLength(1);
      // The path and query are stripped — only the hostname remains.
      expect(events[0].referrerHost).toBe('t.co');
    });

    it('stores null referrerHost when no referrer is sent (S3/S5)', async () => {
      const visitorId = randomUUID();
      const sessionId = randomUUID();
      createdVisitorIds.push(visitorId);

      const res = await request(app)
        .post('/api/analytics/events')
        .set('Cookie', analyticsCookieHeader(visitorId, sessionId))
        .send({ path: '/about' });
      expect(res.status).toBe(204);

      const events = await prisma.analyticsEvent.findMany({ where: { visitorId } });
      expect(events).toHaveLength(1);
      // No referrer in the payload -> DIRECT (S3) and referrerHost is null.
      expect(events[0].referrerHost).toBeNull();
    });

    it('stored event row contains only the data-model columns even when IP and UA headers are present (R2/M7)', async () => {
      const visitorId = randomUUID();
      const sessionId = randomUUID();
      createdVisitorIds.push(visitorId);

      // Deliberately send an IP (X-Forwarded-For) and a User-Agent header so
      // the audit proves they are never persisted (M7: both used transiently
      // only). A full referrer URL is also sent to prove only the hostname is
      // stored (S5).
      const res = await request(app)
        .post('/api/analytics/events')
        .set('Cookie', analyticsCookieHeader(visitorId, sessionId))
        .set('X-Forwarded-For', '203.0.113.42')
        .set('User-Agent', 'Mozilla/5.0 (test) Chrome/120')
        .send({
          path: '/garden-rooms',
          referrer: 'https://www.google.com/search?q=garden+rooms',
        });
      expect(res.status).toBe(204);

      const events = await prisma.analyticsEvent.findMany({ where: { visitorId } });
      expect(events).toHaveLength(1);
      const event = events[0];
      // The row's keys are exactly the data-model columns — no IP / UA /
      // full-referrer-URL field appears even though the request carried both
      // an IP and a UA header (R2/M7).
      const keys = Object.keys(event).sort();
      expect(keys).toEqual([...ANALYTICS_EVENT_FIELDS].sort());
      // The referrer is hostname only — no PII vector via the referrer URL.
      expect(event.referrerHost).toBe('www.google.com');
    });

    it('stored visitor row contains only the data-model columns (R2)', async () => {
      const visitorId = randomUUID();
      const sessionId = randomUUID();
      createdVisitorIds.push(visitorId);

      const res = await request(app)
        .post('/api/analytics/events')
        .set('Cookie', analyticsCookieHeader(visitorId, sessionId))
        .send({ path: '/about' });
      expect(res.status).toBe(204);

      const visitor = await prisma.analyticsVisitor.findUnique({
        where: { visitorId },
      });
      expect(visitor).not.toBeNull();
      const v = visitor as NonNullable<typeof visitor>;
      // The visitor row carries only visitorId + firstSeenAt + lastSeenAt —
      // no IP, UA, or any other personal-data column (R2).
      const keys = Object.keys(v).sort();
      expect(keys).toEqual([...ANALYTICS_VISITOR_FIELDS].sort());
    });
  });
});
