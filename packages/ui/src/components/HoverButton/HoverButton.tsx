/**
 * HoverButton Component
 * =============================================================================
 *
 * PURPOSE:
 * An Apple-style informational hover button that displays a circled "i" icon
 * (Unicode U+24D8). On hover, a popover card smoothly animates in with a
 * directional arrow, providing contextual information without requiring a
 * click interaction. The popover automatically repositions (flips above) when
 * insufficient viewport space exists below the trigger.
 *
 * ARCHITECTURE:
 * - Pure hover-based interaction using mouseenter / mouseleave events.
 * - A small delay (default 120ms) is applied before showing the popover to
 *   prevent flicker when the cursor passes over the trigger incidentally.
 * - The popover uses CSS keyframe animations (scale + opacity) for entry and
 *   exit transitions, driven by a data-state attribute.
 * - Viewport boundary detection is performed on every open to determine
 *   whether the popover should render above or below the trigger.
 * - Follows the Open-Closed Principle: consumers can extend the component
 *   via className, render props (children), and ARIA overrides without
 *   modifying the component internals.
 *
 * ACCESSIBILITY:
 * - The trigger is a semantic <button> element with role="button".
 * - The popover is linked to the trigger via aria-describedby.
 * - Reduced-motion users see instant show/hide without animation.
 * - Focus-visible outline follows the project accessibility standard.
 *
 * BEM NAMING CONVENTION:
 * - Block:    .hover-button
 * - Element:  .hover-button__[element]
 * - Modifier: .hover-button--[modifier]
 *
 * USAGE:
 * ```tsx
 * <HoverButton ariaLabel="More about insulation">
 *   <p>All panels include 100mm Kingspan insulation.</p>
 * </HoverButton>
 * ```
 *
 * =============================================================================
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import './HoverButton.css';


/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Strict TypeScript interfaces for all component props. No use of "any".
   ============================================================================= */

/**
 * Placement options for the popover relative to the trigger icon.
 * "bottom" renders the card below; "top" renders it above.
 */
export type HoverButtonPlacement = 'top' | 'bottom';

/**
 * Properties interface for the HoverButton component.
 */
export interface HoverButtonProps {
  /**
   * Content rendered inside the popover card.
   * Accepts any valid React node (text, elements, fragments).
   */
  children: React.ReactNode;

  /**
   * Accessible label for the trigger button.
   * Describes the purpose of the information popover.
   * @default "Show information"
   */
  ariaLabel?: string;

  /**
   * Preferred placement of the popover relative to the trigger.
   * The component will automatically flip to the opposite side
   * when there is insufficient viewport space.
   * @default "bottom"
   */
  placement?: HoverButtonPlacement;

  /**
   * Delay in milliseconds before the popover appears on hover.
   * Prevents flicker when the cursor passes over the trigger incidentally.
   * @default 120
   */
  openDelay?: number;

  /**
   * Delay in milliseconds before the popover closes after the cursor
   * leaves the trigger or popover area. Allows the user to move the
   * cursor from the trigger into the popover without it closing.
   * @default 200
   */
  closeDelay?: number;

  /**
   * Additional CSS class names applied to the root wrapper element.
   * Enables consumer-side styling without modifying the component.
   */
  className?: string;
}

/**
 * Internal state for popover visibility.
 * "open" and "closing" drive CSS animation via data-state.
 */
type PopoverState = 'closed' | 'open' | 'closing';


/* =============================================================================
   SECTION 2: CONSTANTS
   -----------------------------------------------------------------------------
   Default configuration values and the Unicode info symbol.
   ============================================================================= */

/** Unicode circled information source character (U+24D8). */
const INFO_SYMBOL = '\u24D8';

/** Minimum viewport margin (px) before the popover flips placement. */
const VIEWPORT_MARGIN = 16;

/** Duration (ms) of the CSS exit animation; must match HoverButton.css. */
const EXIT_ANIMATION_DURATION = 180;


/* =============================================================================
   SECTION 3: COMPONENT IMPLEMENTATION
   -----------------------------------------------------------------------------
   The HoverButton manages hover intent via delayed timers, measures
   available viewport space to choose placement, and coordinates CSS
   animation states for smooth entry/exit transitions.
   ============================================================================= */

/**
 * HoverButton Component
 *
 * Renders a circled "i" icon that reveals a popover card on hover.
 * The popover features a directional arrow, automatic viewport-aware
 * placement, and smooth scale + fade animations.
 *
 * @param props - Component properties conforming to HoverButtonProps
 * @returns JSX.Element containing the trigger button and popover card
 */
export const HoverButton: React.FC<HoverButtonProps> = ({
  children,
  ariaLabel = 'Show information',
  placement = 'bottom',
  openDelay = 120,
  closeDelay = 200,
  className,
}) => {
  /**
   * Popover visibility state.
   * - "closed": popover is not rendered.
   * - "open": popover is visible and animating in.
   * - "closing": popover is animating out before being removed.
   */
  const [popoverState, setPopoverState] = useState<PopoverState>('closed');

  /**
   * Resolved placement after viewport boundary detection.
   * May differ from the consumer-provided `placement` prop.
   */
  const [resolvedPlacement, setResolvedPlacement] = useState<HoverButtonPlacement>(placement);

  /** Reference to the trigger button element for position measurement. */
  const triggerRef = useRef<HTMLButtonElement>(null);

  /** Reference to the popover container for hover detection continuity. */
  const popoverRef = useRef<HTMLDivElement>(null);

  /** Timer ID for the open delay. */
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Timer ID for the close delay. */
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Timer ID for the exit animation cleanup. */
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Unique ID for the popover element used with aria-describedby. */
  const popoverId = useRef(
    `hover-button-popover-${Math.random().toString(36).slice(2, 9)}`
  ).current;

  /**
   * Clears all pending timers to prevent stale state transitions.
   * Invoked on every hover event and during cleanup.
   */
  const clearAllTimers = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  /**
   * Determines whether the popover should appear above or below the
   * trigger based on available viewport space. Falls back to the
   * consumer-specified placement when sufficient space exists in
   * the preferred direction.
   */
  const resolvePlacement = useCallback((): HoverButtonPlacement => {
    if (!triggerRef.current) return placement;

    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    /**
     * Estimated popover height including arrow and padding.
     * A conservative estimate is used to avoid clipping.
     */
    const estimatedPopoverHeight = 200;

    if (placement === 'bottom') {
      /* Flip to top if insufficient space below */
      return spaceBelow < estimatedPopoverHeight + VIEWPORT_MARGIN && spaceAbove > spaceBelow
        ? 'top'
        : 'bottom';
    }

    /* Flip to bottom if insufficient space above */
    return spaceAbove < estimatedPopoverHeight + VIEWPORT_MARGIN && spaceBelow > spaceAbove
      ? 'bottom'
      : 'top';
  }, [placement]);

  /**
   * Opens the popover after the configured delay.
   * Cancels any pending close or exit timers to avoid race conditions.
   */
  const scheduleOpen = useCallback(() => {
    clearAllTimers();

    openTimerRef.current = setTimeout(() => {
      setResolvedPlacement(resolvePlacement());
      setPopoverState('open');
    }, openDelay);
  }, [clearAllTimers, openDelay, resolvePlacement]);

  /**
   * Closes the popover after the configured delay.
   * Triggers the "closing" animation state before fully hiding.
   */
  const scheduleClose = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    closeTimerRef.current = setTimeout(() => {
      setPopoverState('closing');

      /* Allow the exit animation to complete before removing from DOM */
      exitTimerRef.current = setTimeout(() => {
        setPopoverState('closed');
      }, EXIT_ANIMATION_DURATION);
    }, closeDelay);
  }, [closeDelay]);

  /**
   * Mouse enter handler for both the trigger and popover elements.
   * Cancels any pending close and initiates an open if not already visible.
   */
  const handleMouseEnter = useCallback(() => {
    if (popoverState === 'closing') {
      /* Re-open immediately if still animating out */
      clearAllTimers();
      setPopoverState('open');
      return;
    }

    if (popoverState === 'closed') {
      scheduleOpen();
    } else {
      /* Already open; cancel any pending close */
      clearAllTimers();
    }
  }, [popoverState, clearAllTimers, scheduleOpen]);

  /**
   * Mouse leave handler for both the trigger and popover elements.
   * Begins the close delay to allow cursor movement between elements.
   */
  const handleMouseLeave = useCallback(() => {
    scheduleClose();
  }, [scheduleClose]);

  /**
   * Cleanup effect: clears all timers when the component unmounts
   * to prevent memory leaks and stale state updates.
   */
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  /**
   * Constructs the root element class name from the base class
   * and any consumer-provided className.
   */
  const rootClassName = ['hover-button', className].filter(Boolean).join(' ');

  /* Determine whether the popover is visible in the DOM */
  const isVisible = popoverState !== 'closed';

  return (
    <span className={rootClassName}>
      {/* ---------------------------------------------------------------
          Trigger Button
          ---------------------------------------------------------------
          A semantic button element that displays the circled "i" icon.
          Hover events are attached to initiate the popover display.
          ---------------------------------------------------------------- */}
      <button
        ref={triggerRef}
        type="button"
        className="hover-button__trigger"
        aria-label={ariaLabel}
        aria-describedby={isVisible ? popoverId : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
      >
        {INFO_SYMBOL}
      </button>

      {/* ---------------------------------------------------------------
          Popover Card
          ---------------------------------------------------------------
          Rendered only when visible (open or closing states).
          The data-state attribute drives CSS entry/exit animations.
          The data-placement attribute controls arrow direction and
          vertical positioning (top or bottom).
          ---------------------------------------------------------------- */}
      {isVisible && (
        <div
          ref={popoverRef}
          id={popoverId}
          role="tooltip"
          className="hover-button__popover"
          data-state={popoverState}
          data-placement={resolvedPlacement}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Directional arrow pointing toward the trigger icon */}
          <span className="hover-button__arrow" aria-hidden="true" />
          <div className="hover-button__content">
            {children}
          </div>
        </div>
      )}
    </span>
  );
};
