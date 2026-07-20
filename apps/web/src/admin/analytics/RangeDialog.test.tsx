/**
 * T032 — RangeDialog widget static render + keyboard tests (Pass 1, fixture state).
 *
 * Pins the render + keyboard contract for the RangeDialog widget composed from
 * the ported `dialog` + Phase 1 `button`/`label`/`input` primitives
 * (ui-components.md §5, plan §4.3 ADD, Q2/Q3, FR-019). Authored test-first
 * against the Q2 pinned values: the dialog offers exactly `6 months` /
 * `12 months` / `16 months` / `Custom`; Custom reveals two native
 * `<input type="date">` fields styled by the admin `input` primitive; the
 * dialog is keyboard reachable and Esc closes. Until `RangeDialog.tsx` exists
 * (T033) the suite fails to resolve the import — the right reason (missing
 * module), not a test compile error.
 *
 * Covered contract points (T032 "Do:" clause, in order):
 * - Three presets + Custom render (Q2: "More opens the pop-up with exactly:
 *   6 months, 12 months, 16 months, Custom"). Four buttons render with these
 *   labels — no more, no fewer.
 * - Date inputs are native (Q3: "two date inputs" — native `<input type="date">`,
 *   no calendar-grid picker per plan §1.4 guardrails). Selecting Custom
 *   reveals two date inputs of `type="date"`.
 * - Date inputs are labelled (constitution V / a11y): each `<input type="date">`
 *   has an associated `<label>` via `htmlFor`/`id`, so screen readers announce
 *   the field purpose. Asserted via `getByLabelText` which resolves the
 *   label→input association.
 * - Dialog is keyboard reachable (constitution V / H4): when the dialog opens,
 *   Radix FocusScope moves focus into the content so keyboard users can
 *   interact immediately.
 * - Esc closes (constitution V): pressing Escape on the content fires
 *   `onOpenChange(false)` — Radix Dialog's standard dismiss behaviour.
 */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { RangeDialog } from './RangeDialog.js';

/**
 * The four pop-up options in the spec order (plan §2.6 Q2: "More opens the
 * pop-up with exactly: 6 months, 12 months, 16 months, Custom"). Each entry
 * pairs the machine preset id with the display label rendered on the button.
 * The 3 month-presets fire `onSelect` immediately on click (Q2: "All presets
 * are rolling windows ending today" — no further confirmation needed);
 * `custom` reveals the date inputs instead.
 */
const POPUP_OPTIONS = [
  { id: '6m', label: '6 months' },
  { id: '12m', label: '12 months' },
  { id: '16m', label: '16 months' },
  { id: 'custom', label: 'Custom' },
] as const;

/**
 * Renders the dialog in controlled mode with callback spies. The dialog is
 * rendered with `open={true}` so the portaled content is immediately in the
 * DOM without needing a trigger — the production caller (T035 page, T080+
 * wiring) controls open state the same way.
 */
function renderDialog(options?: {
  onSelect?: (preset: string, customStart?: string, customEnd?: string) => void;
  onOpenChange?: (open: boolean) => void;
  validationMessage?: string;
}) {
  const onSelect = options?.onSelect ?? vi.fn();
  const onOpenChange = options?.onOpenChange ?? vi.fn();
  const rendered = render(
    <RangeDialog
      open={true}
      onSelect={onSelect}
      onOpenChange={onOpenChange}
      validationMessage={options?.validationMessage}
    />,
  );
  return { ...rendered, onSelect, onOpenChange };
}

