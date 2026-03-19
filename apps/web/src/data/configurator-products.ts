/**
 * Configurator Product Data -- Seed Data for All Four Garden Room Sizes
 * =============================================================================
 *
 * PURPOSE:
 * Single source of truth for all product configuration data consumed by the
 * garden room configurator page. This file represents the seed data that
 * mirrors the contents of the PostgreSQL database tables defined by the
 * configurator schema (see types/configurator.ts for the full ER mapping).
 *
 * In the current architecture this data is compiled into the frontend bundle.
 * When the API endpoint is implemented, this file will serve as the initial
 * database seed script — the data shapes map 1:1 to the SQL tables.
 *
 * PRODUCTS (4 total):
 * | Slug        | Name         | Area  | Base (incl. VAT) | B&K Policy     | Available |
 * |-------------|--------------|-------|------------------|----------------|-----------|
 * | compact-15  | The Compact  | 15 m2 | EUR 26,000       | not-available  | Yes       |
 * | studio-25   | The Studio   | 25 m2 | EUR 37,000       | optional-addon | Yes       |
 * | living-35   | The Living   | 35 m2 | EUR 65,000       | included       | No        |
 * | grand-45    | The Grand    | 45 m2 | EUR 76,000       | included       | No        |
 *
 * PRICING:
 * All monetary values are stored in euro cents inclusive of 23% VAT,
 * matching the SQL column type (integer cents). The frontend formats
 * cents to display euros using locale-aware formatting.
 *
 * BATHROOM & KITCHEN RULES:
 * - 15 m2: cannot add bathroom & kitchen (bathroomKitchenPolicy = "not-available")
 * - 25 m2: offered as an optional paid add-on (bathroomKitchenPolicy = "optional-addon")
 * - 35 & 45 m2: included in base price with plumbing (bathroomKitchenPolicy = "included"),
 *   represented via the includedFeatures array
 *
 * FINISH PREVIEW IMAGES:
 * Selecting a finish switches the hero image to a photograph from
 * /public/resource/garden-room/product-config/ (e.g., exterior_finish_black.jpg).
 * Each FinishOption carries an imagePath field pointing to the correct file.
 *
 * =============================================================================
 */

import type {
  FinishOption,
  FinishCategory,
  ConfiguratorProduct,
} from '../types/configurator';


/* =============================================================================
   SECTION 1: SHARED FINISH OPTIONS
   -----------------------------------------------------------------------------
   Maps to the configurator_finish_options table.

   Exterior cladding and interior wall finish options shared across all
   products. Each option includes swatch colours for UI rendering and
   an imagePath pointing to the preview photograph displayed when the
   customer selects that finish.

   Image files are located in:
     /public/resource/garden-room/product-config/
   ============================================================================= */

/**
 * Exterior cladding colour options available for all garden room sizes.
 * Composite cladding with a 25-year colour guarantee.
 *
 * SQL: configurator_finish_options (category_slug = "exterior")
 */
const EXTERIOR_FINISH_OPTIONS: ReadonlyArray<FinishOption> = [
  {
    id: 'ef-black',
    name: 'Black',
    color: '#1a1a1a',
    accent: '#333333',
    imagePath: '/resource/garden-room/product-config/exterior_finish_black.jpg',
  },
  {
    id: 'ef-teak',
    name: 'Teak',
    color: '#B5764C',
    accent: '#9A6340',
    imagePath: '/resource/garden-room/product-config/exterior_finish_teak.jpg',
  },
  {
    id: 'ef-walnut',
    name: 'Walnut',
    color: '#5C4033',
    accent: '#4A3228',
    imagePath: '/resource/garden-room/product-config/exterior_finish_walnut.jpg',
  },
];

/**
 * Interior wall finish options available for all garden room sizes.
 * Applied to internal plasterboard lining surfaces.
 *
 * SQL: configurator_finish_options (category_slug = "interior")
 */
