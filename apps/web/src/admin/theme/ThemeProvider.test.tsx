// T077 — ThemeProvider + boot-script tests.
// Pins H1 (no wrong-theme frame on first paint) and light|dark|system resolution.
// Uses jsdom environment; boot script runs synchronously before React hydration.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';

/**
 * Helpers to set/read theme cookies in the jsdom document.cookie jar.
 * Cookie name matches the boot script's expected key.
 */
const THEME_COOKIE = 'admin_theme_mode';
const SIDEBAR_COOKIE = 'admin_sidebar_collapsed';

function setThemeCookie(value: string) {
  document.cookie = `${THEME_COOKIE}=${encodeURIComponent(value)}; path=/`;
}

function setSidebarCookie(value: string) {
  document.cookie = `${SIDEBAR_COOKIE}=${encodeURIComponent(value)}; path=/`;
}

function clearCookies() {
  document.cookie = `${THEME_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${SIDEBAR_COOKIE}=; path=/; max-age=0`;
}

/**
 * Reset the document root to a clean state before each test.
 * The boot script operates on document.documentElement (<html>), so we must
 * ensure it starts without leftover classes or attributes from prior tests.
 */
function resetDocumentRoot() {
  const root = document.documentElement;
  root.classList.remove('dark');
  root.removeAttribute('data-theme-mode');
  root.removeAttribute('data-sidebar-collapsed');
  root.style.removeProperty('color-scheme');
}

describe('Boot script (boot.ts)', () => {
  beforeEach(() => {
    clearCookies();
    resetDocumentRoot();
  });

  it('applies light theme when cookie is "light"', async () => {
    setThemeCookie('light');
    const { applyBootTheme } = await import('../theme/boot.js');
    applyBootTheme();

    const root = document.documentElement;
    expect(root.getAttribute('data-theme-mode')).toBe('light');
    expect(root.classList.contains('dark')).toBe(false);
    expect(root.style.colorScheme).toBe('light');
  });

  it('applies dark theme when cookie is "dark"', async () => {
    setThemeCookie('dark');
    const { applyBootTheme } = await import('../theme/boot.js');
    applyBootTheme();

    const root = document.documentElement;
    expect(root.getAttribute('data-theme-mode')).toBe('dark');
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.style.colorScheme).toBe('dark');
  });

  it('resolves "system" mode using matchMedia', async () => {
    setThemeCookie('system');
    // Simulate OS dark-mode preference.
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { applyBootTheme } = await import('../theme/boot.js');
    applyBootTheme();

    const root = document.documentElement;
    expect(root.getAttribute('data-theme-mode')).toBe('system');
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.style.colorScheme).toBe('dark');

    vi.unstubAllGlobals();
  });

  it('resolves "system" mode to light when OS prefers light', async () => {
    setThemeCookie('system');
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { applyBootTheme } = await import('../theme/boot.js');
    applyBootTheme();

    const root = document.documentElement;
    expect(root.getAttribute('data-theme-mode')).toBe('system');
    expect(root.classList.contains('dark')).toBe(false);
    expect(root.style.colorScheme).toBe('light');

    vi.unstubAllGlobals();
  });

  it('defaults to "system" when no cookie is present', async () => {
    const { applyBootTheme } = await import('../theme/boot.js');
    applyBootTheme();

    const root = document.documentElement;
    expect(root.getAttribute('data-theme-mode')).toBe('system');
  });

  it('applies sidebar collapsed state from cookie', async () => {
    setSidebarCookie('true');
    const { applyBootTheme } = await import('../theme/boot.js');
    applyBootTheme();

    const root = document.documentElement;
    expect(root.getAttribute('data-sidebar-collapsed')).toBe('true');
  });

  it('defaults sidebar to expanded when no cookie is present', async () => {
    const { applyBootTheme } = await import('../theme/boot.js');
    applyBootTheme();

    const root = document.documentElement;
    expect(root.getAttribute('data-sidebar-collapsed')).toBe('false');
  });
});

describe('ThemeProvider', () => {
  beforeEach(() => {
    clearCookies();
    resetDocumentRoot();
  });

  it('reads initial theme from the cookie mirror and applies it to the DOM', async () => {
    setThemeCookie('dark');
    const { ThemeProvider } = await import('../theme/ThemeProvider.js');

    await act(async () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Content</div>
        </ThemeProvider>,
      );
    });

    const root = document.documentElement;
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.getAttribute('data-theme-mode')).toBe('dark');
  });

  it('toggling theme updates the DOM and cookie', async () => {
    setThemeCookie('light');
    const { ThemeProvider, useTheme } = await import('../theme/ThemeProvider.js');

    // Expose a test hook to toggle theme from inside the tree.
    function ThemeToggle() {
      const { setThemeMode } = useTheme();
      return (
        <button onClick={() => setThemeMode('dark')} data-testid="toggle">
          Toggle
        </button>
      );
    }

    await act(async () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );
    });

    const root = document.documentElement;
    expect(root.classList.contains('dark')).toBe(false);

    await act(async () => {
      const btn = document.querySelector('[data-testid="toggle"]');
      btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(root.classList.contains('dark')).toBe(true);
    expect(root.getAttribute('data-theme-mode')).toBe('dark');
    // Cookie should be updated.
    expect(document.cookie).toContain(`${THEME_COOKIE}=dark`);
  });

  it('sidebar collapsed state is persisted via cookie', async () => {
    setSidebarCookie('false');
    const { ThemeProvider, useTheme } = await import('../theme/ThemeProvider.js');

    function SidebarToggle() {
      const { setSidebarCollapsed } = useTheme();
      return (
        <button onClick={() => setSidebarCollapsed(true)} data-testid="collapse">
          Collapse
        </button>
      );
    }

    await act(async () => {
      render(
        <ThemeProvider>
          <SidebarToggle />
        </ThemeProvider>,
      );
    });

    await act(async () => {
      const btn = document.querySelector('[data-testid="collapse"]');
      btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(document.documentElement.getAttribute('data-sidebar-collapsed')).toBe('true');
    expect(document.cookie).toContain(`${SIDEBAR_COOKIE}=true`);
  });

  it('useTheme throws outside ThemeProvider', async () => {
    // Silence the expected React error boundary console noise.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { useTheme } = await import('../theme/ThemeProvider.js');

    // Force a call outside a render tree — must throw.
    function TestComponent() {
      useTheme();
      return null;
    }

    expect(() => {
      render(<TestComponent />);
    }).toThrow();

    spy.mockRestore();
  });
});
