# Implementation Plan: Admin Panel Redesign

**Branch**: `006-admin-panel-redesign` | **Date**: 2026-02-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-admin-panel-redesign/spec.md`

## Summary

Redesign the existing admin panel from individual, disconnected pages into a professional-grade content management experience. The current implementation lacks a unified layout shell, reusable components, pagination, search/filter, loading states, error boundaries, audit logging, role-based access control, and accessibility compliance. This plan introduces: a shared admin layout with sidebar/topbar navigation, a reusable data table component, dashboard with metrics, enhanced page/gallery editors, FAQ management UI, settings/user management, RBAC with three roles, JWT refresh tokens, session idle timeout, theme switching, and WCAG 2.1 AA compliance. New Prisma models (AuditLog, Setting, RefreshToken, Role, Permission) extend the existing schema. API endpoints are extended with pagination, sorting, filtering, RBAC middleware, and audit logging.

## Technical Context

**Language/Version**: TypeScript 5.6.3 (frontend & backend)
**Primary Dependencies**:
- Frontend: React 18.3, Vite 6, React Router 6, React Hook Form 7 + Zod 3, Axios, Bootstrap 5.3, Radix UI Dialog, DOMPurify
- Backend: Express 4, Prisma 5 + @prisma/client, jsonwebtoken, argon2, Pino logger, multer, nodemailer, helmet, cors, express-rate-limit
- New: @dnd-kit/core + @dnd-kit/sortable (drag-and-drop), recharts (dashboard charts), sonner (toast notifications), react-dropzone (file upload drop zone)
**Storage**: PostgreSQL via Prisma ORM
**Testing**: Vitest + @testing-library/react (frontend), Vitest + supertest (backend), contract tests against OpenAPI
**Target Platform**: Web (modern browsers: latest 2 versions of Chrome, Firefox, Safari, Edge); deployed on DigitalOcean via Nginx + PM2
**Project Type**: Web application (monorepo with pnpm workspaces)
**Performance Goals**: API p95 <300ms; frontend LCP <2.5s; dashboard load <2s; data table sort/filter perceived <500ms
**Constraints**: API p95 <300ms; auto-save debounce ≤3s; search debounce 300ms; sidebar animation ≤200ms; idle timeout at 30min
**Scale/Scope**: ~5 admin users; up to 1000 records per table; 13 user stories across P1–P3; ~15 new/refactored frontend routes; ~10 new/extended API endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 1. Security & Privacy

- **Threat model**: Admin panel attack surface includes: brute force login (mitigated by account lockout after 5 attempts + existing rate limiting), session hijacking (mitigated by httpOnly cookie refresh tokens + in-memory access tokens), XSS in submissions viewer (mitigated by DOMPurify + HTML entity escaping), CSRF (mitigated by Bearer token auth), privilege escalation (mitigated by server-side RBAC checks on every endpoint), self-lockout (mitigated by preventing last super-admin demotion/deletion).
- **Data classification**: User credentials (passwordHash) — sensitive, never logged/returned. Audit logs contain userId + action metadata — internal use only. Submissions may contain PII — access restricted by role. IP hash already anonymized.
- **Secrets handling**: JWT secret via environment variable (existing pattern). Refresh token secret separate env var. No secrets in localStorage — access tokens in memory only, refresh tokens in httpOnly cookies.
- **Security tests**: 100% branch coverage on auth service, RBAC middleware, refresh token rotation, account lockout logic.

### 2. Reliability & Observability

- **Health endpoint**: Existing `GET /health` endpoint remains; no new health endpoints needed.
- **Log schema**: Existing Pino structured JSON logs (timestamp, level, correlation id via pino-http). New audit log model persists admin actions to database (userId, action, entity, entityId, changes JSON, ipAddress, userAgent, timestamp).
- **Metrics**: Audit log table provides admin action metrics. Dashboard stat queries provide entity count metrics. Existing pino-http request logging covers request count/latency. Failed login attempts tracked for lockout.

### 3. Test Discipline

- **Unit tests**: All new React components (AdminLayout, DataTable, StatCard, etc.), all new API route handlers, all service methods. Target: ≥70% line coverage.
- **Integration tests**: Auth flow (login → access token → refresh → logout), RBAC enforcement (role-based route access), CRUD flows for new entities (AuditLog, Setting, User management), pagination/sort/filter on list endpoints.
- **Critical module coverage**: Auth service, RBAC middleware, refresh token rotation, account lockout = 100% branch coverage.
- **Contract tests**: OpenAPI spec updated and validated against actual API responses.

### 4. Performance & Efficiency

- **API budgets**: All admin list endpoints with pagination p95 <300ms. Dashboard stats aggregation p95 <300ms. Auto-save endpoint p95 <200ms.
- **Frontend budgets**: LCP <2.5s. Dashboard load <2s. Sidebar animation ≤200ms. Search debounce 300ms. Table re-render on sort/filter <100ms.
- **Measurement**: Existing pino-http logs request duration. Lighthouse CI (existing `lighthouserc.json`) for frontend metrics. Manual profiling for drag-and-drop performance.

### 5. Accessibility & Inclusive UX

- **Focus order**: Sidebar → topbar → main content. Skip-to-content link as first focusable element. Modal focus trapping via Radix Dialog.
- **ARIA needs**: `aria-label` on sidebar toggle, `aria-current="page"` on active nav item, `aria-sort` on sortable table headers, `aria-live="polite"` on auto-save indicator and toast notifications, `aria-expanded` on collapsible sidebar and expandable rows, `role="alert"` on error boundaries.
- **Keyboard navigation**: All interactive elements focusable via Tab. Sidebar navigable via Arrow keys. Escape closes modals/drawers. Ctrl+S/Cmd+S saves in page editor.
- **Color contrast**: WCAG AA 4.5:1 for normal text, 3:1 for large text. Dark mode must maintain same ratios. Focus rings visible in both themes.

**All gates pass. Proceeding to Phase 0.**

## Project Structure

### Documentation (this feature)

```text
specs/006-admin-panel-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI extensions)
├── checklists/          # Testing checklists
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/api/
├── prisma/
│   ├── schema.prisma              # Extended: AuditLog, Setting, RefreshToken, Role, Permission models
│   └── migrations/                # New migration for schema additions
├── src/
│   ├── middleware/
│   │   ├── auth.ts                # Extended: refresh token flow, RBAC granular permissions
│   │   └── audit.ts               # NEW: audit logging middleware
│   ├── routes/
│   │   ├── admin/
│   │   │   ├── auth.ts            # Extended: refresh token endpoints, lockout
│   │   │   ├── pages.ts           # Extended: pagination, search, duplicate, auto-save
│   │   │   ├── gallery.ts         # Extended: pagination, bulk operations, filtering
│   │   │   ├── submissions.ts     # Extended: pagination, date/source filtering
│   │   │   ├── redirects.ts       # Extended: pagination, search
│   │   │   ├── faqs.ts            # Extended: reorder endpoint
│   │   │   ├── users.ts           # NEW: user CRUD + role assignment
│   │   │   ├── settings.ts        # NEW: settings CRUD
│   │   │   ├── dashboard.ts       # NEW: stats & activity feed
│   │   │   ├── roles.ts           # NEW: role & permission management
│   │   │   └── audit-log.ts       # NEW: audit log read endpoint
│   │   └── ...
│   └── services/
│       ├── auth.ts                # Extended: refresh tokens, lockout, password change
│       ├── audit.ts               # NEW: audit logging service
│       └── dashboard.ts           # NEW: dashboard stats aggregation
└── tests/
    ├── unit/
    ├── integration/
    └── contract/

