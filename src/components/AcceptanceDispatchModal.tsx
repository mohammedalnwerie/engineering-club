import React, { useState, useEffect } from 'react';
import type { StoredApplication } from '../types';
import { emailService, getAcceptanceType } from '../services/emailService';
import { effectiveCommittee } from '../data/committees';
import { dataService } from '../services/dataService';
import { normalizePhone, suggestEmailFix, validateEmail, validatePhone } from '../utils/validation';
import {
  X,
  Mail,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Send,
  AlertCircle,
  CreditCard,
  Pencil,
  FileText,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AcceptanceDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: StoredApplication | null;
  onViewBadge?: (app: StoredApplication) => void;
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' });

export const AcceptanceDispatchModal: React.FC<AcceptanceDispatchModalProps> = ({
  isOpen,
  onClose,
  app,
  onViewBadge,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [sentAt, setSentAt] = useState<string | undefined>(app?.acceptanceEmailSentAt);
  const [contact, setContact] = useState({ email: app?.email || '', phone: app?.phone || '' });
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [draft, setDraft] = useState(contact);
  const [contactError, setContactError] = useState<string | null>(null);
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Message draft editing
  const [customMessageBody, setCustomMessageBody] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [showDraftEditor, setShowDraftEditor] = useState(true);

  // Update draft whenever app or modal opens
  useEffect(() => {
    if (app && isOpen) {
      setContact({ email: app.email || '', phone: app.phone || '' });
      setSentAt(app.acceptanceEmailSentAt);
      const initial = emailService.formatAcceptanceEmail(app);
      setCustomMessageBody(initial.body);
      setCustomSubject(initial.subject);
      setStatus(null);
      setIsEditingContact(false);
      setShowDraftEditor(true);
    }
  }, [app?.id, isOpen]);

  if (!isOpen || !app) return null;

  // Messages and sending always use the latest corrected contact details.
  const current: StoredApplication = { ...app, ...contact };
  const emailProblem = validateEmail(contact.email);
  const acceptanceType = getAcceptanceType(current);

  const startEditing = () => {
    setDraft(contact);
    setContactError(null);
    setIsEditingContact(true);
  };

  const saveContact = async () => {
    const next = { email: draft.email.trim().toLowerCase(), phone: normalizePhone(draft.phone) };
    const problem = validateEmail(next.email) || validatePhone(next.phone, false);
    if (problem) {
      setContactError(problem);
      return;
    }
    setIsSavingContact(true);
    try {
      await dataService.updateApplicationContact(app.id, next);
      setContact(next);
      setIsEditingContact(false);
      setStatus(null);
      // Re-render draft body with new contact info
      const updatedFormatted = emailService.formatAcceptanceEmail({ ...current, ...next });
      setCustomMessageBody(updatedFormatted.body);
      setCustomSubject(updatedFormatted.subject);
    } catch (err) {
      setContactError(`تعذر الحفظ: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleResetDraft = () => {
    const fresh = emailService.formatAcceptanceEmail(current);
    setCustomMessageBody(fresh.body);
    setCustomSubject(fresh.subject);
  };

  const verifyUrl = `${window.location.origin}/?verify=${encodeURIComponent(current.studentId || current.id)}`;
  const committee = effectiveCommittee(app);
  const lastSentAt = sentAt || app.acceptanceEmailSentAt;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessageBody);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    setStatus(null);
    const result = await emailService.sendAcceptanceEmail(current, customMessageBody, customSubject);
    setStatus(result);
    if (result.sentAt) setSentAt(result.sentAt);
    else if (/عنوان البريد|غير صحيح|غير موجود/.test(result.message)) startEditing();
    setIsSending(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl glass-panel border border-white/10 p-6 sm:p-7 relative text-right animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-black text-white">إشعار الطالب بالقبول والاعتماد</h3>
        <p className="text-sm text-gray-400 mt-1 mb-5">راجع بيانات الطالب ومسودة الرسالة، ثم أرسل إشعار القبول والبطاقة.</p>

        {/* Student summary */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 mb-5 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="font-bold text-white text-base">{app.fullName}</div>
            {acceptanceType === 'leadership' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/30 text-xs font-bold shrink-0">
                اعتماد كادر قيادي
              </span>
            ) : acceptanceType === 'transferred' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-xs font-bold shrink-0">
                قبول وتحويل لعضو عام
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-xs font-bold shrink-0">
                مقبول
              </span>
            )}
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-gray-300">
            <span className="text-gray-500">الرقم الجامعي</span>
            <span dir="ltr" className="text-right">
              {app.studentId}
            </span>
            <span className="text-gray-500">اللجنة</span>
            <span>{committee}</span>
            {app.targetCommittee && app.targetCommittee !== committee && (
              <>
                <span className="text-gray-500">اللجنة المطلوبة</span>
                <span className="text-gray-400">{app.targetCommittee}</span>
              </>
            )}
            {app.organizationalRole && (
              <>
                <span className="text-gray-500">المسمى</span>
                <span>{app.organizationalRole}</span>
              </>
            )}
            {!isEditingContact && (
              <>
                <span className="text-gray-500">الإيميل</span>
                <span dir="ltr" className={`text-right break-all ${emailProblem ? 'text-red-300' : ''}`}>
                  {contact.email || '—'}
                </span>
                <span className="text-gray-500">الجوال</span>
                <span dir="ltr" className="text-right">
                  {contact.phone || '—'}
                </span>
              </>
            )}
          </div>

          {!isEditingContact && emailProblem && (
            <p role="alert" className="text-sm text-red-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>الإيميل مكتوب بشكل غير صحيح، صحّحه قبل الإرسال.</span>
            </p>
          )}

          {isEditingContact ? (
            <div className="pt-2 space-y-2.5 border-t border-white/10">
              <label className="block">
                <span className="block text-xs text-gray-400 mb-1">الإيميل</span>
                <input
                  type="email"
                  dir="ltr"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-sm text-left"
                />
              </label>
              {suggestEmailFix(draft.email) && (
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, email: suggestEmailFix(draft.email)! })}
                  className="text-sm text-amber-300 hover:text-amber-200 underline underline-offset-4 cursor-pointer"
                >
                  هل تقصد <span dir="ltr">{suggestEmailFix(draft.email)}</span>؟
                </button>
              )}
              <label className="block">
                <span className="block text-xs text-gray-400 mb-1">الجوال</span>
                <input
                  type="tel"
                  dir="ltr"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-sm text-left"
                />
              </label>
              {contactError && <p role="alert" className="text-sm text-red-300">{contactError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSavingContact}
                  onClick={() => void saveContact()}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-bold text-sm cursor-pointer"
                >
                  {isSavingContact ? 'جاري الحفظ…' : 'حفظ'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingContact(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="text-sm text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>تعديل الإيميل أو الجوال</span>
            </button>
          )}
        </div>

        {/* Message Draft Preview & Editor */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/10 mb-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowDraftEditor(!showDraftEditor)}
              className="flex items-center gap-2 text-sm font-bold text-white hover:text-cyan-300 cursor-pointer transition-colors"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>معاينة وتخصيص نص الرسالة قبل الإرسال</span>
              {showDraftEditor ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDraftEditor && (
              <button
                type="button"
                onClick={handleResetDraft}
                title="استعادة النص الافتراضي من القالب"
                className="text-xs text-gray-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>استعادة القالب</span>
              </button>
            )}
          </div>

          {showDraftEditor ? (
            <div className="space-y-2 pt-1 animate-in fade-in duration-200">
              <label className="block">
                <span className="block text-xs text-gray-400 mb-1">عنوان البريد (الموضوع):</span>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-xs"
                />
              </label>

              <label className="block">
                <span className="block text-xs text-gray-400 mb-1">نص الرسالة:</span>
                <textarea
                  rows={8}
                  value={customMessageBody}
                  onChange={(e) => setCustomMessageBody(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono leading-relaxed resize-y"
                />
              </label>
              <div className="p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-500/25 text-xs text-cyan-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>أي تعديل هنا يُعتمد فوراً ويُرسل نصياً إلى بريد الطالب عبر إيميل النادي أو واتساب أو Gmail.</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
              {customMessageBody.replace(/\n+/g, ' ')}
            </p>
          )}
        </div>

        {/* Club email (primary) */}
        <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.04] mb-5 space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-cyan-300" />
            <div className="font-bold text-white">إيميل القبول والاعتماد من إيميل النادي</div>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            تصل للطالب رسالة تهنئة رسمية تتضمن بيانات العضوية، كود الدخول الأول، ورابط استعراض البطاقة.
          </p>

          {lastSentAt && (
            <div className="text-sm text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>أُرسل سابقاً بتاريخ {formatDateTime(lastSentAt)}</span>
            </div>
          )}

          {status && (
            <div
              role={status.success ? 'status' : 'alert'}
              className={`p-3 rounded-xl text-sm flex items-start gap-2 ${
                status.success
                  ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-200'
                  : 'bg-red-950/50 border border-red-500/40 text-red-200'
              }`}
            >
              {status.success ? (
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{status.message}</span>
            </div>
          )}

          <button
            type="button"
            disabled={isSending || isEditingContact || Boolean(emailProblem)}
            onClick={handleSendEmail}
            className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-sm cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>
              {isSending
                ? 'جاري الإرسال…'
                : lastSentAt
                  ? 'إعادة إرسال الإيميل'
                  : `إرسال الإيميل إلى ${contact.email || 'الطالب'}`}
            </span>
          </button>
        </div>

        {/* Other channels */}
        <div className="text-sm text-gray-400 mb-2">طرق إشعار بديلة</div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => emailService.openWhatsAppChat(current, customMessageBody)}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span>إرسال نص الرسالة عبر واتساب</span>
            </span>
            <ExternalLink className="w-4 h-4 opacity-70" />
          </button>

          <button
            type="button"
            onClick={() => emailService.openGmailWebmail(current, customSubject, customMessageBody)}
            className="w-full py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-bold text-sm cursor-pointer flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>فتح الرسالة في Gmail يدوياً</span>
            </span>
            <ExternalLink className="w-4 h-4 opacity-70" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-sm cursor-pointer border border-white/10 flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'تم النسخ' : 'نسخ رابط البطاقة'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-sm cursor-pointer border border-white/10 flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedMsg ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedMsg ? 'تم النسخ' : 'نسخ نص الرسالة'}</span>
            </button>
          </div>

          {onViewBadge && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewBadge(current);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-sm cursor-pointer border border-white/10 flex items-center justify-center gap-1.5 transition-colors"
            >
              <CreditCard className="w-4 h-4 text-cyan-300" />
              <span>معاينة البطاقة</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
