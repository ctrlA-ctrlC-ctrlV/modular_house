/**
 * AddonIcon -- SVG Icon Resolver for Add-On Options
 * =============================================================================
 *
 * PURPOSE:
 * Maps semantic icon identifiers (AddonIconId) to SVG icon components.
 * Each add-on option in the data model carries an `iconId` field; this
 * component resolves that identifier to the correct visual representation.
 *
 * DESIGN:
 * Uses a lookup object for O(1) resolution. New icon identifiers can be
 * added by appending an entry to the ICON_MAP object and the AddonIconId
 * type union (Open-Closed Principle).
 *
 * =============================================================================
 */

import React from 'react';
import type { AddonIconId } from '../../types/configurator';


/* =============================================================================
   SVG Icon Components
   -----------------------------------------------------------------------------
   Each icon is a 24x24 SVG rendered as a React functional component.
   The stroke colour is inherited from the parent container via
   currentColor, allowing the icon to adapt when its parent toggles
   between selected/unselected states.
   ============================================================================= */

const PlumbingIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2v6M8 8h8v4a4 4 0 0 1-4 4 4 4 0 0 1-4-4V8z" />
    <path d="M12 16v6" />
  </svg>
);

const GlazingIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="3" y1="12" x2="21" y2="12" />
  </svg>
);

const DeckingIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 18h20M2 14h20M6 10v4M10 10v4M14 10v4M18 10v4" />
    <path d="M4 10h16" />
  </svg>
);

const HeatingIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2C8 6 4 9 4 13a8 8 0 0 0 16 0c0-4-4-7-8-11z" />
  </svg>
);

const SolarIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const SecurityIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);


/* =============================================================================
   Icon Map
   ============================================================================= */

/** Maps AddonIconId values to their corresponding SVG icon components. */
const ICON_MAP: Record<AddonIconId, React.FC> = {
  plumbing: PlumbingIcon,
  glazing: GlazingIcon,
  decking: DeckingIcon,
  heating: HeatingIcon,
  solar: SolarIcon,
  security: SecurityIcon,
};


/* =============================================================================
   AddonIcon Component
   ============================================================================= */

interface AddonIconProps {
  /** Semantic icon identifier to resolve. */
  iconId: AddonIconId;
}

export const AddonIcon: React.FC<AddonIconProps> = ({ iconId }) => {
  const IconComponent = ICON_MAP[iconId];
  return <IconComponent />;
};
