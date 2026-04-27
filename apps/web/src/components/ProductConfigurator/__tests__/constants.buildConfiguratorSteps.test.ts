/**
 * constants.buildConfiguratorSteps.test.ts
 *
 * Pins the product-shape-driven step composition rules implemented by
 * `buildConfiguratorSteps` (T5, see
 * `.docs/product-configurator-gotcha-tasks.md`).
 *
 * Rationale
 * ---------
 * Whether the Overview step appears is decided implicitly by the
 * presence of `floorPlanVariants` on the product fixture. The branch is
 * invisible from the type system, so a future contributor writing
 * `steps.find(s => s.id === 'overview')!` would crash on Studio-25.
 * The cases below assert the contract explicitly so the regression
 * surfaces at test time rather than at runtime.
 */

import { describe, it, expect } from 'vitest';

import { buildConfiguratorSteps } from '../constants';
import { CONFIGURATOR_PRODUCTS } from '../../../data/configurator-products';
import type { ConfiguratorProduct } from '../../../types/configurator';
import type { ConfiguratorStepId } from '../types';

/**
 * Resolves a fixture by slug, throwing rather than returning undefined
 * so failing assertions point at the missing fixture instead of a
 * downstream null-dereference.
 */
function getProductBySlug(slug: string): ConfiguratorProduct {
  const product = CONFIGURATOR_PRODUCTS.find((candidate) => candidate.slug === slug);
  if (!product) {
    throw new Error(`Expected fixture with slug "${slug}" in CONFIGURATOR_PRODUCTS`);
  }
  return product;
}

/** Extracts the ordered step ids for compact assertion. */
function getStepIds(product: ConfiguratorProduct): ReadonlyArray<ConfiguratorStepId> {
  return buildConfiguratorSteps(product).map((step) => step.id);
}

describe('buildConfiguratorSteps -- Studio-25 "no Overview" rule', () => {
  it(
    'omits "overview" and prepends "floor-plan" then "layout" for products with floorPlanVariants',
    () => {
      /* Studio-25 ships with both `floorPlanVariants` and
       * `layoutOptions`, so it exercises the full prefix path and the
       * Overview-replacement branch simultaneously. */
      const studio25 = getProductBySlug('studio-25');
      const stepIds = getStepIds(studio25);

      expect(stepIds).not.toContain('overview');
      expect(stepIds).toContain('floor-plan');
      expect(stepIds).toContain('layout');

      /* Order matters: the Floor Plan step must precede the Layout
       * step so the user picks a footprint before customising it. */
      const floorPlanIndex = stepIds.indexOf('floor-plan');
      const layoutIndex = stepIds.indexOf('layout');
      expect(floorPlanIndex).toBeGreaterThanOrEqual(0);
      expect(layoutIndex).toBe(floorPlanIndex + 1);
    },
  );

  it(
    'retains "overview" and omits "floor-plan" / "layout" for products without floorPlanVariants',
    () => {
      /* Compact-15 has neither `floorPlanVariants` nor a populated
       * `layoutOptions` array, so it represents the canonical
       * 5-step base sequence. */
      const compact15 = getProductBySlug('compact-15');
      const stepIds = getStepIds(compact15);

      expect(stepIds).toContain('overview');
      expect(stepIds).not.toContain('floor-plan');
      expect(stepIds).not.toContain('layout');
    },
  );
});
