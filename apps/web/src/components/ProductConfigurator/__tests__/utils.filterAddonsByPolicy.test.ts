/**
 * utils.filterAddonsByPolicy.test.ts
 *
 * Unit and regression tests for the `filterAddonsByPolicy` helper
 * introduced by the configurator gotcha task list (T7, see
 * `.docs/product-configurator-gotcha-tasks.md`).
 *
 * The helper centralises the runtime gate that decides whether the
 * Bathroom & Kitchen add-on may be displayed and priced for a given
 * product. It replaces the previous data-side curation -- in which
 * each product's `addons` array had to manually omit B&K when the
 * policy was `'not-available'` -- with a single, type-safe contract
 * derived from `bathroomKitchenPolicy`.
 *
 * Coverage
 * --------
 * 1. Truth table across the four policy values, with a representative
 *    add-on list that contains one bathroom slug, one kitchen slug,
 *    and one unrelated slug (`'triple-glazing'`). Verifies that only
 *    the `'not-available'` policy strips B&K slugs.
 * 2. Regression assertion: for every seed product currently shipped,
 *    the filter must not change the visible add-on count. This
 *    guarantees that introducing the runtime gate cannot move the
 *    pre-existing total prices for any product in production.
 */

import { describe, it, expect } from 'vitest';
import type { Addon, BathroomKitchenPolicy } from '../../../types/garden-room';
import {
  BATHROOM_KITCHEN_ADDON_SLUGS,
  filterAddonsByPolicy,
} from '../utils';
import { CONFIGURATOR_PRODUCTS } from '../../../data/configurator-products';


/* ---------------------------------------------------------------------------
 * Test fixtures
 *
 * The fixture deliberately contains one add-on per reserved B&K slug
 * plus one unrelated add-on so that the truth-table assertions can
 * verify both removal and pass-through behaviour from a single input.
 * ------------------------------------------------------------------------- */

const FIXTURE_ADDONS: ReadonlyArray<Addon> = [
  {
    id: 'ao-fixture-bathroom',
    productId: 'cp-fixture',
    slug: 'bathroom',
    name: 'Bathroom Pod',
    description: 'Self-contained bathroom unit.',
    priceCentsInclVat: 500_000,
    iconId: 'plumbing',
    displayOrder: 1,
  },
  {
    id: 'ao-fixture-kitchen',
    productId: 'cp-fixture',
    slug: 'kitchen',
    name: 'Kitchen Pod',
    description: 'Self-contained kitchen unit.',
    priceCentsInclVat: 600_000,
    iconId: 'plumbing',
    displayOrder: 2,
  },
  {
    id: 'ao-fixture-triple-glazing',
    productId: 'cp-fixture',
    slug: 'triple-glazing',
    name: 'Triple Glazing Upgrade',
    description: 'Enhanced thermal and acoustic insulation.',
    priceCentsInclVat: 100_000,
    iconId: 'glazing',
    displayOrder: 3,
  },
];


describe('filterAddonsByPolicy -- (policy x addons) truth table', () => {
  /* The four cases below exhaustively cover the policy enum. The
     same fixture list is supplied for each case so the only varying
     input is the policy value, isolating the helper's branching
     behaviour. */
  it.each<{
    caseName: string;
    policy: BathroomKitchenPolicy;
    expectedSlugs: ReadonlyArray<string>;
  }>([
    {
      caseName:      'policy = not-available -- B&K slugs are removed',
      policy:        'not-available',
      expectedSlugs: ['triple-glazing'],
    },
    {
      caseName:      'policy = optional-addon -- list is unchanged',
      policy:        'optional-addon',
      expectedSlugs: ['bathroom', 'kitchen', 'triple-glazing'],
    },
    {
      caseName:      'policy = layout-bundled -- list is unchanged',
      policy:        'layout-bundled',
      expectedSlugs: ['bathroom', 'kitchen', 'triple-glazing'],
    },
    {
      caseName:      'policy = included -- list is unchanged',
      policy:        'included',
      expectedSlugs: ['bathroom', 'kitchen', 'triple-glazing'],
    },
  ])('$caseName', ({ policy, expectedSlugs }) => {
    const result = filterAddonsByPolicy(FIXTURE_ADDONS, policy);
    expect(result.map((a) => a.slug)).toEqual(expectedSlugs);
  });

  it('returns the input reference verbatim for non-restrictive policies', () => {
    /* Referential stability is exercised explicitly so downstream
       memoisation (e.g. `useMemo`, `React.memo`) can rely on the
       same array identity when the policy is permissive. */
    expect(filterAddonsByPolicy(FIXTURE_ADDONS, 'optional-addon'))
      .toBe(FIXTURE_ADDONS);
    expect(filterAddonsByPolicy(FIXTURE_ADDONS, 'layout-bundled'))
      .toBe(FIXTURE_ADDONS);
    expect(filterAddonsByPolicy(FIXTURE_ADDONS, 'included'))
      .toBe(FIXTURE_ADDONS);
  });

  it('returns an empty list when every add-on is a B&K slug under not-available', () => {
    /* Edge case: a product whose entire add-on list consists of
       reserved B&K slugs (and whose policy is `not-available`)
       collapses to an empty list. This proves the helper does not
       silently fall back to the input when the result would be
       empty. */
    const onlyBkAddons = FIXTURE_ADDONS.filter((a) =>
      BATHROOM_KITCHEN_ADDON_SLUGS.includes(a.slug),
    );
    expect(filterAddonsByPolicy(onlyBkAddons, 'not-available')).toEqual([]);
  });
});


describe('filterAddonsByPolicy -- regression safety against current seed data', () => {
  /* No currently shipped product carries a `'bathroom'` or `'kitchen'`
     add-on slug. Therefore applying the filter to every seed product
     must yield an add-on list of identical length, guaranteeing that
     this refactor cannot perturb any existing total price. */
  it.each(CONFIGURATOR_PRODUCTS.map((p) => [p.slug, p] as const))(
    'product "%s" -- add-on count is preserved',
    (_slug, product) => {
      const filtered = filterAddonsByPolicy(
        product.addons,
        product.bathroomKitchenPolicy,
      );
      expect(filtered.length).toBe(product.addons.length);
    },
  );
});
