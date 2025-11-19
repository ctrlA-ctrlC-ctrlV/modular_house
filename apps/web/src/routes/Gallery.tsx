function Gallery() {
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
        
        {/* Placeholder filter buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            All
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
            Garden Rooms
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
            House Extensions
          </button>
        </div>
        
        {/* Placeholder gallery grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="group relative">
              <div className="aspect-w-4 aspect-h-3 bg-gray-200 rounded-lg overflow-hidden">
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">Image {item}</span>
                </div>
              </div>
              <h3 className="mt-4 text-sm text-gray-700">
                Project Title {item}
              </h3>
              <p className="text-sm font-medium text-gray-900">
                Category
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Gallery