/**
 * Gallery Page — Static Data Constants
 * =============================================================================
 *
 * PURPOSE:
 * Centralises all static content and image references used by the /gallery
 * route component. Separating data from presentation ensures the Gallery
 * page remains purely presentational and content updates require no changes
 * to the rendering logic.
 *
 * DATA SECTIONS:
 * - GALLERY_HERO: Background image and heading content for the hero section.
 * - GALLERY_IMAGES: Full catalogue of gallery images spanning both product
 *   categories (garden rooms and house extensions). Each entry includes
 *   AVIF, WebP, and fallback image paths plus descriptive metadata.
 * - GALLERY_CTA: Heading, subtext, and link for the closing call-to-action.
 *
 * IMAGE PATHS:
 * All images are sourced from /resource/garden-room/ and
 * /resource/house-extension/ within the public directory. The path format
 * omits the /apps/web/public prefix since Vite serves public assets from
 * the root.
 *
 * =============================================================================
 */

import type { GalleryItem } from '@modular-house/ui';

/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   =============================================================================
   Category union type restricts gallery items to valid product categories.
   ============================================================================= */

/**
 * Valid gallery category identifiers used for filtering behaviour.
 * Matches the URL search parameter values accepted by the Gallery route.
 */
export type GalleryCategory = 'garden-room' | 'house-extension';

/* =============================================================================
   SECTION 2: HERO CONFIGURATION
   =============================================================================
   Static content for the full-viewport hero banner at the top of the gallery.
   ============================================================================= */

/**
 * Hero section configuration for the Gallery page.
 * Uses the first garden room image as the background to immediately
 * establish the visual context of the portfolio.
 */
export const GALLERY_HERO = {
  titleLine1: 'Modular House,',
  titleLine2: 'Modular Living.',
  bigText: 'Gallery',
  backgroundImage: '/resource/garden-room/garden-room1.png',
  backgroundImageWebP: '/resource/garden-room/garden-room1.webp',
  backgroundImageAvif: '/resource/garden-room/garden-room1.avif',
} as const;

/* =============================================================================
   SECTION 3: GALLERY IMAGE CATALOGUE
   =============================================================================
   Each entry represents one project image displayed in the masonry grid.
   The order determines the visual arrangement in the CSS column layout.
   Images are grouped by category to support filtering functionality.
   ============================================================================= */

/**
 * Complete catalogue of gallery images for the masonry grid.
 * Each entry provides the full AVIF/WebP/fallback chain for optimal
 * performance across browser capabilities.
 */
export const GALLERY_IMAGES: GalleryItem[] = [
  /* -------------------------------------------------------------------------
     Garden Room Projects
     ------------------------------------------------------------------------- */
  {
    imageUrl: '/resource/garden-room/garden-room1.png',
    imageWebP: '/resource/garden-room/garden-room1.webp',
    imageAvif: '/resource/garden-room/garden-room1.avif',
    title: 'Contemporary Garden Room',
    category: 'garden-room',
  },
  {
    imageUrl: '/resource/garden-room/garden-room2.png',
    imageWebP: '/resource/garden-room/garden-room2.webp',
    imageAvif: '/resource/garden-room/garden-room2.avif',
    title: 'Modern Studio Garden Room',
    category: 'garden-room',
  },
  {
    imageUrl: '/resource/garden-room/garden-room3.png',
    imageWebP: '/resource/garden-room/garden-room3.webp',
    imageAvif: '/resource/garden-room/garden-room3.avif',
    title: 'Premium Garden Room',
    category: 'garden-room',
  },
  {
    imageUrl: '/resource/garden-room/garden-room4.png',
    imageWebP: '/resource/garden-room/garden-room4.webp',
    imageAvif: '/resource/garden-room/garden-room4.avif',
    title: 'Insulated Garden Room',
    category: 'garden-room',
  },
  {
    imageUrl: '/resource/garden-room/garden-room5.png',
    imageWebP: '/resource/garden-room/garden-room5.webp',
    imageAvif: '/resource/garden-room/garden-room5.avif',
    title: 'Garden Office Studio',
    category: 'garden-room',
  },
  /*{
    imageUrl: '/resource/garden-room/garden-room6.jpg',
    imageWebP: '/resource/garden-room/garden-room6.webp',
    imageAvif: '/resource/garden-room/garden-room6.avif',
    title: 'Steel Frame Garden Room',
    category: 'garden-room',
  },
  {
    imageUrl: '/resource/garden-room/garden-room7.jpg',
    imageWebP: '/resource/garden-room/garden-room7.webp',
    imageAvif: '/resource/garden-room/garden-room7.avif',
    title: 'Luxury Garden Room',
    category: 'garden-room',
  },*/
  {
    imageUrl: '/resource/garden-room/garden-room-sauna1.jpg',
    imageWebP: '/resource/garden-room/garden-room-sauna1.webp',
    imageAvif: '/resource/garden-room/garden-room-sauna1.avif',
    title: 'Garden Room with Sauna',
    category: 'garden-room',
  },
  {
    imageUrl: '/resource/garden-room/garden-room-sauna2.jpg',
    imageWebP: '/resource/garden-room/garden-room-sauna2.webp',
    imageAvif: '/resource/garden-room/garden-room-sauna2.avif',
    title: 'Premium Sauna Garden Room',
    category: 'garden-room',
  },
  {
    imageUrl: '/resource/garden-room/garden-room-sauna3.jpg',
    imageWebP: '/resource/garden-room/garden-room-sauna3.webp',
    imageAvif: '/resource/garden-room/garden-room-sauna3.avif',
    title: 'Deluxe Sauna Garden Room',
    category: 'garden-room',
  },

  /* -------------------------------------------------------------------------
     House Extension Projects
     ------------------------------------------------------------------------- */
  {
    imageUrl: '/resource/house-extension/house-extension1.png',
    imageWebP: '/resource/house-extension/house-extension1.webp',
    imageAvif: '/resource/house-extension/house-extension1.avif',
    title: 'Modern House Extension',
    category: 'house-extension',
  },
  {
    imageUrl: '/resource/house-extension/house-extension2.png',
    imageWebP: '/resource/house-extension/house-extension2.webp',
    imageAvif: '/resource/house-extension/house-extension2.avif',
    title: 'Rear House Extension',
    category: 'house-extension',
  },{
    imageUrl: '/resource/house-extension/house-extension3.png',
    imageWebP: '/resource/house-extension/house-extension3.webp',
    imageAvif: '/resource/house-extension/house-extension3.avif',
    title: 'Modern House Extension',
    category: 'house-extension',
  },
  {
    imageUrl: '/resource/house-extension/house-extension4.png',
    imageWebP: '/resource/house-extension/house-extension4.webp',
    imageAvif: '/resource/house-extension/house-extension4.avif',
    title: 'Rear House Extension',
    category: 'house-extension',
  },
];

/* =============================================================================
   SECTION 4: CALL-TO-ACTION CONFIGURATION
   =============================================================================
   Content for the GradientCTA section displayed at the bottom of the page.
   ============================================================================= */

/**
 * Call-to-action section content for the bottom of the Gallery page.
 * Drives visitors towards the contact page after browsing project images.
 */
export const GALLERY_CTA = {
  heading: 'Inspired by What You See?',
  subtext: 'Let us bring your vision to life. Get in touch for a free consultation on your garden room or house extension project.',
  ctaLabel: 'Get In Touch',
  ctaHref: '/contact',
} as const;
