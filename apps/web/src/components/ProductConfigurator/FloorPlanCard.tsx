/**
 * FloorPlanCard -- Selectable Floor Plan Variant Card
 * =============================================================================
 *
 * PURPOSE:
 * Renders a single selectable floor plan variant as a vertical card with
 * an architectural floor plan preview (passed as children), a dimension
 * label, and a short description. Used on the Floor Plan Selection step
 * for products that offer multiple footprint options.
 *
 * DESIGN:
 * The card uses a button element for keyboard accessibility. Selection
 * state is indicated by a border change and a checkmark icon in the
 * top-right corner. The component is stateless -- selection logic is
 * managed entirely by the parent through the onSelect callback.
 *
 * =============================================================================
 */

import React from 'react';
import type { FloorPlanVariant } from '../../types/configurator';


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

interface FloorPlanCardProps {
  /** The floor plan variant data. */
  variant: FloorPlanVariant;
  /** Whether this card is currently selected. */
  isSelected: boolean;
  /** Called with the variant ID when the user clicks the card. */
  onSelect: (variantId: string) => void;
  /** React children -- the ArchitecturalFloorPlan SVG is passed as a child. */
  children: React.ReactNode;
}


/* =============================================================================
   FloorPlanCard Component
   ============================================================================= */

export const FloorPlanCard: React.FC<FloorPlanCardProps> = ({
  variant,
  isSelected,
  onSelect,
  children,
}) => {
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
      {/* Selection checkmark indicator (top-right corner) */}
      {isSelected && (
        <div className="configurator__floor-plan-card-check">
          <CheckmarkIcon />
        </div>
      )}

      {/* Floor plan SVG preview */}
      <div className="configurator__floor-plan-card-preview">
        {children}
      </div>

      {/* Dimension label */}
      <div className="configurator__floor-plan-card-label">
        {variant.label}
      </div>

      {/* Description */}
      <div className="configurator__floor-plan-card-desc">
        {variant.description}
      </div>
    </button>
  );
};
