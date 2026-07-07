// Reset password page — consume a reset link and set a new password (FR-016, FR-017).
// Renders new-password + confirm-password fields.  Reads the token from the URL
// query string (e.g. /admin/reset-password?token=abc123).  On submit, posts to
// /admin/auth/reset-password with { token, newPassword, confirmPassword }.
// Client-side validation mirrors the server-side password policy (D1, D2, D4)
// for UX; the server is authoritative (D7).
// Layout mirrors the Login page's two-column "login v1" split-screen.
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/cn.js';
import { Button } from '../ui/button.js';
import { Input } from '../ui/input.js';
import {
  Field,
  FieldError,
  FieldLabel,
} from '../ui/form.js';

// Zod schema — mirrors server-side password policy for client UX (D7: server authoritative).
const resetPasswordSchema = z
  .object({
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
    confirmPassword: z.string().min(1, { message: 'Please confirm your password.' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordProps {
  /** Callback invoked with validated form data + token on submit. */
  onSubmit?: (data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
  /** Error message displayed above the form (e.g. from API 400/410). */
  error?: string;
  /** Whether the form is currently submitting. */
  isSubmitting?: boolean;
  /** Whether the password was successfully reset. */
  isSubmitted?: boolean;
  className?: string;
}

// Inline SVG for the branded key icon (avoids lucide-react dependency).
function KeyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" />
      <path d="m21 2-9.6 9.6" />
      <circle cx="7.5" cy="15.5" r="5.5" />
    </svg>
  );
}

// Reset password — two-column "login v1" layout matching the Login page.
// Left panel: branded key icon + title. Right panel: new-password form.
function ResetPassword({
  onSubmit,
  error,
  isSubmitting = false,
  isSubmitted = false,
  className,
}: ResetPasswordProps) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit?.({
      token,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    });
  });

  return (
    <div
      data-testid="reset-password-page"
      className={cn('flex min-h-svh', className)}
    >
      {/* Branded left panel — hidden below lg, visible on lg+. */}
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <KeyIcon className="mx-auto size-12 text-primary-foreground" />
            <div className="space-y-2">
              <h1 className="font-light text-5xl text-primary-foreground">
                New password
              </h1>
              <p className="text-primary-foreground/80 text-xl">
                Choose a strong password
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form panel — full width on mobile, 2/3 on lg+. */}
      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          {/* Title and description. */}
          <div className="space-y-4 text-center">
            <h1 className="font-medium tracking-tight">Reset password</h1>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Enter your new password below. It must be at least 12 characters
              with a mix of uppercase, lowercase, and digits.
            </p>
          </div>

          <div className="space-y-6">
            {/* Generic error message (e.g. API 400/410). */}
            {error && (
              <div
                role="alert"
                data-slot="reset-password-error"
                className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {/* Success state after submit. */}
            {isSubmitted ? (
              <div className="space-y-4 text-center">
                <div
                  data-slot="reset-password-confirmation"
                  className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400"
                >
                  Your password has been reset successfully. You can now log in
                  with your new password.
                </div>
                <Link to="/admin/login">
                  <Button type="button" className="w-full">
                    Go to login
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* New password form. */}
                <form
                  noValidate
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4"
                >
                  {/* Visible alert when no token is present in the URL query string. */}
                  {!token && (
                    <div
                      role="alert"
                      className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive space-y-2"
                    >
                      <p>No reset token found. Please use the link from your email.</p>
                      <p>
                        <Link
                          to="/admin/forgot-password"
                          className="underline underline-offset-4"
                        >
                          Request a new reset link
                        </Link>
                      </p>
                    </div>
                  )}

                  {/* New password field. */}
                  <Controller
                    control={form.control}
                    name="newPassword"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="reset-new-password">
                          New password
                        </FieldLabel>
                        <Input
                          {...field}
                          id="reset-new-password"
                          type="password"
                          placeholder="Enter your new password"
                          autoComplete="new-password"
                          aria-invalid={fieldState.invalid}
                          disabled={isSubmitting}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  {/* Confirm password field. */}
                  <Controller
                    control={form.control}
                    name="confirmPassword"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="reset-confirm-password">
                          Confirm password
                        </FieldLabel>
                        <Input
                          {...field}
                          id="reset-confirm-password"
                          type="password"
                          placeholder="Confirm your new password"
                          autoComplete="new-password"
                          aria-invalid={fieldState.invalid}
                          disabled={isSubmitting}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  {/* Submit button — disabled when no token present. */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || !token}
                  >
                    {isSubmitting ? 'Resetting...' : 'Reset password'}
                  </Button>
                </form>

                {/* Link back to login. */}
                <p className="text-center text-sm text-muted-foreground">
                  <Link
                    to="/admin/login"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Back to login
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { ResetPassword };
export type { ResetPasswordProps, ResetPasswordFormData };
