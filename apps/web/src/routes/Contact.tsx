import { useState } from 'react';
import { EnquiryForm } from '../forms';
import { Seo } from '@modular-house/ui';
import { TextWithContactForm } from '@modular-house/ui';

interface ContactState {
  showThankYou: boolean;
  submissionId?: string;
  error?: string;
}

function Contact() {
  const [contactState, setContactState] = useState<ContactState>({
    showThankYou: false
  });

  const handleFormSuccess = (submissionId: string) => {
    setContactState({
      showThankYou: true,
      submissionId,
      error: undefined
    });

    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormError = (error: string) => {
    setContactState(prev => ({
      ...prev,
      error,
      showThankYou: false
    }));

    // Scroll to top to show error message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setContactState({
      showThankYou: false,
      submissionId: undefined,
      error: undefined
    });
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
      />
    </div>
  )
}

export default Contact