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

import React, { useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { ConfiguratorProduct } from '../../types/configurator';
import type { EnquiryFormData } from '@modular-house/ui';
import type { DatePreferenceValue } from './types';
import { apiClient } from '../../lib/apiClient';
import { useConfiguratorState } from './useConfiguratorState';
import { ProgressBar } from './ProgressBar';
import { StickySubHeader } from './StickySubHeader';
import { FloorPlan } from './FloorPlan';
import { ArchitecturalFloorPlan } from './ArchitecturalFloorPlan';
import { FinishCard } from './FinishCard';
import { AddonCard } from './AddonCard';
import { FloorPlanCard } from './FloorPlanCard';
import { LayoutCard } from './LayoutCard';
import { SummaryNavBar } from './SummaryNavBar';
import { BespokeHint } from './BespokeHint';
import { getStudioFloorPlanConfig } from '../../data/studio-floor-plans';
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

export const ProductConfiguratorPage: React.FC<ProductConfiguratorPageProps> = ({
  product,
}) => {
  const state = useConfiguratorState(product);


  /* -----------------------------------------------------------------------
     Bespoke Enquiry Handler
     -----------------------------------------------------------------------
     Submits the bespoke enquiry form data to the API, including the
     current configurator context (product, finishes, add-ons, total) so
     the internal team can see what configuration the customer was viewing
     before requesting a custom solution. Uses sourcePage 'bespoke' to
     distinguish this flow from standard configurator quotes.
     Uses useCallback to maintain a stable reference across re-renders.
     ----------------------------------------------------------------------- */
  const handleBespokeEnquiry = useCallback(async (data: EnquiryFormData): Promise<void> => {
    /* Maps the EnquiryFormModal payload to the API schema.
       The roomSize field is free-text and must not be assigned to
       preferredProduct, which is validated against a strict backend enum
       ('Garden Room' | 'House Extension'). The room size is appended to
       the bespoke enquiry message so the design team retains the detail. */
    const roomSizeNote = data.roomSize ? ` Preferred size: ${data.roomSize}.` : '';

    /* Resolve the currently selected finish names from the product data
       so they can be included in the bespoke submission payload for
       the internal team's context. */
    const selectedExteriorName = product.finishCategories
      .find((fc) => fc.slug === 'exterior')
      ?.options.find((o) => o.id === state.selections.exteriorFinishId)
      ?.name ?? '';
    const selectedInteriorName = product.finishCategories
      .find((fc) => fc.slug === 'interior')
      ?.options.find((o) => o.id === state.selections.interiorFinishId)
      ?.name ?? '';

    /* Build the comma-separated add-on slug list from the current
       configurator selections. */
    const addonSlugs = product.addons
      .filter((a) => state.selections.selectedAddonIds.includes(a.id))
      .map((a) => a.slug)
      .join(',');

    await apiClient.submitEnquiry({
      firstName: data.firstName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      preferredProduct: 'Garden Room',
      message: `Bespoke enquiry via ${product.name} configurator.${roomSizeNote}`,
      consent: data.consent,
      website: data.website,
      sourcePage: 'bespoke',
      configuratorProductSlug: product.slug,
      configuratorExteriorFinish: selectedExteriorName,
      configuratorInteriorFinish: selectedInteriorName,
      configuratorAddons: addonSlugs || undefined,
      configuratorTotalCents: state.totalPriceCents,
    });
  }, [product, state.selections, state.totalPriceCents]);


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

  /** The current step definition for conditional rendering */
  const currentStep = state.steps[state.stepIndex];

  /* Ref attached to the configurator root element for programmatic scrolling. */
  const configuratorRef = useRef<HTMLDivElement>(null);


  /* -----------------------------------------------------------------------
     Scroll-to-Top on Step Change
     -----------------------------------------------------------------------
     Scrolls the viewport to the top of the configurator container each
     time the active step changes. This ensures the customer always sees
     the beginning of the next step's content without manual scrolling.
     ----------------------------------------------------------------------- */
  useEffect(() => {
    configuratorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [state.stepIndex]);


  /* -----------------------------------------------------------------------
     Image Preloading
     -----------------------------------------------------------------------
     Eagerly loads all finish preview images into the browser cache when
     the component mounts. This eliminates the initial network delay that
     causes visible jitter when the user first selects each finish option.
     Subsequent selections serve the image from the disk/memory cache.
     ----------------------------------------------------------------------- */
  useEffect(() => {
    const imagePaths: string[] = [];
    for (const category of product.finishCategories) {
      for (const option of category.options) {
        imagePaths.push(option.imagePath, option.imageWebP, option.imageAvif);
      }
    }

    const preloaded: HTMLImageElement[] = imagePaths.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });

    /* Cleanup: dereference preloaded images when the component unmounts
       or the product changes, allowing garbage collection. */
    return () => {
      preloaded.length = 0;
    };
  }, [product.finishCategories]);


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
        {product.floorPlanVariants ? (() => {
          const selectedVariant = product.floorPlanVariants.find(
            (v) => v.id === state.selections.floorPlanVariantId
          );
          const selectedLayout = product.layoutOptions?.find(
            (l) => l.id === state.selections.layoutOptionId
          );
          const layoutSlug = selectedLayout?.slug;
          const imagePath =
            (layoutSlug && selectedVariant?.floorPlanImagesByLayout?.[layoutSlug]) ??
            selectedVariant?.floorPlanImagePath;
          return imagePath ? (
            <img
              src={imagePath}
              alt={`Floor plan: ${selectedVariant?.label ?? product.name}`}
              className="configurator__floor-plan-image"
            />
          ) : (
            <ArchitecturalFloorPlan
              config={getStudioFloorPlanConfig(
                (selectedVariant?.slug ?? '5x5') as '5x5' | '4x6',
                (selectedLayout?.slug as 'box' | 'en-suite' | 'bedroom') ?? null,
              )}
              wallColorOverride="#1a1a1a"
            />
          );
        })() : product.floorPlanImagePath ? (
          <img
            src={product.floorPlanImagePath}
            alt={`Floor plan: ${product.name}`}
            className="configurator__floor-plan-image"
          />
        ) : product.floorPlan ? (
          <FloorPlan
            config={product.floorPlan as import('../../types/configurator').FloorPlanConfig}
            dimensions={product.dimensions}
            wallColor="#1a1a1a"
          />
        ) : null}
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

      {/* Hero area: all exterior finish images are rendered simultaneously.
         Only the selected image receives the visible modifier class.
         This prevents React from unmounting/remounting <img> elements on
         each selection change, which would re-trigger the intro animation
         and cause visible jitter while the image loads from the network. */}
      <div className="configurator__hero-visual configurator__hero-visual--compact">
        {exteriorCategory?.options.map((finish) => (
          <picture
            key={finish.id}
            className={
              `configurator__finish-preview` +
              (state.selections.exteriorFinishId === finish.id
                ? ' configurator__finish-preview--active'
                : ' configurator__finish-preview--hidden')
            }
          >
            <source srcSet={finish.imageAvif} type="image/avif" />
            <source srcSet={finish.imageWebP} type="image/webp" />
            <img
              src={finish.imagePath}
              alt={`Exterior finish: ${finish.name}`}
            />
          </picture>
        ))}
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

      {/* Hero area: all interior finish images are rendered simultaneously.
         Visibility is toggled via CSS modifier classes rather than conditional
         mounting, mirroring the preloading strategy used on the exterior step. */}
      <div className="configurator__hero-visual configurator__hero-visual--compact">
        {interiorCategory?.options.map((finish) => (
          <picture
            key={finish.id}
            className={
              `configurator__finish-preview` +
              (state.selections.interiorFinishId === finish.id
                ? ' configurator__finish-preview--active'
                : ' configurator__finish-preview--hidden')
            }
          >
            <source srcSet={finish.imageAvif} type="image/avif" />
            <source srcSet={finish.imageWebP} type="image/webp" />
            <img
              src={finish.imagePath}
              alt={`Interior finish: ${finish.name}`}
            />
          </picture>
        ))}
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
     Step: Floor Plan Selection (products with floorPlanVariants only)
     -----------------------------------------------------------------------
     Displays a hero area with the currently selected floor plan and a row
     of selectable FloorPlanCard components. Supports two rendering modes:

     1. SVG Image mode: When a variant defines a `floorPlanImagePath`, the
        hero area renders an <img> element pointing to the pre-rendered SVG
        file. Used by products without layout-specific internal wall configs
        (e.g., The Grand 45m2).

     2. Architectural mode: When no `floorPlanImagePath` is present, the
        hero area renders the programmatic ArchitecturalFloorPlan component
        using the Studio-specific config lookup. Used by products with
        layout-dependent floor plans (e.g., The Studio 25m2).

     All variant visuals are rendered simultaneously with CSS visibility
     toggling to prevent unmount/remount jitter during selection changes.
     ----------------------------------------------------------------------- */
  const renderFloorPlanStep = (): React.ReactNode => {
    /* Determine the rendering mode from the first variant. All variants
       within a product consistently use the same mode. */
    const usesImageMode = product.floorPlanVariants?.[0]?.floorPlanImagePath != null;

    /* Resolve the currently selected layout slug so that variant visuals
       can reflect the layout when floorPlanImagesByLayout is available. */
    const selectedLayout = product.layoutOptions?.find(
      (l) => l.id === state.selections.layoutOptionId
    );
    const layoutSlug = selectedLayout?.slug;

    /* Resolve the currently selected floor plan variant so its
       priceDeltaCentsInclVat can be added to the product base price. */
    const selectedVariant = product.floorPlanVariants?.find(
      (v) => v.id === state.selections.floorPlanVariantId
    );

    /* Compute the base price for the selected floor plan variant.
       The variant's price delta is added to the product-level base price,
       allowing future pricing differentiation per footprint. */
    const variantBasePriceCents: number =
      product.basePriceCentsInclVat + (selectedVariant?.priceDeltaCentsInclVat ?? 0);

    return (
      <>
        {/* Step heading */}
        <div className="configurator__step-heading">
          <h2 className="configurator__step-title">Choose Your Floor Plan</h2>
          <p className="configurator__step-subtitle">
            Select the footprint for your {product.name}
          </p>
        </div>

        {/* Hero area: all floor plan variant visuals are rendered simultaneously.
            Only the visual matching the selected variant receives the visible
            modifier class. This CSS-based visibility toggle avoids React
            unmounting and remounting elements on each selection change,
            eliminating visual jitter during transitions. */}
        <div className="configurator__hero-visual configurator__hero-visual--compact">
          {product.floorPlanVariants?.map((variant) => {
            const imagePath =
              (layoutSlug && variant.floorPlanImagesByLayout?.[layoutSlug]) ??
              variant.floorPlanImagePath;
            return (
              <div
                key={variant.id}
                className={
                  'configurator__floor-plan-variant' +
                  (state.selections.floorPlanVariantId === variant.id
                    ? ' configurator__floor-plan-variant--active'
                    : ' configurator__floor-plan-variant--hidden')
                }
              >
                {usesImageMode && imagePath ? (
                  /* SVG image mode: renders the pre-designed floor plan SVG
                     as a standard image element. */
                  <img
                    src={imagePath}
                    alt={`Floor plan: ${variant.label}`}
                    className="configurator__floor-plan-image"
                  />
                ) : (
                  /* Architectural mode: renders the programmatic floor plan SVG
                     using the Studio-specific configuration lookup. */
                  <ArchitecturalFloorPlan
                    config={getStudioFloorPlanConfig(
                      variant.slug as '5x5' | '4x6',
                      null,
                    )}
                    wallColorOverride="#1a1a1a"
                  />
                )}
              </div>
            );
          })}

          {/* Base price display for the selected floor plan variant.
              Mirrors the Overview step's price block. The amount reacts
              to variant changes because priceDeltaCentsInclVat is summed
              with the product base price above. */}
          <div className="configurator__price-display">
            <div className="configurator__price-amount">
              {formatPriceCents(variantBasePriceCents)}
            </div>
            <div className="configurator__price-note">
              {product.pricingNote}
            </div>
          </div>
        </div>

        {/* Floor plan selection cards rendered in a horizontal row, matching
            the finish-row pattern used by Exterior, Interior, and Layout steps. */}
        <div className="configurator__floor-plan-row">
          {product.floorPlanVariants?.map((variant) => (
            <FloorPlanCard
              key={variant.id}
              variant={variant}
              isSelected={state.selections.floorPlanVariantId === variant.id}
              onSelect={state.setFloorPlanVariant}
            />
          ))}
        </div>
      </>
    );
  };


  /* -----------------------------------------------------------------------
     Step: Layout Selection (products with layoutOptions only)
     -----------------------------------------------------------------------
     Mirrors the Exterior and Interior finish step pattern: a central hero
     area displays the ArchitecturalFloorPlan SVG for the currently selected
     layout, and a row of compact LayoutCard components below allows the
     user to switch between available interior arrangements. The hero floor
     plan updates reactively when the selection changes. All layout SVGs
     are rendered simultaneously with CSS visibility toggling to prevent
     unmount/remount jitter, matching the image preloading strategy used
     on the finish steps.
     ----------------------------------------------------------------------- */
  const renderLayoutStep = (): React.ReactNode => {
    /* Resolve the currently selected floor plan variant slug to determine
       which architectural floor plan geometry set to render. */
    const selectedVariant = product.floorPlanVariants?.find(
      (v) => v.id === state.selections.floorPlanVariantId
    );
    const fpSlug = (selectedVariant?.slug ?? '5x5') as '5x5' | '4x6';
    const usesImageMode = selectedVariant?.floorPlanImagesByLayout != null;

    return (
      <>
        {/* Step heading */}
        <div className="configurator__step-heading">
          <h2 className="configurator__step-title">Choose Your Layout</h2>
          <p className="configurator__step-subtitle">
            Select the interior layout for your {product.name}
          </p>
        </div>

        {/* Hero area: all layout floor plans are rendered simultaneously.
            Only the plan matching the selected layout receives the visible
            modifier class. This CSS-based visibility toggle avoids React
            unmounting and remounting SVG elements on each selection change,
            eliminating visual jitter during transitions. */}
        <div className="configurator__hero-visual configurator__hero-visual--compact">
          {product.layoutOptions?.map((layout) => {
            const imagePath = selectedVariant?.floorPlanImagesByLayout?.[layout.slug];
            return (
              <div
                key={layout.id}
                className={
                  'configurator__layout-plan' +
                  (state.selections.layoutOptionId === layout.id
                    ? ' configurator__layout-plan--active'
                    : ' configurator__layout-plan--hidden')
                }
              >
                {usesImageMode && imagePath ? (
                  <img
                    src={imagePath}
                    alt={`Floor plan: ${selectedVariant?.label ?? ''} – ${layout.name}`}
                    className="configurator__floor-plan-image"
                  />
                ) : (
                  <ArchitecturalFloorPlan
                    config={getStudioFloorPlanConfig(
                      fpSlug,
                      layout.slug as 'box' | 'en-suite' | 'bedroom',
                    )}
                    wallColorOverride="#1a1a1a"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Layout selection cards rendered in a horizontal row, matching
            the finish-row pattern used by Exterior and Interior steps. */}
        <div className="configurator__layout-row">
          {product.layoutOptions?.map((layout) => (
            <LayoutCard
              key={layout.id}
              layout={layout}
              isSelected={state.selections.layoutOptionId === layout.id}
              onSelect={state.setLayoutOption}
              basePriceCents={product.basePriceCentsInclVat}
            />
          ))}
        </div>
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
    const selectedLayout = product.layoutOptions?.find(
      (l) => l.id === state.selections.layoutOptionId
    );

    return (
      <>
        <div className="configurator__step-heading">
          <h2 className="configurator__step-title">Your {product.name}</h2>
          <p className="configurator__step-subtitle">Review your configuration</p>
        </div>

        {/* Configuration summary sections -- stacked cards showing all
            selected options: floor plan, finishes, glazing, bathroom &
            kitchen, and other details in a single scrollable view. */}
        <SummaryNavBar
          product={product}
          exteriorFinishId={state.selections.exteriorFinishId}
          interiorFinishId={state.selections.interiorFinishId}
          floorPlanVariantId={state.selections.floorPlanVariantId}
          layoutOptionId={state.selections.layoutOptionId}
          selectedAddonIds={state.selections.selectedAddonIds}
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

          {/* Layout price delta (visible when a non-zero layout is selected) */}
          {selectedLayout && selectedLayout.priceDeltaCentsInclVat > 0 && (
            <div className="configurator__price-line configurator__price-line--addon">
              <span className="configurator__price-line-label">{selectedLayout.name} layout</span>
              <span className="configurator__price-line-amount">
                +{formatPriceCents(selectedLayout.priceDeltaCentsInclVat)}
              </span>
            </div>
          )}

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

        {/* Bespoke design hint -- a minimal, secondary prompt positioned
            below the primary CTA. Informs the customer that a fully custom
            design service exists without competing for visual attention
            with the estimate submission flow above. */}
        <BespokeHint onSubmit={handleBespokeEnquiry} />
      </>
    );
  };


  /* -----------------------------------------------------------------------
     Step 4: Consultation Form View
     -----------------------------------------------------------------------
     Overlays the summary step with a contact form. Displays a summary
     of the current configuration and a "Back to summary" link.
     ----------------------------------------------------------------------- */
  const renderConsultationForm = (): React.ReactNode => {
    /** Whether the form is currently being submitted to the API. */
    const isSubmitting = state.formStatus === 'submitting';

    return (
      <div style={{ animation: 'configurator-fade-up 0.45s ease both' }}>
        <div className="configurator__step-heading">
          <h2 className="configurator__step-title">Just a few details to finalise your estimate</h2>
          <p className="configurator__step-subtitle">
            Your estimate will land in your inbox within 30 seconds
          </p>
        </div>

        <div className="configurator__form-group">
          {/* First Name field (required) */}
          <div>
            <label className="configurator__form-label" htmlFor="cfg-name">First Name</label>
            <input
              id="cfg-name"
              type="text"
              placeholder="John Murphy"
              className={[
                'configurator__form-input',
                state.formValidationErrors.firstName && 'configurator__form-input--error',
              ].filter(Boolean).join(' ')}
              value={state.formData.firstName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                state.updateFormField('firstName', e.target.value)
              }
              disabled={isSubmitting}
            />
            {state.formValidationErrors.firstName && (
              <p className="configurator__form-field-error">{state.formValidationErrors.firstName}</p>
            )}
          </div>

          {/* Email field (required) */}
          <div>
            <label className="configurator__form-label" htmlFor="cfg-email">Email</label>
            <input
              id="cfg-email"
              type="email"
              placeholder="john@email.com"
              className={[
                'configurator__form-input',
                state.formValidationErrors.email && 'configurator__form-input--error',
              ].filter(Boolean).join(' ')}
              value={state.formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                state.updateFormField('email', e.target.value)
              }
              disabled={isSubmitting}
            />
            {state.formValidationErrors.email && (
              <p className="configurator__form-field-error">{state.formValidationErrors.email}</p>
            )}
          </div>

          {/* Mobile phone field (required) */}
          <div>
            <label className="configurator__form-label" htmlFor="cfg-phone">Mobile</label>
            <input
              id="cfg-phone"
              type="tel"
              placeholder="081 2345678"
              className={[
                'configurator__form-input',
                state.formValidationErrors.phone && 'configurator__form-input--error',
              ].filter(Boolean).join(' ')}
              value={state.formData.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                state.updateFormField('phone', e.target.value)
              }
              disabled={isSubmitting}
            />
            {state.formValidationErrors.phone && (
              <p className="configurator__form-field-error">{state.formValidationErrors.phone}</p>
            )}
          </div>

          {/* B1: Eircode field -- Irish postal code input placed after Mobile (required) */}
          <div>
            <label className="configurator__form-label" htmlFor="cfg-eircode">Eircode</label>
            <input
              id="cfg-eircode"
              type="text"
              placeholder="D00 A000"
              className={[
                'configurator__form-input',
                state.formValidationErrors.eircode && 'configurator__form-input--error',
              ].filter(Boolean).join(' ')}
              autoComplete="postal-code"
              value={state.formData.eircode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                state.updateFormField('eircode', e.target.value)
              }
              disabled={isSubmitting}
            />
            {state.formValidationErrors.eircode && (
              <p className="configurator__form-field-error">{state.formValidationErrors.eircode}</p>
            )}
          </div>

          {/* B2: Preferred Date dropdown with conditional date picker.
              Defaults to "As Soon As Possible". When "Select Date" is chosen,
              a native date input is revealed below the dropdown. */}
          <div>
            <label className="configurator__form-label" htmlFor="cfg-date-preference">Preferred Date</label>
            <select
              id="cfg-date-preference"
              className="configurator__form-input"
              value={state.formData.datePreference}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                state.updateFormField('datePreference', e.target.value as DatePreferenceValue)
              }
              disabled={isSubmitting}
            >
              <option value="asap">As Soon As Possible</option>
              <option value="select-date">Select Date</option>
            </select>
          </div>
          {state.formData.datePreference === 'select-date' && (
            <div>
              <label className="configurator__form-label" htmlFor="cfg-date">Select your preferred date</label>
              <input
                id="cfg-date"
                type="date"
                className={[
                  'configurator__form-input',
                  state.formValidationErrors.selectedDate && 'configurator__form-input--error',
                ].filter(Boolean).join(' ')}
                value={state.formData.selectedDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  state.updateFormField('selectedDate', e.target.value)
                }
                disabled={isSubmitting}
              />
              {state.formValidationErrors.selectedDate && (
                <p className="configurator__form-field-error">{state.formValidationErrors.selectedDate}</p>
              )}
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
              value={state.formData.message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                state.updateFormField('message', e.target.value)
              }
              disabled={isSubmitting}
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
              value={state.formData.honeypot}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                state.updateFormField('honeypot', e.target.value)
              }
            />
          </div>

          {/* B3: Configuration summary -- displays product name, dimensions,
              and selected finishes in a compact readable format. */}
          <div className="configurator__form-summary">
            Your configuration: <strong>{product.name}</strong>,{' '}
            {(() => {
              const fpVariant = product.floorPlanVariants?.find(
                (v) => v.id === state.selections.floorPlanVariantId
              );
              return fpVariant
                ? `${fpVariant.widthM}m x ${fpVariant.depthM}m`
                : `${product.dimensions.widthM}m x ${product.dimensions.depthM}m`;
            })()},{' '}
            {(() => {
              const lo = product.layoutOptions?.find(
                (l) => l.id === state.selections.layoutOptionId
              );
              return lo ? <><strong>{lo.name}</strong> layout,{' '}</> : null;
            })()}
            <strong>{selectedExterior?.name ?? 'No exterior'}</strong>,{' '}
            <strong>{selectedInterior?.name ?? 'No interior'}</strong>
          </div>

          {/* Form-level error message displayed when the submission fails */}
          {state.formStatus === 'error' && state.formError && (
            <div className="configurator__form-error" role="alert">
              {state.formError}
            </div>
          )}

          {/* Submit button -- shows loading indicator during submission */}
          <button
            type="button"
            className={[
              'configurator__form-submit',
              isSubmitting && 'configurator__form-submit--loading',
            ].filter(Boolean).join(' ')}
            onClick={state.submitForm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit \u2192'}
          </button>

          {/* Back to summary link (hidden during submission) */}
          {!isSubmitting && (
            <button
              type="button"
              className="configurator__form-back"
              onClick={() => state.setShowConsultation(false)}
            >
              &larr; Back to summary
            </button>
          )}
        </div>
      </div>
    );
  };


  /* -----------------------------------------------------------------------
     Step Content Router
     -----------------------------------------------------------------------
     Selects which step content to render based on the current step index
     and the consultation form visibility flag.
     ----------------------------------------------------------------------- */
  /* -----------------------------------------------------------------------
     Confirmation Screen (Post-Submission)
     -----------------------------------------------------------------------
     Apple-inspired success view rendered after a successful form submission.
     Features an animated SVG checkmark (circle scales in, then the check
     stroke draws itself), a thank-you heading, subtitle, quote number
     badge, and a pill-shaped "Back to Home" link.

     This view completely replaces the summary step content and is
     unreachable via the progress bar (the goToStep guard in
     useConfiguratorState prevents navigation when formStatus is "success").
     ----------------------------------------------------------------------- */
  const renderConfirmationScreen = (): React.ReactNode => (
    <div className="configurator__confirmation">
      {/* Animated checkmark SVG -- circle scales in, then stroke draws */}
      <div className="configurator__checkmark-container">
        <svg
          className="configurator__checkmark-svg"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle
            className="configurator__checkmark-circle"
            cx="40"
            cy="40"
            r="36"
            stroke="#1a1a1a"
            strokeWidth="3"
            fill="none"
          />
          <path
            className="configurator__checkmark-path"
            d="M24 40 L35 51 L56 30"
            stroke="#1a1a1a"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Heading and subtitle */}
      <h2 className="configurator__confirmation-title">
        Your estimate is on its way
      </h2>
      <p className="configurator__confirmation-subtitle">
        Check your inbox &mdash; your personalised estimate will arrive within 30 seconds.
      </p>

      {/* Quote number badge */}
      {state.quoteNumber && (
        <div className="configurator__confirmation-quote-badge">
          <span className="configurator__confirmation-quote-label">Quote Number</span>
          <span className="configurator__confirmation-quote-value">{state.quoteNumber}</span>
        </div>
      )}

      {/* Back to Home pill button */}
      <Link to="/" className="configurator__home-link">
        Back to Home
      </Link>
    </div>
  );


  /* -----------------------------------------------------------------------
     Step Content Router
     -----------------------------------------------------------------------
     Selects which step content to render based on the current step index
     and the consultation form visibility flag.
     ----------------------------------------------------------------------- */
  const renderStepContent = (): React.ReactNode => {
    /* Render the confirmation screen when the form submission has
       succeeded. This takes priority over all other summary views. */
    if (currentStep?.id === 'summary' && state.formStatus === 'success') {
      return renderConfirmationScreen();
    }

    if (currentStep?.id === 'summary' && state.showConsultation) {
      return renderConsultationForm();
    }

    switch (currentStep?.id) {
      case 'floor-plan':
        return renderFloorPlanStep();
      case 'layout':
        return renderLayoutStep();
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
    <div className="configurator" ref={configuratorRef}>
      {/* Apple-style sticky sub-header with product name and running price */}
      <StickySubHeader
        productName={product.name}
        totalPriceCents={state.totalPriceCents}
      />

      {/* Step progress indicator */}
      <ProgressBar
        steps={state.steps}
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
