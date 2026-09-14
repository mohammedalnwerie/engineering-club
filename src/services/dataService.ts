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
  StudentSpotlightData
} from '../types';

const STORAGE_KEYS = {
  PROJECTS: 'eng_club_projects_v1',
  EVENTS: 'eng_club_events_v1',
  COURSES: 'eng_club_courses_v1',
  APPLICATIONS: 'eng_club_applications_v1',
  TICKETS: 'eng_club_tickets_v1',
  LEADERSHIP: 'eng_club_leadership_v1',
  COLLEGES: 'eng_club_colleges_v2',
  MAJORS: 'eng_club_majors_v2',
  SPOTLIGHT: 'eng_club_spotlight_v1',
  SETTINGS: 'eng_club_settings_v1',
  SUPABASE_CONFIG: 'eng_club_supabase_config_v1',
};

const DEFAULT_SETTINGS: SiteSettings = {
  heroTitle: 'نبني مهندس المستقبل',
  heroHighlight: 'مهندس',
  heroSubheadline1: 'من المعرفة إلى المهارة. من الفكرة إلى المشروع.',
  heroSubheadline2: 'من الجامعة إلى المجتمع وسوق العمل.',
  operatingSystemVersion: 'نظام التشغيل الهندسي v2.6',
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

    if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(FLAGSHIP_PROJECTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(CLUB_EVENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
      localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(TRAINING_COURSES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
      const sampleApplications: StoredApplication[] = [
        {
          id: 'app-sample-1',
          fullName: 'فيصل بن خالد القحطاني',
          studentId: '442019882',
          email: 'faisal.q@student.edu.sa',
          phone: '0551234567',
          academicYear: 'السنة الثالثة',
          college: 'كلية الهندسة والتكنولوجيا الصناعية والبرمجيات',
          major: 'هندسة البرمجيات',
          skills: ['Python / AI', 'Fullstack Web (React / Node)', 'Project Management (Agile / PMP)'],
          personalStatement: 'أرغب بالمساهمة في بناء الأنظمة السحابية الموزعة لنادي الهندسة وتطوير مسرّعة المشاريع الطلابية.',
          targetCommittee: 'لجنة التطوير البرمجي والمشاريع',
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
          college: 'كلية الهندسة المعمارية والمدنية',
          major: 'الهندسة المعمارية والتصميم المستدام',
          skills: ['Revit BIM & Grasshopper', 'UI/UX & Graphic Design', 'CAD & SolidWorks'],
          personalStatement: 'أريد توظيف التصميم البارامتري لابتكار أجنحة الاستدامة للمعارض القادمة للنادي وتدريب الطلاب الجدد.',
          targetCommittee: 'لجنة الشؤون الأكاديمية والتدريب',
          weeklyCommitmentHours: 6,
          status: 'مقابلة مجدولة',
          submittedAt: '2026-10-03T10:15:00Z',
        }
      ];
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(sampleApplications));
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
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(sampleTickets));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEADERSHIP)) {
      localStorage.setItem(STORAGE_KEYS.LEADERSHIP, JSON.stringify(LEADERSHIP_MEMBERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COLLEGES)) {
      localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(COLLEGES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MAJORS)) {
      localStorage.setItem(STORAGE_KEYS.MAJORS, JSON.stringify(MAJORS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SPOTLIGHT)) {
      localStorage.setItem(STORAGE_KEYS.SPOTLIGHT, JSON.stringify(STUDENT_SPOTLIGHT));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
  }

  // --- LEADERSHIP MEMBERS ---
  public getLeadership(): LeaderMember[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LEADERSHIP);
      return raw ? JSON.parse(raw) : LEADERSHIP_MEMBERS;
    } catch {
      return LEADERSHIP_MEMBERS;
    }
  }

  public saveLeader(member: LeaderMember) {
    const list = this.getLeadership();
    const existingIdx = list.findIndex((m) => m.id === member.id);
    if (existingIdx >= 0) {
      list[existingIdx] = member;
    } else {
      list.push(member);
    }
    localStorage.setItem(STORAGE_KEYS.LEADERSHIP, JSON.stringify(list));
    this.notify();
  }

  public deleteLeader(id: string) {
    const list = this.getLeadership().filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.LEADERSHIP, JSON.stringify(list));
    this.notify();
  }

  // --- COLLEGES ---
  public getColleges(): College[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COLLEGES);
      return raw ? JSON.parse(raw) : COLLEGES;
    } catch {
      return COLLEGES;
    }
  }

  public saveCollege(college: College) {
    const list = this.getColleges();
    const existingIdx = list.findIndex((c) => c.id === college.id);
    if (existingIdx >= 0) {
      list[existingIdx] = college;
    } else {
      list.push(college);
    }
    localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(list));
    this.notify();
  }

  // --- MAJORS ---
  public getMajors(): Major[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MAJORS);
      return raw ? JSON.parse(raw) : MAJORS;
    } catch {
      return MAJORS;
    }
  }

  public saveMajor(major: Major) {
    const list = this.getMajors();
    const existingIdx = list.findIndex((m) => m.id === major.id);
    if (existingIdx >= 0) {
      list[existingIdx] = major;
    } else {
      list.push(major);
    }
    localStorage.setItem(STORAGE_KEYS.MAJORS, JSON.stringify(list));
    this.notify();
  }

  // --- SPOTLIGHT ---
  public getSpotlight(): StudentSpotlightData {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SPOTLIGHT);
      return raw ? JSON.parse(raw) : STUDENT_SPOTLIGHT;
    } catch {
      return STUDENT_SPOTLIGHT;
    }
  }

  public saveSpotlight(data: StudentSpotlightData) {
    localStorage.setItem(STORAGE_KEYS.SPOTLIGHT, JSON.stringify(data));
    this.notify();
  }

  // --- SITE SETTINGS ---
  public getSettings(): SiteSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(data: SiteSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data));
    this.notify();
  }


  // --- PROJECTS ---
  public getProjects(): ProjectCaseStudy[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return raw ? JSON.parse(raw) : FLAGSHIP_PROJECTS;
    } catch {
      return FLAGSHIP_PROJECTS;
    }
  }

  public saveProject(project: ProjectCaseStudy) {
    const list = this.getProjects();
    const existingIdx = list.findIndex((p) => p.id === project.id);
    if (existingIdx >= 0) {
      list[existingIdx] = project;
    } else {
      list.unshift(project);
    }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(list));
    this.notify();
  }

  public deleteProject(id: string) {
    const list = this.getProjects().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(list));
    this.notify();
  }

  // --- EVENTS ---
  public getEvents(): EventItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return raw ? JSON.parse(raw) : CLUB_EVENTS;
    } catch {
      return CLUB_EVENTS;
    }
  }

  public saveEvent(event: EventItem) {
    const list = this.getEvents();
    const existingIdx = list.findIndex((e) => e.id === event.id);
    if (existingIdx >= 0) {
      list[existingIdx] = event;
    } else {
      list.unshift(event);
    }
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(list));
    this.notify();
  }

  public deleteEvent(id: string) {
    const list = this.getEvents().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(list));
    this.notify();
  }

  // --- TICKETS & ATTENDEES ---
  public getTickets(eventId?: string): EventTicket[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
      const all: EventTicket[] = raw ? JSON.parse(raw) : [];
      if (eventId) {
        return all.filter((t) => t.eventId === eventId);
      }
      return all;
    } catch {
      return [];
    }
  }

  public bookTicket(eventId: string, attendeeName: string, studentId?: string): EventTicket {
    const events = this.getEvents();
    const ev = events.find((e) => e.id === eventId);
    const eventTitle = ev ? ev.title : 'فعالية النادي الهندسي';

    // Increment count on event
    if (ev) {
      ev.registeredCount = Math.min(ev.capacity, (ev.registeredCount || 0) + 1);
      this.saveEvent(ev);
    }

    const ticketNum = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTicket: EventTicket = {
      id: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      eventId,
      eventTitle,
      attendeeName,
      studentId: studentId || 'N/A',
      ticketNumber: ticketNum,
      qrHash: `QR_${ticketNum}_ENG_VERIFIED`,
      registeredAt: new Date().toLocaleString('ar-SA'),
      checkedIn: false,
    };

    const tickets = this.getTickets();
    tickets.unshift(newTicket);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    this.notify();
    return newTicket;
  }

  public toggleCheckIn(ticketId: string): boolean {
    const tickets = this.getTickets();
    const target = tickets.find((t) => t.id === ticketId);
    if (!target) return false;
    target.checkedIn = !target.checkedIn;
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    this.notify();
    return target.checkedIn;
  }

  // --- APPLICATIONS ---
  public getApplications(): StoredApplication[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public submitApplication(app: ClubApplication): StoredApplication {
    const newApp: StoredApplication = {
      ...app,
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      status: 'قيد المراجعة',
      submittedAt: new Date().toISOString(),
    };

    const list = this.getApplications();
    list.unshift(newApp);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(list));
    this.notify();
    return newApp;
  }

  public updateApplicationStatus(id: string, status: StoredApplication['status']) {
    const list = this.getApplications();
    const app = list.find((a) => a.id === id);
    if (app) {
      app.status = status;
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(list));
      this.notify();
    }
  }

  // --- TRAINING COURSES ---
  public getCourses(): TrainingCourse[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COURSES);
      return raw ? JSON.parse(raw) : TRAINING_COURSES;
    } catch {
      return TRAINING_COURSES;
    }
  }

  public saveCourse(course: TrainingCourse) {
    const list = this.getCourses();
    const existingIdx = list.findIndex((c) => c.id === course.id);
    if (existingIdx >= 0) {
      list[existingIdx] = course;
    } else {
      list.unshift(course);
    }
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(list));
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
    };
    return JSON.stringify(payload, null, 2);
  }

  public importDatabaseJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.projects) localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(data.projects));
      if (data.events) localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(data.events));
      if (data.courses) localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(data.courses));
      if (data.applications) localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(data.applications));
      if (data.tickets) localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(data.tickets));
      if (data.leadership) localStorage.setItem(STORAGE_KEYS.LEADERSHIP, JSON.stringify(data.leadership));
      if (data.colleges) localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(data.colleges));
      if (data.majors) localStorage.setItem(STORAGE_KEYS.MAJORS, JSON.stringify(data.majors));
      if (data.spotlight) localStorage.setItem(STORAGE_KEYS.SPOTLIGHT, JSON.stringify(data.spotlight));
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      this.notify();
      return true;
    } catch {
      return false;
    }
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
