/**
 * ProductConfiguratorPage -- Main Configurator Component
 * =============================================================================
 *
 * PURPOSE:
 * Top-level component for the garden room product configurator page.
 * Renders a multi-step configuration workflow that guides the customer
 * through selecting exterior finish, interior finish, and optional add-ons
 * for their chosen garden room size.
 *
 * ARCHITECTURE:
 * - Receives a ConfiguratorProduct via props (resolved from the URL slug
 *   by the parent route component).
 * - Delegates state management to the useConfiguratorState hook, which
 *   handles step navigation, selection persistence, and price calculation.
 * - Composes child components (ProgressBar, StickySubHeader, FinishCard,
 *   AddonCard, FloorPlan, SummaryNavBar) to render each step's content.
 *
 * STEP SEQUENCE:
 * 0. Overview   -- Product introduction, specs, base price
 * 1. Exterior   -- Exterior cladding finish selection (with preview image)
 * 2. Interior   -- Interior wall finish selection (with preview image)
 * 3. Add-ons    -- Optional paid upgrades
 * 4. Summary    -- Configuration review, price breakdown, consultation CTA
 *
 * =============================================================================
 */

import React, { useState } from 'react';
import type { ConfiguratorProduct } from '../../types/configurator';
import { useConfiguratorState } from './useConfiguratorState';
import { ProgressBar } from './ProgressBar';
import { StickySubHeader } from './StickySubHeader';
import { FloorPlan } from './FloorPlan';
import { FinishCard } from './FinishCard';
import { AddonCard } from './AddonCard';
import { SummaryNavBar } from './SummaryNavBar';
import { CONFIGURATOR_STEPS } from './constants';
import { formatPriceCents } from './utils';
import './ProductConfigurator.css';


/* =============================================================================
   Component Props
   ============================================================================= */

interface ProductConfiguratorPageProps {
  /** The fully resolved product data for the current configurator instance. */
  product: ConfiguratorProduct;
}


/* =============================================================================
   ProductConfiguratorPage Component
   ============================================================================= */

/** Defines the available options for the preferred date dropdown. */
type DatePreference = 'asap' | 'select-date';

