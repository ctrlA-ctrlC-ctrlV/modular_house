# Implementation Plan: Admin Panel — Phase 1: Foundation (UI & Access)

**Branch**: `012-panel-phase-1` | **Date**: 2026-06-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/012-panel-phase-1/spec.md`

## Summary

Rebuild the admin panel from scratch inside the existing React/Vite SPA as a client-only,
authenticated-only section. Phase 1 delivers the security gate and the reusable chrome: it ports
the Studio Admin design system (Tailwind v4 + OKLCH tokens + shadcn-style primitives) into a
dedicated admin UI layer, rebuilds the login ("login v1" without Google, registration replaced by
password reset), stands up the collapsible app shell (sidebar with a faded "Coming Soon" content
area and a bottom user section; 48px top bar with sidebar-collapse, UI-preference, dark-mode and
account controls — no GitHub button), and wires database-backed authentication with **email-based
two-factor on every sign-in**, **self-service password reset**, **account lockout**, **refresh-token
rotation**, **audit logging**, and a **user settings page** (password change, profile photo,
read-only name/email; `super_admin` read-only).

The backend reuses the feature-006 schema (`User`, `Role`, `Permission`, `RolePermission`,
`RefreshToken`, `AuditLog`) and adds only the minimal new structures for the one-time login code,
the password-reset token, and the user's display name + profile photo. Delivery of both the OTP
and the reset link reuses the existing SMTP `MailerService` (nodemailer). The legacy admin UI and
the legacy JWT-in-`localStorage` flow are removed.

---

## 1. Scope & Context

> The exact technical surface for this phase. **Non-goals are binding** — anything not listed as
> in-scope below is out of scope and MUST NOT be built in Phase 1.

### 1.1 In scope — modules & surfaces

**Frontend (`apps/web`), new admin UI layer under `src/admin/`:**

- Design-system port: Tailwind v4 + OKLCH token layer (`Default` preset, single font), scoped so
  it cannot leak into the public Bootstrap-based marketing site.
- shadcn-style primitives needed for Phase 1 only: `Button`, `Input`, `Label`, `Card`,
  `DropdownMenu`, `Avatar`, `Sidebar`, `Sheet` (mobile drawer), `Form` field wrappers, `Sonner`
  toast host, `InputOTP` (code entry), `ThemeProvider`.
- Pre-auth pages: `login`, `two-factor` (code entry), `forgot-password` (request), `reset-password`
  (consume link + set new password).
- App shell: collapsible sidebar (icon rail / off-canvas drawer), faded "Coming Soon" content
  region, bottom user section, 48px top bar (sidebar-collapse, UI-preference, dark-mode, account).
- User settings page: password change, profile-photo upload/remove, read-only name + email.
- Client auth state: in-memory access token + silent refresh; route guard; theme + sidebar
  preference boot script (pre-paint, no FOUC).

**Backend (`apps/api`):**

- Rewrite `AuthService` and `routes/admin/auth.ts` to: verify credentials → enforce lockout →
  issue + email OTP → verify OTP → mint access token + rotating refresh token (httpOnly cookie).
- New routes/services: `verify-2fa`, `resend-code`, `forgot-password`, `reset-password`,
  `refresh`, `logout`, `me`, `settings/password`, `settings/photo` (upload/get/remove),
  `settings/preferences` (get/put).
- `requirePermission(resource, action)` middleware driven by `Role → RolePermission → Permission`.
- One-time-code service, password-reset-token service, password-policy validator, audit-log writer.
- Account-wide session revocation on password change/reset.
- Prisma migration adding `LoginCode`, `PasswordResetToken`, `UserPreference`, and
  `User.displayName` + `User.profilePhoto*` fields.
- Seed extension: `displayName` for the bootstrapped `super_admin`/admin accounts.

### 1.2 Data sources touched

- PostgreSQL via Prisma: `User` (extended), `Role`, `Permission`, `RolePermission`, `RefreshToken`,
  `AuditLog` (reused); `LoginCode`, `PasswordResetToken`, `UserPreference` (new). Profile-photo
  bytes stored DB-backed consistent with the project's media direction (a `Bytes` column in Phase 1;
  full media-library migration is Phase 2).
- SMTP via existing `MailerService` (nodemailer) for OTP and reset-link emails.

### 1.3 Interfaces & dependencies

- Internal: `MailerService`, Pino `logger`, `config/env`, Prisma client, existing `validate`,
  `rateLimit`, `error` middleware, web `apiClient`.
- External deps unchanged except adding the admin design-system toolchain (Tailwind v4, the OKLCH
  token CSS, and a small set of Radix primitives) confined to `apps/web`. No new email/OTP vendor,
  no authenticator-app TOTP, no SSR for admin.

### 1.4 Non-goals (deliberately OUT of scope this phase)

- Content/media migration and page/product/image editors (Phase 2).
- User & role **management UI** — Phase 1 wires the access-control plumbing only (Phase 3).
- Customer CRUD, online-submission management, progress/payment tracking (Phase 4).
- Additional theme presets beyond `Default`; additional fonts beyond the single shipped font.
- Audit-log/system-log **viewer** UI, job/kanban, performance dashboards, multi-language (parking lot).
- Editing the `super_admin` account through the panel (database-only).
- "Trusted device" / 2FA-skipping, authenticator-app TOTP, SMS OTP.
- Account self-registration, name/email editing in settings, SSR/prerender for admin routes.
- Any change to public marketing pages or the `@modular-house/ui` library.

---

## 2. Specs & Parameters (single source of truth)

> Every value below is a **checkable assertion**. One value, no prose hedging. Tests in §4 assert
> these directly. Where the spec marked a value "tunable", the value here is the **Phase 1 default**
> the tests pin; changing it means changing both the constant and its test.

### 2.1 Authentication & lockout

- A1. Password hashing algorithm = `argon2id` (existing `argon2` defaults).
- A2. Failed-password lockout threshold = **5** consecutive failures (`failedLoginAttempts >= 5`).
- A3. Lockout duration = **15 minutes** (`lockedUntil = now + 15m`); login blocked while `now < lockedUntil`.
- A4. Successful password verification resets `failedLoginAttempts` to `0`.
- A5. Invalid-credentials response is a single generic message; status = `401`; body never reveals
  whether the email exists (identical for unknown email and wrong password).
- A6. Deactivated account (`isActive = false`) cannot complete sign-in even with correct credentials
  and a valid code; response is the same generic `401`.

> Note: account lockout is surfaced distinctly (HTTP `423`) per FR-009 even though that reveals the
> account exists; this enumeration exposure is a deliberate, accepted trade-off bounded by the IP
> rate limit (F4). Unknown-email and wrong-password remain byte-identical `401` (A5).

### 2.2 Two-factor one-time code (OTP)

- B1. Code format = **6 numeric digits** (`/^\d{6}$/`), generated with a CSPRNG.
- B2. Code stored **hashed only** (argon2); raw code never persisted, logged, or returned.
- B3. Code TTL = **10 minutes** (`expiresAt = issuedAt + 10m`).
- B4. Code is single-use: `consumedAt` set on first successful verification; reuse rejected.
- B5. Incorrect-attempt lockout per code = **5** wrong attempts → code invalidated; user requests a new one.
- B6. Requesting a new code invalidates any prior unexpired, unconsumed code for that user (only the latest accepted).
- B7. Access token is minted **only** after a correct, unexpired, unconsumed code is verified.
- B8. OTP email subject/body contain the code and its expiry; sent via `MailerService`.
- B9. `challengeId` = opaque 256-bit CSPRNG id returned by `login`; it binds the code-entry step to
  the user **without exposing the email**, is **stable across `resend-code`** within one login
  challenge, and resolves server-side to the user. Not a secret but unguessable; expires with the
  challenge. `verify-2fa`/`resend-code` reference it; an unknown/expired `challengeId` → `401`.

### 2.3 Password reset

- C1. Reset token = **256-bit** (32-byte) CSPRNG value, URL-safe base64; stored **hashed only**.
- C2. Reset token TTL = **60 minutes** (`expiresAt = issuedAt + 60m`).
- C3. Reset token single-use: `consumedAt` set on success; reused/expired link → clear error + path to request a new one.
- C4. Request endpoint returns the **same neutral confirmation** for known and unknown email; email sent only when the account exists.
- C5. Successful reset clears the account's lockout (`failedLoginAttempts = 0`, `lockedUntil = null`).
- C6. Successful reset revokes **all** of the account's refresh-token families (account-wide).

### 2.4 Password policy (server-side, applied identically at reset and at settings change)

- D1. Minimum length = **12** characters; maximum length = **128** characters.
- D2. Must contain at least one of each: lowercase, uppercase, digit (basic strength rule).
- D3. New password MUST NOT equal the current password (argon2 verify against existing hash → reject if match).
- D4. The two new-password entries MUST match exactly, else reject with a specific message.
- D5. Settings-page change additionally requires the **correct current password** to proceed.
- D6. Policy violations return `400` with a clear, specific, field-level message; no change is made.
- D7. Policy enforced **server-side** regardless of any client-side check.

### 2.5 Sessions & tokens

- E1. Access token = JWT, lifetime = **15 minutes**, carries `userId`, `email`, `role`, and effective `permissions`.
- E2. Access token stored **in memory** on the client (never in `localStorage`/`sessionStorage`).
- E3. Refresh token = opaque random value, lifetime = **7 days**, delivered as an **httpOnly, Secure, SameSite=Strict** cookie; stored hashed with family-based rotation.
- E4. Refresh rotates the token (revoke old, issue successor in same family); reuse of a revoked token revokes the entire family.
- E5. Plain logout revokes only the current session's refresh-token family and clears the cookie.
- E6. Password change/reset revokes **all** the account's families; the session performing a settings-page change stays valid (its family is re-minted).
- E7. Idle timeout = **30 minutes** of no refresh activity (refresh rejected when
  `now - RefreshToken.lastUsedAt > 30m`, even while the token is otherwise unexpired); absolute
  session cap = **7 days**.

### 2.6 Abuse prevention & throttling

- F1. Resend cooldown (OTP and reset link) = **60 seconds** minimum between requests per account/email; a request during cooldown issues/sends nothing and the UI shows a countdown.
- F2. Rolling-window cap = **5** OTP requests and **5** reset-link requests per account per **15 minutes**; exceeding temporarily blocks further requests.
- F3. Throttle responses remain **neutral** (never reveal whether an email is registered), preserving A5/C4.
- F4. Login endpoint IP rate limit reuses existing `rateLimit` middleware; default = **20 requests / 15 min / IP** on auth routes.

> Cooldown/window-cap state is derived from the `created_at` timestamps of `LoginCode` /
> `PasswordResetToken` rows (latest row for the 60s cooldown; count within the trailing 15m for the
> window cap) — no separate counter store.

### 2.7 Profile photo

- G1. Accepted MIME types = `image/png`, `image/jpeg`, `image/webp` only.
- G2. Maximum upload size = **5 MB** (`5 * 1024 * 1024` bytes); larger → `400`, no change.
- G3. Invalid type → `400` with a clear message, no change.
- G4. Removing a photo with no replacement falls back to a default avatar (user initials) in settings and the sidebar.
- G5. Stored DB-backed; served to the authenticated client only.
- G6. Photo bytes retrieved via authenticated `GET /admin/settings/photo` (image response; `404`
  when none set); `me` exposes `hasProfilePhoto` so the client knows whether to request the bytes or
  render the initials fallback.

### 2.8 Shell, theming & accessibility

- H1. Theme modes = `light`, `dark`, `system`; persisted per user (server-stored, returned in `me`
  and via `GET /admin/settings/preferences` for cross-device load) and applied **before first paint**
  via the cookie/localStorage mirror (boot script) — zero wrong-theme frames.
- H2. Sidebar collapse state persists across reloads/sessions (server-stored, returned in `me`;
  cookie mirror for pre-paint); keyboard shortcut to toggle = **Ctrl/Cmd + B**.
- H3. Sidebar widths: expanded = **17rem**, icon rail = **3rem**, mobile drawer = **18rem**; top bar height = **48px**.
- H4. Base radius = **0.625rem (10px)**; focus ring = **3px at `ring/50`**; default font = single shipped font.
- H5. Breakpoint: mobile `< 768px` → sidebar becomes off-canvas drawer; no horizontal scrolling at `>= 320px` width.
- H6. WCAG 2.1 AA: contrast >= 4.5:1 (normal) / 3:1 (large), visible focus on every control, all controls keyboard-operable, on every Phase 1 surface (login, 2FA, reset, shell, settings).
- H7. Top bar has NO GitHub link/button; sidebar main-nav shows a centered faded "Coming Soon" only.

### 2.9 Audit logging

- I1. Audited events = `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `OTP_ISSUED`, `OTP_VERIFIED`,
  `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED`, `PASSWORD_CHANGED`.
