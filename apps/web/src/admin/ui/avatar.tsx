/**
 * Avatar primitive — stub (T071 will implement).
 * Placeholder to unblock the primitive parity test (T065).
 */
import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '../lib/cn.js';

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  );
}

/**
 * Avatar image element.  Wraps the Radix primitive in a span so the
 * data-slot attribute is always present in the DOM, even when the
 * image fails to load (Radix omits the element entirely on error).
 */
const AvatarImage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => {
  return (
    <span data-slot="avatar-image" className={cn('contents', className)} ref={ref}>
      <AvatarPrimitive.Image className="aspect-square h-full w-full" {...props} />
    </span>
  );
});
AvatarImage.displayName = 'AvatarImage';

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted',
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
