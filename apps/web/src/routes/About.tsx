import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { contentClient, Page } from '../lib/contentClient'

function About() {
  const [page, setPage] = useState<Page | null>(null)

  useEffect(() => {
    contentClient.getPage('about').then(setPage).catch(() => {})
  }, [])

  return (
    <div className="bg-white">
      <div className="l-container py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            {page?.title || 'About Us'}
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            {page?.heroSubhead || 'Learn more about our mission and values.'}
          </p>
        </div>
        
        {/* Content section */}
        <div className="mt-16">
          <div className="prose prose-indigo mx-auto text-gray-500">
             {page?.sections && Array.isArray(page.sections) && page.sections.length > 0 ? (
               <div>
                 {/* Simple rendering of sections if they exist, assuming text for now */}
                 {page.sections.map((section: Record<string, unknown>, idx: number) => (
                   <div key={idx} dangerouslySetInnerHTML={{ __html: (section.content as string) || '' }} />
                 ))}
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
                  <p className="mt-4 text-base text-gray-600">
                    We believe in creating sustainable, efficient, and beautiful modular homes 
                    that meet the needs of modern living while respecting our environment.
                  </p>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Our Values</h2>
                  <p className="mt-4 text-base text-gray-600">
                    Quality craftsmanship, innovative design, and customer satisfaction 
                    are at the heart of everything we do.
                  </p>
                </div>
              </div>
             )}
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Work With Us</h2>
          <p className="mt-4 text-lg text-gray-600">
            Experience the difference of working with Ireland's leading modular home specialists.
          </p>
          <div className="mt-6">
            <Link
              to="/contact"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Get a Quote Today
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About