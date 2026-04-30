/**
 * House Extension Page -- Content Constants
 * =============================================================================
 *
 * PURPOSE:
 * Provides all static content constants consumed by the /house-extensions
 * marketing page. Each export is shaped to match the props contract of its
 * corresponding @modular-house/ui component, ensuring type-safe consumption
 * in HouseExtension.tsx.
 *
 * ARCHITECTURE:
 * All content is hardcoded because this is a marketing page with infrequently
 * changing copy. When content needs updating, only this file requires edits;
 * the route component (HouseExtension.tsx) remains purely presentational.
 *
 * This follows the same data-separation pattern established by
 * garden-room-data.ts and about-data.tsx — a single TypeScript file exporting
 * named constants with full type safety.
 *
 * EXPORTS:
 *   HERO_CONFIG                    -- Hero section text and image paths
 *   TEXT_INTRO                     -- TextIntroSection eyebrow, title, paragraphs
 *   BESPOKE_BANNER                 -- GoBespokeBanner copy and CTA label
 *   QUALITY_FEATURES               -- FeatureShowcase items (Quality & Trust)
 *   QUALITY_BADGE                  -- FeatureShowcase floating stat badge
 *   QUALITY_IMAGE                  -- FeatureShowcase image paths (Quality)
 *   PRICING_FEATURES               -- FeatureShowcase items (Transparent Pricing)
 *   PRICING_IMAGE                  -- FeatureShowcase image paths (Pricing)
 *   HOUSE_EXTENSION_TESTIMONIALS   -- TestimonialGrid items
 *   HOUSE_EXTENSION_GALLERY        -- InfiniteMasonryGallery images
 *   HOUSE_EXTENSION_FAQS           -- AccordionFAQ items
 *   FOOTER_CTA_CONFIG              -- FooterCTA title, subtitle, actions
 *
 * =============================================================================
 */

import type {
  AccordionFAQItem,
  InfiniteGalleryImage,
  FeatureShowcaseItem,
  FeatureShowcaseBadge,
  FooterCTAAction,
} from '@modular-house/ui';


/* =============================================================================
   SECTION 1: HERO DATA
   -----------------------------------------------------------------------------
   Content for the HeroBoldBottomText component. The hero occupies the full
   viewport and sets the visual tone for the entire page. Image paths point
   to the /resource/house-extension/ directory with optimised format variants.
   ============================================================================= */

export const HERO_CONFIG = {
  titleLine1: 'Steel Frame House Extensions in Dublin — Built to Last.',
  ctaText: 'Get a Free Quote',
  ctaLink: '/contact',
  backgroundImage: '/resource/house-extension/house-extension1.png',
  backgroundImageWebP: '/resource/house-extension/house-extension1.webp',
  backgroundImageAvif: '/resource/house-extension/house-extension1.avif',
  bigText: 'House Extensions',
} as const;


/* =============================================================================
   SECTION 2: TEXT INTRO DATA
   -----------------------------------------------------------------------------
   Content for the TextIntroSection component. Provides the editorial
   introduction that sets the narrative context before the feature sections.
   The eyebrow label, heading, and body paragraphs establish the value
   proposition for house extensions.
   ============================================================================= */

export const TEXT_INTRO = {
  eyebrow: 'HOUSE EXTENSIONS DUBLIN',
  title: "Dublin's Trusted House Extension Specialists",
  paragraphs: [
    'Whether you are envisioning a light-filled open-plan kitchen, a dedicated home office, or an expansive master suite, a house extension in Dublin is the smartest way to add space and value to your home — without the upheaval of moving.',
    'At Modular House, we design and build house extensions across Dublin that respect your home\u2019s original character while delivering contemporary open-plan living, industry best energy efficiency, and exceptional structural integrity.',
  ],
} as const;


