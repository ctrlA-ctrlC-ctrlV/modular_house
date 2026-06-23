# Phase 0 Research: Admin Panel — Phase 1 (UI & Access)

**Feature**: `012-panel-phase-1` | **Date**: 2026-06-23

This document resolves the unknowns and technology choices behind the plan. Each item follows
**Decision / Rationale / Alternatives considered**. There are no remaining NEEDS CLARIFICATION
items after this phase.

---

## R1. Porting Tailwind v4 + OKLCH design system into the Vite app

**Context**: The reference template is Next.js 16 + Tailwind v4. The current `apps/web` uses
Bootstrap 5 + custom CSS and has **no Tailwind** (verified: no `tailwind`/`@tailwind` references in
`apps/web`). The brief flags this as the top risk and asks for a de-risking spike.

**Decision**: Add Tailwind CSS v4 (PostCSS plugin `@tailwindcss/postcss`) **scoped to the admin
layer only**. Author the OKLCH token set as CSS custom properties on a single admin root selector
(e.g. `.admin-root` / `[data-admin]`) plus `.dark` variant, so Tailwind utilities and tokens apply
only inside the admin subtree and never cascade into the public Bootstrap pages. Ship only the
`Default` preset and one font.

**Rationale**: Tailwind v4's CSS-first config (`@theme`) maps directly onto the template's token
model; scoping to a root selector gives the FR-004 isolation guarantee without a separate build or
package. A short spike (tokens + Button/Input/Card/Sidebar) de-risks before broad work.

**Alternatives considered**:
- Migrate the whole app to Tailwind — rejected: high blast radius on the public site (YAGNI/risk).
- Put the admin design system in `@modular-house/ui` — rejected: that package serves the public
  marketing site; mixing would break loose coupling (FR-004).
- Inline styles / CSS modules without Tailwind — rejected: loses shadcn primitive parity and the
  token-swap extensibility the brief requires (Open-Closed, FR-029).

---

## R2. shadcn-style primitives without the shadcn CLI / Next.js

**Decision**: Hand-port the minimal primitive set (`Button`, `Input`, `Label`, `Card`,
`DropdownMenu`, `Avatar`, `Sidebar`, `Sheet`, `Form`, `InputOTP`, `Sonner` host) from the template
source into `apps/web/src/admin/ui/`, backed by Radix UI packages + `class-variance-authority`,
`tailwind-merge`, `clsx`, and a local `cn()` helper. Keep `data-slot`/`data-variant`/`data-size`
attributes for styling + testing parity with the template.

**Rationale**: shadcn components are copy-in source, not a runtime dependency, so they port cleanly
to Vite. Radix is framework-agnostic React. Only the Phase 1 subset is added (YAGNI).

**Alternatives considered**:
- shadcn CLI generation — rejected: assumes Next.js project conventions/aliases.
- A third-party component kit (MUI, Mantine) — rejected: would not match the template's visual
  parity target (SC-004) and pulls a large dependency.

---

## R3. Two-factor delivery: email OTP vs authenticator TOTP

**Decision**: Email a 6-digit numeric OTP on every successful password verification, delivered via
the existing `MailerService` (nodemailer). Store the code argon2-hashed with a 10-minute TTL,
single-use, 5-attempt cap, and invalidate prior codes on re-request. `login` returns an opaque
`challengeId` (stable across resends) that `verify-2fa`/`resend-code` use to locate the active code
without re-sending the email or exposing the account.

**Rationale**: The brief explicitly resolved this — reuse the existing SMTP mailer, no new vendor or
authenticator-app method (DRY/KISS). The mailer already pools connections and retries.

**Alternatives considered**:
- Authenticator-app TOTP / SMS — rejected by the brief (new dependency/vendor, out of scope).
- Magic-link sign-in — rejected: the spec requires a code-entry step after password (US1).

---

## R4. Session strategy: in-memory access token + httpOnly refresh cookie

