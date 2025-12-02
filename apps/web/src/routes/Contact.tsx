import { useState } from 'react';
import { EnquiryForm } from '../forms';

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
      <div className="l-container py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Contact Us
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Get in touch for a personalized quote on your modular house project.
          </p>
        </div>

        {/* Success Message */}
        {contactState.showThankYou && (
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <div className="flex justify-center items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-green-900 mb-4">
                Thank You for Your Enquiry!
              </h2>
              <p className="text-green-800 mb-6">
                We've received your message and will be in touch shortly to discuss your modular house project. 
                One of our team members will contact you within 24 hours.
              </p>
              {contactState.submissionId && (
                <p className="text-sm text-green-700 mb-6">
                  Reference ID: {contactState.submissionId}
                </p>
              )}
              <div className="space-y-4">
                <div className="text-left bg-white p-4 rounded border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-2">What happens next?</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• We'll review your requirements and project details</li>
                    <li>• A project consultant will contact you to discuss your needs</li>
                    <li>• We'll provide a personalized quote for your modular house</li>
                    <li>• Schedule a site visit if needed</li>
                  </ul>
                </div>
                <button
                  onClick={resetForm}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Submit Another Enquiry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {contactState.error && !contactState.showThankYou && (
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    There was a problem submitting your enquiry
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{contactState.error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => setContactState(prev => ({ ...prev, error: undefined }))}
                      className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Form */}
        {!contactState.showThankYou && (
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="bg-gray-50 p-8 rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Get Your Free Quote
              </h2>
              <p className="text-gray-600 mb-8 text-center">
                Fill out the form below and we'll get back to you with a personalized quote for your modular house project.
              </p>
              
              <EnquiryForm
                onSuccess={handleFormSuccess}
                onError={handleFormError}
                className="bg-white rounded-lg shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Contact Information */}
        {!contactState.showThankYou && (
          <div className="mt-16">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Other Ways to Reach Us
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="flex justify-center items-center mb-4">
                    <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Call Us</h4>
                  <p className="text-gray-600">+353 1 234 5678</p>
                  <p className="text-sm text-gray-500 mt-1">Mon-Fri 9AM-5PM</p>
                </div>
                
                <div className="text-center">
                  <div className="flex justify-center items-center mb-4">
                    <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Email Us</h4>
                  <p className="text-gray-600">info@modularhouse.ie</p>
                  <p className="text-sm text-gray-500 mt-1">We respond within 24hrs</p>
                </div>
                
                <div className="text-center">
                  <div className="flex justify-center items-center mb-4">
                    <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Visit Us</h4>
                  <p className="text-gray-600">123 Business Park<br />Dublin, Ireland</p>
                  <p className="text-sm text-gray-500 mt-1">By appointment only</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Contact