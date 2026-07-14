# Phase 2 Quickstart: Admin Panel — Phase 2 (Cookies & Performance Visualisation)

**Feature**: `013-panel-phase-2` | **Date**: 2026-07-14

Developer entry point for Phase 2: how to run it, how to verify each user story, and the
FR -> test traceability table that satisfies Definition of Done (DoD-2).

---

## 1. Prerequisites

- Node + pnpm (monorepo: `apps/web`, `apps/api`).
- PostgreSQL reachable via `DATABASE_URL` (tests use the port-5434 test DB; start Docker Desktop
  first if it is unreachable).
- Phase 1 (`012-panel-phase-1`) applied: admin shell, auth, seeded admin account.
- No new env vars.

## 2. Setup

```powershell
pnpm install          # adds @radix-ui/react-select, @radix-ui/react-tabs (web); isbot (api)
# apply the new migration (adds analytics_events, analytics_visitors, AnalyticsSourceGroup enum)
pnpm --filter @modular-house/api db:migrate
# seed (analytics test fixtures are seeded for tests only; production seed adds no analytics rows)
pnpm --filter @modular-house/api db:seed
```

## 3. Run

```powershell
pnpm --filter @modular-house/api dev      # API (ingest + admin analytics endpoints)
pnpm --filter @modular-house/web dev      # public site + admin under /admin
```

## 4. Verify each user story (manual smoke)

### US1 — Cookie notice & policy (public site)

1. Open any public page in a fresh/incognito browser -> bottom notice banner appears: performance
   cookies statement, "Acknowledge", a close ("x"), and a Cookie Policy link. Page content does not
   shift and remains fully usable.
2. Click Acknowledge -> banner gone; browse and reload -> stays gone (`mh_cookie_ack` cookie,
   365 days).
3. Repeat in a fresh session using the close ("x") instead -> identical behavior.
4. Follow the policy link -> `/cookie-policy` lists every cookie (the three `mh_*` public cookies
   + Phase 1 admin cookies) with name, purpose, category, duration. Footer links to the same page.
5. Keyboard-only: banner controls reachable, focus visible, no trap.

### US2 — Anonymous measurement

1. With DevTools open, browse public pages -> one `POST /api/analytics/events` per page view
   (initial load + each route change), `mh_vid` (365 d) and `mh_sid` (30 min, renewed) cookies set.
2. Navigate to `/admin` -> no beacon requests fire.
3. Stop the API and browse the public site -> pages work perfectly; no visible errors.
4. Inspect `analytics_events` rows -> path/time/source/visitor/session only; no IP, UA, or full
   referrer URL anywhere.
5. Arrive via a `?utm_source=...` link -> event classified `campaign`; via a Google result ->
   `search`; direct entry -> `direct`.

### US3 — Analytics dashboard

1. Sign in -> you land on `/admin/analytics` (new default); sidebar shows "Analytics".
2. Overview shows: KPI strip (page views, unique visitors, sessions, returning-visitor rate,
   pages per session) with deltas, traffic chart, realtime card, top pages, sources.
3. Switch range: 24 hours / 7 days / 28 days / 3 months (default) -> all widgets update together.
4. "More" -> pop-up with 6 / 12 / 16 months and custom start/end date inputs. Apply a preset ->
   widgets update. Set start after end, or end in the future -> Apply blocked with a message.
5. Open a second browser on the public site -> realtime count reflects it within 60 s.
6. Toggle dark mode; resize to mobile width; tab through toolbar, pop-up, lists -> all legible,
   stacked, keyboard-operable.
7. Sign out, request `/admin/analytics` directly -> redirected to login.

### US4 — Cookie register governance

1. Compare cookies in DevTools (public + admin) against `/cookie-policy` -> one-to-one match.
2. Add a dummy entry to `cookieRegister.ts` locally -> policy page renders it with no other change.

## 5. Test commands

