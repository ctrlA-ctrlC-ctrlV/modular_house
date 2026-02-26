# Research: SEO Implementation Improvement

**Branch**: `007-seo-improvement` | **Date**: 2026-02-25

---

## Decision 1: SEO Component Consolidation Strategy

**Decision**: Replace `apps/web/src/components/seo/SEOHead.tsx` usage in `TemplateLayout.tsx` with the existing `packages/ui/src/components/Seo/Seo.tsx` component.

**Rationale**:
- The full `Seo` component already exists in the UI package and is already used by `Landing.tsx`, `GardenRoom.tsx`, `HouseExtension.tsx` — it is proven and production-ready.
- It supports all required fields: `canonicalUrl`, `robots`, `openGraph`, `twitter`, `jsonLd`, `siteTitleSuffix`.
- Replacing `SEOHead` in `TemplateLayout` means zero new component code is written — the fix is purely wiring up what already exists.
- The alternative (extending `SEOHead` to feature parity) would duplicate all rendering logic and violate DRY, creating two components to maintain in perpetuity.

**Alternatives considered**:
- **Extend SEOHead**: Rejected — duplicates logic already in `Seo`, creates maintenance burden, no architectural benefit.
- **Add OG/Twitter as pass-through props to SEOHead (wrapping Seo)**: Rejected — adds an unnecessary indirection layer; direct use of `Seo` is simpler.

---

## Decision 2: SEOConfig Type Extension Strategy

**Decision**: Extend `apps/web/src/types/seo.ts` to add optional `canonicalUrl`, `robots`, `openGraph`, `twitter` fields directly onto the existing `SEOConfig` interface. Keep `schema?: SchemaDef[]` as-is.

**Rationale**:
- The `SeoProps` interface in `packages/ui` already defines `OpenGraph` and `TwitterCard` types with the exact fields needed.
- Rather than re-defining these types in the app layer, re-export or import the types from the UI package to maintain a single type source.
- `SEOConfig` is the data-transfer interface used in `routes-metadata.ts` and by Node.js scripts (sitemap generator, prerender). It must remain importable without React.
- Adding fields as optional means all existing route entries continue to work without change during the migration.

**Alternatives considered**:
- **Replace SEOConfig with SeoProps**: Rejected — `SeoProps` includes `siteTitleSuffix` which is a layout concern, not route metadata. Also, `SeoProps.jsonLd` is `Record<string,unknown>` while our current schemas use `SchemaDef[]` — conflating them would require a breaking migration.
- **Parallel interface (SEOConfigV2)**: Rejected — unnecessary complexity; optional extension is non-breaking.

---

## Decision 3: Route-Level vs. Global OG Image Fallback

**Decision**: Each route in `routes-metadata.ts` explicitly defines its `openGraph.image`. For routes without a natural hero image (About, Privacy, Terms), default to `https://modularhouse.ie/resource/landing_hero.png` as the site-wide OG image.

**Rationale**:
- Explicit per-route images give Google the best association between URL and image content.
- All hero images are already served from `/resource/` at the production domain — no new asset uploads needed.
- The `Seo` component will conditionally render `og:image` only when present, so setting it explicitly avoids empty tag rendering.

---

## Decision 4: Structured Data Architecture — Schema Generator Utility

**Decision**: Create `apps/web/src/utils/schema-generators.ts` exporting:
1. `generatePageSchema(path, title, description, buildTimestamp)` → returns `SchemaDef[]` containing `WebPage` + `BreadcrumbList`
2. `generateWebSiteSchema()` → returns `SchemaDef` containing `WebSite` with `SearchAction` (homepage only)

**Rationale**:
- `WebPage` + `BreadcrumbList` schemas are structurally identical across all routes (only path/title/description vary) — a generator eliminates 8x duplication in `routes-metadata.ts`.
- The generator is a pure function with no React/DOM dependency, making it importable in Node.js build scripts without bundler issues.
- Build timestamp is passed as a parameter (not captured at module level) to make the function testable with controlled timestamps.

**Alternatives considered**:
- **Inline schemas per route**: Rejected — produces ~200 lines of repetitive configuration that is error-prone to maintain and update.
- **Runtime computation in TemplateLayout**: Rejected — schemas must be available at build time for SSG pre-rendering to embed them in static HTML.

---

## Decision 5: FAQPage Schema Placement

