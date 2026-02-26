/**
 * schema-generators.test.ts
 *
 * Unit tests for the schema-generators utility module.
 *
 * Coverage target: 100% branch coverage across generatePageSchema and
 * generateWebSiteSchema. The two branching paths in generatePageSchema
 * are:
 *   1. path === '/'  — homepage variant (single BreadcrumbList item, no item URL)
 *   2. path !== '/'  — inner-page variant (two BreadcrumbList items, Home carries URL)
 *
 * These tests are intentionally synchronous — the module under test is a
 * pure-function utility with no React, DOM, or asynchronous dependencies.
 * No HelmetProvider, render helper, or afterEach cleanup is required.
 */

import { describe, it, expect } from 'vitest';
import { generatePageSchema, generateWebSiteSchema } from '../schema-generators';
import type { SchemaDef } from '../../types/seo';

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

/**
 * A fixed ISO 8601 build timestamp used across all generatePageSchema test
 * cases. Using a hardcoded value (rather than new Date()) ensures that
 * assertions on datePublished and dateModified are deterministic across
 * every test run, regardless of when the suite is executed.
 */
const FIXED_TIMESTAMP = '2026-02-25T10:00:00.000Z';

// ---------------------------------------------------------------------------
// generatePageSchema
// ---------------------------------------------------------------------------

describe('generatePageSchema', () => {
  /**
   * Test case 1 — Homepage variant (path === '/').
   *
   * Verifies:
   * - The function returns an array of exactly 2 SchemaDef objects.
   * - The first item has type 'WebPage'.
   * - The WebPage @id ends with '#webpage'.
   * - The BreadcrumbList itemListElement contains exactly 1 item
   *   (homepage breadcrumb has no parent — the page IS the root).
   */
  it('returns 2 SchemaDef nodes for the homepage, with a single-item BreadcrumbList', () => {
    const result: SchemaDef[] = generatePageSchema(
      '/',
      'Home Title',
      'Home Desc',
      FIXED_TIMESTAMP
    );

    // The function contract guarantees exactly 2 nodes.
    expect(result).toHaveLength(2);

    // Index 0 must be the WebPage node.
    expect(result[0].type).toBe('WebPage');

    // The @id must end with '#webpage' to satisfy the Schema.org graph
    // cross-referencing convention used in this application.
    const webpageId = result[0].data['@id'] as string;
    expect(webpageId).toMatch(/#webpage$/);

    // Homepage breadcrumb must contain only the root Home item.
    const breadcrumbItems = result[1].data.itemListElement as Array<Record<string, unknown>>;
    expect(breadcrumbItems).toHaveLength(1);
  });

  /**
   * Test case 2 — Inner-page variant (path !== '/').
   *
   * Verifies:
   * - The BreadcrumbList itemListElement contains exactly 2 items.
   * - The first item's `item` property equals the site base URL
   *   (the Home link target that search engines use for the breadcrumb trail).
   * - The second item's `name` property equals the page title passed to the function.
   */
  it('returns a two-item BreadcrumbList for inner pages, with correct Home link and page name', () => {
    const result: SchemaDef[] = generatePageSchema(
      '/garden-room',
      'Garden Rooms',
      'Desc',
      FIXED_TIMESTAMP
    );

    const breadcrumbItems = result[1].data.itemListElement as Array<Record<string, unknown>>;

    // Inner pages must have exactly two breadcrumb positions: Home and the current page.
    expect(breadcrumbItems).toHaveLength(2);

    // Position 1 must carry the base URL so crawlers can navigate to the home page.
    expect(breadcrumbItems[0].item).toBe('https://modularhouse.ie');

    // Position 2 name must match the title argument verbatim.
    expect(breadcrumbItems[1].name).toBe('Garden Rooms');
  });

  /**
   * Test case 3 — Timestamp propagation.
   *
   * Verifies that the buildTimestamp argument is embedded verbatim in both
   * the datePublished and dateModified fields of the WebPage node. This is
   * the mechanism that ensures all freshness signals across the build
   * (og:article:modified_time, WebPage.dateModified, sitemap <lastmod>)
   * are identical — they all originate from the same BUILD_TIMESTAMP value.
   */
  it('embeds the buildTimestamp identically in datePublished and dateModified', () => {
    const result: SchemaDef[] = generatePageSchema(
      '/about',
      'About',
      'Desc',
      FIXED_TIMESTAMP
    );

    const webPageData = result[0].data;

    expect(webPageData.datePublished).toBe(FIXED_TIMESTAMP);
    expect(webPageData.dateModified).toBe(FIXED_TIMESTAMP);
  });

  /**
   * Additional assertion for test case 2 scope — BreadcrumbList type.
   *
   * Verifies that index [1] of the return array has type 'BreadcrumbList',
   * confirming the function always returns nodes in the documented order:
   * [0] WebPage, [1] BreadcrumbList.
   */
  it('returns a BreadcrumbList node at index 1', () => {
    const result: SchemaDef[] = generatePageSchema(
      '/contact',
      'Contact',
      'Desc',
      FIXED_TIMESTAMP
    );

    expect(result[1].type).toBe('BreadcrumbList');
  });
});

// ---------------------------------------------------------------------------
// generateWebSiteSchema
// ---------------------------------------------------------------------------

describe('generateWebSiteSchema', () => {
  /**
   * Test case 4 — WebSite schema structure.
   *
   * Verifies:
   * - The return value has type 'WebSite'.
   * - The potentialAction property is an array of length 1.
   * - The single potentialAction entry has @type 'SearchAction'.
   *
   * These assertions confirm the Sitelinks Search Box markup is correctly
   * structured according to the Schema.org SearchAction vocabulary.
   */
  it('returns a WebSite SchemaDef with a single SearchAction potentialAction', () => {
    const result: SchemaDef = generateWebSiteSchema();

    // Top-level type must be 'WebSite' for the @graph to be processed correctly.
    expect(result.type).toBe('WebSite');

    // potentialAction must be an array — Schema.org allows multiple actions,
    // but this application declares exactly one SearchAction.
    const potentialAction = result.data.potentialAction as Array<Record<string, unknown>>;
    expect(potentialAction).toHaveLength(1);

    // The single action must identify itself as a SearchAction so that Google
    // can recognise it as eligible for the Sitelinks Search Box feature.
    expect(potentialAction[0]['@type']).toBe('SearchAction');
  });
});
