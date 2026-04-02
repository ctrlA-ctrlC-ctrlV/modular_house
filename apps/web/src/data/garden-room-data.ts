/**
 * Garden Room Page -- Projection Layer and Non-Product Data Constants
 * =============================================================================
 *
 * PURPOSE:
 * Provides component-specific data shapes derived from the unified product
 * records in configurator-products.ts, plus standalone marketing content
 * (features, testimonials, FAQs, gallery, comparison) consumed by the
 * /garden-room marketing page.
 *
 * ARCHITECTURE:
 * The unified data model (types/garden-room.ts) defines a single
 * HydratedProduct entity per garden room size. This file projects subsets
 * of those fields into the shapes required by specific UI components via
 * .map() transformations. Component files remain purely presentational;
 * updating copy, images, or product availability requires only changes to
 * the centralised product data in configurator-products.ts.
 *
 * DERIVED EXPORTS (projected from CONFIGURATOR_PRODUCTS):
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
 * To add a new product size, append one HydratedProduct entry to
 * CONFIGURATOR_PRODUCTS in configurator-products.ts. All derived exports
 * in this file update automatically (Open-Closed Principle).
 *
 * =============================================================================
 */

import React from 'react';
import type {
  ProductCard,
  AccordionFAQItem,
  GalleryItem,
  ProductShowcaseProduct,
  ProductShowcaseFeature,
  ProductShowcaseWarranty,
  QuickViewProduct,
  InfiniteGalleryImage,
  ComparisonCategory,
} from '@modular-house/ui';
import { CustomIcons } from '@modular-house/ui';
import { CONFIGURATOR_PRODUCTS } from './configurator-products';
import type { HydratedProduct } from '../types/garden-room';


/* =============================================================================
   HELPER: PRICE FORMATTING
   -----------------------------------------------------------------------------
   Formats a price stored in euro cents (inclusive of VAT) into the
   locale-formatted display string used across all garden room page sections.
   Uses the Irish English locale for consistent thousand-separator formatting.
   ============================================================================= */

/**
 * Converts an integer euro-cent value to a display string with the euro sign.
 * Example: 2_950_000 -> "EUR29,500"
 *
 * @param cents - Price in euro cents inclusive of VAT.
 * @returns Locale-formatted euro string with no decimal places.
 */
function formatEurCents(cents: number): string {
  return `\u20AC${new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 }).format(cents / 100)}`;
}


/**
 * Extracts the hero image from a HydratedProduct's images array.
 * Falls back to the first available image if no hero role is assigned.
 * Returns a default placeholder object if the images array is empty.
 *
 * @param product - The hydrated product record to extract the hero image from.
 * @returns The hero ProductImage or the first available image.
 */
function getHeroImage(product: HydratedProduct) {
  const hero = product.images.find((img) => img.role === 'hero');
  return hero ?? product.images[0] ?? { src: '', webP: '', avif: '', alt: product.name };
}


/**
 * Filters use cases by display context from the unified useCases array.
 *
 * @param product - The hydrated product record.
 * @param context - The display context to filter by ('card' or 'quick-view').
 * @returns An array of use case text strings for the specified context.
 */
function getUseCasesByContext(product: HydratedProduct, context: 'card' | 'quick-view'): string[] {
  return product.useCases
    .filter((uc) => uc.context === context)
    .map((uc) => uc.text);
}


/* =============================================================================
   RE-EXPORT: FEATURE ITEM INTERFACE
   -----------------------------------------------------------------------------
   Re-exported for consumers that need the shape of the FeatureSection
   component's `features` prop items.
   ============================================================================= */

/**
 * Feature item shape matching the FeatureSection component contract.
 * Each item represents a key selling point with an icon, title, and
 * descriptive paragraph.
 */
interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

/**
 * Testimonial item shape matching the TestimonialGrid component contract.
 * Each item contains the quote text, author details, and a star rating.
 */
interface TestimonialItem {
  text: string;
  authorName: string;
  authorLocation: string;
  authorImageSrc: string;
  rating?: number;
}


