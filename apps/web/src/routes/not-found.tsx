import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="min-h-full pt-16 pb-12 flex flex-col bg-white">
      <main className="flex-grow flex flex-col justify-center l-container w-full">
        <div className="flex-shrink-0 flex justify-center">
          <Link to="/" className="inline-flex">
            <span className="sr-only">Modular House</span>
            <span className="text-4xl font-bold text-indigo-600 tracking-tight">Modular House</span>
          </Link>
        </div>
        <div className="py-16">
          <div className="text-center">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">404 error</p>
            <h1 className="mt-2 text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
              Lost in the blueprint?
            </h1>
            <p className="mt-2 text-base text-gray-500">
              Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
            </p>
            <div className="mt-6">
              <Link
                to="/"
                className="text-base font-medium text-indigo-600 hover:text-indigo-500"
              >
                Go back home<span aria-hidden="true"> &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default NotFound