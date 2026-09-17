import { getSupabase } from '../../services/supabaseClient';
import type { EventType } from '../../services/memberService';

// Data access for the newer dashboard sections (roles, members, events, team, activity, trash).
// Row-level security in the database enforces what each role may read or change.

export type AdminRole = 'owner' | 'vp_admin' | 'tech_support' | 'media';

export const ROLE_LABELS: Record<AdminRole, string> = {
  owner: 'المالك',
  vp_admin: 'نائب الشؤون الإدارية',
  tech_support: 'لجنة الدعم الفني',
  media: 'اللجنة الإعلامية',
};

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  owner: 'كل الصلاحيات، ومنح صلاحية المالك.',
  vp_admin: 'كل الصلاحيات: الطلبات، العضويات، الفعاليات، المحتوى، الفريق.',
  tech_support: 'كل الصلاحيات: الطلبات، العضويات، الفعاليات، المحتوى، الفريق.',
  media: 'طلبات اللجنة الإعلامية وفعالياتها فقط.',
};

export const hasFullAccess = (role: AdminRole | null) => role === 'owner' || role === 'vp_admin' || role === 'tech_support';

const MEDIA_COMMITTEE = 'اللجنة الإعلامية';
export { MEDIA_COMMITTEE };

function friendlyError(error: unknown, fallback = 'حدث خطأ غير متوقع'): Error {
  const message =
    error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : fallback;
  if (/Could not find the (function|table)|schema cache|does not exist/i.test(message)) {
    return new Error('هذه الميزة تحتاج تشغيل تحديث قاعدة البيانات (update-005).');
  }
  if (/row-level security|permission denied/i.test(message)) {
    return new Error('ليس لديك صلاحية لهذا الإجراء.');
  }
  if (/Failed to fetch/i.test(message)) return new Error('تعذر الاتصال. تأكد من الإنترنت.');
  return new Error(message);
}

async function run<T = unknown>(
  op: (client: Awaited<ReturnType<typeof getSupabase>>) => PromiseLike<{ data: unknown; error: unknown }>
): Promise<T> {
  const client = await getSupabase();
  const { data, error } = await op(client);
  if (error) throw friendlyError(error);
  return data as T;
}

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

/** The signed-in admin's role. Before update-005 every admin is treated as owner. */
export async function fetchMyRole(): Promise<AdminRole | null> {
  const client = await getSupabase();
  const { data, error } = await client.rpc('club_admin_role');
  if (error) {
    const { data: isAdmin } = await client.rpc('is_club_admin');
    return isAdmin === true ? 'owner' : null;
  }
  return (data as AdminRole | null) || null;
}

// ---------------------------------------------------------------------------
// Members & payments
// ---------------------------------------------------------------------------

export interface MemberRow {
  id: string;
  full_name: string;
  student_id: string;
  email: string | null;
  phone: string | null;
  member_code: string | null;
  membership_type: 'temporary' | 'semester' | null;
  valid_until: string | null;
  accepted_at: string | null;
  data: { assignedCommittee?: string; targetCommittee?: string; organizationalRole?: string; major?: string } | null;
}

export const listMembers = () =>
  run<MemberRow[]>((c) =>
    c
      .from('club_applications')
      .select('id, full_name, student_id, email, phone, member_code, membership_type, valid_until, accepted_at, data')
      .eq('status', 'تم القبول')
      .order('valid_until', { ascending: true, nullsFirst: true })
  );

export interface PaymentRequestRow {
  id: string;
  application_id: string;
  amount: number;
  method: string;
  reference: string | null;
  receipt_image: string | null;
  note: string | null;
  semester_label: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  club_applications: { full_name: string; student_id: string; phone: string | null; email: string | null } | null;
}

export const listPaymentRequests = () =>
  run<PaymentRequestRow[]>((c) =>
    c
      .from('club_payment_requests')
      .select('*, club_applications(full_name, student_id, phone, email)')
      .order('created_at', { ascending: false })
      .limit(300)
  );

export const reviewPaymentRequest = (id: string, approve: boolean, adminNote: string) =>
  run((c) => c.rpc('review_payment_request', { p_request_id: id, p_approve: approve, p_admin_note: adminNote }));

/** Marks a member as paid in person: semester membership until the configured semester end. */
export const activateSemesterManually = (applicationId: string, semesterEndsAt: string) =>
  run((c) =>
    c
      .from('club_applications')
      .update({ membership_type: 'semester', valid_until: new Date(`${semesterEndsAt}T23:59:59`).toISOString() })
      .eq('id', applicationId)
  );

/** Re-issues every first card with the currently configured end (fixed date or days). */
export const applyTrialEndToMembers = () =>
  run<number>((c) => c.rpc('apply_trial_end_to_members'));

export const extendMembership = (applicationId: string, validUntil: string) =>
  run((c) => c.from('club_applications').update({ valid_until: validUntil }).eq('id', applicationId));

// ---------------------------------------------------------------------------
// Events & registrations
// ---------------------------------------------------------------------------

export interface EventRow {
  id: string;
  title: string;
  event_type: EventType;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  registration_deadline: string | null;
  capacity: number | null;
  committee: string | null;
  committee_only: boolean;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  created_at: string;
}

export type EventInput = Omit<EventRow, 'id' | 'created_at'> & { id?: string };

export const listAdminEvents = () =>
  run<EventRow[]>((c) => c.from('club_events').select('*').order('starts_at', { ascending: false }));

