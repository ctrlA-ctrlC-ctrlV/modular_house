/**
 * FinishCard -- Selectable Finish Swatch
 * =============================================================================
 *
 * PURPOSE:
 * Renders a single selectable finish option as a card containing a colour
 * swatch circle and a label. Used within both the Exterior and Interior
 * finish steps of the configurator.
 *
 * DESIGN:
 * The swatch circle uses a radial gradient from the finish's primary colour
 * to its accent colour, creating a realistic material preview. When selected,
 * the card gains a dark border, elevated shadow, and the swatch receives a
 * prominent border ring.
 *
 * =============================================================================
 */

import React from 'react';
import type { FinishOption } from '../../types/configurator';


/* =============================================================================
   Component Props
   ============================================================================= */

interface FinishCardProps {
  /** The finish option data to render. */
  finish: FinishOption;
  /** Whether this finish is currently selected. */
  isSelected: boolean;
  /** Callback invoked when the user clicks this card. Receives the finish ID. */
  onSelect: (finishId: string) => void;
}


/* =============================================================================
   FinishCard Component
   ============================================================================= */

export const FinishCard: React.FC<FinishCardProps> = ({
  finish,
  isSelected,
  onSelect,
}) => {
  const cardClass = [
    'configurator__finish-card',
    isSelected && 'configurator__finish-card--selected',
  ]
    .filter(Boolean)
    .join(' ');

  const swatchClass = [
    'configurator__finish-swatch',
    isSelected && 'configurator__finish-swatch--selected',
  ]
    .filter(Boolean)
    .join(' ');

  const nameClass = [
    'configurator__finish-name',
    isSelected && 'configurator__finish-name--selected',
  ]
    .filter(Boolean)
    .join(' ');

  /**
   * Inline style for the swatch gradient. CSS custom properties cannot
   * express per-instance gradients, so this is applied as an inline style.
   */
  const swatchStyle: React.CSSProperties = {
    background: `radial-gradient(circle at 35% 35%, ${finish.color}, ${finish.accent})`,
  };

  return (
    <button
      type="button"
      className={cardClass}
      onClick={() => onSelect(finish.id)}
      aria-pressed={isSelected}
      aria-label={`${finish.name} finish${isSelected ? ' (selected)' : ''}`}
    >
      <div className={swatchClass} style={swatchStyle} />
      <span className={nameClass}>{finish.name}</span>
    </button>
  );
};
