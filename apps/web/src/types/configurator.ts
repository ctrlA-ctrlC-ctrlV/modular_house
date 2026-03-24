/**
 * Configurator Product Data Model -- Type Definitions
 * =============================================================================
 *
 * PURPOSE:
 * Defines the TypeScript interfaces that mirror the SQL database schema for
 * the garden room product configurator. These types represent normalised
 * relational entities (products, finishes, addons, specifications) and are
 * designed for direct mapping to PostgreSQL tables via Prisma.
 *
 * DATABASE DESIGN:
 * The schema follows a normalised relational model with six core tables:
 *
 *   configurator_products          -- Root product entity (one row per size)
 *   configurator_finish_options    -- Denormalised swatch catalogue
 *   configurator_finish_categories -- Groups finishes into configurator steps
 *   configurator_product_finishes  -- Many-to-many join (product x finish category x option)
 *   configurator_addon_options     -- Per-product add-on definitions
 *   configurator_product_specs     -- Per-product key-value specifications
 *
 * The "configurator_" prefix namespaces all tables to avoid collisions
 * with existing entities (Page, GalleryItem, etc.) in the schema.
 *
 * PRICING:
 * All monetary values (basePrice, addon prices) are stored in euro cents
 * as integers to avoid floating-point precision issues. All displayed
 * prices include VAT at the Irish standard rate (23%).
 *
 * BATHROOM & KITCHEN RULES:
 * The bathroomKitchenPolicy field on each product encodes the business
 * rule as a discriminated union:
 *   - "not-available" : 15 m2 -- cannot add bathroom & kitchen at all
 *   - "optional-addon" : 25 m2 -- available as a selectable paid add-on (legacy)
 *   - "layout-bundled" : 25 m2 -- determined by the selected LayoutOption
 *   - "included"       : 35 & 45 m2 -- included in the base price with plumbing
 *
 * FINISH PREVIEW IMAGES:
 * When the customer selects a finish, the configurator displays a
 * photograph from /public/resource/garden-room/product-config/ rather
 * than updating the floor plan SVG. Each FinishOption carries an
 * `imagePath` field pointing to the corresponding JPEG preview.
 *
 * DESIGN PRINCIPLES:
 * - Open-Closed: new products, finishes, or addons require only INSERT
 *   statements -- no DDL changes or interface modifications.
 * - Strict typing: all fields are explicitly typed; no use of `any`.
 * - ReadonlyArray for constant seed data consumed by the frontend.
 *
 * =============================================================================
 */


/* =============================================================================
   SECTION 1: FINISH CONFIGURATION
   -----------------------------------------------------------------------------
   Maps to two database tables:
     1. configurator_finish_options    -- the swatch catalogue
     2. configurator_finish_categories -- groups finishes into steps

   Each FinishOption carries both swatch rendering data (color, accent) and
   a preview image path. The image is displayed in the configurator hero
   area when the customer selects that finish, replacing the floor plan.

   SQL table: configurator_finish_options
   Columns: id (UUID PK), name, color, accent, image_path, created_at, updated_at
   ============================================================================= */

/**
 * A single selectable finish swatch (e.g., one cladding colour or interior
 * material). Rendered as a colour circle with a radial gradient from
 * `color` to `accent`. When selected, the hero image switches to the
 * photograph at `imagePath`.
 *
 * SQL: configurator_finish_options
 */
export interface FinishOption {
  /** Database primary key (UUID v4). */
  id: string;
  /** Human-readable display name (e.g., "Black", "Teak"). */
  name: string;
  /** Primary hex colour for the swatch (e.g., "#1a1a1a"). */
  color: string;
  /** Secondary hex colour for the gradient accent (e.g., "#333"). */
  accent: string;
  /**
   * Path to the preview photograph displayed when this finish is selected.
   * Relative to /public (e.g., "/resource/garden-room/product-config/exterior_finish_black.jpg").
   */
  imagePath: string;
}

