/**
 * FeatureShowcase Component
 * =============================================================================
 *
 * PURPOSE:
 * A versatile two-column layout section that pairs an image with a structured
 * list of icon-driven feature items. Designed to serve as the primary persuasive
 * content block on service pages (e.g. "Quality & Trust", "Transparent Pricing")
 * within the Modular House website.
 *
 * VISUAL DESIGN:
 * The component splits into two equally-weighted columns on desktop (>= 1024px):
 *   - Text column: eyebrow label, serif heading, lead paragraph, and an icon-led
 *     feature list using Material Symbols.
 *   - Image column: a portrait-aspect (4:5) optimised image with an optional
 *     floating stat badge positioned at the bottom-left corner.
 *
 * The layout direction is reversible via the `reversed` prop, enabling
 * alternating left/right image placements when two instances are stacked on
 * the same page. On mobile, both layouts collapse to a single column with
 * the text column always appearing first to maintain content-priority reading
 * order.
 *
 * ARCHITECTURE:
 * - Pure presentational component with no internal state.
 * - Strictly typed props interface (no "any" types) following the component
 *   contract defined in specs/010-house-extensions-redesign/contracts/.
 * - Uses BEM naming conventions consistent with the @modular-house/ui library.
 * - Delegates image rendering to the shared OptimizedImage component for
 *   format negotiation (AVIF/WebP/fallback).
 * - Follows the Open-Closed Principle: extensible via className, renderLink,
 *   iconVariant, and backgroundColor props without source modification.
 * - Uses standard DOM events for interoperability (onClick via LinkRenderer).
 *
 * ACCESSIBILITY:
 * - The feature list uses semantic <ul>/<li> with explicit role="list" to
 *   ensure assistive technology correctly announces the list structure.
 * - Material Symbol icon spans include aria-hidden="true" to prevent screen
 *   readers from announcing icon ligature text.
 * - The badge overlay is presentational and excluded from the accessibility
 *   tree via aria-hidden="true".
 * - Section heading is <h2>, consistent with the page hierarchy (<h1> in hero,
 *   <h2> per section). Feature titles use <h4>.
 *
 * =============================================================================
 */

import React from 'react';
import { OptimizedImage } from '../OptimizedImage/OptimizedImage';
import type { LinkRenderer } from '../../types';
import './FeatureShowcase.css';


/* =============================================================================
   Type Definitions
   ============================================================================= */

/**
 * Represents a single feature entry within the showcase feature list.
 *
 * @property icon        - Material Symbols icon name (e.g. "thermostat", "verified").
 * @property title       - Short heading text describing the feature.
 * @property description - Explanatory paragraph expanding on the feature.
 */
export interface FeatureShowcaseItem {
  icon: string;
  title: string;
  description: string;
}

/**
 * Represents the optional floating stat badge overlaid on the image corner.
 *
 * @property value - Large display value (e.g. "100%").
 * @property label - Small uppercase label below the value (e.g. "STEEL FRAME").
 */
export interface FeatureShowcaseBadge {
  value: string;
  label: string;
}

/**
 * Allowed background colour variants for the root section element.
 * Each variant maps to a BEM modifier class that applies the corresponding
 * brand design token.
 */
export type FeatureShowcaseBg = 'white' | 'beige' | 'gray';

/**
 * Props for the FeatureShowcase component.
 *
 * @property eyebrow         - Uppercase eyebrow label above the heading.
 * @property title           - Section heading (h2). Supports JSX for line breaks.
 * @property description     - Lead paragraph below the heading.
 * @property features        - Array of icon + title + description feature items.
 * @property imageSrc        - Image URL (PNG/JPEG fallback).
 * @property imageWebP       - Optional WebP variant of the image.
 * @property imageAvif       - Optional AVIF variant of the image.
 * @property imageAlt        - Descriptive alt text for the image.
 * @property badge           - Optional floating stat badge overlaid on the image corner.
 * @property reversed        - When true, image renders on the left and text on the right.
 * @property backgroundColor - Section background colour variant (default: 'white').
 * @property iconVariant     - Icon container style: 'filled' or 'outlined' (default: 'filled').
 * @property renderLink      - Custom link renderer for React Router integration.
 * @property className       - Optional CSS class for the root <section> element.
 */
