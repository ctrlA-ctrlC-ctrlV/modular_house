/**
 * Configurator Product Data -- Product Instances for All Four Sizes
 * =============================================================================
 *
 * PURPOSE:
 * Single source of truth for all product configuration data consumed by the
 * garden room configurator page. Each ConfiguratorProduct instance provides
 * everything the multi-step configurator needs to render a complete product
 * configuration experience without any hard-coded product-specific values.
 *
 * PRODUCTS (4 total):
 * | Slug        | Name         | Area  | Base Price | Available |
 * |-------------|--------------|-------|------------|-----------|
 * | compact-15  | The Compact  | 15 m2 | EUR 26,000 | Yes       |
 * | studio-25   | The Studio   | 25 m2 | EUR 37,000 | Yes       |
 * | living-35   | The Living   | 35 m2 | EUR 65,000 | No        |
 * | grand-45    | The Grand    | 45 m2 | EUR 76,000 | No        |
 *
 * SHARED DATA:
 * Exterior and interior finish options are identical across all products.
 * They are defined once as module-level constants and referenced by each
 * product's finishCategories array. If a future product requires a unique
 * finish palette, its finishCategories can be overridden independently.
 *
 * Add-on pricing scales with product size. Larger rooms incur higher costs
 * for the same add-on type due to increased material and labour requirements.
 *
 * ADDING A NEW PRODUCT:
 * 1. Create a new ConfiguratorProduct object following the pattern below.
 * 2. Append it to the CONFIGURATOR_PRODUCTS array.
 * 3. Add an entry to the CONFIGURATOR_PRODUCTS_BY_SLUG map.
 * No existing code or interface modifications are required.
 *
 * =============================================================================
 */

import type {
  FinishOption,
  FinishCategory,
  AddonOption,
  ConfiguratorProduct,
} from '../types/configurator';


/* =============================================================================
   SECTION 1: SHARED FINISH OPTIONS
   -----------------------------------------------------------------------------
   Exterior cladding and interior wall finish options shared across all
   products. These constants are referenced by each product's
   finishCategories array. The options are ordered by display priority.

   Colour values use hex notation. The `color` is the primary swatch fill
   and the `accent` provides the darker gradient stop for the radial
   gradient effect in the swatch UI.
   ============================================================================= */

/**
 * Exterior cladding colour options available for all garden room sizes.
 * Composite cladding with a 25-year colour guarantee.
 */
const EXTERIOR_FINISH_OPTIONS: ReadonlyArray<FinishOption> = [
  { id: 'black',  name: 'Black',  color: '#1a1a1a', accent: '#333333' },
  { id: 'teak',   name: 'Teak',   color: '#B5764C', accent: '#9A6340' },
  { id: 'walnut', name: 'Walnut', color: '#5C4033', accent: '#4A3228' },
];

/**
 * Interior wall finish options available for all garden room sizes.
 * Applied to internal plasterboard lining surfaces.
 */
const INTERIOR_FINISH_OPTIONS: ReadonlyArray<FinishOption> = [
  { id: 'stone', name: 'Stone', color: '#C4BFB6', accent: '#A8A299' },
  { id: 'cloth', name: 'Cloth', color: '#E8E0D4', accent: '#D4CAB8' },
];


/* =============================================================================
   SECTION 2: SHARED PRICING NOTE
   -----------------------------------------------------------------------------
   Regulatory pricing disclaimer shared across all products. Displayed below
   the total price on the overview and summary steps.
   ============================================================================= */

const PRICING_NOTE = 'VAT not included \u00B7 Final price confirmed at consultation';


/* =============================================================================
   SECTION 3: HELPER -- FINISH CATEGORY BUILDER
   -----------------------------------------------------------------------------
   Constructs a pair of FinishCategory entries (exterior + interior) with
   product-specific sublabel text. This avoids repeating the finish options
   array references in every product definition while allowing each product
   to display its own contextual description.
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
      id: 'exterior',
      label: 'Exterior Finish',
      sublabel: `Choose the cladding colour for your ${productName}`,
      options: EXTERIOR_FINISH_OPTIONS,
    },
    {
      id: 'interior',
      label: 'Interior Finish',
      sublabel: `Select the interior wall finish for your ${productName}`,
      options: INTERIOR_FINISH_OPTIONS,
    },
  ];
}


/* =============================================================================
   SECTION 4: PRODUCT DEFINITIONS
   -----------------------------------------------------------------------------
   Each ConfiguratorProduct instance below defines the complete data for one
   garden room size. Products are listed in ascending order by floor area.

   Add-on pricing follows a size-based scaling model:
   - Bathroom + Kitchen: scaled by room area (more plumbing runs, larger space)
   - Triple Glazing Upgrade: scaled by glazing area (more/larger apertures)
   - Composite Decking Step: scaled by entrance width

   Specifications are derived from the QuickViewProduct data in
   garden-room-data.ts but restructured as key-value ProductSpec pairs
   suited to the configurator overview grid layout.
   ============================================================================= */

