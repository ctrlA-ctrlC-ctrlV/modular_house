import { ComponentType } from 'react';

/**
 * Re-import OpenGraph and TwitterCard from the shared UI package to avoid
 * duplicating type definitions across the monorepo. SEOConfig references these
 * types directly so that route-metadata authors work with the same interfaces
 * that the Seo component accepts — a single source of truth for the contract.
 *
 * The @modular-house/ui package re-exports both types from
 * packages/ui/src/components/Seo/Seo.tsx via packages/ui/src/index.ts.
 */
import type { OpenGraph, TwitterCard } from '@modular-house/ui';

/**
 * Defines a JSON-LD schema object structure.
 *
 * Each SchemaDef encapsulates one node in the schema graph:
 * - type  maps to the Schema.org @type value (e.g., 'WebPage', 'FAQPage').
 * - data  holds the remaining properties for that node, typed as a generic
 *         record to accommodate any valid Schema.org vocabulary without
 *         requiring a dedicated interface per schema type.
 *
 * The TemplateLayout component assembles an array of SchemaDef entries into a
 * single @graph block before passing the result to the Seo component's jsonLd prop.
 */
export interface SchemaDef {
  /** The Schema.org @type value for this node (e.g., 'Organization', 'WebPage'). */
  type: string;
  /** The remaining Schema.org properties for this node. */
  data: Record<string, unknown>;
}

/**
 * Configuration for page-specific SEO metadata.
 *
 * SEOConfig is the single data structure that route-metadata authors populate
 * to control all head tags for a given route. It is consumed by TemplateLayout,
 * which maps these values onto the Seo component's props.
 *
 * Core fields (title, description) are required because every indexable page
 * must have them. All extended fields are optional so that existing route
 * entries remain valid without modification after this interface is expanded.
 *
 * Open-Closed Principle: new optional fields can be added here to extend
 * capabilities without requiring changes to routes that do not need them.
 */
export interface SEOConfig {
  /** The value for the <title> tag. A suffix may be appended by the layout component. */
  title: string;
  /** The content for the <meta name="description"> tag. */
  description: string;

  /**
   * The absolute canonical URL for this page.
   * Used to consolidate link equity when the same content is reachable via
   * multiple URLs (e.g., trailing-slash variants, UTM parameters).
   * Example: 'https://modularhouse.ie/garden-room'
   */
  canonicalUrl?: string;

  /**
   * Crawler directives supplied as a comma-separated string.
   * When omitted, the Seo component defaults to 'index, follow'.
   * Full-coverage pages use the extended form:
   * 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
   * Legal pages use the minimal form: 'index, follow'.
   */
  robots?: string;

  /**
   * Open Graph configuration for this page.
   * When present, TemplateLayout forwards this object directly to the Seo
   * component, which emits og:title, og:description, og:image, og:locale,
   * og:image:width, og:image:height, og:image:type, and article:modified_time.
   * When absent, no OG tags beyond og:type and og:title are emitted.
   */
  openGraph?: OpenGraph;

  /**
   * Twitter Card configuration for this page.
   * When present, TemplateLayout forwards this object to the Seo component.
   * When absent, the Seo component still emits twitter:card and twitter:title
   * using safe defaults.
   */
  twitter?: TwitterCard;

  /** Optional array of JSON-LD schema definitions for this page. */
  schema?: SchemaDef[];
}

/**
 * Configuration for the sitemap.xml entry for a given route.
 *
 * These values map directly to the <changefreq>, <priority>, and <lastmod>
 * elements in the sitemap protocol (https://www.sitemaps.org/protocol.html).
 */
export interface SitemapConfig {
  /** How frequently the page content is likely to change. */
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  /**
   * The priority of this URL relative to other URLs on the same site.
   * Valid range: 0.0 to 1.0. Does not affect ranking relative to other sites.
   */
  priority?: number;
  /**
   * The date of the last significant modification of the page content.
   * Format: YYYY-MM-DD (W3C date format, as required by the sitemap protocol).
   * At build time this value is derived from BUILD_TIMESTAMP in prerender.ts
   * to ensure all freshness signals across the build are consistent.
   */
  lastmod?: string;
}

/**
 * Represents a single public route definition in the application.
 *
 * AppRoute is the union of all information the application needs to both
 * render the route at runtime (path + component) and generate static
 * build artifacts (SEO metadata + sitemap configuration).
 *
 * The routes-metadata.ts file is the single source of truth for AppRoute
 * entries; the App component and prerender script both read from it.
 */
export interface AppRoute {
  /** The URL path for the route (e.g., '/about'). */
  path: string;
  /** The React component to render for this route. */
  component: ComponentType;
  /** Optional SEO metadata for this route. */
  seo?: SEOConfig;
  /** Optional sitemap configuration for this route. */
  sitemap?: SitemapConfig;
}

/**
 * Route definition without the component reference.
 *
 * Used by build-time scripts (sitemap generator, prerender) that need route
 * path and metadata but must not import React components, avoiding unnecessary
 * bundler dependencies in Node.js contexts.
 */
export type RouteMetadata = Omit<AppRoute, 'component'>;
