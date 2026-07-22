/**
 * T053 — Cookie register consistency test (T-F11, US4-1).
 *
 * Asserts the cookie register is the single authoritative source of truth for
 * every cookie the product sets (FR-025/FR-026/FR-027, SC-011, DoD-4, K5):
 *
 * 1. **Phase 2 cookie coverage** — every cookie name Phase 2 code can set
 *    (`mh_vid`, `mh_sid` from beacon.ts; `mh_cookie_ack` from CookieBanner)
 *    appears in the register. This is the FR-027 guarantee: introducing a
 *    cookie requires a register entry.
 * 2. **K5 exact list** — the register contains exactly the cookies K5 pins:
 *    the three public `mh_*` cookies, the Phase 1 admin cookies (refresh —
 *    strictly necessary; theme/sidebar mirrors — functional), and the Google
 *    Analytics cookies (`_ga`, `_ga_<container-id>` — performance).
 * 3. **Register ↔ policy page 1:1 match** — rendering CookiePolicy produces a
 *    table with one row per register entry (name, purpose, category, duration),
 *    no extra or missing rows (FR-025, SC-011). Adding a register entry must
 *    surface on the policy page with no page change.
 *
 * This is a test-first file: authored BEFORE `cookieRegister.ts` (T055) and
 * `CookiePolicy.tsx` (T056) exist. The suite is red for the missing modules
 * (plan §4.3 ADD, tasks.md T053 "Done when: suite fails only because
 * cookieRegister.ts (and CookiePolicy) do not exist").
 *
 * File extension: `.tsx` (not `.ts` as in the task text) because the test
 * renders JSX via `renderPolicyPage`. Every JSX-rendering test in this project
 * uses `.tsx` — the vitest config includes both.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { HeaderProvider } from '../components/HeaderContext';

// The register module does not exist yet at T053 authoring time — the import
// fails, which is the expected red state. T055 creates the module.
import { COOKIE_REGISTER } from './cookieRegister';

// CookiePolicy does not exist yet at T053 authoring time — the import fails,
// which is the expected red state. T056 creates the page component.
import CookiePolicy from '../routes/CookiePolicy';

// ---------------------------------------------------------------------------
// Pinned cookie-name constants — sourced from the implementing modules so the
// test stays coupled to the real names rather than hardcoded strings that could
// drift. These modules already exist (T046 beacon, T050 CookieBanner).
// ---------------------------------------------------------------------------
import { VISITOR_COOKIE_NAME, SESSION_COOKIE_NAME } from '../analytics/beacon';
import { ACK_COOKIE_NAME } from '../components/CookieBanner';

// ---------------------------------------------------------------------------
// K5 exact list — the authoritative set of cookie names the register MUST
// contain (plan §2.1 K5). The three public cookies + Phase 1 admin cookies +
// Google Analytics cookies. This is the completeness floor: the register may
// not omit any of these, and the consistency test below also guards against
// extra entries to keep the register honest.
// ---------------------------------------------------------------------------

/**
 * The Phase 1 admin cookie names. Sourced from the Phase 1 code that sets them
 * (ThemeProvider.tsx, sidebar.tsx, routes/admin/auth.ts) so the test stays
 * coupled to the real names. These are documented here as the K5 admin set:
 *   - `refreshToken` — httpOnly refresh token (strictly necessary, set by the
 *     admin API on login/refresh/logout-cycle).
 *   - `admin_theme_mode` — theme preference mirror (functional, 30 days).
 *   - `admin_sidebar_collapsed` — sidebar preference mirror (functional, 30
 *     days, set by ThemeProvider).
 *   - `sidebar_state` — legacy sidebar state mirror (functional, 7 days, set
 *     by the SidebarProvider in sidebar.tsx).
 */
const ADMIN_COOKIE_NAMES = [
  'refreshToken',
  'admin_theme_mode',
  'admin_sidebar_collapsed',
  'sidebar_state',
] as const;

/**
 * The Google Analytics cookie names set by the retained GoogleTag (K5). The
 * `_ga_<container-id>` entry is a pattern — the actual cookie name includes the
 * GA4 container/measurement ID. The register documents the pattern (research
 * R9) since the container ID is environment-specific.
 */
const GA_COOKIE_NAMES = ['_ga', '_ga_<container-id>'] as const;

/**
 * The complete K5 exact list: every cookie name the register must contain.
 * Used for both the completeness check (register ⊇ K5) and the exact-match
 * check (register names === K5 names, no extras).
 */
const K5_EXACT_NAMES = [
  VISITOR_COOKIE_NAME, // 'mh_vid'
  SESSION_COOKIE_NAME, // 'mh_sid'
  ACK_COOKIE_NAME, // 'mh_cookie_ack'
  ...ADMIN_COOKIE_NAMES,
  ...GA_COOKIE_NAMES,
] as const;

// ---------------------------------------------------------------------------
// Test helpers.
// ---------------------------------------------------------------------------

/**
 * Render CookiePolicy inside HelmetProvider + MemoryRouter + HeaderProvider.
 * `CookiePolicy` calls `useHeaderConfig` (following the `routes/Privacy.tsx`
 * convention), and that hook throws outside a `HeaderProvider` — in the real
 * app, `TemplateLayout` supplies it (`components/TemplateLayout.tsx`), but
 * this unit-level register-vs-page diff renders `CookiePolicy` standalone, so
 * the provider is supplied directly here instead of pulling in the full
 * layout (T054's route-reachability suite covers the full-layout render).
 */
function renderPolicyPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <HeaderProvider>
          <CookiePolicy />
        </HeaderProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

/**
 * Query the <tbody> from the rendered policy page container, asserting it
 * exists before returning. Centralises the null check so the individual tests
 * can work with a non-nullable reference without non-null assertions.
 */
