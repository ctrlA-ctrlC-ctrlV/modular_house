# Phase 0 Research: Admin Panel — Phase 2: Cookies & Performance Visualisation

**Branch**: `013-panel-phase-2` | **Date**: 2026-07-14 | **Plan**: [plan.md](plan.md)

All unknowns from Technical Context are resolved below. Format per decision: Decision / Rationale /
Alternatives considered.

---

## R1. Beacon transport: sendBeacon with keepalive fallback, fire-and-forget

**Decision**: `navigator.sendBeacon(url, blob)`; fallback `fetch(url, { method: "POST",
keepalive: true })` when sendBeacon is unavailable or returns false. Zero retries; all errors
swallowed; beacon module has no import into render-critical paths.

**Rationale**: sendBeacon is non-blocking by contract (survives navigation, cannot delay paint),
which directly implements FR-012/SC-009. No retries keeps the failure mode "undercount", never
"degrade the site".

**Alternatives considered**: Axios/XHR with retry queue — rejected: retry logic adds failure
surface for zero product value at this traffic volume. Server-side log parsing (no JS at all) —
rejected: cannot see SPA route changes, no session/visitor continuity, nginx logs contain IPs.

## R2. Identity model: two client-set cookies, server-authoritative first-seen

**Decision**: `mh_vid` (UUID v4, 365-day rolling Max-Age, renewed on each measured view — only
visitors absent longer than 12 months lose identity) identifies the visitor; `mh_sid` (UUID v4,
30-minute rolling Max-Age, renewed on each measured view) identifies the session — the cookie expiry itself
implements the 30-minute inactivity window. Cookies are set by the beacon script (client-side,
required because the public site is SSG — no server renders pages). The API reads both from
request cookies; `AnalyticsVisitor.firstSeenAt` (server clock) is authoritative for
new-vs-returning classification.

**Rationale**: Client-set cookies are the only option under SSG; server-side first-seen keeps the
returning-visitor metric trustworthy even if a client clock or cookie value is odd. The rolling
session cookie avoids any server-side sessionization pass (KISS) while matching the spec's
30-minute window exactly.

**Alternatives considered**: Daily-salted hash of IP+UA (Plausible-style, cookieless) — rejected:
owner requires cross-day returning visitors. Server-computed sessions via gap analysis at query
time — rejected: more complex queries for identical output at this volume; can be added later
without schema change (session id would simply be recomputed).

## R3. Ingest contract: cookies for identity, minimal validated body

**Decision**: `POST /api/analytics/events` with body `{ path, referrer?, utmSource?, utmMedium?,
utmCampaign? }` (Zod-validated, unknown keys rejected, 4 KB cap); identity from cookies; absent
cookies → server-generated one-off UUIDs (cookieless visitors count as new, per spec). Responses:
204 stored, 204 dropped (bot / admin path), 400 malformed, 429 rate-limited.

**Rationale**: Same-origin `/api` proxy means first-party cookies flow automatically; keeping
identifiers out of the JS payload shrinks the schema and the spoofing surface. Dropped-but-204
keeps bots from learning they are filtered.

**Alternatives considered**: Identifiers in the body — rejected: duplicates what cookies already
carry. Authenticated ingest — rejected: visitors are anonymous by definition.

## R4. Bot exclusion: `isbot` package at ingest, drop before store

**Decision**: Evaluate `isbot(request.get("user-agent"))` at ingest; matches are not stored
(respond 204). Pin the dependency. UA string itself is never persisted.

**Rationale**: FR-013 requires exclusion; filtering at ingest keeps every downstream query honest
without WHERE clauses. `isbot` is a maintained, dependency-free list far more complete than a
hand-rolled regex; it is a library, not a vendor/service, so the no-new-vendor decision holds.

**Alternatives considered**: Hand-rolled regex — rejected: silently stale. Store-then-filter at
query time — rejected: every query pays; crawler bursts still bloat the table.

## R5. Traffic-source classification: server-side, session-attributed

**Decision**: Classify per event at ingest with precedence CAMPAIGN (any `utmSource`) > SEARCH >
SOCIAL > REFERRAL > DIRECT, driven by two exported hostname constant lists (extend-by-append,
Open-Closed). Persist hostname only (S5). Source metrics aggregate by the **session's first
event** source (S4). Own-host/empty/unparsable referrer → DIRECT.

