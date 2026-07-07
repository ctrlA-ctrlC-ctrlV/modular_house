/**
 * Label primitive — Phase 1 admin design system.
 *
 * Radix UI Label wrapper bound to inputs for assistive technology.
 * Supports disabled-state styling via `group-data-[disabled]` and
 * `peer-disabled` selectors.  Mirrors the reference template's label.tsx.
 */
import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '../lib/cn.js';

/**
 * Accessible label that associates with its linked input via `htmlFor`.
 *
 * - `data-slot="label"` for test selectors and CSS targeting.
 * - Responds to parent `data-[disabled=true]` and sibling `peer-disabled`
 *   states for consistent disabled styling across form fields.
 */
function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none',
        'group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Label };
