/**
 * FeatureChecklist Storybook Stories
 * =============================================================================
 *
 * PURPOSE:
 * Provides visual documentation and interactive examples for the
 * FeatureChecklist component within Storybook. Each story demonstrates a
 * distinct configuration, covering the primary use cases from the About page
 * design template.
 *
 * STORIES:
 * 1. Default          -- Image on the left, 4 checklist items, primary bg.
 * 2. ImageOnRight     -- Image on the right, secondary background.
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
import { FeatureChecklist } from './FeatureChecklist';
import type { ChecklistItem } from './FeatureChecklist';

/* =============================================================================
   META CONFIGURATION
   -----------------------------------------------------------------------------
   Defines the Storybook entry, control panel options, and shared defaults.
   ============================================================================= */

const meta: Meta<typeof FeatureChecklist> = {
  title: 'Components/FeatureChecklist',
  component: FeatureChecklist,
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
    imageSrc: {
      control: 'text',
      description: 'Primary image URL used as the <img> fallback src.',
    },
    imageAlt: {
      control: 'text',
      description: 'Alt text for the image (required for accessibility).',
    },
    imageFirst: {
      control: 'boolean',
      description: 'When true, the image appears in the left column.',
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
type Story = StoryObj<typeof FeatureChecklist>;

/* =============================================================================
   SHARED FIXTURE DATA
   -----------------------------------------------------------------------------
   Placeholder icon and sample checklist items matching the About page
   "Why Steel Frame" section from the design template.
   ============================================================================= */

/**
 * Placeholder check-circle icon rendered as inline SVG.
 * Uses `currentColor` to inherit the brand accent colour from the CSS rule
 * applied to `.feature-checklist__icon`.
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
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

/**
 * Placeholder image sourced from the HTML design template.
 * Represents a steel-frame detail shot for the "Why Steel Frame" section.
 */
const PLACEHOLDER_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB4S8mhx8EbRns9aBkUMZD8NRhHqmLEqf07NX7SzHA_ZfPZbLdBF354YNeYikitxXcFEhkL8jgFNAC8gxa9pNBVHj0ji9HbP9L_cb9TtHhvAUdfEB3ktcJGvzbOWI_3x5PXLJNhf04wvaEi3nhmIifwc0sC2Hl5z4XOL3sBO5tWbUuFxFeit1ztiaLYKbqy7flmSw0PnwriNW9QlHRHrOHKzxeAzZXSFLMCLwbIvKYpeMnj_95Qf0ibbygsWRTgDj_zKTu4ul6KLKfk';

/**
 * Four-item dataset matching the About page "Why Steel Frame" section.
 * Each item represents a key advantage of steel-frame construction.
 */
const steelFrameItems: ChecklistItem[] = [
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

/* =============================================================================
   STORY 1: Default
   -----------------------------------------------------------------------------
   Image on the left with 4 checklist items on primary background.
   Mirrors the "Why Steel Frame" section in the About page template.
   ============================================================================= */

export const Default: Story = {
  args: {
    eyebrow: 'WHY STEEL FRAME',
    heading: 'The Future of Rapid Construction',
    items: steelFrameItems,
    imageSrc: PLACEHOLDER_IMAGE,
    imageAlt: 'Macro detail shot of structural steel framing and bolts with warm sunset lighting',
    imageFirst: true,
    backgroundColor: 'primary',
  },
};

/* =============================================================================
   STORY 2: ImageOnRight
   -----------------------------------------------------------------------------
   Image on the right with secondary background. Demonstrates the reversed
   column order and alternate background variant for creating visual rhythm
   between consecutive sections on a page.
   ============================================================================= */

export const ImageOnRight: Story = {
  args: {
    eyebrow: 'OUR PROCESS',
    heading: 'From Design to Handover',
    items: steelFrameItems.slice(0, 3),
    imageSrc: PLACEHOLDER_IMAGE,
    imageAlt: 'Modular House construction process overview',
    imageFirst: false,
    backgroundColor: 'secondary',
  },
};