apps/web/
├── src/
│   ├── components/
│   │   └── admin/                 # NEW: admin-specific components
│   │       ├── AdminLayout.tsx    # Sidebar + topbar + breadcrumbs shell
│   │       ├── Sidebar.tsx        # Collapsible sidebar navigation
│   │       ├── TopBar.tsx         # Breadcrumbs + user menu + theme toggle
│   │       ├── DataTable.tsx      # Reusable table with sort/filter/paginate/select
│   │       ├── StatCard.tsx       # Dashboard metric card
│   │       ├── ActivityFeed.tsx   # Dashboard activity feed
│   │       ├── SubmissionChart.tsx # Dashboard bar chart
│   │       ├── PageEditor.tsx     # Two-column page editor with drag-drop
│   │       ├── ImageManager.tsx   # Image selection/upload modal
│   │       ├── BulkActionBar.tsx  # Bulk operations toolbar
│   │       ├── ErrorBoundary.tsx  # Error boundary with fallback UI
│   │       ├── Toast.tsx          # Toast notification system
│   │       ├── ConfirmDialog.tsx  # Confirmation dialog
│   │       ├── LoadingSkeleton.tsx # Loading skeleton states
│   │       ├── EmptyState.tsx     # Empty/no-data state
│   │       └── SessionWarning.tsx # Idle timeout warning modal
│   ├── hooks/
│   │   ├── useAuth.ts             # NEW: auth context with token refresh
│   │   ├── useIdleTimeout.ts      # NEW: idle detection + warning
│   │   ├── useDebounce.ts         # NEW: debounced search/auto-save
│   │   ├── useTheme.ts            # NEW: theme persistence
│   │   └── usePagination.ts       # NEW: pagination state management
│   ├── lib/
│   │   └── api.ts                 # Extended: Axios interceptors for refresh tokens
│   ├── routes/
│   │   └── admin/
│   │       ├── guard.tsx          # Refactored: proper token validation + refresh
│   │       ├── login.tsx          # Extended: lockout handling
│   │       ├── index.tsx          # Refactored: dashboard with stat cards + charts
│   │       ├── pages.tsx          # Refactored: list with DataTable + editor
│   │       ├── page-editor.tsx    # NEW: two-column page editor route
│   │       ├── gallery.tsx        # Refactored: grid/list toggle, bulk ops, filters
│   │       ├── submissions.tsx    # Refactored: DataTable + filters + export
│   │       ├── redirects.tsx      # Refactored: DataTable integration
│   │       ├── faqs.tsx           # NEW: FAQ management with drag-drop reorder
│   │       ├── users.tsx          # NEW: user list + create/edit
│   │       ├── roles.tsx          # NEW: role management
│   │       ├── settings.tsx       # NEW: site settings
│   │       └── profile.tsx        # NEW: user profile + password change
│   └── styles/
│       └── admin.css              # NEW: admin theme variables (light/dark)
└── tests/
    └── unit/
