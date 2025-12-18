import React from 'react';
import './HeroBoldBottomText.css';

export interface HeroBoldBottomTextProps {
  titleLine1?: string;
  titleLine2?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
  bigText?: string;
}

export const HeroBoldBottomText: React.FC<HeroBoldBottomTextProps> = ({
  titleLine1 = "Transform your living spaces with our expert building team.",
  titleLine2 = "We create projects tailored to your vision.",
  ctaText = "Get Started",
  ctaLink = "#",
  backgroundImage = "https://rebar.themerex.net/wp-content/uploads/2025/08/background-06.jpg",
  bigText = "Remodeling"
}) => {
  return (
    <div className="hero-bold-bottom-text" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="hero-bold-bottom-text__overlay"></div>
      <div className="hero-bold-bottom-text__content">
        <div className="hero-bold-bottom-text__info-group">
           <div className="hero-bold-bottom-text__title-wrapper">
              <h4 className="hero-bold-bottom-text__title">
                <span className="hero-bold-bottom-text__title-line">{titleLine1}</span>
                <span className="hero-bold-bottom-text__title-line">{titleLine2}</span>
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
