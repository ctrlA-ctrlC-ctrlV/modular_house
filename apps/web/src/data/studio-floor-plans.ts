/**
 * Studio Floor Plan Configurations -- Architectural Floor Plan Data
 * =============================================================================
 *
 * PURPOSE:
 * Exports six ArchitecturalFloorPlanConfig objects, one for each combination
 * of floor plan variant (5.0m x 5.0m, 4.15m x 6.0m) and interior layout
 * (Box, En Suite, Bedroom) available for The Studio 25m2 product.
 *
 * These configs are consumed by the ArchitecturalFloorPlan component to
 * render architectural-quality SVG drawings matching the reference images
 * in /public/resource/floorplan/.
 *
 * DATA SOURCE:
 * All millimetre measurements are extracted from the six reference images:
 *   - 500by500_box.jpg, 500by500_ensuit.jpg, 500by500_bedroom.jpg
 *   - 415by600_box.jpg, 415by600_ensuit.jpg, 415by600_bedroomjpg.jpg
 *
 * LOOKUP FUNCTION:
 * The getStudioFloorPlanConfig() function resolves the correct config for
 * a given floor plan slug and layout slug combination. When layoutSlug is
 * null (before a layout is chosen), the Box config is returned as the
 * default open-space view.
 *
 * =============================================================================
 */

import type {
  ArchitecturalFloorPlanConfig,
  ExteriorAperture,
  DimensionAnnotation,
} from '../components/ProductConfigurator/ArchitecturalFloorPlan';


/* =============================================================================
   SHARED CONSTANTS
   =============================================================================
   Values that are consistent across all six Studio floor plan configurations.
   Extracted as constants to avoid repetition and ensure consistency.
   ============================================================================= */

/**
 * Wall thickness in millimetres, derived from the reference images.
 * Calculation: (5000 - 4728) / 2 = 136mm on each side.
 */
const WALL_THICKNESS_MM = 136;

/**
 * Default wall stroke colour. This value is overridden at render time
 * by the wallColorOverride prop when a specific exterior finish is selected.
 */
const DEFAULT_WALL_COLOR = '#1a1a1a';

/**
 * Bathroom area label shared across all four non-Box layouts.
 * The bathroom occupies a fixed 2400mm x 1600mm area in the top-left
 * corner of the building interior (2400 * 1600 / 1e6 = 3.84 SQM).
 */
const BATHROOM_AREA_SQM = '3.84 SQM';

/**
 * Standard internal door width used for all interior door openings
 * (bathroom and bedroom doors).
 */
const INTERNAL_DOOR_WIDTH_MM = 700;


/* =============================================================================
   SHARED APERTURE DATA
   =============================================================================
   The south wall aperture types (700mm T&T window + 1600mm sliding door)
   are identical across all layouts of the same floor plan variant. Only the
   offsets differ between the 5x5 and 4.15x6 floor plans.
   ============================================================================= */

/**
 * South wall apertures for the 5.0m x 5.0m floor plan.
 * Inner width = 5000 - 2 * 136 = 4728mm.
 * Window offset: 650mm from inner left wall.
 * Sliding door offset: 650 + 700 + 1350 = 2700mm from inner left wall.
 * Remaining gap after door: 4728 - 2700 - 1600 = 428mm.
 */
const APERTURES_5X5: ReadonlyArray<ExteriorAperture> = [
  {
    type: 'tilt-turn-window',
    wall: 'south',
    offsetMm: 650,
    widthMm: 700,
    label: '700MM\nT&T WINDOW',
  },
  {
    type: 'sliding-door',
    wall: 'south',
    offsetMm: 2700,
    widthMm: 1600,
    label: '1600MM\nDOUBLE/SLIDING DOOR',
  },
];

/**
 * South wall apertures for the 4.15m x 6.0m floor plan.
 * Inner width = 6000 - 2 * 136 = 5728mm.
 * Window offset: 1250mm from inner left wall.
 * Sliding door offset: 1250 + 700 + 1350 = 3300mm from inner left wall.
 * Remaining gap after door: 5728 - 3300 - 1600 = 828mm.
 */
const APERTURES_4X6: ReadonlyArray<ExteriorAperture> = [
  {
    type: 'tilt-turn-window',
    wall: 'south',
    offsetMm: 1250,
    widthMm: 700,
    label: '700MM\nT&T WINDOW',
  },
  {
    type: 'sliding-door',
    wall: 'south',
    offsetMm: 3300,
    widthMm: 1600,
    label: '1600MM\nDOUBLE/SLIDING DOOR',
  },
];


