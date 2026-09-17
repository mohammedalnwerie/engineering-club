import { safeStorage } from './safeStorage';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured, publicRpc, publicSelect } from './supabaseClient';
import { sanitizeText, sanitizeUrl } from '../utils/security';
import { normalizeCode, normalizePhone, toLatinDigits } from '../utils/validation';
import { FLAGSHIP_PROJECTS, CLUB_EVENTS, TRAINING_COURSES, LEADERSHIP_MEMBERS, COLLEGES, MAJORS, STUDENT_SPOTLIGHT } from '../data/clubData';
import type {
  ProjectCaseStudy,
  EventItem,
  TrainingCourse,
  StoredApplication,
  ClubApplication,
  EventTicket,
  LeaderMember,
  College,
  Major,
  SiteSettings,
  StudentSpotlightData,
  ComplaintItem,
  RecruitmentSettings,
  MembershipSettings
} from '../types';




export const DEFAULT_MEMBERSHIP_SETTINGS: MembershipSettings = {
  trialDays: 14,
  trialEndsAt: '',
  semesterFee: 20,
  currency: '₪',
  semesterLabel: 'الفصل الأول 2026/2027',
  semesterEndsAt: '2027-02-01',
  paymentMethods: ['نقداً لأمين الصندوق', 'تحويل بنكي', 'جوال باي / بال باي'],
  paymentInstructions: 'ادفع رسوم العضوية الفصلية بإحدى الطرق المتاحة، ثم اكتب رقم الحوالة أو اسم المستلم في الطلب.',
};

/** نص صلاحية البطاقة الأولى: تاريخ ثابت إن حُدّد، وإلا عدد الأيام. */
export const trialValidityText = (settings: MembershipSettings): string => {
  const fixed = (settings.trialEndsAt || '').trim();
  if (fixed) {
    const end = new Date(`${fixed}T23:59:59`);
    if (!Number.isNaN(end.getTime()) && end.getTime() > Date.now()) {
      return `صالحة حتى ${end.toLocaleDateString('ar', { day: 'numeric', month: 'long' })}`;
    }
  }
  return `صالحة ${settings.trialDays} يوماً`;
};

const DEFAULT_RECRUITMENT_SETTINGS: RecruitmentSettings = {
  isGlobalRecruitmentOpen: true,
  globalClosedMessage: 'باب استقطاب اللجان متوقف مؤقتاً لحين انتهاء تقييم الدفعة الحالية.',
  committees: {
    general: { isOpen: true, closedNotice: 'الاستقطاب للعضوية العامة مغلق مؤقتاً' },
    events: { isOpen: true, closedNotice: 'اكتملت المقاعد المتاحة للجنة الفعاليات والأنشطة' },
    training: { isOpen: true, closedNotice: 'اكتملت المقاعد المتاحة للجنة العلاقات والتدريب' },
    media: { isOpen: true, closedNotice: 'اكتملت المقاعد المتاحة للجنة الإعلامية' },
  },
};

