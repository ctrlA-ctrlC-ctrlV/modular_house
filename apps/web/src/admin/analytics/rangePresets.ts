/**
 * Range-preset math (Pass 2 data wiring, plan §2.6 Q1/Q2, research R10, FR-019).
 *
 * Converts a range-selector preset id into the `{from, to}` query params the
 * overview endpoint expects (`contracts/analytics.openapi.yaml`
 * `getAnalyticsOverview`). Covers the seven non-custom presets shared by
 * `RangeToolbar` (`24h`/`7d`/`28d`/`3m`) and `RangeDialog`
 * (`6m`/`12m`/`16m`); the `custom` option is administrator-entered start/end
 * dates, validated separately (Q3/E-DIALOG) rather than derived here.
 *
 * All presets are rolling windows ending on the current Europe/London
 * calendar day (Q2). The 24-hour preset uses the ISO 8601 UTC datetime form
 * (sub-day range); every other preset uses the `YYYY-MM-DD` calendar-day form
 * (Q1). The server independently re-validates whatever the client computes
 * here (research R10: "never trust the client").
 */

/** IANA timezone identifier for every "today"/calendar-day computation (Q2). */
const LONDON_TIME_ZONE = 'Europe/London';

/** Machine ids for the seven non-custom range presets (Q2 preset -> params mapping). */
export type RangePresetKey = '24h' | '7d' | '28d' | '3m' | '6m' | '12m' | '16m';

/** The `{from, to}` query-param pair consumed by `getAnalyticsOverview` (Q1). */
export interface RangeParams {
  from: string;
  to: string;
}

/** One preset's shape: a fixed lookback expressed in hours, days, or months. */
interface RangePresetDefinition {
  key: RangePresetKey;
  unit: 'hours' | 'days' | 'months';
  amount: number;
}

/**
 * The seven preset definitions in Q2's mapping order (extensible list,
 * Open-Closed — appending a new rolling-window preset only requires a new
 * entry here plus its selector option).
 */
export const RANGE_PRESET_DEFINITIONS: readonly RangePresetDefinition[] = [
  { key: '24h', unit: 'hours', amount: 24 },
  { key: '7d', unit: 'days', amount: 7 },
  { key: '28d', unit: 'days', amount: 28 },
  { key: '3m', unit: 'months', amount: 3 },
  { key: '6m', unit: 'months', amount: 6 },
  { key: '12m', unit: 'months', amount: 12 },
  { key: '16m', unit: 'months', amount: 16 },
] as const;

/**
 * Format a UTC instant as its Europe/London calendar day (`YYYY-MM-DD`, Q1).
 * The `en-CA` locale's numeric date formatting is ISO-ordered
 * (year-month-day), which combined with explicit 2-digit fields yields the
 * exact `YYYY-MM-DD` string without manual part re-assembly.
 */
function londonCalendarDate(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: LONDON_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/**
 * Shift a `YYYY-MM-DD` calendar day by a signed number of days. Calendar-day
 * arithmetic is timezone-agnostic once the correct London day has been
 * extracted (`londonCalendarDate`), so the shift is done in plain UTC
 * (`Date.UTC` + `setUTCDate`) — this avoids re-introducing any DST
 * sensitivity into what is now pure Gregorian-calendar math.
 */
function shiftCalendarDay(calendarDay: string, days: number): string {
  const [year, month, day] = calendarDay.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

/**
 * Subtract whole calendar months from a `YYYY-MM-DD` day, keeping the same
 * day-of-month (`Date.UTC`'s month-index normalization handles year
 * rollover). Used only for the month presets' `today - N months` step, ahead
 * of the shared `+ 1 day` adjustment (Q2).
 */
function subtractCalendarMonths(calendarDay: string, months: number): string {
  const [year, month, day] = calendarDay.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 - months, day));
  return shifted.toISOString().slice(0, 10);
}

/**
 * Resolve a range preset to its `{from, to}` query params for the given
 * reference instant (Q1/Q2). `now` is always caller-supplied — production
 * callers pass `new Date()`, tests pass a fixed instant — so this function
 * never reads the wall clock itself (constitution III: deterministic time).
 */
export function presetToRange(preset: RangePresetKey, now: Date): RangeParams {
  const definition = RANGE_PRESET_DEFINITIONS.find((entry) => entry.key === preset);
  if (!definition) {
    throw new Error(`Unknown range preset: ${preset}`);
  }

  if (definition.unit === 'hours') {
    // Sub-day range (24-hour preset only): ISO 8601 UTC datetime form,
    // `from = now - 24h`, `to = now` (Q1/Q2).
    const to = now.toISOString();
    const from = new Date(now.getTime() - definition.amount * 60 * 60 * 1000).toISOString();
    return { from, to };
  }

  const today = londonCalendarDate(now);

  if (definition.unit === 'days') {
    // Calendar-day range: `from = today - (N - 1)`, `to = today` (Q2), so an
    // N-day preset spans exactly N inclusive calendar days.
    const from = shiftCalendarDay(today, -(definition.amount - 1));
    return { from, to: today };
  }

  // Month range: `from = today - N months + 1 day`, `to = today` (Q2).
  const monthsAgo = subtractCalendarMonths(today, definition.amount);
  const from = shiftCalendarDay(monthsAgo, 1);
  return { from, to: today };
}
