// Two-factor code entry page — step 2 of the admin login flow (FR-031, B9).
// Renders a 6-digit OTP code entry using InputOTP, with a resend control.
// Receives the challengeId from the login step via react-router location state.
// The onSubmit/onResend callbacks are placeholders until the apiClient (T091) wires in.
// Layout mirrors the Login page's two-column "login v1" split-screen.
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { cn } from '../lib/cn.js';
import { Button } from '../ui/button.js';
import {
  Field,
  FieldError,
  FieldLabel,
} from '../ui/form.js';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '../ui/input-otp.js';

// F1: minimum resend cooldown in seconds. The server authoritatively enforces
// the 60s cooldown (returning 429 + Retry-After); this client-side countdown is
// the UX mirror that disables the control and shows when a new request is
// available (FR-042).  Kept as a local constant so the page stays self-contained.
const RESEND_COOLDOWN_SECONDS = 60;

// Zod schema — 6-digit numeric code (mirrors B1 server-side validation).
const twoFactorSchema = z.object({
  code: z
    .string()
    .length(6, { message: 'Code must be exactly 6 digits.' })
    .regex(/^\d{6}$/, { message: 'Code must contain only numbers.' }),
});

type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

interface TwoFactorProps {
  /** The opaque challengeId returned by the login endpoint (B9). */
  challengeId?: string;
  /** Callback invoked with validated code + challengeId on submit. */
  onSubmit?: (data: { challengeId: string; code: string }) => void;
  /** Callback invoked when the user requests a new code. */
  onResend?: (challengeId: string) => void;
  /** Error message displayed above the form (e.g. from API 401). */
  error?: string;
  /** Success message displayed above the form (e.g. "Code resent"). */
  message?: string;
  /** Whether the form is currently submitting. */
  isSubmitting?: boolean;
  /** Whether the resend button is disabled (cooldown active). */
  resendDisabled?: boolean;
  className?: string;
}

// Inline SVG for the branded shield icon (avoids lucide-react dependency).
function ShieldIcon({ className }: { className?: string }) {
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
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// Two-factor code entry — two-column "login v1" layout matching the Login page.
// Left panel: branded shield icon + title. Right panel: 6-digit OTP input + resend.
function TwoFactor({
  challengeId,
  onSubmit,
  onResend,
  error,
  message,
  isSubmitting = false,
  resendDisabled = false,
  className,
}: TwoFactorProps) {
  const form = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: '',
    },
  });

  // F1/FR-042: client-side resend cooldown countdown.  Starts at 60s when the
  // user clicks resend and ticks down once per second; while > 0 the resend
  // control is disabled and shows the remaining seconds.  The server is still
  // authoritative (429 + Retry-After backs this up) — this is the UX mirror.
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCooldownSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const handleSubmit = form.handleSubmit((data) => {
    if (challengeId) {
      onSubmit?.({ challengeId, code: data.code });
    }
  });

  const handleResend = () => {
    if (challengeId) {
      onResend?.(challengeId);
      // Begin the cooldown countdown immediately on click; the container's
      // async handler deals with the API response, this drives the UI lock.
      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    }
  };

  return (
    <div
      data-testid="two-factor-page"
      className={cn('flex min-h-svh', className)}
    >
      {/* Branded left panel — hidden below lg, visible on lg+. */}
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <ShieldIcon className="mx-auto size-12 text-primary-foreground" />
            <div className="space-y-2">
              <h1 className="font-light text-5xl text-primary-foreground">
                Verification
              </h1>
              <p className="text-primary-foreground/80 text-xl">
                Enter your code
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
            <h1 className="font-medium tracking-tight">
              Two-factor authentication
            </h1>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Enter the 6-digit verification code sent to your email.
            </p>
          </div>

          <div className="space-y-6">
            {/* Generic error message (e.g. wrong code from API). */}
            {error && (
              <div
                role="alert"
                data-slot="two-factor-error"
                className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {/* Success message (e.g. "Code resent"). */}
            {message && (
              <div
                data-slot="two-factor-message"
                className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-center text-sm text-green-700 dark:text-green-400"
              >
                {message}
              </div>
            )}

            {/* Code entry form — 6-digit OTP. */}
            <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Controller
                control={form.control}
                name="code"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="two-factor-code" className="sr-only">
                      Verification code
                    </FieldLabel>
                    <InputOTP
                      id="two-factor-code"
                      maxLength={6}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={isSubmitting}
                      aria-invalid={fieldState.invalid}
                      containerClassName="justify-center"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
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
                {isSubmitting ? 'Verifying...' : 'Verify'}
              </Button>
            </form>

            {/* Resend control — disabled during cooldown (F1/FR-042). */}
            <div className="space-y-3 text-center">
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm text-muted-foreground"
                onClick={handleResend}
                disabled={resendDisabled || isSubmitting || cooldownSeconds > 0}
              >
                {cooldownSeconds > 0
                  ? `Resend code (${cooldownSeconds}s)`
                  : 'Resend code'}
              </Button>

              {/* Link back to login. */}
              <p className="text-center text-sm text-muted-foreground">
                <Link
                  to="/admin/login"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Back to login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { TwoFactor };
export type { TwoFactorProps, TwoFactorFormData };
