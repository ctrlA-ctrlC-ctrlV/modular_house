/**
 * ContactFormWithImageBg.stories.tsx
 * 
 * Storybook stories for the ContactFormWithImageBg component.
 * These stories provide visual documentation and interactive testing
 * capabilities for the component in isolation.
 * 
 * Storybook serves as both a development environment for building
 * components in isolation and as living documentation for the design system.
 * 
 * Available Stories:
 * - Default: Standard configuration with default props
 * - CustomTitle: Demonstrates custom heading text
 * - CustomBackground: Shows component with alternative background image
 * 
 * Dependencies:
 * - @storybook/react for Meta and StoryObj types
 * - ContactFormWithImageBg component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ContactFormWithImageBg } from './ContactFormWithImageBg';

/* =============================================================================
   SECTION 1: STORY CONFIGURATION (META)
   -----------------------------------------------------------------------------
   Defines how the component appears in the Storybook sidebar
   and configures default behavior for all stories.
   ============================================================================= */

const meta: Meta<typeof ContactFormWithImageBg> = {
  /**
   * Title determines the component's location in the Storybook sidebar.
   * 'Components/ContactFormWithImageBg' places it under the Components category.
   */
  title: 'Components/ContactFormWithImageBg',
  
  /**
   * The component being documented.
   * Storybook uses this to extract prop types and generate controls.
   */
  component: ContactFormWithImageBg,
  
  /**
   * Parameters configure story-level settings.
   * 'fullscreen' layout removes padding for components that span full width.
   */
  parameters: {
    layout: 'fullscreen',
  },
  
  /**
   * Tags enable features for this component's stories.
   * 'autodocs' automatically generates documentation from JSDoc comments.
   */
  tags: ['autodocs'],
};

export default meta;

/**
 * Story type definition for TypeScript support.
 * Provides type safety for story args matching component props.
 */
type Story = StoryObj<typeof ContactFormWithImageBg>;


/* =============================================================================
   SECTION 2: STORIES
   -----------------------------------------------------------------------------
   Individual story definitions demonstrating various component configurations.
   ============================================================================= */

/**
 * Default Story
 * 
 * Demonstrates the component with its default configuration.
 * Uses the component's built-in default background image and heading.
 * This represents the most common usage of the component.
 */
export const Default: Story = {
  args: {
    title: "Have questions?\nGet in touch!",
  }
};

/**
 * CustomTitle Story
 * 
 * Demonstrates customizing the form heading text.
 * Useful for pages where the call-to-action message differs
 * from the default (e.g., sales-focused vs. support-focused).
 */
export const CustomTitle: Story = {
  args: {
    title: "Contact Our\nSales Team",
  },
};

/**
 * CustomBackground Story
 * 
 * Demonstrates using a different background image.
 * Shows how the component adapts to various image compositions.
 * The form card positioning (right-aligned) works well with
 * left-focused imagery.
 */
export const CustomBackground: Story = {
  args: {
    backgroundImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", 
  },
};