/**
 * A logical grouping of finish options presented as one configurator step.
 * Each category maps to a distinct step in the workflow (e.g., "Exterior",
 * "Interior"). The `sublabel` provides contextual copy displayed below
 * the step heading.
 *
 * SQL: configurator_finish_categories
 * Columns: id (UUID PK), slug, label, sublabel, display_order, created_at, updated_at
 *
 * The many-to-many relationship between products and finish options within
 * a category is resolved through the configurator_product_finishes join table.
 */
export interface FinishCategory {
  /** Database primary key (UUID v4). */
  id: string;
  /** Stable identifier used for routing and state tracking (e.g., "exterior"). */
  slug: string;
  /** Step heading displayed in the configurator (e.g., "Exterior Finish"). */
  label: string;
  /** Descriptive text displayed below the heading. */
  sublabel: string;
  /** Sort position within the configurator step sequence (ascending). */
  displayOrder: number;
  /** Available finish choices within this category. */
  options: ReadonlyArray<FinishOption>;
}


/* =============================================================================
   SECTION 2: ADD-ON CONFIGURATION
   -----------------------------------------------------------------------------
   Maps to database table: configurator_addon_options
   Columns: id (UUID PK), product_id (FK), slug, name, description,
            price_cents_incl_vat, icon_id, display_order, created_at, updated_at

   Add-on options represent optional paid upgrades. Each add-on row is
   scoped to a specific product (product_id FK) because pricing varies
   by room size. The iconId field is a semantic string that the UI layer
   resolves to an SVG component.

   IMPORTANT: The "Bathroom + Kitchen" add-on only appears in the addon
   list for products where bathroomKitchenPolicy is "optional-addon"
   (currently only 25 m2). For 15 m2 it does not exist; for 35 and 45 m2
   it is included in the base price and represented by the includedFeatures
   array on the product, not as an add-on.
   ============================================================================= */

/**
 * Semantic icon identifiers for add-on rendering. Maps to SVG icons or
 * icon components in the UI layer. New identifiers should be appended
 * here when new add-on categories are introduced.
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
 * Scoped to one product via the product_id foreign key in the database.
 *
 * SQL: configurator_addon_options
 */
export interface AddonOption {
  /** Database primary key (UUID v4). */
  id: string;
  /** FK reference to the parent ConfiguratorProduct. */
  productId: string;
  /** URL-safe identifier (e.g., "triple-glazing"). */
  slug: string;
  /** Human-readable add-on name (e.g., "Triple Glazing Upgrade"). */
  name: string;
  /** Brief description of what the add-on includes. */
  description: string;
  /** Incremental cost in euro cents, inclusive of 23% VAT. */
  priceCentsInclVat: number;
  /** Semantic icon identifier resolved to a visual by the UI layer. */
  iconId: AddonIconId;
  /** Sort position within the add-on list for this product (ascending). */
  displayOrder: number;
}


/* =============================================================================
   SECTION 3: PRODUCT SPECIFICATIONS
   -----------------------------------------------------------------------------
   Maps to database table: configurator_product_specs
   Columns: id (UUID PK), product_id (FK), label, value, display_order,
            created_at, updated_at

   Specification items are displayed as a grid of key-value pairs on the
   product overview step. They describe what is included in the base
   configuration before any user selections or add-ons.
   ============================================================================= */

/**
 * A single key-value specification line displayed in the "What's Included"
 * grid on the overview step.
 *
 * SQL: configurator_product_specs
 */
export interface ProductSpec {
  /** Database primary key (UUID v4). */
  id: string;
  /** FK reference to the parent ConfiguratorProduct. */
  productId: string;
  /** Specification label (e.g., "Dimensions", "Insulation"). */
  label: string;
  /** Specification value (e.g., "5.0m x 3.0m", "120mm PIR"). */
  value: string;
  /** Sort position within the specification grid (ascending). */
  displayOrder: number;
}


