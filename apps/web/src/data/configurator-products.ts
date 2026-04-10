/**
 * Unified Garden Room Product Data -- Seed Data for All Four Garden Room Sizes
 * =============================================================================
 *
 * PURPOSE:
 * Single source of truth for all garden room product data consumed by both
 * the configurator page and the marketing (/garden-room) page. This file
 * contains the complete hydrated product records that were previously split
 * across configurator-products.ts and garden-room-data.ts.
 *
 * The consolidation follows the unified data model defined in
 * `../types/garden-room.ts`. Every product is described by a single
 * `HydratedProduct` record that carries identity, pricing, dimensions,
 * availability, images, specs, use cases, layout options, addons, included
 * features, and finish categories in one cohesive entity.
 *
 * PRODUCTS (4 total):
 * | Slug        | Name         | Area  | Base (incl. VAT) | B&K Policy     | Available |
 * |-------------|--------------|-------|------------------|----------------|-----------|
 * | compact-15  | The Compact  | 15 m2 | EUR 29,500       | not-available  | Yes       |
 * | studio-25   | The Studio   | 25 m2 | EUR 39,500       | layout-bundled | Yes       |
 * | living-35   | The Living   | 35 m2 | EUR 68,500       | included       | Yes       |
 * | grand-45    | The Grand    | 45 m2 | EUR 83,500       | included       | Yes       |
 *
 * PRICING:
 * All monetary values are stored in euro cents inclusive of 23% VAT,
 * matching the SQL column type (integer cents). The frontend formats
 * cents to display euros using locale-aware formatting.
 *
 * BATHROOM AND KITCHEN RULES:
 * - 15 m2: cannot add bathroom and kitchen (bathroomKitchenPolicy = "not-available")
 * - 25 m2: determined by the selected layout option (bathroomKitchenPolicy = "layout-bundled")
 * - 35 and 45 m2: included in base price with plumbing (bathroomKitchenPolicy = "included"),
 *   represented via the includedFeatures array
 *
 * FINISH PREVIEW IMAGES:
 * Selecting a finish switches the hero image to a photograph from
 * /public/resource/garden-room/product-config/. Each product size has
 * dedicated exterior finish images that depict the building at its actual
 * width (e.g., exterior_finish_charcoal_5m.png for 3m x 5m and 5m x 5m).
 * Products with multiple footprint variants carry an imagePathByFootprint
 * lookup so the UI can swap the preview when the variant changes.
 * Interior finish images are shared across all products.
 *
 * LEGACY REMOVALS:
 * The programmatic floor plan feature (aperture arrays, wall identifiers,
 * dimension labels, SVG floor plan image paths) has been retired. Footprint
 * variant data is preserved for dimensional selection but carries no floor
 * plan rendering metadata.
 *
 * =============================================================================
 */

import type {
  FinishOption,
  HydratedFinishCategory,
  HydratedProduct,
  FootprintVariant,
  LayoutOption,
} from '../types/garden-room';


/* =============================================================================
   SECTION 1: SHARED FINISH OPTIONS AND PRODUCT-SPECIFIC BUILDERS
   -----------------------------------------------------------------------------
   Maps to the finish_options and product_variant_finish_images tables.

   Exterior cladding finish options are product-specific: each garden room
   size has dedicated exterior finish preview images that accurately depict
   the building at its actual width. The image file naming convention uses
   a dimension suffix matching the front-facing width of the product
   (e.g., _5m, _6m, _7m, _7_5m, _9m).

   Interior wall finish options are shared across all products because the
   interior appearance does not change with external dimensions.

   Image files are located in:
     /public/resource/garden-room/product-config/
   ============================================================================= */

/** Base directory path for all product configurator finish preview images. */
const EXTERIOR_IMAGE_DIR = '/resource/garden-room/product-config';

/**
 * Constructs the full public-relative path for an exterior finish image
 * in the specified format.
 *
 * All exterior finish source images are PNG. The optimise-images script
 * generates WebP and AVIF siblings with the same stem, so the only
 * parameter that varies between formats is the file extension.
 *
 * @param colourKey - The lowercase colour identifier (e.g., 'charcoal').
 * @param sizeSuffix - The dimension suffix (e.g., '5m', '7_5m').
 * @param ext - The target file extension ('png', 'webp', or 'avif').
 * @returns Path relative to /public (e.g., '/resource/.../exterior_finish_charcoal_5m.png').
 */
function buildExteriorImagePath(colourKey: string, sizeSuffix: string, ext: string = 'png'): string {
  return `${EXTERIOR_IMAGE_DIR}/exterior_finish_${colourKey}_${sizeSuffix}.${ext}`;
}

/**
 * Colour metadata for exterior cladding finish options.
 *
 * Each entry defines a single finish colour with its swatch values and
 * the lowercase key used in image file names. Adding a new colour requires
 * appending one entry here and supplying the corresponding image assets.
 */
const EXTERIOR_COLOUR_DEFINITIONS = [
  { id: 'ef-charcoal', name: 'Charcoal', colourKey: 'charcoal', color: '#36454F', accent: '#2B3840' },
  { id: 'ef-teak',     name: 'Teak',     colourKey: 'teak',     color: '#B5764C', accent: '#9A6340' },
  { id: 'ef-walnut',   name: 'Walnut',   colourKey: 'walnut',   color: '#5C4033', accent: '#4A3228' },
] as const;

/**
 * Builds product-specific exterior finish options by resolving the correct
 * image file for a given product's front-facing dimension.
 *
 * For products with a single footprint (Compact 15, Living 35), only the
 * defaultSizeSuffix is needed. For products with multiple footprint variants
 * (Studio 25, Grand 45), the optional variantSuffixMap provides a slug-keyed
 * lookup that the configurator UI uses to swap the preview image when the
 * customer changes the selected footprint.
 *
 * Database mapping: each generated FinishOption maps to one row in
 * finish_options; each entry in imagePathByFootprint maps to one row in
 * the product_variant_finish_images junction table.
 *
 * @param defaultSizeSuffix - The dimension suffix for the product's primary
 *   or only footprint (e.g., '5m', '7m', '9m').
 * @param variantSuffixMap - Optional record mapping footprint variant slugs
 *   to their corresponding dimension suffixes, enabling per-variant image
 *   resolution for products with multiple footprints.
 * @returns An ordered array of FinishOption records for exterior cladding.
 */
