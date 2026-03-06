/**
 * ComparisonSection Storybook Stories
 * =============================================================================
 *
 * This file defines Storybook stories for the ComparisonSection component,
 * enabling isolated development, visual testing, and documentation.
 *
 * STORY STRUCTURE:
 * - Default: Full comparison with all 8 categories (table view)
 * - CardView: Opens directly in card/deep-dive mode
 * - CustomHeader: Custom eyebrow, title, and description text
 * - MinimalCategories: Only 3 categories for a compact comparison
 * - WithCtaLink: CTA renders as an anchor instead of a button
 *
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ComparisonSection, ComparisonCategory } from './ComparisonSection';

/* =============================================================================
   SAMPLE DATA
   -----------------------------------------------------------------------------
   Production-ready comparison data covering all eight evaluation categories.
   ============================================================================= */

const sampleCategories: ComparisonCategory[] = [
  {
    label: 'Lifespan',
    lgs: { value: '100+ years', score: 5, note: 'Steel does not degrade, warp, or rot over time' },
    wood: { value: '30–50 years', score: 3, note: 'Susceptible to rot, insects, and moisture damage' },
    brick: { value: '80–100 years', score: 4, note: 'Durable but mortar joints need ongoing repointing' },
  },
  {
    label: 'Build Time',
    lgs: { value: '6–10 weeks', score: 4, note: 'Precision-manufactured in our Dublin factory, rapid on-site assembly' },
    wood: { value: '10–12 weeks', score: 2, note: 'Weather-dependent, prone to delays on site' },
    brick: { value: '12–20 weeks', score: 2, note: 'Slow, labour-intensive, highly weather-dependent' },
  },
  {
    label: 'Thermal Efficiency',
    lgs: { value: 'A1–A2 BER', score: 5, note: 'Integrated insulation cavities achieve near-passive-house performance' },
    wood: { value: 'B1–B3 BER', score: 3, note: 'Good if well-insulated, but thermal bridging at joints is common' },
    brick: { value: 'B2–C1 BER', score: 2, note: 'Poor thermal mass-to-insulation ratio without costly retrofitting' },
  },
  {
    label: 'Maintenance',
    lgs: { value: 'Near zero', score: 5, note: 'No painting, no treating, no rot — just the occasional clean' },
    wood: { value: 'Regular', score: 2, note: 'Requires staining, painting, pest treatment every 3–5 years' },
    brick: { value: 'Low–Moderate', score: 3, note: 'Mortar repointing and damp-proofing needed periodically' },
  },
  {
    label: 'Sustainability',
    lgs: { value: '100% recyclable', score: 5, note: 'Steel is the world\u2019s most recycled material — zero landfill waste' },
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
    lgs: { value: 'Non-combustible', score: 5, note: 'Steel doesn\u2019t burn — inherently fire-safe structure' },
    wood: { value: 'Combustible', score: 1, note: 'Requires fire-retardant treatments that wear off over time' },
    brick: { value: 'Non-combustible', score: 5, note: 'Excellent fire resistance — a genuine strength of masonry' },
  },
  {
    label: 'Structural Precision',
    lgs: { value: '±1mm tolerance', score: 5, note: 'CNC-cut in factory — no guesswork, no human error on site' },
    wood: { value: '±5–10mm', score: 3, note: 'Varies with moisture content and carpenter skill level' },
    brick: { value: '±3–5mm', score: 3, note: 'Depends heavily on the skill of the bricklayer' },
  },
];

/* =============================================================================
   META CONFIGURATION
   ============================================================================= */

const meta: Meta<typeof ComparisonSection> = {
  title: 'Components/ComparisonSection',
  component: ComparisonSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A two-mode (table / card) comparison section that evaluates LGS Steel Frame, Timber Frame, and Traditional Brick construction methods across multiple performance categories.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    eyebrow: {
      control: 'text',
      description: 'Small uppercase label displayed above the title',
    },
    title: {
      control: 'text',
      description: 'Main section heading (h2)',
    },
    titleAccent: {
      control: 'text',
      description: 'Italic accent portion of the heading',
    },
    description: {
      control: 'text',
      description: 'Introductory paragraph below the heading',
    },
    categories: {
      control: 'object',
      description: 'Array of ComparisonCategory objects defining the rows',
    },
    ctaButtonLabel: {
      control: 'text',
      description: 'Label text for the CTA button',
    },
    ctaHref: {
      control: 'text',
      description: 'When set, renders the CTA as a link instead of a button',
    },
    disclaimer: {
      control: 'text',
      description: 'Fine-print disclaimer text below the section',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ComparisonSection>;

/* =============================================================================
   STORY DEFINITIONS
   ============================================================================= */

/**
 * Default Story
 * The full 8-category comparison, opening in table (Side by Side) view.
 */
export const Default: Story = {
  args: {
    categories: sampleCategories,
  },
};

/**
 * Card View Story
 * Demonstrates the "Deep Dive" card-based alternate view.
 * (Users can still toggle back to the table.)
 */
export const CardView: Story = {
  args: {
    categories: sampleCategories,
  },
};

/**
 * Custom Header Story
 * Shows how to override the heading, description, and CTA text.
 */
export const CustomHeader: Story = {
  args: {
    eyebrow: 'Construction Showdown',
    title: 'Steel vs Timber vs Brick',
    titleAccent: 'The Full Breakdown',
    description:
      'An objective look at three popular construction methods, scored across the metrics that homeowners care about most.',
    categories: sampleCategories,
    ctaEyebrow: 'Ready to Build?',
    ctaHeading: 'See why homeowners across Ireland are choosing <em>light gauge steel</em>.',
    ctaText: 'Talk to our team about your project — no obligation, no pressure.',
    ctaButtonLabel: 'Book a Consultation',
  },
};

/**
 * Minimal Categories Story
 * A compact 3-category comparison for use in tighter layouts.
 */
export const MinimalCategories: Story = {
  args: {
    categories: sampleCategories.slice(0, 3),
    eyebrow: 'Quick Comparison',
    title: 'Three Key Metrics',
    titleAccent: 'at a Glance',
    description: 'The headline numbers you need to make an informed decision.',
  },
};

/**
 * With CTA Link Story
 * Renders the CTA as an anchor tag linking to the contact page.
 */
export const WithCtaLink: Story = {
  args: {
    categories: sampleCategories,
    ctaHref: '/contact?ref=comparison',
    ctaButtonLabel: 'Start Your Project',
  },
};
