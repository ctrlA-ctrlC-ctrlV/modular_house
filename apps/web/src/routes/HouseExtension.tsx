import React from 'react';
import { Seo } from '@modular-house/ui';
import { HeroBoldBottomText } from '@modular-house/ui';
import { FullMassonryGallery } from '@modular-house/ui';
import { useHeaderConfig } from '../components/HeaderContext';
import { useEffect } from 'react';

const HouseExtension: React.FC = () => {
  // Configure header for dark variant on hero pages
  const { setHeaderConfig } = useHeaderConfig();
  useEffect(() => {
    setHeaderConfig({ variant: 'dark', positionOver: true });
    
    return () => {
      setHeaderConfig({ variant: 'dark', positionOver: true });
    };
  }, [setHeaderConfig]);

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Modular House Construction',
    url: 'https://www.modularhouse.ie',
    logo: 'https://www.modularhouse.ie/logo_black.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+3530830280000',
      contactType: 'Customer Service'
    }
  };

  return (
    <div className="l-container py-16">
      <Seo 
        title="Modern Steel Frame House Extensions" 
        description="Expand your home with a precision-engineered steel frame extension. Built faster and cleaner than traditional methods with superior thermal performance."
        canonicalUrl="https://modularhouse.ie/house-extension"

        // Open Graph for Facebook/LinkedIn sharing optimization
        openGraph={{
          type: 'website',
          title: 'Seamless Steel Frame House Extensions | Seamless House Extension',
          description: 'Transform your home with a high-performance extension. Our steel frame technology ensures a faster build with less disruption and A-rated efficiency.',
          image: 'https://modularhouse.ie/resource/landing_hero.png',
          siteName: 'Modular House Construction',
        }}

        // Twitter Card optimization
        twitter={{
          cardType: 'summary_large_image',
          site: '@ModularHouse',
          title: 'The Future of Home Extensions: Faster, Stronger, Smarter',
          image: 'https://modularhouse.ie/resource/landing_hero.png',
        }}

        // Rich Snippets data
        jsonLd={organizationSchema}
      />

      {/** /garden-room hero Section */}
      <div id='garden_room_hero'>
        <HeroBoldBottomText 
          titleLine1 = "Expand your living space with a seamless home extension."
          titleLine2 = "Expertly designed for light, space, and modern family life."
          ctaText = "Get a Free Quote"
          ctaLink = "#"
          backgroundImage = "https://rebar.themerex.net/wp-content/uploads/2025/08/background-06.jpg"
          bigText = "House Extension"
        />
      </div>

      <div id='house_extension_gallery'>
        <FullMassonryGallery
          itemCount = {15}
          items = {[
            { imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', title: 'Modern Glass Extension', category: 'Architecture' },
            { imageUrl: 'https://images.unsplash.com/photo-1600607687940-4720033095c5?auto=format&fit=crop&w=800&q=80', title: 'Contemporary Side Return', category: 'Residential' },
            { imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0bb2a6c3e?auto=format&fit=crop&w=800&q=80', title: 'Kitchen Extension Hub', category: 'Interior' },
            { imageUrl: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=800&q=80', title: 'Minimalist Zinc Addition', category: 'Design' },
            { imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', title: 'Luxury Garden Suite', category: 'Exterior' },
            { imageUrl: 'https://images.unsplash.com/photo-1513584684374-8bdb7483fe8f?auto=format&fit=crop&w=800&q=80', title: 'Brickwork Continuity', category: 'Architecture' },
            { imageUrl: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=800&q=80', title: 'Open Plan Living', category: 'Lifestyle' },
            { imageUrl: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=800&q=80', title: 'Timber Clad Retreat', category: 'Design' },
            { imageUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80', title: 'Bright Sunroom Addition', category: 'Renovation' },
            { imageUrl: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=800&q=80', title: 'Double Storey Growth', category: 'Construction' },
            { imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80', title: 'Loft Conversion Link', category: 'Architecture' },
            { imageUrl: 'https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop&w=800&q=80', title: 'Urban Space Optimization', category: 'City Living' },
            { imageUrl: 'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?auto=format&fit=crop&w=800&q=80', title: 'Seamless Indoor-Outdoor', category: 'Landscape' },
            { imageUrl: 'https://images.unsplash.com/photo-1505691722718-25036f1fe4aa?auto=format&fit=crop&w=800&q=80', title: 'Basement Light-well', category: 'Engineering' },
            { imageUrl: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80', title: 'Architectural Statement', category: 'Modern' },
          ]}
          title = "House Extension Projects"
          description = "Explore our portfolio of seamless home transformations. See how Modular House utilizes precision steel framing to create expansive, light-filled extensions that integrate perfectly with your existing property and lifestyle."
        />
      </div>
    </div>
  );
};

export default HouseExtension;
