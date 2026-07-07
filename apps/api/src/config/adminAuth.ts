// ============================================================================
// Admin Panel — Phase 1 Auth Constants (plan §2, single source of truth)
// ============================================================================
// Every numeric value here is asserted directly by tests.  Changing a value
// requires changing its corresponding test(s) at the same time.
// Env-sourced values (JWT_EXPIRES_IN, REFRESH_TOKEN_SECRET, etc.) remain in
// env.ts; this module exposes the numeric equivalents tests can import.
// ============================================================================

// ---------------------------------------------------------------------------
// 2.1 Authentication & lockout (A2, A3)
// ---------------------------------------------------------------------------

/** Maximum consecutive failed password attempts before lockout (A2). */
export const LOCKOUT_THRESHOLD = 5;

/** Duration of account lockout in milliseconds — 15 minutes (A3). */
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

// ---------------------------------------------------------------------------
// 2.2 Two-factor one-time code / OTP (B1, B3, B5)
// ---------------------------------------------------------------------------

/** Number of digits in the CSPRNG-generated OTP (B1). */
export const OTP_DIGIT_COUNT = 6;

/** Lifetime of an OTP in milliseconds — 10 minutes (B3). */
export const OTP_TTL_MS = 10 * 60 * 1000;

/** Maximum wrong-guess attempts per OTP before it is invalidated (B5). */
export const OTP_MAX_ATTEMPTS = 5;

// ---------------------------------------------------------------------------
// 2.3 Password reset (C2)
// ---------------------------------------------------------------------------

/** Lifetime of a password-reset token in milliseconds — 60 minutes (C2). */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// 2.4 Password policy (D1)
// ---------------------------------------------------------------------------

/** Minimum password length in characters (D1). */
export const PASSWORD_MIN_LENGTH = 12;

/** Maximum password length in characters (D1). */
export const PASSWORD_MAX_LENGTH = 128;

// ---------------------------------------------------------------------------
// 2.5 Sessions & tokens (E1, E3, E7)
// ---------------------------------------------------------------------------

/** Access token lifetime in milliseconds — 15 minutes (E1). */
export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

/** Access token lifetime as a JWT-compatible string (E1, passed to jsonwebtoken). */
export const ACCESS_TOKEN_TTL = '15m';

/** Refresh token lifetime in milliseconds — 7 days (E3). */
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Refresh token lifetime as a string (E3). */
export const REFRESH_TOKEN_TTL = '7d';

/** Idle timeout: refresh token rejected when no activity for this duration — 30 minutes (E7). */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

// ---------------------------------------------------------------------------
// 2.6 Abuse prevention & throttling (F1, F2, F4)
// ---------------------------------------------------------------------------

/** Minimum time between OTP resend / reset-link requests per account — 60 seconds (F1). */
export const RESEND_COOLDOWN_MS = 60 * 1000;

/** Max OTP / reset-link requests per account in the rolling window (F2). */
export const RATE_WINDOW_MAX_REQUESTS = 5;

/** Rolling window duration for the per-account request cap — 15 minutes (F2). */
export const RATE_WINDOW_MS = 15 * 60 * 1000;

/** Login endpoint IP rate-limit ceiling — 20 requests per 15 minutes per IP (F4). */
export const IP_RATE_LIMIT_MAX = 20;

/** Login endpoint IP rate-limit window — 15 minutes (F4). */
export const IP_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

// ---------------------------------------------------------------------------
// 2.7 Profile photo (G2)
// ---------------------------------------------------------------------------

/** Maximum accepted profile photo size in bytes — 5 MB (G2). */
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** Accepted profile photo MIME types (G1). */
export const PHOTO_ACCEPTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
