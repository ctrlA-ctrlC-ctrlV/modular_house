function Privacy() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900">
              Privacy Policy
            </h1>
            <p className="mt-4 text-lg text-gray-500">
              Your privacy is important to us.
            </p>
          </div>
          
          {/* Placeholder privacy policy content */}
          <div className="mt-12 prose prose-lg mx-auto">
            <h2>Information We Collect</h2>
            <p className="text-gray-600">
              Details about data collection practices will be documented here.
            </p>
            
            <h2>How We Use Your Information</h2>
            <p className="text-gray-600">
              Information about data usage and processing.
            </p>
            
            <h2>Data Retention</h2>
            <p className="text-gray-600">
              We retain customer enquiries for 24 months as outlined in our data retention policy.
            </p>
            
            <h2>Contact Us</h2>
            <p className="text-gray-600">
              For privacy-related questions, please contact us.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Privacy