const INTERIOR_FINISH_OPTIONS: ReadonlyArray<FinishOption> = [
  {
    id: 'if-stone',
    name: 'Stone',
    color: '#C4BFB6',
    accent: '#A8A299',
    imagePath: '/resource/garden-room/product-config/interior_finish_stone.jpg',
  },
  {
    id: 'if-cloth',
    name: 'Cloth',
    color: '#E8E0D4',
    accent: '#D4CAB8',
    imagePath: '/resource/garden-room/product-config/interior_finish_cloth.jpg',
  },
];


/* =============================================================================
   SECTION 2: SHARED PRICING NOTE
   -----------------------------------------------------------------------------
   Pricing footnote displayed below the total price on overview and summary
   steps. All prices include VAT at the Irish standard rate (23%).
   ============================================================================= */

const PRICING_NOTE = 'Price includes VAT \u00B7 Final price confirmed at consultation';


/* =============================================================================
   SECTION 3: HELPER -- FINISH CATEGORY BUILDER
   -----------------------------------------------------------------------------
   Constructs a pair of FinishCategory entries (exterior + interior) with
   product-specific sublabel text. This avoids repeating the finish options
   array references in every product definition while allowing each product
   to display its own contextual description.

   Maps to configurator_finish_categories table rows + join table entries
   in configurator_product_finishes.
   ============================================================================= */

/**
 * Builds the standard two-category finish configuration for a given product.
 * The sublabel text is personalised with the product marketing name.
 *
 * @param productName - The marketing name of the product (e.g., "The Studio").
 * @returns A two-element tuple: [exteriorCategory, interiorCategory].
 */
