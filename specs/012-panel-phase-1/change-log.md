# The Change Log of Branch 012-panel-phase-1
Note: keep the most latest entry on top

> ## [YYYY-MM-DDTHH:mm:ss.sss+00:00] - [git commit hash] - [commit title] (one line summary, only include section true to the commit)
> ### Added 
> - 
> 
> ### Changed
> - 
> 
> ### Fixed
> - 
> 
> ### Removed
> - 
> 
> ### Security
> - 
---

## [2026-07-06T15:50:00.000+00:00] - [pending] - test(admin-auth): T101 audit events integration test

### Added
- `apps/api/tests/integration/audit-events.test.ts` — 10 integration tests driving every authentication flow against the test DB and asserting the reused `AuditLog` table receives exactly the expected I1 action: LOGIN_SUCCESS + OTP_ISSUED (login success), LOGIN_FAILURE (known-account wrong password), OTP_VERIFIED (verify-2fa success), OTP_ISSUED (resend-code success), LOGOUT, PASSWORD_RESET_REQUESTED (forgot-password known non-throttled), PASSWORD_RESET_COMPLETED (reset-password), PASSWORD_CHANGED (settings password). I2 coverage: unknown-email login failure and unknown-email forgot-password produce NO audit row (null userId skipped by AuditLogService). I3 coverage: the raw password, OTP code, and reset token are asserted absent from every audit row's writable fields. MailerService mocked at the module boundary; per-test audit slate scoped to the test user. TDD red-phase unverifiable retroactively — T100a (impl) precedes T101 (test) by explicit Session 34 task ordering (option b), same accepted non-blocking pattern as T023/T065/T086.

---

## [2026-07-06T15:45:00.000+00:00] - [pending] - feat(admin-auth): T100a wire AuditLogService into auth and settings routes

### Added
- `apps/api/src/routes/admin/auth.ts` — wired `AuditLogService.log()` (T016) into all seven auth-route I1 call sites: `LOGIN_SUCCESS` + `OTP_ISSUED` (POST /login success branch), `LOGIN_FAILURE` (POST /login failure branch), `OTP_VERIFIED` (POST /verify-2fa success only), `OTP_ISSUED` (POST /resend-code success), `PASSWORD_RESET_REQUESTED` (POST /forgot-password known-email non-throttled branch only), `PASSWORD_RESET_COMPLETED` (POST /reset-password success), `LOGOUT` (POST /logout). Added a module-level `AuditLogService` (sharing the existing Prisma client) and a `recordAudit` helper that awaits the write but swallows+logs any failure so audit never alters the HTTP response (FR-037). `entity: 'user'` is consistent across all calls; only action/entity/userId/ipAddress/userAgent are passed (I3 — no code, token, or password). `ipAddress` from `req.ip ?? 'unknown'`, `userAgent` from `req.headers['user-agent'] ?? null` (I2). POST /login resolves the acting userId by email once for both branches (null on unknown email → AuditLogService skips the write per the non-null FK constraint, I2); `verifyCredentials` surfaces userId on neither branch so the lookup is required.
- `apps/api/src/routes/admin/settings.ts` — wired `PASSWORD_CHANGED` (I1) into PUT /admin/settings/password success branch via the same `AuditLogService` + `recordAudit` pattern; placed after the successful `changePassword` so 401/403/400 branches return before any audit write.

### Security
- FR-037 / I1–I3: every authentication-related event in the I1 set is now persisted to the reused `AuditLog` table. Unknown-email login failures pass `userId: null` and are silently skipped (no row) so the audit trail never records a non-existent account, while known-account failures (wrong password, deactivated, locked) record the real userId for brute-force traceability. No secret (password, OTP code, reset token) is ever passed to the audit writer.

---

## [2026-07-06T14:55:00.000+00:00] - [pending] - fix(admin/shell): apply Session 31 review nits for T098

### Fixed
- `apps/web/src/App.tsx` — added `.catch()` to the fire-and-forget preferences PUT so a network-level rejection (DNS, connection refused, CORS) doesn't become an unhandled promise rejection; `apiClient.fetch` resolves on non-2xx HTTP statuses but rejects on transport failure, and the catch swallows those silently since the optimistic local state + cookie mirror already applied.
- `apps/web/src/admin/theme/ThemeProvider.tsx` — replaced the local `interface Preferences` with `import type { Preferences } from '../auth/types.js'` (re-exported), eliminating the structural duplicate that could drift silently; `auth/types.ts` is now the single source of truth matching the OpenAPI Preferences schema.

