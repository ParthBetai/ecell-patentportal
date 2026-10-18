import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { fetchApplications } from '../lib/api';
import type { Application } from '../types/database.types';
import { getStatusBadgeClass, getStatusDisplayName } from '../features/applications/workflow';
import { ShieldCheck, Eye, Inbox } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'submitted'>('updated');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdminData() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const apps = await fetchApplications(currentUser);
        setApplications(apps);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load administrative applications');
      } finally {
        setIsLoading(false);
      }
    }

    loadAdminData();
  }, [currentUser]);

  // Filtering and searching logic
  const filteredApplications = applications
    .filter((app) => {
      // Exclude draft applications that haven't been submitted yet
      if (app.status === 'draft') return false;

      // Status filter
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;

      // Search query (reference number, title, or applicant name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRef = app.reference_number.toLowerCase().includes(query);
        const matchesTitle = app.title.toLowerCase().includes(query);
        const matchesOwner = app.profiles?.full_name.toLowerCase().includes(query);
        const matchesEmail = app.profiles?.university_email.toLowerCase().includes(query);
        return matchesRef || matchesTitle || matchesOwner || matchesEmail;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'submitted') {
        const timeA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
        const timeB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
        return timeB - timeA;
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <p>Loading coordinator review registry...</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Admin Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-teal)' }}>
          <ShieldCheck size={20} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Office of Intellectual Property Rights
          </span>
        </div>
        <h1 style={{ fontSize: '1.5rem', margin: '4px 0 0' }}>Patent Screening Registry</h1>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Review submissions, author field-level corrections, and manage internal approval stages.
        </p>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          {errorMessage}
        </div>
      )}

      {/* Search, Filter, and Sort Controls */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search reference number, applicant, or invention title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div style={{ minWidth: '180px' }}>
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Active Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="corrections_required">Corrections Required</option>
                <option value="resubmitted">Resubmitted</option>
                <option value="approved_next_stage">Approved for Next Stage</option>
              </select>
            </div>

            {/* Sorting */}
            <div style={{ minWidth: '160px' }}>
              <select
                className="form-control"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'updated' | 'submitted')}
              >
                <option value="updated">Sort: Last Updated</option>
                <option value="submitted">Sort: Submission Date</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Submitted Disclosures ({filteredApplications.length})</h2>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Designated Coordinator: Dorelal Ji
          </span>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {filteredApplications.length === 0 ? (
            <div className="empty-state">
              <Inbox className="empty-state-icon" />
              <h3 className="empty-state-title">No Applications Found</h3>
              <p className="empty-state-description">
                No submitted patent applications match your active search and filter criteria.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Invention Title</th>
                    <th>Applicant / Department</th>
                    <th>Status</th>
                    <th>Version</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.8125rem' }}>
                        {app.reference_number}
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {app.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {app.technical_field}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {app.profiles?.full_name || 'Applicant'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {app.profiles?.university_email}
                        </div>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(app.status)}>
                          {getStatusDisplayName(app.status)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          v{app.current_version}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {new Date(app.updated_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/admin/applications/${app.id}`} className="btn btn-outline btn-sm">
                          <Eye size={14} />
                          Review Application
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
