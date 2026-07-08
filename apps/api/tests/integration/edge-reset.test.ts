/**
 * T110 — E-RESET edge-case integration tests (C2/C3/C4/C6, FR-015/FR-017/FR-041).
 *
 * Pins password-reset boundary behavior beyond the coarser Pass-1 coverage
 * already provided by T040 (`auth-forgot-password.test.ts`) and T042
 * (`auth-reset-password.test.ts`):
 *   - C4: unknown email produces a byte-identical neutral response to a known
 *         email, and no email is dispatched — verified by asserting the response
 *         body `toEqual` the known-email body and the mailer mock call count.
 *   - C2: a reset token is rejected once its `expiresAt` is exactly 1 second
 *         in the past — the injected clock controls `issuedAt` precisely so the
 *         boundary is exact rather than many minutes past expiry.  The token
 *         row must NOT be marked consumed because expiry short-circuits ahead
 *         of the single-use check (C2 takes precedence over C3).
 *   - C3: an already-consumed reset token is rejected with `410` end-to-end
 *         via HTTP — the response carries the "expired or already been used"
 *         message to guide the user to request a new link (FR-017).
 *   - C6: a successful password reset revokes ALL of the account's
 *         refresh-token families (account-wide, not just the family that
 *         performed the reset) — verified by seeding three independent families
 *         and asserting every one has a non-null `revokedAt` after the reset.
 *
 * The mailer is mocked at the module boundary so no real SMTP call leaves the
 * test process.  A unique X-Forwarded-For IP isolates this file from the
 * process-wide in-memory auth rate-limit store (F4), matching the pattern
 * established in edge-lockout.test.ts.  Runs against the Phase 1 test database
 * on port 5434.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { PasswordResetTokenService } from '../../src/services/passwordResetToken.js';
import { RESET_TOKEN_TTL_MS } from '../../src/config/adminAuth.js';

// ---------------------------------------------------------------------------
// Mock the SMTP mailer at the module boundary so forgot-password emails are
// captured (for the C4 neutrality assertion) and never sent over a real
// SMTP connection.
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

describe('E-RESET — password-reset edge cases (C2/C3/C4/C6)', () => {
  const password = 'ValidPass123!';
  const newPassword = 'BrandNewPass1!';
  // Unique synthetic IP so the process-wide in-memory auth rate-limit store
  // (F4) does not carry state from other test files sharing the default IP.
  const uniqueIp = '203.0.113.110';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `ereset-${Date.now()}@example.com`;
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
    // Clear LoginCode, PasswordResetToken, and UserPreference rows for this
    // user so each test starts from a clean slate.
    await resetAdminTables(userId);
    // Also clear refresh tokens seeded by C6 tests.
    await prisma.refreshToken.deleteMany({ where: { userId } });
    // Reset the password to the original value between tests.
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
    await prisma.refreshToken.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  /** Helper: issue a reset token for the test user with an optional pinned clock. */
  async function issueTokenAt(initial?: Date) {
    const clock = createClock(initial ?? new Date());
    const service = new PasswordResetTokenService(prisma, clock.now);
    return service.issue(userId);
  }

  /** Helper: submit a forgot-password request from this file's unique IP. */
  function forgotPassword(emailAddr: string) {
    return request(app)
      .post('/admin/auth/forgot-password')
      .set('X-Forwarded-For', uniqueIp)
      .send({ email: emailAddr });
  }

  /** Helper: submit a reset-password request from this file's unique IP. */
  function resetPassword(token: string, pwd: string, confirm: string) {
    return request(app)
      .post('/admin/auth/reset-password')
      .set('X-Forwarded-For', uniqueIp)
      .send({ token, newPassword: pwd, confirmPassword: confirm });
  }

  // -------------------------------------------------------------------------
  // C4 — unknown email produces a byte-identical neutral response
  // -------------------------------------------------------------------------

  it('returns a byte-identical neutral response for an unknown email and sends no email (C4)', async () => {
    // Request for a known email — captures the baseline neutral body.
    const knownRes = await forgotPassword(email);
    expect(knownRes.status).toBe(200);

    // An email must have been dispatched for the known account.
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: email,
        subject: expect.stringContaining('reset'),
      }),
    );
    const knownBody = knownRes.body;

    // Clean up so the cooldown does not interfere with the unknown-email request.
    await resetAdminTables(userId);
    sendEmailMock.mockClear();

    // Request for an unknown email — the response must be indistinguishable.
    const unknownRes = await forgotPassword('nonexistent-account@example.com');
    expect(unknownRes.status).toBe(200);
    expect(unknownRes.body).toEqual(knownBody);

    // No token row must exist for this user (the unknown email has no account).
    const tokens = await prisma.passwordResetToken.findMany({ where: { userId } });
    expect(tokens).toHaveLength(0);

    // No email must have been sent for the unknown address.
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // C2 — exact expiry boundary: rejected 1 second past expiresAt
  // -------------------------------------------------------------------------

  it('rejects a reset token exactly 1 second past its expiresAt boundary (C2)', async () => {
    // issuedAt = now − RESET_TOKEN_TTL_MS − 1000 ⇒ expiresAt = now − 1000 (1s ago).
    const issuedAt = new Date(Date.now() - RESET_TOKEN_TTL_MS - 1000);
    const { rawToken } = await issueTokenAt(issuedAt);

    // Confirm the stored row is truly past its TTL boundary.
    const seeded = await prisma.passwordResetToken.findFirst({ where: { userId } });
    expect(seeded?.expiresAt.getTime()).toBeLessThan(Date.now());

    // Submitting a valid new password with the expired token must yield 410.
    const res = await resetPassword(rawToken, newPassword, newPassword);
    expect(res.status).toBe(410);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');

    // An expired token is rejected before the single-use check runs, so it
    // must never be marked consumed (C2 short-circuits ahead of C3).
    const after = await prisma.passwordResetToken.findFirst({ where: { userId } });
    expect(after?.consumedAt).toBeNull();
  });

  // -------------------------------------------------------------------------
  // C3 — reuse of an already-consumed token
  // -------------------------------------------------------------------------

  it('rejects reuse of an already-consumed reset token with 410 (C3)', async () => {
    const { rawToken } = await issueTokenAt();

    // First consumption succeeds.
    const first = await resetPassword(rawToken, newPassword, newPassword);
    expect(first.status).toBe(200);

    // Second attempt with the same token must yield 410 (FR-017).
    const second = await resetPassword(rawToken, newPassword, newPassword);
    expect(second.status).toBe(410);
    expect(second.body).toHaveProperty('error');
    expect(second.body.message).toContain('expired or already been used');
  });

  // -------------------------------------------------------------------------
  // C6 — account-wide session revocation across multiple families
  // -------------------------------------------------------------------------

  it('revokes all refresh-token families account-wide on a successful reset (C6)', async () => {
    // Seed three independent refresh-token families representing three
    // concurrent sessions for the same user.  Each family has a single active
    // (un-revoked) token — a successful reset must mark every one as revoked.
    const families = ['family-alpha', 'family-bravo', 'family-charlie'];
    for (const family of families) {
      await prisma.refreshToken.create({
        data: {
          userId,
          tokenHash: `hash-${family}`,
          family,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Verify all three start un-revoked.
    const before = await prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
    });
    expect(before).toHaveLength(3);

    // Issue a reset token and consume it with a valid new password.
    const { rawToken } = await issueTokenAt();
    const res = await resetPassword(rawToken, newPassword, newPassword);
    expect(res.status).toBe(200);

    // Every refresh-token family for this user must now be revoked (C6).
    const after = await prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
    });
    expect(after).toHaveLength(0);

    // Confirm each family has a non-null revokedAt timestamp.
    for (const family of families) {
      const token = await prisma.refreshToken.findFirst({
        where: { userId, family },
      });
      expect(token?.revokedAt).not.toBeNull();
    }
  });
});
