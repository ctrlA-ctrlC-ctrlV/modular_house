/**
 * EnquiryFormModal Component
 * =============================================================================
 *
 * PURPOSE:
 * Renders a full-screen overlay modal containing a quick enquiry form.
 * Designed to let visitors submit their details (name, address, phone, email,
 * preferred room size) without navigating away from the current page — reducing
 * friction and form fatigue.
 *
 * ARCHITECTURE:
 * Controlled modal — the parent manages open/close state via the `isOpen`
 * prop. Body scroll is locked while the modal is open and restored on unmount.
 * Form submission is delegated to the parent via the `onSubmit` callback.
 *
 * ACCESSIBILITY:
 * - role="dialog" with aria-modal="true"
 * - Focus trapped within the modal while open
 * - Escape key closes the modal
 * - Clicking the backdrop closes the modal
 * - Focus is returned to the trigger element on close
 *
 * BEM CLASS NAMING:
 * Block:    .enquiry-modal
 * Elements: __dialog, __close, __heading, __subtext, __form,
 *           __field-group, __label, __input, __select,
 *           __checkbox-group, __checkbox-label, __checkbox-input,
 *           __btn-wrapper, __submit-btn, __success, __success-heading,
 *           __success-text, __reset-btn, __error
 *
 * =============================================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './EnquiryFormModal.css';

/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   ============================================================================= */

export interface EnquiryFormData {
  firstName: string;
  email: string;
  phone: string;
  address: string;
  roomSize: string;
  consent: boolean;
  /** Honeypot field — must remain empty for legitimate submissions */
  website: string;
}

export interface EnquiryFormModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback invoked on form submission. Receives the form data. */
  onSubmit?: (data: EnquiryFormData) => Promise<void>;
  /** Modal heading text */
  title?: string;
  /** Subtext displayed below the heading */
  subtext?: string;
}

/* =============================================================================
   SECTION 2: INLINE SVG ICONS
   ============================================================================= */

const CloseIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/* =============================================================================
   SECTION 3: COMPONENT IMPLEMENTATION
   ============================================================================= */

const INITIAL_FORM_DATA: EnquiryFormData = {
  firstName: '',
  email: '',
  phone: '',
  address: '',
  roomSize: '',
  consent: false,
  website: '',
};

export const EnquiryFormModal: React.FC<EnquiryFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Get a Free Quote',
  subtext = 'Fill out this quick form and we\'ll get back to you within 24 hours.',
}) => {
  const [formData, setFormData] = useState<EnquiryFormData>(INITIAL_FORM_DATA);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  /* ---------------------------------------------------------------------------
     Keyboard handler — Escape to close, Tab to trap focus
     --------------------------------------------------------------------------- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableSelector =
          'a[href], button:not([disabled]), textarea, input:not([tabindex="-1"]), select, [tabindex]:not([tabindex="-1"])';
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [onClose],
  );

  /* ---------------------------------------------------------------------------
     Side effects: scroll lock, focus management, keyboard listener
     --------------------------------------------------------------------------- */
  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    requestAnimationFrame(() => {
      const closeBtn = dialogRef.current?.querySelector<HTMLElement>('.enquiry-modal__close');
      closeBtn?.focus();
    });

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [isOpen, handleKeyDown]);

  /* ---------------------------------------------------------------------------
     Reset form state when modal closes
     --------------------------------------------------------------------------- */
  useEffect(() => {
    if (!isOpen) {
      // Small delay so success/error message is visible before reset
      const timer = setTimeout(() => {
        setFormData(INITIAL_FORM_DATA);
        setStatus('idle');
        setErrorMessage('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  /* ---------------------------------------------------------------------------
     Event handlers
     --------------------------------------------------------------------------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
    } catch (error) {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
      console.error(error);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleReset = () => {
    setStatus('idle');
    setFormData(INITIAL_FORM_DATA);
  };

  /* ---------------------------------------------------------------------------
     Render
     --------------------------------------------------------------------------- */
  if (!isOpen) return null;

  return (
    <div
      className="enquiry-modal"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="enquiry-modal__dialog" ref={dialogRef}>
        {/* Close button */}
        <button
          type="button"
          className="enquiry-modal__close"
          onClick={onClose}
          aria-label="Close enquiry form"
        >
          <CloseIcon />
        </button>

        {/* Heading */}
        <h2 className="enquiry-modal__heading">{title}</h2>
        {subtext && <p className="enquiry-modal__subtext">{subtext}</p>}

        {status === 'success' ? (
          <div className="enquiry-modal__success">
            <h3 className="enquiry-modal__success-heading">Thank you!</h3>
            <p className="enquiry-modal__success-text">
              We&apos;ve received your enquiry and will get back to you shortly.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="enquiry-modal__reset-btn"
            >
              Send another enquiry
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="enquiry-modal__form"
            noValidate
            aria-label="Quick enquiry form"
          >
            {/* Honeypot field — hidden from real users */}
            <div className="enquiry-modal__honeypot" aria-hidden="true">
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* First Name */}
            <div className="enquiry-modal__field-group">
              <label className="enquiry-modal__label" htmlFor="enquiry-firstName">
                First Name <span aria-hidden="true">*</span>
              </label>
              <input
                id="enquiry-firstName"
                className="enquiry-modal__input"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Your first name"
                required
                autoComplete="given-name"
              />
            </div>

            {/* Email */}
            <div className="enquiry-modal__field-group">
              <label className="enquiry-modal__label" htmlFor="enquiry-email">
                Email <span aria-hidden="true">*</span>
              </label>
              <input
                id="enquiry-email"
                className="enquiry-modal__input"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Phone */}
            <div className="enquiry-modal__field-group">
              <label className="enquiry-modal__label" htmlFor="enquiry-phone">
                Phone <span aria-hidden="true">*</span>
              </label>
              <input
                id="enquiry-phone"
                className="enquiry-modal__input"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="08X XXX XXXX"
                required
                autoComplete="tel"
              />
            </div>

            {/* Address */}
            <div className="enquiry-modal__field-group">
              <label className="enquiry-modal__label" htmlFor="enquiry-address">
                First Line Address <span aria-hidden="true">*</span>
              </label>
              <input
                id="enquiry-address"
                className="enquiry-modal__input"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Your address"
                required
                autoComplete="street-address"
              />
            </div>

            {/* Room Size */}
            <div className="enquiry-modal__field-group">
              <label className="enquiry-modal__label" htmlFor="enquiry-roomSize">
                Preferred Room Size <span aria-hidden="true">*</span>
              </label>
              <input
                id="enquiry-roomSize"
                className="enquiry-modal__input"
                type="text"
                name="roomSize"
                value={formData.roomSize}
                onChange={handleChange}
                placeholder="e.g. 25m²"
                required
              />
            </div>

            {/* GDPR Consent */}
            <div className="enquiry-modal__checkbox-group">
              <label className="enquiry-modal__checkbox-label">
                <input
                  className="enquiry-modal__checkbox-input"
                  type="checkbox"
                  name="consent"
                  checked={formData.consent}
                  onChange={handleChange}
                  required
                />
                <span>
                  I agree to the processing of my personal data in accordance
                  with the{' '}
                  <a
                    href="/privacy"
                    className="enquiry-modal__consent-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            {/* Error message */}
            {status === 'error' && (
              <p className="enquiry-modal__error" role="alert">{errorMessage}</p>
            )}

            {/* Submit button */}
            <div className="enquiry-modal__btn-wrapper">
              <button
                type="submit"
                className="enquiry-modal__submit-btn"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Sending…' : 'Get My Free Quote'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
