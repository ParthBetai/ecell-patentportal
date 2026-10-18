import { ShieldCheck, AlertTriangle } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="container container-narrow">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', marginBottom: '8px' }}>
          <ShieldCheck size={20} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Directorate of Research & Innovation
          </span>
        </div>
        <h1 style={{ fontSize: '1.875rem', marginBottom: '8px' }}>
          Intellectual Property & Portal Privacy Policy
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Operational guidelines governing the confidentiality, retention, and access-control of patent disclosures at Manipal University Jaipur.
        </p>
      </div>

      {/* University Review Notice */}
      <div className="alert alert-warning" style={{ marginBottom: '32px' }}>
        <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Institutional Notice for Review:</strong> This document represents the operational privacy framework for the MUJ Patent Application Portal. Specific contact details, data retention schedules, and legal affiliations marked with <code>[PENDING UNIVERSITY CONFIRMATION]</code> must be formally validated by the MUJ Registrar and Legal Counsel prior to live production deployment.
        </div>
      </div>

      <div className="card" style={{ marginBottom: '32px' }}>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
              1. Information Collected by the Portal
            </h2>
            <p>
              The MUJ Patent Application Portal collects and processes information required for the institutional evaluation, verification, and pre-filing preparation of intellectual property disclosures:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <li><strong>Applicant & Identity Details:</strong> Student or faculty full name, university email address, academic department, student registration number or employee ID, and contact phone number.</li>
              <li><strong>Inventor Attribution:</strong> Names, affiliations (student, faculty, external collaborator), and departments of all registered co-inventors.</li>
              <li><strong>Technical Invention Disclosures:</strong> Proposed invention title, technical field, problem statement, prior art limitations, comprehensive technical description, novelty claims, and commercial utility.</li>
              <li><strong>Confidential Supporting Documents:</strong> Uploaded technical specifications, CAD schematics, block diagrams, flowcharts, and guide declarations.</li>
              <li><strong>System Audit Logs:</strong> Timestamps of draft saves, submissions, coordinator reviews, status transitions, and reviewer correction notes.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
              2. Purpose of Collection
            </h2>
            <p>
              Information is collected solely to enable the designated university patent coordinator (Dorelal Ji) and the Directorate of Research & Innovation to evaluate disclosure novelty, assess patentability, guide applicants through necessary corrections, and authorize internal university support for statutory filing with the Indian Patent Office (IPO). Data is never sold, leased, or utilized for commercial marketing.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
              3. Handling of Confidential Documents & Invention Descriptions
            </h2>
            <p>
              Patent ideas prior to formal filing with patent authorities are strictly confidential. To prevent public disclosure that could compromise novelty under patent law:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <li>Uploaded documents are stored in private storage buckets with no public URLs.</li>
              <li>Access to files requires authenticated server authorization; file downloads are issued exclusively via short-lived, signed URLs (15-minute expiration).</li>
              <li>Database records are isolated using PostgreSQL Row Level Security (RLS) policies.</li>
              <li>Invention disclosures are strictly excluded from public search indexes and external third-party AI training corpora.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
              4. Access Control and Authorization
            </h2>
            <p>
              Access to portal data is strictly restricted based on authenticated user identity:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <li><strong>Student Applicants:</strong> May view, edit, and access only applications where they are the verified owner. Students cannot access another applicant's disclosures or files.</li>
              <li><strong>University Patent Coordinator:</strong> Dorelal Ji holds designated administrative access to view submitted applications across departments, author correction requests, and update internal approval stages.</li>
              <li><strong>Server-Enforced Privileges:</strong> Administrative roles are provisioned through trusted backend database routines. No client-side modification of roles is permitted.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
              5. Data Retention Schedule
            </h2>
            <p>
              Application records, draft revisions, document versions, and review logs are retained according to university archival guidelines:
            </p>
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
              }}
            >
              <strong>Policy Placeholder:</strong> Active submissions and approved patent disclosures are retained for <code>[RETENTION PERIOD: PENDING UNIVERSITY CONFIRMATION - Proposed default: 7 years following graduation or publication]</code>. Inactive or abandoned drafts may be purged after <code>[DRAFT RETENTION: PENDING UNIVERSITY CONFIRMATION - Proposed default: 12 months]</code> with prior email notification to the applicant.
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
              6. Third-Party Infrastructure and Hosting
            </h2>
            <p>
              The portal operates on infrastructure provided by:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <li><strong>Database & Authentication:</strong> Supabase (PostgreSQL managed cloud database with SSL encryption in transit and AES-256 encryption at rest).</li>
              <li><strong>Frontend Hosting:</strong> Dedicated institutional hosting configured for custom domain mapping (e.g. <code>patents.jaipur.manipal.edu</code>).</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
              7. Contact Information and Incident Reporting
            </h2>
            <p>
              For questions concerning intellectual property disclosures, data accuracy, or confidentiality inquiries:
            </p>
            <div
              style={{
                padding: '14px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
              }}
            >
              <div><strong>Designated Patent Coordinator:</strong> Dorelal Ji</div>
              <div><strong>Office:</strong> Directorate of Research & Innovation / IPR Cell</div>
              <div><strong>Address:</strong> Manipal University Jaipur, Dehmi Kalan, Jaipur-Ajmer Expressway, Rajasthan 303007</div>
              <div><strong>Official Email:</strong> <code>[CONFIRMED CONTACT: dorelal@jaipur.manipal.edu]</code></div>
              <div><strong>Privacy Escalation Contact:</strong> <code>[PENDING UNIVERSITY CONFIRMATION: registrar@jaipur.manipal.edu]</code></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
