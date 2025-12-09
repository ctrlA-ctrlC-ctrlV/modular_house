import React from 'react';
import './NewsletterSection.css';

export interface NewsletterSectionProps {
  title?: string;
  onSubscribe?: (email: string) => void;
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({
  title = "Get the best blog stories into inbox!",
  onSubscribe,
}) => {
  return (
    <div className="newsletter-section">
      <div className="newsletter-container">
        <div className="newsletter-content-wrapper">
          
          {/* Left Side: Title */}
          <h2 className="newsletter-title">
            {title}
          </h2>
          
          {/* Right Side: Form */}
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <div className="newsletter-input-group">
                {/* Icon and Input Wrapper */}
                <div className="newsletter-input-wrapper">
                    <div className="newsletter-icon-container">
                        {/* Slightly smaller icon to match input height */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 17.893 15.383" className="newsletter-icon">
                            <g transform="translate(-893 -536)">
                                <path d="M4.833.316h8.333A4.867,4.867,0,0,1,16.6,1.466a4.715,4.715,0,0,1,1.338,3.617v5.833A4.715,4.715,0,0,1,16.6,14.533a4.867,4.867,0,0,1-3.429,1.15H4.833A4.867,4.867,0,0,1,1.4,14.533,4.715,4.715,0,0,1,.066,10.916V5.083A4.715,4.715,0,0,1,1.4,1.466,4.867,4.867,0,0,1,4.833.316Zm8.333,14.167a3.725,3.725,0,0,0,2.613-.829,3.582,3.582,0,0,0,.954-2.737V5.083a3.582,3.582,0,0,0-.954-2.737,3.725,3.725,0,0,0-2.613-.829H4.833a3.725,3.725,0,0,0-2.613.829,3.582,3.582,0,0,0-.954,2.737v5.833a3.582,3.582,0,0,0,.954,2.737,3.725,3.725,0,0,0,2.613.829Z" transform="translate(892.945 535.692)"></path>
                                <path d="M12,12.835a3.731,3.731,0,0,1-2.323-.772l-3.122-2.5a.72.72,0,1,1,.9-1.124l3.12,2.5a2.434,2.434,0,0,0,2.851,0l3.129-2.5a.72.72,0,0,1,.9,1.125l-3.13,2.5A3.731,3.731,0,0,1,12,12.835Z" transform="translate(889.942 533.134)"></path>
                            </g>
                        </svg>
                    </div>
                    <input 
                        type="email" 
                        className="newsletter-input" 
                        placeholder="Your Email Address" 
                    />
                </div>
                
                <button type="submit" className="newsletter-button">
                    Get Started
                </button>
            </div>
            
            <div className="newsletter-consent-wrapper">
                <label className="newsletter-consent-label">
                    <input type="checkbox" className="newsletter-checkbox" />
                    <span>I agree that my submitted data is being <a href="/privacy-policy/" className="newsletter-consent-link">collected and stored</a>.</span>
                </label>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};