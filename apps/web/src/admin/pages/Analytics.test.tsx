/**
 * T034 — Analytics page static render tests (Pass 1, fixture data only).
 *
 * Pins the render contract for the Analytics page that adapts the template
 * `analytics/page.tsx` (ui-components.md §4, plan §4.3 ADD, FR-022/FR-024,
 * US3-13). Asserted against the T008 fixture payloads only — no live API
 * calls, no data wiring (Pass 1). Until `pages/Analytics.tsx` exists (T035)
 * the suite fails to resolve the import — the right reason (missing module),
 * not a test compile error.
 *
 * Covered contract points (T034 "Do:" clause, in order):
 * - Tab row: Overview is the active tab by default; the five tab triggers
 *   render (Overview, Audience, Acquisition, Engagement, Conversions);
 *   non-Overview tabs render the template's own dashed "coming soon"
 *   placeholder panels when activated (FR-022: follows template; FR-024:
 *   accommodates later tab additions without reworking existing widgets).
 * - All six widget regions present from fixtures: RangeToolbar, KpiStrip,
 *   TrafficChart, RealtimeCard, TopPages, TrafficSources — each renders its
 *   card frame / trigger from the T008 fixture payloads (no data fetching).
 * - Single-column stacking at mobile width: the grid containers carry
 *   `grid-cols-1` (mobile base) and `xl:grid-cols-12` (xl override) so the
 *   widgets stack in a single column below the `xl` breakpoint and spread
 *   across the 12-col grid at `xl`+ (FR-022: "adapt to small viewports
 *   without horizontal scrolling").
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { Analytics } from './Analytics.js';

/**
 * The five tab labels in the spec/template order (FR-022: follows template;
 * FR-024: tab set is an extension point). Overview is the default-active tab;
 * the other four render the template's own dashed "coming soon" placeholder
 * panels when activated.
 */
const TAB_LABELS = [
  'Overview',
  'Audience',
  'Acquisition',
  'Engagement',
  'Conversions',
] as const;

describe('Analytics page — static render contract (T034)', () => {
  beforeAll(() => {
    // Radix primitives portal content and reference pointer/scroll APIs
    // jsdom does not implement. Polyfill them so keyboard interactions and
    // select rendering resolve deterministically — identical to the select
    // (T010) and dialog (T014) primitive suites.
    if (!Element.prototype.hasPointerCapture) {
      Element.prototype.hasPointerCapture = () => false;
    }
    if (!Element.prototype.setPointerCapture) {
      Element.prototype.setPointerCapture = () => undefined;
    }
    if (!Element.prototype.releasePointerCapture) {
      Element.prototype.releasePointerCapture = () => undefined;
    }
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = () => undefined;
    }
  });

  // ── Tab row ─────────────────────────────────────────────────────────

  it('renders the five tab triggers with Overview active by default (FR-022)', () => {
    render(<Analytics />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(TAB_LABELS.length);
    TAB_LABELS.forEach((label, index) => {
      expect(tabs[index]).toHaveTextContent(label);
    });

    // Overview (the first tab) is active by default (template
    // defaultValue="overview"; Radix Tabs sets aria-selected="true" and
    // data-state="active" on the active trigger).
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('data-state', 'active');
  });

  it('renders the template dashed "coming soon" placeholder when a non-Overview tab is activated', async () => {
    // FR-022: follows template; FR-024: non-Overview tabs are placeholder
    // panels only (guardrails). Radix Tabs only mounts the active
    // TabsContent, so clicking a non-Overview tab reveals its placeholder
    // panel. The template's placeholder is a dashed `border-border`
    // `text-muted-foreground` panel with "X view coming soon." text.
    render(<Analytics />);
    // Radix Tabs uses automatic activation (the default): ArrowRight on the
    // focused tab moves focus to the next tab AND activates it. This is the
    // keyboard-first approach proven by the tabs primitive suite (T012) —
    // more reliable in jsdom than pointer events.
    const overviewTab = screen.getByRole('tab', { name: 'Overview' });
    overviewTab.focus();
    fireEvent.keyDown(overviewTab, { key: 'ArrowRight' });

    // The Audience tab is now active and its placeholder panel is mounted.
    // Await the focus move + activation (mirrors the T012 waitFor pattern).
    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole('tab', { name: 'Audience' }),
      );
    });
    const audienceTab = screen.getByRole('tab', { name: 'Audience' });
    expect(audienceTab).toHaveAttribute('aria-selected', 'true');
    const placeholder = screen.getByText(/audience view coming soon/i);
    expect(placeholder).toBeInTheDocument();
    expect(placeholder.className).toContain('border-dashed');
    expect(placeholder.className).toContain('text-muted-foreground');
  });

  // ── Six widget regions from fixtures ────────────────────────────────

  it('renders all six widget regions from fixtures when Overview is active', () => {
    // The six widget regions: RangeToolbar, KpiStrip, TrafficChart,
    // RealtimeCard, TopPages, TrafficSources. Each renders its card frame or
    // trigger from the T008 fixture payloads — no data fetching (Pass 1).
    render(<Analytics />);

    // 1. RangeToolbar — the select trigger (combobox role) with the default
    //    "3 months" value.
    const selectTrigger = screen.getByRole('combobox');
    expect(selectTrigger).toHaveTextContent('3 months');

    // 2. KpiStrip — five KPI cards (Page Views, Unique Visitors, Sessions,
    //    Returning Visitor Rate, Pages per Session).
    expect(screen.getByText('Page Views')).toBeInTheDocument();
    expect(screen.getByText('Unique Visitors')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getByText('Returning Visitor Rate')).toBeInTheDocument();
    expect(screen.getByText('Pages per Session')).toBeInTheDocument();

    // 3. TrafficChart — card with "Traffic Over Time" title.
    expect(screen.getByText('Traffic Over Time')).toBeInTheDocument();

    // 4. RealtimeCard — card with "Realtime Visitors" title and the
    //    active-visitor count from the fixture.
    expect(screen.getByText('Realtime Visitors')).toBeInTheDocument();

    // 5. TopPages — card with "Top Pages" title.
    expect(screen.getByText('Top Pages')).toBeInTheDocument();

    // 6. TrafficSources — card with "Traffic Sources" title.
    expect(screen.getByText('Traffic Sources')).toBeInTheDocument();
  });

  // ── Single-column stacking at mobile width ──────────────────────────

  it('uses grid-cols-1 with xl:grid-cols-12 for single-column stacking at mobile width (FR-022)', () => {
    // FR-022: "adapt to small viewports without horizontal scrolling". The
    // template uses `grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12`
    // for the widget rows — `grid-cols-1` is the mobile base (single
    // column), `xl:grid-cols-12` is the xl override (12-col grid). In jsdom
    // there is no layout engine, so the responsive contract is pinned by
    // asserting the class structure: both `grid-cols-1` and
    // `xl:grid-cols-12` are present on the grid containers.
    const { container } = render(<Analytics />);

    const grids = container.querySelectorAll('.grid-cols-1.xl\\:grid-cols-12');
    // The template has two grid rows: TrafficChart + RealtimeCard,
    // TopPages + TrafficSources. Both carry the responsive class pair.
    expect(grids.length).toBeGreaterThanOrEqual(2);
  });
});
