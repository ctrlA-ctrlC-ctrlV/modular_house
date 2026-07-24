// T100 — Mobile off-canvas drawer test (T-F5).
// Asserts that below the 768px breakpoint the sidebar renders as an off-canvas
// drawer (H5, FR-026), the top-bar controls stay reachable (FR-026), and the
// layout's structural contract prevents horizontal scroll at >=320px (H5).
// Pins US2-9 + H5 + FR-026/FR-027 against the already-built AppShell (T079-T084).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type React from 'react';
import { AppShell } from './AppShell.js';

// Default test props for the shell's user section.
const testUser = {
  displayName: 'Jane Doe',
  email: 'jane@example.com',
  role: 'admin',
  hasProfilePhoto: false,
};

// Mocks the authenticated GET /admin/settings/photo response used by usePhotoUrl.
// jsdom has no createObjectURL.
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

// H5 breakpoint mock: the SidebarProvider queries `(max-width: 767px)` to
// switch to the off-canvas drawer. Stub matchMedia so that query matches
// (mobile) while every other query (e.g. prefers-color-scheme) reports false.
function mockMobileMatchMedia(mobile: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({
      matches: /max-width:\s*767px/.test(query) ? mobile : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  );
}

// Wrapped in MemoryRouter (T081 deviation): the sidebar's "Analytics" nav
// item is a react-router Link, which throws outside a Router context.
function renderShell(overrides?: Partial<React.ComponentProps<typeof AppShell>>) {
  return render(
    <MemoryRouter>
      <AppShell user={testUser} {...overrides} />
    </MemoryRouter>,
  );
}

describe('Admin shell mobile off-canvas drawer (T100, T-F5)', () => {
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
    // H5: narrow viewport (<768px) puts the sidebar into off-canvas drawer mode.
    mockMobileMatchMedia(true);
  });

  afterEach(() => {
    // Restore the global matchMedia mock (setup.ts default = matches:false) so
    // the mobile stub does not leak into other test files via shared globals.
    vi.unstubAllGlobals();
  });

  // ── H5: sidebar becomes an off-canvas drawer below 768px ─────────────

  describe('Off-canvas drawer (H5, FR-026)', () => {
    it('does not render the desktop sidebar in normal flow on mobile', () => {
      renderShell();
      // On mobile the Sidebar takes the Sheet branch; with the drawer closed
      // (openMobile=false) Radix Dialog renders no content, so no in-flow
      // desktop sidebar element exists in the document.
      const desktopSidebar = document.querySelector(
        '[data-slot="sidebar"]:not([data-mobile="true"])',
      );
      expect(desktopSidebar).toBeNull();
    });

    it('renders the sidebar as an off-canvas drawer when the trigger is clicked', async () => {
      renderShell();

      // Drawer is closed initially — no mobile sidebar in the DOM yet.
      expect(document.querySelector('[data-slot="sidebar"][data-mobile="true"]')).toBeNull();

      // Clicking the top-bar sidebar trigger opens the mobile drawer via
      // toggleSidebar -> setOpenMobile(true) (the mobile branch of toggle).
      fireEvent.click(screen.getByRole('button', { name: /toggle sidebar/i }));

      // The Sheet (Radix Dialog) opens and portals the drawer content into the
      // document with data-mobile="true" marking the off-canvas drawer.
      await waitFor(() => {
        const drawer = document.querySelector('[data-slot="sidebar"][data-mobile="true"]');
        expect(drawer).not.toBeNull();
      });
    });

    it('the drawer is a fixed overlay (off-canvas), not an in-flow column', async () => {
      renderShell();
      fireEvent.click(screen.getByRole('button', { name: /toggle sidebar/i }));

      await waitFor(() => {
        expect(document.querySelector('[data-slot="sidebar"][data-mobile="true"]')).not.toBeNull();
      });

      // The SheetContent (Radix Dialog content) is position:fixed so it overlays
      // the viewport instead of contributing to the document's in-flow width.
      const drawer = document.querySelector('[data-slot="sidebar"][data-mobile="true"]');
      expect(drawer).not.toBeNull();
      expect(drawer).toHaveClass('fixed');
    });

    it('closing the drawer removes the off-canvas sidebar from the DOM', async () => {
      renderShell();
      fireEvent.click(screen.getByRole('button', { name: /toggle sidebar/i }));
      await waitFor(() => {
        expect(document.querySelector('[data-slot="sidebar"][data-mobile="true"]')).not.toBeNull();
      });

      // While the dialog is open Radix wraps the rest of the app in
      // aria-hidden, so the top-bar trigger is no longer in the accessibility
      // tree. Query it by data-slot and click to toggle the drawer closed
      // (openMobile -> false), verifying the mobile toggle is symmetric.
      const trigger = document.querySelector('[data-slot="sidebar-trigger"]') as HTMLButtonElement | null;
      expect(trigger).not.toBeNull();
      fireEvent.click(trigger as HTMLButtonElement);

      await waitFor(() => {
        expect(document.querySelector('[data-slot="sidebar"][data-mobile="true"]')).toBeNull();
      });
    });
  });

  // ── FR-026: top-bar controls stay reachable on mobile ────────────────

  describe('Top-bar controls reachable on mobile (FR-026)', () => {
    it('renders all four top-bar controls on mobile', () => {
      renderShell();
      // The TopBar renders regardless of viewport; the four operable controls
      // remain in the tab sequence so the shell is usable on narrow viewports.
      expect(screen.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /preferences/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /account menu/i })).toBeInTheDocument();
    });

    it('each top-bar control is keyboard-focusable on mobile', () => {
      renderShell();
      const controls = [
        screen.getByRole('button', { name: /toggle sidebar/i }),
        screen.getByRole('button', { name: /preferences/i }),
        screen.getByRole('button', { name: /toggle theme/i }),
        screen.getByRole('button', { name: /account menu/i }),
      ];
      for (const control of controls) {
        control.focus();
        expect(document.activeElement).toBe(control);
        expect(control.tabIndex).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ── H5: no horizontal scroll at >=320px ──────────────────────────────

  describe('No horizontal scroll at >=320px (H5)', () => {
    // jsdom does not compute layout, so scrollWidth is not a meaningful signal
    // (it reports 0 regardless of structure). The no-horizontal-scroll contract
    // is therefore pinned by asserting the structural mechanisms that guarantee
    // it: the admin root fills the viewport width (w-full, no fixed wider width)
    // and the mobile sidebar is a fixed overlay (out of normal flow) rather than
    // an in-flow 17rem column that would force horizontal overflow at 320px.

    it('the admin root fills the viewport width with no fixed wider width', () => {
      // Symbolic narrow viewport; jsdom ignores it for layout, but setting it
      // documents the >=320px intent of the assertion.
      window.innerWidth = 320;
      renderShell();

      const adminRoot = document.querySelector('[data-admin]');
      expect(adminRoot).not.toBeNull();
      // w-full = width:100% of the viewport; no fixed rem/px width that could
      // exceed 320px and trigger horizontal scroll.
      expect(adminRoot).toHaveClass('w-full');
    });

    it('the mobile sidebar is a fixed overlay so it does not expand the document width', async () => {
      window.innerWidth = 320;
      renderShell();
      fireEvent.click(screen.getByRole('button', { name: /toggle sidebar/i }));

      await waitFor(() => {
        expect(document.querySelector('[data-slot="sidebar"][data-mobile="true"]')).not.toBeNull();
      });

      const drawer = document.querySelector('[data-slot="sidebar"][data-mobile="true"]');
      expect(drawer).not.toBeNull();
      // Fixed positioning takes the drawer out of normal flow so it cannot grow
      // the document's scroll width (H5: no horizontal scroll at >=320px).
      expect(drawer).toHaveClass('fixed');

      // The desktop sidebar's in-flow 17rem gap column is absent on mobile, so
      // nothing in normal flow carries a fixed width that would overflow 320px.
      const inFlowSidebarGap = document.querySelector('[data-slot="sidebar-gap"]');
      expect(inFlowSidebarGap).toBeNull();
    });
  });
});
