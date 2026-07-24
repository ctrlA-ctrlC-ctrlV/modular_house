/**
 * T037 — trafficSource classification unit tests (T-B4 basis).
 *
 * Asserts the plan §2.4 source-classification rules at the happy-path level
 * (Pass 2). Every assertion maps to a pinned §2 value:
 *   - S1 precedence: CAMPAIGN (any utmSource present, or adClick true) outranks
 *     SEARCH > SOCIAL > REFERRAL > DIRECT in every combination tested.
 *   - S2 happy-path list membership: known search/social referrer hostnames map
 *     to SEARCH/SOCIAL, and the exported SEARCH_HOSTS / SOCIAL_HOSTS constants
 *     contain at least the plan §2.4 host sets (the Open-Closed extension
 *     surface — adding a host is an append, never a replacement).
 *   - S3: referrers carrying the site's own hostname, the empty string, or an
 *     unparsable value all classify as DIRECT.
 *   - Unknown external hostname -> REFERRAL.
 *   - S5: classification consumes the referrer hostname only (scheme, path, and
 *     query never affect the result) and extractReferrerHost returns the bare
 *     hostname — never a scheme, path, or query string.
 *
 * The exact-vs-label S2 matching semantics (lookalike hosts such as
 * `notgoogle.com`, registrable second-level label extraction for multi-part
 * TLDs like `www.google.co.uk`, and dot-suffix matching) are deliberately
 * hardened in Pass 3 (T100/T101) — only unambiguous happy-path hostnames are
 * asserted here so this suite can go green on the Pass 2 matcher and T100 can
 * still fail red against it.
 *
 * Done when: the suite fails only because `trafficSource.ts` does not exist.
 */
import { describe, it, expect } from 'vitest';
import {
  SEARCH_HOSTS,
  SOCIAL_HOSTS,
  classify,
  extractReferrerHost,
} from '../../src/services/trafficSource.js';

