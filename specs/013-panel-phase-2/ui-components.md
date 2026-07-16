# UI Component Inventory: Admin Panel — Phase 2

**Branch**: `013-panel-phase-2` | **Date**: 2026-07-14 | **Plan**: [plan.md](plan.md) | **Research**: R12

This is the **design-pass artifact** that separates UI design from implementation. Every admin UI
piece this phase ships is listed here with its source in the Studio Admin template
(`E:\Zhaoxiang_Qiu\work\SDeal\next_shadcn_admin_dashboard`, design docs under `.doc\design`).
Implementation Pass 1 (plan §5.3) ports exactly this inventory against fixture data and must pass
the parity gate (§6) before any data wiring starts. **A component not in this inventory is not
built** — extend the inventory first, then port (Open-Closed).

---

## 1. Compatibility rules (template Next.js 16 → project Vite/React 18.3)

Apply to every port, in this order; each rule is checkable in review:

1. Remove `"use client"` directives (meaningless under Vite; the whole admin is client-rendered).
2. Rewrite imports: `@/components/ui/*` → relative `apps/web/src/admin/ui/*`; `@/lib/utils` (`cn`)
   → `apps/web/src/admin/lib/cn`.
3. No `next/*` module may survive: `next/link` → `react-router-dom` `Link`; `next/image` → `img`;
   `next/font` → nothing (fonts are Phase 1 tokens).
4. Replace `lucide-react` imports with local inline-SVG icon components
   (`function XxxIcon(props: React.SVGProps<SVGSVGElement>)`), the Phase 1 convention — do NOT add
   a `lucide-react` dependency.
5. Preserve `data-slot` / `data-variant` / `data-size` attributes exactly — tests and styling
   contract (template DESIGN.md §4).
6. Preserve Tailwind class strings verbatim where possible; they resolve against the Phase 1
   Tailwind v4 + OKLCH token layer (`admin/theme/tokens.css`). A class that cannot resolve is a
   token-layer gap to fix, not a class to improvise.
7. New Radix packages are pinned in `apps/web/package.json`; reuse already-present Radix packages
   before adding one.
8. Admin components never import into the public site; public-site UI (CookieBanner, CookiePolicy)
   never imports from `apps/web/src/admin` (Phase 1 isolation rule).
9. Recharts usage goes through the ported `chart.tsx` wrapper only — widgets never import
   `recharts` directly; series colors map to `var(--chart-N)` tokens, never literals
   (template DESIGN.md §2).
10. No emoji in code; conventional naming (`PascalCase` components, `camelCase` functions,
    `kebab-case` primitive filenames matching the template).

## 2. Phase 1 primitives reused as-is (no re-port, no modification)

`button`, `card`, `dropdown-menu`, `input`, `label`, `sidebar`, `sheet`, `sonner`, `avatar`,
`form`, `input-otp` — already ported in `apps/web/src/admin/ui/`. Phase 2 may add variants only
additively; changing existing variant behavior is out of scope.

## 3. New primitives to port (template `src/components/ui/` → `apps/web/src/admin/ui/`)

| Target | Template source | New dependency | Used by | Port notes |
|--------|-----------------|----------------|---------|------------|
| `select.tsx` | `src/components/ui/select.tsx` | `@radix-ui/react-select` (pin) | RangeToolbar | Full port: trigger sizes, content, group, item, separator |
| `tabs.tsx` | `src/components/ui/tabs.tsx` | `@radix-ui/react-tabs` (pin) | Analytics page tab row | Full port: list, trigger, content |
| `dialog.tsx` | `src/components/ui/dialog.tsx` | none (`@radix-ui/react-dialog` present via `sheet`) | RangeDialog | Full port: overlay, content, header, footer, title, description, close |
| `chart.tsx` | `src/components/ui/chart.tsx` | none (`recharts` present) | TrafficChart | Port `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartConfig`; keep CSS-variable color plumbing |
| `badge.tsx` | `src/components/ui/badge.tsx` | none | KpiStrip deltas | Full port: pill shape (`rounded-4xl`), tinted variants |

## 4. Page composites to adapt (template `src/app/(main)/dashboard/analytics/` → `apps/web/src/admin/analytics/`)

Each adaptation is a spec-driven decision documented in research R11 — nothing is taste.

