/**
 * StickySubHeader -- Apple-Style Product Price Header
 * =============================================================================
 *
 * PURPOSE:
 * Renders a sticky sub-header below the main site header, following the
 * "Apple product page" design pattern. Displays the product name on the
 * left and the running total price on the right.
 *
 * PRICING DISPLAY MODES:
 * Two mutually exclusive render paths govern the price slot:
 *   1. Sale mode -- activated when `showOriginalPrice` is true *and* an
 *      `originalTotalPriceCents` value is supplied. The component renders
 *      a muted strikethrough of the pre-sale total immediately before
 *      the emphasised live total. The conventional "Turnkey price from"
 *      prefix is suppressed to keep the focus on the comparison.
 *   2. Default mode -- the standard single-price layout. The live total
 *      is preceded by the visible "Turnkey price from" label, which
 *      doubles as a screen-reader prefix.
 *
 * RESPONSIVE BEHAVIOUR:
 * - Desktop: Product name left-aligned, price right-aligned.
 * - Mobile (max-width: 768px): Both elements align right, controlled
 *   via CSS media queries in ProductConfigurator.css.
 *
 * =============================================================================
 */

import React from 'react';
import { formatPriceCents } from './utils';


/* =============================================================================
   Component Props
   ============================================================================= */

interface StickySubHeaderProps {
  /** Product marketing name displayed on the left (e.g., "The Studio"). */
  productName: string;
  /** Current total price in euro cents (inclusive of VAT). */
  totalPriceCents: number;
  /**
   * Optional pre-sale ("original") total price in euro cents inclusive of
   * VAT. Computed upstream with the same add-on / layout / floor-plan
   * deltas as the live total so the two values are comparable line-for-line.
   *
   * When supplied together with a truthy `showOriginalPrice` flag, the
   * value is rendered as a muted strikethrough sibling next to the live
   * total. An absent value (or a falsy flag) collapses the component to
   * the standard single-price layout regardless of the other input.
   */
  originalTotalPriceCents?: number;
  /**
   * When true, and `originalTotalPriceCents` is a defined number, the
   * header renders the sale-mode strikethrough layout. When false or
   * omitted, the standard "Turnkey price from" label is rendered
   * regardless of whether an `originalTotalPriceCents` value is present.
   *
   * Controlled independently of any site-wide promotional banner so
   * individual pages may opt in or out without coordinating state.
   *
   * @default false
   */
  showOriginalPrice?: boolean;
}


/* =============================================================================
   StickySubHeader Component
   ============================================================================= */

export const StickySubHeader: React.FC<StickySubHeaderProps> = ({
  productName,
  totalPriceCents,
  originalTotalPriceCents,
  showOriginalPrice = true,
}) => {
  /**
   * Resolve whether the sale-mode layout should be rendered.
   *
   * Both a truthy opt-in flag and a defined numeric original total are
   * required. Either missing piece collapses the component to the
   * default single-price presentation, ensuring the strikethrough never
   * renders without a value to strike through.
   */
  const isSaleMode: boolean = showOriginalPrice && originalTotalPriceCents !== undefined;

  return (
    <header className="configurator__sub-header">
      <span className="configurator__sub-header-name">
        {productName}
      </span>
      <div className="configurator__sub-header-price-group">
        {isSaleMode && originalTotalPriceCents !== undefined ? (
          // --------------------------------------------------------------
          // Sale-mode layout
          // --------------------------------------------------------------
          // Renders the struck-through original total beside the live
          // total. Visually-hidden prefixes disambiguate the two values
          // for assistive technologies without polluting the layout.
          <>
            <span className="configurator__sub-header-price-old">
              <span className="configurator__sub-header-sr-only">Original price: </span>
              <s>{formatPriceCents(originalTotalPriceCents)}</s>
            </span>
            <span className="configurator__sub-header-vat-label">
              (incl. VAT)
            </span>
            <span className="configurator__sub-header-price">
              <span className="configurator__sub-header-sr-only">Sale price: </span>
              {formatPriceCents(totalPriceCents)}
            </span>
          </>
        ) : (
          // --------------------------------------------------------------
          // Default layout
          // --------------------------------------------------------------
          // The visible "Turnkey price from" prefix doubles as the
          // screen-reader prefix for the live total, avoiding the need
          // for a second hidden announcement.
          <>
            <span className="configurator__sub-header-price-label">
              Turnkey price from
            </span>
            <span className="configurator__sub-header-vat-label">
              (incl. VAT)
            </span>
            <span className="configurator__sub-header-price">
              {formatPriceCents(totalPriceCents)}
            </span>
          </>
        )}
      </div>
    </header>
  );
};
