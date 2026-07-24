# Review Log — 013-panel-phase-2

Fixed format, one line per reviewed task: `<Txxx> — <VERDICT> — <fragment(s)>`

> Note: keep the most latest entry on top

---

## 2026-07-24 — T096/T097 review-fix + T098-T104 (baseline: 9b268fa)

T097 — PASS-WITH-NITS — T069 citation fixed; note omits DB-race clock-retarget fix
T098 — PASS — 5 cases verified vs M8/R1; 33/33 file count exact
T099 — PASS — beacon.ts zero-diff verified; swallow-all/zero-retry hand-traced
T100 — PASS — 12-case count exact; 2/48 red matches lookalike gap
T101 — PASS — registrableLabel matches S2 exactly incl. co.uk pinned example
T102 — PASS-WITH-NITS — case count wrong: actual 9, not claimed 10 (5 red/5 green)
T103 — PASS — Q1 order/boundaries exact; ErrorResponse shape matches contract
T104 — PASS — analyticsQuery.ts zero-diff confirmed; Q4/Q5 already exact
VITEST-FIX — PASS-WITH-NITS — fileParallelism root cause verified; still uncommitted

Detail: This session's baseline is `9b268fa`, the commit where the prior T096-T097 review
concluded — not `faf7ac1` (that review's own stated baseline, one round earlier). Four commits
landed between `9b268fa` and the T098 work (`aae5847`, `f6711ce`, `94e6d6a`, `96e8623`) applying
the T096-T097 review's own nits; those are re-reviewed here as "T097" since no prior re-review
entry exists for them.

T097: `analytics.ts`'s doc comment now correctly cites "review-log.md T096-T097" instead of the
inapplicable T069 (hand-verified against both entries — T069 really is about the admin 401 shape,
a different endpoint/status). The DB-race fix (`analytics-ingest.test.ts`'s rate-limit block now
fakes its clock to 2099 so its 120 real inserted rows can never fall inside another suite's date-
scoped query window) is real, correctly scoped (a `beforeEach` inside only the rate-limit
`describe`), and change-log.md documents it fully — but `tasks.md`'s own `> note:` under T097
mentions only the T069 citation fix, not this second change to the same file. Nit, not
concealment: the higher-priority change-log index does disclose it.

T098/T099 (beacon, E-BEACON): `beacon.test.ts` gained exactly 5 new `it()` blocks (500-resolved,
network-down, sendBeacon-false fallback, sendBeacon-throw zero-retry, fetch-reject zero-retry) —
33 total in file, matching the note. `beacon.ts` has a literal zero-line diff since `9b268fa`;
hand-traced `dispatch()`: every `sendBeacon`/`fetch` failure path is caught and swallowed, no retry
path exists anywhere in the function. Both notes' counts and "no code change" claims verified true.

T100/T101 (source matching, E-SOURCE): `trafficSource.test.ts`'s new `T100` describe block has
exactly 12 `it()` blocks (counted directly), matching the note; file total 48 (36 pre-existing +
12), matching "2/48 red". `registrableLabel()`/`matchesList()` in `trafficSource.ts` were hand-
traced against plan.md S2's exact wording, including its one worked multi-part-TLD example
(`www.google.co.uk` -> label `google` -> SEARCH) — exact match. TDD order confirmed via git log:
test commit `d12fee1` precedes implementation commit `f84e590`.

T102/T103/T104 (range validation, E-RANGE): `resolveRanges()` in `admin/analytics.ts` was hand-
traced against Q1's exact rule order (form-consistency, then from<=to, then the future-date
boundary, then the 490-day span cap) and the 490-accepted/491-rejected boundary math checks out
exactly. The 400 response body (`{error:{message,details:[{field,message}]}}`) matches
`contracts/analytics.openapi.yaml`'s `ErrorResponse` schema exactly. TDD order confirmed: test
commit `e144713` precedes implementation commit `49beab5`. T104's "no code change" claim is
confirmed by a literal zero-diff on `analyticsQuery.ts`.

