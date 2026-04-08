/**
 * Unified Garden Room Data Model
 * =============================================================================
 *
 * PURPOSE:
 * Single normalised schema that consolidates the configurator product data
 * (configurator-products.ts) and the garden-room marketing page data
 * (garden-room-data.ts) into one coherent type system. Every garden room
 * product entity is described exactly once; component-specific shapes are
 * derived via projection at the data layer, not duplicated in the schema.
 *
 * This file is a compile-time type contract only -- it contains no runtime
 * values. The corresponding seed data file imports these types and
 * populates them with product records.
 *
 * DESIGN PRINCIPLES:
 *   - Open-Closed Principle: adding a new product requires appending data,
 *     never modifying existing interfaces.
 *   - Strict TypeScript: no use of `any`; every field is explicitly typed.
 *   - Database-ready: each interface maps to a PostgreSQL table (or inline
 *     JSONB column) as annotated, enabling a future admin-panel migration
 *     with minimal refactoring.
 *
 * CONVENTIONS:
 *   - All monetary values are integer euro cents inclusive of 23% VAT.
 *   - All dimension values are metric (metres unless noted as millimetres).
 *   - Every entity carries `id` (UUID in PostgreSQL) and `displayOrder`
 *     (ascending sort key for rendering).
 *   - Slugs are unique, URL-safe identifiers used for client-side routing.
 *   - `readonly` modifiers enforce immutability for compile-time constants;
 *     they should be removed when the schema serves mutable API responses.
 *
 * TABLE MAP (each interface maps to one PostgreSQL table unless noted):
 *
 *   Product                    -> products
 *   ProductDimensions          -> (inline JSONB column on products)
 *   ProductImage               -> product_images
 *   ProductSpec                -> product_specs
 *   ProductUseCase             -> product_use_cases
 *   FootprintVariant           -> footprint_variants
 *   LayoutOption               -> layout_options
 *   Addon                      -> addons
 *   IncludedFeature            -> included_features
 *   FinishCategory             -> finish_categories
 *   FinishOption               -> finish_options
 *   StandardFeature            -> standard_features      (product-line-wide)
 *   WarrantyCoverage           -> warranty_coverages      (product-line-wide)
 *   SellingPoint               -> selling_points          (marketing page-wide)
 *   FAQ                        -> faqs
 *   Testimonial                -> testimonials
 *   GalleryImage               -> gallery_images
 *   ComparisonCategory         -> comparison_categories
 *   ComparisonMethodData       -> (inline JSONB on comparison_categories)
 *   ConfiguratorSelection      -> configurator_sessions   (future order flow)
 *
 * LEGACY REMOVALS:
 *   - The entire floor plan feature has been retired. This includes the
 *     programmatic ArchitecturalFloorPlan renderer (aperture arrays, wall
 *     identifiers, dimension labels), the pre-rendered SVG floor plan
 *     images (`floorPlanImagePath`, `floorPlanImagesByLayout`), and the
 *     top-level `floorPlan` object that previously lived on each product
 *     and variant record. All floor-plan-related interfaces and fields
 *     have been intentionally omitted from this schema.
 *   - The footprint dimension selection (e.g., Studio 5x5 vs 4.15x6) is
 *     preserved as `FootprintVariant`, carrying only dimensional data and
 *     price deltas -- no floor plan imagery or rendering metadata.
 *
 * =============================================================================
 */


// ---------------------------------------------------------------------------
// ENUMS AND LITERAL TYPES
// ---------------------------------------------------------------------------

/**
 * Controls how the bathroom and kitchen option is surfaced in the
 * product configurator UI.
 *
 * - "not-available": the product physically cannot accommodate B&K (15 m2).
 * - "optional-addon": B&K is offered as a standalone paid add-on (legacy;
 *   retained for backward compatibility with existing configurator UI code).
 * - "layout-bundled": B&K availability depends on the selected layout
 *   option (25 m2 Studio).
 * - "included": B&K is part of the base specification and price (35/45 m2).
 */
type BathroomKitchenPolicy = 'not-available' | 'optional-addon' | 'layout-bundled' | 'included';

/**
 * Orientation hint consumed by the masonry gallery layout algorithm to
 * determine whether an image occupies a full-height column (portrait) or
 * is paired vertically with another landscape image.
 */
type ImageOrientation = 'landscape' | 'portrait';

