import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Interface representing Open Graph protocol metadata.
 * Used for controlling how content appears when shared on social media platforms (Facebook, LinkedIn, etc.).
 */
export interface OpenGraph {
  /** The title of the object as it should appear within the graph. */
  title?: string;
  /** A one to two sentence description of the object. */
  description?: string;
  /** An image URL which should represent the object within the graph. */
  image?: string;
  /** The type of your object, e.g., "website", "article", "video.movie". */
  type?: 'website' | 'article' | 'profile' | 'book' | 'music.song' | 'video.movie';
  /** The canonical URL of the object that will be used as its permanent ID in the graph. */
  url?: string;
  /** The name of the web site. */
  siteName?: string;
}

/**
 * Interface representing Twitter Card metadata.
 * Used for optimizing content presentation on Twitter.
 */
export interface TwitterCard {
  /** The card type, which determines the layout of the card. */
  cardType?: 'summary' | 'summary_large_image' | 'app' | 'player';
  /** @username of content creator. */
  creator?: string;
  /** @username of website. */
  site?: string;
  /** Title of content (max 70 characters). */
  title?: string;
  /** Description of content (max 200 characters). */
  description?: string;
  /** URL of image to use in the card. */
  image?: string;
  /** Text description of the image for accessibility. */
  imageAlt?: string;
}

/**
 * Props definition for the Seo component.
 * comprehensive configuration options for page-level SEO.
 */
export interface SeoProps {
  /** The main title of the page. Will be suffixed with site name if configured. */
  title: string;
  /** The meta description of the page. Optimal length is between 150-160 characters. */
  description?: string;
  /** The absolute canonical URL of the page to consolidate link equity. */
  canonicalUrl?: string;
  /** Directives for search engine crawlers (e.g., 'index, follow', 'noindex'). */
  robots?: string;
  /** Configuration object for Open Graph meta tags. */
  openGraph?: OpenGraph;
  /** Configuration object for Twitter Card meta tags. */
  twitter?: TwitterCard;
  /** Structured data in JSON-LD format for rich snippets. Uses a generic record to allow diverse schema definitions. */
  jsonLd?: Record<string, unknown>;
  /** Optional base site title to append to the page title (e.g., " | BrandName"). */
  siteTitleSuffix?: string;
}

/**
 * Seo Component
 * * A functional wrapper around react-helmet-async to manage document head tags.
 * This component standardizes the injection of meta tags for search engines and social media crawlers.
 * * Usage:
 * Wrap page content or include at the top level of a route component.
 * Requires <HelmetProvider> to be present higher in the component tree.
 */
export const Seo: React.FC<SeoProps> = ({
  title,
  description,
  canonicalUrl,
  robots = 'index, follow',
  openGraph,
  twitter,
  jsonLd,
  siteTitleSuffix = ' | Modular House', // Default suffix based on previous context
}) => {
  // Construct the final document title
  const fullTitle = `${title}${siteTitleSuffix}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={robots} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={openGraph?.type || 'website'} />
      <meta property="og:title" content={openGraph?.title || fullTitle} />
      {openGraph?.description && (
        <meta property="og:description" content={openGraph.description || description} />
      )}
      {openGraph?.image && <meta property="og:image" content={openGraph.image} />}
      {openGraph?.url && <meta property="og:url" content={openGraph.url || canonicalUrl} />}
      {openGraph?.siteName && <meta property="og:site_name" content={openGraph.siteName} />}

      {/* Twitter */}
      <meta name="twitter:card" content={twitter?.cardType || 'summary_large_image'} />
      {twitter?.site && <meta name="twitter:site" content={twitter.site} />}
      {twitter?.creator && <meta name="twitter:creator" content={twitter.creator} />}
      <meta name="twitter:title" content={twitter?.title || fullTitle} />
      {twitter?.description && (
        <meta name="twitter:description" content={twitter.description || description} />
      )}
      {twitter?.image && <meta name="twitter:image" content={twitter.image} />}
      {twitter?.imageAlt && <meta name="twitter:image:alt" content={twitter.imageAlt} />}

      {/* Structured Data (JSON-LD) */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};