import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Interface representing Open Graph protocol metadata.
 *
 * The Open Graph protocol enables any web page to become a rich object in a
 * social graph (Facebook, LinkedIn, etc.). All fields are optional to allow
 * partial configuration — callers provide only the properties relevant to
 * their content type.
 *
 * Extended fields (imageWidth, imageHeight, imageType, locale,
 * article_modified_time) satisfy FR-016 and the regional locale signal
 * requirement from the 007-seo-improvement spec.
 */
export interface OpenGraph {
  /** The title of the object as it should appear within the graph. */
  title?: string;
  /** A one-to-two sentence description of the object. */
  description?: string;
  /** An image URL which should represent the object within the graph. */
  image?: string;
  /**
   * The pixel width of the og:image asset.
   * Providing explicit dimensions prevents social crawlers from having to
   * fetch and measure the image before rendering a card preview.
   */
  imageWidth?: number;
  /**
   * The pixel height of the og:image asset.
   * Paired with imageWidth to supply the og:image:height meta tag.
   */
  imageHeight?: number;
  /**
   * The MIME type of the og:image asset (e.g., 'image/png', 'image/jpeg').
   * Allows social crawlers to verify the image format without downloading it.
   */
  imageType?: string;
  /**
   * The locale these tags are marked up in.
   * Defaults to 'en_IE' when not provided, supplying a regional search signal
   * for Google Ireland crawls. Format: language_TERRITORY (ISO 639-1 + ISO 3166-1).
   */
  locale?: string;
  /**
   * ISO 8601 timestamp of the last significant content modification.
   * Emitted as the article:modified_time meta tag (FR-016).
   * At build time this value is sourced from BUILD_TIMESTAMP in prerender.ts
   * to ensure all freshness signals across the build are identical.
   */
  article_modified_time?: string;
  /** The type of the object (e.g., "website", "article", "video.movie"). */
  type?: 'website' | 'article' | 'profile' | 'book' | 'music.song' | 'video.movie';
  /** The canonical URL of the object that will be used as its permanent ID in the graph. */
  url?: string;
  /** The name of the web site. */
  siteName?: string;
}

/**
 * Interface representing Twitter Card metadata.
 *
 * Twitter Cards allow web pages to attach rich media to Tweets when the URL
 * is shared. All fields are optional; the component provides sensible defaults
 * (summary_large_image) when specific values are omitted.
 */
export interface TwitterCard {
  /** The card type, which determines the layout of the Twitter card. */
  cardType?: 'summary' | 'summary_large_image' | 'app' | 'player';
  /** @username of the content creator. */
  creator?: string;
  /** @username of the web site. */
  site?: string;
  /** Title of the content (max 70 characters). */
  title?: string;
  /** Description of the content (max 200 characters). */
  description?: string;
  /** URL of the image to use in the card. */
  image?: string;
  /** Accessible text description of the image conveyed to screen readers and crawlers. */
  imageAlt?: string;
}

/**
 * Props definition for the Seo component.
 *
 * Provides a typed, comprehensive surface for configuring all page-level SEO
 * concerns: document title, meta description, canonical URL, robots directives,
 * Open Graph tags, Twitter Card tags, and JSON-LD structured data.
 *
 * Consumers pass only the fields that apply to their page; all fields beyond
 * title are optional and render conditionally.
 */
export interface SeoProps {
  /** The main title of the page. Concatenated with siteTitleSuffix for the document title. */
  title: string;
  /** The meta description of the page. Optimal length is 150–160 characters. */
  description?: string;
  /** The absolute canonical URL of the page, used to consolidate link equity across duplicates. */
  canonicalUrl?: string;
  /**
   * Directives for search engine crawlers supplied as a comma-separated string.
   * Defaults to 'index, follow' when omitted.
   * Example extended value: 'index, follow, max-image-preview:large, max-snippet:-1'
   */
  robots?: string;
  /** Configuration object for Open Graph meta tags. When omitted, no OG tags are emitted. */
  openGraph?: OpenGraph;
  /** Configuration object for Twitter Card meta tags. When omitted, defaults are still emitted. */
  twitter?: TwitterCard;
  /**
   * Structured data payload in JSON-LD format for rich snippets.
   * Accepts any valid Schema.org graph object. Emitted inside a
   * <script type="application/ld+json"> element in the document head.
   */
  jsonLd?: Record<string, unknown>;
  /**
   * Optional suffix appended to the page title to form the full document title
   * (e.g., " | Modular House"). Defaults to ' | Modular House'.
   */
  siteTitleSuffix?: string;
}

