# Implementation Plan: Admin Panel — Phase 2: Cookies & Performance Visualisation

**Branch**: `013-panel-phase-2` | **Date**: 2026-07-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/013-panel-phase-2/spec.md`

## Summary

Phase 2 adds first-party, anonymous visitor analytics to the public marketing site and surfaces it
in the admin panel as the panel's first real feature section. Three cooperating pieces:

1. **Cookie notice & governance (public site)** — a non-blocking notice banner ("performance
   cookies only") with an acknowledge button and a close control that counts as acknowledgment; a
   prerendered `/cookie-policy` page rendered from a single authoritative cookie register; footer
   link.
2. **Measurement pipeline (public site → API → PostgreSQL)** — a fire-and-forget beacon records
   page views (initial load + SPA route change) with anonymous visitor/session identifiers carried
   in first-party cookies (`mh_vid`, `mh_sid`); the API classifies traffic sources, filters bots,
   and stores events with **no personal data**. Collection can never slow or break the public site.
3. **Analytics dashboard (admin panel)** — an "Analytics" sidebar entry (new default landing view)
   following the Studio Admin template's analytics page: KPI strip with period-over-period deltas,
   traffic-over-time chart, realtime visitors, top pages, traffic sources, with a range selector
   (24h / 7d / 28d / 3m / "More" pop-up: 6m, 12m, 16m, custom start/end dates).

The backend adds two tables (`AnalyticsEvent`, `AnalyticsVisitor`), one public ingest endpoint, and
two authenticated read endpoints. The frontend adds a public banner + policy page and an admin
dashboard built from five newly ported primitives (`select`, `tabs`, `dialog`, `chart`, `badge`)
on top of the Phase 1 shell. UI work is explicitly split: a **design pass** first identifies and
ports every component from the template per the inventory in [ui-components.md](ui-components.md)
and passes a template-parity gate, and only then does the **implementation pass** wire data
(§5.3, research R12). No new external service or vendor.

---

## 1. Scope & Context

> The exact technical surface for this phase. **Non-goals are binding** — anything not listed as
> in-scope below is out of scope and MUST NOT be built in Phase 2.

### 1.1 In scope — modules & surfaces

**Public site (`apps/web`, outside the admin layer):**

- `CookieBanner` component mounted in `TemplateLayout`: client-only (absent from prerendered HTML),
  fixed-position (zero layout shift), acknowledge button + close ("x") control (both set the
  acknowledgment cookie), link to the policy page. Styled with the public site's existing
  Bootstrap-based styles, NOT the admin design system.
- `CookiePolicy` page at `/cookie-policy`: prerendered like other public routes, renders the cookie
  register table, linked from the banner and `Footer`.
- `cookieRegister.ts`: the single authoritative register (name, purpose, category, duration,
  set by) as a typed constant module; policy page renders from it; tests assert cookies actually
  set ⊆ register.
- `analytics/beacon.ts` (public): sets/renews `mh_vid` + `mh_sid` cookies, sends one event per
  page view (initial load + route change) via `navigator.sendBeacon` with `fetch(keepalive)`
  fallback; silent on failure; skips `/admin*` routes.

**Backend (`apps/api`):**

- `POST /api/analytics/events` (public, rate-limited): validates payload, drops bots and `/admin*`
  paths, classifies traffic source, upserts `AnalyticsVisitor`, inserts `AnalyticsEvent`. Reads
  `mh_vid`/`mh_sid` from cookies; generates one-off identifiers when absent.
- `GET /api/admin/analytics/overview?from&to` (authenticated): KPIs + comparison deltas, bucketed
  timeseries, top pages, source breakdown — one payload so all widgets stay consistent.
- `GET /api/admin/analytics/realtime` (authenticated): distinct visitors + top pages in the
  trailing 5 minutes.
- New services: `analyticsIngest.ts` (validate/filter/classify/store), `analyticsQuery.ts`
  (Europe/London-bucketed aggregations via parameterized raw SQL), `trafficSource.ts`
  (classification with extensible hostname lists).
- Prisma migration: `AnalyticsEvent`, `AnalyticsVisitor`, `AnalyticsSourceGroup` enum.
- `openapi.yaml` extended (mirrors `contracts/`).

**Admin panel (`apps/web/src/admin`):**

- **UI design pass first**: every component below is identified in
  [ui-components.md](ui-components.md) (template source, port rules, documented adaptations) and
  ported + parity-checked against the template before data wiring (§5.3 Pass 1, research R12).
- New primitives ported from the template: `select.tsx`, `tabs.tsx`, `dialog.tsx`, `chart.tsx`
  (recharts wrapper), `badge.tsx`.
- `pages/Analytics.tsx` + `analytics/` widgets: KPI strip, traffic-over-time chart, realtime card,
  top pages, traffic sources, toolbar (range select + "More" pop-up with 6m/12m/16m presets and
  custom start/end date inputs), tab row per template (Overview active; other tabs render
  placeholder panels only).
- `shell/Sidebar.tsx`: "Analytics" nav item replaces the "Coming Soon" content area as primary nav.
- Routing: `/admin/analytics` guarded route; `/admin` index redirect changes
  `settings` → `analytics`.

### 1.2 Data sources touched

- PostgreSQL via Prisma: **new** `AnalyticsEvent`, `AnalyticsVisitor` (+ enum). No existing table
  is modified. Aggregations run on-the-fly with indexes (no rollup tables in Phase 2).
- Browser cookies (first-party only): `mh_vid`, `mh_sid`, `mh_cookie_ack` (new, public site);
  Phase 1 admin cookies documented in the register, unchanged. Google Analytics cookies (`_ga`,
  `_ga_<container-id>`) set by the existing `GoogleTag` — untouched by Phase 2 code but
  documented in the register (K5).

### 1.3 Interfaces & dependencies

- Internal: Phase 1 `authenticate` middleware, `rateLimit`, `validate`, `error` middleware, Pino
  logger, Prisma client, admin `apiClient`, admin shell/theme, public `TemplateLayout`/`Footer`.
- New packages (pinned, `apps/web`): `@radix-ui/react-select`, `@radix-ui/react-tabs`
  (`@radix-ui/react-dialog` already present via `sheet`); `recharts` already a dependency.
  New package (`apps/api`): `isbot` (bot user-agent detection). No new services, no new vendors,
  no SaaS.

### 1.4 Non-goals (deliberately OUT of scope this phase)

- Opt-in consent, reject option, preference centre (FR-028 keeps the extension point only).
- Touching the existing `GoogleTag` component or its `VITE_GA_TRACKING_ID` env plumbing in any way
  (owner decision 2026-07-14: out of Phase 2 scope — do not remove, modify, consent-gate, or
  extend it). Documenting its cookies in the cookie register (K5) is in scope and does not touch
  the tag.
- Conversion/funnel/e-commerce/custom-event tracking; A/B testing; bounce rate; dwell time.
- Core Web Vitals / technical performance monitoring, error tracking, alerting.
- Geographic (country) and device breakdowns; the template realtime card's flag list is adapted out.
- Data export, import, share, scheduled reports — the template toolbar's actions menu is omitted.
- Rollup/materialized aggregate tables; a data-purge job (retention = keep everything, >= 32 months).
- Excluding staff/admin visits from public-site metrics.
- Real content in the non-Overview tabs (placeholder panels only).
- Per-role analytics permissions (any authenticated admin can read; extension point documented).
- Any change to public page content/SEO beyond the banner, footer link, and policy page.

---

## 2. Specs & Parameters (single source of truth)

> Every value below is a **checkable assertion**. One value, no prose hedging. Tests in §4 assert
> these directly; changing a value means changing the constant and its test together.

### 2.1 Cookies (K)

- K1. Public-site cookie names = exactly `mh_vid`, `mh_sid`, `mh_cookie_ack`; all first-party,
  `Path=/`, `SameSite=Lax`, `Secure` in production.
- K2. `mh_vid` value = UUID v4 (`crypto.randomUUID()`); Max-Age = **365 days**, renewed (same
  value, fresh expiry) on every measured page view; re-issued with a new value if absent.
- K3. `mh_sid` value = UUID v4; Max-Age = **30 minutes**, renewed (same value, fresh expiry) on
  every measured page view — the cookie expiry IS the session inactivity window.
- K4. `mh_cookie_ack` value = `"1"`; Max-Age = **365 days**; set by acknowledge AND by close ("x");
  banner renders only while it is absent.
- K5. Phase 2 code sets **no cookie other than K1's three**; the register lists exactly: the
  three public cookies + the Phase 1 admin cookies (refresh cookie — strictly necessary;
  theme/sidebar mirrors — functional) + the
  Google Analytics cookies set by the retained `GoogleTag` (`_ga`, `_ga_<container-id>`; category
  performance, set by Google Analytics, 2-year duration renewed per visit — browsers may cap at
  ~400 days).

### 2.2 Banner & policy page (N)

- N1. Banner is `position: fixed` (bottom); layout-shift contribution = **0** (no reflow of page
  content on mount/unmount).
- N2. Banner is absent from prerendered HTML; it mounts client-side after hydration only when
  `mh_cookie_ack` is absent.
- N3. Acknowledge and close both: set K4, hide the banner within the same frame, and never show it
  again while K4 persists. There is no dismissal path that skips K4.
- N4. Policy page route = **`/cookie-policy`**; prerendered; reachable from the banner link and a
  `Footer` link; its cookie table renders 1:1 from `cookieRegister.ts`.
- N5. Banner accessibility: reachable and operable by keyboard, `role="region"` +
  `aria-label="Cookie notice"`, no focus trap, visible focus on both controls, contrast >= 4.5:1.

### 2.3 Ingest endpoint (M)

- M1. Endpoint = `POST /api/analytics/events`; stored event → **204**; malformed body → **400**;
  bot/admin-path/rate-limited → **204/204/429** respectively, never an error the page surfaces.
- M2. Payload schema: `path` string, must start with `/`, length ∈ [1, 512]; `referrer` optional
  string, length <= 2048; `utmSource`/`utmMedium`/`utmCampaign` optional strings, length <= 100
  each. Unknown fields rejected. Body size cap = **4 KB**.
- M3. Visitor/session identifiers are read from `mh_vid`/`mh_sid` request cookies; when a cookie is
  absent the server generates a one-off UUID for that event (cookieless visitors count as new).
- M4. `isbot(User-Agent) === true` → event NOT stored, respond 204.
- M5. `path` starting with `/admin` → event NOT stored, respond 204 (defense in depth; the client
  never sends them).
- M6. Rate limit = **120 events / minute / IP**; excess → 429.
- M7. No IP address and no User-Agent string is persisted in any analytics table (both used
  transiently only).
- M8. The beacon sends exactly **one event per page view**: initial document load + each SPA route
  change to a different `pathname`; transport = `navigator.sendBeacon`, fallback
  `fetch(..., { keepalive: true })`; **0 retries**; all failures swallowed.
- M9. Ingest handler p95 latency < **50 ms** (single insert + upsert).

### 2.4 Traffic-source classification (S)

- S1. Precedence: `CAMPAIGN` (any `utmSource` present) > `SEARCH` > `SOCIAL` > `REFERRAL` >
  `DIRECT`.
- S2. `SEARCH` referrer-host list ⊇ {google, bing, duckduckgo, yahoo, ecosia, baidu, yandex};
  `SOCIAL` list ⊇ {facebook, instagram, twitter, x.com, linkedin, pinterest, tiktok, youtube,
  reddit}; both are exported constant arrays extended by adding entries only (open-closed).
- S3. Referrer with the site's own hostname, empty, or unparsable → `DIRECT`.
- S4. A session's source = the source of the session's **first** stored event; source metrics count
  **sessions**, not events.
- S5. Stored referrer field = hostname only (never the full URL, never query strings).

### 2.5 Sessions, visitors, realtime (V)

- V1. Session inactivity window = **30 minutes** (implemented by K3's rolling expiry).
- V2. Unique visitors (range) = count of distinct `visitorId` with >= 1 event in range.
- V3. Returning-visitor rate (range) = share of V2's visitors whose `AnalyticsVisitor.firstSeenAt`
  falls on an earlier **Europe/London** calendar day than their first event day inside the range.
- V4. Pages per session (range) = stored events in range / distinct sessions in range.
- V5. Realtime active visitors = distinct `visitorId` with >= 1 event in the trailing **5 minutes**;
  realtime top pages = top **5** paths in the same window.
- V6. Dashboard polls realtime every **30 s** (satisfies SC-006's 60 s ceiling).

### 2.6 Ranges, buckets & comparison (Q)

- Q1. Overview query params: `from`, `to` — both either `YYYY-MM-DD` (Europe/London calendar
  days, inclusive) or ISO 8601 UTC datetimes (sub-day ranges; used by the 24-hour preset); mixing
  the two forms → 400. Validation: `from <= to`; `to <= today` (date form) / `to <= now`
  (datetime form); span <= **490 days**; violation → 400.
- Q2. Range-selector options = exactly: `24 hours`, `7 days`, `28 days`, `3 months`, `More`;
  default = **3 months**. `More` opens the pop-up with exactly: `6 months`, `12 months`,
  `16 months`, `Custom`. All presets are rolling windows ending today. Preset → params mapping:
  `24 hours` = UTC datetimes `from = now − 24 h`, `to = now`; day presets = calendar days
  `from = today − (N − 1)`, `to = today` (7 days → today−6…today; 28 days → today−27…today);
  month presets = `from = today − N months + 1 day`, `to = today`.
- Q3. Custom range in the pop-up: two date inputs; Apply rejected with a visible message when
  `start > end`, `end > today`, or the span exceeds **490 days** (16 months, mirroring Q1); the
  dashboard keeps its previous range until a valid Apply.
- Q4. Timeseries bucket = **hour** when span <= 2 days, else **day**; buckets are Europe/London.
- Q5. Comparison period = the immediately preceding window of equal length — ending the day
  before `from` (date form) or at `from` exclusive (datetime form); when it holds no data, deltas
  render as "no prior data" (never NaN/Infinity).
- Q6. Top pages list length = **10**; source breakdown = the 5 S-groups (zero-valued groups shown).
- Q7. `/admin` index redirect target = `/admin/analytics` (replaces `/admin/settings`).
- Q8. Overview endpoint p95: < **300 ms** for spans <= 92 days; < **1000 ms** for spans up to 490
  days on a 32-month seeded dataset (documented constitution-IV exception for long ranges).

### 2.7 Retention & data hygiene (R)

- R1. No code path deletes or expires analytics rows (retention = indefinite, satisfying the
  >= 32-month floor). A purge job is future work, out of scope.
- R2. Analytics tables contain no personal data: columns are limited to the data-model list
  (no IP, no UA, no names/emails, no full referrer URLs).

---

## 3. Data Model

> Persistence IS needed. No existing table changes. Full field/constraint detail and migration
> direction live in [data-model.md](data-model.md).

**New — `AnalyticsEvent`** (append-only): `id BigInt @id @default(autoincrement())`,
`occurredAt DateTime` (server clock), `path VarChar(512)`, `visitorId Uuid`, `sessionId Uuid`,
`sourceGroup AnalyticsSourceGroup`, `referrerHost VarChar(255)?`, `utmSource VarChar(100)?`,
`utmMedium VarChar(100)?`, `utmCampaign VarChar(100)?`, `createdAt`.
Indexes: `[occurredAt]`, `[visitorId, occurredAt]`, `[sessionId, occurredAt]`.

**New — `AnalyticsVisitor`** (one row per visitor id): `visitorId Uuid @id`, `firstSeenAt`,
`lastSeenAt`. Upserted on every ingest; `firstSeenAt` is authoritative for V3.

**New — enum `AnalyticsSourceGroup`**: `DIRECT | SEARCH | SOCIAL | REFERRAL | CAMPAIGN`.

**Not persisted — cookie register**: a typed constant module (`cookieRegister.ts`), not a table;
the policy page renders it and tests assert set-cookies ⊆ register (US4). Rationale in research R9.

**Migration direction**: one additive forward migration (`add_analytics_events`); reversible by
dropping the two tables and the enum; no existing data touched.

---

## 4. Test Design

> One behavioral scenario per acceptance criterion (happy path), plus edge/failure cases pulled
> directly from §2 boundaries. **Iteration handling** is explicit: amend vs add — passing coverage
> is never silently rewritten.

### 4.1 Behavioral scenarios (happy path, one per acceptance criterion)

Backend (Vitest + supertest, seeded test DB, injected clock):

- T-B1 (US2-1, M1/M2): `POST /api/analytics/events` with valid payload + cookies → 204; event row
  has path/time/source/visitor/session; `AnalyticsVisitor` upserted.
- T-B2 (US2-2, V1): two events within 30 min share `sessionId`; an event with a fresh `mh_sid`
  starts a new session (cookie-rolling behavior asserted at the client, grouping asserted here).
- T-B3 (US2-3, V3): visitor with `firstSeenAt` yesterday and an event today → counted returning in
  today's range; brand-new visitor → new.
- T-B4 (US2-8, S1–S4): referrer/utm permutations map to SEARCH/SOCIAL/REFERRAL/CAMPAIGN/DIRECT;
  session source = first event's source.
- T-B5 (US3-2, V2–V4, Q5): overview returns page views, unique visitors, sessions,
  returning-visitor rate, pages per session + deltas versus the preceding equal window.
- T-B6 (US3-3/4/5, Q1/Q4/Q6, V5): overview honors `from`/`to`, buckets by day (and hour for a
  <= 2-day span), returns top-10 pages with share and the 5 source groups; realtime returns
  trailing-5-minute distinct visitors + top-5 pages.
- T-B7 (US3-12): overview + realtime without a valid session → 401 (security-focused test,
  constitution I).
- T-B8 (US4-1, R2/M7): stored analytics rows contain only the modeled columns; no IP/UA/full-URL
  anywhere (schema + payload audit test).

Frontend (Vitest + @testing-library/react):

- T-F1 (US1-1, N1/N2): fresh state → banner renders with the exact statement, acknowledge, close,
  policy link; fixed overlay; not rendered when `mh_cookie_ack=1`.
- T-F2 (US1-2/3, N3, K4): acknowledge → cookie set + banner gone; close ("x") → identical effect;
  remount shows no banner.
- T-F3 (US1-4/6/9, N5): banner never blocks content; keyboard operable, focus visible, correct
  role/label; cleared cookies → banner returns.
- T-F4 (US1-3, US4-2, N4): `/cookie-policy` renders the register 1:1; footer links to it.
- T-F5 (US2-1, M8): beacon fires once on load and once per route change; skips `/admin*`;
  sendBeacon used, fetch-keepalive fallback, failures silent (page never errors).
- T-F6 (US3-1, Q7): sidebar shows "Analytics"; `/admin` index lands on the dashboard inside the
  shell.
- T-F7 (US3-2..5): dashboard renders KPI strip with deltas, chart, realtime card, top pages,
  sources from mocked overview/realtime responses.
- T-F8 (US3-3, Q2): selector shows exactly 24h/7d/28d/3m/More, defaults 3m; switching refetches
  with the right `from`/`to` and updates every widget.
- T-F9 (US3-4/5, Q2/Q3): "More" opens the pop-up with 6m/12m/16m/custom; preset apply closes +
  updates all widgets; valid custom range applies.
- T-F10 (US3-9..11, 13): empty-state rendering per widget; light/dark rendering; keyboard
  operability incl. pop-up and date inputs; single-column stacking at mobile width.
- T-F11 (US4-1, K5): register-consistency test — every cookie name Phase 2 code can set appears in
  the register, and the register matches the policy-page table one-to-one.

### 4.2 Edge cases & failure modes (boundary values from §2)

- E-INGEST: path of 512 chars accepted / 513 rejected (M2); missing `path` → 400; unknown field →
  400; 4 KB+1 body → 400; no cookies → one-off UUIDs stored (M3); bot UA → 204 not stored (M4);
  `/admin/settings` path → 204 not stored (M5); 121st request in a minute from one IP → 429 (M6).
- E-BEACON: ingest endpoint down/500 → no console error surfaces, page functional (M8, SC-009);
  sendBeacon unavailable → keepalive fetch used; no retry after failure (0 retries).
- E-SOURCE: `utmSource` + search referrer → CAMPAIGN (S1 precedence); own-host referrer → DIRECT
  (S3); unparsable referrer → DIRECT; unknown external host → REFERRAL.
- E-RANGE: `from > to` → 400; `to = tomorrow` → 400; span 490 days accepted / 491 rejected (Q1);
  2-day span buckets hourly / 3-day span daily (Q4 boundary); preceding window empty → "no prior
  data" delta, no NaN (Q5); mixed date/datetime params → 400; datetime `to` in the future → 400;
  trailing-24 h datetime span buckets hourly.
- E-DIALOG: custom `start > end` → Apply blocked + message, previous range kept (Q3); `end` set to
  tomorrow → blocked; boundary `end = today` accepted; span of 491 days → blocked + message;
  boundary 490-day span accepted (Q3).
- E-SESSION: event at 29m59s stays in session; at 30m01s the client mints a new `mh_sid`
  (K3 boundary, clock-injected).
- E-EMPTY: range fully before first event → every widget empty state (US3-9); realtime with zero
  events → zero visitors, no error.
- E-CONCURRENCY: two simultaneous ingests for the same new visitor id → single `AnalyticsVisitor`
  row (upsert race), both events stored.
- E-TZ: events at 23:30 and 00:30 Europe/London land on different report days even when their UTC
  day is the same (V3/Q4, DST-safe).
- E-A11Y: banner and dashboard axe checks; focus order into and out of the pop-up; Esc closes the
  pop-up without applying.

### 4.3 Iteration handling

**Existing tests to AMEND** (behavior changes; update, do not delete):

- Any `TemplateLayout` render test — extend expectations for the `CookieBanner` mount and the
  beacon hook (no other `TemplateLayout` behavior changes).
- Admin routing tests asserting `/admin` index → `/admin/settings` — amend to `/admin/analytics`
  (Q7).
- `apps/web/src/admin/shell` tests asserting the sidebar "Coming Soon" content area — amend to the
  "Analytics" nav item (H7 successor); keyboard/a11y shell tests extend to the new nav item.

**New tests to ADD** (no prior coverage):

- API: `analytics-ingest`, `analytics-overview`, `analytics-realtime` integration suites;
  `trafficSource`, `analyticsQuery` (bucketing/deltas/returning-rate), ingest-validation unit
  suites (validation + auth gate at 100% branch, constitution III).
- Web public: `CookieBanner`, `CookiePolicy`, `cookieRegister` consistency, `beacon` unit suites.
- Web admin: `Analytics` page, toolbar/range pop-up, each widget, new primitives (`select`,
  `tabs`, `dialog`, `chart`, `badge`) render/keyboard suites — primitive and static-widget suites
  are authored in Pass 1 with the ports (against fixture data, per ui-components.md §6), before
  data wiring exists.

**Do NOT touch:** Phase 1 auth/OTP/reset/settings suites; public configurator/SEO/marketing-page
suites (except the two amendments above) — they must stay green to prove no regression (SC-003).

---

## 5. Implementation Boundaries

> The minimal code surface that turns each test green. Two passes: Pass 1 = minimal implementation
> for §4.1 scenarios; Pass 2 = hardening for §4.2 edge cases.

### 5.1 Files/areas to TOUCH

Backend (`apps/api`):

- `prisma/schema.prisma` + migration `add_analytics_events` — two tables + enum (§3).
- New `src/services/analyticsIngest.ts`, `src/services/analyticsQuery.ts`,
  `src/services/trafficSource.ts`.
- New `src/routes/analytics.ts` (public ingest) and `src/routes/admin/analytics.ts`
  (overview + realtime); wire both in `app.ts`; reuse `rateLimit`, `validate`, `authenticate`.
- `openapi.yaml` — the three endpoints (mirrors `contracts/analytics.openapi.yaml`).

Public web (`apps/web/src`):

- New `components/CookieBanner.tsx`, `routes/CookiePolicy.tsx`, `content/cookieRegister.ts`,
  `analytics/beacon.ts`.
- `components/TemplateLayout.tsx` — mount `CookieBanner` + beacon hook.
- `components/Footer.tsx` — add the `/cookie-policy` link.
- `App.tsx` + prerender route list — add `/cookie-policy`; change `/admin` index redirect.

Admin web (`apps/web/src/admin`):

- New `ui/select.tsx`, `ui/tabs.tsx`, `ui/dialog.tsx`, `ui/chart.tsx`, `ui/badge.tsx` (template
  ports).
- New `pages/Analytics.tsx` + `analytics/` (KpiStrip, TrafficChart, RealtimeCard, TopPages,
  TrafficSources, RangeToolbar, RangeDialog, `useAnalytics` data hooks, range math helpers).
- `shell/Sidebar.tsx` — Analytics nav item.
- `package.json` — add `@radix-ui/react-select`, `@radix-ui/react-tabs` (web); `isbot` (api).

### 5.2 What NOT to build yet (guardrails)

- No ad-hoc UI: every admin component this phase ships must appear in
  [ui-components.md](ui-components.md); anything missing goes through the inventory (design pass)
  first, never straight to code.
- `GoogleTag.tsx` and its `VITE_GA_TRACKING_ID` plumbing stay untouched (owner decision, §1.4);
  its cookies are documented in `cookieRegister.ts` (K5) without touching the tag.
- No rollup tables, no cron/purge jobs, no export/share/import actions, no realtime websockets
  (polling only).
- No consent gating of the beacon (notice model), no reject button, no preference centre.
- No calendar-grid date picker — two native date inputs styled by the admin `input` primitive.
- No geo/device columns or lookups; no UA persistence; no per-role permission rows for analytics.
- No content in non-Overview tabs beyond the template's placeholder panel.
- No changes to `@modular-house/ui`, the configurator, or any marketing page content.

### 5.3 Three-pass order (design pass separated from implementation)

- **Pass 1 (design the UI — template fidelity):** confirm/extend the component inventory in
  [ui-components.md](ui-components.md) → port `select`, `tabs`, `dialog`, `chart`, `badge` per its
  compatibility rules → build the widget compositions (KpiStrip, TrafficChart, RealtimeCard,
  TopPages, TrafficSources, RangeToolbar, RangeDialog) against **fixture data** → primitive +
  static-widget tests green → side-by-side parity gate against the template page in light AND dark
  (ui-components.md §6). **No data wiring in this pass; Pass 2 does not start until the gate
  passes.**
- **Pass 2 (make it work):** migration → ingest service/route (happy path) → beacon + cookies →
  banner + policy page + register → overview/realtime endpoints → wire the Pass 1 widgets to live
  data → sidebar/landing wiring → green on §4.1.
- **Pass 3 (make it right):** ingest boundaries (M2–M7), source precedence table, range/dialog
  validation (Q1/Q3), bucket + timezone + delta edges (Q4/Q5, E-TZ), empty states, concurrency
  upsert, a11y passes, performance budgets (M9/Q8) → green on §4.2.

---

## 6. Definition of Done

- DoD-1: Every §4.1 scenario and §4.2 edge case has a passing automated test in CI.
- DoD-2: Every FR (FR-001…FR-029) traces to at least one test — traceability table maintained in
  [quickstart.md](quickstart.md); no untested new code path.
- DoD-3: Ingest validation + admin analytics auth gate at **100% branch coverage**; overall line
  coverage >= 70% (constitution III).
- DoD-4: The only cookies Phase 2 code sets are the cookie register's entries, and the register
  matches the policy page one-to-one (K5, SC-011).
- DoD-5: Public-site Lighthouse (performance, SEO, accessibility) scores >= pre-phase baseline
  (SC-003); banner contributes zero CLS (N1); prerendered HTML unchanged except the policy page
  and footer link (N2).
- DoD-6: WCAG 2.1 AA on banner, policy page, and dashboard: zero critical axe violations, full
  keyboard operability including the range pop-up (SC-010 visual approval in light + dark); every
  admin UI component traces to its template source or documented adaptation in
  [ui-components.md](ui-components.md), and the Pass 1 parity gate was passed before data wiring.
- DoD-7: Performance budgets validated post-implementation: M9 (ingest p95 < 50 ms), Q8 (overview
  p95 < 300 ms <= 92-day span; < 1 s <= 490-day span on 32-month seed), SC-006 (realtime <= 60 s),
  SC-009 (site fully functional with the API down).
- DoD-8: `lint`, `typecheck`, `test:run` (web + api), and OpenAPI contract validation pass; CI
  seed updated so analytics suites run green in CI (not just against the local DB); no emoji in
  code; conventional naming; extension points (register entries, source lists, tabs, widgets)
  follow Open-Closed.

---

## Technical Context

**Language/Version**: TypeScript 5.6.3 (frontend & backend)
**Primary Dependencies**:
- Frontend: React 18.3, Vite 6, React Router 6, existing admin layer (Tailwind v4 + OKLCH tokens,
  Radix primitives); `recharts` (already present) for the chart primitive; **new (pinned):**
  `@radix-ui/react-select`, `@radix-ui/react-tabs`.
- Backend: Express 4, Prisma 5, Zod, Pino, express-rate-limit, cookie-parser (all present);
  **new (pinned):** `isbot`.
**Storage**: PostgreSQL via Prisma — new `AnalyticsEvent` + `AnalyticsVisitor` tables + one enum;
Europe/London bucketing via parameterized raw SQL (`AT TIME ZONE`).
**Testing**: Vitest + @testing-library/react (web), Vitest + supertest (api, seeded port-5434 test
DB), injected clock for session/range determinism, OpenAPI contract validation, Lighthouse CI for
the public-site budget.
**Target Platform**: Web SPA (latest 2 versions of Chrome/Firefox/Safari/Edge); public site remains
SSG-prerendered; admin remains client-only.
**Project Type**: Web application (pnpm monorepo: `apps/web`, `apps/api`, `packages/*`).
**Performance Goals**: ingest p95 < 50 ms; overview p95 < 300 ms (<= 92-day span) / < 1 s (up to
490-day span); realtime freshness <= 60 s; public-site Lighthouse >= baseline; banner CLS = 0.
**Constraints**: cookies 365 d (`mh_vid`, `mh_cookie_ack`) / 30 min rolling (`mh_sid`); session
window 30 min; realtime window 5 min, poll 30 s; range span <= 490 days; ingest rate limit
120/min/IP; payload <= 4 KB; top pages = 10; retention indefinite (>= 32 months); no PII at rest.
**Scale/Scope**: marketing-site traffic (~10³ views/day; <1 M rows over 32 months — on-the-fly
aggregation with indexes suffices); 4 user stories; 3 new API endpoints; 1 new public page +
1 banner; 1 admin page + 5 primitives + 7 widgets; 2 new tables.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Security & Privacy First (NON-NEGOTIABLE)

- **Data minimization by design**: anonymous random identifiers only; no IP, no UA, no full
  referrer URLs, no names/emails at rest (M7/R2/S5 asserted by T-B8).
- **Threat model**: ingest flooding (M6 rate limit + 4 KB cap + validation), forged events
  (validation + rate limit; forgery beyond that is an accepted analytics-accuracy risk, not a
  security risk — no trust decisions read from analytics data), dashboard data exposure
  (authenticate-gated endpoints, T-B7 security test), cookie theft (cookies contain only random
  identifiers — no session/credential value; SameSite=Lax, Secure).
- **Security tests**: 401 gate on both admin endpoints; validation suite at 100% branch (DoD-3).

### II. Reliability & Observability

- Existing `GET /health` retained. Pino structured logs with correlation id on all three routes;
  ingest logs counters for stored / bot-dropped / admin-dropped / rate-limited (no PII in logs).
  Failure isolation: beacon fire-and-forget guarantees public-site UX independent of API health
  (SC-009 test).

### III. Test Discipline

- Deterministic suites: injected clock for session boundary, realtime window, range math, and the
  E-TZ DST case; seeded test DB (CI seed updated — local-DB-only green is a known trap); no flaky
  polling tests (fake timers). Coverage targets per DoD-3.

### IV. Performance & Efficiency

- Budgets M9/Q8 declared pre-implementation and validated post-implementation. **Documented
  exception**: overview spans > 92 days may exceed the 300 ms core-endpoint budget up to 1 s —
  accepted for an internal admin read on long ranges; the extension path (rollup tables) is parked
  deliberately (YAGNI at current volume). Public-site LCP unaffected (banner is fixed-position,
  client-only, no new render-blocking assets).

### V. Accessibility & Inclusive UX

- Banner: keyboard operable, labelled region, no trap, visible focus (N5, E-A11Y). Dashboard:
  keyboard-operable toolbar/pop-up/date inputs, chart data available as text (KPI numbers + lists
  mirror chart content), axe checks in both themes, mobile single-column (US3-10).

**Result: PASS (no violations).** Complexity Tracking intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/013-panel-phase-2/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── ui-components.md     # Phase 1 output: UI component inventory + port rules + parity gate
├── quickstart.md        # Phase 1 output (incl. FR->test traceability)
├── contracts/           # Phase 1 output
│   └── analytics.openapi.yaml
└── tasks.md             # Created by /speckit.tasks (NOT here)
```

### Source Code (repository root)

```text
apps/api/
├── prisma/
│   ├── schema.prisma                  # + AnalyticsEvent, AnalyticsVisitor, AnalyticsSourceGroup
│   └── migrations/                    # + add_analytics_events
├── src/
│   ├── services/
│   │   ├── analyticsIngest.ts         # new: validate, bot/admin filter, classify, store
│   │   ├── analyticsQuery.ts          # new: KPIs, deltas, buckets, top pages, sources, realtime
│   │   └── trafficSource.ts           # new: classification + extensible hostname lists
│   └── routes/
│       ├── analytics.ts               # new: POST /api/analytics/events (public)
│       └── admin/analytics.ts         # new: GET overview, GET realtime (authenticated)
└── openapi.yaml                       # + 3 endpoints

apps/web/src/
├── analytics/beacon.ts                # new: cookies + page-view beacon (public site)
├── components/
│   ├── CookieBanner.tsx               # new: notice banner (Bootstrap-styled, public)
│   ├── TemplateLayout.tsx             # amended: +CookieBanner, +beacon
│   └── Footer.tsx                     # amended: cookie-policy link
├── content/cookieRegister.ts          # new: single authoritative cookie register
├── routes/CookiePolicy.tsx            # new: prerendered /cookie-policy page
└── admin/
    ├── ui/{select,tabs,dialog,chart,badge}.tsx   # new template ports
    ├── pages/Analytics.tsx            # new dashboard page
    ├── analytics/                     # new: KpiStrip, TrafficChart, RealtimeCard, TopPages,
    │                                  #      TrafficSources, RangeToolbar, RangeDialog, hooks
    └── shell/Sidebar.tsx              # amended: Analytics nav item
```

**Structure Decision**: Same monorepo split as Phase 1. Public-facing pieces (banner, policy page,
register, beacon) live in the public web tree with the site's existing styling — the admin design
system stays isolated in `apps/web/src/admin`. The API gains one public route file and one admin
route file rather than a separate service; aggregation logic is service-layer so a future rollup
strategy can replace `analyticsQuery` internals without touching routes (Open-Closed).

## Complexity Tracking

> No constitution violations — table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | —          | —                                    |
