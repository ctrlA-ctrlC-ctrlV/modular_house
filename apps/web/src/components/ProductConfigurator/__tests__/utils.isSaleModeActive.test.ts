/**
 * utils.isSaleModeActive.test.ts
 *
 * Unit test for the `isSaleModeActive` type-guard introduced by the
 * configurator gotcha task list (T3, see
 * `.docs/product-configurator-gotcha-tasks.md`).
 *
 * The helper centralises the dual opt-in contract -- "explicit flag
 * AND resolvable numeric original" -- that gates strikethrough
 * rendering across the StickySubHeader, Overview, Floor Plan, Layout,
 * and Summary surfaces. The four-row truth table below pins the
 * contract so any future tweak to the gate logic must be expressed
 * through this single helper rather than diverging at each consumer.
 */

import { describe, it, expect } from 'vitest';
import { isSaleModeActive } from '../utils';

describe('isSaleModeActive -- dual-gate truth table', () => {
  /* The four rows below exhaust the cartesian product of the two
   * inputs. The narrowing semantics of the helper ensure that only
   * the (true, defined) combination unlocks sale rendering. */
  it.each([
    {
      caseName:           'opt-in flag set and original price defined',
      showOriginalPrice:  true,
      originalCents:      5_800_000 as number | undefined,
      expected:           true,
    },
    {
      caseName:           'opt-in flag set but original price missing',
      showOriginalPrice:  true,
      originalCents:      undefined as number | undefined,
      expected:           false,
    },
    {
      caseName:           'opt-in flag cleared but original price defined',
      showOriginalPrice:  false,
      originalCents:      5_800_000 as number | undefined,
      expected:           false,
    },
    {
      caseName:           'opt-in flag cleared and original price missing',
      showOriginalPrice:  false,
      originalCents:      undefined as number | undefined,
      expected:           false,
    },
  ])(
    'returns $expected when $caseName',
    ({ showOriginalPrice, originalCents, expected }) => {
      expect(isSaleModeActive(showOriginalPrice, originalCents)).toBe(expected);
    },
  );

  it('narrows the original price to `number` for the truthy branch', () => {
    /* This case exercises the type-guard signature: when the helper
     * returns `true`, TypeScript narrows the value to `number`,
     * allowing arithmetic without a non-null assertion. The runtime
     * assertion below proves the narrowed branch executes for the
     * (true, defined) input combination. */
    const original: number | undefined = 5_800_000;
    if (isSaleModeActive(true, original)) {
      /* Inside this block `original` is `number`, not `number | undefined`. */
      const doubled: number = original * 2;
      expect(doubled).toBe(11_600_000);
    } else {
      throw new Error('Expected isSaleModeActive to return true for (true, 5_800_000)');
    }
  });
});
