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
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

// ── Contrast-ratio helpers (T148, Group E) ─────────────────────────────
// Duplicated from a11y.test.tsx's own Token contrast (H6) block rather than
// imported from a shared module: each ported-primitive test file in this
// project reads tokens.css from disk independently so it can never silently
// drift from the actual source file (same rationale as that file's own
// header comment), and this task's `Files:` line scopes changes to this
// file alone. Only achromatic `oklch(L 0 0)` tokens are read here, so the
// full OKLab matrix is unused — `l ** 3` is the exact linear-luminance
// value for a zero-chroma color (verified against a11y.test.tsx's full
// matrix implementation, which reduces to this for c=0).
//
// jsdom (pinned 25.0.1, see a11y.test.tsx header) never runs Tailwind's
// build-time class generator, so `getComputedStyle` cannot resolve a
// Tailwind-utility color (`text-muted-foreground`, `bg-muted`) the way the
// T138-T145 suites resolve hand-authored admin.css/style.css rules. This
// suite instead reads the trigger's real rendered `className` to confirm
// which token pair actually applies (assertions below), then computes a
// real numeric WCAG ratio from that pair's tokens.css values — a genuine
// computed-contrast check tied to the live markup, not a bare
// class-substring assertion on its own.
const TOKENS_CSS_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'theme',
  'tokens.css',
);
const tokensCss = readFileSync(TOKENS_CSS_PATH, 'utf8');

interface Oklch {
  l: number;
  c: number;
  h: number;
}

function parseOklch(raw: string): Oklch {
  const [l, c = 0, h = 0] = raw.trim().split(/\s+/).map(Number);
  return { l, c, h };
}

/** Linear relative luminance for an achromatic (c=0) OKLCH color: L^3. */
function relativeLuminance({ l }: Oklch): number {
  return l ** 3;
}

/**
 * sRGB gamma encode/decode (IEC 61966-2-1), applied to the achromatic
 * linear-luminance scalar above. Required only for the alpha-blended
 * light-mode case below: real browsers alpha-composite `color: .../60%`
 * over its backdrop in gamma-encoded (non-linear) sRGB space, not in
 * linear light — verified against ui-components.md's own live-measured
 * hex values (T127 nit-fix: `oklch(0.708 0 0)` measured as `rgb(161,161,
 * 161)` in a real browser, which this round-trip reproduces exactly).
 * Blending the linear luminance values directly, as a naive reading of
 * "alpha compositing" might suggest, gives a materially different (and
 * wrong, by that same live-measurement check) result.
 */
function linearToGamma(x: number): number {
  return x <= 0.0031308 ? x * 12.92 : 1.055 * x ** (1 / 2.4) - 0.055;
}

function gammaToLinear(x: number): number {
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

function contrastRatio(lumA: number, lumB: number): number {
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseThemeTokens(cssBlock: string): Record<string, Oklch> {
  const tokens: Record<string, Oklch> = {};
  const re = /--([\w-]+):\s*oklch\(([^)]+)\)/g;
  for (const match of cssBlock.matchAll(re)) {
    tokens[match[1]] = parseOklch(match[2]);
  }
  return tokens;
}

const lightBlockMatch = tokensCss.match(/(?<!\.dark )\.admin-root\s*\{([^}]+)\}/);
const darkBlockMatch = tokensCss.match(/\.dark\s+\.admin-root\s*\{([^}]+)\}/);
if (!lightBlockMatch || !darkBlockMatch) {
  throw new Error('Could not locate .admin-root / .dark .admin-root blocks in tokens.css');
}
const lightTokens = parseThemeTokens(lightBlockMatch[1]);
const darkTokens = parseThemeTokens(darkBlockMatch[1]);

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

  // ── Contrast regression — inactive trigger label text (T148, Group E) ──
  // Reviewer-reported: an inactive TabsTrigger's label failed WCAG 2.1 AA
  // against the default-variant list's `bg-muted` container (live-measured
  // 2.06:1, dark theme). T147 widened the shared `--muted-foreground` token
  // to close this; this suite pins the fix at the component level so a
  // future className edit that drifts away from the verified pair is caught
  // even if a11y.test.tsx's own token-pair check (T146) stays green.
  describe('Contrast regression — inactive trigger label text (T148, Group E)', () => {
    it('carries the light-mode text-foreground/60 class and the list carries bg-muted', () => {
      renderTabs();
      const beta = screen.getByRole('tab', { name: 'Beta' }); // inactive by default
      const list = screen.getByRole('tablist');
      expect(beta.className).toContain('text-foreground/60');
      expect(list.className).toContain('bg-muted');
    });

    it('meets 4.5:1 in light mode (text-foreground at 60% opacity over the list background)', () => {
      // Light mode carries no `dark:` override, so the unconditional
      // `text-foreground/60` utility (tabs.tsx) is what actually paints —
      // alpha-composited (in gamma space, see the helper's own comment)
      // over the list's `bg-muted` background, not the plain (unblended)
      // foreground/muted pair.
      const fgGamma = linearToGamma(relativeLuminance(lightTokens.foreground));
      const bgGamma = linearToGamma(relativeLuminance(lightTokens.muted));
      const blendedY = gammaToLinear(0.6 * fgGamma + 0.4 * bgGamma);
      const bgY = gammaToLinear(bgGamma);
      expect(contrastRatio(blendedY, bgY)).toBeGreaterThanOrEqual(4.5);
    });

    it('carries the dark-mode dark:text-muted-foreground override class', () => {
      renderTabs();
      const beta = screen.getByRole('tab', { name: 'Beta' });
      expect(beta.className).toContain('dark:text-muted-foreground');
    });

    it('meets 4.5:1 in dark mode (dark:text-muted-foreground, full opacity, over the list background)', () => {
      // Under `.dark`, tabs.tsx's `dark:text-muted-foreground` utility wins
      // over the unconditional `text-foreground/60` for the `color`
      // property (Tailwind `dark:` variant, later in cascade order) — full
      // opacity, no alpha blend needed.
      const fgY = relativeLuminance(darkTokens['muted-foreground']);
      const bgY = relativeLuminance(darkTokens.muted);
      expect(contrastRatio(fgY, bgY)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
