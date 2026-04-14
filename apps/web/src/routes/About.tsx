/**
 * About Route Component
 * =============================================================================
 *
 * PURPOSE:
 * Top-level page component for the /about route. Renders the company About
 * page using shared UI components from @modular-house/ui and centralised
 * data constants from ../data/about-data.
 *
 * LAYOUT (7-section design):
 * Section 1 -- Hero (HeroBoldBottomText)
 * Section 2 -- Our Story (ContentWithImage)
 * Section 3 -- Mission & Values (ValueCardGrid)
 * Section 4 -- Why Steel Frame (FeatureChecklist)
 * Section 5 -- Our Team (TeamGrid)
 * Section 6 -- Stats (StatsBar)
 * Section 7 -- CTA (GradientCTA)
 *
 * ARCHITECTURE:
 * - Header is configured for dark variant with position overlay so it sits
 *   transparently over the hero background image.
 * - A custom LinkRenderer bridges React Router's Link component into the
 *   shared UI library, which is router-agnostic by design.
 * - All content is imported from about-data.ts so this component remains
 *   purely presentational with no inline copy.
 *
 * =============================================================================
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HeroBoldBottomText,
  ContentWithImage,
  ValueCardGrid,
  FeatureChecklist,
  //TeamGrid,
  StatsBar,
  GradientCTA,
  type LinkRenderer,
} from '@modular-house/ui';
import { useHeaderConfig } from '../components/HeaderContext';
import {
  ABOUT_HERO,
  ABOUT_STORY,
  ABOUT_STORY_PARAGRAPHS,
  ABOUT_VALUES,
  ABOUT_STEEL_FRAME,
  ABOUT_STEEL_FRAME_IMAGE,
  //ABOUT_TEAM_MEMBERS,
  ABOUT_STATS,
  ABOUT_CTA,
} from '../data/about-data.js';
import './About.css';


const About: React.FC = () => {
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
     a linkRenderer prop conforming to the LinkRenderer interface, allowing the
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


  return (
    <div className="about-page">

      {/* ===================================================================
          Section 1 -- Hero
          ===================================================================
          Full-width hero banner with bold bottom-aligned text. No CTA button
          is displayed on the About hero — the section serves a purely
          editorial purpose to set the page tone.
          =================================================================== */}
      <div id="about-hero">
        <HeroBoldBottomText
          titleLine1={ABOUT_HERO.titleLine1}
          titleLine2={ABOUT_HERO.titleLine2}
          backgroundImage={ABOUT_HERO.backgroundImage}
          backgroundImageWebP={ABOUT_HERO.backgroundImageWebP}
          backgroundImageAvif={ABOUT_HERO.backgroundImageAvif}
          bigText={ABOUT_HERO.bigText}
          renderLink={renderLink}
        />
      </div>

      {/* ===================================================================
          Section 2 -- Our Story
          ===================================================================
          Two-column layout pairing editorial narrative text with a supporting
          image. The image is placed on the right (imageFirst=false) to match
          the approved HTML template. Body text is rendered from the
          ABOUT_STORY_PARAGRAPHS array as individual <p> elements.
          =================================================================== */}
      <div id="our-story">
        <ContentWithImage
          eyebrow={ABOUT_STORY.eyebrow}
          heading={ABOUT_STORY.heading}
          imageSrc={ABOUT_STORY.imageSrc}
          imageWebP={ABOUT_STORY.imageWebP}
          imageAvif={ABOUT_STORY.imageAvif}
          imageAlt={ABOUT_STORY.imageAlt}
          imageAspectRatio={ABOUT_STORY.imageAspectRatio}
          imageFirst={false}
          backgroundColor="primary"
        >
          {ABOUT_STORY_PARAGRAPHS.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </ContentWithImage>
      </div>

      {/* ===================================================================
          Section 3 -- Mission & Values
          ===================================================================
          Centered section header above a responsive grid of three icon-led
          content cards. The secondary (warm beige) background provides visual
          contrast with the adjacent white sections.
          =================================================================== */}
      <div id="mission-values">
        <ValueCardGrid
          eyebrow="WHAT DRIVES US"
          heading="Built on Quality, Delivered with Care"
          items={ABOUT_VALUES}
          backgroundColor="secondary"
        />
      </div>

      {/* ===================================================================
          Section 4 -- Why Steel Frame
          ===================================================================
          Two-column layout with a square image on the left and a checklist
          of four steel-frame construction benefits on the right. The image-
          first layout matches the approved HTML template.
          =================================================================== */}
      <div id="why-steel-frame">
        <FeatureChecklist
          eyebrow="WHY STEEL FRAME"
          heading="The Future of Rapid Construction"
          items={ABOUT_STEEL_FRAME}
          imageSrc={ABOUT_STEEL_FRAME_IMAGE.imageSrc}
          imageWebP={ABOUT_STEEL_FRAME_IMAGE.imageWebP}
          imageAvif={ABOUT_STEEL_FRAME_IMAGE.imageAvif}
          imageAlt={ABOUT_STEEL_FRAME_IMAGE.imageAlt}
          imageFirst={true}
          backgroundColor="primary"
        />
      </div>

      {/* ===================================================================
          Section 5 -- Our Team
          ===================================================================
          Dark-background section displaying four team members in a responsive
          grid with circular avatar photographs, names, roles, and short bios.
          Avatars use a grayscale-to-colour hover effect as specified in the
          component design.
          =================================================================== */}
      {/*
      <div id="our-team">
        <TeamGrid
          eyebrow="OUR TEAM"
          heading="The People Behind Every Build"
          members={ABOUT_TEAM_MEMBERS}
        />
      </div>*/}

      {/* ===================================================================
          Section 6 -- Stats
          ===================================================================
          Horizontal bar of four key performance metrics displayed as large
          numerals with captions. The secondary background matches the
          approved template. Stats are compact trust indicators shown after
          the team section and before the final CTA.
          =================================================================== */}
      <div id="stats">
        <StatsBar
          stats={ABOUT_STATS}
          backgroundColor="secondary"
        />
      </div>

      {/* ===================================================================
          Section 7 -- CTA
          ===================================================================
          Full-width call-to-action section using the brand signature gradient.
          The CTA links to the /contact page via an anchor element, bridged
          through the linkRenderer for React Router integration.
          =================================================================== */}
      <div id="about-cta">
        <GradientCTA
          heading={ABOUT_CTA.heading}
          subtext={ABOUT_CTA.subtext}
          ctaLabel={ABOUT_CTA.ctaLabel}
          ctaHref={ABOUT_CTA.ctaHref}
          linkRenderer={renderLink}
          ariaLabel="Call to action"
        />
      </div>

    </div>
  );
};

export default About;