// ============================================================================
// Database Seed Script
// ============================================================================
// Populates the database with foundational data required by the Admin Panel
// Redesign (spec 006).  This script is idempotent — it uses upsert operations
// throughout so that it can be safely re-run without creating duplicates.
//
// Execution order:
//   1. Roles            — System-level RBAC role definitions.
//   2. Permissions       — Granular resource + action pairs.
//   3. Role-Permissions  — Mapping of which permissions belong to each role.
//   4. Settings          — Default site-wide key-value configuration.
//   5. Admin User        — Default super-admin account (back-fills roleId).
//
// Prerequisites:
//   - The Prisma migration for the admin panel redesign models must have been
//     applied before running this script.
//   - Environment variables (ADMIN_LOGIN_EMAIL, ADMIN_LOGIN_PASSWORD) should
//     be set in the .env file or host environment.
// ============================================================================

import { PrismaClient, type AnalyticsSourceGroup } from '@prisma/client';
import * as argon2 from 'argon2';
import { config } from '../src/config/env.js';
import { logger } from '../src/middleware/logger.js';
import { ROLES, PERMISSIONS, getPermissionsForRole } from '../src/seed/seedData.js';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------
// Role/permission shapes + data live in ../src/seed/seedData.ts (shared with
// the test globalSetup so the two seeding paths never drift).

