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
 *   render "d MMM" (e.g. "15 Apr"), hour buckets render "HH:mm" (e.g. "12:00")
 *   (Q4). UTC formatting ensures deterministic labels regardless of the
 *   runner's timezone.
 * - **Title.** "Traffic Over Time" reflects the spec's series (FR-029),
 *   replacing the template's "Traffic Quality".
 * - **Dashed empty state.** When the timeseries is empty (US3-9 / E-EMPTY),
 *   the chart is replaced by the template's dashed `border-border`
 *   `text-muted-foreground` empty panel inside the retained card frame.
 *
 * Rule 9 (recharts through chart.tsx): the chart is hosted inside
 * `ChartContainer` (the ported chart.tsx wrapper), which provides the
 * `data-slot="chart"` frame, the CSS-variable color plumbing (ChartStyle), and
 * the tooltip machinery. Series colors are `var(--color-pageViews)` /
 * `var(--color-sessions)` references that resolve to `var(--chart-N)` tokens
 * emitted by ChartStyle — never literal colors. The structural recharts
 * components (ComposedChart, Line, XAxis, YAxis, CartesianGrid) are imported
 * from recharts as in the template; chart.tsx's inventory (§3) scopes it to
 * ChartContainer / ChartTooltip / ChartTooltipContent / ChartConfig, and the
 * wrapper does not re-export the structural components.
 *
 * Port mechanics (rules 1–10): `"use client"` stripped (rule 1); `@/components`
 * rewritten to relative `../ui/*` (rule 2); no `next/*` (rule 3); no
 * `lucide-react` (rule 4 — the template's Ellipsis icon is omitted, not
 * replaced); `data-slot` attributes preserved via the Phase 1 `Card` primitive
 * and the T017 `ChartContainer` (rule 5); Tailwind token class strings
 * preserved verbatim (rule 6).
 */
import * as React from 'react';
import { CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.js';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
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
 * - Hour buckets render "HH:mm" (e.g. "12:00") — the time of day, appropriate
 *   for sub-day ranges (24-hour preset, Q4).
 *
 * Formatting uses `timeZone: 'UTC'` so labels are deterministic regardless of
 * the runtime's timezone — the bucket boundaries are UTC instants in the
 * fixture payloads. `hour12: false` forces 24-hour time for the hour format.
 */
function formatBucketLabel(bucketStart: string, granularity: BucketGranularity): string {
  const date = new Date(bucketStart);

  if (granularity === 'hour') {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).format(date);
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(date);
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
