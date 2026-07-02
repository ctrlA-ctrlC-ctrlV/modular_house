// Forgot password page — request a password-reset link (FR-014, FR-015).
// Renders an email entry form.  On submit, posts to /admin/auth/forgot-password.
// The server returns a neutral confirmation regardless of whether the account exists
// (C4 — no account-existence disclosure).
// Layout mirrors the Login page's two-column "login v1" split-screen.
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { cn } from '../lib/cn.js';
import { Button } from '../ui/button.js';
import { Input } from '../ui/input.js';
import {
  Field,
  FieldError,
  FieldLabel,
} from '../ui/form.js';

// Zod schema — email validation (server is authoritative, client mirrors for UX).
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required.' })
    .email({ message: 'Please enter a valid email address.' }),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordProps {
  /** Callback invoked with validated email on submit. */
  onSubmit?: (data: ForgotPasswordFormData) => void;
  /** Error message displayed above the form (e.g. network error). */
  error?: string;
  /** Whether the form is currently submitting. */
  isSubmitting?: boolean;
  /** Whether the form has been submitted successfully (neutral confirmation). */
  isSubmitted?: boolean;
  className?: string;
}

// Inline SVG for the branded lock icon (avoids lucide-react dependency).
function LockIcon({ className }: { className?: string }) {
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
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// Forgot password — two-column "login v1" layout matching the Login page.
// Left panel: branded lock icon + title. Right panel: email entry form.
function ForgotPassword({
  onSubmit,
  error,
  isSubmitting = false,
  isSubmitted = false,
  className,
}: ForgotPasswordProps) {
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit?.(data);
  });

  return (
    <div
      data-testid="forgot-password-page"
      className={cn('flex min-h-svh', className)}
    >
      {/* Branded left panel — hidden below lg, visible on lg+. */}
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <LockIcon className="mx-auto size-12 text-primary-foreground" />
            <div className="space-y-2">
              <h1 className="font-light text-5xl text-primary-foreground">
                Reset password
              </h1>
              <p className="text-primary-foreground/80 text-xl">
                We&apos;ll help you get back in
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
            <h1 className="font-medium tracking-tight">Forgot password</h1>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
          </div>

          <div className="space-y-6">
            {/* Generic error message (e.g. network error). */}
            {error && (
              <div
                role="alert"
                data-slot="forgot-password-error"
                className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {/* Neutral confirmation after submit (C4 — no account-existence disclosure). */}
            {isSubmitted ? (
              <div className="space-y-4 text-center">
                <div
                  data-slot="forgot-password-confirmation"
                  className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400"
                >
                  If an account with that email exists, a password-reset link has
                  been sent. Check your inbox and spam folder.
                </div>
                <p className="text-sm text-muted-foreground">
                  Didn&apos;t receive an email? Check your spam folder or{' '}
                  <button
                    type="button"
                    className="text-primary underline-offset-4 hover:underline"
                    onClick={() => form.reset()}
                  >
                    try again
                  </button>
                  .
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  <Link
                    to="/admin/login"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Back to login
                  </Link>
                </p>
              </div>
            ) : (
              <>
                {/* Email entry form. */}
                <form
                  noValidate
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4"
                >
                  <Controller
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="forgot-password-email">
                          Email
                        </FieldLabel>
                        <Input
                          {...field}
                          id="forgot-password-email"
                          type="email"
                          placeholder="admin@example.com"
                          autoComplete="email"
                          aria-invalid={fieldState.invalid}
                          disabled={isSubmitting}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  {/* Submit button. */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send reset link'}
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

export { ForgotPassword };
export type { ForgotPasswordProps, ForgotPasswordFormData };
