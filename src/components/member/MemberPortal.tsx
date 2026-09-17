import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { MemberLoginForm } from './MemberLoginForm';
import { PasswordCard } from './PasswordCard';
import { MemberCard } from '../MemberCard';
import { CommitteeBadgeModal } from '../CommitteeBadgeModal';
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
import { findCommittee, effectiveCommittee } from '../../data/committees';
import type { StoredApplication } from '../../types';

interface MemberPortalProps {
  onClose: () => void;
  onJoin: () => void;
}

/** Shapes the member profile like an application so the shared card builders can use it. */
const asApplication = (p: MemberProfile): StoredApplication => ({
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
  weeklyCommitmentHours: 0,
  status: 'تم القبول',
  submittedAt: '',
  memberCode: p.memberCode,
  membershipType: p.membershipType || undefined,
  validUntil: p.validUntil || undefined,
});

export const MemberPortal: React.FC<MemberPortalProps> = ({ onClose, onJoin }) => {
  const [profile, setProfile] = useState<MemberProfile | null>(memberService.currentProfile);
  const [isLoading, setIsLoading] = useState(memberService.isLoggedIn && !memberService.currentProfile);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCommitteeCard, setShowCommitteeCard] = useState(false);

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

              <PasswordCard passwordSet={Boolean(profile.passwordSet)} />

              <MembershipPanel profile={profile} />

              {/* Card */}
              <section className="space-y-3">
                <h3 className="text-lg font-bold text-white">بطاقة العضوية</h3>
                <MemberCard {...memberCardFor(asApplication(profile), { revealCode: true })} />
                <div className="grid grid-cols-2 gap-2 max-w-[360px] mx-auto">
                  <button
                    type="button"
                    onClick={() =>
                      void downloadCardPng(memberCardFor(asApplication(profile), { revealCode: true }), `UP-Member-Card-${profile.studentId}.png`)
                    }
                    className="py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>حفظ كصورة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void printCard(memberCardFor(asApplication(profile), { revealCode: true }))}
                    className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة</span>
                  </button>
                  {findCommittee(effectiveCommittee(asApplication(profile)))?.id !== 'general' && (
                    <button
                      type="button"
                      onClick={() => setShowCommitteeCard(true)}
                      className="col-span-2 py-2.5 rounded-xl bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/40 text-cyan-200 text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>كرت عضو اللجنة</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 text-center">
                  البطاقة للتحقق من عضويتك. الدخول إلى حسابك بكلمة المرور، فلا تشارك كلمة المرور مع أحد.
                </p>
              </section>

              <RegistrationsPanel profile={profile} onBrowseEvents={onClose} />
            </div>
          )}
        </div>
      </div>

      {showCommitteeCard && profile && (
        <CommitteeBadgeModal isOpen app={asApplication(profile)} revealCode onClose={() => setShowCommitteeCard(false)} />
      )}
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
