import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { contentClient, GalleryItem } from '../lib/contentClient'
import { Lightbox } from '../components/Lightbox'

function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')
  const category = (categoryParam === 'garden-room' || categoryParam === 'house-extension') 
    ? categoryParam 
    : undefined

  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1)

  useEffect(() => {
    setLoading(true)
    contentClient.getGallery({ category })
      .then((res) => setItems(res.items))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category])

  const handleCategoryChange = (newCategory: 'garden-room' | 'house-extension' | undefined) => {
    if (newCategory) {
      setSearchParams({ category: newCategory })
    } else {
      setSearchParams({})
    }
  }

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(-1)
  const nextImage = () => setLightboxIndex((prev) => (prev + 1) % items.length)
  const prevImage = () => setLightboxIndex((prev) => (prev - 1 + items.length) % items.length)

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Gallery
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Browse our collection of modular home designs.
          </p>
        </div>
        
        {/* Filter buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button 
            onClick={() => handleCategoryChange(undefined)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${!category ? 'text-white bg-indigo-600 hover:bg-indigo-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
          >
            All
          </button>
          <button 
            onClick={() => handleCategoryChange('garden-room')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${category === 'garden-room' ? 'text-white bg-indigo-600 hover:bg-indigo-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
          >
            Garden Rooms
          </button>
          <button 
            onClick={() => handleCategoryChange('house-extension')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${category === 'house-extension' ? 'text-white bg-indigo-600 hover:bg-indigo-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
          >
            House Extensions
          </button>
        </div>
        
        {/* Gallery grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
             <div className="col-span-full text-center py-12 text-gray-500">Loading...</div>
          ) : items.length === 0 ? (
             <div className="col-span-full text-center py-12 text-gray-500">No items found.</div>
          ) : (
            items.map((item, index) => (
              <div 
                key={item.id} 
                className="group relative cursor-pointer"
                onClick={() => openLightbox(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(index);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View ${item.title}`}
              >
                <div className="aspect-w-4 aspect-h-3 bg-gray-200 rounded-lg overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.altText} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
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
            ))
          )}
        </div>

        <Lightbox
          isOpen={lightboxIndex >= 0}
          onClose={closeLightbox}
          item={lightboxIndex >= 0 ? items[lightboxIndex] : null}
          onNext={nextImage}
          onPrev={prevImage}
          hasNext={items.length > 1}
          hasPrev={items.length > 1}
        />
        
        {/* CTA Section */}
        <div className="mt-16 bg-indigo-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white">Inspired by What You See?</h2>
          <p className="mt-4 text-lg text-indigo-100">
            Let's discuss how we can create your dream modular home.
          </p>
          <div className="mt-6">
            <Link
              to="/contact"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Get In Touch
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Gallery