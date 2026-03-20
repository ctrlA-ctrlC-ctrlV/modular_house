# The Studio 25m² -- Floor Plan & Layout Selection Implementation Plan

**Created:** 2026-03-20
**Status:** Planning
**Scope:** The Studio configurator only (slug: `studio-25`)

---

## 1. Executive Summary

Add a new floor plan selection step and a layout selection step to The Studio configurator. The floor plan step lets the user choose between two footprints (5.0m x 5.0m or 4.15m x 6.0m). The layout step lets the user choose between three interior layouts (Box, En Suite, Bedroom) with tiered pricing. Bathroom and kitchen are no longer standalone add-ons -- they are bundled into the En Suite and Bedroom layouts.

---

## 2. Current Architecture (Before Changes)

### 2.1 Data Model

**`configurator-products.ts`** (seed data):
- `STUDIO_25` is a single `ConfiguratorProduct` with fixed `dimensions: { widthM: 5, depthM: 5 }`.
- `bathroomKitchenPolicy: 'optional-addon'` enables the bathroom+kitchen toggle on the add-ons step.
- `addons` array contains: `bathroom-kitchen` (EUR 10,000), `triple-glazing` (EUR 1,000), `composite-decking` (EUR 200).

**`configurator.ts`** (types):
- `ConfiguratorProduct` has no concept of floor plan variants or layout tiers.
- `BathroomKitchenPolicy` union: `'not-available' | 'optional-addon' | 'included'`.

### 2.2 Configurator Steps (constants.ts)

```
Step 0: Overview
Step 1: Exterior Finish
Step 2: Interior Finish
Step 3: Add-ons
Step 4: Summary
```

### 2.3 State (useConfiguratorState.ts)

```typescript
interface ConfiguratorSelections {
  exteriorFinishId: string | null;
  interiorFinishId: string | null;
  selectedAddonIds: string[];
}
```

### 2.4 UI (ProductConfiguratorPage.tsx)

The `renderAddonsStep()` function iterates over `product.addons` and renders an `AddonCard` for each. The bathroom+kitchen add-on appears here for studio-25.

---

## 3. Proposed Data Model Changes

### 3.1 New Types (in `types/configurator.ts`)

#### FloorPlanVariant

Represents one selectable floor plan option for a product. Maps to a future `configurator_floor_plan_variants` table.

```typescript
/**
 * A selectable floor plan variant for a product. Each variant defines
 * a specific external footprint and its associated floor plan rendering
 * configuration. Products without variants use their base dimensions.
 *
 * SQL: configurator_floor_plan_variants
 * Columns: id (UUID PK), product_id (FK), slug, label, description,
 *          width_m, depth_m, price_delta_cents (always 0 for now),
 *          floor_plan_config (JSONB), display_order
 */
export interface FloorPlanVariant {
  id: string;
  productId: string;
  slug: string;
  label: string;
  description: string;
  widthM: number;
  depthM: number;
  areaM2: number;
  priceDeltaCentsInclVat: number;  // 0 for both Studio variants
  floorPlan: FloorPlanConfig;
  displayOrder: number;
}
```

#### LayoutOption

Represents one selectable interior layout option. Maps to a future `configurator_layout_options` table.

```typescript
/**
 * A selectable interior layout for a product. Each layout defines a
 * pricing tier and which features are bundled (bathroom, kitchen, bedroom
 * wall). The price delta is added on top of the product base price.
 *
 * SQL: configurator_layout_options
 * Columns: id (UUID PK), product_id (FK), slug, name, description,
 *          price_delta_cents_incl_vat, includes_bathroom, includes_kitchen,
 *          includes_bedroom_wall, display_order
 */
export interface LayoutOption {
  id: string;
  productId: string;
  slug: string;
  name: string;
  description: string;
  priceDeltaCentsInclVat: number;
  includesBathroom: boolean;
  includesKitchen: boolean;
  includesBedroomWall: boolean;
  displayOrder: number;
}
```

#### ConfiguratorProduct Extensions

Add two new optional arrays to `ConfiguratorProduct`:

```typescript
export interface ConfiguratorProduct {
  // ... existing fields ...

  /**
   * Optional floor plan variants. When present, the configurator inserts
   * a floor plan selection step before the overview. When absent, the
   * product uses its base dimensions and a single floor plan.
   */
  floorPlanVariants?: ReadonlyArray<FloorPlanVariant>;

  /**
   * Optional interior layout options. When present, the configurator
   * inserts a layout selection step after floor plan / before finishes.
   * When absent, the product has no layout step.
   */
  layoutOptions?: ReadonlyArray<LayoutOption>;
}
```

