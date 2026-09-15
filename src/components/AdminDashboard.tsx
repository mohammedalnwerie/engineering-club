import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { supabaseBridge } from '../services/supabaseClient';
import { sound } from '../utils/soundEngine';
import { ClubLogo } from './ClubLogo';
import { ExecutiveBadgeModal } from './ExecutiveBadgeModal';
import { CommitteeBadgeModal } from './CommitteeBadgeModal';
import { exportCardAsImage, printCardAsPdf } from '../utils/cardExporter';
import type {
  ProjectCaseStudy,
  EventItem,
  StoredApplication,
  EventTicket,
  LeaderMember,
  College,
  Major,
  SiteSettings,
  StudentSpotlightData,
  ComplaintItem
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
  Award,
  Sparkles,
  Building2,
  Edit3,
  Save,
  Check,
  Camera,
  Upload,
  Link as LinkIcon,
  LogOut,
  Printer,
  ShieldCheck,
  CreditCard,
  Copy,
  MessageSquare,
} from 'lucide-react';

// Client-side image compressor & lightweight base64 converter
const processImageFile = (
  file: File,
  callback: (base64Url: string) => void,
  onError?: (err: string) => void
) => {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    onError?.('الرجاء اختيار ملف صورة مدعوم (JPG, PNG, WebP)');
    return;
  }
  const reader = new FileReader();
  reader.onload = (readerEvent) => {
    const rawResult = readerEvent.target?.result as string;
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          callback(dataUrl);
        } else {
          callback(rawResult);
        }
      } catch {
        callback(rawResult);
      }
    };
    img.onerror = () => {
      if (rawResult) {
        callback(rawResult);
      } else {
        onError?.('تعذر قراءة ملف الصورة');
      }
    };
    img.src = rawResult;
  };
  reader.onerror = () => {
    onError?.('حدث خطأ أثناء قراءة الملف من الجهاز');
  };
  reader.readAsDataURL(file);
};