/* =============================================================================
   SECTION 4: INCLUDED FEATURES
   -----------------------------------------------------------------------------
   Maps to database table: configurator_included_features
   Columns: id (UUID PK), product_id (FK), name, description, display_order,
            created_at, updated_at

   Represents features that are bundled into the base price for a given
   product and are NOT user-toggleable. This differs from add-ons (which
   are optional). For example, the 35 m2 and 45 m2 models include
   bathroom, kitchen, and plumbing connections as standard.
   ============================================================================= */

/**
 * A non-optional feature included in the product's base price.
 * Displayed on the overview step as part of "What's Included" but
 * not presented as a toggleable option in the add-ons step.
 *
 * SQL: configurator_included_features
 */
export interface IncludedFeature {
  /** Database primary key (UUID v4). */
  id: string;
  /** FK reference to the parent ConfiguratorProduct. */
  productId: string;
  /** Feature name (e.g., "Bathroom + Kitchen"). */
  name: string;
  /** Brief description (e.g., "Full plumbing with bathroom, kitchen, and WC"). */
  description: string;
  /** Sort position within the included features list (ascending). */
  displayOrder: number;
}


/* =============================================================================
   SECTION 5: PHYSICAL DIMENSIONS
   -----------------------------------------------------------------------------
   Stored as columns directly on the configurator_products table rather
   than in a separate table, since there is a strict 1:1 relationship.

   All measurements use metric units. The width and depth represent the
   external footprint; the height is the usable internal ceiling clearance.
   ============================================================================= */

/**
 * Physical dimensional data for one garden room model.
 * Stored as scalar columns on the configurator_products table.
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
   SECTION 6: FLOOR PLAN CONFIGURATION
   -----------------------------------------------------------------------------
   Stored as a JSONB column (floor_plan_config) on the configurator_products
   table. The data is structured but does not justify its own normalised
   table because it is always read and written as a unit, never queried
   independently.

   Wall positions use compass directions viewed from above:
   - north: top wall (front-facing)
   - east:  right wall
   - south: bottom wall (rear)
   - west:  left wall
   ============================================================================= */

/**
 * Cardinal wall positions on the floor plan, viewed from above.
 */
export type WallPosition = 'north' | 'east' | 'south' | 'west';

/**
 * Aperture type identifiers representing different glazing unit styles.
 */
export type ApertureType =
  | 'tilt-turn-window'
  | 'french-door'
  | 'sliding-door'
  | 'fixed-glazing';

/**
 * A single glazing aperture placed on one wall of the floor plan.
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
 * Stored as JSONB on the configurator_products table (floor_plan_config column).
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
   SECTION 6a: FLOOR PLAN VARIANTS
   -----------------------------------------------------------------------------
   Maps to a future database table: configurator_floor_plan_variants
   Columns: id (UUID PK), product_id (FK), slug, label, description,
            width_m, depth_m, area_m2, price_delta_cents_incl_vat,
            floor_plan_config (JSONB), display_order

   A floor plan variant represents one selectable external footprint for a
   product. Products may offer multiple footprint options (e.g., The Studio
   offers both 5.0m x 5.0m and 4.15m x 6.0m). When floor plan variants are
   defined, the configurator inserts a floor plan selection step before the
   overview. Products without variants use their base dimensions and skip
   this step entirely (Open-Closed Principle).
   ============================================================================= */

/**
 * A selectable floor plan variant for a product. Each variant defines
 * a specific external footprint and its associated floor plan rendering
 * configuration. Products without variants use their base dimensions.
 *
 * SQL: configurator_floor_plan_variants
 * Columns: id (UUID PK), product_id (FK), slug, label, description,
 *          width_m, depth_m, area_m2, price_delta_cents_incl_vat,
 *          floor_plan_config (JSONB), display_order
 */
export interface FloorPlanVariant {
  /** Database primary key (UUID v4). */
  id: string;
  /** FK reference to the parent ConfiguratorProduct. */
  productId: string;
  /** URL-safe slug used for routing and state tracking (e.g., "5x5", "4x6"). */
  slug: string;
  /** Human-readable dimension label (e.g., "5.0m x 5.0m"). */
  label: string;
  /** Short description of the footprint shape (e.g., "Square footprint"). */
  description: string;
  /** External width in metres. */
  widthM: number;
  /** External depth in metres. */
  depthM: number;
  /** Total floor area in square metres. */
  areaM2: number;
  /**
   * Price adjustment in euro cents (inclusive of VAT) relative to the
   * product base price. Currently 0 for all Studio variants -- the field
   * exists to support future pricing differentiation without schema changes.
   */
  priceDeltaCentsInclVat: number;
  /** Floor plan rendering configuration passed to the FloorPlan component. */
  floorPlan: FloorPlanConfig;
  /**
   * Optional path to a pre-rendered floor plan SVG image file, relative
   * to /public (e.g., "/resource/floorplan/9m x 5m.svg"). When provided,
   * the configurator renders this image instead of using the programmatic
   * ArchitecturalFloorPlan or FloorPlan component. This enables products
   * to use professionally designed SVG floor plans without requiring a
   * matching ArchitecturalFloorPlanConfig data structure.
   */
  floorPlanImagePath?: string;
  /**
   * Optional mapping of layout slugs to pre-rendered floor plan SVG image
   * paths. Used by products that have both floor plan variants and layout
   * options (e.g., The Studio 25m2), where the displayed floor plan depends
   * on the combination of variant and layout. When a layout is selected and
   * this map contains a matching key, the corresponding image is rendered
   * instead of `floorPlanImagePath`.
   *
   * Keys are layout slugs (e.g., "box", "en-suite", "bedroom").
   * Values are paths relative to /public (e.g., "/resource/floorplan/5m x 5m - box.svg").
   */
  floorPlanImagesByLayout?: Readonly<Record<string, string>>;
  /** Sort position within the floor plan selection step (ascending). */
  displayOrder: number;
}


/* =============================================================================
   SECTION 6b: LAYOUT OPTIONS
   -----------------------------------------------------------------------------
   Maps to a future database table: configurator_layout_options
   Columns: id (UUID PK), product_id (FK), slug, name, description,
            price_delta_cents_incl_vat, includes_bathroom, includes_kitchen,
            includes_bedroom_wall, display_order

   A layout option represents one selectable interior arrangement for a
   product. Each layout defines a pricing tier and which features are
   bundled (bathroom, kitchen, bedroom wall). When layout options are
   defined, the configurator inserts a layout selection step after the
   floor plan step. Products without layouts skip this step entirely.

   For The Studio 25m2 product:
     - Box:     open plan, no internal walls, no price uplift
     - En Suite: bathroom + kitchen included, price delta = EUR 12,000
     - Bedroom:  bathroom + kitchen + bedroom wall, delta = EUR 16,000
   ============================================================================= */

/**
 * A selectable interior layout for a product. Each layout defines a
 * pricing tier and which features are bundled (bathroom, kitchen, bedroom
 * wall). The price delta is added on top of the product base price.
 *
 * SQL: configurator_layout_options
 * Columns: id (UUID PK), product_id (FK), slug, name, description,
 *          price_delta_cents_incl_vat, includes_bathroom, includes_kitchen,
 *          includes_bedroom_wall, display_order
 */
export interface LayoutOption {
  /** Database primary key (UUID v4). */
  id: string;
  /** FK reference to the parent ConfiguratorProduct. */
  productId: string;
  /** URL-safe slug used for routing and state tracking (e.g., "box", "en-suite"). */
  slug: string;
  /** Human-readable layout name (e.g., "Box", "En Suite", "Bedroom"). */
  name: string;
  /** Brief description of the layout arrangement. */
  description: string;
  /**
   * Price adjustment in euro cents (inclusive of VAT) relative to the
   * product base price. Box = 0, En Suite = 1,200,000, Bedroom = 1,600,000.
   */
  priceDeltaCentsInclVat: number;
  /** Whether this layout includes a bathroom partition and fixtures. */
  includesBathroom: boolean;
  /** Whether this layout includes kitchen fixtures. */
  includesKitchen: boolean;
  /** Whether this layout includes a bedroom partition wall and door. */
  includesBedroomWall: boolean;
  /** Sort position within the layout selection step (ascending). */
  displayOrder: number;
}


