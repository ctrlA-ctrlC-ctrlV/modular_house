/**
 * RealtimeCard widget — Phase 2 admin analytics (Pass 1, fixture data only).
 *
 * Adapts the Studio Admin template `_components/realtime-visitors.tsx`
 * (ui-components.md §1 compatibility rules 1–10, §4) to the project's
 * Vite/React 18.3 setup. Renders a card-framed realtime visitor count with a
 * top-5 active pages list, fed exclusively from the T008 fixture payloads
 * (no live API calls, no data wiring, no polling — Pass 1).
 *
 * Spec-driven adaptations (research R11 / ui-components.md §4 — nothing is
 * taste):
 * - **Country-flag rows removed.** The template's 2×2 country-flag grid
 *   (`flag:US`, `flag:GB`, etc. + `flags.css` import) is removed entirely —
 *   geo breakdowns are out of scope (plan §1.4). No `flags.css` import, no
 *   `flag:*` classes.
 * - **Top-5 active pages list.** Replacing both the template's per-minute
 *   BarChart and the country-flag grid: a ranked list of the top-5 active
 *   page paths with their active-visitor counts (V5: top 5 paths in the
 *   trailing 5-minute window). The BarChart is removed because the spec's
 *   RealtimeResponse carries a total count + top pages, not per-minute data.
 * - **Live-count label.** "active" replaces the template's "per minute" —
 *   the spec's activeVisitors is a distinct-visitor count in the trailing
 *   5 minutes (V5), not a per-minute rate.
 * - **Per-card ellipsis menu omitted.** The template's `CardAction` with an
 *   `Ellipsis` icon is not shipped this phase — follows the KpiStrip /
 *   TrafficChart precedent ("no per-card menu shipped").
 * - **Zero-visitor empty state.** When activeVisitors is 0 and there are no
 *   active pages, the pages section renders the template's dashed
 *   `border-border` `text-muted-foreground` empty panel (US3-9 / E-EMPTY,
 *   ui-components.md §5). The live-count still shows "0" and the "Live"
 *   indicator remains (the dashboard is still polling in the wired version).
 *
 * Port mechanics (rules 1–10): `"use client"` stripped (rule 1); `@/components`
 * rewritten to relative `../ui/*` (rule 2); no `next/*` (rule 3); no
 * `lucide-react` (rule 4 — the template's `Ellipsis` icon is omitted, not
 * replaced); `data-slot` attributes preserved via the Phase 1 `Card` primitive
 * (rule 5); Tailwind token class strings preserved verbatim (rule 6).
 */
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.js';

import type { RealtimeResponse } from './fixtures.js';

// ---------------------------------------------------------------------------
// RealtimeCard component
// ---------------------------------------------------------------------------

/** Props for the RealtimeCard widget. */
export interface RealtimeCardProps {
  /** The realtime snapshot (active visitors + top-5 active pages, V5). */
  data: RealtimeResponse;
}

/**
 * RealtimeCard — visitors active in the trailing 5 minutes (FR-020, V5).
 *
 * Card frame with:
 * - A live-count emphasis showing `activeVisitors` with a "Live" indicator
 *   (green pulsing dot, preserved from the template).
 * - A ranked list of the top-5 active page paths with their active-visitor
 *   counts (replacing the template's BarChart + country-flag grid).
 * - A dashed empty-panel for the pages section when there are no active pages
 *   (US3-9 / E-EMPTY).
 */
export function RealtimeCard({ data }: RealtimeCardProps) {
  const { activeVisitors, topActivePages } = data;
  const hasPages = topActivePages.length > 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal">Realtime Visitors</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Live-count emphasis: the active-visitor count with a "Live"
            indicator (green pulsing dot, preserved verbatim from the
            template). The count uses the template's text-2xl tabular-nums
            tracking-tight styling; the label "active" replaces "per minute"
            to reflect the spec's trailing-5-minute distinct-visitor count. */}
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl tabular-nums leading-none tracking-tight">
              {activeVisitors}
            </span>
            <span className="text-muted-foreground text-sm">active</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
            <span>Live</span>
          </div>
        </div>

        {/* Top-5 active pages list (V5) — replaces the template's per-minute
            BarChart and country-flag grid. Each row shows the page path
            (truncated) and its active-visitor count. When there are no active
            pages (E-EMPTY), the dashed empty-panel replaces the list. */}
        {hasPages ? (
          <div className="flex flex-col">
            {topActivePages.map((page) => (
              <div
                key={page.path}
                className="flex items-center gap-3 border-border/50 border-b pt-1 pb-4 last:border-b-0 last:pb-1"
              >
                <span className="min-w-0 flex-1 truncate text-sm">{page.path}</span>
                <span className="text-sm tabular-nums">{page.activeVisitors}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-32 w-full items-center justify-center border border-border border-dashed text-muted-foreground text-sm">
            No active pages right now.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
