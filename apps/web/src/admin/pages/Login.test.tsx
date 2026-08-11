/**
 * T143 — contrast-regression assertion for the Login page heading/subtitle
 * (Group D). Guards the concrete instance that motivated Group D's fix
 * (ui-components.md's own documented "login heading/subtitle illegible in
 * dark mode" finding): a future edit that reintroduces an unlayered
 * brand-color rule in style.css, or removes admin.css's base-layer default
 * (T139/T141), would regress the "Login" heading and its subtitle back
 * toward the public site's brand palette instead of the admin's own
 * dark-mode-aware tokens.
 *
 * Technique: mirrors a11y.test.tsx's T138/T140 real-stylesheet-injection
 * approach — reading style.css/admin.css directly from disk and injecting
 * their actual rule text into jsdom's live cascade, since Vitest's default
 * `css: false` behaviour otherwise replaces CSS imports with an empty
 * string during tests. admin.css's rules are unwrapped from their `@layer
 * base { ... }` block before injection: this project's pinned jsdom
 * (25.0.1) cannot parse the CSS Cascade Layers `@layer` at-rule at all,
 * silently discarding the entire stylesheet on encountering one (verified
 * directly while building this suite's a11y.test.tsx sibling).
 *
 * The "Login" `<h1>` carries no Tailwind text-color utility class, so its
 * expected `--foreground` resolution is proven directly via
 * `getComputedStyle`, exactly as a11y.test.tsx's T140 suite does for a bare
 * `<h1>`. The subtitle `<p>`, in contrast, already carries an explicit
 * `text-muted-foreground` Tailwind utility class — proving that utility
 * class actually wins the real cascade would require injecting Tailwind's
 * own JIT-compiled utility CSS, which the unwrapped-injection technique
 * above cannot faithfully reproduce (unwrapping the `@layer` structure to
 * work around jsdom's parser gap also erases the real
 * `utilities`-layer-beats-`base`-layer priority a live browser applies,
 * per the `@layer theme, base, utilities;` pre-declaration added in
 * admin.css by T142 — a synthetic jsdom re-creation of that priority would
 * be misleading, not merely incomplete). The subtitle assertion below
 * therefore checks the two things this suite CAN prove honestly: the
 * intended Tailwind mechanism is still wired (the class name is present),
 * and the old unlayered brand-color leak no longer reaches it (T139).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Login } from './Login.js';

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

describe('Login page — heading/subtitle contrast regression (T143, Group D)', () => {
  let injectedStyleCss: HTMLStyleElement | null = null;
  let injectedAdminCss: HTMLStyleElement | null = null;

  beforeEach(() => {
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
  });

  function renderLogin() {
    return render(
      <MemoryRouter>
        <div data-admin className="admin-root">
          <Login onSubmit={() => {}} />
        </div>
      </MemoryRouter>,
    );
  }

  it('resolves --foreground for the "Login" heading, not --brand-title, when .dark is set', () => {
    const { getByRole } = renderLogin();
    const heading = getByRole('heading', { level: 1, name: 'Login' });

    expect(getComputedStyle(heading).color).toBe('var(--foreground)');
  });

  it('keeps the subtitle wired to --muted-foreground via Tailwind and clear of the style.css brand leak', () => {
    const { getByText } = renderLogin();
    const subtitle = getByText(/welcome back/i);

    // Pins the intended styling mechanism (Tailwind's `text-muted-foreground`
    // utility, which compiles to `color: var(--muted-foreground)`
    // deterministically — see file header for why this suite does not also
    // attempt to prove that resolution via a live cascade read).
    expect(subtitle.className).toMatch(/text-muted-foreground/);
    // Proves the concrete regression T139 fixes: this element no longer
    // resolves style.css's unlayered brand-color leak.
    expect(getComputedStyle(subtitle).color).not.toBe('var(--brand-slate)');
  });
});
