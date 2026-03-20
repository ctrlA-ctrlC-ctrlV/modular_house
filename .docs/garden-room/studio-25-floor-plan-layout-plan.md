# The Studio 25m² -- Floor Plan & Layout Selection Implementation Plan

**Created:** 2026-03-20
**Updated:** 2026-03-20
**Status:** Planning
**Scope:** The Studio configurator only (slug: `studio-25`)

---

## 1. Executive Summary

Upgrade the floor plan SVG renderer to produce architectural-quality drawings matching the reference images in `/public/resource/floorplan/`. Then add a new floor plan selection step and a layout selection step to The Studio configurator. The floor plan step lets the user choose between two footprints (5.0m x 5.0m or 4.15m x 6.0m). The layout step lets the user choose between three interior layouts (Box, En Suite, Bedroom) with tiered pricing. Bathroom and kitchen are no longer standalone add-ons -- they are bundled into the En Suite and Bedroom layouts.

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

The Studio configurator uses the new `ArchitecturalFloorPlan` component (Phase 0) instead of the MVP `FloorPlan` component. The architectural floor plan config is resolved from the combination of the selected floor plan variant + selected layout using the lookup map in `studio-floor-plans.ts`. Non-Studio products continue to use the existing MVP `FloorPlan` component unchanged.

On the Floor Plan Selection step, each card renders the Box config for its floor plan variant (showing the open-space version). On the Layout Selection step, each card renders the config matching the selected floor plan + that card's layout. On the Overview step and subsequent steps, the floor plan reflects both the selected floor plan variant and the selected layout.

---

## 6. Step-by-Step Implementation Breakdown

### Phase 0: Floor Plan Visual Upgrade (Prerequisite)

This phase upgrades the SVG floor plan renderer from the current MVP (simple rect + blue aperture bars) to architectural-quality drawings that match the six reference images in `/public/resource/floorplan/`. Each reference image is treated as its own task for individual review. The upgraded renderer is a prerequisite for Phase 3, where the floor plan and layout selection steps use these visuals as card previews.

**Reference image inventory:**

| File | Floor plan | Layout | Key visual elements |
|------|-----------|--------|---------------------|
| `500by500_box.jpg` | 5.0m x 5.0m | Box | Square footprint, open space 22.35 SQM, 700mm T&T window + 1600mm double/sliding door on south wall, north arrow |
| `500by500_ensuit.jpg` | 5.0m x 5.0m | En Suite | Bathroom (3.84 SQM) + Kitchen zone top-left, 700mm single door with swing arc, open space 17.95 SQM below |
| `500by500_bedroom.jpg` | 5.0m x 5.0m | Bedroom | Bathroom (3.84 SQM) top-left, Kitchen top-right, Bedroom (7.18 SQM) mid-left with 700mm door, open space 10.36 SQM mid-right, two internal partition walls |
| `415by600_box.jpg` | 4.15m x 6.0m | Box | Portrait rectangle, open space 22.21 SQM, same south-wall aperture layout |
| `415by600_ensuit.jpg` | 4.15m x 6.0m | En Suite | Bathroom (3.84 SQM) top-left, Kitchen zone bottom-left, open space 17.81 SQM right, internal partition wall |
| `415by600_bedroomjpg.jpg` | 4.15m x 6.0m | Bedroom | Bathroom (3.84 SQM) top-left, Bedroom (5.97 SQM) top-right, Kitchen bottom-left, open space 11.36 SQM bottom-right, two internal partition walls |

**Visual gap analysis -- current MVP vs reference images:**

| Element | Current MVP (`FloorPlan.tsx`) | Reference images | Gap |
|---------|------------------------------|-----------------|-----|
| Outer walls | Single stroke rect, 6px, rounded corners | Double-line walls showing wall thickness (~136mm) | Major |
| Corner posts | None | Filled dark-grey rectangles at all four corners | Missing |
| Inner fill | Single light rect `#f9f8f6` | White inner area bounded by inner wall face | Minor |
| Apertures | Blue filled rects with white divider | Thin parallel lines through wall break (architectural convention) | Major |
| Door swings | Single dashed Bezier for french doors only | Dashed quarter-circle arcs for all door types; double-leaf arcs for sliding doors | Major |
| Dimension lines | Two text labels below/right of plan | Full leader-line dimensions with arrows, exterior bold dims + interior light dims | Major |
| Room labels | Single centred area text "XX m2" | "ROOM NAME" + "XX.XX SQM" per zone, uppercase | Missing |
| Aperture labels | None | "700MM T&T WINDOW", "1600MM DOUBLE/SLIDING DOOR" with offset dimensions | Missing |
| North arrow | None | Solid black triangle below south wall entrance | Missing |
| Internal walls | None | Double-line partition walls for En Suite and Bedroom layouts | Missing (new for Phase 3) |
| Internal doors | None | 700mm single door opening with dashed swing arc through internal walls | Missing (new for Phase 3) |
| Aspect ratio | Fixed 260x260 square viewBox | Square for 5x5, portrait for 4.15x6 (proportional to real dimensions) | Major |

**Architectural approach -- refactor vs rewrite:**

The current `FloorPlan.tsx` component is 347 lines of tightly coupled coordinate math built around a fixed 260x260 square viewBox. The reference images require fundamentally different rendering: double-line walls, proportional viewBox, leader-line dimensions, internal partitions, room labels, and door arcs. Rather than patching the MVP, the plan creates a **new `ArchitecturalFloorPlan` component** alongside the existing one. The old `FloorPlan` component remains available as a fallback for other products until they are individually migrated.

The new component will be **data-driven**: it receives a floor plan descriptor object (dimensions, apertures, internal walls, room zones) and renders the corresponding SVG. This keeps the component reusable across all six floor plan variants without hard-coding coordinates per layout.

---

#### Task 0.1: Create `ArchitecturalFloorPlan` component -- outer shell, double-line walls, and corner posts

**Files:**
- `apps/web/src/components/ProductConfigurator/ArchitecturalFloorPlan.tsx` (NEW)

**Reference image:** `500by500_box.jpg`

**What this task produces:**
A new React component that renders only the outer wall shell of an architectural floor plan as an SVG. No apertures, labels, dimensions, or internal walls -- those are added in Tasks 0.2-0.5.

**Interface to define (at the top of the file):**
```typescript
interface ArchitecturalFloorPlanProps {
  /** Outer width of the building in millimetres (e.g., 5000). */
  outerWidthMm: number;
  /** Outer depth of the building in millimetres (e.g., 5000). */
  outerDepthMm: number;
  /** Wall thickness in millimetres. Derived from reference: 136mm (5000 - 4728 = 272 / 2). */
  wallThicknessMm: number;
  /** Hex colour for outer wall stroke, passed from configurator's exterior finish selection. */
  wallColor: string;
  // ... additional fields added by subsequent tasks (apertures, zones, internalWalls, dimensions)
}
```

**SVG coordinate system:**
- Use a scale factor of `1mm = 0.1 SVG units` (so 5000mm = 500 SVG units).
- Add fixed padding around the plan: 80 SVG units top (for exterior dimension lines), 50 SVG units left (for exterior dimension lines), 50 SVG units right, 120 SVG units bottom (for aperture labels + north arrow).
- Set `viewBox` to `"0 0 {outerWidthScaled + leftPad + rightPad} {outerDepthScaled + topPad + bottomPad}"`.
- Set `preserveAspectRatio="xMidYMid meet"` so the SVG scales proportionally within its container.

**What to render (4 layers, back to front):**
1. **Inner room fill** -- a single `<rect>` at the inner wall boundary, filled `#ffffff`, no stroke. Position: `(leftPad + wallThicknessScaled, topPad + wallThicknessScaled)`, size: `(innerWidthScaled, innerDepthScaled)`.
2. **Outer wall rect** -- a `<rect>` at `(leftPad, topPad)`, size `(outerWidthScaled, outerDepthScaled)`, `fill="none"`, `stroke={wallColor}`, `strokeWidth={1}`.
3. **Inner wall rect** -- a `<rect>` inset by `wallThicknessScaled` on all sides, `fill="none"`, `stroke={wallColor}`, `strokeWidth={0.5}`. This creates the double-line wall appearance.
4. **Corner posts** -- four filled `<rect>` elements at each corner. Each post is `wallThicknessScaled x wallThicknessScaled` in size, filled `#888888` (dark grey). Positions: top-left `(leftPad, topPad)`, top-right `(leftPad + outerWidthScaled - wallThicknessScaled, topPad)`, bottom-left `(leftPad, topPad + outerDepthScaled - wallThicknessScaled)`, bottom-right `(leftPad + outerWidthScaled - wallThicknessScaled, topPad + outerDepthScaled - wallThicknessScaled)`.

**Component props:**
- `config: ArchitecturalFloorPlanProps`
- `className?: string` (optional, for external sizing)

**Accessibility:**
- `role="img"` on the SVG element.
- `aria-label` describing the floor plan (e.g., "Floor plan: 5.0m x 5.0m garden room").

**Acceptance criteria:**
- Rendering with `outerWidthMm=5000, outerDepthMm=5000, wallThicknessMm=136` produces a square plan.
- Rendering with `outerWidthMm=6000, outerDepthMm=4150, wallThicknessMm=136` produces a landscape rectangle.
- Double-line walls are clearly visible at all reasonable container sizes (200px to 600px wide).
- Corner posts appear as filled grey squares at all four corners.
- The SVG scales proportionally without distortion.

