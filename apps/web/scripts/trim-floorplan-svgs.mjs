/**
 * trim-floorplan-svgs.mjs -- SVG Floor Plan Whitespace Removal Script
 * =============================================================================
 *
 * PURPOSE:
 * Processes all SVG floor plan files in the public/resource/floorplan/
 * directory and recalculates each SVG's viewBox attribute to eliminate
 * surrounding whitespace. The design team's floor plan SVGs are exported
 * with an A4-sized canvas (e.g., 842 x 595), but the actual drawing
 * content only occupies a sub-region defined by internal clip paths.
 * This script computes the tight content bounding box from those clip
 * paths and updates the viewBox to match, effectively cropping out all
 * dead space.
 *
 * SUPPORTED FORMATS:
 * 1. Standard export format (majority of files):
 *    - viewBox: "0 0 842 595"
 *    - Clip paths use a shared affine transform
 *      (e.g., matrix(.12, 0, 0, -.12, 14, 547)).
 *    - The script extracts the clip path rectangle and the transform
 *      coefficients, then projects the rectangle corners into SVG
 *      viewport coordinates.
 *
 * 2. Inkscape export format (e.g., 7.5m x 6m.svg):
 *    - Uses clipPathUnits="userSpaceOnUse", meaning the clip path
 *      coordinates are already in the SVG user coordinate space.
 *    - The script intersects the clip path bounds with the existing
 *      viewport dimensions to determine the effective visible area.
 *
 * USAGE:
 *   node apps/web/scripts/trim-floorplan-svgs.mjs
 *
 * The script is idempotent -- running it multiple times on already-trimmed
 * files has no adverse effect, as the viewBox will simply be re-set to
 * the same computed value.
 *
 * =============================================================================
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

/** Directory containing the floor plan SVGs relative to this script. */
const FLOORPLAN_DIR = join(
  import.meta.dirname,
  '..',
  'public',
  'resource',
  'floorplan',
);

/**
 * Parses a rectangular clip path definition in the format:
 *   M x1 y1 H x2 V y2 H x1 V y1
 * where H/V are absolute horizontal/vertical line-to commands.
 *
 * @param pathData - The value of the clip path's "d" attribute.
 * @returns An object with { x1, y1, x2, y2 } representing the
 *          bounding rectangle corners, or null if parsing fails.
 */
function parseClipRect(pathData) {
  /* Normalise whitespace and commas for consistent tokenisation. */
  const normalised = pathData.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();

  /*
   * Match the rectangular move-horizontal-vertical-horizontal-vertical
   * pattern that all floor plan clip paths follow.
   * Capture groups: x1, y1, x2, y2
   */
  const rectPattern =
    /M\s*(-?[\d.]+)\s+(-?[\d.]+)\s*H\s*(-?[\d.]+)\s*V\s*(-?[\d.]+)/i;
  const match = normalised.match(rectPattern);
  if (!match) return null;

  return {
    x1: parseFloat(match[1]),
    y1: parseFloat(match[2]),
    x2: parseFloat(match[3]),
    y2: parseFloat(match[4]),
  };
}

/**
 * Parses an SVG matrix transform string of the form:
 *   matrix(a, b, c, d, e, f)
 * and returns the six coefficients as an object.
 *
 * @param transformAttr - The value of the "transform" attribute.
 * @returns An object { a, b, c, d, e, f } or null if parsing fails.
 */
function parseMatrixTransform(transformAttr) {
  const matrixPattern =
    /matrix\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/;
  const match = transformAttr.match(matrixPattern);
  if (!match) return null;

  return {
    a: parseFloat(match[1]),
    b: parseFloat(match[2]),
    c: parseFloat(match[3]),
    d: parseFloat(match[4]),
    e: parseFloat(match[5]),
    f: parseFloat(match[6]),
  };
}

/**
 * Computes the tight viewBox for a standard-format SVG.
 *
 * Standard-format SVGs use clip paths with an affine transform applied
 * to the clip path's child <path> element. The clip rectangle coordinates
 * are in the source (untransformed) space; projecting them through the
 * matrix yields the actual SVG viewport coordinates.
 *
 * Transform model:
 *   x_svg = a * x_src + e
 *   y_svg = d * y_src + f
 * (b and c are zero for all floor plan transforms)
 *
 * @param clipRect - The parsed clip rectangle in source coordinates.
 * @param matrix   - The parsed affine transform coefficients.
 * @returns A viewBox string "minX minY width height".
 */
function computeStandardViewBox(clipRect, matrix) {
  const { x1, y1, x2, y2 } = clipRect;
  const { a, d, e, f } = matrix;

  /* Project the four corners of the clip rectangle through the affine
     transform. Because d is negative (y-axis flip), the min/max y values
     swap after projection. */
  const svgX1 = a * x1 + e;
  const svgX2 = a * x2 + e;
  const svgY1 = d * y2 + f;
  const svgY2 = d * y1 + f;

  /* Ensure correct ordering regardless of axis direction. */
  const minX = Math.min(svgX1, svgX2);
  const minY = Math.min(svgY1, svgY2);
  const width = Math.abs(svgX2 - svgX1);
  const height = Math.abs(svgY2 - svgY1);

  return `${round(minX)} ${round(minY)} ${round(width)} ${round(height)}`;
}

/**
 * Computes the tight viewBox for an Inkscape-format SVG.
 *
 * Inkscape-format SVGs use clipPathUnits="userSpaceOnUse", meaning the
 * clip path coordinates are already expressed in the SVG's user coordinate
 * system. The effective visible area is the intersection of the clip
 * rectangle with the SVG viewport (defined by the original viewBox or
 * width/height attributes).
 *
 * @param clipRect    - The parsed clip rectangle in user coordinates.
 * @param viewBoxRect - The original viewport dimensions { x, y, w, h }.
 * @returns A viewBox string "minX minY width height".
 */
function computeInkscapeViewBox(clipRect, viewBoxRect) {
  const { x1, y1, x2, y2 } = clipRect;

  /* Intersect the clip rectangle with the viewport bounds. */
  const minX = Math.max(x1, viewBoxRect.x);
  const minY = Math.max(y1, viewBoxRect.y);
  const maxX = Math.min(x2, viewBoxRect.x + viewBoxRect.w);
  const maxY = Math.min(y2, viewBoxRect.y + viewBoxRect.h);

  return `${round(minX)} ${round(minY)} ${round(maxX - minX)} ${round(maxY - minY)}`;
}

/**
 * Rounds a number to two decimal places, removing trailing zeros.
 *
 * @param n - The number to round.
 * @returns The rounded number.
 */
function round(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Parses the existing viewBox attribute from an SVG string.
 *
 * @param svg - The raw SVG file content.
 * @returns An object { x, y, w, h } or null on failure.
 */
function parseViewBox(svg) {
  const match = svg.match(/viewBox\s*=\s*"([^"]+)"/);
  if (!match) return null;
  const parts = match[1].trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4) return null;
  return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
}

/**
 * Detects whether an SVG uses the Inkscape export format.
 * Inkscape SVGs are identified by the presence of
 * clipPathUnits="userSpaceOnUse" in the clip path definitions.
 *
 * @param svg - The raw SVG file content.
 * @returns True if the SVG uses Inkscape-style clip paths.
 */
function isInkscapeFormat(svg) {
  return svg.includes('clipPathUnits="userSpaceOnUse"');
}

/**
 * Processes a single SVG file: parses its clip paths, computes the
 * tight content bounding box, and rewrites the viewBox attribute.
 * Also removes explicit width/height attributes so the SVG scales
 * proportionally within its container using the viewBox aspect ratio.
 *
 * @param filePath - Absolute path to the SVG file.
 */
async function processSvg(filePath) {
  const svg = await readFile(filePath, 'utf-8');

  /* Extract the first clip path's <path> data. Both format types define
     clip paths with rectangular path data. The first clip path is
     representative since all clip paths in a floor plan SVG share
     the same rectangle. */
  const clipPathMatch = svg.match(/<clipPath[^>]*>[\s\S]*?<path[^>]*?\bd="([^"]+)"[^>]*/);
  if (!clipPathMatch) {
    console.log(`  SKIP (no clip path found): ${filePath}`);
    return;
  }

  const pathData = clipPathMatch[1];
  const clipRect = parseClipRect(pathData);
  if (!clipRect) {
    console.log(`  SKIP (unparsable clip rect): ${filePath}`);
    return;
  }

  let newViewBox;

  if (isInkscapeFormat(svg)) {
    /* Inkscape format: clip path coordinates are in user space.
       Intersect with the current viewport to get the visible area. */
    const viewBoxRect = parseViewBox(svg);
    if (!viewBoxRect) {
      console.log(`  SKIP (no viewBox): ${filePath}`);
      return;
    }
    newViewBox = computeInkscapeViewBox(clipRect, viewBoxRect);
  } else {
    /* Standard format: extract the affine transform applied to the
       clip path's child <path> element. */
    const transformMatch = clipPathMatch[0].match(/transform="([^"]+)"/);
    if (!transformMatch) {
      console.log(`  SKIP (no transform on clip path): ${filePath}`);
      return;
    }
    const matrix = parseMatrixTransform(transformMatch[1]);
    if (!matrix) {
      console.log(`  SKIP (unparsable matrix): ${filePath}`);
      return;
    }
    newViewBox = computeStandardViewBox(clipRect, matrix);
  }

  /* Replace the viewBox attribute value with the computed tight bounds. */
  let updatedSvg = svg.replace(
    /viewBox\s*=\s*"[^"]+"/,
    `viewBox="${newViewBox}"`,
  );

  /* Remove explicit width and height attributes from the root <svg>
     element so the SVG scales to fill its container using the viewBox
     aspect ratio. The CSS class .configurator__floor-plan-image already
     applies width: 100% and height: auto for responsive sizing. */
  updatedSvg = updatedSvg.replace(
    /(<svg[\s\S]*?)(\s+width="[^"]*")/,
    '$1',
  );
  updatedSvg = updatedSvg.replace(
    /(<svg[\s\S]*?)(\s+height="[^"]*")/,
    '$1',
  );

  await writeFile(filePath, updatedSvg, 'utf-8');
  console.log(`  OK: ${filePath}`);
  console.log(`      viewBox="${newViewBox}"`);
}


/* =============================================================================
   Main Execution
   ============================================================================= */

console.log('Trimming floor plan SVG viewBox whitespace...\n');

const files = await readdir(FLOORPLAN_DIR);
const svgFiles = files.filter((f) => extname(f).toLowerCase() === '.svg');

console.log(`Found ${svgFiles.length} SVG file(s) in ${FLOORPLAN_DIR}\n`);

for (const file of svgFiles) {
  await processSvg(join(FLOORPLAN_DIR, file));
}

console.log('\nDone.');