**Decision**: Replace the legacy JWT-in-`localStorage` flow with a short-lived (15m) JWT access
token held **in memory** on the client, plus an opaque refresh token in an **httpOnly, Secure,
SameSite=Strict** cookie, stored hashed using the existing `RefreshToken` family-rotation model.
The web client performs a silent refresh on `401`/expiry.

**Rationale**: Minimizes client-side theft exposure (FR-040), reuses the already-modeled
`RefreshToken` rotation + theft detection (DRY), and supports account-wide revocation on credential
change (FR-041). `cookie-parser` is already a dependency.

**Alternatives considered**:
- Keep JWT in `localStorage` — rejected: XSS-exposed, contradicts FR-040 and the brief's session
  decision.
- Server-side session store (Redis) — rejected: adds infrastructure; the refresh-token table
  already provides revocation semantics (KISS).

---

## R5. RBAC enforcement: permission-based middleware vs role-string checks

**Decision**: Add `requirePermission(resource, action)` middleware that resolves the user's role →
`RolePermission` → `Permission` set (loaded once into the access-token claims / request context) and
checks the required pair. Keep the existing `authenticateJWT`; deprecate direct `requireRole` for new
routes.

**Rationale**: Matches the brief's RBAC matrix and the Open-Closed goal — adding a role/permission
never requires editing route code (FR-036). Phase 1 only needs the plumbing; management UI is Phase 3.

**Alternatives considered**:
- Hardcoded role-string checks (`requireRole('admin')`) — rejected: brittle, violates Open-Closed,
  contradicts the brief's "access checks" decision.

---

## R6. Account-wide session revocation on credential change

**Decision**: On password reset (link) and password change (settings), revoke **all** of the user's
`RefreshToken` families. For the settings-page change, immediately mint a fresh family for the acting
session so it stays signed in (FR-041); the reset flow leaves the user signed out (must re-login).

**Rationale**: Ensures a stolen/stale session cannot outlive a credential change (FR-041, security
edge cases) while keeping the deliberate UX difference between reset (full sign-out) and self-service
change (stay signed in).

**Alternatives considered**:
- Revoke only the current family — rejected: leaves other devices valid after a credential change,
  violating FR-041.
- Token version counter on `User` — viable but redundant given the existing family model; rejected
  for DRY.

---

## R7. Per-user UI preferences: new table vs existing `Setting`

**Decision**: Add a dedicated `UserPreference` table (one row per user) holding `themeMode` and
`sidebarCollapsed`. Persist server-side; server-stored values are returned in `me` (and via
`GET /admin/settings/preferences`) for authoritative cross-device load. The client also writes a
cookie/localStorage mirror that the pre-paint boot script reads to avoid FOUC — the mirror is only
the pre-paint cache, not the source of truth.

**Rationale**: The existing `Setting` table is global key-value site config; per-user UI state needs
user-scoped rows. A small dedicated table keeps cohesion high and avoids overloading `Setting`. The
cookie mirror is required because the server token is in memory and unavailable before first paint.

**Alternatives considered**:
- Store preferences as JSON on `User` — rejected: mixes UI state into the core auth model; harder to
  extend with future preset/font preferences (FR-029).
- Client-only persistence (no DB) — rejected: spec requires persistence across sessions/devices and
  the brief lists per-user preferences as an entity.

---

## R8. Theme flash (FOUC) prevention in a client-rendered SPA

**Decision**: Inject a tiny synchronous boot script in `index.html` (before the app bundle) that
reads the persisted theme + sidebar state from a cookie/localStorage mirror and sets the
`data-theme`/`class="dark"` and sidebar attribute on the admin root before first paint.

**Rationale**: Admin is client-rendered, so the theme must be applied pre-hydration. This mirrors the
template's boot-script pattern and satisfies SC-006 (no wrong-theme frame).

**Alternatives considered**:
- Apply theme in a React effect — rejected: runs after first paint, causes a flash.
- SSR the admin shell — rejected: admin is explicitly client-only (no SEO need), out of scope.

---

