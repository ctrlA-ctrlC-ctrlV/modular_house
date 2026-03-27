/**
 * GoBespokeBanner Component
 * =============================================================================
 *
 * PURPOSE:
 * A full-width call-to-action banner that encourages visitors to explore
 * bespoke (custom) garden room options beyond the standard product range.
 * Designed to sit between the product range grid and the construction
 * comparison section to capture intent from users whose needs are not met
 * by the four standard sizes.
 *
 * VISUAL DESIGN:
 * - Dark background (brand-dark) with a diagonal steel-line texture overlay
 *   achieved via a repeating-linear-gradient pseudo-element.
 * - Decorative corner brackets (top-right and bottom-left) rendered using
 *   border-based pseudo-elements that reinforce the precision engineering
 *   brand identity.
 * - Content follows a two-column grid: text content (eyebrow, heading,
 *   subtext) on the left and a prominent CTA button on the right.
 * - Responsive layout collapses to a single column and centred text on
 *   viewports narrower than 768px.
 *
 * ARCHITECTURE:
 * - All text content is configurable via props, making the component
 *   reusable across pages (e.g. House Extension, Garden Office).
 * - The CTA click handler is provided as an onCtaClick callback prop,
 *   keeping navigation or modal logic in the consuming component.
 * - Uses BEM naming conventions for CSS class names consistent with the
 *   rest of the @modular-house/ui component library.
 *
 * =============================================================================
 */

import React from 'react';
import './GoBespokeBanner.css';


/* =============================================================================
   Type Definitions
   ============================================================================= */

/**
 * Props for the GoBespokeBanner component.
 *
 * @property eyebrow         - Small uppercase label above the heading (e.g. "Bespoke Builds").
 * @property heading          - Primary heading text. Supports React nodes to allow inline
 *                              elements such as <em> or <br />.
 * @property subtext          - Supporting paragraph below the heading. Supports React nodes
 *                              to allow <strong> emphasis within the copy.
 * @property ctaLabel         - Text displayed inside the call-to-action button.
 * @property onCtaClick       - Callback fired when the CTA button is pressed.
 * @property ariaLabel        - Accessible label for the wrapping <section> element.
 * @property className        - Optional additional CSS class names appended to the root element.
 */
export interface GoBespokeBannerProps {
  eyebrow: string;
  heading: React.ReactNode;
  subtext: React.ReactNode;
  ctaLabel: string;
  onCtaClick: () => void;
  ariaLabel?: string;
  className?: string;
}


/* =============================================================================
   Inline Icon: Arrow
   =============================================================================
   A right-pointing arrow rendered as an inline SVG. Used within the CTA button
   to provide a directional affordance. Sized at 1em so it scales proportionally
   with the button text.
   ============================================================================= */
const ArrowIcon: React.FC = () => (
  <svg
    className="go-bespoke__cta-arrow"
    width="1em"
    height="1em"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="3" y1="8" x2="13" y2="8" />
    <polyline points="9 4 13 8 9 12" />
  </svg>
);


/* =============================================================================
   Main Component
   ============================================================================= */

export const GoBespokeBanner: React.FC<GoBespokeBannerProps> = ({
  eyebrow,
  heading,
  subtext,
  ctaLabel,
  onCtaClick,
  ariaLabel = 'Custom bespoke garden room enquiry',
  className = '',
}) => {
  return (
    <section
      className={`go-bespoke ${className}`.trim()}
      aria-label={ariaLabel}
    >
      {/* Decorative corner bracket — bottom-left (see CSS for styling) */}
      <div className="go-bespoke__deco" aria-hidden="true" />

      {/* Inner container: constrains content width and applies the grid layout */}
      <div className="go-bespoke__inner">

        {/* Left column: eyebrow, heading, and supporting subtext */}
        <div className="go-bespoke__content">
          <span className="go-bespoke__eyebrow">{eyebrow}</span>

          <h2 className="go-bespoke__heading">{heading}</h2>

          <p className="go-bespoke__subtext">{subtext}</p>
        </div>

        {/* Right column: call-to-action button with trailing arrow icon */}
        <button
          type="button"
          className="go-bespoke__cta"
          onClick={onCtaClick}
        >
          {ctaLabel}
          <ArrowIcon />
        </button>
      </div>
    </section>
  );
};

export default GoBespokeBanner;
