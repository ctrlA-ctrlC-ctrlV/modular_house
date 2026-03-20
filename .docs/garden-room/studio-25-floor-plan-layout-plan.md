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

#### Task 0.1: Create core `ArchitecturalFloorPlan` component -- outer shell, walls, and corner posts

**Files:** `apps/web/src/components/ProductConfigurator/ArchitecturalFloorPlan.tsx` (NEW)

**Reference:** `500by500_box.jpg` (simplest case -- no internal walls, single open zone)

**Actions:**
1. Create a new React component accepting an `ArchitecturalFloorPlanConfig` prop (interface defined inline initially, extracted in Task 0.2).
2. Compute a proportional SVG viewBox based on the room's real-world width and depth (no longer a fixed 260x260 square). Use a consistent scale factor (e.g., 1mm = 0.1 SVG units) with configurable padding for dimension lines and the north arrow.
3. Render double-line outer walls: an outer rect and an inner rect separated by the wall thickness (~136mm scaled). Stroke colour matches the configurator's wall colour prop.
4. Render filled corner-post rectangles at all four corners (dark grey, matching the reference post dimensions visible in the drawings).
5. Render the inner room fill (white/off-white) bounded by the inner wall face.
6. Add the proportional viewBox with `preserveAspectRatio="xMidYMid meet"` so the component scales cleanly in its container.

**Acceptance criteria:** The SVG shows a proportionally correct double-walled rectangle with corner posts. For a 5000x5000 room it appears square; for a 4150x6000 room it appears portrait. No apertures, labels, or dimensions yet.

**Risk:** None. New file, no impact on existing code.

---

#### Task 0.2: Architectural apertures -- windows and doors through wall breaks

**Files:** `apps/web/src/components/ProductConfigurator/ArchitecturalFloorPlan.tsx`

**Reference:** `500by500_box.jpg`, `415by600_box.jpg` (south wall: 700mm T&T window + 1600mm double/sliding door)

**Actions:**
1. Render apertures as wall breaks: remove a segment of the double-line wall at the aperture position and draw two thin parallel lines across the opening (the glazing indication lines visible in the reference).
2. For tilt-and-turn windows (700mm): two parallel lines spanning the wall break, matching the reference's thin stroke style.
3. For double/sliding doors (1600mm): two parallel lines spanning the break, plus a dashed double-leaf arc below the opening representing the door swing. The reference shows two quarter-circle dashed arcs sweeping outward (the black triangle sits between them).
4. Position apertures using real-world millimetre offsets from the reference images:
   - **5x5 south wall:** 650mm offset from left, then 700mm window, then 1350mm gap, then 1600mm door, then 128mm to right corner (matching `500by500_box.jpg`).
   - **4.15x6 south wall:** 1250mm offset from left, then 700mm window, then 1350mm gap, then 1600mm door, then 828mm to right corner (matching `415by600_box.jpg`).
5. Render aperture labels below/above each opening: "700MM T&T WINDOW", "1600MM DOUBLE/SLIDING DOOR" in small uppercase text.
6. Render offset dimension lines between apertures and to wall edges (e.g., the 650, 1350, 128 leader lines visible in the reference).

**Acceptance criteria:** The 5x5 Box and 4.15x6 Box floor plans render with architecturally correct wall breaks, glazing lines, door swing arcs, aperture labels, and inter-aperture dimensions matching the reference images.

**Risk:** Low. Coordinate math requires careful measurement from reference images; any positional errors are visually obvious and straightforward to correct.

---

#### Task 0.3: Exterior dimension lines and north arrow

**Files:** `apps/web/src/components/ProductConfigurator/ArchitecturalFloorPlan.tsx`

**Reference:** All six images (dimension lines + north arrow are consistent across all)

**Actions:**
1. Render exterior dimension lines with leader arrows on the top and left sides of the plan:
   - Top: total width dimension in bold (e.g., "5000" or "6000"), with thin extension lines dropping from the wall corners.
   - Left: total depth dimension in bold (e.g., "5000" or "4150"), with thin extension lines extending from the wall corners.
2. Render interior dimension lines just inside the outer wall faces:
   - Top interior: inner width (e.g., "4728" for 5x5, "5728" for 4.15x6).
   - Right interior: inner depth (e.g., "4728" for 5x5, "3878" for 4.15x6).
3. Use the reference images' typographic conventions: bold weight for exterior dimensions, regular weight for interior dimensions, consistent font size scaled to the viewBox.
4. Render the north arrow as a solid black filled triangle positioned below the south wall entrance (centred on the door opening), matching the reference placement and size.

**Acceptance criteria:** Both Box floor plans display exterior bold dimensions, interior light dimensions, and a north arrow triangle, closely matching the reference images' layout and proportions.

**Risk:** None. Additive rendering on top of the existing wall/aperture structure.

---

#### Task 0.4: Room zone labels and area text

**Files:** `apps/web/src/components/ProductConfigurator/ArchitecturalFloorPlan.tsx`

**Reference:** All six images (each zone labelled with name + SQM)

**Actions:**
1. Accept an array of room zone descriptors in the config, each specifying: zone name (e.g., "OPEN SPACE"), area in SQM (e.g., "22.35 SQM"), and a centre point (x, y in mm from the top-left inner wall corner).
2. Render each zone label as two lines of centred text: the room name in a medium-weight uppercase style, and the area below in a lighter weight.
3. For Box layouts: single zone "OPEN SPACE" centred in the room.
4. For En Suite layouts: "BATHROOM" + "KITCHEN" + "OPEN SPACE" zones positioned per the reference images.
5. For Bedroom layouts: "BATHROOM" + "BEDROOM" + "KITCHEN" + "OPEN SPACE" zones positioned per the reference images.

**Acceptance criteria:** Zone labels render in the correct positions with the correct names and areas, matching the uppercase convention in the reference images.

**Risk:** Low. Zone label positions are layout-specific and must be extracted from the reference images. The config-driven approach means positional data is in the data layer, not hard-coded in the component.

---

#### Task 0.5: Internal partition walls and internal doors (En Suite + Bedroom layouts)

**Files:** `apps/web/src/components/ProductConfigurator/ArchitecturalFloorPlan.tsx`

**Reference:** `500by500_ensuit.jpg`, `500by500_bedroom.jpg`, `415by600_ensuit.jpg`, `415by600_bedroomjpg.jpg`

**Actions:**
1. Accept an array of internal wall segments in the config, each specifying: start point (x, y in mm), end point (x, y in mm), and optional door openings along the wall.
2. Render internal walls as double-line segments (same thickness as outer walls but potentially thinner -- the reference images show internal walls at similar thickness to outer walls).
3. Render internal door openings as wall breaks with a dashed quarter-circle swing arc:
   - 700mm single door openings with a dashed arc indicating the swing direction.
   - Match the reference images' convention where the arc sweeps into the room the door opens into.
4. Render internal dimension lines for partition positions and door offsets (e.g., "970", "730", "2536" in the En Suite reference; "1041", "400", "1350" in the Bedroom reference).

**Key measurements extracted from reference images:**

**5x5 En Suite (`500by500_ensuit.jpg`):**
- Horizontal partition wall: runs from left inner wall face, length ~2536mm (creating bathroom zone above, open space below)
- Bathroom: width ~2400mm, depth ~1600mm (3.84 SQM)
- Kitchen: right side of top zone, width ~2192mm (open to main space)
- Bathroom door: 700mm single door, offset 970mm from left wall, swings into bathroom
- Internal dimension annotations: 2400, 2192, 1600, 1736, 970, 730, 2536, 2992

**5x5 Bedroom (`500by500_bedroom.jpg`):**
- Horizontal partition wall at same height as En Suite (creating top bathroom/bedroom zone)
- Vertical partition wall: divides lower portion into bedroom (left) and open space (right)
- Bathroom: top-left, 2400mm x 1600mm (3.84 SQM)
- Bedroom: mid-left, 7.18 SQM, with 700mm door opening into open space
- Kitchen: open area top-right
- Open space: 10.36 SQM bottom-right
- Additional dimensions: 2386, 650, 1641, 1641, 1041, 1050

**4.15x6 En Suite (`415by600_ensuit.jpg`):**
- Same bathroom dimensions (3.84 SQM) and door config as 5x5 En Suite
- Kitchen zone in lower-left area, depth ~2143mm
- Open space: 17.81 SQM on right side
- Internal dimension annotations: 2400, 3191, 1600, 1736, 970, 730, 2536, 2143

**4.15x6 Bedroom (`415by600_bedroomjpg.jpg`):**
- Bathroom: top-left, 3.84 SQM (same as all other layouts)
- Bedroom: top-right, 5.97 SQM, depth ~2000mm, 700mm door
- Kitchen: bottom-left area, depth ~2143mm
- Open space: 11.36 SQM bottom-right, height ~1742mm
- Additional dimensions: 3191, 2000, 1350, 3441, 400, 2286, 1041

**Acceptance criteria:** All four internal-wall layouts (5x5 En Suite, 5x5 Bedroom, 4.15x6 En Suite, 4.15x6 Bedroom) render with correct partition walls, door openings with swing arcs, and internal dimension annotations matching the reference images.

**Risk:** Medium. This is the most complex rendering task. The coordinate data is dense and layout-specific. Careful extraction from the reference images is critical. Recommend implementing one layout at a time and visually comparing against the reference.

---

#### Task 0.6: Create floor plan config data for all six Studio layouts

**Files:** `apps/web/src/data/studio-floor-plans.ts` (NEW)

**Reference:** All six images

**Actions:**
1. Create a new data file containing the `ArchitecturalFloorPlanConfig` objects for all six Studio 25m² floor plan + layout combinations:
   - `STUDIO_5x5_BOX`
   - `STUDIO_5x5_ENSUITE`
   - `STUDIO_5x5_BEDROOM`
   - `STUDIO_4x6_BOX`
   - `STUDIO_4x6_ENSUITE`
   - `STUDIO_4x6_BEDROOM`
2. Each config includes: outer dimensions, wall thickness, aperture definitions with exact mm positions, internal wall segments (for En Suite/Bedroom), room zone labels with centre points and areas, and dimension line annotations.
3. The data is extracted from the six reference images using the millimetre measurements annotated in each drawing.
4. Export a lookup function or map keyed by `(floorPlanVariantSlug, layoutSlug)` for use by the configurator step renderers.

**Acceptance criteria:** All six configs produce SVGs that closely match their corresponding reference images when rendered by the `ArchitecturalFloorPlan` component.

**Risk:** Low. Purely data extraction and structuring. The component (Tasks 0.1-0.5) does the rendering; this task fills in the content.

---

#### Task 0.7: Integration -- wire `ArchitecturalFloorPlan` into configurator steps

**Files:** `apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx`

**Reference:** N/A (integration task)

**Actions:**
1. On the Floor Plan Selection step (Step 0), render `ArchitecturalFloorPlan` inside each selectable card using the Box config for the corresponding floor plan variant (`STUDIO_5x5_BOX` for the 5x5 card, `STUDIO_4x6_BOX` for the 4.15x6 card).
2. On the Layout Selection step (Step 1), render `ArchitecturalFloorPlan` inside each layout card using the config that matches the selected floor plan variant + layout combination (e.g., if the user chose 5x5, the three layout cards show `STUDIO_5x5_BOX`, `STUDIO_5x5_ENSUITE`, `STUDIO_5x5_BEDROOM`).
3. On the Overview step, render `ArchitecturalFloorPlan` using the config matching both the selected floor plan and layout.
4. Ensure the existing `FloorPlan` component continues to render for non-Studio products (Compact, Living, Grand) -- no regression.

**Acceptance criteria:** The Studio configurator displays architectural-quality floor plans in the floor plan selection cards, layout selection cards, and overview step. Other products are unaffected.

**Risk:** Low. The `ArchitecturalFloorPlan` component is self-contained; integration is a matter of choosing the correct config per step context.

---

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