function buildExteriorFinishOptions(
  defaultSizeSuffix: string,
  variantSuffixMap?: Readonly<Record<string, string>>,
): ReadonlyArray<FinishOption> {
  return EXTERIOR_COLOUR_DEFINITIONS.map((def, index) => {
    /* Build the per-variant image path lookups when the product offers
       multiple footprint options (e.g., Studio 5x5 vs 4.15x6).
       Three parallel records are generated -- one per image format --
       mirroring the three columns on the junction table. */
    const imagePathByFootprint = variantSuffixMap
      ? Object.fromEntries(
          Object.entries(variantSuffixMap).map(
            ([slug, suffix]) => [slug, buildExteriorImagePath(def.colourKey, suffix)],
          ),
        )
      : undefined;

    const imageWebPByFootprint = variantSuffixMap
      ? Object.fromEntries(
          Object.entries(variantSuffixMap).map(
            ([slug, suffix]) => [slug, buildExteriorImagePath(def.colourKey, suffix, 'webp')],
          ),
        )
      : undefined;

    const imageAvifByFootprint = variantSuffixMap
      ? Object.fromEntries(
          Object.entries(variantSuffixMap).map(
            ([slug, suffix]) => [slug, buildExteriorImagePath(def.colourKey, suffix, 'avif')],
          ),
        )
      : undefined;

    return {
      id: def.id,
      finishCategoryId: 'fc-exterior',
      name: def.name,
      color: def.color,
      accent: def.accent,
      imagePath: buildExteriorImagePath(def.colourKey, defaultSizeSuffix),
      imageWebP: buildExteriorImagePath(def.colourKey, defaultSizeSuffix, 'webp'),
      imageAvif: buildExteriorImagePath(def.colourKey, defaultSizeSuffix, 'avif'),
      ...(imagePathByFootprint != null ? { imagePathByFootprint } : {}),
      ...(imageWebPByFootprint != null ? { imageWebPByFootprint } : {}),
      ...(imageAvifByFootprint != null ? { imageAvifByFootprint } : {}),
      displayOrder: index + 1,
    };
  });
}

/**
 * Interior wall finish options available for all garden room sizes.
 * Applied to internal plasterboard lining surfaces. Interior appearance
 * is independent of external dimensions, so these options are shared
 * across all products.
 *
 * Database: finish_options (category_slug = "interior")
 */
const INTERIOR_FINISH_OPTIONS: ReadonlyArray<FinishOption> = [
  {
    id: 'if-matt',
    finishCategoryId: 'fc-interior',
    name: 'Matt',
    color: '#C4BFB6',
    accent: '#A8A299',
    imagePath: '/resource/garden-room/product-config/interior_finish_matt.png',
    imageWebP: '/resource/garden-room/product-config/interior_finish_matt.webp',
    imageAvif: '/resource/garden-room/product-config/interior_finish_matt.avif',
    displayOrder: 1,
  },
  {
    id: 'if-cloth',
    finishCategoryId: 'fc-interior',
    name: 'Cloth',
    color: '#E8E0D4',
    accent: '#D4CAB8',
    imagePath: '/resource/garden-room/product-config/interior_finish_cloth.png',
    imageWebP: '/resource/garden-room/product-config/interior_finish_cloth.webp',
    imageAvif: '/resource/garden-room/product-config/interior_finish_cloth.avif',
    displayOrder: 2,
  },
];


/* =============================================================================
   SECTION 2: SHARED PRICING NOTE
   -----------------------------------------------------------------------------
   Pricing footnote displayed below the total price on overview and summary
   steps. All prices include VAT at the Irish standard rate (23%).
   ============================================================================= */

/** Pricing footnote displayed below the configured total on every product. */
const PRICING_NOTE = 'Price includes VAT \u00B7 Ts & Cs apply';


/* =============================================================================
   SECTION 3: HELPER -- FINISH CATEGORY BUILDER
   -----------------------------------------------------------------------------
   Constructs a pair of HydratedFinishCategory entries (exterior + interior)
   for a given product. The exterior options are product-specific (generated
   by buildExteriorFinishOptions), while interior options are shared across
   all products. The sublabel text is personalised with the product marketing
   name to provide contextual guidance in the configurator UI.

   Maps to finish_categories table rows with eagerly loaded finish_options.
   ============================================================================= */

/**
 * Builds the standard two-category finish configuration for a given product.
 * The sublabel text is personalised with the product marketing name, and
 * the exterior options are resolved from the product's dimension suffix.
 *
 * @param productName - The marketing name of the product (e.g., "The Studio").
 * @param exteriorOptions - Product-specific exterior finish options generated
 *   by buildExteriorFinishOptions with the correct image paths for this
 *   product's footprint dimensions.
 * @returns A two-element tuple: [exteriorCategory, interiorCategory].
 */
function buildFinishCategories(
  productName: string,
  exteriorOptions: ReadonlyArray<FinishOption>,
): ReadonlyArray<HydratedFinishCategory> {
  return [
    {
      id: 'fc-exterior',
      slug: 'exterior',
      label: 'Exterior Finish',
      sublabel: `Choose the cladding colour for your ${productName}`,
      displayOrder: 1,
      options: exteriorOptions,
    },
    {
      id: 'fc-interior',
      slug: 'interior',
      label: 'Interior Finish',
      sublabel: `Select the interior wall finish for your ${productName}`,
      displayOrder: 2,
      options: INTERIOR_FINISH_OPTIONS,
    },
  ];
}


/* =============================================================================
   SECTION 4: PRODUCT DEFINITIONS
   -----------------------------------------------------------------------------
   Each HydratedProduct instance below represents one row in the products
   table plus related child rows in:
     - product_specs
     - product_use_cases
     - addons
     - included_features
     - footprint_variants
     - layout_options
     - finish_categories (with eagerly loaded finish_options)
     - product_images

   Products are listed in ascending order by floor area.

   PRICING CONVENTION:
   All prices are in euro cents inclusive of 23% VAT.
   Example: EUR 26,000 = 2_600_000 cents.

   BATHROOM AND KITCHEN:
   - 15 m2: not available (bathroomKitchenPolicy = "not-available")
   - 25 m2: determined by layout option (bathroomKitchenPolicy = "layout-bundled")
   - 35, 45 m2: included in base price via includedFeatures array
   ============================================================================= */

/**
 * 15 m2 -- The Compact
 *
 * The smallest garden room, designed for focused single-purpose use.
 * Exempt from planning permission under current Irish legislation.
 * Bathroom and kitchen cannot be added to this model.
 */
