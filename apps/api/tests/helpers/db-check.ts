import { PrismaClient } from '@prisma/client';

/**
 * Check if the test database is reachable.
 * Integration tests that require a real database should call this
 * and use `describe.runIf(canConnect)` so they skip gracefully
 * in environments without a running DB (e.g. CI without services).
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
