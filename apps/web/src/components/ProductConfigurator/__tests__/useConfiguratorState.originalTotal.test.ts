/**
 * useConfiguratorState.originalTotal.test.ts
 *
 * Integration test for the promotional "original total" pricing logic
 * introduced by feature 011-sales-discount (see specs/011-sales-discount/
 * plan.md §5.3 and tasks.md T3.4).
 *
 * Scope
 * -----
 * This test exercises the Studio 25 product end-to-end at the hook
 * boundary: it renders `useConfiguratorState` with the real seed data,
 * switches through every layout option (Box / En Suite / Bedroom) via
 * the hook's `setLayoutOption` action, and asserts that both the live
 * total and the pre-sale original total track their respective base
 * prices plus the shared layout price delta.
 *
 * Why an integration-style test?
 * ------------------------------
 * The value proposition of `originalTotalPriceCents` is specifically
 * that it mirrors the live total's delta pipeline (add-ons, floor-plan
 * variants, layout options). Exercising the hook -- rather than a
 * smaller pure helper -- ensures the wiring between
 * `originalPriceCentsInclVatByLayoutId`, the calculator utility, and
 * the exposed hook return remains intact if any single file in that
 * chain is edited in isolation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useConfiguratorState } from '../useConfiguratorState';
import { CONFIGURATOR_PRODUCTS } from '../../../data/configurator-products';
import type { ConfiguratorProduct } from '../../../types/configurator';

/* ---------------------------------------------------------------------------
 * Fixture lookup
 * ---------------------------------------------------------------------------
 * Resolve the Studio 25 product from the real seed array. A missing
 * record indicates a breaking change to the fixture data; failing fast
 * here is preferable to a confusing `undefined` at a later assertion. */
function getStudio25Product(): ConfiguratorProduct {
  const product = CONFIGURATOR_PRODUCTS.find((p) => p.slug === 'studio-25');
  if (!product) {
    throw new Error('Expected Studio 25 product (slug="studio-25") in CONFIGURATOR_PRODUCTS');
  }
  return product;
}

/* ---------------------------------------------------------------------------
 * Expected constants mirrored from the fixture
 * ---------------------------------------------------------------------------
 * These values intentionally duplicate the seed data. Duplication is
 * deliberate: if someone edits either the fixture or the calculator
 * in isolation this test will flag the drift rather than silently pass
 * by reading the same number from both sides of the equation. */

/** Live (sale) base price in euro cents incl. VAT. */
const LIVE_BASE_CENTS = 3_950_000;

/** Layout IDs exposed by the Studio 25 product. */
const LAYOUT_BOX_ID       = 'lo-studio-box';
const LAYOUT_EN_SUITE_ID  = 'lo-studio-en-suite';
const LAYOUT_BEDROOM_ID   = 'lo-studio-bedroom';

/** Pre-sale "original" bases, keyed by layout id (mirrors fixture §5.3.1). */
const ORIGINAL_BASE_BY_LAYOUT: Record<string, number> = {
  [LAYOUT_BOX_ID]:      5_800_000,
  [LAYOUT_EN_SUITE_ID]: 6_600_000,
  [LAYOUT_BEDROOM_ID]:  6_800_000,
};

/** Layout price deltas applied to both the live and original totals. */
const LAYOUT_DELTA_BY_ID: Record<string, number> = {
  [LAYOUT_BOX_ID]:              0,
  [LAYOUT_EN_SUITE_ID]: 1_200_000,
  [LAYOUT_BEDROOM_ID]:  1_400_000,
};


describe('useConfiguratorState -- original total across Studio 25 layouts', () => {
  /* `useConfiguratorState` persists to `sessionStorage`, so clear it
   * before every case to guarantee a clean default-selection starting
   * point regardless of test ordering. */
  beforeEach(() => {
    sessionStorage.clear();
  });

  it.each([
    { layoutId: LAYOUT_BOX_ID,      label: 'Box'      },
    { layoutId: LAYOUT_EN_SUITE_ID, label: 'En Suite' },
    { layoutId: LAYOUT_BEDROOM_ID,  label: 'Bedroom'  },
  ])(
    'tracks both live and original totals for the $label layout',
    ({ layoutId }) => {
      const product = getStudio25Product();
      const { result } = renderHook(() => useConfiguratorState(product));

      /* Switch into the target layout. `setLayoutOption` is the same
       * action the configurator UI dispatches on click, so exercising
       * it directly matches the production state transition. */
      act(() => {
        result.current.setLayoutOption(layoutId);
      });

      /* Addons default to none, and the floor-plan variant defaults to
       * a zero-delta 5x5 footprint, so the only non-base contributor
       * to the total is the layout delta. Under those conditions both
       * totals collapse to `base + layoutDelta`. */
      const layoutDelta        = LAYOUT_DELTA_BY_ID[layoutId] ?? 0;
      const expectedLiveTotal  = LIVE_BASE_CENTS + layoutDelta;
      const expectedOriginal   = ORIGINAL_BASE_BY_LAYOUT[layoutId]! + layoutDelta;

      expect(result.current.selections.layoutOptionId).toBe(layoutId);
      expect(result.current.totalPriceCents).toBe(expectedLiveTotal);
      expect(result.current.originalTotalPriceCents).toBe(expectedOriginal);

      /* The strikethrough is only meaningful when the original strictly
       * exceeds the live total -- this invariant is what makes the UI
       * treatment worth rendering at all. */
      expect(result.current.originalTotalPriceCents).toBeGreaterThan(
        result.current.totalPriceCents,
      );
    },
  );

  it('applies the same add-on delta to both live and original totals', () => {
    /* Exercises the shared calculator path: swapping an add-on should
     * shift the live and original totals by exactly the same amount,
     * preserving the saving between them. */
    const product = getStudio25Product();
    const { result } = renderHook(() => useConfiguratorState(product));

    act(() => {
      result.current.setLayoutOption(LAYOUT_EN_SUITE_ID);
    });

    const liveBefore     = result.current.totalPriceCents;
    const originalBefore = result.current.originalTotalPriceCents;
    expect(originalBefore).toBeDefined();

    /* Pick the first available add-on deterministically. Its precise
     * price does not matter for this assertion -- only that the delta
     * is applied identically to both totals. */
    const firstAddon = product.addons[0];
    if (!firstAddon) {
      throw new Error('Studio 25 fixture expected to expose at least one add-on');
    }

    act(() => {
      result.current.toggleAddon(firstAddon.id);
    });

    const liveAfter     = result.current.totalPriceCents;
    const originalAfter = result.current.originalTotalPriceCents;
    expect(originalAfter).toBeDefined();

    expect(liveAfter - liveBefore).toBe(firstAddon.priceCentsInclVat);
    expect((originalAfter as number) - (originalBefore as number)).toBe(
      firstAddon.priceCentsInclVat,
    );
  });
});