const AVATAR_PRESETS = [
  { label: 'افتراضي هندسي', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80' },
  { label: 'رسمي 1', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80' },
  { label: 'رسمية 1', url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80' },
  { label: 'رسمي 2', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80' },
  { label: 'رسمي 3', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' },
  { label: 'رسمي 4', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
  { label: 'رسمية 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80' },
  { label: 'رسمية 3', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' },
  { label: 'رسمي 5', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80' },
];

const DEFAULT_AVATAR = AVATAR_PRESETS[0].url;

const ROLE_TEMPLATES = [
  {
    role: 'رئيس النادي الهندسي',
    tier: 'executive' as const,
    department: 'رئاسة النادي',
    skills: 'القيادة الاستراتيجية, إدارة الابتكار الهندسي, الحوكمة وصناعة القرار',
    quote: 'نؤمن أن المهندس لا ينتظر الفرصة، بل يبتكر أدوات بنائها ويقود التحول التقني.'
  },
  {
    role: 'نائب رئيس النادي للشؤون الإدارية',
    tier: 'executive' as const,
    department: 'الهيئة الإدارية',
    skills: 'الشؤون الإدارية والحوكمة, إدارة اللجان والتنسيق, التخطيط والسياسات الداخلية',
    quote: 'الحوكمة الإدارية الرشيدة والتنظيم الداخلي المتين هما الأساس الذي تنطلق منه جميع إنجازات النادي.'
  },
  {
    role: 'نائب رئيس النادي للشؤون التنفيذية',
    tier: 'executive' as const,
    department: 'الهيئة الإدارية',
    skills: 'الإشراف التنفيذي الميداني, إدارة المبادرات والعمليات, قيادة فرق العمل الميدانية',
    quote: 'نحول الرؤى والخطط إلى واقع ملموس ومشاريع ميدانية رائدة تصنع فارقاً حقيقياً لطلبتنا.'
  },
  {
    role: 'أمين صندوق النادي',
    tier: 'executive' as const,
    department: 'الهيئة الإدارية',
    skills: 'الإدارة المالية والموازنات, التدقيق والشفافية, إدارة الرعايات والعهد',
    quote: 'حوكمة الميزانيات وتوجيه الموارد المالية بكفاءة يضمن نجاح واستدامة كل مبادرة.'
  },
  {
    role: 'رئيس لجنة الفعاليات والأنشطة',
    tier: 'committee-lead' as const,
    department: 'لجنة الفعاليات والأنشطة',
    skills: 'إدارة الحشود والفعاليات, تنظيم الهاكاثونات, التخطيط اللوجستي الميداني',
    quote: 'نبتكر فعاليات ومسابقات غير مسبوقة تصنع تجربة هندسية ثرية لجميع الطلاب.'
  },
  {
    role: 'رئيسة لجنة العلاقات والتدريب',
    tier: 'committee-lead' as const,
    department: 'لجنة العلاقات والتدريب',
    skills: 'الشراكات الاستراتيجية, تطوير المسارات التدريبية, استقطاب الخبراء والمدربين',
    quote: 'نبني جسوراً متينة من الشراكات الصناعية والبرامج التدريبية لتأهيل الكفاءات.'
  },
  {
    role: 'رئيسة اللجنة الإعلامية',
    tier: 'committee-lead' as const,
    department: 'اللجنة الإعلامية',
    skills: 'صناعة المحتوى الرقمي, التغطيات الإعلامية, الهوية والتصميم والإنتاج المرئي',
    quote: 'نترجم الإنجازات والابتكارات الهندسية إلى قصص بصرية ومحتوى رقمي ملهم.'
  }
];

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  const [activeTab, setActiveTab] = useState<'applications' | 'projects' | 'events' | 'leadership' | 'colleges' | 'complaints' | 'settings' | 'cloud'>('applications');

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

  // Complaints & Suggestions state
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [complaintsFilter, setComplaintsFilter] = useState<'all' | 'pending' | 'in-progress' | 'resolved' | 'rejected'>('all');
  const [complaintsCategoryFilter, setComplaintsCategoryFilter] = useState<'all' | 'complaint' | 'suggestion' | 'inquiry'>('all');
  const [complaintsSearch, setComplaintsSearch] = useState('');
  const [inspectComplaint, setInspectComplaint] = useState<ComplaintItem | null>(null);
  const [adminResponseNote, setAdminResponseNote] = useState('');

  // Executive Badge state
  const [viewingLeaderBadge, setViewingLeaderBadge] = useState<LeaderMember | null>(null);
  const [viewingCommitteeApp, setViewingCommitteeApp] = useState<StoredApplication | null>(null);

  // Colleges sub-tab
  const [collegeSubTab, setCollegeSubTab] = useState<'colleges' | 'majors'>('colleges');
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);

  // Leadership modal / editing & filtering
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [editingLeader, setEditingLeader] = useState<LeaderMember | null>(null);
  const [leaderFilter, setLeaderFilter] = useState<'all' | 'executive' | 'committee-lead'>('all');
  const [leaderSearch, setLeaderSearch] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const [leaderForm, setLeaderForm] = useState<Partial<LeaderMember>>({
    name: '',
    role: '',
    tier: 'committee-lead',
    department: '',
    avatar: AVATAR_PRESETS[0].url,
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
  const [showSpotlightUrlInput, setShowSpotlightUrlInput] = useState(false);

  // Filters & Search
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');

  // Selected application for detail modal
  const [inspectApp, setInspectApp] = useState<StoredApplication | null>(null);
  // Selected application for digital ID badge card modal
  const [viewingBadgeApp, setViewingBadgeApp] = useState<StoredApplication | null>(null);

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

  // Edit Project & Event States
  const [editingProject, setEditingProject] = useState<ProjectCaseStudy | null>(null);
  const [editingProjectTechStack, setEditingProjectTechStack] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [editingEventPrereqs, setEditingEventPrereqs] = useState<string>('');
  const [showCollegeUrlInput, setShowCollegeUrlInput] = useState(false);

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
    setComplaints(dataService.getComplaints());
  };

  
  const handleUpdateComplaintStatus = (
    id: string,
    newStatus: ComplaintItem['status'],
    notes?: string
  ) => {
    const updated = dataService.updateComplaintStatus(id, newStatus, notes);
    if (updated) {
      setComplaints(dataService.getComplaints());
      if (inspectComplaint && inspectComplaint.id === id) {
        setInspectComplaint(updated);
      }
      showToast(`تم تحديث حالة البلاغ إلى (${newStatus}) بنجاح`);
    }
  };

  const handleDeleteComplaint = (id: string, ticket: string) => {
    if (window.confirm(`هل أنت متأكد من حذف البلاغ برقم تذكرة (${ticket}) نهائياً؟`)) {
      dataService.deleteComplaint(id);
      setComplaints(dataService.getComplaints());
      if (inspectComplaint && inspectComplaint.id === id) {
        setInspectComplaint(null);
      }
      showToast('تم حذف البلاغ بنجاح');
    }
  };

  const handleOpenAddLeader = () => {
    setEditingLeader(null);
    setLeaderForm({
      name: '',
      role: '',
      tier: 'committee-lead',
      department: '',
      avatar: AVATAR_PRESETS[0].url,
      quote: '',
      email: '',
      linkedin: '',
      github: '',
      skills: ['قيادة فرق', 'تطوير حلول']
    });
    setLeaderSkillsInput('قيادة فرق, تطوير حلول');
    setShowUrlInput(false);
    setShowLeaderModal(true);
  };

  const handleOpenEditLeader = (leader: LeaderMember) => {
    setEditingLeader(leader);
    setLeaderForm({ ...leader });
    setLeaderSkillsInput(leader.skills.join(', '));
    setShowUrlInput(false);
    setShowLeaderModal(true);
  };

  const handleDirectAvatarUpload = (leader: LeaderMember, file: File) => {
    processImageFile(
      file,
      (dataUrl) => {
        const updated: LeaderMember = { ...leader, avatar: dataUrl };
        dataService.saveLeader(updated);
        setLeadership(dataService.getLeadership());
        sound.playSuccess();
        showToast(`تم تحديث صورة المهندس (${leader.name}) بنجاح`);
      },
      (err) => showToast(err)
    );
  };

  const handleResetLeaderAvatar = (leader: LeaderMember) => {
    if (window.confirm(`هل أنت متأكد من حذف صورة (${leader.name}) واستعادة الصورة الافتراضية؟`)) {
      sound.playClick();
      const updated: LeaderMember = { ...leader, avatar: DEFAULT_AVATAR };
      dataService.saveLeader(updated);
      setLeadership(dataService.getLeadership());
      showToast(`تم حذف صورة (${leader.name}) وتعيين الصورة الافتراضية`);
    }
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
      tier: leaderForm.tier || 'committee-lead',
      department: leaderForm.department || '',
      avatar: leaderForm.avatar || AVATAR_PRESETS[0].url,
      quote: leaderForm.quote || '',
      email: leaderForm.email || '',
      linkedin: leaderForm.linkedin,
      github: leaderForm.github,
      skills: skillsArray.length > 0 ? skillsArray : ['مهندس مبتكر']
    };

    dataService.saveLeader(saved);
    setLeadership(dataService.getLeadership());
    sound.playSuccess();
    setShowLeaderModal(false);
    setEditingLeader(null);
    showToast(`تم حفظ بيانات المهندس (${saved.name}) بنجاح`);
  };

  const handleDeleteLeader = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف عضو الكادر (${name})؟`)) {
      dataService.deleteLeader(id);
      setLeadership(dataService.getLeadership());
      sound.playClick();
      showToast(`تم حذف عضو الكادر (${name})`);
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

  // Delete single application
  const handleDeleteApplication = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف طلب الانضمام الخاص بـ (${name}) نهائياً؟`)) {
      sound.playClick();
      dataService.deleteApplication(id);
      showToast(`تم حذف طلب (${name}) بنجاح`);
      if (inspectApp?.id === id) {
        setInspectApp(null);
      }
    }
  };

  // Batch delete all rejected applications
  const handleDeleteAllRejected = () => {
    const rejectedList = applications.filter((a) => a.status === 'مرفوض');
    if (rejectedList.length === 0) return;
    if (window.confirm(`هل أنت متأكد من حذف كافة الطلبات المرفوضة (${rejectedList.length} طلب) نهائياً من النظام؟`)) {
      sound.playClick();
      const removedCount = dataService.deleteRejectedApplications();
      showToast(`تم حذف ${removedCount} طلب مرفوض بنجاح`);
      if (inspectApp?.status === 'مرفوض') {
        setInspectApp(null);
      }
    }
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

  // Edit Project Handlers
  const handleOpenEditProject = (proj: ProjectCaseStudy) => {
    sound.playClick();
    setEditingProject({ ...proj });
    setEditingProjectTechStack((proj.techStack || []).join(', '));
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    const updated: ProjectCaseStudy = {
      ...editingProject,
      techStack: editingProjectTechStack
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    dataService.saveProject(updated);
    setProjects(dataService.getProjects());
    setEditingProject(null);
    sound.playSuccess();
    showToast(`تم حفظ وتحديث مشروع (${updated.title}) بنجاح`);
  };

  // Edit Event Handlers
  const handleOpenEditEvent = (ev: EventItem) => {
    sound.playClick();
    setEditingEvent({ ...ev });
    setEditingEventPrereqs((ev.prerequisites || []).join(', '));
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    const updated: EventItem = {
      ...editingEvent,
      capacity: Number(editingEvent.capacity) || 50,
      prerequisites: editingEventPrereqs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    dataService.saveEvent(updated);
    setEvents(dataService.getEvents());
    setEditingEvent(null);
    sound.playSuccess();
    showToast(`تم حفظ وتحديث فعالية (${updated.title}) بنجاح`);
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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#07090e] w-screen h-screen overflow-hidden text-right select-none animate-in fade-in duration-200">
      <div
        className="relative w-full h-full flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-[#090d16]/95 shrink-0">
          <div className="flex items-center gap-3.5">
            <ClubLogo variant="emblem" size="md" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-white text-base">لوحة الإدارة الهندسية المركزية</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#0B2D5B] text-cyan-300 border border-cyan-500/30 font-bold">
                  ENG-ADMIN v3.0
                </span>
                <span className="hidden md:inline-flex items-center gap-1 font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-bold">
                  {settings.sloganAr || "هندسة اليوم .. تصنع أثر الغد"}
                </span>
                {isAuthenticated && (
                  <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    جلسة نشطة
                  </span>
                )}
              </div>
              <div className="font-mono text-[11px] text-gray-400">
                {settings.universityNameAr || "جامعة فلسطين"} — إدارة المشاريع، الكادر القيادي، الفعاليات، الهوية والرؤية
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isAuthenticated && (
              <button
                onClick={() => {
                  sound.playClick();
                  setIsAuthenticated(false);
                  setPasscode('');
                  showToast('تم تسجيل الخروج من لوحة الإدارة');
                }}
                className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-red-950/40 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-300 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تسجيل خروج</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
              title="العودة إلى الموقع الرئيسي"
            >
              <span>← العودة إلى الموقع الرئيسي</span>
            </button>
          </div>
        </div>

        {/* Global Toast Notification */}
        {toastMsg && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 text-xs font-mono shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-4 h-4 text-cyan-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Authentication Gate */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-16 flex flex-col items-center justify-center text-center my-auto">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-400/40 text-cyan-400 flex items-center justify-center mb-6">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">تسجيل دخول المشرفين وقادة اللجان</h3>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md mb-4">
              أدخل كلمة سر الإدارة للوصول إلى أدوات التحكم وإدارة بيانات الكادر والفعاليات.
            </p>

            <button
              type="button"
              onClick={() => {
                setPasscode('eng2026');
                sound.playClick();
              }}
              className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/30 px-3 py-1.5 rounded-xl font-mono cursor-pointer mb-6 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>انقر للتعبئة السريعة: eng2026</span>
            </button>

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
            <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-white/10 bg-black/40 text-xs gap-3">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 min-w-0">
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('applications');
                  }}
                  className={`whitespace-nowrap shrink-0 px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'applications'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>طلبات الانضمام ({applications.length})</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('projects');
                  }}
                  className={`whitespace-nowrap shrink-0 px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'projects'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>المشاريع ودراسات الحالة ({projects.length})</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('events');
                  }}
                  className={`whitespace-nowrap shrink-0 px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'events'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>الفعاليات والحضور ({events.length})</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('complaints');
                  }}
                  className={`whitespace-nowrap shrink-0 px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'complaints'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>صندوق الشكاوى والمقترحات ({complaints.length})</span>
                  {complaints.filter((c) => c.status === 'pending').length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-mono font-black">
                      {complaints.filter((c) => c.status === 'pending').length} جديد
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('leadership');
                  }}
                  className={`whitespace-nowrap shrink-0 px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'leadership'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Award className="w-4 h-4 shrink-0" />
                  <span>الكادر القيادي ({leadership.length})</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('colleges');
                  }}
                  className={`whitespace-nowrap shrink-0 px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'colleges'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>الكليات والتخصصات</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('settings');
                  }}
                  className={`whitespace-nowrap shrink-0 px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>الرؤية وهوية الموقع</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('cloud');
                  }}
                  className={`whitespace-nowrap shrink-0 px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'cloud'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Database className="w-4 h-4 shrink-0" />
                  <span>السحابة والنسخ الاحتياطي</span>
                </button>
              </div>

              {/* Status Telemetry */}
              <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-gray-400 shrink-0 border-r border-white/10 pr-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE</span>
              </div>
            </div>

            {/* Quick Operational Telemetry Strip */}
            <div className="px-4 sm:px-6 py-2.5 bg-[#080d1a]/80 border-b border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 text-xs shrink-0">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-400 font-mono">طلبات الانضمام</div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <span>{applications.length}</span>
                    <span className="text-[10px] text-amber-400 font-normal">({applications.filter((a) => a.status === 'قيد المراجعة').length} معلق)</span>
                  </div>
                </div>
                <Users className="w-4 h-4 text-cyan-400/70" />
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-400 font-mono">المشاريع المنشورة</div>
                  <div className="text-sm font-bold text-white mt-0.5">{projects.length} مشاريع</div>
                </div>
                <Layers className="w-4 h-4 text-blue-400/70" />
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-400 font-mono">الفعاليات والتذاكر</div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <span>{events.length}</span>
                    <span className="text-[10px] text-emerald-400 font-normal">({tickets.length} حجز)</span>
                  </div>
                </div>
                <Calendar className="w-4 h-4 text-emerald-400/70" />
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-400 font-mono">الكادر القيادي</div>
                  <div className="text-sm font-bold text-white mt-0.5">{leadership.length} قائد/ة</div>
                </div>
                <Award className="w-4 h-4 text-amber-400/70" />
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-400 font-mono">الكليات والتخصصات</div>
                  <div className="text-sm font-bold text-white mt-0.5">{colleges.length} كليات / {majors.length} تخصص</div>
                </div>
                <Building2 className="w-4 h-4 text-purple-400/70" />
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-400 font-mono">الهوية الرسمية</div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>معتمدة (UP)</span>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-emerald-400/70" />
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
                      className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-300 focus:outline-none cursor-pointer"
                    >
                      <option value="all">كافة الحالات</option>
                      <option value="قيد المراجعة">قيد المراجعة</option>
                      <option value="مقابلة مجدولة">مقابلة مجدولة</option>
                      <option value="تم القبول">تم القبول</option>
                      <option value="مرفوض">مرفوض</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {/* Delete all rejected button if any exist */}
                    {applications.some((a) => a.status === 'مرفوض') && (
                      <button
                        onClick={handleDeleteAllRejected}
                        className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-xs text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        title="حذف جميع الطلبات التي تم رفضها دفعة واحدة"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>حذف المرفوضين ({applications.filter((a) => a.status === 'مرفوض').length})</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        sound.playClick();
                        dataService.exportToCSV(applications, `club_applicants_${new Date().toISOString().split('T')[0]}`);
                      }}
                      className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-cyan-300 flex items-center gap-2 transition-colors cursor-pointer shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span>تصدير Excel (CSV)</span>
                    </button>
                  </div>
                </div>

                {/* Applications Table */}
                <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/30 overflow-x-auto">
                  <table className="w-full min-w-[760px] table-fixed text-right text-xs">
                    <thead className="bg-white/[0.04] text-gray-400 font-mono text-[11px] border-b border-white/10">
                      <tr>
                        <th className="p-3 w-[24%] text-right font-medium">اسم المتقدم</th>
                        <th className="p-3 w-[15%] text-right font-medium">الرقم الجامعي</th>
                        <th className="p-3 w-[22%] text-right font-medium">التخصص والكلية</th>
                        <th className="p-3 w-[17%] text-right font-medium">اللجنة المستهدفة</th>
                        <th className="p-3 w-[10%] text-center font-medium">حالة الطلب</th>
                        <th className="p-3 w-[12%] text-center font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {applications
                        .filter((app) => {
                          const q = appSearch.trim().toLowerCase();
                          const matchesSearch =
                            !q ||
                            app.fullName.toLowerCase().includes(q) ||
                            (app.studentId && app.studentId.toLowerCase().includes(q)) ||
                            (app.id && app.id.toLowerCase().includes(q)) ||
                            `up-eng-${app.id.slice(-8)}`.toLowerCase().includes(q) ||
                            app.major.toLowerCase().includes(q) ||
                            app.targetCommittee.toLowerCase().includes(q) ||
                            app.email.toLowerCase().includes(q);
                          const matchesFilter =
                            appStatusFilter === 'all' || app.status === appStatusFilter;
                          return matchesSearch && matchesFilter;
                        })
                        .map((app) => (
                          <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-3 w-[24%] text-right">
                              <div className="font-bold text-white truncate">{app.fullName}</div>
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{app.email}</div>
                            </td>
                            <td className="p-3 w-[15%] text-right font-mono text-cyan-400 font-semibold">{app.studentId}</td>
                            <td className="p-3 w-[22%] text-right">
                              <div className="truncate text-gray-200">{app.major}</div>
                              <div className="text-[10px] text-gray-400">{app.academicYear}</div>
                            </td>
                            <td className="p-3 w-[17%] text-right text-cyan-300 font-medium truncate">{app.targetCommittee}</td>
                            <td className="p-3 w-[10%] text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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
                            <td className="p-3 w-[12%] text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setInspectApp(app)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 transition-colors"
                                  title="معاينة الملف الكامل"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {app.status === 'تم القبول' && (
                                  <button
                                    onClick={() => setViewingBadgeApp(app)}
                                    className="p-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors"
                                    title="إصدار وعرض بطاقة العضوية الرقمية"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {app.status === 'تم القبول' && app.targetCommittee && !app.targetCommittee.includes('عامة') && (
                                  <button
                                    onClick={() => setViewingCommitteeApp(app)}
                                    className="p-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 transition-colors"
                                    title="إصدار وعرض كرت عضو اللجنة التنفيذية الرسمية"
                                  >
                                    <Award className="w-3.5 h-3.5" />
                                  </button>
                                )}

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

                                <button
                                  onClick={() => handleDeleteApplication(app.id, app.fullName)}
                                  className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                                  title="حذف هذا الطلب نهائياً"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenEditProject(proj)}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="تعديل دراسة الحالة"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف مشروع (${proj.title})؟`)) {
                              sound.playClick();
                              dataService.deleteProject(proj.id);
                              setProjects(dataService.getProjects());
                              showToast(`تم حذف مشروع (${proj.title})`);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                          title="حذف المشروع"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

                            <button
                              onClick={() => handleOpenEditEvent(ev)}
                              className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-500/20 text-xs font-bold text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="تعديل بيانات الفعالية"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تعديل</span>
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`هل أنت متأكد من حذف فعالية (${ev.title})؟`)) {
                                  sound.playClick();
                                  dataService.deleteEvent(ev.id);
                                  setEvents(dataService.getEvents());
                                  showToast(`تم حذف فعالية (${ev.title})`);
                                }
                              }}
                              className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                              title="حذف الفعالية"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
            {/* Tab: Complaints & Feedback Portal */}
            {activeTab === 'complaints' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">صندوق الشكاوى والمقترحات والاستفسارات</h3>
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                        {complaints.length} وارد
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      متابعة بلاغات وشكاوى ومقترحات الطلبة بدقة وشفافية، تسجيل إجراءات المعالجة وتحديث الحالات.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setComplaints(dataService.getComplaints());
                        showToast('تم تحديث قائمة الشكاوى والمقترحات');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>تحديث</span>
                    </button>
                  </div>
                </div>

                {/* Quick Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="text-[11px] font-mono text-gray-400">إجمالي البلاغات</div>
                    <div className="text-xl font-black text-white mt-0.5">{complaints.length}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30">
                    <div className="text-[11px] font-mono text-amber-300">قيد المراجعة والانتظار</div>
                    <div className="text-xl font-black text-amber-400 mt-0.5">
                      {complaints.filter((c) => c.status === 'pending').length}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/30">
                    <div className="text-[11px] font-mono text-blue-300">جاري المتابعة والمعالجة</div>
                    <div className="text-xl font-black text-blue-400 mt-0.5">
                      {complaints.filter((c) => c.status === 'in-progress').length}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                    <div className="text-[11px] font-mono text-emerald-300">تم الحل والمعالجة</div>
                    <div className="text-xl font-black text-emerald-400 mt-0.5">
                      {complaints.filter((c) => c.status === 'resolved').length}
                    </div>
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                      <button
                        onClick={() => setComplaintsFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          complaintsFilter === 'all'
                            ? 'bg-cyan-400 text-black shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        الكل ({complaints.length})
                      </button>
                      <button
                        onClick={() => setComplaintsFilter('pending')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          complaintsFilter === 'pending'
                            ? 'bg-amber-400 text-black shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        قيد المراجعة ({complaints.filter((c) => c.status === 'pending').length})
                      </button>
                      <button
                        onClick={() => setComplaintsFilter('in-progress')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          complaintsFilter === 'in-progress'
                            ? 'bg-blue-400 text-white shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        جاري المتابعة ({complaints.filter((c) => c.status === 'in-progress').length})
                      </button>
                      <button
                        onClick={() => setComplaintsFilter('resolved')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          complaintsFilter === 'resolved'
                            ? 'bg-emerald-400 text-black shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        تم الحل ({complaints.filter((c) => c.status === 'resolved').length})
                      </button>
                      <button
                        onClick={() => setComplaintsFilter('rejected')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          complaintsFilter === 'rejected'
                            ? 'bg-gray-700 text-white shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        مرفوض ({complaints.filter((c) => c.status === 'rejected').length})
                      </button>
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="ابحث برقم التذكرة أو الاسم أو الطالب..."
                        value={complaintsSearch}
                        onChange={(e) => setComplaintsSearch(e.target.value)}
                        className="w-full pl-3 pr-9 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-xs text-gray-400">
                    <span className="font-mono text-[11px] text-gray-500">التصنيف:</span>
                    <button
                      onClick={() => setComplaintsCategoryFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                        complaintsCategoryFilter === 'all'
                          ? 'bg-white/10 text-white font-bold'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      جميع الأنواع
                    </button>
                    <button
                      onClick={() => setComplaintsCategoryFilter('complaint')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                        complaintsCategoryFilter === 'complaint'
                          ? 'bg-red-950/60 text-red-300 border border-red-500/40 font-bold'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      شكاوى رسمية ⚠️
                    </button>
                    <button
                      onClick={() => setComplaintsCategoryFilter('suggestion')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                        complaintsCategoryFilter === 'suggestion'
                          ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 font-bold'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      مقترحات تطوير 💡
                    </button>
                    <button
                      onClick={() => setComplaintsCategoryFilter('inquiry')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                        complaintsCategoryFilter === 'inquiry'
                          ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40 font-bold'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      استفسارات عامة ❓
                    </button>
                  </div>
                </div>

                {/* Complaints List */}
                <div className="space-y-3">
                  {complaints
                    .filter((c) => {
                      if (complaintsFilter !== 'all' && c.status !== complaintsFilter) return false;
                      if (complaintsCategoryFilter !== 'all' && c.category !== complaintsCategoryFilter) return false;
                      if (complaintsSearch.trim()) {
                        const q = complaintsSearch.toLowerCase();
                        const matchTicket = c.ticketNumber.toLowerCase().includes(q);
                        const matchName = c.studentName?.toLowerCase().includes(q) || false;
                        const matchId = c.studentId?.toLowerCase().includes(q) || false;
                        const matchSubject = c.subject.toLowerCase().includes(q);
                        const matchMessage = c.message.toLowerCase().includes(q);
                        return matchTicket || matchName || matchId || matchSubject || matchMessage;
                      }
                      return true;
                    })
                    .map((item) => {
                      const isPending = item.status === 'pending';
                      const isInProgress = item.status === 'in-progress';
                      const isResolved = item.status === 'resolved';

                      return (
                        <div
                          key={item.id}
                          className={`p-4 rounded-2xl bg-black/40 border transition-all ${
                            isPending
                              ? 'border-amber-500/40 hover:border-amber-400/70 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                              : isInProgress
                              ? 'border-blue-500/40 hover:border-blue-400/70'
                              : isResolved
                              ? 'border-emerald-500/30 hover:border-emerald-400/60'
                              : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Ticket Badge */}
                              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1.5">
                                <span>{item.ticketNumber}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.ticketNumber);
                                    showToast('تم نسخ رقم التذكرة للحافظة');
                                  }}
                                  className="text-gray-400 hover:text-white cursor-pointer"
                                  title="نسخ رقم التذكرة"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </span>

                              {/* Category Badge */}
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                  item.category === 'complaint'
                                    ? 'bg-red-950/60 text-red-300 border-red-500/40'
                                    : item.category === 'suggestion'
                                    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                                    : 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                                }`}
                              >
                                {item.category === 'complaint'
                                  ? '⚠️ شكوى'
                                  : item.category === 'suggestion'
                                  ? '💡 مقترح'
                                  : '❓ استفسار'}
                              </span>

                              {/* Status Badge */}
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                  isPending
                                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/40 animate-pulse'
                                    : isInProgress
                                    ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                                    : isResolved
                                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                    : 'bg-gray-800 text-gray-300 border-gray-600'
                                }`}
                              >
                                {isPending
                                  ? 'قيد المراجعة'
                                  : isInProgress
                                  ? 'جاري المتابعة'
                                  : isResolved
                                  ? 'تم الحل والمعالجة ✓'
                                  : 'مرفوض'}
                              </span>

                              {/* Photo Attachment Badge */}
                              {item.attachmentImage && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 font-mono">
                                  <Camera className="w-3 h-3 text-cyan-400" />
                                  <span>مرفق صورة 📸</span>
                                </span>
                              )}
                            </div>

                            <div className="font-mono text-xs text-gray-400 flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-gray-500" />
                              <span>{new Date(item.createdAt).toLocaleString('ar-EG')}</span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <h4 className="text-sm font-bold text-white mb-1.5">{item.subject}</h4>
                            <p className="text-xs text-gray-300 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
                              {item.message}
                            </p>
                          </div>

                          {/* Student Info & Admin Notes */}
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5 text-xs">
                            <div className="font-mono text-gray-400 space-x-3 space-x-reverse">
                              {item.isAnonymous ? (
                                <span className="text-amber-400/90 font-sans">👤 مُرسل مجهول الهوية (طلب عدم الكشف)</span>
                              ) : (
                                <>
                                  <span className="text-white font-bold">{item.studentName}</span>
                                  {item.studentId && (
                                    <span className="text-cyan-300">ID: {item.studentId}</span>
                                  )}
                                  {item.college && (
                                    <span className="text-gray-400">({item.college})</span>
                                  )}
                                  {item.email && (
                                    <span className="text-gray-400">{item.email}</span>
                                  )}
                                  {item.phone && (
                                    <span className="text-gray-400">{item.phone}</span>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setInspectComplaint(item);
                                  setAdminResponseNote(item.adminNotes || '');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>معاينة والرد / تحديث الحالة</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteComplaint(item.id, item.ticketNumber)}
                                className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-950 border border-red-500/30 text-red-400 text-xs transition-all cursor-pointer"
                                title="حذف البلاغ نهائياً"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Admin Notes Preview */}
                          {item.adminNotes && (
                            <div className="mt-2.5 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs">
                              <div className="font-bold text-cyan-300 font-mono text-[11px] mb-1">
                                💬 رد وملاحظات الإدارة:
                              </div>
                              <div className="text-gray-200 leading-relaxed">{item.adminNotes}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {complaints.length === 0 && (
                    <div className="p-12 text-center rounded-2xl bg-black/30 border border-white/5">
                      <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <h4 className="text-white font-bold text-sm">صندوق الشكاوى والمقترحات فارغ</h4>
                      <p className="text-xs text-gray-500 mt-1">لم يتم إرسال أي شكاوى أو مقترحات حتى الآن.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'leadership' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Header & Stats Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">إدارة الكادر القيادي والهيكل التنظيمي</h3>
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                        {leadership.length} قيادي
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      التحكم ببيانات وصور رئيس النادي، الهيئة الإدارية (نائب الشؤون الإدارية، نائب الشؤون التنفيذية، أمين الصندوق)، ورؤساء اللجان.
                    </p>
                  </div>

                  <button
                    onClick={handleOpenAddLeader}
                    className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.25)] shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة قائد / مهندس جديد</span>
                  </button>
                </div>

                {/* Quick Stats / Hierarchy Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono text-amber-300/80">رئاسة ومجلس الإدارة</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {leadership.filter((l) => l.tier === 'executive').length} قيادات
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
                      👑
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono text-cyan-300/80">رؤساء اللجان التنفيذية</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {leadership.filter((l) => l.tier === 'committee-lead').length} لجان
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm">
                      ⚡
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono text-purple-300/80">تغيير الصور الفوري</div>
                      <div className="text-xs text-gray-300 mt-0.5">
                        انقر على أيقونة الكاميرا على أي بطاقة
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 rounded-2xl bg-black/40 border border-white/10">
                  <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                    <button
                      onClick={() => setLeaderFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        leaderFilter === 'all'
                          ? 'bg-cyan-400 text-black shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      الكل ({leadership.length})
                    </button>
                    <button
                      onClick={() => setLeaderFilter('executive')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        leaderFilter === 'executive'
                          ? 'bg-amber-400 text-black shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      الرئاسة والإدارة ({leadership.filter((l) => l.tier === 'executive').length})
                    </button>
                    <button
                      onClick={() => setLeaderFilter('committee-lead')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        leaderFilter === 'committee-lead'
                          ? 'bg-purple-400 text-black shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      رؤساء اللجان ({leadership.filter((l) => l.tier === 'committee-lead').length})
                    </button>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="ابحث بالاسم أو المسمى أو القسم..."
                      value={leaderSearch}
                      onChange={(e) => setLeaderSearch(e.target.value)}
                      className="w-full pl-3 pr-9 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>

                {/* Leader Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leadership
                    .filter((l) => {
                      if (leaderFilter === 'executive') return l.tier === 'executive';
                      if (leaderFilter === 'committee-lead') return l.tier === 'committee-lead';
                      return true;
                    })
                    .filter((l) => {
                      if (!leaderSearch.trim()) return true;
                      const q = leaderSearch.toLowerCase();
                      return (
                        l.name.toLowerCase().includes(q) ||
                        l.role.toLowerCase().includes(q) ||
                        l.department.toLowerCase().includes(q) ||
                        l.email.toLowerCase().includes(q)
                      );
                    })
                    .map((leader) => {
                      const isPresident = leader.id === 'pres-1' || leader.role.includes('رئيس النادي');
                      return (
                        <div
                          key={leader.id}
                          className={`p-5 rounded-2xl bg-black/40 border transition-all flex flex-col justify-between group ${
                            isPresident
                              ? 'border-amber-500/40 hover:border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                              : leader.tier === 'executive'
                              ? 'border-blue-500/30 hover:border-blue-400/60'
                              : 'border-white/10 hover:border-cyan-500/40'
                          }`}
                        >
                          <div>
                            <div className="flex items-start gap-3.5 mb-3">
                              {/* Avatar with Direct Upload & Delete Actions */}
                              <div className="relative group/avatar shrink-0">
                                <img
                                  src={leader.avatar}
                                  alt={leader.name}
                                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/10 shadow-md group-hover/avatar:border-cyan-400/60 transition-all"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                                  }}
                                />
                                {/* Upload Camera Button */}
                                <label
                                  className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black flex items-center justify-center shadow-lg border border-cyan-100 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                                  title="تغيير الصورة من جهازك فوراً"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onClick={(e) => {
                                      (e.target as HTMLInputElement).value = '';
                                    }}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleDirectAvatarUpload(leader, file);
                                      }
                                    }}
                                  />
                                </label>

                                {/* Delete Photo / Set Default Button */}
                                <button
                                  type="button"
                                  onClick={() => handleResetLeaderAvatar(leader)}
                                  className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-red-950/90 hover:bg-red-800 border border-red-500/60 text-red-400 hover:text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
                                  title="حذف الصورة واستعادة الصورة الافتراضية"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white text-sm truncate">{leader.name}</h4>
                                <div className="text-xs text-cyan-400 font-medium truncate mt-0.5">
                                  {leader.role}
                                </div>
                                <span
                                  className={`inline-block font-mono text-[10px] px-2 py-0.5 rounded-md mt-1.5 border ${
                                    isPresident
                                      ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                                      : leader.tier === 'executive'
                                      ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                                      : 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                                  }`}
                                >
                                  {isPresident
                                    ? '👑 رئيس النادي'
                                    : leader.tier === 'executive'
                                    ? '🏛️ الهيئة الإدارية'
                                    : '⚡ رئيس لجنة تنفيذي'}
                                </span>
                              </div>
                            </div>

                            <div className="text-xs text-gray-300 italic bg-white/[0.02] p-2.5 rounded-xl border border-white/5 mb-3 line-clamp-2">
                              "{leader.quote}"
                            </div>

                            <div className="space-y-1 text-xs text-gray-400 mb-3 font-mono">
                              <div className="truncate">
                                <span className="text-gray-500">القسم:</span> {leader.department}
                              </div>
                              <div className="truncate text-[11px] text-gray-400">
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
                              type="button"
                              onClick={() => setViewingLeaderBadge(leader)}
                              className="py-1.5 px-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                              title="عرض وطباعة بطاقة التكليف والاعتماد القيادي"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>بطاقة التكليف 🪪</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditLeader(leader)}
                              className="flex-1 py-1.5 rounded-xl bg-white/[0.05] hover:bg-cyan-400 hover:text-black text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تعديل البطاقة والصورة</span>
                            </button>
                            <button
                              onClick={() => handleDeleteLeader(leader.id, leader.name)}
                              className="p-2 rounded-xl bg-red-950/30 hover:bg-red-950 text-red-400 text-xs transition-colors cursor-pointer"
                              title="حذف القائد"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Certified Committee Taskforce Section */}
                <div className="mt-12 pt-8 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                    <div>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] mb-1.5">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        <span>EXECUTIVE COMMITTEES TASKFORCE // فرق العمل المعتمدة</span>
                      </div>
                      <h4 className="text-base font-bold text-white">كوادر وأعضاء اللجان التنفيذية المعتمدين</h4>
                      <p className="text-xs text-gray-400">
                        الطلبة المقبولون رسمياً في اللجان التنفيذية (فعاليات، علاقات وتدريب، إعلام) مع إمكانية استخراج كروت العضوية الرسمية لكل عضو.
                      </p>
                    </div>

                    <div className="text-xs text-gray-400 font-mono bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                      إجمالي الأعضاء باللجان: <span className="text-cyan-400 font-bold">{applications.filter((a) => a.status === 'تم القبول' && a.targetCommittee && !a.targetCommittee.includes('عامة')).length}</span>
                    </div>
                  </div>

                  {/* Committees Roster */}
                  {['لجنة الفعاليات', 'لجنة العلاقات والتدريب', 'اللجنة الإعلامية'].map((commGroup) => {
                    const isEvt = commGroup.includes('الفعاليات');
                    const isRel = commGroup.includes('العلاقات');
                    const isMed = commGroup.includes('الإعلامية');

                    const members = applications.filter((a) => {
                      if (a.status !== 'تم القبول') return false;
                      const c = a.targetCommittee || '';
                      if (isEvt) return c.includes('فعاليات') || c.includes('events');
                      if (isRel) return c.includes('علاقات') || c.includes('تدريب') || c.includes('training');
                      if (isMed) return c.includes('إعلام') || c.includes('media');
                      return false;
                    });

                    const commTitle = isEvt
                      ? 'لجنة الفعاليات والأنشطة الهندسية ⚡'
                      : isRel
                      ? 'لجنة العلاقات العامة والتدريب 🤝'
                      : 'اللجنة الإعلامية والإنتاج المرئي 🎨';

                    const borderAccent = isEvt
                      ? 'border-cyan-500/30'
                      : isRel
                      ? 'border-blue-500/30'
                      : 'border-purple-500/30';

                    return (
                      <div key={commGroup} className={`mb-6 p-4 sm:p-5 rounded-2xl bg-black/40 border ${borderAccent}`}>
                        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                          <h5 className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{commTitle}</span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 text-gray-300">
                              {members.length} أعضاء
                            </span>
                          </h5>
                          <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
                            {isEvt ? 'EVENTS & HACKATHONS' : isRel ? 'RELATIONS & TRAINING' : 'MEDIA & CONTENT'}
                          </span>
                        </div>

                        {members.length === 0 ? (
                          <div className="py-6 text-center text-xs text-gray-400">
                            لا يوجد أعضاء معتمدين بعد في هذه اللجنة. يمكنك قبول طلبات الانضمام وتعيينهم في اللجان من قسم طلبات الانضمام.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {members.map((member) => (
                              <div
                                key={member.id}
                                className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-400/50 transition-all flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-white truncate max-w-[160px]">
                                      {member.fullName}
                                    </span>
                                    <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                                      {member.studentId}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-gray-300 truncate">{member.major}</div>
                                  <div className="text-[10px] text-gray-400 truncate mb-3">{member.college} — {member.academicYear}</div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    sound.playClick();
                                    setViewingCommitteeApp(member);
                                  }}
                                  className="w-full py-1.5 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>عرض كرت عضو اللجنة 🪪</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                  {/* Card 1: Official Brand Identity & Vision/Mission Form */}
                  <form
                    onSubmit={handleSaveSettings}
                    className="p-6 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <ClubLogo variant="emblem" size="sm" />
                        <div>
                          <h4 className="text-sm font-bold text-white">الهوية الرسمية والرؤية والرسالة (UP Charter)</h4>
                          <p className="text-[11px] text-gray-400">تحديث نصوص الرؤية والرسالة والشعار المعتمد</p>
                        </div>
                      </div>
                      {settingsSavedMsg && (
                        <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 animate-in fade-in">
                          <Check className="w-3.5 h-3.5" />
                          تم الحفظ
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">اسم الجامعة:</label>
                        <input
                          type="text"
                          required
                          value={settings.universityNameAr || ''}
                          onChange={(e) => setSettings({ ...settings, universityNameAr: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">اسم النادي:</label>
                        <input
                          type="text"
                          required
                          value={settings.clubNameAr || ''}
                          onChange={(e) => setSettings({ ...settings, clubNameAr: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">الشعار اللفظي (عربي):</label>
                        <input
                          type="text"
                          required
                          value={settings.sloganAr || ''}
                          onChange={(e) => setSettings({ ...settings, sloganAr: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-emerald-500/30 text-xs text-emerald-300 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1 font-mono">الشعار اللفظي (English):</label>
                        <input
                          type="text"
                          required
                          value={settings.sloganEn || ''}
                          onChange={(e) => setSettings({ ...settings, sloganEn: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-cyan-300 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-emerald-400 mb-1 font-bold">نص الرؤية الرسمية (Vision):</label>
                      <textarea
                        rows={3}
                        required
                        value={settings.vision || ''}
                        onChange={(e) => setSettings({ ...settings, vision: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-emerald-500/40 text-xs text-gray-100 leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-cyan-400 mb-1 font-bold">نص الرسالة الرسمية (Mission):</label>
                      <textarea
                        rows={4}
                        required
                        value={settings.mission || ''}
                        onChange={(e) => setSettings({ ...settings, mission: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-cyan-500/40 text-xs text-gray-100 leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-300 mb-1 font-mono">القيم الجوهرية الخمس (مفصولة بفواصل):</label>
                      <input
                        type="text"
                        required
                        value={(settings.values || []).map((v) => (typeof v === 'string' ? v : v.name)).join(', ')}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            values: e.target.value
                              .split(',')
                              .map((s, idx) => ({
                                id: `val-${idx + 1}`,
                                name: s.trim(),
                                description: '',
                                iconName: 'Award',
                              }))
                              .filter((v) => Boolean(v.name)),
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>حفظ وتحديث الهوية والرؤية والرسالة</span>
                    </button>
                  </form>

                  {/* Card 2: Live Brand Identity & Logo Preview */}
                  <div className="p-6 rounded-2xl bg-[#090d16] border border-white/10 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-sm font-bold text-white">المعاينة الحية للهوية الرسمية</h4>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                          LIVE PREVIEW
                        </span>
                      </div>

                      {/* Official Logo Banner */}
                      <div className="p-4 rounded-xl bg-[#0B2D5B]/40 border border-emerald-500/30 flex items-center justify-between gap-4 mb-4">
                        <ClubLogo variant="horizontal" size="md" />
                        <span className="text-[11px] font-mono text-emerald-300 font-bold px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40">
                          {settings.sloganAr || "هندسة اليوم .. تصنع أثر الغد"}
                        </span>
                      </div>

                      {/* Vision Snippet */}
                      <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 mb-3">
                        <div className="text-[11px] font-bold text-emerald-400 mb-1">الرؤية:</div>
                        <p className="text-xs text-gray-300 leading-relaxed">{settings.vision}</p>
                      </div>

                      {/* Mission Snippet */}
                      <div className="p-3.5 rounded-xl bg-black/40 border border-cyan-500/20 mb-3">
                        <div className="text-[11px] font-bold text-cyan-400 mb-1">الرسالة:</div>
                        <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">{settings.mission}</p>
                      </div>

                      {/* Values Chips */}
                      <div>
                        <div className="text-[11px] font-mono text-gray-400 mb-1.5">القيم الخمس المعتمدة:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(settings.values || []).map((v, idx) => {
                            const vName = typeof v === 'string' ? v : v.name;
                            return (
                              <span
                                key={idx}
                                className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 font-mono"
                              >
                                ★ {vName}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 text-[11px] font-mono text-gray-500 flex justify-between items-center">
                      <span>{settings.universityNameAr || "جامعة فلسطين"}</span>
                      <span>{settings.sloganEn || "ENGINEERING TODAY .. IMPACT TOMORROW"}</span>
                    </div>
                  </div>

                  {/* Card 3: Hero & Texts Card */}
                  <form
                    onSubmit={handleSaveSettings}
                    className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-sm font-bold text-white">نصوص الواجهة الرئيسية (Hero Section)</h4>
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
                      <span>حفظ وتحديث نصوص الهيرو</span>
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

                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs text-gray-300 font-mono flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-amber-400" />
                          <span>صورة نجم الشهر الهندسي:</span>
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1 cursor-pointer transition-all">
                            <Upload className="w-3 h-3" />
                            <span>رفع صورة من جهازك</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onClick={(e) => {
                                (e.target as HTMLInputElement).value = '';
                              }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  processImageFile(
                                    file,
                                    (dataUrl) => {
                                      setSpotlight({ ...spotlight, avatar: dataUrl });
                                      sound.playSuccess();
                                      showToast('تم تحميل صورة نجم الشهر بنجاح');
                                    },
                                    (err) => showToast(err)
                                  );
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setSpotlight({ ...spotlight, avatar: DEFAULT_AVATAR });
                              showToast('تم حذف صورة نجم الشهر وتعيين الصورة الافتراضية');
                            }}
                            className="px-2.5 py-1 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 hover:text-white text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                            title="حذف الصورة الحالية واستعادة النموذج الافتراضي"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                            <span>حذف الصورة (افتراضية)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSpotlightUrlInput(!showSpotlightUrlInput)}
                            className="px-2.5 py-1 rounded-xl bg-white/5 text-gray-300 text-xs flex items-center gap-1 border border-white/10 cursor-pointer"
                          >
                            <LinkIcon className="w-3 h-3" />
                            <span>{showSpotlightUrlInput ? 'إخفاء الرابط' : 'رابط URL'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={spotlight.avatar}
                            alt={spotlight.name}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400/40 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                            }}
                          />
                          <label
                            className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center cursor-pointer shadow-md"
                            title="تغيير الصورة من جهازك"
                          >
                            <Camera className="w-3 h-3" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onClick={(e) => {
                                (e.target as HTMLInputElement).value = '';
                              }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  processImageFile(
                                    file,
                                    (dataUrl) => {
                                      setSpotlight({ ...spotlight, avatar: dataUrl });
                                      sound.playSuccess();
                                      showToast('تم تحميل صورة نجم الشهر بنجاح');
                                    },
                                    (err) => showToast(err)
                                  );
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setSpotlight({ ...spotlight, avatar: DEFAULT_AVATAR });
                              showToast('تم استعادة الصورة الافتراضية');
                            }}
                            className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-red-950/90 hover:bg-red-800 border border-red-500/60 text-red-400 hover:text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
                            title="حذف واستعادة الصورة الافتراضية"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          {showSpotlightUrlInput ? (
                            <input
                              type="url"
                              value={spotlight.avatar}
                              onChange={(e) => setSpotlight({ ...spotlight, avatar: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-mono"
                              placeholder="https://..."
                            />
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {AVATAR_PRESETS.slice(0, 6).map((p, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setSpotlight({ ...spotlight, avatar: p.url });
                                    sound.playClick();
                                  }}
                                  className={`w-7 h-7 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                                    spotlight.avatar === p.url
                                      ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105'
                                      : 'border-white/10 opacity-70 hover:opacity-100'
                                  }`}
                                  title={p.label}
                                >
                                  <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
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

              {/* Direct access to Digital Member ID Card */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setViewingBadgeApp(inspectApp);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>معاينة وإصدار بطاقة العضوية الإلكترونية الرسمية (Digital ID Badge)</span>
                </button>

                {inspectApp.targetCommittee && !inspectApp.targetCommittee.includes('عامة') && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewingCommitteeApp(inspectApp);
                    }}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Award className="w-4 h-4 text-cyan-400" />
                    <span>إصدار بطاقة عضو اللجنة التنفيذية الرسمية ({inspectApp.targetCommittee}) 🪪</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    handleUpdateAppStatus(inspectApp.id, 'تم القبول');
                    showToast(`تم قبول عضوية (${inspectApp.fullName}) بنجاح`);
                    setViewingBadgeApp({ ...inspectApp, status: 'تم القبول' });
                    setInspectApp(null);
                  }}
                  className="flex-1 min-w-[100px] py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>قبول وإصدار البطاقة</span>
                </button>
                <button
                  onClick={() => {
                    handleUpdateAppStatus(inspectApp.id, 'مقابلة مجدولة');
                    showToast(`تم جدولة مقابلة لـ (${inspectApp.fullName})`);
                    setInspectApp(null);
                  }}
                  className="flex-1 min-w-[100px] py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs cursor-pointer"
                >
                  تحديد مقابلة
                </button>
                <button
                  onClick={() => {
                    handleUpdateAppStatus(inspectApp.id, 'مرفوض');
                    showToast(`تم تغيير حالة الطلب إلى (مرفوض)`);
                    setInspectApp(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 hover:bg-amber-900 text-xs cursor-pointer"
                  title="وضع حالة الطلب كمرفوض دون حذفه فوراً"
                >
                  رفض الطلب
                </button>
                <button
                  onClick={() => {
                    handleDeleteApplication(inspectApp.id, inspectApp.fullName);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-red-950/80 border border-red-500/40 text-red-400 hover:bg-red-900 text-xs cursor-pointer flex items-center gap-1.5"
                  title="حذف الطلب نهائياً من قاعدة البيانات"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف نهائي</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Digital Member ID Card Modal (Official UP Engineering Club Pass) */}
        {viewingBadgeApp && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg overflow-y-auto">
            <div className="w-full max-w-md rounded-3xl glass-panel border border-emerald-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(22,163,74,0.3)] relative text-right animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setViewingBadgeApp(null)}
                className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>بطاقة عضوية رقمية معتمدة // CERTIFIED PASS</span>
                </div>
                <h3 className="text-xl font-black text-white">بطاقة العضوية الرسمية</h3>
                <p className="text-xs text-gray-400 mt-1">النادي الهندسي — جامعة فلسطين</p>
              </div>

              {/* The Actual Digital Badge Card */}
              <div
                id="printable-member-badge"
                className="w-full rounded-3xl p-6 bg-gradient-to-b from-[#0c1e38] via-[#081326] to-[#050b14] border-2 border-emerald-500/50 shadow-[0_0_35px_rgba(22,163,74,0.25)] relative overflow-hidden font-mono text-right"
              >
                {/* Decorative Tech Elements */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Badge Top Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                  <div className="flex items-center gap-2.5">
                    <img src="/brand/emblem.png" alt="UP" className="h-9 w-auto object-contain drop-shadow" />
                    <div>
                      <div className="text-xs font-black text-white font-sans">النادي الهندسي</div>
                      <div className="text-[9px] text-gray-400">جامعة فلسطين - UP</div>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      عضو معتمد
                    </span>
                    <div className="text-[9px] text-gray-500 mt-0.5">2026 - 2027</div>
                  </div>
                </div>

                {/* Member Info */}
                <div className="mb-4">
                  <div className="text-[10px] text-gray-400 font-sans">اسم المهندس/ـة:</div>
                  <div className="text-lg font-extrabold text-white font-sans mt-0.5 tracking-wide">
                    {viewingBadgeApp.fullName}
                  </div>
                  <div className="text-xs text-cyan-300 mt-1 font-bold">
                    الرقم الجامعي: {viewingBadgeApp.studentId || 'UP-STUDENT'}
                  </div>
                </div>

                {/* Academic Fields */}
                <div className="space-y-2 p-3 rounded-2xl bg-black/40 border border-white/10 mb-4 text-xs font-sans">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-[11px]">الكلية:</span>
                    <span className="font-bold text-gray-200 text-[11px] text-left truncate max-w-[210px]">{viewingBadgeApp.college}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-[11px]">التخصص:</span>
                    <span className="font-bold text-cyan-300 text-[11px]">{viewingBadgeApp.major}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-[11px]">السنة الدراسية:</span>
                    <span className="font-bold text-gray-300 text-[11px]">{viewingBadgeApp.academicYear}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-white/5">
                    <span className="text-gray-400 text-[11px]">نوع العضوية / الصفة:</span>
                    <span className="font-bold text-emerald-400 text-[11px]">{viewingBadgeApp.targetCommittee}</span>
                  </div>
                </div>

                {/* Verification Barcode & Seal */}
                <div className="pt-3 border-t border-dashed border-white/15 flex items-center justify-between">
                  <div className="text-[9px] text-gray-400 leading-tight">
                    <div className="text-white font-bold mb-0.5">AUTH CODE:</div>
                    <div className="text-cyan-400 font-bold">UP-ENG-{(viewingBadgeApp.id || 'VALID').slice(-8).toUpperCase()}</div>
                    <div className="text-[8px] text-gray-500 mt-1">ISSUED BY UNIVERSITY OF PALESTINE</div>
                  </div>
                  {/* Scannable Verification QR Code */}
                  <div className="p-1 rounded-xl bg-white flex items-center justify-center shadow">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&format=svg&data=${encodeURIComponent(
                        `${window.location.origin}/?verify=${encodeURIComponent(viewingBadgeApp.studentId || viewingBadgeApp.id)}`
                      )}`}
                      alt="Verification QR"
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 mt-6">
                {/* Export Card as PNG Image */}
                <button
                  type="button"
                  onClick={() => {
                    const sId = viewingBadgeApp.studentId || 'ID';
                    exportCardAsImage('printable-member-badge', `UP-Member-Badge-${sId}.png`);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black font-extrabold text-xs cursor-pointer shadow-[0_0_20px_rgba(22,163,74,0.3)] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل البطاقة كصورة رسمية عالية الدقة (PNG) 🖼️</span>
                </button>

                {/* Print or Save as PDF */}
                <button
                  type="button"
                  onClick={() => {
                    printCardAsPdf();
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>طباعة أو حفظ البطاقة كـ PDF 📄</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playSuccess();
                    const text = `🎉 تهانينا يا م. ${viewingBadgeApp.fullName}!\nتم قبول انضمامك رسمياً للنادي الهندسي بجامعة فلسطين.\nنوع العضوية: ${viewingBadgeApp.targetCommittee}\nرقم الاعتماد: UP-ENG-${(viewingBadgeApp.id || 'VALID').slice(-8).toUpperCase()}\nأهلاً بك معنا في صُنع أثر الغد! 🚀`;
                    navigator.clipboard.writeText(text);
                    showToast('تم نسخ رسالة القبول والاعتماد للحافظة بنجاح!');
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-gray-200 font-medium text-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>نسخ رسالة القبول الرسمية (لإرسالها للطالب)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leadership Add/Edit Modal */}
        {showLeaderModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-xl rounded-3xl glass-panel border border-cyan-500/40 p-6 shadow-2xl relative text-right animate-in fade-in duration-150 max-h-[92vh] overflow-y-auto">
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
                <span className="font-mono text-xs text-cyan-400">استوديو القيادات الهندسية</span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {editingLeader ? `تعديل بطاقة: ${editingLeader.name}` : 'إضافة مهندس / قائد جديد'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  يمكنك رفع صورة مباشرة من جهازك أو اختيار نموذج جاهز أو إدخال رابط خارجي.
                </p>
              </div>

              <form onSubmit={handleSaveLeader} className="space-y-4 text-xs">
                {/* Avatar Studio Box with Drag & Drop */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      processImageFile(
                        file,
                        (dataUrl) => {
                          setLeaderForm((prev) => ({ ...prev, avatar: dataUrl }));
                          sound.playSuccess();
                          showToast('تم سحب وإدراج الصورة بنجاح');
                        },
                        (err) => showToast(err)
                      );
                    }
                  }}
                  className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-dashed border-cyan-500/30 hover:border-cyan-400/60 transition-colors relative"
                >
                  {/* Tap-to-Upload Avatar Image */}
                  <div className="relative group/modalAvatar shrink-0">
                    <label
                      className="relative block cursor-pointer"
                      title="انقر لتغيير الصورة مباشرة"
                    >
                      <img
                        src={leaderForm.avatar || DEFAULT_AVATAR}
                        alt="معاينة الصورة"
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)] group-hover/modalAvatar:brightness-90 transition-all"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-cyan-400 text-black shadow-md transition-transform group-hover/modalAvatar:scale-110">
                        <Camera className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onClick={(e) => {
                          (e.target as HTMLInputElement).value = '';
                        }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            processImageFile(
                              file,
                              (dataUrl) => {
                                setLeaderForm((prev) => ({ ...prev, avatar: dataUrl }));
                                sound.playSuccess();
                                showToast('تم تحميل وتحديث الصورة بنجاح');
                              },
                              (err) => showToast(err)
                            );
                          }
                        }}
                      />
                    </label>

                    {/* Delete Photo / Set Default Button on Avatar Preview */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        sound.playClick();
                        setLeaderForm((prev) => ({ ...prev, avatar: DEFAULT_AVATAR }));
                        showToast('تم حذف الصورة واستعادة الصورة الافتراضية');
                      }}
                      className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-red-950/90 hover:bg-red-800 border border-red-500/60 text-red-400 hover:text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
                      title="حذف الصورة الحالية واستعادة الافتراضية"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex-1 text-center sm:text-right space-y-2.5 w-full">
                    <div className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                      <span>صورة البطاقة الشخصية</span>
                      <span className="text-[10px] font-mono text-cyan-400">(اسحب وأفلت أو اختر ملفاً)</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      {/* Upload from device button */}
                      <label className="px-3.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95">
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع صورة من جهازك</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onClick={(e) => {
                            (e.target as HTMLInputElement).value = '';
                          }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              processImageFile(
                                file,
                                (dataUrl) => {
                                  setLeaderForm((prev) => ({ ...prev, avatar: dataUrl }));
                                  sound.playSuccess();
                                  showToast('تم تحميل الصورة بنجاح');
                                },
                                (err) => showToast(err)
                              );
                            }
                          }}
                        />
                      </label>

                      {/* Delete / Reset to Default Avatar Button */}
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setLeaderForm((prev) => ({ ...prev, avatar: DEFAULT_AVATAR }));
                          showToast('تم حذف الصورة واستعادة الصورة الافتراضية');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 hover:text-white text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                        title="حذف الصورة الحالية واستعادة النموذج الافتراضي"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>حذف الصورة (افتراضية)</span>
                      </button>

                      {/* Toggle manual URL input */}
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>{showUrlInput ? 'إخفاء الرابط' : 'رابط URL خارجي'}</span>
                      </button>
                    </div>

                    {/* URL Input if toggled */}
                    {showUrlInput && (
                      <div className="pt-1">
                        <input
                          type="url"
                          placeholder="https://example.com/avatar.jpg"
                          value={leaderForm.avatar || ''}
                          onChange={(e) => setLeaderForm({ ...leaderForm, avatar: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-cyan-500/40 text-white font-mono text-[11px] focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Presets Row */}
                    <div className="pt-2 border-t border-white/5">
                      <div className="text-[10px] text-gray-300 mb-1.5 font-mono flex items-center justify-between">
                        <span className="font-bold text-white">النماذج الافتراضية الجاهزة:</span>
                        <span className="text-[9px] text-cyan-400">انقر لاختيار نموذج افتراضي</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                        {AVATAR_PRESETS.map((p, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setLeaderForm((prev) => ({ ...prev, avatar: p.url }));
                              sound.playClick();
                              showToast(`تم تعيين النموذج الافتراضي: ${p.label}`);
                            }}
                            className={`relative w-8 h-8 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                              leaderForm.avatar === p.url
                                ? 'border-cyan-400 ring-2 ring-cyan-400/60 scale-110 z-10'
                                : 'border-white/10 hover:border-cyan-400/50 opacity-70 hover:opacity-100 hover:scale-105'
                            }`}
                            title={p.label}
                          >
                            <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                            {leaderForm.avatar === p.url && (
                              <div className="absolute inset-0 bg-cyan-500/25 flex items-center justify-center">
                                <Check className="w-3 h-3 text-cyan-300 drop-shadow" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Role Templates */}
                <div className="p-3 rounded-2xl bg-black/30 border border-white/5 space-y-1.5">
                  <div className="text-[11px] text-gray-300 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>تعبئة سريعة حسب الهيكل المعتمد للنادي:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLE_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setLeaderForm((prev) => ({
                            ...prev,
                            role: tmpl.role,
                            tier: tmpl.tier,
                            department: tmpl.department,
                            quote: tmpl.quote,
                          }));
                          setLeaderSkillsInput(tmpl.skills);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${
                          leaderForm.role === tmpl.role
                            ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/50 font-bold'
                            : 'bg-white/[0.03] text-gray-400 hover:text-white border-white/5 hover:border-white/20'
                        }`}
                      >
                        {tmpl.role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name & Role Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">الاسم الكامل:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: م. بدر بن عبدالعزيز المنصور"
                      value={leaderForm.name || ''}
                      onChange={(e) => setLeaderForm({ ...leaderForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">المسمى القيادي / الوظيفي:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: رئيس النادي الهندسي"
                      value={leaderForm.role || ''}
                      onChange={(e) => setLeaderForm({ ...leaderForm, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Tier & Department Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">المستوى التنظيمي (Tier):</label>
                    <select
                      value={leaderForm.tier || 'committee-lead'}
                      onChange={(e) =>
                        setLeaderForm({
                          ...leaderForm,
                          tier: e.target.value as LeaderMember['tier'],
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="executive">الرئاسة والهيئة الإدارية (رئيس، نائب، أمين سر، أمين صندوق)</option>
                      <option value="committee-lead">رئيس لجنة (فعاليات وأنشطة، علاقات وتدريب، إعلامية)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">القسم / اللجنة التابعة:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: رئاسة النادي أو لجنة الفعاليات والأنشطة"
                      value={leaderForm.department || ''}
                      onChange={(e) => setLeaderForm({ ...leaderForm, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-mono">البريد الإلكتروني / الجامعي:</label>
                  <input
                    type="email"
                    required
                    placeholder="leader@up.edu.ps"
                    value={leaderForm.email || ''}
                    onChange={(e) => setLeaderForm({ ...leaderForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-400"
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
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-mono">المهارات والاهتمامات (مفصولة بفواصل):</label>
                  <input
                    type="text"
                    placeholder="القيادة الاستراتيجية, معمارية النظم, إدارة المشاريع"
                    value={leaderSkillsInput}
                    onChange={(e) => setLeaderSkillsInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex gap-2 pt-3 border-t border-white/10">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
                  >
                    {editingLeader ? 'حفظ وتثبيت التعديلات' : 'إضافة القائد فوراً'}
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
                  {/* Coordinator Photo Management */}
                  <div>
                    <label className="block text-gray-400 mb-1.5 font-mono">صورة المنسق الأكاديمي:</label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
                      <img
                        src={editingCollege.coordinator.avatar || DEFAULT_AVATAR}
                        alt="منسق الكلية"
                        className="w-14 h-14 rounded-xl object-cover border border-cyan-500/40 shrink-0 bg-white/5"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                        }}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>رفع صورة من الجهاز</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  processImageFile(
                                    file,
                                    (dataUrl) => {
                                      setEditingCollege({
                                        ...editingCollege,
                                        coordinator: { ...editingCollege.coordinator, avatar: dataUrl },
                                      });
                                      sound.playSuccess();
                                      showToast('تم تحديث صورة المنسق بنجاح');
                                    },
                                    (err) => showToast(err)
                                  );
                                }
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setEditingCollege({
                                ...editingCollege,
                                coordinator: { ...editingCollege.coordinator, avatar: DEFAULT_AVATAR },
                              });
                              showToast('تم استعادة الصورة الافتراضية');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs transition-all cursor-pointer"
                          >
                            حذف واستعادة الافتراضية
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowCollegeUrlInput(!showCollegeUrlInput)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <LinkIcon className="w-3 h-3" />
                            <span>رابط مباشر</span>
                          </button>
                        </div>

                        {showCollegeUrlInput && (
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/..."
                            value={editingCollege.coordinator.avatar}
                            onChange={(e) =>
                              setEditingCollege({
                                ...editingCollege,
                                coordinator: { ...editingCollege.coordinator, avatar: e.target.value },
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-xs"
                          />
                        )}

                        {/* Presets */}
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                          <span className="text-[10px] text-gray-500 font-mono shrink-0">نماذج جاهزة:</span>
                          {AVATAR_PRESETS.slice(0, 5).map((preset, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                setEditingCollege({
                                  ...editingCollege,
                                  coordinator: { ...editingCollege.coordinator, avatar: preset.url },
                                });
                              }}
                              className="w-6 h-6 rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400 shrink-0 cursor-pointer"
                              title={preset.label}
                            >
                              <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
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

        {/* Project Edit Modal */}
        {editingProject && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-2xl rounded-3xl glass-panel border border-cyan-500/30 p-6 shadow-2xl relative text-right animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setEditingProject(null)}
                className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-4">
                <span className="font-mono text-xs text-cyan-400">تعديل دراسة الحالة ومشروع النادي</span>
                <h3 className="text-xl font-bold text-white mt-1">{editingProject.title}</h3>
              </div>

              <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">اسم المشروع:</label>
                    <input
                      type="text"
                      required
                      value={editingProject.title}
                      onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">الوصف المختصر (Tagline):</label>
                    <input
                      type="text"
                      required
                      value={editingProject.tagline}
                      onChange={(e) => setEditingProject({ ...editingProject, tagline: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">التصنيف الهندسي:</label>
                    <select
                      value={editingProject.category}
                      onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    >
                      <option value="software">برمجيات (Software)</option>
                      <option value="ai">ذكاء اصطناعي (AI)</option>
                      <option value="robotics">روبوتات وميكاترونكس</option>
                      <option value="architecture">عمارة وتصميم</option>
                      <option value="civil">هندسة مدنية وبنية</option>
                      <option value="iot">إنترنت الأشياء والنظم</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">الكلية المشرفة:</label>
                    <select
                      value={editingProject.collegeName}
                      onChange={(e) => setEditingProject({ ...editingProject, collegeName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    >
                      <option value="كلية هندسة برمجيات وذكاء اصطناعي">كلية هندسة برمجيات وذكاء اصطناعي</option>
                      <option value="كلية تكنولوجيا المعلومات IT">كلية تكنولوجيا المعلومات IT</option>
                      <option value="كلية الهندسة التطبيقية و التخطيط العمراني">كلية الهندسة التطبيقية و التخطيط العمراني</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">حالة المشروع:</label>
                    <select
                      value={editingProject.status}
                      onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    >
                      <option value="Deployed">مطلق في الإنتاج (Deployed)</option>
                      <option value="Prototyped">نموذج أولي مجرب (Prototyped)</option>
                      <option value="In Testing">قيد الاختبار (In Testing)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">المشكلة والتحدي الهندسي:</label>
                    <textarea
                      rows={2}
                      required
                      value={editingProject.problem}
                      onChange={(e) => setEditingProject({ ...editingProject, problem: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">الحل الهندسي المبتكر:</label>
                    <textarea
                      rows={2}
                      required
                      value={editingProject.solution}
                      onChange={(e) => setEditingProject({ ...editingProject, solution: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-mono">التقنيات والأدوات (مفصولة بفواصل):</label>
                  <input
                    type="text"
                    required
                    value={editingProjectTechStack}
                    onChange={(e) => setEditingProjectTechStack(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-mono">المخطط التدفقي / المعماري (Schematic Flow):</label>
                  <input
                    type="text"
                    required
                    value={editingProject.schematicType}
                    onChange={(e) => setEditingProject({ ...editingProject, schematicType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">رابط العرض الحي (Demo URL):</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={editingProject.demoUrl || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, demoUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">رابط كود المشروع (GitHub URL):</label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={editingProject.githubUrl || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, githubUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-white/10">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer shadow-md transition-all"
                  >
                    حفظ وتحديث بيانات المشروع
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Event Edit Modal */}
        {editingEvent && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-3xl glass-panel border border-cyan-500/30 p-6 shadow-2xl relative text-right animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setEditingEvent(null)}
                className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-4">
                <span className="font-mono text-xs text-cyan-400">تعديل بيانات الفعالية والورشة</span>
                <h3 className="text-xl font-bold text-white mt-1">{editingEvent.title}</h3>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-300 mb-1 font-mono">عنوان الفعالية:</label>
                  <input
                    type="text"
                    required
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">التصنيف:</label>
                    <select
                      value={editingEvent.category}
                      onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    >
                      <option value="Workshop">ورشة عمل (Workshop)</option>
                      <option value="Hackathon">هاكاثون وتحدي برمجي</option>
                      <option value="Site Visit">زيارة ميدانية صناعية</option>
                      <option value="Conference">مؤتمر ولقاء علمي</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">السعة الاستيعابية (عدد المقاعد):</label>
                    <input
                      type="number"
                      required
                      min={5}
                      value={editingEvent.capacity}
                      onChange={(e) => setEditingEvent({ ...editingEvent, capacity: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">التاريخ:</label>
                    <input
                      type="text"
                      required
                      value={editingEvent.date}
                      onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">التوقيت:</label>
                    <input
                      type="text"
                      required
                      value={editingEvent.time}
                      onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">الموقع / القاعة:</label>
                    <input
                      type="text"
                      required
                      value={editingEvent.location}
                      onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-mono">وصف الفعالية وأهدافها:</label>
                  <textarea
                    rows={3}
                    required
                    value={editingEvent.description}
                    onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-mono">المتطلبات المسبقة (مفصولة بفواصل):</label>
                  <input
                    type="text"
                    value={editingEventPrereqs}
                    onChange={(e) => setEditingEventPrereqs(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-3 border-t border-white/10">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer shadow-md transition-all"
                  >
                    حفظ وتحديث بيانات الفعالية
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingEvent(null)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      
        {/* Inspect & Action Complaint Modal */}
        {inspectComplaint && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-xl rounded-3xl glass-panel border border-cyan-500/40 p-6 shadow-2xl relative text-right animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setInspectComplaint(null)}
                className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-bold">
                    {inspectComplaint.ticketNumber}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {new Date(inspectComplaint.createdAt).toLocaleString('ar-EG')}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-2">{inspectComplaint.subject}</h3>
              </div>

              {/* Details box */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 text-xs mb-4">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-gray-400">التصنيف:</span>
                  <span className="font-bold text-white">
                    {inspectComplaint.category === 'complaint'
                      ? '⚠️ شكوى رسمية'
                      : inspectComplaint.category === 'suggestion'
                      ? '💡 مقترح تطوير'
                      : '❓ استفسار عام'}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-gray-400">مقدم الطلب:</span>
                  <span className="font-bold text-white">
                    {inspectComplaint.isAnonymous
                      ? 'فاعل خير / مجهول الهوية (حساب سري)'
                      : inspectComplaint.studentName}
                  </span>
                </div>

                {!inspectComplaint.isAnonymous && (
                  <>
                    {inspectComplaint.studentId && (
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-gray-400">الرقم الجامعي:</span>
                        <span className="font-bold font-mono text-cyan-300">{inspectComplaint.studentId}</span>
                      </div>
                    )}
                    {inspectComplaint.college && (
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-gray-400">الكلية:</span>
                        <span className="font-bold text-gray-200">{inspectComplaint.college}</span>
                      </div>
                    )}
                    {inspectComplaint.email && (
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-gray-400">البريد الإلكتروني:</span>
                        <a href={`mailto:${inspectComplaint.email}`} className="text-cyan-400 underline font-mono">
                          {inspectComplaint.email}
                        </a>
                      </div>
                    )}
                    {inspectComplaint.phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">رقم الهاتف:</span>
                        <span className="font-mono text-gray-200">{inspectComplaint.phone}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Message text */}
              <div className="mb-4">
                <label className="block text-xs font-mono text-gray-400 mb-1.5">نص الشكوى / المقترح:</label>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {inspectComplaint.message}
                </div>
              </div>

              {/* Attached Image Preview from Student if available */}
              {inspectComplaint.attachmentImage && (
                <div className="mb-4 p-3.5 rounded-2xl bg-black/40 border border-white/10">
                  <div className="text-xs font-mono text-cyan-400 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Camera className="w-3.5 h-3.5" />
                      <span>الصورة المرفقة من الطالب (دليل البلاغ):</span>
                    </span>
                    <a
                      href={inspectComplaint.attachmentImage}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-cyan-300 underline font-sans hover:text-cyan-200"
                    >
                      فتح بالحجم الكامل ↗
                    </a>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-black/60 p-2 flex justify-center">
                    <img
                      src={inspectComplaint.attachmentImage}
                      alt="Complaint attachment"
                      className="max-h-64 max-w-full rounded-lg object-contain cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => window.open(inspectComplaint.attachmentImage, '_blank')}
                      title="انقر لفتح الصورة بالحجم الكامل في نافذة جديدة"
                    />
                  </div>
                </div>
              )}

              {/* Admin Action & Notes */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 mb-4 space-y-3">
                <label className="block text-xs font-bold text-cyan-300 font-mono">
                  إجراء الإدارة ورد المتابعة (يظهر للطالب عند تتبع التذكرة):
                </label>
                <textarea
                  rows={3}
                  value={adminResponseNote}
                  onChange={(e) => setAdminResponseNote(e.target.value)}
                  placeholder="سجل هنا الإجراء المتخذ، الرد الرسمي للطالب، أو ملاحظات المتابعة..."
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 leading-relaxed font-sans"
                />

                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-xs text-gray-400 self-center font-mono ml-2">تحديث الحالة إلى:</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateComplaintStatus(inspectComplaint.id, 'pending', adminResponseNote)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      inspectComplaint.status === 'pending'
                        ? 'bg-amber-400 text-black shadow-md'
                        : 'bg-white/5 text-amber-300 hover:bg-amber-950/60 border border-amber-500/30'
                    }`}
                  >
                    قيد المراجعة
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateComplaintStatus(inspectComplaint.id, 'in-progress', adminResponseNote)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      inspectComplaint.status === 'in-progress'
                        ? 'bg-blue-400 text-white shadow-md'
                        : 'bg-white/5 text-blue-300 hover:bg-blue-950/60 border border-blue-500/30'
                    }`}
                  >
                    جاري المتابعة
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateComplaintStatus(inspectComplaint.id, 'resolved', adminResponseNote)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      inspectComplaint.status === 'resolved'
                        ? 'bg-emerald-400 text-black shadow-md'
                        : 'bg-white/5 text-emerald-300 hover:bg-emerald-950/60 border border-emerald-500/30'
                    }`}
                  >
                    تم الحل والمعالجة ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateComplaintStatus(inspectComplaint.id, 'rejected', adminResponseNote)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      inspectComplaint.status === 'rejected'
                        ? 'bg-gray-700 text-white shadow-md'
                        : 'bg-white/5 text-gray-400 hover:bg-gray-900 border border-gray-600'
                    }`}
                  >
                    مرفوض
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateComplaintStatus(inspectComplaint.id, inspectComplaint.status, adminResponseNote);
                    setInspectComplaint(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ الرد وتحديث البيانات</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteComplaint(inspectComplaint.id, inspectComplaint.ticketNumber)}
                  className="px-4 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectComplaint(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Executive Credential Badge Modal for Leaders */}
        {viewingLeaderBadge && (
          <ExecutiveBadgeModal
            isOpen={Boolean(viewingLeaderBadge)}
            leader={viewingLeaderBadge}
            onClose={() => setViewingLeaderBadge(null)}
          />
        )}

        {/* Committee Member Credential Badge Modal */}
        {viewingCommitteeApp && (
          <CommitteeBadgeModal
            isOpen={Boolean(viewingCommitteeApp)}
            app={viewingCommitteeApp}
            onClose={() => setViewingCommitteeApp(null)}
          />
        )}

      </div>
    </div>
  );
};
