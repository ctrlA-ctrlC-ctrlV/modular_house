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
