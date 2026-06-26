import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClock } from '../helpers/clock.js';
import { RESET_TOKEN_TTL_MS } from '../../src/config/adminAuth.js';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockPasswordResetToken = vi.hoisted(() => ({
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    passwordResetToken = mockPasswordResetToken;
  },
}));

// SHA-256 hash mock (crypto is used for token generation + SHA-256 hashing).
// We do NOT mock node:crypto — the real randomBytes is fine; we only intercept
// the Prisma layer.

// ---------------------------------------------------------------------------
// Module under test (imported after mocks)
// ---------------------------------------------------------------------------

import { PrismaClient } from '@prisma/client';
import { PasswordResetTokenService } from '../../src/services/passwordResetToken.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function activeToken(
  clock: ReturnType<typeof createClock>,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'prt-1',
    userId: 'user-1',
    tokenHash: 'sha256-hash-of-token',
    expiresAt: new Date(clock.now().getTime() + RESET_TOKEN_TTL_MS),
    consumedAt: null,
    createdAt: clock.now(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PasswordResetTokenService — C1–C3', () => {
  let clock: ReturnType<typeof createClock>;
  let prisma: PrismaClient;
  let service: PasswordResetTokenService;

  beforeEach(() => {
    vi.clearAllMocks();
    clock = createClock();
    prisma = new PrismaClient();
    service = new PasswordResetTokenService(prisma, clock.now);

    mockPasswordResetToken.create.mockResolvedValue({ id: 'prt-1' });
    mockPasswordResetToken.findFirst.mockResolvedValue(null);
    mockPasswordResetToken.update.mockResolvedValue({ id: 'prt-1' });
  });

  // -------------------------------------------------------------------------
  // C1: token format (32-byte CSPRNG, URL-safe base64)
  // -------------------------------------------------------------------------

  it('generates a 32-byte URL-safe base64 token (C1)', async () => {
    mockPasswordResetToken.create.mockImplementationOnce(({ data }: { data: { tokenHash: string } }) => {
      // The raw token is returned to the caller for emailing; only the hash is stored.
      return Promise.resolve({ id: 'prt-1', tokenHash: data.tokenHash });
    });

    const result = await service.issue('user-1');

    // URL-safe base64 for 32 bytes = 43 chars (no padding) or 44 with '='.
    // base64url strips '=', so length is 43.
    expect(result.rawToken).toMatch(/^[A-Za-z0-9\-_]+$/);
    expect(result.rawToken.length).toBeGreaterThanOrEqual(43);
  });

  it('stores only the hash of the token — rawToken not in the DB call (C1)', async () => {
    let capturedData: Record<string, unknown> | null = null;
    mockPasswordResetToken.create.mockImplementationOnce(({ data }: { data: Record<string, unknown> }) => {
      capturedData = data;
      return Promise.resolve({ id: 'prt-1' });
    });

    const result = await service.issue('user-1');

    expect(capturedData).not.toBeNull();
    const stored = capturedData as Record<string, unknown>;
    // tokenHash must be present and must NOT equal the raw token
    expect(stored['tokenHash']).toBeDefined();
    expect(stored['tokenHash']).not.toEqual(result.rawToken);
    // Raw token must not appear anywhere in the stored data
    expect(JSON.stringify(capturedData)).not.toContain(result.rawToken);
  });

  // -------------------------------------------------------------------------
  // C2: TTL = 60 minutes
  // -------------------------------------------------------------------------

  it('sets expiresAt to now + 60m (C2)', async () => {
    let capturedData: Record<string, unknown> | null = null;
    mockPasswordResetToken.create.mockImplementationOnce(({ data }: { data: Record<string, unknown> }) => {
      capturedData = data;
      return Promise.resolve({ id: 'prt-1' });
    });

    const before = clock.now();
    await service.issue('user-1');
    const expected = new Date(before.getTime() + RESET_TOKEN_TTL_MS);

    expect(capturedData).not.toBeNull();
    expect((capturedData as Record<string, unknown>)['expiresAt']).toEqual(expected);
  });

  // -------------------------------------------------------------------------
  // C3: single-use + expired/consumed → clear error
  // -------------------------------------------------------------------------

  it('consumes the token on first successful verify (C3)', async () => {
    const row = activeToken(clock);
    mockPasswordResetToken.findFirst.mockResolvedValueOnce(row);
    mockPasswordResetToken.update.mockResolvedValueOnce({ ...row, consumedAt: clock.now() });

    const result = await service.consume('raw-token');

    expect(result.success).toBe(true);
    expect(mockPasswordResetToken.update).toHaveBeenCalledOnce();
    // The update must set consumedAt
    const updateCall = mockPasswordResetToken.update.mock.calls[0][0] as { data: { consumedAt: Date } };
    expect(updateCall.data.consumedAt).toBeInstanceOf(Date);
  });

  it('rejects a token that was already consumed (C3)', async () => {
    const row = activeToken(clock, { consumedAt: new Date(clock.now().getTime() - 1000) });
    mockPasswordResetToken.findFirst.mockResolvedValueOnce(row);

    const result = await service.consume('raw-token');

    expect(result.success).toBe(false);
    expect((result as { success: false; reason: string }).reason).toMatch(/used|consumed/i);
    expect(mockPasswordResetToken.update).not.toHaveBeenCalled();
  });

  it('rejects an expired token (C3)', async () => {
    // Token was issued at clock start, expired 60m + 1ms ago.
    const row = activeToken(clock, {
      expiresAt: new Date(clock.now().getTime() - 1),
    });
    mockPasswordResetToken.findFirst.mockResolvedValueOnce(row);

    const result = await service.consume('raw-token');

    expect(result.success).toBe(false);
    expect((result as { success: false; reason: string }).reason).toMatch(/expired/i);
    expect(mockPasswordResetToken.update).not.toHaveBeenCalled();
  });

  it('rejects a token that does not exist (unknown) (C3)', async () => {
    mockPasswordResetToken.findFirst.mockResolvedValueOnce(null);

    const result = await service.consume('nonexistent-token');

    expect(result.success).toBe(false);
    expect((result as { success: false; reason: string }).reason).toMatch(/invalid|not found|expired/i);
  });

  // -------------------------------------------------------------------------
  // Clock-crossing: token active before TTL, expired after
  // -------------------------------------------------------------------------

  it('accepts a token just before TTL boundary (C2/C3)', async () => {
    const row = activeToken(clock);
    // Advance to 1ms before expiry
    clock.advance(RESET_TOKEN_TTL_MS - 1);
    mockPasswordResetToken.findFirst.mockResolvedValueOnce(row);
    mockPasswordResetToken.update.mockResolvedValueOnce({ ...row, consumedAt: clock.now() });

    const result = await service.consume('raw-token');

    // expiresAt is in the future relative to the *issued* time, but we're
    // checking server-side using `now < expiresAt` — row.expiresAt was set at
    // issue time and is still in the future at (issuedAt + TTL - 1ms).
    expect(result.success).toBe(true);
  });

  it('rejects a token exactly at or after TTL boundary (C2/C3)', async () => {
    const row = activeToken(clock);
    // Advance past TTL
    clock.advance(RESET_TOKEN_TTL_MS + 1);
    // Return expired row (expiresAt is in the past relative to current clock)
    const expiredRow = {
      ...row,
      expiresAt: new Date(clock.now().getTime() - 1),
    };
    mockPasswordResetToken.findFirst.mockResolvedValueOnce(expiredRow);

    const result = await service.consume('raw-token');

    expect(result.success).toBe(false);
    expect((result as { success: false; reason: string }).reason).toMatch(/expired/i);
  });

  // -------------------------------------------------------------------------
  // Constructor default branches (covers lines where prisma/clock are undefined)
  // -------------------------------------------------------------------------

  it('constructs with default prisma and clock — clock is invoked when a method runs', async () => {
    // The vi.mock('@prisma/client') at the top intercepts `new PrismaClient()`.
    // Calling consume() triggers this.clock() so the default clock function
    // body is actually executed (not just assigned), reaching 100% branch coverage.
    mockPasswordResetToken.findFirst.mockResolvedValueOnce(null); // unknown token → fast return

    const defaultService = new PasswordResetTokenService();
    const result = await defaultService.consume('nonexistent');

    expect(result.success).toBe(false);
  });
});
