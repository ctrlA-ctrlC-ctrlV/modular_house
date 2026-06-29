# Review Log — Admin Panel Phase 1

Format: `TXXX — VERDICT — key finding — action / must-run command`

---

## Session 1 — 2026-06-25 (reviewer: supervisor)

**Scope:** T001–T012 (Phase 0 — Setup / scaffolding, first contiguous `[x]` block)

| Task | Verdict | Key finding |
|------|---------|-------------|
| T001 | PASS-WITH-NITS | All deps present in `apps/web/package.json`; user must run `pnpm install` to update lock file |
| T002 | PASS-WITH-NITS | PostCSS wired; admin isolation correct; browser smoke test (Bootstrap non-interference) requires `pnpm install` + dev server |
| T003 | PASS | All H3/H4 values exact; light/dark OKLCH token sets under `.admin-root` / `.admin-root.dark` |
| T004 | PASS-WITH-NITS | All three helpers correct; extra `db-check.ts` created (minor undocumented addition, benign); runtime needs DB |
| T005 | PASS | All field maps/indexes match data-model.md exactly; `prisma validate` passes |
| T006 | CHANGES-REQUIRED | `prisma migrate dev` auto-generated `20260625102529_modular_panel_1` (makes `users.role_id` NOT NULL) — pre-existing feature-006 drift; drift check FAILED; auto-migration not reviewed for production safety |
| T007 | PASS | DMMF-based test passes after `prisma generate` via `migrate dev` |
| T008 | PASS | `lastUsedAt DateTime?` present in schema + migration; data-model.md §5 updated; T007 passes |
| T009 | PASS | `displayName` set in both create/update paths; all upserts idempotent |
| T010 | PASS | All §2 constants match plan exactly; `jwtExpiresIn` default updated to `'15m'` |
| T011 | PASS | `routes/admin/` empty; `App.tsx` clean; no `localStorage`/`sessionStorage` references |
| T012 | PASS-WITH-NITS | Stub returns correct `{challengeId, message}` shape; `admin.auth.spec.ts` preserved; `admin-auth.test.ts` 200-case assertions are dead code in stub phase (conditional branch never exercised without seeded DB) |

**Overall: NO-GO** — T006 CHANGES-REQUIRED must be resolved before proceeding to Pass 1 (T013+).

**Must-run before proceeding:**
```
pnpm install                                          # update lock file (T001)
pnpm --filter @modular-house/api exec prisma migrate dev  # must now report "in sync" (verify no new migration)
pnpm --filter @modular-house/api db:seed              # verify displayName is set (T009) — use db:seed script, NOT prisma db seed
pnpm --filter @modular-house/api test:run             # currently 92 passed / 21 skipped — must stay green
pnpm --filter @modular-house/web test:run             # currently 102 passed — must stay green
```

---

## Session 2 — 2026-06-25 (re-check after Session 1 corrective items)

**Scope:** T001–T012 re-verification. Trigger: Session 1 left T006 as CHANGES-REQUIRED; seed was run.

**Verification results:**
- `prisma validate` — ✅ valid
- `prisma migrate dev` — ✅ **"Already in sync, no schema change or pending migration was found"** (drift check passes)
- `pnpm --filter @modular-house/api test:run` — ✅ 92 passed / 21 skipped (12 files)
- `pnpm --filter @modular-house/web test:run` — ✅ 102 passed (17 files)
- `db:seed` — ✅ ran successfully; `super_admin` user created with `displayName: 'Super Admin'`

**Verdict changes from Session 1:**

| Task | Session 1 | Session 2 | Change |
|------|-----------|-----------|--------|
| T006 | CHANGES-REQUIRED | PASS-WITH-NITS | Drift check now passes. Remaining nit: migration `20260625102529_modular_panel_1` has no comment explaining it fixes pre-existing feature-006 drift, and `data-model.md §7` does not document it. |
| T009 | PASS | PASS (confirmed) | Seed run; `displayName` set on admin user. |

**Overall: GO** — All CHANGES-REQUIRED resolved. The following PASS-WITH-NITS items are non-blocking but should be addressed:

1. `pnpm install` — update lock file (T001).
2. Add a comment to `20260625102529_modular_panel_1/migration.sql` explaining this fixes pre-existing `role_id` nullability drift from feature-006, not a Phase 1 schema change (T006 nit).
3. Add a note to `data-model.md §7` that migration `20260625102529_modular_panel_1` was auto-generated to close the `role_id` NOT NULL gap left by `20260224155034` (T006 nit).
4. After T031 wires the real OTP path, remove the `if (res.status === 200)` conditional in `admin-auth.test.ts` (T012 nit).

---

## Session 3 — 2026-06-25 (reviewer: supervisor)

**Scope:** T013–T018 (Pass 1 — Backend services, first contiguous `[x]` block without a `> reviewed:` line)

| Task | Verdict | Key finding |
|------|---------|-------------|
| T013 | PASS | D1–D4 all pinned with constants; D6 multi-violation covered; passwordPolicy.ts 100% branch after T014 |
| T014 | PASS | passwordPolicy.ts 100% branch/stmt/funcs/lines; single module for D1–D7; D3 correctly skipped when no hash |
| T015 | PASS-WITH-NITS | All 8 I1 actions + null-userId skip + I3 secret-pattern tested; nit: `createdAt` not asserted in mock data (acceptable — Prisma `@default(now())`) |
| T016 | PASS | auditLog.ts 100% coverage; entityId field confirmed in schema; null userId → skip write correctly implemented |
| T017 | PASS | All B1–B9 pinned with injected clock; no real Date.now(); challengeId entropy ≥43 chars verified |
| T018 | CHANGES-REQUIRED | Unchecked. (1) Branch coverage 87.5% — constructor defaults at lines 59–60 never exercised; (2) `verify()` findFirst lacks `orderBy: { createdAt: 'desc' }` — risk of returning consumed old row after resend |

**Overall: NO-GO** — T018 CHANGES-REQUIRED must be resolved before proceeding to T019+.

**Must-run before proceeding:**
```
pnpm --filter @modular-house/api test:coverage   # loginCode.ts must reach 100% branch after fix
pnpm --filter @modular-house/api test:run         # all tests must stay green (92 passed / 21 skipped)
```

**Corrective items for implementing agent (T018):**

1. **loginCode.test.ts** — Add one test that instantiates `new LoginCodeService()` with no arguments (the `vi.mock('@prisma/client')` at the top of the file intercepts `new PrismaClient()`, so no real DB connection is attempted). This covers the `?? new PrismaClient()` and `?? (() => new Date())` branches at lines 59–60 and brings branch coverage to 100%.

2. **loginCode.ts `verify()`** — Change the `findFirst` call to add `orderBy: { createdAt: 'desc' }` so that after a resend creates a second row sharing the same `challengeId`, the query deterministically returns the newest (active) row:
   ```ts
   const record = await this.prisma.loginCode.findFirst({
     where: { challengeId },
     orderBy: { createdAt: 'desc' },
   });
   ```

3. **loginCode.test.ts** — Add a test that verifies successfully after a `resend()` (mock `findFirst` to return the new active row, confirm `success: true`). This pins the ordering fix and guards against regression.

---

## Session 3 re-check — 2026-06-25 (T018 corrective items)

**Trigger:** Session 3 left T018 as CHANGES-REQUIRED. Implementing agent applied all three corrective items.

**Verification results:**
- `pnpm --filter @modular-house/api test:coverage` — ✅ exit 0; 128 passed / 21 skipped; loginCode.ts **100% stmt / 100% branch / 100% funcs / 100% lines**

**Fix audit:**
1. `verify()` `findFirst` now has `orderBy: { createdAt: 'desc' }` — confirmed in `loginCode.ts` ✓
2. No-args constructor test added (`describe('constructor defaults')`) that calls `verify()` to exercise default clock ✓
3. `describe('verify() after resend()')` test added; asserts `success: true` when newest row is active ✓

