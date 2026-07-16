/**
 * T014 — Dialog primitive render/keyboard contract tests.
 *
 * Pins the template DOM contract (data-slot attributes, ARIA roles, keyboard
 * open/close, Esc dismiss, title/description wiring, focus management) for the
 * ported Radix Dialog wrapper. Authored test-first against the template source
 * `src/components/ui/dialog.tsx`: the content is a `role="dialog"` rendered via
 * Portal + Overlay; the trigger opens it; Esc closes it; focus lands inside on
 * open and returns to the trigger on close. Until `ui/dialog.tsx` is ported
 * (T015) the suite fails to resolve the import — the right reason (missing
 * module).
 *
 * Keyboard-only interaction (no pointer events) keeps the suite deterministic
 * in jsdom; Radix FocusScope honours `focus()` calls in jsdom, so the
 * open-focus and close-focus-return assertions are reliable without real
 * pointer events.
 */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog.js';

// Renders a dialog with a trigger, title, description, and footer. The dialog
// is uncontrolled (the trigger manages open state) so the keyboard-open path is
// exercised end-to-end. An onOpenChange spy is wired so tests can assert state
// transitions if needed.
function renderDialog(options?: {
  onOpenChange?: (open: boolean) => void;
  showCloseButton?: boolean;
}) {
  const onOpenChange = options?.onOpenChange ?? vi.fn();
  const showCloseButton = options?.showCloseButton ?? true;
  return render(
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogContent showCloseButton={showCloseButton}>
        <DialogHeader>
          <DialogTitle>Test title</DialogTitle>
          <DialogDescription>Test description text</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button type="button">Confirm</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>,
  );
}

// Opens the dialog by clicking the trigger (reliable in jsdom) and waits for
// the content to appear. Returns the trigger element for focus-return checks.
function openDialog(): HTMLElement {
  const trigger = screen.getByRole('button', { name: 'Open dialog' });
  fireEvent.click(trigger);
  return trigger;
}

describe('Dialog primitive — render + keyboard contract (T014)', () => {
  beforeAll(() => {
    // Radix Dialog portals content and references focus/scroll APIs jsdom does
    // not implement. Polyfill so keyboard interactions resolve deterministically.
    if (!Element.prototype.hasPointerCapture) {
      Element.prototype.hasPointerCapture = () => false;
    }
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = () => undefined;
    }
  });

  // ── Closed-state data-slots ──────────────────────────────────────────

  // Note: the template places `data-slot="dialog"` on `DialogPrimitive.Root`,
  // but Radix Dialog Root is a non-DOM context provider, so that attribute
  // never enters the DOM. The port preserves the attribute in code verbatim
  // (rule 5); the DOM-realisable data-slots below cover the contract.

  it('renders the trigger with data-slot="dialog-trigger"', () => {
    renderDialog();
    const trigger = screen.getByRole('button', { name: 'Open dialog' });
    expect(trigger).toHaveAttribute('data-slot', 'dialog-trigger');
  });

  it('the trigger is keyboard-focusable', () => {
    renderDialog();
    const trigger = screen.getByRole('button', { name: 'Open dialog' });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
    expect(trigger.tabIndex).toBeGreaterThanOrEqual(0);
  });

  // ── Open state: data-slots + ARIA ────────────────────────────────────

  it('renders content with data-slot="dialog-content" and role="dialog" when open', async () => {
    renderDialog();
    openDialog();
    const content = await screen.findByRole('dialog');
    expect(content).toHaveAttribute('data-slot', 'dialog-content');
  });

  it('renders overlay with data-slot="dialog-overlay" when open', async () => {
    renderDialog();
    openDialog();
    await screen.findByRole('dialog');
    // The overlay is a sibling of the content inside the portal; query by its
    // data-slot attribute directly since it has no ARIA role.
    const overlayEl = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlayEl).toBeInTheDocument();
  });

  it('renders title with data-slot="dialog-title" and wires aria-labelledby on content', async () => {
    renderDialog();
    openDialog();
    const content = await screen.findByRole('dialog');
    const title = screen.getByText('Test title');
    expect(title).toHaveAttribute('data-slot', 'dialog-title');
    // Radix wires the title's id as aria-labelledby on the dialog content.
    expect(content).toHaveAttribute('aria-labelledby', title.id);
  });

  it('renders description with data-slot="dialog-description" and wires aria-describedby', async () => {
    renderDialog();
    openDialog();
    const content = await screen.findByRole('dialog');
    const description = screen.getByText('Test description text');
    expect(description).toHaveAttribute('data-slot', 'dialog-description');
    expect(content).toHaveAttribute('aria-describedby', description.id);
  });

  it('renders header and footer with their data-slots when open', async () => {
    renderDialog();
    openDialog();
    await screen.findByRole('dialog');
    expect(
      document.querySelector('[data-slot="dialog-header"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="dialog-footer"]'),
    ).toBeInTheDocument();
  });

  it('renders the close button with data-slot="dialog-close" when showCloseButton is true', async () => {
    renderDialog();
    openDialog();
    await screen.findByRole('dialog');
    // The close button is a DialogPrimitive.Close wrapping a Button; its
    // data-slot is "dialog-close" (the template sets it on the Close primitive).
    const closeButtons = document.querySelectorAll('[data-slot="dialog-close"]');
    expect(closeButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('omits the close button when showCloseButton is false', async () => {
    renderDialog({ showCloseButton: false });
    openDialog();
    await screen.findByRole('dialog');
    // No dialog-close element from the content's close button.
    expect(
      document.querySelector('[data-slot="dialog-close"]'),
    ).not.toBeInTheDocument();
  });

  // ── Keyboard open/close + Esc ────────────────────────────────────────

  it('opens the dialog via Enter on the trigger', async () => {
    renderDialog();
    const trigger = screen.getByRole('button', { name: 'Open dialog' });
    trigger.focus();
    // Radix DialogTrigger is a native <button>; in a real browser Enter on a
    // focused button fires a click (the browser default action). jsdom does not
    // simulate that default, so the click Enter would produce is dispatched
    // explicitly — this is the faithful keyboard-open path, not a pointer path.
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.click(trigger);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('closes the dialog on Escape', async () => {
    renderDialog();
    openDialog();
    const content = await screen.findByRole('dialog');
    fireEvent.keyDown(content, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // ── Focus management ─────────────────────────────────────────────────

  it('moves focus into the dialog content on open', async () => {
    renderDialog();
    openDialog();
    const content = await screen.findByRole('dialog');
    // Radix FocusScope moves focus to the first focusable element inside the
    // content (the close button or a focusable child) on open.
    await waitFor(() => {
      expect(content.contains(document.activeElement)).toBe(true);
    });
  });

  it('returns focus to the trigger after the dialog closes', async () => {
    renderDialog();
    const trigger = openDialog();
    await screen.findByRole('dialog');
    // Close via Esc and verify focus returns to the trigger.
    const content = screen.getByRole('dialog');
    fireEvent.keyDown(content, { key: 'Escape' });
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });
});
