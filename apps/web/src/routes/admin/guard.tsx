import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';

export default function AdminGuard() {
  const location = useLocation();
  const token = localStorage.getItem('adminToken');

  if (!token) {
    // Redirect to login page, but save the current location they were trying to go to
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Ensure the API client has the token set
  apiClient.setAuthToken(token);

  return <Outlet />;
}
