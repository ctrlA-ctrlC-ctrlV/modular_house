/**
 * MiniFAQs Component
 * =============================================================================
 *
 * A responsive FAQ section component that displays frequently asked questions
 * in a clean, numbered list format with a decorative title. The component
 * follows the brand design system and integrates with Bootstrap 5 utilities.
 *
 * FEATURES:
 * - Decorative large title with serif typography
 * - Numbered FAQ items with vertical divider layout
 * - Sticky scrolling effect for visual interest
 * - Responsive breakpoints for mobile, tablet, and desktop
 * - Semantic HTML structure for accessibility
 *
 * ARCHITECTURE:
 * This component adheres to the Open-Closed Principle by exposing customization
 * through props while maintaining internal implementation stability. Extension
 * is achieved via the FAQItem interface without modifying core logic.
 *
 * USAGE:
 * ```tsx
 * <MiniFAQs
 *   title="Flooring"
 *   faqs={faqData}
 *   className="my-custom-class"
 * />
 * ```
 *
 * =============================================================================
 */

import React from 'react';
import './MiniFAQs.css';

/* =============================================================================
   TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Strict TypeScript interfaces ensure type safety and provide clear contracts
   for component consumers. All properties are explicitly typed to prevent
   runtime errors and improve developer experience through autocompletion.
   ============================================================================= */

/**
 * Represents a single FAQ entry within the list.
 * Each FAQ item contains a sequence number, title, and description text.
 */
export interface FAQItem {
  /** Display number for the FAQ item (e.g., "01", "02") */
  number: string;

  /** Heading text for the FAQ question or topic */
  title: string;

  /** Detailed description or answer text for the FAQ */
  description: string;
}

/**
 * Props interface for the MiniFAQs component.
 * All props except faqs are optional with sensible defaults.
 */
export interface MiniFAQsProps {
  /** Large decorative title displayed above the FAQ list */
  title?: string;

  /** Array of FAQ items to render in the list */
  faqs: FAQItem[];

  /** Optional CSS class name for custom styling extensions */
  className?: string;

  /** Optional click handler for FAQ item interactions */
  onFAQClick?: (item: FAQItem, index: number) => void;
}

/* =============================================================================
   MAIN COMPONENT
   ============================================================================= */

/**
 * MiniFAQs Component
 *
 * Renders a vertically stacked list of FAQ items with numbered indicators
 * and a decorative section title. Implements responsive breakpoints for
 * optimal viewing across device sizes.
 */
export const MiniFAQs: React.FC<MiniFAQsProps> = ({
  title = 'Modular',
  faqs,
  className = '',
  onFAQClick,
}) => {
  /* ---------------------------------------------------------------------------
     EVENT HANDLERS
     ---------------------------------------------------------------------------
     Standard DOM event handlers for FAQ item interactions. Uses native click
     events for interoperability with external systems.
     --------------------------------------------------------------------------- */

  /**
   * Handles click events on FAQ items. Invokes the optional callback prop
   * with the clicked item and its index.
   *
   * @param item - The clicked FAQ item data
   * @param index - Zero-based index of the clicked item
   */
  const handleItemClick = (item: FAQItem, index: number): void => {
    if (onFAQClick) {
      onFAQClick(item, index);
    }
  };

  /**
   * Handles keyboard interaction on FAQ items for accessibility.
   * Triggers click handler on Enter or Space key press.
   *
   * @param event - Standard DOM keyboard event
   * @param item - The focused FAQ item data
   * @param index - Zero-based index of the focused item
   */
  const handleItemKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
    item: FAQItem,
    index: number
  ): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleItemClick(item, index);
    }
  };

  /* ---------------------------------------------------------------------------
     RENDER
     --------------------------------------------------------------------------- */

  return (
    <section
      className={`mini-faqs ${className}`.trim()}
      aria-label="Frequently asked questions"
    >
      <div className="mini-faqs__container">
        {/* -----------------------------------------------------------------------
            Header Section
            Displays the large decorative title using serif typography.
            The title is optional and renders conditionally.
            ----------------------------------------------------------------------- */}
        {title && (
          <header className="mini-faqs__header">
            <h2 className="mini-faqs__title font-serif">{title}</h2>
          </header>
        )}

        {/* -----------------------------------------------------------------------
            FAQ List
            Semantic list of FAQ items with three-column grid layout.
            Each item contains number, divider, and content sections.
            ----------------------------------------------------------------------- */}
        <ul className="mini-faqs__list" role="list">
          {faqs.map((faq, index) => (
            <li
              key={`faq-item-${index}`}
              className="mini-faqs__item"
              onClick={() => handleItemClick(faq, index)}
              onKeyDown={(e) => handleItemKeyDown(e, faq, index)}
              tabIndex={onFAQClick ? 0 : undefined}
              role={onFAQClick ? 'button' : undefined}
              aria-label={
                onFAQClick
                  ? `View details for ${faq.title}`
                  : undefined
              }
            >
              {/* Number Column */}
              <div className="mini-faqs__number-wrapper">
                <span className="mini-faqs__number">{faq.number}</span>
              </div>

              {/* Vertical Divider */}
              <div className="mini-faqs__divider" aria-hidden="true" />

              {/* Content Column */}
              <div className="mini-faqs__content">
                <h3 className="mini-faqs__item-title">{faq.title}</h3>
                <p className="mini-faqs__description">{faq.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default MiniFAQs;
