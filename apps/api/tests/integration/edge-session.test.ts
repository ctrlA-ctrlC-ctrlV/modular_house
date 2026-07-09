/**
 * T119 — E-SESSION: session/refresh edge tests (backend).
 *
 * Asserts server-side E4/E5 boundary behaviour as non-regression gates:
 *
 *   E4 — Reuse of a revoked refresh token revokes the entire token family,
 *        including any successor tokens already issued in that family.
 *        This is the server-side theft-detection mechanism.
 *
 *   E5 — Logout revokes only the current session's refresh-token family.
 *        Other concurrent sessions (different families, same user) remain
 *        valid and continue to rotate normally.
 *
 * The backend AuthService already satisfies both invariants; these tests pin
 * the exact boundary behaviour so regressions are caught immediately.
 *
 * No injected clock is required — neither reuse detection nor logout are
 * time-sensitive; they depend on the `revokedAt` field set atomically.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';

describe('E-SESSION — session/refresh edge cases', () => {
  const password = 'ValidPass123!';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `edge-session-${Date.now()}@example.com`;
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
  });

  beforeEach(async () => {
    await resetAdminTables(userId);
    await prisma.refreshToken.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  /**
   * Perform a real verify-2fa to obtain a valid refresh cookie and access
   * token for the test user.  Uses real wall-clock time so the route's
   * default AuthService clock sees the OTP as unexpired.
   *
   * Returns:
   *   accessToken — JWT to pass as `Authorization: Bearer <token>`
   *   cookiePair  — `refreshToken=<value>` suitable for a Cookie header
   */
  async function loginAndGetCookie(): Promise<{
    accessToken: string;
    cookiePair: string;
  }> {
    // Real wall clock so the route's default AuthService accepts the code.
    const clock = createClock(new Date());
    const loginCodeService = new LoginCodeService(prisma, clock.now);
    const { challengeId, code } = await loginCodeService.issue(userId);

    const res = await request(app)
      .post('/admin/auth/verify-2fa')
      .send({ challengeId, code });

    if (res.status !== 200) {
      throw new Error(`verify-2fa failed: ${res.status} ${JSON.stringify(res.body)}`);
    }

    const setCookie = res.headers['set-cookie'];
    const cookieStr: string = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    // Extract `name=value` only — browsers strip cookie attributes when
    // sending the Cookie request header back to the server.
    const cookiePair = cookieStr.split(';')[0].trim();

    return { accessToken: res.body.accessToken as string, cookiePair };
  }

  // ── E4 ──────────────────────────────────────────────────────────────────────

  it(
    'reuse of a revoked refresh token revokes the entire family, ' +
      'including successor tokens already issued in that family (E4)',
    async () => {
      // Issue session: token A (family F).
      const { cookiePair: cookieA } = await loginAndGetCookie();

      // Rotate: token A → token B (same family F). Token A is now revoked.
      const rotateRes = await request(app)
        .post('/admin/auth/refresh')
        .set('Cookie', cookieA);
      expect(rotateRes.status).toBe(200);

      // Capture the rotated cookie (token B).
      const rotatedSetCookie = rotateRes.headers['set-cookie'];
      const cookieB = (
        Array.isArray(rotatedSetCookie) ? rotatedSetCookie[0] : rotatedSetCookie
      )
        .split(';')[0]
        .trim();

      // Reuse the already-revoked token A.  This should:
      //   (a) return 401 immediately, and
      //   (b) revoke the entire family F (theft detection per E4).
      const reuseRes = await request(app)
        .post('/admin/auth/refresh')
        .set('Cookie', cookieA);
      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body).not.toHaveProperty('accessToken');

      // Token B was the valid successor in family F.  After the full-family
      // revocation triggered by the A reuse, B must also be rejected (E4).
      const bRes = await request(app)
        .post('/admin/auth/refresh')
        .set('Cookie', cookieB);
      expect(bRes.status).toBe(401);
      expect(bRes.body).not.toHaveProperty('accessToken');
    },
  );

  // ── E5 ──────────────────────────────────────────────────────────────────────

  it(
    'logout revokes only the current session\'s refresh-token family; ' +
      'other concurrent sessions for the same account remain valid (E5)',
    async () => {
      // Session 1: first verify-2fa → refresh-token family X.
      const { accessToken: accessTokenA, cookiePair: cookieA } = await loginAndGetCookie();

      // Session 2: a second, independent verify-2fa → refresh-token family Y.
      // No table reset between the two calls — both sessions must coexist.
      const { cookiePair: cookieB } = await loginAndGetCookie();

      // Logout of session 1.  The logout route requires a valid access token
      // (authenticateJWT guard) and reads the refresh cookie to derive the
      // family to revoke (E5 — current-family-only).
      const logoutRes = await request(app)
        .post('/admin/auth/logout')
        .set('Authorization', `Bearer ${accessTokenA}`)
        .set('Cookie', cookieA);
      expect(logoutRes.status).toBe(204);

      // Session 1 refresh must be rejected — family X is now revoked.
      const refreshARes = await request(app)
        .post('/admin/auth/refresh')
        .set('Cookie', cookieA);
      expect(refreshARes.status).toBe(401);
      expect(refreshARes.body).not.toHaveProperty('accessToken');

      // Session 2 refresh must still succeed — only family X was revoked,
      // not family Y (E5: logout revokes only the current session's family).
      const refreshBRes = await request(app)
        .post('/admin/auth/refresh')
        .set('Cookie', cookieB);
      expect(refreshBRes.status).toBe(200);
      expect(refreshBRes.body).toHaveProperty('accessToken');
    },
  );
});
