/**
 * InfiniteMasonryGallery Component
 * =============================================================================
 *
 * PURPOSE:
 * A horizontally-scrolling infinite masonry gallery with momentum-based drag,
 * mouse-wheel support, and a full-screen lightbox. Images are arranged in a
 * masonry layout (portrait images span two rows, landscape images are paired
 * vertically) and the strip repeats infinitely in both directions.
 *
 * ARCHITECTURE:
 * - Fully data-driven via props — the consumer supplies images and options.
 * - Uses a virtual-scroll approach: a single `offset` value is the source of
 *   truth; columns are absolutely positioned with `transform: translateX()`.
 * - Only columns within the viewport ± buffer are rendered (windowed).
 * - BEM-style CSS in InfiniteMasonryGallery.css.
 * - Responsive: adapts row height / gap for smaller viewports.
 *
 * =============================================================================
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './InfiniteMasonryGallery.css';
import { OptimizedImage } from '../OptimizedImage/OptimizedImage';

/* =============================================================================
   TYPE DEFINITIONS
   ============================================================================= */

/** A single image entry in the infinite gallery. */
export interface InfiniteGalleryImage {
  /** Unique key for the image. */
  id: string | number;
  /** Fallback image URL (PNG / JPEG). Always required. */
  src: string;
  /** Descriptive alt text for screen readers. */
  alt?: string;
  /** Image orientation — drives the masonry layout algorithm. */
  orientation: 'landscape' | 'portrait';
  /** URL of the full-size image for the lightbox (falls back to `src`). */
  fullSizeSrc?: string;
  /** WebP source for optimised loading. */
  srcWebP?: string;
  /** AVIF source for optimised loading. */
  srcAvif?: string;
}

/** Props for the InfiniteMasonryGallery component. */
export interface InfiniteMasonryGalleryProps {
  /** Array of images to display. */
  images: InfiniteGalleryImage[];
  /** Height of a single row in pixels. @default 220 */
  rowHeight?: number;
  /** Gap between items in pixels. @default 6 */
  gap?: number;
  /** Extra pixels to render off-screen for smooth scrolling. @default 200 */
  buffer?: number;
  /** Section title displayed above the gallery. */
  title?: string;
  /** Eyebrow text displayed above the title. */
  eyebrow?: string;
  /** Friction coefficient for momentum (0–1, lower = stops faster). @default 0.95 */
  friction?: number;
  /** Whether to show the lightbox on click. @default true */
  lightbox?: boolean;
  /** Optional className for the outermost wrapper. */
  className?: string;
}

/* =============================================================================
   LAYOUT ALGORITHM
   ============================================================================= */

interface PortraitColumn {
  id: string;
  type: 'portrait';
  image: InfiniteGalleryImage;
  width: number;
  height: number;
}

interface PairColumn {
  id: string;
  type: 'pair';
  top: InfiniteGalleryImage;
  bottom: InfiniteGalleryImage | null;
  width: number;
  height: number;
}

type GalleryColumn = PortraitColumn | PairColumn;

/**
 * Builds an array of columns from the flat image list.
 * Portrait images get a single tall column; landscape images are paired
 * vertically using a greedy lookahead.
 */
function buildColumns(
  images: InfiniteGalleryImage[],
  rowHeight: number,
  gap: number,
): GalleryColumn[] {
  const columns: GalleryColumn[] = [];
  const used = new Set<number>();

  const findNextLandscape = (from: number): number => {
    for (let j = from; j < images.length; j++) {
      if (!used.has(j) && images[j].orientation === 'landscape') return j;
    }
    return -1;
  };

  let i = 0;
  while (i < images.length) {
    if (used.has(i)) {
      i++;
      continue;
    }

    const img = images[i];

    if (img.orientation === 'portrait') {
      const h = rowHeight * 2 + gap;
      const w = Math.round(h * 0.55);
      columns.push({ id: `col-${img.id}`, type: 'portrait', image: img, width: w, height: h });
      used.add(i);
    } else {
      used.add(i);
      const pairIdx = findNextLandscape(i + 1);
      const w = Math.round(rowHeight * 1.5);

      if (pairIdx !== -1) {
        const partner = images[pairIdx];
        used.add(pairIdx);
        columns.push({
          id: `col-${img.id}-${partner.id}`,
          type: 'pair',
          top: img,
          bottom: partner,
          width: w,
          height: rowHeight,
        });
      } else {
        columns.push({
          id: `col-${img.id}`,
          type: 'pair',
          top: img,
          bottom: null,
          width: w,
          height: rowHeight,
        });
      }
    }
    i++;
  }
  return columns;
}

/* =============================================================================
   SUB-COMPONENTS
   ============================================================================= */

/** Full-screen lightbox overlay. */
function Lightbox({
  image,
  onClose,
  onNext,
  onPrev,
}: {
  image: InfiniteGalleryImage;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onNext, onPrev]);

  return (
    <div
      className="img-lightbox-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      <button className="img-lightbox-prev" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="Previous image">
        &#10094;
      </button>

      <div className="img-lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img
          src={image.fullSizeSrc ?? image.src}
          alt={image.alt ?? ''}
          className="img-lightbox-image"
        />
      </div>

      <button className="img-lightbox-next" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="Next image">
        &#10095;
      </button>

      <div className="img-lightbox-hint">ESC</div>
    </div>
  );
}