/**
 * 15 m2 -- The Compact
 *
 * The smallest garden room, designed for focused single-purpose use.
 * Exempt from planning permission under current Irish legislation.
 * Single tilt-turn window on the north wall, single French door on east.
 */
const COMPACT_15: ConfiguratorProduct = {
  slug: 'compact-15',
  name: 'The Compact',
  tagline: '15 m\u00B2 garden room \u2014 manufactured in Dublin',

  dimensions: {
    widthM: 3.0,
    depthM: 5.0,
    heightM: 2.4,
    areaM2: 15,
  },

  basePrice: 26000,
  pricingNote: PRICING_NOTE,

  finishCategories: buildFinishCategories('The Compact'),

  addons: [
    {
      id: 'bathroom-kitchen',
      name: 'Bathroom + Kitchen',
      description: 'Compact plumbing connection with shower room and kitchenette',
      price: 8000,
      iconId: 'plumbing',
    },
    {
      id: 'triple-glazing',
      name: 'Triple Glazing Upgrade',
      description: 'Enhanced thermal and acoustic insulation for all glazing',
      price: 800,
      iconId: 'glazing',
    },
    {
      id: 'composite-decking',
      name: 'Composite Decking Step',
      description: 'Durable composite entrance step with anti-slip finish',
      price: 150,
      iconId: 'decking',
    },
  ],

  specs: [
    { label: 'Dimensions',  value: '5.0m \u00D7 3.0m' },
    { label: 'Area',        value: '15 m\u00B2' },
    { label: 'Structure',   value: 'Galvanised steel SHS frame' },
    { label: 'Insulation',  value: '120mm PIR (U-value 0.15)' },
    { label: 'Flooring',    value: 'Composite flooring' },
    { label: 'Glazing',     value: 'Tilt & turn window + French door' },
    { label: 'Electrics',   value: 'Full consumer unit, Cat6 ready' },
    { label: 'Roof',        value: 'Flat roof membrane, included' },
  ],

  glazingNote:
    'Glazing details: 700mm \u00D7 2100mm tilt & turn window + ' +
    '1200mm \u00D7 2100mm French door. ' +
    'Plumbing connection included with Bathroom + Kitchen add-on.',

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
    alt:  'The Compact 15m\u00B2 steel frame garden room floor plan',
  },

  available: true,
  planningPermission: false,
  leadTime: '6\u20138 weeks',
};


/**
 * 25 m2 -- The Studio
 *
 * The most popular model, sitting at the maximum size for exempted
 * development under current Irish planning legislation. Dual-zone
 * layout potential with a larger French door for natural light.
 */
const STUDIO_25: ConfiguratorProduct = {
  slug: 'studio-25',
  name: 'The Studio',
  tagline: '25 m\u00B2 garden room \u2014 manufactured in Dublin',

  dimensions: {
    widthM: 5,
    depthM: 5,
    heightM: 2.7,
    areaM2: 25,
  },

  basePrice: 37000,
  pricingNote: PRICING_NOTE,

  finishCategories: buildFinishCategories('The Studio'),

  addons: [
    {
      id: 'bathroom-kitchen',
      name: 'Bathroom + Kitchen',
      description: 'Full plumbing connection with bathroom and kitchen facilities',
      price: 10000,
      iconId: 'plumbing',
    },
    {
      id: 'triple-glazing',
      name: 'Triple Glazing Upgrade',
      description: 'Enhanced thermal and acoustic insulation for all glazing',
      price: 1000,
      iconId: 'glazing',
    },
    {
      id: 'composite-decking',
      name: 'Composite Decking Step',
      description: 'Durable composite entrance step with anti-slip finish',
      price: 200,
      iconId: 'decking',
    },
  ],

  specs: [
    { label: 'Dimensions',  value: '6.25m \u00D7 4.0m' },
    { label: 'Area',        value: '25 m\u00B2' },
    { label: 'Structure',   value: 'Galvanised steel SHS frame' },
    { label: 'Insulation',  value: '120mm PIR (U-value 0.15)' },
    { label: 'Flooring',    value: 'Composite flooring' },
    { label: 'Glazing',     value: 'Tilt & turn window + French door' },
    { label: 'Electrics',   value: 'Full consumer unit, Cat6 ready' },
    { label: 'Roof',        value: 'Flat roof membrane, included' },
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
    dimensionLabels: { width: '6.25m', depth: '4.0m' },
  },

  image: {
    src:  '/resource/garden-room/garden-room1.png',
    webP: '/resource/garden-room/garden-room1.webp',
    avif: '/resource/garden-room/garden-room1.avif',
    alt:  'The Studio 25m\u00B2 steel frame garden room floor plan',
  },

  available: true,
  planningPermission: false,
  leadTime: '8\u201310 weeks',
};


