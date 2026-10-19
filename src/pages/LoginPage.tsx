import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { ShieldCheck, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signInWithEmail, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      const from = (location.state as any)?.from?.pathname || (currentUser.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);
    setIsSubmitting(true);

    const result = await signInWithEmail(email);
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else {
      setSuccessNotice('Authentication verified. Redirecting to your dashboard...');
      setTimeout(() => {
        const destination = email.toLowerCase() === 'patent.admin@jaipur.manipal.edu' ? '/admin/dashboard' : '/dashboard';
        navigate(destination);
      }, 600);
    }
  };

  const handleQuickLogin = async (targetEmail: string) => {
    setEmail(targetEmail);
    setErrorMessage(null);
    setIsSubmitting(true);
    const result = await signInWithEmail(targetEmail);
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else {
      const destination = targetEmail.toLowerCase() === 'patent.admin@jaipur.manipal.edu' ? '/admin/dashboard' : '/dashboard';
      navigate(destination);
    }
  };

  return (
    <div className="container container-narrow" style={{ padding: '40px 0' }}>
      <div className="card" style={{ maxWidth: '520px', margin: '0 auto' }}>
        <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
            <ShieldCheck size={20} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              University Single Sign-In
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', margin: '4px 0 0' }}>Sign In to Patent Portal</h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Enter your approved Manipal University Jaipur email address.
          </p>
        </div>

        <div className="card-body">
          {errorMessage && (
            <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {successNotice && (
            <div className="alert alert-success" style={{ marginBottom: '20px' }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{successNotice}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                University Email Address <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  placeholder="name@jaipur.manipal.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <p className="form-helper">
                Accepts official MUJ domains (@jaipur.manipal.edu or @muj.manipal.edu).
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '20px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Verifying Account...' : 'Continue to Portal'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Institutional Note on Account Provisioning */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              marginBottom: '20px',
            }}
          >
            <strong>Role Provisioning Notice:</strong> Administrator privileges are strictly reserved for the university patent coordinator through server-side authorization. Public administrator sign-up is disabled.
          </div>

          {/* Quick Testing Sign-In Panel */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Evaluation & Verification Shortcuts:
            </span>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('aditya.sharma@jaipur.manipal.edu')}
                className="btn btn-outline btn-sm"
                style={{ flex: 1 }}
              >
                Sign In as Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('patent.admin@jaipur.manipal.edu')}
                className="btn btn-outline btn-sm"
                style={{ flex: 1, borderColor: 'var(--accent-teal)', color: 'var(--accent-teal)' }}
              >
                Sign In as Coordinator (Admin)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
