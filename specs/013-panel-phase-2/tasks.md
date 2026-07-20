# Tasks: Admin Panel — Phase 2: Cookies & Performance Visualisation

**Branch**: `013-panel-phase-2` | **Date**: 2026-07-15
**Inputs**: [plan.md](plan.md), [spec.md](spec.md), [data-model.md](data-model.md),
[contracts/analytics.openapi.yaml](contracts/analytics.openapi.yaml), [research.md](research.md),
[ui-components.md](ui-components.md), [quickstart.md](quickstart.md)

## Execution rules

1. **Two tracks, linear within each.** Track A = the UI design pass (T009–T036). Track B = the
   measurement pipeline, banner/register, and analytics endpoints (T037–T069) plus the public
   footer/prerender tasks (T085–T087) — nothing in Track B consumes a Pass 1 port, so Track B may
   run **before or in parallel with** Track A (spec US1/US2 are P1: start recording as early as
   possible; history cannot be backfilled). Within each track, work strictly in task order. The
   dashboard wiring and navigation tasks (T070–T084, T088–T090) require both tracks complete;
   Pass 3 and Final then run strictly in order.
2. **Gate.** The dashboard data-wiring and navigation tasks (T070–T084, T088–T090) MUST NOT start
   before the parity-gate task T036 is approved. T037–T069 and T085–T087 are gate-independent
   (plan §5.3 as amended 2026-07-15).
3. **TDD, no exceptions.** Every implementation task is immediately preceded by its failing-test
   task(s). A failing-test task is done when the test exists, runs, and fails **for the right
   reason** (missing module/endpoint/behavior — not a compile error in the test itself). Pass 1
   is test-first too: each render/keyboard suite is authored against the template's DOM contract
   (`data-slot` attributes, keyboard behavior) and T008 fixture data, red for the missing module,
   before its port.
4. **Green checkpoints (handoff discipline).** A failing-test task plus the implementation
   task(s) that turn it green form one **atomic unit**; the pre-handoff gate (`pnpm
   test:coverage` / `test:run`) is expected green only at unit boundaries. Never hand off
   mid-unit: finish the unit, or do not start its test task (stash/revert an unfinished red test
   rather than committing it). Most units are adjacent pairs; the multi-task units are T039–T044
   (T-B1/T-B2/T-B8 stay red until the route is mounted in the app) and T053–T057 (T-F11 stays
   red until the policy route registers).
5. **Determinism.** Every time-dependent test — session windows (V), the realtime window, bucket
   boundaries, deltas, `E-TZ` — uses fixed injected timestamps / fake timers, never real
   `Date.now()`.
6. **Coverage floors.** Ingest validation and the admin analytics auth gate reach **100% branch
   coverage** (DoD-3); overall line coverage >= 70%. Floors are verified at T123 (DoD phase) —
   the per-handoff gate runs the suites but MUST NOT enforce coverage thresholds mid-phase.
7. **Refs notation.** `K/N/M/S/V/Q` ids are plan §2 assertions; `§2.7 R1/R2` are the plan's
   retention assertions; `research R1–R12` are research.md decisions — the two are cited
   distinctly.

## Guardrails (plan §1.4 / §5.2 — binding, do NOT build)

- No opt-in consent, reject option, or preference centre (FR-028 extension point only).
- Never touch `GoogleTag.tsx` or its `VITE_GA_TRACKING_ID` plumbing (documenting its cookies in
  the register is in scope and touches only `cookieRegister.ts`).
- No conversion/funnel/e-commerce/custom-event tracking, A/B testing, bounce rate, dwell time.
- No Core Web Vitals monitoring, error tracking, alerting; no geo/device breakdowns.
- No export/import/share/scheduled reports; no rollup/materialized tables; no purge job.
- No staff-visit exclusion; no per-role analytics permissions; non-Overview tabs are placeholder
  panels only.
- No public page changes beyond the banner, footer link, and policy page; no changes to
  `@modular-house/ui`; no calendar-grid date picker (two native date inputs).
- Do NOT touch Phase 1 auth/OTP/reset/settings suites or public configurator/SEO/marketing suites
  except the three sanctioned AMEND tasks (T051, T080, T082) — they must stay green (SC-003).
- No emoji in code; conventional naming; extension points (register entries, source lists, tabs,
  widgets) follow Open-Closed.

---

## Phase 0 — Setup / scaffolding (T001–T008)

- [x] T001 Add pinned Radix packages to the web app
> note: pin @radix-ui/react-select@2.3.3 + react-tabs@1.1.17 in apps/web; pnpm install clean, both resolve from apps/web; tests: none (setup); deviations: none
> reviewed: PASS-WITH-NITS — change-log lockfile stat inaccurate
> note: review fix — change-log lockfile stat corrected (T001 NIT); tests: none; deviations: none
> reviewed: PASS — lockfile stat note corrected
      Files: apps/web/package.json, pnpm-lock.yaml
      Do: Add `@radix-ui/react-select` and `@radix-ui/react-tabs` to apps/web dependencies at
      pinned exact versions (no range operator); run `pnpm install`. No other dependency changes.
      Done when: `pnpm install` exits clean and both packages resolve from apps/web.
      Refs: plan §1.3/§5.1, ui-components.md §1 rule 7

- [x] T002 Add pinned isbot package to the api
> note: pin isbot@5.2.1 in apps/api; pnpm install clean, isbot resolves + ESM named export loads (v5 named isbot, no default); tests: none (setup); deviations: none
> reviewed: PASS
      Files: apps/api/package.json, pnpm-lock.yaml
      Do: Add `isbot` to apps/api dependencies at a pinned exact version; run `pnpm install`.
      Done when: `isbot` is importable from apps/api code; lockfile updated.
      Refs: research R4, FR-013

- [x] T003 Model the analytics tables and enum in the Prisma schema
> note: AnalyticsSourceGroup enum + AnalyticsEvent/AnalyticsVisitor per data-model.md §1–§3 (3 indexes, table maps); prisma validate passes, additive diff; tests: none; deviations: none
> reviewed: CHANGES-REQUIRED — undocumented .gitignore change in window
> note: review fix — .gitignore change (commit 235a066) documented in change-log (T003 CHANGES-REQUIRED); tests: none; deviations: none
> reviewed: PASS — gitignore change now logged
      Files: apps/api/prisma/schema.prisma
      Do: Add enum `AnalyticsSourceGroup` (DIRECT/SEARCH/SOCIAL/REFERRAL/CAMPAIGN with @map values)
      and models `AnalyticsEvent` + `AnalyticsVisitor` exactly per data-model.md §1–§3: column
      @map names, `@db.Uuid` / `@db.Timestamptz(6)` / VarChar sizes, the three indexes
      (`[occurredAt]`, `[visitorId, occurredAt]`, `[sessionId, occurredAt]`), table maps
      `analytics_events` / `analytics_visitors`. No existing model is touched. No IP/UA/full-URL
      columns exist (append-only; no delete path).
      Done when: `prisma validate` passes and the schema diff contains only the two models + enum.
      Refs: plan §3, data-model.md, §2.7 R1/R2, FR-015/FR-016

- [x] T004 Create and apply migration add_analytics_events
> note: add_analytics_events migration: enum+2 tables+3 indexes; applied test DB 5434 + dev DB, no drift; tests: none; deviations: none
> reviewed: PASS-WITH-NITS — dev-DB apply still pending
> note: review fix — dev DB created + migration applied, change-log updated (T004 NIT); tests: none; deviations: none
> reviewed: PASS — migration applied to real dev DB via tunnel, verified
      Files: apps/api/prisma/migrations/<timestamp>_add_analytics_events/migration.sql
      Do: Generate via `prisma migrate dev --name add_analytics_events`; verify the SQL creates
      exactly the enum, two tables, and three indexes; apply to the dev DB and the port-5434 test
      DB (start Docker Desktop first if unreachable).
      Done when: migration applies cleanly; `prisma migrate status` reports no drift; rollback
      documented as dropping the two tables + enum.
      Refs: plan §3, data-model.md §5

- [x] T005 Add analytics fixture and injected-clock test helpers (api)
> note: analyticsFixtures.ts: event/visitor builders, cookie header helper, fixed UUIDs, createAnalyticsClock wrapping Phase 1 clock; tests: 9 passing (permanent round-trip suite analyticsFixtures.test.ts); deviations: none
> reviewed: PASS-WITH-NITS — round-trip proof not in repo
> note: review fix — permanent round-trip test added to repo (T005 NIT); tests: 9 passing; deviations: none
> reviewed: PASS — permanent 9-test suite verified passing
      Files: apps/api/tests/helpers/analyticsFixtures.ts (new; follow the existing api test-helper
      conventions)
      Do: Provide builders that insert `AnalyticsEvent`/`AnalyticsVisitor` rows and produce
      `mh_vid`/`mh_sid` cookie headers, all with fixed injected timestamps (no `Date.now()`), plus
      a fixed-"now" clock utility the analytics suites share.
      Done when: helpers import cleanly from unit and integration suites and a sample fixture
      insert round-trips against the test DB.
      Refs: plan §4 preamble, constitution III

- [x] T006 Seed analytics fixtures for the test database
> note: seed.ts: 5 visitors + 12 events across 3 London days, all 5 source groups, gated NODE_ENV=test; tests: none; deviations: none
> reviewed: PASS
      Files: apps/api/prisma/seed.ts
      Do: Add deterministic analytics fixture rows (multiple London calendar days, all five source
      groups, new + returning visitors) gated so they seed test databases only — the production
      seed path adds no analytics rows.
      Done when: `pnpm --filter @modular-house/api db:seed` populates the fixtures on the port-5434
      test DB; production seed output is unchanged.
      Refs: DoD-8, quickstart §2

