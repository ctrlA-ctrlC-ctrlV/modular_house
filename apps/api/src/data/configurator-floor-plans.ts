/**
 * Configurator Floor Plan Resolver -- API-Side Asset Lookup
 * =============================================================================
 *
 * PURPOSE:
 * Resolves a configurator selection (product slug, optional floor plan
 * variant slug, optional layout slug) into a concrete SVG floor plan
 * filename that can be loaded from disk and attached to the internal
 * notification email.
 *
 * DESIGN DECISIONS:
 * - The lookup is intentionally a pure data structure rather than a chain
 *   of conditionals. Adding a new product, variant, or layout requires
 *   only a single entry change (Open-Closed Principle).
 * - Filenames mirror the canonical assets located in
 *   `apps/web/public/resource/floorplan/`. The directory is configurable
 *   via the FLOORPLAN_ASSETS_DIR environment variable so the API
 *   container can resolve the assets independently of the web app.
 * - Returns `null` instead of throwing when no floor plan is available
 *   so the calling email pipeline can degrade gracefully.
 *
 * MAINTENANCE:
 * Keep this file in sync with the floor plan definitions in
 * `apps/web/src/data/configurator-products.ts`. When new product
 * variants are introduced, add the corresponding mapping below and
 * ensure the SVG asset is shipped with the API image (see Dockerfile).
 *
 * =============================================================================
 */


/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   ============================================================================= */

/**
 * Per-variant mapping describing the available SVG filenames.
 *
 * - `defaultFile` is used when no layout slug is supplied or when the
 *   supplied layout does not exist in `byLayout`.
 * - `byLayout` maps layout slugs (e.g. "box", "en-suite", "bedroom")
 *   to SVG filenames. It is optional because not every product offers
 *   layout variations.
 */
interface FloorPlanVariantAssets {
  readonly defaultFile: string;
  readonly byLayout?: Readonly<Record<string, string>>;
}

/**
 * Per-product mapping. A product either exposes a single fixed floor
 * plan via `defaultFile`, or a set of variants keyed by variant slug
 * (e.g. "5x5", "4x6"). Variants take precedence when the variant slug
 * is supplied at lookup time.
 */
interface ProductFloorPlanAssets {
  readonly defaultFile?: string;
  readonly byLayout?: Readonly<Record<string, string>>;
  readonly variants?: Readonly<Record<string, FloorPlanVariantAssets>>;
}


/* =============================================================================
   SECTION 2: PRODUCT FLOOR PLAN LOOKUP TABLE
   -----------------------------------------------------------------------------
   Mirrors the floor plan asset paths defined in the frontend product
   catalogue. Keys are the values stored in
   `Customer.configuratorProductSlug`.
   ============================================================================= */

/**
 * Maps a product slug to its available floor plan assets. The structure
 * accommodates products with a single fixed floor plan, products with
 * floor plan size variants, and variants that further support multiple
 * interior layouts.
 */
const FLOOR_PLAN_ASSETS: Readonly<Record<string, ProductFloorPlanAssets>> = {
  'compact-15': {
    defaultFile: '3m-x-5m.svg',
  },
  'studio-25': {
    variants: {
      '5x5': {
        defaultFile: '5m-x-5m-box.svg',
        byLayout: {
          'box':      '5m-x-5m-box.svg',
          'en-suite': '5m-x-5m-ensuit.svg',
          'bedroom':  '5m-x-5m-bedroom.svg',
        },
      },
      '4x6': {
        defaultFile: '6m-x-4.15m-box.svg',
        byLayout: {
          'box':      '6m-x-4.15m-box.svg',
          'en-suite': '6m-x-4.15m-ensuit.svg',
          'bedroom':  '6m-x-4.15m-bedroom.svg',
        },
      },
    },
  },
  'living-35': {
    defaultFile: '7m-x-5m-bedroom.svg',
  },
  'grand-45': {
    variants: {
      '9x5':  { defaultFile: '9m-x-5m.svg' },
      '7.5x6': { defaultFile: '7.5m-x-6m.svg' },
    },
  },
};


/* =============================================================================
   SECTION 3: PUBLIC RESOLVER API
   ============================================================================= */

/**
 * Resolves the floor plan SVG filename for a given configurator
 * selection. The resolution order is:
 *
 * 1. If the product exposes variants and a matching variant slug is
 *    supplied, the variant's `byLayout` mapping is consulted (using
 *    the layout slug) before falling back to the variant's
 *    `defaultFile`.
 * 2. Otherwise, the product-level `byLayout` mapping is consulted
 *    (when present), falling back to the product-level `defaultFile`.
 * 3. If no asset can be resolved, returns `null`.
 *
 * @param productSlug - Product slug stored on the customer record.
 * @param variantSlug - Optional floor plan variant slug
 *                      (e.g. "5x5", "4x6").
 * @param layoutSlug  - Optional layout slug
 *                      (e.g. "box", "en-suite", "bedroom").
 * @returns The SVG filename (without directory) or `null` when no
 *          asset is available.
 */
export function resolveFloorPlanFilename(
  productSlug: string | undefined,
  variantSlug: string | undefined,
  layoutSlug: string | undefined,
): string | null {
  if (!productSlug) return null;

  const product = FLOOR_PLAN_ASSETS[productSlug];
  if (!product) return null;

  // Variant-level resolution takes precedence when the product offers
  // floor plan variants and the caller supplied a variant slug.
  if (variantSlug && product.variants) {
    const variant = product.variants[variantSlug];
    if (variant) {
      if (layoutSlug && variant.byLayout?.[layoutSlug]) {
        return variant.byLayout[layoutSlug];
      }
      return variant.defaultFile;
    }
  }

  // Fall back to product-level layout / default mappings.
  if (layoutSlug && product.byLayout?.[layoutSlug]) {
    return product.byLayout[layoutSlug];
  }

  return product.defaultFile ?? null;
}
