/**
 * Garden Room Page -- Shared Data Constants
 * =============================================================================
 *
 * PURPOSE:
 * Single source of truth for all content displayed on the /garden-room page.
 * By centralising data here, page-level component files remain purely
 * presentational, and updating copy, images, or product availability
 * requires only data changes -- not component modifications.
 *
 * ARCHITECTURE:
 * Product data follows a normalised relational pattern inspired by
 * PostgreSQL schema design. A single canonical record per garden room
 * size (CanonicalGardenRoomProduct) holds every per-product fact exactly
 * once. Component-specific export arrays are derived from this canonical
 * set via projection functions (.map()), eliminating redundant declarations
 * and guaranteeing cross-section consistency.
 *
 * Non-product data (features, testimonials, FAQs, gallery, comparison)
 * does not repeat across components and is declared directly as typed
 * constants without canonical abstraction.
 *
 * CANONICAL DATA MODEL:
 *   CanonicalGardenRoomProduct       -- Root product entity (mirrors `products` table)
 *     .image: CanonicalImageSet      -- Multi-format image paths (mirrors `product_images`)
 *     .technicalSpecs: Record        -- Key-value specs (mirrors `product_specs` table)
 *     .cardUseCases / quickViewUseCases -- Context-specific use cases (mirrors `product_use_cases`)
 *
 * DERIVED EXPORTS (projected from CANONICAL_PRODUCTS):
 *   PRODUCT_SHOWCASE_PRODUCTS        -- ProductShowcase (50/50 hero split)
 *   GARDEN_ROOM_PRODUCTS             -- ProductRangeGrid (detail cards)
 *   GARDEN_ROOM_QUICK_VIEW           -- QuickViewModal (expanded overlay)
 *
 * DIRECT EXPORTS (standalone, non-duplicated):
 *   PRODUCT_SHOWCASE_FEATURES        -- Standard features list
 *   PRODUCT_SHOWCASE_WARRANTIES      -- Warranty coverage list
 *   GARDEN_ROOM_FAQS                 -- FAQ accordion + FAQPage JSON-LD schema
 *   GARDEN_ROOM_FEATURES             -- "Why Steel Frame" feature cards
 *   GARDEN_ROOM_TESTIMONIALS         -- Customer testimonials
 *   GARDEN_ROOM_GALLERY              -- Masonry gallery items
 *   GARDEN_ROOM_COMPARISON_CATEGORIES-- Construction method comparison
 *   INFINITE_GALLERY_IMAGES          -- Infinite horizontal gallery
 *
 * EXTENSION:
 * To add a new product size, append one entry to CANONICAL_PRODUCTS.
 * All three derived exports update automatically (Open-Closed Principle).
 *
 * =============================================================================
 */

import React from 'react';
import type { ProductCard, AccordionFAQItem, GalleryItem, ProductShowcaseProduct, ProductShowcaseFeature, ProductShowcaseWarranty, QuickViewProduct, InfiniteGalleryImage, ComparisonCategory } from '@modular-house/ui';
import { CustomIcons } from '@modular-house/ui';
import { CONFIGURATOR_PRODUCTS_BY_SLUG } from './configurator-products';

/**
 * Re-export the FeatureItem interface inline since it is used for
 * the features array below. The FeatureSection component accepts
 * this shape via its `features` prop.
 */
interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

/**
 * Testimonial item shape matching the TestimonialGrid component contract.
 */
interface TestimonialItem {
  text: string;
  authorName: string;
  authorLocation: string;
  authorImageSrc: string;
  rating?: number;
}


/* =============================================================================
   CANONICAL PRODUCT RECORD -- SINGLE SOURCE OF TRUTH
   =============================================================================

   Each garden room size (15, 25, 35, 45 m2) is represented by exactly one
   CanonicalGardenRoomProduct record. All per-product facts -- identity,
   naming, pricing, images, availability, use cases, technical specs -- are
   declared once here. The component-specific export arrays further below
   are derived via .map() projections, eliminating redundant declarations
   and ensuring cross-section consistency.

   This structure mirrors a normalised PostgreSQL schema:

     products table         -> CanonicalGardenRoomProduct (root entity)
     product_images table   -> CanonicalImageSet (1:1 image set per product)
     product_specs table    -> technicalSpecs (1:many key-value pairs)
     product_use_cases      -> cardUseCases / quickViewUseCases (1:many per context)

   To add a new product size, append one entry to CANONICAL_PRODUCTS.
   All derived exports update automatically (Open-Closed Principle).

   ============================================================================= */


/**
 * Multi-format image paths for a single product photograph.
 * Mirrors a `product_images` row with format-specific columns.
 * All paths are relative to /public.
 */
interface ImageSet {
  /** Primary image path (PNG or JPEG fallback). */
  readonly png: string;
  /** WebP optimised variant for modern browsers. */
  readonly webP: string;
  /** AVIF optimised variant for maximum compression. */
  readonly avif: string;
}