/** Single column renderer — handles both portrait and pair layouts. */
function ColumnElement({
  col,
  gap,
  onClick,
  style,
}: {
  col: GalleryColumn;
  gap: number;
  onClick: (image: InfiniteGalleryImage) => void;
  style: React.CSSProperties;
}) {
  if (col.type === 'portrait') {
    return (
      <div
        className="img-gallery-item"
        style={{ ...style, width: col.width, height: col.height }}
        onClick={() => onClick(col.image)}
      >
        <OptimizedImage
          src={col.image.src}
          alt={col.image.alt ?? ''}
          srcSetWebP={col.image.srcWebP}
          srcSetAvif={col.image.srcAvif}
          sizes={`${col.width}px`}
        />
      </div>
    );
  }

  return (
    <div style={{ ...style, display: 'flex', flexDirection: 'column', gap }}>
      <div
        className="img-gallery-item"
        style={{ width: col.width, height: col.height }}
        onClick={() => onClick(col.top)}
      >
        <OptimizedImage
          src={col.top.src}
          alt={col.top.alt ?? ''}
          srcSetWebP={col.top.srcWebP}
          srcSetAvif={col.top.srcAvif}
          sizes={`${col.width}px`}
        />
      </div>
      {col.bottom != null && (
        <div
          className="img-gallery-item"
          style={{ width: col.width, height: col.height }}
          onClick={() => { onClick(col.bottom as InfiniteGalleryImage); }}
        >
          <OptimizedImage
            src={col.bottom.src}
            alt={col.bottom.alt ?? ''}
            srcSetWebP={col.bottom.srcWebP}
            srcSetAvif={col.bottom.srcAvif}
            sizes={`${col.width}px`}
          />
        </div>
      )}
    </div>
  );
}

/* =============================================================================
   MAIN COMPONENT
   ============================================================================= */

