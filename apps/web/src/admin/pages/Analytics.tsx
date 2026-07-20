/**
 * Analytics page — Phase 2 admin analytics (Pass 1, fixture data only).
 *
 * Adapts the Studio Admin template `analytics/page.tsx`
 * (ui-components.md §1 compatibility rules 1–10, §4) to the project's
 * Vite/React 18.3 setup. Composes the six Pass 1 widgets (RangeToolbar,
 * KpiStrip, TrafficChart, RealtimeCard, TopPages, TrafficSources) into the
 * template's tabbed grid layout, fed exclusively from the T008 fixture
 * payloads — no data fetching, no RangeDialog behavior (Pass 1, plan §5.3).
 *
 * Spec-driven adaptations (research R11 / ui-components.md §4 — nothing is
 * taste):
 * - **Greeting replaced by page title.** The template's `<h1>Hello, Aiy</h1>`
 *   greeting is replaced by a page title "Analytics" — documented adaptation
 *   (ui-components.md §4: "greeting text replaced by page title"). The
 *   subtitle is retained from the template. The greeting is user-specific
 *   and belongs in the shell, not a dashboard page; the page title is stable
 *   and navigable.
 * - **Tab set kept.** The template's five tabs (Overview / Audience /
 *   Acquisition / Engagement / Conversions) are retained verbatim
 *   (FR-022: follows template; FR-024: tab set is an extension point —
 *   extend-by-append only). Overview is the default-active tab
 *   (`defaultValue="overview"`). Non-Overview tabs render the template's own
 *   dashed `border-border` `text-muted-foreground` "coming soon" placeholder
 *   panels — the guardrails pin these as placeholder panels only (plan §1.4:
 *   "non-Overview tabs are placeholder panels only").
 * - **RangeToolbar replaces AnalyticsToolbar.** The template's
 *   `AnalyticsToolbar` (select + ellipsis menu) is replaced by the ported
 *   `RangeToolbar` (T031) — the spec's Q2 option set and the omitted
 *   export/import/share menu are documented adaptations
 *   (ui-components.md §4). The toolbar is placed in the same flex row as the
 *   `TabsList`, matching the template's `flex flex-wrap items-center
 *   justify-between gap-3` layout.
 * - **Widget composition.** The Overview tab content composes the six
 *   widgets in the template's two-row grid:
 *   - Row 1: KpiStrip (full width), then TrafficChart (xl:col-span-7) +
 *     RealtimeCard (xl:col-span-5).
 *   - Row 2: TopPages (xl:col-span-7) + TrafficSources (xl:col-span-5,
 *     xl:col-start-8).
 *   The `xl:grid-cols-12` / `gap-4` / `grid-cols-1` / `items-stretch` classes
 *   are preserved verbatim from the template (FR-022: "adapt to small
 *   viewports without horizontal scrolling" — `grid-cols-1` is the mobile
 *   base, `xl:grid-cols-12` is the xl override).
 * - **Fixture data only.** All widget props are sourced from the T008
 *   `fixtures.ts` module (overviewPopulated + realtimePopulated) — no live
 *   API calls, no data wiring (Pass 1, plan §5.3, research R12). The
 *   RangeToolbar's `onSelect` callback is a no-op in Pass 1 (the dashboard
 *   page owns the preset in Pass 2).
 * - **No RangeDialog behavior.** Per T035: "No data fetching, no RangeDialog
 *   behavior." The RangeDialog is not mounted in Pass 1 — it will be wired in
 *   Pass 2 (T080+) when the `More` option opens the pop-up.
 * - **No flags.css import.** The template imports `@/styles/flag-icons/flags.css`
 *   for country-flag rendering in RealtimeVisitors. The RealtimeCard
 *   adaptation (T025) removed country-flag rows (geo out of scope), so the
 *   CSS import is not needed and would pull in unused styles.
 *
 * Port mechanics (rules 1–10): no `"use client"` (rule 1); `@/components/ui`
 * rewritten to relative `../ui/tabs.js` for the ported Phase 2 tabs primitive
 * and `../analytics/*` for the widget compositions (rule 2); no `next/*`
 * (rule 3); no `lucide-react` (rule 4 — no icons in this page composition);
 * `data-slot` attributes preserved via the primitives (rule 5); Tailwind
 * token class strings preserved verbatim from the template (rule 6).
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs.js';
import { RangeToolbar } from '../analytics/RangeToolbar.js';
import { KpiStrip } from '../analytics/KpiStrip.js';
import { TrafficChart } from '../analytics/TrafficChart.js';
import { RealtimeCard } from '../analytics/RealtimeCard.js';
import { TopPages } from '../analytics/TopPages.js';
import { TrafficSources } from '../analytics/TrafficSources.js';
import {
  overviewPopulated,
  realtimePopulated,
} from '../analytics/fixtures.js';

/**
 * Analytics — the admin analytics dashboard page (FR-022/FR-024, US3-13).
 *
 * Tabbed page composing the six Pass 1 widgets from fixture data. Overview is
 * the default-active tab; non-Overview tabs render the template's own dashed
 * "coming soon" placeholder panels. The layout follows the template's
 * `xl:grid-cols-12` / `gap-4` grid, stacking to a single column at mobile
 * width.
 */
