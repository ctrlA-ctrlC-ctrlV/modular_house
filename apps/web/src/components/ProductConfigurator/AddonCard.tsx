/**
 * AddonCard -- Toggleable Add-On Option Card
 * =============================================================================
 *
 * PURPOSE:
 * Renders a single add-on option as a horizontal card with an icon, name,
 * description, price, and a checkbox indicator. The card toggles between
 * selected and unselected states on click.
 *
 * DESIGN:
 * The card uses a button element for keyboard accessibility. The checkbox
 * indicator is purely visual (CSS-driven) -- the toggle logic is handled
 * by the parent component through the onToggle callback.
 *
 * =============================================================================
 */

import React from 'react';
import type { AddonOption } from '../../types/configurator';
import { AddonIcon } from './AddonIcon';
import { formatPriceCents } from './utils';


/* =============================================================================
   Checkmark Icon
   ============================================================================= */

const CheckmarkIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M3 7L6 10L11 4"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);


/* =============================================================================
   Component Props
   ============================================================================= */

interface AddonCardProps {
  /** The add-on option data to render. */
  addon: AddonOption;
  /** Whether this add-on is currently selected. */
  isSelected: boolean;
  /** Callback invoked when the user toggles this add-on. Receives the addon ID. */
  onToggle: (addonId: string) => void;
}


/* =============================================================================
   AddonCard Component
   ============================================================================= */

export const AddonCard: React.FC<AddonCardProps> = ({
  addon,
  isSelected,
  onToggle,
}) => {
  const cardClass = [
    'configurator__addon-card',
    isSelected && 'configurator__addon-card--selected',
  ]
    .filter(Boolean)
    .join(' ');

  const iconClass = [
    'configurator__addon-icon',
    isSelected && 'configurator__addon-icon--selected',
  ]
    .filter(Boolean)
    .join(' ');

  const checkboxClass = [
    'configurator__addon-checkbox',
    isSelected && 'configurator__addon-checkbox--checked',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={cardClass}
      onClick={() => onToggle(addon.id)}
      aria-pressed={isSelected}
      aria-label={`${addon.name}: ${formatPriceCents(addon.priceCentsInclVat)}${isSelected ? ' (selected)' : ''}`}
    >
      <div className={iconClass}>
        <AddonIcon iconId={addon.iconId} />
      </div>

      <div className="configurator__addon-body">
        <div className="configurator__addon-name">{addon.name}</div>
        <div className="configurator__addon-description">{addon.description}</div>
      </div>

      <div className="configurator__addon-price">
        +{formatPriceCents(addon.priceCentsInclVat)}
      </div>

      <div className={checkboxClass} aria-hidden="true">
        {isSelected && <CheckmarkIcon />}
      </div>
    </button>
  );
};