/**
 * Complete canonical record for one garden room product.
 * Contains every per-product fact used across the /garden-room page.
 * Component-specific exports project subsets of these fields into the
 * shapes required by their respective UI components.
 *
 * Mirrors the configurator_products table plus related lookup tables
 * for images, specs, and use cases.
 */
interface GardenRoomProduct {
  /** Primary key / URL slug (e.g., "compact-15"). Unique across all products. */
  readonly id: string;
  /** Floor area in square metres (e.g., 15). Derives display strings like "15m2". */
  readonly areaM2: number;
  /** Formatted external dimensions (e.g., "5.0m x 3.0m"). Also injected as specs.footprint. */
  readonly dimensionsDisplay: string;

  /** Short label for the ProductShowcase strip (e.g., "The Compact"). */
  readonly showcaseLabel: string;
  /** Full marketing name for product cards and quick view (e.g., "Compact Studio"). */
  readonly name: string;
  /** Marketing tagline displayed below the product name. */
  readonly tagline: string;

  /** Multi-format image set shared across all component views. */
  readonly image: ImageSet;

  /**
   * Base price string inclusive of VAT, displayed consistently across all
   * page sections (ProductShowcase, ProductRangeGrid, QuickViewModal).
   * This is the single canonical price for the product.
   */
  readonly basePrice: string;

  /** Whether planning permission is required under current Irish legislation. */
  readonly planningPermission: boolean;
  /** Whether the product is currently manufactured and available for order. */
  readonly inStock: boolean;
  /** Whether the product CTA links to a live configurator (true) or interest form (false). */
  readonly available: boolean;
  /** Optional badge label rendered on the ProductCard (e.g., "Most Popular", "Coming Soon"). */
  readonly badge?: string;

  /** Call-to-action button text (e.g., "Get a Quote", "Register Interest"). */
  readonly ctaText: string;
  /** Call-to-action link target (configurator route, e.g., "/garden-room/configure/compact-15"). */
  readonly ctaLink: string;

  /** Use cases displayed as bullet points on the ProductRangeGrid card. */
  readonly cardUseCases: ReadonlyArray<string>;
  /** Use cases displayed in the QuickViewModal (may include additional detail vs card). */
  readonly quickViewUseCases: ReadonlyArray<string>;

  /** Long-form product description for the QuickViewModal. */
  readonly description: string;
  /**
   * Technical specifications for the QuickViewModal, excluding the footprint
   * dimension (which is derived from dimensionsDisplay at projection time).
   * Mirrors the product_specs join table in a normalised database schema.
   */
  readonly technicalSpecs: Readonly<Record<string, string>>;
  /** Estimated lead time string (e.g., "6-8 weeks"). */
  readonly leadTime: string;

  /** Sort position for rendering order (ascending). */
  readonly displayOrder: number;
}


/**
 * Garden-room-page-specific fields that are NOT shared with the configurator
 * data model. These supplement the shared identity, pricing, availability,
 * and image data derived from CONFIGURATOR_PRODUCTS_BY_SLUG.
 *
 * Excluded (derived from ConfiguratorProduct):
 *   id, areaM2, showcaseLabel, image, basePrice, planningPermission,
 *   inStock, available, leadTime, displayOrder
 */
type GardenRoomPageFields = Omit<
  GardenRoomProduct,
  | 'id'
  | 'areaM2'
  | 'showcaseLabel'
  | 'image'
  | 'basePrice'
  | 'planningPermission'
  | 'inStock'
  | 'available'
  | 'leadTime'
  | 'displayOrder'
>;

/**
 * Formats a price stored in euro cents (inclusive of VAT) into the
 * locale-formatted display string used across all garden room page sections.
 * Example: 2_950_000 → '€29,500'
 */
function formatEurCents(cents: number): string {
  return `\u20AC${new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 }).format(cents / 100)}`;
}

/**
 * Builds a complete GardenRoomProduct by merging shared fields from the
 * corresponding ConfiguratorProduct (images, price, availability, lead time,
 * sort order) with garden-room-page-specific fields (marketing name, tagline,
 * use cases, description, technical specs).
 *
 * This is the single join point between the two data models. Changes to
 * shared fields in configurator-products.ts (prices, images, availability)
 * automatically propagate to the garden room page without editing this file.
 *
 * @param slug   - The configurator product slug to look up (e.g., "compact-15").
 * @param fields - Garden-room-page-specific fields not present in the configurator model.
 * @returns A complete GardenRoomProduct ready for projection into component shapes.
 */
function buildGardenRoomProduct(slug: string, fields: GardenRoomPageFields): GardenRoomProduct {
  const cp = CONFIGURATOR_PRODUCTS_BY_SLUG[slug];
  return {
    id:               cp.slug,
    areaM2:           cp.dimensions.areaM2,
    showcaseLabel:    cp.name,
    image: {
      png:  cp.image.src,
      webP: cp.image.webP ?? '',
      avif: cp.image.avif ?? '',
    },
    basePrice:         formatEurCents(cp.basePriceCentsInclVat),
    planningPermission: cp.planningPermission,
    inStock:           cp.available,
    available:         cp.available,
    leadTime:          cp.leadTime,
    displayOrder:      cp.displayOrder,
    ...fields,
  };
}


