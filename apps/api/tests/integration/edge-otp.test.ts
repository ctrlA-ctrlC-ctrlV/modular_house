/**
 * T108 — E-OTP edge-case integration tests (B3/B4/B5/B6/B9, FR-012/FR-013).
 *
 * Pins OTP boundary behavior beyond the coarser Pass-1 coverage already
 * provided by T036 (`auth-verify-2fa.test.ts`) and T038 (`auth-resend-code.test.ts`):
 *   - B5: a single wrong-code submission increments `attemptCount` by exactly 1.
 *   - B3: a code is rejected once its `expiresAt` is 1 second in the past —
 *         the injected clock controls `issuedAt` precisely so the boundary is
 *         exact rather than many minutes past expiry.
 *   - B4: a consumed code cannot be reused end-to-end via HTTP.
 *   - B5: the boundary between `attemptCount === OTP_MAX_ATTEMPTS - 1` (still
 *         usable) and the submission that follows the `OTP_MAX_ATTEMPTS`-th
 *         wrong attempt (fully invalidated — even the correct code is rejected).
 *   - B6/B9: a resend supersedes the prior code end-to-end — the OLD code
 *         stops working and the NEW code (captured from the mocked mailer,
 *         since B2 forbids returning it in the response body) succeeds while
 *         `challengeId` stays stable across the resend.
 *   - B9: an unknown `challengeId` is rejected with 401 on both `verify-2fa`
 *         and `resend-code`.
 *
 * The mailer is mocked at the module boundary so no real SMTP call leaves the
 * test process. A unique X-Forwarded-For IP isolates this file from the
 * process-wide in-memory auth rate-limit store (F4), matching the pattern
 * established in edge-lockout.test.ts. Runs against the Phase 1 test
 * database on port 5434.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';
import { OTP_MAX_ATTEMPTS, OTP_TTL_MS } from '../../src/config/adminAuth.js';

// Mock the SMTP mailer at the module boundary so resend-code emails are
// captured (to read back the new raw code), not sent over a real connection.
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

describe('E-OTP — OTP edge cases (B3/B4/B5/B6/B9)', () => {
  const password = 'ValidPass123!';
  // Unique synthetic IP so the process-wide in-memory auth rate-limit store
  // (F4) does not carry state from other test files sharing the default IP.
  const uniqueIp = '203.0.113.108';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `eotp-${Date.now()}@example.com`;
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
    // Clear any LoginCode rows left by a prior test so each test starts from
    // a clean OTP slate for this user.
    await resetAdminTables(userId);
    sendEmailMock.mockClear();
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  /**
   * Issue a fresh OTP for the test user with `issuedAt` pinned to `initial`
   * via the injected clock (R11), so `expiresAt = initial + OTP_TTL_MS` is
   * known exactly without waiting on real wall-clock time. The HTTP routes
   * under test construct their own services with the default real-time
   * clock, so this helper only controls the *stored* row — the route's own
   * `now()` check against that row happens for real at request time.
   */
  async function issueCodeAt(initial: Date) {
    const clock = createClock(initial);
    const service = new LoginCodeService(prisma, clock.now);
    return service.issue(userId);
  }

  /** Helper: submit a verify-2fa request from this file's unique IP. */
  function verify2fa(challengeId: string, code: string) {
    return request(app)
      .post('/admin/auth/verify-2fa')
      .set('X-Forwarded-For', uniqueIp)
      .send({ challengeId, code });
  }

  /** Helper: submit a resend-code request from this file's unique IP. */
  function resendCode(challengeId: string) {
    return request(app)
      .post('/admin/auth/resend-code')
      .set('X-Forwarded-For', uniqueIp)
      .send({ challengeId });
  }

  it('increments attemptCount by exactly 1 on a single wrong-code submission (B5)', async () => {
    const { challengeId } = await issueCodeAt(new Date());

    const res = await verify2fa(challengeId, '000000');
    expect(res.status).toBe(401);

    const record = await prisma.loginCode.findFirst({ where: { challengeId } });
    expect(record?.attemptCount).toBe(1);
    expect(record?.consumedAt).toBeNull();
  });

  it('rejects a code exactly 1 second past its expiresAt boundary (B3)', async () => {
    // issuedAt = now - OTP_TTL_MS - 1000  =>  expiresAt = now - 1000 (1s ago).
    const issuedAt = new Date(Date.now() - OTP_TTL_MS - 1000);
    const { challengeId, code } = await issueCodeAt(issuedAt);

    const seeded = await prisma.loginCode.findFirst({ where: { challengeId } });
    expect(seeded?.expiresAt.getTime()).toBeLessThan(Date.now());

    // Submitting the CORRECT code after expiry must still be rejected.
    const res = await verify2fa(challengeId, code);
    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty('accessToken');

    // An expired code is rejected before the single-use check runs, so it
    // must never be marked consumed (B3 short-circuits ahead of B4).
    const after = await prisma.loginCode.findFirst({ where: { challengeId } });
    expect(after?.consumedAt).toBeNull();
  });

  it('rejects reuse of an already-consumed code (B4)', async () => {
    const { challengeId, code } = await issueCodeAt(new Date());

    const first = await verify2fa(challengeId, code);
    expect(first.status).toBe(200);

    const second = await verify2fa(challengeId, code);
    expect(second.status).toBe(401);
    expect(second.body).not.toHaveProperty('accessToken');
  });

  it('does not lock before the threshold, then fully invalidates the code once OTP_MAX_ATTEMPTS is reached (B5 boundary)', async () => {
    const { challengeId, code } = await issueCodeAt(new Date());

    // OTP_MAX_ATTEMPTS - 1 wrong submissions must each fail but leave the
    // code itself still usable (boundary not yet crossed).
    for (let i = 0; i < OTP_MAX_ATTEMPTS - 1; i++) {
      const res = await verify2fa(challengeId, '000000');
      expect(res.status).toBe(401);
    }
    const beforeThreshold = await prisma.loginCode.findFirst({ where: { challengeId } });
    expect(beforeThreshold?.attemptCount).toBe(OTP_MAX_ATTEMPTS - 1);

    // The OTP_MAX_ATTEMPTS-th wrong submission reaches the threshold.
    const atLimit = await verify2fa(challengeId, '000000');
    expect(atLimit.status).toBe(401);
    const atThreshold = await prisma.loginCode.findFirst({ where: { challengeId } });
    expect(atThreshold?.attemptCount).toBe(OTP_MAX_ATTEMPTS);

    // The next submission is fully invalidated — even the CORRECT code is rejected.
    const sixth = await verify2fa(challengeId, code);
    expect(sixth.status).toBe(401);
    expect(sixth.body).not.toHaveProperty('accessToken');
  });

  it('a resend supersedes the prior code end-to-end: old code fails, new code succeeds, challengeId stable (B6/B9)', async () => {
    // Issue clear of the 60s resend cooldown (F1) so the resend is eligible.
    const { challengeId, code: oldCode } = await issueCodeAt(new Date(Date.now() - 61_000));

    const resendRes = await resendCode(challengeId);
    expect(resendRes.status).toBe(200);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    // Capture the new raw code from the mocked mailer's email body — B2
    // forbids returning it in the HTTP response.
    const emailText = sendEmailMock.mock.calls[0][0].text as string;
    const match = emailText.match(/\d{6}/);
    if (!match) {
      throw new Error('Expected the resend email body to contain a 6-digit code');
    }
    const newCode = match[0];

    // The OLD code no longer works — it was invalidated by the resend (B6).
    const oldAttempt = await verify2fa(challengeId, oldCode);
    expect(oldAttempt.status).toBe(401);

    // The NEW code, referenced via the SAME challengeId (B9), succeeds.
    const newAttempt = await verify2fa(challengeId, newCode);
    expect(newAttempt.status).toBe(200);
    expect(newAttempt.body).toHaveProperty('accessToken');
  });

  it('rejects an unknown challengeId with 401 on verify-2fa and resend-code (B9)', async () => {
    const bogusChallengeId = 'nonexistent-challenge-id-does-not-exist';

    const verifyRes = await verify2fa(bogusChallengeId, '123456');
    expect(verifyRes.status).toBe(401);
    expect(verifyRes.body).not.toHaveProperty('accessToken');

    const resendRes = await resendCode(bogusChallengeId);
    expect(resendRes.status).toBe(401);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
