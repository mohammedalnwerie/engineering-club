import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { SiteSettings } from '../types';
import { Target, Compass, Sparkles, Award, ShieldCheck, HeartHandshake, Zap, Rocket, FileText, ArrowLeft, BookOpen } from 'lucide-react';
import { sound } from '../utils/soundEngine';

interface BrandIdentitySectionProps {
  onOpenAboutPage?: () => void;
}

export const BrandIdentitySection: React.FC<BrandIdentitySectionProps> = ({ onOpenAboutPage }) => {
  const [settings, setSettings] = useState<SiteSettings>(dataService.getSettings());

  useEffect(() => {
    setSettings(dataService.getSettings());
    const unsub = dataService.subscribe(() => {
      setSettings(dataService.getSettings());
    });
    return () => {
      unsub();
    };
  }, []);

  const handleOpenCharter = () => {
    sound.playClick();
    if (onOpenAboutPage) {
      onOpenAboutPage();
    } else {
      window.location.hash = '#/about';
    }
  };

  const valueIcons: Record<string, any> = {
    'الابتكار': Zap,
    'التعاون': HeartHandshake,
    'التطوير': Rocket,
    'التمكين': ShieldCheck,
    'الأثر': Sparkles,
  };

  const valueDescriptions: Record<string, string> = {
    'الابتكار': 'تحفيز الأفكار الريادية وابتكار حلول هندسية وتقنية غير تقليدية تصنع الفارق.',
    'التعاون': 'العمل التكاملي المشترك بين الكليات والتخصصات المختلفة بروح الفريق الواحد.',
    'التطوير': 'مواكبة التسارع التقني وتنمية المهارات الأكاديمية والعملية لسوق العمل المتجدد.',
    'التمكين': 'تزويد الطلاب بالأدوات والفرص القيادية والثقة لترجمة معارفهم إلى إنجازات واقعية.',
    'الأثر': 'توجيه الطاقات نحو مشاريع ملموسة تخدم المجتمع وتترك بصمة هندسية مستدامة.',
  };

  const valuesList = settings.values && settings.values.length > 0
    ? settings.values
    : ['الابتكار', 'التعاون', 'التطوير', 'التمكين', 'الأثر'];

  const conciseAbout = settings.aboutUs || 'النادي الهندسي هو إطار طلابي تطوعي، غير ربحي، وغير مسيّس، لا يتبع لأي جهة حزبية أو سياسية، ولا يهدف إلى تحقيق أي مكاسب مادية. تأسس النادي بمبادرة من طلبة كلية هندسة البرمجيات والذكاء الاصطناعي في جامعة فلسطين، ليكون منصة طلابية جامعة تجمع طلبة التخصصات الهندسية والتقنية في الجامعة تحت مظلة واحدة، بهدف تنمية مهاراتهم الأكاديمية والعملية والتقنية، وتعزيز روح التعاون والإبداع بينهم.';

  return (
    <section id="brand-identity" className="relative py-20 px-4 sm:px-6 lg:px-8 z-10 overflow-hidden bg-[#08041D]/80 border-t border-white/5">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-[#7F1AB2]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-40 w-96 h-96 bg-[#3FE7E3]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#381C4A]/60 border border-[#3FE7E3]/30 text-[#3FE7E3] text-xs font-mono mb-3 shadow-[0_0_20px_rgba(63,231,227,0.12)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>الهوية والركائز المؤسسية // CORE FOUNDATIONS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            من نحن والرسالة والرؤية
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-xl mx-auto font-sans">
            المرتكزات والمبادئ الأساسية التي يقوم عليها النادي الهندسي في جامعة فلسطين
          </p>
        </div>

        {/* 3 Pillars: من نحن | الرؤية | الرسالة (Concise Cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          
          {/* Card 1: من نحن */}
          <div className="group relative p-7 rounded-3xl glass-panel border border-emerald-500/30 hover:border-emerald-400/60 transition-all duration-500 hover:shadow-[0_15px_40px_rgba(22,163,74,0.15)] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
            
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(22,163,74,0.2)] group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">نبذة عن النادي</span>
                    <h3 className="text-xl font-black text-white">من نحن</h3>
                  </div>
                </div>
                <span className="font-mono text-xs text-gray-500">01 / 03</span>
              </div>

              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-light">
                {conciseAbout}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-emerald-400/80 font-mono">
              <span>إطار طلابي جامع</span>
              <span>UP-ENG</span>
            </div>
          </div>

          {/* Card 2: الرؤية */}
          <div className="group relative p-7 rounded-3xl glass-panel border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-500 hover:shadow-[0_15px_40px_rgba(6,182,212,0.15)] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />
            
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] group-hover:scale-105 transition-transform">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest">رؤية النادي</span>
                    <h3 className="text-xl font-black text-white">الرؤية</h3>
                  </div>
                </div>
                <span className="font-mono text-xs text-gray-500">02 / 03</span>
              </div>

              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-light">
                {settings.vision}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-cyan-400/80 font-mono">
              <span>تمكين وابتكار</span>
              <span>VISION</span>
            </div>
          </div>

          {/* Card 3: الرسالة */}
          <div className="group relative p-7 rounded-3xl glass-panel border border-[#7F1AB2]/30 hover:border-[#7F1AB2]/60 transition-all duration-500 hover:shadow-[0_15px_40px_rgba(127,26,178,0.2)] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#7F1AB2]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#7F1AB2]/20 transition-all" />
            
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#381C4A]/80 border border-[#7F1AB2]/40 flex items-center justify-center text-[#B991D4] shadow-[0_0_15px_rgba(127,26,178,0.3)] group-hover:scale-105 transition-transform">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-[#B991D4] uppercase tracking-widest">رسالة النادي</span>
                    <h3 className="text-xl font-black text-white">الرسالة</h3>
                  </div>
                </div>
                <span className="font-mono text-xs text-gray-500">03 / 03</span>
              </div>

              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-light">
                {settings.mission}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-[#B991D4] font-mono">
              <span>تطوير وشراكات</span>
              <span>MISSION</span>
            </div>
          </div>
        </div>

        {/* CTA Banner: Navigate to the Full Official Charter Page */}
        <div className="mb-16 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#381C4A]/70 via-[#7F1AB2]/20 to-[#381C4A]/70 border border-[#7F1AB2]/40 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-right">
            <div className="w-14 h-14 rounded-2xl bg-[#7F1AB2]/20 border border-[#7F1AB2]/40 flex items-center justify-center text-[#3FE7E3] shrink-0 shadow-[0_0_20px_rgba(127,26,178,0.3)]">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-black text-white mb-1">
                الميثاق التأسيسي واللائحة الداخلية الرسمية للنادي
              </h4>
              <p className="text-xs sm:text-sm text-gray-300 font-light">
                اطلع على الوثيقة الكاملة التي تضم الرؤية الاستراتيجية المفصلة، مسارات الرسالة التنفيذية، الكليات الشريكة، ومبادئ الحوكمة والتمثيل الطلابي.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCharter}
            className="shrink-0 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#7F1AB2] to-[#532B6E] hover:from-[#A26CC6] hover:to-[#7F1AB2] text-white font-bold text-sm shadow-[0_0_25px_rgba(127,26,178,0.4)] hover:shadow-[0_0_35px_rgba(127,26,178,0.6)] transition-all cursor-pointer flex items-center gap-2 group"
          >
            <span>قراءة الميثاق الكامل للنادي</span>
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </button>
        </div>

        {/* Five Core Values Row */}
        <div>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-gray-300 text-xs font-mono mb-2">
              <Award className="w-3.5 h-3.5 text-[#3FE7E3]" />
              <span>القيم الجوهرية الخمس</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">المبادئ التي تقود كل مبادرة هندسية</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {valuesList.map((val, idx) => {
              const valName = typeof val === 'string' ? val : val.name;
              const ValIcon = valueIcons[valName] || Award;
              const desc =
                (typeof val !== 'string' && val.description) ||
                valueDescriptions[valName] ||
                'قيمة هندسية أصيلة تعزز روح العطاء والتميز المستمر.';
              return (
                <div
                  key={idx}
                  onMouseEnter={() => sound.playHover()}
                  className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-[#7F1AB2]/40 hover:bg-[#381C4A]/30 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] group-hover:bg-emerald-500/20 border border-white/10 group-hover:border-emerald-500/40 flex items-center justify-center text-gray-300 group-hover:text-emerald-400 mb-4 transition-all">
                      <ValIcon className="w-5 h-5" />
                    </div>
                    <div className="font-sans text-[11px] font-bold text-emerald-400 mb-1">القيمة 0{idx + 1}</div>
                    <h4 className="text-lg font-bold text-white mb-2">{valName}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                      {desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 group-hover:bg-emerald-400 group-hover:scale-125 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
