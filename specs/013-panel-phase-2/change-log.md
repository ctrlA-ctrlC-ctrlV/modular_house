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
- **Dev DB not applied:** the `.env` `DATABASE_URL` points at port 5432, but no Docker container
  exposes that port (the only Postgres container `modular-house-postgres` maps 5434→5432). The
  migration file is committed and can be applied to the dev DB with `prisma migrate deploy` once
  that database is reachable. This is an environment limitation, not a spec deviation.
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
  dependencies resolved cleanly (16 packages added, 1 removed).

### Notes
- Phase 0 setup task (no test). `pnpm install` exits clean; both packages resolve from `apps/web`
  via `require.resolve('@radix-ui/react-select'|'@radix-ui/react-tabs', { paths: ['apps/web'] })`.
- No source imports the new packages yet — the `select`/`tabs` ports arrive in T011/T013.
- No other dependency changes.

---
