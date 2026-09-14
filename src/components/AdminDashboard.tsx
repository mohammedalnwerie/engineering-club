import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { supabaseBridge } from '../services/supabaseClient';
import { sound } from '../utils/soundEngine';
import type {
  ProjectCaseStudy,
  EventItem,
  StoredApplication,
  EventTicket,
  LeaderMember,
  College,
  Major,
  SiteSettings,
  StudentSpotlightData
} from '../types';
import {
  X,
  Lock,
  Plus,
  Trash2,
  Download,
  Users,
  Calendar,
  Layers,
  CheckCircle,
  Clock,
  Search,
  Database,
  RefreshCw,
  Eye,
  Activity,
  Award,
  Sparkles,
  Building2,
  Edit3,
  Save,
  Check
} from 'lucide-react';


interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  const [activeTab, setActiveTab] = useState<'applications' | 'projects' | 'events' | 'leadership' | 'colleges' | 'settings' | 'cloud'>('applications');

  // Live Data states
  const [applications, setApplications] = useState<StoredApplication[]>([]);
  const [projects, setProjects] = useState<ProjectCaseStudy[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [leadership, setLeadership] = useState<LeaderMember[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(dataService.getSettings());
  const [spotlight, setSpotlight] = useState<StudentSpotlightData>(dataService.getSpotlight());

  // Colleges sub-tab
  const [collegeSubTab, setCollegeSubTab] = useState<'colleges' | 'majors'>('colleges');
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);

  // Leadership modal / editing
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [editingLeader, setEditingLeader] = useState<LeaderMember | null>(null);
  const [leaderForm, setLeaderForm] = useState<Partial<LeaderMember>>({
    name: '',
    role: '',
    tier: 'college-lead',
    department: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    quote: '',
    email: '',
    linkedin: '',
    github: '',
    skills: ['قيادة فرق', 'تطوير حلول']
  });
  const [leaderSkillsInput, setLeaderSkillsInput] = useState('');

  // Settings feedback
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);
  const [spotlightSavedMsg, setSpotlightSavedMsg] = useState(false);

  // Filters & Search
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');

  // Selected application for detail modal
  const [inspectApp, setInspectApp] = useState<StoredApplication | null>(null);

  // New Project Form State
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState<Partial<ProjectCaseStudy>>({
    title: '',
    tagline: '',
    category: 'software',
    collegeId: 'software-ai',
    collegeName: 'كلية هندسة برمجيات وذكاء اصطناعي',
    problem: '',
    solution: '',
    techStack: ['Python', 'React'],
    status: 'Prototyped',
    impactMetrics: [{ label: 'مستوى الإنجاز', value: '100%' }],
    team: [{ name: 'فريق العمل الطلابي', role: 'تطوير وتنفيذ', major: 'هندسة' }],
    schematicType: 'Sensor / Data Input -> Core Processor -> Cloud Dashboard',
  });


  // New Event Form State
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<EventItem>>({
    title: '',
    category: 'Workshop',
    date: '2026-11-20',
    time: '04:00 م - 07:00 م',
    location: 'مختبر الابتكار المركزي',
    capacity: 40,
    description: '',
    prerequisites: ['إحضار الحاسب الشخصي'],
    badgeColor: '#00F0FF',
  });

  // Supabase Form State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState<string | null>(null);
  const [supabaseLoading, setSupabaseLoading] = useState(false);

  const loadData = () => {
    setApplications(dataService.getApplications());
    setProjects(dataService.getProjects());
    setEvents(dataService.getEvents());
    setTickets(dataService.getTickets());
    setLeadership(dataService.getLeadership());
    setColleges(dataService.getColleges());
    setMajors(dataService.getMajors());
    setSettings(dataService.getSettings());
    setSpotlight(dataService.getSpotlight());
  };

  const handleOpenAddLeader = () => {
    setEditingLeader(null);
    setLeaderForm({
      name: '',
      role: '',
      tier: 'college-lead',
      department: '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      quote: '',
      email: '',
      linkedin: '',
      github: '',
      skills: ['قيادة فرق', 'تطوير حلول']
    });
    setLeaderSkillsInput('قيادة فرق, تطوير حلول');
    setShowLeaderModal(true);
  };

  const handleOpenEditLeader = (leader: LeaderMember) => {
    setEditingLeader(leader);
    setLeaderForm({ ...leader });
    setLeaderSkillsInput(leader.skills.join(', '));
    setShowLeaderModal(true);
  };

  const handleSaveLeader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderForm.name?.trim() || !leaderForm.role?.trim()) return;

    const skillsArray = leaderSkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const saved: LeaderMember = {
      id: editingLeader ? editingLeader.id : `leader-${Date.now()}`,
      name: leaderForm.name || '',
      role: leaderForm.role || '',
      tier: leaderForm.tier || 'college-lead',
      department: leaderForm.department || '',
      avatar: leaderForm.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      quote: leaderForm.quote || '',
      email: leaderForm.email || '',
      linkedin: leaderForm.linkedin,
      github: leaderForm.github,
      skills: skillsArray.length > 0 ? skillsArray : ['مهندس مبتكر']
    };

    dataService.saveLeader(saved);
    sound.playSuccess();
    setShowLeaderModal(false);
    setEditingLeader(null);
  };

  const handleDeleteLeader = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف عضو الكادر (${name})؟`)) {
      dataService.deleteLeader(id);
      sound.playClick();
    }
  };

  const handleSaveCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollege) return;
    dataService.saveCollege(editingCollege);
    sound.playSuccess();
    setEditingCollege(null);
  };

  const handleSaveMajor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMajor) return;
    dataService.saveMajor(editingMajor);
    sound.playSuccess();
    setEditingMajor(null);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.saveSettings(settings);
    sound.playSuccess();
    setSettingsSavedMsg(true);
    setTimeout(() => setSettingsSavedMsg(false), 3000);
  };

  const handleSaveSpotlight = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.saveSpotlight(spotlight);
    sound.playSuccess();
    setSpotlightSavedMsg(true);
    setTimeout(() => setSpotlightSavedMsg(false), 3000);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dataService.subscribe(() => {
      loadData();
    });

    const config = supabaseBridge.getConfig();
    setSupabaseUrl(config.url);
    setSupabaseKey(config.anonKey);

    return () => unsubscribe();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default master passcode for demo
    if (passcode === 'eng2026' || passcode === 'admin') {
      sound.playSuccess();
      setIsAuthenticated(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
    }
  };

  // Status update
  const handleUpdateAppStatus = (id: string, status: StoredApplication['status']) => {
    sound.playClick();
    dataService.updateApplicationStatus(id, status);
  };

  // Add Project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title?.trim()) return;

    sound.playSuccess();
    const proj: ProjectCaseStudy = {
      id: `proj-${Date.now()}`,
      title: newProject.title || 'مشروع هندسي جديد',
      tagline: newProject.tagline || 'حل هندسي مبتكر',
      category: newProject.category || 'software',
      collegeId: newProject.collegeId || 'industrial-software',
      collegeName: newProject.collegeName || 'كلية الهندسة',
      featured: true,
      problem: newProject.problem || 'تحدي تقني ميداني',
      solution: newProject.solution || 'نموذج أولي متطور',
      impactMetrics: newProject.impactMetrics || [{ label: 'مستوى الأداء', value: '98%' }],
      techStack: newProject.techStack || ['Engineering Core'],
      team: newProject.team || [{ name: 'الفريق الهندسي', role: 'مهندسون باحثون', major: 'الهندسة' }],
      status: newProject.status || 'Prototyped',
      schematicType: newProject.schematicType || 'Input -> Process -> Output',
      githubUrl: newProject.githubUrl,
      demoUrl: newProject.demoUrl,
    };

    dataService.saveProject(proj);
    setShowAddProject(false);
    setNewProject({
      title: '',
      tagline: '',
      category: 'software',
      problem: '',
      solution: '',
      techStack: ['Python', 'React'],
    });
  };

  // Add Event
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title?.trim()) return;

    sound.playSuccess();
    const ev: EventItem = {
      id: `event-${Date.now()}`,
      title: newEvent.title || 'فعالية هندسية',
      category: newEvent.category || 'Workshop',
      date: newEvent.date || '2026-11-20',
      time: newEvent.time || '04:00 م',
      location: newEvent.location || 'قاعة الابتكار',
      capacity: Number(newEvent.capacity) || 50,
      registeredCount: 0,
      description: newEvent.description || 'ورشة عملية تطبيقية',
      prerequisites: newEvent.prerequisites || ['معرفة هندسية مبدئية'],
      speakers: [{ name: 'نخبة المدربين', title: 'مهندسون معتمدون' }],
      badgeColor: newEvent.badgeColor || '#00F0FF',
    };

    dataService.saveEvent(ev);
    setShowAddEvent(false);
  };

  // Supabase test
  const handleConnectSupabase = async () => {
    sound.playClick();
    setSupabaseLoading(true);
    supabaseBridge.setConfig(supabaseUrl, supabaseKey);
    const res = await supabaseBridge.testConnection();
    setSupabaseStatus(res.message);
    setSupabaseLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl overflow-y-auto">
      <div
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl glass-panel border border-cyan-500/40 shadow-[0_25px_80px_rgba(0,0,0,0.9)] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#090d16]/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base">لوحة الإدارة الهندسية المركزية</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                  ENG-ADMIN v2.6
                </span>
              </div>
              <div className="font-mono text-[11px] text-gray-400">
                إدارة المشاريع، الفعاليات، واعتماد طلبات العضوية اللحظية
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authentication Gate */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-16 flex flex-col items-center justify-center text-center my-auto">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-400/40 text-cyan-400 flex items-center justify-center mb-6">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">تسجيل دخول المشرفين وقادة اللجان</h3>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md mb-6">
              أدخل كلمة سر الإدارة للوصول إلى أدوات التحكم وإدارة بيانات الطلاب والفعاليات.
              <br />
              <span className="font-mono text-cyan-400/80 mt-1 inline-block">[الرمز الافتراضي للتجربة: eng2026]</span>
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-xs space-y-3">
              <input
                type="password"
                required
                placeholder="رمز المرور (Passcode)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-center font-mono tracking-widest text-sm"
              />

              {passcodeError && (
                <div className="text-xs text-red-400 font-mono">رمز المرور غير صحيح، جرب eng2026</div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-sm text-black bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all cursor-pointer"
              >
                تأكيد الدخول
              </button>
            </form>
          </div>
        ) : (
          /* Main Authenticated Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Nav Tabs */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/40 text-xs overflow-x-auto">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('applications');
                  }}
                  className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'applications'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>طلبات الانضمام ({applications.length})</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('projects');
                  }}
                  className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'projects'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>المشاريع ودراسات الحالة ({projects.length})</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('events');
                  }}
                  className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'events'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>الفعاليات والحضور ({events.length})</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('leadership');
                  }}
                  className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'leadership'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>الكادر القيادي ({leadership.length})</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('colleges');
                  }}
                  className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'colleges'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>الكليات والتخصصات</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('settings');
                  }}
                  className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>الرؤية وهوية الموقع</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('cloud');
                  }}
                  className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'cloud'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>السحابة والنسخ الاحتياطي</span>
                </button>
              </div>

              {/* Status Telemetry */}
              <div className="hidden md:flex items-center gap-3 font-mono text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE REPOSITORIES ACTIVE</span>
                </span>
              </div>
            </div>

            {/* Tab 1: Applications */}
            {activeTab === 'applications' && (
              <div className="flex-1 overflow-y-auto p-6">
                {/* Search & Actions Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                  <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="بحث بالاسم، الرقم الجامعي، أو التخصص..."
                        value={appSearch}
                        onChange={(e) => setAppSearch(e.target.value)}
                        className="w-full pl-3 pr-9 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </div>

                    <select
                      value={appStatusFilter}
                      onChange={(e) => setAppStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-300 focus:outline-none"
                    >
                      <option value="all">كافة الحالات</option>
                      <option value="قيد المراجعة">قيد المراجعة</option>
                      <option value="مقابلة مجدولة">مقابلة مجدولة</option>
                      <option value="تم القبول">تم القبول</option>
                      <option value="مرفوض">مرفوض</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      dataService.exportToCSV(applications, `club_applicants_${new Date().toISOString().split('T')[0]}`);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-cyan-300 flex items-center gap-2 transition-colors cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير المتقدمين إلى Excel (CSV)</span>
                  </button>
                </div>

                {/* Applications Table */}
                <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/30">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-white/[0.04] text-gray-400 font-mono text-[11px] border-b border-white/10">
                      <tr>
                        <th className="p-3">اسم المتقدم</th>
                        <th className="p-3">الرقم الجامعي</th>
                        <th className="p-3">التخصص والكلية</th>
                        <th className="p-3">اللجنة المستهدفة</th>
                        <th className="p-3">حالة الطلب</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {applications
                        .filter((app) => {
                          const matchesSearch =
                            app.fullName.includes(appSearch) ||
                            app.studentId.includes(appSearch) ||
                            app.major.includes(appSearch);
                          const matchesFilter =
                            appStatusFilter === 'all' || app.status === appStatusFilter;
                          return matchesSearch && matchesFilter;
                        })
                        .map((app) => (
                          <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-3 font-bold text-white">
                              {app.fullName}
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">{app.email}</div>
                            </td>
                            <td className="p-3 font-mono text-cyan-400">{app.studentId}</td>
                            <td className="p-3">
                              <div>{app.major}</div>
                              <div className="text-[10px] text-gray-400">{app.academicYear}</div>
                            </td>
                            <td className="p-3 text-cyan-300">{app.targetCommittee}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  app.status === 'تم القبول'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                    : app.status === 'مقابلة مجدولة'
                                    ? 'bg-blue-950 text-blue-400 border border-blue-500/30'
                                    : app.status === 'مرفوض'
                                    ? 'bg-red-950 text-red-400 border border-red-500/30'
                                    : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {app.status}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setInspectApp(app)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 transition-colors"
                                  title="معاينة الملف الكامل"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleUpdateAppStatus(app.id, 'تم القبول')}
                                  className="p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                  title="قبول الطالب"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleUpdateAppStatus(app.id, 'مقابلة مجدولة')}
                                  className="p-1.5 rounded-lg bg-blue-950/40 hover:bg-blue-500/20 text-blue-400 transition-colors"
                                  title="تحديد موعد مقابلة"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: Projects Manager */}
            {activeTab === 'projects' && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white">مشاريع النادي المنشورة</h3>
                    <p className="text-xs text-gray-400">تظهر هذه المشاريع مباشرة في الصفحة الرئيسية لقسم دراسات الحالة</p>
                  </div>

                  <button
                    onClick={() => setShowAddProject(true)}
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة مشروع جديد</span>
                  </button>
                </div>

                {/* Add Project Form Modal */}
                {showAddProject && (
                  <form onSubmit={handleCreateProject} className="p-6 rounded-2xl bg-black/50 border border-cyan-500/30 mb-8 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                      <h4 className="text-sm font-bold text-white">إضافة دراسة حالة لمشروع جديد</h4>
                      <button type="button" onClick={() => setShowAddProject(false)} className="text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">اسم المشروع:</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: EcoCampus AI"
                          value={newProject.title || ''}
                          onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">الوصف المختصر (Tagline):</label>
                        <input
                          type="text"
                          required
                          placeholder="منظومة ذكية لإدارة مرافق الحرم"
                          value={newProject.tagline || ''}
                          onChange={(e) => setNewProject({ ...newProject, tagline: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">التصنيف:</label>
                        <select
                          value={newProject.category}
                          onChange={(e) => setNewProject({ ...newProject, category: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        >
                          <option value="software">برمجيات (Software)</option>
                          <option value="ai">ذكاء اصطناعي (AI)</option>
                          <option value="architecture">عمارة وBIM</option>
                          <option value="robotics">روبوتات (Robotics)</option>
                          <option value="civil">هندسة مدنية</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">الكلية المشرفة:</label>
                        <select
                          value={newProject.collegeName}
                          onChange={(e) => setNewProject({ ...newProject, collegeName: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        >
                          <option value="كلية هندسة برمجيات وذكاء اصطناعي">كلية هندسة برمجيات وذكاء اصطناعي</option>
                          <option value="كلية تكنولوجيا المعلومات IT">كلية تكنولوجيا المعلومات IT</option>
                          <option value="كلية الهندسة التطبيقية و التخطيط العمراني">كلية الهندسة التطبيقية و التخطيط العمراني</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">حالة المشروع:</label>
                        <select
                          value={newProject.status}
                          onChange={(e) => setNewProject({ ...newProject, status: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        >
                          <option value="Deployed">مطلق في الإنتاج (Deployed)</option>
                          <option value="Prototyped">نموذج أولي مجرب (Prototyped)</option>
                          <option value="In Testing">قيد الاختبار (In Testing)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">المشكلة والتحدي:</label>
                        <textarea
                          rows={2}
                          placeholder="ما التحدي الهندسي الذي يواجهه هذا المشروع؟"
                          value={newProject.problem || ''}
                          onChange={(e) => setNewProject({ ...newProject, problem: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">الحل الهندسي المبتكر:</label>
                        <textarea
                          rows={2}
                          placeholder="كيف يحل المشروع هذا التحدي تقنياً؟"
                          value={newProject.solution || ''}
                          onChange={(e) => setNewProject({ ...newProject, solution: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer shadow-md"
                    >
                      حفظ ونشر المشروع فوراً
                    </button>
                  </form>
                )}

                {/* Projects List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((proj) => (
                    <div key={proj.id} className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                            {proj.category.toUpperCase()}
                          </span>
                          <span className="font-mono text-[10px] text-gray-400">● {proj.status}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{proj.title}</h4>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{proj.tagline}</p>
                      </div>

                      <button
                        onClick={() => {
                          sound.playClick();
                          dataService.deleteProject(proj.id);
                        }}
                        className="p-2 rounded-lg bg-red-950/30 hover:bg-red-500/20 text-red-400 transition-colors"
                        title="حذف المشروع"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Events & Attendance Manager */}
            {activeTab === 'events' && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white">إدارة الفعاليات وكشوف الحضور</h3>
                    <p className="text-xs text-gray-400">إضافة فعاليات جديدة ومتابعة أسماء الطلاب المسجلين وتحضيرهم</p>
                  </div>

                  <button
                    onClick={() => setShowAddEvent(true)}
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة فعالية جديدة</span>
                  </button>
                </div>

                {/* Add Event Form Modal */}
                {showAddEvent && (
                  <form onSubmit={handleCreateEvent} className="p-6 rounded-2xl bg-black/50 border border-cyan-500/30 mb-8 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                      <h4 className="text-sm font-bold text-white">إضافة فعالية أو هاكاثون جديد</h4>
                      <button type="button" onClick={() => setShowAddEvent(false)} className="text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">عنوان الفعالية:</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: ورشة الأمن السيبراني التطبيقي"
                          value={newEvent.title || ''}
                          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">الموقع / القاعة:</label>
                        <input
                          type="text"
                          required
                          placeholder="مبنى 4 — قاعة الابتكار"
                          value={newEvent.location || ''}
                          onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">التاريخ:</label>
                        <input
                          type="text"
                          placeholder="24 نوفمبر 2026"
                          value={newEvent.date || ''}
                          onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">التوقيت:</label>
                        <input
                          type="text"
                          placeholder="05:00 م - 08:00 م"
                          value={newEvent.time || ''}
                          onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">السعة الكلية للمقاعد:</label>
                        <input
                          type="number"
                          placeholder="40"
                          value={newEvent.capacity || ''}
                          onChange={(e) => setNewEvent({ ...newEvent, capacity: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer shadow-md"
                    >
                      حفظ ونشر الفعالية فوراً
                    </button>
                  </form>
                )}

                {/* Events list with Registered Attendees selector */}
                <div className="space-y-4">
                  {events.map((ev) => {
                    const eventTickets = tickets.filter((t) => t.eventId === ev.id);

                    return (
                      <div key={ev.id} className="p-5 rounded-2xl bg-black/30 border border-white/10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/20">
                                {ev.category}
                              </span>
                              <span className="text-xs text-gray-400 font-mono">
                                {ev.date} — {ev.location}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-white mt-1">{ev.title}</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-cyan-400 px-3 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
                              {eventTickets.length} / {ev.capacity} مسجل
                            </span>

                            <button
                              onClick={() => {
                                sound.playClick();
                                dataService.exportToCSV(eventTickets, `attendance_${ev.id}`);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-cyan-400 hover:text-black text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="تصدير كشف حضور هذه الفعالية"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>تصدير الكشف</span>
                            </button>
                          </div>
                        </div>

                        {/* Attendee Roster */}
                        <div className="mt-3">
                          <div className="text-xs font-mono text-gray-400 mb-2">قائمة الطلاب الحاصلين على تذاكر:</div>
                          {eventTickets.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {eventTickets.map((t) => (
                                <div
                                  key={t.id}
                                  onClick={() => dataService.toggleCheckIn(t.id)}
                                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                                    t.checkedIn
                                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                                      : 'bg-black/40 border-white/5 text-gray-300 hover:border-white/20'
                                  }`}
                                >
                                  <div>
                                    <div className="font-bold text-white">{t.attendeeName}</div>
                                    <div className="text-[10px] font-mono text-gray-400">{t.ticketNumber}</div>
                                  </div>
                                  <span className="text-[10px] font-mono">
                                    {t.checkedIn ? '✓ تم التحضير' : 'لم يحضر بعد'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 font-mono">لا يوجد مسجلون في هذه الفعالية حتى الآن.</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab: Leadership Management */}
            {activeTab === 'leadership' && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">إدارة الكادر القيادي والمهندسين</h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                        {leadership.length} مهندس قيادي
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      التحكم ببيانات بطاقات الهيئة الإدارية والتنفيذية ورؤساء اللجان والمنسقين المعروضة في المنصة.
                    </p>
                  </div>

                  <button
                    onClick={handleOpenAddLeader}
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة قائد / مهندس جديد</span>
                  </button>
                </div>

                {/* Leader Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leadership.map((leader) => (
                    <div
                      key={leader.id}
                      className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start gap-3 mb-3">
                          <img
                            src={leader.avatar}
                            alt={leader.name}
                            className="w-14 h-14 rounded-2xl object-cover border border-white/10 shadow-md shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-sm truncate">{leader.name}</h4>
                            <div className="text-xs text-cyan-400 font-medium truncate mt-0.5">
                              {leader.role}
                            </div>
                            <span
                              className={`inline-block font-mono text-[10px] px-2 py-0.5 rounded mt-1.5 border ${
                                leader.tier === 'executive'
                                  ? 'bg-amber-950/50 text-amber-300 border-amber-500/30'
                                  : leader.tier === 'college-lead'
                                  ? 'bg-cyan-950/50 text-cyan-300 border-cyan-500/30'
                                  : 'bg-purple-950/50 text-purple-300 border-purple-500/30'
                              }`}
                            >
                              {leader.tier === 'executive'
                                ? 'مجلس القيادة التنفيذي'
                                : leader.tier === 'college-lead'
                                ? 'منسق كلية'
                                : 'رئيس لجنة'}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-300 italic bg-white/[0.02] p-2.5 rounded-xl border border-white/5 mb-3 line-clamp-2">
                          "{leader.quote}"
                        </div>

                        <div className="space-y-1 text-xs text-gray-400 mb-3">
                          <div className="truncate">
                            <span className="text-gray-500">القسم:</span> {leader.department}
                          </div>
                          <div className="truncate font-mono text-[11px] text-gray-400">
                            <span className="text-gray-500">البريد:</span> {leader.email}
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {leader.skills.slice(0, 4).map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                        <button
                          onClick={() => handleOpenEditLeader(leader)}
                          className="flex-1 py-1.5 rounded-xl bg-white/[0.05] hover:bg-cyan-400 hover:text-black text-cyan-300 text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() => handleDeleteLeader(leader.id, leader.name)}
                          className="p-1.5 rounded-xl bg-red-950/30 hover:bg-red-950 text-red-400 text-xs transition-colors cursor-pointer"
                          title="حذف القائد"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Colleges & Majors Management */}
            {activeTab === 'colleges' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white">إدارة الكليات والتخصصات الهندسية</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      تعديل أسماء الكليات، بيانات المنسقين الأكاديميين، المختبرات، والتوصيفات التقنية للتخصصات.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
                    <button
                      onClick={() => setCollegeSubTab('colleges')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        collegeSubTab === 'colleges'
                          ? 'bg-cyan-400 text-black shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      الكليات ({colleges.length})
                    </button>
                    <button
                      onClick={() => setCollegeSubTab('majors')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        collegeSubTab === 'majors'
                          ? 'bg-cyan-400 text-black shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      التخصصات ({majors.length})
                    </button>
                  </div>
                </div>

                {/* Sub Tab: Colleges */}
                {collegeSubTab === 'colleges' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {colleges.map((col) => (
                      <div
                        key={col.id}
                        className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                              {col.code}
                            </span>
                            <span className="font-mono text-[11px] text-gray-400">
                              {col.labsCount} مختبرات متطورة
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-white mb-1">{col.name}</h4>
                          <p className="text-xs text-gray-300 mb-3 line-clamp-2">{col.description}</p>

                          {/* Coordinator Cardlet */}
                          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3 mb-3">
                            <img
                              src={col.coordinator.avatar}
                              alt={col.coordinator.name}
                              className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] text-gray-400">منسق الكلية:</div>
                              <div className="text-xs font-bold text-white truncate">{col.coordinator.name}</div>
                              <div className="text-[10px] text-cyan-400 truncate">{col.coordinator.title}</div>
                            </div>
                          </div>

                          <div className="text-xs text-gray-400 mb-3">
                            <span className="text-cyan-400 font-bold">الإنجاز الأبرز:</span> {col.flagshipAchievement}
                          </div>
                        </div>

                        <button
                          onClick={() => setEditingCollege(col)}
                          className="w-full py-2 rounded-xl bg-white/[0.05] hover:bg-cyan-400 hover:text-black text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل بيانات الكلية والمنسق</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sub Tab: Majors */}
                {collegeSubTab === 'majors' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {majors.map((maj) => (
                      <div
                        key={maj.id}
                        className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                              {maj.code}
                            </span>
                            <span className="text-[11px] text-gray-400 truncate max-w-[150px]">
                              {maj.collegeName}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-white mb-1">{maj.name}</h4>
                          <div className="text-xs text-cyan-400 font-medium mb-2">{maj.tagline}</div>
                          <p className="text-xs text-gray-300 mb-3 line-clamp-2">{maj.description}</p>

                          <div className="mb-3">
                            <div className="text-[10px] text-gray-500 font-mono mb-1">التقنيات والأدوات:</div>
                            <div className="flex flex-wrap gap-1">
                              {maj.techStack.map((tech, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setEditingMajor(maj)}
                          className="w-full py-2 rounded-xl bg-white/[0.05] hover:bg-cyan-400 hover:text-black text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل بيانات التخصص</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Vision & Identity Settings & Spotlight */}
            {activeTab === 'settings' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white">الرؤية وهوية المنصة ونجم الشهر</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    تعديل نصوص الواجهة الرئيسية (Hero Section)، المانيفستو الهندسي، وبيانات مهندس الشهر المتميز (Spotlight).
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Hero & Vision Settings Card */}
                  <form
                    onSubmit={handleSaveSettings}
                    className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-sm font-bold text-white">نصوص الرؤية والواجهة الرئيسية (Hero)</h4>
                      </div>
                      {settingsSavedMsg && (
                        <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 animate-in fade-in">
                          <Check className="w-3.5 h-3.5" />
                          تم الحفظ والتحديث
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-gray-300 mb-1 font-mono">
                        عنوان الهيرو الأساسي (Hero Title):
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.heroTitle}
                        onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-300 mb-1 font-mono">
                        الكلمة المضيئة البارزة (Glowing Highlight):
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.heroHighlight}
                        onChange={(e) => setSettings({ ...settings, heroHighlight: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-cyan-400 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-300 mb-1 font-mono">
                        السطر التعريفي الأول (Subheadline 1):
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={settings.heroSubheadline1}
                        onChange={(e) => setSettings({ ...settings, heroSubheadline1: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-300 mb-1 font-mono">
                        السطر التعريفي الثاني (Subheadline 2):
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={settings.heroSubheadline2}
                        onChange={(e) => setSettings({ ...settings, heroSubheadline2: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>حفظ وتحديث نصوص الرؤية</span>
                    </button>
                  </form>

                  {/* Student Spotlight Card */}
                  <form
                    onSubmit={handleSaveSpotlight}
                    className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <h4 className="text-sm font-bold text-white">نجم الشهر الهندسي (Student Spotlight)</h4>
                      </div>
                      {spotlightSavedMsg && (
                        <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 animate-in fade-in">
                          <Check className="w-3.5 h-3.5" />
                          تم التحديث في الشريط الحي
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">اسم الطالب / المهندس:</label>
                        <input
                          type="text"
                          required
                          value={spotlight.name}
                          onChange={(e) => setSpotlight({ ...spotlight, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">التخصص الأكاديمي:</label>
                        <input
                          type="text"
                          required
                          value={spotlight.major}
                          onChange={(e) => setSpotlight({ ...spotlight, major: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-300 mb-1 font-mono">أبرز إنجاز حققه:</label>
                      <input
                        type="text"
                        required
                        value={spotlight.achievement}
                        onChange={(e) => setSpotlight({ ...spotlight, achievement: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-300 mb-1 font-mono">كلمة المهندس / الاقتباس:</label>
                      <textarea
                        rows={2}
                        required
                        value={spotlight.quote}
                        onChange={(e) => setSpotlight({ ...spotlight, quote: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-300 mb-1 font-mono">رابط صورة المهندس:</label>
                      <input
                        type="url"
                        required
                        value={spotlight.avatar}
                        onChange={(e) => setSpotlight({ ...spotlight, avatar: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 font-mono">عدد المشاريع:</label>
                        <input
                          type="number"
                          value={spotlight.projectsCount}
                          onChange={(e) => setSpotlight({ ...spotlight, projectsCount: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 font-mono">عدد الجوائز:</label>
                        <input
                          type="number"
                          value={spotlight.awardsCount}
                          onChange={(e) => setSpotlight({ ...spotlight, awardsCount: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 font-mono">الأوراق المنشورة:</label>
                        <input
                          type="number"
                          value={spotlight.publicationsCount}
                          onChange={(e) => setSpotlight({ ...spotlight, publicationsCount: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>حفظ وتحديث نجم الشهر</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Tab 4: Cloud & Supabase Bridge */}
            {activeTab === 'cloud' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white">إعدادات الربط السحابي (Supabase Cloud Database)</h3>
                  <p className="text-xs text-gray-400">
                    يمكنك ربط المنصة مباشرة مع مشروع Supabase حقيقي ليتم حفظ كل الفعاليات والطلبات في قاعدة بيانات Postgres حقيقية.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-mono text-cyan-400 mb-1">SUPABASE PROJECT URL:</label>
                    <input
                      type="text"
                      placeholder="https://xyzabcdefg.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-cyan-400 mb-1">SUPABASE ANON PUBLIC KEY:</label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-mono"
                    />
                  </div>

                  {supabaseStatus && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-cyan-300">
                      {supabaseStatus}
                    </div>
                  )}

                  <button
                    onClick={handleConnectSupabase}
                    disabled={supabaseLoading}
                    className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${supabaseLoading ? 'animate-spin' : ''}`} />
                    <span>فحص وحفظ إعدادات الربط</span>
                  </button>
                </div>

                {/* Local Backup Section */}
                <div className="p-6 rounded-2xl bg-black/40 border border-white/10 max-w-xl space-y-3">
                  <h4 className="text-sm font-bold text-white">النسخ الاحتياطي لقاعدة البيانات المحلية</h4>
                  <p className="text-xs text-gray-400">
                    قم بتحميل ملف JSON يحتوي على كامل سجلات الموقع (المشاريع، الفعاليات، المسجلين، والطلبات) أو استعادة الإعدادات الأصلية.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => {
                        sound.playClick();
                        const jsonStr = dataService.exportFullDatabaseJSON();
                        const blob = new Blob([jsonStr], { type: 'application/json' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `eng_club_backup_${new Date().toISOString().split('T')[0]}.json`;
                        link.click();
                      }}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تصدير نسخة كاملة (JSON)</span>
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm('هل أنت متأكد من استعادة بيانات العينة الافتراضية؟')) {
                          dataService.resetDefaults();
                          sound.playSuccess();
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-950/80 border border-red-500/30 text-xs font-mono text-red-300 cursor-pointer"
                    >
                      استعادة البيانات الافتراضية
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inspect Applicant Detail Modal */}
        {inspectApp && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-3xl glass-panel border border-cyan-500/30 p-6 shadow-2xl relative text-right animate-in fade-in duration-150">
              <button
                onClick={() => setInspectApp(null)}
                className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-4">
                <span className="font-mono text-xs text-cyan-400">ملف طلب العضوية التفصيلي</span>
                <h3 className="text-xl font-bold text-white mt-1">{inspectApp.fullName}</h3>
                <div className="font-mono text-xs text-gray-400 mt-0.5">
                  ID: {inspectApp.studentId} — {inspectApp.email}
                </div>
              </div>

              <div className="space-y-3 text-xs text-gray-300 mb-6">
                <div>
                  <span className="text-gray-500">الكلية والتخصص:</span>
                  <div className="font-bold text-white">{inspectApp.college} — {inspectApp.major}</div>
                </div>

                <div>
                  <span className="text-gray-500">اللجنة والالتزام:</span>
                  <div className="font-bold text-cyan-300">{inspectApp.targetCommittee} ({inspectApp.weeklyCommitmentHours} ساعات أسبوعياً)</div>
                </div>

                <div>
                  <span className="text-gray-500">المهارات المحددة:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {inspectApp.skills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-cyan-950/60 text-[10px] text-cyan-300 border border-cyan-500/30">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-gray-500">ما الذي يريد بناءه (الرؤية والشغف):</span>
                  <div className="p-3 rounded-xl bg-black/50 border border-white/5 text-gray-200 mt-1 leading-relaxed">
                    {inspectApp.personalStatement || 'لم يُحدد'}
                  </div>
                </div>

                {inspectApp.portfolioUrl && (
                  <div>
                    <span className="text-gray-500">معرض الأعمال:</span>
                    <a
                      href={inspectApp.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 underline block font-mono mt-0.5"
                    >
                      {inspectApp.portfolioUrl}
                    </a>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    handleUpdateAppStatus(inspectApp.id, 'تم القبول');
                    setInspectApp(null);
                  }}
                  className="flex-1 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs cursor-pointer shadow-md"
                >
                  قبول العضوية
                </button>
                <button
                  onClick={() => {
                    handleUpdateAppStatus(inspectApp.id, 'مقابلة مجدولة');
                    setInspectApp(null);
                  }}
                  className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs cursor-pointer"
                >
                  تحديد مقابلة
                </button>
                <button
                  onClick={() => {
                    handleUpdateAppStatus(inspectApp.id, 'مرفوض');
                    setInspectApp(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-950 text-red-400 hover:bg-red-900 text-xs cursor-pointer"
                >
                  رفض
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leadership Add/Edit Modal */}
        {showLeaderModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-xl rounded-3xl glass-panel border border-cyan-500/30 p-6 shadow-2xl relative text-right animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => {
                  setShowLeaderModal(false);
                  setEditingLeader(null);
                }}
                className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-4">
                <span className="font-mono text-xs text-cyan-400">إدارة القيادات الهندسية</span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {editingLeader ? `تعديل بيانات: ${editingLeader.name}` : 'إضافة مهندس قيادي جديد'}
                </h3>
              </div>

              <form onSubmit={handleSaveLeader} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">الاسم الكامل:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: المهندس حمزة الصالح"
                      value={leaderForm.name || ''}
                      onChange={(e) => setLeaderForm({ ...leaderForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">المسمى القيادي / الوظيفي:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: رئيس لجنة الذكاء الاصطناعي"
                      value={leaderForm.role || ''}
                      onChange={(e) => setLeaderForm({ ...leaderForm, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">المستوى التنظيمي (Tier):</label>
                    <select
                      value={leaderForm.tier || 'college-lead'}
                      onChange={(e) =>
                        setLeaderForm({
                          ...leaderForm,
                          tier: e.target.value as LeaderMember['tier'],
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    >
                      <option value="executive">مجلس القيادة التنفيذي</option>
                      <option value="college-lead">منسق كلية</option>
                      <option value="committee-lead">رئيس لجنة تقنية / إشرافية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">القسم / الكلية:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: كلية الهندسة والتكنولوجيا الصناعية"
                      value={leaderForm.department || ''}
                      onChange={(e) => setLeaderForm({ ...leaderForm, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-mono">البريد الإلكتروني / الجامعي:</label>
                  <input
                    type="email"
                    required
                    placeholder="leader@eng-club.edu"
                    value={leaderForm.email || ''}
                    onChange={(e) => setLeaderForm({ ...leaderForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-mono">رابط الصورة الشخصية (Avatar URL):</label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={leaderForm.avatar || ''}
                    onChange={(e) => setLeaderForm({ ...leaderForm, avatar: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-mono">كلمة القائد / الاقتباس الهندسي:</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="اقتباس أو رؤية القائد لمستقبل النادي والهندسة..."
                    value={leaderForm.quote || ''}
                    onChange={(e) => setLeaderForm({ ...leaderForm, quote: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-mono">المهارات والاهتمامات (مفصولة بفواصل):</label>
                  <input
                    type="text"
                    placeholder="ذكاء اصطناعي, أنظمة مدمجة, إدارة مشاريع"
                    value={leaderSkillsInput}
                    onChange={(e) => setLeaderSkillsInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                  />
                </div>

                <div className="flex gap-2 pt-3 border-t border-white/10">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer shadow-md transition-all"
                  >
                    {editingLeader ? 'حفظ التعديلات' : 'إضافة القائد فوراً'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeaderModal(false);
                      setEditingLeader(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* College Edit Modal */}
        {editingCollege && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-3xl glass-panel border border-cyan-500/30 p-6 shadow-2xl relative text-right animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setEditingCollege(null)}
                className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-4">
                <span className="font-mono text-xs text-cyan-400">تعديل بيانات الكلية الهندسية</span>
                <h3 className="text-xl font-bold text-white mt-1">{editingCollege.name}</h3>
              </div>

              <form onSubmit={handleSaveCollege} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-300 mb-1 font-mono">نظرة عامة على الكلية (Description):</label>
                  <textarea
                    rows={3}
                    required
                    value={editingCollege.description}
                    onChange={(e) => setEditingCollege({ ...editingCollege, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="font-bold text-cyan-400 font-mono text-xs">بيانات المنسق الأكاديمي للكلية:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 mb-1">اسم المنسق:</label>
                      <input
                        type="text"
                        required
                        value={editingCollege.coordinator.name}
                        onChange={(e) =>
                          setEditingCollege({
                            ...editingCollege,
                            coordinator: { ...editingCollege.coordinator, name: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">المسمى الأكاديمي:</label>
                      <input
                        type="text"
                        required
                        value={editingCollege.coordinator.title}
                        onChange={(e) =>
                          setEditingCollege({
                            ...editingCollege,
                            coordinator: { ...editingCollege.coordinator, title: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 mb-1">البريد الإلكتروني:</label>
                      <input
                        type="email"
                        required
                        value={editingCollege.coordinator.email}
                        onChange={(e) =>
                          setEditingCollege({
                            ...editingCollege,
                            coordinator: { ...editingCollege.coordinator, email: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">رابط صورة المنسق:</label>
                      <input
                        type="url"
                        required
                        value={editingCollege.coordinator.avatar}
                        onChange={(e) =>
                          setEditingCollege({
                            ...editingCollege,
                            coordinator: { ...editingCollege.coordinator, avatar: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">الإنجاز الأبرز للكلية:</label>
                    <input
                      type="text"
                      required
                      value={editingCollege.flagshipAchievement}
                      onChange={(e) => setEditingCollege({ ...editingCollege, flagshipAchievement: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">عدد المختبرات المتطورة:</label>
                    <input
                      type="number"
                      required
                      value={editingCollege.labsCount}
                      onChange={(e) => setEditingCollege({ ...editingCollege, labsCount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-white/10">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer shadow-md transition-all"
                  >
                    حفظ بيانات الكلية
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCollege(null)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Major Edit Modal */}
        {editingMajor && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-3xl glass-panel border border-cyan-500/30 p-6 shadow-2xl relative text-right animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setEditingMajor(null)}
                className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-4">
                <span className="font-mono text-xs text-cyan-400">تعديل بيانات التخصص الأكاديمي</span>
                <h3 className="text-xl font-bold text-white mt-1">{editingMajor.name}</h3>
                <div className="font-mono text-xs text-gray-400 mt-0.5">{editingMajor.collegeName}</div>
              </div>

              <form onSubmit={handleSaveMajor} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-300 mb-1 font-mono">الشعار / السطر البارز (Tagline):</label>
                  <input
                    type="text"
                    required
                    value={editingMajor.tagline}
                    onChange={(e) => setEditingMajor({ ...editingMajor, tagline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-mono">وصف التخصص:</label>
                  <textarea
                    rows={3}
                    required
                    value={editingMajor.description}
                    onChange={(e) => setEditingMajor({ ...editingMajor, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-mono">حزمة التقنيات والأدوات (مفصولة بفواصل):</label>
                  <input
                    type="text"
                    required
                    value={editingMajor.techStack.join(', ')}
                    onChange={(e) =>
                      setEditingMajor({
                        ...editingMajor,
                        techStack: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-mono">المسارات الوظيفية (مفصولة بفواصل):</label>
                  <input
                    type="text"
                    required
                    value={editingMajor.careerPaths.join(', ')}
                    onChange={(e) =>
                      setEditingMajor({
                        ...editingMajor,
                        careerPaths: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-mono">عنوان المشروع المميز للتخصص:</label>
                  <input
                    type="text"
                    required
                    value={editingMajor.featuredProjectTitle}
                    onChange={(e) => setEditingMajor({ ...editingMajor, featuredProjectTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                  />
                </div>

                <div className="flex gap-2 pt-3 border-t border-white/10">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer shadow-md transition-all"
                  >
                    حفظ بيانات التخصص
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingMajor(null)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
