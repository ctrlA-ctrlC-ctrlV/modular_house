import React, { useState, useRef } from 'react';
import './TestimonialGrid.css';

export interface TestimonialItem {
  text: string;
  authorName: string;
  authorLocation: string;
  authorImageSrc: string;
  rating?: number;
}

export interface TestimonialGridProps {
  subTitle?: string;
  title?: string;
  testimonials?: TestimonialItem[];
}

const StarIcon = () => (
  <span className="trx-addons-fb-rev-star">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1792 1792">
      <path d="M1728 647q0 22-26 48l-363 354 86 500q1 7 1 20 0 21-10.5 35.5t-30.5 14.5q-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z"></path>
    </svg>
  </span>
);

export const TestimonialGrid: React.FC<TestimonialGridProps> = ({
  subTitle = "Building trust through our work",
  title = "We deliver quality construction",
  testimonials = [
    {
      text: "Rebar made our dream home a reality. Their team was skilled, reliable, and always kept us informed. We felt supported from start to finish.",
      authorName: "Emily Chen",
      authorLocation: "San Francisco, CA",
      authorImageSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-25.jpg",
      rating: 5
    },
    {
      text: "Our office renovation was seamless. Rebar worked around our schedule and delivered a modern, functional space that exceeded our hopes.",
      authorName: "Carlos Rivera",
      authorLocation: "Los Angeles, CA",
      authorImageSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-24.jpg",
      rating: 5
    },
    {
      text: "We needed structural upgrades and Rebar handled every detail. Their expertise and clear updates made the process stress-free for us.",
      authorName: "Sarah Miller",
      authorLocation: "Austin, TX",
      authorImageSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-23.jpg",
      rating: 5
    },
    {
      text: "Rebar transformed our store with minimal downtime. The results were truly stunning, and our customers absolutely love the new look and feel.",
      authorName: "David Singh",
      authorLocation: "Laketown, CA",
      authorImageSrc: "https://rebar.themerex.net/wp-content/uploads/2025/08/custom-img-22.jpg",
      rating: 5
    }
  ]
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Configuration for "3 items per slide"
  const ITEMS_VISIBLE = 4;
  const GAP_SIZE = 32; // Matches 2rem in CSS

  /**  [TODO]
   * Added the dot to automatic update based on 
   * if (total number - number display) > 0, then added that number of doot where each dot scoll list horizontally to the left by one
   * 1200 px -> 3 items
   * 1024 px -> 2 items
   * 768 px -> 1 items
   */


  // Logic: 
  // If < 3 items, dots = 1.
  // If > 3 items, dots = (Total - 3) + 1. 
  // Example: 4 items total -> 2 dots (Pos 0 and Pos 1).
  const totalDots = Math.max(1, testimonials.length - ITEMS_VISIBLE + 1);

  const scrollToItem = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      // Get the width of a single card dynamically
      const card = container.querySelector('.testimonial-grid__item') as HTMLElement;
      
      if (card) {
        const itemWidth = card.offsetWidth + GAP_SIZE; // Width + Gap
        container.scrollTo({
          left: itemWidth * index,
          behavior: 'smooth'
        });
        setActiveIndex(index);
      }
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const card = container.querySelector('.testimonial-grid__item') as HTMLElement;
      
      if(card) {
        const itemWidth = card.offsetWidth + GAP_SIZE;
        const newIndex = Math.round(container.scrollLeft / itemWidth);
        
        // Clamp index to prevent overshooting dots count
        const clampedIndex = Math.min(newIndex, totalDots - 1);
        
        if (clampedIndex !== activeIndex) {
          setActiveIndex(clampedIndex);
        }
      }
    }
  };

  return (
    <div className="testimonial-grid">
      <div className="testimonial-grid__container">
        <div className="testimonial-grid__header">
          {subTitle && <h6 className="testimonial-grid__subtitle">{subTitle}</h6>}
          {title && <h1 className="testimonial-grid__title">{title}</h1>}
        </div>

        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="testimonial-grid__slider"
        >
          {testimonials.map((item, index) => (
            <div key={index} className="testimonial-grid__item">
              <div className="trx-addons-testimonials-content-wrapper">
                
                {/* 1. Rating */}
                <div className="trx-addons-testimonials__rating-wrapper">
                  <span className="trx-addons-fb-rev-stars">
                    {[...Array(item.rating || 5)].map((_, i) => (
                      <StarIcon key={i} />
                    ))}
                  </span>
                </div>

                {/* 2. Text */}
                <div className="trx-addons-testimonials-text-wrapper">
                  "{item.text}"
                </div>
                
                {/* 3. Author Info */}
                <div className="trx-addons-testimonials__img-info">
                  {/* 
                  {item.authorImageSrc && (
                    <div className="trx-addons-testimonials-img-wrapper">
                      <img 
                        src={item.authorImageSrc} 
                        alt={item.authorName}
                      />
                    </div>
                  )}*/}
                  <div className="trx-addons-testimonials-author-info">
                    <h6 className="trx-addons-testimonials-person-name">
                      {item.authorName}
                    </h6>
                    <p className="trx-addons-testimonials-company">
                      {item.authorLocation}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
        <div className="testimonial-grid__dots">
          {[...Array(totalDots)].map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToItem(index)}
              className={`testimonial-grid__dot ${
                index === activeIndex ? 'testimonial-grid__dot--active' : 'testimonial-grid__dot--inactive'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
};