/**
 * Seo Component
 *
 * A functional wrapper around react-helmet-async that manages all document
 * <head> tags related to SEO and social sharing. Centralising head tag
 * management here prevents duplicate or conflicting tags that can arise when
 * multiple components write to <head> independently.
 *
 * Rendering behaviour:
 * - Primary meta tags (title, description, robots, canonical) are always emitted
 *   when the relevant prop is supplied.
 * - Open Graph tags are emitted conditionally; og:locale defaults to 'en_IE'
 *   to provide a regional search signal for Google Ireland.
 * - Twitter Card tags fall back to sane defaults (summary_large_image, page title)
 *   when specific values are not provided.
 * - JSON-LD script is only emitted when the jsonLd prop is present.
 *
 * Prerequisites:
 * - A <HelmetProvider> must be present higher in the component tree
 *   (typically in the application root or test wrapper).
 */
export const Seo: React.FC<SeoProps> = ({
  title,
  description,
  canonicalUrl,
  robots = 'index, follow',
  openGraph,
  twitter,
  jsonLd,
  siteTitleSuffix = ' | Modular House',
}) => {
  // Compose the full document title from the page-specific title and the
  // site-wide suffix. The suffix is configurable to support white-labelling
  // or alternate brand contexts without modifying this component.
  const fullTitle = `${title}${siteTitleSuffix}`;

  return (
    <Helmet>
      {/* ------------------------------------------------------------------ */}
      {/* Primary Meta Tags                                                   */}
      {/* These tags are consumed by all search engine crawlers and are the   */}
      {/* minimum required for indexing. robots defaults to 'index, follow'   */}
      {/* so pages without an explicit directive still receive a safe value.  */}
      {/* ------------------------------------------------------------------ */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={robots} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* ------------------------------------------------------------------ */}
      {/* Open Graph / Facebook                                               */}
      {/* og:type and og:title are emitted unconditionally because social     */}
      {/* crawlers require them even when an openGraph prop is not supplied.  */}
      {/* ------------------------------------------------------------------ */}
      <meta property="og:type" content={openGraph?.type ?? 'website'} />
      <meta property="og:title" content={openGraph?.title ?? fullTitle} />

      {/* og:description mirrors the page description when a dedicated OG    */}
      {/* description is not specified.                                       */}
      {openGraph?.description && (
        <meta property="og:description" content={openGraph.description} />
      )}

      {/* og:image and associated dimension/type tags allow social crawlers   */}
      {/* to render preview cards without fetching the image asset first.    */}
      {openGraph?.image && <meta property="og:image" content={openGraph.image} />}
      {openGraph?.imageWidth && (
        <meta property="og:image:width" content={String(openGraph.imageWidth)} />
      )}
      {openGraph?.imageHeight && (
        <meta property="og:image:height" content={String(openGraph.imageHeight)} />
      )}
      {openGraph?.imageType && (
        <meta property="og:image:type" content={openGraph.imageType} />
      )}

      {/* og:url and og:site_name are conditional on the caller supplying them. */}
      {openGraph?.url && <meta property="og:url" content={openGraph.url} />}
      {openGraph?.siteName && (
        <meta property="og:site_name" content={openGraph.siteName} />
      )}

      {/* og:locale signals the language/region of the page content.         */}
      {/* Defaults to 'en_IE' when openGraph is present but locale is        */}
      {/* omitted, providing a regional search signal for Google Ireland.    */}
      {openGraph && (
        <meta property="og:locale" content={openGraph.locale ?? 'en_IE'} />
      )}

      {/* article:modified_time satisfies FR-016: informs crawlers of the    */}
      {/* last significant content change. Value is sourced from the build   */}
      {/* timestamp to ensure consistency across all build artifacts.        */}
      {openGraph?.article_modified_time && (
        <meta
          property="article:modified_time"
          content={openGraph.article_modified_time}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Twitter Card                                                        */}
      {/* twitter:card and twitter:title fall back to safe defaults so that  */}
      {/* shared URLs always render a card, even without explicit Twitter     */}
      {/* configuration.                                                      */}
      {/* ------------------------------------------------------------------ */}
      <meta name="twitter:card" content={twitter?.cardType ?? 'summary_large_image'} />
      {twitter?.site && <meta name="twitter:site" content={twitter.site} />}
      {twitter?.creator && <meta name="twitter:creator" content={twitter.creator} />}
      <meta name="twitter:title" content={twitter?.title ?? fullTitle} />
      {twitter?.description && (
        <meta name="twitter:description" content={twitter.description} />
      )}
      {twitter?.image && <meta name="twitter:image" content={twitter.image} />}
      {twitter?.imageAlt && (
        <meta name="twitter:image:alt" content={twitter.imageAlt} />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Structured Data (JSON-LD)                                           */}
      {/* Emits a single <script type="application/ld+json"> block.          */}
      {/* The caller is responsible for composing the @context/@graph         */}
      {/* envelope before passing the value here.                            */}
      {/* ------------------------------------------------------------------ */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};
