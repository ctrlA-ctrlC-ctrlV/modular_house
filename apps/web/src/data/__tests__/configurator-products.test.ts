/**
 * configurator-products.test.ts
 *
 * Unit tests for the seed data in `configurator-products.ts`, focused on
 * the promotional pre-sale "original" price fields introduced by the
 * 011-sales-discount feature branch (see specs/011-sales-discount/plan.md
 * sections 5.2 and 5.3).
 *
 * Scope:
 *   - Verify every single-layout product carries an
 *     `originalBasePriceCentsInclVat` value matching the plan table.
 *   - Verify the Studio 25 record carries a complete
 *     `originalPriceCentsInclVatByLayoutId` map keyed by each of its
 *     three layout option ids (`lo-studio-box`, `lo-studio-en-suite`,
 *     `lo-studio-bedroom`), with the expected values in euro cents.
 *
 * These assertions lock the promotional pricing contract at the data
 * layer so accidental edits (e.g., typo in a layout id, missing entry
 * for a new Studio variant) fail the build rather than silently
 * degrading the strikethrough display at runtime.
 */

import { describe, it, expect } from 'vitest';
import { CONFIGURATOR_PRODUCTS } from '../configurator-products';

// ---------------------------------------------------------------------------
// Shared lookup helpers
// ---------------------------------------------------------------------------

/**
 * Locates a product record by slug from the seed array.
 *
 * Throws when the slug is unknown so that any reshaping of the seed
 * data that removes a product surfaces as a clear test failure at the
 * site of consumption rather than as a downstream `undefined` error.
 */
function getProductBySlug(slug: string) {
  const product = CONFIGURATOR_PRODUCTS.find((p) => p.slug === slug);
  if (!product) {
    throw new Error(`Expected product with slug "${slug}" to exist in CONFIGURATOR_PRODUCTS`);
  }
  return product;
}

describe('CONFIGURATOR_PRODUCTS — promotional original prices', () => {
  // Single-layout products: the scalar `originalBasePriceCentsInclVat`
  // is the sole source of the strikethrough value; no per-layout map
  // is required. Values are mirrored verbatim from plan.md table 5.3.
  const singleLayoutExpectations: ReadonlyArray<{
    readonly slug: string;
    readonly expectedOriginalCents: number;
  }> = [
    { slug: 'compact-15', expectedOriginalCents: 4_000_000 },
    { slug: 'living-35',  expectedOriginalCents: 8_100_000 },
    { slug: 'grand-45',   expectedOriginalCents: 10_600_000 },
  ];

  it.each(singleLayoutExpectations)(
    'carries the expected originalBasePriceCentsInclVat for $slug',
    ({ slug, expectedOriginalCents }) => {
      const product = getProductBySlug(slug);
      expect(product.originalBasePriceCentsInclVat).toBe(expectedOriginalCents);
    },
  );

  it('retains the existing basePriceCentsInclVat (sale price) untouched for single-layout products', () => {
    // Guard against accidental mutation of the live sale price while
    // authoring the original-price fields. The sale price is the
    // value actually charged and must remain the source of truth for
    // the configurator's running total.
    expect(getProductBySlug('compact-15').basePriceCentsInclVat).toBe(2_950_000);
    expect(getProductBySlug('living-35').basePriceCentsInclVat).toBe(6_850_000);
    expect(getProductBySlug('grand-45').basePriceCentsInclVat).toBe(8_350_000);
  });

  describe('studio-25 layout-dependent originals', () => {
    it('exposes a scalar Box fallback via originalBasePriceCentsInclVat', () => {
      // Consumers without access to the active layout selection
      // (e.g., ProductRangeGrid and ProductShowcase) fall back to
      // this scalar value, which by convention mirrors the "Box"
      // entry in the per-layout map.
      const studio = getProductBySlug('studio-25');
      expect(studio.originalBasePriceCentsInclVat).toBe(5_800_000);
    });

    it('exposes all three layout originals in originalPriceCentsInclVatByLayoutId', () => {
      const studio = getProductBySlug('studio-25');
      expect(studio.originalPriceCentsInclVatByLayoutId).toEqual({
        'lo-studio-box':      5_800_000,
        'lo-studio-en-suite': 7_000_000,
        'lo-studio-bedroom':  7_200_000,
      });
    });

    it('aligns per-layout keys with the actual LayoutOption ids defined on the product', () => {
      // Ensures the promotional map never drifts from the source of
      // truth for layout identity. If a layout id is renamed in the
      // `layoutOptions` array, this assertion forces the map to be
      // updated in lockstep.
      const studio = getProductBySlug('studio-25');
      const declaredLayoutIds = studio.layoutOptions.map((l) => l.id).sort();
      const mappedLayoutIds = Object.keys(studio.originalPriceCentsInclVatByLayoutId ?? {}).sort();
      expect(mappedLayoutIds).toEqual(declaredLayoutIds);
    });
  });
});