const DEFAULT_SETTINGS: SiteSettings = {
  heroTitle: 'نبني مهندسي المستقبل',
  heroHighlight: 'مهندسي المستقبل',
  heroSubheadline1: 'من المعرفة إلى المهارة .. ومن الفكرة إلى أثر المشروع.',
  heroSubheadline2: 'بيئة طلابية متكاملة تصنع الريادة من قلب التحدي في جامعة فلسطين.',
  operatingSystemVersion: 'نظام التشغيل الهندسي v2.6',
  clubNameAr: 'النادي الهندسي',
  clubNameEn: 'UP Engineering Club',
  universityNameAr: 'جامعة فلسطين',
  universityNameEn: 'University of Palestine',
  sloganAr: 'هندسة اليوم .. تصنع أثر الغد',
  sloganEn: 'ENGINEERING TODAY .. IMPACT TOMORROW',
  aboutUs: 'النادي الهندسي هو إطار طلابي تطوعي وغير مسيّس، لا يتبع لأي جهة حزبية أو سياسية. تأسس النادي بمبادرة من طلبة كلية هندسة البرمجيات والذكاء الاصطناعي في جامعة فلسطين، ليكون منصة طلابية جامعة تجمع طلبة التخصصات الهندسية والتقنية في الجامعة تحت مظلة واحدة، بهدف تنمية مهاراتهم الأكاديمية والعملية والتقنية، وتعزيز روح التعاون والإبداع بينهم.',
  vision: 'أن يكون النادي الهندسي مجتمعًا طلابيًا فاعلًا يجمع طلبة الكليات والتخصصات الهندسية والتقنية في جامعة فلسطين، ويسهم في بناء طالب يمتلك المعرفة والمهارة والقدرة على الابتكار والقيادة، ويكون أكثر استعدادًا للمستقبل وسوق العمل، وقادرًا على صناعة أثر حقيقي في مجتمعه.',
  mission: 'نعمل على تطوير الطلبة أكاديميًا وعمليًا وشخصيًا من خلال التدريب، والورش، والمشاريع، والمسابقات، والمبادرات، وتبادل الخبرات، وبناء الشراكات مع الخبراء والمؤسسات وسوق العمل، مع توفير بيئة طلابية تعزز التعاون وتمثّل احتياجات الطلبة وتمنحهم فرصًا حقيقية للتعلم والتجربة والمشاركة وصناعة الفرص.',
  values: [
    { id: 'v1', name: 'الابتكار', description: 'تحويل الأفكار الإبداعية إلى حلول هندسية تطبيقية ذات قيمة مضافة.', iconName: 'Lightbulb' },
    { id: 'v2', name: 'التعاون', description: 'روح الفريق والعمل التكاملي بين مختلف الكليات والتخصصات الهندسية.', iconName: 'Users' },
    { id: 'v3', name: 'التطوير', description: 'السعي المستمر لصقل المهارات الأكاديمية والتقنية ومواكبة أحدث الأدوات.', iconName: 'Settings' },
    { id: 'v4', name: 'التمكين', description: 'إتاحة الفرص والموارد للطلبة للقيادة وبناء مشاريعهم الخاصة بثقة.', iconName: 'GraduationCap' },
    { id: 'v5', name: 'الأثر', description: 'صناعة فارق ملموس في المجتمع وسوق العمل والبيئة الجامعية.', iconName: 'Target' }
  ],
  showEventsSection: true,
  showProjectsSection: true,
  showLiveFeedSection: true,
};


type Listener = () => void;
type ErrorListener = (message: string) => void;

// Public content lives in club_content (one JSON value per key).
const CONTENT_KEYS = {
  settings: 'settings',
  projects: 'projects',
  events: 'events',
  courses: 'courses',
  leadership: 'leadership',
  colleges: 'colleges',
  majors: 'majors',
  spotlight: 'spotlight',
  recruitment: 'recruitment',
  membership: 'membership',
  tickets: 'tickets',
} as const;

type ContentKey = (typeof CONTENT_KEYS)[keyof typeof CONTENT_KEYS];

const PRIVATE_CONTENT_KEYS: ContentKey[] = ['tickets'];

// Local copy of public content only, so the first paint uses the latest published content.
const PUBLIC_CACHE_KEY = 'eng_club_public_cache_v1';

interface ContentCache {
  settings: SiteSettings;
  projects: ProjectCaseStudy[];
  events: EventItem[];
  courses: TrainingCourse[];
  leadership: LeaderMember[];
  colleges: College[];
  majors: Major[];
  spotlight: StudentSpotlightData;
  recruitment: RecruitmentSettings;
  membership: MembershipSettings;
  tickets: EventTicket[];
}

