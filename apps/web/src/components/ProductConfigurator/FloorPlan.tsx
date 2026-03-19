/**
 * FloorPlan -- Dynamic SVG Floor Plan Renderer
 * =============================================================================
 *
 * PURPOSE:
 * Renders a to-scale SVG floor plan for a given garden room product. The
 * outer wall colour adapts to the selected exterior finish, providing
 * visual feedback as the user configures their room.
 *
 * ARCHITECTURE:
 * The component consumes the FloorPlanConfig interface from the product
 * data model, which includes aperture positions and dimension labels.
 * Apertures (windows and doors) are rendered on the appropriate walls
 * based on their `wall` property.
 *
 * The SVG viewport is normalised to 260x260 units regardless of the
 * actual room dimensions, maintaining consistent visual sizing across
 * all product sizes.
 *
 * =============================================================================
 */

import React from 'react';

/* Type-only imports for the floor plan data model.
 * - Aperture: describes a single window or door (type, wall, width).
 * - FloorPlanConfig: aggregates all apertures plus dimension label strings.
 * - ProductDimensions: physical measurements (widthM, depthM, areaM2). */
import type { Aperture, FloorPlanConfig, ProductDimensions } from '../../types/configurator';


/* =============================================================================
   Component Props
   ============================================================================= */

interface FloorPlanProps {
  /** Structured floor plan configuration from the product data model. */
  config: FloorPlanConfig;
  /** Physical dimensions used for the area label. */
  dimensions: ProductDimensions;
  /** Hex colour for the outer wall stroke, derived from the selected exterior finish. */
  wallColor: string;
}


/* =============================================================================
   FloorPlan Component
   ============================================================================= */

