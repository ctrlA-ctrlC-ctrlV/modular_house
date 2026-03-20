/**
 * LayoutCard -- Selectable Interior Layout Card
 * =============================================================================
 *
 * PURPOSE:
 * Renders a single selectable layout option as a vertical card with an
 * architectural floor plan preview (passed as children), the layout name,
 * description, pricing, and feature badges. Used on the Layout Selection
 * step for products that offer multiple interior arrangements.
 *
 * DESIGN:
 * The card uses a button element for keyboard accessibility. Feature
 * badges are derived directly from the boolean flags on LayoutOption
 * (includesBathroom, includesKitchen, includesBedroomWall). When none
 * are true, a single "Open Plan" badge is rendered instead. The
 * component is stateless -- selection logic is managed by the parent.
 *
 * =============================================================================
 */

import React from 'react';
import type { LayoutOption } from '../../types/configurator';
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
   Feature Badge Builder
   ============================================================================= */

/**
 * Derives the list of feature badge labels from the layout's boolean flags.
 * Returns ["Open Plan"] when no features are bundled.
 */
function buildBadgeLabels(layout: LayoutOption): ReadonlyArray<string> {
  const labels: string[] = [];

  if (layout.includesBathroom) labels.push('Bathroom');
  if (layout.includesKitchen) labels.push('Kitchen');
  if (layout.includesBedroomWall) labels.push('Bedroom Wall');

  return labels.length > 0 ? labels : ['Open Plan'];
}


/* =============================================================================
   Component Props
   ============================================================================= */

interface LayoutCardProps {
  /** The layout option data. */
  layout: LayoutOption;
  /** Whether this card is currently selected. */
  isSelected: boolean;
  /** Called with the layout ID when the user clicks the card. */
  onSelect: (layoutId: string) => void;
  /** React children -- the ArchitecturalFloorPlan SVG is passed as a child. */
  children: React.ReactNode;
}


/* =============================================================================
   LayoutCard Component
   ============================================================================= */

export const LayoutCard: React.FC<LayoutCardProps> = ({
  layout,
  isSelected,
  onSelect,
  children,
}) => {
  const cardClass = [
    'configurator__layout-card',
    isSelected && 'configurator__layout-card--selected',
  ]
    .filter(Boolean)
    .join(' ');

  const badges = buildBadgeLabels(layout);

  const priceText =
    layout.priceDeltaCentsInclVat === 0
      ? 'Included'
      : `+${formatPriceCents(layout.priceDeltaCentsInclVat)}`;

  return (
    <button
      type="button"
      className={cardClass}
      onClick={() => onSelect(layout.id)}
      aria-pressed={isSelected}
      aria-label={`${layout.name} layout: ${priceText}${isSelected ? ' (selected)' : ''}`}
    >
      {/* Selection checkmark indicator (top-right corner) */}
      {isSelected && (
        <div className="configurator__layout-card-check">
          <CheckmarkIcon />
        </div>
      )}

      {/* Floor plan SVG preview */}
      <div className="configurator__layout-card-preview">
        {children}
      </div>

      {/* Layout name */}
      <div className="configurator__layout-card-name">
        {layout.name}
      </div>

      {/* Description */}
      <div className="configurator__layout-card-desc">
        {layout.description}
      </div>

      {/* Price line */}
      <div className="configurator__layout-card-price">
        {priceText}
      </div>

      {/* Feature badges */}
      <div className="configurator__layout-card-badges">
        {badges.map((label) => (
          <span key={label} className="configurator__layout-card-badge">
            {label}
          </span>
        ))}
      </div>
    </button>
  );
};
