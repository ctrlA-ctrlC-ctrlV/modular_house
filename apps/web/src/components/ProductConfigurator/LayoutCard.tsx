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
  /**
   * Opt-in flag that enables the pre-sale / sale two-value price
   * presentation. When true and `originalPriceCents` is strictly greater
   * than the computed live price, the card renders the muted
   * strikethrough original beside the emphasised sale price and applies
   * the `--on-sale` modifier class. Defaults to `false` to preserve the
   * single-price presentation for non-promotional surfaces.
   *
   * @default false
   */
  showOriginalPrice?: boolean;
  /**
   * Pre-sale absolute price in euro cents (inclusive of VAT) for this
   * specific layout option. Resolved by the parent step either from the
   * product's layout-indexed map (`originalPriceCentsInclVatByLayoutId`)
   * or, as a fallback for single-layout products, from
   * `originalBasePriceCentsInclVat` plus the layout's delta. Left
   * `undefined` for products that carry no seeded original, in which
   * case the strikethrough branch naturally collapses back to the
   * default single-price layout.
   */
  originalPriceCents?: number;
  /**
   * Label rendered beside the struck-through original price in sale
   * mode. Propagated from `ProductConfiguratorPage` so copy remains
   * consistent with the sticky sub-header, Overview step hero block,
   * Floor Plan step price block, and Summary step breakdown.
   *
   * @default 'Original price'
   */
  originalPriceLabel?: string;
  /**
   * Label rendered beside the live sale price in sale mode. Shares the
   * same propagation path as `originalPriceLabel`.
   *
   * @default 'Sale price'
   */
  salePriceLabel?: string;
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
  showOriginalPrice = false,
  originalPriceCents,
  originalPriceLabel = 'Original price',
  salePriceLabel = 'Sale price',
}) => {
  /* Derive feature badge labels from the layout's boolean flags. */
  const badges = buildBadgeLabels(layout);

  /**
   * Compute the absolute price by adding the layout's price delta to the
   * product base price. This provides the customer with the total cost
   * for this configuration tier rather than a relative increment.
   */
  const absolutePriceCents = basePriceCents + layout.priceDeltaCentsInclVat;
  const priceText = formatPriceCents(absolutePriceCents);

  /**
   * Sale-mode guard. The strikethrough branch is only rendered when the
   * caller has explicitly opted in and a resolvable original is
   * available that is strictly greater than the live price. A
   * non-discounted or undefined original collapses the UI back to the
   * default single-price layout, preserving the contract with existing
   * non-promotional callers.
   */
  const isOnSale =
    showOriginalPrice &&
    originalPriceCents !== undefined &&
    originalPriceCents > absolutePriceCents;

  const originalPriceText = isOnSale
    ? formatPriceCents(originalPriceCents as number)
    : undefined;

  /* Compose the card's CSS class string with optional selected and
     sale-mode modifiers. The `--on-sale` hook allows downstream styling
     to reserve additional vertical space or adjust typography without
     mutating the default-state rules. */
  const cardClass = [
    'configurator__layout-card',
    isSelected && 'configurator__layout-card--selected',
    isOnSale && 'configurator__layout-card--on-sale',
  ]
    .filter(Boolean)
    .join(' ');

  /* Accessible label variant for sale mode: disambiguates the two
     monetary values for assistive technologies by prefixing each with
     a semantic role ("Original price" / "Sale price"). */
  const ariaLabel = isOnSale
    ? `${layout.name} layout: original price ${originalPriceText}, sale price ${priceText}${isSelected ? ' (selected)' : ''}`
    : `${layout.name} layout: ${priceText}${isSelected ? ' (selected)' : ''}`;

  return (
    <button
      type="button"
      className={cardClass}
      onClick={() => onSelect(layout.id)}
      aria-pressed={isSelected}
      aria-label={ariaLabel}
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

      {/*
        Absolute price display (base + layout delta, inclusive of VAT).
        In sale mode the block expands into a two-value group: a muted,
        struck-through pre-sale original rendered above (or beside) the
        emphasised live sale price. The visually-hidden spans provide
        screen-reader disambiguation between the two numeric values so
        the comparison remains intelligible without relying on the
        line-through presentation.
      */}
      {isOnSale ? (
        /*
          Two-row label-and-value presentation matching the sticky
          sub-header, Overview step hero block, and Summary breakdown.
          Row 1 renders the eyebrow "original price" label beside the
          muted struck-through pre-sale value; Row 2 renders the
          corresponding "sale price" label beside the emphasised live
          value. Labels are visible for sighted users and intentionally
          not duplicated as SR-only text because they already serve as
          the accessible prefix for each numeric value.
        */
        <div className="configurator__layout-card-price configurator__layout-card-price--on-sale">
          <div className="configurator__layout-card-price-row configurator__layout-card-price-row--original">
            <span className="configurator__layout-card-price-label">
              {originalPriceLabel}
            </span>
            <span className="configurator__layout-card-price-value configurator__layout-card-price-value--original">
              <s>{originalPriceText}</s>
            </span>
          </div>
          <div className="configurator__layout-card-price-row configurator__layout-card-price-row--sale">
            <span className="configurator__layout-card-price-label">
              {salePriceLabel}
            </span>
            <span className="configurator__layout-card-price-value configurator__layout-card-price-value--sale">
              {priceText}
            </span>
          </div>
        </div>
      ) : (
        <div className="configurator__layout-card-price">
          {priceText}
        </div>
      )}

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
