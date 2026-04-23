/**
 * EventNewsBanner Component
 * =============================================================================
 *
 * PURPOSE:
 * A full-width, fixed-height news banner used to promote upcoming events or
 * trade-show appearances. The banner is composed of three visual elements: a
 * decorative brand-colour badge, an event/partner logo supplied by the
 * consuming application, and a background image that frames the overall
 * composition. The banner removes itself from the DOM automatically when a
 * configurable end date is reached, eliminating the need for a redeploy to
 * deactivate an expired campaign.
 *
 * ARCHITECTURE:
 * - Follows the Open-Closed Principle: the visual structure is closed (three
 *   fixed regions), while all content — badge label, logo, background, and
 *   expiry date — is open for extension through strictly typed props.
 * - Expiry logic is self-contained: a single `useEffect` schedules one
 *   `setTimeout` call calibrated to the millisecond difference between
 *   `Date.now()` and the parsed `endsAt` timestamp. No polling occurs.
 * - The component is a pure presentation layer; it owns no shared state and
 *   emits no custom events. Interactions beyond passive display are
 *   intentionally out of scope for this component.
 * - All styling is delegated to the companion BEM CSS file, keeping the JSX
 *   tree declarative and easy to audit.
 *
 * ACCESSIBILITY:
 * - The outer element uses `<aside role="region">` with a descriptive
 *   `aria-label` so screen readers can navigate to or skip the banner
 *   as a distinct landmark.
 * - The badge element carries `aria-hidden="true"` because it is purely
 *   decorative; its presence does not add information beyond what the logo
 *   and surrounding page context already communicate.
 * - The partner logo is rendered as an `<img>` with a mandatory `alt` prop
 *   so assistive technologies can convey the event identity to users who
 *   cannot perceive images.
 * - The background image is applied as a CSS `background-image` to avoid
 *   polluting the accessibility tree with a decorative image node.
 *
 * EXPIRY BEHAVIOUR:
 * - On mount, the component computes `remaining = endsAt - Date.now()`.
 * - If `remaining <= 0` the component sets its visibility state to `false`
 *   synchronously and renders nothing.
 * - If `remaining > 0` a single `setTimeout` is scheduled; when it fires,
 *   visibility is set to `false`, which causes React to remove the element
 *   from the DOM without a page reload or server intervention.
 * - The timer is cancelled in the effect's cleanup function so it does not
 *   fire if the component unmounts before the deadline.
 *
 * =============================================================================
 */

import React, { useEffect, useState } from 'react';
import './EventNewsBanner.css';


/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   =============================================================================

   All public types are exported so consuming applications can reference them
   for prop-forwarding patterns or higher-order wrapper components without
   importing from internal paths.
   ============================================================================= */

/**
 * Props accepted by the `EventNewsBanner` component.
 *
 * Every property maps to one distinct visual concern so the interface is
 * closed to modification but open to targeted extension by sub-classing or
 * prop-spread patterns.
 */
export interface EventNewsBannerProps {
  /**
   * Path or absolute URL of the event/partner logo displayed inside the banner.
   * The consuming application is responsible for supplying an appropriately
   * sized image; the component constrains it to a maximum height via CSS.
   *
   * @example '/resource/misc/IHS.png'
   */
  logoSrc: string;

  /**
   * Accessible text alternative for the partner logo. This value is passed
   * directly to the underlying `<img alt>` attribute and must accurately
   * describe the visual content for screen-reader users.
   *
   * @example 'PTSB Ideal Home Show logo'
   */
  logoAlt: string;

  /**
   * Path or absolute URL of the image rendered as the banner's full-bleed
   * background. A semi-transparent overlay is automatically applied by CSS to
   * ensure adequate contrast for the badge and logo regardless of the image
   * content.
   *
   * @example '/resource/backgrounds/living-room.jpg'
   */
  backgroundSrc: string;

  /**
   * ISO 8601 date-time string (with timezone offset) representing the instant
   * after which the banner is no longer relevant and should be hidden.
   * The component uses this value to schedule a single client-side timer;
   * once the deadline passes the banner is removed from the DOM automatically.
   *
   * @example '2026-04-26T23:59:59+01:00'
   */
  endsAt: string;

  /**
   * Text rendered inside the brand-colour badge on the left of the banner.
   * The badge is purely decorative and carries no interactive affordances.
   * Defaults to `'SEE US @'` to match the reference design.
   *
   * @default 'SEE US @'
   */
  badgeLabel?: string;

