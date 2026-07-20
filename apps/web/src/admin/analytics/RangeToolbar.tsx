/**
 * RangeToolbar widget — Phase 2 admin analytics (Pass 1, fixture state only).
 *
 * Adapts the Studio Admin template `_components/analytics-toolbar.tsx`
 * (ui-components.md §1 compatibility rules 1–10, §4) to the project's
 * Vite/React 18.3 setup. Renders the range selector for the analytics
 * dashboard: a single ported `Select` populated with the five Q2 presets,
 * defaulting to `3 months`. Selection is reported through a callback prop —
 * no data fetching, no range math, no dialog behaviour in Pass 1 (plan §5.3).
 *
 * Spec-driven adaptations (research R10/R11 / ui-components.md §4 — nothing
 * is taste):
 * - **Option set superseded by spec Q2.** The template's four options
 *   (`Last 7 days` / `Last 4 weeks` / `Last 3 months` / `Year to date`) are
 *   replaced by the five Q2 options in their pinned order: `24 hours` /
 *   `7 days` / `28 days` / `3 months` / `More`. Q2 is explicit that the spec
 *   values supersede the template's, so the option labels and their sequence
 *   are not a free design choice — they are pinned by plan §2.6 and asserted
 *   by the T030 suite.
 * - **Default `3 months`.** Q2: "default = 3 months". The select initialises
 *   uncontrolled to the `3m` preset id (Radix `defaultValue`), so the trigger
 *   shows "3 months" on first render with no caller-supplied value.
 * - **`More` is a select option, not a separate control.** Q2 lists `More` as
 *   one of the five selector options; selecting it is reported through the
 *   same `onSelect` callback as the range presets. Opening the custom-range
 *   pop-up (RangeDialog) on `More` selection is Pass 2 wiring (T033/T080+) —
 *   the callback seam is the only behaviour shipped in Pass 1.
 * - **Export/import/share ellipsis menu omitted.** The template's
 *   `DropdownMenu` (aria-label "More analytics actions") with Export report /
 *   Import data / Share dashboard / Refresh metrics items is not shipped this
 *   phase — export/import/share are explicitly out of scope (plan §1.4 /
 *   guardrails) and there is no per-card menu precedent (KpiStrip /
 *   TrafficChart / RealtimeCard / TopPages / TrafficSources all omit the
 *   template's `CardAction` ellipsis). The omission is recorded in
 *   ui-components.md §4 and asserted by the T030 suite.
 * - **Preset ids.** Each option carries a machine id matching the T-F8
 *   shorthand ("24h/7d/28d/3m/More"): `24h` / `7d` / `28d` / `3m` / `more`.
 *   The callback receives the id, not the display label, so Pass 2 wiring can
 *   branch on a stable enum-like value without parsing human text. The
 *   `RANGE_PRESETS` array and `RangePresetId` type are exported as the
 *   extension point for the page composition (T035) and Pass 2 range math.
 * - **Selection is a callback prop.** Per T031: "Selection is a callback
 *   prop — no data fetching." The select's `onValueChange` is bridged to
 *   `onSelect`; the widget holds no range state of its own (the dashboard
 *   page owns the preset in Pass 2).
 *
 * Port mechanics (rules 1–10): no `"use client"` (rule 1); `@/components/ui`
 * rewritten to relative `../ui/select.js` for the ported Phase 2 select
 * primitive (rule 2); no `next/*` (rule 3); no `lucide-react` (rule 4 — the
 * template's `Ellipsis` icon belonged to the omitted menu, not replaced);
 * `data-slot` attributes preserved via the ported select primitive (rule 5);
 * Tailwind token class strings preserved verbatim, including the template
 * trigger width `w-34` (rule 6). Rules 7–10 do not introduce new dependencies
 * or emoji; the select primitive is already ported (T011).
 */
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select.js';

// ---------------------------------------------------------------------------
// Range preset model (extension point — Open-Closed)
// ---------------------------------------------------------------------------

/**
 * Machine ids for the five range-selector options (plan §2.6 Q2, T-F8
 * shorthand). The callback receives one of these values; Pass 2 range math
 * maps each id to its `from`/`to` params per Q2's "Preset → params mapping".
 * `more` is the pop-up trigger, not a range preset — Pass 2 opens the
 * RangeDialog on this id.
 */
export type RangePresetId = '24h' | '7d' | '28d' | '3m' | 'more';

/**
 * The five range-selector options in the spec order (Q2). Each entry pairs the
 * machine preset id with the display label rendered in the listbox. Exported
 * as the single source of truth for the option set so the page composition
 * (T035) and Pass 2 wiring consume one constant rather than duplicating the
 * list. Extend-by-append only (Open-Closed) — the spec pins exactly five.
 */
export const RANGE_PRESETS: readonly {
  id: RangePresetId;
  label: string;
}[] = [
  { id: '24h', label: '24 hours' },
  { id: '7d', label: '7 days' },
  { id: '28d', label: '28 days' },
  { id: '3m', label: '3 months' },
  { id: 'more', label: 'More' },
] as const;

/** Q2 default preset id ("3 months"). */
export const DEFAULT_RANGE_PRESET: RangePresetId = '3m';

// ---------------------------------------------------------------------------
// RangeToolbar component
// ---------------------------------------------------------------------------

/** Props for the RangeToolbar widget. */
export interface RangeToolbarProps {
  /**
   * Callback fired when the administrator chooses an option. Receives the
   * preset id (`24h` / `7d` / `28d` / `3m` / `more`), not the display label.
   * Pass 2 wires this to range-param derivation and the `More` pop-up.
   */
  onSelect: (presetId: RangePresetId) => void;
  /**
   * Initial preset shown when the toolbar mounts (uncontrolled). Defaults to
   * `3m` per Q2. The dashboard page may supply a different preset to reflect
   * persisted state in Pass 2.
   */
  defaultPreset?: RangePresetId;
}

/**
 * RangeToolbar — range selector for the analytics dashboard (Q2, FR-019).
 *
 * Renders the ported `Select` with the five Q2 options in order, defaulting to
 * `3 months`. The template's export/import/share ellipsis menu is omitted
 * (out of scope). Selection is bridged to the `onSelect` callback — the widget
 * holds no range state of its own.
 */
export function RangeToolbar({
  onSelect,
  defaultPreset = DEFAULT_RANGE_PRESET,
}: RangeToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        defaultValue={defaultPreset}
        onValueChange={(value) => onSelect(value as RangePresetId)}
      >
        <SelectTrigger className="w-34">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {RANGE_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
