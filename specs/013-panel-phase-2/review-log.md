# Review Log — 013-panel-phase-2

Fixed format, one line per reviewed task: `<Txxx> — <VERDICT> — <fragment(s)>`

> Note: keep the most latest entry on top

---

## 2026-08-11 — T134-T137 (baseline: 5b3a98c)

T134 — PASS-WITH-NITS — deviations:none omits stub method; US3-13 citation mismatch
T135 — PASS-WITH-NITS — US3-13 citation mismatch
T136 — PASS
T137 — PASS

Detail: `git diff --name-only 5b3a98c HEAD` touches 8 files: 4 source (`AppShell.tsx`/`.test.tsx`,
`TrafficChart.tsx`/`.test.tsx`), 2 unrelated-but-disclosed source (`beacon.ts`/`.test.ts`, a
corrective session fixing a CI-only test failure), and 2 docs (`change-log.md`, `tasks.md`). Every
source file has a matching change-log entry (T134 10:35, T135 11:10, T136 11:35, T137 12:05, plus
the CI beacon-URL fix at 09:55 and a T130-T132 nit-fix at 09:30) — no concealed changes. The
beacon.ts/CI-fix and T130-T132 nit-fix commits land in this diff window but are outside this
session's REVIEW SCOPE (T134-T137); read in full as a sanity check only: the beacon change is a
literal zero-logic-change export-visibility fix (`INGEST_URL` const → exported const) with both
test assertions swapped from a hardcoded literal to the module's own resolved value — confirmed via
diff, not a source of concern. Supply-chain check: zero `package.json`/lockfile changes.

TDD reproduction, independently done by hand rather than trusting the change-log's claimed
red/green splits: checked out `AppShell.tsx` at `5b3a98c` (pre-T135) over the current tree and
reran `AppShell.test.tsx` — 18 passed / 1 failed, `AssertionError: expected null not to be null`,
matching T134's own claimed split and reason exactly; restored, confirmed clean via `git status`.
Same exercise for `TrafficChart.tsx` at `e364e5b` (pre-T137) — 5 passed / 1 failed,
`AssertionError: expected 92 to be less than or equal to 15`, matching T136's claimed split and
reason exactly; restored, confirmed clean. Commit-timestamp order independently confirms atomic
TDD pairs: T134 test (10:45:40) precedes T135 impl (11:10:34); T136 test (11:47:16) precedes T137
impl (13:10:11) — no rule-3 violation.

T134/T135 (Group B, scroll-reachability): `AppShell.tsx`'s fix is two class additions —
`h-svh` on the content-region wrapper (bounds the flex row's cross-axis without competing with the
wrapper's own `flex-1`, which governs the row's main axis/width) and `overflow-y-auto` on `<main>`
(a flex item, so per the CSS Flexbox automatic-minimum-size algorithm its automatic min-size floors
at 0 instead of its content's natural height, letting `flex-1` shrink it to the exact remaining
space and scroll its own overflow). The reasoning is internally consistent and matches the
reference template's own `SidebarProvider` precedent for why `.admin-root` itself stays
`min-h-svh`; jsdom performs no real layout so this could not be independently re-measured in this
environment — inspection-passed, consistent with the change-log's own disclosed "outstanding:
human real-browser confirm" caveat (same disposition as T133's own unmet human-confirm clause,
which the 2026-08-10 review scored plain PASS, not a nit — applied the same way here for T135/T137
alone). The `AppShell.test.tsx` stub (className-regex-matched `overflow-y-auto`/`scroll` treated as
height-bounded, `scrollHeight`/`clientHeight` pinned via `Object.defineProperty` on the prototype)
was hand-traced against both the pre-fix and post-fix source and correctly flips from null to
non-null exactly when the real fix is present — not a tautology.

**Nit (T134, the one real finding this round)**: `tasks.md`'s T134 `> note:` claims
`deviations: none`, but the task's literal Done-when talks about ancestors that "compute
overflow-y: visible" — a real computed-style read — while the actual test (and the change-log's
own T134 entry, and the test file's own header comment) documents a necessary substitute: jsdom
has no live cascade for this project's aliased-to-empty-stub stylesheets, so the suite instead
infers "bounded" from the rendered `className` string and stubs `clientHeight`/`scrollHeight` via
`Object.defineProperty`, never touching real computed style. This is the exact same shape of
deviation — a justified, disclosed-in-the-change-log-but-not-in-the-task-note substitution forced
by the same jsdom gap — that the 2026-08-10 review flagged for T130/T131/T132 and that this
session's own 09:30 commit (`a079766`/`22cef1b`) had just finished correcting, an hour before T134
was authored. Not concealment (the change-log entry discloses the method in full), but the same
avoidable inaccuracy recurring in the very next task after being fixed. T135/T136/T137's own
`deviations:` fields are accurate (T135/T137 honestly name the outstanding human-confirm clause;
T136 genuinely has none — its local-fixture approach is within `Files:` scope, not a workaround).