/** Describes a site-wide setting to be seeded into the settings table. */
interface SettingSeedEntry {
  key: string;
  value: string;
  group: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Seed Data: Settings
// ---------------------------------------------------------------------------
// Default site-wide configuration values grouped by functional area.
// Values are stored as strings and parsed by consuming code as needed.
// ---------------------------------------------------------------------------

const SETTINGS: ReadonlyArray<SettingSeedEntry> = [
  {
    key: 'site_name',
    value: 'Modular House',
    group: 'general',
    description: 'Public-facing site name used in page titles and metadata',
  },
  {
    key: 'contact_email',
    value: '',
    group: 'general',
    description: 'Primary contact email address displayed on the site',
  },
  {
    key: 'default_seo_title',
    value: 'Modular House',
    group: 'general',
    description: 'Default SEO title appended to page-specific titles',
  },
  {
    key: 'admin_theme',
    value: 'system',
    group: 'appearance',
    description: 'Admin panel theme preference: light, dark, or system',
  },
  {
    key: 'sidebar_default_state',
    value: 'expanded',
    group: 'appearance',
    description: 'Initial sidebar state on login: expanded or collapsed',
  },
  {
    key: 'email_on_submission',
    value: 'false',
    group: 'notifications',
    description: 'Send email notification when a new form submission is received',
  },
  {
    key: 'daily_digest',
    value: 'false',
    group: 'notifications',
    description: 'Send a daily digest email summarising admin activity',
  },
] as const;

// ---------------------------------------------------------------------------
// Seed Data: Analytics Fixtures (test databases only — DoD-8)
// ---------------------------------------------------------------------------
// Deterministic analytics rows that span multiple Europe/London calendar
// days, cover all five source groups (DIRECT/SEARCH/SOCIAL/REFERRAL/CAMPAIGN),
// and include both new and returning visitors. These fixtures are seeded ONLY
// when NODE_ENV === 'test' so the production/dev seed path is unchanged.
//
// Timestamps are UTC and fall safely midday in London (BST / UTC+1 during
// July 2026) so each event's London calendar day is unambiguous. The fixed
// "today" for these fixtures is 2026-07-15 (London).
//
// Visitor/session UUIDs match those in tests/helpers/analyticsFixtures.ts so
// test assertions can reference the same identifiers.
// ---------------------------------------------------------------------------

/** Analytics visitor fixture — one row per visitor id (data-model §3). */
interface AnalyticsVisitorFixture {
  visitorId: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

/** Analytics event fixture — one row per stored page view (data-model §2). */
interface AnalyticsEventFixture {
  occurredAt: Date;
  path: string;
  visitorId: string;
  sessionId: string;
  sourceGroup: AnalyticsSourceGroup;
  referrerHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// Five visitors: A/C/E are "returning" relative to today (firstSeenAt on an
// earlier London day than their first event today); B/D are "new" (firstSeenAt
// today). Visitor E's firstSeenAt (2026-07-12) predates the 3-day range start
// so E counts as returning even in a 2026-07-13..15 range.
const ANALYTICS_FIXTURE_VISITORS: ReadonlyArray<AnalyticsVisitorFixture> = [
  { visitorId: 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', firstSeenAt: new Date('2026-07-13T11:00:00.000Z'), lastSeenAt: new Date('2026-07-15T11:00:00.000Z') },
  { visitorId: 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2', firstSeenAt: new Date('2026-07-15T11:00:00.000Z'), lastSeenAt: new Date('2026-07-15T11:20:00.000Z') },
  { visitorId: 'c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3', firstSeenAt: new Date('2026-07-14T11:00:00.000Z'), lastSeenAt: new Date('2026-07-15T11:40:00.000Z') },
  { visitorId: 'd4d4d4d4-d4d4-4d4d-8d4d-d4d4d4d4d4d4', firstSeenAt: new Date('2026-07-15T11:30:00.000Z'), lastSeenAt: new Date('2026-07-15T11:30:00.000Z') },
  { visitorId: 'e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5', firstSeenAt: new Date('2026-07-12T11:00:00.000Z'), lastSeenAt: new Date('2026-07-14T11:30:00.000Z') },
];

// Twelve events across three London calendar days (2026-07-13, 14, 15).
// Each session's FIRST event defines the session's source group (S4); the
// five sessions cover all five source groups exactly once.
const ANALYTICS_FIXTURE_EVENTS: ReadonlyArray<AnalyticsEventFixture> = [
  // --- 2026-07-13 (London) ---
  // Session A — first event: SEARCH (session source = SEARCH per S4)
  { occurredAt: new Date('2026-07-13T11:00:00.000Z'), path: '/',             visitorId: 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', sessionId: '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a1a', sourceGroup: 'SEARCH',   referrerHost: 'www.google.com' },
  { occurredAt: new Date('2026-07-13T11:05:00.000Z'), path: '/garden-room',  visitorId: 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', sessionId: '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a1a', sourceGroup: 'SEARCH' },
  // Session E — first event: SOCIAL
  { occurredAt: new Date('2026-07-13T12:00:00.000Z'), path: '/',             visitorId: 'e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5', sessionId: '5e5e5e5e-5e5e-45e5-85e5-5e5e5e5e5e5e', sourceGroup: 'SOCIAL',   referrerHost: 'www.facebook.com' },

  // --- 2026-07-14 (London) ---
  // Session C — first event: DIRECT
  { occurredAt: new Date('2026-07-14T11:00:00.000Z'), path: '/',                 visitorId: 'c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3', sessionId: '3c3c3c3c-3c3c-43c3-83c3-3c3c3c3c3c3c', sourceGroup: 'DIRECT' },
  { occurredAt: new Date('2026-07-14T11:30:00.000Z'), path: '/house-extension',  visitorId: 'c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3', sessionId: '3c3c3c3c-3c3c-43c3-83c3-3c3c3c3c3c3c', sourceGroup: 'DIRECT' },
  // Session E continues (second event — source stays SOCIAL per S4)
  { occurredAt: new Date('2026-07-14T11:30:00.000Z'), path: '/garden-room',      visitorId: 'e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5', sessionId: '5e5e5e5e-5e5e-45e5-85e5-5e5e5e5e5e5e', sourceGroup: 'SOCIAL' },
  // Session A continues on day 2 (source stays SEARCH per S4)
  { occurredAt: new Date('2026-07-14T12:00:00.000Z'), path: '/about',            visitorId: 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', sessionId: '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a1a', sourceGroup: 'SEARCH' },

  // --- 2026-07-15 (London, "today") ---
  // Session A continues on day 3
  { occurredAt: new Date('2026-07-15T11:00:00.000Z'), path: '/',             visitorId: 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', sessionId: '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1a1a', sourceGroup: 'SEARCH' },
  // Session B — first event: CAMPAIGN (utm-tagged)
  { occurredAt: new Date('2026-07-15T11:10:00.000Z'), path: '/about',       visitorId: 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2', sessionId: '2b2b2b2b-2b2b-42b2-82b2-2b2b2b2b2b2b', sourceGroup: 'CAMPAIGN', utmSource: 'newsletter', utmMedium: 'email', utmCampaign: 'summer2026' },
  { occurredAt: new Date('2026-07-15T11:20:00.000Z'), path: '/garden-room', visitorId: 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2', sessionId: '2b2b2b2b-2b2b-42b2-82b2-2b2b2b2b2b2b', sourceGroup: 'CAMPAIGN' },
  // Session D — first event: REFERRAL
  { occurredAt: new Date('2026-07-15T11:30:00.000Z'), path: '/',             visitorId: 'd4d4d4d4-d4d4-4d4d-8d4d-d4d4d4d4d4d4', sessionId: '4d4d4d4d-4d4d-44d4-84d4-4d4d4d4d4d4d', sourceGroup: 'REFERRAL', referrerHost: 'www.linkedin.com' },
  // Session C continues on day 3
  { occurredAt: new Date('2026-07-15T11:40:00.000Z'), path: '/contact',      visitorId: 'c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3', sessionId: '3c3c3c3c-3c3c-43c3-83c3-3c3c3c3c3c3c', sourceGroup: 'DIRECT' },
];

// ===========================================================================
// Seed Functions
// ===========================================================================

/**
 * Seeds all four system roles into the roles table.
 * Uses upsert keyed on the unique `name` field so that re-runs update
 * descriptions or flags without creating duplicates.
 */
async function seedRoles(): Promise<Map<string, string>> {
  logger.info('Seeding roles...');
  const roleIdMap = new Map<string, string>();

  for (const role of ROLES) {
    const upserted = await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        isSystem: role.isSystem,
      },
      create: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
    });

    roleIdMap.set(role.name, upserted.id);
    logger.info({ roleId: upserted.id, name: role.name }, 'Role upserted');
  }

  return roleIdMap;
}

/**
 * Seeds all permission definitions into the permissions table.
 * Uses upsert keyed on the unique composite (resource, action) so that
 * descriptions can be updated without creating duplicates.
 *
 * @returns A map from "resource:action" keys to their database UUIDs.
 */
async function seedPermissions(): Promise<Map<string, string>> {
  logger.info('Seeding permissions...');
  const permIdMap = new Map<string, string>();

  for (const perm of PERMISSIONS) {
    const upserted = await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {
        description: perm.description,
      },
      create: {
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
      },
    });

    const key = `${perm.resource}:${perm.action}`;
    permIdMap.set(key, upserted.id);
    logger.info({ permissionId: upserted.id, key }, 'Permission upserted');
  }

  return permIdMap;
}

/**
 * Seeds role-permission join-table entries for every role.
 * For each role, the function determines the authorised permissions via
 * `getPermissionsForRole`, resolves their database IDs, and upserts the
 * join-table row.  This ensures re-runs are safe and permission changes
 * in seed data are reflected without manual cleanup.
 */
async function seedRolePermissions(
  roleIdMap: Map<string, string>,
  permIdMap: Map<string, string>,
): Promise<void> {
  logger.info('Seeding role-permission mappings...');

  for (const role of ROLES) {
    const roleId = roleIdMap.get(role.name);
    if (!roleId) {
      logger.warn({ roleName: role.name }, 'Role ID not found; skipping permission mapping');
      continue;
    }

    const permissionKeys = getPermissionsForRole(role.name);

    for (const key of permissionKeys) {
      const permissionId = permIdMap.get(key);
      if (!permissionId) {
        logger.warn({ key }, 'Permission ID not found; skipping mapping');
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId,
          permissionId,
        },
      });
    }

    logger.info(
      { roleName: role.name, permissionCount: permissionKeys.length },
      'Role-permission mappings upserted',
    );
  }
}

/**
 * Seeds default site settings into the settings table.
 * Uses upsert keyed on the unique `key` field.  Existing values are NOT
 * overwritten — only the group and description are updated so that
 * user-modified settings are preserved across re-seeds.
 */
async function seedSettings(): Promise<void> {
  logger.info('Seeding default settings...');

  for (const setting of SETTINGS) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {
        // Preserve existing user-modified values; only update metadata.
        group: setting.group,
        description: setting.description,
      },
      create: {
        key: setting.key,
        value: setting.value,
        group: setting.group,
        description: setting.description,
      },
    });

