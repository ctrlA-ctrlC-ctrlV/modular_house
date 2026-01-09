import { ComponentType } from 'react';

/**
 * Defines a JSON-LD schema object structure.
 * Wraps the schema type and its data properties.
 */
export interface SchemaDef {
  type: string;
  data: Record<string, unknown>;
}

/**
 * Configuration for page-specific SEO metadata.
 * Controls the <title>, <meta description>, and structured data injection.
 */
export interface SEOConfig {
  /** The value for the <title> tag. Suffix may be appended by the layout. */
  title: string;
  /** The content for the <meta name="description"> tag. */
  description: string;
  /** Optional array of JSON-LD schema definitions for this page. */
  schema?: SchemaDef[];
}

/**
 * Configuration for the sitemap.xml generation.
 * Defines crawling frequency and priority for search engines.
 */
export interface SitemapConfig {
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Represents a single public route definition in the application.
 * Used to generate React Router routes and the sitemap.
 */
export interface AppRoute {
  /** The URL path for the route (e.g., "/about"). */
  path: string;
  /** The React component to render for this route. */
  component: ComponentType;
  /** Optional SEO metadata for this route. */
  seo?: SEOConfig;
  /** Optional sitemap configuration. */
  sitemap?: SitemapConfig;
}

/**
 * Route definition without the component.
 * Used for scripts that don't have access to the React environment (like sitemap generation).
 */
export type RouteMetadata = Omit<AppRoute, 'component'>;