/**
 * Identifies the UI surface on which a product use-case string is
 * displayed. A single use case may appear in one or both contexts,
 * allowing the marketing team to show a concise set on product cards
 * and an extended set in the quick-view modal.
 */
type UseCaseContext = 'card' | 'quick-view';

/**
 * Identifies which gallery component(s) an image should appear in.
 * The masonry gallery is a grid layout on the marketing page; the
 * infinite strip is a horizontally-scrolling gallery below the
 * product showcase section.
 */
type GalleryContext = 'masonry' | 'infinite-strip';


// ---------------------------------------------------------------------------
// CORE: PRODUCT
// ---------------------------------------------------------------------------

/**
 * Physical dimensions of a product footprint and internal height.
 *
 * Stored as an inline JSONB column on the `products` table rather than
 * a separate table, because dimensions are always fetched alongside the
 * product and never queried independently.
 */
interface ProductDimensions {
  /** External width in metres. */
  readonly widthM: number;
  /** External depth in metres. */
  readonly depthM: number;
  /** Internal ceiling height in metres. */
  readonly heightM: number;
  /** Total floor area in square metres, derived from width x depth. */
  readonly areaM2: number;
}

/**
 * Multi-format image set for a single product photograph.
 *
 * PostgreSQL: `product_images` table with a foreign key to `products.id`.
 * The `role` discriminator enables future expansion to multiple images
 * per product (e.g., hero, gallery, thumbnail) without schema changes.
 *
 * All file paths are relative to the /public directory.
 */
interface ProductImage {
  readonly id: string;
  /** Foreign key referencing the parent product. */
  readonly productId: string;

  /** Primary fallback image path (PNG or JPEG). */
  readonly src: string;
  /** WebP-optimised variant for modern browsers. */
  readonly webP: string;
  /** AVIF-optimised variant for maximum compression. */
  readonly avif: string;
  /** Accessible alt text describing the image content. */
  readonly alt: string;

  /**
   * Semantic role of this image within the product's image set.
   * Extensible via union expansion if additional roles are needed.
   */
  readonly role: 'hero' | 'gallery' | 'thumbnail';
  readonly displayOrder: number;
}

/**
 * Root product entity -- the single source of truth for every garden room
 * size offered by Modular House.
 *
 * This interface consolidates fields that were previously split across
 * `ConfiguratorProduct` (configurator-products.ts) and
 * `CanonicalGardenRoomProduct` (garden-room-data.ts). Identity, pricing,
 * availability, dimensions, and policy fields now live in one place.
 *
 * Relational children (images, specs, use cases, layout options, addons,
 * included features, finish categories, footprint variants) are loaded
 * via JOINs or eager-loading at the data access layer. They are expressed
 * as a separate hydrated type (`HydratedProduct`) to keep this base
 * interface aligned with the flat `products` database table.
 *
 * PostgreSQL: `products` table.
 */
interface Product {
  readonly id: string;
  /** URL-safe unique slug used as the route parameter (e.g., "compact-15"). */
  readonly slug: string;

  // -- Identity and copy ------------------------------------------------
  /** Marketing name displayed across all surfaces (e.g., "The Compact"). */
  readonly name: string;
  /** One-line marketing tagline (e.g., "Your private creative sanctuary"). */
  readonly tagline: string;
  /**
   * Long-form product description for the quick-view modal and product
   * detail pages. Written in marketing prose, not technical bullet points.
   */
  readonly description: string;

  // -- Dimensions -------------------------------------------------------
  /** Base physical dimensions of the product. */
  readonly dimensions: ProductDimensions;
  /**
   * Pre-formatted dimension string for display contexts that do not
   * require raw numeric values. Products with multiple footprint variants
   * list all options here (e.g., "5m x 5m or 6m x 4.15m").
   */
  readonly dimensionsDisplay: string;

  // -- Pricing ----------------------------------------------------------
  /** Base price in euro cents inclusive of 23% Irish VAT. */
  readonly basePriceCentsInclVat: number;
  /**
   * Footnote displayed below the price in the configurator
   * (e.g., "Price includes VAT . Ts & Cs apply").
   */
  readonly pricingNote: string;

  // -- Configurator policies --------------------------------------------
  /**
   * Determines how the bathroom and kitchen option is presented in the
   * configurator. See BathroomKitchenPolicy type for the three modes.
   */
  readonly bathroomKitchenPolicy: BathroomKitchenPolicy;

