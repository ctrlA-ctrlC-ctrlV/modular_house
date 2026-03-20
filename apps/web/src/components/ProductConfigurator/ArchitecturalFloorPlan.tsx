/**
 * ArchitecturalFloorPlan -- Data-Driven Architectural SVG Floor Plan Renderer
 * =============================================================================
 *
 * PURPOSE:
 * Renders an architectural-quality SVG floor plan for garden room products.
 * Unlike the MVP FloorPlan component (which uses a fixed 260x260 viewport
 * with simplified blue-bar apertures), this component produces double-line
 * walls, corner posts, proper aperture symbols with swing arcs, dimension
 * leader lines, room zone labels, internal partition walls and doors --
 * closely matching professional architectural drawings.
 *
 * ARCHITECTURE:
 * The component is entirely data-driven. It receives an
 * ArchitecturalFloorPlanConfig object describing the building geometry
 * (outer dimensions, wall thickness, apertures, zones, internal walls,
 * dimensions) and renders the corresponding SVG without any hard-coded
 * layout logic. This makes it reusable across all six Studio floor plan /
 * layout combinations and extensible to future products.
 *
 * COORDINATE SYSTEM:
 * Real-world millimetre values are scaled to SVG units at a ratio of
 * 1mm = 0.1 SVG units. Fixed padding is added around the plan to
 * accommodate exterior dimension lines (top, left) and aperture labels
 * plus a north arrow (bottom). The viewBox is computed dynamically from
 * the outer building dimensions plus padding, and preserveAspectRatio
 * ensures proportional scaling within any container size.
 *
 * RENDERING LAYERS (back to front):
 *   1. Inner room fill (white rectangle at inner wall boundary)
 *   2. Outer wall rectangle (architectural stroke)
 *   3. Inner wall rectangle (double-line wall effect)
 *   4. Corner post fills (dark grey squares at each corner)
 *   5. Exterior apertures with wall breaks, glazing lines, and door arcs
 *   6. Aperture labels and offset dimension lines (below south wall)
 *   7. Exterior dimension lines (bold, outside the wall perimeter)
 *   8. Interior dimension lines (light, inside the wall perimeter)
 *   9. North arrow (solid triangle below the south entrance)
 *  10. Room zone labels (name + area text centred in each zone)
 *  11. Internal partition walls with door openings and swing arcs
 *  12. Internal dimension annotations
 *
 * =============================================================================
 */

import React from 'react';


/* =============================================================================
   TYPE DEFINITIONS -- Config Interfaces
   =============================================================================
   Each interface describes one aspect of the floor plan geometry. The top-level
   ArchitecturalFloorPlanConfig aggregates them all into a single data object
   that drives the entire SVG rendering pipeline.
   ============================================================================= */

/**
 * Describes a single exterior aperture (window or door) placed on one
 * of the four outer walls. The offset is measured from the left (or top)
 * inner wall corner along the wall's interior face.
 */
export interface ExteriorAperture {
  /** Determines the visual symbol: glazing lines only, or glazing + door swing arc. */
  type: 'tilt-turn-window' | 'sliding-door';
  /** Which outer wall this aperture is positioned on. */
  wall: 'north' | 'east' | 'south' | 'west';
  /** Distance in mm from the left (or top) inner wall corner to the aperture start. */
  offsetMm: number;
  /** Physical width of the aperture in mm. */
  widthMm: number;
  /** Two-line display label rendered below the aperture (e.g., "700MM\nT&T WINDOW"). */
  label: string;
}

/**
 * Describes a single dimension annotation rendered either outside (exterior)
 * or inside (interior) the wall perimeter. Exterior dimensions are bold and
 * positioned away from the walls; interior dimensions are lighter and sit
 * just inside the inner wall face.
 */
export interface DimensionAnnotation {
  /** The displayed measurement text (e.g., "5000", "4728"). */
  value: string;
  /** Determines visual weight: "exterior" is bold 12px, "interior" is regular 8px. */
  type: 'exterior' | 'interior';
  /** Which side of the plan the dimension line is drawn on. */
  side: 'top' | 'left' | 'right' | 'bottom';
}

/**
 * Describes a labelled room zone rendered as centred text inside the
 * floor plan. The area field may be empty for zones that display only
 * a name (e.g., "KITCHEN" without a square-metre value).
 */
export interface RoomZone {
  /** Room name displayed on the first line. Always rendered in uppercase. */
  name: string;
  /** Area text displayed on the second line (e.g., "22.35 SQM"). Empty string omits line 2. */
  area: string;
  /** Horizontal centre of the label in mm, measured from the left outer wall face. */
  centerXMm: number;
  /** Vertical centre of the label in mm, measured from the top outer wall face. */
  centerYMm: number;
}

/**
 * Describes a single door opening cut into an internal partition wall.
 * The offset is measured along the wall segment from its start point.
 */
export interface InternalDoor {
  /** Distance in mm along the wall segment from the start point to the door opening. */
  offsetMm: number;
  /** Door width in mm (typically 700 in current layouts). */
  widthMm: number;
  /**
   * Direction the door swings into, relative to the wall normal.
   * "left" draws the arc on the left side of the wall;
   * "right" draws the arc on the right side.
   */
  swingDirection: 'left' | 'right';
  /** Optional label rendered near the door opening (e.g., "700MM\nSINGLE DOOR"). */
  label?: string;
}

/**
 * Describes a single internal partition wall segment running between
 * two points. Doors along the segment create wall breaks with dashed
 * quarter-circle swing arcs.
 */
export interface InternalWall {
  /** Start point in mm from the top-left outer wall corner. */
  startMm: { x: number; y: number };
  /** End point in mm from the top-left outer wall corner. */
  endMm: { x: number; y: number };
  /** Doors cut into this wall segment. */
  doors: InternalDoor[];
}

/**
 * Describes an internal dimension annotation rendered as a thin leader
 * line with tick marks and a centred text label.
 */
export interface InternalDimension {
  /** Start point in mm from the top-left outer wall corner. */
  startMm: { x: number; y: number };
  /** End point in mm from the top-left outer wall corner. */
  endMm: { x: number; y: number };
  /** Displayed measurement value (e.g., "2536"). */
  value: string;
  /** Which side of the line the label text is positioned on. */
  labelSide: 'above' | 'below' | 'left' | 'right';
}

/**
 * Top-level configuration object consumed by the ArchitecturalFloorPlan
 * component. Every field maps to a rendering layer in the SVG output.
 * Optional arrays (internalWalls, internalDimensions) default to empty,
 * allowing Box layouts to omit them entirely.
 */
