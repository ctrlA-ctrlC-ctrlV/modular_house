import { randomBytes, createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { RESET_TOKEN_TTL_MS } from '../config/adminAuth.js';

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface IssueResult {
  /** Raw 32-byte URL-safe base64 token to be embedded in the reset link (C1). */
  rawToken: string;
}

export interface ConsumeSuccess {
  success: true;
  userId: string;
}

export interface ConsumeFailure {
  success: false;
  reason: string;
}

export type ConsumeResult = ConsumeSuccess | ConsumeFailure;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive the SHA-256 hash stored in the DB (C1 — raw never stored). */
function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Password-reset token service (C1–C6).
 *
 * Accepts an injected clock (`() => Date`) so TTL / expiry assertions in tests
 * use the advanceable clock rather than real wall-clock time (R11).
 *
 * Accepts an injected `PrismaClient` for dependency injection in tests.
 */
export class PasswordResetTokenService {
  private readonly prisma: PrismaClient;
  private readonly clock: () => Date;

  constructor(prisma?: PrismaClient, clock?: () => Date) {
    this.prisma = prisma ?? new PrismaClient();
    this.clock = clock ?? (() => new Date());
  }

  // -------------------------------------------------------------------------
  // issue() — C1, C2
  // -------------------------------------------------------------------------

  /**
   * Mint a new password-reset token for `userId`.
   *
   * Returns the raw token so the caller can embed it in the reset-link email.
   * Only the SHA-256 hash is stored in the database (C1).
   */
  async issue(userId: string): Promise<IssueResult> {
    const now = this.clock();
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(now.getTime() + RESET_TOKEN_TTL_MS);

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return { rawToken };
  }

  // -------------------------------------------------------------------------
  // consume() — C3, C5, C6 hook point
  // -------------------------------------------------------------------------

  /**
   * Consume a reset token by its raw value.
   *
   * Looks up the stored row by SHA-256 hash of the provided raw token.
   * Rejects if the row is missing, already consumed, or expired (C3).
   * On success, marks `consumedAt` and returns the associated `userId` so
   * the caller can trigger lockout-clear (C5) and account-wide refresh
   * revocation (C6) before setting the new password.
   */
  async consume(rawToken: string): Promise<ConsumeResult> {
    const now = this.clock();
    const tokenHash = hashToken(rawToken);

    const row = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash },
    });

    if (!row) {
      return { success: false, reason: 'invalid or expired reset token' };
    }

    if (row.consumedAt !== null) {
      return { success: false, reason: 'reset token already consumed (used)' };
    }

    if (now >= row.expiresAt) {
      return { success: false, reason: 'reset token has expired' };
    }

    // Mark as consumed (C3).
    await this.prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { consumedAt: now },
    });

    return { success: true, userId: row.userId };
  }
}