  // -- Availability and logistics ---------------------------------------
  /**
   * Whether the product is orderable and has a live configurator.
   * When false, the CTA routes to an interest registration form instead.
   */
  readonly available: boolean;
  /**
   * Whether the product is currently in stock and ready for manufacture.
   * Omitted (undefined) for products in a "coming soon" state so that
   * the stock availability pill does not render on the product card.
   */
  readonly inStock?: boolean;
  /** Whether planning permission is required under current Irish legislation. */
  readonly planningPermission: boolean;
  /** Estimated lead time from order confirmation to handover (e.g., "6-8 weeks"). */
  readonly leadTime: string;

  // -- Call to action ----------------------------------------------------
  /** CTA button label (e.g., "Customise", "Register Interest"). */
  readonly ctaText: string;
  /** Route the CTA button navigates to (e.g., "/garden-room/configure/compact-15"). */
  readonly ctaLink: string;

  // -- Optional marketing modifiers -------------------------------------
  /**
   * Badge label rendered on product cards (e.g., "Most Popular",
   * "Coming Soon"). Omitted when no badge should render.
   */
  readonly badge?: string;
  /**
   * Glazing summary note displayed in the configurator detail view.
   * Provides a human-readable list of window and door specifications.
   */
  readonly glazingNote?: string;

  // -- Sort -------------------------------------------------------------
  /** Ascending sort key controlling the rendering order of products. */
  readonly displayOrder: number;
}

/**
 * Fully hydrated product with all relational children resolved.
 *
 * This is the shape returned by the data access layer after joining
 * the `products` table with its child tables. Components consume this
 * type; projection functions then map it into component-specific shapes
 * (e.g., ProductCard, QuickViewProduct, ProductShowcaseProduct).
 *
 * Separating this from `Product` preserves a clean 1:1 mapping between
 * the base `Product` interface and the flat database row, while giving
 * consuming code access to the full object graph.
 */
interface HydratedProduct extends Product {
  /** Product images, ordered by displayOrder. */
  readonly images: ReadonlyArray<ProductImage>;
  /** Technical specification rows, ordered by displayOrder. */
  readonly specs: ReadonlyArray<ProductSpec>;
  /** Use-case labels tagged by display context, ordered by displayOrder. */
  readonly useCases: ReadonlyArray<ProductUseCase>;
  /**
   * Selectable external footprint variants (e.g., 5x5 vs 4x6 for Studio).
   * Empty array for products with a single fixed footprint.
   */
  readonly footprintVariants: ReadonlyArray<FootprintVariant>;
  /**
   * Interior layout tiers (e.g., Box / En Suite / Bedroom for Studio).
   * Empty array for products without configurable layouts.
   */
  readonly layoutOptions: ReadonlyArray<LayoutOption>;
  /** Optional paid upgrade add-ons, ordered by displayOrder. */
  readonly addons: ReadonlyArray<Addon>;
  /**
   * Features bundled into the base price (e.g., B&K on 35/45 m2 models).
   * Empty array when no features are pre-included.
   */
  readonly includedFeatures: ReadonlyArray<IncludedFeature>;
  /**
   * Finish categories (exterior cladding, interior wall) with their
   * nested option arrays eagerly loaded.
   */
  readonly finishCategories: ReadonlyArray<HydratedFinishCategory>;

  // -------------------------------------------------------------------------
  // LEGACY COMPATIBILITY FIELDS
  // -------------------------------------------------------------------------
  // The following fields exist solely to maintain backward compatibility
  // with configurator components that have not yet been updated to use
  // the unified schema field names and access patterns. They should be
  // removed once all consuming components are migrated.

  /**
   * Legacy alias for `footprintVariants`.
   * Configurator components reference this name; once they are updated
   * to use `footprintVariants`, this field should be removed.
   *
   * @deprecated Use `footprintVariants` instead.
   */
  readonly floorPlanVariants?: ReadonlyArray<FootprintVariant>;

  /**
   * Legacy single hero image accessor for configurator components.
   * The unified schema uses the `images` array with role-based lookups.
   * This field provides a flat image object for backward compatibility
   * with components that expect `product.image.src`.
   *
   * @deprecated Use `images.find(i => i.role === 'hero')` instead.
   */
  readonly image?: {
    readonly src: string;
    readonly webP?: string;
    readonly avif?: string;
    readonly alt: string;
  };

