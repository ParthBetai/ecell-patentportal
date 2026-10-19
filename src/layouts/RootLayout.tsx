import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { FileText, LogOut, Shield, User } from 'lucide-react';

export const RootLayout: React.FC = () => {
  const { currentUser, signOut, switchUserRoleForTesting } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <div className="app-container">
      {/* Top Institutional Notification Banner */}
      <div
        style={{
          backgroundColor: '#0f172a',
          color: '#cbd5e1',
          fontSize: '0.8125rem',
          padding: '6px 0',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            Directorate of Research and Innovation, Manipal University Jaipur | Internal IPR Screening Portal
          </span>
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#94a3b8' }}>Test Persona:</span>
              <button
                type="button"
                onClick={() => switchUserRoleForTesting('student')}
                style={{
                  background: currentUser.role === 'student' ? '#0284c7' : 'transparent',
                  color: '#ffffff',
                  border: '1px solid #334155',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Student View
              </button>
              <button
                type="button"
                onClick={() => switchUserRoleForTesting('admin')}
                style={{
                  background: currentUser.role === 'admin' ? '#0f766e' : 'transparent',
                  color: '#ffffff',
                  border: '1px solid #334155',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Admin (Patent Cell)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Header */}
      <header className="site-header">
        <div className="container">
          <div className="header-inner">
            <Link to="/" className="brand-wrapper">
              <div className="brand-mark">
                <FileText size={20} />
              </div>
              <div className="brand-text-block">
                <span className="brand-title">MUJ Patent Application Portal</span>
                <span className="brand-subtitle">Manipal University Jaipur</span>
              </div>
            </Link>

            <nav className="nav-links">
              <Link
                to="/"
                className={`nav-item ${location.pathname === '/' || location.pathname === '/workspace' ? 'active' : ''}`}
              >
                Patent Workspace
              </Link>
              {currentUser && (
                <>
                  {currentUser.role === 'admin' ? (
                    <Link
                      to="/admin/dashboard"
                      className={`nav-item ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
                    >
                      Admin Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/dashboard"
                        className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
                      >
                        My Applications
                      </Link>
                      <Link
                        to="/applications/new"
                        className={`nav-item ${location.pathname === '/applications/new' ? 'active' : ''}`}
                      >
                        New Application
                      </Link>
                    </>
                  )}
                </>
              )}
            </nav>

            <div className="nav-user-actions">
              {currentUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                    {currentUser.role === 'admin' ? (
                      <Shield size={16} color="var(--accent-teal)" />
                    ) : (
                      <User size={16} color="var(--accent-primary)" />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        {currentUser.full_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {currentUser.role === 'admin' ? 'Patent Coordinator' : 'Student Applicant'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="btn btn-outline btn-sm"
                    title="Sign Out of Portal"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link to="/auth/login" className="btn btn-primary btn-sm">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Institutional Footer */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-inner">
            <div>
              <p style={{ margin: 0, fontSize: '0.8125rem' }}>
                &copy; {new Date().getFullYear()} Manipal University Jaipur. Directorate of Research & Innovation.
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Designated Patent Cell: Office of Intellectual Property Rights (IPR).
              </p>
            </div>
            <div className="footer-links">
              <a
                href="mailto:patent.admin@jaipur.manipal.edu"
                style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}
              >
                Patent Cell Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