**Risk:** None. New file, no impact on existing code.

---

#### Task 0.2: Exterior apertures -- wall breaks, glazing lines, door swing arcs, and aperture labels

**Files:**
- `apps/web/src/components/ProductConfigurator/ArchitecturalFloorPlan.tsx` (modify)

**Reference images:** `500by500_box.jpg`, `415by600_box.jpg`

**What this task produces:**
Adds rendering of exterior apertures (windows and doors) on the south wall. The outer and inner wall rects from Task 0.1 are broken at each aperture location, and architectural symbols are drawn in the gap.

**Data shape to add to the config interface:**
```typescript
interface ExteriorAperture {
  /** Type determines the visual symbol rendered. */
  type: 'tilt-turn-window' | 'sliding-door';
  /** Which outer wall this aperture sits on. */
  wall: 'north' | 'east' | 'south' | 'west';
  /** Distance in mm from the left (or top) inner wall corner to the start of this aperture. */
  offsetMm: number;
  /** Aperture width in mm. */
  widthMm: number;
  /** Display label rendered below the aperture (e.g., "700MM\nT&T WINDOW"). */
  label: string;
}
```
Add `apertures: ExteriorAperture[]` to the config interface.

**How to render wall breaks:**
For each aperture, suppress the outer and inner wall strokes over the aperture's span. Implementation: instead of drawing the south wall as a single outer `<rect>` + inner `<rect>` (Task 0.1), draw each wall face as a `<path>` composed of segments, skipping the aperture gaps. Alternatively, draw the full rects first, then overdraw white-filled rects at each aperture to erase the wall lines, then draw the aperture symbols on top.

**Aperture symbol rendering:**

1. **Tilt-and-turn window (700mm):**
   - Draw two thin parallel horizontal lines across the wall gap, spaced `wallThicknessScaled` apart (matching the outer and inner wall faces). These represent the glazing panes.
   - Stroke: `#333333`, width `0.5`.
   - No swing arc.

2. **Sliding door (1600mm):**
   - Draw two thin parallel horizontal lines across the wall gap (same as window).
   - Below the outer wall line, draw a dashed double-leaf door swing arc:
     - Left leaf: a quarter-circle arc from the left edge of the opening, sweeping downward-right, radius = half the opening width (800mm scaled). Stroke: `#333333`, width `0.5`, dash pattern `"4,3"`.
     - Right leaf: a quarter-circle arc from the right edge, sweeping downward-left, same radius. Same stroke.
   - The two arcs meet at the centre bottom, forming a downward-pointing V shape (matching the reference).

**Aperture label rendering:**
Below each aperture (beneath the door swing arcs if present), render two lines of centred text:
- Line 1: the aperture width, e.g., "700MM" or "1600MM". Font: 8px, `#333333`, uppercase.
- Line 2: the aperture type, e.g., "T&T WINDOW" or "DOUBLE/SLIDING DOOR". Font: 7px, `#666666`, uppercase.

**Offset dimension lines between apertures:**
Between the left wall corner and first aperture, between apertures, and between the last aperture and right wall corner, render horizontal dimension leader lines:
- A thin horizontal line with small vertical tick marks at each end.
- The dimension value in mm centred above the line (e.g., "650", "1350", "128").
- Font: 7px, `#999999`.
- Position these dimension lines at the same vertical level as the aperture labels.

**Exact positions from reference images (for data file in Task 0.6, but documented here for clarity):**

| Floor plan | Wall | Aperture | Offset from left corner | Width |
|-----------|------|----------|------------------------|-------|
| 5x5 | south | T&T window | 650mm | 700mm |
| 5x5 | south | Sliding door | 2700mm (650+700+1350) | 1600mm |
| 4.15x6 | south | T&T window | 1250mm | 700mm |
| 4.15x6 | south | Sliding door | 3300mm (1250+700+1350) | 1600mm |

**Acceptance criteria:**
- The south wall shows two distinct openings with glazing lines visible at normal viewing sizes.
- The sliding door has a clearly visible dashed double-leaf arc below it.
- Labels "700MM / T&T WINDOW" and "1600MM / DOUBLE/SLIDING DOOR" appear below each aperture.
- Offset dimensions (e.g., 650, 1350, 128) appear between apertures and wall edges.
- Wall lines are cleanly interrupted at aperture locations (no overlapping strokes).

**Risk:** Low. Most complexity is coordinate arithmetic. Visual comparison against reference catches errors immediately.

---

#### Task 0.3: Exterior and interior dimension lines, and north arrow

**Files:**
- `apps/web/src/components/ProductConfigurator/ArchitecturalFloorPlan.tsx` (modify)

**Reference images:** All six (dimension lines and north arrow are identical in style across all)

**What this task produces:**
Adds four dimension lines (two exterior, two interior) and a north arrow triangle to the SVG. These are rendered outside and inside the wall perimeter respectively.

**Data shape to add to the config interface:**
```typescript
interface DimensionAnnotation {
  /** The displayed measurement text (e.g., "5000", "4728"). */
  value: string;
  /** Whether this is an exterior (bold) or interior (light) dimension. */
  type: 'exterior' | 'interior';
  /** Which side of the plan: "top", "left", "right", or "bottom". */
  side: 'top' | 'left' | 'right' | 'bottom';
}
```
Add `dimensions: DimensionAnnotation[]` to the config interface.

**Exterior dimension lines (bold, outside the walls):**

1. **Top dimension** (total outer width):
   - A horizontal line positioned 40 SVG units above the outer wall top edge.
   - Small vertical extension lines (10 SVG units tall) drop down from each end of the dimension line to the outer wall corners.
   - Centred text above the line: the value (e.g., "5000") in bold, 12px, `#1a1a1a`, font-family `"DM Sans, sans-serif"`.

2. **Left dimension** (total outer depth):
   - A vertical line positioned 30 SVG units left of the outer wall left edge.
   - Small horizontal extension lines (10 SVG units wide) extend right from each end to the outer wall corners.
   - Centred text to the left of the line (rotated 90 degrees counter-clockwise): the value (e.g., "5000") in bold, 12px, `#1a1a1a`.

**Interior dimension lines (light, inside the walls):**

3. **Top interior dimension** (inner width):
   - A horizontal line positioned just below the inner face of the north wall (5 SVG units below the inner wall top edge).
   - Small vertical extension lines (5 SVG units) connecting up to the inner wall face at each end.
   - Centred text below the line: the value (e.g., "4728") in regular weight, 8px, `#999999`.

4. **Right interior dimension** (inner depth):
   - A vertical line positioned just inside the inner face of the east wall (5 SVG units to the left of the inner wall right edge).
   - Small horizontal extension lines (5 SVG units) connecting right to the inner wall face at each end.
   - Centred text to the left of the line (rotated 90 degrees): the value (e.g., "4728") in regular weight, 8px, `#999999`.

**Dimension values per floor plan (for Task 0.6 data, documented here):**

| Floor plan | Top exterior | Left exterior | Top interior | Right interior |
|-----------|-------------|--------------|-------------|---------------|
| 5.0m x 5.0m | "5000" | "5000" | "4728" | "4728" |
| 4.15m x 6.0m | "6000" | "4150" | "5728" | "3878" |

**North arrow:**
- A solid black filled triangle (`<polygon>`) centred horizontally on the sliding door opening, positioned below the south wall at the bottom of the door swing arcs.
- Triangle size: approximately 40mm scaled (4 SVG units) wide, 50mm scaled (5 SVG units) tall, pointing downward.
- Fill: `#1a1a1a`, no stroke.
- Surrounded by the two dashed door swing arcs from Task 0.2 (the triangle sits in the V between them, as shown in every reference image).

**Acceptance criteria:**
- "5000" appears in bold above and to the left of the 5x5 plan; "6000" above and "4150" to the left of the 4.15x6 plan.
- Interior dimensions "4728"/"5728"/"3878" appear in lighter text inside the wall perimeter.
- Dimension lines have visible extension/tick lines connecting them to the wall corners.
- A solid black triangle appears below the south entrance, visually matching the reference images.

**Risk:** None. Additive SVG elements with no structural changes to existing rendering.

---

#### Task 0.4: Room zone labels (name + area text)

**Files:**
- `apps/web/src/components/ProductConfigurator/ArchitecturalFloorPlan.tsx` (modify)

**Reference images:** All six (every zone in every layout has a centred label)

**What this task produces:**
Adds room zone labels inside the floor plan. Each label is two lines of centred uppercase text: the room name on the first line, the area on the second line.

**Data shape to add to the config interface:**
```typescript
interface RoomZone {
  /** Room name displayed on the first line (e.g., "OPEN SPACE", "BATHROOM"). Always uppercase. */
  name: string;
  /** Area text displayed on the second line (e.g., "22.35 SQM"). Always uppercase. */
  area: string;
  /** Horizontal centre of the label in mm, measured from the left outer wall face. */
  centerXMm: number;
  /** Vertical centre of the label in mm, measured from the top outer wall face. */
  centerYMm: number;
}
```
Add `zones: RoomZone[]` to the config interface.

**Rendering per zone:**
For each zone, render a `<text>` group at the scaled (centerX, centerY) position:
- Line 1 (room name): font-size 10px, font-weight 600, fill `#333333`, `text-anchor="middle"`, `dominant-baseline="auto"`, font-family `"DM Sans, sans-serif"`.
- Line 2 (area): font-size 8px, font-weight 400, fill `#666666`, `text-anchor="middle"`, positioned 14px below line 1 using a `<tspan>` with `dy="14"`.

**Zone data per layout (exact values extracted from reference images, for Task 0.6):**

| Layout | Zones |
|--------|-------|
| 5x5 Box | OPEN SPACE / 22.35 SQM (centre of room) |
| 5x5 En Suite | BATHROOM / 3.84 SQM (top-left), KITCHEN (top-right, no area shown -- label only), OPEN SPACE / 17.95 SQM (lower half) |
| 5x5 Bedroom | BATHROOM / 3.84 SQM (top-left), KITCHEN (top-right, label only), BEDROOM / 7.18 SQM (mid-left), OPEN SPACE / 10.36 SQM (mid-right) |
| 4.15x6 Box | OPEN SPACE / 22.21 SQM (centre of room) |
| 4.15x6 En Suite | BATHROOM / 3.84 SQM (top-left), KITCHEN (mid-left, label only), OPEN SPACE / 17.81 SQM (right half) |
| 4.15x6 Bedroom | BATHROOM / 3.84 SQM (top-left), BEDROOM / 5.97 SQM (top-right), KITCHEN (bottom-left, label only), OPEN SPACE / 11.36 SQM (bottom-right) |

**Note:** The Kitchen zone in the reference images shows only the name "KITCHEN" without an area value. Handle this by allowing `area` to be an empty string, in which case only line 1 is rendered.

**Acceptance criteria:**
- Box layouts show a single "OPEN SPACE / XX.XX SQM" label centred in the room.
- En Suite and Bedroom layouts show all zone labels in the correct positions (they must not overlap each other or the walls).
- Text is readable at container widths of 200px and above.
- Labels use uppercase text matching the reference image typography.

**Risk:** Low. Position data is in the config, not the component. Adjusting label positions requires only data changes.

---

#### Task 0.5: Internal partition walls, internal doors, and internal dimension lines

**Files:**
- `apps/web/src/components/ProductConfigurator/ArchitecturalFloorPlan.tsx` (modify)

**Reference images:** `500by500_ensuit.jpg`, `500by500_bedroom.jpg`, `415by600_ensuit.jpg`, `415by600_bedroomjpg.jpg`

**What this task produces:**
Adds rendering of internal partition walls (double-line, same style as outer walls), internal door openings (wall breaks with dashed swing arcs), and internal dimension annotations. Box layouts have no internal walls, so this rendering only activates when the config includes internal wall data.

**Data shapes to add to the config interface:**
```typescript
interface InternalDoor {
  /** Distance in mm along the wall segment from the start point to the door opening. */
  offsetMm: number;
  /** Door width in mm (always 700 in current layouts). */
  widthMm: number;
  /** Direction the door swings into, relative to the wall segment. "left" or "right" of the wall
   *  normal, determining which side the quarter-circle arc is drawn on. */
  swingDirection: 'left' | 'right';
  /** Optional label (e.g., "700MM\nSINGLE DOOR"). Rendered next to the door opening. */
  label?: string;
}

interface InternalWall {
  /** Start point in mm from the top-left outer wall corner. */
  startMm: { x: number; y: number };
  /** End point in mm from the top-left outer wall corner. */
  endMm: { x: number; y: number };
  /** Doors along this wall segment. */
  doors: InternalDoor[];
}

interface InternalDimension {
  /** Start point in mm. */
  startMm: { x: number; y: number };
  /** End point in mm. */
  endMm: { x: number; y: number };
  /** Displayed value (e.g., "2536"). */
  value: string;
  /** Whether the label sits above/left or below/right of the line. */
  labelSide: 'above' | 'below' | 'left' | 'right';
}
```
Add `internalWalls?: InternalWall[]` and `internalDimensions?: InternalDimension[]` to the config interface.

**Internal wall rendering:**
For each `InternalWall`, draw a double-line segment from `startMm` to `endMm`:
- Two parallel lines separated by `wallThicknessMm`, centred on the segment path.
- Stroke: `wallColor`, width `0.5` (matching the inner wall line from Task 0.1).
- Wall segments connect to the outer wall where they meet (T-junctions -- the internal wall butts against the inner face of the outer wall).

**Internal door rendering:**
For each door along a wall segment:
- Create a wall break: suppress the double-line wall for `widthMm` starting at `offsetMm` along the segment.
- Draw a dashed quarter-circle arc:
  - Radius = `widthMm` scaled (700mm = 70 SVG units at 0.1 scale).
  - The arc's centre (hinge point) is at one edge of the opening.
  - The arc sweeps 90 degrees from the wall line into the room indicated by `swingDirection`.
  - Stroke: `#999999`, width `0.5`, dash pattern `"3,3"`.
- If `label` is provided, render it near the door opening in small uppercase text (8px, `#666666`).

**Internal dimension line rendering:**
For each `InternalDimension`, draw a thin leader line from `startMm` to `endMm` with:
- A horizontal or vertical line (determined by whether start and end share the same x or y).
- Small tick marks (3 SVG units) at each end, perpendicular to the line.
- The `value` text centred along the line on the specified `labelSide`.
- Font: 7px, `#999999`, regular weight.

**Key measurements per layout (extracted from reference images -- used in Task 0.6 data):**

**5x5 En Suite:**
- One horizontal partition wall from left inner wall face, running right for ~2536mm at y=1600mm from top inner wall. This creates the bathroom zone (2400mm x 1600mm) in the top-left and separates it from the open space below.
- Bathroom door: 700mm opening at 970mm offset along the partition wall, swinging upward (into bathroom).
- Kitchen zone (top-right, width ~2192mm) is open to the main space -- no wall separating it, just a zone label.
- Dimensions to render: 2400, 2192 (top, along inner north wall), 1600 (left, bathroom depth), 1736 (right of door gap), 970, 730 (along partition wall, either side of door), 2536 (partition wall length), 2992 (open space depth below partition).

**5x5 Bedroom:**
- Same horizontal partition wall as En Suite at y=1600mm.
- Additional vertical partition wall from y=1600mm (bottom of bathroom/kitchen zone) downward, at x=~2500mm from left inner wall, running down to near the south wall. This creates the bedroom (left) and open space (right) zones.
- Bathroom: top-left, 2400mm x 1600mm (3.84 SQM).
- Bedroom: mid-left, 7.18 SQM, 700mm door at the boundary with open space, swinging right (into open space).
- Kitchen zone: top-right, open to bedroom zone below.
- Open space: bottom-right, 10.36 SQM.
- Bedroom door: 700mm opening along the vertical partition wall.
- Dimensions to render: 2400, 2192 (along top), 1600 (bathroom depth), 2386 (kitchen/bedroom height), 650 (gap in vertical wall), 1641, 1641 (south wall segments), 1041, 1050.

**4.15x6 En Suite:**
- Same bathroom dimensions (2400mm x 1600mm, 3.84 SQM) and door config as 5x5 En Suite.
- Kitchen zone is below the bathroom on the left side, depth ~2143mm.
- Open space: right side, 17.81 SQM.
- The vertical partition wall runs from the bottom of the bathroom downward, separating kitchen (left) from open space (right).
- Dimensions: 2400, 3191 (along top), 1600, 1736, 970, 730, 2536, 2143.

**4.15x6 Bedroom:**
- Bathroom: top-left (3.84 SQM), same door config.
- Bedroom: top-right, 5.97 SQM, depth ~2000mm, 700mm door.
- Kitchen: bottom-left, depth ~2143mm.
- Open space: bottom-right, 11.36 SQM, height ~1742mm.
- Two partition walls: horizontal at y=~2000mm from top, and vertical at x=~2536mm.
- Bedroom door: 700mm along vertical partition.
- Dimensions: 3191, 2000, 1350, 3441, 400, 2286, 1041.

**Acceptance criteria:**
- The 5x5 En Suite renders with a single horizontal partition wall, bathroom door with swing arc, and dimension annotations matching `500by500_ensuit.jpg`.
- The 5x5 Bedroom renders with two partition walls (horizontal + vertical), two doors (bathroom + bedroom), and all dimension annotations matching `500by500_bedroom.jpg`.
- The 4.15x6 En Suite renders matching `415by600_ensuit.jpg`.
- The 4.15x6 Bedroom renders matching `415by600_bedroomjpg.jpg`.
- Internal walls connect cleanly to outer walls at T-junctions (no gaps or overlaps).
- Door swing arcs are dashed and sweep in the correct direction.

**Risk:** Medium. This is the most complex rendering task due to the number of wall segments, doors, and dimensions across four layouts. Implement and visually verify one layout at a time (start with 5x5 En Suite as the simplest internal layout).

---

#### Task 0.6: Create floor plan config data for all six Studio layouts

**Files:**
- `apps/web/src/data/studio-floor-plans.ts` (NEW)

**Reference images:** All six

**What this task produces:**
A data file exporting six `ArchitecturalFloorPlanConfig` objects (one per floor plan + layout combination) and a lookup function to retrieve the correct config given a floor plan slug and layout slug.

**File structure:**
```typescript
import type { ArchitecturalFloorPlanConfig } from '../components/ProductConfigurator/ArchitecturalFloorPlan';

// --- 5.0m x 5.0m configs ---
const STUDIO_5X5_BOX: ArchitecturalFloorPlanConfig = { ... };
const STUDIO_5X5_ENSUITE: ArchitecturalFloorPlanConfig = { ... };
const STUDIO_5X5_BEDROOM: ArchitecturalFloorPlanConfig = { ... };

// --- 4.15m x 6.0m configs ---
const STUDIO_4X6_BOX: ArchitecturalFloorPlanConfig = { ... };
const STUDIO_4X6_ENSUITE: ArchitecturalFloorPlanConfig = { ... };
const STUDIO_4X6_BEDROOM: ArchitecturalFloorPlanConfig = { ... };

/**
 * Resolves the architectural floor plan config for a given combination
 * of floor plan variant and layout. Returns the Box config for the
 * given floor plan if layoutSlug is null (used on the Floor Plan
 * Selection step before a layout is chosen).
 */
export function getStudioFloorPlanConfig(
  floorPlanSlug: '5x5' | '4x6',
  layoutSlug: 'box' | 'en-suite' | 'bedroom' | null,
): ArchitecturalFloorPlanConfig { ... }
```

**What each config object contains (all fields defined in Tasks 0.1-0.5):**
- `outerWidthMm`, `outerDepthMm`, `wallThicknessMm` (136 for all)
- `wallColor` (default `"#1a1a1a"`, overridden at render time by the selected exterior finish)
- `apertures` array (south wall apertures -- identical aperture types across all layouts of the same floor plan, only offsets differ slightly for bedroom)
- `dimensions` array (exterior and interior dimension annotations)
- `zones` array (room zone labels with centre points and areas)
- `internalWalls` array (empty for Box, populated for En Suite and Bedroom)
- `internalDimensions` array (empty for Box, populated for En Suite and Bedroom)

**Data extraction approach:**
Populate each config using the exact millimetre measurements annotated in the reference images. All measurements are documented in Tasks 0.2, 0.3, 0.4, and 0.5. The reference images serve as the authoritative source.

**Shared data between layouts:**
- The `wallThicknessMm` (136) is consistent across all six layouts.
- The south wall aperture types (700mm T&T window + 1600mm sliding door) are the same across all six layouts, though offsets differ between 5x5 and 4.15x6.
- The bathroom dimensions (2400mm x 1600mm, 3.84 SQM) are identical in all four non-Box layouts. Extract these as shared constants to avoid repetition.

**Acceptance criteria:**
- `getStudioFloorPlanConfig('5x5', 'box')` returns a config that, when passed to `ArchitecturalFloorPlan`, produces an SVG closely matching `500by500_box.jpg`.
- Same for all five remaining combinations.
- The function handles `layoutSlug: null` by returning the Box config (for the Floor Plan Selection step).
- All millimetre values match the annotations visible in the reference images.

**Risk:** Low. This is a data-only task. The component (Tasks 0.1-0.5) handles rendering. Errors in measurements are caught by visual comparison during review.

---

#### Task 0.7: Wire `ArchitecturalFloorPlan` into the configurator page

**Files:**
- `apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx` (modify)

**Reference images:** N/A (integration task, not a visual task)

**What this task produces:**
Replaces the MVP `FloorPlan` component with `ArchitecturalFloorPlan` in the Studio-25 configurator. All other products continue using the existing `FloorPlan` unchanged.

**Prerequisite tasks:** 0.1-0.6 (component + data), plus Phase 2 and 3 tasks that create the floor plan and layout steps.

**Note:** This task is executed alongside Task 3.3 (adding step renderers). It is listed here in Phase 0 for logical grouping but is implemented during Phase 3.

**Changes to `ProductConfiguratorPage.tsx`:**

1. **Import** `ArchitecturalFloorPlan` and `getStudioFloorPlanConfig`.

2. **Floor Plan Selection step (Step 0):**
   - This step only exists for products with `floorPlanVariants` (currently only Studio-25).
   - Render two `FloorPlanCard` components (Task 3.1), each containing an `ArchitecturalFloorPlan`.
   - The 5x5 card calls `getStudioFloorPlanConfig('5x5', null)` (returns Box config).
   - The 4.15x6 card calls `getStudioFloorPlanConfig('4x6', null)` (returns Box config).
   - The floor plan SVG should fill the card width (set CSS `max-width: 100%` on the SVG container within the card).

3. **Layout Selection step (Step 1):**
   - This step only exists for products with `layoutOptions` (currently only Studio-25).
   - Render three `LayoutCard` components (Task 3.2), each containing an `ArchitecturalFloorPlan`.
   - Determine the selected floor plan slug from `state.selections.floorPlanVariantId` (resolve to `'5x5'` or `'4x6'`).
   - Box card: `getStudioFloorPlanConfig(selectedSlug, 'box')`.
   - En Suite card: `getStudioFloorPlanConfig(selectedSlug, 'en-suite')`.
   - Bedroom card: `getStudioFloorPlanConfig(selectedSlug, 'bedroom')`.

4. **Overview step (existing `renderOverviewStep`):**
   - Add a conditional branch: if the product has `floorPlanVariants` (i.e., it is Studio-25), render `ArchitecturalFloorPlan` using `getStudioFloorPlanConfig(selectedFloorPlanSlug, selectedLayoutSlug)`.
   - Otherwise, render the existing `FloorPlan` component (for Compact, Living, Grand).

5. **Exterior and Interior finish steps:**
   - Same conditional: Studio-25 uses `ArchitecturalFloorPlan`, other products use the existing `FloorPlan`.
   - Pass the resolved config with `wallColor` overridden by the selected exterior finish colour.

**How to determine the selected floor plan slug:**
```typescript
const selectedFloorPlanVariant = product.floorPlanVariants?.find(
  v => v.id === state.selections.floorPlanVariantId
);
const floorPlanSlug = (selectedFloorPlanVariant?.slug ?? '5x5') as '5x5' | '4x6';
```

**How to determine the selected layout slug:**
```typescript
const selectedLayout = product.layoutOptions?.find(
  l => l.id === state.selections.layoutOptionId
);
const layoutSlug = (selectedLayout?.slug ?? null) as 'box' | 'en-suite' | 'bedroom' | null;
```

**Acceptance criteria:**
- Studio-25 configurator renders architectural-quality floor plans on all steps.
- Floor Plan Selection step shows two distinct floor plans (square vs. rectangle) with correct proportions.
- Layout Selection step shows three floor plans reflecting the correct internal walls for the selected floor plan variant.
- Compact-15, Living-35, and Grand-45 configurators are completely unaffected (still use the MVP `FloorPlan`).

**Risk:** Low. The conditional branch (`if product has floorPlanVariants`) isolates all changes to Studio-25. The `getStudioFloorPlanConfig` lookup is self-contained.

---

### Phase 1: Data Layer (No UI changes)

#### Task 1.1: Add `FloorPlanVariant`, `LayoutOption`, and `'layout-bundled'` policy to type definitions

**Files:**
- `apps/web/src/types/configurator.ts` (modify)

**What this task produces:**
Four additions to the existing type file. No existing types are modified or removed.

**Changes (in order of insertion):**

1. **Add `FloorPlanVariant` interface** after the `FloorPlanConfig` interface (Section 6). This is the exact interface from Section 3.1 of this plan. Copy it verbatim including the JSDoc comments.

2. **Add `LayoutOption` interface** after `FloorPlanVariant`. This is the exact interface from Section 3.1 of this plan. Copy it verbatim.

3. **Add `'layout-bundled'` to `BathroomKitchenPolicy`** (Section 8, line ~377 of the current file). Change:
   ```typescript
   export type BathroomKitchenPolicy = 'not-available' | 'optional-addon' | 'included';
   ```
   to:
   ```typescript
   export type BathroomKitchenPolicy = 'not-available' | 'optional-addon' | 'layout-bundled' | 'included';
   ```

4. **Add two optional fields to `ConfiguratorProduct`** (Section 9, after the `addons` field). Insert:
   ```typescript
   /** Optional floor plan variants. When present, the configurator shows a floor plan selection step. */
   floorPlanVariants?: ReadonlyArray<FloorPlanVariant>;
   /** Optional interior layout options. When present, the configurator shows a layout selection step. */
   layoutOptions?: ReadonlyArray<LayoutOption>;
   ```

**What NOT to change:** Do not modify any existing interface fields, do not rename anything, do not touch `FinishOption`, `AddonOption`, `ProductSpec`, `IncludedFeature`, `ProductDimensions`, `FloorPlanConfig`, or `ProductImageSet`.

**Acceptance criteria:**
- `tsc --noEmit` passes with zero errors.
- All four existing product definitions in `configurator-products.ts` compile without changes (the new fields are optional).

**Risk:** None. Additive changes only.

---

#### Task 1.2: Add floor plan variants, layout options, and remove B&K add-on from Studio-25 seed data

**Files:**
- `apps/web/src/data/configurator-products.ts` (modify)

**What this task produces:**
Four changes to the `STUDIO_25` constant. No other product constants are touched.

**Changes to `STUDIO_25`:**

1. **Add `floorPlanVariants` array** (after the `finishCategories` field). Use the exact data from Section 3.4 of this plan. For the `floorPlan` field within each variant:
   - The `5x5` variant reuses the existing `STUDIO_25.floorPlan` value (copy it inline).
   - The `4x6` variant uses a new `FloorPlanConfig` with apertures positioned per the `415by600_box.jpg` reference (documented in Task 0.2):
     ```typescript
     floorPlan: {
       apertures: [
         { type: 'tilt-turn-window', wall: 'south', widthMm: 700,  heightMm: 2100 },
         { type: 'sliding-door',     wall: 'south', widthMm: 1600, heightMm: 2100 },
       ],
       dimensionLabels: { width: '6.0m', depth: '4.15m' },
     },
     ```

2. **Add `layoutOptions` array** (after `floorPlanVariants`). Use the exact data from Section 3.4 of this plan (Box at +0, En Suite at +1,200,000 cents, Bedroom at +1,600,000 cents).

3. **Change `bathroomKitchenPolicy`** from `'optional-addon'` to `'layout-bundled'`.

4. **Remove the bathroom-kitchen add-on** from the `addons` array. Delete the object with `id: 'ao-studio-bathroom-kitchen'`. Keep `ao-studio-triple-glazing` (now `displayOrder: 1`) and `ao-studio-composite-decking` (now `displayOrder: 2`).

**What NOT to change:** Do not modify `COMPACT_15`, `LIVING_35`, `GRAND_45`, or any shared constants (`EXTERIOR_FINISH_OPTIONS`, `INTERIOR_FINISH_OPTIONS`, `PRICING_NOTE`, `buildFinishCategories`). Do not change the `CONFIGURATOR_PRODUCTS` or `CONFIGURATOR_PRODUCTS_BY_SLUG` exports.

**Acceptance criteria:**
- `tsc --noEmit` passes.
- `CONFIGURATOR_PRODUCTS_BY_SLUG['studio-25'].floorPlanVariants` has length 2.
- `CONFIGURATOR_PRODUCTS_BY_SLUG['studio-25'].layoutOptions` has length 3.
- `CONFIGURATOR_PRODUCTS_BY_SLUG['studio-25'].addons` has length 2 (no bathroom-kitchen).
- `CONFIGURATOR_PRODUCTS_BY_SLUG['studio-25'].bathroomKitchenPolicy === 'layout-bundled'`.
- All other products remain unchanged.

**Risk:** Low. The bathroom-kitchen add-on removal means the Studio add-ons step immediately shows only two cards. This is expected and correct.

---

#### Task 1.3: Verify `garden-room-data.ts` is unaffected

**Files:**
- `apps/web/src/data/garden-room-data.ts` (review only -- no modifications expected)

**What this task produces:**
Verification that the garden room page data (product cards, showcase, quick view) still compiles and displays correctly after the Task 1.1 and 1.2 changes.

**Verification steps:**
1. Confirm `tsc --noEmit` passes for this file.
2. Read through `buildGardenRoomProduct('studio-25', {...})` and verify it only accesses fields that still exist on `ConfiguratorProduct`: `slug`, `dimensions`, `image`, `basePriceCentsInclVat`, `planningPermission`, `available`, `leadTime`, `displayOrder`. None of these were modified.
3. Confirm the Studio-25 entry in `CANONICAL_PRODUCTS` still produces valid `PRODUCT_SHOWCASE_PRODUCTS`, `GARDEN_ROOM_PRODUCTS`, and `GARDEN_ROOM_QUICK_VIEW` entries.

**What NOT to change:** Nothing. This is a review-only task. If compilation fails (unexpected), investigate and fix here.

**Acceptance criteria:**
- `tsc --noEmit` passes.
- The `/garden-room` page renders Studio-25 with the correct base price (EUR 39,500), image, and metadata.

**Risk:** None. The new optional fields are not accessed by the garden room page projection functions.

---

### Phase 2: Configurator State & Logic

#### Task 2.1: Extend `ConfiguratorStepId` and `ConfiguratorSelections` with floor plan and layout fields

**Files:**
- `apps/web/src/components/ProductConfigurator/types.ts` (modify)

**What this task produces:**
Two changes to the existing types file.

**Change 1 -- Extend `ConfiguratorStepId` (line ~41):**
Add `'floor-plan'` and `'layout'` to the union. The new type becomes:
```typescript
export type ConfiguratorStepId =
  | 'floor-plan'
  | 'layout'
  | 'overview'
  | 'exterior'
  | 'interior'
  | 'addons'
  | 'summary';
```

**Change 2 -- Extend `ConfiguratorSelections` (line ~62):**
Add two new fields at the top of the interface:
```typescript
export interface ConfiguratorSelections {
  /** Selected floor plan variant ID, or null if no variant step exists for this product. */
  floorPlanVariantId: string | null;
  /** Selected layout option ID, or null if no layout step exists for this product. */
  layoutOptionId: string | null;
  exteriorFinishId: string | null;
  interiorFinishId: string | null;
  selectedAddonIds: string[];
}
```

**What NOT to change:** Do not modify `ConfiguratorStep`, `SummaryTabId`, `ConfiguratorFormData`, `FormStatus`, or any other types in this file.

**Acceptance criteria:**
- `tsc --noEmit` passes. (Note: `useConfiguratorState.ts` will have a type error on `DEFAULT_SELECTIONS` until Task 2.3 updates it. This is expected and acceptable as these tasks are done sequentially.)

**Risk:** Low.

---

#### Task 2.2: Create `buildConfiguratorSteps()` function to generate product-specific step sequences

**Files:**
- `apps/web/src/components/ProductConfigurator/constants.ts` (modify)

**What this task produces:**
A new exported function that returns the correct step sequence for any product. The existing static `CONFIGURATOR_STEPS` export is kept for backward compatibility but will be deprecated once all consumers switch to the dynamic builder.

**Changes:**

1. **Rename** the existing export:
   ```typescript
   // Before:
   export const CONFIGURATOR_STEPS: ReadonlyArray<ConfiguratorStep> = [ ... ];
   // After:
   const BASE_STEPS: ReadonlyArray<ConfiguratorStep> = [ ... ];
   export const CONFIGURATOR_STEPS = BASE_STEPS; // backward compat, removed in Task 3.3
   ```

2. **Add the builder function:**
   ```typescript
   import type { ConfiguratorProduct } from '../../types/configurator';

   /**
    * Returns the ordered step sequence for a given product. Inserts
    * floor-plan and/or layout steps at the beginning when the product
    * defines those optional arrays. Products without them get BASE_STEPS.
    */
   export function buildConfiguratorSteps(
     product: ConfiguratorProduct
   ): ReadonlyArray<ConfiguratorStep> {
     const steps: ConfiguratorStep[] = [];

     if (product.floorPlanVariants && product.floorPlanVariants.length > 0) {
       steps.push({ id: 'floor-plan', label: 'Floor Plan' });
     }
     if (product.layoutOptions && product.layoutOptions.length > 0) {
       steps.push({ id: 'layout', label: 'Layout' });
     }

     steps.push(...BASE_STEPS);
     return steps;
   }
   ```

**Behaviour by product:**

| Product | `floorPlanVariants` | `layoutOptions` | Resulting steps |
|---------|-------------------|----------------|-----------------|
| Compact-15 | undefined | undefined | Overview, Exterior, Interior, Add-ons, Summary (5 steps) |
| Studio-25 | 2 variants | 3 options | Floor Plan, Layout, Overview, Exterior, Interior, Add-ons, Summary (7 steps) |
| Living-35 | undefined | undefined | 5 steps (same as Compact) |
| Grand-45 | undefined | undefined | 5 steps (same as Compact) |

**Acceptance criteria:**
- `buildConfiguratorSteps(STUDIO_25)` returns a 7-element array with ids `['floor-plan', 'layout', 'overview', 'exterior', 'interior', 'addons', 'summary']`.
- `buildConfiguratorSteps(COMPACT_15)` returns a 5-element array with ids `['overview', 'exterior', 'interior', 'addons', 'summary']`.
- The existing `CONFIGURATOR_STEPS` export still works for any files that haven't migrated yet.

**Risk:** Low. The builder function is additive. Existing code using `CONFIGURATOR_STEPS` is not broken.

---

#### Task 2.3: Update `useConfiguratorState` hook for dynamic steps, new selections, and new actions

**Files:**
- `apps/web/src/components/ProductConfigurator/useConfiguratorState.ts` (modify)

**What this task produces:**
The state hook now supports products with optional floor plan and layout steps. Existing behaviour for products without these steps is unchanged.

**Changes (6 total):**

1. **Import `buildConfiguratorSteps`** and replace the `CONFIGURATOR_STEPS` import:
   ```typescript
   import { buildConfiguratorSteps, SESSION_STORAGE_KEY_PREFIX } from './constants';
   ```

2. **Compute the step array** inside the hook body (stable across renders since product is a constant):
   ```typescript
   const steps = buildConfiguratorSteps(product);
   ```
   Replace all references to `CONFIGURATOR_STEPS` within the hook with `steps`.

3. **Update `DEFAULT_SELECTIONS`** to include the new fields:
   ```typescript
   const DEFAULT_SELECTIONS: ConfiguratorSelections = {
     floorPlanVariantId: null,
     layoutOptionId: null,
     exteriorFinishId: null,
     interiorFinishId: null,
     selectedAddonIds: [],
   };
   ```

4. **Update `canProceed`** switch -- add two new cases:
   ```typescript
   case 'floor-plan':
     return selections.floorPlanVariantId !== null;
   case 'layout':
     return selections.layoutOptionId !== null;
   ```

5. **Add two new selection actions** (alongside `setExteriorFinish`, `setInteriorFinish`, `toggleAddon`):
   ```typescript
   const setFloorPlanVariant = useCallback((variantId: string) => {
     setSelections((prev) => ({ ...prev, floorPlanVariantId: variantId }));
   }, []);

   const setLayoutOption = useCallback((optionId: string) => {
     setSelections((prev) => ({ ...prev, layoutOptionId: optionId }));
   }, []);
   ```

6. **Update the return type and return object:**
   - Add `steps: ReadonlyArray<ConfiguratorStep>` to `ConfiguratorStateAPI`.
   - Add `setFloorPlanVariant` and `setLayoutOption` to the return.
   - Update `totalPriceCents` calculation to use the extended `calculateTotalPriceCents` from Task 2.4.

**Session persistence migration:**
When `loadPersistedState` returns a `PersistedState` from a previous session that lacks `floorPlanVariantId` and `layoutOptionId`, merge with defaults:
```typescript
const persisted = loadPersistedState(product.slug);
return persisted?.selections
  ? { ...DEFAULT_SELECTIONS, ...persisted.selections }
  : DEFAULT_SELECTIONS;
```
This ensures old sessions don't crash.

**Acceptance criteria:**
- Studio-25 configurator starts at step 0 (Floor Plan), with `canProceed` false until a variant is selected.
- Selecting a floor plan variant enables Continue; advancing to step 1 (Layout) works.
- Selecting a layout enables Continue; advancing to step 2 (Overview) works.
- Other products start at step 0 (Overview), same as before.
- Session persistence works: refreshing the page restores selections including floor plan and layout.
- Old Studio-25 sessions (without the new fields) load without error.

**Risk:** Medium. This is the most heavily modified file. Test session persistence carefully.

---

#### Task 2.4: Extend `calculateTotalPriceCents` to include floor plan and layout price deltas

**Files:**
- `apps/web/src/components/ProductConfigurator/utils.ts` (modify)

**What this task produces:**
The price calculation function accepts optional floor plan and layout parameters and includes their price deltas in the total.

**Current signature:**
```typescript
export function calculateTotalPriceCents(
  basePriceCents: number,
  allAddons: ReadonlyArray<AddonOption>,
  selectedIds: ReadonlyArray<string>,
): number
```

**New signature (backward compatible -- new params are optional):**
```typescript
import type { FloorPlanVariant, LayoutOption } from '../../types/configurator';

export function calculateTotalPriceCents(
  basePriceCents: number,
  allAddons: ReadonlyArray<AddonOption>,
  selectedAddonIds: ReadonlyArray<string>,
  floorPlanVariants?: ReadonlyArray<FloorPlanVariant>,
  selectedFloorPlanVariantId?: string | null,
  layoutOptions?: ReadonlyArray<LayoutOption>,
  selectedLayoutOptionId?: string | null,
): number {
  const addonDelta = allAddons
    .filter((a) => selectedAddonIds.includes(a.id))
    .reduce((sum, a) => sum + a.priceCentsInclVat, 0);

  const floorPlanDelta = floorPlanVariants
    ?.find((v) => v.id === selectedFloorPlanVariantId)
    ?.priceDeltaCentsInclVat ?? 0;

  const layoutDelta = layoutOptions
    ?.find((l) => l.id === selectedLayoutOptionId)
    ?.priceDeltaCentsInclVat ?? 0;

  return basePriceCents + addonDelta + floorPlanDelta + layoutDelta;
}
```

**Acceptance criteria:**
- Calling with only the first 3 args (existing callers) returns the same result as before.
- Calling with Studio-25 data + En Suite layout selected returns `3_950_000 + 1_200_000 = 5_150_000` (EUR 51,500) plus any selected add-ons.
- Calling with Studio-25 data + Bedroom layout selected returns `3_950_000 + 1_600_000 = 5_550_000` (EUR 55,500) plus any selected add-ons.
- Floor plan deltas (currently 0 for both variants) are correctly included.

**Risk:** None. Existing callers omit the new params and get the same result.

---

### Phase 3: UI Components

#### Task 3.1: Create `FloorPlanCard` selectable card component

**Files:**
- `apps/web/src/components/ProductConfigurator/FloorPlanCard.tsx` (NEW)

**What this task produces:**
A reusable card component representing one selectable floor plan variant. Used on the Floor Plan Selection step (two cards: 5x5 and 4.15x6).

**Props interface:**
```typescript
interface FloorPlanCardProps {
  /** The floor plan variant data. */
  variant: FloorPlanVariant;
  /** Whether this card is currently selected. */
  isSelected: boolean;
  /** Called with the variant ID when the user clicks the card. */
  onSelect: (variantId: string) => void;
  /** React children -- the ArchitecturalFloorPlan SVG is passed as a child. */
  children: React.ReactNode;
}
```

**Card layout (top to bottom):**
1. **Floor plan preview** -- the `children` prop (an `ArchitecturalFloorPlan` SVG). Occupies the top ~70% of the card.
2. **Dimension label** -- `variant.label` (e.g., "5.0m x 5.0m"), bold, 16px, centred.
3. **Description** -- `variant.description` (e.g., "Square footprint"), regular, 13px, `#666`, centred.

**Selection indicator:**
- Unselected: `1px solid #e0ddd8` border, `#ffffff` background, subtle hover shadow.
- Selected: `2px solid #1a1a1a` border, faint background tint `#fafaf8`, checkmark icon in the top-right corner (a 20x20 circle with a check SVG, matching the `AddonCard` pattern).

**Interaction:**
- The entire card is a `<button>` element with `type="button"`.
- `onClick` calls `onSelect(variant.id)`.
- `aria-pressed={isSelected}` for accessibility.
- `cursor: pointer` on hover.

**CSS classes (defined in Task 3.5):**
- `.configurator__floor-plan-card`
- `.configurator__floor-plan-card--selected`
- `.configurator__floor-plan-card-preview` (SVG container)
- `.configurator__floor-plan-card-label`
- `.configurator__floor-plan-card-desc`

**Acceptance criteria:**
- Two FloorPlanCard instances render side-by-side on desktop, stacked on mobile.
- Clicking a card visually selects it (border darkens, checkmark appears).
- Only one card can be selected at a time (managed by parent, not this component).
- Keyboard navigable (Tab + Enter/Space to select).

**Risk:** None. New file.

---

#### Task 3.2: Create `LayoutCard` selectable card component

**Files:**
- `apps/web/src/components/ProductConfigurator/LayoutCard.tsx` (NEW)

**What this task produces:**
A reusable card component representing one selectable layout option. Used on the Layout Selection step (three cards: Box, En Suite, Bedroom).

**Props interface:**
```typescript
interface LayoutCardProps {
  /** The layout option data. */
  layout: LayoutOption;
  /** Whether this card is currently selected. */
  isSelected: boolean;
  /** Called with the layout ID when the user clicks the card. */
  onSelect: (layoutId: string) => void;
  /** React children -- the ArchitecturalFloorPlan SVG is passed as a child. */
  children: React.ReactNode;
}
```

**Card layout (top to bottom):**
1. **Floor plan preview** -- `children` (an `ArchitecturalFloorPlan` SVG). Occupies the top ~60% of the card.
2. **Layout name** -- `layout.name` (e.g., "En Suite"), bold, 16px.
3. **Description** -- `layout.description`, regular, 13px, `#666`.
4. **Price line** -- formatted price delta:
   - If `layout.priceDeltaCentsInclVat === 0`: display "Included" in `#333`.
   - Otherwise: display "+EUR XX,XXX" using `formatPriceCents()` prefixed with "+", in `#333`.
5. **Feature badges** -- a horizontal row of small pill-shaped badges indicating bundled features:
   - If `layout.includesBathroom`: badge "Bathroom".
   - If `layout.includesKitchen`: badge "Kitchen".
   - If `layout.includesBedroomWall`: badge "Bedroom Wall".
   - If none are true (Box layout): badge "Open Plan".
   - Badge style: `#f0f0f0` background, `#333` text, 11px, rounded pill, 4px 10px padding.

**Selection indicator:** Same pattern as `FloorPlanCard` -- border change + checkmark on selection.

**Interaction:** Same as `FloorPlanCard` -- `<button>`, `aria-pressed`, keyboard accessible.

**CSS classes (defined in Task 3.5):**
- `.configurator__layout-card`
- `.configurator__layout-card--selected`
- `.configurator__layout-card-preview`
- `.configurator__layout-card-name`
- `.configurator__layout-card-desc`
- `.configurator__layout-card-price`
- `.configurator__layout-card-badges`
- `.configurator__layout-card-badge`

**Acceptance criteria:**
- Three LayoutCard instances render in a row on desktop, stacked on mobile.
- Box card shows "Included" and an "Open Plan" badge.
- En Suite card shows "+EUR 12,000" and "Bathroom" + "Kitchen" badges.
- Bedroom card shows "+EUR 16,000" and "Bathroom" + "Kitchen" + "Bedroom Wall" badges.
- Selection visual feedback matches the FloorPlanCard.

**Risk:** None. New file.

---

#### Task 3.3: Add `renderFloorPlanStep()` and `renderLayoutStep()` to `ProductConfiguratorPage`, and update step router and summary

**Files:**
- `apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx` (modify)

**What this task produces:**
The configurator page gains two new step renderers and all existing steps are updated to use dynamic data. This is the largest single task in the plan.

**Changes (7 total):**

1. **Update imports:**
   - Add: `FloorPlanCard`, `LayoutCard`, `ArchitecturalFloorPlan`, `getStudioFloorPlanConfig`.
   - Remove: the direct `CONFIGURATOR_STEPS` import (replaced by `state.steps` from the hook).

2. **Add `renderFloorPlanStep()` function** (renders Step 0 for Studio-25):
   - Heading: "Choose Your Floor Plan" / "Select the footprint for your {product.name}".
   - Render a `.configurator__floor-plan-grid` containing one `FloorPlanCard` per variant in `product.floorPlanVariants`.
   - Each card's child is an `ArchitecturalFloorPlan` with the Box config for that variant (via `getStudioFloorPlanConfig(variant.slug, null)`).
   - Selection handler: `state.setFloorPlanVariant(variant.id)`.

3. **Add `renderLayoutStep()` function** (renders Step 1 for Studio-25):
   - Heading: "Choose Your Layout" / "Select the interior layout for your {product.name}".
   - Resolve the selected floor plan slug from `state.selections.floorPlanVariantId`.
   - Render a `.configurator__layout-grid` containing one `LayoutCard` per option in `product.layoutOptions`.
   - Each card's child is an `ArchitecturalFloorPlan` with the config for `(selectedFloorPlanSlug, layout.slug)`.
   - Selection handler: `state.setLayoutOption(layout.id)`.

4. **Update `renderStepContent()` switch** -- add two cases:
   ```typescript
   case 'floor-plan':
     return renderFloorPlanStep();
   case 'layout':
     return renderLayoutStep();
   ```

5. **Update `renderOverviewStep()`** -- replace the `FloorPlan` rendering with conditional logic (Task 0.7):
   - If `product.floorPlanVariants` exists: render `ArchitecturalFloorPlan` with the config matching selected floor plan + layout.
   - Else: render the existing MVP `FloorPlan` component (unchanged for other products).

6. **Update `renderSummaryStep()`** -- add a layout line item to the price breakdown:
   ```typescript
   {selectedLayout && selectedLayout.priceDeltaCentsInclVat > 0 && (
     <div className="configurator__price-line configurator__price-line--addon">
       <span>{selectedLayout.name} layout</span>
       <span>+{formatPriceCents(selectedLayout.priceDeltaCentsInclVat)}</span>
     </div>
   )}
   ```
   Also update the configuration summary in `renderConsultationForm()` to include the floor plan dimensions and layout name.

7. **Replace all `CONFIGURATOR_STEPS` references** with `state.steps` (the dynamic step array from the hook). This affects: `currentStep` lookup, bottom nav logic, and any step-index calculations.

**Acceptance criteria:**
- Studio-25 configurator: all 7 steps render correctly in sequence.
- Floor Plan step shows 2 cards with architectural floor plans; selecting one enables Continue.
- Layout step shows 3 cards with correct floor plans for the selected footprint; selecting one enables Continue.
- Overview shows the architectural floor plan matching both selections.
- Summary includes a layout line item in the price breakdown (if En Suite or Bedroom).
- Other products: all 5 steps render as before with no visual changes.

**Risk:** Medium. This is the largest change. Test all step transitions for both Studio and non-Studio products.

---

#### Task 3.4: Pass dynamic steps array to `ProgressBar` as a prop

**Files:**
- `apps/web/src/components/ProductConfigurator/ProgressBar.tsx` (modify)

**What this task produces:**
The ProgressBar renders the correct number of steps for any product, using a prop instead of importing the static constant.

**Current behaviour:** The ProgressBar imports `CONFIGURATOR_STEPS` directly from `constants.ts` and uses it to determine step count and labels.

**Change:**
1. Add a `steps: ReadonlyArray<ConfiguratorStep>` prop to the ProgressBar props interface.
2. Replace the internal `CONFIGURATOR_STEPS` reference with the `steps` prop.
3. Remove the `CONFIGURATOR_STEPS` import.
4. In `ProductConfiguratorPage.tsx`, pass `steps={state.steps}` to the ProgressBar.

**Acceptance criteria:**
- Studio-25 ProgressBar shows 7 steps: Floor Plan, Layout, Overview, Exterior, Interior, Add-ons, Summary.
- Other products show 5 steps: Overview, Exterior, Interior, Add-ons, Summary.
- Step completion tracking and click-to-navigate behaviour still works correctly for both step counts.

**Risk:** Low. The ProgressBar is a presentational component; changing its data source from import to prop is straightforward.

---

#### Task 3.5: Add CSS for floor plan and layout grids, cards, and responsive breakpoints

**Files:**
- `apps/web/src/components/ProductConfigurator/ProductConfigurator.css` (modify)

**What this task produces:**
CSS rules for the two new step layouts and their card components.

**Rules to add:**

1. **Floor plan grid** (2-column on desktop, 1-column on mobile):
   ```css
   .configurator__floor-plan-grid {
     display: grid;
     grid-template-columns: 1fr 1fr;
     gap: 16px;
     margin-top: 24px;
   }
   @media (max-width: 768px) {
     .configurator__floor-plan-grid { grid-template-columns: 1fr; }
   }
   ```

2. **Floor plan card** (selectable button styling):
   ```css
   .configurator__floor-plan-card {
     /* Matches existing AddonCard/FinishCard pattern: white bg, light border,
        rounded corners, padding, transition, cursor pointer */
   }
   .configurator__floor-plan-card--selected {
     border-color: #1a1a1a;
     border-width: 2px;
   }
   ```

3. **Layout grid** (3-column on desktop, 1-column on mobile):
   ```css
   .configurator__layout-grid {
     display: grid;
     grid-template-columns: repeat(3, 1fr);
     gap: 16px;
     margin-top: 24px;
   }
   @media (max-width: 768px) {
     .configurator__layout-grid { grid-template-columns: 1fr; }
   }
   ```

4. **Layout card** (same selectable pattern as floor plan card, plus sub-elements):
   - `.configurator__layout-card-price` -- font-weight 600, margin-top 8px.
   - `.configurator__layout-card-badges` -- display flex, gap 6px, flex-wrap wrap, margin-top 8px.
   - `.configurator__layout-card-badge` -- pill styling (border-radius 12px, padding 2px 10px, background `#f0f0f0`, font-size 11px).

**Design consistency:** All card styles must match the existing configurator visual language: `#1a1a1a` for selected borders, `#e0ddd8` for unselected borders, `0.2s ease` transitions, `DM Sans` font family, minimal shadows.

**Acceptance criteria:**
- Floor plan cards display in a 2-column grid on desktop, stacking to 1 column below 768px.
- Layout cards display in a 3-column grid on desktop, stacking below 768px.
- Selected cards have a visible dark border and smooth transition.
- Feature badges render as horizontal pills below the price.
- Card styling is visually consistent with existing FinishCard and AddonCard.

**Risk:** None. Additive CSS.

---

### Phase 4: Form Submission & API

#### Task 4.1: Add floor plan and layout data to the consultation form API payload

**Files:**
- `apps/web/src/components/ProductConfigurator/useConfiguratorState.ts` (modify -- inside `submitForm`)

**What this task produces:**
Two new optional fields in the API request body sent when the user submits the consultation form.

**Changes to the `submitForm` function (inside the `try` block, before the `apiClient.submitEnquiry` call):**

1. **Resolve the selected floor plan variant slug:**
   ```typescript
   const floorPlanVariant = product.floorPlanVariants?.find(
     (v) => v.id === selections.floorPlanVariantId
   );
   ```

2. **Resolve the selected layout slug:**
   ```typescript
   const layoutOption = product.layoutOptions?.find(
     (l) => l.id === selections.layoutOptionId
   );
   ```

3. **Add to the `apiClient.submitEnquiry` payload:**
   ```typescript
   configuratorFloorPlan: floorPlanVariant?.slug || undefined,
   configuratorLayout: layoutOption?.slug || undefined,
   ```
   These are optional fields. The API ignores unknown fields, so no backend changes are needed immediately.

4. **Update the configuration summary** in `renderConsultationForm()` (in `ProductConfiguratorPage.tsx`). Change the existing summary line to include floor plan and layout:
   ```typescript
   Your configuration: <strong>{product.name}</strong>,{' '}
   {floorPlanVariant
     ? `${floorPlanVariant.widthM}m x ${floorPlanVariant.depthM}m`
     : `${product.dimensions.widthM}m x ${product.dimensions.depthM}m`},{' '}
   {layoutOption && <><strong>{layoutOption.name}</strong> layout, </>}
   <strong>{selectedExterior?.name ?? 'No exterior'}</strong>,{' '}
   <strong>{selectedInterior?.name ?? 'No interior'}</strong>
   ```

**Acceptance criteria:**
- Studio-25: the API payload includes `configuratorFloorPlan: "5x5"` (or `"4x6"`) and `configuratorLayout: "box"` (or `"en-suite"` or `"bedroom"`).
- The form summary text shows: "The Studio, 5.0m x 5.0m, En Suite layout, Teak, Stone" (example).
- Other products: these fields are `undefined` and omitted from the payload.

**Risk:** Low. New optional fields. The API ignores them until the backend is updated.

---

### Phase 5: Testing & Validation

#### Task 5.1: Manual testing checklist

**What this task produces:**
A structured test pass covering all affected flows. Each check should be verified in a browser.

**A. Studio-25 configurator -- full flow (7 steps):**

