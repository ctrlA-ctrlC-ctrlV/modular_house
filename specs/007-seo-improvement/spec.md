# Feature Specification: SEO Implementation Improvement

**Feature Branch**: `007-seo-improvement`
**Created**: 2026-02-25
**Status**: Draft
**Input**: User description: "As a Senior Web Architect with 20 years of experience, improve the current web app's SEO implementation based on the analysis of the #1 ranked competitor (homemodular.ie) and the existing gap analysis."

## Context & Background

This feature builds directly on the completed `005-seo-maximization` work. The foundational SEO infrastructure (SSG pre-rendering, sitemap, robots.txt, structured data components, centralized route metadata) is already in place. However, a post-implementation audit (`seo-fundamental-analysis.md` and `seo-gap-analysis.md`) identified a **critical architectural split** that is actively undermining search rankings:

- The **Landing page** (`/`) uses the full-featured `Seo` component from the UI library with complete Open Graph, Twitter Card, canonical URL, and robots meta support.
- **All other pages** use a minimal `SEOHead` component that only renders `<title>` and `<meta name="description">`, missing everything else.
- This creates a **50% SEO coverage gap** across the site — the engine is built but half the cylinders are disconnected.

The #1 ranked competitor (homemodular.ie, WordPress + Yoast SEO) gets every one of these signals automatically on every page. We need to be intentional about matching that output.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent Meta Tag Coverage Across All Pages (Priority: P1)

As a site owner, I want every public page to emit the same complete set of meta tags (Open Graph, Twitter Card, canonical URL, robots directives) that the landing page currently emits, so that Google and social media platforms treat all pages with equal authority and SERP appearances improve across the board.

**Why this priority**: Open Graph, canonical URL, and robots meta with `max-image-preview:large` are P0 ranking signals per the gap analysis. Without them, non-landing pages have split link equity, show broken social previews, and are excluded from large image thumbnails in search results — all direct ranking impacts.

**Independent Test**: Can be fully tested by inspecting the pre-rendered HTML of any non-landing page (e.g., view-source on `/garden-room`) and confirming the presence of `og:title`, `og:image`, `link[rel=canonical]`, and `meta[name=robots]` tags.

**Acceptance Scenarios**:

1. **Given** a user shares the `/garden-room` URL on LinkedIn, **When** LinkedIn fetches the Open Graph metadata, **Then** the preview shows the correct product title, description, and a relevant hero image — not a blank card.
2. **Given** Google crawls the `/house-extension` page, **When** it reads the meta tags, **Then** it finds `<link rel="canonical" href="https://modularhouse.ie/house-extension">` preventing duplicate content splits.
3. **Given** Google indexes the `/gallery` page, **When** it evaluates the robots directive, **Then** it finds `max-image-preview:large` enabling large image thumbnails in image-heavy search results, improving click-through rate.
4. **Given** the site is deployed, **When** any public page URL is validated with a Twitter Card validator, **Then** the card renders correctly with title, description, and image.
5. **Given** the consolidation is complete, **When** any public page's pre-rendered HTML is inspected, **Then** there is exactly one `<title>` tag and one `<meta name="description">` tag — no duplicates.

---

### User Story 2 - Enriched Structured Data for SERP Rich Features (Priority: P2)

As a marketing manager, I want our search listings to display breadcrumb trails, FAQ answers, and a sitelinks search box, so that our SERP real estate expands and drives higher qualified click-through rates from users who are ready to engage.

**Why this priority**: The competitor uses interconnected `WebPage`, `BreadcrumbList`, `WebSite` (with `SearchAction`), and `FAQPage` schemas. These unlock rich SERP features — breadcrumb display, FAQ expansion, and a Google sitelinks search box. Our current structured data (Product, Organization, LocalBusiness) is correct but misses these SERP-enhancement schemas entirely.

**Independent Test**: Can be tested using Google's Rich Results Test tool on any deployed page URL. Passing this test means the schema is valid and eligible for rich display in search results.

**Acceptance Scenarios**:

