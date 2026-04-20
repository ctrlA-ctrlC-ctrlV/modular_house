/**
 * FooterCTA Component
 * =============================================================================
 *
 * PURPOSE:
 * A full-width dark call-to-action section placed at the bottom of marketing
 * pages, immediately above the site footer. Displays a centred heading,
 * supporting subtitle, and one or two action buttons (primary + ghost).
 * Designed as the page's closing conversion point, encouraging visitors
 * to request a quote or initiate a phone call.
 *
 * USE CASES:
 * - Final CTA on the House Extension page: "Ready to Extend Your Home?"
 * - Bottom-of-page CTA on Garden Room, About, Process, and Materials pages.
 * - Any page requiring a dark-background conversion strip with dual actions.
 *
 * ARCHITECTURE:
 * - Follows BEM naming convention (`.footer-cta`, `.footer-cta__*`).
 * - Always renders on `--brand-bg-dark` (#1A1714); the dark visual identity
 *   is integral to the component and is not configurable.
 * - Uses an internal `LinkItem` helper to bridge between plain `<a>` anchors
 *   and router-aware link renderers, keeping @modular-house/ui fully
 *   router-agnostic. This pattern is consistent with `HeroBoldBottomText`
 *   and `HeroWithSideText`.
 * - Strictly typed with exported interfaces; no `any` usage.
 * - Follows the Open-Closed Principle: the public interface is stable and
 *   additive-only; internal rendering logic is encapsulated.
 *
 * ACCESSIBILITY:
 * - Root `<section>` carries a computed `aria-labelledby` pointing at the
 *   heading `<h2>` for clear landmark naming.
 * - All anchor elements use visible text labels; no icon-only buttons.
 * - Focus-visible ring follows the global pattern (2px solid indigo).
 * - White text on the dark background meets WCAG AA contrast requirements.
 * - When `actions` is empty, the actions row is hidden from the DOM to
 *   avoid an empty landmark for assistive technologies.
 *
 * =============================================================================
 */

import React, { useId } from 'react';
import type { LinkRenderer } from '../../types';
import './FooterCTA.css';

/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Publicly exported types form the stable contract for this component.
   ============================================================================= */

/**
 * Describes a single action button within the FooterCTA.
 *
 * Each action renders as an anchor-style element (either a plain `<a>` or
 * a router-aware link via `renderLink`). The `variant` prop controls the
 * visual treatment:
 * - `'primary'` — solid brand-accent background.
 * - `'ghost'`   — transparent with a subtle border.
 */
export interface FooterCTAAction {
  /** Button display text. */
  label: string;

  /** Navigation target URL or `tel:` link. */
  href: string;

  /** Visual style: `'primary'` = solid brand button, `'ghost'` = transparent border button. */
  variant: 'primary' | 'ghost';

  /** Optional click handler executed in addition to navigation. */
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Props contract for the FooterCTA component.
 *
 * At minimum, `title` and `subtitle` are required. The `actions` array
 * accepts one or two action objects; when empty, only the heading and
 * subtitle are rendered (useful for informational banners without CTAs).
 */
export interface FooterCTAProps {
  /** Main heading displayed in large display/serif font. */
  title: string;

  /** Supporting paragraph rendered below the heading. */
  subtitle: string;

  /** One or two action buttons. Renders inline on desktop, stacked on mobile. */
  actions: FooterCTAAction[];

  /** Custom link renderer for React Router integration. */
  renderLink?: LinkRenderer;

  /** Optional CSS class appended to the root `<section>` element. */
  className?: string;
}

/* =============================================================================
   SECTION 2: INTERNAL HELPER -- LINK ITEM
   -----------------------------------------------------------------------------
   Private component that resolves each action link to either a router-aware
   element (via `renderLink`) or a standard `<a>` anchor. This bridge keeps
   the component fully router-agnostic while supporting SPA navigation.
   ============================================================================= */

/**
 * Props for the internal LinkItem helper.
 * Not exported; used only within FooterCTA.
 */
interface LinkItemProps {
  /** Target URL for the link. */
  href: string;

  /** CSS class name(s) applied to the rendered element. */
  className?: string;

  /** Optional click handler forwarded to the anchor element. */
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;

  /** Optional external link renderer for router integration. */
  renderLink?: LinkRenderer;

  /** Child content rendered inside the link element. */
  children: React.ReactNode;
}

/**
 * Renders a link element using either the injected `renderLink` function
 * (for SPA router integration) or a standard `<a>` anchor as fallback.
 * This pattern mirrors `HeroBoldBottomText` and `HeroWithSideText`.
 */
const LinkItem: React.FC<LinkItemProps> = ({
  href,
  className,
  onClick,
  renderLink,
  children,
}) => {
  if (renderLink) {
    return <>{renderLink({ href, className, onClick, children })}</>;
  }
  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
};

/* =============================================================================
   SECTION 3: MAIN COMPONENT
   -----------------------------------------------------------------------------
   Pure presentational component with no internal state. Composes the heading,
   subtitle, and action links into a dark full-width CTA section.
   ============================================================================= */

/**
 * FooterCTA renders a dark full-width call-to-action section with a centred
 * heading, supporting subtitle, and up to two action buttons (primary and/or
 * ghost variant). Intended as the closing conversion element on marketing pages.
 */
export const FooterCTA: React.FC<FooterCTAProps> = ({
  title,
  subtitle,
  actions,
  renderLink,
  className,
}) => {
  /**
   * Generate a unique ID for the heading element. This ID is referenced
   * by `aria-labelledby` on the root `<section>` to provide an accessible
   * landmark name derived from the visible heading text.
   */
  const headingId = useId();

  /**
   * Compose the root class name by combining the BEM block class with
   * any additional class name provided by the consumer.
   */
  const rootClassName = ['footer-cta', className].filter(Boolean).join(' ');

  return (
    <section className={rootClassName} aria-labelledby={headingId}>
      {/* Centred container constraining content width for readability */}
      <div className="footer-cta__container">
        {/* Primary heading: serif display font, near-white text */}
        <h2 id={headingId} className="footer-cta__title">
          {title}
        </h2>

        {/* Supporting subtitle: body font, muted opacity for visual hierarchy */}
        <p className="footer-cta__subtitle">{subtitle}</p>

        {/*
         * Actions row: renders only when at least one action is provided.
         * Desktop layout: horizontal flex row with centred alignment.
         * Mobile layout: vertical stack with full-width buttons.
         */}
        {actions.length > 0 && (
          <div className="footer-cta__actions">
            {actions.map((action) => (
              <LinkItem
                key={action.href}
                href={action.href}
                className={`footer-cta__action footer-cta__action--${action.variant}`}
                onClick={action.onClick}
                renderLink={renderLink}
              >
                {action.label}
              </LinkItem>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
