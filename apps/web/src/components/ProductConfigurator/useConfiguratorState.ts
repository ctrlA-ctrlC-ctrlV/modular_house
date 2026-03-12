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
import type { ConfiguratorSelections } from './types';
import { CONFIGURATOR_STEPS, SESSION_STORAGE_KEY_PREFIX } from './constants';
import { calculateTotalPriceCents } from './utils';


/* =============================================================================
   Persisted State Shape
   -----------------------------------------------------------------------------
   The shape serialised to sessionStorage. Includes the step index so the
   user resumes where they left off.
   ============================================================================= */

interface PersistedState {
  stepIndex: number;
  selections: ConfiguratorSelections;
}


/* =============================================================================
   Hook Return Type
   ============================================================================= */

export interface ConfiguratorStateAPI {
  /** Zero-based index of the current step. */
  stepIndex: number;
  /** Incrementing key used to trigger step-change animations. */
  animationKey: number;
  /** The user's current selections across all steps. */
  selections: ConfiguratorSelections;
  /** Total configured price in euro cents (base + selected add-ons). */
  totalPriceCents: number;
  /** Whether the user has made the required selections to advance from the current step. */
  canProceed: boolean;
  /** Whether the consultation form overlay is visible on the summary step. */
  showConsultation: boolean;

  /** Navigate to a specific step by index (only backward navigation). */
  goToStep: (index: number) => void;
  /** Advance to the next step (if canProceed is true). */
  nextStep: () => void;
  /** Go back to the previous step. */
  previousStep: () => void;
  /** Set the selected exterior finish ID. */
  setExteriorFinish: (finishId: string) => void;
  /** Set the selected interior finish ID. */
  setInteriorFinish: (finishId: string) => void;
  /** Toggle an add-on selection on or off. */
  toggleAddon: (addonId: string) => void;
  /** Show or hide the consultation form on the summary step. */
  setShowConsultation: (show: boolean) => void;
}


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

const DEFAULT_SELECTIONS: ConfiguratorSelections = {
  exteriorFinishId: null,
  interiorFinishId: null,
  selectedAddonIds: [],
};


/* =============================================================================
   useConfiguratorState Hook
   ============================================================================= */

export function useConfiguratorState(product: ConfiguratorProduct): ConfiguratorStateAPI {
  /* -----------------------------------------------------------------------
     Initialise state from sessionStorage or defaults
     ----------------------------------------------------------------------- */
  const [stepIndex, setStepIndex] = useState<number>(() => {
    const persisted = loadPersistedState(product.slug);
    return persisted?.stepIndex ?? 0;
  });

  const [selections, setSelections] = useState<ConfiguratorSelections>(() => {
    const persisted = loadPersistedState(product.slug);
    return persisted?.selections ?? DEFAULT_SELECTIONS;
  });

  const [animationKey, setAnimationKey] = useState<number>(0);
  const [showConsultation, setShowConsultation] = useState<boolean>(false);


  /* -----------------------------------------------------------------------
     Persist state to sessionStorage whenever it changes
     ----------------------------------------------------------------------- */
  useEffect(() => {
    savePersistedState(product.slug, { stepIndex, selections });
  }, [product.slug, stepIndex, selections]);


  /* -----------------------------------------------------------------------
     Derived Values
     ----------------------------------------------------------------------- */
  const totalPriceCents = calculateTotalPriceCents(
    product.basePriceCentsInclVat,
    product.addons,
    selections.selectedAddonIds,
  );

  /** Determines whether the current step has all required selections. */
  const canProceed = (() => {
    const currentStep = CONFIGURATOR_STEPS[stepIndex];
    if (!currentStep) return false;

    switch (currentStep.id) {
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

  /** Navigate to a previously completed step by index. */
  const goToStep = useCallback((index: number) => {
    if (index < stepIndex) {
      setAnimationKey((k) => k + 1);
      setStepIndex(index);
      setShowConsultation(false);
    }
  }, [stepIndex]);

  /** Advance to the next step if the current step's requirements are met. */
  const nextStep = useCallback(() => {
    if (stepIndex < CONFIGURATOR_STEPS.length - 1) {
      setAnimationKey((k) => k + 1);
      setStepIndex((s) => s + 1);
      setShowConsultation(false);
    }
  }, [stepIndex]);

  /** Navigate one step backward. */
  const previousStep = useCallback(() => {
    if (stepIndex > 0) {
      setAnimationKey((k) => k + 1);
      setStepIndex((s) => s - 1);
      setShowConsultation(false);
    }
  }, [stepIndex]);


  /* -----------------------------------------------------------------------
     Selection Actions
     ----------------------------------------------------------------------- */

  const setExteriorFinish = useCallback((finishId: string) => {
    setSelections((prev) => ({ ...prev, exteriorFinishId: finishId }));
  }, []);

  const setInteriorFinish = useCallback((finishId: string) => {
    setSelections((prev) => ({ ...prev, interiorFinishId: finishId }));
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
     Return Stable API Object
     ----------------------------------------------------------------------- */
  return {
    stepIndex,
    animationKey,
    selections,
    totalPriceCents,
    canProceed,
    showConsultation,
    goToStep,
    nextStep,
    previousStep,
    setExteriorFinish,
    setInteriorFinish,
    toggleAddon,
    setShowConsultation,
  };
}
