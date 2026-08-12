/**
 * T091 — ingest validation boundary unit tests (E-INGEST, validation).
 *
 * Exercises every branch of `ingestEventSchema` (plan §2.3 M2) directly via
 * `safeParse`, independent of the HTTP layer, plus one HTTP-level assertion
 * for the 4 KB request-body cap (M2's size bound is enforced by the route,
 * not the schema — see `routes/analytics.ts` T093). This suite is the
 * DoD-3 100%-branch-coverage basis for ingest validation: every accept/reject
 * pair below exercises both sides of its corresponding schema constraint.
 *
 * Each boundary is asserted as an accept/reject pair at the exact pinned M2
 * threshold (mirroring the plan's own "512 accepted / 513 rejected" framing)
 * so a future change to a bound value fails loudly on the wrong side of the
 * line, rather than merely "somewhere over the limit".
 *
 * The 4 KB body-cap case is deliberately red at authoring time: Pass 2's
 * route has no body-size enforcement yet (only the app-wide 10 MB limit in
 * app.ts, mounted before this router — see research/plan discussion), so an
 * oversized-but-schema-valid payload (padded with insignificant JSON
 * whitespace so every field individually still satisfies M2) is currently
 * accepted and stored. T093 closes this by adding a route-level cap; this
 * test flips green only once that lands.
 *
 * Done when: every case above passes at the schema level (already true
 * against the Pass 2 schema); the 4 KB case is red until T093.
 */
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app.js';
import { ingestEventSchema } from '../../src/services/analyticsIngest.js';

describe('analyticsIngest validation boundaries (T091, E-INGEST)', () => {
  // ---------------------------------------------------------------------
  // path — required, must start with "/", length in [1, 512] (M2)
  // ---------------------------------------------------------------------
  describe('path', () => {
    it('accepts a 512-character path (upper M2 bound)', () => {
      const path = `/${'a'.repeat(511)}`;
      expect(path).toHaveLength(512);
      expect(ingestEventSchema.safeParse({ path }).success).toBe(true);
    });

    it('rejects a 513-character path (one over the M2 bound)', () => {
      const path = `/${'a'.repeat(512)}`;
      expect(path).toHaveLength(513);
      expect(ingestEventSchema.safeParse({ path }).success).toBe(false);
    });

    it('rejects a missing path', () => {
      expect(ingestEventSchema.safeParse({}).success).toBe(false);
    });

    it('rejects an empty-string path (below the M2 minimum length of 1)', () => {
      expect(ingestEventSchema.safeParse({ path: '' }).success).toBe(false);
    });

    it('rejects a path not starting with "/"', () => {
      expect(ingestEventSchema.safeParse({ path: 'garden-rooms' }).success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------
  // unknown fields — rejected outright (M2, .strict())
  // ---------------------------------------------------------------------
  describe('unknown fields', () => {
    it('rejects a payload carrying a field outside the M2 schema', () => {
      const result = ingestEventSchema.safeParse({ path: '/a', trackingId: 'unexpected' });
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------
  // referrer — optional, length <= 2048 (M2)
  // ---------------------------------------------------------------------
  describe('referrer', () => {
    it('accepts a 2048-character referrer (upper M2 bound)', () => {
      const referrer = 'a'.repeat(2048);
      expect(ingestEventSchema.safeParse({ path: '/a', referrer }).success).toBe(true);
    });

    it('rejects a 2049-character referrer (one over the M2 bound)', () => {
      const referrer = 'a'.repeat(2049);
      expect(ingestEventSchema.safeParse({ path: '/a', referrer }).success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------
  // utmSource / utmMedium / utmCampaign — optional, length <= 100 each (M2)
  // ---------------------------------------------------------------------
  describe.each(['utmSource', 'utmMedium', 'utmCampaign'] as const)('%s', (field) => {
    it('accepts a 100-character value (upper M2 bound)', () => {
      const result = ingestEventSchema.safeParse({ path: '/a', [field]: 'a'.repeat(100) });
      expect(result.success).toBe(true);
    });

    it('rejects a 101-character value (one over the M2 bound)', () => {
      const result = ingestEventSchema.safeParse({ path: '/a', [field]: 'a'.repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------
  // adClick — optional boolean (M2)
  // ---------------------------------------------------------------------
  describe('adClick', () => {
    it('accepts adClick: true', () => {
      expect(ingestEventSchema.safeParse({ path: '/a', adClick: true }).success).toBe(true);
    });

    it('accepts adClick: false', () => {
      expect(ingestEventSchema.safeParse({ path: '/a', adClick: false }).success).toBe(true);
    });

    it('rejects a non-boolean adClick', () => {
      const result = ingestEventSchema.safeParse({ path: '/a', adClick: 'yes' });
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------
  // 4 KB request-body cap (M2) — HTTP layer, not the schema
  // ---------------------------------------------------------------------
  describe('4 KB body cap (HTTP layer)', () => {
    // A dedicated visitor id isolates this test's rows from the shared
    // analytics seed and every other suite (repo convention — see
    // tests/integration/analytics-ingest.test.ts).
    const oversizeVisitorId = randomUUID();
    const prisma = new PrismaClient();

    afterAll(async () => {
      await prisma.analyticsEvent.deleteMany({ where: { visitorId: oversizeVisitorId } });
      await prisma.analyticsVisitor.deleteMany({ where: { visitorId: oversizeVisitorId } });
      await prisma.$disconnect();
    });

    it('rejects a schema-valid payload whose raw body exceeds 4 KB with 400', async () => {
      // Padding lands as insignificant JSON whitespace immediately before the
      // closing brace, so the parsed payload is `{ path: '/a' }` — every
      // field individually satisfies M2 — while the raw wire body exceeds
      // the 4 KB (4096-byte) cap by exactly one byte. This isolates the
      // size-cap boundary from the per-field length boundaries above.
      const prefix = '{"path":"/a"';
      const suffix = '}';
      const targetBytes = 4096 + 1;
      const padding = ' '.repeat(targetBytes - prefix.length - suffix.length);
      const oversizedBody = prefix + padding + suffix;
      expect(Buffer.byteLength(oversizedBody)).toBe(targetBytes);

      const res = await request(app)
        .post('/api/analytics/events')
        .set('Content-Type', 'application/json')
        .set('Cookie', `mh_vid=${oversizeVisitorId}`)
        .send(oversizedBody);

      expect(res.status).toBe(400);
    });
  });
});
