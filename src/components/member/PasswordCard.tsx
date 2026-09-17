import React, { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { memberService } from '../../services/memberService';

// The card code is printed on the membership card, so anyone who sees the card
// could sign in. Each member sets a password once, and the code stops working.

export const PasswordCard: React.FC<{ passwordSet: boolean }> = ({ passwordSet }) => {
  const [open, setOpen] = useState(!passwordSet);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('كلمة المرور 8 خانات على الأقل');
    if (password !== confirm) return setError('كلمتا المرور غير متطابقتين');
    setSaving(true);
    setError(null);
    try {
      await memberService.setPassword(password);
      setPassword('');
      setConfirm('');
      setDone(true);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ كلمة المرور');
    } finally {
      setSaving(false);
    }
  };

  const tone = passwordSet ? 'border-white/10 bg-white/[0.03]' : 'border-amber-500/40 bg-amber-500/[0.06]';

  return (
    <section className={`p-5 rounded-2xl border ${tone} space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {passwordSet ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <KeyRound className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className="text-lg font-bold text-white">كلمة مرور حسابك</h3>
            <p className="text-sm text-gray-300 mt-1 leading-relaxed">
              {passwordSet
                ? 'حسابك محمي بكلمة مرور. تقدر تغيّرها وقت ما تحب.'
                : 'رمز البطاقة مطبوع على بطاقتك ويقدر يشوفه أي حد. عيّن كلمة مرور، وبعدها ما حدا بيقدر يدخل حسابك بالرمز.'}
            </p>
          </div>
        </div>
        {passwordSet && !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-sm text-cyan-300 hover:text-white underline underline-offset-4 cursor-pointer shrink-0"
          >
            تغيير
          </button>
        )}
      </div>

      {done && !open && <p className="text-sm text-emerald-300">تم حفظ كلمة المرور. استخدمها في الدخول من الآن.</p>}

      {open && (
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="member-new-password" className="block text-sm text-gray-300 mb-1.5">
                كلمة المرور الجديدة
              </label>
              <input
                id="member-new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-base text-left"
                dir="ltr"
              />
            </div>
            <div>
              <label htmlFor="member-confirm-password" className="block text-sm text-gray-300 mb-1.5">
                تأكيد كلمة المرور
              </label>
              <input
                id="member-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-base text-left"
                dir="ltr"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#7F1AB2] to-[#6F3993] hover:from-[#A26CC6] hover:to-[#7F1AB2] disabled:opacity-60 cursor-pointer transition-colors"
            >
              {saving ? 'جاري الحفظ…' : 'حفظ كلمة المرور'}
            </button>
            {passwordSet && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white cursor-pointer"
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
};
