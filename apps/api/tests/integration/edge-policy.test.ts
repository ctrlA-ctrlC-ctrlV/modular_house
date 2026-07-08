/**
 * T112 — E-POLICY edge-case integration tests (D1–D7, FR-019/FR-032).
 *
 * Pins server-side password policy enforcement on both the reset-password
 * path (POST /admin/auth/reset-password) and the settings-change path
 * (PUT /admin/settings/password).  Each D-rule is exercised end-to-end
 * at the HTTP layer to confirm that the server rejects invalid passwords
 * regardless of any client-side validation (D7):
 *
 *   - D1: length 11 rejected / length 12 accepted (min boundary)
 *   - D2: missing lowercase, uppercase, or digit → 400
 *   - D3: new password == current password → 400
 *   - D4: newPassword ≠ confirmPassword → 400
 *   - D5: wrong current password on settings change → 400
 *   - D6: all violations produce 400 with a specific message
 *   - D7: server-side enforcement — raw HTTP bypass still rejected
 *
 * The mailer is mocked at the module boundary so no real SMTP call leaves
 * the test process.  A unique X-Forwarded-For IP isolates this file from
 * the process-wide in-memory auth rate-limit store (F4), matching the
 * pattern established in edge-lockout.test.ts.  Runs against the Phase 1
 * test database on port 5434.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { PasswordResetTokenService } from '../../src/services/passwordResetToken.js';
import { LoginCodeService } from '../../src/services/loginCode.js';
import { PASSWORD_MIN_LENGTH } from '../../src/config/adminAuth.js';

// ---------------------------------------------------------------------------
// Mock the SMTP mailer at the module boundary so forgot-password and
// login emails are captured and never sent over a real SMTP connection.
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

describe('E-POLICY — password policy edge cases (D1–D7)', () => {
  const currentPassword = 'ValidPass123!';
  // Unique synthetic IP so the process-wide in-memory auth rate-limit store
  // (F4) does not carry state from other test files sharing the default IP.
  const uniqueIp = '203.0.113.112';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `epolicy-${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await argon2.hash(currentPassword),
        roleId: role.id,
        isActive: true,
        failedLoginAttempts: 0,
      },
    });
    userId = user.id;
  });

  beforeEach(async () => {
    // Clear LoginCode, PasswordResetToken, and UserPreference rows for this
    // user so each test starts from a clean slate.
    await resetAdminTables(userId);
    await prisma.refreshToken.deleteMany({ where: { userId } });
    // Restore the password hash to the known value so D3 checks are
    // consistent across tests that may have changed it.
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await argon2.hash(currentPassword),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    sendEmailMock.mockClear();
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  // =========================================================================
  // Helpers
  // =========================================================================

  /** Issue a fresh reset token for the test user. */
  async function issueResetToken(): Promise<string> {
    const clock = createClock(new Date());
    const service = new PasswordResetTokenService(prisma, clock.now);
    const { rawToken } = await service.issue(userId);
    return rawToken;
  }

  /** Submit POST /admin/auth/reset-password with the given fields. */
  function resetPassword(token: string, newPwd: string, confirmPwd: string) {
    return request(app)
      .post('/admin/auth/reset-password')
      .set('X-Forwarded-For', uniqueIp)
      .send({ token, newPassword: newPwd, confirmPassword: confirmPwd });
  }

  /** Obtain a valid access token + refresh cookie for the test user. */
  async function getSession(): Promise<{
    accessToken: string;
    cookiePair: string;
  }> {
    const clock = createClock(new Date());
    const loginCodeService = new LoginCodeService(prisma, clock.now);
    const { challengeId, code } = await loginCodeService.issue(userId);

    const res = await request(app)
      .post('/admin/auth/verify-2fa')
      .set('X-Forwarded-For', uniqueIp)
      .send({ challengeId, code });

    if (res.status !== 200) {
      throw new Error(`verify-2fa failed: ${res.status}`);
    }

    const setCookie = res.headers['set-cookie'];
    const cookieStr: string = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    const cookiePair = cookieStr.split(';')[0].trim();

    return { accessToken: res.body.accessToken as string, cookiePair };
  }

  /** Submit PUT /admin/settings/password with the given fields. */
  async function changePassword(
    curPwd: string,
    newPwd: string,
    confirmPwd: string,
  ) {
    const session = await getSession();
    return request(app)
      .put('/admin/settings/password')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair)
      .set('X-Forwarded-For', uniqueIp)
      .send({
        currentPassword: curPwd,
        newPassword: newPwd,
        confirmPassword: confirmPwd,
      });
  }

  // =========================================================================
  // Reset-password path — POST /admin/auth/reset-password
  // =========================================================================

  describe('via POST /admin/auth/reset-password', () => {
    // -----------------------------------------------------------------------
    // D1 — length boundary (min = 12)
    // -----------------------------------------------------------------------

    it('rejects an 11-character password with 400 (D1)', async () => {
      const token = await issueResetToken();
      // 11 chars: uppercase + lowercase + digit present but below min length.
      const shortPwd = 'Abcdefghi1!';
      expect(shortPwd).toHaveLength(11);

      const res = await resetPassword(token, shortPwd, shortPwd);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
      expect(res.body.message).toContain(`at least ${PASSWORD_MIN_LENGTH}`);
    });

    it('accepts a 12-character policy-compliant password (D1)', async () => {
      const token = await issueResetToken();
      // 12 chars: meets length, has lower + upper + digit.
      const validPwd = 'Abcdefghij1!';
      expect(validPwd).toHaveLength(12);

      const res = await resetPassword(token, validPwd, validPwd);
      expect(res.status).toBe(200);
    });

    // -----------------------------------------------------------------------
    // D2 — character-class requirements
    // -----------------------------------------------------------------------

    it('rejects a password missing a lowercase letter (D2)', async () => {
      const token = await issueResetToken();
      const noLower = 'ABCDEFGHIJ12';
      expect(noLower).toHaveLength(12);

      const res = await resetPassword(token, noLower, noLower);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('lowercase');
    });

    it('rejects a password missing an uppercase letter (D2)', async () => {
      const token = await issueResetToken();
      const noUpper = 'abcdefghij12';
      expect(noUpper).toHaveLength(12);

      const res = await resetPassword(token, noUpper, noUpper);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('uppercase');
    });

    it('rejects a password missing a digit (D2)', async () => {
      const token = await issueResetToken();
      const noDigit = 'Abcdefghijkl';
      expect(noDigit).toHaveLength(12);

      const res = await resetPassword(token, noDigit, noDigit);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('digit');
    });

    // -----------------------------------------------------------------------
    // D3 — new password must not equal the current password
    // -----------------------------------------------------------------------

    it('rejects a new password equal to the current password (D3)', async () => {
      const token = await issueResetToken();

      const res = await resetPassword(token, currentPassword, currentPassword);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('different from your current password');
    });

    // -----------------------------------------------------------------------
    // D4 — confirmation mismatch
    // -----------------------------------------------------------------------

    it('rejects mismatched newPassword and confirmPassword (D4)', async () => {
      const token = await issueResetToken();
      const pwd = 'NewValidPass1!';
      const mismatch = 'DifferentPass1!';

      const res = await resetPassword(token, pwd, mismatch);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('do not match');
    });

    // -----------------------------------------------------------------------
    // D7 — server-side enforcement (simulated client bypass)
    // -----------------------------------------------------------------------

    it('rejects a policy-violating password sent as raw HTTP simulating client bypass (D7)', async () => {
      const token = await issueResetToken();
      // A password that would be caught by client-side validation but is sent
      // directly to the server — too short and missing character classes.
      const bypassPwd = 'abc';

      const res = await resetPassword(token, bypassPwd, bypassPwd);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });

  // =========================================================================
  // Settings-change path — PUT /admin/settings/password
  // =========================================================================

  describe('via PUT /admin/settings/password', () => {
    // -----------------------------------------------------------------------
    // D1 — length boundary (min = 12)
    // -----------------------------------------------------------------------

    it('rejects an 11-character password with 400 (D1)', async () => {
      const shortPwd = 'Abcdefghi1!';
      expect(shortPwd).toHaveLength(11);

      const res = await changePassword(currentPassword, shortPwd, shortPwd);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
      expect(res.body.message).toContain(`at least ${PASSWORD_MIN_LENGTH}`);
    });

    // -----------------------------------------------------------------------
    // D2 — character-class requirements
    // -----------------------------------------------------------------------

    it('rejects a password missing a character class (D2)', async () => {
      const noDigit = 'Abcdefghijkl';
      expect(noDigit).toHaveLength(12);

      const res = await changePassword(currentPassword, noDigit, noDigit);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('digit');
    });

    // -----------------------------------------------------------------------
    // D3 — new password must not equal the current password
    // -----------------------------------------------------------------------

    it('rejects a new password equal to the current password (D3)', async () => {
      const res = await changePassword(
        currentPassword,
        currentPassword,
        currentPassword,
      );
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('different from your current password');
    });

    // -----------------------------------------------------------------------
    // D4 — confirmation mismatch
    // -----------------------------------------------------------------------

    it('rejects mismatched newPassword and confirmPassword (D4)', async () => {
      const res = await changePassword(
        currentPassword,
        'NewValidPass1!',
        'DifferentPass1!',
      );
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('do not match');
    });

    // -----------------------------------------------------------------------
    // D5 — wrong current password
    // -----------------------------------------------------------------------

    it('rejects an incorrect current password with 400 (D5)', async () => {
      const res = await changePassword(
        'WrongCurrentPass1!',
        'NewValidPass123!',
        'NewValidPass123!',
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    // -----------------------------------------------------------------------
    // D7 — server-side enforcement (simulated client bypass)
    // -----------------------------------------------------------------------

    it('rejects a policy-violating password sent as raw HTTP simulating client bypass (D7)', async () => {
      // A password that would be caught by client-side validation but is
      // sent directly — too short and missing character classes.
      const bypassPwd = 'abc';

      const res = await changePassword(currentPassword, bypassPwd, bypassPwd);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });
});
