// UserSection — bottom-pinned avatar + display name + email.
// Renders inside SidebarFooter; shows initials fallback when no photo (G4).
// Design decision: the account menu (Settings, Logout) lives in TopBar.tsx
// so it remains accessible when the sidebar is collapsed to icon rail.
// UserSection is display-only; TopBar owns the account DropdownMenu (FR-025).
import { cn } from '../lib/cn.js';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar.js';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '../ui/sidebar.js';

/** User data shape for the shell. AuthProvider (T092) will supply this via context. */
interface UserShellData {
  displayName: string;
  email: string;
  role: string;
  hasProfilePhoto: boolean;
}

// Derive initials from a display name (first letter of first and last word).
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

interface UserSectionProps {
  user: UserShellData;
  className?: string;
}

// Sidebar footer user section: avatar, name, email. Clicking opens the
// account menu (handled by the TopBar account trigger for now).
function UserSection({ user, className }: UserSectionProps) {
  return (
    <div data-testid="user-section" className={cn('', className)}>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-12"
          >
            <Avatar size="sm" className="grayscale">
              {user.hasProfilePhoto && (
                <AvatarImage src="/admin/settings/photo" alt={user.displayName} />
              )}
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span
                data-slot="user-display-name"
                className="truncate font-medium"
              >
                {user.displayName}
              </span>
              <span
                data-slot="user-email"
                className="truncate text-xs text-muted-foreground"
              >
                {user.email}
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}

export { UserSection, getInitials };
export type { UserShellData };
