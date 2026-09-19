import React, { useEffect, useState } from 'react';
import {
  Home,
  LogOut,
  RefreshCw,
  Download,
  Printer,
  CalendarDays,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Upload,
  Award,
  Crown,
  Lightbulb,
  Send,
  Check,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  KeyRound,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MemberLoginForm } from './MemberLoginForm';
import { PasswordCard } from './PasswordCard';
import { PhotoCard } from './PhotoCard';
import { MemberCard } from '../MemberCard';
import {
  memberService,
  daysLeft,
  formatArabicDate,
  eventWhenLabel,
  EVENT_TYPE_LABELS,
  type MemberProfile,
} from '../../services/memberService';
import { dataService } from '../../services/dataService';
import { memberCardFor, executiveCardFor, committeeCardFor } from '../../utils/memberCard';
import { downloadCardPng, printCard } from '../../utils/cardRenderer';
import { compressImage } from '../../utils/image';
import { findCommittee, effectiveCommittee, isExecutivePosition } from '../../data/committees';
import type { StoredApplication, LeaderMember } from '../../types';

const DEFAULT_AVATAR = '/brand/emblem.png';

interface MemberPortalProps {
  onClose: () => void;
  onJoin: () => void;
}

/** Shapes the member profile like an application so the shared card builders can use it. */
const asApplication = (p: MemberProfile): StoredApplication => {
  const isExec =
    p.membershipType === 'executive' ||
    isExecutivePosition({
      organizationalRole: p.organizationalRole || undefined,
      assignedCommittee: p.assignedCommittee || undefined,
      targetCommittee: p.targetCommittee || undefined,
      membershipType: p.membershipType || undefined,
    });

  return {
    id: p.id,
    fullName: p.fullName,
    studentId: p.studentId,
    email: p.email,
    phone: '',
    academicYear: p.academicYear || '',
    college: p.college || '',
    major: p.major || '',
    skills: [],
    personalStatement: '',
    targetCommittee: p.targetCommittee || '',
    assignedCommittee: p.assignedCommittee || undefined,
    organizationalRole: p.organizationalRole || undefined,
    photoUrl: p.photoUrl || undefined,
    weeklyCommitmentHours: 0,
    status: 'تم القبول',
    submittedAt: '',
    memberCode: p.memberCode,
    membershipType: isExec ? 'executive' : (p.membershipType || undefined),
    validUntil: isExec ? undefined : (p.validUntil || undefined),
    membershipState: isExec ? (p.membershipState === 'suspended' ? 'suspended' : 'semester') : p.membershipState,
    suspendedAt: p.membershipState === 'suspended' ? (p.acceptedAt || 'suspended') : undefined,
  };
};

