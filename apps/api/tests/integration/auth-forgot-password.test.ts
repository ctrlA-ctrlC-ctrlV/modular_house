/**
 * T040 — POST /admin/auth/forgot-password integration tests (T-B2).
 *
 * Asserts the Phase 1 password-reset request contract:
 *   - known email → neutral 200, reset token issued + emailed
 *   - unknown email → same neutral 200, no token issued, no email sent (C4)
 *   - cooldown not elapsed → neutral 429 (F1)
 *   - rolling-window cap exceeded → neutral 429 (F2)
 *
 * The mailer is mocked so the suite does not require a real SMTP server.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import {
  RESEND_COOLDOWN_MS,
  RATE_WINDOW_MAX_REQUESTS,
  RATE_WINDOW_MS,
  RESET_TOKEN_TTL_MS,
} from '../../src/config/adminAuth.js';

// ---------------------------------------------------------------------------
// Mock the SMTP mailer so reset emails are captured, not sent.
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

describe('POST /admin/auth/forgot-password', () => {
  const password = 'ValidPass123!';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found');
    }

    email = `forgot-test-${Date.now()}@example.com`;
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

  it('returns neutral 200 and emails a reset token for a known email (C4)', async () => {
    const res = await request(app).post('/admin/auth/forgot-password').send({ email });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).not.toHaveProperty('token');
    expect(res.body).not.toHaveProperty('accessToken');

    // A PasswordResetToken row must exist for this user (C1/C2).
    const tokens = await prisma.passwordResetToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    expect(tokens).toHaveLength(1);
    expect(tokens[0].consumedAt).toBeNull();

    // The reset link must have been emailed.
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: email,
        subject: expect.stringContaining('reset'),
      }),
    );
  });

  it('returns the same neutral 200 and sends no email for an unknown email (C4)', async () => {
    const knownRes = await request(app).post('/admin/auth/forgot-password').send({ email });
    expect(knownRes.status).toBe(200);
    const knownMessage = knownRes.body.message;

    await resetAdminTables(userId);
    sendEmailMock.mockClear();

    const res = await request(app)
      .post('/admin/auth/forgot-password')
      .send({ email: 'unknown@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: knownMessage });

    // No token row and no email must be created for unknown addresses.
    const tokens = await prisma.passwordResetToken.findMany({
      where: { userId },
    });
    expect(tokens).toHaveLength(0);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('returns neutral 429 when the reset cooldown has not elapsed (F1)', async () => {
    // First request is eligible.
    const first = await request(app).post('/admin/auth/forgot-password').send({ email });
    expect(first.status).toBe(200);

    // Immediate second request is still inside the cooldown window.
    const second = await request(app).post('/admin/auth/forgot-password').send({ email });
    expect(second.status).toBe(429);
    expect(second.body).toHaveProperty('error');
    expect(second.body).toHaveProperty('message');
  });

  it('returns neutral 429 when the rolling reset-link cap is exceeded (F2)', async () => {
    const now = Date.now();
    const baseTime = now - RATE_WINDOW_MS + 60_000; // inside the trailing window

    // Seed the maximum number of prior reset-token rows for this user, each
    // spaced past the cooldown so the window cap (not cooldown) blocks the
    // next request.
    for (let i = 0; i < RATE_WINDOW_MAX_REQUESTS; i += 1) {
      const issuedAt = new Date(baseTime + i * (RESEND_COOLDOWN_MS + 1_000));
      await prisma.passwordResetToken.create({
        data: {
          userId,
          tokenHash: `hash${i}`,
          expiresAt: new Date(issuedAt.getTime() + RESET_TOKEN_TTL_MS),
          createdAt: issuedAt,
        },
      });
    }

    // The next request must be throttled by the window cap.
    const res = await request(app).post('/admin/auth/forgot-password').send({ email });
    expect(res.status).toBe(429);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');
  });
});
