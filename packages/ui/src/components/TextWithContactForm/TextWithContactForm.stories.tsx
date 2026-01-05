/**
 * TextWithContactForm Component Storybook Stories
 * =============================================================================
 * 
 * PURPOSE:
 * Provides Storybook documentation and visual testing for the TextWithContactForm
 * component. Demonstrates various states including default, loading, success,
 * error, and custom content configurations.
 * 
 * CONFIGURATION:
 * - Fullscreen layout for proper section display
 * - Action logger for form submission events
 * 
 * USAGE:
 * Run Storybook to view interactive documentation:
 *   pnpm storybook
 * 
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { TextWithContactForm } from './TextWithContactForm';


/* =============================================================================
   STORYBOOK META CONFIGURATION
   -----------------------------------------------------------------------------
   Defines component metadata, parameters, and default settings for all stories.
   ============================================================================= */

const meta: Meta<typeof TextWithContactForm> = {
  /**
   * Story title determines the navigation hierarchy in Storybook.
   * Format: Category/ComponentName
   */
  title: 'Components/TextWithContactForm',
  
  /**
   * Reference to the component being documented.
   */
  component: TextWithContactForm,
  
  /**
   * Global parameters affecting story rendering.
   * Fullscreen layout provides proper section display.
   */
  parameters: {
    layout: 'fullscreen',
  },
  
  /**
   * Tags for automatic documentation generation.
   */
  tags: ['autodocs'],
  
  /**
   * ArgTypes define controls and actions for interactive testing.
   */
  argTypes: {
    onSubmit: { action: 'submitted' },
  },
};

export default meta;
type Story = StoryObj<typeof TextWithContactForm>;


/* =============================================================================
   STORY DEFINITIONS
   -----------------------------------------------------------------------------
   Individual stories demonstrating component variations and states.
   ============================================================================= */

/**
 * Default Story
 * 
 * Displays the TextWithContactForm in its standard configuration.
 * Shows the two-column layout with default content and empty form.
 */
export const Default: Story = {
  args: {},
};

/**
 * Loading Story
 * 
 * Demonstrates the loading state during form submission.
 * Submit button is disabled with "Sending..." text.
 */
export const Loading: Story = {
  args: {
    isSubmitting: true,
  },
};

/**
 * Success Story
 * 
 * Displays the success confirmation after form submission.
 * Form is replaced with a success message.
 */
export const Success: Story = {
  args: {
    submissionSuccess: true,
  },
};

/**
 * Error State Story
 * 
 * Demonstrates error handling when form submission fails.
 * Error message is displayed above the submit button.
 */
export const ErrorState: Story = {
  args: {
    submissionError: "Something went wrong. Please try again later.",
  },
};

/**
 * Custom Content Story
 * 
 * Demonstrates customization of text content and contact information.
 * All content props are overridden with custom values.
 */
export const CustomContent: Story = {
  args: {
    topLabel: "GET IN TOUCH",
    heading: "We'd love to hear from you",
    description: "Our team is ready to answer all your questions.",
    contactInfo: {
      address: "123 Innovation Dr, Tech City, TC 90210",
      phone: "+1 (555) 123-4567",
      email: "support@techcity.com"
    }
  },
};
