import { randomBytes, randomInt } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { OTP_DIGIT_COUNT, OTP_MAX_ATTEMPTS, OTP_TTL_MS } from '../config/adminAuth.js';

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface IssueResult {
  /** Raw 6-digit code to be emailed (B1/B8). Never persisted or logged. */
  code: string;
  /**
   * Opaque 256-bit challenge identifier returned to the client (B9).
   * Stable across `resend-code` within one login challenge.
   */
  challengeId: string;
}

export interface ResendResult {
  success: true;
  code: string;
  challengeId: string;
}

export interface ResendFailure {
  success: false;
  reason: string;
}

export interface VerifySuccess {
  success: true;
  /** The authenticated user's ID — caller mints the access token (B7). */
  userId: string;
}

export interface VerifyFailure {
  success: false;
  reason: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * One-time login-code (OTP) service (B1–B9).
 *
 * Accepts an injected clock (`() => Date`) so every TTL / expiry assertion in
 * tests uses the advanceable clock rather than real wall-clock time (R11).
 *
 * Accepts an injected `PrismaClient` for dependency injection in tests.
 */
export class LoginCodeService {
  private readonly prisma: PrismaClient;
  private readonly clock: () => Date;

  constructor(prisma?: PrismaClient, clock?: () => Date) {
    this.prisma = prisma ?? new PrismaClient();
    this.clock = clock ?? (() => new Date());
  }

  // -------------------------------------------------------------------------
  // issue() — B1, B2, B3, B6, B9
  // -------------------------------------------------------------------------

  /**
   * Issue a new OTP for `userId`.
   *
   * Prior active (unconsumed, unexpired) codes for the same user are
   * invalidated (superseded) before the new code is written (B6).
   *
   * Returns the raw code so the caller can deliver it via email (B8).
   * The raw code is never stored or logged — only its argon2 hash is (B2).
   */
  async issue(userId: string): Promise<IssueResult> {
    const now = this.clock();
    const challengeId = this.generateChallengeId();
    const code = this.generateCode();
    const codeHash = await argon2.hash(code);
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

    // Invalidate any prior active codes for this user (B6).
    await this.prisma.loginCode.updateMany({
      where: {
        userId,
        consumedAt: null,
      },
      data: { consumedAt: now },
    });

    await this.prisma.loginCode.create({
      data: {
        userId,
        challengeId,
        codeHash,
        expiresAt,
      },
    });

    return { code, challengeId };
  }

  // -------------------------------------------------------------------------
  // verify() — B3, B4, B5, B7, B9
  // -------------------------------------------------------------------------

  /**
   * Verify an OTP submission against a `challengeId`.
   *
   * Returns `{ success: true, userId }` when the code is correct, unexpired,
   * unconsumed, and under the attempt limit; the caller is then responsible
   * for minting the access token (B7).
   *
   * On a wrong code, increments `attemptCount`; at `OTP_MAX_ATTEMPTS` the
   * code is treated as locked (B5).
   *
   * An unknown or expired `challengeId` yields `{ success: false }` (B9).
   */
  async verify(
    challengeId: string,
    code: string,
  ): Promise<VerifySuccess | VerifyFailure> {
    const now = this.clock();

    const record = await this.prisma.loginCode.findFirst({
      where: { challengeId },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return { success: false, reason: 'unknown_challenge' };
    }

    // B3: TTL check
    if (now >= record.expiresAt) {
      return { success: false, reason: 'expired' };
    }

    // B4: single-use check
    if (record.consumedAt !== null) {
      return { success: false, reason: 'consumed' };
    }

    // B5: attempt-limit check (treat locked the same as if the code is
    //     invalidated — a new code is required)
    if (record.attemptCount >= OTP_MAX_ATTEMPTS) {
      return { success: false, reason: 'locked_attempts' };
    }

    // Verify the submitted code against the stored hash
    const isCorrect = await argon2.verify(record.codeHash, code);

    if (!isCorrect) {
      // Increment the attempt counter (B5)
      await this.prisma.loginCode.update({
        where: { id: record.id },
        data: { attemptCount: record.attemptCount + 1 },
      });
      return { success: false, reason: 'wrong_code' };
    }

    // Mark as consumed (B4)
    await this.prisma.loginCode.update({
      where: { id: record.id },
      data: { consumedAt: now },
    });

    return { success: true, userId: record.userId };
  }

  // -------------------------------------------------------------------------
  // resend() — B2, B6, B9
  // -------------------------------------------------------------------------

  /**
   * Issue a replacement OTP reusing the same `challengeId` (B9).
   *
   * Finds the existing challenge to retrieve the `userId`, then invalidates
   * the old code and creates a new one with the original `challengeId` (B6/B9).
   *
   * Returns failure if the `challengeId` is unknown or has no active record.
   */
  async resend(challengeId: string): Promise<ResendResult | ResendFailure> {
    const now = this.clock();

    // Resolve challengeId → userId (B9: stable binding without exposing email)
    const existing = await this.prisma.loginCode.findFirst({
      where: { challengeId },
    });

    if (!existing) {
      return { success: false, reason: 'unknown_challenge' };
    }

    const { userId } = existing;
    const code = this.generateCode();
    const codeHash = await argon2.hash(code);
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

    // Invalidate the prior code (B6)
    await this.prisma.loginCode.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: now },
    });

    // Create a new row but keep the original challengeId (B9)
    await this.prisma.loginCode.create({
      data: {
        userId,
        challengeId, // same challengeId — stable across resend (B9)
        codeHash,
        expiresAt,
      },
    });

    return { success: true, code, challengeId };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /** Generate a cryptographically secure 6-digit OTP string (B1). */
  private generateCode(): string {
    // randomInt(0, 1_000_000) gives [0, 999999]; pad to 6 digits.
    const n = randomInt(0, 1_000_000);
    return n.toString().padStart(OTP_DIGIT_COUNT, '0');
  }

  /**
   * Generate an opaque 256-bit (32-byte) challenge identifier (B9).
   * URL-safe base64 encoding keeps it cookie/URL-safe.
   */
  private generateChallengeId(): string {
    return randomBytes(32).toString('base64url');
  }
}
