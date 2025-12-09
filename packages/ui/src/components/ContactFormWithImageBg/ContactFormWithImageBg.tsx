import React, { useState } from 'react';
import './ContactFormWithImageBg.css';

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  productType: string;
  message: string;
  consent: boolean;
  address: string; // Honeypot
}

export interface ContactFormWithImageBgProps {
  backgroundImage?: string;
  title?: string;
  onSubmit?: (data: ContactFormData) => Promise<void>;
}

export const ContactFormWithImageBg: React.FC<ContactFormWithImageBgProps> = ({
  backgroundImage = "https://rebar.themerex.net/wp-content/uploads/2025/08/background-04.jpg",
  title = "Have questions?\nGet in touch!",
  onSubmit
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    productType: '',
    message: '',
    consent: false,
    address: ''
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmit) return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      await onSubmit(formData);
      setStatus('success');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        productType: '',
        message: '',
        consent: false,
        address: ''
      });
    } catch (error) {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
      console.error(error);
    }
  };

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
        
        {status === 'success' ? (
          <div className="text-center py-10">
            <h4 className="text-xl font-bold text-green-600 mb-4">Thank you!</h4>
            <p className="text-gray-600">Your message has been sent successfully. We'll be in touch soon.</p>
            <button 
              onClick={() => setStatus('idle')}
              className="mt-6 text-orange-600 hover:underline"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="metform-form-content">
            {/* Honeypot Field (Hidden) */}
            <div style={{ display: 'none' }}>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Row 1: First Name & Surname */}
            <div className="mf-input-wrapper form-row-split">
              <div className="mf-input-half">
                <input
                  type="text"
                  className="mf-input"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name (required)"
                  required
                />
              </div>
              <div className="mf-input-half">
                <input
                  type="text"
                  className="mf-input"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Surname"
                />
              </div>
            </div>

            {/* Row 2: Email */}
            <div className="mf-input-wrapper">
              <input
                type="email"
                className="mf-input"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
              />
            </div>

            {/* Row 3: Phone Number */}
            <div className="mf-input-wrapper">
              <input
                type="tel"
                className="mf-input"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                required
              />
            </div>

            {/* Row 4: Type of product (Dropdown) */}
            <div className="mf-input-wrapper">
              <select 
                className="mf-input mf-select"
                name="productType"
                value={formData.productType}
                onChange={handleChange}
              >
                <option value="" disabled>Select Product Type</option>
                <option value="Garden Room">Garden Room</option>
                <option value="House Extension">House Extension</option>
              </select>
            </div>

            {/* Row 5: Message */}
            <div className="mf-input-wrapper">
              <textarea
                className="mf-input mf-textarea"
                name="message"
                value={formData.message}
                onChange={handleChange}
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
                    name="consent"
                    checked={formData.consent}
                    onChange={handleChange}
                    required
                  />
                  <span>
                    I agree that my submitted data is being <a href="/privacy-policy/" className="consent-link">collected and stored</a>.
                  </span>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {status === 'error' && (
              <div className="text-red-600 text-sm mb-4">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <div className="mf-btn-wraper">
              <button 
                type="submit" 
                className="metform-submit-btn"
                disabled={status === 'submitting'}
              >
                <span>{status === 'submitting' ? 'Sending...' : 'Send Message'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};