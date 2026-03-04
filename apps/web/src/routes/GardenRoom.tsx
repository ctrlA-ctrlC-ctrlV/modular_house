/**
 * GardenRoom Route Component
 * =============================================================================
 *
 * PURPOSE:
 * Top-level page component for the /garden-room route. Renders the garden room
 * product landing page using shared UI components from @modular-house/ui and
 * centralised data constants from ../data/garden-room-data.
 *
 * LAYOUT (8-section design):
 * Section 1 — Hero (HeroBoldBottomText + "Explore Our Ranges" anchor link)
 * Section 2 — Product Range (ProductRangeGrid)
 * Section 3 — Why Steel Frame (FeatureSection)
 * Section 4 — Planning Permission (TwoColumnSplitLayout)
 * Section 5 — Gallery (FullMassonryGallery)
 * Section 6 — Testimonials (TestimonialGrid)
 * Sections 7-8 — TODO: FAQ, CTA
 *
 * ARCHITECTURE:
 * - Header is configured for dark variant with position overlay so it sits
 *   transparently over the hero background image.
 * - A custom LinkRenderer bridges React Router's Link component into the
 *   shared UI library, which is router-agnostic by design.
 * - Product data is imported from a centralised data file so this component
 *   remains purely presentational.
 *
 * =============================================================================
 */

import React, { useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HeroBoldBottomText,
  ProductRangeGrid,
  FeatureSection,
  TwoColumnSplitLayout,
  FullMassonryGallery,
  TestimonialGrid,
  type LinkRenderer,
} from '@modular-house/ui';
import { useHeaderConfig } from '../components/HeaderContext';
import {
  GARDEN_ROOM_PRODUCTS,
  GARDEN_ROOM_FEATURES,
  GARDEN_ROOM_GALLERY,
  GARDEN_ROOM_TESTIMONIALS,
} from '../data/garden-room-data';
import './GardenRoom.css';