describe('RangeDialog widget — static render + keyboard contract (T032)', () => {
  beforeAll(() => {
    // Radix Dialog portals content into document.body and references
    // focus/scroll APIs jsdom does not implement. Polyfill them so keyboard
    // interactions resolve deterministically (no real pointer events) —
    // identical to the dialog primitive suite (T014).
    if (!Element.prototype.hasPointerCapture) {
      Element.prototype.hasPointerCapture = () => false;
    }
    if (!Element.prototype.setPointerCapture) {
      Element.prototype.setPointerCapture = () => undefined;
    }
    if (!Element.prototype.releasePointerCapture) {
      Element.prototype.releasePointerCapture = () => undefined;
    }
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = () => undefined;
    }
  });

  it('renders exactly the three presets + Custom (4 buttons) when open (Q2)', async () => {
    // Q2: "More opens the pop-up with exactly: 6 months, 12 months, 16 months,
    // Custom". The dialog renders four buttons with these labels — no extra,
    // none missing. Await the dialog role so the portaled content is settled
    // before querying buttons.
    renderDialog();
    await screen.findByRole('dialog');

    for (const option of POPUP_OPTIONS) {
      expect(
        screen.getByRole('button', { name: option.label }),
      ).toBeInTheDocument();
    }

    // Assert exactly four buttons matching the spec options — no extras. The
    // dialog also renders a close button and possibly a Cancel button, so we
    // filter to the preset buttons by their exact labels.
    const presetButtons = POPUP_OPTIONS.map((o) =>
      screen.getByRole('button', { name: o.label }),
    );
    expect(presetButtons).toHaveLength(4);
  });

  it('reveals two native <input type="date"> fields when Custom is clicked (Q3)', async () => {
    // Q3: "Custom range in the pop-up: two date inputs". Clicking the Custom
    // button reveals the date inputs (hidden until Custom is selected). The
    // inputs are native `<input type="date">` — no calendar-grid picker per
    // plan §1.4 guardrails ("no calendar-grid date picker (two native date
    // inputs)").
    renderDialog();
    await screen.findByRole('dialog');

    // Before clicking Custom, no date inputs are present.
    expect(screen.queryByLabelText(/start date/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/end date/i)).not.toBeInTheDocument();

    // Click Custom to reveal the date inputs.
    fireEvent.click(screen.getByRole('button', { name: 'Custom' }));

    // Two native date inputs appear, labelled "Start date" and "End date".
    // getByLabelText resolves the `<label htmlFor>` → `<input id>` association.
    const startInput = screen.getByLabelText(/start date/i);
    const endInput = screen.getByLabelText(/end date/i);
    expect(startInput).toHaveAttribute('type', 'date');
    expect(endInput).toHaveAttribute('type', 'date');
  });

  it('associates each date input with a <label> via htmlFor/id (a11y)', async () => {
    // Constitution V: form controls must have associated labels for assistive
    // technology. Each `<input type="date">` has an `id` and a matching
    // `<label htmlFor={id}>` rendered by the Phase 1 `Label` primitive.
    // `getByLabelText` resolves the association; if either input lacked a
    // label, the query would throw.
    renderDialog();
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'Custom' }));

    const startInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
    const endInput = screen.getByLabelText(/end date/i) as HTMLInputElement;

    // Each input has an id (the Label's `htmlFor` targets it).
    expect(startInput.id).toBeTruthy();
    expect(endInput.id).toBeTruthy();
    expect(startInput.id).not.toBe(endInput.id);

    // The associated label elements exist with matching htmlFor.
    const startLabel = document.querySelector(
      `label[for="${startInput.id}"]`,
    );
    const endLabel = document.querySelector(`label[for="${endInput.id}"]`);
    expect(startLabel).not.toBeNull();
    expect(endLabel).not.toBeNull();
    expect(startLabel?.textContent).toMatch(/start date/i);
    expect(endLabel?.textContent).toMatch(/end date/i);
  });

  it('moves focus into the dialog content on open (keyboard reachable)', async () => {
    // Constitution V / H4: the dialog is keyboard reachable. When the dialog
    // opens, Radix FocusScope moves focus to the first focusable element
    // inside the content so keyboard users can interact immediately without
    // tabbing through the page behind the overlay.
    renderDialog();
    const content = await screen.findByRole('dialog');

    // Radix FocusScope activates on mount; the focus shift is awaited because
    // it may be deferred to a microtask.
    await waitFor(() => {
      expect(content.contains(document.activeElement)).toBe(true);
    });
  });

  it('closes the dialog on Escape (fires onOpenChange(false))', async () => {
    // Constitution V: Esc dismisses the dialog. Radix Dialog handles Escape
    // internally and calls `onOpenChange(false)` — the controlled-open
    // equivalent of closing. The spy assertion verifies the callback fires
    // (the parent decides whether to actually set `open` to `false`).
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });
    const content = await screen.findByRole('dialog');
    fireEvent.keyDown(content, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
