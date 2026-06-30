/**
 * Input primitive — Phase 1 admin design system.
 *
 * Token-styled text input with `data-slot` attribute, visible focus ring
 * (H4: 3px at ring/50), file-input styling, aria-invalid error states,
 * and dark-mode support.  Mirrors the reference template's input.tsx.
 */
import * as React from 'react';
import { cn } from '../lib/cn.js';

/**
 * Standard text/file input with token-driven styling and a11y hooks.
 *
 * - `data-slot="input"` for test selectors and CSS targeting.
 * - Focus ring uses H4 tokens: `ring-3 ring-ring/50`.
 * - `aria-invalid` triggers destructive border/ring for validation errors.
 * - File inputs are styled inline (`file:` variants).
 * - Dark-mode variants adjust background and disabled/invalid states.
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
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
}

export { Input };
