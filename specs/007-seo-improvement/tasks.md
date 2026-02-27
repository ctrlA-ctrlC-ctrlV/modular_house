# Tasks: SEO Implementation Improvement

**Input**: Design documents from `/specs/007-seo-improvement/`
**Branch**: `007-seo-improvement`
**Generated**: 2026-02-26

**Organization**: Tasks are grouped by implementation phase (matching plan.md dependency order) and mapped to user stories from spec.md for traceability.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on each other)
- **[Story]**: User story label — [US1] = meta tag coverage, [US2] = structured data, [US3] = freshness signals
- Exact file paths are included in every task description

---

## Phase 1: Setup — No Prerequisites

**Purpose**: Verify the build environment works before making any changes, so you have a clean baseline to compare against.

- [x] T001 Run `pnpm --filter web build` from monorepo root and confirm it completes with zero TypeScript errors. Save the baseline count of `<title>` tags in `dist/client/index.html` (run `grep -c "<title>" dist/client/index.html`) for later comparison.

---

## Phase 2: Foundation — Type System & UI Component Extension

**Purpose**: Establish the extended type contracts that all subsequent phases depend on. No runtime behavior changes yet — only type and rendering logic additions.

**⚠️ CRITICAL**: Phases 3–7 all depend on these changes. TypeScript compilation must pass with zero errors after this phase before proceeding.

- [x] T002 [P] [US1] In `packages/ui/src/components/Seo/Seo.tsx`, add five optional fields to the `OpenGraph` interface: `imageWidth?: number`, `imageHeight?: number`, `imageType?: string`, `locale?: string`, `article_modified_time?: string`. (The `locale` field is needed so that `openGraph?.locale` compiles without a TypeScript error; `article_modified_time` is needed for FR-016.) Then in the component's JSX render block, add conditional meta tag emissions immediately after the existing `og:image` tag:
  - `{openGraph?.imageWidth && <meta property="og:image:width" content={String(openGraph.imageWidth)} />}`
  - `{openGraph?.imageHeight && <meta property="og:image:height" content={String(openGraph.imageHeight)} />}`
  - `{openGraph?.imageType && <meta property="og:image:type" content={openGraph.imageType} />}`
  - `{openGraph?.article_modified_time && <meta property="article:modified_time" content={openGraph.article_modified_time} />}` (satisfies FR-016)

  Also add `og:locale` emission: `<meta property="og:locale" content={openGraph?.locale ?? 'en_IE'} />` (default `en_IE` for regional search signal).

- [x] T003 [P] [US1] In `apps/web/src/types/seo.ts`, extend the `SEOConfig` interface by importing `OpenGraph` and `TwitterCard` types from `@modular-house/ui` (to avoid duplicating type definitions) and adding four new optional fields: `canonicalUrl?: string`, `robots?: string`, `openGraph?: OpenGraph`, `twitter?: TwitterCard`. Also add `lastmod?: string` as an optional field to the `SitemapConfig` interface in the same file (this will be used by Phase 7 / US3). All new fields are optional — existing route entries remain valid without changes.

**Checkpoint**: Run `pnpm tsc --noEmit` from monorepo root. Must report zero TypeScript errors before proceeding to Phase 3.

---

## Phase 3: Schema Generator Utility (US2 Foundation)

**Purpose**: Create the reusable pure-function utility that generates `WebPage` + `BreadcrumbList` + `WebSite` schemas. Must be complete before Phase 4 (route metadata) can use it.

