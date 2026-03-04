/**
 * Contact Route Component
 * =============================================================================
 *
 * PURPOSE:
 * Renders the /contact page with a two-column layout: company information on
 * the left and a validated contact/enquiry form on the right.
 *
 * QUERY PARAMETER SUPPORT:
 * When visitors arrive from product CTA links (e.g. /contact?product=garden-room-25),
 * the page reads URL query parameters and pre-populates the form:
 *
 *   - `product`  — A slug like "garden-room-15" or "garden-room-25". Mapped to
 *                  the "Garden Room" product enum value via PRODUCT_SLUG_MAP.
 *                  Unrecognised slugs are silently ignored (general enquiry).
 *
 *   - `interest` — When set to "true", indicates the visitor is registering
 *                  interest in a product not yet available. The message field
 *                  is pre-filled with an "[Interest Registration]" tag so the
 *                  sales team can prioritise these leads appropriately.
 *
 * ARCHITECTURE:
 * - Form submission is delegated to the apiClient, which handles the HTTP
 *   request to the backend enquiry endpoint.
 * - The TextWithContactForm component (from @modular-house/ui) manages all
 *   form validation, rendering, and state display internally.
 *
 * =============================================================================
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TextWithContactForm, type TextContactFormData } from '@modular-house/ui';
import { apiClient } from '../lib/apiClient';
import { useHeaderConfig } from '../components/HeaderContext';


/* =============================================================================
   PRODUCT SLUG MAPPING
   -----------------------------------------------------------------------------
   Maps URL-safe product slugs (used in query parameters) to the form's enum
   values. This lookup is intentionally defined outside the component to avoid
   re-creation on every render. Only slugs present in this map are considered
   valid; any other value results in no pre-selection (general enquiry).

   The map follows the Open-Closed Principle: adding support for a new product
   slug requires only appending a new entry here — no component logic changes.
   ============================================================================= */

const PRODUCT_SLUG_MAP: Record<string, 'Garden Room' | 'House Extension'> = {
  'garden-room-15': 'Garden Room',
  'garden-room-25': 'Garden Room',
  'garden-room-35': 'Garden Room',
  'garden-room-45': 'Garden Room',
  'house-extension': 'House Extension',
};


function Contact() {
  const { setHeaderConfig } = useHeaderConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);


  /* ---------------------------------------------------------------------------
     URL Query Parameter Extraction
     ---------------------------------------------------------------------------
     Reads `product` and `interest` parameters from the current URL. These are
     set by product card CTA links on the /garden-room page (e.g.
     /contact?product=garden-room-25 or /contact?product=garden-room-35&interest=true).
     --------------------------------------------------------------------------- */
  const [searchParams] = useSearchParams();
  const product = searchParams.get('product');
  const interest = searchParams.get('interest');


  /* ---------------------------------------------------------------------------
     Derived Form Defaults
     ---------------------------------------------------------------------------
     Maps the raw query parameter values to typed form defaults. These are
     memoised to maintain referential stability and prevent unnecessary form
     re-initialisation.

     - defaultProduct: Resolves the URL slug to a schema-valid enum value.
       Falls back to undefined (no pre-selection) for unknown slugs.

     - defaultMessage: When the interest flag is "true", pre-fills the message
       textarea with a tag that identifies this submission as an interest
       registration rather than a standard quote request.
     --------------------------------------------------------------------------- */
  const defaultProduct = useMemo(
    () => (product ? PRODUCT_SLUG_MAP[product] : undefined),
    [product]
  );

  const defaultMessage = useMemo(
    () => (interest === 'true' ? '[Interest Registration] ' : undefined),
    [interest]
  );


  /* ---------------------------------------------------------------------------
     Header Configuration
     ---------------------------------------------------------------------------
     Sets the site header to the light variant without position overlay, since
     the contact page does not have a full-bleed hero image.
     --------------------------------------------------------------------------- */
  useEffect(() => {
    setHeaderConfig({ variant: 'light', positionOver: false });

    return () => {
      setHeaderConfig({ variant: 'dark', positionOver: true });
    };
  }, [setHeaderConfig]);


  /* ---------------------------------------------------------------------------
     Form Submission Handler
     ---------------------------------------------------------------------------
     Sends the validated form data to the backend via the apiClient. Manages
     loading, success, and error states to provide user feedback. The honeypot
     field (website) is passed through for server-side bot detection.
     --------------------------------------------------------------------------- */
  const handleContactSubmit = async (data: TextContactFormData): Promise<void> => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      await apiClient.submitEnquiry({
        firstName: data.firstName,
        lastName: data.surname,
        email: data.email,
        phone: data.phone,
        address: data.address,
        eircode: data.eircode,
        preferredProduct: data.preferredProduct,
        message: data.message,
        consent: data.gdprConsent,
        website: data.website,
      });
      setSubmissionSuccess(true);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Something went wrong. Please try again.';
      setSubmissionError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <TextWithContactForm
        topLabel="GET IN TOUCH"
        heading="We'd love to hear from you"
        description={
          <>
            If you want to build a garden room or house extensions, visit us at our factory in Dublin 12. <strong>No appointment needed.</strong>
            <span className="text-contact__subheading">Opening Hours</span>
              Monday - Friday: 9:00am - 5:00pm
            {'\n'}<span className='text-contact__smallprint'>Please be aware that our opening times are subject to change on bank holidays.</span>
          </>
        }
        contactInfo={{
          address: "Unit 8, Finches Business Park, Long Mile road Dublin 12, D12 N9YV",
          phone: "(+353) 0830280000",
          email: "info@modularhouse.ie"
        }}
        onSubmit={handleContactSubmit}
        isSubmitting={isSubmitting}
        submissionError={submissionError}
        submissionSuccess={submissionSuccess}
        defaultProduct={defaultProduct}
        defaultMessage={defaultMessage}
      />
    </div>
  );
}

export default Contact