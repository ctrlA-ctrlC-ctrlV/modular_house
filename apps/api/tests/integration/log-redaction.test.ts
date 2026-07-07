/**
 * T102 — Log-line secret-redaction integration test (FR-039, I3).
 *
 * Complements the audit-entry check (T101) by verifying that no raw password,
 * OTP code, or reset token ever reaches a Pino log line across the four
 * authentication flows (login, 2FA, reset, change). The primary leak vector is
 * the body-validation middleware (validate.ts), which logs `body: req.body`
 * verbatim when Zod validation fails — a request carrying a password or token
 * would otherwise be written to the log stream in clear text.
 *
 * Approach: the real `middleware/logger.js` module is mocked so every `logger`
 * call routes to an in-memory capture stream configured with the SAME redact
 * paths the production logger uses (T103 exports `REDACT_PATHS`). A direct
 * redaction test exercises the paths explicitly; flow-based tests drive the
 * auth routes through supertest and assert the secret values never appear in
 * the captured output.
 *
 * TDD flow: before T103 `REDACT_PATHS` is absent, the mock logger has no
 * redaction, and the direct + validation-failure tests fail because secrets
 * appear in the captured output (red phase). After T103 adds the export and
 * the production `redact` option, all tests pass (green phase).
 *
 * The SMTP mailer is mocked at the module boundary so no real network call
 * leaves the test process. Runs against the Phase 1 test database on port 5434.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { logger } from '../../src/middleware/logger.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';
import { PasswordResetTokenService } from '../../src/services/passwordResetToken.js';

// ---------------------------------------------------------------------------
// Type alias for the logger module including the optional REDACT_PATHS export
// added by T103. Before T103 the export is absent; the optional typing keeps
// typecheck green in both the red and green phases.
// ---------------------------------------------------------------------------
type LoggerModule = typeof import('../../src/middleware/logger.js') & {
  REDACT_PATHS?: readonly string[];
};

// ---------------------------------------------------------------------------
// Hoisted capture state — shared between the hoisted vi.mock factory and the
// test body. `logChunks` accumulates every chunk Pino writes to the capture
// stream; `clearLogs` empties it between tests so each assertion sees only the
// log output produced within its own test.
// ---------------------------------------------------------------------------
const { logChunks, clearLogs } = vi.hoisted(() => {
  const chunks: string[] = [];
  return {
    logChunks: chunks,
    clearLogs: (): void => {
      chunks.length = 0;
    },
  };
});

// ---------------------------------------------------------------------------
// Mock the Pino logger so every `logger.*` call writes to the in-memory
// capture stream, configured with the REAL redact paths exported by T103.
// The `importOriginal` call retrieves the production module so the mock can
// reuse its `REDACT_PATHS` constant — this ties the test to the exact redact
// configuration the production logger uses, not a parallel copy that could
// drift. The real `httpLogger` (request-lifecycle logging — no secrets) is
// preserved via the spread so only the `logger` instance is replaced.
// ---------------------------------------------------------------------------
vi.mock('../../src/middleware/logger.js', async (importOriginal) => {
  const { Writable } = await import('node:stream');
  const { default: pino } = await import('pino');
  const actual = (await importOriginal()) as LoggerModule;

  // In-memory capture stream: every Pino write appends the JSON line to the
  // hoisted chunks array so the test body can inspect the full log output
  // after each request. Synchronous _write guarantees the chunk is available
  // immediately after the logger call returns (no async drain delay).
  const captureStream = new Writable({
    decodeStrings: false,
    write(chunk: Buffer | string, _enc: string, cb: () => void): void {
      logChunks.push(typeof chunk === 'string' ? chunk : chunk.toString());
      cb();
    },
  });

  // Use the production redact paths when available (after T103); before T103
  // the paths array is empty and the logger has no redaction, so the
  // validation-failure and direct-redaction tests fail as expected (TDD red).
  const paths = actual.REDACT_PATHS ? [...actual.REDACT_PATHS] : [];
  const testLogger = pino(
    paths.length > 0
      ? { level: 'debug', redact: { paths, censor: '[Redacted]' } }
      : { level: 'debug' },
    captureStream,
  );

  // Preserve the real httpLogger (request-lifecycle logging carries no
  // secrets) and replace only the `logger` instance so route, middleware, and
  // service calls all flow through the redacted capture stream.
  return { ...actual, logger: testLogger };
});

// ---------------------------------------------------------------------------
// Mock the SMTP mailer so login emails are captured, not sent. Matches the
// module-boundary pattern used across the integration suite (FR-039 testing
// requirement: no real network call may leave the test process).
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
    // No-op constructor — no SMTP connection is attempted.
  }
  MockMailerService.prototype.sendEmail = sendEmailMock;
  MockMailerService.prototype.close = vi.fn().mockResolvedValue(undefined);
  return {
    MailerService: MockMailerService,
    mailer: new MockMailerService(),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return all captured Pino output as a single concatenated string. */
