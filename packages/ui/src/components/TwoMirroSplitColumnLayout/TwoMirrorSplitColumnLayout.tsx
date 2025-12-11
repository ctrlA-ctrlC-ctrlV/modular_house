import React from 'react';
import './TwoMirrorSplitColumnLayout.css';

export interface TwoMirrorSplitColumnLayoutProps {
  description1?: string;
  button1Text?: string;
  imageLSrc?: string;
  subtitle?: string;
  title?: string;
  imageRSrc?: string;
  bottomText?: string;
  button2Text?: string;
}

export const TwoMirrorSplitColumnLayout: React.FC<TwoMirrorSplitColumnLayoutProps> = ({
  bottomText = "We value quality, safety, and teamwork, making sure each project meets our high standards and client needs. Since 2012, we have become a trusted name for those seeking reliable and efficient building solutions.",
  button2Text = "Need more info?",
  imageLSrc = "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-39.jpg",
  subtitle = "Trusted through quality work",
  title = "We shape & deliver lasting builds daily",
  imageRSrc = "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-38.jpg",  
  description1 = "Rebar is a top construction firm dedicated to delivering high-quality building and renovation solutions for every client.",
  button1Text = "Get a free quote today",
}) => {
  return (
    <div className="two-col-layout">
      <div className="two-col-layout__container">
        <div className="two-col-layout__content">
            {/* Left Column */}
          <div className="two-col-layout__column two-col-layout__column--left">
            <div>
              <img 
                src={imageRSrc} 
                alt="Construction site" 
                className="two-col-layout__image--left"
              />
            </div>
            <div className="two-col-layout__description">
              <p className="two-col-layout__description-highlight">{bottomText}</p>
              {/* Button 2: Primary Button */}
              <button className="two-col-layout__btn-primary">
                {button2Text}
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="two-col-layout__column">
            <div className="two-col-layout__header">
              <h6 className="two-col-layout__subtitle">{subtitle}</h6>
              <h1 className="two-col-layout__title">{title}</h1>
            </div>
            
            <div className="two-col-layout__description">
              <p className="two-col-layout__description-highlight">{description1}</p>
              {/* Button 1: Text Style Button */}
              <button className="two-col-layout__btn-text">
                {button1Text} &rarr;
              </button>
            </div>

            {/* Added modifier class to push this image down */}
            <div className="two-col-layout__image-wrapper two-col-layout__image-wrapper--push-down">
              <img 
                src={imageLSrc} 
                alt="Construction worker" 
                className="two-col-layout__image--right"
              />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};