export const ProductConfiguratorPage: React.FC<ProductConfiguratorPageProps> = ({
  product,
}) => {
  const state = useConfiguratorState(product);

  /* -----------------------------------------------------------------------
     Local Form State -- Date Preference
     -----------------------------------------------------------------------
     Tracks whether the user wants the earliest available date or wishes
     to specify a particular date. When set to "select-date", a native
     date picker is rendered below the dropdown.
     ----------------------------------------------------------------------- */
  const [datePreference, setDatePreference] = useState<DatePreference>('asap');

  /* -----------------------------------------------------------------------
     Derived Lookup Values
     -----------------------------------------------------------------------
     Resolve selected finish IDs to their full FinishOption objects for
     rendering finish preview images and swatch colours.
     ----------------------------------------------------------------------- */
  const exteriorCategory = product.finishCategories.find((fc) => fc.slug === 'exterior');
  const interiorCategory = product.finishCategories.find((fc) => fc.slug === 'interior');

  const selectedExterior = exteriorCategory?.options.find(
    (opt) => opt.id === state.selections.exteriorFinishId
  );
  const selectedInterior = interiorCategory?.options.find(
    (opt) => opt.id === state.selections.interiorFinishId
  );

  /** Default wall colour for the floor plan when no exterior finish is selected */
  const wallColor = selectedExterior?.color ?? '#1a1a1a';

  /** The current step definition for conditional rendering */
  const currentStep = CONFIGURATOR_STEPS[state.stepIndex];


  /* -----------------------------------------------------------------------
     Step 0: Overview
     -----------------------------------------------------------------------
     Product introduction with hero floor plan, base price, specifications
     grid, glazing note, and included features (for 35/45 m2 models).
     ----------------------------------------------------------------------- */
  const renderOverviewStep = (): React.ReactNode => (
    <>
      {/* Step heading */}
      <div className="configurator__step-heading">
        <h2 className="configurator__step-title">{product.name}</h2>
        <p className="configurator__step-subtitle">{product.tagline}</p>
      </div>

      {/* Hero visual with floor plan and price */}
      <div className="configurator__hero-visual">
        <FloorPlan
          config={product.floorPlan}
          dimensions={product.dimensions}
          wallColor="#1a1a1a"
        />
        <div className="configurator__price-display">
          <div className="configurator__price-amount">
            {formatPriceCents(product.basePriceCentsInclVat)}
          </div>
          <div className="configurator__price-note">
            {product.pricingNote}
          </div>
        </div>
      </div>

      {/* Specifications grid */}
      <h3 className="configurator__specs-heading">What&apos;s included</h3>
      <div className="configurator__specs-grid">
        {product.specs.map((spec) => (
          <div key={spec.id} className="configurator__spec-card">
            <div className="configurator__spec-label">{spec.label}</div>
            <div className="configurator__spec-value">{spec.value}</div>
          </div>
        ))}
      </div>

      {/* Included features (displayed for products with bathroomKitchenPolicy = "included") */}
      {product.includedFeatures.length > 0 && (
        <div className="configurator__included-features">
          <h3 className="configurator__specs-heading">Included in base price</h3>
          {product.includedFeatures.map((feature) => (
            <div key={feature.id} className="configurator__included-feature">
              <div className="configurator__included-feature-name">{feature.name}</div>
              <div className="configurator__included-feature-desc">{feature.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Glazing note */}
      <div className="configurator__glazing-note">
        <strong>Glazing details:</strong> {product.glazingNote}
      </div>
    </>
  );


  /* -----------------------------------------------------------------------
     Step 1: Exterior Finish
     -----------------------------------------------------------------------
     Displays a finish preview image (or floor plan if no selection) and
     a row of selectable exterior finish swatch cards.
     ----------------------------------------------------------------------- */
  const renderExteriorStep = (): React.ReactNode => (
    <>
      <div className="configurator__step-heading">
        <h2 className="configurator__step-title">
          {exteriorCategory?.label ?? 'Exterior Finish'}
        </h2>
        <p className="configurator__step-subtitle">
          {exteriorCategory?.sublabel ?? `Choose the cladding colour for your ${product.name}`}
        </p>
      </div>

      {/* Hero area: show finish preview image when a finish is selected, otherwise floor plan */}
      <div className="configurator__hero-visual configurator__hero-visual--compact">
        {selectedExterior ? (
          <img
            key={selectedExterior.id}
            src={selectedExterior.imagePath}
            alt={`Exterior finish: ${selectedExterior.name}`}
            className="configurator__finish-preview"
          />
        ) : (
          <FloorPlan
            config={product.floorPlan}
            dimensions={product.dimensions}
            wallColor={wallColor}
          />
        )}
      </div>

      {/* Finish selection cards */}
      <div className="configurator__finish-row">
        {exteriorCategory?.options.map((finish) => (
          <FinishCard
            key={finish.id}
            finish={finish}
            isSelected={state.selections.exteriorFinishId === finish.id}
            onSelect={state.setExteriorFinish}
          />
        ))}
      </div>
    </>
  );


  /* -----------------------------------------------------------------------
     Step 2: Interior Finish
     -----------------------------------------------------------------------
     Same layout as exterior finish but using interior finish options and
     preview images.
     ----------------------------------------------------------------------- */
  const renderInteriorStep = (): React.ReactNode => (
    <>
      <div className="configurator__step-heading">
        <h2 className="configurator__step-title">
          {interiorCategory?.label ?? 'Interior Finish'}
        </h2>
        <p className="configurator__step-subtitle">
          {interiorCategory?.sublabel ?? `Select the interior wall finish for your ${product.name}`}
        </p>
      </div>

      {/* Hero area: show finish preview image when a finish is selected, otherwise floor plan */}
      <div className="configurator__hero-visual configurator__hero-visual--compact">
        {selectedInterior ? (
          <img
            key={selectedInterior.id}
            src={selectedInterior.imagePath}
            alt={`Interior finish: ${selectedInterior.name}`}
            className="configurator__finish-preview"
          />
        ) : (
          <FloorPlan
            config={product.floorPlan}
            dimensions={product.dimensions}
            wallColor={wallColor}
          />
        )}
      </div>

      {/* Finish selection cards */}
      <div className="configurator__finish-row">
        {interiorCategory?.options.map((finish) => (
          <FinishCard
            key={finish.id}
            finish={finish}
            isSelected={state.selections.interiorFinishId === finish.id}
            onSelect={state.setInteriorFinish}
          />
        ))}
      </div>
    </>
  );


  /* -----------------------------------------------------------------------
     Step 3: Add-ons
     -----------------------------------------------------------------------
     Vertically stacked toggleable add-on cards with a running total of
     selected add-on prices displayed below.
     ----------------------------------------------------------------------- */
  const renderAddonsStep = (): React.ReactNode => {
    const selectedAddons = product.addons.filter((a) =>
      state.selections.selectedAddonIds.includes(a.id)
    );
    const addonTotalCents = selectedAddons.reduce(
      (sum, a) => sum + a.priceCentsInclVat,
      0,
    );

    return (
      <>
        <div className="configurator__step-heading">
          <h2 className="configurator__step-title">Add-ons</h2>
          <p className="configurator__step-subtitle">
            Enhance your {product.name} with optional extras
          </p>
        </div>

        <div className="configurator__addons-list">
          {product.addons.map((addon) => (
            <AddonCard
              key={addon.id}
              addon={addon}
              isSelected={state.selections.selectedAddonIds.includes(addon.id)}
              onToggle={state.toggleAddon}
            />
          ))}
        </div>

        {/* Add-on running total (visible only when at least one add-on is selected) */}
        {selectedAddons.length > 0 && (
          <div className="configurator__addon-total">
            <span className="configurator__addon-total-label">Add-on total</span>
            <span className="configurator__addon-total-amount">
              +{formatPriceCents(addonTotalCents)}
            </span>
          </div>
        )}
      </>
    );
  };


  /* -----------------------------------------------------------------------
     Step 4: Summary (non-consultation view)
     -----------------------------------------------------------------------
     Displays the SummaryNavBar (tabbed view), price breakdown table, and
     a "Book Your Consultation" CTA button.
     ----------------------------------------------------------------------- */
  const renderSummaryStep = (): React.ReactNode => {
    const selectedAddons = product.addons.filter((a) =>
      state.selections.selectedAddonIds.includes(a.id)
    );

    return (
      <>
        <div className="configurator__step-heading">
          <h2 className="configurator__step-title">Your {product.name}</h2>
          <p className="configurator__step-subtitle">Review your configuration</p>
        </div>

        {/* Summary navigation bar (replaces floor plan per Instruction #5) */}
        <SummaryNavBar
          product={product}
          exteriorFinishId={state.selections.exteriorFinishId}
          interiorFinishId={state.selections.interiorFinishId}
        />

        {/* Price breakdown table */}
        <h3 className="configurator__specs-heading">Price breakdown</h3>
        <div className="configurator__price-breakdown">
          {/* Base product line */}
          <div className="configurator__price-line">
            <div>
              <div className="configurator__price-line-label">
                {product.name} &mdash; {product.dimensions.areaM2} m{'\u00B2'}
              </div>
              <div className="configurator__price-line-detail">
                {selectedExterior?.name ?? 'No'} exterior &middot; {selectedInterior?.name ?? 'No'} interior
              </div>
            </div>
            <span className="configurator__price-line-amount">
              {formatPriceCents(product.basePriceCentsInclVat)}
            </span>
          </div>

          {/* Add-on lines */}
          {selectedAddons.map((addon) => (
            <div key={addon.id} className="configurator__price-line configurator__price-line--addon">
              <span className="configurator__price-line-label">{addon.name}</span>
              <span className="configurator__price-line-amount">
                +{formatPriceCents(addon.priceCentsInclVat)}
              </span>
            </div>
          ))}

          {/* Total row */}
          <div className="configurator__price-total">
            <span className="configurator__price-total-label">Total</span>
            <span className="configurator__price-total-amount">
              {formatPriceCents(state.totalPriceCents)}
            </span>
          </div>
        </div>

        <div className="configurator__price-disclaimer">
          {product.pricingNote}
        </div>

        {/* CTA button */}
        <button
          type="button"
          className="configurator__cta-button"
          onClick={() => state.setShowConsultation(true)}
        >
          Send me my estimate &rarr;
        </button>
      </>
    );
  };


  /* -----------------------------------------------------------------------
     Step 4: Consultation Form View
     -----------------------------------------------------------------------
     Overlays the summary step with a contact form. Displays a summary
     of the current configuration and a "Back to summary" link.
     ----------------------------------------------------------------------- */
  const renderConsultationForm = (): React.ReactNode => (
    <div style={{ animation: 'configurator-fade-up 0.45s ease both' }}>
      <div className="configurator__step-heading">
        <h2 className="configurator__step-title">Just a few details to finalise your estimate</h2>
        <p className="configurator__step-subtitle">
          Your estimate will land in your inbox within 30 seconds
        </p>
      </div>

      <div className="configurator__form-group">
        {/* First Name field */}
        <div>
          <label className="configurator__form-label" htmlFor="cfg-name">First Name</label>
          <input
            id="cfg-name"
            type="text"
            placeholder="John Murphy"
            className="configurator__form-input"
          />
        </div>

        {/* Email field */}
        <div>
          <label className="configurator__form-label" htmlFor="cfg-email">Email</label>
          <input
            id="cfg-email"
            type="email"
            placeholder="john@email.com"
            className="configurator__form-input"
          />
        </div>

        {/* Mobile phone field */}
        <div>
          <label className="configurator__form-label" htmlFor="cfg-phone">Mobile</label>
          <input
            id="cfg-phone"
            type="tel"
            placeholder="081 2345678"
            className="configurator__form-input"
          />
        </div>

        {/* B1: Eircode field -- Irish postal code input placed after Mobile */}
        <div>
          <label className="configurator__form-label" htmlFor="cfg-eircode">Eircode</label>
          <input
            id="cfg-eircode"
            type="text"
            placeholder="D00 A000"
            className="configurator__form-input"
            autoComplete="postal-code"
          />
        </div>

        {/* B2: Preferred Date dropdown with conditional date picker.
            Defaults to "As Soon As Possible". When "Select Date" is chosen,
            a native date input is revealed below the dropdown. */}
        <div>
          <label className="configurator__form-label" htmlFor="cfg-date-preference">Preferred Date</label>
          <select
            id="cfg-date-preference"
            className="configurator__form-input"
            value={datePreference}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setDatePreference(e.target.value as DatePreference)
            }
          >
            <option value="asap">As Soon As Possible</option>
            <option value="select-date">Select Date</option>
          </select>
        </div>
        {datePreference === 'select-date' && (
          <div>
            <label className="configurator__form-label" htmlFor="cfg-date">Select your preferred date</label>
            <input id="cfg-date" type="date" className="configurator__form-input" />
          </div>
        )}

        {/* Message field (optional free-text area) */}
        <div>
          <label className="configurator__form-label" htmlFor="cfg-message">Message (optional)</label>
          <textarea
            id="cfg-message"
            rows={3}
            placeholder="Any questions or site details..."
            className="configurator__form-textarea"
          />
        </div>

        {/* B4: Anti-spam honeypot field.
            Positioned off-screen and hidden from assistive technology via
            aria-hidden. Bots that auto-fill all visible fields will populate
            this input, allowing the submission handler to silently reject
            the request without revealing the spam detection mechanism. */}
        <div className="configurator__form-honeypot" aria-hidden="true">
          <label htmlFor="cfg-security">What is the last 4 letters of SIEHTAWA?</label>
          <input
            id="cfg-security"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* B3: Configuration summary -- displays product name, dimensions,
            and selected finishes in a compact readable format. */}
        <div className="configurator__form-summary">
          Your configuration: <strong>{product.name}</strong>,{' '}
          {product.dimensions.widthM}m x {product.dimensions.depthM}m,{' '}
          <strong>{selectedExterior?.name ?? 'No exterior'}</strong>,{' '}
          <strong>{selectedInterior?.name ?? 'No interior'}</strong>
        </div>

        {/* Submit button */}
        <button type="button" className="configurator__form-submit">
          Submit &rarr;
        </button>

        {/* Back to summary link */}
        <button
          type="button"
          className="configurator__form-back"
          onClick={() => state.setShowConsultation(false)}
        >
          &larr; Back to summary
        </button>
      </div>
    </div>
  );


  /* -----------------------------------------------------------------------
     Step Content Router
     -----------------------------------------------------------------------
     Selects which step content to render based on the current step index
     and the consultation form visibility flag.
     ----------------------------------------------------------------------- */
  const renderStepContent = (): React.ReactNode => {
    if (currentStep?.id === 'summary' && state.showConsultation) {
      return renderConsultationForm();
    }

    switch (currentStep?.id) {
      case 'overview':
        return renderOverviewStep();
      case 'exterior':
        return renderExteriorStep();
      case 'interior':
        return renderInteriorStep();
      case 'addons':
        return renderAddonsStep();
      case 'summary':
        return renderSummaryStep();
      default:
        return null;
    }
  };


  /* -----------------------------------------------------------------------
     Render
     ----------------------------------------------------------------------- */
  return (
    <div className="configurator">
      {/* Apple-style sticky sub-header with product name and running price */}
      <StickySubHeader
        productName={product.name}
        totalPriceCents={state.totalPriceCents}
      />

      {/* Step progress indicator */}
      <ProgressBar
        currentStepIndex={state.stepIndex}
        highestCompletedStepIndex={state.highestCompletedStepIndex}
        onStepClick={state.goToStep}
      />

      {/* Step content area -- re-keyed on step change to trigger animation */}
      <div
        key={state.animationKey}
        className="configurator__content"
      >
        {renderStepContent()}
      </div>

      {/* Bottom navigation bar (hidden on summary step) */}
      {currentStep?.id !== 'summary' && (
        <div className="configurator__bottom-nav">
          {state.stepIndex > 0 ? (
            <button
              type="button"
              className="configurator__back-button"
              onClick={state.previousStep}
            >
              &larr; Back
            </button>
          ) : (
            /* Spacer to keep the Continue button right-aligned */
            <div />
          )}

          <button
            type="button"
            className={[
              'configurator__continue-button',
              !state.canProceed && 'configurator__continue-button--disabled',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={state.canProceed ? state.nextStep : undefined}
            disabled={!state.canProceed}
          >
            {currentStep?.id === 'addons' ? 'Review Configuration' : 'Continue \u2192'}
          </button>
        </div>
      )}
    </div>
  );
};
