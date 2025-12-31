/**
 * HeroBoldBottomText Storybook Stories
 * =============================================================================
 * 
 * PURPOSE:
 * Provides interactive documentation and visual testing for the HeroBoldBottomText
 * component. Stories demonstrate various configuration options and use cases.
 * 
 * STORYBOOK CONFIGURATION:
 * - Layout: fullscreen (removes default padding for hero components)
 * - Tags: autodocs (enables automatic documentation generation)
 * 
 * USAGE:
 * Run `pnpm storybook` from the packages/ui directory to view these stories.
 * 
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { HeroBoldBottomText } from './HeroBoldBottomText';


/* =============================================================================
   SECTION 1: STORYBOOK META CONFIGURATION
   -----------------------------------------------------------------------------
   Defines component metadata for Storybook sidebar organization
   and default rendering parameters.
   ============================================================================= */

/**
 * Storybook metadata configuration.
 * Registers the component within the Components category and applies
 * fullscreen layout for accurate hero representation.
 */
const meta: Meta<typeof HeroBoldBottomText> = {
  title: 'Components/HeroBoldBottomText',
  component: HeroBoldBottomText,
  parameters: {
    /**
     * Fullscreen layout removes Storybook's default padding.
     * Required for accurate representation of full-viewport components.
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
    titleLine1: {
      control: 'text',
      description: 'Primary title segment displayed in white text.',
    },
    titleLine2: {
      control: 'text',
      description: 'Secondary title segment displayed in accent color.',
    },
    ctaText: {
      control: 'text',
      description: 'Call-to-action button label text.',
    },
    ctaLink: {
      control: 'text',
      description: 'Target URL for the CTA button.',
    },
    backgroundImage: {
      control: 'text',
      description: 'URL for the hero background image.',
    },
    bigText: {
      control: 'text',
      description: 'Large display text at the bottom of the hero.',
    },
    onCtaClick: {
      action: 'clicked',
      description: 'Click event handler for the CTA button.',
    },
  },
};

export default meta;

/**
 * Story type alias for HeroBoldBottomText component.
 * Provides type safety for story configurations.
 */
type Story = StoryObj<typeof HeroBoldBottomText>;


/* =============================================================================
   SECTION 2: STORY DEFINITIONS
   -----------------------------------------------------------------------------
   Individual stories demonstrating component variations and use cases.
   Each story represents a specific configuration scenario.
   ============================================================================= */

/**
 * Default Story
 * 
 * Demonstrates the standard configuration with remodeling-themed content.
 * This represents the primary use case for the hero component.
 */
export const Default: Story = {
  args: {
    titleLine1: "Transform your living spaces with our expert building team.",
    titleLine2: "We create projects tailored to your vision.",
    ctaText: "Get Started",
    ctaLink: "#",
    bigText: "Remodeling",
    backgroundImage: "https://rebar.themerex.net/wp-content/uploads/2025/08/background-06.jpg",
  },
};

/**
 * Custom Content Story
 * 
 * Demonstrates component flexibility with alternative textual content
 * and a different thematic background image.
 */
export const CustomContent: Story = {
  args: {
    titleLine1: "Build your dream home.",
    titleLine2: "Quality craftsmanship guaranteed.",
    ctaText: "Contact Us",
    ctaLink: "#contact",
    bigText: "Construction",
    backgroundImage: "https://rebar.themerex.net/wp-content/uploads/2025/08/background-04.jpg",
  },
};

/**
 * Minimal Content Story
 * 
 * Demonstrates the component with minimal content.
 * Useful for testing edge cases and default value behavior.
 */
export const MinimalContent: Story = {
  args: {
    titleLine1: "Welcome.",
    titleLine2: "",
    ctaText: "Explore",
    bigText: "Build",
    backgroundImage: "https://rebar.themerex.net/wp-content/uploads/2025/08/background-06.jpg",
  },
};

/**
 * Long Text Story
 * 
 * Demonstrates component behavior with extended text content.
 * Validates text wrapping and layout stability.
 */
export const LongText: Story = {
  args: {
    titleLine1: "Experience the pinnacle of modern architectural design and sustainable building practices.",
    titleLine2: "Our team of certified professionals brings decades of combined expertise to every project.",
    ctaText: "Schedule a Consultation",
    bigText: "Architecture",
    backgroundImage: "https://rebar.themerex.net/wp-content/uploads/2025/08/background-04.jpg",
  },
};