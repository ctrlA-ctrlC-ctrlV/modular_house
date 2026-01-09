# Tasks: SEO Maximization

**Spec**: [specs/005-seo-maximization/spec.md](specs/005-seo-maximization/spec.md)
**Plan**: [specs/005-seo-maximization/plan.md](specs/005-seo-maximization/plan.md)
**Branch**: `005-seo-maximization`

## Phase 1: Setup & Configuration
*Goal: Prepare the environment for Static Site Generation and SEO management.*

- [x] T001 Install `react-helmet-async` dependency in `apps/web/package.json`
- [x] T002 Update `apps/web/vite.config.ts` to enable SSR build mode (implementing `ssrLoadModule` strategy)
- [x] T003 Create `apps/web/src/types/seo.ts` defining `AppRoute`, `SEOConfig`, and `SchemaDef` interfaces per Data Model
- [x] T004 Create `apps/web/src/route-config.tsx` with initial route definitions for all public pages (Home, Gallery, About, Contact, Services)

## Phase 2: Foundational Architecture
*Goal: Centralize routing logic to support both Client-side App and Server-side Prerendering.*

- [x] T005 Refactor `apps/web/src/App.tsx` to generate `Routes` dynamically from `route-config.tsx`
- [x] T006 [P] Update `apps/web/src/main.tsx` to wrap the application with `HelmetProvider`
- [x] T007 Create `apps/web/src/entry-server.tsx` exporting a render function string using `ReactDOMServer.renderToString` and `StaticRouter`

## Phase 3: User Story 4 - Instant Page Loading (SSG)
*Goal: Implement the build pipeline to generate static HTML for all routes.*
*Story: [US4] Instant Page Loading*

- [x] T008 [US4] Create `apps/web/scripts/prerender.ts` script to load the server bundle and generate HTML files
- [x] T009 [US4] Update `apps/web/package.json` with `build:server` and `prerender` scripts
- [x] T010 [US4] Modify `apps/web/index.html` to add a placeholder `<!--app-html-->` and `<!--head-meta-->` for injection
- [x] T011 [US4] Create a test script `apps/web/scripts/verify-build.ts` to verify `dist/index.html` (and other routes) contains rendered content

## Phase 4: User Story 1 - Crawling & Indexing
*Goal: Ensure search engines can discover and index the content correctly.*
*Story: [US1] Search Engine Crawling & Indexing*

- [x] T012 [P] [US1] Create `apps/web/src/components/seo/SEOHead.tsx` component to render `<Helmet>` tags from `SEOConfig`
- [x] T013 [P] [US1] Integrate `SEOHead` into `apps/web/src/components/TemplateLayout.tsx` (or App root) to read metadata from the current route match
- [x] T014 [P] [US1] Create `apps/web/scripts/sitemap-generator.ts` to generate `sitemap.xml` from `route-config.tsx`
- [x] T015 [US1] Update `apps/web/scripts/prerender.ts` to execute sitemap generation after HTML generation
- [x] T016 [US1] Create `apps/web/public/robots.txt` allowing indexing and pointing to sitemap
- [x] T017 [US1] Create unit tests for `SEOHead` component in `apps/web/src/components/seo/__tests__/SEOHead.test.tsx`
- [x] T018 [US1] Create unit tests for sitemap generation logic in `apps/web/scripts/__tests__/sitemap.test.ts`

## Phase 5: User Story 2 - Rich Search Results
*Goal: Add structured data to pages to enable rich snippets in search results.*
*Story: [US2] Rich Search Results*

- [x] T019 [P] [US2] Create `apps/web/src/components/seo/StructuredData.tsx` to render JSON-LD via `react-helmet-async`
- [x] T020 [US2] Implement `Product` schema in `route-config.tsx` for `/garden-room` and `/house-extension`
- [x] T021 [P] [US2] Implement `LocalBusiness` schema in `route-config.tsx` for `/contact`
- [x] T022 [P] [US2] Implement `Organization` schema in `route-config.tsx` for `/` (Landing)
- [x] T023 [US2] Integrate `StructuredData` component into `TemplateLayout` to render schema based on current route
- [x] T024 [US2] Create unit tests for `StructuredData` component in `apps/web/src/components/seo/__tests__/StructuredData.test.tsx`

## Phase 6: User Story 3 - Accessible Navigation
*Goal: Ensure all internal links are crawlable by bots.*
*Story: [US3] Accessible Navigation for Bots*

- [x] T025 [P] [US3] Scan and replace generic `onClick` navigation with `<Link>` in `apps/web/src/components/Header.tsx`
- [x] T026 [P] [US3] Refactor `packages/ui/src/components/HeroBoldBottomText/HeroBoldBottomText.tsx` to support `Link` and remove imperative `onClick`
- [x] T027 [P] [US3] Refactor `packages/ui/src/components/HeroWithSideText/HeroWithSideText.tsx` to support `Link` and remove imperative `onClick`
- [x] T028 [P] [US3] Refactor `packages/ui/src/components/TwoColumnSplitLayout/TwoColumnSplitLayout.tsx` to support `Link` and remove imperative `onClick`
- [x] T029 [P] [US3] Update `apps/web/src/routes/Landing.tsx` to use declarative props for Hero navigation and remove `useNavigate`
- [x] T030 [P] [US3] Update `apps/web/src/routes/GardenRoom.tsx` to use declarative props for Hero navigation and remove `useNavigate`
- [x] T031 [P] [US3] Update `apps/web/src/routes/HouseExtension.tsx` to use declarative props for Hero navigation and remove `useNavigate`
- [x] T032 [US3] Audit and update `alt` attributes in `Gallery` and `Hero` components (FR-006)
- [x] T033 [P] [US3] Verify that Footer links are semantic `<a>` tags in `apps/web/src/components/Footer.tsx`
- [x] T034 [US3] Create `./.docs/link_guideline.md` to guide on how shoudl future component be created, using modern component based development principle

## Phase 7: Polish & Validation
*Goal: Verify compliance with all success criteria.*

- [ ] T035 Run local build and validation: Check `dist/` for all HTML files
- [ ] T036 Validation: Verify `dist/sitemap.xml` contains all routes
- [ ] T037 Install Lighthouse CI v1.13 and add as a dev dependency
- [ ] T038 Add Lighthouse CI to the current CI pipeline SSG implementation meets the FCP target: Performance > 90, Accessibility 100, Best Practices 100, SEO 100
- [ ] T039 Validation: Inspect `dist/garden-room/index.html` for existance of JSON-LD scripts

## Dependencies
- Phase 2 depends on Phase 1
- Phase 3 depends on Phase 2 (needs entry-server)
- Phase 4 depends on Phase 2 (needs route-config) and Phase 3 (needs prerender script to hook into)
- Phase 5 depends on Phase 4 (builds on SEO components)

## Implementation Strategy
We will first establish the "Hybrid" architecture (T001-T007) without breaking the current Dev mode. Then we enable the efficient SSG build for production (T008-T011). Once the pipeline works, we populate it with the rich SEO content (Phase 4 & 5).

## Parallel Execution
- T012, T013, T014 (SEO Head & Sitemap components) can be built in parallel with T008 (SSG Script).
- T019, T020, T021 (Structured Data) can be built in parallel.
- Phase 6 (Navigation Audit) creates almost no conflicts and can be done anytime after Phase 1.
