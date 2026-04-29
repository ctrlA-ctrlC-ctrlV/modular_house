/**
 * SummaryNavBar -- Configuration Summary Sections
 * =============================================================================
 *
 * PURPOSE:
 * Renders a vertically stacked set of summary section cards on the
 * configurator Summary step. Each section displays the user's selection
 * for one configuration category: Floor Plan, Exterior Finish, Interior
 * Finish, Glazing, Bathroom & Kitchen, and Other Details.
 *
 * DESIGN:
 * All sections are visible simultaneously (no tab switching required),
 * giving the customer a complete at-a-glance overview of their configured
 * garden room before requesting an estimate. The component receives the
 * full product data and user selections, then resolves display values
 * internally using helper functions.
 *
 * EXTENSIBILITY:
 * New summary sections can be added by defining a new render function
 * and appending it to the return JSX without modifying existing section
 * renderers (Open-Closed Principle).
 *
 * =============================================================================
 */

import React from 'react';
import type {
  ConfiguratorProduct,
  FinishOption,
  FloorPlanVariant,
  LayoutOption,
} from '../../types/configurator';
import { FloorPlan } from './FloorPlan';
import { ArchitecturalFloorPlan } from './ArchitecturalFloorPlan';
import { getStudioFloorPlanConfig } from '../../data/studio-floor-plans';
import { formatPriceCents, filterAddonsByPolicy } from './utils';
import { PRODUCT_SHOWCASE_WARRANTIES } from '../../data/garden-room-data';
import { HoverButton } from '@modular-house/ui';


/* =============================================================================
   Component Props
   ============================================================================= */

interface SummaryNavBarProps {
  /** Full product data for resolving selections to display values. */
  product: ConfiguratorProduct;
  /** ID of the selected exterior finish option, or null if not yet chosen. */
  exteriorFinishId: string | null;
  /** ID of the selected interior finish option, or null if not yet chosen. */
  interiorFinishId: string | null;
  /** ID of the selected floor plan variant, or null if the product has no variants. */
  floorPlanVariantId: string | null;
  /** ID of the selected layout option, or null if the product has no layout options. */
  layoutOptionId: string | null;
  /** Array of selected add-on option IDs. Empty when no add-ons are selected. */
  selectedAddonIds: ReadonlyArray<string>;
}


/* =============================================================================
   Helper -- Resolve Finish Option by ID
   ============================================================================= */

/**
 * Finds a FinishOption within a product's finish categories by its ID.
 * Searches the category matching the given slug for an option with the
 * specified ID. Returns undefined if the category or option is not found.
 */
function resolveFinishOption(
  product: ConfiguratorProduct,
  finishId: string | null,
  categorySlug: string,
): FinishOption | undefined {
  if (!finishId) return undefined;

  const category = product.finishCategories.find((fc) => fc.slug === categorySlug);
  return category?.options.find((opt) => opt.id === finishId);
}


/* =============================================================================
   SummaryNavBar Component
   ============================================================================= */

