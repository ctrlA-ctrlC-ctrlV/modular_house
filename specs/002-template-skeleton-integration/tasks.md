# Tasks: Template–Skeleton Integration

**Input**: Design documents from `/specs/002-template-skeleton-integration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Spec requests independent tests per story. Include targeted tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 0: Template Documentation (Review & Mapping)

**Purpose**: Create documentation by reviewing `.template/rebar` and `.template/rebar-child` to inform integration without code changes

 - [X] T000 Document template components used: `specs/002-template-skeleton-integration/research.md` (list components from `.template/rebar` and `rebar-child`)
    - Output Structure: Component List Format
    - Checklist:
        - [ ] Source Paths Scanned: `.template/rebar`, `.template/rebar-child` (or equivalent)
        - [ ] Extraction Method Noted (manual, script, tree listing)
        - [ ] For each component record:
            - Name (PascalCase or file stem)
            - Path (relative from repo root)
            - Category (layout | structural | interactive | data | styling-hook)
            - Parent/Child Role (root, leaf, composite)
            - Dependencies (internal components, external libs)
            - Props / Interface Summary (key props only)
            - Reusability Flag (portable | context-bound)
            - Style Coupling (inline | module | global | none)
            - Side Effects (fetch, storage, event bus)
            - Portability Notes (constraints, required wrappers)
        - [ ] Mark deprecated or placeholder components
        - [ ] Record naming anomalies (inconsistent casing or suffixes)
        - [ ] Summarize count by category
        - [ ] List high-complexity components (heuristic: > X LOC or > Y props)
        - [ ] Identify required bootstrapping components (must mount early)

Recommended Table Columns:
| Component | Path | Category | Role | Dependencies | Key Props | Reusable? | Style Coupling | Side Effects | Portability Notes |

 - [X] T001 Document source list of utilities/containers/typography/focus: `specs/002-template-skeleton-integration/research.md`
    - Output Structure: Utility Catalog Schema
    - Checklist:
        - [ ] Define taxonomy upfront:
            - Utilities (pure functions)
            - Containers (stateful wrappers/providers)
            - Typography (tokens, mixins, components)
            - Focus / Accessibility helpers
        - [ ] For each entry capture:
            - Identifier / Name
            - Type (util | container | token | mixin | component | a11y)
            - Path
            - Purpose (1–2 line summary)
            - Input/Output (signature or shape)
            - External Dependencies
            - Side Effects (DOM, network, storage)
            - Tree-shakable? (yes/no)
            - Environment Constraints (browser-only, Node-compatible)
            - Portability Risk (low/medium/high)
        - [ ] List shared constants / design tokens referenced
        - [ ] Identify duplicate logic / consolidation candidates
        - [ ] Note coupling to framework features (React context, hooks)
        - [ ] Flag any global namespace usage
        - [ ] Provide aggregate summary (counts per type + risk profile)

Recommended Table Columns:
| Name | Type | Path | Purpose | Signature / IO | Dependencies | Side Effects | Tree-shakable | Env Constraints | Portability Risk |

 - [X] T002 Map important files per page (9 key pages): `specs/002-template-skeleton-integration/research.md`
    - Output Structure: Per-Page Mapping Template
    - Checklist (repeat for each page):
        - [ ] Page Identifier (Route, Slug, or Name)
        - [ ] Primary Entry File (e.g., `pages/...` or `src/routes/...`)
        - [ ] Layout Chain (root layout → nested layout → leaf)
        - [ ] Core Components (ordered by render depth)
        - [ ] Data Sources (API endpoints, local JSON, CMS)
        - [ ] State Providers (context, stores, query clients)
        - [ ] Critical Styles (global files, page-specific modules)
        - [ ] Scripts / Lifecycle Hooks (mount effects, listeners)
        - [ ] Performance Notes (SSR, hydration cost, suspense, memoization)
        - [ ] Accessibility Considerations (landmarks, focus traps)
        - [ ] Portability Constraints (framework features, routing dependency, build-time assumptions)
        - [ ] Cross-cutting Concerns (auth, i18n, analytics)
        - [ ] Error / Empty States Files
        - [ ] Testing Artifacts (associated spec/test files)
        - [ ] Known Refactors Needed
Recommended Section Template:

### Page: <Name / Route>
| Aspect                  | Detail                                             |
| ----------------------- | -------------------------------------------------- |
| Entry File              | `...`                                              |
| Layout Chain            | `RootLayout > AppShell > DashboardLayout`          |
| Core Components         | `Header, Sidebar, MetricCard, Footer`              |
| Data Sources            | `GET /api/metrics`, local `metrics.config.json`    |
| State Providers         | `MetricsContext`, `QueryClientProvider`            |
| Critical Styles         | `layout.css`, `dashboard.module.css`               |
| Scripts / Effects       | `useInterval`, `resize listener`                   |
| Performance Notes       | `Memoized MetricCard`, `lazy load charts`          |
| Accessibility           | `aria-live region for updates`                     |
| Portability Constraints | `Requires React Router v6`, `Assumes client fetch` |
| Cross-cutting           | `AuthGuard`, `AnalyticsWrapper`                    |
| Error / Empty States    | `MetricErrorBoundary`, `EmptyMetrics.tsx`          |
| Tests                   | `__tests__/dashboard.spec.tsx`                     |
| Refactor Targets        | `Consolidate duplicate fetch logic`                |
At end:
- [ ] Aggregate matrix (pages × key component reuse)
- [ ] Identify shared layout components
- [ ] Highlight pages with highest portability friction


 - [X] T003 [P] Summarize portability constraints and exclusions: `specs/002-template-skeleton-integration/research.md`
    - Output Structure: Constraint Summary Format
    - Checklist:
        - [ ] Enumerate Categories:
            - Build / Tooling (bundler, tsconfig, polyfills)
            - Framework Version Locks
            - Environment (browser APIs, Node modules)
            - Styling System Dependencies (CSS Modules, PostCSS, Tailwind config)
            - State Management Ties (Context shape, store libs)
            - Routing Assumptions (dynamic segments, SSR expectations)
            - File/Directory Conventions (required folder names)
            - Naming / Path Coupling (imports using absolute aliases)
            - External Service Dependencies (auth, analytics, CMS endpoints)
            - Performance Features (suspense, streaming, edge-only logic)
            - Security / Access (token handling, secret injection)
        - [ ] For each constraint:
            - Label
            - Description
            - Severity (blocker | partial | negligible)
            - Mitigation / Adaptation Strategy
            - Exclusion Decision (include / exclude from portability attempt)
        - [ ] Explicit Exclusions List (not to be ported now)
        - [ ] Dependency Graph Hotspots (modules causing cascading constraints)
        - [ ] Quick Wins (low-effort high-value portability candidates)
        - [ ] Risk Register (top 3 risks + mitigation owners)
        - [ ] Actionable Next Steps (ranked)

Recommended Table Columns:
| Constraint | Description | Severity | Mitigation | Exclude? |
| ---------- | ----------- | -------- | ---------- | -------- |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare folders, base styles, and asset locations without changing behavior

- [X] T004 [P] Create assets folder `apps/web/public/template/`
- [X] T005 [P] Create styles file `apps/web/src/styles/tokens.css`
- [X] T006 [P] Create styles file `apps/web/src/styles/template.css`
- [X] T007 Update global imports in `apps/web/src/main.tsx` to import `./styles/template.css` before `./index.css`
- [X] T008 [P] Copy required images/fonts from `.template/rebar/` to `apps/web/public/template/`
- [X] T009 Document token sources and usage in `specs/002-template-skeleton-integration/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Introduce a reversible, scoped layout wrapper and resolve base CSS precedence

