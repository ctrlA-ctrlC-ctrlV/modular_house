/**
 * Garden Room Page — Shared Data Constants
 * =============================================================================
 *
 * PURPOSE:
 * Single source of truth for all content displayed on the /garden-room page.
 * By centralising data here, page-level component files remain purely
 * presentational, and updating copy, images, or product availability
 * requires only data changes — not component modifications.
 *
 * ARCHITECTURE:
 * Each exported constant is a typed array that maps directly to a section
 * of the garden room page. The types are imported from @modular-house/ui
 * to ensure strict compatibility with the corresponding component props.
 *
 * DATA CATEGORIES:
 * 1. GARDEN_ROOM_PRODUCTS   — Product Range section (ProductRangeGrid)
 * 2. GARDEN_ROOM_FAQS       — FAQ section (AccordionFAQ) + FAQPage schema
 * 3. GARDEN_ROOM_FEATURES   — Why Steel Frame section (FeatureSection)
 * 4. GARDEN_ROOM_TESTIMONIALS — Testimonials section (TestimonialGrid)
 * 5. GARDEN_ROOM_GALLERY    — Gallery section (FullMassonryGallery)
 * 6. INFINITE_GALLERY_IMAGES — Infinite scrolling gallery (InfiniteMasonryGallery)
 *
 * DUAL USE:
 * The GARDEN_ROOM_FAQS array feeds both the AccordionFAQ component props
 * and the FAQPage JSON-LD schema generation in routes-metadata.ts. Any
 * change to FAQ content here automatically propagates to both the visible
 * accordion and the structured data markup.
 *
 * =============================================================================
 */

import React from 'react';
import type { ProductCard, AccordionFAQItem, GalleryItem, ProductShowcaseProduct, ProductShowcaseFeature, ProductShowcaseWarranty, QuickViewProduct, InfiniteGalleryImage, ComparisonCategory } from '@modular-house/ui';
import { CustomIcons } from '@modular-house/ui';

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
   SECTION 0: PRODUCT SHOWCASE DATA
   -----------------------------------------------------------------------------
   Data for the ProductShowcase component — the 50/50 split section placed
   between the Hero and the Product Range grid. Left side shows four product
   rows with background images; right side lists standard features and
   warranty coverage.
   ============================================================================= */

export const PRODUCT_SHOWCASE_PRODUCTS: ProductShowcaseProduct[] = [
  {
    id: 'compact-15',
    size: '15',
    unit: 'm²',
    dimensions: '5.0m × 3.0m',
    price: '€26,000',
    label: 'The Compact',
    permitFree: true,
    imageSrc: '/resource/garden-room/garden-room4.png',
    imageWebP: '/resource/garden-room/garden-room4.webp',
    imageAvif: '/resource/garden-room/garden-room4.avif',
    imageAlt: 'The Compact 15m² steel frame garden room',
  },
  {
    id: 'studio-25',
    size: '25',
    unit: 'm²',
    dimensions: '6.25m × 4.0m',
    price: '€37,000',
    label: 'The Studio',
    permitFree: true,
    imageSrc: '/resource/garden-room/garden-room1.png',
    imageWebP: '/resource/garden-room/garden-room1.webp',
    imageAvif: '/resource/garden-room/garden-room1.avif',
    imageAlt: 'The Studio 25m² steel frame garden room',
  },
  {
    id: 'living-35',
    size: '35',
    unit: 'm²',
    dimensions: '7.0m × 5.0m',
    price: '€65,000',
    label: 'The Living',
    permitFree: false,
    imageSrc: '/resource/garden-room/garden-room2.png',
    imageWebP: '/resource/garden-room/garden-room2.webp',
    imageAvif: '/resource/garden-room/garden-room2.avif',
    imageAlt: 'The Living 35m² steel frame garden room',
  },
  {
    id: 'grand-45',
    size: '45',
    unit: 'm²',
    dimensions: '9.0m × 5.0m',
    price: '€76,000',
    label: 'The Grand',
    permitFree: false,
    imageSrc: '/resource/garden-room/garden-room3.png',
    imageWebP: '/resource/garden-room/garden-room3.webp',
    imageAvif: '/resource/garden-room/garden-room3.avif',
    imageAlt: 'The Grand 45m² steel frame garden room',
  },
];