These are **optional** fields, meaning all existing products (Compact, Living, Grand) remain unchanged -- zero modifications needed. Only Studio-25 defines these arrays. This respects the Open-Closed Principle.

### 3.2 Updated ConfiguratorSelections (in `types.ts`)

```typescript
export interface ConfiguratorSelections {
  /** Selected floor plan variant ID, or null if the product has no variants. */
  floorPlanVariantId: string | null;
  /** Selected layout option ID, or null if the product has no layouts. */
  layoutOptionId: string | null;
  exteriorFinishId: string | null;
  interiorFinishId: string | null;
  selectedAddonIds: string[];
}
```

### 3.3 Updated BathroomKitchenPolicy

For Studio-25, the policy changes from `'optional-addon'` to a new value `'layout-bundled'` indicating bathroom/kitchen availability is determined by the selected layout:

```typescript
export type BathroomKitchenPolicy =
  | 'not-available'
  | 'optional-addon'
  | 'layout-bundled'   // NEW: determined by LayoutOption.includesBathroom
  | 'included';
```

### 3.4 Seed Data Changes (in `configurator-products.ts`)

**STUDIO_25 modifications:**

1. **Add `floorPlanVariants`:**
```typescript
floorPlanVariants: [
  {
    id: 'fpv-studio-5x5',
    productId: 'cp-studio-25',
    slug: '5x5',
    label: '5.0m x 5.0m',
    description: 'Square footprint',
    widthM: 5.0,
    depthM: 5.0,
    areaM2: 25,
    priceDeltaCentsInclVat: 0,
    floorPlan: { /* existing Studio floor plan config */ },
    displayOrder: 1,
  },
  {
    id: 'fpv-studio-4x6',
    productId: 'cp-studio-25',
    slug: '4x6',
    label: '4.15m x 6.0m',
    description: 'Rectangular footprint',
    widthM: 4.15,
    depthM: 6.0,
    areaM2: 24.9,
    priceDeltaCentsInclVat: 0,
    floorPlan: { /* new aperture config for 4.15x6.0 */ },
    displayOrder: 2,
  },
],
```

2. **Add `layoutOptions`:**
```typescript
layoutOptions: [
  {
    id: 'lo-studio-box',
    productId: 'cp-studio-25',
    slug: 'box',
    name: 'Box',
    description: 'Open plan with no internal walls. Maximum flexibility for your space.',
    priceDeltaCentsInclVat: 0,
    includesBathroom: false,
    includesKitchen: false,
    includesBedroomWall: false,
    displayOrder: 1,
  },
  {
    id: 'lo-studio-en-suite',
    productId: 'cp-studio-25',
    slug: 'en-suite',
    name: 'En Suite',
    description: 'Open living area with integrated bathroom and kitchen. No bedroom wall.',
    priceDeltaCentsInclVat: 1_200_000,  // EUR 12,000
    includesBathroom: true,
    includesKitchen: true,
    includesBedroomWall: false,
    displayOrder: 2,
  },
  {
    id: 'lo-studio-bedroom',
    productId: 'cp-studio-25',
    slug: 'bedroom',
    name: 'Bedroom',
    description: 'Separate bedroom with wall and door, plus bathroom and kitchen.',
    priceDeltaCentsInclVat: 1_600_000,  // EUR 16,000
    includesBathroom: true,
    includesKitchen: true,
    includesBedroomWall: true,
    displayOrder: 3,
  },
],
```

3. **Change `bathroomKitchenPolicy`:** `'optional-addon'` -> `'layout-bundled'`

4. **Remove bathroom-kitchen add-on:** Remove `ao-studio-bathroom-kitchen` from the `addons` array. Keep `triple-glazing` and `composite-decking`.

---

## 4. Configurator Step Flow Changes

### 4.1 Dynamic Step Generation

The `CONFIGURATOR_STEPS` constant currently defines a static array. To support product-specific steps without modifying other products, we introduce a **step builder function** that computes the step sequence based on the product's data:

