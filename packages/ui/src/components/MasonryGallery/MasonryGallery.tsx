import React from 'react';
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
  return (
    <div className="masonry-gallery-container">
      <div className={`masonry-gallery columns-${columns}`}>
        {images.map((image, index) => (
          <figure key={index} className="masonry-gallery-item">
            <div className="masonry-gallery-icon portrait">
              <a href={image.fullSizeSrc || image.src} data-elementor-open-lightbox="yes">
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
    </div>
  );
};
