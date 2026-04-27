/**
 * useConfiguratorState.persistence.test.ts
 *
 * Unit test for the sessionStorage allow-list contract enforced by the
 * configurator gotcha task list (T2, see
 * `.docs/product-configurator-gotcha-tasks.md`).
 *
 * Rationale
 * ---------
 * `formData` carries personally identifying information (name, email,
 * phone, Eircode, free-text message) and `formStatus` /
 * `quoteNumber` / `formError` / `formValidationErrors` represent
 * in-flight submission state that must not survive across page loads.
 * The hook therefore persists only `stepIndex`, `selections`, and
 * `highestCompletedStepIndex`. The assertion below pins that shape so
 * a future contributor cannot regress privacy by widening
 * `PersistedState` without updating this test.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useConfiguratorState } from '../useConfiguratorState';
import { CONFIGURATOR_PRODUCTS } from '../../../data/configurator-products';
import { SESSION_STORAGE_KEY_PREFIX } from '../constants';
import type { ConfiguratorProduct } from '../../../types/configurator';

/** Resolves the first product fixture; failing fast keeps assertions clear. */
function getAnyProduct(): ConfiguratorProduct {
  const product = CONFIGURATOR_PRODUCTS[0];
  if (!product) {
    throw new Error('Expected at least one product in CONFIGURATOR_PRODUCTS');
  }
  return product;
}

/** Keys permitted to appear in the persisted JSON payload. */
const PERMITTED_PERSISTED_KEYS = [
  'stepIndex',
  'selections',
  'highestCompletedStepIndex',
] as const;

describe('useConfiguratorState -- sessionStorage allow-list', () => {
  /* The hook reads from `sessionStorage` on mount, so an empty store
   * before each case guarantees the hook starts from default state. */
  beforeEach(() => {
    sessionStorage.clear();
  });

  it(
    'persists only the three allow-listed keys even after form data is filled',
    () => {
      const product = getAnyProduct();
      const { result } = renderHook(() => useConfiguratorState(product));

      /* Populate every form field, including the spam-trap honeypot.
       * If any of these values were accidentally added to
       * `PersistedState`, the JSON.parse below would expose them. */
      act(() => {
        result.current.updateFormField('firstName', 'Jane Doe');
        result.current.updateFormField('email', 'jane@example.com');
        result.current.updateFormField('phone', '+353871234567');
        result.current.updateFormField('eircode', 'D02XY45');
        result.current.updateFormField('message', 'Free-text PII payload');
        result.current.updateFormField('datePreference', 'asap');
        result.current.updateFormField('honeypot', 'bait');
      });

      const raw = sessionStorage.getItem(
        SESSION_STORAGE_KEY_PREFIX + product.slug,
      );
      expect(raw).not.toBeNull();

      /* Cast to `unknown` and narrow with a runtime check: the test
       * must reflect what is actually on disk, not what TypeScript
       * believes the shape to be. */
      const parsed: unknown = JSON.parse(raw as string);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Persisted payload is not an object');
      }

      const persistedKeys = Object.keys(parsed).sort();
      expect(persistedKeys).toEqual([...PERMITTED_PERSISTED_KEYS].sort());

      /* Defensive content check: even if the keys were renamed in a
       * regression, the raw serialised string must not contain any of
       * the user-supplied PII values. */
      const serialised = raw as string;
      expect(serialised).not.toContain('Jane Doe');
      expect(serialised).not.toContain('jane@example.com');
      expect(serialised).not.toContain('+353871234567');
      expect(serialised).not.toContain('D02XY45');
      expect(serialised).not.toContain('Free-text PII payload');
      expect(serialised).not.toContain('bait');
    },
  );
});
