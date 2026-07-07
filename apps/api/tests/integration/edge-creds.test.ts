/**
 * T104 — E-CREDS edge-case integration tests (A5/A6, FR-008).
 *
 * Asserts the generic-credential non-enumeration contract on POST /admin/auth/login:
 *   - unknown email and wrong password produce byte-identical generic 401 responses (A5)
 *   - a deactivated account (isActive=false) is blocked with the same 401 even
 *     when the submitted password is correct (A6)
 *
 * Byte-identity is asserted on the raw response body string (res.text), not
 * just the parsed shape, so no field/value/key-order difference may leak which
 * case triggered the failure. The mailer is mocked at the module boundary so
 * no real SMTP call leaves the test process. Runs against the Phase 1 test
 * database on port 5434.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';

// Mock the SMTP mailer at the module boundary so login emails are captured, not sent.
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

describe('E-CREDS — generic-credential + deactivated (A5/A6, FR-008)', () => {
  const password = 'ValidPass123!';
  let activeUserId: string;
  let activeEmail: string;
  let deactivatedUserId: string;
  let deactivatedEmail: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    // Active user — the known account used for the wrong-password case (A5).
    activeEmail = `ecreds-active-${Date.now()}@example.com`;
    const activeUser = await prisma.user.create({
      data: {
        email: activeEmail,
        passwordHash: await argon2.hash(password),
        roleId: role.id,
        isActive: true,
        failedLoginAttempts: 0,
      },
    });
    activeUserId = activeUser.id;

    // Deactivated user — correct password but isActive=false (A6).
    deactivatedEmail = `ecreds-deactivated-${Date.now()}@example.com`;
    const deactivatedUser = await prisma.user.create({
      data: {
        email: deactivatedEmail,
        passwordHash: await argon2.hash(password),
        roleId: role.id,
        isActive: false,
        failedLoginAttempts: 0,
      },
    });
    deactivatedUserId = deactivatedUser.id;
  });

  beforeEach(async () => {
    // Reset Phase 1 tables, audit rows, and lockout counters per user so tests
    // start from a clean baseline and failure counters never accumulate across
    // tests (avoids accidentally crossing the A2 lockout threshold mid-suite).
    await resetAdminTables(activeUserId);
    await resetAdminTables(deactivatedUserId);
    await prisma.auditLog.deleteMany({ where: { userId: activeUserId } }).catch(() => {});
    await prisma.auditLog.deleteMany({ where: { userId: deactivatedUserId } }).catch(() => {});
    await prisma.user.update({
      where: { id: activeUserId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    await prisma.user.update({
      where: { id: deactivatedUserId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    sendEmailMock.mockClear();
  });

  afterAll(async () => {
    // Audit rows must be removed before users (RESTRICT FK on audit_logs.user_id).
    await prisma.auditLog.deleteMany({ where: { userId: activeUserId } }).catch(() => {});
    await prisma.auditLog.deleteMany({ where: { userId: deactivatedUserId } }).catch(() => {});
    await prisma.user.delete({ where: { id: activeUserId } }).catch(() => {});
    await prisma.user.delete({ where: { id: deactivatedUserId } }).catch(() => {});
    await disconnectDb();
  });

  it('returns a generic 401 for an unknown email (A5)', async () => {
    const res = await request(app)
      .post('/admin/auth/login')
      .send({ email: `nobody-${Date.now()}@example.com`, password: 'AnyPass1234!' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      error: 'Unauthorized',
      message: 'Invalid credentials',
    });
    // No session or challenge is leaked on a credential failure.
    expect(res.body).not.toHaveProperty('accessToken');
    expect(res.body).not.toHaveProperty('challengeId');
  });

  it('returns a generic 401 for a wrong password on a known account (A5)', async () => {
    const res = await request(app)
      .post('/admin/auth/login')
      .send({ email: activeEmail, password: 'WrongPass1234!' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      error: 'Unauthorized',
      message: 'Invalid credentials',
    });
    expect(res.body).not.toHaveProperty('accessToken');
    expect(res.body).not.toHaveProperty('challengeId');
  });

  it('blocks a deactivated account with the same generic 401 even with correct credentials (A6)', async () => {
    const res = await request(app)
      .post('/admin/auth/login')
      .send({ email: deactivatedEmail, password }); // correct password, isActive=false

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      error: 'Unauthorized',
      message: 'Invalid credentials',
    });
    expect(res.body).not.toHaveProperty('accessToken');
    expect(res.body).not.toHaveProperty('challengeId');
  });

  it('produces byte-identical 401 bodies for unknown email, wrong password, and deactivated (A5/A6)', async () => {
    // Send one request per failure case and capture the raw response bytes.
    const unknownRes = await request(app)
      .post('/admin/auth/login')
      .send({ email: `nobody-byte-${Date.now()}@example.com`, password: 'AnyPass1234!' });

    const wrongRes = await request(app)
      .post('/admin/auth/login')
      .send({ email: activeEmail, password: 'WrongPass1234!' });

    const deactivatedRes = await request(app)
      .post('/admin/auth/login')
      .send({ email: deactivatedEmail, password }); // correct password, isActive=false

    // All three must share status 401 (A5/A6).
    expect(unknownRes.status).toBe(401);
    expect(wrongRes.status).toBe(401);
    expect(deactivatedRes.status).toBe(401);

    // The raw response body bytes must be identical — no field, value, or key
    // ordering difference may leak which case triggered the failure (A5).
    expect(wrongRes.text).toBe(unknownRes.text);
    expect(deactivatedRes.text).toBe(unknownRes.text);

    // The content-type header must also match so the responses are
    // indistinguishable at the header level as well as the body level.
    expect(wrongRes.headers['content-type']).toBe(unknownRes.headers['content-type']);
    expect(deactivatedRes.headers['content-type']).toBe(unknownRes.headers['content-type']);
  });
});
