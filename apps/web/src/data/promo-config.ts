/**
 * Promotional Campaign Configuration
 * =============================================================================
 *
 * PURPOSE:
 * Single, authoritative source for the site-wide promotional banner shown
 * immediately beneath the header. Marketing toggles the current campaign by
 * editing this file only — no component code changes are required.
 *
 * SCOPE:
 * This module governs the visibility and copy of the `PromoBanner` component.
 * It intentionally does NOT control the strikethrough price display on
 * `ProductRangeGrid`, `ProductShowcase`, or `ProductConfigurator`; those
 * surfaces expose their own `showOriginalPrice` props so banner and price
 * presentation remain independently switchable per plan §4.2.
 *
 * LIFECYCLE:
 * - Enable  : set `enabled: true` and populate `name` / `endsAt` (optionally
 *             `eyebrow`).
 * - Disable : set `enabled: false`. The `PromoBanner` will not mount and the
 *             banner subtree is eliminated from the rendered output.
 * - Expiry  : once `endsAt` has passed, the banner's countdown hook returns
 *             `null` on the client and the banner auto-hides without a deploy.
 *
 * =============================================================================
 */

/**
 * Configuration contract consumed by the promotional banner integration point
 * in `TemplateLayout`. All fields are read-only so the object is safe to share
 * across modules and cannot be mutated at runtime.
 */
export interface PromoConfig {
  /**
   * Master switch for the promotional banner only. When `false`, the
   * `PromoBanner` does not render. This flag does not influence strikethrough
   * price display anywhere else in the app.
   */
  readonly enabled: boolean;

  /**
   * Human-readable campaign name rendered inside the banner, for example
   * `"Spring Sale 2026"`.
   */
  readonly name: string;

  /**
   * ISO 8601 date-time string (including timezone offset) marking the exact
   * instant the campaign ends, for example `"2026-05-31T23:59:59+01:00"`.
   * The banner's live countdown targets this instant and auto-hides once the
   * remaining time reaches zero.
   */
  readonly endsAt: string;

  /**
   * Optional short eyebrow label rendered before the campaign name, for
   * example `"Limited time"`. Omit to hide the eyebrow slot.
   */
  readonly eyebrow?: string;
}

/**
 * Default-disabled promotional configuration.
 *
 * Placeholder values are supplied so the module is safe to import anywhere
 * without runtime errors. Keeping `enabled` set to `false` at rest ensures
 * the production bundle ships without an active campaign until Marketing
 * explicitly flips this constant for a launch.
 */
export const PROMO_CONFIG: PromoConfig = {
  enabled: false,
  name: 'Sale',
  endsAt: '2026-6-1T00:00:00+00:00',
  eyebrow: 'Limited time',
};
