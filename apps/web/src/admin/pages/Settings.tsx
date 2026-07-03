// Settings page — own-account password change and profile-photo management
// (US4, FR-032/FR-033/FR-034/FR-035). Reads the authenticated user from the
// AuthProvider context and wires password change plus photo upload/remove
// directly to the admin apiClient. Name and email are read-only in Phase 1.
// The super_admin account renders fully read-only (FR-035): edit controls
// are hidden and changes are documented as database-only.
import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '../lib/cn.js';
import { useAuth } from '../auth/AuthProvider.js';
import { apiClient } from '../auth/apiClient.js';
import { Button } from '../ui/button.js';
import { Input } from '../ui/input.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card.js';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar.js';
import { Field, FieldError, FieldLabel } from '../ui/form.js';
import { getInitials } from '../shell/UserSection.js';

// Client-side mirror of G1 (accepted MIME types) and G2 (max upload size) for
// immediate feedback; the server remains authoritative for both checks.
const PHOTO_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

// Zod schema mirroring the server-side password policy (D1, D2, D4) for UX;
// D7 keeps the server authoritative regardless of this client-side check.
const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: 'Current password is required.' }),
    newPassword: z
      .string()
      .min(12, { message: 'Password must be at least 12 characters.' })
      .max(128, { message: 'Password must be at most 128 characters.' })
      .regex(/[a-z]/, {
        message: 'Password must contain at least one lowercase letter.',
      })
      .regex(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter.',
      })
      .regex(/\d/, { message: 'Password must contain at least one digit.' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Please confirm your new password.' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from your current password.',
    path: ['newPassword'],
  });

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

interface SettingsProps {
  className?: string;
}

// Parses a JSON error body defensively; falls back to a generic message when
// the response has no body or is not JSON (e.g. a network-level failure).
async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

