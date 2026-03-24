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
 * The step order is determined by the step array returned from
 * buildConfiguratorSteps(), not by the string values themselves.
 *
 * - "floor-plan": Floor plan variant selection (optional, product-specific)
 * - "layout"    : Interior layout tier selection (optional, product-specific)
 * - "overview"  : Product introduction, base price, specifications
 * - "exterior"  : Exterior cladding finish selection
 * - "interior"  : Interior wall finish selection
 * - "addons"    : Optional paid upgrades
 * - "summary"   : Configuration review and consultation CTA
 */
export type ConfiguratorStepId =
  | 'floor-plan'
  | 'layout'
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
  /** Selected floor plan variant ID, or null if no variant step exists for this product. */
  floorPlanVariantId: string | null;
  /** Selected layout option ID, or null if no layout step exists for this product. */
  layoutOptionId: string | null;
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
   SECTION 4: (Reserved)
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


/* =============================================================================
   SECTION 6: CONSULTATION FORM DATA
   -----------------------------------------------------------------------------
   Represents the complete set of form field values captured in the
   consultation form on the summary step. All fields default to empty
   strings except datePreference which defaults to "asap".

   The honeypot field is an anti-spam mechanism: legitimate users never
   see or fill it, but automated bots that populate all fields will
   trigger a silent fake-success rejection.
   ============================================================================= */

/**
 * Allowed values for the preferred date dropdown on the consultation form.
 * "asap" indicates the customer wants the earliest available slot;
 * "select-date" reveals a native date picker for specific date selection.
 */
export type DatePreferenceValue = 'asap' | 'select-date';

/**
 * Captures all form field values from the consultation form.
 * Each field maps to a controlled input in the rendered form.
 */
export interface ConfiguratorFormData {
  /** Customer's first name (required). */
  firstName: string;
  /** Customer's email address (required). */
  email: string;
  /** Customer's mobile phone number (required). */
  phone: string;
  /** Irish postal code (required). */
  eircode: string;
  /** Whether the customer wants ASAP or a specific date. */
  datePreference: DatePreferenceValue;
  /** ISO date string when datePreference is "select-date", otherwise empty. */
  selectedDate: string;
  /** Optional free-text message from the customer. */
  message: string;
  /** Anti-spam honeypot field -- expected to remain empty for real users. */
  honeypot: string;
}


/* =============================================================================
   SECTION 7: FORM SUBMISSION STATUS
   -----------------------------------------------------------------------------
   Tracks the lifecycle of the consultation form submission. The status
   transitions are:
     idle -> submitting -> success | error
   Once in the "success" state, the confirmation screen is displayed and
   no further transitions occur.
   ============================================================================= */

/**
 * Discriminated status values for the form submission lifecycle.
 *
 * - "idle"       : Form is displayed, awaiting user input.
 * - "submitting" : Request is in flight; submit button shows a spinner.
 * - "success"    : Submission succeeded; confirmation screen is shown.
 * - "error"      : Submission failed; error message is displayed inline.
 */
export type FormStatus = 'idle' | 'submitting' | 'success' | 'error';
