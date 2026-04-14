/**
 * ContentWithImage Storybook Stories
 * =============================================================================
 *
 * PURPOSE:
 * Provides visual documentation and interactive examples for the
 * ContentWithImage component within Storybook. Each story demonstrates a
 * distinct configuration of the component's props, covering the primary
 * use cases identified in the About page design template.
 *
 * STORIES:
 * 1. Default         -- Standard layout with image on the right and primary bg.
 * 2. ImageFirst      -- Reversed column order with image on the left.
 * 3. SecondaryBg     -- Warm beige background for alternating page sections.
 * 4. SquareImage     -- 1:1 aspect ratio for symmetrical image presentation.
 * 5. WideImage       -- 16:9 aspect ratio for landscape-oriented imagery.
 *
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ContentWithImage } from './ContentWithImage';

/* =============================================================================
   META CONFIGURATION
   -----------------------------------------------------------------------------
   Defines the Storybook entry, control panel options, and shared defaults
   for all stories in this file.
   ============================================================================= */

const meta: Meta<typeof ContentWithImage> = {
  title: 'Components/ContentWithImage',
  component: ContentWithImage,
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
    imageAspectRatio: {
      control: 'select',
      options: ['1:1', '4:5', '3:4', '16:9'],
      description: 'Aspect ratio applied to the image container.',
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
type Story = StoryObj<typeof ContentWithImage>;

/* =============================================================================
   SHARED FIXTURE DATA
   -----------------------------------------------------------------------------
   Placeholder image URL and content used across multiple stories.
   Centralised here to avoid repetition and simplify future updates.
   ============================================================================= */

/**
 * Placeholder image sourced from the HTML design template.
 * In production, this would point to an optimised asset served via the CDN.
 */
const PLACEHOLDER_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBxDnQmaSQkcoMiYawI5N0myvER8fU4bAmHuifY7bEOiddkUqGwbDTZ_6KoNzSkE7fhPeachfI5ZslBTQhMiZRzmf5dwLaY0eW-FEt6LwIEU5FVS_S8qRD9YLz8S1WTdm_vx31MfvDHpEZKN4rnUgrMxtFqXMeHvMUCMJlGFmn_v838Id5TrfHCcUV4_USB47zj394VeNfWVqiOXrToj6wBbh9pLySw93H6swc-RiaXaeulMY5ljfu3MmdogPoM1ml9SXoRAB-2cpKS';

/**
 * Default body content matching the "Our Story" section from the About page
 * design template. Wrapped in `<p>` elements to demonstrate multi-paragraph
 * prose support.
 */
const defaultChildren = (
  <>
    <p>
      Founded in Dublin in 2020, Modular House was born from a desire to bridge
      the gap between traditional Irish masonry and the precision of modern
      modular construction. We saw an opportunity to provide homeowners with
      high-quality, sustainable alternatives to conventional extensions.
    </p>
    <p>
      Our journey began with a single garden studio in Rathfarnham. Today, our
      team of architects and engineers works from our state-of-the-art facility
      to deliver turnkey steel-frame solutions that are as durable as they are
      beautiful. We are not just building rooms; we are crafting architectural
      monographs for the modern Dublin lifestyle.
    </p>
  </>
);

/* =============================================================================
   STORY 1: Default
   -----------------------------------------------------------------------------
   Standard layout: image on the right, primary background, 4:5 aspect ratio.
   Mirrors the "Our Story" section in the About page template.
   ============================================================================= */

export const Default: Story = {
  args: {
    eyebrow: 'OUR STORY',
    heading: 'Reimagining Living Spaces',
    imageSrc: PLACEHOLDER_IMAGE,
    imageAlt: 'A professional construction site showing a light gauge steel frame being assembled for a residential building',
    imageAspectRatio: '4:5',
    imageFirst: false,
    backgroundColor: 'primary',
  },
  render: (args) => (
    <ContentWithImage {...args}>
      {defaultChildren}
    </ContentWithImage>
  ),
};

/* =============================================================================
   STORY 2: ImageFirst
   -----------------------------------------------------------------------------
   Reversed column order: image on the left, text on the right.
   Demonstrates the `imageFirst` prop for alternating section layouts.
   ============================================================================= */

export const ImageFirst: Story = {
  args: {
    eyebrow: 'OUR APPROACH',
    heading: 'Designed and Built in Dublin',
    imageSrc: PLACEHOLDER_IMAGE,
    imageAlt: 'Interior view of a completed Modular House garden room',
    imageAspectRatio: '4:5',
    imageFirst: true,
    backgroundColor: 'primary',
  },
  render: (args) => (
    <ContentWithImage {...args}>
      {defaultChildren}
    </ContentWithImage>
  ),
};

/* =============================================================================
   STORY 3: SecondaryBg
   -----------------------------------------------------------------------------
   Warm beige background variant for creating visual rhythm when sections
   alternate between primary and secondary backgrounds on a page.
   ============================================================================= */

export const SecondaryBg: Story = {
  args: {
    eyebrow: 'SUSTAINABILITY',
    heading: 'Building a Greener Future',
    imageSrc: PLACEHOLDER_IMAGE,
    imageAlt: 'Eco-friendly construction materials laid out on site',
    imageAspectRatio: '4:5',
    imageFirst: false,
    backgroundColor: 'secondary',
  },
  render: (args) => (
    <ContentWithImage {...args}>
      {defaultChildren}
    </ContentWithImage>
  ),
};

/* =============================================================================
   STORY 4: SquareImage
   -----------------------------------------------------------------------------
   Demonstrates the 1:1 aspect ratio option for symmetrical image containers,
   suitable for portrait photography or icon-style imagery.
   ============================================================================= */

export const SquareImage: Story = {
  args: {
    eyebrow: 'OUR TEAM',
    heading: 'Meet the People Behind Modular',
    imageSrc: PLACEHOLDER_IMAGE,
    imageAlt: 'Modular House team members at the Dublin workshop',
    imageAspectRatio: '1:1',
    imageFirst: true,
    backgroundColor: 'primary',
  },
  render: (args) => (
    <ContentWithImage {...args}>
      {defaultChildren}
    </ContentWithImage>
  ),
};

/* =============================================================================
   STORY 5: WideImage
   -----------------------------------------------------------------------------
   Demonstrates the 16:9 landscape aspect ratio, suitable for wide-angle
   photography of completed projects or construction sites.
   ============================================================================= */

export const WideImage: Story = {
  args: {
    eyebrow: 'FEATURED PROJECT',
    heading: 'Rathfarnham Garden Studio',
    imageSrc: PLACEHOLDER_IMAGE,
    imageAlt: 'Wide exterior view of a completed garden studio project in Rathfarnham',
    imageAspectRatio: '16:9',
    imageFirst: false,
    backgroundColor: 'secondary',
  },
  render: (args) => (
    <ContentWithImage {...args}>
      {defaultChildren}
    </ContentWithImage>
  ),
};