| Target widget | Template source | Follows template | Documented adaptations |
|---------------|-----------------|------------------|------------------------|
| `Analytics.tsx` (page) | `analytics/page.tsx` | Heading block, tab row, grid layout (`xl:grid-cols-12`, `gap-4` rhythm) | Tab set kept with non-Overview tabs rendering the template's own dashed "coming soon" panels; greeting text replaced by page title |
| `KpiStrip.tsx` | `_components/analytics-kpi-strip.tsx` | Divided card strip, `text-2xl tracking-tight` values, tinted delta badges, "from X - last period" caption | Five KPI cells per spec (page views, unique visitors, sessions, returning-visitor rate, pages per session); ellipsis card action omitted (no per-card menu shipped) |
| `RangeToolbar.tsx` | `_components/analytics-toolbar.tsx` | Select styling and placement | Options = 24 hours / 7 days / 28 days / 3 months / More (spec Q2, supersedes template values); export/import/share ellipsis menu omitted (out of scope) |
| `TrafficChart.tsx` | `_components/traffic-quality.tsx` | Card frame, ComposedChart, `ChartContainer` config, axis/tooltip styling, `var(--chart-N)` series | Series = page views + sessions per bucket (real data), replacing the fixture "quality" series |
| `RealtimeCard.tsx` | `_components/realtime-visitors.tsx` | Card frame, live-count emphasis, list rhythm | Country flag rows removed (geo out of scope); shows active-visitor count + top-5 active pages; no `flags.css` import |
| `TopPages.tsx` | `_components/top-pages.tsx` | Card frame, ranked rows, share presentation | Data = top-10 paths with share of views |
| `TrafficSources.tsx` | `_components/top-traffic-sources.tsx` | Card frame, ranked/share presentation | Rows = the five source groups, zero-valued groups shown |

## 5. New compositions with no direct template source

| Component | Location | Design basis |
|-----------|----------|--------------|
| `RangeDialog.tsx` | `apps/web/src/admin/analytics/` | Composed from ported `dialog` + `button` + `label` + `input` (two native `type="date"` fields styled by the admin `input` primitive — research R10); spacing/typography per dialog defaults; validation message in `destructive` text per template form conventions |
| Widget empty states | inside each widget | Template empty-panel pattern: dashed `border-border` frame, `text-muted-foreground` (as used by the template's placeholder tabs) |
| `CookieBanner.tsx` / `CookiePolicy.tsx` | `apps/web/src/components/` / `apps/web/src/routes/` | Deliberately NOT from the template: public-site surfaces use the site's existing Bootstrap styling (rule 8; research R8) |

## 6. Parity gate (blocks dashboard data wiring)

> Scope amended 2026-07-15: the gate blocks Pass 2's widget-consuming work (dashboard wiring and
> navigation) only; the measurement pipeline, banner/register, and analytics endpoints are
> gate-independent (plan §5.3).

For each item in §3 and §4, before any data wiring:

- [ ] Renders with the template's DOM structure and `data-slot` attributes.
- [ ] Token usage matches (no literal colors; `var(--chart-N)` for series; radius/spacing per
      template DESIGN.md quick-reference).
- [ ] Side-by-side visual check against the template page in **light and dark** — approved
      (feeds SC-010 / DoD-6).
- [ ] Keyboard operability and visible focus verified (constitution V).
- [ ] Render + keyboard tests green against fixture data (plan §4.3 "new tests", authored in
      Pass 1).

Deviations discovered during implementation are recorded here as adaptations (with the spec/plan
reason) before code merges — the inventory stays the single source of truth for "what the UI is".

## 7. Inventory verification log

- **2026-07-16 — T009.** Re-verified every §3 primitive (`select`, `tabs`, `dialog`,
  `chart`, `badge`) and §4/§5 composition (`analytics/page.tsx`, `analytics-kpi-strip`,
  `analytics-toolbar`, `traffic-quality`, `realtime-visitors`, `top-pages`,
  `top-traffic-sources`, `RangeDialog`) against its template source at
  `E:\Zhaoxiang_Qiu\work\SDeal\next_shadcn_admin_dashboard`. All sources exist at the
  documented paths and match their inventory rows; every Pass 1 task (T010–T036) maps to
  exactly one row. No new components or adaptations required beyond those already recorded
  in §3–§5 — no extensions added.
