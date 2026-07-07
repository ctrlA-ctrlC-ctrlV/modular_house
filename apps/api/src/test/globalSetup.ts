// ============================================================================
// Vitest globalSetup — ensure RBAC roles + permissions exist before any test.
// ============================================================================
// DB-dependent integration tests look up the `admin` / `super_admin` roles and
// their permissions in `beforeAll` and assume they are already seeded. Running
// this once before the suite makes a clean (migrated-but-unseeded) database
// pass without relying on out-of-band `db:seed` state — the gap that let CI
// fail while local runs (against an externally-seeded DB) passed.
//
// Idempotent (upserts only); shares its data with `prisma/seed.ts` via
// `prisma/seedData.ts` so the two seeding paths cannot drift.
// ============================================================================
import { PrismaClient } from '@prisma/client';
import { config as loadEnv } from 'dotenv';
import { ROLES, PERMISSIONS, getPermissionsForRole } from '../seed/seedData.js';

export default async function setup(): Promise<void> {
  // Load the test env so DATABASE_URL points at the test database.
  //
  // Locally we must `override`: Prisma auto-loads `.env` (the dev DB) when
  // PrismaClient is imported, and dotenv will not replace an already-set var
  // without it — so without override the dev DB (5432) would win over
  // `.env.test`. In CI the real DATABASE_URL is supplied as a job-level env
  // var (and differs from the committed `.env.test` value), so we must NOT
  // override it. GitHub Actions always sets `CI=true`, which distinguishes the
  // two cases; this mirrors `setup.ts`, which likewise defers to the job env.
  loadEnv({ path: '.env.test', override: !process.env.CI });

  const prisma = new PrismaClient();
  try {
    const roleIds = new Map<string, string>();
    for (const role of ROLES) {
      const upserted = await prisma.role.upsert({
        where: { name: role.name },
        update: { description: role.description, isSystem: role.isSystem },
        create: { name: role.name, description: role.description, isSystem: role.isSystem },
      });
      roleIds.set(role.name, upserted.id);
    }

    const permIds = new Map<string, string>();
    for (const perm of PERMISSIONS) {
      const upserted = await prisma.permission.upsert({
        where: { resource_action: { resource: perm.resource, action: perm.action } },
        update: { description: perm.description },
        create: { resource: perm.resource, action: perm.action, description: perm.description },
      });
      permIds.set(`${perm.resource}:${perm.action}`, upserted.id);
    }

    for (const role of ROLES) {
      const roleId = roleIds.get(role.name);
      if (!roleId) continue;
      for (const key of getPermissionsForRole(role.name)) {
        const permissionId = permIds.get(key);
        if (!permissionId) continue;
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId } },
          update: {},
          create: { roleId, permissionId },
        });
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}