- [x] T004 [US2] Create `apps/web/src/utils/schema-generators.ts` as a new file with two exported functions:

  **`generatePageSchema(path, title, description, buildTimestamp)`** — returns `SchemaDef[]` with exactly 2 items:
  - Item 0: `WebPage` schema with `@id` = `https://modularhouse.ie${path}#webpage`, `url` = `https://modularhouse.ie${path}` (or `https://modularhouse.ie/` for `/`), `name` = title, `description` = description, `datePublished` = buildTimestamp, `dateModified` = buildTimestamp, `breadcrumb.@id` = `https://modularhouse.ie${path}#breadcrumb`.
  - Item 1: `BreadcrumbList` schema with `@id` = `https://modularhouse.ie${path}#breadcrumb`. For the homepage (`path === '/'`), `itemListElement` contains only `[{ '@type': 'ListItem', position: 1, name: 'Home' }]`. For all other paths, `itemListElement` contains `[{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://modularhouse.ie' }, { '@type': 'ListItem', position: 2, name: title }]`.

  **`generateWebSiteSchema()`** — returns a single `SchemaDef` with type `'WebSite'` and data: `@id` = `https://modularhouse.ie/#website`, `url` = `https://modularhouse.ie/`, `name` = `'Modular House'`, `description` = `'Steel Frame Garden Rooms & House Extensions'`, `potentialAction` = array containing one `SearchAction` object with `target.@type = 'EntryPoint'`, `target.urlTemplate = 'https://modularhouse.ie/?s={search_term_string}'`, `query-input.@type = 'PropertyValueSpecification'`, `query-input.valueRequired = true`, `query-input.valueName = 'search_term_string'`.

  At the top of the file, declare `const BASE_URL = 'https://modularhouse.ie'` as a module-level constant. Import `SchemaDef` from the app's types. The functions must have no React or DOM dependencies so they can be called from Node.js build scripts.

- [x] T005 [US2] Create `apps/web/src/utils/__tests__/schema-generators.test.ts` with the following four test cases to achieve 100% branch coverage:
  1. `generatePageSchema('/', 'Home Title', 'Home Desc', '2026-02-25T10:00:00.000Z')` — assert the return value is an array of length 2; assert item[0].type === `'WebPage'`; assert item[0].data['@id'] ends with `#webpage`; assert item[1].data.itemListElement has length 1 (homepage variant).
  2. `generatePageSchema('/garden-room', 'Garden Rooms', 'Desc', '2026-02-25T10:00:00.000Z')` — assert item[1].data.itemListElement has length 2; assert itemListElement[0].item === `'https://modularhouse.ie'`; assert itemListElement[1].name === `'Garden Rooms'`.
  3. `generatePageSchema('/about', 'About', 'Desc', '2026-02-25T10:00:00.000Z')` — assert item[0].data.datePublished === `'2026-02-25T10:00:00.000Z'`; assert item[0].data.dateModified === `'2026-02-25T10:00:00.000Z'` (timestamp is embedded correctly in both fields).
  4. `generateWebSiteSchema()` — assert return value has `type === 'WebSite'`; assert `data.potentialAction` is an array of length 1; assert `data.potentialAction[0]['@type'] === 'SearchAction'`.

**Checkpoint**: Run `pnpm --filter web test -- --testPathPattern="schema-generators"`. All 4 test cases must pass before proceeding.

---

## Phase 4: Route Metadata Population (US1 + US2 + US3)

**Purpose**: Populate `routes-metadata.ts` with full SEO data for every public route. This is the data-entry phase — it completes the configuration that TemplateLayout will read.

**Prerequisite**: T004 (schema generators) must be complete. T002 and T003 (extended types) must be complete.

