import React from 'react';
import { Seo } from '@modular-house/ui';
import { HeroBoldBottomText } from '@modular-house/ui';

const GardenRoom: React.FC = () => {
  return (
    <div className="l-container py-16">
      {/** SEO Mapping Section */}
      <div id='garden_room_seo'>
        <Seo 
        title="Garden Room" 
        description="Discover our bespoke garden rooms."
        canonicalUrl="https://modularhouse.ie/garden-room"
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

      <h1>Garden Room</h1>
      <p>Coming soon...</p>
    </div>
  );
};

export default GardenRoom;
