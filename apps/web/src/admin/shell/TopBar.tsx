// TopBar — 48px admin header bar (H3).
// Contains four controls: sidebar-collapse, UI-preference, dark-mode, account.
// Explicitly NO GitHub button (H7).  FR-023.
import * as React from 'react';
import { cn } from '../lib/cn.js';
import { useSidebar } from '../ui/sidebar.js';
import { useTheme, type ThemeMode } from '../theme/ThemeProvider.js';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.js';
import { getInitials, type UserShellData } from './UserSection.js';

// Inline SVG icons (avoids lucide-react dependency).

// Panel-left icon for the sidebar collapse trigger.
function PanelLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <line x1="9" x2="9" y1="3" y2="21" />
    </svg>
  );
}

// Settings gear icon for the preferences trigger.
function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Sun icon — shown in dark mode (click switches to light).
function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

// Moon icon — shown in light mode (click switches to dark).
function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

// Monitor icon — shown in system mode.
function MonitorIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}


// Cycle through theme modes: light → dark → system.
const THEME_CYCLE: ThemeMode[] = ['light', 'dark', 'system'];

interface TopBarProps {
  user: UserShellData;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
  className?: string;
}

// Top bar — 48px (H3) with sidebar toggle, preferences, theme, and account controls.
// No GitHub button (H7).
function TopBar({ user, onSettingsClick, onLogoutClick, className }: TopBarProps) {
  const { toggleSidebar } = useSidebar();
  const { themeMode, setThemeMode } = useTheme();

  // Cycle to the next theme mode.
  const cycleTheme = React.useCallback(() => {
    const currentIdx = THEME_CYCLE.indexOf(themeMode);
    const nextIdx = (currentIdx + 1) % THEME_CYCLE.length;
    setThemeMode(THEME_CYCLE[nextIdx]);
  }, [themeMode, setThemeMode]);

  return (
    <header
      data-slot="topbar"
      className={cn(
        'flex h-12 shrink-0 items-center border-b bg-background',
        'transition-[width,height] ease-linear',
        className,
      )}
    >
      <div className="flex w-full items-center justify-between px-4">
        {/* Left side: sidebar collapse trigger. */}
        <div className="flex items-center gap-1">
          <button
            data-slot="sidebar-trigger"
            type="button"
            aria-label="Toggle Sidebar"
            className={cn(
              'inline-flex size-8 items-center justify-center rounded-md text-foreground',
              'hover:bg-muted hover:text-foreground',
              'focus-visible:ring-3 focus-visible:ring-ring/50 outline-none',
            )}
            onClick={toggleSidebar}
          >
            <PanelLeftIcon />
            <span className="sr-only">Toggle Sidebar</span>
          </button>
        </div>

        {/* Right side: preferences, theme toggle, account menu. */}
        <div className="flex items-center gap-1">
          {/* UI-preference trigger (theme/Default preset only). */}
          <button
            data-slot="preferences-trigger"
            type="button"
            aria-label="Preferences"
            className={cn(
              'inline-flex size-8 items-center justify-center rounded-md text-foreground',
              'hover:bg-muted hover:text-foreground',
              'focus-visible:ring-3 focus-visible:ring-ring/50 outline-none',
            )}
            onClick={() => {}} // Preferences popover wired in later tasks.
          >
            <SettingsIcon />
            <span className="sr-only">Preferences</span>
          </button>

          {/* Dark-mode toggle — cycles light → dark → system. */}
          <button
            data-slot="theme-toggle"
            type="button"
            aria-label="Toggle Theme"
            className={cn(
              'inline-flex size-8 items-center justify-center rounded-md text-foreground',
              'hover:bg-muted hover:text-foreground',
              'focus-visible:ring-3 focus-visible:ring-ring/50 outline-none',
            )}
            onClick={cycleTheme}
          >
            {themeMode === 'light' && <SunIcon />}
            {themeMode === 'dark' && <MoonIcon />}
            {themeMode === 'system' && <MonitorIcon />}
            <span className="sr-only">Toggle Theme</span>
          </button>

          {/* Account menu — avatar dropdown with Settings and Logout. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-slot="account-trigger"
                type="button"
                aria-label="Account Menu"
                className={cn(
                  'inline-flex size-8 items-center justify-center rounded-md',
                  'hover:bg-muted',
                  'focus-visible:ring-3 focus-visible:ring-ring/50 outline-none',
                )}
              >
                <Avatar size="sm" className="grayscale">
                  {user.hasProfilePhoto && (
                    <AvatarImage src="/admin/settings/photo" alt={user.displayName} />
                  )}
                  <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Account Menu</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={4}
              className="w-48"
            >
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.displayName}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onSettingsClick}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onLogoutClick}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export { TopBar };
export type { TopBarProps };