/* =============================================================================
   SECTION 7: PRODUCT HERO IMAGE
   -----------------------------------------------------------------------------
   The default product hero image (displayed before any finish selection)
   is stored as columns on the configurator_products table. Once a finish
   is selected, the configurator switches to the FinishOption.imagePath
   photograph from /public/resource/garden-room/product-config/.
   ============================================================================= */

/**
 * Multi-format image paths for a product hero. Browsers select the
 * optimal format via <picture> / <source> elements.
 *
 * Stored as scalar columns on the configurator_products table:
 *   image_src, image_webp, image_avif, image_alt
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
   SECTION 8: BATHROOM & KITCHEN POLICY
   -----------------------------------------------------------------------------
   A discriminated union type encoding the business rules for bathroom and
   kitchen availability per product size:

   | Policy          | Applies to | Behaviour                                 |
   |-----------------|------------|-------------------------------------------|
   | not-available   | 15 m2      | No bathroom/kitchen option at all          |
   | optional-addon  | 25 m2      | Offered as a toggleable paid add-on        |
   | layout-bundled  | 25 m2      | Determined by LayoutOption selection        |
   | included        | 35, 45 m2  | Included in base price with plumbing       |

   Stored as a VARCHAR(20) column (bathroom_kitchen_policy) on the
   configurator_products table.
   ============================================================================= */

/**
 * Discriminated policy values for bathroom & kitchen availability.
 * Used to control both the UI rendering logic and add-on list filtering.
 */
export type BathroomKitchenPolicy =
  | 'not-available'
  | 'optional-addon'
  | 'layout-bundled'
  | 'included';


/* =============================================================================
   SECTION 9: MAIN CONFIGURATOR PRODUCT
   -----------------------------------------------------------------------------
   Maps to database table: configurator_products
   Columns: id (UUID PK), slug (UNIQUE), name, tagline,
            width_m, depth_m, height_m, area_m2,
            base_price_cents_incl_vat, pricing_note,
            bathroom_kitchen_policy,
            glazing_note, floor_plan_config (JSONB),
            image_src, image_webp, image_avif, image_alt,
            available, planning_permission, lead_time,
            display_order, created_at, updated_at

   One-to-many relations:
     -> configurator_addon_options     (product_id FK)
     -> configurator_product_specs     (product_id FK)
     -> configurator_included_features (product_id FK)

   Many-to-many relations (via join table):
     -> configurator_finish_options (through configurator_product_finishes)

   Each of the four garden room sizes (15, 25, 35, 45 m2) is represented
   by one row. The page component consumes this data to render a fully
   templated configurator without any hard-coded product-specific values.
   ============================================================================= */

/**
 * Complete data definition for one configurable garden room product.
 *
 * This is the root data type consumed by the product configurator page.
 * It composes identity, pricing, configuration options, specifications,
 * included features, floor plan, and availability data into a single
 * cohesive entity.
 *
 * To add a new product size:
 *   1. INSERT a new row into configurator_products.
 *   2. INSERT related addon, spec, and included feature rows.
 *   3. INSERT join-table entries for finish category/option assignments.
 * No existing code or DDL changes are required (Open-Closed Principle).
 *
 * SQL: configurator_products
 */
export interface ConfiguratorProduct {
  /* --- Identity ----------------------------------------------- */

  /** Database primary key (UUID v4). */
  id: string;
  /** URL-safe slug used for routing (UNIQUE constraint, e.g., "compact-15"). */
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
   * Base price in euro cents, inclusive of 23% VAT.
   * The total configured price is calculated as:
   *   basePriceCentsInclVat + sum(selected addon priceCentsInclVat values)
   */
  basePriceCentsInclVat: number;
  /** Pricing footnote displayed below the total (e.g., "Price includes VAT"). */
  pricingNote: string;

