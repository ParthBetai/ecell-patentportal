import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { fetchApplications, fetchNotifications } from '../lib/api';
import type { Application, InPortalNotification } from '../types/database.types';
import { getStatusBadgeClass, getStatusDisplayName } from '../features/applications/workflow';
import {
  PlusCircle,
  FileText,
  AlertTriangle,
  Eye,
  Layers,
  Bell,
  Clock,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<InPortalNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const [apps, notifs] = await Promise.all([
          fetchApplications(currentUser),
          fetchNotifications(currentUser.id),
        ]);
        setApplications(apps);
        setNotifications(notifs);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load applications');
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <p>Loading your patent disclosures and notifications...</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header & New Application Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>
            Welcome, {currentUser?.full_name}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Student Applicant Dashboard | {currentUser?.department || 'Department of Technology & Sciences'}
          </p>
        </div>

        <Link to="/applications/new" className="btn btn-primary">
          <PlusCircle size={16} />
          Create New Application
        </Link>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          {errorMessage}
        </div>
      )}

      {/* Notifications Banner if any unread */}
      {notifications.length > 0 && notifications.some((n) => !n.is_read) && (
        <div className="alert alert-info" style={{ marginBottom: '24px' }}>
          <Bell size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <strong>Recent Notification:</strong> {notifications[0].message}
            {notifications[0].link && (
              <div style={{ marginTop: '4px' }}>
                <Link to={notifications[0].link} style={{ fontWeight: 600 }}>
                  View Application Details &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Application List Section */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">My Patent Disclosures</h2>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Total Submissions: {applications.length}
          </span>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {applications.length === 0 ? (
            <div className="empty-state">
              <FileText className="empty-state-icon" />
              <h3 className="empty-state-title">No Patent Applications Submitted</h3>
              <p className="empty-state-description">
                You have not created or submitted any intellectual property disclosures yet. Click below to begin drafting your invention.
              </p>
              <Link to="/applications/new" className="btn btn-primary">
                <PlusCircle size={16} />
                Draft First Application
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reference No.</th>
                    <th>Invention Title</th>
                    <th>Status</th>
                    <th>Version</th>
                    <th>Last Updated</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const isCorrection = app.status === 'corrections_required';
                    return (
                      <tr
                        key={app.id}
                        style={{
                          backgroundColor: isCorrection ? 'var(--color-danger-bg)' : 'transparent',
                        }}
                      >
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.8125rem' }}>
                          {app.reference_number}
                        </td>
                        <td style={{ maxWidth: '320px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {app.title || 'Untitled Draft'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {app.technical_field || 'Domain unassigned'}
                          </div>
                          {isCorrection && (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: 'var(--color-danger)',
                                fontSize: '0.75rem',
                                marginTop: '4px',
                                fontWeight: 600,
                              }}
                            >
                              <AlertTriangle size={12} />
                              Reviewer corrections requested by Patent Review Cell
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(app.status)}>
                            {getStatusDisplayName(app.status)}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8125rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <Layers size={13} />v{app.current_version}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} />
                            {new Date(app.updated_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            {app.status === 'draft' ? (
                              <Link to={`/applications/${app.id}/edit`} className="btn btn-primary btn-sm">
                                Continue Draft
                              </Link>
                            ) : isCorrection ? (
                              <Link to={`/applications/${app.id}/corrections`} className="btn btn-danger btn-sm">
                                Address Corrections
                              </Link>
                            ) : (
                              <Link to={`/applications/${app.id}`} className="btn btn-outline btn-sm">
                                <Eye size={14} />
                                View Details
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
