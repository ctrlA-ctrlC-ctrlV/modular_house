/**
 * T054 — GET /admin/settings/photo integration tests (T-B4).
 *
 * Asserts the Phase 1 profile-photo retrieval contract:
 *   - Photo set → 200 image bytes with correct Content-Type (G5/G6)
 *   - None set → 404 (client renders initials fallback)
 *   - Unauthenticated → 401
 *
 * The route already exists from T053; these tests pin the GET behaviour.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';

describe('GET /admin/settings/photo', () => {
  let userId: string;
  let email: string;

  /**
   * Minimal valid PNG buffer (1x1 transparent pixel) used to seed the
   * user's profile photo before retrieval tests.
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

    email = `settings-photo-get-${Date.now()}@example.com`;
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
    // Clear any previously uploaded photo.
    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: null, profilePhotoMime: null },
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

  it('returns 200 with image bytes and correct Content-Type when a photo is set (G5/G6)', async () => {
    // Seed the user's profile photo directly in the database.
    await prisma.user.update({
      where: { id: userId },
      data: {
        profilePhoto: PNG_BUFFER,
        profilePhotoMime: 'image/png',
      },
    });

    const session = await getSession();

    const res = await request(app)
      .get('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
    // The response body should contain the raw image bytes.
    expect(Buffer.from(res.body)).toEqual(PNG_BUFFER);
  });

  it('returns 404 when no profile photo is set (G4/G6)', async () => {
    // Photo columns are already null from beforeEach.
    const session = await getSession();

    const res = await request(app)
      .get('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 401 when no access token is provided', async () => {
    const res = await request(app)
      .get('/admin/settings/photo');

    expect(res.status).toBe(401);
  });
});
