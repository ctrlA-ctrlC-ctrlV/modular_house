/**
 * T132 — DropdownMenu primitive portal-background token regression
 * (Group A / FR-022, DoD-6).
 *
 * First dedicated test file for this Phase 1 primitive under Phase 2's
 * portal regression — creating it does not violate ui-components.md §2's
 * "no re-port, no modification" freeze on dropdown-menu.tsx (no source file
 * changes; this is a new, additive test file only).
 *
 * Root cause and assertion shape mirror select.test.tsx's T130 suite and
 * dialog.test.tsx's T131 suite: DropdownMenuContent renders via a bare Radix
 * `Portal` (no `container` prop) to `document.body`, outside `.admin-root` —
 * every color token in tokens.css is (pre-T133) scoped to `.admin-root` /
 * `.dark .admin-root`, so the portaled content never resolves `--popover` /
 * `--popover-foreground`.
 *
 * Why this suite does not use `getComputedStyle` directly: this project's
 * pinned jsdom (25.0.1) implements no CSS custom-property (`var()`)
 * resolution at all — verified directly against this exact jsdom version: a
 * rule `{ background-color: var(--x) }` computes via `getComputedStyle` to
 * the literal, unresolved string `"var(--x)"` regardless of whether `--x` is
 * declared anywhere in scope. A `getComputedStyle` read can therefore never
 * distinguish "the token resolves" from "the token doesn't resolve" here.
 * This suite instead performs the same real-selector cascade a browser
 * would, driven by the actual tokens.css source text (read from disk so it
 * can't silently drift from the shipped fix) — mirroring a11y.test.tsx's H6
 * contrast workaround for the same class of jsdom gap.
 *
 * Opens the menu via the controlled `open` prop rather than a trigger click:
 * AppShell.test.tsx (T044) already documents that "Radix DropdownMenu
 * renders via Portal; the menu content is not testable via click in jsdom
 * (Radix pointer-event handling)" — the controlled-open path sidesteps that
 * documented jsdom limitation without touching the frozen primitive.
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './dropdown-menu.js';

const TOKENS_CSS_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'theme',
  'tokens.css',
);
const tokensCss = readFileSync(TOKENS_CSS_PATH, 'utf8');

/** Extracts a single `--name: value;` declaration from a CSS block body. */
function extractDeclaration(block: string | undefined, name: string): string | undefined {
  if (!block) return undefined;
  const match = block.match(new RegExp(`--${name}:\\s*([^;]+);`));
  return match ? match[1].trim() : undefined;
}

/**
 * Resolves what a real browser's cascade would compute for `--name` on an
 * element portaled to `document.body` (outside `.admin-root`), given the
 * declarations that actually exist in tokens.css today. `:root` always
 * matches `document.documentElement`, an ancestor of every node including
 * portaled ones; a bare `.dark` block matches it once `.dark` is toggled on
 * (T036b). `.admin-root` / `.dark .admin-root` never match a portaled node.
 * Later-declared, equal-specificity selectors win, so `.dark` overrides
 * `:root` when both apply — mirroring the existing light/dark block order.
 */
function resolvePortaledToken(name: string, opts: { dark: boolean }): string | undefined {
  const rootBlock = tokensCss.match(/(?<!\.dark ):root\s*\{([^}]+)\}/);
  const darkBlock = tokensCss.match(/\.dark\s*\{([^}]+)\}/);
  const rootValue = extractDeclaration(rootBlock?.[1], name);
  const darkValue = opts.dark ? extractDeclaration(darkBlock?.[1], name) : undefined;
  return darkValue ?? rootValue;
}

describe('DropdownMenu primitive — portal background-token regression (T132, Group A)', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('portals DropdownMenuContent outside .admin-root, and the dark popover background/foreground tokens resolve for it', () => {
    document.documentElement.classList.add('dark');
    render(
      <div className="admin-root">
        <DropdownMenu open modal={false}>
          <DropdownMenuTrigger>Account menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Profile</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>,
    );
    const content = screen.getByRole('menu');

    // Structural precondition: the portaled content is a real descendant of
    // document.body but NOT of the .admin-root wrapper.
    expect(content.closest('.admin-root')).toBeNull();
    expect(document.body.contains(content)).toBe(true);

    // Background must resolve to a real declared value, not fall back to the
    // browser's transparent default for an unresolved var() (Done when).
    expect(resolvePortaledToken('popover', { dark: true })).toBeDefined();

    // Foreground must resolve to the dark-mode popover-foreground value, not
    // the light-mode one, while .dark is set on document.documentElement.
    const adminLightBlock = tokensCss.match(/(?<!\.dark )\.admin-root\s*\{([^}]+)\}/);
    const adminDarkBlock = tokensCss.match(/\.dark\s+\.admin-root\s*\{([^}]+)\}/);
    const lightPopoverForeground = extractDeclaration(adminLightBlock?.[1], 'popover-foreground');
    const darkPopoverForeground = extractDeclaration(adminDarkBlock?.[1], 'popover-foreground');
    expect(darkPopoverForeground).toBeDefined();

    const resolvedForeground = resolvePortaledToken('popover-foreground', { dark: true });
    expect(resolvedForeground).toBe(darkPopoverForeground);
    expect(resolvedForeground).not.toBe(lightPopoverForeground);
  });
});
