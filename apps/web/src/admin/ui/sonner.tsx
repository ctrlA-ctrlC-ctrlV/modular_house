// Sonner toast host — themed by admin CSS tokens.
// Reads the resolved theme from the document root (.dark class) so it stays in
// sync with ThemeProvider without depending on next-themes.
// Uses inline SVGs for status icons to avoid adding lucide-react as a dependency.
import * as React from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * Inline icon SVGs matching the template's lucide-react icons.
 * Each renders at 16×16 (size-4) with currentColor for theme-aware tinting.
 */
const SuccessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const LoadingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

/**
 * Detect the current resolved theme by reading the `.dark` class on the
 * document root.  Falls back to `"system"` when neither light nor dark is
 * explicitly set, letting sonner handle OS-level preference via matchMedia.
 */
function getResolvedTheme(): ToasterProps['theme'] {
  if (typeof document === 'undefined') return 'system';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Admin Toaster — mounts the sonner toast host themed by the admin CSS tokens.
 *
 * Styling uses CSS custom properties from tokens.css so toasts automatically
 * adapt to the light/dark theme without additional logic.  The `--normal-bg`,
 * `--normal-text`, `--normal-border`, and `--border-radius` variables are
 * sonner's native theming hooks.
 */
function Toaster(props: ToasterProps) {
  const [theme, setTheme] = React.useState<ToasterProps['theme']>(getResolvedTheme);

  // Observe changes to the `dark` class on <html> so the toast host reacts to
  // ThemeProvider toggles in real time.
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(getResolvedTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <SuccessIcon />,
        info: <InfoIcon />,
        warning: <WarningIcon />,
        error: <ErrorIcon />,
        loading: <LoadingIcon />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