Nit (T102, the one real finding this round): the task's own note and change-log entry claim "10
new E-RANGE cases (5 Q1 400s, 2 Q4 bucket, 1 Q5 zero-previous)" and "5 red/5 green" — both
arithmetically wrong on their own terms (5+2+1=8, not 10; and the change-log's T103 entry
separately states "15/15 passing... 6 pre-existing + this task's 10 new," which is also wrong:
6+10=16, not 15). Directly counting `it()` blocks in the file confirms 15 total, 9 of them new
under T102's own describe block (5 red-at-authoring Q1 violations + 4 already-green: span-490-
accepted, both Q4 bucket cases, and the Q5 zero-previous case) — not 10. The tests themselves are
real, correctly written, and correctly TDD-sequenced; only the documented count is wrong. Same
recurring pattern previously flagged at T010, T014, and T094.

Independently re-verified the whole suite rather than trusting any change-log claim: `pnpm
--filter @modular-house/api test:run` twice, both 60/60 files, 510/510 tests, clean — matching
durations (82.15s, 80.39s) consistent with the corrective session's own claimed sequential-
execution numbers (~82s). `pnpm --filter @modular-house/web test:run`: 53/53, 466/466, clean —
also matching the corrective session's claimed count exactly. `prisma validate` clean; `prisma
migrate status` — up to date, no drift; `prisma migrate diff --shadow-database-url ... --exit-code`
— no difference (the bare command in §6 needs `--shadow-database-url`, absent from
`schema.prisma`'s datasource block; supplied from `.env`'s `SHADOW_DATABASE_URL` to run it).
`docs:validate`, `lint`, `typecheck` all clean.

VITEST-FIX (not a `Txxx` task — the session's own "corrective session," explicitly in this
session's stated scope as "pre-existing full-suite flakiness"): `apps/api/vitest.config.ts` now
sets `fileParallelism: false` directly in config, with a detailed change-log entry explaining why
the documented `-- --no-file-parallelism` CLI flag never actually worked (pnpm forwards its own
`--` verbatim into the script's argv, and vitest's `cac`-based parser treats that forwarded `--` as
its own positional-args marker, silently swallowing the flag). The technical claim is independently
corroborated, not just trusted: this reviewer's own two `test:run` reruns landed at 82.15s/80.39s
wall-clock duration, matching the change-log's claimed ~82s sequential-execution figure almost
exactly (versus the previously-reported ~20-25s under the broken "parallel" default), and both runs
were fully clean at 510/510 — a marked, verified improvement over the same review-log's own T096-
T097 entry, which reported only 1-of-9 full-suite runs clean before this fix. Nit: the change-log's
own citation "this spec's own §9/§11" doesn't resolve to any actual numbered section in
`quickstart.md`, `tasks.md`, or `plan.md` — minor citation inaccuracy, does not affect the
substance of the (independently verified) technical claim. Bigger issue, not a nit: both
`apps/api/vitest.config.ts` and the change-log entry documenting it remain **uncommitted** in the
working tree as of this review — a real, verified fix currently invisible to CI and to anyone
pulling the branch. Flagged as the top must-do action item.

## 2026-07-24 — T096-T097 (baseline: faf7ac1)

T096 — PASS — canonicalizePath/admin-drop verified exact vs M5/M10; bare-/admin coverage gap disclosed
T097 — PASS-WITH-NITS — M6 exact and reliable; 429-shape T069 citation inapplicable; DB-race worsened

Detail: `canonicalizePath` (analyticsIngest.ts) hand-traced against all three T094 M10 cases
(`/Page/`→`/page`, `//garden-rooms//configure?step=2#top`→`/garden-rooms/configure`, `/`→`/`) —
exact match. M5 admin-path drop runs on the canonicalized value, correctly excludes `/admin` and
`/admin/*` while sparing `/administration`; runs before any identity/storage, so no admin-path
event is ever persisted (M1-consistent). `analyticsIngestRateLimit` (routes/analytics.ts) is exactly
120/60s per M6; its own target test (`analytics-ingest.test.ts`) passed reliably across every run
this session (11/11 isolated, and never itself failed inside 9 full-suite runs).

