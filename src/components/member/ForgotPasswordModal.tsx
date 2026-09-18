import React, { useEffect, useState } from 'react';
import {
  X,
  KeyRound,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Headset,
  Sparkles,
  Check,
  ArrowLeft,
  Copy,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { memberService } from '../../services/memberService';
import { normalizeCode, validateStudentId } from '../../utils/validation';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: string;
  onSuccessReset?: (studentId: string) => void;
}

type TabMode = 'self_reset' | 'support_ticket';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialStudentId = '',
  onSuccessReset,
}) => {
  const [tab, setTab] = useState<TabMode>('self_reset');
  const [studentId, setStudentId] = useState(initialStudentId);
  const [verification, setVerification] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [verifiedName, setVerifiedName] = useState<string | null>(null);

  // Self reset state
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessName, setResetSuccessName] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Support ticket state
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [submittedTicketNumber, setSubmittedTicketNumber] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);

  useEffect(() => {
    if (initialStudentId) {
      setStudentId(initialStudentId);
    }
  }, [initialStudentId]);

  // Check student membership status to confirm member existence
  useEffect(() => {
    const cleanId = normalizeCode(studentId);
    if (cleanId.length >= 8) {
      let cancelled = false;
      dataService
        .verifyMember(cleanId)
        .then((member) => {
          if (!cancelled) setVerifiedName(member?.fullName || null);
        })
        .catch(() => {
          if (!cancelled) setVerifiedName(null);
        });
      return () => {
        cancelled = true;
      };
    } else {
      setVerifiedName(null);
    }
  }, [studentId]);

  if (!isOpen) return null;

  // Handle instant self-service password reset
  const handleSelfReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const idProblem = validateStudentId(studentId);
    if (idProblem) {
      setResetError(idProblem);
      return;
    }
    if (!verification.trim()) {
      setResetError('اكتب رقم الجوال أو البريد الإلكتروني المسجل في طلبك');
      return;
    }

    setIsResetting(true);
    setResetError(null);

    try {
      const res = await memberService.selfResetPassword(studentId, verification);
      if (res.ok) {
        setResetSuccessName(res.fullName || verifiedName || 'زميلنا');
        onSuccessReset?.(studentId);
      } else {
        setResetError('البيانات المدخلة لا تتطابق مع رقم الجوال أو الإيميل المسجل في حسابك');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر التصفير';
      if (msg.includes('غير متطابقة') || msg.includes('لا تتطابق')) {
        setResetError('البيانات المدخلة لا تتطابق مع رقم الجوال أو الإيميل المسجل في حسابك');
      } else if (msg.includes('محاولات كثيرة')) {
        setResetError('محاولات كثيرة خاطئة. يرجى الانتظار 15 دقيقة أو تقديم طلب للدعم الفني.');
      } else if (msg.includes('Could not find') || msg.includes('غير مفعّلة')) {
        // Fallback: If DB migration 012 is not yet executed, guide user to support ticket seamlessly
        setResetError('التصفير التلقائي قيد التفعيل بالنظام حالياً. يرجى استخدام تبويب "الدعم الفني" لإرسال الطلب فوراً.');
        setTab('support_ticket');
      } else {
        setResetError(msg);
      }
    } finally {
      setIsResetting(false);
    }
  };

  // Handle in-app technical support ticket submission
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const idProblem = validateStudentId(studentId);
    if (idProblem) {
      setTicketError(idProblem);
      return;
    }

    setIsSubmittingTicket(true);
    setTicketError(null);

    try {
      const ticket = await dataService.submitComplaint({
        category: 'inquiry',
        studentName: verifiedName || `طالب برقم ${studentId}`,
        studentId: normalizeCode(studentId),
        college: 'كلية الهندسة وتكنولوجيا المعلومات',
        email: verification.includes('@') ? verification.trim() : '',
        phone: phone.trim() || (!verification.includes('@') ? verification.trim() : undefined),
        subject: `[طلب تصفير كلمة مرور] الرقم الجامعي: ${studentId}`,
        message: `طلب رسمي للدعم الفني لتصفير كلمة المرور للطالب (${verifiedName || studentId}). الرقم الجامعي: ${studentId}.${
          note.trim() ? ` ملاحظة إضافية: ${note.trim()}` : ' نسي كلمة المرور ويطلب تصفيرها للدخول برمز البطاقة مجدداً.'
        }`,
        priority: 'urgent',
      });
      setSubmittedTicketNumber(ticket.ticketNumber);
    } catch (err) {
      setTicketError(err instanceof Error ? err.message : 'تعذر إرسال الطلب، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md overflow-y-auto flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel border border-white/10 p-5 sm:p-7 text-right shadow-2xl">
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <KeyRound className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">استعادة الدخول وتصفير كلمة المرور</h3>
            <p className="text-xs text-gray-400">دعم فني وتصفير مباشر من داخل الموقع</p>
          </div>
        </div>

        {/* First time login note */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-gray-300 space-y-1.5 mb-5">
          <div className="flex items-center gap-1.5 font-bold text-cyan-300">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>هل هذه أول مرة تسجل فيها دخولك؟</span>
          </div>
          <p className="leading-relaxed">
            إذا لم تعيّن كلمة مرور شخصية من قبل، <strong>فلست بحاجة للتصفير</strong>! يمكنك الدخول مباشرة باستخدام
            <strong className="text-white"> رمز البطاقة (مثل UP-XXXX-XXXX)</strong> المذكور في رسالة القبول أو المطبوع على بطاقتك.
          </p>
        </div>

        {/* SUCCESS VIEW 1: Self Reset Succeeded */}
        {resetSuccessName ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-white">تم تصفير كلمة المرور بنجاح!</h4>
              <p className="text-sm text-gray-300 leading-relaxed max-w-sm mx-auto">
                أهلاً بك يا <strong className="text-white">{resetSuccessName}</strong>. تم التحقق من هويتك بنجاح، ويمكنك الآن
                تسجيل الدخول مباشرة باستخدام <strong className="text-cyan-300">رمز بطاقتك</strong> وتعيين كلمة مرورك الجديدة.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-sm cursor-pointer transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <span>تسجيل الدخول الآن</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : submittedTicketNumber ? (
          /* SUCCESS VIEW 2: Support Ticket Submitted */
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <Headset className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-white">تم استلام طلبك من الدعم الفني!</h4>
              <p className="text-sm text-gray-300 leading-relaxed max-w-sm mx-auto">
                وصل طلبك لإدارة النادي الهندسي، وستقوم الإدارة بمراجعة الحساب وتصفيره في أقرب وقت لتتمكن من الدخول برمز بطاقتك.
              </p>
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 inline-flex items-center gap-3 font-mono text-xs text-cyan-300">
                <span>رقم التذكرة: {submittedTicketNumber}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(submittedTicketNumber);
                  }}
                  className="text-gray-400 hover:text-white cursor-pointer"
                  title="نسخ رقم التذكرة"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm cursor-pointer transition-colors"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        ) : (
          /* FORM VIEW: Tabbed Navigation (Self Reset vs Support Ticket) */
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex p-1 rounded-2xl bg-white/[0.04] border border-white/10" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'self_reset'}
                onClick={() => {
                  setTab('self_reset');
                  setResetError(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  tab === 'self_reset'
                    ? 'bg-gradient-to-r from-[#7F1AB2] to-[#6F3993] text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تصفير فوري (بالتحقق)</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'support_ticket'}
                onClick={() => {
                  setTab('support_ticket');
                  setTicketError(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  tab === 'support_ticket'
                    ? 'bg-gradient-to-r from-[#7F1AB2] to-[#6F3993] text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Headset className="w-3.5 h-3.5" />
                <span>الدعم الفني للموقع</span>
              </button>
            </div>

            {/* TAB 1: Self-Service Reset */}
            {tab === 'self_reset' && (
              <form onSubmit={handleSelfReset} className="space-y-3.5 pt-1">
                <div>
                  <label htmlFor="self-student-id" className="block text-xs font-medium text-gray-300 mb-1.5">
                    الرقم الجامعي
                  </label>
                  <input
                    id="self-student-id"
                    type="text"
                    inputMode="numeric"
                    placeholder="120220145"
                    value={studentId}
                    onChange={(e) => {
                      setStudentId(normalizeCode(e.target.value));
                      setResetError(null);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm text-left font-mono"
                    dir="ltr"
                  />
                  {verifiedName && (
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>عضو مسجل: {verifiedName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="self-verification" className="block text-xs font-medium text-gray-300 mb-1.5">
                    رقم الجوال أو البريد الإلكتروني (المسجل بطلبك)
                  </label>
                  <input
                    id="self-verification"
                    type="text"
                    placeholder="059xxxxxxx أو student@up.edu.ps"
                    value={verification}
                    onChange={(e) => {
                      setVerification(e.target.value);
                      setResetError(null);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm text-left font-mono"
                    dir="ltr"
                  />
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    لحماية حسابك: يتم التصفير فوراً بمجرد تطابق رقم جوالك أو إيميلك مع بيانات عضويتك.
                  </p>
                </div>

                {resetError && (
                  <p role="alert" className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{resetError}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isResetting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isResetting ? 'جاري التحقق والتصفير…' : 'تصفير كلمة المرور الآن'}</span>
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setTab('support_ticket')}
                    className="text-xs text-cyan-300 hover:text-cyan-200 underline underline-offset-4 cursor-pointer"
                  >
                    نسيت رقم الجوال أو الإيميل المسجل؟ تواصل مع الدعم الفني
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Support Ticket */}
            {tab === 'support_ticket' && (
              <form onSubmit={handleSubmitTicket} className="space-y-3 pt-1">
                <div>
                  <label htmlFor="ticket-student-id" className="block text-xs font-medium text-gray-300 mb-1">
                    الرقم الجامعي
                  </label>
                  <input
                    id="ticket-student-id"
                    type="text"
                    inputMode="numeric"
                    placeholder="120220145"
                    value={studentId}
                    onChange={(e) => {
                      setStudentId(normalizeCode(e.target.value));
                      setTicketError(null);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm text-left font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label htmlFor="ticket-contact" className="block text-xs font-medium text-gray-300 mb-1">
                    رقم للتواصل (جوال اختياري)
                  </label>
                  <input
                    id="ticket-contact"
                    type="tel"
                    placeholder="059xxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm text-left font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label htmlFor="ticket-note" className="block text-xs font-medium text-gray-300 mb-1">
                    تفاصيل أو ملاحظة (اختياري)
                  </label>
                  <textarea
                    id="ticket-note"
                    rows={2}
                    placeholder="مثال: نسيت كلمة المرور ورقم جوالي القديم تم تغييره…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs leading-relaxed"
                  />
                </div>

                {ticketError && (
                  <p role="alert" className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{ticketError}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
                >
                  <Send className="w-4 h-4 text-cyan-400" />
                  <span>{isSubmittingTicket ? 'جاري إرسال الطلب…' : 'إرسال طلب تصفير للدعم الفني'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
