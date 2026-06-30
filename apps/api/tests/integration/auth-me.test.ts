/**
 * T048 — GET /admin/auth/me integration tests (T-B5, T-B7).
 *
 * Asserts the Phase 1 identity endpoint contract:
 *   - authenticated → 200 Me (id, email, displayName, role, permissions,
 *     hasProfilePhoto, isSuperAdmin, preferences)
 *   - unauthenticated → 401
 *
 * The route does not exist yet; tests fail with 404 until T049 wires it.
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

describe('GET /admin/auth/me', () => {
  const password = 'ValidPass123!';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `me-test-${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await argon2.hash(password),
        roleId: role.id,
        isActive: true,
        failedLoginAttempts: 0,
        displayName: 'Me Test User',
      },
    });
    userId = user.id;
  });

  beforeEach(async () => {
    await resetAdminTables(userId);
    await prisma.refreshToken.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  /**
   * Complete verify-2fa to obtain a valid access token.
   */
  async function getAccessToken(): Promise<string> {
    const clock = createClock(new Date());
    const loginCodeService = new LoginCodeService(prisma, clock.now);
    const { challengeId, code } = await loginCodeService.issue(userId);

    const res = await request(app)
      .post('/admin/auth/verify-2fa')
      .send({ challengeId, code });

    if (res.status !== 200) {
      throw new Error(`verify-2fa failed: ${res.status}`);
    }

    return res.body.accessToken as string;
  }

  it('returns 200 Me with identity, role, permissions, and preferences (T-B5/T-B7)', async () => {
    const accessToken = await getAccessToken();

    const res = await request(app)
      .get('/admin/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);

    // Required fields from the Me schema.
    expect(res.body).toMatchObject({
      id: userId,
      email,
      role: 'admin',
      permissions: expect.any(Array),
      hasProfilePhoto: false,
      isSuperAdmin: false,
    });

    // displayName was set on user creation.
    expect(res.body.displayName).toBe('Me Test User');

    // Permissions should be in resource:action format (E1).
    expect(res.body.permissions.length).toBeGreaterThan(0);
    for (const perm of res.body.permissions) {
      expect(perm).toMatch(/^\w+:\w+$/);
    }

    // Preferences must be present (H1/H2).
    expect(res.body.preferences).toBeDefined();
    expect(res.body.preferences).toHaveProperty('themeMode');
    expect(res.body.preferences).toHaveProperty('sidebarCollapsed');
    expect(['light', 'dark', 'system']).toContain(res.body.preferences.themeMode);
    expect(typeof res.body.preferences.sidebarCollapsed).toBe('boolean');

    // Access token used to authenticate must still be the same user (FR-036).
    const decoded = jwt.verify(accessToken, config.security.jwtSecret) as {
      userId: string;
    };
    expect(decoded.userId).toBe(userId);
  });

  it('returns 401 when no access token is provided', async () => {
    const res = await request(app).get('/admin/auth/me');

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      error: expect.any(String),
      message: expect.any(String),
    });
    expect(res.body).not.toHaveProperty('id');
  });

  it('returns 401 for an invalid access token', async () => {
    const res = await request(app)
      .get('/admin/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
  });
});
