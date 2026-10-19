import { supabase, isSupabaseConfigured } from './supabase';
import type {
  Application,
  ApplicationComment,
  ApplicationDocument,
  ApplicationStatus,
  ApplicationStatusHistory,
  ApplicationVersion,
  AppRole,
  CorrectionRequest,
  DocumentCategory,
  InPortalNotification,
  Inventor,
  Profile,
} from '../types/database.types';
import { canTransition } from '../features/applications/workflow';

// Key for local persistent mock when live Supabase credentials are not connected
const STORAGE_PREFIX = 'muj_patent_portal_';

// Maximum upload file size: 25 Megabytes
export const MAX_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024;

// Allowed MIME types
export const ALLOWED_DOCUMENT_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];

// Seed initial profile for Patent Coordinator and a sample student for immediate interactive verification
function initLocalStorageIfNeeded() {
  const initialized = localStorage.getItem(`${STORAGE_PREFIX}initialized`);
  if (!initialized) {
    const adminUser: Profile = {
      id: 'admin-coordinator-uuid',
      university_email: 'patent.admin@muj.manipal.edu',
      full_name: 'Patent Coordinator',
      role: 'admin',
      department: 'Office of Dean Research / IPR Cell',
      registration_number: 'MUJ-FAC-IPR-001',
      phone: '+91 141 3999100',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const sampleStudent: Profile = {
      id: 'student-aditya-uuid',
      university_email: 'aditya.sharma@muj.manipal.edu',
      full_name: 'Aditya Sharma',
      role: 'student',
      department: 'Computer Science and Engineering',
      registration_number: '219301045',
      phone: '+91 9876543210',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const initialProfiles = [adminUser, sampleStudent];
    localStorage.setItem(`${STORAGE_PREFIX}profiles`, JSON.stringify(initialProfiles));

    // Initial sample application to facilitate instant review testing
    const sampleApp: Application = {
      id: 'app-seed-001',
      reference_number: 'MUJ-PAT-2026-0001',
      owner_id: sampleStudent.id,
      title: 'Adaptive Energy Harvesting Micro-Controller for Remote IoT Sensors',
      technical_field: 'Embedded Systems and Renewable Energy',
      background_problem:
        'Remote IoT nodes suffer from finite battery lifetimes requiring frequent physical replacement in harsh outdoor environments.',
      description:
        'An adaptive power-management circuit coupled with multi-source piezoelectric and photovoltaic transducers.',
      novelty_features:
        'A dual-stage hysteretic switching mechanism that dynamically scales impedance matching under varying ambient vibration.',
      practical_applications:
        'Long-range environmental monitoring, agricultural soil sensor grids, and industrial vibration telemetry.',
      status: 'submitted',
      current_version: 1,
      submitted_at: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    };

    const sampleInventors: Inventor[] = [
      {
        id: 'inv-seed-001',
        application_id: sampleApp.id,
        full_name: 'Aditya Sharma',
        email: 'aditya.sharma@muj.manipal.edu',
        phone: '+91 9876543210',
        affiliation_type: 'student',
        department: 'Computer Science and Engineering',
        is_primary: true,
        order_index: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: 'inv-seed-002',
        application_id: sampleApp.id,
        full_name: 'Dr. Anita Joshi',
        email: 'anita.joshi@muj.manipal.edu',
        phone: '+91 9876501234',
        affiliation_type: 'faculty',
        department: 'Electrical Engineering',
        is_primary: false,
        order_index: 1,
        created_at: new Date().toISOString(),
      },
    ];

    const sampleDocuments: ApplicationDocument[] = [
      {
        id: 'doc-seed-001',
        application_id: sampleApp.id,
        storage_path: `${sampleApp.id}/complete_specification_v1.pdf`,
        document_category: 'complete_specification',
        original_filename: 'complete_specification_v1.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: 1420500,
        version_number: 1,
        uploaded_by: sampleStudent.id,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'doc-seed-002',
        application_id: sampleApp.id,
        storage_path: `${sampleApp.id}/system_block_diagram.png`,
        document_category: 'drawings',
        original_filename: 'system_block_diagram.png',
        mime_type: 'image/png',
        file_size_bytes: 845200,
        version_number: 1,
        uploaded_by: sampleStudent.id,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    const sampleVersions: ApplicationVersion[] = [
      {
        id: 'ver-seed-001',
        application_id: sampleApp.id,
        version_number: 1,
        snapshot_data: { ...sampleApp, inventors: sampleInventors },
        submitted_by: sampleStudent.id,
        submitted_at: new Date(Date.now() - 86400000).toISOString(),
        submission_notes: 'Initial formal submission for coordinator pre-screening.',
      },
    ];

    const sampleHistory: ApplicationStatusHistory[] = [
      {
        id: 'hist-seed-001',
        application_id: sampleApp.id,
        from_status: null,
        to_status: 'draft',
        changed_by: sampleStudent.id,
        reason: 'Initial draft created by student.',
        created_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 'hist-seed-002',
        application_id: sampleApp.id,
        from_status: 'draft',
        to_status: 'submitted',
        changed_by: sampleStudent.id,
        reason: 'Submitted for internal review.',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    localStorage.setItem(`${STORAGE_PREFIX}applications`, JSON.stringify([sampleApp]));
    localStorage.setItem(`${STORAGE_PREFIX}inventors`, JSON.stringify(sampleInventors));
    localStorage.setItem(`${STORAGE_PREFIX}documents`, JSON.stringify(sampleDocuments));
    localStorage.setItem(`${STORAGE_PREFIX}versions`, JSON.stringify(sampleVersions));
    localStorage.setItem(`${STORAGE_PREFIX}history`, JSON.stringify(sampleHistory));
    localStorage.setItem(`${STORAGE_PREFIX}corrections`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_PREFIX}comments`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_PREFIX}notifications`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_PREFIX}ref_counter`, '1');
    localStorage.setItem(`${STORAGE_PREFIX}initialized`, 'true');
  }
}

// Read helper for local store
function getLocalItem<T>(key: string, defaultValue: T): T {
  initLocalStorageIfNeeded();
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

// Write helper for local store
function setLocalItem<T>(key: string, value: T): void {
  localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
}

// =============================================================================
// AUTHENTICATION & PROFILES API
// =============================================================================

export async function fetchCurrentProfile(userId: string): Promise<Profile | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.warn('Supabase fetchCurrentProfile failed, falling back to local store', error);
    } else if (data) {
      return data as Profile;
    }
  }

  const profiles = getLocalItem<Profile[]>('profiles', []);
  return profiles.find((p) => p.id === userId) || null;
}

export async function upsertProfile(profile: Partial<Profile> & { id: string; university_email: string }): Promise<Profile> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single();
    if (!error && data) return data as Profile;
  }

  const profiles = getLocalItem<Profile[]>('profiles', []);
  const index = profiles.findIndex((p) => p.id === profile.id);
  const now = new Date().toISOString();

  let updatedProfile: Profile;
  if (index >= 0) {
    // Preserve existing role to prevent client privilege escalation
    const existingRole = profiles[index].role;
    updatedProfile = {
      ...profiles[index],
      ...profile,
      role: existingRole,
      updated_at: now,
    };
    profiles[index] = updatedProfile;
  } else {
    // Determine default role: if matches designated admin email, grant admin
    const isAdminEmail = profile.university_email.toLowerCase() === 'patent.admin@muj.manipal.edu';
    updatedProfile = {
      id: profile.id,
      university_email: profile.university_email,
      full_name: profile.full_name || profile.university_email.split('@')[0],
      role: isAdminEmail ? 'admin' : (profile.role || 'student'),
      department: profile.department || null,
      registration_number: profile.registration_number || null,
      phone: profile.phone || null,
      created_at: now,
      updated_at: now,
    };
    profiles.push(updatedProfile);
  }

  setLocalItem('profiles', profiles);
  return updatedProfile;
}

// =============================================================================
// APPLICATIONS API
// =============================================================================

export async function fetchApplications(user: { id: string; role: AppRole }): Promise<Application[]> {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from('applications')
      .select('*, profiles(*)')
      .order('updated_at', { ascending: false });

    if (user.role !== 'admin') {
      query = query.eq('owner_id', user.id);
    }

    const { data, error } = await query;
    if (!error && data) return data as Application[];
  }

  const applications = getLocalItem<Application[]>('applications', []);
  const profiles = getLocalItem<Profile[]>('profiles', []);

  const results = applications
    .filter((app) => user.role === 'admin' || app.owner_id === user.id)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .map((app) => {
      const ownerProfile = profiles.find((p) => p.id === app.owner_id);
      return {
        ...app,
        profiles: ownerProfile,
      };
    });

  return results;
}

export async function fetchApplicationById(
  id: string,
  user: { id: string; role: AppRole }
): Promise<Application | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('applications')
      .select('*, profiles(*), inventors(*), application_documents(*), correction_requests(*), application_status_history(*)')
      .eq('id', id)
      .single();

    if (!error && data) {
      if (user.role !== 'admin' && data.owner_id !== user.id) {
        throw new Error('Access denied: You do not have permission to view this application.');
      }
      return data as Application;
    }
  }

  const applications = getLocalItem<Application[]>('applications', []);
  const app = applications.find((a) => a.id === id);
  if (!app) return null;

  // Enforce access control
  if (user.role !== 'admin' && app.owner_id !== user.id) {
    throw new Error('Access denied: You do not have permission to view this application.');
  }

  const profiles = getLocalItem<Profile[]>('profiles', []);
  const inventors = getLocalItem<Inventor[]>('inventors', []).filter((i) => i.application_id === id);
  const documents = getLocalItem<ApplicationDocument[]>('documents', []).filter((d) => d.application_id === id);
  const corrections = getLocalItem<CorrectionRequest[]>('corrections', []).filter((c) => c.application_id === id);
  const history = getLocalItem<ApplicationStatusHistory[]>('history', []).filter((h) => h.application_id === id);

  return {
    ...app,
    profiles: profiles.find((p) => p.id === app.owner_id),
    inventors,
    application_documents: documents,
    correction_requests: corrections,
    application_status_history: history.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
  };
}

export async function saveDraftApplication(
  data: Partial<Application>,
  inventorsList: Partial<Inventor>[],
  userId: string
): Promise<Application> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    let appId = data.id;
    if (!appId) {
      const { data: newApp, error: appError } = await supabase
        .from('applications')
        .insert({
          ...data,
          owner_id: userId,
          status: 'draft',
          current_version: 1,
        })
        .select()
        .single();
      if (appError) throw appError;
      appId = newApp.id;
    } else {
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          ...data,
          updated_at: now,
        })
        .eq('id', appId)
        .eq('owner_id', userId);
      if (updateError) throw updateError;
    }

    // Upsert inventors
    if (inventorsList.length > 0 && appId) {
      await supabase.from('inventors').delete().eq('application_id', appId);
      const inventorsToInsert = inventorsList.map((inv, idx) => ({
        ...inv,
        application_id: appId,
        order_index: idx,
      }));
      await supabase.from('inventors').insert(inventorsToInsert);
    }

    const { data: finalApp } = await supabase
      .from('applications')
      .select('*, inventors(*)')
      .eq('id', appId)
      .single();
    if (finalApp) return finalApp as Application;
  }

  // Local fallback
  const applications = getLocalItem<Application[]>('applications', []);
  const allInventors = getLocalItem<Inventor[]>('inventors', []);
  const counter = parseInt(localStorage.getItem(`${STORAGE_PREFIX}ref_counter`) || '1', 10);

  let targetApp: Application;

  if (data.id) {
    const index = applications.findIndex((a) => a.id === data.id);
    if (index === -1) throw new Error('Application not found');
    if (applications[index].owner_id !== userId) throw new Error('Access denied');

    targetApp = {
      ...applications[index],
      ...data,
      updated_at: now,
    };
    applications[index] = targetApp;
  } else {
    const nextRef = `MUJ-PAT-${new Date().getFullYear()}-${String(counter + 1).padStart(4, '0')}`;
    localStorage.setItem(`${STORAGE_PREFIX}ref_counter`, String(counter + 1));

    targetApp = {
      id: `app-${Date.now()}`,
      reference_number: nextRef,
      owner_id: userId,
      title: data.title || 'Untitled Draft Invention',
      technical_field: data.technical_field || '',
      background_problem: data.background_problem || '',
      description: data.description || '',
      novelty_features: data.novelty_features || '',
      practical_applications: data.practical_applications || '',
      status: 'draft',
      current_version: 1,
      submitted_at: null,
      created_at: now,
      updated_at: now,
    };
    applications.push(targetApp);

    // Initial audit entry
    const history = getLocalItem<ApplicationStatusHistory[]>('history', []);
    history.push({
      id: `hist-${Date.now()}`,
      application_id: targetApp.id,
      from_status: null,
      to_status: 'draft',
      changed_by: userId,
      reason: 'Draft created by applicant.',
      created_at: now,
    });
    setLocalItem('history', history);
  }

  // Update inventors
  const filteredInventors = allInventors.filter((i) => i.application_id !== targetApp.id);
  const newInventors: Inventor[] = inventorsList.map((inv, idx) => ({
    id: inv.id || `inv-${Date.now()}-${idx}`,
    application_id: targetApp.id,
    full_name: inv.full_name || '',
    email: inv.email || '',
    phone: inv.phone || null,
    affiliation_type: inv.affiliation_type || 'student',
    department: inv.department || '',
    is_primary: idx === 0,
    order_index: idx,
    created_at: now,
  }));

  setLocalItem('applications', applications);
  setLocalItem('inventors', [...filteredInventors, ...newInventors]);

  return {
    ...targetApp,
    inventors: newInventors,
  };
}

export async function submitApplication(
  applicationId: string,
  userId: string,
  notes?: string
): Promise<Application> {
  const now = new Date().toISOString();

  // Validate permission transition
  if (!canTransition('draft', 'submitted', 'student')) {
    throw new Error('Invalid status transition');
  }

  if (isSupabaseConfigured()) {
    const { data: updatedApp, error } = await supabase
      .from('applications')
      .update({
        status: 'submitted',
        submitted_at: now,
        updated_at: now,
      })
      .eq('id', applicationId)
      .eq('owner_id', userId)
      .select('*, inventors(*)')
      .single();

    if (error) throw error;

    // Archive snapshot
    await supabase.from('application_versions').insert({
      application_id: applicationId,
      version_number: 1,
      snapshot_data: updatedApp,
      submitted_by: userId,
      submission_notes: notes || 'Submitted for initial review.',
    });

    // Notify student
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Application Submitted',
      message: `Your application (${updatedApp.reference_number}) has been submitted for review.`,
      link: `/applications/${applicationId}`,
    });

    return updatedApp as Application;
  }

  const applications = getLocalItem<Application[]>('applications', []);
  const index = applications.findIndex((a) => a.id === applicationId);
  if (index === -1) throw new Error('Application not found');
  if (applications[index].owner_id !== userId) throw new Error('Access denied');

  const app = applications[index];
  app.status = 'submitted';
  app.submitted_at = now;
  app.updated_at = now;
  applications[index] = app;

  // Record audit history
  const history = getLocalItem<ApplicationStatusHistory[]>('history', []);
  history.push({
    id: `hist-${Date.now()}`,
    application_id: applicationId,
    from_status: 'draft',
    to_status: 'submitted',
    changed_by: userId,
    reason: notes || 'Submitted for initial screening by patent coordinator.',
    created_at: now,
  });

  // Archive version 1
  const inventors = getLocalItem<Inventor[]>('inventors', []).filter((i) => i.application_id === applicationId);
  const versions = getLocalItem<ApplicationVersion[]>('versions', []);
  versions.push({
    id: `ver-${Date.now()}`,
    application_id: applicationId,
    version_number: 1,
    snapshot_data: { ...app, inventors },
    submitted_by: userId,
    submitted_at: now,
    submission_notes: notes || 'Submitted for initial screening.',
  });

  // In-portal notification
  const notifications = getLocalItem<InPortalNotification[]>('notifications', []);
  notifications.push({
    id: `notif-${Date.now()}`,
    user_id: userId,
    title: 'Application Submitted Successfully',
    message: `Application reference ${app.reference_number} has been submitted for coordinator review.`,
    link: `/applications/${app.id}`,
    is_read: false,
    created_at: now,
  });

  setLocalItem('applications', applications);
  setLocalItem('history', history);
  setLocalItem('versions', versions);
  setLocalItem('notifications', notifications);

  return { ...app, inventors };
}

export async function resubmitApplication(
  applicationId: string,
  userId: string,
  notes?: string
): Promise<Application> {
  const now = new Date().toISOString();

  if (!canTransition('corrections_required', 'resubmitted', 'student')) {
    throw new Error('Invalid status transition');
  }

  const applications = getLocalItem<Application[]>('applications', []);
  const index = applications.findIndex((a) => a.id === applicationId);
  if (index === -1) throw new Error('Application not found');
  if (applications[index].owner_id !== userId) throw new Error('Access denied');

  const app = applications[index];
  const oldStatus = app.status;
  const newVersion = app.current_version + 1;

  app.status = 'resubmitted';
  app.current_version = newVersion;
  app.updated_at = now;
  applications[index] = app;

  // Resolve all pending correction requests
  const corrections = getLocalItem<CorrectionRequest[]>('corrections', []);
  const updatedCorrections = corrections.map((c) => {
    if (c.application_id === applicationId && c.status === 'pending') {
      return { ...c, status: 'addressed' as const, resolved_at: now };
    }
    return c;
  });

  // Record audit history
  const history = getLocalItem<ApplicationStatusHistory[]>('history', []);
  history.push({
    id: `hist-${Date.now()}`,
    application_id: applicationId,
    from_status: oldStatus,
    to_status: 'resubmitted',
    changed_by: userId,
    reason: notes || 'Student resubmitted application with requested corrections addressed.',
    created_at: now,
  });

  // Archive new version snapshot
  const inventors = getLocalItem<Inventor[]>('inventors', []).filter((i) => i.application_id === applicationId);
  const versions = getLocalItem<ApplicationVersion[]>('versions', []);
  versions.push({
    id: `ver-${Date.now()}`,
    application_id: applicationId,
    version_number: newVersion,
    snapshot_data: { ...app, inventors },
    submitted_by: userId,
    submitted_at: now,
    submission_notes: notes || `Resubmitted as Version ${newVersion} with corrections.`,
  });

  // Notification for Patent Coordinator (admin)
  const profiles = getLocalItem<Profile[]>('profiles', []);
  const adminProfile = profiles.find((p) => p.role === 'admin');
  const notifications = getLocalItem<InPortalNotification[]>('notifications', []);

  if (adminProfile) {
    notifications.push({
      id: `notif-${Date.now()}`,
      user_id: adminProfile.id,
      title: 'Application Resubmitted with Corrections',
      message: `Application ${app.reference_number} has been updated and resubmitted by the applicant.`,
      link: `/admin/applications/${app.id}`,
      is_read: false,
      created_at: now,
    });
  }

  setLocalItem('applications', applications);
  setLocalItem('corrections', updatedCorrections);
  setLocalItem('history', history);
  setLocalItem('versions', versions);
  setLocalItem('notifications', notifications);

  return { ...app, inventors };
}

export async function transitionApplicationStatus(
  applicationId: string,
  toStatus: ApplicationStatus,
  adminUser: { id: string; role: AppRole },
  reason?: string
): Promise<Application> {
  const now = new Date().toISOString();

  const applications = getLocalItem<Application[]>('applications', []);
  const index = applications.findIndex((a) => a.id === applicationId);
  if (index === -1) throw new Error('Application not found');

  const app = applications[index];
  const fromStatus = app.status;

  if (!canTransition(fromStatus, toStatus, adminUser.role)) {
    throw new Error(`Unauthorized transition: cannot change status from ${fromStatus} to ${toStatus} as ${adminUser.role}`);
  }

  app.status = toStatus;
  app.updated_at = now;
  applications[index] = app;

  // Add to status history
  const history = getLocalItem<ApplicationStatusHistory[]>('history', []);
  history.push({
    id: `hist-${Date.now()}`,
    application_id: applicationId,
    from_status: fromStatus,
    to_status: toStatus,
    changed_by: adminUser.id,
    reason: reason || `Coordinator updated status to ${toStatus}.`,
    created_at: now,
  });

  // Notify student owner
  const notifications = getLocalItem<InPortalNotification[]>('notifications', []);
  let notificationTitle = 'Application Status Updated';
  let notificationMessage = `Application ${app.reference_number} status is now: ${toStatus}.`;

  if (toStatus === 'corrections_required') {
    notificationTitle = 'Corrections Requested on Patent Application';
    notificationMessage = `The patent coordinator has requested specific corrections for ${app.reference_number}. Please review the feedback.`;
  } else if (toStatus === 'approved_next_stage') {
    notificationTitle = 'Application Approved for Next Stage';
    notificationMessage = `Application ${app.reference_number} has been approved by the coordinator for the next internal filing stage.`;
  }

  notifications.push({
    id: `notif-${Date.now()}`,
    user_id: app.owner_id,
    title: notificationTitle,
    message: notificationMessage,
    link: `/applications/${app.id}`,
    is_read: false,
    created_at: now,
  });

  setLocalItem('applications', applications);
  setLocalItem('history', history);
  setLocalItem('notifications', notifications);

  return app;
}

// =============================================================================
// CORRECTION REQUESTS API
// =============================================================================

export async function createCorrectionRequest(
  applicationId: string,
  reviewerId: string,
  comment: string,
  fieldName?: string | null,
  documentId?: string | null
): Promise<CorrectionRequest> {
  const now = new Date().toISOString();
  const corrections = getLocalItem<CorrectionRequest[]>('corrections', []);

  const newRequest: CorrectionRequest = {
    id: `corr-${Date.now()}`,
    application_id: applicationId,
    reviewer_id: reviewerId,
    field_name: fieldName || null,
    document_id: documentId || null,
    comment,
    status: 'pending',
    created_at: now,
    resolved_at: null,
  };

  corrections.push(newRequest);
  setLocalItem('corrections', corrections);
  return newRequest;
}

// =============================================================================
// APPLICATION COMMENTS API
// =============================================================================

export async function addApplicationComment(
  applicationId: string,
  authorId: string,
  content: string,
  commentType: 'general' | 'internal_admin'
): Promise<void> {
  const now = new Date().toISOString();
  const comments = getLocalItem<ApplicationComment[]>('comments', []);
  comments.push({
    id: `comm-${Date.now()}`,
    application_id: applicationId,
    author_id: authorId,
    comment_type: commentType,
    content,
    created_at: now,
  });
  setLocalItem('comments', comments);
}

export async function fetchApplicationComments(applicationId: string, role: AppRole) {
  const comments = getLocalItem<any[]>('comments', []).filter((c) => c.application_id === applicationId);
  const profiles = getLocalItem<Profile[]>('profiles', []);

  return comments
    .filter((c) => role === 'admin' || c.comment_type === 'general')
    .map((c) => ({
      ...c,
      author: profiles.find((p) => p.id === c.author_id),
    }))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

// =============================================================================
// PRIVATE DOCUMENT STORAGE API
// =============================================================================

export async function uploadDocument(
  applicationId: string,
  file: File,
  category: DocumentCategory,
  uploaderId: string
): Promise<ApplicationDocument> {
  // 1. File size validation
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error(`File exceeds maximum permitted size of 25 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB provided)`);
  }

  // 2. MIME type validation
  if (!ALLOWED_DOCUMENT_MIMES.includes(file.type)) {
    throw new Error(`Unsupported file type (${file.type}). Permitted types: PDF, DOC, DOCX, PNG, JPEG.`);
  }

  // Safe filename sanitization
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${applicationId}/${Date.now()}_${safeFilename}`;
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const { error: uploadError } = await supabase.storage
      .from('patent-documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: docRecord, error: docError } = await supabase
      .from('application_documents')
      .insert({
        application_id: applicationId,
        storage_path: storagePath,
        document_category: category,
        original_filename: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
        version_number: 1,
        uploaded_by: uploaderId,
      })
      .select()
      .single();

    if (docError) throw docError;
    return docRecord as ApplicationDocument;
  }

  // Local storage mock
  const documents = getLocalItem<ApplicationDocument[]>('documents', []);
  const docRecord: ApplicationDocument = {
    id: `doc-${Date.now()}`,
    application_id: applicationId,
    storage_path: storagePath,
    document_category: category,
    original_filename: file.name,
    mime_type: file.type,
    file_size_bytes: file.size,
    version_number: 1,
    uploaded_by: uploaderId,
    created_at: now,
  };

  documents.push(docRecord);
  setLocalItem('documents', documents);
  return docRecord;
}

export async function getDocumentSignedUrl(documentPath: string): Promise<string> {
  if (isSupabaseConfigured()) {
    // Generate private signed URL with 15-minute (900 seconds) expiration
    const { data, error } = await supabase.storage
      .from('patent-documents')
      .createSignedUrl(documentPath, 900);
    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  }

  // Local fallback: create safe mock preview link
  return `data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og...`;
}

export const getSignedDocumentUrl = getDocumentSignedUrl;

export async function deleteDocument(documentId: string, _userId?: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.from('application_documents').delete().eq('id', documentId);
    return;
  }
  const documents = getLocalItem<ApplicationDocument[]>('documents', []);
  setLocalItem('documents', documents.filter((d) => d.id !== documentId));
}

// =============================================================================
// IN-PORTAL NOTIFICATIONS API
// =============================================================================

export async function fetchNotifications(userId: string): Promise<InPortalNotification[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error && data) return data as InPortalNotification[];
  }

  const notifications = getLocalItem<InPortalNotification[]>('notifications', []);
  return notifications
    .filter((n) => n.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function markNotificationAsRead(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    return;
  }

  const notifications = getLocalItem<InPortalNotification[]>('notifications', []);
  const notif = notifications.find((n) => n.id === id);
  if (notif) {
    notif.is_read = true;
    setLocalItem('notifications', notifications);
  }
}
