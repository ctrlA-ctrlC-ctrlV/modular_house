/**
 * T065 — auth-gate integration test for both admin analytics endpoints
 * (T-B7, DoD-3).
 *
 * Neither `GET /api/admin/analytics/overview` nor
 * `GET /api/admin/analytics/realtime` is mounted in `app.ts` yet (T068,
 * later Pass 2 work — T066/T067 build the route handlers but T068 alone
 * wires them into the running app with correlation-id logging). Every
 * request below therefore 404s regardless of its Authorization header, so
 * this suite is red for "the missing endpoints", not for a setup/compile
 * error — matching the established red-state convention of
 * analytics-overview.test.ts (T060/T061/T063/T064) and
 * analytics-realtime.test.ts (T062).
 *
 * Once T066-T068 land, this suite exercises every reachable branch of the
 * shared Phase 1 `authenticateJWT` gate against these two specific routes:
 *   - no `Authorization` header at all -> 401 ("Authentication required").
 *   - a syntactically invalid bearer token -> 401 ("Invalid or expired
 *     token"). `AuthService.verifyToken` (src/services/auth.ts) returns
 *     `null` for both a malformed token and a genuinely expired one (both
 *     paths funnel through the same catch block), so a malformed string
 *     alone exercises this branch without needing to mint and wait out a
 *     real expiry — mirroring the existing coverage pattern in
 *     `admin.auth.spec.ts` / `unit/middleware/auth.spec.ts` for this same
 *     shared middleware.
 *   - a genuine session for a fresh `admin`-role user (not `super_admin`),
 *     minted via the real login-code + verify-2fa flow -> 200, proving any
 *     admin role suffices (FR-017) — mirroring `createAuthenticatedSession`
 *     from analytics-overview.test.ts (duplicated here rather than shared;
 *     see that file's docstring for the rationale).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma, disconnectDb } from '../helpers/db.js';
import { createClock } from '../helpers/clock.js';
import { LoginCodeService } from '../../src/services/loginCode.js';

/**
 * Complete login + verify-2fa for a fresh `admin`-role test user and return
 * the bearer access token. Contract: "Authenticated (any admin role, Phase
 * 2 - FR-017)" — `admin`, not `super_admin`, exercises that any admin role
 * suffices.
 */
async function createAuthenticatedSession(): Promise<string> {
  const role = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (!role) {
    throw new Error('admin role not found — seed required');
  }

  const email = `analytics-auth-${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: 'unused-password-auth-bypassed-via-otp',
      roleId: role.id,
      isActive: true,
      failedLoginAttempts: 0,
    },
  });

  const clock = createClock(new Date());
  const loginCodeService = new LoginCodeService(prisma, clock.now);
  const { challengeId, code } = await loginCodeService.issue(user.id);

  const res = await request(app).post('/admin/auth/verify-2fa').send({ challengeId, code });
  if (res.status !== 200) {
    throw new Error(`verify-2fa failed: ${res.status}`);
  }
  return res.body.accessToken as string;
}

describe('Admin analytics auth gate (T-B7)', () => {
  let accessToken: string;

  beforeAll(async () => {
    accessToken = await createAuthenticatedSession();
  });

  afterAll(async () => {
    await disconnectDb();
  });

  // Both admin analytics routes share the identical authenticateJWT gate
  // (plan §5.1: "reuse authenticate"), so the same three-outcome assertions
  // apply to each — table-driven to avoid duplicating the suite per route.
  const targets: ReadonlyArray<{ name: string; path: string }> = [
    { name: 'overview', path: '/api/admin/analytics/overview?from=2026-07-15&to=2026-07-15' },
    { name: 'realtime', path: '/api/admin/analytics/realtime' },
  ];

  for (const target of targets) {
    describe(`GET /api/admin/analytics/${target.name}`, () => {
      it('responds 401 with no Authorization header', async () => {
        const res = await request(app).get(target.path);
        expect(res.status).toBe(401);
      });

      it('responds 401 with a malformed/invalid bearer token', async () => {
        const res = await request(app)
          .get(target.path)
          .set('Authorization', 'Bearer invalid-token-string');
        expect(res.status).toBe(401);
      });

      it('responds 200 with a valid admin session (any role)', async () => {
        const res = await request(app)
          .get(target.path)
          .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
      });
    });
  }
});