- I2. Each entry records acting user (nullable for failures on unknown email), action, entity,
  `ipAddress`, `userAgent`, `createdAt`.
- I3. Secrets (passwords, OTPs, reset tokens) MUST NOT appear in any audit entry or log line.

---

## 3. Data Model

> Persistence IS needed. Reused models are unchanged; this phase adds three tables and extends `User`.
> Full field/constraint detail and migration direction live in [data-model.md](data-model.md).

**Extended — `User`** (additive, nullable/defaulted → backward compatible):

- `displayName String?` (`@map("display_name") @db.VarChar(100)`)
- `profilePhoto Bytes?` (`@map("profile_photo")`) — image bytes, nullable.
- `profilePhotoMime String?` (`@map("profile_photo_mime") @db.VarChar(50)`)

**New — `LoginCode`** (OTP): `id`, `userId` (FK), `challengeId` (opaque, resolves to user; stable
across resends), `codeHash`, `expiresAt`, `attemptCount Int @default(0)`, `consumedAt DateTime?`,
`createdAt`. Indexes: `[userId]`, `[challengeId]`, `[expiresAt]`.

**New — `PasswordResetToken`**: `id`, `userId` (FK), `tokenHash`, `expiresAt`, `consumedAt DateTime?`,
`createdAt`. Indexes: `[userId]`, `[tokenHash]`, `[expiresAt]`.

