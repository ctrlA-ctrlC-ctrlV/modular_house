/**
 * FeatureShowcase Stories
 * =============================================================================
 *
 * Storybook story definitions for the FeatureShowcase component. Provides
 * interactive controls for all props and demonstrates the component across
 * multiple layout configurations: default (text-left, image-right), reversed
 * (image-left, text-right), beige background with outlined icons, gray
 * background, and a variant without a badge overlay.
 *
 * Each story uses production-representative content from the house extensions
 * page to ensure visual fidelity during design review.
 *
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { FeatureShowcase } from './FeatureShowcase';
import type { FeatureShowcaseItem, FeatureShowcaseBadge } from './FeatureShowcase';


/* =============================================================================
   Shared Test Data
   =============================================================================
   Reusable feature items and badge data used across multiple stories. These
   mirror the production content defined in the house-extension-data.ts file
   for the "Quality & Trust" and "Transparent Pricing" sections.
   ============================================================================= */

/** Feature items for the "Quality & Trust" section variant */
const qualityFeatures: FeatureShowcaseItem[] = [
  {
    icon: 'thermostat',
    title: 'Fully Insulated & A-Rated',
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
    title: '10-Year Structural Warranty',
    description:
      'Peace of mind comes standard. Our steel-frame extensions are backed by a comprehensive decade-long guarantee.',
  },
];