    logger.info({ key: setting.key, group: setting.group }, 'Setting upserted');
  }
}

/**
 * Creates the default admin user account or migrates an existing user to the
 * super_admin role.  When the user already exists in the database, the seed
 * updates the `roleId` to point to the super_admin role, ensuring a smooth
 * transition from the legacy `roles` string-array field.
 *
 * Password hashing uses argon2 to match the application's authentication
 * service implementation.
 */
async function seedAdminUser(roleIdMap: Map<string, string>): Promise<void> {
  logger.info('Seeding admin user...');

  const superAdminRoleId = roleIdMap.get('super_admin');
  if (!superAdminRoleId) {
    logger.error('super_admin role ID not found; cannot seed admin user');
    throw new Error('super_admin role must exist before seeding the admin user');
  }

  const email = config.admin.adminEmail.toLowerCase().trim();
  const password = config.admin.adminPassword;

  // Check whether the admin user already exists in the database.
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // Migrate the existing user to the super_admin role.  This covers the
    // transition from the legacy roles array to the new RBAC model.
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        roleId: superAdminRoleId,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        // Ensure displayName is set for Phase 1 sidebar/settings display.
        displayName: existingUser.displayName ?? 'Super Admin',
      },
    });

    logger.info(
      { userId: existingUser.id, email },
      'Existing admin user migrated to super_admin role',
    );
    return;
  }

  // Create a new admin user with the super_admin role.
  const passwordHash = await argon2.hash(password);

  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      roleId: superAdminRoleId,
      isActive: true,
      failedLoginAttempts: 0,
      displayName: 'Super Admin',
    },
  });

  logger.info(
    { userId: newUser.id, email: newUser.email },
    'Admin user created with super_admin role',
  );
  console.log('Admin user created:');
  console.log(`  Email: ${email}`);
  console.log('  Password: (from environment variable ADMIN_LOGIN_PASSWORD)');
  console.log('  Role: super_admin');
  console.log('  Change this password after first login.');
}

