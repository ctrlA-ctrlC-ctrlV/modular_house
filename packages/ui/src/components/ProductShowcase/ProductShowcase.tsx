/**
 * ProductShowcase Component
 * =============================================================================
 *
 * PURPOSE:
 * A 50/50 split section that presents the standardised garden room product line.
 * Left side: 1×4 product grid where each row shows dimensions and price over a
 * background image that fades out on both sides. Each row acts as a button that
 * smooth-scrolls to a target section.
 * Right side: features and warranty coverage list.
 *
 * ARCHITECTURE:
 * - Fully data-driven via props — no hard-coded product/feature content
 * - Uses semantic HTML (<button>) for the clickable product rows
 * - BEM CSS methodology via ProductShowcase.css
 * - Responsive: stacks vertically on mobile, side-by-side on desktop (≥992px)
 *
 * =============================================================================
 */

import React from 'react';
import './ProductShowcase.css';

/* =============================================================================
   TYPE DEFINITIONS
   ============================================================================= */

/** A single product in the 1×4 grid */
export interface ProductShowcaseProduct {
  /** Unique key */
  id: string;
  /** Numeric size, e.g. "15" */
  size: string;
  /** Unit label, e.g. "m²" */
  unit: string;
  /** Human-readable dimensions, e.g. "5.0m × 3.0m" */
  dimensions: string;
  /** Display price, e.g. "From €24,950" */
  price: string;
  /**
   * Optional pre-sale ("original") formatted price string, e.g. "€40,000".
   *
   * When provided together with a truthy `showOriginalPrice` flag on the
   * parent component, the row renders this value as a strikethrough above
   * the current `price`. When absent — or when `showOriginalPrice` is
   * false — the field is ignored and the row falls back to the standard
   * "Turnkey price from" label layout.
   */
  originalPrice?: string;
  /** Product name, e.g. "The Compact" */
  label: string;
  /** Whether the product is currently exempt from planning permission */
  permitFree: boolean;
  /** Background image src (PNG/JPG fallback) */
  imageSrc: string;
  /** Optional WebP source for the background image */
  imageWebP?: string;
  /** Optional AVIF source for the background image */
  imageAvif?: string;
  /** Alt text for the background image */
  imageAlt?: string;
}

/** A feature item for the right column */
export interface ProductShowcaseFeature {
  /** Small icon character (e.g. "◆") */
  icon: string;
  /** Feature heading */
  title: string;
  /** Feature description */
  desc: string;
}

/** A warranty item for the right column */
export interface ProductShowcaseWarranty {
  /** Number of years, e.g. "20" */
  years: string;
  /** Warranty name */
  label: string;
  /** Short clarification */
  sub: string;
}

/** Props for the ProductShowcase component */
export interface ProductShowcaseProps {
  /** Eyebrow text above the product grid */
  productEyebrow?: string;
  /** Array of products to display in the 1×4 grid */
  products: ProductShowcaseProduct[];
  /** ID of the element to scroll to when a product row is clicked (scroll mode) */
  scrollTargetId?: string;
  /** Legislation notice text (supports JSX) */
  legislationNote?: React.ReactNode;
  /** Eyebrow text above the features list */
  featuresEyebrow?: string;
  /** Array of features */
  features: ProductShowcaseFeature[];
  /** Eyebrow text above the warranties grid */
  warrantyEyebrow?: string;
  /** Array of warranties */
  warranties: ProductShowcaseWarranty[];
  /**
   * When true, product rows whose data carries a defined `originalPrice`
   * render it as a strikethrough above the current sale price, and the
   * "Turnkey price from" label is suppressed on those rows. When false
   * or omitted, `originalPrice` values are ignored and every row renders
   * the standard labelled single-price layout.
   *
   * Independent of any site-wide sale banner switch; callers may opt-in
   * per-page without enabling other campaign surfaces.
   *
   * @default false
   */
  showOriginalPrice?: boolean;
  /**
   * Callback invoked when a product row is clicked (modal mode).
   * When provided, clicking a row calls this callback instead of
   * smooth-scrolling to the scrollTargetId element.
   */
  onProductClick?: (product: ProductShowcaseProduct, index: number) => void;
}

/* =============================================================================
   COMPONENT
   ============================================================================= */

