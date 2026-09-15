import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { SiteSettings } from '../types';
import { ClubLogo } from './ClubLogo';
import { Target, Compass, Sparkles, Award, ShieldCheck, HeartHandshake, Zap, Rocket } from 'lucide-react';
import { sound } from '../utils/soundEngine';

export const BrandIdentitySection: React.FC = () => {
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

  return (
    <section id="brand-identity" className="relative py-20 px-4 sm:px-6 lg:px-8 z-10 overflow-hidden bg-[#07090e]/80 border-t border-white/5">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-[#0B2D5B]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-40 w-96 h-96 bg-[#16A34A]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header with Official Brand Emblem */}
        <div className="text-center mb-16 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0B2D5B]/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-4 shadow-[0_0_20px_rgba(22,163,74,0.15)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>الهوية الرسمية والمرجعية الأكاديمية // BRAND CHARTER</span>
          </div>

          <div className="my-6">
            <ClubLogo variant="full" theme="dark" size="xl" className="mx-auto drop-shadow-[0_15px_35px_rgba(0,0,0,0.7)]" />
          </div>

          {/* Slogan Banner */}
          <div className="mt-4 inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#0B2D5B]/70 via-[#16A34A]/20 to-[#0B2D5B]/70 border border-emerald-500/40 backdrop-blur-md shadow-[0_0_25px_rgba(22,163,74,0.2)]">
            <div className="text-base sm:text-lg md:text-xl font-black text-white tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{settings.sloganAr || 'هندسة اليوم .. تصنع أثر الغد'}</span>
            </div>
            <span className="hidden sm:inline text-emerald-400/50">|</span>
            <div className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-emerald-300 uppercase">
              {settings.sloganEn || 'ENGINEERING TODAY .. IMPACT TOMORROW'}
            </div>
          </div>
        </div>

        {/* Vision & Mission Two-Column Glass Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Vision Card */}
          <div className="group relative p-8 rounded-3xl glass-panel border border-emerald-500/30 hover:border-emerald-400/60 transition-all duration-500 hover:shadow-[0_15px_40px_rgba(22,163,74,0.15)] overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(22,163,74,0.2)] group-hover:scale-105 transition-transform">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-mono text-[11px] text-emerald-400 uppercase tracking-widest">OUR VISION</span>
                    <h3 className="text-2xl font-black text-white">الرؤية</h3>
                  </div>
                </div>
                <span className="font-mono text-xs text-gray-500">01 / 02</span>
              </div>

              <p className="text-sm sm:text-base text-gray-200 leading-relaxed font-light text-balance">
                {settings.vision}
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-emerald-400/80 font-mono">
              <span>المنصة الطلابية الرائدة</span>
              <span>UP ENGINEERING</span>
            </div>
          </div>

          {/* Mission Card */}
          <div className="group relative p-8 rounded-3xl glass-panel border border-blue-500/30 hover:border-blue-400/60 transition-all duration-500 hover:shadow-[0_15px_40px_rgba(11,45,91,0.3)] overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/20 transition-all" />
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B2D5B]/70 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-[0_0_15px_rgba(11,45,91,0.4)] group-hover:scale-105 transition-transform">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-mono text-[11px] text-blue-400 uppercase tracking-widest">OUR MISSION</span>
                    <h3 className="text-2xl font-black text-white">الرسالة</h3>
                  </div>
                </div>
                <span className="font-mono text-xs text-gray-500">02 / 02</span>
              </div>

              <p className="text-sm sm:text-base text-gray-200 leading-relaxed font-light text-balance">
                {settings.mission}
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-blue-400/80 font-mono">
              <span>بيئة هندسية متكاملة</span>
              <span>STUDENT IMPACT</span>
            </div>
          </div>
        </div>

        {/* Five Core Values Row */}
        <div>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-gray-300 text-xs font-mono mb-2">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>القيم الجوهرية الخمس // FIVE CORE VALUES</span>
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
                  className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-emerald-500/40 hover:bg-[#0B2D5B]/30 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] group-hover:bg-emerald-500/20 border border-white/10 group-hover:border-emerald-500/40 flex items-center justify-center text-gray-300 group-hover:text-emerald-400 mb-4 transition-all">
                      <ValIcon className="w-5 h-5" />
                    </div>
                    <div className="font-mono text-[10px] text-emerald-400/80 mb-1">VALUE 0{idx + 1}</div>
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
