/**
 * GardenRoomConfigurator Route Component
 * =============================================================================
 *
 * PURPOSE:
 * Route-level component for the /garden-rooms/configure/:slug URL pattern.
 * Resolves the dynamic :slug parameter to a ConfiguratorProduct from the
 * seed data, then renders the ProductConfiguratorPage component.
 *
 * URL EXAMPLES:
 *   /garden-rooms/configure/compact-15  -> The Compact (15 m2)
 *   /garden-rooms/configure/studio-25   -> The Studio (25 m2)
 *   /garden-rooms/configure/living-35   -> The Living (35 m2)
 *   /garden-rooms/configure/grand-45    -> The Grand (45 m2)
 *
 * ARCHITECTURE:
 * - Uses react-router-dom's useParams to extract the slug from the URL.
 * - Performs an O(1) lookup via CONFIGURATOR_PRODUCTS_BY_SLUG.
 * - Renders a 404-style fallback if the slug does not match any product.
 * - Configures the site header to use the light variant (non-overlay)
 *   since the configurator page has its own sticky sub-header.
 *
 * DATA FETCHING:
 * In the current architecture the product data is compiled into the
 * frontend bundle via the seed data in data/configurator-products.ts.
 * When the API endpoint is implemented, this component can be updated
 * to fetch from the API instead, while the ProductConfiguratorPage
 * component remains unchanged (it receives data via props).
 *
 * =============================================================================
 */

import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Seo } from '@modular-house/ui';
import { CONFIGURATOR_PRODUCTS_BY_SLUG } from '../data/configurator-products';
import { ProductConfiguratorPage } from '../components/ProductConfigurator';
import { useHeaderConfig } from '../components/HeaderContext';
import { BUILD_TIMESTAMP } from '../build-timestamp';


/* =============================================================================
   GardenRoomConfigurator Component
   ============================================================================= */

const GardenRoomConfigurator: React.FC = () => {
  /* -----------------------------------------------------------------------
     Header Configuration
     -----------------------------------------------------------------------
     The configurator page uses its own sticky sub-header, so the site
     header is set to the light variant with standard (non-overlay) positioning.
     ----------------------------------------------------------------------- */
  const { setHeaderConfig } = useHeaderConfig();
  useEffect(() => {
    setHeaderConfig({ variant: 'light', positionOver: false });

    return () => {
      setHeaderConfig({ variant: 'dark', positionOver: true });
    };
  }, [setHeaderConfig]);


  /* -----------------------------------------------------------------------
     Product Resolution
     -----------------------------------------------------------------------
     Extract the slug from the URL and resolve it to a product definition.
     ----------------------------------------------------------------------- */
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? CONFIGURATOR_PRODUCTS_BY_SLUG[slug] : undefined;


  /* -----------------------------------------------------------------------
     Fallback: Product Not Found
     -----------------------------------------------------------------------
     Renders a user-friendly message with a link back to the garden room
     product listing page.
     ----------------------------------------------------------------------- */
  if (!product) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 32,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "'Instrument Serif', serif",
          color: '#1a1a1a',
        }}>
          Product Not Found
        </h1>
        <p style={{ color: '#888', fontSize: 15 }}>
          The garden room configuration you requested could not be found.
        </p>
        <Link
          to="/garden-rooms"
          style={{
            padding: '12px 24px',
            background: '#1a1a1a',
            color: '#fff',
            borderRadius: 12,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          View All Garden Rooms
        </Link>
      </div>
    );
  }


  /* -----------------------------------------------------------------------
     SEO Metadata
     -----------------------------------------------------------------------
     Injects page-level <head> tags for search engines and social sharing.
     Because the route is dynamic (/:slug), metadata cannot be defined
     statically in routes-metadata.ts and must be composed at runtime
     from the resolved product data.

     The absolute image URL is constructed by prefixing the product's
     relative image.src path with the production domain. The
     BUILD_TIMESTAMP is forwarded as article:modified_time so social
     crawlers can assess content freshness.

     siteTitleSuffix is set to an empty string because the title prop
     already includes the "| Modular House" brand suffix.
     ----------------------------------------------------------------------- */
  const seoTitle = `Configure Your ${product.name} | Modular House`;
  const seoDescription =
    `${product.name} ${product.dimensions.areaM2}m\u00B2 steel frame garden room configurator. ` +
    'Choose finishes, add-ons, and get your instant estimate.';
  const canonicalUrl = `https://modularhouse.ie/garden-rooms/configure/${product.slug}`;
  /** Resolve the hero image URL for OG meta tags, preferring the legacy
   *  `image` accessor then falling back to the first entry in `images`. */
  const heroSrc = product.image?.src ?? product.images[0]?.src ?? '';
  const absoluteImageUrl = `https://modularhouse.ie${heroSrc}`;


  /* -----------------------------------------------------------------------
     Render the configurator page for the resolved product
     ----------------------------------------------------------------------- */
  return (
    <>
      <Seo
        title={seoTitle}
        siteTitleSuffix=""
        description={seoDescription}
        canonicalUrl={canonicalUrl}
        robots="index, follow"
        openGraph={{
          type: 'website',
          title: seoTitle,
          description: seoDescription,
          image: absoluteImageUrl,
          url: canonicalUrl,
          siteName: 'Modular House',
          article_modified_time: BUILD_TIMESTAMP,
        }}
        twitter={{
          cardType: 'summary_large_image',
          site: '@ModularHouse',
          title: seoTitle,
          description: seoDescription,
          image: absoluteImageUrl,
        }}
      />
      <ProductConfiguratorPage product={product} />
    </>
  );
};

export default GardenRoomConfigurator;
