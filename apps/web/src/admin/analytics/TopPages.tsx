/**
 * TopPages widget — Phase 2 admin analytics (Pass 1, fixture data only).
 *
 * Adapts the Studio Admin template `_components/top-pages.tsx`
 * (ui-components.md §1 compatibility rules 1–10, §4) to the project's
 * Vite/React 18.3 setup. Renders a card-framed ranked table of the top-10
 * page paths with their view counts and share-of-views percentage, fed
 * exclusively from the T008 fixture payloads (no live API calls, no data
 * wiring — Pass 1).
 *
 * Spec-driven adaptations (research R11 / ui-components.md §4 — nothing is
 * taste):
 * - **Columns superseded.** The template's Path | Views | Avg Time | Bounce
 *   columns become Path | Views | Share. Avg Time (dwell time) and Bounce
 *   (bounce rate) are out of scope (plan §1.4 guardrails). Share is the
 *   spec's addition (FR-021: "with share of total views"), rendered as a
 *   percentage (e.g. "37.7%").
 * - **Data source.** The template's hardcoded `pages` array is replaced by
 *   the `topPages` prop (TopPageEntry[]), a slice of the overview response
 *   (FR-021, Q6). The component trusts the input order — the overview
 *   endpoint delivers `topPages` already ranked (contract: "Ranked by views,
 *   descending (Q6)"); no client-side re-sorting.
 * - **10-row cap (Q6).** Only the first 10 entries render (Q6: top pages
 *   list length = 10); extra entries are dropped.
 * - **Per-card ellipsis menu omitted.** The template's `CardAction` with an
 *   `Ellipsis` icon is not shipped this phase — follows the KpiStrip /
 *   TrafficChart / RealtimeCard precedent ("no per-card menu shipped").
 * - **Title.** "Top Pages" reflects the spec's "most-viewed pages" (FR-021),
 *   replacing the template's "Page Performance".
 * - **Dashed empty state.** When `topPages` is empty (US3-9 / E-EMPTY), the
 *   table is replaced by the template's dashed `border-border`
 *   `text-muted-foreground` empty panel (ui-components.md §5).
 *
 * Table primitive inlining (ui-components.md §3): the template's
 * `_components/top-pages.tsx` imports `Table`/`TableHeader`/`TableBody`/
 * `TableRow`/`TableHead`/`TableCell` from `@/components/ui/table`, but
 * `table.tsx` is not in the §3 new-primitives port list (T009 verified the
 * inventory complete — no extensions). Per "a component not in the inventory
 * is not built", the table is rendered with native `<table>`/`<thead>`/
 * `<tbody>`/`<tr>`/`<th>`/`<td>` elements carrying the template's
 * `data-slot` attributes and Tailwind token classes. This preserves the
 * template's DOM structure and `data-slot` contract for the §6 parity gate
 * without introducing a new admin primitive. The class strings mirror the
 * template's `table.tsx` primitive defaults merged with the `top-pages.tsx`
 * overrides (e.g. `hover:bg-transparent`, `border-border/50`, `tabular-nums`).
 *
 * Port mechanics (rules 1–10): `"use client"` stripped (rule 1); `@/components`
 * rewritten to relative `../ui/*` for the reused `Card` primitive (rule 2);
 * no `next/*` (rule 3); no `lucide-react` (rule 4 — the template's `Ellipsis`
 * icon is omitted, not replaced); `data-slot` attributes preserved on the
 * Card primitive and the inlined table elements (rule 5); Tailwind token
 * class strings preserved verbatim, no literal colors (rule 6).
 */
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.js';

import type { TopPageEntry } from './fixtures.js';

// ---------------------------------------------------------------------------
// TopPages component
// ---------------------------------------------------------------------------

/** Maximum number of ranked rows rendered (Q6: top pages list length = 10). */
const TOP_PAGES_MAX_ROWS = 10;

