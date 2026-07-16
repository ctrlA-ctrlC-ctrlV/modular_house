/**
 * T010 — Select primitive render/keyboard contract tests.
 *
 * Pins the template DOM contract (data-slot attributes, keyboard operability,
 * visible focus) for the ported Radix Select wrapper. Authored test-first
 * against the template source `src/components/ui/select.tsx`: the trigger is a
 * `role="combobox"` button that opens a `role="listbox"` of `role="option"`
 * items; ArrowDown opens and moves highlight, Enter confirms selection, Esc
 * closes. Until `ui/select.tsx` is ported (T011) the suite fails to resolve the
 * import — the right reason (missing module), not a test compile error.
 *
 * Fixture options are value-agnostic (the primitive is used by RangeToolbar;
 * the exact Q2 option set is pinned by the toolbar suite T030). Keyboard-only
 * interaction avoids the jsdom pointer-event unreliability noted for Radix
 * portals (see shell/keyboard.test.tsx): Radix Select moves focus
 * programmatically, which jsdom honours, so ArrowDown/Enter resolve
 * deterministically without real pointer events.
 */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type React from 'react';
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from './select.js';

// Fixed option fixture for the primitive under test. Decoupled from any
// widget's domain values so the primitive contract is verified in isolation.
const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
] as const;

// H4 visible-focus ring token classes preserved verbatim from the template
// trigger (Phase 1 plan §2.8 H4: 3px at ring/50 — specs/012-panel-phase-1/plan.md,
// not this phase's plan). Their presence is the visible-focus contract
// (constitution V); asserted the same way as the shell keyboard suite.
const FOCUS_RING_CLASSES = [
  'focus-visible:ring-3',
  'focus-visible:ring-ring/50',
] as const;

// Renders a controlled Select wired to an onValueChange spy. Defaults to an
// uncontrolled openable select when no value/defaultValue is supplied so the
// keyboard-open path lands on the first option deterministically.
function renderSelect(options?: {
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  size?: 'sm' | 'default';
}) {
  const onValueChange = options?.onValueChange ?? vi.fn();
  const selectProps: React.ComponentProps<typeof Select> = { onValueChange };
  if (options?.defaultValue !== undefined) {
    selectProps.defaultValue = options.defaultValue;
  }
  const rendered = render(
    <Select {...selectProps}>
      <SelectTrigger size={options?.size}>
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          {FRUITS.map((fruit) => (
            <SelectItem key={fruit.value} value={fruit.value}>
              {fruit.label}
            </SelectItem>
          ))}
          <SelectSeparator />
        </SelectGroup>
      </SelectContent>
    </Select>,
  );
  return { ...rendered, onValueChange };
}

// Opens the select via keyboard (ArrowDown on the focused trigger) and returns
// the trigger element. Mirrors the keyboard-first interaction the contract pins.
function openViaKeyboard(): HTMLElement {
  const trigger = screen.getByRole('combobox');
  trigger.focus();
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  return trigger;
}

describe('Select primitive — render + data-slot contract (T010)', () => {
  beforeAll(() => {
    // Radix Select portals content into the DOM and references pointer/scroll
    // APIs that jsdom does not implement. Polyfill them so keyboard
    // interactions resolve deterministically (no real pointer events are used).
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

  // ── Closed-state structure ───────────────────────────────────────────

  // Note: the template places `data-slot="select"` on `SelectPrimitive.Root`,
  // but Radix Select's Root is a non-DOM context provider, so that attribute
  // never enters the DOM. The port preserves the attribute in code verbatim
  // (rule 5); the DOM-realisable data-slots below cover the contract.

  it('renders the trigger as a combobox with data-slot="select-trigger" and data-size="default"', () => {
    renderSelect();
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('data-slot', 'select-trigger');
    expect(trigger).toHaveAttribute('data-size', 'default');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('honours the sm trigger size via data-size="sm"', () => {
    renderSelect({ size: 'sm' });
    expect(screen.getByRole('combobox')).toHaveAttribute('data-size', 'sm');
  });

  it('renders SelectValue with data-slot="select-value" inside the trigger', () => {
    renderSelect();
    expect(
      document.querySelector('[data-slot="select-value"]'),
    ).toBeInTheDocument();
  });

  // ── Visible focus (constitution V / H4) ──────────────────────────────

  it('the trigger is keyboard-focusable and carries the H4 visible-focus ring classes', () => {
    renderSelect();
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
    expect(trigger.tabIndex).toBeGreaterThanOrEqual(0);
    for (const cls of FOCUS_RING_CLASSES) {
      expect(trigger).toHaveClass(cls);
    }
  });

  // ── Keyboard open + open-state structure ─────────────────────────────

  it('opens the listbox via ArrowDown on the trigger', () => {
    renderSelect();
    const trigger = openViaKeyboard();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('renders content/item/group/label/separator data-slots when open', () => {
    renderSelect();
    openViaKeyboard();
    expect(
      document.querySelector('[data-slot="select-content"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="select-group"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="select-label"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="select-separator"]'),
    ).toBeInTheDocument();
    const items = document.querySelectorAll('[data-slot="select-item"]');
    expect(items).toHaveLength(FRUITS.length);
  });

  // ── Arrow navigation + keyboard selection ────────────────────────────

  it('moves highlight with ArrowDown from the first option to the second', async () => {
    renderSelect();
    openViaKeyboard();
    // ArrowDown-open lands focus on the first option (Apple). Radix focuses
    // the item on open; wait for it so the test is robust to deferred focus.
    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute('data-slot', 'select-item');
    });
    expect(document.activeElement).toHaveTextContent('Apple');
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: 'ArrowDown',
    });
    // Radix Select moves highlight inside a setTimeout (content keydown
    // handler), so the focus shift is awaited rather than asserted sync.
    await waitFor(() => {
      expect(document.activeElement).toHaveTextContent('Banana');
    });
  });

  it('selects the highlighted option via Enter and fires onValueChange', async () => {
    const onValueChange = vi.fn();
    renderSelect({ onValueChange });
    openViaKeyboard();
    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute('data-slot', 'select-item');
    });
    // ArrowDown to the second option (Radix defers the focus move in a
    // setTimeout), then confirm with Enter dispatched on the focused item.
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: 'ArrowDown',
    });
    await waitFor(() => {
      expect(document.activeElement).toHaveTextContent('Banana');
    });
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledWith('banana');
    // The trigger now reflects the selected option's text.
    expect(screen.getByRole('combobox')).toHaveTextContent('Banana');
  });

  // ── Esc closes ───────────────────────────────────────────────────────

  it('closes the listbox on Escape', () => {
    renderSelect();
    const trigger = openViaKeyboard();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
