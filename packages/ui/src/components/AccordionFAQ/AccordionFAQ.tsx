/**
 * AccordionFAQ Component
 * =============================================================================
 *
 * PURPOSE:
 * Renders an accessible, expandable/collapsible FAQ section. Each FAQ item
 * consists of a clickable trigger (number + question + chevron) and a content
 * panel (answer text) that toggles visibility independently. Multiple items
 * can be open simultaneously.
 *
 * ARCHITECTURE:
 * State is managed internally via a Set<string> of open item IDs. The Set
 * data structure provides O(1) lookup for determining whether an item is
 * expanded, and naturally supports the multi-open requirement without
 * boolean arrays or index tracking.
 *
 * The component follows the Open-Closed Principle: the AccordionFAQItem
 * interface defines a stable data contract, and new FAQ entries can be added
 * purely through data without modifying component logic. The optional
 * onToggle callback allows parent components to observe state changes
 * without controlling them.
 *
 * ACCESSIBILITY (WAI-ARIA Accordion Pattern):
 * - Section uses aria-labelledby to associate the h2 heading.
 * - Each trigger is a <button> with aria-expanded and aria-controls.
 * - Each panel has role="region", aria-labelledby, and the hidden attribute
 *   when collapsed.
 * - Keyboard: Enter and Space toggle the focused item (native <button>
 *   behaviour handles Enter; Space is explicitly handled to prevent scroll).
 * - No focus trap — Tab moves to the next focusable element naturally.
 *
 * BEM CLASS NAMING:
 * Block:    .accordion-faq (section wrapper)
 * Block:    .accordion-faq-item (individual item)
 * Modifier: .accordion-faq-item--open (expanded state)
 * Elements follow the pattern: .accordion-faq-item__element-name
 *
 * =============================================================================
 */

import React from 'react';
import './AccordionFAQ.css';

/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Strictly typed interfaces with no implicit "any" types.
   Exported so consuming modules can construct type-safe FAQ data arrays
   without importing the component itself.
   ============================================================================= */

/**
 * Data shape for a single FAQ item.
 *
 * Each field maps directly to a visual element within the accordion item.
 * The `id` field serves double duty: it provides the ARIA relationship
 * anchors (trigger id, panel id) and acts as the key in the open-items Set.
 */
export interface AccordionFAQItem {
  /** Unique identifier used for ARIA attributes (e.g., "faq-1") */
  id: string;
  /** Display number shown to the left of the question (e.g., "01") */
  number: string;
  /** Question text displayed as the clickable heading */
  title: string;
  /** Answer text revealed when the item is expanded */
  description: string;
}

/**
 * Props for the AccordionFAQ component.
 *
 * The `faqs` array is the only required prop. All other props provide
 * optional customisation hooks without changing the component's core
 * rendering behaviour.
 */
export interface AccordionFAQProps {
  /** Section heading rendered as an h2 above the FAQ list */
  title?: string;
  /** Array of FAQ items to render in the accordion */
  faqs: AccordionFAQItem[];
  /** Optional CSS class name appended to the section wrapper for styling extensions */
  className?: string;
  /** Optional callback fired when an FAQ item is toggled open or closed */
  onToggle?: (item: AccordionFAQItem, index: number, isOpen: boolean) => void;
}

/* =============================================================================
   SECTION 2: COMPONENT IMPLEMENTATION
   ============================================================================= */

/**
 * AccordionFAQ
 *
 * Renders a titled section containing a vertical list of expandable FAQ
 * items. Each item can be independently toggled open or closed via click
 * or keyboard interaction (Enter / Space).
 *
 * @param props - Component configuration conforming to AccordionFAQProps
 * @returns JSX element representing the FAQ accordion section
 */
