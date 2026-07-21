# Review Log — 013-panel-phase-2

Fixed format, one line per reviewed task: `<Txxx> — <VERDICT> — <fragment(s)>`

> Note: keep the most latest entry on top

---

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