- [X] T010 [P] Create `apps/web/src/components/TemplateLayout.tsx` with `.theme-rebar` wrapper and regions (header/main/footer)
- [X] T011 [P] Ensure main region has `id="main-content"` and `tabIndex={-1}` in `TemplateLayout.tsx`
- [X] T012 Replace `PublicLayout` usage with `TemplateLayout` in `apps/web/src/App.tsx` (keep old layout for rollback)
- [X] T013 Verify CSS import order: `template.css` before `index.css` in `apps/web/src/main.tsx`
- [X] T014 [P] Add minimal template utility class mappings to `apps/web/src/styles/template.css` (container, typography, focus)
- [X] T015 Create/confirm `apps/web/src/styles/README.md` describing import order and rollback steps

**Checkpoint**: Foundation ready — user story phases can start; rollback path confirmed

---

## Phase 3: User Story 1 - Template-driven Pages Available (Priority: P1) 🎯 MVP

**Goal**: Public routes render with template header, footer, container and base styles without breaking behavior

**Independent Test**: Switch to `TemplateLayout` and confirm all public pages render and navigate; verify visible focus indicators on nav and form controls

### Tests for User Story 1

- [X] T016 [P] [US1] Add render tests for template layout across routes in `apps/web/src/test/routes/template-layout.test.tsx`
- [X] T017 [P] [US1] Add focus-indicator test for nav/links in `apps/web/src/test/routes/focus-indicators.test.tsx`

### Implementation for User Story 1

- [X] T018 [US1] Wire `TemplateLayout` into public routes in `apps/web/src/App.tsx` (header/footer placeholders acceptable)
- [X] T019 [P] [US1] Apply template container utility (e.g., l-container) to top-level wrappers in `apps/web/src/routes/Landing.tsx`
- [X] T020 [P] [US1] Apply template container utility to `apps/web/src/routes/About.tsx`
- [X] T021 [P] [US1] Apply template container utility to `apps/web/src/routes/Gallery.tsx`
- [X] T022 [P] [US1] Apply template container utility to `apps/web/src/routes/Contact.tsx`
- [X] T023 [P] [US1] Apply template container utility to `apps/web/src/routes/Privacy.tsx`
- [X] T024 [P] [US1] Apply template container utility to `apps/web/src/routes/Terms.tsx`
- [X] T025 [P] [US1] Apply template container utility to `apps/web/src/routes/not-found.tsx`
- [X] T026 [P] [US1] Apply template container utility to `apps/web/src/routes/GardenRoom.tsx` (new page)
- [X] T027 [P] [US1] Apply template container utility to `apps/web/src/routes/HouseExtension.tsx` (new page)
- [X] T028 [US1] Confirm dev run and test pass criteria for 6+ routes documented in `specs/002-template-skeleton-integration/quickstart.md`

**Checkpoint**: US1 independently testable — routes render with template base layout and focus styles

---

## Phase 4: User Story 2 - Components Aligned to Template (Priority: P2)

**Goal**: Shared and page components adopt template naming (`c-`, `l-`, `u-`) and structure

**Independent Test**: Update at least two components to use template classes; verify visual/functional consistency

### Tests for User Story 2

- [X] T029 [P] [US2] Component class application tests in `apps/web/src/test/components/template-classes.test.tsx` (Header, GalleryGrid)

### Implementation for User Story 2

- [X] T030 [P] [US2] Update header to template classes in `apps/web/src/components/Header.tsx` (nav, brand, menu)
- [X] T031 [P] [US2] Update gallery grid to template classes in `apps/web/src/components/GalleryGrid.tsx`
- [X] T032 [P] [US2] Apply `c-` and `u-` classes to hero/sections in `apps/web/src/routes/Landing.tsx`
- [X] T033 [P] [US2] Apply `c-` and `u-` classes to `apps/web/src/routes/About.tsx`
 - [X] T034 [US2] Document adopted class naming and narrative examples in `specs/002-template-skeleton-integration/quickstart.md`
 - [X] T035 [P] [US2] Create comprehensive class reference guide in `specs/002-template-skeleton-integration/quickstart.md` (list `c-`, `l-`, `u-` utilities with usage examples)

**Checkpoint**: US2 independently testable — at least two components consistently styled via template classes

---

## Phase 5: User Story 3 - Accessibility Preserved (Priority: P3)

**Goal**: Preserve and validate accessibility features: focus management, skip links, labels/alt, keyboard navigation

**Independent Test**: Invalid form submissions announce errors via `aria-describedby`; lightbox/modal traps focus and restores on close

### Tests for User Story 3

- [ ] T036 [P] [US3] Add accessibility tests for form errors `apps/web/src/test/accessibility/form-errors.test.tsx`
- [ ] T037 [P] [US3] Add accessibility tests for lightbox focus trap `apps/web/src/test/accessibility/lightbox-focus.test.tsx`

### Implementation for User Story 3

- [ ] T038 [P] [US3] Ensure skip link and focus target in `apps/web/src/components/TemplateLayout.tsx` (link to `#main-content`)
- [ ] T039 [P] [US3] Update contact form error rendering with `aria-describedby` in `apps/web/src/routes/Contact.tsx`
- [ ] T040 [P] [US3] Ensure all images in gallery have `alt` text in `apps/web/src/components/GalleryGrid.tsx`
- [ ] T041 [US3] Add/verify focus trap and restore in `apps/web/src/components/Lightbox.tsx`
- [ ] T042 [US3] Implement Lightbox open/close + keyboard in Lightbox.tsx
- [ ] T043 [P] [US3] Wire GalleryGrid to Lightbox with accessible triggers in GalleryGrid.tsx
- [ ] T044 [P] Audit CSS bundle and prune legacy selectors in apps/web/src/styles/template.css

