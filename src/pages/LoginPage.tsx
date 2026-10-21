import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Mail, 
  User, 
  Building, 
  Phone, 
  Hash,
  Sparkles
} from 'lucide-react';
import { COORDINATOR, INSTITUTION } from '../config/constants';

export const LoginPage: React.FC = () => {
  const { signInWithEmail, registerUniversityAccount, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [regEmail, setRegEmail] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regDepartment, setRegDepartment] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safe redirect on authentication without infinite reload loops
  React.useEffect(() => {
    if (currentUser) {
      const fromPath = (location.state as any)?.from?.pathname;
      const destination =
        fromPath && fromPath !== '/' && fromPath !== '/login' && fromPath !== '/auth/login'
          ? fromPath
          : currentUser.role === 'super_admin'
          ? '/superadmin/dashboard'
          : currentUser.role === 'admin'
          ? '/admin/dashboard'
          : '/dashboard';
      navigate(destination, { replace: true });
    }
  }, [currentUser, navigate, location]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);
    setIsSubmitting(true);

    const result = await signInWithEmail(email, password);
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else {
      setSuccessNotice('Identity verified. Accessing secure portal...');
      const clean = email.toLowerCase().trim();
      const isSuperAdmin =
        clean === 'superadmin@muj.manipal.edu' ||
        clean === 'it.admin@muj.manipal.edu';
      const isAdmin =
        !isSuperAdmin &&
        (clean === COORDINATOR.EMAIL.toLowerCase() ||
        clean.includes('dorelal') ||
        clean.includes('admin') ||
        clean === 'patent.admin@muj.manipal.edu');

      setTimeout(() => {
        if (isSuperAdmin) {
          navigate('/superadmin/dashboard', { replace: true });
        } else if (isAdmin) {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 300);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }

    setIsSubmitting(true);
    const result = await registerUniversityAccount({
      email: regEmail,
      password: regPassword,
      fullName: regFullName,
      department: regDepartment,
      registrationNumber: regNumber,
      phone: regPhone,
    });
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else {
      setSuccessNotice('University account successfully registered! Redirecting to workspace...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 400);
    }
  };

  return (
    <div className="container container-narrow" style={{ padding: '40px 0 70px' }}>
      {/* Institutional Hero Banner */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            color: '#2563eb',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}
        >
          <Sparkles size={12} />
          E-CELL MUJ OFFICIAL PATENT ZONE
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Manipal University Jaipur Patent Portal
        </h1>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '520px', marginInline: 'auto' }}>
          Unified intellectual property disclosure and examination system engineered by <strong>E-Cell MUJ</strong> &amp; the <strong>Directorate of Research &amp; IPR Cell</strong>.
        </p>
      </div>

      <div className="card" style={{ maxWidth: '500px', margin: '0 auto', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', borderRadius: '12px' }}>
        <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px', padding: '24px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
            <ShieldCheck size={20} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Institutional Access Gate
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>
            {activeTab === 'signin' ? 'Sign In with University Credentials' : 'Register New University Account'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Authorized portal for {INSTITUTION.NAME} students, faculty, and research coordinators.
          </p>

          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', width: '100%', marginTop: '16px', borderBottom: '1px solid var(--border-light)' }}>
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setErrorMessage(null); setSuccessNotice(null); }}
              style={{
                flex: 1,
                padding: '10px 0',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'signin' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                fontWeight: activeTab === 'signin' ? 700 : 500,
                fontSize: '0.875rem',
                color: activeTab === 'signin' ? 'var(--accent-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMessage(null); setSuccessNotice(null); }}
              style={{
                flex: 1,
                padding: '10px 0',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'register' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                fontWeight: activeTab === 'register' ? 700 : 500,
                fontSize: '0.875rem',
                color: activeTab === 'register' ? 'var(--accent-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Register University Account
            </button>
          </div>
        </div>

        <div className="card-body" style={{ padding: '20px 24px 28px' }}>
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

          {activeTab === 'signin' ? (
            <form onSubmit={handleSignIn}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="email" className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  University Email Address <span className="required">*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }}>
                    <Mail size={16} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder={`name${INSTITUTION.EMAIL_AT_DOMAIN}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label htmlFor="password" className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem', margin: 0 }}>
                    Password <span className="required">*</span>
                  </label>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }}>
                    <Lock size={16} />
                  </span>
                  <input
                    id="password"
                    type="password"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="Enter your university account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px 16px', fontWeight: 600, fontSize: '0.9375rem' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  University Email <span className="required">*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }}>
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder={`name${INSTITUTION.EMAIL_AT_DOMAIN}`}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  Full Legal Name <span className="required">*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }}>
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="e.g. Aditya Sharma"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Department
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }}>
                      <Building size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      style={{ paddingLeft: '38px' }}
                      placeholder="e.g. Computer Science"
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Registration No.
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }}>
                      <Hash size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      style={{ paddingLeft: '38px' }}
                      placeholder="e.g. 219301234"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  Contact Phone
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }}>
                    <Phone size={16} />
                  </span>
                  <input
                    type="tel"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="+91 9876543210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '12px', marginBottom: '22px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Password <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Min 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Confirm Password <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Re-enter password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px 16px', fontWeight: 600, fontSize: '0.9375rem' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering Account...' : 'Complete Registration'}
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* Institutional Statutory Security Notice */}
          <div
            style={{
              marginTop: '24px',
              padding: '12px 14px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#475569',
              lineHeight: 1.5,
            }}
          >
            <strong>Indian Patents Act 1970 Security Notice:</strong> India operates strictly on a first-to-file regime. All invention disclosures, specifications, and drawings submitted herein remain protected by university confidentiality under Section 39 clearance protocols.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