export interface ArchitecturalFloorPlanConfig {
  /** Outer width of the building in millimetres (e.g., 5000). */
  outerWidthMm: number;
  /** Outer depth of the building in millimetres (e.g., 5000). */
  outerDepthMm: number;
  /** Wall thickness in millimetres. Derived from reference: 136mm. */
  wallThicknessMm: number;
  /** Default hex colour for wall strokes. Overridden at render time by the wallColor prop. */
  wallColor: string;
  /** Exterior apertures (windows and doors) on the outer walls. */
  apertures: ReadonlyArray<ExteriorAperture>;
  /** Dimension annotations rendered outside and inside the wall perimeter. */
  dimensions: ReadonlyArray<DimensionAnnotation>;
  /** Room zone labels with names, areas, and centred positions. */
  zones: ReadonlyArray<RoomZone>;
  /** Internal partition walls. Empty or omitted for Box layouts. */
  internalWalls?: ReadonlyArray<InternalWall>;
  /** Internal dimension annotations. Empty or omitted for Box layouts. */
  internalDimensions?: ReadonlyArray<InternalDimension>;
}


/* =============================================================================
   COMPONENT PROPS
   ============================================================================= */

interface ArchitecturalFloorPlanComponentProps {
  /** Complete floor plan configuration driving the SVG rendering. */
  config: ArchitecturalFloorPlanConfig;
  /** Optional CSS class name for external sizing and layout control. */
  className?: string;
  /**
   * Override wall colour (e.g., from the selected exterior finish).
   * Falls back to config.wallColor when not provided.
   */
  wallColorOverride?: string;
}


/* =============================================================================
   CONSTANTS
   =============================================================================
   Scaling factor and padding values that define the SVG coordinate system.
   These remain fixed across all product sizes; the viewBox dimensions are
   computed dynamically from the building geometry.
   ============================================================================= */

/** Millimetres-to-SVG-units scale factor: 1mm = 0.1 SVG units. */
const MM_TO_SVG = 0.1;

/** Padding above the plan for exterior dimension lines. */
const PAD_TOP = 80;

/** Padding to the left of the plan for exterior dimension lines. */
const PAD_LEFT = 50;

/** Padding to the right of the plan. */
const PAD_RIGHT = 50;

/** Padding below the plan for aperture labels and the north arrow. */
const PAD_BOTTOM = 120;

/** Default font family consistent with the Modular House design system. */
const FONT_FAMILY = 'DM Sans, sans-serif';


/* =============================================================================
   HELPER FUNCTIONS
   =============================================================================
   Pure utility functions used by the rendering sub-components. Each function
   converts millimetre-based config values into SVG coordinate offsets.
   ============================================================================= */

/**
 * Converts a millimetre value to SVG coordinate units using the
 * global scale factor.
 */
function mmToSvg(mm: number): number {
  return mm * MM_TO_SVG;
}


/* =============================================================================
   RENDERING SUB-COMPONENTS
   =============================================================================
   Each sub-component renders a distinct visual layer of the floor plan SVG.
   They are composed inside the main ArchitecturalFloorPlan component in a
   fixed back-to-front order to ensure correct layering.
   ============================================================================= */

/* ---------------------------------------------------------------------------
 * Layer 1-4: Outer Shell -- Inner fill, double-line walls, corner posts
 * --------------------------------------------------------------------------- */

interface OuterShellProps {
  /** Outer building width in SVG units. */
  outerW: number;
  /** Outer building depth in SVG units. */
  outerD: number;
  /** Wall thickness in SVG units. */
  wallT: number;
  /** Hex colour for wall strokes. */
  wallColor: string;
}

/**
 * Renders the structural shell of the building: inner room fill,
 * double-line outer/inner wall rectangles, and four corner post fills.
 * This forms the foundational layer upon which all other elements are drawn.
 */
const OuterShell: React.FC<OuterShellProps> = ({ outerW, outerD, wallT, wallColor }) => {
  /** Inner room dimensions after subtracting wall thickness from both sides. */
  const innerW = outerW - 2 * wallT;
  const innerD = outerD - 2 * wallT;

  return (
    <g className="arch-fp__outer-shell">
      {/* Layer 1: Inner room fill -- white rectangle at the inner wall boundary. */}
      <rect
        x={PAD_LEFT + wallT}
        y={PAD_TOP + wallT}
        width={innerW}
        height={innerD}
        fill="#ffffff"
        stroke="none"
      />

      {/* Layer 2: Outer wall rectangle -- defines the building perimeter. */}
      <rect
        x={PAD_LEFT}
        y={PAD_TOP}
        width={outerW}
        height={outerD}
        fill="none"
        stroke={wallColor}
        strokeWidth={1}
      />

      {/* Layer 3: Inner wall rectangle -- inset by wallT to create double-line wall effect. */}
      <rect
        x={PAD_LEFT + wallT}
        y={PAD_TOP + wallT}
        width={innerW}
        height={innerD}
        fill="none"
        stroke={wallColor}
        strokeWidth={0.5}
      />

      {/* Layer 4: Corner posts -- filled dark-grey squares at each building corner. */}
      {/* Top-left corner post */}
      <rect
        x={PAD_LEFT}
        y={PAD_TOP}
        width={wallT}
        height={wallT}
        fill="#888888"
      />
      {/* Top-right corner post */}
      <rect
        x={PAD_LEFT + outerW - wallT}
        y={PAD_TOP}
        width={wallT}
        height={wallT}
        fill="#888888"
      />
      {/* Bottom-left corner post */}
      <rect
        x={PAD_LEFT}
        y={PAD_TOP + outerD - wallT}
        width={wallT}
        height={wallT}
        fill="#888888"
      />
      {/* Bottom-right corner post */}
      <rect
        x={PAD_LEFT + outerW - wallT}
        y={PAD_TOP + outerD - wallT}
        width={wallT}
        height={wallT}
        fill="#888888"
      />
    </g>
  );
};


/* ---------------------------------------------------------------------------
 * Layer 5: Exterior Apertures -- wall breaks, glazing lines, door swing arcs
 * --------------------------------------------------------------------------- */

interface ExteriorAperturesProps {
  /** Array of exterior aperture definitions. */
  apertures: ReadonlyArray<ExteriorAperture>;
  /** Outer building width in SVG units. */
  outerW: number;
  /** Outer building depth in SVG units. */
  outerD: number;
  /** Wall thickness in SVG units. */
  wallT: number;
}

/**
 * Renders exterior apertures (windows and doors) on the outer walls.
 * For each aperture, the wall is visually broken by overlaying a white
 * rectangle to erase the wall strokes, then drawing architectural symbols
 * (parallel glazing lines and optional door swing arcs) in the gap.
 *
 * Currently supports apertures on the south wall only (matching the
 * Studio reference images). The coordinate mapping can be extended to
 * all four walls by adding axis transformations for north/east/west.
 */
const ExteriorApertures: React.FC<ExteriorAperturesProps> = ({
  apertures,
  outerD,
  wallT,
}) => {
  /**
   * X-coordinate of the inner wall's left face in SVG units.
   * Aperture offsets are measured from this point along the wall interior.
   */
  const innerLeftX = PAD_LEFT + wallT;

  /**
   * Y-coordinate of the south outer wall's top edge in SVG units.
   * Used to position wall-break overlays and glazing lines.
   */
  const southWallTopY = PAD_TOP + outerD - wallT;

  /**
   * Y-coordinate of the south outer wall's bottom edge in SVG units.
   */
  const southWallBottomY = PAD_TOP + outerD;

  return (
    <g className="arch-fp__exterior-apertures">
      {apertures.map((aperture, index) => {
        if (aperture.wall !== 'south') {
          /* Non-south walls are not yet required for Studio layouts. */
          return null;
        }

        /** Aperture start position in SVG units along the south wall interior. */
        const apertureX = innerLeftX + mmToSvg(aperture.offsetMm);

        /** Aperture width in SVG units. */
        const apertureW = mmToSvg(aperture.widthMm);

        return (
          <g key={`ext-aperture-${index}`}>
            {/*
             * Wall break: a white rectangle overlaying both the outer
             * and inner wall strokes at the aperture location. This
             * visually removes the wall lines within the opening.
             * The overlay extends 1 SVG unit beyond each wall edge to
             * ensure clean erasure of stroke anti-aliasing.
             */}
            <rect
              x={apertureX}
              y={southWallTopY - 1}
              width={apertureW}
              height={wallT + 2}
              fill="#ffffff"
              stroke="none"
            />

            {/*
             * Glazing lines: two thin parallel horizontal lines spanning
             * the aperture width. They align with the outer and inner wall
             * faces to represent the glass panes in architectural convention.
             */}
            <line
              x1={apertureX}
              y1={southWallTopY}
              x2={apertureX + apertureW}
              y2={southWallTopY}
              stroke="#333333"
              strokeWidth={0.5}
            />
            <line
              x1={apertureX}
              y1={southWallBottomY}
              x2={apertureX + apertureW}
              y2={southWallBottomY}
              stroke="#333333"
              strokeWidth={0.5}
            />

            {/*
             * Sliding door swing arcs: two dashed quarter-circle arcs
             * forming a downward-pointing V below the door opening.
             * The left leaf sweeps from the left edge of the opening
             * down to the centre; the right leaf mirrors it.
             * Only rendered for sliding-door aperture types.
             */}
            {aperture.type === 'sliding-door' && (() => {
              /** Half the aperture width, used as the arc radius. */
              const halfW = apertureW / 2;

              /** Centre X of the aperture opening. */
              const centerX = apertureX + halfW;

              /** Y where the arcs start (bottom of the outer wall). */
              const arcStartY = southWallBottomY;

              return (
                <>
                  {/*
                   * Left leaf arc: from the left edge sweeping down to the centre.
                   * Uses an SVG elliptical arc command (A) with radius = halfW.
                   */}
                  <path
                    d={`M ${apertureX} ${arcStartY} A ${halfW} ${halfW} 0 0 1 ${centerX} ${arcStartY + halfW}`}
                    fill="none"
                    stroke="#333333"
                    strokeWidth={0.5}
                    strokeDasharray="4,3"
                  />
                  {/*
                   * Right leaf arc: from the right edge sweeping down to the centre.
                   * The sweep flag is reversed (0) to mirror the left leaf.
                   */}
                  <path
                    d={`M ${apertureX + apertureW} ${arcStartY} A ${halfW} ${halfW} 0 0 0 ${centerX} ${arcStartY + halfW}`}
                    fill="none"
                    stroke="#333333"
                    strokeWidth={0.5}
                    strokeDasharray="4,3"
                  />
                </>
              );
            })()}
          </g>
        );
      })}
    </g>
  );
};


/* ---------------------------------------------------------------------------
 * Layer 6: Aperture Labels and Offset Dimension Lines
 * --------------------------------------------------------------------------- */

interface ApertureLabelsProps {
  /** Array of exterior aperture definitions. */
  apertures: ReadonlyArray<ExteriorAperture>;
  /** Outer building width in SVG units. */
  outerW: number;
  /** Outer building depth in SVG units. */
  outerD: number;
  /** Wall thickness in SVG units. */
  wallT: number;
}

/**
 * Renders two-line labels below each exterior aperture and offset dimension
 * lines between apertures and the wall edges. The labels identify the
 * aperture type and width; the offset dimensions show the spacing in mm.
 */
const ApertureLabels: React.FC<ApertureLabelsProps> = ({
  apertures,
  outerW,
  outerD,
  wallT,
}) => {
  /** Only south-wall apertures are labelled in the current Studio layouts. */
  const southApertures = apertures.filter((a) => a.wall === 'south');

  if (southApertures.length === 0) return null;

  /** X-coordinate of the inner wall's left face. */
  const innerLeftX = PAD_LEFT + wallT;

  /** Total inner width of the south wall in SVG units. */
  const innerW = outerW - 2 * wallT;

  /** Y-coordinate below the south wall where labels are rendered. */
  const southWallBottomY = PAD_TOP + outerD;

  /**
   * For sliding doors, the label sits below the door swing arcs.
   * The arc extends by half the door width below the wall bottom.
   * Calculate the maximum arc depth to position labels below it.
   */
  const maxArcDepth = southApertures.reduce((max, a) => {
    if (a.type === 'sliding-door') {
      return Math.max(max, mmToSvg(a.widthMm) / 2);
    }
    return max;
  }, 0);

  /** Base Y-position for all labels, ensuring clearance below any door arcs. */
  const labelBaseY = southWallBottomY + maxArcDepth + 12;

  /**
   * Build an ordered list of segments and aperture positions along the south wall.
   * Each segment represents either a gap between features or an aperture location.
   * This array is used to render offset dimension lines between wall edges and apertures.
   */
  interface WallSegment {
    type: 'gap' | 'aperture';
    startX: number;
    endX: number;
    /** Gap width in real mm (for dimension label). Only set for gap segments. */
    gapMm?: number;
    /** Reference to the aperture data. Only set for aperture segments. */
    aperture?: ExteriorAperture;
  }

  const segments: WallSegment[] = [];
  let cursor = 0;

  southApertures
    .slice()
    .sort((a, b) => a.offsetMm - b.offsetMm)
    .forEach((aperture) => {
      /* Gap before this aperture (from cursor to aperture offset). */
      if (aperture.offsetMm > cursor) {
        segments.push({
          type: 'gap',
          startX: innerLeftX + mmToSvg(cursor),
          endX: innerLeftX + mmToSvg(aperture.offsetMm),
          gapMm: aperture.offsetMm - cursor,
        });
      }
      /* The aperture itself. */
      segments.push({
        type: 'aperture',
        startX: innerLeftX + mmToSvg(aperture.offsetMm),
        endX: innerLeftX + mmToSvg(aperture.offsetMm + aperture.widthMm),
        aperture,
      });
      cursor = aperture.offsetMm + aperture.widthMm;
    });

  /* Trailing gap after the last aperture to the inner wall right edge. */
  const innerRightMm = (outerW - 2 * wallT) / MM_TO_SVG;
  if (cursor < innerRightMm) {
    segments.push({
      type: 'gap',
      startX: innerLeftX + mmToSvg(cursor),
      endX: innerLeftX + innerW,
      gapMm: innerRightMm - cursor,
    });
  }

  /** Y-position for offset dimension lines (slightly above labels). */
  const dimLineY = labelBaseY + 2;

  return (
    <g className="arch-fp__aperture-labels">
      {segments.map((segment, index) => {
        if (segment.type === 'aperture' && segment.aperture) {
          /* Render the two-line aperture label centred below the opening. */
          const centerX = (segment.startX + segment.endX) / 2;
          const labelLines = segment.aperture.label.split('\n');

          return (
            <g key={`aperture-label-${index}`}>
              {/* Line 1: aperture width (e.g., "700MM"). */}
              <text
                x={centerX}
                y={labelBaseY}
                textAnchor="middle"
                fontSize={8}
                fill="#333333"
                fontFamily={FONT_FAMILY}
                style={{ textTransform: 'uppercase' }}
              >
                {labelLines[0]}
              </text>
              {/* Line 2: aperture type (e.g., "T&T WINDOW"). */}
              {labelLines[1] && (
                <text
                  x={centerX}
                  y={labelBaseY + 10}
                  textAnchor="middle"
                  fontSize={7}
                  fill="#666666"
                  fontFamily={FONT_FAMILY}
                  style={{ textTransform: 'uppercase' }}
                >
                  {labelLines[1]}
                </text>
              )}
            </g>
          );
        }

        if (segment.type === 'gap' && segment.gapMm !== undefined) {
          /**
           * Render an offset dimension line for the gap between features.
           * The line has small vertical tick marks at each end and a centred
           * value label showing the gap width in millimetres.
           */
          const centerX = (segment.startX + segment.endX) / 2;
          const tickHeight = 3;

          return (
            <g key={`gap-dim-${index}`}>
              {/* Horizontal dimension line. */}
              <line
                x1={segment.startX}
                y1={dimLineY}
                x2={segment.endX}
                y2={dimLineY}
                stroke="#999999"
                strokeWidth={0.3}
              />
              {/* Left tick mark. */}
              <line
                x1={segment.startX}
                y1={dimLineY - tickHeight}
                x2={segment.startX}
                y2={dimLineY + tickHeight}
                stroke="#999999"
                strokeWidth={0.3}
              />
              {/* Right tick mark. */}
              <line
                x1={segment.endX}
                y1={dimLineY - tickHeight}
                x2={segment.endX}
                y2={dimLineY + tickHeight}
                stroke="#999999"
                strokeWidth={0.3}
              />
              {/* Centred gap value label. */}
              <text
                x={centerX}
                y={dimLineY - 4}
                textAnchor="middle"
                fontSize={7}
                fill="#999999"
                fontFamily={FONT_FAMILY}
              >
                {Math.round(segment.gapMm)}
              </text>
            </g>
          );
        }

        return null;
      })}
    </g>
  );
};


/* ---------------------------------------------------------------------------
 * Layer 7-8: Exterior and Interior Dimension Lines
 * --------------------------------------------------------------------------- */

interface DimensionLinesProps {
  /** Array of dimension annotation definitions. */
  dimensions: ReadonlyArray<DimensionAnnotation>;
  /** Outer building width in SVG units. */
  outerW: number;
  /** Outer building depth in SVG units. */
  outerD: number;
  /** Wall thickness in SVG units. */
  wallT: number;
}

/**
 * Renders exterior (bold) and interior (light) dimension lines around
 * the floor plan. Exterior lines sit outside the wall perimeter with
 * extension lines connecting to the wall corners. Interior lines sit
 * just inside the inner wall face.
 */
const DimensionLines: React.FC<DimensionLinesProps> = ({
  dimensions,
  outerW,
  outerD,
  wallT,
}) => {
  /** Inner room dimensions (outer minus two wall thicknesses). */
  const innerW = outerW - 2 * wallT;
  const innerD = outerD - 2 * wallT;

  return (
    <g className="arch-fp__dimension-lines">
      {dimensions.map((dim, index) => {
        if (dim.type === 'exterior' && dim.side === 'top') {
          /**
           * Top exterior dimension: a bold horizontal line above the
           * north wall with vertical extension lines dropping down
           * to the wall corners.
           */
          const lineY = PAD_TOP - 40;
          const leftX = PAD_LEFT;
          const rightX = PAD_LEFT + outerW;
          const centerX = (leftX + rightX) / 2;

          return (
            <g key={`dim-${index}`}>
              {/* Horizontal dimension line. */}
              <line
                x1={leftX} y1={lineY}
                x2={rightX} y2={lineY}
                stroke="#1a1a1a" strokeWidth={0.5}
              />
              {/* Left vertical extension line down to wall corner. */}
              <line
                x1={leftX} y1={lineY}
                x2={leftX} y2={lineY + 10}
                stroke="#1a1a1a" strokeWidth={0.5}
              />
              {/* Right vertical extension line down to wall corner. */}
              <line
                x1={rightX} y1={lineY}
                x2={rightX} y2={lineY + 10}
                stroke="#1a1a1a" strokeWidth={0.5}
              />
              {/* Centred bold dimension value. */}
              <text
                x={centerX} y={lineY - 4}
                textAnchor="middle"
                fontSize={12}
                fontWeight="bold"
                fill="#1a1a1a"
                fontFamily={FONT_FAMILY}
              >
                {dim.value}
              </text>
            </g>
          );
        }

        if (dim.type === 'exterior' && dim.side === 'left') {
          /**
           * Left exterior dimension: a bold vertical line to the left
           * of the west wall with horizontal extension lines connecting
           * to the wall corners. Text is rotated 90 degrees counter-clockwise.
           */
          const lineX = PAD_LEFT - 30;
          const topY = PAD_TOP;
          const bottomY = PAD_TOP + outerD;
          const centerY = (topY + bottomY) / 2;

          return (
            <g key={`dim-${index}`}>
              {/* Vertical dimension line. */}
              <line
                x1={lineX} y1={topY}
                x2={lineX} y2={bottomY}
                stroke="#1a1a1a" strokeWidth={0.5}
              />
              {/* Top horizontal extension line to wall corner. */}
              <line
                x1={lineX} y1={topY}
                x2={lineX + 10} y2={topY}
                stroke="#1a1a1a" strokeWidth={0.5}
              />
              {/* Bottom horizontal extension line to wall corner. */}
              <line
                x1={lineX} y1={bottomY}
                x2={lineX + 10} y2={bottomY}
                stroke="#1a1a1a" strokeWidth={0.5}
              />
              {/* Rotated centred bold dimension value. */}
              <text
                x={lineX - 6} y={centerY}
                textAnchor="middle"
                fontSize={12}
                fontWeight="bold"
                fill="#1a1a1a"
                fontFamily={FONT_FAMILY}
                transform={`rotate(-90, ${lineX - 6}, ${centerY})`}
              >
                {dim.value}
              </text>
            </g>
          );
        }

        if (dim.type === 'interior' && dim.side === 'top') {
          /**
           * Top interior dimension: a light horizontal line just below
           * the inner face of the north wall. Extension lines connect
           * upward to the inner wall face at each end.
           */
          const innerTopY = PAD_TOP + wallT;
          const lineY = innerTopY + 5;
          const leftX = PAD_LEFT + wallT;
          const rightX = PAD_LEFT + wallT + innerW;
          const centerX = (leftX + rightX) / 2;

          return (
            <g key={`dim-${index}`}>
              {/* Horizontal dimension line. */}
              <line
                x1={leftX} y1={lineY}
                x2={rightX} y2={lineY}
                stroke="#999999" strokeWidth={0.3}
              />
              {/* Left extension line up to inner wall. */}
              <line
                x1={leftX} y1={lineY}
                x2={leftX} y2={lineY - 5}
                stroke="#999999" strokeWidth={0.3}
              />
              {/* Right extension line up to inner wall. */}
              <line
                x1={rightX} y1={lineY}
                x2={rightX} y2={lineY - 5}
                stroke="#999999" strokeWidth={0.3}
              />
              {/* Centred light dimension value below the line. */}
              <text
                x={centerX} y={lineY + 10}
                textAnchor="middle"
                fontSize={8}
                fill="#999999"
                fontFamily={FONT_FAMILY}
              >
                {dim.value}
              </text>
            </g>
          );
        }

        if (dim.type === 'interior' && dim.side === 'right') {
          /**
           * Right interior dimension: a light vertical line just inside
           * the inner face of the east wall. Extension lines connect
           * right to the inner wall face at each end. Text is rotated
           * 90 degrees counter-clockwise.
           */
          const innerRightX = PAD_LEFT + wallT + innerW;
          const lineX = innerRightX - 5;
          const topY = PAD_TOP + wallT;
          const bottomY = PAD_TOP + wallT + innerD;
          const centerY = (topY + bottomY) / 2;

          return (
            <g key={`dim-${index}`}>
              {/* Vertical dimension line. */}
              <line
                x1={lineX} y1={topY}
                x2={lineX} y2={bottomY}
                stroke="#999999" strokeWidth={0.3}
              />
              {/* Top extension line to inner wall. */}
              <line
                x1={lineX} y1={topY}
                x2={lineX + 5} y2={topY}
                stroke="#999999" strokeWidth={0.3}
              />
              {/* Bottom extension line to inner wall. */}
              <line
                x1={lineX} y1={bottomY}
                x2={lineX + 5} y2={bottomY}
                stroke="#999999" strokeWidth={0.3}
              />
              {/* Rotated centred light dimension value. */}
              <text
                x={lineX - 6} y={centerY}
                textAnchor="middle"
                fontSize={8}
                fill="#999999"
                fontFamily={FONT_FAMILY}
                transform={`rotate(-90, ${lineX - 6}, ${centerY})`}
              >
                {dim.value}
              </text>
            </g>
          );
        }

        return null;
      })}
    </g>
  );
};


/* ---------------------------------------------------------------------------
 * Layer 9: North Arrow
 * --------------------------------------------------------------------------- */

interface NorthArrowProps {
  /** Array of exterior aperture definitions to locate the sliding door. */
  apertures: ReadonlyArray<ExteriorAperture>;
  /** Outer building depth in SVG units. */
  outerD: number;
  /** Wall thickness in SVG units. */
  wallT: number;
}

/**
 * Renders a solid black downward-pointing triangle (north arrow) centred
 * horizontally on the sliding door opening, positioned at the base of the
 * door swing arcs. The arrow indicates the south-facing entrance direction.
 */
const NorthArrow: React.FC<NorthArrowProps> = ({ apertures, outerD, wallT }) => {
  /** Find the first sliding door on the south wall for positioning. */
  const slidingDoor = apertures.find(
    (a) => a.wall === 'south' && a.type === 'sliding-door'
  );

  if (!slidingDoor) return null;

  /** X-coordinate of the inner wall's left face. */
  const innerLeftX = PAD_LEFT + wallT;

  /** Centre X of the sliding door opening. */
  const doorCenterX = innerLeftX + mmToSvg(slidingDoor.offsetMm) + mmToSvg(slidingDoor.widthMm) / 2;

  /** Y where the south outer wall bottom sits. */
  const southWallBottomY = PAD_TOP + outerD;

  /** The door swing arc extends downward by half the door width. */
  const arcDepth = mmToSvg(slidingDoor.widthMm) / 2;

  /** Arrow tip Y: sits at the very bottom of the door swing arcs. */
  const arrowTipY = southWallBottomY + arcDepth;

  /** Arrow dimensions in SVG units (approximately 40mm wide x 50mm tall scaled). */
  const arrowHalfWidth = 2;
  const arrowHeight = 5;

  /**
   * Triangle polygon points forming a downward-pointing arrow.
   * The top edge is a horizontal line; the bottom vertex is the tip.
   */
  const points = [
    `${doorCenterX - arrowHalfWidth},${arrowTipY - arrowHeight}`,
    `${doorCenterX + arrowHalfWidth},${arrowTipY - arrowHeight}`,
    `${doorCenterX},${arrowTipY}`,
  ].join(' ');

  return (
    <g className="arch-fp__north-arrow">
      <polygon
        points={points}
        fill="#1a1a1a"
        stroke="none"
      />
    </g>
  );
};


/* ---------------------------------------------------------------------------
 * Layer 10: Room Zone Labels
 * --------------------------------------------------------------------------- */

interface RoomZoneLabelsProps {
  /** Array of room zone definitions with centred label positions. */
  zones: ReadonlyArray<RoomZone>;
}

/**
 * Renders room zone labels as two lines of centred uppercase text inside
 * the floor plan. Line 1 is the room name (bold); line 2 is the area
 * (regular weight). If the area field is empty, only the name is rendered.
 */
const RoomZoneLabels: React.FC<RoomZoneLabelsProps> = ({ zones }) => {
  return (
    <g className="arch-fp__room-zones">
      {zones.map((zone, index) => {
        /** Convert zone centre coordinates from mm to SVG units, offset by plan padding. */
        const cx = PAD_LEFT + mmToSvg(zone.centerXMm);
        const cy = PAD_TOP + mmToSvg(zone.centerYMm);

        return (
          <text key={`zone-${index}`} textAnchor="middle" dominantBaseline="auto">
            {/* Line 1: Room name in bold, uppercase. */}
            <tspan
              x={cx}
              y={cy}
              fontSize={10}
              fontWeight={600}
              fill="#333333"
              fontFamily={FONT_FAMILY}
            >
              {zone.name}
            </tspan>
            {/*
             * Line 2: Area text in regular weight, rendered 14px below the name.
             * Only rendered when the area string is non-empty (Kitchen zones
             * in the reference images omit the area value).
             */}
            {zone.area && (
              <tspan
                x={cx}
                dy={14}
                fontSize={8}
                fontWeight={400}
                fill="#666666"
                fontFamily={FONT_FAMILY}
              >
                {zone.area}
              </tspan>
            )}
          </text>
        );
      })}
    </g>
  );
};


/* ---------------------------------------------------------------------------
 * Layer 11: Internal Partition Walls and Doors
 * --------------------------------------------------------------------------- */

interface InternalWallsProps {
  /** Array of internal wall segment definitions. */
  walls: ReadonlyArray<InternalWall>;
  /** Wall thickness in SVG units (same as outer walls). */
  wallT: number;
  /** Hex colour for wall strokes (matches outer wall colour). */
  wallColor: string;
}

/**
 * Renders internal partition walls as double-line segments with door
 * openings. Each wall is drawn as two parallel lines separated by the
 * wall thickness, centred on the segment path. Doors create wall breaks
 * (white overlay rectangles) with dashed quarter-circle swing arcs.
 *
 * Wall orientation (horizontal or vertical) is automatically detected
 * from the start and end coordinates. This determines how the parallel
 * lines are offset and how door swing arcs are rotated.
 */
