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
 * IMAGE DELIVERY STRATEGY:
 * - Both the background and the partner logo are rendered through `<picture>`
 *   elements. Consumers may optionally supply AVIF and WebP variants for each
 *   asset; when present, the `<source>` elements are emitted in decreasing
 *   order of compression efficiency (AVIF first, WebP second) and the
 *   original `*Src` value is used as the universal fallback inside `<img>`.
 * - The browser evaluates `<source>` candidates in document order and selects
 *   the first `type` it supports. This yields AVIF on Chrome 85+/Firefox 93+/
 *   Safari 16.4+, WebP on all other modern browsers, and the original format
 *   on legacy engines — with zero JavaScript involvement.
 * - The background `<img>` is marked `loading="eager"` and
 *   `fetchpriority="high"` because the banner sits above the fold; the logo
 *   is likewise fetched eagerly, with default priority since it is a small,
 *   non-LCP asset.
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
 * - The background image carries an empty `alt=""` attribute marking it as
 *   decorative, so it is omitted from the accessibility tree.
 *
 * VISIBILITY WINDOW BEHAVIOUR:
 * - The component supports an optional `startsAt` lower bound and a required
 *   `endsAt` upper bound. The banner is rendered if and only if
 *   `startsAt <= now < endsAt`. When `startsAt` is omitted the lower bound
 *   collapses to negative infinity, preserving the legacy "show immediately
 *   until expiry" contract.
 * - On mount, both bounds are evaluated against `Date.now()` to derive the
 *   initial visibility synchronously.
 * - At most two timers are armed for the lifetime of a mounted instance:
 *   one for the activation instant (if it is still in the future) and one
 *   for the expiry instant. Each timer fires a shared `evaluate()` callback
 *   that recomputes visibility from the current clock; this means at most
 *   two React state writes occur across the entire visibility lifecycle.
 * - Because the platform `setTimeout` delay parameter is a signed 32-bit
 *   integer (~24.8 days), longer scheduling horizons are split into
 *   chained re-arms by the internal `scheduleAt` helper. This allows the
 *   banner to support visibility windows of up to one year (or more) with
 *   negligible runtime overhead — fewer than ~16 timer wake-ups across a
 *   full 365-day window — and no polling.
 * - All scheduled timers are cancelled in the effect's cleanup function so
 *   they cannot fire after the component unmounts or after the bounds
 *   change.
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
 * Identifier for a banner layout template.
 *
 * The component currently ships with two layout templates:
 *
 * - `'badge-logo'`         — the original two-region layout: a decorative
 *                            brand badge on the left, followed by the
 *                            partner/event logo. This value is the default
 *                            and is preserved for backward compatibility
 *                            with existing call sites.
 *
 * - `'badge-logo-details'` — extends the original layout with a third
 *                            region containing event metadata (date and
 *                            location) rendered to the right of the logo.
 *                            Use when announcing a specific event
 *                            appearance with concrete time/place details.
 *
 * New layout identifiers can be added in the future without breaking
 * existing consumers because each template is opt-in via this prop.
 */
export type EventNewsBannerLayout = 'badge-logo' | 'badge-logo-details';

/**
 * Event metadata rendered by the `'badge-logo-details'` layout template.
 *
 * Both fields are plain strings because the banner displays them verbatim;
 * any locale-specific formatting (e.g. translating month names, applying
 * 12/24-hour clocks) is the consumer's responsibility. Keeping the contract
 * at string level avoids coupling the component to a particular i18n stack
 * or `Date` representation.
 */
export interface EventNewsBannerDetails {
  /**
   * Human-readable date or date-range string for the announced event.
   *
   * @example '15 - 18 May 2026'
   */
  eventDate: string;

  /**
   * Human-readable venue or location string for the announced event.
   *
   * @example 'RDS, Dublin'
   */
  eventLocation: string;
}

/**
 * Properties shared by every layout template.
 *
 * These props describe concerns that are layout-agnostic: imagery, expiry
 * scheduling, accessibility text, and the optional badge label. Layout-
 * specific props are introduced by the discriminated union variants below.
 */
interface EventNewsBannerBaseProps {
  /**
   * Path or absolute URL of the event/partner logo displayed inside the banner.
   * This value is used as the universal fallback inside the `<picture>`
   * element and must therefore point to an asset format that all targeted
   * browsers can decode (typically PNG or JPEG). The consuming application
   * is responsible for supplying an appropriately sized image; the component
   * constrains it to a maximum height via CSS.
   *
   * @example '/resource/misc/IHS.png'
   */
  logoSrc: string;

  /**
   * Optional WebP variant of the partner logo. When provided, a
   * `<source type="image/webp">` is emitted inside the `<picture>` element so
   * browsers with WebP support can download the smaller payload.
   *
   * @example '/resource/misc/IHS.webp'
   */
  logoSrcWebP?: string;

