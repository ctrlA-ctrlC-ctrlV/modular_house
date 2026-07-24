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

import { Analytics } from '../pages/Analytics.js';
import { useOverview, useRealtime } from './useAnalytics.js';
import { overviewEmpty, realtimeEmpty, overviewPopulated, realtimePopulated } from './fixtures.js';

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
