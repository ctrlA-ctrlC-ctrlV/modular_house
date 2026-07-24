# Review Log — 013-panel-phase-2

Fixed format, one line per reviewed task: `<Txxx> — <VERDICT> — <fragment(s)>`

> Note: keep the most latest entry on top

---

## 2026-07-24 — T091-T095 (baseline: ace7cd6)

T091 — PASS
T092 — CHANGES-REQUIRED — commit contains undisclosed T095 logic
T093 — PASS-WITH-NITS — Content-Length cap is client-declared, spoofable. Nit: the check reads the client-declared Content-Length header rather than measured bytes — a request that lies about Content-Length (declares ≤4096 while sending more) could slip past this specific gate. Low severity: worst case is still bounded by the pre-existing global 10MB parser limit, and M2's cap is a resource/abuse-protection rule, not a hard security boundary. Worth a comment acknowledging the limitation, not a blocker.
T094 — PASS-WITH-NITS — "11 new tests" note overcounts by 3. Nit: the note claims "11 new tests... 6 passing/5 red" — the diff actually adds 8 new it() blocks; 11 is the file's total test count (8 new + 3 pre-existing). The pass/red split itself (6/5 at authoring) is accurate.
T095 — PASS-WITH-NITS — correct/M7-safe; impl landed before its own test. The nit is procedural, not functional: this task's real implementation predates its own failing test by two commits, for the reason documented under T092 above.

## 2026-07-24 — T080/T081/T090/T087 review-fix re-review (since d25c950)

T080 — PASS. Commits e8452e1 (a11y.test.tsx) and 545350a (keyboard.test.tsx) land the exact
content previously verified only in the working tree — `git diff 40c760e d25c950` confirms
byte-identical to what was already inspected. `pnpm --filter @modular-house/web test:run` against
the real committed HEAD (no stash trick needed this time): 461/461.

T081 — PASS. Commit d25c950 lands `ui/sidebar.tsx`'s `asChild`/Slot support, matching the
previously-inspected diff exactly. `Sidebar.tsx:91`'s `<SidebarMenuButton asChild>` now composes
onto a single real `<a>` via Radix Slot as designed — the nested-interactive/DOM defect is closed.

T090 — PASS-WITH-NITS. Re-ran both suites against real committed HEAD: web 461/461 clean; api
462/463 — the lone failure (`analytics-privacy.test.ts` S5 hostname test) is the same
pre-existing, already-disclosed cross-file DB race documented at T058/T068 (unrelated to this
diff — zero `apps/api` files touched by T080-T090); re-ran the file alone, 9/9 green, confirming
flake not regression. `git diff --name-only adbc335..d25c950` re-confirmed clean: 13 files, all
expected, no scope creep, no Phase 1/marketing suite touched.

T087 — PASS (upgraded from UNVERIFIED). User manually confirmed `/cookie-policy` is live and
reachable. Reviewer did not independently rerun the production build (outside §6); accepted as
human-verified, mirroring `ui-components.md`'s own parity-gate "human review" sign-off precedent.

> Per §3 authority (reviewer MAY uncheck a wrongly-completed task but MUST NOT mark any task
> [x]), the T080/T081/T090 checkboxes in tasks.md remain unchecked despite the PASS verdicts
> above — re-ticking them is the implementer's/user's action, not the reviewer's.

## 2026-07-24 — T080-T090 (baseline: adbc335)

T080 — CHANGES-REQUIRED — keyboard.test.tsx/a11y.test.tsx fix uncommitted
T081 — CHANGES-REQUIRED — ui/sidebar.tsx asChild fix uncommitted
T082 — PASS
T083 — PASS
T084 — PASS
T085 — PASS
T086 — PASS
T087 — UNVERIFIED — build rerun needed, inspection only
T088 — PASS
T089 — PASS
T090 — CHANGES-REQUIRED — green/clean claims false at committed HEAD

## 2026-07-23 — T070-T079 (baseline: 5ddc26e)

T070 — PASS — 7/7 Q2 cases hand-verified, E-TZ boundary proven
T071 — PASS — presetToRange matches Q1/Q2 exactly
T072 — PASS — 9/9, V6 30s poll via fake timers
T073 — PASS — race-safe refetch, never throws, contract-typed
T074 — PASS — distinct-value proof, not stale fixtures
T075 — PASS — loading/empty states correctly gated
T076 — PASS — exact-range mock proves real Q2 refetch
T077 — PASS — RangeToolbar.tsx confirmed doc-only diff
T078 — PASS — Q3 rejection correctly out of scope (T115/T116)
T079 — PASS — RangeDialog.tsx confirmed doc-only diff

## 2026-07-23 — T068/T069 review-fix re-review (since 0f89431)

T068 — PASS. `resetAnalyticsTables`'s one live (non-test-double) caller — the destructive proof
in `analyticsFixtures.test.ts` — now runs entirely inside a `prisma.$transaction` whose callback
always throws a sentinel, so the blanket wipe never commits and is never visible to any other
connection (Postgres READ COMMITTED): this closes the disclosed visibility window entirely rather
than shrinking it, which is the right fix, not a mitigation. `analyticsFixtures.ts`'s helpers were
correctly widened from `PrismaClient` to `Prisma.TransactionClient` (a strict structural supertype,
so every existing call site keeps compiling unchanged — confirmed via a clean `tsc --noEmit`). The
implementer's own further finding while re-verifying — a table-wide `count()` intermittently
over-reading because READ COMMITTED re-snapshots per-statement, so a genuinely concurrent commit
from another connection can land between this transaction's own `deleteMany()` and `count()` — is
correctly diagnosed, and scoping the post-wipe assertion to the test's own row via `findFirst`
(immune to that effect, since it's read-your-own-writes within the same tx) is the proportionate
fix. Independently verified: `analyticsFixtures.test.ts` alone, 9/9 across 5 consecutive standalone
runs; across 2x `test:run` + 2x `test:coverage` full-suite reruns the originally-reported symptom
(T063/T064 reading back zeroed) never recurred — though each of those 4 runs surfaced a different,
unrelated pre-existing test failing once (`analytics-ingest`, the `auth-login` rate-limit test,
`analytics-privacy`), independently corroborating the change-log's own disclosure of a broader,
environment-level test-suite instability that is genuinely out of this fix's scope.

T069 — PASS. `apps/api/openapi.yaml` — both `/api/admin/analytics/overview` and
`/api/admin/analytics/realtime` now document their `401` response as `$ref:
'#/components/schemas/Error'` (the flat `{error, message}` shape `authenticateJWT` actually
returns), leaving `400` on `ErrorResponse` (correct — that one IS produced by this session's own
route code). Re-ran `docs:validate` myself — still passes. Leaving `contracts/analytics.openapi.yaml`
(the design-time spec, the actual source of the original mismatch) untouched was the right call: it
makes the shipped, real API document describe actual runtime behavior rather than propagating a
spec-authoring error; it does leave the two OpenAPI files intentionally divergent on this one field,
worth a one-line note in a future docs pass but not a blocker.

T065 — not re-reviewed this round: no code was touched for it (a git-commit-ordering observation
has no fix to apply short of rewriting history), matching the change-log's own stated disposition.

## 2026-07-23 — T062-T069 (baseline: 5105cd2)

T062 — PASS — V5 boundaries hand-verified, now green
T063 — PASS — V3 math hand-verified, now green
T064 — PASS — S1-S4 verified via real ingest pipeline
T065 — PASS-WITH-NITS — test committed 13s after T066 impl. Nit: commit 4c22942 (this test) landed at 11:30:05, 13 seconds after 0fe84e1 (T066's overview handler) at 11:29:52 — and after T065-T066 were already marked [x] in tasks.md (a379519/804fcce at 11:29:54/57). This reverses tasks.md's own T065-before-T066 order and rule 3's "no exceptions" TDD sequencing. Functionally still red at authoring (route unmounted until T068), so no behavioral harm — same class of deviation previously accepted as a nit for T042.
T066 — PASS — real suite (T060-064) confirms green, 463/463
T067 — PASS — matches RealtimeResponse contract exactly
T068 — PASS-WITH-NITS — disclosed cross-file DB race reproduced. Nit: re-running under test:coverage reproduced the pre-existing, already-disclosed cross-file DB race — but worse than described: T063's uniqueVisitors.current and T064's search source-group both read back as 0 (not just one field as previously reported), i.e. a concurrent blanket wipe from analyticsFixtures.test.ts's one remaining destructive test trampled T063/T064's own fresh rows. A second run was clean. Non-deterministic, non-blocking, already flagged by the implementer with a correct root cause and a suggested fix (per-test transactional isolation) — but now confirmed to affect two tasks' assertions, not one field, so it belongs on the corrective backlog rather than staying a footnote.
T069 — PASS-WITH-NITS — 401 ErrorResponse mismatches real middleware. Nit: both new admin endpoints' 401 response is documented as ErrorResponse ({error:{message}}), exactly matching contracts/analytics.openapi.yaml:82-87/103-108 — but the actual, untouched authenticateJWT middleware (middleware/auth.ts:40-50) emits {error: string, message: string}, the legacy Error shape every other Phase 1 admin endpoint documents for 401 (e.g. openapi.yaml:157-161). The mismatch originates in the Phase-2 contract itself (a higher-precedence source than any T06x task) — T069 correctly mirrored what the contract says — but it means the shipped docs promise a body shape for 401 that these two endpoints will never actually return. Doc-drift finding (§5-H), not a T069 rework.

## 2026-07-23 — T058-T061 (baseline: 4a7d17b)

T058 — PASS-WITH-NITS — intermittent cross-file DB race with T005
T059 — PASS — verified vs V2-V5/Q4-Q6/S4 line-by-line
T060 — PASS — values hand-verified against seed; correctly red
T061 — PASS — values hand-verified against seed; correctly red

## 2026-07-22 — T051-T057 (baseline: 90c1526)

T051 — PASS — amended suite verified, 14/14 green
T052 — PASS — mount verified; no containing-block/CSS conflict
T053 — PASS — 9/9 verified; sources cross-checked vs code
T054 — PASS — 4/4 verified, route reachable
T055 — PASS — durations/categories verified vs source code
T056 — PASS — renders register 1:1, verified
T057 — PASS — route wired end-to-end; full suites green

## 2026-07-22 — T045/T046 review-fix re-review (since 3b027d3)

T045 — PASS — unbacked "future task" claim removed; 28/28 verified
T046 — PASS — referrer/utm forwarding closed; red-then-green confirmed by checkout

## 2026-07-22 — T045-T050 (baseline: 53ca675)

T045 — PASS-WITH-NITS — 'future task' referrer/utm claim unverified
T046 — CHANGES-REQUIRED — referrer/utm never captured; no follow-up task exists
T047 — PASS
T048 — PASS
T049 — PASS
T050 — PASS

## 2026-07-22 — T041-T043 review-fix re-review (since e435f9b)

T041 — PASS. The prior nit ("no assertion against the log-leak") is closed: analytics-privacy.test.ts gained a third describe block with (1) a static check that REDACT_PATHS contains 'referrer'/'body.referrer', and (2) a behavioral check building a real Pino instance with the production REDACT_PATHS, logging a validateBody-shaped payload, and asserting the raw URL never appears in the output while [Redacted] does. Ran the file directly — 9/9 passing, matching the claimed count.

T042 — PASS-WITH-NITS. logger.ts:52-70 — REDACT_PATHS now includes 'referrer' (top-level) and 'body.referrer' — verified against validate.ts:43-49, which really does call logger.warn({..., body: req.body}, ...) through the shared, redact-configured logger export, so the path correctly matches at runtime. Docstring updated accurately. Nit: commit 4d4f3f7 (the fix) landed before 6a43e81 (the test) — the reverse of tasks.md rule 3's "no exceptions" TDD order. The new tests were never observed red in this repo's history; functionally they're real assertions (independently confirmed they'd fail without the fix), but the ordering itself is a process deviation.

T043 — PASS. Same root-cause fix resolves this finding too ("validateBody logs raw referrer on 400") — body.referrer redacts the exact log line T043's route triggers on a 400. No separate code change was needed or made.

## 2026-07-21 — T041-T044 (baseline: edc8ecf)

T041 — PASS-WITH-NITS — missing log-redaction assertion
T042 — CHANGES-REQUIRED — referrer missing from REDACT_PATHS
T043 — CHANGES-REQUIRED — leaks referrer via validateBody log
T044 — PASS — mount verified, 435/435 green

## 2026-07-21 — T039-T040 nit-fix re-review (since ee24f8b)

T039 — PASS — injected clock verified; exact occurredAt, still red on 404
T040 — PASS — injected clock verified; reviewed-line was altered unlogged pre-fix

## 2026-07-21 — T037-T040 (baseline: fb8b1cc)

T037 — PASS — 36/36 verified passing
T038 — PASS — service verified, T037 green
T039 — PASS-WITH-NITS — wall-clock window, not injected clock
T040 — PASS-WITH-NITS — shares T039's single commit

## 2026-07-21 — T034-T036 incl. T036a-T036f (baseline: 95ed21a)

T034 — PASS
T035 — PASS
T036a — PASS
T036b — PASS — live-reverified, dark palette engages correctly
T036c — PASS
T036d — PASS
T036e — PASS — radius formula matches template exactly
T036f — PASS
T036 — PASS-WITH-NITS — gate live-reverified; temp App.tsx route outside plan scope

## 2026-07-20 — T030-T033 (baseline: a6593be)

T030 — PASS
T031 — PASS
T032 — PASS
T033 — PASS

## 2026-07-20 — T027-nit, T028-nit re-review (since 05205cb)

T027 — PASS — ui-components.md §4 now records table-inlining deviation
T028 — PASS — zero-value test now asserts per-row, not whole page

## 2026-07-20 — T026-T029 (baseline: ffeaec9)

T026 — PASS
T027 — PASS-WITH-NITS — ui-components.md §4 not updated
T028 — PASS-WITH-NITS — zero-value assertion checks whole page
T029 — PASS

## 2026-07-20 — T023-nit, T024-T025 (baseline: 720e564)

T023 — PASS-WITH-NITS — rule9/tz fixed; TrafficChart fix commit mislabeled
T024 — PASS
T025 — PASS

## 2026-07-16 — T020-T023 (baseline: 5aaf5a3)

T020 — PASS
T021 — PASS
T022 — PASS
T023 — PASS-WITH-NITS — direct recharts import (rule 9); UTC label tz not London

## 2026-07-16 — T016-T019 (baseline: 354401d)

T016 — PASS
T017 — PASS
T018 — PASS
T019 — PASS

## 2026-07-16 — T009-T015 nit-fix re-review (since 8e54943/6788144/9a2ec06)

T010 — PASS — count corrected to 9; H4 citation now points to Phase 1 plan
T011 — PASS — change-log annotated with accurate correction, original retained
T012 — PASS — H4 citation now points to Phase 1 plan
T013 — PASS — change-log annotated; data-active/data-state mismatch deferred to T036
T014 — PASS — count corrected to 13
T015 — PASS — change-log annotated with accurate correction, original retained

## 2026-07-16 — T009-T015 (baseline: a1bea54)

T009 — PASS
T010 — PASS-WITH-NITS — test count claims 10, actual 9
T011 — PASS-WITH-NITS — changelog test-fix narrative unsupported by diff
T012 — PASS-WITH-NITS — H4/§2.8 citation mislabeled (cross-phase)
T013 — PASS-WITH-NITS — changelog test-fix narrative unsupported by diff; H4 mislabeled
T014 — PASS-WITH-NITS — test count claims 12, actual 13
T015 — PASS-WITH-NITS — changelog test-fix narrative unsupported by diff

## 2026-07-15 — T004 closure (reviewer-applied fix)

T004 — PASS — ssh tunnel found, migration applied + verified on real dev DB
T005 — PASS — permanent 9-test suite verified passing
T007 — PASS — CI run reported by user, not independently confirmed

## 2026-07-15 — T001-T008 corrections re-review (since 4a69dfb)

T001 — PASS — lockfile stat note corrected
T003 — PASS — gitignore change now logged
T004 — CHANGES-REQUIRED — confirmed migration unapplied on real dev DB via tunnel

## 2026-07-15 — T001-T008 (baseline: main branch point dce2447b)

T001 — PASS-WITH-NITS — change-log lockfile stat wrong
T002 — PASS
T003 — CHANGES-REQUIRED — undocumented .gitignore change
T004 — PASS-WITH-NITS — dev-DB migration not yet applied
T005 — PASS-WITH-NITS — round-trip claim not reproducible
T006 — PASS
T007 — PASS-WITH-NITS — CI execution not directly confirmed
T008 — PASS
