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
  MasonryGallery
} from '@modular-house/ui'


function Landing() {
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
          exploreLink="#features"
        />
      </div>

      <div>
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
              title: "Detached Garden Studio",
              description: "Create your ideal home office, gym, or studio. Fully insulated, habitable year-round."
            },
            {
              icon: <CustomIcons 
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 65 65"
                      name="measureTape"
                      size={32} 
                      className="text-blue-500"
                    />,
              title: "Seamless House Extension",
              description: "Expand your living footprint with lightweight steel structures that reduce foundation costs and maximize internal floor space."
            },
            {
              icon: <CustomIcons 
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 65 65"
                      name="tiles"
                      size={32} 
                      className="text-blue-500"
                    />,
              title: "Engineered Steel Frame",
              description: "Unlike timber, our galvanized steel frames never rot, warp, or twist, giving you a structure built to last a lifetime."
            },
            {
              icon: <CustomIcons 
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 65 65"
                      name="sinkTrap"
                      size={32} 
                      className="text-blue-500"
                    />,
              title: "Extreme Energy Efficiency",
              description: "Our multi-layer insulation systems eliminate cold bridges, keeping your new space warm in winter and cool in summer"
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
                 
    </div>
  )
}

export default Landing