export const SummaryNavBar: React.FC<SummaryNavBarProps> = ({
  product,
  exteriorFinishId,
  interiorFinishId,
  floorPlanVariantId,
  layoutOptionId,
  selectedAddonIds,
}) => {
  /* -----------------------------------------------------------------------
     Derived Values
     -----------------------------------------------------------------------
     Resolve selected IDs to their full option objects for rendering
     display names, images, swatches, and layout feature flags.
     ----------------------------------------------------------------------- */
  const exteriorFinish = resolveFinishOption(product, exteriorFinishId, 'exterior');
  const interiorFinish = resolveFinishOption(product, interiorFinishId, 'interior');

  const selectedVariant: FloorPlanVariant | undefined = product.floorPlanVariants?.find(
    (v) => v.id === floorPlanVariantId,
  );

  const selectedLayout: LayoutOption | undefined = product.layoutOptions?.find(
    (l) => l.id === layoutOptionId,
  );

  /* The add-on summary list reads from the policy-filtered collection
     so the Summary section stays consistent with the Add-ons step and
     the configurator's price totals. A `'not-available'` policy cannot
     surface a Bathroom or Kitchen line here even if the product data
     incorrectly exposes one. */
  const selectedAddons = filterAddonsByPolicy(
    product.addons,
    product.bathroomKitchenPolicy,
  ).filter((a) => selectedAddonIds.includes(a.id));


  /* -----------------------------------------------------------------------
     Section: Floor Plan
     -----------------------------------------------------------------------
     Renders the architectural floor plan SVG for products with floor plan
     variants, or the standard floor plan for single-variant products.
     The rendered SVG reflects the selected variant and layout combination.
     ----------------------------------------------------------------------- */
  const renderFloorPlanSection = (): React.ReactNode => {
    /* Determine the display dimensions based on whether a specific floor
       plan variant has been selected or the base product dimensions apply. */
    const displayWidth = selectedVariant?.widthM ?? product.dimensions.widthM;
    const displayDepth = selectedVariant?.depthM ?? product.dimensions.depthM;

    return (
      <div className="configurator__summary-section">
        <h4 className="configurator__summary-section-title">Floor Plan</h4>
        <div className="configurator__summary-section-content">
          <div className="configurator__summary-floor-plan">
            {product.floorPlanVariants ? (() => {
              /* Check whether the selected variant provides a pre-rendered
                 SVG image path. When floorPlanImagesByLayout is available and
                 a layout is selected, use the layout-specific image. Otherwise
                 fall back to the variant's default floorPlanImagePath. */
              const layoutSlug = selectedLayout?.slug;
              const imagePath =
                (layoutSlug && selectedVariant?.floorPlanImagesByLayout?.[layoutSlug]) ??
                selectedVariant?.floorPlanImagePath;

              if (imagePath) {
                return (
                  <img
                    src={imagePath}
                    alt={`Floor plan: ${selectedVariant?.label ?? product.name}`}
                    className="configurator__floor-plan-image"
                    loading="lazy"
                  />
                );
              }

              /* Architectural mode: resolve floor plan and layout slugs for
                 the ArchitecturalFloorPlan config lookup. Falls back to '5x5'
                 when no variant is selected. */
              const fpSlug = (selectedVariant?.slug ?? '5x5') as '5x5' | '4x6';
              const archLayoutSlug = (selectedLayout?.slug as 'box' | 'en-suite' | 'bedroom') ?? null;
              return (
                <ArchitecturalFloorPlan
                  config={getStudioFloorPlanConfig(fpSlug, archLayoutSlug)}
                  wallColorOverride="#1a1a1a"
                />
              );
            })() : product.floorPlanImagePath ? (
              <img
                src={product.floorPlanImagePath}
                alt={`Floor plan: ${product.name}`}
                className="configurator__floor-plan-image"
                loading="lazy"
              />
            ) : product.floorPlan ? (
              <FloorPlan
                config={product.floorPlan as import('../../types/configurator').FloorPlanConfig}
                dimensions={product.dimensions}
                wallColor="#1a1a1a"
              />
            ) : null}
          </div>
          <div className="configurator__summary-floor-plan-dims">
            {displayWidth}m x {displayDepth}m
            {selectedLayout && (
              <span className="configurator__summary-floor-plan-layout">
                {' '}&middot; {selectedLayout.name} layout
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };


  /* -----------------------------------------------------------------------
     Section: Exterior Finish
     -----------------------------------------------------------------------
     Displays the selected exterior cladding preview image and a colour
     swatch badge with the finish name. Shows a placeholder message when
     no exterior finish has been selected.
     ----------------------------------------------------------------------- */
  const renderExteriorFinishSection = (): React.ReactNode => (
    <div className="configurator__summary-section">
      <h4 className="configurator__summary-section-title">Exterior Finish</h4>
      <div className="configurator__summary-section-content">
        {exteriorFinish ? (
          <>
            <picture>
              <source srcSet={exteriorFinish.imageAvif} type="image/avif" />
              <source srcSet={exteriorFinish.imageWebP} type="image/webp" />
              <img
                src={exteriorFinish.imagePath}
                alt={`Exterior finish: ${exteriorFinish.name}`}
                className="configurator__summary-finish-image"
                loading="lazy"
              />
            </picture>
            <div className="configurator__summary-finish-preview">
              <div
                className="configurator__summary-swatch"
                style={{ background: exteriorFinish.color }}
              />
              <span className="configurator__summary-finish-name">
                {exteriorFinish.name}
              </span>
            </div>
          </>
        ) : (
          <span className="configurator__summary-detail-label">
            No exterior finish selected
          </span>
        )}
      </div>
    </div>
  );


  /* -----------------------------------------------------------------------
     Section: Interior Finish
     -----------------------------------------------------------------------
     Displays the selected interior wall finish preview image and a colour
     swatch badge with the finish name. Shows a placeholder message when
     no interior finish has been selected.
     ----------------------------------------------------------------------- */
  const renderInteriorFinishSection = (): React.ReactNode => (
    <div className="configurator__summary-section">
      <h4 className="configurator__summary-section-title">Interior Finish</h4>
      <div className="configurator__summary-section-content">
        {interiorFinish ? (
          <>
            <picture>
              <source srcSet={interiorFinish.imageAvif} type="image/avif" />
              <source srcSet={interiorFinish.imageWebP} type="image/webp" />
              <img
                src={interiorFinish.imagePath}
                alt={`Interior finish: ${interiorFinish.name}`}
                className="configurator__summary-finish-image"
                loading="lazy"
              />
            </picture>
            <div className="configurator__summary-finish-preview">
              <div
                className="configurator__summary-swatch"
                style={{ background: interiorFinish.color }}
              />
              <span className="configurator__summary-finish-name">
                {interiorFinish.name}
              </span>
            </div>
          </>
        ) : (
          <span className="configurator__summary-detail-label">
            No interior finish selected
          </span>
        )}
      </div>
    </div>
  );


  /* -----------------------------------------------------------------------
     Section: Glazing
     -----------------------------------------------------------------------
     Displays the glazing specification from the product specs array and
     the detailed glazing note. The spec label is resolved dynamically
     from the product data to accommodate different spec naming conventions.
     ----------------------------------------------------------------------- */
  const renderGlazingSection = (): React.ReactNode => (
    <div className="configurator__summary-section">
      <h4 className="configurator__summary-section-title">Glazing</h4>
      <div className="configurator__summary-section-content">               
        {/* Structured glazing detail rows -- each entry describes a single
            window or door unit with its type label and nominal dimensions. */}
        {product.glazingDetails && product.glazingDetails.length > 0 && (
          <>
            {product.glazingDetails.map((detail, index) => (
              <div key={`${detail.label}-${index}`} className="configurator__summary-detail-row">
                <span className="configurator__summary-detail-label">{detail.label}</span>
                <span className="configurator__summary-detail-value">{detail.dimensions}</span>
              </div>
            ))}
          </>
        )}        
      </div>
    </div>
  );


  /* -----------------------------------------------------------------------
     Section: Bathroom & Kitchen
     -----------------------------------------------------------------------
     Renders bathroom and kitchen availability information based on the
     product's bathroomKitchenPolicy discriminated union value:
       - "not-available"  : explicitly states the feature is unavailable
       - "optional-addon" : shows whether the B&K add-on was selected
       - "layout-bundled" : derives availability from the selected layout
       - "included"       : lists all included features from the product data
     ----------------------------------------------------------------------- */
  const renderBathroomKitchenSection = (): React.ReactNode => {
    /** Resolves the section content based on the product's bathroom & kitchen policy. */
    const renderPolicyContent = (): React.ReactNode => {
      switch (product.bathroomKitchenPolicy) {
        case 'not-available':
          return (
            <span className="configurator__summary-detail-label">
              Not available for this model
            </span>
          );

        case 'optional-addon': {
          /* Locate the bathroom & kitchen add-on entry by slug convention.
             The add-on is identified by its slug containing 'bathroom' or 'kitchen'. */
          const bkAddon = product.addons.find(
            (a) => a.slug.includes('bathroom') || a.slug.includes('kitchen'),
          );
          const isSelected = bkAddon ? selectedAddonIds.includes(bkAddon.id) : false;
          return (
            <div className="configurator__summary-detail-row">
              <span className="configurator__summary-detail-label">
                {bkAddon?.name ?? 'Bathroom & Kitchen'}
              </span>
              <span className="configurator__summary-detail-value">
                {isSelected && bkAddon
                  ? `Included (+${formatPriceCents(bkAddon.priceCentsInclVat)})`
                  : 'Not selected'}
              </span>
            </div>
          );
        }

        case 'layout-bundled':
          return (
            <>
              <div className="configurator__summary-detail-row">
                <span className="configurator__summary-detail-label">
                  Bathroom &nbsp;
                  <HoverButton
                    ariaLabel='More information about Bathroom'
                    placement="top"
                  >
                    <b>Included</b> - toilet, basin, shower, electric boiler, plumbing connection
                  </HoverButton>
                </span>
                <span className="configurator__summary-detail-value">
                  {selectedLayout?.includesBathroom ? 'Included' : 'Not included'}                  
                </span>
              </div>
              <div className="configurator__summary-detail-row">
                <span className="configurator__summary-detail-label">
                  Kitchen &nbsp;
                  <HoverButton
                    ariaLabel='More information about Bathroom'
                    placement="top"
                  >
                    <b>Included</b> - kitchen cabinets, sink, and plumbing connections. <br/>
                    <b>Not included</b> - kitchen appliances.
                  </HoverButton>
                </span>
                <span className="configurator__summary-detail-value">
                  {selectedLayout?.includesKitchen ? 'Included' : 'Not included'}
                </span>
              </div>
              {selectedLayout?.includesBedroomWall && (
                <div className="configurator__summary-detail-row">
                  <span className="configurator__summary-detail-label">Bedroom Wall</span>
                  <span className="configurator__summary-detail-value">Included</span>
                </div>
              )}
            </>
          );

        case 'included':
          /* When the product includes bathroom & kitchen features in its base
             price, each feature is rendered as a detail row. A HoverButton is
             placed beside the feature name to surface the feature description
             on hover, without cluttering the summary layout. If no features
             are defined, a generic fallback row is displayed instead. */
          return product.includedFeatures.length > 0 ? (
            <>
              {product.includedFeatures.map((feature) => (
                <div key={feature.id} className="configurator__summary-detail-row">
                  <span className="configurator__summary-detail-label">
                    {feature.name}&nbsp;
                    {/* Inline info button that reveals the feature description
                        on hover. Placement is set to "top" to prevent the
                        popover from overlapping adjacent rows below. */}
                    <HoverButton
                      ariaLabel={`More information about ${feature.name}`}
                      placement="top"
                    >
                      {feature.description}
                    </HoverButton>
                  </span>
                  <span className="configurator__summary-detail-value">Included</span>
                </div>
              ))}
            </>
          ) : (
            <div className="configurator__summary-detail-row">
              <span className="configurator__summary-detail-label">Bathroom & Kitchen</span>
              <span className="configurator__summary-detail-value">Included in base price</span>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="configurator__summary-section">
        <h4 className="configurator__summary-section-title">Bathroom & Kitchen</h4>
        <div className="configurator__summary-section-content">
          {renderPolicyContent()}
        </div>
      </div>
    );
  };


  /* -----------------------------------------------------------------------
     Section: Warranty Coverage
     -----------------------------------------------------------------------
     Displays the product-line-wide warranty tiers in the same detail-row
     format used by other summary sections. Data is sourced from the
     shared PRODUCT_SHOWCASE_WARRANTIES array.
     ----------------------------------------------------------------------- */
  const renderWarrantySection = (): React.ReactNode => (
    <div className="configurator__summary-section">
      <h4 className="configurator__summary-section-title">Warranty Coverage</h4>
      <div className="configurator__summary-section-content">
        {PRODUCT_SHOWCASE_WARRANTIES.map((w) => (
          <div key={w.label} className="configurator__summary-detail-row">
            <span className="configurator__summary-detail-label">{w.label}</span>
            <span className="configurator__summary-detail-value">{w.years} years</span>
          </div>
        ))}
      </div>
    </div>
  );


  /* -----------------------------------------------------------------------
     Section: Other Details
     -----------------------------------------------------------------------
     Consolidates all remaining configuration details that do not belong
     to the preceding dedicated sections: structural specification,
     insulation, lead time, planning permission status, and any selected
     optional add-ons (excluding bathroom & kitchen, which has its own
     dedicated section above).
     ----------------------------------------------------------------------- */
  const renderOtherDetailsSection = (): React.ReactNode => {
    /* Filter out the bathroom/kitchen add-on from the "other" add-ons
       display, as it is covered by the dedicated Bathroom & Kitchen section. */
    const otherAddons = selectedAddons.filter(
      (a) => !a.slug.includes('bathroom') && !a.slug.includes('kitchen'),
    );

    return (
      <div className="configurator__summary-section">
        <h4 className="configurator__summary-section-title">Other Details</h4>
        <div className="configurator__summary-section-content">
          <div className="configurator__summary-detail-row">
            <span className="configurator__summary-detail-label">Structure</span>
            <span className="configurator__summary-detail-value">
              {product.specs.find((s) => s.label === 'Structure')?.value ?? 'Steel frame'}
            </span>
          </div>
          <div className="configurator__summary-detail-row">
            <span className="configurator__summary-detail-label">Insulation</span>
            <span className="configurator__summary-detail-value">
              {product.specs.find((s) => s.label === 'Insulation')?.value ?? 'Standard'}
            </span>
          </div>
          <div className="configurator__summary-detail-row">
            <span className="configurator__summary-detail-label">Lead Time</span>
            <span className="configurator__summary-detail-value">{product.leadTime}</span>
          </div>
          {product.planningPermission && (
            <div className="configurator__summary-detail-row">
              <span className="configurator__summary-detail-label">Planning Permission</span>
              <span className="configurator__summary-detail-value">Required</span>
            </div>
          )}
          {otherAddons.length > 0 && (
            <>
              <div className="configurator__summary-detail-divider" />
              <div className="configurator__summary-addons-heading">Selected Add-ons</div>
              {otherAddons.map((addon) => (
                <div key={addon.id} className="configurator__summary-detail-row">
                  <span className="configurator__summary-detail-label">{addon.name}</span>
                  <span className="configurator__summary-detail-value">
                    +{formatPriceCents(addon.priceCentsInclVat)}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  };


  /* -----------------------------------------------------------------------
     Render
     -----------------------------------------------------------------------
     Renders all summary sections in a vertical stack. Each section is
     contained within its own card to provide clear visual separation
     and allow the customer to see every configuration choice at a glance.
     ----------------------------------------------------------------------- */
  return (
    <div className="configurator__summary-sections" role="region" aria-label="Configuration summary">
      {renderFloorPlanSection()}
      {renderExteriorFinishSection()}
      {renderInteriorFinishSection()}
      {renderGlazingSection()}
      {renderBathroomKitchenSection()}
      {renderWarrantySection()}
      {renderOtherDetailsSection()}
    </div>
  );
};
