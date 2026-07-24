// Sidebar shell — composes the Sidebar primitive with the primary nav and
// UserSection. Provides the collapsible sidebar with Ctrl/Cmd+B toggle (H2),
// bottom-pinned user section (FR-022), and the "Analytics" navigation entry
// (FR-017, T081 — supersedes Phase 1's faded "Coming Soon" content area, H7).
import * as React from 'react';
import { Link } from 'react-router-dom';
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

// Inline bar-chart icon for the Analytics nav item (FR-017), matching the
// project's hand-drawn inline-SVG icon convention (no lucide-react dependency).
function AnalyticsIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
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

      {/* Sidebar content — primary nav (FR-017). Analytics is the sole entry
          this phase; future sections keep their own coming-soon placeholders
          (spec.md assumption) once they exist. */}
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/admin/analytics">
                <AnalyticsIcon />
                <span>Analytics</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      {/* Sidebar footer — bottom-pinned user section (FR-022). */}
      <SidebarFooter>
        <UserSection user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}

export { SidebarShell };
