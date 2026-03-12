/**
 * StickySubHeader -- Apple-Style Product Price Header
 * =============================================================================
 *
 * PURPOSE:
 * Renders a sticky sub-header below the main site header, following the
 * "Apple product page" design pattern. Displays the product name on the
 * left and the running total price with a "(incl. VAT)" label on the right.
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
}


/* =============================================================================
   StickySubHeader Component
   ============================================================================= */

export const StickySubHeader: React.FC<StickySubHeaderProps> = ({
  productName,
  totalPriceCents,
}) => {
  return (
    <header className="configurator__sub-header">
      <span className="configurator__sub-header-name">
        {productName}
      </span>
      <div className="configurator__sub-header-price-group">
        <span className="configurator__sub-header-vat-label">
          (incl. VAT)
        </span>
        <span className="configurator__sub-header-price">
          {formatPriceCents(totalPriceCents)}
        </span>
      </div>
    </header>
  );
};