| Task | Session 3 | Re-check | Change |
|------|-----------|----------|--------|
| T018 | CHANGES-REQUIRED | PASS | All corrective items applied; 100% branch coverage confirmed; re-checked `[x]` |

**Overall: GO** — T013–T018 all PASS / PASS-WITH-NITS. Proceed to T019+.

---

## Session 4 — 2026-06-25 (reviewer: supervisor)

**Scope:** T019–T022 (Pass 1 — Backend services, most recent contiguous `[x]` block without `> reviewed:` lines)

**Verification results:**
- `pnpm --filter @modular-house/api test:run` — ✅ **143 passed / 0 failed** (21 suites; was 128 after Session 3 re-check)
- `pnpm --filter @modular-house/api test:coverage` — ✅ 143 passed; all security modules at 100%:

| File | Stmts | Branch | Funcs | Lines |
|------|-------|--------|-------|-------|
| `passwordResetToken.ts` | 100 | 100 | 100 | 100 |
| `userPreference.ts` | 100 | 100 | 100 | 100 |
| `passwordPolicy.ts` | 100 | 100 | 100 | 100 |
| `auditLog.ts` | 100 | 100 | 100 | 100 |
| `loginCode.ts` | 100 | 100 | 100 | 100 |
| `auth.ts` | 100 | 100 | 100 | 100 |

| Task | Verdict | Key finding |
|------|---------|-------------|
| T019 | PASS | Injected clock used; C1 (32-byte base64url, hash-only storage), C2 (60m TTL via `RESET_TOKEN_TTL_MS`), C3 (consumed/expired/unknown → clear error) all pinned; TTL boundary crossing tested; no real `Date.now()` |
| T020 | PASS | `passwordResetToken.ts` 100% branch; SHA-256 hash-only; injected clock; `consume()` returns `userId` as auth-service hook for C5/C6 (wired at T043); no extra features; schema fields/maps/indexes match data-model.md §3 exactly |
| T021 | PASS | H1 (`themeMode` enum + rejection of invalid value) and H2 (`sidebarCollapsed` boolean + default false) pinned; upsert semantics and `get()` round-trip tested; no injected clock needed (correct — no time logic); no extra preference fields invented |
| T022 | PASS | `userPreference.ts` 100% branch; Zod enum for `themeMode`; only `themeMode` + `sidebarCollapsed` (no scope creep); conditional-spread partial-update logic correct; schema fields/defaults/map match data-model.md §4 exactly |

**Overall: GO** — All four tasks PASS; no corrective items. Proceed to T023+.

**Must-run before proceeding:**
```
pnpm --filter @modular-house/api exec prisma migrate dev  # confirm "already in sync" (no new migration)
pnpm --filter @modular-house/api exec prisma validate     # confirm schema valid
```
(Both are carry-forward confirmations from Session 2; no new schema changes in T019–T022.)
---

## Session 5 — 2026-06-26 (reviewer: supervisor)

**Scope:** T023–T026 (Pass 1 — `authenticateJWT` claims + `requirePermission` middleware)

**Verification results:**
- `pnpm --filter @modular-house/api test:run` — ✅ **165 passed / 21 skipped** (19 suites; +22 tests from T023–T026)
- `pnpm --filter @modular-house/api test:coverage` — ✅ security modules:

| File | Stmts | Branch | Funcs | Lines | Notes |
|------|-------|--------|-------|-------|-------|
| `src/middleware/auth.ts` | 100 | 100 | 100 | 100 | T024 changes fully covered ✅ |
| `src/middleware/requirePermission.ts` | 100 | 100 | 100 | 100 | ✅ |
| `src/config/adminAuth.ts` | 100 | 100 | 100 | 100 | ✅ |
| `src/services/auth.ts` | 97.95 | 88.23 | 100 | 97.95 | line 39: production-throw branch (pre-existing; fixed at T031) |
| `src/routes/admin/auth.ts` | 72.22 | 50 | 100 | 72.22 | lines 35-46: T012 stub routes (not a T023–T026 concern) |

| Task | Verdict | Key finding |
|------|---------|-------------|
| T023 | PASS-WITH-NITS | All 4 E1 claims (userId/email/role/permissions) asserted; 3 × 401 paths covered; **nit**: implementing agent's `> note` acknowledges tests passed immediately before T024 — "Done when: Tests fail" condition was never met (TDD process violation, non-blocking: implementation + coverage are correct) |
| T024 | PASS | `authenticateJWT` explicitly maps all 4 E1 claims; `decoded.permissions ?? []` correctly defaults empty array for legacy tokens; `TokenPayload` + `Express.Request.user` types updated; `auth.spec.ts` kept in sync; `src/middleware/auth.ts` 100% branch |
| T025 | PASS | RBAC allow/deny/unauthenticated paths all asserted; Open-Closed factory test included; permission string format `resource:action` exercised with 6 distinct test pairs; no injected clock needed (correct — no time logic) |
| T026 | PASS | `requirePermission.ts` 100% branch; factory pattern correct (Open-Closed); reads from `req.user.permissions` (JWT-loaded, no per-request DB query); 401 on no `req.user`, 403 on missing permission; `logger.warn` on deny path |

**Overall: GO** — All four tasks PASS / PASS-WITH-NITS. No corrective items needed. Proceed to T027+.

**Must-run before proceeding:**
```
pnpm --filter @modular-house/api exec prisma migrate dev   # confirm still "already in sync"
```

**Carry-forward nit (non-blocking):**
After T031 completes the AuthService rewrite, add a test that passes `decoded` WITHOUT a `permissions` field (simulating a legacy JWT) and verifies that `req.user.permissions` is set to `[]`. This pins the `?? []` null-coalescing branch which T023 currently leaves untested.

---

## Session 6 — 2026-06-26 (reviewer: supervisor)

**Scope:** T027–T031 (Pass 1 — middleware amendment, route re-gating, AuthService rewrite)

**Verification results:**
- `pnpm --filter @modular-house/api test:run` — ✅ **212 passed / 21 skipped** (21 suites; +47 tests from T027–T031)
- `pnpm --filter @modular-house/api test:coverage` — ✅ all security modules at 100% branch:

| File | Stmts | Branch | Funcs | Lines | Notes |
|------|-------|--------|-------|-------|-------|
| `src/middleware/auth.ts` | 100 | 100 | 100 | 100 | ✅ |
| `src/middleware/requirePermission.ts` | 100 | 100 | 100 | 100 | ✅ |
| `src/services/auth.ts` | 100 | 100 | 100 | 100 | ✅ T031 rewrite; production-secret branch now covered |
| `src/services/loginCode.ts` | 100 | 100 | 100 | 100 | ✅ |
| `src/services/passwordPolicy.ts` | 100 | 100 | 100 | 100 | ✅ |
| `src/services/passwordResetToken.ts` | 100 | 100 | 100 | 100 | ✅ |
| `src/services/auditLog.ts` | 100 | 100 | 100 | 100 | ✅ |
| `src/services/userPreference.ts` | 100 | 100 | 100 | 100 | ✅ |
| `src/config/adminAuth.ts` | 100 | 100 | 100 | 100 | ✅ |
| `src/routes/admin/auth.ts` | 72.22 | 50 | 100 | 72.22 | lines 35-46: T012 stub success-path not exercised without DB (pre-existing; will be replaced by T033) |

