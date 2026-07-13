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
 *   E7c — The idle timer resets on every successful rotation: a token
 *          refreshed within the 30m window is accepted at T+40m even though
 *          initial issuance was at T+0 (i.e. delta from issuance = 40m > 30m,
 *          but delta from last rotation = 20m < 30m).
 *
 *   E7d — The 7-day absolute cap is preserved across rotation (T122-nit):
 *          a session that rotates within the idle window still hits the
 *          7d absolute cap measured from INITIAL issuance, not a reset
 *          cap from the last rotation.  Without the fix, expiresAt is
 *          reset to now+7d on every rotation, so a continuously-active
 *          session never hits the absolute cap.
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

  // ── E7c — idle timer resets on each successful rotation ─────────────────────

  it(
    'idle timer resets on every successful rotation: a token refreshed ' +
      'within the 30m window remains valid even when >30m has elapsed ' +
      'since initial issuance (E7 multi-rotation)',
    async () => {
      const rawTokenA = await issueRawToken();
      const issuedAt = Date.now();

      // Rotate A → B at T+20m (within the 30m idle window).
      // createRefreshToken sets B.lastUsedAt = T+20m.
      const t20 = new Date(issuedAt + 20 * 60 * 1000);
      const rotateResult = await new AuthService(prisma, () => t20).refresh(rawTokenA);
      if (!rotateResult.success) {
        throw new Error(`Unexpected rotation failure: ${JSON.stringify(rotateResult)}`);
      }
      const rawTokenB = rotateResult.rawRefreshToken;

      // Use B at T+40m — 40m from initial issuance but only 20m from B's
      // lastUsedAt (T+20m).  Idle check: 20m < 30m → must succeed.
      // If the idle timer did NOT reset on rotation, 40m > 30m would fire.
      const t40 = new Date(issuedAt + 40 * 60 * 1000);
      const useResult = await new AuthService(prisma, () => t40).refresh(rawTokenB);

      expect(useResult.success).toBe(true);
      if (useResult.success) {
        expect(useResult).toHaveProperty('accessToken');
      }
    },
  );

  // ── E7d — absolute 7d cap preserved across rotation (T122-nit) ──────────────

  it(
    'absolute 7d cap is preserved across rotation: a session that rotates ' +
      'within the idle window still hits the 7d cap from initial issuance, ' +
      'not a reset cap from the last rotation (T122-nit, E7 absolute cap)',
    async () => {
      const rawTokenA = await issueRawToken();
      const issuedAt = Date.now();

      // Rotate A → B at T+20m (within the 30m idle window).
      const t20 = new Date(issuedAt + 20 * 60 * 1000);
      const rotateResult1 = await new AuthService(prisma, () => t20).refresh(rawTokenA);
      if (!rotateResult1.success) {
        throw new Error(`Unexpected rotation A→B failure: ${JSON.stringify(rotateResult1)}`);
      }
      const rawTokenB = rotateResult1.rawRefreshToken;

      // Rotate B → C at T+40m (within the 30m idle window from B's lastUsedAt).
      const t40 = new Date(issuedAt + 40 * 60 * 1000);
      const rotateResult2 = await new AuthService(prisma, () => t40).refresh(rawTokenB);
      if (!rotateResult2.success) {
        throw new Error(`Unexpected rotation B→C failure: ${JSON.stringify(rotateResult2)}`);
      }
      const rawTokenC = rotateResult2.rawRefreshToken;

      // Use C at T+7d+1ms — past the ORIGINAL 7d absolute cap (from initial
      // issuance at T+0), but ~6d23h20m from C's lastUsedAt (T+40m) so the
      // idle timer would also trip if reached.
      //
      // With the fix (expiresAt preserved): C.expiresAt = A.expiresAt ≈ T+7d
      // < T+7d+1ms → absolute check fires first → 'Refresh token expired'.
      //
      // Without the fix (expiresAt reset on rotation): C.expiresAt = T+40m+7d
      // > T+7d+1ms → absolute passes, idle fires → 'Session idle timeout'.
      // Asserting 'Refresh token expired' distinguishes fix from bug.
      const t7d1ms = new Date(issuedAt + REFRESH_TOKEN_TTL_MS + 1);
      const useResult = await new AuthService(prisma, () => t7d1ms).refresh(rawTokenC);

      expect(useResult.success).toBe(false);
      if (!useResult.success) {
        expect(useResult.status).toBe(401);
        expect(useResult.message).toBe('Refresh token expired');
      }
    },
  );
});