/* =============================================================================
   SHARED DIMENSION DATA
   =============================================================================
   Exterior and interior dimension annotations for each floor plan variant.
   These are the same regardless of layout (Box, En Suite, Bedroom) because
   the outer building dimensions do not change between layouts.
   ============================================================================= */

/**
 * Dimension annotations for the 5.0m x 5.0m floor plan.
 * Outer: 5000 x 5000. Inner: 4728 x 4728.
 */
const DIMENSIONS_5X5: ReadonlyArray<DimensionAnnotation> = [
  { value: '5000', type: 'exterior', side: 'top' },
  { value: '5000', type: 'exterior', side: 'left' },
  { value: '4728', type: 'interior', side: 'top' },
  { value: '4728', type: 'interior', side: 'right' },
];

/**
 * Dimension annotations for the 4.15m x 6.0m floor plan.
 * Outer: 6000 x 4150. Inner: 5728 x 3878.
 */
const DIMENSIONS_4X6: ReadonlyArray<DimensionAnnotation> = [
  { value: '6000', type: 'exterior', side: 'top' },
  { value: '4150', type: 'exterior', side: 'left' },
  { value: '5728', type: 'interior', side: 'top' },
  { value: '3878', type: 'interior', side: 'right' },
];


/* =============================================================================
   5.0m x 5.0m CONFIGURATIONS
   =============================================================================
   Three layout configs for the square 5000mm x 5000mm footprint.
   Inner dimensions: 4728mm x 4728mm.
   ============================================================================= */

/**
 * 5.0m x 5.0m -- Box Layout
 * Open-plan room with no internal walls. Maximum flexibility.
 * Total open space: 22.35 SQM.
 *
 * Reference: 500by500_box.jpg
 */
const STUDIO_5X5_BOX: ArchitecturalFloorPlanConfig = {
  outerWidthMm: 5000,
  outerDepthMm: 5000,
  wallThicknessMm: WALL_THICKNESS_MM,
  wallColor: DEFAULT_WALL_COLOR,
  apertures: APERTURES_5X5,
  dimensions: DIMENSIONS_5X5,
  zones: [
    {
      name: 'OPEN SPACE',
      area: '22.35 SQM',
      centerXMm: 2500,
      centerYMm: 2500,
    },
  ],
};

/**
 * 5.0m x 5.0m -- En Suite Layout
 * Bathroom (3.84 SQM) in the top-left corner separated by a horizontal
 * partition wall at y=1736mm from the top outer wall (1600mm from inner wall).
 * Kitchen zone occupies the top-right area (no physical wall, label only).
 * Open space (17.95 SQM) fills the lower portion.
 *
 * Partition wall: horizontal, from the left inner wall face rightward
 * for 2536mm. Bathroom door: 700mm opening at 970mm offset along the
 * partition wall, swinging upward (into bathroom).
 *
 * Reference: 500by500_ensuit.jpg
 */