function getCapturedLogs(): string {
  return logChunks.join('');
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Log-line secret redaction (T102, FR-039, I3)', () => {
  const password = 'ValidPass123!';
  const newPassword = 'NewValidPass123!';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `redact-${Date.now()}@example.com`;
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
    // Per-test slate reset — same scoping rationale as audit-events.test.ts:
    // cleaning only the test user's rows avoids cross-test races under
    // Vitest's parallel execution while keeping each test independent.
    await resetAdminTables(userId);
    await prisma.auditLog.deleteMany({ where: { userId } }).catch(() => {});
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

    clearLogs();
    sendEmailMock.mockClear();
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  /**
   * Issue an OTP directly via the LoginCodeService and complete the verify-2fa
   * step, returning the access token + refresh-cookie pair + raw OTP code so
   * callers can assert the code never reaches the log stream.
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

  // -------------------------------------------------------------------------
  // Direct redaction — verifies REDACT_PATHS redacts every secret field at
  // both the top level and nested under `body` (the validate.ts leak vector).
  // These tests fail before T103 (no redaction) and pass after.
  // -------------------------------------------------------------------------

  it('redacts top-level credential fields (password, code, token, etc.)', () => {
    const secretPass = 'DirectSecretPass123!';
    const secretNewPass = 'DirectNewPass123!';
    const secretCurrentPass = 'DirectCurrentPass123!';
    const secretConfirmPass = 'DirectConfirmPass123!';
    const secretCode = 'direct-otp-code-xyz';
    const secretToken = 'direct-reset-token-abc123';
    const secretRefresh = 'direct-refresh-token-xyz';

    logger.info(
      {
        password: secretPass,
        newPassword: secretNewPass,
        currentPassword: secretCurrentPass,
        confirmPassword: secretConfirmPass,
        code: secretCode,
        token: secretToken,
        refreshToken: secretRefresh,
      },
      'direct redaction test',
    );

    const output = getCapturedLogs();
    expect(output).not.toContain(secretPass);
    expect(output).not.toContain(secretNewPass);
    expect(output).not.toContain(secretCurrentPass);
    expect(output).not.toContain(secretConfirmPass);
    expect(output).not.toContain(secretCode);
    expect(output).not.toContain(secretToken);
    expect(output).not.toContain(secretRefresh);
    // The censor marker confirms the value was redacted, not merely absent.
    expect(output).toContain('[Redacted]');
  });

  it('redacts nested body.password / body.code / body.token paths', () => {
    const secretPass = 'NestedSecretPass456!';
    const secretNewPass = 'NestedNewPass456!';
    const secretCode = 'nested-otp-code-xyz';
    const secretToken = 'nested-reset-token-def456';

    logger.info(
      {
        body: {
          password: secretPass,
          newPassword: secretNewPass,
          code: secretCode,
          token: secretToken,
        },
      },
      'nested redaction test',
    );

    const output = getCapturedLogs();
    expect(output).not.toContain(secretPass);
    expect(output).not.toContain(secretNewPass);
    expect(output).not.toContain(secretCode);
    expect(output).not.toContain(secretToken);
    expect(output).toContain('[Redacted]');
  });

  // -------------------------------------------------------------------------
  // Login flow — validation failure triggers validate.ts body logging (the
  // primary leak vector); success is a belt-and-suspenders check.
  // -------------------------------------------------------------------------

  it('login validation failure does not leak the password in log lines', async () => {
    // Malformed email triggers Zod validation failure, causing validate.ts to
    // log `body: req.body` — which includes the raw password.
    const leakPass = 'LeakTestPass123!';
    const res = await request(app)
      .post('/admin/auth/login')
      .send({ email: 'not-an-email', password: leakPass });

    expect(res.status).toBe(400);
    const output = getCapturedLogs();
    expect(output).not.toContain(leakPass);
  });

  it('login success does not leak the password in log lines', async () => {
    const res = await request(app).post('/admin/auth/login').send({ email, password });

    expect(res.status).toBe(200);
    const output = getCapturedLogs();
    expect(output).not.toContain(password);
  });

  // -------------------------------------------------------------------------
  // 2FA flow
  // -------------------------------------------------------------------------

  it('verify-2fa validation failure does not leak the OTP code in log lines', async () => {
    // Empty challengeId triggers Zod validation failure while the code field
    // is present and valid-shaped, so the 6-digit value would be logged raw
    // via validate.ts body logging. The quoted-form assertion avoids
    // coincidental substring matches in numeric timestamps/ids.
    const leakCode = '531904';
    const res = await request(app)
      .post('/admin/auth/verify-2fa')
      .send({ challengeId: '', code: leakCode });

    expect(res.status).toBe(400);
    const output = getCapturedLogs();
    expect(output).not.toContain(`"${leakCode}"`);
  });

  it('verify-2fa success does not leak the OTP code in log lines', async () => {
    const session = await getSession();

    const output = getCapturedLogs();
    // The raw 6-digit code is quoted in JSON output; assert the quoted form to
    // avoid coincidental substring matches in numeric timestamps/ids.
    expect(output).not.toContain(`"${session.code}"`);
  });

  // -------------------------------------------------------------------------
  // Reset flow
  // -------------------------------------------------------------------------

  it('reset-password validation failure does not leak the token or new password', async () => {
    // Missing confirmPassword triggers validate.ts body logging with the raw
    // token and new password present in the logged body object.
    const leakToken = 'leak-test-reset-token-abc123xyz';
    const res = await request(app)
      .post('/admin/auth/reset-password')
      .send({ token: leakToken, newPassword });

    expect(res.status).toBe(400);
    const output = getCapturedLogs();
    expect(output).not.toContain(leakToken);
    expect(output).not.toContain(newPassword);
  });

  it('reset-password success does not leak the token or new password', async () => {
    const resetService = new PasswordResetTokenService(prisma);
    const { rawToken } = await resetService.issue(userId);

    const res = await request(app)
      .post('/admin/auth/reset-password')
      .send({ token: rawToken, newPassword, confirmPassword: newPassword });

    expect(res.status).toBe(200);
    const output = getCapturedLogs();
    expect(output).not.toContain(rawToken);
    expect(output).not.toContain(newPassword);
  });

  // -------------------------------------------------------------------------
  // Change flow (settings password)
  // -------------------------------------------------------------------------

  it('settings password-change validation failure does not leak passwords', async () => {
    const session = await getSession();
    const changedPass = 'ChangedPass123!';

    // Missing confirmPassword triggers validate.ts body logging with both the
    // current and new passwords in the logged body object.
    const res = await request(app)
      .put('/admin/settings/password')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({ currentPassword: password, newPassword: changedPass });

    expect(res.status).toBe(400);
    const output = getCapturedLogs();
    expect(output).not.toContain(password);
    expect(output).not.toContain(changedPass);
  });

  it('settings password-change success does not leak passwords', async () => {
    const session = await getSession();
    const changedPass = 'ChangedPass123!';

    const res = await request(app)
      .put('/admin/settings/password')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair)
      .send({
        currentPassword: password,
        newPassword: changedPass,
        confirmPassword: changedPass,
      });

    expect(res.status).toBe(200);
    const output = getCapturedLogs();
    expect(output).not.toContain(password);
    expect(output).not.toContain(changedPass);
  });
});
