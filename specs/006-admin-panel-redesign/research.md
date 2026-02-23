# Research: Admin Panel Redesign — Technology Choices & Patterns

**Spec**: `006-admin-panel-redesign`  
**Date**: February 23, 2026  
**Stack context**: React 18.3 · TypeScript · Vite · react-router-dom 6 · react-hook-form + zod · Axios · Express 4 · Prisma 5 · PostgreSQL · Tailwind CSS (via `@modular-house/ui`) · pnpm monorepo

---

## Table of Contents

1. [Drag-and-Drop Library](#1-drag-and-drop-library)
2. [Chart Library for Dashboard](#2-chart-library-for-dashboard)
3. [Toast Notification Library](#3-toast-notification-library)
4. [JWT Refresh Token Best Practices](#4-jwt-refresh-token-best-practices)
5. [RBAC Implementation Pattern](#5-rbac-implementation-pattern)
6. [Admin Layout / Sidebar Pattern](#6-admin-layout--sidebar-pattern)
7. [Reusable Data Table Pattern](#7-reusable-data-table-pattern)

---

## 1. Drag-and-Drop Library

### Use Cases in This Project

| Use Case | Interaction |
|---|---|
| FAQ reorder (US-11, FR-036) | Vertical list sort by `displayOrder` |
| Page section reorder (US-3, FR-020) | Vertical list sort within JSON `sections` |
| Gallery image upload (US-4, FR-030) | File drag-and-drop onto a drop zone |

### Comparison

| Criterion | **@dnd-kit** | **react-beautiful-dnd** | **react-dnd** |
|---|---|---|---|
| **React 18 support** | Full — built for concurrent mode; uses modern React APIs | Partial — officially deprecated by Atlassian (April 2024); uses `findDOMNode` which triggers StrictMode warnings | Full — maintained; backend-agnostic architecture works with React 18 |
| **Sorting lists** | First-class `@dnd-kit/sortable` preset — ~10 lines to set up a sortable list | Out-of-the-box `<Droppable>` + `<Draggable>` for sorting; very opinionated API | Requires custom sort logic via `useDrag`/`useDrop` + index swapping; higher boilerplate |
| **File drop upload** | **Not supported natively** — designed for DOM element DnD, not native OS file drops. File upload needs a separate solution (e.g., `<input type="file">` styled as dropzone or `react-dropzone`) | **Not supported** — same limitation | Supports native file drops via HTML5 backend (`NativeTypes.FILE`). Can unify DOM DnD and file drops in one system |
| **Bundle size (min+gz)** | `@dnd-kit/core` ~11 kB + `@dnd-kit/sortable` ~3.5 kB ≈ **~14.5 kB** | ~30 kB (single package) | `react-dnd` ~9 kB + `react-dnd-html5-backend` ~7 kB ≈ **~16 kB** |
| **Accessibility** | Excellent — built-in keyboard sensor, screen reader announcements via live regions, ARIA attributes auto-managed. Best a11y story of the three | Good — keyboard DnD built-in, live region announcements | Poor — no built-in keyboard DnD; requires custom implementation |
| **TypeScript** | Written in TypeScript; first-class types | Types via `@types/react-beautiful-dnd` (community) | Written in TypeScript since v16 |
| **Maintenance** | Active — regular releases, 10k+ GitHub stars, healthy contributor base | **Deprecated** — Atlassian archived the repo April 2024. No bug fixes or React 19 path | Active — lower release cadence but stable |
| **Touch support** | Built-in touch & pointer sensors | Built-in touch sensor | Requires separate `react-dnd-touch-backend` |
| **Animation** | CSS-based layout shift animations; performant | Smooth built-in animation via `react-beautiful-dnd` physics | No built-in animation; DIY |

### File Upload Drop Zone

None of the three libraries are designed for OS-to-browser file drops as a primary use case. The standard approach is:

- **`react-dropzone`** (~2 kB gzip) — the community standard for file upload drop zones. It handles `dragenter`/`dragleave`/`drop` events, file type validation, size limits, and accessibility. It integrates trivially alongside any DnD library.
- A styled `<input type="file" />` inside a drop zone div works natively without any library dependency.

For this project, the two DnD use cases (list sorting vs. file upload) are completely separate UI surfaces, so using separate tools is clean and appropriate.

### Decision

**@dnd-kit** (`@dnd-kit/core` + `@dnd-kit/sortable`)

### Rationale

1. **React 18 compatibility** — fully supports StrictMode and concurrent rendering; no `findDOMNode` usage.
2. **Best accessibility** — meets FR-006 and US-10 requirements for keyboard DnD with built-in keyboard sensor and ARIA live-region announcements, critical for WCAG 2.1 AA compliance (SC-005, SC-010).
3. **Smallest bundle** — ~14.5 kB for full sortable support.
4. **Simplest sortable API** — `useSortable` hook + `SortableContext` is a minimal wrapper; perfect for the FAQ and page-section vertical-list use cases.
5. **Actively maintained** — unlike `react-beautiful-dnd` which is deprecated and will never support React 19.
6. **Extensible** — sensors (keyboard, pointer, touch), collision detection algorithms, and drag overlays are composable if future needs arise (e.g., kanban board).

**For file upload**: Use **`react-dropzone`** alongside `@dnd-kit` — it handles the gallery drag-and-drop upload (FR-030) cleanly with its own `onDrop` callback.

### Alternatives Considered

- **react-beautiful-dnd**: Despite having the smoothest out-of-box animation, it is deprecated with no future React support path. Choosing it introduces technical debt from day one. Not recommended.
- **react-dnd**: Viable and supports native file drops, but much higher boilerplate for sortable lists (our primary use case) and has no built-in keyboard accessibility — a non-starter for WCAG 2.1 AA compliance.

### Example Integration Sketch

```tsx
// FAQ sortable list with @dnd-kit
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableFaqItem({ faq }: { faq: FAQ }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: faq.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <span>{faq.question}</span>
    </div>
  );
}

function FaqList({ faqs, onReorder }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = faqs.findIndex((f) => f.id === active.id);
      const newIndex = faqs.findIndex((f) => f.id === over.id);
      onReorder(arrayMove(faqs, oldIndex, newIndex));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={faqs.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        {faqs.map((faq) => <SortableFaqItem key={faq.id} faq={faq} />)}
      </SortableContext>
    </DndContext>
  );
}
```

---

## 2. Chart Library for Dashboard

### Use Case in This Project

- **Single bar chart** showing 7-day submission volume (FR-009) — a simple grouped or stacked bar chart with 7 data points (date labels on X-axis, count on Y-axis).

### Comparison

| Criterion | **Recharts** | **Chart.js (react-chartjs-2)** | **Nivo** |
|---|---|---|---|
| **React 18 support** | Full — actively maintained React library | Full — `react-chartjs-2` v5 uses React 18 | Full — actively maintained |
| **Simple bar chart** | `<BarChart>` + `<Bar>` — ~15 lines of JSX. Declarative, React-native. | `<Bar data={...} options={...}>` — config object style. | `<ResponsiveBar>` — declarative but heavier conceptual API |
| **Bundle size (min+gz)** | ~45 kB (includes D3 submodules) | chart.js ~65 kB + react-chartjs-2 ~5 kB ≈ **~70 kB** | @nivo/bar ~50 kB (pulls multiple D3 modules; total Nivo install can be much larger) |
| **Theming (light/dark)** | Supports custom colors via props; CSS-variable-driven theming requires manual mapping. No built-in dark mode toggle. | Built-in color/font theming via `Chart.defaults`. Relatively easy to swap palettes for light/dark. | First-class theming API with `theme` prop; nivo provides light/dark presets out-of-the-box. Best theming story. |
| **Accessibility** | SVG-based — inherits SVG accessibility; can add `<title>`, `role`, `aria-label`. Screen readers can read SVG text. | Canvas-based — fundamentally inaccessible to screen readers. Requires a separate `<table>` fallback for a11y. | SVG-based — same as Recharts; can add ARIA attributes. Some components support `ariaLabel`. |
| **Responsiveness** | `<ResponsiveContainer>` wrapper handles resize. | Built-in responsive by default (`maintainAspectRatio` option). | `<Responsive*>` wrappers handle resize. |
| **Animation** | Built-in enter/update animations. | Smooth animation engine built-in. | Built-in motion with `react-spring`. |
| **Customization** | Custom tooltips, labels via JSX render props. Very React-idiomatic. | Custom plugins, callbacks, but config-object style (less React-like). | Rich tooltip/legend customization; declarative. |
| **Tree-shakeable** | Yes — import only `BarChart`, `XAxis`, etc. | Requires explicit `Chart.register(...)` for tree-shaking since Chart.js v3. | Yes — `@nivo/bar` is a standalone package. |
| **Learning curve** | Low — JSX composition is intuitive for React devs. | Medium — config-object API is less React-idiomatic; must manage refs for imperative updates. | Medium — rich API surface with many options. |

### Decision

**Recharts**

### Rationale

1. **Simplest for the use case** — one bar chart with 7 data points is trivially expressed as `<BarChart>` + `<Bar>` in JSX. Recharts' declarative composition model is the most React-idiomatic of the three.
2. **SVG-based = accessible** — meets FR-055 and US-10 requirements. Canvas-based Chart.js would require building a separate data table fallback for screen readers — unnecessary complexity for one chart.
3. **Smallest bundle for what we need** — ~45 kB vs ~70 kB for Chart.js. Nivo is similar in size but with a steeper learning curve.
4. **Tree-shakeable** — importing only `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer` keeps the actual imported bundle small.
5. **Dark mode theming** — while Recharts doesn't have a built-in theme toggle, our chart is simple enough that passing different fill colors from the theme context (which we're building anyway per FR-005) is trivial.
6. **Already React-native** — no adapter layer like `react-chartjs-2`; one less dependency.

### Alternatives Considered

- **Chart.js (react-chartjs-2)**: Most powerful charting library overall, but overkill for a single bar chart. Canvas rendering creates an accessibility gap (critical for SC-010). Config-object API is less maintainable in a React/TSX codebase. Larger bundle.
- **Nivo**: Best theming story with built-in dark/light presets, but the API is heavier than needed for one chart. The total dependency footprint (D3 submodules, react-spring for animation) is disproportionate to a 7-bar chart. Would be reconsidered if the dashboard grows to include many chart types.

### Example Integration Sketch

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DayVolume { date: string; count: number; }

function SubmissionChart({ data }: { data: DayVolume[] }) {
  const { theme } = useTheme(); // project's theme context

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} aria-label="Submission volume, last 7 days">
        <XAxis dataKey="date" tick={{ fill: theme === 'dark' ? '#cbd5e1' : '#475569' }} />
        <YAxis allowDecimals={false} tick={{ fill: theme === 'dark' ? '#cbd5e1' : '#475569' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
          }}
        />
        <Bar dataKey="count" fill={theme === 'dark' ? '#60a5fa' : '#3b82f6'} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

---

## 3. Toast Notification Library

### Use Case in This Project

- Success/error/warning/info messages for CRUD operations, bulk actions, auto-save feedback (FR-058).
- Maximum 3 visible simultaneously (FR-058).
- Accessible ARIA live regions (FR-055, US-10).

### Comparison

| Criterion | **react-hot-toast** | **Sonner** | **react-toastify** |
|---|---|---|---|
| **React 18 support** | Full | Full | Full |
| **Bundle size (min+gz)** | ~5 kB | ~6 kB | ~12 kB (includes CSS) |
| **Customization** | JSX-based custom toasts via `toast.custom()`; style/className overrides. Clean API. | Built-in styled toasts; supports `richColors`, custom JSX via render function. | Highly customizable — custom components, transitions, containers. Most features of the three. |
| **Accessibility (ARIA live)** | Uses `role="status"` and `aria-live="polite"` on the toast container. Basic but functional. | Uses `aria-live` regions. Supports `closeButton` with proper focus management. Visually hidden announcements for screen readers. | Uses `role="alert"` and `aria-live="assertive"` by default; configurable per toast. Most mature a11y implementation. |
| **Max visible limit** | No built-in `maxVisible` config. Must implement manually by tracking toast count. | Supports `visibleToasts` prop on `<Toaster visibleToasts={3}>` — exactly what FR-058 requires. | Supports `limit` prop on `<ToastContainer limit={3}>`. |
| **Promise/async toasts** | `toast.promise()` for loading → success/error flow. | `toast.promise()` with similar API. | `toast.promise()` with customizable pending/success/error renders. |
| **Positioning** | `position` prop (top-left, top-right, etc.) | `position` prop | `position` prop; supports multiple containers |
| **Dismiss/action buttons** | Manual dismiss; action via custom JSX | Built-in `action` and `cancel` buttons on toasts | Supports `autoClose`, custom close button, `onClick` |
| **Theming (light/dark)** | Manual — pass `style` based on theme context | Built-in `theme="dark"` or `theme="system"` prop. Follows OS preference automatically. | `theme="dark"` or `theme="colored"` prop built-in |
| **Close on click** | Configurable | Configurable | Configurable |
| **Pause on hover** | No built-in pause | Yes | Yes |
| **API style** | `toast('msg')`, `toast.success()`, `toast.error()` — imperative | `toast('msg')`, `toast.success()`, `toast.error()` — imperative; also `toast.info()`, `toast.warning()` | `toast('msg')`, `toast.success()`, `toast.error()` — imperative |
| **Stacking animation** | Simple slide-in | Elegant stacking animation (toasts visually stack); modern feel | Slide/bounce/flip/zoom transitions |
| **Maintenance** | Active; maintained by Tanner Linsley's adjacent ecosystem devs | Active; maintained by Emil Kowalski (popular in 2024–2025, growing fast) | Active; longest track record; most downloads |

### Decision

**Sonner**

### Rationale

1. **Built-in `visibleToasts` limit** — directly satisfies FR-058's "maximum 3 visible simultaneously" without custom logic.
2. **Built-in dark mode** — `theme="system"` or `theme="dark"` matches our FR-005 theme requirement with zero glue code.
3. **Small bundle** — ~6 kB, only 1 kB more than react-hot-toast but with significantly more built-in features.
4. **Modern stacking UX** — the visual stacking animation (toasts hover/expand when the user mouses over the toast area) is polished and modern, matching the "professional-grade" spec goal.
5. **ARIA support** — uses `aria-live` regions and proper focus management for accessibility compliance.
6. **Action/cancel buttons** — built-in support for action buttons on toasts (e.g., "Undo" on delete operations) without custom render functions.
7. **Promise toast** — `toast.promise()` for showing loading → success/error transitions (useful for bulk operations and CSV export).
8. **Rapidly growing adoption** — most popular new toast library in the React ecosystem (2024–2026), well-documented, active maintenance.

### Alternatives Considered

- **react-hot-toast**: Smallest bundle and clean API, but lacks built-in `maxVisible` limit and dark mode support. Would require custom wrappers to match FR-058. Good for simpler apps without these requirements.
- **react-toastify**: Most feature-rich and battle-tested, but at ~12 kB it's double Sonner's size. Its extensive configuration surface is more than we need. The default styling also requires importing its CSS file or overriding heavily. Would be the pick for enterprise apps needing maximum customization.

### Example Integration Sketch

```tsx
// Layout root
import { Toaster } from 'sonner';

function AdminLayout() {
  const { theme } = useTheme();

  return (
    <>
      <Sidebar />
      <main><Outlet /></main>
      <Toaster
        theme={theme}          // 'light' | 'dark' | 'system'
        position="top-right"
        visibleToasts={3}       // FR-058
        richColors              // semantic success/error colors
        closeButton
      />
    </>
  );
}

// Usage anywhere
import { toast } from 'sonner';

async function deleteFaq(id: string) {
  toast.promise(api.delete(`/admin/faqs/${id}`), {
    loading: 'Deleting FAQ…',
    success: 'FAQ deleted successfully',
    error: 'Failed to delete FAQ',
  });
}
```

---

## 4. JWT Refresh Token Best Practices

### Current State in This Project

The existing auth system ([apps/api/src/middleware/auth.ts](apps/api/src/middleware/auth.ts), [apps/api/src/routes/admin/auth.ts](apps/api/src/routes/admin/auth.ts)) uses:
- A single JWT access token returned in the login response body.
- Client stores the token (currently likely in `localStorage` or React state).
- Stateless logout (client discards the token).
- No refresh token mechanism — when the token expires, the user must re-login.

The spec requires (FR-046 through FR-049): access tokens in memory, refresh tokens in httpOnly cookies, idle timeout at 30 min with 25-min warning, and silent refresh.

### Recommended Architecture

#### Token Storage Strategy

| Token | Storage | Lifetime | Purpose |
|---|---|---|---|
| **Access token** | In-memory variable (React state/ref, **not** localStorage) | Short: **15 minutes** | Authorizes API requests via `Authorization: Bearer <token>` header |
| **Refresh token** | `httpOnly`, `Secure`, `SameSite=Strict` cookie | Long: **7 days** (FR-047) | Silently obtains new access tokens without user interaction |

**Why in-memory for access tokens?**
- `localStorage` is readable by any JS on the same origin — vulnerable to XSS.
- In-memory variables are not accessible from browser dev tools or XSS payloads that can't reach the closure.
- Trade-off: access token is lost on page refresh → the refresh token cookie automatically re-fetches it.

**Why httpOnly cookies for refresh tokens?**
- `httpOnly` prevents JavaScript access — immune to XSS.
- `Secure` ensures transmission only over HTTPS.
- `SameSite=Strict` prevents CSRF — the cookie is not sent on cross-origin requests.

#### Token Rotation (Refresh Token Families)

Refresh token rotation prevents stolen refresh tokens from being usable indefinitely:

1. Each refresh token belongs to a **token family** (a UUID assigned at login).
2. When a refresh token is used, the server:
   - Invalidates the used refresh token.
   - Issues a **new** refresh token (same family, new token value).
   - Issues a new access token.
3. If a previously-used (invalidated) refresh token is presented, it means the token was stolen and replayed. The server:
   - Invalidates **all tokens in that family** (revoke the entire session).
   - Returns 401; user must re-authenticate.

#### Prisma Schema Addition

```prisma
model RefreshToken {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  tokenHash   String   @unique @map("token_hash")     // store hash, not raw token
  family      String   @db.Uuid                         // token family for rotation
  expiresAt   DateTime @map("expires_at") @db.Timestamptz(6)
  revokedAt   DateTime? @map("revoked_at") @db.Timestamptz(6)
  replacedBy  String?  @map("replaced_by") @db.Uuid    // links to the replacement token
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([family])
  @@map("refresh_tokens")
}
```

#### Server-Side Flow (Express)

```
POST /admin/auth/login
  → Validate credentials
  → Generate access token (JWT, 15 min exp)
  → Generate refresh token (random UUID + hash)
  → Create RefreshToken record (family = new UUID)
  → Set refresh token as httpOnly cookie
  → Return { accessToken, user } in body

POST /admin/auth/refresh
  → Read refresh token from httpOnly cookie
  → Look up RefreshToken record by tokenHash
  → If not found or revoked → 401
  → If expired → 401
  → If already used (revokedAt is set):
      → Revoke ALL tokens in this family (token reuse detected → compromise)
      → 401
  → Mark current token as revoked (set revokedAt)
  → Generate new refresh token (same family, new value)
  → Generate new access token
  → Set new refresh token cookie
  → Return { accessToken } in body

POST /admin/auth/logout
  → Read refresh token from cookie
  → Revoke the token and all tokens in its family
  → Clear the cookie
  → Return 204
```

#### Required npm Packages

| Package | Purpose |
|---|---|
| **`cookie-parser`** | Express middleware to parse cookies from `req.cookies`. Already standard in Express apps. |
| **`jsonwebtoken`** | Already in dependencies — sign/verify access tokens. |
| **`uuid`** | Already in dependencies — generate token family IDs and refresh token values. |
| **`argon2`** (or `crypto.createHash`) | Already in dependencies — hash refresh tokens before storing. For refresh tokens, SHA-256 via Node's built-in `crypto` module is sufficient (no need for slow hashing since refresh tokens are high-entropy random strings). |

No additional packages strictly needed beyond what's already installed. `cookie-parser` is the only likely addition.

#### Client-Side: Silent Refresh with Axios Interceptors

```typescript
// auth-store.ts — in-memory token management
let accessToken: string | null = null;

export function getAccessToken() { return accessToken; }
export function setAccessToken(token: string | null) { accessToken = token; }

// api-client.ts — Axios instance with interceptors
import axios from 'axios';
import { getAccessToken, setAccessToken } from './auth-store';

const api = axios.create({ baseURL: '/api', withCredentials: true });

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 with silent refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: Error) => void;
}> = [];

function processQueue(error: Error | null, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request — wait for the in-flight refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/api/admin/auth/refresh', null, {
          withCredentials: true, // send httpOnly cookie
        });
        setAccessToken(data.accessToken);
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        setAccessToken(null);
        // Redirect to login
        window.location.href = '/admin/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
```

**Handling concurrent requests during refresh**: The pattern above uses a request queue (`failedQueue`). When the first 401 triggers a refresh, subsequent 401s don't trigger additional refresh calls — they wait in the queue and are replayed once the new token arrives. This prevents race conditions and duplicate refresh calls.

#### Cookie Configuration (Express)

```typescript
import cookieParser from 'cookie-parser';

app.use(cookieParser());

// When setting the refresh token cookie:
res.cookie('refresh_token', refreshTokenValue, {
  httpOnly: true,       // JS can't read it
  secure: true,         // HTTPS only (set false for local dev)
  sameSite: 'strict',   // no cross-origin sends
  path: '/api/admin/auth/refresh',  // only sent to refresh endpoint
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
});
```

**Setting `path` to only the refresh endpoint** is a security best practice — the cookie is never sent with regular API calls, reducing exposure surface.

#### Page Refresh / Initial Load Flow

1. App starts → `accessToken` is `null` (in-memory).
2. App calls `POST /api/admin/auth/refresh` (cookie is sent automatically).
3. If valid refresh token exists → server returns new access token → app stores in memory → user sees dashboard.
4. If no valid refresh token → 401 → app redirects to login.

This provides seamless UX on page refresh despite in-memory token storage.

#### Idle Timeout Implementation (FR-048)

```typescript
// idle-timer.ts
const IDLE_TIMEOUT = 30 * 60 * 1000;  // 30 min
const WARNING_AT   = 25 * 60 * 1000;  // 25 min

let idleTimer: ReturnType<typeof setTimeout>;
let warningTimer: ReturnType<typeof setTimeout>;

function resetTimers(onWarning: () => void, onLogout: () => void) {
  clearTimeout(idleTimer);
  clearTimeout(warningTimer);
  warningTimer = setTimeout(onWarning, WARNING_AT);
  idleTimer = setTimeout(onLogout, IDLE_TIMEOUT);
}

// Listen to user activity events
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];
ACTIVITY_EVENTS.forEach((event) =>
  document.addEventListener(event, () => resetTimers(showWarningModal, logoutUser)),
);
```

---

## 5. RBAC Implementation Pattern (Express + Prisma)

### Role & Permission Model Design

The spec defines three roles (FR-050): **Admin** (full access), **Editor** (content CRUD, read-only for submissions/redirects), **Viewer** (read-only everywhere). The spec also mentions that a super admin can create/edit Role definitions (US-7) with toggleable permissions per resource.

#### Recommended: Resource-Permission Matrix with Join Table

```
┌──────────┐     ┌─────────────────────┐     ┌──────────────┐
│   Role   │────<│  RolePermission     │>────│  Permission  │
│          │     │  (join table)       │     │              │
│ id       │     │ roleId              │     │ id           │
│ name     │     │ permissionId        │     │ resource     │
│ isSystem │     │                     │     │ action       │
│ hierarchy│     └─────────────────────┘     └──────────────┘
└──────────┘
```

**Why this over a simple roles array?**
- The current schema uses `roles String[]` on `User` — this is fine for the role name but provides no way to define what each role *can do*.
- A join table allows granular toggle of permissions per resource per role (exactly what US-7 AC-1 describes).
- Adding new resources or actions requires only inserting new `Permission` rows, not changing code.

#### Prisma Schema Addition

```prisma
model Role {
  id          String           @id @default(uuid()) @db.Uuid
  name        String           @unique @db.VarChar(50)   // 'admin', 'editor', 'viewer'
  description String?
  isSystem    Boolean          @default(false) @map("is_system") // system roles can't be deleted
  hierarchy   Int              @default(0)                  // higher = more powerful
  createdAt   DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)
  permissions RolePermission[]
  users       User[]           @relation("UserRole")

  @@map("roles")
}

model Permission {
  id       String           @id @default(uuid()) @db.Uuid
  resource String           @db.VarChar(50)   // 'pages', 'gallery', 'faqs', 'submissions', 'redirects', 'users', 'settings'
  action   String           @db.VarChar(50)   // 'view', 'create', 'edit', 'delete'
  roles    RolePermission[]

  @@unique([resource, action])
  @@map("permissions")
}

model RolePermission {
  roleId       String     @map("role_id") @db.Uuid
  permissionId String     @map("permission_id") @db.Uuid
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@map("role_permissions")
}
```

Update the `User` model to reference `Role`:

```prisma
model User {
  // ... existing fields ...
  roleId  String?  @map("role_id") @db.Uuid
  role    Role?    @relation("UserRole", fields: [roleId], references: [id])
  // keep roles String[] for backward compat during migration, then remove
}
```

#### Seed Data

```typescript
const permissions = [
  // resource, action
  ['pages', 'view'], ['pages', 'create'], ['pages', 'edit'], ['pages', 'delete'],
  ['gallery', 'view'], ['gallery', 'create'], ['gallery', 'edit'], ['gallery', 'delete'],
  ['faqs', 'view'], ['faqs', 'create'], ['faqs', 'edit'], ['faqs', 'delete'],
  ['submissions', 'view'], ['submissions', 'export'],
  ['redirects', 'view'], ['redirects', 'create'], ['redirects', 'edit'], ['redirects', 'delete'],
  ['users', 'view'], ['users', 'create'], ['users', 'edit'], ['users', 'deactivate'],
  ['settings', 'view'], ['settings', 'edit'],
  ['roles', 'view'], ['roles', 'create'], ['roles', 'edit'], ['roles', 'delete'],
];

const roles = {
  admin:  { hierarchy: 100, permissions: permissions }, // all permissions
  editor: { hierarchy: 50,  permissions: [
    ['pages', '*'], ['gallery', '*'], ['faqs', '*'], // full CRUD
    ['submissions', 'view'], ['submissions', 'export'],
    ['redirects', 'view'],
  ]},
  viewer: { hierarchy: 10, permissions: permissions.filter(([, a]) => a === 'view') },
};
```

#### Express Middleware Pattern

```typescript
// middleware/authorize.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';

type Resource = 'pages' | 'gallery' | 'faqs' | 'submissions' | 'redirects' | 'users' | 'settings' | 'roles';
type Action = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'deactivate';

/**
 * Middleware factory: checks if the authenticated user's role
 * includes the required permission.
 */
export function authorize(resource: Resource, action: Action) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Fetch user with role and permissions (cache this in production)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user?.role) {
      res.status(403).json({ error: 'No role assigned' });
      return;
    }

    const hasPermission = user.role.permissions.some(
      (rp) => rp.permission.resource === resource && rp.permission.action === action,
    );

    if (!hasPermission) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

// Usage in routes:
router.get('/pages', authenticateJWT, authorize('pages', 'view'), listPages);
router.post('/pages', authenticateJWT, authorize('pages', 'create'), createPage);
router.put('/pages/:id', authenticateJWT, authorize('pages', 'edit'), updatePage);
router.delete('/pages/:id', authenticateJWT, authorize('pages', 'delete'), deletePage);
```

**Performance note**: In production, cache the user's permissions in-memory (or in the JWT claim payload) to avoid a DB query on every request. A simple approach: include a `permissions` array in the access token JWT payload, refreshed each time a new access token is minted.

#### Role Hierarchy (edit implies view)

The edge case from the spec: if a role has `edit: true` for a resource, `view` should be implied.

```typescript
// permission-utils.ts
const HIERARCHY: Record<string, string[]> = {
  delete: ['edit', 'view', 'create'],
  edit:   ['view'],
  create: ['view'],
  export: ['view'],
  deactivate: ['view'],
  view:   [],
};

export function hasPermission(
  userPermissions: Array<{ resource: string; action: string }>,
  resource: string,
  action: string,
): boolean {
  // Direct match
  if (userPermissions.some((p) => p.resource === resource && p.action === action)) {
    return true;
  }
  // Check if a higher-level permission implies this one
  return userPermissions.some(
    (p) => p.resource === resource && HIERARCHY[p.action]?.includes(action),
  );
}
```

#### Frontend Permission Checking (Hiding UI Elements)

```tsx
// hooks/usePermission.ts
import { useAuth } from './useAuth';
import { hasPermission } from '../utils/permission-utils';

export function usePermission(resource: string, action: string): boolean {
  const { user } = useAuth();
  if (!user?.permissions) return false;
  return hasPermission(user.permissions, resource, action);
}

// Usage in components:
function PagesToolbar() {
  const canCreate = usePermission('pages', 'create');

  return (
    <div>
      {canCreate && <Button onClick={handleNewPage}>New Page</Button>}
    </div>
  );
}
```

**Important**: Frontend permission checks are for UX only — hiding buttons and menu items. The backend `authorize()` middleware is the real security gate. Never trust frontend-only checks.

#### Self-Lockout Prevention

From the edge cases: "Can't remove the last super-admin."

```typescript
// services/user-service.ts
async function updateUserRole(targetUserId: string, newRoleId: string, actorId: string) {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { role: true },
  });

  if (!targetUser) throw new NotFoundError('User not found');

  // Check if this is the last admin
  if (targetUser.role?.name === 'admin') {
    const adminCount = await prisma.user.count({
      where: { role: { name: 'admin' }, id: { not: targetUserId } },
    });

    const newRole = await prisma.role.findUnique({ where: { id: newRoleId } });

    if (adminCount === 0 && newRole?.name !== 'admin') {
      throw new ForbiddenError(
        'Cannot change the role of the last active Admin. Promote another user first.',
      );
    }
  }

  // Prevent self-demotion (actor can't change their own role to lower)
  if (targetUserId === actorId) {
    throw new ForbiddenError('You cannot change your own role.');
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { roleId: newRoleId },
  });
}
```

---

## 6. Admin Layout / Sidebar Pattern

### Requirements (from spec)

- FR-001: Sidebar 256px expanded, 64px collapsed.
- FR-003: Collapse state persisted to localStorage; animation ≤ 200ms.
- FR-004: On viewports < 1024px, sidebar converts to a slide-out drawer.
- FR-005: Light/dark theme persistence with `prefers-color-scheme` fallback.
- FR-002: Breadcrumbs reflecting route hierarchy.

### Recommended Pattern: CSS Variables + React Context + Tailwind

#### Layout Structure

```
┌─────────────────────────────────────────────┐
│ TopBar (h-16)                               │
│  [☰] [Breadcrumbs ...]          [Theme] [👤]│
├───────────┬─────────────────────────────────┤
│ Sidebar   │ Main Content (scrollable)       │
│ (w-64 or  │                                 │
│  w-16)    │  <Outlet />                     │
│           │                                 │
│ [🏠 Dash] │                                 │
│ [📄 Pages]│                                 │
│ [🖼 Gall.] │                                │
│ [❓ FAQs]  │                                │
│ [📬 Sub.]  │                                │
│ [↪ Redir.] │                                │
│ [👥 Users] │                                │
│ [⚙ Sett.]  │                                │
│           │                                 │
│ [◀ Collap]│                                 │
└───────────┴─────────────────────────────────┘
```

#### Sidebar State Management

```tsx
// context/sidebar-context.tsx
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

interface SidebarContextValue {
  isCollapsed: boolean;
  isDrawerOpen: boolean;
  toggleCollapse: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = 'admin-sidebar-collapsed';

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      localStorage.setItem(STORAGE_KEY, String(!prev));
      return !prev;
    });
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isDrawerOpen,
        toggleCollapse,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be inside SidebarProvider');
  return ctx;
};
```

#### Responsive Sidebar (Drawer on Mobile)

```tsx
// components/AdminSidebar.tsx
function AdminSidebar() {
  const { isCollapsed, isDrawerOpen, closeDrawer, toggleCollapse } = useSidebar();
  const isMobile = useMediaQuery('(max-width: 1023px)'); // < 1024px per FR-004

  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {isDrawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={closeDrawer}
            aria-hidden="true"
          />
        )}
        {/* Drawer */}
        <aside
          className={`fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-slate-900
            transform transition-transform duration-200 ease-in-out
            ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
          role="navigation"
          aria-label="Admin navigation"
        >
          <NavItems showLabels />
        </aside>
      </>
    );
  }

  return (
    <aside
      className={`sticky top-16 h-[calc(100vh-4rem)] transition-all duration-200 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700`}
      role="navigation"
      aria-label="Admin navigation"
    >
      <NavItems showLabels={!isCollapsed} />
      <button
        onClick={toggleCollapse}
        className="absolute bottom-4 right-2"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? '▶' : '◀'}
      </button>
    </aside>
  );
}
```

#### Breadcrumb Generation from React Router Routes

The recommended pattern uses React Router v6's `useMatches()` hook (available with data routers) combined with route handle metadata:

```tsx
// Route definitions with breadcrumb metadata
const adminRoutes = [
  {
    path: '/admin',
    element: <AdminLayout />,
    handle: { breadcrumb: 'Admin' },
    children: [
      { index: true, element: <Dashboard />, handle: { breadcrumb: 'Dashboard' } },
      {
        path: 'pages',
        handle: { breadcrumb: 'Pages' },
        children: [
          { index: true, element: <PagesList /> },
          { path: ':id/edit', element: <PageEditor />, handle: { breadcrumb: 'Edit' } },
          { path: 'new', element: <PageEditor />, handle: { breadcrumb: 'New Page' } },
        ],
      },
      { path: 'gallery', element: <GalleryList />, handle: { breadcrumb: 'Gallery' } },
      { path: 'faqs', element: <FaqList />, handle: { breadcrumb: 'FAQs' } },
      { path: 'submissions', element: <SubmissionsList />, handle: { breadcrumb: 'Submissions' } },
      { path: 'redirects', element: <RedirectsList />, handle: { breadcrumb: 'Redirects' } },
      { path: 'users', element: <UsersList />, handle: { breadcrumb: 'Users' } },
      { path: 'settings', element: <SettingsPage />, handle: { breadcrumb: 'Settings' } },
    ],
  },
];

// Breadcrumb component
import { useMatches, Link } from 'react-router-dom';

interface BreadcrumbHandle {
  breadcrumb: string | ((data: unknown) => string);
}

function Breadcrumbs() {
  const matches = useMatches();
  const crumbs = matches
    .filter((m) => (m.handle as BreadcrumbHandle)?.breadcrumb)
    .map((m) => ({
      label: typeof (m.handle as BreadcrumbHandle).breadcrumb === 'function'
        ? (m.handle as BreadcrumbHandle).breadcrumb(m.data)
        : (m.handle as BreadcrumbHandle).breadcrumb,
      path: m.pathname,
    }));

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm">
        {crumbs.map((crumb, i) => (
          <li key={crumb.path} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {i < crumbs.length - 1 ? (
              <Link to={crumb.path} className="text-blue-600 hover:underline">
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-slate-600 dark:text-slate-300">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

**Note**: `useMatches()` requires using React Router's `createBrowserRouter` (data router API) instead of `<BrowserRouter>`. This is the recommended pattern for React Router v6.4+ and supports loaders, actions, and error boundaries natively.

#### Theme Switching: CSS Variables via Tailwind's Dark Mode

Tailwind's `darkMode: 'class'` strategy, combined with CSS custom properties for branding colors, is the recommended approach for this stack:

```tsx
// context/theme-context.tsx
const THEME_KEY = 'admin-theme';
type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

This approach:
- Uses Tailwind's native `dark:` variant (already configured in `@modular-house/ui` which has Tailwind).
- Stores preference in `localStorage` (FR-005).
- Falls back to OS preference on first visit (FR-005, US-8 edge case).
- No runtime CSS-in-JS overhead.
- All components use `className="bg-white dark:bg-slate-900"` etc.

---

## 7. Reusable Data Table Pattern

### Requirements (from spec)

- Server-side pagination, sorting, filtering (FR-011 through FR-018).
- Debounced search (FR-013, 300ms).
- Skeleton loading states (FR-014).
- Bulk selection with checkbox column (FR-016).
- Empty state + "Clear Filters" button (FR-017, FR-018).
- Used across: Pages, Submissions, Redirects, Gallery (list view), Users, FAQs.

### Recommended Pattern: Custom Hook + Headless Component

Rather than adopting a heavy table library (AG Grid, MUI DataGrid), build a **headless `useDataTable` hook** that manages state and an accompanying **presentational `<DataTable>` component** styled with Tailwind. This is appropriate because:

1. The project already has a UI package (`@modular-house/ui`) — the table should live there.
2. Server-side pagination means the table doesn't manage data internally; it calls APIs.
3. The specific UX (skeleton states, empty state illustrations, bulk action bar) is bespoke.
4. Total code for the hook + component is ~300 lines — far less than learning and configuring a third-party table library.

#### URL State Sync (Query Params)

Persist table state (page, sort, filters, search) in URL query parameters so that:
- Deep links work (sharing a link opens the same view).
- Browser back/forward navigates table state.
- Page refresh preserves the user's context.

```typescript
// hooks/useDataTable.ts
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';

export interface DataTableParams {
  page: number;
  pageSize: number;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc' | null;
  search: string;
  filters: Record<string, string>;
}

export interface DataTableResult<T> {
  data: T[];
  total: number;
  totalPages: number;
}

interface UseDataTableOptions {
  defaultPageSize?: number;
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  filterKeys?: string[];   // which URL params are filters (e.g., ['status', 'category'])
  debounceMs?: number;     // search debounce (default 300)
}

export function useDataTable<T>(
  fetchFn: (params: DataTableParams) => Promise<DataTableResult<T>>,
  options: UseDataTableOptions = {},
) {
  const {
    defaultPageSize = 20,
    defaultSortBy = null,
    defaultSortOrder = null,
    filterKeys = [],
    debounceMs = 300,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  // Parse state FROM URL
  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || defaultPageSize;
  const sortBy = searchParams.get('sortBy') || defaultSortBy;
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || defaultSortOrder;
  const search = searchParams.get('search') || '';
  const filters: Record<string, string> = {};
  filterKeys.forEach((key) => {
    const val = searchParams.get(key);
    if (val) filters[key] = val;
  });

  const [result, setResult] = useState<DataTableResult<T>>({ data: [], total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch data whenever params change
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    fetchFn({ page, pageSize, sortBy, sortOrder, search, filters })
      .then((res) => {
        if (!controller.signal.aborted) {
          setResult(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          // handle error
        }
      });

    return () => controller.abort();
  }, [page, pageSize, sortBy, sortOrder, search, JSON.stringify(filters)]);

  // URL updaters
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([k, v]) => {
          if (v === null || v === '') next.delete(k);
          else next.set(k, v);
        });
        return next;
      });
    },
    [setSearchParams],
  );

  const setPage = (p: number) => updateParams({ page: String(p) });
  const setPageSize = (ps: number) => updateParams({ pageSize: String(ps), page: '1' });
  const setSort = (col: string | null, order: 'asc' | 'desc' | null) =>
    updateParams({ sortBy: col, sortOrder: order, page: '1' });
  const setSearch = (q: string) => updateParams({ search: q || null, page: '1' });
  const setFilter = (key: string, value: string | null) => updateParams({ [key]: value, page: '1' });
  const clearFilters = () => {
    const resets: Record<string, null> = { search: null, page: null };
    filterKeys.forEach((k) => (resets[k] = null));
    updateParams(resets);
  };

  const hasActiveFilters = search !== '' || Object.keys(filters).length > 0;

  return {
    // State
    data: result.data,
    total: result.total,
    totalPages: result.totalPages,
    page,
    pageSize,
    sortBy,
    sortOrder,
    search,
    filters,
    isLoading,
    hasActiveFilters,
    // Actions
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setFilter,
    clearFilters,
  };
}
```

#### Debounced Search Input

```tsx
// components/DebouncedSearch.tsx
import { useState, useEffect, useRef } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  placeholder?: string;
}

export function DebouncedSearch({ value, onChange, debounceMs = 300, placeholder }: Props) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync external → local when URL changes (e.g., clear filters)
  useEffect(() => { setLocalValue(value); }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setLocalValue(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), debounceMs);
  }

  return (
    <input
      type="search"
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder ?? 'Search…'}
      className="rounded border px-3 py-2 text-sm"
      aria-label="Search table"
    />
  );
}
```

#### Skeleton Loading States

```tsx
function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div role="status" aria-label="Loading data">
      <table className="w-full">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-t border-slate-100 dark:border-slate-800">
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <span className="sr-only">Loading table data…</span>
    </div>
  );
}
```

#### Bulk Selection Pattern

```tsx
function useBulkSelection<T extends { id: string }>(data: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isAllSelected = data.length > 0 && data.every((item) => selectedIds.has(item.id));
  const isSomeSelected = selectedIds.size > 0;
  const selectedCount = selectedIds.size;

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((item) => item.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  return { selectedIds, isAllSelected, isSomeSelected, selectedCount, toggleOne, toggleAll, clearSelection };
}
```

#### Empty State and Clear Filters UX

```tsx
function EmptyState({ hasFilters, onClearFilters }: { hasFilters: boolean; onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Illustration placeholder */}
      <svg className="mb-4 h-24 w-24 text-slate-300" /* ... */ />

      {hasFilters ? (
        <>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">
            No results found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Try adjusting your search or filter criteria.
          </p>
          <button
            onClick={onClearFilters}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Clear Filters
          </button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">
            No data yet
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Get started by creating your first entry.
          </p>
        </>
      )}
    </div>
  );
}
```

#### Sortable Column Header

```tsx
interface SortableHeaderProps {
  label: string;
  column: string;
  currentSortBy: string | null;
  currentSortOrder: 'asc' | 'desc' | null;
  onSort: (col: string | null, order: 'asc' | 'desc' | null) => void;
}