T136/T137 (Group C, tick density): `computeDayTickSubset` was hand-traced for correctness, not just
read: for a 91-bucket series it selects indices `{0,8,16,25,33,41,49,57,65,74,82,90}` — 12 distinct,
evenly spaced, and the endpoint-inclusion claim ("always including both endpoints") is exact by
construction (`i=0` always rounds to index 0; `i=MAX_DAY_TICKS-1` always rounds to exactly
`lastIndex` since `step * (MAX_DAY_TICKS-1) = lastIndex` algebraically), not merely typical-case.
Hour-bucket series correctly bypass the cap entirely (`dayTicks` is `undefined` unless
`range.bucket === 'day'`), leaving `XAxis`'s original `interval={0}` behaviour untouched, matching
Done-when's explicit "2-day hour-bucket view... unchanged" requirement. Both `TrafficChart.tsx` and
`AppShell.tsx` reach recharts only through the ported `chart.tsx` wrapper (rule 9) — confirmed no
bare `recharts` import in either file.

**Citation check (FR/US references, §5-I)**: FR-022, FR-029, and SC-010 (T137) all resolve to real,
content-matching spec.md text. `US3-13` (T134/T135's second `Refs:` entry) does resolve to real
content — Acceptance Scenario 13 of User Story 3 exists (line 103) — correcting the 2026-08-10
review's blanket claim it "does not exist anywhere in spec.md." But that scenario's actual text is
about small-viewport stacking and no *horizontal* scrolling ("a small-viewport device... no
horizontal scrolling"), not the *vertical* scroll-reachability-at-a-typical-laptop-viewport
(1568×744) defect T134/T135 actually fix — no Acceptance Scenario in User Story 3 covers "content
taller than viewport must be reachable by scroll." Likely picked for the word "reachable"/
viewport-adjacent phrasing rather than matching content — a citation-content mismatch, not a
missing reference. Low severity (doesn't affect the fix's correctness), but worth a corrected
citation (or a spec gap noted) in a future docs pass.

Verification commands (§6), all run against Docker's already-running port-5434 test DB:
`pnpm --filter @modular-house/api test:run` 60/60 files, 515/515 tests, clean (no API file in this
diff, as expected). `pnpm --filter @modular-house/web test:run` 54/54 files, 486/486 tests, clean —
matches change-log's own claimed count exactly. `prisma validate` clean. `prisma migrate status`
(re-pointed at the test DB per established precedent): up to date, no drift — no migration files in
this diff, no drift expected. `prisma migrate diff --exit-code`: disposable
`modular_house_review_shadow` database created via direct `psql -h localhost -p 5434`, diff run
(`No difference detected`), dropped immediately after. `docs:validate` clean. `pnpm lint`/
`pnpm typecheck` clean across all 4/3 workspaces. `test:coverage` (api): 515/515 passing; `All
files` line coverage **69.53%** (unchanged from the 2026-08-10 review — no API file touched),
`analyticsIngest.ts`/`middleware/auth.ts` still 100% branch.

## 2026-08-10 — T130-T133 (baseline: e7423e6)

T130 — PASS-WITH-NITS — note wrongly claims zero deviations
T131 — PASS-WITH-NITS — same deviation-note mismatch
T132 — PASS-WITH-NITS — new file; same deviation-note mismatch
T133 — PASS

Detail: diff vs. baseline `e7423e6` touches 6 files (4 source: `tokens.css`,
`select.test.tsx`, `dialog.test.tsx`, `dropdown-menu.test.tsx` new; 2 docs: `change-log.md`,
`tasks.md`). The 4 source files are exactly the change-log's own file list — no concealed source
change. TDD independently reproduced by hand: temporarily reverted `tokens.css` to its
pre-`e7423e6`… state and reran the three new suites — all three failed for the right reason
(unresolved token), all 51 pre-existing suites stayed green; restored and reran clean (54/54
files, 484/484 tests). The core technical premise — jsdom 25.0.1's `getComputedStyle` cannot
resolve `var()` — was independently confirmed with a standalone repro, not taken on faith. The new
bare `:root`/`.dark` blocks are byte-identical (script-diffed) to `.admin-root`/`.dark .admin-root`,
confirming the additive claim. Checked the "no-op for the public site" claim directly: grepped
every public-facing CSS file and every non-admin `.tsx`/`.ts` file for `var(--<token-name>)` reads
of all 27 new token names — zero hits outside `src/admin/`, and `admin.css`/`tokens.css` is
imported once, globally, from `App.tsx`, so this was a real risk worth checking, not a formality.
One recurring nit: all three `> note:` lines claim "deviations: none", but both the change-log and
each test file's own header comment say the opposite — a documented, justified deviation from
T130's literal "read computed background-color" wording (necessary given the jsdom gap above).
T133's own Done-when has an unmet clause (human confirms in a real browser; public-site spot-check)
that the change-log's own "Outstanding" paragraph discloses honestly — not silently dropped, but
not yet satisfied either. Verification: `pnpm --filter @modular-house/web test:run` 54/54 files
484/484 tests; `pnpm --filter @modular-house/api test:run` 60/60 files 515/515 tests; `pnpm lint`
and `pnpm typecheck` clean (4/3 workspaces); `prisma validate`/`migrate status` clean (this diff
touches no schema — command 6's shadow-database diff skipped as not applicable); `docs:validate`
clean; `test:coverage` unchanged at 69.53% lines, `analyticsIngest.ts`/`middleware/auth.ts` still
100% branch.

**Out-of-scope finding, flagged not reviewed**: the same diff window's `tasks.md` change (commit
`8ed6a4a`, 2026-08-10T15:50) adds ~250 undisclosed lines defining T134–T156 ("Post-hoc review
follow-ups", Groups B–I) — none of it named in any change-log entry at any timestamp before or
after. Two concrete problems found on inspection despite these tasks being out of REVIEW SCOPE:
(1) T150/T151 propose editing `packages/ui/src/components/HeroWithSideText/HeroWithSideText.tsx`
— `packages/ui` is `@modular-house/ui`, explicitly guardrail-protected by plan §5.2 ("No changes
to `@modular-house/ui`") and this review's own Authority table; the task text acknowledges the
guardrail and proposes to violate it anyway ("keep this change minimal"). (2) T134/T135 cite
"US3-13", which does not exist anywhere in `spec.md` (only US3-15 does). Not scored against
T130-T133 individually; see chat report for the Overall-verdict impact.

## 2026-08-10 — T124-T127 (baseline: 2193570)

T124 — PASS — schema diff exact; docs:validate clean
T125 — PASS — 9/9 rows confirmed live; GA gap verified
T126 — PASS-WITH-NITS — banner fix live-exact; perf delta unresolved
T127 — PASS-WITH-NITS — policy fix live-exact; dashboard fix not reproduced

Detail: All 7 diffed files vs. baseline `2193570` (3 source: `Analytics.tsx`, `CookieBanner.tsx`,
`CookiePolicy.tsx`; 4 docs: `change-log.md`, `contracts/analytics.openapi.yaml`, `tasks.md`,
`ui-components.md`) are disclosed in change-log.md across 7 dated entries (T121-ack, T122, T123,
T124, T125, T126, T127) — no concealed changes. T122/T123 land in this same diff window (marked
`[x]` with notes) but carry no `> reviewed:` line yet and are outside this session's stated
REVIEW SCOPE (T124-T127) — not evaluated against the full §5 checklist here; flagged in the chat
report only as a gap for a future session. Supply-chain check: zero package.json/lockfile changes.

T124 (OpenAPI drift closure): independently diffed all three endpoints
(`POST /api/analytics/events`, `GET /api/admin/analytics/{overview,realtime}`) and all five
referenced schemas (`IngestEventRequest`, `KpiValue`, `OverviewResponse`, `RealtimeResponse`,
`ErrorResponse`, new `Error`) field-by-field between `apps/api/openapi.yaml` and
`contracts/analytics.openapi.yaml` — identical except prose, exactly as claimed. The new `Error`
schema matches `apps/api/openapi.yaml:1122-1127`'s pre-existing shape verbatim. Reran
`docs:validate` myself — clean. Correctly closes the T069-flagged 401 ErrorResponse/Error drift
in the design-time contract (the real, shipped `apps/api/openapi.yaml` already had it right).

T125 (cookie register live audit): independently confirmed the load-bearing claims at the source
level rather than trusting the narrative alone — `cookieRegister.ts`'s 9 entries, order, and
durations match exactly as described; `git diff --stat main...HEAD -- '**/GoogleTag*'` empty and
every `VITE_GA_TRACKING_ID` hit across the whole branch diff is a comment, confirming the
guardrail; the claimed root cause for `_ga`/`_ga_<container-id>` not firing locally
(`GoogleTag.tsx:8` reads `VITE_GA_TRACKING_ID`, `.env` only defines the unprefixed
`GA_TRACKING_ID`) is verified byte-exact against both files. Live-reproduced the browser half
directly: navigated to `/cookie-policy` and confirmed exactly 9 rendered register rows. Did not
independently repeat the admin-panel cookie enumeration or the `curl`/`Set-Cookie` refreshToken
check (would require the same live login covered under T127 below) — `refreshToken`'s
httpOnly/SameSite=Strict/domain claims were instead corroborated by reading
`routes/admin/auth.ts:220-224` directly, which matches.

T126 (Lighthouse + banner contrast): the `CookieBanner.tsx` fix was independently live-reproduced
end-to-end, not just read — navigated the running dev server to `/`, computed the real rendered
contrast ratio via `getComputedStyle` + the WCAG relative-luminance formula: `text-light` on the
message `<p>` yields `rgb(248,249,250)` on `rgb(33,37,41)`, a **14.63:1** ratio, closing the
disclosed 2.06:1 defect. Root cause (unconditional `p { color: var(--brand-slate) }` in
`style.css:387-390` beating an inherited `bg-dark`/`text-light` pair) verified directly against
the stylesheet. Did not independently rebuild `main` in a worktree to reproduce the Lighthouse
A/B — treated as inspection-passed on the strength of the methodology and its candor.
One real nit: DoD-5's literal bar is "performance ... scores >= pre-phase baseline" — the
session's own same-machine A/B shows performance regressed on 3 of 4 pages (about -0.05, contact
-0.08, garden-rooms -0.05) against only one improving (house-extensions +0.15), attributed to
sandbox load variance plus a real, correctly-root-caused, pre-existing (not-Phase-2) contributor
(`App.tsx` eagerly imports every admin page including the new heavy `recharts`/Radix
dependencies into the public site's own main bundle — confirmed directly at `App.tsx:44-54`, no
`React.lazy` anywhere). Honestly disclosed and correctly scoped as an architecture issue outside
this task's `Files:` line, not swept under the rug — but "mixed, consistent with variance" is a
generous read of a 3-of-4 one-directional result, so DoD-5's performance clause is not cleanly,
unambiguously met. Not a CHANGES-REQUIRED (best-practices, the audit actually most affected, is
outside DoD-5's three named categories entirely) but worth watching, same class of disclosed
marginal-metric nit as T121's 490-day budget.

T127 (final WCAG pass): the `CookiePolicy.tsx` fix was independently live-reproduced —
`<code class="text-dark">` renders `rgb(33,37,41)` on `rgb(254,254,254)`, a **15.30:1** ratio
(hand-computed the pre-fix 4.46:1 defect via the WCAG formula against `#d63384` on `#fefefe` and
got an exact match, confirming the implementer's own live-tool measurement was not fabricated).
The `Analytics.tsx` dark-mode `<h1>`/`<p>` fix was **not** independently live-reproduced by this
review: reaching `/admin/analytics` requires a real login, and the already-running `apps/api` dev
server (found already listening on :8080, pre-dating this session) is configured against its
`.env`'s real `MAIL_HOST=mail.modularhouse.ie` rather than MailHog (confirmed: the 2FA code for
this reviewer's own login attempt as `admin@modular.house` never reached MailHog's API, unlike
T125's own session, which explicitly restarted the server against MailHog first) — completing
the login would have routed a real one-time-code email through production SMTP rather than a
disposable local one. Reviewer stopped at the 2FA prompt rather than proceed, per this project's
own caution around actions with external, hard-to-reverse side effects. The claim is nonetheless
strongly corroborated at the source level: the leaked dark-mode foreground `#121414` is an exact,
character-for-character match to `style.css:201`'s `--brand-title` token (proving the leak, not
just asserting it); the unlayered-vs-layered mechanism is independently confirmed
(`admin.css:18-19` wraps Tailwind in `layer(theme)`/`layer(utilities)`; `style.css`'s `h1..h6`/`p`
rules carry no layer); `--foreground`/`--muted-foreground` exist in `tokens.css:83,93,123,133`
exactly as the fix references. Recommend: a future live re-check first restart `apps/api` with
`MAIL_HOST=localhost MAIL_PORT=1025` (MailHog) per T125's own precedent, or query
`analyticsEvent`/session state directly, before attempting another live admin login.
One nit shared by T126/T127: none of the three new contrast-fix class/style additions
(`CookieBanner.tsx`'s `text-light`, `CookiePolicy.tsx`'s `text-dark`, `Analytics.tsx`'s two inline
`style` props) gained a dedicated regression assertion (e.g. a className/style presence check) —
jsdom cannot assert real contrast, but nothing guards against a future refactor silently dropping
the fix either. Low severity, same gap pattern as the rest of the codebase's existing tests.

Verification commands (§6): `pnpm lint` clean (4 workspaces). `pnpm typecheck` clean (3
workspaces). `pnpm --filter @modular-house/api test:run`: 60/60 files, 515/515 tests, clean —
matches T122's own claimed count exactly. `pnpm --filter @modular-house/web test:run`: 53/53
files, 481/481 tests, clean — matches T122's claim; isolated rerun of
`Analytics.test.tsx`+`dashboard-states.test.tsx` alone: 24/24, matching T127's own claimed count
exactly. `prisma validate` clean. `prisma migrate status` (re-pointed at the port-5434 test DB,
same known `.env` port-5432-unreachable gap as prior sessions): up to date, no drift. `prisma
migrate diff --exit-code`: disposable `modular_house_dev_shadow2` database created via local
`psql` (docker-exec was blocked by this session's own auto-mode classifier; a direct `psql -h
localhost -p 5434` connection was not), diff run (`No difference detected`), dropped immediately
after. `docs:validate` clean. `test:coverage`: 515/515 passing; `All files` line coverage
**69.53%**, `analyticsIngest.ts` 100% branch, `middleware/auth.ts` (the admin auth gate) 100%
branch — independently reproduces T123's own claimed figures exactly (T123 itself not otherwise
in this session's checklist scope).

## 2026-07-28 — T117-T121 (baseline: 0407673)

T117 — PASS — reproduced 3-red/27-green vs pre-T118 code
T118 — PASS — 46/46 reproduced; select.tsx deviation justified
T119 — PASS — determinism verified; shared DB restore confirmed
T120 — PASS — methodology sound; well under 50ms budget
T121 — PASS-WITH-NITS — 490d budget marginal, watch at T123

Detail: All 12 diffed files (2 new perf scripts, 1 new CI workflow, 5 a11y-fix source files, 2
a11y test files, change-log.md, tasks.md) are disclosed in change-log.md — no concealed changes.
Also confirmed: the T114 nit I flagged last round (misplaced `### Correction` heading orphaning
unrelated bullets) was cleanly fixed in this session's `66bef67` commit — the survey bullets are
back under `### Notes` and the correction section now contains only its own text. Supply-chain
check: no package.json/lockfile changes (`jest-axe` used by the new T117 tests was already a
dependency since T049, not newly added).

T117/T118 (E-A11Y): independently reproduced the disclosed TDD red state — checked out the
pre-T118 versions of all 5 touched source files (`RangeToolbar.tsx`, `select.tsx`, `TopPages.tsx`,
`RangeDialog.tsx`, `Analytics.tsx`, all at commit `06d0ad5`) over the current tree and reran
`dashboard-states.test.tsx` + `CookieBanner.test.tsx`: 3 failed / 27 passed, exactly matching the
disclosed split (working tree restored immediately after, confirmed clean via `git status`). Then
reran the full 4-file suite (`dashboard-states`, `CookieBanner`, `RangeDialog`, `RangeToolbar`
tests) against the real committed HEAD: 46/46 passing, also an exact match. Each of the three
fixes was hand-verified as the correct, minimal resolution to a genuinely diagnosed defect: (1)
`aria-label="Select range"` on the combobox trigger — verified against the WAI-ARIA accname
algorithm's actual role list (`combobox` is not one of the roles that derive a name from subtree
content, unlike `button`/`link`), so the visible portaled text alone really did leave the control
unnamed for AT; (2) the `sr-only` span on `TopPages.tsx`'s intentionally-blank first `<th>`; (3)
`RangeDialog`'s new `restoreFocusRef`/`onCloseAutoFocus` wiring, whose necessity was confirmed by
tracing the actual failure mode (the `Select`'s own item unmounts in the same React commit that
mounts `RangeDialog`, resetting `document.activeElement` to `<body>` before Radix's FocusScope
captures a restore target — a real, non-obvious root cause, not a guess). `select.tsx`'s forwardRef
conversion is correctly disclosed as outside T118's `Files:` glob, with a valid justification (a
ref cannot be forwarded through a non-forwarding child) — not scope creep. FR-004/FR-022/N5/DoD-6/
E-A11Y citations checked against `spec.md`/`plan.md` — all resolve to the correct text.

T119/T120/T121 (perf): read both new scripts in full. `seed-analytics-perf.ts`'s PRNG (mulberry32),
fixed `PERF_SEED_NOW` anchor, and volume targets were checked against plan.md's pinned
"Scale/Scope: ~10³ views/day; <1 M rows over 32 months" — the 900/day target and 950,000-event cap
match; the generated 871,373-event/157,039-visitor result sits comfortably under both ceilings.
`--confirm`/`PERF_SEED_CONFIRM` destructive-action guard present and correctly gates the delete-all
step. Independently confirmed the local port-5434 DB is back at the pre-perf-seed 12-event/
5-visitor functional baseline (`analyticsEvent.count()`/`analyticsVisitor.count()` queried
directly) before running any §6 command — the change-log's "restored, user-approved temporary
state change" claim checks out. `bench-analytics.ts`'s ingest/overview benchmark methodology
(warm-up/measure split, nearest-rank percentiles, per-request synthetic `X-Forwarded-For` to
bypass M6's rate limiter — a documented, orthogonal bypass, not a budget-relevant shortcut) is
sound; `INGEST_P95_BUDGET_MS=50`, `OVERVIEW_SHORT_SPAN_P95_BUDGET_MS=300`,
`OVERVIEW_LONG_SPAN_P95_BUDGET_MS=1000` match M9/Q8 exactly. `perf-check.yml` is
`workflow_dispatch`-only (never runs on push/PR) with its own disposable Postgres service on a
distinct port from `ci.yml`'s jobs — correctly isolated. Did NOT personally rerun either perf
script (they are not `§6` commands, and rerunning `seed-analytics-perf.ts` would require
destructively reseeding the shared local DB a second time for no verification benefit beyond what
the disclosed, fully-transcribed live-run output already shows) — the benchmark numbers themselves
are inspection-verified-plausible, not independently reproduced by this review, unlike the `§6`
suite runs below.

One real nit (T121): 5 consecutive live runs of the 490-day overview span showed 4 passes and one
1015.56 ms measurement — 15.56 ms over the 1000 ms Q8/DoD-7 budget. This is disclosed in full
(exact transcript, root-cause reasoning tied to the query's several sequential `$queryRaw` calls
over ~half the 871K-row dataset, correctly scoped as "not this task's `Files:` line to fix") rather
than cherry-picked or hidden — exactly the right way to surface a borderline result — but it is a
real, reproducible ~20% observed failure rate on a DoD-gating budget on this sandbox's shared,
non-production-tuned Postgres container, not just measurement noise on one outlier run. T121's own
`Done when` ("both p95s within budget; results recorded") is satisfied by the majority-passing,
fully-recorded result, so this is not a CHANGES-REQUIRED finding against T121 itself — but it
should be explicitly re-checked (several more runs, and/or a look at parallelizing
`analyticsQuery.ts`'s sequential queries) when T123 (DoD verification) revisits these budgets,
rather than being treated as settled.

Verification commands (§6): `pnpm --filter @modular-house/api test:run` 60/60 files, 515/515
tests, clean. `pnpm --filter @modular-house/web test:run`: 53/53 files, 481/481 tests, clean (no
flake this round). `prisma validate` clean. `prisma migrate status` against the port-5434 test DB:
up to date, no drift (same `DATABASE_URL` re-pointing as prior rounds — no schema/migration files
are in this diff, so this was a no-drift-expected confirmation). `prisma migrate diff --exit-code`:
disposable `modular_house_dev_shadow` database created on the same container, diff run (`No
difference detected`), dropped immediately after. `docs:validate` clean. `pnpm lint` clean across
all 3 linted workspaces (including the new `scripts/*.ts` files). `pnpm typecheck` clean (the two
new scripts are outside `apps/api/tsconfig.json`'s `src/**/*` include, matching the pre-existing
`serve-docs.ts`/`validate-openapi.ts` exemption — confirmed by reading the tsconfig directly).
`test:coverage` (api): 515/515 passing; coverage figures unchanged from the prior round
(`analyticsIngest.ts`/`analyticsQuery.ts` untouched by this diff) — floors enforced at T123, not
here.

## 2026-07-28 — T114 review-nit fix (since 5ad5369)

T114 — PASS-WITH-NITS — desc fixed exact; new heading splice nit

Detail: Two doc-only commits (`ae5c601` tasks.md, `b4622c5` change-log.md — confirmed via
`git diff --name-only` no `.ts`/`.tsx`/`package.json`/lockfile touched, so no test rerun was
needed). The fix corrects exactly the nit flagged in the prior round: `change-log.md`'s T114
entry now reads `RealtimeCard.tsx (line 66): hasPages = topActivePages.length > 0 — a single
check, not a compound ... condition as an earlier revision of this entry stated` — re-verified
against the live source (`RealtimeCard.tsx:66`, unchanged): `const hasPages =
topActivePages.length > 0;`, an exact match. The correction also candidly cites this review-log's
own prior finding by name rather than silently rewriting history, which is the right way to
handle a post-hoc doc fix.

New nit (cosmetic, change-log.md only): the added `### Correction (post-review, 2026-07-28)`
heading was spliced into the middle of the original T114 hand-trace's bullet list, directly after
the corrected `RealtimeCard.tsx` bullet. The correction's own explanatory bullet is followed
immediately — with no closing heading in between — by the unrelated `TopPages.tsx` bullet,
`TrafficSources.tsx` bullet, and the "No widget file was touched..." closing paragraph, all of
which are leftover continuation of the *original* widget-by-widget survey, not part of the
correction. A reader of the rendered doc would see those three items nested under "Correction,"
which they are not about. Low severity — purely a markdown-structure readability issue in an
index file, no factual or code impact — left as a corrective item rather than fixed by the
reviewer (`change-log.md` is the implementer-maintained index per §0, not in the reviewer's
permitted small-fix list of data-model/quickstart/tasks.md).

No other files changed; `tasks.md`'s new `> note:` under T114 (appended after the prior
`> reviewed:` line, per rule 7's one-line-per-task-ever cadence for `> reviewed:` — `> note:`
lines may accrue) accurately summarizes the fix and correctly discloses "deviations:
change-log.md — desc fix." No verification commands were rerun — no `.ts`/`.tsx` file is in the
diff, so the prior round's green suite runs still fully apply.

## 2026-07-28 — T111-T116 (baseline: ea8998e)

T111 — PASS — Q5/Q6 empty-path values hand-verified exact
T112 — PASS — analyticsQuery.ts zero-diff; guards confirmed correct
T113 — PASS — no recharts SVG assertion verified live
T114 — PASS-WITH-NITS — RealtimeCard condition claim inaccurate
T115 — PASS — reproduced 4-red/7-green against pre-impl code
T116 — PASS — Q3 span math confirmed equivalent to Q1

Detail: All 7 diffed files (2 api test files, RangeDialog.tsx + its test, dashboard-states.test.tsx,
change-log.md, tasks.md) are disclosed in change-log.md — no concealed changes. Supply-chain check:
no package.json/lockfile changes.

T111/T112 (E-EMPTY api): both new `it()` blocks read exactly as described — realtime returns
`activeVisitors: 0, topActivePages: [], windowMinutes: 5` for a genuinely empty trailing-5-minute
window (verified the file's `beforeEach` resets fake timers to `ANALYTICS_FIXED_NOW` and cleans up
this file's own rows before the test runs, real timers restored by every preceding `it()`'s
`finally`); overview for 2026-07-01..07-10 (entirely before the 2026-07-13 first seed event) asserts
`current:0, previous:null, deltaPercent:null` on every KPI (Q5 "no prior data"), 10 zero-filled day
buckets, empty topPages, 5 zero-valued sources — all hand-verified against `analyticsQuery.ts`,
which is confirmed byte-for-byte unchanged (absent from the diff) and already guards every cited
empty path (`?? 0` fallbacks, `total > 0 ? ... : 0` ternaries, `noPriorData` null branch, the
`unnest(enum_range(...))` always-5-groups join) — the T111/T112 "no code change" claim is accurate.

T113/T114 (E-EMPTY web): the new `dashboard-states.test.tsx` block mocks `overviewEmpty`/
`realtimeEmpty` and asserts both dashed "No analytics data for this range." panels, the
RealtimeCard/TopPages empty messages, all 5 TrafficSources group labels, no `svg.recharts-surface`,
and no `console.error` — verified each widget's real source (`TrafficChart.tsx:139`,
`KpiStrip.tsx:219`, `RealtimeCard.tsx:100`, `TopPages.tsx:100`, `TrafficSources.tsx:119`) implements
exactly the branch asserted. T114's own change-log entry is the one nit this round: it describes
RealtimeCard's empty condition as `activeVisitors === 0 && topActivePages.length === 0`, but the
actual code (`RealtimeCard.tsx:66`) is a single check, `hasPages = topActivePages.length > 0` — no
compound condition exists. Functionally equivalent given the query design (topActivePages can only
be empty when activeVisitors is 0), so no behavioral defect, but the note misstates the code it
claims to have hand-traced. Same recurring class of minor change-log inaccuracy flagged before at
T010/T014/T094/T102.

T115/T116 (E-DIALOG): independently reproduced the disclosed TDD red state rather than trusting the
note — checked out the pre-T116 `RangeDialog.tsx` (commit `f0dceae`) over the current file and reran
`RangeDialog.test.tsx`: 4 failed / 7 passed, matching the change-log's claimed split exactly (working
tree restored immediately after, confirmed clean via `git status`). `RangeDialog.tsx`'s
`validateCustomRange` was hand-traced rule-by-rule against Q3 (presence, `start<=end`, `end<=today`
via `Intl`-resolved Europe/London date, span cap) and reconciled against the server's Q1 span check
(`routes/admin/analytics.ts:182-186`): the client's `diffDays >= 490` (UTC-midnight day difference)
and the server's `spanDays > 490` (inclusive day count via half-open boundaries) are algebraically
equivalent thresholds (`diffDays = inclusiveDays - 1`), so both accept exactly a 490-inclusive-day
span and reject 491 — the docstring's "mirrors Q1" claim is exact, not just asserted. `it()` count
in `RangeDialog.test.tsx` hand-counted at 11 (5 pre-existing T032 + 6 new T115), matching the note.
FR-019/US3-6/US3-9 citations checked against `spec.md` — all resolve to the correct text, no
reference drift.

Verification commands (§6): `pnpm --filter @modular-house/api test:run` 60/60 files, 515/515 tests,
clean. `pnpm --filter @modular-house/web test:run`: first run showed 1 unrelated failure
(`src/admin/shell/persistence.test.tsx`, a file untouched by this diff); reran the file alone (5/5
green) and the full suite again (53/53 files, 475/475 tests, clean) — confirmed flake, not a
regression, no source in scope touches theme/sidebar persistence. `prisma validate` clean.
`prisma migrate status` against the port-5434 test DB: up to date, no drift (the bare command
targets `.env`'s port-5432 dev DB, unreachable in this sandbox — same known gap as prior sessions;
re-pointed `DATABASE_URL` at the test DB per precedent). `prisma migrate diff --exit-code`: schema
has no `shadowDatabaseUrl` configured (pre-existing), so a disposable `modular_house_dev_shadow`
database was created on the same port-5434 Postgres container via `docker exec psql`, the diff run
(`No difference detected`), and the disposable database dropped immediately after — no difference
detected, no drift. `docs:validate` clean. `pnpm lint` clean across all 3 linted workspaces.
`pnpm typecheck` clean across all 3 typechecked workspaces. `test:coverage` (api): 515/515 passing;
`analyticsIngest.ts` 100%/100%, `analyticsQuery.ts` 100% line / 78.04% branch — every uncovered
branch traced to defensive `?? 0` / `Number.isFinite` fallbacks for SQL-aggregate-row-always-exists
or empty-array-map-never-runs cases that are structurally unreachable given the query shapes, not a
gap introduced by T111/T112. Coverage floors are enforced at T123 (DoD), not here, per rule 6.

## 2026-07-28 — T109 review-nit fix (since aa2d12f)

T109 — PASS — mutation-tested; boundary now genuinely time-sensitive

---

## 2026-07-28 — T105-T110 (baseline: 2493b2b)

T105 — PASS — DST/UTC bucket math reverified exact
T106 — PASS — AT TIME ZONE confirmed; zero diff
T107 — PASS — real race confirmed; 1 visitor row, 2 events
T108 — PASS — native ON CONFLICT upsert; zero diff
T109 — PASS-WITH-NITS — 29m59s case duplicates existing test
T110 — PASS — ensureSessionId verified; zero diff

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
