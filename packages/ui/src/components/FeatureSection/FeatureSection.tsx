import React from 'react';
import './FeatureSection.css';

/**
 * Interface definition for a single feature item within the grid.
 * Used to type the 'features' array in the main component props.
 */
export interface FeatureItem {
  /** The visual icon element (SVG or component) for the feature. */
  icon: React.ReactNode;
  /** The primary title text for the feature. */
  title: string;
  /** The descriptive text body for the feature. */
  description: string;
}

/**
 * Props interface for the FeatureSection component.
 * All props are optional with fallback default values defined in the component.
 */
export interface FeatureSectionProps {
  /** Small overline text appearing above the main heading. */
  topHeading?: string;
  /** The primary H1 heading for the section. */
  mainHeading?: string;
  /** * Introductory text displayed next to the main heading. 
   * Accepts ReactNode to allow rich text or paragraph structures.
   */
  introText?: React.ReactNode;
  /** Array of feature objects to be rendered in the grid layout. */
  features?: FeatureItem[];
}

/**
 * FeatureSection Component
 * * A responsive content section designed to display a header area (split layout)
 * followed by a grid of feature items.
 * * Architecture:
 * - Container: Limits max-width and centers content.
 * - Split Header: Left-aligned H1 and Right-aligned intro text (collapses on mobile).
 * - Grid: Auto-flowing grid for feature items (4 cols -> 2 cols -> 1 col).
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
  features = []
}) => {
  return (
    <div className="feature-section">
      <div className="feature-section__container">
        {/* Conditional rendering for the top overline heading */}
        {topHeading && (
          <div className="feature-section__top-heading-wrapper">
            <h6 className="feature-section__top-heading">{topHeading}</h6>
          </div>
        )}
        
        {/* Split Layout: Heading (Left) and Intro Text (Right) */}
        <div className="feature-section__split">
          <div className="feature-section__split-left">
            <h1 className="feature-section__main-heading">{mainHeading}</h1>
          </div>
          <div className="feature-section__split-right">
            <div className="feature-section__intro-text">
              {introText}
            </div>
          </div>
        </div>

        {/* Feature Grid: Renders list of FeatureItems */}
        <div className="feature-section__grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-section__item">
              <div className="feature-section__icon-wrapper">
                <span className="feature-section__icon">
                  {feature.icon}
                </span>
              </div>
              <div className="feature-section__content">
                <h5 className="feature-section__item-title">{feature.title}</h5>
                <p className="feature-section__item-description">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};