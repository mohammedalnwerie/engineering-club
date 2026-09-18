import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MemberLoginForm } from './MemberLoginForm';
import { PasswordCard } from './PasswordCard';
import { PhotoCard } from './PhotoCard';
import { MemberCard } from '../MemberCard';
import { CommitteeBadgeModal } from '../CommitteeBadgeModal';
import { ExecutiveBadgeModal } from '../ExecutiveBadgeModal';
import {
  memberService,
  daysLeft,
  formatArabicDate,
  eventWhenLabel,
  EVENT_TYPE_LABELS,
  type MemberProfile,
} from '../../services/memberService';
import { dataService } from '../../services/dataService';
import { memberCardFor } from '../../utils/memberCard';
import { downloadCardPng, printCard } from '../../utils/cardRenderer';
import { compressImage } from '../../utils/image';
import { findCommittee, effectiveCommittee, isExecutivePosition } from '../../data/committees';
import type { StoredApplication, LeaderMember } from '../../types';

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
  const [showCommitteeCard, setShowCommitteeCard] = useState(false);
  const [showExecutiveCard, setShowExecutiveCard] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
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
        .catch((err) => setLoadError(err instanceof Error ? err.message : 'تعذر تحميل حسابك'))
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
        setShowSuggestModal(false);
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

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-2xl rounded-3xl glass-panel border border-white/10 p-5 sm:p-8 text-right">
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {!memberService.isLoggedIn ? (
            <div className="max-w-md mx-auto pt-2">
              <h2 className="text-2xl font-black text-white">حسابي</h2>
              <p className="text-sm text-gray-400 mt-1 mb-6">
                ادخل برقمك الجامعي ورمز العضو لعرض بطاقتك، والتسجيل في الورش والدورات، وتجديد عضويتك.
              </p>
              <MemberLoginForm onSuccess={setProfile} />
              <p className="text-sm text-gray-400 mt-6 text-center">
                لست عضواً بعد؟{' '}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onJoin();
                  }}
                  className="text-cyan-300 hover:text-cyan-200 underline underline-offset-4 cursor-pointer"
                >
                  قدّم طلب انضمام
                </button>
              </p>
            </div>
          ) : !profile ? (
            <div className="py-16 text-center text-gray-300">
              {isLoading ? (
                <span>جاري تحميل حسابك…</span>
              ) : (
                <div className="space-y-4">
                  <p role="alert" className="text-red-200">{loadError || 'تعذر تحميل الحساب'}</p>
                  <button onClick={handleRefresh} className="px-4 py-2 rounded-xl bg-white/10 text-white cursor-pointer">
                    إعادة المحاولة
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pl-10">
                <div className="min-w-0">
                  <div className="text-sm text-gray-400">مرحباً</div>
                  <h2 className="text-2xl font-black text-white break-words">{profile.fullName}</h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    aria-label="تحديث"
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => memberService.logout()}
                    className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-red-950/40 text-gray-300 hover:text-red-200 text-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>خروج</span>
                  </button>
                </div>
              </div>

              {loadError && (
                <p role="alert" className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm">
                  {loadError}
                </p>
              )}

              {!profile.passwordSet && (
                <div className="p-3.5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
                  <div className="flex items-start gap-2 leading-relaxed">
                    <span className="text-base shrink-0">🛡️</span>
                    <span>
                      <strong className="text-white block sm:inline">حسابك مسجّل حالياً برمز البطاقة فقط.</strong> يُنصح بإنشاء كلمة مرور شخصية لمنع أي شخص يرى بطاقتك من الوصول لحسابك.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('security-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 text-black font-bold text-xs whitespace-nowrap self-start sm:self-center cursor-pointer hover:bg-amber-300 transition-colors"
                  >
                    عيّن كلمة المرور
                  </button>
                </div>
              )}

              {/* Member Digital Card (Hero) */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">بطاقة العضوية الرقمية</h3>
                  {profile.memberCode && (
                    <span className="font-mono text-xs text-cyan-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10" dir="ltr">
                      {profile.memberCode}
                    </span>
                  )}
                </div>
                <MemberCard {...memberCardFor(asApplication(profile), { revealCode: true })} />
                {profile.membershipState === 'suspended' ? (
                  <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs text-center leading-relaxed">
                    ⚠️ البطاقة معلّقة إدارياً. تم تعطيل حفظ الصورة والطباعة لحين تسوية وضع العضوية مع إدارة النادي.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-w-[360px] mx-auto">
                    <button
                      type="button"
                      onClick={() =>
                        void downloadCardPng(memberCardFor(asApplication(profile), { revealCode: true }), `UP-Member-Card-${profile.studentId}.png`)
                      }
                      className="py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>حفظ كصورة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void printCard(memberCardFor(asApplication(profile), { revealCode: true }))}
                      className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      <span>طباعة</span>
                    </button>
                    {matchedLeader && (
                      <button
                        type="button"
                        onClick={() => setShowExecutiveCard(true)}
                        className="col-span-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 border border-amber-400/40 text-amber-200 text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md"
                      >
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span>عرض بطاقة التكليف القيادي</span>
                      </button>
                    )}
                    {findCommittee(effectiveCommittee(asApplication(profile)))?.id !== 'general' && (
                      <button
                        type="button"
                        onClick={() => setShowCommitteeCard(true)}
                        className="col-span-2 py-2.5 rounded-xl bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/40 text-cyan-200 text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Award className="w-4 h-4" />
                        <span>عرض كرت عضو اللجنة</span>
                      </button>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500 text-center">
                  البطاقة للتحقق من عضويتك. الدخول إلى حسابك بكلمة المرور، فلا تشارك كلمة المرور مع أحد.
                </p>
              </section>

              {/* Membership validity & semester renewal */}
              <MembershipPanel profile={profile} onOpenExecutiveCard={matchedLeader ? () => setShowExecutiveCard(true) : undefined} />

              {/* Events & Registrations */}
              <RegistrationsPanel profile={profile} onBrowseEvents={onClose} />

              {/* Propose Workshop or Event Section */}
              <section className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">اقترح ورشة عمل أو فعالية للنادي</h4>
                      <span className="font-mono text-[10px] bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">ميزة حصرية للأعضاء</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                      شاركنا مقترحك لمسار أو دورة تود تنظيمها، وسيعمل فريق النادي على دراستها وتنفيذها معك.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSuggestModal(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs shrink-0 cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>تقديم مقترح ورشة</span>
                </button>
              </section>

              {/* Security & Password settings at bottom */}
              <div id="security-section">
                <PhotoCard photoUrl={profile.photoUrl} name={profile.fullName} />

              <PasswordCard passwordSet={Boolean(profile.passwordSet)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {showExecutiveCard && matchedLeader && (
        <ExecutiveBadgeModal isOpen leader={matchedLeader} onClose={() => setShowExecutiveCard(false)} />
      )}

      {showCommitteeCard && profile && (
        <CommitteeBadgeModal isOpen app={asApplication(profile)} revealCode onClose={() => setShowCommitteeCard(false)} />
      )}

      {showSuggestModal && profile &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 sm:p-4 pt-20 sm:pt-24 pb-8 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl bg-[#0B1B33] border border-emerald-500/40 p-6 sm:p-8 shadow-2xl text-right my-auto">
              <button
                onClick={() => setShowSuggestModal(false)}
                className="absolute top-5 left-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {!suggestSubmitted ? (
                <form onSubmit={handleSuggestSubmit} className="space-y-4">
                  <div className="flex items-center gap-2 mb-1 text-emerald-400">
                    <Lightbulb className="w-6 h-6" />
                    <h3 className="text-xl font-bold text-white">اقترح ورشة عمل أو فعالية</h3>
                  </div>

                  {/* Verified Member Status */}
                  <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>عضو معتمد: <strong>{profile.fullName}</strong></span>
                    </div>
                    <span className="font-mono text-[11px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">{profile.studentId}</span>
                  </div>

                  <p className="text-xs text-gray-300 font-light">
                    اكتب الفكرة أو المهارة الهندسية التي ترى أنها تفيد الزملاء في كليتك، وسيقوم مجلس إدارة النادي بمراجعتها والتنسيق معك لإطلاقها.
                  </p>

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

                  <div className="pt-3 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowSuggestModal(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={suggestSending}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs sm:text-sm font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{suggestSending ? 'جاري الإرسال…' : 'إرسال المقترح للإدارة'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">تم استلام مقترحك بنجاح!</h4>
                  <p className="text-xs sm:text-sm text-gray-300 font-light">
                    شكراً لمبادرتك وحرصك يا مهندس {profile.fullName.split(' ')[0]}. سيتم دراسة الورشة والتنسيق معك قريباً.
                  </p>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

// ---------------------------------------------------------------------------

const MembershipPanel: React.FC<{ profile: MemberProfile; onOpenExecutiveCard?: () => void }> = ({ profile, onOpenExecutiveCard }) => {
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
      <section className="p-5 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.02] to-cyan-500/[0.05] space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">العضوية والتكليف القيادي</h3>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            اعتماد قيادي 2026/2027
          </span>
        </div>

        <p className="text-sm text-gray-200 leading-relaxed">
          أنت عضو معتمد في الهيئة القيادية للنادي الهندسي ({profile.organizationalRole || profile.assignedCommittee || 'الهيئة الإدارية والتنفيذية'}). عضويتك مفعلة وسارية طوال الدورة النقابية للعام الأكاديمي 2026 / 2027 مع كامل صلاحيات المشاركة والقيادة.
        </p>

        {onOpenExecutiveCard && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenExecutiveCard}
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>عرض بطاقة التكليف القيادي</span>
            </button>
          </div>
        )}
      </section>
    );
  }

  const remaining = daysLeft(profile.validUntil);
  const state = profile.membershipState;
  const pending = profile.paymentRequest?.status === 'pending';
  const rejected = profile.paymentRequest?.status === 'rejected';
  // A suspended member settles it with the admins first; no renewal form for them.
  const canRequest = state !== 'suspended' && !pending && (state !== 'semester' || (remaining !== null && remaining <= 14));

  const tone =
    state === 'semester'
      ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
      : state === 'expired' || state === 'suspended'
        ? 'border-red-500/40 bg-red-500/[0.06]'
        : 'border-amber-500/40 bg-amber-500/[0.06]';

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
    <section className={`p-5 rounded-2xl border ${tone} space-y-3`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">العضوية</h3>
        <span className="text-sm font-bold text-white">
          {state === 'semester' ? 'فصلية' : state === 'expired' ? 'منتهية' : state === 'suspended' ? 'معلّقة' : 'سارية'}
        </span>
      </div>

      <p className="text-sm text-gray-200 leading-relaxed">
        {state === 'suspended' && (
          <>عضويتك معلّقة حالياً من إدارة النادي، فما بتقدر تسجّل في الفعاليات. تواصل مع الإدارة لمعرفة السبب وإعادة تفعيلها.</>
        )}
        {state === 'expired' && <>انتهت عضويتك بتاريخ {formatArabicDate(profile.validUntil)}. جدّدها لتتمكن من التسجيل في الفعاليات.</>}
        {state === 'temporary' && (
          <>
            بطاقتك صالحة حتى <strong className="text-white">{formatArabicDate(profile.validUntil)}</strong>
            {remaining !== null && remaining >= 0 && <> (باقي {remaining} {remaining === 1 ? 'يوم' : 'أيام'})</>}. بعدها تحتاج
            العضوية الفصلية ({settings.semesterFee} {settings.currency}).
          </>
        )}
        {state === 'semester' && (
          <>
            عضويتك الفصلية فعّالة حتى <strong className="text-white">{formatArabicDate(profile.validUntil)}</strong>.
          </>
        )}
      </p>

      {pending && (
        <p className="text-sm text-amber-200 flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          <span>طلب العضوية الفصلية قيد المراجعة من إدارة النادي.</span>
        </p>
      )}
      {rejected && !showForm && (
        <p className="text-sm text-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            لم يُعتمد طلبك السابق{profile.paymentRequest?.adminNote ? `: ${profile.paymentRequest.adminNote}` : '.'} يمكنك إرسال طلب جديد.
          </span>
        </p>
      )}
      {profile.paymentRequest?.status === 'approved' && state === 'semester' && (
        <p className="text-sm text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>تم اعتماد دفعك {profile.paymentRequest.semesterLabel ? `(${profile.paymentRequest.semesterLabel})` : ''}.</span>
        </p>
      )}

      {canRequest && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-[#7F1AB2] to-[#6F3993] hover:from-[#A26CC6] hover:to-[#7F1AB2] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          <span>
            طلب العضوية الفصلية — {settings.semesterFee} {settings.currency}
          </span>
        </button>
      )}

      {showForm && (
        <form onSubmit={submit} noValidate className="pt-3 border-t border-white/10 space-y-3">
          <p className="text-sm text-gray-300 leading-relaxed">
            {settings.semesterLabel && <strong className="text-white">{settings.semesterLabel}: </strong>}
            {settings.paymentInstructions}
          </p>
          <label className="block">
            <span className="block text-sm text-gray-300 mb-1.5">طريقة الدفع</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm"
            >
              {settings.paymentMethods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm text-gray-300 mb-1.5">رقم الحوالة أو اسم المستلم</span>
            <input
              type="text"
              value={reference}
              maxLength={120}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm"
            />
          </label>
          <div>
            <span className="block text-sm text-gray-300 mb-1.5">صورة الإيصال (اختياري)</span>
            <label className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/20 hover:border-cyan-400/50 text-sm text-gray-300 cursor-pointer">
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
            <span className="block text-sm text-gray-300 mb-1.5">ملاحظة (اختياري)</span>
            <input
              type="text"
              value={note}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm"
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
              className="flex-1 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 text-black font-bold text-sm cursor-pointer"
            >
              {isSending ? 'جاري الإرسال…' : 'إرسال الطلب'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm cursor-pointer"
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
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">تسجيلاتي</h3>
        <button
          type="button"
          onClick={() => {
            onBrowseEvents();
            setTimeout(() => document.querySelector('#events')?.scrollIntoView({ behavior: 'smooth' }), 150);
          }}
          className="text-sm text-cyan-300 hover:text-cyan-200 cursor-pointer"
        >
          تصفح الفعاليات
        </button>
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      {profile.registrations.length === 0 ? (
        <p className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-sm text-gray-400">
          لم تسجّل في أي فعالية بعد.
        </p>
      ) : (
        <ul className="space-y-2">
          {profile.registrations.map((r) => {
            const upcoming = !r.startsAt || new Date(r.startsAt).getTime() > Date.now();
            return (
              <li key={r.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="text-xs text-gray-400">{EVENT_TYPE_LABELS[r.eventType] || 'فعالية'}</div>
                  <div className="font-bold text-white break-words">{r.title}</div>
                  <div className="text-sm text-gray-300 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 shrink-0" />
                      {eventWhenLabel(r)}
                    </span>
                    {r.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 shrink-0" />
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
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
