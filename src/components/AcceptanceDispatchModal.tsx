import React, { useState } from 'react';
import type { StoredApplication } from '../types';
import { emailService } from '../services/emailService';
import { sound } from '../utils/soundEngine';
import {
  X,
  Mail,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Send,
  AlertCircle
} from 'lucide-react';

interface AcceptanceDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: StoredApplication | null;
  onViewBadge?: (app: StoredApplication) => void;
}

export const AcceptanceDispatchModal: React.FC<AcceptanceDispatchModalProps> = ({
  isOpen,
  onClose,
  app,
  onViewBadge
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [isSendingAuto, setIsSendingAuto] = useState(false);
  const [autoStatus, setAutoStatus] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen || !app) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://engineering-club-phi.vercel.app';
  const verifyUrl = `${origin}/?verify=${encodeURIComponent(app.studentId || app.id)}`;
  const authCode = `UP-ENG-${(app.id || 'VALID').slice(-8).toUpperCase()}`;

  const handleCopyLink = () => {
    sound.playClick();
    navigator.clipboard.writeText(verifyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = () => {
    sound.playClick();
    const { body } = emailService.formatAcceptanceEmail(app);
    navigator.clipboard.writeText(body);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  const handleSendAutoEmail = async () => {
    sound.playClick();
    setIsSendingAuto(true);
    setAutoStatus(null);
    try {
      const res = await emailService.sendAutomatedEmail(app);
      if (res.success) {
        sound.playSuccess();
      } else {
        sound.playError();
      }
      setAutoStatus(res);
    } catch {
      sound.playError();
      setAutoStatus({ success: false, message: 'حدث خطأ غير متوقع أثناء محاولة الإرسال.' });
    } finally {
      setIsSendingAuto(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl glass-panel border border-cyan-500/40 p-6 sm:p-7 shadow-[0_0_60px_rgba(0,240,255,0.25)] relative text-right animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
          <Sparkles className="w-4 h-4" />
          <span>مركز إشعار القبول والبطاقة الرقمية // DISPATCH PASS</span>
        </div>
        <h3 className="text-xl font-black text-white mb-1">
          إرسال رسالة القبول والبطاقة للطالب
        </h3>
        <p className="text-xs text-gray-400 mb-5">
          تم اعتماد عضوية الطالب بنجاح! يمكنك إرسال بطاقته الرقمية ورسالة التهنئة الرسمية له بنقرة واحدة.
        </p>

        {/* Student Summary Card */}
        <div className="p-4 rounded-2xl bg-black/50 border border-white/10 mb-5 text-xs font-mono space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <div>
              <span className="font-sans font-bold text-white text-sm">{app.fullName}</span>
              <div className="text-[11px] text-cyan-300">الرقم الجامعي: {app.studentId}</div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              عضو معتمد
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-sans pt-1">
            <div>
              <span className="text-gray-500">الكلية: </span>
              <span className="text-gray-300 font-medium">{app.college}</span>
            </div>
            <div>
              <span className="text-gray-500">اللجنة: </span>
              <span className="text-emerald-400 font-bold">{app.targetCommittee}</span>
            </div>
            <div>
              <span className="text-gray-500">الإيميل: </span>
              <span className="text-gray-300 font-mono text-[10px]">{app.email}</span>
            </div>
            <div>
              <span className="text-gray-500">الهاتف / واتساب: </span>
              <span className="text-gray-300 font-mono text-[10px]">{app.phone || 'غير مسجل'}</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-white/5 flex items-center justify-between font-mono text-[10px]">
              <span className="text-gray-500">كود التوثيق المعتمد:</span>
              <span className="text-cyan-400 font-bold">{authCode}</span>
            </div>
          </div>
        </div>

        {/* Direct Card Link Box */}
        <div className="mb-5">
          <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
            🔗 رابط استعراض والتحقق من البطاقة الرقمية المباشر للطالب:
          </label>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
            <input
              type="text"
              readOnly
              value={verifyUrl}
              className="flex-1 bg-transparent text-cyan-300 text-xs focus:outline-none truncate text-left"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-sans font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'تم النسخ' : 'نسخ الرابط'}</span>
            </button>
          </div>
        </div>

        {/* Auto Email Status Notification */}
        {autoStatus && (
          <div
            className={`p-3.5 rounded-xl mb-4 text-xs flex items-start gap-2 animate-in fade-in ${
              autoStatus.success
                ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/50 border border-amber-500/40 text-amber-300'
            }`}
          >
            {autoStatus.success ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="leading-relaxed">{autoStatus.message}</div>
          </div>
        )}

        {/* 1-Click Dispatch Channels */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-mono uppercase text-gray-400 mb-1">// قنوات الإرسال المباشرة</div>

          {/* WhatsApp 1-Click Send */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              emailService.openWhatsAppChat(app);
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs cursor-pointer shadow-lg flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span>إرسال بطاقة القبول عبر واتساب (WhatsApp Direct) 📲</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
          </button>

          {/* Gmail Webmail 1-Click Send */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              emailService.openGmailWebmail(app);
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600/90 via-rose-600 to-red-500/90 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs cursor-pointer shadow-lg flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>فتح رسالة القبول المجهزة في Gmail (بنقرة واحدة) ✉️</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-red-200" />
          </button>

          {/* Automated Background Send via EmailJS */}
          <button
            type="button"
            disabled={isSendingAuto}
            onClick={handleSendAutoEmail}
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 font-bold text-xs cursor-pointer flex items-center justify-between transition-all disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {isSendingAuto
                  ? 'جارٍ إرسال الإيميل التلقائي في الخلفية...'
                  : 'إرسال إيميل تلقائي فوري في الخلفية (EmailJS API) ⚡'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400/80">تلقائي</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Copy Full Message */}
            <button
              type="button"
              onClick={handleCopyMessage}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs cursor-pointer border border-white/10 flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedMsg ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMsg ? 'تم نسخ النص' : 'نسخ الرسالة كاملة'}</span>
            </button>

            {/* View Badge */}
            {onViewBadge && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onClose();
                  onViewBadge(app);
                }}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs cursor-pointer border border-white/10 flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>معاينة البطاقة 🪪</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