```typescript
/**
 * Builds the ordered step sequence for a given product. The base
 * sequence (overview, exterior, interior, addons, summary) is extended
 * with optional steps based on the product's data:
 *
 * - floorPlanVariants present -> inserts "Floor Plan" as step 0
 * - layoutOptions present     -> inserts "Layout" after floor plan / overview
 *
 * Products without these fields get the original 5-step sequence unchanged.
 */
export function buildConfiguratorSteps(
  product: ConfiguratorProduct
): ReadonlyArray<ConfiguratorStep> { ... }
```

**Studio-25 will get this 7-step sequence:**

```
Step 0: Floor Plan     (NEW -- select 5x5 or 4.15x6)
Step 1: Layout         (NEW -- select Box / En Suite / Bedroom)
Step 2: Overview
Step 3: Exterior
Step 4: Interior
Step 5: Add-ons
Step 6: Summary
```

**All other products remain unchanged:**

```
Step 0: Overview
Step 1: Exterior
Step 2: Interior
Step 3: Add-ons
Step 4: Summary
```

### 4.2 New ConfiguratorStepId Values

```typescript
export type ConfiguratorStepId =
  | 'floor-plan'    // NEW
  | 'layout'        // NEW
  | 'overview'
  | 'exterior'
  | 'interior'
  | 'addons'
  | 'summary';
```

### 4.3 Updated `canProceed` Logic

```typescript
case 'floor-plan':
  return selections.floorPlanVariantId !== null;
case 'layout':
  return selections.layoutOptionId !== null;
```

### 4.4 Updated Total Price Calculation

The `calculateTotalPriceCents` function must incorporate two new price factors:

```typescript
function calculateTotalPriceCents(
  basePriceCents: number,
  allAddons: ReadonlyArray<AddonOption>,
  selectedAddonIds: ReadonlyArray<string>,
  floorPlanVariants?: ReadonlyArray<FloorPlanVariant>,
  selectedFloorPlanVariantId?: string | null,
  layoutOptions?: ReadonlyArray<LayoutOption>,
  selectedLayoutOptionId?: string | null,
): number {
  const addonDelta = allAddons
    .filter(a => selectedAddonIds.includes(a.id))
    .reduce((sum, a) => sum + a.priceCentsInclVat, 0);

  const floorPlanDelta = floorPlanVariants
    ?.find(v => v.id === selectedFloorPlanVariantId)
    ?.priceDeltaCentsInclVat ?? 0;

  const layoutDelta = layoutOptions
    ?.find(l => l.id === selectedLayoutOptionId)
    ?.priceDeltaCentsInclVat ?? 0;

  return basePriceCents + addonDelta + floorPlanDelta + layoutDelta;
}
```

---

## 5. UI Changes

### 5.1 New Step: Floor Plan Selection (Step 0)

**Component:** `renderFloorPlanStep()` in `ProductConfiguratorPage.tsx`

**Design:** Two large selectable cards, side-by-side on desktop, stacked on mobile. Each card shows:
- The dimension label (e.g., "5.0m x 5.0m")
- The description (e.g., "Square footprint")
- A floor plan SVG preview (using the existing `FloorPlan` component)
- A selection indicator (border highlight + checkmark when selected)

**Interaction:** Clicking a card sets `floorPlanVariantId` in selections. The floor plan on subsequent steps dynamically uses the selected variant's `FloorPlanConfig`.

**Styling:** Follows the existing Apple-like configurator card pattern established by `FinishCard` and `AddonCard`.

### 5.2 New Step: Layout Selection (Step 1)

**Component:** `renderLayoutStep()` in `ProductConfiguratorPage.tsx`

**Design:** Three selectable layout cards, each showing:
- Layout name (Box / En Suite / Bedroom)
- Description text
- Price label: "Included" for Box, "+EUR 12,000" for En Suite, "+EUR 16,000" for Bedroom
- Bundled features badges (e.g., "Bathroom", "Kitchen", "Bedroom Wall")
- Selection indicator (border highlight + checkmark)

**Interaction:** Clicking a card sets `layoutOptionId` in selections.

**Note on Box layout:** When Box is selected, bathroom cannot be added (it has no internal walls). The add-ons step should reflect this by not showing any bathroom-related add-on (already handled by the removal of the B&K add-on from the addons array).

### 5.3 Updated Add-ons Step

- The `bathroom-kitchen` add-on (`ao-studio-bathroom-kitchen`) is removed from the data.
- The add-ons step for Studio will show only `triple-glazing` and `composite-decking`.
- No code change needed in `renderAddonsStep()` -- it already iterates over `product.addons`.

### 5.4 Updated Summary Step