## R9. Profile photo storage

**Decision**: Store the photo as `Bytes` (+ MIME) on `User` in Phase 1, validated server-side for
type (PNG/JPEG/WebP) and size (<= 5 MB) using the existing `multer` memory storage; serve via an
authenticated `GET /admin/settings/photo` (image response; `404` when none set). `me` exposes
`hasProfilePhoto` so the client knows whether to fetch the bytes or render the initials fallback.

**Rationale**: Consistent with the project's database-backed media direction; avoids standing up the
full media library (Phase 2). `multer` is already a dependency.

**Alternatives considered**:
- Filesystem/object storage now — rejected: premature; full media migration is Phase 2 (YAGNI).
- Separate `Media` table now — rejected: Phase 2 scope; a nullable column on `User` is sufficient and
  reversible.

---

## R10. Password policy as a single shared validator

**Decision**: Implement one `passwordPolicy` module (min 12 / max 128, requires lower+upper+digit,
not equal to current password) used identically by the reset and settings-change paths, enforced
server-side and mirrored client-side for UX only.

**Rationale**: FR-019 mandates a single policy enforced identically everywhere; one module is the DRY
single source of truth and the only place tests must pin the thresholds (§2.4).

**Alternatives considered**:
- Duplicate inline checks per route — rejected: drift risk, violates DRY and FR-019.
- Heavy breach-list/zxcvbn check — deferred: "not a common/breached password" is an assumption-level
  nice-to-have; Phase 1 ships the basic strength rules, leaving the module open for extension.

---

## R11. Deterministic time in OTP/reset/lockout tests

**Decision**: Inject a clock (function returning `Date`) into the OTP, reset-token, and lockout
services so tests can advance time deterministically; never assert on real `Date.now()`.

**Rationale**: Constitution III requires deterministic tests with controlled time; TTL/expiry/lockout
boundaries (B3, C2, A3) must be asserted exactly.

**Alternatives considered**:
- `vi.useFakeTimers()` only — acceptable but a constructor-injected clock is cleaner for service unit
  tests and keeps the boundary logic explicit.

---

## R12. Legacy admin removal

**Decision**: Remove the legacy admin routes/components (`apps/web/src/routes/admin/login.tsx`,
`index.tsx`, `guard.tsx`, and legacy dashboard/list pages that belong to the old panel) and the
legacy `localStorage` token flow, replacing them with the new `apps/web/src/admin/` layer and routes.
Retain backend list endpoints still needed by Phase 2+ but re-gate them behind `requirePermission`.

**Rationale**: SC-007/FR-001 require no legacy admin UI remains reachable. Removal happens alongside
the new shell so there is never a window with two admin UIs.

**Alternatives considered**:
- Keep legacy pages hidden behind a flag — rejected: leaves reachable legacy routes, violates SC-007.

---

## Resolved summary

| # | Topic | Decision |
|---|-------|----------|
| R1 | DS port | Tailwind v4 + OKLCH tokens scoped to admin root, Default preset only |
| R2 | Primitives | Hand-port shadcn subset on Radix + cva/clsx/tailwind-merge |
| R3 | 2FA | Email 6-digit OTP via existing mailer, 10m TTL, single-use, 5-attempt cap |
| R4 | Session | In-memory access JWT (15m) + httpOnly refresh cookie (7d) with rotation |
| R5 | RBAC | `requirePermission(resource, action)` from Role->Permission |
| R6 | Revocation | Account-wide on reset/change; settings-change re-mints acting session |
| R7 | Preferences | New `UserPreference` table + cookie mirror for pre-paint |
| R8 | FOUC | Synchronous boot script in `index.html` |
| R9 | Photo | `Bytes`+MIME on `User`, multer validation, initials fallback |
| R10 | Policy | Single shared `passwordPolicy` module, server-enforced |
| R11 | Test time | Injected clock for deterministic TTL/lockout tests |
| R12 | Legacy | Remove old admin UI + localStorage flow with the new layer |
