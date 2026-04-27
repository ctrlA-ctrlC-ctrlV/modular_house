/**
 * useConfiguratorState -- Session-Persisted Configurator State Hook
 * =============================================================================
 *
 * PURPOSE:
 * Manages all configurator state -- current step, user selections, and
 * animation triggers -- with automatic session persistence. Restores the
 * user's previous selections when they revisit the page within the same
 * browser session.
 *
 * INSTRUCTION #6:
 * "Persist choices for the session -- once the customer selects an option
 * on any step, that choice is remembered for the duration of the session."
 *
 * DESIGN:
 * - State is persisted to sessionStorage, keyed by the product slug.
 * - The hook returns a stable API object containing the current state
 *   and all mutation functions, minimising re-renders in consumers.
 * - Step validation (canProceed) enforces that required selections are
 *   made before advancing to the next step.
 *
 * =============================================================================
 */

import { useState, useCallback, useEffect } from 'react';
import type { ConfiguratorProduct } from '../../types/configurator';
import type { ConfiguratorSelections, ConfiguratorFormData, FormStatus, ConfiguratorStep } from './types';
import { buildConfiguratorSteps, SESSION_STORAGE_KEY_PREFIX } from './constants';
import { buildDefaultSelections, calculateTotalPriceCents } from './utils';
import { apiClient } from '../../lib/apiClient';


/* =============================================================================
   Persisted State Shape
   -----------------------------------------------------------------------------
   The shape serialised to sessionStorage. Includes the step index so the
   user resumes where they left off.

   Allow-list policy
   -----------------
   The interface below is an explicit allow-list. Only the following
   three fields are permitted to cross the sessionStorage boundary:

     1. `stepIndex`                  -- resume position (non-PII).
     2. `selections`                 -- product configuration choices.
     3. `highestCompletedStepIndex`  -- progress-bar high-water mark.

   DO NOT add `formData`, `formStatus`, `quoteNumber`, `formError`, or
   `formValidationErrors` here. Those fields are intentionally
   session-fresh:

     - `formData` carries personally identifying information (name,
       email, phone, Eircode, free-text message). Persisting it would
       leak PII into shared/refreshed browsers and conflict with the
       privacy stance documented in
       `apps/web/src/components/ProductConfigurator/README.md`.
     - `formStatus`, `quoteNumber`, `formError`, and
       `formValidationErrors` represent in-flight submission state that
       must not be replayed on a subsequent page load -- a stale
       success screen or a stale validation error would mislead the
       user.

   The companion test
   `apps/web/src/components/ProductConfigurator/__tests__/useConfiguratorState.persistence.test.ts`
   pins this contract by asserting that the persisted JSON contains
   exactly the three keys listed above.
   ============================================================================= */

interface PersistedState {
  stepIndex: number;
  selections: ConfiguratorSelections;
  /** The furthest step index the user has reached during this session. */
  highestCompletedStepIndex: number;
}


/* =============================================================================
   Hook Return Type
   ============================================================================= */

export interface ConfiguratorStateAPI {
  /** The ordered step sequence for the current product (may include optional steps). */
  steps: ReadonlyArray<ConfiguratorStep>;
  /** Zero-based index of the current step. */
  stepIndex: number;
  /**
   * The highest step index the user has reached during this session.
   * Used by the ProgressBar to keep previously visited steps highlighted
   * and clickable even when the user navigates backward.
   */
  highestCompletedStepIndex: number;
  /** Incrementing key used to trigger step-change animations. */
  animationKey: number;
  /** The user's current selections across all steps. */
  selections: ConfiguratorSelections;
  /** Total configured price in euro cents (base + selected add-ons). */
  totalPriceCents: number;
  /**
   * Total configured price in euro cents using the product's pre-sale
   * ("original") base price instead of the live sale base price.
   *
   * The value is computed with the *same* add-on, floor-plan, and layout
   * deltas as `totalPriceCents`; only the base component differs. This
   * matches the campaign brief that discounts apply to the base price
   * only — add-ons and variant deltas are identical pre- and post-sale.
   *
   * Resolved to `undefined` when the active product does not carry any
   * promotional original price (neither the scalar
   * `originalBasePriceCentsInclVat` field nor a layout-specific entry in
   * `originalPriceCentsInclVatByLayoutId`). Consumers should treat
   * `undefined` as "no strikethrough renderable" and fall back to the
   * standard single-price layout.
   */
  originalTotalPriceCents: number | undefined;
  /** Whether the user has made the required selections to advance from the current step. */
  canProceed: boolean;
  /** Whether the consultation form overlay is visible on the summary step. */
  showConsultation: boolean;