export const PRODUCT_SHOWCASE_FEATURES: ProductShowcaseFeature[] = [
  {
    icon: '◆',
    title: 'Steel Frame Construction',
    desc: 'Galvanised structural steel for unmatched durability and longevity.',
  },
  {
    icon: '◆',
    title: 'Full Insulation Package',
    desc: 'High-performance PIR insulation exceeding Part L building regulations.',
  },
  {
    icon: '◆',
    title: 'Electrical Fit-Out',
    desc: 'Certified RECI electrical installation with consumer unit included.',
  },
  {
    icon: '◆',
    title: 'Aluminium Windows & Doors',
    desc: 'Thermally broken, double-glazed aluminium frames in anthracite grey.',
  },
  {
    icon: '◆',
    title: 'Composite Cladding',
    desc: 'Low maintenance external cladding with a 25-year colour guarantee.',
  },
];

export const PRODUCT_SHOWCASE_WARRANTIES: ProductShowcaseWarranty[] = [
  { years: '20', label: 'Structural Warranty', sub: 'Steel frame & foundations' },
  { years: '25', label: 'Cladding Guarantee', sub: 'Colour & weather resistance' },
  { years: '10', label: 'Roof Membrane', sub: 'Watertight assurance' },
  { years: '10', label: 'Windows & Doors', sub: 'Thermal & mechanical' },
];


/* =============================================================================
   SECTION 1: PRODUCT RANGE DATA
   -----------------------------------------------------------------------------
   Four garden room sizes displayed in the ProductRangeGrid component.
   Each entry maps to a card in the grid. The `available` flag controls
   both the visual variant (solid vs dashed border) and the CTA style
   (filled vs outline button).

   CTA links route to the product configurator page at
   /garden-room/configure/:slug, where the slug matches the
   CONFIGURATOR_PRODUCTS_BY_SLUG keys in configurator-products.ts.

   Image paths reference the /public/resource/garden-room/ directory,
   with PNG fallback, WebP, and AVIF optimised variants.
   ============================================================================= */

export const GARDEN_ROOM_PRODUCTS: ProductCard[] = [
  {
    size: '15m\u00B2',
    name: 'Compact Studio',
    tagline: 'Your private creative sanctuary',
    image: '/resource/garden-room/garden-room4.png',
    imageWebP: '/resource/garden-room/garden-room4.webp',
    imageAvif: '/resource/garden-room/garden-room4.avif',
    useCases: ['Home office', 'Art studio', 'Yoga room'],
    price: '\u20AC26,000',
    planningPermission: false,
    inStock: true,
    ctaText: 'Get a Quote',
    ctaLink: '/garden-room/configure/compact-15',
    available: true,
  },
  {
    size: '25m\u00B2',
    name: 'Garden Suite',
    tagline: 'Where work meets living',
    image: '/resource/garden-room/garden-room1.png',
    imageWebP: '/resource/garden-room/garden-room1.webp',
    imageAvif: '/resource/garden-room/garden-room1.avif',
    useCases: ['Home office + meeting space', 'Home gym', 'Music studio', '1 bed room en suite'],
    price: '\u20AC37,000',
    planningPermission: false,
    inStock: true,
    badge: 'Most Popular',
    ctaText: 'Get a Quote',
    ctaLink: '/garden-room/configure/studio-25',
    available: true,
  },
  {
    size: '35m\u00B2',
    name: 'Garden Living',
    tagline: 'Space to grow into',
    image: '/resource/garden-room/garden-room2.png',
    imageWebP: '/resource/garden-room/garden-room2.webp',
    imageAvif: '/resource/garden-room/garden-room2.avif',
    useCases: ['Guest suite', 'Teen retreat', 'Rental unit'],
    price: '\u20AC65,000',
    planningPermission: true,
    inStock: false,
    badge: 'Coming Soon',
    ctaText: 'Register Interest',
    ctaLink: '/garden-room/configure/living-35',
    available: false,
  },
  {
    size: '45m\u00B2',
    name: 'Grand Studio',
    tagline: 'A building, not just a room',
    image: '/resource/garden-room/garden-room3.png',
    imageWebP: '/resource/garden-room/garden-room3.webp',
    imageAvif: '/resource/garden-room/garden-room3.avif',
    useCases: ['Self-contained apartment', 'Multi-room workspace'],
    price: '\u20AC76,000',
    planningPermission: true,
    inStock: false,
    badge: 'Coming Soon',
    ctaText: 'Register Interest',
    ctaLink: '/garden-room/configure/grand-45',
    available: false,
  },
];


