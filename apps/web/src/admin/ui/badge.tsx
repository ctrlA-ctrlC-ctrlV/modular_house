/**
 * Badge primitive — Phase 2 admin design system.
 *
 * Ports the Studio Admin template `src/components/ui/badge.tsx` to the project's
 * Vite/React 18.3 setup (ui-components.md §1 compatibility rules 1–10, §3).
 * Provides the pill-shaped badge with six tinted variants (default, secondary,
 * destructive, outline, ghost, link) used by KpiStrip delta badges (FR-018)
 * and other admin surfaces. `badgeVariants` (the cva function) is exported for
 * consumers that need the class string without rendering a Badge.
 *
 * Port adaptations (rule-bound, no taste):
 * - `"use client"` stripped (rule 1); the whole admin app is client-rendered.
 * - `@/lib/utils` (`cn`) rewritten to the relative `../lib/cn.js` (rule 2).
 * - `radix-ui` umbrella import rewritten to the already-present
 *   `@radix-ui/react-slot` (rules 2/7 — Phase 1 `button.tsx` uses the same
 *   import; `Slot` is the forwardRef component itself, not `Slot.Root` as in
 *   the template's umbrella namespace; no new dependency added).
 * - No `next/*` modules present (rule 3); no `lucide-react` (rule 4).
 * - `data-slot="badge"` and `data-variant` attributes preserved (rule 5); all
 *   Tailwind token class strings preserved verbatim (rule 6), including the
 *   pill-shape `rounded-4xl` and the tinted-variant `bg-destructive/10` style.
 */
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '../lib/cn.js';

// Badge variant class map. The base string carries the pill shape (rounded-4xl),
// fixed height (h-5), focus-visible ring (H4), and icon-spacing helpers; each
// variant adds its token colors. Preserved verbatim from the template (rule 6).
const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        secondary:
          'bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
        destructive:
          'bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20',
        outline:
          'border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
        ghost:
          'hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

/**
 * Badge — pill-shaped status/indicator label.
 *
 * Renders as a `data-slot="badge"` span with a `data-variant` attribute. When
 * `asChild` is set, Radix Slot composes the badge classes onto the child element
 * (e.g. an anchor) instead of wrapping it, preserving the data-slot/variant
 * contract on the rendered element.
 */
function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
