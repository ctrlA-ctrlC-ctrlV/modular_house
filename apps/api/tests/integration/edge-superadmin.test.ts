/**
 * T125 — E-SUPERADMIN edge-case integration tests (FR-035).
 *
 * Pins the super_admin read-only guarantee across all three settings
 * mutation endpoints, going beyond the coarser Pass-1 coverage in T050
 * (`settings-password.test.ts`), T052 (`settings-photo-put.test.ts`), and
 * T056 (`settings-photo-delete.test.ts`):
 *
 *   - PUT /admin/settings/password as super_admin → 403 AND the stored
 *     password hash is byte-for-byte unchanged (the Pass-1 test only
 *     asserted the 403 status, never that no mutation occurred).
 *   - PUT /admin/settings/photo as super_admin → 403 AND no photo is
 *     persisted (a follow-up authenticated GET still returns 404).
 *   - DELETE /admin/settings/photo as super_admin → 403 AND a
 *     pre-existing photo survives byte-for-byte (a follow-up GET returns
 *     the original bytes/MIME type unchanged).
 *
 * Sessions are obtained through the real login + verify-2fa flow (not a
 * hand-signed JWT) so the "no change" assertions exercise the same
 * authenticated path a real super_admin session would use. The settings
 * routes have no TTL/expiry/lockout/cooldown/idle logic, so the injected
 * clock is used only for the verify-2fa session helper (mirroring the
 * T117 edge-photo.test.ts pattern). Runs against the Phase 1 test
 * database on port 5434.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';

describe('E-SUPERADMIN — read-only enforcement across settings mutations (FR-035)', () => {
  const password = 'SuperAdminPass1!';
  let userId: string;
  let email: string;
  let originalPasswordHash: string;

  /**
   * Minimal valid PNG buffer (1x1 transparent pixel) used to seed the
   * super_admin's profile photo for the DELETE "no change" assertion.
   */
  const SEED_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB' +
      'Nl7BcQAAAABJRU5ErkJggg==',
    'base64',
  );
  const SEED_MIME = 'image/png';

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'super_admin' } });
    if (!role) {
      throw new Error('super_admin role not found — seed required');
    }

    email = `esuperadmin-${Date.now()}@example.com`;
    originalPasswordHash = await argon2.hash(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: originalPasswordHash,
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
    // Reset to the known password hash and a clean photo slate; individual
    // tests seed a photo when they need one to protect.
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: originalPasswordHash,
        profilePhoto: null,
        profilePhotoMime: null,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  /**
   * Complete login + verify-2fa for the super_admin account and return the
   * access token + cookie pair, exercising the same authenticated path a
   * real super_admin session would use (FR-035 retains unrestricted access
   * to everything except settings mutations).
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

  it('rejects PUT /admin/settings/password with 403 and leaves the password hash unchanged', async () => {
    const session = await getSession();

    const res = await request(app)
      .put('/admin/settings/password')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair)
      .send({
        currentPassword: password,
        newPassword: 'NewValidPass123!',
        confirmPassword: 'NewValidPass123!',
      });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message');

    // No-change guarantee: the stored hash must be byte-for-byte identical
    // to the pre-request value — the route must never reach the password
    // update for a super_admin account.
    const after = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
    expect(after?.passwordHash).toBe(originalPasswordHash);

    // Confirm the original password still authenticates (behavioural proof
    // that no change was persisted, not just a raw string comparison).
    const loginRes = await request(app)
      .post('/admin/auth/login')
      .send({ email, password });
    expect(loginRes.status).toBe(200);
  });

  it('rejects PUT /admin/settings/photo with 403 and persists no photo', async () => {
    const session = await getSession();

    const res = await request(app)
      .put('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair)
      .attach('photo', SEED_PNG, {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message');

    // No-change guarantee: no photo was persisted — a follow-up authenticated
    // GET still returns 404 (the same signal that drives the initials
    // fallback per G4/G6).
    const after = await request(app)
      .get('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair);
    expect(after.status).toBe(404);
  });

  it('rejects DELETE /admin/settings/photo with 403 and preserves the existing photo byte-for-byte', async () => {
    // Seed a photo directly via Prisma so the DELETE has something to
    // protect — this isolates the "no change" assertion from the upload path.
    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: SEED_PNG, profilePhotoMime: SEED_MIME },
    });

    const session = await getSession();

    const res = await request(app)
      .delete('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message');

    // No-change guarantee: the original PNG must still be retrievable
    // byte-for-byte after the rejected removal.
    const after = await request(app)
      .get('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair);
    expect(after.status).toBe(200);
    expect(after.headers['content-type']).toBe(SEED_MIME);
    expect(Buffer.from(after.body).equals(SEED_PNG)).toBe(true);
  });
});
