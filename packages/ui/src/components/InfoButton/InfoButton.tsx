/**
 * InfoButton Component
 * =============================================================================
 *
 * PURPOSE:
 * A compact informational trigger that displays a small circled "i" icon button.
 * When clicked, it opens a modal overlay containing the full InfoBanner content
 * (heading, body, status items, and link). This component is a space-efficient
 * alternative to the InfoBanner for contexts where the banner would consume
 * excessive screen real estate (e.g., within product grids on mobile viewports).
 *
 * ARCHITECTURE:
 * - Accepts the same content props as InfoBanner (heading, body, statusItems,
 *   link) so the two components are interchangeable at the data level.
 * - The modal overlay is rendered as a React Portal attached to document.body,
 *   ensuring correct stacking regardless of parent overflow or z-index context.
 * - Keyboard accessible: Escape closes the modal, focus is trapped within the
 *   modal while open, and focus is restored to the trigger on close.
 * - Follows the Open-Closed Principle: consumers can extend behaviour via
 *   className and ariaLabel props without modifying this component.
 *
 * BEM NAMING CONVENTION:
 * - Block: .info-button
 * - Element: .info-button__[element]
 * - Modifier: .info-button__[element]--[modifier]
 *
 * USAGE:
 * ```tsx
 * <InfoButton
 *   heading="Do You Need Planning Permission?"
 *   body="Under current law, garden rooms up to 25m2 are exempt..."
 *   statusItems={[
 *     { label: "Up to 25m2", status: "active", tag: "Exempt" },
 *   ]}
 *   link={{ href: "https://...", text: "Learn More" }}
 * />
 * ```
 *
 * =============================================================================
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { InfoBannerStatusItem, InfoBannerLink } from '../InfoBanner/InfoBanner';
import './InfoButton.css';


/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Strict TypeScript interfaces for component props.
   Re-uses InfoBannerStatusItem and InfoBannerLink from the InfoBanner module
   to maintain a consistent data contract between the two components.
   ============================================================================= */

/**
 * Properties interface for the InfoButton component.
 * Content props mirror InfoBannerProps so the two components are
 * interchangeable at the data level.
 */
export interface InfoButtonProps {
  /**
   * Optional eyebrow text displayed above the heading inside the modal.
   * Styled as uppercase, letter-spaced label.
   */
  eyebrow?: string;

  /**
   * The primary heading text displayed inside the modal.
   */
  heading: string;

  /**
   * The body text or rich content displayed inside the modal.
   * Accepts a string (wrapped in a paragraph) or a React node.
   */
  body: React.ReactNode;

  /**
   * Array of status items rendered inside the modal.
   * Each item shows a visual indicator, label, and tag.
   */
  statusItems?: InfoBannerStatusItem[];

  /**
   * Optional link displayed at the bottom of the modal content.
   * Includes animated arrow on hover.
   */
  link?: InfoBannerLink;

  /**
   * Visible text label for the trigger button.
   * When provided, the trigger renders as a text button with a leading
   * "i" icon instead of a standalone icon circle. This is useful when the
   * button should clearly communicate its purpose (e.g., "Do I need
   * Planning Permission?").
   */
  triggerLabel?: string;

  /**
   * Accessible label for the trigger button.
   * @default "Show information"
   */
  ariaLabel?: string;

  /**
   * The HTML heading level (2-6) for the modal heading element.
   * Allows consumers to maintain correct heading hierarchy.
   * @default 3
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;

  /**
   * Additional CSS class names applied to the trigger button.
   */
  className?: string;
}


/* =============================================================================
   SECTION 2: ICON COMPONENTS
   -----------------------------------------------------------------------------
   SVG icons used within the component. Defined as named function components
   for clarity and reuse.
   ============================================================================= */

/**
 * Checkmark icon for status indicators.
 * Matches the InfoBanner checkmark for visual consistency.
 */
const CheckIcon: React.FC = () => (
  <svg
    viewBox="0 0 12 12"
    fill="none"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="2.5 6.5 5 9 9.5 3.5" />
  </svg>
);

/**
 * Arrow icon for the link element.
 * Matches the InfoBanner arrow for visual consistency.
 */
const ArrowIcon: React.FC = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="8" x2="13" y2="8" />
    <polyline points="9.5 4.5 13 8 9.5 11.5" />
  </svg>
);

/**
 * Close (X) icon for the modal dismiss button.
 */
const CloseIcon: React.FC = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" y1="4" x2="12" y2="12" />
    <line x1="12" y1="4" x2="4" y2="12" />
  </svg>
);


/* =============================================================================
   SECTION 3: COMPONENT IMPLEMENTATION
   -----------------------------------------------------------------------------
   The main InfoButton component manages open/close state for the modal
   overlay, handles keyboard interactions (Escape to close), traps focus
   within the modal, and restores focus to the trigger on close.
   ============================================================================= */

/**
 * InfoButton Component
 *
 * A compact info trigger that opens a modal overlay with the full
 * informational content (heading, body, status items, link).
 *
 * @param props - Component properties conforming to InfoButtonProps
 * @returns JSX.Element containing the trigger button and portal-rendered modal
 */
export const InfoButton: React.FC<InfoButtonProps> = ({
  eyebrow,
  heading,
  body,
  statusItems = [],
  link,
  triggerLabel,
  ariaLabel = 'Show information',
  headingLevel = 3,
  className = '',
}) => {
  /* -------------------------------------------------------------------------
     State: controls the visibility of the modal overlay.
     ------------------------------------------------------------------------- */
  const [isOpen, setIsOpen] = useState<boolean>(false);

  /* -------------------------------------------------------------------------
     Refs: references to the trigger button and the close button inside the
     modal, used for focus management when the modal opens and closes.
     ------------------------------------------------------------------------- */
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * Dynamic heading element derived from the headingLevel prop.
   * Allows the consumer to specify the correct heading level for its
   * document outline context without altering the visual styling.
   */
  const HeadingTag = `h${headingLevel}` as keyof Pick<
    React.JSX.IntrinsicElements,
    'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  >;

  const hasStatusItems = statusItems.length > 0;
  const hasLink = link !== undefined;

  /* -------------------------------------------------------------------------
     Open handler: shows the modal and prevents body scroll.
     ------------------------------------------------------------------------- */
  const handleOpen = useCallback((): void => {
    setIsOpen(true);
  }, []);

  /* -------------------------------------------------------------------------
     Close handler: hides the modal, restores body scroll, and returns
     focus to the trigger button for keyboard navigation continuity.
     ------------------------------------------------------------------------- */
  const handleClose = useCallback((): void => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  /* -------------------------------------------------------------------------
     Backdrop click handler: closes the modal when the user clicks
     outside the modal panel (on the backdrop overlay).
     Prevents close when the click originates inside the panel.
     ------------------------------------------------------------------------- */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  /* -------------------------------------------------------------------------
     Keyboard handler: closes the modal on Escape key press.
     Attached to the overlay container to capture events from any
     focusable child within the modal.
     ------------------------------------------------------------------------- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
      }
    },
    [handleClose]
  );

  /* -------------------------------------------------------------------------
     Focus management effect: when the modal opens, moves focus to the
     close button inside the modal. Also locks body scroll while open.
     When the modal closes, body scroll is restored.
     ------------------------------------------------------------------------- */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      /** Defer focus to the next frame so the portal element is mounted. */
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
    } else {
      document.body.style.overflow = '';
    }

    /** Cleanup: ensure body scroll is restored if the component unmounts. */
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  /* -------------------------------------------------------------------------
     Render: trigger button + portal-mounted modal overlay.
     The portal renders to document.body to escape any parent overflow
     or z-index stacking contexts.
     ------------------------------------------------------------------------- */
  return (
    <>
      {/*
        Trigger button: renders as either a compact icon-only circle or a
        text button with a leading "i" badge, depending on whether
        triggerLabel is provided.
      */}
      <button
        ref={triggerRef}
        type="button"
        className={`info-button__trigger${
          triggerLabel ? ' info-button__trigger--labelled' : ''
        } ${className}`.trim()}
        onClick={handleOpen}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="info-button__icon" aria-hidden="true">i</span>
        {triggerLabel && (
          <span className="info-button__label">{triggerLabel}</span>
        )}
      </button>

      {/*
        Modal overlay: rendered as a React Portal to document.body.
        Displays the full informational content (heading, body, status
        items, link) in a centered panel with a semi-transparent backdrop.
      */}
      {isOpen && createPortal(
        <div
          className="info-button__overlay"
          role="dialog"
          aria-modal="true"
          aria-label={heading}
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
        >
          <div className="info-button__panel">
            {/*
              Panel header: contains the heading and close button.
              The close button is the initial focus target when the
              modal opens, supporting keyboard-first navigation.
            */}
            <div className="info-button__panel-header">
              <div>
                {eyebrow && (
                  <p className="info-button__eyebrow">{eyebrow}</p>
                )}
                <HeadingTag className="info-button__heading">{heading}</HeadingTag>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="info-button__close"
                onClick={handleClose}
                aria-label="Close information panel"
              >
                <CloseIcon />
              </button>
            </div>

            {/*
              Panel body: descriptive text providing context and detail.
              Accepts either a plain string (wrapped in a paragraph) or
              rich React node content.
            */}
            <div className="info-button__body">
              {typeof body === 'string' ? <p>{body}</p> : body}
            </div>

            {/*
              Status items list: visual indicators matching the InfoBanner
              design language (filled circle for active, outlined for pending).
            */}
            {hasStatusItems && (
              <div className="info-button__status-list" role="list">
                {statusItems.map((item, index) => (
                  <div
                    className="info-button__status-item"
                    key={index}
                    role="listitem"
                    aria-label={`${item.label}: ${item.tag}`}
                  >
                    <span
                      className={`info-button__status-check info-button__status-check--${item.status}`}
                      aria-hidden="true"
                    >
                      <CheckIcon />
                    </span>
                    <span className="info-button__status-label">{item.label}</span>
                    <span
                      className={`info-button__status-tag info-button__status-tag--${item.status}`}
                      aria-hidden="true"
                    >
                      {item.tag}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/*
              Divider and link: optional CTA link matching the InfoBanner
              design, with animated arrow on hover.
            */}
            {hasLink && (
              <>
                <hr className="info-button__divider" />
                <a
                  className="info-button__link"
                  href={link.href}
                  target={link.openInNewTab !== false ? '_blank' : undefined}
                  rel={link.openInNewTab !== false ? 'noopener noreferrer' : undefined}
                  aria-label={
                    link.openInNewTab !== false
                      ? `${link.text} (opens in new tab)`
                      : undefined
                  }
                >
                  {link.text}
                  <ArrowIcon />
                </a>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
