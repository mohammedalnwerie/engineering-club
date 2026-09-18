import React from 'react';
import type { LeaderMember } from '../types';
import { X, ShieldCheck, Printer, Download } from 'lucide-react';
import { downloadCardPng, printCard } from '../utils/cardRenderer';
import { executiveCardFor } from '../utils/memberCard';
import { MemberCard } from './MemberCard';

interface ExecutiveBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  leader: LeaderMember | null;
}

export const ExecutiveBadgeModal: React.FC<ExecutiveBadgeModalProps> = ({ isOpen, onClose, leader }) => {
  const [isExporting, setIsExporting] = React.useState(false);

  if (!isOpen || !leader) return null;

  const card = executiveCardFor(leader);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg overflow-y-auto">
      <div
        className="w-full max-w-md rounded-3xl glass-panel border border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.25)] relative text-right animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            onClose();
          }}
          className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs mb-1.5 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>بطاقة التكليف القيادي</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white">بطاقة التكليف والاعتماد الرسمي</h3>
          <p className="text-xs text-gray-400 mt-0.5">مجلس إدارة النادي الهندسي — جامعة فلسطين</p>
        </div>

        {/* Printable Executive Card (Vertical Portrait Ratio) */}
        <MemberCard {...card} />
        {/* Action Buttons: Export PNG & Print PDF */}
        <div className="flex flex-col gap-2.5 mt-6">
          {/* Export PNG Image Button */}
          <button
            type="button"
            disabled={isExporting}
            onClick={async () => {
              setIsExporting(true);
              const cleanName = leader.name.replace(/[^a-zA-Z0-9؀-ۿ]/g, '-');
              await downloadCardPng(card, `UP-Executive-Pass-${cleanName}.png`);
              setIsExporting(false);
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-extrabold text-xs cursor-pointer shadow-[0_0_25px_rgba(0,240,255,0.35)] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'جاري تجهيز الصورة...' : 'حفظ الكرت كصورة'}</span>
          </button>

          {/* Print / Save as PDF Button */}
          <button
            type="button"
            onClick={() => void printCard(card)}
            className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>طباعة / PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
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
