/**
 * FloorPlanCard -- Selectable Floor Plan Variant Card
 * =============================================================================
 *
 * PURPOSE:
 * Renders a single selectable floor plan variant as a compact card
 * displaying the dimension label and a short description. Used on the
 * Floor Plan Selection step alongside a central hero area that shows
 * the architectural floor plan SVG for the currently selected variant.
 *
 * DESIGN:
 * - The card is a <button> element for keyboard accessibility and
 *   focus management.
 * - The floor plan SVG preview has been moved out of the card and
 *   into the parent step's central hero area, making this card a
 *   compact selection control consistent with FinishCard and
 *   LayoutCard.
 * - Selection state is indicated by a CSS modifier class and a
 *   checkmark icon, with an accessible aria-pressed attribute.
 * - The component is stateless; selection logic is managed by the
 *   parent via the onSelect callback.
 *
 * =============================================================================
 */

import React from 'react';
import type { FloorPlanVariant } from '../../types/configurator';


/* =============================================================================
   Checkmark Icon
   -----------------------------------------------------------------------------
   Small SVG tick mark rendered inside the selected state indicator circle.
   Uses a single polyline path for minimal DOM overhead.
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

interface FloorPlanCardProps {
  /** The floor plan variant data object containing label, description, and dimensions. */
  variant: FloorPlanVariant;
  /** Whether this card is the currently selected floor plan variant. */
  isSelected: boolean;
  /** Callback invoked with the variant ID when the user clicks this card. */
  onSelect: (variantId: string) => void;
}


/* =============================================================================
   FloorPlanCard Component
   -----------------------------------------------------------------------------
   Renders a compact, button-based card for a single floor plan variant.
   The card displays the dimension label (e.g., "5.0m x 5.0m") and a
   brief description (e.g., "Square footprint"). Visual selection state
   is indicated via a CSS modifier class and an accessible aria-pressed
   attribute.
   ============================================================================= */

export const FloorPlanCard: React.FC<FloorPlanCardProps> = ({
  variant,
  isSelected,
  onSelect,
}) => {
  /* Compose the card's CSS class string with an optional selected modifier. */
  const cardClass = [
    'configurator__floor-plan-card',
    isSelected && 'configurator__floor-plan-card--selected',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={cardClass}
      onClick={() => onSelect(variant.id)}
      aria-pressed={isSelected}
      aria-label={`${variant.label}: ${variant.description}${isSelected ? ' (selected)' : ''}`}
    >
      {/* Selection checkmark indicator positioned in the top-right corner */}
      {isSelected && (
        <div className="configurator__floor-plan-card-check">
          <CheckmarkIcon />
        </div>
      )}

      {/* Dimension label (e.g., "5.0m x 5.0m") */}
      <div className="configurator__floor-plan-card-label">
        {variant.label}
      </div>

      {/* Brief description of the footprint shape */}
      <div className="configurator__floor-plan-card-desc">
        {variant.description}
      </div>
    </button>
  );
};