/**
 * Canonical product data for all four garden room sizes.
 * Each entry stores every per-product fact exactly once. The three
 * component-specific export arrays (PRODUCT_SHOWCASE_PRODUCTS,
 * GARDEN_ROOM_PRODUCTS, GARDEN_ROOM_QUICK_VIEW) are projected from
 * this single array, guaranteeing data consistency across all page sections.
 *
 * Shared fields (images, price, availability, lead time, sort order) are
 * derived from CONFIGURATOR_PRODUCTS_BY_SLUG via buildGardenRoomProduct.
 * Only garden-room-page-specific content (marketing name, taglines, use
 * cases, descriptions, technical specs) is declared inline.
 *
 * Ordering matches the desired display order (ascending by floor area).
 */
const CANONICAL_PRODUCTS: ReadonlyArray<GardenRoomProduct> = [

  /* ---- 15 m2 -- Compact ------------------------------------------------- */
  buildGardenRoomProduct('compact-15', {
    dimensionsDisplay: '5.0m \u00D7 3.0m',

    name: 'Compact Studio',
    tagline: 'Your private creative sanctuary',

    ctaText: 'Customise',
    ctaLink: '/garden-room/configure/compact-15',

    cardUseCases: ['Home office', 'Art studio', 'Yoga room'],
    quickViewUseCases: ['Home Office', 'Art Studio', 'Yoga & Wellness Room', 'Music Practice'],

    description:
      'Compact yet generous, the Compact Studio is precision-engineered for focused work and creative pursuits. Floor-to-ceiling glazing floods the space with natural light, while our thermally broken steel frame ensures year-round comfort. Perfect for those who need a dedicated space without the footprint.',
    technicalSpecs: {
      height: '2.7m internal',
      frame: 'Galvanised steel SHS',
      insulation: '120mm PIR (U-value 0.15)',
      glazing: 'Triple-glazed aluminium',
      heating: 'Air-to-air heat pump',
      electrics: 'Full consumer unit, Cat6 ready',
    },
  }),

  /* ---- 25 m2 -- Studio -------------------------------------------------- */
  buildGardenRoomProduct('studio-25', {
    // Studio offers an alternate layout option not captured in configurator dimensions.
    dimensionsDisplay: '5m \u00D7 5m or 6m \u00D7 4.15m',

    name: 'Garden Suite',
    tagline: 'Where work meets living',
    badge: 'Most Popular',

    ctaText: 'Customise',
    ctaLink: '/garden-room/configure/studio-25',

    cardUseCases: ['Home office + meeting space', 'Home gym', 'Music studio', '1 bed room en suite'],
    quickViewUseCases: ['Office + Meeting Room', 'Guest Suite', 'Therapy Room', 'Design Studio'],

    description:
      'The Garden Suite offers the flexibility of a dual-zone layout \u2014 partition your space for a private office and client-facing meeting area, or configure an open-plan studio that breathes. At 25m\u00B2, it sits at the maximum size for exempted development, giving you the most space without the paperwork.',
    technicalSpecs: {
      height: '2.7m internal',
      frame: 'Galvanised steel SHS',
      insulation: '120mm PIR (U-value 0.15)',
      glazing: 'Triple-glazed aluminium',
      heating: 'Air-to-air heat pump',
      electrics: 'Full consumer unit, Cat6 ready',
      plumbing: 'Optional kitchenette prep',
    },
  }),

  /* ---- 35 m2 -- Living -------------------------------------------------- */
  buildGardenRoomProduct('living-35', {
    dimensionsDisplay: '7.0m \u00D7 5.0m',

    name: 'Garden Living',
    tagline: 'Space to grow into',
    badge: 'Coming Soon',

    ctaText: 'Register Interest',
    ctaLink: '/garden-room/configure/living-35',

    cardUseCases: ['Guest suite', 'Teen retreat', 'Rental unit'],
    quickViewUseCases: ['Multi-Desk Workspace', 'Home Gym + Office', 'Family Room', 'Content Studio'],

    description:
      'Garden Living is built for those who need room to move. Whether it\u2019s a two-person workspace with a breakout area, a home gym with an office nook, or a family media room \u2014 35m\u00B2 gives you genuine flexibility. Our portal steel frame means zero internal columns, so the space is entirely yours to define.',
    technicalSpecs: {
      height: '2.7m internal',
      frame: 'Galvanised steel portal frame',
      insulation: '150mm PIR (U-value 0.12)',
      glazing: 'Triple-glazed aluminium',
      heating: 'Air-to-air heat pump',
      electrics: 'Full consumer unit, Cat6 ready',
      plumbing: 'Optional kitchenette & WC',
    },
  }),

  /* ---- 45 m2 -- Grand --------------------------------------------------- */
  buildGardenRoomProduct('grand-45', {
    dimensionsDisplay: '9.0m \u00D7 5.0m',

    name: 'Grand Studio',
    tagline: 'A building, not just a room',
    badge: 'Coming Soon',

    ctaText: 'Register Interest',
    ctaLink: '/garden-room/configure/grand-45',

    cardUseCases: ['Self-contained apartment', 'Multi-room workspace'],
    quickViewUseCases: ['Full Living Annex', 'Large Studio / Workshop', 'Commercial Suite', 'Granny Flat'],

    description:
      'The Grand Studio blurs the line between garden room and architecture. At 45m\u00B2, this is a genuine self-contained building \u2014 large enough for an open-plan living and working space, a commercial therapy or consulting suite, or an independent annex for family. Designed to the same exacting standards as our smaller models, but with the presence and capability of a permanent structure.',
    technicalSpecs: {
      height: '2.8m internal',
      frame: 'Galvanised steel portal frame',
      insulation: '150mm PIR (U-value 0.12)',
      glazing: 'Triple-glazed aluminium',
      heating: 'Air-to-air heat pump (dual zone)',
      electrics: 'Full consumer unit, Cat6, EV-ready',
      plumbing: 'Optional full kitchen & WC',
    },
  }),
];