export const FloorPlan: React.FC<FloorPlanProps> = ({
  config,
  dimensions,
  wallColor,
}) => {
  /**
   * Builds an array of SVG elements representing every aperture in the
   * floor plan. The function performs three passes:
   *   1. Groups apertures by wall (north / east / south / west).
   *   2. Calculates a proportionally-scaled width and a centred start
   *      position for each aperture within its wall group.
   *   3. Generates the appropriate SVG primitives per aperture type:
   *      - tilt-turn-window / fixed-glazing: narrow blue rectangle with
   *        a centre divider line to indicate the glazing split.
   *      - french-door: wider blue rectangle with a dashed quadratic
   *        Bezier arc representing the door swing.
   *      - sliding-door: wide blue rectangle without an arc.
   *
   * @returns An array of React SVG nodes to be composed into the plan.
   */
  const renderApertures = (): React.ReactNode[] => {
    /* Accumulator for the SVG elements produced during iteration. */
    const elements: React.ReactNode[] = [];

    /*
     * Pass 1 -- Group apertures by their wall.
     * This grouping is necessary so that multiple apertures on the same
     * wall can later be collectively centred with uniform spacing.
     */
    const wallGroups: Record<string, Aperture[]> = {
      north: [],
      east: [],
      south: [],
      west: [],
    };
    config.apertures.forEach((a) => wallGroups[a.wall].push(a));

    /**
     * Converts an aperture's real-world width (mm) into SVG coordinate
     * units. The inner wall span in the SVG is 220 units (rect from
     * x=20 to x=240), so the ratio `apertureWidthMm / wallLengthMm`
     * is multiplied by 220 to obtain the visual width.
     *
     * Horizontal walls (north/south) use the room width; vertical
     * walls (east/west) use the room depth.
     */
    const getProportionalWidth = (aperture: typeof config.apertures[number]): number => {
      const isHorizontalWall = aperture.wall === 'north' || aperture.wall === 'south';
      const wallLengthMm = isHorizontalWall
        ? dimensions.widthM * 1000
        : dimensions.depthM * 1000;
      return (aperture.widthMm / wallLengthMm) * 220;
    };

    /*
     * Pass 2 -- Calculate centred start positions.
     *
     * For each wall group the total occupied width (aperture widths +
     * inter-aperture gaps) is computed and centred around `wallCenter`
     * (SVG unit 130, the midpoint of the 260-unit viewport).
     *
     * A sliding cursor tracks the running x (or y) offset; each
     * aperture's start position is stored by its global index in
     * `aperturePositions` so it can be looked up during rendering.
     */
    const gap = 10;           /* SVG-unit spacing between adjacent apertures. */
    const wallCenter = 130;   /* Midpoint of the 260-unit SVG viewport.       */
    const aperturePositions = new Map<number, number>();

    for (const wall of Object.keys(wallGroups)) {
      const group = wallGroups[wall];

      /* Sum of all aperture widths plus the gaps in between. */
      const totalWidth =
        group.reduce((sum, a) => sum + getProportionalWidth(a), 0) +
        (group.length - 1) * gap;

      /* Start the cursor so the group is centred on the wall. */
      let cursor = wallCenter - totalWidth / 2;

      group.forEach((aperture) => {
        const idx = config.apertures.indexOf(aperture);
        aperturePositions.set(idx, cursor);
        cursor += getProportionalWidth(aperture) + gap;
      });
    }

    /*
     * Pass 3 -- Render SVG elements.
     *
     * Each aperture is drawn on its designated wall using the
     * pre-computed proportional width and centred start position.
     * The wall determines the coordinate axis: north/south apertures
     * are positioned along x; east/west apertures along y.
     */
    config.apertures.forEach((aperture, index) => {
      const key = `aperture-${index}`;
      const proportionalWidth = getProportionalWidth(aperture);
      const startPos = aperturePositions.get(index) ?? 0;

      /* Classification flags drive visual treatment per aperture type. */
      const isWindow =
        aperture.type === 'tilt-turn-window' || aperture.type === 'fixed-glazing';
      const isDoor =
        aperture.type === 'french-door' || aperture.type === 'sliding-door';

      switch (aperture.wall) {
        /*
         * North wall -- aperture sits along the top edge of the plan.
         * y=17 places the rectangle just inside the 6-unit wall stroke
         * that starts at y=20.
         */
        case 'north':
          elements.push(
            <React.Fragment key={key}>
              {/* Blue glazing bar spanning the proportional width. */}
              <rect
                x={startPos} y={17}
                width={proportionalWidth} height={6} rx={2}
                fill="#89CFF0"
              />
              {/* Centre divider line -- only drawn for window types. */}
              {isWindow && (
                <line
                  x1={startPos + proportionalWidth / 2} y1={17}
                  x2={startPos + proportionalWidth / 2} y2={23}
                  stroke="#fff" strokeWidth={1}
                />
              )}
            </React.Fragment>
          );
          break;

        /*
         * East wall -- aperture sits along the right edge.
         * x=237 aligns with the inner face of the 6-unit wall stroke
         * that ends at x=240.
         */
        case 'east':
          elements.push(
            <React.Fragment key={key}>
              {/* Vertical glazing bar. */}
              <rect
                x={237} y={startPos}
                width={6} height={proportionalWidth} rx={2}
                fill="#89CFF0"
              />
              {/* Horizontal centre divider for window types. */}
              {isWindow && (
                <line
                  x1={237} y1={startPos + proportionalWidth / 2}
                  x2={243} y2={startPos + proportionalWidth / 2}
                  stroke="#fff" strokeWidth={1}
                />
              )}
              {/*
               * Door swing arc -- a dashed quadratic Bezier curve
               * indicating the opening sweep of a French door.
               * Only rendered for the french-door subtype.
               */}
              {isDoor && aperture.type === 'french-door' && (
                <path
                  d={`M237 ${startPos} Q${237 - proportionalWidth * 0.6} ${startPos} ${237 - proportionalWidth * 0.6} ${startPos + proportionalWidth / 2}`}
                  fill="none" stroke="#ccc"
                  strokeWidth={1} strokeDasharray="3,3"
                />
              )}
            </React.Fragment>
          );
          break;

        /*
         * South wall -- aperture sits along the bottom edge.
         * y=237 mirrors the north wall placement relative to the
         * bottom wall stroke at y=240.
         */
        case 'south':
          elements.push(
            <React.Fragment key={key}>
              <rect
                x={startPos} y={237}
                width={proportionalWidth} height={6} rx={2}
                fill="#89CFF0"
              />
              {isWindow && (
                <line
                  x1={startPos + proportionalWidth / 2} y1={237}
                  x2={startPos + proportionalWidth / 2} y2={243}
                  stroke="#fff" strokeWidth={1}
                />
              )}
            </React.Fragment>
          );
          break;

        /*
         * West wall -- aperture sits along the left edge.
         * x=17 mirrors the east wall placement relative to the
         * left wall stroke at x=20.
         */
        case 'west':
          elements.push(
            <React.Fragment key={key}>
              <rect
                x={17} y={startPos}
                width={6} height={proportionalWidth} rx={2}
                fill="#89CFF0"
              />
              {isWindow && (
                <line
                  x1={17} y1={startPos + proportionalWidth / 2}
                  x2={23} y2={startPos + proportionalWidth / 2}
                  stroke="#fff" strokeWidth={1}
                />
              )}
            </React.Fragment>
          );
          break;
      }
    });

    return elements;
  };

  /* ---------------------------------------------------------------------------
   * SVG Rendering
   *
   * The SVG uses a fixed 260x260 viewBox so the floor plan scales uniformly
   * regardless of the container size. The coordinate system is:
   *   - 20..240 : outer wall rect (220-unit span)
   *   - 28..232 : inner room fill (204-unit span, inset by the wall width)
   *   - 130     : horizontal and vertical centre
   * --------------------------------------------------------------------------- */
  return (
    <svg
      viewBox="0 0 260 260"
      className="configurator__floor-plan"
      role="img"
      aria-label={`Floor plan: ${dimensions.areaM2} m\u00B2 garden room, ${config.dimensionLabels.width} x ${config.dimensionLabels.depth}`}
    >
      {/* Outer walls -- colour reflects the selected exterior finish */}
      <rect
        x={20} y={20} width={220} height={220} rx={4}
        fill="none"
        stroke={wallColor}
        strokeWidth={6}
      />

      {/* Inner room area with a light fill */}
      <rect
        x={28} y={28} width={204} height={204} rx={2}
        fill="#f9f8f6"
        stroke="#e0ddd8"
        strokeWidth={1}
      />

      {/* Apertures (windows and doors) rendered on the appropriate walls */}
      {renderApertures()}

      {/*
       * Dimension labels -- positioned just outside the wall strokes.
       * The width label sits beneath the south wall; the depth label
       * is rotated 90 degrees and placed to the right of the east wall.
       */}
      <text
        x={130} y={256}
        textAnchor="middle"
        fontSize={11}
        fill="#888"
        fontFamily="DM Sans, sans-serif"
      >
        {config.dimensionLabels.width}
      </text>
      <text
        x={258} y={130}
        textAnchor="middle"
        fontSize={11}
        fill="#888"
        fontFamily="DM Sans, sans-serif"
        transform="rotate(90, 258, 130)"
      >
        {config.dimensionLabels.depth}
      </text>

      {/* Centre area label showing the total floor area */}
      <text
        x={130} y={136}
        textAnchor="middle"
        fontSize={10}
        fill="#aaa"
        fontFamily="DM Sans, sans-serif"
        fontWeight={500}
      >
        {dimensions.areaM2} m{'\u00B2'}
      </text>
    </svg>
  );
};