const COMPACT_15: HydratedProduct = {
  /* --- Identity -------------------------------------------------- */
  id: 'cp-compact-15',
  slug: 'compact-15',
  name: 'The Compact',
  tagline: 'Your private creative sanctuary',
  description:
    'At 15m\u00B2, The Compact is the fastest way to a dedicated workspace in your garden \u2014 built in just 6\u20138 weeks with no planning permission required. Our Dublin-manufactured steel frame and high-performance insulation keep the space warm and quiet year-round, so whether you use it as a home office, art studio, or personal retreat, it feels like a proper room from day one. Designed for focus, engineered for comfort, and priced to make the spare-bedroom compromise a thing of the past.',

  /* --- Dimensions ------------------------------------------------ */
  dimensions: {
    widthM: 3.0,
    depthM: 5.0,
    heightM: 2.4,
    areaM2: 15,
  },
  dimensionsDisplay: '5.0m \u00D7 3.0m',

  /* --- Pricing --------------------------------------------------- */
  basePriceCentsInclVat: 2_950_000,
  pricingNote: PRICING_NOTE,
  bathroomKitchenPolicy: 'not-available',

  /* --- Availability ---------------------------------------------- */
  available: true,
  inStock: true,
  planningPermission: false,
  leadTime: '6\u20138 weeks',

  /* --- Call to action --------------------------------------------- */
  ctaText: 'Customise',
  ctaLink: '/garden-rooms/configure/compact-15',

  /* --- Sort ------------------------------------------------------ */
  displayOrder: 1,

  /* --- Optional marketing modifiers ------------------------------ */
  glazingDetails: [
    { label: 'Front window',   dimensions: '700mm \u00D7 2100mm' },
    { label: 'French door',   dimensions: '1200mm \u00D7 2100mm' },
  ],

  /* --- Images ---------------------------------------------------- */
  images: [
    {
      id: 'img-compact-hero',
      productId: 'cp-compact-15',
      src: '/resource/garden-room/garden-room4.png',
      webP: '/resource/garden-room/garden-room4.webp',
      avif: '/resource/garden-room/garden-room4.avif',
      alt: 'The Compact 15m\u00B2 steel frame garden room',
      role: 'hero',
      displayOrder: 1,
    },
  ],

  /* --- Specifications -------------------------------------------- */
  specs: [
    { id: 'sp-compact-01', productId: 'cp-compact-15', label: 'Dimensions',  value: '5.0m \u00D7 3.0m',                displayOrder: 1 },
    { id: 'sp-compact-02', productId: 'cp-compact-15', label: 'Area',        value: '15 m\u00B2',                       displayOrder: 2 },
    { id: 'sp-compact-03', productId: 'cp-compact-15', label: 'Structure',   value: 'EN1090 Light Gauge Steel frame',       displayOrder: 3 },
    { id: 'sp-compact-04', productId: 'cp-compact-15', label: 'Insulation',  value: '90mm rock wool + 100mm EPS',    displayOrder: 4 },
    { id: 'sp-compact-05', productId: 'cp-compact-15', label: 'Flooring',    value: 'Laminated flooring',            displayOrder: 5 },
    { id: 'sp-compact-06', productId: 'cp-compact-15', label: 'Glazing',     value: 'Tilt & turn window + French door', displayOrder: 6 },
    { id: 'sp-compact-07', productId: 'cp-compact-15', label: 'Electrics',   value: 'Full consumer unit ready',      displayOrder: 7 },
    { id: 'sp-compact-08', productId: 'cp-compact-15', label: 'Roof',        value: 'EPDM long life roof',           displayOrder: 8 },
  ],

  /* --- Use cases ------------------------------------------------- */
  useCases: [
    { id: 'uc-compact-c1', productId: 'cp-compact-15', text: 'Home office',           context: 'card',       displayOrder: 1 },
    { id: 'uc-compact-c2', productId: 'cp-compact-15', text: 'Art studio',            context: 'card',       displayOrder: 2 },
    { id: 'uc-compact-c3', productId: 'cp-compact-15', text: 'Yoga room',             context: 'card',       displayOrder: 3 },
    { id: 'uc-compact-c4', productId: 'cp-compact-15', text: 'Gym',                   context: 'card',       displayOrder: 4 },
    { id: 'uc-compact-q1', productId: 'cp-compact-15', text: 'Home Office',           context: 'quick-view', displayOrder: 5 },
    { id: 'uc-compact-q2', productId: 'cp-compact-15', text: 'Art Studio',            context: 'quick-view', displayOrder: 6 },
    { id: 'uc-compact-q3', productId: 'cp-compact-15', text: 'Yoga & Wellness Room',  context: 'quick-view', displayOrder: 7 },
    { id: 'uc-compact-q4', productId: 'cp-compact-15', text: 'Music Practice',        context: 'quick-view', displayOrder: 8 },
    { id: 'uc-compact-q5', productId: 'cp-compact-15', text: 'Home Gym',              context: 'quick-view', displayOrder: 9 },
  ],

  /* --- Footprint variants ---------------------------------------- */
  footprintVariants: [],

  /* --- Layout options -------------------------------------------- */
  layoutOptions: [],

  /* --- Addons ---------------------------------------------------- */
  addons: [
    {
      id: 'ao-compact-triple-glazing',
      productId: 'cp-compact-15',
      slug: 'triple-glazing',
      name: 'Triple Glazing Upgrade',
      description: 'Enhanced thermal and acoustic insulation for all glazing',
      priceCentsInclVat: 80_000,
      iconId: 'glazing',
      displayOrder: 1,
    },
    {
      id: 'ao-compact-sauna-room',
      productId: 'cp-compact-15',
      slug: 'sauna-room',
      name: 'Sauna Room',
      description: 'Self-contained infrared sauna room with cedar lining',
      priceCentsInclVat: 650_000,
      iconId: 'sauna',
      displayOrder: 2,
    },
  ],

  /* --- Included features ----------------------------------------- */
  includedFeatures: [],

  /* --- Finish categories -----------------------------------------
     Compact 15 base footprint: 3m x 5m -> uses the '5m' image set.
     No footprint variants, so imagePathByFootprint is omitted.
     ---------------------------------------------------------------- */
  finishCategories: buildFinishCategories('The Compact', buildExteriorFinishOptions('5m')),

  /* --- Legacy compatibility fields ------------------------------- */
  image: {
    src:  '/resource/garden-room/garden-room4.png',
    webP: '/resource/garden-room/garden-room4.webp',
    avif: '/resource/garden-room/garden-room4.avif',
    alt:  'The Compact 15m\u00B2 steel frame garden room',
  },
  floorPlan: {
    apertures: [
      { type: 'tilt-turn-window', wall: 'north', widthMm: 700,  heightMm: 2100 },
      { type: 'french-door',      wall: 'east',  widthMm: 1200, heightMm: 2100 },
    ],
    dimensionLabels: { width: '5.0m', depth: '3.0m' },
  },
  floorPlanImagePath: '/resource/floorplan/3m-x-5m.svg',
};


