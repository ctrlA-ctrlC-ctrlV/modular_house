/**
 * Prerender Script
 * =============================================================================
 * Executes the Static Site Generation (SSG) process by rendering the application
 * server-side for each public route and saving the output as static HTML.
 *
 * This script is intended to be run after the client and server builds are complete.
 * It expects the build artifacts to be present in 'dist/client' and 'dist/server'.
 * =============================================================================
 */

/**
 * Re-export the build timestamp from the shared source-of-truth module.
 *
 * BUILD_TIMESTAMP is declared in src/build-timestamp.ts so that both the
 * browser bundle (which imports routes-metadata.ts) and Node.js build scripts
 * (prerender.ts, sitemap-generator.ts) can import it from a single location
 * without creating a cross-tsconfig boundary violation.
 *
 * This re-export satisfies T022 (prerender.ts must export BUILD_TIMESTAMP) and
 * preserves backward compatibility for any future scripts that import it from
 * this module directly.
 */
/**
 * Re-export the build timestamp for consumers that import it from this module.
 * The local binding is created via the import statement below; this re-export
 * line simply makes the same value available to external callers (T022 contract).
 */
export { BUILD_TIMESTAMP } from '../src/build-timestamp';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generateSitemap } from './sitemap-generator';
import { routesMetadata } from '../src/routes-metadata';

/**
 * The single authoritative build timestamp for this run.
 * Imported from build-timestamp.ts, which captures new Date().toISOString() once
 * at module-init time. Passed to generateSitemap so that sitemap.xml <lastmod>
 * dates are identical to the WebPage.dateModified values in every pre-rendered
 * HTML file, satisfying the single-source freshness requirement (T022 / T023).
 */
import { BUILD_TIMESTAMP } from '../src/build-timestamp';

/**
 * Resolve the directory path of the current module to interpret relative paths correctly.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper function to resolve paths relative to the project root (one level up from scripts).
 * @param p - The relative path from the project root.
 * @returns The absolute path to the target.
 */
const resolve = (p: string) => path.resolve(__dirname, '..', p);

/**
 * List of public routes to be pre-rendered into static HTML files.
 * Valid routes are derived from the central metadata configuration.
 * Excludes dynamic catch-all routes like '*'.
 */
const routesToPrerender = routesMetadata
  .map(route => route.path)
  .filter(path => path !== '*');

/**
 * Main execution function for the prerendering process.
 */
async function prerender() {
  const distClient = resolve('dist/client');
  const distServer = resolve('dist/server');
  const templatePath = path.join(distClient, 'index.html');
  const serverEntryPath = path.join(distServer, 'entry-server.js');

  // Verify that build artifacts exist before proceeding.
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found at ${templatePath}. Ensure 'vite build' (client) has run.`);
  }
  if (!fs.existsSync(serverEntryPath)) {
    throw new Error(`Server entry not found at ${serverEntryPath}. Ensure 'vite build --ssr' has run.`);
  }

  // Load the HTML template which acts as the shell for the injected content.
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Dynamically import the server-side rendering function from the built bundle.
  // Using 'pathToFileURL' ensures compatibility with ESM dynamic imports on Windows.
  const { render } = await import(pathToFileURL(serverEntryPath).href);

  console.log('Starting prerender of static routes...');

  for (const url of routesToPrerender) {
    try {
      // Execute the SSR render function to get the app HTML and Helmet state.
      // The 'render' function is defined in apps/web/src/entry-server.tsx.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { html, helmet } = render(url) as { html: string; helmet: any };

      // Serialize the Helmet state (title, meta, link, script tags) to a string.
      // This ensures that each static page has the correct SEO tags pre-populated.
      const heads = [
        helmet.title.toString(),
        helmet.meta.toString(),
        helmet.link.toString(),
        helmet.script.toString()
      ].join('\n');

      // Inject the rendered content and metadata into the template placeholders.
      // <!--head-meta--> and <!--app-html--> must exist in the index.html template.
      const appHtml = template
        .replace('<!--head-meta-->', heads)
        .replace('<!--app-html-->', html);

      // Determine the output file path.
      // Root '/' becomes 'index.html', others become 'route/index.html' (pretty URLs).
      const filePath = path.join(distClient, url === '/' ? 'index.html' : `${url.substring(1)}/index.html`);
      const dirPath = path.dirname(filePath);

      // Ensure the target directory exists before writing.
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Write the final static HTML file.
      fs.writeFileSync(filePath, appHtml);
      console.log(`Prerendered: ${url} -> ${filePath}`);
    } catch (e) {
      console.error(`Failed to render route: ${url}`, e);
      // Exit with error code to fail the build pipeline if a route fails.
      process.exit(1);
    }
  }

  /**
   * Generate the sitemap after all static HTML pages have been written.
   *
   * BUILD_TIMESTAMP is passed explicitly so that every <lastmod> element in
   * sitemap.xml carries the same date as the WebPage.dateModified and
   * og:article:modified_time values embedded in the pre-rendered HTML files.
   * This ensures complete timestamp consistency across all build artifacts
   * as required by T023 (single-source freshness signals).
   */
  await generateSitemap(BUILD_TIMESTAMP);

  console.log('Prerender complete.');
}

// Execute the prerender function.
prerender();
