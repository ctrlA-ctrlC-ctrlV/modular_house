// usePhotoUrl — fetches the authenticated user's profile-photo bytes and
// exposes them as an object URL for <img>/AvatarImage consumption.
// G6: GET /admin/settings/photo requires a Bearer token, so a bare
// `<img src="/admin/settings/photo">` cannot render it (the browser sends no
// Authorization header on a plain image request); every consumer must route
// through the authenticated apiClient instead. Session 30 review found the
// sidebar (UserSection) and top-bar account avatar both using a bare <img>,
// so uploaded photos always 401'd and silently fell back to initials.
import * as React from 'react';
import { apiClient } from './apiClient.js';

/**
 * Returns an object URL for the current user's profile photo, or null while
 * unset/loading/failed (callers should render the initials fallback in that
 * case). Re-fetches only when `hasProfilePhoto` changes.
 */
function usePhotoUrl(hasProfilePhoto: boolean): string | null {
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!hasProfilePhoto) {
      setPhotoUrl(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    async function loadPhoto() {
      const response = await apiClient.fetch('/admin/settings/photo');
      if (!response.ok) {
        return;
      }
      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);
      if (!cancelled) {
        setPhotoUrl(objectUrl);
      }
    }

    loadPhoto();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [hasProfilePhoto]);

  return photoUrl;
}

export { usePhotoUrl };
