import React, { useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import type { SiteSettings } from '../types';
import { ArrowLeft, Layers } from 'lucide-react';

interface HeroSectionProps {
  onJoinClick: () => void;
  onExploreClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onJoinClick, onExploreClick }) => {
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

  const stats = [
    { number: '03', label: 'كليات تخصصية', sub: 'برمجيات، تكنولوجيا، عمارة وهندسة' },
    { number: '06', label: 'مسارات هندسية', sub: 'تخصصات متكاملة تغطي سوق العمل' },
    { number: '03', label: 'لجان فاعلة', sub: 'أنشطة، تدريب وشراكات، إعلام' },
    { number: '01', label: 'مظلة طلابية رائدة', sub: 'تجمع مهندسي المستقبل في فلسطين' },
  ];

  return (
    <section className="relative min-h-[88vh] flex flex-col justify-center items-center pt-28 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="relative max-w-5xl mx-auto text-center flex flex-col items-center z-10">
        
        {/* Sleek Official Institutional Badge */}
        <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-gradient-to-r from-[#0B2D5B]/70 via-emerald-950/40 to-[#0B2D5B]/70 border border-emerald-500/30 text-xs sm:text-sm mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(22,163,74,0.15)]">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-bold text-white tracking-wide">المنصة الهندسية الرسمية المعتمدة</span>
          <span className="text-emerald-400/40">•</span>
          <span className="font-semibold text-emerald-300">{settings.universityNameAr || "جامعة فلسطين"}</span>
          <span className="hidden sm:inline text-emerald-400/40">•</span>
          <span className="hidden sm:inline text-gray-300 font-light text-xs">الكليات الهندسية والتقنية</span>
        </div>

        {/* Main Title */}
        <div className="relative mb-6">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white leading-[1.15]">
            {settings.heroTitle.includes(settings.heroHighlight) ? (
              <>
                {settings.heroTitle.split(settings.heroHighlight)[0]}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300">
                  {settings.heroHighlight}
                </span>{' '}
                {settings.heroTitle.split(settings.heroHighlight)[1]}
              </>
            ) : (
              settings.heroTitle
            )}
          </h1>
        </div>

        {/* Manifesto Sub-headline */}
        <p className="max-w-2xl text-base sm:text-lg md:text-xl text-gray-300 font-light leading-relaxed mb-10 text-balance">
          {settings.heroSubheadline1}
          <br />
          <span className="text-emerald-300 font-normal">{settings.heroSubheadline2}</span>
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <button
            onClick={onJoinClick}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-base text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-[0_10px_25px_rgba(22,163,74,0.3)] hover:shadow-[0_15px_35px_rgba(22,163,74,0.45)] transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer group"
          >
            <span>انضم للنادي وابدأ مسيرتك</span>
            <ArrowLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" />
          </button>

          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-medium text-base text-gray-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>استكشف الكليات والمسارات</span>
          </button>
        </div>

        {/* Live Metrics Cards */}
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-right">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.05] transition-all duration-300 backdrop-blur-sm"
            >
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {stat.number}
                </span>
                <span className="text-xs text-emerald-400 font-semibold">0{idx + 1}</span>
              </div>
              <div className="text-sm font-bold text-gray-100 mb-1">{stat.label}</div>
              <div className="text-xs text-gray-400 leading-relaxed font-light">{stat.sub}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
