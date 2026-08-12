/**
 * T149 — contrast-regression assertion for the UserSection email text
 * (Group E, reviewer-reported). `UserSection.tsx`'s `data-slot="user-email"`
 * span carries the unconditional `text-muted-foreground` utility with no
 * ambient background of its own — it renders inside `SidebarMenuButton`
 * (no unconditional `bg-*` class, only conditional `hover:`/
 * `data-[active=true]:` variants) inside the `Sidebar` root, which is the
 * nearest ancestor that actually sets a background (`bg-sidebar`,
 * `ui/sidebar.tsx`). The real pair is therefore `--muted-foreground` on
 * `--sidebar`, not on `--muted` (T146/T147's own pair) — ui-components.md's
 * T127 record groups this element under the same "shared token" root cause
 * because the *foreground* token is identical, not because the background
 * token is; this suite verifies the specific pair this component actually
 * renders.
 *
 * Technique mirrors tabs.test.tsx's T148 suite: reads tokens.css directly
 * (self-contained per this task's `Files:` line, same rationale as
 * a11y.test.tsx/tabs.test.tsx's own disk reads) and computes a real
 * numeric WCAG ratio from the confirmed-by-classList token pair, rather
 * than a bare class-presence assertion.
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { UserSection } from './UserSection.js';
import { Sidebar } from '../ui/sidebar.js';

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

const testUser = {
  displayName: 'Jane Doe',
  email: 'jane@example.com',
  role: 'admin',
  hasProfilePhoto: false,
};

function renderUserSection() {
  return render(
    <Sidebar>
      <UserSection user={testUser} />
    </Sidebar>,
  );
}

describe('UserSection — email text contrast regression (T149, Group E)', () => {
  it('carries the unconditional text-muted-foreground class with no ambient bg-* on its own container', () => {
    renderUserSection();
    const email = screen.getByText('jane@example.com');
    expect(email).toHaveAttribute('data-slot', 'user-email');
    expect(email.className).toContain('text-muted-foreground');

    // The nearest ancestor that actually declares a background is the
    // Sidebar root itself (bg-sidebar) — SidebarMenuButton has no
    // unconditional bg-* class of its own (only hover:/data-[active=true]:
    // variants), so the email span's effective background is --sidebar.
    const sidebarRoot = document.querySelector('[data-slot="sidebar"]');
    expect(sidebarRoot).not.toBeNull();
    expect(sidebarRoot?.className).toContain('bg-sidebar');
  });

  it('meets 4.5:1 in light mode (muted-foreground on sidebar)', () => {
    const fgY = relativeLuminance(lightTokens['muted-foreground']);
    const bgY = relativeLuminance(lightTokens.sidebar);
    expect(contrastRatio(fgY, bgY)).toBeGreaterThanOrEqual(4.5);
  });

  it('meets 4.5:1 in dark mode (muted-foreground on sidebar)', () => {
    const fgY = relativeLuminance(darkTokens['muted-foreground']);
    const bgY = relativeLuminance(darkTokens.sidebar);
    expect(contrastRatio(fgY, bgY)).toBeGreaterThanOrEqual(4.5);
  });
});
