/**
 * Select primitive — Phase 2 admin design system.
 *
 * Radix UI Select wrapper ported from the Studio Admin template
 * `src/components/ui/select.tsx` to the project's Vite/React 18.3 setup
 * (ui-components.md §1 compatibility rules 1–10, §3). Provides the full
 * subcomponent set — trigger (sm/default sizes), value, content, group, label,
 * item, separator, and scroll buttons — used by the RangeToolbar composition.
 *
 * Port adaptations (rule-bound, no taste):
 * - `"use client"` stripped (rule 1); the whole admin app is client-rendered.
 * - `radix-ui` umbrella import rewritten to the pinned `@radix-ui/react-select`
 *   namespace import (rules 2/3, 7); no `next/*` to remove (rule 3).
 * - `lucide-react` icons replaced by inline-SVG components defined below
 *   (rule 4) — no `lucide-react` dependency is added.
 * - `cn` sourced from the admin lib (rule 2); `data-slot`/`data-size`/
 *   `data-variant` attributes and Tailwind token classes preserved verbatim
 *   (rules 5/6) so they resolve against the Phase 1 token layer.
 */
import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '../lib/cn.js';

/** Inline chevron-down icon (replaces `lucide-react` ChevronDownIcon, rule 4). */
function ChevronDownIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Inline chevron-up icon (replaces `lucide-react` ChevronUpIcon, rule 4). */
function ChevronUpIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
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
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

/** Inline check icon for the selected-item indicator (replaces lucide, rule 4). */
function CheckIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
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
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Root select provider — manages open/value state and shared context. */
function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

/** Group wrapper for related items; carries scroll anchoring offset. */
function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn('scroll-my-1 p-1', className)}
      {...props}
    />
  );
}

/** Renders the currently selected value's text inside the trigger. */
function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

/**
 * Trigger button that opens the listbox. Exposes a `size` variant
 * (`sm` | `default`) via `data-size` and the H4 visible-focus ring
 * (`focus-visible:ring-3 ring-ring/50`). Appends a chevron-down icon.
 */
function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default';
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        'flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
        'data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)]',
        '*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5',
        'dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

/**
 * Portaled listbox content. Supports `item-aligned` (default) and `popper`
 * positioning; `data-align-trigger` records the positioning mode. Renders the
 * scroll buttons above/below the viewport. Animation classes are keyed to the
 * Radix `data-side`/`data-open`/`data-closed` attributes.
 */
function SelectContent({
  className,
  children,
  position = 'item-aligned',
  align = 'center',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-align-trigger={position === 'item-aligned'}
        className={cn(
          'relative z-50 max-h-(--radix-select-content-available-height) min-w-36 origin-(--radix-select-content-transform-origin)',
          'overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100',
          'data-[align-trigger=true]:animate-none',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className,
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-position={position}
          className={cn(
            'data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)',
            position === 'popper' && '',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

/** Heading label for a group of options. */
function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn('px-1.5 py-1 text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

/**
 * Selectable option. Shows a check indicator when selected; `data-slot` and the
 * `data-variant` hook are preserved for styling. The trailing indicator span is
 * absolutely positioned so item text never overlaps the check mark.
 */
function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none',
        'focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground',
        'data-disabled:pointer-events-none data-disabled:opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
        '*:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2',
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

/** Visual separator between option groups. */
function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('pointer-events-none -mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}

/** Scroll-up affordance rendered at the top of the content when overflowing. */
function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        'z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*=\'size-\'])]:size-4',
        className,
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpButton>
  );
}

/** Scroll-down affordance rendered at the bottom of the content when overflowing. */
function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        'z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*=\'size-\'])]:size-4',
        className,
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
