/**
 * ProductRangeGrid Component
 * =============================================================================
 *
 * PURPOSE:
 * Renders a responsive grid of product cards for the garden room range,
 * allowing visitors to browse available sizes and navigate to the contact
 * page with pre-populated product query parameters.
 *
 * ARCHITECTURE:
 * The component follows the Open-Closed Principle: the ProductCard interface
 * defines a stable data contract, and new product sizes can be added without
 * modifying the component logic. Visual variants (available vs coming-soon)
 * are driven entirely by data flags, not conditional component branches.
 *
 * The rendering pipeline is:
 *   ProductCard[] data -> map -> <article> cards -> CSS Grid layout
 *
 * ACCESSIBILITY:
 * - The outer <section> uses aria-labelledby to associate the heading.
 * - Each card is an <article> element for semantic grouping.
 * - Badge text is visible (no icon-only indicators).
 * - CTA links include descriptive text with the product size and name.
 * - Focus-visible outlines are applied via CSS on interactive elements.
 *
 * BEM CLASS NAMING:
 * Block:    .product-range-grid (section wrapper)
 * Block:    .product-range-card (individual card)
 * Modifier: .product-range-card--coming-soon (unavailable variant)
 * Elements follow the pattern: .product-range-card__element-name
 *
 * =============================================================================
 */

import React from 'react';
import { OptimizedImage } from '../OptimizedImage/OptimizedImage';
import { type LinkRenderer } from '../../types';
import './ProductRangeGrid.css';

/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Strictly typed interfaces with no implicit "any" types.
   Exported so that consuming modules can reference them for type-safe data
   construction without importing the component itself.
   ============================================================================= */

/**
 * Data shape for a single product card.
 *
 * Each field maps directly to a visual element within the card.
 * The `available` flag controls both the visual variant (solid vs dashed
 * border, full vs reduced image opacity) and the CTA style (filled vs outline).
 */
export interface ProductCard {
  /** Display size label, e.g., "15m²" */
  size: string;
  /** Product name, e.g., "Compact Studio" */
  name: string;
  /** Short tagline displayed below the name in the hero area */
  tagline?: string;
  /** Primary image path (PNG/JPEG fallback) */
  image: string;
  /** WebP optimised image variant for modern browsers */
  imageWebP?: string;
  /** AVIF optimised image variant for maximum compression */
  imageAvif?: string;
  /** List of typical use cases displayed as tag pills */
  useCases: string[];
  /** Formatted price string, e.g., "€26,000" */
  price?: string;
  /** Whether planning permission is required (true) or exempt (false) */
  planningPermission?: boolean;
  /** Planning permission status note (legacy — used when planningPermission is undefined) */
  planningNote?: string;
  /** Whether the product is currently in stock */
  inStock?: boolean;
  /** Optional badge text ("Most Popular", "Coming Soon") overlaid on the image */
  badge?: string;
  /** CTA button label text */
  ctaText: string;
  /** CTA navigation target, typically includes query parameters */
  ctaLink: string;
  /** Whether the product is currently orderable */
  available: boolean;
}

/**
 * Props for the ProductRangeGrid component.
 *
 * The `products` array is the only required prop; header text props are
 * optional to allow flexible reuse across different page contexts.
 */
export interface ProductRangeGridProps {
  /** Section eyebrow text rendered in uppercase above the title */
  eyebrow?: string;
  /** Section heading rendered as an h2 with serif typography */
  title?: string;
  /** Section description paragraph rendered below the title */
  description?: string;
  /**
   * Optional content rendered after the description and before the product grid.
   * Useful for inserting banners, notices, or supplementary information.
   */
  headerContent?: React.ReactNode;
  /** Product card data array driving the grid content */
  products: ProductCard[];
  /** Custom link renderer for SPA navigation (e.g., react-router-dom Link) */
  renderLink?: LinkRenderer;
  /** Callback invoked when the "Quick View" button is clicked. When provided, each card renders a secondary Quick View button alongside the primary CTA. */
  onQuickView?: (product: ProductCard, index: number) => void;
}

/* =============================================================================
   SECTION 2: HELPER FUNCTIONS
   ============================================================================= */

