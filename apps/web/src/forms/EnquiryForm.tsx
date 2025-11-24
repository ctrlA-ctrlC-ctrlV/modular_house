import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enquiryFormSchema, EnquiryFormData, PRODUCT_OPTIONS } from './validation';
import { apiClient, ApiError, RateLimitError } from '../lib/apiClient';
import './EnquiryForm.css';

interface EnquiryFormProps {
  onSuccess?: (submissionId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface SubmissionState {
  status: 'idle' | 'submitting' | 'success' | 'error';
  message?: string;
  submissionId?: string;
}

export function EnquiryForm({ onSuccess, onError, className = '' }: EnquiryFormProps) {
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    status: 'idle'
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquiryFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      eircode: '',
      preferredProduct: undefined,
      message: '',
      consent: false,
      website: '' // Honeypot field
    }
  });

  const onSubmit: SubmitHandler<EnquiryFormData> = async (data) => {
    try {
      setSubmissionState({ status: 'submitting' });

      // Submit to API
      const response = await apiClient.submitEnquiry(data);

      if (response.ok && response.id) {
        setSubmissionState({
          status: 'success',
          message: 'Thank you for your enquiry! We will be in touch shortly.',
          submissionId: response.id
        });
        
        // Reset form
        reset();
        
        // Call success callback
        if (onSuccess) {
          onSuccess(response.id);
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      let errorMessage = 'An error occurred while submitting your enquiry. Please try again.';
      
      if (error instanceof RateLimitError) {
        errorMessage = 'You have submitted too many enquiries recently. Please wait before trying again.';
      } else if (error instanceof ApiError) {
        if (error.status === 400 && error.response?.validation) {
          errorMessage = 'Please check your form data and try again.';
        } else if (error.status >= 500) {
          errorMessage = 'Our servers are experiencing issues. Please try again later.';
        }
      }
      
      setSubmissionState({
        status: 'error',
        message: errorMessage
      });
      
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const handleConsentChange = (checked: boolean) => {
    setValue('consent', checked, { shouldValidate: true });
  };

  return (
    <div className={`enquiry-form ${className}`}>
      {submissionState.status === 'success' && (
        <div className="success-message" role="alert" aria-live="polite">
          <h3>Enquiry Submitted Successfully</h3>
          <p>{submissionState.message}</p>
        </div>
      )}
      
      {submissionState.status === 'error' && (
        <div className="error-message" role="alert" aria-live="polite">
          <h3>Submission Error</h3>
          <p>{submissionState.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Honeypot field - hidden from users */}
        <div style={{ display: 'none' }} aria-hidden="true">
          <label htmlFor="website">Website (leave blank)</label>
          <input
            type="text"
            id="website"
            {...register('website')}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName" className="required">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              {...register('firstName')}
              aria-invalid={errors.firstName ? 'true' : 'false'}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            />
            {errors.firstName && (
              <div id="firstName-error" className="field-error" role="alert">
                {errors.firstName.message}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              {...register('lastName')}
              aria-invalid={errors.lastName ? 'true' : 'false'}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            />
            {errors.lastName && (
              <div id="lastName-error" className="field-error" role="alert">
                {errors.lastName.message}
              </div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email" className="required">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              {...register('email')}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <div id="email-error" className="field-error" role="alert">
                {errors.email.message}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="required">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              {...register('phone')}
              aria-invalid={errors.phone ? 'true' : 'false'}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
            />
            {errors.phone && (
              <div id="phone-error" className="field-error" role="alert">
                {errors.phone.message}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="address" className="required">
            Address
          </label>
          <textarea
            id="address"
            rows={3}
            {...register('address')}
            aria-invalid={errors.address ? 'true' : 'false'}
            aria-describedby={errors.address ? 'address-error' : undefined}
          />
          {errors.address && (
            <div id="address-error" className="field-error" role="alert">
              {errors.address.message}
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="eircode" className="required">
              Eircode
            </label>
            <input
              type="text"
              id="eircode"
              {...register('eircode')}
              aria-invalid={errors.eircode ? 'true' : 'false'}
              aria-describedby={errors.eircode ? 'eircode-error' : undefined}
            />
            {errors.eircode && (
              <div id="eircode-error" className="field-error" role="alert">
                {errors.eircode.message}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="preferredProduct">
              Preferred Product
            </label>
            <select
              id="preferredProduct"
              {...register('preferredProduct')}
              aria-invalid={errors.preferredProduct ? 'true' : 'false'}
              aria-describedby={errors.preferredProduct ? 'preferredProduct-error' : undefined}
            >
              <option value="">Please select...</option>
              {PRODUCT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.preferredProduct && (
              <div id="preferredProduct-error" className="field-error" role="alert">
                {errors.preferredProduct.message}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            rows={5}
            placeholder="Tell us about your project requirements..."
            {...register('message')}
            aria-invalid={errors.message ? 'true' : 'false'}
            aria-describedby={errors.message ? 'message-error' : undefined}
          />
          {errors.message && (
            <div id="message-error" className="field-error" role="alert">
              {errors.message.message}
            </div>
          )}
        </div>

        <div className="form-group consent-group">
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              id="consent"
              {...register('consent')}
              aria-invalid={errors.consent ? 'true' : 'false'}
              aria-describedby={errors.consent ? 'consent-error' : undefined}
              onChange={(e) => handleConsentChange(e.target.checked)}
            />
            <label htmlFor="consent" className="checkbox-label required">
              I consent to the processing of my personal data for the purpose of handling my enquiry and providing information about your products and services. You can view our <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> for more details.
            </label>
          </div>
          {errors.consent && (
            <div id="consent-error" className="field-error" role="alert">
              {errors.consent.message}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting || submissionState.status === 'submitting'}
            className="submit-button"
          >
            {isSubmitting || submissionState.status === 'submitting'
              ? 'Submitting...'
              : 'Submit Enquiry'
            }
          </button>
        </div>
      </form>
    </div>
  );
}

export default EnquiryForm;
