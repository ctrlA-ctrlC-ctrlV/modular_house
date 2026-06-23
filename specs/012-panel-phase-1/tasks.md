# Tasks: Admin Panel — Phase 1: Foundation (UI & Access)

**Feature**: `012-panel-phase-1` | **Branch**: `012-panel-phase-1`
**Inputs**: [plan.md](plan.md) · [spec.md](spec.md) · [data-model.md](data-model.md) ·
[research.md](research.md) · [contracts/admin-auth.openapi.yaml](contracts/admin-auth.openapi.yaml) ·
[quickstart.md](quickstart.md)

## How to read this list

- **Linear checklist.** Tasks run strictly top to bottom (`T001` → `Tnnn`). Every task's
  prerequisites appear earlier; there are no `[P]` markers and no dependency graph — sequence alone
  encodes the order.
- **TDD.** Each implementation task is immediately preceded by its failing-test task. Test tasks
  cite the §4 test ID and assert the §2 values directly.
- **Injected clock (R11).** Every TTL / expiry / lockout / cooldown / idle test uses the injected
  clock from `apps/api/tests/helpers/clock.ts` — never real `Date.now()`.
- **Security coverage.** `auth`, `loginCode`, `passwordResetToken`, refresh rotation, lockout, and
  `requirePermission` must reach **100% branch coverage** (DoD-3); each auth-touching change ships a
  security test.
- **Guardrails (plan §1.4 / §5.2).** No user/role-management UI, content/media editors, customer
  views, dashboard widgets, extra presets/fonts, authenticator/SMS 2FA, SSR, name/email editing, or
  `super_admin` edit path. No changes to public marketing pages or `@modular-house/ui`.

---

## Phase 0 — Setup / scaffolding (prerequisites only)

- [ ] T001 Add the admin frontend toolchain dependencies
      Files: `apps/web/package.json`
      Do: Add (dev/runtime as appropriate) `tailwindcss@^4`, `@tailwindcss/postcss`, the Radix
      primitives used in Phase 1 (`@radix-ui/react-dropdown-menu`, `@radix-ui/react-avatar`,
      `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-slot`),
      `class-variance-authority`, `tailwind-merge`, `clsx`, `sonner`, and `input-otp`. No change to
      `@modular-house/ui` or public-site deps.
      Done when: `pnpm install` resolves; new packages appear only under `apps/web`.
      Refs: research R1/R2, FR-002, FR-004

- [ ] T002 Configure Tailwind v4 scoped to the admin layer only
      Files: `apps/web/postcss.config.js`, `apps/web/src/admin/theme/admin.css`
      Do: Wire `@tailwindcss/postcss`; author `@import "tailwindcss"` plus `@theme`/`@layer` confined
      to an `.admin-root` / `[data-admin]` selector subtree so utilities never cascade into the public
      Bootstrap pages.
      Done when: A throwaway admin-scoped utility renders inside `.admin-root` and a public page shows
      no Tailwind reset/leakage.
      Refs: research R1, FR-004, SC-008

- [ ] T003 Author the OKLCH token layer (Default preset, single font)
      Files: `apps/web/src/admin/theme/tokens.css`
      Do: Define the template's OKLCH custom properties on `.admin-root` plus a `.dark` variant; set
      base radius `0.625rem`, focus ring `3px` at `ring/50`, sidebar widths (17rem / 3rem / 18rem),
      top-bar height 48px as token values. Ship only the `Default` preset + one font; keep the token
      structure extensible (Open-Closed).
      Done when: Light/dark token sets resolve under `.admin-root` / `.admin-root.dark`; values match
      §2.8 H3/H4.
      Refs: research R1, FR-028/FR-029, H3/H4

- [ ] T004 Add the injected-clock + admin test fixtures
      Files: `apps/api/tests/helpers/clock.ts`, `apps/api/tests/helpers/app.ts`,
      `apps/api/tests/helpers/db.ts`
      Do: Add a `createClock()` helper returning an advanceable `() => Date`; add a supertest app
      bootstrap and a per-test DB reset/seed helper for the new tables. No real `Date.now()` in any
      time-sensitive test.
      Done when: A sample test advances the clock and reads it deterministically; the supertest app
      boots against a clean DB.
      Refs: research R11, plan §4

- [ ] T005 Extend the Prisma schema with the Phase 1 models
      Files: `apps/api/prisma/schema.prisma`
      Do: Add `LoginCode`, `PasswordResetToken`, `UserPreference` and the additive `User` fields
      (`displayName`, `profilePhoto Bytes?`, `profilePhotoMime`) with exact maps, indexes, FKs, and
      relations from data-model.md §1–§4. No destructive changes to reused models.
      Done when: `prisma validate` passes; all field maps/indexes match data-model.md.
      Refs: data-model.md §1–§6

- [ ] T006 Create the additive forward migration
      Files: `apps/api/prisma/migrations/<timestamp>_add_login_2fa_reset_and_profile/migration.sql`
      Do: Generate migration `add_login_2fa_reset_and_profile` adding the three tables + three nullable
      `users` columns; no column drops, no backfill.
      Done when: `pnpm --filter @modular-house/api db:migrate` applies cleanly and is reversible by
      dropping the new tables/columns.
      Refs: data-model.md §7

- [ ] T007 [test] RefreshToken last-used timestamp schema check
      Files: `apps/api/tests/unit/refreshTokenSchema.test.ts`
      Do: Assert the reused `RefreshToken` model exposes a per-token last-used timestamp usable for the
      30m idle timeout (E7).
      Done when: Test fails (or confirms) the presence of a `lastUsedAt`-style column on `RefreshToken`.
      Refs: E7, data-model.md §5

- [ ] T008 Confirm (or additively add) `RefreshToken.lastUsedAt`
      Files: `apps/api/prisma/schema.prisma`, the `add_login_2fa_reset_and_profile` migration,
      `data-model.md`
      Do: Confirm `RefreshToken.lastUsedAt` exists on the reused feature-006 model. If absent, add it as
      an additive nullable column folded into the `add_login_2fa_reset_and_profile` migration and update
      `schema.prisma` + data-model.md §5; the auth service updates it on every successful refresh. No
      other change to the reused model.
      Done when: T007 passes; `RefreshToken.lastUsedAt` is present and the migration stays
      additive/reversible. The later idle-timeout tasks (T118/T119) depend on this.
      Refs: E7, research R6

- [ ] T009 Extend the seed with displayName + Phase 1 permissions
      Files: `apps/api/prisma/seed.ts`
      Do: Set `displayName` on the bootstrapped `super_admin`/admin account(s) and upsert the Role →
      Permission rows the Phase 1 surfaces need; keep the seed idempotent.
      Done when: Re-running `db:seed` is a no-op delta; seeded accounts carry `displayName` and
      permissions.
      Refs: data-model.md §7, FR-036, plan §5.1

