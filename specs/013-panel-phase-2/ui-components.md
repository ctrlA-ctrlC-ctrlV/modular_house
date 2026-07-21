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
| `TopPages.tsx` | `_components/top-pages.tsx` | Card frame, ranked rows, share presentation | Data = top-10 paths with share of views; table rendered with native `<table>` elements carrying template `data-slot` attributes (`table.tsx` not in §3 port inventory — inlined, not ported as a new primitive) |
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

- [x] Renders with the template's DOM structure and `data-slot` attributes.
      Verified T010–T035: every ported primitive and composition preserves the
      template's `data-slot` attributes (100+ data-slot occurrences across
      `select`, `tabs`, `dialog`, `chart`, `badge`, and the Phase 1 `card`/
      `input`/`label` primitives reused by the widgets). DOM structure mirrors
      the template's Radix primitive wrappers and card frames.
- [x] Token usage matches (no literal colors; `var(--chart-N)` for series;
      radius/spacing per template DESIGN.md quick-reference).
      Verified: no literal hex/rgb/hsl colors in the analytics widget code.
      TrafficChart series use `var(--chart-1)` / `var(--chart-2)` (asserted by
      T022). The `#ccc` / `#fff` occurrences in `chart.tsx` are CSS attribute
      selectors targeting recharts' internal inline styles for override
      (`stroke-border/50`, `stroke-transparent`) — the template's own pattern,
      preserved verbatim per rule 6. Tailwind token class strings resolve
      against the Phase 1 token layer.
- [ ] Side-by-side visual check against the template page in **light and dark** — approved
      (feeds SC-010 / DoD-6). **FAILED (2026-07-21, human review); fixes applied, re-check
      PENDING.** T036a–T036e (the fix tasks tracking the five root causes — missing
      `@custom-variant dark` registration, dead `.admin-root.dark` selector, TabsTrigger
      `data-active:` vs Radix's `data-state=active`, Analytics page's missing outer padding,
      unscaled `--radius-3xl`/`--radius-4xl` tokens) are all implemented and green (their own
      automated assertions pass; full web suite 45 files/370 tests, lint, typecheck all clean).
      **PENDING HUMAN APPROVAL** — the agent cannot render web pages; this item requires a human
      to run the admin app and the template side-by-side in light and dark themes and confirm
      visual parity now holds. Until this is approved, T036 is not complete and T037+ (Pass 2
      widget-consuming tasks) remain blocked.
- [x] Keyboard operability and visible focus verified (constitution V).
      Verified by the Pass 1 keyboard suites: select (T010 — ArrowDown/Enter/
      Esc, H4 focus ring), tabs (T012 — ArrowRight/ArrowLeft roving focus,
      H4 focus ring), dialog (T014 — Enter open, Esc close, focus management),
      RangeToolbar (T030 — keyboard select), RangeDialog (T032 — focus moves
      into dialog, Esc closes), Analytics page (T034 — ArrowRight tab
      activation).