const defaultContent = (): ContentCache => ({
  settings: DEFAULT_SETTINGS,
  projects: FLAGSHIP_PROJECTS,
  events: CLUB_EVENTS,
  courses: TRAINING_COURSES,
  leadership: LEADERSHIP_MEMBERS,
  colleges: COLLEGES,
  majors: MAJORS,
  spotlight: STUDENT_SPOTLIGHT,
  recruitment: DEFAULT_RECRUITMENT_SETTINGS,
  membership: DEFAULT_MEMBERSHIP_SETTINGS,
  tickets: [],
});

interface ApplicationRow {
  id: string;
  student_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: StoredApplication['status'];
  data: Partial<ClubApplication> | null;
  submitted_at: string;
  member_code?: string | null;
  accepted_at?: string | null;
  membership_type?: 'temporary' | 'semester' | null;
  valid_until?: string | null;
}

interface ComplaintRow {
  id: string;
  ticket_number: string;
  status: ComplaintItem['status'];
  admin_notes: string | null;
  data: Partial<ComplaintItem> | null;
  created_at: string;
  updated_at: string | null;
}

export type NewComplaint = Omit<ComplaintItem, 'id' | 'ticketNumber' | 'status' | 'createdAt'>;

export interface MemberLookup {
  id: string;
  assignedCommittee?: string;
  organizationalRole?: string;
  fullName: string;
  studentId: string;
  status: StoredApplication['status'];
  submittedAt?: string;
  college?: string;
  major?: string;
  academicYear?: string;
  targetCommittee?: string;
  skills?: string[];
  /** Last 4 characters of the private member code */
  codeHint?: string;
  membershipType?: 'temporary' | 'semester';
  validUntil?: string;
  membershipState?: 'temporary' | 'semester' | 'expired' | 'not_member';
}

const rowToApplication = (row: ApplicationRow): StoredApplication => ({
  ...(row.data as ClubApplication),
  id: row.id,
  studentId: row.student_id,
  fullName: row.full_name,
  email: row.email || '',
  phone: row.phone || '',
  skills: row.data?.skills || [],
  status: row.status,
  submittedAt: row.submitted_at,
  memberCode: row.member_code || undefined,
  acceptedAt: row.accepted_at || undefined,
  membershipType: row.membership_type || undefined,
  validUntil: row.valid_until || undefined,
});

const rowToComplaint = (row: ComplaintRow): ComplaintItem => ({
  ...(row.data as ComplaintItem),
  id: row.id,
  ticketNumber: row.ticket_number,
  status: row.status,
  adminNotes: row.admin_notes || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at || undefined,
});

const errorMessage = (err: unknown): string => {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message);
  return 'خطأ غير معروف';
};

class DataService {
  private listeners: Set<Listener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  private content: ContentCache = defaultContent();
  private applications: StoredApplication[] = [];
  private complaints: ComplaintItem[] = [];
  private subscribers: { email: string; created_at: string }[] = [];