function SortableHeader({ label, column, currentSortBy, currentSortOrder, onSort }: SortableHeaderProps) {
  const isActive = currentSortBy === column;

  function handleClick() {
    if (!isActive) {
      onSort(column, 'asc');                          // None → ASC
    } else if (currentSortOrder === 'asc') {
      onSort(column, 'desc');                         // ASC → DESC
    } else {
      onSort(null, null);                             // DESC → None
    }
  }

  return (
    <th>
      <button
        onClick={handleClick}
        className="flex items-center gap-1 font-medium"
        aria-sort={isActive ? (currentSortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        {label}
        <span aria-hidden="true">
          {isActive && currentSortOrder === 'asc' && '▲'}
          {isActive && currentSortOrder === 'desc' && '▼'}
          {!isActive && '⇅'}
        </span>
      </button>
    </th>
  );
}
```

#### Request Cancellation for Race Conditions

The `useDataTable` hook above uses `AbortController` to cancel in-flight requests when params change. On the API client side:

```typescript
// api-client usage
async function fetchPages(params: DataTableParams): Promise<DataTableResult<Page>> {
  const { data } = await api.get('/admin/pages', {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      search: params.search,
      ...params.filters,
    },
  });
  return { data: data.items, total: data.total, totalPages: data.totalPages };
}
```

The search debounce (300ms) at the input level + `AbortController` cancellation at the fetch level is a two-layer defense against the race condition edge case described in the spec (typing "garden", clearing, typing "house" — the "garden" request is either never sent or aborted).

---

## Summary of Decisions

| # | Topic | Decision | Key Rationale |
|---|---|---|---|
| 1 | Drag-and-Drop | **@dnd-kit** + **react-dropzone** (file upload) | React 18 native, best a11y, smallest bundle, actively maintained |
| 2 | Charts | **Recharts** | Simplest for one bar chart, SVG (accessible), React-idiomatic, smallest footprint |
| 3 | Toasts | **Sonner** | Built-in `visibleToasts` limit, dark mode, small bundle, modern UX |
| 4 | JWT Refresh | In-memory access + httpOnly cookie refresh + token rotation | Security best practice; `cookie-parser` only new dependency |
| 5 | RBAC | Role → RolePermission → Permission join table + `authorize()` middleware | Granular, extensible, hierarchy-aware, self-lockout-safe |
| 6 | Admin Layout | CSS `dark:` class + React Context + localStorage + `useMatches()` breadcrumbs | Tailwind-native, zero runtime overhead, React Router v6 idiomatic |
| 7 | Data Table | Custom `useDataTable` hook + URL state sync + headless components | Full control, minimal bundle, matches bespoke UX requirements |

### New Dependencies to Install

| Package | Approx. Size (gz) | Purpose |
|---|---|---|
| `@dnd-kit/core` | 11 kB | Drag-and-drop engine |
| `@dnd-kit/sortable` | 3.5 kB | Sortable list preset |
| `@dnd-kit/utilities` | 1 kB | CSS transform helpers |
| `react-dropzone` | 2 kB | File drag-and-drop upload |
| `recharts` | 45 kB | Bar chart on dashboard |
| `sonner` | 6 kB | Toast notifications |
| `cookie-parser` | 2 kB | Express cookie parsing (API) |
| `@types/cookie-parser` | - | TypeScript types (dev) |

**Total new client-side bundle addition**: ~68.5 kB (gzipped), all tree-shakeable.
