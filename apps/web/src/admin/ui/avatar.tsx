// Avatar primitive — Radix Avatar with size variants and initials fallback (G4).
import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '../lib/cn.js';

// Root avatar container with data-slot, data-size, and after:border ring.
function Avatar({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: 'default' | 'sm' | 'lg';
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        'group/avatar relative flex size-8 shrink-0 rounded-full select-none',
        'after:absolute after:inset-0 after:rounded-full after:border after:border-border',
        'data-[size=lg]:size-10 data-[size=sm]:size-6',
        className,
      )}
      {...props}
    />
  );
}

// Wrapped in a span so data-slot stays in DOM when Radix omits <img> on load failure.
const AvatarImage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => {
  return (
    <span data-slot="avatar-image" className="contents" ref={ref}>
      <AvatarPrimitive.Image
        className={cn('aspect-square size-full rounded-full object-cover', className)}
        {...props}
      />
    </span>
  );
});
AvatarImage.displayName = 'AvatarImage';

// Renders initials when no photo is set (G4).
function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground',
        'group-data-[size=sm]/avatar:text-xs',
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
