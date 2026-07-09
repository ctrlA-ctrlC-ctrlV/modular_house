/**
 * T121 — E-IDLE: idle-timeout and absolute-cap edge tests.
 *
 * Uses the injected clock to assert server-side E7 boundary behaviour:
 *
 *   E7a — A refresh after >30m of inactivity is rejected with 401
 *          ("Session idle timeout") even though the token is within its
 *          7-day absolute validity window.  Verified via RefreshToken.lastUsedAt.
 *
 *   E7b — A refresh after the 7-day absolute expiry is rejected with 401
 *          ("Refresh token expired"), enforcing the hard upper bound
 *          regardless of recent activity.
 *
 * Drives AuthService.refresh() directly with a fake clock rather than
 * going through the HTTP route (which uses a live wall-clock AuthService).
 * The token is issued via the real verify-2fa route so the DB row reflects
 * production conditions; only the time of the consumption check is faked.
 *
 * Complements T044 (auth-refresh.test.ts) which covers the same E7 path via
 * HTTP with direct DB timestamp rewind.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import * as argon2 from 'argon2';
import app from '../../src/app.js';
import { prisma, resetAdminTables, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';
import { AuthService } from '../../src/services/auth.js';
import { IDLE_TIMEOUT_MS, REFRESH_TOKEN_TTL_MS } from '../../src/config/adminAuth.js';

describe('E-IDLE — idle-timeout and absolute-cap edge cases (E7)', () => {
  const password = 'ValidPass123!';
  let userId: string;
  let email: string;

  beforeAll(async () => {
    const role = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('admin role not found — seed required');
    }

    email = `edge-idle-${Date.now()}@example.com`;
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

  beforeEach(async () => {
    await resetAdminTables(userId);
    await prisma.refreshToken.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await disconnectDb();
  });

  /**
   * Issue a real session via the HTTP route and return the raw refresh token.
   * Uses real wall-clock time so the route's default AuthService accepts the
   * OTP code.
   */
  async function issueRawToken(): Promise<string> {
    const clock = createClock(new Date());
    const loginCodeService = new LoginCodeService(prisma, clock.now);
    const { challengeId, code } = await loginCodeService.issue(userId);

    const res = await request(app)
      .post('/admin/auth/verify-2fa')
      .send({ challengeId, code });

    if (res.status !== 200) {
      throw new Error(`verify-2fa failed: ${res.status} ${JSON.stringify(res.body)}`);
    }

    const setCookie = res.headers['set-cookie'];
    const cookieStr: string = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    return cookieStr.split(';')[0].trim().slice('refreshToken='.length);
  }

  // ── E7a — idle timeout ──────────────────────────────────────────────────────

  it(
    'rejects a refresh after more than 30m of inactivity even though ' +
      'the token is within its 7-day absolute validity window (E7)',
    async () => {
      const rawToken = await issueRawToken();

      // Advance the clock past the 30-minute idle threshold.  The token's
      // expiresAt is 7 days from issuance; advancing only 30m + 1ms means
      // the absolute-expiry check does NOT fire — only the idle check does.
      const idleClock = createClock(new Date(Date.now() + IDLE_TIMEOUT_MS + 1));
      const authService = new AuthService(prisma, idleClock.now);

      const result = await authService.refresh(rawToken);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(401);
        expect(result.message).toBe('Session idle timeout');
      }
    },
  );

  // ── E7b — absolute 7-day cap ────────────────────────────────────────────────

  it(
    'rejects a refresh after the 7-day absolute expiry regardless of ' +
      'recent session activity (E7 absolute cap)',
    async () => {
      const rawToken = await issueRawToken();

      // Advance the clock past the 7-day absolute expiry.  The absolute-expiry
      // check fires before the idle check, so the rejection message is
      // 'Refresh token expired', not 'Session idle timeout'.
      const expiredClock = createClock(new Date(Date.now() + REFRESH_TOKEN_TTL_MS + 1));
      const authService = new AuthService(prisma, expiredClock.now);

      const result = await authService.refresh(rawToken);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(401);
        expect(result.message).toBe('Refresh token expired');
      }
    },
  );
});
