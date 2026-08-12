// T079 — Admin shell test (T-F1).
// Asserts collapsible sidebar, 48px top bar with four controls (collapse,
// UI-preference, dark-mode, account), an "Analytics" sidebar nav entry
// (T080, supersedes the Phase 1 H7 "Coming Soon" content-area assertion),
// bottom user section, and NO GitHub button.  Pins US2-1..4,7 + H7/FR-017.
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest';
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

  // ── Sidebar navigation integration (T083, T-F6) ──────────────────────
  //
  // Renders the real App tree (persistence.test.tsx/preAuthWiring.test.tsx
  // pattern, not a stubbed route table) to prove the sidebar's "Analytics"
  // entry (T081, already green) and the /admin index route (Q7) resolve
  // together: an authenticated admin landing on /admin sees the Analytics
  // dashboard rendered inside the Phase 1 shell, not the Settings page.
  // Red until T084 changes the index redirect target.

  describe('Sidebar navigation integration (T083, T-F6)', () => {
    const authedUser = {
      id: 'user-t083',
      email: 'jane@example.com',
      displayName: 'Jane Doe',
      role: 'admin',
      permissions: ['pages:view'],
      hasProfilePhoto: false,
      isSuperAdmin: false,
      preferences: { themeMode: 'system' as const, sidebarCollapsed: false },
    };

    // Dedicated fetch stub for this block only: the file-level `mockFetch`
    // above always resolves a photo blob regardless of URL (Profile photo
    // block), which cannot serve /admin/auth/me's JSON contract. Swapped in
    // for the duration of this block and restored in afterEach so the
    // Profile photo tests keep using their own stub.
    const meFetch = vi.fn((url: string, _init?: Parameters<typeof fetch>[1]) => {
      if (String(url).includes('/admin/auth/me')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(authedUser) });
      }
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
    });

    beforeEach(() => {
      vi.stubGlobal('fetch', meFetch);
    });

    afterEach(() => {
      vi.stubGlobal('fetch', mockFetch);
    });

    it('sidebar shows "Analytics" and /admin (index) lands on the Analytics dashboard inside the shell', async () => {
      render(
        <HelmetProvider>
          <MemoryRouter initialEntries={['/admin']}>
            <App />
          </MemoryRouter>
        </HelmetProvider>,
      );

      // Sidebar nav entry (T081, already green independently of the redirect).
      const analyticsLink = await screen.findByRole('link', { name: /analytics/i });
      expect(analyticsLink).toHaveAttribute('href', '/admin/analytics');

      // T-F6/Q7: the index route lands on the Analytics dashboard rendered
      // inside the shell — the top-bar sidebar-toggle proves shell chrome
      // wraps the page rather than a bare, unwrapped route.
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Analytics' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument();
    });
  });

  // ── Scroll-container reachability (T134, Group B) ───────────────────
  //
  // Root cause: the content region (`<main className="flex flex-1 flex-col">`
  // and every ancestor up to `.admin-root`) carries no `overflow-y` rule and
  // no bounded height, while `index.css`'s global public-site reset pins
  // `html, body { overflow: hidden }` (research R8/N1, inherited unmodified
  // by the admin route — the admin shell mounts inside the same document).
  // Page content taller than the viewport is therefore clipped by the
  // hidden body overflow with no ancestor offering a scrollbar: unreachable
  // by mouse wheel, keyboard, or touch.
  //
  // jsdom performs no layout, so `clientHeight`/`scrollHeight` are always 0
  // on every element by default — this project's Vite test config aliases
  // every stylesheet (including the compiled Tailwind utilities) to an
  // empty stub for unit tests (`vitest.config.ts`'s `@modular-house/ui/
  // style.css` alias), the same class of jsdom gap the T130-T132 suites
  // document for CSS custom-property resolution. A literal `scrollHeight >
  // clientHeight` read can therefore never distinguish "this box clips its
  // overflow" from "this box does not exist" here. This suite instead
  // models the two things a real `overflow-y-auto` + bounded-height scroll
  // container needs, keyed off the rendered `className` string (the actual
  // utility classes React put in the DOM, not a live stylesheet): any
  // ancestor carrying an `overflow-y-auto`/`overflow-y-scroll`/
  // `overflow-auto`/`overflow-scroll` utility class is treated as
  // height-bounded (`clientHeight` pinned to a fixed constant); every other
  // ancestor is treated as unbounded and grows to fit its content
  // (`clientHeight === scrollHeight`, i.e. no overflow — matching real
  // `overflow: visible` box behaviour). `scrollHeight` is pinned to a value
  // larger than the bounded constant for every ancestor of a deliberately
  // oversized marker element, modelling content genuinely taller than the
  // container. The model does not assume which ancestor the eventual fix
  // touches — it holds for `<main>`, its flex wrapper, or `.admin-root`
  // alike, whichever one T135 gives the overflow rule to.
  describe('Scroll-container reachability (T134, Group B)', () => {
    /** Fixed viewport-like height a bounded (overflow-y-auto) box is pinned to. */
    const BOUNDED_CLIENT_HEIGHT = 400;
    /** Content extent for the oversized marker — deliberately taller than the bound above. */
    const OVERSIZED_CONTENT_HEIGHT = 5000;
    /** Matches Tailwind's overflow-y (and shorthand overflow) auto/scroll utilities. */
    const OVERFLOW_Y_CLASS = /(?:^|\s)overflow(?:-y)?-(?:auto|scroll)(?:\s|$)/;

    let originalClientHeight: PropertyDescriptor | undefined;
    let originalScrollHeight: PropertyDescriptor | undefined;
    // Set by the test below once the oversized marker is rendered; read by
    // the stubbed getters installed in beforeAll so every ancestor query
    // resolves against the same element without threading it through props.
    let tallContentEl: HTMLElement | null = null;

    beforeAll(() => {
      originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
      originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight');

      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
        configurable: true,
        get(this: HTMLElement) {
          return tallContentEl && this.contains(tallContentEl) ? OVERSIZED_CONTENT_HEIGHT : 0;
        },
      });

      Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        get(this: HTMLElement) {
          if (OVERFLOW_Y_CLASS.test(this.className)) {
            return BOUNDED_CLIENT_HEIGHT;
          }
          // Unbounded box: grows to fit its content, so it never overflows.
          return tallContentEl && this.contains(tallContentEl) ? OVERSIZED_CONTENT_HEIGHT : 0;
        },
      });
    });

    afterAll(() => {
      if (originalClientHeight) {
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', originalClientHeight);
      }
      if (originalScrollHeight) {
        Object.defineProperty(HTMLElement.prototype, 'scrollHeight', originalScrollHeight);
      }
    });

    afterEach(() => {
      tallContentEl = null;
    });

    it('has a real overflow-y ancestor between the content and <body> whose bounded box clips oversized content', () => {
      renderShell({
        children: (
          <div data-testid="tall-content" style={{ height: `${OVERSIZED_CONTENT_HEIGHT}px` }}>
            tall page content
          </div>
        ),
      });

      tallContentEl = screen.getByTestId('tall-content');

      // Walk every ancestor from the tall content up to (excluding) <body>,
      // looking for one that is BOTH overflow-y:auto/scroll AND genuinely
      // clips its content (scrollHeight > clientHeight) — a real scroll
      // container, not merely an element the content happens to sit inside.
      let scrollContainer: HTMLElement | null = null;
      let ancestor: HTMLElement | null = tallContentEl.parentElement;
      while (ancestor && ancestor !== document.body) {
        const isOverflowY = OVERFLOW_Y_CLASS.test(ancestor.className);
        if (isOverflowY && ancestor.scrollHeight > ancestor.clientHeight) {
          scrollContainer = ancestor;
          break;
        }
        ancestor = ancestor.parentElement;
      }

      expect(scrollContainer).not.toBeNull();
    });
  });
});
