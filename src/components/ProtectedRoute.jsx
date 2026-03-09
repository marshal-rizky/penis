import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (user === undefined) {
    // If we're still checking auth state, we might need a global loading state.
    // In AuthContext we set user initially to null then check. 
    // Assuming AuthContext manages `loading`, let's just wait or assume null if loaded.
    return (
      <div className="page-container flex-center">
        <Loader className="animate-spin text-hextech-magic" size={48} />
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
