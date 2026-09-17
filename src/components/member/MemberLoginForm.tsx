import React, { useState } from 'react';
import { AlertCircle, KeyRound, LogIn } from 'lucide-react';
import { memberService, type MemberProfile } from '../../services/memberService';
import { normalizeCode, validateStudentId } from '../../utils/validation';

interface MemberLoginFormProps {
  onSuccess: (profile: MemberProfile) => void;
  submitLabel?: string;
}

export const MemberLoginForm: React.FC<MemberLoginFormProps> = ({ onSuccess, submitLabel = 'دخول' }) => {
  const [studentId, setStudentId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idProblem = validateStudentId(studentId);
    if (idProblem) {
      setError(idProblem);
      return;
    }
    if (code.trim().length < 8) {
      setError('اكتب كلمة المرور، أو رمز البطاقة كاملاً إذا لسه ما عيّنت كلمة مرور (مثال: UP-3F9A-C21D)');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      onSuccess(await memberService.login(studentId, code));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="member-student-id" className="block text-sm text-gray-300 mb-1.5">
          الرقم الجامعي
        </label>
        <input
          id="member-student-id"
          type="text"
          inputMode="numeric"
          autoComplete="username"
          placeholder="120220145"
          value={studentId}
          onChange={(e) => {
            setStudentId(normalizeCode(e.target.value));
            setError(null);
          }}
          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-base text-left"
          dir="ltr"
        />
      </div>

      <div>
        <label htmlFor="member-code" className="block text-sm text-gray-300 mb-1.5">
          كلمة المرور أو رمز البطاقة
        </label>
        <input
          id="member-code"
          type="password"
          autoComplete="current-password"
          autoCapitalize="characters"
          placeholder="كلمة المرور أو UP-XXXX-XXXX"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-base text-left"
          dir="ltr"
        />
        <p className="text-xs text-gray-400 mt-1.5 flex items-start gap-1.5 leading-relaxed">
          <KeyRound className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            أول مرة؟ ادخل برمز البطاقة اللي وصلك في إيميل القبول، وبعدها عيّن كلمة مرور خاصة فيك — لأن الرمز مطبوع على
            البطاقة ويقدر يشوفه غيرك.
          </span>
        </p>
      </div>

      {error && (
        <p role="alert" className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 rounded-xl font-bold text-base text-white bg-gradient-to-r from-[#7F1AB2] to-[#6F3993] hover:from-[#A26CC6] hover:to-[#7F1AB2] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer transition-all"
      >
        <LogIn className="w-5 h-5" />
        <span>{isLoading ? 'جاري الدخول…' : submitLabel}</span>
      </button>
    </form>
  );
};
