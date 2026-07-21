/**
 * Traffic-source classification service (Phase 2, plan §2.4).
 *
 * Classifies a page-view referrer into one of the five `AnalyticsSourceGroup`
 * values using the precedence and hostname lists pinned in plan §2.4 (S1–S5,
 * FR-011). The service is used by `analyticsIngest` at ingest time to label
 * every stored event; source metrics later aggregate by each session's FIRST
 * stored event's group (S4, asserted at the query layer).
 *
 * Exports:
 *   - `SEARCH_HOSTS` / `SOCIAL_HOSTS` — extensible hostname constant arrays
 *     (extend-by-append, Open-Closed; plan §2.4 minimums included).
 *   - `OWN_HOSTS` — the public site's own hostnames; referrers matching these
 *     classify as DIRECT (S3).
 *   - `extractReferrerHost` — reduces a raw referrer string to its bare
 *     hostname (S5: never a scheme, path, query, fragment, or port).
 *   - `classify` — the precedence-driven entry point returning an
 *     `AnalyticsSourceGroup`.
 *
 * Matching semantics note (Pass 2 vs Pass 3): the matcher implemented here is
 * the happy-path matcher — a case-insensitive substring containment check
 * against the hostname. It correctly classifies unambiguous hostnames
 * (`www.google.com` -> SEARCH, `x.com` -> SOCIAL) but does NOT yet implement
 * the exact S2 registrable-second-level-label / dot-suffix / lookalike-rejection
 * semantics. Those are hardened in Pass 3 (T100/T101); T100's edge cases
 * (`notgoogle.com`, `notx.com`) are deliberately red against this matcher.
 */
import { type AnalyticsSourceGroup } from '@prisma/client';

// ---------------------------------------------------------------------------
// Extensible hostname lists (plan §2.4, Open-Closed — append to extend)
// ---------------------------------------------------------------------------

/**
 * Search-engine referrer hostnames (plan §2.4 S2). Each entry is the
 * registrable second-level label (e.g. `google`) for multi-TLD search engines
 * OR a dot-containing host (`x.com`-style) for single-host services. Extend by
 * appending only — never remove a pinned host.
 */
export const SEARCH_HOSTS: readonly string[] = [
  'google',
  'bing',
  'duckduckgo',
  'yahoo',
  'ecosia',
  'baidu',
  'yandex',
];

/**
 * Social-platform referrer hostnames (plan §2.4 S2). Dot-containing entries
 * (`x.com`, `t.co`) match the host exactly or as a `.`-suffix once the Pass 3
 * matcher lands; the Pass 2 substring matcher handles the common cases here.
 * Extend by appending only.
 */
export const SOCIAL_HOSTS: readonly string[] = [
  'facebook',
  'instagram',
  'twitter',
  'x.com',
  't.co',
  'linkedin',
  'pinterest',
  'tiktok',
  'youtube',
  'reddit',
];

/**
 * The public site's own hostnames. A referrer whose hostname matches an entry
 * here — exactly or as a `.`-suffix — classifies as DIRECT (S3): it represents
 * in-site navigation, not an external arrival. The production host
 * `modularhouse.ie` is the canonical site URL (mirrored by
 * `apps/web/src/utils/schema-generators.ts` BASE_URL and the routes-metadata
 * canonical URLs); `localhost` covers local development. Extend by appending
 * only (e.g. a `staging.modularhouse.ie` host if ever needed).
 */
export const OWN_HOSTS: readonly string[] = ['modularhouse.ie', 'localhost'];

// ---------------------------------------------------------------------------
// extractReferrerHost — S5: stored referrer is hostname only
// ---------------------------------------------------------------------------

/**
 * Reduce a raw referrer string to its bare hostname, lowercased, with no
 * scheme, path, query, fragment, or port (S5). Returns `null` for an empty,
 * whitespace-only, or unparsable referrer — the S3 DIRECT inputs.
 *
 * The raw referrer arrives from the beacon as `document.referrer`, which is
 * always an absolute URL (`https://host/path`). Bare hostnames are also
 * accepted so unit tests can pass `www.google.com` without a scheme; the
 * `://` heuristic distinguishes a real URL from a bare `host:port` pair.
 */