export const AccordionFAQ: React.FC<AccordionFAQProps> = ({
  title,
  faqs,
  className,
  onToggle,
}) => {
  /**
   * Set of currently open item IDs.
   *
   * Using a Set rather than an array or boolean map provides:
   * - O(1) membership checks via Set.has()
   * - Clean add/delete semantics for toggle operations
   * - Natural support for zero, one, or many open items
   *
   * The state is initialised as an empty Set (all items collapsed).
   */
  const [openIds, setOpenIds] = React.useState<Set<string>>(new Set());

  /**
   * Stable identifier for the heading element, used by aria-labelledby
   * on the <section> to establish an accessible name association.
   */
  const titleId = 'accordion-faq-title';

  /**
   * Toggles the open/closed state of an FAQ item.
   *
   * Creates a new Set instance on each toggle to ensure React detects
   * the state change (Set mutation alone would not trigger a re-render
   * because the reference would remain the same).
   *
   * @param item - The FAQ item being toggled
   * @param index - The zero-based position of the item in the faqs array
   */
  const handleToggle = (item: AccordionFAQItem, index: number): void => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      const isCurrentlyOpen = next.has(item.id);

      if (isCurrentlyOpen) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }

      /** Fire the optional callback with the new open state */
      if (onToggle) {
        onToggle(item, index, !isCurrentlyOpen);
      }

      return next;
    });
  };

  /**
   * Handles keyboard events on trigger buttons.
   *
   * Native <button> elements already handle Enter key presses by firing
   * the click event. The Space key, however, also triggers the default
   * scroll-down behaviour in browsers. This handler explicitly prevents
   * that default and triggers the toggle, ensuring consistent behaviour
   * for both Enter and Space.
   *
   * @param event - The keyboard event from the trigger button
   * @param item - The FAQ item associated with the trigger
   * @param index - The zero-based position of the item in the faqs array
   */
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    item: AccordionFAQItem,
    index: number,
  ): void => {
    if (event.key === ' ') {
      event.preventDefault();
      handleToggle(item, index);
    }
  };

  /**
   * Compose the section wrapper class name.
   * Appends the optional className prop for consumer-level styling extensions.
   */
  const sectionClassName = `accordion-faq${className ? ` ${className}` : ''}`;

  return (
    <section className={sectionClassName} aria-labelledby={titleId}>
      {/* ---------------------------------------------------------------
          HEADER BLOCK
          Renders the section heading. The title is optional to support
          use cases where the accordion is embedded within a parent
          section that already provides a heading.
          --------------------------------------------------------------- */}
      {title && (
        <div className="accordion-faq__header">
          <h2 id={titleId} className="accordion-faq__title">{title}</h2>
        </div>
      )}

      {/* ---------------------------------------------------------------
          LIST CONTAINER
          Contains all FAQ items in a vertical stack. Max-width is
          constrained via CSS to maintain readable line lengths.
          --------------------------------------------------------------- */}
      <div className="accordion-faq__list">
        {faqs.map((item, index) => {
          const isOpen = openIds.has(item.id);

          return (
            <AccordionFAQItemComponent
              key={item.id}
              item={item}
              index={index}
              isOpen={isOpen}
              onToggle={handleToggle}
              onKeyDown={handleKeyDown}
            />
          );
        })}
      </div>
    </section>
  );
};

/* =============================================================================
   SECTION 3: ITEM SUB-COMPONENT
   -----------------------------------------------------------------------------
   Extracted as a private sub-component for readability and to isolate the
   per-item rendering logic. Not exported because consumers interact only
   with the AccordionFAQ component + AccordionFAQItem data shape.
   ============================================================================= */

/**
 * Internal props for the FAQ item sub-component.
 */
interface AccordionFAQItemComponentProps {
  /** The FAQ data to render */
  item: AccordionFAQItem;
  /** Zero-based position in the FAQ list */
  index: number;
  /** Whether this item is currently expanded */
  isOpen: boolean;
  /** Toggle handler called on click */
  onToggle: (item: AccordionFAQItem, index: number) => void;
  /** Keyboard handler for Space key prevention */
  onKeyDown: (
    event: React.KeyboardEvent<HTMLButtonElement>,
    item: AccordionFAQItem,
    index: number,
  ) => void;
}

/**
 * AccordionFAQItemComponent (internal)
 *
 * Renders a single FAQ item with a trigger button and collapsible panel.
 * The open/closed state is controlled by the parent AccordionFAQ component
 * via the `isOpen` prop.
 *
 * @param props - Item-level configuration
 * @returns JSX element representing one FAQ accordion item
 */
const AccordionFAQItemComponent: React.FC<AccordionFAQItemComponentProps> = ({
  item,
  index,
  isOpen,
  onToggle,
  onKeyDown,
}) => {
  const { id, number, title, description } = item;

  /**
   * ARIA attribute IDs.
   * The trigger and panel are linked via aria-controls / aria-labelledby
   * to enable assistive technologies to navigate between them.
   */
  const triggerId = `trigger-${id}`;
  const panelId = `panel-${id}`;

  /**
   * Compose the item wrapper class name.
   * The --open modifier triggers CSS transitions for the chevron rotation
   * and panel max-height expansion.
   */
  const itemClassName = `accordion-faq-item${isOpen ? ' accordion-faq-item--open' : ''}`;

  return (
    <div className={itemClassName}>
      {/* ---------------------------------------------------------------
          TRIGGER BUTTON
          A semantic <button> element that toggles the panel visibility.
          Contains three inline elements: number, question text, and
          chevron indicator. The button spans the full width of the item
          for a large click/tap target.
          --------------------------------------------------------------- */}
      <button
        className="accordion-faq-item__trigger"
        id={triggerId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => onToggle(item, index)}
        onKeyDown={(e) => onKeyDown(e, item, index)}
      >
        {/* Number label — displayed to the left as a visual anchor */}
        <span className="accordion-faq-item__number">{number}</span>

        {/* Question text — fills the remaining horizontal space */}
        <span className="accordion-faq-item__question">{title}</span>

        {/* Chevron indicator — rotates 180 degrees when open via CSS */}
        <span className="accordion-faq-item__chevron" aria-hidden="true">
          &#9662;
        </span>
      </button>

      {/* ---------------------------------------------------------------
          CONTENT PANEL
          Contains the answer text. When collapsed, the hidden attribute
          removes it from the accessibility tree and the CSS max-height
          transition provides a smooth visual collapse.
          --------------------------------------------------------------- */}
      <div
        className="accordion-faq-item__panel"
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        hidden={!isOpen}
      >
        <p className="accordion-faq-item__answer">{description}</p>
      </div>
    </div>
  );
};