- [ ] T010 Add the central Phase 1 auth config/constants module
      Files: `apps/api/src/config/adminAuth.ts`, `apps/api/src/config/env.ts`
      Do: Hold the §2 pinned values (access TTL 15m, refresh 7d, OTP TTL 10m, reset TTL 60m, lockout
      5/15m, resend cooldown 60s, window cap 5/15m, idle 30m, photo 5MB, password min 12 / max 128)
      sourced from env where applicable (`JWT_EXPIRES_IN`, `REFRESH_TOKEN_SECRET`,
      `ADMIN_LOGIN_EMAIL/PASSWORD`, SMTP vars per quickstart §1). These constants are what the tests
      assert against.
      Done when: All §2 tunables resolve from one module; env vars are read per quickstart §1.
      Refs: plan §2 (all groups), quickstart §1

- [ ] T011 Remove the legacy frontend admin UI and localStorage token flow
      Files: `apps/web/src/routes/admin/login.tsx`, `apps/web/src/routes/admin/index.tsx`,
      `apps/web/src/routes/admin/guard.tsx`, and any legacy admin dashboard/list pages + the
      `localStorage` `adminToken` read/write code
      Do: Delete the legacy admin pages and the browser-stored-token flow so no legacy admin route is
      reachable. (Keep public routes untouched; backend list endpoints stay but are re-gated later.)
      Done when: No `localStorage`/`sessionStorage` token reference remains in the admin path; no
      legacy admin route resolves.
      Refs: research R12, FR-001, SC-007

- [ ] T012 Amend/replace the legacy backend admin auth route + its tests
      Files: `apps/api/src/routes/admin/auth.ts`, `apps/api/tests/integration/admin-auth.test.ts`
      Do: Reduce the legacy `login` to a stub the new flow replaces; amend existing tests from
      "200 + token" to the new "200 + OTP issued, no token" contract (do not delete coverage).
      Done when: Legacy "token on login" assertions are gone; the file compiles against the new
      contract surface; no legacy hardcoded-credential path remains.
      Refs: plan §4.3, FR-007, T-B1

---

## Pass 1 — Make it work (turns every §4.1 scenario green)

### Backend services

- [ ] T013 [test] Password-policy validator unit tests
      Files: `apps/api/tests/unit/passwordPolicy.test.ts`
      Do: Assert min 12 / max 128, requires lower+upper+digit, rejects equal-to-current (argon2
      verify), requires matching entries, returns specific field-level messages.
      Done when: Tests fail (no module yet) and pin D1–D4.
      Refs: D1–D4, FR-019, research R10

- [ ] T014 Implement the shared password-policy validator
      Files: `apps/api/src/services/passwordPolicy.ts`
      Do: One server-side module used identically by reset and settings-change; no client-only checks.
      Done when: T013 passes; module is the single source for D1–D4.
      Refs: D1–D7, FR-019, research R10

- [ ] T015 [test] Audit-log writer unit tests
      Files: `apps/api/tests/unit/auditLog.test.ts`
      Do: Assert each I1 action writes acting user (nullable on unknown-email failure), action, entity,
      `ipAddress`, `userAgent`, `createdAt`; assert no secret value appears in any entry.
      Done when: Tests fail and pin I1–I3.
      Refs: I1–I3, FR-037/FR-039

- [ ] T016 Implement the audit-log writer
      Files: `apps/api/src/services/auditLog.ts`
      Do: Thin writer over the reused `AuditLog` model exposing the I1 action set; redact secrets.
      Done when: T015 passes.
      Refs: I1–I3, FR-037

- [ ] T017 [test] LoginCode (OTP) service unit tests
      Files: `apps/api/tests/unit/loginCode.test.ts`
      Do: With the injected clock assert: 6-digit CSPRNG format, argon2 hash only (raw never stored),
      10m TTL, single-use `consumedAt`, 5-attempt lockout, new-code supersedes prior active code,
      `challengeId` opaque/256-bit/stable across resend and resolving to the user.
      Done when: Tests fail and pin B1–B9.
      Refs: B1–B9, research R3/R11

- [ ] T018 Implement the LoginCode (OTP) service
      Files: `apps/api/src/services/loginCode.ts`
      Do: Issue/verify/resend codes with injected clock; supersede prior active codes on issue; keep
      `challengeId` stable across resend within one challenge.
      Done when: T017 passes; 100% branch coverage on the module.
      Refs: B1–B9, data-model.md §2

- [ ] T019 [test] PasswordResetToken service unit tests
      Files: `apps/api/tests/unit/passwordResetToken.test.ts`
      Do: With the injected clock assert: 32-byte CSPRNG URL-safe value, hashed-only storage, 60m TTL,
      single-use `consumedAt`, expired/consumed → clear error path.
      Done when: Tests fail and pin C1–C3.
      Refs: C1–C3, research R11

- [ ] T020 Implement the PasswordResetToken service
      Files: `apps/api/src/services/passwordResetToken.ts`
      Do: Mint/verify/consume reset tokens with injected clock; on consume trigger lockout-clear (C5)
      and account-wide revoke (C6) via the auth service hook.
      Done when: T019 passes; 100% branch coverage.
      Refs: C1–C6, data-model.md §3

- [ ] T021 [test] UserPreference service unit tests
      Files: `apps/api/tests/unit/userPreference.test.ts`
      Do: Assert one row per user (upsert), `themeMode` constrained to `light|dark|system`,
      `sidebarCollapsed` boolean default false, read-back returns persisted values.
      Done when: Tests fail and pin H1/H2 persistence.
      Refs: H1/H2, data-model.md §4, research R7

- [ ] T022 Implement the UserPreference service
      Files: `apps/api/src/services/userPreference.ts`
      Do: Zod-validated get/put of theme mode + sidebar state; server-stored source of truth.
      Done when: T021 passes.
      Refs: H1/H2, FR-024

- [ ] T023 [test] requirePermission middleware unit tests
      Files: `apps/api/tests/unit/requirePermission.test.ts`
      Do: Assert it resolves Role → RolePermission → Permission, allows on matching `(resource,action)`,
      `403`s otherwise, and works without editing route code (Open-Closed).
      Done when: Tests fail and pin the RBAC plumbing.
      Refs: FR-036, research R5

- [ ] T024 Implement the requirePermission middleware
      Files: `apps/api/src/middleware/requirePermission.ts`
      Do: `requirePermission(resource, action)` reading effective permissions loaded into the request
      context; reuse existing `authenticateJWT`.
      Done when: T023 passes; 100% branch coverage.
      Refs: FR-036, research R5

- [ ] T025 [test] Amend authenticateJWT / requireRole middleware tests for requirePermission
      Files: existing `apps/api/tests/**` middleware test(s) for `authenticateJWT`/`requireRole`
      Do: Extend the existing tests to also cover the new `requirePermission` gate; keep the still-valid
      role-based assertions (do not delete coverage).
      Done when: Amended tests cover both the retained role checks and the new permission gate.
      Refs: plan §4.3, FR-036, research R5

