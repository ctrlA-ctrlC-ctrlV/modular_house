/**
 * HeroBoldBottomText Component
 * =============================================================================
 * 
 * PURPOSE:
 * A high-impact hero component designed for landing pages and marketing sections.
 * Features a full-viewport background image with bottom-aligned bold typography
 * and an optional call-to-action button.
 * 
 * ARCHITECTURE:
 * This component follows the Open-Closed Principle: it accepts extensible props
 * for content customization while maintaining a closed internal structure.
 * All styling is delegated to the companion CSS file using BEM methodology.
 * 
 * ACCESSIBILITY:
 * - Uses semantic HTML with role="banner" for screen reader identification
 * - Implements proper heading hierarchy (h1 for display text, h4 for title)
 * - CTA uses native anchor element for keyboard navigation support
 * 
 * USAGE:
 * ```tsx
 * <HeroBoldBottomText
 *   titleLine1="Transform your living spaces."
 *   titleLine2="Expert building team."
 *   ctaText="Get Started"
 *   ctaLink="/contact"
 *   bigText="Remodeling"
 *   backgroundImage="/images/hero-bg.jpg"
 * />
 * ```
 * 
 * =============================================================================
 */

import React from 'react';
import './HeroBoldBottomText.css';
import { LinkRenderer } from '../../types';

/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Strict TypeScript interfaces for component props.
   All optional properties include JSDoc descriptions for IDE support.
   ============================================================================= */

/**
 * Properties interface for the HeroBoldBottomText component.
 * All props are optional with sensible defaults provided in the component.
 */
export interface HeroBoldBottomTextProps {
  /**
   * The first segment of the primary heading.
   * Rendered in white text color for contrast against dark overlays.
   * @default "Transform your living spaces."
   */
  titleLine1?: string;
  
  /**
   * The second segment of the primary heading.
   * Rendered in accent color (amber) for visual hierarchy.
   * @default "Expert building team."
   */
  titleLine2?: string;
  
  /**
   * Label text displayed on the call-to-action button.
   * Should be concise and action-oriented (e.g., "Get Started", "Learn More").
   * @default "Get Started"
   */
  ctaText?: string;
  
  /**
   * Target URL for the call-to-action link.
   * Accepts relative paths, absolute URLs, or anchor links.
   * @default "#"
   */
  ctaLink?: string;
  
  /**
   * URL for the hero background image.
   * Supports both local assets and external URLs.
   * @default "https://rebar.themerex.net/wp-content/uploads/2025/08/background-06.jpg"
   */
  backgroundImage?: string;
  
  /**
   * Large stylized text displayed at the bottom of the hero.
   * Typically a single word representing the page theme or service.
   * @default "Remodeling"
   */
  bigText?: string;
  
  /**
   * Standard DOM click event handler for the CTA button.
   * Enables custom click behavior while maintaining anchor navigation.
   */
  onCtaClick?: React.MouseEventHandler<HTMLAnchorElement>;

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
 * HeroBoldBottomText Component
 * 
 * A hero section component featuring a full-viewport background image
 * with bottom-aligned bold typography and call-to-action functionality.
 * 
 * @param props - Component properties conforming to HeroBoldBottomTextProps interface
 * @returns JSX.Element representing the hero section
 */
export const HeroBoldBottomText: React.FC<HeroBoldBottomTextProps> = ({
  titleLine1 = "Transform your living spaces.",
  titleLine2 = "Expert building team.",
  ctaText = "Get Started",
  ctaLink = "#",
  backgroundImage = "https://rebar.themerex.net/wp-content/uploads/2025/08/background-06.jpg",
  bigText = "Remodeling",
  onCtaClick,
  renderLink,
}) => {

  /**
   * Helper component to render links using either standard <a> tags or the injected renderLink prop.
   */
  const LinkItem: React.FC<{
    href: string;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
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
    <div 
      className="hero-bold-bottom-text" 
      style={{ backgroundImage: `url(${backgroundImage})` }}
      role="banner"
      aria-label="Hero section"
    >
      {/* 
        Overlay element for background darkening.
        Improves text legibility against varied background images.
        The overlay uses CSS opacity rather than rgba for easier customization.
      */}
      <div 
        className="hero-bold-bottom-text__overlay"
        aria-hidden="true"
      />

      {/* 
        Content wrapper establishing z-index stacking context.
        All interactive elements are contained within this wrapper.
      */}
      <div className="hero-bold-bottom-text__content">
        
        {/* 
          Information group containing title and CTA.
          Positioned to the right on desktop, full-width on mobile.
        */}
        <div className="hero-bold-bottom-text__info-group">
          <div className="hero-bold-bottom-text__title-wrapper">
            {/* 
              Heading element using h4 for proper document hierarchy.
              The h1 is reserved for the large display text below.
            */}
            <h4 className="hero-bold-bottom-text__title">
              {/* 
                Primary title segment.
                Uses inline display for horizontal alignment with secondary segment.
              */}
              <span className="hero-bold-bottom-text__title-line">
                {titleLine1}
              </span>
              {/* 
                Secondary title segment.
                Applies accent color modifier for visual differentiation.
              */}
              <span className="hero-bold-bottom-text__title-line hero-bold-bottom-text__title-line--secondary">
                {titleLine2}
              </span>
            </h4>
          </div>
           
          <div className="hero-bold-bottom-text__cta-wrapper">
            {/* 
              Call-to-action anchor element.
              Uses native anchor for keyboard navigation and SEO benefits.
              The onClick handler enables custom behavior while preserving navigation.
            */}
            <LinkItem 
              href={ctaLink} 
              className="hero-bold-bottom-text__cta"
              onClick={onCtaClick}
            >
              <span className="hero-bold-bottom-text__cta-text">
                {ctaText}
              </span>
            </LinkItem>
          </div>
        </div>

        {/* 
          Large display text wrapper.
          Contains the oversized typographic element for visual impact.
        */}
        <div className="hero-bold-bottom-text__big-text-wrapper">
          {/* 
            Primary heading element for the page.
            Uses h1 for SEO significance and document structure.
            The large font size is handled via CSS viewport units.
          */}
          <h1 className="hero-bold-bottom-text__big-text">
            {bigText}
          </h1>
        </div>
      </div>
    </div>
  );
};