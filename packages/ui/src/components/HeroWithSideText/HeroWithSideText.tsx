import React from 'react';
import './HeroWithSideText.css';

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
  /** Text for the explore link */

  /** Text for the explore link 
   * @default "Explore"
  */
  exploreText?: string;

  /** URL for the explore link 
   * @default "#"
  */
  exploreLink?: string;

  /** Optional extra classes for styling overrides 
   * @default ''
  */
  className?: string;
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
  exploreText = 'Explore',
  exploreLink = '#section-anchor-02',
  className = '',
}) => {
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
            {subtitle && <h6 className="hero-subtitle">{subtitle}</h6>}
            <h1 className="hero-title">{title}</h1>
            
            <div className="hero-cta-wrapper">
              <a href={button1Link} className="hero-button">
                {button1Text}
              </a>
            </div>
          </div>
        </div>

        {/* Footer Area: Split Left (Description) and Right (Explore) */}
        <div className="hero-footer-area">
          <div className="hero-footer-left">
            <p className="hero-description">{description}</p>
          </div>
          
          <div className="hero-footer-right">
            <a href={exploreLink} className="hero-explore-link">
              <span className="hero-explore-text">{exploreText}</span>
              <span className="hero-explore-icon">
                {/* Simple Down Arrow SVG */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M12 4V20M12 20L18 14M12 20L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};