- [x] T006 [US1] [US2] [US3] Update `apps/web/src/routes-metadata.ts`. At the top of the file, import `BUILD_TIMESTAMP` **from `prerender.ts`** (T022 must be done first) and import the two schema generators:
  ```typescript
  import { BUILD_TIMESTAMP } from '../scripts/prerender';
  import { generatePageSchema, generateWebSiteSchema } from './utils/schema-generators';
  ```
  **Do NOT declare a new `const BUILD_TIMESTAMP = new Date().toISOString()` here.** The timestamp must come from `prerender.ts` so that `<lastmod>`, `WebPage.dateModified`, and `WebPage.datePublished` are all identical across every artifact (single source of truth — see research.md Decision 6). If the relative import path `../scripts/prerender` does not resolve, check `apps/web/tsconfig.json` path aliases.

  Then update the **homepage (`/`)** route entry's `seo` object to include:
  - `canonicalUrl: 'https://modularhouse.ie/'`
  - `robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'`
  - `openGraph: { type: 'website', title: 'Steel Frame Garden Rooms & House Extensions | Modular House', description: '<existing description>', image: 'https://modularhouse.ie/resource/landing_hero.png', imageWidth: 1200, imageHeight: 630, imageType: 'image/png', url: 'https://modularhouse.ie/', siteName: 'Modular House Construction', article_modified_time: BUILD_TIMESTAMP }`
  - `twitter: { cardType: 'summary_large_image', site: '@ModularHouse', title: 'Steel Frame Garden Rooms & House Extensions', image: 'https://modularhouse.ie/resource/landing_hero.png', imageAlt: 'Steel frame modular house garden room exterior' }`
  - In the `schema` array: move the existing `Organization` schema data from `Landing.tsx` into this entry, then append `generateWebSiteSchema()` and `...generatePageSchema('/', '<title>', '<description>', BUILD_TIMESTAMP)`. Also add the `FAQPage` schema as a `SchemaDef` with `type: 'FAQPage'` and `data.mainEntity` containing the three FAQ question/answer objects (see T007 for exact FAQ text extraction step).

- [x] T007 [US2] Read `apps/web/src/routes/Landing.tsx` to extract the exact question and answer text from the `MiniFAQs` component props (the three FAQ items: "Why choose Steel Frame over timber or block?", "Do I need planning permission?", "Is my build guaranteed?"). Copy the exact answer text verbatim into the `FAQPage` schema `acceptedAnswer.text` values in `routes-metadata.ts` (homepage entry). The text in the schema MUST be identical to the text rendered on the page — do not paraphrase or summarize.

- [x] T008 [P] [US1] Update the **`/garden-room`** route entry in `apps/web/src/routes-metadata.ts` to add to its `seo` object:
  - `canonicalUrl: 'https://modularhouse.ie/garden-room'`
  - `robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'`
  - `openGraph: { type: 'website', title: 'Garden Rooms & Studios | Modular House', description: '<existing description>', image: 'https://modularhouse.ie/resource/garden-room-hero.jpg', imageWidth: 1200, imageHeight: 630, imageType: 'image/jpeg', url: 'https://modularhouse.ie/garden-room', siteName: 'Modular House Construction', article_modified_time: BUILD_TIMESTAMP }`
  - `twitter: { cardType: 'summary_large_image', site: '@ModularHouse', title: 'Garden Rooms & Studios | Modular House', image: 'https://modularhouse.ie/resource/garden-room-hero.jpg', imageAlt: 'Steel frame garden room exterior' }`
  - In the `schema` array, keep the existing `Product` schema and append `...generatePageSchema('/garden-room', '<title>', '<description>', BUILD_TIMESTAMP)`.

- [x] T009 [P] [US1] Update the **`/house-extension`** route entry in `apps/web/src/routes-metadata.ts` to add to its `seo` object:
  - `canonicalUrl: 'https://modularhouse.ie/house-extension'`
  - `robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'`
  - `openGraph: { type: 'website', title: 'House Extensions | Modular House', description: '<existing description>', image: 'https://modularhouse.ie/resource/house-extension-hero.jpg', imageWidth: 1200, imageHeight: 630, imageType: 'image/jpeg', url: 'https://modularhouse.ie/house-extension', siteName: 'Modular House Construction', article_modified_time: BUILD_TIMESTAMP }`
  - `twitter: { cardType: 'summary_large_image', site: '@ModularHouse', title: 'House Extensions | Modular House', image: 'https://modularhouse.ie/resource/house-extension-hero.jpg', imageAlt: 'Steel frame house extension exterior' }`
  - In the `schema` array, keep the existing `Product` schema and append `...generatePageSchema('/house-extension', '<title>', '<description>', BUILD_TIMESTAMP)`.

