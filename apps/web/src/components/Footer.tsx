import { Link } from 'react-router-dom'

function Footer() {
  // Contact information - can be configured via environment variables in the future
  const phoneNumber = '+353 1 234 5678'
  const phoneDisplay = '01 234 5678'
  const email = 'info@sdeal.ie'
  
  return (
    <footer className="bg-gray-50">
      <div className="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-4 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <div className="text-xl font-bold text-gray-900">
              Modular House
            </div>
            <p className="text-base text-gray-500">
              Building sustainable, modular homes for modern living.
            </p>
            {/* Phone CTA */}
            <div className="flex flex-col space-y-2">
              <a
                href={`tel:${phoneNumber}`}
                className="inline-flex items-center text-lg font-semibold text-indigo-600 hover:text-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 rounded px-2 py-1 -ml-2"
                aria-label={`Call us at ${phoneDisplay}`}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {phoneDisplay}
              </a>
              <a
                href={`mailto:${email}`}
                className="text-base text-gray-500 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 rounded px-2 py-1 -ml-2"
              >
                {email}
              </a>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-3 xl:mt-0">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Company
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link 
                    to="/about" 
                    className="text-base text-gray-500 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 rounded px-1 py-1"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/products" 
                    className="text-base text-gray-500 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 rounded px-1 py-1"
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/gallery" 
                    className="text-base text-gray-500 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 rounded px-1 py-1"
                  >
                    Gallery
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/contact" 
                    className="text-base text-gray-500 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 rounded px-1 py-1"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Legal
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link 
                    to="/privacy" 
                    className="text-base text-gray-500 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 rounded px-1 py-1"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/terms" 
                    className="text-base text-gray-500 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 rounded px-1 py-1"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-400 xl:text-center">
            &copy; 2025 SDeal Construstion Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer