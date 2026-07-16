# The Change Log of Branch 013-panel-phase-2
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
> ---

## [2026-07-16T09:32:53.060+01:00] — feat(admin-ui): T011 port select primitive (select.tsx, select.test.tsx)

### Added
- `apps/web/src/admin/ui/select.tsx` — Radix Select primitive ported from the template
  `src/components/ui/select.tsx` (ui-components.md §1/§3, FR-022), applying compatibility
  rules 1–10:
  - `"use client"` stripped (rule 1); `radix-ui` umbrella import rewritten to the pinned
    `@radix-ui/react-select` namespace import (rules 2/3, 7); `cn` from `../lib/cn.js`
    (rule 2); no `next/*` present (rule 3).
  - `lucide-react` icons (`ChevronDownIcon`, `ChevronUpIcon`, `CheckIcon`) replaced by
    inline-SVG components (rule 4) — no `lucide-react` dependency added.
  - Full subcomponent set ported: `Select` (root), `SelectGroup`, `SelectValue`,
    `SelectTrigger` (sm/default `data-size`), `SelectContent` (item-aligned/popper
    `data-align-trigger`), `SelectLabel`, `SelectItem` (check indicator), `SelectSeparator`,
    `SelectScrollUpButton`, `SelectScrollDownButton`.
  - `data-slot`/`data-size`/`data-variant` attributes and Tailwind token classes preserved
    verbatim (rules 5/6), split across multi-line `cn(...)` calls for readability with every
    token retained.
  - Export order matches the template. JSDoc documents each subcomponent and the port
    adaptations.

### Changed (test-contract correction discovered during the port)
- `apps/web/src/admin/ui/select.test.tsx` — two corrections to the T010 suite so it passes
  against a faithful port (the port itself is unchanged from the template):
  - **Dropped the "root `data-slot='select'`" DOM assertion.** Radix `Select.Root` is a
    non-DOM context provider, so the template's `data-slot="select"` attribute never enters
    the DOM. The port preserves the attribute in code verbatim (rule 5); the remaining seven
    DOM-realisable `data-slot` assertions (trigger, value, content, item, group, label,
    separator) still cover the contract. A comment records why.
  - **Made the ArrowDown-navigation and keyboard-selection tests `async` with `await
    waitFor`.** Radix Select's content keydown moves highlight inside a
    `setTimeout(() => focusFirst(...))` (confirmed in the installed
    `@radix-ui/react-select` source), so the focus shift is a deferred macrotask in jsdom.
    Enter/selection is dispatched on the focused item (Radix requires
    `event.target === currentTarget`). The suite went from 7/10 to 9/9 passing.

### Notes
- "Done when" met: T010 suite green (9 passing); `eslint` clean on both files;
  `tsc --noEmit` reports 0 errors (the prior `TS2307` for `./select.js` is resolved); no
  `lucide-react`/`next/*` imports in `select.tsx` (verified — only JSDoc mentions remain).
- This is the green half of the T010/T011 atomic unit. The test correction is recorded as a
  T011 deviation (the T011 task text lists only `select.tsx`); the change keeps the port
  faithful to the template rather than hacking the impl to satisfy an impossible DOM
  assertion. Per-file block for `select.test.tsx` carries the overlap WARNING against T010.
- Select is "Used by RangeToolbar" (ui-components.md §3); the exact Q2 option set is pinned
  by the toolbar suite T030, not here.

---

## [2026-07-16T09:24:26.694+01:00] — test(admin-ui): T010 select render/keyboard contract (select.test.tsx)

### Added
- `apps/web/src/admin/ui/select.test.tsx` — render/keyboard contract suite for the
  ported Radix Select primitive (10 tests), authored test-first against the template
  source `src/components/ui/select.tsx` (ui-components.md §3/§6, plan §4.3 ADD):
  - **Closed-state data-slots** — root `select`, trigger `select-trigger` with
    `data-size` (`default`/`sm`) and `aria-expanded`, value `select-value`.
  - **Visible focus (constitution V / H4)** — trigger is keyboard-focusable
    (`tabIndex >= 0`, `document.activeElement` lands on it) and carries the
    `focus-visible:ring-3` + `focus-visible:ring-ring/50` token classes verbatim.
  - **Keyboard open** — ArrowDown on the focused trigger flips `aria-expanded` to
    `true` and mounts the `role="listbox"`.
  - **Open-state data-slots** — `select-content`, `select-group`, `select-label`,
    `select-separator`, and one `select-item` per fixture option.
  - **Arrow navigation** — ArrowDown moves highlight from the first option (Apple)
    to the second (Banana), verified via `document.activeElement` textContent.
  - **Keyboard selection** — Enter on the highlighted option fires
    `onValueChange('banana')` and the trigger then reflects "Banana".
  - **Esc closes** — Escape collapses the listbox (`aria-expanded="false"`, listbox
    unmounts).
  - Uses keyboard-only interaction (no pointer events) plus local `hasPointerCapture`/
    `scrollIntoView` jsdom polyfills in `beforeAll`, so Radix portal keyboard behaviour
    resolves deterministically (the pointer-event unreliability noted in
    `shell/keyboard.test.tsx` is avoided).
  - Fixture options are value-agnostic (`FRUITS`) — the primitive is verified in
    isolation; the exact Q2 range-preset option set is pinned by the toolbar suite T030.

### Notes
- "Done when" met: the suite runs and fails only because `ui/select.tsx` does not
  exist — `Error: Failed to resolve import "./select.js"` (vite import-analysis),
  confirmed by `pnpm --filter @modular-house/web test:run -- src/admin/ui/select.test.tsx`.
- `eslint` on the file is clean (0 warnings). `tsc --noEmit` reports exactly one error
  — `TS2307: Cannot find module './select.js'` in this test file — which is the expected
  red state the implementation task T011 resolves; no other typecheck regressions.
- This is the red half of the T010/T011 atomic unit; the suite is expected to stay red
  until T011 ports `select.tsx` (green-checkpoint rule, execution rule 4).

---

## [2026-07-16T09:17:21.455+01:00] — docs(specs): T009 verify UI component inventory (ui-components.md)

### Added
- `specs/013-panel-phase-2/ui-components.md` — "Inventory verification log" section (§7)
  recording the T009 re-verification: every §3 primitive (`select`, `tabs`, `dialog`,
  `chart`, `badge`) and §4/§5 composition (`analytics/page.tsx`, `analytics-kpi-strip`,
  `analytics-toolbar`, `traffic-quality`, `realtime-visitors`, `top-pages`,
  `top-traffic-sources`, `RangeDialog`) was confirmed to exist at its documented template
  source path under `E:\Zhaoxiang_Qiu\work\SDeal\next_shadcn_admin_dashboard` and to match
  its inventory row. Every Pass 1 task (T010–T036) maps to exactly one inventory row; no
  new components or adaptations were required beyond those already recorded in §3–§5, so
  no extensions were added (Open-Closed: a component not in the inventory is not built).

### Notes
- T009 is a verification/gate task (no test, no implementation code). "Done when" met:
  every Pass 1 task below T009 maps to an inventory row and all cited template sources
  resolve at their documented paths.
- No source code touched; per-file lint/typecheck not applicable. The §9 pre-handoff suite
  is a session gate, not a per-task gate.

---

## [2026-07-15T15:37:53.830+01:00] — fix(specs): review corrections for T001–T008 (change-log.md, analyticsFixtures.test.ts, tasks.md)

### Added
- `apps/api/tests/integration/analyticsFixtures.test.ts` — permanent round-trip verification suite
  for the T005 analytics fixture helpers (9 tests). Exercises every exported builder
  (`createAnalyticsClock`, `analyticsCookieHeader`, `insertAnalyticsEvent`,
  `upsertAnalyticsVisitor`, `resetAnalyticsTables`) against the test DB, proving the "Done when"
  assertion that was originally verified with a temporary file and then deleted (T005 NIT fix).
  Tests cover: deterministic clock epoch + advance, cookie header format (K1 names), visitor
  upsert (insert on new, update lastSeenAt on conflict), event insert with all fields, default
  values (DIRECT source, "/" path), round-trip query retrieval, and reset helper cleanup.

### Changed (review corrections)
- `change-log.md` — three corrections addressing review findings (review-log.md 2026-07-15):
  - **T001 NIT** (lockfile stat inaccurate): the T001 entry claimed "16 packages added, 1 removed"
    as if it were the final committed state; corrected to note that the stat was from T001's
    install run only, and the committed lockfile also incorporates T002's `isbot` resolution.
  - **T003 CHANGES-REQUIRED** (undocumented .gitignore change): added a "Changed (review
    correction)" subsection to the T003 entry documenting commit `235a066` which added
    `specs/013-panel-phase-2/pending-commits.md` to `.gitignore`. The change was made in the
    T001–T003 commit window but was not logged at the time.
  - **T004 NIT** (dev-DB apply still pending): updated the "Dev DB not applied" note to
    "Dev DB applied (review correction)" — the `modular_house` database and
    `modular_house_app_user` were created inside the `modular-house-postgres` container, and
    all 8 migrations (including `add_analytics_events`) were applied via
    `prisma migrate deploy`. `prisma migrate status` reports no drift on both databases.
- `tasks.md` — updated `> reviewed:` lines for T001, T003, T004, T005 to reflect resolved
  findings; updated T005 note to reference the permanent test file (9 passing tests); updated
  T007 reviewed line to note the CI nit is non-blocking (requires push).

### Notes
- T007 NIT ("no observed CI run yet") remains non-blocking — confirming a CI run requires pushing
  to the branch, which is the human's responsibility. The CI configuration is correct (NODE_ENV=test
  on the seed step triggers analytics fixtures before the test step).
- T002, T006, T008 were PASS in the original review — no corrections needed.
- The dev DB (`modular_house` on port 5432) was created inside the existing Docker container
  (`modular-house-postgres`, which maps host 5434 → container 5432). It is now reachable via
  `postgresql://modular_house_app_user:…@localhost:5434/modular_house` (note: port 5434, not
  5432, since that is the container's exposed port).

---

## [2026-07-15T14:49:38.337+01:00] — feat(admin-web): T008 analytics fixture-data module (fixtures.ts)

### Added
- `apps/web/src/admin/analytics/fixtures.ts` — typed fixture payloads mirroring
  `contracts/analytics.openapi.yaml`, consumed exclusively by Pass 1 widgets and web tests
  (no live API calls, no data wiring — plan §5.3, research R12):
  - **Types**: `SourceGroup`, `BucketGranularity`, `KpiValue`, `AnalyticsRange`,
    `TimeseriesBucket`, `TopPageEntry`, `SourceEntry`, `OverviewKpis`, `OverviewResponse`,
    `RealtimePageEntry`, `RealtimeResponse` — all matching the contract schemas field-for-field.
  - **`overviewPopulated`** — all five KPIs with numeric `previous` + numeric `deltaPercent`
    (Q5 variant 1: normal period-over-period delta). Day buckets, 5 top pages, 5 source groups.
  - **`overviewNoPriorData`** — every KPI has `previous: null` + `deltaPercent: null`
    (Q5 variant 2: "no prior data" — comparison window ends before first stored event).
  - **`overviewZeroPrevious`** — every KPI has `previous: 0` + `deltaPercent: null`
    (Q5 variant 3: measured-but-zero prior, delta not computable, rendered "—").
  - **`overviewEmpty`** — all-zero KPIs, empty timeseries/topPages, five zero-valued source
    groups (Q6: zero-valued groups always shown). Empty-state fixture (US3-9 / E-EMPTY).
  - **`overviewHourly`** — hour-bucket timeseries (Q4: hour when span <= 2 days) with ISO-8601
    datetime `from`/`to` (Q1: sub-day ranges use UTC datetime form). KPIs include a negative
    delta to exercise the down-arrow rendering path.
  - **`realtimePopulated`** — 7 active visitors + top-4 active pages, `windowMinutes: 5` (V5).
  - **`realtimeEmpty`** — 0 visitors, empty pages, `windowMinutes: 5` (E-EMPTY).
  - Helper `emptySources()` builds the five source groups with zero values so Q6's
    "zero-valued groups shown" invariant is structural.

### Notes
- "Done when" verified: `pnpm --filter @modular-house/web typecheck` exits 0 (types mirror the
  contract); `pnpm --filter @modular-house/web lint` exits 0.
- No `any` used — all types are explicit interfaces. `SourceGroup` is a union of the five
  lowercase strings matching the contract enum.
- The three Q5 KpiValue variants are in separate fixtures so widget tests can assert each
  rendering path independently (numeric delta, "no prior data", "—").
- No data wiring — the module exports static constant objects only.

---

## [2026-07-15T14:44:59.908+01:00] — ci(api): T007 document analytics fixture seeding in CI (ci.yml)

### Changed
- `.github/workflows/ci.yml` — added documentation comments to the `Seed test database` steps in
  both the `test-api` and `coverage-check` jobs, making explicit that `NODE_ENV=test` triggers the
  analytics fixtures added in T006 (`seed.ts`'s `seedAnalyticsFixtures` function, gated on
  `config.app.nodeEnv === 'test'`). The CI already ran `pnpm db:seed` with `NODE_ENV: test` before
  the test step — no behavioural change, only self-documenting comments.

### Notes
- The CI seed pipeline was already correctly configured before this task:
  1. `test-api` job: `Run Prisma migrations` (creates analytics tables) → `Seed test database`
     (NODE_ENV=test, seeds analytics fixtures) → `Run API tests with coverage` (suites find rows).
  2. `coverage-check` job: same migrate → seed → enforce flow.
- T006's `seed.ts` gate (`if (config.app.nodeEnv === 'test')`) was committed in `e6d4ef3`; this
  task only documents the CI side. No changes to `seed.ts` were needed.
- "Done when" (CI run executes the seed before the test step) is satisfied by configuration: the
  `NODE_ENV: test` env var on the seed step triggers the analytics fixtures, and the step runs
  before `pnpm test:coverage`. A push to the branch will confirm in CI logs.

---

## [2026-07-15T14:06:20.917+01:00] — feat(api): T006 seed analytics fixtures for test DB (seed.ts)

### Added
- `apps/api/prisma/seed.ts` — deterministic analytics fixture rows seeded only when
  `NODE_ENV === 'test'` (DoD-8), so the production / development seed path is unchanged:
  - **5 visitors**: A (firstSeen 2026-07-13, returning), B (firstSeen 2026-07-15, new),
    C (firstSeen 2026-07-14, returning), D (firstSeen 2026-07-15, new),
    E (firstSeen 2026-07-12, returning).
  - **12 events** across three Europe/London calendar days (2026-07-13, 14, 15), covering
    all five source groups via session-first-event attribution (S4): SEARCH (session A),
    SOCIAL (session E), DIRECT (session C), CAMPAIGN (session B, utm-tagged), REFERRAL
    (session D).
  - 5 unique sessions, 5 unique paths (`/`, `/garden-room`, `/house-extension`, `/about`,
    `/contact`).
  - Visitor/session UUIDs match `tests/helpers/analyticsFixtures.ts` for cross-reference.
- Gating: `if (config.app.nodeEnv === 'test') { await seedAnalyticsFixtures(); }` in
  `main()` — logs "Skipping analytics fixtures (not a test database)" otherwise.
- Idempotency: `deleteMany()` on both analytics tables before re-inserting, so re-runs
  produce the same deterministic state.

### Notes
- Verified: `pnpm --filter @modular-house/api db:seed` with `NODE_ENV=test` +
  `DATABASE_URL=postgresql://postgres:postgres@localhost:5434/modular_house_dev` populates
  5 visitors + 12 events on the test DB (confirmed via psql: all 5 source groups present).
- Verified: `NODE_ENV=development` logs "Skipping analytics fixtures" and leaves existing
  analytics rows untouched (row counts unchanged at 5/12).
- Lint + typecheck pass on the modified file.
- No `Date.now()` — all fixture timestamps are hardcoded UTC dates.

---

## [2026-07-15T14:02:11.256+01:00] — test(api): T005 analytics fixture + injected-clock helpers (analyticsFixtures.ts)

### Added
- `apps/api/tests/helpers/analyticsFixtures.ts` — deterministic, clock-driven test helpers for the
  Phase 2 analytics suites:
  - `ANALYTICS_FIXED_NOW` (`2026-07-15T12:00:00.000Z`) — the shared fixed epoch (BST period for
    DST edge-case testability); all fixture timestamps derive from the injected clock, never
    `Date.now()` (constitution III).
  - `FIXED_VISITOR_IDS` / `FIXED_SESSION_IDS` — five deterministic v4 UUIDs each, so test
    assertions can compare exact values without runtime-generated random IDs.
  - `createAnalyticsClock(initial?)` — wraps the Phase 1 `createClock` from `clock.ts`, starting
    at `ANALYTICS_FIXED_NOW` by default; returns the same `AdvanceableClock` interface (`now`,
    `advance`, `setNow`) the Phase 1 suites already use.
  - `analyticsCookieHeader(visitorId, sessionId)` — formats a `Cookie` header string
    (`mh_vid=<uuid>; mh_sid=<uuid>`) for supertest requests (K1 cookie names).
  - `insertAnalyticsEvent(prisma, options)` — inserts a single `AnalyticsEvent` row with
    caller-supplied `occurredAt` (server clock), `path`, `visitorId`, `sessionId`, `sourceGroup`,
    `referrerHost`, `utmSource/Medium/Campaign`; returns the persisted row.
  - `upsertAnalyticsVisitor(prisma, options)` — upserts an `AnalyticsVisitor` (insert
    `{firstSeenAt, lastSeenAt}` on new, update `lastSeenAt` on conflict — mirroring the ingest
    write pattern, data-model §3 / E-CONCURRENCY).
  - `resetAnalyticsTables(prisma)` — deletes all `analytics_events` + `analytics_visitors` rows
    for clean test state.

### Notes
- "Done when" verified: the module typechecks (`pnpm --filter @modular-house/api typecheck` exit 0)
  and a sample fixture insert round-trips against the port-5434 test DB (a temporary 2-test
  vitest file inserted an event + visitor, queried them back, and confirmed field values matched;
  the temp file was deleted after verification — only the helper module is committed).
- Lint + typecheck pass on the touched file.
- No `Date.now()` anywhere in the module; all timestamps are caller-supplied from the injected clock.

---

## [2026-07-15T13:59:16.235+01:00] — feat(api): T004 add_analytics_events migration (migration.sql)

### Added
- `apps/api/prisma/migrations/20260715135820_add_analytics_events/migration.sql` — additive forward
  migration creating exactly:
  - enum `AnalyticsSourceGroup` (values: `direct`, `search`, `social`, `referral`, `campaign`);
  - table `analytics_events` (`id BIGSERIAL`, `occurred_at TIMESTAMPTZ(6)`, `path VARCHAR(512)`,
    `visitor_id UUID`, `session_id UUID`, `source_group AnalyticsSourceGroup`, `referrer_host
    VARCHAR(255)?`, `utm_source/medium/campaign VARCHAR(100)?`, `created_at TIMESTAMPTZ(6) default
    CURRENT_TIMESTAMP`, primary key `id`);
  - table `analytics_visitors` (`visitor_id UUID` PK, `first_seen_at TIMESTAMPTZ(6)`,
    `last_seen_at TIMESTAMPTZ(6)`);
  - three indexes: `analytics_events_occurred_at_idx`, `analytics_events_visitor_id_occurred_at_idx`,
    `analytics_events_session_id_occurred_at_idx`.
- No existing table, column, or row touched (additive only, plan §3 / data-model.md §5).
- Rollback documented in the migration SQL header: drop `analytics_events`,
  `analytics_visitors`, then enum `AnalyticsSourceGroup`.

### Notes
- Migration SQL generated via `prisma migrate diff --from-schema-datasource --to-schema-datamodel`
  (the test DB on port 5434 already had all 7 Phase 1 migrations applied; the diff between that
  state and the current schema.prisma — which T003 extended with the analytics models — produced
  exactly the enum + two tables + three indexes). `prisma migrate dev` could not be used directly
  because it requires an interactive TTY, which this environment does not provide.
- Applied to the test DB (port 5434) via `prisma migrate deploy`; `prisma migrate status` reports
  "Database schema is up to date!" with 8 migrations — no drift.
- **Dev DB applied (review correction — T004 NIT, first attempt, INCORRECT):** a database named
  `modular_house` was created inside the `modular-house-postgres` Docker container (reachable via
  `postgresql://modular_house_app_user:…@localhost:5434/modular_house`) and migrated. This was a
  misdiagnosis: `.env`'s `DATABASE_URL` targets `127.0.0.1:5432`, which is not the Docker test
  container at all — it is reached via an SSH tunnel (`misc_scripts/db_tunnel.ps1`, forwarding to
  remote host `modularpanel`) that was not running. The port-5434 fix migrated an unrelated decoy
  database; the real dev DB (behind the tunnel) still lacked the migration.
- **Dev DB applied (reviewer-verified correction, 2026-07-15T16:xx):** with the SSH tunnel up,
  `prisma migrate status` against the real `.env`-configured dev DB (`127.0.0.1:5432`) confirmed
  `add_analytics_events` was genuinely unapplied there. Ran `prisma migrate deploy` through the
  tunnel; it applied cleanly. `prisma migrate status` now reports "Database schema is up to date!"
  against the real dev DB. This supersedes the incorrect note above — see review-log.md T004.
- `prisma generate` regenerated the client; `pnpm --filter @modular-house/api typecheck` exits 0.

---

## [2026-07-15T13:13:37.735+01:00] — feat(api): T003 add AnalyticsSourceGroup + analytics tables (schema.prisma)

### Added
- `apps/api/prisma/schema.prisma` — appended the `AnalyticsSourceGroup` enum
  (DIRECT/SEARCH/SOCIAL/REFERRAL/CAMPAIGN with lowercase `@map` values) and two new models,
  exactly per data-model.md §1–§3:
  - `AnalyticsEvent` (table `analytics_events`): `id BigInt @id autoincrement`, `occurredAt`
    (`@db.Timestamptz(6)`), `path VarChar(512)`, `visitorId`/`sessionId Uuid`, `sourceGroup`
    enum, `referrerHost VarChar(255)?`, `utmSource`/`utmMedium`/`utmCampaign VarChar(100)?`,
    `createdAt`; indexes `[occurredAt]`, `[visitorId, occurredAt]`, `[sessionId, occurredAt]`.
  - `AnalyticsVisitor` (table `analytics_visitors`): `visitorId Uuid @id`, `firstSeenAt`,
    `lastSeenAt` (both `@db.Timestamptz(6)`).
- No IP / User-Agent / full-referrer-URL / geo / device / user-FK columns (privacy floor
  plan §2.7 R2 / M7, asserted later by T-B8).

### Notes
- `prisma validate` passes; `prisma generate` regenerated the client with the new types and
  `pnpm --filter @modular-house/api typecheck` exits 0 (existing source still compiles).
- `git diff` is purely additive (56 insertions, 0 deletions) — no existing model touched.
- Schema decision: the enum has no `@@map` on its type, matching data-model.md §1 exactly
  (§5 rollback refers to it by its Prisma name `AnalyticsSourceGroup`). This intentionally
  diverges from the existing `GalleryCategory`/`PublishStatus` snake_case `@@map` convention,
  per the binding source (data-model.md); stored enum values are the lowercase `@map` labels.
- No migration applied here (T004 generates `add_analytics_events`); no source consumes the
  new models yet (ingest service arrives in T042).

### Changed (review correction — T003 CHANGES-REQUIRED)
- `.gitignore` — added `specs/013-panel-phase-2/pending-commits.md` (commit `235a066`,
  "change(git): updated gitignore parameters"). This change was made in the T001–T003 commit
  window but was not documented in the change-log at the time — logged here per the
  CHANGES-REQUIRED review finding (review-log.md T003). The entry prevents the untracked
  session-scratch file from appearing in `git status` output.

---

## [2026-07-15T13:05:09.178+01:00] — build(api): T002 pin isbot (apps/api/package.json, pnpm-lock.yaml)

### Added
- `apps/api/package.json` — `isbot` pinned at exact `5.2.1` (no range operator), placed
  alphabetically after `helmet`. No peer dependencies; ESM/CJS dual entry.
- `pnpm-lock.yaml` — updated by `pnpm install` to resolve `isbot@5.2.1`. This file is also staged
  by T001 (2/4); run blocks strictly in order (see pending-commits.md WARNING).

### Notes
- Phase 0 setup task (no test). `isbot` resolves from `apps/api` via
  `require.resolve('isbot', { paths: ['apps/api'] })` and its ESM entry loads: the named export
  `isbot` is a `function` returning `true` for a Googlebot UA and `false` for a Chrome UA.
- **API note for T038/T042:** isbot v5 has **no default export** — import the named function:
  `import { isbot } from 'isbot'` (also exports `isBot`, `createIsbot`, `isbotMatches`, `list`).
- No source imports `isbot` yet (ingest service arrives in T042).

---

## [2026-07-15T12:50:56.350+01:00] — build(web): T001 pin @radix-ui/react-select + @radix-ui/react-tabs (apps/web/package.json, pnpm-lock.yaml)

### Added
- `apps/web/package.json` — `@radix-ui/react-select` pinned at exact `2.3.3` and
  `@radix-ui/react-tabs` pinned at exact `1.1.17` (no range operator), placed alphabetically among
  the existing `@radix-ui/*` dependencies. Both peer-support React 18 (`^18.0`), matching the
  project's React 18.3.1 baseline.
- `pnpm-lock.yaml` — updated by `pnpm install`; the two new packages and their transitive
  dependencies resolved cleanly. The "Packages: +16 -1" line in the T001 install output
  reflects only that install run; the committed lockfile also incorporates T002's `isbot`
  resolution (T002's install ran immediately after and further modified the same file).

### Notes
- Phase 0 setup task (no test). `pnpm install` exits clean; both packages resolve from `apps/web`
  via `require.resolve('@radix-ui/react-select'|'@radix-ui/react-tabs', { paths: ['apps/web'] })`.
- No source imports the new packages yet — the `select`/`tabs` ports arrive in T011/T013.
- No other dependency changes.

---