- [x] T010 [P] [US1] Update the **`/gallery`** route entry in `apps/web/src/routes-metadata.ts` to add to its `seo` object:
  - `canonicalUrl: 'https://modularhouse.ie/gallery'`
  - `robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'`
  - `openGraph: { type: 'website', title: 'Project Gallery | Modular House', description: '<existing description>', image: 'https://modularhouse.ie/resource/landing_hero.png', imageWidth: 1200, imageHeight: 630, imageType: 'image/png', url: 'https://modularhouse.ie/gallery', siteName: 'Modular House Construction', article_modified_time: BUILD_TIMESTAMP }`
  - `twitter: { cardType: 'summary_large_image', site: '@ModularHouse', title: 'Project Gallery | Modular House', image: 'https://modularhouse.ie/resource/landing_hero.png', imageAlt: 'Modular house construction gallery' }`
  - In the `schema` array (create if not present), add `...generatePageSchema('/gallery', '<title>', '<description>', BUILD_TIMESTAMP)`.

- [x] T011 [P] [US1] Update the **`/about`** route entry in `apps/web/src/routes-metadata.ts` to add to its `seo` object:
  - `canonicalUrl: 'https://modularhouse.ie/about'`
  - `robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'`
  - `openGraph: { type: 'website', title: 'About Us | Modular House', description: '<existing description>', image: 'https://modularhouse.ie/resource/landing_hero.png', imageWidth: 1200, imageHeight: 630, imageType: 'image/png', url: 'https://modularhouse.ie/about', siteName: 'Modular House Construction', article_modified_time: BUILD_TIMESTAMP }`
  - `twitter: { cardType: 'summary_large_image', site: '@ModularHouse', title: 'About Us | Modular House', image: 'https://modularhouse.ie/resource/landing_hero.png', imageAlt: 'Modular House team and office' }`
  - In the `schema` array (create if not present), add `...generatePageSchema('/about', '<title>', '<description>', BUILD_TIMESTAMP)`.

- [x] T012 [P] [US1] Update the **`/contact`** route entry in `apps/web/src/routes-metadata.ts` to add to its `seo` object:
  - `canonicalUrl: 'https://modularhouse.ie/contact'`
  - `robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'`
  - `openGraph: { type: 'website', title: 'Contact Us | Modular House', description: '<existing description>', image: 'https://modularhouse.ie/resource/landing_hero.png', imageWidth: 1200, imageHeight: 630, imageType: 'image/png', url: 'https://modularhouse.ie/contact', siteName: 'Modular House Construction', article_modified_time: BUILD_TIMESTAMP }`
  - `twitter: { cardType: 'summary_large_image', site: '@ModularHouse', title: 'Contact Us | Modular House', image: 'https://modularhouse.ie/resource/landing_hero.png', imageAlt: 'Contact Modular House' }`
  - In the `schema` array, keep the existing `LocalBusiness` schema and append `...generatePageSchema('/contact', '<title>', '<description>', BUILD_TIMESTAMP)`.

- [x] T013 [P] [US1] Update the **`/privacy`** route entry in `apps/web/src/routes-metadata.ts` to add to its `seo` object:
  - `canonicalUrl: 'https://modularhouse.ie/privacy'`
  - `robots: 'index, follow'`
  - No `openGraph`, no `twitter`, no new schemas — legal pages receive only canonical and robots.

- [x] T014 [P] [US1] Update the **`/terms`** route entry in `apps/web/src/routes-metadata.ts` to add to its `seo` object:
  - `canonicalUrl: 'https://modularhouse.ie/terms'`
  - `robots: 'index, follow'`
  - No `openGraph`, no `twitter`, no new schemas — legal pages receive only canonical and robots.

**Checkpoint**: Run `pnpm tsc --noEmit`. Must report zero TypeScript errors.

---

## Phase 5: TemplateLayout Consolidation (US1)

**Purpose**: Wire the extended SEOConfig into the existing `Seo` component in `TemplateLayout`. This is the single change that delivers full meta tag coverage to every page at once.

**Prerequisite**: T002 (OpenGraph type extended), T003 (SEOConfig extended), T006–T014 (route metadata populated).

- [ ] T015 [US1] Update `apps/web/src/components/TemplateLayout.tsx`:
  1. Remove the import line `import { SEOHead } from './seo/SEOHead';`.
  2. Add the import line `import { Seo } from '@modular-house/ui';`.
  3. Replace the `SEOHead` JSX block:
     ```tsx
     {currentRoute?.seo && (
       <SEOHead config={currentRoute.seo} titleSuffix=" | Modular House" />
     )}
     ```
     With the full `Seo` JSX block:
     ```tsx
     {currentRoute?.seo && (
       <Seo
         title={currentRoute.seo.title}
         description={currentRoute.seo.description}
         canonicalUrl={currentRoute.seo.canonicalUrl}
         robots={currentRoute.seo.robots}
         openGraph={currentRoute.seo.openGraph}
         twitter={currentRoute.seo.twitter}
         jsonLd={
           currentRoute.seo.schema
             ? {
                 '@context': 'https://schema.org',
                 '@graph': currentRoute.seo.schema.map(s => ({
                   '@type': s.type,
                   ...s.data,
                 })),
               }
             : undefined
         }
         siteTitleSuffix=" | Modular House"
       />
     )}
     ```
     Do not touch any other part of `TemplateLayout.tsx`. The `StructuredData` component (if present in the file) should be left in place — it is not removed by this task.

**Checkpoint**: Run `pnpm tsc --noEmit`. Must report zero TypeScript errors. Run `pnpm --filter web dev` and open `http://localhost:3000/garden-room` in a browser, inspect `<head>` in DevTools — confirm `og:title`, `link[rel=canonical]`, and `meta[name=robots]` are all present.

- [ ] T015a [US1] Update the existing TemplateLayout render test file. First locate it by running `grep -r "TemplateLayout" apps/web/src --include="*.test.*" -l` — use whichever file is returned. Add two new test cases:
  1. **OG tags present**: Render `<TemplateLayout>` with a `currentRoute.seo` object that includes `openGraph: { title: 'Test OG Title', image: 'https://example.com/img.png' }`. Assert the rendered `document.head` (or `container`) contains `<meta property="og:title" content="Test OG Title" />`. Use `@testing-library/react` with `document.querySelector('meta[property="og:title"]')` or equivalent.
  2. **OG tags absent**: Render with a `currentRoute.seo` object that has **no** `openGraph` field. Assert that `document.querySelector('meta[property="og:title"]')` returns `null` — guarding against unconditional rendering.

  Run `pnpm --filter web test -- --testPathPattern="TemplateLayout"` and confirm both new cases pass. This satisfies Constitution §III: the critical-path component (single SEO injection point for all pages) must have integration test coverage.

---

## Phase 6: Remove Per-Page `<Seo>` Calls (US1)

**Purpose**: Eliminate duplicate tag rendering. After TemplateLayout handles SEO for all routes, any direct `<Seo>` calls in route components produce duplicate tags that confuse search engines.

**Prerequisite**: T015 (TemplateLayout consolidated) and T006 (Organization schema moved to routes-metadata.ts homepage entry) must be complete before removing Landing.tsx's Seo call.

- [ ] T016 [US1] Update `apps/web/src/routes/Landing.tsx`:
  1. Read the file to confirm the location of the `organizationSchema` variable and `<Seo>` JSX call.
  2. Remove the entire `organizationSchema` variable definition (this data was moved to `routes-metadata.ts` in T006).
  3. Remove the `import { Seo } from '@modular-house/ui';` line.
  4. Remove the `<Seo ... />` JSX element from the render output.
  5. Verify the component still renders correctly — it should now contain no SEO-related code at all.

- [ ] T017 [P] [US1] Update `apps/web/src/routes/GardenRoom.tsx`: remove the `import { Seo } from '@modular-house/ui';` line, remove any local schema variable definitions (e.g. `productSchema`), and remove the `<Seo ... />` JSX element. The component should contain no SEO-related code after this change.

- [ ] T018 [P] [US1] Update `apps/web/src/routes/HouseExtension.tsx`: remove the `import { Seo } from '@modular-house/ui';` line, remove any local schema variable definitions (e.g. `productSchema`), and remove the `<Seo ... />` JSX element. The component should contain no SEO-related code after this change.

- [ ] T019 [P] [US1] Update `apps/web/src/routes/Contact.tsx`: remove the `import { Seo } from '@modular-house/ui';` line, remove any local schema variable definitions, and remove the `<Seo ... />` JSX element. The component should contain no SEO-related code after this change.

- [ ] T020 [P] [US1] Update `apps/web/src/routes/About.tsx`: remove the `import { Seo } from '@modular-house/ui';` line, remove any local schema variable definitions, and remove the `<Seo ... />` JSX element (including any dynamic content-API title/description fallback logic — SEO is now fully static in `routes-metadata.ts`). The component should contain no SEO-related code after this change.

**Checkpoint**: Run `pnpm --filter web build`. Must succeed with zero TypeScript errors. Then run: `grep -c "<title>" dist/client/index.html` — must output `1`. Run the same check for `dist/client/garden-room/index.html` — must also output `1`. Any result greater than 1 means a duplicate `<Seo>` call was not removed.

---

## Phase 7: Delete `SEOHead` Component (US1 Cleanup)

**Purpose**: Remove the now-unused `SEOHead` component and its orphaned tests. This eliminates any future ambiguity about which SEO component to use.

**Prerequisite**: T015 and T016–T020 must be complete. Verify no remaining imports reference `SEOHead` before deleting.

- [ ] T021 [US1] Run `grep -r "SEOHead" apps/web/src/ --include="*.tsx" --include="*.ts"` and confirm the output is empty (zero matches). If any matches are found, fix them before proceeding. Then delete the file `apps/web/src/components/seo/SEOHead.tsx`. Then delete the file `apps/web/src/components/seo/__tests__/SEOHead.test.tsx`. Run `pnpm tsc --noEmit` to confirm no TypeScript errors after deletion.

---

## Phase 8: Sitemap `<lastmod>` Injection (US3)

**Purpose**: Add freshness signals to sitemap output. This phase is independent of Phases 3–7 and can be worked on in parallel after Phase 2 is complete.

**Prerequisite**: T003 (SitemapConfig extended with `lastmod?` field) must be complete.

- [x] T022 [US3] Update `apps/web/scripts/prerender.ts`: add `export const BUILD_TIMESTAMP = new Date().toISOString();` as a module-level constant at the **very top of the file** (first executable line, before any imports that might trigger `new Date()` elsewhere). This is the **single authoritative timestamp** for the entire build — it is imported by `routes-metadata.ts` (T006) and passed to `sitemap-generator.ts` (T023). Capturing it once here ensures `<lastmod>`, `article:modified_time`, `WebPage.dateModified`, and `WebPage.datePublished` are identical across every artifact. **T022 must be completed before T006**, since T006 imports this export. Do not change any other logic in `prerender.ts`.

- [ ] T023 [US3] Update `apps/web/scripts/sitemap-generator.ts`:
  1. Add an optional `buildTimestamp?: string` parameter to the `generateSitemapXml` function signature.
  2. Derive a `lastmod` value: `const lastmod = (buildTimestamp ?? new Date().toISOString()).split('T')[0];` — this produces a `YYYY-MM-DD` string.
  3. In the URL elements template string for each `<url>` block, add a `<lastmod>${lastmod}</lastmod>` line immediately after `<loc>`.
  4. Update the call site in `prerender.ts` (or wherever `generateSitemapXml` is called) to pass `BUILD_TIMESTAMP` as the argument.