  /**
   * Optional AVIF variant of the partner logo. When provided, a
   * `<source type="image/avif">` is emitted as the first candidate inside
   * the `<picture>` element so cutting-edge browsers can download the
   * smallest available payload.
   *
   * @example '/resource/misc/IHS.avif'
   */
  logoSrcAvif?: string;

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
   * background. Used as the universal fallback inside the background
   * `<picture>` element; a semi-transparent overlay is applied on top via CSS
   * to ensure adequate contrast for the badge and logo regardless of the
   * image content.
   *
   * @example '/resource/backgrounds/living-room.jpg'
   */
  backgroundSrc: string;

  /**
   * Optional WebP variant of the background image.
   *
   * @example '/resource/misc/default_banner_bg.webp'
   */
  backgroundSrcWebP?: string;

  /**
   * Optional AVIF variant of the background image.
   *
   * @example '/resource/misc/default_banner_bg.avif'
   */
  backgroundSrcAvif?: string;

  /**
   * Optional ISO 8601 date-time string (with timezone offset) representing
   * the instant at which the banner should become visible. Until this
   * moment is reached, the component renders nothing — exactly as it does
   * after `endsAt` has elapsed. When omitted, the banner is considered
   * active immediately upon mount, preserving backward compatibility with
   * the original API.
   *
   * Pairing `startsAt` with `endsAt` defines a closed-open visibility
   * window `[startsAt, endsAt)` that may span up to one year (or more);
   * the internal scheduler chains `setTimeout` calls as needed to honour
   * arbitrary durations without polling.
   *
   * If `startsAt` is greater than or equal to `endsAt` the banner will
   * never appear; this is treated as a configuration error by the caller
   * rather than something the component attempts to recover from.
   *
   * @example '2026-05-15T00:00:00+01:00'
   */
  startsAt?: string;

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

/**
 * Discriminated union describing the public props of the
 * `EventNewsBanner` component.
 *
 * The `layout` field acts as the discriminator. TypeScript narrows the
 * remaining props based on its value, which means consumers cannot, for
 * example, supply `details` to the `'badge-logo'` layout, and they MUST
 * supply `details` when selecting `'badge-logo-details'`. This gives the
 * compiler enough information to enforce layout-specific contracts at the
 * call site without runtime assertions.
 *
 * The `'badge-logo'` variant treats the `layout` field as optional so
 * existing call sites that were written before layout templates existed
 * continue to compile unchanged.
 */
export type EventNewsBannerProps =
  | (EventNewsBannerBaseProps & {
      /**
       * Selects the original badge + logo layout. May be omitted to keep
       * existing consumers source-compatible.
       */
      layout?: 'badge-logo';
    })
  | (EventNewsBannerBaseProps & {
      /**
       * Selects the badge + logo + details layout.
       */
      layout: 'badge-logo-details';

      /**
       * Event metadata rendered in the third region of the layout. Required
       * for this variant; the TypeScript compiler will reject call sites
       * that omit it.
       */
      details: EventNewsBannerDetails;
    });


/* =============================================================================
   SECTION 2: COMPONENT IMPLEMENTATION
   ============================================================================= */

/* -----------------------------------------------------------------------------
   Internal scheduling primitives
   -----------------------------------------------------------------------------
   The following module-level helpers are not exported. They isolate the
   non-trivial timing logic from the React component so the render path
   remains a thin orchestration layer over typed primitives.
   -------------------------------------------------------------------------- */

/**
 * Maximum delay accepted by the platform `setTimeout` implementation.
 *
 * The HTML specification stores the delay parameter as a 32-bit signed
 * integer. Delays larger than `2^31 - 1` milliseconds (~24.8 days) are
 * coerced to `1`, which would cause arbitrarily distant deadlines to fire
 * almost immediately. The scheduler below clamps each individual
 * `setTimeout` call to this ceiling and re-arms in chunks until the target
 * instant is reached, allowing visibility windows of arbitrary length to be
 * scheduled with a single deterministic primitive.
 */
const MAX_SET_TIMEOUT_MS = 2_147_483_647;

/**
 * Sentinel cleanup function used when no timer was actually registered.
 * Centralising the no-op simplifies the call sites that conditionally arm
 * timers and keeps the overall control flow free of `undefined` checks.
 */
const NO_OP: () => void = () => undefined;

/**
 * Schedules a one-shot callback to fire at — or as close as possible to —
 * the absolute clock instant `targetMs`.
 *
 * The function chains successive `setTimeout` calls when the remaining
 * duration exceeds `MAX_SET_TIMEOUT_MS`, so callers may pass deadlines that
 * are weeks or months in the future without triggering the platform's
 * 32-bit overflow behaviour. Each chained timer wakes once and immediately
 * re-arms; the worst-case wake count for a one-year horizon is therefore
 * approximately `Math.ceil(365 / 24.8) ≈ 15`, which is negligible.
 *
 * The returned function cancels any timer that is currently pending. It is
 * safe to invoke after the callback has already fired.
 *
 * @param targetMs Absolute Unix-epoch instant (milliseconds) at which the
 *                 callback should be invoked.
 * @param callback Function to invoke once the target instant has elapsed.
 * @returns A teardown function that cancels the pending timer, if any.
 */
const scheduleAt = (targetMs: number, callback: () => void): (() => void) => {
  let timerId: number | undefined;

  const tick = (): void => {
    const remaining = targetMs - Date.now();
    if (remaining <= 0) {
      callback();
      return;
    }
    timerId = window.setTimeout(tick, Math.min(remaining, MAX_SET_TIMEOUT_MS));
  };

  tick();

  return () => {
    if (typeof timerId === 'number') {
      window.clearTimeout(timerId);
    }
  };
};

/**
 * Parses an optional ISO 8601 timestamp string into milliseconds since the
 * Unix epoch. Empty / undefined inputs and unparseable values fall back to
 * the supplied `fallback` so the caller can collapse missing boundaries to
 * `Number.NEGATIVE_INFINITY` (open lower bound) or `Number.POSITIVE_INFINITY`
 * (open upper bound) without conditional logic.
 */
const parseBoundary = (
  value: string | undefined,
  fallback: number,
): number => {
  if (typeof value !== 'string' || value.length === 0) {
    return fallback;
  }
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Determines whether the supplied instant falls inside the closed-open
 * window `[startMs, endMs)`. Encapsulating the boundary comparison in a
 * single function ensures consistent semantics across both the lazy
 * `useState` initialiser and the runtime `evaluate()` callback.
 */
const isWithinWindowMs = (
  startMs: number,
  endMs: number,
  nowMs: number,
): boolean => nowMs >= startMs && nowMs < endMs;

/**
 * String-input convenience wrapper around `isWithinWindowMs` used by the
 * lazy state initialiser. Keeps the component-level call site free of
 * boundary-parsing boilerplate.
 */
const isWithinWindow = (
  startsAt: string | undefined,
  endsAt: string,
  nowMs: number,
): boolean =>
  isWithinWindowMs(
    parseBoundary(startsAt, Number.NEGATIVE_INFINITY),
    parseBoundary(endsAt, Number.POSITIVE_INFINITY),
    nowMs,
  );


/**
 * EventNewsBanner — a self-expiring event news strip.
 *
 * Renders a full-width banner containing a decorative badge, a partner logo,
 * and a background image. The component automatically removes itself from the
 * DOM when the supplied `endsAt` deadline is reached.
 */
export const EventNewsBanner: React.FC<EventNewsBannerProps> = (props) => {
  // ---------------------------------------------------------------------------
  // Prop Destructuring
  // ---------------------------------------------------------------------------
  // Destructured from the discriminated union argument. The `layout` field is
  // normalised to `'badge-logo'` when omitted so the rendering logic below
  // can branch on a definite string. Layout-specific fields (currently
  // `details`) are pulled from `props` separately because TypeScript narrows
  // them only inside guarded branches; their values are read explicitly
  // within each render branch where the discriminator value is known.
  const {
    logoSrc,
    logoSrcWebP,
    logoSrcAvif,
    logoAlt,
    backgroundSrc,
    backgroundSrcWebP,
    backgroundSrcAvif,
    startsAt,
    endsAt,
    badgeLabel = 'SEE US @',
    className = '',
  } = props;

  const layout: EventNewsBannerLayout = props.layout ?? 'badge-logo';
  // ---------------------------------------------------------------------------
  // Visibility State
  // ---------------------------------------------------------------------------
  // Initialised lazily to avoid computing Date arithmetic on every render.
  // The initial value is derived from a single `isWithinWindow` evaluation so
  // the banner emits zero DOM output before the activation instant or after
  // the expiry instant — even before the first effect runs.
  const [isVisible, setIsVisible] = useState<boolean>(() =>
    isWithinWindow(startsAt, endsAt, Date.now()),
  );

  // ---------------------------------------------------------------------------
  // Visibility Window Effect
  // ---------------------------------------------------------------------------
  // Reconciles `isVisible` with the current `[startsAt, endsAt)` window and
  // arms at most two timers — one for the activation boundary (only if it
  // is still in the future) and one for the expiry boundary. Each timer
  // invokes a shared `evaluate` callback that recomputes visibility from
  // `Date.now()`. Long horizons that exceed the platform `setTimeout` cap
  // are handled transparently by `scheduleAt`, which re-arms in chunks
  // until the target instant is reached.
  //
  // The effect explicitly synchronises `isVisible` on every prop change so
  // the component recovers correctly from scenarios where the consumer
  // reassigns either bound at runtime (for example to extend an active
  // campaign or to bring forward an upcoming one).
  useEffect(() => {
    const startMs = parseBoundary(startsAt, Number.NEGATIVE_INFINITY);
    const endMs = parseBoundary(endsAt, Number.POSITIVE_INFINITY);

    const evaluate = (): void => {
      setIsVisible(isWithinWindowMs(startMs, endMs, Date.now()));
    };

    // Synchronise immediately in case the lazy `useState` initialiser ran
    // with a stale prop value (Vite HMR scenarios, controlled re-mounts).
    evaluate();

    const now = Date.now();
    const cancelStart =
      startMs > now ? scheduleAt(startMs, evaluate) : NO_OP;
    const cancelEnd =
      endMs > now ? scheduleAt(endMs, evaluate) : NO_OP;

    return () => {
      cancelStart();
      cancelEnd();
    };
  }, [startsAt, endsAt]);

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
  // The background and logo are each rendered through a `<picture>` element
  // that negotiates the most efficient format the browser supports (AVIF →
  // WebP → original fallback) without any JavaScript involvement. The BEM
  // modifier class pattern is reserved for structural variants should the
  // component be extended in the future.
  return (
    <aside
      role="region"
      aria-label="Event news banner"
      className={`event-news-banner${className ? ` ${className}` : ''}`}
    >
      {/*
       * Background image layer.
       *
       * Rendered as a `<picture>` with an absolutely positioned `<img>` so
       * the browser's preload scanner can discover, prioritise, and — where
       * supported — decode the modern AVIF/WebP variants. This replaces the
       * previous CSS `background-image` approach, which hid the asset from
       * the preload scanner and prevented per-browser format negotiation.
       *
       * Attributes of note:
       * - `alt=""`              marks the image as decorative.
       * - `loading="eager"`     the banner is above the fold; deferring the
       *                          fetch would harm perceived performance.
       * - `fetchPriority="high"` hints that this asset should be fetched
       *                          ahead of non-critical resources.
       * - `decoding="async"`    keeps the decode step off the main thread.
       */}
      <picture className="event-news-banner__background" aria-hidden="true">
        {backgroundSrcAvif && (
          <source type="image/avif" srcSet={backgroundSrcAvif} />
        )}
        {backgroundSrcWebP && (
          <source type="image/webp" srcSet={backgroundSrcWebP} />
        )}
        <img
          className="event-news-banner__background-image"
          src={backgroundSrc}
          alt=""
          loading="eager"
          decoding="async"
          // `fetchpriority` is a valid HTML attribute but the React typings
          // in some versions of @types/react do not yet describe it. It is
          // spread as a lowercase string prop so the attribute is written
          // verbatim to the DOM regardless of type-definition drift.
          {...{ fetchpriority: 'high' }}
        />
      </picture>

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

        A layout-specific BEM modifier class is appended so the stylesheet
        can adjust spacing, alignment, or composition rules per template
        without touching shared structural rules.
      */}
      <div
        className={`event-news-banner__inner event-news-banner__inner--${layout}`}
      >

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
         *
         * Rendered inside a `<picture>` element that offers AVIF and WebP
         * variants when the consumer supplies them. The inner `<img>` remains
         * the element queried by assistive technologies and retains the
         * mandatory `alt` attribute so the event identity is accessible to
         * all users.
         *
         * `loading="eager"` is intentional: the banner is above the fold and
         * the image should be fetched immediately rather than deferred by
         * lazy-loading heuristics. `decoding="async"` offloads the decode
         * step from the main thread to prevent input latency spikes.
         */}
        <picture className="event-news-banner__logo-picture">
          {logoSrcAvif && (
            <source type="image/avif" srcSet={logoSrcAvif} />
          )}
          {logoSrcWebP && (
            <source type="image/webp" srcSet={logoSrcWebP} />
          )}
          <img
            className="event-news-banner__logo"
            src={logoSrc}
            alt={logoAlt}
            loading="eager"
            decoding="async"
          />
        </picture>

        {/*
         * Event details region.
         *
         * Rendered exclusively for the `'badge-logo-details'` layout. The
         * conditional uses the discriminator field and a defensive check on
         * `props.details` so the JSX subtree is omitted entirely when the
         * data is not present, preserving the original two-region
         * composition for the default layout.
         *
         * The block is wrapped in a `<div>` rather than an inline element
         * because it stacks two text rows vertically (date over location)
         * and benefits from independent line-height control via CSS.
         */}
        {layout === 'badge-logo-details' && 'details' in props && (
          <div
            className="event-news-banner__details"
            aria-label="Event details"
          >
            <span className="event-news-banner__details-date">
              {props.details.eventDate}
            </span>
            <span className="event-news-banner__details-location">
              {props.details.eventLocation}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
