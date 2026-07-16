/**
 * T022 — TrafficChart widget static render tests (Pass 1, fixture data only).
 *
 * Pins the render contract for the TrafficChart widget that adapts the template
 * `_components/traffic-quality.tsx` (ui-components.md §1 rule 9 / §4, plan
 * §4.3 ADD, FR-029, Q4). Asserted against the T008 fixture payloads only — no
 * live API calls, no data wiring (Pass 1). Until `TrafficChart.tsx` exists
 * (T023) the suite fails to resolve the import — the right reason (missing
 * module), not a test compile error.
 *
 * Covered contract points:
 * - The chart renders through the ported `chart.tsx` wrapper: the recharts
 *   surface is hosted inside a `data-slot="chart"` ChartContainer frame (rule 9
 *   — recharts reached through chart.tsx, never a bare recharts chart).
 * - Both series render: page views (`var(--chart-1)`) + sessions
 *   (`var(--chart-2)`), emitted as `--color-*` CSS variables by ChartStyle —
 *   the rule-9 token invariant (no literal colors).
 * - Bucket labels differ by granularity: day fixtures show date-formatted ticks
 *   ("d MMM"), hour fixtures show time-formatted ticks ("HH:mm") (Q4).
 * - Dashed empty-panel state when the timeseries is empty (US3-9 / E-EMPTY,
 *   template placeholder pattern per ui-components.md §5).
 *
 * jsdom notes: recharts `ResponsiveContainer` measures via `getBoundingClientRect`
 * (jsdom returns 0×0 by default, which makes the chart drop). Stubbed to return
 * a non-zero size so the chart surface renders deterministically — same stubs as
 * the chart primitive suite (T016). `hasPointerCapture` / `scrollIntoView` are
 * not implemented by jsdom and are stubbed for recharts portal code paths.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render } from '@testing-library/react';

import { TrafficChart } from './TrafficChart.js';
import {
  overviewPopulated,
  overviewHourly,
  overviewEmpty,
} from './fixtures.js';

// jsdom stubs shared with the chart primitive suite (T016): recharts
// ResponsiveContainer measures its host via getBoundingClientRect; jsdom
// returns 0×0 (no layout), which overrides ChartContainer's initialDimension
// and makes the chart drop (non-positive size). Returning a non-zero size
// keeps the chart rendered deterministically — the production path measures the
// real parent in a browser.
const ORIGINAL_GETBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
beforeAll(() => {
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = () => {};
  }
  HTMLElement.prototype.getBoundingClientRect = function () {
    return {
      width: 320,
      height: 200,
      top: 0,
      left: 0,
      right: 320,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON() {},
    } as DOMRect;
  };
});

afterAll(() => {
  HTMLElement.prototype.getBoundingClientRect = ORIGINAL_GETBoundingClientRect;
});

// Renders the chart with a given fixture's range + timeseries and returns the
// container. Reused across the per-fixture assertions.
function renderChart(
  range: typeof overviewPopulated.range,
  timeseries: typeof overviewPopulated.timeseries,
) {
  return render(<TrafficChart range={range} timeseries={timeseries} />);
}

// Collects axis tick-value text contents. recharts renders tick labels as
// <text class="recharts-text recharts-cartesian-axis-tick-value"> elements
// (the tick-value class sits on the <text> itself, not a parent group). YAxis
// number ticks share the class but never match the date/time regexes below.
function xAxisTickTexts(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll('.recharts-cartesian-axis-tick-value'),
  ).map((el) => el.textContent ?? '');
}

describe('TrafficChart widget — static render contract (T022)', () => {
  it('renders the chart through the ported chart.tsx wrapper (data-slot="chart")', () => {
    // Rule 9: recharts is reached through chart.tsx only. The ChartContainer
    // frame (data-slot="chart") is the wrapper's DOM contract — its presence
    // proves the recharts surface is hosted inside chart.tsx, not rendered as
    // a bare recharts chart bypassing the wrapper.
    const { container } = renderChart(
      overviewPopulated.range,
      overviewPopulated.timeseries,
    );

    const chart = container.querySelector('[data-slot="chart"]');
    expect(chart).not.toBeNull();
    expect(chart?.querySelector('.recharts-surface')).not.toBeNull();
  });

  it('renders both series (page views + sessions) with var(--chart-N) token colors', () => {
    // Both series are configured via ChartContainer's config; ChartStyle emits
    // each series' color as a --color-<key> CSS variable resolving to a
    // var(--chart-N) token (rule 9 — no literal colors).
    const { container } = renderChart(
      overviewPopulated.range,
      overviewPopulated.timeseries,
    );

    const styleEl = container.querySelector('style');
    expect(styleEl).not.toBeNull();
    const css = styleEl?.textContent ?? '';

    // Both series' CSS variables are present.
    expect(css).toContain('--color-pageViews');
    expect(css).toContain('--color-sessions');

    // Series colors resolve to chart tokens, never literal hex/rgb.
    expect(css).toContain('var(--chart-1)');
    expect(css).toContain('var(--chart-2)');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgba?\(/i);
  });

  it('renders day-bucket labels for the day fixture', () => {
    // Q4: day buckets for spans > 2 days. The populated fixture has a 3-month
    // span with day buckets — XAxis ticks must show date-formatted labels
    // ("d MMM", e.g. "15 Apr"), not time labels.
    const { container } = renderChart(
      overviewPopulated.range,
      overviewPopulated.timeseries,
    );

    const ticks = xAxisTickTexts(container);
    // At least one tick carries a month abbreviation (the day-bucket format).
    expect(ticks.some((t) => /Apr|May|Jun|Jul/i.test(t))).toBe(true);
    // No tick carries a time-format colon (that would be an hour-bucket label).
    expect(ticks.some((t) => /:\d{2}/.test(t))).toBe(false);
  });

  it('renders hour-bucket labels for the hour fixture', () => {
    // Q4: hour buckets for spans <= 2 days. The hourly fixture has a 24-hour
    // span with hour buckets — XAxis ticks must show time-formatted labels
    // ("HH:mm", e.g. "12:00"), not date labels.
    const { container } = renderChart(
      overviewHourly.range,
      overviewHourly.timeseries,
    );

    const ticks = xAxisTickTexts(container);
    // At least one tick carries a time-format colon (the hour-bucket format).
    expect(ticks.some((t) => /:\d{2}/.test(t))).toBe(true);
  });

  it('renders the dashed empty state when timeseries is empty', () => {
    // US3-9 / E-EMPTY: an empty range shows the template's dashed border-border
    // frame with text-muted-foreground (ui-components.md §5). No chart surface.
    const { container } = renderChart(
      overviewEmpty.range,
      overviewEmpty.timeseries,
    );

    expect(container.querySelector('[data-slot="chart"]')).toBeNull();
    const dashed = container.querySelector('.border-dashed');
    expect(dashed).not.toBeNull();
    expect(dashed?.className).toContain('text-muted-foreground');
  });
});
