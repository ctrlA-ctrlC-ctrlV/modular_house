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
   + Phase 1 admin cookies + the Google Analytics cookies `_ga` / `_ga_<container-id>`) with name,
   purpose, category, duration. Footer links to the same page.
5. Keyboard-only: banner controls reachable, focus visible, no trap.

### US2 — Anonymous measurement

1. With DevTools open, browse public pages -> one `POST /api/analytics/events` per page view
   (initial load + each route change), `mh_vid` (365 d, renewed per view) and `mh_sid` (30 min,
   renewed) cookies set.
2. Navigate to `/admin` -> no beacon requests fire.
3. Stop the API and browse the public site -> pages work perfectly; no visible errors.
4. Inspect `analytics_events` rows -> path/time/source/visitor/session only; no IP, UA, or full
   referrer URL anywhere.
5. Arrive via a `?utm_source=...` or `?gclid=...` link -> event classified `campaign`; via a
   Google result -> `search`; direct entry -> `direct`.

### US3 — Analytics dashboard

1. Sign in -> you land on `/admin/analytics` (new default); sidebar shows "Analytics".
2. Overview shows: KPI strip (page views, unique visitors, sessions, returning-visitor rate,
   pages per session) with deltas, traffic chart, realtime card, top pages, sources.
3. Switch range: 24 hours / 7 days / 28 days / 3 months (default) -> all widgets update together.
4. "More" -> pop-up with 6 / 12 / 16 months and custom start/end date inputs. Apply a preset ->
   widgets update. Set start after end, end in the future, or a span over 16 months -> Apply
   blocked with a message.
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

### Troubleshooting — `lhci autorun` (Lighthouse CI) on Windows dev machines

`pnpm --filter @modular-house/web test:lighthouse` (`lhci autorun`, per DoD-5) reliably crashes on
Windows dev machines with `EPERM` while `chrome-launcher@1.2.1` deletes its own auto-generated
Chrome profile temp directory during cleanup (`destroyTmp()`), on every run.

