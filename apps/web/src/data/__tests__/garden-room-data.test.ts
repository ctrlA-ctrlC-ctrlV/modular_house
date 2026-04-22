/**
 * garden-room-data.test.ts
 *
 * Unit tests for the projection layer in `garden-room-data.ts`, focused
 * on the promotional pre-sale "original" price surface introduced by
 * the 011-sales-discount feature branch (see specs/011-sales-discount/
 * plan.md sections 5.4 and 5.6).
 *
 * Scope:
 *   - The `formatEurCentsOrUndefined` helper preserves `undefined` and
 *     produces the canonical locale-formatted euro string for a defined
 *     cent value.
 *   - Every record in `GARDEN_ROOM_PRODUCTS` carries a formatted
 *     `originalPrice` string (all four garden rooms are on sale in v1
 *     of the 011-sales-discount campaign, per plan.md §5.3).
 *   - `PRODUCT_SHOWCASE_PRODUCTS` propagates the same field so the
 *     (currently-commented) showcase section picks up the feature
 *     automatically when re-enabled.
 */

import { describe, it, expect } from 'vitest';
import type { ProductCard, ProductShowcaseProduct } from '@modular-house/ui';
import {
  formatEurCentsOrUndefined,
  GARDEN_ROOM_PRODUCTS,
  PRODUCT_SHOWCASE_PRODUCTS,
} from '../garden-room-data';

/**
 * Structural extension describing the `originalPrice` field that the
 * projection layer attaches to each mapped object.
 *
 * The public `ProductCard` and `ProductShowcaseProduct` types exported
 * by `@modular-house/ui` do not yet declare this field — it is added as
 * part of the Phase 3 component contract updates (see plan.md §6.2 and
 * §6.3 / tasks.md T3.1 and T3.2). Until those tasks land, the tests
 * access the projected field through this local intersection type so
 * the Phase 1 data layer can be asserted in isolation without leaking
 * a premature change into the shared UI package.
 */
type WithOriginalPrice = { readonly originalPrice?: string };

/**
 * Intersection aliases combining the public UI contract with the Phase 1
 * projection extension. A direct assignment from `ProductCard[]` to
 * `WithOriginalPrice[]` is rejected because the two types share no
 * declared properties; the intersection re-establishes the base shape
 * and widens it with the forward-looking `originalPrice` field.
 */
type ProjectedProductCard = ProductCard & WithOriginalPrice;
type ProjectedShowcaseProduct = ProductShowcaseProduct & WithOriginalPrice;

describe('formatEurCentsOrUndefined', () => {
  it('propagates undefined through the projection pipeline', () => {
    // Optional fields flow through the mapping logic as `undefined`
    // rather than being coerced to a string like "EURNaN", so that
    // downstream consumers can gate the strikethrough branch on a
    // simple presence check without additional sentinel handling.
    expect(formatEurCentsOrUndefined(undefined)).toBeUndefined();
  });

  it('formats a defined cent value using the locale-aware euro convention', () => {
    // The formatter is shared with `formatEurCents`; the wrapper only
    // short-circuits on `undefined`. A single representative value is
    // sufficient to lock the formatting contract — broader formatter
    // coverage lives alongside `formatEurCents` itself.
    expect(formatEurCentsOrUndefined(4_000_000)).toBe('\u20AC40,000');
  });
});

describe('GARDEN_ROOM_PRODUCTS projection', () => {
  it('projects an originalPrice string onto every product card', () => {
    // All four products carry an `originalBasePriceCentsInclVat` value
    // in the v1 campaign seed, so every projected card must surface a
    // formatted original-price string. This guards against a future
    // edit that removes the field from a single product record while
    // the page still advertises the promotion.
    const cards: ReadonlyArray<ProjectedProductCard> = GARDEN_ROOM_PRODUCTS;
    for (const card of cards) {
      expect(card.originalPrice).toBeTypeOf('string');
      expect(card.originalPrice).toMatch(/^\u20AC/);
    }
  });
});

describe('PRODUCT_SHOWCASE_PRODUCTS projection', () => {
  it('projects an originalPrice string onto every showcase product', () => {
    const products: ReadonlyArray<ProjectedShowcaseProduct> = PRODUCT_SHOWCASE_PRODUCTS;
    for (const product of products) {
      expect(product.originalPrice).toBeTypeOf('string');
      expect(product.originalPrice).toMatch(/^\u20AC/);
    }
  });
});
