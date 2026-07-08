/**
 * T114 — E-THROTTLE edge-case integration tests (F1/F2/F3, FR-042/FR-043).
 *
 * Pins the hardened resend-cooldown + rolling-window-cap behavior beyond the
 * coarser Pass-1 coverage in T038 (`auth-resend-code.test.ts`) and T040
 * (`auth-forgot-password.test.ts`):
 *
 *   - F1 (resend-code): a resend within 60s of the latest LoginCode row returns
 *     429, surfaces a `Retry-After` countdown header (T115 surfaces countdown
 *     data to the UI), and issues/sends nothing — no new LoginCode row, no
 *     email.  The cooldown is derived from the latest row's `created_at`.
 *   - F2 (resend-code): the 6th OTP request within a 15m trailing window is
 *     blocked with 429 + `Retry-After`; the cap is a trailing-window count of
 *     `created_at` rows.
 *   - F3 (forgot-password): throttle state is NEVER reflected in the response
 *     status or body.  A known throttled account and an unknown email both
 *     return the byte-identical neutral 200, and the throttled known account
 *     issues/sends nothing (silent skip).  This closes the account-existence
 *     enumeration vector flagged in the T041 review nit (a 429 for known vs
 *     200 for unknown leaked existence).  Per plan §2.6 F3 ("never reveal
 *     whether an email is registered") + the "no separate counter store" note,
 *     row-derived throttling can only throttle known accounts, so the neutral
 *     path is to always return 200 and silently skip issuance when throttled.
 *
 * Throttle state is derived from `created_at` rows (plan §2.6) seeded with the
 * injected clock so the boundaries are exact.  The mailer is mocked at the
 * module boundary so no SMTP call leaves the test process.  A unique
 * X-Forwarded-For IP isolates this file from the process-wide in-memory auth
 * rate-limit store (F4).  Runs against the Phase 1 test database on port 5434.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';
import { PasswordResetTokenService } from '../../src/services/passwordResetToken.js';
import {
  RESEND_COOLDOWN_MS,
  RATE_WINDOW_MAX_REQUESTS,
  RATE_WINDOW_MS,
  OTP_TTL_MS,
  RESET_TOKEN_TTL_MS,
} from '../../src/config/adminAuth.js';

// ---------------------------------------------------------------------------
// Mock the SMTP mailer at the module boundary so no real SMTP call leaves the
// test process.  sendEmailMock captures resend/reset emails for the "issues
// nothing" assertions.
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

describe('E-THROTTLE — resend cooldown + rolling-window cap (F1/F2/F3)', () => {
  const password = 'ValidPass123!';
  // Unique synthetic IP so the process-wide in-memory auth rate-limit store
  // (F4) does not carry state from other test files sharing the default IP.
  const uniqueIp = '203.0.113.120';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `ethrottle-${Date.now()}@example.com`;
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
    // user so each test starts from a clean throttle slate.
    await resetAdminTables(userId);
    sendEmailMock.mockClear();
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  /** Helper: issue an OTP for the test user at a pinned clock time. */
  async function issueCodeAt(initial: Date) {
    const clock = createClock(initial);
    const loginCodeService = new LoginCodeService(prisma, clock.now);
    return loginCodeService.issue(userId);
  }

  /** Helper: issue a reset token for the test user at a pinned clock time. */
  async function issueTokenAt(initial: Date) {
    const clock = createClock(initial);
    const service = new PasswordResetTokenService(prisma, clock.now);
    return service.issue(userId);
  }

  /** Helper: submit a resend-code request from this file's unique IP. */
  function resendCode(challengeId: string) {
    return request(app)
      .post('/admin/auth/resend-code')
      .set('X-Forwarded-For', uniqueIp)
      .send({ challengeId });
  }

  /** Helper: submit a forgot-password request from this file's unique IP. */
  function forgotPassword(emailAddr: string) {
    return request(app)
      .post('/admin/auth/forgot-password')
      .set('X-Forwarded-For', uniqueIp)
      .send({ email: emailAddr });
  }

  // -------------------------------------------------------------------------
  // F1 — resend-code within 60s returns 429 + Retry-After and issues nothing
  // -------------------------------------------------------------------------

  it('resend-code within 60s returns 429 + Retry-After and issues nothing (F1)', async () => {
    // Issue a live code "now" so the route's real-time clock sees the latest
    // row as ~0s old — well inside the 60s cooldown window.
    const { challengeId } = await issueCodeAt(new Date());

    // Capture the row count before the resend attempt.
    const rowsBefore = await prisma.loginCode.findMany({ where: { userId } });
    expect(rowsBefore).toHaveLength(1);

    const res = await resendCode(challengeId);

    // F1: a resend within the cooldown is blocked with a neutral 429.
    expect(res.status).toBe(429);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');
    // The 429 must not leak any account/token material.
    expect(res.body).not.toHaveProperty('challengeId');
    expect(res.body).not.toHaveProperty('accessToken');

    // T115: countdown data is surfaced to the UI via the standard Retry-After
    // header (the body stays the contract Error schema).
    const retryAfter = res.headers['retry-after'];
    expect(retryAfter).toBeDefined();
    const retrySeconds = Number(retryAfter);
    expect(Number.isFinite(retrySeconds)).toBe(true);
    expect(retrySeconds).toBeGreaterThan(0);
    expect(retrySeconds).toBeLessThanOrEqual(60);

    // F1: "issues/sends nothing" — no new LoginCode row, no email dispatched.
    const rowsAfter = await prisma.loginCode.findMany({ where: { userId } });
    expect(rowsAfter).toHaveLength(1);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // F2 — resend-code 6th request in 15m is blocked with 429 + Retry-After
  // -------------------------------------------------------------------------

  it('resend-code 6th request in 15m is blocked with 429 + Retry-After (F2)', async () => {
    const now = Date.now();
    const challengeId = `ethrottle-window-${now}`;
    // Base time inside the trailing 15m window so all seeded rows count.
    const baseTime = now - RATE_WINDOW_MS + 60_000;

    // Seed the maximum number of prior OTP rows for this user, each spaced
    // just past the cooldown so the window cap (not cooldown) blocks the next
    // request.  All rows share the same challengeId so the route can resolve
    // the user without a fresh initial code.
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

    const rowsBefore = await prisma.loginCode.findMany({ where: { userId } });
    expect(rowsBefore).toHaveLength(RATE_WINDOW_MAX_REQUESTS);

    const res = await resendCode(challengeId);

    // F2: the 6th request in the rolling 15m window is blocked.
    expect(res.status).toBe(429);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');

    // T115: countdown data surfaced via Retry-After.
    const retryAfter = res.headers['retry-after'];
    expect(retryAfter).toBeDefined();
    expect(Number(retryAfter)).toBeGreaterThan(0);

    // No new row, no email — the cap blocks issuance.
    const rowsAfter = await prisma.loginCode.findMany({ where: { userId } });
    expect(rowsAfter).toHaveLength(RATE_WINDOW_MAX_REQUESTS);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // F1/F3 — forgot-password throttled known account: byte-identical neutral
  // 200, issues nothing (silent skip)
  // -------------------------------------------------------------------------

  it('forgot-password throttled known account returns byte-identical neutral 200 and issues nothing (F1/F3)', async () => {
    // Issue a reset token "now" so the 60s cooldown is active for this account.
    await issueTokenAt(new Date());

    // Baseline: a non-throttled known-email request body (fresh slate).
    await resetAdminTables(userId);
    const baseline = await forgotPassword(email);
    expect(baseline.status).toBe(200);
    const baselineBody = baseline.text;
    // The baseline request must have issued a token + email (non-throttled).
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    // Re-seed an active cooldown for the throttled assertion.
    await resetAdminTables(userId);
    sendEmailMock.mockClear();
    await issueTokenAt(new Date());

    const rowsBefore = await prisma.passwordResetToken.findMany({ where: { userId } });
    expect(rowsBefore).toHaveLength(1);

    const res = await forgotPassword(email);

    // F3: the throttled known account returns the SAME neutral 200 — never 429.
    expect(res.status).toBe(200);
    // Byte-identical body to the non-throttled response (no enumeration leak).
    expect(res.text).toBe(baselineBody);

    // F1: "issues/sends nothing" during cooldown — no new token row, no email.
    const rowsAfter = await prisma.passwordResetToken.findMany({ where: { userId } });
    expect(rowsAfter).toHaveLength(1);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // F2/F3 — forgot-password 6th request in 15m: neutral 200, issues nothing
  // -------------------------------------------------------------------------

  it('forgot-password 6th request in 15m returns neutral 200 and issues nothing (F2/F3)', async () => {
    const now = Date.now();
    const baseTime = now - RATE_WINDOW_MS + 60_000; // inside the trailing window

    // Seed the maximum number of prior reset-token rows, each spaced past the
    // cooldown so the window cap (not cooldown) governs.
    for (let i = 0; i < RATE_WINDOW_MAX_REQUESTS; i += 1) {
      const issuedAt = new Date(baseTime + i * (RESEND_COOLDOWN_MS + 1_000));
      await prisma.passwordResetToken.create({
        data: {
          userId,
          tokenHash: `ethrottle-hash-${i}`,
          expiresAt: new Date(issuedAt.getTime() + RESET_TOKEN_TTL_MS),
          createdAt: issuedAt,
        },
      });
    }

    const rowsBefore = await prisma.passwordResetToken.findMany({ where: { userId } });
    expect(rowsBefore).toHaveLength(RATE_WINDOW_MAX_REQUESTS);

    const res = await forgotPassword(email);

    // F2/F3: the cap blocks issuance but the response stays the neutral 200.
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).not.toHaveProperty('token');

    // No new row, no email — the cap silently blocks issuance.
    const rowsAfter = await prisma.passwordResetToken.findMany({ where: { userId } });
    expect(rowsAfter).toHaveLength(RATE_WINDOW_MAX_REQUESTS);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // F3 — unknown email returns the same neutral 200 as a throttled known
  // account (no account-existence enumeration via the throttle)
  // -------------------------------------------------------------------------

  it('forgot-password unknown email returns the same neutral 200 as a throttled known account (F3)', async () => {
    // Put the known account into a throttled state (cooldown active).
    await issueTokenAt(new Date());

    const knownRes = await forgotPassword(email);
    expect(knownRes.status).toBe(200);

    // An unknown-email request must be indistinguishable from the throttled
    // known-account response — same status, byte-identical body.
    const unknownRes = await forgotPassword('nonexistent-ethrottle@example.com');
    expect(unknownRes.status).toBe(200);
    expect(unknownRes.text).toBe(knownRes.text);

    // No token row and no email for the unknown address.
    const tokens = await prisma.passwordResetToken.findMany({ where: { userId } });
    expect(tokens).toHaveLength(1); // only the seeded cooldown row
    // The throttled known account sent no email; the unknown account sent none
    // either — the mailer is never invoked across both requests.
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