function buildFinishCategories(productName: string): ReadonlyArray<FinishCategory> {
  return [
    {
      id: 'fc-exterior',
      slug: 'exterior',
      label: 'Exterior Finish',
      sublabel: `Choose the cladding colour for your ${productName}`,
      displayOrder: 1,
      options: EXTERIOR_FINISH_OPTIONS,
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
   Each ConfiguratorProduct instance below maps to one row in the
   configurator_products table plus related child rows in:
     - configurator_addon_options
     - configurator_product_specs
     - configurator_included_features
     - configurator_product_finishes (join table)

   Products are listed in ascending order by floor area.

   PRICING CONVENTION:
   All prices are in euro cents inclusive of 23% VAT.
   Example: EUR 26,000 = 2_600_000 cents.

   BATHROOM & KITCHEN:
   - 15 m2: not available (bathroomKitchenPolicy = "not-available")
   - 25 m2: optional add-on in the addons array
   - 35, 45 m2: included in base price via includedFeatures array
   ============================================================================= */

/**
 * 15 m2 -- The Compact
 *
 * The smallest garden room, designed for focused single-purpose use.
 * Exempt from planning permission under current Irish legislation.
 * Bathroom & kitchen cannot be added to this model.
 */
const COMPACT_15: ConfiguratorProduct = {
  id: 'cp-compact-15',
  slug: 'compact-15',
  name: 'The Compact',
  tagline: '15 m\u00B2 garden room \u2014 manufactured in Dublin',

  dimensions: {
    widthM: 3.0,
    depthM: 5.0,
    heightM: 2.4,
    areaM2: 15,
  },

  basePriceCentsInclVat: 2_950_000,
  pricingNote: PRICING_NOTE,
  bathroomKitchenPolicy: 'not-available',

  finishCategories: buildFinishCategories('The Compact'),

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
      id: 'ao-compact-composite-decking',
      productId: 'cp-compact-15',
      slug: 'composite-decking',
      name: 'Composite Decking Step',
      description: 'Durable composite entrance step with anti-slip finish',
      priceCentsInclVat: 15_000,
      iconId: 'decking',
      displayOrder: 2,
    },
  ],

  includedFeatures: [],

  specs: [
    { id: 'sp-compact-01', productId: 'cp-compact-15', label: 'Dimensions',  value: '5.0m \u00D7 3.0m',                displayOrder: 1 },
    { id: 'sp-compact-02', productId: 'cp-compact-15', label: 'Area',        value: '15 m\u00B2',                       displayOrder: 2 },
    { id: 'sp-compact-03', productId: 'cp-compact-15', label: 'Structure',   value: 'Galvanised steel SHS frame',       displayOrder: 3 },
    { id: 'sp-compact-04', productId: 'cp-compact-15', label: 'Insulation',  value: '120mm PIR (U-value 0.15)',         displayOrder: 4 },
    { id: 'sp-compact-05', productId: 'cp-compact-15', label: 'Flooring',    value: 'Composite flooring',               displayOrder: 5 },
    { id: 'sp-compact-06', productId: 'cp-compact-15', label: 'Glazing',     value: 'Tilt & turn window + French door', displayOrder: 6 },
    { id: 'sp-compact-07', productId: 'cp-compact-15', label: 'Electrics',   value: 'Full consumer unit, Cat6 ready',   displayOrder: 7 },
    { id: 'sp-compact-08', productId: 'cp-compact-15', label: 'Roof',        value: 'Flat roof membrane, included',     displayOrder: 8 },
  ],

  glazingNote:
    'Glazing details: 700mm \u00D7 2100mm tilt & turn window + ' +
    '1200mm \u00D7 2100mm French door.',

  floorPlan: {
    apertures: [
      { type: 'tilt-turn-window', wall: 'north', widthMm: 700,  heightMm: 2100 },
      { type: 'french-door',      wall: 'east',  widthMm: 1200, heightMm: 2100 },
    ],
    dimensionLabels: { width: '5.0m', depth: '3.0m' },
  },

  image: {
    src:  '/resource/garden-room/garden-room4.png',
    webP: '/resource/garden-room/garden-room4.webp',
    avif: '/resource/garden-room/garden-room4.avif',
    alt:  'The Compact 15m\u00B2 steel frame garden room',
  },

  available: true,
  planningPermission: false,
  leadTime: '6\u20138 weeks',
  displayOrder: 1,
};


/**
 * 25 m2 -- The Studio
 *
 * The most popular model, sitting at the maximum size for exempted
 * development under current Irish planning legislation. Bathroom &
 * kitchen is offered as an optional paid add-on.
 */
const STUDIO_25: ConfiguratorProduct = {
  id: 'cp-studio-25',
  slug: 'studio-25',
  name: 'The Studio',
  tagline: '25 m\u00B2 garden room \u2014 manufactured in Dublin',

  dimensions: {
    widthM: 5,
    depthM: 5,
    heightM: 2.7,
    areaM2: 25,
  },

  basePriceCentsInclVat: 3_950_000,
  pricingNote: PRICING_NOTE,
  bathroomKitchenPolicy: 'optional-addon',

  finishCategories: buildFinishCategories('The Studio'),

  addons: [
    {
      id: 'ao-studio-bathroom-kitchen',
      productId: 'cp-studio-25',
      slug: 'bathroom-kitchen',
      name: 'Bathroom + Kitchen',
      description: 'Full plumbing connection with bathroom and kitchen facilities',
      priceCentsInclVat: 1_000_000,
      iconId: 'plumbing',
      displayOrder: 1,
    },
    {
      id: 'ao-studio-triple-glazing',
      productId: 'cp-studio-25',
      slug: 'triple-glazing',
      name: 'Triple Glazing Upgrade',
      description: 'Enhanced thermal and acoustic insulation for all glazing',
      priceCentsInclVat: 100_000,
      iconId: 'glazing',
      displayOrder: 2,
    },
    {
      id: 'ao-studio-composite-decking',
      productId: 'cp-studio-25',
      slug: 'composite-decking',
      name: 'Composite Decking Step',
      description: 'Durable composite entrance step with anti-slip finish',
      priceCentsInclVat: 20_000,
      iconId: 'decking',
      displayOrder: 3,
    },
  ],

  includedFeatures: [],

  specs: [
    { id: 'sp-studio-01', productId: 'cp-studio-25', label: 'Dimensions',  value: '5.0m \u00D7 5.0m',                  displayOrder: 1 },
    { id: 'sp-studio-02', productId: 'cp-studio-25', label: 'Area',        value: '25 m\u00B2',                         displayOrder: 2 },
    { id: 'sp-studio-03', productId: 'cp-studio-25', label: 'Structure',   value: 'Galvanised steel SHS frame',         displayOrder: 3 },
    { id: 'sp-studio-04', productId: 'cp-studio-25', label: 'Insulation',  value: '120mm PIR (U-value 0.15)',           displayOrder: 4 },
    { id: 'sp-studio-05', productId: 'cp-studio-25', label: 'Flooring',    value: 'Composite flooring',                 displayOrder: 5 },
    { id: 'sp-studio-06', productId: 'cp-studio-25', label: 'Glazing',     value: 'Tilt & turn window + French door',   displayOrder: 6 },
    { id: 'sp-studio-07', productId: 'cp-studio-25', label: 'Electrics',   value: 'Full consumer unit, Cat6 ready',     displayOrder: 7 },
    { id: 'sp-studio-08', productId: 'cp-studio-25', label: 'Roof',        value: 'Flat roof membrane, included',       displayOrder: 8 },
  ],

  glazingNote:
    'Glazing details: 700mm \u00D7 2100mm tilt & turn window + ' +
    '1600mm \u00D7 2100mm French door. ' +
    'Plumbing connection included with Bathroom + Kitchen add-on.',

  floorPlan: {
    apertures: [
      { type: 'tilt-turn-window', wall: 'north', widthMm: 700,  heightMm: 2100 },
      { type: 'french-door',      wall: 'east',  widthMm: 1600, heightMm: 2100 },
    ],
    dimensionLabels: { width: '5.0m', depth: '5.0m' },
  },

  image: {
    src:  '/resource/garden-room/garden-room1.png',
    webP: '/resource/garden-room/garden-room1.webp',
    avif: '/resource/garden-room/garden-room1.avif',
    alt:  'The Studio 25m\u00B2 steel frame garden room',
  },

  available: true,
  planningPermission: false,
  leadTime: '8\u201310 weeks',
  displayOrder: 2,
};


/**
 * 35 m2 -- The Living
 *
 * Mid-range model using a portal steel frame for column-free interiors.
 * Requires planning permission under current legislation. Bathroom,
 * kitchen, and plumbing connections are included in the base price.
 * Currently listed as "Coming Soon".
 */
const LIVING_35: ConfiguratorProduct = {
  id: 'cp-living-35',
  slug: 'living-35',
  name: 'The Living',
  tagline: '35 m\u00B2 garden room \u2014 manufactured in Dublin',

  dimensions: {
    widthM: 7.0,
    depthM: 5.0,
    heightM: 2.7,
    areaM2: 35,
  },

  basePriceCentsInclVat: 6_850_000,
  pricingNote: PRICING_NOTE,
  bathroomKitchenPolicy: 'included',

  finishCategories: buildFinishCategories('The Living'),

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
      id: 'ao-living-composite-decking',
      productId: 'cp-living-35',
      slug: 'composite-decking',
      name: 'Composite Decking Step',
      description: 'Durable composite entrance step with anti-slip finish',
      priceCentsInclVat: 25_000,
      iconId: 'decking',
      displayOrder: 2,
    },
  ],

  includedFeatures: [
    {
      id: 'if-living-bk',
      productId: 'cp-living-35',
      name: 'Bathroom + Kitchen',
      description: 'Full plumbing connection with bathroom, kitchen, and WC facilities included',
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

  specs: [
    { id: 'sp-living-01', productId: 'cp-living-35', label: 'Dimensions',  value: '7.0m \u00D7 5.0m',                           displayOrder: 1 },
    { id: 'sp-living-02', productId: 'cp-living-35', label: 'Area',        value: '35 m\u00B2',                                  displayOrder: 2 },
    { id: 'sp-living-03', productId: 'cp-living-35', label: 'Structure',   value: 'Galvanised steel portal frame',                displayOrder: 3 },
    { id: 'sp-living-04', productId: 'cp-living-35', label: 'Insulation',  value: '100mm PIR (U-value 0.12)',                     displayOrder: 4 },
    { id: 'sp-living-05', productId: 'cp-living-35', label: 'Flooring',    value: 'Composite flooring',                           displayOrder: 5 },
    { id: 'sp-living-06', productId: 'cp-living-35', label: 'Glazing',     value: '2\u00D7 tilt & turn windows + sliding door',   displayOrder: 6 },
    { id: 'sp-living-07', productId: 'cp-living-35', label: 'Electrics',   value: 'Full consumer unit, Cat6 ready',               displayOrder: 7 },
    { id: 'sp-living-08', productId: 'cp-living-35', label: 'Roof',        value: 'Flat roof membrane, included',                 displayOrder: 8 },
    { id: 'sp-living-09', productId: 'cp-living-35', label: 'Plumbing',    value: 'Bathroom + kitchen + WC included',             displayOrder: 9 },
  ],

  glazingNote:
    'Glazing details: 2\u00D7 700mm \u00D7 2100mm tilt & turn windows + ' +
    '2400mm \u00D7 2100mm sliding door.',

  floorPlan: {
    apertures: [
      { type: 'tilt-turn-window', wall: 'north', widthMm: 700,  heightMm: 2100 },
      { type: 'tilt-turn-window', wall: 'north', widthMm: 700,  heightMm: 2100 },
      { type: 'sliding-door',     wall: 'east',  widthMm: 2400, heightMm: 2100 },
    ],
    dimensionLabels: { width: '7.0m', depth: '5.0m' },
  },

  image: {
    src:  '/resource/garden-room/garden-room2.png',
    webP: '/resource/garden-room/garden-room2.webp',
    avif: '/resource/garden-room/garden-room2.avif',
    alt:  'The Living 35m\u00B2 steel frame garden room',
  },

  available: false,
  planningPermission: true,
  leadTime: '10\u201312 weeks',
  displayOrder: 3,
};


/**
 * 45 m2 -- The Grand
 *
 * The largest model, designed as a genuine self-contained building.
 * Uses a portal steel frame with dual-zone heating and extensive glazing.
 * Bathroom, kitchen, and plumbing connections are included in the base price.
 * Requires planning permission. Currently listed as "Coming Soon".
 */
const GRAND_45: ConfiguratorProduct = {
  id: 'cp-grand-45',
  slug: 'grand-45',
  name: 'The Grand',
  tagline: '45 m\u00B2 garden room \u2014 manufactured in Dublin',

  dimensions: {
    widthM: 9.0,
    depthM: 5.0,
    heightM: 2.8,
    areaM2: 45,
  },

  basePriceCentsInclVat: 8_350_000,
  pricingNote: PRICING_NOTE,
  bathroomKitchenPolicy: 'included',

  finishCategories: buildFinishCategories('The Grand'),

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
      id: 'ao-grand-composite-decking',
      productId: 'cp-grand-45',
      slug: 'composite-decking',
      name: 'Composite Decking Step',
      description: 'Durable composite entrance step with anti-slip finish',
      priceCentsInclVat: 30_000,
      iconId: 'decking',
      displayOrder: 2,
    },
  ],

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

  specs: [
    { id: 'sp-grand-01', productId: 'cp-grand-45', label: 'Dimensions',  value: '9.0m \u00D7 5.0m',                                              displayOrder: 1 },
    { id: 'sp-grand-02', productId: 'cp-grand-45', label: 'Area',        value: '45 m\u00B2',                                                     displayOrder: 2 },
    { id: 'sp-grand-03', productId: 'cp-grand-45', label: 'Structure',   value: 'Galvanised steel portal frame',                                   displayOrder: 3 },
    { id: 'sp-grand-04', productId: 'cp-grand-45', label: 'Insulation',  value: '150mm PIR (U-value 0.12)',                                        displayOrder: 4 },
    { id: 'sp-grand-05', productId: 'cp-grand-45', label: 'Flooring',    value: 'Composite flooring',                                              displayOrder: 5 },
    { id: 'sp-grand-06', productId: 'cp-grand-45', label: 'Glazing',     value: '2\u00D7 tilt & turn windows + French door + sliding door',        displayOrder: 6 },
    { id: 'sp-grand-07', productId: 'cp-grand-45', label: 'Electrics',   value: 'Full consumer unit, Cat6, EV-ready',                              displayOrder: 7 },
    { id: 'sp-grand-08', productId: 'cp-grand-45', label: 'Roof',        value: 'Flat roof membrane, included',                                    displayOrder: 8 },
    { id: 'sp-grand-09', productId: 'cp-grand-45', label: 'Plumbing',    value: 'Bathroom + full kitchen + WC included',                           displayOrder: 9 },
  ],

  glazingNote:
    'Glazing details: 2\u00D7 900mm \u00D7 2100mm tilt & turn windows + ' +
    '1600mm \u00D7 2100mm French door + 3000mm \u00D7 2100mm sliding door.',

  floorPlan: {
    apertures: [
      { type: 'tilt-turn-window', wall: 'north', widthMm: 900,  heightMm: 2100 },
      { type: 'tilt-turn-window', wall: 'north', widthMm: 900,  heightMm: 2100 },
      { type: 'french-door',      wall: 'east',  widthMm: 1600, heightMm: 2100 },
      { type: 'sliding-door',     wall: 'south', widthMm: 3000, heightMm: 2100 },
    ],
    dimensionLabels: { width: '9.0m', depth: '5.0m' },
  },

  image: {
    src:  '/resource/garden-room/garden-room3.png',
    webP: '/resource/garden-room/garden-room3.webp',
    avif: '/resource/garden-room/garden-room3.avif',
    alt:  'The Grand 45m\u00B2 steel frame garden room',
  },

  available: false,
  planningPermission: true,
  leadTime: '12\u201316 weeks',
  displayOrder: 4,
};


