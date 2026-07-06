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

// Per-user UI preferences persisted server-side (H1/H2) and mirrored to
// cookies for pre-paint. The server-stored value is authoritative; the cookie
// mirror is only the pre-paint cache the boot script reads before hydration.
interface Preferences {
  themeMode: ThemeMode;
  sidebarCollapsed: boolean;
}

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
 *
 * Server round-trip (H1/H2, FR-024): when `initialPreferences` arrives from
 * /me it is adopted once as the authoritative value (overriding the cookie
 * mirror) and the cookie is refreshed for the next pre-paint.  Every local
 * toggle calls `onPreferencesChange` with the full preferences object so the
 * parent can PUT it to /admin/settings/preferences; the local state and cookie
 * mirror update optimistically so the UI never waits on the network.
 */
interface ThemeProviderProps {
  children: React.ReactNode;
  /** Authoritative server-stored preferences (from /me). Adopted once on
   * arrival; null/undefined leaves the cookie mirror as the source. */
  initialPreferences?: Preferences | null;
  /** Called on every local toggle with the full preferences object so the
   * parent can persist it to /admin/settings/preferences (FR-024). */
  onPreferencesChange?: (preferences: Preferences) => void;
}

function ThemeProvider({
  children,
  initialPreferences,
  onPreferencesChange,
}: ThemeProviderProps) {
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

  // Ref holding the latest full preferences so each toggle callback can notify
  // the parent with both fields without a stale-closure read of the other.
  const preferencesRef = React.useRef<Preferences>({ themeMode, sidebarCollapsed });
  preferencesRef.current = { themeMode, sidebarCollapsed };

  // Guards against re-adopting the server value after the user starts toggling
  // locally; /me is fetched once per mount, so a single adoption is correct and
  // prevents a stale server snapshot from clobbering local edits.
  const serverHydratedRef = React.useRef(false);

  const notify = React.useCallback(
    (next: Preferences) => {
      onPreferencesChange?.(next);
    },
    [onPreferencesChange],
  );

  // Apply theme to DOM + cookie + notify parent of the full preferences.
  const setThemeMode = React.useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    const resolved = applyThemeToDOM(mode);
    setResolvedThemeMode(resolved);
    writeCookie(THEME_COOKIE, mode);
    const next: Preferences = {
      themeMode: mode,
      sidebarCollapsed: preferencesRef.current.sidebarCollapsed,
    };
    preferencesRef.current = next;
    notify(next);
  }, [notify]);

  // Apply sidebar state to DOM + cookie + notify parent of the full preferences.
  const setSidebarCollapsed = React.useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    applySidebarToDOM(collapsed);
    writeCookie(SIDEBAR_COOKIE, String(collapsed));
    const next: Preferences = {
      themeMode: preferencesRef.current.themeMode,
      sidebarCollapsed: collapsed,
    };
    preferencesRef.current = next;
    notify(next);
  }, [notify]);

  // Sync DOM with initial state on mount.  In production the boot script has
  // already applied the correct attributes synchronously before hydration, so
  // this is a defensive no-op.  In test environments (jsdom) the boot script
  // does not run, so this effect is what sets the initial DOM state.
  React.useEffect(() => {
    applyThemeToDOM(themeMode);
    applySidebarToDOM(sidebarCollapsed);
  }, []);

  // Adopt the server-stored preference once /me hydrates (H1/H2: server is
  // authoritative; the cookie mirror is only the pre-paint cache). Runs once
  // per mount so local toggles are never clobbered by a stale server snapshot.
  React.useEffect(() => {
    if (!initialPreferences || serverHydratedRef.current) return;
    serverHydratedRef.current = true;
    const { themeMode: serverMode, sidebarCollapsed: serverCollapsed } = initialPreferences;
    setThemeModeState(serverMode);
    const resolved = applyThemeToDOM(serverMode);
    setResolvedThemeMode(resolved);
    writeCookie(THEME_COOKIE, serverMode);
    setSidebarCollapsedState(serverCollapsed);
    applySidebarToDOM(serverCollapsed);
    writeCookie(SIDEBAR_COOKIE, String(serverCollapsed));
    preferencesRef.current = { themeMode: serverMode, sidebarCollapsed: serverCollapsed };
    // No notify: the server is the source of this value, so there is nothing
    // to PUT back. The cookie mirror is refreshed for the next pre-paint.
  }, [initialPreferences]);

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
export type { Preferences };
