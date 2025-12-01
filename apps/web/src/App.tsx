import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Landing from './routes/Landing'
import Products from './routes/Products'
import Gallery from './routes/Gallery'
import About from './routes/About'
import Contact from './routes/Contact'
import Privacy from './routes/Privacy'
import Terms from './routes/Terms'
import NotFound from './routes/not-found'
import AdminLogin from './routes/admin/login'
import AdminDashboard from './routes/admin/index'
import AdminRedirects from './routes/admin/redirects'
import AdminGallery from './routes/admin/gallery'
import AdminSubmissions from './routes/admin/submissions'
import AdminPages from './routes/admin/pages'
import AdminGuard from './routes/admin/guard'

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/products" element={<Products />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        <Route element={<AdminGuard />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/redirects" element={<AdminRedirects />} />
          <Route path="/admin/gallery" element={<AdminGallery />} />
          <Route path="/admin/submissions" element={<AdminSubmissions />} />
          <Route path="/admin/pages" element={<AdminPages />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App