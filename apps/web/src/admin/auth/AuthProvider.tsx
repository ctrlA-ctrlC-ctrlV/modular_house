// AuthProvider — React context for admin authentication state.
// Hydrates session via /admin/auth/me, exposes user/role/permissions + logout.
// FR-036: role + effective permissions available to downstream consumers.
// FR-040: silent refresh on session expiry.
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from './apiClient.js';
import type { Me } from './types.js';

/** Shape of the auth context consumed by useAuth(). */
interface AuthContextValue {
  /** The authenticated user's profile, or null if unauthenticated. */
  user: Me | null;
  /** True while the initial session hydration is in progress. */
  isLoading: boolean;
  /** True when a valid session exists. */
  isAuthenticated: boolean;
  /** Log the user out, clear token, and navigate to /admin/login. */
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

/** Hook that returns the current auth state. Throws outside an AuthProvider. */
function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

/** Provides authentication state to the admin shell and pages. */
function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = React.useState<Me | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const navigate = useNavigate();

  // Hydrate the session on mount.
  React.useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const me = await apiClient.fetchMe();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  // Logout: clear token, call server, navigate to login.
  const handleLogout = React.useCallback(async () => {
    try {
      await apiClient.logout();
    } finally {
      apiClient.clearAccessToken();
      setUser(null);
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  const value: AuthContextValue = React.useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      logout: handleLogout,
    }),
    [user, isLoading, handleLogout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthProvider, useAuth, AuthContext };
export type { AuthContextValue, AuthProviderProps };
