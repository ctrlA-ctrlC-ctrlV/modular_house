/**
 * cookie-policy.test.tsx
 *
 * Route-reachability integration test for the `/cookie-policy` page
 * (T054, T-F4 page half — US1-3/US4-2, N4, FR-005/FR-025/FR-027).
 *
 * T053's `cookieRegister.test.tsx` already proves that rendering `CookiePolicy`
 * directly produces a table matching `COOKIE_REGISTER` one-to-one. This suite
 * proves the complementary half: that the page is actually reachable through
 * the application's real route configuration at the `/cookie-policy` URL,
 * wrapped in the same `TemplateLayout` chrome every other public page uses
 * (header/footer/SEO — N4), rendering that same 1:1 table.
 *
 * Test-first (plan §4.3 ADD): authored before `cookieRegister.ts` (T055),
 * `CookiePolicy.tsx` (T056), and the route registration (T057) exist. The
 * suite is red for the missing `cookieRegister` module import (mirroring
 * T053's red state) until T055 lands, and stays red on route-reachability
 * grounds (`/cookie-policy` resolves to the 404 catch-all, not a table) until
 * T057 registers the route — the T053-T057 atomic unit (tasks.md execution
 * rule 4).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '../../App';

// The register module does not exist yet at T054 authoring time — this
// import fails, which is the expected red state (mirrors T053). T055 creates
// the module. Sourcing the expected rows from the same authoritative
// constant the page renders from (rather than a hardcoded duplicate list)
// keeps this suite coupled to the real register content (FR-027).
import { COOKIE_REGISTER } from '../../content/cookieRegister';

/**
 * Renders the full application at the given route inside the same provider
 * hierarchy used at runtime, mirroring `template-layout.test.tsx`'s
 * `renderRoute` helper — the full `App` tree (not just `CookiePolicy` in
 * isolation) is required so real route-matching decides whether
 * `/cookie-policy` resolves to the policy page or the 404 catch-all.
 */
function renderRoute(route: string): void {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

/**
 * Query the `<tbody>` from the rendered page, asserting it exists before
 * returning. Centralises the null check so individual tests can work with a
 * non-nullable reference without non-null assertions.
 */
function queryTbody(): HTMLTableSectionElement {
  const tbody = document.querySelector('table tbody');
  expect(tbody).not.toBeNull();
  return tbody as HTMLTableSectionElement;
}

/**
 * Read the text content of a table cell at the given index from a row,
 * asserting the cell exists.
 */
function cellText(row: HTMLTableRowElement, index: number): string {
  const cells = row.querySelectorAll('td');
  const cell = cells[index];
  expect(cell).toBeDefined();
  return cell?.textContent ?? '';
}

// ---------------------------------------------------------------------------
// Beacon transport safety (mirrors template-layout.test.tsx). Every public
// route is wrapped in `TemplateLayout`, which mounts the page-view beacon
// (T052) — `/cookie-policy` is no exception. `navigator.sendBeacon` is not
// implemented in jsdom and `fetch` must never reach a real network call from
// the test process (constitution I/III, research R1), so both transports are
// stubbed at the module boundary before any route renders.
// ---------------------------------------------------------------------------
const sendBeaconMock = vi.fn<(url: string, data: Blob) => boolean>();

beforeAll(() => {
  Object.defineProperty(navigator, 'sendBeacon', {
    value: sendBeaconMock,
    configurable: true,
    writable: true,
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, status: 204 } as Response)),
  );
});

beforeEach(() => {
  sendBeaconMock.mockReset();
  sendBeaconMock.mockReturnValue(true);
  // Clear cookies between tests so CookieBanner and the beacon's own
  // visitor/session cookies never leak state across renders.
  document.cookie.split(';').forEach((part) => {
    const name = part.trim().split('=')[0];
    if (name) document.cookie = `${name}=; max-age=0; path=/`;
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Cookie policy route reachability (T054, T-F4)', () => {
  it('renders a table with exactly one row per register entry at /cookie-policy', async () => {
    renderRoute('/cookie-policy');

    // The page mounts asynchronously behind TemplateLayout's route match;
    // wait for the table to appear before asserting on it.
    await waitFor(() => {
      expect(document.querySelector('table')).not.toBeNull();
    });

    const tbody = queryTbody();
    const rows = tbody.querySelectorAll('tr');
    expect(rows.length).toBe(COOKIE_REGISTER.length);
  });

  it('renders each row matching its register entry (name, purpose, category, duration)', async () => {
    renderRoute('/cookie-policy');

    await waitFor(() => {
      expect(document.querySelector('table')).not.toBeNull();
    });

    const tbody = queryTbody();
    const rows = tbody.querySelectorAll('tr');

    for (const entry of COOKIE_REGISTER) {
      const matchingRow = Array.from(rows).find((row) => {
        const cells = row.querySelectorAll('td');
        return cells.length > 0 && cellText(row, 0) === entry.name;
      });
      expect(matchingRow).toBeDefined();

      const row = matchingRow as HTMLTableRowElement;
      expect(cellText(row, 0)).toBe(entry.name);
      expect(cellText(row, 1)).toBe(entry.purpose);
      expect(cellText(row, 2)).toBe(entry.category);
      expect(cellText(row, 3)).toBe(entry.duration);
    }
  });

  it('renders no rows beyond the register — adding an entry needs no page change', async () => {
    renderRoute('/cookie-policy');

    await waitFor(() => {
      expect(document.querySelector('table')).not.toBeNull();
    });

    const tbody = queryTbody();
    const rows = tbody.querySelectorAll('tr');
    const registerNames = new Set(COOKIE_REGISTER.map((entry) => entry.name));

    for (const row of Array.from(rows)) {
      const cells = row.querySelectorAll('td');
      expect(cells.length).toBeGreaterThan(0);
      expect(registerNames.has(cellText(row, 0))).toBe(true);
    }
  });

  it('does not fall through to the 404 catch-all', async () => {
    renderRoute('/cookie-policy');

    await waitFor(() => {
      expect(document.querySelector('table')).not.toBeNull();
    });

    // A regression guard: if the route registration is ever removed, this
    // path would resolve to the NotFound page instead of a table, and the
    // heading below would be absent.
    expect(screen.queryByText(/page not found/i)).not.toBeInTheDocument();
  });
});