---

## [2026-07-06T14:10:00.000+00:00] - [pending] - test(admin/shell): add mobile off-canvas drawer test (T100)

### Added
- `apps/web/src/admin/shell/mobile.test.tsx` — 8 tests pinning T-F5: below the 768px breakpoint (matchMedia `(max-width: 767px)` mocked to match) the desktop sidebar is absent from normal flow and the sidebar renders as an off-canvas Radix Dialog drawer (`data-mobile="true"`, `fixed` overlay) that opens via the sidebar trigger and closes on a second toggle; all four top-bar controls remain present and keyboard-focusable on mobile; the no-horizontal-scroll contract at >=320px is pinned structurally (admin root `w-full`, drawer `fixed` out of flow, no in-flow `sidebar-gap`) since jsdom cannot compute layout.

---

## [2026-07-06T14:05:00.000+00:00] - [pending] - test(admin/shell): add keyboard operability test (T099)

### Added
- `apps/web/src/admin/shell/keyboard.test.tsx` — 7 tests pinning T-F3: every always-visible shell control (sidebar identity, user-section, sidebar-trigger, preferences, theme-toggle, account) is keyboard-focusable with the H4 focus-visible ring (`ring-3 ring-ring/50`), and Ctrl/Cmd+B toggles the sidebar (H2) via the SidebarProvider window listener driving the controlled ThemeProvider collapse state (`data-sidebar-collapsed`). Plain B without a modifier is ignored.

---

## [2026-07-06T12:41:16.510+00:00] - [f552f87] - feat(admin/shell): wire theme + sidebar server round-trip (T098)

### Added
- `apps/web/src/admin/theme/ThemeProvider.tsx` — optional `initialPreferences` + `onPreferencesChange` props; adopts the server-stored preference from /me once as authoritative (H1/H2), refreshes the cookie mirror for pre-paint, and notifies the parent with the full preferences object on every local toggle. Exports the `Preferences` type.
- `apps/web/src/admin/shell/AppShell.tsx` — `preferences`/`onPreferencesChange` props forwarded to ThemeProvider; inner `ShellLayout` reads `useTheme()` and drives `SidebarProvider` as a controlled component (`open = !sidebarCollapsed`, `onOpenChange` inverts) so the sidebar's open/closed state binds to the single server-persisted source of truth.
- `apps/web/src/App.tsx` — `AdminShell` wires `auth.user.preferences` into AppShell and PUTs the full object to `/admin/settings/preferences` fire-and-forget (FR-024); local state + cookie mirror update optimistically so the UI never waits on the network.

### Changed
- Sidebar collapse now flows through ThemeProvider (server-persisted, cookie `admin_sidebar_collapsed`) instead of the SidebarProvider's own `sidebar_state` cookie as the source of truth; the primitive still writes `sidebar_state` as a side effect but it is no longer authoritative.

---

## [2026-07-06T12:40:00.000+00:00] - [bf5aef9] - test(admin/shell): add theme + sidebar persistence test (T098)

### Added
- `apps/web/src/admin/shell/persistence.test.tsx` — 5 integration tests rendering the real App at `/admin/settings` with a mocked transport and pre-set access token: /me hydration adopts server preferences as authoritative (H1/H2), theme toggle PUTs the full preferences object to `/admin/settings/preferences` (FR-024), sidebar toggle PUTs the new `sidebarCollapsed`, remount restores state from the server with the cookie mirror kept in sync (no flash, T-F2), and a stale cookie is corrected from the server on hydration. Confirmed red before the wiring landed.

---

## [2026-07-03T09:00:00.000+00:00] - [pending] - test(admin/pages): add Settings page test (T094)

### Added
- `apps/web/src/admin/pages/Settings.test.tsx` — 17 tests across 5 describe blocks: password-change
  form (current + new twice, mismatch rejection, server-error surfacing), profile photo (initials
  fallback, upload/remove wiring, client-side G1/G2 rejection), read-only name/email (FR-034),
  super_admin read-only (FR-035), and unauthenticated redirect via the real `AuthProvider`/`AdminGuard`
  (not a stub). Confirmed red: fails on missing `./Settings.js` import before T095.

