function About() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            About Us
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Learn more about our mission and values.
          </p>
        </div>
        
        {/* Placeholder content sections */}
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
              <p className="mt-4 text-base text-gray-600">
                We believe in creating sustainable, efficient, and beautiful modular homes 
                that meet the needs of modern living while respecting our environment.
              </p>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Our Values</h2>
              <p className="mt-4 text-base text-gray-600">
                Quality craftsmanship, innovative design, and customer satisfaction 
                are at the heart of everything we do.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About