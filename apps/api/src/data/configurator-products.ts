/**
 * Configurator Product Lookup Data -- API-Side Reference
 * =============================================================================
 *
 * PURPOSE:
 * Provides a lightweight lookup table for resolving configurator product
 * slugs and addon slugs into display-ready values (names, dimensions,
 * prices) required by the email template builders. This data mirrors the
 * canonical product definitions in the frontend
 * (apps/web/src/data/configurator-products.ts) but contains only the
 * subset of fields needed for email rendering.
 *
 * WHY NOT IMPORT FROM THE FRONTEND?
 * The frontend product data lives in a separate workspace (apps/web) and
 * carries React-specific types. Duplicating the minimal set of fields
 * here avoids a cross-workspace dependency and keeps the API build
 * self-contained.
 *
 * MAINTENANCE:
 * When product offerings change (new sizes, renamed addons, price
 * adjustments), this file must be updated in lockstep with the frontend
 * data file. Once the database-driven product catalogue is implemented,
 * this static lookup will be replaced by a database query.
 *
 * =============================================================================
 */


/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   ============================================================================= */

/** Display-ready addon metadata keyed by addon slug within a product. */
interface AddonLookup {
  readonly name: string;
  readonly priceCents: number;
}

/** Minimal product metadata needed for email template rendering. */
interface ProductEmailData {
  readonly name: string;
  readonly dimensions: string;
  readonly area: string;
  /** Addon slug -> display name and price lookup. */
  readonly addons: Readonly<Record<string, AddonLookup>>;
}


/* =============================================================================
   SECTION 2: PRODUCT LOOKUP TABLE
   -----------------------------------------------------------------------------
   Keyed by product slug (matching the value stored in
   Customer.configuratorProductSlug). Each entry contains the display name,
   formatted dimension string, area label, and a nested addon lookup map.
   ============================================================================= */

/**
 * Maps product slugs to the email-relevant display data.
 * Used by the submission service when building configurator email payloads.
 */
export const CONFIGURATOR_PRODUCT_LOOKUP: Readonly<Record<string, ProductEmailData>> = {
  'compact-15': {
    name: 'The Compact',
    dimensions: '5.0m x 3.0m',
    area: '15',
    addons: {
      'triple-glazing': { name: 'Triple Glazing Upgrade', priceCents: 80_000 },
      'composite-decking': { name: 'Composite Decking Step', priceCents: 15_000 },
    },
  },
  'studio-25': {
    name: 'The Studio',
    dimensions: '5.0m x 5.0m',
    area: '25',
    addons: {
      'bathroom-kitchen': { name: 'Bathroom + Kitchen', priceCents: 1_000_000 },
      'triple-glazing': { name: 'Triple Glazing Upgrade', priceCents: 100_000 },
      'composite-decking': { name: 'Composite Decking Step', priceCents: 20_000 },
    },
  },
  'living-35': {
    name: 'The Living',
    dimensions: '7.0m x 5.0m',
    area: '35',
    addons: {
      'triple-glazing': { name: 'Triple Glazing Upgrade', priceCents: 150_000 },
      'composite-decking': { name: 'Composite Decking Step', priceCents: 25_000 },
    },
  },
  'grand-45': {
    name: 'The Grand',
    dimensions: '9.0m x 5.0m',
    area: '45',
    addons: {
      'triple-glazing': { name: 'Triple Glazing Upgrade', priceCents: 200_000 },
      'composite-decking': { name: 'Composite Decking Step', priceCents: 30_000 },
    },
  },
};
