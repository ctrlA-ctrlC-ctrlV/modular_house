/**
 * Tabs primitive — Phase 2 admin design system.
 *
 * Radix UI Tabs wrapper ported from the Studio Admin template
 * `src/components/ui/tabs.tsx` to the project's Vite/React 18.3 setup
 * (ui-components.md §1 compatibility rules 1–10, §3). Provides the full
 * subcomponent set — root (orientation-aware), list (default/line variants),
 * trigger, content — used by the Analytics page tab row (T035).
 *
 * Port adaptations (rule-bound, no taste):
 * - `"use client"` stripped (rule 1); the whole admin app is client-rendered.
 * - `radix-ui` umbrella import rewritten to the pinned `@radix-ui/react-tabs`
 *   namespace import (rules 2/3, 7); no `next/*` to remove (rule 3).
 * - `cva`/`VariantProps` retained from `class-variance-authority` (already a
 *   project dependency) for the list variant system.
 * - `cn` sourced from the admin lib (rule 2); `data-slot`/`data-variant`/
 *   `data-orientation` attributes and Tailwind token classes preserved verbatim
 *   (rules 5/6) so they resolve against the Phase 1 token layer.
 * - No `lucide-react` icons in this primitive (rule 4 not exercised).
 */
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../lib/cn.js';

/** Root tab group — manages active-value state and shared orientation context. */
function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn('group/tabs flex gap-2 data-horizontal:flex-col', className)}
      {...props}
    />
  );
}

/**
 * Variant definitions for the tab list. `default` renders a muted pill
 * container; `line` renders a transparent row with an underline indicator on
 * the active trigger (the underline is drawn by the trigger's `::after`
 * element, styled via the `group-data-[variant=line]/tabs-list:` selectors).
 */
const tabsListVariants = cva(
  'group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        line: 'gap-1 bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

/**
 * Tab list container. Exposes a `variant` (`default` | `line`) via
 * `data-variant` and carries the `group/tabs-list` class so triggers can
 * style themselves relative to the list variant (e.g. underline indicator).
 */
function TabsList({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

/**
 * Individual tab trigger. Carries the H4 visible-focus ring
 * (`focus-visible:ring-[3px] ring-ring/50`) and an `::after` underline
 * indicator that fades in when the trigger is active under a `line`-variant
 * list. Active styling is driven by Radix's `data-state="active"` /
 * `data-state="inactive"` attribute (T036c — the template's own
 * `data-active:` shorthand matches attribute *presence*, not this
 * attribute/value pair, and never resolves against the pinned Radix
 * version; `data-[state=active]:` is the form that actually matches); the
 * `group-data-horizontal/tabs` / `group-data-vertical/tabs` selectors switch
 * the underline orientation with the root orientation.
 */
function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all',
        'group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start',
        'hover:text-foreground',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        'has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1',
        'dark:text-muted-foreground dark:hover:text-foreground',
        'group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
        'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent',
        'data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground',
        'after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100',
        className,
      )}
      {...props}
    />
  );
}

/** Content panel for a tab. Only the active panel is mounted (Radix default). */
function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 text-sm outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
