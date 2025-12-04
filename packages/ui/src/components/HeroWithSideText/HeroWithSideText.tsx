import React from 'react';
import './HeroWithSideText.css';

export interface HeroWithSideTextProps {
  backgroundImage?: string;
  subtitle?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  exploreText?: string;
  exploreLink?: string;
  className?: string;
}

export const HeroWithSideText: React.FC<HeroWithSideTextProps> = ({
  backgroundImage = 'https://rebar.themerex.net/wp-content/uploads/2024/05/image-copyright-66.jpg', // Default placeholder
  subtitle = 'The creative edge',
  title = 'Enhanced comfort made stylish, secure and durable',
  description = 'Upgrade your home with stylish, secure doors and energy-efficient windows',
  buttonText = 'Get Started',
  buttonLink = '#',
  exploreText = 'Explore',
  exploreLink = '#section-anchor-02',
  className = '',
}) => {
  return (
    <div 
      className={`hero-with-side-text ${className}`} 
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="hero-with-side-text__overlay"></div>
      <div className="hero-with-side-text__content-wrapper">
        <div className="hero-with-side-text__main-content">
          <div className="hero-with-side-text__subtitle-wrapper">
            <h6 className="hero-with-side-text__subtitle">{subtitle}</h6>
          </div>
          <div className="hero-with-side-text__title-wrapper">
            <h1 className="hero-with-side-text__title">
              {title}
            </h1>
          </div>
          <div className="hero-with-side-text__button-wrapper">
            <a className="hero-with-side-text__button" href={buttonLink}>
              <span className="hero-with-side-text__button-text">{buttonText}</span>
            </a>
          </div>
        </div>
        
        <div className="hero-with-side-text__side-content">
          <div className="hero-with-side-text__description-wrapper">
            <h5 className="hero-with-side-text__description">{description}</h5>
          </div>
          <div className="hero-with-side-text__explore-wrapper">
            <a href={exploreLink} className="hero-with-side-text__explore-link">
              <span className="hero-with-side-text__explore-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 31 40" width="20" height="26">
                  <path d="M15.5 0C15.9555 0 16.3923 0.180618 16.7144 0.502121C17.0365 0.823624 17.2175 1.25968 17.2175 1.71435V34.1499L28.026 23.3609C28.1833 23.1924 28.3729 23.0574 28.5835 22.9637C28.7942 22.87 29.0216 22.8196 29.2522 22.8155C29.4828 22.8114 29.7119 22.8538 29.9258 22.94C30.1396 23.0262 30.3339 23.1546 30.497 23.3174C30.6601 23.4802 30.7886 23.6741 30.875 23.8875C30.9614 24.101 31.0038 24.3296 30.9997 24.5598C30.9957 24.79 30.9452 25.017 30.8513 25.2273C30.7575 25.4376 30.6221 25.6269 30.4534 25.7838L16.7137 39.4986C16.3916 39.8197 15.9551 40 15.5 40C15.0449 40 14.6084 39.8197 14.2863 39.4986L0.546629 25.7838C0.37789 25.6269 0.242549 25.4376 0.14868 25.2273C0.05481 25.017 0.00433604 24.79 0.000267289 24.5598C-0.00380146 24.3296 0.0386185 24.101 0.124998 23.8875C0.211377 23.6741 0.339945 23.4802 0.503033 23.3174C0.66612 23.1546 0.860385 23.0262 1.07424 22.94C1.28809 22.8538 1.51716 22.8114 1.74776 22.8155C1.97836 22.8196 2.20579 22.87 2.41646 22.9637C2.62713 23.0574 2.81674 23.1924 2.97398 23.3609L13.7825 34.1499V1.71435C13.7825 1.25968 13.9635 0.823624 14.2856 0.502121C14.6077 0.180618 15.0445 0 15.5 0Z" fill="currentColor"></path>
                </svg>
              </span>
              <h6 className="hero-with-side-text__explore-text">{exploreText}</h6>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
