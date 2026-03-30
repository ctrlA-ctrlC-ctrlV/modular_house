/**
 * useCarousel Hook
 * =============================================================================
 *
 * PURPOSE:
 * A reusable carousel hook that manages auto-cycling slide transitions and
 * user-initiated drag/swipe interactions. When the user physically interacts
 * with the carousel (pointer drag or touch swipe), the auto-cycle timer is
 * permanently stopped for that session to respect user intent.
 *
 * ARCHITECTURE:
 * - Uses standard DOM Pointer Events for cross-device interoperability
 *   (mouse, touch, pen) without requiring separate touch/mouse handlers.
 * - State machine: IDLE -> AUTO_CYCLING -> USER_INTERACTED (terminal).
 * - The hook is viewport-agnostic; the consuming component decides when
 *   to activate carousel mode (e.g., via a media query or resize observer).
 *
 * OPEN-CLOSED PRINCIPLE:
 * - Configurable via `UseCarouselOptions` without modifying hook internals.
 * - Returns a stable interface (`UseCarouselReturn`) that consumers bind
 *   to any scrollable container via ref and event handler props.
 *
 * =============================================================================
 */

import { useRef, useState, useCallback, useEffect } from 'react';


/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Strict TypeScript interfaces for hook configuration and return values.
   ============================================================================= */

/**
 * Configuration options for the useCarousel hook.
 * All properties have sensible defaults defined within the hook.
 */
export interface UseCarouselOptions {
  /** Total number of slides in the carousel. */
  totalSlides: number;

  /**
   * Duration in milliseconds between automatic slide transitions.
   * @default 4000
   */
  autoPlayInterval?: number;

  /**
   * Whether the carousel should auto-cycle on mount.
   * Set to false to start in a paused state.
   * @default true
   */
  autoPlay?: boolean;
}

/**
 * Return value interface for the useCarousel hook.
 * Provides state, navigation controls, and DOM event handlers.
 */
export interface UseCarouselReturn {
  /** Zero-based index of the currently active slide. */
  activeIndex: number;

  /** Whether auto-cycling has been stopped by user interaction. */
  isUserInteracted: boolean;

  /** Navigate to a specific slide by index. */
  goToSlide: (index: number) => void;

  /** Advance to the next slide (wraps around). */
  goToNext: () => void;

  /** Return to the previous slide (wraps around). */
  goToPrevious: () => void;

  /**
   * Pointer event handler for the carousel container's pointerdown event.
   * Initiates drag tracking and captures the pointer for reliable move/up events.
   */
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;

  /**
   * Pointer event handler for the carousel container's pointermove event.
   * Tracks horizontal drag distance while the pointer is held.
   */
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;

  /**
   * Pointer event handler for the carousel container's pointerup event.
   * Finalises the drag gesture and determines slide direction from swipe delta.
   */
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;

  /**
   * Pointer event handler for the carousel container's pointercancel event.
   * Cleans up drag state when the browser cancels the pointer capture.
   */
  onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
}


/* =============================================================================
   SECTION 2: CONSTANTS
   -----------------------------------------------------------------------------
   Threshold and timing constants used by the drag detection algorithm.
   ============================================================================= */

/**
 * Minimum horizontal distance (in pixels) a drag must travel
 * to be classified as a directional swipe rather than a tap.
 */
const SWIPE_THRESHOLD_PX = 30;

/**
 * Default interval in milliseconds between auto-cycle transitions.
 */
const DEFAULT_AUTO_PLAY_INTERVAL_MS = 4000;


/* =============================================================================
   SECTION 3: HOOK IMPLEMENTATION
   ============================================================================= */

/**
 * useCarousel
 *
 * Manages carousel state including auto-cycling, manual navigation, and
 * pointer-based swipe detection. Auto-cycling stops permanently once the
 * user initiates a drag or swipe gesture.
 *
 * @param options - Configuration conforming to UseCarouselOptions
 * @returns UseCarouselReturn with state, controls, and event handlers
 */
export function useCarousel(options: UseCarouselOptions): UseCarouselReturn {
  const {
    totalSlides,
    autoPlayInterval = DEFAULT_AUTO_PLAY_INTERVAL_MS,
    autoPlay = true,
  } = options;

  /* -------------------------------------------------------------------------
     State: active slide index and user-interaction flag.
     The user-interaction flag is terminal — once set, auto-play never resumes.
     ------------------------------------------------------------------------- */
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isUserInteracted, setIsUserInteracted] = useState<boolean>(false);

  /* -------------------------------------------------------------------------
     Refs: mutable values that do not trigger re-renders.
     - timerRef: holds the setInterval ID for auto-cycling.
     - dragStartXRef: horizontal coordinate where the drag began (null = idle).
     - isDraggingRef: tracks whether a drag gesture is in progress.
     ------------------------------------------------------------------------- */
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragStartXRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  /* -------------------------------------------------------------------------
     Utility: clears the auto-cycle interval and nullifies the reference.
     Safe to call when no timer is active.
     ------------------------------------------------------------------------- */
  const clearAutoPlayTimer = useCallback((): void => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /* -------------------------------------------------------------------------
     Utility: permanently stops auto-cycling due to user interaction.
     Sets the terminal flag and removes any active timer.
     ------------------------------------------------------------------------- */
  const stopAutoPlay = useCallback((): void => {
    setIsUserInteracted(true);
    clearAutoPlayTimer();
  }, [clearAutoPlayTimer]);

  /* -------------------------------------------------------------------------
     Navigation: slide index manipulation with circular wrapping.
     These functions are safe to call regardless of auto-play state.
     ------------------------------------------------------------------------- */

  /** Navigate to a specific slide index. Clamps to valid range. */
  const goToSlide = useCallback(
    (index: number): void => {
      const clampedIndex = ((index % totalSlides) + totalSlides) % totalSlides;
      setActiveIndex(clampedIndex);
    },
    [totalSlides]
  );

  /** Advance to the next slide with circular wrapping. */
  const goToNext = useCallback((): void => {
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  /** Return to the previous slide with circular wrapping. */
  const goToPrevious = useCallback((): void => {
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  /* -------------------------------------------------------------------------
     Auto-play effect: starts the interval timer when conditions are met.
     Re-runs when activeIndex changes to reset the timer cadence, ensuring
     the full interval elapses after each manual or automatic transition.
     ------------------------------------------------------------------------- */
  useEffect(() => {
    if (!autoPlay || isUserInteracted || totalSlides <= 1) {
      return;
    }

    clearAutoPlayTimer();

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, autoPlayInterval);

    return clearAutoPlayTimer;
  }, [autoPlay, autoPlayInterval, totalSlides, isUserInteracted, activeIndex, clearAutoPlayTimer]);

  /* -------------------------------------------------------------------------
     Pointer event handlers: implement drag/swipe detection using the
     Pointer Events API for unified mouse, touch, and pen support.

     Flow:
     1. pointerdown  -> record start X, set pointer capture.
     2. pointermove  -> update dragging flag if threshold exceeded.
     3. pointerup    -> evaluate swipe direction, navigate, stop auto-play.
     4. pointercancel -> clean up drag state without navigation.
     ------------------------------------------------------------------------- */

  /** Records the drag start position and captures the pointer. */
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      dragStartXRef.current = e.clientX;
      isDraggingRef.current = false;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    []
  );

  /** Tracks horizontal movement to determine if the gesture is a drag. */
  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      if (dragStartXRef.current === null) return;

      const deltaX = e.clientX - dragStartXRef.current;

      if (Math.abs(deltaX) > SWIPE_THRESHOLD_PX) {
        isDraggingRef.current = true;
      }
    },
    []
  );

  /**
   * Finalises the drag gesture. If the horizontal delta exceeds the swipe
   * threshold, navigates to the next or previous slide and permanently
   * stops auto-cycling.
   */
  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      if (dragStartXRef.current === null) return;

      const deltaX = e.clientX - dragStartXRef.current;

      if (isDraggingRef.current && Math.abs(deltaX) > SWIPE_THRESHOLD_PX) {
        stopAutoPlay();

        if (deltaX < 0) {
          goToNext();
        } else {
          goToPrevious();
        }
      }

      /* Reset drag tracking state */
      dragStartXRef.current = null;
      isDraggingRef.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    },
    [stopAutoPlay, goToNext, goToPrevious]
  );

  /** Cleans up drag state when the browser cancels the pointer capture. */
  const onPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      dragStartXRef.current = null;
      isDraggingRef.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    },
    []
  );

  /* -------------------------------------------------------------------------
     Return the public API conforming to UseCarouselReturn.
     ------------------------------------------------------------------------- */
  return {
    activeIndex,
    isUserInteracted,
    goToSlide,
    goToNext,
    goToPrevious,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
}
