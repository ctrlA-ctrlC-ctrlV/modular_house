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
  /** Contact phone number/wechat for Chinese customers */
  电话?: string;
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
  /** Description content below the heading. Accepts React nodes for rich content. */
  description?: React.ReactNode;
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

  /**
   * Pre-selects the "Preferred Product" dropdown when the form mounts.
   * Accepts a value matching the schema enum: 'Garden Room' or 'House Extension'.
   * When omitted, the dropdown defaults to the unselected placeholder state.
   * Typical use case: linking from a product page with a query parameter that
   * the consuming route maps to one of the enum values before passing it here.
   */
  defaultProduct?: 'Garden Room' | 'House Extension';

  /**
   * Pre-populates the message textarea when the form mounts.
   * Useful for pre-filling contextual information such as an interest
   * registration tag derived from URL query parameters.
   * When omitted, the textarea starts empty.
   */
  defaultMessage?: string;
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

const WeChatIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M4.93 1.34C4.17 2.74 2.58 4.55 1.16 5.66C1.59 6.16 2.22 7.17 2.51 7.74C4.26 6.36 6.13 4.21 7.35 2.24ZM8.08 13.23V15.81C8.08 17.3 7.92 19.18 6.61 20.63C7.04 20.94 7.96 21.91 8.28 22.41C9.98 20.6 10.36 17.87 10.36 15.86V15.27H12.12V16.92C12.12 17.82 11.74 18.27 11.4 18.5C11.74 19 12.17 20.08 12.31 20.67C12.67 20.22 13.25 19.7 16.28 17.82C16.1 17.37 15.86 16.51 15.74 15.9L14.23 16.76V13.23ZM17.84 8.1H19.56C19.36 10.09 19.07 11.9 18.59 13.53C18.16 12.03 17.87 10.43 17.64 8.76ZM7.24 10.13V12.42H14.84V11.72C15.18 12.15 15.49 12.62 15.67 12.89L16.22 12.06C16.51 13.68 16.87 15.22 17.35 16.62C16.44 18.3 15.22 19.65 13.57 20.69C14.02 21.15 14.79 22.16 15.04 22.66C16.44 21.71 17.57 20.56 18.5 19.2C19.22 20.54 20.15 21.64 21.28 22.48C21.64 21.8 22.46 20.81 23 20.33C21.67 19.52 20.65 18.27 19.86 16.76C20.9 14.34 21.51 11.47 21.89 8.1H22.66V5.82H18.43C18.73 4.5 18.95 3.15 19.13 1.77L16.67 1.36C16.31 4.69 15.65 7.92 14.41 10.13ZM5.3 6.11C4.26 8.35 2.61 10.65 1 12.17C1.45 12.73 2.2 14.07 2.45 14.63C2.88 14.2 3.31 13.71 3.74 13.16V22.59H6.2V9.61C6.68 8.82 7.08 8.05 7.47 7.29V8.98H14.95V3.26H13.14V6.83H12.15V1.34H10.18V6.83H9.21V3.26H7.47V6.88Z" />
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
    email: "info@email.com",
    电话: "+353 81 234 5678"
  },
  onSubmit,
  isSubmitting: externalIsSubmitting = false,
  submissionError,
  submissionSuccess,
  className = '',
  defaultProduct,
  defaultMessage,
}) => {
  /**
   * Initialize react-hook-form with Zod validation resolver.
   * Provides form state, validation, and submission handling.
   *
   * The defaultValues object seeds the form fields on mount. The
   * `defaultProduct` and `defaultMessage` props allow parent routes to
   * pre-populate the product dropdown and message textarea, typically
   * derived from URL query parameters (e.g. /contact?product=garden-room-25).
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
      website: '',
      preferredProduct: defaultProduct,
      message: defaultMessage,
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
            <div className="text-contact__description">{description}</div>

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
            <div className='text-contact__qr-code'>
              <img src='./resource/contact/modular_house_wechat_qr_code.jpg' alt='Modular House | Modular Home Contact QR Code'></img>
              <p>081 111 1111</p>
            </div>
            {/** 
            <div className='text-contact__qr-contact'>
              {contactInfo.电话 && (
                <div className="text-contact__info-item">
                  <div className="text-contact__info-icon">
                    <WeChatIcon/>
                  </div>
                  <span className="text-contact__info-text">{contactInfo.电话}</span>
                </div>
              )}
            </div>*/}
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
