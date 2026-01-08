# Feature Specification: SEO Maximization

**Feature Branch**: `005-seo-maximization`
**Created**: January 7, 2026
**Status**: Draft
**Input**: User description: "Based on your analysis of the project create the none technical plan for the step this project need to take to maximise the SEO ranking."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search Engine Crawling & Indexing (Priority: P1)

As a site owner, I want search engines (Google, Bing) to be able to fully crawl and index all public pages of the website so that potential customers can find us in search results.

**Why this priority**: Without indexing, the site is invisible to organic traffic, rendering all other marketing efforts less effective.

**Independent Test**: Can be tested by inspecting the generated `sitemap.xml` and `robots.txt` and using tools like Google Search Console URL Inspection or a local crawler (e.g., Screaming Frog).

**Acceptance Scenarios**:

1. **Given** a web crawler visits the root domain, **When** it requests `/robots.txt`, **Then** it receives a valid file allowing access to all public routes and pointing to the sitemap.
2. **Given** a web crawler parses `sitemap.xml`, **When** it follows the links, **Then** it finds all key public pages (`/`, `/about`, `/contact`, `/gallery`, `/garden-room`, `/house-extension`).
3. **Given** a search engine renders the page, **When** it looks for metadata, **Then** every page has unique title and description tags relevant to its content.

---

### User Story 2 - Rich Search Results (Priority: P2)

As a marketing manager, I want our search listings to display rich information (star ratings, product pricing, organization logo) so that our click-through rate (CTR) increases.

**Why this priority**: High visibility in search results builds trust and drives more qualified traffic.

**Independent Test**: Can be tested using the Google Rich Results Test tool on deployed pages or localhost tunnels.

**Acceptance Scenarios**:

1. **Given** a user searches for "Modular House Garden Room", **When** the result appears, **Then** it may display product details (price range, availability) if supported by the schema.
2. **Given** the "Contact" page is indexed, **When** viewed in maps or search, **Then** it correctly identifies the business location, hours, and contact info via `LocalBusiness` schema.
3. **Given** the code is deployed, **When** validated against Schema.org standards, **Then** no errors or warnings are reported for `Product`, `Service`, or `Organization` types.

---

### User Story 3 - Accessible Navigation for Bots (Priority: P2)

As a search bot, I want to find links to other pages using standard HTML anchors (`<a href>`) so that I can discover the depth of the site content without executing complex JavaScript.

**Why this priority**: Many crawlers do not execute JavaScript efficiently. Relying on `onClick` handlers hides content from these bots.

**Independent Test**: Can be tested by disabling JavaScript in the browser and verifying that navigation links still appear as standard anchors (even if the transition doesn't work without JS, the *link* must be visible in the DOM).

**Acceptance Scenarios**:

1. **Given** a crawler parses the Landing page source code, **When** it extracts links, **Then** it finds direct `href` paths to internal pages like `/garden-room` and `/contact` instead of just buttons with event listeners.

### Edge Cases

- **JavaScript Disabled**: Major search bots may render without JS. Navigation links must allow basic traversal even if styling is broken.
- **Admin Discovery**: Bots might try to guess `/admin` URLs. `robots.txt` must explicitly block them.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST serve a `robots.txt` file at the root that allows indexing of public pages and disallows `/admin`.
- **FR-002**: The system MUST auto-generate a `sitemap.xml` at build time containing all static public routes.
- **FR-003**: The Gallery page MUST render unique `<title>` and `<meta name="description">` tags populated with relevant keywords.
- **FR-004**: Service pages (`/garden-room`, `/house-extension`) and Contact page MUST render valid JSON-LD structure data (`Product`, `Service`, `LocalBusiness`) matching their content.
- **FR-005**: All primary call-to-action buttons that navigate to internal pages MUST be rendered as semantic `<a href>` or `<Link>` elements, not `<button>` or `<div>` with `onClick` handlers.
- **FR-006**: All images in the Gallery and Hero sections MUST have descriptive `alt` text attributes.
- **FR-007**: The system MUST NOT block search indexing on any public environment (production).

### Key Entities

- **Sitemap**: An XML document listing all URLs that are available for crawling.
- **Schema (JSON-LD)**: Structured data blocks injected into the `<head>` to describe content to machines.
- **Meta Tags**: HTML tags (`title`, `description`) providing summaries for search engine results pages (SERPs).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of public pages are discoverable via `sitemap.xml` and accessible to bots (verified by crawler test).
- **SC-002**: 0 errors in Google Rich Results Test for all service pages.
- **SC-003**: Lighthouse SEO Audit score of 100/100 for the Landing page.
