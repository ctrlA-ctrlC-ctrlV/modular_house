/**
 * T038 — POST /admin/auth/resend-code integration tests.
 *
 * Asserts the Phase 1 OTP resend contract:
 *   - eligible request → neutral 200
 *   - prior active code is invalidated (B6)
 *   - challengeId is stable across resend (B9)
 *   - cooldown not elapsed → neutral 429 (F1)
 *   - rolling-window cap exceeded → neutral 429 (F2)
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';
import {
  RESEND_COOLDOWN_MS,
  RATE_WINDOW_MAX_REQUESTS,
  RATE_WINDOW_MS,
  OTP_TTL_MS,
} from '../../src/config/adminAuth.js';

// ---------------------------------------------------------------------------
// Mock the SMTP mailer so resend emails are captured, not sent.
// ---------------------------------------------------------------------------

const { sendEmailMock, closeMock } = vi.hoisted(() => ({
  sendEmailMock: vi.fn().mockResolvedValue({
    success: true,
    messageId: 'mock-message-id',
    attempt: 1,
    timestamp: new Date(),
  }),
  closeMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/services/mailer.js', () => {
  class MockMailerService {
    sendEmail = sendEmailMock;
    close = closeMock;
  }
  return {
    MailerService: MockMailerService,
    mailer: new MockMailerService(),
  };
});

describe('POST /admin/auth/resend-code', () => {
  const password = 'ValidPass123!';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found');
    }

    email = `resend-test-${Date.now()}@example.com`;
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
    sendEmailMock.mockClear();
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  /**
   * Helper: issue an initial OTP using an injected clock so the route's
   * real-time throttle sees the row at the desired age.
   */
  async function issueCodeAt(initial: Date) {
    const clock = createClock(initial);
    const loginCodeService = new LoginCodeService(prisma, clock.now);
    return loginCodeService.issue(userId);
  }

  it('returns neutral 200, invalidates prior code, keeps challengeId stable (B6, B9)', async () => {
    // Issue the initial code far enough in the past that cooldown has elapsed.
    const initial = new Date(Date.now() - RESEND_COOLDOWN_MS - 5_000);
    const { challengeId } = await issueCodeAt(initial);

    const res = await request(app).post('/admin/auth/resend-code').send({ challengeId });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).not.toHaveProperty('accessToken');
    expect(res.body).not.toHaveProperty('token');

    // The new code must be emailed (B8).
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock).toHaveBeenCalledWith(expect.objectContaining({ to: email }));

    // The prior code must be marked consumed/invalid (B6).
    const prior = await prisma.loginCode.findFirst({
      where: { challengeId, codeHash: { not: '' } },
      orderBy: { createdAt: 'asc' },
    });
    expect(prior).not.toBeNull();
    expect(prior?.consumedAt).not.toBeNull();

    // A new active row must exist with the same challengeId (B9).
    const rows = await prisma.loginCode.findMany({
      where: { challengeId },
      orderBy: { createdAt: 'asc' },
    });
    expect(rows).toHaveLength(2);
    expect(rows[0].challengeId).toBe(rows[1].challengeId);
    expect(rows[1].consumedAt).toBeNull();
    expect(rows[1].expiresAt.getTime()).toBeGreaterThan(rows[0].expiresAt.getTime());

    // The new code must be different from the original.
    expect(rows[1].codeHash).not.toBe(rows[0].codeHash);
  });

  it('returns neutral 429 when the resend cooldown has not elapsed (F1)', async () => {
    const initial = new Date(Date.now() - RESEND_COOLDOWN_MS - 5_000);
    const { challengeId } = await issueCodeAt(initial);

    // First resend is eligible.
    const first = await request(app).post('/admin/auth/resend-code').send({ challengeId });
    expect(first.status).toBe(200);

    // Immediate second resend is still inside the cooldown window.
    const second = await request(app).post('/admin/auth/resend-code').send({ challengeId });
    expect(second.status).toBe(429);
    expect(second.body).toHaveProperty('error');
    expect(second.body).toHaveProperty('message');
  });

  it('returns neutral 429 when the rolling OTP request cap is exceeded (F2)', async () => {
    // Seed the maximum number of prior OTP rows for this user, each spaced
    // just past the cooldown so the window cap (not cooldown) blocks the
    // next request.  All rows share the same challengeId so the route can
    // resolve the user without relying on a fresh initial code.
    const now = Date.now();
    const challengeId = `resend-window-test-${now}`;
    const baseTime = now - RATE_WINDOW_MS + 60_000; // inside the trailing window

    for (let i = 0; i < RATE_WINDOW_MAX_REQUESTS; i += 1) {
      const issuedAt = new Date(baseTime + i * (RESEND_COOLDOWN_MS + 1_000));
      await prisma.loginCode.create({
        data: {
          userId,
          challengeId,
          codeHash: await argon2.hash(`code${i}`),
          expiresAt: new Date(issuedAt.getTime() + OTP_TTL_MS),
          createdAt: issuedAt,
        },
      });
    }

    const res = await request(app).post('/admin/auth/resend-code').send({ challengeId });
    expect(res.status).toBe(429);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');
  });
});
