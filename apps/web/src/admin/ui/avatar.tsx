/**
 * Avatar primitive — Phase 1 admin design system.
 *
 * Radix Avatar with size variants and initials fallback (G4).
 * Mirrors the template's avatar.tsx structure, stripped of Next.js
 * specifics and adapted to the Vite/React setup.
 */
import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '../lib/cn.js';

/**
 * Root avatar container.
 *
 * - `data-slot="avatar"` for test selectors.
 * - `data-size` drives width/height via Tailwind data-attribute variants.
 * - `group/avatar` enables descendant AvatarBadge positioning.
 * - `after:` pseudo-element adds a subtle ring/border for visual parity.
 */
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

/**
 * Avatar image element.
 *
 * Wraps the Radix Image in a span so `data-slot="avatar-image"` is
 * always present in the DOM. Radix omits the <img> entirely when the
 * image fails to load, which would break querySelector-based tests.
 */
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

/**
 * Avatar fallback — renders initials when no photo is set (G4).
 *
 * Uses `bg-muted` background with `text-muted-foreground` for a
 * neutral appearance. Font size scales down on `sm` avatars.
 */
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
