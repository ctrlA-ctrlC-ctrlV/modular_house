import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { contentClient, Page } from '../lib/contentClient'
import { FeatureSection, HeroWithSideText, CustomIcons, TwoColumnSplitLayout, TwoMirrorSplitColumnLayout } from '@modular-house/ui'
import '@modular-house/ui/style.css'

function Landing() {
  const [page, setPage] = useState<Page | null>(null)

  useEffect(() => {
    contentClient.getPage('home').then(setPage).catch(() => {
      // Fallback or error handling if needed, for now silent as we have defaults
    })
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <div>
        <HeroWithSideText 
          backgroundImage="https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          title="My Custom Title AAAAAAAAAAAAAAA"
          subtitle="Welcome"
          buttonText="Contact Us"
        />
      </div>

      <div>
        <FeatureSection
          topHeading='Why Choose Us'
          mainHeading='Excellence in Every Detail'
          introText={
            <>
              <p>
                We specialize in creating sustainable, modern living spaces that adapt to your needs.
              </p>
              <p>
                Our modular approach ensures speed without compromising on quality or design.
              </p>
            </>
          }
          features={[
            {
              icon: <CustomIcons 
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 65 65"
                      name="spacer"
                      size={32} 
                      className="text-blue-500"
                    />,
              title: "Rapid Construction22222222222",
              description: "Get your project done in half the time of traditional builds."
            },
            {
              icon: <CustomIcons 
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 65 65"
                      name="measureTape"
                      size={32} 
                      className="text-blue-500"
                    />,
              title: "Rapid Construction22222222222",
              description: "Get your project done in half the time of traditional builds."
            },
            {
              icon: <CustomIcons 
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 65 65"
                      name="tiles"
                      size={32} 
                      className="text-blue-500"
                    />,
              title: "Rapid Construction22222222222",
              description: "Get your project done in half the time of traditional builds."
            },
            {
              icon: <CustomIcons 
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 65 65"
                      name="sinkTrap"
                      size={32} 
                      className="text-blue-500"
                    />,
              title: "Rapid Construction22222222222",
              description: "Get your project done in half the time of traditional builds."
            },
          ]}
        />
      </div>

      {/* garden room Section */}
      <div>
        <TwoColumnSplitLayout 
          subtitle="Garden Room"
          title={"Expand your space,\nelevate your lifestyle"}
          description1="Whether you need a home office, a creative studio, or a peaceful retreat, our steel frame garden rooms are designed to bring comfort and functionality to your outdoor space. Built with precision and finished with care, they offer a fast, stylish, and durable solution to modern living needs."
          button1Text = "Get a free quote today"
          bottomText="We blend sleek architectural aesthetics with cutting-edge steel frame engineering to deliver garden rooms that are built to impress, and built to last. Every project is tailored to your needs, with minimal disruption and maximum impact.

          Our team handles everything from design to installation, ensuring a smooth, stress-free process. Whether you're after extra space for work, wellness, or weekend lounging, we’re here to make it happen, beautifully and efficiently."
          button2Text = "Need more info?"
        />
      </div>

      {/* house extension Section */}
      <div>
        <TwoColumnSplitLayout 
          subtitle="House Extension"
          title={"Inspired by vision,\nbuild for you"}
          description1="Our steel frame house extensions are designed to give your home the room it needs, without the long build times or messy construction. Whether you're expanding your kitchen, adding a new bedroom, or creating an open-plan living area, we deliver smart, efficient extensions that seamlessly blend with your existing home."
          button1Text = "Get a free quote today"
          bottomText="We use precision engineered light gauge steel to build extensions that are faster, cleaner, and stronger than traditional methods. This means less time onsite, more design flexibility, and long-term structural integrity all while meeting Ireland’s planning and building regulations.
          
          From consultation to completion, our experienced team guides you every step of the way. We’re here to help you create a space that works for how you live today and tomorrow."
          button2Text = "Need more info?"
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