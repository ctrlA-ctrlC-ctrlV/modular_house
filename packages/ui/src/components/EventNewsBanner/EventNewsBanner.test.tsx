/**
 * EventNewsBanner Unit Tests
 * =============================================================================
 *
 * PURPOSE:
 * Validates the rendering behaviour, expiry logic, and accessibility
 * attributes of the `EventNewsBanner` component. Each test group maps to a
 * distinct acceptance criterion so failures can be traced back to a specific
 * requirement.
 *
 * STRATEGY:
 * - Vitest fake timers anchor `Date.now()` to a deterministic baseline so
 *   the expiry logic can be exercised without relying on wall-clock time.
 * - `vi.runAllTimers()` advances the fake clock to trigger scheduled
 *   `setTimeout` callbacks synchronously, enabling expiry scenarios to be
 *   tested in a single tick.
 * - Each `it` block calls `cleanup()` implicitly via `afterEach` to reset
 *   the DOM between tests; explicit `cleanup()` calls are present only where
 *   an earlier unmount is meaningful to the test scenario.
 *
 * =============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { EventNewsBanner } from './EventNewsBanner';

/* =============================================================================
   SHARED TEST FIXTURES
   ============================================================================= */

/** Fixed baseline instant used to anchor all fake-timer assertions. */
const BASELINE_NOW = new Date('2026-04-20T12:00:00Z').getTime();

/** Canonical props shared across tests. Values avoid any domain-specific path
 *  so the test suite is not coupled to the consuming application's asset
 *  structure. */
const BASE_PROPS = {
  logoSrc:       '/test/logo.png',
  logoAlt:       'Test event logo',
  backgroundSrc: '/test/background.jpg',
} as const;


/* =============================================================================
   SUITE: EventNewsBanner
   ============================================================================= */

