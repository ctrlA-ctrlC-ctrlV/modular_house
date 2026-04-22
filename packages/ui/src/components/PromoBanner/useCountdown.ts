/**
 * useCountdown Hook
 * =============================================================================
 *
 * PURPOSE:
 * React hook that produces a live breakdown (days / hours / minutes / seconds)
 * of the time remaining until a target ISO 8601 instant. Designed for the
 * `PromoBanner` but structured to be reusable for any countdown surface.
 *
 * SSR CONTRACT:
 * During server rendering, and on the very first client render before
 * hydration, the hook returns `null`. Consumers are expected to render a
 * stable placeholder (for example `-- : -- : -- : --`) while the value is
 * `null` so the hydrated DOM matches the server output exactly. Once the
 * first client effect runs, the hook begins returning live values.
 *
 * EXPIRY BEHAVIOUR:
 * Once the current time reaches or passes `endsAt`, the hook returns `null`
 * permanently. Consumers can use this as a signal to un-mount the surface
 * without requiring a deploy.
 *
 * PERFORMANCE:
 * A single `setInterval(..., 1000)` is scheduled per hook instance and is
 * cleared both on unmount and whenever `endsAt` changes. No external
 * dependencies beyond React are used.
 *
 * =============================================================================
 */

import { useEffect, useState } from 'react';

/**
 * Decomposed remaining time returned by the hook while the target instant
 * is still in the future. All fields are non-negative integers.
 */
export interface CountdownParts {
  /** Whole days remaining. */
  readonly days: number;
  /** Whole hours remaining within the current day (0–23). */
  readonly hours: number;
  /** Whole minutes remaining within the current hour (0–59). */
  readonly minutes: number;
  /** Whole seconds remaining within the current minute (0–59). */
  readonly seconds: number;
}

/**
 * Milliseconds in a single second. Extracted as a named constant for clarity
 * in the arithmetic below.
 */
const MS_PER_SECOND = 1000;

/**
 * Derives the `CountdownParts` structure from a raw millisecond delta.
 * Returns `null` when the delta is non-positive so callers can treat that as
 * an expired state uniformly.
 */
const partsFromMs = (deltaMs: number): CountdownParts | null => {
  if (deltaMs <= 0) {
    return null;
  }

  // Integer arithmetic on the floored delta avoids drift across ticks.
  const totalSeconds = Math.floor(deltaMs / MS_PER_SECOND);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
};

/**
 * Returns the live time remaining until `endsAt` as a `CountdownParts`
 * structure, or `null` before hydration and after expiry.
 *
 * @param endsAt ISO 8601 date-time string marking the campaign end instant.
 *               Passing a value that `Date` cannot parse yields `NaN` in the
 *               delta calculation, which is treated as an expired state.
 */
export function useCountdown(endsAt: string): CountdownParts | null {
  // Initial state is deliberately `null` so the server-rendered markup and the
  // first client render both emit the consumer's placeholder, preventing a
  // hydration mismatch.
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    // Parse the target instant once per effect run. `Number.NaN` is compared
    // as non-finite below and causes `parts` to settle at `null`.
    const targetMs = new Date(endsAt).getTime();

    /**
     * Recomputes remaining time from the current wall clock and pushes it
     * into React state. The function is defined inline so it closes over
     * the current `targetMs` for the lifetime of this effect only.
     */
    const tick = (): void => {
      const deltaMs = Number.isFinite(targetMs) ? targetMs - Date.now() : -1;
      setParts(partsFromMs(deltaMs));
    };

    // Seed the first live value synchronously so consumers do not render the
    // placeholder for a full second after mount.
    tick();

    // Schedule subsequent updates on a 1 Hz cadence. A single timer per hook
    // instance is sufficient; only one banner is mounted in v1.
    const intervalId = setInterval(tick, MS_PER_SECOND);

    // Clean up on unmount and when `endsAt` changes to prevent leaks and
    // double-ticking across successive campaigns.
    return () => {
      clearInterval(intervalId);
    };
  }, [endsAt]);

  return parts;
}