function queryTbody(container: HTMLElement): HTMLTableSectionElement {
  const tbody = container.querySelector('table tbody');
  expect(tbody).not.toBeNull();
  return tbody as HTMLTableSectionElement;
}

/**
 * Read the text content of a table cell at the given index from a row, asserting
 * the cell exists. Avoids non-null assertions on `NodeList[index]` which ESLint
 * flags, and avoids DOM type aliases (`NodeListOf`) that trigger `no-undef`.
 */
function cellText(row: HTMLTableRowElement, index: number): string {
  const cells = row.querySelectorAll('td');
  const cell = cells[index];
  expect(cell).toBeDefined();
  return cell?.textContent ?? '';
}

// ---------------------------------------------------------------------------
// Test suite.
// ---------------------------------------------------------------------------

describe('Cookie register consistency (T053, T-F11)', () => {
  // -------------------------------------------------------------------------
  // 1. Phase 2 cookie coverage — every cookie Phase 2 code can set appears in
  //    the register (FR-027).
  // -------------------------------------------------------------------------
  describe('Phase 2 cookie coverage', () => {
    it('contains mh_vid (beacon visitor cookie)', () => {
      const names = COOKIE_REGISTER.map((e) => e.name);
      expect(names).toContain(VISITOR_COOKIE_NAME);
    });

    it('contains mh_sid (beacon session cookie)', () => {
      const names = COOKIE_REGISTER.map((e) => e.name);
      expect(names).toContain(SESSION_COOKIE_NAME);
    });

    it('contains mh_cookie_ack (CookieBanner acknowledgment cookie)', () => {
      const names = COOKIE_REGISTER.map((e) => e.name);
      expect(names).toContain(ACK_COOKIE_NAME);
    });
  });

  // -------------------------------------------------------------------------
  // 2. K5 exact list — the register contains exactly the K5 cookies, no more,
  //    no fewer (plan §2.1 K5, FR-025).
  // -------------------------------------------------------------------------
  describe('K5 exact list', () => {
    it('contains every K5 cookie name', () => {
      const registerNames = COOKIE_REGISTER.map((e) => e.name);
      for (const k5Name of K5_EXACT_NAMES) {
        expect(registerNames).toContain(k5Name);
      }
    });

    it('contains no cookie name outside the K5 list', () => {
      const registerNames = COOKIE_REGISTER.map((e) => e.name).sort();
      const k5NamesSorted = [...K5_EXACT_NAMES].sort();
      expect(registerNames).toEqual(k5NamesSorted);
    });

    it('each entry has name, purpose, category, duration, and setBy', () => {
      for (const entry of COOKIE_REGISTER) {
        expect(typeof entry.name).toBe('string');
        expect(entry.name.length).toBeGreaterThan(0);
        expect(typeof entry.purpose).toBe('string');
        expect(entry.purpose.length).toBeGreaterThan(0);
        // category is one of the three pinned values
        expect([
          'strictly-necessary',
          'functional',
          'performance',
        ]).toContain(entry.category);
        expect(typeof entry.duration).toBe('string');
        expect(entry.duration.length).toBeGreaterThan(0);
        expect(typeof entry.setBy).toBe('string');
        expect(entry.setBy.length).toBeGreaterThan(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // 3. Register ↔ policy page 1:1 match — rendering CookiePolicy produces a
  //    table with exactly one row per register entry (FR-025, SC-011).
  //    This half stays red until T056 creates CookiePolicy.tsx.
  // -------------------------------------------------------------------------
  describe('Register ↔ policy page 1:1 match', () => {
    it('renders one table row per register entry', () => {
      const { container } = renderPolicyPage();

      // The policy page renders a <table> with one <tbody> row per register
      // entry. Query rows from the table body (not the header).
      const tbody = queryTbody(container);
      const rows = tbody.querySelectorAll('tr');
      expect(rows.length).toBe(COOKIE_REGISTER.length);
    });

    it('each rendered row matches the corresponding register entry (name, purpose, category, duration)', () => {
      const { container } = renderPolicyPage();

      const tbody = queryTbody(container);
      const rows = tbody.querySelectorAll('tr');

      // For each register entry, find the matching row by cookie name and
      // verify the row's cells contain the entry's purpose, category, and
      // duration. This catches both missing rows and mismatched content.
      for (const entry of COOKIE_REGISTER) {
        // Find the row whose first cell (name) matches this entry's name.
        const matchingRow = Array.from(rows).find((row) => {
          const cells = row.querySelectorAll('td');
          return cells.length > 0 && cellText(row, 0) === entry.name;
        });
        expect(matchingRow).toBeDefined();

        const row = matchingRow as HTMLTableRowElement;
        const cells = row.querySelectorAll('td');
        // Cell layout: [name, purpose, category, duration]
        expect(cells.length).toBeGreaterThanOrEqual(4);
        expect(cellText(row, 0)).toBe(entry.name);
        expect(cellText(row, 1)).toBe(entry.purpose);
        expect(cellText(row, 2)).toBe(entry.category);
        expect(cellText(row, 3)).toBe(entry.duration);
      }
    });

    it('renders no rows that do not correspond to a register entry', () => {
      const { container } = renderPolicyPage();

      const tbody = queryTbody(container);
      const rows = tbody.querySelectorAll('tr');

      // Every rendered row's name cell must correspond to a register entry.
      const registerNames = new Set(COOKIE_REGISTER.map((e) => e.name));
      for (const row of Array.from(rows)) {
        const cells = row.querySelectorAll('td');
        expect(cells.length).toBeGreaterThan(0);
        const rowName = cellText(row, 0);
        expect(registerNames.has(rowName)).toBe(true);
      }
    });
  });
});
