/**
 * RangeDialog widget — Phase 2 admin analytics (ported in Pass 1, wired to
 * live range state by the page in Pass 2, T079).
 *
 * Composed from the ported `dialog` primitive (T015) + Phase 1 `button` /
 * `label` / `input` primitives (ui-components.md §2, reused as-is) per
 * ui-components.md §5: "Composed from ported `dialog` + `button` + `label` +
 * `input` (two native `type="date"` fields styled by the admin `input`
 * primitive — research R10); spacing/typography per dialog defaults;
 * validation message in `destructive` text per template form conventions".
 *
 * No direct template source — this is a new composition (ui-components.md §5).
 * The pop-up that `More` (RangeToolbar's 5th option) opens: exactly `6 months`
 * / `12 months` / `16 months` / `Custom` (Q2); Custom reveals two native
 * `<input type="date">` fields (Q3, plan §1.4: "no calendar-grid date picker
 * (two native date inputs)"). Preset and Apply selections are reported through
 * callback props — the component itself still does no validation and no data
 * wiring; `Analytics.tsx` (T079) resolves the callback into range params
 * (Q2/Q3 happy path) and closes the dialog.
 *
 * Spec-driven design (research R10 / ui-components.md §5 — nothing is taste):
 * - **Controlled open state.** The dialog's open state is controlled by the
 *   parent (`open` + `onOpenChange`). `Analytics.tsx` (T077) opens the dialog
 *   when the administrator selects `More` from the RangeToolbar and closes it
 *   on a successful Apply (T079) or dismiss. Radix Dialog handles Esc /
 *   overlay-click / close-button internally and calls `onOpenChange(false)` —
 *   the component holds no open state.
 * - **Four options (Q2).** Exactly `6 months` / `12 months` / `16 months` /
 *   `Custom` — the three month-presets and the Custom toggle. The labels and
 *   their order are pinned by Q2 and asserted by the T032 suite.
 * - **Preset buttons fire `onSelect` immediately.** Q2: "All presets are
 *   rolling windows ending today" — selecting a preset IS applying it (no
 *   further confirmation needed). The parent closes the dialog and derives
 *   the range params. The component does not close itself (no data wiring).
 * - **Custom reveals date inputs.** Clicking `Custom` toggles an internal
 *   `mode` state from `'presets'` to `'custom'`, revealing two native
 *   `<input type="date">` fields (Q3). The inputs are styled by the Phase 1
 *   `Input` primitive with `type="date"` — the browser's native date picker,
 *   not a calendar-grid (plan §1.4 guardrail). Each input has an associated
 *   `Label` via `htmlFor`/`id` for screen readers (constitution V).
 * - **Apply fires `onSelect` with the custom dates.** The Apply button (only
 *   visible in Custom mode) validates the custom pair first (Q3, T116) and
 *   only calls `onSelect` when every check passes. The parent (`Analytics.tsx`,
 *   T079) applies the range and closes on success — the component blocks
 *   `onSelect` on any Q3 violation, so the parent never learns about an
 *   invalid range and the dashboard keeps its previous range ("previous
 *   dashboard range retained until a valid Apply").
 * - **Q3 client-side validation (T116).** On Apply the component checks:
 *   `start <= end`; `end <= today` (Europe/London); span <= 490 days. A
 *   violation sets an internal `errorMessage` rendered in `text-destructive`
 *   text and blocks `onSelect`. The "today" boundary is the current
 *   Europe/London calendar date (resolved via `Intl.DateTimeFormat` with
 *   `timeZone: 'Europe/London'`), and the `end > today` message states this
 *   boundary for administrators in other timezones (Q3). The server's Q1
 *   validation (T103) remains authoritative — the client-side check is
 *   defence-in-depth, never the sole gate.
 * - **Validation message slot.** An optional `validationMessage` prop renders
 *   in `text-destructive` text per template form conventions
 *   (ui-components.md §5), coexisting with the internal `errorMessage`: the
 *   internal message takes precedence when non-empty (a Q3 client-side
 *   rejection), falling back to the parent-supplied prop (e.g. server-side
 *   feedback in a future iteration). The component renders whichever is
 *   non-empty without interpreting the prop.
 * - **No data wiring in the component itself.** The component holds only UI
 *   state (mode toggle, date-input values). Range math, param derivation, and
 *   the data hooks live in `Analytics.tsx` (T079). The `RANGE_DIALOG_PRESETS`
 *   array and `RangeDialogPreset` type are exported as the extension point.
 *
 * Composition mechanics: `Dialog` + `DialogContent` + `DialogHeader` +
 * `DialogTitle` + `DialogDescription` + `DialogFooter` from the ported dialog
 * primitive (T015); `Button` from Phase 1 (ui-components.md §2, reused
 * as-is); `Input` from Phase 1 (with `type="date"`); `Label` from Phase 1.
 * No new dependencies. `data-slot` attributes preserved via the primitives
 * (rule 5); Tailwind token classes for the destructive message
 * (`text-destructive`) and dialog spacing per template defaults (rule 6).
 */
