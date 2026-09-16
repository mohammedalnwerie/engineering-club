import React from 'react';
import type { LeaderMember } from '../types';
import { sound } from '../utils/soundEngine';
import { X, ShieldCheck, Printer, Award, Sparkles, Download } from 'lucide-react';
import { exportCardAsImage, printCardAsPdf } from '../utils/cardExporter';

interface ExecutiveBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  leader: LeaderMember | null;
}

export const ExecutiveBadgeModal: React.FC<ExecutiveBadgeModalProps> = ({ isOpen, onClose, leader }) => {
  if (!isOpen || !leader) return null;

  const isExecutive = leader.tier === 'executive';
  const badgeSerial = `UP-EXEC-2026-${leader.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`;
  const [isExporting, setIsExporting] = React.useState(false);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg overflow-y-auto">
      <div
        className="w-full max-w-md rounded-3xl glass-panel border border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.25)] relative text-right animate-in zoom-in-95 duration-200"
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
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs mb-2.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>بطاقة تكليف واعتماد قيادي // EXECUTIVE PASS</span>
          </div>
          <h3 className="text-xl font-black text-white">بطاقة التكليف والاعتماد الرسمي</h3>
          <p className="text-xs text-gray-400 mt-1">مجلس إدارة النادي الهندسي — جامعة فلسطين</p>
        </div>

        {/* Printable Executive Card */}
        <div
          id="printable-executive-badge"
          className="w-full rounded-3xl p-6 bg-gradient-to-b from-[#0c2340] via-[#09182d] to-[#050b14] border-2 border-cyan-400/50 shadow-[0_0_35px_rgba(0,240,255,0.2)] relative overflow-hidden font-mono text-right"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Badge Top Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
            <div className="flex items-center gap-2.5">
              <img src="/brand/emblem.png" alt="شعار النادي الهندسي" className="h-10 w-auto object-contain drop-shadow" />
              <div>
                <div className="text-xs font-black text-white font-sans">النادي الهندسي</div>
                <div className="text-[9px] text-gray-400 font-sans">جامعة فلسطين — الكليات الهندسية</div>
              </div>
            </div>
            <div className="text-left">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 font-sans">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>تكليف رسمي</span>
              </span>
              <div className="text-[9px] text-gray-500 mt-0.5">2026 - 2027</div>
            </div>
          </div>

          {/* Leader Photo & Identity */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative shrink-0">
              <img
                src={leader.avatar}
                alt={leader.name}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-cyan-400 shadow-md"
              />
              <div className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full bg-cyan-400 text-black shadow">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-gray-400 font-sans">الاسم الكريم:</div>
              <div className="text-base sm:text-lg font-black text-white font-sans leading-snug">
                {leader.name}
              </div>
              <div className="text-xs font-bold text-cyan-300 font-sans mt-0.5 leading-tight">
                {leader.role}
              </div>
              <div className="text-[11px] text-emerald-400 font-sans mt-0.5 leading-tight">
                {leader.department}
              </div>
            </div>
          </div>

          {/* Leader Quote / Pledge */}
          {leader.quote && (
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-gray-300 italic font-sans mb-4 leading-relaxed">
              "{leader.quote}"
            </div>
          )}

          {/* Official Email & Scope */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-black/30 border border-white/10 mb-4 text-xs font-sans">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-400">البريد الرسمي:</span>
              <span className="font-bold text-cyan-300 font-mono">{leader.email}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-400">المستوى القيادي:</span>
              <span className="font-bold text-gray-200">
                {isExecutive ? 'الهيئة الإدارية والتنفيذية' : 'رئاسة اللجان المتخصصة'}
              </span>
            </div>
          </div>

          {/* Skills / Portfolios */}
          {leader.skills && leader.skills.length > 0 && (
            <div className="mb-4">
              <div className="text-[10px] text-gray-400 font-sans mb-1.5">مجالات الإشراف والمسؤولية:</div>
              <div className="flex flex-wrap gap-1">
                {leader.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-[10px] text-cyan-200 font-sans"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Verification Barcode, Serial & Official Stamp */}
          <div className="pt-3 border-t border-dashed border-white/15 flex items-center justify-between">
            <div className="text-[9px] text-gray-400 leading-tight font-mono">
              <div className="text-white font-bold mb-0.5">CREDENTIAL ID:</div>
              <div className="text-cyan-400 font-bold">{badgeSerial}</div>
              <div className="text-[8px] text-gray-500 mt-1">OFFICIAL BOARD ACCREDITATION</div>
            </div>
            {/* Scannable Verification QR Code */}
            <div className="p-1 rounded-xl bg-white flex items-center justify-center shadow">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&format=svg&data=${encodeURIComponent(
                  `${window.location.origin}/?verifyLeader=${encodeURIComponent(leader.id)}`
                )}`}
                alt="Verification QR"
                className="w-11 h-11 object-contain"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons: Export PNG & Print PDF */}
        <div className="flex flex-col gap-2.5 mt-6">
          {/* Export PNG Image Button */}
          <button
            type="button"
            disabled={isExporting}
            onClick={async () => {
              setIsExporting(true);
              const cleanName = leader.name.replace(/[^a-zA-Z0-9؀-ۿ]/g, '-');
              await exportCardAsImage('printable-executive-badge', `UP-Executive-Pass-${cleanName}.png`);
              setIsExporting(false);
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-extrabold text-xs cursor-pointer shadow-[0_0_25px_rgba(0,240,255,0.35)] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'جاري تجهيز الصورة...' : 'تصدير وتحميل كصورة رسمية عالية الدقة (PNG) 🖼️'}</span>
          </button>

          {/* Print / Save as PDF Button */}
          <button
            type="button"
            onClick={() => printCardAsPdf()}
            className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>طباعة / حفظ كـ ملف PDF 📄</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs transition-colors cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
