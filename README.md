# MUJ Patent Application Portal

An institutional intellectual property disclosure and patent management system developed for Manipal University Jaipur (MUJ).

The portal replaces manual email attachments to the university patent coordinator and review cell, providing a structured, secure, and transparent workflow for students, faculty inventors, and university administration.

> **Institutional Notice**: This portal manages internal university patent pre-screening and coordinator review. Internal coordinator approval authorizes the disclosure for forward processing into statutory patent drafting. It does not constitute a legally granted patent from the Indian Patent Office (IPO) or Controller General of Patents, Designs and Trade Marks (CGPDTM).

---

## Table of Contents
1. [Project Overview & Key Capabilities](#1-project-overview--key-capabilities)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture & Database Schema](#3-system-architecture--database-schema)
4. [Application Lifecycle & State Machine](#4-application-lifecycle--state-machine)
5. [Local Development & Setup Guide](#5-local-development--setup-guide)
6. [Database Migrations & Row Level Security (RLS)](#6-database-migrations--row-level-security-rls)
7. [Authentication & Admin Role Provisioning](#7-authentication--admin-role-provisioning)
8. [Private Document Storage & Security](#8-private-document-storage--security)
9. [Automated Testing & Security Verification](#9-automated-testing--security-verification)
10. [Production Deployment & Custom Domain Setup](#10-production-deployment--custom-domain-setup)
11. [Privacy Policy Review Checklist](#11-privacy-policy-review-checklist)
12. [Security Review Checklist](#12-security-review-checklist)
13. [Remaining University Configuration Steps](#13-remaining-university-configuration-steps)

---

## 1. Project Overview & Key Capabilities

- **Institutional Identity & Email Verification**: Supports verified university single sign-in (exclusively `@muj.manipal.edu`).
- **Structured Multi-Step Disclosure Form**: 8-section form capturing applicant details, co-inventors, problem statement, technical description, novelty claims, and practical utility.
- **Draft Autosave & Incomplete Progress**: Students can save draft disclosures at any stage without mandatory validation blocking.
- **Private Document Management**: Complete specifications (PDF/DOCX), technical drawings (PDF/PNG), and guide NOCs are stored in private storage with short-lived (15-minute) signed access URLs.
- **Itemized Correction Workspace**: When the coordinator requests changes, students view exact field or document comments, edit the same application in place, replace flawed files, confirm resolution, and resubmit.
- **Strict Role-Based Access Control**: Student isolation prevents viewing or editing another student's disclosure. The Patent Coordinator has authorized administrative oversight over all departmental submissions.
- **Complete Audit Trail**: Immutable submission snapshots, status transition logs, actor IDs, reasons, and timestamps.
- **Zero AI or Template Gimmicks**: Restrained editorial UI (slate/navy palette, rectangular buttons, Inter typography, no purple gradients, no em dashes, no fake metrics).

---

## 2. Technology Stack

- **Programming Language**: TypeScript (Strict typing, `verbatimModuleSyntax`, zero `.js`/`.jsx` files).
- **Frontend Framework**: React 19 with Vite.
- **Routing**: React Router DOM (v7).
- **Form Validation**: React Hook Form with Zod schemas.
- **Styling**: Tailored institutional CSS design system (`src/styles/design-system.css`).
- **Icons**: Lucide React.
- **Backend & Database**: Supabase PostgreSQL with Row Level Security (RLS) and custom PL/pgSQL security functions.
- **File Storage**: Private Supabase Storage bucket (`patent-documents`).
- **Testing**: Vitest with `@testing-library/react` and JSDOM.

---

## 3. System Architecture & Database Schema

### Database Entity Relational Overview

```
+-----------------------------------------------------------------------------------+
|                                     PROFILES                                      |
|  id (UUID PK) | university_email | full_name | role (student|admin) | department  |
+-----------------------------------------------------------------------------------+
       | 1
       |
       | owns
       v *
+-----------------------------------------------------------------------------------+
|                                   APPLICATIONS                                    |
|  id (UUID PK) | reference_number (UK) | owner_id (FK) | title | technical_field   |
|  background_problem | description | novelty_features | practical_applications      |
|  status (application_status enum) | current_version | submitted_at | timestamps   |
+-----------------------------------------------------------------------------------+
       |                   |                   |                     |
       | 1..*              | 0..*              | 1..*                | 0..*
       v                   v                   v                     v
+---------------+  +------------------+  +-------------------+  +-------------------+
|   INVENTORS   |  |   DOCUMENTS      |  |     VERSIONS      |  |    CORRECTIONS    |
| full_name     |  | storage_path     |  | version_number    |  | reviewer_id (FK)  |
| email         |  | category         |  | snapshot_data     |  | field_name        |
| affiliation   |  | file_size_bytes  |  | submitted_by (FK) |  | comment           |
| is_primary    |  | mime_type        |  | submitted_at      |  | status (pending|  |
| department    |  | version_number   |  | submission_notes  |  |  addressed)       |
+---------------+  +------------------+  +-------------------+  +-------------------+
```

### Core Entities Defined:
1. `profiles`: Connected to `auth.users`, records full name, role (`student` or `admin`), department, registration/employee number.
2. `applications`: Core record holding reference numbers (format: `MUJ-PAT-YYYY-XXXX`), ownership, structured claims, version counter, and state.
3. `inventors`: Normalized multi-inventor table supporting lead inventors and co-inventors with academic or external affiliations.
4. `application_documents`: Tracks document categories, storage keys, MIME types, and file sizes.
5. `application_versions`: Immutable JSONB snapshots captured upon initial submission and subsequent resubmissions.
6. `correction_requests`: Itemized reviewer feedback linked to specific application fields or documents.
7. `application_comments`: General or internal coordinator review notes.
8. `application_status_history`: Complete audit log of lifecycle changes, actors, reasons, and timestamps.
9. `notifications`: In-portal notification records delivered for review events and status updates.

---

## 4. Application Lifecycle & State Machine

Status transitions are governed by strict state machine rules:

```
[Draft] ----------> [Submitted] ----------> [Under Review]
 (Student)            (Student)                (Coordinator / Admin)
                                                   |
                        +--------------------------+--------------------------+
                        |                                                     |
                        v                                                     v
              [Corrections Required]                                [Approved for Next Stage]
             (Coordinator / Admin)                                 (Coordinator / Admin)
                        |
                        | (Student fixes issues)
                        v
                  [Resubmitted]
                   (Version +1)
                        |
                        v
                 [Under Review]
```

### Permitted Transitions:
- `draft` to `submitted`: Allowed for applicant owner when all mandatory fields are present.
- `submitted` to `under_review`: Allowed for coordinator / admin.
- `under_review` to `corrections_required`: Allowed for coordinator with itemized feedback.
- `corrections_required` to `resubmitted`: Allowed for student owner upon resolving all pending items.
- `resubmitted` to `under_review`: Allowed for coordinator / admin.
- `under_review` to `approved_next_stage`: Allowed for coordinator for internal patent cell forwarding.

---

## 5. Local Development & Setup Guide

### Prerequisites
- Node.js version 18 or newer (tested on Node v24).
- npm version 9 or newer.

### Installation Steps
```bash
# 1. Clone or navigate to the repository
cd c:/Users/Lenovo/Desktop/ecell

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Start the local development server
npm run dev
```

The portal will open at `http://localhost:5173`.

### Interactive Test Personas
The application includes a built-in top notification bar with instant persona switching for testing:
- **Student View**: Operates as applicant `Aditya Sharma` (`aditya.sharma@muj.manipal.edu`).
- **Admin View**: Operates as coordinator `Patent Coordinator` (`patent.admin@muj.manipal.edu`).

---

## 6. Database Migrations & Row Level Security (RLS)

All database tables, enums, triggers, and Row Level Security policies are located in:
`supabase/migrations/001_initial_schema.sql`

### Applying Migrations to Live Supabase:
1. Log in to the [Supabase Dashboard](https://app.supabase.com).
2. Open your project and navigate to the **SQL Editor**.
3. Open `supabase/migrations/001_initial_schema.sql`, paste its contents into the editor, and click **Run**.
4. All tables, sequences (`patent_ref_seq`), triggers, and RLS policies will be created automatically.

### RLS Policies Summary:
- **Default Deny**: All tables require explicit policies.
- **Student Isolation**: `SELECT` and `UPDATE` on `applications` require `owner_id = auth.uid()` unless the user has `role = 'admin'`.
- **Privilege Protection**: The `trigger_profile_role_protect` trigger rejects any attempt by non-admins to alter their `role` column.
- **Audit Logging**: The `trigger_application_audit` trigger writes an immutable record to `application_status_history` on every status change.

---

## 7. Authentication & Admin Role Provisioning

### Student Authentication
- Students sign in with their university email address (strictly `@muj.manipal.edu`).
- On initial sign-in via Supabase Auth, the database trigger `on_auth_user_created` creates a corresponding record in `profiles` with default role `student`.

### Patent Coordinator (Admin) Provisioning
To assign administrator status to the patent coordinator:
1. In the Supabase SQL Editor, execute the secure database function:
```sql
SELECT provision_admin_account('patent.admin@muj.manipal.edu');
```
2. This assigns `role = 'admin'` to the coordinator's profile.
3. Because role assignments are protected by database triggers and security definer functions, students cannot grant themselves admin rights.

---

## 8. Private Document Storage & Security

- **Bucket Name**: `patent-documents`
- **Visibility**: Strictly Private (Public access disabled).
- **Allowed MIME Types**: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `image/png`, `image/jpeg`.
- **Maximum File Size**: 25 Megabytes (enforced on both client and database bucket policies).
- **Access Authorization**: Storage objects can only be downloaded by the application owner or authorized Patent Coordinator using 15-minute short-lived signed URLs generated via `createSignedUrl()`.

---

## 9. Automated Testing & Security Verification

The test suite is built on Vitest and covers validation schemas, workflow state transitions, API data operations, and security attack vectors.

### Running Automated Tests:
```bash
npm test
```

### Test Coverage Highlights:
1. **Schema Validation (`src/test/schemas.test.ts`)**:
   - Validates multi-inventor data, character length bounds, email formats.
2. **Workflow State Machine (`src/test/workflow.test.ts`)**:
   - Enforces valid transition paths and blocks unauthorized jumps.
3. **Data Access & Versioning (`src/test/api.test.ts`)**:
   - Tests draft creation, auto-generated reference numbers, formal submission, and version incrementing on resubmission.
4. **Security & Authorization (`src/test/security.test.ts`)**:
   - Verifies student-to-student data isolation (Student A cannot read Student B's disclosure).
   - Verifies privilege escalation prevention (students cannot change role to admin).
   - Verifies students cannot approve their own submissions.
   - Verifies oversized uploads (>25MB) and forbidden executable MIME types are rejected.

---

## 10. Production Deployment & Custom Domain Setup

### Frontend Build Command:
```bash
npm run build
```
The compiled production bundle is generated in `dist/`.

### Hosting Deployment:
1. Deploy the `dist/` directory to your university hosting platform (e.g. Vercel, Netlify, Cloudflare Pages, or institutional Nginx server).
2. Configure single-page application fallback routing so that all paths redirect to `index.html`.

### Custom Domain Configuration (e.g. `patents.muj.manipal.edu`):
1. In your university DNS management console, create a CNAME record:
   - **Host / Name**: `patents` (or `ipr`)
   - **Value / Target**: The CNAME provided by your hosting provider.
2. In Supabase Dashboard:
   - Navigate to **Authentication > URL Configuration**.
   - Add `https://patents.muj.manipal.edu` to **Site URL** and **Redirect URLs**.
3. SSL certificate will automatically provision over HTTPS.

---

## 11. Privacy Policy Review Checklist

Before opening the portal to students, the MUJ Legal & Registrar team should review institutional privacy guidelines:
- [ ] Confirm official institutional email address for patent queries (`patent.admin@muj.manipal.edu`).
- [ ] Validate data retention schedule for approved disclosures (recommended: 7 years).
- [ ] Confirm retention and cleanup policy for abandoned drafts (recommended: 12 months).
- [ ] Verify escalation contact address for data protection queries (`registrar@muj.manipal.edu`).

---

## 12. Security Review Checklist

- [ ] Confirm that `VITE_SUPABASE_ANON_KEY` is the only client-exposed credential. Never commit the `service_role` secret to frontend code or GitHub.
- [ ] Ensure that `patent-documents` storage bucket is set to `public = false`.
- [ ] Verify that the coordinator account is provisioned with `role = 'admin'`.
- [ ] Check that Row Level Security (RLS) is enabled on all tables in production.
- [ ] Verify that production domain redirect URLs are locked in Supabase Auth settings.

---

## 13. Remaining University Configuration Steps

1. **Connect Live Supabase Instance**:
   - Replace placeholder credentials in `.env` with actual values from your project dashboard (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).
2. **Execute Initial Migration**:
   - Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor.
3. **Provision Patent Coordinator Account**:
   - Run `SELECT provision_admin_account('patent.admin@muj.manipal.edu');`.
4. **Institutional Single Sign-On (SSO)**:
   - (Optional) Configure Microsoft Entra ID or Google Workspace SSO in Supabase Auth to enable one-click MUJ student authentication.
5. **DNS & Custom Domain**:
   - Bind `patents.muj.manipal.edu` and verify SSL certificate.
