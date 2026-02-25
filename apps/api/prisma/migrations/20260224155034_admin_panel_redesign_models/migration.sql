-- ============================================================================
-- Migration: admin_panel_redesign_models
-- Purpose:   Introduces the RBAC and audit infrastructure required by the
--            Admin Panel Redesign (spec 006).  Creates six new tables
--            (roles, permissions, role_permissions, audit_logs, settings,
--            refresh_tokens) and extends three existing tables (users,
--            pages, faqs) with additional columns and foreign keys.
-- ============================================================================

-- --------------------------------------------------------------------------
-- CreateTable: roles
-- Named role definitions used by the Role-Based Access Control system.
-- System-seeded roles (super_admin, admin, editor, viewer) have
-- is_system = true and cannot be deleted through the admin UI.
-- --------------------------------------------------------------------------
CREATE TABLE "roles" (
    "id"         UUID         NOT NULL,
    "name"       VARCHAR(50)  NOT NULL,
    "description" TEXT,
    "is_system"  BOOLEAN      NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- CreateTable: permissions
-- Granular resource + action pairs (e.g. "pages" + "edit") that define a
-- single capability within the system.  A unique constraint on
-- (resource, action) prevents duplicate permission definitions.
-- --------------------------------------------------------------------------
CREATE TABLE "permissions" (
    "id"          UUID        NOT NULL,
    "resource"    VARCHAR(50) NOT NULL,
    "action"      VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- CreateTable: role_permissions
-- Many-to-many join table linking roles to permissions.  Cascade deletes
-- on both foreign keys ensure stale mappings are automatically cleaned up
-- when a role or permission is removed.
-- --------------------------------------------------------------------------
CREATE TABLE "role_permissions" (
    "id"            UUID NOT NULL,
    "role_id"       UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- CreateTable: audit_logs
-- Immutable record of every administrative action.  Captures the acting
-- user, the action verb, the affected entity type and identifier, an
-- optional JSON diff of changed fields, and request metadata (IP address,
-- user-agent string).  Indexed for time-ordered feeds, per-entity history,
-- and per-user filtering.
-- --------------------------------------------------------------------------
CREATE TABLE "audit_logs" (
    "id"         UUID           NOT NULL,
    "user_id"    UUID           NOT NULL,
    "action"     VARCHAR(50)    NOT NULL,
    "entity"     VARCHAR(50)    NOT NULL,
    "entity_id"  VARCHAR(255),
    "changes"    JSONB,
    "ip_address" VARCHAR(45)    NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- CreateTable: settings
-- Key-value store for site-wide configuration (site name, SEO defaults,
-- notification preferences, appearance options).  Values are stored as
-- text strings; consumers are responsible for parsing to the appropriate
-- type.  A group column supports logical UI organisation.
-- --------------------------------------------------------------------------
CREATE TABLE "settings" (
    "id"          UUID           NOT NULL,
    "key"         VARCHAR(100)   NOT NULL,
    "value"       TEXT           NOT NULL,
    "group"       VARCHAR(50)    NOT NULL DEFAULT 'general',
    "description" TEXT,
    "created_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- --------------------------------------------------------------------------
-- CreateTable: refresh_tokens
-- JWT refresh token store with family-based rotation for replay-attack
-- detection.  Each rotation revokes the current token and links it to a
-- newly created successor via replaced_by_token_id while preserving the
-- family identifier.  Reuse of a revoked token triggers revocation of the
-- entire family (theft detection).
-- --------------------------------------------------------------------------
CREATE TABLE "refresh_tokens" (
    "id"                   UUID           NOT NULL,
    "user_id"              UUID           NOT NULL,
    "token_hash"           TEXT           NOT NULL,
    "family"               VARCHAR(255)   NOT NULL,
    "expires_at"           TIMESTAMPTZ(6) NOT NULL,
    "revoked_at"           TIMESTAMPTZ(6),
    "replaced_by_token_id" UUID,
    "created_at"           TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- AlterTable: users
-- Replace the legacy roles text array with a proper foreign-key reference
-- to the roles table.  Add security columns for brute-force lockout
-- (failed_login_attempts, locked_until) and account deactivation (is_active).
-- NOTE: role_id is initially nullable to avoid a NOT NULL violation before
-- existing rows are back-filled by the seed script.  A subsequent migration
-- or manual step should set it NOT NULL after seeding.
-- ============================================================================

-- Add new columns to the users table.
ALTER TABLE "users" ADD COLUMN "role_id" UUID;
ALTER TABLE "users" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "failed_login_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "locked_until" TIMESTAMPTZ(6);

-- Drop the legacy roles text array column.
ALTER TABLE "users" DROP COLUMN "roles";

-- ============================================================================
-- AlterTable: pages
-- Add publish lifecycle state and an optimistic-locking version counter.
-- publish_status defaults to DRAFT; version defaults to 1 and is
-- incremented on every successful save by the application layer.
-- ============================================================================
ALTER TABLE "pages" ADD COLUMN "publish_status" "publish_status" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "pages" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- ============================================================================
-- AlterTable: faqs
-- Add publish lifecycle state.  Only FAQs with publish_status = PUBLISHED
-- are returned to the public-facing site.
-- ============================================================================
ALTER TABLE "faqs" ADD COLUMN "publish_status" "publish_status" NOT NULL DEFAULT 'DRAFT';

-- ============================================================================
-- Unique Indexes
-- ============================================================================

-- Roles: enforce unique role names.
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- Permissions: enforce unique (resource, action) pairs.
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- Role-permissions: prevent duplicate role-permission assignments.
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- Settings: enforce unique setting keys.
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- Refresh tokens: one-to-one self-referencing constraint for token rotation.
CREATE UNIQUE INDEX "refresh_tokens_replaced_by_token_id_key" ON "refresh_tokens"("replaced_by_token_id");

-- ============================================================================
-- Performance Indexes
-- ============================================================================

-- Role-permissions: accelerate permission lookups by role.
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- Role-permissions: accelerate role lookups by permission.
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- Audit logs: support time-ordered activity feed queries.
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- Audit logs: support entity-specific history lookups.
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- Audit logs: support per-user activity filtering.
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- Settings: support group-based listing in the settings UI.
CREATE INDEX "settings_group_idx" ON "settings"("group");

-- Refresh tokens: hash-based token lookup during refresh flow.
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- Refresh tokens: family-wide lookup for rotation and theft detection.
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens"("family");

-- Refresh tokens: per-user token listing (e.g. logout-all).
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- Refresh tokens: expiration-based cleanup queries.
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- ============================================================================
-- Foreign Keys
-- ============================================================================

-- Role-permissions -> roles (cascade delete).
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Role-permissions -> permissions (cascade delete).
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey"
    FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Audit logs -> users.
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Refresh tokens -> users.
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Refresh tokens self-referencing rotation chain.
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_replaced_by_token_id_fkey"
    FOREIGN KEY ("replaced_by_token_id") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Users -> roles.
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