  /* -- Form state --------------------------------------------------------- */

  /** Current values of all consultation form fields. */
  formData: ConfiguratorFormData;
  /** Lifecycle status of the form submission (idle, submitting, success, error). */
  formStatus: FormStatus;
  /** Quote number returned by the API after a successful submission. */
  quoteNumber: string;
  /** Human-readable error message when formStatus is "error". */
  formError: string;
  /** Per-field validation error messages, keyed by field name. Empty when valid. */
  formValidationErrors: Partial<Record<keyof ConfiguratorFormData, string>>;

  /* -- Navigation actions ------------------------------------------------- */

  /** Navigate to a specific step by index (any previously visited step). */
  goToStep: (index: number) => void;
  /** Advance to the next step (if canProceed is true). */
  nextStep: () => void;
  /** Go back to the previous step. */
  previousStep: () => void;
  /** Set the selected floor plan variant ID. Only relevant for products with floorPlanVariants. */
  setFloorPlanVariant: (variantId: string) => void;
  /** Set the selected interior layout option ID. Only relevant for products with layoutOptions. */
  setLayoutOption: (optionId: string) => void;
  /** Set the selected exterior finish ID. */
  setExteriorFinish: (finishId: string) => void;
  /** Set the selected interior finish ID. */
  setInteriorFinish: (finishId: string) => void;
  /** Toggle an add-on selection on or off. */
  toggleAddon: (addonId: string) => void;
  /** Show or hide the consultation form on the summary step. */
  setShowConsultation: (show: boolean) => void;

  /* -- Form actions ------------------------------------------------------- */

  /**
   * Update a single form field value. Accepts the field name and new value,
   * clearing any existing validation error for that field.
   */
  updateFormField: <K extends keyof ConfiguratorFormData>(field: K, value: ConfiguratorFormData[K]) => void;
  /**
   * Validate and submit the consultation form. Performs client-side
   * validation, checks the honeypot, then sends the data to the API.
   * On success, sets formStatus to "success" and stores the quote number.
   */
  submitForm: () => Promise<void>;
}


/* =============================================================================
   Honeypot Spam-Trap Constants
   -----------------------------------------------------------------------------
   The honeypot branch in `submitForm` short-circuits the network request
   when the hidden bait field is populated, but still presents a normal
   success screen so that automated agents cannot tell their submission
   was discarded.

   The placeholder quote number below is exported so that operators
   triaging a "submission marked successful but no email arrived" report
   can match against a single, well-known literal, and so that unit
   tests can assert the value without duplicating the magic string.

   See `apps/web/src/components/ProductConfigurator/README.md` section
   14 ("Gotchas") for the rationale and operator-visible behaviour.
   ============================================================================= */

/**
 * Placeholder quote number returned to the UI when a submission is
 * silently rejected by the honeypot trap. Any production quote follows
 * the format issued by the API (non-zero numeric suffix), so the
 * all-zero literal is a safe, recognisable sentinel.
 */
export const HONEYPOT_FAKE_QUOTE_NUMBER = 'Q0000000';


/* =============================================================================
   Session Storage Helpers
   ============================================================================= */

/** Reads the persisted configurator state from sessionStorage. */
function loadPersistedState(slug: string): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY_PREFIX + slug);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

/** Writes the configurator state to sessionStorage. */
function savePersistedState(slug: string, state: PersistedState): void {
  try {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY_PREFIX + slug,
      JSON.stringify(state),
    );
  } catch {
    /* sessionStorage may be unavailable in private browsing modes */
  }
}


/* =============================================================================
   Default Selections
   ============================================================================= */

/**
 * Fallback selections used only when merging persisted state that may
 * be missing newly added fields. Product-aware defaults (with pre-selected
 * finishes) are computed at runtime via buildDefaultSelections().
 */
const EMPTY_SELECTIONS: ConfiguratorSelections = {
  floorPlanVariantId: null,
  layoutOptionId: null,
  exteriorFinishId: null,
  interiorFinishId: null,
  selectedAddonIds: [],
};


/* =============================================================================
   Default Form Data
   -----------------------------------------------------------------------------
   Initial values for the consultation form fields. All text fields begin
   as empty strings; the date preference defaults to "asap" (earliest
   available). This constant is used both for initial state and for
   identifying a pristine form.
   ============================================================================= */

