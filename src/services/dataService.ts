import { safeStorage } from './safeStorage';
import { sanitizeText, sanitizeUrl } from '../utils/security';
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
  RecruitmentSettings
} from '../types';

const STORAGE_KEYS = {
  PROJECTS: 'eng_club_projects_v2',
  EVENTS: 'eng_club_events_v2',
  COURSES: 'eng_club_courses_v2',
  APPLICATIONS: 'eng_club_applications_v2',
  TICKETS: 'eng_club_tickets_v1',
  LEADERSHIP: 'eng_club_leadership_v4',
  COLLEGES: 'eng_club_colleges_v3',
  MAJORS: 'eng_club_majors_v4',
  SPOTLIGHT: 'eng_club_spotlight_v2',
  SETTINGS: 'eng_club_settings_v1',
  COMPLAINTS: 'eng_club_complaints_v1',
  SUPABASE_CONFIG: 'eng_club_supabase_config_v1',
  RECRUITMENT: 'eng_club_recruitment_v1',
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
  heroTitle: 'هندسة اليوم .. تصنع أثر الغد',
  heroHighlight: 'أثر الغد',
  heroSubheadline1: 'منصة طلابية رائدة لتمكين الطلبة وتطوير قدراتهم الأكاديمية والمهنية والشخصية، وربطهم بالابتكار وسوق العمل والمجتمع.',
  heroSubheadline2: 'بيئة هندسية متكاملة تدعم طلبة الكليات والتخصصات المختلفة.',
  operatingSystemVersion: 'نظام التشغيل الهندسي v2.6',
  clubNameAr: 'النادي الهندسي',
  clubNameEn: 'UP Engineering Club',
  universityNameAr: 'جامعة فلسطين',
  universityNameEn: 'University of Palestine',
  sloganAr: 'هندسة اليوم .. تصنع أثر الغد',
  sloganEn: 'ENGINEERING TODAY .. IMPACT TOMORROW',
  aboutUs: 'النادي الهندسي هو إطار طلابي تطوعي، غير ربحي، وغير مسيّس، لا يتبع لأي جهة حزبية أو سياسية، ولا يهدف إلى تحقيق أي مكاسب مادية. تأسس النادي بمبادرة من طلبة كلية هندسة البرمجيات والذكاء الاصطناعي في جامعة فلسطين، ليكون منصة طلابية جامعة تجمع طلبة التخصصات الهندسية والتقنية في الجامعة تحت مظلة واحدة، بهدف تنمية مهاراتهم الأكاديمية والعملية والتقنية، وتعزيز روح التعاون والإبداع بينهم.',
  vision: 'أن يكون النادي الهندسي مجتمعًا طلابيًا فاعلًا يجمع طلبة الكليات والتخصصات الهندسية والتقنية في جامعة فلسطين، ويسهم في بناء طالب يمتلك المعرفة والمهارة والقدرة على الابتكار والقيادة، ويكون أكثر استعدادًا للمستقبل وسوق العمل، وقادرًا على صناعة أثر حقيقي في مجتمعه.',
  mission: 'نعمل على تطوير الطلبة أكاديميًا وعمليًا وشخصيًا من خلال التدريب، والورش، والمشاريع، والمسابقات، والمبادرات، وتبادل الخبرات، وبناء الشراكات مع الخبراء والمؤسسات وسوق العمل، مع توفير بيئة طلابية تعزز التعاون وتمثّل احتياجات الطلبة وتمنحهم فرصًا حقيقية للتعلم والتجربة والمشاركة وصناعة الفرص.',
  values: [
    { id: 'v1', name: 'الابتكار', description: 'تحويل الأفكار الإبداعية إلى حلول هندسية تطبيقية ذات قيمة مضافة.', iconName: 'Lightbulb' },
    { id: 'v2', name: 'التعاون', description: 'روح الفريق والعمل التكاملي بين مختلف الكليات والتخصصات الهندسية.', iconName: 'Users' },
    { id: 'v3', name: 'التطوير', description: 'السعي المستمر لصقل المهارات الأكاديمية والتقنية ومواكبة أحدث الأدوات.', iconName: 'Settings' },
    { id: 'v4', name: 'التمكين', description: 'إتاحة الفرص والموارد للطلبة للقيادة وبناء مشاريعهم الخاصة بثقة.', iconName: 'GraduationCap' },
    { id: 'v5', name: 'الأثر', description: 'صناعة فارق ملموس في المجتمع وسوق العمل والبيئة الجامعية.', iconName: 'Target' }
  ],
  showEventsSection: true
};


