import { PrismaClient } from '@prisma/client';

/**
 * Immutable set of audited event names (I1).
 *
 * Values match the string stored in `AuditLog.action`.  Using a const object
 * (rather than an enum) keeps the type-narrowing simple and avoids reverse
 * mapping artefacts.
 */
export const AUDIT_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  OTP_ISSUED: 'OTP_ISSUED',
  OTP_VERIFIED: 'OTP_VERIFIED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export interface AuditLogInput {
  /**
   * The acting user's ID.  `null` is allowed for events where the email was
   * not found (unknown-email login failures); when `null` the entry is silently
   * skipped because the existing `AuditLog` schema requires a non-null FK (I2).
   */
  userId: string | null;
  action: AuditAction;
  /** Entity type affected (e.g. `'user'`, `'session'`). */
  entity: string;
  /** Optional entity-specific identifier (omit for account-level events). */
  entityId?: string;
  ipAddress: string;
  userAgent: string | null;
}

/**
 * Thin audit-log writer over the reused `AuditLog` Prisma model (I1–I3).
 *
 * Secrets (passwords, OTP codes, reset tokens) MUST NOT be passed to `log`.
 * The service itself does not perform any filtering — callers are responsible
 * for excluding secrets from the call site (I3).
 */
export class AuditLogService {
  private readonly prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma ?? new PrismaClient();
  }

  async log(input: AuditLogInput): Promise<void> {
    const { userId, action, entity, entityId, ipAddress, userAgent } = input;

    // Skip when the acting user is unknown (the AuditLog table requires a
    // non-null userId FK and no schema change is allowed for this phase).
    if (userId === null) {
      return;
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId ?? null,
        ipAddress,
        userAgent,
      },
    });
  }
}
