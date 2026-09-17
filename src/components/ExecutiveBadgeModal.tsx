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
          className="w-full rounded-3xl p-6 bg-gradient-to-b from-[#140C38] via-[#0E082C] to-[#08041D] border-2 border-[#7F1AB2]/50 shadow-[0_0_40px_rgba(127,26,178,0.25)] relative overflow-hidden font-mono text-right"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#7F1AB2]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#3FE7E3]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Lanyard Clip Slot for Realistic Printable Badge */}
          <div className="w-16 h-1.5 rounded-full bg-white/20 mx-auto mb-4 shadow-inner" />

          {/* Badge Top Header: Prominent Club Logo, University Identity & Smart IC Microchip */}
          <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-white shadow-md border border-white/90 flex items-center justify-center shrink-0">
                <img
                  src="/brand/emblem.png"
                  alt="شعار النادي الهندسي"
                  className="h-10 w-10 sm:h-11 sm:w-11 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)] transition-transform hover:scale-105"
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

            {/* Smart IC Microchip & Executive Badge */}
            <div className="flex flex-col items-end gap-1.5">
              <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-400 via-yellow-200 to-amber-500 p-0.5 shadow-md border border-amber-300/60 flex items-center justify-center relative overflow-hidden shrink-0" title="Smart IC Pass">
                <div className="w-full h-full border border-amber-800/40 rounded-[2px] flex items-center justify-around">
                  <div className="w-[1px] h-full bg-amber-800/30" />
                  <div className="w-2 h-2 rounded-full border border-amber-800/40" />
                  <div className="w-[1px] h-full bg-amber-800/30" />
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#D1B5E3] px-2 py-0.5 rounded-full bg-[#7F1AB2]/30 border border-[#7F1AB2]/40 font-sans shadow-sm">
                <Sparkles className="w-2.5 h-2.5 text-[#3FE7E3]" />
                <span>تكليف رسمي</span>
              </span>
            </div>
          </div>

          {/* Leader Photo & Identity */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative shrink-0">
              <img
                src={leader.avatar}
                alt={leader.name}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover border-2 border-[#7F1AB2]/60 shadow-lg"
              />
              <div className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full bg-[#7F1AB2] text-white shadow">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-gray-400 font-sans">اسم القيادي/ـة:</div>
              <div className="text-lg sm:text-xl font-black text-white font-sans leading-snug">
                {leader.name}
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#3FE7E3] font-sans mt-0.5 leading-tight">
                {leader.role}
              </div>
              <div className="text-xs text-[#35BC2B] font-sans mt-0.5 leading-tight font-medium">
                {leader.department}
              </div>
            </div>
          </div>

          {/* Clean Executive Metadata (2 Core Rows) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-black/50 border border-white/10 mb-5 text-xs font-sans">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">المستوى القيادي:</span>
              <span className="font-bold text-gray-200">
                {isExecutive ? 'الهيئة الإدارية والتنفيذية' : 'رئاسة اللجان المتخصصة'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1.5 border-t border-white/5">
              <span className="text-gray-400">البريد الرسمي:</span>
              <span className="font-bold text-[#3FE7E3] font-mono">{leader.email}</span>
            </div>
          </div>

          {/* Verification Barcode, Serial & Official Stamp */}
          <div className="pt-3 border-t border-dashed border-white/20 flex items-center justify-between">
            <div className="text-[9px] text-gray-400 leading-tight font-mono">
              <div className="text-white font-bold mb-0.5">CREDENTIAL ID:</div>
              <div className="text-[#3FE7E3] font-bold">{badgeSerial}</div>
              <div className="text-[8px] text-gray-500 mt-1">OFFICIAL BOARD ACCREDITATION</div>
            </div>
            {/* Scannable Verification QR Code */}
            <div className="p-1 rounded-xl bg-white flex items-center justify-center shadow">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&format=svg&data=${encodeURIComponent(
                  `${window.location.origin}/?verifyLeader=${encodeURIComponent(leader.id)}`
                )}`}
                alt="Verification QR"
                className="w-12 h-12 object-contain"
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
