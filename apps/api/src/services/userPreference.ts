import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Validation schema (H1)
// ---------------------------------------------------------------------------

const ThemeModeSchema = z.enum(['light', 'dark', 'system']);

const PreferenceInputSchema = z.object({
  themeMode: ThemeModeSchema.optional(),
  sidebarCollapsed: z.boolean().optional(),
});

export type PreferenceInput = z.infer<typeof PreferenceInputSchema>;

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UserPreferenceData {
  themeMode: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * UserPreference service (H1/H2).
 *
 * Server-stored source of truth for per-user UI preferences.
 * One row per user (upsert); Zod validates `themeMode` to the three allowed literals.
 *
 * Accepts an injected `PrismaClient` for dependency injection in tests.
 */
export class UserPreferenceService {
  private readonly prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma ?? new PrismaClient();
  }

  // -------------------------------------------------------------------------
  // get() — returns the stored preference row or null
  // -------------------------------------------------------------------------

  async get(userId: string): Promise<UserPreferenceData | null> {
    const row = await this.prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!row) {
      return null;
    }

    return {
      themeMode: ThemeModeSchema.parse(row.themeMode),
      sidebarCollapsed: row.sidebarCollapsed,
    };
  }

  // -------------------------------------------------------------------------
  // set() — Zod-validated upsert of themeMode + sidebarCollapsed (H1/H2)
  // -------------------------------------------------------------------------

  async set(userId: string, input: PreferenceInput): Promise<UserPreferenceData> {
    // Throws a ZodError (caught by the route layer as 400) on invalid themeMode.
    const validated = PreferenceInputSchema.parse(input);

    const row = await this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        themeMode: validated.themeMode ?? 'system',
        sidebarCollapsed: validated.sidebarCollapsed ?? false,
      },
      update: {
        ...(validated.themeMode !== undefined && { themeMode: validated.themeMode }),
        ...(validated.sidebarCollapsed !== undefined && { sidebarCollapsed: validated.sidebarCollapsed }),
      },
    });

    return {
      themeMode: ThemeModeSchema.parse(row.themeMode),
      sidebarCollapsed: row.sidebarCollapsed,
    };
  }
}
