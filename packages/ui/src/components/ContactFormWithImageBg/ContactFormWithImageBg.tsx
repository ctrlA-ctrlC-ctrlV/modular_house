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
 * 
 * Architecture:
 * This component follows the Open-Closed Principle by accepting callbacks
 * for form submission rather than handling API calls internally. State
 * management is encapsulated within the component for simplicity.
 * 
 * Dependencies:
 * - React 18 with standard DOM event handling
 * - ContactFormWithImageBg.css for styling (uses brand design tokens)
 */

import React, { useState } from 'react';
import './ContactFormWithImageBg.css';

/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   TypeScript interfaces for component props and form data structure.
   These interfaces ensure type safety and provide documentation for consumers.
   ============================================================================= */

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
   * 
   * @param data - The form data collected from user input
   * @returns Promise that resolves on success or rejects on failure
   */
  onSubmit?: (data: ContactFormData) => Promise<void>;
}

/* =============================================================================
   SECTION 2: COMPONENT DEFINITION
   -----------------------------------------------------------------------------
   Main component implementation with state management and event handlers.
   ============================================================================= */

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
 * @returns JSX element representing the contact form section
 */
export const ContactFormWithImageBg: React.FC<ContactFormWithImageBgProps> = ({
  backgroundImage = "https://rebar.themerex.net/wp-content/uploads/2025/08/background-04.jpg",
  title = "Have questions?\nGet in touch!",
  onSubmit
}) => {
  /* ---------------------------------------------------------------------------
     State Management
     --------------------------------------------------------------------------- */
  
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

  /* ---------------------------------------------------------------------------
     Event Handlers
     --------------------------------------------------------------------------- */

  /**
   * Handles changes to form input fields.
   * Supports text inputs, selects, textareas, and checkboxes.
   * Updates the corresponding field in formData state.
   * 
   * Uses standard DOM event types for interoperability with native HTML elements.
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
   * Uses standard DOM FormEvent for interoperability.
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

  /**
   * Resets the form to idle state.
   * Allows the user to send another message after success.
   */
  const handleReset = () => {
    setStatus('idle');
  };

  /* ---------------------------------------------------------------------------
     Render
     --------------------------------------------------------------------------- */

  return (
    <section 
      className="contact-form-bg"
      style={{ backgroundImage: `url(${backgroundImage})` }}
      aria-label="Contact form section"
    >
      {/* Form Card Container - White card overlay on the background image */}
      <div className="contact-form-bg__card">
        {/* Heading Section */}
        <div className="contact-form-bg__heading-wrapper">
          <h3 className="contact-form-bg__heading">
            {/* Split title by newlines to create multi-line heading with <br/> tags */}
            {title.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < title.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </h3>
        </div>
        
        {/* Conditional Rendering: Success Message or Form */}
        {status === 'success' ? (
          /* Success State - Shows confirmation message and option to send another */
          <div className="contact-form-bg__success">
            <h4 className="contact-form-bg__success-heading">Thank you!</h4>
            <p className="contact-form-bg__success-text">
              Your message has been sent successfully. We will be in touch soon.
            </p>
            <button 
              type="button"
              onClick={handleReset}
              className="contact-form-bg__reset-btn"
            >
              Send another message
            </button>
          </div>
        ) : (
          /* Form State - Shows the contact form */
          <form 
            onSubmit={handleSubmit} 
            className="contact-form-bg__form"
            noValidate
            aria-label="Contact form"
          >
            {/* 
              Honeypot Field (Hidden from Users)
              
              This is a spam prevention technique. The field is hidden via CSS
              so legitimate users cannot see or fill it. Automated bots often 
              fill all fields, including hidden ones. The backend should reject 
              submissions where this field has a value.
            */}
            <div className="contact-form-bg__honeypot" aria-hidden="true">
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
            <div className="contact-form-bg__field-group contact-form-bg__field-group--split">
              <div className="contact-form-bg__field-half">
                <input
                  type="text"
                  className="contact-form-bg__input"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name (required)"
                  required
                  aria-required="true"
                />
              </div>
              <div className="contact-form-bg__field-half">
                <input
                  type="text"
                  className="contact-form-bg__input"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Surname"
                />
              </div>
            </div>

            {/* Row 2: Email Address */}
            <div className="contact-form-bg__field-group">
              <input
                type="email"
                className="contact-form-bg__input"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
                aria-required="true"
              />
            </div>

            {/* Row 3: Phone Number */}
            <div className="contact-form-bg__field-group">
              <input
                type="tel"
                className="contact-form-bg__input"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                required
                aria-required="true"
              />
            </div>

            {/* Row 4: Product Type Selection Dropdown */}
            <div className="contact-form-bg__field-group">
              <select 
                className="contact-form-bg__input contact-form-bg__select"
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                aria-label="Select product type"
              >
                <option value="" disabled>Select Product Type</option>
                <option value="Garden Room">Garden Room</option>
                <option value="House Extension">House Extension</option>
              </select>
            </div>

            {/* Row 5: Message Textarea */}
            <div className="contact-form-bg__field-group">
              <textarea
                className="contact-form-bg__input contact-form-bg__textarea"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Message"
                cols={30}
                rows={4}
                aria-label="Message"
              ></textarea>
            </div>

            {/* GDPR Consent Checkbox - Required for form submission */}
            <div className="contact-form-bg__field-group">
              <div className="contact-form-bg__checkbox-group">
                <label className="contact-form-bg__checkbox-label">
                  <input
                    type="checkbox"
                    className="contact-form-bg__checkbox-input"
                    name="consent"
                    checked={formData.consent}
                    onChange={handleChange}
                    required
                    aria-required="true"
                  />
                  <span>
                    I agree that my submitted data is being{' '}
                    <a href="/privacy-policy/" className="contact-form-bg__consent-link">
                      collected and stored
                    </a>.
                  </span>
                </label>
              </div>
            </div>

            {/* Error Message Display - Only shown when status is 'error' */}
            {status === 'error' && (
              <div className="contact-form-bg__error" role="alert">
                {errorMessage}
              </div>
            )}

            {/* Submit Button - Disabled during submission */}
            <div className="contact-form-bg__btn-wrapper">
              <button 
                type="submit" 
                className="contact-form-bg__submit-btn"
                disabled={status === 'submitting'}
                aria-busy={status === 'submitting'}
              >
                <span>
                  {status === 'submitting' ? 'Sending...' : 'Send Message'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};