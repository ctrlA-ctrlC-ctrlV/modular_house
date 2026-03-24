/**
 * LayoutCard -- Selectable Interior Layout Option Card
 * =============================================================================
 *
 * PURPOSE:
 * Renders a single selectable layout option as a compact card displaying
 * the layout name, description, absolute price, and feature badges. Used
 * in the Layout Selection step alongside a central floor plan hero area
 * that mirrors the Exterior and Interior finish step pattern.
 *
 * DESIGN:
 * - The card is a <button> element for keyboard accessibility and
 *   focus management.
 * - Feature badges are derived from boolean flags on LayoutOption
 *   (includesBathroom, includesKitchen, includesBedroomWall). When
 *   no features are present, a single "Open Plan" badge is rendered.
 * - The displayed price is the absolute total price (base + layout
 *   delta) rather than a relative "+EUR X" delta, providing clearer
 *   cost visibility for the customer.
 * - The floor plan SVG preview has been moved out of the card and
 *   into the parent step's central hero area, making this card a
 *   compact selection control consistent with FinishCard.
 * - The component is stateless; selection logic is managed by the
 *   parent via the onSelect callback.
 *
 * =============================================================================
 */

import React from 'react';
import type { LayoutOption } from '../../types/configurator';
import { formatPriceCents } from './utils';


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
   Feature Badge Builder
   -----------------------------------------------------------------------------
   Inspects the boolean feature flags on a LayoutOption and returns an
   ordered array of human-readable badge labels. This drives the badge
   chips rendered at the bottom of each card.
   ============================================================================= */

/**
 * Derives the list of feature badge labels from the layout's boolean flags.
 * Returns ["Open Plan"] when no features are bundled, providing a meaningful
 * label for the base-tier layout.
 *
 * @param layout - The layout option to extract features from.
 * @returns An ordered read-only array of badge label strings.
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
  /** The layout option data object containing name, description, prices, and features. */
  layout: LayoutOption;
  /** Whether this card is the currently selected layout option. */
  isSelected: boolean;
  /** Callback invoked with the layout ID when the user clicks this card. */
  onSelect: (layoutId: string) => void;
  /**
   * The product base price in euro cents (inclusive of VAT). Combined with
   * the layout's priceDeltaCentsInclVat to compute the absolute display price.
   */
  basePriceCents: number;
}


/* =============================================================================
   LayoutCard Component
   -----------------------------------------------------------------------------
   Renders a compact, button-based card for a single layout option. The card
   displays the layout name, a brief description, the absolute price (base +
   delta), and feature badges. Visual selection state is indicated via a
   CSS modifier class and an accessible aria-pressed attribute.
   ============================================================================= */

export const LayoutCard: React.FC<LayoutCardProps> = ({
  layout,
  isSelected,
  onSelect,
  basePriceCents,
}) => {
  /* Compose the card's CSS class string with an optional selected modifier. */
  const cardClass = [
    'configurator__layout-card',
    isSelected && 'configurator__layout-card--selected',
  ]
    .filter(Boolean)
    .join(' ');

  /* Derive feature badge labels from the layout's boolean flags. */
  const badges = buildBadgeLabels(layout);

  /**
   * Compute the absolute price by adding the layout's price delta to the
   * product base price. This provides the customer with the total cost
   * for this configuration tier rather than a relative increment.
   */
  const absolutePriceCents = basePriceCents + layout.priceDeltaCentsInclVat;
  const priceText = formatPriceCents(absolutePriceCents);

  return (
    <button
      type="button"
      className={cardClass}
      onClick={() => onSelect(layout.id)}
      aria-pressed={isSelected}
      aria-label={`${layout.name} layout: ${priceText}${isSelected ? ' (selected)' : ''}`}
    >
      {/* Selection checkmark indicator positioned in the top-right corner */}
      {isSelected && (
        <div className="configurator__layout-card-check">
          <CheckmarkIcon />
        </div>
      )}

      {/* Layout name heading */}
      <div className="configurator__layout-card-name">
        {layout.name}
      </div>

      {/* Brief description of the layout arrangement */}
      <div className="configurator__layout-card-desc">
        {layout.description}
      </div>

      {/* Absolute price display (base + layout delta, inclusive of VAT) */}
      <div className="configurator__layout-card-price">
        {priceText}
      </div>

      {/* Feature badges indicating included amenities (bathroom, kitchen, etc.) */}
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
