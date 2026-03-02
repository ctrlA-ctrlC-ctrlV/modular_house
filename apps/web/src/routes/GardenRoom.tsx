import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeroBoldBottomText,
  FullMassonryGallery,
  type LinkRenderer
} from '@modular-house/ui';
import { useHeaderConfig } from '../components/HeaderContext';
import { useEffect } from 'react';

const GardenRoom: React.FC = () => {
  // Configure header for dark variant on hero pages
  const { setHeaderConfig } = useHeaderConfig();
  useEffect(() => {
    setHeaderConfig({ variant: 'dark', positionOver: true });
    
    return () => {
      setHeaderConfig({ variant: 'dark', positionOver: true });
    };
  }, [setHeaderConfig]);

  /** 
   * Custom link renderer to inject React Router's Link component
   * into shared UI components, replacing standard anchor tags.
   */
  const renderLink: LinkRenderer = (props) => {
    const { href, children, className, onClick, ...rest } = props;
    return (
      <Link to={href} className={className} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  };

  return (
    <div className="l-container py-16">
      {/** /garden-room hero Section */}
      <div id='garden_room_hero'>
        <HeroBoldBottomText
          titleLine1 = "Reclaim your quiet comfort in a bespoke outdoor studio."
          titleLine2 = "Precision steel engineering meets architectural elegance."
          ctaText = "Get a Free Quote"
          ctaLink = "/contact"
          backgroundImage = "/resource/garden_room_hero.png"
          backgroundImageWebP="/resource/garden_room_hero.webp"
          backgroundImageAvif="/resource/garden_room_hero.avif"
          bigText = "Garden Room"
          renderLink={renderLink}
        />
      </div>

      <div id='garden_room_gallery'>
        <FullMassonryGallery
          itemCount = {5}
          items = {[
            { imageUrl: '/resource/garden-room/garden-room1.png', imageWebP: '/resource/garden-room/garden-room1.webp', imageAvif: '/resource/garden-room/garden-room1.avif', title: 'Modular House Garden Room 1', category: 'Garden Room' },
            { imageUrl: '/resource/garden-room/garden-room4.png', imageWebP: '/resource/garden-room/garden-room4.webp', imageAvif: '/resource/garden-room/garden-room4.avif', title: 'Modular House Garden Room 2', category: 'Garden Room' },
            { imageUrl: '/resource/garden-room/garden-room2.png', imageWebP: '/resource/garden-room/garden-room2.webp', imageAvif: '/resource/garden-room/garden-room2.avif', title: 'Modular House Garden Room 3', category: 'Garden Room' },
            { imageUrl: '/resource/garden-room/garden-room3.png', imageWebP: '/resource/garden-room/garden-room3.webp', imageAvif: '/resource/garden-room/garden-room3.avif', title: 'Modular House Garden Room 4', category: 'Garden Room' },
            { imageUrl: '/resource/garden-room/garden-room5.png', imageWebP: '/resource/garden-room/garden-room5.webp', imageAvif: '/resource/garden-room/garden-room5.avif', title: 'Modular House Garden Room 5', category: 'Garden Room' },
          ]}
          title = "Garden Room Projects"
          description = "Explore our portfolio of bespoke garden sanctuaries. See how Modular House combines steel-frame precision with architectural design to create high-performance spaces you can enjoy year-round."
        />
      </div>
    </div>
  );
};

export default GardenRoom;
