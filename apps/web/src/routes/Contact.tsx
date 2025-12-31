import { useState, useEffect } from 'react';
import { Seo } from '@modular-house/ui';
import { TextWithContactForm, type TextContactFormData } from '@modular-house/ui';
import { apiClient } from '../lib/apiClient';
import { useHeaderConfig } from '../components/HeaderContext';

function Contact() {
  const { setHeaderConfig } = useHeaderConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Configure header for light variant on this page
  useEffect(() => {
    setHeaderConfig({ variant: 'light', positionOver: false });
    
    // Reset to defaults when leaving this page
    return () => {
      setHeaderConfig({ variant: 'dark', positionOver: true });
    };
  }, [setHeaderConfig]);

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
        website: data.website, // Honeypot field
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
      <Seo 
        title="Contact Us" 
        description="Get in touch with us for your modular house needs."
        canonicalUrl="https://modularhouse.ie/contact"
      />
      
      <TextWithContactForm 
        topLabel="GET IN TOUCH"
        heading="We'd love to hear from you"
        description="Our team is ready to answer all your questions."
        contactInfo={{
          address: "Unit 8, Finches Business Park, Long Mile road Dublin 12, D12 N9YV",
          phone: "(+353) 0830280000",
          email: "info@sdeal.ie"
        }}
        onSubmit={handleContactSubmit}
        isSubmitting={isSubmitting}
        submissionError={submissionError}
        submissionSuccess={submissionSuccess}
      />
    </div>
  )
}

export default Contact