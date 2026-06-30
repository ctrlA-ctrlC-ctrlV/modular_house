/**
 * Button primitive — Phase 1 admin design system.
 *
 * Ports the shadcn/ui Button component to the Vite/React setup with
 * class-variance-authority (cva) for variant management and Radix UI
 * Slot for asChild composition.  Exposes `data-slot`, `data-variant`,
 * and `data-size` attributes for test assertions and CSS hooks.
 *
 * Template parity: mirrors the structure and class names from the
 * reference template's `components/ui/button.tsx`.
 */
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../lib/cn.js';

/**
 * Variant definitions for the Button primitive.
 *
 * Follows the reference template's variant set: default, outline,
 * secondary, ghost, destructive, link.  Size set: default, xs, sm,
 * lg, icon, icon-xs, icon-sm, icon-lg.
 */
const buttonVariants = cva(
  // Base styles shared across all variants.
  'inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-muted hover:text-foreground dark:hover:bg-muted/50',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-8 gap-1.5 px-2.5',
        xs: 'h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs',
        sm: 'h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem]',
        lg: 'h-9 gap-1.5 px-2.5',
        icon: 'size-8',
        'icon-xs': 'size-6 rounded-[min(var(--radius-md),10px)]',
        'icon-sm': 'size-7 rounded-[min(var(--radius-md),12px)]',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

/**
 * Props for the Button primitive.
 *
 * Extends the native button element props with cva variant props and
 * an optional `asChild` flag for Radix Slot composition.
 */
interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  /** Render as a child element (e.g. a link) via Radix Slot. */
  asChild?: boolean;
}

/**
 * Button primitive with variant/size support and data-attribute hooks.
 *
 * When `asChild` is true, renders via Radix `Slot` so the button styles
 * are applied to the child element (e.g. an anchor tag).
 */
function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