**Checkpoint**: US3 independently testable — accessibility behaviors validated

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, performance, and reversibility hardening

- [ ] T045 [P] Update tokens mapping and usage examples in `specs/002-template-skeleton-integration/quickstart.md`
- [ ] T046 [P] Verify CSS load order and remove unused globals from `apps/web/src/index.css`
- [ ] T047 [P] Defer non-critical assets (fonts/images) in `apps/web/src/styles/template.css` (e.g., `font-display: swap`)
- [ ] T048 Validate rollback path by toggling `TemplateLayout` back to `PublicLayout` in `apps/web/src/App.tsx`
- [ ] T049 Execute actual rollback and verify app functions (swap `TemplateLayout` → `PublicLayout` and run tests) in `apps/web/src/App.tsx`
- [ ] T050 Run local verification per quickstart (dev + tests) and record results in `specs/002-template-skeleton-integration/research.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies — can start immediately
- Foundational (Phase 2): Depends on Setup completion — BLOCKS all user stories
- User Stories (Phase 3+): Depend on Foundational completion; proceed in priority order or in parallel
- Polish (Final Phase): Depends on targeted user stories being complete

### User Story Dependencies

- User Story 1 (P1): Starts after Foundational — independent
- User Story 2 (P2): Starts after Foundational — independent of US1 functionality, may reuse updated layout
- User Story 3 (P3): Starts after Foundational — independent of US1/US2, validates accessibility

### Within Each User Story

- Tests are written first and should fail initially
- Apply utilities/layout wrappers before component refinements
- Keep changes reversible; avoid modifying admin routes

### Parallel Opportunities

- [P] tasks across different files can proceed concurrently (e.g., tokens.css, template.css, asset copy)
- After Foundational, US1/US2/US3 can be staffed in parallel
- Within a story, tests marked [P] can be authored concurrently

---

## Parallel Example: User Story 1

```text
Parallel tests:
- T013 Add render tests in apps/web/src/test/routes/template-layout.test.tsx
- T014 Add focus-indicator tests in apps/web/src/test/routes/focus-indicators.test.tsx

Parallel implementation updates:
- T016 Apply container utility to routes/Landing.tsx
- T017 Apply container utility to routes/About.tsx
- T018 Apply container utility to routes/Gallery.tsx
- T019 Apply container utility to routes/Contact.tsx
- T020 Apply container utility to routes/Privacy.tsx
- T021 Apply container utility to routes/Terms.tsx
- T022 Apply container utility to routes/not-found.tsx
```

---

## Parallel Example: User Story 2

```text
Parallel tests:
- T029 Component class tests in apps/web/src/test/components/template-classes.test.tsx

Parallel implementation updates:
- T030 Update template classes in components/Header.tsx
- T031 Update template classes in components/GalleryGrid.tsx
- T032 Apply `c-` and `u-` classes in routes/Landing.tsx
- T033 Apply `c-` and `u-` classes in routes/About.tsx
```

---

## Parallel Example: User Story 3

```text
Parallel tests:
- T036 Add form error a11y tests in apps/web/src/test/accessibility/form-errors.test.tsx
- T037 Add lightbox focus trap tests in apps/web/src/test/accessibility/lightbox-focus.test.tsx

Parallel implementation updates:
- T038 Ensure skip link and focus target in components/TemplateLayout.tsx
- T039 Add aria-describedby wiring in routes/Contact.tsx
- T040 Ensure alt text in components/GalleryGrid.tsx
- T041 Add focus trap+restore in components/Lightbox.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks all stories)
3. Complete Phase 3: User Story 1
4. STOP and VALIDATE: Run tests and manual checks on listed routes

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Demo
3. Add US2 → Test independently → Demo
4. Add US3 → Test independently → Demo

Notes:
- All tasks follow format `- [ ] T### [P]? [US?] Description with exact file path`
- Tests included because spec explicitly requests independent tests per story
- Admin is out of scope; do not modify files under `apps/web/src/routes/admin/`
