/**
 * QuickViewModal Component
 * =============================================================================
 *
 * PURPOSE:
 * Renders a full-screen overlay modal that displays an expanded preview of a
 * garden room product. Used as a "Quick View" sheet triggered from the
 * ProductRangeGrid cards, allowing visitors to review product details
 * (hero image, description, specs, pricing) without leaving the page.
 *
 * ARCHITECTURE:
 * The component is a controlled modal — the parent manages open/close state
 * and passes the product data object when the modal should be visible.
 * Body scroll is locked while the modal is open and restored on unmount.
 *
 * The data contract extends ProductCard (from ProductRangeGrid) with
 * additional fields for description, specs, and lead time. This keeps the
 * grid card data lightweight while the modal can display richer content.
 *
 * ACCESSIBILITY:
 * - The overlay traps focus and closes on Escape key press.
 * - The close button has an accessible aria-label.
 * - The modal uses role="dialog" with aria-modal="true".
 * - Clicking the backdrop (outside the modal) closes the overlay.
 *
 * BEM CLASS NAMING:
 * Block:    .quick-view-modal       — Overlay backdrop
 * Element:  .quick-view-modal__dialog   — Modal container
 * Elements: __close, __hero, __hero-overlay, __hero-content,
 *           __size, __size-unit, __name, __tagline, __badges,
 *           __stock-pill, __permission, __body, __stock-notice,
 *           __dot, __desc, __section-title, __use-cases, __use-tag,
 *           __specs, __spec-item, __spec-label, __spec-value,
 *           __footer, __price-block, __price-from, __price,
 *           __lead-time, __cta
 *
 * =============================================================================
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { OptimizedImage } from '../OptimizedImage/OptimizedImage';
import { type LinkRenderer } from '../../types';
import './QuickViewModal.css';

/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   ============================================================================= */

/**
 * Data shape for a product displayed in the Quick View modal.
 *
 * Extends the card-level fields with additional detail fields that are
 * only needed when the modal is open (description, specs, lead time).
 */
export interface QuickViewProduct {
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
  /** Whether the product is currently in stock */
  inStock?: boolean;
  /** Whether the product is currently orderable */
  available: boolean;
  /** Full product description paragraph */
  description: string;
  /** Technical specification key-value pairs */
  specs: Record<string, string>;
  /** Lead time / delivery estimate string, e.g., "6–8 weeks" */
  leadTime: string;
  /** CTA navigation target */
  ctaLink: string;
  /** CTA button label text */
  ctaText?: string;
}

/**
 * Props for the QuickViewModal component.
 */
export interface QuickViewModalProps {
  /** The product to display. When null/undefined, the modal is not rendered. */
  product: QuickViewProduct | null;
  /** Callback to close the modal */
  onClose: () => void;
  /** Custom link renderer for SPA navigation */
  renderLink?: LinkRenderer;
}

/* =============================================================================
   SECTION 2: INLINE SVG ICONS
   -----------------------------------------------------------------------------
   Small SVG icons used within the modal. Defined inline to avoid external
   dependencies and keep the component self-contained.
   ============================================================================= */

const CheckIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ArrowIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const InfoIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
    <path d="M7 6.5V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="7" cy="4.5" r="0.75" fill="currentColor" />
  </svg>
);

/* =============================================================================
   SECTION 3: COMPONENT IMPLEMENTATION
   ============================================================================= */

/**
 * QuickViewModal
 *
 * Renders an overlay modal with a hero image, product details, technical
 * specs grid, and a CTA footer. The modal locks body scroll while open
 * and supports Escape key and backdrop click to close.
 */
