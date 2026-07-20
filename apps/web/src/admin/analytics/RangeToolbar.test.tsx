/**
 * T030 — RangeToolbar widget static render/keyboard tests (Pass 1, fixture state).
 *
 * Pins the render + keyboard contract for the RangeToolbar widget that adapts
 * the template `_components/analytics-toolbar.tsx` (ui-components.md §4,
 * plan §4.3 ADD, Q2, FR-019). Authored test-first against the Q2 pinned
 * values: the selector shows exactly `24 hours` / `7 days` / `28 days` /
 * `3 months` / `More` in that order, defaults to `3 months`, and reports the
 * chosen preset via a callback prop — no data fetching in Pass 1. Until
 * `RangeToolbar.tsx` exists (T031) the suite fails to resolve the import —
 * the right reason (missing module), not a test compile error.
 *
 * Covered contract points:
 * - Default `3 months` (Q2: "default = 3 months"): rendering the toolbar with
 *   no preset prop shows "3 months" in the trigger.
 * - Exactly five options in the spec order (Q2): opening the listbox yields
 *   five `role="option"` items whose visible labels are, in document order,
 *   "24 hours", "7 days", "28 days", "3 months", "More" — no more, no fewer.
 * - Keyboard operability (constitution V / H4): the trigger is a focusable
 *   combobox; ArrowDown opens the listbox and lands focus on the first
 *   option (mirrors the select primitive suite T010).
 * - Callback fires with the preset id (T031: "Selection is a callback prop"):
 *   confirming an option via Enter calls `onSelect` with that option's
 *   machine id (`24h` / `7d` / `28d` / `3m` / `more` — the T-F8 shorthand),
 *   not its display label.
 * - Export/import/share ellipsis menu omitted (ui-components.md §4 documented
 *   adaptation): the template's `DropdownMenu` with `aria-label="More
 *   analytics actions"` is not shipped, so no such control renders.
 */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { RangeToolbar } from './RangeToolbar.js';

/**
 * The five range-selector options in the spec order (plan §2.6 Q2). Each entry
 * pairs the machine preset id (the value passed to `onSelect`, matching the
 * T-F8 shorthand "24h/7d/28d/3m/More") with the display label rendered in the
 * listbox. The order is assertive — Q2 lists the options in exactly this
 * sequence and the toolbar must not reorder them.
 */
const EXPECTED_OPTIONS = [
  { id: '24h', label: '24 hours' },
  { id: '7d', label: '7 days' },
  { id: '28d', label: '28 days' },
  { id: '3m', label: '3 months' },
  { id: 'more', label: 'More' },
] as const;

/** Q2 default preset id ("3 months"). */
const DEFAULT_PRESET_ID = '3m';

/**
 * Renders the toolbar with an `onSelect` spy. Callers may override the default
 * preset to exercise non-default initial state; the uncontrolled default
 * (`3m`) is the contract's resting state and is verified directly.
 */
function renderToolbar(options?: { onSelect?: (presetId: string) => void }) {
  const onSelect = options?.onSelect ?? vi.fn();
  const rendered = render(<RangeToolbar onSelect={onSelect} />);
  return { ...rendered, onSelect };
}

/**
 * Opens the select listbox via keyboard (ArrowDown on the focused trigger) and
 * returns the trigger element. Mirrors the keyboard-first interaction pinned
 * by the select primitive suite (T010) — Radix Select moves focus
 * programmatically, which jsdom honours without real pointer events.
 */
function openViaKeyboard(): HTMLElement {
  const trigger = screen.getByRole('combobox');
  trigger.focus();
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  return trigger;
}

describe('RangeToolbar widget — static render + keyboard contract (T030)', () => {
  beforeAll(() => {
    // Radix Select portals content into the DOM and references pointer/scroll
    // APIs that jsdom does not implement. Polyfill them so keyboard
    // interactions resolve deterministically (no real pointer events are used)
    // — identical to the select primitive suite (T010).
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

  it('renders the trigger showing the default "3 months" (Q2 default)', () => {
    // Q2: "default = 3 months". With no preset prop supplied the toolbar
    // initialises to the `3m` preset and the trigger displays "3 months".
    // The expected label is derived from the pinned default id so the
    // assertion stays coupled to the contract constant, not a magic string.
    renderToolbar();
    const defaultLabel = EXPECTED_OPTIONS.find((o) => o.id === DEFAULT_PRESET_ID)?.label;
    expect(defaultLabel).toBe('3 months');
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent('3 months');
  });

  it('renders exactly the five spec options in order when opened (Q2)', () => {
    // Q2: "Range-selector options = exactly: 24 hours, 7 days, 28 days,
    // 3 months, More". Opening the listbox yields five option elements whose
    // visible labels match the spec sequence — no extra, none missing, no
    // reordering.
    renderToolbar();
    openViaKeyboard();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(EXPECTED_OPTIONS.length);
    EXPECTED_OPTIONS.forEach((expected, index) => {
      expect(options[index]).toHaveTextContent(expected.label);
    });
  });

  it('is keyboard operable: ArrowDown opens the listbox and focuses the default-selected option', async () => {
    // Constitution V / H4: the selector is reachable and operable from the
    // keyboard. ArrowDown on the focused trigger opens the listbox
    // (aria-expanded true) and Radix moves focus to an option. Because the
    // toolbar initialises with the Q2 default (`3m`), Radix focuses the
    // selected "3 months" item on open — not the first option — so the
    // resting value determines the open-focus target. The focus shift is
    // awaited because Radix defers it in a setTimeout.
    renderToolbar();
    const trigger = openViaKeyboard();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute('data-slot', 'select-item');
    });
    expect(document.activeElement).toHaveTextContent('3 months');
  });

  it('fires onSelect with the preset id when an option is chosen via keyboard', async () => {
    // T031: "Selection is a callback prop". Confirming an option calls
    // `onSelect` with that option's machine id (the T-F8 shorthand), not its
    // display label. Radix opens at the default "3 months" (index 3);
    // ArrowUp moves to "28 days" (index 2), then Enter confirms — `onSelect`
    // must receive `"28d"`.
    const onSelect = vi.fn();
    renderToolbar({ onSelect });
    openViaKeyboard();

    // Wait for Radix to land focus on the default-selected "3 months" item,
    // then ArrowUp to "28 days" and confirm with Enter.
    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute('data-slot', 'select-item');
    });
    expect(document.activeElement).toHaveTextContent('3 months');
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: 'ArrowUp',
    });
    await waitFor(() => {
      expect(document.activeElement).toHaveTextContent('28 days');
    });
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith('28d');
  });

  it('omits the export/import/share ellipsis menu (documented adaptation)', () => {
    // ui-components.md §4: "export/import/share ellipsis menu omitted (out of
    // scope)". The template's `DropdownMenu` trigger carries
    // `aria-label="More analytics actions"`; the adaptation ships no such
    // control. Asserting by aria-label keeps the check robust to icon/markup
    // differences while pinning the omission at the accessibility contract.
    renderToolbar();
    expect(screen.queryByLabelText('More analytics actions')).not.toBeInTheDocument();
  });
});
