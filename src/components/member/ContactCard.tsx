import React, { useState } from 'react';
import { Mail, Phone, Edit2, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { memberService } from '../../services/memberService';

interface ContactCardProps {
  email: string;
  phone?: string | null;
  onUpdated?: () => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({ email, phone, onUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState(email);
  const [newPhone, setNewPhone] = useState(phone || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const cleanEmail = newEmail.trim().toLowerCase();
    const cleanPhone = newPhone.trim();

    if (!cleanEmail || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(cleanEmail)) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    if (cleanPhone.length < 7 || cleanPhone.length > 20) {
      setError('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    setSaving(true);
    try {
      await memberService.updateContact(cleanEmail, cleanPhone);
      setSuccess(true);
      setIsEditing(false);
      onUpdated?.();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث بيانات التواصل');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-3.5 shadow-md text-right">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Mail className="w-4 h-4 text-cyan-400" />
          <span>بيانات التواصل الرسمية</span>
        </h4>
        {!isEditing && (
          <button
            type="button"
            onClick={() => {
              setNewEmail(email);
              setNewPhone(phone || '');
              setError(null);
              setIsEditing(true);
            }}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>تعديل</span>
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        تُستخدم هذه البيانات لتلقي إشعارات القبول، رسائل التذكير بالفعاليات، واستعادة الحساب عند نسيان كلمة المرور.
      </p>

      {success && (
        <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>تم تحديث بيانات التواصل بنجاح ✓</span>
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!isEditing ? (
        <div className="space-y-2 pt-1 text-xs">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>البريد الإلكتروني:</span>
            </span>
            <span className="font-mono text-slate-200 dir-ltr text-left select-all">{email || '—'}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>رقم الجوال:</span>
            </span>
            <span className="font-mono text-slate-200 dir-ltr text-left select-all">{phone || 'غير مسجل'}</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <label className="block">
            <span className="block text-xs text-gray-300 mb-1 font-medium">البريد الإلكتروني الجديد</span>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono dir-ltr"
              placeholder="name@example.com"
            />
          </label>

          <label className="block">
            <span className="block text-xs text-gray-300 mb-1 font-medium">رقم الهاتف / الواتساب الجديد</span>
            <input
              type="tel"
              required
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 focus:outline-none text-white text-xs font-mono dir-ltr"
              placeholder="059xxxxxxx"
            />
          </label>

          <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
            <span>سيتم تحديث جهة الاتصال المعتمدة لملفك تلقائياً.</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ…' : 'حفظ التعديلات'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setError(null);
              }}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs cursor-pointer transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
