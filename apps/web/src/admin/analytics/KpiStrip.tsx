/**
 * KpiStrip widget — Phase 2 admin analytics (Pass 1, fixture data only).
 *
 * Adapts the Studio Admin template `_components/analytics-kpi-strip.tsx`
 * (ui-components.md §1 compatibility rules 1–10, §4) to the project's
 * Vite/React 18.3 setup. Renders a divided card strip of exactly five KPI
 * cells with period-over-period delta badges, fed exclusively from the T008
 * fixture payloads (no live API calls, no data wiring — Pass 1).
 *
 * Spec-driven adaptations (research R11 / ui-components.md §4 — nothing is
 * taste):
 * - **KPI set superseded.** The five cells are the spec's KPIs — page views,
 *   unique visitors, sessions, returning-visitor rate, pages per session — in
 *   that order, replacing the template's Unique Visitors / Sessions / Pageviews
 *   / Engagement Rate / Conversion Rate.
 * - **Per-card ellipsis menu omitted.** The template's `CardAction` with an
 *   `Ellipsis` icon (per-card action menu) is not shipped this phase; no
 *   `CardAction` is rendered.
 * - **Caption wording.** "from <X> - last period" replaces the template's
 *   "from <X> • last 4 weeks" (the range is variable, not always 4 weeks).
 * - **Q5 delta variants.** The three `KpiValue` comparison states render
 *   distinctly: numeric previous -> tinted delta badge; `previous: null` ->
 *   "no prior data"; `previous: 0` -> "—" (delta not computable). Deltas never
 *   render NaN/Infinity (Q5).
 *
 * Port mechanics (rules 1–10): `"use client"` stripped (rule 1); `@/components`
 * rewritten to relative `../ui/*` and `@/lib/utils` to `../lib/cn.js` (rule 2);
 * no `next/*` (rule 3); `lucide-react` arrows replaced with inline-SVG icon
 * components (rule 4); `data-slot` attributes preserved (rule 5); Tailwind
 * token class strings preserved verbatim (rule 6).
 */
import * as React from 'react';

import { Badge } from '../ui/badge.js';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.js';

import type { KpiValue, OverviewKpis } from './fixtures.js';

// ---------------------------------------------------------------------------
// Inline-SVG arrow icons (rule 4 — no lucide-react dependency)
// ---------------------------------------------------------------------------

/**
 * Up-right arrow — marks a non-negative delta. Path geometry matches the
 * lucide `ArrowUpRight` icon; the badge's `[&>svg]:size-3!` rule sizes it.
 */
function ArrowUpRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

/**
 * Down-right arrow — marks a negative delta. Path geometry matches the
 * lucide `ArrowDownRight` icon; the badge's `[&>svg]:size-3!` rule sizes it.
 */
function ArrowDownRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 7 17 17" />
      <path d="M17 7v10H7" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Value formatting helpers
// ---------------------------------------------------------------------------

/** Format an integer KPI (page views / unique visitors / sessions) with en-GB grouping. */
function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-GB').format(Math.round(value));
}

/** Format a fraction-in-[0,1] KPI (returning-visitor rate) as a percentage. */
function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value);
}

/** Format a low-precision decimal KPI (pages per session), up to 2 decimals. */
function formatDecimal(value: number): string {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(value);
}

/** Format a signed delta percent as a magnitude with a trailing %, e.g. -1.8 -> "1.8%". */
function formatDeltaPercent(value: number): string {
  return `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(Math.abs(value))}%`;
}

// ---------------------------------------------------------------------------
// KPI cell descriptors — spec order, labels, and per-KPI value formatting
// ---------------------------------------------------------------------------

/** Describes one KPI cell: which KpiValue to read, its label, and value formatter. */
interface KpiCellDescriptor {
  key: keyof OverviewKpis;
  label: string;
  format: (value: number) => string;
}

/**
 * The five KPI cells in spec order (plan §2 / Q5, ui-components.md §4). The
 * spec's KPI set and order supersede the template's. The same `format` function
 * is used for both the current value and the caption's previous value so a
 * cell's values stay visually consistent.
 */
const KPI_CELLS: readonly KpiCellDescriptor[] = [
  { key: 'pageViews', label: 'Page Views', format: formatInteger },
  { key: 'uniqueVisitors', label: 'Unique Visitors', format: formatInteger },
  { key: 'sessions', label: 'Sessions', format: formatInteger },
  { key: 'returningVisitorRate', label: 'Returning Visitor Rate', format: formatPercent },
  { key: 'pagesPerSession', label: 'Pages per Session', format: formatDecimal },
];

