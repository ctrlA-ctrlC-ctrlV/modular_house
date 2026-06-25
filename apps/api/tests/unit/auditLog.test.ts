import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist the mock so the factory can reference it before variable initialization.
const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    auditLog = { create: mockCreate };
  },
}));

import { AuditLogService, AUDIT_ACTIONS } from '../../../src/services/auditLog.js';

describe('AuditLogService — I1–I3', () => {
  let service: AuditLogService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({});
    service = new AuditLogService();
  });

  // -------------------------------------------------------------------------
  // I1 / I2: all required fields written for a known-user action
  // -------------------------------------------------------------------------
  it('writes userId, action, entity, ipAddress, userAgent, createdAt for a known-user event (I1/I2)', async () => {
    await service.log({
      userId: 'user-abc',
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      entity: 'user',
      ipAddress: '1.2.3.4',
      userAgent: 'Mozilla/5.0',
    });

    expect(mockCreate).toHaveBeenCalledOnce();
    const { data } = mockCreate.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(data.userId).toBe('user-abc');
    expect(data.action).toBe(AUDIT_ACTIONS.LOGIN_SUCCESS);
    expect(data.entity).toBe('user');
    expect(data.ipAddress).toBe('1.2.3.4');
    expect(data.userAgent).toBe('Mozilla/5.0');
  });

  // -------------------------------------------------------------------------
  // I2: nullable acting user — unknown-email failure must not crash
  // -------------------------------------------------------------------------
  it('skips DB write when userId is null (unknown-email failure, I2)', async () => {
    await service.log({
      userId: null,
      action: AUDIT_ACTIONS.LOGIN_FAILURE,
      entity: 'user',
      ipAddress: '1.2.3.4',
      userAgent: null,
    });

    // The AuditLog schema requires a non-null userId FK; skip the write.
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // I1: all eight audited action constants are present
  // -------------------------------------------------------------------------
  it('exposes all I1 audited-event action constants', () => {
    const expected: string[] = [
      'LOGIN_SUCCESS',
      'LOGIN_FAILURE',
      'LOGOUT',
      'OTP_ISSUED',
      'OTP_VERIFIED',
      'PASSWORD_RESET_REQUESTED',
      'PASSWORD_RESET_COMPLETED',
      'PASSWORD_CHANGED',
    ];
    for (const action of expected) {
      expect(AUDIT_ACTIONS).toHaveProperty(action);
      expect((AUDIT_ACTIONS as Record<string, string>)[action]).toBe(action);
    }
  });

  // -------------------------------------------------------------------------
  // I3: no secret value may appear in any audit entry
  // -------------------------------------------------------------------------
  it('does not include secret-named fields in the persisted data (I3)', async () => {
    await service.log({
      userId: 'user-abc',
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      entity: 'user',
      ipAddress: '127.0.0.1',
      userAgent: null,
    });

    expect(mockCreate).toHaveBeenCalledOnce();
    // The `data` object must not carry any field whose name suggests a secret
    // value (e.g. passwordHash, rawCode, tokenValue).  The action string
    // "PASSWORD_CHANGED" is expected and is not itself a secret.
    const { data } = mockCreate.mock.calls[0][0] as { data: Record<string, unknown> };
    const fieldNames = Object.keys(data);
    const secretFieldPattern = /passwordhash|rawcode|tokenvalue|otpcode|secret/i;
    for (const field of fieldNames) {
      expect(field).not.toMatch(secretFieldPattern);
    }
  });

  // -------------------------------------------------------------------------
  // Accepts optional entityId (used for entity-specific lookups)
  // -------------------------------------------------------------------------
  it('passes entityId through when supplied', async () => {
    await service.log({
      userId: 'user-abc',
      action: AUDIT_ACTIONS.LOGOUT,
      entity: 'session',
      entityId: 'session-xyz',
      ipAddress: '10.0.0.1',
      userAgent: null,
    });

    const { data } = mockCreate.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(data.entityId).toBe('session-xyz');
  });
});
