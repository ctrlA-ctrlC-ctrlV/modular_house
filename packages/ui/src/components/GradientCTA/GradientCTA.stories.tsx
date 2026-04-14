/**
 * GradientCTA Storybook Stories
 * =============================================================================
 *
 * PURPOSE:
 * Provides visual documentation and interactive examples for the GradientCTA
 * component within Storybook. Each story demonstrates a distinct CTA rendering
 * form, covering the three primary use cases:
 *
 * STORIES:
 * 1. AnchorForm      -- CTA renders as a plain `<a>` element (ctaHref provided).
 * 2. ButtonForm      -- CTA renders as a `<button>` element (onCtaClick provided).
 * 3. LinkRendererForm -- CTA renders via a custom linkRenderer for router
 *                        integration.
 *
 * =============================================================================
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GradientCTA } from './GradientCTA';

/* =============================================================================
   META CONFIGURATION
   -----------------------------------------------------------------------------
   Defines the Storybook entry, control panel options, and shared defaults.
   ============================================================================= */

const meta: Meta<typeof GradientCTA> = {
  title: 'Components/GradientCTA',
  component: GradientCTA,
  parameters: {
    /** Fullscreen layout removes Storybook padding for accurate section rendering. */
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    heading: {
      control: 'text',
      description: 'Primary heading rendered as an <h2> element.',
    },
    subtext: {
      control: 'text',
      description: 'Supporting subtext below the heading.',
    },
    ctaLabel: {
      control: 'text',
      description: 'Text label for the CTA button or anchor.',
    },
    ctaHref: {
      control: 'text',
      description: 'Optional href; when present, the CTA renders as an <a>.',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for the <section> landmark.',
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
type Story = StoryObj<typeof GradientCTA>;

/* =============================================================================
   STORY 1: AnchorForm
   -----------------------------------------------------------------------------
   CTA renders as a plain <a> element. This is the standard form used on the
   About page where the button links to the contact/quote page.
   ============================================================================= */

export const AnchorForm: Story = {
  args: {
    heading: 'Ready to Start Your Project?',
    subtext: 'Transform your property with a bespoke modular solution. Book a free consultation today.',
    ctaLabel: 'Get a Free Quote',
    ctaHref: '/contact',
    ariaLabel: 'Call to action',
  },
};

/* =============================================================================
   STORY 2: ButtonForm
   -----------------------------------------------------------------------------
   CTA renders as a <button> element. Used when the CTA triggers an in-page
   action such as opening an enquiry modal.
   ============================================================================= */

export const ButtonForm: Story = {
  args: {
    heading: 'Ready to Start Your Project?',
    subtext: 'Transform your property with a bespoke modular solution. Book a free consultation today.',
    ctaLabel: 'Get a Free Quote',
    onCtaClick: () => {
      /* Story action: logs to the Storybook actions panel */
      console.log('CTA button clicked');
    },
    ariaLabel: 'Call to action',
  },
};

/* =============================================================================
   STORY 3: LinkRendererForm
   -----------------------------------------------------------------------------
   CTA renders via a custom linkRenderer, simulating router-aware rendering.
   The mock renderer produces a plain <a> with a data attribute to confirm
   the renderer was invoked. In production, this would be React Router's
   <Link> component or a similar router-aware wrapper.
   ============================================================================= */

export const LinkRendererForm: Story = {
  args: {
    heading: 'Ready to Start Your Project?',
    subtext: 'Transform your property with a bespoke modular solution. Book a free consultation today.',
    ctaLabel: 'Get a Free Quote',
    ctaHref: '/contact',
    linkRenderer: ({ href, children, className }) => (
      <a
        className={className}
        href={href}
        data-router="mock"
      >
        {children}
      </a>
    ),
    ariaLabel: 'Call to action',
  },
};
