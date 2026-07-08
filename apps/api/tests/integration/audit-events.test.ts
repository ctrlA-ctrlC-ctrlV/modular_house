/**
 * T101 — Audit events integration test (T-B6, FR-037, I1–I3).
 *
 * Drives every authentication flow end-to-end against the test DB and asserts
 * that the reused `AuditLog` table receives exactly the expected I1 action for
 * each, attributed to the acting user with `entity: 'user'`, and that no
 * secret (password, OTP code, reset token) ever appears in any audit row.
 *
 * Coverage of the pinned constants:
 *   - I1: all eight audited events are exercised (LOGIN_SUCCESS, LOGIN_FAILURE,
 *     LOGOUT, OTP_ISSUED, OTP_VERIFIED, PASSWORD_RESET_REQUESTED,
 *     PASSWORD_RESET_COMPLETED, PASSWORD_CHANGED).
 *   - I2: unknown-email login failure and unknown-email forgot-password pass a
 *     null userId and produce NO audit row (the AuditLogService skips the write
 *     because the reused AuditLog table requires a non-null userId FK).
 *   - I3: the raw password, OTP code, and reset token are asserted absent from
 *     every audit row's writable fields.
 *
 * The mailer is mocked at the module boundary so no real SMTP call leaves the
 * test process. Runs against the Phase 1 test database on port 5434.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';
import { PasswordResetTokenService } from '../../src/services/passwordResetToken.js';
import { RESEND_COOLDOWN_MS } from '../../src/config/adminAuth.js';

// ---------------------------------------------------------------------------
// Mock the SMTP mailer so login / reset emails are captured, not sent.
// The mock matches the module boundary pattern used by the rest of the suite.
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

describe('Audit events — I1 action coverage (T-B6, FR-037)', () => {
  const password = 'ValidPass123!';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `audit-${Date.now()}@example.com`;
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
    // Start each test with a clean per-user slate for the Phase 1 tables,
    // the refresh tokens, and — critically — the audit log rows.  Scoping the
    // audit cleanup to userId avoids cross-test races under Vitest's parallel
    // execution (same rationale as resetAdminTables).
    await resetAdminTables(userId);
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.refreshToken.deleteMany({ where: { userId } });

    // Restore the known password and lockout counters so order-dependent
    // tests start from the same baseline regardless of what a prior test did.
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await argon2.hash(password),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    sendEmailMock.mockClear();
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  /**
   * Complete the verify-2fa step for the test user and return the access
   * token + refresh-token cookie pair, plus the raw OTP code so the caller can
   * assert it never reaches the audit log (I3).  The login code is issued
   * directly through the service (bypassing POST /login) so this helper does
   * not itself emit a LOGIN_SUCCESS / OTP_ISSUED audit event.
   */
  async function getSession(): Promise<{
    accessToken: string;
    cookiePair: string;
    code: string;
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
    return {
      accessToken: res.body.accessToken as string,
      cookiePair: cookieStr.split(';')[0].trim(),
      code,
    };
  }

  /**
   * Assert that exactly one audit row exists for the test user with the given
   * action, and that its entity is 'user' and its userId matches.
   */
  async function expectAuditAction(action: string): Promise<void> {
    const rows = await prisma.auditLog.findMany({ where: { userId, action } });
    expect(rows).toHaveLength(1);
    expect(rows[0].entity).toBe('user');
    expect(rows[0].userId).toBe(userId);
  }

  /**
   * Assert that no audit row exists for the test user with the given action.
   */
  async function expectNoAuditAction(action: string): Promise<void> {
    const rows = await prisma.auditLog.findMany({ where: { userId, action } });
    expect(rows).toHaveLength(0);
  }

  /**
   * Assert that none of the supplied secret strings (password, OTP code, reset
   * token) appears in any writable field of any audit row for the test user
   * (I3).  Only the fields the AuditLogService persists are scanned — the row
   * id / userId / createdAt are system-generated and excluded so a coincidental
   * numeric substring in a UUID never produces a false failure.
   */
  async function assertNoSecretsInAudit(secrets: string[]): Promise<void> {
    const rows = await prisma.auditLog.findMany({ where: { userId } });
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const writableFields = [
        row.action,
        row.entity,
        row.entityId ?? '',
        row.ipAddress,
        row.userAgent ?? '',
      ];
      for (const secret of secrets) {
        for (const field of writableFields) {
          expect(field).not.toContain(secret);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // I1 — LOGIN_SUCCESS + OTP_ISSUED (POST /login success branch)
  // -------------------------------------------------------------------------

  it('writes LOGIN_SUCCESS and OTP_ISSUED on valid credentials (POST /login)', async () => {
    const res = await request(app).post('/admin/auth/login').send({ email, password });

    expect(res.status).toBe(200);
    await expectAuditAction('LOGIN_SUCCESS');
    await expectAuditAction('OTP_ISSUED');
    // The submitted password must never reach the audit log (I3).
    await assertNoSecretsInAudit([password]);
  });

  // -------------------------------------------------------------------------
  // I1 — LOGIN_FAILURE (POST /login failure branch, known account)
  // -------------------------------------------------------------------------

  it('writes LOGIN_FAILURE on a wrong-password attempt for a known account', async () => {
    const res = await request(app)
      .post('/admin/auth/login')
      .send({ email, password: 'WrongPass1234!' });

    expect(res.status).toBe(401);
    await expectAuditAction('LOGIN_FAILURE');
  });

  // -------------------------------------------------------------------------
  // I2 — LOGIN_FAILURE skipped for unknown email (null userId → no row)
  // -------------------------------------------------------------------------

  it('writes no LOGIN_FAILURE row for an unknown email (I2 null-userId skip)', async () => {
    const res = await request(app)
      .post('/admin/auth/login')
      .send({ email: 'nobody@example.com', password: 'AnyPass1234!' });

    expect(res.status).toBe(401);
    // The test user's audit slate must stay empty — the unknown-email failure
    // is attributed to a null userId and silently skipped by AuditLogService.
    await expectNoAuditAction('LOGIN_FAILURE');
  });

  // -------------------------------------------------------------------------
  // I1 — OTP_VERIFIED (POST /verify-2fa success branch only)
  // -------------------------------------------------------------------------

  it('writes OTP_VERIFIED on successful verify-2fa and never logs the code (I3)', async () => {
    const session = await getSession();

    await expectAuditAction('OTP_VERIFIED');
    // The raw one-time code must never appear in any audit row.
    await assertNoSecretsInAudit([session.code]);
  });

  // -------------------------------------------------------------------------
  // I1 — OTP_ISSUED (POST /resend-code success branch)
  // -------------------------------------------------------------------------

  it('writes OTP_ISSUED on a successful resend-code', async () => {
    // Issue the initial code far enough in the past that the route's real-time
    // cooldown check sees the row as eligible for resend.
    const initial = new Date(Date.now() - RESEND_COOLDOWN_MS - 5_000);
    const clock = createClock(initial);
    const loginCodeService = new LoginCodeService(prisma, clock.now);
    const { challengeId } = await loginCodeService.issue(userId);

    const res = await request(app).post('/admin/auth/resend-code').send({ challengeId });

    expect(res.status).toBe(200);
    await expectAuditAction('OTP_ISSUED');
  });

  // -------------------------------------------------------------------------
  // I1 — LOGOUT (POST /logout)
  // -------------------------------------------------------------------------

  it('writes LOGOUT on POST /logout', async () => {
    const session = await getSession();

    const res = await request(app)
      .post('/admin/auth/logout')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair);

    expect(res.status).toBe(204);
    await expectAuditAction('LOGOUT');
  });

  // -------------------------------------------------------------------------
  // I1 — PASSWORD_RESET_REQUESTED (POST /forgot-password, known non-throttled)
  // -------------------------------------------------------------------------

  it('writes PASSWORD_RESET_REQUESTED on forgot-password for a known account', async () => {
    const res = await request(app).post('/admin/auth/forgot-password').send({ email });

    expect(res.status).toBe(200);
    await expectAuditAction('PASSWORD_RESET_REQUESTED');
  });

  // -------------------------------------------------------------------------
  // I2 — PASSWORD_RESET_REQUESTED skipped for unknown email (no existence leak)
  // -------------------------------------------------------------------------

  it('writes no PASSWORD_RESET_REQUESTED row for an unknown email (no account-existence leak)', async () => {
    const res = await request(app)
      .post('/admin/auth/forgot-password')
      .send({ email: 'unknown-reset@example.com' });

    expect(res.status).toBe(200);
    await expectNoAuditAction('PASSWORD_RESET_REQUESTED');
  });

  // -------------------------------------------------------------------------
  // I1 — PASSWORD_RESET_COMPLETED (POST /reset-password success)
  // -------------------------------------------------------------------------

  it('writes PASSWORD_RESET_COMPLETED on reset-password and never logs the token (I3)', async () => {
    const resetService = new PasswordResetTokenService(prisma);
    const { rawToken } = await resetService.issue(userId);

    const newPassword = 'NewValidPass123!';
    const res = await request(app)
      .post('/admin/auth/reset-password')
      .send({ token: rawToken, newPassword, confirmPassword: newPassword });

    expect(res.status).toBe(200);
    await expectAuditAction('PASSWORD_RESET_COMPLETED');
    // The raw reset token and the new password must never reach the audit log.
    await assertNoSecretsInAudit([rawToken, newPassword]);
  });

  // -------------------------------------------------------------------------
  // I1 — PASSWORD_CHANGED (PUT /admin/settings/password success)
  // -------------------------------------------------------------------------

  it('writes PASSWORD_CHANGED on settings password change and never logs passwords (I3)', async () => {
    const session = await getSession();
    const newPassword = 'ChangedPass123!';

    const res = await request(app)
      .put('/admin/settings/password')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair)
      .send({ currentPassword: password, newPassword, confirmPassword: newPassword });

    expect(res.status).toBe(200);
    await expectAuditAction('PASSWORD_CHANGED');
    // Neither the current nor the new password may appear in any audit row.
    await assertNoSecretsInAudit([password, newPassword]);
  });
});
