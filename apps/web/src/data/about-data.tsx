/**
 * About Page -- Content Constants
 * =============================================================================
 *
 * PURPOSE:
 * Provides all static content constants consumed by the /about marketing page.
 * Each export is shaped to match the props contract of its corresponding
 * @modular-house/ui component, ensuring type-safe consumption in About.tsx.
 *
 * ARCHITECTURE:
 * All content is hardcoded because this is a brand page with infrequently
 * changing copy. When content needs updating, only this file requires edits;
 * the route component (About.tsx) remains purely presentational.
 *
 * This follows the same pattern established by garden-room-data.ts — a single
 * TypeScript file exporting named constants with full type safety.
 *
 * EXPORTS:
 *   ABOUT_HERO              -- Hero section text and image paths
 *   ABOUT_STORY             -- "Our Story" ContentWithImage props
 *   ABOUT_VALUES            -- "Mission & Values" ValueCardGrid items
 *   ABOUT_STEEL_FRAME       -- "Why Steel Frame" FeatureChecklist items
 *   ABOUT_TEAM_MEMBERS      -- "Our Team" TeamGrid members
 *   ABOUT_STATS             -- Stats bar items
 *   ABOUT_CTA               -- GradientCTA text
 *
 * =============================================================================
 */

import React from 'react';
import type {
  ValueCardItem,
  ChecklistItem,
  TeamMember,
  StatItem,
} from '@modular-house/ui';

/* =============================================================================
   SECTION 1: HERO DATA
   -----------------------------------------------------------------------------
   Content for the HeroBoldBottomText component at the top of the About page.
   ============================================================================= */

/**
 * Hero section content. Image paths point to the /resource/about/ directory
 * which should contain optimised AVIF, WebP, and JPEG/PNG variants.
 */
export const ABOUT_HERO = {
  titleLine1: 'Crafting premium steel-frame garden rooms and house extensions',
  titleLine2: 'in Dublin since 2020.',
  backgroundImage: '/resource/about/about_hero.jpg',
  backgroundImageWebP: '/resource/about/about_hero.webp',
  backgroundImageAvif: '/resource/about/about_hero.avif',
  bigText: 'About',
} as const;

/* =============================================================================
   SECTION 2: OUR STORY DATA
   -----------------------------------------------------------------------------
   Content for the ContentWithImage component (Section 2).
   ============================================================================= */

/**
 * Our Story section content. The body paragraphs are supplied as children
 * in the route component, not here, because they are React nodes (JSX).
 */
export const ABOUT_STORY = {
  eyebrow: 'OUR STORY',
  heading: 'Reimagining Living Spaces',
  imageSrc: '/resource/about/construction_site_1.png',
  imageWebP: '/resource/about/construction_site_1.webp',
  imageAvif: '/resource/about/construction_site_1.avif',
  imageAlt: 'Steel frame assembly on a construction site',
  imageAspectRatio: '4:5' as const,
} as const;

/**
 * Our Story body paragraphs as plain text strings.
 * These are rendered as <p> elements in the route component.
 */
export const ABOUT_STORY_PARAGRAPHS: readonly string[] = [
  'Founded in Dublin in 2020, Modular House was born from a desire to bridge the gap between traditional Irish masonry and the precision of modern modular construction. We saw an opportunity to provide homeowners with high-quality, sustainable alternatives to conventional extensions.',
  "Our journey began with a single garden studio in Rathfarnham. Today, our team of architects and engineers works from our state-of-the-art facility to deliver turnkey steel-frame solutions that are as durable as they are beautiful. We aren't just building rooms; we're crafting architectural monographs for the modern Dublin lifestyle.",
];

/* =============================================================================
   SECTION 3: MISSION & VALUES DATA
   -----------------------------------------------------------------------------
   Content for the ValueCardGrid component (Section 3).
   Icons are rendered as inline SVG elements in the route component to avoid
   coupling the data layer to a specific icon library.
   ============================================================================= */

/**
 * Placeholder SVG icon: precision manufacturing / gear shape.
 * Uses currentColor for automatic brand accent inheritance from CSS.
 */
const PrecisionIcon: React.FC = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

/**
 * Placeholder SVG icon: leaf / sustainability.
 */
const SustainabilityIcon: React.FC = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66L7 18" />
    <path d="M2 2c5 5 9.03 8.55 17 8" />
  </svg>
);

/**
 * Placeholder SVG icon: person / customer focus.
 */
const CustomerIcon: React.FC = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/**
 * Three value/mission cards matching the approved HTML template Section 3.
 */
export const ABOUT_VALUES: ValueCardItem[] = [
  {
    id: 'precision',
    icon: <PrecisionIcon />,
    title: 'Precision Engineering',
    description:
      'Utilizing advanced CAD design and CNC-cut steel components for millimeter-perfect accuracy in every build.',
  },
  {
    id: 'sustainability',
    icon: <SustainabilityIcon />,
    title: 'Sustainable Design',
    description:
      'Prioritizing eco-friendly materials and energy-efficient systems to achieve A1 BER standards for a greener future.',
  },
  {
    id: 'customer',
    icon: <CustomerIcon />,
    title: 'Customer First',
    description:
      'From initial design to final handover, we provide a seamless, transparent experience focused on your specific needs.',
  },
];

