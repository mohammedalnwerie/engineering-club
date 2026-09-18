import React, { useState, useEffect, useMemo, useRef } from 'react';
import { dataService } from '../services/dataService';
import { getSupabase, isSupabaseConfigured, SUPABASE_PROJECT_URL } from '../services/supabaseClient';
import { ClubLogo } from './ClubLogo';
import {
  downloadCsv,
  getSecurityAuditLogs,
  logSecurityEvent,
  type SecurityAuditEntry
} from '../utils/security';
import { ExecutiveBadgeModal } from './ExecutiveBadgeModal';
import { CommitteeBadgeModal } from './CommitteeBadgeModal';
import { MembersPanel } from './admin/MembersPanel';
import { EventsPanel } from './admin/EventsPanel';
import { TeamPanel } from './admin/TeamPanel';
import { ActivityPanel } from './admin/ActivityPanel';
import { TrashPanel } from './admin/TrashPanel';
import { Button, SidebarNavItem } from './admin/ui';
import { ActionMenu, useConfirm } from './admin/controls';
import { ApplicationsTable } from './admin/ApplicationsTable';
import { QuickNav, type QuickNavItem } from './admin/QuickNav';
import { LeadershipPanel } from './admin/LeadershipPanel';
import { CollegesPanel } from './admin/CollegesPanel';
import { ContactPanel } from './admin/ContactPanel';
import { TodoPanel } from './admin/TodoPanel';
import { InterviewModal } from './admin/InterviewModal';
import { AssignModal } from './admin/AssignModal';
import { complaintCategoryLabel, COMPLAINT_CATEGORIES, PRIORITY_LABELS } from '../data/complaints';
import {
  fetchMyRole,
  hasFullAccess,
  requestPasswordReset,
  trashContentItem,
  ROLE_LABELS,
  type AdminRole,
} from './admin/adminApi';
import { COMMITTEES, effectiveCommittee, findCommittee } from '../data/committees';
import { downloadCardPng, printCard } from '../utils/cardRenderer';
import { memberCardFor } from '../utils/memberCard';
import { MemberCard } from './MemberCard';
import { AcceptanceDispatchModal } from './AcceptanceDispatchModal';
import { emailService } from '../services/emailService';
import type {
  ProjectCaseStudy,
  StoredApplication,
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
  Menu,
  XCircle,
  Clock,
  Search,
  Database,
  RefreshCw,
  Eye,
  EyeOff,
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
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Printer,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Copy,
  MessageSquare,
  Send,
  Sliders,
  Power,
  Unlock,
  LayoutDashboard,
  Activity,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
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

// Shown in the dashboard when a person has no photo yet
const DEFAULT_AVATAR = '/brand/emblem.png';

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
  },
  {
    role: 'منسق وممثل كلية هندسة برمجيات وذكاء اصطناعي',
    tier: 'college-lead' as const,
    department: 'كلية هندسة برمجيات وذكاء اصطناعي',
    skills: 'تمثيل الكلية, التنسيق الأكاديمي, هندسة البرمجيات والذكاء الاصطناعي',
    quote: 'تمثيل طلبة الكلية والتنسيق الفعّال مع إدارة النادي لإطلاق المبادرات والحلول البرمجية والذكية.'
  },
  {
    role: 'منسق وممثل كلية تكنولوجيا المعلومات IT',
    tier: 'college-lead' as const,
    department: 'كلية تكنولوجيا المعلومات IT',
    skills: 'تمثيل الكلية, إدارة النظم والمعلومات, الوسائط الرقمية والتصميم',
    quote: 'تمثيل طلبة تكنولوجيا المعلومات وتفعيل مشاريع قواعد البيانات والوسائط المتعددة بالأنشطة الجامعية.'
  },
  {
    role: 'منسق وممثل كلية الهندسة التطبيقية والتخطيط العمراني',
    tier: 'college-lead' as const,
    department: 'كلية الهندسة التطبيقية و التخطيط العمراني',
    skills: 'تمثيل الكلية, التصميم المعماري, الهندسة الإنشائية والتخطيط',
    quote: 'تمثيل طلبة الهندسة المعمارية والمدنية وربط الابتكارات العمرانية بمبادرات التطوير وإعادة البناء الذكي.'
  }
];

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const fullAccess = hasFullAccess(adminRole);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(() => {
    try {
      return sessionStorage.getItem('eng_club_admin_setup_password') === '1';
    } catch {
      return false;
    }
  });
  const [setupPassword, setSetupPassword] = useState('');
  const [setupPasswordConfirm, setSetupPasswordConfirm] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSavingSetup, setIsSavingSetup] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(false);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditEntry[]>([]);
  const [currentAdminPass, setCurrentAdminPass] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');
  const [changePassStatus, setChangePassStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [appCommitteeFilter, setAppCommitteeFilter] = useState<string>('الكل');
  const [dispatchModalApp, setDispatchModalApp] = useState<StoredApplication | null>(null);

  type AdminTab =
    | 'overview'
    | 'applications'
    | 'members'
    | 'projects'
    | 'events'
    | 'leadership'
    | 'colleges'
    | 'complaints'
    | 'settings'
    | 'cloud'
    | 'team'
    | 'activity'
    | 'trash'
    | 'contact'
    | 'security';

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // On phones/tablets the expanded sidebar covers the page, so fold it after navigating.
  useEffect(() => {
    if (window.innerWidth < 1024) setIsSidebarCollapsed(true);
  }, [activeTab]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.innerWidth < 1024);

  // Live Data states
  const [applications, setApplications] = useState<StoredApplication[]>([]);
  const [projects, setProjects] = useState<ProjectCaseStudy[]>([]);
  const [leadership, setLeadership] = useState<LeaderMember[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(dataService.getSettings());
  const [spotlight, setSpotlight] = useState<StudentSpotlightData>(dataService.getSpotlight());
  const [recruitmentSettings, setRecruitmentSettings] = useState(() => dataService.getRecruitmentSettings());

  // Complaints & Suggestions state
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [complaintsFilter, setComplaintsFilter] = useState<'all' | 'pending' | 'in-progress' | 'resolved' | 'rejected'>('all');
  const [complaintsCategoryFilter, setComplaintsCategoryFilter] = useState<'all' | ComplaintItem['category']>('all');
  const [complaintsSearch, setComplaintsSearch] = useState('');
  const [inspectComplaint, setInspectComplaint] = useState<ComplaintItem | null>(null);
  const [adminResponseNote, setAdminResponseNote] = useState('');

  // Executive Badge state
  const [viewingLeaderBadge, setViewingLeaderBadge] = useState<LeaderMember | null>(null);
  const [viewingCommitteeApp, setViewingCommitteeApp] = useState<StoredApplication | null>(null);

  // Colleges sub-tab
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);

  // Leadership modal / editing & filtering
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [editingLeader, setEditingLeader] = useState<LeaderMember | null>(null);
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
    avatar: '',
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
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [showRecruitmentControls, setShowRecruitmentControls] = useState(false);
  const [onlyWithPortfolio, setOnlyWithPortfolio] = useState(false);
  const [interviewApp, setInterviewApp] = useState<StoredApplication | null>(null);
  const [assignApp, setAssignApp] = useState<StoredApplication | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [quickNavOpen, setQuickNavOpen] = useState(false);
  const { confirm, confirmDialog } = useConfirm();

  // Selected application for detail modal
  const [inspectApp, setInspectApp] = useState<StoredApplication | null>(null);
  const [assignCommittee, setAssignCommittee] = useState('');
  const [assignRole, setAssignRole] = useState('');

  useEffect(() => {
    if (!inspectApp) return;
    setAssignCommittee(findCommittee(effectiveCommittee(inspectApp))?.name || effectiveCommittee(inspectApp));
    setAssignRole(inspectApp.organizationalRole || '');
  }, [inspectApp?.id]);
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


  // Edit Project & Event States
  const [editingProject, setEditingProject] = useState<ProjectCaseStudy | null>(null);
  const [editingProjectTechStack, setEditingProjectTechStack] = useState<string>('');
  const [showCollegeUrlInput, setShowCollegeUrlInput] = useState(false);

  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [subscribers, setSubscribers] = useState<{ email: string; created_at: string }[]>([]);

  const lastLoadedSettings = useRef<SiteSettings | null>(null);
  const lastLoadedSpotlight = useRef<StudentSpotlightData | null>(null);

  const loadData = () => {
    setApplications(dataService.getApplications());
    setProjects(dataService.getProjects());
    setLeadership(dataService.getLeadership());
    setColleges(dataService.getColleges());
    setMajors(dataService.getMajors());
    // Forms keep unsaved edits: only replace them when they still match what was last loaded.
    const freshSettings = dataService.getSettings();
    setSettings((prev) => {
      const pristine = !lastLoadedSettings.current || JSON.stringify(prev) === JSON.stringify(lastLoadedSettings.current);
      const saved = JSON.stringify(prev) === JSON.stringify(freshSettings);
      if (pristine || saved) {
        lastLoadedSettings.current = freshSettings;
        return freshSettings;
      }
      return prev;
    });
    const freshSpotlight = dataService.getSpotlight();
    setSpotlight((prev) => {
      const pristine = !lastLoadedSpotlight.current || JSON.stringify(prev) === JSON.stringify(lastLoadedSpotlight.current);
      const saved = JSON.stringify(prev) === JSON.stringify(freshSpotlight);
      if (pristine || saved) {
        lastLoadedSpotlight.current = freshSpotlight;
        return freshSpotlight;
      }
      return prev;
    });
    setComplaints(dataService.getComplaints());
    setRecruitmentSettings(dataService.getRecruitmentSettings());
    setSubscribers(dataService.getSubscribers());
  };

  
  const handleUpdateComplaintStatus = (
    id: string,
    newStatus: ComplaintItem['status'],
    notes?: string
  ) => {
    const updated = dataService.updateComplaintStatus(id, newStatus, notes);
    if (updated) {
      setComplaints(dataService.getComplaints());
    setRecruitmentSettings(dataService.getRecruitmentSettings());
      if (inspectComplaint && inspectComplaint.id === id) {
        setInspectComplaint(updated);
      }
      showToast(`تم تحديث حالة البلاغ إلى (${newStatus}) بنجاح`);
    }
  };

  const handleDeleteComplaint = async (id: string, ticket: string) => {
    if (
      await confirm({
        title: `حذف البلاغ (${ticket})؟`,
        message: 'ينتقل إلى سلة المحذوفات لمدة 30 يوماً ويمكن استعادته.',
        confirmLabel: 'حذف',
        danger: true,
      })
    ) {
      dataService.deleteComplaint(id);
      setComplaints(dataService.getComplaints());
    setRecruitmentSettings(dataService.getRecruitmentSettings());
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
      avatar: '',
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
        showToast(`تم تحديث صورة المهندس (${leader.name}) بنجاح`);
      },
      (err) => showToast(err)
    );
  };

  const handleResetLeaderAvatar = async (leader: LeaderMember) => {
    if (
      await confirm({
        title: `حذف صورة (${leader.name})؟`,
        message: 'ترجع الصورة الافتراضية مكانها.',
        confirmLabel: 'حذف الصورة',
        danger: true,
      })
    ) {
      const updated: LeaderMember = { ...leader, avatar: '' };
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
      avatar: leaderForm.avatar || '',
      quote: leaderForm.quote || '',
      email: leaderForm.email || '',
      linkedin: leaderForm.linkedin,
      github: leaderForm.github,
      skills: skillsArray.length > 0 ? skillsArray : ['مهندس مبتكر'],
      hidden: editingLeader?.hidden,
    };

    dataService.saveLeader(saved);
    setLeadership(dataService.getLeadership());
    setColleges(dataService.getColleges());

    // Synchronize matching applicant's organizational role to prevent conflicts
    const matchingApp = applications.find(
      (a) =>
        a.fullName.trim() === saved.name.trim() ||
        (saved.email && a.email.toLowerCase() === saved.email.toLowerCase())
    );
    if (matchingApp && matchingApp.organizationalRole !== saved.role) {
      dataService.updateApplicationAssignment(matchingApp.id, {
        assignedCommittee: saved.department || matchingApp.assignedCommittee || matchingApp.targetCommittee,
        organizationalRole: saved.role,
      });
      setApplications(dataService.getApplications());
    }

    setShowLeaderModal(false);
    setEditingLeader(null);
    showToast(`تم حفظ بيانات المهندس (${saved.name}) بنجاح`);
  };

  const handleDeleteLeader = async (id: string, name: string) => {
    if (
      await confirm({
        title: `حذف عضو الكادر (${name})؟`,
        message: 'ينتقل إلى سلة المحذوفات ويمكن استعادته. لإخفائه عن الموقع فقط استخدم زر العين.',
        confirmLabel: 'حذف',
        danger: true,
      })
    ) {
      const leader = dataService.getLeadership().find((l) => l.id === id);
      if (leader) void trashContentItem('leader', id, `قيادة: ${leader.role}${leader.name ? ` — ${leader.name}` : ''}`, leader);
      dataService.deleteLeader(id);
      setLeadership(dataService.getLeadership());
      setColleges(dataService.getColleges());
      showToast(`تم حذف عضو الكادر (${name})`);
    }
  };

  /** Hides a vacant position from the public page without deleting its card. */
  const handleToggleLeaderVisibility = (leader: LeaderMember) => {
    const updated = { ...leader, hidden: !leader.hidden };
    dataService.saveLeader(updated);
    setLeadership(dataService.getLeadership());
    showToast(updated.hidden ? `تم إخفاء (${leader.role}) عن الموقع` : `تم إظهار (${leader.role}) في الموقع`);
  };

  const handleSaveCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollege) return;
    dataService.saveCollege(editingCollege);
    setColleges(dataService.getColleges());
    setLeadership(dataService.getLeadership());
    showToast(`تم حفظ بيانات (${editingCollege.name}) وتحديث ممثل الكلية`);
    setEditingCollege(null);
  };

  const handleSaveMajor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMajor) return;
    dataService.saveMajor(editingMajor);
    setEditingMajor(null);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.saveSettings(settings);
    setSettingsSavedMsg(true);
    setTimeout(() => setSettingsSavedMsg(false), 3000);
  };

  const handleSaveSpotlight = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.saveSpotlight(spotlight);
    setSpotlightSavedMsg(true);
    setTimeout(() => setSpotlightSavedMsg(false), 3000);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dataService.subscribe(() => {
      loadData();
    });

    const unsubscribeErrors = dataService.subscribeErrors((message) => {
      showToast(`⚠️ ${message}`);
    });

    // Restore an existing admin session (Supabase keeps it in the browser)
    if (isSupabaseConfigured) {
      getSupabase().then(async (supabase) => {
        const { data } = await supabase.auth.getSession();
        if (data.session && (await checkIsAdmin())) {
          setAdminEmail(data.session.user.email || '');
          await applyRole();
          setIsAuthenticated(true);
          await dataService.loadAdminData().catch(() => undefined);
        }
      });
    }

    return () => {
      unsubscribe();
      unsubscribeErrors();
    };
  }, []);

  async function applyRole() {
    const role = await fetchMyRole().catch(() => null);
    setAdminRole(role);
    if (!hasFullAccess(role)) setActiveTab('applications');
  }

  // Keep lists fresh while the dashboard is open (new applications, complaints…)
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setInterval(() => {
      // Don't pull data from under someone who is typing or reading a dialog.
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '');
      const busy = document.querySelector('[role="dialog"], [role="alertdialog"]') !== null;
      if (document.hidden || typing || busy) return;
      void dataService.loadAdminData().catch(() => undefined);
    }, 60_000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  const handleForgotPassword = async () => {
    const email = adminEmail.trim();
    if (!email) {
      setResetMessage('اكتب إيميلك في الخانة أعلاه ثم اضغط «نسيت كلمة المرور؟».');
      return;
    }
    setResetMessage('جاري الإرسال…');
    try {
      const result = await requestPasswordReset(email);
      setResetMessage(result.message);
    } catch (err) {
      setResetMessage(err instanceof Error ? err.message : 'تعذر إرسال رابط إعادة التعيين');
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPassword.length < 8) return setSetupError('كلمة المرور 8 خانات على الأقل');
    if (setupPassword !== setupPasswordConfirm) return setSetupError('كلمتا المرور غير متطابقتين');
    setIsSavingSetup(true);
    setSetupError(null);
    try {
      const { error } = await (await getSupabase()).auth.updateUser({ password: setupPassword });
      if (error) throw error;
      try {
        sessionStorage.removeItem('eng_club_admin_setup_password');
      } catch {
        // ignore
      }
      window.history.replaceState(null, '', window.location.pathname + '#/admin');
      setNeedsPasswordSetup(false);
      showToast('تم حفظ كلمة المرور');
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : 'تعذر حفظ كلمة المرور');
    } finally {
      setIsSavingSetup(false);
    }
  };

  async function checkIsAdmin(): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const supabase = await getSupabase();
    const { data, error } = await supabase.rpc('is_club_admin');
    return !error && data === true;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setAuthError('قاعدة البيانات غير مربوطة (متغيرات Supabase غير معرّفة).');
      return;
    }

    setIsVerifyingAuth(true);
    setAuthError(null);
    try {
      const supabase = await getSupabase();
      const { error } = await supabase.auth.signInWithPassword({ email: adminEmail.trim(), password: passcode });
      if (error) {
        logSecurityEvent('LOGIN_FAILED', `محاولة دخول فاشلة للحساب ${adminEmail.trim()}`);
        setAuthError('الإيميل أو كلمة المرور غير صحيحة.');
        return;
      }

      if (!(await checkIsAdmin())) {
        await supabase.auth.signOut();
        logSecurityEvent('LOGIN_FAILED', `حساب بدون صلاحية مشرف: ${adminEmail.trim()}`);
        setAuthError('هذا الحساب لا يملك صلاحية الإدارة.');
        return;
      }

      logSecurityEvent('LOGIN_SUCCESS', `تسجيل دخول إداري ناجح: ${adminEmail.trim()}`);
      await applyRole();
      setIsAuthenticated(true);
      setPasscode('');
      setAuditLogs(getSecurityAuditLogs());
      await dataService.loadAdminData().catch(() => undefined);
    } finally {
      setIsVerifyingAuth(false);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) await (await getSupabase()).auth.signOut();
    dataService.clearAdminData();
    setAdminRole(null);
    setIsAuthenticated(false);
    setPasscode('');
    showToast('تم تسجيل الخروج من لوحة الإدارة');
  };

  const handleRefreshData = async () => {
    setIsRefreshingData(true);
    try {
      await dataService.loadAdminData();
      showToast('تم تحديث البيانات من قاعدة البيانات');
    } catch (err) {
      showToast(`⚠️ تعذر التحديث: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
    } finally {
      setIsRefreshingData(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminPass !== confirmAdminPass) {
      setChangePassStatus({ message: 'كلمة المرور الجديدة وتأكيدها غير متطابقين.', isError: true });
      return;
    }
    if (newAdminPass.length < 8) {
      setChangePassStatus({ message: 'يجب أن تتكون كلمة المرور الجديدة من 8 خانات على الأقل.', isError: true });
      return;
    }
    if (!isSupabaseConfigured) return;

    const supabase = await getSupabase();
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email;
    if (!email) {
      setChangePassStatus({ message: 'انتهت الجلسة، يرجى تسجيل الدخول من جديد.', isError: true });
      return;
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentAdminPass });
    if (verifyError) {
      setChangePassStatus({ message: 'كلمة المرور الحالية غير صحيحة.', isError: true });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newAdminPass });
    if (error) {
      setChangePassStatus({ message: `تعذر تغيير كلمة المرور: ${error.message}`, isError: true });
      return;
    }

    logSecurityEvent('PASSWORD_CHANGED', `تم تغيير كلمة مرور الحساب ${email}`);
    setChangePassStatus({ message: 'تم تحديث كلمة المرور بنجاح.', isError: false });
    setCurrentAdminPass('');
    setNewAdminPass('');
    setConfirmAdminPass('');
    setAuditLogs(getSecurityAuditLogs());
  };

  // Sections offered by the Ctrl+K jump list (only the ones this role can open).
  const quickNavItems = useMemo<QuickNavItem[]>(() => {
    const items: (QuickNavItem & { needsFullAccess?: boolean })[] = [
      { id: 'overview', label: 'نظرة عامة والتحكم', group: 'العمليات' },
      { id: 'applications', label: 'طلبات الانضمام', group: 'العمليات' },
      { id: 'members', label: 'العضويات والمدفوعات', group: 'العمليات', needsFullAccess: true },
      { id: 'events', label: 'الفعاليات والتسجيل', group: 'العمليات' },
      { id: 'complaints', label: 'صندوق الشكاوى', group: 'العمليات', needsFullAccess: true },
      { id: 'projects', label: 'المشاريع والمبادرات', group: 'محتوى الموقع', needsFullAccess: true },
      { id: 'leadership', label: 'الكادر القيادي', group: 'محتوى الموقع', needsFullAccess: true },
      { id: 'colleges', label: 'الكليات والتخصصات', group: 'محتوى الموقع', needsFullAccess: true },
      { id: 'settings', label: 'الهوية وإعدادات العرض', group: 'الإعدادات', needsFullAccess: true },
      { id: 'cloud', label: 'السحابة والمشتركون', group: 'الإعدادات', needsFullAccess: true },
      { id: 'contact', label: 'روابط التواصل الرسمية', group: 'الإعدادات', needsFullAccess: true },
      { id: 'team', label: 'فريق الإدارة والصلاحيات', group: 'الإعدادات', needsFullAccess: true },
      { id: 'activity', label: 'سجل النشاط', group: 'الإعدادات', needsFullAccess: true },
      { id: 'trash', label: 'سلة المحذوفات', group: 'الإعدادات', needsFullAccess: true },
      { id: 'security', label: 'الأمان وسجل التدقيق', group: 'الإعدادات' },
    ];
    return items
      .filter((i) => !i.needsFullAccess || fullAccess)
      .map(({ id, label, group }) => ({ id, label, group }));
  }, [fullAccess]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickNavOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The applications the list is currently showing (search + both filters).
  const filteredApplications = useMemo(() => {
    const q = appSearch.trim().toLowerCase();
    return applications.filter((app) => {
      const matchesSearch =
        !q ||
        app.fullName.toLowerCase().includes(q) ||
        (app.studentId && app.studentId.toLowerCase().includes(q)) ||
        (app.id && app.id.toLowerCase().includes(q)) ||
        `up-eng-${app.id.slice(-8)}`.toLowerCase().includes(q) ||
        app.major.toLowerCase().includes(q) ||
        app.targetCommittee.toLowerCase().includes(q) ||
        app.email.toLowerCase().includes(q) ||
        // What the student wrote about themselves is searchable too
        (app.skills || []).some((skill) => skill.toLowerCase().includes(q)) ||
        (app.customSkill || '').toLowerCase().includes(q) ||
        (app.personalStatement || '').toLowerCase().includes(q) ||
        (app.organizationalRole || '').toLowerCase().includes(q);
      const matchesStatus = appStatusFilter === 'all' || app.status === appStatusFilter;
      const matchesCommittee = appCommitteeFilter === 'الكل' || effectiveCommittee(app).includes(appCommitteeFilter);
      const matchesPortfolio = !onlyWithPortfolio || Boolean(app.portfolioUrl);
      return matchesSearch && matchesStatus && matchesCommittee && matchesPortfolio;
    });
  }, [applications, appSearch, appStatusFilter, appCommitteeFilter, onlyWithPortfolio]);

  // Drop selected rows that the filters no longer show.
  useEffect(() => {
    setSelectedApps((prev) => {
      const visible = new Set(filteredApplications.map((a) => a.id));
      const next = prev.filter((id) => visible.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [filteredApplications]);

  const toggleAppSelection = (id: string) =>
    setSelectedApps((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAllApps = () =>
    setSelectedApps((prev) => (prev.length === filteredApplications.length ? [] : filteredApplications.map((a) => a.id)));

  const selectedApplications = () => applications.filter((a) => selectedApps.includes(a.id));

  /** Bulk status change — unlike the single-row action it does not open the send-email modal. */
  const applyStatusToSelected = async (status: StoredApplication['status']) => {
    const targets = selectedApplications();
    if (!targets.length) return;
    const label = status === 'تم القبول' ? 'قبول' : status === 'مرفوض' ? 'رفض' : 'تحديد مقابلة لـ';
    const ok = await confirm({
      title: `${label} ${targets.length} طلب؟`,
      message:
        status === 'تم القبول'
          ? 'سيصدر لكل واحد منهم رمز عضو وبطاقة. رسائل القبول تُرسل بعدها من زر «إرسال القبول».'
          : undefined,
      confirmLabel: 'تأكيد',
      danger: status === 'مرفوض',
    });
    if (!ok) return;
    targets.forEach((app) => dataService.updateApplicationStatus(app.id, status));
    setSelectedApps([]);
    showToast(`تم تحديث ${targets.length} طلب`);
  };

  const deleteSelectedApps = async () => {
    const targets = selectedApplications();
    if (!targets.length) return;
    const ok = await confirm({
      title: `حذف ${targets.length} طلب؟`,
      message: 'تنتقل الطلبات إلى سلة المحذوفات لمدة 30 يوماً ويمكن استعادتها.',
      confirmLabel: 'حذف',
      danger: true,
    });
    if (!ok) return;
    targets.forEach((app) => {
      void trashContentItem('application', app.id, `طلب: ${app.fullName}`, app);
      dataService.deleteApplication(app.id);
    });
    setSelectedApps([]);
    showToast(`تم حذف ${targets.length} طلب`);
  };

  const exportApplications = (list: StoredApplication[]) => {
    const headers = [
      'الاسم الكامل', 'الرقم الجامعي', 'الكلية', 'التخصص', 'السنة الدراسية',
      'اللجنة المطلوبة', 'اللجنة المعيّنة', 'المسمى', 'المهارات', 'رابط الأعمال',
      'نبذة الطالب', 'ساعات الالتزام', 'البريد الإلكتروني', 'رقم الهاتف', 'الحالة',
      'موعد المقابلة', 'تاريخ التقديم',
    ];
    const rows = list.map((a) => [
      a.fullName,
      a.studentId,
      a.college,
      a.major,
      a.academicYear,
      a.targetCommittee,
      a.assignedCommittee || '',
      a.organizationalRole || '',
      [...(a.skills || []), a.customSkill].filter(Boolean).join(' / '),
      a.portfolioUrl || '',
      a.personalStatement || '',
      String(a.weeklyCommitmentHours ?? ''),
      a.email,
      a.phone || '',
      a.status,
      a.interviewAt ? new Date(a.interviewAt).toLocaleString('ar-SA') : '',
      a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('ar-SA') : '',
    ]);
    downloadCsv(`UP_Engineering_Club_Applicants_${new Date().toISOString().split('T')[0]}`, headers, rows);
    showToast(`تم تصدير ${list.length} متقدم كملف Excel (CSV)`);
  };

  // Status update
  const handleUpdateAppStatus = (id: string, status: StoredApplication['status']) => {
    dataService.updateApplicationStatus(id, status);
    if (status === 'تم القبول') {
      const found = applications.find((a) => a.id === id);
      if (found) {
        setDispatchModalApp({ ...found, status: 'تم القبول' });
      }
    }
  };

  // Delete single application
  const handleDeleteApplication = async (id: string, name: string) => {
    if (
      await confirm({
        title: `حذف طلب (${name})؟`,
        message: 'ينتقل إلى سلة المحذوفات لمدة 30 يوماً ويمكن استعادته.',
        confirmLabel: 'حذف',
        danger: true,
      })
    ) {
      dataService.deleteApplication(id);
      showToast(`تم حذف طلب (${name}) بنجاح`);
      if (inspectApp?.id === id) {
        setInspectApp(null);
      }
    }
  };

  // Batch delete all rejected applications
  const handleDeleteAllRejected = async () => {
    const rejectedList = applications.filter((a) => a.status === 'مرفوض');
    if (rejectedList.length === 0) return;
    if (
      await confirm({
        title: `حذف كل الطلبات المرفوضة (${rejectedList.length} طلب)؟`,
        message: 'هذا الحذف نهائي ولا تمر الطلبات على سلة المحذوفات.',
        confirmLabel: 'حذف نهائي',
        danger: true,
      })
    ) {
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

  // Edit Project Handlers
  const handleOpenEditProject = (proj: ProjectCaseStudy) => {
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
    showToast(`تم حفظ وتحديث مشروع (${updated.title}) بنجاح`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#08041D] w-screen h-screen overflow-hidden text-right animate-in fade-in duration-200">
      <div
        className="relative w-full h-full flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Branding header — only before signing in; the workspace has its own bar */}
        {!isAuthenticated && (
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-[#08041D]/95 shrink-0">
          <div className="flex items-center gap-3.5">
            <ClubLogo variant="emblem" size="md" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-white text-base">لوحة الإدارة الهندسية المركزية</span>
                <span className="hidden md:inline-flex items-center gap-1 font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-bold">
                  {settings.sloganAr || "هندسة اليوم .. تصنع أثر الغد"}
                </span>
                {isAuthenticated && (
                  <span className="hidden sm:inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    جلسة نشطة
                  </span>
                )}
              </div>
              <div className="font-mono text-xs text-gray-400">
                {settings.universityNameAr || "جامعة فلسطين"} — إدارة المشاريع، الكادر القيادي، الفعاليات، الهوية والرؤية
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isAuthenticated && (
              <button
                onClick={() => void handleLogout()}
                className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-red-950/40 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-300 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تسجيل خروج</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
              title="العودة إلى الموقع الرئيسي"
            >
              <span>← العودة إلى الموقع الرئيسي</span>
            </button>
          </div>
        </div>
        )}

        {confirmDialog}

        {assignApp && (
          <AssignModal
            app={assignApp}
            onClose={() => setAssignApp(null)}
            onSave={(assignment) => {
              dataService.updateApplicationAssignment(assignApp.id, assignment);
              setApplications(dataService.getApplications());
              setLeadership(dataService.getLeadership());
              setColleges(dataService.getColleges());
              showToast(
                `${assignApp.fullName}: ${assignment.assignedCommittee}${
                  assignment.organizationalRole ? ` — ${assignment.organizationalRole}` : ''
                }`
              );
            }}
          />
        )}

        {interviewApp && (
          <InterviewModal
            app={interviewApp}
            onClose={() => setInterviewApp(null)}
            onSave={(interviewAt, timeTbd) => {
              dataService.scheduleInterview(interviewApp.id, interviewAt, timeTbd);
              showToast(
                interviewAt ? `تم حفظ موعد مقابلة ${interviewApp.fullName}` : `تم مسح موعد مقابلة ${interviewApp.fullName}`
              );
            }}
          />
        )}

        <QuickNav
          open={quickNavOpen}
          items={quickNavItems}
          onPick={(id) => setActiveTab(id as AdminTab)}
          onClose={() => setQuickNavOpen(false)}
        />

        {/* Global Toast Notification */}
        {toastMsg && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 text-xs font-mono shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-4 h-4 text-cyan-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {isAuthenticated && needsPasswordSetup && (
          <div className="absolute inset-0 z-[90] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <form onSubmit={handleSetupPassword} className="w-full max-w-sm rounded-3xl glass-panel border border-white/10 p-6 space-y-4 text-right">
              <h3 className="text-xl font-black text-white">عيّن كلمة المرور</h3>
              <p className="text-sm text-gray-400">اختر كلمة مرور لحسابك لتدخل بها إلى لوحة التحكم لاحقاً.</p>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="كلمة المرور (8 خانات على الأقل)"
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-sm"
                dir="ltr"
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="تأكيد كلمة المرور"
                value={setupPasswordConfirm}
                onChange={(e) => setSetupPasswordConfirm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-sm"
                dir="ltr"
              />
              {setupError && <p role="alert" className="text-sm text-red-300">{setupError}</p>}
              <button
                type="submit"
                disabled={isSavingSetup}
                className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 text-black font-bold text-sm cursor-pointer"
              >
                {isSavingSetup ? 'جاري الحفظ…' : 'حفظ كلمة المرور'}
              </button>
            </form>
          </div>
        )}

        {/* Authentication Gate with Cryptographic SHA-256 & Brute-force Lockout */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-16 flex flex-col items-center justify-center text-center my-auto">
            <div className="w-16 h-16 rounded-3xl bg-cyan-950/80 border-2 border-cyan-400/40 text-cyan-400 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,240,255,0.25)]">
              <Lock className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>بوابة المشرفين</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">تسجيل دخول إدارة النادي الهندسي</h3>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md mb-6 leading-relaxed">
              هذه المنطقة مخصصة لمشرفي النادي فقط. سجّل الدخول بحساب المشرف المعتمد في قاعدة البيانات.
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-xs space-y-3.5">
              <input
                type="email"
                required
                autoComplete="username"
                placeholder="البريد الإلكتروني للمشرف"
                value={adminEmail}
                disabled={isVerifyingAuth}
                onChange={(e) => {
                  setAdminEmail(e.target.value);
                  if (authError) setAuthError(null);
                }}
                className="w-full px-4 py-3.5 rounded-xl bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-center text-sm transition-all"
                dir="ltr"
              />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="كلمة المرور"
                value={passcode}
                disabled={isVerifyingAuth}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (authError) setAuthError(null);
                }}
                className="w-full px-4 py-3.5 rounded-xl bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-center text-sm transition-all"
                dir="ltr"
              />

              {authError && (
                <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-400 font-medium">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifyingAuth || !passcode || !adminEmail}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-black bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isVerifyingAuth ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
              </button>
              <button
                type="button"
                onClick={() => void handleForgotPassword()}
                className="w-full text-sm text-gray-400 hover:text-white underline underline-offset-4 cursor-pointer"
              >
                نسيت كلمة المرور؟
              </button>
              {resetMessage && <p role="status" className="text-sm text-cyan-200 text-center leading-relaxed">{resetMessage}</p>}
            </form>
          </div>
        ) : (
          /* Main Authenticated Dashboard with Modern Categorized Sidebar */
          <div className="flex-1 flex overflow-hidden">
            {/* Categorized Sidebar Navigation (Right side in RTL) */}
            {mobileNavOpen && (
              <div
                className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileNavOpen(false)}
                aria-hidden="true"
              />
            )}
            <aside
              onClick={() => setMobileNavOpen(false)}
              className={`fixed md:static inset-y-0 right-0 z-40 md:z-20 w-72 ${
                isSidebarCollapsed ? 'md:w-20' : 'md:w-64 lg:w-72'
              } ${
                mobileNavOpen ? 'translate-x-0' : 'translate-x-full'
              } md:translate-x-0 bg-[#0A0524] border-l border-white/10 flex flex-col justify-between shrink-0 transition-transform md:transition-all duration-300 shadow-2xl select-none`}
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
                {!isSidebarCollapsed ? (
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-mono text-[#3FE7E3] font-bold tracking-wider uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3FE7E3] animate-pulse" />
                      <span>غرفة القيادة والتحكم</span>
                    </div>
                    <div className="text-xs font-black text-white font-sans truncate mt-0.5">
                      النادي الهندسي — UP
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto">
                    <span className="w-2 h-2 rounded-full bg-[#3FE7E3] block animate-pulse" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSidebarCollapsed(!isSidebarCollapsed);
                  }}
                  className="hidden md:inline-flex p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  aria-label={isSidebarCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
                  title={isSidebarCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
                >
                  {isSidebarCollapsed ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Sidebar Navigation Links */}
              <div className="flex-1 overflow-y-auto p-3 space-y-6 no-scrollbar">
                {/* Group 1: Operations & Students */}
                <div>
                  {!isSidebarCollapsed && (
                    <div className="px-3 text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span>العمليات والطلبة</span>
                    </div>
                  )}
                  <nav className="space-y-1">
                    {fullAccess && (
                      <SidebarNavItem
                        active={activeTab === 'overview'}
                        collapsed={isSidebarCollapsed}
                        icon={<LayoutDashboard className="w-4 h-4" />}
                        label="نظرة عامة والتحكم"
                        onClick={() => setActiveTab('overview')}
                      />
                    )}

                    <SidebarNavItem
                      active={activeTab === 'applications'}
                      collapsed={isSidebarCollapsed}
                      icon={<Users className="w-4 h-4" />}
                      label="طلبات الانضمام"
                      badge={
                        applications.filter((a) => a.status === 'قيد المراجعة').length > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
                            {applications.filter((a) => a.status === 'قيد المراجعة').length} جديد
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-slate-500">
                            {applications.length}
                          </span>
                        )
                      }
                      onClick={() => setActiveTab('applications')}
                    />

                    {fullAccess && (
                      <SidebarNavItem
                        active={activeTab === 'members'}
                        collapsed={isSidebarCollapsed}
                        icon={<CreditCard className="w-4 h-4" />}
                        label="العضويات والمدفوعات"
                        onClick={() => setActiveTab('members')}
                      />
                    )}
                  </nav>
                </div>

                {/* Group 2: Leadership & Academics */}
                {fullAccess && (
                  <div>
                    {!isSidebarCollapsed && (
                      <div className="px-3 text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span>الهيكل القيادي والأكاديمي</span>
                      </div>
                    )}
                    <nav className="space-y-1">
                      <SidebarNavItem
                        active={activeTab === 'leadership'}
                        collapsed={isSidebarCollapsed}
                        icon={<Award className="w-4 h-4" />}
                        label="الكادر القيادي والهيكل"
                        badge={<span className="text-xs font-mono text-slate-500">{leadership.length}</span>}
                        onClick={() => setActiveTab('leadership')}
                      />

                      <SidebarNavItem
                        active={activeTab === 'colleges'}
                        collapsed={isSidebarCollapsed}
                        icon={<Building2 className="w-4 h-4" />}
                        label="الكليات والتخصصات"
                        badge={<span className="text-xs font-mono text-slate-500">{colleges.length}</span>}
                        onClick={() => setActiveTab('colleges')}
                      />

                      <SidebarNavItem
                        active={activeTab === 'team'}
                        collapsed={isSidebarCollapsed}
                        icon={<Users className="w-4 h-4" />}
                        label="فريق مسؤولي اللوحة"
                        onClick={() => setActiveTab('team')}
                      />
                    </nav>
                  </div>
                )}

                {/* Group 3: Activities & Content */}
                <div>
                  {!isSidebarCollapsed && (
                    <div className="px-3 text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span>الأنشطة والمحتوى</span>
                    </div>
                  )}
                  <nav className="space-y-1">
                    <SidebarNavItem
                      active={activeTab === 'events'}
                      collapsed={isSidebarCollapsed}
                      icon={<Calendar className="w-4 h-4" />}
                      label="الفعاليات والتسجيل"
                      onClick={() => setActiveTab('events')}
                    />

                    {fullAccess && (
                      <>
                        <SidebarNavItem
                          active={activeTab === 'projects'}
                          collapsed={isSidebarCollapsed}
                          icon={<Layers className="w-4 h-4" />}
                          label="المشاريع والمبادرات"
                          badge={<span className="text-xs font-mono text-slate-500">{projects.length}</span>}
                          onClick={() => setActiveTab('projects')}
                        />

                        <SidebarNavItem
                          active={activeTab === 'complaints'}
                          collapsed={isSidebarCollapsed}
                          icon={<MessageSquare className="w-4 h-4" />}
                          label="صندوق الشكاوى"
                          badge={
                            complaints.filter((c) => c.status === 'pending').length > 0 ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-mono text-xs font-black">
                                {complaints.filter((c) => c.status === 'pending').length}
                              </span>
                            ) : (
                              <span className="text-xs font-mono text-slate-500">{complaints.length}</span>
                            )
                          }
                          onClick={() => setActiveTab('complaints')}
                        />
                      </>
                    )}
                  </nav>
                </div>

                {/* Group 4: System & Governance */}
                {fullAccess && (
                  <div>
                    {!isSidebarCollapsed && (
                      <div className="px-3 text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span>النظام والرقابة</span>
                      </div>
                    )}
                    <nav className="space-y-1">
                      <SidebarNavItem
                        active={activeTab === 'settings'}
                        collapsed={isSidebarCollapsed}
                        icon={<Sparkles className="w-4 h-4" />}
                        label="الهوية وإعدادات العرض"
                        onClick={() => setActiveTab('settings')}
                      />

                      <SidebarNavItem
                        active={activeTab === 'cloud'}
                        collapsed={isSidebarCollapsed}
                        icon={<Database className="w-4 h-4" />}
                        label="السحابة والمشتركون"
                        badge={<span className="text-xs font-mono text-slate-500">{subscribers.length}</span>}
                        onClick={() => setActiveTab('cloud')}
                      />

                      <SidebarNavItem
                        active={activeTab === 'contact'}
                        collapsed={isSidebarCollapsed}
                        icon={<LinkIcon className="w-4 h-4" />}
                        label="روابط التواصل"
                        onClick={() => setActiveTab('contact')}
                      />

                      <SidebarNavItem
                        active={activeTab === 'activity'}
                        collapsed={isSidebarCollapsed}
                        icon={<Clock className="w-4 h-4" />}
                        label="سجل النشاط"
                        onClick={() => setActiveTab('activity')}
                      />

                      <SidebarNavItem
                        active={activeTab === 'trash'}
                        collapsed={isSidebarCollapsed}
                        icon={<Trash2 className="w-4 h-4" />}
                        label="سلة المحذوفات"
                        onClick={() => setActiveTab('trash')}
                      />

                      <SidebarNavItem
                        active={activeTab === 'security'}
                        collapsed={isSidebarCollapsed}
                        icon={<ShieldCheck className="w-4 h-4" />}
                        label="الأمان وسجل التدقيق"
                        onClick={() => {
                          setActiveTab('security');
                          setAuditLogs(getSecurityAuditLogs());
                        }}
                      />
                    </nav>
                  </div>
                )}
              </div>

              {/* Sidebar Footer: Admin Status & Fast Refresh */}
              <div className="p-3 border-t border-white/10 bg-black/40">
                {!isSidebarCollapsed ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">
                            {adminEmail || 'مشرف معتمد'}
                          </div>
                          <div className="text-xs text-emerald-400">{adminRole ? ROLE_LABELS[adminRole] : 'جلسة نشطة'}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isRefreshingData}
                        onClick={() => void handleRefreshData()}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 transition-all cursor-pointer"
                        title="تحديث البيانات من السحابة"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingData ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <button
                      type="button"
                      disabled={isRefreshingData}
                      onClick={() => void handleRefreshData()}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 transition-all cursor-pointer"
                      title="تحديث البيانات"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingData ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                )}
              </div>
            </aside>

            {/* Main Content Workspace */}
            <main className="flex-1 flex flex-col overflow-hidden bg-[#070319]">
              {/* Workspace Top Bar */}
              <div className="flex items-center justify-between px-5 sm:px-8 py-3 border-b border-white/10 bg-black/30 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2.5 font-sans">
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(true)}
                    className="md:hidden p-2 -mr-1 rounded-xl bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                    aria-label="فتح قائمة الأقسام"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <span className="text-gray-400 text-xs hidden sm:inline">لوحة الإدارة</span>
                  <span className="text-gray-600">/</span>
                  <h2 className="text-sm sm:text-base font-extrabold text-white">
                    {activeTab === 'overview' && 'نظرة عامة ومؤشرات القيادة'}
                    {activeTab === 'applications' && 'إدارة طلبات الانضمام للجان'}
                    {activeTab === 'members' && 'العضويات والمدفوعات'}
                    {activeTab === 'team' && 'فريق الإدارة والصلاحيات'}
                    {activeTab === 'activity' && 'سجل النشاط'}
                    {activeTab === 'trash' && 'سلة المحذوفات'}
                    {activeTab === 'projects' && 'المشاريع ودراسات الحالة الهندسية'}
                    {activeTab === 'events' && 'الفعاليات والتسجيل للأعضاء'}
                    {activeTab === 'complaints' && 'صندوق الشكاوى والمقترحات'}
                    {activeTab === 'leadership' && 'الهيكل والكادر القيادي'}
                    {activeTab === 'colleges' && 'الكليات والتخصصات الهندسية'}
                    {activeTab === 'settings' && 'هوية الموقع وإعدادات العرض'}
                    {activeTab === 'cloud' && 'السحابة والمشتركون والنسخ الاحتياطي'}
                    {activeTab === 'contact' && 'روابط التواصل الرسمية'}
                    {activeTab === 'security' && 'الأمان وتغيير كلمة المرور وسجل التدقيق'}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuickNavOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-300 hover:text-white text-xs transition-colors cursor-pointer"
                    aria-label="بحث سريع في أقسام اللوحة"
                  >
                    <Search className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">بحث سريع</span>
                    <span className="hidden lg:inline font-mono text-gray-500">Ctrl K</span>
                  </button>

                  <div className="hidden lg:flex items-center gap-2 font-mono text-xs text-gray-400 bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Supabase Cloud: متصل</span>
                  </div>

                  <button
                    type="button"
                    disabled={isRefreshingData}
                    onClick={() => void handleRefreshData()}
                    aria-label="مزامنة البيانات"
                    title="مزامنة البيانات"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRefreshingData ? 'animate-spin' : ''}`} />
                  </button>

                  {/* Account actions moved up here so the workspace has one bar, not two */}
                  <ActionMenu
                    label="حسابي وإجراءات اللوحة"
                    align="end"
                    items={[
                      {
                        label: 'العودة إلى الموقع',
                        icon: <ArrowLeft className="w-4 h-4 text-cyan-300" />,
                        onClick: onClose,
                      },
                      {
                        label: 'تسجيل الخروج',
                        icon: <LogOut className="w-4 h-4" />,
                        onClick: () => void handleLogout(),
                        danger: true,
                      },
                    ]}
                  />
                </div>
              </div>

              {/* 1. Overview Hub Tab */}
              {activeTab === 'overview' && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
                    {/* Welcome & Fast Recruitment Switch Hero */}
                    <div className="p-6 rounded-3xl bg-gradient-to-r from-[#1A0E42] via-[#120A30] to-[#0A0524] border border-[#7F1AB2]/40 shadow-[0_10px_35px_rgba(127,26,178,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                      <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#3FE7E3]/10 rounded-full blur-3xl pointer-events-none" />
                      
                      <div className="space-y-1.5 relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3FE7E3]/10 border border-[#3FE7E3]/30 text-[#3FE7E3] font-mono text-xs">
                          <Activity className="w-3.5 h-3.5" />
                          <span>غرفة العمليات المركزية // LIVE HUB</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-white">
                          مرحباً بك في لوحة تحكم النادي الهندسي
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-300 font-light max-w-xl leading-relaxed">
                          متابعة وإدارة فورية لطلبات الانضمام، الفعاليات، المشاريع، وصندوق الشكاوى من مكان واحد متصل بالسحابة.
                        </p>
                      </div>

                      {/* Recruitment Quick Switch Card */}
                      <div className="p-4 rounded-2xl bg-black/50 border border-white/10 shrink-0 flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
                        <div>
                          <div className="text-xs text-gray-400 font-mono">حالة استقبال طلبات الانضمام:</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${recruitmentSettings.isGlobalRecruitmentOpen ? 'bg-[#35BC2B] animate-pulse' : 'bg-red-400'}`} />
                            <span className="font-bold text-sm text-white">
                              {recruitmentSettings.isGlobalRecruitmentOpen ? 'التسجيل مفتوح رسمياً' : 'التسجيل مغلق حالياً'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const next = !recruitmentSettings.isGlobalRecruitmentOpen;
                            const updated = {
                              ...recruitmentSettings,
                              isGlobalRecruitmentOpen: next,
                            };
                            setRecruitmentSettings(updated);
                            dataService.saveRecruitmentSettings(updated);
                            showToast(next ? 'تم فتح باب الانضمام رسمياً في الموقع' : 'تم إغلاق باب الانضمام في الموقع مؤقتاً');
                          }}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-md ${
                            recruitmentSettings.isGlobalRecruitmentOpen
                              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40'
                              : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{recruitmentSettings.isGlobalRecruitmentOpen ? 'إغلاق التسجيل' : 'فتح التسجيل الآن'}</span>
                        </button>
                      </div>
                    </div>

                    <TodoPanel
                      applications={applications}
                      complaints={complaints}
                      fullAccess={fullAccess}
                      onNavigate={(tab) => setActiveTab(tab as AdminTab)}
                    />

                    {/* 4 Key Metrics KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* KPI 1: Applications */}
                      <div
                        onClick={() => setActiveTab('applications')}
                        className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-cyan-400/40 transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-400">طلبات الانضمام</span>
                          <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition-transform">
                            <Users className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="text-2xl sm:text-3xl font-black text-white">
                            {applications.length}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">{applications.filter((a) => a.status === 'تم القبول').length} مقبول</span>
                            <span>•</span>
                            <span className="text-amber-400 font-bold">{applications.filter((a) => a.status === 'قيد المراجعة').length} معلق</span>
                          </div>
                        </div>
                        <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-xs text-cyan-400 group-hover:translate-x-[-2px] transition-transform">
                          <span>إدارة الطلبات</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* KPI 2: Complaints & Inquiries */}
                      <div
                        onClick={() => setActiveTab('complaints')}
                        className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-amber-400/40 transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-400">صندوق الشكاوى والمقترحات</span>
                          <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="text-2xl sm:text-3xl font-black text-white">
                            {complaints.length}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                            <span className="text-amber-400 font-bold">
                              {complaints.filter((c) => c.status === 'pending').length} بلاغ بانتظار الرد
                            </span>
                          </div>
                        </div>
                        <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-xs text-amber-400 group-hover:translate-x-[-2px] transition-transform">
                          <span>فتح الصندوق</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* KPI 3: Memberships */}
                      <div
                        onClick={() => setActiveTab('members')}
                        className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-purple-400/40 transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-400">العضويات</span>
                          <div className="p-2.5 rounded-xl bg-purple-950/70 border border-purple-500/30 text-purple-400 group-hover:scale-110 transition-transform">
                            <CreditCard className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="text-2xl sm:text-3xl font-black text-white">
                            {applications.filter((a) => a.status === 'تم القبول' && a.validUntil && new Date(a.validUntil).getTime() > Date.now()).length}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-x-2">
                            <span className="text-emerald-300 font-bold">
                              {applications.filter((a) => a.membershipType === 'semester' && a.validUntil && new Date(a.validUntil).getTime() > Date.now()).length} فصلية
                            </span>
                            <span className="text-red-300">
                              {applications.filter((a) => a.status === 'تم القبول' && a.validUntil && new Date(a.validUntil).getTime() <= Date.now()).length} منتهية
                            </span>
                          </div>
                        </div>
                        <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-xs text-purple-400 group-hover:translate-x-[-2px] transition-transform">
                          <span>العضويات والمدفوعات</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* KPI 4: Cloud Subscribers */}
                      <div
                        onClick={() => setActiveTab('cloud')}
                        className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-emerald-400/40 transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-400">مشتركو النشرة البريدية</span>
                          <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition-transform">
                            <Send className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="text-2xl sm:text-3xl font-black text-white">
                            {subscribers.length}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">قائمة المهندسين المسجلة</span>
                          </div>
                        </div>
                        <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-xs text-emerald-400 group-hover:translate-x-[-2px] transition-transform">
                          <span>السحابة والمشتركون</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* Action Shortcuts & Quick Operations */}
                    <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs font-bold text-gray-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>إجراءات سريعة:</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddProject(true);
                            setActiveTab('projects');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-cyan-400" />
                          <span>إضافة مشروع جديد</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('events')}
                          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-purple-400" />
                          <span>إضافة ورشة / فعالية</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowLeaderModal(true);
                            setActiveTab('leadership');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-400" />
                          <span>إضافة عضو كادر</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const accepted = applications.filter((a) => a.status === 'تم القبول');
                            const headers = ['الاسم الكامل', 'الرقم الجامعي', 'الكلية', 'التخصص', 'السنة الدراسية', 'اللجنة', 'البريد', 'الهاتف', 'الحالة', 'تاريخ التقديم'];
                            const rows = accepted.map((a) => [
                              a.fullName,
                              a.studentId,
                              a.college,
                              a.major,
                              a.academicYear,
                              a.targetCommittee,
                              a.email,
                              a.phone || '',
                              a.status,
                              a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('ar-SA') : '',
                            ]);
                            downloadCsv(`UP-Accepted-Engineers-${new Date().toISOString().slice(0, 10)}`, headers, rows);
                            showToast(`تم تصدير كشف (${accepted.length}) مهندس مقبول بنجاح`);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تصدير المقبولين (CSV)</span>
                        </button>
                      </div>
                    </div>

                    {/* Pending Applications Queue */}
                    <div className="rounded-2xl bg-black/40 border border-white/10 p-5 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <h3 className="text-sm font-bold text-white">آخر طلبات الانضمام المعلقة (تتطلب قراراً)</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('applications')}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>عرض كافة الطلبات ({applications.length})</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {applications.filter((a) => a.status === 'قيد المراجعة').length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-400 font-sans flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                          <div className="font-bold text-white">جميع الطلبات معالجة ومكتملة!</div>
                          <div>لا توجد طلبات انضمام جديدة قيد الانتظار حالياً.</div>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {applications
                            .filter((a) => a.status === 'قيد المراجعة')
                            .slice(0, 4)
                            .map((app) => (
                              <div
                                key={app.id}
                                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-white text-sm">{app.fullName}</span>
                                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                      قيد المراجعة
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-400 flex flex-wrap items-center gap-2">
                                    <span className="text-[#3FE7E3] font-medium">{app.major}</span>
                                    <span>•</span>
                                    <span>الرقم الجامعي: <span className="font-mono text-gray-300">{app.studentId}</span></span>
                                    <span>•</span>
                                    <span className="text-gray-300">اللجنة: {app.targetCommittee}</span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setInspectApp(app)}
                                  className="px-3.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>معاينة واتخاذ قرار</span>
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* System Infrastructure & Security Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                      <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 shrink-0">
                          <Database className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white">قاعدة بيانات Supabase</div>
                          <div className="text-xs text-gray-400 truncate mt-0.5">متصلة وجاهزة للمزامنة السحابية</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 shrink-0">
                          <Send className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white">سيرفر الإيميل (Edge Function)</div>
                          <div className="text-xs text-gray-400 truncate mt-0.5">إرسال القبول عبر Gmail مفعل</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-400 shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white">جلسة المشرف المعتمدة</div>
                          <div className="text-xs text-gray-400 truncate mt-0.5 font-mono">{adminEmail || 'admin-authenticated'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 1: Applications */}
                {activeTab === 'applications' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {/* Recruitment switches, folded away so the list of applicants comes first */}
                <div className="mb-5">
                  <button
                    type="button"
                    onClick={() => setShowRecruitmentControls((v) => !v)}
                    aria-expanded={showRecruitmentControls}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 text-right transition-colors cursor-pointer"
                  >
                    <span
                      className={`p-2 rounded-xl border shrink-0 ${
                        recruitmentSettings.isGlobalRecruitmentOpen
                          ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                          : 'bg-red-950/60 border-red-500/30 text-red-400'
                      }`}
                    >
                      <Sliders className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-white">إعدادات الاستقطاب</span>
                      <span className="block text-xs text-gray-400 mt-0.5">
                        {recruitmentSettings.isGlobalRecruitmentOpen ? 'باب الانضمام مفتوح' : 'باب الانضمام مغلق'}
                        {' · '}
                        {COMMITTEES.filter((c) => recruitmentSettings.committees?.[c.id]?.isOpen === false).length} لجنة مغلقة
                      </span>
                    </span>
                    {showRecruitmentControls ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>
                </div>

                {showRecruitmentControls && (
                <div className="p-5 rounded-2xl bg-black/40 border border-white/10 mb-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${recruitmentSettings.isGlobalRecruitmentOpen ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400' : 'bg-red-950/60 border-red-500/30 text-red-400'}`}>
                        <Sliders className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">إدارة استقطاب اللجان والتسجيل</h4>
                          <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${recruitmentSettings.isGlobalRecruitmentOpen ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'}`}>
                            {recruitmentSettings.isGlobalRecruitmentOpen ? 'الاستقطاب العام: مفتوح' : 'الاستقطاب العام: متوقف'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          التحكم في فتح وإغلاق باب التقديم لكل لجنة بشكل فردي لحماية المقاعد أو إيقاف الاستقطاب بالكامل.
                        </p>
                      </div>
                    </div>

                    {/* Master Global Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !recruitmentSettings.isGlobalRecruitmentOpen;
                        const updated = {
                          ...recruitmentSettings,
                          isGlobalRecruitmentOpen: next,
                        };
                        setRecruitmentSettings(updated);
                        dataService.saveRecruitmentSettings(updated);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow ${recruitmentSettings.isGlobalRecruitmentOpen ? 'bg-red-950/50 hover:bg-red-900/60 border border-red-500/40 text-red-300' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                    >
                      <Power className="w-4 h-4" />
                      <span>{recruitmentSettings.isGlobalRecruitmentOpen ? 'إيقاف استقطاب جميع اللجان مؤقتاً' : 'تفعيل استقطاب اللجان العام'}</span>
                    </button>
                  </div>

                  {/* Committees Recruitment Status Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { id: 'general', name: 'عضوية عامة (عضو بالنادي)', filterKeyword: 'عامة', defaultNotice: 'الاستقطاب مغلق حالياً' },
                      { id: 'events', name: 'لجنة الفعاليات والأنشطة', filterKeyword: 'فعاليات', defaultNotice: 'اكتملت المقاعد المتاحة للفعاليات' },
                      { id: 'training', name: 'لجنة العلاقات والتدريب', filterKeyword: 'تدريب', defaultNotice: 'اكتملت المقاعد المتاحة للتدريب' },
                      { id: 'media', name: 'اللجنة الإعلامية', filterKeyword: 'إعلام', defaultNotice: 'اكتملت المقاعد المتاحة للإعلام' },
                    ].map((comm) => {
                      const commStatus = recruitmentSettings.committees[comm.id] || { isOpen: true };
                      const isCommOpen = recruitmentSettings.isGlobalRecruitmentOpen && commStatus.isOpen !== false;
                      const appCount = applications.filter((a) => a.targetCommittee.includes(comm.filterKeyword) || a.targetCommittee.includes(comm.name)).length;

                      return (
                        <div key={comm.id} className={`p-3.5 rounded-xl border transition-all ${isCommOpen ? 'bg-black/30 border-white/10' : 'bg-red-950/20 border-red-500/30'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white truncate max-w-[130px]">{comm.name}</span>
                            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${isCommOpen ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' : 'bg-red-950/60 text-red-400 border-red-500/30'}`}>
                              {isCommOpen ? 'مفتوح' : 'مغلق'}
                            </span>
                          </div>

                          <div className="text-xs text-gray-400 mb-3 font-mono">
                            المتقدمون: <strong className="text-white">{appCount}</strong> طالب/ة
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const nextStatus = !commStatus.isOpen;
                              const updated = {
                                ...recruitmentSettings,
                                committees: {
                                  ...recruitmentSettings.committees,
                                  [comm.id]: {
                                    ...commStatus,
                                    isOpen: nextStatus,
                                    closedNotice: commStatus.closedNotice || comm.defaultNotice,
                                  },
                                },
                              };
                              setRecruitmentSettings(updated);
                              dataService.saveRecruitmentSettings(updated);
                            }}
                            className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                              isCommOpen
                                ? 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/30 text-amber-300'
                                : 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/30 text-emerald-300'
                            }`}
                          >
                            {isCommOpen ? (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>إيقاف استقطاب اللجنة</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span>فتح باب الاستقطاب</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                )}

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

                    <button
                      type="button"
                      onClick={() => setOnlyWithPortfolio((v) => !v)}
                      aria-pressed={onlyWithPortfolio}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                        onlyWithPortfolio
                          ? 'bg-cyan-400 text-black border-cyan-300'
                          : 'bg-black/40 border-white/10 text-gray-300 hover:text-white'
                      }`}
                    >
                      معهم رابط أعمال
                    </button>

                    <select
                      value={appCommitteeFilter}
                      onChange={(e) => setAppCommitteeFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-cyan-300 focus:outline-none cursor-pointer font-medium"
                    >
                      <option value="الكل">كافة اللجان</option>
                      <option value="فعاليات">لجنة الفعاليات</option>
                      <option value="علاقات">لجنة العلاقات والتدريب</option>
                      <option value="إعلام">اللجنة الإعلامية</option>
                      <option value="عامة">عضوية عامة</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {/* Delete all rejected button if any exist */}
                    {applications.some((a) => a.status === 'مرفوض') && (
                      <Button
                        variant="danger"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={() => void handleDeleteAllRejected()}
                        className="shrink-0"
                      >
                        حذف المرفوضين ({applications.filter((a) => a.status === 'مرفوض').length})
                      </Button>
                    )}

                    <Button
                      icon={<Download className="w-4 h-4" />}
                      onClick={() => exportApplications(filteredApplications)}
                      className="shrink-0"
                    >
                      تصدير Excel (CSV)
                    </Button>
                  </div>
                </div>

                {/* Bulk actions bar — appears once rows are selected */}
                {selectedApps.length > 0 && (
                  <div className="sticky top-0 z-20 mb-4 p-3 rounded-2xl border border-cyan-400/40 bg-[#0C1230]/95 backdrop-blur flex flex-wrap items-center gap-2 shadow-lg">
                    <span className="text-sm font-bold text-white ml-1">محدد: {selectedApps.length}</span>
                    <Button
                      size="sm"
                      variant="success"
                      icon={<CheckCircle className="w-4 h-4" />}
                      onClick={() => void applyStatusToSelected('تم القبول')}
                    >
                      قبول
                    </Button>
                    <Button size="sm" icon={<Clock className="w-4 h-4" />} onClick={() => void applyStatusToSelected('مقابلة مجدولة')}>
                      تحديد مقابلة
                    </Button>
                    <Button size="sm" icon={<XCircle className="w-4 h-4" />} onClick={() => void applyStatusToSelected('مرفوض')}>
                      رفض
                    </Button>
                    <Button
                      size="sm"
                      icon={<Download className="w-4 h-4" />}
                      onClick={() => exportApplications(applications.filter((a) => selectedApps.includes(a.id)))}
                    >
                      تصدير المحدد
                    </Button>
                    <Button size="sm" variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => void deleteSelectedApps()}>
                      حذف
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedApps([])} className="mr-auto">
                      إلغاء التحديد
                    </Button>
                  </div>
                )}

                <ApplicationsTable
                  apps={filteredApplications}
                  selected={selectedApps}
                  onToggle={toggleAppSelection}
                  onToggleAll={toggleAllApps}
                  onInspect={setInspectApp}
                  onDispatch={setDispatchModalApp}
                  onBadge={setViewingBadgeApp}
                  onCommitteeBadge={setViewingCommitteeApp}
                  onStatus={(app, status) => handleUpdateAppStatus(app.id, status)}
                  onSchedule={(app) => setInterviewApp(app)}
                  onAssign={(app) => setAssignApp(app)}
                  onDelete={(app) => void handleDeleteApplication(app.id, app.fullName)}
                />
              </div>
            )}

            {/* Tab 2: Projects Manager */}
            {activeTab === 'projects' && (
              <div className="flex-1 overflow-y-auto p-6">
                {/* Public Website Projects Section Visibility Toggle */}
                <div className="mb-6 p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${settings.showProjectsSection !== false ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400' : 'bg-amber-950/60 border-amber-500/30 text-amber-400'}`}>
                      {settings.showProjectsSection !== false ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>ظهور قسم المشاريع والمبادرات في الموقع الرئيسي:</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono ${settings.showProjectsSection !== false ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'}`}>
                          {settings.showProjectsSection !== false ? 'معروض للزوار' : 'مخفي عن الزوار'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {settings.showProjectsSection !== false
                          ? 'قسم المبادرات والمشاريع معروض حالياً في الصفحة الرئيسية للموقع.'
                          : 'قسم المبادرات والمشاريع مخفي حالياً عن زوار الموقع وقائمته مخفية من شريط التنقل.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...settings,
                        showProjectsSection: settings.showProjectsSection === false ? true : false,
                      };
                      setSettings(updated);
                      dataService.saveSettings(updated);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow ${settings.showProjectsSection !== false ? 'bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                  >
                    {settings.showProjectsSection !== false ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>إخفاء قسم المشاريع من الموقع</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>إظهار قسم المشاريع في الموقع</span>
                      </>
                    )}
                  </button>
                </div>

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
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                            {proj.category.toUpperCase()}
                          </span>
                          <span className="font-mono text-xs text-gray-400">● {proj.status}</span>
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
                          onClick={async () => {
                            if (
                              await confirm({
                                title: `حذف مشروع (${proj.title})؟`,
                                message: 'ينتقل إلى سلة المحذوفات ويمكن استعادته.',
                                confirmLabel: 'حذف',
                                danger: true,
                              })
                            ) {
                              void trashContentItem('project', proj.id, `مشروع: ${proj.title}`, proj);
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
              <div className="flex-1 overflow-y-auto">
                <EventsPanel role={adminRole} showToast={showToast} />
              </div>
            )}

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
                        const headers = ['رقم التذكرة', 'الاسم', 'الرقم الجامعي', 'الكلية', 'التصنيف', 'الأهمية', 'الموضوع', 'الرسالة', 'الحالة', 'تاريخ الإرسال'];
                        const rows = complaints.map((c) => [
                          c.ticketNumber,
                          c.studentName,
                          c.studentId,
                          c.college,
                          complaintCategoryLabel(c.category),
                          PRIORITY_LABELS[c.priority || 'normal'],
                          c.subject,
                          c.message,
                          c.status,
                          c.createdAt ? new Date(c.createdAt).toLocaleDateString('ar-SA') : ''
                        ]);
                        downloadCsv(`UP_Engineering_Club_Complaints_${new Date().toISOString().split('T')[0]}`, headers, rows);
                        showToast('تم تصدير سجل الشكاوى كـ CSV متوافق مع Excel بنجاح');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      title="تصدير الشكاوى إلى جدول إكسل متوافق مع الحروف العربية"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تصدير Excel (CSV)</span>
                    </button>

                    <button
                      onClick={() => {
                        setComplaints(dataService.getComplaints());
    setRecruitmentSettings(dataService.getRecruitmentSettings());
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
                    <div className="text-xs font-mono text-gray-400">إجمالي البلاغات</div>
                    <div className="text-xl font-black text-white mt-0.5">{complaints.length}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30">
                    <div className="text-xs font-mono text-amber-300">قيد المراجعة والانتظار</div>
                    <div className="text-xl font-black text-amber-400 mt-0.5">
                      {complaints.filter((c) => c.status === 'pending').length}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/30">
                    <div className="text-xs font-mono text-blue-300">جاري المتابعة والمعالجة</div>
                    <div className="text-xl font-black text-blue-400 mt-0.5">
                      {complaints.filter((c) => c.status === 'in-progress').length}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                    <div className="text-xs font-mono text-emerald-300">تم الحل والمعالجة</div>
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

                  {/* Category filter — generated from the same list the student form uses */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-xs text-gray-400">
                    <span className="font-mono text-xs text-gray-500">التصنيف:</span>
                    <button
                      onClick={() => setComplaintsCategoryFilter('all')}
                      className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                        complaintsCategoryFilter === 'all' ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      جميع الأنواع
                    </button>
                    {COMPLAINT_CATEGORIES.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setComplaintsCategoryFilter(option.value)}
                        className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                          complaintsCategoryFilter === option.value
                            ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 font-bold'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {option.label} ({complaints.filter((c) => c.category === option.value).length})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Complaints List */}
                <div className="space-y-3">
                  {complaints
                    .slice()
                    .sort((a, b) => {
                      const rank = (c: typeof a) => (c.priority === 'urgent' ? 0 : c.priority === 'medium' ? 1 : 2);
                      return rank(a) - rank(b);
                    })
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
                                className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                                  item.category === 'complaint'
                                    ? 'bg-red-950/60 text-red-300 border-red-500/40'
                                    : item.category === 'suggestion'
                                    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                                    : 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                                }`}
                              >
                                {complaintCategoryLabel(item.category)}
                              </span>

                              {/* Status Badge */}
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
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
                                  ? 'تم الحل والمعالجة'
                                  : 'مرفوض'}
                              </span>

                              {/* Priority Badge */}
                              {item.priority && item.priority !== 'normal' && (
                                <span
                                  className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                                    item.priority === 'urgent'
                                      ? 'bg-red-950/70 text-red-300 border-red-500/50'
                                      : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                                  }`}
                                >
                                  {item.priority === 'urgent' ? 'عاجل' : 'أهمية متوسطة'}
                                </span>
                              )}

                              {/* Photo Attachment Badge */}
                              {item.attachmentImage && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 font-mono">
                                  <Camera className="w-3 h-3 text-cyan-400" />
                                  <span>مرفق صورة</span>
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
                                <span className="text-amber-400/90 font-sans">مُرسل مجهول الهوية (طلب قديم قبل إلغاء الخيار)</span>
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
                              <Button
                                size="sm"
                                variant="danger"
                                icon={<Trash2 className="w-4 h-4" />}
                                onClick={() => void handleDeleteComplaint(item.id, item.ticketNumber)}
                              >
                                حذف
                              </Button>
                            </div>
                          </div>

                          {/* Admin Notes Preview */}
                          {item.adminNotes && (
                            <div className="mt-2.5 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs">
                              <div className="font-bold text-cyan-300 font-mono text-xs mb-1">
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
              <LeadershipPanel
                leadership={leadership}
                applications={applications}
                onAdd={handleOpenAddLeader}
                onEdit={handleOpenEditLeader}
                onDelete={(id, name) => void handleDeleteLeader(id, name)}
                onToggleVisibility={handleToggleLeaderVisibility}
                onAvatarUpload={handleDirectAvatarUpload}
                onResetAvatar={(leader) => void handleResetLeaderAvatar(leader)}
                onViewLeaderBadge={setViewingLeaderBadge}
                onViewCommitteeCard={setViewingCommitteeApp}
              />
            )}

            {/* Tab: Colleges & Majors Management */}
            {activeTab === 'colleges' && (
              <CollegesPanel
                colleges={colleges}
                majors={majors}
                onEditCollege={setEditingCollege}
                onEditMajor={setEditingMajor}
                onViewCoordinatorBadge={(col) => {
                  const matchingLeader = leadership.find(
                    (l) =>
                      l.id === `lead-col-${col.id}` ||
                      (l.tier === 'college-lead' && (l.department.includes(col.shortName) || l.role.includes(col.shortName)))
                  ) || {
                    id: `lead-col-${col.id}`,
                    name: col.coordinator.name === 'ممثلو الكلية في النادي' ? '' : col.coordinator.name,
                    role:
                      col.coordinator.role && col.coordinator.role !== 'لجنة التنسيق والمتابعة الطلابية'
                        ? col.coordinator.role
                        : `منسق وممثل ${col.name}`,
                    tier: 'college-lead' as const,
                    department: col.name,
                    avatar: col.coordinator.avatar || '',
                    quote: `تمثيل طلبة ${col.name} في النادي الهندسي والتنسيق المستمر للأنشطة والمبادرات.`,
                    email: col.coordinator.email || '',
                    skills: ['تمثيل الكلية', 'التنسيق الأكاديمي', 'المبادرات الطلابية'],
                  };
                  setViewingLeaderBadge(matchingLeader);
                }}
              />
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

                {/* Master Public Website Sections Visibility Hub */}
                <div className="p-6 rounded-2xl bg-black/50 border border-[#7F1AB2]/40 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#7F1AB2]/20 text-[#3FE7E3]">
                        <Eye className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">التحكم في ظهور وإخفاء أقسام الموقع الرئيسي</h4>
                        <p className="text-xs text-gray-400">إظهار أو إخفاء الأقسام التفاعلية في الموقع وشريط التنقل فورياً بنقرة زر واحدة</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#381C4A] text-[#3FE7E3] border border-[#3FE7E3]/30 w-fit">
                      SECTIONS VISIBILITY
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Section 1: Events */}
                    <div className={`p-4 rounded-2xl border transition-all ${settings.showEventsSection !== false ? 'bg-black/40 border-emerald-500/30' : 'bg-black/60 border-amber-500/30'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">أجندة الفعاليات والورش</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${settings.showEventsSection !== false ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                          {settings.showEventsSection !== false ? 'معروض' : 'مخفي'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                        جدول ورش العمل والفعاليات والهاكاثونات الهندسية ورابطها بالقائمة.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...settings,
                            showEventsSection: settings.showEventsSection === false ? true : false,
                          };
                          setSettings(updated);
                          dataService.saveSettings(updated);
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow ${settings.showEventsSection !== false ? 'bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                      >
                        {settings.showEventsSection !== false ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>إخفاء القسم</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>إظهار القسم</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Section 2: Projects */}
                    <div className={`p-4 rounded-2xl border transition-all ${settings.showProjectsSection !== false ? 'bg-black/40 border-emerald-500/30' : 'bg-black/60 border-amber-500/30'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">المشاريع والمبادرات</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${settings.showProjectsSection !== false ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                          {settings.showProjectsSection !== false ? 'معروض' : 'مخفي'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                        المبادرات والمشاريع قيد التأسيس ومراحل تطوير النماذج للطلبة.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...settings,
                            showProjectsSection: settings.showProjectsSection === false ? true : false,
                          };
                          setSettings(updated);
                          dataService.saveSettings(updated);
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow ${settings.showProjectsSection !== false ? 'bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                      >
                        {settings.showProjectsSection !== false ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>إخفاء القسم</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>إظهار القسم</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Section 3: Live Feed & Engineer of the Month */}
                    <div className={`p-4 rounded-2xl border transition-all ${settings.showLiveFeedSection !== false ? 'bg-black/40 border-emerald-500/30' : 'bg-black/60 border-amber-500/30'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">مهندس الشهر والتحديثات</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${settings.showLiveFeedSection !== false ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                          {settings.showLiveFeedSection !== false ? 'معروض' : 'مخفي'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                        قسم "كُن أنت مهندس الشهر" وبطاقة الترشيح ونبض وتحديثات النادي الحية.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...settings,
                            showLiveFeedSection: settings.showLiveFeedSection === false ? true : false,
                          };
                          setSettings(updated);
                          dataService.saveSettings(updated);
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow ${settings.showLiveFeedSection !== false ? 'bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                      >
                        {settings.showLiveFeedSection !== false ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>إخفاء القسم</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>إظهار القسم</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
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
                          <p className="text-xs text-gray-400">تحديث نصوص الرؤية والرسالة والشعار المعتمد</p>
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
                  <div className="p-6 rounded-2xl bg-[#08041D] border border-white/10 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-sm font-bold text-white">المعاينة الحية للهوية الرسمية</h4>
                        </div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                          LIVE PREVIEW
                        </span>
                      </div>

                      {/* Official Logo Banner */}
                      <div className="p-4 rounded-xl bg-[#381C4A]/40 border border-[#7F1AB2]/30 flex items-center justify-between gap-4 mb-4">
                        <ClubLogo variant="horizontal" size="md" />
                        <span className="text-xs font-mono text-emerald-300 font-bold px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40">
                          {settings.sloganAr || "هندسة اليوم .. تصنع أثر الغد"}
                        </span>
                      </div>

                      {/* Vision Snippet */}
                      <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 mb-3">
                        <div className="text-xs font-bold text-emerald-400 mb-1">الرؤية:</div>
                        <p className="text-xs text-gray-300 leading-relaxed">{settings.vision}</p>
                      </div>

                      {/* Mission Snippet */}
                      <div className="p-3.5 rounded-xl bg-black/40 border border-cyan-500/20 mb-3">
                        <div className="text-xs font-bold text-cyan-400 mb-1">الرسالة:</div>
                        <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">{settings.mission}</p>
                      </div>

                      {/* Values Chips */}
                      <div>
                        <div className="text-xs font-mono text-gray-400 mb-1.5">القيم الخمس المعتمدة:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(settings.values || []).map((v, idx) => {
                            const vName = typeof v === 'string' ? v : v.name;
                            return (
                              <span
                                key={idx}
                                className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 font-mono"
                              >
                                ★ {vName}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 text-xs font-mono text-gray-500 flex justify-between items-center">
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
                              setSpotlight({ ...spotlight, avatar: '' });
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
                            src={spotlight.avatar || DEFAULT_AVATAR}
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
                              setSpotlight({ ...spotlight, avatar: '' });
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
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1 font-mono">عدد المشاريع:</label>
                        <input
                          type="number"
                          value={spotlight.projectsCount}
                          onChange={(e) => setSpotlight({ ...spotlight, projectsCount: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1 font-mono">عدد الجوائز:</label>
                        <input
                          type="number"
                          value={spotlight.awardsCount}
                          onChange={(e) => setSpotlight({ ...spotlight, awardsCount: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1 font-mono">الأوراق المنشورة:</label>
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
                    كل المحتوى والطلبات والشكاوى محفوظة في قاعدة بيانات Supabase ومشتركة بين جميع الزوار والمشرفين.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4 max-w-xl">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <span className={isSupabaseConfigured ? 'text-emerald-300' : 'text-red-300'}>
                      {isSupabaseConfigured ? 'مربوط بقاعدة بيانات Supabase' : 'غير مربوط — متغيرات البيئة غير معرّفة'}
                    </span>
                  </div>
                  {SUPABASE_PROJECT_URL && (
                    <div className="text-xs font-mono text-gray-400 break-all" dir="ltr">{SUPABASE_PROJECT_URL}</div>
                  )}
                  <p className="text-xs text-gray-400 leading-relaxed">
                    تُضبط بيانات الربط من ملف <span className="font-mono">.env.local</span> محلياً، ومن إعدادات Environment Variables في Vercel للموقع المنشور.
                  </p>
                  <button
                    onClick={() => void handleRefreshData()}
                    disabled={isRefreshingData}
                    className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingData ? 'animate-spin' : ''}`} />
                    <span>تحديث البيانات من قاعدة البيانات</span>
                  </button>
                </div>

                {/* Newsletter subscribers */}
                <div className="p-6 rounded-2xl bg-black/40 border border-white/10 max-w-xl space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-bold text-white">المشتركون في النشرة البريدية ({subscribers.length})</h4>
                    <button
                      type="button"
                      disabled={subscribers.length === 0}
                      onClick={() =>
                        downloadCsv(
                          `newsletter_subscribers_${new Date().toISOString().split('T')[0]}`,
                          ['البريد الإلكتروني', 'تاريخ الاشتراك'],
                          subscribers.map((s) => [s.email, new Date(s.created_at).toLocaleString('ar')])
                        )
                      }
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      <span>تصدير CSV</span>
                    </button>
                  </div>
                  {subscribers.length === 0 ? (
                    <p className="text-sm text-gray-400">لا يوجد مشتركون بعد.</p>
                  ) : (
                    <ul className="max-h-60 overflow-y-auto divide-y divide-white/5 text-sm">
                      {subscribers.map((s) => (
                        <li key={s.email} className="py-2 flex items-center justify-between gap-3">
                          <span className="text-gray-200 truncate" dir="ltr">{s.email}</span>
                          <span className="text-xs text-gray-500 shrink-0">{new Date(s.created_at).toLocaleDateString('ar')}</span>
                        </li>
                      ))}
                    </ul>
                  )}
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
                      onClick={async () => {
                        if (
                          await confirm({
                            title: 'استعادة المحتوى الأصلي للموقع؟',
                            message:
                              'يُحذف كل تعديلات المحتوى (الإعدادات، المشاريع، الفعاليات، القيادة...) ويرجع الموقع لمحتواه الأصلي. الطلبات والشكاوى لا تُحذف.',
                            confirmLabel: 'استعادة',
                            danger: true,
                          })
                        ) {
                          dataService.resetDefaults();
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

            {/* Tab: Security & System Audit */}
            {activeTab === 'members' && fullAccess && (
              <div className="flex-1 overflow-y-auto">
                <MembersPanel showToast={showToast} />
              </div>
            )}

            {activeTab === 'contact' && fullAccess && (
              <div className="flex-1 overflow-y-auto">
                <ContactPanel showToast={showToast} />
              </div>
            )}

            {activeTab === 'team' && fullAccess && (
              <div className="flex-1 overflow-y-auto">
                <TeamPanel myRole={adminRole} myEmail={adminEmail} showToast={showToast} />
              </div>
            )}

            {activeTab === 'activity' && fullAccess && (
              <div className="flex-1 overflow-y-auto">
                <ActivityPanel />
              </div>
            )}

            {activeTab === 'trash' && fullAccess && (
              <div className="flex-1 overflow-y-auto">
                <TrashPanel showToast={showToast} onRestored={() => void dataService.loadAdminData().catch(() => undefined)} />
              </div>
            )}

            {activeTab === 'security' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-mono text-xs mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>الأمان والحساب</span>
                  </div>
                  <h3 className="text-base font-bold text-white">إعدادات الأمان وسجل النظام والرقابة</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    تغيير كلمة مرور حسابك، ومراجعة سجل عمليات الدخول على هذا الجهاز.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card 1: Change Master Password */}
                  <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Lock className="w-4 h-4 text-cyan-400" />
                        <span>تغيير كلمة مرور حسابك</span>
                      </h4>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                        SUPABASE AUTH
                      </span>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">كلمة المرور الحالية:</label>
                        <input
                          type="password"
                          required
                          placeholder="أدخل كلمة المرور الحالية..."
                          value={currentAdminPass}
                          onChange={(e) => setCurrentAdminPass(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1">كلمة المرور الجديدة (8 خانات على الأقل):</label>
                        <input
                          type="password"
                          required
                          placeholder="كلمة المرور الجديدة..."
                          value={newAdminPass}
                          onChange={(e) => setNewAdminPass(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1">تأكيد كلمة المرور الجديدة:</label>
                        <input
                          type="password"
                          required
                          placeholder="أعد إدخال كلمة المرور الجديدة..."
                          value={confirmAdminPass}
                          onChange={(e) => setConfirmAdminPass(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                        />
                      </div>

                      {changePassStatus && (
                        <div
                          className={`p-3 rounded-xl border text-xs ${
                            changePassStatus.isError
                              ? 'bg-red-950/50 border-red-500/40 text-red-300'
                              : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                          }`}
                        >
                          {changePassStatus.message}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>حفظ كلمة المرور الجديدة</span>
                      </button>
                    </form>
                  </div>

                </div>

                {/* Card 3: Security & Activity Audit Log */}
                <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>سجل الرقابة والعمليات الأمنية (Security Audit Trail)</span>
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        يوثق النظام تلقائياً عمليات الدخول، المحاولات الفاشلة، وتصدير البيانات لحماية خصوصية النادي.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAuditLogs(getSecurityAuditLogs());
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 text-cyan-400" />
                      <span>تحديث السجل</span>
                    </button>
                  </div>

                  {auditLogs.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500 font-mono">
                      لا توجد عمليات أمنية مسجلة حتى الآن.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400 font-mono text-xs">
                            <th className="pb-2">الوقت والتاريخ</th>
                            <th className="pb-2">نوع العملية</th>
                            <th className="pb-2">تفاصيل العملية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300 font-sans">
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-white/[0.02]">
                              <td className="py-2.5 font-mono text-xs text-gray-400 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString('ar-SA')}
                              </td>
                              <td className="py-2.5 whitespace-nowrap">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded font-mono text-xs font-bold ${
                                    log.action === 'LOGIN_SUCCESS'
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                      : log.action === 'LOGIN_FAILED'
                                      ? 'bg-red-950 text-red-400 border border-red-500/30'
                                      : log.action === 'PASSWORD_CHANGED'
                                      ? 'bg-blue-950 text-blue-400 border border-blue-500/30'
                                      : 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                                  }`}
                                >
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-2.5 text-xs text-gray-200">{log.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      )}

        {/* Inspect Applicant Detail Modal */}
        {inspectApp && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl glass-panel border border-cyan-500/30 p-6 shadow-2xl relative text-right animate-in fade-in duration-150">
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
                      <span key={i} className="px-2 py-0.5 rounded bg-cyan-950/60 text-xs text-cyan-300 border border-cyan-500/30">
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

              {/* Assignment: committee + title printed on the committee card */}
              <div className="mb-5 p-4 rounded-2xl bg-white/[0.03] border border-emerald-500/25 space-y-3">
                <div>
                  <div className="text-sm font-bold text-white">التعيين في النادي</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    طلب الانضمام إلى: <span className="text-gray-200">{inspectApp.targetCommittee}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-xs text-gray-300 mb-1">اللجنة</span>
                    <select
                      value={assignCommittee}
                      onChange={(e) => setAssignCommittee(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-emerald-400 focus:outline-none text-sm text-white"
                    >
                      {!findCommittee(assignCommittee) && assignCommittee && <option value={assignCommittee}>{assignCommittee}</option>}
                      {COMMITTEES.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="block text-xs text-gray-300 mb-1">المسمى على الكرت</span>
                    <input
                      type="text"
                      list="committee-role-suggestions"
                      value={assignRole}
                      maxLength={40}
                      onChange={(e) => setAssignRole(e.target.value)}
                      placeholder="اختر أو اكتب مسمى..."
                      className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-emerald-400 focus:outline-none text-sm text-white"
                    />
                    <datalist id="committee-role-suggestions">
                      {(findCommittee(assignCommittee)?.roles || []).map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </label>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(findCommittee(assignCommittee)?.roles || []).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAssignRole(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition-colors cursor-pointer ${
                        assignRole === r
                          ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                          : 'bg-white/[0.03] border-white/10 text-gray-300 hover:border-emerald-400/40'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {(assignRole.includes('رئيس') || assignRole.includes('ممثل') || assignRole.includes('منسق') || assignRole.includes('صندوق') || assignRole.includes('نائب')) && (
                  <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span>سيتم إدراج الطالب تلقائياً في الكادر القيادي والهيكل التنظيمي للنادي عند الحفظ ✓</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={
                    assignCommittee === effectiveCommittee(inspectApp) && assignRole.trim() === (inspectApp.organizationalRole || '')
                  }
                  onClick={() => {
                    const assignment = { assignedCommittee: assignCommittee, organizationalRole: assignRole.trim() };
                    dataService.updateApplicationAssignment(inspectApp.id, assignment);
                    setInspectApp({ ...inspectApp, ...assignment });
                    setApplications(dataService.getApplications());
                    setLeadership(dataService.getLeadership());
                    setColleges(dataService.getColleges());
                    showToast(`تم حفظ تعيين (${inspectApp.fullName}) وتحديث الكادر القيادي بنجاح`);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  حفظ التعيين
                </button>
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

                {findCommittee(effectiveCommittee(inspectApp))?.id !== 'general' && effectiveCommittee(inspectApp) && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewingCommitteeApp(inspectApp);
                    }}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Award className="w-4 h-4 text-cyan-400" />
                    <span>بطاقة عضو اللجنة ({effectiveCommittee(inspectApp)})</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/10">
                {inspectApp.status === 'تم القبول' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDispatchModalApp(inspectApp);
                    }}
                    className="w-full mb-2 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600/30 via-teal-600/30 to-cyan-600/30 hover:from-emerald-600/40 hover:to-cyan-600/40 border border-emerald-500/40 text-emerald-300 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>إرسال رسالة القبول والبطاقة للطالب (إيميل / واتساب)</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    handleUpdateAppStatus(inspectApp.id, 'تم القبول');
                    showToast(`تم قبول عضوية (${inspectApp.fullName}) بنجاح`);
                    setDispatchModalApp({ ...inspectApp, status: 'تم القبول' });
                    setInspectApp(null);
                  }}
                  className="flex-1 min-w-[100px] py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>قبول وإرسال الإشعار</span>
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
            <div className="w-full max-w-md rounded-3xl glass-panel border border-emerald-500/40 p-5 sm:p-7 shadow-[0_0_50px_rgba(22,163,74,0.3)] relative text-right animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setViewingBadgeApp(null)}
                className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs mb-1.5 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>بطاقة العضوية الرقمية</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">بطاقة العضوية الرسمية</h3>
                <p className="text-xs text-gray-400 mt-0.5">النادي الهندسي — جامعة فلسطين</p>
              </div>

              {/* The Actual Digital Badge Card (Vertical Portrait Ratio) */}
              <MemberCard {...memberCardFor(viewingBadgeApp, { revealCode: true })} />

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 mt-6">
                {/* Export Card as PNG Image */}
                <button
                  type="button"
                  onClick={() => {
                    const sId = viewingBadgeApp.studentId || 'ID';
                    void downloadCardPng(memberCardFor(viewingBadgeApp, { revealCode: true }), `UP-Member-Card-${sId}.png`);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black font-extrabold text-xs cursor-pointer shadow-[0_0_20px_rgba(22,163,74,0.3)] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <Download className="w-4 h-4" />
                  <span>حفظ البطاقة كصورة</span>
                </button>

                {/* Print or Save as PDF */}
                <button
                  type="button"
                  onClick={() => {
                    void printCard(memberCardFor(viewingBadgeApp, { revealCode: true }));
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>طباعة / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDispatchModalApp(viewingBadgeApp);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600/40 via-teal-600/40 to-cyan-600/40 hover:from-emerald-600/50 hover:to-cyan-600/50 border border-emerald-500/40 text-emerald-300 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>إرسال البطاقة للطالب عبر واتساب / الإيميل</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const { message } = emailService.formatWhatsAppMessage(viewingBadgeApp);
                    navigator.clipboard.writeText(message);
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
                        setLeaderForm((prev) => ({ ...prev, avatar: '' }));
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
                      <span className="text-xs font-mono text-cyan-400">(اسحب وأفلت أو اختر ملفاً)</span>
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
                          setLeaderForm((prev) => ({ ...prev, avatar: '' }));
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
                          className="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-cyan-500/40 text-white font-mono text-xs focus:outline-none"
                        />
                      </div>
                    )}

                  </div>
                </div>

                {/* Quick Role Templates */}
                <div className="p-3 rounded-2xl bg-black/30 border border-white/5 space-y-1.5">
                  <div className="text-xs text-gray-300 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>تعبئة سريعة حسب الهيكل المعتمد للنادي:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLE_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setLeaderForm((prev) => ({
                            ...prev,
                            role: tmpl.role,
                            tier: tmpl.tier,
                            department: tmpl.department,
                            quote: tmpl.quote,
                          }));
                          setLeaderSkillsInput(tmpl.skills);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
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

                {/* Select from Accepted Applicants to populate leader card automatically */}
                {applications.filter((a) => a.status === 'تم القبول').length > 0 && (
                  <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-1.5">
                    <label className="block text-xs font-bold text-cyan-300 font-mono">
                      ربط بطالب مقبول في النادي (تعبئة تلقائية للبيانات):
                    </label>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const student = applications.find((a) => a.id === e.target.value);
                        if (student) {
                          setLeaderForm((prev) => ({
                            ...prev,
                            name: student.fullName,
                            email: student.email || prev.email,
                            department: prev.department || student.targetCommittee || student.college,
                          }));
                          if (student.skills && student.skills.length > 0) {
                            setLeaderSkillsInput(student.skills.join(', '));
                          }
                          showToast(`تم استيراد وتعبئة بيانات الطالب (${student.fullName})`);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white font-mono text-xs focus:outline-none"
                    >
                      <option value="">-- اختر طالباً مقبولاً لربطه بهذا المقعد القيادي --</option>
                      {applications
                        .filter((a) => a.status === 'تم القبول')
                        .map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.fullName} ({student.major} — {student.targetCommittee || 'عضوية عامة'})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

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
                      <option value="college-lead">ممثل كلية (يمثل كليته في النادي)</option>
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
                  <div className="font-bold text-cyan-400 font-mono text-xs flex items-center justify-between">
                    <span>بيانات المنسق الأكاديمي وممثل الكلية في النادي:</span>
                  </div>

                  <div className="text-xs text-cyan-300 bg-cyan-950/60 p-2.5 rounded-xl border border-cyan-500/30 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span>تعديل منسق الكلية يُزامن تلقائياً بطاقة ممثل الكلية في «الكادر القيادي» ويصدر بطاقة التكليف المعتمدة فور الحفظ.</span>
                  </div>

                  {/* Pick Accepted Student from this college */}
                  {applications.filter((a) => a.status === 'تم القبول' && (a.college.includes(editingCollege.shortName) || editingCollege.name.includes(a.college))).length > 0 && (
                    <div className="space-y-1">
                      <label className="block text-gray-400">اختيار طالب مقبول لتمثيل الكلية (تعبئة فورية):</label>
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const picked = applications.find((a) => a.id === e.target.value);
                          if (picked) {
                            setEditingCollege({
                              ...editingCollege,
                              coordinator: {
                                ...editingCollege.coordinator,
                                name: picked.fullName,
                                email: picked.email || editingCollege.coordinator.email,
                                title: `منسق وممثل ${editingCollege.name}`,
                              },
                            });
                            showToast(`تم تعيين الطالب (${picked.fullName}) ممثلاً للكلية`);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white font-mono text-xs focus:outline-none"
                      >
                        <option value="">-- اختر طالباً من طلبة الكلية المقبولين --</option>
                        {applications
                          .filter((a) => a.status === 'تم القبول' && (a.college.includes(editingCollege.shortName) || editingCollege.name.includes(a.college)))
                          .map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.fullName} ({student.major} — {student.studentId})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

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
                              setEditingCollege({
                                ...editingCollege,
                                coordinator: { ...editingCollege.coordinator, avatar: '' },
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
            revealCode
            isOpen={Boolean(viewingCommitteeApp)}
            app={viewingCommitteeApp}
            onClose={() => setViewingCommitteeApp(null)}
          />
        )}

        {/* Acceptance Dispatch Modal (WhatsApp / Email / Direct Link) */}
        {dispatchModalApp && (
          <AcceptanceDispatchModal
            isOpen={Boolean(dispatchModalApp)}
            app={dispatchModalApp}
            onClose={() => setDispatchModalApp(null)}
            onViewBadge={(a) => setViewingBadgeApp(a)}
          />
        )}

      </div>
    </div>
  );
};
