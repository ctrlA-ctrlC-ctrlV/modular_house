/**
 * FeatureSection Component
 * =============================================================================
 *
 * PURPOSE:
 * A responsive content section designed to showcase features with a split header
 * layout and multi-column grid. On viewports narrower than 650px, the feature
 * grid transforms into an auto-cycling carousel with swipe/drag support.
 *
 * ARCHITECTURE:
 * This component follows the Open-Closed Principle: it accepts extensible props
 * for content customization while maintaining a closed internal structure.
 * All styling is delegated to the companion CSS file using BEM methodology.
 *
 * CAROUSEL BEHAVIOUR (< 650px):
 * - The entire section content (intro body + features) becomes a unified carousel.
 * - Slide 0: eyebrow heading, main heading, and introductory text.
 * - Slides 1..N: individual feature items, one per slide.
 * - Auto-cycles through all slides on a configurable interval (default 4 seconds).
 * - When the user swipes or drags the carousel, auto-cycling stops permanently
 *   for that session to respect user intent.
 * - Dot indicators reflect the active slide and allow direct navigation.
 * - Carousel logic is encapsulated in the co-located useCarousel hook.
 *
 * LAYOUT STRUCTURE:
 * - Container: Centers content with max-width constraint
 * - Desktop/Tablet (>= 650px):
 *   - Eyebrow: Optional overline text for section categorization
 *   - Split Header: Left-aligned heading, right-aligned intro text
 *   - Feature Grid: 4 columns (desktop) -> 2 columns (tablet) -> 1 column (mobile)
 * - Mobile (< 650px):
 *   - Unified carousel containing intro slide + feature slides
 *
 * ACCESSIBILITY:
 * - Uses semantic heading hierarchy (h2, h5, h6)
 * - Supports custom icon elements via ReactNode for accessible SVG handling
 * - Carousel region uses aria-roledescription="carousel" with live region
 * - Individual slides use aria-roledescription="slide" with labelling
 * - Dot indicators are accessible buttons with aria-label descriptions
 *
 * USAGE:
 * ```tsx
 * <FeatureSection
 *   topHeading="Our Services"
 *   mainHeading="What We Offer"
 *   introText={<p>We provide comprehensive solutions...</p>}
 *   features={[
 *     { icon: <IconComponent />, title: "Service 1", description: "..." },
 *     { icon: <IconComponent />, title: "Service 2", description: "..." },
 *   ]}
 * />
 * ```
 *
 * =============================================================================
 */

import React from 'react';
import { useCarousel } from './useCarousel';
import { useMediaQuery } from './useMediaQuery';
import './FeatureSection.css';


/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Strict TypeScript interfaces for component props.
   All optional properties include JSDoc descriptions for IDE support.
   ============================================================================= */

/**
 * Interface definition for a single feature item within the grid.
 * Each feature represents a service, capability, or key point to highlight.
 */
export interface FeatureItem {
  /**
   * The visual icon element for the feature.
   * Accepts React nodes including SVG components, img elements, or icon libraries.
   */
  icon: React.ReactNode;

  /**
   * The primary title text for the feature.
   * Should be concise and descriptive (2-4 words recommended).
   */
  title: string;

  /**
   * The descriptive text body for the feature.
   * Provides additional context about the feature or service.
   */
  description: string;
}

/**
 * Properties interface for the FeatureSection component.
 * All props are optional with sensible defaults provided in the component.
 */
export interface FeatureSectionProps {
  /**
   * Small overline text appearing above the main heading.
   * Used for section categorization or branding (e.g., "Our Services").
   * @default "Built on quality and trust"
   */
  topHeading?: string;

  /**
   * The primary H2 heading for the section.
   * Should be compelling and summarize the section's purpose.
   * @default "Elevate spaces with expertise"
   */
  mainHeading?: string;

  /**
   * Introductory text displayed next to the main heading.
   * Accepts ReactNode to allow rich text, multiple paragraphs, or custom formatting.
   * @default Two paragraphs describing commitment to quality
   */
  introText?: React.ReactNode;

  /**
   * Array of feature objects to be rendered in the grid layout.
   * Each item requires icon, title, and description properties.
   * @default []
   */
  features?: FeatureItem[];

  /**
   * Optional click handler for feature items.
   * Receives the clicked feature item and its index for custom handling.
   */
  onFeatureClick?: (feature: FeatureItem, index: number) => void;

  /**
   * Duration in milliseconds between automatic carousel transitions.
   * Only applies when the viewport is narrower than 650px.
   * @default 4000
   */
  carouselInterval?: number;
}