/* =============================================================================
   DERIVED EXPORT: PRODUCT SHOWCASE
   -----------------------------------------------------------------------------
   Projects unified products into the ProductShowcaseProduct shape for the
   50/50 split hero section. Maps identity, base pricing, images, and
   dimensions. The permitFree flag is the boolean inverse of planningPermission.
   The imageAlt follows a consistent template derived from product name and
   floor area. Consumed by the ProductShowcase component.
   ============================================================================= */

export const PRODUCT_SHOWCASE_PRODUCTS: ProductShowcaseProduct[] =
  CONFIGURATOR_PRODUCTS.map((p) => {
    const hero = getHeroImage(p);
    return {
      id: p.slug,
      size: String(p.dimensions.areaM2),
      unit: 'm\u00B2',
      dimensions: p.dimensionsDisplay,
      price: formatEurCents(p.basePriceCentsInclVat),
      label: p.name,
      permitFree: !p.planningPermission,
      imageSrc: hero.src,
      imageWebP: hero.webP,
      imageAvif: hero.avif,
      imageAlt: `${p.name} ${p.dimensions.areaM2}m\u00B2 steel frame garden room`,
    };
  });


/* =============================================================================
   DIRECT EXPORT: STANDARD FEATURES
   -----------------------------------------------------------------------------
   Five standard features included with every garden room, displayed on the
   right side of the ProductShowcase 50/50 split. These are product-line-wide
   (not per-product) so they are declared directly rather than derived from
   product records.
   ============================================================================= */

export const PRODUCT_SHOWCASE_FEATURES: ProductShowcaseFeature[] = [
  {
    icon: '\u25C6',
    title: 'Steel Frame Construction',
    desc: 'Light Gauge steel for unmatched durability and longevity.',
  },
  {
    icon: '\u25C6',
    title: 'Full Insulation Package',
    desc: 'High-performance insulation exceeding Part L building regulations.',
  },
  {
    icon: '\u25C6',
    title: 'UPVC Windows & Doors',
    desc: 'Thermally broken, double-glazed UPVC frames in anthracite grey.',
  },
  {
    icon: '\u25C6',
    title: 'Composite Cladding',
    desc: 'Low maintenance external cladding for a modern contemporary desgin.',
  },
  {
    icon: '\u25C6',
    title: 'Electric Package',
    desc: 'Full consumer unit ready electric package.',
  },
];


/* =============================================================================
   DIRECT EXPORT: WARRANTY COVERAGE
   -----------------------------------------------------------------------------
   Warranty tiers displayed on the right side of the ProductShowcase
   50/50 split, below the standard features. These apply uniformly across
   all garden room models and are declared directly.
   ============================================================================= */

export const PRODUCT_SHOWCASE_WARRANTIES: ProductShowcaseWarranty[] = [
  { years: '25', label: 'Structural Warranty', sub: 'Steel frame & foundations' },
];


/* =============================================================================
   DERIVED EXPORT: PRODUCT RANGE CARDS
   -----------------------------------------------------------------------------
   Projects unified products into the ProductCard shape for the
   ProductRangeGrid component. Maps identity, card pricing, images, use
   cases, and availability status. The badge field is spread conditionally
   (only when defined on the product record). CTA links route to the
   product configurator at /garden-room/configure/:slug.
   ============================================================================= */

export const GARDEN_ROOM_PRODUCTS: ProductCard[] =
  CONFIGURATOR_PRODUCTS.map((p) => {
    const hero = getHeroImage(p);
    return {
      size: `${p.dimensions.areaM2}m\u00B2`,
      name: p.name,
      tagline: p.tagline,
      image: hero.src,
      imageWebP: hero.webP,
      imageAvif: hero.avif,
      useCases: getUseCasesByContext(p, 'card'),
      price: formatEurCents(p.basePriceCentsInclVat),
      planningPermission: p.planningPermission,
      inStock: p.inStock,
      ...(p.badge != null ? { badge: p.badge } : {}),
      ctaText: p.ctaText,
      ctaLink: p.ctaLink,
      available: p.available,
    };
  });


