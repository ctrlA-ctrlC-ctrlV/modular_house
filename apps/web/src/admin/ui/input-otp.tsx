/**
 * InputOTP primitive — stub (T076 will implement).
 * Placeholder to unblock the primitive parity test (T065).
 */
import * as React from 'react';
import { cn } from '../lib/cn.js';

interface InputOTPProps extends React.ComponentProps<'div'> {
  maxLength: number;
}

function InputOTP({ className, maxLength: _maxLength, ...props }: InputOTPProps) {
  return (
    <div data-slot="input-otp" className={cn('flex items-center gap-2', className)} {...props} />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="input-otp-group" className={cn('flex items-center', className)} {...props} />
  );
}

interface InputOTPSlotProps extends React.ComponentProps<'div'> {
  index: number;
}

function InputOTPSlot({ className, index: _index, ...props }: InputOTPSlotProps) {
  return (
    <div
      data-slot="input-otp-slot"
      className={cn(
        'relative flex h-10 w-10 items-center justify-center border-y border-r text-sm first:border-l',
        className,
      )}
      {...props}
    />
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot };
