/**
 * T030 — AuthService core unit tests (A1–A6, B7, C5/C6, E1–E7)
 *
 * Tests use the injected clock for all TTL / expiry / lockout / idle assertions.
 * Every assertion maps to a §2 pinned constant in plan.md.
 *
 * These tests FAIL before T031 because the new verifyCredentials / verifyOtp /
 * refresh / logout / revokeAllSessions / changePassword methods do not yet exist
 * on AuthService.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { createClock } from '../helpers/clock.js';
import { config } from '../../src/config/env.js';
import {
  LOCKOUT_THRESHOLD,
  LOCKOUT_DURATION_MS,
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  IDLE_TIMEOUT_MS,
} from '../../src/config/adminAuth.js';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockUser = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
}));

const mockRefreshToken = vi.hoisted(() => ({
  create: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = mockUser;
    refreshToken = mockRefreshToken;
  },
}));

const mockArgon2 = vi.hoisted(() => ({
  hash: vi.fn(),
  verify: vi.fn(),
}));
vi.mock('argon2', () => mockArgon2);

const mockLoginCodeIssue = vi.hoisted(() => vi.fn());
const mockLoginCodeVerify = vi.hoisted(() => vi.fn());

vi.mock('../../src/services/loginCode.js', () => ({
  LoginCodeService: class {
    issue = mockLoginCodeIssue;
    verify = mockLoginCodeVerify;
  },
}));

const mockMailerSend = vi.hoisted(() => vi.fn());
vi.mock('../../src/services/mailer.js', () => ({
  MailerService: class {
    sendEmail = mockMailerSend;
  },
}));

// ---------------------------------------------------------------------------
// Module under test (imported after mocks)
// ---------------------------------------------------------------------------

import { PrismaClient } from '@prisma/client';
import { AuthService } from '../../src/services/auth.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Build a synthetic active User row with role + permissions. */
function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'admin@example.com',
    passwordHash: '$argon2id$test-hash',
    roleId: 'role-1',
    isActive: true,
    failedLoginAttempts: 0,
    lockedUntil: null as Date | null,
    role: {
      id: 'role-1',
      name: 'admin',
      permissions: [
        { permission: { resource: 'pages', action: 'view' } },
        { permission: { resource: 'submissions', action: 'view' } },
      ],
    },
    ...overrides,
  };
}