| Task | Verdict | Key finding |
|------|---------|-------------|
| T027 | PASS | requirePermission allow/deny/empty/unauthenticated added to auth.spec.ts; requireRole tests retained; legacy-JWT test in authenticateJWT.test.ts pins decoded.permissions ?? [] branch; both middleware files at 100% branch; carry-forward nit from Session 5 resolved |
| T028 | PASS | 10-test file (5 endpoints × {401-unauthenticated, 403-no-permission}); JWT with permissions:[] pattern correct; all 10 pass. Nit: uploads route also re-gated in T029 but not covered by T028 (acceptable — uploads is correctly gated) |
| T029 | PASS | pages/gallery/faqs/submissions/redirects/uploads all gate via authenticateJWT (router-level) + requirePermission (per-operation); requireRole removed from pages.ts; T028 10/10 verified |
| T030 | PASS | All A1–A6/B7/C6/E1–E7 scenarios covered with injected clock; adminAuth.ts constants imported (no magic numbers); legacy-JWT branch pinned in authenticateJWT.test.ts; production-secret guard tested |
| T031 | PASS | All 6 Phase-1 methods present (verifyCredentials/verifyOtp/refresh/logout/revokeAllSessions/changePassword); services/auth.ts 100% branch confirmed; raw tokens hash-only storage; injected clock throughout; E1 permissions via derivePermissions(); E7 idle timeout in refresh(); legacy helpers preserved; no scope creep |

**Overall: GO** — All five tasks PASS. No corrective items. Proceed to T032+ (backend routes Pass 1).

**Must-run before proceeding:**
```
pnpm --filter @modular-house/api exec prisma migrate dev   # confirm still "already in sync"
pnpm --filter @modular-house/api exec prisma validate      # confirm schema valid
```

---

## Session 7 — 2026-06-26 (reviewer: supervisor)

**Scope:** T032–T035 (Pass 1 — first backend route pair: login + auth-route IP rate limit)

**Note on review-log gap:** T032–T035 had `> reviewed: PASS` lines in `tasks.md` with no corresponding review-log entry (Session 6 ended at T031). Those lines were self-added by the implementing agent and are replaced here with independent supervisor verdicts.

**Verification approach:** Source-of-truth re-derive from actual files — `auth-login.test.ts`, `auth-ratelimit.test.ts`, `src/routes/admin/auth.ts`, `src/middleware/rateLimit.ts`, `src/config/adminAuth.ts`, `src/services/auth.ts`, OpenAPI contract `TwoFactorChallenge` schema. No trusted handoff summaries.

| Task | Verdict | Key finding |
|------|---------|-------------|
| T032 | PASS-WITH-NITS | Contract shape (challengeId/message, no token), B1/B2/B7 DB row, B8 email subject, A5 generic-401, A2/A3 lockout via `LOCKOUT_THRESHOLD`, F4 rate limit — all asserted. MailerService mocked at module boundary. **Nit:** `> note:` falsely claims "audit log" is covered; neither the test nor the route implementation includes AuditLog writes. Login-event audit logging is correctly deferred to T101; the note should be corrected. |
| T033 | PASS-WITH-NITS | `authRateLimit` applied router-wide; `verifyCredentials()` called; `{ challengeId, message }` response correct; 423/401 discrimination correct; no access token minted (B7). **Nit 1:** `> note:` is inaccurate — method is `sendEmail` not `sendLoginCode`; no `auditLog` import or call in route (deferred to T101). **Nit 2:** Stale comment on logout stub says "comes in T031" (T031 is done); should reference T047. **Nit 3:** `new AuthService()` per-request creates a new PrismaClient per call (pre-existing pattern, non-blocking). |
| T034 | PASS | Unique IP `198.51.100.42` (no collision with T032 test); lightweight empty-payload loop; `IP_RATE_LIMIT_MAX` constant used; 429 at exact threshold; neutral response body (no challengeId/token) asserted. |
| T035 | PASS (corrective fix applied) | F4 exact values (`IP_RATE_LIMIT_MAX=20`, `IP_RATE_LIMIT_WINDOW_MS=900000`); `auth:${clientIP}` key prefix; neutral 429 body; `router.use(authRateLimit)` correct. **Regression found and fixed:** T035 added `authRateLimit` to `rateLimit.ts` without updating the existing `tests/contract/submissions.enquiry.spec.ts` mock — Vitest strict-mode threw "No authRateLimit export defined on mock" (exit 1). Reviewer added `authRateLimit` and `generalRateLimit` pass-through stubs to that mock. Suite now 239 passed / 0 failed. |

