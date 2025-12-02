import { useState } from 'react'
import { GalleryItem } from '../lib/contentClient'

interface GalleryGridProps {
  items: GalleryItem[]
  onOpenLightbox: (index: number) => void
  registerRef: (index: number, el: HTMLDivElement | null) => void
}

export function GalleryGrid({ items, onOpenLightbox, registerRef }: GalleryGridProps) {
  if (items.length === 0) {
    return <div className="col-span-full text-center py-12 text-gray-500">No items found.</div>
  }

  return (
    <div className="c-gallery mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <GalleryCard 
          key={item.id} 
          item={item} 
          index={index} 
          onClick={() => onOpenLightbox(index)}
          registerRef={registerRef}
        />
      ))}
    </div>
  )
}

function GalleryCard({ item, index, onClick, registerRef }: { 
  item: GalleryItem, 
  index: number, 
  onClick: () => void,
  registerRef: (index: number, el: HTMLDivElement | null) => void
}) {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div 
      ref={(el) => registerRef(index, el)}
      className="c-gallery__item group relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-lg"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View ${item.title}`}
    >
      <div className="aspect-w-4 aspect-h-3 bg-gray-200 rounded-lg overflow-hidden relative">
        {item.imageUrl && !imageLoaded && (
           <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
             <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
           </div>
        )}
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.altText} 
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100 group-hover:opacity-75' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No Image</span>
          </div>
        )}
      </div>
      <h3 className="mt-4 text-sm text-gray-700">
        {item.title}
      </h3>
      <p className="text-sm font-medium text-gray-900">
        {item.category === 'garden-room' ? 'Garden Room' : 'House Extension'}
      </p>
    </div>
  )
}
