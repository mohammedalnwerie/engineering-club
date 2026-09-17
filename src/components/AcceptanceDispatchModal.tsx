import React, { useState } from 'react';
import type { StoredApplication } from '../types';
import { emailService } from '../services/emailService';
import { effectiveCommittee } from '../data/committees';
import { X, Mail, MessageCircle, Copy, Check, ExternalLink, ShieldCheck, Send, AlertCircle, CreditCard } from 'lucide-react';

interface AcceptanceDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: StoredApplication | null;
  onViewBadge?: (app: StoredApplication) => void;
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' });

export const AcceptanceDispatchModal: React.FC<AcceptanceDispatchModalProps> = ({ isOpen, onClose, app, onViewBadge }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [sentAt, setSentAt] = useState<string | undefined>(app?.acceptanceEmailSentAt);

  if (!isOpen || !app) return null;

  const verifyUrl = `${window.location.origin}/?verify=${encodeURIComponent(app.studentId || app.id)}`;
  const committee = effectiveCommittee(app);
  const lastSentAt = sentAt || app.acceptanceEmailSentAt;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(emailService.formatAcceptanceEmail(app).body);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    setStatus(null);
    const result = await emailService.sendAcceptanceEmail(app);
    setStatus(result);
    if (result.sentAt) setSentAt(result.sentAt);
    setIsSending(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
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

        <h3 className="text-xl font-black text-white">إشعار الطالب بالقبول</h3>
        <p className="text-sm text-gray-400 mt-1 mb-5">راجع البيانات، ثم أرسل رسالة القبول ورابط البطاقة.</p>

        {/* Student summary */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 mb-5 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="font-bold text-white text-base">{app.fullName}</div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-xs font-bold shrink-0">
              مقبول
            </span>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-gray-300">
            <span className="text-gray-500">الرقم الجامعي</span>
            <span dir="ltr" className="text-right">{app.studentId}</span>
            <span className="text-gray-500">اللجنة</span>
            <span>{committee}</span>
            {app.organizationalRole && (
              <>
                <span className="text-gray-500">المسمى</span>
                <span>{app.organizationalRole}</span>
              </>
            )}
            <span className="text-gray-500">الإيميل</span>
            <span dir="ltr" className="text-right break-all">{app.email || '—'}</span>
            <span className="text-gray-500">الجوال</span>
            <span dir="ltr" className="text-right">{app.phone || '—'}</span>
          </div>
        </div>

        {/* Club email (primary) */}
        <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.04] mb-5 space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-cyan-300" />
            <div className="font-bold text-white">إيميل القبول من إيميل النادي</div>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            تصل للطالب رسالة تهنئة فيها لجنته ومسماه وكود التحقق وزر لفتح بطاقته.
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
            disabled={isSending || !app.email}
            onClick={handleSendEmail}
            className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-sm cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>
              {isSending ? 'جاري الإرسال…' : lastSentAt ? 'إعادة إرسال الإيميل' : `إرسال الإيميل إلى ${app.email || 'الطالب'}`}
            </span>
          </button>
        </div>

        {/* Other channels */}
        <div className="text-sm text-gray-400 mb-2">طرق أخرى</div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => emailService.openWhatsAppChat(app)}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span>إرسال عبر واتساب</span>
            </span>
            <ExternalLink className="w-4 h-4 opacity-70" />
          </button>

          <button
            type="button"
            onClick={() => emailService.openGmailWebmail(app)}
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
                onViewBadge(app);
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
