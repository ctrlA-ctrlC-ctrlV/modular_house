/**
 * useCountdown Unit Tests
 * =============================================================================
 *
 * PURPOSE:
 * Validates the timing behaviour of the `useCountdown` hook using Vitest's
 * fake timers. The tests cover the three observable states: pre-tick live
 * value, periodic tick updates, and zero-crossing expiry. A final case
 * asserts that the interval is cleared on unmount so no background work
 * leaks between tests.
 *
 * ENVIRONMENT:
 * React Testing Library with `@testing-library/react`'s `renderHook` API
 * inside the shared Vitest + Playwright browser context.
 *
 * =============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCountdown } from './useCountdown';

/**
 * Fixed reference instant used as the simulated "now" across test cases.
 * Using a static baseline eliminates time-dependent flakiness.
 */
const NOW = new Date('2026-01-01T00:00:00Z').getTime();

describe('useCountdown', () => {
  beforeEach(() => {
    // Install fake timers anchored to the fixed baseline so `Date.now()` and
    // `setInterval` are both controllable from the test.
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    // Restore real timers so adjacent test files are not affected.
    vi.useRealTimers();
  });

  it('returns a populated breakdown immediately after mount when the target is in the future', () => {
    // Target is exactly 1 day, 2 hours, 3 minutes, 4 seconds ahead.
    const deltaMs = (((1 * 24 + 2) * 60 + 3) * 60 + 4) * 1000;
    const endsAt = new Date(NOW + deltaMs).toISOString();

    const { result } = renderHook(() => useCountdown(endsAt));

    expect(result.current).toEqual({ days: 1, hours: 2, minutes: 3, seconds: 4 });
  });

  it('updates the remaining time on each interval tick', () => {
    const endsAt = new Date(NOW + 10_000).toISOString();
    const { result } = renderHook(() => useCountdown(endsAt));

    // Initial (seeded) state: 10 seconds remaining.
    expect(result.current?.seconds).toBe(10);

    // Advance the simulated wall clock by three seconds and let the
    // interval fire. `act` flushes the resulting state updates.
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current?.seconds).toBe(7);
  });

  it('returns null once the target instant has been reached', () => {
    const endsAt = new Date(NOW + 2000).toISOString();
    const { result } = renderHook(() => useCountdown(endsAt));

    expect(result.current).not.toBeNull();

    // Cross the zero boundary.
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current).toBeNull();
  });

  it('returns null when the target instant is already in the past at mount', () => {
    const endsAt = new Date(NOW - 1000).toISOString();
    const { result } = renderHook(() => useCountdown(endsAt));
    expect(result.current).toBeNull();
  });

  it('clears its interval on unmount', () => {
    const endsAt = new Date(NOW + 60_000).toISOString();
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');

    const { unmount } = renderHook(() => useCountdown(endsAt));
    unmount();

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
