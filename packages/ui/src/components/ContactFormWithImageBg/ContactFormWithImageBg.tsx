import React from 'react';
import './ContactFormWithImageBg.css';

export interface ContactFormWithImageBgProps {
  backgroundImage?: string;
  title?: string;
  formAction?: string;
}

export const ContactFormWithImageBg: React.FC<ContactFormWithImageBgProps> = ({
  backgroundImage = "https://rebar.themerex.net/wp-content/uploads/2025/08/background-04.jpg",
  title = "Have questions?\nGet in touch!",
  formAction = "#"
}) => {
  return (
    <div 
      className="contact-form-split-section"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="contact-form-card">
        <div className="elementor-widget-container">
          <h3 className="contact-form-heading">
            {title.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}<br/>
              </React.Fragment>
            ))}
          </h3>
        </div>
        
        <form action={formAction} className="metform-form-content">
          {/* Row 1: First Name & Surname */}
          <div className="mf-input-wrapper form-row-split">
            <div className="mf-input-half">
              <input
                type="text"
                className="mf-input"
                name="mf-first-name"
                placeholder="First Name (required)"
                required
              />
            </div>
            <div className="mf-input-half">
              <input
                type="text"
                className="mf-input"
                name="mf-surname"
                placeholder="Surname"
              />
            </div>
          </div>

          {/* Row 2: Email */}
          <div className="mf-input-wrapper">
            <input
              type="email"
              className="mf-input"
              name="mf-email"
              placeholder="Email"
              required
            />
          </div>

          {/* Row 3: Phone Number */}
          <div className="mf-input-wrapper">
            <input
              type="tel"
              className="mf-input"
              name="mf-phone"
              placeholder="Phone Number"
            />
          </div>

          {/* Row 4: Type of product (Dropdown) */}
          <div className="mf-input-wrapper">
            <select 
              className="mf-input mf-select"
              name="mf-product-type"
              defaultValue=""
            >
              <option value="" disabled>Select Product Type</option>
              <option value="dog">Garden Room</option>
              <option value="cat">House Extension</option>
            </select>
          </div>

          {/* Row 5: Message */}
          <div className="mf-input-wrapper">
            <textarea
              className="mf-input mf-textarea"
              name="mf-message"
              placeholder="Message"
              cols={30}
              rows={4}
            ></textarea>
          </div>

          {/* Checkbox */}
          <div className="mf-input-wrapper">
            <div className="mf-checkbox-option">
              <label>
                <input
                  type="checkbox"
                  className="mf-input mf-checkbox-input"
                  name="mf-gdpr-consent"
                  required
                />
                <span>
                  I agree that my submitted data is being <a href="/privacy-policy/" className="consent-link">collected and stored</a>.
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mf-btn-wraper">
            <button type="submit" className="metform-submit-btn">
              <span>Send Message</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};