import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { contentClient, Page } from '../lib/contentClient'
import { HeroWithSideText } from '@modular-house/ui'
import '@modular-house/ui/style.css'

function Landing() {
  const [page, setPage] = useState<Page | null>(null)

  useEffect(() => {
    contentClient.getPage('home').then(setPage).catch(() => {
      // Fallback or error handling if needed, for now silent as we have defaults
    })
  }, [])

  return (
    <div className="relative">
      {/* Hero Section */}
      <div>
        <HeroWithSideText 
          title="My Custom Title AAAAAAAAAAAAAAA"
          subtitle="Welcome"
          buttonText="Contact Us"
        />
      </div>

      <div className="relative bg-white overflow-hidden">
        <div className="l-container">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl sm:mt-12 md:mt-16 lg:mt-20 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="u-text-h1 text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">{page?.heroHeadline || 'Modern'}</span>{' '}
                  <span className="block text-indigo-600 xl:inline">{page?.heroSubhead || 'Modular Homes'}</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  {page?.seoDescription || 'Sustainable, efficient, and beautifully designed modular homes for contemporary living. Built with precision, delivered with care.'}
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/contact"
                      className="c-button c-button--primary w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                    >
                      Get Started
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      to="/gallery"
                      className="c-button c-button--secondary w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10"
                    >
                      View Gallery
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="l-container">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Why Choose Modular?
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Fast Construction</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Modular construction reduces build time by up to 50% compared to traditional methods.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Sustainable</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Environmentally friendly materials and energy-efficient designs for a greener future.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* garden room Section */}
      <div className="l-container">

      </div>

      {/* house extension Section */}
      <div className="l-container">

      </div>

      {/* Social proof Section */}
      <div className="l-container">

      </div>

      {/*   Mini FAQ Section    */}      
      <div className="l-container">
        {/* Accordion 
          * 3 items 
        */}
      </div>

      {/* CTA Section */}
      <div className="l-container">

      </div>

      {/* Newsletter signup Section */}
      <div className="l-container">

      </div>
    </div>
  )
}

export default Landing