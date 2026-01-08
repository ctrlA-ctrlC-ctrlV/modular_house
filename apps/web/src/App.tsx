import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { TemplateLayout } from './components/TemplateLayout'
import { routes } from './route-config'

import AdminLogin from './routes/admin/login'
import AdminDashboard from './routes/admin/index'
import AdminRedirects from './routes/admin/redirects'
import AdminGallery from './routes/admin/gallery'
import AdminSubmissions from './routes/admin/submissions'
import AdminPages from './routes/admin/pages'
import AdminGuard from './routes/admin/guard'

/*  Replace by TemplateLayout */
/*function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}*/

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes rendered dynamically from configuration */}
        <Route element={<TemplateLayout />}>
          {routes.map(({ path, component: Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}
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