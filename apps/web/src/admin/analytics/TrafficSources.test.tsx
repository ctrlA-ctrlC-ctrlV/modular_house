/**
 * T028 — TrafficSources widget static render tests (Pass 1, fixture data only).
 *
 * Pins the render contract for the TrafficSources widget that adapts the
 * template `_components/top-traffic-sources.tsx` (ui-components.md §4, plan
 * §4.3 ADD, FR-021, Q6). Asserted against the T008 fixture payloads only — no
 * live API calls, no data wiring (Pass 1). Until `TrafficSources.tsx` exists
 * (T029) the suite fails to resolve the import — the right reason (missing
 * module), not a test compile error.
 *
 * Covered contract points:
 * - All five source groups render (FR-021, Q6: "source breakdown = the 5
 *   S-groups"). The populated fixture has all five groups with non-zero
 *   sessions; each group name renders in the card.
 * - Zero-valued groups shown (Q6: "zero-valued groups shown"). The empty
 *   fixture's `sources` array contains all five groups with zero sessions and
 *   zero share; each group still renders with "0" sessions and "0.0%" share.
 * - Share values render as percentages (FR-021: "with share of total views").
 *   Each source entry's `share` (0–1 fraction) renders as a percentage string
 *   such as "40.0%".
 * - Empty state: a truly empty sources array (defensive guard — the contract
 *   always returns five groups, but the widget defends against an empty array)
 *   renders the dashed `border-border` `text-muted-foreground` empty panel
 *   (US3-9 / E-EMPTY, ui-components.md §5) and no source rows.
 * - Card frame: the widget renders inside a `data-slot="card"` frame with a
 *   `data-slot="card-title"` title (ui-components.md §4: "Card frame, ranked/
 *   share presentation").
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import { TrafficSources } from './TrafficSources.js';
import {
  overviewPopulated,
  overviewEmpty,
  type SourceEntry,
} from './fixtures.js';

/**
 * The five traffic source groups in the order `emptySources()` emits them
 * (fixtures.ts line 111). Used to assert all five are present regardless of
 * the fixture's sort order.
 */
const FIVE_GROUPS = ['direct', 'search', 'social', 'referral', 'campaign'] as const;

/**
 * Capitalise the first letter of a group name for display (e.g. "direct" ->
 * "Direct"). The widget uses the same formatting; tests assert the displayed
 * form so the render contract is pinned to what the administrator sees.
 */
function displayGroup(group: string): string {
  return group.charAt(0).toUpperCase() + group.slice(1);
}

describe('TrafficSources widget — static render contract (T028)', () => {
  it('renders all five source group names from the populated fixture', () => {
    // FR-021 / Q6: the dashboard shows the traffic-source breakdown with the
    // five S-groups. The populated fixture has all five groups with non-zero
    // sessions (search 840, direct 630, social 315, referral 210, campaign 105).
    const { container } = render(
      <TrafficSources sources={overviewPopulated.sources} />,
    );

    // Each of the five groups renders its display name in the card body.
    for (const group of FIVE_GROUPS) {
      expect(container.textContent).toContain(displayGroup(group));
    }
  });

  it('renders each source share as a percentage of total sessions', () => {
    // FR-021: "with share of total views". The fixture carries `share` as a
    // 0–1 number (e.g. 0.4); the widget renders it as a percentage string
    // such as "40.0%".
    const { container } = render(
      <TrafficSources sources={overviewPopulated.sources} />,
    );

    for (const entry of overviewPopulated.sources) {
      const expected = `${(entry.share * 100).toFixed(1)}%`;
      expect(container.textContent).toContain(expected);
    }
  });

  it('renders all five zero-valued groups from the empty fixture (Q6)', () => {
    // Q6: "zero-valued groups shown". The empty fixture's `sources` array
    // (emptySources()) contains all five groups with 0 sessions and 0 share.
    // Each group still renders — the widget never hides a group for having
    // zero traffic.
    const { container } = render(
      <TrafficSources sources={overviewEmpty.sources} />,
    );

    // All five group names render even when every value is zero.
    for (const group of FIVE_GROUPS) {
      expect(container.textContent).toContain(displayGroup(group));
    }

    // Per-row assertion (Q6: "zero-valued groups shown"): each zero-valued
    // group renders its OWN row with "0" sessions and "0.0%" share — not
    // just somewhere on the page. Select the row container (the first
    // <div> child of card-content, which wraps the flex-col row list) and
    // iterate its children so each row is verified individually.
    const cardContent = container.querySelector('[data-slot="card-content"]');
    expect(cardContent).not.toBeNull();
    const rowContainer = cardContent?.querySelector('div');
    expect(rowContainer).not.toBeNull();
    const rows = Array.from(rowContainer?.children ?? []);
    expect(rows).toHaveLength(overviewEmpty.sources.length);

    // Each row renders its group name, "0" sessions, and "0.0%" share.
    overviewEmpty.sources.forEach((entry, index) => {
      const row = rows[index];
      expect(row.textContent).toContain(displayGroup(entry.group));
      expect(row.textContent).toContain('0');
      expect(row.textContent).toContain('0.0%');
    });
  });

  it('renders the dashed empty panel and no source rows for an empty array', () => {
    // Defensive empty state: when the sources array is empty (length 0), the
    // widget renders the template's dashed `border-border`
    // `text-muted-foreground` empty panel (US3-9 / E-EMPTY,
    // ui-components.md §5). The contract always returns five groups, but the
    // widget guards against an empty array rather than rendering a blank card.
    const emptySources: SourceEntry[] = [];
    const { container } = render(<TrafficSources sources={emptySources} />);

    // No source group names render in the empty state.
    for (const group of FIVE_GROUPS) {
      expect(container.textContent).not.toContain(displayGroup(group));
    }

    // The dashed empty panel is present.
    const dashed = container.querySelector('.border-dashed');
    expect(dashed).not.toBeNull();
    expect(dashed?.className).toContain('text-muted-foreground');
  });

  it('renders within a card frame with the traffic sources title', () => {
    // ui-components.md §4: "Card frame, ranked/share presentation". The card
    // frame (`data-slot="card"`) and title (`data-slot="card-title"`) are
    // retained from the template.
    const { container } = render(
      <TrafficSources sources={overviewPopulated.sources} />,
    );

    const card = container.querySelector('[data-slot="card"]');
    expect(card).not.toBeNull();

    const title = container.querySelector('[data-slot="card-title"]');
    expect(title).not.toBeNull();
    expect(title?.textContent).toMatch(/traffic sources/i);
  });
});
