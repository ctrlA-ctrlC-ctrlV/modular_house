/**
 * T070 — range-preset math tests (Pass 2 data wiring, Q1/Q2, FR-019, research R10).
 *
 * Pins the exact preset -> `{from, to}` mapping ahead of `rangePresets.ts`
 * (T071), covering all seven non-custom presets: the four RangeToolbar
 * options (`24h`/`7d`/`28d`/`3m`) plus the three RangeDialog month options
 * (`6m`/`12m`/`16m`). `custom` is excluded — it is raw administrator input,
 * validated in Pass 2/E-DIALOG (T115/T116), not a preset.
 *
 * The fixed clock straddles the Europe/London BST offset — 2026-07-14T23:30
 * UTC is 2026-07-15T00:30 local (BST is UTC+1 in July) — so the suite proves
 * "today" resolves to the *London* calendar day (2026-07-15), not the UTC one
 * (2026-07-14), matching Q2's "'today' is the current Europe/London date"
 * and the general E-TZ boundary family (plan §4.2).
 */
import { describe, it, expect } from 'vitest';

import { presetToRange } from './rangePresets.js';

// Fixed clock (never real Date.now() — constitution III): 23:30 UTC on
// 2026-07-14 is 00:30 BST on 2026-07-15, so the London calendar day has
// already rolled over while the UTC day has not.
const FIXED_NOW = new Date('2026-07-14T23:30:00.000Z');

describe('rangePresets — presetToRange (T070, Q1/Q2)', () => {
  it('24 hours -> UTC datetimes now-24h..now', () => {
    const { from, to } = presetToRange('24h', FIXED_NOW);
    expect(to).toBe('2026-07-14T23:30:00.000Z');
    expect(from).toBe('2026-07-13T23:30:00.000Z');
  });

  it('7 days -> today-6..today (Europe/London calendar days)', () => {
    const { from, to } = presetToRange('7d', FIXED_NOW);
    expect(to).toBe('2026-07-15');
    expect(from).toBe('2026-07-09');
  });

  it('28 days -> today-27..today', () => {
    const { from, to } = presetToRange('28d', FIXED_NOW);
    expect(to).toBe('2026-07-15');
    expect(from).toBe('2026-06-18');
  });

  it('3 months -> today - 3 months + 1 day .. today', () => {
    const { from, to } = presetToRange('3m', FIXED_NOW);
    expect(to).toBe('2026-07-15');
    expect(from).toBe('2026-04-16');
  });

  it('6 months -> today - 6 months + 1 day .. today', () => {
    const { from, to } = presetToRange('6m', FIXED_NOW);
    expect(to).toBe('2026-07-15');
    expect(from).toBe('2026-01-16');
  });

  it('12 months -> today - 12 months + 1 day .. today', () => {
    const { from, to } = presetToRange('12m', FIXED_NOW);
    expect(to).toBe('2026-07-15');
    expect(from).toBe('2025-07-16');
  });

  it('16 months -> today - 16 months + 1 day .. today', () => {
    const { from, to } = presetToRange('16m', FIXED_NOW);
    expect(to).toBe('2026-07-15');
    expect(from).toBe('2025-03-16');
  });
});
