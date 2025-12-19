import React from 'react';
import { Seo } from '@modular-house/ui';
import { HeroBoldBottomText } from '@modular-house/ui';
import { FullMassonryGallery } from '@modular-house/ui';

const GardenRoom: React.FC = () => {
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
      {/** SEO Mapping Section */}
      <div id='garden_room_seo'>
        <Seo 
        title="Insulated Steel Frame Garden Rooms & Studios" 
        description="Custom-built, steel-frame garden rooms designed for year-round use. Fully insulated, energy-efficient, and most builds require no planning permission."
        canonicalUrl="https://modularhouse.ie/garden-room"

        // Open Graph for Facebook/LinkedIn sharing optimization
        openGraph={{
          type: 'website',
          title: 'Bespoke Steel Frame Garden Rooms | Luxury Garden Studios',
          description: 'Escape to your private garden sanctuary. Our precision-engineered steel rooms offer superior comfort and durability with turnkey delivery.',
          image: 'https://modularhouse.ie/resource/landing_hero.png',
          siteName: 'Modular House Construction',
        }}

        // Twitter Card optimization
        twitter={{
          cardType: 'summary_large_image',
          site: '@ModularHouse',
          title: 'Garden Rooms Built to Last: Precision Steel Engineering',
          image: 'https://modularhouse.ie/resource/landing_hero.png',
        }}

        // Rich Snippets data
        jsonLd={organizationSchema}
      />
      </div>
      
      {/** /garden-room hero Section */}
      <div id='garden_room_hero'>
        <HeroBoldBottomText 
          titleLine1 = "Reclaim your quiet comfort in a bespoke outdoor studio."
          titleLine2 = "Precision steel engineering meets architectural elegance."
          ctaText = "Get a Free Quote"
          ctaLink = "#"
          backgroundImage = "https://rebar.themerex.net/wp-content/uploads/2025/08/background-06.jpg"
          bigText = "Garden Room"
        />
      </div>

      <div id='garden_room_gallery'>
      <FullMassonryGallery
        itemCount = {15}
        items = {[
          { imageUrl: 'https://images.unsplash.com/photo-1585128719715-46776b56a0d1?auto=format&fit=crop&w=800&q=80', title: 'Modern Studio', category: 'Architecture' },
          { imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80', title: 'Botanical Sanctuary', category: 'Interior' },
          { imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80', title: 'Greenhouse Lounge', category: 'Leisure' },
          { imageUrl: 'https://images.unsplash.com/photo-1510076857177-74700760be15?auto=format&fit=crop&w=800&q=80', title: 'Glass Pavilion', category: 'Design' },
          { imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80', title: 'Creative Workspace', category: 'Office' },
          { imageUrl: 'https://images.unsplash.com/photo-1615873968403-89e068629275?auto=format&fit=crop&w=800&q=80', title: 'Scandinavian Sunroom', category: 'Lifestyle' },
          { imageUrl: 'https://images.unsplash.com/photo-1600210492493-0944b029f6ea?auto=format&fit=crop&w=800&q=80', title: 'Cozy Retreat', category: 'Interior' },
          { imageUrl: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80', title: 'Garden Exterior', category: 'Exterior' },
          { imageUrl: 'https://images.unsplash.com/photo-1551133990-7c63b469037e?auto=format&fit=crop&w=800&q=80', title: 'Urban Oasis', category: 'Nature' },
          { imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80', title: 'Minimalist Nook', category: 'Design' },
          { imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80', title: 'Leafy Veranda', category: 'Relaxation' },
          { imageUrl: 'https://images.unsplash.com/photo-1600607687940-4720033095c5?auto=format&fit=crop&w=800&q=80', title: 'Architectural Cube', category: 'Modern' },
          { imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', title: 'Luxury Pavilion', category: 'Architecture' },
          { imageUrl: 'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?auto=format&fit=crop&w=800&q=80', title: 'Airy Conservatory', category: 'Interior' },
          { imageUrl: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=800&q=80', title: 'Rustic Summerhouse', category: 'Traditional' },
        ]}
        title = "Garden Room Projects"
        description = "Explore our portfolio of bespoke garden sanctuaries. See how Modular House combines steel-frame precision with architectural design to create high-performance spaces you can enjoy year-round."
      />
    </div>
    </div>
  );
};

export default GardenRoom;