/**
 * Derives the BEM modifier class for a badge based on its text content.
 *
 * The mapping uses lowercase comparison to handle case variations gracefully.
 * Returns an empty string when no modifier applies, which is safe to
 * concatenate into a className without producing invalid whitespace.
 *
 * @param badge - The badge text from the product card data
 * @returns A BEM modifier class string, or an empty string
 */
function getBadgeModifier(badge: string): string {
  const normalised = badge.toLowerCase();
  if (normalised === 'most popular') return ' product-range-card__badge--popular';
  if (normalised === 'coming soon') return ' product-range-card__badge--coming-soon';
  return '';
}

/* =============================================================================
   SECTION 3: COMPONENT IMPLEMENTATION
   ============================================================================= */

/**
 * ProductRangeGrid
 *
 * Renders a titled section containing a responsive CSS Grid of product cards.
 * Each card displays an image, size/name, use cases, planning note, and a
 * CTA link. The component delegates link rendering to the `renderLink` prop
 * for SPA-compatible navigation, falling back to a standard <a> element.
 *
 * @param props - Component configuration conforming to ProductRangeGridProps
 * @returns JSX element representing the product range section
 */
export const ProductRangeGrid: React.FC<ProductRangeGridProps> = ({
  eyebrow,
  title,
  description,
  headerContent,
  products,
  renderLink,
  onQuickView,
}) => {
  /**
   * Stable identifier for the heading element, used by aria-labelledby
   * on the <section> to establish an accessible name association.
   */
  const titleId = 'product-range-title';

  return (
    <section className="product-range-grid" aria-labelledby={titleId}>
      {/* ---------------------------------------------------------------
          HEADER BLOCK
          Renders the eyebrow label, heading, and description paragraph.
          All three are optional; the header div is always present for
          consistent vertical spacing via CSS.
          --------------------------------------------------------------- */}
      <div className="product-range-grid__header">
        {eyebrow && (
          <p className="product-range-grid__eyebrow">{eyebrow}</p>
        )}
        {title && (
          <h2 id={titleId} className="product-range-grid__title">{title}</h2>
        )}
        {description && (
          <p className="product-range-grid__description">{description}</p>
        )}
        {headerContent && (
          <div className="product-range-grid__header-content">
            {headerContent}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------
          GRID CONTAINER
          CSS Grid handles the responsive column layout (2 -> 1
          columns at desktop -> mobile breakpoints).
          --------------------------------------------------------------- */}
      <div className="product-range-grid__grid">
        {products.map((product, index) => (
          <ProductRangeCard
            key={`${product.size}-${index}`}
            product={product}
            index={index}
            renderLink={renderLink}
            onQuickView={onQuickView}
          />
        ))}
      </div>
    </section>
  );
};

/* =============================================================================
   SECTION 4: CARD SUB-COMPONENT
   -----------------------------------------------------------------------------
   Extracted as a private sub-component for readability. Not exported because
   consumers interact only with the ProductRangeGrid + ProductCard data shape.
   ============================================================================= */

/**
 * Internal props for the card sub-component.
 */
interface ProductRangeCardInternalProps {
  /** The product data to render */
  product: ProductCard;
  /** Index of this card in the grid (passed to onQuickView) */
  index: number;
  /** Custom link renderer inherited from the parent grid */
  renderLink?: LinkRenderer;
  /** Quick View callback inherited from the parent grid */
  onQuickView?: (product: ProductCard, index: number) => void;
}

/**
 * ProductRangeCard (internal)
 *
 * Renders a single product card as a semantic <article> element with a
 * hero image section (gradient overlay, stock pill, size badge, name,
 * tagline) and a body section (use-case tags, price + permission meta
 * row, action buttons).
 *
 * @param props - Card-level configuration
 * @returns JSX element representing one product card
 */
const ProductRangeCard: React.FC<ProductRangeCardInternalProps> = ({
  product,
  index,
  renderLink,
  onQuickView,
}) => {
  const {
    size,
    name,
    tagline,
    image,
    imageWebP,
    imageAvif,
    useCases,
    price,
    planningPermission,
    planningNote,
    inStock,
    badge,
    ctaText,
    ctaLink,
    available,
  } = product;

  /**
   * Assemble the card's root class name.
   * The --coming-soon modifier controls dashed borders, reduced image
   * opacity, and muted badge colour via CSS.
   */
  const cardClassName = `product-range-card${!available ? ' product-range-card--coming-soon' : ''}`;

  /**
   * Descriptive alt text for the card image.
   * Includes the product size and name for screen reader context.
   */
  const imageAlt = `${size} ${name} garden room`;

  /**
   * CTA class name depends on whether Quick View button is present.
   * With Quick View: primary-style button (shares row).
   * Without Quick View: full-width button.
   */
  const ctaClassName = onQuickView
    ? 'product-range-card__btn product-range-card__btn--primary'
    : `product-range-card__cta${!available ? ' product-range-card__cta--outline' : ''}`;

  /**
   * Render the CTA link.
   * Uses the injected renderLink function for SPA navigation when
   * available, otherwise falls back to a standard anchor element.
   */
  const ctaElement = renderLink
    ? renderLink({
        href: ctaLink,
        className: ctaClassName,
        children: ctaText,
      })
    : (
        <a href={ctaLink} className={ctaClassName}>
          {ctaText}
        </a>
      );

  return (
    <article className={cardClassName}>
      {/* ---------------------------------------------------------------
          HERO IMAGE SECTION
          Contains the product image with a gradient overlay, stock pill
          badge, and overlaid text content (size badge, name, tagline).
          --------------------------------------------------------------- */}
      <div className="product-range-card__top">
        <OptimizedImage
          src={image}
          alt={imageAlt}
          srcSetAvif={imageAvif}
          srcSetWebP={imageWebP}
          imgClassName="product-range-card__image"
          width={600}
          height={400}
        />
        <div className="product-range-card__overlay" />

        {/* Stock pill — absolute positioned top-right of the image */}
        {inStock !== undefined && (
          <span
            className={`product-range-card__stock-pill product-range-card__stock-pill--${inStock ? 'in-stock' : 'pre-order'}`}
          >
            {inStock ? 'In Stock' : 'Pre-Order'}
          </span>
        )}

        {/* Badge overlay — rendered when badge text is provided */}
        {badge && (
          <span className={`product-range-card__badge${getBadgeModifier(badge)}`}>
            {badge}
          </span>
        )}

        {/* Content overlaid on the hero image */}
        <div className="product-range-card__top-content">
          <div className="product-range-card__size-badge">{size}</div>
          <h3 className="product-range-card__name">{name}</h3>
          {tagline && (
            <p className="product-range-card__tagline">{tagline}</p>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------
          CARD BODY
          Contains use-case tag pills, price + permission meta row,
          and the call-to-action button(s). The body uses flex layout
          so the actions are pushed to the card bottom.
          --------------------------------------------------------------- */}
      <div className="product-range-card__body">
        {/* Use cases rendered as tag pills */}
        <ul className="product-range-card__use-cases">
          {useCases.map((useCase, i) => (
            <li key={i} className="product-range-card__use-tag">{useCase}</li>
          ))}
        </ul>

        {/* Meta row — price and planning permission badge */}
        {(price || planningPermission !== undefined || planningNote) && (
          <div className="product-range-card__meta">
            <div className="product-range-card__meta-row">
              {price && (
                <div className="product-range-card__price-block">
                  <span className="product-range-card__price-from">Starting from</span>
                  <span className="product-range-card__price">{price}</span>
                </div>
              )}
              {planningPermission !== undefined ? (
                <span
                  className={`product-range-card__permission product-range-card__permission--${planningPermission ? 'required' : 'exempt'}`}
                >
                  {planningPermission ? 'Planning Required' : 'Exempt'}
                </span>
              ) : planningNote ? (
                <p className="product-range-card__planning-note">{planningNote}</p>
              ) : null}
            </div>
          </div>
        )}

        {/* Action buttons — pushed to the bottom of the card by flex layout */}
        <div className="product-range-card__actions">
          {onQuickView && (
            <button
              type="button"
              className="product-range-card__btn product-range-card__btn--secondary"
              onClick={() => onQuickView(product, index)}
            >
              Quick View
            </button>
          )}
          {ctaElement}
        </div>
      </div>
    </article>
  );
};