/* =============================================================================
   DERIVED EXPORT: PRODUCT SHOWCASE
   -----------------------------------------------------------------------------
   Projects canonical products into the ProductShowcaseProduct shape for the
   50/50 split hero section. Maps identity, base pricing, images, and
   dimensions. The permitFree flag is the boolean inverse of planningPermission.
   The imageAlt follows a consistent template derived from showcase label and
   floor area. Consumed by the ProductShowcase component.
   ============================================================================= */

export const PRODUCT_SHOWCASE_PRODUCTS: ProductShowcaseProduct[] =
  CANONICAL_PRODUCTS.map((p) => ({
    id: p.id,
    size: String(p.areaM2),
    unit: 'm\u00B2',
    dimensions: p.dimensionsDisplay,
    price: p.basePrice,
    label: p.showcaseLabel,
    permitFree: !p.planningPermission,
    imageSrc: p.image.png,
    imageWebP: p.image.webP,
    imageAvif: p.image.avif,
    imageAlt: `${p.showcaseLabel} ${p.areaM2}m\u00B2 steel frame garden room`,
  }));


/* =============================================================================
   DIRECT EXPORT: STANDARD FEATURES
   -----------------------------------------------------------------------------
   Five standard features included with every garden room, displayed on the
   right side of the ProductShowcase 50/50 split. These are product-line-wide
   (not per-product) so they are declared directly rather than derived from
   canonical records.
   ============================================================================= */

export const PRODUCT_SHOWCASE_FEATURES: ProductShowcaseFeature[] = [
  {
    icon: '\u25C6',
    title: 'Steel Frame Construction',
    desc: 'Galvanised structural steel for unmatched durability and longevity.',
  },
  {
    icon: '\u25C6',
    title: 'Full Insulation Package',
    desc: 'High-performance PIR insulation exceeding Part L building regulations.',
  },
  {
    icon: '\u25C6',
    title: 'Electrical Fit-Out',
    desc: 'Certified RECI electrical installation with consumer unit included.',
  },
  {
    icon: '\u25C6',
    title: 'Aluminium Windows & Doors',
    desc: 'Thermally broken, double-glazed aluminium frames in anthracite grey.',
  },
  {
    icon: '\u25C6',
    title: 'Composite Cladding',
    desc: 'Low maintenance external cladding with a 25-year colour guarantee.',
  },
];


/* =============================================================================
   DIRECT EXPORT: WARRANTY COVERAGE
   -----------------------------------------------------------------------------
   Four warranty tiers displayed on the right side of the ProductShowcase
   50/50 split, below the standard features. These apply uniformly across
   all garden room models and are declared directly.
   ============================================================================= */

export const PRODUCT_SHOWCASE_WARRANTIES: ProductShowcaseWarranty[] = [
  { years: '25', label: 'Structural Warranty', sub: 'Steel frame & foundations' },
  { years: '15', label: 'Cladding Guarantee', sub: 'Colour & weather resistance' },
  { years: '10', label: 'Roof Membrane', sub: 'Watertight assurance' },
  { years: '10', label: 'Windows & Doors', sub: 'Thermal & mechanical' },
];


/* =============================================================================
   DERIVED EXPORT: PRODUCT RANGE CARDS
   -----------------------------------------------------------------------------
   Projects canonical products into the ProductCard shape for the
   ProductRangeGrid component. Maps identity, card pricing, images, use
   cases, and availability status. The badge field is spread conditionally
   (only when defined on the canonical record). CTA links route to the
   product configurator at /garden-room/configure/:slug.
   ============================================================================= */

