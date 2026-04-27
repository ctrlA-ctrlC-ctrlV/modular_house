/**
 * useConfiguratorState.honeypot.test.ts
 *
 * Unit test for the spam-trap branch of `submitForm` introduced by the
 * configurator gotcha task list (T1, see
 * `.docs/product-configurator-gotcha-tasks.md`).
 *
 * Scope
 * -----
 * The honeypot branch is a privacy-sensitive piece of state-layer
 * logic: it must (a) short-circuit the network request entirely,
 * (b) present the same success UX as a real submission, and
 * (c) emit a single structured warning so operators can distinguish a
 * silent rejection from a genuine success when triaging "form said
 * success but no email arrived" reports.
 *
 * The assertions below pin all three behaviours so that any future
 * refactor of `submitForm` cannot accidentally regress one without
 * tripping the test.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import {
  useConfiguratorState,
  HONEYPOT_FAKE_QUOTE_NUMBER,
} from '../useConfiguratorState';
import { CONFIGURATOR_PRODUCTS } from '../../../data/configurator-products';
import { apiClient } from '../../../lib/apiClient';
import type { ConfiguratorProduct } from '../../../types/configurator';

/* ---------------------------------------------------------------------------
 * Module-level mock of the API client.
 * ---------------------------------------------------------------------------
 * Vitest hoists `vi.mock` calls to the top of the module before any
 * imports execute, so the mocked `submitEnquiry` is in place by the
 * time `useConfiguratorState` reads it. The mock returns a benign
 * shape that satisfies the call site even though the test never
 * expects it to be invoked. */
vi.mock('../../../lib/apiClient', () => ({
  apiClient: {
    submitEnquiry: vi.fn(async () => ({ quoteNumber: 'Q1234567' })),
  },
}));

/** Resolves the first product fixture that exposes the consultation form. */
function getAnyProduct(): ConfiguratorProduct {
  const product = CONFIGURATOR_PRODUCTS[0];
  if (!product) {
    throw new Error('Expected at least one product in CONFIGURATOR_PRODUCTS');
  }
  return product;
}

describe('useConfiguratorState -- honeypot branch', () => {
  /* The hook persists to `sessionStorage`, and the API mock retains
   * call history between cases. Both are reset before every test to
   * guarantee deterministic behaviour irrespective of execution
   * order. */
  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(apiClient.submitEnquiry).mockClear();
  });

  /* `console.warn` is spied so the structured log assertion can be
   * verified without polluting the test output. The spy is restored
   * after every case to avoid cross-test interference. */
  let warnSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it(
    'short-circuits to a fake success when the honeypot field is populated',
    async () => {
      const product = getAnyProduct();
      const { result } = renderHook(() => useConfiguratorState(product));

      /* Populate every required field with values that pass
       * `validateFormData`. Without this the validation guard would
       * trip first and the honeypot branch would never execute. */
      act(() => {
        result.current.updateFormField('firstName', 'Test User');
        result.current.updateFormField('email', 'test@example.com');
        result.current.updateFormField('phone', '+353871234567');
        result.current.updateFormField('eircode', 'D02XY45');
        result.current.updateFormField('datePreference', 'asap');
        /* The bait field: any non-empty string trips the trap. */
        result.current.updateFormField('honeypot', 'i-am-a-bot');
      });

      await act(async () => {
        await result.current.submitForm();
      });

      /* The user-facing UX must be indistinguishable from a real
       * success so that automated agents cannot infer rejection. */
      expect(result.current.formStatus).toBe('success');
      expect(result.current.quoteNumber).toBe(HONEYPOT_FAKE_QUOTE_NUMBER);

      /* No network request must be issued for honeypot-rejected
       * submissions -- this is the entire point of the trap. */
      expect(apiClient.submitEnquiry).not.toHaveBeenCalled();

      /* A single structured warning must be emitted carrying only the
       * product slug and a timestamp -- no PII may be logged. */
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const [message, payload] = warnSpy.mock.calls[0] as [string, unknown];
      expect(message).toBe('[configurator] honeypot triggered');
      expect(payload).toEqual({
        slug: product.slug,
        ts: expect.any(Number),
      });

      /* Defensive PII check: serialise the payload and assert that no
       * user-supplied form values leaked into the log. */
      const serialised = JSON.stringify(payload);
      expect(serialised).not.toContain('test@example.com');
      expect(serialised).not.toContain('Test User');
      expect(serialised).not.toContain('+353871234567');
      expect(serialised).not.toContain('D02XY45');
    },
  );

  it('exposes HONEYPOT_FAKE_QUOTE_NUMBER as the documented sentinel', () => {
    /* Pinning the literal as a constant ensures triage tooling and
     * tests stay aligned with the runtime value. */
    expect(HONEYPOT_FAKE_QUOTE_NUMBER).toBe('Q0000000');
  });
});