- [ ] T026 [test] Retained legacy admin endpoints re-gate test
      Files: `apps/api/tests/integration/legacy-endpoints-regate.test.ts`
      Do: Assert every retained feature-006 admin list/data endpoint kept for Phase 2+ now requires a
      matching permission: unauthenticated → `401`, authenticated-without-permission → `403`.
      Done when: Tests fail for any ungated retained endpoint.
      Refs: research R12, FR-036

- [ ] T027 Re-gate retained legacy backend endpoints behind requirePermission
      Files: the retained `apps/api/src/routes/admin/*` endpoint files
      Do: Apply `requirePermission(resource, action)` to the retained endpoints so no ungated admin
      endpoint remains; add no new feature endpoints.
      Done when: T026 passes; no ungated admin endpoint remains.
      Refs: research R12, SC-007

- [ ] T028 [test] AuthService core unit tests
      Files: `apps/api/tests/unit/auth.test.ts`
      Do: With injected clock assert: credential verify (argon2id), generic `401` for unknown email vs
      wrong password (byte-identical), inactive account blocked, lockout reset on success, OTP issue on
      success, access token minted only after OTP verify, refresh family rotation + reuse-revokes-family,
      account-wide revoke, settings-change re-mints acting family.
      Done when: Tests fail and pin A1–A6, B7, E1–E7, C5/C6.
      Refs: A1–A6, B7, C5/C6, E1–E7, research R4/R6/R11

- [ ] T029 Rewrite the AuthService
      Files: `apps/api/src/services/auth.ts`
      Do: credential → lockout → OTP issue+email → OTP verify → mint 15m access JWT (carrying role +
      effective permissions) + rotating httpOnly refresh cookie; add refresh rotation, account-wide
      revoke, permission loading; inject clock + `MailerService`.
      Done when: T028 passes; 100% branch coverage on the security paths.
      Refs: A1–A6, B7, E1–E7, FR-036, research R3/R4/R6

### Backend routes (each contract endpoint is its own task)

- [ ] T030 [test] POST /admin/auth/login route test
      Files: `apps/api/tests/integration/auth-login.test.ts`
      Do: Valid creds → `200` `TwoFactorChallenge` (challengeId, message), no access token, OTP issued +
      emailed; lockout → `423`; IP cap → `429`.
      Done when: Tests fail and match the contract for `login`.
      Refs: T-B1, contracts `login`, A2/A3/B1/B8, FR-010/FR-011

- [ ] T031 Implement POST /admin/auth/login
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Wire credential verify → lockout → OTP issue/email → return `challengeId`; reuse `validate`,
      `rateLimit`, `error`.
      Done when: T030 passes.
      Refs: T-B1, contracts `login`

- [ ] T032 [test] Auth-route IP rate-limit test
      Files: `apps/api/tests/integration/auth-ratelimit.test.ts`
      Do: Assert the auth-route IP rate limit triggers `429` at the configured threshold (default
      20 requests / 15 min / IP) with a neutral response.
      Done when: Tests fail and pin F4.
      Refs: F4, FR-008, F3

- [ ] T033 Configure the auth-route IP rate limit
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Apply the existing `rateLimit` middleware on the auth routes with the F4 default
      (20 / 15 min / IP).
      Done when: T032 passes.
      Refs: F4

- [ ] T034 [test] POST /admin/auth/verify-2fa route test
      Files: `apps/api/tests/integration/auth-verify-2fa.test.ts`
      Do: Correct code → `200` `Session` + Set-Cookie refresh; wrong/expired/consumed/locked → `401`;
      malformed → `400`.
      Done when: Tests fail and match the contract for `verify-2fa`.
      Refs: T-B1, contracts `verify-2fa`, B3/B4/B5/B7

- [ ] T035 Implement POST /admin/auth/verify-2fa
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Verify OTP by `challengeId`, mint access token + refresh cookie on success.
      Done when: T034 passes.
      Refs: T-B1, contracts `verify-2fa`

- [ ] T036 [test] POST /admin/auth/resend-code route test
      Files: `apps/api/tests/integration/auth-resend-code.test.ts`
      Do: Eligible → neutral `200`; prior code invalidated; `challengeId` unchanged across resend;
      cooldown/window-cap → neutral `429`.
      Done when: Tests fail and match the contract for `resend-code`.
      Refs: contracts `resend-code`, B6/B9/F1/F2, FR-013

- [ ] T037 Implement POST /admin/auth/resend-code
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Issue a new code reusing the same `challengeId`, invalidate prior; neutral responses.
      Done when: T036 passes.
      Refs: contracts `resend-code`, B6/B9

- [ ] T038 [test] POST /admin/auth/forgot-password route test
      Files: `apps/api/tests/integration/auth-forgot-password.test.ts`
      Do: Known + unknown email both return the same neutral `200`; email sent only when account
      exists; cooldown/window-cap → neutral.
      Done when: Tests fail and match the contract for `forgot-password`.
      Refs: T-B2, contracts `forgot-password`, C4/F1/F2/F3, FR-014/FR-015

- [ ] T039 Implement POST /admin/auth/forgot-password
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Mint reset token + email link when the account exists; always neutral confirmation.
      Done when: T038 passes.
      Refs: T-B2, contracts `forgot-password`, C4

- [ ] T040 [test] POST /admin/auth/reset-password route test
      Files: `apps/api/tests/integration/auth-reset-password.test.ts`
      Do: Matching policy-compliant password → `200`, lockout cleared, all sessions revoked; policy/
      mismatch → `400`; used/expired link → `410`; subsequent login old→`401` / new→`200`.
      Done when: Tests fail and match the contract for `reset-password`.
      Refs: T-B2, contracts `reset-password`, C2/C3/C5/C6/D1–D4, FR-016/FR-017/FR-018

- [ ] T041 Implement POST /admin/auth/reset-password
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Consume token, apply `passwordPolicy`, clear lockout, account-wide revoke.
      Done when: T040 passes.
      Refs: T-B2, contracts `reset-password`

- [ ] T042 [test] POST /admin/auth/refresh route test
      Files: `apps/api/tests/integration/auth-refresh.test.ts`
      Do: Valid cookie → `200` new access token + rotated cookie; missing/expired/reused → `401`
      (reuse revokes family).
      Done when: Tests fail and match the contract for `refresh`.
      Refs: contracts `refresh`, E3/E4, FR-040

- [ ] T043 Implement POST /admin/auth/refresh
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Rotate refresh within family, mint new access token; revoke family on reuse.
      Done when: T042 passes.
      Refs: contracts `refresh`, E3/E4

- [ ] T044 [test] POST /admin/auth/logout route test
      Files: `apps/api/tests/integration/auth-logout.test.ts`
      Do: Authenticated → `204`, current family revoked + cookie cleared; the refresh credential cannot
      be reused afterward.
      Done when: Tests fail and match the contract for `logout`.
      Refs: contracts `logout`, E5, FR-038