const InternalWalls: React.FC<InternalWallsProps> = ({ walls, wallT, wallColor }) => {
  /** Half the wall thickness, used to offset parallel lines from the centre path. */
  const halfT = wallT / 2;

  return (
    <g className="arch-fp__internal-walls">
      {walls.map((wall, wallIndex) => {
        /** Convert start and end points from mm to SVG units with plan padding. */
        const sx = PAD_LEFT + mmToSvg(wall.startMm.x);
        const sy = PAD_TOP + mmToSvg(wall.startMm.y);
        const ex = PAD_LEFT + mmToSvg(wall.endMm.x);
        const ey = PAD_TOP + mmToSvg(wall.endMm.y);

        /**
         * Determine wall orientation.
         * Horizontal walls share the same Y; vertical walls share the same X.
         */
        const isHorizontal = Math.abs(sy - ey) < 0.01;

        /**
         * Calculate the total wall length in SVG units for use in
         * determining door position coordinates along the segment.
         */
        const wallLengthSvg = isHorizontal
          ? Math.abs(ex - sx)
          : Math.abs(ey - sy);

        /**
         * Build an array of solid wall segments by subtracting door openings.
         * Each continuous segment between doors (or wall ends) is drawn as
         * a separate pair of parallel lines.
         */
        interface SolidSegment {
          /** Offset from segment start in SVG units. */
          startOffset: number;
          /** Offset from segment start in SVG units. */
          endOffset: number;
        }

        const doors = wall.doors.slice().sort((a, b) => a.offsetMm - b.offsetMm);
        const solidSegments: SolidSegment[] = [];
        let segmentCursor = 0;

        doors.forEach((door) => {
          const doorStartSvg = mmToSvg(door.offsetMm);
          const doorWidthSvg = mmToSvg(door.widthMm);

          if (doorStartSvg > segmentCursor) {
            solidSegments.push({
              startOffset: segmentCursor,
              endOffset: doorStartSvg,
            });
          }
          segmentCursor = doorStartSvg + doorWidthSvg;
        });

        /* Final segment from last door to wall end. */
        if (segmentCursor < wallLengthSvg) {
          solidSegments.push({
            startOffset: segmentCursor,
            endOffset: wallLengthSvg,
          });
        }

        return (
          <g key={`internal-wall-${wallIndex}`}>
            {/* Render solid wall segments as double-line pairs. */}
            {solidSegments.map((seg, segIndex) => {
              if (isHorizontal) {
                /** Direction multiplier: +1 if wall runs left-to-right, -1 if right-to-left. */
                const dir = ex > sx ? 1 : -1;
                const segStartX = sx + seg.startOffset * dir;
                const segEndX = sx + seg.endOffset * dir;

                return (
                  <g key={`seg-${segIndex}`}>
                    {/* Top parallel line (offset upward by half wall thickness). */}
                    <line
                      x1={segStartX} y1={sy - halfT}
                      x2={segEndX} y2={sy - halfT}
                      stroke={wallColor} strokeWidth={0.5}
                    />
                    {/* Bottom parallel line (offset downward by half wall thickness). */}
                    <line
                      x1={segStartX} y1={sy + halfT}
                      x2={segEndX} y2={sy + halfT}
                      stroke={wallColor} strokeWidth={0.5}
                    />
                  </g>
                );
              } else {
                /** Direction multiplier: +1 if wall runs top-to-bottom, -1 otherwise. */
                const dir = ey > sy ? 1 : -1;
                const segStartY = sy + seg.startOffset * dir;
                const segEndY = sy + seg.endOffset * dir;

                return (
                  <g key={`seg-${segIndex}`}>
                    {/* Left parallel line (offset left by half wall thickness). */}
                    <line
                      x1={sx - halfT} y1={segStartY}
                      x2={sx - halfT} y2={segEndY}
                      stroke={wallColor} strokeWidth={0.5}
                    />
                    {/* Right parallel line (offset right by half wall thickness). */}
                    <line
                      x1={sx + halfT} y1={segStartY}
                      x2={sx + halfT} y2={segEndY}
                      stroke={wallColor} strokeWidth={0.5}
                    />
                  </g>
                );
              }
            })}

            {/* Render door openings with wall-break overlays and swing arcs. */}
            {doors.map((door, doorIndex) => {
              const doorStartSvg = mmToSvg(door.offsetMm);
              const doorWidthSvg = mmToSvg(door.widthMm);

              if (isHorizontal) {
                const dir = ex > sx ? 1 : -1;
                /** X-coordinate of the door opening start. */
                const doorX = sx + doorStartSvg * dir;
                /** X-coordinate of the door opening end. */
                const doorEndX = sx + (doorStartSvg + doorWidthSvg) * dir;

                /**
                 * White overlay to erase the wall lines at the door opening.
                 * Extends slightly beyond the wall thickness for clean erasure.
                 */
                const overlayX = Math.min(doorX, doorEndX);
                const overlayW = Math.abs(doorEndX - doorX);

                /** Determine arc direction: "left" swings upward, "right" swings downward. */
                const arcGoesUp = door.swingDirection === 'left';

                /** Hinge point at one edge of the door opening. */
                const hingeX = doorX;
                const hingeY = sy;

                /** Arc end point: 90 degrees from the hinge along the wall normal. */
                const arcEndX = hingeX;
                const arcEndY = arcGoesUp
                  ? hingeY - doorWidthSvg
                  : hingeY + doorWidthSvg;

                /** Arc start: at the far edge of the door opening on the wall line. */
                const arcStartX = doorEndX;
                const arcStartY = sy;

                return (
                  <g key={`door-${doorIndex}`}>
                    {/* Wall-break overlay rectangle. */}
                    <rect
                      x={overlayX}
                      y={sy - halfT - 1}
                      width={overlayW}
                      height={wallT + 2}
                      fill="#ffffff"
                      stroke="none"
                    />
                    {/*
                     * Dashed quarter-circle swing arc showing the door's
                     * opening direction. The arc sweeps from the door's far
                     * edge to a point perpendicular to the wall at the hinge.
                     */}
                    <path
                      d={`M ${arcStartX} ${arcStartY} A ${doorWidthSvg} ${doorWidthSvg} 0 0 ${arcGoesUp ? 1 : 0} ${arcEndX} ${arcEndY}`}
                      fill="none"
                      stroke="#999999"
                      strokeWidth={0.5}
                      strokeDasharray="3,3"
                    />
                  </g>
                );
              } else {
                const dir = ey > sy ? 1 : -1;
                /** Y-coordinate of the door opening start. */
                const doorY = sy + doorStartSvg * dir;
                /** Y-coordinate of the door opening end. */
                const doorEndY = sy + (doorStartSvg + doorWidthSvg) * dir;

                const overlayY = Math.min(doorY, doorEndY);
                const overlayH = Math.abs(doorEndY - doorY);

                /** Determine arc direction: "left" swings left, "right" swings right. */
                const arcGoesLeft = door.swingDirection === 'left';

                /** Hinge point at one edge of the door opening. */
                const hingeX = sx;
                const hingeY = doorY;

                /** Arc end point: 90 degrees from the hinge along the wall normal. */
                const arcEndX = arcGoesLeft
                  ? hingeX - doorWidthSvg
                  : hingeX + doorWidthSvg;
                const arcEndY = hingeY;

                /** Arc start: at the far edge of the door opening on the wall line. */
                const arcStartX = sx;
                const arcStartY = doorEndY;

                return (
                  <g key={`door-${doorIndex}`}>
                    {/* Wall-break overlay rectangle. */}
                    <rect
                      x={sx - halfT - 1}
                      y={overlayY}
                      width={wallT + 2}
                      height={overlayH}
                      fill="#ffffff"
                      stroke="none"
                    />
                    {/*
                     * Dashed quarter-circle swing arc for the internal door.
                     * Sweeps from the far edge of the opening to a perpendicular
                     * point at the hinge, indicating the door's swing radius.
                     */}
                    <path
                      d={`M ${arcStartX} ${arcStartY} A ${doorWidthSvg} ${doorWidthSvg} 0 0 ${arcGoesLeft ? 1 : 0} ${arcEndX} ${arcEndY}`}
                      fill="none"
                      stroke="#999999"
                      strokeWidth={0.5}
                      strokeDasharray="3,3"
                    />
                  </g>
                );
              }
            })}
          </g>
        );
      })}
    </g>
  );
};


/* ---------------------------------------------------------------------------
 * Layer 12: Internal Dimension Annotations
 * --------------------------------------------------------------------------- */

interface InternalDimensionsProps {
  /** Array of internal dimension annotation definitions. */
  internalDimensions: ReadonlyArray<InternalDimension>;
}

/**
 * Renders internal dimension annotations as thin leader lines with tick
 * marks at each end and a centred text label. Each annotation is
 * positioned by its start and end points in mm from the top-left corner.
 * Line orientation (horizontal or vertical) is auto-detected.
 */