const STUDIO_5X5_ENSUITE: ArchitecturalFloorPlanConfig = {
  outerWidthMm: 5000,
  outerDepthMm: 5000,
  wallThicknessMm: WALL_THICKNESS_MM,
  wallColor: DEFAULT_WALL_COLOR,
  apertures: APERTURES_5X5,
  dimensions: DIMENSIONS_5X5,
  zones: [
    {
      name: 'BATHROOM',
      area: BATHROOM_AREA_SQM,
      centerXMm: 1336,
      centerYMm: 936,
    },
    {
      name: 'KITCHEN',
      area: '',
      centerXMm: 3800,
      centerYMm: 936,
    },
    {
      name: 'OPEN SPACE',
      area: '17.95 SQM',
      centerXMm: 2500,
      centerYMm: 3500,
    },
  ],
  internalWalls: [
    {
      /*
       * Horizontal partition wall creating the bathroom/kitchen zone.
       * Runs from the left inner wall face (x=136) rightward for 2536mm.
       * Y-position: 136 (wall thickness) + 1600 (bathroom depth) = 1736mm
       * from the top outer wall.
       */
      startMm: { x: 136, y: 1736 },
      endMm: { x: 2672, y: 1736 },
      doors: [
        {
          offsetMm: 970,
          widthMm: INTERNAL_DOOR_WIDTH_MM,
          swingDirection: 'left',
        },
      ],
    },
  ],
  internalDimensions: [
    /* Top-left: bathroom width along the inner north wall. */
    {
      startMm: { x: 136, y: 200 },
      endMm: { x: 2536, y: 200 },
      value: '2400',
      labelSide: 'below',
    },
    /* Top-right: kitchen width along the inner north wall. */
    {
      startMm: { x: 2672, y: 200 },
      endMm: { x: 4864, y: 200 },
      value: '2192',
      labelSide: 'below',
    },
    /* Left side: bathroom depth from inner north wall down to partition. */
    {
      startMm: { x: 200, y: 136 },
      endMm: { x: 200, y: 1736 },
      value: '1600',
      labelSide: 'right',
    },
    /* Left side: open space depth from partition down to inner south wall. */
    {
      startMm: { x: 200, y: 1736 },
      endMm: { x: 200, y: 4864 },
      value: '2992',
      labelSide: 'right',
    },
    /* Along partition wall: segment before door. */
    {
      startMm: { x: 136, y: 1800 },
      endMm: { x: 1106, y: 1800 },
      value: '970',
      labelSide: 'below',
    },
    /* Along partition wall: segment after door. */
    {
      startMm: { x: 1806, y: 1800 },
      endMm: { x: 2672, y: 1800 },
      value: '730',
      labelSide: 'below',
    },
  ],
};

/**
 * 5.0m x 5.0m -- Bedroom Layout
 * Bathroom (3.84 SQM) top-left. Kitchen zone top-right (label only).
 * Bedroom (7.18 SQM) mid-left with 700mm door swinging into open space.
 * Open space (10.36 SQM) mid-right.
 *
 * Two partition walls:
 *   1. Horizontal at y=1736mm (same as En Suite) creating bathroom + kitchen zone.
 *   2. Vertical at x=2636mm from left outer wall, running from the bottom of
 *      the horizontal partition down toward the south wall, creating the
 *      bedroom (left) and open space (right) zones.
 *
 * Reference: 500by500_bedroom.jpg
 */
const STUDIO_5X5_BEDROOM: ArchitecturalFloorPlanConfig = {
  outerWidthMm: 5000,
  outerDepthMm: 5000,
  wallThicknessMm: WALL_THICKNESS_MM,
  wallColor: DEFAULT_WALL_COLOR,
  apertures: APERTURES_5X5,
  dimensions: DIMENSIONS_5X5,
  zones: [
    {
      name: 'BATHROOM',
      area: BATHROOM_AREA_SQM,
      centerXMm: 1336,
      centerYMm: 936,
    },
    {
      name: 'KITCHEN',
      area: '',
      centerXMm: 3800,
      centerYMm: 936,
    },
    {
      name: 'BEDROOM',
      area: '7.18 SQM',
      centerXMm: 1386,
      centerYMm: 3100,
    },
    {
      name: 'OPEN SPACE',
      area: '10.36 SQM',
      centerXMm: 3800,
      centerYMm: 3100,
    },
  ],
  internalWalls: [
    {
      /*
       * Horizontal partition wall (same as En Suite).
       * Creates the bathroom/kitchen zone at the top.
       */
      startMm: { x: 136, y: 1736 },
      endMm: { x: 2672, y: 1736 },
      doors: [
        {
          offsetMm: 970,
          widthMm: INTERNAL_DOOR_WIDTH_MM,
          swingDirection: 'left',
        },
      ],
    },
    {
      /*
       * Vertical partition wall from the bottom of the horizontal
       * partition down toward the south inner wall. Creates the
       * bedroom (left) and open space (right) zones.
       * X-position: 136 (outer wall) + 2500 = 2636mm.
       * Start Y: 1736mm (bottom of horizontal partition).
       * End Y: 4864mm (inner south wall face).
       *
       * Bedroom door: 700mm opening at 650mm offset along the
       * vertical wall, swinging right (into the open space).
       */
      startMm: { x: 2636, y: 1736 },
      endMm: { x: 2636, y: 4864 },
      doors: [
        {
          offsetMm: 650,
          widthMm: INTERNAL_DOOR_WIDTH_MM,
          swingDirection: 'right',
        },
      ],
    },
  ],
  internalDimensions: [
    /* Top-left: bathroom width along the inner north wall. */
    {
      startMm: { x: 136, y: 200 },
      endMm: { x: 2536, y: 200 },
      value: '2400',
      labelSide: 'below',
    },
    /* Top-right: kitchen width along the inner north wall. */
    {
      startMm: { x: 2672, y: 200 },
      endMm: { x: 4864, y: 200 },
      value: '2192',
      labelSide: 'below',
    },
    /* Left side: bathroom depth from inner north wall to horizontal partition. */
    {
      startMm: { x: 200, y: 136 },
      endMm: { x: 200, y: 1736 },
      value: '1600',
      labelSide: 'right',
    },
    /* Left side: bedroom + open space height from horizontal partition to inner south wall. */
    {
      startMm: { x: 200, y: 1736 },
      endMm: { x: 200, y: 4864 },
      value: '2992',
      labelSide: 'right',
    },
    /* Along vertical partition: segment before bedroom door (top portion). */
    {
      startMm: { x: 2700, y: 1736 },
      endMm: { x: 2700, y: 2386 },
      value: '650',
      labelSide: 'right',
    },
    /* Along vertical partition: segment after bedroom door (bottom portion). */
    {
      startMm: { x: 2700, y: 3086 },
      endMm: { x: 2700, y: 4864 },
      value: '1641',
      labelSide: 'right',
    },
  ],
};


/* =============================================================================
   4.15m x 6.0m CONFIGURATIONS
   =============================================================================
   Three layout configs for the rectangular 6000mm x 4150mm footprint.
   Inner dimensions: 5728mm x 3878mm.
   Note: outerWidthMm = 6000 (the longer dimension), outerDepthMm = 4150.
   ============================================================================= */

/**
 * 4.15m x 6.0m -- Box Layout
 * Open-plan room with no internal walls.
 * Total open space: 22.21 SQM.
 *
 * Reference: 415by600_box.jpg
 */
const STUDIO_4X6_BOX: ArchitecturalFloorPlanConfig = {
  outerWidthMm: 6000,
  outerDepthMm: 4150,
  wallThicknessMm: WALL_THICKNESS_MM,
  wallColor: DEFAULT_WALL_COLOR,
  apertures: APERTURES_4X6,
  dimensions: DIMENSIONS_4X6,
  zones: [
    {
      name: 'OPEN SPACE',
      area: '22.21 SQM',
      centerXMm: 3000,
      centerYMm: 2075,
    },
  ],
};

/**
 * 4.15m x 6.0m -- En Suite Layout
 * Bathroom (3.84 SQM) in the top-left corner separated by a vertical
 * partition wall. Kitchen zone below the bathroom on the left side.
 * Open space (17.81 SQM) fills the right portion.
 *
 * The partition is a vertical wall at x = 136 + 2400 + 136/2 = 2604mm
 * (accounting for wall thickness centring). For simplicity the wall
 * centre line is placed at x = 2604mm, running from the inner top wall
 * (y=136) downward to y = 136 + 1600 = 1736mm for the bathroom
 * boundary. A horizontal partition also exists at y=1736mm from the
 * left outer wall to the vertical partition.
 *
 * Reference: 415by600_ensuit.jpg
 */