- [ ] T045 Implement POST /admin/auth/logout
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Revoke current family, clear the refresh cookie.
      Done when: T044 passes.
      Refs: contracts `logout`, E5

- [ ] T046 [test] GET /admin/auth/me route test
      Files: `apps/api/tests/integration/auth-me.test.ts`
      Do: Authenticated → `200` `Me` carrying `role` + effective `permissions`, `hasProfilePhoto`,
      `isSuperAdmin`, and `preferences` (cross-device load); unauthenticated → `401`.
      Done when: Tests fail and match the contract for `me`.
      Refs: T-B5, T-B7, contracts `me`, FR-036, H1/H2/G6

- [ ] T047 Implement GET /admin/auth/me
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Return identity, role, permissions, `hasProfilePhoto`, `isSuperAdmin`, and preferences.
      Done when: T046 passes.
      Refs: T-B5/T-B7, contracts `me`

- [ ] T048 [test] PUT /admin/settings/password route test
      Files: `apps/api/tests/integration/settings-password.test.ts`
      Do: Correct current + matching policy-valid new → `200`, other sessions revoked, acting session
      stays valid; mismatch/policy/wrong-current → `400`; `super_admin` → `403`.
      Done when: Tests fail and match the contract for `settings/password`.
      Refs: T-B3, contracts `settings/password`, D5/E6/FR-035/FR-041

- [ ] T049 Implement PUT /admin/settings/password
      Files: `apps/api/src/routes/admin/settings.ts`
      Do: Verify current password, apply policy, account-wide revoke (re-mint acting family), audit
      `PASSWORD_CHANGED`; block `super_admin`.
      Done when: T048 passes.
      Refs: T-B3, contracts `settings/password`, I1

- [ ] T050 [test] PUT /admin/settings/photo route test
      Files: `apps/api/tests/integration/settings-photo-put.test.ts`
      Do: PNG/JPEG/WebP ≤5MB → `200` `Me` with `hasProfilePhoto=true`; bad type / >5MB → `400`;
      `super_admin` → `403`.
      Done when: Tests fail and match the contract for `settings/photo` PUT.
      Refs: T-B4, contracts `settings/photo`, G1/G2/G3, FR-033/FR-035

- [ ] T051 Implement PUT /admin/settings/photo
      Files: `apps/api/src/routes/admin/settings.ts`
      Do: multer memory upload, validate MIME + size, persist bytes+MIME on `User`; block `super_admin`.
      Done when: T050 passes.
      Refs: T-B4, contracts `settings/photo`, research R9

- [ ] T052 [test] GET /admin/settings/photo route test
      Files: `apps/api/tests/integration/settings-photo-get.test.ts`
      Do: Photo set → `200` image bytes with correct MIME; none set → `404` (client renders initials);
      unauthenticated → `401`.
      Done when: Tests fail and match the contract for `settings/photo` GET.
      Refs: T-B4, contracts `settings/photo`, G5/G6

- [ ] T053 Implement GET /admin/settings/photo
      Files: `apps/api/src/routes/admin/settings.ts`
      Do: Stream stored bytes for the authenticated user; `404` when absent.
      Done when: T052 passes.
      Refs: T-B4, G5/G6

- [ ] T054 [test] DELETE /admin/settings/photo route test
      Files: `apps/api/tests/integration/settings-photo-delete.test.ts`
      Do: Remove → `200` `Me` with `hasProfilePhoto=false`; `super_admin` → `403`.
      Done when: Tests fail and match the contract for `settings/photo` DELETE.
      Refs: contracts `settings/photo`, G4, FR-035

- [ ] T055 Implement DELETE /admin/settings/photo
      Files: `apps/api/src/routes/admin/settings.ts`
      Do: Null out bytes+MIME; block `super_admin`.
      Done when: T054 passes.
      Refs: G4

- [ ] T056 [test] GET /admin/settings/preferences route test
      Files: `apps/api/tests/integration/settings-preferences-get.test.ts`
      Do: Authenticated → `200` `Preferences` (server-stored authoritative values); unauthenticated → `401`.
      Done when: Tests fail and match the contract for `settings/preferences` GET.
      Refs: T-B7, contracts `settings/preferences`, H1/H2

- [ ] T057 Implement GET /admin/settings/preferences
      Files: `apps/api/src/routes/admin/settings.ts`
      Do: Return persisted `themeMode`/`sidebarCollapsed`.
      Done when: T056 passes.
      Refs: T-B7, H1/H2

- [ ] T058 [test] PUT /admin/settings/preferences route test
      Files: `apps/api/tests/integration/settings-preferences-put.test.ts`
      Do: Valid body persists and round-trips via `me` and GET preferences; invalid `themeMode` → `400`.
      Done when: Tests fail and match the contract for `settings/preferences` PUT.
      Refs: T-B7, contracts `settings/preferences`, H1/H2, FR-024

- [ ] T059 Implement PUT /admin/settings/preferences
      Files: `apps/api/src/routes/admin/settings.ts`
      Do: Validate + upsert preferences via `userPreference` service.
      Done when: T058 passes.
      Refs: T-B7, FR-024

- [ ] T060 Document the Phase 1 endpoints in OpenAPI
      Files: `apps/api/openapi.yaml`
      Do: Mirror `contracts/admin-auth.openapi.yaml` (login, verify-2fa, resend-code, forgot-password,
      reset-password, refresh, logout, me, settings/password, settings/photo GET/PUT/DELETE,
      settings/preferences GET/PUT) including status codes.
      Done when: `pnpm --filter @modular-house/api docs:validate` passes.
      Refs: plan §5.1, DoD-9

### Frontend design-system port + primitives

- [ ] T061 [test] `cn()` helper unit test
      Files: `apps/web/src/admin/lib/cn.test.ts`
      Do: Assert class merge/dedupe via `clsx` + `tailwind-merge`.
      Done when: Test fails (no helper yet).
      Refs: research R2

- [ ] T062 Implement the `cn()` helper
      Files: `apps/web/src/admin/lib/cn.ts`
      Do: `clsx` + `tailwind-merge` wrapper used by all primitives.
      Done when: T061 passes.
      Refs: research R2

- [ ] T063 [test] Primitive parity contract test
      Files: `apps/web/src/admin/ui/primitives.test.tsx`
      Do: Assert `data-slot`/`data-variant`/`data-size` attributes, keyboard focusability, and ARIA
      roles for the Phase 1 primitive set.
      Done when: Tests fail (no primitives yet) and pin template parity + a11y hooks.
      Refs: research R2, H4/H6

- [ ] T064 Implement Button primitive
      Files: `apps/web/src/admin/ui/button.tsx`
      Do: cva variants/sizes, `data-slot="button"`, focus-ring tokens.
      Done when: relevant T063 assertions pass.
      Refs: research R2, H4

- [ ] T065 Implement Input primitive
      Files: `apps/web/src/admin/ui/input.tsx`
      Do: Token-styled input with `data-slot`, visible focus ring.
      Done when: relevant T063 assertions pass.
      Refs: research R2, H4/H6

