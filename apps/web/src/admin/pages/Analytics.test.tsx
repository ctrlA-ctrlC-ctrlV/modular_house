/**
 * T034/T074 — Analytics page render contract (static Pass 1 + live-data Pass 2).
 *
 * Pins the render contract for the Analytics page that adapts the template
 * `analytics/page.tsx` (ui-components.md §4, plan §4.3 ADD, FR-022/FR-024,
 * US3-13). The `useAnalytics.js` hooks (T073) are mocked at the module
 * boundary for every test in this file (T074): the T034 assertions below are
 * unchanged from Pass 1, but now run against mocked-hook data injected via
 * `beforeEach` (set to the same T008 fixture payloads the page used to import
 * directly, so their expected output does not change) rather than a static
 * import. This proves the page's structural/label contract survives the
 * Pass 2 data-wiring switch without requiring new assertions of its own.
 *
 * Covered contract points (T034 "Do:" clause, in order):
 * - Tab row: Overview is the active tab by default; the five tab triggers
 *   render (Overview, Audience, Acquisition, Engagement, Conversions);
 *   non-Overview tabs render the template's own dashed "coming soon"
 *   placeholder panels when activated (FR-022: follows template; FR-024:
 *   accommodates later tab additions without reworking existing widgets).
 * - All six widget regions present from the (mocked) hook data: RangeToolbar,
 *   KpiStrip, TrafficChart, RealtimeCard, TopPages, TrafficSources — each
 *   renders its card frame / trigger.
 * - Single-column stacking at mobile width: the grid containers carry
 *   `grid-cols-1` (mobile base) and `xl:grid-cols-12` (xl override) so the
 *   widgets stack in a single column below the `xl` breakpoint and spread
 *   across the 12-col grid at `xl`+ (FR-022: "adapt to small viewports
 *   without horizontal scrolling").
 *
 * T074 "live-data path" contract point (T-F7, US3-2..5): a SEPARATE describe
 * block below overrides the mocked hooks with data distinct from the T008
 * fixtures and asserts the distinct values render — proving the widgets are
 * fed by `useOverview`/`useRealtime`, not a static fixtures import. Until
 * `Analytics.tsx` actually calls the hooks (T075), it keeps rendering the
 * fixtures regardless of what the mock returns, so these assertions are red
 * for the right reason.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { Analytics } from './Analytics.js';
import { useOverview, useRealtime } from '../analytics/useAnalytics.js';
import { overviewPopulated, realtimePopulated } from '../analytics/fixtures.js';
import type { OverviewResponse, RealtimeResponse } from '../analytics/fixtures.js';

// Mocked at the module boundary (T072's own convention) — these tests pin the
// page's data-consumption contract, not the hooks' own fetch/poll behavior
// (covered by useAnalytics.test.tsx).
vi.mock('../analytics/useAnalytics.js', () => ({
  useOverview: vi.fn(),
  useRealtime: vi.fn(),
}));

const mockUseOverview = vi.mocked(useOverview);
const mockUseRealtime = vi.mocked(useRealtime);

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

  beforeEach(() => {
    // Default mocked-hook data: the same T008 fixture payloads the page used
    // to import directly (Pass 1), so every unmodified T034 assertion below
    // still passes once the page reads from the hooks instead (T075).
    mockUseOverview.mockReturnValue({ data: overviewPopulated, loading: false, error: null });
    mockUseRealtime.mockReturnValue({ data: realtimePopulated, loading: false, error: null });
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

  // ── Page-level padding (T036d) ───────────────────────────────────────
  // The template's page padding comes from the Next.js dashboard layout
  // wrapping `{children}` (`p-4 md:p-6`) — this port has no equivalent
  // layout (AppShell's `<main>` is Phase 1, frozen, and intentionally
  // unpadded so full-bleed pages stay possible). Each admin page therefore
  // self-supplies its own padding (see Settings.tsx's `p-6`); Analytics.tsx
  // must do the same or its widgets sit flush against the sidebar/top bar.

  it('carries its own p-4 md:p-6 page padding (T036d)', () => {
    const { container } = render(<Analytics />);
    expect(container.firstElementChild).toHaveClass('p-4', 'md:p-6');
  });
});

// ── Live-data path (T074, T-F7, US3-2..5) ──────────────────────────────────
//
// Overrides the mocked hooks with data distinct from every T008 fixture value
// and asserts the distinct values render. Structural assertions (tab count,
// grid classes, padding) are already covered by the T034 suite above and are
// not repeated here.

describe('Analytics page — live-data path (T074, T-F7)', () => {
  it('renders KPI deltas, chart, realtime card, top pages, and sources from the useAnalytics hooks', () => {
    const liveOverview: OverviewResponse = {
      range: { from: '2026-01-01', to: '2026-01-31', bucket: 'day' },
      kpis: {
        // Distinct from the fixture's 4,820 / 22.0% (KpiStrip proof).
        pageViews: { current: 9999, previous: 8000, deltaPercent: 12.3 },
        uniqueVisitors: overviewPopulated.kpis.uniqueVisitors,
        sessions: overviewPopulated.kpis.sessions,
        returningVisitorRate: overviewPopulated.kpis.returningVisitorRate,
        pagesPerSession: overviewPopulated.kpis.pagesPerSession,
      },
      // An empty timeseries (vs. the fixture's 7 populated buckets) trips
      // TrafficChart's own independent empty-state panel (US3-9) — the KPIs
      // above stay non-zero, so this is unambiguously the chart's signal,
      // not KpiStrip's (isEmptyRange checks kpis only).
      timeseries: [],
      topPages: [{ path: '/t074-live-data-marker', views: 555, share: 1 }],
      sources: overviewPopulated.sources.map((entry) =>
        entry.group === 'direct' ? { ...entry, sessions: 4242 } : entry,
      ),
    };
    const liveRealtime: RealtimeResponse = {
      // Distinct from the fixture's 7 active visitors.
      activeVisitors: 42,
      topActivePages: realtimePopulated.topActivePages,
      windowMinutes: 5,
    };

    mockUseOverview.mockReturnValue({ data: liveOverview, loading: false, error: null });
    mockUseRealtime.mockReturnValue({ data: liveRealtime, loading: false, error: null });

    render(<Analytics />);

    // KpiStrip — the mocked pageViews current + delta, not the fixture's.
    expect(screen.getByText('9,999')).toBeInTheDocument();
    expect(screen.getByText('12.3%')).toBeInTheDocument();

    // TrafficChart — the mocked empty timeseries triggers its own
    // independent empty-state panel, proving it reads the hook's timeseries,
    // not the fixture's 7 populated buckets.
    expect(screen.getByText('No analytics data for this range.')).toBeInTheDocument();

    // RealtimeCard — the mocked active-visitor count, not the fixture's 7.
    expect(screen.getByText('42')).toBeInTheDocument();

    // TopPages — the mocked distinctive page path, absent from every fixture.
    expect(screen.getByText('/t074-live-data-marker')).toBeInTheDocument();

    // TrafficSources — the mocked distinctive session count, not the
    // fixture's 630.
    expect(screen.getByText('4242')).toBeInTheDocument();
  });
});
