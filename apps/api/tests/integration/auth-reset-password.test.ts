/**
 * T042 — POST /admin/auth/reset-password integration tests (T-B2).
 *
 * Asserts the Phase 1 password-reset consumption contract:
 *   - matching policy-compliant password → 200, password changed, lockout cleared, sessions revoked
 *   - policy violation / mismatch → 400
 *   - used link → 410
 *   - expired link → 410
 *   - subsequent login old password → 401, new password → 200
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { PasswordResetTokenService } from '../../src/services/passwordResetToken.js';
import { RESET_TOKEN_TTL_MS } from '../../src/config/adminAuth.js';

describe('POST /admin/auth/reset-password', () => {
  const oldPassword = 'ValidPass123!';
  const newPassword = 'NewStrongPass1!';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found');
    }

    email = `reset-test-${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await argon2.hash(oldPassword),
        roleId: role.id,
        isActive: true,
        failedLoginAttempts: 0,
      },
    });
    userId = user.id;
  });

  beforeEach(async () => {
    await resetAdminTables(userId);

    // Reset lockout counters and password between tests.
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        passwordHash: await argon2.hash(oldPassword),
      },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  /**
   * Helper: issue a fresh reset token for the test user using an optional injected clock.
   */
  async function issueToken(initial?: Date) {
    const clock = createClock(initial ?? new Date());
    const service = new PasswordResetTokenService(prisma, clock.now);
    return service.issue(userId);
  }

  it('returns 200, changes password, clears lockout, and revokes sessions on valid token (C5/C6)', async () => {
    const { rawToken } = await issueToken();

    // Seed an existing refresh-token family so revocation can be verified.
    const family = 'pre-reset-family';
    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: 'pre-reset-hash',
        family,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Lock the account so we can verify reset clears it.
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const res = await request(app).post('/admin/auth/reset-password').send({
      token: rawToken,
      newPassword,
      confirmPassword: newPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');

    // Password must have been updated.
    const updated = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, failedLoginAttempts: true, lockedUntil: true },
    });
    if (!updated) {
      throw new Error('user not found after reset');
    }
    expect(await argon2.verify(updated.passwordHash, newPassword)).toBe(true);
    expect(await argon2.verify(updated.passwordHash, oldPassword)).toBe(false);

    // Lockout must be cleared (C5).
    expect(updated.failedLoginAttempts).toBe(0);
    expect(updated.lockedUntil).toBeNull();

    // Existing refresh-token family must be revoked (C6).
    const revoked = await prisma.refreshToken.findFirst({
      where: { userId, family },
    });
    expect(revoked?.revokedAt).not.toBeNull();
  });

  it('returns 400 when the new password does not meet the policy (D1-D4)', async () => {
    const { rawToken } = await issueToken();

    const short = 'Short1!';
    const res = await request(app).post('/admin/auth/reset-password').send({
      token: rawToken,
      newPassword: short,
      confirmPassword: short,
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');

    // Token must remain unconsumed so the user can retry (C3).
    const row = await prisma.passwordResetToken.findFirst({
      where: { userId },
    });
    expect(row?.consumedAt).toBeNull();
  });

  it('returns 400 when the password entries do not match (D4)', async () => {
    const { rawToken } = await issueToken();

    const res = await request(app).post('/admin/auth/reset-password').send({
      token: rawToken,
      newPassword,
      confirmPassword: 'DifferentPass1!',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');
  });

  it('returns 410 when the reset link has already been used (C3)', async () => {
    const { rawToken } = await issueToken();

    const first = await request(app).post('/admin/auth/reset-password').send({
      token: rawToken,
      newPassword,
      confirmPassword: newPassword,
    });
    expect(first.status).toBe(200);

    const second = await request(app).post('/admin/auth/reset-password').send({
      token: rawToken,
      newPassword,
      confirmPassword: newPassword,
    });
    expect(second.status).toBe(410);
    expect(second.body).toHaveProperty('error');
    expect(second.body).toHaveProperty('message');
  });

  it('returns 410 when the reset link has expired (C2)', async () => {
    // Issue a token 61 minutes ago so its 60-minute TTL has elapsed.
    const initial = new Date(Date.now() - RESET_TOKEN_TTL_MS - 60_000);
    const { rawToken } = await issueToken(initial);

    const res = await request(app).post('/admin/auth/reset-password').send({
      token: rawToken,
      newPassword,
      confirmPassword: newPassword,
    });

    expect(res.status).toBe(410);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');
  });

  it('subsequent login rejects the old password and accepts the new one (T-B2)', async () => {
    const { rawToken } = await issueToken();

    const resetRes = await request(app).post('/admin/auth/reset-password').send({
      token: rawToken,
      newPassword,
      confirmPassword: newPassword,
    });
    expect(resetRes.status).toBe(200);

    // Old password must no longer work.
    const oldLogin = await request(app).post('/admin/auth/login').send({
      email,
      password: oldPassword,
    });
    expect(oldLogin.status).toBe(401);

    // New password must work (login returns challengeId, no token yet).
    const newLogin = await request(app).post('/admin/auth/login').send({
      email,
      password: newPassword,
    });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body).toHaveProperty('challengeId');
    expect(newLogin.body).not.toHaveProperty('accessToken');
  });
});