/**
 * 25 m2 -- The Studio
 *
 * The most popular model, sitting at the maximum size for exempted
 * development under current Irish planning legislation. Bathroom and
 * kitchen availability is determined by the selected layout option.
 */
const STUDIO_25: HydratedProduct = {
  /* --- Identity -------------------------------------------------- */
  id: 'cp-studio-25',
  slug: 'studio-25',
  name: 'The Studio',
  tagline: 'Where work meets living',
  description:
    'Our most popular garden room for good reason \u2014 at 25m\u00B2, The Studio gives you the maximum floor area allowed without planning permission in Ireland. Choose from two footprint options and three layout configurations: an open-plan studio, a self-contained en suite, or a partitioned bedroom with kitchen and bathroom. Whether it\u2019s a home office with a meeting area, a music studio, a home gym, or a guest room with its own front door, The Studio adapts to how you actually want to use the space. Same Dublin-built steel frame, same turnkey finish \u2014 just more room to work with.',

  /* --- Dimensions ------------------------------------------------ */
  dimensions: {
    widthM: 5,
    depthM: 5,
    heightM: 2.4,
    areaM2: 25,
  },
  dimensionsDisplay: '5m \u00D7 5m or 6m \u00D7 4.15m',

  /* --- Pricing --------------------------------------------------- */
  basePriceCentsInclVat: 3_950_000,
  pricingNote: PRICING_NOTE,
  bathroomKitchenPolicy: 'layout-bundled',

  /* --- Availability ---------------------------------------------- */
  available: true,
  inStock: true,
  planningPermission: false,
  leadTime: '8\u201310 weeks',

  /* --- Call to action --------------------------------------------- */
  ctaText: 'Customise',
  ctaLink: '/garden-rooms/configure/studio-25',

  /* --- Optional marketing modifiers ------------------------------ */
  badge: 'Most Popular',
  glazingDetails: [
    { label: 'Front window',    dimensions: '700mm \u00D7 2100mm' },
    { label: 'French door',     dimensions: '1600mm \u00D7 2100mm' },
  ],

  /* --- Sort ------------------------------------------------------ */
  displayOrder: 2,

  /* --- Images ---------------------------------------------------- */
  images: [
    {
      id: 'img-studio-hero',
      productId: 'cp-studio-25',
      src: '/resource/garden-room/garden-room1.png',
      webP: '/resource/garden-room/garden-room1.webp',
      avif: '/resource/garden-room/garden-room1.avif',
      alt: 'The Studio 25m\u00B2 steel frame garden room',
      role: 'hero',
      displayOrder: 1,
    },
  ],

  /* --- Specifications -------------------------------------------- */
  specs: [
    { id: 'sp-studio-01', productId: 'cp-studio-25', label: 'Dimensions',  value: '5.0m \u00D7 5.0m',                  displayOrder: 1 },
    { id: 'sp-studio-02', productId: 'cp-studio-25', label: 'Area',        value: '25 m\u00B2',                         displayOrder: 2 },
    { id: 'sp-studio-03', productId: 'cp-studio-25', label: 'Structure',   value: 'EN1090 Light Gauge Steel frame',         displayOrder: 3 },
    { id: 'sp-studio-04', productId: 'cp-studio-25', label: 'Insulation',  value: '90mm rock wool + 100mm EPS',      displayOrder: 4 },
    { id: 'sp-studio-05', productId: 'cp-studio-25', label: 'Flooring',    value: 'Laminated flooring',              displayOrder: 5 },
    { id: 'sp-studio-06', productId: 'cp-studio-25', label: 'Glazing',     value: 'Tilt & turn window + French door', displayOrder: 6 },
    { id: 'sp-studio-07', productId: 'cp-studio-25', label: 'Electrics',   value: 'Full consumer unit ready',        displayOrder: 7 },
    { id: 'sp-studio-08', productId: 'cp-studio-25', label: 'Roof',        value: 'EPDM long life roof',             displayOrder: 8 },
  ],

  /* --- Use cases ------------------------------------------------- */
  useCases: [
    { id: 'uc-studio-c1', productId: 'cp-studio-25', text: 'Home office',                 context: 'card',       displayOrder: 1 },
    { id: 'uc-studio-c2', productId: 'cp-studio-25', text: 'Home gym',                    context: 'card',       displayOrder: 2 },
    { id: 'uc-studio-c3', productId: 'cp-studio-25', text: 'Music studio',                context: 'card',       displayOrder: 3 },
    { id: 'uc-studio-c4', productId: 'cp-studio-25', text: '1 bed room en suite',         context: 'card',       displayOrder: 4 },
    { id: 'uc-studio-c5', productId: 'cp-studio-25', text: 'Kitchen Optional',            context: 'card',       displayOrder: 5 },
    { id: 'uc-studio-q1', productId: 'cp-studio-25', text: 'Office + Meeting Room',       context: 'quick-view', displayOrder: 6 },
    { id: 'uc-studio-q2', productId: 'cp-studio-25', text: 'Guest Suite',                 context: 'quick-view', displayOrder: 7 },
    { id: 'uc-studio-q3', productId: 'cp-studio-25', text: 'Sauna Getaway',               context: 'quick-view', displayOrder: 8 },
    { id: 'uc-studio-q4', productId: 'cp-studio-25', text: 'Design Studio',               context: 'quick-view', displayOrder: 9 },
    { id: 'uc-studio-q5', productId: 'cp-studio-25', text: 'Home Cinema',                 context: 'quick-view', displayOrder: 10 },
  ],

  /* --- Footprint variants ---------------------------------------- */
  footprintVariants: [
    {
      id: 'fpv-studio-5x5',
      productId: 'cp-studio-25',
      slug: '5x5',
      label: '5.0m x 5.0m',
      description: 'Square footprint',
      widthM: 5.0,
      depthM: 5.0,
      areaM2: 25,
      priceDeltaCentsInclVat: 0,
      displayOrder: 1,
    },
    {
      id: 'fpv-studio-4x6',
      productId: 'cp-studio-25',
      slug: '4x6',
      label: '4.15m x 6.0m',
      description: 'Rectangular footprint',
      widthM: 4.15,
      depthM: 6.0,
      areaM2: 24.9,
      priceDeltaCentsInclVat: 0,
      displayOrder: 2,
    },
  ] satisfies ReadonlyArray<FootprintVariant>,

  /* --- Layout options -------------------------------------------- */
  layoutOptions: [
    {
      id: 'lo-studio-box',
      productId: 'cp-studio-25',
      slug: 'box',
      name: 'Box',
      description: 'Open plan with no internal walls. Maximum flexibility for your space.',
      priceDeltaCentsInclVat: 0,
      includesBathroom: false,
      includesKitchen: false,
      includesBedroomWall: false,
      displayOrder: 1,
    },
    {
      id: 'lo-studio-en-suite',
      productId: 'cp-studio-25',
      slug: 'en-suite',
      name: 'En Suite',
      description: 'Open living area with integrated bathroom and kitchen. No bedroom wall.',
      priceDeltaCentsInclVat: 1_200_000,
      includesBathroom: true,
      includesKitchen: true,
      includesBedroomWall: false,
      displayOrder: 2,
    },
    {
      id: 'lo-studio-bedroom',
      productId: 'cp-studio-25',
      slug: 'bedroom',
      name: 'Bedroom',
      description: 'Separate bedroom with wall and door, plus bathroom and kitchen.',
      priceDeltaCentsInclVat: 1_400_000,
      includesBathroom: true,
      includesKitchen: true,
      includesBedroomWall: true,
      displayOrder: 3,
    },
  ] satisfies ReadonlyArray<LayoutOption>,

  /* --- Addons ---------------------------------------------------- */
  addons: [
    {
      id: 'ao-studio-triple-glazing',
      productId: 'cp-studio-25',
      slug: 'triple-glazing',
      name: 'Triple Glazing Upgrade',
      description: 'Enhanced thermal and acoustic insulation for all glazing',
      priceCentsInclVat: 100_000,
      iconId: 'glazing',
      displayOrder: 1,
    },
    {
      id: 'ao-studio-sauna-room',
      productId: 'cp-studio-25',
      slug: 'sauna-room',
      name: 'Sauna Room',
      description: 'Self-contained infrared sauna cabin with cedar lining',
      priceCentsInclVat: 650_000,
      iconId: 'sauna',
      displayOrder: 2,
    },
  ],

  /* --- Included features ----------------------------------------- */
  includedFeatures: [],

  /* --- Finish categories -----------------------------------------
     Studio 25 offers two footprints: 5m x 5m (default) and 6m x 4.15m.
     The default imagePath points to the '5m' set; imagePathByFootprint
     maps each variant slug to the correct dimension-specific image.
     ---------------------------------------------------------------- */
  finishCategories: buildFinishCategories(
    'The Studio',
    buildExteriorFinishOptions('5m', { '5x5': '5m', '4x6': '6m' }),
  ),

  /* --- Legacy compatibility fields ------------------------------- */
  image: {
    src:  '/resource/garden-room/garden-room1.png',
    webP: '/resource/garden-room/garden-room1.webp',
    avif: '/resource/garden-room/garden-room1.avif',
    alt:  'The Studio 25m\u00B2 steel frame garden room',
  },
  floorPlan: {
    apertures: [
      { type: 'tilt-turn-window', wall: 'north', widthMm: 700,  heightMm: 2100 },
      { type: 'french-door',      wall: 'east',  widthMm: 1600, heightMm: 2100 },
    ],
    dimensionLabels: { width: '5.0m', depth: '5.0m' },
  },
  floorPlanVariants: [
    {
      id: 'fpv-studio-5x5',
      productId: 'cp-studio-25',
      slug: '5x5',
      label: '5.0m x 5.0m',
      description: 'Square footprint',
      widthM: 5.0,
      depthM: 5.0,
      areaM2: 25,
      priceDeltaCentsInclVat: 0,
      displayOrder: 1,
      floorPlan: {
        apertures: [
          { type: 'tilt-turn-window', wall: 'south', widthMm: 700,  heightMm: 2100 },
          { type: 'sliding-door',     wall: 'south', widthMm: 1600, heightMm: 2100 },
        ],
        dimensionLabels: { width: '5.0m', depth: '5.0m' },
      },
      floorPlanImagePath: '/resource/floorplan/5m-x-5m-box.svg',
      floorPlanImagesByLayout: {
        'box':      '/resource/floorplan/5m-x-5m-box.svg',
        'en-suite': '/resource/floorplan/5m-x-5m-ensuit.svg',
        'bedroom':  '/resource/floorplan/5m-x-5m-bedroom.svg',
      },
    },
    {
      id: 'fpv-studio-4x6',
      productId: 'cp-studio-25',
      slug: '4x6',
      label: '4.15m x 6.0m',
      description: 'Rectangular footprint',
      widthM: 4.15,
      depthM: 6.0,
      areaM2: 24.9,
      priceDeltaCentsInclVat: 0,
      displayOrder: 2,
      floorPlan: {
        apertures: [
          { type: 'tilt-turn-window', wall: 'south', widthMm: 700,  heightMm: 2100 },
          { type: 'sliding-door',     wall: 'south', widthMm: 1600, heightMm: 2100 },
        ],
        dimensionLabels: { width: '6.0m', depth: '4.15m' },
      },
      floorPlanImagePath: '/resource/floorplan/6m-x-4.15m-box.svg',
      floorPlanImagesByLayout: {
        'box':      '/resource/floorplan/6m-x-4.15m-box.svg',
        'en-suite': '/resource/floorplan/6m-x-4.15m-ensuit.svg',
        'bedroom':  '/resource/floorplan/6m-x-4.15m-bedroom.svg',
      },
    },
  ],
};


