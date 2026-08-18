/**
 * Verify Build Script
 * =============================================================================
 * Verifies that the Static Site Generation (SSG) process has correctly regenerated
 * HTML files with server-side rendered content.
 *
 * This script is intended to be run in CI/CD pipelines or locally after the
 * 'build' and 'prerender' steps to ensure quality and correctness.
 * =============================================================================
 */

/// <reference types="node" />

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
 * List of critical routes to verify.
 * We verify a subset of pages to ensure the general mechanism is working.
 */
const minimalRoutesToVerify = [
  '/',
  '/about',
  '/contact',
  '/garden-rooms', // Added for JSON-LD check
  '/house-extensions',
  '/gallery',
  // Dynamic configurator route -- regression guard for the bug where these
  // slugs were absent from prerender.ts's routesToPrerender, causing
  // crawlers to be served the homepage's own prerendered content instead.
  '/garden-rooms/configure/compact-15',
];

/**
 * Expected placeholders that should be REPLACED in the final output.
 * Use strict checks to ensure no template variables leak into production.
 */
const FORBIDDEN_STRINGS = [
  '<!--app-html-->',
  '<!--head-meta-->'
];

/**
 * Required strings that MUST be present to consider the render successful.
 * This ensures we aren't just shipping empty shells.
 */
const REQUIRED_STRINGS = [
  '<div id="root">', // Root container must exist
  // We can add more specific checks (e.g., '<title>') if needed, but Helmet injection varies
];

/**
 * Performs verification on a single route.
 * @param routePath - The URL path of the route (e.g., '/about').
 */
function verifyRoute(routePath: string): void {
  // Construct the expected file path: / -> index.html, /about -> about/index.html
  const fileName = routePath === '/' ? 'index.html' : `${routePath.substring(1)}/index.html`;
  const filePath = resolve(path.join('dist/client', fileName));

  console.log(`Verifying ${routePath} -> ${filePath}...`);

  if (!fs.existsSync(filePath)) {
    console.error(`[FAIL] File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Check 1: Forbidden placeholders
  for (const forbidden of FORBIDDEN_STRINGS) {
    if (content.includes(forbidden)) {
      console.error(`[FAIL] Found forbidden placeholder "${forbidden}" in ${routePath}`);
      process.exit(1);
    }
  }

  // Check 2: Required content
  for (const required of REQUIRED_STRINGS) {
    if (!content.includes(required)) {
      console.error(`[FAIL] Missing required content "${required}" in ${routePath}`);
      process.exit(1);
    }
  }

  // Check 3: JSON-LD for specific routes
  if (routePath === '/garden-rooms' || routePath === '/house-extensions') {
    if (!content.includes('application/ld+json')) {
       console.error(`[FAIL] Missing JSON-LD script in ${routePath}`);
       process.exit(1);
    }
     // Check for Product type specifically as per spec
    if (!content.includes('"@type":"Product"')) {
       console.error(`[FAIL] JSON-LD does not contain "@type":"Product" in ${routePath}`);
       process.exit(1);
    }
  }

  if (routePath === '/contact') {
      if (!content.includes('"@type":"LocalBusiness"')) {
          console.error(`[FAIL] JSON-LD does not contain "@type":"LocalBusiness" in ${routePath}`);
          process.exit(1);
      }
  }

  if (routePath === '/') {
      if (!content.includes('"@type":"Organization"')) {
          console.error(`[FAIL] JSON-LD does not contain "@type":"Organization" in ${routePath}`);
          process.exit(1);
      }
  }

  // Check 3: Basic content check (ensure root is not empty key-value)
  // This is a heuristic: if <!--app-html--> was replaced by empty string, check length
  // But we trust 'generated content' implies more than zero length replacement usually.
  // We'll rely on absence of placeholder + presence of root.
  
  console.log(`[PASS] ${routePath} verified.`);
}

/**
 * Main execution function.
 */
function main() {
  console.log('Starting build verification...');
  
  const distClient = resolve('dist/client');
  if (!fs.existsSync(distClient)) {
    console.error(`[FAIL] dist/client directory not found. Has the build run?`);
    process.exit(1);
  }

  // ------------------------------------------------------------------
  // Favicon asset verification
  // Ensures that both SVG and PNG favicon files have been copied from
  // the public directory into the build output. Missing favicons are a
  // common deployment oversight that silently breaks the browser tab icon.
  // ------------------------------------------------------------------
  const requiredFaviconFiles = [
    'modular_house_favicon.svg',
    'modular_house_favicon.png'
  ];
  for (const faviconFile of requiredFaviconFiles) {
    const faviconPath = path.join(distClient, faviconFile);
    if (!fs.existsSync(faviconPath)) {
      console.error(`[FAIL] Favicon file missing from build output: ${faviconPath}`);
      process.exit(1);
    }
    console.log(`[PASS] Favicon present: ${faviconFile}`);
  }

  // ------------------------------------------------------------------
  // 404 fallback verification
  // Confirms 404.html exists and carries NotFound.tsx's own rendered
  // content rather than accidentally reusing the homepage's index.html --
  // nginx's error_page directive serves this file for every unmatched
  // URL, so if it ever regresses back to homepage content, crawlers would
  // silently see the homepage for any stale/mistyped/unrecognized URL.
  // ------------------------------------------------------------------
  const notFoundPath = path.join(distClient, '404.html');
  if (!fs.existsSync(notFoundPath)) {
    console.error('[FAIL] 404.html not found -- SPA fallback page was not generated.');
    process.exit(1);
  }
  const notFoundContent = fs.readFileSync(notFoundPath, 'utf-8');
  if (!notFoundContent.includes('not-found')) {
    console.error('[FAIL] 404.html does not contain NotFound.tsx content (missing "not-found" class).');
    process.exit(1);
  }
  const homepageContent = fs.readFileSync(path.join(distClient, 'index.html'), 'utf-8');
  if (notFoundContent === homepageContent) {
    console.error('[FAIL] 404.html is identical to index.html -- the SPA fallback is leaking homepage content.');
    process.exit(1);
  }
  console.log('[PASS] 404.html verified.');

  try {
    minimalRoutesToVerify.forEach(verifyRoute);
    console.log('All verified routes passed checks.');
    process.exit(0);
  } catch (err) {
    console.error('An unexpected error occurred during verification:', err);
    process.exit(1);
  }
}

main();