export function Analytics() {
  return (
    <div className="flex flex-col gap-4">
      {/* Heading block — page title replaces the template's user-specific
          greeting (documented adaptation, ui-components.md §4). The subtitle
          is retained from the template. */}
      <div className="space-y-1">
        <h1 className="text-3xl tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Monitor traffic, engagement, and conversion performance in one view.
        </p>
      </div>

      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        {/* Tab row + range toolbar — the template's flex-wrap layout
            positions the TabsList and AnalyticsToolbar in the same row,
            wrapping on small viewports. RangeToolbar replaces the template's
            AnalyticsToolbar (documented adaptation, ui-components.md §4).
            The onSelect callback is a no-op in Pass 1 — the dashboard page
            owns the preset in Pass 2. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="conversions">Conversions</TabsTrigger>
          </TabsList>

          <RangeToolbar onSelect={() => {}} />
        </div>

        {/* Overview tab — the six widgets composed from fixture data
            (Pass 1, no data fetching). The grid layout mirrors the
            template: `grid-cols-1 items-stretch gap-4 xl:grid-cols-12`
            for single-column stacking at mobile and a 12-col grid at xl. */}
        <TabsContent value="overview" className="flex flex-col gap-4">
          <KpiStrip kpis={overviewPopulated.kpis} />

          {/* Row 1: TrafficChart (7 cols) + RealtimeCard (5 cols).
              The `xl:col-span-7` / `xl:col-span-5` classes are preserved
              verbatim from the template. */}
          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <TrafficChart
                range={overviewPopulated.range}
                timeseries={overviewPopulated.timeseries}
              />
            </div>
            <div className="xl:col-span-5">
              <RealtimeCard data={realtimePopulated} />
            </div>
          </div>

          {/* Row 2: TopPages (7 cols) + TrafficSources (5 cols, col-start-8).
              The `xl:col-start-8` offset is preserved from the template. */}
          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <TopPages topPages={overviewPopulated.topPages} />
            </div>
            <div className="xl:col-span-5 xl:col-start-8">
              <TrafficSources sources={overviewPopulated.sources} />
            </div>
          </div>
        </TabsContent>

        {/* Non-Overview tabs — the template's own dashed "coming soon"
            placeholder panels (guardrails: placeholder panels only). The
            dashed `border-border` `text-muted-foreground` styling is
            preserved verbatim from the template. FR-024: the tab set is an
            extension point — new tabs can be appended without reworking
            existing widgets. */}
        <TabsContent value="audience">
          <div className="flex h-64 items-center justify-center rounded-xl border border-border border-dashed text-muted-foreground">
            Audience view coming soon.
          </div>
        </TabsContent>

        <TabsContent value="acquisition">
          <div className="flex h-64 items-center justify-center rounded-xl border border-border border-dashed text-muted-foreground">
            Acquisition view coming soon.
          </div>
        </TabsContent>

        <TabsContent value="engagement">
          <div className="flex h-64 items-center justify-center rounded-xl border border-border border-dashed text-muted-foreground">
            Engagement view coming soon.
          </div>
        </TabsContent>

        <TabsContent value="conversions">
          <div className="flex h-64 items-center justify-center rounded-xl border border-border border-dashed text-muted-foreground">
            Conversions view coming soon.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