Nit (T097): the new rate-limit `handler`'s 429 body (`{error: string, message, retryAfter}`) does
not match `contracts/analytics.openapi.yaml`/`apps/api/openapi.yaml`'s declared `ErrorResponse`
(`error` must be an object with `.message`, not a string) — pre-existing (inherited verbatim from
`generalRateLimit`'s same shape, not introduced by T097), but the new code comment justifying it
cites "review-log.md T069" as an already-disclosed precedent; T069 was actually about the *admin*
overview/realtime endpoints' *401* responses, a different endpoint family and status code — this
specific ingest-429/ErrorResponse mismatch has never actually been reviewed before. Low severity
(M8: the beacon ignores every response), but the citation should be corrected to state this is a
newly-noted, not previously-covered, doc-drift.

Nit (T097, elevated): the change-log's own T097 entry (2026-07-24T12:35, "Notes") proactively and
accurately discloses the pre-existing T058/T068 cross-file DB race resurfacing in
`analytics-overview.test.ts`/`settings-password.test.ts` ("5 unrelated failures across two runs...
same pre-existing... not a regression") — independently corroborated: traced the exact contamination
mechanism (T094's rate-limit test now successfully inserts all 120 real `/rate-limit-check` rows,
up from ~100 under the old, stricter `generalRateLimit`, before its own `afterAll` cleans them up;
`analytics_events` confirmed empty at rest via direct psql query, so no permanent corruption). Ran
`pnpm --filter @modular-house/api test:run` 9 times this session (incl. once with
`--no-file-parallelism`): only 1 was fully clean — `analytics-overview.test.ts`'s T060/T061 failed
in 6 of 9, `analytics-realtime.test.ts` once, `analytics-privacy.test.ts` once — a materially higher
frequency than the change-log's own "two runs" framing suggests. Root cause and non-regression
status are correctly diagnosed and disclosed (crediting the implementer for catching this proactively
rather than me finding it first), but given the §6-mandated `test:run` command is now red on ~2/3 of
invocations, this should move from a disclosed footnote to the top of the corrective backlog —
transactional per-test isolation (the fix already applied to `analyticsFixtures.test.ts` at T068)
is the natural candidate for `analytics-ingest.test.ts`'s rate-limit block.


## 2026-07-24 — T092/T093/T094/T095 review-fix re-review (since 69a0d74)

T092 — PASS-WITH-NITS. Commit `111eef3`'s false "no behavior change"/"deviations: none" claim is
corrected: `tasks.md` now discloses that the commit also bundles T095's isbot implementation, and
correctly explains why (both edits landed on disk before either was committed this session, so the
first commit touching `analyticsIngest.ts` captured the file's whole current state). No `git amend`/
`rebase` was used to rewrite history — appropriately, since that would itself be a destructive
action outside the implementer's remit. T092's own scope (M2 bounds already correct) remains
independently verified by T091's 17/18. The commit-boundary imperfection is now permanent-but-
honestly-disclosed, which is what the CHANGES-REQUIRED finding asked for — upgraded to
PASS-WITH-NITS, not full PASS, since the underlying mis-attribution in git history can't be undone.

T093 — PASS (upgraded from PASS-WITH-NITS). `enforceIngestBodySizeCap`'s doc comment now discloses
the spoofable-`Content-Length` limitation and the reasoning for accepting it (bounded by the
app-wide 10 MB ceiling; M2 is abuse-protection, not a hard security boundary). Verified via
`git diff` that only the comment changed — zero logic touched — and re-ran `analyticsIngestValidation
.test.ts` (18/18) to confirm.

T094 — PASS (upgraded from PASS-WITH-NITS). The "11 new tests" count is corrected to "8 new `it()`
blocks (11 total in file, including 3 pre-existing)" — matches the diff exactly. The originally-
accurate 6-passing/5-red split was untouched.

T095 — PASS-WITH-NITS (unchanged verdict, now with root cause disclosed). New note cross-references
T092's disclosure as the reason its implementation predates T094's failing test. No functional
change — the isbot logic was already independently verified correct and M7-safe in the prior round.

Independently re-ran the full `api test:run` suite: 484/489 — the 4 expected T096/T097-scoped reds
(admin-path, rate-limit, 2x canonicalization) plus one new failure, `analytics-privacy.test.ts`'s S5
hostname test; re-ran that file alone, 9/9 green — same pre-existing cross-file DB race already
disclosed at T058/T068, not a regression from this fix (the only source change in scope is a
doc-comment addition to an unrelated function). `lint`/`typecheck` clean.

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