export function ProductShowcase({
  productEyebrow = 'Product Range',
  products,
  scrollTargetId = 'product-range',
  legislationNote,
  featuresEyebrow = 'Included as Standard',
  features,
  //warrantyEyebrow = 'Warranty Coverage',
  //warranties,
  showOriginalPrice = false,
  onProductClick,
}: ProductShowcaseProps): React.ReactElement {
  const scrollToTarget = (): void => {
    const el = document.getElementById(scrollTargetId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Handles a click on a product row.
   * - Modal mode (onProductClick provided): invokes the callback with the
   *   product data and its index so the parent can open a QuickViewModal.
   * - Scroll mode (default): smooth-scrolls to the scrollTargetId element.
   */
  const handleRowClick = (product: ProductShowcaseProduct, index: number): void => {
    if (onProductClick) {
      onProductClick(product, index);
    } else {
      scrollToTarget();
    }
  };

  const handleKeyDown = (product: ProductShowcaseProduct, index: number) =>
    (e: React.KeyboardEvent<HTMLButtonElement>): void => {
      if (e.key === ' ') {
        e.preventDefault();
        handleRowClick(product, index);
      }
    };

  return (
    <section className="product-showcase">
      <div className="product-showcase__grid">
        {/* ─── LEFT: Product Grid ──────────────────────────────────────── */}
        <div className="product-showcase__left">
          <h3 className="product-showcase__eyebrow">{productEyebrow}</h3>

          {products.map((p, index) => {
            /**
             * Derive the per-row sale-mode flag. A row is considered
             * "on sale" only when the parent has opted in *and* the row
             * data carries an `originalPrice`. Rows without an
             * original price transparently fall back to the standard
             * labelled single-price layout even when the flag is on.
             */
            const rowOnSale: boolean = showOriginalPrice && Boolean(p.originalPrice);

            return (
            <button
              key={p.id}
              type="button"
              className={`product-showcase__row${rowOnSale ? ' product-showcase__row--on-sale' : ''}`}
              onClick={() => handleRowClick(p, index)}
              onKeyDown={handleKeyDown(p, index)}
              aria-label={
                onProductClick
                  ? `${p.label} — ${p.size}${p.unit}, ${p.price}. Click to quick view.`
                  : `${p.label} — ${p.size}${p.unit}, ${p.price}. Click to view product range.`
              }
            >
              {/* Background image */}
              <div className="product-showcase__row-bg">
                <picture>
                  {p.imageAvif && (
                    <source srcSet={p.imageAvif} type="image/avif" />
                  )}
                  {p.imageWebP && (
                    <source srcSet={p.imageWebP} type="image/webp" />
                  )}
                  <img
                    src={p.imageSrc}
                    alt={p.imageAlt ?? `${p.label} garden room`}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              </div>

              {/* Left & right fade overlays */}
              <div className="product-showcase__fade-left" />
              <div className="product-showcase__fade-right" />

              {/* Left content: dimension */}
              <div className="product-showcase__dimension">
                <div className="product-showcase__size-row">
                  <span className="product-showcase__size">{p.size}</span>
                  <span className="product-showcase__unit">{p.unit}</span>
                </div>
                <span className="product-showcase__dimensions">
                  {p.dimensions}
                </span>
                {p.permitFree ? (
                  <span className="product-showcase__badge product-showcase__badge--permit-free">
                    No Planning Required
                  </span>
                ) : (
                  <span className="product-showcase__badge product-showcase__badge--permit-soon">
                    Permit-Free Soon
                  </span>
                )}
              </div>

              {/* Right content: price */}
              <div className="product-showcase__price-block">
                {rowOnSale ? (
                  // ------------------------------------------------------
                  // Sale-mode layout
                  // ------------------------------------------------------
                  // Renders the struck-through original amount above the
                  // emphasised sale price. Screen readers receive explicit
                  // "Original price:" / "Sale price:" prefixes via a
                  // visually-hidden span so the two values cannot be
                  // confused when announced.
                  <>
                    <span className="product-showcase__price-old">
                      <span className="product-showcase__sr-only">Original price: </span>
                      <s>{p.originalPrice}</s>
                    </span>
                    <span className="product-showcase__price">
                      <span className="product-showcase__sr-only">Sale price: </span>
                      {p.price}
                    </span>
                  </>
                ) : (
                  // ------------------------------------------------------
                  // Default layout
                  // ------------------------------------------------------
                  // The visible "Turnkey price from" label doubles as the
                  // screen-reader prefix, matching the treatment used on
                  // ProductRangeGrid for consistency across surfaces.
                  <>
                    <span className="product-showcase__price-label">Turnkey price from</span>
                    <span className="product-showcase__price">{p.price}</span>
                  </>
                )}
                <span className="product-showcase__label">{p.label}</span>
              </div>

              {/* Click hint */}
              <span className="product-showcase__click-hint">
                <u>For more details &#x25B8;</u>
              </span>

              {/* Bottom accent line */}
              <div className="product-showcase__row-accent" />
            </button>
            );
          })}

          {/* Legislation note */}
          {legislationNote && (
            <div className="product-showcase__legislation">
              {typeof legislationNote === 'string' ? (
                <p>{legislationNote}</p>
              ) : (
                legislationNote
              )}
            </div>
          )}
        </div>

        {/* ─── RIGHT: Features & Warranties ────────────────────────────── */}
        <div className="product-showcase__right">
          {/* Features */}
          <h4 className="product-showcase__eyebrow">{featuresEyebrow}</h4>

          <div className="product-showcase__feature-list">
            {features.map((f) => (
              <div key={f.title} className="product-showcase__feature">
                <span className="product-showcase__feature-icon" aria-hidden="true">{f.icon}</span>
                <div>
                  <span className="product-showcase__feature-title">
                    {f.title}
                  </span>
                  <span className="product-showcase__feature-desc">
                    {f.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Warranties 
          <div className="product-showcase__warranty-section">
            <h4 className="product-showcase__eyebrow">
              {warrantyEyebrow}
            </h4>

            <div className="product-showcase__warranty-grid">
              {warranties.map((w) => (
                <div key={w.label} className="product-showcase__warranty">
                  <div className="product-showcase__warranty-years-row">
                    <span className="product-showcase__warranty-years">
                      {w.years}
                    </span>
                    <span className="product-showcase__warranty-years-label">
                      Year
                    </span>
                  </div>
                  <span className="product-showcase__warranty-label">
                    {w.label}
                  </span>
                  <span className="product-showcase__warranty-sub">
                    {w.sub}
                  </span>
                </div>
              ))}
            </div>
          </div>*/}
        </div>
      </div>
    </section>
  );
}
