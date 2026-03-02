/**
 * Sitemap Generator Script
 * =============================================================================
 * Generates the sitemap.xml file for the static website, conforming to the
 * Sitemaps Protocol (https://www.sitemaps.org/protocol.html).
 *
 * Route data is sourced from 'src/routes-metadata.ts' to guarantee consistency
 * between the application's client-side routing table and the published sitemap.
 *
 * This module exports both a pure XML-generation function (generateSitemapXml)
 * and an async I/O wrapper (generateSitemap) that writes the result to disk.
 * The split design allows the pure function to be imported and exercised by
 * unit tests without triggering any file-system side effects.
 *
 * Open-Closed Principle: extend sitemap behaviour by adjusting SitemapConfig
 * fields in routes-metadata.ts or by adding new optional parameters to
 * generateSitemapXml. The core filtering and rendering logic is not modified.
 * =============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { routesMetadata } from '../src/routes-metadata';

/**
 * Resolve the directory of the current module file so that all subsequent
 * path operations are anchored to a known absolute location rather than the
 * process working directory, which can vary between invocation contexts.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolves a path relative to the project root (one directory above scripts/).
 *
 * @param p - A relative path from the project root directory.
 * @returns  The corresponding absolute path on the file system.
 */
const resolve = (p: string) => path.resolve(__dirname, '..', p);

/**
 * The public hostname prepended to every <loc> element.
 * Sourced from the HOSTNAME environment variable so that staging and production
 * deployments can produce correctly scoped sitemaps without code changes.
 * Falls back to the production domain when the variable is not set.
 */
const HOSTNAME = process.env.HOSTNAME || 'https://modularhouse.ie';

/**
 * The absolute path at which sitemap.xml is written during a build.
 * Placing it in dist/client makes it available at the web root after deployment.
 */
const OUTPUT_FILE = resolve('dist/client/sitemap.xml');

/**
 * Generates the complete XML content for sitemap.xml as a string.
 *
 * Routes are sourced from routesMetadata and filtered to include only publicly
 * indexable paths. Each included route is rendered as a <url> element containing
 * <loc>, <lastmod>, <changefreq>, and <priority> child elements.
 *
 * Design decisions:
 * - The function is deliberately pure (no I/O) so it can be called from unit
 *   tests and Node.js scripts alike without side effects.
 * - The buildTimestamp parameter is optional to preserve backward compatibility
 *   with existing call sites that do not have access to a build timestamp (e.g.,
 *   standalone script invocations and pre-existing tests). When omitted, the
 *   current wall-clock time is used as a reasonable fallback.
 * - The lastmod value is truncated to YYYY-MM-DD per the W3C date format
 *   mandated by the Sitemaps Protocol. The full ISO 8601 timestamp from
 *   BUILD_TIMESTAMP is intentionally reduced to avoid sub-day precision that
 *   search engines do not act upon for static sites.
 *
 * @param buildTimestamp - An ISO 8601 UTC timestamp string captured once at the
 *   start of the build process (e.g. BUILD_TIMESTAMP from build-timestamp.ts).
 *   All <lastmod> elements in the generated XML will carry the YYYY-MM-DD
 *   portion of this value, ensuring every URL entry reflects the same build date.
 *   When not provided, defaults to the current date at the time of function call.
 * @returns The complete sitemap XML as a UTF-8 string, ready to be written to disk.
 */