export const GARDEN_ROOM_PRODUCTS: ProductCard[] =
  CANONICAL_PRODUCTS.map((p) => ({
    size: `${p.areaM2}m\u00B2`,
    name: p.name,
    tagline: p.tagline,
    image: p.image.png,
    imageWebP: p.image.webP,
    imageAvif: p.image.avif,
    useCases: [...p.cardUseCases],
    price: p.basePrice,
    planningPermission: p.planningPermission,
    inStock: p.inStock,
    ...(p.badge != null ? { badge: p.badge } : {}),
    ctaText: p.ctaText,
    ctaLink: p.ctaLink,
    available: p.available,
  }));


/* =============================================================================
   DERIVED EXPORT: QUICK VIEW MODAL DATA
   -----------------------------------------------------------------------------
   Projects canonical products into the QuickViewProduct shape for the
   QuickViewModal component. Maps identity, base pricing, images, extended
   use cases, and technical details. The specs.footprint field is injected
   from dimensionsDisplay at projection time, avoiding redundant storage
   of dimensional data in the canonical technicalSpecs record.
   ============================================================================= */

export const GARDEN_ROOM_QUICK_VIEW: QuickViewProduct[] =
  CANONICAL_PRODUCTS.map((p) => ({
    size: `${p.areaM2}m\u00B2`,
    name: p.name,
    tagline: p.tagline,
    image: p.image.png,
    imageWebP: p.image.webP,
    imageAvif: p.image.avif,
    useCases: [...p.quickViewUseCases],
    price: p.basePrice,
    planningPermission: p.planningPermission,
    inStock: p.inStock,
    available: p.available,
    description: p.description,
    specs: { footprint: p.dimensionsDisplay, ...p.technicalSpecs },
    leadTime: p.leadTime,
    ctaLink: p.ctaLink,
    ctaText: p.ctaText,
  }));


/* =============================================================================
   DIRECT EXPORT: FAQ DATA
   -----------------------------------------------------------------------------
   Six frequently asked questions covering the most common queries from
   prospective garden room buyers in Ireland. Each entry conforms to the
   AccordionFAQItem interface and includes an id (for ARIA attributes),
   a display number, the question title, and the answer description.

   DUAL USE: This array is consumed by both:
   - The AccordionFAQ component (visual FAQ section)
   - The FAQPage JSON-LD schema in routes-metadata.ts (structured data)
   Any update here automatically keeps both in sync.
   ============================================================================= */

export const GARDEN_ROOM_FAQS: AccordionFAQItem[] = [
  {
    id: 'faq-1',
    number: '01',
    title: 'Do I need planning permission for a garden room?',
    description:
      'Under current Irish planning legislation, garden rooms up to 25 square metres are generally exempt from planning permission, provided they comply with conditions such as maximum height (4 m for a pitched roof, 3 m for a flat roof), boundary setbacks, and aggregate floor area limits for exempted structures. Our 15 and 25 square metre models fall within these thresholds. The 35 and 45 square metre sizes are subject to pending legislation that may extend the exemption limit. We handle all planning paperwork on your behalf.',
  },
  {
    id: 'faq-2',
    number: '02',
    title: 'How long does it take to build a garden room?',
    description:
      'From order confirmation to handover, a typical Modular House garden room takes 6 to 8 weeks. This includes 1 to 2 weeks of off-site steel frame fabrication, 1 week of foundation preparation, and 4 to 5 weeks of on-site assembly, insulation, and interior finishing. Actual timelines may vary based on site conditions and chosen specification.',
  },
  {
    id: 'faq-3',
    number: '03',
    title: 'What sizes of garden rooms do you offer?',
    description:
      'We currently offer four standard sizes: 15 square metres (Compact Studio), 25 square metres (Garden Suite), 35 square metres (Garden Living), and 45 square metres (Grand Studio). Each model can be customised with different layouts, window configurations, and interior finishes to suit your specific needs.',
  },
  {
    id: 'faq-4',
    number: '04',
    title: 'How is the garden room insulated and heated?',
    description:
      'Every garden room features high-performance PIR insulation panels in the walls, floor, and roof, achieving an A-rated BER (Building Energy Rating). Triple-glazed, thermally broken windows and doors minimise heat loss. Heating options include electric underfloor heating, wall-mounted panel heaters, or connection to your home heating system via an insulated supply pipe.',
  },
  {
    id: 'faq-5',
    number: '05',
    title: 'Can I use the garden room as a home office year-round?',
    description:
      'Yes. Our steel-frame construction combined with A-rated insulation, triple glazing, and integrated heating maintains a comfortable working temperature throughout all four seasons. The structures are designed to the same thermal performance standards as a permanent dwelling, ensuring year-round comfort whether used as a home office, studio, or living space.',
  },
  {
    id: 'faq-6',
    number: '06',
    title: 'What is included in the price?',
    description:
      'The quoted price includes the precision-cut steel frame, full PIR insulation, external cladding, internal plasterboard lining, laminate or tile flooring, electrical wiring with LED lighting and sockets, triple-glazed windows and doors, and a 10-year structural warranty. Foundation works, plumbing, and bespoke upgrades (such as underfloor heating or additional power circuits) are quoted separately based on site requirements.',
  },
];


