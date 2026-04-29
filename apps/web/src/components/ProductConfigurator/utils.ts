/**
 * Product Configurator -- Utility Functions
 * =============================================================================
 *
 * PURPOSE:
 * Provides shared formatting and calculation utilities consumed by the
 * configurator component tree. All monetary values in the data model are
 * stored as integer cents (inclusive of VAT); these helpers convert cents
 * to display-ready euro strings using the Irish locale.
 *
 * =============================================================================
 */

import type {
  AddonOption,
  BathroomKitchenPolicy,
  ConfiguratorProduct,
  FloorPlanVariant,
  LayoutOption,
} from '../../types/configurator';
import type { ConfiguratorSelections } from './types';
import { DEFAULT_EXTERIOR_FINISH_NAME, DEFAULT_INTERIOR_FINISH_NAME } from './constants';


/* =============================================================================
   Bathroom & Kitchen Add-on Slug Allow-List
   -----------------------------------------------------------------------------
   The Bathroom & Kitchen feature is the only add-on whose availability is
   driven from the unified product schema rather than from manual data
   curation. Two slugs are reserved for this feature -- one per fixture --
   and any add-on carrying either slug is gated by the product's
   `bathroomKitchenPolicy` discriminated union (see
   `apps/web/src/types/garden-room.ts`).

   Centralising the slugs here keeps the filter contract self-documenting
   and prevents the runtime gate from drifting out of sync with the seed
   data (see specs/.docs/product-configurator-gotcha-tasks.md, T7).
   ============================================================================= */

/**
 * Reserved add-on slugs that map to the Bathroom & Kitchen feature.
 *
 * These slugs are recognised by `filterAddonsByPolicy` and are removed
 * from the visible add-on list when the product's policy is
 * `'not-available'`. Adding new fixture-specific slugs (for example,
 * `'wet-room'`) requires adding them to this tuple AND updating the
 * filter unit tests.
 */
export const BATHROOM_KITCHEN_ADDON_SLUGS: ReadonlyArray<string> = [
  'bathroom',
  'kitchen',
] as const;


/**
 * Formats a value in euro cents as a locale-aware currency string.
 *
 * Divides the cent value by 100 to produce euros, then formats using
 * the "en-IE" locale for correct thousands separators and currency
 * placement (e.g., 3_700_000 cents becomes "EUR37,000").
 *
 * @param cents - The monetary value in euro cents (integer).
 * @returns A formatted string prefixed with the euro sign (e.g., "EUR37,000").
 */
export function formatPriceCents(cents: number): string {
  const euros = cents / 100;
  return '\u20AC' + euros.toLocaleString('en-IE', { minimumFractionDigits: 0 });
}


/**
 * Calculates the total configured price in euro cents.
 *
 * Sums the product base price with the prices of all selected add-ons,
 * plus the optional price deltas from the selected floor plan variant
 * and interior layout option. The last four parameters are optional to
 * maintain backward compatibility with callers that do not yet support
 * floor plan or layout selection.
 *
 * @param basePriceCents             - The product's base price in euro cents.
 * @param allAddons                  - The complete list of available add-ons for this product.
 * @param selectedAddonIds           - Array of add-on IDs the customer has selected.
 * @param floorPlanVariants          - Optional array of floor plan variants for this product.
 * @param selectedFloorPlanVariantId - The selected floor plan variant ID, or null/undefined.
 * @param layoutOptions              - Optional array of layout options for this product.
 * @param selectedLayoutOptionId     - The selected layout option ID, or null/undefined.
 * @returns The total price in euro cents (base + add-ons + floor plan delta + layout delta).
 */
export function calculateTotalPriceCents(
  basePriceCents: number,
  allAddons: ReadonlyArray<AddonOption>,
  selectedAddonIds: ReadonlyArray<string>,
  floorPlanVariants?: ReadonlyArray<FloorPlanVariant>,
  selectedFloorPlanVariantId?: string | null,
  layoutOptions?: ReadonlyArray<LayoutOption>,
  selectedLayoutOptionId?: string | null,
): number {
  const addonTotal = allAddons
    .filter((addon) => selectedAddonIds.includes(addon.id))
    .reduce((sum, addon) => sum + addon.priceCentsInclVat, 0);

  /* Floor plan variant price delta (currently 0 for all Studio variants,
     but the field exists for future pricing differentiation). */
  const floorPlanDelta = floorPlanVariants
    ?.find((v) => v.id === selectedFloorPlanVariantId)
    ?.priceDeltaCentsInclVat ?? 0;

  /* Layout option price delta (Box = 0, En Suite = 1,200,000, Bedroom = 1,600,000). */
  const layoutDelta = layoutOptions
    ?.find((l) => l.id === selectedLayoutOptionId)
    ?.priceDeltaCentsInclVat ?? 0;

  return basePriceCents + addonTotal + floorPlanDelta + layoutDelta;
}


