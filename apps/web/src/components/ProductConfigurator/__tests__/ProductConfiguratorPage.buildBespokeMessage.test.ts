/**
 * ProductConfiguratorPage.buildBespokeMessage.test.ts
 *
 * Pins the contract of the `buildBespokeMessage` helper extracted by
 * T8 (see `.docs/product-configurator-gotcha-tasks.md`).
 *
 * Rationale
 * ---------
 * The helper guards the boundary between the bespoke modal's free-text
 * `roomSize` field and the API's strict-enum `preferredProduct` field.
 * Its narrow signature (`productName: string`, `roomSize: string |
 * undefined`) makes it structurally impossible to leak the room size
 * into the strict enum, but the *content* of the produced message is
 * still part of the contract the design team relies on. The cases
 * below pin that content so accidental wording or punctuation changes
 * surface in CI rather than in production submissions.
 */

import { describe, it, expect } from 'vitest';

import { buildBespokeMessage } from '../ProductConfiguratorPage';

describe('buildBespokeMessage', () => {
  it('omits the "Preferred size:" clause when roomSize is undefined', () => {
    const message = buildBespokeMessage('Studio 25', undefined);

    expect(message).toBe('Bespoke enquiry via Studio 25 configurator.');
    expect(message).not.toContain('Preferred size:');
  });

  it('omits the "Preferred size:" clause when roomSize is an empty string', () => {
    /* An empty string is treated identically to `undefined` so callers
     * never need to pre-trim before invoking the helper. */
    const message = buildBespokeMessage('Studio 25', '');

    expect(message).toBe('Bespoke enquiry via Studio 25 configurator.');
    expect(message).not.toContain('Preferred size:');
  });

  it('appends the "Preferred size:" clause verbatim when roomSize is populated', () => {
    const message = buildBespokeMessage('Studio 25', '6m x 4m');

    expect(message).toBe(
      'Bespoke enquiry via Studio 25 configurator. Preferred size: 6m x 4m.',
    );
  });
});