/* =============================================================================
   SECTION 2: CONSTANTS
   -----------------------------------------------------------------------------
   Component-level constants for responsive breakpoint detection.
   ============================================================================= */

/**
 * CSS media query string for detecting the carousel breakpoint.
 * When this query matches, the feature grid switches to carousel mode.
 */
const CAROUSEL_MEDIA_QUERY = '(max-width: 649px)';


/* =============================================================================
   SECTION 3: COMPONENT IMPLEMENTATION
   -----------------------------------------------------------------------------
   Functional component using React.FC with strict prop typing.
   Implements accessible markup with semantic HTML elements.
   Conditionally renders a carousel or grid layout based on viewport width.
   ============================================================================= */

/**
 * FeatureSection Component
 *
 * A responsive feature showcase section with split header and grid layout.
 * Transforms into an auto-cycling carousel on narrow viewports (< 650px).
 * Designed for displaying services, capabilities, or key selling points.
 *
 * @param props - Component properties conforming to FeatureSectionProps interface
 * @returns JSX.Element representing the feature section
 */
export const FeatureSection: React.FC<FeatureSectionProps> = ({
  topHeading = "Built on quality and trust",
  mainHeading = "Elevate spaces with expertise",
  introText = (
    <>
      <p>At Rebar, we are committed to delivering top-tier construction and renovation services. Our skilled team manages every detail, ensuring each project meets the highest standards of safety and quality.</p>
      <p>We blend innovation with proven methods, providing reliable solutions for residential, commercial, and industrial needs.</p>
    </>
  ),
  features = [],
  onFeatureClick,
  carouselInterval = 4000,
}) => {
  /**
   * Viewport detection: determines whether the carousel layout is active.
   * Uses the native matchMedia API via the useMediaQuery hook for
   * efficient, paint-synchronous breakpoint evaluation.
   */
  const isCarouselActive = useMediaQuery(CAROUSEL_MEDIA_QUERY);

  /**
   * Total carousel slide count: the intro content occupies the first slide
   * (index 0), followed by one slide per feature item. This places the
   * eyebrow, main heading, and intro text into the carousel flow rather
   * than rendering them as static content above the carousel.
   */
  const totalCarouselSlides = 1 + features.length;

  /**
   * Carousel state and interaction handlers.
   * The hook manages auto-cycling, slide navigation, and pointer-based
   * swipe detection. Auto-play is enabled only when the carousel breakpoint
   * matches and there are at least two slides (intro + one feature).
   */
  const carousel = useCarousel({
    totalSlides: totalCarouselSlides,
    autoPlayInterval: carouselInterval,
    autoPlay: isCarouselActive && totalCarouselSlides > 1,
  });

  /**
   * Handles click events on feature items.
   * Invokes the onFeatureClick callback if provided.
   *
   * @param feature - The clicked feature item
   * @param index - The index of the clicked feature in the array
   */
  const handleFeatureClick = (feature: FeatureItem, index: number): void => {
    if (onFeatureClick) {
      onFeatureClick(feature, index);
    }
  };

  /**
   * Handles dot indicator clicks.
   * Navigates to the selected slide and stops auto-cycling since
   * direct dot interaction qualifies as intentional user engagement.
   *
   * @param index - The target slide index
   */
  const handleDotClick = (index: number): void => {
    carousel.goToSlide(index);
  };

  /**
   * Renders a single feature item.
   * Extracted as a helper to avoid duplication between grid and carousel layouts.
   * Both layouts render identical feature markup for visual consistency.
   *
   * @param feature - The feature item data
   * @param index - The position index in the features array
   */
  const renderFeatureItem = (feature: FeatureItem, index: number): React.ReactNode => (
    <div
      key={index}
      className="feature-section__item"
      onClick={() => handleFeatureClick(feature, index)}
      role={onFeatureClick ? "button" : undefined}
      tabIndex={onFeatureClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onFeatureClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleFeatureClick(feature, index);
        }
      }}
    >
      {/*
        Icon wrapper with fixed dimensions.
        Ensures consistent sizing across different icon sources.
      */}
      <div className="feature-section__icon-wrapper">
        <span
          className="feature-section__icon"
          aria-hidden="true"
        >
          {feature.icon}
        </span>
      </div>

      {/*
        Content wrapper containing title and description.
        Uses semantic heading for proper document structure.
      */}
      <div className="feature-section__content">
        <h5 className="feature-section__item-title">
          {feature.title}
        </h5>
        <p className="feature-section__item-description">
          {feature.description}
        </p>
      </div>
    </div>
  );

  return (
    <section
      className="feature-section"
      aria-label="Features"
    >
      <div className="feature-section__container">
        {isCarouselActive && totalCarouselSlides > 1 ? (
          /* -------------------------------------------------------------------
             CAROUSEL MODE (< 650px)
             -------------------------------------------------------------------
             The entire section content is rendered inside a single carousel.
             Slide 0: eyebrow heading, main heading, and intro text.
             Slides 1..N: one feature item per slide.
             The track uses CSS translateX to shift between slides, and pointer
             events on the viewport detect swipe/drag gestures.
             ------------------------------------------------------------------- */
          <div
            className="feature-section__carousel"
            aria-roledescription="carousel"
            aria-label="Feature highlights"
          >
            {/*
              Carousel viewport: clips horizontal overflow to reveal one slide.
              Pointer event handlers are attached here for swipe/drag detection.
              touch-action: pan-y allows vertical page scrolling while
              horizontal drags are captured by the pointer handlers.
            */}
            <div
              className="feature-section__carousel-viewport"
              onPointerDown={carousel.onPointerDown}
              onPointerMove={carousel.onPointerMove}
              onPointerUp={carousel.onPointerUp}
              onPointerCancel={carousel.onPointerCancel}
            >
              {/*
                Carousel track: positions all slides in a horizontal row.
                The translateX value shifts based on the active index.
                Transition property provides smooth slide-to-slide animation.
              */}
              <div
                className="feature-section__carousel-track"
                style={{
                  transform: `translateX(-${carousel.activeIndex * 100}%)`,
                }}
                aria-live="off"
              >
                {/*
                  Slide 0 — Intro content slide.
                  Contains the eyebrow heading, main heading, and introductory
                  text. These elements are stacked vertically in a single slide
                  rather than rendered as static content above the carousel.
                */}
                <div
                  className="feature-section__carousel-slide"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`1 of ${totalCarouselSlides}: ${mainHeading}`}
                  aria-hidden={carousel.activeIndex !== 0}
                >
                  <div className="feature-section__carousel-intro">
                    {topHeading && (
                      <div className="feature-section__top-heading-wrapper">
                        <h2 className="feature-section__top-heading">
                          {topHeading}
                        </h2>
                      </div>
                    )}
                    <h2 className="feature-section__main-heading">
                      {mainHeading}
                    </h2>
                    <div className="feature-section__intro-text">
                      {introText}
                    </div>
                  </div>
                </div>

                {/*
                  Slides 1..N — Feature item slides.
                  Each feature occupies its own slide with identical markup
                  to the grid-mode feature items for visual consistency.
                */}
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="feature-section__carousel-slide"
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${index + 2} of ${totalCarouselSlides}: ${feature.title}`}
                    aria-hidden={index + 1 !== carousel.activeIndex}
                  >
                    {renderFeatureItem(feature, index)}
                  </div>
                ))}
              </div>
            </div>

            {/*
              Dot indicators: provide visual position feedback and direct
              navigation. The first dot represents the intro slide; subsequent
              dots represent feature slides.
            */}
            <div
              className="feature-section__carousel-dots"
              role="tablist"
              aria-label="Feature slides"
            >
              {Array.from({ length: totalCarouselSlides }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  className={`feature-section__carousel-dot${
                    index === carousel.activeIndex
                      ? ' feature-section__carousel-dot--active'
                      : ''
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-selected={index === carousel.activeIndex}
                  onClick={() => handleDotClick(index)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* -------------------------------------------------------------------
             GRID MODE (>= 650px or no features)
             -------------------------------------------------------------------
             Standard desktop/tablet layout: static eyebrow and split header
             above a responsive CSS grid of feature items. This path is
             unchanged from the original FeatureSection design.
             ------------------------------------------------------------------- */
          <>
            {/*
              Eyebrow heading for section categorisation.
              Conditionally rendered only when topHeading is provided.
            */}
            {topHeading && (
              <div className="feature-section__top-heading-wrapper">
                <h2 className="feature-section__top-heading">
                  {topHeading}
                </h2>
              </div>
            )}

            {/*
              Split layout container.
              Left column: Main display heading.
              Right column: Introductory text content.
            */}
            <div className="feature-section__split">
              <div className="feature-section__split-left">
                <h2 className="feature-section__main-heading">
                  {mainHeading}
                </h2>
              </div>
              <div className="feature-section__split-right">
                <div className="feature-section__intro-text">
                  {introText}
                </div>
              </div>
            </div>

            {/*
              Feature grid: renders items in a responsive CSS grid.
              4 columns (desktop) -> 2 columns (tablet) -> 1 column (small mobile).
            */}
            <div className="feature-section__grid">
              {features.map((feature, index) => renderFeatureItem(feature, index))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
