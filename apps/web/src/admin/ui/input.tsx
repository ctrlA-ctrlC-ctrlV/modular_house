// Input primitive — token-styled text input with data-slot, visible focus ring
// (H4: 3px at ring/50), file-input styling, aria-invalid error states, and
// dark-mode support.  Uses forwardRef so react-hook-form's Controller can
// attach a ref (required for setFocus, shouldFocusError).
import * as React from 'react';
import { cn } from '../lib/cn.js';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none',
          'file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
          'placeholder:text-muted-foreground',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
          'md:text-sm',
          'dark:bg-input/30 dark:disabled:bg-input/80',
          'dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
