/**
 * ValueCardGrid Component
 * =============================================================================
 *
 * PURPOSE:
 * A centered section that displays an eyebrow label, a section heading, and a
 * responsive grid of icon-led content cards. Each card presents a single brand
 * value or mission pillar with a decorative icon, title, and short description.
 *
 * USE CASES:
 * - "Mission & Values" section on the About page.
 * - "Why Choose Us" sections on service pages.
 * - Benefit grids and feature highlights on landing pages.
 *
 * ARCHITECTURE:
 * - Follows BEM naming convention for CSS class generation.
 * - The individual card is extracted as a co-located internal component
 *   (`ValueCard`) to keep the render function readable. It is intentionally
 *   not exported — consumers interact only with the grid-level props.
 * - Strictly typed with no "any" usage; all props have explicit interfaces.
 * - Follows the Open-Closed Principle: the public interface is stable and
 *   additive-only, while internal rendering is isolated from callers.
 *
 * ACCESSIBILITY:
 * - Root `<section>` uses `aria-labelledby` pointing at the heading id.
 * - `<ul role="list">` is explicitly set because some CSS resets (notably
 *   Safari's VoiceOver) strip the implicit list role from styled lists.
 * - Icon wrappers carry `aria-hidden="true"` — icons are decorative and
 *   the card title conveys the semantic meaning.
 * - Heading hierarchy: `<h2>` for the section, `<h3>` for each card.
 *
 * =============================================================================
 */

import React, { useId } from 'react';
import './ValueCardGrid.css';

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
export type ValueCardGridBackground = 'primary' | 'secondary';

/**
 * Data shape for a single value/mission card within the grid.
 * The `id` field provides a stable React key and should be unique across items.
 */
export interface ValueCardItem {
  /** Stable unique identifier used as the React list key. */
  id: string;

  /**
   * Decorative icon displayed above the card title.
   * Accepts a ReactNode to support SVG elements, icon font spans, or
   * any React component that renders an icon. The icon should use
   * `currentColor` to inherit the brand accent colour from CSS.
   */
  icon: React.ReactNode;

  /** Card heading rendered as an `<h3>` element. */
  title: string;

  /** Short description text for the card body. */
  description: string;
}

/**
 * Props contract for the ValueCardGrid component.
 *
 * Required props enforce the minimum data needed for a valid render.
 * Optional props carry sensible defaults documented via JSDoc tags.
 */
export interface ValueCardGridProps {
  /** Uppercase eyebrow label displayed above the section heading. */
  eyebrow: string;

  /** Main section heading rendered as an `<h2>` element. */
  heading: string;

  /**
   * Array of value/mission card data objects.
   * The component expects between 2 and 6 items for optimal layout.
   */
  items: ValueCardItem[];

  /**
   * Background colour variant for the section.
   * @default 'secondary'
   */
  backgroundColor?: ValueCardGridBackground;

  /** Optional CSS class name appended to the root `<section>` element. */
  className?: string;

  /** Optional id attribute for anchor linking and `aria-labelledby` binding. */
  id?: string;
}

/* =============================================================================
   SECTION 2: INTERNAL CARD COMPONENT
   -----------------------------------------------------------------------------
   Co-located, non-exported component responsible for rendering a single card.
   Extracted to keep the grid's render method focused on layout concerns.
   ============================================================================= */

/**
 * Props for the internal ValueCard component.
 * Matches the shape of ValueCardItem since each card renders one item.
 */
interface ValueCardInternalProps {
  /** Decorative icon node. */
  icon: React.ReactNode;
  /** Card heading text. */
  title: string;
  /** Card description text. */
  description: string;
}

/**
 * ValueCard (internal)
 *
 * Renders a single card with a decorative icon, title, and description.
 * The icon wrapper is hidden from assistive technology because the title
 * conveys the card's meaning.
 */
const ValueCard: React.FC<ValueCardInternalProps> = ({ icon, title, description }) => (
  <article className="value-card">
    {/* Icon container: decorative, hidden from screen readers */}
    <div className="value-card__icon" aria-hidden="true">
      {icon}
    </div>
    <h3 className="value-card__title">{title}</h3>
    <p className="value-card__description">{description}</p>
  </article>
);

/* =============================================================================
   SECTION 3: MAIN COMPONENT IMPLEMENTATION
   ============================================================================= */

/**
 * ValueCardGrid
 *
 * Renders a centered section with a header block (eyebrow + heading) above
 * a responsive grid of value/mission cards. The grid reflows from 3 columns
 * on desktop to 2 on tablet and 1 on mobile.
 *
 * @param props - Configuration conforming to ValueCardGridProps
 * @returns A `<section>` element containing the header and card grid
 */
export const ValueCardGrid: React.FC<ValueCardGridProps> = ({
  eyebrow,
  heading,
  items,
  backgroundColor = 'secondary',
  className,
  id,
}) => {
  /**
   * Generate a stable, unique id for the heading element.
   * If the consumer provides an explicit `id` prop, derive the heading id
   * from it. Otherwise, React's `useId` hook produces a collision-free id.
   */
  const reactId = useId();
  const headingId = id ? `${id}-heading` : `value-card-grid-heading-${reactId}`;

  /**
   * Assemble the root element's CSS class list using BEM methodology:
   * - Block: `value-card-grid`
   * - Modifier for background: `value-card-grid--bg-{primary|secondary}`
   * - Consumer-provided className appended last for override specificity.
   */
  const rootClassName = [
    'value-card-grid',
    `value-card-grid--bg-${backgroundColor}`,
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      className={rootClassName}
      id={id}
      aria-labelledby={headingId}
    >
      <div className="value-card-grid__inner">

        {/* Centered header block with eyebrow label and section heading */}
        <header className="value-card-grid__header">
          <span className="value-card-grid__eyebrow">
            {eyebrow}
          </span>
          <h2 className="value-card-grid__heading" id={headingId}>
            {heading}
          </h2>
        </header>

        {/* Card grid rendered as a semantic list for assistive technologies */}
        <ul className="value-card-grid__list" role="list">
          {items.map((item) => (
            <li className="value-card-grid__item" key={item.id}>
              <ValueCard
                icon={item.icon}
                title={item.title}
                description={item.description}
              />
            </li>
          ))}
        </ul>

      </div>
    </section>
  );
};
