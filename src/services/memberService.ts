import { publicRpc } from './supabaseClient';
import { normalizeCode } from '../utils/validation';
import { safeStorage } from './safeStorage';

// Members sign in with their student ID + private member code (issued on acceptance).
// There is no server session: every call sends the credentials, and the database checks them.

export type MembershipState = 'temporary' | 'semester' | 'expired' | 'not_member';
export type EventType = 'workshop' | 'course' | 'hackathon' | 'lecture' | 'visit' | 'other';

export interface MemberRegistration {
  id: string;
  eventId: string;
  status: 'registered' | 'waitlisted' | 'cancelled';
  checkedInAt: string | null;
  title: string;
  startsAt: string;
  location: string | null;
  eventType: EventType;
}

export interface MemberPaymentRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  amount: number;
  createdAt: string;
  adminNote: string | null;
  semesterLabel: string | null;
}

export interface MemberProfile {
  id: string;
  fullName: string;
  studentId: string;
  email: string;
  major: string | null;
  college: string | null;
  academicYear: string | null;
  targetCommittee: string | null;
  assignedCommittee: string | null;
  organizationalRole: string | null;
  memberCode: string;
  acceptedAt: string | null;
  membershipType: 'temporary' | 'semester' | null;
  validUntil: string | null;
  membershipState: MembershipState;
  registrations: MemberRegistration[];
  paymentRequest: MemberPaymentRequest | null;
}

export interface PublicEvent {
  id: string;
  title: string;
  eventType: EventType;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  registrationDeadline: string | null;
  capacity: number | null;
  committee: string | null;
  committeeOnly: boolean;
  status: 'published' | 'cancelled' | 'completed';
  registeredCount: number;
  waitlistCount: number;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  workshop: 'ورشة',
  course: 'دورة',
  hackathon: 'هاكاثون',
  lecture: 'محاضرة',
  visit: 'زيارة ميدانية',
  other: 'فعالية',
};

interface Credentials {
  studentId: string;
  code: string;
}

type Listener = () => void;

const SESSION_KEY = 'eng_club_member_session_v1';

/** Database functions return { error } instead of raising for wrong credentials. */
function unwrap<T>(result: T | { error: string }): T {
  if (result && typeof result === 'object' && 'error' in result && typeof result.error === 'string') {
    throw new Error(result.error);
  }
  return result as T;
}

const friendly = (err: unknown) => {
  const message = err instanceof Error ? err.message : 'خطأ غير معروف';
  if (message.includes('Failed to fetch')) return new Error('تعذر الاتصال. تأكد من الإنترنت وحاول مرة أخرى.');
  if (/Could not find the function/.test(message)) return new Error('خدمة حسابات الأعضاء غير مفعّلة بعد.');
  return err instanceof Error ? err : new Error(message);
};

class MemberService {
  private credentials: Credentials | null = safeStorage.get<Credentials | null>(SESSION_KEY, null);
  private profile: MemberProfile | null = null;
  private listeners = new Set<Listener>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  get isLoggedIn() {
    return Boolean(this.credentials);
  }

  get currentProfile() {
    return this.profile;
  }

  private args() {
    if (!this.credentials) throw new Error('سجّل الدخول أولاً');
    return { p_student_id: this.credentials.studentId, p_code: this.credentials.code };
  }

  async login(studentId: string, code: string): Promise<MemberProfile> {
    const credentials = { studentId: normalizeCode(studentId), code: normalizeCode(code).toUpperCase() };
    try {
      const profile = unwrap(
        await publicRpc<MemberProfile | { error: string }>('member_login', {
          p_student_id: credentials.studentId,
          p_code: credentials.code,
        })
      );
      this.credentials = credentials;
      this.profile = profile;
      safeStorage.set(SESSION_KEY, credentials);
      this.notify();
      return profile;
    } catch (err) {
      throw friendly(err);
    }
  }

  /** Reloads the profile with the saved credentials; signs out if they no longer work. */
  async refresh(): Promise<MemberProfile | null> {
    if (!this.credentials) return null;
    try {
      this.profile = unwrap(await publicRpc<MemberProfile | { error: string }>('member_login', this.args()));
      this.notify();
      return this.profile;
    } catch (err) {
      const e = friendly(err);
      if (/غير صحيح/.test(e.message)) this.logout();
      throw e;
    }
  }

  logout() {
    this.credentials = null;
    this.profile = null;
    safeStorage.remove(SESSION_KEY);
    this.notify();
  }

  async registerForEvent(eventId: string): Promise<{ status: 'registered' | 'waitlisted'; alreadyRegistered: boolean }> {
    try {
      const result = unwrap(
        await publicRpc<{ status: 'registered' | 'waitlisted'; alreadyRegistered: boolean } | { error: string }>(
          'register_for_event',
          { ...this.args(), p_event_id: eventId }
        )
      );
      await this.refresh().catch(() => undefined);
      return result;
    } catch (err) {
      throw friendly(err);
    }
  }

  async cancelRegistration(eventId: string): Promise<void> {
    try {
      unwrap(await publicRpc<{ ok: boolean } | { error: string }>('cancel_event_registration', { ...this.args(), p_event_id: eventId }));
      await this.refresh().catch(() => undefined);
    } catch (err) {
      throw friendly(err);
    }
  }

  async requestSemesterMembership(input: { method: string; reference: string; receipt?: string; note?: string }) {
    try {
      unwrap(
        await publicRpc<{ id: string } | { error: string }>('request_semester_membership', {
          ...this.args(),
          p_method: input.method,
          p_reference: input.reference,
          p_receipt: input.receipt || '',
          p_note: input.note || '',
        })
      );
      await this.refresh().catch(() => undefined);
    } catch (err) {
      throw friendly(err);
    }
  }

  async listEvents(): Promise<PublicEvent[]> {
    try {
      return (await publicRpc<PublicEvent[]>('list_public_events', {})) || [];
    } catch (err) {
      throw friendly(err);
    }
  }
}

export const memberService = new MemberService();

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export const formatArabicDate = (iso: string | null | undefined, withTime = false) =>
  iso
    ? new Date(iso).toLocaleString('ar', {
        weekday: withTime ? 'long' : undefined,
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
      })
    : '';

/** Short label for the card pill and status lines. */
export function membershipLabel(state: MembershipState | undefined, validUntil: string | null | undefined): string {
  const date = validUntil ? new Date(validUntil).toLocaleDateString('ar', { day: 'numeric', month: 'long' }) : '';
  if (state === 'semester') return date ? `فصلية حتى ${date}` : 'عضوية فصلية';
  if (state === 'temporary') return date ? `صالحة حتى ${date}` : 'عضوية سارية';
  if (state === 'expired') return 'منتهية';
  return '';
}

export function daysLeft(validUntil: string | null | undefined): number | null {
  if (!validUntil) return null;
  return Math.ceil((new Date(validUntil).getTime() - Date.now()) / 86_400_000);
}
