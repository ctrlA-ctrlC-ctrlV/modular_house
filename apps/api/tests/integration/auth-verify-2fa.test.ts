/**
 * T036 — POST /admin/auth/verify-2fa integration tests (T-B1).
 *
 * Asserts the Phase 1 OTP verification / session-establishment contract:
 *   - correct code → 200 Session + Set-Cookie refresh token
 *   - wrong code → 401
 *   - expired code → 401
 *   - consumed code (reuse) → 401
 *   - locked code (5 wrong attempts) → 401
 *   - malformed request → 400
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';
import { ACCESS_TOKEN_TTL_MS, OTP_MAX_ATTEMPTS, OTP_TTL_MS } from '../../src/config/adminAuth.js';
import { config } from '../../src/config/env.js';

describe('POST /admin/auth/verify-2fa', () => {
  const password = 'ValidPass123!';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found');
    }

    email = `verify-2fa-test-${Date.now()}@example.com`;
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
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  /**
   * Helper: issue a fresh OTP for the test user using an optional injected clock.
   * Defaults to the current wall-clock time so the route's default real-time clock
   * sees the code as valid; callers that need an expired code pass a past initial time.
   */
  async function issueCode(initial?: Date) {
    const clock = createClock(initial ?? new Date());
    const loginCodeService = new LoginCodeService(prisma, clock.now);
    return loginCodeService.issue(userId);
  }

  it('returns 200 Session and sets refresh cookie on correct code (B7, E1–E3)', async () => {
    const { challengeId, code } = await issueCode();

    const res = await request(app).post('/admin/auth/verify-2fa').send({ challengeId, code });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      accessToken: expect.any(String),
      expiresIn: ACCESS_TOKEN_TTL_MS / 1000,
      user: {
        id: userId,
        email,
        role: 'admin',
        permissions: expect.any(Array),
        hasProfilePhoto: false,
        isSuperAdmin: expect.any(Boolean),
      },
    });
    expect(res.body.user.preferences).toBeDefined();

    // Access token must be a valid JWT carrying the expected claims (E1).
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

    // Refresh token must be delivered as an httpOnly Set-Cookie header (E3).
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie.length).toBeGreaterThan(0);
    expect(setCookie[0]).toMatch(/refreshToken=/);
    expect(setCookie[0]).toMatch(/HttpOnly/);
    expect(setCookie[0]).toMatch(/SameSite=Strict/i);

    // The code must now be marked consumed (B4).
    const record = await prisma.loginCode.findFirst({ where: { challengeId } });
    expect(record).not.toBeNull();
    expect(record?.consumedAt).not.toBeNull();
  });

  it('returns 401 for an incorrect code', async () => {
    const { challengeId } = await issueCode();

    const res = await request(app)
      .post('/admin/auth/verify-2fa')
      .send({ challengeId, code: '000000' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');
  });

  it('returns 401 when the code has expired (B3)', async () => {
    // Issue a code 11 minutes ago so its 10-minute TTL has elapsed.
    const initial = new Date(Date.now() - OTP_TTL_MS - 60_000);
    const { challengeId, code } = await issueCode(initial);

    const res = await request(app).post('/admin/auth/verify-2fa').send({ challengeId, code });

    expect(res.status).toBe(401);
  });

  it('returns 401 when the code has already been consumed (B4)', async () => {
    const { challengeId, code } = await issueCode();

    // First verification consumes the code.
    const first = await request(app).post('/admin/auth/verify-2fa').send({ challengeId, code });
    expect(first.status).toBe(200);

    // Reuse must be rejected.
    const second = await request(app).post('/admin/auth/verify-2fa').send({ challengeId, code });
    expect(second.status).toBe(401);
  });

  it('returns 401 after the code is locked by too many wrong attempts (B5)', async () => {
    const { challengeId } = await issueCode();

    for (let i = 0; i < OTP_MAX_ATTEMPTS; i += 1) {
      const res = await request(app)
        .post('/admin/auth/verify-2fa')
        .send({ challengeId, code: '000000' });
      expect(res.status).toBe(401);
    }

    // The code is now locked; even the correct code cannot be used.
    const record = await prisma.loginCode.findFirst({ where: { challengeId } });
    expect(record?.attemptCount).toBe(OTP_MAX_ATTEMPTS);

    // After lockout any 6-digit code (even the real one) is rejected.
    const locked = await request(app)
      .post('/admin/auth/verify-2fa')
      .send({ challengeId, code: '123456' });
    expect(locked.status).toBe(401);
  });

  it('returns 400 for a malformed request', async () => {
    const res = await request(app).post('/admin/auth/verify-2fa').send({ code: '123456' });
    expect(res.status).toBe(400);
  });
});