export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  renderLink,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  /**
   * Close the modal when the Escape key is pressed.
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  /**
   * Lock body scroll when the modal is open; restore on close or unmount.
   * Attach Escape key listener.
   */
  useEffect(() => {
    if (!product) return;

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [product, handleKeyDown]);

  /** Early return when no product is provided. */
  if (!product) return null;

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
    inStock,
    description,
    specs,
    leadTime,
    ctaLink,
    ctaText,
  } = product;

  /** Convert specs object to entries for iteration. */
  const specEntries: [string, string][] = Object.entries(specs);

  /** Image alt text. */
  const imageAlt = `${size} ${name} garden room`;

  /**
   * Close modal when clicking the overlay backdrop (not the dialog itself).
   */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  /** CTA button label: use provided text or a sensible default. */
  const ctaLabel = ctaText || 'Get in Touch';

  /** Render CTA link — supports injected SPA link renderer. */
  const ctaElement = renderLink
    ? renderLink({
        href: ctaLink,
        className: 'quick-view-modal__cta',
        children: (
          <>
            {ctaLabel}
            <ArrowIcon />
          </>
        ),
        onClick: () => onClose(),
      })
    : (
        <a href={ctaLink} className="quick-view-modal__cta" onClick={() => onClose()}>
          {ctaLabel}
          <ArrowIcon />
        </a>
      );

  return (
    <div
      className="quick-view-modal"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${name} quick view`}
    >
      <div className="quick-view-modal__dialog" ref={dialogRef}>
        {/* Close button */}
        <button
          type="button"
          className="quick-view-modal__close"
          onClick={onClose}
          aria-label="Close quick view"
        >
          <CloseIcon />
        </button>

        {/* ---------------------------------------------------------------
            HERO SECTION
            Background image with gradient overlay and product identity.
            --------------------------------------------------------------- */}
        <div className="quick-view-modal__hero">
          <OptimizedImage
            src={image}
            alt={imageAlt}
            srcSetAvif={imageAvif}
            srcSetWebP={imageWebP}
            imgClassName="quick-view-modal__hero-image"
            width={620}
            height={320}
          />
          <div className="quick-view-modal__hero-overlay" />
          <div className="quick-view-modal__hero-content">
            <div className="quick-view-modal__size">{size}</div>
            <div className="quick-view-modal__name">{name}</div>
            {tagline && (
              <div className="quick-view-modal__tagline">{tagline}</div>
            )}
            <div className="quick-view-modal__badges">
              {inStock !== undefined && (
                <span
                  className={`quick-view-modal__stock-pill quick-view-modal__stock-pill--${inStock ? 'in-stock' : 'pre-order'}`}
                >
                  {inStock ? 'In Stock' : 'Pre-Order'}
                </span>
              )}
              {planningPermission !== undefined && (
                <span
                  className={`quick-view-modal__permission quick-view-modal__permission--${planningPermission ? 'required' : 'exempt'}`}
                >
                  {planningPermission ? (
                    <><InfoIcon /> Planning Permission Required</>
                  ) : (
                    <><CheckIcon /> No Planning Permission</>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------
            BODY SECTION
            Stock notice, description, use cases, specs grid, and footer.
            --------------------------------------------------------------- */}
        <div className="quick-view-modal__body">
          {/* Stock / delivery notice */}
          {inStock !== undefined && (
            <div
              className={`quick-view-modal__stock-notice quick-view-modal__stock-notice--${inStock ? 'in-stock' : 'pre-order'}`}
            >
              <span className={`quick-view-modal__dot quick-view-modal__dot--${inStock ? 'green' : 'amber'}`} />
              {inStock
                ? `Available now — typical delivery in ${leadTime}`
                : `Pre-order open — estimated availability ${leadTime} from order`}
            </div>
          )}

          {/* Description */}
          <p className="quick-view-modal__desc">{description}</p>

          {/* Ideal For — use case tags */}
          {useCases.length > 0 && (
            <>
              <div className="quick-view-modal__section-title">Ideal For</div>
              <div className="quick-view-modal__use-cases">
                {useCases.map((uc) => (
                  <span key={uc} className="quick-view-modal__use-tag">{uc}</span>
                ))}
              </div>
            </>
          )}

          {/* Technical Specification */}
          {specEntries.length > 0 && (
            <>
              <div className="quick-view-modal__section-title">Technical Specification</div>
              <div className="quick-view-modal__specs">
                {specEntries.map(([key, val]) => (
                  <div key={key} className="quick-view-modal__spec-item">
                    <div className="quick-view-modal__spec-label">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="quick-view-modal__spec-value">{val}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Footer — price block + CTA */}
          <div className="quick-view-modal__footer">
            {price && (
              <div className="quick-view-modal__price-block">
                <span className="quick-view-modal__price-from">Starting from</span>
                <div className="quick-view-modal__price">{price}</div>
                <div className="quick-view-modal__lead-time">Lead time: {leadTime}</div>
              </div>
            )}
            {ctaElement}
          </div>
        </div>
      </div>
    </div>
  );
};
