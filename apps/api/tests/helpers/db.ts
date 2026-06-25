/**
 * Per-test database reset helper for admin Phase 1 tests.
 *
 * Call `resetAdminTables()` in a `beforeEach` hook to start each test with
 * a clean slate for the Phase 1 tables (`LoginCode`, `PasswordResetToken`,
 * `UserPreference`).  The helper silently skips tables that do not exist yet
 * so it stays safe to import before the Phase 1 migration (T005/T006) has run.
 *
 * Usage:
 *   import { resetAdminTables, disconnectDb } from '../helpers/db.js';
 *
 *   beforeEach(async () => { await resetAdminTables(); });
 *   afterAll(async ()  => { await disconnectDb(); });
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Phase 1 model names as they appear on the Prisma client (camelCase). */
const ADMIN_TABLES = ['loginCode', 'passwordResetToken', 'userPreference'] as const;

/**
 * Delete all rows from the Phase 1 admin tables.
 * Skips any table whose Prisma delegate does not exist yet (pre-migration).
 */
export async function resetAdminTables(): Promise<void> {
  for (const table of ADMIN_TABLES) {
    const delegate = (prisma as unknown as Record<string, unknown>)[table];
    if (delegate && typeof (delegate as { deleteMany?: unknown }).deleteMany === 'function') {
      await (delegate as { deleteMany: () => Promise<unknown> }).deleteMany();
    }
  }
}

/**
 * Cleanly disconnect the Prisma client.
 * Call in `afterAll` to avoid open-handle warnings.
 */
export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };
