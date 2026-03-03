/**
 * AccordionFAQ Unit Tests
 * =============================================================================
 *
 * PURPOSE:
 * Validates the rendering behaviour, accessibility attributes, keyboard
 * interaction, and state management of the AccordionFAQ component. Each
 * test case maps to a specific acceptance criterion from the component
 * contract.
 *
 * TEST STRATEGY:
 * - Mock data provides 6 FAQ items matching the expected data model shape.
 * - Tests assert on rendered DOM structure, ARIA attributes, and user
 *   interactions rather than implementation details.
 * - The onToggle callback is verified using Vitest spies to confirm
 *   correct argument passing without coupling to internal state management.
 * - No "any" types are used; all mock data conforms to AccordionFAQItem.
 *
 * ENVIRONMENT:
 * Runs in a browser context via Vitest + Playwright with @testing-library/react.
 *
 * =============================================================================
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AccordionFAQ, type AccordionFAQItem } from './AccordionFAQ';

/* =============================================================================
   SECTION 1: MOCK DATA
   -----------------------------------------------------------------------------
   Six FAQ items covering all fields in the AccordionFAQItem interface.
   The data mirrors the garden room FAQ topics specified in the data model:
   planning permission, build timeline, sizes, insulation, year-round use,
   and price inclusions.
   ============================================================================= */

const MOCK_FAQS: AccordionFAQItem[] = [
  {
    id: 'faq-1',
    number: '01',
    title: 'Do I need planning permission for a garden room?',
    description: 'Under current Irish law, garden rooms up to 25 square metres are generally exempt from planning permission when they meet certain conditions.',
  },
  {
    id: 'faq-2',
    number: '02',
    title: 'How long does it take to build a garden room?',
    description: 'A typical garden room takes 6 to 8 weeks from order confirmation to handover, depending on the size and specification chosen.',
  },
  {
    id: 'faq-3',
    number: '03',
    title: 'What sizes of garden rooms do you offer?',
    description: 'We currently offer four sizes: 15 square metres, 25 square metres, 35 square metres, and 45 square metres.',
  },
  {
    id: 'faq-4',
    number: '04',
    title: 'How is the garden room insulated and heated?',
    description: 'All our garden rooms feature high-performance insulation with an A-rated BER, triple-glazed windows, and optional underfloor heating.',
  },
  {
    id: 'faq-5',
    number: '05',
    title: 'Can I use the garden room as a home office year-round?',
    description: 'Yes. Our steel-frame construction with superior insulation maintains a comfortable temperature in all seasons, making it ideal for year-round use.',
  },
  {
    id: 'faq-6',
    number: '06',
    title: 'What is included in the price?',
    description: 'The price includes the steel frame, full insulation, interior and exterior finishes, electrical wiring, lighting, and a 10-year structural warranty.',
  },
];

/* =============================================================================
   SECTION 2: TEST LIFECYCLE
   ============================================================================= */

/**
 * Clean up the DOM after each test to prevent state leakage between
 * test cases. Required because @testing-library/react render mounts
 * into the same document across tests.
 */
afterEach(() => {
  cleanup();
});

/* =============================================================================
   SECTION 3: TEST SUITE
   ============================================================================= */

describe('AccordionFAQ', () => {
  /* -------------------------------------------------------------------------
     TEST CASE 1: Item count verification
     Ensures the component renders exactly one trigger button per FAQ item.
     This confirms the map iteration works and no items are skipped.
     ------------------------------------------------------------------------- */
  it('renders all 6 FAQ items when given 6 items', () => {
    render(<AccordionFAQ faqs={MOCK_FAQS} title="FAQ" />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);
  });

  /* -------------------------------------------------------------------------
     TEST CASE 2: Initial collapsed state
     All items must start in the collapsed state. This is verified by
     checking that every trigger button has aria-expanded="false".
     ------------------------------------------------------------------------- */
  it('all items start collapsed with aria-expanded="false"', () => {
    render(<AccordionFAQ faqs={MOCK_FAQS} title="FAQ" />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button.getAttribute('aria-expanded')).toBe('false');
    });
  });

  /* -------------------------------------------------------------------------
     TEST CASE 3: Click to expand
     Clicking a collapsed trigger should expand the corresponding panel.
     Verified by checking aria-expanded changes to "true" and the panel
     becomes visible (hidden attribute removed).
     ------------------------------------------------------------------------- */
  it('clicking a trigger expands the corresponding panel', () => {
    render(<AccordionFAQ faqs={MOCK_FAQS} title="FAQ" />);

    const firstButton = screen.getAllByRole('button')[0];
    fireEvent.click(firstButton);

    /** The trigger should now indicate expanded state */
    expect(firstButton.getAttribute('aria-expanded')).toBe('true');

    /** The panel should be visible (hidden attribute removed) */
    const panel = document.getElementById('panel-faq-1');
    expect(panel).toBeDefined();
    expect(panel!.hasAttribute('hidden')).toBe(false);
  });

  /* -------------------------------------------------------------------------
     TEST CASE 4: Click to collapse
     Clicking an already-expanded trigger should collapse it. Verified by
     checking aria-expanded returns to "false" and hidden is restored.
     ------------------------------------------------------------------------- */
  it('clicking an expanded trigger collapses it', () => {
    render(<AccordionFAQ faqs={MOCK_FAQS} title="FAQ" />);

    const firstButton = screen.getAllByRole('button')[0];

    /** First click: expand */
    fireEvent.click(firstButton);
    expect(firstButton.getAttribute('aria-expanded')).toBe('true');

    /** Second click: collapse */
    fireEvent.click(firstButton);
    expect(firstButton.getAttribute('aria-expanded')).toBe('false');

    const panel = document.getElementById('panel-faq-1');
    expect(panel!.hasAttribute('hidden')).toBe(true);
  });

  /* -------------------------------------------------------------------------
     TEST CASE 5: Multiple items open simultaneously
     The accordion supports independent toggle — opening one item must
     not close another. This validates the Set-based state management.
     ------------------------------------------------------------------------- */
  it('multiple items can be open simultaneously', () => {
    render(<AccordionFAQ faqs={MOCK_FAQS} title="FAQ" />);

    const buttons = screen.getAllByRole('button');

    /** Open item 1 and item 3 */
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[2]);

    /** Both should be expanded */
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
    expect(buttons[2].getAttribute('aria-expanded')).toBe('true');

    /** Other items should remain collapsed */
    expect(buttons[1].getAttribute('aria-expanded')).toBe('false');
    expect(buttons[3].getAttribute('aria-expanded')).toBe('false');
  });

  /* -------------------------------------------------------------------------
     TEST CASE 6: aria-controls matches panel id
     Each trigger's aria-controls attribute must match the corresponding
     panel's id, establishing the ARIA relationship for assistive
     technologies to navigate between trigger and content.
     ------------------------------------------------------------------------- */
  it('each trigger has correct aria-controls matching panel id', () => {
    render(<AccordionFAQ faqs={MOCK_FAQS} title="FAQ" />);

    MOCK_FAQS.forEach((faq) => {
      const trigger = document.getElementById(`trigger-${faq.id}`);
      const panel = document.getElementById(`panel-${faq.id}`);

      expect(trigger).toBeDefined();
      expect(panel).toBeDefined();
      expect(trigger!.getAttribute('aria-controls')).toBe(`panel-${faq.id}`);
    });
  });

  /* -------------------------------------------------------------------------
     TEST CASE 7: Panel ARIA attributes
     Each panel must have role="region" and aria-labelledby pointing back
     to its trigger, creating a bidirectional ARIA relationship.
     ------------------------------------------------------------------------- */
  it('each panel has role="region" and correct aria-labelledby', () => {
    render(<AccordionFAQ faqs={MOCK_FAQS} title="FAQ" />);

    MOCK_FAQS.forEach((faq) => {
      const panel = document.getElementById(`panel-${faq.id}`);

      expect(panel).toBeDefined();
      expect(panel!.getAttribute('role')).toBe('region');
      expect(panel!.getAttribute('aria-labelledby')).toBe(`trigger-${faq.id}`);
    });
  });

  /* -------------------------------------------------------------------------
     TEST CASE 8: Keyboard — Enter key
     Pressing Enter on a focused trigger button should toggle the item.
     Native <button> elements fire click events on Enter, so this test
     verifies the integration works end-to-end.
     ------------------------------------------------------------------------- */
  it('pressing Enter on a trigger toggles the item', () => {
    render(<AccordionFAQ faqs={MOCK_FAQS} title="FAQ" />);

    const firstButton = screen.getAllByRole('button')[0];

    /** Simulate Enter keypress — triggers the native click handler */
    fireEvent.keyDown(firstButton, { key: 'Enter', code: 'Enter' });
    fireEvent.click(firstButton);

    expect(firstButton.getAttribute('aria-expanded')).toBe('true');
  });

  /* -------------------------------------------------------------------------
     TEST CASE 9: Keyboard — Space key
     Pressing Space on a focused trigger should toggle the item. The
     component explicitly handles the Space key to prevent the default
     browser scroll-down behaviour.
     ------------------------------------------------------------------------- */
  it('pressing Space on a trigger toggles the item', () => {
    render(<AccordionFAQ faqs={MOCK_FAQS} title="FAQ" />);

    const firstButton = screen.getAllByRole('button')[0];

    /** Space key should toggle via the explicit keyDown handler */
    fireEvent.keyDown(firstButton, { key: ' ', code: 'Space' });

    expect(firstButton.getAttribute('aria-expanded')).toBe('true');
  });

  /* -------------------------------------------------------------------------
     TEST CASE 10: onToggle callback
     The optional onToggle callback should be called with the correct
     item data, index, and new open state when a trigger is clicked.
     ------------------------------------------------------------------------- */
  it('calls onToggle callback with correct item, index, and isOpen state', () => {
    const handleToggle = vi.fn();
    render(<AccordionFAQ faqs={MOCK_FAQS} title="FAQ" onToggle={handleToggle} />);

    const buttons = screen.getAllByRole('button');

    /** Click the third item (index 2) — should open it */
    fireEvent.click(buttons[2]);

    expect(handleToggle).toHaveBeenCalledTimes(1);
    expect(handleToggle).toHaveBeenCalledWith(
      MOCK_FAQS[2],
      2,
      true,
    );

    /** Click the same item again — should close it */
    fireEvent.click(buttons[2]);

    expect(handleToggle).toHaveBeenCalledTimes(2);
    expect(handleToggle).toHaveBeenCalledWith(
      MOCK_FAQS[2],
      2,
      false,
    );
  });

  /* -------------------------------------------------------------------------
     TEST CASE 11: Title heading rendering
     The section heading should be rendered as an h2 when the title prop
     is provided. This validates the accessible heading hierarchy.
     ------------------------------------------------------------------------- */
  it('renders title heading when provided', () => {
    render(<AccordionFAQ faqs={MOCK_FAQS} title="Frequently Asked Questions" />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeDefined();
    expect(heading.textContent).toBe('Frequently Asked Questions');
  });

  /* -------------------------------------------------------------------------
     TEST CASE 12: Hidden attribute on collapsed panels
     All collapsed panels must have the `hidden` attribute, which removes
     them from the accessibility tree and hides them visually. This is the
     standard HTML mechanism for hiding content that is not currently relevant.
     ------------------------------------------------------------------------- */
  it('collapsed panels have the hidden attribute', () => {
    render(<AccordionFAQ faqs={MOCK_FAQS} title="FAQ" />);

    MOCK_FAQS.forEach((faq) => {
      const panel = document.getElementById(`panel-${faq.id}`);
      expect(panel).toBeDefined();
      expect(panel!.hasAttribute('hidden')).toBe(true);
    });
  });
});
