/**
 * ContactFormWithImageBg.tsx
 * 
 * A visually rich contact form component featuring a full-width background
 * image with an overlay form card. This component is designed for use in
 * call-to-action sections on landing pages or dedicated contact areas.
 * 
 * Features:
 * - Full-width background image with customizable source
 * - Right-aligned form card with modern styling
 * - Honeypot field for basic spam prevention
 * - Form state management (idle, submitting, success, error)
 * - Responsive layout adapting to mobile screens
 * 
 * This component is purely presentational and delegates form submission
 * handling to the parent component via the onSubmit callback.
 */

import React, { useState } from 'react';
import './ContactFormWithImageBg.css';

// ===========================================================================
// Types and Interfaces
// ===========================================================================

/**
 * ContactFormData Interface
 * 
 * Represents the data structure collected by the contact form.
 * This interface should match the expected payload for the API endpoint.
 */
export interface ContactFormData {
  /** User's first name (required field) */
  firstName: string;
  
  /** User's last name/surname (optional field) */
  lastName: string;
  
  /** User's email address for correspondence (required field) */
  email: string;
  
  /** User's phone number for contact (required field) */
  phone: string;
  
  /** Selected product type from dropdown (optional selection) */
  productType: string;
  
  /** Free-form message content from the user */
  message: string;
  
  /** GDPR consent checkbox state (required for submission) */
  consent: boolean;
  
  /**
   * Honeypot field for spam detection.
   * This field is hidden from users but visible to bots.
   * If populated, the submission should be rejected by the backend.
   */
  address: string;
}

/**
 * ContactFormWithImageBgProps Interface
 * 
 * Props accepted by the ContactFormWithImageBg component.
 * All props are optional with sensible defaults.
 */
export interface ContactFormWithImageBgProps {
  /**
   * URL of the background image displayed behind the form.
   * Supports any valid CSS background-image URL format.
   * @default External placeholder image URL
   */
  backgroundImage?: string;
  
  /**
   * Heading text displayed above the form.
   * Supports newline characters for multi-line headings.
   * @default "Have questions?\nGet in touch!"
   */
  title?: string;
  
  /**
   * Callback function invoked when the form is submitted.
   * Receives the form data and should return a Promise.
   * The component handles loading and error states internally.
   */
  onSubmit?: (data: ContactFormData) => Promise<void>;
}

// ===========================================================================
// Component Definition
// ===========================================================================

/**
 * ContactFormWithImageBg Component
 * 
 * Renders a contact form overlaid on a full-width background image.
 * The form is positioned to the right side on desktop and centered on mobile.
 * 
 * State Management:
 * - 'idle': Initial state, form is ready for input
 * - 'submitting': Form submission in progress, button disabled
 * - 'success': Submission successful, shows thank you message
 * - 'error': Submission failed, shows error message
 * 
 * @param props - Component configuration options
 */
export const ContactFormWithImageBg: React.FC<ContactFormWithImageBgProps> = ({
  backgroundImage = "https://rebar.themerex.net/wp-content/uploads/2025/08/background-04.jpg",
  title = "Have questions?\nGet in touch!",
  onSubmit
}) => {
  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  
  /**
   * Form data state containing all field values.
   * Initialized with empty strings and false for consent.
   */
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    productType: '',
    message: '',
    consent: false,
    address: '' // Honeypot field - should remain empty for legitimate users
  });

  /**
   * Form submission status for controlling UI states.
   * Determines whether to show the form, loading indicator, or result messages.
   */
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  
  /**
   * Error message to display when submission fails.
   * Only relevant when status is 'error'.
   */
  const [errorMessage, setErrorMessage] = useState('');

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  /**
   * Handles changes to form input fields.
   * Supports text inputs, selects, textareas, and checkboxes.
   * Updates the corresponding field in formData state.
   * 
   * @param e - Change event from the form element
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Type assertion needed to access 'checked' property for checkbox inputs
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      // For checkboxes, use the checked state; for other inputs, use value
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  /**
   * Handles form submission.
   * Validates that onSubmit callback is provided, manages loading state,
   * calls the callback with form data, and handles success/error responses.
   * 
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent default form submission behavior (page reload)
    e.preventDefault();
    
    // Early return if no submission handler is provided
    if (!onSubmit) return;

    // Set loading state and clear any previous errors
    setStatus('submitting');
    setErrorMessage('');

    try {
      // Invoke the parent-provided submission handler
      await onSubmit(formData);
      
      // On success, update status and reset form fields
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
      // On failure, update status and set error message
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
      console.error(error);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div 
      className="contact-form-split-section"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Form Card Container - White card overlay on the background image */}
      <div className="contact-form-card">
        {/* Heading Section */}
        <div className="elementor-widget-container">
          <h3 className="contact-form-heading">
            {/* Split title by newlines to create multi-line heading with <br/> tags */}
            {title.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}<br/>
              </React.Fragment>
            ))}
          </h3>
        </div>
        
        {/* Conditional Rendering: Success Message or Form */}
        {status === 'success' ? (
          // Success State - Shows confirmation message and option to send another
          <div className="text-center py-10">
            <h4 className="text-xl font-bold text-green-600 mb-4">Thank you!</h4>
            <p className="text-gray-600">
              Your message has been sent successfully. We'll be in touch soon.
            </p>
            <button 
              onClick={() => setStatus('idle')}
              className="mt-6 text-orange-600 hover:underline"
            >
              Send another message
            </button>
          </div>
        ) : (
          // Form State - Shows the contact form
          <form onSubmit={handleSubmit} className="metform-form-content">
            {/* 
              Honeypot Field (Hidden from Users)
              
              This is a spam prevention technique. The field is hidden via CSS
              (display: none) so legitimate users cannot see or fill it.
              Automated bots often fill all fields, including hidden ones.
              The backend should reject submissions where this field has a value.
            */}
            <div style={{ display: 'none' }}>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Row 1: First Name and Surname - Split into two columns */}
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

            {/* Row 2: Email Address */}
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

            {/* Row 4: Product Type Selection Dropdown */}
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

            {/* Row 5: Message Textarea */}
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

            {/* GDPR Consent Checkbox - Required for form submission */}
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
                    I agree that my submitted data is being{' '}
                    <a href="/privacy-policy/" className="consent-link">
                      collected and stored
                    </a>.
                  </span>
                </label>
              </div>
            </div>

            {/* Error Message Display - Only shown when status is 'error' */}
            {status === 'error' && (
              <div className="text-red-600 text-sm mb-4">
                {errorMessage}
              </div>
            )}

            {/* Submit Button - Disabled during submission */}
            <div className="mf-btn-wraper">
              <button 
                type="submit" 
                className="metform-submit-btn"
                disabled={status === 'submitting'}
              >
                <span>
                  {status === 'submitting' ? 'Sending...' : 'Send Message'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};