- [x] Render + keyboard tests green against fixture data (plan §4.3 "new
      tests", authored in Pass 1).
      Verified: `pnpm --filter @modular-house/web test:run` — 45 files, 365
      tests passing (2026-07-20). All Pass 1 suites green: select (9), tabs
      (9), dialog (13), chart (4), badge (13), KpiStrip (9), TrafficChart (5),
      RealtimeCard (5), TopPages (5), TrafficSources (5), RangeToolbar (5),
      RangeDialog (5), Analytics page (4).

### Recorded deviations (documented adaptations)

1. **Tabs `data-active:` / `data-state` mismatch (T013, deferred to T036;
   CONFIRMED by the 2026-07-21 human side-by-side — graduated to required fix
   T036c).** The template's `tabs.tsx` uses Tailwind `data-active:` shorthands
   (e.g. `data-active:bg-background`, `data-active:shadow-sm`), but the pinned
   `@radix-ui/react-tabs` sets `data-state="active"` / `data-state="inactive"`
   (not `data-active` / `data-inactive`). The port preserves the template's
   class strings verbatim per rule 6; every `data-active:` class is inert
   (none of the template's non-`data-active:` classes carry an independent
   active treatment either, contrary to what was assumed at T013 review time)
   — the active tab renders with no pill background, no shadow, and no
   underline indicator, visually indistinguishable from an inactive tab. Fix
   tracked as T036c: replace `data-active:` with `data-[state=active]:` in
   the tabs primitive.

2. **Chart `#ccc` / `#fff` CSS attribute selectors (T017).** The ported
   `chart.tsx` preserves the template's recharts CSS attribute selectors
   (`[stroke='#ccc']`, `[stroke='#fff']`) that target recharts' internal
   inline styles for override with design tokens (`stroke-border/50`,
   `stroke-transparent`). These are not literal colors used by the design
   system — they are CSS selectors matching recharts' hardcoded inline
   styles. The template's own pattern, preserved verbatim per rule 6.

3. **RangeDialog composed, not ported (T033).** The RangeDialog has no direct
   template source (ui-components.md §5: "Composed from ported `dialog` +
   `button` + `label` + `input`"). The composition follows the template's
   dialog/form conventions (spacing, typography, destructive validation text)
   but the layout is a new design. The visual side-by-side should verify the
   composition feels consistent with the template's form dialogs.

4. **Dark mode never actually engages the OKLCH dark palette (found at
   T036, fix tracked as T036b).** `tokens.css` scopes the dark override block
   to the compound selector `.admin-root.dark`, which requires both classes
   on the same DOM node. `ThemeProvider` (Phase 1, frozen) only ever toggles
   `.dark` on `document.documentElement`, several levels above the nested
   `.admin-root` div (`AppShell.tsx`) — the compound selector has therefore
   never matched any element in this project, and the dark values for
   `--background`, `--foreground`, `--card`, `--popover`, `--sidebar`,
   `--border`, `--muted`, `--ring`, etc. are dead code. Not a template issue —
   a port-time selector mismatch, since the template applies `.dark` and its
   token overrides to the same root element (`:root`/`html`) it never had to
   reconcile with a nested scoping wrapper.

5. **Tailwind's `dark:` variant was never switched to the class strategy
   (found at T036, fix tracked as T036a).** The template's `globals.css`
   declares `@custom-variant dark (&:is(.dark *));`, which is what makes
   every `dark:`-prefixed utility respond to an ancestor `.dark` class. This
   line was not ported to `admin.css`/`tokens.css`, so Tailwind v4's default
   `dark:` strategy applies instead (`@media (prefers-color-scheme: dark)`,
   compiled-in default — confirmed absent from
   `node_modules/tailwindcss/{index,theme,utilities}.css`). Every literal
   `dark:` class already shipped (`button.tsx`, `input.tsx`, `select.tsx`,
   `tabs.tsx`, `badge.tsx`, `dropdown-menu.tsx`, `input-otp.tsx`,
   `KpiStrip.tsx`) tracks the visitor's OS colour-scheme, not the in-app
   toggle — the reported "only button/input backgrounds change" symptom.

6. **`--radius-3xl` / `--radius-4xl` not bridged to the pinned base radius
   (found at T036, fix tracked as T036e, minor).** `tokens.css`'s `@theme
   inline` block redefines `--radius-sm` through `--radius-2xl` relative to
   the pinned `--radius: 0.625rem`, but stops short of `--radius-3xl` /
   `--radius-4xl`. `badge.tsx`'s `rounded-4xl` pill still renders — Tailwind
   v4 ships static fallback values (`theme.css`: `1.5rem` / `2rem`) — but at
   the template's un-scaled default rather than its `calc(var(--radius) +
   Npx)` formula, a small curvature drift from the pinned H3/H4 base radius
   every other radius step already honours.

## 7. Inventory verification log

- **2026-07-16 — T009.** Re-verified every §3 primitive (`select`, `tabs`, `dialog`,
  `chart`, `badge`) and §4/§5 composition (`analytics/page.tsx`, `analytics-kpi-strip`,
  `analytics-toolbar`, `traffic-quality`, `realtime-visitors`, `top-pages`,
  `top-traffic-sources`, `RangeDialog`) against its template source at
  `E:\Zhaoxiang_Qiu\work\SDeal\next_shadcn_admin_dashboard`. All sources exist at the
  documented paths and match their inventory rows; every Pass 1 task (T010–T036) maps to
  exactly one row. No new components or adaptations required beyond those already recorded
  in §3–§5 — no extensions added.