- The price breakdown must include the layout price delta as a line item (if non-zero).
- The configuration summary in the consultation form must include the selected floor plan and layout.
- The SummaryNavBar could optionally show a "Layout" tab, but this is a nice-to-have.

### 5.5 Updated Floor Plan Rendering

When floor plan variants exist, the `FloorPlan` component should use the selected variant's `floorPlan` config instead of `product.floorPlan`. This requires passing the resolved floor plan config through rather than always using `product.floorPlan`.

---

## 6. Step-by-Step Implementation Breakdown

### Phase 1: Data Layer (No UI changes)

#### Task 1.1: Add new types to `types/configurator.ts`

**Files:** `apps/web/src/types/configurator.ts`

**Actions:**
1. Add `FloorPlanVariant` interface.
2. Add `LayoutOption` interface.
3. Add `'layout-bundled'` to `BathroomKitchenPolicy` union.
4. Add optional `floorPlanVariants?` and `layoutOptions?` fields to `ConfiguratorProduct`.

**Risk:** None. All new fields are optional. Existing products compile without changes.

---

#### Task 1.2: Update Studio-25 seed data in `configurator-products.ts`

**Files:** `apps/web/src/data/configurator-products.ts`

**Actions:**
1. Add `floorPlanVariants` array to `STUDIO_25` with both floor plan options.
2. Add `layoutOptions` array to `STUDIO_25` with Box, En Suite, and Bedroom.
3. Change `bathroomKitchenPolicy` from `'optional-addon'` to `'layout-bundled'`.
4. Remove `ao-studio-bathroom-kitchen` from the `addons` array.

**Risk:** Low. The bathroom-kitchen add-on removal changes the add-on display immediately but the configurator will simply show fewer add-on cards.

---

#### Task 1.3: Update garden-room-data.ts if needed

**Files:** `apps/web/src/data/garden-room-data.ts`

**Actions:**
- Review `buildGardenRoomProduct('studio-25', ...)` call to ensure the derived garden room page data is not broken by the new fields. Since `buildGardenRoomProduct` only reads fields that exist on `ConfiguratorProduct` (slug, dimensions, image, basePriceCentsInclVat, etc.), adding optional fields will not affect it.
- No changes expected unless the garden room page card display needs to reflect the new layouts.

**Risk:** None. The garden room page projection functions ignore unknown fields.

---

### Phase 2: Configurator State & Logic

#### Task 2.1: Add new step IDs to `types.ts`

**Files:** `apps/web/src/components/ProductConfigurator/types.ts`

**Actions:**
1. Add `'floor-plan'` and `'layout'` to `ConfiguratorStepId` union.
2. Add `floorPlanVariantId: string | null` and `layoutOptionId: string | null` to `ConfiguratorSelections`.

**Risk:** Low. The DEFAULT_SELECTIONS in `useConfiguratorState.ts` must be updated to include the new null defaults.

---

#### Task 2.2: Replace static CONFIGURATOR_STEPS with dynamic builder

**Files:** `apps/web/src/components/ProductConfigurator/constants.ts`

**Actions:**
1. Keep the existing `CONFIGURATOR_STEPS` as `BASE_CONFIGURATOR_STEPS` (internal).
2. Export a new `buildConfiguratorSteps(product)` function.
3. The function inserts `floor-plan` and `layout` steps when the product defines those fields.
4. Components that currently import `CONFIGURATOR_STEPS` will be updated to use the built array.

**Risk:** Medium. This changes the step indexing from static to dynamic. All references to step indices must use the built array. The `useConfiguratorState` hook and `ProgressBar` already work with array indices, so the change is structural but contained.

---

#### Task 2.3: Update `useConfiguratorState.ts`

**Files:** `apps/web/src/components/ProductConfigurator/useConfiguratorState.ts`

**Actions:**
1. Import `buildConfiguratorSteps` and call it with the product to get the step array.
2. Update `DEFAULT_SELECTIONS` with new fields.
3. Update `canProceed` switch to handle `'floor-plan'` and `'layout'` step IDs.
4. Update `calculateTotalPriceCents` call to include floor plan and layout deltas.
5. Add `setFloorPlanVariant` and `setLayoutOption` action functions.
6. Expose new selection setters and the resolved step array on the return API.

**Risk:** Medium. Session persistence format changes (new fields in `ConfiguratorSelections`). Existing sessions for studio-25 will have stale persisted state. Mitigation: the `loadPersistedState` function should gracefully handle missing fields by merging with defaults.

