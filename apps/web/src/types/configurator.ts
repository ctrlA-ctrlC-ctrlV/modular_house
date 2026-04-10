/**
 * Configurator Product Data Model -- Compatibility Re-export Layer
 * =============================================================================
 *
 * PURPOSE:
 * This file serves as a backward-compatible bridge between the legacy
 * configurator type system and the unified garden room data model defined
 * in `./garden-room.ts`. Downstream components that previously imported
 * from this file continue to compile without modification, while the
 * canonical type definitions now live in the unified schema.
 *
 * MIGRATION STATUS:
 * - Canonical types (Product, Addon, FootprintVariant, FinishOption, etc.)
 *   are re-exported from `./garden-room.ts`.
 * - Legacy type aliases (ConfiguratorProduct, AddonOption, FloorPlanVariant)
 *   map to their unified equivalents so existing import sites compile.
 * - Floor plan rendering types (Aperture, FloorPlanConfig, WallPosition,
 *   ApertureType) are retained here because the FloorPlan SVG renderer
 *   still requires them and they are intentionally excluded from the
 *   unified schema (the floor plan feature is retired from the data model
 *   but the renderer component has not yet been removed).
 *
 * CONSUMERS:
 * All ProductConfigurator components import from this file. Once those
 * components are updated to import directly from `./garden-room.ts`,
 * this compatibility layer can be deleted.
 *
 * =============================================================================
 */


/* ---------------------------------------------------------------------------
 * RE-EXPORTS FROM THE UNIFIED SCHEMA
 * ---------------------------------------------------------------------------
 * These types are the canonical definitions. They are re-exported here
 * under their original names so that existing import statements in
 * configurator components resolve without modification.
 * ------------------------------------------------------------------------- */

export type {
  /* Enums and literal types */
  BathroomKitchenPolicy,

  /* Core product types */
  Product,
  HydratedProduct,
  ProductDimensions,
  ProductImage,

  /* Product children */
  ProductSpec,
  ProductUseCase,
  FootprintVariant,
  LayoutOption,
  Addon,
  IncludedFeature,
  FinishCategory,
  HydratedFinishCategory,
  FinishOption,

  /* Product-line-wide */
  StandardFeature,
  WarrantyCoverage,
  GlazingDetail,

  /* Marketing page */
  SellingPoint,
  FAQ,
  Testimonial,
  GalleryImage,
  ComparisonCategory,
  ComparisonMethodData,

  /* Session / order */
  ConfiguratorSelection,
} from './garden-room';

import type {
  HydratedProduct,
  Addon,
  FootprintVariant,
  ProductImage,
} from './garden-room';


/* ---------------------------------------------------------------------------
 * LEGACY TYPE ALIASES
 * ---------------------------------------------------------------------------
 * These aliases preserve backward compatibility for consuming code that
 * references the old type names. Each alias maps 1:1 to a unified schema
 * type. New code should import the canonical names from `./garden-room.ts`
 * directly.
 * ------------------------------------------------------------------------- */

/**
 * Legacy alias for the unified `HydratedProduct` interface.
 *
 * The original ConfiguratorProduct combined both the flat product row and
 * its relational children (addons, specs, finishes, etc.) into a single
 * interface. The unified schema splits this into `Product` (flat row) and
 * `HydratedProduct` (with eagerly-loaded children). ConfiguratorProduct
 * maps to HydratedProduct because all existing consumers expect the full
 * object graph with children attached.
 *
 * @deprecated Import `HydratedProduct` from `../types/garden-room` instead.
 */
export type ConfiguratorProduct = HydratedProduct;

/**
 * Legacy alias for the unified `Addon` interface.
 *
 * Renamed from AddonOption to Addon in the unified schema to align with
 * the database table name and reduce verbosity. The interface shape is
 * identical.
 *
 * @deprecated Import `Addon` from `../types/garden-room` instead.
 */
export type AddonOption = Addon;

/**
 * Legacy alias for the unified `FootprintVariant` interface.
 *
 * Renamed from FloorPlanVariant to FootprintVariant in the unified schema
 * because the floor plan rendering feature has been retired. The variant
 * now carries only dimensional and pricing data, not floor plan imagery
 * or rendering metadata.
 *
 * @deprecated Import `FootprintVariant` from `../types/garden-room` instead.
 */
export type FloorPlanVariant = FootprintVariant;

/**
 * Legacy alias for the unified `ProductImage` interface.
 *
 * Renamed from ProductImageSet to ProductImage in the unified schema.
 * The unified version requires `webP` and `avif` fields (non-optional)
 * and adds `id`, `productId`, `role`, and `displayOrder` fields for
 * database normalisation.
 *
 * @deprecated Import `ProductImage` from `../types/garden-room` instead.
 */
export type ProductImageSet = ProductImage;

/**
 * Legacy semantic icon identifier type for add-on rendering.
 *
 * The unified schema uses a plain `string` type for `Addon.iconId`
 * because new icon identifiers should not require a type definition
 * change. This alias preserves the narrower union for existing
 * consumers that reference AddonIconId by name.
 *
 * @deprecated Use `string` or import `Addon['iconId']` instead.
 */
export type AddonIconId =
  | 'plumbing'
  | 'glazing'
  | 'decking'
  | 'heating'
  | 'solar'
  | 'security'
  | 'sauna';


/* ---------------------------------------------------------------------------
 * RETAINED LEGACY TYPES: FLOOR PLAN RENDERER
 * ---------------------------------------------------------------------------
 * The following types support the programmatic FloorPlan SVG rendering
 * component (`ProductConfigurator/FloorPlan.tsx`). They are intentionally
 * excluded from the unified schema because the floor plan feature has
 * been retired from the product data model. These types remain here
 * solely to keep the renderer component compilable until it is removed.
 * ------------------------------------------------------------------------- */

/**
 * Cardinal wall positions on the floor plan, viewed from above.
 * Used by the FloorPlan SVG renderer to place aperture elements
 * on the correct wall of the floor plan outline.
 */
export type WallPosition = 'north' | 'east' | 'south' | 'west';

/**
 * Aperture type identifiers representing different glazing unit styles.
 * Each type maps to a distinct SVG rendering routine in the FloorPlan
 * component (different hinge indicators, frame widths, and opening arcs).
 */
export type ApertureType =
  | 'tilt-turn-window'
  | 'french-door'
  | 'sliding-door'
  | 'fixed-glazing';

/**
 * A single glazing aperture placed on one wall of the floor plan.
 * The FloorPlan renderer uses this data to draw the aperture SVG
 * element at the correct position and scale on the wall outline.
 */
export interface Aperture {
  /** Glazing unit type, determines the visual rendering style. */
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
 * Passed as a prop to the FloorPlan SVG component. Contains the
 * ordered list of apertures and pre-formatted dimension labels
 * for annotation overlays.
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
