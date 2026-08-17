/**
 * LocationMap Storybook Stories
 * =============================================================================
 *
 * PURPOSE:
 * Provides visual documentation and interactive examples for the LocationMap
 * component within Storybook.
 *
 * STORIES:
 * 1. Default          -- Company headquarters at the default zoom.
 * 2. CustomLocation    -- A different address/coordinates, proving the
 *                         component is fully prop-driven rather than
 *                         hardcoded to the company default.
 * 3. AtMaxZoom          -- Initial zoom pinned to the maximum, demonstrating
 *                         the disabled zoom-in button state.
 * 4. AtMinZoom          -- Initial zoom pinned to the minimum, demonstrating
 *                         the disabled zoom-out button state.
 *
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { LocationMap } from './LocationMap';

/* =============================================================================
   META CONFIGURATION
   -----------------------------------------------------------------------------
   Defines the Storybook entry, control panel options, and shared defaults.
   ============================================================================= */

const meta: Meta<typeof LocationMap> = {
  title: 'Components/LocationMap',
  component: LocationMap,
  parameters: {
    /** Padded layout suits this component's bounded-card presentation. */
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a location as an embedded map preview with custom zoom controls and a one-click "Get Directions" action. Defaults to the company headquarters but accepts any location via props.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    locationName: {
      control: 'text',
      description: 'Display name for the location, used in the map\'s accessible title.',
    },
    address: {
      control: 'text',
      description: 'Human-readable postal address, shown beneath the map.',
    },
    latitude: {
      control: 'number',
      description: 'Latitude of the pinned location, decimal degrees.',
    },
    longitude: {
      control: 'number',
      description: 'Longitude of the pinned location, decimal degrees.',
    },
    zoom: {
      control: 'number',
      description: 'Initial embed zoom level, clamped to [minZoom, maxZoom].',
    },
    minZoom: {
      control: 'number',
      description: 'Minimum allowed zoom level.',
    },
    maxZoom: {
      control: 'number',
      description: 'Maximum allowed zoom level.',
    },
    zoomStep: {
      control: 'number',
      description: 'Amount the zoom buttons change the zoom level per click.',
    },
    travelMode: {
      control: 'select',
      options: ['driving', 'walking', 'bicycling', 'transit'],
      description: 'Travel mode forwarded to the "Get Directions" URL.',
    },
    className: {
      control: 'text',
      description: 'Optional CSS class name appended to the root element.',
    },
    id: {
      control: 'text',
      description: 'Optional id attribute for the root element.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LocationMap>;

/* =============================================================================
   STORY 1: Default
   -----------------------------------------------------------------------------
   Company headquarters at the default zoom level (15).
   ============================================================================= */

export const Default: Story = {
  args: {},
};

/* =============================================================================
   STORY 2: CustomLocation
   -----------------------------------------------------------------------------
   A different address and coordinates, demonstrating the component is
   fully prop-driven rather than hardcoded to the company default.
   ============================================================================= */

export const CustomLocation: Story = {
  args: {
    locationName: 'Dublin City Centre',
    address: 'O\'Connell Street, Dublin 1, Ireland',
    latitude: 53.3498,
    longitude: -6.2603,
    zoom: 13,
    travelMode: 'walking',
  },
};

/* =============================================================================
   STORY 3: AtMaxZoom
   -----------------------------------------------------------------------------
   Initial zoom pinned to the maximum, demonstrating the disabled
   zoom-in button state.
   ============================================================================= */

export const AtMaxZoom: Story = {
  args: {
    zoom: 20,
    maxZoom: 20,
  },
};

/* =============================================================================
   STORY 4: AtMinZoom
   -----------------------------------------------------------------------------
   Initial zoom pinned to the minimum, demonstrating the disabled
   zoom-out button state.
   ============================================================================= */

export const AtMinZoom: Story = {
  args: {
    zoom: 3,
    minZoom: 3,
  },
};