1. **Given** the Landing page FAQ section is rendered, **When** validated with Google's Rich Results Test, **Then** the `FAQPage` schema passes with zero errors and the FAQ question/answer pairs match what is visible on the page.
2. **Given** the `/garden-room` page is indexed, **When** Google processes the `BreadcrumbList` schema, **Then** the SERP listing may display "Home › Garden Rooms" as a breadcrumb trail beneath the page title.
3. **Given** the homepage is indexed, **When** Google processes the `WebSite` schema with `SearchAction`, **Then** a sitelinks search input may appear beneath the main result when the brand name is searched directly.
4. **Given** any public page is validated, **When** submitted to the Google Rich Results Test, **Then** the `WebPage` schema passes validation including `datePublished` and `dateModified` freshness signals.

---

### User Story 3 - Freshness Signals in Sitemap and Meta Tags (Priority: P3)

As a site owner, I want the sitemap and page meta tags to communicate when content was last updated, so that Google prioritizes recrawling our pages after changes and treats them as fresh content for time-sensitive queries.

**Why this priority**: The competitor's WordPress auto-generates `<lastmod>` in the sitemap and `article:modified_time` in the Open Graph meta for every page. These are low-effort additions that directly improve recrawl prioritization.

**Independent Test**: Can be tested by inspecting `dist/sitemap.xml` after a build — every `<url>` block should contain a `<lastmod>` tag with a valid ISO 8601 date.

**Acceptance Scenarios**:

1. **Given** the site is built and deployed, **When** Google fetches `sitemap.xml`, **Then** every `<url>` entry contains a `<lastmod>` element with the build date in `YYYY-MM-DD` format.
2. **Given** any public page with Open Graph tags is rendered, **When** a social crawler or Google reads the page head, **Then** it finds `<meta property="article:modified_time">` containing the build timestamp.

---

### Edge Cases

- **Admin and legal pages**: `/admin/*` pages must use `noindex, nofollow` robots directives and must not be included in sitemap entries or expose Open Graph images. `/privacy` and `/terms` use standard `index, follow` without the image expansion directives.
- **Missing OG images**: If a route does not define an OG image in its metadata, the system must gracefully fall back to the site-wide default hero image rather than rendering an empty `og:image` tag.
- **Duplicate title conflict on Landing page**: Landing page currently renders both `SEOHead` (via TemplateLayout) and a direct `Seo` component call. After consolidation, the direct `Seo` call in `Landing.tsx` must be removed so that only the TemplateLayout-managed component sets SEO tags.
- **SSG build verification**: After pre-rendering, every generated HTML file must contain the newly added meta tags in the static output — not just injected at runtime, which crawlers may miss.
- **OG image dimensions**: All OG image entries should include width and height values to ensure correct social preview rendering across platforms.

---

## Requirements *(mandatory)*

### Functional Requirements

**P0 — Direct Ranking Impact**

- **FR-001**: The `SEOConfig` type MUST be extended to include `canonicalUrl`, `robots`, `openGraph` (with fields: type, title, description, image, imageWidth, imageHeight, imageType, url, siteName), and `twitter` (with fields: cardType, site, title, description, image, imageAlt) fields, all optional.
- **FR-002**: The `TemplateLayout` component MUST replace the minimal `SEOHead` component with the full-featured `Seo` component from the shared UI library, so that every page using TemplateLayout automatically renders the complete set of meta tags.
- **FR-003**: The `routes-metadata.ts` file MUST be updated so that every public route entry includes populated `canonicalUrl`, `openGraph`, and `twitter` values.
- **FR-004**: Every public page MUST render a `<link rel="canonical">` tag with an absolute URL specific to that page.
- **FR-005**: Every public page MUST render a `<meta name="robots">` tag. The default value MUST be `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`.
- **FR-006**: Every public page MUST render a complete set of Open Graph tags including at minimum: `og:type`, `og:title`, `og:description`, `og:url`, `og:site_name`, `og:image`, `og:image:width`, `og:image:height`.
- **FR-007**: Every public page MUST render `<meta name="twitter:card" content="summary_large_image">`.
- **FR-008**: The direct `<Seo>` component call inside `Landing.tsx` MUST be removed after `TemplateLayout` is updated, ensuring only one component sets SEO tags per page.
- **FR-009**: The minimal `SEOHead` component file MUST be removed from the codebase once the consolidation is verified complete and no other consumers reference it.

