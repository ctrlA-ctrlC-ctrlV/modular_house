import React from 'react';
import './HeroBoldBottomText.css';

/**
 * Interface defining the properties for the HeroBoldBottomText component.
 */
export interface HeroBoldBottomTextProps {
  /** The first part of the primary heading. */
  titleLine1?: string;
  /** The second part of the primary heading, rendered in a secondary color. */
  titleLine2?: string;
  /** Label for the call-to-action button. */
  ctaText?: string;
  /** Target URL for the call-to-action link. */
  ctaLink?: string;
  /** URL for the hero background image. */
  backgroundImage?: string;
  /** Large stylized background text displayed at the bottom. */
  bigText?: string;
}

/**
 * A Hero component designed for high-impact visual landing pages.
 * Features a full-height background image and a horizontal dual-colored title.
 * * @param props - HeroBoldBottomTextProps
 * @returns JSX.Element
 */
export const HeroBoldBottomText: React.FC<HeroBoldBottomTextProps> = ({
  titleLine1 = "Transform your living spaces.",
  titleLine2 = "Expert building team.",
  ctaText = "Get Started",
  ctaLink = "#",
  backgroundImage = "https://rebar.themerex.net/wp-content/uploads/2025/08/background-06.jpg",
  bigText = "Remodeling"
}) => {
  return (
    <div 
      className="hero-bold-bottom-text" 
      style={{ backgroundImage: `url(${backgroundImage})` }}
      role="banner"
    >
      <div className="hero-bold-bottom-text__overlay"></div>

      <div className="hero-bold-bottom-text__content">
        <div className="hero-bold-bottom-text__info-group">
           <div className="hero-bold-bottom-text__title-wrapper">
              <h4 className="hero-bold-bottom-text__title">
                {/* Primary title segment. 
                  Rendered as inline to support horizontal alignment with the secondary segment.
                */}
                <span className="hero-bold-bottom-text__title-line">
                  {titleLine1}
                </span>
                {/* Secondary title segment. 
                  Applies a modifier class for color differentiation.
                */}
                <span className="hero-bold-bottom-text__title-line hero-bold-bottom-text__title-line--secondary">
                  {titleLine2}
                </span>
              </h4>
           </div>
           
           <div className="hero-bold-bottom-text__cta-wrapper">
             <a href={ctaLink} className="hero-bold-bottom-text__cta">
               <span className="hero-bold-bottom-text__cta-text">{ctaText}</span>
             </a>
           </div>
        </div>

        <div className="hero-bold-bottom-text__big-text-wrapper">
           <h1 className="hero-bold-bottom-text__big-text">{bigText}</h1>
        </div>
      </div>
    </div>
  );
};