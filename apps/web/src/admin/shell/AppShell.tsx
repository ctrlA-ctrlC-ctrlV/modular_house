// AppShell — top-level admin layout composition.
// Lays out Sidebar + TopBar + content region inside `.admin-root`.
// Wraps everything in ThemeProvider and SidebarProvider.
// FR-020: collapsible sidebar shell.
// H1/H2/FR-024: theme + sidebar collapse persist to the server (via
// ThemeProvider's onPreferencesChange) and hydrate from /me (via
// initialPreferences); the SidebarProvider is driven as a controlled component
// so the sidebar's open/closed state stays bound to the same source of truth.
import * as React from 'react';
import { cn } from '../lib/cn.js';
import { SidebarProvider } from '../ui/sidebar.js';
import { ThemeProvider, useTheme, type Preferences } from '../theme/ThemeProvider.js';
import { SidebarShell } from './Sidebar.js';
import { TopBar, type TopBarProps } from './TopBar.js';
import type { UserShellData } from './UserSection.js';

interface AppShellProps {
  user: UserShellData;
  /** Authoritative server-stored preferences (from /me); adopted once. */
  preferences?: Preferences | null;
  /** Persist the full preferences object to /admin/settings/preferences. */
  onPreferencesChange?: (preferences: Preferences) => void;
  onSettingsClick?: TopBarProps['onSettingsClick'];
  onLogoutClick?: TopBarProps['onLogoutClick'];
  children?: React.ReactNode;
  className?: string;
}

// Root admin shell — composes ThemeProvider, SidebarProvider, Sidebar, TopBar,
// and content region inside the `.admin-root` subtree that scopes Tailwind
// and OKLCH tokens (T002/T003). The SidebarProvider lives inside an inner
// component so it can read the theme context and bind its `open` state to the
// single authoritative sidebarCollapsed value (H2).
function AppShell({
  user,
  preferences,
  onPreferencesChange,
  onSettingsClick,
  onLogoutClick,
  children,
  className,
}: AppShellProps) {
  return (
    <ThemeProvider
      initialPreferences={preferences}
      onPreferencesChange={onPreferencesChange}
    >
      <ShellLayout
        user={user}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
        className={className}
      >
        {children}
      </ShellLayout>
    </ThemeProvider>
  );
}

interface ShellLayoutProps {
  user: UserShellData;
  onSettingsClick?: TopBarProps['onSettingsClick'];
  onLogoutClick?: TopBarProps['onLogoutClick'];
  className?: string;
  children?: React.ReactNode;
}

// ShellLayout — renders the SidebarProvider as a controlled component whose
// `open` state is the inverse of the theme context's `sidebarCollapsed`. This
// makes ThemeProvider the single source of truth for sidebar collapse, so a
// toggle propagates through the same path that persists to the server + cookie
// mirror (H2) instead of diverging into the SidebarProvider's own cookie.
function ShellLayout({
  user,
  onSettingsClick,
  onLogoutClick,
  className,
  children,
}: ShellLayoutProps) {
  const { sidebarCollapsed, setSidebarCollapsed } = useTheme();

  return (
    <SidebarProvider
      open={!sidebarCollapsed}
      onOpenChange={(open) => setSidebarCollapsed(!open)}
    >
      <div
        data-admin
        className={cn(
          'admin-root flex min-h-svh w-full',
          className,
        )}
      >
        {/* Sidebar — collapsible rail/expanded with user section. */}
        <SidebarShell user={user} />

        {/* Main content area — top bar + page content.
            `h-svh` bounds this column to exactly the viewport height (the
            cross-axis of `.admin-root`'s row layout, so it does not compete
            with this element's own `flex-1`, which governs its width there).
            Without an explicit bound here, the column grows to fit its
            content's natural height instead of respecting the viewport,
            which defeats `<main>`'s own scroll container below: the public
            site's global `html, body { overflow: hidden }` reset
            (`index.css`, R8/N1) then has nowhere to clip, and content past
            the fold becomes unreachable by wheel, keyboard, or touch
            (Group B, FR-022, US3-13). */}
        <div className="flex h-svh flex-1 flex-col">
          <TopBar
            user={user}
            onSettingsClick={onSettingsClick}
            onLogoutClick={onLogoutClick}
          />
          {/* `overflow-y-auto` makes `<main>` the scroll container for all
              admin page content, independent of the public-site reset above.
              Per the CSS Flexbox automatic-minimum-size algorithm, a flex
              item whose relevant-axis overflow is not `visible` has its
              automatic minimum size floored at 0 rather than its content's
              natural size — so this `flex-1` column item shrinks to the
              exact remaining height inside the now-bounded wrapper above
              (viewport height minus the 48px/`h-12` top bar) and scrolls its
              own overflow, rather than forcing the wrapper to grow past it. */}
          <main className="flex flex-1 flex-col overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export { AppShell };
export type { AppShellProps };
