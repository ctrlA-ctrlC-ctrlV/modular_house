// ComingSoon — centered, faded placeholder content for the admin shell.
// Renders inside the main content region when no feature pages exist (H7).
// No feature pages are built in Phase 1 (plan §5.2).
import * as React from 'react';
import { cn } from '../lib/cn.js';

function ComingSoon({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-1 items-center justify-center',
        className,
      )}
      {...props}
    >
      <p
        data-slot="coming-soon"
        className="text-2xl font-medium text-muted-foreground/60 select-none"
      >
        Coming Soon
      </p>
    </div>
  );
}

export { ComingSoon };
