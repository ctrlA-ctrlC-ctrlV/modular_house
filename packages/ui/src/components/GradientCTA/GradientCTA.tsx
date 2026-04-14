/**
 * GradientCTA Component
 * =============================================================================
 *
 * PURPOSE:
 * A full-width, high-conversion call-to-action banner rendered on the brand
 * signature gradient (`--gradient-orange-brown`). Content is vertically stacked
 * and horizontally centered: a heading, supporting subtext, and a single
 * prominent white button. Designed as the closing section on marketing pages
 * (About, Garden Room, House Extension, Contact, Landing).
 *
 * USE CASES:
 * - Final CTA section on the About page: "Ready to Start Your Project?"
 * - Bottom-of-page CTA on every marketing page.
 * - Seasonal promotion banners or newsletter signup prompts.
 *
 * ARCHITECTURE:
 * - Follows BEM naming convention for CSS class generation.
 * - The CTA element renders as either an `<a>` (when `ctaHref` is provided)
 *   or a `<button type="button">` (when only `onCtaClick` is provided). The
 *   two forms are mutually exclusive to maintain correct HTML semantics.
 * - When `linkRenderer` is supplied alongside `ctaHref`, the renderer bridges
 *   the CTA anchor to an external router (e.g., React Router), keeping
 *   @modular-house/ui fully router-agnostic.
 * - Strictly typed with no "any" usage; all props have explicit interfaces.
 * - Follows the Open-Closed Principle: the public interface is stable and
 *   additive-only, while internal rendering logic is isolated from callers.
 *
 * ACCESSIBILITY:
 * - Root `<section>` carries an `aria-label` to guarantee clear landmark
 *   naming even though the heading provides a visual title.
 * - The CTA respects semantic HTML: `<a>` for navigation, `<button>` for
 *   in-page actions—never both simultaneously.
 * - Focus-visible ring matches the global pattern (2px solid #4f46e5).
 * - White heading and subtext text on the gradient background meet WCAG AA
 *   contrast requirements at every gradient stop.
 *
 * =============================================================================
 */

import React, { useId } from 'react';
import type { LinkRenderer } from '../../types';
import './GradientCTA.css';

/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Publicly exported types form the stable contract for this component.
   ============================================================================= */

/**
 * Props contract for the GradientCTA component.
 *
 * The CTA element can render in two forms depending on which props are set:
 *
 * 1. **Anchor form** — provide `ctaHref` (with optional `linkRenderer`).
 *    Suitable when the CTA navigates to another page or route.
 *
 * 2. **Button form** — provide `onCtaClick` without `ctaHref`.
 *    Suitable for in-page actions such as opening a modal.
 *
 * Supplying both `ctaHref` and `onCtaClick` is valid: the anchor form takes
 * precedence, and `onCtaClick` is ignored.
 */
export interface GradientCTAProps {
  /** Primary heading rendered as an `<h2>` element. */
  heading: string;

  /** Supporting subtext displayed below the heading. */
  subtext: string;

  /** Text label for the CTA button or anchor. */
  ctaLabel: string;

  /**
   * Optional href for the CTA. When supplied, the CTA renders as an `<a>`
   * element (or via `linkRenderer`). When omitted, the CTA renders as
   * a `<button>` and delegates to `onCtaClick`.
   */
  ctaHref?: string;

  /**
   * Click handler for the button form of the CTA.
   * Used only when `ctaHref` is absent. Uses the standard DOM
   * `React.MouseEvent<HTMLButtonElement>` for interoperability.
   */
  onCtaClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;

  /**
   * Optional renderer that bridges the CTA anchor to an external router
   * (e.g., React Router's `<Link>`). Receives href, children, className,
   * and forwards them to the router-aware element. Only used when `ctaHref`
   * is provided. Keeps @modular-house/ui router-agnostic.
   */
  linkRenderer?: LinkRenderer;

  /**
   * Accessible label for the `<section>` landmark.
   * @default 'Call to action'
   */
  ariaLabel?: string;

  /** Optional CSS class name appended to the root `<section>` element. */
  className?: string;

