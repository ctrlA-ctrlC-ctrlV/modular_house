/**
 * Per-test database reset helper for admin Phase 1 tests.
 *
 * Call `resetAdminTables(userId)` in a `beforeEach` hook to start each test with
 * a clean slate for the Phase 1 tables (`LoginCode`, `PasswordResetToken`,
 * `UserPreference`) scoped to a single user.  Scoping prevents parallel test
 * files from deleting each other's rows mid-test (Session 8 race-condition fix).
 * The helper silently skips tables that do not exist yet so it stays safe to
 * import before the Phase 1 migration (T005/T006) has run.
 *
 * Usage:
 *   import { resetAdminTables, disconnectDb } from '../helpers/db.js';
 *
 *   beforeEach(async () => { await resetAdminTables(userId); });
 *   afterAll(async ()  => { await disconnectDb(); });
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Phase 1 model names as they appear on the Prisma client (camelCase). */
const ADMIN_TABLES = ['loginCode', 'passwordResetToken', 'userPreference'] as const;

/**
 * Delete rows from the Phase 1 admin tables, optionally scoped to `userId`.
 * When `userId` is provided, only that user's rows are removed; this is the
 * default for integration tests to avoid cross-test races under Vitest's
 * parallel execution.  Skips any table whose Prisma delegate does not exist yet
 * (pre-migration).
 */
export async function resetAdminTables(userId?: string): Promise<void> {
  const filter = userId ? { where: { userId } } : {};
  for (const table of ADMIN_TABLES) {
    const delegate = (prisma as unknown as Record<string, unknown>)[table];
    if (delegate && typeof (delegate as { deleteMany?: unknown }).deleteMany === 'function') {
      await (delegate as { deleteMany: (args?: unknown) => Promise<unknown> }).deleteMany(filter);
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
