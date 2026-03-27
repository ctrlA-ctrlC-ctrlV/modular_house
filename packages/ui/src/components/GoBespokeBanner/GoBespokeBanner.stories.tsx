/**
 * GoBespokeBanner Stories
 * =============================================================================
 *
 * Storybook story definitions for the GoBespokeBanner component. Provides
 * interactive controls for all props and demonstrates the component in its
 * default configuration with production-representative content.
 *
 * =============================================================================
 */

//import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GoBespokeBanner } from './GoBespokeBanner';


/* =============================================================================
   Story Meta Configuration
   =============================================================================
   Registers the GoBespokeBanner under the "Components" sidebar group and
   enables automatic documentation generation via the 'autodocs' tag.
   ============================================================================= */
const meta: Meta<typeof GoBespokeBanner> = {
  title: 'Components/GoBespokeBanner',
  component: GoBespokeBanner,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    eyebrow: {
      control: 'text',
      description: 'Small uppercase label displayed above the heading.',
    },
    heading: {
      control: 'text',
      description:
        'Primary heading text. Accepts React nodes for inline formatting such as <em> or <br />.',
    },
    subtext: {
      control: 'text',
      description:
        'Supporting paragraph below the heading. Accepts React nodes for inline <strong> emphasis.',
    },
    ctaLabel: {
      control: 'text',
      description: 'Label text displayed inside the call-to-action button.',
    },
    onCtaClick: {
      action: 'ctaClicked',
      description: 'Callback fired when the CTA button is pressed.',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for the wrapping <section> element.',
    },
    className: {
      control: 'text',
      description: 'Optional additional CSS class names appended to the root element.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof GoBespokeBanner>;


/* =============================================================================
   Story: Default
   =============================================================================
   Demonstrates the GoBespokeBanner with production-representative content
   matching the garden room page context: a "Bespoke Builds" eyebrow, a
   two-line heading with italic emphasis, and descriptive subtext highlighting
   the custom engineering offering.
   ============================================================================= */
export const Default: Story = {
  args: {
    eyebrow: 'Bespoke Builds',
    heading: (
      <>
        Nothing catching your eye?<br />
        <em>Go Bespoke.</em>
      </>
    ),
    subtext: (
      <>
        Our four standard sizes cover most needs — but not every garden is
        standard.{' '}
        <strong>
          Odd-shaped site, specific layout, or something we haven&apos;t thought
          of yet?
        </strong>{' '}
        We&apos;ll engineer a steel-frame solution around your exact brief —
        same factory precision, same Dublin build quality.
      </>
    ),
    ctaLabel: 'Design Your Own',
    ariaLabel: 'Custom bespoke garden room enquiry',
  },
};


/* =============================================================================
   Story: MinimalContent
   =============================================================================
   Demonstrates the component with minimal text content to verify layout
   integrity and visual balance when fewer words are used.
   ============================================================================= */
export const MinimalContent: Story = {
  args: {
    eyebrow: 'Custom Design',
    heading: <><em>Your Vision.</em> Our Engineering.</>,
    subtext: 'Tell us what you need and we will build it.',
    ctaLabel: 'Get Started',
    ariaLabel: 'Custom design enquiry',
  },
};
