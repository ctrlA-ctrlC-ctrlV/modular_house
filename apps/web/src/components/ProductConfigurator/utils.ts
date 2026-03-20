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

import type { AddonOption, FloorPlanVariant, LayoutOption } from '../../types/configurator';


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