/* =============================================================================
   DIRECT EXPORT: FEATURE ITEMS (WHY STEEL FRAME SECTION)
   -----------------------------------------------------------------------------
   Four key selling points displayed in the FeatureSection component.
   Each item includes an icon (rendered via the CustomIcons component),
   a concise title, and a descriptive paragraph.

   Icon selection uses the closest available matches from the CustomIcons
   library:
   - measureTape  -> Made in Our Dublin Factory (measurement / precision)
   - tiles        -> Faster, Cleaner Installation (modular construction)
   - bioEnergy    -> Built for Irish Weather (sustainability / energy)
   - keyCircle    -> A Long-Term Space, Not a Shed (durability / warranty)
   ============================================================================= */

export const GARDEN_ROOM_FEATURES: FeatureItem[] = [
  {
    icon: React.createElement(CustomIcons, { name: 'measureTape', size: 48 }),
    title: 'Made in Our Dublin Factory',
    description:
      'We manufacture every light gauge steel frame in-house in Dublin, so your garden room benefits from tighter quality control, accurate fabrication, and dependable lead times from design through installation.',
  },
  {
    icon: React.createElement(CustomIcons, { name: 'tiles', size: 48 }),
    title: 'Faster, Cleaner Installation',
    description:
      'Because the structure is pre-engineered before it reaches site, our garden rooms go up faster with less mess, less noise, and less disruption to your home than a traditional build.',
  },
  {
    icon: React.createElement(CustomIcons, { name: 'bioEnergy', size: 48 }),
    title: 'Built for Irish Weather',
    description:
      'High-performance insulation, thermally efficient detailing, and quality glazing help create garden rooms in Ireland that stay warm in winter, comfortable in summer, and efficient to run all year round.',
  },
  {
    icon: React.createElement(CustomIcons, { name: 'keyCircle', size: 48 }),
    title: 'A Long-Term Space, Not a Shed',
    description:
      'Our steel-framed garden rooms are engineered as permanent-feeling spaces for work, guests, fitness, or daily living, with none of the rot, warp, or maintenance concerns associated with timber-heavy alternatives.',
  },
];


/* =============================================================================
   DIRECT EXPORT: TESTIMONIAL DATA
   -----------------------------------------------------------------------------
   Three placeholder customer testimonials displayed in the TestimonialGrid
   component. These use realistic quotes and Dublin-area locations. The
   placeholder avatar image path should be replaced with real customer
   photos when available.

   All ratings are set to 5 stars. The TestimonialGrid component defaults
   to 5 when the rating field is omitted, but explicit values are provided
   here for clarity.
   ============================================================================= */

export const GARDEN_ROOM_TESTIMONIALS: TestimonialItem[] = [
  {
    text: 'Our Modular House garden room has completely transformed how we work from home. The build quality is exceptional \u2014 the steel frame feels incredibly solid, and the insulation keeps it warm even in January. It was ready in just seven weeks with barely any disruption to our garden.',
    authorName: 'Aoife K.',
    authorLocation: 'Dalkey, Co. Dublin',
    authorImageSrc: '/resource/avatar-placeholder.png',
    rating: 5,
  },
  {
    text: 'We needed extra space for our teenage son and the 25 square metre Garden Suite was the perfect solution. The triple glazing and underfloor heating make it comfortable year-round. The whole process from first enquiry to handover was professional and straightforward.',
    authorName: 'Ciaran M.',
    authorLocation: 'Blackrock, Co. Dublin',
    authorImageSrc: '/resource/avatar-placeholder.png',
    rating: 5,
  },
  {
    text: 'As an artist I was looking for a bright, well-insulated studio space without the hassle of planning permission. The Compact Studio ticked every box \u2014 the natural light from the triple-glazed windows is superb, and the BER A rating means my heating costs are minimal.',
    authorName: 'Sinead O.',
    authorLocation: 'Malahide, Co. Dublin',
    authorImageSrc: '/resource/avatar-placeholder.png',
    rating: 5,
  },
];


/* =============================================================================
   DIRECT EXPORT: GALLERY DATA
   -----------------------------------------------------------------------------
   Eight gallery items for the FullMassonryGallery component. Each item
   references an existing image from /public/resource/garden-room/ with
   WebP and AVIF optimised variants. The gallery showcases completed garden
   room and sauna projects. Descriptive titles improve both user experience
   and SEO when indexed.
   ============================================================================= */