**Rationale**: SPA route-change events carry no meaningful referrer, so per-event attribution
would drown sources in "direct" noise; first-event-of-session attribution matches how every
analytics product defines acquisition. Hostname-only storage keeps referrer query strings (a PII
vector) out of the database.

**Alternatives considered**: Client-side classification — rejected: list updates would require
redeploying the public site and trusting the client. Storing full referrer URLs — rejected:
FR-015/R2 privacy posture.

## R6. Timezone bucketing: store UTC, aggregate with `AT TIME ZONE 'Europe/London'`

**Decision**: All timestamps stored UTC (`timestamptz`). Daily/hourly buckets, day boundaries for
returning-visitor classification, and `from`/`to` range endpoints are computed in SQL via
parameterized `$queryRaw` with `AT TIME ZONE 'Europe/London'`.

**Rationale**: Postgres owns the DST rules (the E-TZ test pins the 23:30/00:30 case), satisfying
the spec's single-reporting-timezone edge case without a date library on the hot path. Prisma's
`groupBy` cannot express timezone-shifted date_trunc, so raw parameterized SQL is the supported
route; parameters keep it injection-safe.

**Alternatives considered**: Bucketing in Node with a TZ library — rejected: ships DST math into
application code and drags full result sets over the wire. Storing pre-shifted local timestamps —
rejected: unrecoverable if the reporting timezone ever changes.

## R7. Aggregation strategy: on-the-fly SQL with indexes, no rollups

**Decision**: Compute KPIs, deltas, buckets, top pages, and sources directly from
`AnalyticsEvent` with the indexes in data-model.md. One `overview` endpoint returns all
range-dependent widgets in a single payload; `realtime` is a separate cheap query polled every
30 s.

**Rationale**: At marketing-site volume (< 1 M rows over 32 months) indexed aggregation meets Q8
comfortably; rollup tables would add write-path complexity and a consistency liability for no
measurable gain (YAGNI). The single payload guarantees cross-widget consistency on range change
(US3-3). `analyticsQuery` is the seam: a future rollup implementation replaces its internals
without touching routes or the contract (Open-Closed).

**Alternatives considered**: Daily rollup tables — parked as the documented scale path.
Materialized views — rejected: refresh scheduling exceeds Phase 2 scope.

## R8. Banner rendering: client-only, fixed-position, Bootstrap-styled

**Decision**: `CookieBanner` mounts from `TemplateLayout` after hydration, only when
`mh_cookie_ack` is absent; `position: fixed` bottom overlay; styled with the public site's
existing Bootstrap classes; `role="region"` + `aria-label`, both controls keyboard-operable, no
focus trap. It is intentionally absent from prerendered HTML.

**Rationale**: Fixed positioning makes CLS contribution zero by construction (N1). Keeping it out
of prerendered HTML means crawlers see unchanged pages (SC-003/SEO) and acknowledged visitors get
zero banner flash. The admin design system must not leak into the public site (Phase 1 isolation
rule), so Bootstrap styling is mandatory here.

**Alternatives considered**: Prerendered banner hidden by JS — rejected: banner HTML in every
crawled page + flash-of-banner for acknowledged visitors. `role="dialog"`/modal — rejected: the
notice is non-blocking by spec (FR-004).

## R9. Cookie register: typed constant module, not a database table

**Decision**: `apps/web/src/content/cookieRegister.ts` exports the register (name, purpose,
category, duration, set by) as a typed readonly array; `CookiePolicy` renders it; a consistency
test asserts every cookie name the codebase can set appears in it. The register also documents
the cookies set by the retained Google Analytics tag (`_ga`, `_ga_<container-id>`; K5), keeping
FR-025's completeness guarantee honest without touching the tag.

**Rationale**: The register changes only when code that sets cookies changes, so source control is
its natural single source of truth — reviewed in the same diff (US4/FR-025/FR-027: adding a cookie
= adding an entry; the page needs no redesign). The policy page stays prerenderable with no data
dependency. A table would add CRUD surface no one asked for.

