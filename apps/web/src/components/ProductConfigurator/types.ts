/**
 * Product Configurator -- Local UI State Types
 * =============================================================================
 *
 * PURPOSE:
 * Defines the TypeScript interfaces used exclusively within the Product
 * Configurator component tree to manage UI state, step navigation, and
 * user selections. These types are separate from the data model types
 * defined in types/configurator.ts, which represent the database schema.
 *
 * DESIGN:
 * - All interfaces are strictly typed with no use of `any`.
 * - State shapes are designed to be serialisable for potential session
 *   persistence (e.g., sessionStorage).
 * - The step definitions use a union type to prevent invalid step values
 *   at compile time.
 *
 * =============================================================================
 */


/* =============================================================================
   SECTION 1: STEP DEFINITIONS
   -----------------------------------------------------------------------------
   The configurator workflow follows a fixed sequence of steps. The step
   identifiers are used for both navigation state tracking and conditional
   rendering of step content.
   ============================================================================= */

/**
 * Identifies each step in the configurator workflow.
 * The step order is determined by the CONFIGURATOR_STEPS array, not by
 * the string values themselves.
 *
 * - "overview"  : Product introduction, base price, specifications
 * - "exterior"  : Exterior cladding finish selection
 * - "interior"  : Interior wall finish selection
 * - "addons"    : Optional paid upgrades
 * - "summary"   : Configuration review and consultation CTA
 */
export type ConfiguratorStepId =
  | 'overview'
  | 'exterior'
  | 'interior'
  | 'addons'
  | 'summary';


/* =============================================================================
   SECTION 2: CONFIGURATOR SELECTIONS
   -----------------------------------------------------------------------------
   Represents the complete set of user choices made during the configuration
   session. This state is persisted for the duration of the browser session
   using sessionStorage.
   ============================================================================= */

/**
 * Captures all user selections across every configurator step.
 * Each field corresponds to a step in the workflow and is `null` when
 * no selection has been made for that step.
 */
export interface ConfiguratorSelections {
  /** Selected exterior finish option ID, or null if not yet chosen. */
  exteriorFinishId: string | null;
  /** Selected interior finish option ID, or null if not yet chosen. */
  interiorFinishId: string | null;
  /** Array of selected add-on option IDs. Empty array means no add-ons selected. */
  selectedAddonIds: string[];
}


/* =============================================================================
   SECTION 3: STEP METADATA
   -----------------------------------------------------------------------------
   Static metadata for each configurator step. Used by the ProgressBar
   component to render step labels and by the navigation logic to determine
   step ordering and completion status.
   ============================================================================= */

/**
 * Describes a single step in the configurator progress bar.
 */
export interface ConfiguratorStep {
  /** Unique step identifier corresponding to ConfiguratorStepId. */
  id: ConfiguratorStepId;
  /** Human-readable label displayed in the progress bar. */
  label: string;
}


/* =============================================================================
   SECTION 4: SUMMARY TAB DEFINITIONS
   -----------------------------------------------------------------------------
   Tab identifiers for the summary page navigation bar that replaces the
   floor plan area. Each tab displays the user's selection for that
   configuration category.
   ============================================================================= */

/* =============================================================================
   SECTION 5: STEP PROGRESS TRACKING
   -----------------------------------------------------------------------------
   Tracks the highest step index the user has reached during the current
   configuration session. This value is persisted alongside the step index
   and selections so that previously completed steps remain highlighted
   and navigable even when the user navigates backward.
   ============================================================================= */

/**
 * The zero-based index of the highest step the user has completed.
 * Used by the ProgressBar to determine which steps display a checkmark
 * and remain clickable regardless of the current step position.
 *
 * Default value is 0 (only the overview step has been viewed).
 * Updated monotonically -- it never decreases during a session.
 */
export type HighestCompletedStepIndex = number;


/**
 * Identifies each tab available on the summary page navigation bar.
 */
export type SummaryTabId =
  | 'exterior-finish'
  | 'interior-finish'
  | 'glazing'
  | 'other-details';
