import React from 'react';
import './HeroWithSideText.css';
import { LinkRenderer } from '../../types';

export interface HeroWithSideTextProps {
  /** Background image URL */
  backgroundImage?: string;
  /** Small uppercase text above the main title 
   * @default "subtitleText"
  */
  subtitle?: string;

  /** Main heading. Can pass JSX for specific coloring (e.g. <span>) 
   * @default "titleText"
  */
  title?: React.ReactNode;

  /** Text content for the bottom-left description 
   * @default "descriptionText"
  */ 
  description?: string;

  /** Text inside the Call to Action button 
   * @default "button1Text"
  */
  button1Text?: string;

  /** URL for the CTA button 
   * @default "#"
  */
  button1Link?: string;

  /** Click handler for CTA button - use for client-side routing (e.g. navigate('/contact'))
   * When provided, prevents default anchor behavior to enable SPA navigation
   */
  onButton1Click?: (e: React.MouseEvent<HTMLAnchorElement>) => void;

  /** Text for the explore link 
   * @default "Explore"
  */
  exploreText?: string;

  /** URL for the explore link 
   * @default "#"
  */
  exploreLink?: string;

  /** Click handler for explore link - use for client-side routing
   * When provided, prevents default anchor behavior to enable SPA navigation
   */
  onExploreClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;

  /** Optional extra classes for styling overrides 
   * @default ''
  */
  className?: string;

  /**
   * Optional custom link renderer.
   * Use this to integrate client-side routing (e.g., React Router).
   * If not provided, standard <a> tags will be used.
   */
  renderLink?: LinkRenderer;
}

/**
 * HeroWithSideText
 * * A full-screen hero component featuring a right-aligned main content area
 * and a split footer (description on left, explore link on right).
 */
export const HeroWithSideText: React.FC<HeroWithSideTextProps> = ({
  backgroundImage = 'https://rebar.themerex.net/wp-content/uploads/2024/05/image-copyright-66.jpg',
  subtitle = 'The creative edge',
  title = (
    <>
      Enhanced comfort made <br />
      stylish, <span className="text-highlight">secure and durable</span>
    </>
  ),
  description = 'Upgrade your home with stylish, secure doors and energy-efficient windows',
  button1Text = 'button1Text',
  button1Link = '#',
  onButton1Click,
  exploreText = 'Explore',
  exploreLink = '#section-anchor-02',
  onExploreClick,
  className = '',
  renderLink,
}) => {
  // Handler that enables SPA navigation when onClick is provided
  const handleButton1Click = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onButton1Click) {
      e.preventDefault(); // Prevent full page reload for client-side routing
      onButton1Click(e);
    }
  };

  /**
   * Click handler for the Explore button.
   * If a custom click handler is provided (e.g., for client-side routing), it is executed first.
   * Otherwise, if the link targets an internal anchor ID, smooth scrolling is triggered.
   * 
   * @param e - The mouse event from the anchor element
   */
  const handleExploreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Priority 1: Execute custom handler if provided (typically for SPA navigation)
    if (onExploreClick) {
      e.preventDefault();
      onExploreClick(e);
      return;
    }

    // Priority 2: Improve detailed experience by enabling smooth scrolling for internal anchor links 
    if (exploreLink && exploreLink.startsWith('#')) {
      const targetId = exploreLink.substring(1);
      const targetElement = document.getElementById(targetId);

      // Only prevent default jump if the target element actually exists on the page
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
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
    <div 
      className={`hero-container ${className}`} 
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Dark overlay to ensure text readability against image */}
      <div className="hero-overlay"></div>

      <div className="hero-content-wrapper">
        
        {/* Main Content Area: Centered Vertically, Aligned Right */}
        <div className="hero-main-area">
          <div className="hero-text-block">
            {subtitle && <a className="hero-subtitle">{subtitle}</a>}
            <h1 className="hero-title">{title}</h1>
            
            <div className="hero-cta-wrapper">
              <LinkItem href={button1Link} className="hero-button" onClick={handleButton1Click}>
                {button1Text}
              </LinkItem>
            </div>
          </div>
        </div>

        {/* Footer Area: Split Left (Description) and Right (Explore) */}
        <div className="hero-footer-area">
          <div className="hero-footer-left">
            <p className="hero-description">{description}</p>
          </div>
          
          <div className="hero-footer-right">
            <LinkItem href={exploreLink} className="hero-explore-link" onClick={handleExploreClick}>
              <span className="hero-explore-text">{exploreText}</span>
              <span className="hero-explore-icon">
                {/* Simple Down Arrow SVG */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M12 4V20M12 20L18 14M12 20L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </LinkItem>
          </div>
        </div>

      </div>
    </div>
  );
};