/* =============================================================================
   SECTION 5: EXPORTED COLLECTIONS
   -----------------------------------------------------------------------------
   Two access patterns are provided for consuming code:

   1. CONFIGURATOR_PRODUCTS -- ordered array for iteration and rendering.
      Products are sorted by ascending floor area.

   2. CONFIGURATOR_PRODUCTS_BY_SLUG -- slug-keyed record for O(1) lookups.
      Used by the router to resolve a URL parameter to a product definition.

   Both exports reference the same object instances, ensuring referential
   equality for identity checks if needed.
   ============================================================================= */

/**
 * All configurable garden room products in ascending order by floor area.
 * Used for iteration in product listing views and the configurator router.
 */
export const CONFIGURATOR_PRODUCTS: ReadonlyArray<ConfiguratorProduct> = [
  COMPACT_15,
  STUDIO_25,
  LIVING_35,
  GRAND_45,
];

/**
 * Slug-keyed lookup map for resolving a URL parameter to a ConfiguratorProduct.
 * Enables O(1) product resolution in the route handler without array scanning.
 *
 * Usage:
 *   const product = CONFIGURATOR_PRODUCTS_BY_SLUG['studio-25'];
 */
export const CONFIGURATOR_PRODUCTS_BY_SLUG: Readonly<Record<string, ConfiguratorProduct>> = {
  'compact-15': COMPACT_15,
  'studio-25':  STUDIO_25,
  'living-35':  LIVING_35,
  'grand-45':   GRAND_45,
};
