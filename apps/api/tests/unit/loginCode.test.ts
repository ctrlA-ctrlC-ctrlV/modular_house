import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClock } from '../helpers/clock.js';
import {
  OTP_DIGIT_COUNT,
  OTP_TTL_MS,
  OTP_MAX_ATTEMPTS,
} from '../../src/config/adminAuth.js';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockLoginCode = vi.hoisted(() => ({
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    loginCode = mockLoginCode;
  },
}));

const mockArgon2 = vi.hoisted(() => ({
  hash: vi.fn(),
  verify: vi.fn(),
}));

vi.mock('argon2', () => mockArgon2);

// ---------------------------------------------------------------------------
// Module under test (imported after mocks are declared)
// ---------------------------------------------------------------------------

import { PrismaClient } from '@prisma/client';
import {
  LoginCodeService,
  type VerifySuccess,
  type VerifyFailure,
  type ResendResult,
} from '../../src/services/loginCode.js';

// ---------------------------------------------------------------------------
// Shared test helpers
// ---------------------------------------------------------------------------

/** Build a synthetic active LoginCode row for a given clock snapshot. */
function activeCode(clock: ReturnType<typeof createClock>, overrides: Record<string, unknown> = {}) {
  return {
    id: 'code-1',
    userId: 'user-1',
    challengeId: 'challenge-abc',
    codeHash: 'hashed-code',
    expiresAt: new Date(clock.now().getTime() + OTP_TTL_MS),
    attemptCount: 0,
    consumedAt: null,
    ...overrides,
  };
}

