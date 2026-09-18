import React, { useEffect, useState } from 'react';
import {
  X,
  KeyRound,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Smartphone,
  Check,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { normalizeCode, validateStudentId } from '../../utils/validation';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialStudentId = '',
}) => {
  const [studentId, setStudentId] = useState(initialStudentId);
  const [phone, setPhone] = useState('');
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialStudentId) {
      setStudentId(initialStudentId);
    }
  }, [initialStudentId]);

  // Check student membership status to reassure the student
  useEffect(() => {
    const cleanId = normalizeCode(studentId);
    if (cleanId.length >= 8) {
      let cancelled = false;
      setIsVerifying(true);
      dataService
        .verifyMember(cleanId)
        .then((member) => {
          if (!cancelled) {
            setVerifiedName(member?.fullName || null);
          }
        })
        .catch(() => {
          if (!cancelled) setVerifiedName(null);
        })
        .finally(() => {
          if (!cancelled) setIsVerifying(false);
        });
      return () => {
        cancelled = true;
      };
    } else {
      setVerifiedName(null);
    }
  }, [studentId]);

  if (!isOpen) return null;

  const contact = dataService.getContactSettings();
  const waSetting = contact.links.find((l) => l.platform === 'whatsapp' && l.url.trim());
  const phoneDigits = (contact.phone || '').replace(/[^0-9]/g, '');

  const waBaseUrl = waSetting?.url
    ? waSetting.url.trim()
    : phoneDigits
      ? `https://wa.me/${phoneDigits}`
      : 'https://wa.me/';

  const waMessage = `مرحباً، نسيت كلمة المرور الخاصة بحسابي في النادي الهندسي بجامعة فلسطين (الرقم الجامعي: ${studentId || '...'}${verifiedName ? ` - الطالب: ${verifiedName}` : ''}). أرجو تصفير كلمة المرور لأتمكن من تسجيل الدخول برمز بطاقتي مجدداً.`;

  const waFullUrl = waBaseUrl.includes('?')
    ? `${waBaseUrl}&text=${encodeURIComponent(waMessage)}`
    : `${waBaseUrl}?text=${encodeURIComponent(waMessage)}`;

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const idProblem = validateStudentId(studentId);
    if (idProblem) {
      setError(idProblem);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await dataService.submitComplaint({
        category: 'inquiry',
        studentName: verifiedName || `طالب برقم ${studentId}`,
        studentId: normalizeCode(studentId),
        college: 'كلية الهندسة وتكنولوجيا المعلومات',
        email: '',
        phone: phone.trim() || undefined,
        subject: `[طلب تصفير كلمة مرور] الرقم الجامعي: ${studentId}`,
        message: `طلب رسمي لتصفير كلمة المرور للطالب (${verifiedName || studentId}). نسي كلمة المرور الشخصية ويحتاج إعادة ضبط الحساب للدخول برمز البطاقة مجدداً وتعيين كلمة مرور جديدة.`,
        priority: 'urgent',
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إرسال الطلب، يرجى المحاولة لاحقاً أو مراسلتنا عبر واتساب');
    } finally {
      setIsSubmitting(false);
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

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <KeyRound className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">استعادة الحساب وتصفير كلمة المرور</h3>
            <p className="text-xs text-gray-400">إرشادات الدخول واستعادة الوصول لحسابك</p>
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
            <strong className="text-white"> رمز البطاقة (مثل UP-3F9A-C21D)</strong> المذكور في رسالة القبول أو المطبوع على بطاقتك.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-white">تم إرسال طلب التصفير بنجاح!</h4>
              <p className="text-sm text-gray-300 leading-relaxed max-w-sm mx-auto">
                وصل طلبك لإدارة النادي الهندسي. بمجرد قيام الإدارة بتصفير كلمة المرور، ستتمكن فوراً من تسجيل الدخول باستخدام
                <strong className="text-white"> رمز بطاقتك</strong> وتعيين كلمة مرورك الجديدة.
              </p>
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
          <div className="space-y-5">
            {/* Student ID input */}
            <div>
              <label htmlFor="forgot-student-id" className="block text-sm text-gray-300 mb-1.5">
                الرقم الجامعي
              </label>
              <input
                id="forgot-student-id"
                type="text"
                inputMode="numeric"
                autoComplete="username"
                placeholder="120220145"
                value={studentId}
                onChange={(e) => {
                  setStudentId(normalizeCode(e.target.value));
                  setError(null);
                }}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-base text-left font-mono"
                dir="ltr"
              />
              {isVerifying ? (
                <p className="text-xs text-gray-400 mt-1.5 animate-pulse">جاري التحقق من الرقم الجامعي…</p>
              ) : verifiedName ? (
                <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>عضو مسجل: {verifiedName}</span>
                </p>
              ) : null}
            </div>

            {/* Option A: WhatsApp Direct */}
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>الخيار الأول (الأسرع والأسهل)</span>
                </span>
                <span className="text-[11px] text-emerald-400/80">رد فوري</span>
              </div>
              <p className="text-xs text-gray-200 leading-relaxed">
                تواصل مباشرة مع الدعم الفني لإدارة النادي عبر واتساب لإعادة ضبط كلمة مرورك خلال دقائق:
              </p>
              <a
                href={waFullUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>مراسلة الدعم عبر واتساب</span>
              </a>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#121217] px-3 text-xs text-gray-400 shrink-0">أو عبر المنظومة</span>
            </div>

            {/* Option B: In-app Support Request */}
            <form onSubmit={handleSubmitRequest} className="space-y-3">
              <div>
                <label htmlFor="forgot-phone" className="block text-xs text-gray-300 mb-1">
                  رقم للتواصل (جوال أو واتساب - اختياري)
                </label>
                <input
                  id="forgot-phone"
                  type="tel"
                  placeholder="059xxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm text-left font-mono"
                  dir="ltr"
                />
              </div>

              {error && (
                <p role="alert" className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
              >
                <Send className="w-4 h-4 text-cyan-400" />
                <span>{isSubmitting ? 'جاري إرسال الطلب…' : 'إرسال طلب تصفير للإدارة'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
