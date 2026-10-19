import React, { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { PipelineFlowchart } from '../components/PipelineFlowchart';
import {
  fetchApplications,
  fetchApplicationById,
  saveDraftApplication,
  submitApplication,
  resubmitApplication,
  transitionApplicationStatus,
  createCorrectionRequest,
  uploadDocument,
} from '../lib/api';
import type { Application, ApplicationVersion, DocumentCategory, Inventor } from '../types/database.types';
import {
  Shield,
  User,
  PlusCircle,
  Save,
  Send,
  CheckCircle2,
  AlertTriangle,
  Upload,
  History,
  RotateCcw,
  Eye,
} from 'lucide-react';

export const SimplePipelinePage: React.FC = () => {
  const { currentUser, switchUserRoleForTesting } = useAuth();

  const [application, setApplication] = useState<Application | null>(null);
  const [versions, setVersions] = useState<ApplicationVersion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [technicalField, setTechnicalField] = useState('');
  const [backgroundProblem, setBackgroundProblem] = useState('');
  const [description, setDescription] = useState('');
  const [noveltyFeatures, setNoveltyFeatures] = useState('');
  const [practicalApplications, setPracticalApplications] = useState('');
  const [inventors, setInventors] = useState<Partial<Inventor>[]>([]);

  // Correction authoring / handling state
  const [correctionFeedback, setCorrectionFeedback] = useState('');
  const [resubmissionNote, setResubmissionNote] = useState('');
  const [confirmChecklist, setConfirmChecklist] = useState(false);

  // Load application and versions
  const loadActiveApplication = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const apps = await fetchApplications(currentUser);
      if (apps.length > 0) {
        const fullApp = await fetchApplicationById(apps[0].id, currentUser);
        if (fullApp) {
          setApplication(fullApp);
          setTitle(fullApp.title || '');
          setTechnicalField(fullApp.technical_field || '');
          setBackgroundProblem(fullApp.background_problem || '');
          setDescription(fullApp.description || '');
          setNoveltyFeatures(fullApp.novelty_features || '');
          setPracticalApplications(fullApp.practical_applications || '');
          setInventors(fullApp.inventors || []);

          // Fetch versions from local storage
          const rawVersions = localStorage.getItem('muj_patent_portal_versions');
          if (rawVersions) {
            try {
              const allVersions: ApplicationVersion[] = JSON.parse(rawVersions);
              setVersions(allVersions.filter((v) => v.application_id === fullApp.id));
            } catch {
              setVersions([]);
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error('Failed to load application:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActiveApplication();
  }, [currentUser]);

  // Create or Reset Sample Application for interactive demonstration
  const handleStartFreshDemo = async () => {
    if (!currentUser) return;
    setIsActionLoading(true);
    setFeedback(null);
    try {
      const newDraft = await saveDraftApplication(
        {
          title: 'Adaptive Energy Harvesting Micro-Controller for Remote IoT Sensors',
          technical_field: 'Embedded Systems and Renewable Energy',
          background_problem:
            'Remote IoT sensor nodes deployable in remote agricultural environments suffer from finite battery lifetimes, requiring frequent manual physical battery replacements.',
          description:
            'An integrated ultra-low power power-management circuit coupled with dual-mode piezoelectric vibration and photovoltaic ambient transducers.',
          novelty_features:
            'A dual-stage hysteretic impedance matching circuit that dynamically scales resonant frequency matching under ambient random vibrations.',
          practical_applications:
            'Long-range precision agriculture soil telemetry, industrial machine vibration monitoring, and structural health sensors.',
        },
        [
          {
            full_name: 'Aditya Sharma',
            email: 'aditya.sharma@jaipur.manipal.edu',
            phone: '+91 9876543210',
            affiliation_type: 'student',
            department: 'Computer Science and Engineering',
            is_primary: true,
          },
          {
            full_name: 'Dr. Anita Joshi',
            email: 'anita.joshi@jaipur.manipal.edu',
            phone: '+91 9876501234',
            affiliation_type: 'faculty',
            department: 'Electrical Engineering',
            is_primary: false,
          },
        ],
        currentUser.role === 'admin' ? 'student-aditya-uuid' : currentUser.id
      );

      setFeedback({
        type: 'success',
        text: `Fresh demo application created in Draft state (${newDraft.reference_number}).`,
      });
      await loadActiveApplication();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to reset demo',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // 1. SAVE DRAFT
  const handleSaveDraft = async () => {
    if (!application || !currentUser) return;
    setIsActionLoading(true);
    setFeedback(null);
    try {
      const saved = await saveDraftApplication(
        {
          id: application.id,
          title,
          technical_field: technicalField,
          background_problem: backgroundProblem,
          description,
          novelty_features: noveltyFeatures,
          practical_applications: practicalApplications,
        },
        inventors,
        currentUser.id
      );
      setFeedback({
        type: 'success',
        text: `Draft saved successfully (${saved.reference_number}).`,
      });
      await loadActiveApplication();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save draft',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // 2. SUBMIT APPLICATION
  const handleSubmit = async () => {
    if (!application || !currentUser) return;
    setIsActionLoading(true);
    setFeedback(null);
    try {
      // Save latest
      await saveDraftApplication(
        {
          id: application.id,
          title,
          technical_field: technicalField,
          background_problem: backgroundProblem,
          description,
          novelty_features: noveltyFeatures,
          practical_applications: practicalApplications,
        },
        inventors,
        currentUser.id
      );

      await submitApplication(application.id, currentUser.id, 'Formal submission for coordinator review.');
      setFeedback({
        type: 'success',
        text: 'Application submitted! It is now sent for coordinator review.',
      });
      await loadActiveApplication();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Submission failed',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. ADMIN: START REVIEW
  const handleStartReview = async () => {
    if (!application || !currentUser) return;
    setIsActionLoading(true);
    setFeedback(null);
    try {
      await transitionApplicationStatus(
        application.id,
        'under_review',
        currentUser,
        'Dorelal Ji commenced active screening.'
      );
      setFeedback({
        type: 'success',
        text: 'Application is now Under Review by Coordinator Dorelal Ji.',
      });
      await loadActiveApplication();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to transition status',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. ADMIN: REQUEST CORRECTIONS
  const handleRequestCorrections = async () => {
    if (!application || !currentUser) return;
    if (!correctionFeedback.trim()) {
      setFeedback({
        type: 'error',
        text: 'Please specify the correction details for the student.',
      });
      return;
    }

    setIsActionLoading(true);
    setFeedback(null);
    try {
      await createCorrectionRequest(
        application.id,
        currentUser.id,
        correctionFeedback.trim(),
        'novelty_features'
      );
      await transitionApplicationStatus(
        application.id,
        'corrections_required',
        currentUser,
        'Dorelal Ji requested specific clarifications on novelty and prior art.'
      );
      setCorrectionFeedback('');
      setFeedback({
        type: 'success',
        text: 'Corrections Requested dispatched to the student.',
      });
      await loadActiveApplication();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to request corrections',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // 5. STUDENT: RESUBMIT APPLICATION
  const handleResubmit = async () => {
    if (!application || !currentUser) return;
    if (!confirmChecklist) {
      setFeedback({
        type: 'error',
        text: 'Please check the box confirming you have addressed all requested modifications.',
      });
      return;
    }

    setIsActionLoading(true);
    setFeedback(null);
    try {
      // Save modified fields
      await saveDraftApplication(
        {
          id: application.id,
          title,
          technical_field: technicalField,
          background_problem: backgroundProblem,
          description,
          novelty_features: noveltyFeatures,
          practical_applications: practicalApplications,
        },
        inventors,
        currentUser.id
      );

      // Resubmit: Same application ID, version increments to v2, preserves history
      await resubmitApplication(
        application.id,
        currentUser.id,
        resubmissionNote.trim() || 'Student updated novelty claims and expanded prior art differentiation.'
      );

      setResubmissionNote('');
      setConfirmChecklist(false);
      setFeedback({
        type: 'success',
        text: `Application resubmitted successfully with same ID (${application.reference_number}) as Version ${application.current_version + 1}!`,
      });
      await loadActiveApplication();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Resubmission failed',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // 6. ADMIN: APPROVE FOR NEXT STAGE
  const handleApprove = async () => {
    if (!application || !currentUser) return;
    setIsActionLoading(true);
    setFeedback(null);
    try {
      await transitionApplicationStatus(
        application.id,
        'approved_next_stage',
        currentUser,
        'Approved by Coordinator Dorelal Ji for internal patent filing cell processing.'
      );
      setFeedback({
        type: 'success',
        text: 'Application officially Approved for Next Stage by Coordinator Dorelal Ji!',
      });
      await loadActiveApplication();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Approval failed',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // File upload
  const handleFileUpload = async (category: DocumentCategory, file: File) => {
    if (!application || !currentUser) return;
    try {
      await uploadDocument(application.id, file, category, currentUser.id);
      setFeedback({
        type: 'success',
        text: `Document "${file.name}" uploaded to private storage.`,
      });
      await loadActiveApplication();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Upload failed',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <p>Loading patent pipeline portal...</p>
      </div>
    );
  }

  const isStudent = currentUser?.role === 'student';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="container container-narrow">
      {/* Persona Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-medium)',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Active Perspective:
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => switchUserRoleForTesting('student')}
              className={`btn btn-sm ${isStudent ? 'btn-primary' : 'btn-outline'}`}
            >
              <User size={14} /> Student (Aditya Sharma)
            </button>
            <button
              type="button"
              onClick={() => switchUserRoleForTesting('admin')}
              className={`btn btn-sm ${isAdmin ? 'btn-secondary' : 'btn-outline'}`}
              style={{ borderColor: isAdmin ? 'var(--text-primary)' : 'var(--border-medium)' }}
            >
              <Shield size={14} /> Admin Coordinator (Dorelal Ji)
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStartFreshDemo}
          className="btn btn-outline btn-sm"
          disabled={isActionLoading}
        >
          <RotateCcw size={13} /> Reset Pipeline Demo
        </button>
      </div>

      {feedback && (
        <div
          className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`}
          style={{ marginBottom: '24px' }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <div>{feedback.text}</div>
        </div>
      )}

      {/* 1. VISUAL FLOWCHART (The Exact Pipeline Diagram) */}
      {application && (
        <PipelineFlowchart
          currentStatus={application.status}
          currentVersion={application.current_version}
        />
      )}

      {/* 2. ACTIVE STAGE WORKSPACE */}
      {application ? (
        <div className="card" style={{ marginBottom: '28px' }}>
          <div className="card-header" style={{ justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Application ID: {application.id}
              </span>
              <h3 className="card-title" style={{ marginTop: '2px' }}>
                Reference: {application.reference_number} (v{application.current_version})
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Status:</span>
              <div style={{ fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', fontSize: '0.8125rem' }}>
                {application.status.replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          <div className="card-body">
            {/* STAGE A: DRAFT WORKSPACE */}
            {application.status === 'draft' && (
              <div>
                <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                  <strong>Stage 1 - Draft:</strong> You can edit and save your invention disclosure at any time. When ready, click "Submit Application" to forward it to Dorelal Ji for review.
                </div>

                <div className="form-group">
                  <label className="form-label">Invention Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Technical Field / Domain</label>
                  <input
                    type="text"
                    className="form-control"
                    value={technicalField}
                    onChange={(e) => setTechnicalField(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Problem Statement</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={backgroundProblem}
                    onChange={(e) => setBackgroundProblem(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Description</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Novelty Features</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={noveltyFeatures}
                    onChange={(e) => setNoveltyFeatures(e.target.value)}
                  />
                </div>

                {/* Document Attachments */}
                <div style={{ marginBottom: '20px' }}>
                  <label className="form-label">Supporting Documents</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                      <Upload size={14} /> Attach Specification (PDF)
                      <input
                        type="file"
                        accept=".pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload('complete_specification', e.target.files[0]);
                        }}
                      />
                    </label>
                    <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                      <Upload size={14} /> Attach Drawings (PNG/PDF)
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload('drawings', e.target.files[0]);
                        }}
                      />
                    </label>
                  </div>
                  {application.application_documents && application.application_documents.length > 0 && (
                    <div style={{ marginTop: '10px', fontSize: '0.8125rem', color: 'var(--color-success)' }}>
                      Attached: {application.application_documents.map((d) => d.original_filename).join(', ')}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="btn btn-outline"
                    disabled={isActionLoading}
                  >
                    <Save size={15} /> Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="btn btn-primary"
                    disabled={isActionLoading}
                  >
                    <Send size={15} /> Submit Application
                  </button>
                </div>
              </div>
            )}

            {/* STAGE B: SUBMITTED WORKSPACE */}
            {application.status === 'submitted' && (
              <div>
                <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                  <strong>Stage 2 - Submitted:</strong> Application has been dispatched for coordinator review.
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h4>Invention: {application.title}</h4>
                  <p style={{ marginTop: '4px', fontSize: '0.875rem' }}>{application.description}</p>
                </div>

                {isStudent && (
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Awaiting coordinator pre-screening by Dorelal Ji. Switch to <strong>Admin Mode</strong> above to experience the coordinator examination step.
                  </div>
                )}

                {isAdmin && (
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '6px',
                    }}
                  >
                    <h4 style={{ marginBottom: '6px' }}>Coordinator Action (Dorelal Ji):</h4>
                    <p style={{ fontSize: '0.875rem', marginBottom: '14px' }}>
                      Click below to open the formal examination phase for this disclosure.
                    </p>
                    <button
                      type="button"
                      onClick={handleStartReview}
                      className="btn btn-primary"
                      disabled={isActionLoading}
                    >
                      <Eye size={15} /> Start Examination (Move to Under Review)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STAGE C: UNDER REVIEW WORKSPACE */}
            {application.status === 'under_review' && (
              <div>
                <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
                  <strong>Stage 3 - Under Review:</strong> Admin (Dorelal Ji) is currently examining the patent disclosure.
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h4>{application.title}</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <strong>Problem:</strong> {application.background_problem}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <strong>Novelty:</strong> {application.novelty_features}
                  </p>
                </div>

                {isStudent ? (
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    Coordinator Dorelal Ji is examining your disclosure. Switch to <strong>Admin Mode</strong> in the top bar to simulate the coordinator's decision.
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '18px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '6px',
                    }}
                  >
                    <h4 style={{ marginBottom: '12px' }}>Coordinator Decision (Dorelal Ji):</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">
                          Specific Correction Notes (If requesting revisions):
                        </label>
                        <textarea
                          className="form-control"
                          rows={2}
                          placeholder="e.g. Please clarify the impedance matching novelty in Section 5 and attach higher resolution circuit drawings."
                          value={correctionFeedback}
                          onChange={(e) => setCorrectionFeedback(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={handleRequestCorrections}
                          className="btn btn-danger"
                          disabled={isActionLoading || !correctionFeedback.trim()}
                        >
                          <AlertTriangle size={15} /> Request Corrections
                        </button>
                        <button
                          type="button"
                          onClick={handleApprove}
                          className="btn btn-secondary"
                          disabled={isActionLoading}
                        >
                          <CheckCircle2 size={15} /> Approve for Next Stage
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STAGE D: CORRECTIONS REQUIRED WORKSPACE */}
            {application.status === 'corrections_required' && (
              <div>
                <div
                  className="alert alert-danger"
                  style={{
                    backgroundColor: 'rgba(234, 88, 12, 0.1)',
                    borderColor: '#f97316',
                    color: '#c2410c',
                    marginBottom: '20px',
                  }}
                >
                  <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Stage 4 - Corrections Required:</strong> The patent coordinator has requested specific revisions before this application can be approved.
                  </div>
                </div>

                {/* Display itemized comments */}
                {application.correction_requests && application.correction_requests.length > 0 && (
                  <div
                    style={{
                      padding: '14px 18px',
                      backgroundColor: '#fff7ed',
                      border: '1px solid #fed7aa',
                      borderRadius: '6px',
                      marginBottom: '20px',
                    }}
                  >
                    <strong style={{ fontSize: '0.875rem', color: '#c2410c' }}>
                      Coordinator Comment from Dorelal Ji:
                    </strong>
                    <p style={{ margin: '6px 0 0', fontSize: '0.9375rem', color: '#7c2d12' }}>
                      "{application.correction_requests[application.correction_requests.length - 1].comment}"
                    </p>
                  </div>
                )}

                {/* Student In-Place Editing */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '10px' }}>Edit Same Application (In-Place Revision):</h4>

                  <div className="form-group">
                    <label className="form-label">Novelty Characteristics (Address coordinator comments)</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={noveltyFeatures}
                      onChange={(e) => setNoveltyFeatures(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Detailed Description</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Resubmission Summary (What changed in this revision?)</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="e.g. Expanded the explanation of dual-stage switching circuitry and prior art distinctions."
                      value={resubmissionNote}
                      onChange={(e) => setResubmissionNote(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '14px 0' }}>
                    <input
                      id="confirmCheck"
                      type="checkbox"
                      checked={confirmChecklist}
                      onChange={(e) => setConfirmChecklist(e.target.checked)}
                    />
                    <label htmlFor="confirmCheck" style={{ fontSize: '0.875rem' }}>
                      I confirm that all requested corrections have been addressed and verified.
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                  <button
                    type="button"
                    onClick={handleResubmit}
                    className="btn btn-primary"
                    disabled={isActionLoading || !confirmChecklist}
                  >
                    <Send size={15} /> Resubmit Application (Creates Version {application.current_version + 1})
                  </button>
                </div>
              </div>
            )}

            {/* STAGE E: RESUBMITTED (ADMIN REVIEWS AGAIN) */}
            {application.status === 'resubmitted' && (
              <div>
                <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                  <strong>Stage 5 - Student Edits and Resubmits:</strong> Application has been resubmitted with the same ID ({application.reference_number}) as Version {application.current_version}.
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h4>{application.title} (Version {application.current_version})</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {application.novelty_features}
                  </p>
                </div>

                {isAdmin ? (
                  <div
                    style={{
                      padding: '18px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '6px',
                    }}
                  >
                    <h4 style={{ marginBottom: '10px' }}>Admin Reviews Again (Dorelal Ji):</h4>
                    <p style={{ fontSize: '0.875rem', marginBottom: '14px' }}>
                      Verify the student's updated version. You can either request further revisions or grant final internal approval.
                    </p>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={handleApprove}
                        className="btn btn-secondary"
                        disabled={isActionLoading}
                      >
                        <CheckCircle2 size={15} /> Approve for Next Stage
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCorrectionFeedback('Further clarification required.');
                          handleRequestCorrections();
                        }}
                        className="btn btn-outline"
                        disabled={isActionLoading}
                      >
                        Request Further Corrections
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    Version {application.current_version} has been received by Dorelal Ji. Switch to <strong>Admin Mode</strong> in the top bar to review and approve.
                  </div>
                )}
              </div>
            )}

            {/* STAGE F: APPROVED FOR NEXT STAGE */}
            {application.status === 'approved_next_stage' && (
              <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: 'var(--color-success)',
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--color-success)', marginBottom: '8px' }}>
                  Approved for Next Stage
                </h3>
                <p style={{ maxWidth: '540px', margin: '0 auto 20px', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                  Application <strong>{application.reference_number}</strong> has successfully cleared coordinator pre-screening by Dorelal Ji and has been authorized for forward processing into statutory patent drafting.
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    maxWidth: '560px',
                    margin: '0 auto',
                    fontSize: '0.8125rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <strong>University Legal Disclaimer:</strong> Internal approval authorizes the disclosure for forward processing into statutory patent drafting. It does not constitute a legally granted patent from the Indian Patent Office (IPO).
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <h3>No Active Application</h3>
          <p style={{ margin: '8px 0 20px', color: 'var(--text-muted)' }}>
            Click below to create an application and walk through the entire pipeline.
          </p>
          <button type="button" onClick={handleStartFreshDemo} className="btn btn-primary">
            <PlusCircle size={16} /> Create Sample Application
          </button>
        </div>
      )}

      {/* 3. IMMUTABLE VERSION HISTORY & AUDIT TRAIL */}
      <div className="card" style={{ marginBottom: '40px' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="var(--accent-primary)" />
            <h3 className="card-title" style={{ margin: 0 }}>
              Immutable Version History & Previous Submissions ({versions.length})
            </h3>
          </div>
        </div>
        <div className="card-body">
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            The database retains all previous submissions and snapshot records. Nothing is overwritten without an audit trail of what changed.
          </p>

          {versions.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              No submitted version snapshots recorded yet. When you submit or resubmit, an immutable snapshot will appear here.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {versions.map((ver) => (
                <div
                  key={ver.id}
                  style={{
                    padding: '14px 16px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        Version {ver.version_number}
                      </span>
                      <strong style={{ fontSize: '0.875rem' }}>
                        {ver.submission_notes || 'Submission recorded'}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(ver.submitted_at).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Title: <strong>{(ver.snapshot_data as any)?.title || 'Untitled'}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Novelty: {(ver.snapshot_data as any)?.novelty_features || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
