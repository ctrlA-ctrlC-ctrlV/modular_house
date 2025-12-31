import { apiClient } from '../lib/apiClient';
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
  Seo
} from '@modular-house/ui'
import { useHeaderConfig } from '../components/HeaderContext';
import { useEffect } from 'react';

function Landing() {
  // Configure header for dark variant on hero pages
  const { setHeaderConfig } = useHeaderConfig();
  useEffect(() => {
    setHeaderConfig({ variant: 'dark', positionOver: true });
    
    return () => {
      setHeaderConfig({ variant: 'dark', positionOver: true });
    };
  }, [setHeaderConfig]);
  
  // SEO orgnization schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Modular House Construction',
    url: 'https://www.modularhouse.ie',
    logo: 'https://www.modularhouse.ie/logo_black.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+3530830280000',
      contactType: 'Customer Service'
    }
  };

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
      {/* SEO Integration */}
      <Seo 
        title="Steel Frame Garden Rooms & House Extensions" 
        description="Transform your home with precision steel frame garden rooms and extensions. Built in weeks, not months. Superior energy efficiency & turnkey delivery."
        canonicalUrl="https://modularhouse.ie/"

        // Open Graph for Facebook/LinkedIn sharing optimization
        openGraph={{
          type: 'website',
          title: 'Steel Frame Garden Rooms & House Extensions | Modular House',
          description: 'Transform your home with precision steel frame garden rooms and extensions. Built in weeks, not months. Superior energy efficiency & turnkey delivery.',
          image: 'https://modularhouse.ie/resource/landing_hero.png',
          siteName: 'Modular House Construction',
        }}

        // Twitter Card optimization
        twitter={{
          cardType: 'summary_large_image',
          site: '@ModularHouse',
          title: 'Fast, Durable Steel Frame Garden Rooms & Extensions',
          image: 'https://modularhouse.ie/resource/landing_hero.png',
        }}

        // Rich Snippets data
        jsonLd={organizationSchema}
      />

      {/* Smooth scrolling behavior */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      {/* Hero Section */}
      <div id='landing_hero'>
        <HeroWithSideText 
          backgroundImage="https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          subtitle="DISCOVER MODULAR LIVING"
          title={
            <>
              Premium extensions built <br />
              rapid, <span className="text-highlight">robust and refined</span>          
            </>
          }
          description="Expand your lifestyle with bespoke steel frame garden rooms and extensions."
          buttonText="Get Started"
          buttonLink="/get-started"
          exploreText="Explore"
          exploreLink="#landing_features"
        />
      </div>

      <div id="landing_features">
        <FeatureSection
          topHeading='Built in steetl, Finished for living'
          mainHeading='Reimagine your living space'
          introText={
            <>
              <p>
                We believe expanding your home shouldn't disrupt your life. By choosing steel frame construction, you are choosing a cleaner, quieter, and faster path to the extra space you crave.
              </p>
              <p>
                Whether you need a sanctuary at the bottom of the garden or a modern open-plan extension, our team manages the entire process from design to completion, delivering turnkey results ready for you to enjoy.
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
              title: "Precision Steel Framing",
              description: "Pre-engineered off-site for millimeter-perfect accuracy, ensuring a straighter, stronger structure that never warps or rots"
            },
            {
              icon: <CustomIcons 
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 65 65"
                      name="bioEnergy"
                      size={32} 
                      className="text-blue-500"
                    />,
              title: "Superior Energy Efficiency",
              description: "Advanced insulation systems that exceed building regulations, keeping your heating bills low and your comfort high year-round"
            },
            {
              icon: <CustomIcons 
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 65 65"
                      name="tiles"
                      size={32} 
                      className="text-blue-500"
                    />,
              title: "Bespoke Architectural Design",
              description: "Your vision, our expertise. We tailor every dimension and detail to fit your lifestyle and property perfectly"
            },
            {
              icon: <CustomIcons 
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 65 65"
                      name="keyCircle"
                      size={32} 
                      className="text-blue-500"
                    />,
              title: "Turnkey Project Delivery",
              description: "We handle everything. From the initial ground screws to the final plaster, one team manages your entire build journey"
            },
          ]}
        />
      </div>

      {/* garden room Section */}
      <div id='landing_garden_room_description'>
        <TwoColumnSplitLayout 
          backgroundColor="beige"
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
      <div id='landing_house_extension_description'>
          <TwoColumnSplitLayout 
            backgroundColor="white"
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
      <div id='landing_testimonial'>
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

      {/*   Mini Gallary Section */}
      <div id='landing_gallary'>
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

      {/*   Mini FAQ Section    */}      
      <div id='landing_faq'>
        <MiniFAQs
          title='Modular..'
          faqs={[
            {
              number: '01',
              title: 'Why choose Steel Frame over timber or block?',
              description: 'Steel is faster, stronger, and more precise. It builds roughly 30% faster than traditional methods, will never rot, warp, or twist, and offers superior thermal values, keeping your space warm and energy bills low.'
            },
            {
              number: '02',
              title: 'Do I need planning permission?',
              description: 'Most of our projects are "Exempted Developments" and do not require planning permission. This typically applies to Garden Rooms under 25m² and single-story rear extensions under 40m², provided the roof height does not exceed 2.5m. We will confirm your specific compliance during our initial site survey.'
            },
            {
              number: '03',
              title: 'Is my build guaranteed?',
              description: 'Yes. We provide a comprehensive 50-year structural warranty on our steel frames. Because steel is inorganic and durable, you can be confident your investment is protected against the elements for decades.'
            }
          ]}
        />
      </div>

      {/* CTA Section */}
      <div id='landing_cta_form'>
        <ContactFormWithImageBg onSubmit={handleContactSubmit} />
      </div>
                 
    </div>
  )
}

export default Landing