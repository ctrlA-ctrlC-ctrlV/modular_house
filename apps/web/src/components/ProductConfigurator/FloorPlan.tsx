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
import type { FloorPlanConfig, ProductDimensions } from '../../types/configurator';


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
   * Computes aperture SVG elements positioned on the correct wall.
   * Each aperture type uses a distinct visual style:
   * - Windows: narrow blue rectangle with a centre divider line
   * - French doors: wider blue rectangle with a dashed swing arc
   * - Sliding doors: wide blue rectangle without arc
   */
  const renderApertures = (): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];

    /* Track placement offsets per wall to handle multiple apertures */
    const wallOffsets: Record<string, number> = {
      north: 0,
      east: 0,
      south: 0,
      west: 0,
    };

    config.apertures.forEach((aperture, index) => {
      const key = `aperture-${index}`;

      /* Calculate the proportional size of the aperture within the SVG */
      const isHorizontalWall = aperture.wall === 'north' || aperture.wall === 'south';
      const wallLengthMm = isHorizontalWall
        ? dimensions.widthM * 1000
        : dimensions.depthM * 1000;
      const proportionalWidth = (aperture.widthMm / wallLengthMm) * 220;

      /* Base offset for centering within the wall */
      const wallCenter = 130;
      const totalAperturesOnWall = config.apertures.filter(
        (a) => a.wall === aperture.wall
      ).length;
      const currentOffset = wallOffsets[aperture.wall];
      wallOffsets[aperture.wall] += 1;

      /* Calculate position along the wall */
      const totalWidth = totalAperturesOnWall * proportionalWidth + (totalAperturesOnWall - 1) * 10;
      const startPos = wallCenter - totalWidth / 2 + currentOffset * (proportionalWidth + 10);

      const isWindow = aperture.type === 'tilt-turn-window' || aperture.type === 'fixed-glazing';
      const isDoor = aperture.type === 'french-door' || aperture.type === 'sliding-door';

      switch (aperture.wall) {
        case 'north':
          elements.push(
            <React.Fragment key={key}>
              <rect
                x={startPos}
                y={17}
                width={proportionalWidth}
                height={6}
                rx={2}
                fill="#89CFF0"
              />
              {isWindow && (
                <line
                  x1={startPos + proportionalWidth / 2}
                  y1={17}
                  x2={startPos + proportionalWidth / 2}
                  y2={23}
                  stroke="#fff"
                  strokeWidth={1}
                />
              )}
            </React.Fragment>
          );
          break;

        case 'east':
          elements.push(
            <React.Fragment key={key}>
              <rect
                x={237}
                y={startPos - 50}
                width={6}
                height={proportionalWidth}
                rx={2}
                fill="#89CFF0"
              />
              {isWindow && (
                <line
                  x1={237}
                  y1={startPos - 50 + proportionalWidth / 2}
                  x2={243}
                  y2={startPos - 50 + proportionalWidth / 2}
                  stroke="#fff"
                  strokeWidth={1}
                />
              )}
              {isDoor && aperture.type === 'french-door' && (
                <path
                  d={`M237 ${startPos - 50} Q${237 - proportionalWidth * 0.6} ${startPos - 50} ${237 - proportionalWidth * 0.6} ${startPos - 50 + proportionalWidth / 2}`}
                  fill="none"
                  stroke="#ccc"
                  strokeWidth={1}
                  strokeDasharray="3,3"
                />
              )}
            </React.Fragment>
          );
          break;

        case 'south':
          elements.push(
            <React.Fragment key={key}>
              <rect
                x={startPos}
                y={237}
                width={proportionalWidth}
                height={6}
                rx={2}
                fill="#89CFF0"
              />
              {isWindow && (
                <line
                  x1={startPos + proportionalWidth / 2}
                  y1={237}
                  x2={startPos + proportionalWidth / 2}
                  y2={243}
                  stroke="#fff"
                  strokeWidth={1}
                />
              )}
            </React.Fragment>
          );
          break;

        case 'west':
          elements.push(
            <React.Fragment key={key}>
              <rect
                x={17}
                y={startPos - 50}
                width={6}
                height={proportionalWidth}
                rx={2}
                fill="#89CFF0"
              />
              {isWindow && (
                <line
                  x1={17}
                  y1={startPos - 50 + proportionalWidth / 2}
                  x2={23}
                  y2={startPos - 50 + proportionalWidth / 2}
                  stroke="#fff"
                  strokeWidth={1}
                />
              )}
            </React.Fragment>
          );
          break;
      }
    });

    return elements;
  };

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

      {/* Dimension labels positioned outside the walls */}
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
