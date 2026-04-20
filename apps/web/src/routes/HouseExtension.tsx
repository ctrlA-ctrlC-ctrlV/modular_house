/**
 * HouseExtension Route Component
 * =============================================================================
 *
 * PURPOSE:
 * Top-level page component for the /house-extensions route. Renders a
 * conversion-optimised marketing page using shared UI components from
 * @modular-house/ui and centralised data constants from
 * ../data/house-extension-data.ts.
 *
 * LAYOUT (9-section design):
 * Section 1 -- Hero (HeroBoldBottomText)
 * Section 2 -- Text Intro (TextIntroSection)
 * Section 3 -- Bespoke Callout (GoBespokeBanner)
 * Section 4 -- Quality & Trust (FeatureShowcase, default layout)
 * Section 5 -- Transparent Pricing (FeatureShowcase, reversed layout)
 * Section 6 -- Testimonials (TestimonialGrid)
 * Section 7 -- Gallery (InfiniteMasonryGallery)
 * Section 8 -- FAQ (AccordionFAQ)
 * Section 9 -- Footer CTA (FooterCTA)
 *
 * ARCHITECTURE:
 * - Header is configured for dark variant with position overlay so it sits
 *   transparently over the hero background image.
 * - A custom LinkRenderer bridges React Router's Link component into the
 *   shared UI library, which is router-agnostic by design.
 * - All page content is imported from a centralised data file so this
 *   component remains purely presentational.
 * - Follows the Open-Closed Principle: new sections can be added by
 *   appending data exports and composing additional component instances
 *   without modifying existing section logic.
 *
 * =============================================================================
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HeroBoldBottomText,
  TextIntroSection,
  GoBespokeBanner,
  FeatureShowcase,
  TestimonialGrid,
  InfiniteMasonryGallery,
  AccordionFAQ,
  FooterCTA,
  EnquiryFormModal,
  type EnquiryFormData,
  type LinkRenderer,
} from '@modular-house/ui';
import { apiClient } from '../lib/apiClient';
import { useHeaderConfig } from '../components/HeaderContext';
import {
  HERO_CONFIG,
  TEXT_INTRO,
  BESPOKE_BANNER,
  QUALITY_FEATURES,
  QUALITY_BADGE,
  QUALITY_IMAGE,
  PRICING_FEATURES,
  PRICING_IMAGE,
  HOUSE_EXTENSION_TESTIMONIALS,
  HOUSE_EXTENSION_GALLERY,
  HOUSE_EXTENSION_FAQS,
  FOOTER_CTA_CONFIG,
  FOOTER_CTA_ACTIONS,
} from '../data/house-extension-data';


const HouseExtension: React.FC = () => {

  /* ---------------------------------------------------------------------------
     Header Configuration
     ---------------------------------------------------------------------------
     Sets the site header to dark variant with absolute positioning so it
     overlays the hero image. The cleanup function resets to the same config
     to prevent flash-of-unstyled-header during route transitions.
     --------------------------------------------------------------------------- */
  const { setHeaderConfig } = useHeaderConfig();
  useEffect(() => {
    setHeaderConfig({ variant: 'dark', positionOver: true });

    return () => {
      setHeaderConfig({ variant: 'dark', positionOver: true });
    };
  }, [setHeaderConfig]);


  /* ---------------------------------------------------------------------------
     Enquiry Modal State
     ---------------------------------------------------------------------------
     Controls visibility of the EnquiryFormModal overlay. The modal is opened
     by the GoBespokeBanner CTA and closed via backdrop click, Escape key,
     or the modal's internal close button.
     --------------------------------------------------------------------------- */
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);


  /* ---------------------------------------------------------------------------
     Link Renderer
     ---------------------------------------------------------------------------
     Adapter function that injects React Router's <Link> into shared UI
     components. The @modular-house/ui package is router-agnostic; it accepts
     a renderLink prop conforming to the LinkRenderer interface, allowing the
     consuming app to control navigation behaviour.
     --------------------------------------------------------------------------- */
  const renderLink: LinkRenderer = (props) => {
    const { href, children, className, onClick, ...rest } = props;
    return (
      <Link to={href} className={className} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  };


  /* ---------------------------------------------------------------------------
     Enquiry Form Submission Handler
     ---------------------------------------------------------------------------
     Delegates form data from the EnquiryFormModal to the apiClient for
     server-side processing. Maps the modal's payload to the API schema
     expected by the backend. The sourcePage field identifies the origin
     of the enquiry for the sales team.
     --------------------------------------------------------------------------- */
  const handleEnquirySubmit = useCallback(async (data: EnquiryFormData): Promise<void> => {
    await apiClient.submitEnquiry({
      firstName: data.firstName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      preferredProduct: 'House Extension',
      message: data.roomSize ? `Preferred extension size: ${data.roomSize}` : undefined,
      consent: data.consent,
      website: data.website,
      sourcePage: 'house-extensions',
    });
  }, []);


  return (
    <div className="house-extension-page">

      {/* ===================================================================
          Section 1 -- Hero
          ===================================================================
          Full-width hero banner with bold bottom-aligned heading, a primary
          CTA button linking to the contact page, and a decorative oversized
          "House Extension" text element. Uses optimised local image assets
          with AVIF/WebP/PNG fallback chain for LCP performance.
          =================================================================== */}
      <div id="house-extension-hero">
        <HeroBoldBottomText
          titleLine1={HERO_CONFIG.titleLine1}
          ctaText={HERO_CONFIG.ctaText}
          ctaLink={HERO_CONFIG.ctaLink}
          backgroundImage={HERO_CONFIG.backgroundImage}
          backgroundImageWebP={HERO_CONFIG.backgroundImageWebP}
          backgroundImageAvif={HERO_CONFIG.backgroundImageAvif}
          bigText={HERO_CONFIG.bigText}
          renderLink={renderLink}
        />
      </div>


      {/* ===================================================================
          Section 2 -- Text Introduction
          ===================================================================
          Centred editorial section with an eyebrow label flanked by
          decorative horizontal rules, a serif display heading, two body
          paragraphs, and a bottom divider. Establishes the value proposition
          and narrative context for the page.
          =================================================================== */}
      <div id="text-intro">
        <TextIntroSection
          eyebrow={TEXT_INTRO.eyebrow}
          title={TEXT_INTRO.title}
          paragraphs={[...TEXT_INTRO.paragraphs]}
        />
      </div>


      {/* ===================================================================
          Section 3 -- Bespoke Callout
          ===================================================================
          Dark two-column CTA banner targeting visitors whose requirements
          go beyond standard extension configurations. The CTA opens the
          enquiry modal so the user can submit a bespoke project request.
          =================================================================== */}
      <div id="go-bespoke">
        <GoBespokeBanner
          eyebrow={BESPOKE_BANNER.eyebrow}
          heading={<>{BESPOKE_BANNER.headingLine1}<br />{BESPOKE_BANNER.headingLine2}</>}
          subtext={BESPOKE_BANNER.subtext}
          ctaLabel={BESPOKE_BANNER.ctaLabel}
          onCtaClick={() => {
            setIsEnquiryOpen(true);
          }}
          ariaLabel="Custom bespoke house extension enquiry"
        />
      </div>


      {/* ===================================================================
          Section 4 -- Quality & Trust
          ===================================================================
          Two-column feature showcase with text on the left and a portrait
          image on the right. Presents three trust-building features (A-rated
          insulation, planning compliance, structural warranty) with filled
          Material Symbol icons. A floating badge overlay displays the steel
          frame construction credential. White background for visual contrast
          with the preceding dark bespoke banner.
          =================================================================== */}
      <div id="quality-trust">
        <FeatureShowcase
          eyebrow="QUALITY & TRUST"
          title={<>Built to the Highest Standard</>}
          description="Our commitment to architectural integrity means we sweat the details. From structural engineering to the final coat of paint, quality is non-negotiable."
          features={QUALITY_FEATURES}
          imageSrc={QUALITY_IMAGE.src}
          imageWebP={QUALITY_IMAGE.webP}
          imageAvif={QUALITY_IMAGE.avif}
          imageAlt={QUALITY_IMAGE.alt}
          badge={QUALITY_BADGE}
          reversed={false}
          backgroundColor="white"
          iconVariant="filled"
        />
      </div>


      {/* ===================================================================
          Section 5 -- Transparent Pricing
          ===================================================================
          Same FeatureShowcase component reused with reversed layout (image
          left, text right) and a beige background to create alternating
          visual rhythm. Presents three pricing transparency features with
          outlined Material Symbol icons. No badge overlay on this instance.
          =================================================================== */}
      <div id="transparent-pricing">
        <FeatureShowcase
          eyebrow="TRANSPARENT PRICING"
          title={<>Competitive Pricing.<br />No Hidden Costs.</>}
          description="We believe in total transparency. Building an extension is a significant investment, and you deserve clarity from day one."
          features={PRICING_FEATURES}
          imageSrc={PRICING_IMAGE.src}
          imageWebP={PRICING_IMAGE.webP}
          imageAvif={PRICING_IMAGE.avif}
          imageAlt={PRICING_IMAGE.alt}
          reversed={true}
          backgroundColor="beige"
          iconVariant="outlined"
        />
      </div>


      {/* ===================================================================
          Section 6 -- Testimonials
          ===================================================================
          Responsive grid of customer testimonial cards featuring quotes,
          names, Dublin-area locations, and star ratings. Provides social
          proof to reinforce the quality and pricing propositions above.
          =================================================================== */}
      <div id="testimonials">
        <TestimonialGrid
          subTitle="WHAT OUR CLIENTS SAY"
          title="Trusted by Homeowners Across Dublin"
          testimonials={HOUSE_EXTENSION_TESTIMONIALS}
        />
      </div>


      {/* ===================================================================
          Section 7 -- Gallery
          ===================================================================
          Horizontally-scrolling infinite masonry gallery showcasing
          completed house extension projects. Uses optimised local image
          assets with AVIF/WebP fallback. Supports drag scrolling,
          mouse-wheel navigation, momentum, and full-screen lightbox.
          =================================================================== */}
      <div id="gallery">
        <InfiniteMasonryGallery
          images={HOUSE_EXTENSION_GALLERY}
          eyebrow="OUR WORK"
          title="House Extension Projects"
        />
      </div>


      {/* ===================================================================
          Section 8 -- FAQ
          ===================================================================
          Accordion-style FAQ section with six house-extension-specific
          questions. Manages its own toggle state internally with full
          ARIA accessibility (aria-expanded, aria-controls, role="region").
          The beige background provides visual separation from the gallery
          above and the dark footer CTA below.
          =================================================================== */}
      <div id="faq" style={{ backgroundColor: '#F6F5F0' }}>
        <AccordionFAQ
          title="Frequently Asked Questions"
          faqs={HOUSE_EXTENSION_FAQS}
        />
      </div>


      {/* ===================================================================
          Section 9 -- Footer CTA
          ===================================================================
          Full-width dark call-to-action strip with a centred heading,
          supporting subtitle, and two action buttons (primary quote
          request + ghost phone call). Serves as the page's closing
          conversion point before the site footer.
          =================================================================== */}
      <div id="footer-cta">
        <FooterCTA
          title={FOOTER_CTA_CONFIG.title}
          subtitle={FOOTER_CTA_CONFIG.subtitle}
          actions={FOOTER_CTA_ACTIONS}
          renderLink={renderLink}
        />
      </div>


      {/* Enquiry Modal -- triggered by the GoBespokeBanner CTA */}
      <EnquiryFormModal
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
        onSubmit={handleEnquirySubmit}
      />

    </div>
  );
};

export default HouseExtension;
