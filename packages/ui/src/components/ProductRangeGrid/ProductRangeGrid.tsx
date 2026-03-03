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
  /** Display size label, e.g., "15m2" */
  size: string;
  /** Product name, e.g., "Compact Studio" */
  name: string;
  /** Primary image path (PNG/JPEG fallback) */
  image: string;
  /** WebP optimised image variant for modern browsers */
  imageWebP?: string;
  /** AVIF optimised image variant for maximum compression */
  imageAvif?: string;
  /** List of typical use cases displayed as a bulleted list */
  useCases: string[];
  /** Planning permission status note displayed below use cases */
  planningNote: string;
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
  /** Product card data array driving the grid content */
  products: ProductCard[];
  /** Custom link renderer for SPA navigation (e.g., react-router-dom Link) */
  renderLink?: LinkRenderer;
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
  products,
  renderLink,
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
      </div>

      {/* ---------------------------------------------------------------
          GRID CONTAINER
          CSS Grid handles the responsive column layout (4 -> 2 -> 1
          columns at desktop -> tablet -> mobile breakpoints).
          --------------------------------------------------------------- */}
      <div className="product-range-grid__grid">
        {products.map((product, index) => (
          <ProductRangeCard
            key={`${product.size}-${index}`}
            product={product}
            renderLink={renderLink}
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
  /** Custom link renderer inherited from the parent grid */
  renderLink?: LinkRenderer;
}

/**
 * ProductRangeCard (internal)
 *
 * Renders a single product card as a semantic <article> element.
 * The card variant (available vs coming-soon) is determined by the
 * `product.available` flag, which controls CSS modifiers on the card,
 * image opacity, badge colour, and CTA button style.
 *
 * @param props - Card-level configuration
 * @returns JSX element representing one product card
 */
const ProductRangeCard: React.FC<ProductRangeCardInternalProps> = ({
  product,
  renderLink,
}) => {
  const {
    size,
    name,
    image,
    imageWebP,
    imageAvif,
    useCases,
    planningNote,
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
   * Assemble the CTA class name.
   * The --outline modifier switches from a filled button (brand colour
   * background) to an outline-style button (transparent background with
   * brand colour border and text).
   */
  const ctaClassName = `product-range-card__cta${!available ? ' product-range-card__cta--outline' : ''}`;

  /**
   * Descriptive alt text for the card image.
   * Includes the product size and name for screen reader context.
   */
  const imageAlt = `${size} ${name} garden room`;

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
          IMAGE WRAPPER
          Contains the OptimizedImage (with AVIF/WebP/fallback sources)
          and an optional overlay badge. The wrapper has position:relative
          so the badge can be absolutely positioned in the top-right corner.
          --------------------------------------------------------------- */}
      <div className="product-range-card__image-wrapper">
        <OptimizedImage
          src={image}
          alt={imageAlt}
          srcSetAvif={imageAvif}
          srcSetWebP={imageWebP}
          imgClassName="product-range-card__image"
          width={600}
          height={400}
        />

        {/* Badge overlay — only rendered when badge text is provided */}
        {badge && (
          <span className={`product-range-card__badge${getBadgeModifier(badge)}`}>
            {badge}
          </span>
        )}
      </div>

      {/* ---------------------------------------------------------------
          CARD BODY
          Contains the product details: size, name, use cases list,
          planning permission note, and the call-to-action link.
          The body has flex-grow so the CTA is pushed to the card bottom
          via margin-top:auto on the CTA element.
          --------------------------------------------------------------- */}
      <div className="product-range-card__body">
        <p className="product-range-card__size">{size}</p>
        <h3 className="product-range-card__name">{name}</h3>

        {/* Use cases rendered as an unordered list for semantic correctness */}
        <ul className="product-range-card__use-cases">
          {useCases.map((useCase, i) => (
            <li key={i}>{useCase}</li>
          ))}
        </ul>

        <p className="product-range-card__planning-note">{planningNote}</p>

        {/* CTA link — pushed to the bottom of the card by flex layout */}
        {ctaElement}
      </div>
    </article>
  );
};
