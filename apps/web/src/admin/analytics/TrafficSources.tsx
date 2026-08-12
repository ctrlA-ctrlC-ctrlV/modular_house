/**
 * TrafficSources widget — Phase 2 admin analytics (Pass 1, fixture data only).
 *
 * Adapts the Studio Admin template `_components/top-traffic-sources.tsx`
 * (ui-components.md §1 compatibility rules 1–10, §4) to the project's
 * Vite/React 18.3 setup. Renders a card-framed ranked breakdown of the five
 * traffic source groups with their session counts and share-of-sessions
 * percentage, fed exclusively from the T008 fixture payloads (no live API
 * calls, no data wiring — Pass 1).
 *
 * Spec-driven adaptations (research R11 / ui-components.md §4 — nothing is
 * taste):
 * - **Tabs removed.** The template's three-tab layout (Sources / Campaigns /
 *   Referrers, each rendering a separate BarChart) is removed entirely. The
 *   spec's source breakdown is a single flat list of the five S-groups
 *   (Q6: "source breakdown = the 5 S-groups"); there is no separate
 *   "campaigns" or "referrers" sub-data in the contract. CAMPAIGN is one of
 *   the five groups, not a tab; REFERRAL is another. The tabbed drill-down
 *   implies data the contract does not carry.
 * - **BarChart replaced with ranked rows.** The template's horizontal
 *   BarChart (recharts `BarChart layout="vertical"`) is replaced by a ranked
 *   row list. The adaptation column in ui-components.md §4 says "Rows = the
 *   five source groups, zero-valued groups shown" — "rows" is explicit. A
 *   row list guarantees zero-valued groups are visibly shown with an explicit
 *   "0" session count and "0.0%" share (Q6), whereas a 0-length bar in a
 *   BarChart is invisible (only the label renders, not the value). The
 *   "ranked/share presentation" from the template's "follows template" column
 *   is preserved: rows are ranked by sessions descending (input order) with
 *   share displayed as a percentage. The visual divergence from the
 *   template's BarChart is a documented adaptation for the T036 parity gate.
 * - **Data source.** The template's hardcoded `sourcesData`/`campaignsData`/
 *   `referrersData` arrays are replaced by the `sources` prop
 *   (`SourceEntry[]`), a slice of the overview response (FR-021, Q6, S4).
 *   The component trusts the input order — the overview endpoint delivers
 *   `sources` already ranked by sessions descending; no client-side
 *   re-sorting (consistent with TopPages).
 * - **Columns.** Each row shows the group name (capitalised display label),
 *   session count (S4: "source metrics count sessions, not events"), and
 *   share-of-sessions percentage (FR-021). The template's `visitors` +
 *   `label` fields map to `sessions` + formatted `share`.
 * - **Per-card ellipsis menu omitted.** The template's `CardAction` with an
 *   `Ellipsis` icon is not shipped this phase — follows the KpiStrip /
 *   TrafficChart / RealtimeCard / TopPages precedent ("no per-card menu
 *   shipped").
 * - **Title.** "Traffic Sources" is retained from the template — it matches
 *   the spec's "traffic-source breakdown" (FR-021).
 * - **Dashed empty state.** When the `sources` array is empty (length 0 — a
 *   defensive guard, since the contract always returns five groups per Q6),
 *   the row list is replaced by the template's dashed `border-border`
 *   `text-muted-foreground` empty panel (US3-9 / E-EMPTY,
 *   ui-components.md §5). When the array has entries with all-zero values
 *   (the `overviewEmpty` fixture), the five zero-valued rows still render —
 *   Q6 requires zero-valued groups to be shown, not hidden behind a dashed
 *   panel.
 *
 * Port mechanics (rules 1–10): `"use client"` stripped (rule 1); `@/components`
 * rewritten to relative `../ui/*` for the reused Phase 1 `Card` primitive
 * (rule 2); no `next/*` (rule 3); no `lucide-react` (rule 4 — the template's
 * `Ellipsis` icon is omitted, not replaced); `data-slot` attributes preserved
 * via the Phase 1 `Card` primitive (rule 5); Tailwind token class strings
 * preserved verbatim, no literal colors (rule 6). Rule 9 (recharts through
 * chart.tsx) does not apply — this widget uses no recharts components after
 * the BarChart-to-rows adaptation.
 */
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.js';

import type { SourceEntry } from './fixtures.js';

// ---------------------------------------------------------------------------
// TrafficSources component
// ---------------------------------------------------------------------------

/**
 * Capitalise the first letter of a group name for display (e.g. "direct" ->
 * "Direct", "search" -> "Search"). The spec stores group names as lowercase
 * enum values (`SourceGroup`); the administrator-facing display uses
 * title-case labels matching the template's "Direct" / "Social" / "Referral"
 * convention.
 */
function displayGroup(group: string): string {
  return group.charAt(0).toUpperCase() + group.slice(1);
}

/**
 * Format a share fraction (0–1) as a percentage string with one decimal place
 * (e.g. 0.4 -> "40.0%"). FR-021: "with share of total views"; S4: source
 * metrics count sessions, so share = group sessions / total sessions.
 */
function formatShare(share: number): string {
  return `${(share * 100).toFixed(1)}%`;
}

/** Props for the TrafficSources widget. */
export interface TrafficSourcesProps {
  /** Ranked source-group entries (descending by sessions); all five groups
   *  are always present per Q6, zero-valued included. */
  sources: SourceEntry[];
}

/**
 * TrafficSources — traffic-source breakdown for the selected range
 * (FR-021, Q6, S4).
 *
 * Card frame containing a ranked list of the five source groups, each showing
 * its display name, session count, and share-of-sessions percentage. When the
 * `sources` array is empty (defensive guard), the list is replaced by the
 * dashed empty-panel (US3-9 / E-EMPTY).
 */
export function TrafficSources({ sources }: TrafficSourcesProps) {
  const hasSources = sources.length > 0;

  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Traffic Sources</CardTitle>
      </CardHeader>

      <CardContent className="px-0">
        {hasSources ? (
          // Ranked row list — the five source groups ranked by sessions
          // descending (input order). Each row shows the group display name
          // (left), session count (right, tabular-nums), and share-of-sessions
          // percentage (right, muted, tabular-nums). The row rhythm mirrors
          // the RealtimeCard pages list: `border-border/50` bottom divider,
          // `last:border-b-0` on the final row.
          <div className="flex flex-col">
            {sources.map((entry) => (
              <div
                key={entry.group}
                className="flex items-center gap-3 border-border/50 border-b px-4 pt-3 pb-3 last:border-b-0 last:pb-1"
              >
                {/* Group display name — capitalised for the administrator. */}
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {displayGroup(entry.group)}
                </span>
                {/* Session count (S4: "source metrics count sessions, not
                    events"). Right-aligned, tabular-nums for column
                    alignment. */}
                <span className="text-sm tabular-nums">
                  {entry.sessions}
                </span>
                {/* Share-of-sessions percentage (FR-021). Right-aligned,
                    muted, tabular-nums. Zero share renders "0.0%" — the
                    group is shown, not hidden (Q6). */}
                <span className="text-muted-foreground text-sm tabular-nums w-14 text-right">
                  {formatShare(entry.share)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          // Defensive empty state (US3-9 / E-EMPTY): when the sources array
          // is empty (length 0), the template's dashed `border-border`
          // `text-muted-foreground` empty panel replaces the row list. The
          // contract always returns five groups (Q6), so this guard defends
          // against a contract violation rather than a normal state.
          <div className="flex h-32 w-full items-center justify-center border border-border border-dashed text-muted-foreground text-sm">
            No traffic sources in this range.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