const STUDIO_4X6_ENSUITE: ArchitecturalFloorPlanConfig = {
  outerWidthMm: 6000,
  outerDepthMm: 4150,
  wallThicknessMm: WALL_THICKNESS_MM,
  wallColor: DEFAULT_WALL_COLOR,
  apertures: APERTURES_4X6,
  dimensions: DIMENSIONS_4X6,
  zones: [
    {
      name: 'BATHROOM',
      area: BATHROOM_AREA_SQM,
      centerXMm: 1336,
      centerYMm: 936,
    },
    {
      name: 'KITCHEN',
      area: '',
      centerXMm: 1336,
      centerYMm: 2800,
    },
    {
      name: 'OPEN SPACE',
      area: '17.81 SQM',
      centerXMm: 4400,
      centerYMm: 2075,
    },
  ],
  internalWalls: [
    {
      /*
       * Horizontal partition wall separating the bathroom from the
       * kitchen zone below. Runs from the left inner wall face (x=136)
       * rightward for 2536mm (BATHROOM_WIDTH_MM + one wall thickness).
       * Y-position: 136 + 1600 = 1736mm from the top outer wall.
       */
      startMm: { x: 136, y: 1736 },
      endMm: { x: 2672, y: 1736 },
      doors: [
        {
          offsetMm: 970,
          widthMm: INTERNAL_DOOR_WIDTH_MM,
          swingDirection: 'left',
        },
      ],
    },
    {
      /*
       * Vertical partition wall separating the bathroom/kitchen zone
       * (left) from the open space (right). Runs from the inner top
       * wall face (y=136) downward to the inner south wall (y=4014).
       * X-position: 136 + BATHROOM_WIDTH_MM = 2536 + 136 = 2672mm.
       * This wall has no doors -- the kitchen zone opens into the
       * main space via the gap below the horizontal partition.
       */
      startMm: { x: 2672, y: 136 },
      endMm: { x: 2672, y: 4014 },
      doors: [],
    },
  ],
  internalDimensions: [
    /* Top-left: bathroom width along the inner north wall. */
    {
      startMm: { x: 136, y: 200 },
      endMm: { x: 2536, y: 200 },
      value: '2400',
      labelSide: 'below',
    },
    /* Top-right: open space width along the inner north wall. */
    {
      startMm: { x: 2808, y: 200 },
      endMm: { x: 5864, y: 200 },
      value: '3191',
      labelSide: 'below',
    },
    /* Left side: bathroom depth from inner north wall to horizontal partition. */
    {
      startMm: { x: 200, y: 136 },
      endMm: { x: 200, y: 1736 },
      value: '1600',
      labelSide: 'right',
    },
    /* Left side: kitchen depth from horizontal partition to inner south wall. */
    {
      startMm: { x: 200, y: 1736 },
      endMm: { x: 200, y: 4014 },
      value: '2143',
      labelSide: 'right',
    },
    /* Along horizontal partition: segment before bathroom door. */
    {
      startMm: { x: 136, y: 1800 },
      endMm: { x: 1106, y: 1800 },
      value: '970',
      labelSide: 'below',
    },
    /* Along horizontal partition: segment after bathroom door. */
    {
      startMm: { x: 1806, y: 1800 },
      endMm: { x: 2672, y: 1800 },
      value: '730',
      labelSide: 'below',
    },
  ],
};

/**
 * 4.15m x 6.0m -- Bedroom Layout
 * Bathroom (3.84 SQM) top-left. Bedroom (5.97 SQM) top-right.
 * Kitchen zone bottom-left (label only). Open space (11.36 SQM) bottom-right.
 *
 * Two partition walls:
 *   1. Horizontal at y = 136 + 2000 = 2136mm from the top outer wall,
 *      creating the top zone (bathroom + bedroom) and bottom zone
 *      (kitchen + open space).
 *   2. Vertical at x = 2672mm (same as En Suite), running from the
 *      inner north wall to the inner south wall.
 *
 * Bathroom door: on the horizontal partition at 970mm offset, swinging up.
 * Bedroom door: on the vertical partition at 400mm offset from the top
 * of the bedroom zone, swinging right (into the open space).
 *
 * Reference: 415by600_bedroomjpg.jpg
 */
