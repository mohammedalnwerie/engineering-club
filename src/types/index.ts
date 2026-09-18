export interface College {
  id: string;
  code: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  accentColor: string;
  gradient: string;
  coordinator: {
    name: string;
    role: string;
    title: string;
    avatar: string;
    email: string;
  };
  majors: string[];
  labsCount: number;
  studentsCount: number;
  projectsCount: number;
  featuredLabs: string[];
  flagshipAchievement: string;
}

export interface Major {
  id: string;
  code: string;
  name: string;
  collegeId: string;
  collegeName: string;
  tagline: string;
  description: string;
  iconName: string;
  accentColor: string;
  techStack: string[];
  careerPaths: string[];
  keyCourses: string[];
  featuredProjectTitle: string;
}

export interface ProjectCaseStudy {
  id: string;
  title: string;
  tagline: string;
  category: 'software' | 'ai' | 'robotics' | 'architecture' | 'civil' | 'iot';
  collegeId: string;
  collegeName: string;
  featured: boolean;
  award?: string;
  problem: string;
  solution: string;
  impactMetrics: { label: string; value: string }[];
  techStack: string[];
  team: { name: string; role: string; major: string }[];
  demoUrl?: string;
  githubUrl?: string;
  schematicType: string;
  status: 'Deployed' | 'Prototyped' | 'In Testing';
}

export interface EventItem {
  id: string;
  title: string;
  category: 'Hackathon' | 'Workshop' | 'Site Visit' | 'Conference';
  date: string;
  time: string;
  location: string;
  capacity: number;
  registeredCount: number;
  speakers: { name: string; title: string }[];
  description: string;
  prerequisites: string[];
  badgeColor: string;
}

export interface TrainingCourse {
  id: string;
  title: string;
  instructor: {
    name: string;
    title: string;
    avatar: string;
  };
  level: 'مبتدئ' | 'متوسط' | 'متقدم';
  duration: string;
  totalHours: number;
  totalSeats: number;
  availableSeats: number;
  startDate: string;
  skillsGained: string[];
  syllabusWeeks: { week: number; title: string; topics: string[] }[];
  category: string;
}

export interface LeaderMember {
  id: string;
  name: string;
  role: string;
  tier: 'executive' | 'college-lead' | 'committee-lead';
  department: string;
  avatar: string;
  quote: string;
  linkedin?: string;
  github?: string;
  email: string;
  skills: string[];
  /** true = البطاقة مخفية عن الموقع (منصب شاغر مثلاً) */
  hidden?: boolean;
}

export interface ClubApplication {
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  academicYear: string;
  college: string;
  major: string;
  skills: string[];
  customSkill?: string;
  portfolioUrl?: string;
  /** صورة الطالب على البطاقة — اختيارية */
  photoUrl?: string;
  personalStatement: string;
  targetCommittee: string;
  weeklyCommitmentHours: number;
}

export interface StoredApplication extends ClubApplication {
  id: string;
  /** Set by an admin: committee the member was placed in (may differ from the requested one) */
  assignedCommittee?: string;
  /** Set by an admin: title printed on the committee card */
  organizationalRole?: string;
  /** Set by the send-acceptance-email function */
  acceptanceEmailSentAt?: string;
  /** موعد المقابلة إن حُدد (ISO). قد يكون اليوم فقط بدون ساعة */
  interviewAt?: string;
  /** اليوم محدد والساعة لاحقاً */
  interviewTimeTbd?: boolean;
  /** Private code issued on acceptance (database update-005) */
  memberCode?: string;
  acceptedAt?: string;
  membershipType?: 'temporary' | 'semester';
  validUntil?: string;
  suspendedAt?: string;
  suspendReason?: string;
  membershipState?: 'temporary' | 'semester' | 'expired' | 'suspended' | 'not_member';
  status: 'قيد المراجعة' | 'مقابلة مجدولة' | 'تم القبول' | 'مرفوض';
  submittedAt: string;
}

export interface EventTicket {
  id: string;
  eventId: string;
  eventTitle: string;
  attendeeName: string;
  studentId?: string;
  email?: string;
  ticketNumber: string;
  qrHash: string;
  registeredAt: string;
  checkedIn: boolean;
}

export interface BrandValue {
  id: string;
  name: string;
  description: string;
  iconName: string;
}

export interface SiteSettings {
  heroTitle: string;
  heroHighlight: string;
  heroSubheadline1: string;
  heroSubheadline2: string;
  operatingSystemVersion: string;
  clubNameAr: string;
  clubNameEn: string;
  universityNameAr: string;
  universityNameEn: string;
  sloganAr: string;
  sloganEn: string;
  aboutUs?: string;
  vision: string;
  mission: string;
  values: BrandValue[];
  showEventsSection?: boolean;
  showProjectsSection?: boolean;
  showLiveFeedSection?: boolean;
}

/** بيانات التواصل والروابط الرسمية التي تظهر في تذييل الموقع */
export interface ContactSettings {
  email: string;
  phone?: string;
  addressAr?: string;
  links: import('../data/socials').SocialLink[];
}

export interface StudentSpotlightData {
  name: string;
  major: string;
  achievement: string;
  avatar: string;
  quote: string;
  projectsCount: number;
  awardsCount: number;
  publicationsCount: number;
}

/** كم هو مستعجل الطلب — يحدد ترتيب المتابعة في لوحة الإدارة */
export type ComplaintPriority = 'normal' | 'medium' | 'urgent';

export interface ComplaintItem {
  id: string;
  ticketNumber: string; // e.g. UP-CMP-2026-0812
  studentName: string;
  studentId: string;
  email: string;
  phone?: string;
  college: string;
  category: 'complaint' | 'suggestion' | 'inquiry' | 'academic' | 'facilities' | 'club_activities' | 'other';
  subject: string;
  message: string;
  attachmentImage?: string; // Base64 data URL of student's screenshot/photo
  priority?: ComplaintPriority;
  /** لم يعد التقديم مجهولاً؛ تبقى للطلبات القديمة */
  isAnonymous?: boolean;
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected' | 'new' | 'in_progress';
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}



export interface CommitteeRecruitmentStatus {
  isOpen: boolean;
  closedNotice?: string;
  maxSeats?: number;
}

export interface MembershipSettings {
  trialDays: number;
  /** YYYY-MM-DD — تاريخ ثابت لنهاية البطاقة الأولى. فارغ = استخدم عدد الأيام */
  trialEndsAt?: string;
  semesterFee: number;
  currency: string;
  semesterLabel: string;
  /** YYYY-MM-DD — semester memberships stay valid until the end of this day */
  semesterEndsAt: string;
  paymentMethods: string[];
  paymentInstructions: string;
}

export interface RecruitmentSettings {
  isGlobalRecruitmentOpen: boolean;
  globalClosedMessage?: string;
  committees: Record<string, CommitteeRecruitmentStatus>;
  lastUpdated?: string;
}
