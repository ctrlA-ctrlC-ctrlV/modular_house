// Login page — "login v1" two-column layout for the admin panel (FR-005, FR-006).
// Split-screen: branded left panel (lg+) + centered form on the right.
// No Google sign-in option (FR-005).  "Forgot password" link instead of
// registration (FR-006).  Uses react-hook-form + zod for client-side validation.
// The onSubmit callback is a placeholder until the apiClient (T091) wires in.
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

// Zod schema for client-side validation (FR-019: server is authoritative,
// but client mirrors basic rules for UX).
const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required.' })
    .email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(1, { message: 'Password is required.' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginProps {
  /** Callback invoked with validated form data on submit. */
  onSubmit?: (data: LoginFormData) => void;
  /** Error message to display above the form (e.g. from API response). */
  error?: string;
  /** Whether the form is currently submitting. */
  isSubmitting?: boolean;
  className?: string;
}

// Inline SVG for the branded command icon (avoids lucide-react dependency).
function CommandIcon({ className }: { className?: string }) {
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
      <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
    </svg>
  );
}

// "Login v1" two-column layout — branded left panel (visible on lg+) with a
// centered form on the right.  Matches the reference template's
// `next_shadcn_admin_dashboard/src/app/(main)/auth/v1/login/page.tsx`.
// No Google sign-in (FR-005).  Registration replaced by "Forgot password"
// link (FR-006).
function Login({ onSubmit, error, isSubmitting = false, className }: LoginProps) {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit?.(data);
  });

  return (
    <div
      data-testid="login-page"
      className={cn('flex min-h-svh', className)}
    >
      {/* Branded left panel — hidden below lg, visible on lg+. */}
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <CommandIcon className="mx-auto size-12 text-primary-foreground" />
            <div className="space-y-2">
              <h1 className="font-light text-5xl text-primary-foreground">
                Hello again
              </h1>
              <p className="text-primary-foreground/80 text-xl">
                Login to continue
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
            <h1 className="font-medium tracking-tight">Login</h1>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Welcome back. Enter your email and password, let&apos;s hope you
              remember them this time.
            </p>
          </div>

          <div className="space-y-6">
            {/* Generic error message (e.g. invalid credentials from API). */}
            {error && (
              <div
                role="alert"
                data-slot="login-error"
                className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {/* Login form — email + password fields. */}
            <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                {/* Email field — htmlFor provides AT association (FR-031). */}
                <Controller
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="login-email">Email</FieldLabel>
                      <Input
                        {...field}
                        id="login-email"
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

                {/* Password field. */}
                <Controller
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="login-password">Password</FieldLabel>
                      <Input
                        {...field}
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        aria-invalid={fieldState.invalid}
                        disabled={isSubmitting}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Submit button. */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Login'}
              </Button>
            </form>

            {/* FR-006: "Forgot password" link replaces registration entry. */}
            <p className="text-center text-sm text-muted-foreground">
              <Link
                to="/admin/forgot-password"
                className="text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Login };
export type { LoginProps, LoginFormData };
