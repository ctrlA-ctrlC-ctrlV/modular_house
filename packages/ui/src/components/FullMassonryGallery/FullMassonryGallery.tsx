import React, { useState, useCallback, useEffect } from 'react';
import './FullMassonryGallery.css';

/**
 * Defines the structure for an individual gallery project.
 */
export interface GalleryItem {
  /** The source URL for the preview image. */
  imageUrl: string;
  /** The primary title of the project. */
  title: string;
  /** The classification or industry tag for the project. */
  category: string;
  /** An optional external link for project details. */
  link?: string;
}

/**
 * Configuration properties for the FullMassonryGallery component.
 */
export interface FullMassonryGalleryProps {
  /** The desired total number of items to display. */
  itemCount?: number;
  /** The dataset of items to render. */
  items?: GalleryItem[];
  /** The primary heading text. */
  title?: string;
  /** The descriptive text for the gallery section. */
  description?: string;
}

/**
 * Default dataset used when no items are provided via props.
 * Images are curated with varying aspect ratios to demonstrate masonry behavior.
 */
const defaultItems: GalleryItem[] = [
  { imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80', title: 'Studio Gear', category: 'Photography' },
  { imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', title: 'Mountain Range', category: 'Nature' },
  { imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80', title: 'Forest Path', category: 'Adventure' },
  { imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80', title: 'Alpine Lake', category: 'Travel' },
  { imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80', title: 'Minimalist Framing', category: 'Design' },
  { imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', title: 'Autumn Canopy', category: 'Nature' },
  { imageUrl: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80', title: 'Clockwork', category: 'Lifestyle' },
  { imageUrl: 'https://images.unsplash.com/photo-1493246507139-91e8bef99c02?auto=format&fit=crop&w=800&q=80', title: 'Modern Office', category: 'Design' },
];

/**
 * FullMassonryGallery
 * * Renders a responsive masonry grid based on CSS column-count.
 * Includes a full-screen lightbox modal for high-resolution focus viewing.
 */
export const FullMassonryGallery: React.FC<FullMassonryGalleryProps> = ({
  itemCount = 8,
  items = defaultItems,
  title = "Our Projects",
  description = "We are committed to working with our partners and customers to develop products that make a difference in the world."
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  /**
   * Generates the final array of items based on the requested item count.
   */
  const displayItems: GalleryItem[] = React.useMemo(() => {
    const list = [...items];
    while (list.length < itemCount && items.length > 0) {
      list.push(items[list.length % items.length]);
    }
    return list.slice(0, itemCount);
  }, [items, itemCount]);

  /**
   * Opens the lightbox at a specific index.
   */
  const openLightbox = (index: number): void => {
    setSelectedImageIndex(index);
  };

  /**
   * Closes the active lightbox.
   */
  const closeLightbox = (): void => {
    setSelectedImageIndex(null);
  };

  /**
   * Navigates to the next image in the sequence.
   */
  const nextImage = useCallback((): void => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % displayItems.length);
    }
  }, [selectedImageIndex, displayItems.length]);

  /**
   * Navigates to the previous image in the sequence.
   */
  const prevImage = useCallback((): void => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex - 1 + displayItems.length) % displayItems.length);
    }
  }, [selectedImageIndex, displayItems.length]);

  /**
   * Attaches global keyboard listeners for accessibility and navigation convenience.
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (selectedImageIndex === null) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowRight') nextImage();
      if (event.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, nextImage, prevImage]);

  return (
    <section className="gallery-section">
      {/* Header Container */}
      <div className="gallery-header">
        <h2 className="gallery-heading">{title}</h2>
        <p className="gallery-subtext">{description}</p>
        <div className="gallery-hr-divider"></div>
      </div>

      {/* Masonry Layout Container */}
      <div className="gallery-grid-container">
        <div className="gallery-masonry-grid">
          {displayItems.map((item, index) => (
            <div 
              key={`${item.title}-${index}`} 
              className="gallery-item"
              onClick={() => openLightbox(index)}
            >
              <figure className="gallery-figure">
                <img 
                  className="gallery-image" 
                  src={item.imageUrl} 
                  alt={item.title} 
                  loading="lazy"
                />
                {/*<div className="gallery-overlay">
                  <span className="gallery-item-title">{item.title}</span>
                  <span className="gallery-item-category">{item.category}</span>
                </div>*/}
              </figure>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Focus Mode Overlay */}
      {selectedImageIndex !== null && (
        <div className="gallery-lightbox-overlay" onClick={closeLightbox}>
          <button className="lightbox-btn-close" onClick={closeLightbox}>&times;</button>
          
          <button 
            className="lightbox-btn-nav prev" 
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
          >
            &#10094;
          </button>

          <div className="lightbox-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <img 
              className="lightbox-main-image" 
              src={displayItems[selectedImageIndex].imageUrl} 
              alt={displayItems[selectedImageIndex].title} 
            />
            <div className="lightbox-caption">
              <h4>{displayItems[selectedImageIndex].title}</h4>
              <p>{displayItems[selectedImageIndex].category}</p>
            </div>
          </div>

          <button 
            className="lightbox-btn-nav next" 
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
          >
            &#10095;
          </button>
        </div>
      )}
    </section>
  );
};