// Admin API client — in-memory access token store with silent refresh on 401.
// E2: Access token stored in memory only (never in localStorage/sessionStorage).
// FR-040: Silent refresh on 401/expiry.
// E3: credentials: 'include' for the httpOnly refresh cookie.
import type { Session, Me } from './types.js';

// In-memory access token.  Never persisted to browser storage.
let accessToken: string | null = null;

/** Retrieve the current in-memory access token (null if unauthenticated). */
function getAccessToken(): string | null {
  return accessToken;
}

/** Set the in-memory access token (called after login/refresh). */
function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Clear the in-memory access token (called on logout/session-expiry). */
function clearAccessToken(): void {
  accessToken = null;
}

/**
 * Base URL for the API. Mirrors the convention in `apps/web/src/lib/apiClient.ts`:
 * the Express backend mounts routes at the root (e.g. `/admin/auth/me`), so no
 * `/api` prefix is applied. Configured via `VITE_API_BASE_URL`.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

interface FetchOptions {
  /** HTTP method. */
  method?: string;
  /** Request headers. */
  headers?: Headers | Record<string, string>;
  /** Request body. */
  body?: string | FormData | null;
  /** When true, skip the Authorization header (e.g. for login/forgot-password). */
  skipAuth?: boolean;
  /** AbortSignal for request cancellation. */
  signal?: AbortSignal | null;
}

/**
 * Perform an authenticated fetch request.
 * Attaches the Bearer token from the in-memory store and sends credentials
 * for the httpOnly refresh cookie.  On 401, attempts a single silent refresh
 * and retries the request once.
 */
async function authenticatedFetch(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);

  // Attach Bearer token unless the request is unauthenticated.
  if (!skipAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // Always include credentials for the httpOnly refresh cookie (E3).
  const response = await fetch(`${API_BASE}${url}`, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });

  // On 401, attempt a single silent refresh and retry (FR-040).
  if (response.status === 401 && !skipAuth) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      // Retry the original request with the new token.
      const retryHeaders = new Headers(fetchOptions.headers);
      retryHeaders.set('Authorization', `Bearer ${accessToken}`);
      return fetch(`${API_BASE}${url}`, {
        ...fetchOptions,
        headers: retryHeaders,
        credentials: 'include',
      });
    }
  }

  return response;
}

/**
 * Attempt to refresh the access token using the httpOnly refresh cookie.
 * Returns true if the refresh succeeded and the new token is stored.
 */
async function attemptRefresh(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/admin/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      clearAccessToken();
      return false;
    }

    const session: Session = await response.json();
    setAccessToken(session.accessToken);
    return true;
  } catch {
    clearAccessToken();
    return false;
  }
}

/**
 * Fetch the current user's session profile from /admin/auth/me.
 * Returns the Me object on success, null on 401 (after refresh attempt).
 */
async function fetchMe(): Promise<Me | null> {
  const response = await authenticatedFetch('/admin/auth/me');

  if (!response.ok) {
    return null;
  }

  return response.json();
}

/**
 * Log the user out: call the logout endpoint and clear the in-memory token.
 * Returns true if the server confirmed logout (204), false otherwise.
 */
async function logout(): Promise<boolean> {
  try {
    const response = await authenticatedFetch('/admin/auth/logout', {
      method: 'POST',
    });
    clearAccessToken();
    return response.ok || response.status === 204;
  } catch {
    clearAccessToken();
    return false;
  }
}

/**
 * Admin API client singleton exposing auth-aware fetch methods.
 * The AuthProvider (T092) consumes this to manage session state.
 */
const apiClient = {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  fetch: authenticatedFetch,
  fetchMe,
  logout,
};

// Hook that returns the apiClient instance.
// Kept as a named function for React rules-of-linting compatibility.
function useApiClient() {
  return apiClient;
}

export {
  apiClient,
  useApiClient,
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  authenticatedFetch,
  fetchMe,
  logout,
};
