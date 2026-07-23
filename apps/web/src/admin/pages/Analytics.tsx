/**
 * Analytics page — Phase 2 admin analytics (Pass 2, live-data wiring).
 *
 * Adapts the Studio Admin template `analytics/page.tsx`
 * (ui-components.md §1 compatibility rules 1–10, §4) to the project's
 * Vite/React 18.3 setup. Composes the six widgets (RangeToolbar, KpiStrip,
 * TrafficChart, RealtimeCard, TopPages, TrafficSources) into the template's
 * tabbed grid layout. T075 replaces the Pass 1 fixture feed with the live
 * `useOverview`/`useRealtime` hooks (T073); `fixtures.ts` remains in the
 * tree for tests only (T034/T074's mocked-hook suites).
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
 *   justify-between gap-3` layout. Its `onSelect` callback drives the shared
 *   range state (T077): the four direct presets (`24h`/`7d`/`28d`/`3m`)
 *   resolve immediately via `presetToRange`; `more` opens `RangeDialog`
 *   instead of touching the range.
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
 * - **Live data (T075) + shared range state (T077).** `useOverview` is
 *   called with the page's `range` state, seeded at mount from the Q2
 *   default preset ("3 months", `rangePresets.ts`) and updated thereafter by
 *   `RangeToolbar`/`RangeDialog` selections; `useRealtime` polls
 *   independently of the range (V6). Until a payload arrives, a dashed
 *   loading panel stands in place of the data-dependent widgets
 *   (KpiStrip/TrafficChart/TopPages/TrafficSources share one panel keyed on
 *   `overview`; RealtimeCard has its own, keyed on `realtime`) — this also
 *   satisfies the null-safety the hooks' `data: T | null` return type
 *   requires before any widget prop can be read. Once a payload lands, it is
 *   passed straight through: each widget's own empty-state handling
 *   (`isEmptyRange`, `timeseries.length === 0`, `hasPages`/`hasSources`)
 *   already covers the "range with no data" case (US3-9), so no additional
 *   empty-state logic is needed at the page level.
 * - **RangeDialog mounted (T077), apply flow wired (T079).** The dialog's
 *   `open` state is owned by the page and toggled by the toolbar's `more`
 *   selection. Its `onSelect` callback (T079) resolves the three month
 *   presets via `presetToRange` and passes a valid custom start/end pair
 *   straight through as `{from, to}` (Q1: custom ranges already use the
 *   `YYYY-MM-DD` calendar-day form the native date inputs produce — no
 *   further conversion needed); both branches close the dialog and update
 *   the shared range state. Q3's rejection paths (`start > end`,
 *   `end > today`, span > 490 days) are Pass 3 / E-DIALOG (T115/T116) —
 *   only the happy path is handled here, per T079's own scope.
 * - **Page-level padding (T036d).** The template's page root carries no
 *   padding of its own — the Next.js `dashboard/layout.tsx` supplies
 *   `p-4 md:p-6` around `{children}`, a layout with no equivalent in this
 *   port (`AppShell`'s `<main>` is Phase 1, frozen, and intentionally
 *   unpadded so full-bleed pages stay possible). This project's own
 *   convention is that each page self-supplies its padding instead (see
 *   `Settings.tsx`'s `p-6`); this page's root carries the template layout's
 *   own `p-4 md:p-6` values so its widgets don't sit flush against the
 *   sidebar/top bar.
 * - **No flags.css import.** The template imports `@/styles/flag-icons/flags.css`
 *   for country-flag rendering in RealtimeVisitors. The RealtimeCard
 *   adaptation (T025) removed country-flag rows (geo out of scope), so the
 *   CSS import is not needed and would pull in unused styles.
 *
 * Port mechanics (rules 1–10): no `"use client"` (rule 1); `@/components/ui`
 * rewritten to relative `../ui/tabs.js` for the ported Phase 2 tabs primitive
 * and `../analytics/*` for the widget compositions and data hooks (rule 2);
 * no `next/*` (rule 3); no `lucide-react` (rule 4 — no icons in this page
 * composition); `data-slot` attributes preserved via the primitives (rule 5);
 * Tailwind token class strings preserved verbatim from the template (rule 6).
 */
import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs.js';
import { RangeToolbar, type RangePresetId } from '../analytics/RangeToolbar.js';
import { RangeDialog, type RangeDialogPreset } from '../analytics/RangeDialog.js';
import { KpiStrip } from '../analytics/KpiStrip.js';
import { TrafficChart } from '../analytics/TrafficChart.js';
import { RealtimeCard } from '../analytics/RealtimeCard.js';
import { TopPages } from '../analytics/TopPages.js';
import { TrafficSources } from '../analytics/TrafficSources.js';
import { useOverview, useRealtime } from '../analytics/useAnalytics.js';
import { presetToRange, type RangeParams } from '../analytics/rangePresets.js';

/**
 * Analytics — the admin analytics dashboard page (FR-022/FR-024, US3-13).
 *
 * Tabbed page composing the six widgets, fed by the live `useOverview`/
 * `useRealtime` hooks. Overview is the default-active tab; non-Overview tabs
 * render the template's own dashed "coming soon" placeholder panels. The
 * layout follows the template's `xl:grid-cols-12` / `gap-4` grid, stacking to
 * a single column at mobile width.
 */
