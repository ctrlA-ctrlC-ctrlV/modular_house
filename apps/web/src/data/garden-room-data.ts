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
import type { ProductCard, AccordionFAQItem, GalleryItem, ProductShowcaseProduct, ProductShowcaseFeature, ProductShowcaseWarranty } from '@modular-house/ui';
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
    price: 'From €26,000',
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
    price: 'From €37,000',
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
    price: 'From €65,000',
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
    price: 'From €76,000',
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

   Image paths reference the /public/resource/garden-room/ directory,
   with PNG fallback, WebP, and AVIF optimised variants.
   ============================================================================= */

export const GARDEN_ROOM_PRODUCTS: ProductCard[] = [
  {
    size: '15m\u00B2',
    name: 'Compact Studio',
    image: '/resource/garden-room/garden-room4.png',
    imageWebP: '/resource/garden-room/garden-room4.webp',
    imageAvif: '/resource/garden-room/garden-room4.avif',
    useCases: ['Home office', 'Art studio', 'Yoga room'],
    planningNote: 'No planning permission required',
    ctaText: 'Get a Quote',
    ctaLink: '/contact?product=garden-room-15',
    available: true,
  },
  {
    size: '25m\u00B2',
    name: 'Garden Suite',
    image: '/resource/garden-room/garden-room1.png',
    imageWebP: '/resource/garden-room/garden-room1.webp',
    imageAvif: '/resource/garden-room/garden-room1.avif',
    useCases: ['Home office + meeting space', 'Home gym', 'Music studio', '1 bed room en suite'],
    planningNote: 'No planning permission required',
    badge: 'Most Popular',
    ctaText: 'Get a Quote',
    ctaLink: '/contact?product=garden-room-25',
    available: true,
  },
  {
    size: '35m\u00B2',
    name: 'Garden Living',
    image: '/resource/garden-room/garden-room2.png',
    imageWebP: '/resource/garden-room/garden-room2.webp',
    imageAvif: '/resource/garden-room/garden-room2.avif',
    useCases: ['Guest suite', 'Teen retreat', 'Rental unit'],
    planningNote: 'Legislation pending',
    badge: 'Coming Soon',
    ctaText: 'Register Interest',
    ctaLink: '/contact?product=garden-room-35&interest=true',
    available: false,
  },
  {
    size: '45m\u00B2',
    name: 'Grand Studio',
    image: '/resource/garden-room/garden-room3.png',
    imageWebP: '/resource/garden-room/garden-room3.webp',
    imageAvif: '/resource/garden-room/garden-room3.avif',
    useCases: ['Self-contained apartment', 'Multi-room workspace'],
    planningNote: 'Legislation pending',
    badge: 'Coming Soon',
    ctaText: 'Register Interest',
    ctaLink: '/contact?product=garden-room-45&interest=true',
    available: false,
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
    title: 'Precision Steel Frame',
    description:
      'Every frame is CNC-cut to sub-millimetre accuracy, eliminating thermal bridging and ensuring a perfect fit. Steel does not warp, shrink, or rot — delivering consistent structural performance for decades.',
  },
  {
    icon: React.createElement(CustomIcons, { name: 'tiles', size: 48 }),
    title: 'Rapid Build',
    description:
      'Our off-site fabrication process means your garden room is ready in 6 to 8 weeks, with minimal on-site disruption. Most of the construction happens in our Dublin workshop before assembly on your property.',
  },
  {
    icon: React.createElement(CustomIcons, { name: 'bioEnergy', size: 48 }),
    title: 'Energy Efficient',
    description:
      'A-rated BER as standard, with high-performance PIR insulation, triple-glazed thermally broken windows, and optional underfloor heating. Designed to stay warm in winter and cool in summer without high energy bills.',
  },
  {
    icon: React.createElement(CustomIcons, { name: 'keyCircle', size: 48 }),
    title: 'Built to Last',
    description:
      'Steel-frame construction delivers a 50+ year structural lifespan with zero risk of rot, warping, or pest damage. Every garden room comes with a 10-year structural warranty for complete peace of mind.',
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