---

#### Task 2.4: Update `utils.ts` -- price calculation

**Files:** `apps/web/src/components/ProductConfigurator/utils.ts`

**Actions:**
1. Extend `calculateTotalPriceCents` signature to accept optional floor plan and layout parameters.
2. Add floor plan price delta and layout price delta to the sum.

**Risk:** Low. The function signature is extended with optional parameters, so existing callers continue to work.

---

### Phase 3: UI Components

#### Task 3.1: Create FloorPlanCard component

**Files:** `apps/web/src/components/ProductConfigurator/FloorPlanCard.tsx` (NEW)

**Actions:**
1. Create a selectable card component for floor plan variants.
2. Props: `variant: FloorPlanVariant`, `isSelected: boolean`, `onSelect: (id: string) => void`.
3. Renders the dimension label, description, a small floor plan preview, and selection indicator.
4. Follows the established `AddonCard`/`FinishCard` button-based accessibility pattern.

**Risk:** None. New file, no impact on existing code.

---

#### Task 3.2: Create LayoutCard component

**Files:** `apps/web/src/components/ProductConfigurator/LayoutCard.tsx` (NEW)

**Actions:**
1. Create a selectable card component for layout options.
2. Props: `layout: LayoutOption`, `isSelected: boolean`, `onSelect: (id: string) => void`.
3. Renders layout name, description, price ("+EUR X" or "Included"), bundled feature badges, and selection indicator.
4. Follows the established card pattern.

**Risk:** None. New file.

---

#### Task 3.3: Add step renderers to ProductConfiguratorPage

**Files:** `apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx`

**Actions:**
1. Import `FloorPlanCard` and `LayoutCard`.
2. Add `renderFloorPlanStep()` function.
3. Add `renderLayoutStep()` function.
4. Update `renderStepContent()` switch to handle `'floor-plan'` and `'layout'`.
5. Replace static `CONFIGURATOR_STEPS` import with the dynamic step array from state.
6. Update the floor plan rendering in overview/exterior/interior steps to use the selected variant's config when available.
7. Update the summary step to include layout selection in the price breakdown and form summary.

**Risk:** Medium. This is the largest single change. Care must be taken to ensure the step content router handles all step IDs correctly and that the floor plan resolution logic propagates cleanly.

---

#### Task 3.4: Update ProgressBar if needed

**Files:** `apps/web/src/components/ProductConfigurator/ProgressBar.tsx`

**Actions:**
- The ProgressBar already renders based on the `CONFIGURATOR_STEPS` array length and labels. If we pass the dynamic step array as a prop (or the component reads it from context), it will automatically render the correct number of steps.
- If ProgressBar currently imports `CONFIGURATOR_STEPS` directly, it must be updated to accept steps as a prop.

**Risk:** Low. The ProgressBar is a presentational component.

---

#### Task 3.5: Add CSS for new step cards

**Files:** `apps/web/src/components/ProductConfigurator/ProductConfigurator.css`

**Actions:**
1. Add `.configurator__floor-plan-grid` (2-column grid for floor plan cards).
2. Add `.configurator__floor-plan-card` + `--selected` modifier.
3. Add `.configurator__layout-grid` (3-column grid for layout cards).
4. Add `.configurator__layout-card` + `--selected` modifier.
5. Add `.configurator__layout-price`, `.configurator__layout-features` for sub-elements.
6. Responsive breakpoints: stack cards vertically below 768px.

**Risk:** None. Additive CSS changes.

---

### Phase 4: Form Submission & API

#### Task 4.1: Update form submission payload

**Files:** `apps/web/src/components/ProductConfigurator/useConfiguratorState.ts`

**Actions:**
1. Include `configuratorFloorPlan` (selected variant slug) in the API payload.
2. Include `configuratorLayout` (selected layout slug) in the API payload.
3. Update the configuration summary text in `renderConsultationForm()`.

**Risk:** Low. The API endpoint should gracefully accept new fields. If the backend hasn't been updated yet, extra fields will be ignored.

---

### Phase 5: Testing & Validation

#### Task 5.1: Manual testing checklist

1. **Studio-25 configurator:**
   - Floor plan step renders with two options.
   - Selecting a floor plan enables Continue.
   - Layout step renders with three options (Box / En Suite / Bedroom).
   - Box shows +EUR 0, En Suite shows +EUR 12,000, Bedroom shows +EUR 16,000.
   - Selecting a layout updates the running total in the sticky header.
   - Add-ons step shows only triple-glazing and composite-decking (no bathroom-kitchen).
   - Summary step includes layout line item in price breakdown.
   - Floor plan on subsequent steps reflects the selected variant dimensions.
   - Session persistence: refresh page, selections are restored.