/* =============================================================================
   SECTION 3: BESPOKE BANNER DATA
   -----------------------------------------------------------------------------
   Content for the GoBespokeBanner component. Positioned after the text
   introduction, this section targets visitors whose requirements may exceed
   standard offerings and encourages them to begin a custom enquiry.
   ============================================================================= */

export const BESPOKE_BANNER = {
  eyebrow: 'BESPOKE HOUSE EXTENSIONS',
  /** Heading line parts — composed into JSX with a <br /> in the route component. */
  headingLine1: 'Every home is unique.',
  headingLine2: 'Your extension should be too.',
  subtext:
    "Every house extension is engineered to order using premium steel-frame construction, delivering unmatched durability, design flexibility, and industry best thermal performance.",
  ctaLabel: 'Start Your Project',
} as const;


/* =============================================================================
   SECTION 4: QUALITY & TRUST DATA
   -----------------------------------------------------------------------------
   Content for the first FeatureShowcase instance (Quality & Trust). Uses the
   filled icon variant with a white background. The badge displays the steel
   frame construction credential as a floating stat overlay on the image.
   ============================================================================= */

export const QUALITY_FEATURES: FeatureShowcaseItem[] = [
  {
    icon: 'thermostat',
    title: 'Fully Insulated Roof & Walls',
    description:
      'Exceeding building regulations for thermal performance, reducing energy bills and maximizing comfort year-round.',
  },
  {
    icon: 'architecture',
    title: 'Planning Compliance Guaranteed',
    description:
      'We handle the red tape. Whether exempt development or requiring full planning permission, our team manages the process.',
  },
  {
    icon: 'verified',
    title: '50-Year Structural Warranty',
    description:
      'Peace of mind comes standard. Every steel-frame house extension we build in Dublin is backed by a comprehensive 50-year structural guarantee.',
  },
];

export const QUALITY_BADGE: FeatureShowcaseBadge = {
  value: '100%',
  label: 'STEEL FRAME',
};

/**
 * Image paths for the Quality & Trust FeatureShowcase section.
 * References optimised assets from the house-extension resource directory.
 */
export const QUALITY_IMAGE = {
  src: '/resource/house-extension/house-extension2.png',
  webP: '/resource/house-extension/house-extension2.webp',
  avif: '/resource/house-extension/house-extension2.avif',
  alt: 'Steel frame house extension in Dublin with black timber cladding and large sliding glass doors',
} as const;


/* =============================================================================
   SECTION 5: TRANSPARENT PRICING DATA
   -----------------------------------------------------------------------------
   Content for the second FeatureShowcase instance (Transparent Pricing). Uses
   the outlined icon variant with a beige background. The layout is reversed
   (image on left, text on right) to create visual rhythm when stacked with
   the Quality section above.
   ============================================================================= */

export const PRICING_FEATURES: FeatureShowcaseItem[] = [
  {
    icon: 'receipt_long',
    title: 'Detailed Itemised Quotation',
    description:
      'Every element, from groundworks to glazing, is clearly broken down.',
  },
  {
    icon: 'lock',
    title: 'Fixed-Price Contracts',
    description:
      'Once the design is locked in, the price is fixed. No nasty surprises mid-build.',
  },
  {
    icon: 'flag',
    title: 'Milestone-Based Payments',
    description:
      'Pay only as significant, verifiable stages of the build are completed.',
  },
];

/**
 * Image paths for the Transparent Pricing FeatureShowcase section.
 * References optimised assets from the house-extension resource directory.
 */
export const PRICING_IMAGE = {
  src: '/resource/house-extension/house-extension3.jpg',
  webP: '/resource/house-extension/house-extension3.webp',
  avif: '/resource/house-extension/house-extension3.avif',
  alt: 'Bright modern interior of a Dublin house extension with open plan kitchen flooded by natural light',
} as const;