export const GARDEN_ROOM_GALLERY: GalleryItem[] = [
  {
    imageUrl: '/resource/garden-room/garden-room1.png',
    imageWebP: '/resource/garden-room/garden-room1.webp',
    imageAvif: '/resource/garden-room/garden-room1.avif',
    title: 'Garden Suite with panoramic glazing',
    category: 'Garden Room',
  },
  {
    imageUrl: '/resource/garden-room/garden-room2.png',
    imageWebP: '/resource/garden-room/garden-room2.webp',
    imageAvif: '/resource/garden-room/garden-room2.avif',
    title: 'Contemporary garden room exterior',
    category: 'Garden Room',
  },
  {
    imageUrl: '/resource/garden-room/garden-room3.png',
    imageWebP: '/resource/garden-room/garden-room3.webp',
    imageAvif: '/resource/garden-room/garden-room3.avif',
    title: 'Grand Studio with cedar cladding',
    category: 'Garden Room',
  },
  {
    imageUrl: '/resource/garden-room/garden-room4.png',
    imageWebP: '/resource/garden-room/garden-room4.webp',
    imageAvif: '/resource/garden-room/garden-room4.avif',
    title: 'Compact Studio home office setup',
    category: 'Garden Room',
  },
  {
    imageUrl: '/resource/garden-room/garden-room5.png',
    imageWebP: '/resource/garden-room/garden-room5.webp',
    imageAvif: '/resource/garden-room/garden-room5.avif',
    title: 'Garden room interior with natural light',
    category: 'Garden Room',
  },
  {
    imageUrl: '/resource/garden-room/garden-room6.jpg',
    imageWebP: '/resource/garden-room/garden-room6.webp',
    imageAvif: '/resource/garden-room/garden-room6.avif',
    title: 'Modern garden room at dusk',
    category: 'Garden Room',
  },
  {
    imageUrl: '/resource/garden-room/garden-room-sauna1.jpg',
    imageWebP: '/resource/garden-room/garden-room-sauna1.webp',
    imageAvif: '/resource/garden-room/garden-room-sauna1.avif',
    title: 'Garden sauna with steel frame construction',
    category: 'Garden Room',
  },
  {
    imageUrl: '/resource/garden-room/garden-room-sauna2.jpg',
    imageWebP: '/resource/garden-room/garden-room-sauna2.webp',
    imageAvif: '/resource/garden-room/garden-room-sauna2.avif',
    title: 'Outdoor sauna room interior',
    category: 'Garden Room',
  },
];


/* =============================================================================
   DIRECT EXPORT: CONSTRUCTION COMPARISON DATA
   -----------------------------------------------------------------------------
   Eight comparison categories evaluating three construction methods (LGS
   Steel Frame, Timber Frame, Traditional Brick) across performance metrics.
   Each category contains per-method data with a display value, a numeric
   score (1-5), and explanatory note. Consumed by the ComparisonSection
   component which supports both table and card viewing modes.
   ============================================================================= */

export const GARDEN_ROOM_COMPARISON_CATEGORIES: ComparisonCategory[] = [
  {
    label: 'Lifespan',
    lgs: { value: '100+ years', score: 5, note: 'Steel does not degrade, warp, or rot over time' },
    wood: { value: '30\u201350 years', score: 3, note: 'Susceptible to rot, insects, and moisture damage' },
    brick: { value: '80\u2013100 years', score: 4, note: 'Durable but mortar joints need ongoing repointing' },
  },
  {
    label: 'Build Time',
    lgs: { value: '6\u201310 weeks', score: 4, note: 'Precision-manufactured in our Dublin factory, rapid on-site assembly' },
    wood: { value: '10\u201312 weeks', score: 2, note: 'Weather-dependent, prone to delays on site' },
    brick: { value: '12\u201320 weeks', score: 2, note: 'Slow, labour-intensive, highly weather-dependent' },
  },
  {
    label: 'Thermal Efficiency',
    lgs: { value: 'A1\u2013A2 BER', score: 5, note: 'Integrated insulation cavities achieve near-passive-house performance' },
    wood: { value: 'B1\u2013B3 BER', score: 3, note: 'Good if well-insulated, but thermal bridging at joints is common' },
    brick: { value: 'B2\u2013C1 BER', score: 2, note: 'Poor thermal mass-to-insulation ratio without costly retrofitting' },
  },
  {
    label: 'Maintenance',
    lgs: { value: 'Near zero', score: 5, note: 'No painting, no treating, no rot \u2014 just the occasional clean' },
    wood: { value: 'Regular', score: 2, note: 'Requires staining, painting, pest treatment every 3\u20135 years' },
    brick: { value: 'Low\u2013Moderate', score: 3, note: 'Mortar repointing and damp-proofing needed periodically' },
  },
  {
    label: 'Sustainability',
    lgs: { value: '100% recyclable', score: 5, note: 'Steel is the world\u2019s most recycled material \u2014 zero landfill waste' },
    wood: { value: 'Renewable', score: 4, note: 'Renewable source, but treatment chemicals limit recyclability' },
    brick: { value: 'Limited', score: 2, note: 'Energy-intensive production, difficult to recycle at end of life' },
  },
  {
    label: 'Long-term Cost',
    lgs: { value: 'Lowest', score: 5, note: 'Lower maintenance + energy bills = significant savings over 20 years' },
    wood: { value: 'Moderate', score: 3, note: 'Cheaper upfront but ongoing maintenance adds up substantially' },
    brick: { value: 'Highest', score: 2, note: 'High build cost, slow ROI, expensive energy bills without upgrades' },
  },
  {
    label: 'Fire Resistance',
    lgs: { value: 'Non-combustible', score: 5, note: 'Steel doesn\u2019t burn \u2014 inherently fire-safe structure' },
    wood: { value: 'Combustible', score: 1, note: 'Requires fire-retardant treatments that wear off over time' },
    brick: { value: 'Non-combustible', score: 5, note: 'Excellent fire resistance \u2014 a genuine strength of masonry' },
  },
  {
    label: 'Structural Precision',
    lgs: { value: '\u00B11mm tolerance', score: 5, note: 'CNC-cut in factory \u2014 no guesswork, no human error on site' },
    wood: { value: '\u00B15\u201310mm', score: 3, note: 'Varies with moisture content and carpenter skill level' },
    brick: { value: '\u00B13\u20135mm', score: 3, note: 'Depends heavily on the skill of the bricklayer' },
  },
];


