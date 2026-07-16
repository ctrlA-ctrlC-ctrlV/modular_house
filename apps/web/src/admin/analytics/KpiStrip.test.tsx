/**
 * T020 — KpiStrip widget static render tests (Pass 1, fixture data only).
 *
 * Pins the render contract for the KpiStrip widget that adapts the template
 * `_components/analytics-kpi-strip.tsx` (ui-components.md §4, plan §4.3 ADD,
 * FR-018, Q5). Asserted against the T008 fixture payloads only — no live API
 * calls, no data wiring (Pass 1). Until `KpiStrip.tsx` exists (T021) the suite
 * fails to resolve the import — the right reason (missing module), not a test
 * compile error.
 *
 * Covered contract points:
 * - Exactly five KPI cells in spec order: page views, unique visitors,
 *   sessions, returning-visitor rate, pages per session (spec supersedes the
 *   template's KPI set per ui-components.md §4).
 * - `text-2xl tracking-tight` current-value rendering (template token classes).
 * - Q5 delta rendering across the three KpiValue variants:
 *   1. numeric previous -> tinted delta badge (arrow + percent).
 *   2. `previous: null`  -> "no prior data" (no badge).
 *   3. `previous: 0`     -> "—" (no badge, delta not computable).
 * - Up arrow + green tint for positive deltas; down arrow + destructive tint
 *   for negative deltas (template badge styling preserved verbatim).
 * - "from X - last period" caption with the previous value (numeric/zero);
 *   omitted when previous is null (documented adaptation of "from X • last
 *   4 weeks").
 * - Dashed empty-panel state when every KPI current is zero (US3-9 / E-EMPTY,
 *   template placeholder pattern per ui-components.md §5).
 * - No NaN/Infinity ever leaks into the rendered text (Q5 invariant).
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import { KpiStrip } from './KpiStrip.js';
import {
  overviewPopulated,
  overviewNoPriorData,
  overviewZeroPrevious,
  overviewHourly,
  overviewEmpty,
  type OverviewKpis,
} from './fixtures.js';

// Spec-defined KPI order and labels (plan §2 / Q5, ui-components.md §4). The
// strip must render exactly these five cells in this order — the spec's KPI
// set supersedes the template's (Unique Visitors / Sessions / Pageviews /
// Engagement Rate / Conversion Rate).
const EXPECTED_LABELS = [
  'Page Views',
  'Unique Visitors',
  'Sessions',
  'Returning Visitor Rate',
  'Pages per Session',
] as const;

// Renders the strip with a given KPI set and returns the card cells in document
// order. Reused across the per-fixture assertions.
function renderCells(kpis: OverviewKpis) {
  const { container } = render(<KpiStrip kpis={kpis} />);
  return { container, cells: container.querySelectorAll('[data-slot="card"]') };
}

// Strips thousands grouping so digit assertions are stable regardless of the
// runtime's ICU grouping configuration (en-GB groups with commas).
const digits = (text: string | null | undefined) => (text ?? '').replace(/,/g, '');

describe('KpiStrip widget — static render contract (T020)', () => {
  it('renders exactly five KPI cells with the spec labels in order', () => {
    const { cells } = renderCells(overviewPopulated.kpis);

    expect(cells).toHaveLength(5);

    const titles = Array.from(cells).map(
      (cell) => cell.querySelector('[data-slot="card-title"]')?.textContent ?? '',
    );
    expect(titles).toEqual([...EXPECTED_LABELS]);
  });

  it('renders the current value in a text-2xl tracking-tight element per cell', () => {
    const { cells } = renderCells(overviewPopulated.kpis);

    // Page Views current = 4820 -> rendered "4,820" (en-GB grouping). Asserted
    // on the first cell as representative; the value element carries the
    // template's `text-2xl leading-none tracking-tight` classes (rule 6).
    const valueEl = cells[0].querySelector('.text-2xl');
    expect(valueEl).not.toBeNull();
    expect(valueEl?.className).toContain('tracking-tight');
    expect(digits(valueEl?.textContent)).toContain('4820');
  });

  it('renders a tinted delta badge with the percent for numeric previous', () => {
    const { cells } = renderCells(overviewPopulated.kpis);

    // Every populated KPI has a numeric previous + numeric deltaPercent, so
    // every cell renders a delta badge (Q5 variant 1).
    for (const cell of cells) {
      const badge = cell.querySelector('[data-slot="badge"]');
      expect(badge).not.toBeNull();
    }

    // Page Views delta = 22.0% (up). The badge carries the up-arrow green tint
    // from the template and the rounded percent text (magnitude only; the arrow
    // conveys direction).
    const firstBadge = cells[0].querySelector('[data-slot="badge"]');
    expect(firstBadge?.className).toContain('bg-green-500/10');
    expect(firstBadge?.textContent).toContain('22');
    expect(firstBadge?.textContent).toContain('%');
  });

  it('renders the down arrow + destructive tint for a negative delta', () => {
    const { cells } = renderCells(overviewHourly.kpis);

    // Pages per Session (5th cell) has deltaPercent -1.8 -> down arrow +
    // destructive tint; the displayed magnitude is abs(-1.8) = "1.8%".
    const ppsBadge = cells[4].querySelector('[data-slot="badge"]');
    expect(ppsBadge).not.toBeNull();
    expect(ppsBadge?.className).toContain('bg-destructive/10');
    expect(ppsBadge?.textContent).toContain('1.8');
  });

  it('renders "no prior data" and no badge when previous is null', () => {
    const { cells } = renderCells(overviewNoPriorData.kpis);

    for (const cell of cells) {
      const badge = cell.querySelector('[data-slot="badge"]');
      expect(badge).toBeNull();
      expect(cell.textContent).toContain('no prior data');
      // No previous value exists -> the "from X - last period" caption is
      // omitted (the "no prior data" text replaces the whole comparison row).
      expect(cell.textContent).not.toContain('last period');
    }
  });

  it('renders "—" and no badge when previous is zero (delta not computable)', () => {
    const { cells } = renderCells(overviewZeroPrevious.kpis);

    for (const cell of cells) {
      const badge = cell.querySelector('[data-slot="badge"]');
      expect(badge).toBeNull();
      // Em-dash "—" (U+2014) — the not-computable delta marker (Q5 variant 3).
      expect(cell.textContent).toContain('—');
    }
  });

  it('renders the "from X - last period" caption with the previous value', () => {
    const { cells } = renderCells(overviewPopulated.kpis);

    // Page Views previous = 3950 -> "3,950". The caption uses the adapted
    // "from <X> - last period" form (template: "from <X> • last 4 weeks").
    const firstCell = cells[0];
    expect(firstCell.textContent).toContain('from');
    expect(digits(firstCell.textContent)).toContain('3950');
    expect(firstCell.textContent).toContain('last period');
  });

  it('renders the dashed empty-panel state when every KPI current is zero', () => {
    const { container, cells } = renderCells(overviewEmpty.kpis);

    // Empty range (US3-9 / E-EMPTY): no KPI cells, just the template's dashed
    // border-border frame with muted-foreground text (ui-components.md §5).
    expect(cells).toHaveLength(0);
    const dashed = container.querySelector('.border-dashed');
    expect(dashed).not.toBeNull();
    expect(dashed?.className).toContain('text-muted-foreground');
  });

  it('never renders NaN or Infinity for any Q5 state', () => {
    // Q5 invariant: deltas never render NaN/Infinity. Asserted across every
    // fixture variant — including the zero-previous and empty edge cases where
    // a naive current/previous division would produce NaN or Infinity.
    const allKpis: OverviewKpis[] = [
      overviewPopulated.kpis,
      overviewNoPriorData.kpis,
      overviewZeroPrevious.kpis,
      overviewHourly.kpis,
      overviewEmpty.kpis,
    ];
    for (const kpis of allKpis) {
      const { container } = renderCells(kpis);
      expect(container.textContent).not.toContain('NaN');
      expect(container.textContent).not.toContain('Infinity');
    }
  });
});
