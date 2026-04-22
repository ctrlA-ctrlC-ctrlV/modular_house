/**
 * PromoBanner Component
 * =============================================================================
 *
 * PURPOSE:
 * Thin, purely informational promotional strip rendered directly beneath the
 * site header while a marketing campaign is active. Displays a short eyebrow
 * label, the campaign name, and a live countdown to the campaign end instant.
 *
 * ARCHITECTURE:
 * - Follows the Open-Closed Principle: the component accepts typed props for
 *   content and visual variant; the internal structure is closed. All styling
 *   is delegated to the companion CSS file using BEM.
 * - Countdown state is encapsulated inside the colocated `useCountdown` hook
 *   to keep the component a pure presentation layer.
 * - SSR-safe: while `useCountdown` returns `null` (server render and first
 *   client render before hydration), a stable placeholder of dashes is
 *   rendered. Once the hook begins returning live parts, the banner swaps to
 *   numeric segments. If the campaign has expired before first paint, the
 *   banner renders nothing.
 *
 * ACCESSIBILITY:
 * - Rendered inside `<aside role="region">` with a descriptive `aria-label`.
 * - The countdown wrapper is `aria-live="off"` to avoid a screen-reader
 *   announcement on every tick; a single summarising `aria-label` conveys the
 *   remaining time, updated once per second alongside the visible digits.
 * - Each numeric segment exposes its unit via `aria-label` so assistive
 *   technologies can discover the semantics even without the visible labels.
 *
 * =============================================================================
 */

import React, { useEffect, useRef, useState } from 'react';
import { useCountdown, type CountdownParts } from './useCountdown';
import './PromoBanner.css';


/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   ============================================================================= */

/**
 * Visual variant matched 1:1 with `HeaderVariant` so the banner can inherit
 * the visual treatment of the header it sits beneath without re-declaring
 * token palettes.
 */
export type PromoBannerVariant = 'dark' | 'light';

/**
 * Props accepted by the `PromoBanner` component. All strings are expected to
 * be pre-localised by the consumer; the component performs no translation.
 */
export interface PromoBannerProps {
  /**
   * Human-readable campaign name, for example `"Spring Sale 2026"`.
   */
  name: string;

  /**
   * ISO 8601 date-time string (including timezone offset) marking the
   * campaign end instant. Drives the live countdown.
   */
  endsAt: string;

  /**
   * Optional eyebrow label rendered before the campaign name, for example
   * `"Limited time"`.
   */
  eyebrow?: string;

  /**
   * Visual variant. `"dark"` pairs with the dark header variant and reverses
   * foreground / background colours for `"light"`.
   * @default 'dark'
   */
  variant?: PromoBannerVariant;

  /**
   * Additional CSS class names to apply to the outer `<aside>` element.
   */
  className?: string;
}


/* =============================================================================
   SECTION 2: INTERNAL HELPERS
   ============================================================================= */

/**
 * Two-digit zero-padded string for a single countdown unit. Countdown digits
 * are always rendered in a fixed-width presentation to avoid layout shift as
 * values tick down.
 */
const pad2 = (value: number): string => value.toString().padStart(2, '0');

/**
 * Human-readable summary ("Sale ends in 12 days 4 hours") used as the
 * countdown wrapper's `aria-label`. Units with a zero value are omitted to
 * keep announcements concise.
 */
const formatAriaSummary = (parts: CountdownParts): string => {
  const segments: string[] = [];
  if (parts.days > 0) segments.push(`${parts.days} day${parts.days === 1 ? '' : 's'}`);
  if (parts.hours > 0) segments.push(`${parts.hours} hour${parts.hours === 1 ? '' : 's'}`);
  if (parts.minutes > 0) segments.push(`${parts.minutes} minute${parts.minutes === 1 ? '' : 's'}`);
  if (parts.seconds > 0 && parts.days === 0 && parts.hours === 0) {
    // Only surface seconds in the summary when under an hour remains to keep
    // longer summaries readable.
    segments.push(`${parts.seconds} second${parts.seconds === 1 ? '' : 's'}`);
  }
  return segments.length === 0 ? 'Sale ending soon' : `Sale ends in ${segments.join(' ')}`;
};

/**
 * Static placeholder rendered while `useCountdown` returns `null` before
 * hydration. The dashes preserve the banner's layout footprint, preventing
 * cumulative layout shift when the live digits appear.
 */
const PLACEHOLDER_VALUE = '--';


/* =============================================================================
   SECTION 3: COMPONENT IMPLEMENTATION
   ============================================================================= */

/**
 * Countdown segment descriptor. A short unit glyph (`d`, `h`, `m`, `s`) is
 * rendered beneath each numeric value on compact viewports via CSS.
 */
interface SegmentDescriptor {
  readonly value: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly ariaLabel: string;
}

/**
 * Builds the four segment descriptors from a live `CountdownParts` structure.
 * Extracted into a helper so the render path stays declarative and linear.
 */
