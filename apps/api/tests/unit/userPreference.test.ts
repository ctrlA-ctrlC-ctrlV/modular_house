import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockUserPreference = vi.hoisted(() => ({
  upsert: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    userPreference = mockUserPreference;
  },
}));

// ---------------------------------------------------------------------------
// Module under test (imported after mocks)
// ---------------------------------------------------------------------------

import { PrismaClient } from '@prisma/client';
import { UserPreferenceService } from '../../src/services/userPreference.js';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UserPreferenceService — H1/H2', () => {
  let prisma: PrismaClient;
  let service: UserPreferenceService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new PrismaClient();
    service = new UserPreferenceService(prisma);

    mockUserPreference.upsert.mockResolvedValue({
      id: 'pref-1',
      userId: 'user-1',
      themeMode: 'system',
      sidebarCollapsed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockUserPreference.findUnique.mockResolvedValue(null);
  });

  // -------------------------------------------------------------------------
  // H1: themeMode constrained to light | dark | system
  // -------------------------------------------------------------------------

  it('accepts themeMode "light" (H1)', async () => {
    mockUserPreference.upsert.mockResolvedValueOnce({
      id: 'pref-1', userId: 'user-1', themeMode: 'light', sidebarCollapsed: false,
      createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await service.set('user-1', { themeMode: 'light' });
    expect(result.themeMode).toBe('light');
  });

  it('accepts themeMode "dark" (H1)', async () => {
    mockUserPreference.upsert.mockResolvedValueOnce({
      id: 'pref-1', userId: 'user-1', themeMode: 'dark', sidebarCollapsed: false,
      createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await service.set('user-1', { themeMode: 'dark' });
    expect(result.themeMode).toBe('dark');
  });

  it('accepts themeMode "system" (H1)', async () => {
    mockUserPreference.upsert.mockResolvedValueOnce({
      id: 'pref-1', userId: 'user-1', themeMode: 'system', sidebarCollapsed: false,
      createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await service.set('user-1', { themeMode: 'system' });
    expect(result.themeMode).toBe('system');
  });

  it('rejects an invalid themeMode value (H1)', async () => {
    await expect(
      service.set('user-1', { themeMode: 'purple' as 'light' }),
    ).rejects.toThrow(/themeMode|invalid/i);
  });

  // -------------------------------------------------------------------------
  // H2: sidebarCollapsed is a boolean defaulting to false
  // -------------------------------------------------------------------------

  it('accepts sidebarCollapsed true (H2)', async () => {
    mockUserPreference.upsert.mockResolvedValueOnce({
      id: 'pref-1', userId: 'user-1', themeMode: 'system', sidebarCollapsed: true,
      createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await service.set('user-1', { sidebarCollapsed: true });
    expect(result.sidebarCollapsed).toBe(true);
  });

  it('accepts sidebarCollapsed false (H2)', async () => {
    mockUserPreference.upsert.mockResolvedValueOnce({
      id: 'pref-1', userId: 'user-1', themeMode: 'system', sidebarCollapsed: false,
      createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await service.set('user-1', { sidebarCollapsed: false });
    expect(result.sidebarCollapsed).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Upsert semantics: one row per user (H1/H2 persistence)
  // -------------------------------------------------------------------------

  it('calls upsert (one row per user) on set (H1/H2)', async () => {
    await service.set('user-1', { themeMode: 'dark', sidebarCollapsed: true });

    expect(mockUserPreference.upsert).toHaveBeenCalledOnce();
    const call = mockUserPreference.upsert.mock.calls[0][0] as {
      where: { userId: string };
      create: { userId: string; themeMode: string; sidebarCollapsed: boolean };
      update: { themeMode: string; sidebarCollapsed: boolean };
    };
    expect(call.where.userId).toBe('user-1');
    expect(call.create.userId).toBe('user-1');
    expect(call.create.themeMode).toBe('dark');
    expect(call.create.sidebarCollapsed).toBe(true);
    expect(call.update.themeMode).toBe('dark');
    expect(call.update.sidebarCollapsed).toBe(true);
  });

  // -------------------------------------------------------------------------
  // get() — returns persisted values
  // -------------------------------------------------------------------------

  it('returns persisted preference when a row exists (H1/H2)', async () => {
    const storedRow = {
      id: 'pref-1', userId: 'user-1', themeMode: 'dark', sidebarCollapsed: true,
      createdAt: new Date(), updatedAt: new Date(),
    };
    mockUserPreference.findUnique.mockResolvedValueOnce(storedRow);

    const result = await service.get('user-1');

    expect(result).not.toBeNull();
    const pref = result as NonNullable<typeof result>;
    expect(pref.themeMode).toBe('dark');
    expect(pref.sidebarCollapsed).toBe(true);
  });

  it('returns null when no preference row exists yet (H1/H2)', async () => {
    mockUserPreference.findUnique.mockResolvedValueOnce(null);

    const result = await service.get('user-1');
    expect(result).toBeNull();
  });

  // -------------------------------------------------------------------------
  // set() with only partial update (one field at a time)
  // -------------------------------------------------------------------------

  it('set() with only themeMode still upserts correctly', async () => {
    mockUserPreference.upsert.mockResolvedValueOnce({
      id: 'pref-1', userId: 'user-1', themeMode: 'light', sidebarCollapsed: false,
      createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await service.set('user-1', { themeMode: 'light' });
    expect(result.themeMode).toBe('light');
    expect(mockUserPreference.upsert).toHaveBeenCalledOnce();
  });

  it('set() with only sidebarCollapsed still upserts correctly', async () => {
    mockUserPreference.upsert.mockResolvedValueOnce({
      id: 'pref-1', userId: 'user-1', themeMode: 'system', sidebarCollapsed: true,
      createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await service.set('user-1', { sidebarCollapsed: true });
    expect(result.sidebarCollapsed).toBe(true);
    expect(mockUserPreference.upsert).toHaveBeenCalledOnce();
  });

  // -------------------------------------------------------------------------
  // Constructor default branch
  // -------------------------------------------------------------------------

  it('constructs with default prisma when no arg supplied', async () => {
    mockUserPreference.findUnique.mockResolvedValueOnce(null);

    const defaultService = new UserPreferenceService();
    const result = await defaultService.get('user-1');
    expect(result).toBeNull();
  });
});