const InternalDimensionAnnotations: React.FC<InternalDimensionsProps> = ({
  internalDimensions,
}) => {
  /** Tick mark length in SVG units. */
  const tickLen = 3;

  return (
    <g className="arch-fp__internal-dimensions">
      {internalDimensions.map((dim, index) => {
        /** Convert start and end points from mm to SVG units with padding. */
        const sx = PAD_LEFT + mmToSvg(dim.startMm.x);
        const sy = PAD_TOP + mmToSvg(dim.startMm.y);
        const ex = PAD_LEFT + mmToSvg(dim.endMm.x);
        const ey = PAD_TOP + mmToSvg(dim.endMm.y);

        /** Determine orientation: horizontal if Y values match, vertical if X values match. */
        const isHorizontal = Math.abs(sy - ey) < 0.01;

        if (isHorizontal) {
          const centerX = (sx + ex) / 2;
          /** Label Y-offset depends on whether it sits above or below the line. */
          const labelY = dim.labelSide === 'above' ? sy - 5 : sy + 9;

          return (
            <g key={`int-dim-${index}`}>
              {/* Horizontal leader line. */}
              <line
                x1={sx} y1={sy}
                x2={ex} y2={ey}
                stroke="#999999" strokeWidth={0.3}
              />
              {/* Left perpendicular tick mark. */}
              <line
                x1={sx} y1={sy - tickLen}
                x2={sx} y2={sy + tickLen}
                stroke="#999999" strokeWidth={0.3}
              />
              {/* Right perpendicular tick mark. */}
              <line
                x1={ex} y1={ey - tickLen}
                x2={ex} y2={ey + tickLen}
                stroke="#999999" strokeWidth={0.3}
              />
              {/* Centred Value label. */}
              <text
                x={centerX} y={labelY}
                textAnchor="middle"
                fontSize={7}
                fill="#999999"
                fontFamily={FONT_FAMILY}
              >
                {dim.value}
              </text>
            </g>
          );
        } else {
          const centerY = (sy + ey) / 2;
          /** Label X-offset depends on whether it sits left or right of the line. */
          const labelX = dim.labelSide === 'left' ? sx - 6 : sx + 6;

          return (
            <g key={`int-dim-${index}`}>
              {/* Vertical leader line. */}
              <line
                x1={sx} y1={sy}
                x2={ex} y2={ey}
                stroke="#999999" strokeWidth={0.3}
              />
              {/* Top perpendicular tick mark. */}
              <line
                x1={sx - tickLen} y1={sy}
                x2={sx + tickLen} y2={sy}
                stroke="#999999" strokeWidth={0.3}
              />
              {/* Bottom perpendicular tick mark. */}
              <line
                x1={ex - tickLen} y1={ey}
                x2={ex + tickLen} y2={ey}
                stroke="#999999" strokeWidth={0.3}
              />
              {/* Rotated centred value label. */}
              <text
                x={labelX} y={centerY}
                textAnchor="middle"
                fontSize={7}
                fill="#999999"
                fontFamily={FONT_FAMILY}
                transform={`rotate(-90, ${labelX}, ${centerY})`}
              >
                {dim.value}
              </text>
            </g>
          );
        }
      })}
    </g>
  );
};


/* =============================================================================
   MAIN COMPONENT
   =============================================================================
   Composes all rendering sub-components into a single proportionally-scaled
   SVG element. The viewBox is computed from the building geometry so that
   different floor plan sizes (5x5, 4.15x6) produce correctly proportioned
   drawings without any hard-coded viewport dimensions.
   ============================================================================= */

/**
 * ArchitecturalFloorPlan renders an architectural-quality SVG floor plan
 * from a data-driven configuration object. The SVG scales proportionally
 * within any container via viewBox and preserveAspectRatio.
 *
 * @param config - Complete floor plan geometry and annotation data.
 * @param className - Optional CSS class for external sizing control.
 * @param wallColorOverride - Optional wall colour override from exterior finish selection.
 */
export const ArchitecturalFloorPlan: React.FC<ArchitecturalFloorPlanComponentProps> = ({
  config,
  className,
  wallColorOverride,
}) => {
  /** Resolve the effective wall colour: prop override takes precedence over config default. */
  const wallColor = wallColorOverride ?? config.wallColor;

  /** Convert outer building dimensions from mm to SVG units. */
  const outerW = mmToSvg(config.outerWidthMm);
  const outerD = mmToSvg(config.outerDepthMm);
  const wallT = mmToSvg(config.wallThicknessMm);

  /**
   * Compute the SVG viewBox dimensions from the building geometry plus
   * fixed padding on all four sides. This produces a proportionally
   * correct viewport for both square (5x5) and rectangular (4.15x6) plans.
   */
  const viewBoxWidth = outerW + PAD_LEFT + PAD_RIGHT;
  const viewBoxHeight = outerD + PAD_TOP + PAD_BOTTOM;

  /** Construct the aria-label for screen readers from the building dimensions. */
  const widthM = (config.outerWidthMm / 1000).toFixed(2).replace(/\.?0+$/, '');
  const depthM = (config.outerDepthMm / 1000).toFixed(2).replace(/\.?0+$/, '');
  const ariaLabel = `Floor plan: ${widthM}m x ${depthM}m garden room`;

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Layer 1-4: Outer shell (inner fill, double-line walls, corner posts). */}
      <OuterShell
        outerW={outerW}
        outerD={outerD}
        wallT={wallT}
        wallColor={wallColor}
      />

      {/* Layer 5: Exterior apertures with wall breaks, glazing lines, and door swing arcs. */}
      <ExteriorApertures
        apertures={config.apertures}
        outerW={outerW}
        outerD={outerD}
        wallT={wallT}
      />

      {/* Layer 6: Aperture labels and offset dimension lines below the south wall. */}
      <ApertureLabels
        apertures={config.apertures}
        outerW={outerW}
        outerD={outerD}
        wallT={wallT}
      />

      {/* Layer 7-8: Exterior and interior dimension lines. */}
      <DimensionLines
        dimensions={config.dimensions}
        outerW={outerW}
        outerD={outerD}
        wallT={wallT}
      />

      {/* Layer 9: North arrow below the south entrance. */}
      <NorthArrow
        apertures={config.apertures}
        outerD={outerD}
        wallT={wallT}
      />

      {/* Layer 10: Room zone labels (name + area). */}
      <RoomZoneLabels zones={config.zones} />

      {/* Layer 11: Internal partition walls with door openings and swing arcs. */}
      {config.internalWalls && config.internalWalls.length > 0 && (
        <InternalWalls
          walls={config.internalWalls}
          wallT={wallT}
          wallColor={wallColor}
        />
      )}

      {/* Layer 12: Internal dimension annotations. */}
      {config.internalDimensions && config.internalDimensions.length > 0 && (
        <InternalDimensionAnnotations
          internalDimensions={config.internalDimensions}
        />
      )}
    </svg>
  );
};