/** Props for the TopPages widget. */
export interface TopPagesProps {
  /** Ranked top-pages entries (descending by views); only the first 10 render. */
  topPages: TopPageEntry[];
}

/**
 * Format a share fraction (0–1) as a percentage string with one decimal place
 * (e.g. 0.377 -> "37.7%"). FR-021: "with share of total views".
 */
function formatShare(share: number): string {
  return `${(share * 100).toFixed(1)}%`;
}

/**
 * TopPages — ranked list of the most-viewed pages with share of views
 * (FR-021, Q6).
 *
 * Card frame containing a ranked table of up to 10 page paths with their view
 * counts and share-of-views percentage. When `topPages` is empty the table is
 * replaced by the dashed empty-panel (US3-9 / E-EMPTY).
 */
export function TopPages({ topPages }: TopPagesProps) {
  const hasPages = topPages.length > 0;
  // Q6: cap the rendered list at 10 rows. Slice is non-mutating; entries
  // beyond the cap are dropped rather than hidden.
  const rankedRows = topPages.slice(0, TOP_PAGES_MAX_ROWS);

  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Top Pages</CardTitle>
      </CardHeader>

      <CardContent className="px-0">
        {hasPages ? (
          // Table container + table mirror the template's `Table` primitive
          // (`data-slot="table-container"` wrapper + `data-slot="table"`).
          // The table-level `[&_td:first-child]:pl-4 [&_td:last-child]:pr-4
          // [&_th:first-child]:pl-4 [&_th:last-child]:pr-4` classes reproduce
          // the template's edge-padding override so the first/last cells line
          // up with the card's inner edges while CardContent drops its own
          // horizontal padding (`px-0`).
          <div
            data-slot="table-container"
            className="relative w-full overflow-x-auto"
          >
            <table
              data-slot="table"
              className="w-full caption-bottom text-sm [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4"
            >
              <thead
                data-slot="table-header"
                className="[&_tr]:border-b [&_tr]:border-border/50"
              >
                <tr
                  data-slot="table-row"
                  className="border-b transition-colors hover:bg-transparent"
                >
                  {/* First header is intentionally empty — the row order
                      implies rank (template contract). */}
                  <th
                    data-slot="table-head"
                    className="h-8 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground"
                  />
                  <th
                    data-slot="table-head"
                    className="h-8 w-24 px-2 text-right align-middle font-normal whitespace-nowrap text-foreground"
                  >
                    Views
                  </th>
                  <th
                    data-slot="table-head"
                    className="h-8 w-24 px-2 text-right align-middle font-normal whitespace-nowrap text-foreground"
                  >
                    Share
                  </th>
                </tr>
              </thead>
              <tbody
                data-slot="table-body"
                className="[&_tr:last-child]:border-0 [&_tr]:border-border/50"
              >
                {rankedRows.map((entry) => (
                  <tr
                    data-slot="table-row"
                    className="border-b transition-colors hover:bg-transparent"
                    key={entry.path}
                  >
                    <td
                      data-slot="table-cell"
                      className="max-w-0 truncate py-4 pl-4 pr-2 align-middle font-medium whitespace-nowrap text-foreground"
                    >
                      {entry.path}
                    </td>
                    <td
                      data-slot="table-cell"
                      className="p-2 text-right align-middle tabular-nums whitespace-nowrap text-foreground"
                    >
                      {entry.views}
                    </td>
                    <td
                      data-slot="table-cell"
                      className="p-2 pr-4 text-right align-middle tabular-nums whitespace-nowrap text-muted-foreground"
                    >
                      {formatShare(entry.share)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Empty state (US3-9 / E-EMPTY): the template's dashed
          // `border-border` `text-muted-foreground` empty panel stands in for
          // the table when there are no pages to rank.
          <div className="flex h-32 w-full items-center justify-center border border-border border-dashed text-muted-foreground text-sm">
            No page views in this range.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
