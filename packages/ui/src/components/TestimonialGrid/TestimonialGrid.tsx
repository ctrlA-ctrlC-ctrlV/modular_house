/**
 * TestimonialGrid Component
 * =============================================================================
 *
 * A responsive testimonial carousel component that displays client feedback
 * in a horizontally scrollable grid layout. The component follows the brand
 * design system and integrates with Bootstrap 5 utility classes.
 *
 * FEATURES:
 * - Horizontal scroll with snap-to-item behavior
 * - Responsive layout: 4 items (desktop) -> 3 -> 2 -> 1 (mobile)
 * - Dot-based pagination synchronized with scroll position
 * - Star rating display with configurable rating value
 * - Accessible keyboard navigation and ARIA labels
 *
 * ARCHITECTURE:
 * This component adheres to the Open-Closed Principle by exposing customization
 * through props while maintaining internal implementation stability. Extension
 * is achieved via the TestimonialItem interface without modifying core logic.
 *
 * USAGE:
 * ```tsx
 * <TestimonialGrid
 *   subTitle="Client Reviews"
 *   title="What Our Clients Say"
 *   testimonials={testimonialData}
 * />
 * ```
 *
 * =============================================================================
 */

import React, { useState, useRef, useCallback } from 'react';
import './TestimonialGrid.css';

/* =============================================================================
   TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Strict TypeScript interfaces ensure type safety and provide clear contracts
   for component consumers. All properties are explicitly typed to prevent
   runtime errors and improve developer experience through autocompletion.
   ============================================================================= */

/**
 * Represents a single testimonial entry within the grid.
 * Each testimonial contains the review content and author metadata.
 */
export interface TestimonialItem {
  /** The testimonial text content displayed in the card body */
  text: string;

  /** Full name of the testimonial author */
  authorName: string;

  /** Geographic location or affiliation of the author */
  authorLocation: string;

  /** URL path to the author's profile image (optional display) */
  authorImageSrc: string;

  /**
   * Star rating value from 1 to 5.
   * Defaults to 5 if not provided.
   */
  rating?: number;
}

/**
 * Props interface for the TestimonialGrid component.
 * All props are optional with sensible defaults for immediate usage.
 */
export interface TestimonialGridProps {
  /** Eyebrow text displayed above the main title */
  subTitle?: string;

  /** Primary heading for the testimonial section */
  title?: string;

  /** Array of testimonial items to render in the grid */
  testimonials?: TestimonialItem[];

  /** Optional CSS class name for custom styling extensions */
  className?: string;

  /** Optional click handler for testimonial card interactions */
  onTestimonialClick?: (item: TestimonialItem, index: number) => void;
}

/* =============================================================================
   INTERNAL COMPONENTS
   -----------------------------------------------------------------------------
   Private sub-components that encapsulate specific UI elements. These are
   not exported to maintain a clean public API surface.
   ============================================================================= */

/**
 * StarIcon Component
 * Renders a single filled star SVG icon for rating display.
 * Uses currentColor for fill to inherit parent color styling.
 */
const StarIcon: React.FC = () => (
  <span className="testimonial-grid__star" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1792 1792">
      <path d="M1728 647q0 22-26 48l-363 354 86 500q1 7 1 20 0 21-10.5 35.5t-30.5 14.5q-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" />
    </svg>
  </span>
);

/* =============================================================================
   DEFAULT DATA
   -----------------------------------------------------------------------------
   Default testimonial entries used when no custom data is provided.
   Demonstrates the expected data structure for component consumers.
   ============================================================================= */

const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    text: 'Rebar made our dream home a reality. Their team was skilled, reliable, and always kept us informed. We felt supported from start to finish.',
    authorName: 'Emily Chen',
    authorLocation: 'San Francisco, CA',
    authorImageSrc: 'https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-25.jpg',
    rating: 5,
  },
  {
    text: 'Our office renovation was seamless. Rebar worked around our schedule and delivered a modern, functional space that exceeded our hopes.',
    authorName: 'Carlos Rivera',
    authorLocation: 'Los Angeles, CA',
    authorImageSrc: 'https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-24.jpg',
    rating: 5,
  },
  {
    text: 'We needed structural upgrades and Rebar handled every detail. Their expertise and clear updates made the process stress-free for us.',
    authorName: 'Sarah Miller',
    authorLocation: 'Austin, TX',
    authorImageSrc: 'https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-23.jpg',
    rating: 5,
  },
  {
    text: 'Rebar transformed our store with minimal downtime. The results were truly stunning, and our customers absolutely love the new look and feel.',
    authorName: 'David Singh',
    authorLocation: 'Laketown, CA',
    authorImageSrc: 'https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-22.jpg',
    rating: 5,
  },
];

