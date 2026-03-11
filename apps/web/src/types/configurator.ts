/**
 * Configurator Product Data Model -- Type Definitions
 * =============================================================================
 *
 * PURPOSE:
 * Defines the TypeScript interfaces for the garden room product configurator.
 * These types describe the complete data shape required to render a multi-step
 * product configuration experience for any garden room size (15, 25, 35, 45 m2).
 *
 * ARCHITECTURE:
 * - ConfiguratorProduct is the root entity representing one configurable product.
 * - FinishOption and FinishCategory define selectable cladding and interior materials.
 * - AddonOption defines optional paid upgrades applied on top of the base price.
 * - ProductSpec captures key-value specification pairs for the overview step.
 * - ProductDimensions describes the physical envelope in metric units.
 * - Aperture and FloorPlanConfig provide structured data for floor plan SVG rendering.
 *
 * DESIGN PRINCIPLES:
 * - Open-Closed: New products, finishes, or addons can be added by appending
 *   data entries without modifying any existing interface definitions.
 * - Strict typing: all fields are explicitly typed with no use of `any`.
 * - Immutable data arrays: ReadonlyArray is used where constant data must
 *   not be mutated at runtime.
 *
 * RELATIONSHIP TO EXISTING TYPES:
 * - ProductCard and QuickViewProduct (from @modular-house/ui) describe the card
 *   and modal views on the /garden-room landing page.
 * - ConfiguratorProduct describes the detailed configuration page reached
 *   from those cards. Cross-referencing is done via the `slug` field.
 *
 * =============================================================================
 */


/* =============================================================================
   SECTION 1: FINISH CONFIGURATION
   -----------------------------------------------------------------------------
   Finish options model the selectable colour/material swatches that the user
   picks during the exterior and interior configurator steps. Each option
   carries two colour values: a primary swatch colour and an accent used for
   gradient rendering in the UI.
   ============================================================================= */

/**
 * A single selectable finish swatch (e.g., one cladding colour or interior
 * material). Rendered as a colour circle with a radial gradient from
 * `color` to `accent`.
 */
export interface FinishOption {
  /** Unique identifier used as the selection key (e.g., "black", "teak"). */
  id: string;
  /** Human-readable display name (e.g., "Black", "Teak"). */
  name: string;
  /** Primary hex colour for the swatch (e.g., "#1a1a1a"). */
  color: string;
  /** Secondary hex colour for the gradient accent (e.g., "#333"). */
  accent: string;
}

/**
 * A logical grouping of finish options presented as one configurator step.
 * Each category maps to a distinct step in the workflow (e.g., "Exterior",
 * "Interior"). The `sublabel` provides contextual copy displayed below
 * the step heading.
 */
export interface FinishCategory {
  /** Step identifier used for routing and state tracking (e.g., "exterior"). */
  id: string;
  /** Step heading displayed in the configurator (e.g., "Exterior Finish"). */
  label: string;
  /** Descriptive text displayed below the heading. */
  sublabel: string;
  /** Available finish choices within this category. */
  options: ReadonlyArray<FinishOption>;
}


/* =============================================================================
   SECTION 2: ADD-ON CONFIGURATION
   -----------------------------------------------------------------------------
   Add-on options represent optional paid upgrades that increase the total
   price beyond the base. Each add-on has a unique identifier, display copy,
   a price delta, and a semantic icon identifier (not an emoji) that the
   UI layer resolves to an SVG icon or component.
   ============================================================================= */

/**
 * Semantic icon identifiers for add-on rendering. Maps to SVG icons or
 * icon components in the UI layer. New icons should be appended here
 * when new add-on types are introduced.
 */
export type AddonIconId =
  | 'plumbing'
  | 'glazing'
  | 'decking'
  | 'heating'
  | 'solar'
  | 'security';

/**
 * An optional paid upgrade that the customer can toggle on or off.
 * The `price` represents the incremental cost added to the base price.
 * Prices are per-product (the same add-on type may cost differently
 * depending on the product size).
 */
