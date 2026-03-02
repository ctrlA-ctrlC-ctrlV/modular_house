import React, { useState, useEffect, useCallback } from 'react';
import './MasonryGallery.css';
import { OptimizedImage } from '../OptimizedImage/OptimizedImage';

/**
 * GalleryImage
 *
 * Represents a single image entry in the masonry gallery.
 * Optional modern-format source fields (srcWebP / srcAvif) enable the
 * OptimizedImage component to serve the most efficient format the browser
 * supports, while falling back to the original `src` for legacy browsers.
 */
export interface GalleryImage {
  /** Fallback image URL (PNG or JPEG). Always required. */
  src: string;

  /** Descriptive alt text for screen readers. */
  alt?: string;

  /**
   * Intrinsic pixel width.
   * Prevents Cumulative Layout Shift (CLS) by reserving layout space before
   * the thumbnail has downloaded.
   */
  width?: number;

  /**
   * Intrinsic pixel height.
   * Used alongside width for CLS prevention.
   */
  height?: number;

  /**
   * URL of the full-size image opened in the lightbox.
   * Intentionally separate from `src` so the gallery can display compressed
   * thumbnails while the lightbox shows the full-resolution original.
   */
  fullSizeSrc?: string;

  /**
   * WebP version of the thumbnail for modern browsers.
   * Typically 30 % smaller than the JPEG/PNG equivalent.
   */
  srcWebP?: string;

  /**
   * AVIF version of the thumbnail for cutting-edge browsers.
   * Typically 50+ % smaller than JPEG.
   */
  srcAvif?: string;
}

export interface MasonryGalleryProps {
  images?: GalleryImage[];
  columns?: number;
}

export const MasonryGallery: React.FC<MasonryGalleryProps> = ({
  images = [
    { src: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-293.jpg", fullSizeSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-293.jpg" },
    { src: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-291.jpg", fullSizeSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-291.jpg" },
    { src: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-289.jpg", fullSizeSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-289.jpg" },
    { src: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-295.jpg", fullSizeSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-295.jpg" },
    { src: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-292.jpg", fullSizeSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-292.jpg" },
    { src: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-290.jpg", fullSizeSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-290.jpg" },
    { src: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-288.jpg", fullSizeSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-288.jpg" },
    { src: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-294.jpg", fullSizeSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-294.jpg" },
  ],
  columns = 4
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, nextImage, prevImage]);

  return (
    <div className="masonry-gallery-container">
      <div className={`masonry-gallery columns-${columns}`}>
        {images.map((image, index) => (
          <figure key={index} className="masonry-gallery-item">
            <div className="masonry-gallery-icon portrait">
              <a 
                href={image.fullSizeSrc || image.src} 
                onClick={(e) => openLightbox(index, e)}
                className="masonry-gallery-link"
              >
                {/*
                 * Thumbnail image rendered via OptimizedImage to benefit from:
                 * - AVIF / WebP format negotiation via <picture> + <source>
                 * - Native lazy loading — defers off-screen thumbnail fetches
                 * - CLS prevention via explicit width / height when provided
                 *
                 * sizes="(max-width: 1024px) 50vw, 25vw" maps to the CSS grid:
                 * 2 columns below 1024 px → each image is ~50 vw wide.
                 * 4 columns above 1024 px → each image is ~25 vw wide.
                 */}
                <OptimizedImage
                  src={image.src}
                  alt={image.alt ?? ""}
                  srcSetAvif={image.srcAvif}
                  srcSetWebP={image.srcWebP}
                  width={image.width}
                  height={image.height}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </a>
            </div>
          </figure>
        ))}
      </div>

      {lightboxOpen && (
        <div className="masonry-lightbox-overlay" onClick={closeLightbox}>
          <div className="masonry-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="masonry-lightbox-close" onClick={closeLightbox} aria-label="Close">
              &times;
            </button>
            
            <button className="masonry-lightbox-prev" onClick={prevImage} aria-label="Previous">
              &#10094;
            </button>
            
            <div className="masonry-lightbox-image-container">
              <img 
                src={images[currentIndex].fullSizeSrc || images[currentIndex].src} 
                alt={images[currentIndex].alt || ""} 
                className="masonry-lightbox-image"
              />
            </div>

            <button className="masonry-lightbox-next" onClick={nextImage} aria-label="Next">
              &#10095;
            </button>
            
            <div className="masonry-lightbox-counter">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
