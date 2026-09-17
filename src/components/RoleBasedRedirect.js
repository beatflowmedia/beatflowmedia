import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Component that redirects users to their appropriate dashboard based on role
 * Use this on the home page or after login
 */
export default function RoleBasedRedirect({ children, enabled = false }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled || !user || !role) return;

    if (role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [enabled, user, role, navigate]);

  return children;
}

/**
 * Hook to get the dashboard path for the current user's role
 */
export function useRoleDashboard() {
  const { role } = useAuth();
  const dashboardPath = role === 'admin' ? '/admin/dashboard' : '/';
  return { dashboardPath, role };
}
