import { publicRpc } from './supabaseClient';
import { normalizeCode } from '../utils/validation';
import { safeStorage } from './safeStorage';
import type { EventScope, HackathonRegistrationData } from '../types';

// Members sign in with their student ID and a secret: the card code the first
// time, then the password they choose. The code is printed on the card, so once
// a password exists the database stops accepting the code.
// There is no server session: every call sends the credentials, and the database checks them.

export type MembershipState = 'temporary' | 'semester' | 'expired' | 'suspended' | 'not_member' | 'accredited';
export type EventType = 'workshop' | 'course' | 'hackathon' | 'lecture' | 'visit' | 'other';

export interface MemberRegistration {
  id: string;
  eventId: string;
  status: 'registered' | 'waitlisted' | 'cancelled';
  checkedInAt: string | null;
  title: string;
  startsAt: string | null;
  timeTbd?: boolean;
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
  /** صورة العضو على البطاقة (اختيارية) */
  photoUrl?: string | null;
  memberCode: string;
  acceptedAt: string | null;
  membershipType: 'temporary' | 'semester' | 'executive' | null;
  validUntil: string | null;
  membershipState: MembershipState;
  /** false = العضو لسه ما عيّن كلمة مرور، وبيدخل برمز البطاقة */
  passwordSet?: boolean;
  registrations: MemberRegistration[];
  paymentRequest: MemberPaymentRequest | null;
}

export interface PublicEvent {
  id: string;
  title: string;
  eventType: EventType;
  description: string | null;
  location: string | null;
  startsAt: string | null;
  /** اليوم محدد بدون ساعة */
  timeTbd?: boolean;
  endsAt: string | null;
  registrationDeadline: string | null;
  capacity: number | null;
  committee: string | null;
  committeeOnly: boolean;
  status: 'published' | 'cancelled' | 'completed';
  coverImage?: string | null;
  scope?: EventScope;
  prizes?: string | null;
  minTeamSize?: number;
  maxTeamSize?: number;
  tracks?: string[];
  allowSolo?: boolean;
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

  /** Credentials for the RPCs whose second parameter is named p_code. */
  private args() {
    if (!this.credentials) throw new Error('سجّل الدخول أولاً');
    return { p_student_id: this.credentials.studentId, p_code: this.credentials.code };
  }

  /** Credentials for the RPCs whose second parameter is named p_secret. */
  private secretArgs() {
    if (!this.credentials) throw new Error('سجّل الدخول أولاً');
    return { p_student_id: this.credentials.studentId, p_secret: this.credentials.code };
  }

  /** The secret is the card code on the first login, the password afterwards. */
  async login(studentId: string, secret: string): Promise<MemberProfile> {
    const trimmed = secret.trim();
    // A card code is normalised (Arabic digits, upper case); a password is used as typed.
    const looksLikeCode = /^up[-\s]?[0-9a-z]{4}[-\s]?[0-9a-z]{4}$/i.test(trimmed);
    const credentials = {
      studentId: normalizeCode(studentId),
      code: looksLikeCode ? normalizeCode(trimmed).toUpperCase() : trimmed,
    };
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

  /** First-time setup or a later change; the member stays signed in with the new password. */
  async setPassword(newPassword: string): Promise<void> {
    if (!this.credentials) throw new Error('سجّل الدخول أولاً');
    try {
      unwrap(
        await publicRpc<{ ok: boolean } | { error: string }>('member_set_password', {
          ...this.secretArgs(),
          p_new_password: newPassword,
        })
      );
      this.credentials = { ...this.credentials, code: newPassword };
      safeStorage.set(SESSION_KEY, this.credentials);
      await this.refresh().catch(() => undefined);
      this.notify();
    } catch (err) {
      throw friendly(err);
    }
  }

  /** Allows an accepted member to self-reset their password if they verify their registered phone or email. */
  async selfResetPassword(studentId: string, verification: string): Promise<{ ok: boolean; fullName?: string; message?: string }> {
    try {
      return unwrap(
        await publicRpc<{ ok: boolean; fullName?: string; message?: string } | { error: string }>(
          'member_self_reset_password',
          {
            p_student_id: normalizeCode(studentId),
            p_verification: verification.trim(),
          }
        )
      );
    } catch (err) {
      throw friendly(err);
    }
  }

  /** Sets or clears the member's own card photo. Pass null to remove it. */
  async setPhoto(photo: string | null): Promise<void> {
    if (!this.credentials) throw new Error('سجّل الدخول أولاً');
    try {
      unwrap(
        await publicRpc<{ ok: boolean } | { error: string }>('member_set_photo', {
          ...this.secretArgs(),
          p_photo: photo,
        })
      );
      await this.refresh().catch(() => undefined);
    } catch (err) {
      throw friendly(err);
    }
  }

  logout() {
    this.credentials = null;
    this.profile = null;
    safeStorage.remove(SESSION_KEY);
    this.notify();
  }

  async registerForEvent(eventId: string, teamData?: HackathonRegistrationData): Promise<{ status: 'registered' | 'waitlisted'; alreadyRegistered: boolean }> {
    try {
      const result = unwrap(
        await publicRpc<{ status: 'registered' | 'waitlisted'; alreadyRegistered: boolean } | { error: string }>(
          'register_for_event',
          { ...this.args(), p_event_id: eventId, p_team_data: teamData || null }
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
  if (state === 'suspended') return 'معلّقة';
  if (state === 'expired') return 'منتهية';
  return '';
}

/** نص موعد الفعالية: تاريخ وساعة، أو يوم فقط، أو «يُعلن لاحقاً». */
export function eventWhenLabel(event: { startsAt: string | null; timeTbd?: boolean }): string {
  if (!event.startsAt) return 'الموعد يُعلن لاحقاً';
  return formatArabicDate(event.startsAt, !event.timeTbd);
}

export function daysLeft(validUntil: string | null | undefined): number | null {
  if (!validUntil) return null;
  return Math.ceil((new Date(validUntil).getTime() - Date.now()) / 86_400_000);
}