- [ ] T066 Implement Label primitive
      Files: `apps/web/src/admin/ui/label.tsx`
      Do: Radix Label wrapper bound to inputs for AT.
      Done when: relevant T063 assertions pass.
      Refs: research R2, H6

- [ ] T067 Implement Card primitive
      Files: `apps/web/src/admin/ui/card.tsx`
      Do: Card/Header/Content/Footer slots with token radius.
      Done when: relevant T063 assertions pass.
      Refs: research R2, H4

- [ ] T068 Implement DropdownMenu primitive
      Files: `apps/web/src/admin/ui/dropdown-menu.tsx`
      Do: Radix DropdownMenu for the account menu; keyboard operable.
      Done when: relevant T063 assertions pass.
      Refs: research R2, H6, FR-025

- [ ] T069 Implement Avatar primitive with initials fallback
      Files: `apps/web/src/admin/ui/avatar.tsx`
      Do: Radix Avatar; render initials when no photo (G4).
      Done when: relevant T063 assertions pass.
      Refs: research R2, G4

- [ ] T070 Implement Sidebar primitive
      Files: `apps/web/src/admin/ui/sidebar.tsx`
      Do: Collapsible rail/expanded with token widths (17rem / 3rem); keyboard operable.
      Done when: relevant T063 assertions pass.
      Refs: research R2, H3, FR-020

- [ ] T071 Implement Sheet (mobile drawer) primitive
      Files: `apps/web/src/admin/ui/sheet.tsx`
      Do: Radix Dialog-based off-canvas drawer (18rem) for mobile.
      Done when: relevant T063 assertions pass.
      Refs: research R2, H3/H5

- [ ] T072 Implement Form field wrappers primitive
      Files: `apps/web/src/admin/ui/form.tsx`
      Do: Field/label/error wrappers exposing errors and the code step to AT.
      Done when: relevant T063 assertions pass.
      Refs: research R2, FR-031

- [ ] T073 Implement Sonner toast host primitive
      Files: `apps/web/src/admin/ui/sonner.tsx`
      Do: Mount the toast host themed by tokens.
      Done when: relevant T063 assertions pass.
      Refs: research R2

- [ ] T074 Implement InputOTP primitive
      Files: `apps/web/src/admin/ui/input-otp.tsx`
      Do: 6-slot numeric code entry exposed to AT.
      Done when: relevant T063 assertions pass.
      Refs: research R2, B1, FR-031

- [ ] T075 [test] ThemeProvider + boot-script test
      Files: `apps/web/src/admin/theme/ThemeProvider.test.tsx`
      Do: Assert theme applied from the cookie/localStorage mirror before first paint (no wrong-theme
      frame) and that `light|dark|system` resolve.
      Done when: Tests fail and pin H1.
      Refs: T-F2, H1, research R8

- [ ] T076 Implement ThemeProvider + pre-paint boot script
      Files: `apps/web/src/admin/theme/ThemeProvider.tsx`, `apps/web/src/admin/theme/boot.ts`,
      `apps/web/index.html`
      Do: Synchronous boot script reads the mirror and sets `data-theme`/`.dark` + sidebar attribute on
      the admin root before the bundle; ThemeProvider keeps it in sync and writes the mirror.
      Done when: T075 passes; no FOUC.
      Refs: T-F2, H1/H2, research R8

### Frontend shell + pages + auth client

- [ ] T077 [test] Admin shell test (T-F1)
      Files: `apps/web/src/admin/shell/AppShell.test.tsx`
      Do: Assert collapsible sidebar, 48px top bar with the four controls (collapse, UI-preference,
      dark-mode, account), centered faded "Coming Soon", bottom user section, and NO GitHub button.
      Done when: Tests fail and pin US2-1..4,7 + H7.
      Refs: T-F1, FR-020/FR-021/FR-022/FR-023, H7

- [ ] T078 Implement ComingSoon content region
      Files: `apps/web/src/admin/shell/ComingSoon.tsx`
      Do: Centered, faded "Coming Soon" placeholder; no feature pages.
      Done when: relevant T077 assertions pass.
      Refs: T-F1, FR-021, H7

- [ ] T079 Implement Sidebar user section
      Files: `apps/web/src/admin/shell/UserSection.tsx`
      Do: Bottom-pinned avatar + display name + account menu (Settings, Logout); initials fallback.
      Done when: relevant T077 assertions pass.
      Refs: T-F1, FR-022/FR-025, G4

- [ ] T080 Implement the Sidebar shell composition
      Files: `apps/web/src/admin/shell/Sidebar.tsx`
      Do: Compose Sidebar primitive + ComingSoon + UserSection; Ctrl/Cmd+B toggle hook.
      Done when: relevant T077 assertions pass.
      Refs: T-F1, FR-020, H2

- [ ] T081 Implement the TopBar
      Files: `apps/web/src/admin/shell/TopBar.tsx`
      Do: 48px bar with sidebar-collapse, UI-preference (theme/Default preset only), dark-mode toggle,
      account button; explicitly no GitHub control.
      Done when: relevant T077 assertions pass.
      Refs: T-F1, FR-023, H3/H7

- [ ] T082 Implement the AppShell composition
      Files: `apps/web/src/admin/shell/AppShell.tsx`
      Do: Lay out Sidebar + TopBar + content region inside `.admin-root`.
      Done when: T077 passes.
      Refs: T-F1, FR-020

- [ ] T083 [test] Pre-auth pages + guard test (T-F6)
      Files: `apps/web/src/admin/pages/preAuth.test.tsx`
      Do: Assert login renders "login v1" with NO Google option and a "Forgot password" entry, the
      two-factor code-entry renders, the reset page renders, and the settings route is guarded.
      Done when: Tests fail and pin US1-1,2 / US3 / US4-8.
      Refs: T-F6, FR-005/FR-006/FR-031/FR-034

- [ ] T084 Implement the Login page
      Files: `apps/web/src/admin/pages/Login.tsx`
      Do: Email+password form, no Google, "Forgot password" link; posts to `login`.
      Done when: relevant T083 assertions pass.
      Refs: T-F6, FR-005/FR-006

- [ ] T085 Implement the TwoFactor page
      Files: `apps/web/src/admin/pages/TwoFactor.tsx`
      Do: InputOTP code entry bound to `challengeId`; resend control; posts to `verify-2fa`.
      Done when: relevant T083 assertions pass.
      Refs: T-F6, B9, FR-031

- [ ] T086 Implement the ForgotPassword page
      Files: `apps/web/src/admin/pages/ForgotPassword.tsx`
      Do: Email entry; neutral confirmation; posts to `forgot-password`.
      Done when: relevant T083 assertions pass.
      Refs: T-F6, FR-014/FR-015

- [ ] T087 Implement the ResetPassword page
      Files: `apps/web/src/admin/pages/ResetPassword.tsx`
      Do: Consume link token, new password twice; client mirror of policy (server authoritative);
      posts to `reset-password`.
      Done when: relevant T083 assertions pass.
      Refs: T-F6, FR-016/FR-017

