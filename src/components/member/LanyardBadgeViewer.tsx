import React, { useEffect, useState } from 'react';
import {
  RotateCw,
  Download,
  Printer,
  Sparkles,
} from 'lucide-react';
import {
  renderLanyardFront,
  renderLanyardBack,
  downloadLanyardFront,
  downloadLanyardBack,
  printDoubleSidedLanyard,
  type LanyardBadgeData,
} from '../../utils/lanyardBadgeRenderer';

interface LanyardBadgeViewerProps {
  data: LanyardBadgeData;
  className?: string;
}

export const LanyardBadgeViewer: React.FC<LanyardBadgeViewerProps> = ({ data, className = '' }) => {
  const [frontUrl, setFrontUrl] = useState<string>('');
  const [backUrl, setBackUrl] = useState<string>('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([renderLanyardFront(data, 2), renderLanyardBack(2)])
      .then(([f, b]) => {
        if (!cancelled) {
          setFrontUrl(f);
          setBackUrl(b);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(data)]);

  const handleDownloadFront = async () => {
    setDownloading(true);
    try {
      await downloadLanyardFront(data, `Lanyard-Badge-Front-${data.name.replace(/\s+/g, '-')}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadBack = async () => {
    setDownloading(true);
    try {
      await downloadLanyardBack(`Lanyard-Badge-Back-${data.name.replace(/\s+/g, '-')}`);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await printDoubleSidedLanyard(data);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Banner Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-emerald-500/10 border border-purple-500/30 text-right space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>باج التعليق الرئاسي القيادي الرسمي (Official Lanyard ID Badge)</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
            وجهين CR80
          </span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          هذا الباج مخصص لأعضاء المجلس الإداري ومسؤولي اللجان وممثلي الكليات لارتدائه في الفعاليات والمؤتمرات الجامعية. اضغط على البطاقة لقلبها ومعاينة الوجهين!
        </p>
      </div>

      {/* 3D Flip Card Container */}
      <div className="flex flex-col items-center justify-center">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="relative w-[300px] sm:w-[340px] cursor-pointer group select-none transition-all duration-300 hover:scale-[1.02]"
          style={{ perspective: '1200px' }}
          title="اضغط لقلب البطاقة"
        >
          <div
            className="relative w-full transition-transform duration-700 rounded-3xl"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              aspectRatio: '600 / 950',
            }}
          >
            {/* Front Face */}
            <div
              className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {loading || !frontUrl ? (
                <div className="w-full h-full bg-[#0A1128] flex items-center justify-center text-xs text-gray-400 animate-pulse">
                  جاري رسم الوجه الأمامي…
                </div>
              ) : (
                <img
                  src={frontUrl}
                  alt="الوجه الأمامي للباج"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Back Face */}
            <div
              className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {loading || !backUrl ? (
                <div className="w-full h-full bg-[#0A1128] flex items-center justify-center text-xs text-gray-400 animate-pulse">
                  جاري رسم الوجه الخلفي…
                </div>
              ) : (
                <img
                  src={backUrl}
                  alt="الوجه الخلفي للباج"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Quick Flip Hint Pill */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-cyan-400 font-bold">
            <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
            <span>اضغط لقلب الباج: ({isFlipped ? 'الوجه الخلفي حالياً' : 'الوجه الأمامي حالياً'})</span>
          </div>
        </div>
      </div>

      {/* Action Controls & Download / Print Buttons */}
      <div className="p-4 rounded-3xl glass-panel border border-white/10 space-y-3 shadow-lg">
        <div className="text-center text-xs text-gray-300 font-medium">
          خيارات الطباعة والتصدير بجودة عالية (300 DPI جاهزة للمطبعة)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={handleDownloadFront}
            disabled={loading || downloading}
            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>تحميل الوجه الأمامي (PNG)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadBack}
            disabled={loading || downloading}
            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>تحميل الوجه الخلفي (PNG)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={loading || printing}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>{printing ? 'جاري التجهيز…' : 'طباعة PDF وجهين للمطبعة'}</span>
          </button>
        </div>

        <div className="text-[11px] text-gray-400 text-center leading-relaxed pt-1">
          💡 <strong>نصيحة للمطبعة:</strong> يتم تجهيز ملف الـ PDF بمقاس البطاقة القياسية 54×86 مم وجهين، وتطبع على بطاقات PVC مع فتحة تعليق مستطيلة بالوسط.
        </div>
      </div>
    </div>
  );
};
