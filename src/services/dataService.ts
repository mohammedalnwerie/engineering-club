import { safeStorage } from './safeStorage';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured, publicRpc, publicSelect } from './supabaseClient';
import { sanitizeText, sanitizeUrl } from '../utils/security';
import { normalizeCode, normalizePhone, toLatinDigits } from '../utils/validation';
import { isExecutivePosition } from '../data/committees';
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
  MembershipSettings,
  ContactSettings,
  FaqItem,
  CommitteeCriteriaSettings,
  MessageTemplatesSettings
} from '../types';
import { SOCIAL_ORDER, type SocialLink } from '../data/socials';
import { DEFAULT_FAQS } from '../data/faqData';




export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  email: 'upsmart.support@gmail.com',
  phone: '',
  addressAr: 'جامعة فلسطين — غزة',
  links: SOCIAL_ORDER.map((platform) => ({ platform, url: '', visible: false })),
};

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

export const DEFAULT_COMMITTEE_CRITERIA: CommitteeCriteriaSettings = {
  requirements: {
    training: [
      'العلاقات والتنسيق الداخلي: القدرة على التواصل والتنسيق الرسمي مع إدارات الجامعة، عمادات الكليات، ورؤساء الأقسام، واستصدار الموافقات والتراخيص اللازمة للأنشطة وحجز القاعات.',
      'العلاقات الخارجية والشراكات: امتلاك مهارات التواصل والتشبيك المهني مع الشركات الهندسية، النقابات، والمؤسسات الشريكة، وبناء الشراكات ورعاية المبادرات واستقطاب الخبراء والمدربين.',
      'اللباقة وفنون الاتصال: أسلوب حواري راقٍ ولباقة عالية في التحدث الرسمي، مع إتقان المراسلات وصياغة الكتب الرسمية باحترافية.',
      'الانضباط والتمثيل الرسمي: الالتزام الصارم بالمواعيد وتحمل مسؤولية المتابعة والتمثيل المشرّف للنادي أمام الضيوف والشركاء.',
    ],
    media: [
      'التوثيق والتغطية الميدانية: امتلاك هاتف ذكي بكاميرا تصوير احترافية وعالية الدقة لتوثيق الفعاليات والأنشطة أولاً بأول.',
      'التصميم الجرافيكي والمونتاج: إتقان العمل على برامج التصميم والمونتاج (Adobe Photoshop, Illustrator, Premiere) أو تطبيقات صناعة المحتوى البصري.',
      'الاتصال والحس الفني: امتلاك الرؤية الإبداعية في إبراز هوية النادي والالتزام بسرعة فرز وتسليم التغطيات والمواد الإعلامية فور اختتام الفعالية دون تأخير.',
    ],
    events: [
      'الإدارة الميدانية والتنظيم: الحيوية والقدرة على إدارة الحشود وتوجيه الطلبة وتنظيم القاعات والمنصات والتجهيزات التقنية واللوجستية للبرامج.',
      'العمل بروح الفريق تحت الضغط: الجاهزية الميدانية والمرونة في التعامل مع المتغيرات الطارئة أثناء الأنشطة والفعاليات والهاكاثونات الكبرى.',
      'الالتزام بالحضور الميداني: التواجد المسبق للتحضير قبل انطلاق البرامج والاستمرار الميداني حتى إتمامها وترتيب الموقع بالكامل.',
    ],
  },
  pledgeText: 'أقر وأتعهد بأن كافة الشروط والمعايير المذكورة أعلاه تنطبق عليّ، وأدرك تماماً أنه في حال عدم مطابقتها أثناء التقييم والمقابلة، سيتم تحويل طلبي تلقائياً إلى عضوية عامة ببطاقة رقمية رسمية معتمدة.',
  evaluationNote: 'نظراً لمحدودية المقاعد في اللجان التنظيمية، سيتم فرز المتقدمين من قِبل لجنة تقييم مختصة بناءً على معايير الكفاءة والخبرة وسابقة الأعمال، وبما يضمن التمثيل العادل والمتوازن لكافة الكليات والتخصصات الهندسية. يُسمح بتقديم طلب واحد فقط لكل طالب.',
};

