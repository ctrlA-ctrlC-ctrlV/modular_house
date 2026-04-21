/**
 * FooterCTA Storybook Stories
 * =============================================================================
 *
 * PURPOSE:
 * Provides visual documentation and interactive examples for the FooterCTA
 * component within Storybook. Each story demonstrates a distinct rendering
 * scenario, covering the primary use cases:
 *
 * STORIES:
 * 1. Default           -- Two actions (primary + ghost) with standard copy.
 * 2. SingleAction      -- Only a primary action; ghost button omitted.
 * 3. WithLinkRenderer  -- Actions rendered via a custom link renderer,
 *                         simulating React Router integration.
 * 4. NoActions         -- Heading and subtitle only; no action buttons.
 *
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { FooterCTA } from './FooterCTA';

/* =============================================================================
   META CONFIGURATION
   -----------------------------------------------------------------------------
   Defines the Storybook entry, control panel options, and shared defaults
   for the FooterCTA component.
   ============================================================================= */

const meta: Meta<typeof FooterCTA> = {
  title: 'Components/FooterCTA',
  component: FooterCTA,
  parameters: {
    /** Fullscreen layout removes Storybook padding for accurate full-width rendering. */
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Main heading rendered as an <h2> element.',
    },
    subtitle: {
      control: 'text',
      description: 'Supporting paragraph below the heading.',
    },
    actions: {
      control: 'object',
      description:
        'Array of 1-2 action objects. Each has label, href, variant, and optional onClick.',
    },
    className: {
      control: 'text',
      description: 'Optional CSS class name appended to the root <section> element.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FooterCTA>;

/* =============================================================================
   STORY 1: Default
   -----------------------------------------------------------------------------
   The standard two-button layout used on the House Extension page. A solid
   primary button for quote requests and a ghost button for phone contact.
   ============================================================================= */

export const Default: Story = {
  args: {
    title: 'Ready to Extend Your Home?',
    subtitle:
      'Contact our Dublin-based team to discuss your vision and arrange a complimentary site survey.',
    actions: [
      { label: 'Get a Free Quote', href: '/contact', variant: 'primary' },
      { label: 'Call Us Today', href: 'tel:+353000000000', variant: 'ghost' },
    ],
  },
};

/* =============================================================================
   STORY 2: SingleAction
   -----------------------------------------------------------------------------
   Demonstrates the component with only a single primary action. Useful on
   pages where a secondary/phone CTA is not required.
   ============================================================================= */

export const SingleAction: Story = {
  args: {
    title: 'Start Your Garden Room Project',
    subtitle:
      'Get in touch with our team to explore designs tailored to your garden and lifestyle.',
    actions: [
      { label: 'Request a Consultation', href: '/contact', variant: 'primary' },
    ],
  },
};

/* =============================================================================
   STORY 3: WithLinkRenderer
   -----------------------------------------------------------------------------
   Demonstrates router-aware rendering via a custom `renderLink` function.
   The mock renderer produces a plain <a> with a data attribute to confirm
   the renderer was invoked. In production, this would be React Router's
   <Link> component or a similar router-aware wrapper.
   ============================================================================= */

export const WithLinkRenderer: Story = {
  args: {
    title: 'Ready to Extend Your Home?',
    subtitle:
      'Contact our Dublin-based team to discuss your vision and arrange a complimentary site survey.',
    actions: [
      { label: 'Get a Free Quote', href: '/contact', variant: 'primary' },
      { label: 'Call Us Today', href: 'tel:+353000000000', variant: 'ghost' },
    ],
    renderLink: ({ href, children, className, onClick }) => (
      <a
        className={className}
        href={href}
        onClick={onClick}
        data-router="mock"
      >
        {children}
      </a>
    ),
  },
};

/* =============================================================================
   STORY 4: NoActions
   -----------------------------------------------------------------------------
   Edge case where no actions are provided. The component renders only the
   heading and subtitle, omitting the actions row entirely. Useful for
   informational banners where no CTA is required.
   ============================================================================= */

export const NoActions: Story = {
  args: {
    title: 'We Build Across Dublin & Surrounding Counties',
    subtitle:
      'Serving homeowners in Dublin, Wicklow, Kildare, and Meath with premium steel-frame extensions.',
    actions: [],
  },
};
