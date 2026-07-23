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
 *   visible in Custom mode) calls `onSelect('custom', customStart,
 *   customEnd)`. The parent (`Analytics.tsx`, T079) passes the pair straight
 *   through as `{from, to}` on the happy path and closes on success —
 *   Q3's rejection paths (`start > end`, `end > today`, span > 490 days) are
 *   Pass 3 / E-DIALOG (T115/T116); the component itself still does no
 *   validation.
 * - **Validation message slot.** An optional `validationMessage` prop renders
 *   in `text-destructive` text per template form conventions
 *   (ui-components.md §5). The parent supplies the message when Apply is
 *   rejected (Q3, Pass 3 / E-DIALOG); the component just renders it — no
 *   validation logic.
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
import { useState } from 'react';

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
}: RangeDialogProps) {
  // Internal UI state — mode toggle ('presets' | 'custom') and the two date
  // input values. These are local interaction state, not range data; the
  // parent receives the values via `onSelect` and derives the range params.
  const [mode, setMode] = useState<'presets' | 'custom'>('presets');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
                    setMode('custom');
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
                onChange={(event) => setCustomStart(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="range-dialog-end">End date</Label>
              <Input
                id="range-dialog-end"
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
              />
            </div>

            {/* Validation message slot — rendered in `text-destructive` text
                per template form conventions (ui-components.md §5). The
                parent supplies the message when an Apply is rejected per Q3;
                the component renders it without interpreting it. */}
            {validationMessage && (
              <p className="text-destructive text-sm">{validationMessage}</p>
            )}
          </div>
        )}

        <DialogFooter>
          {/* Apply button — only visible in Custom mode. Fires `onSelect`
              with the custom dates; the parent (T079) applies them on the
              Q3 happy path and closes on success. Full Q3 rejection handling
              is Pass 3 / E-DIALOG (T115/T116) — the component itself still
              does no validation. */}
          {mode === 'custom' && (
            <Button
              onClick={() => onSelect('custom', customStart, customEnd)}
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
