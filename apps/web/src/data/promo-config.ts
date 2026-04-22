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
 * Active promotional configuration.
 *
 * This constant is the single runtime switch that enables or disables the
 * site-wide `PromoBanner`. Enabling the banner pushes a `promo_banner_view`
 * event onto the GTM `dataLayer` on every mount for downstream GA4
 * attribution. `endsAt` uses the Irish local timezone offset (`+01:00`
 * during Irish Summer Time) so the countdown reaches zero at midnight local
 * time on the campaign's final day.
 */
export const PROMO_CONFIG: PromoConfig = {
  enabled: true,
  name: '2026 Spring Sale',
  endsAt: '2026-05-31T23:59:59+01:00',
  eyebrow: 'Limited time',
};

/* =============================================================================
   DEVELOPMENT-ONLY STALE CONFIGURATION GUARD
   =============================================================================

   Emits a single `console.warn` at module load time when a developer boots
   the Vite dev server with `enabled: true` but an `endsAt` that has already
   elapsed. The warning is an early-feedback signal that the campaign copy in
   this file is stale relative to the current system clock — a state that
   would otherwise manifest only at runtime as a mysteriously absent banner.

   The check is gated by `import.meta.env.DEV` so it is tree-shaken out of
   production builds, and by a module-scoped flag so the warning is emitted
   at most once per process even if the module graph is re-evaluated by HMR.
*/

let hasWarnedStaleEndsAt = false;

if (import.meta.env.DEV && PROMO_CONFIG.enabled && !hasWarnedStaleEndsAt) {
  const endsAtMs = new Date(PROMO_CONFIG.endsAt).getTime();
  if (Number.isFinite(endsAtMs) && endsAtMs <= Date.now()) {
    hasWarnedStaleEndsAt = true;
    // eslint-disable-next-line no-console
    console.warn(
      `[promo-config] PROMO_CONFIG.enabled is true but endsAt (${PROMO_CONFIG.endsAt}) is in the past. ` +
        'The PromoBanner will not render on the client. ' +
        'Update apps/web/src/data/promo-config.ts to disable the campaign or extend endsAt.',
    );
  }
}