**Alternatives considered**: DB table + admin editor — rejected: divorces the register from the
code that sets cookies, inviting drift in both directions; parked until a content-migration phase
gives it a reason to exist.

## R10. Range selector and custom-range pop-up mechanics

**Decision**: Toolbar `Select` with exactly 24 hours / 7 days / 28 days / 3 months / More
(default 3 months, per the owner's spec edit — the template's own toolbar values differ and are
adapted). "More" opens a `Dialog` (ported primitive; `@radix-ui/react-dialog` already present via
`sheet`) offering 6 / 12 / 16-month rolling presets and a custom pair of native
`<input type="date">` fields styled by the admin `input` primitive; Apply disabled with a visible
message when `start > end`, `end > today`, or the span exceeds 490 days (16 months, Q3). Client
computes `from`/`to` as Europe/London `YYYY-MM-DD` for day/month presets and custom ranges, and
as UTC datetimes (`now − 24 h`, `now`) for the 24-hour preset (Q1/Q2); the server re-validates
(Q1) — never trust the client.

**Rationale**: Native date inputs are keyboard- and mobile-accessible for free and avoid porting
the template's calendar stack (react-day-picker) for two fields (KISS). Dialog reuses an existing
Radix dependency. Spec values supersede template toolbar values; documented as a design
adaptation. 16 months is intentional per the spec's assumption.

**Alternatives considered**: Porting `Calendar` + `Popover` range picker — parked; slots in behind
the same Apply contract later without contract change. Free-text dates — rejected: validation and
a11y burden.

## R11. Template fidelity adaptations for the analytics page

**Decision**: Port the template analytics page's Overview composition (KPI strip, main chart +
realtime side card, top pages + sources row) and its tab row with the non-Overview tabs rendering
the template's own "coming soon" placeholder panels. Adaptations, each documented here: KPI set is
the spec's five metrics; the traffic-quality chart becomes a page-views/sessions-over-time
composed chart in identical visual style; the realtime card shows active-visitor count + top-5
active pages (no country flags — geo is out of scope); the toolbar's export/import/share menu is
omitted (export is out of scope); range options per R10.

**Rationale**: Keeps SC-010 (side-by-side visual approval) achievable while honoring the spec's
out-of-scope list; every adaptation maps to a spec decision rather than taste. Placeholder tabs
preserve the template look and give later phases their extension point (FR-024).

**Alternatives considered**: Omitting the tab row — rejected: visibly diverges from the template
and removes the cheap extension point. Inventing data for country flags — rejected: no geo lookup
in scope, and fake data on a real dashboard is a trust failure.

## R12. UI design is a separate pass: component inventory before implementation

**Decision**: All admin UI for this phase is identified up front in
[ui-components.md](ui-components.md) — a design artifact mapping every primitive and widget to its
source in `E:\Zhaoxiang_Qiu\work\SDeal\next_shadcn_admin_dashboard` (or to a documented
adaptation), plus the Next.js-to-Vite compatibility rules (strip `"use client"`, rewrite `@/`
aliases, no `next/*` modules, replace `lucide-react` imports with the Phase 1 inline-SVG icon
convention, keep `data-slot`/`data-variant` attributes and token classes). Implementation Pass 1
ports and composes these components against fixture data and passes a side-by-side parity check
(light + dark) BEFORE any data wiring begins (plan §5.3). Components not in the inventory are not
built; extending the UI means extending the inventory first (Open-Closed).

**Rationale**: Separating the UI design process from the implementation process is an owner
requirement (2026-07-14). The inventory makes template fidelity checkable before behavior exists
(brief goal: "fully follow the UI design of template"; SC-010), prevents ad-hoc component drift,
and gives later phases a reviewed extension path (add a row, then port).

**Alternatives considered**: Porting components ad hoc while building features — rejected: design
decisions get made implicitly inside implementation diffs, which is exactly the drift the owner
wants excluded. Building custom components styled "close to" the template — rejected: the template
source is the design source of truth; divergence must be a documented adaptation, not an accident.

---

**All NEEDS CLARIFICATION: resolved.** No open unknowns remain for Phase 1 design.
