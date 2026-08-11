/**
 * T145 — contrast-regression assertion for the Sidebar "Analytics" nav-link
 * (Group D). Closes the reviewer-reported "sidebar active-nav-link text"
 * finding (`#b55329` on `#171717`, 3.61:1) as the same Group D root cause
 * T138/T139/T141 fix: `#b55329` is exactly `--brand-link`. `Sidebar.tsx`'s
 * `<Link to="/admin/analytics">` renders a bare `<a>` with no explicit color
 * class (`SidebarMenuButton`'s own className list carries only conditional
 * `hover:`/`data-[active=true]:` color variants — no unconditional default —
 * and `data-active`/`isActive` is not wired on this link today), so it
 * inherited style.css's unlayered brand-link color the same way the bare
 * `<h1>`/`<p>` tags did. This is NOT a `--sidebar-accent-foreground` /
 * `--sidebar-accent` OKLCH gap, and no change to `sidebar.tsx` (a frozen
 * ui-components.md §2 primitive) was needed — fixing the token-scope leak at
 * its source (T139/T141) is the fix.
 *
 * Technique: mirrors a11y.test.tsx's T138/T140 real-stylesheet-injection
 * approach (reading style.css/admin.css directly from disk and injecting
 * their actual rule text into jsdom's live cascade, unwrapping admin.css's
 * `@layer base { ... }` block since this project's pinned jsdom (25.0.1)
 * cannot parse `@layer` at all) — see that file's own header comments for
 * the full rationale. Renders the real `AppShell` (not a synthetic bare
 * `<a>`) so the assertion exercises the actual DOM position and ancestry
 * the link renders into, mirroring a11y.test.tsx's own `renderShell`
 * fixture/mock setup. Unlike Login.tsx/Settings.tsx's subtitle `<p>`
 * elements (T143/T144), this `<a>` carries no competing Tailwind
 * text-color utility class of its own (confirmed above), so its
 * `--primary` resolution is asserted positively via `getComputedStyle`,
 * exactly as a11y.test.tsx's T140 suite does for a bare `<h1>`/`<p>`/`<a>`.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { AppShell } from './AppShell.js';

const STYLE_CSS_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'styles',
  'style.css',
);
const ADMIN_CSS_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'theme',
  'admin.css',
);
const styleCss = readFileSync(STYLE_CSS_PATH, 'utf8');
const adminCss = readFileSync(ADMIN_CSS_PATH, 'utf8');

/** Extracts the inner rule text of a `@layer <layerName> { ... }` block, unwrapped (see file header). */
function stripLayerWrapper(css: string, layerName: string): string {
  const marker = `@layer ${layerName}`;
  const markerIndex = css.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Could not locate "@layer ${layerName}" in the provided CSS source`);
  }
  const openBraceIndex = css.indexOf('{', markerIndex);
  if (openBraceIndex === -1) {
    throw new Error(`Malformed "@layer ${layerName}" block: no opening brace found`);
  }
  let depth = 1;
  let i = openBraceIndex + 1;
  for (; i < css.length && depth > 0; i += 1) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') depth -= 1;
  }
  if (depth !== 0) {
    throw new Error(`Malformed "@layer ${layerName}" block: unbalanced braces`);
  }
  return css.slice(openBraceIndex + 1, i - 1);
}

// Default authenticated user (mirrors a11y.test.tsx's own Shell fixture).
const testUser = {
  displayName: 'Jane Doe',
  email: 'jane@example.com',
  role: 'admin',
  hasProfilePhoto: false,
};

// TopBar's UserSection issues a GET for the profile photo on mount
// (usePhotoUrl) — stubbed to a clean 404 so the Shell renders without an
// unhandled rejection, mirroring a11y.test.tsx's own mockFetch fixture.
const mockFetch = vi.fn(() =>
  Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) }),
);

describe('Sidebar — "Analytics" nav-link contrast regression (T145, Group D)', () => {
  let injectedStyleCss: HTMLStyleElement | null = null;
  let injectedAdminCss: HTMLStyleElement | null = null;

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    document.documentElement.classList.add('dark');

    injectedStyleCss = document.createElement('style');
    injectedStyleCss.textContent = styleCss;
    document.head.appendChild(injectedStyleCss);

    injectedAdminCss = document.createElement('style');
    injectedAdminCss.textContent = stripLayerWrapper(adminCss, 'base');
    document.head.appendChild(injectedAdminCss);
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
    injectedStyleCss?.remove();
    injectedAdminCss?.remove();
    injectedStyleCss = null;
    injectedAdminCss = null;
    vi.unstubAllGlobals();
  });

  it('resolves --primary for the "Analytics" nav-link, not --brand-link/#b55329, when .dark is set', () => {
    render(
      <MemoryRouter>
        <AppShell user={testUser} />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: /analytics/i });

    expect(getComputedStyle(link).color).toBe('var(--primary)');
  });
});
