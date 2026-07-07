/**
 * T046 — POST /admin/auth/logout integration tests (E5).
 *
 * Asserts the Phase 1 logout contract:
 *   - authenticated + valid cookie → 204, family revoked, cookie cleared
 *   - the revoked refresh credential cannot be reused afterward
 *   - unauthenticated → 401
 *
 * The current route stub returns 204 unconditionally; tests that require
 * cookie revocation / authentication will fail until T047 is completed.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';

describe('POST /admin/auth/logout', () => {
  const password = 'ValidPass123!';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `logout-test-${Date.now()}@example.com`;
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
   * Complete verify-2fa to obtain a valid access token and refresh cookie.
   * Uses real wall-clock time so the route's default AuthService clock
   * sees the code as valid.
   */
  async function getSession(): Promise<{
    accessToken: string;
    cookiePair: string;
  }> {
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
    const cookiePair = cookieStr.split(';')[0].trim();

    return { accessToken: res.body.accessToken as string, cookiePair };
  }

  it('returns 204, revokes the current family, and clears the cookie (E5)', async () => {
    const { accessToken, cookiePair } = await getSession();

    const res = await request(app)
      .post('/admin/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookiePair);

    expect(res.status).toBe(204);

    // Session ended: Set-Cookie must clear the existing refresh cookie.
    const newCookies = res.headers['set-cookie'];
    if (newCookies) {
      const newCookieStr: string = Array.isArray(newCookies) ? newCookies[0] : newCookies;
      // Express clearCookie sets an empty cookie value with the same
      // domain/path; a cleared cookie will show up as 'refreshToken=;'.
      expect(newCookieStr).toMatch(/refreshToken=;/);
    }

    // The refresh credential must be unusable afterward (E5).
    const refreshRes = await request(app)
      .post('/admin/auth/refresh')
      .set('Cookie', cookiePair);
    expect(refreshRes.status).toBe(401);
  });

  it('returns 401 when no access token is provided', async () => {
    const { cookiePair } = await getSession();

    const res = await request(app)
      .post('/admin/auth/logout')
      .set('Cookie', cookiePair);

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      error: expect.any(String),
      message: expect.any(String),
    });
  });
});
