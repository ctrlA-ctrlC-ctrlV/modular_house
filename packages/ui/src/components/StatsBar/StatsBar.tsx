/**
 * StatsBar Component
 * =============================================================================
 *
 * PURPOSE:
 * A horizontal bar of key metrics presented as large numerals with captions.
 * Designed to provide quick, scannable trust indicators such as projects
 * completed, years of experience, customer satisfaction scores, and
 * certification ratings.
 *
 * USE CASES:
 * - "Stats" section on the About page (after the team section).
 * - Credentials display on Landing, Garden Room, or House Extension pages.
 * - Trust-building bar on any marketing or service page.
 *
 * ARCHITECTURE:
 * - Follows BEM naming convention for CSS class generation.
 * - Strictly typed with no "any" usage; all props have explicit interfaces.
 * - Follows the Open-Closed Principle: the public interface is stable and
 *   additive-only. Counter-animation is intentionally omitted from this
 *   version but could be added via an opt-in prop without breaking the
 *   existing contract.
 *
 * ACCESSIBILITY:
 * - Root `<section>` uses `aria-label` rather than `aria-labelledby` because
 *   this component has no visible heading by design — it is a visual bar,
 *   not a titled content section.
 * - `<ul role="list">` is explicitly set because some CSS resets strip the
 *   implicit list role in Safari's VoiceOver.
 * - Value and label reside in the same `<li>` so assistive technology reads
 *   them together (e.g. "50 plus, projects completed").
 * - If the value contains non-speech characters (e.g. "+"), consumers should
 *   pass plain-text-friendly strings for the best AT experience.
 *
 * =============================================================================
 */

import React from 'react';
import './StatsBar.css';

/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Publicly exported types form the stable contract for this component.
   ============================================================================= */

/**
 * Background colour variants corresponding to brand design tokens.
 * - "primary" maps to `--brand-bg-primary` (near-white).
 * - "secondary" maps to `--brand-bg-secondary` (warm beige).
 */
export type StatsBarBackground = 'primary' | 'secondary';

/**
 * Data shape for a single stat item within the bar.
 * The `id` field provides a stable React key and should be unique across items.
 */
export interface StatItem {
  /** Stable unique identifier used as the React list key. */
  id: string;

  /**
   * The stat value as displayed to the user (e.g. "50+", "100%", "A1").
   * This is a display string, not a number, to support suffixes and
   * non-numeric values such as certification ratings.
   */
  value: string;

  /** Caption displayed below the value describing what the stat represents. */
  label: string;
}

/**
 * Props contract for the StatsBar component.
 *
 * Required props enforce the minimum data needed for a valid render.
 * Optional props carry sensible defaults documented via JSDoc tags.
 */
export interface StatsBarProps {
  /**
   * Array of stat items to display.
   * The component expects exactly 4 items for balanced layout across all
   * breakpoints. Fewer or more items will still render correctly but may
   * produce uneven columns.
   */
  stats: StatItem[];

  /**
   * Background colour variant for the section.
   * @default 'secondary'
   */
  backgroundColor?: StatsBarBackground;

  /** Optional CSS class name appended to the root `<section>` element. */
  className?: string;

  /** Optional id attribute for anchor linking. */
  id?: string;

  /**
   * Accessible label for the section, read by screen readers in place of
   * a visible heading.
   * @default 'Company statistics'
   */
  ariaLabel?: string;
}

/* =============================================================================
   SECTION 2: COMPONENT IMPLEMENTATION
   ============================================================================= */

/**
 * StatsBar
 *
 * Renders a horizontal bar of key metrics in a responsive grid layout.
 * Each stat is presented as a large numeral (brand accent colour) with a
 * small uppercase caption beneath it. The grid displays 4 columns on
 * desktop and reflows to 2 columns on mobile.
 *
 * @param props - Configuration conforming to StatsBarProps
 * @returns A `<section>` element containing the stats grid
 */
export const StatsBar: React.FC<StatsBarProps> = ({
  stats,
  backgroundColor = 'secondary',
  className,
  id,
  ariaLabel = 'Company statistics',
}) => {
  /**
   * Assemble the root element's CSS class list using BEM methodology:
   * - Block: `stats-bar`
   * - Modifier for background: `stats-bar--bg-{primary|secondary}`
   * - Consumer-provided className appended last for override specificity.
   */
  const rootClassName = [
    'stats-bar',
    `stats-bar--bg-${backgroundColor}`,
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
      <div className="stats-bar__inner">

        {/* Stats grid rendered as a semantic list for assistive technologies */}
        <ul className="stats-bar__list" role="list">
          {stats.map((stat) => (
            <li className="stats-bar__item" key={stat.id}>
              {/* Large numeral in brand accent colour */}
              <span className="stats-bar__value">{stat.value}</span>
              {/* Uppercase caption describing the metric */}
              <span className="stats-bar__label">{stat.label}</span>
            </li>
          ))}
        </ul>

      </div>
    </section>
  );
};
