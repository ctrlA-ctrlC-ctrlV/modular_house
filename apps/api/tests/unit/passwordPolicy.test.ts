import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from '../../../src/config/adminAuth.js';

// Must use vi.hoisted so the mock factory can reference the variable.
const mockVerify = vi.hoisted(() => vi.fn());
vi.mock('argon2', () => ({ verify: mockVerify, hash: vi.fn() }));

import { validatePassword } from '../../../src/services/passwordPolicy.js';

describe('passwordPolicy validator — D1–D4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // D1: length constraints
  // -------------------------------------------------------------------------
  it(`rejects a password shorter than ${PASSWORD_MIN_LENGTH} chars (D1)`, async () => {
    const short = 'Abc1'.padEnd(PASSWORD_MIN_LENGTH - 1, 'x'); // 11 chars
    const result = await validatePassword({ newPassword: short, confirmPassword: short });
    expect(result.valid).toBe(false);
    expect(result.errors.newPassword).toMatch(/12|minimum|length/i);
  });

  it(`accepts a password of exactly ${PASSWORD_MIN_LENGTH} chars (D1)`, async () => {
    const pw = 'Abcdefghij12'; // exactly 12: lower + upper + digit
    const result = await validatePassword({ newPassword: pw, confirmPassword: pw });
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it(`rejects a password longer than ${PASSWORD_MAX_LENGTH} chars (D1)`, async () => {
    const long = 'Aa1' + 'x'.repeat(PASSWORD_MAX_LENGTH - 2); // 129 chars
    const result = await validatePassword({ newPassword: long, confirmPassword: long });
    expect(result.valid).toBe(false);
    expect(result.errors.newPassword).toMatch(/128|maximum|length/i);
  });

  // -------------------------------------------------------------------------
  // D2: character-class requirements (lower, upper, digit)
  // -------------------------------------------------------------------------
  it('rejects a password with no lowercase letter (D2)', async () => {
    const pw = 'ABCDEFGHIJ12'; // 12 chars, no lowercase
    const result = await validatePassword({ newPassword: pw, confirmPassword: pw });
    expect(result.valid).toBe(false);
    expect(result.errors.newPassword).toMatch(/lowercase/i);
  });

  it('rejects a password with no uppercase letter (D2)', async () => {
    const pw = 'abcdefghij12'; // 12 chars, no uppercase
    const result = await validatePassword({ newPassword: pw, confirmPassword: pw });
    expect(result.valid).toBe(false);
    expect(result.errors.newPassword).toMatch(/uppercase/i);
  });

  it('rejects a password with no digit (D2)', async () => {
    const pw = 'Abcdefghijkl'; // 12 chars, no digit
    const result = await validatePassword({ newPassword: pw, confirmPassword: pw });
    expect(result.valid).toBe(false);
    expect(result.errors.newPassword).toMatch(/digit|number/i);
  });

  // -------------------------------------------------------------------------
  // D3: new password must not equal current password (argon2 verify)
  // -------------------------------------------------------------------------
  it('rejects a new password equal to the current password (D3)', async () => {
    mockVerify.mockResolvedValue(true); // new == current
    const pw = 'Abcdefghij12';
    const hash = '$argon2id$placeholder';
    const result = await validatePassword({
      newPassword: pw,
      confirmPassword: pw,
      currentPasswordHash: hash,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.newPassword).toMatch(/same|current|different/i);
    expect(mockVerify).toHaveBeenCalledWith(hash, pw);
  });

  it('accepts a new password that differs from the current password (D3)', async () => {
    mockVerify.mockResolvedValue(false); // new != current
    const pw = 'Abcdefghij12';
    const result = await validatePassword({
      newPassword: pw,
      confirmPassword: pw,
      currentPasswordHash: '$argon2id$placeholder',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('skips the D3 check when no currentPasswordHash is provided', async () => {
    const pw = 'Abcdefghij12';
    const result = await validatePassword({ newPassword: pw, confirmPassword: pw });
    expect(mockVerify).not.toHaveBeenCalled();
    expect(result.valid).toBe(true);
  });

  // -------------------------------------------------------------------------
  // D4: confirmation must match
  // -------------------------------------------------------------------------
  it('rejects when confirmPassword does not match newPassword (D4)', async () => {
    const result = await validatePassword({
      newPassword: 'Abcdefghij12',
      confirmPassword: 'Abcdefghij13',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.confirmPassword).toMatch(/match|confirm/i);
  });

  it('returns no confirmPassword error when both entries match (D4)', async () => {
    const result = await validatePassword({
      newPassword: 'Abcdefghij12',
      confirmPassword: 'Abcdefghij12',
    });
    expect(result.errors.confirmPassword).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // D6: field-level messages — multiple violations reported together
  // -------------------------------------------------------------------------
  it('reports both newPassword and confirmPassword errors when present (D6)', async () => {
    // 11 chars (D1 violation), mismatched confirm (D4 violation)
    const result = await validatePassword({
      newPassword: 'Abcdefghij1',   // 11 chars
      confirmPassword: 'different',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.newPassword).toBeTruthy();
    expect(result.errors.confirmPassword).toBeTruthy();
  });
});