/* =============================================================================
   DIRECT EXPORT: INFINITE MASONRY GALLERY DATA
   -----------------------------------------------------------------------------
   Image data for the InfiniteMasonryGallery component -- a horizontally-
   scrolling infinite strip placed directly below the Product Showcase section.
   Each image specifies its orientation so the masonry layout algorithm can
   pair landscape images vertically and give portrait images a full-height
   column. All images include AVIF and WebP variants for optimal delivery.
   ============================================================================= */

export const INFINITE_GALLERY_IMAGES: InfiniteGalleryImage[] = [
  {
    id: 'gr-1',
    src: '/resource/garden-room/garden-room1.png',
    srcWebP: '/resource/garden-room/garden-room1.webp',
    srcAvif: '/resource/garden-room/garden-room1.avif',
    alt: 'Garden suite with panoramic glazing',
    orientation: 'landscape',
  },
  {
    id: 'gr-sauna-1',
    src: '/resource/garden-room/garden-room-sauna1.jpg',
    srcWebP: '/resource/garden-room/garden-room-sauna1.webp',
    srcAvif: '/resource/garden-room/garden-room-sauna1.avif',
    alt: 'Garden sauna with steel frame construction',
    orientation: 'portrait',
  },
  {
    id: 'gr-2',
    src: '/resource/garden-room/garden-room2.png',
    srcWebP: '/resource/garden-room/garden-room2.webp',
    srcAvif: '/resource/garden-room/garden-room2.avif',
    alt: 'Contemporary garden room exterior',
    orientation: 'landscape',
  },
  {
    id: 'gr-3',
    src: '/resource/garden-room/garden-room3.png',
    srcWebP: '/resource/garden-room/garden-room3.webp',
    srcAvif: '/resource/garden-room/garden-room3.avif',
    alt: 'Grand studio with cedar cladding',
    orientation: 'landscape',
  },
  {
    id: 'gr-sauna-2',
    src: '/resource/garden-room/garden-room-sauna2.jpg',
    srcWebP: '/resource/garden-room/garden-room-sauna2.webp',
    srcAvif: '/resource/garden-room/garden-room-sauna2.avif',
    alt: 'Outdoor sauna room interior',
    orientation: 'portrait',
  },
  {
    id: 'gr-4',
    src: '/resource/garden-room/garden-room4.png',
    srcWebP: '/resource/garden-room/garden-room4.webp',
    srcAvif: '/resource/garden-room/garden-room4.avif',
    alt: 'Compact studio home office setup',
    orientation: 'landscape',
  },
  {
    id: 'gr-5',
    src: '/resource/garden-room/garden-room5.png',
    srcWebP: '/resource/garden-room/garden-room5.webp',
    srcAvif: '/resource/garden-room/garden-room5.avif',
    alt: 'Garden room interior with natural light',
    orientation: 'landscape',
  },
  {
    id: 'gr-sauna-3',
    src: '/resource/garden-room/garden-room-sauna3.jpg',
    srcWebP: '/resource/garden-room/garden-room-sauna3.webp',
    srcAvif: '/resource/garden-room/garden-room-sauna3.avif',
    alt: 'Sauna room with timber interior',
    orientation: 'portrait',
  },
  {
    id: 'gr-6',
    src: '/resource/garden-room/garden-room6.jpg',
    srcWebP: '/resource/garden-room/garden-room6.webp',
    srcAvif: '/resource/garden-room/garden-room6.avif',
    alt: 'Modern garden room at dusk',
    orientation: 'landscape',
  },
  {
    id: 'gr-7',
    src: '/resource/garden-room/garden-room7.jpg',
    srcWebP: '/resource/garden-room/garden-room7.webp',
    srcAvif: '/resource/garden-room/garden-room7.avif',
    alt: 'Garden room with landscaped surroundings',
    orientation: 'landscape',
  },
  {
    id: 'gr-ext-1',
    src: '/resource/garden-room/hosue-extension1.png',
    srcWebP: '/resource/garden-room/hosue-extension1.webp',
    srcAvif: '/resource/garden-room/hosue-extension1.avif',
    alt: 'House extension with steel frame construction',
    orientation: 'landscape',
  },
];