/* =============================================================================
   SECTION 1B: QUICK VIEW MODAL DATA
   -----------------------------------------------------------------------------
   Extended product data used by the QuickViewModal component. Each entry
   corresponds to a product in GARDEN_ROOM_PRODUCTS (same index order) and
   adds description, specs, and lead time fields for the expanded modal view.
   CTA links mirror the configurator routes used by the product cards above.
   ============================================================================= */

export const GARDEN_ROOM_QUICK_VIEW: QuickViewProduct[] = [
  {
    size: '15m\u00B2',
    name: 'Compact Studio',
    tagline: 'Your private creative sanctuary',
    image: '/resource/garden-room/garden-room4.png',
    imageWebP: '/resource/garden-room/garden-room4.webp',
    imageAvif: '/resource/garden-room/garden-room4.avif',
    useCases: ['Home Office', 'Art Studio', 'Yoga & Wellness Room', 'Music Practice'],
    price: '\u20AC26,000',
    planningPermission: false,
    inStock: true,
    available: true,
    description:
      'Compact yet generous, the Compact Studio is precision-engineered for focused work and creative pursuits. Floor-to-ceiling glazing floods the space with natural light, while our thermally broken steel frame ensures year-round comfort. Perfect for those who need a dedicated space without the footprint.',
    specs: {
      footprint: '5.0m \u00D7 3.0m',
      height: '2.7m internal',
      frame: 'Galvanised steel SHS',
      insulation: '120mm PIR (U-value 0.15)',
      glazing: 'Triple-glazed aluminium',
      heating: 'Air-to-air heat pump',
      electrics: 'Full consumer unit, Cat6 ready',
    },
    leadTime: '6\u20138 weeks',
    ctaLink: '/garden-room/configure/compact-15',
    ctaText: 'Get a Quote',
  },
  {
    size: '25m\u00B2',
    name: 'Garden Suite',
    tagline: 'Where work meets living',
    image: '/resource/garden-room/garden-room1.png',
    imageWebP: '/resource/garden-room/garden-room1.webp',
    imageAvif: '/resource/garden-room/garden-room1.avif',
    useCases: ['Office + Meeting Room', 'Guest Suite', 'Therapy Room', 'Design Studio'],
    price: '\u20AC37,000',
    planningPermission: false,
    inStock: true,
    available: true,
    description:
      'The Garden Suite offers the flexibility of a dual-zone layout \u2014 partition your space for a private office and client-facing meeting area, or configure an open-plan studio that breathes. At 25m\u00B2, it sits at the maximum size for exempted development, giving you the most space without the paperwork.',
    specs: {
      footprint: '6.25m \u00D7 4.0m',
      height: '2.7m internal',
      frame: 'Galvanised steel SHS',
      insulation: '120mm PIR (U-value 0.15)',
      glazing: 'Triple-glazed aluminium',
      heating: 'Air-to-air heat pump',
      electrics: 'Full consumer unit, Cat6 ready',
      plumbing: 'Optional kitchenette prep',
    },
    leadTime: '8\u201310 weeks',
    ctaLink: '/garden-room/configure/studio-25',
    ctaText: 'Get a Quote',
  },
  {
    size: '35m\u00B2',
    name: 'Garden Living',
    tagline: 'Space to grow into',
    image: '/resource/garden-room/garden-room2.png',
    imageWebP: '/resource/garden-room/garden-room2.webp',
    imageAvif: '/resource/garden-room/garden-room2.avif',
    useCases: ['Multi-Desk Workspace', 'Home Gym + Office', 'Family Room', 'Content Studio'],
    price: '\u20AC65,000',
    planningPermission: true,
    inStock: false,
    available: false,
    description:
      'Garden Living is built for those who need room to move. Whether it\u2019s a two-person workspace with a breakout area, a home gym with an office nook, or a family media room \u2014 35m\u00B2 gives you genuine flexibility. Our portal steel frame means zero internal columns, so the space is entirely yours to define.',
    specs: {
      footprint: '7.0m \u00D7 5.0m',
      height: '2.7m internal',
      frame: 'Galvanised steel portal frame',
      insulation: '150mm PIR (U-value 0.12)',
      glazing: 'Triple-glazed aluminium',
      heating: 'Air-to-air heat pump',
      electrics: 'Full consumer unit, Cat6 ready',
      plumbing: 'Optional kitchenette & WC',
    },
    leadTime: '10\u201312 weeks',
    ctaLink: '/garden-room/configure/living-35',
    ctaText: 'Register Interest',
  },
  {
    size: '45m\u00B2',
    name: 'Grand Studio',
    tagline: 'A building, not just a room',
    image: '/resource/garden-room/garden-room3.png',
    imageWebP: '/resource/garden-room/garden-room3.webp',
    imageAvif: '/resource/garden-room/garden-room3.avif',
    useCases: ['Full Living Annex', 'Large Studio / Workshop', 'Commercial Suite', 'Granny Flat'],
    price: '\u20AC76,000',
    planningPermission: true,
    inStock: false,
    available: false,
    description:
      'The Grand Studio blurs the line between garden room and architecture. At 45m\u00B2, this is a genuine self-contained building \u2014 large enough for an open-plan living and working space, a commercial therapy or consulting suite, or an independent annex for family. Designed to the same exacting standards as our smaller models, but with the presence and capability of a permanent structure.',
    specs: {
      footprint: '9.0m \u00D7 5.0m',
      height: '2.8m internal',
      frame: 'Galvanised steel portal frame',
      insulation: '150mm PIR (U-value 0.12)',
      glazing: 'Triple-glazed aluminium',
      heating: 'Air-to-air heat pump (dual zone)',
      electrics: 'Full consumer unit, Cat6, EV-ready',
      plumbing: 'Optional full kitchen & WC',
    },
    leadTime: '12\u201316 weeks',
    ctaLink: '/garden-room/configure/grand-45',
    ctaText: 'Register Interest',
  },
];


