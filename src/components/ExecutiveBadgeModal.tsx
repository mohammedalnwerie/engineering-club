import React from 'react';
import type { LeaderMember } from '../types';
import { sound } from '../utils/soundEngine';
import { X, ShieldCheck, Printer, Award, Download } from 'lucide-react';
import { exportCardAsImage, printCardAsPdf } from '../utils/cardExporter';

interface ExecutiveBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  leader: LeaderMember | null;
}

export const ExecutiveBadgeModal: React.FC<ExecutiveBadgeModalProps> = ({ isOpen, onClose, leader }) => {
  const [isExporting, setIsExporting] = React.useState(false);

  if (!isOpen || !leader) return null;

  const isExecutive = leader.tier === 'executive';
  const badgeSerial = `UP-EXEC-2026-${leader.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`;

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
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs mb-1.5 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>بطاقة تكليف واعتماد قيادي // EXECUTIVE PASS</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white">بطاقة التكليف والاعتماد الرسمي</h3>
          <p className="text-xs text-gray-400 mt-0.5">مجلس إدارة النادي الهندسي — جامعة فلسطين</p>
        </div>

        {/* Printable Executive Card (Vertical Portrait Ratio) */}
        <div
          id="printable-executive-badge"
          className="w-full max-w-[340px] sm:max-w-[350px] mx-auto rounded-3xl p-5 bg-gradient-to-b from-[#160E3D] via-[#0D0727] to-[#070319] border-2 border-[#7F1AB2]/50 shadow-[0_12px_45px_rgba(127,26,178,0.3)] relative overflow-hidden font-mono text-right flex flex-col justify-between"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#7F1AB2]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-[#3FE7E3]/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Lanyard Clip Slot for Realistic Printable Badge */}
            <div className="w-14 h-1.5 rounded-full bg-white/20 mx-auto mb-3.5 shadow-inner" />

            {/* Top Brand Banner: Dedicated 100% to Showcasing the Engineering Club & University */}
            <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-md border border-white/90 mb-4 text-center">
              <img
                src="/brand/logo-horizontal.png"
                alt="النادي الهندسي"
                className="h-10 sm:h-11 w-auto mx-auto object-contain drop-shadow-sm"
              />
              <div className="text-[10px] font-bold text-gray-700 tracking-wider mt-1 font-sans border-t border-gray-200/80 pt-1 flex items-center justify-center gap-1.5">
                <span>جامعة فلسطين</span>
                <span className="text-gray-300">•</span>
                <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider font-semibold">University of Palestine</span>
              </div>
            </div>

            {/* Leader Photo & Identity */}
            <div className="flex items-center gap-3.5 mb-4 text-right">
              <div className="relative shrink-0">
                <img
                  src={leader.avatar}
                  alt={leader.name}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-[#7F1AB2]/60 shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#7F1AB2] text-white shadow">
                  <Award className="w-3 h-3" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-gray-400 font-sans">الاسم / القيادي:</div>
                <div className="text-base sm:text-lg font-black text-white font-sans leading-tight">
                  {leader.name}
                </div>
                <div className="text-xs font-bold text-[#3FE7E3] font-sans mt-0.5 leading-tight">
                  {leader.role}
                </div>
                <div className="text-[11px] text-[#35BC2B] font-sans mt-0.5 leading-tight font-medium">
                  {leader.department}
                </div>
              </div>
            </div>

            {/* Clean Executive Metadata */}
            <div className="space-y-2 p-3 rounded-2xl bg-black/50 border border-white/10 mb-4 text-xs font-sans">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">المستوى:</span>
                <span className="font-bold text-gray-200">
                  {isExecutive ? 'الهيئة الإدارية والتنفيذية' : 'رئاسة اللجان المتخصصة'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1.5 border-t border-white/5">
                <span className="text-gray-400">البريد الرسمي:</span>
                <span className="font-bold text-[#3FE7E3] font-mono text-[11px]">{leader.email}</span>
              </div>
            </div>
          </div>

          {/* Verification Barcode, Serial & Official Stamp */}
          <div className="pt-3 border-t border-dashed border-white/15 flex items-center justify-between gap-3">
            <div className="text-left flex-1 min-w-0" dir="ltr">
              <div className="text-[9px] text-gray-400 font-mono tracking-wider font-bold">
                PASS ID: <span className="text-[#3FE7E3] font-mono">{badgeSerial}</span>
              </div>
              <div className="text-[8px] text-gray-500 font-mono tracking-tight mt-0.5 uppercase">
                OFFICIAL BOARD ACCREDITATION
              </div>
              <div className="inline-flex items-center gap-1 mt-1 text-[9px] text-[#35BC2B] font-sans font-bold" dir="rtl">
                <span className="w-1.5 h-1.5 rounded-full bg-[#35BC2B]" />
                <span>اعتماد قيادي ساري • 2026</span>
              </div>
            </div>

            {/* Scannable Verification QR Code */}
            <div className="p-1 rounded-xl bg-white flex items-center justify-center shadow shrink-0 border border-white/90">
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
