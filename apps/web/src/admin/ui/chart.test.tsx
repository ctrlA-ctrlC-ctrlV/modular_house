/**
 * T016 — Chart primitive render contract tests.
 *
 * Pins the template DOM contract for the ported recharts wrapper
 * `src/components/ui/chart.tsx` (ui-components.md §1 rule 9 / §3, plan §4.3 ADD):
 * `ChartContainer` renders a `data-slot="chart"` frame that hosts a recharts chart
 * and emits series colors as `var(--chart-N)` CSS-variable tokens (never literal
 * hex/rgb), and `ChartTooltipContent` renders the series label + numeric value when
 * active, reading its label/color config from the chart context. Until `ui/chart.tsx`
 * is ported (T017) the suite fails to resolve the import — the right reason (missing
 * module), not a test compile error.
 *
 * The fixture chart is composed with recharts `BarChart`/`Bar` directly in the test
 * only; widgets (T023 TrafficChart) reach recharts solely through this wrapper
 * (rule 9). Series colors use `var(--chart-N)` tokens to assert the CSS-variable
 * color plumbing that the wrapper's `ChartStyle` injects.
 *
 * jsdom notes: recharts `ResponsiveContainer` measures via `ResizeObserver` (mocked
 * globally in test/setup.ts as a no-op) and falls back to `ChartContainer`'s
 * `initialDimension` ({ width: 320, height: 200 }), so the chart surface renders
 * deterministically without real layout.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render } from '@testing-library/react';
import { BarChart, Bar } from 'recharts';

import { ChartContainer, ChartTooltipContent, type ChartConfig } from './chart.js';

// jsdom polyfills shared with the other primitive suites: recharts/Radix portal
// code paths call hasPointerCapture and scrollIntoView, which jsdom does not
// implement. Stubbed so render resolves deterministically (no pointer events used).
//
// recharts 3.7.0 ResponsiveContainer measures its host div via getBoundingClientRect
// inside a useEffect; jsdom returns 0×0 (no layout), which overrides ChartContainer's
// initialDimension and makes the context provider drop the chart (non-positive size).
// Returning the initialDimension size keeps the chart rendered deterministically —
// the production path still measures the real parent in a browser.
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

// Fixture chart config — series colors resolve to var(--chart-N) design tokens
// (rule 9, template DESIGN.md §2). The wrapper's ChartStyle emits these as
// `--color-<key>: var(--chart-N)` CSS variables, which the recharts series then
// references via `var(--color-<key>)`. No literal color values anywhere.
const FIXTURE_CONFIG: ChartConfig = {
  views: { label: 'Page Views', color: 'var(--chart-1)' },
  sessions: { label: 'Sessions', color: 'var(--chart-2)' },
};

// Fixture timeseries data — domain-agnostic buckets so the primitive contract is
// verified in isolation. The exact bucket granularity (Q4) is pinned by the
// TrafficChart widget suite (T022), not here.
const FIXTURE_DATA = [
  { day: 'Mon', views: 120, sessions: 30 },
  { day: 'Tue', views: 200, sessions: 50 },
  { day: 'Wed', views: 150, sessions: 40 },
] as const;

// Fixture tooltip payload — one active series entry. recharts 3.7.0's `Payload`
// type requires `graphicalItemId`; `type` is omitted (recharts `TooltipType` is
// `'none'` only, and the content filters `item.type !== 'none'`, so `undefined`
// passes the filter and the item renders). The `color` is a `var(--color-*)`
// reference emitted by ChartStyle, exercising the rule-9 token invariant.
const FIXTURE_PAYLOAD = [
  {
    dataKey: 'views',
    name: 'views',
    value: 42,
    color: 'var(--color-views)',
    payload: { day: 'Mon', views: 42, sessions: 10 },
    graphicalItemId: 'bar-0',
  },
];

// Renders the wrapper around a minimal recharts BarChart fed by the fixture data.
// Reused across the ChartContainer-level assertions.
function renderChart() {
  return render(
    <ChartContainer config={FIXTURE_CONFIG}>
      <BarChart data={[...FIXTURE_DATA]}>
        <Bar dataKey="views" />
      </BarChart>
    </ChartContainer>,
  );
}

describe('Chart primitive — render contract (T016)', () => {
  it('ChartContainer renders a data-slot="chart" frame hosting a recharts surface', () => {
    const { container } = renderChart();

    // The wrapper's outer div carries the data-slot contract (template rule 5)
    // and a data-chart id used to scope the injected CSS-variable style block.
    const chart = container.querySelector('[data-slot="chart"]');
    expect(chart).not.toBeNull();
    expect(chart?.getAttribute('data-chart')).toMatch(/^chart-/);

    // recharts renders its SVG surface under the wrapper; its presence proves the
    // ResponsiveContainer hosted the chart from the fixture config (rule 9).
    expect(chart?.querySelector('.recharts-surface')).not.toBeNull();
  });

  it('ChartStyle emits series colors as var(--chart-N) tokens, never literal hex/rgb', () => {
    const { container } = renderChart();

    // ChartStyle injects a <style> block whose rules map each config key to its
    // color as a CSS custom property: `--color-views: var(--chart-1)`.
    const styleEl = container.querySelector('style');
    expect(styleEl).not.toBeNull();
    const css = styleEl?.textContent ?? '';

    // The token plumbing is present: each series key resolves to its chart token.
    expect(css).toContain('--color-views');
    expect(css).toContain('var(--chart-1)');
    expect(css).toContain('--color-sessions');
    expect(css).toContain('var(--chart-2)');

    // No literal color values leak into the emitted style: no hex codes, no rgb().
    // This is the rule-9 invariant — series colors are token-driven, never literals.
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgba?\(/i);
  });

  it('ChartTooltipContent renders the config label and numeric value when active', () => {
    // ChartTooltipContent reads its label/color config via useChart(), so it must
    // render inside a ChartContainer (the context provider). The child flows
    // through ResponsiveContainer; a wrapping div carries the tooltip content —
    // ResponsiveContainer renders its children regardless of type, and the
    // ChartContext provider wraps the whole subtree.
    const { container } = render(
      <ChartContainer config={FIXTURE_CONFIG}>
        <div>
          <ChartTooltipContent active={true} payload={FIXTURE_PAYLOAD} />
        </div>
      </ChartContainer>,
    );

    // The series label is sourced from the fixture config ("Page Views"), proving
    // the tooltip resolves labels through the chart context — not a passed string.
    expect(container.textContent).toContain('Page Views');

    // The numeric value renders localized; 42 has no thousands grouping so it is
    // locale-stable. Rendered inside a tabular-nums span (template chart.tsx).
    expect(container.textContent).toContain('42');
  });

  it('ChartTooltipContent indicator uses a CSS-variable color, not a literal', () => {
    // The default indicator is a "dot" whose inline style sets --color-bg and
    // --color-border to the payload color. With a var(--color-*) payload color,
    // the inline style must carry the CSS variable — never a literal hex/rgb.
    const { container } = render(
      <ChartContainer config={FIXTURE_CONFIG}>
        <div>
          <ChartTooltipContent active={true} payload={FIXTURE_PAYLOAD} />
        </div>
      </ChartContainer>,
    );

    // The indicator element carries the inline CSS-variable color bindings. Find
    // any element whose style reflects the payload color token.
    const styled = container.querySelector('[style*="--color-bg"]');
    expect(styled).not.toBeNull();
    const inlineStyle = styled?.getAttribute('style') ?? '';

    // The indicator color resolves to the CSS variable, not a literal color value.
    expect(inlineStyle).toContain('var(--color-views)');
    expect(inlineStyle).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(inlineStyle).not.toMatch(/rgba?\(/i);
  });
});
