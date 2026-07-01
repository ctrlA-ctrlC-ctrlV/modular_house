// AppShell — top-level admin layout composition.
// Lays out Sidebar + TopBar + content region inside `.admin-root`.
// Wraps everything in ThemeProvider and SidebarProvider.
// FR-020: collapsible sidebar shell.
import * as React from 'react';
import { cn } from '../lib/cn.js';
import { SidebarProvider } from '../ui/sidebar.js';
import { ThemeProvider } from '../theme/ThemeProvider.js';
import { SidebarShell } from './Sidebar.js';
import { TopBar, type TopBarProps } from './TopBar.js';
import type { UserShellData } from './UserSection.js';

interface AppShellProps {
  user: UserShellData;
  onSettingsClick?: TopBarProps['onSettingsClick'];
  onLogoutClick?: TopBarProps['onLogoutClick'];
  children?: React.ReactNode;
  className?: string;
}

// Root admin shell — composes ThemeProvider, SidebarProvider, Sidebar, TopBar,
// and content region inside the `.admin-root` subtree that scopes Tailwind
// and OKLCH tokens (T002/T003).
function AppShell({
  user,
  onSettingsClick,
  onLogoutClick,
  children,
  className,
}: AppShellProps) {
  return (
    <ThemeProvider>
      <SidebarProvider defaultOpen>
        <div
          data-admin
          className={cn(
            'admin-root flex min-h-svh w-full',
            className,
          )}
        >
          {/* Sidebar — collapsible rail/expanded with user section. */}
          <SidebarShell user={user} />

          {/* Main content area — top bar + page content. */}
          <div className="flex flex-1 flex-col">
            <TopBar
              user={user}
              onSettingsClick={onSettingsClick}
              onLogoutClick={onLogoutClick}
            />
            <main className="flex flex-1 flex-col">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export { AppShell };
export type { AppShellProps };