export const DEFAULT_MESSAGE_TEMPLATES: MessageTemplatesSettings = {
  regularAcceptance: `السلام عليكم ورحمة الله وبركاته،

الزميل المهندس / الزميلة المهندسة: {الاسم} المحترمـ/ـة
تحية طيبة وبعد،،

يسر مجلس إدارة النادي الهندسي في جامعة فلسطين أن يهنئك بقبول طلب انضمامك رسمياً لعضوية النادي ضمن "{اللجنة}"{المسمى} للعام الجامعي 2026/2027.

🪪 بيانات عضويتك واعتمادك الرسمي:
• رمز العضو / كود الدخول الأول: {رمز_العضو}
• الرقم الجامعي: {الرقم_الجامعي}
• الكلية: {الكلية}
• التخصص: {التخصص}
{الصلاحية}
🔐 خطوتك الأولى — تفعيل حسابك وتعيين كلمة المرور:
ادخل إلى صفحة «حسابي» برقمك الجامعي ورمز العضو أعلاه، لتعيين كلمة مرور خاصة بك، والتسجيل في الورش والفعاليات ومتابعة عضويتك:
🔗 {رابط_حسابي}

📇 رابط استعراض وحفظ بطاقتك الرقمية الرسمية:
🔗 {رابط_البطاقة}

نرحب بك عضواً فاعلاً في مجتمع مهندسي الغد، ونتطلع لمشاركتك وإبداعاتك معنا في الأنشطة القادمة.

مع خالص التحيات والتقدير،
الهيئة الإدارية — النادي الهندسي
جامعة فلسطين`,

  leadershipAcceptance: `السلام عليكم ورحمة الله وبركاته،

حضرة الزميل القائد / الزميلة القائدة: {الاسم} المحترمـ/ـة
تحية طيبة وبعد،،

بقرار من مجلس إدارة النادي الهندسي في جامعة فلسطين، يسرنا إبلاغك باعتماد تكليفك الرسمي عضواً في الكادر القيادي للنادي ضمن "{اللجنة}" بمسمى ({المسمى}) للدورة النقابية والأكاديمية 2026/2027.

🪪 بيانات الاعتماد والتكليف القيادي:
• رمز الاعتماد / كود الدخول: {رمز_العضو}
• الرقم الجامعي: {الرقم_الجامعي}
• المنصب والتكليف: {المسمى}
• الكلية والتخصص: {الكلية} — {التخصص}
• صفة الاعتماد: تكليف قيادي معتمد لكامل الدورة النقابية 2026/2027

🔐 تفعيل الحساب القيادي:
يرجى تسجيل الدخول إلى بوابة «حسابي» برقمك الجامعي والرمز لتفعيل الحساب ومتابعة اللجان والمهام:
🔗 {رابط_حسابي}

📇 بطاقة التكليف القيادي الرقمية المعتمدة:
🔗 {رابط_البطاقة}

نضع ثقتنا في كفاءتك لقيادة وتطوير أنشطة النادي وصناعة الأثر المتميز لطلبتنا وكلياتنا.

مجلس إدارة النادي الهندسي
جامعة فلسطين`,

  transferredAcceptance: `السلام عليكم ورحمة الله وبركاته،

الزميل المهندس / الزميلة المهندسة: {الاسم} المحترمـ/ـة
تحية طيبة وبعد،،

نظراً للإقبال الكبير ومحدودية المقاعد التنظيمية المتاحة في ({اللجنة_المطلوبة}) واشتداد التنافس، يسر مجلس إدارة النادي الهندسي في جامعة فلسطين إعلامك باعتماد قبولك كـ "عضو في النادي الهندسي — عضوية عامة" للعام الجامعي 2026/2027.

يسعدنا ويشرفنا وجودك معنا لتستفيد وتشارك في كافة ورش العمل، الفعاليات الميدانية، والمسابقات الهندسية، وتطوير مهاراتك لتكون في طليعة المرشحين للجان في الدورات القادمة!

🪪 بيانات بطاقتك وعضويتك:
• رمز العضو / كود الدخول الأول: {رمز_العضو}
• الرقم الجامعي: {الرقم_الجامعي}
• نوع العضوية: عضوية عامة (عضو بالنادي)
{الصلاحية}
🔐 خطوتك الأولى — تفعيل حسابك:
ادخل إلى صفحة «حسابي» برقمك الجامعي ورمز العضو أعلاه، لتعيين كلمة مرورك الخاصة والتسجيل بالفعاليات:
🔗 {رابط_حسابي}

📇 رابط استعراض وحفظ بطاقتك الرقمية الرسمية:
🔗 {رابط_البطاقة}

أهلاً بك معنا في صُنع أثر الغد! 🚀
الهيئة الإدارية — النادي الهندسي
جامعة فلسطين`,

  interviewInvitation: `السلام عليكم ورحمة الله وبركاته،

الزميل المهندس / الزميلة المهندسة: {الاسم} المحترمـ/ـة
تحية طيبة وبعد،،

بناءً على طلب انضمامك إلى "{اللجنة}" في النادي الهندسي بجامعة فلسطين، يسرنا دعوتك لحضور المقابلة الشخصية والتقييم:

📅 {موعد_المقابلة}
📍 مقر النادي الهندسي — جامعة فلسطين

يرجى التواجد في الموعد المحدد، ونتطلع للتعرف عليك ومناقشة انضمامك لفريق العمل.

مع خالص التحيات،
لجنة التقييم والاستقطاب — النادي الهندسي`,
};

