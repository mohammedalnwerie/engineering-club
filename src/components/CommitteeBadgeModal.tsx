import React, { useState } from 'react';
import type { StoredApplication } from '../types';
import { sound } from '../utils/soundEngine';
import { X, Printer, Download, Sparkles, Copy, Users } from 'lucide-react';
import { exportCardAsImage, printCardAsPdf } from '../utils/cardExporter';

interface CommitteeBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: StoredApplication | null;
}

export const CommitteeBadgeModal: React.FC<CommitteeBadgeModalProps> = ({ isOpen, onClose, app }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !app) return null;

  const committeeRaw = app.targetCommittee || '';
  const isTraining = committeeRaw.includes('تدريب') || committeeRaw.includes('علاقات') || committeeRaw.includes('training');
  const isMedia = committeeRaw.includes('إعلام') || committeeRaw.includes('media');

  let committeeName = 'لجنة الفعاليات والأنشطة';
  let committeeCode = 'EVT';
  let committeeSubtitle = 'EVENTS & ACTIVITIES TASKFORCE';
  let committeeDuty = 'تنظيم وإدارة الفعاليات والورش الهندسية، الهاكاثونات وإدارة الحشود الميدانية.';

  if (isTraining) {
    committeeName = 'لجنة العلاقات العامة والتدريب';
    committeeCode = 'REL';
    committeeSubtitle = 'PARTNERSHIPS & TRAINING TASKFORCE';
    committeeDuty = 'التنسيق مع المدربين والمؤسسات الهندسية الشريكة وتطوير المسارات التدريبية.';
  } else if (isMedia) {
    committeeName = 'اللجنة الإعلامية والإنتاج المرئي';
    committeeCode = 'MED';
    committeeSubtitle = 'MEDIA & PRODUCTION TASKFORCE';
    committeeDuty = 'صناعة المحتوى الرقمي، التصميم والمونتاج، والتغطيات الإعلامية لكافة الأنشطة.';
  }

  const appAny = app as any;
  let organizationalRole = appAny.organizationalRole || '';
  if (!organizationalRole) {
    const textToCheck = `${app.targetCommittee || ''} ${app.skills?.join(' ') || ''} ${app.personalStatement || ''}`.toLowerCase();
    if (textToCheck.includes('تصوير') || textToCheck.includes('مصور') || textToCheck.includes('photo')) {
      organizationalRole = 'مصور وموثق ميداني';
    } else if (textToCheck.includes('تصميم') || textToCheck.includes('ديزاين') || textToCheck.includes('design')) {
      organizationalRole = 'مصمم ومبدع محتوى';
    } else if (textToCheck.includes('تنظيم') || textToCheck.includes('حشود') || textToCheck.includes('لوجست')) {
      organizationalRole = 'مسؤول تنظيم وميدان';
    } else if (textToCheck.includes('علاقات') || textToCheck.includes('تواصل')) {
      organizationalRole = 'مسؤول علاقات وتنسيق';
    } else {
      organizationalRole = 'عضو فريق العمل التنفيذي';
    }
  }

  const serialNumber = `UP-COMM-${committeeCode}-2026-${(app.studentId || app.id).slice(-4).toUpperCase()}`;
  const verifyUrl = `${window.location.origin}/?verify=${encodeURIComponent(app.studentId || app.id)}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg overflow-y-auto">
      <div
        className="w-full max-w-md rounded-3xl glass-panel border border-[#7F1AB2]/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(127,26,178,0.25)] relative text-right animate-in zoom-in-95 duration-200"
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

        {/* Modal Top Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#381C4A]/80 border border-[#3FE7E3]/30 text-[#3FE7E3] font-mono text-xs mb-2 shadow-sm">
            <Users className="w-3.5 h-3.5 text-[#3FE7E3]" />
            <span>بطاقة عضوية لجنة تنفيذية // COMMITTEE MEMBER PASS</span>
          </div>
          <h3 className="text-xl font-black text-white">بطاقة عضو اللجنة الرسمية</h3>
          <p className="text-xs text-gray-400 mt-0.5">النادي الهندسي — جامعة فلسطين</p>
        </div>

        {/* The Official Printable Committee Member Badge */}
        <div
          id="printable-committee-badge"
          className="w-full rounded-3xl p-6 bg-gradient-to-b from-[#140C38] via-[#0E082C] to-[#08041D] border-2 border-[#7F1AB2]/50 shadow-[0_0_40px_rgba(127,26,178,0.25)] relative overflow-hidden font-mono text-right"
        >
          {/* Decorative Glows */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#7F1AB2]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#3FE7E3]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Header: Prominent Enlarged Emblem & Official Club Identity (No extra years or cadres) */}
          <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-gradient-to-b from-white/[0.14] via-white/[0.04] to-white/[0.01] border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-md flex items-center justify-center shrink-0">
                <img
                  src="/brand/emblem.png"
                  alt="شعار النادي الهندسي"
                  className="h-10 w-10 sm:h-11 sm:w-11 object-contain filter drop-shadow-[0_0_1.5px_rgba(255,255,255,0.75)] drop-shadow-[0_4px_12px_rgba(63,231,227,0.35)] transition-transform hover:scale-105"
                />
              </div>
              <div>
                <div className="text-sm sm:text-base font-black text-white font-sans tracking-wide">
                  النادي الهندسي
                </div>
                <div className="text-[10px] font-mono text-[#3FE7E3] tracking-wider uppercase font-bold mt-0.5">
                  ENGINEERING CLUB
                </div>
                <div className="text-[9px] text-gray-400 font-sans">
                  جامعة فلسطين
                </div>
              </div>
            </div>
            <div className="text-left">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#7F1AB2]/25 text-[#D1B5E3] border border-[#7F1AB2]/40 font-sans shadow-sm">
                <Sparkles className="w-3 h-3 text-[#3FE7E3]" />
                <span>اعتماد رسمي</span>
              </span>
            </div>
          </div>

          {/* Committee Name & Organizational Role Ribbon */}
          <div className="mb-4 p-3 rounded-2xl bg-black/60 border border-[#7F1AB2]/30 text-center">
            <div className="text-[10px] text-gray-400 uppercase font-sans">اللجنة التنفيذية:</div>
            <div className="text-sm sm:text-base font-black text-[#3FE7E3] font-sans mt-0.5">
              {committeeName}
            </div>
            <div className="text-[9px] text-gray-400 font-mono mt-0.5">{committeeSubtitle}</div>
            
            {/* Organizational Role Under Committee */}
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-center gap-2">
              <span className="text-[10px] text-gray-400 font-sans">المسمى التنظيمي:</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#35BC2B] px-2.5 py-0.5 rounded-full bg-[#35BC2B]/10 border border-[#35BC2B]/30 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-[#35BC2B] animate-pulse" />
                {organizationalRole}
              </span>
            </div>
          </div>

          {/* Member Identity & Details */}
          <div className="mb-4">
            <div className="text-[10px] text-gray-400 font-sans">اسم المهندس/ـة:</div>
            <div className="text-lg font-black text-white font-sans leading-snug mt-0.5">
              {app.fullName}
            </div>
            <div className="text-xs text-[#3FE7E3] font-bold mt-1">
              الرقم الجامعي: {app.studentId || 'UP-STUDENT'}
            </div>
          </div>

          {/* Academic Specialization & Scope (Cleaned: No College, No Academic Year) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-black/50 border border-white/10 mb-4 text-xs font-sans">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">التخصص الهندسي:</span>
              <span className="font-bold text-[#3FE7E3]">{app.major}</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1.5 border-t border-white/5">
              <span className="text-gray-400">المسمى التنظيمي:</span>
              <span className="font-bold text-[#35BC2B]">{organizationalRole}</span>
            </div>
          </div>

          {/* Committee Taskforce Mission */}
          <div className="mb-4 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] font-sans">
            <div className="text-gray-400 text-[10px] mb-1 font-mono">طبيعة المهام والمسؤوليات:</div>
            <div className="text-gray-200 leading-relaxed font-light">{committeeDuty}</div>
          </div>

          {/* Verification Barcode, Serial & QR */}
          <div className="pt-3 border-t border-dashed border-white/20 flex items-center justify-between">
            <div className="text-[9px] text-gray-400 leading-tight">
              <div className="text-white font-bold mb-0.5">TASKFORCE PASS ID:</div>
              <div className="text-[#3FE7E3] font-bold">{serialNumber}</div>
              <div className="text-[8px] text-gray-500 mt-1">OFFICIALLY ACCREDITED BY ENGINEERING CLUB</div>
            </div>
            {/* Scannable Verification QR Code */}
            <div className="p-1 rounded-xl bg-white flex items-center justify-center shadow">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&format=svg&data=${encodeURIComponent(verifyUrl)}`}
                alt="Verification QR"
                className="w-11 h-11 object-contain"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons: Export PNG & Print PDF */}
        <div className="flex flex-col gap-2.5 mt-6">
          <button
            type="button"
            disabled={isExporting}
            onClick={async () => {
              setIsExporting(true);
              const cleanName = app.fullName.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '-');
              await exportCardAsImage('printable-committee-badge', `UP-Committee-Badge-${cleanName}.png`);
              setIsExporting(false);
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-extrabold text-xs cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'جاري تجهيز الصورة...' : 'تحميل كرت عضو اللجنة كصورة رسمية (PNG) 🖼️'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => printCardAsPdf()}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>طباعة / حفظ كـ PDF 📄</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playSuccess();
                const text = `🎉 تهانينا يا م. ${app.fullName}!\nتم اعتمادك رسمياً كعضو في (${committeeName}) بالنادي الهندسي بجامعة فلسطين.\nكود الاعتماد: ${serialNumber}\nأهلاً بك معنا في قيادة وتنفيذ مبادرات النادي! 🚀`;
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-gray-300 text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5"
              title="نسخ رسالة التكليف باللجنة"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>{copied ? 'تم النسخ!' : 'نسخ التكليف'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
