/**
 * Product Configurator -- Constants & Step Builder
 * =============================================================================
 *
 * PURPOSE:
 * Defines the base step sequence and provides a builder function that
 * computes the full step sequence for any given product. Products with
 * optional floor plan variants or layout options receive additional steps
 * prepended before the base sequence.
 *
 * EXTENSIBILITY:
 * New steps can be added by appending an entry to BASE_STEPS and adding
 * the corresponding ConfiguratorStepId to types.ts. Products that define
 * floorPlanVariants or layoutOptions automatically receive the extra steps
 * without any modification to existing product definitions (Open-Closed
 * Principle).
 *
 * =============================================================================
 */

import type { ConfiguratorProduct } from '../../types/configurator';
import type { ConfiguratorStep } from './types';


/**
 * Base step sequence shared by all products. Products without optional
 * step arrays (floorPlanVariants, layoutOptions) receive exactly this
 * sequence. Products with those arrays receive additional steps prepended
 * before these base steps via buildConfiguratorSteps().
 */
const BASE_STEPS: ReadonlyArray<ConfiguratorStep> = [
  { id: 'overview',  label: 'Overview' },
  { id: 'exterior',  label: 'Exterior' },
  { id: 'interior',  label: 'Interior' },
  { id: 'addons',    label: 'Add-ons' },
  { id: 'summary',   label: 'Summary' },
];

/**
 * Legacy export for backward compatibility. Consumers that have not yet
 * migrated to buildConfiguratorSteps() continue to receive the base
 * 5-step sequence. This export will be removed once all consumers have
 * been updated.
 */
export const CONFIGURATOR_STEPS: ReadonlyArray<ConfiguratorStep> = BASE_STEPS;


/**
 * Computes the ordered step sequence for a given product.
 *
 * Inspects the product's optional data arrays to determine whether
 * additional steps should be prepended before the base sequence:
 *   - floorPlanVariants present and non-empty: prepends "Floor Plan" step
 *   - layoutOptions present and non-empty:     prepends "Layout" step
 *
 * Products without these arrays receive the unmodified BASE_STEPS (5 steps).
 * The Studio 25m2 product receives the full 7-step sequence:
 *   Floor Plan -> Layout -> Overview -> Exterior -> Interior -> Add-ons -> Summary
 *
 * @param product - The configurator product definition to build steps for.
 * @returns An ordered read-only array of configurator steps.
 */
export function buildConfiguratorSteps(
  product: ConfiguratorProduct,
): ReadonlyArray<ConfiguratorStep> {
  const prefixSteps: ConfiguratorStep[] = [];

  if (product.floorPlanVariants && product.floorPlanVariants.length > 0) {
    prefixSteps.push({ id: 'floor-plan', label: 'Floor Plan' });
  }

  if (product.layoutOptions && product.layoutOptions.length > 0) {
    prefixSteps.push({ id: 'layout', label: 'Layout' });
  }

  /* When no optional steps exist, return the base sequence directly
     to avoid allocating a new array on every call. */
  if (prefixSteps.length === 0) {
    return BASE_STEPS;
  }

  /* Products with floor plan variants (e.g., Studio-25) skip the overview
     step because the floor plan and layout steps already introduce the
     product. Other products retain the full base sequence. */
  const baseSteps = product.floorPlanVariants && product.floorPlanVariants.length > 0
    ? BASE_STEPS.filter((step) => step.id !== 'overview')
    : BASE_STEPS;

  return [...prefixSteps, ...baseSteps];
}

/* =============================================================================
   Default Finish Names
   -----------------------------------------------------------------------------
   Canonical finish names used to resolve the initial exterior and interior
   selections when no prior session state exists. These names are matched
   case-insensitively against the product's finish category options.

   - Exterior defaults to "Charcoal" composite cladding.
   - Interior defaults to "Stone" plasterboard finish.

   Centralising these values here ensures a single point of change if the
   default aesthetic is updated in the future.
   ============================================================================= */

export const DEFAULT_EXTERIOR_FINISH_NAME = 'Charcoal';
export const DEFAULT_INTERIOR_FINISH_NAME = 'Matt';


/**
 * Session storage key used to persist configurator state across
 * page navigations within the same browser session.
 * The product slug is appended at runtime to scope state per product
 * (e.g., "configurator-state:studio-25").
 */
export const SESSION_STORAGE_KEY_PREFIX = 'configurator-state:';
