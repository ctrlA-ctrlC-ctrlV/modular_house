import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactFormSchema, ContactFormData } from './TextWithContactForm.schema';
import './TextWithContactForm.css';

export interface ContactInfo {
  address?: string;
  phone?: string;
  email?: string;
}

export interface TextWithContactFormProps {
  /**
   * Small label above the main heading
   */
  topLabel?: string;
  /**
   * Main heading text
   */
  heading?: string;
  /**
   * Description text below the heading
   */
  description?: string;
  /**
   * Contact information to display
   */
  contactInfo?: ContactInfo;
  /**
   * Callback when form is submitted
   */
  onSubmit?: (data: ContactFormData) => Promise<void> | void;
  /**
   * Whether the form is currently submitting
   */
  isSubmitting?: boolean;
  /**
   * Error message to display if submission fails
   */
  submissionError?: string | null;
  /**
   * Success message to display if submission succeeds
   */
  submissionSuccess?: boolean;
}

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

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
  submissionSuccess
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formIsSubmitting },
    reset
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      gdprConsent: false
    }
  });

  const isSubmitting = externalIsSubmitting || formIsSubmitting;

  const onFormSubmit = async (data: ContactFormData) => {
    if (onSubmit) {
      await onSubmit(data);
      if (!submissionError) {
        reset();
      }
    }
  };

  return (
    <section className="text-with-contact-form-section">
      <div className="text-with-contact-form-container">
        <div className="text-with-contact-form-row">
          {/* Left Column */}
          <div className="text-content-column">
            {topLabel && <span className="common-questions-label">{topLabel}</span>}
            <h2 className="main-heading">{heading}</h2>
            <p className="description-text">{description}</p>

            <div className="contact-info-list">
              {contactInfo.address && (
                <div className="contact-info-item">
                  <div className="contact-icon-wrapper">
                    <LocationIcon />
                  </div>
                  <span className="contact-text">{contactInfo.address}</span>
                </div>
              )}
              {contactInfo.phone && (
                <div className="contact-info-item">
                  <div className="contact-icon-wrapper">
                    <PhoneIcon />
                  </div>
                  <span className="contact-text">{contactInfo.phone}</span>
                </div>
              )}
              {contactInfo.email && (
                <div className="contact-info-item">
                  <div className="contact-icon-wrapper">
                    <EmailIcon />
                  </div>
                  <span className="contact-text">{contactInfo.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="form-column">
            {submissionSuccess ? (
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-green-800">
                <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                <p>Thank you for contacting us. We will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onFormSubmit)} noValidate aria-label="Contact form">
                <div className="contact-form-grid">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      Name <span className="required-asterisk">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="Enter your name"
                      aria-invalid={errors.name ? "true" : "false"}
                      {...register("name")}
                    />
                    {errors.name && (
                      <span className="form-error-message" role="alert">{errors.name.message}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email <span className="required-asterisk">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      className={`form-input ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="Enter your email"
                      aria-invalid={errors.email ? "true" : "false"}
                      {...register("email")}
                    />
                    {errors.email && (
                      <span className="form-error-message" role="alert">{errors.email.message}</span>
                    )}
                  </div>

                  <div className="form-group form-group-full">
                    <label htmlFor="phone" className="form-label">
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      className="form-input"
                      placeholder="Enter your number"
                      {...register("phone")}
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label htmlFor="message" className="form-label">
                      Message
                    </label>
                    <textarea
                      id="message"
                      className="form-textarea"
                      placeholder="Enter your message"
                      {...register("message")}
                    />
                  </div>
                </div>

                <div className="checkbox-group">
                  <input
                    id="gdprConsent"
                    type="checkbox"
                    className="checkbox-input"
                    {...register("gdprConsent")}
                  />
                  <label htmlFor="gdprConsent" className="checkbox-label">
                    I agree that my submitted data is being <a href="#" className="privacy-link">collected and stored</a>.
                  </label>
                </div>
                {errors.gdprConsent && (
                  <div className="form-error-message mb-4" role="alert">{errors.gdprConsent.message}</div>
                )}

                {submissionError && (
                  <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded text-red-700" role="alert">
                    {submissionError}
                  </div>
                )}

                <button
                  type="submit"
                  className="submit-button"
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
