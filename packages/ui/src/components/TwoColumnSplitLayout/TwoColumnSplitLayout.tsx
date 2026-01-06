/**
 * TwoColumnSplitLayout Component
 * =============================================================================
 * 
 * PURPOSE:
 * A responsive two-column layout component designed for marketing sections,
 * about pages, and content-heavy areas. Supports multiple background variants
 * and flexible content placement with images and call-to-action buttons.
 * 
 * ARCHITECTURE:
 * This component follows the Open-Closed Principle: it accepts extensible props
 * for content customization while maintaining a closed internal structure.
 * Background variants are implemented using CSS modifier classes.
 * 
 * LAYOUT STRUCTURE:
 * - Left Column: Header (subtitle + title), description, text button, image
 * - Right Column: Image, description text, primary CTA button
 * 
 * ACCESSIBILITY:
 * - Uses semantic heading hierarchy (h1, h6)
 * - Buttons use native button elements for keyboard navigation
 * - Images include alt text for screen readers
 * 
 * USAGE:
 * ```tsx
 * <TwoColumnSplitLayout
 *   subtitle="Our Story"
 *   title="Building Excellence"
 *   description1="We deliver quality construction..."
 *   button1Text="Learn More"
 *   image1Src="/images/left.jpg"
 *   image2Src="/images/right.jpg"
 *   bottomText="Since 2012, we have been..."
 *   button2Text="Contact Us"
 *   backgroundColor="beige"
 *   onButton1Click={() => console.log('Button 1 clicked')}
 *   onButton2Click={() => console.log('Button 2 clicked')}
 * />
 * ```
 * 
 * =============================================================================
 */

import React from 'react';
import './TwoColumnSplitLayout.css';


/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Strict TypeScript interfaces for component props.
   All optional properties include JSDoc descriptions for IDE support.
   ============================================================================= */

/**
 * Background color variant options.
 * Determines the overall color scheme of the section.
 */
export type BackgroundVariant = 'beige' | 'white' | 'gray' | 'dark';

/**
 * Properties interface for the TwoColumnSplitLayout component.
 * All props are optional with sensible defaults provided in the component.
 */
export interface TwoColumnSplitLayoutProps {
  /**
   * Eyebrow text appearing above the main title.
   * Typically used for section categorization.
   * @default "Trusted through quality work"
   */
  subtitle?: string;
  
  /**
   * Main heading text for the section.
   * Supports multi-line content via white-space: pre-line.
   * @default "We shape & deliver lasting builds daily"
   */
  title?: string;
  
  /**
   * Primary description text in the left column.
   * Provides context about the section's main topic.
   * @default "Rebar is a top construction firm..."
   */
  description1?: string;
  
  /**
   * Text for the first button (text-link style).
   * Appears below the description in the left column.
   * @default "Get a free quote today"
   */
  button1Text?: string;

  /**
   * First button Link
   * @default "#"
   */
  button1Link?: string;
  
  
  /**
   * Source URL for the left column image.
   * Should be an optimized image for web display.
   * @default "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-39.jpg"
   */
  image1Src?: string;
  
  /**
   * Alt text for the left column image.
   * Provides accessibility description.
   * @default "Construction worker"
   */
  image1Alt?: string;
  
  /**
   * Source URL for the right column image.
   * Should be an optimized image for web display.
   * @default "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-38.jpg"
   */
  image2Src?: string;
  
  /**
   * Alt text for the right column image.
   * Provides accessibility description.
   * @default "Construction site"
   */
  image2Alt?: string;
  
  /**
   * Secondary description text in the right column.
   * Provides additional context below the right image.
   * @default "We value quality, safety, and teamwork..."
   */
  bottomText?: string; 
  
  /**
   * Text for the second button (primary CTA style).
   * Appears below the bottom text in the right column.
   * @default "Need more info?"
   */
  button2Text?: string;

  /**
   * Second button Link
   * @default "#"
   */
  button2Link?: string;
  
  /**
   * Background color variant for the section.
   * Options: 'beige', 'white', 'gray', 'dark'.
   * @default "beige"
   */
  backgroundColor?: BackgroundVariant;
  
}


/* =============================================================================
   SECTION 2: COMPONENT IMPLEMENTATION
   -----------------------------------------------------------------------------
   Functional component using React.FC with strict prop typing.
   Implements accessible markup with semantic HTML elements.
   ============================================================================= */

/**
 * TwoColumnSplitLayout Component
 * 
 * A responsive two-column layout for marketing and content sections.
 * Supports multiple background themes and flexible content arrangement.
 * 
 * @param props - Component properties conforming to TwoColumnSplitLayoutProps interface
 * @returns JSX.Element representing the two-column layout section
 */
export const TwoColumnSplitLayout: React.FC<TwoColumnSplitLayoutProps> = ({
  subtitle = "Trusted through quality work",
  title = "We shape & deliver lasting builds daily",
  description1 = "Rebar is a top construction firm dedicated to delivering high-quality building and renovation solutions for every client.",
  button1Text = "Get a free quote today",
  image1Src = "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-39.jpg",
  image1Alt = "Construction worker",
  image2Src = "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-38.jpg",
  image2Alt = "Construction site",
  bottomText = "We value quality, safety, and teamwork, making sure each project meets our high standards and client needs. Since 2012, we have become a trusted name for those seeking reliable and efficient building solutions.",
  button2Text = "Need more info?",
  backgroundColor = 'beige',
  button1Link= "#",
  button2Link= "#",
}) => {
  return (
    <section 
      className={`two-col-layout two-col-layout--bg-${backgroundColor}`}
      aria-label="Two column content section"
    >
      <div className="two-col-layout__container">
        <div className="two-col-layout__content">
          
          {/* 
            Left Column
            Contains: header (subtitle + title), description, text button, image
          */}
          <div className="two-col-layout__column">
            {/* 
              Header section with eyebrow subtitle and main title.
              Uses semantic heading elements for proper document structure.
            */}
            <div className="two-col-layout__header">
              <div id='two-col-layout__mini_heading'>
                <h6 className="two-col-layout__subtitle">
                  {subtitle}
                </h6>
              </div>
              <h1 className="two-col-layout__title">
                {title}
              </h1>
            </div>
            
            {/* 
              Description area with highlighted text and text-link button.
              Button includes arrow indicator for action affordance.
            */}
            <div className="two-col-layout__description">
              <p className="two-col-layout__description-highlight">
                {description1}
              </p>
              <a href={button1Link} className='two-col-layout__btn-text'>
                {button1Text}
              </a>              
            </div>

            {/* 
              Left image with push-down modifier.
              Modifier class aligns image bottom with right column content.
            */}
            <div className="two-col-layout__image-wrapper two-col-layout__image-wrapper--push-down">
              <img 
                src={image1Src} 
                alt={image1Alt}
                className="two-col-layout__image--left"
                loading="lazy"
              />
            </div>
          </div>

          {/* 
            Right Column
            Contains: image, description text, primary CTA button
          */}
          <div className="two-col-layout__column two-col-layout__column--right">
            {/* 
              Right image positioned at top of column.
              Uses lazy loading for performance optimization.
            */}
            <div>
              <img 
                src={image2Src} 
                alt={image2Alt}
                className="two-col-layout__image--right"
                loading="lazy"
              />
            </div>
            
            {/* 
              Bottom description with primary CTA button.
              Button uses native button element for accessibility.
            */}
            <div className="two-col-layout__description">
              <p className="two-col-layout__description-highlight">
                {bottomText}
              </p>
              <a href={button2Link} className='two-col-layout__btn-primary'>
                {button2Text}
              </a>   
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};