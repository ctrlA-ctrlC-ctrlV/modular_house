import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import {
  PRODUCT_SHOWCASE_PRODUCTS,
  PRODUCT_SHOWCASE_FEATURES,
  PRODUCT_SHOWCASE_WARRANTIES,
  // GARDEN_ROOM_QUICK_VIEW,
} from '../data/garden-room-data';
import {
  HeroWithSideText,
  ProductShowcase,
  FeatureSection,
  CustomIcons,
  TwoColumnSplitLayout,
  TestimonialGrid,
  MiniFAQs,
  ContactFormWithImageBg,
  type ContactFormData,
  MasonryGallery,
  // QuickViewModal,
  type LinkRenderer,
  // type QuickViewProduct,
  // type ProductShowcaseProduct,
} from '@modular-house/ui'
import { useHeaderConfig } from '../components/HeaderContext';
import { useCallback, useEffect } from 'react';
import '../styles/landing-hero.css';

function Landing() {
  const navigate = useNavigate();
  
  /* ---------------------------------------------------------------------------
     Quick View Modal State
     ---------------------------------------------------------------------------
     Tracks which product (if any) is currently displayed in the QuickViewModal
     overlay. `null` means the modal is closed.
     --------------------------------------------------------------------------- */
  // const [quickViewProduct, setQuickViewProduct] = useState<QuickViewProduct | null>(null);

  // Configure header for dark variant on hero pages
  const { setHeaderConfig } = useHeaderConfig();
  useEffect(() => {
    setHeaderConfig({ variant: 'dark', positionOver: true });
    
    return () => {
      setHeaderConfig({ variant: 'dark', positionOver: true });
    };
  }, [setHeaderConfig]);
  
  // Render Link helper
  const renderLink: LinkRenderer = (props) => {
    const { href, children, className, onClick, ...rest } = props;
    return (
      <Link to={href} className={className} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  };
  
  /* ---------------------------------------------------------------------------
     Product Showcase Quick View Handler
     ---------------------------------------------------------------------------
     Called when the user clicks a product row in the ProductShowcase component
     (modal mode). Maps the row index to the corresponding entry in the
     GARDEN_ROOM_QUICK_VIEW array so the QuickViewModal can display extended
     data (description, specs, lead time) for that product.
     --------------------------------------------------------------------------- */
  // const handleShowcaseProductClick = useCallback(
  //   (_product: ProductShowcaseProduct, index: number): void => {
  //     const quickViewData = GARDEN_ROOM_QUICK_VIEW[index];
  //     if (quickViewData) {
  //       setQuickViewProduct(quickViewData);
  //     }
  //   },
  //   [],
  // );
  const handleShowcaseProductClick = useCallback(
    (): void => {
      navigate('/garden-room#product-range');
    },
    [navigate],
  );

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
      {/* Smooth scrolling behavior */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      {/* Hero Section */}
      <div id='landing_hero'>
        <HeroWithSideText
          className="landing-hero"
          backgroundImage="/resource/landing_hero2.png"
          backgroundImageWebP="/resource/landing_hero2.webp"
          backgroundImageAvif="/resource/landing_hero2.avif"
          subtitle="DISCOVER MODULAR LIVING"
          title={
            <>
              Premium extensions built 
              rapid, <span className="text-highlight">robust and refined</span>          
            </>
          }
          description="Expand your lifestyle with bespoke steel frame garden rooms and extensions."
          button1Text="Get a Free Quote"
          button1Link="/contact"
          exploreText="Explore"
          exploreLink="#landing_features"
          renderLink={renderLink}
        />
      </div>

      {/* ===================================================================
          Section 2 — Product Showcase (50/50 Split)
          ===================================================================
          A 50/50 split section introducing the standardised product line.
          Left: 1×4 product grid with background images, dimensions, and
          prices. Each row smooth-scrolls to the Product Range section on
          click. Right: standard features and warranty coverage.
          =================================================================== */}
      <div id="product-showcase">
        <ProductShowcase
          productEyebrow="PRODUCT RANGE"
          products={PRODUCT_SHOWCASE_PRODUCTS}
          onProductClick={handleShowcaseProductClick}
          legislationNote={
            <p>
              <strong>Legislation Update:</strong>{' '}
              Rooms up to 25m² currently exempt from planning permission.
              Pending legislation will raise this to 45m² — making our full
              range permit-free.
            </p>
          }
          featuresEyebrow="INCLUDED AS STANDARD"
          features={PRODUCT_SHOWCASE_FEATURES}
          warrantyEyebrow="WARRANTY COVERAGE"
          warranties={PRODUCT_SHOWCASE_WARRANTIES}
        />

        {/* Quick View Modal — renders as a full-screen overlay when a user
            clicks a product row in the showcase. Closed via backdrop click,
            Escape key, or the close button inside the modal. */}
        {/* <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          renderLink={renderLink}
        /> */}
      </div>

      <div id="landing_features">
        <FeatureSection
          topHeading='Built in steel, Finished for living'
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
          button1Link = "/contact"
          image1Src = '/resource/garden-room/garden-room2.png'
          image1WebP='/resource/garden-room/garden-room2.webp'
          image1Avif='/resource/garden-room/garden-room2.avif'
          image1Alt = 'Garden Room 1'
          image2Src='/resource/garden-room/garden-room5.png'
          image2WebP='/resource/garden-room/garden-room5.webp'
          image2Avif='/resource/garden-room/garden-room5.avif'
          image2Alt='Garden Room 2'
          bottomText="We blend sleek architectural aesthetics with cutting-edge steel frame engineering to deliver garden rooms that are built to impress, and built to last. Every project is tailored to your needs, with minimal disruption and maximum impact.

          Our team handles everything from design to installation, ensuring a smooth, stress-free process. Whether you're after extra space for work, wellness, or weekend lounging, we're here to make it happen, beautifully and efficiently."
          button2Text = "Need more info?"
          button2Link = "/garden-room"
          renderLink={renderLink}
        />
      </div>

      {/* house extension Section */}
      <div id='landing_house_extension_description'>
          <TwoColumnSplitLayout 
            backgroundColor="white"
            subtitle="House Extension"
            title={"Inspired by vision,\nbuild for you"}
            description1="Our steel frame house extensions are designed to give your home the room it needs, without the long build times or messy construction. Whether you're expanding your kitchen, adding a new bedroom, or creating an open-plan living area, we deliver smart, efficient extensions that seamlessly blend with your existing home."
            button1Text="Get a free quote today"
            button1Link="/contact"
            image1Src='/resource/house-extension/house-extension1.png'
            image1WebP='/resource/house-extension/house-extension1.webp'
            image1Avif='/resource/house-extension/house-extension1.avif'
            image1Alt='House Extension 1'
            image2Src='/resource/house-extension/house-extension2.png'
            image2WebP='/resource/house-extension/house-extension2.webp'
            image2Avif='/resource/house-extension/house-extension2.avif'
            image2Alt='House Extension 2'
            bottomText="We use precision engineered light gauge steel to build extensions that are faster, cleaner, and stronger than traditional methods. This means less time onsite, more design flexibility, and long-term structural integrity all while meeting Ireland’s planning and building regulations.
            
            From consultation to completion, our experienced team guides you every step of the way. We’re here to help you create a space that works for how you live today and tomorrow."
            button2Text = "Need more info?"
            button2Link = "/house-extension"
            renderLink={renderLink}
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
            {
              src: "/resource/masonry-gallery/crop-garden-room-sauna1.jpg",
              srcWebP: "/resource/masonry-gallery/crop-garden-room-sauna1.webp",
              srcAvif: "/resource/masonry-gallery/crop-garden-room-sauna1.avif",
              fullSizeSrc: "/resource/garden-room/garden-room-sauna1.jpg", // or a larger version
              alt: "Steel frame house extension with modern design",
              width: 833,  // actual image width in pixels
              height: 763  // actual image height in pixels
            },
            { 
              src: "/resource/masonry-gallery/crop-garden-room-sauna3.jpg",
              srcWebP: "/resource/masonry-gallery/crop-garden-room-sauna3.webp",
              srcAvif: "/resource/masonry-gallery/crop-garden-room-sauna3.avif",
              fullSizeSrc: "/resource/garden-room/garden-room-sauna3.jpg", // or a larger version
              alt: "Steel frame house extension with modern design",
              width: 833,  // actual image width in pixels
              height: 763  // actual image height in pixels
            },
            { 
              src: "/resource/masonry-gallery/crop-garden-room1.png",
              srcWebP: "/resource/masonry-gallery/crop-garden-room1.webp",
              srcAvif: "/resource/masonry-gallery/crop-garden-room1.avif",
              fullSizeSrc: "/resource/garden-room/garden-room1.webp", // or a larger version
              alt: "Steel frame house extension with modern design",
              width: 833,  // actual image width in pixels
              height: 763  // actual image height in pixels
            },
            { 
              src: "/resource/masonry-gallery/crop-garden-room3.png",
              srcWebP: "/resource/masonry-gallery/crop-garden-room3.webp",
              srcAvif: "/resource/masonry-gallery/crop-garden-room3.avif",
              fullSizeSrc: "/resource/garden-room/garden-room3.webp", // or a larger version
              alt: "Steel frame house extension with modern design",
              width: 833,  // actual image width in pixels
              height: 763  // actual image height in pixels
            },
            { 
              src: "/resource/masonry-gallery/crop-garden-room4.png",
              srcWebP: "/resource/masonry-gallery/crop-garden-room4.webp",
              srcAvif: "/resource/masonry-gallery/crop-garden-room4.avif",
              fullSizeSrc: "/resource/garden-room/garden-room4.webp", // or a larger version
              alt: "Steel frame house extension with modern design",
              width: 833,  // actual image width in pixels
              height: 763  // actual image height in pixels
            },
            { 
              src: "/resource/masonry-gallery/crop-garden-room5.png",
              srcWebP: "/resource/masonry-gallery/crop-garden-room5.webp",
              srcAvif: "/resource/masonry-gallery/crop-garden-room5.avif",
              fullSizeSrc: "/resource/garden-room/garden-room5.webp", // or a larger version
              alt: "Steel frame house extension with modern design",
              width: 833,  // actual image width in pixels
              height: 763  // actual image height in pixels
            },
            { 
              src: "/resource/masonry-gallery/crop-house-extension1.png",
              srcWebP: "/resource/masonry-gallery/crop-house-extension1.webp",
              srcAvif: "/resource/masonry-gallery/crop-house-extension1.avif",
              fullSizeSrc: "/resource/house-extension/house-extension1.webp", // or a larger version
              alt: "Steel frame house extension with modern design",
              width: 833,  // actual image width in pixels
              height: 763  // actual image height in pixels
            },
            { 
              src: "/resource/masonry-gallery/crop-house-extension2.png",
              srcWebP: "/resource/masonry-gallery/crop-house-extension2.webp",
              srcAvif: "/resource/masonry-gallery/crop-house-extension2.avif",
              fullSizeSrc: "/resource/house-extension/house-extension2.webp", // or a larger version
              alt: "Steel frame house extension with modern design",
              width: 833,  // actual image width in pixels
              height: 763  // actual image height in pixels
            },
          ]}
          columns = {4}
        />
      </div>

      {/*   Mini FAQ Section    */}      
      <div id='landing_faq'>
        <MiniFAQs
          title='Modular.'
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