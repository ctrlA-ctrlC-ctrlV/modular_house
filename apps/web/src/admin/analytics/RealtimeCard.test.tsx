/**
 * T024 — RealtimeCard widget static render tests (Pass 1, fixture data only).
 *
 * Pins the render contract for the RealtimeCard widget that adapts the template
 * `_components/realtime-visitors.tsx` (ui-components.md §4, plan §4.3 ADD,
 * FR-020, V5). Asserted against the T008 fixture payloads only — no live API
 * calls, no data wiring, no polling (Pass 1). Until `RealtimeCard.tsx` exists
 * (T025) the suite fails to resolve the import — the right reason (missing
 * module), not a test compile error.
 *
 * Covered contract points:
 * - The active-visitor count renders from the fixture (FR-020, V5).
 * - Top-5 active page rows render with path + active-visitor count, ranked
 *   by the fixture order (V5: top 5 paths in the trailing 5-minute window).
 * - Zero-visitor empty state: the empty fixture renders zero count and a
 *   dashed empty-panel for the pages section (US3-9 / E-EMPTY).
 * - No flag markup: the template's country-flag rows are removed (geo out of
 *   scope, research R11 / ui-components.md §4) — no `flag:*` classes, no
 *   `flags.css` import artifacts in the rendered DOM.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import { RealtimeCard } from './RealtimeCard.js';
import { realtimePopulated, realtimeEmpty } from './fixtures.js';

describe('RealtimeCard widget — static render contract (T024)', () => {
  it('renders the active-visitor count from the populated fixture', () => {
    // FR-020 / V5: the card shows the count of visitors active in the trailing
    // 5 minutes. The populated fixture has activeVisitors = 7.
    const { container } = render(<RealtimeCard data={realtimePopulated} />);

    // The count renders in a text-2xl element (template's live-count emphasis).
    const countEl = container.querySelector('.text-2xl');
    expect(countEl).not.toBeNull();
    expect(countEl?.textContent).toContain('7');
  });

  it('renders top active page rows with path and active-visitor count', () => {
    // V5: realtime top pages = top 5 paths in the trailing 5-minute window.
    // The populated fixture has 4 entries (< 5, which is valid — the max is 5).
    const { container } = render(<RealtimeCard data={realtimePopulated} />);

    // Each page row renders the path and its active-visitor count. The rows
    // appear in the fixture's ranked order (descending by activeVisitors).
    const pageEntries = realtimePopulated.topActivePages;
    for (const entry of pageEntries) {
      expect(container.textContent).toContain(entry.path);
      expect(container.textContent).toContain(String(entry.activeVisitors));
    }
  });

  it('renders zero active visitors and a dashed empty-panel for the empty fixture', () => {
    // US3-9 / E-EMPTY: the empty fixture has activeVisitors = 0 and no pages.
    // The count shows "0"; the pages section renders the dashed empty-panel
    // (template placeholder pattern, ui-components.md §5).
    const { container } = render(<RealtimeCard data={realtimeEmpty} />);

    // Zero count still renders.
    const countEl = container.querySelector('.text-2xl');
    expect(countEl).not.toBeNull();
    expect(countEl?.textContent).toContain('0');

    // The dashed empty-panel is present in the pages section.
    const dashed = container.querySelector('.border-dashed');
    expect(dashed).not.toBeNull();
    expect(dashed?.className).toContain('text-muted-foreground');
  });

  it('renders no country-flag markup (geo out of scope)', () => {
    // ui-components.md §4: "Country flag rows removed (geo out of scope); no
    // flags.css import." The rendered DOM must contain no `flag:*` classes
    // (the template uses `flag:US`, `flag:GB`, etc.) — asserted on the
    // populated fixture which would have shown flags in the template.
    const { container } = render(<RealtimeCard data={realtimePopulated} />);

    // No element carries a flag: class (the template's flag-icons convention).
    const flagElements = container.querySelectorAll('[class*="flag:"]');
    expect(flagElements).toHaveLength(0);

    // No element carries a "flag" class either (covers alternate flag CSS).
    const flagClassElements = container.querySelectorAll('.flag');
    expect(flagClassElements).toHaveLength(0);
  });

  it('renders within a card frame with the realtime title', () => {
    // The card frame (data-slot="card") and title are retained from the
    // template (ui-components.md §4: "Card frame, live-count emphasis").
    const { container } = render(<RealtimeCard data={realtimePopulated} />);

    const card = container.querySelector('[data-slot="card"]');
    expect(card).not.toBeNull();

    const title = container.querySelector('[data-slot="card-title"]');
    expect(title).not.toBeNull();
    expect(title?.textContent).toMatch(/realtime/i);
  });
});
