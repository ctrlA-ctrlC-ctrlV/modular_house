/**
 * Sidebar primitive — stub (T072 will implement).
 * Placeholder to unblock the primitive parity test (T065).
 */
import * as React from 'react';
import { cn } from '../lib/cn.js';

function Sidebar({ className, ...props }: React.ComponentProps<'aside'>) {
  return (
    <aside
      data-slot="sidebar"
      className={cn('flex h-full flex-col', className)}
      {...props}
    />
  );
}

export { Sidebar };