export interface AddonOption {
  /** Unique add-on identifier (e.g., "bathroom-kitchen"). */
  id: string;
  /** Human-readable add-on name (e.g., "Bathroom + Kitchen"). */
  name: string;
  /** Brief description of what the add-on includes. */
  description: string;
  /** Incremental cost in euros, excluding VAT. */
  price: number;
  /** Semantic icon identifier resolved to a visual by the UI layer. */
  iconId: AddonIconId;
}


/* =============================================================================
   SECTION 3: PRODUCT SPECIFICATIONS
   -----------------------------------------------------------------------------
   Specification items are displayed as a grid of key-value pairs on the
   product overview step. They describe what is included in the base
   configuration before any user selections or add-ons.
   ============================================================================= */

/**
 * A single key-value specification line displayed in the "What's Included"
 * grid on the overview step.
 */
export interface ProductSpec {
  /** Specification label (e.g., "Dimensions", "Insulation"). */
  label: string;
  /** Specification value (e.g., "5.0m x 3.0m", "120mm PIR"). */
  value: string;
}


/* =============================================================================
   SECTION 4: PHYSICAL DIMENSIONS
   -----------------------------------------------------------------------------
   Captures the external and internal dimensional data for one product.
   All measurements use metric units. The width and depth represent the
   external footprint; the internal height is the usable ceiling clearance.
   ============================================================================= */

/**
 * Physical dimensional data for one garden room model.
 * Used for specification display, floor plan rendering, and dimension labels.
 */
export interface ProductDimensions {
  /** External width in metres (e.g., 5.0). */
  widthM: number;
  /** External depth in metres (e.g., 3.0). */
  depthM: number;
  /** Internal ceiling height in metres (e.g., 2.7). */
  heightM: number;
  /** Total floor area in square metres (e.g., 15). */
  areaM2: number;
}


/* =============================================================================
   SECTION 5: FLOOR PLAN CONFIGURATION
   -----------------------------------------------------------------------------
   Provides structured data for the SVG floor plan component. Each product
   has a set of apertures (windows, doors) placed on specific walls, plus
   display labels for the dimension annotations.

   Wall positions use compass directions viewed from above:
   - north: top wall (front-facing)
   - east:  right wall
   - south: bottom wall (rear)
   - west:  left wall
   ============================================================================= */

/**
 * Cardinal wall positions on the floor plan, viewed from above.
 * Used to place apertures (windows, doors) on the correct wall segment.
 */
export type WallPosition = 'north' | 'east' | 'south' | 'west';

/**
 * Aperture type identifiers representing different glazing unit styles.
 * The floor plan SVG renderer uses these to select the correct visual
 * representation (opening arc for doors, cross-hatch for windows, etc.).
 */
export type ApertureType =
  | 'tilt-turn-window'
  | 'french-door'
  | 'sliding-door'
  | 'fixed-glazing';

/**
 * A single glazing aperture placed on one wall of the floor plan.
 * Contains physical dimensions (in millimetres) and placement data.
 */
export interface Aperture {
  /** Glazing unit type, determines visual rendering style. */
  type: ApertureType;
  /** Wall on which this aperture is placed. */
  wall: WallPosition;
  /** Physical width of the aperture in millimetres. */
  widthMm: number;
  /** Physical height of the aperture in millimetres. */
  heightMm: number;
}

/**
 * Complete floor plan rendering configuration for one product.
 * Combines the aperture layout with formatted dimension labels
 * for the SVG annotation text.
 */
export interface FloorPlanConfig {
  /** Ordered list of glazing apertures to render on the floor plan. */
  apertures: ReadonlyArray<Aperture>;
  /** Pre-formatted dimension label strings for SVG annotation. */
  dimensionLabels: {
    /** Horizontal dimension display string (e.g., "5.0m"). */
    width: string;
    /** Vertical dimension display string (e.g., "3.0m"). */
    depth: string;
  };
}


/* =============================================================================
   SECTION 6: PRODUCT IMAGE SET
   -----------------------------------------------------------------------------
   Defines the multi-format image set for a product. Follows the progressive
   enhancement pattern: AVIF (smallest, best quality) -> WebP -> PNG fallback.
   Same convention used by ProductCard and QuickViewProduct in @modular-house/ui.
   ============================================================================= */

/**
 * Multi-format image paths for a product. Browsers select the optimal
 * format via the <picture> element's <source> tags.
 */
export interface ProductImageSet {
  /** Primary image path (PNG/JPEG fallback). Always required. */
  src: string;
  /** WebP optimised variant for modern browsers. */
  webP?: string;
  /** AVIF optimised variant for maximum compression. */
  avif?: string;
  /** Descriptive alt text for accessibility. */
  alt: string;
}


/* =============================================================================
   SECTION 7: MAIN CONFIGURATOR PRODUCT
   -----------------------------------------------------------------------------
   The root entity binding all configuration data for one garden room product.
   A complete ConfiguratorProduct provides everything the multi-step
   configurator page needs to render: identity, pricing, specifications,
   selectable finishes, add-ons, floor plan data, and imagery.

   Each of the four garden room sizes (15, 25, 35, 45 m2) is represented
   by one ConfiguratorProduct instance. The page component consumes this
   data to render a fully templated configurator without any hard-coded
   product-specific values.
   ============================================================================= */

/**
 * Complete data definition for one configurable garden room product.
 *
 * This is the root data type consumed by the product configurator page.
 * It composes identity, pricing, configuration options, specifications,
 * floor plan, and availability data into a single cohesive entity.
 *
 * To add a new product size, create a new ConfiguratorProduct object
 * conforming to this interface and append it to the products array.
 * No existing code needs modification (Open-Closed Principle).
 */
export interface ConfiguratorProduct {
  /* --- Identity ----------------------------------------------- */

  /** URL-safe slug used for routing and query parameters (e.g., "compact-15"). */
  slug: string;
  /** Marketing name displayed as the configurator heading (e.g., "The Compact"). */
  name: string;
  /** Short tagline displayed below the heading on the overview step. */
  tagline: string;

  /* --- Physical ----------------------------------------------- */

  /** External and internal dimensions of the garden room. */
  dimensions: ProductDimensions;

  /* --- Pricing ------------------------------------------------ */

  /**
   * Base price in euros, excluding VAT.
   * The total configured price is calculated as:
   *   basePrice + sum(selected addon prices)
   */
  basePrice: number;
  /** Regulatory pricing note displayed below the total (e.g., "VAT not included"). */
  pricingNote: string;

  /* --- Configuration Options ---------------------------------- */

  /**
   * Ordered list of finish categories forming the configurator steps.
   * Typically two entries: exterior cladding and interior wall finish.
   * Additional categories (e.g., flooring) can be appended without
   * modifying the configurator component logic.
   */
  finishCategories: ReadonlyArray<FinishCategory>;

  /**
   * Available add-on upgrades with per-product pricing.
   * Each product may offer different add-ons or different prices
   * for the same add-on type, depending on the room size.
   */
  addons: ReadonlyArray<AddonOption>;

  /* --- Specifications ----------------------------------------- */

  /**
   * Key-value specification pairs displayed on the overview step.
   * Describes what is included in the base configuration.
   */
  specs: ReadonlyArray<ProductSpec>;

  /** Detailed glazing description displayed as a footnote on the overview step. */
  glazingNote: string;

  /* --- Floor Plan --------------------------------------------- */

  /** Structured data for the SVG floor plan rendering component. */
  floorPlan: FloorPlanConfig;

  /* --- Imagery ------------------------------------------------ */

  /** Multi-format product image set for the configurator hero area. */
  image: ProductImageSet;

  /* --- Availability ------------------------------------------- */

  /** Whether the product is currently orderable (false = "Coming Soon"). */
  available: boolean;
  /** Whether planning permission is required for this size. */
  planningPermission: boolean;
  /** Estimated delivery timeline from order to handover (e.g., "6-8 weeks"). */
  leadTime: string;
}
