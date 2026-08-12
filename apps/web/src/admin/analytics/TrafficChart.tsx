/**
 * TrafficChart widget — Phase 2 admin analytics (Pass 1, fixture data only).
 *
 * Adapts the Studio Admin template `_components/traffic-quality.tsx`
 * (ui-components.md §1 compatibility rules 1–10, §1 rule 9, §4) to the
 * project's Vite/React 18.3 setup. Renders a card-framed ComposedChart of page
 * views + sessions per bucket, fed exclusively from the T008 fixture payloads
 * (no live API calls, no data wiring — Pass 1).
 *
 * Spec-driven adaptations (research R11 / ui-components.md §4 — nothing is
 * taste):
 * - **Series superseded.** The two series are the spec's page views + sessions
 *   per bucket (FR-029), replacing the template's "actual quality" /
 *   "baseline quality" fixture series. Both are real data, so both render as
 *   solid lines in distinct `var(--chart-N)` tokens (no dashed baseline).
 * - **Per-card ellipsis menu omitted.** The template's `CardAction` with an
 *   `Ellipsis` icon is not shipped this phase — follows the KpiStrip precedent
 *   ("no per-card menu shipped", ui-components.md §4 KpiStrip row).
 * - **Bucket-label formatter.** XAxis ticks format by granularity: day buckets
 *   render "d MMM" (e.g. "15 Apr"), hour buckets render "HH:mm" (e.g. "13:00")
 *   (Q4). Labels format in the Europe/London timezone — buckets are Europe/
 *   London per Q4, so the displayed time matches the bucket boundary a human
 *   would expect (e.g. a 12:00 UTC bucket shows 13:00 during BST).
 * - **Title.** "Traffic Over Time" reflects the spec's series (FR-029),
 *   replacing the template's "Traffic Quality".
 * - **Dashed empty state.** When the timeseries is empty (US3-9 / E-EMPTY),
 *   the chart is replaced by the template's dashed `border-border`
 *   `text-muted-foreground` empty panel inside the retained card frame.
 *
 * Rule 9 (recharts through chart.tsx): all recharts components — both the
 * wrapper infrastructure (ChartContainer, ChartTooltip, ChartTooltipContent)
 * and the structural chart components (ComposedChart, Line, XAxis, YAxis,
 * CartesianGrid) — are imported from the ported `chart.tsx` wrapper. The
 * wrapper re-exports the structural components under its namespace so widgets
 * never reach the `recharts` module directly. Series colors are
 * `var(--color-pageViews)` / `var(--color-sessions)` references that resolve
 * to `var(--chart-N)` tokens emitted by ChartStyle — never literal colors.
 *
 * Port mechanics (rules 1–10): `"use client"` stripped (rule 1); `@/components`
 * rewritten to relative `../ui/*` (rule 2); no `next/*` (rule 3); no
 * `lucide-react` (rule 4 — the template's Ellipsis icon is omitted, not
 * replaced); `data-slot` attributes preserved via the Phase 1 `Card` primitive
 * and the T017 `ChartContainer` (rule 5); Tailwind token class strings
 * preserved verbatim (rule 6).
 */
import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.js';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from '../ui/chart.js';

import type { AnalyticsRange, BucketGranularity, TimeseriesBucket } from './fixtures.js';

// ---------------------------------------------------------------------------
// Chart config — series colors resolve to var(--chart-N) design tokens (rule 9)
// ---------------------------------------------------------------------------

/**
 * Per-series chart configuration. Each entry's `color` is a `var(--chart-N)`
 * token string; ChartStyle emits these as `--color-<key>` CSS variables that
 * the recharts series reference via `var(--color-<key>)`. The two series are
 * the spec's page views (chart-1) + sessions (chart-2), replacing the
 * template's "quality" series (FR-029).
 */
const chartConfig = {
  pageViews: { label: 'Page Views', color: 'var(--chart-1)' },
  sessions: { label: 'Sessions', color: 'var(--chart-2)' },
} satisfies ChartConfig;

// ---------------------------------------------------------------------------
// Bucket-label formatting — granularity-dependent (Q4)
// ---------------------------------------------------------------------------

/**
 * Format a bucket-start ISO datetime for the XAxis tick label, by granularity.
 *
 * - Day buckets render "d MMM" (e.g. "15 Apr") — the calendar day + month
 *   abbreviation, appropriate for multi-day ranges.
 * - Hour buckets render "HH:mm" (e.g. "13:00") — the time of day, appropriate
 *   for sub-day ranges (24-hour preset, Q4).
 *
 * Formatting uses `timeZone: 'Europe/London'` because Q4 specifies buckets are
 * Europe/London — the displayed time matches the London-time bucket boundary a
 * human would expect (e.g. a 12:00 UTC bucket shows 13:00 during BST).
 * `hour12: false` forces 24-hour time for the hour format.
 */
function formatBucketLabel(bucketStart: string, granularity: BucketGranularity): string {
  const date = new Date(bucketStart);

  if (granularity === 'hour') {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/London',
    }).format(date);
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/London',
  }).format(date);
}

// ---------------------------------------------------------------------------
// X-axis tick-density control — day buckets only (T137, Group C / FR-029)
// ---------------------------------------------------------------------------

