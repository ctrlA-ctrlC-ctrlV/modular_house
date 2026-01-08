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

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
 * This list must be kept in sync with the application's route configuration.
 * TODO: Ideally, this should be imported from src/route-config.tsx, but that requires
 * handling TSX/ESM compilation during the script execution.
 */
const routesToPrerender = [
  '/',
  '/garden-room',
  '/house-extension',
  '/gallery',
  '/about',
  '/contact',
  '/privacy',
  '/terms'
];

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

  console.log('Prerender complete.');
}

// Execute the prerender function.
prerender();