**Overall: GO** — All four tasks PASS / PASS-WITH-NITS. Regression in `submissions.enquiry.spec.ts` found and fixed by reviewer. Proceed to T036+.

**Verified test run (post-fix):**
- `pnpm --filter @modular-house/api test:run` — 23 files / 239 tests passed, exit 0 ✅

**Must-run before proceeding:**
```
pnpm install                                                   # update lock file (carry-forward T001)
pnpm --filter @modular-house/api exec prisma migrate dev       # confirm still "already in sync"
pnpm --filter @modular-house/api exec prisma validate          # confirm schema valid
pnpm --filter @modular-house/api test:run                      # confirmed 239 passed ✅
pnpm --filter @modular-house/api test:coverage                 # security modules must remain 100% branch
```

**Non-blocking follow-ups for the implementing agent:**
1. Correct the `> note:` in T032 to remove the false "audit log" claim (actual: audit logging deferred to T101).
2. Correct the `> note:` in T033: method is `sendEmail` not `sendLoginCode`; `auditLog` is not used in the route.
3. Fix the stale comment in `apps/api/src/routes/admin/auth.ts` on the logout stub: change "comes in T031" → "comes in T047".

---

## Session 8 — 2026-06-29 (reviewer: supervisor)

**Scope:** T036–T043 (Pass 1 — backend route pairs: verify-2fa, resend-code, forgot-password, reset-password)

**Verification results:**
- `pnpm --filter @modular-house/api test:run` — ❌ **exit 1 — 9 failed / 249 passed (258 total)**. Failures confined to `auth-verify-2fa.test.ts` (3 tests). Root cause identified — see Race Condition section below.
- `pnpm --filter @modular-house/api test:run --fileParallelism=false` — ✅ **258 passed / 0 failed** (sequential run, same test file, confirms race condition not a logic bug)
- `pnpm --filter @modular-house/api test:run -- tests/integration/auth-verify-2fa.test.ts` — ✅ **6/6 passed** (isolation run confirms implementation is correct)

**Root Cause — Cross-Test Race Condition in `resetAdminTables()`:**

`helpers/db.ts:resetAdminTables()` calls `deleteMany()` on `loginCode`, `passwordResetToken`, and `userPreference` with **no `userId` filter**. When T036–T042's four integration test files all run in parallel (Vitest default), concurrent `beforeEach` calls delete rows belonging to another file's active test. Two failure modes observed:
1. **500**: `loginCode.verify()` calls `findFirst` (record found) → another file's `beforeEach` deletes ALL `loginCode` rows → `update({ where: { id } })` throws `PrismaClientKnownRequestError: Record to update not found` → route's `catch` block returns 500.
2. **401 on correct code**: another file's `beforeEach` deletes all login codes before the route call → `findFirst` returns null → `{ success: false, reason: 'unknown_challenge' }` → 401.

| Task | Verdict | Key finding |
|------|---------|-------------|
| T036 | CHANGES-REQUIRED | Unchecked. 6/6 assertions match contract and pass in isolation; fail 3/6 in full parallel suite due to `resetAdminTables()` race. Additional nit: `SameSite=Strict` not asserted on Set-Cookie (E3). |
| T037 | PASS (pending T036 fix) | Route verified by inspection: `verifyOtp()` → Session shape (`accessToken`, `expiresIn=900`, full `Me` user) matches contract; `httpOnly + SameSite=Strict` cookie (E3); `buildSessionUser` loads all Me fields correctly; no secrets returned. Implementation is correct; blocked by T036 test infra. |
| T038 | CHANGES-REQUIRED | Unchecked. Same `resetAdminTables()` race. Additional nit: eligible-resend test does not assert `sendEmailMock` called (B8 — OTP must be emailed on resend). |
| T039 | PASS (pending T038 fix) | Route verified by inspection: `checkResendThrottle()` derives cooldown from `createdAt` timestamps (F1/F2); `LoginCodeService.resend(challengeId)` keeps same challengeId (B9); prior code invalidated (B6); neutral 429 on throttle (F3); code emailed (B8). Implementation is correct. |
| T040 | CHANGES-REQUIRED | Unchecked. Same `resetAdminTables()` race. |
| T041 | PASS-WITH-NITS (pending T040 fix) | Route verified by inspection: C4 neutral 200 ✓; token + email only for known email ✓; F1/F2 derived from `password_reset_token` rows ✓; email subject contains 'reset' ✓. **Nit (F3):** throttle 429 only returned for known-email accounts — an attacker can enumerate account existence by observing 429 vs 200 on consecutive rapid requests. This is a deliberate pass-2 gap (T115 will harden). |
| T042 | CHANGES-REQUIRED | Unchecked. Same `resetAdminTables()` race. Assertions verified by inspection: C2/C3/C5/C6/D1–D4 all covered; injected clock for TTL; argon2.verify confirms password change; lockout counters and `revokedAt` verified in DB. |
| T043 | PASS (pending T042 fix) | Route verified by inspection: policy check first → 400 if invalid, token stays unconsumed (correct per D6) ✓; `consume()` → 410 on used/expired (C2/C3) ✓; `$transaction` atomically hashes new password, clears lockout (C5), revokes all families (C6) ✓; neutral 200 response ✓. |

