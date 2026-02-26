import { PrismaClient } from '@prisma/client';

/**
 * Checks if the database is reachable.
 * Returns true if a connection can be established, false otherwise.
 * Used to skip integration tests that require a live database.
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch {
    await prisma.$disconnect().catch(() => {});
    return false;
  }
}
