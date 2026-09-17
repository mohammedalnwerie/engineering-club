import React, { useState } from 'react';
import type { StoredApplication } from '../types';
import { X, Printer, Download, Copy } from 'lucide-react';
import { downloadCardPng, printCard } from '../utils/cardRenderer';
import { committeeCardFor } from '../utils/memberCard';
import { MemberCard } from './MemberCard';
import { effectiveCommittee } from '../data/committees';

interface CommitteeBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: StoredApplication | null;
}

export const CommitteeBadgeModal: React.FC<CommitteeBadgeModalProps> = ({ isOpen, onClose, app }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !app) return null;

  const committeeName = effectiveCommittee(app);
  const card = committeeCardFor(app);
  const serialNumber = card.code;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg overflow-y-auto">
      <div
        className="w-full max-w-md rounded-3xl glass-panel border border-[#7F1AB2]/40 p-5 sm:p-7 shadow-[0_0_60px_rgba(127,26,178,0.25)] relative text-right animate-in zoom-in-95 duration-200"
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

        {/* Modal Top Header */}
        <div className="text-center mb-5">
          <h3 className="text-lg sm:text-xl font-black text-white">بطاقة عضو اللجنة</h3>
          <p className="text-xs text-gray-400 mt-0.5">النادي الهندسي — جامعة فلسطين</p>
        </div>

        {/* The Official Printable Committee Member Badge (Vertical Portrait Ratio) */}
        <MemberCard {...card} />
        {/* Action Buttons: Export PNG & Print PDF */}
        <div className="flex flex-col gap-2.5 mt-6">
          <button
            type="button"
            disabled={isExporting}
            onClick={async () => {
              setIsExporting(true);
              const cleanName = app.fullName.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '-');
              await downloadCardPng(card, `UP-Committee-Card-${cleanName}.png`);
              setIsExporting(false);
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-extrabold text-xs cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'جاري تجهيز الصورة...' : 'حفظ الكرت كصورة'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void printCard(card)}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>طباعة / PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
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