**New — `UserPreference`** (one row per user): `id`, `userId` (FK, unique), `themeMode` (`light` |
`dark` | `system`, default `system`), `sidebarCollapsed Boolean @default(false)`, `createdAt`,
`updatedAt`. Kept separate from the global `Setting` table so per-user UI state stays isolated
(research R7).

**Migration direction:** single additive forward migration (`add_login_2fa_reset_and_profile`);
no destructive column drops; reversible by dropping the three new tables + new `User` columns.

---

## 4. Test Design

> One behavioral scenario per acceptance criterion (happy path), plus edge/failure cases pulled
> directly from the §2 ranges. **Iteration handling** is explicit: amend vs add, so passing
> coverage is never silently rewritten.

### 4.1 Behavioral scenarios (happy path, one per acceptance criterion)

Backend (Vitest + supertest):

- T-B1 (US1-1,2,7): `POST /admin/auth/login` with valid creds → `200`, no access token yet, OTP
  issued + emailed; `POST /admin/auth/verify-2fa` with correct code → access token + refresh cookie.
- T-B2 (US3-1,3,6): `forgot-password` (known email) → neutral 200 + email; `reset-password` with
  matching policy-compliant password → 200; subsequent `login` with new password → 200, old → 401.
- T-B3 (US4-1,2): `settings/password` with correct current + matching new → 200; other sessions revoked.
- T-B4 (US4-4): `settings/photo` PNG <=5MB → 200, photo persisted; `me` reports
  `hasProfilePhoto=true` and `GET settings/photo` returns the bytes.
