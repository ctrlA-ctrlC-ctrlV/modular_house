import { Link } from 'react-router-dom'

function Products() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Our Products
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Explore our range of modular home solutions.
          </p>
        </div>
        
        {/* Placeholder product categories */}
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
          <div className="text-center">
            <div className="mx-auto h-32 w-32 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">Garden Room</span>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Garden Rooms</h3>
            <p className="mt-2 text-base text-gray-500">
              Versatile spaces for work, relaxation, or hobbies.
            </p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto h-32 w-32 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">House Extension</span>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">House Extensions</h3>
            <p className="mt-2 text-base text-gray-500">
              Expand your living space with modular additions.
            </p>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="mt-16 bg-indigo-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Ready to Get Started?</h2>
          <p className="mt-4 text-lg text-gray-600">
            Contact us today for a personalized quote on your modular home project.
          </p>
          <div className="mt-6">
            <Link
              to="/contact"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Get Your Quote
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Products