  /**
   * Legacy floor plan rendering configuration.
   * The floor plan feature has been retired from the data model, but
   * the FloorPlan SVG renderer component still consumes this field.
   * Should be removed when the renderer component is deleted.
   *
   * @deprecated Floor plan feature is retired.
   */
  readonly floorPlan?: {
    readonly apertures: ReadonlyArray<{
      readonly type: string;
      readonly wall: string;
      readonly widthMm: number;
      readonly heightMm: number;
    }>;
    readonly dimensionLabels: {
      readonly width: string;
      readonly depth: string;
    };
  };

  /**
   * Legacy path to a pre-rendered floor plan SVG image.
   * Should be removed when the floor plan feature is fully retired.
   *
   * @deprecated Floor plan feature is retired.
   */
  readonly floorPlanImagePath?: string;
}


// ---------------------------------------------------------------------------
// CHILD: TECHNICAL SPECIFICATIONS
// ---------------------------------------------------------------------------

/**
 * A single technical specification row for a product.
 *
 * Replaces both the `specs[]` array from the configurator data and the
 * `technicalSpecs: Record<string, string>` from the garden-room page data.
 * Using an entity with `displayOrder` instead of a plain key-value record
 * gives explicit control over rendering order and enables per-row
 * identifiers for future admin-panel editing.
 *
 * PostgreSQL: `product_specs` table with a foreign key to `products.id`.
 */
interface ProductSpec {
  readonly id: string;
  /** Foreign key referencing the parent product. */
  readonly productId: string;
  /** Specification label (e.g., "Insulation", "Glazing", "Electrics"). */
  readonly label: string;
  /** Human-readable value (e.g., "90mm rock wool + 100mm EPS"). */
  readonly value: string;
  readonly displayOrder: number;
}


// ---------------------------------------------------------------------------
// CHILD: USE CASES
// ---------------------------------------------------------------------------

/**
 * A use-case bullet point for a product, tagged with the display context
 * in which it should appear.
 *
 * This replaces the separate `cardUseCases` and `quickViewUseCases` string
 * arrays from the prototype data. A use case may appear in both contexts
 * by creating two rows with the same text but different `context` values,
 * or the context column can be extended to an array in the future.
 *
 * PostgreSQL: `product_use_cases` table with a foreign key to `products.id`.
 */
interface ProductUseCase {
  readonly id: string;
  /** Foreign key referencing the parent product. */
  readonly productId: string;
  /** The use-case label (e.g., "Home office", "Guest Suite"). */
  readonly text: string;
  /** The UI surface where this use case is rendered. */
  readonly context: UseCaseContext;
  readonly displayOrder: number;
}


// ---------------------------------------------------------------------------
// CHILD: FOOTPRINT VARIANTS
// ---------------------------------------------------------------------------

/**
 * A selectable external footprint variant for a product.
 *
 * Products may offer multiple footprint shapes with the same total floor
 * area (e.g., Studio 25 m2 offers 5x5 and 4.15x6; Grand 45 m2 offers
 * 9x5 and 7.5x6). Each variant specifies its own dimensions and a price
 * delta relative to the base product price.
 *
 * This interface carries dimensional and pricing data only. The legacy
 * floor plan rendering feature (aperture arrays, SVG image paths,
 * layout-specific floor plan maps) has been retired and its fields are
 * intentionally excluded from this schema.
 *
 * PostgreSQL: `footprint_variants` table with a foreign key to `products.id`.
 */
interface FootprintVariant {
  readonly id: string;
  /** Foreign key referencing the parent product. */
  readonly productId: string;
  /** URL-safe slug identifying this variant (e.g., "5x5", "9x5"). */
  readonly slug: string;
  /** Human-readable label (e.g., "5.0m x 5.0m"). */
  readonly label: string;
  /** Brief description of the footprint shape (e.g., "Square footprint"). */
  readonly description: string;

  /** External width in metres for this variant. */
  readonly widthM: number;
  /** External depth in metres for this variant. */
  readonly depthM: number;
  /** Total floor area in square metres for this variant. */
  readonly areaM2: number;

  /** Price adjustment relative to the base product price, in euro cents inclusive of VAT. */
  readonly priceDeltaCentsInclVat: number;

