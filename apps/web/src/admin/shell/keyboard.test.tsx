// T099 — Keyboard operability test (T-F3).
// Asserts every shell control is keyboard-focusable with the H4 visible-focus
// ring (H6/FR-030) and that the Ctrl/Cmd+B shortcut toggles the sidebar (H2).
// Pins US2-6 + H6 + FR-030 against the already-built AppShell (T079-T084).
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import type React from 'react';
import { AppShell } from './AppShell.js';

// Default test props for the shell's user section. AuthProvider is not in the
// shell's render path here; the shell accepts user data as props (T084).
const testUser = {
  displayName: 'Jane Doe',
  email: 'jane@example.com',
  role: 'admin',
  hasProfilePhoto: false,
};

// Mocks the authenticated GET /admin/settings/photo response used by
// usePhotoUrl (Session 30 corrective fix). jsdom has no createObjectURL.
const mockFetch = vi.fn(
  (_url: string, _init?: Parameters<typeof fetch>[1]) =>
    Promise.resolve({
      ok: true,
      status: 200,
      blob: () => Promise.resolve(new Blob(['fake-image-bytes'], { type: 'image/png' })),
    }),
);
vi.stubGlobal('fetch', mockFetch);
vi.stubGlobal(
  'URL',
  Object.assign(URL, {
    createObjectURL: vi.fn(() => 'blob:mock-preview-url'),
    revokeObjectURL: vi.fn(),
  }),
);

function renderShell(overrides?: Partial<React.ComponentProps<typeof AppShell>>) {
  return render(<AppShell user={testUser} {...overrides} />);
}

// H4 focus-ring token classes (plan §2.8 H4: 3px at ring/50). Every operable
// shell control must carry both so keyboard users see where focus landed.
const FOCUS_RING_CLASSES = ['focus-visible:ring-3', 'focus-visible:ring-ring/50'] as const;

function assertVisibleFocus(el: HTMLElement) {
  for (const cls of FOCUS_RING_CLASSES) {
    expect(el).toHaveClass(cls);
  }
}

// Resolves every always-visible operable control in the shell. The account
// menu items (Settings/Logout) live inside a Radix Portal that only mounts on
// open and is not reliably interactive in jsdom (pointer-event handling); they
// are structurally pinned by T065 and reached via the account trigger, which
// is covered here.
function getShellControls() {
  const userSection = screen.getByTestId('user-section');
  return {
    identity: screen.getByRole('button', { name: /modular house/i }),
    userSection: within(userSection).getByRole('button'),
    sidebarTrigger: screen.getByRole('button', { name: /toggle sidebar/i }),
    preferences: screen.getByRole('button', { name: /preferences/i }),
    themeToggle: screen.getByRole('button', { name: /toggle theme/i }),
    account: screen.getByRole('button', { name: /account menu/i }),
  } as const;
}

describe('Admin shell keyboard operability (T099, T-F3)', () => {
  beforeEach(() => {
    // Reset document root between tests so ThemeProvider boot state does not leak.
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme-mode');
    document.documentElement.removeAttribute('data-sidebar-collapsed');
    document.documentElement.style.removeProperty('color-scheme');
    document.cookie = 'admin_theme_mode=; path=/; max-age=0';
    document.cookie = 'admin_sidebar_collapsed=; path=/; max-age=0';
    document.cookie = 'sidebar_state=; path=/; max-age=0';
    mockFetch.mockClear();
  });

  // ── H6/FR-030: every control is keyboard-operable with visible focus ──

  describe('Tab operability + visible focus (H6, FR-030)', () => {
    // jsdom does not perform real Tab focus traversal (no layout-driven focus
    // sequencing), so each control is focused directly to prove it is
    // keyboard-reachable — a native button that accepts focus — and that
    // document.activeElement lands on it. The visible-focus contract (H6) is
    // pinned by asserting the H4 focus-visible ring classes are present on
    // each control.
    it('focuses every shell control and shows the H4 focus-visible ring on each', () => {
      renderShell();
      const controls = getShellControls();

      for (const control of Object.values(controls)) {
        control.focus();
        expect(document.activeElement).toBe(control);
        // Never removed from the tab order (tabIndex >= 0, not -1).
        expect(control.tabIndex).toBeGreaterThanOrEqual(0);
        assertVisibleFocus(control);
      }
    });

    it('reaches the four top-bar controls in sequence (primary operable surface)', () => {
      renderShell();
      const topbarControls = [
        screen.getByRole('button', { name: /toggle sidebar/i }),
        screen.getByRole('button', { name: /preferences/i }),
        screen.getByRole('button', { name: /toggle theme/i }),
        screen.getByRole('button', { name: /account menu/i }),
      ];

      for (const control of topbarControls) {
        control.focus();
        expect(document.activeElement).toBe(control);
      }
    });
  });

  // ── H2: Ctrl/Cmd+B toggles the sidebar ───────────────────────────────

  describe('Ctrl/Cmd+B sidebar toggle (H2)', () => {
    it('collapses the sidebar on Ctrl+B', () => {
      renderShell();
      // Initially expanded: ThemeProvider's mount effect sets
      // data-sidebar-collapsed="false" (sidebarCollapsed defaults to false).
      expect(document.documentElement.getAttribute('data-sidebar-collapsed')).toBe('false');

      fireEvent.keyDown(window, { key: 'b', ctrlKey: true });

      // toggleSidebar -> setSidebarCollapsed(true) -> DOM attribute "true".
      expect(document.documentElement.getAttribute('data-sidebar-collapsed')).toBe('true');
    });

    it('collapses the sidebar on Cmd+B (macOS variant)', () => {
      renderShell();
      fireEvent.keyDown(window, { key: 'b', metaKey: true });
      expect(document.documentElement.getAttribute('data-sidebar-collapsed')).toBe('true');
    });

    it('toggles back to expanded on a second Ctrl+B', () => {
      renderShell();
      fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
      expect(document.documentElement.getAttribute('data-sidebar-collapsed')).toBe('true');

      fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
      expect(document.documentElement.getAttribute('data-sidebar-collapsed')).toBe('false');
    });

    it('ignores B without a modifier key (only Ctrl/Cmd+B per H2)', () => {
      renderShell();
      fireEvent.keyDown(window, { key: 'b' });
      expect(document.documentElement.getAttribute('data-sidebar-collapsed')).toBe('false');
    });

    it('toggles the sidebar via Ctrl+B independently of the trigger button', () => {
      renderShell();
      // The trigger click and the keyboard shortcut share toggleSidebar;
      // verify the keyboard path alone drives the controlled collapse state.
      const sidebar = document.querySelector('[data-slot="sidebar"]');
      expect(sidebar).not.toBeNull();

      fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
      expect(document.documentElement.getAttribute('data-sidebar-collapsed')).toBe('true');
    });
  });
});
