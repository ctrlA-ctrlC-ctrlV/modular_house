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
 * - Uses semantic heading hierarchy (h2, a)
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
import { LinkRenderer } from '../../types';
import { OptimizedImage } from '../OptimizedImage/OptimizedImage';


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
   * Source URL for the left column image (fallback format — PNG or JPEG).
   * Should point to the original file; the WebP/AVIF alternatives are provided
   * via the companion props below.
   * @default "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-39.jpg"
   */
  image1Src?: string;

  /**
   * WebP source URL for the left column image.
   * Served to browsers that support WebP (all modern browsers).
   * Typically 30 % smaller than the PNG/JPEG equivalent.
   */
  image1WebP?: string;

  /**
   * AVIF source URL for the left column image.
   * Served to browsers that support AVIF (Chrome 85+, Firefox 93+, Safari 16.4+).
   * Typically 50+ % smaller than JPEG.
   */
  image1Avif?: string;

  /**
   * Intrinsic pixel width of image 1.
   * Prevents Cumulative Layout Shift (CLS) by reserving layout space before
   * the image has downloaded.
   */
  image1Width?: number;

  /**
   * Intrinsic pixel height of image 1.
   * Used alongside image1Width for CLS prevention.
   */
  image1Height?: number;

  /**
   * Alt text for the left column image.
   * Provides accessibility description for screen readers.
   * @default "Construction worker"
   */
  image1Alt?: string;

  /**
   * Source URL for the right column image (fallback format — PNG or JPEG).
   * @default "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-38.jpg"
   */
  image2Src?: string;

  /**
   * WebP source URL for the right column image.
   */
  image2WebP?: string;

  /**
   * AVIF source URL for the right column image.
   */
  image2Avif?: string;

  /**
   * Intrinsic pixel width of image 2 for CLS prevention.
   */
  image2Width?: number;

  /**
   * Intrinsic pixel height of image 2 for CLS prevention.
   */
  image2Height?: number;

  /**
   * Alt text for the right column image.
   * Provides accessibility description for screen readers.
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
   * Click handler for button1 - use for client-side routing (e.g. navigate('/contact'))
   * When provided, prevents default anchor behavior to enable SPA navigation
   */
  onButton1Click?: (e: React.MouseEvent<HTMLAnchorElement>) => void;

  /**
   * Click handler for button2 - use for client-side routing
   * When provided, prevents default anchor behavior to enable SPA navigation
   */
  onButton2Click?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  
  /**
   * Background color variant for the section.
   * Options: 'beige', 'white', 'gray', 'dark'.
   * @default "beige"
   */
  backgroundColor?: BackgroundVariant;
  
  /**
   * Optional custom link renderer.
   * Use this to integrate client-side routing (e.g., React Router).
   * If not provided, standard <a> tags will be used.
   */
  renderLink?: LinkRenderer;
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
  image1WebP,
  image1Avif,
  image1Width,
  image1Height,
  image1Alt = "Construction worker",
  image2Src = "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-38.jpg",
  image2WebP,
  image2Avif,
  image2Width,
  image2Height,
  image2Alt = "Construction site",
  bottomText = "We value quality, safety, and teamwork, making sure each project meets our high standards and client needs. Since 2012, we have become a trusted name for those seeking reliable and efficient building solutions.",
  button2Text = "Need more info?",
  backgroundColor = 'beige',
  button1Link= "#",
  button2Link= "#",
  onButton1Click,
  onButton2Click,
  renderLink,
}) => {
  // Handler that enables SPA navigation when onClick is provided
  const handleButton1Click = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onButton1Click) {
      e.preventDefault(); // Prevent full page reload for client-side routing
      onButton1Click(e);
    }
  };

  const handleButton2Click = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onButton2Click) {
      e.preventDefault();
      onButton2Click(e);
    }
  };

  /**
   * Helper component to render links using either standard <a> tags or the injected renderLink prop.
   */
  const LinkItem: React.FC<{
    href: string;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
    children: React.ReactNode;
  }> = ({ href, className, onClick, children }) => {
    if (renderLink) {
      return <>{renderLink({ href, className, onClick, children })}</>;
    }
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  };

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
              <a className="two-col-layout__subtitle">
                {subtitle}
              </a>
              <h2 className="two-col-layout__title">
                {title}
              </h2>
            </div>
            
            {/* 
              Description area with highlighted text and text-link button.
              Button includes arrow indicator for action affordance.
            */}
            <div className="two-col-layout__description">
              <p className="two-col-layout__description-highlight">
                {description1}
              </p>
              <LinkItem href={button1Link} className='two-col-layout__btn-text' onClick={handleButton1Click}>
                {button1Text}
              </LinkItem>              
            </div>

            {/*
              Left image with push-down modifier.
              Modifier class aligns image bottom with right column content.

              OptimizedImage is used here to enable:
              - Modern format delivery (AVIF → WebP → fallback)
              - CLS prevention via explicit width / height dimensions
              - Native lazy loading (loading="lazy") for below-the-fold content
            */}
            <div className="two-col-layout__image-wrapper two-col-layout__image-wrapper--push-down">
              <OptimizedImage
                src={image1Src}
                alt={image1Alt}
                srcSetAvif={image1Avif}
                srcSetWebP={image1WebP}
                width={image1Width}
                height={image1Height}
                imgClassName="two-col-layout__image--left"
                sizes="(max-width: 1024px) 100vw, 50vw"
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
              OptimizedImage delivers the most efficient format the browser
              supports, with CLS prevention via explicit dimensions.
            */}
            <div>
              <OptimizedImage
                src={image2Src}
                alt={image2Alt}
                srcSetAvif={image2Avif}
                srcSetWebP={image2WebP}
                width={image2Width}
                height={image2Height}
                imgClassName="two-col-layout__image--right"
                sizes="(max-width: 1024px) 100vw, 50vw"
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
              <LinkItem href={button2Link} className='two-col-layout__btn-primary' onClick={handleButton2Click}>
                {button2Text}
              </LinkItem>   
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};