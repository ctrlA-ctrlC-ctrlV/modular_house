/**
 * FeatureSection Component
 * =============================================================================
 * 
 * PURPOSE:
 * A responsive content section designed to showcase features with a split header
 * layout and multi-column grid. Ideal for service pages, landing pages, and
 * marketing content.
 * 
 * ARCHITECTURE:
 * This component follows the Open-Closed Principle: it accepts extensible props
 * for content customization while maintaining a closed internal structure.
 * All styling is delegated to the companion CSS file using BEM methodology.
 * 
 * LAYOUT STRUCTURE:
 * - Container: Centers content with max-width constraint
 * - Eyebrow: Optional overline text for section categorization
 * - Split Header: Left-aligned heading, right-aligned intro text
 * - Feature Grid: 4 columns (desktop) -> 2 columns (tablet) -> 1 column (mobile)
 * 
 * ACCESSIBILITY:
 * - Uses semantic heading hierarchy (h2, h5, h6)
 * - Supports custom icon elements via ReactNode for accessible SVG handling
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
}


/* =============================================================================
   SECTION 2: COMPONENT IMPLEMENTATION
   -----------------------------------------------------------------------------
   Functional component using React.FC with strict prop typing.
   Implements accessible markup with semantic HTML elements.
   ============================================================================= */

/**
 * FeatureSection Component
 * 
 * A responsive feature showcase section with split header and grid layout.
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
}) => {
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

  return (
    <section 
      className="feature-section"
      aria-label="Features"
    >
      <div className="feature-section__container">
        {/* 
          Eyebrow heading for section categorization.
          Conditionally rendered only when topHeading is provided.
        */}
        {topHeading && (
          <div className="feature-section__top-heading-wrapper">
            <h6 className="feature-section__top-heading">
              {topHeading}
            </h6>
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
          Feature grid container.
          Renders feature items in a responsive grid layout.
          Grid adapts from 4 columns to 2 columns to 1 column based on viewport.
        */}
        <div className="feature-section__grid">
          {features.map((feature, index) => (
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
          ))}
        </div>
      </div>
    </section>
  );
};