export function extractReferrerHost(
  referrer: string | null | undefined,
): string | null {
  // Reject non-strings, empty, and whitespace-only values up front (S3).
  if (typeof referrer !== 'string') {
    return null;
  }
  const trimmed = referrer.trim();
  if (trimmed === '') {
    return null;
  }

  try {
    // A real URL contains "://"; a bare hostname (or host:port) does not, so
    // prepend a scheme to let the URL parser extract the hostname uniformly.
    const withScheme = trimmed.includes('://') ? trimmed : `http://${trimmed}`;
    const url = new URL(withScheme);
    // `url.hostname` is already lowercased by the URL parser; the explicit
    // lowercase is a defensive no-op in case a future runtime changes that.
    const host = url.hostname.toLowerCase();
    return host === '' ? null : host;
  } catch {
    // `new URL` throws on genuinely malformed input (e.g. internal spaces) —
    // treat as unparsable -> DIRECT (S3).
    return null;
  }
}

// ---------------------------------------------------------------------------
// Internal matchers
// ---------------------------------------------------------------------------

/**
 * Return true when `host` matches an entry in `list`. The entry matches when it
 * appears as a case-insensitive substring of the lowercased `host`.
 *
 * Pass 2 happy-path matcher: sufficient for unambiguous hostnames
 * (`www.google.com` contains `google`; `x.com` contains `x.com`) and
 * deliberately naive about lookalikes (`notgoogle.com` also contains `google`)
 * so the Pass 3 edge suite (T100) fails red against it, driving the T101
 * hardening to exact S2 semantics.
 */
function matchesList(host: string, list: readonly string[]): boolean {
  for (const entry of list) {
    if (host.includes(entry)) {
      return true;
    }
  }
  return false;
}

/**
 * Return true when `host` is one of the site's own hostnames — either an exact
 * match or a `.`-suffix match (so `www.modularhouse.ie` matches the
 * `modularhouse.ie` entry). Own-host referrers classify as DIRECT (S3).
 *
 * Unlike `matchesList`, this uses exact/suffix matching rather than substring
 * containment: `notmodularhouse.ie` must NOT be treated as an own-host.
 */
function isOwnHost(host: string): boolean {
  for (const own of OWN_HOSTS) {
    if (host === own || host.endsWith(`.${own}`)) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// classify — the S1-precedence entry point
// ---------------------------------------------------------------------------

/**
 * Classify a page-view referrer into an `AnalyticsSourceGroup` per plan §2.4.
 *
 * Precedence (S1): CAMPAIGN (any non-empty `utmSource` present, or `adClick`
 * true) > SEARCH > SOCIAL > REFERRAL > DIRECT. The referrer-based groups are
 * mutually exclusive hostname categories; DIRECT (S3) is the fallback for
 * own-host, empty, and unparsable referrers.
 *
 * @param referrer  - raw `document.referrer` (full URL), a bare hostname, or
 *                     empty/null/undefined when absent or unparsable.
 * @param utmSource - the `utm_source` campaign tag, if present on the landing
 *                     URL. A non-empty value forces CAMPAIGN (S1).
 * @param adClick   - true when the landing URL carried a known ad click-ID
 *                     parameter (`gclid`, `fbclid`, ...). Forces CAMPAIGN (S1).
 */
export function classify(
  referrer: string | null | undefined,
  utmSource: string | null | undefined,
  adClick: boolean | null | undefined,
): AnalyticsSourceGroup {
  // S1: CAMPAIGN outranks every referrer-based group. A non-empty utmSource OR
  // a true adClick flag short-circuits to CAMPAIGN regardless of the referrer.
  const hasCampaignSignal =
    (typeof utmSource === 'string' && utmSource.trim().length > 0) ||
    adClick === true;
  if (hasCampaignSignal) {
    return 'CAMPAIGN';
  }

  // Reduce the referrer to its bare hostname (S5). null covers empty and
  // unparsable referrers -> DIRECT (S3).
  const host = extractReferrerHost(referrer);
  if (host === null) {
    return 'DIRECT';
  }

  // S3: the site's own hostname -> DIRECT (in-site navigation).
  if (isOwnHost(host)) {
    return 'DIRECT';
  }

  // S2: known search/social hostnames. SEARCH outranks SOCIAL per S1.
  if (matchesList(host, SEARCH_HOSTS)) {
    return 'SEARCH';
  }
  if (matchesList(host, SOCIAL_HOSTS)) {
    return 'SOCIAL';
  }

  // Any other external hostname is a REFERRAL.
  return 'REFERRAL';
}
