import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';

/**
 * T007 — RefreshToken schema check: E7 idle-timeout field.
 *
 * The 30-minute idle timeout (E7) requires a per-token last-used timestamp so
 * the refresh route can reject tokens that have been inactive for over 30
 * minutes even while still within their 7-day absolute expiry window.
 *
 * Before T008:  `lastUsedAt` is absent from schema.prisma and therefore absent
 * from the generated @prisma/client DMMF → the `toContain('lastUsedAt')` assertion
 * fails at runtime.
 *
 * After T008 + `prisma generate`:  the DMMF includes the new column → test passes.
 */
describe('RefreshToken schema — E7 idle timeout', () => {
  it('exposes a lastUsedAt DateTime? column for 30-minute idle enforcement', () => {
    // Prisma.dmmf is baked into the generated client at `prisma generate` time.
    // It lists every field in every model; reading it is a pure in-memory check
    // — no database connection required.
    const refreshTokenModel = Prisma.dmmf.datamodel.models.find(
      (m) => m.name === 'RefreshToken',
    );

    expect(refreshTokenModel).toBeDefined();

    const fieldNames = refreshTokenModel!.fields.map((f) => f.name);

    // Assert that the idle-timeout column exists (E7).
    expect(fieldNames).toContain('lastUsedAt');

    // Assert that the field is nullable (the auth service sets it on refresh;
    // NULL means the token has never been used for a silent refresh).
    const lastUsedAtField = refreshTokenModel!.fields.find(
      (f) => f.name === 'lastUsedAt',
    );
    expect(lastUsedAtField?.isRequired).toBe(false);
    expect(lastUsedAtField?.type).toBe('DateTime');
  });
});
