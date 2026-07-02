// Shared types for the admin auth layer.
// Matches the OpenAPI Session and Me schemas from contracts/admin-auth.openapi.yaml.

/** Preferences returned by /admin/settings/preferences and included in Me. */
export interface Preferences {
  themeMode: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
}

/** User profile returned by /admin/auth/me. */
export interface Me {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  permissions: string[];
  hasProfilePhoto: boolean;
  isSuperAdmin: boolean;
  preferences: Preferences;
}

/** Session response returned by verify-2fa and refresh. */
export interface Session {
  accessToken: string;
  expiresIn: number;
  user: Me;
}

/** Login step-1 response: OTP issued, no session yet. */
export interface TwoFactorChallenge {
  challengeId: string;
  message: string;
}

/** Neutral acknowledgement (forgot-password, reset-password, logout). */
export interface NeutralAck {
  message: string;
}
