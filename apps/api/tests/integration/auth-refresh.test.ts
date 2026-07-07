/**
 * T044 — POST /admin/auth/refresh integration tests.
 *
 * Asserts the Phase 1 refresh-token rotation contract:
 *   - valid cookie              → 200 new access token + rotated Set-Cookie (E3/E4)
 *   - missing cookie            → 401
 *   - expired refresh token     → 401
 *   - reused revoked token      → 401 (reuse revokes entire family per E4)
 *   - idle timeout exceeded     → 401 (E7)
 *
 * The route does not exist yet; all tests fail with 404 until T045 is completed.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';
import {
  ACCESS_TOKEN_TTL_MS,
  IDLE_TIMEOUT_MS,
} from '../../src/config/adminAuth.js';
import { config } from '../../src/config/env.js';

describe('POST /admin/auth/refresh', () => {
  const password = 'ValidPass123!';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `refresh-test-${Date.now()}@example.com`;
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
   * Complete verify-2fa to obtain a valid refresh cookie for the test user.
   *
   * Routes through the real app so the cookie format matches what the browser
   * receives in production.  Returns the raw `refreshToken=<value>` pair
   * suitable for a request `Cookie` header and the parsed raw token value.
   */
  async function getRefreshCookie(): Promise<{
    accessToken: string;
    cookiePair: string;
    rawToken: string;
  }> {
    // Use real wall-clock time so the route's default real-time AuthService
    // sees the code as valid (default createClock epoch does not match real time).
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

    // Extract just the `name=value` pair (a browser strips attributes when
    // sending the Cookie header back to the server).
    const cookiePair = cookieStr.split(';')[0].trim();
    const rawToken = cookiePair.slice('refreshToken='.length);

    return { accessToken: res.body.accessToken as string, cookiePair, rawToken };
  }

  /** SHA-256 hash matching AuthService.hashToken(). */
  function hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  // ---------------------------------------------------------------------------
  // Tests — every assertion must FAIL before route implementation (T045).
  // ---------------------------------------------------------------------------

  it('returns 200 with new access token and rotated refresh cookie on valid token (E3/E4)', async () => {
    const { cookiePair } = await getRefreshCookie();

    const res = await request(app)
      .post('/admin/auth/refresh')
      .set('Cookie', cookiePair);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      accessToken: expect.any(String),
      expiresIn: ACCESS_TOKEN_TTL_MS / 1000,
      user: {
        id: userId,
        email,
        role: 'admin',
        permissions: expect.any(Array),
      },
    });

    // Access token must be a valid JWT carrying E1 claims.
    const decoded = jwt.verify(res.body.accessToken, config.security.jwtSecret) as {
      userId: string;
      email: string;
      role: string;
      permissions: string[];
    };
    expect(decoded.userId).toBe(userId);
    expect(decoded.email).toBe(email);
    expect(decoded.role).toBe('admin');
    expect(Array.isArray(decoded.permissions)).toBe(true);

    // Refresh cookie must be rotated: a new Set-Cookie header is present (E4).
    const newCookies = res.headers['set-cookie'];
    expect(newCookies).toBeDefined();
    const newCookieStr: string = Array.isArray(newCookies) ? newCookies[0] : newCookies;
    expect(newCookieStr).toMatch(/refreshToken=/);
    expect(newCookieStr).toMatch(/HttpOnly/);
    expect(newCookieStr).toMatch(/SameSite=Strict/i);
  });

  it('returns 401 when no refresh cookie is provided', async () => {
    const res = await request(app).post('/admin/auth/refresh');

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      error: expect.any(String),
      message: expect.any(String),
    });
    expect(res.body).not.toHaveProperty('accessToken');
  });

  it('returns 401 when the refresh token has expired', async () => {
    const { cookiePair, rawToken } = await getRefreshCookie();
    const tokenHash = hashToken(rawToken);

    // Rewind the token's expiresAt so the absolute-expiry check fires.
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { expiresAt: new Date(Date.now() - 3600_000) },
    });

    const res = await request(app)
      .post('/admin/auth/refresh')
      .set('Cookie', cookiePair);

    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty('accessToken');
  });

  it('returns 401 on reuse of a revoked token and revokes the entire family (E4)', async () => {
    const { cookiePair: cookieAPair } = await getRefreshCookie();

    // Rotate once: token A is revoked, token B is issued in the same family.
    const rotateRes = await request(app)
      .post('/admin/auth/refresh')
      .set('Cookie', cookieAPair);
    expect(rotateRes.status).toBe(200);

    const newCookies = rotateRes.headers['set-cookie'];
    const cookieBStr: string = Array.isArray(newCookies) ? newCookies[0] : newCookies;
    const cookieBPair = cookieBStr.split(';')[0].trim();

    // Reuse the now-revoked token A — must be rejected (401).
    const reuseRes = await request(app)
      .post('/admin/auth/refresh')
      .set('Cookie', cookieAPair);
    expect(reuseRes.status).toBe(401);

    // Token B shares the same family as A; reuse of A must have revoked the
    // entire family (E4), so token B is now also invalid.
    const afterReuseRes = await request(app)
      .post('/admin/auth/refresh')
      .set('Cookie', cookieBPair);
    expect(afterReuseRes.status).toBe(401);
  });

  it('returns 401 when the idle timeout is exceeded (E7)', async () => {
    const { cookiePair, rawToken } = await getRefreshCookie();
    const tokenHash = hashToken(rawToken);

    // Rewind lastUsedAt so the idle-timeout check (30m) fires.
    const idlePast = new Date(Date.now() - IDLE_TIMEOUT_MS - 60_000);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { lastUsedAt: idlePast },
    });

    const res = await request(app)
      .post('/admin/auth/refresh')
      .set('Cookie', cookiePair);

    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty('accessToken');
  });
});
