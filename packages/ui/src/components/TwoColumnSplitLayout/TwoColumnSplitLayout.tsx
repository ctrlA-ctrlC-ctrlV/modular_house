import React from 'react';
import './TwoColumnSplitLayout.css';

export interface TwoColumnSplitLayoutProps {
  subtitle?: string;
  title?: string;
  description1?: string;
  button1Text?: string; // Replaces description2
  image1Src?: string;
  image2Src?: string;
  bottomText?: string;
  button2Text?: string; // New button
  backgroundColor?: 'beige' | 'white' | 'gray' | 'dark';
}

export const TwoColumnSplitLayout: React.FC<TwoColumnSplitLayoutProps> = ({
  subtitle = "Trusted through quality work",
  title = "We shape & deliver lasting builds daily",
  description1 = "Rebar is a top construction firm dedicated to delivering high-quality building and renovation solutions for every client.",
  button1Text = "Get a free quote today",
  image1Src = "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-39.jpg",
  image2Src = "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-38.jpg",
  bottomText = "We value quality, safety, and teamwork, making sure each project meets our high standards and client needs. Since 2012, we have become a trusted name for those seeking reliable and efficient building solutions.",
  button2Text = "Need more info?",
  backgroundColor = 'beige',
}) => {
  return (
    <div className={`two-col-layout two-col-layout--bg-${backgroundColor}`}>
      <div className="two-col-layout__container">
        <div className="two-col-layout__content">
          {/* Left Column */}
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
                src={image1Src} 
                alt="Construction worker" 
                className="two-col-layout__image--left"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="two-col-layout__column two-col-layout__column--right">
            <div>
              <img 
                src={image2Src} 
                alt="Construction site" 
                className="two-col-layout__image--right"
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
        </div>
      </div>
    </div>
  );
};