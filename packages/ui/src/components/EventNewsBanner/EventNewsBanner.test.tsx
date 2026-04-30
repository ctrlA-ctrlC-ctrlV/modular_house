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

    it('renders the background image inside a <picture> fallback <img>', () => {
      const { container } = render(
        <EventNewsBanner {...BASE_PROPS} endsAt={endsAt} />,
      );

      // The background picture wrapper must exist and contain the fallback
      // <img> whose src matches the consumer-supplied backgroundSrc. The
      // <picture> element itself carries `aria-hidden="true"` because the
      // image is decorative.
      const picture = container.querySelector(
        '.event-news-banner__background',
      );
      expect(picture).not.toBeNull();
      expect(picture?.getAttribute('aria-hidden')).toBe('true');

      const bgImage = container.querySelector<HTMLImageElement>(
        '.event-news-banner__background-image',
      );
      expect(bgImage).not.toBeNull();
      expect(bgImage?.src).toContain(BASE_PROPS.backgroundSrc);
      // Above-the-fold asset: must be eagerly fetched for LCP.
      expect(bgImage?.getAttribute('loading')).toBe('eager');
    });

    it('does not render AVIF or WebP <source> elements when variants are omitted', () => {
      const { container } = render(
        <EventNewsBanner {...BASE_PROPS} endsAt={endsAt} />,
      );

      // When the consumer does not supply modern-format variants the
      // component must degrade gracefully to a single <img> inside each
      // <picture> with no redundant <source> elements.
      const sources = container.querySelectorAll('source');
      expect(sources.length).toBe(0);
    });

    it('emits AVIF and WebP <source> elements when variants are supplied', () => {
      const { container } = render(
        <EventNewsBanner
          {...BASE_PROPS}
          endsAt={endsAt}
          logoSrcWebP="/test/logo.webp"
          logoSrcAvif="/test/logo.avif"
          backgroundSrcWebP="/test/background.webp"
          backgroundSrcAvif="/test/background.avif"
        />,
      );

      // Background picture: AVIF source precedes WebP source in document
      // order so browsers evaluate the most efficient candidate first.
      const backgroundSources = container.querySelectorAll<HTMLSourceElement>(
        '.event-news-banner__background source',
      );
      expect(backgroundSources.length).toBe(2);
      expect(backgroundSources[0].getAttribute('type')).toBe('image/avif');
      expect(backgroundSources[0].getAttribute('srcset')).toContain(
        '/test/background.avif',
      );
      expect(backgroundSources[1].getAttribute('type')).toBe('image/webp');
      expect(backgroundSources[1].getAttribute('srcset')).toContain(
        '/test/background.webp',
      );

      // Logo picture: same ordering contract.
      const logoSources = container.querySelectorAll<HTMLSourceElement>(
        '.event-news-banner__logo-picture source',
      );
      expect(logoSources.length).toBe(2);
      expect(logoSources[0].getAttribute('type')).toBe('image/avif');
      expect(logoSources[0].getAttribute('srcset')).toContain(
        '/test/logo.avif',
      );
      expect(logoSources[1].getAttribute('type')).toBe('image/webp');
      expect(logoSources[1].getAttribute('srcset')).toContain(
        '/test/logo.webp',
      );
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


  /* -------------------------------------------------------------------------
     GROUP: Activation behaviour (startsAt)
     -------------------------------------------------------------------------
     Verifies that the optional `startsAt` lower bound suppresses the banner
     until the activation instant is reached, that long horizons exceeding
     the platform `setTimeout` 32-bit cap are honoured via timer re-arming,
     and that the activation timer is cleaned up on unmount.
     -------------------------------------------------------------------------- */

  describe('activation behaviour (startsAt)', () => {
    it('renders nothing when startsAt is in the future', () => {
      // Activation 10 seconds away; expiry comfortably beyond.
      const startsAt = new Date(BASELINE_NOW + 10_000).toISOString();
      const endsAt   = new Date(BASELINE_NOW + 60_000).toISOString();

      const { container } = render(
        <EventNewsBanner
          {...BASE_PROPS}
          startsAt={startsAt}
          endsAt={endsAt}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('reveals the banner once startsAt is reached during a live session', () => {
      const startsAt = new Date(BASELINE_NOW + 5_000).toISOString();
      const endsAt   = new Date(BASELINE_NOW + 60_000).toISOString();

      const { container } = render(
        <EventNewsBanner
          {...BASE_PROPS}
          startsAt={startsAt}
          endsAt={endsAt}
        />,
      );

      // Pre-activation: nothing rendered.
      expect(container.firstChild).toBeNull();

      // Advance time past the activation instant; the activation timer
      // fires and visibility flips on. `vi.advanceTimersByTime` is used in
      // place of `runAllTimers` so the expiry timer is left pending.
      act(() => {
        vi.advanceTimersByTime(5_001);
      });

      expect(container.querySelector('.event-news-banner')).not.toBeNull();
    });

    it('renders immediately when startsAt is in the past and endsAt is in the future', () => {
      // The activation bound is omitted from the timer chain entirely
      // because it has already elapsed; only the expiry timer is armed.
      const startsAt = new Date(BASELINE_NOW - 60_000).toISOString();
      const endsAt   = new Date(BASELINE_NOW + 60_000).toISOString();

      const { container } = render(
        <EventNewsBanner
          {...BASE_PROPS}
          startsAt={startsAt}
          endsAt={endsAt}
        />,
      );

      expect(container.querySelector('.event-news-banner')).not.toBeNull();
    });

    it('honours startsAt deadlines beyond the 32-bit setTimeout cap', () => {
      // Activation in 60 days; expiry in 120 days. Both exceed the
      // platform `setTimeout` ceiling of ~24.8 days, exercising the
      // chained re-arm logic inside the internal scheduler.
      const sixtyDaysMs    = 60 * 24 * 60 * 60 * 1_000;
      const onehundredDays = 120 * 24 * 60 * 60 * 1_000;
      const startsAt       = new Date(BASELINE_NOW + sixtyDaysMs).toISOString();
      const endsAt         = new Date(BASELINE_NOW + onehundredDays).toISOString();

      const { container } = render(
        <EventNewsBanner
          {...BASE_PROPS}
          startsAt={startsAt}
          endsAt={endsAt}
        />,
      );

      // Pre-activation: nothing rendered.
      expect(container.firstChild).toBeNull();

      // Advance past the activation instant. `runAllTimers` would also
      // fire the expiry timer; `advanceTimersByTime` walks the clock so
      // the chained re-arms unfold deterministically and only the
      // activation boundary is crossed.
      act(() => {
        vi.advanceTimersByTime(sixtyDaysMs + 1_000);
      });

      expect(container.querySelector('.event-news-banner')).not.toBeNull();
    });

    it('cancels the activation timer when the component unmounts before activation', () => {
      const startsAt = new Date(BASELINE_NOW + 60_000).toISOString();
      const endsAt   = new Date(BASELINE_NOW + 120_000).toISOString();

      const { unmount, container } = render(
        <EventNewsBanner
          {...BASE_PROPS}
          startsAt={startsAt}
          endsAt={endsAt}
        />,
      );

      expect(container.firstChild).toBeNull();

      unmount();

      // No timer callback should run after unmount; the absence of a
      // thrown "update on unmounted component" warning is the assertion.
      act(() => {
        vi.runAllTimers();
      });
    });
  });
});