/* =============================================================================
   SECTION 6: TESTIMONIALS DATA
   -----------------------------------------------------------------------------
   Customer testimonials displayed in the TestimonialGrid component. These use
   realistic quotes and Dublin-area locations. The placeholder avatar image
   path should be replaced with real customer photos when available.
   ============================================================================= */

/**
 * Testimonial item shape matching the TestimonialGrid component contract.
 * Declared locally to avoid importing a non-exported interface from the
 * TestimonialGrid component file.
 */
interface HouseExtensionTestimonial {
  text: string;
  authorName: string;
  authorLocation: string;
  authorImageSrc: string;
  rating?: number;
}

export const HOUSE_EXTENSION_TESTIMONIALS: HouseExtensionTestimonial[] = [
  {
    text: "Our rear extension completely transformed how we live day-to-day. The open-plan kitchen and living area floods with light through the full-height glazing, and the build quality is outstanding. Modular House managed everything from planning to handover with zero fuss. We only wish we'd done it sooner.",
    authorName: 'Claire',
    authorLocation: 'Ranelagh, Dublin 6',
    authorImageSrc: '/resource/avatar-placeholder.png',
    rating: 5,
  },
  {
    text: "After getting three quotes, Modular House stood out for their transparency and steel-frame expertise. The fixed-price contract meant no surprise invoices, and the build was finished two days ahead of schedule. The insulation is so good our heating bills actually went down after adding 40 square metres.",
    authorName: 'Patrick',
    authorLocation: 'Blackrock, Co. Dublin',
    authorImageSrc: '/resource/avatar-placeholder.png',
    rating: 5,
  },
  {
    text: "We needed a ground-floor bedroom and wet room for my mother, and the team designed an extension that feels like it was always part of the house. The A-rated insulation keeps it warm without cranking the heating, and every milestone payment was clearly explained upfront. Professional from start to finish.",
    authorName: 'Sinead',
    authorLocation: 'Clontarf, Dublin 3',
    authorImageSrc: '/resource/avatar-placeholder.png',
    rating: 5,
  },
];


/* =============================================================================
   SECTION 7: GALLERY DATA
   -----------------------------------------------------------------------------
   Image entries for the InfiniteMasonryGallery component. Each image references
   optimised assets from the house-extension resource directory with AVIF, WebP,
   and fallback variants. The orientation field guides the masonry layout
   algorithm for optimal visual arrangement.
   ============================================================================= */

export const HOUSE_EXTENSION_GALLERY: InfiniteGalleryImage[] = [
  {
    id: 'he-1',
    src: '/resource/house-extension/house-extension1.png',
    srcWebP: '/resource/house-extension/house-extension1.webp',
    srcAvif: '/resource/house-extension/house-extension1.avif',
    alt: 'Modern house extension in Dublin with large glass panels at dusk',
    orientation: 'landscape',
  },
  {
    id: 'he-2',
    src: '/resource/house-extension/house-extension2.png',
    srcWebP: '/resource/house-extension/house-extension2.webp',
    srcAvif: '/resource/house-extension/house-extension2.avif',
    alt: 'Dublin house extension with black timber cladding and sliding glass doors',
    orientation: 'portrait',
  },
  {
    id: 'he-3',
    src: '/resource/house-extension/house-extension3.jpg',
    srcWebP: '/resource/house-extension/house-extension3.webp',
    srcAvif: '/resource/house-extension/house-extension3.avif',
    alt: 'Open plan kitchen interior in a Dublin house extension by Modular House',
    orientation: 'landscape',
  },
  {
    id: 'he-4',
    src: '/resource/house-extension/house-extension4.png',
    srcWebP: '/resource/house-extension/house-extension4.webp',
    srcAvif: '/resource/house-extension/house-extension4.avif',
    alt: 'Contemporary steel frame house extension built by Modular House in Dublin',
    orientation: 'landscape',
  },
];


