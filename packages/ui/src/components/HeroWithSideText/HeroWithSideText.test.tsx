/**
 * HeroWithSideText Accessibility Tests
 * =============================================================================
 *
 * PURPOSE:
 * Guards against an invalid ARIA authoring pattern in the component's
 * background-image markup: an `aria-label` attribute placed on an element
 * with no implicit or explicit ARIA role. Per the HTML Accessibility API
 * Mappings (HTML-AAM), a bare `<picture>` element has no corresponding role,
 * so `aria-label` on it is never exposed to assistive technology — the
 * attribute is silently discarded by the accessibility tree.
 *
 * Refs: specs/013-panel-phase-2/tasks.md T150/T151, DoD-6, constitution V.
 *
 * =============================================================================
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { HeroWithSideText } from './HeroWithSideText';

describe('HeroWithSideText accessibility', () => {
  afterEach(() => {
    cleanup();
  });

  it('does not place aria-label on a <picture> element lacking a supporting role', () => {
    const { container } = render(<HeroWithSideText />);

    const picture = container.querySelector('picture');
    expect(picture).not.toBeNull();

    const hasAriaLabel = picture?.hasAttribute('aria-label') ?? false;
    const hasSupportingRole = picture?.getAttribute('role') === 'img';

    // Invalid pattern: aria-label present but no role="img" to expose it.
    expect(hasAriaLabel && !hasSupportingRole).toBe(false);
  });
});