- [ ] T024 [US3] Update the existing sitemap test at `apps/web/scripts/__tests__/sitemap.test.ts`: add one new assertion that the generated XML string contains `<lastmod>` and that the value matches the regex `/^\d{4}-\d{2}-\d{2}$/` (YYYY-MM-DD format). Run `pnpm --filter web test -- --testPathPattern="sitemap"` to confirm the new assertion passes.

**Checkpoint**: Run `pnpm --filter web build` and then run `grep "<lastmod>" dist/client/sitemap.xml | wc -l`. The output must equal the total number of indexable routes (expected: 7).

---

## Phase 9: Build Validation

**Purpose**: Verify all success criteria from spec.md (SC-001 through SC-007) are met. T025–T030 are local build validations. T031 is a post-deploy manual validation step and cannot be completed locally.

**Prerequisite**: All prior phases must be complete.

- [ ] T025 Run `pnpm --filter web build` from the monorepo root and confirm zero TypeScript errors and zero build failures.

- [ ] T026 [P] Validate meta tag presence on all 6 public pages by running this check for each: `grep -E "(og:title|og:image|canonical|robots|twitter:card)" dist/client/{index.html,garden-room/index.html,house-extension/index.html,gallery/index.html,about/index.html,contact/index.html}`. Each file must contain at least 5 matching lines (SC-001, SC-002, SC-003, SC-007).

- [ ] T027 [P] Validate no duplicate `<title>` tags by running `grep -c "<title>" dist/client/index.html dist/client/garden-room/index.html dist/client/house-extension/index.html dist/client/gallery/index.html dist/client/about/index.html dist/client/contact/index.html`. Every file must output `1` (SC-007).

- [ ] T028 [P] Validate sitemap `<lastmod>` by running `grep -c "<lastmod>" dist/client/sitemap.xml`. Must equal the number of indexable routes (SC-005).

- [ ] T029 [P] Validate JSON-LD schema count on the landing page by running `grep -c "application/ld+json" dist/client/index.html`. Must be at least `1` (single `@graph` block containing all schemas). Optionally pretty-print the JSON-LD to verify it contains `FAQPage`, `WebSite`, `WebPage`, `BreadcrumbList`, and `Organization` entries.

- [ ] T030 Run the full test suite: `pnpm --filter web test`. All tests must pass with zero failures — this covers: schema generator unit tests (T005), updated sitemap test (T024), new TemplateLayout OG render tests (T015a), and all pre-existing tests. Zero failures is a hard gate; do not proceed to merge if any test is red.

- [ ] T031 **Post-deploy manual validation** (SC-004, SC-006): After deploying to staging or production, verify social preview rendering and structured data validity using the tools listed in `specs/007-seo-improvement/quickstart.md §External Validation Tools`:
  1. Open LinkedIn Post Inspector and paste each public URL (`/`, `/garden-room`, `/house-extension`, `/about`, `/contact`, `/gallery`). Confirm title, description, and image preview all render correctly — not blank (SC-006).
  2. Open Google Rich Results Test and paste `/`, `/garden-room`, and `/contact`. Confirm `BreadcrumbList` and `WebPage` schemas pass with zero errors (SC-004).
  3. For the homepage only: confirm `FAQPage` schema passes the Rich Results Test (SC-004).
  This task cannot be completed in a local build — it requires a publicly accessible URL. Mark complete only after all three checks pass on a deployed URL.

---

## Dependencies & Execution Order

