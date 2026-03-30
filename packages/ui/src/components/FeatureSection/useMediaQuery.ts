/**
 * useMediaQuery Hook
 * =============================================================================
 *
 * PURPOSE:
 * A lightweight hook that evaluates a CSS media query string and returns a
 * boolean indicating whether the query currently matches. Listens for viewport
 * changes via the standard `matchMedia` API and re-renders the consuming
 * component only when the match state changes.
 *
 * ARCHITECTURE:
 * - Uses `window.matchMedia` for native CSS media query evaluation.
 * - Subscribes to the `change` event on the MediaQueryList object for
 *   efficient, debounce-free updates (handled natively by the browser).
 * - Returns `false` during SSR or when `window` is unavailable (safe for
 *   server-side rendering and static site generation pipelines).
 *
 * USAGE:
 * ```ts
 * const isMobile = useMediaQuery('(max-width: 649px)');
 * ```
 *
 * =============================================================================
 */

import { useState, useEffect } from 'react';


/**
 * Evaluates a CSS media query and returns whether it currently matches.
 *
 * @param query - A valid CSS media query string (e.g., "(max-width: 649px)")
 * @returns `true` when the viewport satisfies the query, `false` otherwise
 */
export function useMediaQuery(query: string): boolean {
  /**
   * Initialise state with the current match result.
   * Uses a lazy initialiser to avoid calling matchMedia on every render.
   * Falls back to `false` when window is not available (SSR safety).
   */
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    /** Create the MediaQueryList object for the provided query string. */
    const mediaQueryList: MediaQueryList = window.matchMedia(query);

    /**
     * Update state when the media query match status changes.
     * The browser fires this event only on actual transitions,
     * making it more efficient than polling or resize listeners.
     */
    const handleChange = (event: MediaQueryListEvent): void => {
      setMatches(event.matches);
    };

    /** Sync state in case it drifted between render and effect execution. */
    setMatches(mediaQueryList.matches);

    /** Subscribe to match-state transitions. */
    mediaQueryList.addEventListener('change', handleChange);

    /** Unsubscribe on unmount or when the query string changes. */
    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}