export interface FeatureShowcaseProps {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  features: FeatureShowcaseItem[];
  imageSrc: string;
  imageWebP?: string;
  imageAvif?: string;
  imageAlt: string;
  badge?: FeatureShowcaseBadge;
  reversed?: boolean;
  backgroundColor?: FeatureShowcaseBg;
  iconVariant?: 'filled' | 'outlined';
  renderLink?: LinkRenderer;
  className?: string;
}


/* =============================================================================
   Main Component
   ============================================================================= */

/**
 * FeatureShowcase renders a two-column layout combining a text column with an
 * icon-led feature list and an image column with an optional stat badge.
 *
 * The component is stateless and receives all content through strictly-typed
 * props, making it reusable across any page that requires a persuasive
 * feature/benefit section with alternating layout support.
 */
export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({
  eyebrow,
  title,
  description,
  features,
  imageSrc,
  imageWebP,
  imageAvif,
  imageAlt,
  badge,
  reversed = false,
  backgroundColor = 'white',
  iconVariant = 'filled',
  className = '',
}) => {

  /* ---------------------------------------------------------------------------
     Root class assembly
     ---------------------------------------------------------------------------
     Combines the BEM block class with optional modifier classes for layout
     direction and background variant. The consumer-provided className is
     appended last to allow overrides via CSS specificity.
     --------------------------------------------------------------------------- */
  const rootClasses = [
    'feature-showcase',
    `feature-showcase--bg-${backgroundColor}`,
    reversed ? 'feature-showcase--reversed' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');


  /* ---------------------------------------------------------------------------
     Text Column
     ---------------------------------------------------------------------------
     Builds the content side of the two-column layout: eyebrow label, heading,
     lead paragraph, and the feature list. This is extracted as a JSX block
     for clarity; it always renders as the first column in reading order on
     mobile regardless of the reversed prop.
     --------------------------------------------------------------------------- */
  const textColumn = (
    <div className="feature-showcase__text-col">

      {/* Eyebrow — uppercase label in brand accent colour */}
      <span className="feature-showcase__eyebrow">{eyebrow}</span>

      {/* Section heading — accepts ReactNode to support JSX (e.g. <br />) */}
      <h2 className="feature-showcase__title">{title}</h2>

      {/* Lead paragraph — provides context before the feature list */}
      <p className="feature-showcase__description">{description}</p>

      {/* Feature list — semantic list of icon + title + description items */}
      <ul className="feature-showcase__feature-list" role="list">
        {features.map((feature, index) => (
          <li key={index} className="feature-showcase__feature-item">

            {/* Icon container — visual style determined by iconVariant prop */}
            <div
              className={`feature-showcase__feature-icon feature-showcase__feature-icon--${iconVariant}`}
            >
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
              >
                {feature.icon}
              </span>
            </div>

            {/* Text group — feature title and description */}
            <div className="feature-showcase__feature-text">
              <h4 className="feature-showcase__feature-title">
                {feature.title}
              </h4>
              <p className="feature-showcase__feature-desc">
                {feature.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );


  /* ---------------------------------------------------------------------------
     Image Column
     ---------------------------------------------------------------------------
     Renders the image side of the layout with a portrait-aspect OptimizedImage
     and an optional floating stat badge. The badge is hidden on mobile via CSS
     and excluded from the accessibility tree.
     --------------------------------------------------------------------------- */
  const imageColumn = (
    <div className="feature-showcase__image-col">
      <div className="feature-showcase__image-wrapper">

        {/* Optimised image — delegates AVIF/WebP/fallback negotiation to OptimizedImage */}
        <OptimizedImage
          src={imageSrc}
          srcSetAvif={imageAvif}
          srcSetWebP={imageWebP}
          alt={imageAlt}
          className="feature-showcase__image"
          imgClassName="feature-showcase__image-img"
        />

        {/* Badge — optional floating stat overlay, rendered only when provided */}
        {badge && (
          <div className="feature-showcase__badge" aria-hidden="true">
            <div className="feature-showcase__badge-value">{badge.value}</div>
            <div className="feature-showcase__badge-label">{badge.label}</div>
          </div>
        )}
      </div>
    </div>
  );


  /* ---------------------------------------------------------------------------
     Render
     ---------------------------------------------------------------------------
     The root <section> element wraps a max-width container holding both
     columns. Column ordering is handled entirely via CSS using the BEM
     --reversed modifier on the grid container, keeping the JSX source order
     consistent (text first, image second) for content-priority reading.
     --------------------------------------------------------------------------- */
  return (
    <section className={rootClasses}>
      <div className="feature-showcase__container">
        {textColumn}
        {imageColumn}
      </div>
    </section>
  );
};