/* =============================================================================
   COMPONENT CONSTANTS
   -----------------------------------------------------------------------------
   Configuration values extracted as constants for maintainability.
   Modifications to layout behavior can be made here without altering logic.
   ============================================================================= */

/** Number of testimonial cards visible at desktop breakpoint (1200px+) */
const ITEMS_VISIBLE_DESKTOP = 4;

/** Gap between testimonial cards in pixels (matches 2rem in CSS) */
const GAP_SIZE_PX = 32;

/* =============================================================================
   MAIN COMPONENT
   ============================================================================= */

/**
 * TestimonialGrid Component
 *
 * Renders a horizontally scrollable grid of testimonial cards with
 * synchronized dot pagination. Implements responsive breakpoints for
 * optimal viewing across device sizes.
 */
export const TestimonialGrid: React.FC<TestimonialGridProps> = ({
  subTitle = 'Building trust through our work',
  title = 'We deliver quality construction',
  testimonials = DEFAULT_TESTIMONIALS,
  className = '',
  onTestimonialClick,
}) => {
  /* ---------------------------------------------------------------------------
     STATE MANAGEMENT
     ---------------------------------------------------------------------------
     Active index tracks the current scroll position for dot synchronization.
     Scroll container ref provides direct DOM access for programmatic scrolling.
     --------------------------------------------------------------------------- */

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  /* ---------------------------------------------------------------------------
     COMPUTED VALUES
     ---------------------------------------------------------------------------
     Calculate the number of pagination dots based on total items and visible
     count. Formula: max(1, totalItems - visibleItems + 1)
     Example: 4 items with 4 visible = 1 dot; 5 items with 4 visible = 2 dots
     --------------------------------------------------------------------------- */

  const totalDots = Math.max(1, testimonials.length - ITEMS_VISIBLE_DESKTOP + 1);

  /* ---------------------------------------------------------------------------
     EVENT HANDLERS
     ---------------------------------------------------------------------------
     Standard DOM event handlers for scroll synchronization and programmatic
     navigation. Uses useCallback for referential stability in event binding.
     --------------------------------------------------------------------------- */

  /**
   * Programmatically scrolls the container to display the item at the
   * specified index position. Calculates offset based on card width and gap.
   *
   * @param index - Zero-based index of the target scroll position
   */
  const scrollToItem = useCallback(
    (index: number): void => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const card = container.querySelector(
        '.testimonial-grid__item'
      ) as HTMLElement | null;

      if (card) {
        const itemWidth = card.offsetWidth + GAP_SIZE_PX;
        container.scrollTo({
          left: itemWidth * index,
          behavior: 'smooth',
        });
        setActiveIndex(index);
      }
    },
    []
  );

  /**
   * Handles native scroll events to synchronize the active dot indicator
   * with the current scroll position. Clamps index to prevent overflow.
   *
   * @param event - Standard DOM scroll event (unused, reads from ref)
   */
  const handleScroll = useCallback((): void => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const card = container.querySelector(
      '.testimonial-grid__item'
    ) as HTMLElement | null;

    if (card) {
      const itemWidth = card.offsetWidth + GAP_SIZE_PX;
      const newIndex = Math.round(container.scrollLeft / itemWidth);
      const clampedIndex = Math.min(Math.max(0, newIndex), totalDots - 1);

      if (clampedIndex !== activeIndex) {
        setActiveIndex(clampedIndex);
      }
    }
  }, [activeIndex, totalDots]);

  /**
   * Handles click events on testimonial cards. Invokes the optional
   * callback prop with the clicked item and its index.
   *
   * @param item - The clicked testimonial item data
   * @param index - Zero-based index of the clicked item
   */
  const handleCardClick = useCallback(
    (item: TestimonialItem, index: number): void => {
      if (onTestimonialClick) {
        onTestimonialClick(item, index);
      }
    },
    [onTestimonialClick]
  );

  /**
   * Handles keyboard interaction on testimonial cards for accessibility.
   * Triggers click handler on Enter or Space key press.
   *
   * @param event - Standard DOM keyboard event
   * @param item - The focused testimonial item data
   * @param index - Zero-based index of the focused item
   */
  const handleCardKeyDown = useCallback(
    (
      event: React.KeyboardEvent<HTMLElement>,
      item: TestimonialItem,
      index: number
    ): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleCardClick(item, index);
      }
    },
    [handleCardClick]
  );

  /* ---------------------------------------------------------------------------
     RENDER
     --------------------------------------------------------------------------- */

  return (
    <section
      className={`testimonial-grid ${className}`.trim()}
      aria-label="Client testimonials"
    >
      <div className="testimonial-grid__container">
        {/* -----------------------------------------------------------------------
            Header Section
            Displays the eyebrow subtitle and main title using brand typography.
            Uses semantic heading hierarchy for accessibility.
            ----------------------------------------------------------------------- */}
        <header className="testimonial-grid__header">
          {subTitle && (
            <span className="testimonial-grid__subtitle text-eyebrow">
              {subTitle}
            </span>
          )}
          {title && (
            <h2 className="testimonial-grid__title font-serif">{title}</h2>
          )}
        </header>

        {/* -----------------------------------------------------------------------
            Testimonial Slider
            Horizontally scrollable container with scroll-snap behavior.
            Each card is focusable for keyboard navigation when interactive.
            ----------------------------------------------------------------------- */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="testimonial-grid__slider"
          role="region"
          aria-label="Testimonial cards"
        >
          {testimonials.map((item, index) => (
            <article
              key={`testimonial-${index}`}
              className="testimonial-grid__item"
              onClick={() => handleCardClick(item, index)}
              onKeyDown={(e) => handleCardKeyDown(e, item, index)}
              tabIndex={onTestimonialClick ? 0 : undefined}
              role={onTestimonialClick ? 'button' : undefined}
              aria-label={
                onTestimonialClick
                  ? `View testimonial from ${item.authorName}`
                  : undefined
              }
            >
              <div className="testimonial-grid__card">
                {/* Rating Stars */}
                <div
                  className="testimonial-grid__rating"
                  role="img"
                  aria-label={`Rating: ${item.rating || 5} out of 5 stars`}
                >
                  <span className="testimonial-grid__stars">
                    {[...Array(item.rating || 5)].map((_, starIndex) => (
                      <StarIcon key={`star-${starIndex}`} />
                    ))}
                  </span>
                </div>

                {/* Testimonial Quote Text */}
                <blockquote className="testimonial-grid__text">
                  <p>&ldquo;{item.text}&rdquo;</p>
                </blockquote>

                {/* Author Information Footer */}
                <footer className="testimonial-grid__author">
                  <div className="testimonial-grid__author-info">
                    <cite className="testimonial-grid__author-name">
                      {item.authorName}
                    </cite>
                    <span className="testimonial-grid__author-location text-caption">
                      {item.authorLocation}
                    </span>
                  </div>
                </footer>
              </div>
            </article>
          ))}
        </div>

        {/* -----------------------------------------------------------------------
            Pagination Dots
            Visual indicators synchronized with scroll position.
            Each dot is an accessible button with descriptive aria-label.
            ----------------------------------------------------------------------- */}
        <nav
          className="testimonial-grid__dots"
          role="navigation"
          aria-label="Testimonial pagination"
        >
          {[...Array(totalDots)].map((_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              onClick={() => scrollToItem(index)}
              className={`testimonial-grid__dot ${
                index === activeIndex
                  ? 'testimonial-grid__dot--active'
                  : 'testimonial-grid__dot--inactive'
              }`}
              aria-label={`Go to testimonial group ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
            />
          ))}
        </nav>
      </div>
    </section>
  );
};

export default TestimonialGrid;