2. **Other products (Compact-15, Living-35, Grand-45):**
   - Configurator flow is unchanged (5 steps, no floor plan or layout step).
   - No visual or functional regression.

3. **Garden room page:**
   - Product cards and quick view modals display correctly for all products.
   - Studio-25 card still shows correct base price (EUR 39,500).

---

## 7. Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Session storage migration for existing studio-25 sessions | Medium | Low | Merge persisted state with defaults; missing fields get null |
| ProgressBar assumes static step count | Medium | Medium | Refactor to accept steps as prop |
| API endpoint does not accept new fields | Low | Low | New fields are sent as optional; backend ignores unknown fields |
| Floor plan aperture data for 4.15m x 6.0m layout unavailable | Medium | Medium | Placeholder aperture config; update when architectural drawings are finalised |
| Price calculation change affects existing quote comparisons | Low | Low | Layout price is additive; base price unchanged |

---

## 8. Files Changed Summary

| File | Change Type | Description |
|------|------------|-------------|
| `apps/web/src/types/configurator.ts` | Modified | Add FloorPlanVariant, LayoutOption, layout-bundled policy, optional product fields |
| `apps/web/src/data/configurator-products.ts` | Modified | Add variants + layouts to Studio-25; remove B&K add-on; update policy |
| `apps/web/src/components/ProductConfigurator/types.ts` | Modified | Add floor-plan + layout step IDs; extend selections |
| `apps/web/src/components/ProductConfigurator/constants.ts` | Modified | Add buildConfiguratorSteps() function |
| `apps/web/src/components/ProductConfigurator/useConfiguratorState.ts` | Modified | Dynamic steps; new selection fields; updated canProceed + price calc |
| `apps/web/src/components/ProductConfigurator/utils.ts` | Modified | Extended calculateTotalPriceCents signature |
| `apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx` | Modified | Add floor-plan + layout step renderers; update step router |
| `apps/web/src/components/ProductConfigurator/ProgressBar.tsx` | Modified | Accept dynamic steps array as prop |
| `apps/web/src/components/ProductConfigurator/FloorPlanCard.tsx` | **New** | Floor plan selection card component |
| `apps/web/src/components/ProductConfigurator/LayoutCard.tsx` | **New** | Layout selection card component |
| `apps/web/src/components/ProductConfigurator/ProductConfigurator.css` | Modified | Add styles for floor-plan and layout grids/cards |
| `apps/web/src/data/garden-room-data.ts` | Reviewed | No changes expected (projection ignores new optional fields) |

---

## 9. Implementation Order

```
Phase 1 (Data Layer)
  1.1 Types ──────────────┐
  1.2 Seed Data ──────────┤ No dependencies between these two
  1.3 Garden Room Data ───┘ (verify no breakage)

Phase 2 (State & Logic)
  2.1 Step IDs ───────────┐
  2.2 Step Builder ───────┤ 2.3 depends on 2.1 + 2.2
  2.3 State Hook ─────────┤
  2.4 Price Calc ─────────┘

Phase 3 (UI Components)
  3.1 FloorPlanCard ──────┐
  3.2 LayoutCard ─────────┤ 3.3 depends on 3.1 + 3.2
  3.3 Page Renderers ─────┤
  3.4 ProgressBar ────────┤
  3.5 CSS ────────────────┘

Phase 4 (Form & API)
  4.1 Submission payload

Phase 5 (Testing)
  5.1 Manual testing
```

---

## 10. Open Questions

1. **Floor plan aperture data for 4.15m x 6.0m:** What glazing configuration applies to the rectangular layout? Same apertures as the square layout, or different window/door positions?

2. **Layout-specific floor plan rendering:** Should the floor plan SVG show internal walls for the En Suite and Bedroom layouts, or is this a future enhancement?

3. **Box layout bathroom restriction:** The requirement states "Bathroom cannot be added" for Box. Since bathroom is no longer an add-on, this is inherently satisfied. Confirm no future add-on for standalone bathroom is planned for Studio.

4. **Garden room page card:** Should the Studio-25 card on `/garden-room` reflect the new "from EUR 39,500" pricing, or change to show layout options?