  readonly displayOrder: number;

  // -------------------------------------------------------------------------
  // LEGACY COMPATIBILITY FIELDS
  // -------------------------------------------------------------------------
  // The following fields support configurator components that still
  // reference floor plan rendering data on footprint variants. They
  // should be removed once those components are updated.

  /**
   * Legacy floor plan rendering configuration for this variant.
   * @deprecated Floor plan feature is retired.
   */
  readonly floorPlan?: {
    readonly apertures: ReadonlyArray<{
      readonly type: string;
      readonly wall: string;
      readonly widthMm: number;
      readonly heightMm: number;
    }>;
    readonly dimensionLabels: {
      readonly width: string;
      readonly depth: string;
    };
  };

  /**
   * Legacy path to a pre-rendered floor plan SVG image for this variant.
   * @deprecated Floor plan feature is retired.
   */
  readonly floorPlanImagePath?: string;

  /**
   * Legacy mapping of layout slugs to pre-rendered floor plan SVG paths.
   * Used by The Studio 25m2 product where the displayed floor plan depends
   * on the combination of variant and layout.
   * @deprecated Floor plan feature is retired.
   */
  readonly floorPlanImagesByLayout?: Readonly<Record<string, string>>;
}


// ---------------------------------------------------------------------------
// CHILD: LAYOUT OPTIONS
// ---------------------------------------------------------------------------

/**
 * An interior layout tier for products with configurable internal walls.
 *
 * Currently only The Studio 25 m2 offers layout options: Box (open plan),
 * En Suite (bathroom + kitchen zone), and Bedroom (partitioned bedroom
 * plus bathroom and kitchen). Each tier carries a price delta relative to
 * the base product price.
 *
 * PostgreSQL: `layout_options` table with a foreign key to `products.id`.
 */
interface LayoutOption {
  readonly id: string;
  /** Foreign key referencing the parent product. */
  readonly productId: string;
  /** URL-safe slug (e.g., "box", "en-suite", "bedroom"). */
  readonly slug: string;
  /** Display name (e.g., "Box", "En Suite", "Bedroom"). */
  readonly name: string;
  /** Brief description of what the layout includes. */
  readonly description: string;

  /** Price adjustment relative to the base product price, in euro cents inclusive of VAT. */
  readonly priceDeltaCentsInclVat: number;

  /** Whether this layout tier includes a bathroom. */
  readonly includesBathroom: boolean;
  /** Whether this layout tier includes a kitchen. */
  readonly includesKitchen: boolean;
  /** Whether this layout tier includes a bedroom partition wall and door. */
  readonly includesBedroomWall: boolean;

  readonly displayOrder: number;
}


// ---------------------------------------------------------------------------
// CHILD: ADDONS
// ---------------------------------------------------------------------------

/**
 * An optional paid upgrade that can be added to a product in the
 * configurator (e.g., triple glazing upgrade, sauna room).
 *
 * PostgreSQL: `addons` table with a foreign key to `products.id`.
 */
interface Addon {
  readonly id: string;
  /** Foreign key referencing the parent product. */
  readonly productId: string;
  /** URL-safe slug (e.g., "triple-glazing", "sauna-room"). */
  readonly slug: string;
  /** Display name (e.g., "Triple Glazing Upgrade"). */
  readonly name: string;
  /** Brief description of the upgrade. */
  readonly description: string;
  /** Full price of the add-on in euro cents inclusive of 23% VAT. */
  readonly priceCentsInclVat: number;
  /** Icon identifier resolved at render time (e.g., "glazing", "sauna"). */
  readonly iconId: string;
  readonly displayOrder: number;
}


// ---------------------------------------------------------------------------
// CHILD: INCLUDED FEATURES
// ---------------------------------------------------------------------------

/**
 * A feature bundled into the base price of a product at no additional cost.
 *
 * Used for the 35 m2 and 45 m2 models where bathroom, kitchen, and
 * plumbing connections are part of the standard specification. Products
 * without pre-included features (15 m2, 25 m2) use an empty array.
 *
 * PostgreSQL: `included_features` table with a foreign key to `products.id`.
 */
interface IncludedFeature {
  readonly id: string;
  /** Foreign key referencing the parent product. */
  readonly productId: string;
  /** Feature name (e.g., "Bathroom + Kitchen"). */
  readonly name: string;
  /** Brief description of what the feature includes. */
  readonly description: string;
  readonly displayOrder: number;
}