**P1 — SERP Enhancement**

- **FR-010**: Every public route MUST include a `BreadcrumbList` JSON-LD schema in its structured data. The homepage breadcrumb contains only the "Home" list item. All other pages contain "Home" then the page title as list items.
- **FR-011**: Every public route MUST include a `WebPage` JSON-LD schema with `@id`, `url`, `name`, `description`, `datePublished`, and `dateModified` fields. Date values MUST be set from the build timestamp.
- **FR-012**: The homepage (`/`) route MUST include a `WebSite` JSON-LD schema containing a `SearchAction` potentialAction with an `urlTemplate` pointing to the site search URL pattern.
- **FR-013**: The Landing page route in `routes-metadata.ts` MUST include a `FAQPage` JSON-LD schema with question/answer pairs that exactly match the FAQ content visible in the `MiniFAQs` component on the page.
- **FR-014**: A reusable schema generator utility MUST be created that accepts a route path and page title and returns the `WebPage` and `BreadcrumbList` schema objects, so that these schemas are not duplicated across every route entry.

**P2 — Freshness Signals**

- **FR-015**: The sitemap generator MUST inject a `<lastmod>` element into every `<url>` block using the build timestamp in `YYYY-MM-DD` format.
- **FR-016**: When Open Graph tags include `article:modified_time`, it MUST use the build timestamp in full ISO 8601 format.

### Key Entities

- **SEOConfig**: The per-route configuration record. After this feature, it is the single source of truth for title, description, canonical URL, robots directives, Open Graph data, Twitter Card data, and structured data schemas for each page.
- **Route Metadata**: The `routes-metadata.ts` file mapping URL paths to their SEOConfig. Every consumer (TemplateLayout, sitemap generator, prerender script) reads from this single source.
- **Build Timestamp**: The ISO 8601 datetime captured at build time. Used consistently in `<lastmod>`, `article:modified_time`, `WebPage.dateModified`, and `WebPage.datePublished`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of public pages (/, /garden-room, /house-extension, /gallery, /about, /contact) include `og:title`, `og:description`, `og:image`, `og:url`, and `og:site_name` tags in their pre-rendered static HTML — verified by post-build inspection of `dist/*/index.html`.
- **SC-002**: 100% of public pages include a `<link rel="canonical">` tag with the correct absolute URL — verified by post-build HTML inspection.
- **SC-003**: 100% of public pages include the full robots meta directive with `max-image-preview:large` — verified by post-build HTML inspection.
- **SC-004**: Google Rich Results Test returns zero errors for `BreadcrumbList`, `WebPage`, and `FAQPage` (landing page only) schemas on all applicable pages.
- **SC-005**: `dist/sitemap.xml` contains a `<lastmod>` element for every `<url>` entry after build — verified by the existing automated validation script.
- **SC-006**: Sharing any public page URL on LinkedIn renders a preview with the correct page-specific title, description, and image — verified using LinkedIn Post Inspector.
- **SC-007**: Zero duplicate `<title>` tags or duplicate `<meta name="description">` tags in any pre-rendered HTML file — verified by post-build DOM inspection.

---

## Assumptions

- The shared UI library's `Seo` component (`packages/ui/src/components/Seo/Seo.tsx`) already supports all required props (`canonicalUrl`, `robots`, `openGraph`, `twitter`, `jsonLd`) and does not need to be modified — only consumed correctly.
- Hero images already uploaded to `/resource/` (e.g., `landing_hero.png`) can be referenced by their public URL for OG images. Absolute URLs are constructed using the production domain `https://modularhouse.ie`.
- The `MiniFAQs` component on the Landing page contains the canonical FAQ content. The FAQ schema question/answer text is derived directly from what is already visible on the page — no new content needs to be written.
- Build timestamp injection is handled at the Node.js build script level using `new Date().toISOString()` — no CI environment variable is required.
- `routes-metadata.ts` is the sole source of truth for all route-level SEO configuration. No per-page component should define its own SEO tags after the consolidation is complete.