- T-B5 (FR-036): `me` / access token payload carries role + effective permissions.
- T-B6 (FR-037/I1): each flow writes the expected audit action.
- T-B7 (FR-024): `PUT settings/preferences` persists `themeMode`/`sidebarCollapsed`; `me` and
  `GET settings/preferences` return them (cross-device load).

Frontend (Vitest + @testing-library/react):

- T-F1 (US2-1..4,7): shell renders sidebar + 48px top bar, faded "Coming Soon", bottom user section,
  the four top-bar controls, and NO GitHub button.
- T-F2 (US2-5, H1/H2): toggling dark mode + sidebar collapse persists across remount with no flash.
- T-F3 (US2-6, H6): full keyboard operability + Ctrl/Cmd+B sidebar toggle + visible focus.
- T-F4 (US2-8): account menu → Logout returns to login and blocks back-nav reuse.
- T-F5 (US2-9, H5): narrow viewport renders off-canvas drawer, no horizontal scroll.
- T-F6 (US1-1,2 / US3 / US4-8): pre-auth pages render code-entry, reset, and guard the settings route.

### 4.2 Edge cases & failure modes (boundary values from §2)

- E-OTP: wrong code (B5 count increments), expired code at `expiresAt+1s` (B3), reused code (B4),
  6th wrong attempt invalidates (B5), new-code request invalidates prior (B6), unknown/expired
  `challengeId` → `401` (B9).
