import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import {
  fetchApplicationById,
  getDocumentSignedUrl,
  transitionApplicationStatus,
  createCorrectionRequest,
  addApplicationComment,
  fetchApplicationComments,
} from '../lib/api';
import type { Application, ApplicationComment } from '../types/database.types';
import {
  getStatusBadgeClass,
  getStatusDisplayName,
} from '../features/applications/workflow';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Download,
  Send,
  PlusCircle,
  MessageSquare,
} from 'lucide-react';

export const AdminApplicationReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const [application, setApplication] = useState<Application | null>(null);
  const [comments, setComments] = useState<ApplicationComment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Correction Modal State
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [correctionField, setCorrectionField] = useState<string>('description');
  const [correctionComment, setCorrectionComment] = useState<string>('');
  const [correctionsList, setCorrectionsList] = useState<{ field: string; comment: string }[]>([]);

  // Approval Modal State
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [approvalNotes, setApprovalNotes] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      if (!id || !currentUser) return;
      setIsLoading(true);
      try {
        const app = await fetchApplicationById(id, currentUser);
        setApplication(app);
        if (app) {
          const comms = await fetchApplicationComments(app.id, currentUser.role);
          setComments(comms);
        }
      } catch (err: unknown) {
        setFeedbackMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Failed to load application',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id, currentUser]);

  const handleDownloadDoc = async (path: string, filename: string) => {
    try {
      const url = await getDocumentSignedUrl(path);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert('Unable to generate secure download link.');
    }
  };

  const handleStartReview = async () => {
    if (!application || !currentUser) return;
    setIsActionLoading(true);
    try {
      const updated = await transitionApplicationStatus(
        application.id,
        'under_review',
        currentUser,
        'Patent Review Cell commenced active screening.'
      );
      setApplication(updated);
      setFeedbackMessage({
        type: 'success',
        text: 'Application status changed to Under Review.',
      });
    } catch (err: unknown) {
      setFeedbackMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Status update failed',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddCorrectionItem = () => {
    if (!correctionComment.trim()) return;
    setCorrectionsList([...correctionsList, { field: correctionField, comment: correctionComment.trim() }]);
    setCorrectionComment('');
  };

  const handleSendCorrectionRequests = async () => {
    if (!application || !currentUser) return;
    const itemsToSend = [...correctionsList];
    if (itemsToSend.length === 0 && correctionComment.trim()) {
      itemsToSend.push({ field: correctionField, comment: correctionComment.trim() });
    }
    if (itemsToSend.length === 0) return;

    setIsActionLoading(true);
    setFeedbackMessage(null);

    try {
      for (const item of itemsToSend) {
        await createCorrectionRequest(application.id, currentUser.id, item.comment, item.field);
      }

      const updated = await transitionApplicationStatus(
        application.id,
        'corrections_required',
        currentUser,
        `Patent Review Cell requested ${itemsToSend.length} correction(s).`
      );

      setApplication(updated);
      setShowCorrectionModal(false);
      setCorrectionsList([]);
      setCorrectionComment('');
      setFeedbackMessage({
        type: 'success',
        text: 'Corrections successfully dispatched to the student with note. In-portal notification delivered.',
      });
    } catch (err: unknown) {
      setFeedbackMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to request corrections',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmApproval = async () => {
    if (!application || !currentUser) return;
    setIsActionLoading(true);
    try {
      const updated = await transitionApplicationStatus(
        application.id,
        'approved_next_stage',
        currentUser,
        approvalNotes.trim() || 'Approved by Patent Review Cell for internal filing preparation.'
      );
      setApplication(updated);
      setShowApproveModal(false);
      setFeedbackMessage({
        type: 'success',
        text: 'Application approved for the next internal stage. Disclosure forwarded to IPR filing cell.',
      });
    } catch (err: unknown) {
      setFeedbackMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Approval failed',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePostAdminComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !application || !currentUser) return;
    try {
      await addApplicationComment(application.id, currentUser.id, newComment.trim(), 'general');
      const updated = await fetchApplicationComments(application.id, currentUser.role);
      setComments(updated);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <p>Loading application review console...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="alert alert-danger">Application not found</div>
        <Link to="/admin/dashboard" className="btn btn-outline">
          &larr; Return to Admin Registry
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header and Breadcrumbs */}
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
          <Link to="/admin/dashboard" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            &larr; Back to Admin Registry
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Review: {application.reference_number}</h1>
            <span className={getStatusBadgeClass(application.status)}>
              {getStatusDisplayName(application.status)}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Version {application.current_version}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Applicant: <strong>{application.profiles?.full_name}</strong> ({application.profiles?.university_email})
          </p>
        </div>

        {/* Action Controls for Admin */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {(application.status === 'submitted' || application.status === 'under_review' || application.status === 'resubmitted') && (
            <>
              {application.status === 'submitted' && (
                <button
                  type="button"
                  onClick={handleStartReview}
                  className="btn btn-outline"
                  disabled={isActionLoading}
                >
                  Mark Under Review
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowCorrectionModal(true)}
                className="btn btn-danger"
                disabled={isActionLoading}
              >
                <AlertTriangle size={15} />
                Resend to Student for Corrections
              </button>
              <button
                type="button"
                onClick={() => setShowApproveModal(true)}
                className="btn btn-secondary"
                disabled={isActionLoading}
              >
                <CheckCircle2 size={15} />
                Send for Further Process
              </button>
            </>
          )}

          {application.status === 'approved_next_stage' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--color-success)',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              <CheckCircle2 size={18} /> Sent for Further Process
            </div>
          )}
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`alert ${feedbackMessage.type === 'success' ? 'alert-success' : 'alert-danger'}`}
          style={{ marginBottom: '24px' }}
        >
          {feedbackMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <div>{feedbackMessage.text}</div>
        </div>
      )}

      {/* Main Review Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left: Full Disclosure */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Technical Disclosure Details</h3>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Invention Title
                </span>
                <h2 style={{ fontSize: '1.25rem', marginTop: '4px', color: 'var(--text-primary)' }}>
                  {application.title}
                </h2>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Technical Domain
                </span>
                <p style={{ marginTop: '4px' }}>{application.technical_field}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Background & Technical Problem
                </span>
                <p style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{application.background_problem}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Comprehensive Description
                </span>
                <p style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{application.description}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Novelty & Distinguishing Characteristics
                </span>
                <p style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{application.novelty_features}</p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Commercial & Practical Applications
                </span>
                <p style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{application.practical_applications}</p>
              </div>
            </div>
          </div>

          {/* Inventors */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Inventor Registry</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Inventor</th>
                      <th>Affiliation</th>
                      <th>Department</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {application.inventors?.map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{inv.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.email}</div>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{inv.affiliation_type}</td>
                        <td>{inv.department}</td>
                        <td>
                          {inv.is_primary ? (
                            <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.75rem' }}>
                              Lead Inventor
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Co-Inventor</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Coordinator Notes */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Coordinator Notes & Guidance</h3>
            </div>
            <div className="card-body">
              {comments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        {c.author?.full_name || 'Coordinator'} ({new Date(c.created_at).toLocaleDateString('en-IN')})
                      </div>
                      <div>{c.content}</div>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handlePostAdminComment} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add note or pre-screening guidance..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit" className="btn btn-outline btn-sm" disabled={!newComment.trim()}>
                  <MessageSquare size={14} /> Add Note
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right: Documents, Audit History, and Existing Corrections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Documents */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Confidential Documents</h3>
            </div>
            <div className="card-body">
              {application.application_documents && application.application_documents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {application.application_documents.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-secondary)',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {doc.original_filename}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {doc.document_category} | {(doc.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc(doc.storage_path, doc.original_filename)}
                        className="btn btn-outline btn-sm"
                        title="Download Document"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No attached documents.</p>
              )}
            </div>
          </div>

          {/* Existing Correction History */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Correction History</h3>
            </div>
            <div className="card-body">
              {application.correction_requests && application.correction_requests.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {application.correction_requests.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: c.status === 'pending' ? 'var(--color-danger-bg)' : 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong>{c.field_name || 'Document'}</strong>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: c.status === 'pending' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                          {c.status.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-primary)' }}>{c.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No corrections requested on record.</p>
              )}
            </div>
          </div>

          {/* Audit Log */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Audit Log</h3>
            </div>
            <div className="card-body">
              {application.application_status_history?.map((hist) => (
                <div
                  key={hist.id}
                  style={{
                    borderLeft: '2px solid var(--border-medium)',
                    paddingLeft: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {getStatusDisplayName(hist.to_status)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {hist.reason || 'Transition recorded.'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(hist.created_at).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* REQUEST CORRECTIONS MODAL */}
      {showCorrectionModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="card-header">
              <h3 className="card-title">Resend to Student for Corrections</h3>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '0.875rem', marginBottom: '16px' }}>
                Specify your correction note or itemize sections that require revision by the student.
              </p>

              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '16px',
                }}
              >
                <div className="form-group">
                  <label className="form-label">Affected Section / Document</label>
                  <select
                    className="form-control"
                    value={correctionField}
                    onChange={(e) => setCorrectionField(e.target.value)}
                  >
                    <option value="title">Invention Title</option>
                    <option value="technical_field">Technical Field</option>
                    <option value="background_problem">Problem Statement / Prior Art</option>
                    <option value="description">Detailed Description</option>
                    <option value="novelty_features">Novelty Features</option>
                    <option value="practical_applications">Practical / Industrial Utility</option>
                    <option value="inventors">Inventors Roster</option>
                    <option value="document_specification">Document: Specification File</option>
                    <option value="document_drawings">Document: Technical Drawings</option>
                    <option value="document_declaration">Document: Declaration / NOC</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Reviewer Note / Required Modifications <span className="required">*</span></label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Enter clear instructions and notes describing what the student must correct or clarify..."
                    value={correctionComment}
                    onChange={(e) => setCorrectionComment(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddCorrectionItem}
                  className="btn btn-outline btn-sm"
                  disabled={!correctionComment.trim()}
                >
                  <PlusCircle size={14} /> Add Another Item
                </button>
              </div>

              {/* Added items list */}
              {correctionsList.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Items Queued for Dispatch ({correctionsList.length}):
                  </span>
                  <ul style={{ paddingLeft: '20px', marginTop: '6px', fontSize: '0.875rem' }}>
                    {correctionsList.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>
                        <strong>{item.field}:</strong> "{item.comment}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="card-footer">
              <button
                type="button"
                onClick={() => {
                  setShowCorrectionModal(false);
                  setCorrectionsList([]);
                  setCorrectionComment('');
                }}
                className="btn btn-outline"
                disabled={isActionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendCorrectionRequests}
                className="btn btn-danger"
                disabled={isActionLoading || (correctionsList.length === 0 && !correctionComment.trim())}
              >
                <Send size={15} />
                {isActionLoading ? 'Resending...' : 'Resend to Student with Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE / FURTHER PROCESS MODAL */}
      {showApproveModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="card-header">
              <h3 className="card-title">Send for Further Process</h3>
            </div>
            <div className="card-body">
              <div className="alert alert-info" style={{ marginBottom: '16px' }}>
                <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Institutional Scope:</strong> Sending for further process confirms that this disclosure has passed university pre-screening and is authorized to move to the internal patent drafting and filing phase.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Forwarding / Filing Notes (Optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="e.g. Cleared for Form 1 and Form 2 drafting with appointed patent attorney."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="card-footer">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="btn btn-outline"
                disabled={isActionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="btn btn-secondary"
                disabled={isActionLoading}
              >
                {isActionLoading ? 'Processing...' : 'Confirm & Send for Further Process'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
