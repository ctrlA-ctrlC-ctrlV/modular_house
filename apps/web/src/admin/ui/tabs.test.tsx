/**
 * T012 — Tabs primitive render/keyboard contract tests.
 *
 * Pins the template DOM contract (data-slot attributes, ARIA roles, arrow-key
 * roving focus, active-tab content switching) for the ported Radix Tabs
 * wrapper. Authored test-first against the template source
 * `src/components/ui/tabs.tsx`: the root carries `data-slot="tabs"` +
 * `data-orientation`; the list is a `role="tablist"`; each trigger is a
 * `role="tab"` with `aria-selected` reflecting the active state; each content
 * panel is a `role="tabpanel"`. ArrowRight/ArrowDown moves focus to the next
 * tab (Radix roving-focus group) and, under automatic activation (the default),
 * switches the active panel. Until `ui/tabs.tsx` is ported (T013) the suite
 * fails to resolve the import — the right reason (missing module).
 *
 * Keyboard-only interaction (no pointer events) keeps the suite deterministic
 * in jsdom; the Radix roving-focus group handles arrow keys via its own
 * `onKeyDown`, which jsdom honours.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs.js';

// Fixed tab fixture — three tabs, each with a distinct content panel. Decoupled
// from the analytics page's domain tab set (Overview/...) so the primitive
// contract is verified in isolation; the analytics tab set is pinned by T034.
const TAB_FIXTURE = [
  { value: 'alpha', label: 'Alpha', content: 'Alpha panel body' },
  { value: 'beta', label: 'Beta', content: 'Beta panel body' },
  { value: 'gamma', label: 'Gamma', content: 'Gamma panel body' },
] as const;

// Renders a Tabs group with the first tab active by default. The `defaultValue`
// makes the active-state assertions deterministic without controlled state.
function renderTabs(defaultValue = 'alpha') {
  return render(
    <Tabs defaultValue={defaultValue}>
      <TabsList>
        {TAB_FIXTURE.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TAB_FIXTURE.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>,
  );
}

// H4 visible-focus ring token classes preserved verbatim from the template
// trigger (Phase 1 plan §2.8 H4: 3px at ring/50 — specs/012-panel-phase-1/plan.md,
// not this phase's plan). Presence = visible-focus contract.
const FOCUS_RING_CLASSES = [
  'focus-visible:ring-[3px]',
  'focus-visible:ring-ring/50',
] as const;

describe('Tabs primitive — render + keyboard contract (T012)', () => {
  beforeAll(() => {
    // Radix roving-focus may reference scroll APIs jsdom does not implement;
    // polyfill so keyboard interactions resolve deterministically.
    if (!Element.prototype.hasPointerCapture) {
      Element.prototype.hasPointerCapture = () => false;
    }
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = () => undefined;
    }
  });

  // ── Closed-state structure + data-slots ──────────────────────────────

  it('renders the root with data-slot="tabs" and data-orientation="horizontal"', () => {
    renderTabs();
    const root = document.querySelector('[data-slot="tabs"]');
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('renders the list with data-slot="tabs-list" and role="tablist"', () => {
    renderTabs();
    const list = screen.getByRole('tablist');
    expect(list).toHaveAttribute('data-slot', 'tabs-list');
    expect(list).toHaveAttribute('data-variant', 'default');
  });

  it('renders each trigger with data-slot="tabs-trigger" and role="tab"', () => {
    renderTabs();
    const triggers = screen.getAllByRole('tab');
    expect(triggers).toHaveLength(TAB_FIXTURE.length);
    for (const trigger of triggers) {
      expect(trigger).toHaveAttribute('data-slot', 'tabs-trigger');
    }
  });

  it('renders the active panel with data-slot="tabs-content" and role="tabpanel"', () => {
    renderTabs();
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('data-slot', 'tabs-content');
    expect(panel).toHaveTextContent('Alpha panel body');
  });

  // ── Active state ─────────────────────────────────────────────────────

  it('marks the default tab as selected (aria-selected) and active (data-state)', () => {
    renderTabs();
    const alpha = screen.getByRole('tab', { name: 'Alpha' });
    expect(alpha).toHaveAttribute('aria-selected', 'true');
    expect(alpha).toHaveAttribute('data-state', 'active');
    const beta = screen.getByRole('tab', { name: 'Beta' });
    expect(beta).toHaveAttribute('aria-selected', 'false');
    expect(beta).toHaveAttribute('data-state', 'inactive');
  });

  // T036c — Radix sets `data-state="active"` on the active trigger, never a
  // bare `data-active` attribute. The active-state styling classes must key
  // off `data-[state=active]:`, not the template's `data-active:` shorthand
  // (which matches attribute *presence*, not the `data-state` value pair);
  // the latter never resolves against this pinned Radix version and leaves
  // the active tab visually indistinguishable from an inactive one.
  it('styles the active trigger with data-[state=active]: classes, not the dead data-active: shorthand', () => {
    renderTabs();
    const alpha = screen.getByRole('tab', { name: 'Alpha' });
    expect(alpha.className).toContain('data-[state=active]:bg-background');
    expect(alpha.className).toContain('data-[state=active]:text-foreground');
    expect(alpha.className).not.toContain('data-active:');
  });

  it('renders only the active panel content (inactive panels unmounted)', () => {
    renderTabs();
    // Only the default (alpha) panel is present.
    expect(screen.getByText('Alpha panel body')).toBeInTheDocument();
    expect(screen.queryByText('Beta panel body')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma panel body')).not.toBeInTheDocument();
  });

  // ── Visible focus (constitution V / H4) ──────────────────────────────

  it('the active trigger is keyboard-focusable and carries the H4 visible-focus ring', () => {
    renderTabs();
    const alpha = screen.getByRole('tab', { name: 'Alpha' });
    // Radix roving-focus uses a roving tabIndex (0 on the current tab, -1 on
    // the rest); the element is still keyboard-reachable because `.focus()`
    // lands on it. Asserting `document.activeElement` proves reachability
    // without coupling to the roving tabIndex timing in jsdom.
    alpha.focus();
    expect(document.activeElement).toBe(alpha);
    for (const cls of FOCUS_RING_CLASSES) {
      expect(alpha).toHaveClass(cls);
    }
  });

  // ── Arrow-key roving focus + content switching ───────────────────────

  it('ArrowRight moves focus to the next tab and switches the active panel', async () => {
    renderTabs();
    const alpha = screen.getByRole('tab', { name: 'Alpha' });
    alpha.focus();
    fireEvent.keyDown(alpha, { key: 'ArrowRight' });
    // Radix roving-focus moves focus to the next tab and automatic activation
    // switches the active panel. Await the focus move + content swap in case
    // the focus shift is deferred (mirrors the select-port waitFor pattern).
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Beta' }));
    });
    // Beta is now active; the alpha panel unmounts and beta panel mounts.
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Beta panel body');
    expect(screen.queryByText('Alpha panel body')).not.toBeInTheDocument();
  });

  it('ArrowLeft moves focus to the previous tab', async () => {
    renderTabs('beta'); // start on the middle tab
    const beta = screen.getByRole('tab', { name: 'Beta' });
    beta.focus();
    fireEvent.keyDown(beta, { key: 'ArrowLeft' });
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Alpha' }));
    });
  });
});