- E-LOCK: 5th consecutive bad password locks (A2/A3); attempt during lock → blocked; reset clears lock (C5).
- E-CREDS: unknown email vs wrong password give byte-identical responses (A5); deactivated user (A6).
- E-RESET: unknown email → same neutral message, no email (C4); reused/expired link (C2/C3); account-wide revoke (C6).
- E-POLICY: length 11 rejected / 12 accepted (D1); missing character class (D2); equals current (D3);
  mismatched entries (D4); wrong current password on settings change (D5); server rejects despite client bypass (D7).
- E-THROTTLE: resend within 60s issues nothing (F1); 6th request in 15min blocked (F2); response stays neutral (F3).
- E-PHOTO: `image/gif` rejected (G1); 5MB+1byte rejected (G2); remove → initials fallback (G4).
- E-SESSION: access-token expiry mid-use → silent refresh; refresh reuse revokes family (E4);
  expired/absent session on protected view → redirect to login.
- E-A11Y/THEME: no wrong-theme frame on first paint (H1); contrast + focus checks (H6).
- E-SUPERADMIN: `settings/password` and `settings/photo` (PUT/DELETE) as the `super_admin` account →
  `403`, no change (FR-035).
- E-IDLE: refresh after >30m of inactivity → rejected even though the refresh token is unexpired (E7).
- E-MAILFAIL: mailer throws while sending the OTP/reset email → clear non-technical error, no session
  granted, the code/token is not left consumed, and the user can retry (spec "Email delivery delay or
  failure").

### 4.3 Iteration handling

**Existing tests to AMEND** (must be updated, not deleted, because behavior changes):

- [apps/api/src/routes/admin/auth.ts](../../apps/api/src/routes/admin/auth.ts) tests — the login
  contract changes from "200 + token" to "200 + OTP issued, no token". Amend assertions accordingly.
- Any test asserting the legacy `localStorage` `adminToken` flow or the legacy admin
  dashboard/login UI — amend to the new in-memory token + shell, or remove with the legacy code it covers.
- `authenticateJWT` / `requireRole` middleware tests — extend to cover the new
  `requirePermission` middleware (keep role tests where still valid).

**New tests to ADD** (no prior coverage exists):

- All `verify-2fa`, `resend-code`, `forgot-password`, `reset-password`, `refresh`, `me`,
  `settings/password`, `settings/photo` route tests.
- `LoginCodeService`, `PasswordResetTokenService`, `passwordPolicy`, `requirePermission`,
  account-wide revocation, audit-writer unit tests (100% branch on security modules per constitution).
- All new frontend admin component/page tests (shell, pre-auth pages, settings, theme boot, guard).

**Do NOT touch:** public-site tests, `@modular-house/ui` tests, configurator/SEO tests — they must
stay green to prove no public regression (SC-008).

---

## 5. Implementation Boundaries

> The minimal code surface that turns each test green. Two passes: Pass 1 = minimal impl for the
> §4.1 scenarios; Pass 2 = hardening for the §4.2 edge cases.

### 5.1 Files/areas to TOUCH

Backend:

- `apps/api/prisma/schema.prisma` (+ migration) — add `LoginCode`, `PasswordResetToken`,
  `UserPreference`, extend `User`.
- `apps/api/src/services/auth.ts` — rewrite to credential→lockout→OTP→token+refresh; add refresh
  rotation, account-wide revoke, permission loading.
- New: `services/loginCode.ts`, `services/passwordResetToken.ts`, `services/passwordPolicy.ts`,
  `services/userPreference.ts`, `services/auditLog.ts`.
- `apps/api/src/routes/admin/auth.ts` — expand to the full endpoint set in §1.1.
- New: `apps/api/src/routes/admin/settings.ts` (password, photo upload/get/remove, preferences
  get/put). `me` stays in `auth.ts`.
- New: `apps/api/src/middleware/requirePermission.ts`; reuse `rateLimit`, `validate`, `error`.
- `apps/api/prisma/seed.ts` — add `displayName`; ensure permissions seeded for Phase 1 surfaces.
- `apps/api/openapi.yaml` — document new endpoints (mirrors `contracts/`).

Frontend:

- New `apps/web/src/admin/` tree: `theme/` (tokens.css, ThemeProvider, boot script), `ui/`
  (primitives), `shell/` (Sidebar, TopBar, UserSection, ComingSoon), `pages/`
  (Login, TwoFactor, ForgotPassword, ResetPassword, Settings), `auth/` (AuthProvider, guard,
  apiClient hooks).
- `apps/web/src/App.tsx` + routing — replace legacy admin imports/routes with the new shell + guard.
- Tailwind v4 config + PostCSS scoped to admin (research R1).

### 5.2 What NOT to build yet (guardrails)

- No additional theme presets/fonts, no UI-preference options beyond theme mode + the single preset.
- No feature pages behind "Coming Soon"; no dashboard widgets.
- No user/role management screens, no content/media editors, no customer views.
- No name/email editing; no `super_admin` editing path.
- No new email vendor; no authenticator-app/SMS 2FA; no SSR for admin.

### 5.3 Two-pass order

- **Pass 1 (make it work):** schema + migration → auth/OTP/reset/refresh services →
  routes → design-system port + 3-4 primitives → shell + pre-auth pages + settings → guard →
  green on §4.1.
- **Pass 2 (make it right):** lockout, throttling/cooldown, code/link invalidation, account-wide
  revocation, photo validation, a11y/focus/theme-flash, neutral responses → green on §4.2.

---

## 6. Definition of Done

- DoD-1: Every §4.1 scenario and §4.2 edge case has a passing automated test in CI (SC-009).
- DoD-2: Every FR in the spec traces to at least one test (traceability table maintained in
  [quickstart.md](quickstart.md)); no untested new code path.
- DoD-3: Security modules (auth, OTP, reset, refresh rotation, lockout, requirePermission) reach
  **100% branch coverage**; overall line coverage >= 70% (constitution III).
- DoD-4: Legacy admin UI + legacy JWT-in-`localStorage` flow fully removed; no legacy admin route
  reachable (SC-001/SC-007).
- DoD-5: Public marketing site shows zero regressions — all existing public/UI/configurator/SEO
  tests green (SC-008).
- DoD-6: WCAG 2.1 AA verified with zero critical violations; full keyboard operability incl. sidebar
  toggle; no theme flash on first paint (SC-005/SC-006).
- DoD-7: A verified real OTP send arrives within 30s for >= 9/10 sends; no session granted without a
  correct, unexpired code (SC-002).
- DoD-8: Mobile design document for all Phase 1 surfaces exists alongside the template references
  (FR-027/SC-012).
- DoD-9: `lint`, `typecheck`, `test:run`, and OpenAPI contract validation all pass; no emoji in code;
  conventional naming; new abstractions follow the Open-Closed token/primitive extension points.

---

## Technical Context

**Language/Version**: TypeScript 5.6.3 (frontend & backend)
**Primary Dependencies**:
- Frontend: React 18.3, Vite 6, React Router 6, React Hook Form 7 + Zod 3, Axios; **new (admin-only):**
  Tailwind CSS v4 + PostCSS, Radix UI primitives (dropdown-menu, avatar, dialog/sheet, label, slot),
  `class-variance-authority` + `tailwind-merge` + `clsx` for the shadcn-style primitives, `sonner`
  (already present), `input-otp`.
- Backend: Express 4, Prisma 5 + @prisma/client, jsonwebtoken, argon2, Pino, nodemailer, helmet,
  cors, express-rate-limit, cookie-parser (present), zod.
**Storage**: PostgreSQL via Prisma ORM (reuse feature-006 models; add `LoginCode`,
`PasswordResetToken`, `UserPreference`; extend `User`).
**Testing**: Vitest + @testing-library/react (web), Vitest + supertest (api), OpenAPI contract validation.
**Target Platform**: Web SPA (latest 2 versions of Chrome/Firefox/Safari/Edge); admin is client-only
(no SSR/prerender). Deployed via Docker/Nginx.
**Project Type**: Web application (pnpm monorepo: `apps/web`, `apps/api`, `packages/*`).
**Performance Goals**: API p95 < 300ms; admin LCP < 2.5s; OTP email delivery < 30s (9/10);
no theme flash on first paint; sidebar animation <= 200ms.
**Constraints**: Access token 15m / in-memory; refresh 7d / httpOnly cookie; OTP TTL 10m; reset TTL
60m; lockout 5/15m; resend cooldown 60s; window cap 5/15m; photo <= 5MB; min password length 12.
**Scale/Scope**: ~5–20 admin users; 4 user stories (P1–P3); ~13 new API endpoints; ~12 new admin
routes/components; 2 new tables + 1 preference table + `User` extension.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Security & Privacy First (NON-NEGOTIABLE)

- **Threat model**: brute-force login (mitigated: lockout A2/A3 + IP rate limit F4), credential
  enumeration (generic 401 A5 + neutral reset/throttle C4/F3), OTP brute force (5-attempt cap B5 +
  10m TTL + single-use), session theft (in-memory access token E2 + httpOnly/Secure/SameSite=Strict
  refresh E3 + family rotation E4), stale-session-outlives-credential-change (account-wide revoke
  C6/E6), reset-link replay (single-use + 60m TTL C2/C3), photo upload abuse (type/size validation G1/G2).
- **Data classification**: `passwordHash`, `codeHash`, `tokenHash` — secret, hashed-only, never
  logged/returned (B2/C1/I3/FR-039). Profile photo — user data, served to authenticated owner only.
  Audit logs — internal.
- **Secrets handling**: JWT + refresh secrets via env (existing pattern); no secret in browser
  storage; TLS for all traffic (constitution). No hardcoded credentials (FR-007/SC-001).
- **Security tests**: 100% branch coverage on auth, OTP, reset, refresh rotation, lockout,
  requirePermission (constitution III + DoD-3). Each auth-touching change ships a security test.

### II. Reliability & Observability

- **Health**: existing `GET /health` retained; no new health endpoint.
- **Log schema**: existing Pino JSON (timestamp, level, correlation id via pino-http). New DB audit
  entries for the I1 event set; correlation id propagated; no secrets in logs.
- **Metrics**: audit-log counts (login success/failure, OTP issue/verify, resets) + existing
  request count / p95 / error rate from pino-http.

### III. Test Discipline

- Unit coverage for all new services/components; integration tests for login→2FA→refresh→logout,
  reset, settings, RBAC enforcement; OTP/reset/lockout deterministic via injected clock (no real
  `Date.now()` in assertions). Security modules at 100% branch. No flaky tests. Target >= 70% line.

### IV. Performance & Efficiency

- API p95 < 300ms (auth endpoints included); admin LCP < 2.5s; theme boot pre-paint; budgets
  validated post-implementation via pino-http durations + Lighthouse. argon2 cost is the dominant
  auth latency and is accepted (security > micro-latency); documented exception.

### V. Accessibility & Inclusive UX

- WCAG 2.1 AA on every Phase 1 surface (H6/FR-030/FR-031): semantic HTML, keyboard nav, visible
  focus, ARIA on the OTP entry, errors exposed to AT, Ctrl/Cmd+B sidebar toggle, off-canvas drawer
  on mobile, contrast in light + dark.

**Result: PASS (no violations).** No entries required in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/012-panel-phase-1/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output (incl. FR->test traceability)
├── contracts/           # Phase 1 output (OpenAPI for new endpoints)
│   └── admin-auth.openapi.yaml
└── tasks.md             # Created by /speckit.tasks (NOT here)
```

### Source Code (repository root)

```text
apps/api/
├── prisma/
│   ├── schema.prisma            # + LoginCode, PasswordResetToken, UserPreference; extend User
│   ├── migrations/              # + add_login_2fa_reset_and_profile
│   └── seed.ts                  # + displayName, Phase 1 permissions
├── src/
│   ├── services/
│   │   ├── auth.ts              # rewritten: lockout, OTP, token+refresh rotation, revoke
│   │   ├── loginCode.ts         # new: issue/verify/invalidate OTP
│   │   ├── passwordResetToken.ts# new: issue/consume reset token
│   │   ├── passwordPolicy.ts    # new: shared policy (reset + settings)
│   │   ├── userPreference.ts    # new: theme + sidebar persistence
│   │   └── auditLog.ts          # new: audit writer
│   ├── middleware/
│   │   └── requirePermission.ts # new: RBAC permission gate
│   └── routes/admin/
│       ├── auth.ts              # expanded: login, verify-2fa, resend, forgot, reset, refresh, logout, me
│       └── settings.ts          # new: password, photo, preferences
└── openapi.yaml                 # + new endpoints

apps/web/src/admin/              # NEW admin UI layer (isolated from public Bootstrap site)
├── theme/                       # tokens.css (OKLCH), ThemeProvider, pre-paint boot script
├── ui/                          # shadcn-style primitives (Button, Input, Card, Sidebar, ...)
├── shell/                       # Sidebar, TopBar, UserSection, ComingSoon, AdminLayout
├── pages/                       # Login, TwoFactor, ForgotPassword, ResetPassword, Settings
├── auth/                        # AuthProvider (in-memory token), guard, refresh hook
└── lib/                         # admin apiClient, cn() util
```

**Structure Decision**: Web application (existing pnpm monorepo). The admin design system lives in a
**dedicated `apps/web/src/admin/` layer** with its own Tailwind v4 + OKLCH token scope, kept fully
separate from the public Bootstrap marketing site and the `@modular-house/ui` package (FR-004,
loose coupling). Backend changes extend the existing feature-006 schema and `apps/api/src` services,
routes, and middleware rather than introducing a new service.

## Complexity Tracking

> No constitution violations — table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | —          | —                                    |