type Listener = () => void;

class DataService {
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.initDefaults();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private initDefaults() {
    if (typeof window === 'undefined') return;

    // Self-healing migration: unwrap any legacy double-stringified entries in localStorage
    for (const key of Object.values(STORAGE_KEYS)) {
      const raw = localStorage.getItem(key);
      if (raw && (raw.startsWith('"[{') || raw.startsWith('"{') || raw.startsWith('\"'))) {
        try {
          let unwrapped = JSON.parse(raw);
          while (typeof unwrapped === 'string') {
            unwrapped = JSON.parse(unwrapped);
          }
          localStorage.setItem(key, JSON.stringify(unwrapped));
        } catch {}
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
      safeStorage.set(STORAGE_KEYS.PROJECTS, FLAGSHIP_PROJECTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      safeStorage.set(STORAGE_KEYS.EVENTS, CLUB_EVENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
      safeStorage.set(STORAGE_KEYS.COURSES, TRAINING_COURSES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
      const sampleApplications: StoredApplication[] = [
        {
          id: 'app-sample-demo',
          fullName: 'مهندس تجريبي (عضو معتمد)',
          studentId: '21222',
          email: 'demo.engineer@up.edu.ps',
          phone: '0599000000',
          academicYear: 'السنة الثالثة',
          college: 'كلية هندسة برمجيات وذكاء اصطناعي',
          major: 'هندسة برمجيات ونظم ذكية',
          skills: ['Python / AI', 'Fullstack Web (React / Node)', 'Git & DevOps'],
          personalStatement: 'عضوية تجريبية معتمدة لاختبار منصة وفعاليات النادي الهندسي.',
          targetCommittee: 'لجنة الفعاليات والأنشطة',
          weeklyCommitmentHours: 8,
          status: 'تم القبول',
          submittedAt: '2026-10-01T12:00:00Z',
        },
        {
          id: 'app-sample-1',
          fullName: 'فيصل بن خالد القحطاني',
          studentId: '442019882',
          email: 'faisal.q@student.edu.sa',
          phone: '0551234567',
          academicYear: 'السنة الثالثة',
          college: 'كلية هندسة برمجيات وذكاء اصطناعي',
          major: 'هندسة برمجيات',
          skills: ['Python / AI', 'Fullstack Web (React / Node)', 'Project Management (Agile / PMP)'],
          personalStatement: 'أرغب بالمساهمة في تنظيم الهاكاثونات والفعاليات التقنية الكبرى للنادي الهندسي.',
          targetCommittee: 'لجنة الفعاليات والأنشطة',
          weeklyCommitmentHours: 8,
          status: 'تم القبول',
          submittedAt: '2026-10-01T14:30:00Z',
        },
        {
          id: 'app-sample-2',
          fullName: 'نوف بنت عبدالرحمن الشهري',
          studentId: '443028119',
          email: 'nouf.sh@student.edu.sa',
          phone: '0509876543',
          academicYear: 'السنة الثانية',
          college: 'كلية الهندسة التطبيقية و التخطيط العمراني',
          major: 'تخصص هندسة معمارية',
          skills: ['Revit BIM & Grasshopper', 'UI/UX & Graphic Design', 'CAD & SolidWorks'],
          personalStatement: 'أريد المساهمة في تنظيم الورش والمعسكرات الهندسية وبناء الشراكات مع المكاتب الهندسية.',
          targetCommittee: 'لجنة العلاقات والتدريب',
          weeklyCommitmentHours: 6,
          status: 'مقابلة مجدولة',
          submittedAt: '2026-10-03T10:15:00Z',
        }
      ];
      safeStorage.set(STORAGE_KEYS.APPLICATIONS, sampleApplications);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TICKETS)) {
      const sampleTickets: EventTicket[] = [
        {
          id: 't-101',
          eventId: 'hackathon-2026',
          eventTitle: 'هاكاثون الابتكار الهندسي 2026: نبني مدن الغد',
          attendeeName: 'أحمد بن طارق المنصور',
          studentId: '441009221',
          ticketNumber: 'TKT-884912',
          qrHash: 'HASH_884912_ENG',
          registeredAt: '2026-10-02 16:40',
          checkedIn: true,
        },
        {
          id: 't-102',
          eventId: 'hackathon-2026',
          eventTitle: 'هاكاثون الابتكار الهندسي 2026: نبني مدن الغد',
          attendeeName: 'سارة بنت عبدالله الدوسري',
          studentId: '442088192',
          ticketNumber: 'TKT-391024',
          qrHash: 'HASH_391024_ENG',
          registeredAt: '2026-10-02 18:22',
          checkedIn: false,
        }
      ];
      safeStorage.set(STORAGE_KEYS.TICKETS, sampleTickets);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEADERSHIP)) {
      safeStorage.set(STORAGE_KEYS.LEADERSHIP, LEADERSHIP_MEMBERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COLLEGES)) {
      safeStorage.set(STORAGE_KEYS.COLLEGES, COLLEGES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MAJORS)) {
      safeStorage.set(STORAGE_KEYS.MAJORS, MAJORS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SPOTLIGHT)) {
      safeStorage.set(STORAGE_KEYS.SPOTLIGHT, STUDENT_SPOTLIGHT);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      safeStorage.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
  }

  // --- LEADERSHIP MEMBERS ---
  public getLeadership(): LeaderMember[] {
    const list = safeStorage.get<LeaderMember[]>(STORAGE_KEYS.LEADERSHIP, LEADERSHIP_MEMBERS);
    return Array.isArray(list) ? list : LEADERSHIP_MEMBERS;
  }

  public saveLeader(member: LeaderMember) {
    const list = this.getLeadership();
    const existingIdx = list.findIndex((m) => m.id === member.id);
    if (existingIdx >= 0) {
      list[existingIdx] = member;
    } else {
      list.push(member);
    }
    safeStorage.set(STORAGE_KEYS.LEADERSHIP, list);
    this.notify();
  }

  public deleteLeader(id: string) {
    const list = this.getLeadership().filter((m) => m.id !== id);
    safeStorage.set(STORAGE_KEYS.LEADERSHIP, list);
    this.notify();
  }

  // --- COLLEGES ---
  public getColleges(): College[] {
    const list = safeStorage.get<College[]>(STORAGE_KEYS.COLLEGES, COLLEGES);
    return Array.isArray(list) ? list : COLLEGES;
  }

  public saveCollege(college: College) {
    const list = this.getColleges();
    const existingIdx = list.findIndex((c) => c.id === college.id);
    if (existingIdx >= 0) {
      list[existingIdx] = college;
    } else {
      list.push(college);
    }
    safeStorage.set(STORAGE_KEYS.COLLEGES, list);
    this.notify();
  }

  // --- MAJORS ---
  public getMajors(): Major[] {
    const list = safeStorage.get<Major[]>(STORAGE_KEYS.MAJORS, MAJORS);
    return Array.isArray(list) ? list : MAJORS;
  }

  public saveMajor(major: Major) {
    const list = this.getMajors();
    const existingIdx = list.findIndex((m) => m.id === major.id);
    if (existingIdx >= 0) {
      list[existingIdx] = major;
    } else {
      list.push(major);
    }
    safeStorage.set(STORAGE_KEYS.MAJORS, list);
    this.notify();
  }

  // --- SPOTLIGHT ---
  public getSpotlight(): StudentSpotlightData {
    const data = safeStorage.get<StudentSpotlightData>(STORAGE_KEYS.SPOTLIGHT, STUDENT_SPOTLIGHT);
    return data && typeof data === "object" ? data : STUDENT_SPOTLIGHT;
  }

  public saveSpotlight(data: StudentSpotlightData) {
    safeStorage.set(STORAGE_KEYS.SPOTLIGHT, data);
    this.notify();
  }

  // --- SITE SETTINGS ---
  public getSettings(): SiteSettings {
    const data = safeStorage.get<SiteSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    if (!data || typeof data !== 'object') return DEFAULT_SETTINGS;
    const oldVisionPrefix = 'أن يكون النادي الهندسي منصة طلابية رائدة';
    const oldMissionPrefix = 'نسعى إلى توفير بيئة هندسية متكاملة تدعم';
    const vision = (data.vision && !data.vision.startsWith(oldVisionPrefix)) ? data.vision : DEFAULT_SETTINGS.vision;
    const mission = (data.mission && !data.mission.startsWith(oldMissionPrefix)) ? data.mission : DEFAULT_SETTINGS.mission;
    return {
      ...DEFAULT_SETTINGS,
      ...data,
      aboutUs: data.aboutUs || DEFAULT_SETTINGS.aboutUs,
      vision,
      mission,
      showEventsSection: data.showEventsSection !== false
    };
  }

  public saveSettings(data: SiteSettings) {
    safeStorage.set(STORAGE_KEYS.SETTINGS, data);
    this.notify();
  }


  // --- PROJECTS ---
  public getProjects(): ProjectCaseStudy[] {
    const list = safeStorage.get<ProjectCaseStudy[]>(STORAGE_KEYS.PROJECTS, FLAGSHIP_PROJECTS);
    return Array.isArray(list) ? list : FLAGSHIP_PROJECTS;
  }

  public saveProject(project: ProjectCaseStudy) {
    const list = this.getProjects();
    const existingIdx = list.findIndex((p) => p.id === project.id);
    if (existingIdx >= 0) {
      list[existingIdx] = project;
    } else {
      list.unshift(project);
    }
    safeStorage.set(STORAGE_KEYS.PROJECTS, list);
    this.notify();
  }

  public deleteProject(id: string) {
    const list = this.getProjects().filter((p) => p.id !== id);
    safeStorage.set(STORAGE_KEYS.PROJECTS, list);
    this.notify();
  }

  // --- EVENTS ---
  public getEvents(): EventItem[] {
    const list = safeStorage.get<EventItem[]>(STORAGE_KEYS.EVENTS, CLUB_EVENTS);
    return Array.isArray(list) ? list : CLUB_EVENTS;
  }

  public saveEvent(event: EventItem) {
    const list = this.getEvents();
    const existingIdx = list.findIndex((e) => e.id === event.id);
    if (existingIdx >= 0) {
      list[existingIdx] = event;
    } else {
      list.unshift(event);
    }
    safeStorage.set(STORAGE_KEYS.EVENTS, list);
    this.notify();
  }

  public deleteEvent(id: string) {
    const list = this.getEvents().filter((e) => e.id !== id);
    safeStorage.set(STORAGE_KEYS.EVENTS, list);
    this.notify();
  }

  // --- TICKETS & ATTENDEES ---
  public getTickets(eventId?: string): EventTicket[] {
    const list = safeStorage.get<EventTicket[]>(STORAGE_KEYS.TICKETS, []);
    const all = Array.isArray(list) ? list : [];
    if (eventId) {
      return all.filter((t) => t.eventId === eventId);
    }
    return all;
  }

  public bookTicket(eventId: string, attendeeName: string, studentId?: string): EventTicket {
    const cleanStudentId = (studentId || '').trim();
    const tickets = this.getTickets();

    // Check if student already booked a ticket for this event (prevent duplicate booking / spam)
    if (cleanStudentId && cleanStudentId !== 'N/A') {
      const existing = tickets.find(
        (t) => t.eventId === eventId && t.studentId?.trim().toLowerCase() === cleanStudentId.toLowerCase()
      );
      if (existing) {
        return existing;
      }
    }

    const events = this.getEvents();
    const ev = events.find((e) => e.id === eventId);
    const eventTitle = ev ? ev.title : 'فعالية النادي الهندسي';

    // Strictly enforce capacity
    if (ev) {
      if (ev.registeredCount >= ev.capacity) {
        throw new Error('عذراً، اكتملت جميع المقاعد المتاحة لهذه الفعالية.');
      }
      ev.registeredCount = Math.min(ev.capacity, (ev.registeredCount || 0) + 1);
      this.saveEvent(ev);
    }

    const ticketNum = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTicket: EventTicket = {
      id: `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventId,
      eventTitle,
      attendeeName: sanitizeText(attendeeName),
      studentId: cleanStudentId || 'N/A',
      ticketNumber: ticketNum,
      qrHash: `QR_${ticketNum}_ENG_VERIFIED`,
      registeredAt: new Date().toLocaleString('ar-SA'),
      checkedIn: false,
    };

    tickets.unshift(newTicket);
    safeStorage.set(STORAGE_KEYS.TICKETS, tickets);
    this.notify();
    return newTicket;
  }

  public toggleCheckIn(ticketId: string): boolean {
    const tickets = this.getTickets();
    const target = tickets.find((t) => t.id === ticketId);
    if (!target) return false;
    target.checkedIn = !target.checkedIn;
    safeStorage.set(STORAGE_KEYS.TICKETS, tickets);
    this.notify();
    return target.checkedIn;
  }

  // --- APPLICATIONS ---
  public getApplications(): StoredApplication[] {
    const list = safeStorage.get<StoredApplication[]>(STORAGE_KEYS.APPLICATIONS, []);
    return Array.isArray(list) ? list : [];
  }

  public submitApplication(app: ClubApplication): StoredApplication {
    const list = this.getApplications();
    const cleanStudentId = (app.studentId || '').trim();

    // Check if application already exists for this studentId
    const existingIndex = list.findIndex(
      (a) => cleanStudentId && a.studentId && a.studentId.trim().toLowerCase() === cleanStudentId.toLowerCase()
    );

    const sanitizedApp = {
      ...app,
      fullName: sanitizeText(app.fullName),
      personalStatement: sanitizeText(app.personalStatement || ''),
      portfolioUrl: sanitizeUrl(app.portfolioUrl),
    };

    if (existingIndex !== -1) {
      // Update existing application rather than creating duplicates
      const existing = list[existingIndex];
      const updated: StoredApplication = {
        ...existing,
        ...sanitizedApp,
        // Keep existing status if accepted
        status: existing.status === 'تم القبول' ? 'تم القبول' : 'قيد المراجعة',
        submittedAt: new Date().toISOString(),
      };
      list[existingIndex] = updated;
      safeStorage.set(STORAGE_KEYS.APPLICATIONS, list);
      this.notify();
      return updated;
    }

    const newApp: StoredApplication = {
      ...sanitizedApp,
      id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'قيد المراجعة',
      submittedAt: new Date().toISOString(),
    };

    list.unshift(newApp);
    safeStorage.set(STORAGE_KEYS.APPLICATIONS, list);
    this.notify();
    return newApp;
  }

  public updateApplicationStatus(id: string, status: StoredApplication['status']) {
    const list = this.getApplications();
    const app = list.find((a) => a.id === id);
    if (app) {
      app.status = status;
      safeStorage.set(STORAGE_KEYS.APPLICATIONS, list);
      this.notify();
    }
  }

  public deleteApplication(id: string) {
    const list = this.getApplications().filter((a) => a.id !== id);
    safeStorage.set(STORAGE_KEYS.APPLICATIONS, list);
    this.notify();
  }

  public deleteRejectedApplications(): number {
    const original = this.getApplications();
    const list = original.filter((a) => a.status !== 'مرفوض');
    const removedCount = original.length - list.length;
    safeStorage.set(STORAGE_KEYS.APPLICATIONS, list);
    this.notify();
    return removedCount;
  }

  // --- TRAINING COURSES ---
  public getCourses(): TrainingCourse[] {
    const list = safeStorage.get<TrainingCourse[]>(STORAGE_KEYS.COURSES, TRAINING_COURSES);
    return Array.isArray(list) ? list : TRAINING_COURSES;
  }

  public saveCourse(course: TrainingCourse) {
    const list = this.getCourses();
    const existingIdx = list.findIndex((c) => c.id === course.id);
    if (existingIdx >= 0) {
      list[existingIdx] = course;
    } else {
      list.unshift(course);
    }
    safeStorage.set(STORAGE_KEYS.COURSES, list);
    this.notify();
  }

  // --- EXPORTS & UTILITIES ---
  public exportToCSV(data: any[], filename: string) {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = (row as Record<string, any>)[h];
            const escaped = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
            return `"${escaped.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\r\n');


    // Add UTF-8 BOM so Excel displays Arabic correctly
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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
      complaints: this.getComplaints(),
    };
    return JSON.stringify(payload, null, 2);
  }

  public getComplaints(): ComplaintItem[] {
    const list = safeStorage.get<ComplaintItem[]>(STORAGE_KEYS.COMPLAINTS, []);
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
    const initial: ComplaintItem[] = [
      {
        id: 'cmp-sample-1',
        ticketNumber: 'UP-CMP-2026-1042',
        studentName: 'محمد أحمد خليل',
        studentId: '120230554',
        email: 'mohammed.k@up.edu.ps',
        phone: '0599000001',
        college: 'كلية هندسة برمجيات وذكاء اصطناعي',
        category: 'club_activities',
        subject: 'اقتراح تنظيم ورشة عمل في أدوات الذكاء الاصطناعي التوليدي',
        message: 'نرجو من لجنة العلاقات والتدريب تنظيم ورشة تدريبية عملية حول توظيف تقنيات الـ Prompt Engineering وأدوات الذكاء الاصطناعي في تسريع البرمجة للطلبة المبتدئين.',
        isAnonymous: false,
        status: 'resolved',
        adminNotes: 'تمت إحالة المقترح للجنة التدريب وإدراجه ضمن خطة الورش القادمة للفصل الحالي.',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    safeStorage.set(STORAGE_KEYS.COMPLAINTS, initial);
    return initial;
  }

  public submitComplaint(data: Omit<ComplaintItem, 'id' | 'ticketNumber' | 'status' | 'createdAt'>): ComplaintItem {
    const complaints = this.getComplaints();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newComplaint: ComplaintItem = {
      ...data,
      studentName: sanitizeText(data.studentName),
      studentId: sanitizeText(data.studentId || ''),
      email: sanitizeText(data.email || ''),
      phone: data.phone ? sanitizeText(data.phone) : undefined,
      subject: sanitizeText(data.subject),
      message: sanitizeText(data.message),
      id: 'cmp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      ticketNumber: `UP-CMP-2026-${randomSuffix}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    complaints.unshift(newComplaint);
    safeStorage.set(STORAGE_KEYS.COMPLAINTS, complaints);
    this.notify();
    return newComplaint;
  }

  public updateComplaintStatus(id: string, status: ComplaintItem['status'], adminNotes?: string): ComplaintItem | undefined {
    const complaints = this.getComplaints();
    const idx = complaints.findIndex(c => c.id === id);
    if (idx !== -1) {
      complaints[idx].status = status;
      if (adminNotes !== undefined) {
        complaints[idx].adminNotes = adminNotes;
      }
      complaints[idx].updatedAt = new Date().toISOString();
      safeStorage.set(STORAGE_KEYS.COMPLAINTS, complaints);
      this.notify();
      return complaints[idx];
    }
    return undefined;
  }

  public deleteComplaint(id: string): void {
    let complaints = this.getComplaints();
    complaints = complaints.filter(c => c.id !== id);
    safeStorage.set(STORAGE_KEYS.COMPLAINTS, complaints);
    this.notify();
  }

  public getComplaintByTicket(ticketNumber: string): ComplaintItem | undefined {
    const complaints = this.getComplaints();
    const cleanNum = ticketNumber.trim().toUpperCase();
    // For privacy, tracking is strictly permitted via the unique secret Ticket Number
    return complaints.find(c => c.ticketNumber.toUpperCase() === cleanNum);
  }

  public isStudentMember(studentId: string): { isMember: boolean; status: 'approved' | 'pending' | 'rejected' | 'not_found'; app?: StoredApplication } {
    const cleanId = studentId.trim().toLowerCase();
    if (!cleanId) return { isMember: false, status: 'not_found' };
    const applications = this.getApplications();
    let app = Array.isArray(applications) ? applications.find(a => (a.studentId && a.studentId.trim().toLowerCase() === cleanId) || a.id.toLowerCase() === cleanId) : undefined;
    
    // Fallback demo account for instant validation testing (e.g. ID: 21222)
    if (!app && cleanId === '21222') {
      app = {
        id: 'app-sample-demo',
        fullName: 'مهندس تجريبي (عضو معتمد)',
        studentId: '21222',
        email: 'demo.engineer@up.edu.ps',
        phone: '0599000000',
        academicYear: 'السنة الثالثة',
        college: 'كلية هندسة برمجيات وذكاء اصطناعي',
        major: 'هندسة برمجيات ونظم ذكية',
        skills: ['Python / AI', 'Fullstack Web (React / Node)', 'Git & DevOps'],
        personalStatement: 'عضوية تجريبية معتمدة لاختبار منصة وفعاليات النادي الهندسي.',
        targetCommittee: 'لجنة الفعاليات والأنشطة',
        weeklyCommitmentHours: 8,
        status: 'تم القبول',
        submittedAt: '2026-10-01T12:00:00Z',
      };
    }

    if (!app) {
      return { isMember: false, status: 'not_found' };
    }
    if (app.status === 'تم القبول') {
      return { isMember: true, status: 'approved', app };
    }
    return { isMember: false, status: app.status as any, app };
  }

  public importDatabaseJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.projects) safeStorage.set(STORAGE_KEYS.PROJECTS, data.projects);
      if (data.events) safeStorage.set(STORAGE_KEYS.EVENTS, data.events);
      if (data.courses) safeStorage.set(STORAGE_KEYS.COURSES, data.courses);
      if (data.applications) safeStorage.set(STORAGE_KEYS.APPLICATIONS, data.applications);
      if (data.tickets) safeStorage.set(STORAGE_KEYS.TICKETS, data.tickets);
      if (data.leadership) safeStorage.set(STORAGE_KEYS.LEADERSHIP, data.leadership);
      if (data.colleges) safeStorage.set(STORAGE_KEYS.COLLEGES, data.colleges);
      if (data.majors) safeStorage.set(STORAGE_KEYS.MAJORS, data.majors);
      if (data.spotlight) safeStorage.set(STORAGE_KEYS.SPOTLIGHT, data.spotlight);
      if (data.settings) safeStorage.set(STORAGE_KEYS.SETTINGS, data.settings);
      this.notify();
      return true;
    } catch {
      return false;
    }
  }


  // --- RECRUITMENT & COMMITTEE STATUS ---
  public getRecruitmentSettings(): RecruitmentSettings {
    const data = safeStorage.get<RecruitmentSettings>(STORAGE_KEYS.RECRUITMENT, DEFAULT_RECRUITMENT_SETTINGS);
    if (!data || typeof data !== 'object') return DEFAULT_RECRUITMENT_SETTINGS;
    return {
      isGlobalRecruitmentOpen: data.isGlobalRecruitmentOpen !== false,
      globalClosedMessage: data.globalClosedMessage || DEFAULT_RECRUITMENT_SETTINGS.globalClosedMessage,
      committees: {
        ...DEFAULT_RECRUITMENT_SETTINGS.committees,
        ...(data.committees || {})
      },
      lastUpdated: data.lastUpdated
    };
  }

  public saveRecruitmentSettings(settings: RecruitmentSettings) {
    const updated = {
      ...settings,
      lastUpdated: new Date().toISOString()
    };
    safeStorage.set(STORAGE_KEYS.RECRUITMENT, updated);
    this.notify();
  }

  public toggleCommitteeRecruitment(committeeId: string, isOpen?: boolean, notice?: string) {
    const current = this.getRecruitmentSettings();
    const comm = current.committees[committeeId] || { isOpen: true };
    const newIsOpen = isOpen !== undefined ? isOpen : !comm.isOpen;
    
    current.committees[committeeId] = {
      ...comm,
      isOpen: newIsOpen,
      closedNotice: notice || comm.closedNotice
    };
    
    this.saveRecruitmentSettings(current);
  }

  public toggleGlobalRecruitment(isOpen?: boolean, message?: string) {
    const current = this.getRecruitmentSettings();
    const newIsOpen = isOpen !== undefined ? isOpen : !current.isGlobalRecruitmentOpen;
    current.isGlobalRecruitmentOpen = newIsOpen;
    if (message) current.globalClosedMessage = message;
    this.saveRecruitmentSettings(current);
  }

  public resetDefaults() {
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.COURSES);
    localStorage.removeItem(STORAGE_KEYS.APPLICATIONS);
    localStorage.removeItem(STORAGE_KEYS.TICKETS);
    localStorage.removeItem(STORAGE_KEYS.LEADERSHIP);
    localStorage.removeItem(STORAGE_KEYS.COLLEGES);
    localStorage.removeItem(STORAGE_KEYS.MAJORS);
    localStorage.removeItem(STORAGE_KEYS.SPOTLIGHT);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    this.initDefaults();
    this.notify();
  }

}

export const dataService = new DataService();
