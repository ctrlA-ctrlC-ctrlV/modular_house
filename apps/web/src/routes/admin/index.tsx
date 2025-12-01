import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    apiClient.clearAuthToken();
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold leading-tight text-gray-900">
              Overview
            </h2>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link to="/admin/redirects" className="bg-white overflow-hidden shadow rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="text-lg font-medium text-gray-900">Redirects</div>
                  <p className="mt-1 text-sm text-gray-500">Manage URL redirects</p>
                </Link>

                <Link to="/admin/gallery" className="bg-white overflow-hidden shadow rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="text-lg font-medium text-gray-900">Gallery</div>
                  <p className="mt-1 text-sm text-gray-500">Manage gallery items</p>
                </Link>

                <Link to="/admin/submissions" className="bg-white overflow-hidden shadow rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="text-lg font-medium text-gray-900">Submissions</div>
                  <p className="mt-1 text-sm text-gray-500">View and export submissions</p>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