/**
 * 35 m2 -- The Living
 *
 * Mid-range model using a portal steel frame for column-free interiors.
 * Requires planning permission under current legislation. Bathroom,
 * kitchen, and plumbing connections are included in the base price.
 */
const LIVING_35: HydratedProduct = {
  /* --- Identity -------------------------------------------------- */
  id: 'cp-living-35',
  slug: 'living-35',
  name: 'The Living',
  tagline: 'Space to grow into',
  description:
    'At 35m\u00B2, The Living is a fully equipped garden room with kitchen and bathroom included as standard \u2014 large enough for a self-contained guest suite, a private retreat for older teenagers, or a rental-ready unit that adds income to your property. The column-free steel frame interior is entirely yours to define: zone it for two desks and a breakout area, set up a home gym alongside an office nook, or create a family media room that keeps the main house peaceful.',

  /* --- Dimensions ------------------------------------------------ */
  dimensions: {
    widthM: 7.0,
    depthM: 5.0,
    heightM: 2.4,
    areaM2: 35,
  },
  dimensionsDisplay: '7.0m \u00D7 5.0m',

  /* --- Pricing --------------------------------------------------- */
  basePriceCentsInclVat: 6_850_000,
  pricingNote: PRICING_NOTE,
  bathroomKitchenPolicy: 'included',

  /* --- Availability ---------------------------------------------- */
  available: true,
  inStock: true,
  planningPermission: true,
  leadTime: '10\u201312 weeks',

  /* --- Call to action --------------------------------------------- */
  ctaText: 'Customise',
  ctaLink: '/garden-rooms/configure/living-35',

  /* --- Optional marketing modifiers ------------------------------ */
  glazingDetails: [
    { label: 'Front window',    dimensions: '700mm \u00D7 2100mm' },
    { label: 'French door',     dimensions: '1600mm \u00D7 2100mm' },
  ],

  /* --- Sort ------------------------------------------------------ */
  displayOrder: 3,

  /* --- Images ---------------------------------------------------- */
  images: [
    {
      id: 'img-living-hero',
      productId: 'cp-living-35',
      src: '/resource/garden-room/garden-room2.png',
      webP: '/resource/garden-room/garden-room2.webp',
      avif: '/resource/garden-room/garden-room2.avif',
      alt: 'The Living 35m\u00B2 steel frame garden room',
      role: 'hero',
      displayOrder: 1,
    },
  ],

  /* --- Specifications -------------------------------------------- */
  specs: [
    { id: 'sp-living-01', productId: 'cp-living-35', label: 'Dimensions',  value: '7.0m \u00D7 5.0m',                           displayOrder: 1 },
    { id: 'sp-living-02', productId: 'cp-living-35', label: 'Area',        value: '35 m\u00B2',                                  displayOrder: 2 },
    { id: 'sp-living-03', productId: 'cp-living-35', label: 'Structure',   value: 'EN1090 Light Gauge Steel frame',                     displayOrder: 3 },
    { id: 'sp-living-04', productId: 'cp-living-35', label: 'Insulation',  value: '90mm rock wool + 100mm EPS',                  displayOrder: 4 },
    { id: 'sp-living-05', productId: 'cp-living-35', label: 'Flooring',    value: 'Laminated flooring',                          displayOrder: 5 },
    { id: 'sp-living-06', productId: 'cp-living-35', label: 'Glazing',     value: '2\u00D7 tilt & turn windows + sliding door',  displayOrder: 6 },
    { id: 'sp-living-07', productId: 'cp-living-35', label: 'Electrics',   value: 'Full consumer unit ready',                    displayOrder: 7 },
    { id: 'sp-living-08', productId: 'cp-living-35', label: 'Roof',        value: 'EPDM long life roof',                         displayOrder: 8 },
    { id: 'sp-living-09', productId: 'cp-living-35', label: 'Plumbing',    value: 'Bathroom + kitchen included',                 displayOrder: 9 },
  ],

  /* --- Use cases ------------------------------------------------- */
  useCases: [
    { id: 'uc-living-c1', productId: 'cp-living-35', text: 'Guest suite',                  context: 'card',       displayOrder: 1 },
    { id: 'uc-living-c2', productId: 'cp-living-35', text: 'Teen retreat',                 context: 'card',       displayOrder: 2 },
    { id: 'uc-living-c3', productId: 'cp-living-35', text: 'Rental unit',                  context: 'card',       displayOrder: 3 },
    { id: 'uc-living-c4', productId: 'cp-studio-25', text: '1 bed room en suite',          context: 'card',       displayOrder: 4 },
    { id: 'uc-living-c5', productId: 'cp-studio-25', text: 'Kitchen & Bathroom Included',  context: 'card',       displayOrder: 5 },
    { id: 'uc-living-q1', productId: 'cp-living-35', text: 'Multi-Desk Workspace',         context: 'quick-view', displayOrder: 6 },
    { id: 'uc-living-q2', productId: 'cp-living-35', text: 'Home Gym + Office',            context: 'quick-view', displayOrder: 7 },
    { id: 'uc-living-q3', productId: 'cp-living-35', text: 'Teen retreat',                 context: 'quick-view', displayOrder: 8 },
    { id: 'uc-living-q4', productId: 'cp-living-35', text: 'Family Room',                  context: 'quick-view', displayOrder: 9 },
    { id: 'uc-living-q5', productId: 'cp-living-35', text: 'Rental unit',                  context: 'quick-view', displayOrder: 10 },
  ],

  /* --- Footprint variants ---------------------------------------- */
  footprintVariants: [],

  /* --- Layout options -------------------------------------------- */
  layoutOptions: [],

  /* --- Addons ---------------------------------------------------- */
  addons: [
    {
      id: 'ao-living-triple-glazing',
      productId: 'cp-living-35',
      slug: 'triple-glazing',
      name: 'Triple Glazing Upgrade',
      description: 'Enhanced thermal and acoustic insulation for all glazing',
      priceCentsInclVat: 150_000,
      iconId: 'glazing',
      displayOrder: 1,
    },
    {
      id: 'ao-living-sauna-room',
      productId: 'cp-living-35',
      slug: 'sauna-room',
      name: 'Sauna Room',
      description: 'Self-contained infrared sauna cabin with cedar lining',
      priceCentsInclVat: 650_000,
      iconId: 'sauna',
      displayOrder: 2,
    },
  ],

  /* --- Included features ----------------------------------------- */
  includedFeatures: [
    {
      id: 'if-living-bk',
      productId: 'cp-living-35',
      name: 'Bathroom + Kitchen',
      description: 'Full plumbing connection with bathroom, kitchen facilities included',
      displayOrder: 1,
    },
    {
      id: 'if-living-plumbing',
      productId: 'cp-living-35',
      name: 'Plumbing Connection',
      description: 'Hot and cold water supply, waste drainage, and soil stack connection',
      displayOrder: 2,
    },
  ],

  /* --- Finish categories -----------------------------------------
     Living 35 base footprint: 7m x 5m -> uses the '7m' image set.
     No footprint variants, so imagePathByFootprint is omitted.
     ---------------------------------------------------------------- */
  finishCategories: buildFinishCategories('The Living', buildExteriorFinishOptions('7m')),

  /* --- Legacy compatibility fields ------------------------------- */
  image: {
    src:  '/resource/garden-room/garden-room2.png',
    webP: '/resource/garden-room/garden-room2.webp',
    avif: '/resource/garden-room/garden-room2.avif',
    alt:  'The Living 35m\u00B2 steel frame garden room',
  },
  floorPlan: {
    apertures: [
      { type: 'tilt-turn-window', wall: 'north', widthMm: 700,  heightMm: 2100 },
      { type: 'tilt-turn-window', wall: 'north', widthMm: 700,  heightMm: 2100 },
      { type: 'sliding-door',     wall: 'east',  widthMm: 2400, heightMm: 2100 },
    ],
    dimensionLabels: { width: '7.0m', depth: '5.0m' },
  },
  floorPlanImagePath: '/resource/floorplan/7m-x-5m-bedroom.svg',
};