  /**
   * Additional CSS class names appended to the root `<aside>` element.
   * Enables the consuming application to apply page-specific overrides
   * (e.g. margin adjustments) without forking the component.
   */
  className?: string;
}


/* =============================================================================
   SECTION 2: COMPONENT IMPLEMENTATION
   ============================================================================= */

/**
 * EventNewsBanner — a self-expiring event news strip.
 *
 * Renders a full-width banner containing a decorative badge, a partner logo,
 * and a background image. The component automatically removes itself from the
 * DOM when the supplied `endsAt` deadline is reached.
 */
export const EventNewsBanner: React.FC<EventNewsBannerProps> = ({
  logoSrc,
  logoAlt,
  backgroundSrc,
  endsAt,
  badgeLabel = 'SEE US @',
  className = '',
}) => {
  // ---------------------------------------------------------------------------
  // Visibility State
  // ---------------------------------------------------------------------------
  // Initialised lazily to avoid computing Date arithmetic on every render.
  // The initial value is `true` only when the deadline has not yet been
  // reached; this means an expired `endsAt` value produces no DOM output at
  // all, even before the first effect runs.
  const [isVisible, setIsVisible] = useState<boolean>(
    () => new Date(endsAt).getTime() > Date.now(),
  );

  // ---------------------------------------------------------------------------
  // Expiry Timer Effect
  // ---------------------------------------------------------------------------
  // Registers a single `setTimeout` whose delay is the number of milliseconds
  // remaining until `endsAt`. When the timer fires, `isVisible` is set to
  // `false`, causing React to remove the element from the DOM. The cleanup
  // function cancels the timer if the component unmounts before the deadline
  // to prevent a state update on an unmounted component.
  useEffect(() => {
    const remaining = new Date(endsAt).getTime() - Date.now();

    // Guard: if the deadline has already passed (or is exactly now), hide
    // immediately without scheduling a timer.
    if (remaining <= 0) {
      setIsVisible(false);
      return;
    }

    const timerId = window.setTimeout(() => {
      setIsVisible(false);
    }, remaining);

    // Cleanup: cancel the pending timer when the effect re-runs (endsAt prop
    // changed) or when the component unmounts.
    return () => {
      window.clearTimeout(timerId);
    };
  }, [endsAt]);

  // ---------------------------------------------------------------------------
  // Early Return — Expired or Hidden
  // ---------------------------------------------------------------------------
  // Returning `null` removes the banner from the DOM entirely, freeing layout
  // space occupied by the banner without leaving an empty container element.
  if (!isVisible) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  // The background image is applied as an inline `style` property so the
  // consuming application can supply any asset path without CSS coupling.
  // The BEM modifier class pattern is reserved for structural variants should
  // the component be extended in the future.
  return (
    <aside
      role="region"
      aria-label="Event news banner"
      className={`event-news-banner${className ? ` ${className}` : ''}`}
      style={{ backgroundImage: `url(${backgroundSrc})` }}
    >
      {/*
       * Decorative overlay — darkens the background image to maintain
       * sufficient contrast between the image content and the foreground
       * elements (badge and logo). `aria-hidden` prevents screen readers
       * from encountering an empty, meaningless element.
       */}
      <div className="event-news-banner__overlay" aria-hidden="true" />

      {/*
       * Inner content container — constrains the layout to a centred flex
       * row and applies horizontal padding. Positioned above the overlay
       * via `position: relative` and a higher `z-index`.
       */}
      <div className="event-news-banner__inner">

        {/*
         * Decorative brand badge.
         * Rendered as a non-interactive `<span>` with `aria-hidden="true"` so
         * it is invisible to assistive technologies. `pointer-events: none` is
         * enforced in CSS to guarantee the element can never accidentally
         * receive focus or click events regardless of global style overrides.
         */}
        <span
          className="event-news-banner__badge"
          aria-hidden="true"
        >
          {badgeLabel}
        </span>

        {/*
         * Partner / event logo.
         * Rendered as a standard `<img>` with an explicit `alt` attribute so
         * the event identity is accessible to all users. `loading="eager"` is
         * intentional: the banner is above the fold and the image should be
         * fetched immediately rather than deferred by lazy-loading heuristics.
         */}
        <img
          className="event-news-banner__logo"
          src={logoSrc}
          alt={logoAlt}
          loading="eager"
          decoding="async"
        />
      </div>
    </aside>
  );
};