/* =============================================================================
   SECTION 4: WHY STEEL FRAME DATA
   -----------------------------------------------------------------------------
   Content for the FeatureChecklist component (Section 4).
   ============================================================================= */

/**
 * Placeholder SVG icon: checkmark circle for checklist items.
 */
const CheckCircleIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

/**
 * Four steel-frame benefit items matching the approved HTML template Section 4.
 */
export const ABOUT_STEEL_FRAME: ChecklistItem[] = [
  {
    id: 'faster-build',
    icon: <CheckCircleIcon />,
    title: 'Faster build times',
    description:
      'Pre-fabricated components allow for onsite assembly in weeks, not months.',
  },
  {
    id: 'structural-strength',
    icon: <CheckCircleIcon />,
    title: 'Superior structural strength',
    description:
      'Lightweight yet incredibly strong, steel resists warping and cracking over time.',
  },
  {
    id: 'design-flexibility',
    icon: <CheckCircleIcon />,
    title: 'Design flexibility',
    description:
      'Enables large open spans and expansive glass features without bulky supports.',
  },
  {
    id: 'weather-resistant',
    icon: <CheckCircleIcon />,
    title: 'Weather-resistant durability',
    description:
      'Galvanized steel frames are impervious to rot, pests, and fire, ensuring longevity.',
  },
];

/**
 * Steel frame section image paths and metadata.
 */
export const ABOUT_STEEL_FRAME_IMAGE = {
  imageSrc: '/resource/about/steel_frame_1.jpg',
  imageWebP: '/resource/about/steel_frame_1.webp',
  imageAvif: '/resource/about/steel_frame_1.avif',
  imageAlt: 'Steel frame structural detail with warm sunset lighting',
} as const;

/* =============================================================================
   SECTION 5: TEAM MEMBERS DATA
   -----------------------------------------------------------------------------
   Content for the TeamGrid component (Section 5).
   Avatar images use placeholder paths under /resource/about/team/.
   ============================================================================= */

/**
 * Four team members matching the approved HTML template Section 5.
 * Each member has a unique id for stable React list keying.
 */
export const ABOUT_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'liam-oconnor',
    name: "Liam O'Connor",
    role: 'Template',
    bio: 'With 15 years of experience in structural engineering, Liam leads our design vision.',
    imageSrc: '/resource/about/team/liam-oconnor.jpg',
    imageWebP: '/resource/about/team/liam-oconnor.webp',
    imageAvif: '/resource/about/team/liam-oconnor.avif',
    imageAlt: "Portrait of Liam O'Connor, Founder & Principal Architect",
  },
  {
    id: 'siobhan-murphy',
    name: 'Siobhan Murphy',
    role: 'Template',
    bio: 'Siobhan ensures every project timeline is met with military precision and clarity.',
    imageSrc: '/resource/about/team/siobhan-murphy.jpg',
    imageWebP: '/resource/about/team/siobhan-murphy.webp',
    imageAvif: '/resource/about/team/siobhan-murphy.avif',
    imageAlt: 'Portrait of Siobhan Murphy, Operations Director',
  },
  {
    id: 'david-byrne',
    name: 'David Byrne',
    role: 'Template',
    bio: 'Our master of onsite assembly, David has overseen over 50 successful steel-frame builds.',
    imageSrc: '/resource/about/team/david-byrne.jpg',
    imageWebP: '/resource/about/team/david-byrne.webp',
    imageAvif: '/resource/about/team/david-byrne.avif',
    imageAlt: 'Portrait of David Byrne, Site Supervisor',
  },
  {
    id: 'aisling-kelly',
    name: 'Aisling Kelly',
    role: 'Template',
    bio: 'Aisling drives our commitment to A1 BER ratings and carbon-neutral construction methods.',
    imageSrc: '/resource/about/team/aisling-kelly.jpg',
    imageWebP: '/resource/about/team/aisling-kelly.webp',
    imageAvif: '/resource/about/team/aisling-kelly.avif',
    imageAlt: 'Portrait of Aisling Kelly, Head of Sustainability',
  },
];

/* =============================================================================
   SECTION 6: STATS DATA
   -----------------------------------------------------------------------------
   Content for the StatsBar component (Section 6).
   ============================================================================= */

/**
 * Four key performance metrics matching the approved HTML template Section 6.
 */
export const ABOUT_STATS: StatItem[] = [
  {
    id: 'projects',
    value: '50+',
    label: 'Projects Completed',
  },
  {
    id: 'satisfaction',
    value: '100%',
    label: 'Customer Satisfaction',
  },
  {
    id: 'experience',
    value: '5+',
    label: 'Years Experience',
  },
  {
    id: 'ber-rating',
    value: 'A1',
    label: 'BER Rating Standard',
  },
];

/* =============================================================================
   SECTION 7: CTA DATA
   -----------------------------------------------------------------------------
   Content for the GradientCTA component (Section 7).
   ============================================================================= */

/**
 * Call-to-action section content matching the approved HTML template Section 7.
 */
export const ABOUT_CTA = {
  heading: 'Ready to Start Your Project?',
  subtext: 'Transform your property with a bespoke modular solution. Book a free consultation today.',
  ctaLabel: 'Get a Free Quote',
  ctaHref: '/contact',
} as const;
