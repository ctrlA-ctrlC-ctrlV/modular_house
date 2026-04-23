/**
 * EventNewsBanner Storybook Stories
 * =============================================================================
 *
 * PURPOSE:
 * Provides visual documentation and interactive controls for the
 * `EventNewsBanner` component. The stories cover the primary live state,
 * a near-expiry scenario, and the expired state (which renders nothing) to
 * validate the full lifecycle of the component.
 *
 * USAGE:
 * Run `pnpm --filter @modular-house/ui storybook` to view these stories
 * in the Storybook canvas.
 *
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { EventNewsBanner } from './EventNewsBanner';


/* =============================================================================
   SECTION 1: META CONFIGURATION
   =============================================================================

   `layout: 'fullscreen'` renders the banner without padding so it spans the
   canvas width as it will in production, making it easier to review the
   full-bleed background and layout.
   ============================================================================= */

const meta: Meta<typeof EventNewsBanner> = {
  title: 'Components/EventNewsBanner',
  component: EventNewsBanner,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    logoSrc:            { control: 'text' },
    logoSrcWebP:        { control: 'text' },
    logoSrcAvif:        { control: 'text' },
    logoAlt:            { control: 'text' },
    backgroundSrc:      { control: 'text' },
    backgroundSrcWebP:  { control: 'text' },
    backgroundSrcAvif:  { control: 'text' },
    endsAt:             { control: 'text' },
    badgeLabel:         { control: 'text' },
    className:          { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;


/* =============================================================================
   SECTION 2: HELPERS
   -----------------------------------------------------------------------------
   Stories derive `endsAt` relative to the moment the story is rendered so
   the countdown is always live during a Storybook session rather than
   hardcoded to a date that may already have passed.
   ============================================================================= */

/**
 * Returns an ISO 8601 timestamp offset by `offsetMs` milliseconds from the
 * current instant. Used to produce deterministic-looking but always-fresh
 * deadline values for story arguments.
 */
const fromNow = (offsetMs: number): string =>
  new Date(Date.now() + offsetMs).toISOString();

/** Millisecond constants for common durations. */
const MS = {
  SECOND: 1_000,
  MINUTE: 60_000,
  HOUR:   3_600_000,
  DAY:    86_400_000,
} as const;


/* =============================================================================
   SECTION 3: STORIES
   ============================================================================= */

/**
 * Default — live event appearance.
 * Demonstrates the canonical banner with the IHS (Ideal Home Show) logo and a
 * deadline several days in the future. This is the story that most closely
 * matches the production appearance.
 */
export const Default: Story = {
  args: {
    logoSrc:            'https://modularhouse.ie/resource/misc/IHS.png',
    logoSrcWebP:        'https://modularhouse.ie/resource/misc/IHS.webp',
    logoSrcAvif:        'https://modularhouse.ie/resource/misc/IHS.avif',
    logoAlt:            'PTSB Ideal Home Show logo',
    backgroundSrc:      'https://modularhouse.ie/resource/misc/default_banner_bg.png',
    backgroundSrcWebP:  'https://modularhouse.ie/resource/misc/default_banner_bg.webp',
    backgroundSrcAvif:  'https://modularhouse.ie/resource/misc/default_banner_bg.avif',
    endsAt:             fromNow(MS.DAY * 3),
    badgeLabel:         'SEE US @',
  },
};

/**
 * CustomBadgeLabel — demonstrates the `badgeLabel` prop.
 * An alternative label is supplied to show that the badge text is configurable
 * without forking the component.
 */
export const CustomBadgeLabel: Story = {
  args: {
    ...Default.args,
    badgeLabel: 'VISIT US @',
    endsAt:     fromNow(MS.DAY * 7),
  },
};

/**
 * NearExpiry — banner active with fewer than five minutes remaining.
 * Used to verify that the component remains visible until the exact deadline
 * rather than disappearing prematurely.
 */
export const NearExpiry: Story = {
  args: {
    ...Default.args,
    endsAt: fromNow(MS.MINUTE * 4 + MS.SECOND * 30),
  },
};

/**
 * Expired — `endsAt` is set to a point in the past.
 * The canvas should be entirely empty because the component returns `null`
 * when the deadline has already passed. This story is a visual regression
 * guard to confirm no residual element is rendered.
 */
export const Expired: Story = {
  args: {
    ...Default.args,
    endsAt: fromNow(-MS.HOUR),
  },
};