  /* --- Bathroom & Kitchen Policy ------------------------------ */

  /**
   * Business rule for bathroom & kitchen availability on this product:
   *   - "not-available"  : cannot be added (15 m2)
   *   - "optional-addon" : offered as a paid add-on (25 m2, legacy)
   *   - "layout-bundled" : determined by the selected LayoutOption (25 m2)
   *   - "included"       : bundled in the base price with plumbing (35, 45 m2)
   */
  bathroomKitchenPolicy: BathroomKitchenPolicy;

  /* --- Configuration Options ---------------------------------- */

  /**
   * Ordered list of finish categories forming the configurator steps.
   * Typically two entries: exterior cladding and interior wall finish.
   * Additional categories can be appended without modifying the
   * configurator component logic.
   */
  finishCategories: ReadonlyArray<FinishCategory>;

  /**
   * Available add-on upgrades with per-product pricing.
   * For 15 m2, this list excludes bathroom & kitchen entirely.
   * For 25 m2, bathroom & kitchen appears as an add-on here.
   * For 35 & 45 m2, bathroom & kitchen is NOT in this list
   * (it is in includedFeatures instead).
   */
  addons: ReadonlyArray<AddonOption>;

  /**
   * Optional floor plan variants. When present, the configurator inserts
   * a floor plan selection step before the overview. When absent, the
   * product uses its base dimensions and a single floor plan.
   *
   * Currently only The Studio 25m2 defines variants (5.0m x 5.0m and
   * 4.15m x 6.0m). All other products omit this field and retain their
   * original step sequence unchanged (Open-Closed Principle).
   */
  floorPlanVariants?: ReadonlyArray<FloorPlanVariant>;

  /**
   * Optional interior layout options. When present, the configurator
   * inserts a layout selection step after the floor plan / overview step.
   * When absent, the product has no layout step.
   *
   * Currently only The Studio 25m2 defines layouts (Box, En Suite,
   * Bedroom). All other products omit this field.
   */
  layoutOptions?: ReadonlyArray<LayoutOption>;

  /**
   * Features included in the base price that are not user-toggleable.
   * For 35 & 45 m2 this includes bathroom, kitchen, and plumbing.
   * For 15 & 25 m2 this may be empty or contain other base features.
   */
  includedFeatures: ReadonlyArray<IncludedFeature>;

  /* --- Specifications ----------------------------------------- */

  /**
   * Key-value specification pairs displayed on the overview step.
   * Describes what is included in the base configuration.
   */
  specs: ReadonlyArray<ProductSpec>;

  /** Detailed glazing description displayed as a footnote on the overview step. */
  glazingNote: string;

  /* --- Floor Plan --------------------------------------------- */

  /** Structured data for the SVG floor plan rendering component (JSONB). */
  floorPlan: FloorPlanConfig;

  /**
   * Optional path to a pre-rendered floor plan SVG image file, relative
   * to /public (e.g., "/resource/floorplan/3m x 5m.svg"). When provided,
   * the configurator renders this static image on the overview and summary
   * steps instead of using the programmatic FloorPlan component. Used by
   * products without floor plan variants (Compact 15m2, Living 35m2).
   */
  floorPlanImagePath?: string;

  /* --- Imagery ------------------------------------------------ */

  /** Default product hero image shown before any finish is selected. */
  image: ProductImageSet;

  /* --- Availability ------------------------------------------- */

  /** Whether the product is currently orderable (false = "Coming Soon"). */
  available: boolean;
  /** Whether planning permission is required for this size. */
  planningPermission: boolean;
  /** Estimated delivery timeline from order to handover (e.g., "6-8 weeks"). */
  leadTime: string;
  /** Sort position for product listing order (ascending). */
  displayOrder: number;
}
