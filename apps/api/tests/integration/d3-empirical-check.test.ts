/**
 * D3 empirical check — new password == current password must be rejected.
 *
 * D3 (plan §2.4): "New password MUST NOT equal the current password
 * (argon2 verify against existing hash → reject if match)."
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';

describe('D3 empirical — new password == current', () => {
  const password = 'ValidPass123!';
  let userId: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) throw new Error('admin role not found');
    const email = `d3-test-${Date.now()}@example.com`;
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

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  it('SHOULD return 400 when newPassword == currentPassword (D3)', async () => {
    await resetAdminTables(userId);
    const clock = createClock(new Date());
    const loginCodeService = new LoginCodeService(prisma, clock.now);
    const { challengeId, code } = await loginCodeService.issue(userId);
    const auth = await request(app).post('/admin/auth/verify-2fa').send({ challengeId, code });
    const accessToken = auth.body.accessToken;
    const cookiePair = (Array.isArray(auth.headers['set-cookie'])
      ? auth.headers['set-cookie'][0]
      : auth.headers['set-cookie']).split(';')[0].trim();

    // Change password to the EXACT same value as the current password.
    const res = await request(app)
      .put('/admin/settings/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookiePair)
      .send({
        currentPassword: password,
        newPassword: password,          // same as current → D3 says reject
        confirmPassword: password,
      });

    // D3 requires this to be 400. If it is 200, D3 is NOT enforced.
    if (res.status === 200) {
      console.log('D3 RESULT: 200 — D3 NOT enforced (password changed to same value)');
    } else {
      console.log(`D3 RESULT: ${res.status} — D3 enforced: ${JSON.stringify(res.body)}`);
    }

    // This assertion documents the expected behavior (D3 enforced).
    // If it fails, D3 is not wired on this path.
    expect(res.status).toBe(400);
  });
});