describe('trafficSource classification (T037 — happy path)', () => {
  // -------------------------------------------------------------------------
  // S5 — extractReferrerHost returns the bare hostname only
  // -------------------------------------------------------------------------
  describe('S5: extractReferrerHost returns hostname only', () => {
    it('strips scheme, path, query, and fragment from a full URL', () => {
      expect(extractReferrerHost('https://www.google.com/search?q=hello#top')).toBe(
        'www.google.com',
      );
    });

    it('strips the port from a host with an explicit port', () => {
      expect(extractReferrerHost('http://localhost:3000/garden-rooms')).toBe('localhost');
    });

    it('parses a bare hostname (no scheme) as the hostname', () => {
      expect(extractReferrerHost('www.bing.com')).toBe('www.bing.com');
    });

    it('lowercases the hostname (case-insensitive storage, S2)', () => {
      expect(extractReferrerHost('https://WWW.Google.COM/')).toBe('www.google.com');
    });

    it('returns null for an empty string', () => {
      expect(extractReferrerHost('')).toBeNull();
    });

    it('returns null for a whitespace-only string', () => {
      expect(extractReferrerHost('   ')).toBeNull();
    });

    it('returns null for an unparsable value (spaces inside)', () => {
      expect(extractReferrerHost('not a valid url')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // S1 precedence — CAMPAIGN outranks every other group
  // -------------------------------------------------------------------------
  describe('S1 precedence: CAMPAIGN wins over everything', () => {
    it('utmSource present + search referrer -> CAMPAIGN', () => {
      expect(classify('https://www.google.com/', 'google', false)).toBe('CAMPAIGN');
    });

    it('utmSource present + social referrer -> CAMPAIGN', () => {
      expect(classify('https://www.facebook.com/', 'facebook', false)).toBe('CAMPAIGN');
    });

    it('utmSource present + unknown external referrer -> CAMPAIGN', () => {
      expect(classify('https://example.com/', 'newsletter', false)).toBe('CAMPAIGN');
    });

    it('utmSource present + own-host referrer -> CAMPAIGN', () => {
      // S1 puts CAMPAIGN above DIRECT even when the referrer is the site itself.
      expect(classify('https://modularhouse.ie/', 'summer-campaign', false)).toBe('CAMPAIGN');
    });

    it('utmSource present + empty referrer -> CAMPAIGN', () => {
      expect(classify('', 'summer-campaign', false)).toBe('CAMPAIGN');
    });

    it('adClick true + search referrer -> CAMPAIGN', () => {
      expect(classify('https://www.google.com/', undefined, true)).toBe('CAMPAIGN');
    });

    it('adClick true + empty referrer -> CAMPAIGN', () => {
      expect(classify('', undefined, true)).toBe('CAMPAIGN');
    });

    it('adClick true + own-host referrer -> CAMPAIGN', () => {
      expect(classify('https://modularhouse.ie/', undefined, true)).toBe('CAMPAIGN');
    });
  });

  // -------------------------------------------------------------------------
  // S2 happy-path list membership (no utm/adClick)
  // -------------------------------------------------------------------------
  describe('S2 happy-path: known search hosts -> SEARCH', () => {
    it('www.google.com -> SEARCH', () => {
      expect(classify('https://www.google.com/search', undefined, false)).toBe('SEARCH');
    });

    it('google.com -> SEARCH', () => {
      expect(classify('https://google.com/', undefined, false)).toBe('SEARCH');
    });

    it('www.bing.com -> SEARCH', () => {
      expect(classify('https://www.bing.com/', undefined, false)).toBe('SEARCH');
    });

    it('duckduckgo.com -> SEARCH', () => {
      expect(classify('https://duckduckgo.com/', undefined, false)).toBe('SEARCH');
    });
  });

  describe('S2 happy-path: known social hosts -> SOCIAL', () => {
    it('www.facebook.com -> SOCIAL', () => {
      expect(classify('https://www.facebook.com/', undefined, false)).toBe('SOCIAL');
    });

    it('facebook.com -> SOCIAL', () => {
      expect(classify('https://facebook.com/', undefined, false)).toBe('SOCIAL');
    });

    it('x.com -> SOCIAL (dot-containing entry, exact match)', () => {
      expect(classify('https://x.com/someone/status/1', undefined, false)).toBe('SOCIAL');
    });

    it('t.co -> SOCIAL (dot-containing entry, exact match)', () => {
      expect(classify('https://t.co/abc', undefined, false)).toBe('SOCIAL');
    });

    it('www.x.com -> SOCIAL (dot-containing entry, subdomain)', () => {
      expect(classify('https://www.x.com/', undefined, false)).toBe('SOCIAL');
    });
  });

  // -------------------------------------------------------------------------
  // S3 — own-host / empty / unparsable -> DIRECT
  // -------------------------------------------------------------------------
  describe('S3: own-host / empty / unparsable -> DIRECT', () => {
    it('own-host referrer (modularhouse.ie) -> DIRECT', () => {
      expect(classify('https://modularhouse.ie/garden-rooms', undefined, false)).toBe('DIRECT');
    });

    it('own-host referrer (www.modularhouse.ie) -> DIRECT', () => {
      expect(classify('https://www.modularhouse.ie/', undefined, false)).toBe('DIRECT');
    });

    it('own-host referrer (localhost dev origin) -> DIRECT', () => {
      expect(classify('http://localhost:3000/', undefined, false)).toBe('DIRECT');
    });

    it('empty referrer -> DIRECT', () => {
      expect(classify('', undefined, false)).toBe('DIRECT');
    });

    it('null referrer -> DIRECT', () => {
      expect(classify(null, undefined, false)).toBe('DIRECT');
    });

    it('unparsable referrer -> DIRECT', () => {
      expect(classify('not a valid url', undefined, false)).toBe('DIRECT');
    });
  });

  // -------------------------------------------------------------------------
  // REFERRAL — unknown external host
  // -------------------------------------------------------------------------
  describe('unknown external host -> REFERRAL', () => {
    it('example.com -> REFERRAL', () => {
      expect(classify('https://example.com/some/path', undefined, false)).toBe('REFERRAL');
    });

    it('an unknown blog host -> REFERRAL', () => {
      expect(classify('https://blog.someotherdomain.net/post', undefined, false)).toBe('REFERRAL');
    });
  });

  // -------------------------------------------------------------------------
  // S5 — classification consumes hostname only (path/query never affect result)
  // -------------------------------------------------------------------------
  describe('S5: classification consumes hostname only', () => {
    it('same hostname with different path/query yields the same group', () => {
      expect(classify('https://www.google.com/search?q=a', undefined, false)).toBe(
        classify('https://www.google.com/other?q=b', undefined, false),
      );
    });

    it('a referrer with a long query string classifies by hostname alone', () => {
      // The query string must not leak into matching (S5: hostname only).
      expect(
        classify('https://www.google.com/search?q=anything&hl=en&utm_id=xyz', undefined, false),
      ).toBe('SEARCH');
    });
  });

  // -------------------------------------------------------------------------
  // Exported constant arrays — Open-Closed extension surface (S2)
  // -------------------------------------------------------------------------
  describe('exported host lists contain the plan §2.4 hosts', () => {
    // The plan §2.4 minimum host sets. Both lists may grow (append-only); they
    // must never drop a pinned host.
    const REQUIRED_SEARCH_HOSTS = [
      'google',
      'bing',
      'duckduckgo',
      'yahoo',
      'ecosia',
      'baidu',
      'yandex',
    ] as const;
    const REQUIRED_SOCIAL_HOSTS = [
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
    ] as const;

    it('SEARCH_HOSTS contains every required search host', () => {
      for (const host of REQUIRED_SEARCH_HOSTS) {
        expect(SEARCH_HOSTS).toContain(host);
      }
    });

    it('SOCIAL_HOSTS contains every required social host', () => {
      for (const host of REQUIRED_SOCIAL_HOSTS) {
        expect(SOCIAL_HOSTS).toContain(host);
      }
    });
  });

  // -------------------------------------------------------------------------
  // T100 — E-SOURCE: exact S2 matching-semantics edge cases.
  // -------------------------------------------------------------------------
  // These cases are deliberately red against the Pass 2 substring matcher
  // (`matchesList`'s `host.includes(entry)` check matches `notgoogle.com`
  // against the `google` entry) and drive the T101 hardening to the exact S2
  // semantics: dot-containing entries match the host exactly or as a
  // `.`-suffix; single-token entries match the host's registrable
  // second-level label; matching is case-insensitive; lookalike hosts never
  // match.
  describe('T100 — S2 exact matching semantics (E-SOURCE)', () => {
    it('S1: utmSource present + search referrer -> CAMPAIGN (precedence re-asserted at the edge suite)', () => {
      expect(classify('https://www.google.com/', 'google', false)).toBe('CAMPAIGN');
    });

    it('S1: adClick true + search referrer -> CAMPAIGN (precedence re-asserted at the edge suite)', () => {
      expect(classify('https://www.google.com/', undefined, true)).toBe('CAMPAIGN');
    });

    it('S3: own-host referrer -> DIRECT (re-asserted at the edge suite)', () => {
      expect(classify('https://modularhouse.ie/', undefined, false)).toBe('DIRECT');
    });

    it('S3: unparsable referrer -> DIRECT (re-asserted at the edge suite)', () => {
      expect(classify('not a valid url', undefined, false)).toBe('DIRECT');
    });

    it('unknown external host -> REFERRAL (re-asserted at the edge suite)', () => {
      expect(classify('https://example.com/', undefined, false)).toBe('REFERRAL');
    });

    it('notgoogle.com -> REFERRAL, never SEARCH (lookalike hostname rejected)', () => {
      expect(classify('https://notgoogle.com/', undefined, false)).toBe('REFERRAL');
    });

    it('www.google.co.uk -> SEARCH (registrable second-level label match across a two-part TLD)', () => {
      expect(classify('https://www.google.co.uk/search', undefined, false)).toBe('SEARCH');
    });

    it('x.com matches exactly', () => {
      expect(classify('https://x.com/status/1', undefined, false)).toBe('SOCIAL');
    });

    it('x.com matches as a `.`-suffix (www.x.com)', () => {
      expect(classify('https://www.x.com/status/1', undefined, false)).toBe('SOCIAL');
    });

    it('notx.com does NOT match the x.com entry (lookalike hostname rejected)', () => {
      expect(classify('https://notx.com/', undefined, false)).toBe('REFERRAL');
    });

    it('matching is case-insensitive (GOOGLE.COM -> SEARCH)', () => {
      expect(classify('https://GOOGLE.COM/search', undefined, false)).toBe('SEARCH');
    });

    it('matching is case-insensitive for dot-containing entries (WWW.X.COM -> SOCIAL)', () => {
      expect(classify('https://WWW.X.COM/status/1', undefined, false)).toBe('SOCIAL');
    });
  });
});
