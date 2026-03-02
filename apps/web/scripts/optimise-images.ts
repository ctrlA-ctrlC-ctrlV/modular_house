/**
 * optimise-images.ts
 * =============================================================================
 * Offline image optimisation script.
 *
 * Scans every PNG/JPG under apps/web/public/resource/, generates a .webp and
 * an .avif sibling for each source file, then prints a summary.
 *
 * Idempotent: if the output file already exists AND its mtime is newer than the
 * source file, the conversion is skipped to avoid redundant re-processing.
 *
 * Usage:
 *   pnpm --filter @modular-house/web optimise:images
 *   # or directly:
 *   tsx scripts/optimise-images.ts
 * =============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/* -------------------------------------------------------------------------- */
/* Resolve directory paths                                                     */
/* -------------------------------------------------------------------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Root of the apps/web package */
const webRoot = path.resolve(__dirname, '..');

/** Directory that holds all local image assets */
const resourceDir = path.join(webRoot, 'public', 'resource');

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

interface ConversionResult {
  source: string;
  format: 'webp' | 'avif';
  output: string;
  skipped: boolean;
  /** Bytes saved compared to the source file (0 when skipped) */
  bytesSaved: number;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Recursively collect all PNG/JPG/JPEG files under `dir`.
 */
function collectImages(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectImages(fullPath));
    } else if (/\.(png|jpe?g)$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Returns true if the output file exists and is at least as new as the source.
 */
function isUpToDate(sourcePath: string, outputPath: string): boolean {
  if (!fs.existsSync(outputPath)) return false;
  const sourceMtime = fs.statSync(sourcePath).mtimeMs;
  const outputMtime = fs.statSync(outputPath).mtimeMs;
  return outputMtime >= sourceMtime;
}

/**
 * Convert a single source image to one target format.
 * Skips the conversion when the output is already up to date.
 */
async function convertImage(
  sourcePath: string,
  format: 'webp' | 'avif',
): Promise<ConversionResult> {
  const ext = path.extname(sourcePath);
  const stem = sourcePath.slice(0, -ext.length);
  const outputPath = `${stem}.${format}`;

  if (isUpToDate(sourcePath, outputPath)) {
    return { source: sourcePath, format, output: outputPath, skipped: true, bytesSaved: 0 };
  }

  const instance = sharp(sourcePath);

  if (format === 'webp') {
    await instance.webp({ quality: 82 }).toFile(outputPath);
  } else {
    await instance.avif({ quality: 60 }).toFile(outputPath);
  }

  const sourceSize = fs.statSync(sourcePath).size;
  const outputSize = fs.statSync(outputPath).size;
  const bytesSaved = Math.max(0, sourceSize - outputSize);

  return { source: sourcePath, format, output: outputPath, skipped: false, bytesSaved };
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */

async function main(): Promise<void> {
  const sources = collectImages(resourceDir);

  if (sources.length === 0) {
    console.log('No PNG/JPG images found under public/resource/');
    return;
  }

  console.log(`Found ${sources.length} source image(s) under public/resource/\n`);

  // Kick off all conversions (webp + avif) in parallel
  const tasks = sources.flatMap((src) => [
    convertImage(src, 'webp'),
    convertImage(src, 'avif'),
  ]);

  const results = await Promise.all(tasks);

  // Print per-file summary
  for (const r of results) {
    const rel = path.relative(resourceDir, r.output);
    if (r.skipped) {
      console.log(`  SKIP  ${rel}  (up to date)`);
    } else {
      const saved = (r.bytesSaved / 1024).toFixed(1);
      console.log(`  OK    ${rel}  (saved ${saved} KB)`);
    }
  }

  // Aggregate totals
  const processed = results.filter((r) => !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;
  const totalSaved = results.reduce((acc, r) => acc + r.bytesSaved, 0);

  console.log(`\nDone.`);
  console.log(`  Converted : ${processed}`);
  console.log(`  Skipped   : ${skipped}`);
  console.log(`  Total saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((err: unknown) => {
  console.error('optimise-images failed:', err);
  process.exit(1);
});
