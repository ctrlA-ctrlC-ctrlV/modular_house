/**
 * Card primitive — Phase 1 admin design system.
 *
 * Container with header, content, and footer slots using token-driven
 * spacing via CSS custom property `--card-spacing`.  Supports a `size`
 * variant (default/sm) and ring-based border for visual parity with
 * the reference template's card.tsx.
 */
import * as React from 'react';
import { cn } from '../lib/cn.js';

/**
 * Root card container.
 *
 * - `data-slot="card"` for test selectors and slot-based child styling.
 * - `data-size` accepts `"default"` or `"sm"` for compact layouts.
 * - Uses `ring-1 ring-foreground/10` instead of `border` to match the
 *   template's visual treatment.
 * - `group/card` enables descendant components to react to card state.
 * - `--card-spacing` CSS variable controls uniform internal padding.
 */
function Card({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        'group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-lg bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10',
        '[--card-spacing:--spacing(4)]',
        'has-data-[slot=card-footer]:pb-0',
        'has-[>img:first-child]:pt-0',
        'data-[size=sm]:[--card-spacing:--spacing(3)]',
        'data-[size=sm]:has-data-[slot=card-footer]:pb-0',
        '*:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Card header region — typically holds title and description.
 * Uses CSS grid for layout when a card-action slot is present.
 */
function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-lg px-(--card-spacing)',
        'has-data-[slot=card-action]:grid-cols-[1fr_auto]',
        'has-data-[slot=card-description]:grid-rows-[auto_auto]',
        '[.border-b]:pb-(--card-spacing)',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Card title — primary heading text within the header.
 */
function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        'text-base leading-snug font-medium group-data-[size=sm]/card:text-sm',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Card description — secondary text beneath the title.
 */
function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

/**
 * Card action — positioned top-right via grid when present in the header.
 */
function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Card content — main body region below the header.
 */
function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-(--card-spacing)', className)}
      {...props}
    />
  );
}

/**
 * Card footer — bottom region with muted background and top border.
 */
function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'flex items-center rounded-b-lg border-t bg-muted/50 p-(--card-spacing)',
        className,
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter };
