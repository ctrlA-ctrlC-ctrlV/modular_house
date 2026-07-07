-- ============================================================================
-- Migration: add_login_2fa_reset_and_profile
-- Purpose:   Adds the Phase 1 authentication and profile structures:
--              - login_codes          (email OTP for two-factor sign-in)
--              - password_reset_tokens (single-use password-reset links)
--              - user_preferences      (per-user theme + sidebar state)
--              - users.display_name    (shown in sidebar user section)
--              - users.profile_photo   (raw bytes; NULL → initials fallback)
--              - users.profile_photo_mime (MIME type of the stored photo)
--            All changes are ADDITIVE: no existing columns are dropped, no
--            types are changed, no backfill is required.
-- Reversibility: drop the three new tables and the three new users columns.
-- ============================================================================

-- --------------------------------------------------------------------------
-- AlterTable: users
-- Extend the existing users table with three nullable Phase 1 columns.
-- Existing rows default to NULL — no data migration required.
-- --------------------------------------------------------------------------
ALTER TABLE "users" ADD COLUMN "display_name"       VARCHAR(100);
ALTER TABLE "users" ADD COLUMN "profile_photo"      BYTEA;
ALTER TABLE "users" ADD COLUMN "profile_photo_mime" VARCHAR(50);

-- --------------------------------------------------------------------------
-- AlterTable: refresh_tokens
-- Add the last-used timestamp required for the 30-minute idle timeout (E7).
-- Additive: nullable column; NULL means the token has never been silently
-- refreshed.  No backfill required; the auth service writes it on refresh.
-- --------------------------------------------------------------------------
ALTER TABLE "refresh_tokens" ADD COLUMN "last_used_at" TIMESTAMPTZ(6);

-- --------------------------------------------------------------------------
-- CreateTable: login_codes
-- Stores the argon2-hashed 6-digit OTP for each sign-in challenge.
-- Raw codes are never persisted (B2).  challengeId binds the code-entry
-- step to the user without exposing the email (B9).
-- --------------------------------------------------------------------------
CREATE TABLE "login_codes" (
    "id"            UUID           NOT NULL,
    "user_id"       UUID           NOT NULL,
    "challenge_id"  TEXT           NOT NULL,
    "code_hash"     TEXT           NOT NULL,
    "expires_at"    TIMESTAMPTZ(6) NOT NULL,
    "attempt_count" INTEGER        NOT NULL DEFAULT 0,
    "consumed_at"   TIMESTAMPTZ(6),
    "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_codes_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- CreateTable: password_reset_tokens
-- Stores the SHA-256-hashed 32-byte reset token for each password-reset
-- request.  Raw token bytes appear only in the emailed link (C1).
-- --------------------------------------------------------------------------
CREATE TABLE "password_reset_tokens" (
    "id"          UUID           NOT NULL,
    "user_id"     UUID           NOT NULL,
    "token_hash"  TEXT           NOT NULL,
    "expires_at"  TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- CreateTable: user_preferences
-- One row per admin user; server-authoritative source for theme mode and
-- sidebar collapse state (research R7).
-- --------------------------------------------------------------------------
CREATE TABLE "user_preferences" (
    "id"               UUID           NOT NULL,
    "user_id"          UUID           NOT NULL,
    "theme_mode"       VARCHAR(10)    NOT NULL DEFAULT 'system',
    "sidebar_collapsed" BOOLEAN       NOT NULL DEFAULT false,
    "created_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- Unique Indexes
-- ============================================================================

-- user_preferences: enforce one row per user.
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- ============================================================================
-- Performance Indexes
-- ============================================================================

-- login_codes: per-user OTP lookup.
CREATE INDEX "login_codes_user_id_idx" ON "login_codes"("user_id");

-- login_codes: challenge-bound code-entry lookup (verify-2fa / resend-code).
CREATE INDEX "login_codes_challenge_id_idx" ON "login_codes"("challenge_id");

-- login_codes: expiry-based cleanup.
CREATE INDEX "login_codes_expires_at_idx" ON "login_codes"("expires_at");

-- password_reset_tokens: per-user token lookup.
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- password_reset_tokens: token-hash lookup during reset-password flow.
CREATE INDEX "password_reset_tokens_token_hash_idx" ON "password_reset_tokens"("token_hash");

-- password_reset_tokens: expiry-based cleanup.
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");

-- ============================================================================
-- Foreign Key Constraints
-- ============================================================================

-- login_codes → users (cascade delete when user is removed)
ALTER TABLE "login_codes"
    ADD CONSTRAINT "login_codes_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- password_reset_tokens → users (cascade delete when user is removed)
ALTER TABLE "password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- user_preferences → users (cascade delete when user is removed)
ALTER TABLE "user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
