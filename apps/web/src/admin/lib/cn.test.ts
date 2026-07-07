/**
 * T063 — cn() helper unit tests.
 *
 * Asserts class merge/dedupe via `clsx` + `tailwind-merge`:
 *   - Merges multiple class strings
 *   - Deduplicates conflicting Tailwind utilities (last wins)
 *   - Handles conditional classes (truthy/falsy)
 *   - Handles arrays and objects
 *
 * The helper does not exist yet; tests fail until T064 implements it.
 */
import { describe, it, expect } from 'vitest';
import { cn } from './cn.js';

describe('cn()', () => {
  it('merges multiple class strings', () => {
    const result = cn('px-4 py-2', 'text-sm font-bold');
    expect(result).toBe('px-4 py-2 text-sm font-bold');
  });

  it('deduplicates conflicting Tailwind utilities (last wins)', () => {
    const result = cn('px-4', 'px-8');
    expect(result).toBe('px-8');
  });

  it('handles conditional classes (truthy/falsy)', () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn('base', isActive && 'active', isDisabled && 'disabled');
    expect(result).toBe('base active');
  });

  it('handles arrays of class strings', () => {
    const result = cn(['px-4', 'py-2'], 'text-sm');
    expect(result).toBe('px-4 py-2 text-sm');
  });

  it('handles objects with boolean values', () => {
    const result = cn({ 'px-4': true, 'py-2': false, 'text-sm': true });
    expect(result).toBe('px-4 text-sm');
  });

  it('returns an empty string when no arguments are provided', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('handles undefined and null gracefully', () => {
    const result = cn('base', undefined, null, 'end');
    expect(result).toBe('base end');
  });
});
