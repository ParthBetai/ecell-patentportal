import React from 'react';
import type { ApplicationStatus } from '../types/database.types';
import {
  CheckCircle2,
  MessageSquare,
  ArrowDown,
  FileEdit,
  Send,
  Eye,
  RefreshCw,
  Layers,
} from 'lucide-react';

interface PipelineFlowchartProps {
  currentStatus: ApplicationStatus;
  currentVersion: number;
}

export const PipelineFlowchart: React.FC<PipelineFlowchartProps> = ({
  currentStatus,
  currentVersion,
}) => {
  // Determine if a stage is active, completed, or upcoming
  const isDraftActive = currentStatus === 'draft';
  const isSubmittedActive = currentStatus === 'submitted';
  const isUnderReviewActive = currentStatus === 'under_review' && currentVersion === 1;
  const isApprovedActive = currentStatus === 'approved_next_stage';
  const isCorrectionsActive = currentStatus === 'corrections_required';
  const isResubmittedActive = currentStatus === 'resubmitted';
  const isAdminReviewAgainActive = currentStatus === 'under_review' && currentVersion > 1;

  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        padding: '28px 24px',
        color: '#f8fafc',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
        marginBottom: '28px',
        border: '1px solid #1e293b',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #334155',
          paddingBottom: '14px',
          marginBottom: '24px',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#38bdf8',
            }}
          >
            Core Correction & Review Pipeline
          </span>
          <h2 style={{ fontSize: '1.25rem', margin: '2px 0 0', color: '#ffffff' }}>
            Application Lifecycle Tracker
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '0.8125rem',
              color: '#94a3b8',
            }}
          >
            <Layers size={14} color="#38bdf8" />
            Active Version: <strong style={{ color: '#ffffff' }}>v{currentVersion}</strong>
          </span>
        </div>
      </div>

      {/* Main Flowchart Column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '620px',
          margin: '0 auto',
        }}
      >
        {/* STAGE 1: Draft */}
        <div
          style={{
            width: '100%',
            padding: '14px 20px',
            backgroundColor: isDraftActive ? '#1e293b' : '#0b1120',
            border: isDraftActive ? '2px solid #38bdf8' : '1px solid #334155',
            borderRadius: '6px',
            textAlign: 'center',
            boxShadow: isDraftActive ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <FileEdit size={16} color={isDraftActive ? '#38bdf8' : '#94a3b8'} />
            <strong style={{ fontSize: '1rem', color: isDraftActive ? '#38bdf8' : '#ffffff' }}>
              Draft
            </strong>
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '3px' }}>
            Student can save and edit.
          </div>
        </div>

        {/* Arrow Down */}
        <div style={{ padding: '8px 0', color: isDraftActive || isSubmittedActive ? '#38bdf8' : '#64748b' }}>
          <ArrowDown size={18} />
        </div>

        {/* STAGE 2: Submitted */}
        <div
          style={{
            width: '100%',
            padding: '14px 20px',
            backgroundColor: isSubmittedActive ? '#1e293b' : '#0b1120',
            border: isSubmittedActive ? '2px solid #38bdf8' : '1px solid #334155',
            borderRadius: '6px',
            textAlign: 'center',
            boxShadow: isSubmittedActive ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Send size={16} color={isSubmittedActive ? '#38bdf8' : '#94a3b8'} />
            <strong style={{ fontSize: '1rem', color: isSubmittedActive ? '#38bdf8' : '#ffffff' }}>
              Submitted
            </strong>
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '3px' }}>
            Application is sent for review.
          </div>
        </div>

        {/* Arrow Down */}
        <div style={{ padding: '8px 0', color: isSubmittedActive || isUnderReviewActive ? '#38bdf8' : '#64748b' }}>
          <ArrowDown size={18} />
        </div>

        {/* STAGE 3: Under Review */}
        <div
          style={{
            width: '100%',
            padding: '14px 20px',
            backgroundColor: isUnderReviewActive ? '#1e293b' : '#0b1120',
            border: isUnderReviewActive ? '2px solid #f59e0b' : '1px solid #334155',
            borderRadius: '6px',
            textAlign: 'center',
            boxShadow: isUnderReviewActive ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Eye size={16} color={isUnderReviewActive ? '#f59e0b' : '#94a3b8'} />
            <strong style={{ fontSize: '1rem', color: isUnderReviewActive ? '#f59e0b' : '#ffffff' }}>
              Under Review
            </strong>
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '3px' }}>
            Admin examines the application.
          </div>
        </div>

        {/* Arrow Down */}
        <div style={{ padding: '8px 0', color: '#64748b' }}>
          <ArrowDown size={18} />
        </div>

        {/* STAGE 4: Decision Split (Approved vs Corrections Required) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', width: '100%' }}>
          {/* Approved Path */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: isApprovedActive ? 'rgba(22, 163, 74, 0.2)' : '#0b1120',
              border: isApprovedActive ? '2px solid #22c55e' : '1px solid #334155',
              borderRadius: '6px',
              textAlign: 'center',
              boxShadow: isApprovedActive ? '0 0 14px rgba(34, 197, 94, 0.35)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
              <CheckCircle2 size={16} color="#22c55e" />
              <strong style={{ fontSize: '0.9375rem', color: '#22c55e' }}>
                Approved for next stage
              </strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Internal university clearance granted.
            </div>
          </div>

          {/* Corrections Required Path */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: isCorrectionsActive ? 'rgba(234, 88, 12, 0.2)' : '#0b1120',
              border: isCorrectionsActive ? '2px solid #f97316' : '1px solid #334155',
              borderRadius: '6px',
              textAlign: 'center',
              boxShadow: isCorrectionsActive ? '0 0 14px rgba(249, 115, 22, 0.35)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
              <MessageSquare size={16} color="#f97316" />
              <strong style={{ fontSize: '0.9375rem', color: '#f97316' }}>
                Corrections Required
              </strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Specific comments and issues logged.
            </div>
          </div>
        </div>

        {/* Arrow Down from Corrections */}
        <div style={{ padding: '8px 0', color: isCorrectionsActive || isResubmittedActive ? '#f97316' : '#64748b' }}>
          <ArrowDown size={18} />
        </div>

        {/* STAGE 5: Student edits and resubmits */}
        <div
          style={{
            width: '100%',
            padding: '14px 20px',
            backgroundColor: isResubmittedActive ? '#1e293b' : '#0b1120',
            border: isResubmittedActive ? '2px solid #a855f7' : '1px solid #334155',
            borderRadius: '6px',
            textAlign: 'center',
            boxShadow: isResubmittedActive ? '0 0 12px rgba(168, 85, 247, 0.3)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <RefreshCw size={16} color={isResubmittedActive ? '#a855f7' : '#94a3b8'} />
            <strong style={{ fontSize: '1rem', color: isResubmittedActive ? '#a855f7' : '#ffffff' }}>
              Student edits and resubmits
            </strong>
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '3px' }}>
            Same application ID; updated version and correction history.
          </div>
        </div>

        {/* Arrow Down */}
        <div style={{ padding: '8px 0', color: isResubmittedActive || isAdminReviewAgainActive ? '#a855f7' : '#64748b' }}>
          <ArrowDown size={18} />
        </div>

        {/* STAGE 6: Admin reviews again */}
        <div
          style={{
            width: '100%',
            padding: '14px 20px',
            backgroundColor: isAdminReviewAgainActive ? '#1e293b' : '#0b1120',
            border: isAdminReviewAgainActive ? '2px solid #f59e0b' : '1px solid #334155',
            borderRadius: '6px',
            textAlign: 'center',
            boxShadow: isAdminReviewAgainActive ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Eye size={16} color={isAdminReviewAgainActive ? '#f59e0b' : '#94a3b8'} />
            <strong style={{ fontSize: '1rem', color: isAdminReviewAgainActive ? '#f59e0b' : '#ffffff' }}>
              Admin reviews again
            </strong>
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '3px' }}>
            Can request further corrections or approve for the next stage.
          </div>
        </div>
      </div>

      {/* Institutional Database Guarantee Note */}
      <div
        style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #334155',
          fontSize: '0.8125rem',
          color: '#94a3b8',
          textAlign: 'center',
        }}
      >
        <span style={{ color: '#38bdf8', fontWeight: 600 }}>Database Guarantee:</span> The database retains all previous submissions, versions, and audit trails without overwriting past records.
      </div>
    </div>
  );
};
