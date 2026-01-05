/**
 * TwoColumnSplitLayout Storybook Stories
 * =============================================================================
 * 
 * PURPOSE:
 * Provides interactive documentation and visual testing for the TwoColumnSplitLayout
 * component. Stories demonstrate various background variants and content configurations.
 * 
 * STORYBOOK CONFIGURATION:
 * - Layout: fullscreen (removes default padding for accurate representation)
 * - Tags: autodocs (enables automatic documentation generation)
 * 
 * USAGE:
 * Run `pnpm storybook` from the packages/ui directory to view these stories.
 * 
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { TwoColumnSplitLayout } from './TwoColumnSplitLayout';


/* =============================================================================
   SECTION 1: STORYBOOK META CONFIGURATION
   -----------------------------------------------------------------------------
   Defines component metadata for Storybook sidebar organization
   and default rendering parameters.
   ============================================================================= */

/**
 * Storybook metadata configuration.
 * Registers the component within the Components category and applies
 * fullscreen layout for accurate section representation.
 */
const meta: Meta<typeof TwoColumnSplitLayout> = {
  title: 'Components/TwoColumnSplitLayout',
  component: TwoColumnSplitLayout,
  parameters: {
    /**
     * Fullscreen layout removes Storybook's default padding.
     * Required for accurate representation of full-width sections.
     */
    layout: 'fullscreen',
  },
  /**
   * Autodocs tag enables automatic documentation page generation.
   * Storybook extracts prop types and descriptions from TypeScript interfaces.
   */
  tags: ['autodocs'],
  /**
   * ArgTypes configuration for Storybook controls panel.
   * Defines control types and descriptions for each prop.
   */
  argTypes: {
    subtitle: {
      control: 'text',
      description: 'Eyebrow text appearing above the main title.',
    },
    title: {
      control: 'text',
      description: 'Main heading text for the section.',
    },
    description1: {
      control: 'text',
      description: 'Primary description text in the left column.',
    },
    button1Text: {
      control: 'text',
      description: 'Text for the first button (text-link style).',
    },
    image1Src: {
      control: 'text',
      description: 'Source URL for the left column image.',
    },
    image1Alt: {
      control: 'text',
      description: 'Alt text for the left column image.',
    },
    image2Src: {
      control: 'text',
      description: 'Source URL for the right column image.',
    },
    image2Alt: {
      control: 'text',
      description: 'Alt text for the right column image.',
    },
    bottomText: {
      control: 'text',
      description: 'Secondary description text in the right column.',
    },
    button2Text: {
      control: 'text',
      description: 'Text for the second button (primary CTA style).',
    },
    backgroundColor: {
      control: 'select',
      options: ['beige', 'white', 'gray', 'dark'],
      description: 'Background color variant for the section.',
    },
    onButton1Click: {
      action: 'button1Clicked',
      description: 'Click handler for the first button.',
    },
    onButton2Click: {
      action: 'button2Clicked',
      description: 'Click handler for the second button.',
    },
  },
};

export default meta;

/**
 * Story type alias for TwoColumnSplitLayout component.
 * Provides type safety for story configurations.
 */
type Story = StoryObj<typeof TwoColumnSplitLayout>;


/* =============================================================================
   SECTION 2: STORY DEFINITIONS
   -----------------------------------------------------------------------------
   Individual stories demonstrating component variations and use cases.
   Each story represents a specific configuration scenario.
   ============================================================================= */

/**
 * Default Story
 * 
 * Demonstrates the standard configuration with default beige background
 * and construction-themed content.
 */
export const Default: Story = {};

/**
 * Custom Content Story
 * 
 * Demonstrates component flexibility with customized text content.
 */
export const CustomContent: Story = {
  args: {
    subtitle: "Our Mission",
    title: "Building the Future Together",
    description1: "We are committed to sustainable construction practices.",
    button1Text: "Every project is an opportunity to innovate and improve our community.",
    bottomText: "Join us in creating a better world through better buildings.",
    button2Text: "Need more info?",
  },
};

/**
 * White Background Story
 * 
 * Demonstrates the white background variant for high contrast sections.
 */
export const WhiteBackground: Story = {
  args: {
    backgroundColor: 'white',
    subtitle: "Clean Design",
    title: "Pure White Background",
    description1: "This section uses a clean white background for contrast.",
    button1Text: "Learn more",
    bottomText: "Perfect for sections that need to stand out.",
    button2Text: "Get in touch",
  },
};

/**
 * Gray Background Story
 * 
 * Demonstrates the gray background variant for subtle separation.
 */
export const GrayBackground: Story = {
  args: {
    backgroundColor: 'gray',
    subtitle: "Subtle Contrast",
    title: "Light Gray Background",
    description1: "This section uses a subtle gray background for gentle separation.",
    button1Text: "Explore options",
    bottomText: "Great for alternating sections and improved readability.",
    button2Text: "Contact us",
  },
};

/**
 * Dark Background Story
 * 
 * Demonstrates the dark background variant with inverted colors.
 */
export const DarkBackground: Story = {
  args: {
    backgroundColor: 'dark',
    subtitle: "Bold Statement",
    title: "Dark Background Theme",
    description1: "This section uses a dark background with light text for dramatic effect.",
    button1Text: "Discover more",
    bottomText: "Perfect for creating visual hierarchy and modern appeal.",
    button2Text: "Get started",
  },
};