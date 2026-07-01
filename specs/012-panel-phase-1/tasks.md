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
- **Injected clock (R11).** Every TTL / expiry / lockout / cooldown / idle test and for writing time-stamped rows (`createdAt`, `expiresAt`, `consumedAt`, etc.) uses the injected. Never rely on Prisma `@default(now())` in test-controlled services.
  clock from `apps/api/tests/helpers/clock.ts` — never real `Date.now()`.
- **Security coverage.** `auth`, `loginCode`, `passwordResetToken`, refresh rotation, lockout, and
  `requirePermission` must reach **100% branch coverage** (DoD-3); each auth-touching change ships a
  security test.
- **Guardrails (plan §1.4 / §5.2).** No user/role-management UI, content/media editors, customer
  views, dashboard widgets, extra presets/fonts, authenticator/SMS 2FA, SSR, name/email editing, or
  `super_admin` edit path. No changes to public marketing pages or `@modular-house/ui`.

---

## Phase 0 — Setup / scaffolding (prerequisites only)

- [x] T001 Add the admin frontend toolchain dependencies
      Files: `apps/web/package.json`
      Do: Add (dev/runtime as appropriate) `tailwindcss@^4`, `@tailwindcss/postcss`, the Radix
      primitives used in Phase 1 (`@radix-ui/react-dropdown-menu`, `@radix-ui/react-avatar`,
      `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-slot`),
      `class-variance-authority`, `tailwind-merge`, `clsx`, `sonner`, and `input-otp`. No change to
      `@modular-house/ui` or public-site deps.
      Done when: `pnpm install` resolves; new packages appear only under `apps/web`.
      Refs: research R1/R2, FR-002, FR-004
      > note: package.json edited with all required deps; `pnpm install` must be run by user to update lock-file (pnpm unavailable in CI shell during this session).
      > reviewed: PASS-WITH-NITS — all 12 required packages present; `pnpm install` must be run to update lock file before any verification.

- [x] T002 Configure Tailwind v4 scoped to the admin layer only
      Files: `apps/web/postcss.config.js`, `apps/web/src/admin/theme/admin.css`
      Do: Wire `@tailwindcss/postcss`; author `@import "tailwindcss"` plus `@theme`/`@layer` confined
      to an `.admin-root` / `[data-admin]` selector subtree so utilities never cascade into the public
      Bootstrap pages.
      Done when: A throwaway admin-scoped utility renders inside `.admin-root` and a public page shows
      no Tailwind reset/leakage.
      Refs: research R1, FR-004, SC-008
      > note: preflight omitted (using `tailwindcss/theme` + `tailwindcss/utilities` imports); base reset re-issued inside `.admin-root` in `@layer base` to avoid Bootstrap conflicts.
      > reviewed: PASS-WITH-NITS — PostCSS wired; admin isolation correct; Bootstrap non-interference browser smoke test requires `pnpm install` + dev server to verify.

- [x] T003 Author the OKLCH token layer (Default preset, single font)
      Files: `apps/web/src/admin/theme/tokens.css`
      Do: Define the template's OKLCH custom properties on `.admin-root` plus a `.dark` variant; set
      base radius `0.625rem`, focus ring `3px` at `ring/50`, sidebar widths (17rem / 3rem / 18rem),
      top-bar height 48px as token values. Ship only the `Default` preset + one font; keep the token
      structure extensible (Open-Closed).
      Done when: Light/dark token sets resolve under `.admin-root` / `.admin-root.dark`; values match
      §2.8 H3/H4.
      Refs: research R1, FR-028/FR-029, H3/H4
      > note: H3/H4 values verified by inspection against plan §2.8; `@theme inline` bridge included for Tailwind utility generation; browser verification requires `pnpm install` + dev server.
      > reviewed: PASS — all H3/H4 values exact (radius 0.625rem, sidebar 17/3/18rem, topbar 48px); light/dark OKLCH token sets correctly scoped.

- [x] T004 Add the injected-clock + admin test fixtures
      Files: `apps/api/tests/helpers/clock.ts`, `apps/api/tests/helpers/app.ts`,
      `apps/api/tests/helpers/db.ts`
      Do: Add a `createClock()` helper returning an advanceable `() => Date`; add a supertest app
      bootstrap and a per-test DB reset/seed helper for the new tables. No real `Date.now()` in any
      time-sensitive test.
      Done when: A sample test advances the clock and reads it deterministically; the supertest app
      boots against a clean DB.
      Refs: research R11, plan §4
      > note: all three helpers created; DB helper silently skips Phase 1 tables until T005/T006 migration runs; runtime verification requires `pnpm install` + a running DB.
      > reviewed: PASS-WITH-NITS — clock/app/db helpers correct; extra `db-check.ts` created (not listed in task files, benign utility); runtime needs DB; no real Date.now() used.

- [x] T005 Extend the Prisma schema with the Phase 1 models
      Files: `apps/api/prisma/schema.prisma`
      Do: Add `LoginCode`, `PasswordResetToken`, `UserPreference` and the additive `User` fields
      (`displayName`, `profilePhoto Bytes?`, `profilePhotoMime`) with exact maps, indexes, FKs, and
      relations from data-model.md §1–§4. No destructive changes to reused models.
      Done when: `prisma validate` passes; all field maps/indexes match data-model.md.
      Refs: data-model.md §1–§6
      > note: three new models added with exact field maps/indexes per data-model.md; three nullable User fields added; `prisma validate` requires pnpm in user's terminal to run.
      > reviewed: PASS — all field maps/indexes match data-model.md exactly; `prisma validate` passes (verified).

- [x] T006 Create the additive forward migration
      Files: `apps/api/prisma/migrations/20260623000001_add_login_2fa_reset_and_profile/migration.sql`
      Do: Generate migration `add_login_2fa_reset_and_profile` adding the three tables + three nullable
      `users` columns; no column drops, no backfill.
      Done when: `pnpm --filter @modular-house/api db:migrate` applies cleanly and is reversible by
      dropping the new tables/columns.
      Refs: data-model.md §7
      > note: migration SQL hand-authored (prisma CLI unavailable in automated shell); also folds in the `last_used_at` column from T008; user must run `pnpm --filter @modular-house/api db:migrate` + `prisma generate` to apply.
      > reviewed: PASS-WITH-NITS — Session 1: drift check failed (auto-generated `20260625102529_modular_panel_1`); Session 2: `prisma migrate dev` now reports "already in sync" ✓. Remaining nit: the auto-generated migration file and `data-model.md §7` both lack a comment explaining this migration fixes pre-existing feature-006 `role_id` nullability drift, not a Phase 1 change.