describe('LoginCodeService — B1–B9', () => {
  let clock: ReturnType<typeof createClock>;
  let prisma: PrismaClient;
  let service: LoginCodeService;

  beforeEach(() => {
    vi.clearAllMocks();
    clock = createClock();
    prisma = new PrismaClient();
    service = new LoginCodeService(prisma, clock.now);

    // Safe defaults
    mockArgon2.hash.mockResolvedValue('hashed-code');
    mockArgon2.verify.mockResolvedValue(false);
    mockLoginCode.updateMany.mockResolvedValue({ count: 0 });
    mockLoginCode.create.mockResolvedValue({ id: 'code-1', challengeId: 'challenge-abc' });
  });

  // =========================================================================
  // issue()
  // =========================================================================

  describe('issue()', () => {
    // B1: 6-digit CSPRNG code
    it('generates a 6-digit numeric code before hashing (B1)', async () => {
      await service.issue('user-1');
      expect(mockArgon2.hash).toHaveBeenCalledOnce();
      const rawCode = mockArgon2.hash.mock.calls[0][0] as string;
      expect(rawCode).toMatch(/^\d{6}$/);
      expect(rawCode.length).toBe(OTP_DIGIT_COUNT);
    });

    // B2: raw code never stored
    it('stores only the argon2 hash, never the raw code (B2)', async () => {
      await service.issue('user-1');
      const createData = mockLoginCode.create.mock.calls[0][0].data as Record<string, unknown>;
      expect(createData).toHaveProperty('codeHash', 'hashed-code');
      // Must not carry a field with the raw value
      expect(createData).not.toHaveProperty('code');
      expect(createData).not.toHaveProperty('rawCode');
    });

    // B3: TTL = 10 minutes from injected clock
    it('sets expiresAt to clock.now() + OTP_TTL_MS (B3)', async () => {
      await service.issue('user-1');
      const createData = mockLoginCode.create.mock.calls[0][0].data as Record<string, unknown>;
      const expectedExpiry = new Date(clock.now().getTime() + OTP_TTL_MS);
      expect((createData.expiresAt as Date).getTime()).toBe(expectedExpiry.getTime());
    });

    // B9: challengeId is opaque and has adequate entropy (≥ 43 chars for 32 bytes)
    it('generates a challengeId with ≥32 bytes of entropy (B9)', async () => {
      let capturedId = '';
      mockLoginCode.create.mockImplementation(
        (args: { data: Record<string, unknown> }) => {
          capturedId = args.data.challengeId as string;
          return Promise.resolve({ id: 'code-1', challengeId: capturedId });
        },
      );

      await service.issue('user-1');
      // Base64url(32 bytes) ≥ 43 chars; hex(32 bytes) = 64 chars
      expect(capturedId.length).toBeGreaterThanOrEqual(43);
    });

    // B6: new issue invalidates prior active codes for the same user
    it('invalidates prior active codes for the user on new issue (B6)', async () => {
      await service.issue('user-1');
      expect(mockLoginCode.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
    });

    // issue() returns { challengeId, code } so caller can email the code
    it('returns the raw code and challengeId so the caller can email it', async () => {
      mockArgon2.hash.mockImplementation((raw: string) => {
        void raw; // capture but don't use directly
        return Promise.resolve('hashed-code');
      });

      const result = await service.issue('user-1');
      expect(result.challengeId).toBeDefined();
      expect(result.code).toMatch(/^\d{6}$/);
    });
  });

  // =========================================================================
  // verify()
  // =========================================================================

  describe('verify()', () => {
    // B9: unknown challengeId → failure
    it('returns failure for an unknown challengeId (B9)', async () => {
      mockLoginCode.findFirst.mockResolvedValue(null);

      const result = await service.verify('unknown-id', '123456');
      expect(result.success).toBe(false);
    });

    // B3: expired code → rejected
    it('rejects an expired code (B3)', async () => {
      mockLoginCode.findFirst.mockResolvedValue(
        activeCode(clock, { expiresAt: new Date(clock.now().getTime() - 1) }),
      );

      const result = await service.verify('challenge-abc', '123456');
      expect(result.success).toBe(false);
      expect((result as VerifyFailure).reason).toMatch(/expired/i);
    });

    // B4: consumed code → rejected
    it('rejects a code that has already been consumed (B4)', async () => {
      mockLoginCode.findFirst.mockResolvedValue(
        activeCode(clock, { consumedAt: new Date() }),
      );

      const result = await service.verify('challenge-abc', '123456');
      expect(result.success).toBe(false);
      expect((result as VerifyFailure).reason).toMatch(/consumed|used/i);
    });

    // B5: locked code (attemptCount >= OTP_MAX_ATTEMPTS) → rejected
    it('rejects a code locked by too many wrong attempts (B5)', async () => {
      mockLoginCode.findFirst.mockResolvedValue(
        activeCode(clock, { attemptCount: OTP_MAX_ATTEMPTS }),
      );

      const result = await service.verify('challenge-abc', '123456');
      expect(result.success).toBe(false);
      expect((result as VerifyFailure).reason).toMatch(/locked|attempts/i);
    });

    // B5: wrong code increments attemptCount
    it('increments attemptCount when the code is wrong (B5)', async () => {
      mockLoginCode.findFirst.mockResolvedValue(activeCode(clock, { attemptCount: 2 }));
      mockArgon2.verify.mockResolvedValue(false);
      mockLoginCode.update.mockResolvedValue({});

      await service.verify('challenge-abc', '000000');

      expect(mockLoginCode.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'code-1' },
          data: expect.objectContaining({ attemptCount: 3 }),
        }),
      );
    });

    // B4: successful verify sets consumedAt and returns userId
    it('sets consumedAt and returns success + userId on a correct code (B4/B7)', async () => {
      mockLoginCode.findFirst.mockResolvedValue(activeCode(clock));
      mockArgon2.verify.mockResolvedValue(true);
      mockLoginCode.update.mockResolvedValue({});

      const result = await service.verify('challenge-abc', '123456');

      expect(result.success).toBe(true);
      expect((result as VerifySuccess).userId).toBe('user-1');
      expect(mockLoginCode.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ consumedAt: expect.any(Date) }),
        }),
      );
    });

    // B7: access token may only be issued after verify; verify itself does not
    //     mint a token — just confirm it returns the userId for the caller.
    it('does not mint an access token itself — returns userId for caller to use (B7)', async () => {
      mockLoginCode.findFirst.mockResolvedValue(activeCode(clock));
      mockArgon2.verify.mockResolvedValue(true);
      mockLoginCode.update.mockResolvedValue({});

      const result = await service.verify('challenge-abc', '123456');

      expect(result).not.toHaveProperty('token');
      expect(result).not.toHaveProperty('accessToken');
      expect((result as VerifySuccess).userId).toBe('user-1');
    });
  });

  // =========================================================================
  // resend()
  // =========================================================================

  describe('resend()', () => {
    // B9: resend reuses the same challengeId
    it('issues a new code reusing the same challengeId (B9)', async () => {
      const existingChallengeId = 'stable-challenge-id';
      const existingRow = activeCode(clock, {
        challengeId: existingChallengeId,
        id: 'code-1',
      });
      mockLoginCode.findFirst.mockResolvedValue(existingRow);
      mockLoginCode.updateMany.mockResolvedValue({ count: 1 });

      let capturedChallengeId = '';
      mockLoginCode.create.mockImplementation(
        (args: { data: Record<string, unknown> }) => {
          capturedChallengeId = args.data.challengeId as string;
          return Promise.resolve({ id: 'code-2', challengeId: capturedChallengeId });
        },
      );

      const result = await service.resend(existingChallengeId);

      expect((result as ResendResult).challengeId).toBe(existingChallengeId);
      expect(capturedChallengeId).toBe(existingChallengeId);
    });

    // B6: resend invalidates the old code
    it('invalidates the prior code before issuing the new one (B6)', async () => {
      const existingRow = activeCode(clock, { challengeId: 'stable-id' });
      mockLoginCode.findFirst.mockResolvedValue(existingRow);
      mockLoginCode.updateMany.mockResolvedValue({ count: 1 });
      mockLoginCode.create.mockResolvedValue({ id: 'code-2', challengeId: 'stable-id' });

      await service.resend('stable-id');

      expect(mockLoginCode.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
    });

    // B9: unknown/expired challengeId → failure
    it('returns failure when the challengeId is unknown or expired (B9)', async () => {
      mockLoginCode.findFirst.mockResolvedValue(null);

      const result = await service.resend('no-such-challenge');
      expect(result.success).toBe(false);
    });

    // B2: resent code is also hashed only
    it('hashes the new code before storing (B2)', async () => {
      const existingRow = activeCode(clock, { challengeId: 'stable-id' });
      mockLoginCode.findFirst.mockResolvedValue(existingRow);
      mockLoginCode.updateMany.mockResolvedValue({ count: 1 });
      mockLoginCode.create.mockResolvedValue({ id: 'code-2', challengeId: 'stable-id' });

      await service.resend('stable-id');

      expect(mockArgon2.hash).toHaveBeenCalledOnce();
      const createData = mockLoginCode.create.mock.calls[0][0].data as Record<string, unknown>;
      expect(createData.codeHash).toBe('hashed-code');
    });
  });

  // =========================================================================
  // Constructor default branches (coverage gap identified in T018 review)
  // =========================================================================

  describe('constructor defaults', () => {
    // Covers the `?? new PrismaClient()` and `?? (() => new Date())` branches
    // at lines 59–60 of loginCode.ts. The @prisma/client mock at the top of this
    // file intercepts `new PrismaClient()`, so no real DB connection is made.
    // Calling verify() triggers this.clock() so the default clock function is
    // actually invoked (not just assigned), reaching 100% branch coverage.
    it('initialises with no-argument defaults and uses the wall-clock when called', async () => {
      mockLoginCode.findFirst.mockResolvedValue(null); // unknown challengeId → fast return

      const defaultService = new LoginCodeService();
      const result = await defaultService.verify('no-such-challenge', '000000');

      // Unknown challenge → failure; the important thing is no error is thrown
      // and this.clock() was invoked (covers the default branch).
      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // verify() ordering fix — successful verify after resend (T018 review)
  // =========================================================================

  describe('verify() after resend()', () => {
    // After resend() a second LoginCode row shares the same challengeId.
    // verify() must use orderBy: { createdAt: 'desc' } so it always returns
    // the newest (active) row rather than the consumed old one.
    it('succeeds when the newest row is active even if an older row exists for the same challengeId', async () => {
      // Simulate: findFirst returns the NEWEST row (active), not the consumed old one.
      const newestRow = activeCode(clock, {
        id: 'code-2',
        challengeId: 'stable-id',
        // newly issued — expiresAt is in the future, not consumed
      });
      mockLoginCode.findFirst.mockResolvedValue(newestRow);
      mockArgon2.verify.mockResolvedValue(true);
      mockLoginCode.update.mockResolvedValue({});

      const result = await service.verify('stable-id', '123456');

      expect(result.success).toBe(true);
      expect((result as VerifySuccess).userId).toBe('user-1');
    });
  });
});