/**
 * Maximum number of x-axis tick labels to render for a day-bucket series.
 * Kept within the task's ~12-15 legibility allowance. Hour-bucket series are
 * already few enough (at most 48 buckets for the 2-day cap, Q4) and are left
 * on the chart's original one-tick-per-bucket behaviour untouched — this cap
 * applies to day buckets only.
 */
const MAX_DAY_TICKS = 12;

/**
 * Computes an evenly-spaced subset of a day-bucket series' `bucketStart`
 * values to pass as the XAxis's explicit `ticks` prop, capping the number of
 * rendered labels regardless of total bucket count (e.g. ~91 buckets for the
 * default 3-month range). Mirrors the reference template's own tick-pinning
 * technique (`traffic-quality.tsx`'s `weeklyTicks`), adapted for this chart's
 * category axis: the template's `dataKey` is a synthetic numeric index it can
 * invent arbitrary tick positions for, whereas this chart's `dataKey` is the
 * raw `bucketStart` ISO string, so the explicit `ticks` array must reference
 * values that actually exist in the series. Returns every bucket unchanged
 * when the series already fits within the cap, so short day-bucket fixtures
 * (and short real ranges) are unaffected.
 */
function computeDayTickSubset(timeseries: readonly TimeseriesBucket[]): string[] {
  if (timeseries.length <= MAX_DAY_TICKS) {
    return timeseries.map((bucket) => bucket.bucketStart);
  }

  // Evenly-spaced index positions across the full series, including both
  // endpoints, so the axis always shows the range's first and last bucket.
  const lastIndex = timeseries.length - 1;
  const step = lastIndex / (MAX_DAY_TICKS - 1);
  const indices = new Set<number>();
  for (let i = 0; i < MAX_DAY_TICKS; i++) {
    indices.add(Math.round(i * step));
  }

  return Array.from(indices)
    .sort((a, b) => a - b)
    .map((index) => timeseries[index].bucketStart);
}

// ---------------------------------------------------------------------------
// TrafficChart component
// ---------------------------------------------------------------------------

/** Props for the TrafficChart widget. */
export interface TrafficChartProps {
  /** The range echo, including the bucket granularity (Q4) for tick formatting. */
  range: AnalyticsRange;
  /** The timeseries buckets (page views + sessions per bucket). */
  timeseries: TimeseriesBucket[];
}

/**
 * TrafficChart — traffic-over-time chart (FR-029).
 *
 * Card frame hosting a `ComposedChart` of two `Line` series (page views +
 * sessions per bucket) inside the ported `ChartContainer` wrapper. XAxis ticks
 * are formatted by bucket granularity (day → "d MMM", hour → "HH:mm"). When the
 * timeseries is empty, the dashed empty-panel replaces the chart (US3-9).
 */
export function TrafficChart({ range, timeseries }: TrafficChartProps) {
  // Empty range (US3-9 / E-EMPTY) — dashed empty-panel state (template
  // placeholder pattern, ui-components.md §5). The card frame is retained so
  // the widget's footprint does not shift between populated and empty states.
  if (timeseries.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="font-normal">Traffic Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-68 w-full items-center justify-center border border-border border-dashed text-muted-foreground text-sm">
            No analytics data for this range.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Tick formatter closes over the bucket granularity so recharts can format
  // each tick value (the bucketStart ISO string) into a human-readable label.
  const tickFormatter = (value: string) => formatBucketLabel(value, range.bucket);

  // Explicit tick subset — day buckets only (T137, Group C). Hour-bucket
  // series pass `undefined`, which leaves XAxis's default category-axis tick
  // derivation (every data point, per `interval={0}` below) untouched — the
  // 2-day hour view is already few enough buckets and must stay unchanged.
  const dayTicks =
    range.bucket === 'day' ? computeDayTickSubset(timeseries) : undefined;

  // Tooltip label formatter — shows the bucket start formatted by granularity,
  // so the tooltip header reads "15 Apr" or "12:00" instead of a raw ISO string.
  // The recharts labelFormatter signature passes ReactNode (the axis value may
  // be undefined for empty payloads); only string values are formatted, the
  // rest pass through unchanged.
  const tooltipLabelFormatter = (label: React.ReactNode): React.ReactNode => {
    if (typeof label === 'string') {
      return formatBucketLabel(label, range.bucket);
    }
    return label;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal">Traffic Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-68 w-full">
          <ComposedChart data={timeseries} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="bucketStart"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              interval={0}
              ticks={dayTicks}
              tickFormatter={tickFormatter}
            />
            <YAxis axisLine={false} tickLine={false} tickMargin={10} width={34} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="w-40"
                  labelFormatter={tooltipLabelFormatter}
                />
              }
            />
            {/* Page views — primary series, chart-1 token, solid line (FR-029). */}
            <Line
              dataKey="pageViews"
              dot={false}
              activeDot={{ r: 4 }}
              stroke="var(--color-pageViews)"
              strokeWidth={2.5}
              type="linear"
            />
            {/* Sessions — secondary series, chart-2 token, solid line (FR-029). */}
            <Line
              dataKey="sessions"
              dot={false}
              stroke="var(--color-sessions)"
              strokeWidth={2}
              type="linear"
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
