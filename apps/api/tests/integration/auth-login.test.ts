/**
 * T032 — POST /admin/auth/login integration tests (T-B1).
 *
 * Asserts the Phase 1 two-factor login contract:
 *   - valid credentials → 200 TwoFactorChallenge, OTP issued + emailed, no token
 *   - account lockout after 5 failed attempts → 423
 *   - auth-route IP rate limit exceeded → 429
 *
 * The mailer is mocked so the suite does not require a real SMTP server.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { LOCKOUT_THRESHOLD } from '../../src/config/adminAuth.js';
import { IP_RATE_LIMIT_MAX } from '../../src/config/adminAuth.js';

// ---------------------------------------------------------------------------
// Mock the SMTP mailer so login emails are captured, not sent.
// ---------------------------------------------------------------------------

const { sendEmailMock } = vi.hoisted(() => ({
  sendEmailMock: vi.fn().mockResolvedValue({
    success: true,
    messageId: 'mock-message-id',
    attempt: 1,
    timestamp: new Date(),
  }),
}));

vi.mock('../../src/services/mailer.js', () => {
  function MockMailerService() {
    // No-op constructor — no SMTP connection attempted.
  }
  MockMailerService.prototype.sendEmail = sendEmailMock;
  MockMailerService.prototype.close = vi.fn().mockResolvedValue(undefined);
  return {
    MailerService: MockMailerService,
    mailer: new MockMailerService(),
  };
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('POST /admin/auth/login', () => {
  const password = 'ValidPass123!';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found');
    }

    email = `login-test-${Date.now()}@example.com`;
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
    await resetAdminTables();
    sendEmailMock.mockClear();

    // Reset the user's lockout counters so order-dependent tests start clean.
    await prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  it('returns 200 TwoFactorChallenge on valid credentials, issues OTP, sends email, no token', async () => {
    const res = await request(app).post('/admin/auth/login').send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      challengeId: expect.any(String),
      message: expect.any(String),
    });
    expect(res.body).not.toHaveProperty('accessToken');
    expect(res.body).not.toHaveProperty('token');
    expect(res.body).not.toHaveProperty('user');

    // An unconsumed LoginCode row must exist for this user/challenge (B1/B2/B7).
    const codes = await prisma.loginCode.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    expect(codes).toHaveLength(1);
    expect(codes[0].challengeId).toBe(res.body.challengeId);
    expect(codes[0].consumedAt).toBeNull();

    // The OTP must have been emailed (B8).
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: email,
        subject: expect.stringContaining('verification code'),
      }),
    );
  });

  it('returns 401 with a generic message for unknown email', async () => {
    const res = await request(app)
      .post('/admin/auth/login')
      .send({ email: 'unknown@example.com', password: 'AnyPass1234!' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      error: 'Unauthorized',
      message: 'Invalid credentials',
    });
    expect(res.body).not.toHaveProperty('accessToken');
    expect(res.body).not.toHaveProperty('token');
    expect(res.body).not.toHaveProperty('challengeId');
  });

  it('returns 401 with a generic message for wrong password', async () => {
    const res = await request(app)
      .post('/admin/auth/login')
      .send({ email, password: 'WrongPass1234!' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      error: 'Unauthorized',
      message: 'Invalid credentials',
    });
  });

  it('returns 423 when the account is locked after repeated failures (A2/A3)', async () => {
    // Exhaust the lockout threshold with wrong passwords.
    for (let i = 0; i < LOCKOUT_THRESHOLD; i++) {
      const failed = await request(app)
        .post('/admin/auth/login')
        .send({ email, password: 'WrongPass1234!' });
      expect(failed.status).toBe(401);
    }

    // The next valid-credentials attempt must be blocked while locked.
    const res = await request(app).post('/admin/auth/login').send({ email, password });

    expect(res.status).toBe(423);
    expect(res.body).toMatchObject({
      error: 'Locked',
      message: expect.stringContaining('locked'),
    });
  });

  it('returns 429 when the auth-route IP rate limit is exceeded (F4)', async () => {
    // Use a unique synthetic IP so this test is not affected by earlier
    // requests from the same process (the in-memory rate-limit store is
    // keyed by IP).
    const uniqueIp = '203.0.113.10';

    // Consume the entire per-IP request budget.
    for (let i = 0; i < IP_RATE_LIMIT_MAX; i++) {
      const req = request(app)
        .post('/admin/auth/login')
        .set('X-Forwarded-For', uniqueIp)
        .send({ email, password });
      const res = await req;
      expect(res.status).toBe(200);
    }

    // The next request from the same IP must be throttled.
    const res = await request(app)
      .post('/admin/auth/login')
      .set('X-Forwarded-For', uniqueIp)
      .send({ email, password });
    expect(res.status).toBe(429);
  });
});
