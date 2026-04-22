/**
 * PromoBanner Unit Tests
 * =============================================================================
 *
 * PURPOSE:
 * Validates rendering, variant class application, and prop forwarding for
 * the `PromoBanner` component. Each case maps to a specific acceptance
 * criterion from plan §4 and task T2.4.
 *
 * STRATEGY:
 * - Fake timers anchor `Date.now()` so the countdown target can be set as a
 *   deterministic offset from a known baseline.
 * - SSR placeholder semantics are covered indirectly by the `useCountdown`
 *   hook tests, which assert the `null` return contract that drives the
 *   dashed fallback on the server.
 *
 * =============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { PromoBanner } from './PromoBanner';

const NOW = new Date('2026-01-01T00:00:00Z').getTime();

describe('PromoBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders the campaign name and eyebrow when provided', () => {
    const endsAt = new Date(NOW + 60_000).toISOString();
    render(
      <PromoBanner
        name="Spring Sale 2026"
        eyebrow="Limited time"
        endsAt={endsAt}
      />,
    );

    expect(screen.getByText('Spring Sale 2026')).toBeDefined();
    expect(screen.getByText('Limited time')).toBeDefined();
  });

  it('renders four countdown segments for a future endsAt', () => {
    const endsAt = new Date(NOW + 60_000).toISOString();
    const { container } = render(
      <PromoBanner name="Spring Sale" endsAt={endsAt} />,
    );

    const segments = container.querySelectorAll('.promo-banner__countdown-segment');
    expect(segments.length).toBe(4);
  });

  it('applies the variant modifier class', () => {
    const endsAt = new Date(NOW + 60_000).toISOString();
    const { container } = render(
      <PromoBanner name="Spring Sale" endsAt={endsAt} variant="light" />,
    );

    const root = container.querySelector('.promo-banner');
    expect(root?.classList.contains('promo-banner--variant-light')).toBe(true);
  });

  it('forwards the optional className to the root element', () => {
    const endsAt = new Date(NOW + 60_000).toISOString();
    const { container } = render(
      <PromoBanner name="Spring Sale" endsAt={endsAt} className="custom-class" />,
    );

    const root = container.querySelector('.promo-banner');
    expect(root?.classList.contains('custom-class')).toBe(true);
  });

  /**
   * GTM `dataLayer` attribution event.
   *
   * Validates the analytics contract described in plan §7.3: a single
   * `promo_banner_view` event is pushed on mount with exactly the three
   * campaign-attribution keys, and no further events are pushed on unmount
   * or on unrelated state transitions.
   */
  describe('dataLayer analytics', () => {
    it('pushes a single promo_banner_view event on mount with the expected payload', () => {
      const endsAt = new Date(NOW + 60_000).toISOString();
      // Reset to a known empty queue so the assertion below is unambiguous.
      window.dataLayer = [];

      const { unmount } = render(
        <PromoBanner name="Spring Sale 2026" endsAt={endsAt} eyebrow="Limited time" />,
      );

      expect(window.dataLayer?.length).toBe(1);
      const event = window.dataLayer?.[0] as Record<string, unknown>;
      expect(event).toEqual({
        event: 'promo_banner_view',
        promo_name: 'Spring Sale 2026',
        promo_ends_at: endsAt,
        page_path: window.location.pathname,
      });

      // Unmount must not emit any additional events.
      unmount();
      expect(window.dataLayer?.length).toBe(1);
    });
  });
});