**Decision**: Add `FAQPage` JSON-LD to the homepage route in `routes-metadata.ts` as an additional `SchemaDef` entry. The question/answer data is extracted from the `MiniFAQs` component data in `Landing.tsx` and duplicated (as text) in the schema definition.

**Rationale**:
- The three FAQs already defined in `Landing.tsx` (`MiniFAQs` props) are the canonical content — schema text must exactly match visible page text per Google's guidelines.
- Placing the schema in `routes-metadata.ts` (not `Landing.tsx`) keeps all SEO configuration centralized and ensures the schema is embedded at SSG build time.
- No dynamic FAQ loading occurs — content is static, so duplication in schema is the correct pattern (same as competitor's Yoast implementation).

**FAQ content** (extracted from `Landing.tsx` `MiniFAQs` props):
1. "Why choose Steel Frame over timber or block?" — answer about speed, strength, precision, ~30% faster builds
2. "Do I need planning permission?" — answer about Exempted Developments
3. "Is my build guaranteed?" — answer about 50-year structural warranty

---

## Decision 6: Build Timestamp Injection

**Decision**: Capture `new Date().toISOString()` once at the top of `apps/web/scripts/prerender.ts` as a `BUILD_TIMESTAMP` constant. Pass it as an environment variable or module-level constant to `sitemap-generator.ts`. Use the same timestamp for `<lastmod>`, `article:modified_time`, `WebPage.dateModified`, and `WebPage.datePublished`.

**Rationale**:
- Single timestamp source prevents different dates appearing across sitemap and page meta.
- `prerender.ts` orchestrates the full build — capturing the timestamp there and passing it to the sitemap generator ensures consistency.
- ISO 8601 format (`YYYY-MM-DDTHH:MM:SSZ`) is universally accepted; for sitemap `<lastmod>` the spec allows `YYYY-MM-DD` (date-only), which is derived by `.split('T')[0]`.

---

## Decision 7: `SEOHead` Removal Timing

**Decision**: Remove `SEOHead.tsx` and its tests in the **same PR** as the `TemplateLayout` consolidation (not a later cleanup PR).

**Rationale**:
- Leaving a deprecated component in the codebase creates confusion about which one to use for future pages.
- The component has unit tests — deleting them alongside the component prevents orphaned test files.
- Since `SEOHead` is only used in `TemplateLayout`, there is no risk of other consumers breaking; the change is localized and safe to do atomically.

---

## Decision 8: OG Image Dimensions in SEOConfig

**Decision**: Add `imageWidth` and `imageHeight` fields to the `openGraph` sub-type. Populate them for routes that use known-dimension images.

**Rationale**:
- Facebook, LinkedIn, and Google use image dimensions for aspect ratio validation and layout decisions.
- The competitor specifies `og:image:width` and `og:image:height` on every page.
- Hero images are static assets with known dimensions (can be verified against `/resource/` files).
- No runtime image processing required — values are hardcoded in route metadata.

**Known image dimensions** (from competitor analysis pattern):
- `landing_hero.png` — 1200×630 (standard OG recommended size)
- Product page heroes — 1200×630 (confirm at implementation time)

---

## Decision 9: `WebSite` Schema with SearchAction

**Decision**: Add `WebSite` schema only on the homepage (`/`) route. Use `https://modularhouse.ie/?s={search_term_string}` as the search URL template per Google's structured data spec for `SearchAction`.

**Rationale**:
- `WebSite` + `SearchAction` enables a Google Sitelinks Search Box — only appears for the site's own brand query.
- Must only appear once per site (on the homepage) — duplicating across pages would be invalid schema.
- The URL template format follows Google's documented pattern for React SPAs using query string search.

---

## Decision 10: Testing Strategy for New Code

**Decision**:
- `schema-generators.ts` utility: Unit tests in `apps/web/src/utils/__tests__/schema-generators.test.ts` — test output shape, breadcrumb item count, timestamp embedding.
- `sitemap-generator.ts` update: Extend existing test in `apps/web/scripts/__tests__/sitemap.test.ts` to assert `<lastmod>` presence.
- `TemplateLayout.tsx` change: Update existing integration/render tests to assert OG tags are present in rendered output.
- No new component is being created — all new testable logic lives in the utility function.

**Constitution Alignment**: Constitution §III requires unit coverage for all new code and integration tests for critical paths. The schema generator utility is a critical path (it determines what Google sees) — 100% branch coverage target applies.