// Own-account settings page: password change, profile photo, read-only
// identity. Must be rendered inside an authenticated AuthProvider/AdminGuard.
function Settings({ className }: SettingsProps) {
  const { user } = useAuth();

  // Profile-photo state. `hasPhoto` mirrors the authoritative Me.hasProfilePhoto
  // flag and is updated directly by upload/remove so the UI does not depend on
  // AuthProvider exposing a session refresh. `photoUrl` is an object URL for
  // the currently displayed image (fetched bytes or a freshly uploaded file).
  const [hasPhoto, setHasPhoto] = React.useState(user?.hasProfilePhoto ?? false);
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [photoError, setPhotoError] = React.useState<string | undefined>(undefined);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [isRemovingPhoto, setIsRemovingPhoto] = React.useState(false);

  const [passwordError, setPasswordError] = React.useState<string | undefined>(undefined);
  const [passwordSuccess, setPasswordSuccess] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  const passwordForm = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  // Load the profile-photo bytes once, driven by the authoritative flag from
  // the session payload (G6). Subsequent uploads/removals update `photoUrl`
  // directly, so this effect does not need to re-run for local mutations.
  React.useEffect(() => {
    if (!user?.hasProfilePhoto) {
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    async function loadInitialPhoto() {
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

    loadInitialPhoto();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [user?.hasProfilePhoto]);

  // Submits the password-change form (FR-032). On success, other active
  // sessions are revoked server-side (E6) and the acting session stays valid.
  const handlePasswordSubmit = passwordForm.handleSubmit(async (data) => {
    setPasswordError(undefined);
    setPasswordSuccess(false);
    setIsChangingPassword(true);
    try {
      const response = await apiClient.fetch('/admin/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        setPasswordError(await readErrorMessage(response, 'Unable to change password. Please try again.'));
        return;
      }
      setPasswordSuccess(true);
      passwordForm.reset();
    } catch {
      setPasswordError('Unable to reach the server. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  });

  // Validates and uploads a new profile photo (FR-033, G1-G3). The freshly
  // selected file is previewed directly rather than re-fetched from the
  // server, since the client already holds the exact bytes just uploaded.
  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setPhotoError(undefined);

    if (!PHOTO_ACCEPTED_TYPES.includes(file.type)) {
      setPhotoError('Unsupported file type. Please upload a PNG, JPEG, or WebP image.');
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setPhotoError('Image is too large. The maximum size is 5 MB.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const response = await apiClient.fetch('/admin/settings/photo', {
        method: 'PUT',
        body: formData,
      });
      if (!response.ok) {
        setPhotoError(await readErrorMessage(response, 'Unable to upload photo. Please try again.'));
        return;
      }
      setPhotoUrl((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous);
        }
        return URL.createObjectURL(file);
      });
      setHasPhoto(true);
    } catch {
      setPhotoError('Unable to reach the server. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Removes the current profile photo, falling back to the initials avatar
  // (G4) in both the settings page and (on next session hydration) the
  // sidebar user section.
  const handleRemovePhoto = async () => {
    setPhotoError(undefined);
    setIsRemovingPhoto(true);
    try {
      const response = await apiClient.fetch('/admin/settings/photo', { method: 'DELETE' });
      if (!response.ok) {
        setPhotoError(await readErrorMessage(response, 'Unable to remove photo. Please try again.'));
        return;
      }
      setPhotoUrl((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous);
        }
        return null;
      });
      setHasPhoto(false);
    } catch {
      setPhotoError('Unable to reach the server. Please try again.');
    } finally {
      setIsRemovingPhoto(false);
    }
  };

  // Rendered only behind AdminGuard, so `user` is expected to be populated;
  // guard against the theoretical null case for type safety.
  if (!user) {
    return null;
  }

  const initials = getInitials(user.displayName ?? user.email);

  return (
    <div data-testid="settings-page" className={cn('mx-auto max-w-2xl space-y-6 p-6', className)}>
      <div className="space-y-1">
        <h1 className="font-medium tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your password and profile photo.
        </p>
      </div>

      {/* Read-only personal info (FR-034). */}
      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
          <CardDescription>Name and email are read-only in Phase 1.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-sm text-muted-foreground">Name</span>
            <p data-testid="settings-name">{user.displayName ?? '—'}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Email</span>
            <p data-testid="settings-email">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      {user.isSuperAdmin ? (
        // FR-035: the super_admin account is fully read-only in the panel.
        <Card>
          <CardHeader>
            <CardTitle>Account access</CardTitle>
          </CardHeader>
          <CardContent>
            <p role="note" data-slot="settings-superadmin-notice" className="text-sm text-muted-foreground">
              The super_admin account is read-only in this panel. Password and profile-photo
              changes for this account are made only via direct database access.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Profile photo (FR-033, G1-G6). */}
          <Card>
            <CardHeader>
              <CardTitle>Profile photo</CardTitle>
              <CardDescription>PNG, JPEG, or WebP, up to 5 MB.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar size="lg">
                {photoUrl && <AvatarImage src={photoUrl} alt={user.displayName ?? user.email} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col gap-2">
                <Field>
                  <FieldLabel htmlFor="settings-photo-input">Profile photo</FieldLabel>
                  <Input
                    id="settings-photo-input"
                    type="file"
                    accept={PHOTO_ACCEPTED_TYPES.join(',')}
                    onChange={handlePhotoChange}
                    disabled={isUploadingPhoto}
                  />
                </Field>
                {photoError && (
                  <div role="alert" data-slot="settings-photo-error" className="text-sm text-destructive">
                    {photoError}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemovePhoto}
                  disabled={!hasPhoto || isUploadingPhoto || isRemovingPhoto}
                  className="w-fit"
                >
                  {isRemovingPhoto ? 'Removing...' : 'Remove photo'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Password change (FR-032, D1-D5). */}
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>
                Requires your current password. Your other active sessions are signed out.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordError && (
                <div
                  role="alert"
                  data-slot="settings-password-error"
                  className="mb-4 text-sm text-destructive"
                >
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div
                  role="status"
                  data-slot="settings-password-success"
                  className="mb-4 text-sm text-green-700 dark:text-green-400"
                >
                  Password updated. Your other sessions have been signed out.
                </div>
              )}
              <form noValidate onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <Controller
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="settings-current-password">Current password</FieldLabel>
                      <Input
                        {...field}
                        id="settings-current-password"
                        type="password"
                        autoComplete="current-password"
                        aria-invalid={fieldState.invalid}
                        disabled={isChangingPassword}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="settings-new-password">New password</FieldLabel>
                      <Input
                        {...field}
                        id="settings-new-password"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                        disabled={isChangingPassword}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="settings-confirm-password">Confirm new password</FieldLabel>
                      <Input
                        {...field}
                        id="settings-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                        disabled={isChangingPassword}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Button type="submit" className="w-fit" disabled={isChangingPassword}>
                  {isChangingPassword ? 'Updating...' : 'Update password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export { Settings };
export type { SettingsProps };