const DEFAULT_FORM_DATA: ConfiguratorFormData = {
  firstName: '',
  email: '',
  phone: '',
  eircode: '',
  datePreference: 'asap',
  selectedDate: '',
  message: '',
  honeypot: '',
};


/* =============================================================================
   Form Validation
   -----------------------------------------------------------------------------
   Client-side validation for the consultation form. Returns a map of
   field names to error messages. An empty map indicates the form is valid.

   Validation rules:
   - firstName: required, non-empty after trimming
   - email:     required, must match a basic email pattern
   - phone:     required, must contain only digits, spaces, hyphens, and +()
   - eircode:   required, must match the Irish Eircode alphanumeric format
   ============================================================================= */

/** Basic email pattern for client-side validation (not exhaustive). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Irish phone number pattern: digits, spaces, hyphens, plus, parentheses. */
const PHONE_PATTERN = /^[\d\s\-+()]+$/;

/** Irish Eircode pattern: alphanumeric characters and optional spaces. */
const EIRCODE_PATTERN = /^[A-Z0-9\s]+$/i;

/**
 * Validates all required consultation form fields and returns a map of
 * field-level error messages. Returns an empty object when all fields
 * pass validation.
 *
 * @param data - The current form field values to validate.
 * @returns A partial record mapping invalid field names to their error messages.
 */
function validateFormData(
  data: ConfiguratorFormData
): Partial<Record<keyof ConfiguratorFormData, string>> {
  const errors: Partial<Record<keyof ConfiguratorFormData, string>> = {};

  if (!data.firstName.trim()) {
    errors.firstName = 'First name is required';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.phone.trim()) {
    errors.phone = 'Mobile number is required';
  } else if (!PHONE_PATTERN.test(data.phone.trim())) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (!data.eircode.trim()) {
    errors.eircode = 'Eircode is required';
  } else if (!EIRCODE_PATTERN.test(data.eircode.trim())) {
    errors.eircode = 'Please enter a valid Eircode';
  }

  if (data.datePreference === 'select-date' && !data.selectedDate) {
    errors.selectedDate = 'Please select a date';
  }

  return errors;
}


/* =============================================================================
   useConfiguratorState Hook
   ============================================================================= */