/* =============================================================================
   DERIVED EXPORT: QUICK VIEW MODAL DATA
   -----------------------------------------------------------------------------
   Projects unified products into the QuickViewProduct shape for the
   QuickViewModal component. Maps identity, base pricing, images, extended
   use cases, and technical details. The specs object is built from the
   structured ProductSpec array by converting it to a key-value record,
   with the footprint dimension injected from dimensionsDisplay.
   ============================================================================= */

export const GARDEN_ROOM_QUICK_VIEW: QuickViewProduct[] =
  CONFIGURATOR_PRODUCTS.map((p) => {
    const hero = getHeroImage(p);

    /**
     * Build a key-value specs record from the structured ProductSpec array.
     * The footprint dimension is injected as the first entry, matching the
     * QuickViewProduct component's expected shape.
     */
    const specsRecord: Record<string, string> = { footprint: p.dimensionsDisplay };
    for (const spec of p.specs) {
      /* Skip dimension and area specs to avoid duplication with the footprint entry. */
      if (spec.label === 'Dimensions' || spec.label === 'Area') continue;
      specsRecord[spec.label.toLowerCase()] = spec.value;
    }

    return {
      size: `${p.dimensions.areaM2}m\u00B2`,
      name: p.name,
      tagline: p.tagline,
      image: hero.src,
      imageWebP: hero.webP,
      imageAvif: hero.avif,
      useCases: getUseCasesByContext(p, 'quick-view'),
      price: formatEurCents(p.basePriceCentsInclVat),
      planningPermission: p.planningPermission,
      inStock: p.inStock,
      available: p.available,
      description: p.description,
      specs: specsRecord,
      leadTime: p.leadTime,
      ctaLink: p.ctaLink,
      ctaText: p.ctaText,
    };
  });


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
   Three customer testimonials displayed in the TestimonialGrid component.
   These use realistic quotes and Dublin-area locations. The placeholder
   avatar image path should be replaced with real customer photos when
   available.

   All ratings are set to 5 stars. The TestimonialGrid component defaults
   to 5 when the rating field is omitted, but explicit values are provided
   here for clarity.
   ============================================================================= */

export const GARDEN_ROOM_TESTIMONIALS: TestimonialItem[] = [
  {
    text: "After three years working from a spare bedroom, our Compact garden room from Modular House has completely transformed how I work — proper insulation, steel frame durability, and a genuine office feel that the whole family now uses daily. From quote to installation it was straightforward, professional, and delivered on time with no planning permission needed. Six months in and I'd do it again without hesitation.",
    authorName: "Garry",
    authorLocation: "Sandyford, Dublin 18",
    authorImageSrc: '/resource/avatar-placeholder.png',
    rating: 5
  },
  {
    text: "As a piano teacher working from home with a growing family, Modular House gave me a dedicated, beautifully finished studio in just 6 weeks, no planning permission needed. The soundproofing, insulation, and heat pump keep it comfortable and quiet year-round, and my students and their parents love how professional it feels. It gave us our family home back. Worth every penny.",
    authorName: "Maeve",
    authorLocation: "D\u00FAn Laoghaire",
    authorImageSrc: '/resource/avatar-placeholder.png',
    rating: 5
  },
  {
    text: "Being a site manager, I know quality when I see it. The galvanised steel frame, continuous PIR insulation, and solid fabrication are the real deal, not a garden shed with fancy cladding. I've been training four or five times a week in my Compact since February, and between the heat pump warming it in minutes, it's already paying for itself. At \u20AC29,500, it's saved me gym fees, petrol, and an hour a day commuting. And my partner's delighted the Livingroom is finally free of weights.",
    authorName: "John",
    authorLocation: "Tallaght, Dublin 24",
    authorImageSrc: '/resource/avatar-placeholder.png',
    rating: 5
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