/** Feature items for the "Transparent Pricing" section variant */
const pricingFeatures: FeatureShowcaseItem[] = [
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

/** Badge data for the "Quality & Trust" section */
const steelFrameBadge: FeatureShowcaseBadge = {
  value: '100%',
  label: 'STEEL FRAME',
};

/** Placeholder image URL for story demonstrations */
const PLACEHOLDER_IMAGE =
  'https://placehold.co/800x1000/F6F5F0/1A1714?text=4:5+Image';


/* =============================================================================
   Story Meta Configuration
   =============================================================================
   Registers the FeatureShowcase under the "Components" sidebar group and
   enables automatic documentation generation via the 'autodocs' tag. The
   'fullscreen' layout parameter removes Storybook's default padding so the
   section renders at its natural full-width dimensions.
   ============================================================================= */
const meta: Meta<typeof FeatureShowcase> = {
  title: 'Components/FeatureShowcase',
  component: FeatureShowcase,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Two-column layout pairing an image with an icon-led feature list. Supports reversed layout, configurable backgrounds, and an optional floating stat badge. Designed for persuasive feature/benefit sections on service pages.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    eyebrow: {
      control: 'text',
      description: 'Uppercase eyebrow label above the heading.',
    },
    title: {
      control: 'text',
      description:
        'Section heading rendered as an h2. Supports JSX for line breaks.',
    },
    description: {
      control: 'text',
      description: 'Lead paragraph below the heading.',
    },
    features: {
      control: 'object',
      description:
        'Array of feature items, each with an icon name, title, and description.',
    },
    imageSrc: {
      control: 'text',
      description: 'Fallback image URL (PNG/JPEG).',
    },
    imageWebP: {
      control: 'text',
      description: 'Optional WebP variant of the image.',
    },
    imageAvif: {
      control: 'text',
      description: 'Optional AVIF variant of the image.',
    },
    imageAlt: {
      control: 'text',
      description: 'Descriptive alt text for the image.',
    },
    badge: {
      control: 'object',
      description:
        'Optional floating stat badge with a value and label, overlaid on the image corner.',
    },
    reversed: {
      control: 'boolean',
      description:
        'When true, image renders on the left and text on the right.',
    },
    backgroundColor: {
      control: 'select',
      options: ['white', 'beige', 'gray'],
      description: 'Section background colour variant.',
    },
    iconVariant: {
      control: 'select',
      options: ['filled', 'outlined'],
      description:
        'Icon container style: filled (tinted background box) or outlined (bare icon).',
    },
    className: {
      control: 'text',
      description:
        'Optional CSS class appended to the root <section> element.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FeatureShowcase>;


/* =============================================================================
   Story: Default (Quality & Trust)
   =============================================================================
   Demonstrates the default layout with text on the left, image on the right,
   a white background, filled icon containers, and a floating badge. This
   configuration matches the "Quality & Trust" section on the house extensions
   page.
   ============================================================================= */
export const Default: Story = {
  name: 'Default (Quality & Trust)',
  args: {
    eyebrow: 'QUALITY & TRUST',
    title: 'Built to the Highest Standard',
    description:
      'Our commitment to architectural integrity means we sweat the details. From structural engineering to the final coat of paint, quality is non-negotiable.',
    features: qualityFeatures,
    imageSrc: PLACEHOLDER_IMAGE,
    imageAlt:
      'Modern architectural house extension exterior with black timber cladding and large sliding glass doors',
    badge: steelFrameBadge,
    reversed: false,
    backgroundColor: 'white',
    iconVariant: 'filled',
  },
};


/* =============================================================================
   Story: Reversed with Beige Background (Transparent Pricing)
   =============================================================================
   Demonstrates the reversed layout with image on the left and text on the
   right, a beige background, and outlined (bare) icons. This configuration
   matches the "Transparent Pricing" section on the house extensions page.
   ============================================================================= */
export const ReversedBeige: Story = {
  name: 'Reversed / Beige (Transparent Pricing)',
  args: {
    eyebrow: 'TRANSPARENT PRICING',
    title: (
      <>
        Competitive Pricing.
        <br />
        No Hidden Costs.
      </>
    ),
    description:
      'We believe in total transparency. Building an extension is a significant investment, and you deserve clarity from day one.',
    features: pricingFeatures,
    imageSrc: PLACEHOLDER_IMAGE,
    imageAlt:
      'Bright modern interior of a house extension with open plan kitchen and natural light',
    reversed: true,
    backgroundColor: 'beige',
    iconVariant: 'outlined',
  },
};


/* =============================================================================
   Story: Gray Background
   =============================================================================
   Demonstrates the gray background variant with filled icons. Useful for
   visually separating the section on pages with alternating white and beige
   sections.
   ============================================================================= */
export const GrayBackground: Story = {
  name: 'Gray Background',
  args: {
    eyebrow: 'ENERGY EFFICIENCY',
    title: 'Designed for Irish Weather',
    description:
      'Every extension is engineered to exceed Part L building regulations, delivering A-rated thermal performance that keeps heating costs low year-round.',
    features: [
      {
        icon: 'eco',
        title: 'Triple-Glazed Windows',
        description:
          'High-performance glazing reduces heat loss while maximizing natural light.',
      },
      {
        icon: 'roofing',
        title: 'Superior Roof Insulation',
        description:
          'Continuous insulation envelope eliminates thermal bridging and condensation risk.',
      },
      {
        icon: 'air',
        title: 'Mechanical Ventilation',
        description:
          'Heat recovery ventilation maintains indoor air quality without energy waste.',
      },
    ],
    imageSrc: PLACEHOLDER_IMAGE,
    imageAlt: 'Close-up of triple-glazed window installation in a house extension',
    badge: { value: 'A1', label: 'BER RATING' },
    reversed: false,
    backgroundColor: 'gray',
    iconVariant: 'filled',
  },
};


/* =============================================================================
   Story: Without Badge
   =============================================================================
   Demonstrates the component without a badge overlay. Verifies that the image
   column renders cleanly without the absolutely-positioned stat element.
   ============================================================================= */
export const WithoutBadge: Story = {
  name: 'Without Badge',
  args: {
    eyebrow: 'OUR PROCESS',
    title: 'From Consultation to Completion',
    description:
      'A structured, transparent build process that keeps you informed and in control at every milestone.',
    features: [
      {
        icon: 'draw',
        title: 'Design Consultation',
        description:
          'We visit your home, discuss your vision, and provide initial sketches within one week.',
      },
      {
        icon: 'engineering',
        title: 'Structural Engineering',
        description:
          'Our engineers produce full structural calculations and connection details for building control.',
      },
      {
        icon: 'construction',
        title: 'Precision Build',
        description:
          'Steel frames are fabricated off-site and erected in days, minimizing disruption to your daily life.',
      },
    ],
    imageSrc: PLACEHOLDER_IMAGE,
    imageAlt: 'Steel frame being erected for a house extension project',
    reversed: false,
    backgroundColor: 'white',
    iconVariant: 'filled',
  },
};


/* =============================================================================
   Story: Reversed Without Badge
   =============================================================================
   Demonstrates the reversed layout without a badge, combining both optional
   prop omissions. Verifies correct column ordering with outlined icons on a
   white background.
   ============================================================================= */
export const ReversedNoBadge: Story = {
  name: 'Reversed / No Badge',
  args: {
    eyebrow: 'MATERIALS',
    title: (
      <>
        Premium Materials.
        <br />
        Built to Last.
      </>
    ),
    description:
      'We source only certified, high-grade materials from trusted suppliers across Europe.',
    features: pricingFeatures,
    imageSrc: PLACEHOLDER_IMAGE,
    imageAlt: 'Premium steel frame materials stacked on a construction site',
    reversed: true,
    backgroundColor: 'white',
    iconVariant: 'outlined',
  },
};


/* =============================================================================
   Story: With Custom ClassName
   =============================================================================
   Demonstrates the className prop by applying an inline style via Storybook
   decorators. This verifies that the consumer-provided class is correctly
   appended to the root element without interfering with built-in BEM classes.
   ============================================================================= */
export const WithCustomClassName: Story = {
  name: 'With Custom ClassName',
  args: {
    ...Default.args,
    className: 'custom-story-class',
  },
  decorators: [
    (Story) => (
      <div>
        <style>{`.custom-story-class { border: 2px dashed #B55329; }`}</style>
        <Story />
      </div>
    ),
  ],
};
