/**
 * T052 — PUT /admin/settings/photo integration tests (T-B4).
 *
 * Asserts the Phase 1 profile-photo upload contract:
 *   - PNG/JPEG/WebP <= 5 MB → 200 Me with hasProfilePhoto=true (G1/G2/G3)
 *   - Bad MIME type (image/gif) → 400 (G3)
 *   - Over 5 MB → 400 (G2)
 *   - super_admin → 403 (FR-035)
 *   - Unauthenticated → 401
 *
 * The route does not exist yet; tests fail with 404 until T053 wires it.
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
import { PHOTO_MAX_BYTES } from '../../src/config/adminAuth.js';

describe('PUT /admin/settings/photo', () => {
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `settings-photo-${Date.now()}@example.com`;
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

  /**
   * Build a minimal valid PNG buffer (1x1 transparent pixel).
   * This avoids coupling the test to a real image file on disk.
   */
  function createPngBuffer(): Buffer {
    // Minimal valid PNG: 8-byte signature + IHDR + IDAT + IEND.
    return Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB' +
        'Nl7BcQAAAABJRU5ErkJggg==',
      'base64',
    );
  }

  /**
   * Build a minimal valid JPEG buffer (SOI + EOI markers).
   */
  function createJpegBuffer(): Buffer {
    return Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9]);
  }

  /**
   * Build a minimal valid WebP buffer (RIFF header + WEBP marker).
   */
  function createWebpBuffer(): Buffer {
    // RIFF header (4 bytes) + file size (4 bytes, LE) + WEBP marker (4 bytes)
    // + VP8 chunk header + minimal data.
    const header = Buffer.from('RIFF');
    const size = Buffer.alloc(4);
    size.writeUInt32LE(20, 0); // 4 (WEBP) + 4 (VP8 ) + 4 (size) + 8 (data)
    const webp = Buffer.from('WEBP');
    const vp8 = Buffer.from('VP8 ');
    const vp8Size = Buffer.alloc(4);
    vp8Size.writeUInt32LE(8, 0);
    const data = Buffer.alloc(8, 0); // minimal VP8 frame data
    return Buffer.concat([header, size, webp, vp8, vp8Size, data]);
  }

  it('accepts a PNG upload and returns 200 Me with hasProfilePhoto=true (G1)', async () => {
    const session = await getSession();

    const res = await request(app)
      .put('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair)
      .attach('photo', createPngBuffer(), {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('hasProfilePhoto', true);
    expect(res.body).toHaveProperty('id', userId);
  });

  it('accepts a JPEG upload and returns 200 Me with hasProfilePhoto=true (G1)', async () => {
    const session = await getSession();

    const res = await request(app)
      .put('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair)
      .attach('photo', createJpegBuffer(), {
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('hasProfilePhoto', true);
  });

  it('accepts a WebP upload and returns 200 Me with hasProfilePhoto=true (G1)', async () => {
    const session = await getSession();

    const res = await request(app)
      .put('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair)
      .attach('photo', createWebpBuffer(), {
        filename: 'avatar.webp',
        contentType: 'image/webp',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('hasProfilePhoto', true);
  });

  it('returns 400 for an unsupported MIME type (G3)', async () => {
    const session = await getSession();

    const res = await request(app)
      .put('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair)
      .attach('photo', Buffer.from('GIF89a'), {
        filename: 'avatar.gif',
        contentType: 'image/gif',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 400 when the file exceeds 5 MB (G2)', async () => {
    const session = await getSession();

    // Create a buffer that exceeds PHOTO_MAX_BYTES (5 MB).
    const oversized = Buffer.alloc(PHOTO_MAX_BYTES + 1, 0xff);

    const res = await request(app)
      .put('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair)
      .attach('photo', oversized, {
        filename: 'big.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 403 for a super_admin account (FR-035)', async () => {
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'super_admin' },
    });
    if (!superAdminRole) {
      throw new Error('super_admin role not found — seed required');
    }

    const saEmail = `sa-photo-${Date.now()}@example.com`;
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
        .put('/admin/settings/photo')
        .set('Authorization', `Bearer ${token}`)
        .attach('photo', createPngBuffer(), {
          filename: 'avatar.png',
          contentType: 'image/png',
        });

      expect(res.status).toBe(403);
    } finally {
      await prisma.user.delete({ where: { id: saUser.id } }).catch(() => {});
    }
  });

  it('returns 401 when no access token is provided', async () => {
    const res = await request(app)
      .put('/admin/settings/photo')
      .attach('photo', createPngBuffer(), {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(401);
  });
});