---

## [2026-07-03T09:15:00.000+00:00] - [pending] - feat(admin/pages): implement Settings page (T095)

### Added
- `apps/web/src/admin/pages/Settings.tsx` — own-account settings page. Reads identity/role from
  `useAuth()`; wires password change (`PUT /admin/settings/password`) and profile-photo
  upload/remove/fetch (`PUT`/`DELETE`/`GET /admin/settings/photo`) directly to the admin `apiClient`.
  Photo bytes are fetched with the authenticated client and rendered via an object URL (G6) rather
  than a bare `<img src>`, since the endpoint requires a Bearer token. Client-side mirrors of G1
  (accepted MIME types) and G2 (5 MB max) give immediate feedback; the server stays authoritative.
  Name/email render as read-only text (FR-034). The `super_admin` account hides both the
  password-change and photo-edit cards entirely and shows a database-only notice (FR-035).
  All 17 T094 tests pass; `pnpm --filter @modular-house/web test:run` 208/208, lint + typecheck clean.

---

## [2026-07-03T09:30:00.000+00:00] - [pending] - feat(admin): T096 wire admin routing into the SPA

### Added
- `apps/web/src/App.tsx` — mounts the full `/admin/*` route tree: `/admin/login`, `/admin/two-factor`,
  `/admin/forgot-password`, and `/admin/reset-password` render standalone (each wrapped in a new local
  `AdminRoot` helper that applies the `.admin-root`/`[data-admin]` scoping the Tailwind v4 + OKLCH
  token layer requires — the pre-auth pages don't self-apply this wrapper). `/admin` and `/admin/settings`
  sit behind a new local `AdminShell` layout component (`AuthProvider` → `AdminRoot` → `AdminGuard` →
  `AdminShell`) that derives the sidebar/top-bar `UserShellData` from `useAuth()` and renders `AppShell`
  around an `<Outlet />`; the index route and any unmatched `/admin/*` path redirect to `/admin/settings`
  (no dashboard/widgets in Phase 1 per plan §5.2). `admin.css` is imported once here so the token layer
  reaches the real bundle for the first time (previously wired by T002/T003 but never imported anywhere).

### Changed
- `apps/web/src/App.tsx` — replaced the "admin routes will be wired in" placeholder comment with the
  live route tree; updated the file's docstring to explain why admin routes are NOT added to
  `route-config.tsx`.

### Notes
- `apps/web/src/route-config.tsx` — intentionally left unchanged. Its `routes` array also feeds
  `scripts/sitemap-generator.ts` and `scripts/prerender.ts`; the admin panel is client-only and
  authenticated, so it must never appear in the sitemap or prerendered output.
- Scope note: no task explicitly assigns wiring the pre-auth pages' `onSubmit`/`onResend` callbacks to
  real `apiClient` calls (login → OTP → session → navigate). T096's own Files:/Done-when are limited to
  routing/mounting, so those callbacks remain the placeholder no-ops they were left as in T086–T089.
  Flagged as a blocker for the next planning pass — see handoff.

---

## [2026-07-03T09:45:00.000+00:00] - [pending] - test(admin): T097 legacy admin fully removed regression

### Added
- `apps/api/tests/integration/legacy-removed.test.ts` — 11 tests. Git history confirms no backend admin
  route file was ever deleted (the `/admin/auth/*` mount point is unchanged since the very first commit),
  so the "old legacy route returns 404" assertion targets flat/legacy-shaped paths that never existed
  under the current nested router (`GET /admin`, `GET|POST /admin/login`, `POST /admin/logout`,
  `GET /admin/dashboard`) as a regression guard against reintroducing one, plus a check that
  `POST /admin/auth/login` never returns `token`/`accessToken`/`user`/`roles` (the pre-Phase-1 contract),
  plus a consolidated re-gation spot-check across the five retained content endpoints.
- `apps/web/src/admin/__tests__/no-legacy.test.tsx` — 5 tests using `import.meta.glob` (not `node:fs`,
  which isn't typed in this app's browser-targeted tsconfig) to scan every non-test source file under
  `apps/web/src` for the literal string `adminToken`, confirm `src/routes/admin/**` has zero remaining
  modules, and render the real `App` tree at `/admin`, `/admin/login`, and an unmatched `/admin/*` path
  to confirm only the new login page ever resolves (never a legacy dashboard).

### Verification
- `pnpm --filter @modular-house/api test:run -- --no-file-parallelism` — 307/307 pass.
- `pnpm --filter @modular-house/web test:run` — 213/213 pass.
- Both new files' lint + typecheck clean.

---

## [2026-07-03T11:00:00.000+00:00] - [pending] - fix(admin/shell): apply Session 30 corrective item for T095

### Added
- `apps/web/src/admin/auth/usePhotoUrl.ts` — hook that fetches the authenticated user's profile-photo
  bytes via `apiClient.fetch()` and exposes them as an object URL, re-fetching only when
  `hasProfilePhoto` changes; revokes the previous object URL on cleanup.
- `apps/web/src/admin/shell/AppShell.test.tsx` — 2 new tests covering `hasProfilePhoto: true`: assert
  the authenticated `/admin/settings/photo` fetch fires and that no `<img src="/admin/settings/photo">`
  ever renders directly; assert no fetch fires at all when `hasProfilePhoto` is `false`. This path was
  previously untested (existing tests only covered `hasProfilePhoto: false`), which is how the bug went
  unnoticed until the T095 review.

### Fixed
- `apps/web/src/admin/shell/UserSection.tsx` — sidebar avatar now uses `usePhotoUrl()` instead of a bare
  `<img src="/admin/settings/photo">`. `GET /admin/settings/photo` requires a Bearer token (G6); a plain
  `<img>` tag sends no `Authorization` header, so the request always 401'd and the sidebar silently fell
  back to initials even when a photo was uploaded (broke the sidebar half of US4-4/US4-5).
- `apps/web/src/admin/shell/TopBar.tsx` — same bug, same fix, found by inspection while fixing
  `UserSection.tsx` (the review cited only `UserSection.tsx:43`, but the top-bar account-menu avatar had
  the identical unauthenticated `<img src>` pattern at line 229).

### Verification
- `pnpm --filter @modular-house/web test:run` — 215/215 pass.
- Lint + typecheck clean on all four touched files.

---

## [2026-07-03T11:30:00.000+00:00] - [pending] - test(admin/pages): T097a pre-auth page wiring test

### Added
- `apps/web/src/admin/pages/preAuthWiring.test.tsx` — 10 tests rendering the real `App` tree (not a
  stubbed route table) driving Login → TwoFactor → session, resend-code, ForgotPassword's neutral
  confirmation, and ResetPassword's consume-and-navigate flow, plus one representative error case for
  each of 423/429 (login), 401 (verify-2fa), and 400/410 (reset-password) — covering all five status
  codes named in the task text. All 10 fail against the current build (no fetch is issued from any
  pre-auth page today), confirming the TDD red phase per T097a's own "Done when".

---

## [2026-07-03T12:00:00.000+00:00] - [pending] - feat(admin): T097b wire pre-auth pages to the auth client

### Added
- `apps/web/src/App.tsx` — four new local container components (`LoginContainer`,
  `TwoFactorContainer`, `ForgotPasswordContainer`, `ResetPasswordContainer`), matching the existing
  `AdminRoot`/`AdminShell` in-file pattern. Each owns its own `error`/`isSubmitting`/`message` state and
  calls `apiClient.fetch(url, { skipAuth: true, ... })`:
  - Login → `POST /admin/auth/login` → `200` navigates to `/admin/two-factor` passing `challengeId` via
    router state (never the URL, per B9); non-2xx surfaces the response `message` via `error`.
  - TwoFactor → reads `challengeId` from router state (redirects to `/admin/login` if absent);
    `POST /admin/auth/verify-2fa` → `200` calls `apiClient.setAccessToken()` then navigates to `/admin`
    (the mounted `AuthProvider` hydrates itself via `fetchMe()`); `onResend` → `POST
    /admin/auth/resend-code`, disabling the button only while in flight (the cooldown countdown stays
    deferred to T116 per the existing T085 note).
  - ForgotPassword → `POST /admin/auth/forgot-password` → any 2xx sets `isSubmitted=true` regardless of
    body (C4 neutral confirmation).
  - ResetPassword → `POST /admin/auth/reset-password` with the URL's `token` → `200` navigates to
    `/admin/login`; `400`/`410` surface the response `message` via `error`.
  - The routes for `/admin/login`, `/admin/two-factor`, `/admin/forgot-password`, and
    `/admin/reset-password` now render these containers instead of the bare presentational pages;
    `Login.tsx`/`TwoFactor.tsx`/`ForgotPassword.tsx`/`ResetPassword.tsx` are unchanged.

### Verification
- `apps/web/src/admin/pages/preAuthWiring.test.tsx` (T097a) — 10/10 pass (was 10/10 failing before this
  commit).
- `pnpm --filter @modular-house/web test:run` — 225/225 pass.
- Lint + typecheck clean.

### Notes
- **Literal browser walk-through not performed** — see `quickstart.md` §5a. `apps/api/.env` (the file
  `pnpm dev` loads by default) points at the real production SMTP relay and a non-test database port;
  starting the dev server against it risks sending a real email, which isn't a reversible action to take
  without explicit sign-off. Flagged as an open item for a human operator to close with a safe env.

---

## [2026-07-02T16:35:00.000+00:00] - 59b2a0f - fix(admin/auth): apply Session 28 corrective item for T092

### Fixed
- `apps/web/src/admin/auth/AuthProvider.tsx` — `AuthContextValue` now exposes `role`/`permissions` as top-level fields (derived from `user`), per T092's literal "expose user/role/permissions" wording; previously only reachable via `user.role`/`user.permissions`
- `apps/web/src/admin/auth/auth.test.tsx` — added a test pinning `role`/`permissions` availability from `useAuth()` once authenticated

---

## [2026-07-02T15:47:00.000+00:00] - 4ec46e9 - feat(admin/auth): implement auth client, AuthProvider, and route guard

### Added
- `apps/web/src/admin/auth/types.ts` — shared `Me`/`Session`/`Preferences` types matching the OpenAPI schemas
- `apps/web/src/admin/auth/apiClient.ts` — in-memory access token store, `credentials: 'include'` for the refresh cookie, silent refresh-and-retry on 401 (T091)
- `apps/web/src/admin/auth/AuthProvider.tsx` — session hydration via `/admin/auth/me`, exposes user/isAuthenticated/isLoading/logout (T092)
- `apps/web/src/admin/auth/guard.tsx` — `AdminGuard` redirects unauthenticated access to `/admin/login` (T093)
- `apps/web/src/admin/auth/auth.test.tsx` — 10 tests pinning in-memory token storage, silent refresh, logout, and guard redirect (T090)

### Changed
- `apps/web/src/admin/auth/apiClient.ts` — base URL corrected from hardcoded `/api` to `VITE_API_BASE_URL`, matching the existing convention in `apps/web/src/lib/apiClient.ts` (the backend mounts routes at the root, not under `/api`)

---

## [2026-07-02T13:50:00.000+00:00] - 007eff7 - fix(admin/pages): apply Session 26 corrective items for T089

### Fixed
- `apps/web/src/admin/pages/ResetPassword.tsx` — reworded misleading comment at line 178 ("Hidden token field" → "Visible alert when no token is present in the URL query string")
- `apps/web/src/admin/pages/ResetPassword.tsx` — added direct link to `/admin/forgot-password` in missing-token error state per FR-017

---

## [2026-07-02T13:06:00.000+00:00] - cdb455f - feat(admin/pages): implement TwoFactor, ForgotPassword, and ResetPassword pages

### Added
- `apps/web/src/admin/pages/TwoFactor.tsx` — 6-digit OTP code entry with InputOTP, resend control, challengeId binding
- `apps/web/src/admin/pages/ForgotPassword.tsx` — email entry form with neutral confirmation (C4)
- `apps/web/src/admin/pages/ResetPassword.tsx` — token consumption, new+confirm password fields with policy mirror

### Changed
- `apps/web/src/admin/pages/preAuth.test.tsx` — replaced stubs with real component imports; added 9 new assertions (19 total)

---
