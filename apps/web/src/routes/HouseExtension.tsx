import React from 'react';
import { Seo } from '@modular-house/ui';
import { HeroBoldBottomText } from '@modular-house/ui';

const HouseExtension: React.FC = () => {
  return (
    <div className="l-container py-16">
      <Seo 
        title="House Extension" 
        description="Expand your home with our modular extensions."
        canonicalUrl="https://modularhouse.ie/house-extension"
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

      <h1>House Extension</h1>
      <p>Coming soon...</p>
    </div>
  );
};

export default HouseExtension;
