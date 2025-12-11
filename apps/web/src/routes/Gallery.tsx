import { useEffect, useState, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { contentClient, GalleryItem } from '../lib/contentClient'
import { Lightbox } from '../components/Lightbox'
import { GalleryGrid } from '../components/GalleryGrid'

function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')
  const category = (categoryParam === 'garden-room' || categoryParam === 'house-extension') 
    ? categoryParam 
    : undefined

  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    setLoading(true)
    contentClient.getGallery({ category })
      .then((res) => {
        setItems(res.items)
        // Reset refs array when items change
        itemRefs.current = itemRefs.current.slice(0, res.items.length)
      })
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
  
  const closeLightbox = () => {
    // Focus the thumbnail of the currently viewed item when closing
    if (lightboxIndex >= 0 && itemRefs.current[lightboxIndex]) {
      itemRefs.current[lightboxIndex]?.focus()
    }
    setLightboxIndex(-1)
  }
  
  const nextImage = () => setLightboxIndex((prev) => (prev + 1) % items.length)
  const prevImage = () => setLightboxIndex((prev) => (prev - 1 + items.length) % items.length)

  return (
    <div className="bg-white">
      <div className="l-container py-16 sm:py-24">
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
        {loading ? (
           <div className="mt-12 text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <GalleryGrid 
            items={items} 
            onOpenLightbox={openLightbox} 
            registerRef={(index, el) => { itemRefs.current[index] = el }} 
          />
        )}

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