// ---------------------------------------------------------------------------
// CHILD: FINISHES
// ---------------------------------------------------------------------------

/**
 * A single finish swatch option within a finish category
 * (e.g., "Black" exterior cladding, "Stone" interior wall).
 *
 * PostgreSQL: `finish_options` table with a foreign key to
 * `finish_categories.id`.
 */
interface FinishOption {
  readonly id: string;
  /** Foreign key referencing the parent finish category. */
  readonly finishCategoryId: string;
  /** Display name of the swatch (e.g., "Charcoal", "Teak", "Stone"). */
  readonly name: string;
  /** Primary swatch hex colour for UI rendering. */
  readonly color: string;
  /** Secondary / accent swatch hex colour for hover or border states. */
  readonly accent: string;
  /**
   * Path to the default preview photograph displayed when this finish is
   * selected in the configurator. Relative to /public. For products with
   * multiple footprint variants, this path corresponds to the primary
   * (first) variant; callers should prefer imagePathByFootprint when a
   * specific variant is active.
   */
  readonly imagePath: string;
  /**
   * Optional mapping from footprint variant slug to the corresponding
   * exterior finish preview image path. Products with multiple footprint
   * variants (e.g., Studio 25 offers 5x5 and 4.15x6) use this field so
   * the configurator UI can resolve the correct preview image when the
   * customer changes the selected variant.
   *
   * Products with a single fixed footprint omit this field; the default
   * imagePath is used directly.
   *
   * PostgreSQL: normalised into a product_variant_finish_images junction
   * table keyed by (product_id, footprint_variant_slug, finish_option_id).
   */
  readonly imagePathByFootprint?: Readonly<Record<string, string>>;
  readonly displayOrder: number;
}

/**
 * A grouping of finish options (e.g., "Exterior Finish", "Interior Finish").
 *
 * All products currently share the same two finish categories, but the
 * many-to-many relationship via a `product_finish_categories` join table
 * allows per-product overrides if future products require different
 * finish sets.
 *
 * PostgreSQL: `finish_categories` table. The sublabel is templated
 * per product at the data access layer using the product marketing name.
 */
interface FinishCategory {
  readonly id: string;
  /** URL-safe slug (e.g., "exterior", "interior"). */
  readonly slug: string;
  /** Display label (e.g., "Exterior Finish"). */
  readonly label: string;
  /**
   * Contextual subtitle templated per product (e.g., "Choose the cladding
   * colour for your The Studio"). Generated at the data access layer by
   * interpolating the product name.
   */
  readonly sublabel: string;
  readonly displayOrder: number;
}

/**
 * A finish category with its child options eagerly loaded.
 * Used within the HydratedProduct type to provide the full finish
 * configuration tree in a single object.
 */
interface HydratedFinishCategory extends FinishCategory {
  /** Available finish options within this category, ordered by displayOrder. */
  readonly options: ReadonlyArray<FinishOption>;
}


// ---------------------------------------------------------------------------
// PRODUCT-LINE-WIDE: STANDARD FEATURES AND WARRANTIES
// ---------------------------------------------------------------------------

/**
 * A standard feature included with every garden room in the product line.
 * These are not per-product; they describe capabilities shared across all
 * sizes (e.g., "Steel Frame Construction", "Full Insulation Package").
 *
 * Displayed in the ProductShowcase section on the right side of the
 * 50/50 hero split.
 *
 * PostgreSQL: `standard_features` table.
 */
interface StandardFeature {
  readonly id: string;
  /**
   * Icon character or identifier rendered alongside the feature title.
   * Resolved to the appropriate glyph or component at the presentation layer.
   */
  readonly icon: string;
  /** Feature title (e.g., "Steel Frame Construction"). */
  readonly title: string;
  /** Brief description of the feature benefit. */
  readonly description: string;
  readonly displayOrder: number;
}

/**
 * A warranty tier that applies to the entire product line.
 *
 * Displayed below the standard features in the ProductShowcase section.
 * The `years` field is stored as an integer to support numeric queries
 * and comparisons; it is formatted as a string for display at the
 * presentation layer.
 *
 * PostgreSQL: `warranty_coverages` table.
 */