```

**Structure Decision**: Existing monorepo structure (apps/web, apps/api, packages/ui, packages/config) is preserved. Admin-specific components are scoped under `apps/web/src/components/admin/` rather than the shared `packages/ui` because admin UI is application-specific, not reusable across projects. New API routes follow the existing `/admin/*` mount pattern. New hooks are added to `apps/web/src/hooks/` for cross-cutting admin concerns.

## Complexity Tracking

> No constitution violations. Existing architecture accommodates all requirements within the established monorepo structure.

## Constitution Check — Post-Design Re-evaluation

*Re-check after Phase 1 design completion.*

### 1. Security & Privacy — PASS

- Refresh token with family rotation and httpOnly cookie storage is documented in [data-model.md](data-model.md) (RefreshToken entity) and [contracts/api-contracts.md](contracts/api-contracts.md) (POST /admin/auth/refresh).
- RBAC with Role → RolePermission → Permission join table provides granular server-side permission checks. `authorize(resource, action)` middleware documented.
- Account lockout (5 attempts → 15min lock) added to User model as `failedLoginAttempts` + `lockedUntil` fields.
- Self-lockout prevention: API rejects demotion/deletion of last super_admin — validation rule documented.
- XSS mitigation: Existing DOMPurify for rich text + HTML entity escaping for submission payloads.
- No new secrets introduced beyond `REFRESH_TOKEN_SECRET` env var.

### 2. Reliability & Observability — PASS

- AuditLog model captures all admin mutations with structured fields matching constitution log schema requirements.
- Dashboard stat endpoints use parallel independent queries with null fallback for partial failure (FR-007).
- Error boundaries prevent cascading frontend failures.
- Toast notifications provide user-visible feedback for all operations.
- Existing Pino structured logging covers all new API routes automatically via pino-http middleware.

### 3. Test Discipline — PASS

- Test strategy covers unit (all new components + services), integration (auth flow, RBAC, CRUD), and contract tests (OpenAPI validation).
- Coverage targets: ≥70% overall, 100% branch for auth/RBAC/refresh token modules.
- No flaky test risk: all new tests use deterministic patterns (no system time dependency; mock timers for idle timeout; mock API for frontend).

### 4. Performance & Efficiency — PASS

- All list endpoints use server-side pagination (default 20, max 100) — prevents unbounded queries.
- Dashboard stats use COUNT queries with appropriate indexes — p95 <300ms achievable.
- Search debounce (300ms) + AbortController prevents request flooding and race conditions.
- Sidebar animation ≤200ms via CSS transitions (no JS animation overhead).
- Recharts SVG rendering with 7 data points — negligible render cost.
- New dependencies: @dnd-kit (~14.5kB), recharts (~45kB), sonner (~6kB), react-dropzone (~2kB), cookie-parser (~1.5kB) — reasonable bundle impact.

### 5. Accessibility & Inclusive UX — PASS

- @dnd-kit chosen specifically for built-in keyboard sensors and ARIA live region announcements.
- Recharts SVG-based (accessible to screen readers) over Canvas-based Chart.js.
- Sonner toast library supports ARIA live regions.
- Admin layout includes skip-to-content link, focus trapping in modals (Radix Dialog), visible focus rings.
- Data table: `aria-sort` on sortable headers, `aria-live` on loading/empty states.
- All documented in plan's Accessibility section.

**All gates pass post-design. Plan is ready for Phase 2 task breakdown (/speckit.tasks).**

### Note on Technical Context Correction

The plan references `react-hot-toast` in the Technical Context dependencies but research selected **sonner** as the toast library. The implementation should use **sonner** per the research findings.