  constructor() {
    this.readPublicCache();
    void this.loadPublicContent();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeErrors(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private reportError(context: string, err: unknown) {
    const message = `${context}: ${errorMessage(err)}`;
    console.error('[DataService]', message, err);
    this.errorListeners.forEach((l) => l(message));
  }

  // --- LOADING ---
  private readPublicCache() {
    const cached = safeStorage.get<Partial<ContentCache> | null>(PUBLIC_CACHE_KEY, null);
    if (cached && typeof cached === 'object') {
      this.content = { ...this.content, ...cached, tickets: [] };
    }
  }

  private writePublicCache() {
    const publicContent: Partial<ContentCache> = { ...this.content };
    for (const key of PRIVATE_CONTENT_KEYS) delete publicContent[key];
    safeStorage.set(PUBLIC_CACHE_KEY, publicContent);
  }

  /** Pass the admin client to also receive private keys. */
  public async loadPublicContent(adminClient?: SupabaseClient): Promise<void> {
    if (!isSupabaseConfigured) return;
    let data: { key: string; value: unknown }[] | null;
    try {
      if (adminClient) {
        const res = await adminClient.from('club_content').select('key, value');
        if (res.error) throw res.error;
        data = res.data;
      } else {
        data = await publicSelect<{ key: string; value: unknown }[]>('club_content?select=key,value');
      }
    } catch (error) {
      this.reportError('تعذر تحميل محتوى الموقع', error);
      return;
    }
    // Keys never saved by an admin fall back to the built-in defaults.
    const fresh = defaultContent();
    for (const row of data || []) {
      if (row.key in fresh) {
        (fresh as unknown as Record<string, unknown>)[row.key] = row.value;
      }
    }
    const returnedKeys = new Set((data || []).map((row) => row.key));
    for (const key of PRIVATE_CONTENT_KEYS) {
      if (!returnedKeys.has(key)) {
        (fresh as unknown as Record<string, unknown>)[key] = this.content[key];
      }
    }
    this.content = fresh;
    this.writePublicCache();
    this.notify();
  }

  /** Loads private data (applications, complaints, private content). Requires an admin session. */
  public async loadAdminData(): Promise<void> {
    const client = await getSupabase();
    const [apps, complaints, subscribers] = await Promise.all([
      client.from('club_applications').select('*').order('submitted_at', { ascending: false }),
      client.from('club_complaints').select('*').order('created_at', { ascending: false }),
      client.from('club_subscribers').select('email, created_at').order('created_at', { ascending: false }),
    ]);
    // Missing table just means update-003 hasn't been applied yet; not worth an error toast.
    this.subscribers = subscribers.error ? [] : (subscribers.data as { email: string; created_at: string }[]);
    if (apps.error) this.reportError('تعذر تحميل طلبات الانضمام', apps.error);
    if (complaints.error) this.reportError('تعذر تحميل الشكاوى', complaints.error);
    this.applications = ((apps.data || []) as ApplicationRow[]).map(rowToApplication);
    this.complaints = ((complaints.data || []) as ComplaintRow[]).map(rowToComplaint);
    // With an admin session this also returns the private keys (tickets, email settings).
    await this.loadPublicContent(client);
    this.notify();
  }

  public clearAdminData() {
    this.applications = [];
    this.complaints = [];
    this.subscribers = [];
    this.content.tickets = [];
    this.notify();
  }

  // --- CONTENT PERSISTENCE ---
  private setContent<K extends ContentKey>(key: K, value: ContentCache[K]) {
    this.content[key] = value;
    if (!PRIVATE_CONTENT_KEYS.includes(key)) this.writePublicCache();
    this.notify();
    void this.persistContent(key, value);
  }

  private async persistContent(key: ContentKey, value: unknown) {
    try {
      const { error } = await (await getSupabase())
        .from('club_content')
        .upsert({
          key,
          value,
          is_public: !PRIVATE_CONTENT_KEYS.includes(key),
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
    } catch (err) {
      this.reportError('فشل حفظ التعديلات في قاعدة البيانات', err);
    }
  }

  private upsertById<T extends { id: string }>(list: T[], item: T, prepend = false): T[] {
    const next = [...list];
    const idx = next.findIndex((x) => x.id === item.id);
    if (idx >= 0) next[idx] = item;
    else if (prepend) next.unshift(item);
    else next.push(item);
    return next;
  }

  // --- LEADERSHIP MEMBERS ---
  public getLeadership(): LeaderMember[] {
    return Array.isArray(this.content.leadership) ? this.content.leadership : LEADERSHIP_MEMBERS;
  }

  public saveLeader(member: LeaderMember) {
    this.setContent('leadership', this.upsertById(this.getLeadership(), member));
  }

  public deleteLeader(id: string) {
    this.setContent('leadership', this.getLeadership().filter((m) => m.id !== id));
  }

  // --- COLLEGES ---
  public getColleges(): College[] {
    return Array.isArray(this.content.colleges) ? this.content.colleges : COLLEGES;
  }

  public saveCollege(college: College) {
    this.setContent('colleges', this.upsertById(this.getColleges(), college));
  }

  // --- MAJORS ---
  public getMajors(): Major[] {
    return Array.isArray(this.content.majors) ? this.content.majors : MAJORS;
  }

  public saveMajor(major: Major) {
    this.setContent('majors', this.upsertById(this.getMajors(), major));
  }

  // --- SPOTLIGHT ---
  public getSpotlight(): StudentSpotlightData {
    const data = this.content.spotlight;
    return data && typeof data === 'object' ? data : STUDENT_SPOTLIGHT;
  }

  public saveSpotlight(data: StudentSpotlightData) {
    this.setContent('spotlight', data);
  }

  // --- SITE SETTINGS ---
  public getSettings(): SiteSettings {
    const data = this.content.settings;
    if (!data || typeof data !== 'object') return DEFAULT_SETTINGS;
    return {
      ...DEFAULT_SETTINGS,
      ...data,
      heroTitle: data.heroTitle || DEFAULT_SETTINGS.heroTitle,
      heroHighlight: data.heroHighlight || DEFAULT_SETTINGS.heroHighlight,
      aboutUs: data.aboutUs || DEFAULT_SETTINGS.aboutUs,
      vision: data.vision || DEFAULT_SETTINGS.vision,
      mission: data.mission || DEFAULT_SETTINGS.mission,
      showEventsSection: data.showEventsSection !== false,
    };
  }

  public saveSettings(data: SiteSettings) {
    this.setContent('settings', data);
  }

  // --- PROJECTS ---
  public getProjects(): ProjectCaseStudy[] {
    return Array.isArray(this.content.projects) ? this.content.projects : FLAGSHIP_PROJECTS;
  }

  public saveProject(project: ProjectCaseStudy) {
    this.setContent('projects', this.upsertById(this.getProjects(), project, true));
  }

  public deleteProject(id: string) {
    this.setContent('projects', this.getProjects().filter((p) => p.id !== id));
  }

  // --- EVENTS ---
  public getEvents(): EventItem[] {
    return Array.isArray(this.content.events) ? this.content.events : CLUB_EVENTS;
  }

  public saveEvent(event: EventItem) {
    this.setContent('events', this.upsertById(this.getEvents(), event, true));
  }

  public deleteEvent(id: string) {
    this.setContent('events', this.getEvents().filter((e) => e.id !== id));
  }

  // --- TICKETS & ATTENDEES (admin only) ---
  public getTickets(eventId?: string): EventTicket[] {
    const all = Array.isArray(this.content.tickets) ? this.content.tickets : [];
    return eventId ? all.filter((t) => t.eventId === eventId) : all;
  }

  public toggleCheckIn(ticketId: string): boolean {
    const tickets = this.getTickets().map((t) => (t.id === ticketId ? { ...t, checkedIn: !t.checkedIn } : t));
    const target = tickets.find((t) => t.id === ticketId);
    if (!target) return false;
    this.setContent('tickets', tickets);
    return target.checkedIn;
  }

  public registerEventTicket(params: {
    eventId: string;
    attendeeName: string;
    studentId?: string;
    email?: string;
  }): { success: boolean; ticket?: EventTicket; error?: string } {
    const events = this.getEvents();
    const event = events.find((e) => e.id === params.eventId);
    if (!event) return { success: false, error: 'الفعالية غير موجودة' };

    const currentTickets = this.getTickets(params.eventId);
    if (event.capacity && currentTickets.length >= event.capacity) {
      return { success: false, error: 'عذراً، اكتمل العدد المتاح للمقاعد في هذه الفعالية' };
    }

    if (params.studentId && currentTickets.some((t) => t.studentId === params.studentId?.trim())) {
      return { success: false, error: 'لقد قمت بالتسجيل مسبقاً في هذه الفعالية بهذا الرقم الجامعي' };
    }

    const newTicket: EventTicket = {
      id: 'ticket_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      eventId: params.eventId,
      eventTitle: event.title,
      attendeeName: params.attendeeName.trim(),
      studentId: params.studentId?.trim(),
      email: params.email?.trim(),
      ticketNumber: 'UP-EVT-' + Math.floor(100000 + Math.random() * 900000),
      qrHash: 'UP-EVT-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      registeredAt: new Date().toISOString(),
      checkedIn: false,
    };

    const allTickets = this.getTickets();
    allTickets.push(newTicket);
    this.setContent('tickets', allTickets);

    // Update registeredCount on event
    const updatedEvent: EventItem = {
      ...event,
      registeredCount: (event.registeredCount || 0) + 1,
    };
    this.saveEvent(updatedEvent);

    return { success: true, ticket: newTicket };
  }

  // --- APPLICATIONS ---
  /** Admin only — populated by loadAdminData(). */
  public getApplications(): StoredApplication[] {
    return this.applications;
  }

  public async submitApplication(app: ClubApplication): Promise<{ id: string; status: StoredApplication['status'] }> {
    const payload: ClubApplication = {
      ...app,
      fullName: sanitizeText(app.fullName),
      studentId: normalizeCode(app.studentId),
      email: toLatinDigits(sanitizeText(app.email)).trim().toLowerCase(),
      phone: normalizePhone(app.phone),
      personalStatement: sanitizeText(app.personalStatement || ''),
      portfolioUrl: sanitizeUrl(app.portfolioUrl),
    };
    return publicRpc<{ id: string; status: StoredApplication['status'] }>('submit_application', { payload });
  }

  public updateApplicationStatus(id: string, status: StoredApplication['status']) {
    this.applications = this.applications.map((a) => (a.id === id ? { ...a, status } : a));
    this.notify();
    void this.runAdminWrite('فشل تحديث حالة الطلب', (client) =>
      client.from('club_applications').update({ status }).eq('id', id)
    );
  }

  /** Admin: place a member in a committee and give them a title. Stored inside the application's data. */
  public updateApplicationAssignment(id: string, assignment: { assignedCommittee: string; organizationalRole: string }) {
    const app = this.applications.find((a) => a.id === id);
    if (!app) return;
    const updated: StoredApplication = { ...app, ...assignment };
    this.applications = this.applications.map((a) => (a.id === id ? updated : a));
    this.notify();

    const { id: _id, studentId: _sid, fullName: _name, email: _email, phone: _phone, status: _status, submittedAt: _at, ...data } = updated;
    void this.runAdminWrite('فشل حفظ التعيين', (client) =>
      client.from('club_applications').update({ data }).eq('id', id)
    );
  }

  /** Admin: fix a student's email/phone. Awaited so a following email send reads the new address. */
  public async updateApplicationContact(id: string, contact: { email: string; phone: string }): Promise<void> {
    const app = this.applications.find((a) => a.id === id);
    if (!app) throw new Error('لم يتم العثور على الطلب');
    const updated: StoredApplication = { ...app, ...contact };
    const { id: _id, studentId: _sid, fullName: _name, status: _status, submittedAt: _at, ...data } = updated;
    const { error } = await (await getSupabase())
      .from('club_applications')
      .update({ email: contact.email, phone: contact.phone, data })
      .eq('id', id);
    if (error) throw new Error(error.message);
    this.applications = this.applications.map((a) => (a.id === id ? updated : a));
    this.notify();
  }

  public deleteApplication(id: string) {
    this.applications = this.applications.filter((a) => a.id !== id);
    this.notify();
    void this.runAdminWrite('فشل حذف الطلب', (client) => client.from('club_applications').delete().eq('id', id));
  }

  public deleteRejectedApplications(): number {
    const removedCount = this.applications.filter((a) => a.status === 'مرفوض').length;
    this.applications = this.applications.filter((a) => a.status !== 'مرفوض');
    this.notify();
    void this.runAdminWrite('فشل حذف الطلبات المرفوضة', (client) =>
      client.from('club_applications').delete().eq('status', 'مرفوض')
    );
    return removedCount;
  }

  /** Public, exact-match lookup by student ID or UP-ENG code. Never returns email/phone. */
  public async verifyMember(code: string): Promise<MemberLookup | null> {
    const clean = normalizeCode(code);
    if (!clean) return null;
    return (await publicRpc<MemberLookup | null>('verify_member', { code: clean })) || null;
  }

  private async runAdminWrite(context: string, op: (client: SupabaseClient) => PromiseLike<{ error: unknown }>) {
    try {
      const { error } = await op(await getSupabase());
      if (error) throw error;
    } catch (err) {
      this.reportError(context, err);
      await this.loadAdminData().catch(() => undefined);
    }
  }

  /** Called after the acceptance email function succeeds (it already saved the timestamp). */
  public markAcceptanceEmailSent(id: string, sentAt: string) {
    this.applications = this.applications.map((a) => (a.id === id ? { ...a, acceptanceEmailSentAt: sentAt } : a));
    this.notify();
  }

  // --- TRAINING COURSES ---
  public getCourses(): TrainingCourse[] {
    return Array.isArray(this.content.courses) ? this.content.courses : TRAINING_COURSES;
  }

  public saveCourse(course: TrainingCourse) {
    this.setContent('courses', this.upsertById(this.getCourses(), course, true));
  }

  // --- EXPORTS & UTILITIES ---
  public exportFullDatabaseJSON(): string {
    const payload = {
      exportDate: new Date().toISOString(),
      projects: this.getProjects(),
      events: this.getEvents(),
      courses: this.getCourses(),
      applications: this.getApplications(),
      tickets: this.getTickets(),
      leadership: this.getLeadership(),
      colleges: this.getColleges(),
      majors: this.getMajors(),
      spotlight: this.getSpotlight(),
      settings: this.getSettings(),
      recruitment: this.getRecruitmentSettings(),
      complaints: this.getComplaints(),
    };
    return JSON.stringify(payload, null, 2);
  }

  // --- COMPLAINTS ---
  /** Admin only — populated by loadAdminData(). */
  public getComplaints(): ComplaintItem[] {
    return this.complaints;
  }

  public async submitComplaint(data: NewComplaint): Promise<ComplaintItem> {
    const payload: NewComplaint = {
      ...data,
      studentName: sanitizeText(data.studentName),
      studentId: sanitizeText(data.studentId || ''),
      email: sanitizeText(data.email || ''),
      phone: data.phone ? sanitizeText(data.phone) : undefined,
      subject: sanitizeText(data.subject),
      message: sanitizeText(data.message),
    };
    return publicRpc<ComplaintItem>('submit_complaint', { payload });
  }

  public updateComplaintStatus(id: string, status: ComplaintItem['status'], adminNotes?: string): ComplaintItem | undefined {
    const updatedAt = new Date().toISOString();
    let updated: ComplaintItem | undefined;
    this.complaints = this.complaints.map((c) => {
      if (c.id !== id) return c;
      updated = { ...c, status, updatedAt, ...(adminNotes !== undefined ? { adminNotes } : {}) };
      return updated;
    });
    if (!updated) return undefined;
    this.notify();
    const patch: Record<string, unknown> = { status, updated_at: updatedAt };
    if (adminNotes !== undefined) patch.admin_notes = adminNotes;
    void this.runAdminWrite('فشل تحديث الشكوى', (client) =>
      client.from('club_complaints').update(patch).eq('id', id)
    );
    return updated;
  }

  public deleteComplaint(id: string): void {
    this.complaints = this.complaints.filter((c) => c.id !== id);
    this.notify();
    void this.runAdminWrite('فشل حذف الشكوى', (client) => client.from('club_complaints').delete().eq('id', id));
  }

  /** Public tracking by the secret ticket number only. */
  public async trackComplaint(ticketNumber: string): Promise<ComplaintItem | null> {
    const clean = normalizeCode(ticketNumber);
    if (!clean) return null;
    return (await publicRpc<ComplaintItem | null>('track_complaint', { ticket: clean })) || null;
  }

  // --- NEWSLETTER ---
  public async subscribeNewsletter(email: string): Promise<void> {
    await publicRpc('subscribe_newsletter', { p_email: toLatinDigits(email).trim() });
  }

  /** Admin only — populated by loadAdminData(). */
  public getSubscribers(): { email: string; created_at: string }[] {
    return this.subscribers;
  }

  public importDatabaseJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      const keys: ContentKey[] = ['projects', 'events', 'courses', 'leadership', 'colleges', 'majors', 'spotlight', 'settings', 'recruitment', 'tickets'];
      for (const key of keys) {
        if (data[key]) this.setContent(key, data[key]);
      }
      return true;
    } catch {
      return false;
    }
  }

  // --- MEMBERSHIP SETTINGS ---
  public getMembershipSettings(): MembershipSettings {
    return { ...DEFAULT_MEMBERSHIP_SETTINGS, ...(this.content.membership || {}) };
  }

  public saveMembershipSettings(settings: MembershipSettings) {
    this.setContent('membership', settings);
  }

  // --- RECRUITMENT & COMMITTEE STATUS ---
  public getRecruitmentSettings(): RecruitmentSettings {
    const data = this.content.recruitment;
    if (!data || typeof data !== 'object') return DEFAULT_RECRUITMENT_SETTINGS;
    return {
      isGlobalRecruitmentOpen: data.isGlobalRecruitmentOpen !== false,
      globalClosedMessage: data.globalClosedMessage || DEFAULT_RECRUITMENT_SETTINGS.globalClosedMessage,
      committees: {
        ...DEFAULT_RECRUITMENT_SETTINGS.committees,
        ...(data.committees || {}),
      },
      lastUpdated: data.lastUpdated,
    };
  }

  public saveRecruitmentSettings(settings: RecruitmentSettings) {
    this.setContent('recruitment', { ...settings, lastUpdated: new Date().toISOString() });
  }

  public toggleCommitteeRecruitment(committeeId: string, isOpen?: boolean, notice?: string) {
    const current = this.getRecruitmentSettings();
    const comm = current.committees[committeeId] || { isOpen: true };
    current.committees[committeeId] = {
      ...comm,
      isOpen: isOpen !== undefined ? isOpen : !comm.isOpen,
      closedNotice: notice || comm.closedNotice,
    };
    this.saveRecruitmentSettings(current);
  }

  public toggleGlobalRecruitment(isOpen?: boolean, message?: string) {
    const current = this.getRecruitmentSettings();
    current.isGlobalRecruitmentOpen = isOpen !== undefined ? isOpen : !current.isGlobalRecruitmentOpen;
    if (message) current.globalClosedMessage = message;
    this.saveRecruitmentSettings(current);
  }

  /** Restores the built-in site content. Applications and complaints are untouched. */
  public resetDefaults() {
    this.content = { ...defaultContent(), tickets: this.content.tickets };
    this.writePublicCache();
    this.notify();
    void (async () => {
      try {
        const { error } = await (await getSupabase())
          .from('club_content')
          .delete()
          .in('key', Object.values(CONTENT_KEYS).filter((k) => !PRIVATE_CONTENT_KEYS.includes(k)));
        if (error) throw error;
      } catch (err) {
        this.reportError('فشل استعادة المحتوى الافتراضي', err);
      }
    })();
  }
}

export const dataService = new DataService();