interface WarrantyCoverage {
  readonly id: string;
  /** Duration in years (integer for queries; formatted for display at render time). */
  readonly years: number;
  /** Warranty label (e.g., "Structural Warranty"). */
  readonly label: string;
  /** Subtitle describing what the warranty covers (e.g., "Steel frame & foundations"). */
  readonly subtitle: string;
  readonly displayOrder: number;
}


// ---------------------------------------------------------------------------
// MARKETING PAGE-WIDE: SELLING POINTS ("WHY STEEL FRAME")
// ---------------------------------------------------------------------------

/**
 * A key selling point displayed in the "Why Steel Frame" feature section
 * on the garden room marketing page.
 *
 * The `iconId` is a string identifier resolved to a component at the
 * presentation layer (e.g., CustomIcons with name="measureTape"). This
 * avoids storing React nodes in the data layer and keeps the schema
 * serialisable for both compile-time constants and future API responses.
 *
 * PostgreSQL: `selling_points` table.
 */
interface SellingPoint {
  readonly id: string;
  /** Icon identifier resolved at render time (e.g., "measureTape", "tiles"). */
  readonly iconId: string;
  /** Selling point title (e.g., "Made in Our Dublin Factory"). */
  readonly title: string;
  /** Descriptive paragraph explaining the benefit. */
  readonly description: string;
  readonly displayOrder: number;
}


// ---------------------------------------------------------------------------
// MARKETING: FAQS
// ---------------------------------------------------------------------------

/**
 * A frequently asked question for the garden room marketing page.
 *
 * Consumed by both the AccordionFAQ component (visual UI) and the FAQPage
 * JSON-LD structured data generator (routes-metadata.ts). Updates to this
 * data automatically keep both surfaces in sync.
 *
 * The display number (e.g., "01", "02") is derived from `displayOrder`
 * at the presentation layer using zero-padded formatting and is not stored
 * as a separate field. This avoids the fragile pattern of manually
 * maintaining ordinal strings that fall out of sync when items are
 * reordered or removed.
 *
 * PostgreSQL: `faqs` table.
 */
interface FAQ {
  readonly id: string;
  /** The question text (e.g., "Do I need planning permission for a garden room?"). */
  readonly question: string;
  /** The answer text rendered inside the expanded accordion panel. */
  readonly answer: string;
  readonly displayOrder: number;
}


// ---------------------------------------------------------------------------
// MARKETING: TESTIMONIALS
// ---------------------------------------------------------------------------

/**
 * A customer testimonial displayed in the TestimonialGrid component.
 *
 * PostgreSQL: `testimonials` table.
 */
interface Testimonial {
  readonly id: string;
  /** Full testimonial quote text. */
  readonly text: string;
  /** Customer first name. */
  readonly authorName: string;
  /** Customer location (e.g., "Sandyford, Dublin 18"). */
  readonly authorLocation: string;
  /** Path to the customer avatar image (relative to /public). */
  readonly authorImageSrc: string;
  /**
   * Star rating on a 1-5 scale. The presentation layer defaults to 5
   * when this field is not provided, but explicit values are recommended
   * for data completeness.
   */
  readonly rating: number;
  readonly displayOrder: number;
}


// ---------------------------------------------------------------------------
// MARKETING: GALLERY
// ---------------------------------------------------------------------------

/**
 * A gallery image used across the marketing page gallery components.
 *
 * This interface unifies what was previously split between `GalleryItem`
 * (masonry gallery) and `InfiniteGalleryImage` (horizontal strip). The
 * `contexts` array determines which gallery component(s) the image appears
 * in, enabling a single row in the database to serve multiple UI surfaces.
 *
 * PostgreSQL: `gallery_images` table. The `contexts` column is stored as
 * a PostgreSQL text array (text[]) enabling array-contains queries for
 * filtering by gallery context.
 */
interface GalleryImage {
  readonly id: string;
  /** Primary image path (PNG or JPEG fallback). */
  readonly src: string;
  /** WebP-optimised variant for modern browsers. */
  readonly webP: string;
  /** AVIF-optimised variant for maximum compression. */
  readonly avif: string;
  /** Accessible alt text describing the image content. */
  readonly alt: string;
  /** Display title for captions and SEO indexing. */
  readonly title: string;
  /** Category label for filtering (e.g., "Garden Room"). */
  readonly category: string;
  /** Orientation hint for the masonry layout algorithm. */
  readonly orientation: ImageOrientation;
  /**
   * Gallery components in which this image should appear.
   * A single image may be displayed in multiple gallery surfaces.
   */
  readonly contexts: ReadonlyArray<GalleryContext>;
  readonly displayOrder: number;
}


