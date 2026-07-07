// Sidebar shell — composes the Sidebar primitive with ComingSoon and UserSection.
// Provides the collapsible sidebar with Ctrl/Cmd+B toggle (H2), bottom-pinned
// user section (FR-022), and faded "Coming Soon" content area (H7).
import * as React from 'react';
import { cn } from '../lib/cn.js';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar.js';
import { ComingSoon } from './ComingSoon.js';
import { UserSection, type UserShellData } from './UserSection.js';

// Inline panel-left icon for the sidebar header logo area.
function AppIcon(props: React.SVGProps<SVGSVGElement>) {
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

interface SidebarShellProps {
  user: UserShellData;
  className?: string;
}

// Sidebar shell — header (app identity), content (Coming Soon), footer (user section).
function SidebarShell({ user, className }: SidebarShellProps) {
  return (
    <Sidebar className={cn('', className)}>
      {/* Sidebar header — app name / logo. */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="font-semibold text-base">
              <AppIcon />
              <span>Modular House</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Sidebar content — scrollable main area. Phase 1 has no feature pages (H7). */}
      <SidebarContent>
        <ComingSoon />
      </SidebarContent>

      {/* Sidebar footer — bottom-pinned user section (FR-022). */}
      <SidebarFooter>
        <UserSection user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}

export { SidebarShell };