export const MemberPortal: React.FC<MemberPortalProps> = ({ onClose, onJoin }) => {
  const [profile, setProfile] = useState<MemberProfile | null>(memberService.currentProfile);
  const [isLoading, setIsLoading] = useState(memberService.isLoggedIn && !memberService.currentProfile);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Card tab state: 'standard' | 'executive' | 'committee'
  const [activeCardTab, setActiveCardTab] = useState<'standard' | 'executive' | 'committee'>('standard');
  const [isExporting, setIsExporting] = useState(false);

  // Inline Suggestion Accordion
  const [isSuggestExpanded, setIsSuggestExpanded] = useState(false);
  const [suggestTopic, setSuggestTopic] = useState('');
  const [suggestDetails, setSuggestDetails] = useState('');
  const [suggestContact, setSuggestContact] = useState('');
  const [suggestSubmitted, setSuggestSubmitted] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestSending, setSuggestSending] = useState(false);

  useEffect(() => {
    const unsub = memberService.subscribe(() => setProfile(memberService.currentProfile));
    if (memberService.isLoggedIn) {
      memberService
        .refresh()
        .catch((err) => setLoadError(err instanceof Error ? err.message : 'تعذر تحميل بيانات الحساب'))
        .finally(() => setIsLoading(false));
    }
    return unsub;
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      await memberService.refresh();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'تعذر التحديث');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !suggestTopic.trim()) return;
    setSuggestSending(true);
    setSuggestError(null);
    try {
      await dataService.submitComplaint({
        studentName: profile.fullName,
        studentId: profile.studentId,
        email: profile.email,
        phone: suggestContact.trim() || undefined,
        college: profile.college || profile.major || 'كلية الهندسة وتكنولوجيا المعلومات',
        category: 'suggestion',
        subject: '[اقتراح ورشة / فعالية من عضو] ' + suggestTopic.trim(),
        message: `مقدم المقترح: ${profile.fullName} (عضو مسجل - الرقم الجامعي: ${profile.studentId}) | الكلية/التخصص: ${profile.major || profile.college || '—'} | تفاصيل المقترح: ${suggestDetails.trim()}`,
        isAnonymous: false,
      });
      setSuggestSubmitted(true);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 }, colors: ['#10B981', '#06B6D4', '#F59E0B'] });
      setTimeout(() => {
        setIsSuggestExpanded(false);
        setSuggestSubmitted(false);
        setSuggestTopic('');
        setSuggestDetails('');
        setSuggestContact('');
      }, 2500);
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : 'تعذر إرسال المقترح');
    } finally {
      setSuggestSending(false);
    }
  };

  // Determine leadership match
  const leaders = dataService.getLeadership();
  const cleanName = (profile?.fullName || '').trim().replace(/^م\.\s*/, '');
  const matchedLeader: LeaderMember | null = profile
    ? leaders.find(
        (l) =>
          l.tier === 'executive' &&
          ((cleanName && l.name.trim().replace(/^م\.\s*/, '') === cleanName) ||
            (profile.email && l.email && l.email.toLowerCase() === profile.email.toLowerCase()))
      ) ||
      (profile.organizationalRole &&
      (profile.organizationalRole.includes('رئيس') ||
        profile.organizationalRole.includes('مسؤول') ||
        profile.organizationalRole.includes('نائب') ||
        profile.organizationalRole.includes('أمين صندوق') ||
        profile.organizationalRole.includes('إدارية'))
        ? {
            id: 'exec-leader-' + profile.studentId,
            name: profile.fullName,
            role: profile.organizationalRole,
            tier: 'executive' as const,
            department: 'الهيئة الإدارية والتنفيذية',
            avatar: profile.photoUrl || '',
            email: profile.email || '',
            quote: 'خدمة طلبة كلية الهندسة وتكنولوجيا المعلومات وقيادة مبادرات التميز.',
            skills: ['القيادة الهندسية', 'التنسيق التنفيذي'],
          }
        : null)
    : null;

  // Build card options
  const appData = profile ? asApplication(profile) : null;
  const standardCard = appData ? memberCardFor(appData, { revealCode: true }) : null;
  const hasExecutiveCard = Boolean(matchedLeader);
  const executiveCard = matchedLeader
    ? executiveCardFor(matchedLeader, {
        studentId: profile?.studentId,
        major: profile?.major ?? undefined,
      })
    : null;
  const isSpecializedCommittee =
    appData &&
    findCommittee(effectiveCommittee(appData))?.id !== 'general' &&
    !effectiveCommittee(appData).includes('عامة');
  const committeeCard = isSpecializedCommittee && appData ? committeeCardFor(appData, { revealCode: true }) : null;

  // Tabs for switching cards in-page without modals!
  const cardTabs: { id: 'standard' | 'executive' | 'committee'; label: string; icon: React.ReactNode }[] = [
    { id: 'standard', label: 'بطاقة العضوية الرسمية', icon: <CreditCard className="w-4 h-4" /> },
  ];
  if (hasExecutiveCard) {
    cardTabs.push({ id: 'executive', label: 'بطاقة التكليف القيادي', icon: <Crown className="w-4 h-4 text-amber-400" /> });
  }
  if (isSpecializedCommittee) {
    cardTabs.push({ id: 'committee', label: 'بطاقة عضو اللجنة', icon: <Award className="w-4 h-4 text-cyan-400" /> });
  }

  // Determine active card
  const activeCard =
    activeCardTab === 'executive' && executiveCard
      ? executiveCard
      : activeCardTab === 'committee' && committeeCard
      ? committeeCard
      : standardCard;

  const handleDownloadActiveCard = async () => {
    if (!activeCard || !profile) return;
    setIsExporting(true);
    try {
      const cleanFileName = profile.fullName.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '-');
      const prefix =
        activeCardTab === 'executive'
          ? 'UP-Executive-Badge'
          : activeCardTab === 'committee'
          ? 'UP-Committee-Badge'
          : 'UP-Member-Card';
      await downloadCardPng(activeCard, `${prefix}-${cleanFileName}.png`);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintActiveCard = () => {
    if (!activeCard) return;
    void printCard(activeCard);
  };

  return (
    <div className="min-h-screen bg-[#08041D] text-[#F3F4F6] relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Standalone Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#08041D]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/brand/emblem.png" alt="شعار النادي الهندسي" className="w-10 h-10 object-contain drop-shadow" />
            <div>
              <div className="font-extrabold text-white text-sm sm:text-base leading-tight">النادي الهندسي — جامعة فلسطين</div>
              <div className="text-[11px] sm:text-xs text-cyan-400 font-medium">بوابة الأعضاء والخدمات الرقمية (حسابي)</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile && (
              <button
                type="button"
                onClick={handleRefresh}
                title="تحديث البيانات"
                aria-label="تحديث البيانات"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Home className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">العودة للرئيسية</span>
              <span className="sm:hidden">الرئيسية</span>
            </button>
            {profile && (
              <button
                type="button"
                onClick={() => memberService.logout()}
                className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-200 border border-red-800/40 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="relative z-10 py-6 sm:py-10 px-4 sm:px-6">
        {!memberService.isLoggedIn || !profile ? (
          /* Logged-out State: Centered Hero Login Card */
          <div className="min-h-[75vh] flex items-center justify-center">
            <div className="w-full max-w-md rounded-3xl glass-panel border border-cyan-500/30 p-6 sm:p-9 shadow-2xl space-y-6 text-right relative overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 mb-3 shadow-inner">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black text-white">تسجيل الدخول إلى حسابي</h2>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  أدخل رقمك الجامعي وكلمة المرور الخاصة بك، أو رمز البطاقة الأول إذا كان هذا أول دخول لك.
                </p>
              </div>

              <MemberLoginForm onSuccess={setProfile} />

              <div className="pt-4 border-t border-white/10 text-center space-y-2">
                <div className="text-xs text-gray-400">لست عضواً مسجلاً بعد في النادي الهندسي؟</div>
                <button
                  type="button"
                  onClick={onJoin}
                  className="text-xs text-cyan-300 hover:text-cyan-200 font-bold underline underline-offset-4 cursor-pointer"
                >
                  قدّم طلب انضمام جديد الآن ←
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Logged-in State: Comprehensive Full-Page Member Dashboard */
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
            {/* Top Member Overview Banner */}
            <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 relative overflow-hidden shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="relative shrink-0">
                    <img
                      src={profile.photoUrl || DEFAULT_AVATAR}
                      alt={profile.fullName}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-cyan-500/40 bg-white/5 shadow-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                      }}
                    />
                    {profile.membershipType === 'executive' && (
                      <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black p-1 rounded-full shadow" title="كادر قيادي">
                        <Crown className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h1 className="text-xl sm:text-2xl font-black text-white">{profile.fullName}</h1>
                      {profile.membershipType === 'executive' ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-400" /> كادر قيادي
                        </span>
                      ) : profile.assignedCommittee && !profile.assignedCommittee.includes('عامة') ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-cyan-400" /> {profile.assignedCommittee}
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> عضوية عامة معتمدة
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>{profile.college} — {profile.major}</span>
                      <span className="text-gray-500">•</span>
                      <span className="font-mono text-cyan-400">ID: {profile.studentId}</span>
                      {profile.memberCode && (
                        <>
                          <span className="text-gray-500">•</span>
                          <span className="font-mono text-gray-400 text-xs">كود البطاقة: {profile.memberCode}</span>
                        </>
                      )}
                    </div>
                    {profile.organizationalRole && (
                      <div className="text-xs text-amber-300/90 font-medium mt-1">
                        المسمى المعتمد: {profile.organizationalRole}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {loadError && (
                <div role="alert" className="mt-4 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm">
                  {loadError}
                </div>
              )}

              {/* Password Setting Advisory Banner */}
              {!profile.passwordSet && (
                <div className="mt-5 p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
                  <div className="flex items-start gap-2.5 leading-relaxed">
                    <span className="text-lg shrink-0">🛡️</span>
                    <div>
                      <strong className="text-white block sm:inline">حسابك مسجّل حالياً برمز البطاقة فقط.</strong> يُنصح بإنشاء كلمة مرور شخصية لحماية خصوصية حسابك ومنع الوصول إليه من خلال بيانات البطاقة.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('security-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs whitespace-nowrap self-start sm:self-center cursor-pointer hover:bg-amber-300 transition-colors shadow-sm"
                  >
                    عيّن كلمة المرور الآن
                  </button>
                </div>
              )}
            </div>

            {/* In-Page Digital Card Showcase (No Modals Over Modals!) */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-cyan-400" />
                    <span>البطاقات الرقمية الرسمية المعتمدة</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    استعرض بطاقتك الرسمية مباشرة مع إمكانية حفظها كصورة أو طباعتها فوراً.
                  </p>
                </div>

                {/* Segmented In-Page Card Switcher (Tabs) */}
                {cardTabs.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-black/50 border border-white/10 self-start sm:self-center shadow-inner">
                    {cardTabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveCardTab(tab.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeCardTab === tab.id
                            ? 'bg-cyan-500 text-black shadow-md'
                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* The Active Card Showcase Container */}
              <div className="p-6 sm:p-10 rounded-3xl glass-panel border border-white/10 flex flex-col items-center justify-center space-y-6 shadow-2xl">
                {activeCard && (
                  <div className="w-full max-w-sm transition-all duration-300 animate-in zoom-in-95">
                    <MemberCard {...activeCard} />
                  </div>
                )}

                {profile.membershipState === 'suspended' ? (
                  <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs text-center leading-relaxed max-w-md">
                    ⚠️ البطاقة معلّقة إدارياً. تم تعطيل حفظ الصورة والطباعة لحين تسوية وضع العضوية مع إدارة النادي.
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-sm">
                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={handleDownloadActiveCard}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isExporting ? 'جاري التحميل…' : 'حفظ الكرت كصورة'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintActiveCard}
                      className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/15 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      <span>طباعة</span>
                    </button>
                  </div>
                )}

                <p className="text-xs text-gray-500 text-center max-w-md">
                  البطاقة الرقمية للتحقق الميداني والأكاديمي من عضويتك عبر رمز الـ QR المعتمد. الدخول إلى حسابك بكلمة المرور الخاصة بك.
                </p>
              </div>
            </section>

            {/* Dashboard 2-Column Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Column (2 spans): Membership + Events + Proposal */}
              <div className="lg:col-span-2 space-y-6">
                {/* Membership Validity & Semester Renewal */}
                <MembershipPanel profile={profile} />

                {/* Events & Registrations */}
                <RegistrationsPanel profile={profile} onBrowseEvents={onClose} />

                {/* Inline Propose Workshop or Event Section */}
                <section className="p-5 sm:p-6 rounded-3xl glass-panel border border-white/10 hover:border-emerald-500/30 transition-all space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                        <Lightbulb className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white">اقترح ورشة عمل أو مبادرة هندسية</h3>
                        <p className="text-xs text-gray-400">شاركنا أفكارك التدريبية لتنظيمها بالتعاون مع لجان النادي.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsSuggestExpanded(!isSuggestExpanded)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>{isSuggestExpanded ? 'إغلاق النموذج' : 'كتابة مقترح'}</span>
                      {isSuggestExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {isSuggestExpanded && (
                    <div className="pt-3 border-t border-white/10 animate-in fade-in duration-200">
                      {!suggestSubmitted ? (
                        <form onSubmit={handleSuggestSubmit} className="space-y-4 text-right">
                          <div>
                            <label className="block text-xs font-medium text-gray-200 mb-1">موضوع الورشة أو الفعالية:</label>
                            <input
                              type="text"
                              required
                              placeholder="مثال: ورشة إدارة المشاريع الهندسية Agile، أو الذكاء الاصطناعي في التصميم..."
                              value={suggestTopic}
                              onChange={(e) => setSuggestTopic(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-200 mb-1">تفاصيل أو محاور مقترحة:</label>
                            <textarea
                              rows={3}
                              placeholder="اكتب نبذة عن المحاور أو الفئة المستهدفة أو مقترح لمدرب معين..."
                              value={suggestDetails}
                              onChange={(e) => setSuggestDetails(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none resize-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-200 mb-1">رقم جوال أو وسيلة للتواصل المباشر (اختياري):</label>
                            <input
                              type="text"
                              placeholder="059XXXXXXX"
                              value={suggestContact}
                              onChange={(e) => setSuggestContact(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none"
                            />
                          </div>

                          {suggestError && (
                            <div role="alert" className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm leading-relaxed">
                              {suggestError}
                            </div>
                          )}

                          <div className="pt-2 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setIsSuggestExpanded(false)}
                              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors cursor-pointer"
                            >
                              إلغاء
                            </button>
                            <button
                              type="submit"
                              disabled={suggestSending}
                              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs sm:text-sm font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{suggestSending ? 'جاري الإرسال…' : 'إرسال المقترح'}</span>
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="text-center py-6">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                            <Check className="w-6 h-6" />
                          </div>
                          <h4 className="text-lg font-bold text-white mb-1">تم استلام مقترحك بنجاح!</h4>
                          <p className="text-xs text-gray-300 font-light">
                            شكراً لمبادرتك وحرصك يا مهندس {profile.fullName.split(' ')[0]}. سيتم دراسة الورشة والتنسيق معك قريباً.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>

              {/* Side Column (1 span): Password + Photo + Community Links */}
              <div className="space-y-6">
                {/* Security Card: Password */}
                <div id="security-section">
                  <PasswordCard passwordSet={Boolean(profile.passwordSet)} />
                </div>

                {/* Profile Picture Card */}
                <PhotoCard photoUrl={profile.photoUrl} name={profile.fullName} />

                {/* Official Community Channels */}
                <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-3 shadow-md text-right">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>مجتمع النادي الهندسي</span>
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    انضم لقنواتنا الرسمية لمتابعة إعلانات الورش الهندسية، الهاكاثونات، ومجموعات العمل التخصصية.
                  </p>
                  <div className="space-y-2 pt-1 text-xs font-semibold">
                    <a
                      href="https://t.me/upengineeringclub"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2.5 rounded-xl bg-white/5 hover:bg-cyan-950/40 border border-white/10 text-cyan-300 hover:text-cyan-200 transition-colors text-center cursor-pointer"
                    >
                      قناة النادي الرسمية على تليجرام ←
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Page Footer */}
      <footer className="mt-16 py-8 border-t border-white/10 text-center text-xs text-gray-400">
        <p>النادي الهندسي — جامعة فلسطين © 2026. ملتقى مهندسي الغد.</p>
      </footer>
    </div>
  );
};

// ---------------------------------------------------------------------------

const MembershipPanel: React.FC<{ profile: MemberProfile }> = ({ profile }) => {
  const settings = dataService.getMembershipSettings();
  const [showForm, setShowForm] = useState(false);
  const [method, setMethod] = useState(settings.paymentMethods[0] || '');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const isExec =
    profile.membershipType === 'executive' ||
    isExecutivePosition({
      organizationalRole: profile.organizationalRole || undefined,
      assignedCommittee: profile.assignedCommittee || undefined,
      targetCommittee: profile.targetCommittee || undefined,
      membershipType: profile.membershipType || undefined,
    });

  if (isExec) {
    return (
      <section className="p-5 sm:p-6 rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.02] to-cyan-500/[0.05] space-y-3 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">العضوية والتكليف القيادي</h3>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            اعتماد قيادي 2026/2027
          </span>
        </div>

        <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
          أنت عضو معتمد في الهيئة القيادية للنادي الهندسي ({profile.organizationalRole || profile.assignedCommittee || 'الهيئة الإدارية والتنفيذية'}). عضويتك مفعلة وسارية طوال الدورة النقابية للعام الأكاديمي 2026 / 2027 مع كامل صلاحيات المشاركة والقيادة.
        </p>
      </section>
    );
  }

  const remaining = daysLeft(profile.validUntil);
  const state = profile.membershipState;
  const pending = profile.paymentRequest?.status === 'pending';
  const rejected = profile.paymentRequest?.status === 'rejected';
  const canRequest = state !== 'suspended' && !pending && (state !== 'semester' || (remaining !== null && remaining <= 14));

  const tone =
    state === 'semester'
      ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
      : state === 'expired' || state === 'suspended'
        ? 'border-red-500/40 bg-red-500/[0.06]'
        : 'border-cyan-500/40 bg-cyan-500/[0.04]';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method) {
      setError('اختر طريقة الدفع');
      return;
    }
    if (!reference.trim() && !receipt) {
      setError('اكتب رقم الحوالة / اسم المستلم، أو أرفق صورة الإيصال');
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      await memberService.requestSemesterMembership({ method, reference, receipt, note });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إرسال الطلب');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className={`p-5 sm:p-6 rounded-3xl border ${tone} space-y-3 shadow-lg`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <span>حالة العضوية والاعتماد</span>
        </h3>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-white">
          {state === 'semester' ? 'عضوية فصلية' : state === 'expired' ? 'منتهية' : state === 'suspended' ? 'معلّقة' : 'سارية'}
        </span>
      </div>

      <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
        {state === 'suspended' && (
          <>عضويتك معلّقة حالياً من إدارة النادي، فما بتقدر تسجّل في الفعاليات. تواصل مع الإدارة لمعرفة السبب وإعادة تفعيلها.</>
        )}
        {state === 'expired' && <>انتهت صلاحية بطاقتك بتاريخ {formatArabicDate(profile.validUntil)}. جدّدها لتتمكن من التسجيل في الفعاليات.</>}
        {state === 'temporary' && (
          <>
            بطاقتك الرقمية صالحة حتى <strong className="text-white">{formatArabicDate(profile.validUntil)}</strong>
            {remaining !== null && remaining >= 0 && <> (باقي {remaining} {remaining === 1 ? 'يوم' : 'أيام'})</>}{' '}
            لحين استكمال إجراءات التثبيت والاعتماد النهائي للعضوية من إدارة النادي.
          </>
        )}
        {state === 'semester' && (
          <>
            عضويتك الفصلية فعّالة ومسددة حتى <strong className="text-white">{formatArabicDate(profile.validUntil)}</strong>.
          </>
        )}
      </p>

      {pending && (
        <p className="text-xs sm:text-sm text-amber-200 flex items-center gap-2 bg-amber-950/40 p-3 rounded-xl border border-amber-500/30">
          <Clock className="w-4 h-4 shrink-0" />
          <span>طلب العضوية الفصلية قيد المراجعة من إدارة النادي.</span>
        </p>
      )}
      {rejected && !showForm && (
        <p className="text-xs sm:text-sm text-red-200 flex items-start gap-2 bg-red-950/40 p-3 rounded-xl border border-red-500/30">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            لم يُعتمد طلبك السابق{profile.paymentRequest?.adminNote ? `: ${profile.paymentRequest.adminNote}` : '.'} يمكنك إرسال طلب جديد.
          </span>
        </p>
      )}
      {profile.paymentRequest?.status === 'approved' && state === 'semester' && (
        <p className="text-xs sm:text-sm text-emerald-200 flex items-center gap-2 bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>تم اعتماد دفعك {profile.paymentRequest.semesterLabel ? `(${profile.paymentRequest.semesterLabel})` : ''}.</span>
        </p>
      )}

      {canRequest && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7F1AB2] to-[#6F3993] hover:from-[#A26CC6] hover:to-[#7F1AB2] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
        >
          <CreditCard className="w-4 h-4" />
          <span>
            طلب العضوية الفصلية — {settings.semesterFee} {settings.currency}
          </span>
        </button>
      )}

      {showForm && (
        <form onSubmit={submit} noValidate className="pt-3 border-t border-white/10 space-y-3">
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            {settings.semesterLabel && <strong className="text-white">{settings.semesterLabel}: </strong>}
            {settings.paymentInstructions}
          </p>
          <label className="block">
            <span className="block text-xs sm:text-sm text-gray-300 mb-1">طريقة الدفع</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs sm:text-sm"
            >
              {settings.paymentMethods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs sm:text-sm text-gray-300 mb-1">رقم الحوالة أو اسم المستلم</span>
            <input
              type="text"
              value={reference}
              maxLength={120}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs sm:text-sm"
            />
          </label>
          <div>
            <span className="block text-xs sm:text-sm text-gray-300 mb-1">صورة الإيصال (اختياري)</span>
            <label className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/20 hover:border-cyan-400/50 text-xs sm:text-sm text-gray-300 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>{receipt ? 'تم إرفاق الصورة — اضغط للتغيير' : 'اختر صورة'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setReceipt(await compressImage(file, 1200, 0.75));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'تعذر قراءة الصورة');
                  }
                }}
              />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs sm:text-sm text-gray-300 mb-1">ملاحظة (اختياري)</span>
            <input
              type="text"
              value={note}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs sm:text-sm"
            />
          </label>
          {error && (
            <p role="alert" className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSending}
              className="flex-1 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 text-black font-bold text-xs sm:text-sm cursor-pointer"
            >
              {isSending ? 'جاري الإرسال…' : 'إرسال الطلب'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs sm:text-sm cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------

const RegistrationsPanel: React.FC<{ profile: MemberProfile; onBrowseEvents: () => void }> = ({ profile, onBrowseEvents }) => {
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancel = async (eventId: string) => {
    if (!window.confirm('إلغاء تسجيلك في هذه الفعالية؟')) return;
    setCancelling(eventId);
    setError(null);
    try {
      await memberService.cancelRegistration(eventId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الإلغاء');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <section className="p-5 sm:p-6 rounded-3xl glass-panel border border-white/10 space-y-4 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-cyan-400" />
          <span>الفعاليات والورش المسجلة</span>
        </h3>
        <button
          type="button"
          onClick={() => {
            onBrowseEvents();
            setTimeout(() => document.querySelector('#events')?.scrollIntoView({ behavior: 'smooth' }), 150);
          }}
          className="text-xs sm:text-sm text-cyan-300 hover:text-cyan-200 cursor-pointer font-bold"
        >
          تصفح المزيد من الفعاليات ←
        </button>
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      {profile.registrations.length === 0 ? (
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs sm:text-sm text-gray-400">
          لم تسجّل في أي ورشة أو فعالية حتى الآن. تصفح الفعاليات القادمة وسجّل فوراً بحسابك!
        </div>
      ) : (
        <ul className="space-y-3">
          {profile.registrations.map((r) => {
            const upcoming = !r.startsAt || new Date(r.startsAt).getTime() > Date.now();
            return (
              <li key={r.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="text-xs text-gray-400">{EVENT_TYPE_LABELS[r.eventType] || 'فعالية'}</div>
                    <div className="font-bold text-white break-words">{r.title}</div>
                    <div className="text-xs sm:text-sm text-gray-300 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4 shrink-0 text-cyan-400" />
                        {eventWhenLabel(r)}
                      </span>
                      {r.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 shrink-0 text-cyan-400" />
                          {r.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        r.checkedInAt
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : r.status === 'waitlisted'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-cyan-500/15 text-cyan-300'
                      }`}
                    >
                      {r.checkedInAt ? 'حضرت' : r.status === 'waitlisted' ? 'قائمة انتظار' : 'مسجّل'}
                    </span>
                    {upcoming && !r.checkedInAt && (
                      <button
                        type="button"
                        disabled={cancelling === r.eventId}
                        onClick={() => void cancel(r.eventId)}
                        className="text-xs text-gray-400 hover:text-red-300 cursor-pointer disabled:opacity-50"
                      >
                        {cancelling === r.eventId ? 'جاري…' : 'إلغاء التسجيل'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Team Details for Hackathons */}
                {r.teamData && (
                  <div className="pt-2 border-t border-white/5 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold">
                          {r.teamData.participationType === 'team' ? 'فريق عمل' : 'مشارك فردي'}
                        </span>
                        {r.teamData.track && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            مسار: {r.teamData.track}
                          </span>
                        )}
                      </div>
                      {r.teamData.teamName && (
                        <span className="font-bold text-white text-sm">اسم الفريق: {r.teamData.teamName}</span>
                      )}
                    </div>

                    {r.teamData.projectTitle && (
                      <div className="text-cyan-300 font-semibold">
                        المشروع: {r.teamData.projectTitle}
                      </div>
                    )}

                    {r.teamData.projectSummary && (
                      <p className="text-gray-300 leading-relaxed whitespace-pre-line bg-black/30 p-2.5 rounded-xl border border-white/5">
                        {r.teamData.projectSummary}
                      </p>
                    )}

                    {r.teamData.members && r.teamData.members.length > 0 && (
                      <div>
                        <div className="text-gray-400 font-bold mb-1">أعضاء الفريق:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {r.teamData.members.map((m, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-200">
                              {m.fullName} {m.role ? `(${m.role})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
