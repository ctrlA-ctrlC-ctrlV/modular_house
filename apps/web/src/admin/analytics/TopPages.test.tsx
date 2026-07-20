/**
 * T026 — TopPages widget static render tests (Pass 1, fixture data only).
 *
 * Pins the render contract for the TopPages widget that adapts the template
 * `_components/top-pages.tsx` (ui-components.md §4, plan §4.3 ADD, FR-021,
 * Q6). Asserted against the T008 fixture payloads only — no live API calls,
 * no data wiring (Pass 1). Until `TopPages.tsx` exists (T027) the suite fails
 * to resolve the import — the right reason (missing module), not a test
 * compile error.
 *
 * Covered contract points:
 * - Ranking order: rows render in the fixture's ranked order (descending by
 *   views, FR-021). The component trusts the input order — the overview
 *   endpoint delivers `topPages` already ranked (contract: "Ranked by views,
 *   descending (Q6)"); no client-side re-sorting.
 * - Share rendering: each row's `share` value renders as a percentage
 *   (FR-021: "with share of total views").
 * - 10-row cap (Q6): when the input exceeds 10 entries only 10 rows render.
 *   The T008 fixtures max out at 5 entries, so a >10 input is constructed
 *   inline to exercise the cap — a test-only construction, not a fixture
 *   change (T008 is closed/PASS).
 * - Empty state: the empty fixture renders the dashed `border-border`
 *   `text-muted-foreground` empty panel (US3-9 / E-EMPTY,
 *   ui-components.md §5) and no table.
 * - Card frame: the widget renders inside a `data-slot="card"` frame with a
 *   `data-slot="card-title"` title (ui-components.md §4: "Card frame, ranked
 *   rows, share presentation").
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import { TopPages } from './TopPages.js';
import {
  overviewPopulated,
  overviewEmpty,
  type TopPageEntry,
} from './fixtures.js';

describe('TopPages widget — static render contract (T026)', () => {
  it('renders rows in the fixture ranked order (descending by views)', () => {
    // FR-021 / Q6: the dashboard lists the most-viewed pages ranked by views.
    // The populated fixture's topPages are already ordered descending by views
    // (1820, 980, 720, 540, 410); the component renders them in that order.
    const { container } = render(
      <TopPages topPages={overviewPopulated.topPages} />,
    );

    // Body rows live under <tbody>; the header row lives under <thead>. Select
    // only the body rows so the count and order match the fixture entries.
    const bodyRows = container.querySelectorAll(
      'tbody [data-slot="table-row"]',
    );
    expect(bodyRows).toHaveLength(overviewPopulated.topPages.length);

    // Each body row renders the entry's path, in the fixture's ranked order.
    overviewPopulated.topPages.forEach((entry, index) => {
      expect(bodyRows[index].textContent).toContain(entry.path);
    });
  });

  it('renders each row share as a percentage of total views', () => {
    // FR-021: "with share of total views". The fixture carries `share` as a
    // 0–1 number (e.g. 0.377); the widget renders it as a percentage string
    // such as "37.7%".
    const { container } = render(
      <TopPages topPages={overviewPopulated.topPages} />,
    );

    const bodyRows = container.querySelectorAll(
      'tbody [data-slot="table-row"]',
    );

    overviewPopulated.topPages.forEach((entry, index) => {
      const expected = `${(entry.share * 100).toFixed(1)}%`;
      expect(bodyRows[index].textContent).toContain(expected);
    });
  });

  it('caps rendering at 10 rows when given more than 10 entries', () => {
    // Q6: top pages list length = 10. The T008 fixtures contain at most 5
    // entries, so an 11-entry input is constructed inline to exercise the
    // cap. This is a test-only construction — T008 (fixtures.ts) is closed
    // and is not modified by this task.
    const elevenEntries: TopPageEntry[] = Array.from(
      { length: 11 },
      (_, index) => ({
        path: `/page-${index + 1}`,
        views: 100 - index,
        share: (100 - index) / 1000,
      }),
    );

    const { container } = render(<TopPages topPages={elevenEntries} />);

    const bodyRows = container.querySelectorAll(
      'tbody [data-slot="table-row"]',
    );
    expect(bodyRows).toHaveLength(10);
  });

  it('renders the dashed empty panel and no table for the empty fixture', () => {
    // US3-9 / E-EMPTY: the empty fixture has no top pages. The widget replaces
    // the table with the template's dashed `border-border`
    // `text-muted-foreground` empty panel (ui-components.md §5).
    const { container } = render(<TopPages topPages={overviewEmpty.topPages} />);

    // No table renders in the empty state — the panel stands in for it.
    expect(container.querySelector('[data-slot="table"]')).toBeNull();

    const dashed = container.querySelector('.border-dashed');
    expect(dashed).not.toBeNull();
    expect(dashed?.className).toContain('text-muted-foreground');
  });

  it('renders within a card frame with the top pages title', () => {
    // ui-components.md §4: "Card frame, ranked rows, share presentation". The
    // card frame (`data-slot="card"`) and title (`data-slot="card-title"`)
    // are retained from the template.
    const { container } = render(
      <TopPages topPages={overviewPopulated.topPages} />,
    );

    const card = container.querySelector('[data-slot="card"]');
    expect(card).not.toBeNull();

    const title = container.querySelector('[data-slot="card-title"]');
    expect(title).not.toBeNull();
    expect(title?.textContent).toMatch(/top pages/i);
  });
});