/**
 * 35 m2 -- The Living
 *
 * Mid-range model using a portal steel frame for column-free interiors.
 * Requires planning permission under current legislation. Features a
 * wider sliding door and an additional window for cross-ventilation.
 * Currently listed as "Coming Soon".
 */
const LIVING_35: ConfiguratorProduct = {
  slug: 'living-35',
  name: 'The Living',
  tagline: '35 m\u00B2 garden room \u2014 manufactured in Dublin',

  dimensions: {
    widthM: 7.0,
    depthM: 5.0,
    heightM: 2.7,
    areaM2: 35,
  },

  basePrice: 65000,
  pricingNote: PRICING_NOTE,

  finishCategories: buildFinishCategories('The Living'),

  addons: [
    {
      id: 'bathroom-kitchen',
      name: 'Bathroom + Kitchen',
      description: 'Full plumbing connection with bathroom, kitchen, and WC facilities',
      price: 12000,
      iconId: 'plumbing',
    },
    {
      id: 'triple-glazing',
      name: 'Triple Glazing Upgrade',
      description: 'Enhanced thermal and acoustic insulation for all glazing',
      price: 1500,
      iconId: 'glazing',
    },
    {
      id: 'composite-decking',
      name: 'Composite Decking Step',
      description: 'Durable composite entrance step with anti-slip finish',
      price: 250,
      iconId: 'decking',
    },
  ],

  specs: [
    { label: 'Dimensions',  value: '7.0m \u00D7 5.0m' },
    { label: 'Area',        value: '35 m\u00B2' },
    { label: 'Structure',   value: 'Galvanised steel portal frame' },
    { label: 'Insulation',  value: '100mm PIR (U-value 0.12)' },
    { label: 'Flooring',    value: 'Composite flooring' },
    { label: 'Glazing',     value: '2\u00D7 tilt & turn windows + sliding door' },
    { label: 'Electrics',   value: 'Full consumer unit, Cat6 ready' },
    { label: 'Roof',        value: 'Flat roof membrane, included' },
  ],

  glazingNote:
    'Glazing details: 2\u00D7 700mm \u00D7 2100mm tilt & turn windows + ' +
    '2400mm \u00D7 2100mm sliding door. ' +
    'Plumbing connection included with Bathroom + Kitchen add-on.',

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
    alt:  'The Living 35m\u00B2 steel frame garden room floor plan',
  },

  available: false,
  planningPermission: true,
  leadTime: '10\u201312 weeks',
};


/**
 * 45 m2 -- The Grand
 *
 * The largest model, designed as a genuine self-contained building.
 * Uses a portal steel frame with dual-zone heating and extensive
 * glazing on multiple walls. Requires planning permission.
 * Currently listed as "Coming Soon".
 */
const GRAND_45: ConfiguratorProduct = {
  slug: 'grand-45',
  name: 'The Grand',
  tagline: '45 m\u00B2 garden room \u2014 manufactured in Dublin',

  dimensions: {
    widthM: 9.0,
    depthM: 5.0,
    heightM: 2.8,
    areaM2: 45,
  },

  basePrice: 76000,
  pricingNote: PRICING_NOTE,

  finishCategories: buildFinishCategories('The Grand'),

  addons: [
    {
      id: 'bathroom-kitchen',
      name: 'Bathroom + Kitchen',
      description: 'Full plumbing with bathroom, full kitchen, and WC facilities',
      price: 15000,
      iconId: 'plumbing',
    },
    {
      id: 'triple-glazing',
      name: 'Triple Glazing Upgrade',
      description: 'Enhanced thermal and acoustic insulation for all glazing',
      price: 2000,
      iconId: 'glazing',
    },
    {
      id: 'composite-decking',
      name: 'Composite Decking Step',
      description: 'Durable composite entrance step with anti-slip finish',
      price: 300,
      iconId: 'decking',
    },
  ],

  specs: [
    { label: 'Dimensions',  value: '9.0m \u00D7 5.0m' },
    { label: 'Area',        value: '45 m\u00B2' },
    { label: 'Structure',   value: 'Galvanised steel portal frame' },
    { label: 'Insulation',  value: '150mm PIR (U-value 0.12)' },
    { label: 'Flooring',    value: 'Composite flooring' },
    { label: 'Glazing',     value: '2\u00D7 tilt & turn windows + French door + sliding door' },
    { label: 'Electrics',   value: 'Full consumer unit, Cat6, EV-ready' },
    { label: 'Roof',        value: 'Flat roof membrane, included' },
  ],

  glazingNote:
    'Glazing details: 2\u00D7 900mm \u00D7 2100mm tilt & turn windows + ' +
    '1600mm \u00D7 2100mm French door + 3000mm \u00D7 2100mm sliding door. ' +
    'Plumbing connection included with Bathroom + Kitchen add-on.',

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
    alt:  'The Grand 45m\u00B2 steel frame garden room floor plan',
  },

  available: false,
  planningPermission: true,
  leadTime: '12\u201316 weeks',
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
