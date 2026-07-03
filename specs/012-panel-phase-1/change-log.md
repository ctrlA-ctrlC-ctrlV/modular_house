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
