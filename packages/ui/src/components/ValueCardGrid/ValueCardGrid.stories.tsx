/**
 * ValueCardGrid Storybook Stories
 * =============================================================================
 *
 * PURPOSE:
 * Provides visual documentation and interactive examples for the ValueCardGrid
 * component within Storybook. Each story demonstrates a distinct configuration,
 * covering the primary use cases from the About page design template.
 *
 * STORIES:
 * 1. Default               -- 3 cards on secondary background (About page).
 * 2. FourItemsOnPrimary    -- 4 cards on primary background (service page).
 * 3. TwoItems              -- Minimal 2-card layout for compact sections.
 *
 * NOTE:
 * Icons in stories use inline SVG placeholders to avoid a dependency on an
 * icon font (Material Symbols) within the Storybook environment. In the
 * production About page, the actual icon components will be supplied by the
 * page-level code.
 *
 * =============================================================================
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ValueCardGrid } from './ValueCardGrid';
import type { ValueCardItem } from './ValueCardGrid';

/* =============================================================================
   META CONFIGURATION
   -----------------------------------------------------------------------------
   Defines the Storybook entry, control panel options, and shared defaults.
   ============================================================================= */

const meta: Meta<typeof ValueCardGrid> = {
  title: 'Components/ValueCardGrid',
  component: ValueCardGrid,
  parameters: {
    /** Fullscreen layout removes Storybook padding for accurate section rendering. */
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    eyebrow: {
      control: 'text',
      description: 'Uppercase eyebrow label displayed above the heading.',
    },
    heading: {
      control: 'text',
      description: 'Main section heading rendered as an <h2> element.',
    },
    backgroundColor: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: 'Background colour variant for the section.',
    },
    className: {
      control: 'text',
      description: 'Optional CSS class name appended to the root element.',
    },
    id: {
      control: 'text',
      description: 'Optional id attribute for anchor linking.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ValueCardGrid>;

/* =============================================================================
   SHARED FIXTURE DATA
   -----------------------------------------------------------------------------
   Inline SVG icon component and sample card data used across stories.
   ============================================================================= */

/**
 * Placeholder icon component rendering a simple SVG gear shape.
 * Acts as a stand-in for Material Symbols or custom SVG icons in the
 * Storybook environment. Uses `currentColor` to inherit the brand accent.
 */
const PlaceholderIcon: React.FC = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

/**
 * Placeholder leaf icon for sustainability-themed cards.
 */
const LeafIcon: React.FC = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66L7 18" />
    <path d="M2 2c5 5 9.03 8.55 17 8" />
  </svg>
);

/**
 * Placeholder person icon for customer-related cards.
 */
const PersonIcon: React.FC = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/**
 * Placeholder shield icon for quality/warranty cards.
 */
const ShieldIcon: React.FC = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

/**
 * Three-card dataset matching the About page "Mission & Values" section.
 */
const threeItems: ValueCardItem[] = [
  {
    id: 'precision',
    icon: <PlaceholderIcon />,
    title: 'Precision Engineering',
    description:
      'Utilizing advanced CAD design and CNC-cut steel components for millimeter-perfect accuracy in every build.',
  },
  {
    id: 'sustainability',
    icon: <LeafIcon />,
    title: 'Sustainable Design',
    description:
      'Prioritizing eco-friendly materials and energy-efficient systems to achieve A1 BER standards for a greener future.',
  },
  {
    id: 'customer',
    icon: <PersonIcon />,
    title: 'Customer First',
    description:
      'From initial design to final handover, we provide a seamless, transparent experience focused on your specific needs.',
  },
];

/**
 * Four-card dataset for demonstrating the 2x2 grid on tablet and a wider
 * layout on desktop.
 */
const fourItems: ValueCardItem[] = [
  ...threeItems,
  {
    id: 'quality',
    icon: <ShieldIcon />,
    title: 'Quality Assurance',
    description:
      'Every project undergoes rigorous structural and thermal testing to ensure compliance with Irish building regulations.',
  },
];

/* =============================================================================
   STORY 1: Default
   -----------------------------------------------------------------------------
   Three cards on a secondary (warm beige) background, matching the About
   page "Mission & Values" section from the design template.
   ============================================================================= */

export const Default: Story = {
  args: {
    eyebrow: 'WHAT DRIVES US',
    heading: 'Built on Quality, Delivered with Care',
    items: threeItems,
    backgroundColor: 'secondary',
  },
};

/* =============================================================================
   STORY 2: FourItemsOnPrimary
   -----------------------------------------------------------------------------
   Four cards on a primary (white) background. Demonstrates how the grid
   accommodates a fourth card, which wraps to a second row on desktop (3+1)
   and fills evenly on tablet (2+2).
   ============================================================================= */

export const FourItemsOnPrimary: Story = {
  args: {
    eyebrow: 'WHY CHOOSE US',
    heading: 'The Modular Advantage',
    items: fourItems,
    backgroundColor: 'primary',
  },
};

/* =============================================================================
   STORY 3: TwoItems
   -----------------------------------------------------------------------------
   Minimal two-card layout for compact benefit sections. The grid still uses
   3 columns on desktop, leaving the third cell empty — a natural visual
   treatment that avoids force-stretching content.
   ============================================================================= */

export const TwoItems: Story = {
  args: {
    eyebrow: 'OUR PROMISE',
    heading: 'Commitment to Excellence',
    items: threeItems.slice(0, 2),
    backgroundColor: 'secondary',
  },
};