export const InfiniteMasonryGallery: React.FC<InfiniteMasonryGalleryProps> = ({
  images,
  rowHeight = 220,
  gap = 6,
  buffer = 200,
  title,
  eyebrow,
  friction = 0.95,
  lightbox: enableLightbox = true,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeImg, setActiveImg] = useState<InfiniteGalleryImage | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Virtual scroll offset — positive = scrolled right
  const offsetRef = useRef(0);
  const [, forceRender] = useState(0);
  const rafId = useRef<number | null>(null);

  // Momentum / inertia
  const velocityRef = useRef(0);
  const momentumRaf = useRef<number | null>(null);

  // Drag state
  const dragRef = useRef({
    active: false,
    startX: 0,
    startOffset: 0,
    moved: false,
    lastX: 0,
    lastTime: 0,
  });

  /* ── Pre-compute column layout ── */
  const columns = useMemo(() => buildColumns(images, rowHeight, gap), [images, rowHeight, gap]);

  const colPositions = useMemo(() => {
    const positions: number[] = [];
    let acc = 0;
    for (const col of columns) {
      positions.push(acc);
      acc += col.width + gap;
    }
    return positions;
  }, [columns, gap]);

  const cycleWidth = useMemo(() => {
    let total = 0;
    for (const col of columns) {
      total += col.width + gap;
    }
    return total;
  }, [columns, gap]);

  /* ── Collect all images in render order for lightbox navigation ── */
  const allImages = useMemo(() => {
    const list: InfiniteGalleryImage[] = [];
    for (const col of columns) {
      if (col.type === 'portrait') {
        list.push(col.image);
      } else {
        list.push(col.top);
        if (col.bottom) list.push(col.bottom);
      }
    }
    return list;
  }, [columns]);

  /* ── Measure container ── */
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  /* ── Single render per frame ── */
  const scheduleRender = useCallback(() => {
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      forceRender((n) => n + 1);
    });
  }, []);

  /* ── Apply offset delta ── */
  const applyDelta = useCallback(
    (dx: number) => {
      if (cycleWidth === 0) return;
      offsetRef.current += dx;
      offsetRef.current = ((offsetRef.current % cycleWidth) + cycleWidth) % cycleWidth;
      scheduleRender();
    },
    [cycleWidth, scheduleRender],
  );

  /* ── Momentum loop ── */
  const startMomentum = useCallback(() => {
    const MIN_VELOCITY = 0.3;

    const tick = () => {
      if (Math.abs(velocityRef.current) < MIN_VELOCITY) {
        velocityRef.current = 0;
        momentumRaf.current = null;
        return;
      }
      applyDelta(velocityRef.current);
      velocityRef.current *= friction;
      momentumRaf.current = requestAnimationFrame(tick);
    };
    if (momentumRaf.current) cancelAnimationFrame(momentumRaf.current);
    momentumRaf.current = requestAnimationFrame(tick);
  }, [applyDelta, friction]);

  const stopMomentum = useCallback(() => {
    velocityRef.current = 0;
    if (momentumRaf.current) {
      cancelAnimationFrame(momentumRaf.current);
      momentumRaf.current = null;
    }
  }, []);

  /* ── Wheel handler ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      e.preventDefault();
      stopMomentum();
      applyDelta(dx);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [applyDelta, stopMomentum]);

  /* ── Pointer / drag handlers ── */
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      stopMomentum();
      const d = dragRef.current;
      d.active = true;
      d.startX = e.clientX;
      d.startOffset = offsetRef.current;
      d.moved = false;
      d.lastX = e.clientX;
      d.lastTime = performance.now();
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [stopMomentum],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d.active) return;
      e.preventDefault();
      const dx = d.lastX - e.clientX;
      const now = performance.now();
      const dt = now - d.lastTime;

      if (Math.abs(e.clientX - d.startX) > 4) d.moved = true;

      if (dt > 0) {
        velocityRef.current = (dx / Math.max(dt, 1)) * 16;
      }

      d.lastX = e.clientX;
      d.lastTime = now;
      applyDelta(dx);
    },
    [applyDelta],
  );

  const onPointerUp = useCallback(() => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    if (Math.abs(velocityRef.current) > 1) {
      startMomentum();
    }
  }, [startMomentum]);

  const handleClick = useCallback(
    (img: InfiniteGalleryImage) => {
      if (!dragRef.current.moved && enableLightbox) setActiveImg(img);
    },
    [enableLightbox],
  );

  /* ── Lightbox navigation ── */
  const lightboxNext = useCallback(() => {
    setActiveImg((prev) => {
      if (!prev) return prev;
      const idx = allImages.findIndex((i) => i.id === prev.id);
      return allImages[(idx + 1) % allImages.length];
    });
  }, [allImages]);

  const lightboxPrev = useCallback(() => {
    setActiveImg((prev) => {
      if (!prev) return prev;
      const idx = allImages.findIndex((i) => i.id === prev.id);
      return allImages[(idx - 1 + allImages.length) % allImages.length];
    });
  }, [allImages]);

  /* ── Cleanup ── */
  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (momentumRaf.current) cancelAnimationFrame(momentumRaf.current);
    };
  }, []);

  /* ── Compute visible columns ── */
  const offset = offsetRef.current;
  const viewStart = offset - buffer;
  const viewEnd = offset + containerWidth + buffer;

  const visibleColumns: { col: GalleryColumn; x: number; key: string }[] = [];

  if (cycleWidth > 0) {
    const cycleStart = Math.floor(viewStart / cycleWidth);
    const cycleEnd = Math.floor(viewEnd / cycleWidth);

    for (let cycle = cycleStart; cycle <= cycleEnd; cycle++) {
      const cycleOffset = cycle * cycleWidth;
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const x = cycleOffset + colPositions[i];
        const colRight = x + col.width;

        if (colRight >= viewStart && x <= viewEnd) {
          visibleColumns.push({
            col,
            x: x - offset,
            key: `${cycle}_${i}`,
          });
        }
      }
    }
  }

  const trackHeight = rowHeight * 2 + gap;

  return (
    <section
      className={`img-gallery${className ? ` ${className}` : ''}`}
      aria-label={title ?? 'Image gallery'}
    >
      {/* Header */}
      {(eyebrow || title) && (
        <div className="img-gallery__header">
          {eyebrow && <span className="img-gallery__eyebrow">{eyebrow}</span>}
          {title && <h2 className="img-gallery__title">{title}</h2>}
          <div className="img-gallery__divider" />
        </div>
      )}

      {/* Infinite horizontal track */}
      <div className="img-gallery__track-wrapper">
        {/* Edge fades */}
        <div className="img-gallery__edge-fade img-gallery__edge-fade--left" />
        <div className="img-gallery__edge-fade img-gallery__edge-fade--right" />

        <div
          ref={containerRef}
          className="img-gallery__track"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            height: trackHeight,
            cursor: dragRef.current.active ? 'grabbing' : 'grab',
          }}
        >
          {visibleColumns.map(({ col, x, key }) => (
            <ColumnElement
              key={key}
              col={col}
              gap={gap}
              onClick={handleClick}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `translateX(${x}px)`,
                willChange: 'transform',
              }}
            />
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div className="img-gallery__footer">
        <svg width="28" height="10" viewBox="0 0 28 10" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
          <line x1="6" y1="5" x2="22" y2="5" strokeDasharray="1.5 2" opacity="0.5" />
          <polyline points="3,1 0,5 3,9" />
          <polyline points="25,1 28,5 25,9" />
        </svg>
        <span>DRAG OR SCROLL</span>
      </div>

      {/* Lightbox */}
      {activeImg && (
        <Lightbox
          image={activeImg}
          onClose={() => setActiveImg(null)}
          onNext={lightboxNext}
          onPrev={lightboxPrev}
        />
      )}
    </section>
  );
};