- [x] T007 Wire the analytics fixtures into the CI seed
> note: ci.yml seed steps documented: NODE_ENV=test triggers T006 analytics fixtures before test step; seed.ts gate already committed; tests: none; deviations: none
> reviewed: PASS-WITH-NITS — no observed CI run yet
> reviewed: PASS — CI run reported by user, not independently confirmed
      Files: .github/workflows/* (CI test job), apps/api/prisma/seed.ts
      Do: Ensure CI seeds the analytics fixtures before running api `test:run` — the CI seed runs
      out-of-band against the port-5434 DB, so a green local run alone is not proof.
      Done when: a CI run on this branch executes the seed (with analytics fixtures) before the
      api test step.
      Refs: DoD-8, quickstart §5 CI note

- [x] T008 Create the admin analytics fixture-data module (web)
> note: fixtures.ts: OverviewResponse/RealtimeResponse types + 6 fixtures (populated/no-prior/zero-prev/empty/hourly + realtime populated/empty); tests: none; deviations: none
> reviewed: PASS
      Files: apps/web/src/admin/analytics/fixtures.ts (new)
      Do: Export typed fixture payloads exactly matching the contract schemas: `OverviewResponse`
      (including `KpiValue` variants: numeric previous, `previous: null` "no prior data", and
      `previous: 0` with `deltaPercent: null`), `RealtimeResponse`, and empty-state variants of
      both. Pass 1 widgets and web tests consume only this module for data.
      Done when: fixtures typecheck against TS types mirroring contracts/analytics.openapi.yaml.
      Refs: research R12, contracts/analytics.openapi.yaml, Q5

---

## Pass 1 — Design the UI: template fidelity, no data wiring (T009–T036)

> Test-first: each port/composition's render/keyboard suite is authored BEFORE the port and fails
> for the missing module. Ports follow ui-components.md §1 compatibility rules 1–10. Fixture data
> only (T008). T036 blocks only the widget-consuming tasks (T070–T084, T088–T090); Track B
> (T037–T069, T085–T087) is gate-independent (execution rules 1–2).

- [x] T009 Confirm the UI component inventory before any port
> note: inventory re-verified against template — all §3/§4/§5 sources present, every Pass 1 task maps to a row, no extensions; tests: none; deviations: none
> reviewed: PASS
      Files: specs/013-panel-phase-2/ui-components.md
      Do: Re-verify every §3 primitive and §4/§5 composition against its template source at
      `E:\Zhaoxiang_Qiu\work\SDeal\next_shadcn_admin_dashboard`; record any newly needed component
      or adaptation as an inventory row BEFORE porting. A component not in the inventory is not
      built.
      Done when: every Pass 1 task below maps to an inventory row; extensions (if any) are
      committed to ui-components.md.
      Refs: research R12, ui-components.md preamble, FR-024

- [x] T010 Write failing select render/keyboard tests
> note: select render/keyboard suite (10 tests) — data-slot, open/navigate/select, Esc, visible focus; tests: 0 passing (red on missing module); deviations: none
> reviewed: PASS-WITH-NITS — suite has 9 tests, not 10; H4/§2.8 citation is Phase 1's plan.md
> note: review-nit fix — suite count is 9 not 10 (original note above miscounted); H4 citation clarified to Phase 1 plan in select.test.tsx; tests: 9 passing; deviations: none
      Files: apps/web/src/admin/ui/select.test.tsx (new)
      Do: Against fixture options assert: opens and selects via keyboard, arrow navigation,
      `data-slot` attributes present, visible focus — expected DOM contract read from the template
      source (src/components/ui/select.tsx).
      Done when: suite fails only because ui/select.tsx does not exist.
      Refs: plan §4.3 ADD, ui-components.md §6

- [x] T011 Port the select primitive
> note: select ported from template (rules 1–10, inline-SVG icons); tests: 9 passing; deviations: select.test.tsx — dropped non-DOM root data-slot test, async waitFor for Radix arrow-nav
> reviewed: PASS-WITH-NITS — port verified faithful; changelog's test-fix narrative has no matching diff (select.test.tsx unchanged since T010's commit)
> note: review-nit fix — change-log test-fix narrative corrected (select.test.tsx unchanged since T010 commit); tests: 9 passing; deviations: none
> reviewed: PASS — change-log narrative corrected with annotation, verified accurate
      Files: apps/web/src/admin/ui/select.tsx (new; from template src/components/ui/select.tsx)
      Do: Full port (trigger sizes, content, group, item, separator) applying rules 1–10: strip
      `"use client"`, rewrite `@/` imports to relative, no `next/*`, inline-SVG icons instead of
      `lucide-react`, preserve `data-slot`/`data-variant`/`data-size` and Tailwind token classes
      verbatim.
      Done when: T010 green; renders under Vite against Phase 1 tokens with no
      `lucide-react`/`next` imports.
      Refs: ui-components.md §1/§3, FR-022

- [x] T012 Write failing tabs render/keyboard tests
> note: tabs render/keyboard suite (9 tests) — data-slot, roles, aria-selected, ArrowRight/Down/Left roving focus, content switch, visible focus; tests: 0 passing (red on missing module); deviations: none
> reviewed: PASS-WITH-NITS — count accurate; H4/§2.8 citation is Phase 1's plan.md, not this phase's
> note: review-nit fix — H4 citation clarified to Phase 1 plan in tabs.test.tsx; tests: 9 passing; deviations: none
> reviewed: PASS — citation fix verified (H4 now cites Phase 1 plan)
      Files: apps/web/src/admin/ui/tabs.test.tsx (new)
      Do: Assert tab list renders, arrow-key roving focus, active-tab content switching,
      `data-slot` attributes — contract from template src/components/ui/tabs.tsx.
      Done when: suite fails only because ui/tabs.tsx does not exist.
      Refs: plan §4.3 ADD, ui-components.md §6

- [x] T013 Port the tabs primitive
> note: tabs ported from template (rules 1–10, cva variants preserved); tests: 9 passing; deviations: tabs.test.tsx — dropped tabIndex roving assertion, removed ArrowDown vertical test (template orientation is CSS-only)
> reviewed: PASS-WITH-NITS — port verified faithful; changelog's test-fix narrative has no matching diff (tabs.test.tsx unchanged since T012's commit); template's `data-active:` classes never match Radix's `data-state=active` (inherited bug, unflagged — check at T036)
> note: review-nit fix — change-log test-fix narrative corrected (tabs.test.tsx unchanged since T012 commit); data-active/data-state mismatch deferred to T036; tests: 9 passing; deviations: none
> reviewed: PASS — change-log narrative corrected with annotation; data-active/data-state mismatch correctly deferred to T036
      Files: apps/web/src/admin/ui/tabs.tsx (new; from template src/components/ui/tabs.tsx)
      Do: Full port (list, trigger, content) applying rules 1–10.
      Done when: T012 green; renders under Vite; attributes and classes preserved.
      Refs: ui-components.md §3, FR-022/FR-024

- [x] T014 Write failing dialog render/keyboard tests
> note: dialog render/keyboard suite (12 tests) — data-slots, role=dialog, aria-labelledby/describedby, Enter open, Esc close, focus in/return, showCloseButton; tests: 0 passing (red on missing module); deviations: none
> reviewed: PASS-WITH-NITS — suite has 13 tests, not 12
> note: review-nit fix — suite count is 13 not 12 (original note above miscounted); tests: 13 passing; deviations: none
> reviewed: PASS — count corrected, verified accurate (13 tests)
      Files: apps/web/src/admin/ui/dialog.test.tsx (new)
      Do: Assert open/close via keyboard, Esc closes, title/description wiring, `data-slot`
      attributes, focus lands in the dialog and returns on close — contract from template
      src/components/ui/dialog.tsx.
      Done when: suite fails only because ui/dialog.tsx does not exist.
      Refs: plan §4.3 ADD, ui-components.md §6

- [x] T015 Port the dialog primitive
> note: dialog ported from template (rules 1–10, inline-SVG XIcon, reuses Phase 1 Button + @radix-ui/react-dialog, no new pkg); tests: 13 passing; deviations: dialog.test.tsx — Enter-open fires click (jsdom default-action sim)
> reviewed: PASS-WITH-NITS — port verified faithful; changelog's test-fix narrative has no matching diff (dialog.test.tsx unchanged since T014's commit)
> note: review-nit fix — change-log test-fix narrative corrected (dialog.test.tsx unchanged since T014 commit); tests: 13 passing; deviations: none
> reviewed: PASS — change-log narrative corrected with annotation, verified accurate
      Files: apps/web/src/admin/ui/dialog.tsx (new; from template src/components/ui/dialog.tsx)
      Do: Full port (overlay, content, header, footer, title, description, close) applying rules
      1–10; reuse the already-present `@radix-ui/react-dialog` (no new dependency).
      Done when: T014 green; renders under Vite; no new package added.
      Refs: ui-components.md §3, plan §1.3

- [x] T016 Write failing chart render tests
> note: chart render contract suite (4 tests) — data-slot chart, CSS-var tokens not literals, tooltip label/value, indicator var color; tests: 0 passing (red on missing module); deviations: none
> reviewed: PASS
      Files: apps/web/src/admin/ui/chart.test.tsx (new)
      Do: Assert ChartContainer renders a recharts chart from fixture config, tooltip content
      renders, and no literal color values appear in rendered style attributes — contract from
      template src/components/ui/chart.tsx.
      Done when: suite fails only because ui/chart.tsx does not exist.
      Refs: plan §4.3 ADD, ui-components.md §6

- [x] T017 Port the chart primitive
> note: chart ported from template (rules 1–10, CSS-var color plumbing, ChartContainer/Tooltip/Legend); tests: 4 passing; deviations: chart.tsx — recharts 3.7.0 lacks TooltipValueType export, defined locally
> reviewed: PASS — byte-for-byte match to template bar the documented type adaptation
      Files: apps/web/src/admin/ui/chart.tsx (new; from template src/components/ui/chart.tsx)
      Do: Port `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartConfig` keeping the
      CSS-variable color plumbing; series colors resolve to `var(--chart-N)` tokens, never
      literals. Widgets will import recharts through this wrapper only.
      Done when: T016 green; a composed chart renders from fixture series with token-driven colors.
      Refs: ui-components.md §1 rule 9/§3, FR-022

- [x] T018 Write failing badge render tests
> note: badge render contract suite (13 tests) — data-slot, 6 variants data-variant, rounded-4xl pill, token classes, asChild Slot, badgeVariants; tests: 0 passing (red on missing module); deviations: none
> reviewed: PASS
      Files: apps/web/src/admin/ui/badge.test.tsx (new)
      Do: Assert each variant renders with its `data-variant` attribute and token classes —
      contract from template src/components/ui/badge.tsx.
      Done when: suite fails only because ui/badge.tsx does not exist.
      Refs: plan §4.3 ADD, ui-components.md §6

- [x] T019 Port the badge primitive
> note: badge ported from template (rules 1–10, 6 variants, pill shape, Slot not Slot.Root per @radix-ui/react-slot); tests: 13 passing; deviations: badge.tsx — Slot.Root→Slot per pinned @radix-ui/react-slot export
> reviewed: PASS — byte-for-byte match to template bar the documented Slot adaptation
      Files: apps/web/src/admin/ui/badge.tsx (new; from template src/components/ui/badge.tsx)
      Do: Full port — pill shape (`rounded-4xl`) and tinted variants — applying rules 1–10.
      Done when: T018 green; renders all variants under Vite.
      Refs: ui-components.md §3, FR-018 (delta badges)

- [x] T020 Write failing KpiStrip static tests
> note: 9-test suite — 5 cells/labels, numeric/null/zero delta variants, down-arrow, caption, dashed empty, no NaN; tests: 0 passing (red on missing module); deviations: none
> reviewed: PASS
      Files: apps/web/src/admin/analytics/KpiStrip.test.tsx (new)
      Do: Against T008 fixtures assert the five cells, delta badge rendering for numeric /
      null-previous ("no prior data") / zero-previous ("—") fixtures, and the empty state.
      Done when: suite fails only because KpiStrip.tsx does not exist.
      Refs: plan §4.3 ADD, Q5, FR-018

- [x] T021 Build KpiStrip against fixture data
> note: KpiStrip from template — 5 spec KPIs, text-2xl tracking-tight, tinted delta badges (numeric/null/zero), from X - last period caption, ellipsis + dashed empty; tests: 9 passing; deviations: none
> reviewed: PASS
      Files: apps/web/src/admin/analytics/KpiStrip.tsx (new; adapts template
      _components/analytics-kpi-strip.tsx)
      Do: Divided card strip with exactly five KPI cells (page views, unique visitors, sessions,
      returning-visitor rate, pages per session), `text-2xl tracking-tight` values, tinted delta
      badges + "from X - last period" caption; per-card ellipsis menu omitted (documented
      adaptation). Renders the Q5 states from fixtures: numeric delta, `previous: null` -> "no
      prior data", `previous: 0` -> "—" (never NaN/Infinity); template dashed empty-panel state.
      Done when: T020 green (all fixture variants render).
      Refs: ui-components.md §4, FR-018, Q5

- [x] T022 Write failing TrafficChart static tests
> note: 5-test suite — chart via chart.tsx (data-slot=chart), both series var(--chart-N) colors, day/hour bucket ticks, dashed empty; tests: 0 passing (red on missing module); deviations: none
> reviewed: PASS
      Files: apps/web/src/admin/analytics/TrafficChart.test.tsx (new)
      Do: Against T008 fixtures assert both series render, bucket labels for hour vs day fixtures,
      empty state, and that recharts is only reached through chart.tsx.
      Done when: suite fails only because TrafficChart.tsx does not exist.
      Refs: plan §4.3 ADD, FR-029

- [x] T023 Build TrafficChart against fixture data
> note: TrafficChart — ComposedChart in ChartContainer, views+sessions chart-1/2 lines, day/hour ticks, dashed empty; tests: 5 passing; deviations: TrafficChart.tsx — recharts structural imports direct
> reviewed: PASS-WITH-NITS — rule 9 structural import; UTC vs London tick tz
> note: review-nit fix — structural recharts re-exported from chart.tsx (rule 9); bucket labels Europe/London tz (Q4); tests: 5 passing; deviations: none
> reviewed: PASS-WITH-NITS — rule 9/tz fixed; fix commit reused build message
      Files: apps/web/src/admin/analytics/TrafficChart.tsx (new; adapts template
      _components/traffic-quality.tsx)
      Do: Card frame + ComposedChart via the ported `chart.tsx` only (never direct recharts
      import); series = page views + sessions per bucket in `var(--chart-N)` colors; axis/tooltip
      styling per template; handles hour and day bucket fixture series; dashed empty state.
      Done when: T022 green (renders day-bucket, hour-bucket, and empty fixtures).
      Refs: ui-components.md §1 rule 9/§4, FR-029, Q4 (render)

- [x] T024 Write failing RealtimeCard static tests
> note: 5-test suite — active count, top-5 page rows, zero dashed empty, no flag markup, card frame + title; tests: 0 passing (red on missing module); deviations: none
> reviewed: PASS
      Files: apps/web/src/admin/analytics/RealtimeCard.test.tsx (new)
      Do: Against T008 fixtures assert active-visitor count, top-5 page rows, zero-state
      rendering, no flag markup.
      Done when: suite fails only because RealtimeCard.tsx does not exist.
      Refs: plan §4.3 ADD, FR-020

- [x] T025 Build RealtimeCard against fixture data
> note: RealtimeCard from template — live count + Live indicator, top-5 pages list, no flags/BarChart, dashed empty; tests: 5 passing; deviations: none
> reviewed: PASS
      Files: apps/web/src/admin/analytics/RealtimeCard.tsx (new; adapts template
      _components/realtime-visitors.tsx)
      Do: Card frame with live-count emphasis + top-5 active pages list; country-flag rows removed
      and no `flags.css` import (documented adaptation — geo out of scope); zero-visitor empty
      state.
      Done when: T024 green (renders populated and zero fixtures).
      Refs: ui-components.md §4, research R11, FR-020, V5 (render)

- [x] T026 Write failing TopPages static tests
> note: TopPages static render suite (5 tests) — ranking order, share %, 10-row cap, dashed empty, card frame; tests: 0 passing (red on missing module); deviations: none
> reviewed: PASS
      Files: apps/web/src/admin/analytics/TopPages.test.tsx (new)
      Do: Against T008 fixtures assert ranking order, share rendering, 10-row cap, empty state.
      Done when: suite fails only because TopPages.tsx does not exist.
      Refs: plan §4.3 ADD, FR-021

- [x] T027 Build TopPages against fixture data
> note: TopPages from template — Card + native table inlined (table.tsx not in §3), Path/Views/Share, 10-row cap Q6, dashed empty; tests: 5 passing; deviations: TopPages.tsx — table inlined (not in §3)
> reviewed: PASS — ui-components.md §4 now records table-inlining deviation
> note: review-nit fix — ui-components.md §4 TopPages row updated with table-inlining adaptation; tests: 5 passing; deviations: none
> reviewed: PASS 
      Files: apps/web/src/admin/analytics/TopPages.tsx (new; adapts template
      _components/top-pages.tsx)
      Do: Card frame, ranked rows for top-10 paths with share-of-views presentation per template;
      dashed empty state.
      Done when: T026 green (renders 10-row and empty fixtures).
      Refs: ui-components.md §4, FR-021, Q6 (render)

- [x] T028 Write failing TrafficSources static tests
> note: TrafficSources static render suite (5 tests) — 5 groups render, zero-valued shown Q6, share %, dashed empty, card frame; tests: 0 passing (red on missing module); deviations: none
> reviewed: PASS — zero-value test now asserts per-row, not whole page
> note: review-nit fix — zero-value test asserts per-row (card-content children) not whole page; tests: 5 passing; deviations: none
> reviewed: PASS 
      Files: apps/web/src/admin/analytics/TrafficSources.test.tsx (new)
      Do: Against T008 fixtures assert all five groups render (including zero-valued), share
      values, empty state.
      Done when: suite fails only because TrafficSources.tsx does not exist.
      Refs: plan §4.3 ADD, FR-021, Q6

- [x] T029 Build TrafficSources against fixture data
> note: TrafficSources — Card + ranked rows, 5 S-groups zero-valued shown Q6, share %, dashed empty; tests: 5 passing; deviations: TrafficSources.tsx — Tabs removed + BarChart to rows per §4
> reviewed: PASS
      Files: apps/web/src/admin/analytics/TrafficSources.tsx (new; adapts template
      _components/top-traffic-sources.tsx)
      Do: Card frame, ranked/share presentation with exactly the five source groups as rows —
      zero-valued groups shown; dashed empty state.
      Done when: T028 green (renders five-group and empty fixtures).
      Refs: ui-components.md §4, FR-021, Q6 (render)

- [x] T030 Write failing RangeToolbar static tests
> note: 5-test suite — 5 Q2 options in order, default 3m, keyboard select fires onSelect with preset id, no ellipsis; Radix focuses selected item on open; tests: 5 passing; deviations: none
      Files: apps/web/src/admin/analytics/RangeToolbar.test.tsx (new)
      Do: Assert exactly the five options and their order, default `3 months`, keyboard
      operability, and that choosing an option fires the callback with the preset id.
      Done when: suite fails only because RangeToolbar.tsx does not exist.
      Refs: plan §4.3 ADD, Q2

- [x] T031 Build RangeToolbar against fixture state
> note: RangeToolbar from template — ported select with 5 Q2 options (24h/7d/28d/3m/more), default 3m, ellipsis menu omitted, onSelect callback prop; tests: 5 passing; deviations: none
      Files: apps/web/src/admin/analytics/RangeToolbar.tsx (new; adapts template
      _components/analytics-toolbar.tsx)
      Do: Ported `select` with options exactly `24 hours` / `7 days` / `28 days` / `3 months` /
      `More`, default `3 months` (spec values supersede template's); export/import/share ellipsis
      menu omitted (documented adaptation). Selection is a callback prop — no data fetching.
      Done when: T030 green (renders with exact option set + default).
      Refs: ui-components.md §4, research R10, Q2, FR-019

- [ ] T032 Write failing RangeDialog static tests
      Files: apps/web/src/admin/analytics/RangeDialog.test.tsx (new)
      Do: Assert the three presets + Custom render, date inputs are native and labelled, dialog is
      keyboard reachable, Esc closes.
      Done when: suite fails only because RangeDialog.tsx does not exist.
      Refs: plan §4.3 ADD, Q2

- [ ] T033 Build RangeDialog against fixture state
      Files: apps/web/src/admin/analytics/RangeDialog.tsx (new; composed from ported dialog +
      button + label + input — no direct template source)
      Do: Dialog offering exactly `6 months` / `12 months` / `16 months` / `Custom`; Custom shows
      two native `<input type="date">` fields styled by the admin `input` primitive (no
      calendar-grid picker); validation message slot in `destructive` text per template form
      conventions. Preset/Apply are callback props — no validation logic or data wiring yet.
      Done when: T032 green (renders presets + date inputs).
      Refs: ui-components.md §5, research R10, Q2, FR-019

- [ ] T034 Write failing Analytics page static tests
      Files: apps/web/src/admin/pages/Analytics.test.tsx (new)
      Do: Assert tab row (Overview active, placeholder panels for the rest), all six widget
      regions present from fixtures, and single-column stacking at mobile width.
      Done when: suite fails only because pages/Analytics.tsx does not exist.
      Refs: plan §4.3 ADD, FR-022/FR-024, US3-13

- [ ] T035 Compose the static Analytics page against fixture data
      Files: apps/web/src/admin/pages/Analytics.tsx (new; adapts template analytics/page.tsx)
      Do: Heading block (greeting replaced by page title — documented adaptation), tab row via
      ported `tabs` with Overview active and non-Overview tabs rendering the template's own dashed
      "coming soon" placeholder panels, `xl:grid-cols-12` / `gap-4` grid composing RangeToolbar,
      KpiStrip, TrafficChart, RealtimeCard, TopPages, TrafficSources fed exclusively from
      fixtures.ts. No data fetching, no RangeDialog behavior.
      Done when: T034 green; page renders from fixtures in light and dark.
      Refs: ui-components.md §4, research R11, FR-022/FR-024

- [ ] T036 PARITY GATE: approve the ported UI against the template (blocks Pass 2)
      Files: specs/013-panel-phase-2/ui-components.md (§6 checklist + recorded deviations)
      Do: For every §3 primitive and §4/§5 composition run the ui-components.md §6 checklist: DOM
      structure + `data-slot` attributes match; token usage (no literal colors, `var(--chart-N)`
      series); side-by-side visual check against the template analytics page in **light AND
      dark**; keyboard operability + visible focus; Pass 1 suites green. Record any deviation as a
      documented adaptation before proceeding.
      Done when: every checklist item is checked and the light/dark side-by-side is approved —
      only then may T037 start.
      Refs: ui-components.md §6, research R12, SC-010, DoD-6

---

## Pass 2 — Make it work: every §4.1 scenario green (T037–T090)

### Ingest service and route (happy path)

- [ ] T037 Write failing trafficSource classification unit tests
      Files: apps/api/tests/unit/trafficSource.test.ts (new)
      Do: Assert precedence S1 (utmSource present or adClick true -> CAMPAIGN over everything),
      happy-path list membership per S2 (google/bing/... -> SEARCH; facebook/x.com/t.co/... ->
      SOCIAL), S3 (own-host, empty, unparsable referrer -> DIRECT), unknown external host ->
      REFERRAL, and that classification consumes/returns hostname only (S5). Assert the exported
      SEARCH/SOCIAL constants contain at least the plan §2.4 hosts.
      Done when: suite fails only because trafficSource.ts does not exist.
      Refs: T-B4, S1/S2/S3/S5, FR-011

- [ ] T038 Implement the trafficSource service
      Files: apps/api/src/services/trafficSource.ts (new)
      Do: Export `SEARCH_HOSTS`/`SOCIAL_HOSTS` constant arrays (extend-by-append, Open-Closed) and
      a classify function (referrer, utmSource, adClick) -> `AnalyticsSourceGroup` with S1
      precedence and hostname-only handling; own/empty/unparsable -> DIRECT. (Exact-vs-label S2
      matching semantics are hardened in Pass 3 — implement the happy-path matching now.)
      Done when: T037 green.
      Refs: research R5, S1–S3/S5, FR-011

- [ ] T039 Write failing ingest happy-path integration test (T-B1)
      Files: apps/api/tests/integration/analytics-ingest.test.ts (new)
      Do: `POST /api/analytics/events` with a valid payload + `mh_vid`/`mh_sid` cookies -> 204; a
      single `analytics_events` row stores path/occurredAt (server clock)/sourceGroup/visitorId/
      sessionId; `analytics_visitors` upserted with server-authoritative firstSeenAt/lastSeenAt.
      Use T005 helpers, injected clock.
      Done when: test fails only because the endpoint does not exist.
      Refs: T-B1 (US2-1), M1/M2, research R2/R3, FR-007

- [ ] T040 Write failing session-grouping integration test (T-B2)
      Files: apps/api/tests/integration/analytics-ingest.test.ts
      Do: Two events posted with the same `mh_sid` within 30 minutes (injected clock) share
      `sessionId`; an event arriving with a fresh `mh_sid` value stores a new `sessionId`
      (cookie-rolling behavior itself is asserted client-side in T-F5/E-SESSION; grouping is
      asserted here).
      Done when: test fails for the missing endpoint.
      Refs: T-B2 (US2-2), V1, K3, FR-009

- [ ] T041 Write failing privacy-audit test (T-B8)
      Files: apps/api/tests/integration/analytics-privacy.test.ts (new)
      Do: After posting events, assert stored rows contain only the data-model columns; assert (via
      information_schema or Prisma DMMF) that no IP, User-Agent, or full-referrer-URL column
      exists on either analytics table; assert `referrerHost` never contains a scheme, path, or
      query string.
      Done when: red only because the endpoint does not exist (the schema-level no-column
      assertions may already pass from T003; the row-level assertions must be red).
      Refs: T-B8 (US4-1), §2.7 R2, M7, S5, FR-015/FR-016, SC-008

- [ ] T042 Implement the analyticsIngest service (happy path)
      Files: apps/api/src/services/analyticsIngest.ts (new)
      Do: Zod schema for `{path, referrer?, utmSource?, utmMedium?, utmCampaign?, adClick?}`
      (unknown keys rejected; happy-path shape per M2 — boundary hardening is Pass 3); read
      `mh_vid`/`mh_sid` from request cookies; classify via trafficSource; store referrer hostname
      only; `AnalyticsVisitor` upsert (insert firstSeenAt=lastSeenAt=now on new id, update
      lastSeenAt on conflict) + `AnalyticsEvent` insert with server-clock occurredAt; Pino
      counters for stored events (no PII in logs). Never persist IP or UA (M7).
      Done when: service unit-callable; T039–T041 still red only on the missing route.
      Refs: research R2/R3, M2/M3 (cookie path)/M7, S5, data-model.md §3

- [ ] T043 Wire the public ingest route POST /api/analytics/events
      Files: apps/api/src/routes/analytics.ts (new)
      Do: Route with the existing `validate` middleware + analyticsIngest service; respond 204 on
      store; reuse the existing `rateLimit` middleware (M6 boundary configured/tested in Pass 3);
      error middleware maps validation failure to 400.
      Done when: route module exports a router wired to the service.
      Refs: M1, contracts/analytics.openapi.yaml POST /api/analytics/events

- [ ] T044 Register the public analytics route in the app
      Files: apps/api/src/app.ts
      Do: Mount routes/analytics.ts under `/api/analytics` with correlation-id logging like the
      existing routes.
      Done when: T039, T040, and T041 pass (T-B1, T-B2, T-B8 green).
      Refs: M1, plan §5.1, constitution II

### Beacon + cookies (public web)

- [ ] T045 Write failing beacon unit tests (T-F5)
      Files: apps/web/src/analytics/beacon.test.ts (new)
      Do: With fake timers and mocked `navigator.sendBeacon`/`fetch`: exactly one event on initial
      load and one per SPA pathname change (same-path navigation sends nothing); `/admin` and
      `/admin/*` never send; `navigator.sendBeacon` is the transport, `fetch(keepalive: true)`
      only when sendBeacon is unavailable; all failures silent; `mh_vid` set as UUID v4 with
      365-day Max-Age renewed (same value, fresh expiry) per measured view and `mh_sid` UUID v4
      with 30-minute rolling Max-Age (K1 attributes: Path=/, SameSite=Lax); `adClick: true` sent
      when the landing URL carries `gclid`/`fbclid` while the click-ID value itself never appears
      in any payload.
      Done when: suite fails only because beacon.ts does not exist.
      Refs: T-F5 (US2-1), M8, K1/K2/K3, research R1/R2, FR-007/FR-008/FR-012/FR-014, M2 (adClick)

- [ ] T046 Implement the public beacon module
      Files: apps/web/src/analytics/beacon.ts (new)
      Do: Cookie set/renew for `mh_vid` (365 d) + `mh_sid` (30 min) via `crypto.randomUUID()`,
      `Path=/`, `SameSite=Lax`, `Secure` in production; page-view send on load + route change with
      sendBeacon -> keepalive-fetch fallback, 0 retries, errors swallowed; skip `/admin` and
      `/admin/*`; exported extensible `AD_CLICK_PARAMS = ['gclid', 'fbclid']` list driving the
      `adClick` flag; no import into render-critical paths.
      Done when: T045 green.
      Refs: research R1/R2, K1/K2/K3, M8, FR-008/FR-012/FR-014/FR-015

### Banner + register + policy page

- [ ] T047 Write failing CookieBanner first-render tests (T-F1)
      Files: apps/web/src/components/CookieBanner.test.tsx (new)
      Do: Fresh state (no `mh_cookie_ack`) -> banner renders the performance-cookies-only
      statement, acknowledge button, close ("x") control, and a link to `/cookie-policy`; it is a
      `position: fixed` bottom overlay (zero layout shift, client-only mount); with
      `mh_cookie_ack=1` it does not render at all.
      Done when: suite fails only because CookieBanner.tsx does not exist.
      Refs: T-F1 (US1-1), N1/N2, K4, FR-001/FR-002

- [ ] T048 Write failing CookieBanner acknowledgment tests (T-F2)
      Files: apps/web/src/components/CookieBanner.test.tsx
      Do: Acknowledge sets `mh_cookie_ack=1` with 365-day Max-Age (Path=/, SameSite=Lax) and hides
      the banner in the same frame; close ("x") has the identical effect; remount with the cookie
      present shows no banner; there is no dismissal path that skips the cookie.
      Done when: test red for the missing component.
      Refs: T-F2 (US1-2/3), N3, K1/K4, FR-002/FR-003

- [ ] T049 Write failing CookieBanner a11y/non-blocking tests (T-F3)
      Files: apps/web/src/components/CookieBanner.test.tsx
      Do: Banner never intercepts input outside its own bounds (page content stays interactive);
      keyboard reachable and operable (both controls), visible focus, `role="region"` +
      `aria-label="Cookie notice"`, no focus trap; clearing the cookie makes the banner return.
      Done when: test red for the missing component.
      Refs: T-F3 (US1-4/6/9), N5, FR-004, SC-002

- [ ] T050 Implement the CookieBanner component
      Files: apps/web/src/components/CookieBanner.tsx (new)
      Do: Public-site Bootstrap-styled fixed bottom overlay (NOT the admin design system);
      statement, acknowledge + close controls both writing `mh_cookie_ack` through a single
      acknowledgment seam (the FR-028 opt-in extension point); policy-page link; N5 accessibility;
      renders only while the cookie is absent.
      Done when: T047, T048, T049 green.
      Refs: research R8, K4, N1/N3/N5, FR-001–FR-004, FR-028

- [ ] T051 AMEND the TemplateLayout render tests for banner + beacon
      Files: apps/web/src/test/routes/template-layout.test.tsx
      Do: Extend the existing expectations (amend — do not delete passing coverage): TemplateLayout
      mounts `CookieBanner` and invokes the beacon hook exactly once per route render; no other
      TemplateLayout behavior changes. Tests fail until T052.
      Done when: amended assertions exist and are red only on the missing mounts.
      Refs: plan §4.3 AMEND #1, FR-001, SC-001

- [ ] T052 Mount CookieBanner + beacon in TemplateLayout
      Files: apps/web/src/components/TemplateLayout.tsx
      Do: Mount `CookieBanner` and the beacon hook — TemplateLayout is the enforced single mount
      point giving every current and future public page the banner + measurement with zero
      page-specific setup. No other layout change.
      Done when: T051 amended suite green; all pre-existing TemplateLayout assertions still green.
      Refs: FR-001, SC-001, plan §1.1

- [ ] T053 Write failing register-consistency test (T-F11)
      Files: apps/web/src/content/cookieRegister.test.ts (new)
      Do: Assert every cookie name Phase 2 code can set (`mh_vid`, `mh_sid` from beacon.ts;
      `mh_cookie_ack` from CookieBanner) appears in the register; the register additionally
      contains the Phase 1 admin cookies and the `_ga`/`_ga_<container-id>` entries (K5 exact
      list); and the register matches the policy-page table one-to-one (render CookiePolicy and
      diff rows against the register).
      Done when: suite fails only because cookieRegister.ts (and CookiePolicy) do not exist.
      Refs: T-F11 (US4-1), K5, FR-025/FR-026/FR-027, SC-011, DoD-4

- [ ] T054 Write failing CookiePolicy page test (T-F4, page half)
      Files: apps/web/src/test/routes/cookie-policy.test.tsx (new)
      Do: `/cookie-policy` renders a table with one row per cookieRegister entry showing name,
      purpose, category, duration — 1:1, no extra or missing rows (adding a register entry must
      surface with no page change).
      Done when: test red because the page/route does not exist.
      Refs: T-F4 (US1-3, US4-2), N4, FR-005/FR-025/FR-027

- [ ] T055 Create the authoritative cookie register module
      Files: apps/web/src/content/cookieRegister.ts (new)
      Do: Typed readonly array (`name`, `purpose`, `category: "strictly-necessary" | "functional"
      | "performance"`, `duration`, `setBy`) listing exactly: `mh_vid`, `mh_sid`, `mh_cookie_ack`
      (performance/functional per K-series, set by this site); the Phase 1 admin refresh cookie
      (strictly necessary) and theme/sidebar preference cookies (functional); and the Google
      Analytics cookies `_ga` + `_ga_<container-id>` (performance, set by Google Analytics, 2-year
      duration renewed per visit — browsers may cap at ~400 days). Documenting GoogleTag's cookies
      MUST NOT touch GoogleTag.tsx or its env plumbing. Entries are extend-by-append (Open-Closed).
      Done when: module typechecks; T053's register-content assertions green (the policy-page
      match half stays red until T057).
      Refs: research R9, K5, FR-025/FR-026/FR-027, plan §1.4

- [ ] T056 Implement the CookiePolicy page
      Files: apps/web/src/routes/CookiePolicy.tsx (new)
      Do: Public Bootstrap-styled page rendering its cookie table directly from cookieRegister.ts
      (no copy of the data); SEO metadata consistent with other public routes (follow
      routes/Privacy.tsx conventions).
      Done when: component renders the register 1:1.
      Refs: research R9, N4, FR-005

- [ ] T057 Register the /cookie-policy route
      Files: apps/web/src/App.tsx
      Do: Add the public `/cookie-policy` route rendering CookiePolicy inside TemplateLayout, next
      to the existing public routes.
      Done when: T054 green (page reachable at /cookie-policy) and T053 fully green (register
      matches the rendered policy table one-to-one).
      Refs: N4, FR-005

### Overview + realtime endpoints

- [ ] T058 Write failing analyticsQuery unit tests
      Files: apps/api/tests/unit/analyticsQuery.test.ts (new)
      Do: With seeded fixtures and fixed injected timestamps assert the happy paths: Europe/London
      day buckets (zero-filled gaps), hour buckets for a <= 2-day span; KPI math V2 (distinct
      visitorId), V3 (returning = firstSeenAt on an earlier London day than first in-range event
      day), V4 (events/sessions); Q5 deltas vs the immediately preceding equal-length window
      (previous null only when the comparison window ends before the first stored event; zero
      previous -> deltaPercent null, never NaN/Infinity); top-10 pages with share (Q6); source
      breakdown counting sessions by first-event source (S4), all five groups present; realtime =
      distinct visitors + top-5 paths in a trailing 5-minute window (V5).
      Done when: suite fails only because analyticsQuery.ts does not exist.
      Refs: T-B5/T-B6 basis, V2–V5, Q4/Q5/Q6, S4, research R6/R7

- [ ] T059 Implement the analyticsQuery service
      Files: apps/api/src/services/analyticsQuery.ts (new)
      Do: Parameterized `$queryRaw` aggregations with `AT TIME ZONE 'Europe/London'` for buckets
      and day boundaries; single overview result (KPIs + deltas + zero-filled timeseries + top
      pages + five source groups via session-first-event attribution) and a realtime query
      (trailing 5 minutes). Internals replaceable without touching routes (Open-Closed seam for a
      future rollup strategy).
      Done when: T058 green.
      Refs: research R6/R7, V2–V5, Q4/Q5/Q6, S4

- [ ] T060 Write failing overview KPI/delta integration test (T-B5)
      Files: apps/api/tests/integration/analytics-overview.test.ts (new)
      Do: `GET /api/admin/analytics/overview?from&to` (authenticated) returns page views, unique
      visitors, sessions, returning-visitor rate, pages per session, each with `current`,
      `previous`, `deltaPercent` versus the preceding equal window, matching the seeded fixtures.
      Done when: red only because the endpoint does not exist.
      Refs: T-B5 (US3-2), V2–V4, Q5, FR-018, contract OverviewResponse

- [ ] T061 Write failing overview range/shape integration test (T-B6, overview half)
      Files: apps/api/tests/integration/analytics-overview.test.ts
      Do: Overview honors `from`/`to` (date form); buckets by day, and by hour for a <= 2-day
      span (`range.bucket` echoes `day`/`hour`); returns top-10 pages with share and exactly the
      five source groups with zero-valued groups included.
      Done when: red for the missing endpoint.
      Refs: T-B6 (US3-3/4), Q1 (happy)/Q4/Q6, FR-019/FR-021/FR-029

- [ ] T062 Write failing realtime integration test (T-B6, realtime half)
      Files: apps/api/tests/integration/analytics-realtime.test.ts (new)
      Do: `GET /api/admin/analytics/realtime` (authenticated) returns distinct visitors with >= 1
      event in the trailing 5 minutes (injected clock), top-5 active paths, `windowMinutes: 5`.
      Done when: red for the missing endpoint.
      Refs: T-B6 (US3-5), V5, FR-020, contract RealtimeResponse

- [ ] T063 Write failing returning-visitor integration test (T-B3)
      Files: apps/api/tests/integration/analytics-overview.test.ts
      Do: Visitor with `firstSeenAt` yesterday (London) and an event today counts returning in
      today's range; a brand-new visitor counts new (injected clock).
      Done when: red for the missing endpoint.
      Refs: T-B3 (US2-3), V3, FR-010, SC-004

- [ ] T064 Write failing source-attribution integration test (T-B4)
      Files: apps/api/tests/integration/analytics-overview.test.ts
      Do: Ingest referrer/utm permutations end-to-end (search referrer, social referrer, unknown
      referrer, utm-tagged, direct) then assert overview `sources` groups them as
      SEARCH/SOCIAL/REFERRAL/CAMPAIGN/DIRECT and that a session's group is its FIRST stored
      event's source even when later events in the session differ (S4, sessions counted not
      events).
      Done when: red for the missing endpoint.
      Refs: T-B4 (US2-8), S1–S4, FR-011

- [ ] T065 Write failing auth-gate integration test (T-B7)
      Files: apps/api/tests/integration/analytics-auth.test.ts (new)
      Do: Overview and realtime without a session -> 401; with an invalid/expired token -> 401;
      with a valid admin session (any role) -> 200. Cover every branch of the auth gate on these
      routes (100% branch target, DoD-3).
      Done when: red for the missing endpoints.
      Refs: T-B7 (US3-12), FR-017, constitution I, DoD-3

- [ ] T066 Implement the overview route handler
      Files: apps/api/src/routes/admin/analytics.ts (new)
      Do: `GET /overview` behind the Phase 1 `authenticate` middleware: parse `from`/`to` (happy
      path; full Q1 boundary validation hardened in Pass 3), call analyticsQuery, return the
      contract OverviewResponse shape with `range.bucket` echo.
      Done when: handler responds per contract for valid input.
      Refs: contract GET /api/admin/analytics/overview, Q1 (happy), FR-017/FR-018

- [ ] T067 Implement the realtime route handler
      Files: apps/api/src/routes/admin/analytics.ts
      Do: `GET /realtime` behind `authenticate`: call analyticsQuery realtime, return
      RealtimeResponse (`activeVisitors`, `topActivePages` max 5, `windowMinutes: 5`).
      Done when: handler responds per contract.
      Refs: contract GET /api/admin/analytics/realtime, V5, FR-017/FR-020

- [ ] T068 Register the admin analytics routes in the app
      Files: apps/api/src/app.ts
      Do: Mount routes/admin/analytics.ts under `/api/admin/analytics` with correlation-id
      logging.
      Done when: T060–T065 all green (T-B3–T-B7 pass).
      Refs: plan §5.1, constitution II

- [ ] T069 Mirror the three endpoints into the api OpenAPI document
      Files: apps/api/openapi.yaml
      Do: Add `POST /api/analytics/events`, `GET /api/admin/analytics/overview`,
      `GET /api/admin/analytics/realtime` with schemas semantically identical to
      contracts/analytics.openapi.yaml (IngestEventRequest, KpiValue, OverviewResponse,
      RealtimeResponse, ErrorResponse, status codes).
      Done when: openapi.yaml validates and the three definitions match the contract.
      Refs: plan §1.1/§5.1, DoD-8

### Wire the dashboard to live data

- [ ] T070 Write failing range-preset math tests
      Files: apps/web/src/admin/analytics/rangePresets.test.ts (new)
      Do: With a fixed clock assert the exact Q2 mapping: `24 hours` -> UTC datetimes
      `from = now - 24h`, `to = now`; `7 days` -> `today-6 .. today`; `28 days` ->
      `today-27 .. today`; `3/6/12/16 months` -> `today - N months + 1 day .. today`; "today" is
      the current Europe/London date.
      Done when: red because rangePresets.ts does not exist.
      Refs: Q1/Q2, research R10, FR-019

- [ ] T071 Implement the range-preset helpers
      Files: apps/web/src/admin/analytics/rangePresets.ts (new)
      Do: Preset definitions (extensible list, Open-Closed) and preset -> `{from, to}` conversion
      per Q2, London-aware, datetime form only for the 24-hour preset.
      Done when: T070 green.
      Refs: Q1/Q2, research R10

- [ ] T072 Write failing useAnalytics hook tests
      Files: apps/web/src/admin/analytics/useAnalytics.test.tsx (new)
      Do: With mocked apiClient and fake timers: overview fetched with the given `from`/`to` and
      refetched on range change; realtime polled every 30 s (V6 — advance fake timers, count
      calls); loading, error, and empty responses surfaced to consumers without throwing.
      Done when: red because useAnalytics.ts does not exist.
      Refs: V6, T-F7 basis, FR-020, SC-006

- [ ] T073 Implement the useAnalytics data hooks
      Files: apps/web/src/admin/analytics/useAnalytics.ts (new)
      Do: Overview hook keyed on the validated range and a realtime hook polling every 30 s via
      the admin apiClient (no websockets); typed to the contract shapes.
      Done when: T072 green.
      Refs: V6, research R7, FR-017/FR-020

- [ ] T074 Write failing live-dashboard test (T-F7)
      Files: apps/web/src/admin/pages/Analytics.test.tsx
      Do: With mocked overview/realtime responses (contract shapes) the page renders the KPI strip
      with deltas, traffic chart, realtime card, top pages, and sources from the live-data path
      (amend the T034 static assertions to inject mocked hook data — do not delete them).
      Done when: red because the page still renders fixtures.
      Refs: T-F7 (US3-2..5), FR-018/FR-020/FR-021/FR-029

- [ ] T075 Wire the Analytics page widgets to live data
      Files: apps/web/src/admin/pages/Analytics.tsx
      Do: Replace fixture feeds with useAnalytics results; propagate loading/empty states to each
      widget; keep fixtures.ts for tests only.
      Done when: T074 green; T034 amended assertions green.
      Refs: research R12 (Pass 2 wiring), FR-018–FR-021/FR-029

- [ ] T076 Write failing range-selector behavior test (T-F8)
      Files: apps/web/src/admin/pages/Analytics.test.tsx
      Do: Selector shows exactly 24 hours / 7 days / 28 days / 3 months / More and defaults to
      3 months; switching presets refetches overview with the exact Q2 `from`/`to` and every
      widget updates from the single new payload.
      Done when: red because selection is not wired to refetch.
      Refs: T-F8 (US3-3), Q2, FR-019

- [ ] T077 Wire RangeToolbar selection to the dashboard state
      Files: apps/web/src/admin/pages/Analytics.tsx, apps/web/src/admin/analytics/RangeToolbar.tsx
      Do: Selection drives the shared range state -> useAnalytics refetch; "More" opens
      RangeDialog.
      Done when: T076 green.
      Refs: Q2, FR-019

- [ ] T078 Write failing range-dialog apply test (T-F9)
      Files: apps/web/src/admin/pages/Analytics.test.tsx
      Do: "More" opens the pop-up with 6 / 12 / 16 months and Custom; applying a preset closes the
      dialog and updates all widgets to the new range; a valid custom start/end pair applies the
      same way (Q3 rejection paths are Pass 3 / E-DIALOG).
      Done when: red because the apply flow is not wired.
      Refs: T-F9 (US3-4/5), Q2/Q3 (happy), FR-019

- [ ] T079 Wire the RangeDialog apply flow
      Files: apps/web/src/admin/analytics/RangeDialog.tsx, apps/web/src/admin/pages/Analytics.tsx
      Do: Preset buttons and a valid custom date pair produce `{from, to}` via rangePresets/London
      date math, close the dialog, and update the shared range state.
      Done when: T078 green.
      Refs: Q2/Q3 (happy), research R10, FR-019

### Navigation, redirect, footer, prerender

- [ ] T080 AMEND the admin shell tests: Coming Soon -> Analytics nav item
      Files: apps/web/src/admin/shell/AppShell.test.tsx, apps/web/src/admin/shell/keyboard.test.tsx,
      apps/web/src/admin/shell/a11y.test.tsx
      Do: Amend the sidebar "Coming Soon" content-area assertions to expect an "Analytics" nav
      item (supersedes Phase 1's H7 shell assertion); extend the keyboard and a11y shell suites to
      cover the new nav item. Amend — do not delete passing coverage; future sections keep their
      coming-soon placeholders.
      Done when: amended assertions exist and are red only on the missing nav item.
      Refs: plan §4.3 AMEND #3, FR-017, US3-1

- [ ] T081 Add the Analytics nav item to the sidebar
      Files: apps/web/src/admin/shell/Sidebar.tsx
      Do: Add the "Analytics" navigation entry linking to `/admin/analytics` as primary nav,
      following the existing item pattern (icon via the inline-SVG convention).
      Done when: T080 amended suites green.
      Refs: FR-017, US3-1

- [ ] T082 AMEND the /admin index-redirect tests -> /admin/analytics
      Files: apps/web/src/admin/pages/preAuthWiring.test.tsx (and any other suite asserting the
      `/admin` index or post-sign-in landing is `/admin/settings`)
      Do: Amend only the tests that assert the redirect/landing target ("lands on
      /admin/settings" -> "/admin/analytics"); suites that merely use `/admin/settings` as a route
      fixture stay untouched.
      Done when: amended assertions exist and are red only on the unchanged redirect.
      Refs: plan §4.3 AMEND #2, Q7, FR-017, US3-15

- [ ] T083 Write failing sidebar-navigation test (T-F6)
      Files: apps/web/src/admin/shell/AppShell.test.tsx
      Do: Sidebar shows "Analytics"; navigating `/admin` (index) lands on the Analytics dashboard
      rendered inside the Phase 1 shell.
      Done when: red because the route/redirect does not exist yet.
      Refs: T-F6 (US3-1), Q7, FR-017

- [ ] T084 Register the guarded analytics route and change the /admin redirects
      Files: apps/web/src/App.tsx
      Do: Add the guarded `/admin/analytics` route rendering the Analytics page inside the shell;
      change the `/admin` index redirect (currently `<Route index element={<Navigate
      to="/admin/settings" replace />} />`, App.tsx ~line 445) and the admin catch-all (~line 447)
      to `/admin/analytics`.
      Done when: T082 amended tests and T083 green.
      Refs: Q7, FR-017, plan §1.1

- [ ] T085 Write failing footer-link test (T-F4, footer half)
      Files: apps/web/src/test/components/footer-cookie-link.test.tsx (new, or extend the existing
      Footer coverage)
      Do: The public Footer renders a link to `/cookie-policy`.
      Done when: red because the link does not exist.
      Refs: T-F4 (US1-3), N4, FR-005

- [ ] T086 Add the cookie-policy link to the footer
      Files: apps/web/src/components/Footer.tsx
      Do: Add the `/cookie-policy` link following the footer's existing link markup/styling.
      Done when: T085 green.
      Refs: N4, FR-005

- [ ] T087 Prerender the cookie-policy route
      Files: apps/web/scripts/prerender.ts, apps/web/src/routes-metadata.ts
      Do: Add `/cookie-policy` to the prerender route list (and route metadata/sitemap wiring if
      the list feeds them). The banner must remain absent from all prerendered HTML (client-only
      mount, N2).
      Done when: the production build emits prerendered HTML for /cookie-policy containing the
      register table; prerendered HTML of every other page differs from the pre-phase build only
      by the footer link.
      Refs: N2/N4, FR-005/FR-006, DoD-5, SC-003

- [ ] T088 Write failing dashboard states test (T-F10)
      Files: apps/web/src/admin/analytics/dashboard-states.test.tsx (new)
      Do: With mocked responses: empty-range payload -> every widget renders its empty state;
      page renders in light and dark themes; full keyboard pass over toolbar, pop-up, and date
      inputs; single-column stacking at mobile width.
      Done when: any genuinely missing behavior is red (rendering already built in Pass 1 may pass
      — keep the test regardless).
      Refs: T-F10 (US3-9..11, 13), FR-022/FR-023, Q2/Q3

- [ ] T089 Close the gaps surfaced by T-F10
      Files: apps/web/src/admin/pages/Analytics.tsx, apps/web/src/admin/analytics/* (as surfaced)
      Do: Fix any empty-state propagation, theming, keyboard, or stacking failures from T088.
      Done when: T088 green.
      Refs: FR-022/FR-023

- [ ] T090 Pass 2 checkpoint: all §4.1 scenarios green
      Files: — (verification only)
      Do: Run `pnpm --filter @modular-house/api test:run` and `pnpm --filter @modular-house/web
      test:run`; confirm T-B1..T-B8 and T-F1..T-F11 all pass and that no Phase 1 auth/OTP/reset/
      settings suite or public configurator/SEO/marketing suite was modified beyond T051/T080/
      T082 (`git diff --name-only` audit).
      Done when: both suites green; diff audit clean.
      Refs: plan §5.3 Pass 2 exit, DoD-1, SC-003

---

## Pass 3 — Make it right: every §4.2 edge case green (T091–T121)

### E-INGEST — ingest boundaries (M2–M7, M10)

- [ ] T091 Write failing ingest validation boundary unit tests (E-INGEST, validation)
      Files: apps/api/tests/unit/analyticsIngestValidation.test.ts (new)
      Do: 512-char path accepted / 513 rejected; missing `path` -> 400; path not starting with
      `/` -> 400; unknown field -> 400; `referrer` > 2048 -> 400; each utm field > 100 -> 400;
      non-boolean `adClick` -> 400; 4 KB + 1 body -> 400. Cover EVERY schema branch — this suite
      carries the 100% branch requirement.
      Done when: new boundary cases red against the Pass 2 schema.
      Refs: E-INGEST, M2, DoD-3

- [ ] T092 Harden the ingest validation schema
      Files: apps/api/src/services/analyticsIngest.ts
      Do: Enforce all M2 bounds exactly (lengths, `^/` pattern, strict unknown-key rejection,
      boolean adClick); rejection is 400 — never truncation.
      Done when: T091 green; branch coverage on the validation module = 100%.
      Refs: M2, DoD-3

- [ ] T093 Enforce the 4 KB body cap on the ingest route
      Files: apps/api/src/routes/analytics.ts
      Do: Apply a 4 KB JSON body limit to this route and map the oversize error to 400 via the
      existing error middleware.
      Done when: the 4 KB + 1 case in T091 passes through the HTTP layer.
      Refs: M2, M1

- [ ] T094 Write failing ingest behavior edge tests (E-INGEST, behavior)
      Files: apps/api/tests/integration/analytics-ingest.test.ts
      Do: No cookies -> event stored with one-off UUID visitor/session (cookieless = new, M3);
      `isbot` UA (e.g. Googlebot) -> 204 and NOT stored (M4); `path=/admin/settings` -> 204 NOT
      stored while `/administration` -> stored (M5 boundary); 121st request in one minute from one
      IP -> 429 (M6); `/Page/` and `/page` stored as the single canonical `/page`, query/fragment
      stripped, duplicate slashes collapsed, root `/` kept (M10).
      Done when: each new case red against the Pass 2 implementation.
      Refs: E-INGEST, M3/M4/M5/M6/M10, FR-013/FR-014

- [ ] T095 Implement bot exclusion via isbot at ingest
      Files: apps/api/src/services/analyticsIngest.ts
      Do: Evaluate `isbot(userAgent)` before storing; matches respond 204 and store nothing; the
      UA string is used transiently only and never persisted or logged; log a bot-dropped counter.
      Done when: T094 bot case green.
      Refs: research R4, M4/M7, FR-013

- [ ] T096 Implement cookieless identity, admin-path boundary, and canonicalization
      Files: apps/api/src/services/analyticsIngest.ts
      Do: Absent `mh_vid`/`mh_sid` -> one-off server UUIDs (M3); drop exactly `/admin` and
      `/admin/*` (other `/admin…`-prefixed words are public) with 204 + admin-dropped counter
      (M5); canonicalize before storage: pathname only, lowercase, duplicate slashes collapsed,
      trailing slash stripped, root kept (M10).
      Done when: T094 M3/M5/M10 cases green.
      Refs: M3/M5/M10, FR-014, spec edge "Path variants"

- [ ] T097 Configure the ingest rate limit
      Files: apps/api/src/routes/analytics.ts
      Do: Configure the reused `rateLimit` middleware at exactly 120 events/minute/IP -> 429 with
      a rate-limited counter log.
      Done when: T094 rate-limit case green.
      Refs: M6, M1, constitution I

### E-BEACON — transport resilience

- [ ] T098 Write failing beacon resilience tests (E-BEACON)
      Files: apps/web/src/analytics/beacon.test.ts
      Do: Ingest endpoint 500/network-down -> no thrown error, no console error, page code keeps
      running; `navigator.sendBeacon` undefined -> keepalive fetch used; sendBeacon returning
      false -> fallback fires once; exactly 0 retries after any failure.
      Done when: any missing resilience path red.
      Refs: E-BEACON, M8, research R1, FR-012, SC-009

- [ ] T099 Harden the beacon failure paths
      Files: apps/web/src/analytics/beacon.ts
      Do: Swallow every transport error, implement the sendBeacon-false fallback, guarantee zero
      retries.
      Done when: T098 green.
      Refs: M8, research R1, FR-012

### E-SOURCE — classification precedence and matching

- [ ] T100 Write failing source-classification edge tests (E-SOURCE)
      Files: apps/api/tests/unit/trafficSource.test.ts
      Do: `utmSource` + search referrer -> CAMPAIGN; `adClick` + search referrer -> CAMPAIGN (S1
      precedence); own-host referrer -> DIRECT; unparsable referrer -> DIRECT; unknown external
      host -> REFERRAL; `notgoogle.com` -> REFERRAL (never SEARCH); `www.google.co.uk` -> SEARCH
      (registrable second-level label match); `x.com` matches exactly and as `.`-suffix
      (`www.x.com`) but not `notx.com`; matching case-insensitive.
      Done when: matching-semantics cases red against the Pass 2 matcher.
      Refs: E-SOURCE, S1/S2/S3, FR-011

- [ ] T101 Harden the hostname matching semantics
      Files: apps/api/src/services/trafficSource.ts
      Do: Implement S2 exactly: dot-containing entries match the host exactly or as a `.`-suffix;
      single-token entries match the host's registrable second-level label; case-insensitive;
      lookalike hosts never match.
      Done when: T100 green.
      Refs: S2, FR-011

### E-RANGE — overview validation, buckets, deltas

- [ ] T102 Write failing overview range edge tests (E-RANGE)
      Files: apps/api/tests/integration/analytics-overview.test.ts
      Do: `from > to` -> 400; `to = tomorrow` (date form) -> 400; span of 490 days accepted / 491
      -> 400; mixed date/datetime params -> 400; datetime `to` in the future -> 400; 2-day span
      buckets hourly / 3-day span daily (Q4 boundary); trailing-24h datetime span buckets hourly;
      comparison window before the first stored event -> `previous: null` (no NaN anywhere);
      prior window measured but zero -> `previous: 0` with `deltaPercent: null`.
      Done when: each case red against the Pass 2 happy-path validation.
      Refs: E-RANGE, Q1/Q4/Q5, FR-019

- [ ] T103 Implement full Q1 range validation
      Files: apps/api/src/routes/admin/analytics.ts
      Do: Validate `from`/`to`: both `YYYY-MM-DD` (London days) or both ISO 8601 UTC datetimes —
      mixing -> 400; `from <= to`; `to <= today` (date) / `to <= now` (datetime); span <= 490
      days; violations -> 400 with a field-level message per the ErrorResponse contract.
      Done when: T102 validation cases green.
      Refs: Q1, contract 400 responses

- [ ] T104 Harden bucket and delta edge behavior
      Files: apps/api/src/services/analyticsQuery.ts
      Do: Exact Q4 boundary (hour iff span <= 2 days, incl. the trailing-24h datetime case); Q5
      comparison window (preceding equal length, ending the day before `from` / at `from`
      exclusive); `previous` null only before the first stored event; zero previous -> null
      deltaPercent; no NaN/Infinity in any payload.
      Done when: T102 bucket/delta cases green.
      Refs: Q4/Q5, FR-018/FR-029

### E-TZ — timezone and DST safety

- [ ] T105 Write failing timezone bucketing test (E-TZ)
      Files: apps/api/tests/unit/analyticsQuery.test.ts
      Do: Fixed UTC timestamps for events at 23:30 and 00:30 Europe/London local time (same UTC
      day) land in different day buckets and different V3 calendar days; include a BST-transition
      date so DST is exercised.
      Done when: red if bucketing mishandles the London boundary (keep the test either way).
      Refs: E-TZ, V3/Q4, research R6, spec edge "Reporting consistency"

- [ ] T106 Verify/fix the AT TIME ZONE bucketing
      Files: apps/api/src/services/analyticsQuery.ts
      Do: Ensure every bucket, day-boundary, and returning-day computation goes through
      `AT TIME ZONE 'Europe/London'` in SQL (no Node-side date math on the hot path).
      Done when: T105 green.
      Refs: research R6, V3/Q4

### E-CONCURRENCY — visitor upsert race

- [ ] T107 Write failing concurrent-ingest test (E-CONCURRENCY)
      Files: apps/api/tests/integration/analytics-ingest.test.ts
      Do: Two simultaneous POSTs (`Promise.all`) for the same brand-new `mh_vid` -> exactly one
      `analytics_visitors` row survives and BOTH events are stored.
      Done when: red if the race loses an event or duplicates the visitor.
      Refs: E-CONCURRENCY, data-model.md §3 write pattern

- [ ] T108 Harden the visitor upsert against the race
      Files: apps/api/src/services/analyticsIngest.ts
      Do: Make the upsert race-safe (handle the concurrent-create unique violation by retrying as
      update, or use an ON CONFLICT raw query) so `firstSeenAt` is written once and never updated.
      Done when: T107 green.
      Refs: E-CONCURRENCY, V3 (firstSeenAt authoritative)

### E-SESSION — client session-window boundary

- [ ] T109 Write failing session-boundary beacon test (E-SESSION)
      Files: apps/web/src/analytics/beacon.test.ts
      Do: With fake timers: a page view at 29 m 59 s renews the same `mh_sid`; at 30 m 01 s after
      the last view the client mints a NEW `mh_sid` (cookie expired) — K3 boundary, no real time.
      Done when: red if the rolling-expiry logic is off by the boundary.
      Refs: E-SESSION, K3/V1, FR-009

- [ ] T110 Harden the beacon session-cookie renewal
      Files: apps/web/src/analytics/beacon.ts
      Do: Ensure `mh_sid` renewal keeps the same value with a fresh 30-minute expiry on every
      measured view, and an expired/absent cookie yields a new UUID.
      Done when: T109 green.
      Refs: K3, V1, research R2

### E-EMPTY — empty states end to end

- [ ] T111 Write failing api empty-window tests (E-EMPTY, api)
      Files: apps/api/tests/integration/analytics-realtime.test.ts,
      apps/api/tests/integration/analytics-overview.test.ts
      Do: Realtime with zero events in the window -> `activeVisitors: 0`, empty `topActivePages`,
      no error; overview for a range entirely before the first stored event -> zero KPIs,
      zero-filled/empty timeseries, empty topPages, five zero-valued sources, 200 not 500.
      Done when: any broken empty path red.
      Refs: E-EMPTY, US3-9, FR-023, Q6

- [ ] T112 Harden api empty-window handling
      Files: apps/api/src/services/analyticsQuery.ts
      Do: Fix any division-by-zero, null aggregation, or missing zero-fill surfaced by T111
      (shares are 0 when totals are 0 — never NaN).
      Done when: T111 green.
      Refs: E-EMPTY, Q5/Q6

- [ ] T113 Write failing web empty-state test (E-EMPTY, web)
      Files: apps/web/src/admin/analytics/dashboard-states.test.tsx
      Do: A range fully before the first event (mocked empty overview + zero realtime) -> every
      widget shows its friendly empty state, the chart shows no broken visuals, and no error
      boundary trips.
      Done when: red on any widget that renders misleading visuals when empty.
      Refs: E-EMPTY, US3-9, FR-023

- [ ] T114 Harden web empty-state propagation
      Files: apps/web/src/admin/pages/Analytics.tsx, apps/web/src/admin/analytics/* (as surfaced)
      Do: Fix any widget that fails T113.
      Done when: T113 green.
      Refs: FR-023

### E-DIALOG — custom-range validation

- [ ] T115 Write failing custom-range validation tests (E-DIALOG)
      Files: apps/web/src/admin/analytics/RangeDialog.test.tsx
      Do: `start > end` -> Apply blocked + visible message, dashboard keeps its previous range;
      `end = tomorrow` -> blocked; boundary `end = today` (Europe/London today) -> accepted; span
      of 491 days -> blocked + message; boundary 490-day span -> accepted; the message states the
      Europe/London "today" boundary for administrators in other timezones.
      Done when: each rejection path red against the Pass 2 happy-path dialog.
      Refs: E-DIALOG, Q3, FR-019, US3-6

- [ ] T116 Implement the Q3 dialog validation
      Files: apps/web/src/admin/analytics/RangeDialog.tsx
      Do: Validate on Apply: `start <= end`, `end <= today` (London), span <= 490 days; block
      Apply with the destructive-text message on violation; previous dashboard range retained
      until a valid Apply; server re-validation (Q1) remains authoritative.
      Done when: T115 green.
      Refs: Q3, research R10, FR-019

### E-A11Y — accessibility passes

- [ ] T117 Write failing accessibility edge tests (E-A11Y)
      Files: apps/web/src/components/CookieBanner.test.tsx,
      apps/web/src/admin/analytics/dashboard-states.test.tsx
      Do: axe checks on the banner and the dashboard (light and dark) -> zero critical
      violations; focus order into and out of the range pop-up is correct; Esc closes the pop-up
      WITHOUT applying a range change; visible focus on all interactive elements.
      Done when: any violation or focus-order failure red.
      Refs: E-A11Y, N5, FR-004/FR-022, constitution V

- [ ] T118 Fix the surfaced accessibility issues
      Files: apps/web/src/components/CookieBanner.tsx, apps/web/src/admin/analytics/RangeDialog.tsx,
      apps/web/src/admin/analytics/* (as surfaced)
      Do: Resolve every T117 failure without altering ported DOM structure beyond documented
      adaptations.
      Done when: T117 green.
      Refs: N5, DoD-6

### Performance budgets (M9/Q8)

- [ ] T119 Create the 32-month performance seed
      Files: apps/api/scripts/seed-analytics-perf.ts (new), .github/workflows/* (perf-check wiring)
      Do: Deterministic script seeding ~32 months of analytics data at plan-scale volume (~10^3
      views/day, < 1 M rows) with realistic path/source/visitor distribution; runnable locally and
      in CI for the Q8 checks.
      Done when: script populates the test DB reproducibly; CI can invoke it for the perf step.
      Refs: Q8, DoD-7/DoD-8, plan Scale/Scope

- [ ] T120 Benchmark the ingest budget (M9)
      Files: apps/api/scripts/bench-analytics.ts (new)
      Do: Measure `POST /api/analytics/events` p95 over a warm run against the seeded DB; budget
      p95 < 50 ms (single insert + upsert).
      Done when: measured p95 < 50 ms; result recorded in the PR/quickstart notes.
      Refs: M9, DoD-7, constitution IV

- [ ] T121 Benchmark the overview budget (Q8)
      Files: apps/api/scripts/bench-analytics.ts
      Do: Against the 32-month seed measure overview p95 for a <= 92-day span (budget < 300 ms)
      and a 490-day span (budget < 1000 ms — documented constitution-IV exception).
      Done when: both p95s within budget; results recorded.
      Refs: Q8, DoD-7, SC-007

---

## Final — Definition of Done verification (T122–T129)

- [ ] T122 Run the full quality gates and regression audit
      Files: — (verification only)
      Do: `pnpm lint`, `pnpm typecheck`, `pnpm --filter @modular-house/api test:run`,
      `pnpm --filter @modular-house/web test:run` — all green, in CI too (T007 seed); `git diff
      --name-only main` confirms no Phase 1 auth/OTP/reset/settings suite and no public
      configurator/SEO/marketing suite changed except T051/T080/T082.
      Done when: all four commands green locally and in CI; diff audit clean.
      Refs: DoD-1/DoD-8, SC-003

- [ ] T123 Verify the coverage floors
      Files: — (verification only)
      Do: Run coverage: ingest validation (analyticsIngest schema paths) and the admin analytics
      auth gate at 100% branch; overall line coverage >= 70%.
      Done when: coverage report meets both floors.
      Refs: DoD-3, constitution III

- [ ] T124 Validate the OpenAPI contract
      Files: apps/api/openapi.yaml, specs/013-panel-phase-2/contracts/analytics.openapi.yaml
      Do: Run the OpenAPI validation used by CI; confirm the three mirrored endpoint definitions
      remain semantically identical to the contract file (paths, schemas, status codes).
      Done when: validation passes; no drift between the two documents.
      Refs: DoD-8, plan §1.1

- [ ] T125 Audit cookies against the register (and confirm GoogleTag untouched)
      Files: — (verification only; register at apps/web/src/content/cookieRegister.ts)
      Do: In a browser, enumerate every cookie set on the public site and the admin panel;
      confirm the set matches the register and the rendered /cookie-policy table one-to-one
      (T-F11 green is the automated half); `git diff main` shows zero changes to GoogleTag.tsx or
      any `VITE_GA_TRACKING_ID` plumbing.
      Done when: one-to-one match confirmed; GoogleTag diff empty.
      Refs: DoD-4, K5, SC-011, FR-025, plan §1.4

- [ ] T126 Verify Lighthouse baseline, zero-CLS banner, and prerender diff
      Files: — (verification only; baseline in apps/web/.lighthouseci/)
      Do: Run Lighthouse CI on the public site; performance/SEO/accessibility scores >= the
      pre-phase baseline; the banner contributes 0 CLS (fixed-position, measured); diff the built
      prerendered HTML against the pre-phase build — only the new /cookie-policy page and the
      footer link differ, and no prerendered page contains banner markup.
      Done when: all three checks pass and are recorded.
      Refs: DoD-5, N1/N2, FR-006, SC-003

- [ ] T127 Complete the WCAG 2.1 AA pass and light/dark visual approval
      Files: specs/013-panel-phase-2/ui-components.md (§6 record)
      Do: Zero critical axe violations on banner, policy page, and dashboard in BOTH themes; full
      keyboard walk including the range pop-up and its date inputs; obtain and record the owner's
      side-by-side light/dark approval of the dashboard against the template analytics page.
      Done when: axe + keyboard pass documented; SC-010 approval recorded.
      Refs: DoD-6, SC-010, FR-022, N5

- [ ] T128 Record the performance budgets and API-down smoke
      Files: — (verification only)
      Do: Record final M9 and Q8 benchmark results (T120/T121); confirm realtime freshness <= 60 s
      (V6 30-second poll evidence from T072); run the quickstart US2 smoke: stop the API, browse
      the public site — every page fully functional with no user-visible error.
      Done when: budgets documented; SC-009 smoke passes.
      Refs: DoD-7, M9/Q8, V6, SC-006/SC-009, FR-012

- [ ] T129 Sweep FR traceability and retention review
      Files: specs/013-panel-phase-2/quickstart.md (§6 table)
      Do: Walk the quickstart §6 table: every FR-001…FR-029 points at passing tests (update test
      names if they changed during implementation); review that no code path deletes or expires
      analytics rows (§2.7 R1) and the analytics columns still match the data-model list (§2.7
      R2); confirm review-covered items (FR-024 extensibility seams, FR-027 register-only cookie
      addition, FR-028 acknowledgment seam) hold in the final diff.
      Done when: table verified current; DoD-2 satisfied; retention review noted.
      Refs: DoD-2, §2.7 R1/R2, FR-016/FR-024/FR-027/FR-028

---

## Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Phase 0 — Setup / scaffolding | T001–T008 | 8 |
| Pass 1 — Design the UI (gate: T036) | T009–T036 | 28 |
| Pass 2 — Make it work (§4.1 green) | T037–T090 | 54 |
| Pass 3 — Make it right (§4.2 green) | T091–T121 | 31 |
| Final — DoD verification | T122–T129 | 8 |
| **Total** | | **129** |

Coverage cross-check: all FR-001…FR-029 map to tasks (traceability held in quickstart §6 and
re-verified by T129); every §2 assertion K1–K5, N1–N5, M1–M10, S1–S5, V1–V6, Q1–Q8, and §2.7
R1–R2 is enforced by at least one task above; every §4.1 test id (T-B1…T-B8, T-F1…T-F11), every
§4.2 edge family (E-INGEST, E-BEACON, E-SOURCE, E-RANGE, E-TZ, E-EMPTY, E-CONCURRENCY, E-SESSION,
E-DIALOG, E-A11Y), and all three §4.3 AMEND items (T051, T080, T082) have dedicated tasks; each
contract endpoint has its own route task (T043, T066, T067) plus the openapi.yaml mirror (T069).
