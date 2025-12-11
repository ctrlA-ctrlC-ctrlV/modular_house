import React from 'react';
import './FeatureSection.css';

export interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface FeatureSectionProps {
  topHeading?: string;
  mainHeading?: string;
  introText?: React.ReactNode;
  features?: FeatureItem[];
}

export const FeatureSection: React.FC<FeatureSectionProps> = ({
  topHeading = "Built on quality and trust",
  mainHeading = "Elevate spaces with expertise",
  introText = (
    <>
      <p>At Rebar, we are committed to delivering top-tier construction and renovation services. Our skilled team manages every detail, ensuring each project meets the highest standards of safety and quality.</p>
      <p>We blend innovation with proven methods, providing reliable solutions for residential, commercial, and industrial needs.</p>
    </>
  ),
  features = []
}) => {
  return (
    <div className="feature-section">
      <div className="feature-section__container">
        {topHeading && (
          <div className="feature-section__top-heading-wrapper">
            <h6 className="feature-section__top-heading">{topHeading}</h6>
          </div>
        )}
        
        <div className="feature-section__split">
          <div className="feature-section__split-left">
            <h1 className="feature-section__main-heading">{mainHeading}</h1>
          </div>
          <div className="feature-section__split-right">
            <div className="feature-section__intro-text">
              {introText}
            </div>
          </div>
        </div>

        <div className="feature-section__grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-section__item">
              <div className="feature-section__icon-wrapper">
                <span className="feature-section__icon">
                  {feature.icon}
                </span>
              </div>
              <div className="feature-section__content">
                <h5 className="feature-section__item-title">{feature.title}</h5>
                <p className="feature-section__item-description">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
