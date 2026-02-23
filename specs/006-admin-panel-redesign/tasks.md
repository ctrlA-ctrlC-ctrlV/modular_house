# Tasks: Admin Panel Redesign

**Input**: Design documents from `/specs/006-admin-panel-redesign/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api-contracts.md, quickstart.md

**Tests**: Each implementation task includes writing its own unit tests (≥70% line coverage). Constitution III mandates 100% branch coverage on auth/RBAC critical modules — dedicated test tasks are included in Phase 16 for these.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `apps/api/src/`, `apps/api/prisma/`, `apps/api/tests/`
- **Frontend**: `apps/web/src/`, `apps/web/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependencies, configure environment, and ensure project builds cleanly.

- [x] T001 Install frontend dependencies (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `recharts`, `sonner`, `react-dropzone`) in `apps/web/package.json`
- [x] T002 [P] Install backend dependencies (`cookie-parser`, `@types/cookie-parser`) in `apps/api/package.json`
- [x] T003 [P] Add new environment variables (`REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRES_IN`, `COOKIE_DOMAIN`) to `apps/api/src/config/env.ts` and `.env.example`
- [x] T004 [P] Create admin theme CSS variables (light/dark tokens) in `apps/web/src/styles/admin.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema migrations, core services, middleware, and reusable components that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Database Schema & Seed

- [ ] T005 Extend Prisma schema: add `AuditLog`, `Setting`, `RefreshToken`, `Role`, `Permission`, `RolePermission` models; extend `User` (add `roleId`, `isActive`, `failedLoginAttempts`, `lockedUntil`; remove `roles`); extend `Page` (add `publishStatus`, `version`); extend `FAQ` (add `publishStatus`) in `apps/api/prisma/schema.prisma`
- [ ] T006 Create and run Prisma migration for all schema changes via `apps/api/prisma/migrations/`
- [ ] T007 Update seed script to create default roles, permissions, role-permission mappings, default settings, and migrate existing admin user to `super_admin` role in `apps/api/prisma/seed.ts`

### Backend Core Services & Middleware

- [ ] T008 Implement audit logging service (`logAction` method that creates `AuditLog` entries) in `apps/api/src/services/audit.ts`
- [ ] T009 [P] Implement audit logging middleware (auto-captures userId, IP, userAgent per request) in `apps/api/src/middleware/audit.ts`
- [ ] T010 Extend auth service: add refresh token generation, rotation, family revocation, account lockout (5 attempts → 15min lock), password change, and token cleanup in `apps/api/src/services/auth.ts`
- [ ] T011 Extend auth middleware: add `cookie-parser`, refresh token extraction from httpOnly cookie, `authorize(resource, action)` permission-check middleware in `apps/api/src/middleware/auth.ts`
- [ ] T012 [P] Create reusable pagination/sorting/filtering utility (`buildPaginatedQuery`, `paginatedResponse`) for Prisma queries in `apps/api/src/services/pagination.ts`
- [ ] T013 Register `cookie-parser` middleware and mount new route modules in `apps/api/src/app.ts`

### Frontend Core Components & Hooks

- [ ] T014 Create `useTheme` hook (localStorage persistence, `prefers-color-scheme` fallback, `dark` class toggle on `<html>`) in `apps/web/src/hooks/useTheme.ts`
- [ ] T015 [P] Create `useDebounce` hook (generic debounced value with configurable delay) in `apps/web/src/hooks/useDebounce.ts`
- [ ] T016 [P] Create `useAuth` context/provider (in-memory access token, login/logout, `hasPermission` helper, user state) in `apps/web/src/hooks/useAuth.ts`
- [ ] T017 Extend Axios instance with response interceptor for 401 → silent refresh via `/admin/auth/refresh`, concurrent request queue in `apps/web/src/lib/api.ts`
- [ ] T018 Create `ErrorBoundary` component with fallback UI and recovery button in `apps/web/src/components/admin/ErrorBoundary.tsx`
- [ ] T019 [P] Create `LoadingSkeleton` component (generic skeleton loader for tables, cards, forms) in `apps/web/src/components/admin/LoadingSkeleton.tsx`
- [ ] T020 [P] Create `EmptyState` component (illustration + message + optional "Clear Filters" button) in `apps/web/src/components/admin/EmptyState.tsx`
- [ ] T021 [P] Create `ConfirmDialog` component (Radix Dialog wrapper with confirm/cancel actions, focus trapping) in `apps/web/src/components/admin/ConfirmDialog.tsx`
- [ ] T022 Create Toast notification setup with `sonner` (`<Toaster>` with `visibleToasts={3}`, theme-aware) in `apps/web/src/components/admin/Toast.tsx`
- [ ] T023 Create reusable `DataTable` component (server-side pagination, column sorting with `aria-sort`, search with debounce + AbortController, checkbox multi-select, bulk action bar, skeleton loading, empty state, configurable page sizes) in `apps/web/src/components/admin/DataTable.tsx`
- [ ] T024 [P] Create `BulkActionBar` component (floating toolbar for bulk operations on selected rows) in `apps/web/src/components/admin/BulkActionBar.tsx`

**Checkpoint**: Foundation ready — all schema, core services, middleware, and reusable components in place. User story implementation can now begin.

---

## Phase 3: User Story 2 — Unified Admin Layout Navigation (Priority: P1)

**Goal**: Provide a persistent sidebar + topbar layout shell that wraps all admin routes, with breadcrumbs, responsive drawer, and keyboard navigation.

**Independent Test**: Navigate between any admin pages and verify sidebar + top bar persist with correct active states, breadcrumbs update, sidebar collapses/expands with animation ≤200ms.

> **Note**: US2 (Layout) is implemented before US1 (Dashboard) because the layout shell is the container for all admin pages including the dashboard.

### Implementation

- [ ] T025 Create `Sidebar` component (256px/64px collapse, nav links with icons, `aria-current="page"` active state, Arrow key navigation, collapse toggle with `aria-expanded`, localStorage persistence of state, responsive drawer on <1024px) in `apps/web/src/components/admin/Sidebar.tsx`
- [ ] T026 Create `TopBar` component (64px height, breadcrumbs from React Router `useMatches()`, user dropdown menu, theme toggle switch, hamburger menu for mobile) in `apps/web/src/components/admin/TopBar.tsx`
- [ ] T027 Create `AdminLayout` component (composes Sidebar + TopBar + `<Outlet>` main content area, wraps content in `ErrorBoundary`, includes skip-to-content link as first focusable element, applies `dark` class from `useTheme`) in `apps/web/src/components/admin/AdminLayout.tsx`
- [ ] T028 Refactor admin routing in `apps/web/src/App.tsx`: nest all `/admin/*` routes under `<AdminLayout>` using React Router nested routes with `<Outlet>`, update `guard.tsx` to use `useAuth` context with proper token validation and refresh

**Checkpoint**: Admin layout shell is functional. All existing admin pages now render inside the unified layout.

---

## Phase 4: User Story 1 — Admin Dashboard Access (Priority: P1) 🎯 MVP

**Goal**: Display a dashboard with stat cards, 7-day submission bar chart, activity feed, and quick action buttons.

**Independent Test**: Log in as admin, navigate to `/admin`, verify stat cards show correct counts, bar chart renders 7 days of data, activity feed shows 5 recent entries, quick action buttons navigate correctly.

### Backend

- [ ] T029 [P] [US1] Create dashboard stats service (`getStats` aggregates counts for pages/gallery/submissions/redirects with published/draft/active splits; parallel queries with null fallback for partial failure) in `apps/api/src/services/dashboard.ts`
- [ ] T030 [P] [US1] Create dashboard routes: `GET /admin/dashboard/stats`, `GET /admin/dashboard/submissions-chart` (7-day rolling window), `GET /admin/dashboard/activity` (5 recent audit log entries with user email join) in `apps/api/src/routes/admin/dashboard.ts`

### Frontend

- [ ] T031 [P] [US1] Create `StatCard` component (icon, label, total count, breakdown badges for published/draft/active/inactive, link to section, zero-data shows "0") in `apps/web/src/components/admin/StatCard.tsx`
- [ ] T032 [P] [US1] Create `SubmissionChart` component (recharts `<BarChart>` with 7 bars, theme-aware colors, `aria-label`, empty state placeholder if no data) in `apps/web/src/components/admin/SubmissionChart.tsx`
- [ ] T033 [P] [US1] Create `ActivityFeed` component (5 most recent audit entries with relative timestamps, user attribution, entity links) in `apps/web/src/components/admin/ActivityFeed.tsx`
- [ ] T034 [US1] Refactor dashboard route: compose `StatCard` × 4 + `SubmissionChart` + `ActivityFeed` + quick action buttons, parallel data fetching with independent error states per widget in `apps/web/src/routes/admin/index.tsx`

**Checkpoint**: Dashboard is fully functional with stats, chart, activity feed, and quick actions. US1 + US2 deliver a complete MVP admin shell.

---

## Phase 5: User Story 5 — Data Tables with Sorting and Filtering (Priority: P2)

**Goal**: Ensure the reusable `DataTable` component (built in Phase 2, T023) works correctly with server-side pagination, column sorting, debounced search, and bulk selection across all list views.

**Independent Test**: Navigate to any list page, click column headers to sort, type in search to filter, use pagination controls to navigate pages, change page size.

> **Note**: US5 is placed before US3/US4/US6 because those stories all depend on the DataTable working correctly. The DataTable component was built in Phase 2 (T023). This phase validates and integrates it with the first real backend endpoint.

### Backend

- [ ] T035 [US5] Extend `GET /admin/redirects` with pagination, search (sourceSlug + destinationUrl), sorting, active filter using pagination utility in `apps/api/src/routes/admin/redirects.ts`

### Frontend

- [ ] T036 [US5] Refactor redirects page to use `DataTable` component with columns (sourceSlug, destinationUrl, active, createdAt), search, sort, pagination, inline create/edit form in `apps/web/src/routes/admin/redirects.tsx`

**Checkpoint**: DataTable proven end-to-end on the redirects page. All subsequent US3/US4/US6 stories can confidently use DataTable.

---

## Phase 6: User Story 3 — Pages Management with Enhanced Editing (Priority: P2)

**Goal**: Provide a paginated pages list with DataTable and a two-column page editor with drag-drop section reordering, auto-save, preview, duplicate, and unsaved changes warning.

**Independent Test**: Create/edit a page, reorder sections via drag-drop, verify auto-save indicator, navigate away with unsaved changes to see warning, use keyboard shortcut Ctrl+S to save.

### Backend

- [ ] T037 [US3] Extend `GET /admin/pages` with pagination, search (title + slug), sorting, publishStatus filter using pagination utility in `apps/api/src/routes/admin/pages.ts`
- [ ] T038 [P] [US3] Extend `PUT /admin/pages/:id` with optimistic locking (version check → 409 Conflict if mismatch, version increment on save) in `apps/api/src/routes/admin/pages.ts`
- [ ] T039 [P] [US3] Add `POST /admin/pages/:id/duplicate` endpoint (copies page with "-copy" slug suffix, resets to DRAFT, version 1) in `apps/api/src/routes/admin/pages.ts`

### Frontend

- [ ] T040 [US3] Refactor pages list to use `DataTable` with columns (title, slug, publishStatus, lastModifiedAt), search, sort, pagination, "New Page" and "Duplicate" row actions in `apps/web/src/routes/admin/pages.tsx`
- [ ] T041 [US3] Create `ImageManager` modal (browse existing gallery images with search, upload new image via react-dropzone, alt text editing, select callback) in `apps/web/src/components/admin/ImageManager.tsx`
- [ ] T042 [US3] Create `PageEditor` component (two-column layout: left content fields including hero headline/subhead/image via ImageManager + drag-drop section list via @dnd-kit; right sidebar with SEO title/description + publishStatus toggle + version display) in `apps/web/src/components/admin/PageEditor.tsx`
- [ ] T043 [US3] Create page editor route with auto-save (3s debounce), save status indicator ("Saving…"/"Saved"/"Error" with `aria-live`), Ctrl+S/Cmd+S shortcut, unsaved changes warning via `beforeunload` + React Router blocker, preview in new tab in `apps/web/src/routes/admin/page-editor.tsx`
- [ ] T044 [US3] Register page editor routes (`/admin/pages/new`, `/admin/pages/:id`) in `apps/web/src/App.tsx`

**Checkpoint**: Pages list with full DataTable features + rich page editor with drag-drop, auto-save, and preview.

---

## Phase 7: User Story 4 — Gallery Management with Bulk Operations (Priority: P2)

**Goal**: Provide gallery management with grid/list view toggle, category/status filtering, bulk operations (publish, delete, change category), and drag-drop image upload.

**Independent Test**: Upload images via drag-drop, switch between grid/list views, select multiple items, perform bulk publish/delete, filter by category and status.

### Backend

- [ ] T045 [US4] Extend `GET /admin/gallery` with pagination, search (title + caption), sorting, category filter, publishStatus filter using pagination utility in `apps/api/src/routes/admin/gallery.ts`
- [ ] T046 [P] [US4] Add `POST /admin/gallery/bulk` endpoint (accepts `ids` + `action` enum: publish/delete/changeCategory; validates category when action is changeCategory) in `apps/api/src/routes/admin/gallery.ts`

### Frontend

- [ ] T047 [US4] Refactor gallery page: add grid/list view toggle (persisted to localStorage), category + status filter dropdowns, integrate `DataTable` for list view, thumbnail card grid for grid view, drag-drop upload zone via react-dropzone with progress indicator, `BulkActionBar` integration for publish/delete/changeCategory in `apps/web/src/routes/admin/gallery.tsx`

**Checkpoint**: Gallery management with dual view, filters, drag-drop upload, and bulk operations.

---

## Phase 8: User Story 6 — Submissions Viewing and Export (Priority: P2)

**Goal**: Provide submissions list with date range + source page filtering, expandable row detail, CSV export, and reply-via-email action.

**Independent Test**: View submissions, filter by date range and source page, click a row to expand details showing all form data, export filtered results to CSV.

### Backend

- [ ] T048 [US6] Extend `GET /admin/submissions` with pagination, search (payload text), sorting, dateFrom/dateTo filter, sourcePageSlug filter using pagination utility in `apps/api/src/routes/admin/submissions.ts`
- [ ] T049 [P] [US6] Extend `GET /admin/submissions/export.csv` to accept same filter parameters (search, sourcePageSlug, dateFrom, dateTo) and stream filtered results in `apps/api/src/routes/admin/submissions.ts`

### Frontend

- [ ] T050 [US6] Refactor submissions page: `DataTable` with date range picker and source page dropdown filters, expandable row detail (form data with XSS escaping via DOMPurify, consent status, metadata), CSV export button, "Reply via Email" mailto link in detail view in `apps/web/src/routes/admin/submissions.tsx`

**Checkpoint**: Submissions list with filtering, expandable details, CSV export, and email reply.

---

## Phase 9: User Story 11 — FAQ Management (Priority: P2)

**Goal**: Provide CRUD interface for FAQs with drag-drop reordering of display order.

**Independent Test**: Create, edit, reorder (drag-drop), and delete FAQ entries. Verify display order persists on page reload.

### Backend

- [ ] T051 [US11] Extend `GET /admin/faqs` with pagination, search (question text), and publishStatus filter using pagination utility in `apps/api/src/routes/admin/faqs.ts`
- [ ] T051b [P] [US11] Add `PATCH /admin/faqs/:id/publish` toggle endpoint (sets publishStatus to PUBLISHED or DRAFT) in `apps/api/src/routes/admin/faqs.ts`
- [ ] T052 [P] [US11] Add `PUT /admin/faqs/reorder` endpoint (accepts `orderedIds` array, updates `displayOrder` for each FAQ in a transaction) in `apps/api/src/routes/admin/faqs.ts`

### Frontend

- [ ] T053 [US11] Create FAQ management page: `DataTable` for list with search and publishStatus filter, inline create/edit form (question, HTML answer with DOMPurify sanitization, displayOrder, publishStatus toggle), drag-drop reorder via @dnd-kit `SortableContext` + `verticalListSortingStrategy`, delete with ConfirmDialog in `apps/web/src/routes/admin/faqs.tsx`
- [ ] T054 [US11] Register FAQ route (`/admin/faqs`) in `apps/web/src/App.tsx` and add sidebar nav entry

**Checkpoint**: FAQ management with CRUD, publish/unpublish, and drag-drop reordering.

---

## Phase 10: User Story 8 — Theme Switching (Priority: P3)

**Goal**: Allow admins to toggle between light and dark themes with smooth transition, persisted preference, and OS default detection.

**Independent Test**: Toggle theme switch, verify all UI elements update smoothly. Close and reopen browser — theme preference is remembered.

> **Note**: The `useTheme` hook was already created in Phase 2 (T014) and the TopBar theme toggle in Phase 3 (T026). This phase ensures full coverage across all admin components.

- [ ] T055 [US8] Audit and apply dark mode styles to all admin components (DataTable, StatCard, PageEditor, Sidebar, forms, modals) ensuring WCAG AA contrast ratios are maintained in both themes in `apps/web/src/styles/admin.css` and component files

**Checkpoint**: Theme switching works across all admin UI with proper contrast ratios.

---

## Phase 11: User Story 9 — Session Management and Security (Priority: P3)

**Goal**: Implement idle timeout with warning modal at 25min and auto-logout at 30min, silent token refresh, and multi-tab logout consistency.

**Independent Test**: Log in, wait for idle timeout warning at 25min, verify auto-logout at 30min. Open multiple tabs, log out in one — all tabs redirect to login.

### Backend

- [ ] T056 [US9] Extend auth routes: `POST /admin/auth/refresh` (extracts refresh token from httpOnly cookie, rotates token family, returns new access token + sets new cookie), `POST /admin/auth/logout` (revokes entire token family, clears cookie) in `apps/api/src/routes/admin/auth.ts`
- [ ] T057 [P] [US9] Add `POST /admin/auth/change-password` endpoint (verify current password, hash new password, revoke all refresh tokens for user) in `apps/api/src/routes/admin/auth.ts`

### Frontend

- [ ] T058 [US9] Create `useIdleTimeout` hook (tracks mouse/keyboard/touch activity, shows warning at 25min, auto-logout at 30min, resets on activity, syncs across tabs via `storage` event listener) in `apps/web/src/hooks/useIdleTimeout.ts`
- [ ] T059 [US9] Create `SessionWarning` modal (countdown timer showing remaining seconds, "Stay Logged In" button resets timer, auto-closes and triggers logout on expiry) in `apps/web/src/components/admin/SessionWarning.tsx`
- [ ] T060 [US9] Integrate `useIdleTimeout` + `SessionWarning` into `AdminLayout`, update login page to handle lockout error (423 status) in `apps/web/src/components/admin/AdminLayout.tsx` and `apps/web/src/routes/admin/login.tsx`

**Checkpoint**: Session management with idle timeout, warning modal, auto-logout, and multi-tab consistency.

---

## Phase 12: User Story 7 — Role-Based Access Control (Priority: P3)

**Goal**: Implement RBAC with Role/Permission management UI, per-endpoint authorization, and frontend permission-based UI rendering.

**Independent Test**: Create users with different roles (Admin, Editor, Viewer), log in as each, verify they see/can access only permitted features.

### Backend

- [ ] T061 [US7] Create roles routes: `GET /admin/roles` (list with permissions), `POST /admin/roles` (create with permissionIds), `PUT /admin/roles/:id` (update permissions, block system role name change), `DELETE /admin/roles/:id` (block system role + role with assigned users) in `apps/api/src/routes/admin/roles.ts`
- [ ] T062 [P] [US7] Create `GET /admin/permissions` endpoint (list all available permissions) in `apps/api/src/routes/admin/roles.ts`
- [ ] T063 [US7] Apply `authorize(resource, action)` middleware to all existing admin routes (pages, gallery, faqs, submissions, redirects, dashboard, settings, users, roles, audit-log) in all route files under `apps/api/src/routes/admin/`

### Frontend

- [ ] T064 [US7] Create role management page: list roles with their permissions, create/edit role form with permission toggles grouped by resource (auto-check "view" when "edit" is checked), delete with protection for system roles in `apps/web/src/routes/admin/roles.tsx`
- [ ] T065 [US7] Update `Sidebar` to conditionally render nav items based on `hasPermission` from `useAuth` context in `apps/web/src/components/admin/Sidebar.tsx`
- [ ] T066 [US7] Register roles route (`/admin/roles`) in `apps/web/src/App.tsx` and add sidebar nav entry

**Checkpoint**: RBAC fully functional with backend enforcement and frontend permission-based rendering.

---

## Phase 13: User Story 13 — User Account Management (Priority: P3)

**Goal**: Allow super admins to create, edit, and deactivate admin user accounts with role assignment.

**Independent Test**: Create a new user with Editor role, log in as that user, verify limited access. Deactivate the user, verify they cannot log in.

### Backend

- [ ] T067 [US13] Create user management routes: `GET /admin/users` (paginated list with search, isActive filter), `POST /admin/users` (create with email/password/roleId, prevent duplicate email), `PUT /admin/users/:id` (update role/active/password, prevent last super_admin demotion/deactivation) in `apps/api/src/routes/admin/users.ts`
- [ ] T068 [US13] Extend login flow to check `isActive` flag (return "Account deactivated" for inactive users) and `lockedUntil` (return 423 with lock expiry for locked users) in `apps/api/src/services/auth.ts`

### Frontend

- [ ] T069 [US13] Create user management page: `DataTable` with columns (email, role name, isActive badge, lastLoginAt), search, filter by active status, "Add User" form (email, password, role select), edit modal (role, password, activate/deactivate), self-lockout prevention warning in `apps/web/src/routes/admin/users.tsx`
- [ ] T070 [US13] Register users route (`/admin/users`) in `apps/web/src/App.tsx` and add sidebar nav entry

**Checkpoint**: User management with CRUD, role assignment, and account deactivation.

---

## Phase 14: User Story 12 — Site Settings Management (Priority: P3)

**Goal**: Provide a settings page with grouped sections (General, Appearance, Notifications) and a profile page for password changes.

**Independent Test**: Change Site Name setting, verify it persists. Toggle email notification, verify setting is saved. Change own password via profile page.

### Backend

- [ ] T071 [US12] Create settings routes: `GET /admin/settings` (list all, optional group filter), `PUT /admin/settings` (batch update key-value pairs with validation) in `apps/api/src/routes/admin/settings.ts`
- [ ] T072 [P] [US12] Create audit log read route: `GET /admin/audit-log` (paginated, filter by userId/entity/action/dateRange) in `apps/api/src/routes/admin/audit-log.ts`

### Frontend

- [ ] T073 [US12] Create settings page: tabbed sections (General: site name/contact email/SEO title; Appearance: theme/sidebar default; Notifications: email on submission toggle/daily digest), "Save Changes" button with toast feedback in `apps/web/src/routes/admin/settings.tsx`
- [ ] T074 [P] [US12] Create profile page: display email, password change form (current password + new password with confirmation), save with toast feedback in `apps/web/src/routes/admin/profile.tsx`
- [ ] T075 [US12] Register settings and profile routes (`/admin/settings`, `/admin/profile`) in `apps/web/src/App.tsx` and add sidebar nav entries

**Checkpoint**: Site settings and profile management functional.

---

## Phase 15: User Story 10 — Accessible Keyboard Navigation (Priority: P3)

**Goal**: Ensure all admin features are fully keyboard-navigable (Tab, Enter, Escape, Arrow keys) with visible focus rings, ARIA attributes, and skip-to-content link.

**Independent Test**: Navigate the entire admin interface using only keyboard. Verify all interactive elements are focusable, modals trap focus, Escape closes modals, Arrow keys work in sidebar.

- [ ] T076 [US10] Audit and fix keyboard navigation across all admin components: verify Tab order in AdminLayout (skip-to-content → sidebar → topbar → main), Arrow keys in Sidebar, focus trapping in all modals/dialogs (ConfirmDialog, ImageManager, SessionWarning), Escape to close, visible focus rings in both themes
- [ ] T077 [P] [US10] Add ARIA attributes audit: `aria-sort` on DataTable headers, `aria-live="polite"` on auto-save indicator and toast container, `aria-expanded` on sidebar collapse and expandable submission rows, `aria-label` on icon-only buttons, `role="alert"` on ErrorBoundary fallback
- [ ] T078 [US10] Add `aria-live` region announcements for dynamic content changes (DataTable loading/loaded/empty states, bulk action results, page save status) across relevant components

**Checkpoint**: Full WCAG 2.1 AA keyboard accessibility compliance.

---

## Phase 16: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, performance validation, and cleanup.

- [ ] T079 Update OpenAPI specification (`apps/api/openapi.yaml`) with all new/modified endpoints, schemas, and pagination parameters per `contracts/api-contracts.md`
- [ ] T080 [P] Add audit logging calls to all admin mutation endpoints (create/update/delete for pages, gallery, faqs, redirects, users, roles, settings) using audit service in all route files under `apps/api/src/routes/admin/`
- [ ] T081 [P] Handle edge cases: pagination boundary (auto-navigate to previous page when last item deleted), concurrent session 404 handling (toast + refresh list), debounce race conditions (AbortController cancellation in DataTable search)
- [ ] T082 Validate quickstart.md flow end-to-end: fresh clone → install → migrate → seed → dev servers → login → dashboard → all admin pages functional
- [ ] T083 [P] Performance validation: verify API p95 <300ms on paginated endpoints, dashboard load <2s, sidebar animation ≤200ms, LCP <2.5s via Lighthouse CI
- [ ] T084 [P] Increment API version (minor bump) for new schema models and endpoint additions per constitution semantic versioning requirement
- [ ] T085 Critical module test coverage verification: ensure 100% branch coverage on auth service (`apps/api/src/services/auth.ts`), RBAC middleware (`apps/api/src/middleware/auth.ts`), refresh token rotation, and account lockout logic; add missing integration tests for auth flow (login → refresh → logout) and RBAC enforcement (role-based route access denial) in `apps/api/tests/integration/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US2 Layout)**: Depends on Phase 2 — BLOCKS US1 (dashboard needs layout shell)
- **Phase 4 (US1 Dashboard)**: Depends on Phase 3 (layout shell must exist)
- **Phase 5 (US5 DataTable validation)**: Depends on Phase 2 — validates DataTable on redirects
- **Phases 6–9 (US3, US4, US6, US11)**: Depend on Phase 5 (DataTable proven) — can run in parallel with each other
- **Phase 10 (US8 Theme)**: Depends on Phase 3 (layout) — can run in parallel with Phases 5–9
- **Phase 11 (US9 Session)**: Depends on Phase 2 (auth service) — can run in parallel with Phases 5–10
- **Phase 12 (US7 RBAC)**: Depends on Phase 2 (Role/Permission models) — can run in parallel with Phases 5–11
- **Phase 13 (US13 Users)**: Depends on Phase 12 (RBAC must exist for role assignment)
- **Phase 14 (US12 Settings)**: Depends on Phase 2 — can run in parallel with Phases 5–13
- **Phase 15 (US10 Accessibility)**: Depends on all UI phases being complete
- **Phase 16 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ──── BLOCKS ALL ────┐
    │                                       │
    ▼                                       │
Phase 3 (US2 Layout)                        │
    │                                       │
    ├─► Phase 4 (US1 Dashboard)             │
    │                                       │
    ├─► Phase 5 (US5 DataTable)             │
    │       │                               │
    │       ├─► Phase 6 (US3 Pages)    ◄────┤
    │       ├─► Phase 7 (US4 Gallery)  ◄────┤
    │       ├─► Phase 8 (US6 Submissions)◄──┤
    │       └─► Phase 9 (US11 FAQs)    ◄────┤
    │                                       │
    ├─► Phase 10 (US8 Theme)           ◄────┤
    ├─► Phase 11 (US9 Session)         ◄────┤
    ├─► Phase 12 (US7 RBAC)           ◄────┘
    │       │
    │       └─► Phase 13 (US13 Users)
    │
    ├─► Phase 14 (US12 Settings)
    │
    ▼
Phase 15 (US10 Accessibility) ← all UI phases
    │
    ▼
Phase 16 (Polish)
```

### Within Each User Story

- Backend endpoints before frontend pages
- Models/services before routes
- Core implementation before integration with other stories
- Story complete before moving to next priority

### Parallel Opportunities

- T001–T004 (Setup): all can run in parallel
- T008, T009, T010, T011 (backend core): T008+T009 parallel; T010+T011 sequential (auth depends internally)
- T014–T024 (frontend core): most marked [P] can run in parallel
- Phase 6–9 (US3, US4, US6, US11): all four can run in parallel once Phase 5 completes
- Phase 10, 11, 12, 14 (US8, US9, US7, US12): largely independent, can overlap

---

## Parallel Execution Examples

### After Phase 2 completes (multi-developer):

```
Developer A: Phase 3 (US2 Layout) → Phase 4 (US1 Dashboard)
Developer B: Phase 5 (US5 DataTable) → Phase 6 (US3 Pages)
Developer C: Phase 10 (US8 Theme) + Phase 11 (US9 Session)
```

### After Phase 5 completes (max parallelism):

```
Developer A: Phase 6 (US3 Pages)
Developer B: Phase 7 (US4 Gallery)
Developer C: Phase 8 (US6 Submissions) + Phase 9 (US11 FAQs)
Developer D: Phase 12 (US7 RBAC) → Phase 13 (US13 Users)
```

---

## Implementation Strategy

### MVP First (US2 + US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US2 Layout shell
4. Complete Phase 4: US1 Dashboard
5. **STOP and VALIDATE**: Admin can log in, see layout with sidebar/topbar, view dashboard with stats/chart/activity
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US2 (Layout) + US1 (Dashboard) → MVP admin shell with dashboard
3. US5 (DataTable) → Proven reusable table component
4. US3 (Pages) + US4 (Gallery) + US6 (Submissions) + US11 (FAQs) → Complete content management
5. US8 (Theme) + US9 (Session) → UX polish + security hardening
6. US7 (RBAC) + US13 (Users) → Multi-user access control
7. US12 (Settings) → Configuration autonomy
8. US10 (Accessibility) → WCAG compliance sweep
9. Polish → Production-ready

---

## Notes

- **[P]** tasks = different files, no dependencies on incomplete tasks
- **[Story]** label maps task to specific user story for traceability
- Each user story is independently completable and testable after its phase
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Total: **86 tasks** across 16 phases covering 13 user stories
