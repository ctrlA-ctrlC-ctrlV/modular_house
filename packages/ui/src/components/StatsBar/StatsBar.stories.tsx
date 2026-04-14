/**
 * StatsBar Storybook Stories
 * =============================================================================
 *
 * PURPOSE:
 * Provides visual documentation and interactive examples for the StatsBar
 * component within Storybook. Each story demonstrates a distinct configuration,
 * covering the primary use cases from the About page design template.
 *
 * STORIES:
 * 1. Default          -- 4 stats on secondary background (About page).
 * 2. PrimaryBackground -- 4 stats on primary (white) background.
 *
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { StatsBar } from './StatsBar';
import type { StatItem } from './StatsBar';

/* =============================================================================
   META CONFIGURATION
   -----------------------------------------------------------------------------
   Defines the Storybook entry, control panel options, and shared defaults.
   ============================================================================= */

const meta: Meta<typeof StatsBar> = {
  title: 'Components/StatsBar',
  component: StatsBar,
  parameters: {
    /** Fullscreen layout removes Storybook padding for accurate section rendering. */
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
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
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for the section, read by screen readers.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatsBar>;

/* =============================================================================
   SHARED FIXTURE DATA
   -----------------------------------------------------------------------------
   Sample stat items matching the About page "Stats" section from the
   design template.
   ============================================================================= */

/**
 * Four-item dataset matching the About page stats section.
 * Each item represents a key trust indicator for the company.
 */
const aboutPageStats: StatItem[] = [
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
    id: 'ber',
    value: 'A1',
    label: 'BER Rating Standard',
  },
];

/* =============================================================================
   STORY 1: Default
   -----------------------------------------------------------------------------
   Four stats on a secondary (warm beige) background, matching the About
   page stats section from the design template.
   ============================================================================= */

export const Default: Story = {
  args: {
    stats: aboutPageStats,
    backgroundColor: 'secondary',
  },
};

/* =============================================================================
   STORY 2: PrimaryBackground
   -----------------------------------------------------------------------------
   Same stats on a primary (white) background. Demonstrates the alternate
   background variant for use on pages where white sections are preferred.
   ============================================================================= */

export const PrimaryBackground: Story = {
  args: {
    stats: aboutPageStats,
    backgroundColor: 'primary',
  },
};
