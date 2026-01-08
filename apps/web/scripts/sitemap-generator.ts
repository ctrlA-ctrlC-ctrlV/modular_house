/**
 * Sitemap Generator Script
 * =============================================================================
 * Generates the sitemap.xml file for the static website.
 * Reads route configuration from 'src/routes-metadata.ts' to ensure consistency
 * between the application routing and the sitemap.
 * =============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { routesMetadata } from '../src/routes-metadata';

/**
 * Resolve the directory path of the current module.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper function to resolve paths relative to the project root.
 */
const resolve = (p: string) => path.resolve(__dirname, '..', p);

/**
 * Configuration for the sitemap generation.
 */
const HOSTNAME = 'https://modular-house.com'; // TODO: Get this from env var or config
const OUTPUT_FILE = resolve('dist/client/sitemap.xml');

/**
 * Generates the XML content for the sitemap.
 */
export function generateSitemapXml(): string {
  const routes = routesMetadata.filter(route => {
    // Exclude Catch-all route ('*') and explicitly excluded routes
    if (route.path === '*') return false;
    // Exclude if priority is 0 (optional convention)
    if (route.sitemap?.priority === 0) return false;
    return true;
  });

  const urlElements = routes.map(route => {
    const changefreq = route.sitemap?.changefreq || 'monthly';
    const priority = route.sitemap?.priority || 0.5;
    
    return `
  <url>
    <loc>${HOSTNAME}${route.path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

/**
 * Main execution function.
 */
export async function generateSitemap() {
  console.log('Generating sitemap...');
  
  try {
    const xmlContent = generateSitemapXml();
    const outputDir = path.dirname(OUTPUT_FILE);

    // Ensure output directory exists (it should exist if build run previously)
    if (!fs.existsSync(outputDir)) {
      console.log(`Creating directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, xmlContent.trim());
    console.log(`Sitemap generated successfully at: ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    process.exit(1);
  }
}

// Execute the generator if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateSitemap();
}
