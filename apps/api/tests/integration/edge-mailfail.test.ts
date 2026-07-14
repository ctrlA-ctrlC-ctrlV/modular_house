/**
 * T123 — E-MAILFAIL: mailer-failure integration tests.
 *
 * Pins the E-MAILFAIL edge-case behaviour (plan §4.2 E-MAILFAIL, spec
 * "Email delivery delay or failure", FR-010, SC-002):
 *
 *   When the mailer throws while sending the OTP or reset-link email the
 *   system must:
 *     1. Surface a clear, non-technical error (not a 500 "service
 *        unavailable" technical message).
 *     2. Grant no session (no access token, no working challengeId).
 *     3. NOT leave the issued code/token consumed — the orphaned row is
 *        rolled back so it does not count toward the throttle window and
 *        cannot be used by an attacker who somehow discovers it.
 *     4. Allow an immediate retry (the rolled-back row does not block the
 *        next request via the F1/F2 throttle).
 *
 * Three flows are exercised:
 *   - POST /admin/auth/login       — OTP issue + email (mailer throws → 503)
 *   - POST /admin/auth/resend-code — OTP resend + email (mailer throws → 503)
 *   - POST /admin/auth/forgot-password — reset-link issue + email
 *        (mailer throws → neutral 200 per C4, token rolled back)
 *
 * The mailer is mocked at the module boundary
 * (`vi.mock('../../src/services/mailer.js', ...)`).  Each test makes
 * `sendEmail` reject on the first call (simulating an SMTP failure) and
 * resolve on subsequent calls so the retry assertion exercises the same
 * HTTP endpoint a second time with the mailer working.
 *
 * A unique `X-Forwarded-For` IP isolates this file from the process-wide
 * in-memory auth rate-limit store (F4).  Runs against the Phase 1 test
 * database on port 5434.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { LoginCodeService } from '../../src/services/loginCode.js';

// ── Mailer mock (module boundary) ───────────────────────────────────────────
//
// sendEmailMock starts as a rejecting mock.  Individual tests reprogram it
// to reject-once-then-resolve so the retry assertion can exercise the
// success path on the second call without resetting the entire mock.
const { sendEmailMock, closeMock } = vi.hoisted(() => ({
  sendEmailMock: vi.fn(),
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

// ── Test suite ──────────────────────────────────────────────────────────────

describe('E-MAILFAIL — mailer-failure handling (E-MAILFAIL, FR-010, SC-002)', () => {
  const password = 'ValidPass123!';
  // Unique synthetic IP so the process-wide in-memory auth rate-limit store
  // (F4) does not carry state from other test files sharing the default IP.
  const uniqueIp = '203.0.113.130';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `emailfail-${Date.now()}@example.com`;
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
    sendEmailMock.mockReset();
  });

  afterAll(async () => {
    // Delete audit rows before the user (RESTRICT FK on audit_logs.user_id).
    await prisma.auditLog.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  // ── Helper: a successful mailer resolution ────────────────────────────────

  const successResult = {
    success: true,
    messageId: 'mock-message-id',
    attempt: 1,
    timestamp: new Date(),
  };

  // ── Test 1: login — mailer throws → 503, no session, code rolled back ─────

  it(
    'login: mailer throws → 503 clear non-technical error, no session, ' +
      'code row rolled back, retry works (E-MAILFAIL)',
    async () => {
      // First call rejects (SMTP failure), second call succeeds (retry).
      sendEmailMock
        .mockRejectedValueOnce(new Error('SMTP connection refused'))
        .mockResolvedValue(successResult);

      // First attempt — mailer fails.
      const firstRes = await request(app)
        .post('/admin/auth/login')
        .set('X-Forwarded-For', uniqueIp)
        .send({ email, password });

      // E-MAILFAIL: a clear non-technical error, NOT 500 "service unavailable".
      expect(firstRes.status).toBe(503);
      expect(firstRes.body).toHaveProperty('error');
      expect(firstRes.body.error).not.toBe('Internal server error');
      expect(firstRes.body.message).not.toBe('Authentication service unavailable');
      expect(firstRes.body.message).toMatch(/send|code|email|try/i);

      // No session granted — no challengeId, no accessToken.
      expect(firstRes.body).not.toHaveProperty('challengeId');
      expect(firstRes.body).not.toHaveProperty('accessToken');

      // The code row must have been rolled back — no orphaned LoginCode.
      const codesAfterFail = await prisma.loginCode.findMany({
        where: { userId },
      });
      expect(codesAfterFail.length).toBe(0);

      // Retry — mailer now works.
      const retryRes = await request(app)
        .post('/admin/auth/login')
        .set('X-Forwarded-For', uniqueIp)
        .send({ email, password });

      expect(retryRes.status).toBe(200);
      expect(retryRes.body).toHaveProperty('challengeId');
      expect(retryRes.body).not.toHaveProperty('accessToken');
    },
  );

  // ── Test 2: resend-code — mailer throws → 503, code rolled back ───────────

  it(
    'resend-code: mailer throws → 503 clear non-technical error, ' +
      'new code rolled back, retry works (E-MAILFAIL)',
    async () => {
      // Issue an initial code via the service (bypassing the route) so the
      // resend-code route has a valid challengeId to work with.
      // Seed the code with a createdAt > 60s ago to pass the F1 cooldown.
      const clockNow = new Date(Date.now() - 61_000);
      const loginCodeService = new LoginCodeService(prisma, () => clockNow);
      const { challengeId } = await loginCodeService.issue(userId);

      // Verify the initial code row exists.
      const codesBefore = await prisma.loginCode.findMany({
        where: { userId },
      });
      expect(codesBefore.length).toBe(1);

      // First resend attempt — mailer fails.
      sendEmailMock
        .mockRejectedValueOnce(new Error('SMTP timeout'))
        .mockResolvedValue(successResult);

      const firstRes = await request(app)
        .post('/admin/auth/resend-code')
        .set('X-Forwarded-For', uniqueIp)
        .send({ challengeId });

      // E-MAILFAIL: clear non-technical error, NOT 500.
      expect(firstRes.status).toBe(503);
      expect(firstRes.body.error).not.toBe('Internal server error');
      expect(firstRes.body.message).not.toBe('Authentication service unavailable');
      expect(firstRes.body.message).toMatch(/send|code|email|try/i);

      // The new code row must have been rolled back.  The prior code was
      // already invalidated by resend(), so no unconsumed code should
      // remain.  At most the original (now consumed) row exists.
      const unconsumedAfter = await prisma.loginCode.findMany({
        where: { userId, consumedAt: null },
      });
      expect(unconsumedAfter.length).toBe(0);

      // Retry — mailer now works.  Use a fresh challengeId by issuing a new
      // code via login (the original challenge's prior code was consumed by
      // the resend, and the rolled-back new code was deleted).
      sendEmailMock.mockResolvedValue(successResult);

      // Login to get a fresh challengeId (the resend consumed the old code).
      const loginRes = await request(app)
        .post('/admin/auth/login')
        .set('X-Forwarded-For', uniqueIp)
        .send({ email, password });

      expect(loginRes.status).toBe(200);
      const freshChallengeId = loginRes.body.challengeId;

      // Wait for the F1 cooldown to pass (the login just created a code).
      // Advance the test forward by issuing a direct DB manipulation to
      // set the code's createdAt > 60s ago.
      await prisma.loginCode.updateMany({
        where: { userId, consumedAt: null },
        data: { createdAt: new Date(Date.now() - 61_000) },
      });

      const retryRes = await request(app)
        .post('/admin/auth/resend-code')
        .set('X-Forwarded-For', uniqueIp)
        .send({ challengeId: freshChallengeId });

      expect(retryRes.status).toBe(200);
    },
  );

  // ── Test 3: forgot-password — mailer throws → neutral 200, token rolled back ─

  it(
    'forgot-password: mailer throws → neutral 200 (C4 preserved), ' +
      'token rolled back, retry works (E-MAILFAIL, C4)',
    async () => {
      // First call rejects (SMTP failure), second call succeeds (retry).
      sendEmailMock
        .mockRejectedValueOnce(new Error('SMTP connection refused'))
        .mockResolvedValue(successResult);

      // First attempt — mailer fails on a KNOWN account.
      const firstRes = await request(app)
        .post('/admin/auth/forgot-password')
        .set('X-Forwarded-For', uniqueIp)
        .send({ email });

      // C4: the response must be the neutral 200 — a 500 would leak that
      // the account exists (unknown email returns 200, known email with
      // mailer failure would return 500).  The mailer failure must be
      // invisible to the caller.
      expect(firstRes.status).toBe(200);
      expect(firstRes.body).toHaveProperty('message');
      expect(firstRes.body.message).toMatch(/account exists|reset link/i);

      // The token row must have been rolled back — no orphaned token.
      const tokensAfterFail = await prisma.passwordResetToken.findMany({
        where: { userId },
      });
      expect(tokensAfterFail.length).toBe(0);

      // Retry — mailer now works.
      const retryRes = await request(app)
        .post('/admin/auth/forgot-password')
        .set('X-Forwarded-For', uniqueIp)
        .send({ email });

      expect(retryRes.status).toBe(200);
      expect(retryRes.body).toHaveProperty('message');

      // The retry should have created a token row (mailer worked).
      const tokensAfterRetry = await prisma.passwordResetToken.findMany({
        where: { userId },
      });
      expect(tokensAfterRetry.length).toBe(1);
    },
  );
});
