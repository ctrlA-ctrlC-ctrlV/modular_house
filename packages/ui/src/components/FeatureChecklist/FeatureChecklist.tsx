/**
 * FeatureChecklist Component
 * =============================================================================
 *
 * PURPOSE:
 * A two-column layout pairing a supporting image with a vertically-stacked
 * list of benefits. Each list item has a decorative icon bullet, a bold title,
 * and a short description. The component is optimised for presenting product
 * advantages or process steps alongside a compelling visual.
 *
 * USE CASES:
 * - "Why Steel Frame" section on the About page.
 * - Product benefit lists on Garden Room and House Extension pages.
 * - Process explainers and comparison panels on service pages.
 *
 * ARCHITECTURE:
 * - Follows BEM naming convention for CSS class generation.
 * - The individual checklist row is extracted as a co-located internal
 *   component (`ChecklistRow`) to keep the main render function focused
 *   on layout concerns. It is intentionally not exported.
 * - Uses the shared `OptimizedImage` component for modern format delivery
 *   (AVIF/WebP/fallback) with lazy loading.
 * - Strictly typed with no "any" usage; all props have explicit interfaces.
 * - Follows the Open-Closed Principle: the public interface is stable and
 *   additive-only, while internal rendering is isolated from callers.
 *
 * ACCESSIBILITY:
 * - Root `<section>` uses `aria-labelledby` pointing at the heading id.
 * - `<ul role="list">` is explicitly set because some CSS resets strip the
 *   implicit list role in Safari's VoiceOver.
 * - Icon wrappers carry `aria-hidden="true"` — icons are decorative and
 *   the item title conveys the semantic meaning.
 * - Heading hierarchy: `<h2>` for the section heading; list item titles
 *   are `<span>` elements (not headings) because they are short labels,
 *   not navigable sub-sections.
 * - `imageAlt` is required to enforce descriptive text for screen readers.
 *
 * =============================================================================
 */

import React, { useId } from 'react';
import { OptimizedImage } from '../OptimizedImage/OptimizedImage';
import './FeatureChecklist.css';

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
export type FeatureChecklistBackground = 'primary' | 'secondary';

/**
 * Data shape for a single checklist item within the list.
 * The `id` field provides a stable React key and should be unique across items.
 */
export interface ChecklistItem {
  /** Stable unique identifier used as the React list key. */
  id: string;

  /**
   * Decorative icon displayed at the start of the row.
   * Accepts a ReactNode to support SVG elements, icon font spans, or
   * any React component that renders an icon (e.g. a check-circle).
   * The icon should use `currentColor` to inherit the brand accent colour.
   */
  icon: React.ReactNode;

  /** Bold item title displayed beside the icon. */
  title: string;

  /** Supporting description text beneath the title. */
  description: string;
}

/**
 * Props contract for the FeatureChecklist component.
 *
 * Required props enforce the minimum data needed for a valid, accessible
 * render. Optional props carry sensible defaults documented via JSDoc tags.
 */
export interface FeatureChecklistProps {
  /** Uppercase eyebrow label displayed above the heading. */
  eyebrow: string;

  /** Main section heading rendered as an `<h2>` element. */
  heading: string;

  /**
   * Array of checklist benefit items.
   * The component expects between 3 and 6 items for balanced layout.
   */
  items: ChecklistItem[];

  /** Primary image URL used as the fallback `src` inside `<picture>`. */
  imageSrc: string;

  /** Optional WebP format URL for modern browser optimisation. */
  imageWebP?: string;

  /** Optional AVIF format URL for best compression on supported browsers. */
  imageAvif?: string;

  /**
   * Alt text for the image. Required for accessibility compliance.
   * Pass an empty string only for purely decorative images.
   */
  imageAlt: string;

  /**
   * When true, the image is placed in the left column (before the text).
   * When false, the image appears on the right (after the text).
   * @default true
   */
  imageFirst?: boolean;

  /**
   * Background colour variant for the section.
   * @default 'primary'
   */
  backgroundColor?: FeatureChecklistBackground;

