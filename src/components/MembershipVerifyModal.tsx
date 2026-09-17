import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { StoredApplication } from '../types';
import { exportCardAsImage, printCardAsPdf } from '../utils/cardExporter';
import { MemberCard } from './MemberCard';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Printer,
  Copy,
  Download,
  ArrowLeft,
  Award
} from 'lucide-react';
import { CommitteeBadgeModal } from './CommitteeBadgeModal';

interface MembershipVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const MembershipVerifyModal: React.FC<MembershipVerifyModalProps> = ({
  isOpen,
  onClose,
  initialCode = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialCode);
  const [searched, setSearched] = useState(false);
  const [matchedApp, setMatchedApp] = useState<StoredApplication | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showCommitteeBadge, setShowCommitteeBadge] = useState(false);

  const [isSearching, setIsSearching] = useState(false);

  async function performSearch(query: string) {
    const q = query.trim();
    if (!q) {
      setMatchedApp(null);
      setSearched(false);
      return;
    }

    setIsSearching(true);
    try {
      const found = await dataService.verifyMember(q);
      setMatchedApp(
        found
          ? {
              fullName: found.fullName,
              studentId: found.studentId,
              email: '',
              phone: '',
              academicYear: found.academicYear || '',
              college: found.college || '',
              major: found.major || '',
              skills: found.skills || [],
              personalStatement: '',
              targetCommittee: found.targetCommittee || '',
              weeklyCommitmentHours: 0,
              id: found.id,
              status: found.status,
              submittedAt: found.submittedAt || '',
            }
          : null
      );
      setSearched(true);
    } catch (err) {
      alert(`تعذر التحقق حالياً: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
    } finally {
      setIsSearching(false);
    }
  }

  useEffect(() => {
    if (initialCode) {
      setSearchQuery(initialCode);
      void performSearch(initialCode);
    }
  }, [initialCode]);

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void performSearch(searchQuery);
  };

  const authCode = matchedApp
    ? `UP-ENG-${(matchedApp.id || 'VERIFIED').slice(-8).toUpperCase()}`
    : '';

  const verifyUrl = matchedApp
    ? `${window.location.origin}/?verify=${encodeURIComponent(matchedApp.studentId || matchedApp.id)}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-lg rounded-3xl glass-panel border border-emerald-500/40 p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.9)] text-right animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            onClose();
          }}
          className="absolute top-5 left-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="font-mono text-[11px] text-emerald-400 font-bold">
              VERIFICATION PORTAL // بوابة الاعتماد
            </div>
            <h3 className="text-xl font-extrabold text-white">التحقق من بطاقة العضوية الرسمية</h3>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleFormSubmit} className="mb-6">
          <label className="block text-xs font-mono text-gray-300 mb-2">
            ابحث بالرقم الجامعي أو كود التحقق (UP-ENG-XXXX):
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="مثال: 120200456 أو كود الاعتماد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-16 rounded-xl bg-black/50 border border-white/10 focus:border-emerald-400 focus:outline-none text-white text-sm"
              dir="auto"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="disabled:opacity-60 absolute left-1.5 px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs cursor-pointer transition-all flex items-center gap-1 shadow"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isSearching ? '...' : 'تحقق'}</span>
            </button>
          </div>
        </form>

        {/* Search Results */}
        {searched && (
          <div className="animate-in fade-in duration-200">
            {matchedApp ? (
              matchedApp.status === 'تم القبول' ? (
                /* Verified Active Member Card */
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="p-3.5 rounded-2xl bg-[#7F1AB2]/20 border border-[#7F1AB2]/40 text-[#3FE7E3] flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <CheckCircle2 className="w-5 h-5 text-[#35BC2B] shrink-0" />
                      <span>عضوية مقبولة ومفعّلة</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#35BC2B] px-2.5 py-0.5 rounded-full bg-[#35BC2B]/10 border border-[#35BC2B]/30 font-bold">
                      نشطة
                    </span>
                  </div>

                  {/* The Official Card (Vertical Portrait Ratio) */}
                  <MemberCard
                    id="verified-member-card"
                    badge="عضو في النادي"
                    name={matchedApp.fullName}
                    subtitle={`الرقم الجامعي: ${matchedApp.studentId}`}
                    fields={[
                      { label: 'التخصص', value: (matchedApp.major || '').replace(/^(تخصص\s+|كلية\s+)/, '').trim() },
                      { label: 'السنة الدراسية', value: matchedApp.academicYear },
                      { label: 'اللجنة / المسار', value: matchedApp.targetCommittee },
                    ]}
                    qrValue={verifyUrl}
                    code={authCode}
                  />
                  {/* Actions: Export PNG & Print PDF */}
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={async () => {
                        setIsExporting(true);
                        const cleanId = matchedApp.studentId || 'PASS';
                        await exportCardAsImage('verified-member-card', `UP-Member-Pass-${cleanId}.png`);
                        setIsExporting(false);
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black font-extrabold text-xs cursor-pointer shadow flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isExporting ? 'جاري تجهيز الصورة...' : 'تحميل البطاقة كصورة رسمية عالية الدقة (PNG) 🖼️'}</span>
                    </button>

                    {matchedApp.targetCommittee && !matchedApp.targetCommittee.includes('عامة') && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowCommitteeBadge(true);
                        }}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-cyan-400/50 text-cyan-300 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 shadow transition-all"
                      >
                        <Award className="w-4 h-4 text-cyan-400" />
                        <span>عرض كرت عضو اللجنة التنفيذية الرسمي ({matchedApp.targetCommittee}) 🪪</span>
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => printCardAsPdf()}
                        className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>طباعة / حفظ كـ PDF 📄</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(verifyUrl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 3000);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-gray-300 text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5"
                        title="نسخ رابط التحقق المباشر"
                      >
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Found but Pending */
                <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">
                    طلب الانضمام قيد المراجعة والتدقيق
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed max-w-sm mx-auto">
                    الطلب الخاص بالمهندس/ـة <span className="text-white font-bold">({matchedApp.fullName})</span> تم استلامه بنجاح وهو قيد الدراسة من قِبل إدارة النادي. ستصدر البطاقة الرسمية فور الاعتماد.
                  </p>
                  <div className="inline-block font-mono text-xs text-amber-400 px-3 py-1 rounded bg-amber-900/60 border border-amber-500/30">
                    الحالة: {matchedApp.status}
                  </div>
                </div>
              )
            ) : (
              /* Not Found */
              <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">لم يتم العثور على سجل عضوية</h4>
                <p className="text-xs text-gray-300 leading-relaxed max-w-sm mx-auto">
                  لم يتم العثور على أي بطاقة أو طلب مسجل بالرقم (<span className="text-white font-mono">{searchQuery}</span>). يرجى التأكد من الرقم المدخل أو تقديم طلب انضمام جديد.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    const target = document.querySelector('#join');
                    target?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 transition-all shadow mt-2"
                >
                  <span>تقديم طلب انضمام للنادي</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        {!searched && (
          <div className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-gray-400">
            💡 يمكن لأي جهة أو مشرف مسح رمز الاستجابة السريعة (QR Code) الموجود على البطاقة بكاميرا الهاتف للتحقق المباشر من صحة وسريان العضوية.
          </div>
        )}
      </div>

      {showCommitteeBadge && matchedApp && (
        <CommitteeBadgeModal
          isOpen={showCommitteeBadge}
          app={matchedApp}
          onClose={() => setShowCommitteeBadge(false)}
        />
      )}
    </div>
  );
};