/**
 * Type-guard that resolves whether the configurator should render in
 * sale mode for a given pair of inputs.
 *
 * Sale rendering across the configurator surfaces (StickySubHeader,
 * Overview, Floor Plan, Layout, Summary) is gated by the same
 * dual-condition contract: the caller must have explicitly opted in
 * via `showOriginalPrice`, AND a numeric pre-sale original must be
 * available. Either missing piece collapses the UI back to the
 * default single-price layout.
 *
 * Centralising the gate as a helper -- rather than duplicating the
 * inline ternary at every consumer -- prevents the surfaces from
 * drifting out of sync when the contract evolves (e.g. if a future
 * sale flag is added to the policy). The function signature is a
 * type-guard (`originalCents is number`) so TypeScript narrows the
 * value at the call site, eliminating the need for a redundant
 * non-null assertion or a follow-up `!== undefined` check.
 *
 * Truth table:
 *
 *   showOriginalPrice  originalCents     result
 *   -----------------  ---------------   -------
 *   true               number            true
 *   true               undefined         false
 *   false              number            false
 *   false              undefined         false
 *
 * @param showOriginalPrice  - The caller's opt-in flag for strikethrough rendering.
 * @param originalCents      - The pre-sale total or base price in euro cents, if resolved.
 * @returns `true` only when both gates pass; narrows `originalCents` to `number`.
 */
export function isSaleModeActive(
  showOriginalPrice: boolean,
  originalCents: number | undefined,
): originalCents is number {
  return showOriginalPrice && originalCents !== undefined;
}


/**
 * Filters a product's add-ons against its Bathroom & Kitchen policy.
 *
 * The Bathroom & Kitchen feature has historically been enabled or
 * disabled by manual data curation in
 * `apps/web/src/data/configurator-products.ts`. This filter shifts the
 * gate from data-side curation to a runtime contract derived from the
 * canonical `bathroomKitchenPolicy` field, eliminating an entire class
 * of regression in which a future product accidentally exposes (or
 * duplicates) the B&K add-on.
 *
 * Behaviour
 * ---------
 * - When `policy === 'not-available'`, add-ons whose slug appears in
 *   `BATHROOM_KITCHEN_ADDON_SLUGS` are removed from the returned list.
 *   All other add-ons (e.g. triple-glazing, sauna-room) pass through
 *   unchanged.
 * - For every other policy value (`'optional-addon'`,
 *   `'layout-bundled'`, `'included'`) the input list is returned
 *   verbatim. The caller (or upstream UI) is responsible for visually
 *   communicating bundled or included status; this helper deliberately
 *   does not hide add-ons in those modes.
 *
 * The function is pure and runs in O(n) over the add-on list. It is
 * safe to invoke at every render site (display lists, total
 * calculation, submission slug builder) without memoisation.
 *
 * @param addons - The full add-on list as defined on the product.
 * @param policy - The product's bathroom & kitchen availability policy.
 * @returns A list of add-ons that should be exposed to the configurator
 *   UI and included in price calculations.
 */
export function filterAddonsByPolicy(
  addons: ReadonlyArray<AddonOption>,
  policy: BathroomKitchenPolicy,
): ReadonlyArray<AddonOption> {
  if (policy !== 'not-available') {
    /* The list passes through untouched. Returning the same reference
       (rather than `[...addons]`) preserves referential stability for
       downstream `useMemo` / `React.memo` consumers. */
    return addons;
  }

  return addons.filter(
    (addon) => !BATHROOM_KITCHEN_ADDON_SLUGS.includes(addon.slug),
  );
}


/**
 * Resolves the default finish option ID for a given category slug and
 * target finish name from the product's finish category definitions.
 *
 * Performs a case-insensitive comparison between the target name and
 * each option's display name within the matching category. Returns
 * null if the category or a matching option cannot be found, allowing
 * the caller to fall back gracefully.
 *
 * @param product      - The configurator product containing finish categories.
 * @param categorySlug - The category to search (e.g., "exterior" or "interior").
 * @param finishName   - The display name of the desired default finish.
 * @returns The matching finish option ID, or null if no match is found.
 */
export function resolveDefaultFinishId(
  product: ConfiguratorProduct,
  categorySlug: string,
  finishName: string,
): string | null {
  const category = product.finishCategories.find(
    (fc) => fc.slug === categorySlug,
  );
  if (!category) return null;

  const normalised = finishName.toLowerCase();
  const match = category.options.find(
    (opt) => opt.name.toLowerCase() === normalised,
  );

  return match?.id ?? null;
}


/**
 * Builds the initial configurator selections for a given product,
 * pre-populating the exterior and interior finish IDs with their
 * configured defaults. This ensures the configurator displays a
 * preview image on first load rather than showing an empty state.
 *
 * Default finish names are defined in constants.ts and resolved
 * against the product's finish categories at runtime. If no
 * matching option is found, the field remains null.
 *
 * @param product - The configurator product to build defaults for.
 * @returns A fully initialised ConfiguratorSelections object.
 */
export function buildDefaultSelections(
  product: ConfiguratorProduct,
): ConfiguratorSelections {
  /* Pre-select the first floor plan variant when the product offers
     multiple variants, ensuring the floor plan step displays an active
     selection on first load rather than an empty state. */
  const defaultFloorPlanVariantId =
    product.floorPlanVariants && product.floorPlanVariants.length > 0
      ? product.floorPlanVariants[0].id
      : null;

  /* Pre-select the first layout option when the product offers
     layout tiers, ensuring the layout step shows an active selection
     (e.g., "Box") on first load rather than requiring an explicit
     user click before proceeding. */
  const defaultLayoutOptionId =
    product.layoutOptions && product.layoutOptions.length > 0
      ? product.layoutOptions[0].id
      : null;

  return {
    floorPlanVariantId: defaultFloorPlanVariantId,
    layoutOptionId: defaultLayoutOptionId,
    exteriorFinishId: resolveDefaultFinishId(product, 'exterior', DEFAULT_EXTERIOR_FINISH_NAME),
    interiorFinishId: resolveDefaultFinishId(product, 'interior', DEFAULT_INTERIOR_FINISH_NAME),
    selectedAddonIds: [],
  };
}
