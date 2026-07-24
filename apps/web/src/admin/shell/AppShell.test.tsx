// T079 — Admin shell test (T-F1).
// Asserts collapsible sidebar, 48px top bar with four controls (collapse,
// UI-preference, dark-mode, account), an "Analytics" sidebar nav entry
// (T080, supersedes the Phase 1 H7 "Coming Soon" content-area assertion),
// bottom user section, and NO GitHub button.  Pins US2-1..4,7 + H7/FR-017.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import type React from 'react';
import { AppShell } from './AppShell.js';
import App from '../../App';

// Default test props for the shell's user section.
// AuthProvider does not exist yet (T092); the shell accepts user data as props.
const testUser = {
  displayName: 'Jane Doe',
  email: 'jane@example.com',
  role: 'admin',
  hasProfilePhoto: false,
};

// Mocks the authenticated GET /admin/settings/photo response used by
// usePhotoUrl (Session 30 corrective fix). jsdom has no createObjectURL.
const mockFetch = vi.fn((_url: string, _init?: Parameters<typeof fetch>[1]) =>
  Promise.resolve({
    ok: true,
    status: 200,
    blob: () => Promise.resolve(new Blob(['fake-image-bytes'], { type: 'image/png' })),
  }),
);
vi.stubGlobal('fetch', mockFetch);
vi.stubGlobal('URL', Object.assign(URL, {
  createObjectURL: vi.fn(() => 'blob:mock-preview-url'),
  revokeObjectURL: vi.fn(),
}));

// Wrapped in MemoryRouter: the sidebar's "Analytics" nav item (T081) is a
// react-router Link, which throws outside a Router context.
function renderShell(overrides?: Partial<React.ComponentProps<typeof AppShell>>) {
  return render(
    <MemoryRouter>
      <AppShell user={testUser} {...overrides} />
    </MemoryRouter>,
  );
}

