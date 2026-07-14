/**
 * T117 — E-PHOTO edge-case integration tests (G1/G2/G4, FR-033).
 *
 * Pins the hardened profile-photo validation + removal behavior beyond the
 * coarser Pass-1 coverage in T052 (`settings-photo-put.test.ts`) and T056
 * (`settings-photo-delete.test.ts`):
 *
 *   - G1 edge: `image/gif` is rejected with 400 AND the user's previously
 *     stored photo is preserved byte-for-byte (G3 "no change" guarantee).
 *     T052 only asserted the 400 status with a clean photo slate — it never
 *     verified that a rejected upload leaves an existing photo untouched.
 *   - G2 edge: a file of exactly `PHOTO_MAX_BYTES + 1` (5 MB + 1 byte) is
 *     rejected with 400 AND the existing photo is preserved (no change).
 *     T052 asserted the 400 but with no existing photo to protect.
 *   - G4 edge: removing the photo returns 200 Me with `hasProfilePhoto=false`
 *     AND a subsequent authenticated GET returns 404 (the trigger that makes
 *     the client render the initials fallback per G6).  T056 only asserted
 *     the DELETE response shape, not the follow-up GET that completes the
 *     fallback cycle.
 *
 * The photo routes have no TTL/expiry/lockout/cooldown/idle logic, so the
 * injected clock is used only for the verify-2fa session helper (mirroring
 * the T052/T056 pattern).  Runs against the Phase 1 test database on port
 * 5434.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';
import { PHOTO_MAX_BYTES } from '../../src/config/adminAuth.js';

describe('E-PHOTO — profile-photo validation + removal edges (G1/G2/G4)', () => {
  let userId: string;
  let email: string;

  /**
   * Minimal valid PNG buffer (1x1 transparent pixel) used to seed the user's
   * profile photo before each edge-case attempt.  Seeding directly via Prisma
   * (not via the upload route) isolates the "no change" assertion from the
   * upload path itself.
   */
  const SEED_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB' +
      'Nl7BcQAAAABJRU5ErkJggg==',
    'base64',
  );
  const SEED_MIME = 'image/png';

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `ephoto-${Date.now()}@example.com`;
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
    // Seed a known photo so the "no change" assertions have a baseline to
    // protect.  Each test that needs a clean slate clears the photo itself.
    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: SEED_PNG, profilePhotoMime: SEED_MIME },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  /**
   * Complete verify-2fa and return the access token + cookie pair.
   * The injected clock is used for OTP issuance (no TTL assertions here,
   * but the helper mirrors the T052/T056 pattern for consistency).
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

  // -------------------------------------------------------------------------
  // G1 — image/gif rejected with 400 AND existing photo preserved (no change)
  // -------------------------------------------------------------------------

  it('rejects image/gif with 400 and preserves the existing photo (G1/G3)', async () => {
    const session = await getSession();

    // Confirm the seeded photo is retrievable before the bad upload.
    const before = await request(app)
      .get('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair);
    expect(before.status).toBe(200);
    expect(Buffer.isBuffer(before.body)).toBe(true);

    // Attempt to upload a GIF — G1 says only png/jpeg/webp are accepted.
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

    // G3 "no change" guarantee: the original PNG must still be retrievable
    // byte-for-byte after the rejected upload.
    const after = await request(app)
      .get('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair);
    expect(after.status).toBe(200);
    expect(after.headers['content-type']).toBe(SEED_MIME);
    expect(Buffer.from(after.body).equals(SEED_PNG)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // G2 — 5 MB + 1 byte rejected with 400 AND existing photo preserved
  // -------------------------------------------------------------------------

  it('rejects a 5MB+1byte file with 400 and preserves the existing photo (G2/G3)', async () => {
    const session = await getSession();

    // A buffer exactly one byte over the 5 MB cap.  Multer's 6 MB limit lets
    // this through so the route's own size check is the gate (G2).
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

    // G3 "no change" guarantee: the original PNG survives the rejected upload.
    const after = await request(app)
      .get('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair);
    expect(after.status).toBe(200);
    expect(after.headers['content-type']).toBe(SEED_MIME);
    expect(Buffer.from(after.body).equals(SEED_PNG)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // G4 — remove → initials fallback: hasProfilePhoto=false + GET returns 404
  // -------------------------------------------------------------------------

  it('removes the photo and the subsequent GET returns 404 for the initials fallback (G4/G6)', async () => {
    const session = await getSession();

    // Confirm the seeded photo exists before removal.
    const before = await request(app)
      .get('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair);
    expect(before.status).toBe(200);

    // Remove the photo — G4: removal falls back to the default avatar.
    const delRes = await request(app)
      .delete('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair);

    expect(delRes.status).toBe(200);
    expect(delRes.body).toHaveProperty('hasProfilePhoto', false);
    expect(delRes.body).toHaveProperty('id', userId);

    // G6: after removal, GET returns 404 — this is the signal that makes the
    // client render the initials fallback instead of an <img> tag.  T056 only
    // asserted the DELETE response shape; this completes the fallback cycle.
    const after = await request(app)
      .get('/admin/settings/photo')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair);
    expect(after.status).toBe(404);
  });
});
