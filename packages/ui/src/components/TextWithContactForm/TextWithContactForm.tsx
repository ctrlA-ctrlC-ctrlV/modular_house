/**
 * TextWithContactForm Component
 * =============================================================================
 * 
 * PURPOSE:
 * A responsive two-column layout combining informational content with a
 * contact form. The left column displays a heading, description, and contact
 * details, while the right column contains a validated form with GDPR consent.
 * Built following the Open-Closed Principle for extensibility.
 * 
 * FEATURES:
 * - Responsive layout (stacked mobile, side-by-side desktop)
 * - Form validation using react-hook-form with Zod schema
 * - Honeypot field for spam prevention
 * - Accessible form with ARIA attributes
 * - Loading and success/error state handling
 * - GDPR consent checkbox with privacy policy link
 * 
 * DEPENDENCIES:
 * - react-hook-form for form state management
 * - @hookform/resolvers for Zod integration
 * - TextWithContactForm.schema.ts for validation schema
 * - TextWithContactForm.css for component styling
 * 
 * ACCESSIBILITY:
 * - Form labels associated with inputs via htmlFor
 * - ARIA invalid attributes for error states
 * - Role="alert" for error messages
 * - Semantic HTML structure
 * 
 * =============================================================================
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { textContactFormSchema, type TextContactFormData } from './TextWithContactForm.schema';
import './TextWithContactForm.css';


/* =============================================================================
   TYPE RE-EXPORTS
   -----------------------------------------------------------------------------
   Re-export form data type for consumer convenience.
   ============================================================================= */

export type { TextContactFormData } from './TextWithContactForm.schema';


/* =============================================================================
   TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Strictly typed interfaces for component props and data structures.
   ============================================================================= */

/**
 * Contact information data structure.
 * All fields are optional to support partial contact displays.
 */
export interface ContactInfo {
  /** Physical address or location */
  address?: string;
  /** Phone number with country code */
  phone?: string;
  /** Email address */
  email?: string;
}

/**
 * Props interface for the TextWithContactForm component.
 * Follows the Open-Closed Principle by allowing content customization
 * via props without modification of the component itself.
 */
export interface TextWithContactFormProps {
  /** Eyebrow label displayed above the main heading */
  topLabel?: string;
  /** Main heading text for the section */
  heading?: string;
  /** Description paragraph below the heading */
  description?: string;
  /** Contact information to display in the left column */
  contactInfo?: ContactInfo;
  /** Callback invoked when form is submitted with valid data */
  onSubmit?: (data: TextContactFormData) => Promise<void> | void;
  /** External loading state indicator */
  isSubmitting?: boolean;
  /** Error message to display if form submission fails */
  submissionError?: string | null;
  /** Flag indicating successful form submission */
  submissionSuccess?: boolean;
  /** Optional additional CSS class names for styling overrides */
  className?: string;
}


/* =============================================================================
   ICON COMPONENTS
   -----------------------------------------------------------------------------
   SVG icon components for contact information display.
   Extracted as separate components for maintainability.
   ============================================================================= */

/**
 * Location pin icon for address display.
 */
const LocationIcon: React.FC = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

/**
 * Phone icon for telephone number display.
 */
const PhoneIcon: React.FC = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

/**
 * Email envelope icon for email address display.
 */
const EmailIcon: React.FC = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);


/* =============================================================================
   COMPONENT DEFINITION
   ============================================================================= */

/**
 * TextWithContactForm Component
 * 
 * Renders a two-column layout with informational content and a contact form.
 * Supports form validation, loading states, and success/error feedback.
 * 
 * The component follows the Open-Closed Principle by accepting customizable
 * content props while maintaining consistent structure and behavior.
 * 
 * @param props - Component properties conforming to TextWithContactFormProps
 * @returns JSX element representing the complete section
 */