**Overall: NO-GO** — `pnpm --filter @modular-house/api test:run` exits 1. T036/T038/T040/T042 unchecked. T037/T039/T041/T043 implementations are correct and left checked (verifiable by inspection + isolation run), pending test-infra fix.

**Must-run before proceeding (after corrective items are applied):**
```
pnpm --filter @modular-house/api test:run           # must exit 0 (currently 9 failures)
pnpm --filter @modular-house/api test:coverage      # security modules must remain 100% branch
pnpm --filter @modular-house/api exec prisma validate
```

**Corrective items for implementing agent (T036/T038/T040/T042 — test infra):**

1. **`apps/api/tests/helpers/db.ts`** — Add a `userId` parameter to `resetAdminTables()` and filter all `deleteMany()` calls to that user's rows. This eliminates the cross-test race condition while keeping the helper type-safe:
   ```typescript
   export async function resetAdminTables(userId?: string): Promise<void> {
     const filter = userId ? { where: { userId } } : {};
     for (const table of ADMIN_TABLES) {
       const delegate = (prisma as unknown as Record<string, unknown>)[table];
       if (delegate && typeof (delegate as { deleteMany?: unknown }).deleteMany === 'function') {
         await (delegate as { deleteMany: (args?: unknown) => Promise<unknown> }).deleteMany(filter);
       }
     }
   }
   ```

2. **All four test files** — Update every `await resetAdminTables()` call in `beforeEach` to pass `userId`:
   - `auth-verify-2fa.test.ts`: `await resetAdminTables(userId)`
   - `auth-resend-code.test.ts`: `await resetAdminTables(userId)`
   - `auth-forgot-password.test.ts`: `await resetAdminTables(userId)`
   - `auth-reset-password.test.ts`: `await resetAdminTables(userId)`
   Also check any existing test files that call `resetAdminTables()` (e.g. `auth-login.test.ts`, `auth-ratelimit.test.ts`, `legacy-endpoints-regate.test.ts`) and update those too if they were modified.

3. **`auth-resend-code.test.ts`** (T038 nit) — In the eligible-resend test, add after the 200 response assertion:
   ```typescript
   expect(sendEmailMock).toHaveBeenCalledTimes(1);
   expect(sendEmailMock).toHaveBeenCalledWith(expect.objectContaining({ to: email }));
   ```
   This pins B8 (new code emailed on resend).

4. **`auth-verify-2fa.test.ts`** (T036 nit, non-blocking) — Add `SameSite=Strict` assertion to the Set-Cookie check:
   ```typescript
   expect(setCookie[0]).toMatch(/SameSite=Strict/i);
   ```

After these fixes, re-run `pnpm --filter @modular-house/api test:run` to confirm 258/258 green, then re-check T036/T038/T040/T042 and mark them `> reviewed: PASS` / `> reviewed: PASS-WITH-NITS` accordingly.