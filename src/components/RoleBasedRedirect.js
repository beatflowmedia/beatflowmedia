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
    // Only redirect if enabled and user is logged in
    if (!enabled || !user || !role) return;

    // Redirect based on role
    switch (role) {
      case 'artist':
        navigate('/artist/dashboard');
        break;
      case 'podcaster':
        navigate('/podcaster/dashboard');
        break;
      case 'author':
        // Author dashboard coming soon, for now go to home
        navigate('/');
        break;
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'curator':
        navigate('/curator-portal');
        break;
      case 'investor':
        navigate('/investor-portal');
        break;
      case 'listener':
      default:
        // Listeners stay on home page
        break;
    }
  }, [enabled, user, role, navigate]);

  return children;
}

/**
 * Hook to get the dashboard path for the current user's role
 */
export function useRoleDashboard() {
  const { role } = useAuth();

  const getDashboardPath = () => {
    switch (role) {
      case 'artist':
        return '/artist/dashboard';
      case 'podcaster':
        return '/podcaster/dashboard';
      case 'author':
        return '/'; // Coming soon
      case 'admin':
        return '/admin/dashboard';
      case 'curator':
        return '/curator-portal';
      case 'investor':
        return '/investor-portal';
      case 'listener':
      default:
        return '/';
    }
  };

  return { dashboardPath: getDashboardPath(), role };
}