```
Phase 1 (Baseline Build)
    └── Phase 2 (Types + UI component extensions) — T002, T003 [parallel]
            ├── Phase 8a: T022 (export BUILD_TIMESTAMP in prerender.ts)  ← must run first
            │       ├── Phase 3 (Schema generators) — T004, T005
            │       │       └── Phase 4 (Route metadata) — T006-T014   ← imports BUILD_TIMESTAMP
            │       │               ├── Phase 5 (TemplateLayout consolidation) — T015, T015a
            │       │               │       └── Phase 6 (Remove per-page Seo calls) — T016-T020
            │       │               │               └── Phase 7 (Delete SEOHead) — T021
            │       │               └── [US1 done after Phase 7]
            │       └── Phase 8b: T023, T024 (sitemap generator + test) [parallel with Phases 3-7]

Phase 9 (Validation) — depends on all prior phases
```

### Parallel Opportunities

- **T002 and T003** (Phase 2): Both modify different files — can run simultaneously.
- **T008–T014** (Phase 4): Each updates a different route entry in `routes-metadata.ts` — these are best done sequentially in one file, but the data for each route can be researched and drafted in parallel.
- **T017–T020** (Phase 6): Each modifies a different route component file — can run simultaneously.
- **T022** must run **before T006** — T006 imports `BUILD_TIMESTAMP` from `prerender.ts`, so `prerender.ts` must export it first. T022 is otherwise independent of T002/T003 and can start as soon as Phase 1 is done.
- **T023 and T024** (sitemap generator + test): Fully parallelizable with Phases 3–7 once T022 is complete.
- **T026–T029** (Phase 9): All validation checks read from `dist/` — run simultaneously after T025 build completes.

---

## Implementation Strategy

### MVP Scope (User Story 1 Only)

1. Complete Phase 1 (baseline build)
2. Complete Phase 2 (T002, T003 — types)
3. Complete Phase 4 meta only: update each route with `canonicalUrl`, `openGraph`, `twitter` (skip schema generators — US2)
4. Complete Phase 5 (T015 — TemplateLayout swap)
5. Complete Phase 6 (T016–T020 — remove duplicates)
6. Complete Phase 7 (T021 — delete SEOHead)
7. **VALIDATE**: All 6 public pages have `og:title`, `canonical`, `robots`, `twitter:card` in static HTML
8. Deploy — every page now has full social/search meta coverage

### Full Delivery (All Three User Stories)

1. Complete MVP above (US1)
2. Add schema generators and route schema data (US2 — T004, T005, then update schema arrays in T006–T012)
3. Add sitemap lastmod (US3 — T022, T023, T024)
4. Run local validation (T025–T030)
5. Deploy to staging and run post-deploy validation (T031 — LinkedIn Post Inspector + Rich Results Test)

---

## Notes

- Use `<placeholder>` text like `'<existing description>'` in task descriptions — always read the actual current value from the file before writing it back, don't overwrite existing title/description values. Copy the exact string from `currentRoute.seo.description` for `openGraph.description`; do not leave placeholder text in the output file.
- **T022 before T006**: `BUILD_TIMESTAMP` is declared in `prerender.ts` and imported by `routes-metadata.ts`. Do not add a second `new Date()` call in `routes-metadata.ts` — this would create two divergent timestamps across the build artifacts.
- After T006, confirm the `organizationSchema` data that was in `Landing.tsx` is fully replicated in `routes-metadata.ts` before T016 deletes it from the component — losing this schema would be a regression.
- The `StructuredData` component in `TemplateLayout.tsx` (if present) must be checked to confirm it is not actively emitting JSON-LD that would duplicate the `jsonLd` prop passed to the new `Seo` component. If it does emit JSON-LD, remove or guard it in T015 to prevent duplicate `<script type="application/ld+json">` blocks.
- `og:locale` with value `en_IE` and `article:modified_time` should both be emitted by the `Seo` component after T002 — verify both appear in rendered output.
- Legal pages (`/privacy`, `/terms`) intentionally receive no social/schema enrichment — this is by design per the spec.
- T031 is the only task that requires a deployed URL — it cannot be validated locally and should be the final sign-off before closing the PR.
