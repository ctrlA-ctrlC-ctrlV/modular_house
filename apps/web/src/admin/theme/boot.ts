// Boot script module — reads theme + sidebar state from cookies and applies them
// to the document root before React hydrates (H1: no wrong-theme frame).
// Exported as a function so tests can invoke it directly; the index.html inline
// script duplicates the same logic as an IIFE for synchronous pre-paint execution.

const THEME_COOKIE = 'admin_theme_mode';
const SIDEBAR_COOKIE = 'admin_sidebar_collapsed';

type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Read a cookie value by name from document.cookie.
 * Returns null when the cookie is not present or the document is unavailable.
 */
function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

/**
 * Resolve a ThemeMode to the concrete "light" | "dark" value.
 * For "system", queries the OS preference via matchMedia.
 */
function resolveThemeMode(mode: ThemeMode): 'light' | 'dark' {
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
 * Apply the persisted theme and sidebar state to the document root.
 * Safe to call in any environment (server, test, browser); reads cookies and
 * sets attributes on document.documentElement.
 */
export function applyBootTheme(): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Theme mode — read from cookie, default to "system" (H1).
  const rawMode = readCookie(THEME_COOKIE);
  const isValidMode = rawMode === 'light' || rawMode === 'dark' || rawMode === 'system';
  const mode: ThemeMode = isValidMode ? rawMode : 'system';
  const resolved = resolveThemeMode(mode);

  root.setAttribute('data-theme-mode', mode);
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;

  // Sidebar collapsed state — read from cookie, default to expanded (H2).
  const rawSidebar = readCookie(SIDEBAR_COOKIE);
  root.setAttribute('data-sidebar-collapsed', rawSidebar === 'true' ? 'true' : 'false');
}