const GardenRoom: React.FC = () => {
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
     Smooth Scroll Handler
     ---------------------------------------------------------------------------
     Scrolls the viewport to the #product-range section when the user clicks
     the "Explore Our Ranges" anchor link. Uses the native scrollIntoView API
     with smooth behaviour for a polished transition.
     --------------------------------------------------------------------------- */
  const handleExploreClick = useCallback((): void => {
    document
      .getElementById('product-range')
      ?.scrollIntoView({ behavior: 'smooth' });
  }, []);


  return (
    <div className="l-container py-16">

      {/* ===================================================================
          Section 1 — Hero
          ===================================================================
          Full-width hero banner with bold bottom-aligned text, a primary CTA
          button, and a floating "Explore Our Ranges" anchor link that smooth-
          scrolls to the product range grid below.
          =================================================================== */}
      <div id="garden_room_hero" className="garden-room__hero">
        <HeroBoldBottomText
          titleLine1="Steel Frame Garden Rooms"
          titleLine2="Built to Last. Designed for Living."
          ctaText="Get a Free Quote"
          ctaLink="/contact"
          backgroundImage="/resource/garden_room_hero.png"
          backgroundImageWebP="/resource/garden_room_hero.webp"
          backgroundImageAvif="/resource/garden_room_hero.avif"
          bigText="Garden Room"
          renderLink={renderLink}
        />

        {/* "Explore Our Ranges" anchor — positioned at the bottom of the hero
            via absolute positioning (see GardenRoom.css). Uses a <button>
            element for accessibility since it triggers an in-page scroll
            action rather than navigating to a new URL. */}
        <button
          type="button"
          className="garden-room__explore-link"
          onClick={handleExploreClick}
          aria-label="Scroll down to explore our garden room range"
        >
          Explore Our Ranges
        </button>
      </div>


      {/* ===================================================================
          Section 2 — Product Range
          ===================================================================
          Displays four garden room product cards (15, 25, 35, 45 square
          metres) in a responsive grid. Product data is sourced from the
          centralised GARDEN_ROOM_PRODUCTS constant in garden-room-data.ts.
          =================================================================== */}
      <div id="product-range">
        <ProductRangeGrid
          eyebrow="OUR RANGE"
          title="Choose Your Perfect Size"
          description="Every garden room is precision-built with CNC-cut steel framing, superior insulation, and architectural-grade finishes."
          products={GARDEN_ROOM_PRODUCTS}
          renderLink={renderLink}
        />
      </div>


      {/* ===================================================================
          Section 3 — Why Steel Frame
          ===================================================================
          A four-column feature grid presenting the key advantages of steel
          frame construction. Each card includes an icon (from CustomIcons),
          a title, and a descriptive paragraph. The feature data is sourced
          from GARDEN_ROOM_FEATURES in garden-room-data.ts, which uses:
            - measureTape  -> Precision Steel Frame
            - tiles        -> Rapid Build
            - bioEnergy    -> Energy Efficient
            - keyCircle    -> Built to Last

          The section sits on a beige background (#F6F5F0) to provide
          visual separation between the Product Range and Planning
          Permission sections.
          =================================================================== */}
      <div id="why-steel-frame" style={{ backgroundColor: '#F6F5F0' }}>
        <FeatureSection
          topHeading="WHY MODULAR HOUSE"
          mainHeading="Engineered for Performance"
          introText={
            <p>
              Our garden rooms are built with CNC-cut steel framing — the same
              structural technology used in commercial construction. The result
              is a building that is stronger, faster to assemble, and more
              thermally efficient than traditional timber or block alternatives.
            </p>
          }
          features={GARDEN_ROOM_FEATURES}
        />
      </div>


      {/* ===================================================================
          Section 4 — Planning Permission
          ===================================================================
          Two-column layout presenting planning permission guidance for
          prospective garden room buyers in Ireland. The left column contains
          the informational copy with a checklist of exemption thresholds,
          and an external link to the government planning resource. The
          right column displays a compliant garden room photograph.

          The content covers three key points:
          1. Current exemption: up to 25m² requires no planning permission.
          2. Pending legislation: 35m² and 45m² sizes may become exempt.
          3. Service value: Modular House handles all planning paperwork.
          =================================================================== */}
      <div id="planning-permission">
        <TwoColumnSplitLayout
          backgroundColor="white"
          subtitle="PLANNING MADE SIMPLE"
          title="Do You Need Planning Permission?"
          description1={
            'Under current Irish law, garden rooms up to 25m\u00B2 are exempt from planning permission '
            + 'when they meet certain conditions. New legislation is being prepared to increase this '
            + 'threshold, which would allow garden rooms up to 45m\u00B2 without planning permission.\n\n'
            + '\u2713 Up to 25m\u00B2 \u2014 No planning permission needed\n'
            + '\u2713 35m\u00B2 & 45m\u00B2 \u2014 Legislation pending\n'
            + '\u2713 We handle all paperwork for you'
          }
          image1Src="/resource/garden-room/garden-room5.png"
          image1WebP="/resource/garden-room/garden-room5.webp"
          image1Avif="/resource/garden-room/garden-room5.avif"
          image1Alt="Garden room with planning permission compliant design"
          image1Width={2400}
          image1Height={1578}
          button1Text="Learn More About Planning"
          button1Link="https://www.gov.ie/en/publication/planning-exemptions/"
          renderLink={renderLink}
        />
      </div>


      {/* ===================================================================
          Section 5 — Gallery
          ===================================================================
          Masonry-style image gallery showcasing completed garden room and
          sauna projects. Each thumbnail supports WebP and AVIF optimised
          variants via the OptimizedImage component used internally by
          FullMassonryGallery. Clicking a thumbnail opens a full-screen
          lightbox viewer for detailed inspection.

          The gallery data is sourced from GARDEN_ROOM_GALLERY in
          garden-room-data.ts (8 items covering garden rooms and saunas).
          The beige background (#F6F5F0) provides visual separation from
          the white Planning Permission section above and the white
          Testimonials section below.
          =================================================================== */}
      <div id="garden_room_gallery" style={{ backgroundColor: '#F6F5F0' }}>
        <FullMassonryGallery
          itemCount={GARDEN_ROOM_GALLERY.length}
          items={GARDEN_ROOM_GALLERY}
          title="Garden Room Projects"
          description="Explore our portfolio of precision-built garden sanctuaries. See how Modular House combines steel-frame engineering with architectural design to create high-performance spaces you can enjoy year-round."
        />
      </div>


      {/* ===================================================================
          Section 6 — Testimonials
          ===================================================================
          Displays customer testimonials in a responsive grid layout. Each
          card includes a quote, the customer's name and location, and a
          star rating. The testimonial data is sourced from the centralised
          GARDEN_ROOM_TESTIMONIALS constant in garden-room-data.ts.

          This section uses the default white background to contrast with
          the beige gallery section above it.
          =================================================================== */}
      <div id="testimonials">
        <TestimonialGrid
          subTitle="WHAT OUR CLIENTS SAY"
          title="Trusted by Homeowners Across Ireland"
          testimonials={GARDEN_ROOM_TESTIMONIALS}
        />
      </div>


      {/* ===================================================================
          Sections 7-8 — TODO
          ===================================================================
          The remaining sections will be implemented in subsequent user
          stories:
            Section 7 — FAQ (US4)
            Section 8 — Bottom CTA (US5)
          =================================================================== */}

    </div>
  );
};

export default GardenRoom;