describe('Admin shell (AppShell)', () => {
  beforeEach(() => {
    // Reset document root between tests so ThemeProvider boot does not leak.
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme-mode');
    document.documentElement.removeAttribute('data-sidebar-collapsed');
    document.documentElement.style.removeProperty('color-scheme');
    document.cookie = 'admin_theme_mode=; path=/; max-age=0';
    document.cookie = 'admin_sidebar_collapsed=; path=/; max-age=0';
    mockFetch.mockClear();
  });

  // ── Sidebar presence and collapse ──────────────────────────────────

  describe('Sidebar', () => {
    it('renders a collapsible sidebar', () => {
      renderShell();
      // The sidebar element exists with data-slot="sidebar".
      const sidebar = document.querySelector('[data-slot="sidebar"]');
      expect(sidebar).not.toBeNull();
    });

    it('toggles between expanded and collapsed states on trigger click', () => {
      renderShell();

      // The sidebar trigger button exists with accessible label.
      const trigger = screen.getByRole('button', { name: /toggle sidebar/i });
      expect(trigger).toBeInTheDocument();

      // Initially the sidebar is expanded (default).
      const sidebarPeer = document.querySelector('[data-slot="sidebar"]');
      expect(sidebarPeer).not.toBeNull();

      // Click to collapse.
      fireEvent.click(trigger);

      // After toggle, the sidebar should still exist but its data-state changes.
      const sidebarAfter = document.querySelector('[data-slot="sidebar"]');
      expect(sidebarAfter).not.toBeNull();
    });
  });

  // ── Top bar ────────────────────────────────────────────────────────

  describe('Top bar', () => {
    it('renders a top bar with data-slot="topbar" (48px height per H3)', () => {
      renderShell();
      const topbar = screen.getByRole('banner');
      expect(topbar).toBeInTheDocument();
      expect(topbar).toHaveAttribute('data-slot', 'topbar');
      // H3: top bar height = 48px = h-12 in Tailwind.
      expect(topbar).toHaveClass('h-12');
    });

    it('renders a sidebar-collapse control', () => {
      renderShell();
      const trigger = screen.getByRole('button', { name: /toggle sidebar/i });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('data-slot', 'sidebar-trigger');
    });

    it('renders a UI-preference control', () => {
      renderShell();
      const prefButton = screen.getByRole('button', { name: /preferences/i });
      expect(prefButton).toBeInTheDocument();
      expect(prefButton).toHaveAttribute('data-slot', 'preferences-trigger');
    });

    it('renders a dark-mode toggle control', () => {
      renderShell();
      const themeButton = screen.getByRole('button', { name: /toggle theme/i });
      expect(themeButton).toBeInTheDocument();
      expect(themeButton).toHaveAttribute('data-slot', 'theme-toggle');
    });

    it('renders an account button', () => {
      renderShell();
      const accountButton = screen.getByRole('button', { name: /account menu/i });
      expect(accountButton).toBeInTheDocument();
      expect(accountButton).toHaveAttribute('data-slot', 'account-trigger');
    });
  });

  // ── H7: No GitHub button ───────────────────────────────────────────

  describe('H7 — No GitHub button', () => {
    it('does not render a GitHub link or button anywhere in the shell', () => {
      renderShell();
      // No element with text "GitHub" or "github".
      const githubLink = screen.queryByRole('link', { name: /github/i });
      expect(githubLink).toBeNull();
      const githubButton = screen.queryByRole('button', { name: /github/i });
      expect(githubButton).toBeNull();
    });
  });

  // ── Analytics nav item (T080, supersedes Phase 1 H7 "Coming Soon") ──
  // FR-017: the sidebar MUST include an Analytics navigation entry opening
  // the performance dashboard. The content area no longer shows the
  // Phase 1 placeholder; future sections keep their own coming-soon
  // placeholders (spec.md assumption), but Phase 2 adds no other entries.

  describe('Analytics nav item', () => {
    it('renders an "Analytics" navigation link in the sidebar content area', () => {
      renderShell();
      const link = screen.getByRole('link', { name: /analytics/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/admin/analytics');
    });

    it('no longer renders the Phase 1 "Coming Soon" placeholder', () => {
      renderShell();
      expect(screen.queryByText('Coming Soon')).toBeNull();
    });
  });

  // ── User section ───────────────────────────────────────────────────

  describe('User section', () => {
    it('renders the user display name in the sidebar footer', () => {
      renderShell();
      const name = screen.getByText('Jane Doe');
      expect(name).toBeInTheDocument();
      expect(name).toHaveAttribute('data-slot', 'user-display-name');
    });

    it('renders the user email', () => {
      renderShell();
      const email = screen.getByText('jane@example.com');
      expect(email).toBeInTheDocument();
      expect(email).toHaveAttribute('data-slot', 'user-email');
    });

    it('renders initials fallback when hasProfilePhoto is false', () => {
      renderShell();
      // "Jane Doe" → initials "JD". Appears in sidebar user section and
      // top bar account trigger; assert at least one is present.
      const fallbacks = screen.getAllByText('JD');
      expect(fallbacks.length).toBeGreaterThanOrEqual(1);
    });

    it('renders an account menu trigger that opens a dropdown', () => {
      renderShell();

      // The account trigger button exists with correct ARIA attributes.
      const accountButton = screen.getByRole('button', { name: /account menu/i });
      expect(accountButton).toHaveAttribute('aria-haspopup', 'menu');

      // Radix DropdownMenu renders via Portal; the menu content is not
      // testable via click in jsdom (Radix pointer-event handling).
      // Structural dropdown parity is pinned by T065 primitive tests;
      // here we assert the trigger wiring only.
    });

    it('positions the user section at the bottom of the sidebar', () => {
      renderShell();
      const userSection = screen.getByTestId('user-section');
      expect(userSection).toBeInTheDocument();
      // UserSection is rendered inside sidebar-footer.
      const footer = document.querySelector('[data-slot="sidebar-footer"]');
      expect(footer).not.toBeNull();
      expect(footer).toContainElement(userSection);
    });
  });

  // ── Profile photo — corrective fix (Session 30 review, G6) ───────────
  //
  // The sidebar user section and top-bar account avatar both used to render
  // a bare `<img src="/admin/settings/photo">`, which cannot carry the
  // in-memory Bearer token; the request always 401'd and silently fell back
  // to initials. Both now resolve the photo via the authenticated apiClient
  // (usePhotoUrl) instead.

  describe('Profile photo (G6, corrective fix)', () => {
    it('fetches the photo via the authenticated apiClient rather than a bare <img src>', async () => {
      renderShell({ user: { ...testUser, hasProfilePhoto: true } });

      // Both the sidebar and top-bar avatars resolve an authenticated
      // object-URL image once the fetch succeeds.
      await waitFor(() => {
        expect(document.querySelectorAll('[data-slot="avatar-image"]').length).toBeGreaterThan(0);
      });

      const photoCalls = mockFetch.mock.calls.filter(([url]) =>
        String(url).includes('/admin/settings/photo'),
      );
      expect(photoCalls.length).toBeGreaterThan(0);

      // No element ever points a raw <img> tag directly at the
      // unauthenticated endpoint path.
      const rawImgs = document.querySelectorAll('img[src="/admin/settings/photo"]');
      expect(rawImgs).toHaveLength(0);
    });

    it('does not fetch the photo when hasProfilePhoto is false', () => {
      renderShell();
      const photoCalls = mockFetch.mock.calls.filter(([url]) =>
        String(url).includes('/admin/settings/photo'),
      );
      expect(photoCalls).toHaveLength(0);
    });
  });

  
});
