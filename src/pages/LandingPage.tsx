import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import {
  FileSpreadsheet,
  History,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="container">
      {/* Official Notice Alert */}
      <div className="alert alert-info" style={{ marginBottom: '32px' }}>
        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Institutional Screening Notice:</strong> This portal facilitates internal university pre-screening and coordinator review by the Patent Review Cell. University approval enables forward processing toward formal patent filing and does not constitute a granted patent from the Indian Patent Office (IPO).
        </div>
      </div>

      {/* Hero Section */}
      <div
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '48px 40px',
          marginBottom: '40px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ maxWidth: '800px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '16px',
            }}
          >
            <ShieldCheck size={14} color="var(--accent-primary)" />
            Directorate of Research and Innovation
          </div>

          <h1 style={{ marginBottom: '16px', color: 'var(--text-primary)', lineHeight: 1.25 }}>
            Manipal University Jaipur Patent Application Portal
          </h1>

          <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
            A structured, secure platform for MUJ students and faculty to submit intellectual property disclosures, track coordinator reviews, and resolve correction requests directly with the university patent review cell.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {currentUser ? (
              <Link
                to={currentUser.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                className="btn btn-primary btn-lg"
              >
                Go to Dashboard
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link to="/auth/login" className="btn btn-primary btn-lg">
                Sign In with University Email
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Process Architecture Overview */}
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '8px' }}>Standard University Patent Workflow</h2>
        <p style={{ marginBottom: '24px' }}>
          Replacing manual email attachments with transparent, versioned disclosure processing:
        </p>

        <div className="grid-3">
          <div className="card">
            <div className="card-body">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  marginBottom: '16px',
                }}
              >
                <FileSpreadsheet size={22} />
              </div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '8px' }}>1. Structured Submission</h3>
              <p style={{ fontSize: '0.875rem' }}>
                Complete structured disclosure forms detailing technical field, problem statement, novelty characteristics, and multi-inventor affiliations with built-in validation.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-teal)',
                  marginBottom: '16px',
                }}
              >
                <Lock size={22} />
              </div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '8px' }}>2. Private Document Storage</h3>
              <p style={{ fontSize: '0.875rem' }}>
                Supporting technical specifications, drawings, and prior-art documents are stored in access-restricted private storage accessible only by the applicant and authorized patent cell reviewers.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  marginBottom: '16px',
                }}
              >
                <History size={22} />
              </div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '8px' }}>3. Field-Level Corrections</h3>
              <p style={{ fontSize: '0.875rem' }}>
                When clarifications are needed, the coordinator logs specific itemized feedback. Students edit the same application, replace flawed documents, and maintain clear version history.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security and Confidentiality Banner */}
      <div
        className="card"
        style={{
          borderLeft: '4px solid var(--accent-primary)',
          marginBottom: '48px',
        }}
      >
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ maxWidth: '720px' }}>
            <h3 style={{ marginBottom: '6px' }}>Confidentiality and Data Isolation</h3>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Invention disclosures and preliminary patent claims are strictly confidential. Database Row Level Security (RLS) ensures that students can only view and edit their own applications, while administrative oversight is strictly restricted to designated university coordinators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
