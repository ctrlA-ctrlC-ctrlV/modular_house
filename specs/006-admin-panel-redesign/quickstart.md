# Quickstart: Admin Panel Redesign

**Spec**: `006-admin-panel-redesign`  
**Date**: 2026-02-23

---

## Prerequisites

- Node.js ≥18 (LTS)
- pnpm ≥8
- Docker (for PostgreSQL via docker-compose)
- Git

---

## Setup

### 1. Clone and checkout branch

```bash
git checkout 006-admin-panel-redesign
pnpm install
```

### 2. Start database

```bash
cd infra
./scripts/dev-up.ps1     # Windows
# or
docker compose up -d     # Linux/macOS
```

### 3. Run migrations and seed

```bash
cd apps/api
pnpm prisma migrate dev
pnpm prisma db seed
```

The seed script creates:
- Default roles: `super_admin`, `admin`, `editor`, `viewer` with system permissions
- Default permissions: All resource × action combinations
- Role-permission mappings for each default role
- Default settings (site_name, contact_email, etc.)
- Seeded super admin user: `admin@modular.house` / `admin123`

### 4. Environment variables

Add to `apps/api/.env` (in addition to existing vars):

```env
# Existing
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=1h

# New for this feature
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-in-production
REFRESH_TOKEN_EXPIRES_IN=7d
COOKIE_DOMAIN=localhost
```

### 5. Start development servers

```bash
# Terminal 1: API
cd apps/api
pnpm dev

# Terminal 2: Web
cd apps/web
pnpm dev
```

Admin panel accessible at: `http://localhost:5173/admin`

---

## New Dependencies

### Frontend (`apps/web`)

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
pnpm add recharts
pnpm add sonner
pnpm add react-dropzone
```

### Backend (`apps/api`)

```bash
pnpm add cookie-parser
pnpm add -D @types/cookie-parser
```

---

## Key Development Patterns

### Admin Layout Shell

All admin routes render inside `<AdminLayout>` which provides:
- Persistent sidebar (256px / 64px collapsed)
- Top bar with breadcrumbs, user menu, theme toggle
- Main content area with error boundary

```tsx
// apps/web/src/routes/admin/layout.tsx
<AdminLayout>
  <Outlet />  {/* React Router nested routes */}
</AdminLayout>
```

### Data Table Usage

The reusable `<DataTable>` component handles pagination, sorting, filtering, and bulk selection:

```tsx
<DataTable
  columns={columns}
  endpoint="/admin/pages"
  searchPlaceholder="Search pages..."
  filters={[{ key: 'publishStatus', options: ['DRAFT', 'PUBLISHED'] }]}
  bulkActions={[{ label: 'Delete', action: handleBulkDelete }]}
  onRowClick={(row) => navigate(`/admin/pages/${row.id}`)}
/>
```

### Auth Flow

1. Login → access token (in-memory) + refresh token (httpOnly cookie)
2. Axios interceptor detects 401 → calls `/admin/auth/refresh` → retries original request
3. Idle timeout hook monitors user activity → warns at 25min → logs out at 30min
4. All API calls include `Authorization: Bearer <accessToken>` header

### RBAC Frontend

```tsx
// Permission check in components
const { hasPermission } = useAuth();

{hasPermission('pages:edit') && <Button>Edit Page</Button>}
```

### Theme Toggle

```tsx
// Uses CSS class strategy with Tailwind dark: prefix
const { theme, toggleTheme } = useTheme();
// Persists to localStorage key: 'admin-theme'
// Falls back to prefers-color-scheme on first load
```

---

## Testing

```bash
# Run all tests
pnpm test

# Run API tests only
cd apps/api && pnpm test

# Run web tests only
cd apps/web && pnpm test

# Run with coverage
pnpm test -- --coverage
```

### Critical paths requiring 100% branch coverage:
- `apps/api/src/services/auth.ts` — login, refresh, lockout
- `apps/api/src/middleware/auth.ts` — JWT verification, RBAC checks
- `apps/api/src/services/audit.ts` — audit log creation

---

## API Quick Reference

| Endpoint | Method | New/Modified | Description |
|---|---|---|---|
| `/admin/auth/login` | POST | Modified | Returns accessToken + httpOnly refresh cookie |
| `/admin/auth/refresh` | POST | **New** | Refreshes access token via cookie |
| `/admin/auth/logout` | POST | Modified | Revokes refresh token family |
| `/admin/auth/change-password` | POST | **New** | Change own password |
| `/admin/dashboard/stats` | GET | **New** | Dashboard stat cards |
| `/admin/dashboard/submissions-chart` | GET | **New** | 7-day submission chart data |
| `/admin/dashboard/activity` | GET | **New** | Activity feed (5 recent audit entries) |
| `/admin/pages` | GET | Modified | Paginated + search + sort |
| `/admin/pages/{id}/duplicate` | POST | **New** | Duplicate page |
| `/admin/gallery` | GET | Modified | Paginated + filters |
| `/admin/gallery/bulk` | POST | **New** | Bulk publish/delete/categorize |
| `/admin/submissions` | GET | Modified | Paginated + date/source filters |
| `/admin/redirects` | GET | Modified | Paginated + search |
| `/admin/faqs` | GET | Modified | Paginated |
| `/admin/faqs/reorder` | PUT | **New** | Drag-drop reorder |
| `/admin/users` | GET/POST | **New** | User CRUD |
| `/admin/users/{id}` | PUT | **New** | Update user |
| `/admin/roles` | GET/POST | **New** | Role management |
| `/admin/roles/{id}` | PUT/DELETE | **New** | Update/delete role |
| `/admin/permissions` | GET | **New** | List all permissions |
| `/admin/settings` | GET/PUT | **New** | Site settings |
| `/admin/audit-log` | GET | **New** | Audit log viewer |

---

## Frontend Route Map

| Route | Component | Description |
|---|---|---|
| `/admin/login` | `AdminLogin` | Login page (outside layout) |
| `/admin` | `AdminDashboard` | Dashboard with stats + charts |
| `/admin/pages` | `AdminPages` | Page list with DataTable |
| `/admin/pages/new` | `PageEditor` | Create new page |
| `/admin/pages/:id` | `PageEditor` | Edit existing page |
| `/admin/gallery` | `AdminGallery` | Gallery with grid/list toggle |
| `/admin/submissions` | `AdminSubmissions` | Submissions with filters + export |
| `/admin/redirects` | `AdminRedirects` | Redirects list |
| `/admin/faqs` | `AdminFAQs` | FAQ management with reorder |
| `/admin/users` | `AdminUsers` | User management |
| `/admin/roles` | `AdminRoles` | Role & permission management |
| `/admin/settings` | `AdminSettings` | Site settings |
| `/admin/profile` | `AdminProfile` | Personal profile + password |
