function Terms() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900">
              Terms of Service
            </h1>
            <p className="mt-4 text-lg text-gray-500">
              Terms and conditions for using our services.
            </p>
          </div>
          
          {/* Placeholder terms content */}
          <div className="mt-12 prose prose-lg mx-auto">
            <h2>Acceptance of Terms</h2>
            <p className="text-gray-600">
              By using our services, you agree to these terms.
            </p>
            
            <h2>Services Description</h2>
            <p className="text-gray-600">
              Description of modular home design and construction services.
            </p>
            
            <h2>User Responsibilities</h2>
            <p className="text-gray-600">
              Guidelines for appropriate use of our website and services.
            </p>
            
            <h2>Limitation of Liability</h2>
            <p className="text-gray-600">
              Legal limitations and disclaimers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Terms