- [ ] T088 [test] Auth client + route guard test (T-F4)
      Files: `apps/web/src/admin/auth/auth.test.tsx`
      Do: Assert in-memory access token (never in `localStorage`/`sessionStorage`), silent refresh on
      expiry, Logout returns to login and blocks back-nav reuse, and the guard redirects unauthenticated
      access to login.
      Done when: Tests fail and pin US2-8 + FR-003/FR-038/FR-040.
      Refs: T-F4, T-F6, E2/E5, FR-003/FR-038/FR-040

- [ ] T089 Implement the admin apiClient hooks
      Files: `apps/web/src/admin/auth/apiClient.ts`
      Do: In-memory access token store, `credentials: 'include'` for the refresh cookie, silent refresh
      on `401`/expiry; no browser-stored secret.
      Done when: relevant T088 assertions pass.
      Refs: T-F4, E2/E3, FR-040

- [ ] T090 Implement the AuthProvider
      Files: `apps/web/src/admin/auth/AuthProvider.tsx`
      Do: Hydrate session via `me`, expose user/role/permissions + logout; drive preference load.
      Done when: relevant T088 assertions pass.
      Refs: T-F4, FR-036

- [ ] T091 Implement the route guard
      Files: `apps/web/src/admin/auth/guard.tsx`
      Do: Redirect unauthenticated/expired access to `/admin/login`.
      Done when: relevant T088 assertions pass.
      Refs: T-F6, FR-003

- [ ] T092 [test] Settings page test (T-F6 settings slice)
      Files: `apps/web/src/admin/pages/Settings.test.tsx`
      Do: Assert password-change form (current + new twice), photo upload/remove with initials fallback,
      read-only name + email, `super_admin` read-only, and that the page is unreachable unauthenticated.
      Done when: Tests fail and pin US4-1..8.
      Refs: T-F6, FR-032/FR-033/FR-034/FR-035

- [ ] T093 Implement the Settings page
      Files: `apps/web/src/admin/pages/Settings.tsx`
      Do: Wire password change, photo upload/remove (GET `settings/photo` for bytes vs initials),
      read-only name/email; hide edit controls for `super_admin`.
      Done when: T092 passes.
      Refs: T-F6, G6, FR-032/FR-033/FR-034/FR-035

- [ ] T094 Wire admin routing into the SPA
      Files: `apps/web/src/App.tsx`, `apps/web/src/route-config.tsx`
      Do: Mount `/admin/*` under AppShell + guard with the new pages; remove the legacy admin route
      imports.
      Done when: All `/admin` routes resolve to the new layer; no legacy import remains.
      Refs: research R12, FR-001/FR-003

- [ ] T095 [test] Theme + sidebar persistence test (T-F2)
      Files: `apps/web/src/admin/shell/persistence.test.tsx`
      Do: Toggle dark mode + sidebar collapse, remount, assert state restored with no flash and that
      the server preference round-trips.
      Done when: Tests fail then pass against the implemented shell + preferences.
      Refs: T-F2, H1/H2, FR-024

- [ ] T096 [test] Keyboard operability test (T-F3)
      Files: `apps/web/src/admin/shell/keyboard.test.tsx`
      Do: Tab through every control, assert visible focus and Ctrl/Cmd+B toggles the sidebar.
      Done when: Tests fail then pass against the shell.
      Refs: T-F3, H6, FR-030

- [ ] T097 [test] Mobile off-canvas drawer test (T-F5)
      Files: `apps/web/src/admin/shell/mobile.test.tsx`
      Do: At <768px assert the sidebar renders as an off-canvas drawer, top-bar controls reachable, no
      horizontal scroll at ≥320px.
      Done when: Tests fail then pass against the shell.
      Refs: T-F5, H5, FR-026/FR-027

- [ ] T098 [test] Audit events integration test (T-B6)
      Files: `apps/api/tests/integration/audit-events.test.ts`
      Do: Drive login/logout/OTP/reset/change flows and assert each writes its expected I1 action with
      no secrets.
      Done when: Tests pass against the implemented routes.
      Refs: T-B6, I1–I3, FR-037

- [ ] T099 [test] Log-line secret-redaction test
      Files: `apps/api/tests/integration/log-redaction.test.ts`
      Do: Capture Pino log output across login / 2FA / reset / change flows and assert no raw password,
      OTP code, or reset token ever appears in a log line (complements the audit-entry check).
      Done when: Tests fail on any leaked secret.
      Refs: FR-039, I3

- [ ] T100 Add log redaction (only if leakage is exposed)
      Files: `apps/api/src/config/logger.ts`
      Do: Add Pino redaction so passwords, OTP codes, and reset tokens never reach logs.
      Done when: T099 passes.
      Refs: FR-039

---

## Pass 2 — Make it right (turns every §4.2 edge case green)

- [ ] T101 [test] E-CREDS — generic-credential + deactivated tests
      Files: `apps/api/tests/integration/edge-creds.test.ts`
      Do: Assert unknown-email and wrong-password responses are byte-identical generic `401`;
      deactivated account (`isActive=false`) blocked with the same `401`.
      Done when: Tests fail (or expose gaps) for A5/A6.
      Refs: E-CREDS, A5/A6, FR-008

- [ ] T102 Harden generic-credential + deactivated handling
      Files: `apps/api/src/services/auth.ts`, `apps/api/src/routes/admin/auth.ts`
      Do: Normalize responses to byte-identical `401`; block inactive accounts post-credential.
      Done when: T101 passes.
      Refs: E-CREDS, A5/A6

- [ ] T103 [test] E-LOCK — lockout boundary tests
      Files: `apps/api/tests/integration/edge-lockout.test.ts`
      Do: With the injected clock assert 5th consecutive bad password locks (`423`), attempts during
      lock are blocked, and a successful reset clears the lock.
      Done when: Tests fail for A2/A3/C5.
      Refs: E-LOCK, A2/A3/C5, FR-009/FR-018

- [ ] T104 Harden account lockout + reset-clears-lock
      Files: `apps/api/src/services/auth.ts`
      Do: Enforce `failedLoginAttempts>=5` → `lockedUntil=now+15m`; reset clears counters.
      Done when: T103 passes; 100% branch on lockout paths.
      Refs: E-LOCK, A2/A3/A4/C5

- [ ] T105 [test] E-OTP — OTP edge tests
      Files: `apps/api/tests/integration/edge-otp.test.ts`
      Do: With the injected clock assert wrong code increments, expiry at `expiresAt+1s`, reuse rejected,
      6th wrong attempt invalidates, new-code supersedes prior, unknown/expired `challengeId` → `401`.
      Done when: Tests fail for B3–B6/B9.
      Refs: E-OTP, B3/B4/B5/B6/B9, FR-012/FR-013

- [ ] T106 Harden OTP invalidation + challenge resolution
      Files: `apps/api/src/services/loginCode.ts`, `apps/api/src/routes/admin/auth.ts`
      Do: Apply attempt cap, TTL, single-use, supersede, and `challengeId` resolution exactly.
      Done when: T105 passes; 100% branch coverage.
      Refs: E-OTP, B3–B6/B9

- [ ] T107 [test] E-RESET — reset edge tests
      Files: `apps/api/tests/integration/edge-reset.test.ts`
      Do: Unknown email → same neutral message + no email; reused/expired link → `410`; account-wide
      revoke verified across other sessions.
      Done when: Tests fail for C2/C3/C4/C6.
      Refs: E-RESET, C2/C3/C4/C6, FR-015/FR-017/FR-041

- [ ] T108 Harden reset neutrality + account-wide revoke
      Files: `apps/api/src/services/passwordResetToken.ts`, `apps/api/src/services/auth.ts`
      Do: Keep neutral responses, enforce single-use/expiry, revoke all families on success.
      Done when: T107 passes; 100% branch coverage.
      Refs: E-RESET, C2/C3/C4/C6

- [ ] T109 [test] E-POLICY — password policy edge tests
      Files: `apps/api/tests/integration/edge-policy.test.ts`
      Do: Assert length 11 rejected / 12 accepted, missing character class rejected, equals-current
      rejected, mismatched entries rejected, wrong current password on settings change rejected, and the
      server rejects even when a client bypass is simulated.
      Done when: Tests fail for D1–D7.
      Refs: E-POLICY, D1–D7, FR-019/FR-032

- [ ] T110 Harden server-side policy enforcement on both paths
      Files: `apps/api/src/services/passwordPolicy.ts`, `apps/api/src/routes/admin/auth.ts`,
      `apps/api/src/routes/admin/settings.ts`
      Do: Apply the identical policy at reset and settings change; `400` with specific messages.
      Done when: T109 passes.
      Refs: E-POLICY, D1–D7

- [ ] T111 [test] E-THROTTLE — cooldown + window-cap tests
      Files: `apps/api/tests/integration/edge-throttle.test.ts`
      Do: With the injected clock assert resend within 60s issues nothing, the 6th request in 15m is
      blocked, and all throttle responses stay neutral; derive state from `created_at` rows.
      Done when: Tests fail for F1/F2/F3.
      Refs: E-THROTTLE, F1/F2/F3, FR-042/FR-043

- [ ] T112 Harden resend cooldown + rolling-window cap
      Files: `apps/api/src/services/loginCode.ts`, `apps/api/src/services/passwordResetToken.ts`,
      `apps/api/src/routes/admin/auth.ts`
      Do: Derive 60s cooldown (latest row) and 5/15m cap (trailing-window count) from `created_at`;
      neutral `429`; surface countdown data to the UI.
      Done when: T111 passes.
      Refs: E-THROTTLE, F1/F2/F3

- [ ] T113 Wire the resend countdown into the UI
      Files: `apps/web/src/admin/pages/TwoFactor.tsx`, `apps/web/src/admin/pages/ForgotPassword.tsx`
      Do: Disable the resend control and show a countdown until the cooldown elapses.
      Done when: A frontend test asserts the disabled-with-countdown state.
      Refs: F1, FR-042

- [ ] T114 [test] E-PHOTO — photo validation edge tests
      Files: `apps/api/tests/integration/edge-photo.test.ts`
      Do: Assert `image/gif` rejected (`400`), 5MB+1byte rejected (`400`), and remove → initials
      fallback (`hasProfilePhoto=false`).
      Done when: Tests fail for G1/G2/G4.
      Refs: E-PHOTO, G1/G2/G4, FR-033

- [ ] T115 Harden profile-photo type/size validation
      Files: `apps/api/src/routes/admin/settings.ts`
      Do: Enforce MIME allow-list + 5MB cap pre-persist; ensure removal restores the initials fallback.
      Done when: T114 passes.
      Refs: E-PHOTO, G1/G2/G3/G4

- [ ] T116 [test] E-SESSION — session/refresh edge tests
      Files: `apps/api/tests/integration/edge-session.test.ts`,
      `apps/web/src/admin/auth/session.test.tsx`
      Do: Assert silent refresh on access-token expiry mid-use, refresh reuse revokes the whole family,
      and an expired/absent session on a protected view redirects to login.
      Done when: Tests fail for E2/E4/E5.
      Refs: E-SESSION, E2/E4/E5, FR-040

- [ ] T117 Harden refresh rotation + protected-view redirect
      Files: `apps/api/src/services/auth.ts`, `apps/web/src/admin/auth/apiClient.ts`,
      `apps/web/src/admin/auth/guard.tsx`
      Do: Family reuse-detection revoke server-side; client silent refresh + redirect on hard failure.
      Done when: T116 passes; 100% branch on rotation paths.
      Refs: E-SESSION, E4/E5

- [ ] T118 [test] E-IDLE — idle-timeout test
      Files: `apps/api/tests/integration/edge-idle.test.ts`
      Do: With the injected clock assert a refresh after >30m of inactivity is rejected even though the
      refresh token is otherwise unexpired (uses `RefreshToken.lastUsedAt`); absolute cap 7d.
      Done when: Tests fail for E7.
      Refs: E-IDLE, E7

- [ ] T119 Harden the 30m idle timeout via lastUsedAt
      Files: `apps/api/src/services/auth.ts`
      Do: Reject refresh when `now - lastUsedAt > 30m`; enforce the 7d absolute cap; update `lastUsedAt`
      on success.
      Done when: T118 passes; 100% branch coverage.
      Refs: E-IDLE, E7

- [ ] T120 [test] E-MAILFAIL — mailer-failure test
      Files: `apps/api/tests/integration/edge-mailfail.test.ts`
      Do: Stub the mailer to throw on the OTP/reset send; assert a clear non-technical error, no session
      granted, the code/token is NOT left consumed, and retry works.
      Done when: Tests fail for the mail-failure path.
      Refs: E-MAILFAIL, spec "Email delivery delay or failure", FR-010

- [ ] T121 Harden mailer-failure handling (no orphaned consume)
      Files: `apps/api/src/services/auth.ts`, `apps/api/src/services/loginCode.ts`,
      `apps/api/src/services/passwordResetToken.ts`
      Do: Roll back / avoid marking codes/tokens consumed when the email send fails; surface a clear,
      retryable error.
      Done when: T120 passes.
      Refs: E-MAILFAIL, SC-002

- [ ] T122 [test] E-SUPERADMIN — super_admin read-only test
      Files: `apps/api/tests/integration/edge-superadmin.test.ts`
      Do: As the `super_admin` account assert `settings/password`, `settings/photo` PUT, and
      `settings/photo` DELETE each return `403` with no change.
      Done when: Tests fail for FR-035.
      Refs: E-SUPERADMIN, FR-035

