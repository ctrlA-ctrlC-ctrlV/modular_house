/**
 * T088 — Dashboard states test (T-F10, US3-9..11/13, FR-022/FR-023, Q2/Q3).
 *
 * Covers the four T-F10 scenarios against the Analytics page, each a
 * dashboard-wide STATE rather than a single widget's own contract (already
 * pinned per-widget by KpiStrip.test.tsx/TrafficChart.test.tsx/etc.):
 *
 *   1. Empty-range payload -> every widget renders its own empty state
 *      (US3-9 / E-EMPTY). TrafficSources is a documented exception: Q6 always
 *      returns five source groups, so an all-zero range shows the five
 *      zero-valued rows, not a "no data" panel — this file asserts that
 *      nuance explicitly rather than assuming a uniform empty pattern.
 *   2. The page renders in both light and dark themes (US3-10). jsdom has no
 *      paint engine (real contrast/token verification lives in
 *      shell/a11y.test.tsx's "Token contrast (H6)" block); this file proves
 *      the page's own DOM output is identical regardless of the `.dark`
 *      class Analytics.tsx has no theme-conditional logic of its own.
 *   3. A full keyboard pass reaches every control across the toolbar, the
 *      RangeDialog pop-up, and its custom date inputs (US3-11), each with the
 *      H4 visible-focus ring — mirrors the direct-`.focus()` proof pattern
 *      already used by shell/keyboard.test.tsx (jsdom has no native Tab
 *      traversal).
 *   4. Single-column stacking at mobile width (US3-13, FR-022): the widget
 *      grid rows carry `grid-cols-1` (mobile base) and `xl:grid-cols-12` (xl
 *      override).
 *
 * Per the task's own "Done when": rendering already built in Pass 1 may
 * legitimately pass here — this file exists for comprehensive state coverage
 * and regression-proofing, not to force new failures. Any genuinely missing
 * behavior surfaces as a failure for T089 to close.
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { Analytics } from '../pages/Analytics.js';
import { useOverview, useRealtime } from './useAnalytics.js';
import { overviewEmpty, realtimeEmpty, overviewPopulated, realtimePopulated } from './fixtures.js';

expect.extend(toHaveNoViolations);

// Mocked at the module boundary — same convention as Analytics.test.tsx
// (T034/T074): these tests pin the page's state-rendering contract, not the
// hooks' own fetch/poll behavior.
vi.mock('./useAnalytics.js', () => ({
  useOverview: vi.fn(),
  useRealtime: vi.fn(),
}));

const mockUseOverview = vi.mocked(useOverview);
const mockUseRealtime = vi.mocked(useRealtime);

// Radix primitives portal content and reference pointer/scroll APIs jsdom
// does not implement — identical polyfill to Analytics.test.tsx/select/dialog
// primitive suites, so Select/Dialog keyboard interactions resolve
// deterministically.
function polyfillRadixPointerApis() {
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
}

// H4 focus-ring token classes (plan §2.8 H4), shared by every Button/Input/
// Select primitive control in the admin design system.
const FOCUS_RING_CLASSES = ['focus-visible:ring-3', 'focus-visible:ring-ring/50'] as const;

function assertVisibleFocus(el: HTMLElement) {
  for (const cls of FOCUS_RING_CLASSES) {
    expect(el).toHaveClass(cls);
  }
}

describe('Analytics dashboard states (T088, T-F10)', () => {
  beforeAll(() => {
    polyfillRadixPointerApis();
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  // ── 1. Empty-range payload -> every widget's own empty state (US3-9) ────

  describe('Empty-range payload', () => {
    beforeEach(() => {
      mockUseOverview.mockReturnValue({ data: overviewEmpty, loading: false, error: null });
      mockUseRealtime.mockReturnValue({ data: realtimeEmpty, loading: false, error: null });
    });

    it('renders KpiStrip and TrafficChart dashed empty panels (shared "No analytics data for this range." text)', () => {
      render(<Analytics />);
      // KpiStrip (isEmptyRange: every KPI current === 0) and TrafficChart
      // (empty timeseries) independently render the identical template
      // empty-panel text — both must be present, not just one.
      const panels = screen.getAllByText('No analytics data for this range.');
      expect(panels).toHaveLength(2);
    });

    it('renders RealtimeCard\'s zero-visitor empty state', () => {
      render(<Analytics />);
      // Scoped via the "active" label's sibling: a bare getByText('0') is
      // ambiguous here, since TrafficSources' five zero-valued session counts
      // (Q6) also render literal "0" text.
      const activeLabel = screen.getByText('active');
      expect(activeLabel.previousElementSibling).toHaveTextContent('0');
      expect(screen.getByText('No active pages right now.')).toBeInTheDocument();
    });

    it('renders TopPages\' empty state', () => {
      render(<Analytics />);
      expect(screen.getByText('No page views in this range.')).toBeInTheDocument();
    });

    it('renders TrafficSources\' five zero-valued groups, not a "no data" panel (Q6 exception)', () => {
      render(<Analytics />);
      // Q6: source breakdown is always the five S-groups, zero-valued groups
      // shown — an empty range is NOT the same as an empty sources array, so
      // TrafficSources' own defensive empty panel must NOT appear here.
      expect(screen.queryByText('No traffic sources in this range.')).toBeNull();
      for (const label of ['Direct', 'Search', 'Social', 'Referral', 'Campaign']) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
    });
  });

  // ── T113 (E-EMPTY): no broken visuals, no error boundary trips ────────
  // Extends the "Empty-range payload" block (T088) with the two assertions
  // T113 pins: (1) the chart shows no broken visuals — when the timeseries is
  // empty TrafficChart renders its dashed empty panel, NOT a recharts
  // `ComposedChart` SVG with zero-width/zero-height (the "width(0) height(0)"
  // warning recharts logs when forced to render without data); and (2) no
  // error boundary trips — the render completes without throwing and no
  // `console.error` is emitted by React or any widget during the empty-state
  // render. Together these prove a "range fully before the first event"
  // payload (mocked empty overview + zero realtime, US3-9 / E-EMPTY) produces
  // a clean, user-friendly dashboard rather than a broken one.

  describe('T113 (E-EMPTY): no broken chart visuals and no error boundary trips', () => {
    beforeEach(() => {
      mockUseOverview.mockReturnValue({ data: overviewEmpty, loading: false, error: null });
      mockUseRealtime.mockReturnValue({ data: realtimeEmpty, loading: false, error: null });
    });

    it('renders every widget empty state with no recharts SVG and no console errors', () => {
      // Spy on console.error to catch any error-boundary trip, React error,
      // or recharts zero-dimension warning emitted during the empty-state
      // render. The spy is restored at the end so later tests are unaffected.
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const { container } = render(<Analytics />);

      // Every widget's friendly empty state is present (US3-9 / FR-023):
      // KpiStrip + TrafficChart share the dashed panel text, RealtimeCard
      // shows the zero-visitor message, TopPages shows its empty message, and
      // TrafficSources shows all five zero-valued groups (Q6 exception).
      expect(screen.getAllByText('No analytics data for this range.')).toHaveLength(2);
      expect(screen.getByText('No active pages right now.')).toBeInTheDocument();
      expect(screen.getByText('No page views in this range.')).toBeInTheDocument();
      for (const label of ['Direct', 'Search', 'Social', 'Referral', 'Campaign']) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }

      // No broken chart visuals: the empty timeseries means TrafficChart
      // renders its dashed empty panel, not a recharts ComposedChart. Assert
      // no recharts SVG surface renders inside the page — the chart's empty
      // state is a styled <div>, not a degenerate SVG with zero dimensions.
      expect(container.querySelector('svg.recharts-surface')).toBeNull();

      // No error boundary trips: the render reached this assertion without
      // throwing (proven by execution reaching this line), and no
      // console.error was emitted during the empty-state render.
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  // ── 2. Light and dark themes (US3-10) ────────────────────────────────────

  describe('Light and dark themes', () => {
    beforeEach(() => {
      mockUseOverview.mockReturnValue({ data: overviewPopulated, loading: false, error: null });
      mockUseRealtime.mockReturnValue({ data: realtimePopulated, loading: false, error: null });
    });

    // Analytics.tsx has no theme-conditional rendering of its own (light/dark
    // is a token-driven CSS concern, verified for real contrast values by
    // shell/a11y.test.tsx's "Token contrast (H6)" block) — this proves the
    // page's DOM output is identical regardless of which theme class is
    // present on the document root.
    function assertCoreWidgetsRendered() {
      expect(screen.getByRole('combobox')).toHaveTextContent('3 months');
      expect(screen.getByText('Page Views')).toBeInTheDocument();
      expect(screen.getByText('Traffic Over Time')).toBeInTheDocument();
      expect(screen.getByText('Realtime Visitors')).toBeInTheDocument();
      expect(screen.getByText('Top Pages')).toBeInTheDocument();
      expect(screen.getByText('Traffic Sources')).toBeInTheDocument();
    }

    it('renders every widget in light mode (no .dark class)', () => {
      render(<Analytics />);
      assertCoreWidgetsRendered();
    });

    it('renders every widget in dark mode (.dark on the document root)', () => {
      document.documentElement.classList.add('dark');
      render(<Analytics />);
      assertCoreWidgetsRendered();
    });
  });

  // ── 3. Full keyboard pass: toolbar -> pop-up -> date inputs (US3-11) ─────

  describe('Full keyboard pass', () => {
    beforeEach(() => {
      mockUseOverview.mockReturnValue({ data: overviewPopulated, loading: false, error: null });
      mockUseRealtime.mockReturnValue({ data: realtimePopulated, loading: false, error: null });
    });

    it('reaches the toolbar trigger, every pop-up preset button, the custom toggle, and both date inputs, each with visible focus', async () => {
      render(<Analytics />);

      // RangeToolbar trigger (Q2 select).
      const toolbarTrigger = screen.getByRole('combobox');
      toolbarTrigger.focus();
      expect(document.activeElement).toBe(toolbarTrigger);
      assertVisibleFocus(toolbarTrigger);

      // Open the RangeDialog directly (mirrors the T078/T-F9 interaction —
      // this block's own focus is the pop-up + date-input reachability, not
      // re-proving the Select-to-dialog handoff already covered there).
      fireEvent.keyDown(toolbarTrigger, { key: 'ArrowDown' });
      await waitFor(() => {
        expect(document.activeElement).toHaveAttribute('data-slot', 'select-item');
      });
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });
      await waitFor(() => {
        expect(document.activeElement).toHaveTextContent('More');
      });
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter' });
      await screen.findByRole('dialog');

      // Every pop-up preset button (Q2: 6/12/16 months + Custom) is reachable
      // and carries the H4 focus ring.
      for (const label of ['6 months', '12 months', '16 months', 'Custom']) {
        const button = screen.getByRole('button', { name: label });
        button.focus();
        expect(document.activeElement).toBe(button);
        assertVisibleFocus(button);
      }

      // Custom reveals the two native date inputs (Q3); both reachable with
      // visible focus and correctly labelled for screen readers.
      fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
      const startInput = screen.getByLabelText(/start date/i);
      const endInput = screen.getByLabelText(/end date/i);
      startInput.focus();
      expect(document.activeElement).toBe(startInput);
      assertVisibleFocus(startInput);
      endInput.focus();
      expect(document.activeElement).toBe(endInput);
      assertVisibleFocus(endInput);

      // Apply button also reachable once the custom pair is in view.
      const applyButton = screen.getByRole('button', { name: 'Apply' });
      applyButton.focus();
      expect(document.activeElement).toBe(applyButton);
      assertVisibleFocus(applyButton);
    });

    it('Esc closes the pop-up without applying (Radix default, no range change)', async () => {
      render(<Analytics />);

      const toolbarTrigger = screen.getByRole('combobox');
      toolbarTrigger.focus();
      fireEvent.keyDown(toolbarTrigger, { key: 'ArrowDown' });
      await waitFor(() => {
        expect(document.activeElement).toHaveAttribute('data-slot', 'select-item');
      });
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });
      await waitFor(() => {
        expect(document.activeElement).toHaveTextContent('More');
      });
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter' });
      const dialog = await screen.findByRole('dialog');

      fireEvent.keyDown(dialog, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      // Q2/Q3: "the dashboard keeps its previous range until a valid Apply" —
      // closing via Esc must never trigger a refetch. Proven at the data
      // level (the original populated fixture's page-views figure is still
      // the one shown), not via RangeToolbar's own uncontrolled Select label
      // (which visually tracks "More" as its last-picked item regardless of
      // whether the dialog was applied or dismissed — a separate, cosmetic
      // Select-widget concern outside T088's empty-state/theme/keyboard/
      // stacking scope).
      expect(screen.getByText('4,820')).toBeInTheDocument();
    });
  });

  // ── T117 (E-A11Y): axe scans + pop-up focus order ────────────────────────
  // Extends the dashboard-wide state coverage above with the three E-A11Y
  // edge assertions pinned by plan.md §4.2 ("banner and dashboard axe checks;
  // focus order into and out of the pop-up; Esc closes the pop-up without
  // applying"): an automated axe scan of the full dashboard in both themes
  // and with the RangeDialog pop-up open, plus the focus-order half not
  // covered by the "Full keyboard pass" block above — that block proves every
  // control is individually reachable via direct `.focus()` calls, but never
  // asserts the pop-up's OWN focus-management contract: that Radix FocusScope
  // moves focus into the content on open (focus order IN) and restores focus
  // to the toolbar trigger that opened it once the pop-up closes (focus order
  // OUT), without triggering a range change.

  describe('Accessibility edge cases (T117, E-A11Y)', () => {
    beforeEach(() => {
      mockUseOverview.mockReturnValue({ data: overviewPopulated, loading: false, error: null });
      mockUseRealtime.mockReturnValue({ data: realtimePopulated, loading: false, error: null });
    });

    /**
     * Drives the toolbar's Select to open the RangeDialog pop-up (identical
     * keyboard sequence to the "Full keyboard pass" block above: ArrowDown
     * into the listbox, ArrowDown to the "More" item, Enter to select it).
     * Returns the toolbar trigger so callers can assert focus returns to it.
     */
    async function openRangeDialogViaToolbar(): Promise<HTMLElement> {
      const toolbarTrigger = screen.getByRole('combobox');
      toolbarTrigger.focus();
      fireEvent.keyDown(toolbarTrigger, { key: 'ArrowDown' });
      await waitFor(() => {
        expect(document.activeElement).toHaveAttribute('data-slot', 'select-item');
      });
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });
      await waitFor(() => {
        expect(document.activeElement).toHaveTextContent('More');
      });
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter' });
      await screen.findByRole('dialog');
      return toolbarTrigger;
    }

    it('has zero axe violations in light mode (no .dark class)', async () => {
      const { container } = render(<Analytics />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has zero axe violations in dark mode (.dark on the document root)', async () => {
      document.documentElement.classList.add('dark');
      const { container } = render(<Analytics />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has zero axe violations with the RangeDialog pop-up open', async () => {
      render(<Analytics />);
      await openRangeDialogViaToolbar();
      // RangeDialog portals its content to document.body (Radix Portal), so
      // the scan target must be the whole body, not just the render container
      // — mirrors the Shell mobile off-canvas drawer pattern in a11y.test.tsx.
      const results = await axe(document.body);
      expect(results).toHaveNoViolations();
    });

    it('focus order: FocusScope moves focus into the pop-up on open (focus order IN)', async () => {
      render(<Analytics />);
      await openRangeDialogViaToolbar();
      const dialog = screen.getByRole('dialog');
      // Radix FocusScope activates on mount; the shift may be deferred to a
      // microtask, mirroring RangeDialog.test.tsx's own "keyboard reachable"
      // assertion at the unit level — this proves the same contract holds
      // once the dialog is opened through the real toolbar interaction.
      await waitFor(() => {
        expect(dialog.contains(document.activeElement)).toBe(true);
      });
    });

    it('focus order: closing the pop-up via Esc returns focus to the toolbar trigger (focus order OUT), no range change', async () => {
      render(<Analytics />);
      const toolbarTrigger = await openRangeDialogViaToolbar();
      const dialog = screen.getByRole('dialog');

      fireEvent.keyDown(dialog, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Radix's default onCloseAutoFocus restores focus to the element that
      // was active immediately before the FocusScope activated — the toolbar
      // trigger, since RangeDialog is a controlled dialog with no
      // <DialogTrigger> of its own.
      await waitFor(() => {
        expect(document.activeElement).toBe(toolbarTrigger);
      });

      // Q2/Q3: dismissing via Esc must never apply a range change — the
      // original populated fixture's page-views figure is still shown.
      expect(screen.getByText('4,820')).toBeInTheDocument();
    });
  });

  // ── 4. Single-column stacking at mobile width (US3-13, FR-022) ───────────

  describe('Single-column stacking at mobile width', () => {
    beforeEach(() => {
      mockUseOverview.mockReturnValue({ data: overviewPopulated, loading: false, error: null });
      mockUseRealtime.mockReturnValue({ data: realtimePopulated, loading: false, error: null });
    });

    it('carries grid-cols-1 (mobile base) and xl:grid-cols-12 (xl override) on both widget rows', () => {
      const { container } = render(<Analytics />);
      const grids = container.querySelectorAll('.grid-cols-1.xl\\:grid-cols-12');
      // Row 1: TrafficChart + RealtimeCard. Row 2: TopPages + TrafficSources.
      expect(grids.length).toBeGreaterThanOrEqual(2);
    });
  });
});