const DEFAULT_RECRUITMENT_SETTINGS: RecruitmentSettings = {
  isGlobalRecruitmentOpen: true,
  globalClosedMessage: 'باب استقطاب اللجان متوقف مؤقتاً لحين انتهاء تقييم الدفعة الحالية.',
  committees: {
    general: { isOpen: true, closedNotice: 'الاستقطاب للعضوية العامة مغلق مؤقتاً' },
    events: { isOpen: true, closedNotice: 'اكتملت المقاعد المتاحة للجنة الأنشطة والبرامج' },
    training: { isOpen: true, closedNotice: 'اكتملت المقاعد المتاحة للجنة العلاقات والشراكات' },
    media: { isOpen: true, closedNotice: 'اكتملت المقاعد المتاحة للجنة الإعلام والاتصال' },
  },
  criteria: DEFAULT_COMMITTEE_CRITERIA,
  messageTemplates: DEFAULT_MESSAGE_TEMPLATES,
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
  showFaqSection: true,
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
  contact: 'contact',
  tickets: 'tickets',
  faqs: 'faqs',
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
  contact: ContactSettings;
  tickets: EventTicket[];
  faqs: FaqItem[];
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
  contact: DEFAULT_CONTACT_SETTINGS,
  tickets: [],
  faqs: DEFAULT_FAQS,
});

interface ApplicationRow {
  id: string;
  student_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: StoredApplication['status'];
  data: Partial<StoredApplication> | null;
  submitted_at: string;
  member_code?: string | null;
  accepted_at?: string | null;
  membership_type?: 'temporary' | 'semester' | 'executive' | null;
  valid_until?: string | null;
  suspended_at?: string | null;
  suspend_reason?: string | null;
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
  /** موعد المقابلة إن حُدد */
  interviewAt?: string;
  interviewTimeTbd?: boolean;
  /** Last 4 characters of the private member code */
  codeHint?: string;
  membershipType?: 'temporary' | 'semester' | 'executive';
  validUntil?: string;
  suspendedAt?: string;
  suspendReason?: string;
  membershipState?: 'temporary' | 'semester' | 'expired' | 'suspended' | 'not_member' | 'accredited';
}