| # | Step | Check | Expected result |
|---|------|-------|-----------------|
| A1 | Floor Plan (step 0) | Page loads at step 0 | Two floor plan cards visible (5x5 square, 4.15x6 rectangle) |
| A2 | Floor Plan | Click 5x5 card | Card shows selected state (dark border + checkmark); Continue button enables |
| A3 | Floor Plan | Click 4.15x6 card | Selection switches; 5x5 deselects; Continue still enabled |
| A4 | Floor Plan | Click Continue | Advances to Layout step (step 1) |
| A5 | Layout (step 1) | Three layout cards visible | Box, En Suite, Bedroom -- each showing correct floor plan for the selected footprint |
| A6 | Layout | Box card pricing | Shows "Included" (no price delta) |
| A7 | Layout | En Suite card pricing | Shows "+EUR 12,000" |
| A8 | Layout | Bedroom card pricing | Shows "+EUR 16,000" |
| A9 | Layout | Select En Suite | Sticky header total updates to EUR 51,500 (39,500 + 12,000) |
| A10 | Layout | Select Bedroom | Sticky header total updates to EUR 55,500 (39,500 + 16,000) |
| A11 | Layout | Select Box | Sticky header total returns to EUR 39,500 |
| A12 | Overview (step 2) | Floor plan display | Shows ArchitecturalFloorPlan matching selected footprint + layout |
| A13 | Add-ons (step 5) | Add-on cards visible | Only "Triple Glazing Upgrade" and "Composite Decking Step" -- no "Bathroom + Kitchen" |
| A14 | Summary (step 6) | Price breakdown | Shows base price + layout delta (if non-zero) + any add-ons = correct total |
| A15 | Summary | Configuration summary text | Includes floor plan dimensions and layout name |
| A16 | ProgressBar | Step count | 7 steps shown with correct labels |
| A17 | ProgressBar | Back navigation | Clicking a completed step navigates back; all steps remain clickable |
| A18 | Session | Refresh page | All selections (floor plan, layout, finishes, add-ons) restored |
| A19 | Session | Old session migration | Clear sessionStorage, set a legacy key (without floorPlanVariantId/layoutOptionId), reload -- page loads without error at step 0 |

**B. Other products -- regression checks:**

| # | Product | Check | Expected result |
|---|---------|-------|-----------------|
| B1 | Compact-15 | Load configurator | 5-step flow: Overview, Exterior, Interior, Add-ons, Summary |
| B2 | Compact-15 | No floor plan/layout steps | Step 0 is Overview; no Floor Plan or Layout step exists |
| B3 | Living-35 | Load configurator | 5-step flow, same as before |
| B4 | Grand-45 | Load configurator | 5-step flow, same as before |
| B5 | All products | Price calculation | Total = base + selected add-ons (no layout or floor plan deltas) |

**C. Garden room page:**

| # | Check | Expected result |
|---|-------|-----------------|
| C1 | Product cards | All four product cards render with correct images, prices, and CTAs |
| C2 | Studio-25 card | Base price shows EUR 39,500 (unchanged) |
| C3 | Quick view modal | Studio-25 quick view shows correct specs and description |

**D. Floor plan visual accuracy (Phase 0):**

| # | Config | Reference image | Check |
|---|--------|----------------|-------|
| D1 | 5x5 Box | `500by500_box.jpg` | Outer walls, apertures, dimensions, north arrow, "OPEN SPACE 22.35 SQM" label |
| D2 | 5x5 En Suite | `500by500_ensuit.jpg` | Internal partition wall, bathroom door arc, "BATHROOM 3.84 SQM" + "KITCHEN" + "OPEN SPACE 17.95 SQM" |
| D3 | 5x5 Bedroom | `500by500_bedroom.jpg` | Two partition walls, two door arcs, four zone labels |
| D4 | 4.15x6 Box | `415by600_box.jpg` | Portrait aspect ratio, correct aperture positions |
| D5 | 4.15x6 En Suite | `415by600_ensuit.jpg` | Kitchen zone in lower-left, correct dimensions |
| D6 | 4.15x6 Bedroom | `415by600_bedroomjpg.jpg` | Bedroom top-right, kitchen bottom-left, correct dimensions |

---

## 7. Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Architectural floor plan coordinate precision | Medium | Medium | Visually compare each SVG against reference image during Task 0.x review; iterate on measurements |
| Session storage migration for existing studio-25 sessions | Medium | Low | Merge persisted state with defaults; missing fields get null |
| ProgressBar assumes static step count | Medium | Medium | Refactor to accept steps as prop |
| API endpoint does not accept new fields | Low | Low | New fields are sent as optional; backend ignores unknown fields |
| ArchitecturalFloorPlan performance with complex layouts | Low | Low | SVG node count is bounded (~50-100 elements per layout); no runtime performance concern |
| Price calculation change affects existing quote comparisons | Low | Low | Layout price is additive; base price unchanged |

---

## 8. Files Changed Summary

| File | Change Type | Phase | Description |
|------|------------|-------|-------------|
| `apps/web/src/components/ProductConfigurator/ArchitecturalFloorPlan.tsx` | **New** | 0 | Data-driven architectural SVG floor plan renderer |
| `apps/web/src/data/studio-floor-plans.ts` | **New** | 0 | Config data for all six Studio 25m² floor plan + layout combinations |
| `apps/web/src/types/configurator.ts` | Modified | 1 | Add FloorPlanVariant, LayoutOption, layout-bundled policy, optional product fields |
| `apps/web/src/data/configurator-products.ts` | Modified | 1 | Add variants + layouts to Studio-25; remove B&K add-on; update policy |
| `apps/web/src/components/ProductConfigurator/types.ts` | Modified | 2 | Add floor-plan + layout step IDs; extend selections |
| `apps/web/src/components/ProductConfigurator/constants.ts` | Modified | 2 | Add buildConfiguratorSteps() function |
| `apps/web/src/components/ProductConfigurator/useConfiguratorState.ts` | Modified | 2 | Dynamic steps; new selection fields; updated canProceed + price calc |
| `apps/web/src/components/ProductConfigurator/utils.ts` | Modified | 2 | Extended calculateTotalPriceCents signature |
| `apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx` | Modified | 0+3 | Wire ArchitecturalFloorPlan; add floor-plan + layout step renderers; update step router |
| `apps/web/src/components/ProductConfigurator/ProgressBar.tsx` | Modified | 3 | Accept dynamic steps array as prop |
| `apps/web/src/components/ProductConfigurator/FloorPlanCard.tsx` | **New** | 3 | Floor plan selection card component |
| `apps/web/src/components/ProductConfigurator/LayoutCard.tsx` | **New** | 3 | Layout selection card component |
| `apps/web/src/components/ProductConfigurator/ProductConfigurator.css` | Modified | 3 | Add styles for floor-plan and layout grids/cards |
| `apps/web/src/data/garden-room-data.ts` | Reviewed | 1 | No changes expected (projection ignores new optional fields) |

---

## 9. Implementation Order

```
Phase 0 (Floor Plan Visual Upgrade) -- PREREQUISITE, runs before all other phases
  0.1 Core component shell ──────┐
  0.2 Apertures ─────────────────┤ Sequential: each builds on the previous
  0.3 Dimensions + north arrow ──┤
  0.4 Room zone labels ──────────┤
  0.5 Internal walls + doors ────┘
  0.6 Floor plan config data ──── Depends on 0.1-0.5 (component must exist)
  0.7 Integration into steps ──── Depends on 0.6 + Phase 3

Phase 1 (Data Layer)
  1.1 Types ──────────────┐
  1.2 Seed Data ──────────┤ No dependencies between these two
  1.3 Garden Room Data ───┘ (verify no breakage)

Phase 2 (State & Logic)
  2.1 Step IDs ───────────┐
  2.2 Step Builder ───────┤ 2.3 depends on 2.1 + 2.2
  2.3 State Hook ─────────┤
  2.4 Price Calc ─────────┘

Phase 3 (UI Components) -- Task 0.7 slots in here alongside 3.3
  3.1 FloorPlanCard ──────┐
  3.2 LayoutCard ─────────┤ 3.3 depends on 3.1 + 3.2 + 0.7
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

1. **~~Floor plan aperture data for 4.15m x 6.0m~~:** RESOLVED -- reference images now provide exact millimetre measurements for all six layouts.

2. **~~Layout-specific floor plan rendering~~:** RESOLVED -- Phase 0 implements full internal wall rendering for En Suite and Bedroom layouts.

3. **Box layout bathroom restriction:** The requirement states "Bathroom cannot be added" for Box. Since bathroom is no longer an add-on, this is inherently satisfied. Confirm no future add-on for standalone bathroom is planned for Studio.

4. **Garden room page card:** Should the Studio-25 card on `/garden-room` reflect the new "from EUR 39,500" pricing, or change to show layout options?

5. **Architectural floor plan in non-Studio products:** Should the new `ArchitecturalFloorPlan` component eventually replace the MVP `FloorPlan` component for Compact-15, Living-35, and Grand-45? If so, reference images for those products will be needed. For now, the MVP continues to render for non-Studio products.

6. **Floor plan card preview size:** On the Floor Plan Selection step, the two cards each contain a floor plan SVG. What size should these previews be -- should they be large (hero-sized, ~400px) or compact (thumbnail-sized, ~200px)? The reference images suggest architectural drawings work best at larger sizes due to the dimension label density.
