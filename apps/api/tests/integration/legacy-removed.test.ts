/**
 * T097 — Legacy admin fully removed (regression).
 *
 * Backend half of the DoD-4 / FR-001 / SC-007 sanity check: no flat/legacy
 * admin route shape is reachable, the login contract no longer mints a raw
 * token on the first step, and the retained content endpoints (re-gated in
 * T029) still refuse ungated access. Individual endpoints already have
 * dedicated coverage (auth-login.test.ts, legacy-endpoints-regate.test.ts);
 * this file is the consolidated, final regression pass tying those
 * guarantees together in one place.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';

// Mock the SMTP mailer so the login call in this suite does not attempt a
// real network send.
vi.mock('../../src/services/mailer.js', () => {
  class MockMailerService {
    sendEmail = vi.fn().mockResolvedValue({
      success: true,
      messageId: 'mock-message-id',
      attempt: 1,
      timestamp: new Date(),
    });
    close = vi.fn().mockResolvedValue(undefined);
  }
  return {
    MailerService: MockMailerService,
    mailer: new MockMailerService(),
  };
});

describe('Legacy admin fully removed (regression, T097)', () => {
  // ── No flat/legacy admin route shape is registered ───────────────────
  //
  // The current router only mounts nested sub-paths (/admin/auth/*,
  // /admin/pages/*, etc. — see apps/api/src/app.ts). A flat legacy shape
  // (bare /admin, or /admin/login and /admin/logout without the /auth
  // segment used by the very first admin-auth implementation) must never
  // resolve, guarding against a future regression reintroducing one.

  describe('Unregistered legacy-shaped paths return 404', () => {
    const legacyPaths: Array<[method: 'get' | 'post', path: string]> = [
      ['get', '/admin'],
      ['get', '/admin/login'],
      ['post', '/admin/login'],
      ['post', '/admin/logout'],
      ['get', '/admin/dashboard'],
    ];

    it.each(legacyPaths)('%s %s is not registered', async (method, path) => {
      const res = await request(app)[method](path);
      expect(res.status).toBe(404);
    });
  });

  // ── Login no longer mints a raw token on the first step ──────────────

  describe('Login contract no longer returns a raw token (FR-007, SC-001)', () => {
    const password = 'ValidPass123!';
    let userId: string;
    let email: string;

    beforeAll(async () => {
      const role = await prisma.role.findUnique({ where: { name: 'admin' } });
      if (!role) {
        throw new Error('admin role not found');
      }

      email = `legacy-removed-test-${Date.now()}@example.com`;
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: await argon2.hash(password),
          roleId: role.id,
          isActive: true,
          failedLoginAttempts: 0,
        },
      });
      userId = user.id;
      await resetAdminTables(userId);
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
      await disconnectDb();
    });

    it('returns a TwoFactorChallenge, never the legacy 200+token shape', async () => {
      const res = await request(app).post('/admin/auth/login').send({ email, password });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ challengeId: expect.any(String) });
      expect(res.body).not.toHaveProperty('token');
      expect(res.body).not.toHaveProperty('accessToken');
      expect(res.body).not.toHaveProperty('user');
      expect(res.body).not.toHaveProperty('roles');
    });
  });

  // ── Retained content endpoints stay gated, not openly reachable ──────

  describe('Retained endpoints require authentication (re-gated, not legacy-open)', () => {
    const retainedEndpoints = [
      '/admin/pages',
      '/admin/gallery',
      '/admin/faqs',
      '/admin/submissions',
      '/admin/redirects',
    ];

    it.each(retainedEndpoints)('GET %s rejects an unauthenticated request', async (path) => {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
    });
  });
});
