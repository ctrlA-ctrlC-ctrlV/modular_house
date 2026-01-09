/**
 * Verify Sitemap Script
 * =============================================================================
 * Verifies that the generated sitemap.xml contains all expected public routes.
 *
 * This script reads the build output 'dist/client/sitemap.xml' and compares it
 * against the source of truth 'src/routes-metadata.ts'.
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
 * Configuration.
 * MUST match the hostname used in sitemap-generator.ts.
 */
const EXPECTED_HOSTNAME = 'https://modularhouse.ie';
const SITEMAP_PATH = resolve('dist/client/sitemap.xml');

/**
 * Main verification function.
 */
async function verifySitemap() {
  console.log('Starting sitemap verification...');
  console.log(`Checking file: ${SITEMAP_PATH}`);

  // 1. Verify File Exists
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error(`[FAIL] Sitemap file not found at: ${SITEMAP_PATH}`);
    console.error('Did you run "pnpm build" or "pnpm prerender"?');
    process.exit(1);
  }

  // 2. Read and Parse Sitemap
  const sitemapContent = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  
  // Simple regex to extract URLs from <loc> tags. 
  // We avoid XML parsers to keep dependencies low for this script.
  const locRegex = /<loc>(.*?)<\/loc>/g;
  const foundUrls: Set<string> = new Set();
  
  let match;
  while ((match = locRegex.exec(sitemapContent)) !== null) {
    foundUrls.add(match[1]);
  }

  console.log(`Found ${foundUrls.size} URLs in sitemap.`);

  // 3. Verify All Expected Routes are Present
  let hasErrors = false;

  const expectedRoutes = routesMetadata.filter(route => {
    // Logic must match sitemap-generator.ts exclusion rules
    if (route.path === '*') return false;
    if (route.sitemap?.priority === 0) return false;
    return true;
  });

  console.log(`Expecting ${expectedRoutes.length} public routes.`);

  expectedRoutes.forEach(route => {
    const expectedUrl = `${EXPECTED_HOSTNAME}${route.path}`;
    
    if (foundUrls.has(expectedUrl)) {
      console.log(`[PASS] Route found: ${route.path}`);
    } else {
      console.error(`[FAIL] Missing route: ${expectedUrl}`);
      hasErrors = true;
    }
  });

  // 4. Report Final Status
  if (hasErrors) {
    console.error('\nVerification FAILED. Some routes are missing from the sitemap.');
    process.exit(1);
  } else {
    console.log('\nVerification SUCCESS. All routes are present in the sitemap.');
  }
}

// Execute
verifySitemap();
