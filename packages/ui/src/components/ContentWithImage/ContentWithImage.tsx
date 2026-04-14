/**
 * ContentWithImage Component
 * =============================================================================
 *
 * PURPOSE:
 * A versatile two-column section that pairs editorial prose (multi-paragraph
 * narrative) with a single supporting image. Unlike `TwoColumnSplitLayout`,
 * which carries dual images and bullet lists, this component is optimised for
 * long-form story content with flexible column ordering.
 *
 * USE CASES:
 * - "Our Story" section on the About page
 * - Careers, Partnerships, or editorial intro blocks on marketing pages
 * - Product detail pages with narrative descriptions
 *
 * ARCHITECTURE:
 * - Follows BEM naming convention for CSS class generation.
 * - Respects the Open-Closed Principle: the public interface is stable and
 *   additive-only; internal rendering logic is isolated from callers.
 * - No "any" types are used; all props are strictly typed.
 * - Uses the shared `OptimizedImage` component for modern format delivery
 *   (AVIF/WebP/fallback) and lazy loading.
 *
 * ACCESSIBILITY:
 * - Root element is a `<section>` with `aria-labelledby` pointing at the
 *   heading's stable id, derived from the `id` prop or auto-generated.
 * - Single `<h2>` per section ensures correct heading hierarchy.
 * - `imageAlt` is required to enforce descriptive text for screen readers.
 * - All text-on-background combinations meet WCAG AA contrast requirements.
 *
 * =============================================================================
 */

import React, { useId } from 'react';
import { OptimizedImage } from '../OptimizedImage/OptimizedImage';
import './ContentWithImage.css';

/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Publicly exported types form the stable contract for this component.
   Consumers depend on these types for type-safe prop passing.
   ============================================================================= */

/**
 * Allowed aspect ratio values for the image container.
 * Mapped to CSS modifier classes that set the `aspect-ratio` property.
 */
export type ContentWithImageAspectRatio = '1:1' | '4:5' | '3:4' | '16:9';

/**
 * Background colour variants corresponding to brand design tokens.
 * - "primary" maps to `--brand-bg-primary` (near-white).
 * - "secondary" maps to `--brand-bg-secondary` (warm beige).
 */
export type ContentWithImageBackground = 'primary' | 'secondary';

/**
 * Props contract for the ContentWithImage component.
 *
 * All optional props carry sensible defaults documented via JSDoc `@default`
 * tags. Required props (`eyebrow`, `heading`, `children`, `imageSrc`,
 * `imageAlt`) enforce the minimum data needed for a valid, accessible render.
 */
export interface ContentWithImageProps {
  /** Uppercase eyebrow label displayed above the heading. */
  eyebrow: string;

  /** Main section heading rendered as an `<h2>` element. */
  heading: string;

  /**
   * Body content slot. Accepts ReactNode so callers can pass multiple `<p>`
   * elements or other block-level content for editorial prose.
   */
  children: React.ReactNode;

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
   * Aspect ratio applied to the image container via a CSS modifier class.
   * @default '4:5'
   */
  imageAspectRatio?: ContentWithImageAspectRatio;

  /**
   * When true, the image is placed in the left column (before the text).
   * When false, the image appears on the right (after the text).
   * @default false
   */
  imageFirst?: boolean;

  /**
   * Background colour variant for the section.
   * @default 'primary'
   */
  backgroundColor?: ContentWithImageBackground;

  /** Optional CSS class name appended to the root `<section>` element. */
  className?: string;

  /** Optional id attribute for anchor linking and `aria-labelledby` binding. */
  id?: string;
}

/* =============================================================================
   SECTION 2: HELPER UTILITIES
   ============================================================================= */

/**
 * Maps the aspect ratio prop value to its corresponding CSS modifier suffix.
 * The colon character in ratio strings (e.g. "4:5") is replaced with a hyphen
 * to produce valid CSS class names (e.g. "4-5").
 */
const aspectRatioToModifier = (ratio: ContentWithImageAspectRatio): string =>
  ratio.replace(':', '-');

/* =============================================================================
   SECTION 3: COMPONENT IMPLEMENTATION
   ============================================================================= */

/**
 * ContentWithImage
 *
 * Renders a two-column section with editorial text content on one side and
 * an optimised image on the other. Column order is controlled by the
 * `imageFirst` prop, and the layout collapses to a single column on mobile.
 *
 * @param props - Configuration conforming to ContentWithImageProps
 * @returns A `<section>` element containing the two-column layout
 */
export const ContentWithImage: React.FC<ContentWithImageProps> = ({
  eyebrow,
  heading,
  children,
  imageSrc,
  imageWebP,
  imageAvif,
  imageAlt,
  imageAspectRatio = '4:5',
  imageFirst = false,
  backgroundColor = 'primary',
  className,
  id,
}) => {
  /**
   * Generate a stable, unique id for the heading element. If the consumer
   * provides an explicit `id` prop, derive the heading id from it. Otherwise,
   * React's `useId` hook produces a collision-free id for SSR safety.
   */
  const reactId = useId();
  const headingId = id ? `${id}-heading` : `content-with-image-heading-${reactId}`;

  /**
   * Assemble the root element's CSS class list using BEM methodology:
   * - Block: `content-with-image`
   * - Modifier for background: `content-with-image--bg-{primary|secondary}`
   * - Modifier for column order: `content-with-image--image-first` (conditional)
   * - Consumer-provided className appended last for override specificity.
   */
  const rootClassName = [
    'content-with-image',
    `content-with-image--bg-${backgroundColor}`,
    imageFirst ? 'content-with-image--image-first' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  /**
   * Build the media container class with the aspect ratio modifier.
   * The modifier controls the CSS `aspect-ratio` property to reserve
   * layout space before the image loads, preventing CLS.
   */
  const mediaClassName = [
    'content-with-image__media',
    `content-with-image__media--ratio-${aspectRatioToModifier(imageAspectRatio)}`,
  ].join(' ');

  return (
    <section
      className={rootClassName}
      id={id}
      aria-labelledby={headingId}
    >
      {/* Inner container constrains content to the max-width and provides padding */}
      <div className="content-with-image__inner">

        {/* Text column: eyebrow, heading, and editorial body content */}
        <div className="content-with-image__text">
          <span className="content-with-image__eyebrow">
            {eyebrow}
          </span>
          <h2 className="content-with-image__heading" id={headingId}>
            {heading}
          </h2>
          <div className="content-with-image__body">
            {children}
          </div>
        </div>

        {/* Media column: optimised image with modern format delivery */}
        <div className={mediaClassName}>
          <OptimizedImage
            src={imageSrc}
            srcSetWebP={imageWebP}
            srcSetAvif={imageAvif}
            alt={imageAlt}
            className="content-with-image__picture"
            imgClassName="content-with-image__image"
          />
        </div>

      </div>
    </section>
  );
};