const rowToApplication = (row: ApplicationRow): StoredApplication => {
  const isSuspended = Boolean(row.suspended_at);
  const isExpired = Boolean(row.valid_until && new Date(row.valid_until).getTime() < Date.now());
  const rowData = (row.data || {}) as Partial<StoredApplication>;
  const role = (rowData.organizationalRole || '').trim();
  const isExec =
    row.membership_type === 'executive' ||
    isExecutivePosition({
      organizationalRole: role,
      assignedCommittee: rowData.assignedCommittee,
      targetCommittee: rowData.targetCommittee,
      membershipType: row.membership_type || undefined,
    });

  const membershipState =
    row.status !== 'تم القبول'
      ? 'not_member'
      : isSuspended
        ? 'suspended'
        : isExec
          ? 'semester'
          : isExpired
            ? 'expired'
            : (row.membership_type === 'executive' ? 'semester' : (row.membership_type || 'temporary'));

  return {
    ...((rowData || {}) as ClubApplication),
    id: row.id,
    studentId: row.student_id,
    fullName: row.full_name,
    email: row.email || '',
    phone: row.phone || '',
    skills: rowData.skills || [],
    status: row.status,
    submittedAt: row.submitted_at,
    memberCode: row.member_code || undefined,
    acceptedAt: row.accepted_at || undefined,
    membershipType: isExec ? 'executive' : (row.membership_type || undefined),
    validUntil: isExec ? undefined : (row.valid_until || undefined),
    suspendedAt: row.suspended_at || undefined,
    suspendReason: row.suspend_reason || undefined,
    membershipState,
  };
};

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

    // Enrich applications missing photoUrl with Leadership Cadre or College Coordinator avatars
    const leaders = this.getLeadership();
    const colleges = this.getColleges();
    this.applications = this.applications.map((a) => {
      const cleanA = (a.fullName || '').trim().replace(/^م\.\s*/, '');
      const cleanSid = (a.studentId || '').replace(/[^0-9]/g, '');

      const match = leaders.find((l) => {
        const cleanL = (l.name || '').trim().replace(/^م\.\s*/, '');
        if (cleanA && cleanL && (cleanA === cleanL || cleanA.includes(cleanL) || cleanL.includes(cleanA))) return true;
        if (cleanSid && l.id && l.id.includes(cleanSid)) return true;
        if (a.email && l.email && a.email.toLowerCase() === l.email.toLowerCase()) return true;
        return false;
      });

      if (match) {
        const isExecTier = match.tier === 'executive' || match.tier === 'committee-lead' || match.tier === 'college-lead';
        return {
          ...a,
          photoUrl: a.photoUrl || match.avatar || undefined,
          organizationalRole: a.organizationalRole || match.role,
          membershipType: isExecTier ? 'executive' : a.membershipType,
          membershipState: isExecTier ? (a.suspendedAt ? 'suspended' : 'semester') : a.membershipState,
        };
      }

      // Check matching college coordinator
      const matchCol = colleges.find((c) => {
        const coord = c.coordinator;
        if (!coord?.name) return false;
        const cleanCoord = coord.name.trim().replace(/^م\.\s*/, '');
        return cleanA && cleanCoord && (cleanA === cleanCoord || cleanA.includes(cleanCoord) || cleanCoord.includes(cleanA));
      });

      if (matchCol?.coordinator) {
        return {
          ...a,
          photoUrl: a.photoUrl || matchCol.coordinator.avatar || undefined,
          organizationalRole: a.organizationalRole || matchCol.coordinator.role,
          membershipType: 'executive',
          membershipState: a.suspendedAt ? 'suspended' : 'semester',
        };
      }

      return a;
    });

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
    const leadership = this.upsertById(this.getLeadership(), member);
    this.setContent('leadership', leadership);

    // If leader is a college representative, bi-directionally sync with Colleges
    if (member.tier === 'college-lead') {
      const colleges = this.getColleges();
      const memberColId = member.id.replace('lead-col-', '');
      const college = colleges.find(
        (c) =>
          c.id === memberColId ||
          (member.department && (c.name.includes(member.department) || member.department.includes(c.shortName) || member.department.includes(c.name))) ||
          (member.role && (c.name.includes(member.role) || (c.shortName && member.role.includes(c.shortName))))
      );

      if (college) {
        const updatedCollege: College = {
          ...college,
          coordinator: {
            ...college.coordinator,
            name: member.name || 'ممثلو الكلية في النادي',
            role: member.role || college.coordinator.role,
            avatar: member.avatar || college.coordinator.avatar,
            email: member.email || college.coordinator.email,
          },
        };
        this.setContent('colleges', this.upsertById(colleges, updatedCollege));
      }
    }

    // Bi-directionally synchronize with matching application in club_applications
    const cleanMemberName = (member.name || '').trim().replace(/^م\.\s*/, '');
    const cleanMemberSid = (member.id || '').replace(/[^0-9]/g, '');

    const matchingApp = this.applications.find((a) => {
      const cleanA = (a.fullName || '').trim().replace(/^م\.\s*/, '');
      const cleanSid = (a.studentId || '').replace(/[^0-9]/g, '');
      if (cleanMemberName && cleanA && (cleanA === cleanMemberName || cleanA.includes(cleanMemberName) || cleanMemberName.includes(cleanA))) return true;
      if (cleanMemberSid && cleanSid && cleanSid === cleanMemberSid) return true;
      if (member.email && a.email && member.email.trim().toLowerCase() === a.email.trim().toLowerCase()) return true;
      return false;
    });

    if (matchingApp) {
      const isExecTier = member.tier === 'executive' || member.tier === 'committee-lead' || member.tier === 'college-lead';
      const updatedApp: StoredApplication = {
        ...matchingApp,
        photoUrl: member.avatar?.trim() || matchingApp.photoUrl,
        organizationalRole: member.role?.trim() || matchingApp.organizationalRole,
        assignedCommittee: member.department?.trim() || matchingApp.assignedCommittee,
        membershipType: isExecTier ? 'executive' : matchingApp.membershipType,
        membershipState: isExecTier ? (matchingApp.suspendedAt ? 'suspended' : 'semester') : matchingApp.membershipState,
      };
      this.applications = this.applications.map((a) => (a.id === matchingApp.id ? updatedApp : a));
      this.notify();

      // Persist to Supabase club_applications
      const { id, studentId, fullName, email, phone, status, submittedAt, ...data } = updatedApp;
      void this.runAdminWrite('فشل تحديث بيانات العضو من الكادر القيادي', (client) =>
        client.from('club_applications').update({
          data,
          membership_type: updatedApp.membershipType || null,
        }).eq('id', matchingApp.id)
      );
    }
  }

  public deleteLeader(id: string) {
    const leader = this.getLeadership().find((m) => m.id === id);
    this.setContent('leadership', this.getLeadership().filter((m) => m.id !== id));

    if (leader && leader.tier === 'college-lead') {
      const colleges = this.getColleges();
      const college = colleges.find(
        (c) =>
          c.id === leader.id.replace('lead-col-', '') ||
          (leader.department && (c.name.includes(leader.department) || leader.department.includes(c.shortName)))
      );
      if (college) {
        const updatedCollege: College = {
          ...college,
          coordinator: {
            ...college.coordinator,
            name: 'ممثلو الكلية في النادي',
            avatar: '',
            email: '',
          },
        };
        this.setContent('colleges', this.upsertById(colleges, updatedCollege));
      }
    }
  }

  // --- COLLEGES ---
  public getColleges(): College[] {
    return Array.isArray(this.content.colleges) ? this.content.colleges : COLLEGES;
  }

  public saveCollege(college: College) {
    const colleges = this.upsertById(this.getColleges(), college);
    this.setContent('colleges', colleges);

    // Bi-directionally synchronize matching college-lead in leadership
    const leadership = this.getLeadership();
    const coord = college.coordinator;
    const isNamed = Boolean(coord && coord.name && coord.name.trim() && coord.name !== 'ممثلو الكلية في النادي');

    const collegeKey = college.id.toLowerCase();
    const existingIndex = leadership.findIndex(
      (l) =>
        l.id === `lead-col-${college.id}` ||
        (l.tier === 'college-lead' &&
          (l.department.toLowerCase().includes(collegeKey) ||
            (college.shortName && l.department.includes(college.shortName)) ||
            (college.name && l.department.includes(college.name)) ||
            (l.role && college.shortName && l.role.includes(college.shortName))))
    );

    if (existingIndex >= 0) {
      const existing = leadership[existingIndex];
      const updatedLeader: LeaderMember = {
        ...existing,
        name: isNamed ? coord.name.trim() : '',
        avatar: coord.avatar || existing.avatar,
        email: coord.email !== undefined ? coord.email.trim() : (existing.email || ''),
        role: coord.role && coord.role !== 'لجنة التنسيق والمتابعة الطلابية' ? coord.role : existing.role || `ممثل ${college.name}`,
        department: college.name,
      };
      this.setContent('leadership', this.upsertById(leadership, updatedLeader));
    } else {
      const newLeader: LeaderMember = {
        id: `lead-col-${college.id}`,
        name: isNamed ? coord.name.trim() : '',
        role: coord.role && coord.role !== 'لجنة التنسيق والمتابعة الطلابية' ? coord.role : `ممثل ${college.name}`,
        tier: 'college-lead',
        department: college.name,
        avatar: coord.avatar || '',
        quote: `تمثيل طلبة ${college.name} في النادي الهندسي والتنسيق المستمر للأنشطة والمبادرات.`,
        email: coord.email || '',
        skills: ['تمثيل الكلية', 'التنسيق الأكاديمي', 'المبادرات الطلابية'],
      };
      this.setContent('leadership', [...leadership, newLeader]);
    }
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
      showProjectsSection: data.showProjectsSection !== false,
      showLiveFeedSection: data.showLiveFeedSection !== false,
      showFaqSection: data.showFaqSection !== false,
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

  // --- FAQS ---
  public getFaqs(): FaqItem[] {
    const list = Array.isArray(this.content.faqs) ? this.content.faqs : DEFAULT_FAQS;
    return [...list].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  public saveFaq(faq: FaqItem) {
    const current = this.getFaqs();
    const next = this.upsertById(current, faq);
    this.setContent('faqs', next);
  }

  public saveFaqs(faqs: FaqItem[]) {
    this.setContent('faqs', faqs);
  }

  public deleteFaq(id: string) {
    const next = this.getFaqs().filter((f) => f.id !== id);
    this.setContent('faqs', next);
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
    this.applications = this.applications.map((a) => {
      if (a.id !== id) return a;
      const isAccepted = status === 'تم القبول';
      const isExec = isExecutivePosition(a);
      const validUntil = isExec
        ? undefined
        : (a.validUntil || (isAccepted ? new Date(Date.now() + 14 * 86_400_000).toISOString() : a.validUntil));
      const membershipType = isExec
        ? 'executive'
        : (a.membershipType || (isAccepted ? 'temporary' : a.membershipType));
      const acceptedAt = a.acceptedAt || (isAccepted ? new Date().toISOString() : undefined);
      const membershipState = isAccepted ? (a.suspendedAt ? 'suspended' : isExec ? 'semester' : 'temporary') : 'not_member';
      return { ...a, status, validUntil, membershipType, acceptedAt, membershipState };
    });
    this.notify();
    void this.runAdminWrite('فشل تحديث حالة الطلب', (client) =>
      client.from('club_applications').update({ status }).eq('id', id)
    );
  }

  public updateApplicationSuspended(id: string, suspended: boolean, reason?: string) {
    this.applications = this.applications.map((a) => {
      if (a.id !== id) return a;
      const suspendedAt = suspended ? new Date().toISOString() : undefined;
      const suspendReason = suspended ? reason?.trim() || undefined : undefined;
      const membershipState = suspended
        ? 'suspended'
        : a.membershipType === 'executive'
          ? 'semester'
          : (a.membershipType || 'temporary');
      return { ...a, suspendedAt, suspendReason, membershipState };
    });
    this.notify();
  }

  /** Admin: place a member in a committee and give them a title. Stored inside the application's data.
   * Automatically synchronizes with Leadership Cadre and College Representatives when appointed to leadership roles.
   */
  public updateApplicationAssignment(id: string, assignment: { assignedCommittee: string; organizationalRole: string }) {
    const app = this.applications.find((a) => a.id === id);
    if (!app) return;
    const oldRole = (app.organizationalRole || '').trim();
    const newRole = (assignment.organizationalRole || '').trim();
    const targetComm = assignment.assignedCommittee || app.targetCommittee || '';

    const updated: StoredApplication = { ...app, ...assignment };
    this.applications = this.applications.map((a) => (a.id === id ? updated : a));
    this.notify();

    const { id: _id, studentId: _sid, fullName: _name, email: _email, phone: _phone, status: _status, submittedAt: _at, ...data } = updated;
    void this.runAdminWrite('فشل حفظ التعيين', (client) =>
      client.from('club_applications').update({ data }).eq('id', id)
    );

    // --- AUTOMATIC LEADERSHIP SYNCHRONIZATION ---
    // 1. If oldRole was a leadership role and newRole changed, vacate the old seat if it holds this student's name
    if (oldRole && oldRole !== newRole) {
      const leadership = this.getLeadership();
      const previouslyOccupied = leadership.find((l) => l.name.trim() === app.fullName.trim());
      if (previouslyOccupied) {
        const isStillLeaderRole =
          newRole.includes('رئيس') || newRole.includes('ممثل') || newRole.includes('منسق') || newRole.includes('صندوق') || newRole.includes('نائب');
        if (!isStillLeaderRole) {
          this.saveLeader({ ...previouslyOccupied, name: '', email: '', avatar: '' });
        }
      }
    }

    // 2. If newRole is a leadership position, automatically occupy the leadership cadre
    if (newRole) {
      const isPresident = newRole.includes('رئيس النادي') && !newRole.includes('نائب');
      const isVpAdmin = newRole.includes('نائب') && (newRole.includes('إداري') || targetComm.includes('إداري'));
      const isVpExec = newRole.includes('نائب') && (newRole.includes('تنفيذي') || targetComm.includes('تنفيذي'));
      const isTreasurer = newRole.includes('صندوق');

      const isCommitteeHead =
        newRole.includes('مسؤول اللجنة') || newRole.includes('مسؤول لجنة') ||
        newRole.includes('رئيس اللجنة') || newRole.includes('رئيس لجنة') || (newRole === 'رئيس' && !isPresident);
      const isCollegeRep =
        newRole.includes('ممثل كلية') || newRole.includes('منسق كلية') || targetComm.includes('ممثلو الكليات');

      const leadership = this.getLeadership();
      let targetLeader: LeaderMember | undefined;

      if (isPresident) {
        targetLeader = leadership.find((l) => l.id === 'pres-1' || (l.role.includes('رئيس النادي') && !l.role.includes('نائب')));
      } else if (isVpAdmin) {
        targetLeader = leadership.find((l) => l.id === 'vp-admin' || (l.role.includes('نائب') && l.role.includes('إداري')));
      } else if (isVpExec) {
        targetLeader = leadership.find((l) => l.id === 'vp-exec' || (l.role.includes('نائب') && l.role.includes('تنفيذي')));
      } else if (isTreasurer) {
        targetLeader = leadership.find((l) => l.id === 'treasurer-1' || l.role.includes('صندوق'));
      } else if (isCommitteeHead) {
        if (targetComm.includes('فعاليات') || newRole.includes('فعاليات')) {
          targetLeader = leadership.find((l) => l.id === 'comm-events' || l.department.includes('فعاليات'));
        } else if (
          targetComm.includes('علاقات') ||
          targetComm.includes('تدريب') ||
          newRole.includes('تدريب') ||
          newRole.includes('علاقات')
        ) {
          targetLeader = leadership.find((l) => l.id === 'comm-training' || l.department.includes('تدريب') || l.department.includes('علاقات'));
        } else if (targetComm.includes('إعلام') || newRole.includes('إعلام')) {
          targetLeader = leadership.find((l) => l.id === 'comm-media' || l.department.includes('إعلام'));
        }
      } else if (isCollegeRep) {
        const colStr = `${app.college || ''} ${app.major || ''} ${targetComm} ${newRole}`;
        if (colStr.includes('برمجيات') || colStr.includes('ذكاء')) {
          targetLeader = leadership.find((l) => l.id === 'lead-col-software-ai' || l.department.includes('برمجيات'));
        } else if (colStr.includes('معلومات') || colStr.includes('IT') || colStr.includes('وسائط')) {
          targetLeader = leadership.find((l) => l.id === 'lead-col-it-computing' || l.department.includes('معلومات'));
        } else if (colStr.includes('تطبيقية') || colStr.includes('عمراني') || colStr.includes('معمارية') || colStr.includes('مدنية')) {
          targetLeader = leadership.find((l) => l.id === 'lead-col-applied-urban' || l.department.includes('عمراني') || l.department.includes('تطبيقية'));
        }
      }

      if (targetLeader) {
        const updatedLeader: LeaderMember = {
          ...targetLeader,
          name: app.fullName,
          email: app.email || targetLeader.email,
        };
        this.saveLeader(updatedLeader);
      }
    }
  }

  /** Admin: set (or clear) the interview appointment kept inside the application's data. */
  public scheduleInterview(id: string, interviewAt: string | null, timeTbd = false) {
    const app = this.applications.find((a) => a.id === id);
    if (!app) return;
    const updated: StoredApplication = {
      ...app,
      status: interviewAt ? 'مقابلة مجدولة' : app.status,
      interviewAt: interviewAt || undefined,
      interviewTimeTbd: interviewAt ? timeTbd : undefined,
    };
    this.applications = this.applications.map((a) => (a.id === id ? updated : a));
    this.notify();

    const { id: _id, studentId: _sid, fullName: _name, email: _email, phone: _phone, status, submittedAt: _at, ...data } = updated;
    void this.runAdminWrite('فشل حفظ موعد المقابلة', (client) =>
      client.from('club_applications').update({ data, status }).eq('id', id)
    );
  }

  /** Admin: fix a student's email/phone/fullName. Awaited so a following email send reads the new address. */
  public async updateApplicationContact(
    id: string,
    contact: { email: string; phone: string; fullName?: string }
  ): Promise<void> {
    const app = this.applications.find((a) => a.id === id);
    if (!app) throw new Error('لم يتم العثور على الطلب');
    const updatedName = contact.fullName?.trim() || app.fullName;
    const updated: StoredApplication = {
      ...app,
      email: contact.email.trim().toLowerCase(),
      phone: contact.phone.trim(),
      fullName: updatedName,
    };
    const { id: _id, studentId: _sid, fullName: _name, status: _status, submittedAt: _at, ...data } = updated;
    const dataPayload: Record<string, unknown> = {
      ...data,
      fullName: updatedName,
      email: updated.email,
      phone: updated.phone,
    };

    const payload: Record<string, unknown> = {
      email: updated.email,
      phone: updated.phone,
      full_name: updatedName,
      data: dataPayload,
    };

    const { error } = await (await getSupabase())
      .from('club_applications')
      .update(payload)
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
    const lookup = (await publicRpc<MemberLookup | null>('verify_member', { code: clean })) || null;
    if (!lookup) return null;

    if (isExecutivePosition(lookup)) {
      lookup.membershipType = 'executive';
      if (lookup.status === 'تم القبول' && !lookup.suspendedAt) {
        lookup.membershipState = 'semester';
      }
    }
    return lookup;
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
      const keys: ContentKey[] = ['projects', 'events', 'courses', 'leadership', 'colleges', 'majors', 'spotlight', 'settings', 'recruitment', 'tickets', 'faqs'];
      for (const key of keys) {
        if (data[key]) this.setContent(key, data[key]);
      }
      return true;
    } catch {
      return false;
    }
  }

  // --- CONTACT & OFFICIAL LINKS ---
  public getContactSettings(): ContactSettings {
    const stored = this.content.contact;
    const saved: ContactSettings = { ...DEFAULT_CONTACT_SETTINGS, ...(stored || {}) };
    if (!saved.email || saved.email === 'eng.club@up.edu.ps') {
      saved.email = 'upsmart.support@gmail.com';
    }
    // Keep every known platform in the list so the dashboard can show them all.
    const byPlatform = new Map((saved.links || []).map((l) => [l.platform, l]));
    return {
      ...saved,
      links: SOCIAL_ORDER.map(
        (platform) => byPlatform.get(platform) || { platform, url: '', visible: false }
      ),
    };
  }

  public saveContactSettings(settings: ContactSettings) {
    this.setContent('contact', settings);
  }

  /** Only the links an admin filled in and left visible. */
  public getVisibleSocialLinks(): SocialLink[] {
    return this.getContactSettings().links.filter((l) => l.visible && l.url.trim());
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
      criteria: {
        ...DEFAULT_COMMITTEE_CRITERIA,
        ...(data.criteria || {}),
        requirements: {
          ...DEFAULT_COMMITTEE_CRITERIA.requirements,
          ...(data.criteria?.requirements || {}),
        },
      },
      messageTemplates: {
        ...DEFAULT_MESSAGE_TEMPLATES,
        ...(data.messageTemplates || {}),
      },
      lastUpdated: data.lastUpdated,
    };
  }

  public saveRecruitmentSettings(settings: RecruitmentSettings) {
    this.setContent('recruitment', { ...settings, lastUpdated: new Date().toISOString() });
  }

  public getCommitteeCriteria(): CommitteeCriteriaSettings {
    return this.getRecruitmentSettings().criteria || DEFAULT_COMMITTEE_CRITERIA;
  }

  public saveCommitteeCriteria(criteria: CommitteeCriteriaSettings) {
    const current = this.getRecruitmentSettings();
    this.saveRecruitmentSettings({
      ...current,
      criteria,
    });
  }

  public getMessageTemplates(): MessageTemplatesSettings {
    return this.getRecruitmentSettings().messageTemplates || DEFAULT_MESSAGE_TEMPLATES;
  }

  public saveMessageTemplates(messageTemplates: MessageTemplatesSettings) {
    const current = this.getRecruitmentSettings();
    this.saveRecruitmentSettings({
      ...current,
      messageTemplates,
    });
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
