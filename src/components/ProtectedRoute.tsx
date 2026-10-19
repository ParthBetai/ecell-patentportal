import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'admin';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '64px 0', textAlign: 'center' }}>
        <p>Verifying university credentials and session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (requiredRole === 'admin' && currentUser.role !== 'admin') {
    return (
      <div className="container" style={{ padding: '64px 0' }}>
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', borderColor: 'var(--color-danger-border)' }}>
          <div className="card-header" style={{ backgroundColor: 'var(--color-danger-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}>
              <ShieldAlert size={20} />
              <h3 style={{ margin: 0, color: 'var(--color-danger)' }}>Unauthorized Administrative Access</h3>
            </div>
          </div>
          <div className="card-body">
            <p style={{ marginBottom: '16px' }}>
              Access to the administrative patent screening console is restricted to the designated university patent coordinator / administrator.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Current signed-in account: <strong>{currentUser.university_email}</strong> ({currentUser.role}).
            </p>
          </div>
          <div className="card-footer">
            <a href="/dashboard" className="btn btn-outline">
              Return to Student Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
