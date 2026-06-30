/**
 * T058 — GET /admin/settings/preferences integration tests (T-B7).
 *
 * Asserts the Phase 1 preferences retrieval contract:
 *   - Authenticated → 200 Preferences with server-stored authoritative values (H1/H2)
 *   - No preference row → 200 with defaults (themeMode: 'system', sidebarCollapsed: false)
 *   - Unauthenticated → 401
 *
 * The route does not exist yet; tests fail with 404 until T059 wires it.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';

describe('GET /admin/settings/preferences', () => {
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `settings-prefs-get-${Date.now()}@example.com`;
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

  it('returns 200 with persisted preferences when a row exists (H1/H2)', async () => {
    // Seed a preference row with known values.
    await prisma.userPreference.create({
      data: {
        userId,
        themeMode: 'dark',
        sidebarCollapsed: true,
      },
    });

    const session = await getSession();

    const res = await request(app)
      .get('/admin/settings/preferences')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      themeMode: 'dark',
      sidebarCollapsed: true,
    });
  });

  it('returns 200 with defaults when no preference row exists (H1/H2)', async () => {
    // No preference row seeded — beforeEach clears the table.
    const session = await getSession();

    const res = await request(app)
      .get('/admin/settings/preferences')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Cookie', session.cookiePair);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      themeMode: 'system',
      sidebarCollapsed: false,
    });
  });

  it('returns 401 when no access token is provided', async () => {
    const res = await request(app)
      .get('/admin/settings/preferences');

    expect(res.status).toBe(401);
  });
});