**Root cause** (read from `chrome-launcher@1.2.1`'s own source, not assumed): `destroyTmp()` calls
`fs.rmSync(userDataDir, {recursive: true, force: true, maxRetries: 10})` against a directory
`chrome-launcher` created under `%TEMP%`. Windows file-locking (a handle briefly held by Chrome's
own crashpad/logging, antivirus real-time scanning, etc.) can keep the directory locked past all 10
retries, surfacing as `EPERM`. The library already special-cases Windows process teardown timing
immediately before this call (`taskkill /F /T`, citing `GoogleChrome/chrome-launcher#266`) —
acknowledging Windows differs from POSIX `SIGKILL` here, but the temp-dir cleanup itself has no
equivalent Windows-specific retry/ownership handling.

**CI-reproduction question, answered empirically, not assumed**: this does **not** reproduce on a
genuine Linux runner.
- `chrome-launcher`'s `getPlatform()`/`makeTmpDir()` (`utils.js`) branch by platform: `darwin`/
  `linux` (no WSL detected) call `makeUnixTmpDir()` — a plain `mktemp -d -t lighthouse.XXXXXXX` on
  the real filesystem, no Windows path, no NTFS locking semantics involved. This is the exact
  branch a `ubuntu-latest` GitHub Actions runner takes (`is-wsl` returns `false` outside WSL and
  inside Docker containers, even on a WSL2 host kernel).
- Verified directly: ran 30 consecutive `chrome-launcher@1.2.1` `launch()` -> `kill()` cycles
  (`kill()` internally calls `destroyTmp()`) against a real headless Chrome build inside a plain
  `node:22-bookworm-slim` Docker container (`is-wsl` confirmed `false` there, i.e. the same code
  path `ubuntu-latest` takes) — **30/30 succeeded, zero `EPERM`**.
- Secondary finding: running the same harness under WSL2 directly (not a container) is *not* a
  clean proxy for "genuine Linux" — `chrome-launcher` special-cases WSL: `case 'wsl':` in
  `makeTmpDir()` deliberately points `process.env.TEMP` at the Windows `AppData\Local` path (via
  `wslpath`) and falls through into the `win32` branch, so profile dirs land on the Windows-backed
  `drvfs` mount even from a Linux process (confirmed: a WSL2 run of the same harness wrote its temp
  dirs to `/mnt/c/Users/<user>/AppData/Local/lighthouse.*`, not `/tmp`). That run also succeeded
  10/10 with no crash, but it is not evidence about real Linux CI — the Docker-container run above
  is.
- Also true today: no `.github/workflows/*.yml` invokes `lhci`/`test:lighthouse` at all —
  `perf-check.yml` is a separate, opt-in ingest/overview-latency benchmark (M9/Q8), unrelated to
  Lighthouse. There is no live CI job at risk from this bug today; this finding is forward-looking
  for whenever Lighthouse CI is wired into a workflow.

**Local dev workaround (Windows), repeatable**: launch a standalone headless Chrome once, holding a
fixed remote-debugging port, and point `lhci`'s collect step at it instead of letting
`chrome-launcher` spawn (and later auto-clean) its own instance — `destroyTmp()` only fires for a
temp dir `chrome-launcher` itself created, so an already-listening port skips it entirely.

```powershell
# 1. Launch a standalone Chrome once, on a fixed debugging port and a dedicated
#    (never auto-cleaned) profile directory.
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --remote-debugging-port=9222 `
  --user-data-dir="$env:TEMP\lhci-manual-profile" `
  --headless=new --disable-gpu

# 2. In a second terminal, point the collect step at the already-listening port —
#    add `"port": 9222` under `ci.collect.settings` in lighthouserc.json (or pass
#    --collect.settings.port=9222 on the CLI) — then run as normal:
pnpm --filter @modular-house/web test:lighthouse
```

Run from an isolated working directory (absolute `staticDistDir`/`outputDir` paths) when testing
against a scratch build — `lhci`'s default `collect` step clears its storage directory at the start
of every run, which would otherwise wipe any committed `.lighthouseci/` baseline files.

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
| FR-011 | Source groups: direct/search/social/referral/campaign (incl. ad click-IDs) | T-B4, E-SOURCE (S1–S4) |
| FR-012 | Collection never degrades the public site | E-BEACON (M8), SC-009 smoke |
| FR-013 | Bots excluded | E-INGEST (M4) |
| FR-014 | Admin pages never measured | E-INGEST (M5), T-F5 |
| FR-015 | No personal data at rest | T-B8 (R2/M7/S5) |
| FR-016 | Retention >= 32 months (no delete path) | T-B8 + Review (plan §2.7 R1: no delete/expiry code) |
| FR-017 | Sidebar entry; authenticated; all roles read; default landing view | T-F6, T-B7 |
| FR-018 | Five KPIs with preceding-period deltas | T-B5, T-F7 (Q5) |
| FR-019 | Range set + "More" pop-up + custom validation | T-F8, T-F9, E-RANGE, E-DIALOG (Q1–Q3) |
| FR-020 | Realtime 5-minute window + top active pages, auto-refresh | T-B6 (V5), T-F7 (V6, fake timers) |
| FR-021 | Top-10 pages with share; source breakdown | T-B6, T-F7 (Q6) |
| FR-022 | Template design, both themes, keyboard, mobile | T-F10 + SC-010 visual approval (DoD-6) |
| FR-023 | Empty states per widget | E-EMPTY, T-F10 |
| FR-024 | Extensible dashboard (metrics/panels/tabs) | Review (research R11: placeholder tabs, widget seams; ui-components.md inventory extension) |
| FR-025 | Single authoritative register, policy matches | T-F11, T-F4 |
| FR-026 | Admin cookies (strictly necessary + functional) documented | T-F11 (register content) |
| FR-027 | New cookie = register entry only | T-F11 consistency test + Review (research R9) |
| FR-028 | Notice extensible to opt-in accept/decline | Review (research R8: banner controls isolated behind one acknowledgment seam) |
| FR-029 | Traffic-over-time chart (page views + sessions per bucket) | T-B6 (Q4), T-F7, E-RANGE (bucket boundaries) |

Success criteria SC-001..SC-011 map through the FRs above plus the audits: SC-003/SC-011 (DoD-4/5),
SC-006/SC-007 (DoD-7 budgets Q8/M9/V6), SC-010 (DoD-6 visual approval).
