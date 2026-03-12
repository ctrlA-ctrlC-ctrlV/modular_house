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

import type { AddonOption } from '../../types/configurator';


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
 * Sums the product base price with the prices of all selected add-ons.
 * The addon array is filtered by the provided set of selected IDs to
 * avoid scanning the full addon catalogue.
 *
 * @param basePriceCents - The product's base price in euro cents.
 * @param allAddons      - The complete list of available add-ons for this product.
 * @param selectedIds    - Array of add-on IDs the customer has selected.
 * @returns The total price in euro cents (base + selected add-ons).
 */
export function calculateTotalPriceCents(
  basePriceCents: number,
  allAddons: ReadonlyArray<AddonOption>,
  selectedIds: ReadonlyArray<string>,
): number {
  const addonTotal = allAddons
    .filter((addon) => selectedIds.includes(addon.id))
    .reduce((sum, addon) => sum + addon.priceCentsInclVat, 0);

  return basePriceCents + addonTotal;
}
