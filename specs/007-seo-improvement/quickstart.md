# Quickstart: SEO Implementation Improvement

**Branch**: `007-seo-improvement` | **Date**: 2026-02-25

---

## Overview

This guide explains how to build, verify, and validate the SEO improvements. No new services or databases are required — all changes are to TypeScript source files and the SSG build pipeline.

---

## Prerequisites

- Node.js 20+ (check with `node -v`)
- pnpm installed (`npm install -g pnpm`)
- Working in the monorepo root: `E:\Zhaoxiang_Qiu\work\SDeal\modular_house`

---

## Development Workflow

### 1. Install dependencies (if not already)

```bash
pnpm install
```

### 2. Run development server (to preview changes)

```bash
pnpm --filter web dev
```

Navigate to `http://localhost:3000` and use browser DevTools → Elements → `<head>` to inspect meta tags live.

### 3. Run unit tests

```bash
# Run all tests in apps/web
pnpm --filter web test

# Run tests in watch mode during development
pnpm --filter web test --watch

# Run only SEO-related tests
pnpm --filter web test -- --testPathPattern="seo|schema"
```

---

## Verifying SEO Changes

### Check meta tags on a specific page

After making changes, inspect the pre-rendered output:

```bash
# Build the full SSG output
pnpm --filter web build

# Inspect pre-rendered HTML for a specific page
cat dist/client/garden-room/index.html | grep -E "(og:|twitter:|canonical|robots)" | head -20
```

Expected output for `/garden-room`:
```html
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="canonical" href="https://modularhouse.ie/garden-room">
<meta property="og:type" content="website">
<meta property="og:title" content="Garden Rooms &amp; Studios | Modular House">
<meta property="og:image" content="https://modularhouse.ie/resource/garden-room-hero.jpg">
<meta name="twitter:card" content="summary_large_image">
```

### Check sitemap has lastmod dates

```bash
cat dist/client/sitemap.xml
```

Each `<url>` block should contain:
```xml
<url>
  <loc>https://modularhouse.ie/garden-room</loc>
  <lastmod>2026-02-25</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.9</priority>
</url>
```

### Verify no duplicate title tags

```bash
# Should output exactly 1 line per HTML file
grep -c "<title>" dist/client/index.html
grep -c "<title>" dist/client/garden-room/index.html
```

### Check structured data

```bash
# Count JSON-LD script blocks in landing page (expect 4+: Organization, WebSite, WebPage, BreadcrumbList, FAQPage)
grep -c "application/ld+json" dist/client/index.html

# Pretty-print JSON-LD from a page
grep -o 'type="application/ld+json">[^<]*' dist/client/garden-room/index.html
```

---

## External Validation Tools

After deploying to a staging/production URL:

### 1. Google Rich Results Test
- URL: https://search.google.com/test/rich-results
- Paste the page URL
- Expected: `BreadcrumbList` passes, `WebPage` passes, `FAQPage` passes (homepage only)

### 2. LinkedIn Post Inspector
- URL: https://www.linkedin.com/post-inspector/inspect/
- Paste any public page URL
- Expected: Title, description, and image preview display correctly

### 3. Facebook Sharing Debugger
- URL: https://developers.facebook.com/tools/debug/
- Paste any public page URL
- Expected: `og:title`, `og:description`, `og:image` all display correctly

### 4. Twitter Card Validator
- URL: https://cards-dev.twitter.com/validator
- Expected: `summary_large_image` card renders with title and image

---

## File Change Map

When implementing, these are the files that need to change:

| File | Type of Change |
|------|----------------|
| `apps/web/src/types/seo.ts` | Extend `SEOConfig` with `canonicalUrl`, `robots`, `openGraph`, `twitter` |
| `packages/ui/src/components/Seo/Seo.tsx` | Add `imageWidth`, `imageHeight`, `imageType` to `OpenGraph` interface + render logic |
| `apps/web/src/components/TemplateLayout.tsx` | Replace `SEOHead` import+usage with `Seo` component |
| `apps/web/src/routes-metadata.ts` | Populate all routes with `canonicalUrl`, `openGraph`, `twitter`, extended schemas |
| `apps/web/src/utils/schema-generators.ts` | NEW — `generatePageSchema()` + `generateWebSiteSchema()` utilities |
| `apps/web/scripts/sitemap-generator.ts` | Add `<lastmod>` emission using build timestamp |
| `apps/web/scripts/prerender.ts` | Capture `BUILD_TIMESTAMP` constant, pass to sitemap generator |
| `apps/web/src/routes/Landing.tsx` | Remove direct `<Seo>` call (now handled by TemplateLayout) |
| `apps/web/src/routes/GardenRoom.tsx` | Remove direct `<Seo>` call |
| `apps/web/src/routes/HouseExtension.tsx` | Remove direct `<Seo>` call |
| `apps/web/src/routes/Contact.tsx` | Remove direct `<Seo>` call |
| `apps/web/src/routes/About.tsx` | Remove direct `<Seo>` call |
| `apps/web/src/components/seo/SEOHead.tsx` | DELETE (deprecated) |
| `apps/web/src/components/seo/__tests__/SEOHead.test.tsx` | DELETE (orphaned after SEOHead removal) |
| `apps/web/src/utils/__tests__/schema-generators.test.ts` | NEW — unit tests for schema generators |
| `apps/web/scripts/__tests__/sitemap.test.ts` | UPDATE — assert `<lastmod>` in output |

---

## Important: Route Component SEO — Before vs. After

**BEFORE** (current state):
- `TemplateLayout` injects `SEOHead` (title + description only) for every route
- `Landing.tsx`, `GardenRoom.tsx`, `HouseExtension.tsx` also call `<Seo>` directly — duplicating title+description AND adding OG/Twitter/canonical
- `Contact.tsx`, `About.tsx` use `<Seo>` directly but inconsistently

**AFTER** (target state):
- `TemplateLayout` injects the full `<Seo>` component for every route using the route's `SEOConfig`
- No route component calls `<Seo>` directly — all SEO is centralized in `routes-metadata.ts`
- Every page gets full meta tags from one place

**⚠️ Critical**: When removing `<Seo>` calls from route components, ensure the route's `SEOConfig` entry in `routes-metadata.ts` fully captures all previously page-level SEO data (especially schemas like `organizationSchema` in `Landing.tsx` which were defined at the component level). These schemas must move into `routes-metadata.ts`.
