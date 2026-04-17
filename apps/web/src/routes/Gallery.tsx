/**
 * Gallery Route Component
 * =============================================================================
 *
 * PURPOSE:
 * Top-level page component for the /gallery route. Renders the company project
 * gallery using shared UI components from @modular-house/ui and centralised
 * data constants from ../data/gallery-data.
 *
 * LAYOUT (3-section design):
 * Section 1 -- Hero (HeroBoldBottomText)
 * Section 2 -- Category Filter + Masonry Grid (FullMassonryGallery)
 * Section 3 -- CTA (GradientCTA)
 *
 * ARCHITECTURE:
 * - Header is configured for dark variant with position overlay so it sits
 *   transparently over the hero background image.
 * - A custom LinkRenderer bridges React Router's Link component into the
 *   shared UI library, which is router-agnostic by design.
 * - All static content is imported from gallery-data.ts so this component
 *   remains purely presentational with no inline copy.
 * - Category filtering is handled client-side using URL search parameters,
 *   preserving shareable/bookmarkable filtered views.
 * - SEO metadata is injected automatically by TemplateLayout using the
 *   centralised routes-metadata configuration; no inline Seo component
 *   is required.
 *
 * =============================================================================
 */

import React, { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  HeroBoldBottomText,
  FullMassonryGallery,
  GradientCTA,
  type GalleryItem,
  type LinkRenderer,
} from '@modular-house/ui';
import { useHeaderConfig } from '../components/HeaderContext';
import {
  GALLERY_HERO,
  GALLERY_IMAGES,
  GALLERY_CTA,
  type GalleryCategory,
} from '../data/gallery-data';
import './Gallery.css';


/* =============================================================================
   SECTION 1: FILTER CATEGORY DEFINITIONS
   =============================================================================
   Constant array of available category filter options. Each entry maps a
   URL-safe value to a human-readable label. The undefined value represents
   the "show all" state. Defined outside the component to avoid re-creation
   on every render cycle.
   ============================================================================= */

/**
 * Describes a single filter option in the category filter bar.
 */
interface FilterOption {
  /** URL search parameter value, or undefined for the "All" option. */
  readonly value: GalleryCategory | undefined;
  /** Display label rendered inside the filter button. */
  readonly label: string;
}

/**
 * Available gallery filter categories.
 * Extending this array automatically adds a new filter button to the UI
 * without modifying the rendering logic (Open-Closed Principle).
 */
const FILTER_OPTIONS: readonly FilterOption[] = [
  { value: undefined, label: 'All Projects' },
  { value: 'garden-room', label: 'Garden Rooms' },
  { value: 'house-extension', label: 'House Extensions' },
] as const;


/* =============================================================================
   SECTION 2: COMPONENT IMPLEMENTATION
   ============================================================================= */

const Gallery: React.FC = () => {

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
     URL Search Parameter State
     ---------------------------------------------------------------------------
     The active category filter is stored in the URL search parameters
     (?category=garden-room) so filtered views are shareable and bookmarkable.
     Invalid parameter values are normalised to undefined (show all).
     --------------------------------------------------------------------------- */
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const activeCategory: GalleryCategory | undefined =
    categoryParam === 'garden-room' || categoryParam === 'house-extension'
      ? categoryParam
      : undefined;


  /* ---------------------------------------------------------------------------
     Filtered Image Set
     ---------------------------------------------------------------------------
     Derives the displayed image array from the full catalogue based on the
     active category filter. Memoised to avoid recomputation on unrelated
     re-renders. When no category is selected, all images are displayed.
     --------------------------------------------------------------------------- */
  const filteredImages: GalleryItem[] = useMemo(() => {
    if (!activeCategory) {
      return GALLERY_IMAGES;
    }
    return GALLERY_IMAGES.filter(
      (image) => image.category === activeCategory
    );
  }, [activeCategory]);


  /* ---------------------------------------------------------------------------
     Event Handlers
     ---------------------------------------------------------------------------
     Category change handler updates the URL search parameters. Selecting
     the "All" option (undefined) clears the category parameter entirely
     to produce a clean URL.
     --------------------------------------------------------------------------- */

  /**
   * Updates the URL search parameter to reflect the selected category.
   * Uses standard DOM event flow via React's synthetic event system.
   *
   * @param category - The category to filter by, or undefined for all
   */
  const handleCategoryChange = (category: GalleryCategory | undefined): void => {
    if (category) {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };


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
    <div className="gallery-page">

      {/* ===================================================================
          Section 1 -- Hero
          ===================================================================
          Full-width hero banner with bold bottom-aligned text. Establishes
          the visual tone of the portfolio page with a prominent background
          image of a completed project. No CTA button is displayed on the
          gallery hero — visitors proceed naturally to the gallery grid.
          =================================================================== */}
      <div id="gallery-hero">
        <HeroBoldBottomText
          titleLine1={GALLERY_HERO.titleLine1}
          titleLine2={GALLERY_HERO.titleLine2}
          bigText={GALLERY_HERO.bigText}
          backgroundImage={GALLERY_HERO.backgroundImage}
          backgroundImageWebP={GALLERY_HERO.backgroundImageWebP}
          backgroundImageAvif={GALLERY_HERO.backgroundImageAvif}
          renderLink={renderLink}
        />
      </div>

      {/* ===================================================================
          Section 2 -- Category Filter + Masonry Gallery
          ===================================================================
          A horizontal row of filter buttons followed by the full masonry
          image grid. The filter controls which images appear in the grid;
          the FullMassonryGallery component handles masonry layout and
          lightbox functionality internally. The filter bar is rendered
          outside the gallery component to maintain separation of concerns
          between filtering logic (page-level) and presentation (UI library).
          =================================================================== */}

      {/* Category filter bar */}
      <nav
        className="gallery-page__filter-bar"
        aria-label="Gallery category filters"
      >
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.label}
            type="button"
            className={`gallery-page__filter-btn${
              activeCategory === option.value
                ? ' gallery-page__filter-btn--active'
                : ''
            }`}
            onClick={() => handleCategoryChange(option.value)}
            aria-pressed={activeCategory === option.value}
          >
            {option.label}
          </button>
        ))}
      </nav>

      {/* Masonry gallery grid with integrated lightbox */}
      <div id="gallery-grid">
        <FullMassonryGallery
          items={filteredImages}
          itemCount={filteredImages.length}
          title="Our Projects"
          description="Explore our portfolio of completed garden rooms and house extensions. Every project is built with premium steel framework, engineered for Irish weather."
        />
      </div>

      {/* ===================================================================
          Section 3 -- CTA
          ===================================================================
          Full-width call-to-action section using the brand signature gradient.
          The CTA links to the /contact page via an anchor element, bridged
          through the linkRenderer for React Router integration.
          =================================================================== */}
      <div id="gallery-cta">
        <GradientCTA
          heading={GALLERY_CTA.heading}
          subtext={GALLERY_CTA.subtext}
          ctaLabel={GALLERY_CTA.ctaLabel}
          ctaHref={GALLERY_CTA.ctaHref}
          linkRenderer={renderLink}
          ariaLabel="Gallery call to action"
        />
      </div>

    </div>
  );
};

export default Gallery;