import { useState, type RefObject } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.js';
import { Button } from '../ui/button.js';
import { Input } from '../ui/input.js';
import { Label } from '../ui/label.js';

// ---------------------------------------------------------------------------
// Range dialog preset model (extension point — Open-Closed)
// ---------------------------------------------------------------------------

/**
 * Machine ids for the four pop-up options (plan §2.6 Q2). The three
 * month-presets (`6m` / `12m` / `16m`) fire `onSelect` immediately; `custom`
 * reveals the date inputs and the Apply button calls `onSelect` with the
 * custom dates. Pass 2 range math maps each preset id to its `from`/`to`
 * params per Q2's "Preset → params mapping" (month presets:
 * `from = today − N months + 1 day`, `to = today`).
 */
export type RangeDialogPreset = '6m' | '12m' | '16m' | 'custom';

/**
 * The four pop-up options in the spec order (Q2). Each entry pairs the machine
 * preset id with the display label rendered on the button. Exported as the
 * single source of truth for the option set so the page composition (T035)
 * and Pass 2 wiring consume one constant. Extend-by-append only
 * (Open-Closed) — the spec pins exactly four.
 */
export const RANGE_DIALOG_PRESETS: readonly {
  id: RangeDialogPreset;
  label: string;
}[] = [
  { id: '6m', label: '6 months' },
  { id: '12m', label: '12 months' },
  { id: '16m', label: '16 months' },
  { id: 'custom', label: 'Custom' },
] as const;

// ---------------------------------------------------------------------------
// Q3 custom-range validation (T116, plan §2.6 Q3, research R10)
// ---------------------------------------------------------------------------

/** Milliseconds in one UTC day — the unit the span check is expressed in. */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Q1/Q3: the resolved range must not span more than this many inclusive days. */
const MAX_SPAN_DAYS = 490;

/**
 * Resolve the current Europe/London calendar day as a `YYYY-MM-DD` string.
 * Uses `Intl.DateTimeFormat` with `timeZone: 'Europe/London'` and
 * `formatToParts` (locale-independent — the parts are extracted by type, so
 * the locale's field ordering does not matter). This is the Q3 "today"
 * boundary: an `end` date after this string is in the future and must be
 * rejected. Delegating to the runtime's ICU database (rather than hand-rolling
 * offset math) keeps DST rules correct without application-side date code
 * (mirrors the server-side convention of delegating to Postgres's
 * `AT TIME ZONE 'Europe/London'`, research R6).
 */
function londonToday(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
}

/**
 * Q3: validate a custom start/end pair on Apply. Returns a human-readable
 * destructive-text message when the pair violates any Q3 rule, or `null`
 * when the pair is valid (the caller should proceed to fire `onSelect`).
 *
 * Checks run in a fixed order — presence, then ordering, then the future-date
 * boundary, then the span cap — so a pair violating several rules at once
 * still reports one clear reason (mirrors the server-side Q1 validation's
 * ordered approach in `routes/admin/analytics.ts`).
 *
 * Both `start` and `end` are `YYYY-MM-DD` strings (the native `<input
 * type="date">` format). Lexicographic string comparison is equivalent to
 * calendar-day ordering for the zero-padded form, so no parsing is needed for
 * the ordering and future-date checks. The span check parses both to UTC
 * midnight to compute the calendar-day difference.
 */