export function generateSitemapXml(buildTimestamp?: string): string {
  /**
   * Derive the YYYY-MM-DD lastmod string from the supplied timestamp.
   *
   * The Sitemaps Protocol specifies W3C date format for <lastmod>. Splitting
   * on 'T' and taking the first segment converts any ISO 8601 UTC timestamp
   * (e.g. "2026-03-02T14:30:00.000Z") to the required "2026-03-02" form.
   *
   * The nullish-coalescing fallback ensures the function remains usable even
   * when called without a timestamp (e.g. from a direct CLI invocation or a
   * legacy test that has not yet been updated to pass a timestamp argument).
   */
  const lastmod = (buildTimestamp ?? new Date().toISOString()).split('T')[0];

  /**
   * Filter routesMetadata to the subset of routes that should appear in the
   * sitemap. Two categories of routes are excluded:
   * 1. The catch-all wildcard route ('*') — this is a React Router fallback
   *    pattern, not a real URL, and must never appear in a sitemap.
   * 2. Routes with sitemap.priority === 0 — this is a convention used to mark
   *    routes (such as legal/utility pages) that are intentionally de-indexed
   *    from the sitemap even though they remain crawlable.
   */
  const indexableRoutes = routesMetadata.filter(route => {
    if (route.path === '*') return false;
    if (route.sitemap?.priority === 0) return false;
    return true;
  });

  /**
   * Render each indexable route as a <url> block.
   *
   * The <lastmod> element is placed immediately after <loc> in accordance with
   * the Sitemaps Protocol element ordering convention and the T023 specification.
   *
   * Nullish-coalescing defaults for changefreq and priority ensure that routes
   * without explicit sitemap configuration still produce valid XML output.
   */
  const urlElements = indexableRoutes.map(route => {
    const changefreq = route.sitemap?.changefreq ?? 'monthly';
    const priority = route.sitemap?.priority ?? 0.5;

    return `
  <url>
    <loc>${HOSTNAME}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('');

  /**
   * Assemble the complete XML document.
   * The sitemaps.org namespace URI is required by the protocol and is used by
   * search engine validators to confirm schema compliance.
   */
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

/**
 * Writes the generated sitemap.xml to disk at the configured output path.
 *
 * This function is the I/O wrapper around generateSitemapXml. It is called by
 * the prerender script at the end of the static site generation process, after
 * all HTML files have been written, so that the sitemap reflects the same build
 * that produced the static pages.
 *
 * The buildTimestamp parameter is forwarded unchanged to generateSitemapXml so
 * that the <lastmod> date in the sitemap matches the WebPage.dateModified and
 * og:article:modified_time values embedded in every static HTML file — all
 * derived from the single BUILD_TIMESTAMP constant in build-timestamp.ts.
 *
 * @param buildTimestamp - The ISO 8601 UTC build timestamp to embed as <lastmod>.
 *   Should be the BUILD_TIMESTAMP constant exported from build-timestamp.ts.
 *   Optional: when omitted, generateSitemapXml falls back to the current date.
 */
export async function generateSitemap(buildTimestamp?: string): Promise<void> {
  console.log('Generating sitemap...');

  try {
    // Delegate XML generation to the pure function, forwarding the timestamp.
    const xmlContent = generateSitemapXml(buildTimestamp);
    const outputDir = path.dirname(OUTPUT_FILE);

    /**
     * Guard against a missing output directory.
     * Under normal build conditions dist/client is created by Vite before this
     * function runs. The guard is kept as a safety net for edge cases such as
     * running the sitemap generator in isolation.
     */
    if (!fs.existsSync(outputDir)) {
      console.log(`Creating output directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the XML to disk, trimming any leading/trailing whitespace that
    // may have accumulated during template string assembly.
    fs.writeFileSync(OUTPUT_FILE, xmlContent.trim());
    console.log(`Sitemap generated successfully at: ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    // Propagate a non-zero exit code so the build pipeline treats this as a
    // hard failure and does not deploy an incomplete artifact set.
    process.exit(1);
  }
}

/**
 * Direct CLI entry point.
 *
 * When this script is executed directly (e.g. `node scripts/sitemap-generator.js`),
 * generateSitemap is called without a timestamp argument. The function will fall
 * back to the current date, which is acceptable for ad-hoc runs outside the
 * standard build pipeline.
 *
 * When imported as a module (e.g. by prerender.ts), this block is skipped and
 * the caller is responsible for invoking generateSitemap with BUILD_TIMESTAMP.
 */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateSitemap();
}
