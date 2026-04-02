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
 * EXTENSION GUIDE:
 * 1. Add the new identifier string to the AddonIconId union in
 *    types/configurator.ts.
 * 2. Create a new React.FC component below that renders a 24x24 SVG.
 * 3. Register the component in ICON_MAP under its AddonIconId key.
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

   All icons use consistent attributes:
     - viewBox="0 0 24 24" for a uniform coordinate system
     - fill="none" to render outline-style strokes only
     - strokeWidth="1.5" for visual consistency
     - aria-hidden="true" because the parent label provides accessible text
   ============================================================================= */

/** Plumbing icon -- vertical pipe with a basin shape. */
const PlumbingIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2v6M8 8h8v4a4 4 0 0 1-4 4 4 4 0 0 1-4-4V8z" />
    <path d="M12 16v6" />
  </svg>
);

/** Glazing icon -- four-pane window grid representing triple glazing upgrade. */
const GlazingIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="3" y1="12" x2="21" y2="12" />
  </svg>
);

/** Decking icon -- horizontal planks with vertical support posts. */
const DeckingIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 18h20M2 14h20M6 10v4M10 10v4M14 10v4M18 10v4" />
    <path d="M4 10h16" />
  </svg>
);

/** Heating icon -- flame / droplet shape representing underfloor heating. */
const HeatingIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2C8 6 4 9 4 13a8 8 0 0 0 16 0c0-4-4-7-8-11z" />
  </svg>
);

/** Solar icon -- sun with radiating lines representing solar panel add-on. */
const SolarIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

/** Security icon -- shield shape representing security system add-on. */
const SecurityIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

/**
 * Sauna icon -- wooden bucket with a ladle, a universally recognised
 * symbol for sauna facilities. The tapered trapezoid body has three
 * horizontal band lines representing the wooden slats, and two
 * diagonal strokes depict the ladle and its handle resting inside.
 */
const SaunaIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {/* Bucket body -- tapered trapezoid wider at the top */}
    <path d="M5 9l1.5 13h11L19 9" />
    {/* Horizontal slat bands across the bucket */}
    <line x1="5.5" y1="13" x2="18.5" y2="13" />
    <line x1="6" y1="17" x2="18" y2="17" />
    {/* Bucket rim */}
    <line x1="4" y1="9" x2="20" y2="9" />
    {/* Ladle handle -- extends upward to the left from inside the bucket */}
    <path d="M9 9L7 3" />
    {/* Ladle scoop -- small oval at the top of the handle */}
    <ellipse cx="6.5" cy="2.5" rx="1.5" ry="1" />
    {/* Dipper stick -- angled stick resting against the bucket rim */}
    <path d="M14 9l3-6" />
  </svg>
);


/* =============================================================================
   Icon Map
   -----------------------------------------------------------------------------
   Record that associates each AddonIconId value with its corresponding
   SVG component. The Record<AddonIconId, React.FC> type guarantees that
   every member of the AddonIconId union has a matching entry -- a missing
   icon causes a compile-time error rather than a runtime failure.
   ============================================================================= */

/** Maps AddonIconId values to their corresponding SVG icon components. */
const ICON_MAP: Record<AddonIconId, React.FC> = {
  plumbing: PlumbingIcon,
  glazing:  GlazingIcon,
  decking:  DeckingIcon,
  heating:  HeatingIcon,
  solar:    SolarIcon,
  security: SecurityIcon,
  sauna:    SaunaIcon,
};


/* =============================================================================
   AddonIcon Component
   -----------------------------------------------------------------------------
   Public component consumed by the add-on card grid. Accepts a single
   iconId prop and renders the resolved SVG inline. Because ICON_MAP is
   typed as Record<AddonIconId, React.FC>, TypeScript ensures only valid
   identifiers are passed, eliminating the need for a runtime fallback.
   ============================================================================= */

/** Props accepted by the AddonIcon component. */
interface AddonIconProps {
  /**
   * Semantic icon identifier to resolve from the ICON_MAP lookup.
   * Accepts a plain string to remain compatible with the unified schema
   * where Addon.iconId is typed as string for extensibility. Unknown
   * identifiers fall back to a neutral placeholder icon.
   */
  iconId: string;
}

/**
 * Resolves an icon identifier to the matching SVG icon component and renders it.
 * The resolved component inherits stroke colour from its parent via currentColor.
 * Falls back to the GlazingIcon for unrecognised identifiers to prevent runtime
 * crashes when new icon IDs are added before their SVG components are implemented.
 */
export const AddonIcon: React.FC<AddonIconProps> = ({ iconId }) => {
  const IconComponent = ICON_MAP[iconId as AddonIconId] ?? GlazingIcon;
  return <IconComponent />;
};