export const saveAdminEvent = (event: EventInput) =>
  run<EventRow>((c) => {
    const { id, ...fields } = event;
    const payload = { ...fields, updated_at: new Date().toISOString() };
    return id
      ? c.from('club_events').update(payload).eq('id', id).select().single()
      : c.from('club_events').insert(payload).select().single();
  });

export const deleteAdminEvent = (id: string) => run((c) => c.from('club_events').delete().eq('id', id));

export interface RegistrationRow {
  id: string;
  event_id: string;
  status: 'registered' | 'waitlisted' | 'cancelled';
  checked_in_at: string | null;
  created_at: string;
  club_applications: { full_name: string; student_id: string; phone: string | null; email: string | null; data: MemberRow['data'] } | null;
}

export const listRegistrations = (eventId: string) =>
  run<RegistrationRow[]>((c) =>
    c
      .from('club_event_registrations')
      .select('id, event_id, status, checked_in_at, created_at, club_applications(full_name, student_id, phone, email, data)')
      .eq('event_id', eventId)
      .order('created_at')
  );

/** Registration counts for all events the admin can see: { [eventId]: { registered, waitlisted, attended } } */
export async function registrationCounts(): Promise<Record<string, { registered: number; waitlisted: number; attended: number }>> {
  const rows = await run<{ event_id: string; status: string; checked_in_at: string | null }[]>((c) =>
    c.from('club_event_registrations').select('event_id, status, checked_in_at')
  );
  const counts: Record<string, { registered: number; waitlisted: number; attended: number }> = {};
  for (const r of rows) {
    const entry = (counts[r.event_id] ||= { registered: 0, waitlisted: 0, attended: 0 });
    if (r.status === 'registered') entry.registered++;
    if (r.status === 'waitlisted') entry.waitlisted++;
    if (r.checked_in_at) entry.attended++;
  }
  return counts;
}

export const setCheckIn = (registrationId: string, attended: boolean) =>
  run((c) =>
    c
      .from('club_event_registrations')
      .update({ checked_in_at: attended ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
      .eq('id', registrationId)
  );

// ---------------------------------------------------------------------------
// Team (Edge Function: manage-admins)
// ---------------------------------------------------------------------------

export interface TeamMember {
  userId: string;
  role: AdminRole;
  email: string;
  displayName: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  pending: boolean;
}

async function manageAdmins<T>(body: Record<string, unknown>): Promise<T> {
  const client = await getSupabase();
  const { data, error } = await client.functions.invoke('manage-admins', { body });
  if (error) {
    let message = error.message;
    const response = (error as { context?: Response }).context;
    if (response && typeof response.json === 'function') {
      const parsed = await response.json().catch(() => null);
      if (parsed?.error) message = parsed.detail ? `${parsed.error} — ${parsed.detail}` : parsed.error;
    }
    if (/Failed to send a request|Function not found|404/i.test(message)) {
      message = 'دالة إدارة الفريق (manage-admins) غير منشورة بعد على Supabase.';
    }
    throw new Error(message);
  }
  return data as T;
}

export const listTeam = () => manageAdmins<{ admins: TeamMember[] }>({ action: 'list' }).then((r) => r.admins);
export const inviteTeamMember = (email: string, role: AdminRole, displayName: string) =>
  manageAdmins<{ ok: boolean; warning?: string }>({ action: 'invite', email, role, displayName });
export const updateTeamRole = (userId: string, role: AdminRole) => manageAdmins({ action: 'update_role', userId, role });
export const removeTeamMember = (userId: string) => manageAdmins({ action: 'remove', userId });
export const requestPasswordReset = (email: string) =>
  manageAdmins<{ ok: boolean; message: string }>({ action: 'reset_password', email });

// ---------------------------------------------------------------------------
// Activity log & trash
// ---------------------------------------------------------------------------

export interface ActivityRow {
  id: number;
  actor_email: string | null;
  action: 'create' | 'update' | 'delete' | 'restore';
  entity_type: string;
  entity_id: string | null;
  summary: string;
  created_at: string;
}

export const listActivity = (limit = 300) =>
  run<ActivityRow[]>((c) => c.from('club_activity_log').select('*').order('created_at', { ascending: false }).limit(limit));

export interface TrashRow {
  id: string;
  entity_type: string;
  entity_id: string | null;
  title: string;
  payload: Record<string, unknown>;
  deleted_by_email: string | null;
  deleted_at: string;
}

export const listTrash = () =>
  run<TrashRow[]>((c) => c.from('club_trash').select('*').order('deleted_at', { ascending: false }));

export const restoreTrashItem = (id: string) =>
  run<{ entityType: string; restored?: boolean; payload?: Record<string, unknown> }>((c) =>
    c.rpc('restore_from_trash', { p_trash_id: id })
  );

export const deleteTrashItem = (id: string) => run((c) => c.from('club_trash').delete().eq('id', id));

export const purgeOldTrash = () => run<number>((c) => c.rpc('purge_old_trash'));

/** Content items (projects, leaders…) live inside JSON lists, so the app copies them to the trash itself. */
export async function trashContentItem(entityType: string, entityId: string, title: string, payload: unknown) {
  try {
    await run((c) =>
      c.from('club_trash').insert({ entity_type: entityType, entity_id: entityId, title, payload: payload as object })
    );
  } catch {
    // Trash is a safety net; never block the delete itself (e.g. before update-005 is applied).
  }
}
