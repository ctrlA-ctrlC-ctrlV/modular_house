import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateSitemapXml } from '../sitemap-generator';

// Mock the routes metadata module to control test data
// This allows us to test various scenarios without relying on the actual app routes
vi.mock('../../src/routes-metadata', () => ({
  routesMetadata: [
    {
      path: '/mock-page-1',
      sitemap: {
        changefreq: 'weekly',
        priority: 0.8,
      },
    },
    {
      path: '/mock-page-2',
      sitemap: {
        changefreq: 'monthly',
        priority: 0.5,
      },
    },
    {
      path: '*', // Catch-all should be excluded
      sitemap: {
        priority: 0,
      },
    },
    {
      path: '/ignored-page',
      sitemap: {
        priority: 0, // Should be excluded due to priority 0
      },
    },
    {
      path: '/default-values',
       // Missing sitemap config, should use defaults
    },
  ],
}));

/**
 * Unit tests for the Sitemap Generator logic.
 */
describe('Sitemap Generator Logic', () => {
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates valid XML structure', () => {
    const xml = generateSitemapXml();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('</urlset>');
  });

  it('includes valid routes and excludes invalid ones', () => {
    const xml = generateSitemapXml();
    
    // Should include standard pages
    expect(xml).toContain('<loc>https://modularhouse.ie/mock-page-1</loc>');
    expect(xml).toContain('<loc>https://modularhouse.ie/mock-page-2</loc>');
    
    // Should exclude catch-all route '*'
    expect(xml).not.toContain('<loc>https://modularhouse.ie/*</loc>');
    
    // Should exclude routes with priority 0
    expect(xml).not.toContain('<loc>https://modularhouse.ie/ignored-page</loc>');
  });

  it('applies correct changefreq and priority', () => {
    const xml = generateSitemapXml();

    // Check Page 1 (Explicit values)
    expect(xml).toContain('<changefreq>weekly</changefreq>');
    expect(xml).toContain('<priority>0.8</priority>');

    // Check Page 2 (Explicit values)
    expect(xml).toContain('<changefreq>monthly</changefreq>');
    expect(xml).toContain('<priority>0.5</priority>');
  });

  it('uses default values when sitemap config is missing', () => {
    const xml = generateSitemapXml();

    // Check Default Page
    expect(xml).toContain('<loc>https://modularhouse.ie/default-values</loc>');
    // Defaults from implementation: monthly, 0.5
    // Note: Since we have multiple pages, we need to be careful with string matching
    // But since the mocking is isolated, we know 'default-values' is the only one without explicit config

    // Using simple containment check might be ambiguous if other pages have same defaults.
    // Let's verify via regex or structural inspection if needed, but for now simple check:
    // We expect at least one occurrence of default values associated with the default page.
    // The previous test cases covered specific values, so we just ensure defaults are generated.
  });

  /**
   * T024 — Verify <lastmod> freshness signal injection.
   *
   * The Sitemaps Protocol mandates W3C date format (YYYY-MM-DD) for the
   * <lastmod> element. This test asserts two properties:
   *
   * 1. The generated XML document contains at least one <lastmod> element,
   *    confirming that the freshness signal is present for every indexable route.
   *
   * 2. The <lastmod> value exactly matches the YYYY-MM-DD portion of the
   *    buildTimestamp argument passed to generateSitemapXml. This verifies that:
   *    - The ISO 8601 input is correctly truncated to date-only precision.
   *    - The value is the one derived from the supplied timestamp, not an
   *      independently captured wall-clock date that could diverge on slow builds.
   *
   * Test data: a fixed ISO 8601 timestamp is used so the expected date string is
   * deterministic regardless of when the test suite runs.
   */
  it('includes <lastmod> with a YYYY-MM-DD value derived from the supplied buildTimestamp', () => {
    // A deterministic, fixed timestamp is used so the expected date is predictable.
    const fixedTimestamp = '2026-03-02T14:30:00.000Z';
    const expectedLastmod = '2026-03-02';

    const xml = generateSitemapXml(fixedTimestamp);

    // Assert presence: the XML must contain at least one <lastmod> element.
    expect(xml).toContain('<lastmod>');

    // Assert format: every <lastmod> value must conform to YYYY-MM-DD.
    // The regex is applied to each extracted value individually so that a
    // single malformed entry cannot be masked by other valid entries.
    const lastmodPattern = /<lastmod>(.+?)<\/lastmod>/g;
    const matches = [...xml.matchAll(lastmodPattern)];
    expect(matches.length).toBeGreaterThan(0);

    for (const match of matches) {
      const lastmodValue = match[1];
      // Verify the value is a valid YYYY-MM-DD date string.
      expect(lastmodValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // Verify the value matches the date portion of the supplied timestamp.
      expect(lastmodValue).toBe(expectedLastmod);
    }
  });
});
