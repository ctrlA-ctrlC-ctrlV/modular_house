/**
 * T106 — E-LOCK edge-case integration tests (A2/A3/C5, FR-009/FR-018).
 *
 * Pins the account-lockout boundary and its interaction with password reset:
 *   - A2: the lockout threshold is 5 consecutive bad passwords; 4 does not lock.
 *   - A3: the 5th consecutive bad password LOCKS the account (sets lockedUntil
 *         to ~now + 15m); any subsequent login attempt during the lock window
 *         is blocked with 423 and no OTP is issued.
 *   - C5: a successful password reset clears the lockout counters
 *         (failedLoginAttempts = 0, lockedUntil = null) so a follow-up login
 *         with the new password succeeds (200 challenge, not 423).
 *
 * Lockout-timing note: the login route constructs `new AuthService()` with the
 * default real-time clock, so `lockedUntil` is set relative to real wall-clock.
 * The lockout-duration assertion (A3) therefore uses real `Date.now()` bounds
 * around the 5th request together with the pinned `LOCKOUT_DURATION_MS`. The
 * injected clock is used where it is genuinely controllable — issuing the
 * reset token (C5) at a known timestamp so its 60m TTL is valid relative to the
 * route's real-time expiry check (same pattern as T042).
 *
 * The mailer is mocked at the module boundary so no real SMTP call leaves the
 * test process. A unique X-Forwarded-For IP isolates this file from the
 * process-wide in-memory auth rate-limit store (F4). Runs against the Phase 1
 * test database on port 5434.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { PasswordResetTokenService } from '../../src/services/passwordResetToken.js';
import { LOCKOUT_THRESHOLD, LOCKOUT_DURATION_MS } from '../../src/config/adminAuth.js';

// Mock the SMTP mailer at the module boundary so login OTP emails are captured,
// not sent. The reset-password route itself sends no email, but a successful
// post-reset login issues an OTP via the mailer.
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

describe('E-LOCK — lockout boundary + reset-clears-lock (A2/A3/C5)', () => {
  const password = 'ValidPass123!';
  const newPassword = 'NewStrongPass1!';
  // Unique synthetic IP so the process-wide in-memory auth rate-limit store
  // (F4) does not carry state from other test files sharing the default IP.
  const uniqueIp = '203.0.113.106';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `elock-${Date.now()}@example.com`;
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
    // Reset Phase 1 tables scoped to this user, then restore a clean
    // lockout/password baseline so each test starts from the same state.
    await resetAdminTables(userId);
    await prisma.auditLog.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        passwordHash: await argon2.hash(password),
      },
    });
    sendEmailMock.mockClear();
  });

  afterAll(async () => {
    // Audit rows must be removed before the user (RESTRICT FK on
    // audit_logs.user_id). LoginCode / PasswordResetToken / UserPreference
    // cascade on user delete per the Phase 1 schema.
    await prisma.auditLog.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  /**
   * Helper: submit a login request from this file's unique IP so all requests
   * share one rate-limit bucket and never collide with other test files.
   */
  function login(pw: string) {
    return request(app)
      .post('/admin/auth/login')
      .set('X-Forwarded-For', uniqueIp)
      .send({ email, password: pw });
  }

  it('does not lock before the threshold: 4 consecutive bad passwords leave the account unlocked (A2 boundary)', async () => {
    // Send LOCKOUT_THRESHOLD - 1 wrong passwords; each returns the generic 401
    // and must NOT set lockedUntil (A2: threshold is 5, not 4).
    for (let i = 0; i < LOCKOUT_THRESHOLD - 1; i++) {
      const res = await login('WrongPass1234!');
      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true, lockedUntil: true },
    });
    expect(user?.failedLoginAttempts).toBe(LOCKOUT_THRESHOLD - 1);
    expect(user?.lockedUntil).toBeNull();
  });

  it('5th consecutive bad password locks the account for 15m; attempts during the lock are blocked with 423 (A2/A3)', async () => {
    // Attempts 1..LOCKOUT_THRESHOLD-1: wrong password, 401, account still unlocked.
    for (let i = 0; i < LOCKOUT_THRESHOLD - 1; i++) {
      const res = await login('WrongPass1234!');
      expect(res.status).toBe(401);
    }

    // 5th consecutive bad password — locks the account (A2). The 5th response
    // is still the generic 401 (the password is wrong); the lock is SET on this
    // attempt and enforced for subsequent attempts (matches T032's reviewed
    // contract: 5 wrong → 401, next attempt during lock → 423).
    const beforeFifth = Date.now();
    const fifth = await login('WrongPass1234!');
    expect(fifth.status).toBe(401);
    expect(fifth.body).toMatchObject({
      error: 'Unauthorized',
      message: 'Invalid credentials',
    });
    const afterFifth = Date.now();

    // A2: the failure counter reached the threshold.
    // A3: lockedUntil is set to ~now + 15m (the route uses real wall-clock, so
    // bound the assertion by the real timestamps around the 5th request).
    const locked = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true, lockedUntil: true },
    });
    expect(locked?.failedLoginAttempts).toBe(LOCKOUT_THRESHOLD);
    const lockUntil = locked?.lockedUntil;
    if (!lockUntil) {
      throw new Error('lockedUntil not set after 5th consecutive bad password');
    }
    // A3: the lock window is exactly 15m from the 5th attempt (the route uses
    // real wall-clock, so bound by the real timestamps around that request).
    expect(lockUntil.getTime()).toBeGreaterThanOrEqual(
      beforeFifth + LOCKOUT_DURATION_MS - 1000,
    );
    expect(lockUntil.getTime()).toBeLessThanOrEqual(
      afterFifth + LOCKOUT_DURATION_MS + 1000,
    );

    // A3: a subsequent attempt during the lock window is blocked with 423 —
    // even with the CORRECT password, the credential check is short-circuited
    // by the active lock and no OTP is issued or emailed.
    const duringLock = await login(password);
    expect(duringLock.status).toBe(423);
    expect(duringLock.body).toMatchObject({
      error: 'Locked',
      message: expect.stringContaining('locked'),
    });
    expect(duringLock.body).not.toHaveProperty('challengeId');
    expect(duringLock.body).not.toHaveProperty('accessToken');
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('a successful password reset clears the lock so login works again (C5)', async () => {
    // Seed the lock directly: 5 failures + lockedUntil 15m in the future.
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: LOCKOUT_THRESHOLD,
        lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
      },
    });

    // Issue a reset token with the injected clock at real-now so its 60m TTL
    // is valid relative to the reset route's real-time expiry check (R11).
    const clock = createClock(new Date());
    const resetService = new PasswordResetTokenService(prisma, clock.now);
    const { rawToken } = await resetService.issue(userId);

    // Consume the reset link with a policy-compliant new password (D1/D2/D4
    // satisfied; D3 — new != current — satisfied because newPassword differs
    // from the seeded current password).
    const resetRes = await request(app)
      .post('/admin/auth/reset-password')
      .set('X-Forwarded-For', uniqueIp)
      .send({ token: rawToken, newPassword, confirmPassword: newPassword });
    expect(resetRes.status).toBe(200);
    expect(resetRes.body).toHaveProperty('message');

    // C5: the lockout counters must be cleared by the reset.
    const after = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true, lockedUntil: true },
    });
    expect(after?.failedLoginAttempts).toBe(0);
    expect(after?.lockedUntil).toBeNull();

    // A follow-up login with the new password must NOT be 423 — the lock is
    // cleared (C5). A successful login returns the 2FA challenge (200), not a
    // token; the access token is minted only after OTP verify (B7).
    const loginRes = await login(newPassword);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('challengeId');
    expect(loginRes.body).not.toHaveProperty('accessToken');
  });
});