```powershell
pnpm --filter @modular-house/api test:run     # ingest, overview, realtime, sources, privacy audit
pnpm --filter @modular-house/web test:run     # banner, policy, register, beacon, dashboard, primitives
pnpm lint; pnpm typecheck                      # workspace-wide
```

CI note: analytics suites need the CI seed (green against the local 5434 DB alone is not proof —
update the CI seed with the analytics fixtures, per DoD-8).

## 6. FR -> test traceability (DoD-2)

Test IDs reference [plan.md §4](plan.md). "Review" = verified in code review against the named
plan assertion; "Audit" = measured post-implementation (DoD-5/DoD-7).

| FR | Requirement (short) | Covered by |
|----|---------------------|------------|
| FR-001 | Banner on every current/future public page, no per-page setup | T-F1, T-F3 (mounted once in `TemplateLayout`) |
| FR-002 | Statement + policy link + acknowledge + close-as-acknowledge | T-F1, T-F2 |
| FR-003 | Acknowledgment immediate, 12-month persistence, site-wide | T-F2 (K4) |
| FR-004 | Non-blocking, zero layout shift, WCAG 2.1 AA | T-F3, E-A11Y, N1 + Audit (CLS) |
| FR-005 | `/cookie-policy` from banner + footer, renders register | T-F4 |
| FR-006 | No SEO/performance regression from banner/measurement | Audit: Lighthouse baseline (DoD-5) |
| FR-007 | Page-view event: page, time, source, visitor, session | T-B1, T-F5 |
| FR-008 | First-party anonymous cookie, <= 12 months | T-F5 (K1/K2) |
| FR-009 | 30-minute session window | T-B2, E-SESSION (K3/V1) |
| FR-010 | Returning vs new visitors | T-B3 (V3), E-TZ |
| FR-011 | Source groups: direct/search/social/referral/campaign | T-B4, E-SOURCE (S1–S4) |
| FR-012 | Collection never degrades the public site | E-BEACON (M8), SC-009 smoke |
| FR-013 | Bots excluded | E-INGEST (M4) |
| FR-014 | Admin pages never measured | E-INGEST (M5), T-F5 |
| FR-015 | No personal data at rest | T-B8 (R2/M7/S5) |
| FR-016 | Retention >= 32 months (no delete path) | T-B8 + Review (plan §2.7 R1: no delete/expiry code) |
| FR-017 | Sidebar entry; authenticated; all roles read | T-F6, T-B7 |
| FR-018 | Five KPIs with preceding-period deltas | T-B5, T-F7 (Q5) |
| FR-019 | Range set + "More" pop-up + custom validation | T-F8, T-F9, E-RANGE, E-DIALOG (Q1–Q3) |
| FR-020 | Realtime 5-minute window, auto-refresh | T-B6 (V5), T-F7 (V6, fake timers) |
| FR-021 | Top-10 pages with share; source breakdown | T-B6, T-F7 (Q6) |
| FR-022 | Template design, both themes, keyboard, mobile | T-F10 + SC-010 visual approval (DoD-6) |
| FR-023 | Empty states per widget | E-EMPTY, T-F10 |
| FR-024 | Extensible dashboard (metrics/panels/tabs) | Review (research R11: placeholder tabs, widget seams; ui-components.md inventory extension) |
| FR-025 | Single authoritative register, policy matches | T-F11, T-F4 |
| FR-026 | Admin strictly-necessary cookies documented | T-F11 (register content) |
| FR-027 | New cookie = register entry only | T-F11 consistency test + Review (research R9) |
| FR-028 | Notice extensible to opt-in accept/decline | Review (research R8: banner controls isolated behind one acknowledgment seam) |

Success criteria SC-001..SC-011 map through the FRs above plus the audits: SC-003/SC-011 (DoD-4/5),
SC-006/SC-007 (DoD-7 budgets Q8/M9/V6), SC-010 (DoD-6 visual approval).