  /** Optional id attribute for anchor linking. */
  id?: string;
}

/* =============================================================================
   SECTION 2: INTERNAL HELPER — CTA ELEMENT RESOLVER
   -----------------------------------------------------------------------------
   Determines whether the CTA renders as an <a>, a router-wrapped <a>, or
   a <button>, based on the props provided by the consumer.
   ============================================================================= */

/**
 * Subset of GradientCTAProps required to resolve the CTA element form.
 */
interface CtaResolverInput {
  ctaLabel: string;
  ctaHref?: string;
  onCtaClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  linkRenderer?: LinkRenderer;
}

/**
 * resolveCtaElement
 *
 * Returns the appropriate React element for the CTA based on the combination
 * of props provided:
 *
 * - If `ctaHref` is provided with a `linkRenderer`, the renderer is invoked
 *   to produce a router-aware anchor element.
 * - If `ctaHref` is provided without a `linkRenderer`, a plain `<a>` is
 *   rendered.
 * - If `ctaHref` is absent, a `<button type="button">` is rendered with
 *   the `onCtaClick` handler.
 *
 * @param input - The subset of props needed for CTA resolution
 * @returns A React element representing the CTA
 */
const resolveCtaElement = ({
  ctaLabel,
  ctaHref,
  onCtaClick,
  linkRenderer,
}: CtaResolverInput): React.ReactNode => {
  /*
   * Anchor form: ctaHref is present.
   * Optionally delegates rendering to linkRenderer for router integration.
   */
  if (ctaHref) {
    if (linkRenderer) {
      return linkRenderer({
        href: ctaHref,
        className: 'gradient-cta__button',
        children: ctaLabel,
      });
    }

    return (
      <a className="gradient-cta__button" href={ctaHref}>
        {ctaLabel}
      </a>
    );
  }

  /*
   * Button form: no ctaHref, use onCtaClick.
   * type="button" prevents accidental form submission if the component
   * is placed inside a <form> ancestor.
   */
  return (
    <button
      type="button"
      className="gradient-cta__button"
      onClick={onCtaClick}
    >
      {ctaLabel}
    </button>
  );
};

/* =============================================================================
   SECTION 3: MAIN COMPONENT IMPLEMENTATION
   ============================================================================= */

/**
 * GradientCTA
 *
 * Renders a full-width CTA section with the brand signature gradient
 * background. Content is centered: heading, subtext, and a prominent
 * white CTA button that can render as either an anchor or button element.
 *
 * @param props - Configuration conforming to GradientCTAProps
 * @returns A `<section>` element containing the gradient CTA content
 */
export const GradientCTA: React.FC<GradientCTAProps> = ({
  heading,
  subtext,
  ctaLabel,
  ctaHref,
  onCtaClick,
  linkRenderer,
  ariaLabel = 'Call to action',
  className,
  id,
}) => {
  /**
   * Generate a stable, unique id for the heading element.
   * Used internally for potential aria-labelledby bindings in compound
   * layouts. If the consumer provides an explicit `id` prop, derive
   * the heading id from it.
   */
  const reactId = useId();
  const headingId = id ? `${id}-heading` : `gradient-cta-heading-${reactId}`;

  /**
   * Assemble the root element's CSS class list using BEM methodology:
   * - Block: `gradient-cta`
   * - Consumer-provided className appended last for override specificity.
   */
  const rootClassName = [
    'gradient-cta',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      className={rootClassName}
      id={id}
      aria-label={ariaLabel}
    >
      <div className="gradient-cta__inner">

        {/* Primary heading: rendered as <h2> in white over the gradient */}
        <h2 className="gradient-cta__heading" id={headingId}>
          {heading}
        </h2>

        {/* Supporting subtext: slightly transparent white for visual hierarchy */}
        <p className="gradient-cta__subtext">
          {subtext}
        </p>

        {/* CTA element: resolved as <a>, router-wrapped <a>, or <button> */}
        {resolveCtaElement({ ctaLabel, ctaHref, onCtaClick, linkRenderer })}

      </div>
    </section>
  );
};