const STUDIO_4X6_BEDROOM: ArchitecturalFloorPlanConfig = {
  outerWidthMm: 6000,
  outerDepthMm: 4150,
  wallThicknessMm: WALL_THICKNESS_MM,
  wallColor: DEFAULT_WALL_COLOR,
  apertures: APERTURES_4X6,
  dimensions: DIMENSIONS_4X6,
  zones: [
    {
      name: 'BATHROOM',
      area: BATHROOM_AREA_SQM,
      centerXMm: 1336,
      centerYMm: 936,
    },
    {
      name: 'BEDROOM',
      area: '5.97 SQM',
      centerXMm: 4400,
      centerYMm: 1200,
    },
    {
      name: 'KITCHEN',
      area: '',
      centerXMm: 1336,
      centerYMm: 3100,
    },
    {
      name: 'OPEN SPACE',
      area: '11.36 SQM',
      centerXMm: 4400,
      centerYMm: 3100,
    },
  ],
  internalWalls: [
    {
      /*
       * Horizontal partition wall at y=2136mm.
       * Separates the top zone (bathroom + bedroom) from the bottom zone
       * (kitchen + open space). Runs from the left inner wall face (x=136)
       * rightward to the vertical partition (x=2672).
       * Contains the bathroom door at 970mm offset.
       */
      startMm: { x: 136, y: 2136 },
      endMm: { x: 2672, y: 2136 },
      doors: [
        {
          offsetMm: 970,
          widthMm: INTERNAL_DOOR_WIDTH_MM,
          swingDirection: 'left',
        },
      ],
    },
    {
      /*
       * Vertical partition wall separating the left zones (bathroom,
       * kitchen) from the right zones (bedroom, open space).
       * Runs from the inner north wall (y=136) to the inner south wall
       * (y=4014). The bedroom door is at 400mm offset from the top of
       * this segment, swinging right into the open space.
       */
      startMm: { x: 2672, y: 136 },
      endMm: { x: 2672, y: 4014 },
      doors: [
        {
          offsetMm: 400,
          widthMm: INTERNAL_DOOR_WIDTH_MM,
          swingDirection: 'right',
        },
      ],
    },
  ],
  internalDimensions: [
    /* Top-right: bedroom width along the inner north wall. */
    {
      startMm: { x: 2808, y: 200 },
      endMm: { x: 5864, y: 200 },
      value: '3191',
      labelSide: 'below',
    },
    /* Right side: bedroom depth from inner north wall to horizontal partition. */
    {
      startMm: { x: 5800, y: 136 },
      endMm: { x: 5800, y: 2136 },
      value: '2000',
      labelSide: 'left',
    },
    /* Right side: open space depth from horizontal partition to inner south wall. */
    {
      startMm: { x: 5800, y: 2136 },
      endMm: { x: 5800, y: 4014 },
      value: '1742',
      labelSide: 'left',
    },
    /* Along horizontal partition: segment before bathroom door. */
    {
      startMm: { x: 136, y: 2200 },
      endMm: { x: 1106, y: 2200 },
      value: '970',
      labelSide: 'below',
    },
    /* Along horizontal partition: segment after bathroom door. */
    {
      startMm: { x: 1806, y: 2200 },
      endMm: { x: 2672, y: 2200 },
      value: '730',
      labelSide: 'below',
    },
    /* Along vertical partition: bedroom door offset from top. */
    {
      startMm: { x: 2740, y: 136 },
      endMm: { x: 2740, y: 536 },
      value: '400',
      labelSide: 'right',
    },
  ],
};


/* =============================================================================
   CONFIG LOOKUP MAP
   =============================================================================
   A two-level map keyed by floor plan slug and layout slug, providing O(1)
   lookup for any combination. The null layout key maps to the Box config,
   used on the Floor Plan Selection step before a layout is chosen.
   ============================================================================= */

/**
 * Type-safe floor plan slug union for The Studio product.
 */
type StudioFloorPlanSlug = '5x5' | '4x6';

/**
 * Type-safe layout slug union for The Studio product.
 * Null represents "no layout selected" (defaults to Box).
 */
type StudioLayoutSlug = 'box' | 'en-suite' | 'bedroom' | null;

/**
 * Internal lookup map structure. Each floor plan variant maps to an
 * object containing all three layout configs plus a null entry for
 * the default (Box) fallback.
 */
const STUDIO_CONFIG_MAP: Readonly<
  Record<StudioFloorPlanSlug, Readonly<Record<string, ArchitecturalFloorPlanConfig>>>
> = {
  '5x5': {
    'box': STUDIO_5X5_BOX,
    'en-suite': STUDIO_5X5_ENSUITE,
    'bedroom': STUDIO_5X5_BEDROOM,
  },
  '4x6': {
    'box': STUDIO_4X6_BOX,
    'en-suite': STUDIO_4X6_ENSUITE,
    'bedroom': STUDIO_4X6_BEDROOM,
  },
};


/* =============================================================================
   PUBLIC API
   ============================================================================= */

/**
 * Resolves the architectural floor plan configuration for a given combination
 * of floor plan variant and interior layout. Returns the Box (open-space)
 * config when layoutSlug is null, which is the expected state on the Floor
 * Plan Selection step before the user has chosen a layout.
 *
 * @param floorPlanSlug - The floor plan variant identifier ("5x5" or "4x6").
 * @param layoutSlug - The layout identifier, or null to default to Box.
 * @returns The resolved ArchitecturalFloorPlanConfig for the combination.
 */
export function getStudioFloorPlanConfig(
  floorPlanSlug: StudioFloorPlanSlug,
  layoutSlug: StudioLayoutSlug,
): ArchitecturalFloorPlanConfig {
  const layoutKey = layoutSlug ?? 'box';
  return STUDIO_CONFIG_MAP[floorPlanSlug][layoutKey];
}