// ---------------------------------------------------------------------------
// MARKETING: CONSTRUCTION COMPARISON
// ---------------------------------------------------------------------------

/**
 * Performance data for a single construction method within one comparison
 * row. Holds the display value, a numeric score for visual indicators,
 * and an explanatory footnote.
 *
 * PostgreSQL: stored as inline JSONB on `comparison_categories`, or
 * normalised into a `comparison_method_data` child table if independent
 * querying of method scores is needed.
 */
interface ComparisonMethodData {
  /** Display value (e.g., "100+ years", "Near zero"). */
  readonly value: string;
  /** Numeric score on a 1-5 scale for visual bar or dot indicators. */
  readonly score: number;
  /** Explanatory footnote providing context for the score. */
  readonly note: string;
}

/**
 * One row of the construction method comparison table, evaluating three
 * construction methods (LGS Steel Frame, Timber Frame, Traditional Brick)
 * against a single performance metric (e.g., Lifespan, Build Time).
 *
 * Consumed by the ComparisonSection component which supports both table
 * and card viewing modes.
 *
 * PostgreSQL: `comparison_categories` table.
 */
interface ComparisonCategory {
  readonly id: string;
  /** Metric label (e.g., "Lifespan", "Build Time", "Fire Resistance"). */
  readonly label: string;
  /** Performance data for the Light Gauge Steel construction method. */
  readonly lgs: ComparisonMethodData;
  /** Performance data for the Timber Frame construction method. */
  readonly wood: ComparisonMethodData;
  /** Performance data for the Traditional Brick construction method. */
  readonly brick: ComparisonMethodData;
  readonly displayOrder: number;
}


// ---------------------------------------------------------------------------
// CONFIGURATOR SESSION / SELECTION (future order flow)
// ---------------------------------------------------------------------------

/**
 * Represents the user's current configurator selections, capturing every
 * choice made during a configuration session.
 *
 * This shape maps to a `configurator_sessions` or `quotes` table when the
 * server-side order pipeline is implemented. Included in the schema so that
 * the complete data flow from product catalogue to purchase is visible in
 * one place.
 *
 * PostgreSQL: `configurator_sessions` table (future).
 */
interface ConfiguratorSelection {
  /** Foreign key referencing the selected product. */
  readonly productId: string;
  /**
   * Foreign key referencing the selected footprint variant, if the
   * product offers multiple footprint options. Undefined when the product
   * has a single fixed footprint.
   */
  readonly footprintVariantId?: string;
  /**
   * Foreign key referencing the selected layout option, if the product
   * supports configurable interior layouts. Undefined when the product
   * has no layout options.
   */
  readonly layoutOptionId?: string;
  /** Foreign key referencing the selected exterior finish option. */
  readonly exteriorFinishId: string;
  /** Foreign key referencing the selected interior finish option. */
  readonly interiorFinishId: string;
  /** Array of foreign keys referencing selected add-on options. */
  readonly addonIds: ReadonlyArray<string>;
  /**
   * Computed total price in euro cents inclusive of 23% VAT, derived
   * from the base product price plus all selected option deltas.
   */
  readonly totalPriceCentsInclVat: number;
}


// ---------------------------------------------------------------------------
// EXPORTS
// ---------------------------------------------------------------------------

export type {
  // Enums and literal types
  BathroomKitchenPolicy,
  ImageOrientation,
  UseCaseContext,
  GalleryContext,

  // Core product entity and hydrated graph
  Product,
  HydratedProduct,
  ProductDimensions,
  ProductImage,

  // Product children
  ProductSpec,
  ProductUseCase,
  FootprintVariant,
  LayoutOption,
  Addon,
  IncludedFeature,
  FinishCategory,
  HydratedFinishCategory,
  FinishOption,

  // Product-line-wide
  StandardFeature,
  WarrantyCoverage,

  // Marketing page
  SellingPoint,
  FAQ,
  Testimonial,
  GalleryImage,
  ComparisonCategory,
  ComparisonMethodData,

  // Session / order
  ConfiguratorSelection,
};