/** Build a synthetic active RefreshToken row for a given clock snapshot. */
function makeRefreshToken(
  clock: ReturnType<typeof createClock>,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'rt-1',
    userId: 'user-1',
    tokenHash: 'stored-hash-of-raw-token',
    family: 'family-1',
    expiresAt: new Date(clock.now().getTime() + REFRESH_TOKEN_TTL_MS),
    revokedAt: null as Date | null,
    lastUsedAt: new Date(clock.now()),
    createdAt: new Date(clock.now()),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthService — Phase 1 rewrite (A1–A6, B7, C5/C6, E1–E7)', () => {
  let clock: ReturnType<typeof createClock>;
  let prisma: PrismaClient;
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    clock = createClock();
    prisma = new PrismaClient();

    // AuthService accepts injected prisma + clock
    service = new AuthService(prisma, clock.now);

    // Default mock return values (happy path)
    mockUser.findUnique.mockResolvedValue(makeUser());
    mockUser.update.mockResolvedValue({});
    mockRefreshToken.create.mockResolvedValue({ id: 'rt-new', tokenHash: 'new-hash', family: 'family-1' });
    mockRefreshToken.update.mockResolvedValue({});
    mockRefreshToken.updateMany.mockResolvedValue({ count: 1 });
    mockArgon2.verify.mockResolvedValue(true);
    mockArgon2.hash.mockResolvedValue('$argon2id$new-hash');
    mockLoginCodeIssue.mockResolvedValue({ code: '123456', challengeId: 'challenge-abc' });
    mockLoginCodeVerify.mockResolvedValue({ success: true, userId: 'user-1' });
    mockMailerSend.mockResolvedValue({ success: true, attempt: 1, timestamp: clock.now() });
  });

  // =========================================================================
  // A1–A6: verifyCredentials
  // =========================================================================

  describe('verifyCredentials (A1–A6)', () => {
    // -----------------------------------------------------------------------
    // A5: Unknown email → generic 401 (identical to wrong-password shape)
    // -----------------------------------------------------------------------

    it('returns generic 401 for an unknown email (A5)', async () => {
      mockUser.findUnique.mockResolvedValue(null);

      const result = await service.verifyCredentials('noone@example.com', 'AnyPassword1!');

      expect(result).toMatchObject({ success: false, status: 401, message: 'Invalid credentials' });
      // userId is null on unknown email so audit attribution is skipped (I2).
      expect(result.userId).toBeNull();
    });

    // -----------------------------------------------------------------------
    // A5: Wrong password → byte-identical 401 response
    // -----------------------------------------------------------------------

    it('returns generic 401 for a wrong password — identical to unknown-email response (A5)', async () => {
      mockUser.findUnique.mockResolvedValue(makeUser());
      mockArgon2.verify.mockResolvedValue(false); // wrong password

      const result = await service.verifyCredentials('admin@example.com', 'WrongPassword1!');

      expect(result).toMatchObject({ success: false, status: 401, message: 'Invalid credentials' });
      // userId is the known account's id so LOGIN_FAILURE can be attributed (I2).
      expect(result.userId).toBe('user-1');
    });

    // -----------------------------------------------------------------------
    // A6: Inactive account → same generic 401 (even with correct password)
    // -----------------------------------------------------------------------

    it('returns generic 401 for an inactive account (A6)', async () => {
      const user = makeUser({ isActive: false });
      mockUser.findUnique.mockResolvedValue(user);
      mockArgon2.verify.mockResolvedValue(true); // correct password

      const result = await service.verifyCredentials('admin@example.com', 'CorrectPassword1!');

      expect(result).toMatchObject({ success: false, status: 401, message: 'Invalid credentials' });
      // T105 nit: argon2.verify MUST run for deactivated accounts so timing
      // does not leak account-active status (post-credential check).
      expect(mockArgon2.verify).toHaveBeenCalledWith(user.passwordHash, 'CorrectPassword1!');
    });

    // -----------------------------------------------------------------------
    // A3: Locked account → 423 while lockedUntil > now
    // -----------------------------------------------------------------------

    it('returns 423 while the account is locked (A3)', async () => {
      const lockedUntil = new Date(clock.now().getTime() + LOCKOUT_DURATION_MS);
      mockUser.findUnique.mockResolvedValue(
        makeUser({ lockedUntil, failedLoginAttempts: LOCKOUT_THRESHOLD }),
      );

      const result = await service.verifyCredentials('admin@example.com', 'AnyPassword1!');

      expect(result).toMatchObject({ success: false, status: 423 });
    });

    // -----------------------------------------------------------------------
    // A3: Lockout expires after LOCKOUT_DURATION_MS → 401 (not 423)
    // -----------------------------------------------------------------------

    it('allows login attempt after lockout duration expires (A3)', async () => {
      const lockedUntil = new Date(clock.now().getTime() + LOCKOUT_DURATION_MS);
      mockUser.findUnique.mockResolvedValue(
        makeUser({ lockedUntil, failedLoginAttempts: LOCKOUT_THRESHOLD }),
      );

      // Advance clock past the lockout period
      clock.advance(LOCKOUT_DURATION_MS + 1);

      mockArgon2.verify.mockResolvedValue(false); // still wrong password → 401, not 423
      const result = await service.verifyCredentials('admin@example.com', 'Wrong1!');

      // 401 (wrong pw) not 423 (lockout) — lockout has expired
      expect(result).toMatchObject({ success: false, status: 401 });
    });

    // -----------------------------------------------------------------------
    // A2: 5th consecutive failure sets lockedUntil = now + LOCKOUT_DURATION_MS
    // -----------------------------------------------------------------------

    it('sets lockedUntil on the LOCKOUT_THRESHOLD-th consecutive failure (A2/A3)', async () => {
      // User has already had LOCKOUT_THRESHOLD - 1 failures
      mockUser.findUnique.mockResolvedValue(
        makeUser({ failedLoginAttempts: LOCKOUT_THRESHOLD - 1 }),
      );
      mockArgon2.verify.mockResolvedValue(false); // Nth failure

      await service.verifyCredentials('admin@example.com', 'Wrong1!');

      const expectedLockoutTime = new Date(clock.now().getTime() + LOCKOUT_DURATION_MS);
      expect(mockUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lockedUntil: expectedLockoutTime }),
        }),
      );
    });

    // -----------------------------------------------------------------------
    // A4: Successful login resets failedLoginAttempts + lockedUntil
    // -----------------------------------------------------------------------

    it('resets failedLoginAttempts and lockedUntil on successful credential check (A4)', async () => {
      mockUser.findUnique.mockResolvedValue(
        makeUser({ failedLoginAttempts: 3, lockedUntil: null }),
      );
      mockArgon2.verify.mockResolvedValue(true);

      await service.verifyCredentials('admin@example.com', 'CorrectPassword1!');

      expect(mockUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedLoginAttempts: 0, lockedUntil: null }),
        }),
      );
    });

    // -----------------------------------------------------------------------
    // A1: Uses argon2.verify (A1 = argon2id algorithm)
    // -----------------------------------------------------------------------

    it('verifies the password using argon2.verify (A1)', async () => {
      const user = makeUser();
      mockUser.findUnique.mockResolvedValue(user);
      mockArgon2.verify.mockResolvedValue(true);

      await service.verifyCredentials('admin@example.com', 'CorrectPassword1!');

      expect(mockArgon2.verify).toHaveBeenCalledWith(user.passwordHash, 'CorrectPassword1!');
    });

    // -----------------------------------------------------------------------
    // B7: Success returns challengeId — NOT an access token
    // -----------------------------------------------------------------------

    it('returns challengeId on success — does not return an access token (B7)', async () => {
      mockUser.findUnique.mockResolvedValue(makeUser());
      mockArgon2.verify.mockResolvedValue(true);

      const result = await service.verifyCredentials('admin@example.com', 'CorrectPassword1!');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.challengeId).toBeTruthy();
        expect(result).not.toHaveProperty('accessToken');
        // userId is the authenticated account's id for LOGIN_SUCCESS / OTP_ISSUED audit.
        expect(result.userId).toBe('user-1');
      }
    });

    // -----------------------------------------------------------------------
    // B7: OTP is issued on successful credential check
    // -----------------------------------------------------------------------

    it('issues an OTP via LoginCodeService on successful credential check (B7)', async () => {
      mockUser.findUnique.mockResolvedValue(makeUser());
      mockArgon2.verify.mockResolvedValue(true);

      await service.verifyCredentials('admin@example.com', 'CorrectPassword1!');

      expect(mockLoginCodeIssue).toHaveBeenCalledWith('user-1');
    });
  });

  // =========================================================================
  // B7 + E1: verifyOtp — access token minted only after OTP verify
  // =========================================================================

  describe('verifyOtp (B7, E1)', () => {
    beforeEach(() => {
      // loginCodeService.verify returns the userId on success
      mockLoginCodeVerify.mockResolvedValue({ success: true, userId: 'user-1' });
      // Load user for token minting
      mockUser.findUnique.mockResolvedValue(makeUser());
    });

    // -----------------------------------------------------------------------
    // B7: Access token is returned only after successful OTP verify
    // -----------------------------------------------------------------------

    it('returns accessToken and rawRefreshToken after successful OTP verify (B7)', async () => {
      const result = await service.verifyOtp('challenge-abc', '123456');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.accessToken).toBe('string');
        expect(typeof result.rawRefreshToken).toBe('string');
      }
    });

    // -----------------------------------------------------------------------
    // E1: JWT carries userId, email, role, and effective permissions
    // -----------------------------------------------------------------------

    it('access token carries userId, email, role, and permissions (E1)', async () => {
      const result = await service.verifyOtp('challenge-abc', '123456');

      expect(result.success).toBe(true);
      if (result.success) {
        const decoded = jwt.decode(result.accessToken) as Record<string, unknown>;
        expect(decoded.userId).toBe('user-1');
        expect(decoded.email).toBe('admin@example.com');
        expect(decoded.role).toBe('admin');
        expect(Array.isArray(decoded.permissions)).toBe(true);
        expect(decoded.permissions).toContain('pages:view');
        expect(decoded.permissions).toContain('submissions:view');
      }
    });

    // -----------------------------------------------------------------------
    // E1: Access token lifetime is ACCESS_TOKEN_TTL_MS (15 minutes)
    // -----------------------------------------------------------------------

    it('access token expires in 15 minutes (E1)', async () => {
      const result = await service.verifyOtp('challenge-abc', '123456');

      expect(result.success).toBe(true);
      if (result.success) {
        const decoded = jwt.decode(result.accessToken) as Record<string, unknown>;
        const iat = decoded.iat as number;
        const exp = decoded.exp as number;
        const lifetimeMs = (exp - iat) * 1000;
        expect(lifetimeMs).toBe(ACCESS_TOKEN_TTL_MS);
      }
    });

    // -----------------------------------------------------------------------
    // OTP failure → no access token
    // -----------------------------------------------------------------------

    it('returns failure when OTP verify fails — no access token issued', async () => {
      mockLoginCodeVerify.mockResolvedValue({ success: false, reason: 'INVALID_CODE' });

      const result = await service.verifyOtp('challenge-abc', '000000');

      expect(result.success).toBe(false);
      expect(result).not.toHaveProperty('accessToken');
    });

    it('returns failure when OTP is valid but user has been deleted (race condition)', async () => {
      mockLoginCodeVerify.mockResolvedValue({ success: true, userId: 'user-1' });
      mockUser.findUnique.mockResolvedValue(null);

      const result = await service.verifyOtp('challenge-abc', '123456');

      expect(result.success).toBe(false);
      expect(result).not.toHaveProperty('accessToken');
    });

    // -----------------------------------------------------------------------
    // A6: Deactivated account cannot complete sign-in even with a valid code
    // -----------------------------------------------------------------------

    it('returns failure when the account is deactivated even with a valid code (A6)', async () => {
      mockUser.findUnique.mockResolvedValue(makeUser({ isActive: false }));

      const result = await service.verifyOtp('challenge-abc', '123456');

      expect(result.success).toBe(false);
      expect(result).toMatchObject({ status: 401, message: 'Invalid credentials' });
      expect(result).not.toHaveProperty('accessToken');
      expect(result).not.toHaveProperty('rawRefreshToken');
    });
  });

  // =========================================================================
  // E4 / E7: refresh — rotation and idle timeout
  // =========================================================================

  describe('refresh (E4, E7)', () => {
    // -----------------------------------------------------------------------
    // E4: Successful refresh rotates the token (same family, new token)
    // -----------------------------------------------------------------------

    it('rotates the refresh token and returns new access + refresh tokens (E4)', async () => {
      const existingToken = makeRefreshToken(clock);
      mockRefreshToken.findFirst.mockResolvedValue(existingToken);
      mockUser.findUnique.mockResolvedValue(makeUser());

      const result = await service.refresh('raw-refresh-token');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.accessToken).toBe('string');
        expect(typeof result.rawRefreshToken).toBe('string');
        // new token must be different from the raw input
        expect(result.rawRefreshToken).not.toBe('raw-refresh-token');
      }

      // Old token must have been revoked
      expect(mockRefreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'rt-1' }),
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );

      // New token must be created in the same family
      expect(mockRefreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ family: 'family-1', userId: 'user-1' }),
        }),
      );
    });

    // -----------------------------------------------------------------------
    // E4: Reuse of a revoked token revokes the entire family (theft detection)
    // -----------------------------------------------------------------------

    it('revokes the entire family when a revoked token is reused (E4)', async () => {
      const revokedToken = makeRefreshToken(clock, {
        revokedAt: new Date(clock.now().getTime() - 60_000),
      });
      mockRefreshToken.findFirst.mockResolvedValue(revokedToken);

      const result = await service.refresh('raw-revoked-token');

      expect(result.success).toBe(false);

      // Family-wide revocation
      expect(mockRefreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ family: 'family-1' }),
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });

    // -----------------------------------------------------------------------
    // E7: Idle timeout — refresh rejected when now - lastUsedAt > IDLE_TIMEOUT_MS
    // -----------------------------------------------------------------------

    it('rejects refresh when idle for longer than IDLE_TIMEOUT_MS (E7)', async () => {
      const tokenIssuedAt = clock.now();
      const tokenWithOldActivity = makeRefreshToken(clock, {
        lastUsedAt: tokenIssuedAt,
      });
      mockRefreshToken.findFirst.mockResolvedValue(tokenWithOldActivity);

      // Advance clock past the idle timeout
      clock.advance(IDLE_TIMEOUT_MS + 1);

      const result = await service.refresh('raw-refresh-token');

      expect(result.success).toBe(false);
      // No new token should have been created
      expect(mockRefreshToken.create).not.toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // E7: Refresh still works just before idle timeout expires
    // -----------------------------------------------------------------------

    it('allows refresh when last activity is within IDLE_TIMEOUT_MS (E7)', async () => {
      const tokenWithRecentActivity = makeRefreshToken(clock);
      mockRefreshToken.findFirst.mockResolvedValue(tokenWithRecentActivity);
      mockUser.findUnique.mockResolvedValue(makeUser());

      // Advance to just before the idle timeout
      clock.advance(IDLE_TIMEOUT_MS - 1);

      const result = await service.refresh('raw-refresh-token');

      expect(result.success).toBe(true);
    });

    // -----------------------------------------------------------------------
    // E7: lastUsedAt is updated on every successful refresh
    // -----------------------------------------------------------------------

    it('updates lastUsedAt on every successful refresh (E7)', async () => {
      const existingToken = makeRefreshToken(clock);
      mockRefreshToken.findFirst.mockResolvedValue(existingToken);
      mockUser.findUnique.mockResolvedValue(makeUser());

      await service.refresh('raw-refresh-token');

      // The create call for the new token should include the current clock time as lastUsedAt
      const createCall = mockRefreshToken.create.mock.calls[0];
      expect(createCall).toBeDefined();
      const data = (createCall[0] as { data: Record<string, unknown> }).data;
      // lastUsedAt should be set (not null)
      expect(data.lastUsedAt).toBeInstanceOf(Date);
    });

    // -----------------------------------------------------------------------
    // Unknown token → rejected
    // -----------------------------------------------------------------------

    it('rejects refresh when the token is not found', async () => {
      mockRefreshToken.findFirst.mockResolvedValue(null);

      const result = await service.refresh('unknown-token');

      expect(result.success).toBe(false);
    });

    // -----------------------------------------------------------------------
    // Expired token (absolute) → rejected
    // -----------------------------------------------------------------------

    it('rejects an absolutely expired refresh token', async () => {
      const expiredToken = makeRefreshToken(clock, {
        expiresAt: new Date(clock.now().getTime() - 1000),
      });
      mockRefreshToken.findFirst.mockResolvedValue(expiredToken);

      const result = await service.refresh('raw-expired-token');

      expect(result.success).toBe(false);
      expect(mockRefreshToken.create).not.toHaveBeenCalled();
    });

    it('returns failure when refresh token is valid but user has been deleted (race condition)', async () => {
      const existingToken = makeRefreshToken(clock);
      mockRefreshToken.findFirst.mockResolvedValue(existingToken);
      mockRefreshToken.update.mockResolvedValue({});
      mockUser.findUnique.mockResolvedValue(null);

      const result = await service.refresh('raw-refresh-token');

      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // E5: logout — revokes current session's family only
  // =========================================================================

  describe('logout (E5)', () => {
    it('revokes only the current session\'s refresh-token family (E5)', async () => {
      const existingToken = makeRefreshToken(clock);
      mockRefreshToken.findFirst.mockResolvedValue(existingToken);

      await service.logout('raw-refresh-token');

      expect(mockRefreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ family: 'family-1' }),
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });

    it('succeeds silently when the token is not found (logout is idempotent)', async () => {
      mockRefreshToken.findFirst.mockResolvedValue(null);

      await expect(service.logout('unknown-token')).resolves.not.toThrow();
    });
  });

  // =========================================================================
  // C6 / E6: revokeAllSessions — account-wide revocation
  // =========================================================================

  describe('revokeAllSessions (C6, E6)', () => {
    it('revokes all refresh tokens for a user (C6/E6)', async () => {
      await service.revokeAllSessions('user-1');

      expect(mockRefreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });
  });

  // =========================================================================
  // E6: changePassword — revokes all families, re-mints acting family
  // =========================================================================

  describe('changePassword (E6)', () => {
    it('revokes ALL session families and re-mints the acting family (E6)', async () => {
      mockUser.findUnique.mockResolvedValue(makeUser());
      // First verify: D5 (current password correct) → true.
      // Second verify: D3 (new != current) → false (they differ).
      mockArgon2.verify.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      mockArgon2.hash.mockResolvedValue('$argon2id$new-hash');

      const actingFamily = 'family-1';
      const result = await service.changePassword(
        'user-1',
        'CurrentPassword1!',
        'NewPassword1!',
        actingFamily,
      );

      // All sessions revoked
      expect(mockRefreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );

      // Acting family re-minted (new token created)
      expect(mockRefreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ family: actingFamily, userId: 'user-1' }),
        }),
      );

      // New access + refresh tokens returned
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.accessToken).toBe('string');
        expect(typeof result.rawRefreshToken).toBe('string');
      }
    });

    it('rejects changePassword when the current password is wrong', async () => {
      mockUser.findUnique.mockResolvedValue(makeUser());
      mockArgon2.verify.mockResolvedValue(false); // wrong current password

      const result = await service.changePassword(
        'user-1',
        'WrongCurrent1!',
        'NewPassword1!',
        'family-1',
      );

      expect(result.success).toBe(false);
      // No sessions revoked, no new token
      expect(mockRefreshToken.updateMany).not.toHaveBeenCalled();
      expect(mockRefreshToken.create).not.toHaveBeenCalled();
    });

    it('returns 401 failure when the user is not found', async () => {
      mockUser.findUnique.mockResolvedValue(null);

      const result = await service.changePassword(
        'deleted-user-id',
        'OldPass1!',
        'NewPass1!',
        'family-1',
      );

      expect(result).toMatchObject({ success: false, status: 401 });
    });
  });

  // =========================================================================
  // verifyToken — kept for authenticateJWT middleware compatibility
  // =========================================================================

  // =========================================================================
  // Constructor — production JWT_SECRET guard
  // =========================================================================

  describe('constructor — production JWT_SECRET guard', () => {
    it('throws when nodeEnv is production and jwtSecret is the insecure default', () => {
      const origNodeEnv = config.app.nodeEnv;
      const origSecret = config.security.jwtSecret;
      config.app.nodeEnv = 'production';
      config.security.jwtSecret = 'your-jwt-secret-key-change-in-production';
      try {
        expect(() => new AuthService()).toThrow('JWT_SECRET must be set in production');
      } finally {
        config.app.nodeEnv = origNodeEnv;
        config.security.jwtSecret = origSecret;
      }
    });
  });

  describe('verifyToken (backwards compat)', () => {
    it('verifies and decodes a valid JWT (E1)', () => {
      const token = jwt.sign(
        { userId: 'u1', email: 'a@b.com', role: 'admin', permissions: ['pages:view'] },
        config.security.jwtSecret,
        { expiresIn: '15m' },
      );

      const decoded = service.verifyToken(token);

      expect(decoded).not.toBeNull();
      const payload = decoded as NonNullable<typeof decoded>;
      expect(payload.userId).toBe('u1');
      expect(payload.permissions).toEqual(['pages:view']);
    });

    it('returns null for an invalid or expired token', () => {
      expect(service.verifyToken('not.a.valid.jwt')).toBeNull();
    });
  });
});
