/**
 * PromoBanner Storybook Stories
 * =============================================================================
 *
 * PURPOSE:
 * Provides visual documentation and interactive controls for the
 * `PromoBanner` component. The stories exercise the dark and light variants
 * as well as edge-case lifecycles (near-expiry and fully expired states).
 *
 * USAGE:
 * Run `pnpm --filter @modular-house/ui storybook` to view these stories.
 *
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { PromoBanner } from './PromoBanner';

/* =============================================================================
   SECTION 1: META CONFIGURATION
   ============================================================================= */

const meta: Meta<typeof PromoBanner> = {
  title: 'Components/PromoBanner',
  component: PromoBanner,
  parameters: {
    // Use a full-width layout so the banner spans the canvas as it will in
    // production beneath the site header.
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text' },
    eyebrow: { control: 'text' },
    endsAt: { control: 'text' },
    variant: {
      control: 'inline-radio',
      options: ['dark', 'light'],
    },
    className: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;


/* =============================================================================
   SECTION 2: HELPERS
   -----------------------------------------------------------------------------
   Stories compute `endsAt` at the moment the story is defined so the
   countdown is always live relative to the current session.
   ============================================================================= */

/** Produces an ISO 8601 timestamp `offsetMs` milliseconds from now. */
const fromNow = (offsetMs: number): string => new Date(Date.now() + offsetMs).toISOString();


/* =============================================================================
   SECTION 3: STORIES
   ============================================================================= */

/**
 * Default dark variant with a long-running campaign.
 * Demonstrates the canonical appearance used with the dark header.
 */
export const Default: Story = {
  args: {
    name: 'Spring Sale 2026',
    eyebrow: 'Limited time',
    endsAt: fromNow(1000 * 60 * 60 * 24 * 14), // +14 days
    variant: 'dark',
  },
};

/**
 * Light variant paired with the light header treatment.
 */
export const Light: Story = {
  args: {
    name: 'Spring Sale 2026',
    eyebrow: 'Limited time',
    endsAt: fromNow(1000 * 60 * 60 * 24 * 14),
    variant: 'light',
  },
};

/**
 * Near-expiry state: the countdown is set 30 seconds ahead so the
 * zero-crossing behaviour can be observed interactively.
 */
export const NearExpiry: Story = {
  args: {
    name: 'Flash Sale',
    eyebrow: 'Ends today',
    endsAt: fromNow(30 * 1000),
    variant: 'dark',
  },
};

/**
 * Expired campaign: the banner renders nothing because `useCountdown`
 * immediately returns `null`. This story asserts (visually) that expired
 * banners produce no visible output.
 */
export const Expired: Story = {
  args: {
    name: 'Past Sale',
    eyebrow: 'Ended',
    endsAt: fromNow(-60 * 1000),
    variant: 'dark',
  },
};
