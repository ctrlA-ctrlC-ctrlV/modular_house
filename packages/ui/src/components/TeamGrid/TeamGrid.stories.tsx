/**
 * TeamGrid Storybook Stories
 * =============================================================================
 *
 * PURPOSE:
 * Provides visual documentation and interactive examples for the TeamGrid
 * component within Storybook. Each story demonstrates a distinct configuration,
 * covering the primary use case from the About page design template as well as
 * an edge-case layout with fewer members.
 *
 * STORIES:
 * 1. Default    -- 4 team members on a dark background (About page layout).
 * 2. TwoMembers -- 2 members to verify grid centering behaviour with fewer items.
 *
 * NOTE:
 * Avatar images in stories use placeholder URLs. In the production About page,
 * actual team member photographs will be supplied by the page-level code.
 *
 * =============================================================================
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TeamGrid } from './TeamGrid';
import type { TeamMember } from './TeamGrid';

/* =============================================================================
   META CONFIGURATION
   -----------------------------------------------------------------------------
   Defines the Storybook entry, control panel options, and shared defaults.
   ============================================================================= */

const meta: Meta<typeof TeamGrid> = {
  title: 'Components/TeamGrid',
  component: TeamGrid,
  parameters: {
    /** Fullscreen layout removes Storybook padding for accurate section rendering. */
    layout: 'fullscreen',
    /**
     * Dark background parameter for the Storybook canvas.
     * Ensures the dark-themed component is displayed in its intended context.
     */
    backgrounds: {
      default: 'dark',
    },
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
type Story = StoryObj<typeof TeamGrid>;

/* =============================================================================
   SHARED FIXTURE DATA
   -----------------------------------------------------------------------------
   Sample team member data used across stories. Avatar images reference
   placeholder URLs that approximate the production portrait dimensions.
   ============================================================================= */

/**
 * Four-member dataset matching the About page "Our Team" section from the
 * approved HTML template. Each member has a unique id for stable list keying.
 */
const fourMembers: TeamMember[] = [
  {
    id: 'liam-oconnor',
    name: "Liam O'Connor",
    role: 'Founder & Principal Architect',
    bio: 'With 15 years of experience in structural engineering, Liam leads our design vision.',
    imageSrc: 'https://placehold.co/192x192/1A1714/B55329?text=LO',
    imageAlt: "Portrait of Liam O'Connor, Founder & Principal Architect",
  },
  {
    id: 'siobhan-murphy',
    name: 'Siobhan Murphy',
    role: 'Operations Director',
    bio: 'Siobhan ensures every project timeline is met with military precision and clarity.',
    imageSrc: 'https://placehold.co/192x192/1A1714/B55329?text=SM',
    imageAlt: 'Portrait of Siobhan Murphy, Operations Director',
  },
  {
    id: 'david-byrne',
    name: 'David Byrne',
    role: 'Site Supervisor',
    bio: 'Our master of onsite assembly, David has overseen over 50 successful steel-frame builds.',
    imageSrc: 'https://placehold.co/192x192/1A1714/B55329?text=DB',
    imageAlt: 'Portrait of David Byrne, Site Supervisor',
  },
  {
    id: 'aisling-kelly',
    name: 'Aisling Kelly',
    role: 'Head of Sustainability',
    bio: 'Aisling drives our commitment to A1 BER ratings and carbon-neutral construction methods.',
    imageSrc: 'https://placehold.co/192x192/1A1714/B55329?text=AK',
    imageAlt: 'Portrait of Aisling Kelly, Head of Sustainability',
  },
];

/* =============================================================================
   STORY 1: Default
   -----------------------------------------------------------------------------
   Four team members on the dark background, matching the About page "Our Team"
   section from the design template. Demonstrates the full 4-column desktop
   layout with grayscale-to-colour avatar hover effect.
   ============================================================================= */

export const Default: Story = {
  args: {
    eyebrow: 'OUR TEAM',
    heading: 'The People Behind Every Build',
    members: fourMembers,
  },
};

/* =============================================================================
   STORY 2: TwoMembers
   -----------------------------------------------------------------------------
   Two team members to verify that the grid handles fewer items gracefully.
   On desktop, two cards occupy the first two of four columns; on mobile,
   they stack into a single centered column.
   ============================================================================= */

export const TwoMembers: Story = {
  args: {
    eyebrow: 'LEADERSHIP',
    heading: 'Meet Our Founders',
    members: fourMembers.slice(0, 2),
  },
};
