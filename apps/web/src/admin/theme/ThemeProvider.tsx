// ThemeProvider — keeps theme mode and sidebar state in sync between React
// state, the DOM (data attributes + .dark class), and cookie mirrors.
// The cookie mirror is the pre-paint cache that boot.ts reads before hydration;
// the server-stored UserPreference is the authoritative source of truth (loaded
// via the /me endpoint in later tasks).

import * as React from 'react';

const THEME_COOKIE = 'admin_theme_mode';
const SIDEBAR_COOKIE = 'admin_sidebar_collapsed';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  themeMode: ThemeMode;
  resolvedThemeMode: ResolvedThemeMode;
  sidebarCollapsed: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

/**
 * Read a cookie value by name. Returns null when absent.
 */
function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

/**
 * Write a cookie with a max-age of 30 days.
 */
function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}`;
}

/**
 * Resolve a ThemeMode to the concrete light/dark value by querying the OS
 * preference for "system" mode.
 */
function resolveThemeMode(mode: ThemeMode): ResolvedThemeMode {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'light';
  }
  return mode;
}

/**
 * Apply the resolved theme to the document root: toggle `.dark`, set
 * `data-theme-mode`, and update `colorScheme` so the browser renders form
 * controls and scrollbars correctly.
 */
function applyThemeToDOM(mode: ThemeMode): ResolvedThemeMode {
  const resolved = resolveThemeMode(mode);
  const root = document.documentElement;
  root.setAttribute('data-theme-mode', mode);
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
  return resolved;
}

/**
 * Apply sidebar collapsed state to the document root.
 */
function applySidebarToDOM(collapsed: boolean) {
  document.documentElement.setAttribute(
    'data-sidebar-collapsed',
    collapsed ? 'true' : 'false',
  );
}

/**
 * ThemeProvider — wraps the admin UI tree, providing theme state and mutation
 * functions via React context.  On mount, reads the cookie mirror to initialise
 * state, then keeps the DOM and cookies synchronised on every change.
 */
function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialise from cookie mirror (boot.ts has already applied the DOM state
  // synchronously before this component mounts).
  const [themeMode, setThemeModeState] = React.useState<ThemeMode>(() => {
    const raw = readCookie(THEME_COOKIE);
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
  });

  const [resolvedThemeMode, setResolvedThemeMode] = React.useState<ResolvedThemeMode>(
    () => resolveThemeMode(themeMode),
  );

  const [sidebarCollapsed, setSidebarCollapsedState] = React.useState<boolean>(
    () => readCookie(SIDEBAR_COOKIE) === 'true',
  );

  // Apply theme to DOM + cookie whenever themeMode changes.
  const setThemeMode = React.useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    const resolved = applyThemeToDOM(mode);
    setResolvedThemeMode(resolved);
    writeCookie(THEME_COOKIE, mode);
  }, []);

  // Apply sidebar state to DOM + cookie whenever collapsed changes.
  const setSidebarCollapsed = React.useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    applySidebarToDOM(collapsed);
    writeCookie(SIDEBAR_COOKIE, String(collapsed));
  }, []);

  // Sync DOM with initial state on mount.  In production the boot script has
  // already applied the correct attributes synchronously before hydration, so
  // this is a defensive no-op.  In test environments (jsdom) the boot script
  // does not run, so this effect is what sets the initial DOM state.
  React.useEffect(() => {
    applyThemeToDOM(themeMode);
    applySidebarToDOM(sidebarCollapsed);
  }, []);

  // Subscribe to OS theme changes when mode is "system".
  React.useEffect(() => {
    if (themeMode !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const resolved = applyThemeToDOM('system');
      setResolvedThemeMode(resolved);
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [themeMode]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      resolvedThemeMode,
      sidebarCollapsed,
      setThemeMode,
      setSidebarCollapsed,
    }),
    [themeMode, resolvedThemeMode, sidebarCollapsed, setThemeMode, setSidebarCollapsed],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Access the theme context.  Throws when called outside a ThemeProvider.
 */
function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider.');
  }
  return ctx;
}

export { ThemeProvider, useTheme };