/* =============================================================================
   SECTION 2: FAQ DATA
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
   SECTION 3: FEATURE ITEMS (WHY STEEL FRAME SECTION)
   -----------------------------------------------------------------------------
   Four key selling points displayed in the FeatureSection component.
   Each item includes an icon (rendered via the CustomIcons component),
   a concise title, and a descriptive paragraph.

   Icon selection uses the closest available matches from the CustomIcons
   library:
   - measureTape  -> Precision Steel Frame (measurement / precision)
   - tiles        -> Rapid Build (modular construction)
   - bioEnergy    -> Energy Efficient (sustainability / energy)
   - keyCircle    -> Built to Last (durability / warranty)
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
   SECTION 4: TESTIMONIAL DATA
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
    text: 'Our Modular House garden room has completely transformed how we work from home. The build quality is exceptional — the steel frame feels incredibly solid, and the insulation keeps it warm even in January. It was ready in just seven weeks with barely any disruption to our garden.',
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
    text: 'As an artist I was looking for a bright, well-insulated studio space without the hassle of planning permission. The Compact Studio ticked every box — the natural light from the triple-glazed windows is superb, and the BER A rating means my heating costs are minimal.',
    authorName: 'Sinead O.',
    authorLocation: 'Malahide, Co. Dublin',
    authorImageSrc: '/resource/avatar-placeholder.png',
    rating: 5,
  },
];


/* =============================================================================
   SECTION 5: GALLERY DATA
   -----------------------------------------------------------------------------
   Six to eight gallery items for the FullMassonryGallery component.
   Each item references an existing image from /public/resource/garden-room/
   with WebP and AVIF optimised variants.

   The gallery showcases completed garden room and sauna projects.
   Descriptive titles improve both user experience and SEO when indexed.
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
   SECTION 6: INFINITE MASONRY GALLERY DATA
   -----------------------------------------------------------------------------
   Image data for the InfiniteMasonryGallery component — a horizontally-
   scrolling infinite strip placed directly below the Product Showcase section.
   Each image specifies its orientation so the masonry layout algorithm can
   pair landscape images vertically and give portrait images a full-height column.
   All images include AVIF and WebP variants for optimal delivery.
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