/**
 * 45 m2 -- The Grand
 *
 * The largest model, designed as a genuine self-contained building.
 * Uses a portal steel frame with dual-zone heating and extensive glazing.
 * Bathroom, kitchen, and plumbing connections are included in the base price.
 * Requires planning permission.
 */
const GRAND_45: HydratedProduct = {
  /* --- Identity -------------------------------------------------- */
  id: 'cp-grand-45',
  slug: 'grand-45',
  name: 'The Grand',
  tagline: 'A building, not just a room',
  description:
    'At 45m\u00B2, The Grand is less a garden room and more a building in its own right \u2014 a self-contained living space with full kitchen, bathroom, and open-plan living area, all finished to the same turnkey standard as a new-build home. Use it as a granny flat, an independent annex for family, a multi-room workspace, or a short-let rental that pays for itself over time. Two footprint options let you work with your site, and every detail from the steel frame to the consumer unit is designed for permanence, not compromise.',

  /* --- Dimensions ------------------------------------------------ */
  dimensions: {
    widthM: 9.0,
    depthM: 5.0,
    heightM: 2.4,
    areaM2: 45,
  },
  dimensionsDisplay: '9.0m \u00D7 5.0m or 7.5m \u00D7 6.0m',

  /* --- Pricing --------------------------------------------------- */
  basePriceCentsInclVat: 8_350_000,
  pricingNote: PRICING_NOTE,
  bathroomKitchenPolicy: 'included',

  /* --- Availability ---------------------------------------------- */
  available: true,
  inStock: true,
  planningPermission: true,
  leadTime: '12\u201316 weeks',

  /* --- Call to action --------------------------------------------- */
  ctaText: 'Customise',
  ctaLink: '/garden-rooms/configure/grand-45',

  /* --- Optional marketing modifiers ------------------------------ */
  glazingDetails: [
    { label: 'Front window',    dimensions: '700mm \u00D7 2100mm' },
    { label: 'French door',     dimensions: '1600mm \u00D7 2100mm' },
  ],

  /* --- Sort ------------------------------------------------------ */
  displayOrder: 4,

  /* --- Images ---------------------------------------------------- */
  images: [
    {
      id: 'img-grand-hero',
      productId: 'cp-grand-45',
      src: '/resource/garden-room/garden-room3.png',
      webP: '/resource/garden-room/garden-room3.webp',
      avif: '/resource/garden-room/garden-room3.avif',
      alt: 'The Grand 45m\u00B2 steel frame garden room',
      role: 'hero',
      displayOrder: 1,
    },
  ],

  /* --- Specifications -------------------------------------------- */
  specs: [
    { id: 'sp-grand-01', productId: 'cp-grand-45', label: 'Dimensions',  value: '9.0m \u00D7 5.0m',                                         displayOrder: 1 },
    { id: 'sp-grand-02', productId: 'cp-grand-45', label: 'Area',        value: '45 m\u00B2',                                               displayOrder: 2 },
    { id: 'sp-grand-03', productId: 'cp-grand-45', label: 'Structure',   value: 'EN1090 Light Gauge Steel frame',                           displayOrder: 3 },
    { id: 'sp-grand-04', productId: 'cp-grand-45', label: 'Insulation',  value: '90mm rock wool + 100mm EPS',                               displayOrder: 4 },
    { id: 'sp-grand-05', productId: 'cp-grand-45', label: 'Flooring',    value: 'Laminated flooring',                                       displayOrder: 5 },
    { id: 'sp-grand-06', productId: 'cp-grand-45', label: 'Glazing',     value: '2\u00D7 tilt & turn windows + French door + sliding door', displayOrder: 6 },
    { id: 'sp-grand-07', productId: 'cp-grand-45', label: 'Electrics',   value: 'Full consumer unit ready',                                 displayOrder: 7 },
    { id: 'sp-grand-08', productId: 'cp-grand-45', label: 'Roof',        value: 'EPDM long life roof',                                      displayOrder: 8 },
    { id: 'sp-grand-09', productId: 'cp-grand-45', label: 'Plumbing',    value: 'Bathroom + kitchen included',                              displayOrder: 9 },
  ],

  /* --- Use cases ------------------------------------------------- */
  useCases: [
    { id: 'uc-grand-c1', productId: 'cp-grand-45', text: 'Self-contained apartment',    context: 'card',       displayOrder: 1 },
    { id: 'uc-grand-c2', productId: 'cp-grand-45', text: 'Multi-room workspace',        context: 'card',       displayOrder: 2 },
    { id: 'uc-grand-c3', productId: 'cp-grand-45', text: '2 bedrooms',                  context: 'card',       displayOrder: 3 },
    { id: 'uc-grand-c4', productId: 'cp-grand-45', text: 'Kitchen & Bathroom Included', context: 'card',       displayOrder: 4 },
    { id: 'uc-grand-q1', productId: 'cp-grand-45', text: 'Full Living Annex',           context: 'quick-view', displayOrder: 5 },
    { id: 'uc-grand-q2', productId: 'cp-grand-45', text: 'Large Studio / Workshop',     context: 'quick-view', displayOrder: 6 },
    { id: 'uc-grand-q3', productId: 'cp-grand-45', text: 'Commercial Suite',            context: 'quick-view', displayOrder: 7 },
    { id: 'uc-grand-q4', productId: 'cp-grand-45', text: 'Granny Flat',                 context: 'quick-view', displayOrder: 8 },
  ],

  /* --- Footprint variants ---------------------------------------- */
  footprintVariants: [
    {
      id: 'fpv-grand-9x5',
      productId: 'cp-grand-45',
      slug: '9x5',
      label: '9.0m x 5.0m',
      description: 'Original rectangular footprint',
      widthM: 9.0,
      depthM: 5.0,
      areaM2: 45,
      priceDeltaCentsInclVat: 0,
      displayOrder: 1,
    },
    {
      id: 'fpv-grand-7.5x6',
      productId: 'cp-grand-45',
      slug: '7.5x6',
      label: '7.5m x 6.0m',
      description: 'Wider rectangular footprint',
      widthM: 7.5,
      depthM: 6.0,
      areaM2: 45,
      priceDeltaCentsInclVat: 0,
      displayOrder: 2,
    },
  ] satisfies ReadonlyArray<FootprintVariant>,

  /* --- Layout options -------------------------------------------- */
  layoutOptions: [],

  /* --- Addons ---------------------------------------------------- */
  addons: [
    {
      id: 'ao-grand-triple-glazing',
      productId: 'cp-grand-45',
      slug: 'triple-glazing',
      name: 'Triple Glazing Upgrade',
      description: 'Enhanced thermal and acoustic insulation for all glazing',
      priceCentsInclVat: 200_000,
      iconId: 'glazing',
      displayOrder: 1,
    },
    {
      id: 'ao-grand-sauna-room',
      productId: 'cp-grand-45',
      slug: 'sauna-room',
      name: 'Sauna Room',
      description: 'Self-contained infrared sauna cabin with cedar lining',
      priceCentsInclVat: 650_000,
      iconId: 'sauna',
      displayOrder: 2,
    },
  ],

  /* --- Included features ----------------------------------------- */
  includedFeatures: [
    {
      id: 'if-grand-bk',
      productId: 'cp-grand-45',
      name: 'Bathroom + Kitchen',
      description: 'Full plumbing with bathroom, full kitchen, and WC facilities included',
      displayOrder: 1,
    },
    {
      id: 'if-grand-plumbing',
      productId: 'cp-grand-45',
      name: 'Plumbing Connection',
      description: 'Hot and cold water supply, waste drainage, and soil stack connection',
      displayOrder: 2,
    },
  ],

  /* --- Finish categories -----------------------------------------
     Grand 45 offers two footprints: 9m x 5m (default) and 7.5m x 6m.
     The default imagePath points to the '9m' set; imagePathByFootprint
     maps each variant slug to the correct dimension-specific image.
     ---------------------------------------------------------------- */
  finishCategories: buildFinishCategories(
    'The Grand',
    buildExteriorFinishOptions('9m', { '9x5': '9m', '7.5x6': '7_5m' }),
  ),

  /* --- Legacy compatibility fields ------------------------------- */
  image: {
    src:  '/resource/garden-room/garden-room3.png',
    webP: '/resource/garden-room/garden-room3.webp',
    avif: '/resource/garden-room/garden-room3.avif',
    alt:  'The Grand 45m\u00B2 steel frame garden room',
  },
  floorPlan: {
    apertures: [
      { type: 'tilt-turn-window', wall: 'north', widthMm: 900,  heightMm: 2100 },
      { type: 'tilt-turn-window', wall: 'north', widthMm: 900,  heightMm: 2100 },
      { type: 'french-door',      wall: 'east',  widthMm: 1600, heightMm: 2100 },
      { type: 'sliding-door',     wall: 'south', widthMm: 3000, heightMm: 2100 },
    ],
    dimensionLabels: { width: '9.0m', depth: '5.0m' },
  },
  floorPlanVariants: [
    {
      id: 'fpv-grand-9x5',
      productId: 'cp-grand-45',
      slug: '9x5',
      label: '9.0m x 5.0m',
      description: 'Original rectangular footprint',
      widthM: 9.0,
      depthM: 5.0,
      areaM2: 45,
      priceDeltaCentsInclVat: 0,
      displayOrder: 1,
      floorPlan: {
        apertures: [
          { type: 'tilt-turn-window', wall: 'north', widthMm: 900,  heightMm: 2100 },
          { type: 'tilt-turn-window', wall: 'north', widthMm: 900,  heightMm: 2100 },
          { type: 'french-door',      wall: 'east',  widthMm: 1600, heightMm: 2100 },
          { type: 'sliding-door',     wall: 'south', widthMm: 3000, heightMm: 2100 },
        ],
        dimensionLabels: { width: '9.0m', depth: '5.0m' },
      },
      floorPlanImagePath: '/resource/floorplan/9m-x-5m.svg',
    },
    {
      id: 'fpv-grand-7.5x6',
      productId: 'cp-grand-45',
      slug: '7.5x6',
      label: '7.5m x 6.0m',
      description: 'Wider rectangular footprint',
      widthM: 7.5,
      depthM: 6.0,
      areaM2: 45,
      priceDeltaCentsInclVat: 0,
      displayOrder: 2,
      floorPlan: {
        apertures: [
          { type: 'tilt-turn-window', wall: 'north', widthMm: 900,  heightMm: 2100 },
          { type: 'tilt-turn-window', wall: 'north', widthMm: 900,  heightMm: 2100 },
          { type: 'french-door',      wall: 'east',  widthMm: 1600, heightMm: 2100 },
          { type: 'sliding-door',     wall: 'south', widthMm: 3000, heightMm: 2100 },
        ],
        dimensionLabels: { width: '7.5m', depth: '6.0m' },
      },
      floorPlanImagePath: '/resource/floorplan/7.5m-x-6m.svg',
    },
  ],
};


