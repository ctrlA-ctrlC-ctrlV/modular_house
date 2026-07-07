/**
 * T056 — DELETE /admin/settings/photo integration tests (T-B4).
 *
 * Asserts the Phase 1 profile-photo removal contract:
 *   - Remove → 200 Me with hasProfilePhoto=false (G4)
 *   - super_admin → 403 (FR-035)
 *   - Unauthenticated → 401
 *
 * The route does not exist yet; tests fail with 404 until T057 wires it.
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

describe('DELETE /admin/settings/photo', () => {
  let userId: string;
  let email: string;

  /**
   * Minimal valid PNG buffer (1x1 transparent pixel) used to seed the
   * user's profile photo before the deletion test.
   */
  const PNG_BUFFER = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB' +
      'Nl7BcQAAAABJRU5ErkJggg==',
    'base64',
  );

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `settings-photo-del-${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await argon2.hash('ValidPass123!'),
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
    // Seed a photo so the DELETE has something to remove.
    await prisma.user.update({
      where: { id: userId },
      data: {
        profilePhoto: PNG_BUFFER,
        profilePhotoMime: 'image/png',
      },
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

  it('removes the photo and returns 200 Me with hasProfilePhoto=false (G4)', async () => {
    const session = await getSession();

    const res = await request(app)
      .delete('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('hasProfilePhoto', false);
    expect(res.body).toHaveProperty('id', userId);
  });

  it('returns 403 for a super_admin account (FR-035)', async () => {
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'super_admin' },
    });
    if (!superAdminRole) {
      throw new Error('super_admin role not found — seed required');
    }

    const saEmail = `sa-photo-del-${Date.now()}@example.com`;
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
      const token = jwt.sign(
        { userId: saUser.id, email: saEmail, role: 'super_admin', permissions: [] },
        config.security.jwtSecret,
        { expiresIn: '15m' },
      );

      const res = await request(app)
        .delete('/admin/settings/photo')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    } finally {
      await prisma.user.delete({ where: { id: saUser.id } }).catch(() => {});
    }
  });

  it('returns 401 when no access token is provided', async () => {
    const res = await request(app)
      .delete('/admin/settings/photo');

    expect(res.status).toBe(401);
  });
});
