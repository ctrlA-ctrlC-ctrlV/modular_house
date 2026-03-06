/**
 * InfoBanner Storybook Stories
 * =============================================================================
 * 
 * PURPOSE:
 * Provides interactive documentation and visual testing for the InfoBanner
 * component. Stories demonstrate various configuration options and use cases.
 * 
 * STORYBOOK CONFIGURATION:
 * - Layout: centered (displays component centered in canvas)
 * - Tags: autodocs (enables automatic documentation generation)
 * 
 * USAGE:
 * Run `pnpm storybook` from the packages/ui directory to view these stories.
 * 
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { InfoBanner } from './InfoBanner';


/* =============================================================================
   SECTION 1: STORYBOOK META CONFIGURATION
   -----------------------------------------------------------------------------
   Defines component metadata for Storybook sidebar organization
   and default rendering parameters.
   ============================================================================= */

/**
 * Storybook metadata configuration.
 * Registers the component within the Components category and applies
 * centered layout for focused viewing.
 */
const meta: Meta<typeof InfoBanner> = {
  title: 'Components/InfoBanner',
  component: InfoBanner,
  parameters: {
    /**
     * Centered layout positions the component in the middle of the canvas.
     * Appropriate for card-like components.
     */
    layout: 'centered',
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
    eyebrow: {
      control: 'text',
      description: 'Eyebrow text appearing above the heading.',
    },
    heading: {
      control: 'text',
      description: 'Primary heading text for the banner.',
    },
    body: {
      control: 'text',
      description: 'Body text providing context and details.',
    },
    statusItems: {
      control: 'object',
      description: 'Array of status items with label, status, and tag.',
    },
    link: {
      control: 'object',
      description: 'Optional link with href, text, and openInNewTab.',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for the banner region.',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names.',
    },
  },
};

export default meta;

/**
 * Story type alias for InfoBanner component.
 * Provides type safety for story configurations.
 */
type Story = StoryObj<typeof InfoBanner>;


/* =============================================================================
   SECTION 2: STORY DEFINITIONS
   -----------------------------------------------------------------------------
   Individual stories demonstrating various component configurations.
   ============================================================================= */

/**
 * Default Story
 * 
 * Demonstrates the complete InfoBanner with all elements:
 * eyebrow, heading, body, status items, and link.
 * Based on the planning permission use case.
 */
export const Default: Story = {
  args: {
    eyebrow: 'Regulations',
    heading: 'Do You Need Planning Permission?',
    body: 'Under current Irish law, garden rooms up to 25m² are exempt from planning permission when they meet certain conditions. New legislation is being prepared to increase this threshold, allowing garden rooms up to 45m² without planning permission.',
    statusItems: [
      { label: 'Up to 25m²', status: 'active', tag: 'Exempt' },
      { label: '35m²', status: 'pending', tag: 'Pending' },
      { label: '45m²', status: 'pending', tag: 'Pending' },
    ],
    link: {
      href: 'https://www.irishtimes.com/politics/2025/06/04/garden-rooms-and-attics-what-are-the-proposed-changes-to-regulations/',
      text: 'Learn More About Planning',
      openInNewTab: true,
    },
    ariaLabel: 'Planning permission information',
  },
};

/**
 * Without Link Story
 * 
 * Demonstrates the InfoBanner without a CTA link.
 * Useful for purely informational displays.
 */
export const WithoutLink: Story = {
  args: {
    eyebrow: 'Compliance',
    heading: 'Building Regulations Compliance',
    body: 'All our garden rooms are designed and built to comply with Irish building regulations. We handle all necessary certifications and documentation.',
    statusItems: [
      { label: 'Structural', status: 'active', tag: 'Certified' },
      { label: 'Electrical', status: 'active', tag: 'Certified' },
      { label: 'Insulation', status: 'active', tag: 'Certified' },
    ],
    ariaLabel: 'Building regulations compliance information',
  },
};

/**
 * Without Status Items Story
 * 
 * Demonstrates the InfoBanner with only text content and a link.
 * Suitable for simpler announcements.
 */
export const WithoutStatusItems: Story = {
  args: {
    eyebrow: 'Announcement',
    heading: 'New Showroom Opening',
    body: 'We are excited to announce the opening of our new showroom in Dublin. Visit us to explore our full range of garden rooms and speak with our design experts.',
    link: {
      href: '/contact',
      text: 'Book a Visit',
      openInNewTab: false,
    },
    ariaLabel: 'Showroom opening announcement',
  },
};

/**
 * Minimal Story
 * 
 * Demonstrates the most minimal configuration with only required props.
 * Shows the component's base appearance.
 */
export const Minimal: Story = {
  args: {
    heading: 'Important Notice',
    body: 'This is a simple informational banner with minimal configuration.',
    ariaLabel: 'Important notice',
  },
};

/**
 * All Active Story
 * 
 * Demonstrates all status items in active state.
 * Useful for showing completed requirements or features.
 */
export const AllActive: Story = {
  args: {
    eyebrow: 'Features',
    heading: 'Included in Every Garden Room',
    body: 'Every Modular House garden room comes with these standard features, ensuring comfort and quality from day one.',
    statusItems: [
      { label: 'Double Glazing', status: 'active', tag: 'Included' },
      { label: 'Insulation', status: 'active', tag: 'Included' },
      { label: 'Electrical', status: 'active', tag: 'Included' },
      { label: 'LED Lighting', status: 'active', tag: 'Included' },
    ],
    link: {
      href: '/specifications',
      text: 'View Full Specifications',
      openInNewTab: false,
    },
    ariaLabel: 'Standard features information',
  },
};

/**
 * Mixed Status Story
 * 
 * Demonstrates a mix of active and pending status items.
 * Common for showing phased feature rollouts.
 */
export const MixedStatus: Story = {
  args: {
    eyebrow: 'Warranty',
    heading: 'Our Warranty Coverage',
    body: 'We stand behind our work with comprehensive warranty coverage. Some extended warranty options are coming soon.',
    statusItems: [
      { label: 'Structure', status: 'active', tag: '10 Years' },
      { label: 'Windows', status: 'active', tag: '5 Years' },
      { label: 'Electrical', status: 'active', tag: '2 Years' },
      { label: 'Extended', status: 'pending', tag: 'Coming Soon' },
    ],
    link: {
      href: '/warranty',
      text: 'Read Warranty Terms',
      openInNewTab: false,
    },
    ariaLabel: 'Warranty coverage information',
  },
};

/**
 * Rich Body Content Story
 * 
 * Demonstrates the InfoBanner with React node body content.
 * Shows support for rich text formatting.
 */
export const RichBodyContent: Story = {
  args: {
    eyebrow: 'Installation',
    heading: 'What to Expect During Installation',
    body: (
      <>
        <p style={{ marginBottom: '0.5rem' }}>
          Our professional installation team will complete your garden room in just <strong>2-3 days</strong>.
        </p>
        <p>
          We handle everything from site preparation to final inspection, ensuring a seamless experience.
        </p>
      </>
    ),
    statusItems: [
      { label: 'Day 1', status: 'active', tag: 'Foundation' },
      { label: 'Day 2', status: 'active', tag: 'Structure' },
      { label: 'Day 3', status: 'active', tag: 'Finishing' },
    ],
    link: {
      href: '/installation-guide',
      text: 'View Installation Guide',
      openInNewTab: false,
    },
    ariaLabel: 'Installation process information',
  },
};
