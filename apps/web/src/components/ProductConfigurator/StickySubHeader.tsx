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
 *      a two-row key/value block: the first row pairs the
 *      `originalPriceLabel` with the struck-through pre-sale total, and
 *      the second row pairs the `salePriceLabel` with the emphasised
 *      live total. Labels share a common left edge and values share a
 *      common position beside them for a balanced comparison.
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
import { formatPriceCents, isSaleModeActive } from './utils';


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
  /**
   * Label rendered beside the struck-through original total in sale mode.
   * Injected by the parent (typically derived from the promo config) so
   * marketing can vary the wording without modifying the component.
   *
   * @default 'Original price'
   */
  originalPriceLabel?: string;
  /**
   * Label rendered beside the live sale total in sale mode.
   *
   * @default 'Sale price'
   */
  salePriceLabel?: string;
}


/* =============================================================================
   StickySubHeader Component
   ============================================================================= */

export const StickySubHeader: React.FC<StickySubHeaderProps> = ({
  productName,
  totalPriceCents,
  originalTotalPriceCents,
  showOriginalPrice = false,
  originalPriceLabel = 'Original price',
  salePriceLabel = 'Sale price',
}) => {
  /**
   * Resolve whether the sale-mode layout should be rendered.
   *
   * Both a truthy opt-in flag and a defined numeric original total are
   * required. Either missing piece collapses the component to the
   * default single-price presentation, ensuring the strikethrough never
   * renders without a value to strike through.
   *
   * The shared `isSaleModeActive` helper (a TypeScript type-guard) is
   * used so the two-condition contract remains identical across every
   * configurator surface that renders sale prices.
   */
  const isSaleMode = isSaleModeActive(showOriginalPrice, originalTotalPriceCents);

  return (
    <header className="configurator__sub-header">
      <span className="configurator__sub-header-name">
        {productName}
      </span>
      <div
        className={
          'configurator__sub-header-price-group' +
          (isSaleMode ? ' configurator__sub-header-price-group--sale' : '')
        }
      >
        {/* Sale-mode branch: `isSaleMode` is a type-guarded boolean
            (see `isSaleModeActive`) so TypeScript narrows
            `originalTotalPriceCents` to `number` inside this block,
            removing the need for a redundant non-null assertion. */}
        {isSaleMode ? (
          // --------------------------------------------------------------
          // Sale-mode layout
          // --------------------------------------------------------------
          // Two stacked rows: the first pairs the customisable original
          // price label with the struck-through pre-sale total, the
          // second pairs the customisable sale price label with the
          // emphasised live total. Labels share a fixed minimum width
          // so the two rows align into a label-and-value column pair.
          <>
            <span className="configurator__sub-header-price-row configurator__sub-header-price-row--original">
              <span className="configurator__sub-header-price-row-label">
                {originalPriceLabel}
              </span>
              <span className="configurator__sub-header-price-old">
                <s>{formatPriceCents(originalTotalPriceCents)}</s>
              </span>
            </span>
            <span className="configurator__sub-header-price-row configurator__sub-header-price-row--sale">
              <span className="configurator__sub-header-price-row-label">
                {salePriceLabel}
              </span>
              <span className="configurator__sub-header-price">
                {formatPriceCents(totalPriceCents)}
              </span>
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