const buildSegments = (parts: CountdownParts): readonly SegmentDescriptor[] => [
  {
    value: pad2(parts.days),
    label: 'Days',
    shortLabel: 'd',
    ariaLabel: `${parts.days} day${parts.days === 1 ? '' : 's'}`,
  },
  {
    value: pad2(parts.hours),
    label: 'Hours',
    shortLabel: 'h',
    ariaLabel: `${parts.hours} hour${parts.hours === 1 ? '' : 's'}`,
  },
  {
    value: pad2(parts.minutes),
    label: 'Minutes',
    shortLabel: 'm',
    ariaLabel: `${parts.minutes} minute${parts.minutes === 1 ? '' : 's'}`,
  },
  {
    value: pad2(parts.seconds),
    label: 'Seconds',
    shortLabel: 's',
    ariaLabel: `${parts.seconds} second${parts.seconds === 1 ? '' : 's'}`,
  },
];

/**
 * Builds the four placeholder segments used for the SSR/pre-hydration render.
 */
const buildPlaceholderSegments = (): readonly SegmentDescriptor[] => [
  { value: PLACEHOLDER_VALUE, label: 'Days', shortLabel: 'd', ariaLabel: 'days' },
  { value: PLACEHOLDER_VALUE, label: 'Hours', shortLabel: 'h', ariaLabel: 'hours' },
  { value: PLACEHOLDER_VALUE, label: 'Minutes', shortLabel: 'm', ariaLabel: 'minutes' },
  { value: PLACEHOLDER_VALUE, label: 'Seconds', shortLabel: 's', ariaLabel: 'seconds' },
];

/**
 * Site-wide promotional banner component.
 *
 * The banner un-mounts automatically once it detects, on the client, that
 * the campaign has expired (i.e. `useCountdown` returns `null` after a
 * previous render delivered live values). The pre-hydration `null` return
 * is differentiated from the post-expiry `null` return via a mount-tracking
 * ref so the banner is never incorrectly hidden on the server.
 */
export const PromoBanner: React.FC<PromoBannerProps> = ({
  name,
  endsAt,
  eyebrow,
  variant = 'dark',
  className,
}) => {
  // Live countdown value. `null` during SSR and pre-hydration; `null` again
  // after the campaign has expired on the client.
  const parts = useCountdown(endsAt);

  // Tracks whether the hook has ever returned live (non-null) values. This
  // lets us distinguish "not hydrated yet" (show placeholder) from
  // "campaign already expired on the client" (hide the banner entirely).
  const hasHydratedRef = useRef<boolean>(false);
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);
  useEffect(() => {
    if (parts !== null && !hasHydratedRef.current) {
      hasHydratedRef.current = true;
      setHasHydrated(true);
    }
  }, [parts]);

  // After hydration, a `null` value from the hook means the campaign ended.
  // Removing the node from the tree is the correct behaviour per plan §4.3.
  if (hasHydrated && parts === null) {
    return null;
  }

  // Segment data: live values after hydration, placeholders before.
  const segments = parts !== null ? buildSegments(parts) : buildPlaceholderSegments();

  // Compose BEM classes. `--variant-*` applies the chosen colour scheme;
  // `className` lets consumers extend the outer element.
  const rootClassName = [
    'promo-banner',
    `promo-banner--variant-${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // ARIA summary is only meaningful once live values are available.
  const countdownAriaLabel = parts !== null ? formatAriaSummary(parts) : undefined;

  return (
    <aside
      role="region"
      aria-label="Sale announcement"
      className={rootClassName}
    >
      <div className="promo-banner__inner">
        {/* Headline block: eyebrow (optional) + campaign name. */}
        <div className="promo-banner__headline">
          {eyebrow ? (
            <span className="promo-banner__eyebrow">{eyebrow}</span>
          ) : null}
          <span className="promo-banner__name">{name}</span>
        </div>

        {/*
          Countdown block. `aria-live="off"` prevents a screen-reader
          announcement on every tick; the single summarising `aria-label`
          conveys the current remaining time when hydrated.
        */}
        <div
          className="promo-banner__countdown"
          aria-live="off"
          aria-label={countdownAriaLabel}
        >
          {segments.map((segment, index) => (
            <React.Fragment key={segment.label}>
              <span
                className="promo-banner__countdown-segment"
                aria-label={segment.ariaLabel}
              >
                <span className="promo-banner__countdown-value">{segment.value}</span>
                <span
                  className="promo-banner__countdown-label"
                  aria-hidden="true"
                >
                  {segment.label}
                </span>
                <span
                  className="promo-banner__countdown-short-label"
                  aria-hidden="true"
                >
                  {segment.shortLabel}
                </span>
              </span>
              {index < segments.length - 1 ? (
                <span
                  className="promo-banner__countdown-separator"
                  aria-hidden="true"
                >
                  :
                </span>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default PromoBanner;
