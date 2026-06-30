/**
 * Utility for merging Tailwind CSS class names.
 *
 * Combines `clsx` (conditional class joining) with `tailwind-merge`
 * (intelligent deduplication of conflicting Tailwind utilities).
 * This is the standard pattern used by shadcn/ui components.
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge and deduplicate Tailwind CSS class names.
 *
 * Accepts any combination of strings, arrays, objects, and falsy values.
 * Conflicting utilities are resolved by the last occurrence (tailwind-merge).
 *
 * @param inputs - Class values to merge.
 * @returns A single deduplicated class string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