describe('EventNewsBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASELINE_NOW);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });


  /* -------------------------------------------------------------------------
     GROUP: Rendering — active state
     -------------------------------------------------------------------------
     Verifies that the banner renders its three visual elements correctly
     when the deadline has not yet been reached.
     -------------------------------------------------------------------------- */

  describe('when endsAt is in the future', () => {
    const endsAt = new Date(BASELINE_NOW + 1_000 * 60 * 60 * 24).toISOString(); // +24 h

    it('renders the root aside element', () => {
      const { container } = render(
        <EventNewsBanner {...BASE_PROPS} endsAt={endsAt} />,
      );

      // The root element is an <aside> with the BEM block class.
      const root = container.querySelector('.event-news-banner');
      expect(root).not.toBeNull();
      expect(root?.tagName.toLowerCase()).toBe('aside');
    });

    it('applies the background image as an inline style on the root element', () => {
      const { container } = render(
        <EventNewsBanner {...BASE_PROPS} endsAt={endsAt} />,
      );

      const root = container.querySelector<HTMLElement>('.event-news-banner');
      // Inline `backgroundImage` must contain the supplied path.
      expect(root?.style.backgroundImage).toContain(BASE_PROPS.backgroundSrc);
    });

    it('renders the partner logo with the supplied src and alt attributes', () => {
      render(<EventNewsBanner {...BASE_PROPS} endsAt={endsAt} />);

      // The logo must be discoverable by its accessible alt text.
      const logo = screen.getByAltText(BASE_PROPS.logoAlt) as HTMLImageElement;
      expect(logo).toBeDefined();
      expect(logo.src).toContain(BASE_PROPS.logoSrc);
    });

    it('renders the default badge label "SEE US @"', () => {
      const { container } = render(
        <EventNewsBanner {...BASE_PROPS} endsAt={endsAt} />,
      );

      const badge = container.querySelector('.event-news-banner__badge');
      expect(badge?.textContent).toBe('SEE US @');
    });

    it('renders a custom badgeLabel when provided', () => {
      const { container } = render(
        <EventNewsBanner {...BASE_PROPS} endsAt={endsAt} badgeLabel="VISIT US @" />,
      );

      const badge = container.querySelector('.event-news-banner__badge');
      expect(badge?.textContent).toBe('VISIT US @');
    });

    it('forwards an optional className to the root element', () => {
      const { container } = render(
        <EventNewsBanner {...BASE_PROPS} endsAt={endsAt} className="page-specific" />,
      );

      const root = container.querySelector('.event-news-banner');
      expect(root?.classList.contains('page-specific')).toBe(true);
    });
  });


  /* -------------------------------------------------------------------------
     GROUP: Accessibility attributes
     -------------------------------------------------------------------------
     Verifies that the ARIA contract is met so assistive technologies can
     navigate and interpret the banner correctly.
     -------------------------------------------------------------------------- */

  describe('accessibility', () => {
    const endsAt = new Date(BASELINE_NOW + 1_000 * 60 * 60).toISOString(); // +1 h

    it('assigns role="region" and an aria-label to the root element', () => {
      render(<EventNewsBanner {...BASE_PROPS} endsAt={endsAt} />);

      const region = screen.getByRole('region', { name: 'Event news banner' });
      expect(region).toBeDefined();
    });

    it('marks the badge element as aria-hidden', () => {
      const { container } = render(
        <EventNewsBanner {...BASE_PROPS} endsAt={endsAt} />,
      );

      const badge = container.querySelector('.event-news-banner__badge');
      expect(badge?.getAttribute('aria-hidden')).toBe('true');
    });

    it('marks the overlay element as aria-hidden', () => {
      const { container } = render(
        <EventNewsBanner {...BASE_PROPS} endsAt={endsAt} />,
      );

      const overlay = container.querySelector('.event-news-banner__overlay');
      expect(overlay?.getAttribute('aria-hidden')).toBe('true');
    });
  });


  /* -------------------------------------------------------------------------
     GROUP: Expiry behaviour
     -------------------------------------------------------------------------
     Verifies that the banner is hidden when the deadline is in the past and
     that it removes itself from the DOM when the timer fires during an active
     session.
     -------------------------------------------------------------------------- */

  describe('expiry behaviour', () => {
    it('renders nothing when endsAt is in the past', () => {
      const pastEndsAt = new Date(BASELINE_NOW - 1_000).toISOString();

      const { container } = render(
        <EventNewsBanner {...BASE_PROPS} endsAt={pastEndsAt} />,
      );

      // The component must return null; no element should be in the container.
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when endsAt equals the current instant', () => {
      // Exactly at the deadline: remaining === 0, treated as expired.
      const exactNow = new Date(BASELINE_NOW).toISOString();

      const { container } = render(
        <EventNewsBanner {...BASE_PROPS} endsAt={exactNow} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('removes the banner from the DOM when the deadline is reached during a live session', () => {
      // Set the deadline 10 seconds into the future.
      const endsAt = new Date(BASELINE_NOW + 10_000).toISOString();

      const { container } = render(
        <EventNewsBanner {...BASE_PROPS} endsAt={endsAt} />,
      );

      // Banner is visible before the timer fires.
      expect(container.querySelector('.event-news-banner')).not.toBeNull();

      // Advance fake timers by the full remaining duration to trigger the
      // scheduled `setTimeout` callback.
      act(() => {
        vi.runAllTimers();
      });

      // After the timer fires the component should have removed itself.
      expect(container.querySelector('.event-news-banner')).toBeNull();
    });

    it('cancels the timer when the component unmounts before the deadline', () => {
      // This test ensures no state update is attempted after unmount, which
      // would produce a React warning. If the timer is not cancelled, the
      // test runner may surface an "update on unmounted component" error.
      const endsAt = new Date(BASELINE_NOW + 60_000).toISOString();

      const { unmount, container } = render(
        <EventNewsBanner {...BASE_PROPS} endsAt={endsAt} />,
      );

      expect(container.querySelector('.event-news-banner')).not.toBeNull();

      // Unmount before the timer fires.
      unmount();

      // Advance timers: the cleanup should have called clearTimeout, so no
      // state update should be attempted and no error should be thrown.
      act(() => {
        vi.runAllTimers();
      });

      // No assertion on the DOM is possible post-unmount; the absence of a
      // thrown error constitutes the implicit assertion.
    });
  });
});
