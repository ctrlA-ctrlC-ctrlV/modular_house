/**
 * Label primitive — stub (T068 will implement).
 * Placeholder to unblock the primitive parity test (T065).
 */
import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '../lib/cn.js';

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn('text-sm font-medium leading-none', className)}
      {...props}
    />
  );
}

export { Label };
