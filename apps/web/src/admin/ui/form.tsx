// Form field wrappers — composable field/label/description/error for form layouts (FR-031).
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn.js';
import { Label } from './label.js';

// Orientation variants: vertical stacks label above input, horizontal aligns side-by-side.
const fieldVariants = cva(
  'group/field flex w-full gap-2 data-[invalid=true]:text-destructive',
  {
    variants: {
      orientation: {
        vertical: 'flex-col *:w-full [&>.sr-only]:w-auto',
        horizontal:
          'flex-row items-center *:data-[slot=field-label]:flex-auto',
      },
    },
    defaultVariants: {
      orientation: 'vertical',
    },
  },
);

// Field container — groups label, input, description, and error.
function Field({
  className,
  orientation = 'vertical',
  invalid,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof fieldVariants> & { invalid?: boolean }) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      data-invalid={invalid || undefined}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

function FieldContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-content"
      className={cn('flex flex-1 flex-col gap-0.5 leading-snug', className)}
      {...props}
    />
  );
}

// Wraps Label primitive with field styling; htmlFor provides AT association (FR-031).
function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        'flex w-fit gap-2 leading-snug',
        'group-data-[disabled=true]/field:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

function FieldDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="field-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

// Validation error exposed to AT via role="alert" (FR-031).
// Accepts children or a Zod/RHF errors array with automatic deduplication.
function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<'div'> & {
  errors?: Array<{ message?: string } | undefined>;
}) {
  const content = React.useMemo(() => {
    if (children) {
      return children;
    }

    if (!errors?.length) {
      return null;
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ];

    if (uniqueErrors.length === 1) {
      return uniqueErrors[0]?.message;
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>,
        )}
      </ul>
    );
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn('text-sm text-destructive', className)}
      {...props}
    >
      {content}
    </div>
  );
}

export { Field, FieldContent, FieldDescription, FieldError, FieldLabel };
