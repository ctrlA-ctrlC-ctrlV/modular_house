/**
 * Product Configurator -- Constants
 * =============================================================================
 *
 * PURPOSE:
 * Defines the ordered step sequence and their display labels for the
 * configurator progress bar. Centralising this data here ensures that
 * both the ProgressBar component and the page-level navigation logic
 * reference the same source of truth.
 *
 * EXTENSIBILITY:
 * New steps can be added by appending an entry to CONFIGURATOR_STEPS and
 * adding the corresponding ConfiguratorStepId to types.ts. No existing
 * code requires modification (Open-Closed Principle).
 *
 * =============================================================================
 */

import type { ConfiguratorStep } from './types';


/**
 * Ordered list of configurator steps.
 * The array index determines the step position in the progress bar and
 * the navigation sequence. Step 0 is always the entry point.
 */
export const CONFIGURATOR_STEPS: ReadonlyArray<ConfiguratorStep> = [
  { id: 'overview',  label: 'Overview' },
  { id: 'exterior',  label: 'Exterior' },
  { id: 'interior',  label: 'Interior' },
  { id: 'addons',    label: 'Add-ons' },
  { id: 'summary',   label: 'Summary' },
];

/**
 * Session storage key used to persist configurator state across
 * page navigations within the same browser session.
 * The product slug is appended at runtime to scope state per product
 * (e.g., "configurator-state:studio-25").
 */
export const SESSION_STORAGE_KEY_PREFIX = 'configurator-state:';