/* =============================================================================
   SECTION 8: FAQ DATA
   -----------------------------------------------------------------------------
   Frequently asked questions specific to house extensions. Each entry conforms
   to the AccordionFAQItem interface and includes an id (for ARIA attributes),
   a display number, the question title, and the answer description.

   DUAL USE: This array is consumed by both:
   - The AccordionFAQ component (visual FAQ section)
   - The FAQPage JSON-LD schema in routes-metadata.ts (structured data)
   Any update here automatically keeps both in sync.
   ============================================================================= */

export const HOUSE_EXTENSION_FAQS: AccordionFAQItem[] = [
  {
    id: 'he-faq-1',
    number: '01',
    title: 'Do I need planning permission for a house extension in Dublin?',
    description:
      'In Ireland, certain house extensions may qualify as exempted development under the Planning and Development Act. Generally, single-storey rear extensions up to 40 square metres are exempt, subject to conditions on height, boundary setbacks, and site coverage. Our Dublin-based team assesses your property and handles the full planning process if a formal application is required.',
  },
  {
    id: 'he-faq-2',
    number: '02',
    title: 'How long does a house extension in Dublin take to build?',
    description:
      'A typical Modular House extension in Dublin takes 6 to 10 weeks from groundbreaking to handover, depending on size and complexity. This includes 1 to 2 weeks of foundation and structural steelwork, followed by 4 to 8 weeks of envelope, services, and finishing. Our steel-frame system reduces on-site time compared to traditional block construction.',
  },
  {
    id: 'he-faq-3',
    number: '03',
    title: 'What is included in the quoted price?',
    description:
      'Our fixed-price quotation covers structural steelwork, foundations, insulation, external cladding, internal plastering, electrical first and second fix, plumbing, flooring, and all regulatory compliance documentation. Kitchen and bathroom fit-out is available as an add-on package. There are no hidden extras — every line item is disclosed before you sign.',
  },
  {
    id: 'he-faq-4',
    number: '04',
    title: 'Will a house extension in Dublin add value to my home?',
    description:
      'A well-designed house extension in Dublin typically adds between 5% and 15% to the property value, depending on the size, quality of finish, and local market conditions. Extensions that add a bedroom, bathroom, or open-plan living kitchen tend to deliver the strongest returns. Our A-rated insulation and Building Energy Rating compliance further enhance resale appeal.',
  },
  {
    id: 'he-faq-5',
    number: '05',
    title: 'Can I stay in my home during the build?',
    description:
      'Yes. Our steel-frame construction method generates significantly less dust and noise than traditional block building, and the build programme is designed to minimise disruption to daily living. We maintain a clean and safe site throughout, and critical services (water, electricity) are only briefly interrupted during connection phases.',
  },
  {
    id: 'he-faq-6',
    number: '06',
    title: 'Why choose steel frame over traditional block construction?',
    description:
      'Steel-frame construction offers several advantages: faster build times (up to 30% quicker), superior thermal performance through continuous insulation without cold bridges, lighter foundations reducing ground disruption, and dimensional precision from factory-fabricated components. Steel does not rot, warp, or attract insects, and our frames carry a 10-year structural warranty.',
  },
];


/* =============================================================================
   SECTION 9: FOOTER CTA DATA
   -----------------------------------------------------------------------------
   Content for the FooterCTA component placed at the bottom of the page as
   the closing conversion point. Includes a primary action (quote request)
   and a secondary ghost action (phone call).
   ============================================================================= */

export const FOOTER_CTA_CONFIG = {
  title: 'Ready to Start Your House Extension in Dublin?',
  subtitle:
    'Contact our Dublin-based team today to discuss your project and arrange a complimentary site survey.',
} as const;

export const FOOTER_CTA_ACTIONS: FooterCTAAction[] = [
  {
    label: 'Get a Free Quote',
    href: '/contact',
    variant: 'primary',
  },
  {
    label: 'Call Us Today',
    href: 'tel:+353851onal',
    variant: 'ghost',
  },
];
