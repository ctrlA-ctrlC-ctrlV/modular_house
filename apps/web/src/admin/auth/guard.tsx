// AdminGuard — route guard that redirects unauthenticated access to login.
// FR-003: All admin views reachable only after successful authentication.
// Renders children when authenticated, Navigate-to-login when not, and a
// loading indicator while the session is being hydrated.
import * as React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider.js';

interface AdminGuardProps {
  children: React.ReactNode;
}

/** Protects admin routes — redirects to /admin/login when unauthenticated. */
function AdminGuard({ children }: AdminGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show a minimal loading state while the session is being fetched.
  if (isLoading) {
    return (
      <div
        data-testid="guard-loading"
        className="flex min-h-svh items-center justify-center"
      >
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  // Redirect to login if no valid session exists.
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

export { AdminGuard };
export type { AdminGuardProps };
