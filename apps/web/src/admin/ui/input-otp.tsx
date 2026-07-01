// InputOTP primitive — 6-slot numeric code entry for two-factor authentication.
// Wraps the `input-otp` npm package with admin design-system tokens and data-slot
// attributes for parity with the template (research R2).
// The InputOTPSeparator renders a visual dash between slot groups using an inline
// SVG to avoid adding lucide-react as a dependency.
import * as React from 'react';
import { OTPInput, OTPInputContext } from 'input-otp';
import { cn } from '../lib/cn.js';

/**
 * Root OTP input container.  Wraps the `input-otp` OTPInput component, applying
 * admin-token styling and forwarding all props.  The `containerClassName` prop
 * targets the outermost wrapper while `className` targets the hidden native
 * input element.
 */
function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        'flex items-center has-disabled:opacity-50',
        containerClassName,
      )}
      spellCheck={false}
      className={cn('disabled:cursor-not-allowed', className)}
      {...props}
    />
  );
}

/**
 * Groups a set of OTP slots together, typically 3 slots per group with a
 * separator between groups (e.g. "123 - 456").
 */
function InputOTPGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(
        'flex items-center rounded-lg has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Individual OTP digit slot.  Reads the current char, active state, and fake
 * caret from the OTPInput context to render the digit display and focus
 * indicator.  The active slot gets a ring highlight (H4: 3px at ring/50).
 */
function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } =
    inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        'relative flex size-8 items-center justify-center border-y border-r border-input text-sm transition-all outline-none first:rounded-l-lg first:border-l last:rounded-r-lg aria-invalid:border-destructive data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-3 data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-[active=true]:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
}

/**
 * Visual separator between OTP slot groups.  Renders a minus/dash icon using an
 * inline SVG (avoids lucide-react dependency).
 */
function InputOTPSeparator({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-otp-separator"
      className={cn('flex items-center [&_svg:not([class*=\'size-\'])]:size-4', className)}
      role="separator"
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14" />
      </svg>
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
