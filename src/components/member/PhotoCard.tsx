import React, { useRef, useState } from 'react';
import { Camera, Trash2, UserRound } from 'lucide-react';
import { memberService } from '../../services/memberService';
import { compressImage } from '../../utils/image';

/**
 * The member's own card photo — optional. Without it the card shows their
 * initials, so nobody is forced to upload anything.
 */
export const PhotoCard: React.FC<{ photoUrl?: string | null; name: string }> = ({ photoUrl, name }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      // Square-ish and small: the card prints it at 96px.
      const compressed = await compressImage(file, 420, 0.82);
      if (compressed.length > 400_000) {
        setError('الصورة كبيرة. جرّب صورة أوضح بحجم أصغر.');
        return;
      }
      await memberService.setPhoto(compressed);
      setDone('تم حفظ صورتك على البطاقة.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر رفع الصورة');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      await memberService.setPhoto(null);
      setDone('تم حذف الصورة. بتظهر حروف اسمك على البطاقة.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حذف الصورة');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] space-y-3">
      <div className="flex items-start gap-3">
        <span className="w-16 h-16 rounded-2xl overflow-hidden bg-white/[0.06] border border-white/10 shrink-0 flex items-center justify-center">
          {photoUrl ? (
            <img src={photoUrl} alt={`صورة ${name}`} className="w-full h-full object-cover" />
          ) : (
            <UserRound className="w-7 h-7 text-gray-500" />
          )}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-white">صورتك على البطاقة</h3>
          <p className="text-sm text-gray-300 mt-1 leading-relaxed">
            {photoUrl
              ? 'صورتك ظاهرة على بطاقتك. تقدر تبدّلها أو تحذفها وقت ما تحب.'
              : 'اختيارية. بدونها تظهر حروف اسمك على البطاقة. اختر صورة واضحة للوجه.'}
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      {done && !error && <p className="text-sm text-emerald-300">{done}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-sm font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-colors"
        >
          <Camera className="w-4 h-4 text-cyan-300" />
          <span>{busy ? 'جاري الحفظ…' : photoUrl ? 'تبديل الصورة' : 'رفع صورة'}</span>
        </button>

        {photoUrl && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void remove()}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-200 text-sm font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>حذف الصورة</span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onClick={(e) => {
            (e.target as HTMLInputElement).value = '';
          }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </div>

      <p className="text-xs text-gray-500">الصورة تظهر على بطاقتك فقط، ولا تظهر في صفحة التحقق العامة.</p>
    </section>
  );
};
