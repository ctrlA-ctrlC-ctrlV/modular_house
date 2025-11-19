function Contact() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Contact Us
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Get in touch for a personalized quote.
          </p>
        </div>
        
        {/* Placeholder for enquiry form - will be implemented in US1 */}
        <div className="mt-16 max-w-md mx-auto">
          <div className="bg-gray-50 p-8 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Enquiry Form</h2>
            <p className="text-sm text-gray-600">
              Contact form will be implemented in the next phase.
            </p>
            <div className="mt-4 space-y-3">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-10 bg-indigo-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact