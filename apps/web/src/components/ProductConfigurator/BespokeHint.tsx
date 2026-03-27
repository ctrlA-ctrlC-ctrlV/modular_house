/**
 * BespokeHint -- Subtle Bespoke Upsell Prompt
 * =============================================================================
 *
 * PURPOSE:
 * Renders a minimal, non-intrusive hint at the bottom of the configurator
 * summary step, letting the customer know that a fully bespoke design
 * service is available if the standard product options do not meet their
 * requirements. Designed to complement the Apple-like aesthetic of the
 * configurator without competing with the primary "Send me my estimate" CTA.
 *
 * VISUAL DESIGN:
 * - A thin horizontal separator visually decouples the hint from the
 *   primary call-to-action above.
 * - A single editorial heading in Instrument Serif with a short body line
 *   in DM Sans keeps the block lightweight and scannable.
 * - A text-only button styled as an inline arrow anchor avoids the visual
 *   weight of a full button, signalling that this is a secondary path.
 * - The entire block fades in gently (configurator-fade-up keyframe) to
 *   avoid drawing focus away from the price breakdown and primary CTA.
 *
 * INTERACTION:
 * - Clicking the hint link opens the shared EnquiryFormModal overlay,
 *   keeping the customer on the configurator page and avoiding a full
 *   navigation to the contact route.
 * - Modal open/close state and enquiry submission are managed internally,
 *   delegating the API call to the provided onSubmit callback prop.
 *
 * ARCHITECTURE:
 * - Presentational component with minimal local state (modal visibility).
 * - The enquiry submission handler is injected via the onSubmit prop,
 *   keeping the component decoupled from any specific API client.
 * - All props are strictly typed via the BespokeHintProps interface.
 *
 * =============================================================================
 */

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  EnquiryFormModal,
  type EnquiryFormData,
} from '@modular-house/ui';


/* =============================================================================
   Component Props
   ============================================================================= */

/**
 * Props for the BespokeHint component.
 *
 * @property onSubmit - Async callback invoked when the enquiry form is
 *                      submitted. Receives the validated EnquiryFormData
 *                      payload. The parent is responsible for dispatching
 *                      the data to the API.
 */
interface BespokeHintProps {
  /** Async handler called when the bespoke enquiry form is submitted. */
  onSubmit: (data: EnquiryFormData) => Promise<void>;
}


/* =============================================================================
   BespokeHint Component
   ============================================================================= */

export const BespokeHint: React.FC<BespokeHintProps> = ({ onSubmit }) => {
  /* Controls the visibility of the EnquiryFormModal overlay.
     Toggled by the inline hint link and the modal's own close button. */
  const [isModalOpen, setIsModalOpen] = useState(false);

  /** Opens the bespoke enquiry modal. */
  const handleOpen = useCallback(() => setIsModalOpen(true), []);

  /** Closes the bespoke enquiry modal. */
  const handleClose = useCallback(() => setIsModalOpen(false), []);

  return (
    <>
      <aside className="configurator__bespoke-hint" aria-label="Bespoke design enquiry">
        {/* Horizontal rule -- visually separates the hint from the primary CTA
            and price breakdown content above. Uses a thin border consistent
            with the configurator's existing divider styling. */}
        <hr className="configurator__bespoke-hint-divider" />

        {/* Editorial heading -- uses Instrument Serif to match the configurator
            step titles, keeping the typographic hierarchy coherent. */}
        <p className="configurator__bespoke-hint-heading">
          Have something different in mind?
        </p>

        {/* Supporting body copy -- kept to a single line for minimal visual
            footprint. Uses DM Sans at the secondary text colour to read as
            supplementary rather than primary content. */}
        <p className="configurator__bespoke-hint-body">
          Our team can design a fully bespoke garden room tailored to your
          exact specifications.
        </p>

        {/* Inline trigger button -- styled identically to a text link with
            an arrow glyph. Uses a native <button> element for correct
            semantics (triggers an in-page action, not a navigation).
            The visual treatment matches the existing configurator link
            pattern to maintain the Apple-like design language. */}
        <button
          type="button"
          className="configurator__bespoke-hint-link"
          onClick={handleOpen}
        >
          Talk to our design team <span aria-hidden="true">&rarr;</span>
        </button>
      </aside>

      {/* EnquiryFormModal -- rendered via a React portal to document.body
          so the fixed-position overlay escapes the configurator's content
          container. The .configurator__content element applies a CSS
          animation (transform), which creates a new containing block and
          would otherwise constrain position:fixed children to its bounds
          instead of the viewport. Portalling to the body root avoids this
          stacking context limitation entirely. */}
      {createPortal(
        <EnquiryFormModal
          isOpen={isModalOpen}
          onClose={handleClose}
          onSubmit={onSubmit}
          title="Design Your Bespoke Garden Room"
          subtext="Tell us what you have in mind and our design team will be in touch within 24 hours."
        />,
        document.body,
      )}
    </>
  );
};