export function useConfiguratorState(product: ConfiguratorProduct): ConfiguratorStateAPI {
  /* -----------------------------------------------------------------------
     Compute dynamic step sequence for this product
     -----------------------------------------------------------------------
     The step array is stable across renders because the product definition
     is a constant. Products with floorPlanVariants and/or layoutOptions
     receive additional steps prepended before the base sequence.
     ----------------------------------------------------------------------- */
  const steps = buildConfiguratorSteps(product);

  /* -----------------------------------------------------------------------
     Initialise state from sessionStorage or defaults
     -----------------------------------------------------------------------
     When loading persisted selections, merge with DEFAULT_SELECTIONS to
     ensure backward compatibility with older sessions that lack the new
     floorPlanVariantId and layoutOptionId fields.
     ----------------------------------------------------------------------- */
  const [stepIndex, setStepIndex] = useState<number>(() => {
    const persisted = loadPersistedState(product.slug);
    return persisted?.stepIndex ?? 0;
  });

  /* Compute product-aware default selections that pre-select the
     default exterior (Black) and interior (Stone) finishes. These
     defaults ensure a preview image is visible on first load. */
  const productDefaults = buildDefaultSelections(product);

  const [selections, setSelections] = useState<ConfiguratorSelections>(() => {
    const persisted = loadPersistedState(product.slug);
    /* Merge persisted selections over product defaults to preserve
       both session continuity and backward compatibility with older
       sessions that may lack newer selection fields. */
    return persisted?.selections
      ? { ...EMPTY_SELECTIONS, ...persisted.selections }
      : productDefaults;
  });

  const [highestCompletedStepIndex, setHighestCompletedStepIndex] = useState<number>(() => {
    const persisted = loadPersistedState(product.slug);
    return persisted?.highestCompletedStepIndex ?? 0;
  });

  const [animationKey, setAnimationKey] = useState<number>(0);
  const [showConsultation, setShowConsultation] = useState<boolean>(false);

  /* -----------------------------------------------------------------------
     Form State
     -----------------------------------------------------------------------
     Manages the consultation form fields, submission lifecycle status,
     server-returned quote number, error messages, and per-field validation
     errors. These values are NOT persisted to sessionStorage because the
     form should start fresh on each page load.
     ----------------------------------------------------------------------- */
  const [formData, setFormData] = useState<ConfiguratorFormData>(DEFAULT_FORM_DATA);
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [quoteNumber, setQuoteNumber] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [formValidationErrors, setFormValidationErrors] = useState<
    Partial<Record<keyof ConfiguratorFormData, string>>
  >({});


  /* -----------------------------------------------------------------------
     Persist state to sessionStorage whenever it changes
     ----------------------------------------------------------------------- */
  useEffect(() => {
    savePersistedState(product.slug, { stepIndex, selections, highestCompletedStepIndex });
  }, [product.slug, stepIndex, selections, highestCompletedStepIndex]);


  /* -----------------------------------------------------------------------
     Derived Values
     ----------------------------------------------------------------------- */
  const totalPriceCents = calculateTotalPriceCents(
    product.basePriceCentsInclVat,
    product.addons,
    selections.selectedAddonIds,
    product.floorPlanVariants,
    selections.floorPlanVariantId,
    product.layoutOptions,
    selections.layoutOptionId,
  );

  /* -----------------------------------------------------------------------
     Original (Pre-Sale) Total
     -----------------------------------------------------------------------
     Resolves the effective pre-sale base price for the current selections
     and feeds it through the shared total calculator with the same add-on,
     floor-plan, and layout deltas as the live total. The lookup order
     matches plan §5.3.1 (Option A):

       1. Per-layout original: `originalPriceCentsInclVatByLayoutId[layoutId]`
          when both the map and an active layout selection are available.
       2. Scalar fallback: the product-level `originalBasePriceCentsInclVat`.
       3. No promotional price: resolve to `undefined`, signalling the
          consuming UI to suppress the strikethrough layout.
     ----------------------------------------------------------------------- */
  const resolvedOriginalBaseCents: number | undefined = (() => {
    const perLayoutMap = product.originalPriceCentsInclVatByLayoutId;
    const activeLayoutId = selections.layoutOptionId;
    if (perLayoutMap && activeLayoutId && perLayoutMap[activeLayoutId] !== undefined) {
      return perLayoutMap[activeLayoutId];
    }
    return product.originalBasePriceCentsInclVat;
  })();

  const originalTotalPriceCents: number | undefined =
    resolvedOriginalBaseCents === undefined
      ? undefined
      : calculateTotalPriceCents(
          resolvedOriginalBaseCents,
          product.addons,
          selections.selectedAddonIds,
          product.floorPlanVariants,
          selections.floorPlanVariantId,
          product.layoutOptions,
          selections.layoutOptionId,
        );

  /** Determines whether the current step has all required selections. */
  const canProceed = (() => {
    const currentStep = steps[stepIndex];
    if (!currentStep) return false;

    switch (currentStep.id) {
      case 'floor-plan':
        return selections.floorPlanVariantId !== null;
      case 'layout':
        return selections.layoutOptionId !== null;
      case 'overview':
        return true;
      case 'exterior':
        return selections.exteriorFinishId !== null;
      case 'interior':
        return selections.interiorFinishId !== null;
      case 'addons':
        return true;
      case 'summary':
        return false;
      default:
        return false;
    }
  })();


  /* -----------------------------------------------------------------------
     Navigation Actions
     ----------------------------------------------------------------------- */

  /**
   * Resets the scroll position to the top of the visible viewport.
   *
   * The application layout uses a scrollable container
   * (<div class="theme-template ... overflow-y-auto">) rather than the
   * native window scroll. The html and body elements have overflow: hidden,
   * so window.scrollTo() has no effect. This helper locates the actual
   * scroll container via a DOM query and scrolls it to the origin.
   */
  const scrollToTop = useCallback(() => {
    const scrollContainer = document.querySelector<HTMLElement>(
      '.theme-template.overflow-y-auto',
    );
    if (scrollContainer) {
      scrollContainer.scrollTo(0, 0);
    }
  }, []);

  /**
   * Navigate to any previously visited step by index.
   * Permits both backward and forward navigation within the range of
   * steps the user has already completed (0 .. highestCompletedStepIndex).
   * Steps beyond the highest completed index remain unreachable.
   */
  const goToStep = useCallback((index: number) => {
    /* Block all step navigation once the confirmation screen is displayed.
       This prevents the user from accidentally leaving the success state
       by clicking a progress bar step. */
    if (formStatus === 'success') return;

    if (index <= highestCompletedStepIndex && index !== stepIndex) {
      setAnimationKey((k) => k + 1);
      setStepIndex(index);
      setShowConsultation(false);
      /* Reset the viewport to the top of the page so the user sees
         the beginning of the new step content rather than a position
         carried over from the previous step's scroll depth. */
      scrollToTop();
    }
  }, [stepIndex, highestCompletedStepIndex, formStatus, scrollToTop]);

  /**
   * Advance to the next step if the current step's requirements are met.
   * Updates highestCompletedStepIndex monotonically so previously visited
   * steps retain their completed state during backward navigation.
   */
  const nextStep = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      const newStepIndex = stepIndex + 1;
      setAnimationKey((k) => k + 1);
      setStepIndex(newStepIndex);
      setHighestCompletedStepIndex((prev) => Math.max(prev, newStepIndex));
      setShowConsultation(false);
      /* Reset the viewport to the top of the page so the incoming step
         content is visible from its beginning, not from a scroll position
         inherited from the outgoing step. */
      scrollToTop();
    }
  }, [stepIndex, steps.length, scrollToTop]);

  /** Navigate one step backward. */
  const previousStep = useCallback(() => {
    if (stepIndex > 0) {
      setAnimationKey((k) => k + 1);
      setStepIndex((s) => s - 1);
      setShowConsultation(false);
      /* Reset the viewport to the top of the page when navigating
         backward, ensuring consistency with forward navigation. */
      scrollToTop();
    }
  }, [stepIndex, scrollToTop]);


  /* -----------------------------------------------------------------------
     Selection Actions
     ----------------------------------------------------------------------- */

  const setExteriorFinish = useCallback((finishId: string) => {
    setSelections((prev) => ({ ...prev, exteriorFinishId: finishId }));
  }, []);

  const setInteriorFinish = useCallback((finishId: string) => {
    setSelections((prev) => ({ ...prev, interiorFinishId: finishId }));
  }, []);

  /**
   * Sets the selected floor plan variant ID. Used on the Floor Plan step
   * for products that define floorPlanVariants (currently The Studio 25m2).
   */
  const setFloorPlanVariant = useCallback((variantId: string) => {
    setSelections((prev) => ({ ...prev, floorPlanVariantId: variantId }));
  }, []);

  /**
   * Sets the selected interior layout option ID. Used on the Layout step
   * for products that define layoutOptions (currently The Studio 25m2).
   */
  const setLayoutOption = useCallback((optionId: string) => {
    setSelections((prev) => ({ ...prev, layoutOptionId: optionId }));
  }, []);

  const toggleAddon = useCallback((addonId: string) => {
    setSelections((prev) => {
      const isCurrentlySelected = prev.selectedAddonIds.includes(addonId);
      return {
        ...prev,
        selectedAddonIds: isCurrentlySelected
          ? prev.selectedAddonIds.filter((id) => id !== addonId)
          : [...prev.selectedAddonIds, addonId],
      };
    });
  }, []);


  /* -----------------------------------------------------------------------
     Form Actions
     -----------------------------------------------------------------------
     Provides controlled-input update and async submission logic for the
     consultation form. The updateFormField function clears the validation
     error for the modified field on every keystroke, providing real-time
     feedback. The submitForm function performs full validation, checks the
     honeypot, and dispatches the API request.
     ----------------------------------------------------------------------- */

  /**
   * Updates a single field in the form data state and clears any existing
   * validation error for that field. Uses a generic key constraint to
   * ensure type safety between field names and their corresponding values.
   */
  const updateFormField = useCallback(
    <K extends keyof ConfiguratorFormData>(field: K, value: ConfiguratorFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setFormValidationErrors((prev) => {
        if (prev[field]) {
          const next = { ...prev };
          delete next[field];
          return next;
        }
        return prev;
      });
    },
    [],
  );

  /**
   * Validates the form, checks the honeypot, and submits the configurator
   * enquiry to the backend API.
   *
   * Honeypot behaviour: if the hidden honeypot field contains any value,
   * the function silently simulates a successful submission (sets status
   * to "success" with a fake quote number) without sending a request,
   * preventing spam bots from detecting that their submission was rejected.
   *
   * On genuine success, the API-returned quote number is stored and the
   * form transitions to the "success" state. On failure, an error message
   * is stored and the form transitions to the "error" state, allowing the
   * user to retry.
   */
  const submitForm = useCallback(async () => {
    /* -- Client-side validation ------------------------------------------ */
    const errors = validateFormData(formData);
    if (Object.keys(errors).length > 0) {
      setFormValidationErrors(errors);
      return;
    }

    /* -- Honeypot check: silently fake success for bots -------------------
     *
     * When the hidden honeypot field carries any value the submission is
     * almost certainly automated. The user-facing UX is intentionally
     * indistinguishable from a successful request -- bots that detect a
     * rejection signal will adapt their attack surface, so denying that
     * signal is part of the mitigation.
     *
     * To preserve operator visibility (a real success and a silently
     * rejected bot otherwise look identical in production logs) the
     * branch emits a single structured warning. The log payload is
     * deliberately minimal: only the product slug and a millisecond
     * timestamp are reported. Submitting personally identifying form
     * fields would defeat the privacy stance of the wider configurator
     * (see PersistedState comment) and is therefore prohibited.
     *
     * The placeholder quote number is exported as
     * HONEYPOT_FAKE_QUOTE_NUMBER so triage tooling and tests can
     * reference the same literal as the runtime; see also
     * apps/web/src/components/ProductConfigurator/README.md section 14
     * "Gotchas". */
    if (formData.honeypot.trim() !== '') {
      console.warn('[configurator] honeypot triggered', {
        slug: product.slug,
        ts: Date.now(),
      });
      setFormStatus('success');
      setQuoteNumber(HONEYPOT_FAKE_QUOTE_NUMBER);
      return;
    }

    /* -- Build the preferred date value ----------------------------------- */
    const preferredDate =
      formData.datePreference === 'asap' ? 'asap' : formData.selectedDate;

    /* -- Resolve selected finish names for the API payload ---------------- */
    const exteriorCategory = product.finishCategories.find((fc) => fc.slug === 'exterior');
    const interiorCategory = product.finishCategories.find((fc) => fc.slug === 'interior');
    const exteriorName =
      exteriorCategory?.options.find((o) => o.id === selections.exteriorFinishId)?.name ?? '';
    const interiorName =
      interiorCategory?.options.find((o) => o.id === selections.interiorFinishId)?.name ?? '';

    /* -- Build comma-separated add-on slug list --------------------------- */
    const addonSlugs = product.addons
      .filter((a) => selections.selectedAddonIds.includes(a.id))
      .map((a) => a.slug)
      .join(',');

    /* -- Resolve optional floor plan and layout slugs --------------------- */
    const floorPlanVariant = product.floorPlanVariants?.find(
      (v) => v.id === selections.floorPlanVariantId
    );
    const layoutOption = product.layoutOptions?.find(
      (l) => l.id === selections.layoutOptionId
    );

    /* -- Transition to submitting state ----------------------------------- */
    setFormStatus('submitting');
    setFormError('');

    try {
      const response = await apiClient.submitEnquiry({
        firstName: formData.firstName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        eircode: formData.eircode.trim(),
        message: formData.message.trim() || undefined,
        consent: true,
        sourcePage: 'configurator',
        configuratorProductSlug: product.slug,
        configuratorExteriorFinish: exteriorName,
        configuratorInteriorFinish: interiorName,
        configuratorAddons: addonSlugs || undefined,
        configuratorTotalCents: totalPriceCents,
        configuratorFloorPlan: floorPlanVariant?.slug || undefined,
        configuratorLayout: layoutOption?.slug || undefined,
        preferredDate,
      });

      setQuoteNumber(response.quoteNumber);
      setFormStatus('success');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setFormError(message);
      setFormStatus('error');
    }
  }, [formData, product, selections, totalPriceCents]);


  /* -----------------------------------------------------------------------
     Return Stable API Object
     ----------------------------------------------------------------------- */
  return {
    steps,
    stepIndex,
    highestCompletedStepIndex,
    animationKey,
    selections,
    totalPriceCents,
    originalTotalPriceCents,
    canProceed,
    showConsultation,
    formData,
    formStatus,
    quoteNumber,
    formError,
    formValidationErrors,
    goToStep,
    nextStep,
    previousStep,
    setFloorPlanVariant,
    setLayoutOption,
    setExteriorFinish,
    setInteriorFinish,
    toggleAddon,
    setShowConsultation,
    updateFormField,
    submitForm,
  };
}
