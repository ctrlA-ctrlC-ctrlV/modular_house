/**
 * SummaryNavBar -- Tabbed Navigation for Summary Step
 * =============================================================================
 *
 * PURPOSE:
 * Replaces the floor plan area on the Summary step with a tabbed navigation
 * bar. Each tab displays the user's selection for one configuration category:
 * Exterior Finish, Interior Finish, Glazing, and Other Details.
 *
 * INSTRUCTION #5:
 * "On the Summary page, the prototype displays a floor plan below the
 * heading and sub-heading. Replace that floor plan area (keeping the same
 * box dimensions) with a navigation bar containing the following tabs:
 * Exterior Finish, Interior Finish, Glazing, Other Details."
 *
 * DESIGN:
 * The component receives the full product data and the user's selections,
 * then resolves the relevant display data (finish names, colours, images,
 * glazing note, lead time, etc.) internally.
 *
 * =============================================================================
 */

import React, { useState, useCallback } from 'react';
import type { ConfiguratorProduct, FinishOption } from '../../types/configurator';
import type { SummaryTabId } from './types';


/* =============================================================================
   Tab Definitions
   ============================================================================= */

interface TabDefinition {
  id: SummaryTabId;
  label: string;
}

const SUMMARY_TABS: ReadonlyArray<TabDefinition> = [
  { id: 'exterior-finish',  label: 'Exterior Finish' },
  { id: 'interior-finish',  label: 'Interior Finish' },
  { id: 'glazing',          label: 'Glazing' },
  { id: 'other-details',    label: 'Other Details' },
];


/* =============================================================================
   Component Props
   ============================================================================= */

interface SummaryNavBarProps {
  /** Full product data for resolving selections to display values. */
  product: ConfiguratorProduct;
  /** ID of the selected exterior finish option, or null. */
  exteriorFinishId: string | null;
  /** ID of the selected interior finish option, or null. */
  interiorFinishId: string | null;
}


/* =============================================================================
   Helper -- Resolve Finish Option by ID
   ============================================================================= */

/**
 * Finds a FinishOption within a product's finish categories by its ID.
 * Returns undefined if no match is found.
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
}) => {
  const [activeTab, setActiveTab] = useState<SummaryTabId>('exterior-finish');

  const handleTabClick = useCallback((tabId: SummaryTabId) => {
    setActiveTab(tabId);
  }, []);

  /* Resolve the selected finishes to their full option objects */
  const exteriorFinish = resolveFinishOption(product, exteriorFinishId, 'exterior');
  const interiorFinish = resolveFinishOption(product, interiorFinishId, 'interior');

  /**
   * Renders the content for the currently active tab.
   * Each tab displays a preview image (if available) and relevant details.
   */
  const renderTabContent = (): React.ReactNode => {
    switch (activeTab) {
      case 'exterior-finish':
        return exteriorFinish ? (
          <>
            <img
              src={exteriorFinish.imagePath}
              alt={`Exterior finish: ${exteriorFinish.name}`}
              className="configurator__summary-finish-image"
              loading="lazy"
            />
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
        );

      case 'interior-finish':
        return interiorFinish ? (
          <>
            <img
              src={interiorFinish.imagePath}
              alt={`Interior finish: ${interiorFinish.name}`}
              className="configurator__summary-finish-image"
              loading="lazy"
            />
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
        );

      case 'glazing':
        return (
          <>
            <div className="configurator__summary-detail-row">
              <span className="configurator__summary-detail-label">Glazing Spec</span>
              <span className="configurator__summary-detail-value">
                {product.specs.find((s) => s.label === 'Glazing')?.value ?? 'Standard'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, textAlign: 'center' }}>
              {product.glazingNote}
            </div>
          </>
        );

      case 'other-details':
        return (
          <>
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
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="configurator__summary-nav" role="tablist" aria-label="Configuration summary">
      {/* Tab buttons */}
      <div className="configurator__summary-tabs">
        {SUMMARY_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const tabClass = [
            'configurator__summary-tab',
            isActive && 'configurator__summary-tab--active',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              className={tabClass}
              onClick={() => handleTabClick(tab.id)}
              aria-selected={isActive}
              aria-controls={`tab-panel-${tab.id}`}
              id={`tab-${tab.id}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content panel */}
      <div
        className="configurator__summary-tab-content"
        role="tabpanel"
        id={`tab-panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {renderTabContent()}
      </div>
    </div>
  );
};