export function Analytics() {
  // Range state — seeded once from the Q2 default preset ("3 months",
  // Europe/London-aware) at mount; thereafter updated by RangeToolbar's
  // direct presets (T077) and RangeDialog's month presets/custom range
  // (T079). `useOverview` (T072/T073) re-keys its fetch on `range.from`/
  // `range.to`, so any state update here drives a refetch.
  const [range, setRange] = useState<RangeParams>(() => presetToRange('3m', new Date()));

  // RangeDialog's open state — toggled on by RangeToolbar's `more` option
  // (T077), toggled off by the dialog itself (Esc/overlay/close button, or a
  // successful Apply once T079 wires it).
  const [dialogOpen, setDialogOpen] = useState(false);

  const overview = useOverview(range);
  const realtime = useRealtime();

  /**
   * RangeToolbar selection handler (T077, Q2). The four direct presets
   * (`24h`/`7d`/`28d`/`3m`) resolve to `{from, to}` immediately via
   * `presetToRange`; `more` does not touch the range — it only opens
   * RangeDialog, whose own presets/custom range are T079's scope. The
   * `presetId === 'more'` guard narrows the remaining branch's type to
   * exactly `rangePresets.ts`'s `RangePresetKey`, so no cast is needed.
   */
  function handleToolbarSelect(presetId: RangePresetId): void {
    if (presetId === 'more') {
      setDialogOpen(true);
      return;
    }
    setRange(presetToRange(presetId, new Date()));
  }

  /**
   * RangeDialog apply handler (T079, Q2/Q3 happy path). The three month
   * presets (`6m`/`12m`/`16m`) resolve via the same `presetToRange` helper
   * the toolbar uses. `custom` passes `customStart`/`customEnd` straight
   * through as `{from, to}` — Q1 already defines the custom-range form as
   * `YYYY-MM-DD`, exactly what the native `<input type="date">` fields
   * produce, so no additional date math is needed for the happy path. The
   * `!customStart || !customEnd` guard is null-safety for the callback's
   * optional parameters (RangeDialog only omits them for the month-preset
   * branches), not Q3 range validation — start/end-order, future-date, and
   * span-cap rejection are Pass 3 / E-DIALOG (T115/T116). Both branches
   * close the dialog, matching RangeDialog's own contract that it never
   * closes itself.
   */
  function handleDialogSelect(
    preset: RangeDialogPreset,
    customStart?: string,
    customEnd?: string,
  ): void {
    if (preset === 'custom') {
      if (!customStart || !customEnd) {
        return;
      }
      setRange({ from: customStart, to: customEnd });
    } else {
      setRange(presetToRange(preset, new Date()));
    }
    setDialogOpen(false);
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
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
            The onSelect callback drives the shared range state (T077). */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="conversions">Conversions</TabsTrigger>
          </TabsList>

          <RangeToolbar onSelect={handleToolbarSelect} />
        </div>

        {/* RangeDialog — the "More" pop-up (Q2: 6/12/16 months + Custom).
            Mounted and open/close-wired (T077); onSelect drives the shared
            range state and closes the dialog (T079, Q2/Q3 happy path). */}
        <RangeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSelect={handleDialogSelect}
        />

        {/* Overview tab — the six widgets fed by the live overview/realtime
            payloads. The grid layout mirrors the template:
            `grid-cols-1 items-stretch gap-4 xl:grid-cols-12` for
            single-column stacking at mobile and a 12-col grid at xl. */}
        <TabsContent value="overview" className="flex flex-col gap-4">
          {overview.data ? (
            <>
              <KpiStrip kpis={overview.data.kpis} />

              {/* Row 1: TrafficChart (7 cols) + RealtimeCard (5 cols). The
                  `xl:col-span-7` / `xl:col-span-5` classes are preserved
                  verbatim from the template. RealtimeCard polls
                  independently of the overview range (V6), so it renders its
                  own loading placeholder until the first snapshot lands. */}
              <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
                <div className="xl:col-span-7">
                  <TrafficChart
                    range={overview.data.range}
                    timeseries={overview.data.timeseries}
                  />
                </div>
                <div className="xl:col-span-5">
                  {realtime.data ? (
                    <RealtimeCard data={realtime.data} />
                  ) : (
                    <div className="flex h-full min-h-64 items-center justify-center rounded-xl border border-border border-dashed text-muted-foreground">
                      {realtime.error
                        ? 'Unable to load realtime visitors.'
                        : 'Loading realtime visitors…'}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: TopPages (7 cols) + TrafficSources (5 cols,
                  col-start-8). The `xl:col-start-8` offset is preserved from
                  the template. */}
              <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
                <div className="xl:col-span-7">
                  <TopPages topPages={overview.data.topPages} />
                </div>
                <div className="xl:col-span-5 xl:col-start-8">
                  <TrafficSources sources={overview.data.sources} />
                </div>
              </div>
            </>
          ) : (
            // No overview payload yet (initial fetch in flight, or the
            // request failed) — a single dashed placeholder stands in for
            // the whole data-dependent widget group; each widget's own
            // empty-state handling takes over once a payload (even an
            // empty-range one, US3-9) arrives.
            <div className="flex h-64 items-center justify-center rounded-xl border border-border border-dashed text-muted-foreground">
              {overview.error ? 'Unable to load analytics data.' : 'Loading analytics…'}
            </div>
          )}
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