export const TextWithContactForm: React.FC<TextWithContactFormProps> = ({
  topLabel = "COMMON QUESTIONS",
  heading = "Have inquiries? Reach out to us!",
  description = "We are here to assist you with any questions or concerns you may have. Feel free to reach out to us anytime.",
  contactInfo = {
    address: "1032 N 9th Ave, Tucson, AZ 85705, USA",
    phone: "+1 840 841 25 69",
    email: "info@email.com"
  },
  onSubmit,
  isSubmitting: externalIsSubmitting = false,
  submissionError,
  submissionSuccess,
  className = ''
}) => {
  /**
   * Initialize react-hook-form with Zod validation resolver.
   * Provides form state, validation, and submission handling.
   */
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formIsSubmitting },
    reset
  } = useForm<TextContactFormData>({
    resolver: zodResolver(textContactFormSchema),
    defaultValues: {
      gdprConsent: false,
      website: ''
    }
  });

  /**
   * Combined loading state from external prop and form state.
   * Allows parent components to control loading indication.
   */
  const isSubmitting = externalIsSubmitting || formIsSubmitting;

  /**
   * Form submission handler.
   * Invokes the onSubmit callback and resets form on success.
   */
  const onFormSubmit = async (data: TextContactFormData) => {
    if (onSubmit) {
      await onSubmit(data);
      if (!submissionError) {
        reset();
      }
    }
  };

  return (
    <section className={`text-contact ${className}`}>
      <div className="text-contact__container">
        <div className="text-contact__row">

          {/* =================================================================
              LEFT COLUMN: TEXT CONTENT
              Contains eyebrow label, heading, description, and contact info.
              ================================================================= */}
          <div className="text-contact__content">
            {topLabel && (
              <span className="text-contact__label">{topLabel}</span>
            )}
            <h2 className="text-contact__heading">{heading}</h2>
            <p className="text-contact__description">{description}</p>

            {/* Contact Information List */}
            <div className="text-contact__info-list">
              {contactInfo.address && (
                <div className="text-contact__info-item">
                  <div className="text-contact__info-icon">
                    <LocationIcon />
                  </div>
                  <span className="text-contact__info-text">{contactInfo.address}</span>
                </div>
              )}
              {contactInfo.phone && (
                <div className="text-contact__info-item">
                  <div className="text-contact__info-icon">
                    <PhoneIcon />
                  </div>
                  <span className="text-contact__info-text">{contactInfo.phone}</span>
                </div>
              )}
              {contactInfo.email && (
                <div className="text-contact__info-item">
                  <div className="text-contact__info-icon">
                    <EmailIcon />
                  </div>
                  <span className="text-contact__info-text">{contactInfo.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* =================================================================
              RIGHT COLUMN: CONTACT FORM
              Contains validated form with inputs and submit button.
              ================================================================= */}
          <div className="text-contact__form-column">
            {submissionSuccess ? (
              /* Success State: Display confirmation message */
              <div className="text-contact__success-message">
                <h3>Message Sent!</h3>
                <p>Thank you for contacting us. We will get back to you shortly.</p>
              </div>
            ) : (
              /* Form State: Display input form */
              <form 
                onSubmit={handleSubmit(onFormSubmit)} 
                noValidate 
                aria-label="Contact form"
              >
                <div className="text-contact__form-grid">
                  
                  {/* First Name Field */}
                  <div className="text-contact__form-group">
                    <label htmlFor="firstName" className="text-contact__label--field">
                      First Name <span className="text-contact__required">*</span>
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      className={`text-contact__input ${errors.firstName ? 'text-contact__input--error' : ''}`}
                      placeholder="Enter your first name"
                      aria-invalid={errors.firstName ? "true" : "false"}
                      {...register("firstName")}
                    />
                    {errors.firstName && (
                      <span className="text-contact__error" role="alert">
                        {errors.firstName.message}
                      </span>
                    )}
                  </div>

                  {/* Surname Field */}
                  <div className="text-contact__form-group">
                    <label htmlFor="surname" className="text-contact__label--field">
                      Surname
                    </label>
                    <input
                      id="surname"
                      type="text"
                      className={`text-contact__input ${errors.surname ? 'text-contact__input--error' : ''}`}
                      placeholder="Enter your surname"
                      aria-invalid={errors.surname ? "true" : "false"}
                      {...register("surname")}
                    />
                    {errors.surname && (
                      <span className="text-contact__error" role="alert">
                        {errors.surname.message}
                      </span>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="text-contact__form-group">
                    <label htmlFor="email" className="text-contact__label--field">
                      Email <span className="text-contact__required">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      className={`text-contact__input ${errors.email ? 'text-contact__input--error' : ''}`}
                      placeholder="Enter your email"
                      aria-invalid={errors.email ? "true" : "false"}
                      {...register("email")}
                    />
                    {errors.email && (
                      <span className="text-contact__error" role="alert">
                        {errors.email.message}
                      </span>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div className="text-contact__form-group">
                    <label htmlFor="phone" className="text-contact__label--field">
                      Phone <span className="text-contact__required">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      className={`text-contact__input ${errors.phone ? 'text-contact__input--error' : ''}`}
                      placeholder="Enter your number"
                      aria-invalid={errors.phone ? "true" : "false"}
                      {...register("phone")}
                    />
                    {errors.phone && (
                      <span className="text-contact__error" role="alert">
                        {errors.phone.message}
                      </span>
                    )}
                  </div>

                  {/* Address Field */}
                  <div className="text-contact__form-group">
                    <label htmlFor="address" className="text-contact__label--field">
                      First Line Address
                    </label>
                    <input
                      id="address"
                      type="text"
                      className={`text-contact__input ${errors.address ? 'text-contact__input--error' : ''}`}
                      placeholder="Enter your address"
                      aria-invalid={errors.address ? "true" : "false"}
                      {...register("address")}
                    />
                    {errors.address && (
                      <span className="text-contact__error" role="alert">
                        {errors.address.message}
                      </span>
                    )}
                  </div>

                  {/* Eircode Field */}
                  <div className="text-contact__form-group">
                    <label htmlFor="eircode" className="text-contact__label--field">
                      Eircode
                    </label>
                    <input
                      id="eircode"
                      type="text"
                      className={`text-contact__input ${errors.eircode ? 'text-contact__input--error' : ''}`}
                      placeholder="Enter your eircode"
                      aria-invalid={errors.eircode ? "true" : "false"}
                      {...register("eircode")}
                    />
                    {errors.eircode && (
                      <span className="text-contact__error" role="alert">
                        {errors.eircode.message}
                      </span>
                    )}
                  </div>

                  {/* Preferred Product Select */}
                  <div className="text-contact__form-group text-contact__form-group--full">
                    <label htmlFor="preferredProduct" className="text-contact__label--field">
                      Preferred Product
                    </label>
                    <select
                      id="preferredProduct"
                      className={`text-contact__select ${errors.preferredProduct ? 'text-contact__select--error' : ''}`}
                      aria-invalid={errors.preferredProduct ? "true" : "false"}
                      {...register("preferredProduct")}
                    >
                      <option value="">Select a product</option>
                      <option value="Garden Room">Garden Room</option>
                      <option value="House Extension">House Extension</option>
                    </select>
                    {errors.preferredProduct && (
                      <span className="text-contact__error" role="alert">
                        {errors.preferredProduct.message}
                      </span>
                    )}
                  </div>

                  {/* Honeypot Field - Hidden from users, catches bots */}
                  <div 
                    className="text-contact__honeypot" 
                    aria-hidden="true"
                  >
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      {...register("website")}
                    />
                  </div>

                  {/* Message Textarea */}
                  <div className="text-contact__form-group text-contact__form-group--full">
                    <label htmlFor="message" className="text-contact__label--field">
                      Message
                    </label>
                    <textarea
                      id="message"
                      className="text-contact__textarea"
                      placeholder="Enter your message"
                      {...register("message")}
                    />
                  </div>
                </div>

                {/* GDPR Consent Checkbox */}
                <div className="text-contact__checkbox-group">
                  <input
                    id="gdprConsent"
                    type="checkbox"
                    className="text-contact__checkbox"
                    {...register("gdprConsent")}
                  />
                  <label htmlFor="gdprConsent" className="text-contact__checkbox-label">
                    I agree that my submitted data is being{' '}
                    <a href="/privacy" className="text-contact__privacy-link">
                      collected and stored
                    </a>.
                  </label>
                </div>
                {errors.gdprConsent && (
                  <div className="text-contact__error" role="alert" style={{ marginBottom: '1rem' }}>
                    {errors.gdprConsent.message}
                  </div>
                )}

                {/* Submission Error Message */}
                {submissionError && (
                  <div className="text-contact__error-message" role="alert">
                    {submissionError}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="text-contact__submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