/**
 * Seeds deterministic analytics fixture rows into the `analytics_events` and
 * `analytics_visitors` tables. Called ONLY when `NODE_ENV === 'test'` so the
 * production / development seed path is unchanged (DoD-8).
 *
 * The fixtures span three Europe/London calendar days (2026-07-13, 14, 15),
 * cover all five source groups (one session per group — S4), and include
 * both new visitors (B, D — firstSeenAt today) and returning visitors (A, C,
 * E — firstSeenAt on an earlier London day). Visitor/session UUIDs match
 * those in `tests/helpers/analyticsFixtures.ts` for cross-reference.
 *
 * Idempotency: all existing analytics rows are deleted before re-inserting,
 * so re-running `db:seed` produces the same deterministic state.
 */
async function seedAnalyticsFixtures(): Promise<void> {
  logger.info('Seeding analytics fixtures (test only)...');

  // Clear existing analytics rows so re-seeds are deterministic (events have
  // auto-increment IDs and cannot be upserted; a full reset is simplest).
  await prisma.analyticsEvent.deleteMany();
  await prisma.analyticsVisitor.deleteMany();

  // Insert visitors (one row per visitor id — data-model §3).
  for (const v of ANALYTICS_FIXTURE_VISITORS) {
    await prisma.analyticsVisitor.create({
      data: {
        visitorId: v.visitorId,
        firstSeenAt: v.firstSeenAt,
        lastSeenAt: v.lastSeenAt,
      },
    });
  }
  logger.info({ count: ANALYTICS_FIXTURE_VISITORS.length }, 'Analytics visitors seeded');

  // Insert events (append-only — data-model §2).
  for (const e of ANALYTICS_FIXTURE_EVENTS) {
    await prisma.analyticsEvent.create({
      data: {
        occurredAt: e.occurredAt,
        path: e.path,
        visitorId: e.visitorId,
        sessionId: e.sessionId,
        sourceGroup: e.sourceGroup,
        referrerHost: e.referrerHost,
        utmSource: e.utmSource,
        utmMedium: e.utmMedium,
        utmCampaign: e.utmCampaign,
      },
    });
  }
  logger.info({ count: ANALYTICS_FIXTURE_EVENTS.length }, 'Analytics events seeded');

  console.log(`  Analytics fixtures: ${ANALYTICS_FIXTURE_VISITORS.length} visitors, ${ANALYTICS_FIXTURE_EVENTS.length} events`);
}

// ===========================================================================
// Main Seed Orchestrator
// ===========================================================================
// Executes all seed functions in dependency order within a single Prisma
// transaction-like flow.  Roles and permissions must be seeded before their
// join-table mappings, and both must exist before the admin user can be
// assigned a role.
// ===========================================================================

async function main(): Promise<void> {
  logger.info('Starting database seed...');

  try {
    // Step 1: Seed roles — required before role-permission mapping and user creation.
    const roleIdMap = await seedRoles();

    // Step 2: Seed permissions — required before role-permission mapping.
    const permIdMap = await seedPermissions();

    // Step 3: Seed role-permission join entries — depends on roles and permissions.
    await seedRolePermissions(roleIdMap, permIdMap);

    // Step 4: Seed default site-wide settings — independent of RBAC data.
    await seedSettings();

    // Step 5: Create or migrate the admin user to the super_admin role.
    await seedAdminUser(roleIdMap);

    // Step 6: Seed analytics fixtures — test databases only (DoD-8).
    // The production / development seed path adds no analytics rows; the
    // gate is NODE_ENV === 'test', set in .env.test and in CI.
    if (config.app.nodeEnv === 'test') {
      await seedAnalyticsFixtures();
    } else {
      logger.info({ nodeEnv: config.app.nodeEnv }, 'Skipping analytics fixtures (not a test database)');
    }

    logger.info('Database seed completed successfully');
  } catch (error) {
    logger.error({ error }, 'Database seed failed');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the seed script.
main();