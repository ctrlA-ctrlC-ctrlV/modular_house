/**
 * Footer Component Storybook Stories
 * =============================================================================
 * 
 * PURPOSE:
 * Provides Storybook documentation and visual testing for the Footer component.
 * Demonstrates the component in isolation with configurable props.
 * 
 * CONFIGURATION:
 * - Uses MemoryRouter decorator to support React Router Link components
 * - Fullscreen layout to properly display the dark background
 * - Dark background theme for accurate color representation
 * 
 * USAGE:
 * Run Storybook to view interactive documentation:
 *   pnpm storybook
 * 
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from './Footer';


/* =============================================================================
   STORYBOOK META CONFIGURATION
   -----------------------------------------------------------------------------
   Defines component metadata, decorators, and default settings for all stories.
   ============================================================================= */

const meta = {
  /**
   * Story title determines the navigation hierarchy in Storybook.
   * Format: Category/ComponentName
   */
  title: 'Components/Footer',
  
  /**
   * Reference to the component being documented.
   */
  component: Footer,
  
  /**
   * Decorators wrap stories with additional context providers.
   * MemoryRouter is required for React Router Link components to function.
   */
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  
  /**
   * Global parameters affecting story rendering.
   * Fullscreen layout prevents unnecessary padding around the footer.
   */
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
    },
  },
  
  /**
   * Tags for automatic documentation generation.
   */
  tags: ['autodocs'],
  
  /**
   * ArgTypes define controls for interactive prop manipulation.
   */
  argTypes: {
    className: {
      control: 'text',
      description: 'Optional CSS class for external styling overrides',
    },
  },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;


/* =============================================================================
   STORY DEFINITIONS
   -----------------------------------------------------------------------------
   Individual stories demonstrating component variations and states.
   ============================================================================= */

/**
 * Default Story
 * 
 * Displays the Footer component in its standard configuration.
 * Demonstrates the four-column layout with all default content.
 */
export const Default: Story = {
  args: {},
};