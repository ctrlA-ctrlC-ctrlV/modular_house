/**
 * T018 — Badge primitive render contract tests.
 *
 * Pins the template DOM contract for the ported Badge primitive
 * `src/components/ui/badge.tsx` (ui-components.md §3, plan §4.3 ADD): each
 * variant renders as a `data-slot="badge"` span carrying its `data-variant`
 * attribute and the pill-shape (`rounded-4xl`) token class, with variant-specific
 * token classes preserved verbatim. Until `ui/badge.tsx` is ported (T019) the
 * suite fails to resolve the import — the right reason (missing module), not a
 * test compile error.
 *
 * The badge is used by KpiStrip delta badges (FR-018); the exact delta-variant
 * mapping is pinned by the KpiStrip widget suite (T020), not here. This suite
 * verifies the primitive's own contract in isolation against the template's six
 * variants (default, secondary, destructive, outline, ghost, link).
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import { Badge, badgeVariants } from './badge.js';

// The six variants the template defines (badge.tsx cva config). Each must render
// with its data-variant attribute and variant-specific token classes.
const VARIANTS = [
  'default',
  'secondary',
  'destructive',
  'outline',
  'ghost',
  'link',
] as const;

describe('Badge primitive — render contract (T018)', () => {
  it('renders a data-slot="badge" span by default', () => {
    const { container } = render(<Badge>Default</Badge>);

    // The badge is a span carrying the data-slot contract (template rule 5).
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge).not.toBeNull();
    expect(badge?.tagName).toBe('SPAN');

    // Default variant is "default" (cva defaultVariants).
    expect(badge?.getAttribute('data-variant')).toBe('default');
  });

  it.each(VARIANTS)(
    'renders the %s variant with its data-variant attribute',
    (variant) => {
      const { container } = render(<Badge variant={variant}>{variant}</Badge>);

      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).not.toBeNull();
      expect(badge?.getAttribute('data-variant')).toBe(variant);
    },
  );

  it('carries the pill-shape rounded-4xl token class on every variant', () => {
    // The pill shape is the badge's defining visual trait (ui-components.md §3:
    // "pill shape (rounded-4xl)"). Present in the cva base string, so every
    // variant inherits it — asserted on the default variant as representative.
    const { container } = render(<Badge>Pill</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge?.className).toContain('rounded-4xl');
  });

  it('preserves the default variant token classes (bg-primary text-primary-foreground)', () => {
    // Variant-specific token classes are preserved verbatim (rule 6). The
    // default variant maps to bg-primary / text-primary-foreground.
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge?.className).toContain('bg-primary');
    expect(badge?.className).toContain('text-primary-foreground');
  });

  it('preserves the destructive variant tinted token classes', () => {
    // Destructive uses a tinted bg (bg-destructive/10) rather than a solid fill —
    // the "tinted variants" adaptation in ui-components.md §3.
    const { container } = render(<Badge variant="destructive">Error</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge?.className).toContain('bg-destructive/10');
    expect(badge?.className).toContain('text-destructive');
  });

  it('asChild renders the Slot child element instead of a span', () => {
    // asChild composes via Radix Slot (template badge.tsx): the badge classes
    // merge onto the child element rather than wrapping it in a span.
    const { container } = render(
      <Badge asChild>
        <a href="/analytics">Link badge</a>
      </Badge>,
    );

    // The anchor inherits data-slot + data-variant + badge classes; no span.
    const anchor = container.querySelector('a[data-slot="badge"]');
    expect(anchor).not.toBeNull();
    expect(anchor?.tagName).toBe('A');
    expect(anchor?.getAttribute('data-variant')).toBe('default');
    expect(container.querySelector('span[data-slot="badge"]')).toBeNull();
  });

  it('badgeVariants is exported and produces class strings for each variant', () => {
    // badgeVariants (the cva function) is exported for use by consumers that
    // need the class string without rendering a Badge (e.g. applying badge
    // classes to an element via cn). Each variant must produce a non-empty
    // string containing the pill-shape class.
    for (const variant of VARIANTS) {
      const classes = badgeVariants({ variant });
      expect(typeof classes).toBe('string');
      expect(classes).toContain('rounded-4xl');
    }
  });

  it('merges a caller-supplied className onto the variant classes', () => {
    // The cn() merge lets callers add classes (e.g. layout overrides) while
    // preserving the variant token classes.
    const { container } = render(
      <Badge className="ml-2 custom-class">With class</Badge>,
    );
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge?.className).toContain('ml-2');
    expect(badge?.className).toContain('custom-class');
    // Variant classes are still present (cn merges, does not replace).
    expect(badge?.className).toContain('bg-primary');
  });
});
