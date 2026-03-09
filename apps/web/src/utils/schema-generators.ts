/**
 * schema-generators.ts
 *
 * Pure-function utility module for generating Schema.org JSON-LD node
 * definitions used across all public routes of the application.
 *
 * Design constraints:
 * - No React imports. No DOM references. No side effects.
 * - All exported functions are deterministic: identical inputs always produce
 *   identical outputs, making them safe to call from both the browser bundle
 *   and Node.js build scripts (prerender, sitemap generator).
 * - Each function returns one or more SchemaDef objects. The caller is
 *   responsible for assembling these into the final @graph array before
 *   passing the result to the Seo component's jsonLd prop.
 *
 * Open-Closed Principle: new schema generators can be added as additional
 * exported functions without modifying existing ones or their call sites.
 */

import type { SchemaDef } from '../types/seo';

/**
 * The canonical base URL for all schema @id and url values.
 *
 * Declared as a module-level constant so that a hostname change requires a
 * single edit in one place. No trailing slash — paths are appended directly.
 */
const BASE_URL = 'https://modularhouse.ie';

// ---------------------------------------------------------------------------
// Internal helper types
// ---------------------------------------------------------------------------

/**
 * A single item in a BreadcrumbList itemListElement array.
 *
 * The item property is omitted for the final breadcrumb position (the
 * current page) because Schema.org recommends that the last ListItem does
 * not carry an item URL — it represents the current document itself.
 */
interface BreadcrumbListItem {
  '@type': 'ListItem';
  /** The 1-based position of this item in the breadcrumb trail. */
  position: number;
  /** The human-readable label for this breadcrumb step. */
  name: string;
  /**
   * The absolute URL of this breadcrumb destination.
   * Present on all items except the final (current-page) item.
   */
  item?: string;
}

// ---------------------------------------------------------------------------
// Exported schema generator functions
// ---------------------------------------------------------------------------

/**
 * Generates the standard page-level schema nodes required on every public
 * route: a WebPage node and its associated BreadcrumbList node.
 *
 * The two nodes are linked via their @id values:
 * - WebPage.breadcrumb.@id references the BreadcrumbList node's @id.
 * This cross-reference allows Google to associate the breadcrumb trail with
 * the specific page document rather than treating them as isolated objects.
 *
 * URL construction rules:
 * All paths, including the homepage, resolve to URLs without trailing slashes.
 * This convention aligns with the site-wide URL normalization strategy that
 * strips trailing slashes to prevent duplicate content issues.
 *
 * BreadcrumbList itemListElement rules:
 * - Homepage: single item [Home] with no item URL (the page IS the home).
 * - All other paths: two items [Home -> <page title>]. The Home item carries
 *   the base URL; the second item carries no URL per Schema.org convention.
 *
 * @param path            - The route path, e.g. '/' or '/garden-room'.
 * @param title           - The human-readable page title used for WebPage.name
 *                          and the final BreadcrumbList item name.
 * @param description     - The page description used for WebPage.description.
 * @param buildTimestamp  - An ISO 8601 timestamp string sourced from
 *                          BUILD_TIMESTAMP in prerender.ts. Used for both
 *                          datePublished and dateModified to ensure all
 *                          freshness signals across the build are identical.
 * @returns               An array of exactly two SchemaDef objects:
 *                          [0] WebPage node
 *                          [1] BreadcrumbList node
 */
export function generatePageSchema(
  path: string,
  title: string,
  description: string,
  buildTimestamp: string
): SchemaDef[] {
  // Construct the fully-qualified URL for this page.
  // All URLs use the no-trailing-slash convention for consistency.
  // The homepage (path '/') resolves to BASE_URL without trailing slash.
  const pageUrl = path === '/' ? BASE_URL : `${BASE_URL}${path}`;

  // Stable @id values for cross-referencing between the two nodes.
  const webpageId = `${pageUrl}#webpage`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;

  // Build the breadcrumb item list based on whether this is the homepage.
  // Homepage: one item only — the home page itself.
  // Other pages: two items — Home (with URL) and the current page (no URL).
  const isHomepage = path === '/';

  const breadcrumbItems: BreadcrumbListItem[] = isHomepage
    ? [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          // No item URL: Schema.org convention for the current page node.
        },
      ]
    : [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          // The base URL (without trailing slash) is the canonical Home URL
          // used as the breadcrumb link target for inner pages.
          item: BASE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: title,
          // No item URL for the final position: this is the current document.
        },
      ];

  return [
    // ------------------------------------------------------------------
    // WebPage node
    // Describes the current document to search engines. The @id uniquely
    // identifies this page within the site's schema graph. datePublished
    // and dateModified are both set to the build timestamp — this is
    // intentional: the static site regenerates on every deploy, so the
    // build timestamp is the most accurate available proxy for both fields.
    // ------------------------------------------------------------------
    {
      type: 'WebPage',
      data: {
        '@id': webpageId,
        url: pageUrl,
        name: title,
        description,
        datePublished: buildTimestamp,
        dateModified: buildTimestamp,
        // Cross-reference to the BreadcrumbList node defined below.
        breadcrumb: { '@id': breadcrumbId },
      },
    },

    // ------------------------------------------------------------------
    // BreadcrumbList node
    // Provides the hierarchical navigation path to this page. Linked to
    // the WebPage node above via the shared breadcrumbId @id value.
    // ------------------------------------------------------------------
    {
      type: 'BreadcrumbList',
      data: {
        '@id': breadcrumbId,
        itemListElement: breadcrumbItems,
      },
    },
  ];
}

/**
 * Generates the site-wide WebSite schema node with a SearchAction.
 *
 * This node is emitted once — on the homepage only — and describes the
 * overall website identity to search engines. The potentialAction property
 * enables Google's Sitelinks Search Box feature, which can surface an
 * inline search field directly in search results for branded queries.
 *
 * SearchAction details:
 * - target.urlTemplate uses the standard query-string pattern expected by
 *   the site's search implementation.
 * - query-input is typed as PropertyValueSpecification per the Schema.org
 *   vocabulary for SearchAction.
 *
 * @returns A single SchemaDef of type 'WebSite'.
 */
export function generateWebSiteSchema(): SchemaDef {
  return {
    type: 'WebSite',
    data: {
      // The @id anchors this node within the schema graph. Convention is
      // to use /#website (with hash) to distinguish it from the page URL.
      '@id': `${BASE_URL}/#website`,
      url: `${BASE_URL}/`,
      name: 'Modular House',
      description: 'Steel Frame Garden Rooms & House Extensions',

      // potentialAction enables the Google Sitelinks Search Box for
      // branded queries. The URL template must match the site's actual
      // search endpoint; the placeholder token {search_term_string} is
      // substituted by the search engine when generating the search URL.
      potentialAction: [
        {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${BASE_URL}/?s={search_term_string}`,
          },
          // query-input declares the input variable used in urlTemplate.
          // valueRequired: true informs crawlers the query is mandatory.
          'query-input': {
            '@type': 'PropertyValueSpecification',
            valueRequired: true,
            valueName: 'search_term_string',
          },
        },
      ],
    },
  };
}