function validateCustomRange(start: string, end: string, now: Date): string | null {
  // Presence — both date inputs must be filled before any rule check.
  if (!start || !end) {
    return 'Please select both a start and end date.';
  }

  // Q3: start <= end.
  if (start > end) {
    return 'Start date must be on or before the end date.';
  }

  // Q3: end <= today (Europe/London). The message states the London boundary
  // so an administrator in another timezone understands "today" is London's
  // date, not their local clock's (Q3: "the validation message states this
  // boundary for administrators in other timezones").
  const today = londonToday(now);
  if (end > today) {
    return `End date cannot be after today (Europe/London date: ${today}).`;
  }

  // Q3: span <= 490 days. Both dates are parsed at UTC midnight; the
  // calendar-day difference is exact (UTC has no DST). 490 inclusive days
  // means the difference is at most 489.
  const startMs = new Date(`${start}T00:00:00.000Z`).getTime();
  const endMs = new Date(`${end}T00:00:00.000Z`).getTime();
  const diffDays = Math.round((endMs - startMs) / MS_PER_DAY);
  if (diffDays >= MAX_SPAN_DAYS) {
    return `The selected range must not exceed ${MAX_SPAN_DAYS} days.`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// RangeDialog component
// ---------------------------------------------------------------------------

/** Props for the RangeDialog widget. */
export interface RangeDialogProps {
  /** Controlled open state. The parent opens/closes the dialog. */
  open: boolean;
  /**
   * Called by Radix Dialog when the dialog should close (Esc, overlay click,
   * close button). The parent sets `open` to `false` in response.
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Callback fired when the administrator chooses a range. The three
   * month-presets fire this immediately on button click; Custom fires this
   * when the Apply button is pressed, supplying the two date input values.
   * The parent validates (Q3), derives range params (Q2), and closes the
   * dialog on success — the component does no validation or data wiring.
   */
  onSelect: (
    preset: RangeDialogPreset,
    customStart?: string,
    customEnd?: string,
  ) => void;
  /**
   * Optional validation message rendered in `text-destructive` text per
   * template form conventions (ui-components.md §5). The parent supplies this
   * when an Apply is rejected per Q3 ("start > end", "end > today", "span
   * exceeds 490 days"); the component renders it without interpreting it.
   */
  validationMessage?: string;
  /**
   * Optional ref to the element that should regain keyboard focus once the
   * dialog closes, by any dismissal path (Esc, overlay click, Cancel, or the
   * close button) (T118, E-A11Y). Radix's own default `onCloseAutoFocus`
   * target is the element that was active when this dialog's `FocusScope`
   * mounted — unreliable for a controlled dialog opened from a `Select`
   * item's `onValueChange`, since that item's own listbox unmounts (stealing
   * focus to `<body>`) in the same commit that mounts this dialog, before
   * Radix captures its restore target. When supplied, this ref's current
   * element is focused explicitly instead of Radix's default.
   */
  restoreFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * RangeDialog — custom-range pop-up for the analytics dashboard (Q2/Q3, FR-019).
 *
 * Renders a dialog with exactly four options: `6 months` / `12 months` /
 * `16 months` / `Custom`. The three month-presets fire `onSelect` on click;
 * Custom reveals two native `<input type="date">` fields and an Apply button
 * that fires `onSelect` with the custom dates. A `validationMessage` slot
 * renders in destructive text. All user actions are reported through callback
 * props — the component holds only UI state (mode toggle, date input values),
 * no validation logic or data wiring.
 */
export function RangeDialog({
  open,
  onOpenChange,
  onSelect,
  validationMessage,
  restoreFocusRef,
}: RangeDialogProps) {
  // Internal UI state — mode toggle ('presets' | 'custom'), the two date
  // input values, and the Q3 validation error message (T116). These are local
  // interaction state, not range data; the parent receives the values via
  // `onSelect` and derives the range params. The `errorMessage` is set by the
  // Apply button's validation handler and cleared whenever the user changes
  // either date input (so the message does not persist after correction).
  const [mode, setMode] = useState<'presets' | 'custom'>('presets');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={
          restoreFocusRef
            ? (event) => {
                // T118 (E-A11Y): explicit restore target overrides Radix's
                // own default (see the `restoreFocusRef` doc comment above
                // for why the default is unreliable for this dialog).
                event.preventDefault();
                restoreFocusRef.current?.focus();
              }
            : undefined
        }
      >
        <DialogHeader>
          <DialogTitle>Custom range</DialogTitle>
          <DialogDescription>
            Choose a preset range or set a custom start and end date.
          </DialogDescription>
        </DialogHeader>

        {/* Preset buttons — the three month-presets + the Custom toggle.
            Q2: "More opens the pop-up with exactly: 6 months, 12 months, 16
            months, Custom". The three month-presets fire `onSelect`
            immediately (Q2: "All presets are rolling windows ending today" —
            selecting a preset IS applying it). Custom toggles the date-input
            view without firing `onSelect` (no range selected yet). */}
        <div className="flex flex-wrap gap-2">
          {RANGE_DIALOG_PRESETS.map((preset) => {
            const isCustom = preset.id === 'custom';
            return (
              <Button
                key={preset.id}
                variant="outline"
                onClick={() => {
                  if (isCustom) {
                    // Custom reveals the date inputs (internal UI state); no
                    // `onSelect` fired — the user hasn't chosen a range yet.
                    // Clear any stale error from a previous Apply attempt.
                    setMode('custom');
                    setErrorMessage(null);
                  } else {
                    // Month-preset: fire `onSelect` immediately. The parent
                    // closes the dialog and derives the range params.
                    onSelect(preset.id);
                  }
                }}
              >
                {preset.label}
              </Button>
            );
          })}
        </div>

        {/* Custom date inputs — revealed when the Custom button is clicked.
            Q3: "Custom range in the pop-up: two date inputs". The inputs are
            native `<input type="date">` styled by the Phase 1 `Input`
            primitive (plan §1.4: "no calendar-grid date picker (two native
            date inputs)"). Each input has an associated `Label` via
            `htmlFor`/`id` for screen readers (constitution V). */}
        {mode === 'custom' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="range-dialog-start">Start date</Label>
              <Input
                id="range-dialog-start"
                type="date"
                value={customStart}
                onChange={(event) => {
                  setCustomStart(event.target.value);
                  setErrorMessage(null);
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="range-dialog-end">End date</Label>
              <Input
                id="range-dialog-end"
                type="date"
                value={customEnd}
                onChange={(event) => {
                  setCustomEnd(event.target.value);
                  setErrorMessage(null);
                }}
              />
            </div>

            {/* Validation message slot — rendered in `text-destructive` text
                per template form conventions (ui-components.md §5). The
                internal `errorMessage` (set by the Q3 Apply validation, T116)
                takes precedence; the parent-supplied `validationMessage` prop
                is the fallback (e.g. for server-side feedback in a future
                iteration). The component renders whichever is non-empty. */}
            {(errorMessage || validationMessage) && (
              <p className="text-destructive text-sm">
                {errorMessage || validationMessage}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {/* Apply button — only visible in Custom mode. Validates the custom
              pair against Q3 rules (T116) before firing `onSelect`; on any
              violation, sets the internal `errorMessage` and blocks
              `onSelect` so the parent never updates the dashboard range
              ("previous dashboard range retained until a valid Apply"). On
              success, clears the error and fires `onSelect` — the parent
              (T079) applies the range and closes the dialog. The server's Q1
              validation (T103) remains authoritative — this client-side check
              is defence-in-depth, never the sole gate. */}
          {mode === 'custom' && (
            <Button
              onClick={() => {
                const error = validateCustomRange(
                  customStart,
                  customEnd,
                  new Date(),
                );
                if (error) {
                  setErrorMessage(error);
                  return;
                }
                setErrorMessage(null);
                onSelect('custom', customStart, customEnd);
              }}
            >
              Apply
            </Button>
          )}
          {/* Cancel button — closes the dialog without applying. Wired to
              `onOpenChange(false)` so the parent controls the close. */}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