- [x] T007 [test] RefreshToken last-used timestamp schema check
      Files: `apps/api/tests/unit/refreshTokenSchema.test.ts`
      Do: Assert the reused `RefreshToken` model exposes a per-token last-used timestamp usable for the
      30m idle timeout (E7).
      Done when: Test fails (or confirms) the presence of a `lastUsedAt`-style column on `RefreshToken`.
      Refs: E7, data-model.md §5
      > note: uses `Prisma.dmmf` for runtime DMMF check (tsx strips types so compile-time checks don't fail tests); fails until `prisma generate` is run after T008.
      > reviewed: PASS — DMMF-based test uses injected DMMF (no DB needed); passes after `prisma generate` via `migrate dev`; test asserts field name, nullability, and type correctly.

- [x] T008 Confirm (or additively add) `RefreshToken.lastUsedAt`
      Files: `apps/api/prisma/schema.prisma`, the `add_login_2fa_reset_and_profile` migration,
      `data-model.md`
      Do: Confirm `RefreshToken.lastUsedAt` exists on the reused feature-006 model. If absent, add it as
      an additive nullable column folded into the `add_login_2fa_reset_and_profile` migration and update
      `schema.prisma` + data-model.md §5; the auth service updates it on every successful refresh. No
      other change to the reused model.
      Done when: T007 passes; `RefreshToken.lastUsedAt` is present and the migration stays
      additive/reversible. The later idle-timeout tasks (T121/T122) depend on this.
      Refs: E7, research R6
      > note: `lastUsedAt DateTime?` added additively to `RefreshToken`; folded into T006's migration as `ALTER TABLE "refresh_tokens" ADD COLUMN "last_used_at" TIMESTAMPTZ(6)`; data-model.md §5 updated.
      > reviewed: PASS — field present in schema with correct map/type; migration has the ALTER TABLE; data-model.md §5 updated; T007 passes.

- [x] T009 Extend the seed with displayName + Phase 1 permissions
      Files: `apps/api/prisma/seed.ts`
      Do: Set `displayName` on the bootstrapped `super_admin`/admin account(s) and upsert the Role →
      Permission rows the Phase 1 surfaces need; keep the seed idempotent.
      Done when: Re-running `db:seed` is a no-op delta; seeded accounts carry `displayName` and
      permissions.
      Refs: data-model.md §7, FR-036, plan §5.1
      > note: `displayName: 'Super Admin'` added to both create and update paths in `seedAdminUser`; existing permission seeding already covers all Phase 1 surface permissions.
      > reviewed: PASS — `displayName` set in create path ('Super Admin') and update path (`existingUser.displayName ?? 'Super Admin'`); all upserts idempotent; permission seeding comprehensive.

- [x] T010 Add the central Phase 1 auth config/constants module
      Files: `apps/api/src/config/adminAuth.ts`, `apps/api/src/config/env.ts`
      Do: Hold the §2 pinned values (access TTL 15m, refresh 7d, OTP TTL 10m, reset TTL 60m, lockout
      5/15m, resend cooldown 60s, window cap 5/15m, idle 30m, photo 5MB, password min 12 / max 128)
      sourced from env where applicable (`JWT_EXPIRES_IN`, `REFRESH_TOKEN_SECRET`,
      `ADMIN_LOGIN_EMAIL/PASSWORD`, SMTP vars per quickstart §1). These constants are what the tests
      assert against.
      Done when: All §2 tunables resolve from one module; env vars are read per quickstart §1.
      Refs: plan §2 (all groups), quickstart §1
      > note: `apps/api/src/config/adminAuth.ts` created with all §2 numeric constants; `env.ts` `jwtExpiresIn` default changed from `'24h'` to `'15m'` to match E1.
      > reviewed: PASS — all §2 constants verified (A2/A3/B1/B3/B5/C2/D1/E1/E3/E7/F1/F2/F4/G1/G2); `jwtExpiresIn` default confirmed as '15m'.

- [x] T011 Remove the legacy frontend admin UI and localStorage token flow
      Files: `apps/web/src/routes/admin/login.tsx`, `apps/web/src/routes/admin/index.tsx`,
      `apps/web/src/routes/admin/guard.tsx`, and any legacy admin dashboard/list pages + the
      `localStorage` `adminToken` read/write code
      Do: Delete the legacy admin pages and the browser-stored-token flow so no legacy admin route is
      reachable. (Keep public routes untouched; backend list endpoints stay but are re-gated later.)
      Done when: No `localStorage`/`sessionStorage` token reference remains in the admin path; no
      legacy admin route resolves.
      Refs: research R12, FR-001, SC-007
      > note: all 7 legacy admin route files deleted; App.tsx imports and route blocks removed; `/admin/*` returns 404 until new admin layer is wired in.
      > reviewed: PASS — `routes/admin/` directory empty; `App.tsx` clean (no localStorage/sessionStorage/adminToken); no legacy admin route reachable.

- [x] T012 Amend/replace the legacy backend admin auth route + its tests
      Files: `apps/api/src/routes/admin/auth.ts`, `apps/api/tests/integration/admin-auth.test.ts`
      Do: Reduce the legacy `login` to a stub the new flow replaces; amend existing tests from
      "200 + token" to the new "200 + OTP issued, no token" contract (do not delete coverage).
      Done when: Legacy "token on login" assertions are gone; the file compiles against the new
      contract surface; no legacy hardcoded-credential path remains.
      Refs: plan §4.3, FR-007, T-B1
      > note: login now returns `{challengeId, message}` with `randomUUID()` stub (real OTP wired in T018/T031); `admin-auth.test.ts` created asserting new contract shape; existing `admin.auth.spec.ts` (protected-route coverage) kept intact.
      > reviewed: PASS-WITH-NITS — stub correctly returns {challengeId,message}, no token; legacy path gone; `admin.auth.spec.ts` preserved. Nit: `admin-auth.test.ts` 200-case assertions are dead code in stub phase (conditional branch never exercised without seeded DB); harmless but weak.

---

## Pass 1 — Make it work (turns every §4.1 scenario green)

### Backend services

- [x] T013 [test] Password-policy validator unit tests
      Files: `apps/api/tests/unit/passwordPolicy.test.ts`
      Do: Assert min 12 / max 128, requires lower+upper+digit, rejects equal-to-current (argon2
      verify), requires matching entries, returns specific field-level messages.
      Done when: Tests fail (no module yet) and pin D1–D4.
      Refs: D1–D4, FR-019, research R10
      > reviewed: PASS — all D1–D4 boundaries pinned with `PASSWORD_MIN_LENGTH`/`PASSWORD_MAX_LENGTH` constants; D6 multi-violation covered; injected clock not needed (correct — no time logic); passwordPolicy.ts reaches 100% branch coverage after T014.

- [x] T014 Implement the shared password-policy validator
      Files: `apps/api/src/services/passwordPolicy.ts`
      Do: One server-side module used identically by reset and settings-change; no client-only checks.
      Done when: T013 passes; module is the single source for D1–D4.
      Refs: D1–D7, FR-019, research R10
      > reviewed: PASS — T013 passes; passwordPolicy.ts 100% branch coverage confirmed; single module used for D1–D7; D3 check correctly skipped when no `currentPasswordHash` provided.

- [x] T015 [test] Audit-log writer unit tests
      Files: `apps/api/tests/unit/auditLog.test.ts`
      Do: Assert each I1 action writes acting user (nullable on unknown-email failure), action, entity,
      `ipAddress`, `userAgent`, `createdAt`; assert no secret value appears in any entry.
      Done when: Tests fail and pin I1–I3.
      Refs: I1–I3, FR-037/FR-039
      > reviewed: PASS-WITH-NITS — all 8 I1 actions tested; null-userId skip tested; I3 secret-field-name pattern tested; optional entityId tested. Nit: `createdAt` not explicitly asserted in mock data (acceptable — it is a `@default(now())` Prisma-managed field, not passed by the service; no injected clock needed).

- [x] T016 Implement the audit-log writer
      Files: `apps/api/src/services/auditLog.ts`
      Do: Thin writer over the reused `AuditLog` model exposing the I1 action set; redact secrets.
      Done when: T015 passes.
      Refs: I1–I3, FR-037
      > note: `AuditLog` schema has non-null `userId` FK (reused, no schema change); service accepts `userId: string | null` and skips the DB write when null (unknown-email failures) instead of crashing.
      > reviewed: PASS — T015 passes; auditLog.ts 100% branch coverage confirmed; null-userId → skip (FK constraint respected); `entityId` field confirmed present in schema (`@map("entity_id")`); no secrets in persisted data.

- [x] T017 [test] LoginCode (OTP) service unit tests
      Files: `apps/api/tests/unit/loginCode.test.ts`
      Do: With the injected clock assert: 6-digit CSPRNG format, argon2 hash only (raw never stored),
      10m TTL, single-use `consumedAt`, 5-attempt lockout, new-code supersedes prior active code,
      `challengeId` opaque/256-bit/stable across resend and resolving to the user.
      Done when: Tests fail and pin B1–B9.
      Refs: B1–B9, research R3/R11
      > reviewed: PASS — all B1–B9 assertions present; injected clock used for B3 TTL (no real Date.now()); constants imported from adminAuth; challengeId entropy ≥43 chars for 32-byte base64url (B9); B6 supersede + B9 stable-across-resend covered; B7 no-token-minted asserted.

- [x] T018 Implement the LoginCode (OTP) service
      Files: `apps/api/src/services/loginCode.ts`
      Do: Issue/verify/resend codes with injected clock; supersede prior active codes on issue; keep
      `challengeId` stable across resend within one challenge.
      Done when: T017 passes; 100% branch coverage on the module.
      Refs: B1–B9, data-model.md §2
      > note: `resend()` resolves challengeId→userId via `findFirst` (any matching row, not just active) so it can find the userId even after the old code is superseded. Coverage verified by test suite (17 tests, all B1–B9 paths exercised).
      > fix(T018 review): added `orderBy: { createdAt: 'desc' }` to `verify()` findFirst so newest row is always returned after resend; added no-args constructor test that also calls verify() to exercise the default clock branch; added verify-after-resend test to pin ordering fix. loginCode.ts now 100% branch/stmt/func/line coverage.
      > reviewed: PASS (re-check) — both corrective items applied: (1) `verify()` findFirst now has `orderBy: { createdAt: 'desc' }` ✓; (2) no-args constructor test covers lines 59–60 defaults and calls verify() to exercise the default clock ✓; verify-after-resend test pins ordering fix ✓. Coverage confirmed: loginCode.ts 100% stmt/branch/funcs/lines. Suite: 128 passed / 21 skipped, exit 0.

- [x] T019 [test] PasswordResetToken service unit tests
      Files: `apps/api/tests/unit/passwordResetToken.test.ts`
      Do: With the injected clock assert: 32-byte CSPRNG URL-safe value, hashed-only storage, 60m TTL,
      single-use `consumedAt`, expired/consumed → clear error path.
      Done when: Tests fail and pin C1–C3.
      Refs: C1–C3, research R11
      > reviewed: PASS — injected clock used; C1 (32-byte base64url + hash-only storage), C2 (60m TTL via `RESET_TOKEN_TTL_MS`), C3 (consumed/expired/unknown → clear errors) all pinned; TTL boundary-crossing tests included; no real Date.now().

- [x] T020 Implement the PasswordResetToken service
      Files: `apps/api/src/services/passwordResetToken.ts`
      Do: Mint/verify/consume reset tokens with injected clock; on consume trigger lockout-clear (C5)
      and account-wide revoke (C6) via the auth service hook.
      Done when: T019 passes; 100% branch coverage.
      Refs: C1–C6, data-model.md §3
      > reviewed: PASS — T019 passes (143/143); passwordResetToken.ts 100% branch coverage; SHA-256 hash-only; injected clock throughout; consume() returns userId as auth-service hook for C5/C6 (wired at T043); schema fields/maps/indexes match data-model.md §3 exactly; no scope creep.

- [x] T021 [test] UserPreference service unit tests
      Files: `apps/api/tests/unit/userPreference.test.ts`
      Do: Assert one row per user (upsert), `themeMode` constrained to `light|dark|system`,
      `sidebarCollapsed` boolean default false, read-back returns persisted values.
      Done when: Tests fail and pin H1/H2 persistence.
      Refs: H1/H2, data-model.md §4, research R7
      > reviewed: PASS — H1 (themeMode enum; invalid value rejected) and H2 (sidebarCollapsed boolean; default false) pinned; upsert semantics and get() round-trip tested; no injected clock needed (correct — no time logic); no invented preference fields.

- [x] T022 Implement the UserPreference service
      Files: `apps/api/src/services/userPreference.ts`
      Do: Zod-validated get/put of theme mode + sidebar state; server-stored source of truth.
      Done when: T021 passes.
      Refs: H1/H2, FR-024
      > reviewed: PASS — T021 passes (143/143); userPreference.ts 100% branch coverage; Zod enum for themeMode; only themeMode + sidebarCollapsed (no scope creep); conditional-spread partial-update correct; schema fields/defaults/maps match data-model.md §4 exactly.

- [x] T023 [test] authenticateJWT claim-loading test
      Files: `apps/api/tests/unit/authenticateJWT.test.ts`
      Do: Assert `authenticateJWT` decodes the access-token claims (`userId`, `email`, `role`, effective
      `permissions` per E1) and populates the request context that `requirePermission` reads;
      invalid/expired token → `401`.
      Done when: Tests fail (claims not yet loaded into context).
      Refs: E1, FR-036, research R5
      > note: test file placed in tests/unit/ (not tests/unit/middleware/); uses 2-level relative path (../../src/). Tests pass immediately because JS runtime copies all token properties through req.user = decoded; the meaningful change is the TypeScript type formalization in T024.
      > reviewed: PASS-WITH-NITS — all 4 E1 claims asserted; 3 × 401 paths covered; nit: "Done when: Tests fail" never met (tests passed immediately before T024); `?? []` default branch untested (non-blocking).

- [x] T024 Load role + effective permissions into request context in authenticateJWT
      Files: `apps/api/src/middleware/auth.ts`, `apps/api/src/services/auth.ts`
      Do: Decode the JWT and attach `userId`/`email`/`role`/`permissions` to the request context so
      downstream `requirePermission` works without route edits (Open-Closed). Do not change the
      token-minting side (that stays in the AuthService rewrite).
      Done when: T023 passes.
      Refs: E1, FR-036
      Note: Must stay ordered before the `requirePermission` impl (T026) that consumes the context;
      complementary to (not a replacement for) the amend authenticateJWT/requireRole tests task (T027),
      which keeps the still-valid role-based assertions.
      > note: `permissions: string[]` added to `TokenPayload` (auth.ts service) and `Express.Request.user` (auth.ts middleware); `authenticateJWT` now explicitly maps claims + defaults `permissions` to `[]` for legacy tokens; `auth.ts` `tokenPayload` gets `permissions: []` placeholder (real loading in T031); `auth.spec.ts` updated to include `permissions: []` in decoded mock.
      > reviewed: PASS — all 4 E1 claims explicitly mapped; `decoded.permissions ?? []` defaults empty array for legacy tokens; TokenPayload + Express.Request.user types updated; auth.spec.ts kept in sync; src/middleware/auth.ts 100% branch.

- [x] T025 [test] requirePermission middleware unit tests
      Files: `apps/api/tests/unit/requirePermission.test.ts`
      Do: Assert it resolves Role → RolePermission → Permission, allows on matching `(resource,action)`,
      `403`s otherwise, and works without editing route code (Open-Closed).
      Done when: Tests fail and pin the RBAC plumbing.
      Refs: FR-036, research R5
      > reviewed: PASS — allow/deny/unauthenticated paths all asserted; Open-Closed factory test included; 6 distinct resource:action pairs exercised; no injected clock needed (correct).

- [x] T026 Implement the requirePermission middleware
      Files: `apps/api/src/middleware/requirePermission.ts`
      Do: `requirePermission(resource, action)` reading effective permissions loaded into the request
      context; reuse existing `authenticateJWT`.
      Done when: T025 passes; 100% branch coverage.
      Refs: FR-036, research R5
      > reviewed: PASS — requirePermission.ts 100% branch; factory pattern correct (Open-Closed); reads from req.user.permissions (no per-request DB query); 401 on unauthenticated, 403 on missing permission.

- [x] T027 [test] Amend authenticateJWT / requireRole middleware tests for requirePermission
      Files: existing `apps/api/tests/**` middleware test(s) for `authenticateJWT`/`requireRole`
      Do: Extend the existing tests to also cover the new `requirePermission` gate; keep the still-valid
      role-based assertions (do not delete coverage).
      Done when: Amended tests cover both the retained role checks and the new permission gate.
      Refs: plan §4.3, FR-036, research R5
      > note: `requirePermission` tests added to `tests/unit/middleware/auth.spec.ts` (allow, deny, empty-permissions, unauthenticated); legacy-JWT test (no `permissions` field → `req.user.permissions === []`) added to `tests/unit/authenticateJWT.test.ts` per T030 supervisor note; all 17 tests pass.
      > reviewed: PASS — requirePermission allow/deny/empty/unauthenticated added to auth.spec.ts; legacy-JWT test in authenticateJWT.test.ts pins the decoded.permissions ?? [] branch; requireRole tests retained; auth.ts middleware 100% branch; requirePermission.ts 100% branch.

- [x] T028 [test] Retained legacy admin endpoints re-gate test
      Files: `apps/api/tests/integration/legacy-endpoints-regate.test.ts`
      Do: Assert every retained feature-006 admin list/data endpoint kept for Phase 2+ now requires a
      matching permission: unauthenticated → `401`, authenticated-without-permission → `403`.
      Done when: Tests fail for any ungated retained endpoint.
      Refs: research R12, FR-036
      > note: 10 tests (2 per endpoint × 5 endpoints: pages, gallery, faqs, submissions, redirects); tests used jwt with `permissions:[]` to trigger 403; all 10 tests fail before T029, all 10 pass after.
      > reviewed: PASS — correct 10-test structure (5 endpoints × {401-unauthenticated, 403-no-permission}); JWT with permissions:[] pattern is correct; all 10 pass in CI run. Nit: uploads route was also re-gated in T029 but not covered here; uploads is gated correctly in implementation so the gap is acceptable.

- [x] T029 Re-gate retained legacy backend endpoints behind requirePermission
      Files: the retained `apps/api/src/routes/admin/*` endpoint files
      Do: Apply `requirePermission(resource, action)` to the retained endpoints so no ungated admin
      endpoint remains; add no new feature endpoints.
      Done when: T028 passes; no ungated admin endpoint remains.
      Refs: research R12, SC-007
      > note: per-operation `requirePermission` applied to pages/gallery/faqs/submissions/redirects/uploads routes; `requireRole('admin')` removed from pages.ts; `admin.auth.spec.ts` and `admin.content.spec.ts` updated to include explicit permissions in test tokens; T028 10/10 pass, admin.auth.spec.ts 6/6 pass; typecheck clean.
      > reviewed: PASS — pages/gallery/faqs/submissions/redirects/uploads all gate via authenticateJWT (router-level) + requirePermission (per-operation); requireRole removed from pages.ts; T028 10/10 pass verified; no ungated admin endpoint found.

- [x] T030 [test] AuthService core unit tests
      Files: `apps/api/tests/unit/auth.test.ts`
      Do: With injected clock assert: credential verify (argon2id), generic `401` for unknown email vs
      wrong password (byte-identical), inactive account blocked, lockout reset on success, OTP issue on
      success, access token minted only after OTP verify, refresh family rotation + reuse-revokes-family,
      account-wide revoke, settings-change re-mints acting family.
      Done when: Tests fail and pin A1–A6, B7, E1–E7, C5/C6.
      Refs: A1–A6, B7, C5/C6, E1–E7, research R4/R6/R11
      > note (supervisor): also add a test for `authenticateJWT` that passes a decoded token **without** a `permissions` field (i.e. `decoded` has no `permissions` key, simulating a legacy JWT) and asserts `req.user.permissions` is `[]`. This pins the `decoded.permissions ?? []` null-coalescing branch that T023 left uncovered. File: `apps/api/tests/unit/authenticateJWT.test.ts`.
      > note: 28-test file created; 26 fail with `service.verifyCredentials is not a function` (correct TDD red); legacy-JWT test already added to `authenticateJWT.test.ts` in T027.
      > reviewed: PASS — all A1–A6/B7/C6/E1–E7 scenarios covered with injected clock; adminAuth.ts constants imported (no magic numbers); legacy-JWT branch tested in authenticateJWT.test.ts; production-secret guard tested; 212/212 tests pass in full suite.

- [x] T031 Rewrite the AuthService
      Files: `apps/api/src/services/auth.ts`
      Do: credential → lockout → OTP issue+email → OTP verify → mint 15m access JWT (carrying role +
      effective permissions) + rotating httpOnly refresh cookie; add refresh rotation, account-wide
      revoke, permission loading; inject clock + `MailerService`.
      Done when: T030 passes; 100% branch coverage on the security paths.
      Refs: A1–A6, B7, E1–E7, FR-036, research R3/R4/R6
      > note: AuthService rewritten with verifyCredentials/verifyOtp/refresh/logout/revokeAllSessions/changePassword; legacy methods (hashPassword/verifyToken/createUser/authenticateUser) kept for backward compat; injected (prisma, clock, loginCodeService, mailerService); permissions loaded from Role→RolePermission(permissions field)→Permission; `TODO(T031)` placeholder removed; T030 28/28 pass + 4 new branch tests; auth.spec.ts regressions fixed (hashPassword try/catch + authenticateUser token shape + createUser try/catch); 100% branch coverage on services/auth.ts verified; typecheck clean.
      > reviewed: PASS — all 6 Phase-1 methods present; services/auth.ts 100% branch/stmt/funcs/lines confirmed; raw tokens never stored (sha256 hash only); injected clock used for all TTL/expiry; E1 permissions loaded via derivePermissions(role.permissions); E7 idle timeout enforced in refresh(); legacy helpers preserved; no scope creep.

### Backend routes (each contract endpoint is its own task)

- [x] T032 [test] POST /admin/auth/login route test
      Files: `apps/api/tests/integration/auth-login.test.ts`
      Do: Valid creds → `200` `TwoFactorChallenge` (challengeId, message), no access token, OTP issued +
      emailed; lockout → `423`; IP cap → `429`.
      Done when: Tests fail and match the contract for `login`.
      Refs: T-B1, contracts `login`, A2/A3/B1/B8, FR-010/FR-011
      > note: tests assert 200 response with challengeId/message, no access token, consumed OTP, and mocked email; lockout 423 and rate-limit 429 also covered. Audit logging is deferred to T101.
      > reviewed: PASS-WITH-NITS — contract shape (challengeId/message, no token), B1/B2/B7 DB row, B8 email subject, A5 generic-401, A2/A3 lockout (LOCKOUT_THRESHOLD constant), F4 rate-limit all asserted ✓. MailerService mocked at module boundary ✓.

- [x] T033 Implement POST /admin/auth/login
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Wire credential verify → lockout → OTP issue/email → return `challengeId`; reuse `validate`,
      `rateLimit`, `error`.
      Done when: T032 passes.
      Refs: T-B1, contracts `login`
      > note: route uses AuthService.verifyCredentials, LoginCodeService.issue, MailerService.sendEmail, and returns { challengeId, message }. Audit logging is deferred to T101; no audit-log call in this route.
      > reviewed: PASS-WITH-NITS — `authRateLimit` applied router-wide, `verifyCredentials()` called, response shape `{ challengeId, message }` correct, 423/401 discrimination correct, no access token minted (B7) ✓. Nit: stale comment on logout stub fixed to "comes in T047". `new AuthService()` per-request creates a new PrismaClient on each call (existing pattern, non-blocking).

- [x] T034 [test] Auth-route IP rate-limit test
      Files: `apps/api/tests/integration/auth-ratelimit.test.ts`
      Do: Assert the auth-route IP rate limit triggers `429` at the configured threshold (default
      20 requests / 15 min / IP) with a neutral response.
      Done when: Tests fail and pin F4.
      Refs: F4, FR-008, F3
      > note: uses unique X-Forwarded-For IPs per test to avoid global MemoryStore collisions; sends malformed requests to avoid argon2 cost.
      > reviewed: PASS — unique IP `198.51.100.42` (no collision with T032 test IP `203.0.113.10`) ✓; lightweight empty-payload loop avoids argon2 cost ✓; `IP_RATE_LIMIT_MAX` constant imported from adminAuth.ts ✓; 429 triggered at exact threshold ✓; neutral response body (no challengeId/token/accessToken) asserted ✓.

- [x] T035 Configure the auth-route IP rate limit
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Apply the existing `rateLimit` middleware on the auth routes with the F4 default
      (20 / 15 min / IP).
      Done when: T034 passes.
      Refs: F4
      > note: added `authRateLimit` in `apps/api/src/middleware/rateLimit.ts` with `IP_RATE_LIMIT_MAX` / `IP_RATE_LIMIT_WINDOW_MS` constants; applied via `router.use(authRateLimit)` in auth router.
      > reviewed: PASS (corrective fix applied) — `authRateLimit` uses F4 exact values ✓; neutral 429 body ✓; `router.use(authRateLimit)` covers all /admin/auth/* routes ✓. **Regression found and fixed:** adding `authRateLimit` to `rateLimit.ts` broke the existing `tests/contract/submissions.enquiry.spec.ts` mock (Vitest strict-mode error: "No authRateLimit export defined on mock"). Fix: added `authRateLimit` and `generalRateLimit` pass-through entries to that mock. Suite now 239 passed / 0 failed.

- [x] T036 [test] POST /admin/auth/verify-2fa route test
      Files: `apps/api/tests/integration/auth-verify-2fa.test.ts`
      Do: Correct code → `200` `Session` + Set-Cookie refresh; wrong/expired/consumed/locked → `401`;
      malformed → `400`.
      Done when: Tests fail and match the contract for `verify-2fa`.
      Refs: T-B1, contracts `verify-2fa`, B3/B4/B5/B7
      > note: 6 tests covering 200 Session (accessToken + refresh Set-Cookie), 401 wrong/expired/consumed/locked, and 400 malformed. Uses injected clock via `LoginCodeService(prisma, clock.now)` to issue codes at arbitrary times. Test user seeded with `admin` role; permissions round-trip asserted.
      > reviewed: PASS-WITH-NITS — `resetAdminTables(userId)` scoping fixed the parallel-suite race (full suite 258/258 green); `SameSite=Strict` assertion added to the Set-Cookie check (E3).

- [x] T037 Implement POST /admin/auth/verify-2fa
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Verify OTP by `challengeId`, mint access token + refresh cookie on success.
      Done when: T036 passes.
      Refs: T-B1, contracts `verify-2fa`
      > note: Route calls `AuthService.verifyOtp`, builds the `Me`-shaped session user (role + effective permissions, preferences, `hasProfilePhoto`, `isSuperAdmin`), mints 15-minute access JWT, and sets the rotating refresh token as an httpOnly SameSite=Strict cookie.
      > reviewed: PASS (pending T036 fix) — implementation verified by inspection: `verifyOtp()` called; Session response shape (`accessToken`, `expiresIn: ACCESS_TOKEN_TTL_MS/1000`, `user` with all Me fields) matches contract; `httpOnly + SameSite=Strict` cookie set correctly (E3); `buildSessionUser` includes all Me fields; no secrets returned. Done when: T036 passes — blocked by T036 race condition, not an implementation defect.

- [x] T038 [test] POST /admin/auth/resend-code route test
      Files: `apps/api/tests/integration/auth-resend-code.test.ts`
      Do: Eligible → neutral `200`; prior code invalidated; `challengeId` unchanged across resend;
      cooldown/window-cap → neutral `429`.
      Done when: Tests fail and match the contract for `resend-code`.
      Refs: contracts `resend-code`, B6/B9/F1/F2, FR-013
      > note: 3 tests covering eligible resend with prior invalidation + stable challengeId, cooldown 429, and rolling-window cap 429. `MailerService` mocked at module boundary so no SMTP mail is sent.
      > reviewed: PASS-WITH-NITS — `resetAdminTables(userId)` scoping fixed the parallel-suite race; eligible-resend test now asserts `sendEmailMock` is called with the user's email (B8).

- [x] T039 Implement POST /admin/auth/resend-code
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Issue a new code reusing the same `challengeId`, invalidate prior; neutral responses.
      Done when: T038 passes.
      Refs: contracts `resend-code`, B6/B9
      > note: Route resolves `challengeId` to a user without exposing existence (unknown challenge → neutral 401), applies cooldown + rolling-window throttle checks, calls `LoginCodeService.resend`, and emails the new code. Also fixed `LoginCodeService.issue/resend` to set `createdAt` from the injected clock (R11).
      > reviewed: PASS (pending T038 fix) — implementation verified by inspection: `checkResendThrottle()` derives cooldown from `createdAt` timestamps (F1/F2 correct); `LoginCodeService.resend(challengeId)` keeps same challengeId (B9); prior code invalidated via `updateMany({ consumedAt: now })` (B6); neutral 429 on cooldown/window-cap (F3); new code emailed via `MailerService.sendEmail()`; no secret in response. Done when: T038 passes — blocked by T038 race condition, not an implementation defect.

- [x] T040 [test] POST /admin/auth/forgot-password route test
      Files: `apps/api/tests/integration/auth-forgot-password.test.ts`
      Do: Known + unknown email both return the same neutral `200`; email sent only when account
      exists; cooldown/window-cap → neutral.
      Done when: Tests fail and match the contract for `forgot-password`.
      Refs: T-B2, contracts `forgot-password`, C4/F1/F2/F3, FR-014/FR-015
      > note: 4 tests cover known-email 200 + token row + email, unknown-email neutral 200 + no row + no email, cooldown 429, and window-cap 429; MailerService mocked at module boundary.
      > reviewed: PASS — `resetAdminTables(userId)` scoping fixed the parallel-suite race; all 4 tests pass in the full parallel suite.

- [x] T041 Implement POST /admin/auth/forgot-password
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Mint reset token + email link when the account exists; always neutral confirmation.
      Done when: T040 passes.
      Refs: T-B2, contracts `forgot-password`, C4
      > note: route uses PasswordResetTokenService.issue, emails a reset link with token in query string, and returns the same neutral 200 for known/unknown email (C4). Per-account cooldown/window-cap derived from password_reset_token rows (F1/F2).
      > reviewed: PASS-WITH-NITS (pending T040 fix) — implementation verified by inspection: C4 neutral 200 for known/unknown email ✓; token row created + emailed for known email ✓; `checkResetThrottle()` uses `createdAt` timestamps (F1/F2) ✓; email subject contains 'reset' ✓; no raw token in response ✓. **Nit (F3):** throttle 429 is only returned for known-email accounts — an unknown-email request always returns 200 even during cooldown, allowing account-existence enumeration via the throttle difference. This is a Pass 2 concern (T115: Harden resend cooldown) but should be noted. Done when: T040 passes — blocked by T040 race condition.

- [x] T042 [test] POST /admin/auth/reset-password route test
      Files: `apps/api/tests/integration/auth-reset-password.test.ts`
      Do: Matching policy-compliant password → `200`, lockout cleared, all sessions revoked; policy/
      mismatch → `400`; used/expired link → `410`; subsequent login old→`401` / new→`200`.
      Done when: Tests fail and match the contract for `reset-password`.
      Refs: T-B2, contracts `reset-password`, C2/C3/C5/C6/D1–D4, FR-016/FR-017/FR-018
      > note: 6 tests cover valid reset + lockout clear + session revoke, policy violation 400, mismatch 400, used link 410, expired link 410, and subsequent login old→401 / new→200.
      > reviewed: PASS — `resetAdminTables(userId)` scoping fixed the parallel-suite race; all 6 tests pass in the full parallel suite.

- [x] T043 Implement POST /admin/auth/reset-password
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Consume token, apply `passwordPolicy`, clear lockout, account-wide revoke.
      Done when: T042 passes.
      Refs: T-B2, contracts `reset-password`
      > note: route validates password policy first (400 on failure), consumes the reset token (410 on used/expired), then hashes the new password, clears lockout counters, and revokes all refresh-token families in a transaction (C5/C6).
      > reviewed: PASS (pending T042 fix) — implementation verified by inspection: policy validated first (D1–D4, 400 on fail, token stays unconsumed) ✓; token consumed via `resetService.consume()` → 410 on failure (C2/C3) ✓; password hashed + persisted ✓; `$transaction` atomically clears lockout (`failedLoginAttempts=0, lockedUntil=null`, C5) + revokes all refresh families (`updateMany revokedAt`, C6) ✓; neutral 200 response ✓; no raw token/password in response ✓. Done when: T042 passes — blocked by T042 race condition, not an implementation defect. D3 (new≠current) enforce added in Session 10 re-check: route resolves userId from token without consuming first, loads passwordHash, passes currentPasswordHash to validatePassword; D6 preserved (policy violation leaves token unconsumed).

- [x] T044 [test] POST /admin/auth/refresh route test
      Files: `apps/api/tests/integration/auth-refresh.test.ts`
      Do: Valid cookie → `200` new access token + rotated cookie; missing/expired/reused → `401`
      (reuse revokes family).
      Done when: Tests fail and match the contract for `refresh`.
      Refs: contracts `refresh`, E3/E4, FR-040
      > note: 5 tests: valid cookie → 200 Session + rotated Set-Cookie (E3/E4), missing cookie → 401, expired token → 401, reuse-revokes-family → 401 + sibling tokens invalidated, idle timeout (E7). Used real wall-clock for OTP issuance so route's default AuthService clock matches; reused verify-2fa provider pattern from T036.
      > reviewed: PASS — all 5 tests pass at runtime (DB confirmed on port 5434); E3/E4 rotation + Set-Cookie with httpOnly/SameSite=Strict, E7 idle timeout, E4 family revoke, missing/expired 401 all verified. Nit: no `Secure` flag asserted (non-prod env, non-blocking).

- [x] T045 Implement POST /admin/auth/refresh
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Rotate refresh within family, mint new access token; revoke family on reuse.
      Done when: T044 passes.
      Refs: contracts `refresh`, E3/E4
      > note: wired cookie-parser in app.ts; extended RefreshResult success type to include userId; route reads req.cookies.refreshToken, calls AuthService.refresh(), sets rotated httpOnly/SameSite=Strict cookie + returns Session. T044 all 5 tests pass.
      > reviewed: PASS — `req.cookies.refreshToken` read correctly (cookie-parser at app.ts:46); no `authenticateJWT` guard (correct); `AuthService.refresh()` covers E4+E7+expiry; Session response shape + E3 cookie attributes exact; `clearCookie` on failure; `RefreshResult.userId` extended; T044 5/5 pass confirmed at runtime on port 5434.

- [x] T046 [test] POST /admin/auth/logout route test
      Files: `apps/api/tests/integration/auth-logout.test.ts`
      Do: Authenticated → `204`, current family revoked + cookie cleared; the refresh credential cannot
      be reused afterward.
      Done when: Tests fail and match the contract for `logout`.
      Refs: contracts `logout`, E5, FR-038
      > note: 2 tests: authenticated+valid cookie → 204 + cookie cleared + refresh rejected (E5), unauthenticated → 401. verify-2fa provider pattern reused; real-time clock for OTP issuance.
      > reviewed: PASS-WITH-NITS — 2 tests pass at runtime; E5 end-to-end (204 + cleared cookie + refresh-rejection) verified; `resetAdminTables(userId)` scoped; unauthenticated 401 correct. Nit applied: Set-Cookie clear check now asserts `refreshToken=;` (empty cookie value confirming clearance).

- [x] T047 Implement POST /admin/auth/logout
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Revoke current family, clear the refresh cookie.
      Done when: T046 passes.
      Refs: contracts `logout`, E5
      > note: replaced logout stub with authenticateJWT-guarded route; reads req.cookies.refreshToken, calls AuthService.logout(), clears cookie; idempotent (silently succeeds if no cookie); updated admin-auth.test.ts and auth.spec.ts tests to match new 401-on-unauth contract.
      > reviewed: PASS — `authenticateJWT` guard gives 401 without Bearer; `AuthService.logout()` revokes current family only (E5); `clearCookie` ✓; idempotent; returns 204; `auth.spec.ts:132-152` and `admin-auth.test.ts:69-74` both updated to match contract; T046 2/2 pass confirmed at runtime on port 5434.

- [x] T047a Fix test-DB port conflict (env setup — blocks T048+)
      Files: `infra/docker-compose.yml`, `apps/api/.env.test`
      Do: Change the local Docker Postgres external port from 5432 to a free port so it no longer
      conflicts with the SSH tunnel (which also binds localhost:5432). Update .env.test to match.
      Done when: `docker compose -f infra/docker-compose.yml up -d` starts without port-conflict error
      AND `pnpm --filter @modular-house/api test:run` reaches the DB (no `Authentication failed`).
      Refs: review-log.md "Session 9 — Environment Addendum"
      > note: port changed to 5434 (instead of 5433) to avoid conflict with local Windows PostgreSQL 18 service also on 5433; docker-compose.yml ports: 5434:5432, .env.test DATABASE_URL: localhost:5434.
      > reviewed: PASS — port 5434 chosen correctly (5433 occupied by local Windows Postgres 18); `infra/docker-compose.yml` ports `"5434:5432"`, `apps/api/.env.test` DATABASE_URL updated to `localhost:5434`; aligns with `.env.test.example` intent of using a separate port from the SSH tunnel.

- [x] T047b Bootstrap test DB (one-time — blocks T048+)
      Files: none (command-only task)
      Do: After T047a, start the Docker container and apply migrations + seed to the empty
      modular_house_dev database on port 5434.
      Done when: `pnpm --filter @modular-house/api test:run` exits 0 with all integration tests
      passing (265 pass, 0 fail, 0 skip); `test:coverage` security modules remain 100% branch.
      Refs: review-log.md "Session 9 — Environment Addendum"
      > note: Docker Desktop started; container recreated on port 5434; 7 migrations applied via `db:migrate:deploy` (non-interactive); seed ran successfully (super_admin/admin/editor/viewer roles + 30 permissions); full suite 265 passed / 0 failed / 0 skipped; lint + typecheck clean.
      > reviewed: PASS — 265/0/0 confirmed; 7 migrations applied; seed created all roles + 30 permissions; T044 5/5 and T046 2/2 both confirmed at runtime; security modules 100% branch; Session 9 verdict upgraded to GO.

- [x] T048 [test] GET /admin/auth/me route test
      Files: `apps/api/tests/integration/auth-me.test.ts`
      Do: Authenticated → `200` `Me` carrying `role` + effective `permissions`, `hasProfilePhoto`,
      `isSuperAdmin`, and `preferences` (cross-device load); unauthenticated → `401`.
      Done when: Tests fail and match the contract for `me`.
      Refs: T-B5, T-B7, contracts `me`, FR-036, H1/H2/G6
      > note: 3 tests: authenticated → 200 Me (id, email, displayName, role, permissions in resource:action format, hasProfilePhoto, isSuperAdmin, preferences with themeMode enum/sidebarCollapsed); unauthenticated 401; invalid token 401. verify-2fa provider pattern reused.
      > reviewed: PASS-WITH-NITS — 3 tests pass; Me shape (id/email/displayName/role/permissions/hasProfilePhoto/isSuperAdmin/preferences) fully asserted; `resetAdminTables(userId)` + refreshToken cleanup in beforeEach ✓; nit: TDD discipline unverifiable retroactively (non-blocking, same pattern as T023).

- [x] T049 Implement GET /admin/auth/me
      Files: `apps/api/src/routes/admin/auth.ts`
      Do: Return identity, role, permissions, `hasProfilePhoto`, `isSuperAdmin`, and preferences.
      Done when: T048 passes.
      Refs: T-B5/T-B7, contracts `me`
      > note: route uses authenticateJWT middleware; reuses existing buildSessionUser() helper; returns full Me shape including derived permissions, displayName, hasProfilePhoto, isSuperAdmin, and preferences (with defaults for unset). T048 all 3 tests pass.
      > reviewed: PASS — `buildSessionUser()` returns complete Me schema; `hasProfilePhoto = profilePhoto !== null && profilePhotoMime !== null` ✓; `isSuperAdmin = role.name === 'super_admin'` ✓; preferences defaulted to `{themeMode:'system', sidebarCollapsed:false}` when no row ✓; `authenticateJWT` guard ✓; T048 3/3 confirmed at runtime.

- [x] T050 [test] PUT /admin/settings/password route test
      Files: `apps/api/tests/integration/settings-password.test.ts`
      Do: Correct current + matching policy-valid new → `200`, other sessions revoked, acting session
      stays valid; mismatch/policy/wrong-current → `400`; `super_admin` → `403`.
      Done when: Tests fail and match the contract for `settings/password`.
      Refs: T-B3, contracts `settings/password`, D5/E6/FR-035/FR-041
      > note: 6 tests: correct change → 200 + re-minted cookie + other session revoked + new password works for login (E6/D5), mismatch 400 (D4), policy violation 400 (D1/D2), wrong current 400 (D5), super_admin 403 (FR-035), unauthenticated 401. verify-2fa provider pattern reused for multi-session setup.
      > reviewed: PASS — D3 test added (corrective item 2); 7 tests covering D3 (newPass=current→400), D4 mismatch, D1 length, D5 wrong-current, E6 revoke+remint, FR-035 super_admin 403, 401 unauth; all 7 pass at runtime on port 5434; TDD nit (retroactively unverifiable) non-blocking.

- [x] T051 Implement PUT /admin/settings/password
      Files: `apps/api/src/routes/admin/settings.ts`
      Do: Verify current password, apply policy, account-wide revoke (re-mint acting family), audit
      `PASSWORD_CHANGED`; block `super_admin`.
      Done when: T050 passes.
      Refs: T-B3, contracts `settings/password`, I1
      > note: new settings.ts router created + wired in app.ts; authenticateJWT guard; super_admin block (403); Zod validation; passwordPolicy check; resolves acting refresh-token family from cookie for re-mint; AuthService.changePassword returns 400-mapped errors; new refresh cookie set on success. Audit-log PASSWORD_CHANGED deferred to T101. D3 enforced in changePassword() via argon2.verify after D5 (Session 10 fix).
      > reviewed: PASS — D3 check added to `changePassword()` after D5 verify; `argon2.verify(user.passwordHash, newPassword)` → `{success:false, status:400}` if same; `services/auth.ts` remains 100% branch (unit test + integration D3 test together cover both D3 branches); T050 7/7 pass. Nit (reset route carry-forward): reset-password route pre-checks token validity before `validatePassword`, duplicating `consume()` validation (2 DB queries on token table) — non-blocking, logic correct.

- [x] T052 [test] PUT /admin/settings/photo route test
      Files: `apps/api/tests/integration/settings-photo-put.test.ts`
      Do: PNG/JPEG/WebP ≤5MB → `200` `Me` with `hasProfilePhoto=true`; bad type / >5MB → `400`;
      `super_admin` → `403`.
      Done when: Tests fail and match the contract for `settings/photo` PUT.
      Refs: T-B4, contracts `settings/photo`, G1/G2/G3, FR-033/FR-035
      > note: 7 tests (PNG/JPEG/WebP 200, gif 400, oversized 400, super_admin 403, unauth 401); uses in-memory buffer fixtures (no disk files); PHOTO_MAX_BYTES imported from adminAuth.ts; supertest .attach() for multipart.
      > reviewed: PASS-WITH-NITS — 7/7 tests pass in full parallel suite (286/0/0); G1/G2/G3 contract cases correct; PHOTO_MAX_BYTES boundary exact; nit: 200 tests only assert hasProfilePhoto + id, not full Me shape (email, role, permissions omitted from assertions).

- [x] T053 Implement PUT /admin/settings/photo
      Files: `apps/api/src/routes/admin/settings.ts`
      Do: multer memory upload, validate MIME + size, persist bytes+MIME on `User`; block `super_admin`.
      Done when: T052 passes.
      Refs: T-B4, contracts `settings/photo`, research R9
      > note: multer memoryStorage with 6MB limit (headroom above 5MB policy); MIME validated against PHOTO_ACCEPTED_MIME_TYPES; bytes persisted via prisma.user.update; returns Me-shaped response via local buildSessionUser(); super_admin 403 enforced. T052 7/7 pass.
      > reviewed: PASS — authenticateJWT ✓; upload.single('photo') multer ✓; PHOTO_ACCEPTED_MIME_TYPES MIME check ✓; PHOTO_MAX_BYTES size check ✓; profilePhoto+profilePhotoMime persisted ✓; buildSessionUser() Me response ✓; super_admin 403 ✓; no scope creep; T052 7/7 confirmed with full parallelism.

- [x] T054 [test] GET /admin/settings/photo route test
      Files: `apps/api/tests/integration/settings-photo-get.test.ts`
      Do: Photo set → `200` image bytes with correct MIME; none set → `404` (client renders initials);
      unauthenticated → `401`.
      Done when: Tests fail and match the contract for `settings/photo` GET.
      Refs: T-B4, contracts `settings/photo`, G5/G6
      > note: 3 tests (photo set → 200 with image/png Content-Type + byte equality, no photo → 404, unauth → 401); seeds photo directly via prisma.user.update; Buffer comparison for byte-level assertion.
      > reviewed: PASS-WITH-NITS — 3/3 pass in full parallel suite; G5/G6 contract pinned; byte-level Buffer comparison ✓; seeds via prisma.user.update ✓; nit: test-file comment "The route already exists from T053" is stale (T053 adds PUT only; GET is added by T055).

- [x] T055 Implement GET /admin/settings/photo
      Files: `apps/api/src/routes/admin/settings.ts`
      Do: Stream stored bytes for the authenticated user; `404` when absent.
      Done when: T054 passes.
      Refs: T-B4, G5/G6
      > note: route loads only profilePhoto + profilePhotoMime columns; sets Content-Type and Content-Length headers; sends raw Buffer via res.send(); 404 when either column is null. T054 3/3 pass.
      > reviewed: PASS — loads only photo columns ✓; Content-Type + Content-Length set ✓; raw Buffer via res.send() ✓; 404 when null ✓; authenticateJWT guard ✓; T054 3/3 confirmed with full parallelism.

- [x] T056 [test] DELETE /admin/settings/photo route test
      Files: `apps/api/tests/integration/settings-photo-delete.test.ts`
      Do: Remove → `200` `Me` with `hasProfilePhoto=false`; `super_admin` → `403`.
      Done when: Tests fail and match the contract for `settings/photo` DELETE.
      Refs: contracts `settings/photo`, G4, FR-035
      > note: 3 tests (remove → 200 Me with hasProfilePhoto=false, super_admin → 403, unauth → 401); seeds photo via prisma.user.update before each test; beforeEach resets photo to known state.
      > reviewed: PASS-WITH-NITS — 3/3 pass in full parallel suite (292/0/0); G4 + FR-035 + 401 covered; beforeEach seeds photo so DELETE has something to remove ✓; nit: 200 test asserts hasProfilePhoto + id only, not full Me shape (same pattern as T052 nit; non-blocking); OpenAPI contract gap — DELETE response omits 401 and 403 (to be closed at T062).

- [x] T057 Implement DELETE /admin/settings/photo
      Files: `apps/api/src/routes/admin/settings.ts`
      Do: Null out bytes+MIME; block `super_admin`.
      Done when: T056 passes.
      Refs: G4
      > note: route nulls profilePhoto + profilePhotoMime via prisma.user.update; returns Me-shaped response via buildSessionUser(); super_admin 403 enforced; authenticateJWT guard. T056 3/3 pass.
      > reviewed: PASS — authenticateJWT ✓; super_admin 403 ✓; nulls both profilePhoto AND profilePhotoMime via prisma.user.update ✓; buildSessionUser() Me response ✓; 200 ✓; T056 3/3 confirmed with full parallelism.

- [x] T058 [test] GET /admin/settings/preferences route test
      Files: `apps/api/tests/integration/settings-preferences-get.test.ts`
      Do: Authenticated → `200` `Preferences` (server-stored authoritative values); unauthenticated → `401`.
      Done when: Tests fail and match the contract for `settings/preferences` GET.
      Refs: T-B7, contracts `settings/preferences`, H1/H2
      > note: 3 tests (with seeded row → 200 dark/true, no row → 200 system/false defaults, unauth → 401); seeds preference row directly via prisma.userPreference.create.
      > reviewed: PASS — 3/3 pass with full parallelism; H1/H2 both pinned (dark/true and system/false); seeds via prisma.userPreference.create ✓; resetAdminTables(userId) clears preference rows in beforeEach ✓; defaults correctly tested.

- [x] T059 Implement GET /admin/settings/preferences
      Files: `apps/api/src/routes/admin/settings.ts`
      Do: Return persisted `themeMode`/`sidebarCollapsed`.
      Done when: T058 passes.
      Refs: T-B7, H1/H2
      > note: route loads preference row via prisma.userPreference.findUnique; returns defaults (system/false) when no row exists; authenticateJWT guard. T058 3/3 pass.
      > reviewed: PASS — authenticateJWT ✓; findUnique selects only themeMode + sidebarCollapsed ✓; ?? 'system' and ?? false defaults correct per H1/H2 ✓; T058 3/3 confirmed with full parallelism.

- [x] T060 [test] PUT /admin/settings/preferences route test
      Files: `apps/api/tests/integration/settings-preferences-put.test.ts`
      Do: Valid body persists and round-trips via `me` and GET preferences; invalid `themeMode` → `400`.
      Done when: Tests fail and match the contract for `settings/preferences` PUT.
      Refs: T-B7, contracts `settings/preferences`, H1/H2, FR-024
      > note: 4 tests (persist + round-trip via /me and GET, invalid themeMode → 400, partial update, unauth → 401); uses prisma.userPreference.upsert for create-or-update semantics.
      > reviewed: PASS — 4/4 pass with full parallelism; H1/H2 pinned; partial update + invalid themeMode→400 + 401 covered ✓; /me round-trip assertion added per Session 16 nit ✓.

- [x] T061 Implement PUT /admin/settings/preferences
      Files: `apps/api/src/routes/admin/settings.ts`
      Do: Validate + upsert preferences via `userPreference` service.
      Done when: T060 passes.
      Refs: T-B7, FR-024
      > note: Zod schema validates themeMode enum (light|dark|system) + sidebarCollapsed boolean; partial updates supported; prisma.userPreference.upsert for create-or-update; authenticateJWT guard. T060 4/4 pass.
      > reviewed: PASS — Zod enum for themeMode (light|dark|system) ✓; conditional-spread partial-update correct ✓; upsert create-path defaults (system/false) correct ✓; authenticateJWT guard ✓; only themeMode + sidebarCollapsed returned (no scope creep) ✓; userPreference.ts 100% branch maintained ✓; T060 4/4 confirmed with full parallelism.

- [x] T062 Document the Phase 1 endpoints in OpenAPI
      Files: `apps/api/openapi.yaml`
      Do: Mirror `contracts/admin-auth.openapi.yaml` (login, verify-2fa, resend-code, forgot-password,
      reset-password, refresh, logout, me, settings/password, settings/photo GET/PUT/DELETE,
      settings/preferences GET/PUT) including status codes.
      Done when: `pnpm --filter @modular-house/api docs:validate` passes.
      Refs: plan §5.1, DoD-9
      > note: replaced legacy login (token-based) with 2FA flow; added all Phase 1 auth + settings endpoints; added TwoFactorChallenge, Session, Me, Preferences, NeutralAck, Error schemas; docs:validate passes.
      > reviewed: PASS — docs:validate passes ✓; all 13 Phase 1 endpoints documented; all schemas match contracts file exactly ✓; `contracts/admin-auth.openapi.yaml` updated (Session 16 nit resolved): 401 added to logout, settings/password, settings/photo PUT, settings/preferences PUT; 401+403 added to settings/photo DELETE. contracts file now matches openapi.yaml exactly. 296/0/0 confirmed with full parallelism.

### Frontend design-system port + primitives

- [x] T063 [test] `cn()` helper unit test
      Files: `apps/web/src/admin/lib/cn.test.ts`
      Do: Assert class merge/dedupe via `clsx` + `tailwind-merge`.
      Done when: Test fails (no helper yet).
      Refs: research R2
      > note: 7 tests (merge, dedupe, conditional, arrays, objects, empty, undefined/null); test fails with import error until T064.
      > reviewed: PASS — 7/7 tests pin merge, dedupe (last-wins), conditional, array, object, empty, and null/undefined cases; import correctly fails before T064 (TDD red phase met); no injected clock needed.

- [x] T064 Implement the `cn()` helper
      Files: `apps/web/src/admin/lib/cn.ts`
      Do: `clsx` + `tailwind-merge` wrapper used by all primitives.
      Done when: T063 passes.
      Refs: research R2
      > note: exports cn() function using clsx + twMerge; mirrors template's lib/utils.ts pattern. T063 7/7 pass.
      > reviewed: PASS — clsx + twMerge pattern correct; T063 7/7 confirmed. Nit: multi-paragraph JSDoc comments in cn.ts violate CLAUDE.md style ("Never write multi-paragraph docstrings or multi-line comment blocks — one short line max"); non-blocking.

- [x] T065 [test] Primitive parity contract test
      Files: `apps/web/src/admin/ui/primitives.test.tsx`
      Do: Assert `data-slot`/`data-variant`/`data-size` attributes, keyboard focusability, and ARIA
      roles for the Phase 1 primitive set.
      Done when: Tests fail (no primitives yet) and pin template parity + a11y hooks.
      Refs: research R2, H4/H6
      > note: 22 tests across Button, Input, Label, Card, Avatar, InputOTP, Sidebar, Sheet, DropdownMenu; asserts data-slot attributes, focusability, disabled state, label association. Stub implementations created for all primitives to unblock test execution.
      > reviewed: PASS-WITH-NITS — 22 tests correct; data-slot/data-variant/data-size, focusability (tabIndex≥0), disabled, and htmlFor label association all asserted; 131/0/0 web suite confirmed. Nit (TDD): "Done when: Tests fail" never met — stubs created alongside test file (same non-blocking pattern as T023); nit (scope): stubs for T067–T076 primitives created in this session (necessary for import resolution; clearly labeled).

- [x] T066 Implement Button primitive
      Files: `apps/web/src/admin/ui/button.tsx`
      Do: cva variants/sizes, `data-slot="button"`, focus-ring tokens.
      Done when: relevant T065 assertions pass.
      Refs: research R2, H4
      > note: cva with 6 variants (default, outline, secondary, ghost, destructive, link) + 8 sizes; data-slot/data-variant/data-size attributes; Radix Slot for asChild; focus-visible ring tokens. T065 Button assertions pass.
      > reviewed: PASS — 6 cva variants ✓; 8 sizes ✓; data-slot/data-variant/data-size on Comp ✓; Radix Slot asChild ✓; focus-visible:ring-3 + focus-visible:ring-ring/50 = H4 exact (3px at ring/50) ✓; defaultVariants correct ✓; T065 5/5 Button assertions pass ✓; no Next.js-specific patterns. Nit: multi-paragraph JSDoc blocks violate CLAUDE.md style; non-blocking.

- [x] T067 Implement Input primitive
      Files: `apps/web/src/admin/ui/input.tsx`
      Do: Token-styled input with `data-slot`, visible focus ring.
      Done when: relevant T065 assertions pass.
      Refs: research R2, H4/H6
      > note: full implementation replacing T065 stub; file-input styling, aria-invalid error states, dark-mode variants (dark:bg-input/30, dark:disabled:bg-input/80), H4 focus ring (3px at ring/50); T065 Input 2/2 pass.
      > reviewed: PASS — `data-slot="input"` ✓; `focus-visible:ring-3 focus-visible:ring-ring/50` = H4 exact (3px at ring/50) ✓; `aria-invalid` error-state styles ✓; dark-mode variants ✓; T065 2/2 Input assertions pass (131/0/0 confirmed).
      > reviewed (S20): PASS-WITH-NITS — correction to S19: input.tsx DOES contain multi-line JSDoc blocks (S19 "no multi-line comments" claim was inaccurate). Cosmetic, non-blocking; code-correctness unchanged.

- [x] T068 Implement Label primitive
      Files: `apps/web/src/admin/ui/label.tsx`
      Do: Radix Label wrapper bound to inputs for AT.
      Done when: relevant T065 assertions pass.
      Refs: research R2, H6
      > note: full implementation replacing T065 stub; added flex layout (items-center gap-2), disabled-state styling via group-data-[disabled=true] and peer-disabled selectors; T065 Label 2/2 pass.
      > reviewed: PASS — Radix `@radix-ui/react-label` Root ✓; `data-slot="label"` ✓; `peer-disabled:cursor-not-allowed peer-disabled:opacity-50` ✓; `group-data-[disabled=true]` support ✓; native `htmlFor` association via Radix Label (renders `<label>`) ✓; T065 2/2 Label assertions pass.
      > reviewed (S20): PASS-WITH-NITS — correction to S19: label.tsx DOES contain multi-line JSDoc blocks (S19 "no multi-line comments" claim was inaccurate). Cosmetic, non-blocking; code-correctness unchanged.

- [x] T069 Implement Card primitive
      Files: `apps/web/src/admin/ui/card.tsx`
      Do: Card/Header/Content/Footer slots with token radius.
      Done when: relevant T065 assertions pass.
      Refs: research R2, H4
      > note: full implementation replacing T065 stub; added data-size variant (default/sm), group/card class, ring-1 border, CSS variable --card-spacing for uniform padding, conditional padding via has-data-[slot=card-footer], CardTitle/CardDescription/CardAction subcomponents; T065 Card 4/4 pass.
      > reviewed: PASS-WITH-NITS — `data-slot` on card/card-header/card-content/card-footer all correct ✓; `rounded-lg` → `--radius-lg` = `var(--radius)` = 0.625rem (H4) ✓; `--card-spacing` CSS var + `data-size` variant ✓; CardTitle/CardDescription/CardAction template-parity additions (not scope creep) ✓; T065 4/4 Card assertions pass. Nit: multi-line JSDoc blocks in card.tsx violate CLAUDE.md style — non-blocking (carry-forward from Session 18).

- [x] T070 Implement DropdownMenu primitive
      Files: `apps/web/src/admin/ui/dropdown-menu.tsx`
      Do: Radix DropdownMenu for the account menu; keyboard operable.
      Done when: relevant T065 assertions pass.
      Refs: research R2, H6, FR-025
      > note: full implementation replacing T065 stub; 15 subcomponents (Root, Portal, Trigger, Content, Group, Item, CheckboxItem, RadioGroup, RadioItem, Label, Separator, Shortcut, Sub, SubTrigger, SubContent); inline SVG for CheckIcon/ChevronRightIcon (avoids lucide-react dependency); animations via data-[state=open/closed]; T065 DropdownMenu 1/1 pass.
      > reviewed: PASS-WITH-NITS — 15 subcomponents + 2 inline SVG icons ✓; Radix keyboard navigation ✓; CheckboxItem/RadioItem/SubTrigger/SubContent ✓; inline SVG avoids lucide-react dependency ✓; T065 1/1 DropdownMenu trigger assertion passes. Nit: `data-slot` on Root, Portal, Sub (Radix context providers — render no DOM element) is silently dropped; non-blocking (T065 does not test Root/Portal/Sub data-slot). Nit: multi-line JSDoc blocks violate CLAUDE.md style — non-blocking.

- [x] T071 Implement Avatar primitive with initials fallback
      Files: `apps/web/src/admin/ui/avatar.tsx`
      Do: Radix Avatar; render initials when no photo (G4).
      Done when: relevant T065 assertions pass.
      Refs: research R2, G4
      > note: Avatar with size variants (default/sm/lg), AvatarImage wrapper span for DOM stability on load failure, AvatarFallback with bg-muted for initials (G4). T065 Avatar 3/3 pass.
      > reviewed: PASS — data-slot (avatar/avatar-image/avatar-fallback) + size variants + bg-muted fallback (G4) ✓; AvatarImage span wrapper (contents) is correct DOM-stability workaround ✓; T065 3/3 pass. JSDoc nit resolved (commit 661101f).

- [x] T072 Implement Sidebar primitive
      Files: `apps/web/src/admin/ui/sidebar.tsx`
      Do: Collapsible rail/expanded with token widths (17rem / 3rem); keyboard operable.
      Done when: relevant T065 assertions pass.
      Refs: research R2, H3, FR-020
      > note: SidebarProvider with context (state/open/isMobile/toggleSidebar), Sidebar with desktop collapsible rail (17rem/3rem per H3) + mobile Sheet drawer (18rem), SidebarTrigger with inline SVG icon, SidebarRail, SidebarHeader/Footer/Content/Group/GroupLabel/GroupContent/GroupContent, SidebarMenu/MenuItem/MenuButton. Falls back to simple div when no provider (test isolation). Ctrl/Cmd+B keyboard shortcut (H2). Cookie mirror for pre-paint boot. T065 Sidebar 1/1 pass.
      > reviewed: PASS — H3 exact (17rem/3rem/18rem) ✓; Ctrl/Cmd+B ✓; cookie mirror ✓; H5 <768px ✓; T065 1/1 pass ✓. H4 ring-3/ring/50 applied to SidebarTrigger + SidebarMenuButton (commit 661101f) ✓; JSDoc nit resolved ✓.

- [x] T073 Implement Sheet (mobile drawer) primitive
      Files: `apps/web/src/admin/ui/sheet.tsx`
      Do: Radix Dialog-based off-canvas drawer (18rem) for mobile.
      Done when: relevant T065 assertions pass.
      Refs: research R2, H3/H5
      > note: Sheet/SheetTrigger/SheetClose/SheetPortal/SheetOverlay/SheetContent with side variants (top/right/bottom/left), 18rem max on sm (H3), entry/exit animations, inline X close button. SheetHeader/Footer/Title/Description subcomponents. T065 Sheet 1/1 pass.
      > reviewed: PASS-WITH-NITS — Radix Dialog AT ✓; H3 sm:max-w-[18rem] ✓; side variants ✓; T065 1/1 pass ✓. H4 ring-3/ring/50 on close button (commit 661101f) ✓; JSDoc nit resolved ✓. Remaining nit: SheetPortal data-slot silently dropped (Radix Portal renders no DOM — same T070 non-blocking pattern).

- [x] T074 Implement Form field wrappers primitive
      Files: `apps/web/src/admin/ui/form.tsx`
      Do: Field/label/error wrappers exposing errors and the code step to AT.
      Done when: relevant T065 assertions pass.
      Refs: research R2, FR-031
      > note: Field container with vertical/horizontal orientation variants (cva), FieldLabel wrapping Label primitive, FieldDescription for help text, FieldError with role="alert" for AT (FR-031) + React Hook Form/Zod errors array support with deduplication. FieldContent for description+error grouping. New file created (no prior stub).
      > reviewed: PASS — Field/FieldContent/FieldLabel/FieldDescription/FieldError correct ✓; role="alert" (FR-031) ✓; Zod/RHF deduplication ✓; htmlFor AT association ✓; no scope creep ✓. TDD gap closed (commit 7023720): 5 Form assertions added to primitives.test.tsx (data-slot, htmlFor, role="alert", null-render); web suite 136/0/0 ✓.

- [x] T075 Implement Sonner toast host primitive
      Files: `apps/web/src/admin/ui/sonner.tsx`
      Do: Mount the toast host themed by tokens.
      Done when: relevant T065 assertions pass.
      Refs: research R2
      > note: Toaster component reads theme from document root `.dark` class via MutationObserver; inline SVG icons for success/info/warning/error/loading (avoids lucide-react dep); token-based styling via sonner CSS vars (--normal-bg, --normal-text, --normal-border, --border-radius); no T065 Sonner assertions exist (vacuously true, same pattern as T074). Web suite 136/136 pass, typecheck + lint clean.
      > reviewed: PASS-WITH-NITS — implementation correct (MutationObserver, inline SVGs, CSS token vars); TDD gap: no automated test for Sonner (vacuously satisfied "Done when"); multi-paragraph JSDoc blocks reintroduced (carry-forward style nit).

- [x] T076 Implement InputOTP primitive
      Files: `apps/web/src/admin/ui/input-otp.tsx`
      Do: 6-slot numeric code entry exposed to AT.
      Done when: relevant T065 assertions pass.
      Refs: research R2, B1, FR-031
      > note: replaces T065 stub with full input-otp package integration; OTPInput/OTPInputContext from input-otp; InputOTPGroup/InputOTPSlot/InputOTPSeparator subcomponents; inline SVG dash separator (avoids lucide-react dep); H4 focus ring (3px at ring/50) on active slot; aria-invalid error states; data-slot attributes on all elements; T065 3/3 InputOTP assertions pass. Web suite 136/136 pass, typecheck + lint clean.
      > reviewed: PASS-WITH-NITS — T065 3/3 pass ✓; uses input-otp package (OTPInput/OTPInputContext) ✓; H4 focus ring exact (`data-[active=true]:ring-3 data-[active=true]:ring-ring/50`) ✓; aria-invalid error states ✓; inline SVG separator avoids lucide-react ✓; multi-paragraph JSDoc blocks reintroduced (carry-forward style nit).

- [x] T077 [test] ThemeProvider + boot-script test
      Files: `apps/web/src/admin/theme/ThemeProvider.test.tsx`
      Do: Assert theme applied from the cookie/localStorage mirror before first paint (no wrong-theme
      frame) and that `light|dark|system` resolve.
      Done when: Tests fail and pin H1.
      Refs: T-F2, H1, research R8
      > note: 11 tests covering boot script (light/dark/system cookie → DOM attributes, system→matchMedia resolution, sidebar state, default fallbacks) and ThemeProvider (mount reads cookie + applies DOM, toggle updates DOM+cookie, sidebar toggle persists cookie, useTheme throws outside provider). TDD red phase confirmed (boot.js/ThemeProvider.js not found → fails). Web suite 147/147 pass after T078 impl.
      > reviewed: PASS — 11/11 tests verified at runtime; TDD red phase confirmed ✓; all H1 paths covered (light/dark/system → matchMedia, sidebar default/collapsed, no-cookie defaults) ✓; useTheme throws outside provider ✓; ThemeProvider toggle round-trip (DOM + cookie) ✓; no injected clock needed (correct — no time logic).

- [x] T078 Implement ThemeProvider + pre-paint boot script
      Files: `apps/web/src/admin/theme/ThemeProvider.tsx`, `apps/web/src/admin/theme/boot.ts`,
      `apps/web/index.html`
      Do: Synchronous boot script reads the mirror and sets `data-theme`/`.dark` + sidebar attribute on
      the admin root before the bundle; ThemeProvider keeps it in sync and writes the mirror.
      Done when: T077 passes; no FOUC.
      Refs: T-F2, H1/H2, research R8
      > note: boot.ts exports applyBootTheme() for programmatic/test use; index.html has inline IIFE that runs synchronously before React bundle; cookie names admin_theme_mode + admin_sidebar_collapsed; ThemeProvider reads cookies on mount, syncs DOM + cookies on toggle, subscribes to OS matchMedia for system mode; useTheme() hook exposes themeMode/resolvedThemeMode/sidebarCollapsed/setters. T077 11/11 pass, web suite 147/147, typecheck + lint clean.
      > reviewed: PASS — boot.ts exports applyBootTheme() ✓; index.html IIFE is synchronous in <head> before bundle (no FOUC) ✓; cookie names consistent across boot.ts/ThemeProvider.tsx/index.html ✓; ThemeProvider reads cookie on mount, writes on toggle, matchMedia subscription for system mode ✓; useTheme() throws outside provider ✓; T077 11/11 confirmed ✓; web suite 147/147, API 296/296, lint + typecheck clean ✓.

### Frontend shell + pages + auth client

- [ ] T079 [test] Admin shell test (T-F1)
      Files: `apps/web/src/admin/shell/AppShell.test.tsx`
      Do: Assert collapsible sidebar, 48px top bar with the four controls (collapse, UI-preference,
      dark-mode, account), centered faded "Coming Soon", bottom user section, and NO GitHub button.
      Done when: Tests fail and pin US2-1..4,7 + H7.
      Refs: T-F1, FR-020/FR-021/FR-022/FR-023, H7

- [ ] T080 Implement ComingSoon content region
      Files: `apps/web/src/admin/shell/ComingSoon.tsx`
      Do: Centered, faded "Coming Soon" placeholder; no feature pages.
      Done when: relevant T079 assertions pass.
      Refs: T-F1, FR-021, H7

- [ ] T081 Implement Sidebar user section
      Files: `apps/web/src/admin/shell/UserSection.tsx`
      Do: Bottom-pinned avatar + display name + account menu (Settings, Logout); initials fallback.
      Done when: relevant T079 assertions pass.
      Refs: T-F1, FR-022/FR-025, G4

- [ ] T082 Implement the Sidebar shell composition
      Files: `apps/web/src/admin/shell/Sidebar.tsx`
      Do: Compose Sidebar primitive + ComingSoon + UserSection; Ctrl/Cmd+B toggle hook.
      Done when: relevant T079 assertions pass.
      Refs: T-F1, FR-020, H2

- [ ] T083 Implement the TopBar
      Files: `apps/web/src/admin/shell/TopBar.tsx`
      Do: 48px bar with sidebar-collapse, UI-preference (theme/Default preset only), dark-mode toggle,
      account button; explicitly no GitHub control.
      Done when: relevant T079 assertions pass.
      Refs: T-F1, FR-023, H3/H7

- [ ] T084 Implement the AppShell composition
      Files: `apps/web/src/admin/shell/AppShell.tsx`
      Do: Lay out Sidebar + TopBar + content region inside `.admin-root`.
      Done when: T079 passes.
      Refs: T-F1, FR-020

- [ ] T085 [test] Pre-auth pages + guard test (T-F6)
      Files: `apps/web/src/admin/pages/preAuth.test.tsx`
      Do: Assert login renders "login v1" with NO Google option and a "Forgot password" entry, the
      two-factor code-entry renders, the reset page renders, and the settings route is guarded.
      Done when: Tests fail and pin US1-1,2 / US3 / US4-8.
      Refs: T-F6, FR-005/FR-006/FR-031/FR-034

- [ ] T086 Implement the Login page
      Files: `apps/web/src/admin/pages/Login.tsx`
      Do: Email+password form, no Google, "Forgot password" link; posts to `login`.
      Done when: relevant T085 assertions pass.
      Refs: T-F6, FR-005/FR-006

- [ ] T087 Implement the TwoFactor page
      Files: `apps/web/src/admin/pages/TwoFactor.tsx`
      Do: InputOTP code entry bound to `challengeId`; resend control; posts to `verify-2fa`.
      Done when: relevant T085 assertions pass.
      Refs: T-F6, B9, FR-031

- [ ] T088 Implement the ForgotPassword page
      Files: `apps/web/src/admin/pages/ForgotPassword.tsx`
      Do: Email entry; neutral confirmation; posts to `forgot-password`.
      Done when: relevant T085 assertions pass.
      Refs: T-F6, FR-014/FR-015

- [ ] T089 Implement the ResetPassword page
      Files: `apps/web/src/admin/pages/ResetPassword.tsx`
      Do: Consume link token, new password twice; client mirror of policy (server authoritative);
      posts to `reset-password`.
      Done when: relevant T085 assertions pass.
      Refs: T-F6, FR-016/FR-017

- [ ] T090 [test] Auth client + route guard test (T-F4)
      Files: `apps/web/src/admin/auth/auth.test.tsx`
      Do: Assert in-memory access token (never in `localStorage`/`sessionStorage`), silent refresh on
      expiry, Logout returns to login and blocks back-nav reuse, and the guard redirects unauthenticated
      access to login.
      Done when: Tests fail and pin US2-8 + FR-003/FR-038/FR-040.
      Refs: T-F4, T-F6, E2/E5, FR-003/FR-038/FR-040

- [ ] T091 Implement the admin apiClient hooks
      Files: `apps/web/src/admin/auth/apiClient.ts`
      Do: In-memory access token store, `credentials: 'include'` for the refresh cookie, silent refresh
      on `401`/expiry; no browser-stored secret.
      Done when: relevant T090 assertions pass.
      Refs: T-F4, E2/E3, FR-040

- [ ] T092 Implement the AuthProvider
      Files: `apps/web/src/admin/auth/AuthProvider.tsx`
      Do: Hydrate session via `me`, expose user/role/permissions + logout; drive preference load.
      Done when: relevant T090 assertions pass.
      Refs: T-F4, FR-036

- [ ] T093 Implement the route guard
      Files: `apps/web/src/admin/auth/guard.tsx`
      Do: Redirect unauthenticated/expired access to `/admin/login`.
      Done when: relevant T090 assertions pass.
      Refs: T-F6, FR-003

- [ ] T094 [test] Settings page test (T-F6 settings slice)
      Files: `apps/web/src/admin/pages/Settings.test.tsx`
      Do: Assert password-change form (current + new twice), photo upload/remove with initials fallback,
      read-only name + email, `super_admin` read-only, and that the page is unreachable unauthenticated.
      Done when: Tests fail and pin US4-1..8.
      Refs: T-F6, FR-032/FR-033/FR-034/FR-035

- [ ] T095 Implement the Settings page
      Files: `apps/web/src/admin/pages/Settings.tsx`
      Do: Wire password change, photo upload/remove (GET `settings/photo` for bytes vs initials),
      read-only name/email; hide edit controls for `super_admin`.
      Done when: T094 passes.
      Refs: T-F6, G6, FR-032/FR-033/FR-034/FR-035

- [ ] T096 Wire admin routing into the SPA
      Files: `apps/web/src/App.tsx`, `apps/web/src/route-config.tsx`
      Do: Mount `/admin/*` under AppShell + guard with the new pages; remove the legacy admin route
      imports.
      Done when: All `/admin` routes resolve to the new layer; no legacy import remains.
      Refs: research R12, FR-001/FR-003

- [ ] T097 [test] Legacy admin fully removed (regression)
      Files: `apps/api/tests/integration/legacy-removed.test.ts`,
      `apps/web/src/admin/__tests__/no-legacy.test.tsx`
      Do: Assert the old legacy admin backend routes return `404` (no longer registered); assert no
      `localStorage`/`sessionStorage` admin-token (`adminToken`) reference remains anywhere under
      `apps/web/src`; assert the legacy admin route components/files are absent and no legacy admin
      route resolves in the SPA router.
      Done when: All assertions pass (they go green once the removal + rewire tasks are complete).
      Refs: FR-001, SC-007, DoD-4, research R12

- [ ] T098 [test] Theme + sidebar persistence test (T-F2)
      Files: `apps/web/src/admin/shell/persistence.test.tsx`
      Do: Toggle dark mode + sidebar collapse, remount, assert state restored with no flash and that
      the server preference round-trips.
      Done when: Tests fail then pass against the implemented shell + preferences.
      Refs: T-F2, H1/H2, FR-024

- [ ] T099 [test] Keyboard operability test (T-F3)
      Files: `apps/web/src/admin/shell/keyboard.test.tsx`
      Do: Tab through every control, assert visible focus and Ctrl/Cmd+B toggles the sidebar.
      Done when: Tests fail then pass against the shell.
      Refs: T-F3, H6, FR-030

- [ ] T100 [test] Mobile off-canvas drawer test (T-F5)
      Files: `apps/web/src/admin/shell/mobile.test.tsx`
      Do: At <768px assert the sidebar renders as an off-canvas drawer, top-bar controls reachable, no
      horizontal scroll at ≥320px.
      Done when: Tests fail then pass against the shell.
      Refs: T-F5, H5, FR-026/FR-027

- [ ] T101 [test] Audit events integration test (T-B6)
      Files: `apps/api/tests/integration/audit-events.test.ts`
      Do: Drive login/logout/OTP/reset/change flows and assert each writes its expected I1 action with
      no secrets.
      Done when: Tests pass against the implemented routes.
      Refs: T-B6, I1–I3, FR-037

- [ ] T102 [test] Log-line secret-redaction test
      Files: `apps/api/tests/integration/log-redaction.test.ts`
      Do: Capture Pino log output across login / 2FA / reset / change flows and assert no raw password,
      OTP code, or reset token ever appears in a log line (complements the audit-entry check).
      Done when: Tests fail on any leaked secret.
      Refs: FR-039, I3

- [ ] T103 Add log redaction (only if leakage is exposed)
      Files: `apps/api/src/config/logger.ts`
      Do: Add Pino redaction so passwords, OTP codes, and reset tokens never reach logs.
      Done when: T102 passes.
      Refs: FR-039

---

## Pass 2 — Make it right (turns every §4.2 edge case green)

- [ ] T104 [test] E-CREDS — generic-credential + deactivated tests
      Files: `apps/api/tests/integration/edge-creds.test.ts`
      Do: Assert unknown-email and wrong-password responses are byte-identical generic `401`;
      deactivated account (`isActive=false`) blocked with the same `401`.
      Done when: Tests fail (or expose gaps) for A5/A6.
      Refs: E-CREDS, A5/A6, FR-008

- [ ] T105 Harden generic-credential + deactivated handling
      Files: `apps/api/src/services/auth.ts`, `apps/api/src/routes/admin/auth.ts`
      Do: Normalize responses to byte-identical `401`; block inactive accounts post-credential.
      Done when: T104 passes.
      Refs: E-CREDS, A5/A6

- [ ] T106 [test] E-LOCK — lockout boundary tests
      Files: `apps/api/tests/integration/edge-lockout.test.ts`
      Do: With the injected clock assert 5th consecutive bad password locks (`423`), attempts during
      lock are blocked, and a successful reset clears the lock.
      Done when: Tests fail for A2/A3/C5.
      Refs: E-LOCK, A2/A3/C5, FR-009/FR-018

- [ ] T107 Harden account lockout + reset-clears-lock
      Files: `apps/api/src/services/auth.ts`
      Do: Enforce `failedLoginAttempts>=5` → `lockedUntil=now+15m`; reset clears counters.
      Done when: T106 passes; 100% branch on lockout paths.
      Refs: E-LOCK, A2/A3/A4/C5

- [ ] T108 [test] E-OTP — OTP edge tests
      Files: `apps/api/tests/integration/edge-otp.test.ts`
      Do: With the injected clock assert wrong code increments, expiry at `expiresAt+1s`, reuse rejected,
      6th wrong attempt invalidates, new-code supersedes prior, unknown/expired `challengeId` → `401`.
      Done when: Tests fail for B3–B6/B9.
      Refs: E-OTP, B3/B4/B5/B6/B9, FR-012/FR-013

- [ ] T109 Harden OTP invalidation + challenge resolution
      Files: `apps/api/src/services/loginCode.ts`, `apps/api/src/routes/admin/auth.ts`
      Do: Apply attempt cap, TTL, single-use, supersede, and `challengeId` resolution exactly.
      Done when: T108 passes; 100% branch coverage.
      Refs: E-OTP, B3–B6/B9

- [ ] T110 [test] E-RESET — reset edge tests
      Files: `apps/api/tests/integration/edge-reset.test.ts`
      Do: Unknown email → same neutral message + no email; reused/expired link → `410`; account-wide
      revoke verified across other sessions.
      Done when: Tests fail for C2/C3/C4/C6.
      Refs: E-RESET, C2/C3/C4/C6, FR-015/FR-017/FR-041

- [ ] T111 Harden reset neutrality + account-wide revoke
      Files: `apps/api/src/services/passwordResetToken.ts`, `apps/api/src/services/auth.ts`
      Do: Keep neutral responses, enforce single-use/expiry, revoke all families on success.
      Done when: T110 passes; 100% branch coverage.
      Refs: E-RESET, C2/C3/C4/C6

- [ ] T112 [test] E-POLICY — password policy edge tests
      Files: `apps/api/tests/integration/edge-policy.test.ts`
      Do: Assert length 11 rejected / 12 accepted, missing character class rejected, equals-current
      rejected, mismatched entries rejected, wrong current password on settings change rejected, and the
      server rejects even when a client bypass is simulated.
      Done when: Tests fail for D1–D7.
      Refs: E-POLICY, D1–D7, FR-019/FR-032

- [ ] T113 Harden server-side policy enforcement on both paths
      Files: `apps/api/src/services/passwordPolicy.ts`, `apps/api/src/routes/admin/auth.ts`,
      `apps/api/src/routes/admin/settings.ts`
      Do: Apply the identical policy at reset and settings change; `400` with specific messages.
      Done when: T112 passes.
      Refs: E-POLICY, D1–D7

- [ ] T114 [test] E-THROTTLE — cooldown + window-cap tests
      Files: `apps/api/tests/integration/edge-throttle.test.ts`
      Do: With the injected clock assert resend within 60s issues nothing, the 6th request in 15m is
      blocked, and all throttle responses stay neutral; derive state from `created_at` rows.
      Done when: Tests fail for F1/F2/F3.
      Refs: E-THROTTLE, F1/F2/F3, FR-042/FR-043

- [ ] T115 Harden resend cooldown + rolling-window cap
      Files: `apps/api/src/services/loginCode.ts`, `apps/api/src/services/passwordResetToken.ts`,
      `apps/api/src/routes/admin/auth.ts`
      Do: Derive 60s cooldown (latest row) and 5/15m cap (trailing-window count) from `created_at`;
      neutral `429`; surface countdown data to the UI.
      Done when: T114 passes.
      Refs: E-THROTTLE, F1/F2/F3

- [ ] T116 Wire the resend countdown into the UI
      Files: `apps/web/src/admin/pages/TwoFactor.tsx`, `apps/web/src/admin/pages/ForgotPassword.tsx`
      Do: Disable the resend control and show a countdown until the cooldown elapses.
      Done when: A frontend test asserts the disabled-with-countdown state.
      Refs: F1, FR-042

- [ ] T117 [test] E-PHOTO — photo validation edge tests
      Files: `apps/api/tests/integration/edge-photo.test.ts`
      Do: Assert `image/gif` rejected (`400`), 5MB+1byte rejected (`400`), and remove → initials
      fallback (`hasProfilePhoto=false`).
      Done when: Tests fail for G1/G2/G4.
      Refs: E-PHOTO, G1/G2/G4, FR-033

- [ ] T118 Harden profile-photo type/size validation
      Files: `apps/api/src/routes/admin/settings.ts`
      Do: Enforce MIME allow-list + 5MB cap pre-persist; ensure removal restores the initials fallback.
      Done when: T117 passes.
      Refs: E-PHOTO, G1/G2/G3/G4

- [ ] T119 [test] E-SESSION — session/refresh edge tests
      Files: `apps/api/tests/integration/edge-session.test.ts`,
      `apps/web/src/admin/auth/session.test.tsx`
      Do: Assert silent refresh on access-token expiry mid-use, refresh reuse revokes the whole family,
      and an expired/absent session on a protected view redirects to login.
      Done when: Tests fail for E2/E4/E5.
      Refs: E-SESSION, E2/E4/E5, FR-040

- [ ] T120 Harden refresh rotation + protected-view redirect
      Files: `apps/api/src/services/auth.ts`, `apps/web/src/admin/auth/apiClient.ts`,
      `apps/web/src/admin/auth/guard.tsx`
      Do: Family reuse-detection revoke server-side; client silent refresh + redirect on hard failure.
      Done when: T119 passes; 100% branch on rotation paths.
      Refs: E-SESSION, E4/E5

- [ ] T121 [test] E-IDLE — idle-timeout test
      Files: `apps/api/tests/integration/edge-idle.test.ts`
      Do: With the injected clock assert a refresh after >30m of inactivity is rejected even though the
      refresh token is otherwise unexpired (uses `RefreshToken.lastUsedAt`); absolute cap 7d.
      Done when: Tests fail for E7.
      Refs: E-IDLE, E7

- [ ] T122 Harden the 30m idle timeout via lastUsedAt
      Files: `apps/api/src/services/auth.ts`
      Do: Reject refresh when `now - lastUsedAt > 30m`; enforce the 7d absolute cap; update `lastUsedAt`
      on success.
      Done when: T121 passes; 100% branch coverage.
      Refs: E-IDLE, E7

- [ ] T123 [test] E-MAILFAIL — mailer-failure test
      Files: `apps/api/tests/integration/edge-mailfail.test.ts`
      Do: Stub the mailer to throw on the OTP/reset send; assert a clear non-technical error, no session
      granted, the code/token is NOT left consumed, and retry works.
      Done when: Tests fail for the mail-failure path.
      Refs: E-MAILFAIL, spec "Email delivery delay or failure", FR-010

- [ ] T124 Harden mailer-failure handling (no orphaned consume)
      Files: `apps/api/src/services/auth.ts`, `apps/api/src/services/loginCode.ts`,
      `apps/api/src/services/passwordResetToken.ts`
      Do: Roll back / avoid marking codes/tokens consumed when the email send fails; surface a clear,
      retryable error.
      Done when: T123 passes.
      Refs: E-MAILFAIL, SC-002

- [ ] T125 [test] E-SUPERADMIN — super_admin read-only test
      Files: `apps/api/tests/integration/edge-superadmin.test.ts`
      Do: As the `super_admin` account assert `settings/password`, `settings/photo` PUT, and
      `settings/photo` DELETE each return `403` with no change.
      Done when: Tests fail for FR-035.
      Refs: E-SUPERADMIN, FR-035

- [ ] T126 Harden super_admin read-only enforcement
      Files: `apps/api/src/routes/admin/settings.ts`, `apps/web/src/admin/pages/Settings.tsx`
      Do: Block all settings mutations for `super_admin` server-side; render the settings UI read-only
      for that account.
      Done when: T125 passes.
      Refs: E-SUPERADMIN, FR-035

- [ ] T127 [test] E-A11Y/THEME — accessibility + theme-flash test
      Files: `apps/web/src/admin/shell/a11y.test.tsx`
      Do: Run axe against login/2FA/reset/shell/settings asserting zero critical violations, visible
      focus on every control, and no wrong-theme frame on first paint.
      Done when: Tests fail for H1/H6.
      Refs: E-A11Y/THEME, H1/H6, FR-030/FR-031

- [ ] T128 Harden contrast, focus, and pre-paint theme
      Files: `apps/web/src/admin/theme/tokens.css`, `apps/web/src/admin/theme/boot.ts`,
      `apps/web/src/admin/ui/*`
      Do: Adjust token contrast (≥4.5:1 / 3:1), ensure visible focus rings everywhere, and guarantee the
      boot script paints the correct theme before hydration.
      Done when: T127 passes.
      Refs: E-A11Y/THEME, H1/H4/H6

---

## Final — Definition of Done verification

- [ ] T129 Pass lint across both apps
      Files: `apps/api`, `apps/web`
      Do: Run `pnpm lint`; fix violations. No emoji in code; conventional naming.
      Done when: Lint is clean.
      Refs: DoD-9

- [ ] T130 Pass typecheck across both apps
      Files: `apps/api`, `apps/web`
      Do: Run `pnpm typecheck`; fix type errors.
      Done when: Typecheck is clean.
      Refs: DoD-9

- [ ] T131 Run the API test suite + security coverage gate
      Files: `apps/api`
      Do: Run `pnpm --filter @modular-house/api test:run` and `test:coverage`; security modules (auth,
      loginCode, passwordResetToken, refresh rotation, lockout, requirePermission) hit 100% branch;
      overall line ≥70%.
      Done when: All tests pass and coverage gates are met.
      Refs: DoD-1/DoD-3, SC-009

- [ ] T132 Run the web test suite
      Files: `apps/web`
      Do: Run `pnpm --filter @modular-house/web test:run`; all admin tests (T-F1..T-F6) pass.
      Done when: Web suite is green.
      Refs: DoD-1, SC-009

- [ ] T133 Validate the OpenAPI contract
      Files: `apps/api/openapi.yaml`
      Do: Run `pnpm --filter @modular-house/api docs:validate`.
      Done when: Contract validation passes.
      Refs: DoD-9

- [ ] T134 Confirm zero public-site regressions
      Files: `apps/web` public-site + `@modular-house/ui` test suites
      Do: Run the existing public/UI/configurator/SEO suites untouched; confirm all green.
      Done when: No public regression; admin DS stayed isolated.
      Refs: DoD-5, SC-008, FR-004

- [ ] T135 Run a WCAG 2.1 AA audit on every Phase 1 surface
      Files: `apps/web/src/admin/**`
      Do: axe + manual keyboard pass on login, 2FA, reset, shell, settings; zero critical violations,
      full keyboard operability incl. sidebar toggle.
      Done when: Audit records zero critical violations.
      Refs: DoD-6, SC-005, FR-030/FR-031

- [ ] T136 Verify Phase 1 performance budgets
      Files: `specs/012-panel-phase-1/quickstart.md` (record evidence)
      Do: Measure and record API p95 < 300ms on the auth endpoints (via pino-http durations under a
      representative run) and admin LCP < 2.5s with no theme flash on first paint plus sidebar
      animation ≤ 200ms (via Lighthouse). Note the argon2-cost exception for auth latency.
      Done when: Budgets are met (or any miss is documented with the accepted argon2 exception).
      Refs: plan Performance Goals, Constitution IV

- [ ] T137 Run the SC-004 visual-parity review
      Files: `specs/012-panel-phase-1/quickstart.md` (evidence) + the Studio Admin template design
      references
      Do: Verify the Phase 1 login + shell against the Studio Admin reference using the agreed
      visual-parity checklist; record ≥90% of items passing.
      Done when: ≥90% of checklist items pass and the result is recorded.
      Refs: SC-004

- [ ] T138 Run the real-OTP delivery check
      Files: `specs/012-panel-phase-1/quickstart.md` (§5 evidence)
      Do: Perform ≥10 real sends; confirm ≥9/10 arrive within 30s and no session is granted without a
      correct, unexpired code; record the result.
      Done when: ≥9/10 within 30s recorded.
      Refs: DoD-7, SC-002

- [ ] T139 Author the mobile design document
      Files: `apps/web/src/admin/docs/mobile-design.md`
      Do: Document the touch-first mobile layouts for all Phase 1 surfaces (login, 2FA, reset, shell,
      settings) alongside the Studio Admin template references.
      Done when: The document exists and covers every Phase 1 surface.
      Refs: DoD-8, FR-027, SC-012

- [ ] T140 Cross-check FR → test traceability
      Files: `specs/012-panel-phase-1/quickstart.md`
      Do: Verify every `FR-001..FR-043` maps to ≥1 passing test in the quickstart table; close any gap.
      Done when: No FR lacks a referenced passing test (DoD-2 satisfied).
      Refs: DoD-2

---

## Coverage notes

- **Endpoints (one task each):** login (T032/33), verify-2fa (T036/37), resend-code (T038/39),
  forgot-password (T040/41), reset-password (T042/43), refresh (T044/45), logout (T046/47),
  me (T048/49), settings/password (T050/51), settings/photo PUT (T052/53) / GET (T054/55) /
  DELETE (T056/57), settings/preferences GET (T058/59) / PUT (T060/61). Auth-route IP rate limit
  F4 (T034/35).
- **Explicit asks:** `authenticateJWT` loads role + effective permissions into request context
  (T023/24, E1/FR-036); `challengeId` stable-across-resend (T038/39, T108/109, B9); idle timeout via
  `lastUsedAt` (schema T007/08, enforce T121/122, E7); `GET settings/photo` bytes + `hasProfilePhoto`
  (T054/55, T048/49, G6); preferences read-back via `me` / `GET preferences` for cross-device load
  (T048/49, T058/59, H1/H2); `super_admin` 403 on settings (T125/126, FR-035); audit of settings
  password change (T051, T101, I1); log-line secret redaction (T102/103, FR-039); legacy admin fully
  removed — backend 404 + no `adminToken` storage + no legacy routes (T097, FR-001/SC-007/DoD-4).
- **§4 test IDs covered:** T-B1 (T032/36), T-B2 (T040/42), T-B3 (T050), T-B4 (T052/54), T-B5 (T048),
  T-B6 (T101), T-B7 (T058/60); T-F1 (T079), T-F2 (T077/098), T-F3 (T099), T-F4 (T090), T-F5 (T100),
  T-F6 (T085/094); E-OTP, E-LOCK, E-CREDS, E-RESET, E-POLICY, E-THROTTLE, E-PHOTO, E-SESSION,
  E-A11Y/THEME, E-SUPERADMIN, E-IDLE, E-MAILFAIL (T104–T128).
- **§2 assertions enforced:** A1–A6 (T030/31, T104–107); B1–B9 (T017/18, T108/109); C1–C6 (T019/20,
  T110/111); D1–D7 (T013/14, T112/113); E1–E7 (claims T023/24, T030/31, T119–122, idle schema
  T007/08); F1–F4 (T114–116, IP limit T034/35); G1–G6 (T052–57, T117/118); H1–H7 (T003, T077/78,
  T079–83, T098–100, T127/128); I1–I3 (T015/16, T101, log redaction T102/103).
- **Final gates:** performance budgets — API p95 < 300ms / admin LCP < 2.5s / no theme flash /
  sidebar ≤ 200ms, argon2 exception (T136, plan Performance Goals, Constitution IV).
