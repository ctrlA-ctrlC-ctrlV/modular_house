import React, { useState, useEffect, useCallback } from 'react';
import './MasonryGallery.css';

export interface GalleryImage {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  fullSizeSrc?: string;
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
                <img
                  loading="lazy"
                  decoding="async"
                  src={image.src}
                  alt={image.alt || ""}
                  width={image.width}
                  height={image.height}
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
