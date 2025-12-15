import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isPlatformAdmin } from "../utils/adminCheck";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

/**
 * Protected route component for role-based access control
 * Supports admin-only pages and role-specific pages
 * @param {string} requiredRole - Optional role requirement (e.g., 'artist', 'curator')
 * @param {boolean} adminOnly - If true, only platform admins can access (default: true)
 */
export default function ProtectedRoute({ children, requiredRole, adminOnly = true }) {
  const { user, role } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  // Debug logging
  console.log('ProtectedRoute - User:', user);
  console.log('ProtectedRoute - User email:', user?.email);
  console.log('ProtectedRoute - User role:', role);
  console.log('ProtectedRoute - Required role:', requiredRole);
  console.log('ProtectedRoute - Is admin:', isPlatformAdmin(user));

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Auth context will automatically update user state
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Sign in failed: ' + error.message);
    } finally {
      setSigningIn(false);
    }
  };

  // Check if user is logged in
  if (!user) {
    const loginType = requiredRole ? 'Login' : 'Admin Login';
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold mb-4">{loginType} Required</h1>
          <p className="text-gray-400 mb-6">
            You must sign in to access this area.
          </p>
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold transition mb-4"
          >
            {signingIn ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    );
  }

  // If adminOnly is true, check for platform admin
  if (adminOnly && !isPlatformAdmin(user)) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold mb-4">Unauthorized Access</h1>
          <p className="text-gray-400 mb-6">
            You do not have permission to access this administrative area.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Debug: Logged in as {user.email}
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  // If requiredRole is specified, check for matching role
  if (requiredRole && role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold mb-4">Unauthorized Access</h1>
          <p className="text-gray-400 mb-6">
            You do not have the required role to access this area.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Required role: {requiredRole} | Your role: {role || 'none'}
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  // User has required access, render protected content
  return <>{children}</>;
}
