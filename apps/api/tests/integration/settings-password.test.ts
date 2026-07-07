/**
 * T050 — PUT /admin/settings/password integration tests (T-B3).
 *
 * Asserts the Phase 1 password-change contract:
 *   - correct current + policy-valid new → 200, other sessions revoked,
 *     acting session re-minted (E6)
 *   - password mismatch (new vs confirm) → 400
 *   - policy violation → 400
 *   - wrong current password → 400 (D5)
 *   - super_admin → 403
 *
 * The route does not exist yet; tests fail with 404 until T051 wires it.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';
import { config } from '../../src/config/env.js';

describe('PUT /admin/settings/password', () => {
  const oldPassword = 'ValidPass123!';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `settings-pwd-${Date.now()}@example.com`;
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
    await prisma.refreshToken.deleteMany({ where: { userId } });
    // Restore the user's password to the known value in case a previous
    // test changed it.
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await argon2.hash(oldPassword) },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  /**
   * Complete verify-2fa and return the access token and cookie pair.
   */
  async function getSession(): Promise<{
    accessToken: string;
    cookiePair: string;
  }> {
    const clock = createClock(new Date());
    const loginCodeService = new LoginCodeService(prisma, clock.now);
    const { challengeId, code } = await loginCodeService.issue(userId);

    const res = await request(app)
      .post('/admin/auth/verify-2fa')
      .send({ challengeId, code });

    if (res.status !== 200) {
      throw new Error(`verify-2fa failed: ${res.status}`);
    }

    const setCookie = res.headers['set-cookie'];
    const cookieStr: string = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    const cookiePair = cookieStr.split(';')[0].trim();

    return { accessToken: res.body.accessToken as string, cookiePair };
  }

  it('returns 200, re-mints the acting session, and revokes other sessions (D5/E6)', async () => {
    // Obtain two independent sessions (two logins) for the same user.
    const sessionA = await getSession();
    const sessionB = await getSession();

    const newPassword = 'NewValidPass123!';

    const res = await request(app)
      .put('/admin/settings/password')
      .set('Authorization', `Bearer ${sessionA.accessToken}`)
      .set('Cookie', sessionA.cookiePair)
      .send({
        currentPassword: oldPassword,
        newPassword,
        confirmPassword: newPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: expect.any(String),
    });

    // E6: acting session stays valid — a new refresh cookie is set.
    const newCookies = res.headers['set-cookie'];
    if (newCookies) {
      const newCookieStr: string = Array.isArray(newCookies) ? newCookies[0] : newCookies;
      expect(newCookieStr).toMatch(/refreshToken=/);
    }

    // E6: other sessions are revoked — session B's cookie must be unusable.
    const refreshB = await request(app)
      .post('/admin/auth/refresh')
      .set('Cookie', sessionB.cookiePair);
    expect(refreshB.status).toBe(401);

    // The new password must now work for login.
    const loginRes = await request(app)
      .post('/admin/auth/login')
      .send({ email, password: newPassword });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('challengeId');
  });

  it('returns 400 when newPassword and confirmPassword do not match (D4)', async () => {
    const session = await getSession();

    const res = await request(app)
      .put('/admin/settings/password')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair)
      .send({
        currentPassword: oldPassword,
        newPassword: 'NewValidPass123!',
        confirmPassword: 'DifferentPass123!',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');
  });

  it('returns 400 when newPassword equals the current password (D3)', async () => {
    const session = await getSession();

    const res = await request(app)
      .put('/admin/settings/password')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair)
      .send({
        currentPassword: oldPassword,
        newPassword: oldPassword,
        confirmPassword: oldPassword,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 400 for a policy-violating new password (D1/D2)', async () => {
    const session = await getSession();

    // Too short (below D1 minimum of 12).
    const res = await request(app)
      .put('/admin/settings/password')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair)
      .send({
        currentPassword: oldPassword,
        newPassword: 'Short1',
        confirmPassword: 'Short1',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 400 when the current password is wrong (D5)', async () => {
    const session = await getSession();

    const res = await request(app)
      .put('/admin/settings/password')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair)
      .send({
        currentPassword: 'WrongCurrentPass1!',
        newPassword: 'NewValidPass123!',
        confirmPassword: 'NewValidPass123!',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 403 for a super_admin account (FR-035)', async () => {
    // Create a super_admin user for this test.
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'super_admin' },
    });
    if (!superAdminRole) {
      throw new Error('super_admin role not found — seed required');
    }

    const saEmail = `sa-pwd-${Date.now()}@example.com`;
    const saUser = await prisma.user.create({
      data: {
        email: saEmail,
        passwordHash: await argon2.hash('SuperAdminPass1!'),
        roleId: superAdminRole.id,
        isActive: true,
        failedLoginAttempts: 0,
      },
    });

    try {
      // Sign a valid JWT for the super_admin user.
      const token = jwt.sign(
        { userId: saUser.id, email: saEmail, role: 'super_admin', permissions: [] },
        config.security.jwtSecret,
        { expiresIn: '15m' },
      );

      const res = await request(app)
        .put('/admin/settings/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'SuperAdminPass1!',
          newPassword: 'NewValidPass123!',
          confirmPassword: 'NewValidPass123!',
        });

      expect(res.status).toBe(403);
    } finally {
      await prisma.user.delete({ where: { id: saUser.id } }).catch(() => {});
    }
  });

  it('returns 401 when no access token is provided', async () => {
    const res = await request(app)
      .put('/admin/settings/password')
      .send({
        currentPassword: oldPassword,
        newPassword: 'NewValidPass123!',
        confirmPassword: 'NewValidPass123!',
      });

    expect(res.status).toBe(401);
  });
});
