/**
 * Dialog primitive — Phase 2 admin design system.
 *
 * Radix UI Dialog wrapper ported from the Studio Admin template
 * `src/components/ui/dialog.tsx` to the project's Vite/React 18.3 setup
 * (ui-components.md §1 compatibility rules 1–10, §3). Provides the full
 * subcomponent set — root, trigger, portal, close, overlay, content (with an
 * optional close button), header, footer, title, description — used by the
 * RangeDialog composition (T033).
 *
 * Port adaptations (rule-bound, no taste):
 * - `"use client"` stripped (rule 1); `radix-ui` umbrella import rewritten to
 *   the already-present `@radix-ui/react-dialog` namespace import (rules 2/3,
 *   7) — no new dependency added (ui-components.md §3).
 * - `Button` imported from the Phase 1 admin primitive (rule 2 → relative
 *   `./button.js`; ui-components.md §2: reused as-is, no modification).
 * - `XIcon` from `lucide-react` replaced by an inline-SVG component (rule 4) —
 *   no `lucide-react` dependency added.
 * - `cn` sourced from the admin lib (rule 2); `data-slot` attributes and
 *   Tailwind token classes preserved verbatim (rules 5/6).
 *
 * Template observation: the template uses `data-open:`/`data-closed:` Tailwind
 * shorthands for animations, but the installed `@radix-ui/react-dialog@1.1.2`
 * sets `data-state="open"`/`data-state="closed"` (not `data-open`/`data-closed`).
 * The class strings are preserved verbatim per rule 6; the parity gate (T036)
 * performs the light/dark side-by-side and will record any animation mismatch
 * as a documented adaptation if needed.
 */
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../lib/cn.js';
import { Button } from './button.js';

/** Inline X icon for the dialog close button (replaces lucide XIcon, rule 4). */
function XIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-4', className)}
      {...props}
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/** Root dialog provider — manages open state and shared context. */
function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

/** Trigger element that opens the dialog. */
function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

/** Portal wrapper that renders dialog content outside the DOM tree root. */
function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

/** Close primitive — can wrap any element to dismiss the dialog on activation. */
function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

/**
 * Full-screen overlay behind the dialog content. Provides a dimmed backdrop
 * with a subtle blur and fade animation keyed to the open/closed state.
 */
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs',
        'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Dialog content panel — centered, portaled, with an overlay sibling. Renders
 * an optional close button (top-right) wrapping the Phase 1 `Button` primitive.
 * Carries `role="dialog"` (set by Radix) and the `data-slot="dialog-content"`
 * hook for styling and tests.
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none',
          'sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button variant="ghost" className="absolute top-2 right-2" size="icon-sm">
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

/** Header region grouping the title and description. */
function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

/**
 * Footer region with an optional close button. Renders a bordered,
 * muted-background bar at the bottom of the dialog, stacking on mobile and
 * right-aligning on `sm:` breakpoints.
 */
function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        '-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

/** Dialog title — wired by Radix as `aria-labelledby` on the content. */
function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('font-heading text-base leading-none font-medium', className)}
      {...props}
    />
  );
}

/** Dialog description — wired by Radix as `aria-describedby` on the content. */
function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
