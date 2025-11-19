---

description: "Implementation tasks for Web App Skeleton (Modular House MVP)"
---

# Tasks: Web App Skeleton (Modular House MVP)

- Input: Design documents from `specs/001-web-app-skeleton/`
- Prerequisites: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`
- Tests: Not explicitly requested; acceptance criteria provided per story. We omit test tasks unless requested.
- Organization: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- [P]: Can run in parallel (different files, no dependencies)
- [Story]: The user story this task belongs to (US1, US2, US3)
- Each task includes exact file paths

## Phase 1: Setup (Shared Infrastructure)

Purpose: Project initialization and base structure per plan.

- [X] T001 Create monorepo scaffolding in repository root: `pnpm-workspace.yaml`, `package.json`, `.editorconfig`, `.gitignore`, `.env.example`
- [X] T002 [P] Create directory skeleton: `/apps/web`, `/apps/api`, `/packages/ui`, `/packages/config`, `/infra/nginx`, `/infra/scripts`
- [X] T003 Initialize Vite React TS app in `apps/web` with minimal placeholder CSS and pages wiring (`index.html`, `vite.config.ts`, `tsconfig.json`)
- [X] T004 [P] Initialize Express TS app in `apps/api` (`tsconfig.json`, `src/server.ts`, `src/app.ts`)
- [X] T005 [P] Create shared config package `packages/config` (tsconfig base, eslint, prettier) and reference from apps
- [X] T006 Add local dev services in `infra/docker-compose.yml` (Postgres 18, MailHog) and `infra/scripts/`

---

## Phase 2: Foundational (Blocking Prerequisites)

Purpose: Core infrastructure that MUST be complete before any user story.

- [X] T007 Implement API middleware baseline in `apps/api/src/app.ts` (helmet, cors from env, compression, json body limit)
- [X] T008 [P] Add structured logging (`pino`, `pino-http`) and request id in `apps/api/src/middleware/logger.ts` and wire in `app.ts`
- [X] T009 [P] Implement centralized error handler in `apps/api/src/middleware/error.ts` returning JSON errors
- [X] T010 [P] Add health route `GET /health` in `apps/api/src/routes/health.ts` and register in `app.ts`
- [X] T011 Configure env loader in `apps/api/src/config/env.ts` (PORT, CORS_ORIGIN, DATABASE_URL, MAIL_*)
- [X] T012 [P] Set up Prisma in `apps/api/prisma/schema.prisma` reflecting `data-model.md` entities; add `prisma` dev dependencies
- [X] T013 Generate initial migration and Prisma client in `apps/api` (scripts in `package.json`)
- [X] T014 [P] Create mailer service in `apps/api/src/services/mailer.ts` (SMTP config, one retry on 5xx, outcome logging)
- [X] T015 [P] Add rate limiter for `/submissions/*` in `apps/api/src/middleware/rateLimit.ts` (10 requests/hour/IP)
- [X] T016 [P] Add Zod validation wrapper in `apps/api/src/middleware/validate.ts`
- [X] T017 Sync OpenAPI contract to repo at `apps/api/openapi.yaml` (copy from `specs/001-web-app-skeleton/contracts/openapi.yaml`) and add `npm` script to serve it
- [X] T018 Scaffold frontend routes and layout in `apps/web/src/app.tsx` and `apps/web/src/routes/` (Landing, Products placeholder, Gallery, About, Contact, Privacy, Terms, 404)
- [ ] T019 [P] Implement Header/Footer with nav highlight and phone CTA in `apps/web/src/components/Header.tsx` and `apps/web/src/components/Footer.tsx`
- [ ] T020 [P] Add accessible focus styles in `apps/web/src/styles/focus.css` and import in `apps/web/src/main.tsx`
- [ ] T021 [P] Implement API client wrapper in `apps/web/src/lib/apiClient.ts` using `VITE_API_BASE_URL`

- [ ] T022 [P] Test tooling: setup Vitest in `apps/api` and `apps/web`; Supertest in `apps/api`; enforce coverage thresholds (overall ≥70%, critical modules 100% branch)
- [ ] T023 [P] CI: add root scripts to run tests and enforce coverage in `package.json` and CI workflow

Checkpoint: Foundation ready—user stories can proceed in parallel.

---

## Phase 3: User Story 1 – Visitor submits enquiry/quote successfully (Priority: P1) 🎯 MVP

Goal: Unified enquiry/quote form validates, stores submission with consent, sends internal email, optional customer confirmation, shows success message.

Independent Test: Fill form with valid data → see success message; internal email arrives; record persisted with consent flag and snapshot; honeypot rejected silently; email retry logged on transient failure.

### Implementation

- [ ] T024 [P] [US1] Define enquiry Zod schema in `apps/api/src/types/submission.ts` (fields per spec; consent true)
- [ ] T025 [P] [US1] Implement POST `/submissions/enquiry` in `apps/api/src/routes/submissions.ts` with validate + rate limiter + honeypot check
- [ ] T026 [US1] Implement `SubmissionsService` in `apps/api/src/services/submissions.ts` (store payload, consent flag/text, ipHash, userAgent, emailLog)
- [ ] T027 [US1] Integrate internal email send + optional customer confirmation in `apps/api/src/services/submissions.ts` using `mailer.ts`
- [ ] T028 [P] [US1] Build `EnquiryForm` with `react-hook-form` + `zod` in `apps/web/src/forms/EnquiryForm.tsx` (accessible inline errors; hidden honeypot)
- [ ] T029 [US1] Render form on Contact page with success/error UI in `apps/web/src/routes/contact.tsx`
- [ ] T030 [US1] Add CTA links to Contact route from header and key pages in `apps/web/src/components/Header.tsx` and `apps/web/src/routes/landing.tsx`
- [ ] T031 [US1] Persist email outcomes to `Submission.emailLog` and return `{ ok:true, id }` responses consistently

- [ ] T034 [P] [US1] Contract tests for `POST /submissions/enquiry` (valid, required field errors, honeypot, rate-limit 429) in `apps/api/tests/contract/submissions.enquiry.spec.ts`
- [ ] T035 [US1] Integration test: submission persists record + internal email send; transient failure logs outcome in `apps/api/tests/integration/submissions.spec.ts`
- [ ] T036 [P] [US1] Add `CUSTOMER_CONFIRM_ENABLED=true` to `apps/api/.env.example` and read flag in `apps/api/src/config/env.ts`
- [ ] T037 [US1] Gate customer confirmation email in `SubmissionsService` by config flag; document behavior in quickstart

Checkpoint: US1 independent demo ready (MVP).

---

## Phase 4: User Story 2 – Editor updates page & gallery content (Priority: P2)

Goal: Admin can sign in, edit page hero and image, add gallery item with category and alt text, export submissions to CSV; unauthenticated access redirected to login.

Independent Test: Perform content changes via admin → refresh public pages to see updates; export CSV lists submissions with required fields.

### Implementation

- [ ] T038 [P] [US2] Implement admin auth in `apps/api/src/routes/admin/auth.ts` and `apps/api/src/services/auth.ts` (email+password, Argon2id, JWT)
- [ ] T039 [US2] Add JWT auth middleware in `apps/api/src/middleware/auth.ts` and protect `/admin/*` routes
- [ ] T040 [P] [US2] Implement Pages CRUD in `apps/api/src/routes/admin/pages.ts` and `apps/api/src/services/content/pages.ts` (slug unique, SEO fields, last modified)
- [ ] T041 [P] [US2] Implement Gallery CRUD in `apps/api/src/routes/admin/gallery.ts` and `apps/api/src/services/content/gallery.ts` (category enum, alt text required for publish)
- [ ] T042 [P] [US2] Implement FAQ CRUD in `apps/api/src/routes/admin/faqs.ts` and `apps/api/src/services/content/faqs.ts`
- [ ] T043 [US2] Implement submissions list and CSV export in `apps/api/src/routes/admin/submissions.ts` and `apps/api/src/services/submissionsExport.ts`
- [ ] T044 [P] [US2] Build minimal admin UI routes in `apps/web/src/routes/admin/login.tsx` and `apps/web/src/routes/admin/index.tsx`
- [ ] T045 [US2] Wire public pages to content endpoints: `apps/web/src/lib/contentClient.ts` and fetch in routes (hero title/image updates visible)
- [ ] T046 [US2] Redirect unauthenticated admin routes to login in `apps/web/src/routes/admin/guard.tsx`

- [ ] T047 [P] [US2] Security tests: `/admin/*` requires JWT; invalid/expired tokens return 401/403 in `apps/api/tests/integration/admin.auth.spec.ts`
- [ ] T048 [US2] Integration tests: Pages/Gallery/FAQ CRUD and CSV export shape in `apps/api/tests/integration/admin.content.spec.ts`
- [ ] T049 [P] [US2] Implement Redirects CRUD in `apps/api/src/routes/admin/redirects.ts` and `apps/api/src/services/content/redirects.ts` (validate URL, prevent loops)
- [ ] T050 [P] [US2] Admin UI: Redirects management page in `apps/web/src/routes/admin/redirects.tsx` (list/create/edit/toggle active)
- [ ] T051 [P] [US2] Add `POST /admin/uploads/image` (multipart) in `apps/api/src/routes/admin/uploads.ts` (max 500KB, mime-type check, returns URL)
- [ ] T052 [US2] Admin UI: image upload component w/ client-side size check; integrate in Gallery create/update with accessible errors

Checkpoint: US2 independent demo ready; content edits reflected on public pages; CSV export verified.

---

## Phase 5: User Story 3 – Visitor browses accessible product & gallery pages (Priority: P3)

Goal: Accessible navigation and gallery browsing with filter and lightbox; focus states, alt text, and keyboard interactions work.

Independent Test: Verify keyboard traversal through header; filter gallery by category; open lightbox, use prev/next buttons; Escape/X closes and focus returns; branded 404 for unknown routes.

### Implementation

- [ ] T053 [P] [US3] Implement gallery filter page in `apps/web/src/routes/gallery.tsx` (category param, loads from `/content/gallery`)
- [ ] T054 [P] [US3] Implement lightbox with Radix Dialog in `apps/web/src/components/Lightbox.tsx` (prev/next controls, aria labels)
- [ ] T055 [US3] Ensure focus management returns to thumbnail on close in `apps/web/src/components/Lightbox.tsx`
- [ ] T056 [US3] Lazy-load gallery images with placeholders in `apps/web/src/components/GalleryGrid.tsx`
- [ ] T057 [P] [US3] Ensure keyboard focus states + aria-current in `apps/web/src/components/Header.tsx` and CSS
- [ ] T058 [US3] Implement branded 404 page at `apps/web/src/routes/not-found.tsx` and route fallback

Checkpoint: US3 independent demo ready.

---

## Final Phase: Polish & Cross-Cutting Concerns

Purpose: Repo-wide improvements and non-blocking features.

- [ ] T059 [P] Documentation: write markup guide in `docs/markup-guide.md` (components, class naming) (FR-026)
- [ ] T060 SEO/robots: implement dynamic `GET /sitemap.xml` from Pages & Gallery; implement `GET /robots.txt` with env `ROBOTS_ALLOW` controlling Disallow; set cache headers (FR-018)
- [ ] T061 [P] Redirects: implement 301 redirect lookup + middleware in `apps/api/src/middleware/redirects.ts` and model in Prisma (FR-021, FR-030)
- [ ] T062 [P] Cookie consent banner in `apps/web/src/components/CookieConsent.tsx` (FR-020)
- [ ] T063 Performance: confirm budgets (LCP, HTML size, lazy-load) and adjust Vite config `apps/web/vite.config.ts`
- [ ] T064 [P] Security hardening: disable `x-powered-by`, review CORS, pin dependencies, secrets scanning in CI
- [ ] T065 Data retention: stub purge job in `apps/api/src/jobs/retention.ts` and document scheduling (FR-023)
 - [ ] T066 [P] Redirects validation tests (no loops, valid targets) in `apps/api/tests/unit/redirects.spec.ts`
 - [ ] T067 [P] Metrics: expose Prometheus metrics at `GET /metrics` using `prom-client` in `apps/api/src/routes/metrics.ts`
 - [ ] T068 [P] Metrics middleware: add request/response counters and latency histograms in `apps/api/src/middleware/metrics.ts` and wire in `app.ts`

---

## Dependencies & Execution Order

- Setup (Phase 1): No dependencies; start immediately.
- Foundational (Phase 2): Depends on Setup completion; blocks all user stories.
- User Stories (Phase 3+): Depend on Foundational completion.
  - US1 (P1) → MVP; can ship independently.
  - US2 (P2) → independent of US1, but public pages can also display updated content.
  - US3 (P3) → independent of US1/US2; uses content endpoints read-only.
- Polish: After targeted stories complete.

### User Story Dependencies
- US1 (P1): After Foundational; no other story dependency.
- US2 (P2): After Foundational; admin-only; public reads integrate via content endpoints.
- US3 (P3): After Foundational; read-only public features.

### Parallel Opportunities
- Within Phase 1/2, tasks marked [P] can proceed concurrently (separate files).
- After Phase 2, US1/US2/US3 can be staffed in parallel.
- Within each story, models/services can progress in parallel where marked [P].

## Parallel Execution Examples

- US1: Run T022, T023, T026 in parallel (schema, route skeleton, frontend form) while T024/T025 integrate DB + mail.
- US2: Run T032, T033, T034 concurrently (Pages/Gallery/FAQ services) after T030–T031 auth wiring.
- US3: Run T039 and T040 in parallel (gallery + lightbox) while T043 adjusts header a11y.

## Implementation Strategy

- MVP First: Complete Phase 1 → Phase 2 → Phase 3 (US1). Stop and validate.
- Incremental: Add US2, validate; add US3, validate.
- Parallel Team: Finish Phase 2, then split by US1/US2/US3.