// Template delta-badge tint classes, preserved verbatim (rule 6). The Badge
// primitive's default-variant bg/text are overridden via cn/tailwind-merge.
const DELTA_UP_CLASSES = 'bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300';
const DELTA_DOWN_CLASSES = 'bg-destructive/10 text-destructive';

// ---------------------------------------------------------------------------
// Delta rendering — the three Q5 KpiValue variants
// ---------------------------------------------------------------------------

/**
 * Render the delta comparison for one KPI (the right-hand side of the value
 * row). The three Q5 variants map to distinct renderings:
 * - `previous: null`              -> a muted "no prior data" label (the
 *   comparison window ends before the first stored event).
 * - `previous: 0` / null delta    -> a muted "—" (delta not computable from a
 *   zero prior; never NaN/Infinity).
 * - numeric previous + delta      -> a tinted delta badge with an arrow
 *   (up for >= 0, down for < 0) and the magnitude percent.
 */
function renderDelta(kpi: KpiValue): React.ReactNode {
  // Q5 variant 2 — no prior data to compare against.
  if (kpi.previous === null) {
    return <span className="text-muted-foreground text-xs">no prior data</span>;
  }

  // Q5 variant 3 — prior measured but zero (or delta not computable): render
  // the em-dash marker. Guarding `deltaPercent === null` here as well keeps the
  // rendering NaN-free for any inconsistent payload.
  if (kpi.previous === 0 || kpi.deltaPercent === null) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  // Q5 variant 1 — numeric delta badge. The arrow conveys direction; the
  // displayed percent is the magnitude (abs), matching the template's display.
  const isUp = kpi.deltaPercent >= 0;
  return (
    <Badge className={isUp ? DELTA_UP_CLASSES : DELTA_DOWN_CLASSES}>
      {isUp ? <ArrowUpRightIcon /> : <ArrowDownRightIcon />}
      {formatDeltaPercent(kpi.deltaPercent)}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Empty-state detection
// ---------------------------------------------------------------------------

/**
 * An empty range (US3-9 / E-EMPTY) is one where every KPI current is zero —
 * no page views, no visitors, no sessions. The returning-visitor rate and
 * pages-per-session are also zero in that case (they derive from events). This
 * is the signal to render the template's dashed empty-panel instead of cells.
 */
function isEmptyRange(kpis: OverviewKpis): boolean {
  return (Object.values(kpis) as KpiValue[]).every((kpi) => kpi.current === 0);
}

// ---------------------------------------------------------------------------
// KpiStrip component
// ---------------------------------------------------------------------------

/** Props for the KpiStrip widget. */
export interface KpiStripProps {
  /** The five KPIs with comparison deltas, sourced from the overview payload. */
  kpis: OverviewKpis;
}

/**
 * KpiStrip — divided card strip of the five range KPIs with delta badges.
 *
 * Renders the template's outer card frame and responsive grid
 * (`md:grid-cols-2 xl:grid-cols-5`), one `Card` per KPI. Each cell shows the
 * `text-2xl tracking-tight` current value, a delta badge (or the "no prior
 * data" / "—" marker), and a "from <X> - last period" caption. When the range
 * is empty, the dashed empty-panel replaces the cell grid.
 */
export function KpiStrip({ kpis }: KpiStripProps) {
  // Empty range -> dashed empty-panel state (template placeholder pattern,
  // ui-components.md §5). The outer card frame is retained so the widget's
  // footprint does not shift between populated and empty states.
  if (isEmptyRange(kpis)) {
    return (
      <div className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
        <div className="flex h-64 items-center justify-center border border-border border-dashed text-muted-foreground text-sm">
          No analytics data for this range.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
      <div className="grid divide-y *:data-[slot=card]:rounded-none *:data-[slot=card]:ring-0 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
        {KPI_CELLS.map((cell) => {
          const kpi = kpis[cell.key];
          return (
            <Card key={cell.key}>
              <CardHeader>
                <CardTitle className="font-normal text-sm">{cell.label}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-2xl leading-none tracking-tight">
                    {cell.format(kpi.current)}
                  </div>
                  {renderDelta(kpi)}
                </div>

                {/* "from <X> - last period" caption — omitted when there is no
                     prior data (previous === null); the previous value uses the
                     cell's own formatter so units stay consistent. */}
                {kpi.previous !== null && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <span>
                      from <span className="text-foreground">{cell.format(kpi.previous)}</span>
                    </span>
                    <span>-</span>
                    <span>last period</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
