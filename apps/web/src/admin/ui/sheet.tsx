/**
 * Sheet (mobile drawer) primitive — Phase 1 admin design system.
 *
 * Radix Dialog-based off-canvas drawer. Used by the Sidebar for mobile
 * layout (H5) and can serve as a standalone overlay panel.
 * Ports the template's sheet.tsx to Vite/React, replacing lucide-react
 * XIcon with an inline SVG.
 */
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../lib/cn.js';

/** Root Sheet component — wraps Radix Dialog Root. */
function Sheet({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

/** Trigger element that opens the sheet. */
function SheetTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

/** Close element that dismisses the sheet. */
function SheetClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
}

/** Portal wrapper for rendering the sheet outside the DOM tree. */
function SheetPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

/** Overlay backdrop behind the sheet content. */
function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/80',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Sheet content container — the actual drawer panel.
 *
 * - `side` prop controls edge: "top" | "right" | "bottom" | "left".
 * - Default width: 3/4 viewport, max 18rem on mobile (H3).
 * - Renders a close button by default (inline X icon).
 */
function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton?: boolean;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          'fixed z-50 flex flex-col gap-4 bg-popover text-sm text-popover-foreground shadow-lg',
          'transition duration-200 ease-in-out',
          // Side-specific positioning and sizing.
          'data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t',
          'data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b',
          'data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l',
          'data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r',
          // Max width on larger screens (18rem per H3).
          'data-[side=left]:sm:max-w-[18rem] data-[side=right]:sm:max-w-[18rem]',
          // Entry/exit animations.
          'data-[state=open]:animate-in data-[state=open]:fade-in-0',
          'data-[side=bottom]:data-[state=open]:slide-in-from-bottom-10',
          'data-[side=left]:data-[state=open]:slide-in-from-left-10',
          'data-[side=right]:data-[state=open]:slide-in-from-right-10',
          'data-[side=top]:data-[state=open]:slide-in-from-top-10',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          'data-[side=bottom]:data-[state=closed]:slide-out-to-bottom-10',
          'data-[side=left]:data-[state=closed]:slide-out-to-left-10',
          'data-[side=right]:data-[state=closed]:slide-out-to-right-10',
          'data-[side=top]:data-[state=closed]:slide-out-to-top-10',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="sheet-close"
            className={cn(
              'absolute top-3 right-3 inline-flex size-7 items-center justify-center rounded-md',
              'text-muted-foreground hover:text-foreground',
              'outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            {/* X icon (inline SVG, avoids lucide-react dependency). */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </SheetPortal>
  );
}

/** Header region inside the sheet content. */
function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-0.5 p-4', className)}
      {...props}
    />
  );
}

/** Footer region inside the sheet content. */
function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  );
}

/** Sheet title — rendered as a Radix Dialog Title for AT. */
function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-base font-medium text-foreground', className)}
      {...props}
    />
  );
}

/** Sheet description — rendered as a Radix Dialog Description for AT. */
function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