- [ ] T123 Harden super_admin read-only enforcement
      Files: `apps/api/src/routes/admin/settings.ts`, `apps/web/src/admin/pages/Settings.tsx`
      Do: Block all settings mutations for `super_admin` server-side; render the settings UI read-only
      for that account.
      Done when: T122 passes.
      Refs: E-SUPERADMIN, FR-035

- [ ] T124 [test] E-A11Y/THEME — accessibility + theme-flash test
      Files: `apps/web/src/admin/shell/a11y.test.tsx`
      Do: Run axe against login/2FA/reset/shell/settings asserting zero critical violations, visible
      focus on every control, and no wrong-theme frame on first paint.
      Done when: Tests fail for H1/H6.
      Refs: E-A11Y/THEME, H1/H6, FR-030/FR-031

- [ ] T125 Harden contrast, focus, and pre-paint theme
      Files: `apps/web/src/admin/theme/tokens.css`, `apps/web/src/admin/theme/boot.ts`,
      `apps/web/src/admin/ui/*`
      Do: Adjust token contrast (≥4.5:1 / 3:1), ensure visible focus rings everywhere, and guarantee the
      boot script paints the correct theme before hydration.
      Done when: T124 passes.
      Refs: E-A11Y/THEME, H1/H4/H6

---

## Final — Definition of Done verification

- [ ] T126 Pass lint across both apps
      Files: `apps/api`, `apps/web`
      Do: Run `pnpm lint`; fix violations. No emoji in code; conventional naming.
      Done when: Lint is clean.
      Refs: DoD-9

- [ ] T127 Pass typecheck across both apps
      Files: `apps/api`, `apps/web`
      Do: Run `pnpm typecheck`; fix type errors.
      Done when: Typecheck is clean.
      Refs: DoD-9

- [ ] T128 Run the API test suite + security coverage gate
      Files: `apps/api`
      Do: Run `pnpm --filter @modular-house/api test:run` and `test:coverage`; security modules (auth,
      loginCode, passwordResetToken, refresh rotation, lockout, requirePermission) hit 100% branch;
      overall line ≥70%.
      Done when: All tests pass and coverage gates are met.
      Refs: DoD-1/DoD-3, SC-009

- [ ] T129 Run the web test suite
      Files: `apps/web`
      Do: Run `pnpm --filter @modular-house/web test:run`; all admin tests (T-F1..T-F6) pass.
      Done when: Web suite is green.
      Refs: DoD-1, SC-009

- [ ] T130 Validate the OpenAPI contract
      Files: `apps/api/openapi.yaml`
      Do: Run `pnpm --filter @modular-house/api docs:validate`.
      Done when: Contract validation passes.
      Refs: DoD-9

- [ ] T131 Confirm zero public-site regressions
      Files: `apps/web` public-site + `@modular-house/ui` test suites
      Do: Run the existing public/UI/configurator/SEO suites untouched; confirm all green.
      Done when: No public regression; admin DS stayed isolated.
      Refs: DoD-5, SC-008, FR-004

- [ ] T132 Run a WCAG 2.1 AA audit on every Phase 1 surface
      Files: `apps/web/src/admin/**`
      Do: axe + manual keyboard pass on login, 2FA, reset, shell, settings; zero critical violations,
      full keyboard operability incl. sidebar toggle.
      Done when: Audit records zero critical violations.
      Refs: DoD-6, SC-005, FR-030/FR-031

- [ ] T133 Run the SC-004 visual-parity review
      Files: `specs/012-panel-phase-1/quickstart.md` (evidence) + the Studio Admin template design
      references
      Do: Verify the Phase 1 login + shell against the Studio Admin reference using the agreed
      visual-parity checklist; record ≥90% of items passing.
      Done when: ≥90% of checklist items pass and the result is recorded.
      Refs: SC-004

- [ ] T134 Run the real-OTP delivery check
      Files: `specs/012-panel-phase-1/quickstart.md` (§5 evidence)
      Do: Perform ≥10 real sends; confirm ≥9/10 arrive within 30s and no session is granted without a
      correct, unexpired code; record the result.
      Done when: ≥9/10 within 30s recorded.
      Refs: DoD-7, SC-002

- [ ] T135 Author the mobile design document
      Files: `apps/web/src/admin/docs/mobile-design.md`
      Do: Document the touch-first mobile layouts for all Phase 1 surfaces (login, 2FA, reset, shell,
      settings) alongside the Studio Admin template references.
      Done when: The document exists and covers every Phase 1 surface.
      Refs: DoD-8, FR-027, SC-012

- [ ] T136 Cross-check FR → test traceability
      Files: `specs/012-panel-phase-1/quickstart.md`
      Do: Verify every `FR-001..FR-043` maps to ≥1 passing test in the quickstart table; close any gap.
      Done when: No FR lacks a referenced passing test (DoD-2 satisfied).
      Refs: DoD-2

---

## Coverage notes

- **Endpoints (one task each):** login (T030/31), verify-2fa (T034/35), resend-code (T036/37),
  forgot-password (T038/39), reset-password (T040/41), refresh (T042/43), logout (T044/45),
  me (T046/47), settings/password (T048/49), settings/photo PUT (T050/51) / GET (T052/53) /
  DELETE (T054/55), settings/preferences GET (T056/57) / PUT (T058/59). Auth-route IP rate limit
  F4 (T032/33).
- **Explicit asks:** `challengeId` stable-across-resend (T036/37, T105/106, B9); idle timeout via
  `lastUsedAt` (schema T007/08, enforce T118/119, E7); `GET settings/photo` bytes + `hasProfilePhoto`
  (T052/53, T046/47, G6); preferences read-back via `me` / `GET preferences` for cross-device load
  (T046/47, T056/57, H1/H2); `super_admin` 403 on settings (T122/123, FR-035); audit of settings
  password change (T049, T098, I1); log-line secret redaction (T099/100, FR-039).
- **§4 test IDs covered:** T-B1 (T030/34), T-B2 (T038/40), T-B3 (T048), T-B4 (T050/52), T-B5 (T046),
  T-B6 (T098), T-B7 (T056/58); T-F1 (T077), T-F2 (T075/095), T-F3 (T096), T-F4 (T088), T-F5 (T097),
  T-F6 (T083/092); E-OTP, E-LOCK, E-CREDS, E-RESET, E-POLICY, E-THROTTLE, E-PHOTO, E-SESSION,
  E-A11Y/THEME, E-SUPERADMIN, E-IDLE, E-MAILFAIL (T101–T125).
- **§2 assertions enforced:** A1–A6 (T028/29, T101–104); B1–B9 (T017/18, T105/106); C1–C6 (T019/20,
  T107/108); D1–D7 (T013/14, T109/110); E1–E7 (T028/29, T116–119, idle schema T007/08); F1–F4
  (T111–113, IP limit T032/33); G1–G6 (T050–55, T114/115); H1–H7 (T003, T075/76, T077–81, T095–97,
  T124/125); I1–I3 (T015/16, T098, log redaction T099/100).
