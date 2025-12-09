import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { contentClient, Page } from '../lib/contentClient'
import { apiClient } from '../lib/apiClient'
import '@modular-house/ui/style.css'
import { 
  FeatureSection, 
  HeroWithSideText, 
  CustomIcons, 
  TwoColumnSplitLayout, 
  TestimonialGrid, 
  MiniFAQs,
  ContactFormWithImageBg,
  type ContactFormData,
  MasonryGallery,
  NewsletterSection
} from '@modular-house/ui'


function Landing() {
  const [page, setPage] = useState<Page | null>(null)

  useEffect(() => {
    contentClient.getPage('home').then(setPage).catch(() => {
      // Fallback or error handling if needed, for now silent as we have defaults
    })
  }, [])

  const handleContactSubmit = async (data: ContactFormData) => {
    await apiClient.submitEnquiry({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      preferredProduct: data.productType,
      message: data.message,
      consent: data.consent,
      website: data.address
    });
  };

  return (
    <div>
      {/* Hero Section */}
      <div>
        <HeroWithSideText 
          backgroundImage="https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          title="Beautifully built for life."
          subtitle="Discover high performance garden rooms and house extensions designed for modern living."
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
              title: "Rapid Construction",
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
              title: "Rapid Construction",
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
              title: "Rapid Construction",
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
              title: "Rapid Construction",
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

      {/* Social proof Section */}
      <div>
        <TestimonialGrid
          subTitle = "Building trust through our work"
          title = "We deliver quality construction"
          testimonials = {[
            {
              text: "Rebar made our dream home a reality. Their team was skilled, reliable, and always kept us informed. We felt supported from start to finish.",
              authorName: "Emily Chen",
              authorLocation: "San Francisco, CA",
              authorImageSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-25.jpg",
              rating: 5
            },
            {
              text: "Our office renovation was seamless. Rebar worked around our schedule and delivered a modern, functional space that exceeded our hopes.",
              authorName: "Carlos Rivera",
              authorLocation: "Los Angeles, CA",
              authorImageSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-24.jpg",
              rating: 5
            },
            {
              text: "We needed structural upgrades and Rebar handled every detail. Their expertise and clear updates made the process stress-free for us.",
              authorName: "Sarah Miller",
              authorLocation: "Austin, TX",
              authorImageSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-23.jpg",
              rating: 5
            },
            {
              text: "Rebar transformed our store with minimal downtime. The results were truly stunning, and our customers absolutely love the new look and feel.",
              authorName: "David Singh",
              authorLocation: "Laketown, CA",
              authorImageSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-22.jpg",
              rating: 5
            }
          ]}
            
        />
      </div>

      {/*   Mini FAQ Section    */}      
      <div>
        <MiniFAQs
          title='Modular..'
          faqs={[
            {
              number: '01',
              title: 'It starts with floors',
              description: 'At Rebar, we install and upgrade floor coverings that blend style, function, and durability. Our team delivers tailored solutions for homes and businesses, using top materials and expert care.'
            },
            {
              number: '02',
              title: 'Covering all flooring needs',
              description: 'Rebar’s floor covering services include hardwood, tile, carpet, and more. We guide you from selection to finish, ensuring your new floors are safe, stylish, and built to last.'
            },
            {
              number: '03',
              title: 'Handling all flooring needs',
              description: 'We offer expert advice on floor coverings, from moisture control to heavy use areas. Our team ensures your floors meet every need, blending design, safety, and long-term value.'
            }
          ]}
        />
      </div>

      {/* CTA Section */}
      <div>
        <ContactFormWithImageBg onSubmit={handleContactSubmit} />
      </div>
      
      {/*   Mini Gallary Section */}
      <div>
        <MasonryGallery
          images={[
            { src: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-293.jpg", fullSizeSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-293.jpg" },
            { src: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-291.jpg", fullSizeSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-291.jpg" },
            { src: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-289.jpg", fullSizeSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-289.jpg" },
            { src: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-295.jpg", fullSizeSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-295.jpg" },
            { src: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-292.jpg", fullSizeSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-292.jpg" },
            { src: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-290.jpg", fullSizeSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-290.jpg" },
            { src: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-288.jpg", fullSizeSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-288.jpg" },
            { src: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-294.jpg", fullSizeSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-294.jpg" },
          ]}
          columns = {4}
        />
      </div>

      {/* Newsletter signup Section */}
      <div>
        <NewsletterSection 
          title="Get the lattest offer" 
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

      
    </div>
  )
}

export default Landing