  /** Optional CSS class name appended to the root `<section>` element. */
  className?: string;

  /** Optional id attribute for anchor linking and `aria-labelledby` binding. */
  id?: string;
}

/* =============================================================================
   SECTION 2: INTERNAL CHECKLIST ROW COMPONENT
   -----------------------------------------------------------------------------
   Co-located, non-exported component responsible for rendering a single
   checklist item row. Extracted for readability.
   ============================================================================= */

/**
 * Props for the internal ChecklistRow component.
 * Mirrors a subset of ChecklistItem since each row renders one item.
 */
interface ChecklistRowProps {
  /** Decorative icon node. */
  icon: React.ReactNode;
  /** Bold item title text. */
  title: string;
  /** Supporting description text. */
  description: string;
}

/**
 * ChecklistRow (internal)
 *
 * Renders a single checklist item with a decorative icon, bold title, and
 * description. The icon is hidden from assistive technology because the
 * title carries the semantic meaning.
 */
const ChecklistRow: React.FC<ChecklistRowProps> = ({ icon, title, description }) => (
  <>
    {/* Icon bullet: decorative, hidden from screen readers */}
    <span className="feature-checklist__icon" aria-hidden="true">
      {icon}
    </span>
    <div className="feature-checklist__item-body">
      <span className="feature-checklist__item-title">{title}</span>
      <p className="feature-checklist__item-description">{description}</p>
    </div>
  </>
);

/* =============================================================================
   SECTION 3: MAIN COMPONENT IMPLEMENTATION
   ============================================================================= */

/**
 * FeatureChecklist
 *
 * Renders a two-column section with an optimised image on one side and a
 * checklist of benefits on the other. Column order is controlled by the
 * `imageFirst` prop, and the layout collapses to a single column on mobile
 * with the image always appearing first.
 *
 * @param props - Configuration conforming to FeatureChecklistProps
 * @returns A `<section>` element containing the two-column layout
 */
export const FeatureChecklist: React.FC<FeatureChecklistProps> = ({
  eyebrow,
  heading,
  items,
  imageSrc,
  imageWebP,
  imageAvif,
  imageAlt,
  imageFirst = true,
  backgroundColor = 'primary',
  className,
  id,
}) => {
  /**
   * Generate a stable, unique id for the heading element.
   * If the consumer provides an explicit `id` prop, derive the heading id
   * from it. Otherwise, React's `useId` hook produces a collision-free id.
   */
  const reactId = useId();
  const headingId = id ? `${id}-heading` : `feature-checklist-heading-${reactId}`;

  /**
   * Assemble the root element's CSS class list using BEM methodology:
   * - Block: `feature-checklist`
   * - Modifier for background: `feature-checklist--bg-{primary|secondary}`
   * - Modifier for column order: `feature-checklist--image-first` (conditional)
   * - Consumer-provided className appended last for override specificity.
   */
  const rootClassName = [
    'feature-checklist',
    `feature-checklist--bg-${backgroundColor}`,
    imageFirst ? 'feature-checklist--image-first' : '',
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
      <div className="feature-checklist__inner">

        {/* Media column: optimised image with 1:1 aspect ratio container */}
        <div className="feature-checklist__media">
          <OptimizedImage
            src={imageSrc}
            srcSetWebP={imageWebP}
            srcSetAvif={imageAvif}
            alt={imageAlt}
            className="feature-checklist__picture"
            imgClassName="feature-checklist__image"
          />
        </div>

        {/* Text column: eyebrow, heading, and checklist of benefits */}
        <div className="feature-checklist__text">
          <span className="feature-checklist__eyebrow">
            {eyebrow}
          </span>
          <h2 className="feature-checklist__heading" id={headingId}>
            {heading}
          </h2>

          {/* Benefit list rendered as a semantic list for assistive technologies */}
          <ul className="feature-checklist__list" role="list">
            {items.map((item) => (
              <li className="feature-checklist__item" key={item.id}>
                <ChecklistRow
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                />
              </li>
            ))}
          </ul>
        </div>

      </div>
    </section>
  );
};
