import { randomBytes, createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import {
  RESET_TOKEN_TTL_MS,
  RESEND_COOLDOWN_MS,
  RATE_WINDOW_MAX_REQUESTS,
  RATE_WINDOW_MS,
} from '../config/adminAuth.js';

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
// Throttle result (F1/F2) — returned by checkResetThrottle()
// ---------------------------------------------------------------------------

/**
 * Outcome of a reset-link cooldown / rolling-window-cap check for one account.
 *
 * - `throttled: false`  → the request may proceed.
 * - `throttled: true`   → the request is blocked; `reason` distinguishes the
 *   60s per-account cooldown (F1) from the 5-per-15m rolling-window cap (F2),
 *   and `retryAfterMs` is the milliseconds until the block elapses.  Note the
 *   forgot-password route never surfaces this as a 429 (that would leak account
 *   existence — F3); it silently skips issuance and returns the neutral 200.
 */
export interface ThrottleResult {
  throttled: boolean;
  reason?: 'cooldown' | 'window_cap';
  retryAfterMs?: number;
}

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

  // -------------------------------------------------------------------------
  // checkResetThrottle() — F1, F2
  // -------------------------------------------------------------------------

  /**
   * Check whether a forgot-password request for `userId` is currently throttled.
   *
   * All throttle state is derived from the `created_at` timestamps of existing
   * `PasswordResetToken` rows (plan §2.6 — no separate counter store):
   *   - Cooldown (F1): the most recent row must be older than RESEND_COOLDOWN_MS
   *     (60s).  `retryAfterMs` is the remaining time until the cooldown elapses.
   *   - Window cap (F2): the count of rows created within the trailing
   *     RATE_WINDOW_MS (15m) must be below RATE_WINDOW_MAX_REQUESTS (5).
   *     `retryAfterMs` is the time until the oldest in-window row ages out.
   *
   * Uses the injected clock so tests can advance time deterministically (R11).
   * The caller (forgot-password route) enforces F3 by silently skipping
   * issuance when this returns `throttled: true` and always responding with the
   * neutral 200 — never a 429 — so account existence is never revealed.
   */
  async checkResetThrottle(userId: string): Promise<ThrottleResult> {
    const now = this.clock();

    // F1: 60s per-account cooldown measured from the latest row's created_at.
    // A missing latest row (no prior reset link) short-circuits the compound
    // condition to false, so no cooldown can apply — also covered by the
    // cooldown-elapsed branch and the no-prior-row first-request branch.
    const latest = await this.prisma.passwordResetToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (latest && now.getTime() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const elapsedMs = now.getTime() - latest.createdAt.getTime();
      return {
        throttled: true,
        reason: 'cooldown',
        retryAfterMs: RESEND_COOLDOWN_MS - elapsedMs,
      };
    }

    // F2: rolling 15m window cap on the count of rows created in that window.
    const windowStart = new Date(now.getTime() - RATE_WINDOW_MS);
    const countInWindow = await this.prisma.passwordResetToken.count({
      where: {
        userId,
        createdAt: { gte: windowStart },
      },
    });

    if (countInWindow >= RATE_WINDOW_MAX_REQUESTS) {
      return {
        throttled: true,
        reason: 'window_cap',
        retryAfterMs: RATE_WINDOW_MS,
      };
    }

    return { throttled: false };
  }
}