/* =============================================================================
   SECTION 5: EXPORTED COLLECTIONS
   -----------------------------------------------------------------------------
   Two access patterns are provided for consuming code:

   1. CONFIGURATOR_PRODUCTS -- ordered array for iteration and rendering.
      Products are sorted by ascending floor area.

   2. CONFIGURATOR_PRODUCTS_BY_SLUG -- slug-keyed record for O(1) lookups.
      Used by the router to resolve a URL parameter to a product definition,
      and by garden-room-data.ts to derive marketing page projections.

   Both exports reference the same object instances, ensuring referential
   equality for identity checks if needed.
   ============================================================================= */

/**
 * All garden room products in ascending order by floor area.
 * Used for iteration in product listing views and the configurator router.
 */
export const CONFIGURATOR_PRODUCTS: ReadonlyArray<HydratedProduct> = [
  COMPACT_15,
  STUDIO_25,
  LIVING_35,
  GRAND_45,
];

/**
 * Slug-keyed lookup map for resolving a URL parameter to a HydratedProduct.
 * Enables O(1) product resolution in the route handler without array scanning.
 *
 * Usage:
 *   const product = CONFIGURATOR_PRODUCTS_BY_SLUG['studio-25'];
 */
export const CONFIGURATOR_PRODUCTS_BY_SLUG: Readonly<Record<string, HydratedProduct>> = {
  'compact-15': COMPACT_15,
  'studio-25':  STUDIO_25,
  'living-35':  LIVING_35,
  'grand-45':   GRAND_45,
};
