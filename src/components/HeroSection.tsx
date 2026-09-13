import React, { useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import type { SiteSettings } from '../types';
import { ArrowLeft, Code2, Layers, Cpu, Compass } from 'lucide-react';
import { sound } from '../utils/soundEngine';

interface HeroSectionProps {
  onJoinClick: () => void;
  onExploreClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onJoinClick, onExploreClick }) => {
  const [settings, setSettings] = useState<SiteSettings>(dataService.getSettings());
  const [coords, setCoords] = useState({ x: 24.7136, y: 46.6753 });
  const [activeMetric, setActiveMetric] = useState(0);

  useEffect(() => {
    setSettings(dataService.getSettings());
    const unsub = dataService.subscribe(() => {
      setSettings(dataService.getSettings());
    });

    const interval = setInterval(() => {
      setCoords({
        x: Number((24.7136 + (Math.random() - 0.5) * 0.005).toFixed(4)),
        y: Number((46.6753 + (Math.random() - 0.5) * 0.005).toFixed(4)),
      });
      setActiveMetric((prev) => (prev + 1) % 4);
    }, 3000);
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, []);


  const stats = [
    { number: '03', label: 'كليات تخصصية', sub: 'هندسة، حاسب، عمارة' },
    { number: '06', label: 'تخصصات متقدمة', sub: 'من الأنظمة إلى الذكاء' },
    { number: '1,200+', label: 'مهندس ومهندسة', sub: 'مجتمع شغوف بالإنجاز' },
    { number: '45+', label: 'مشروع تخرّج وابتكار', sub: 'حلول عملية لسوق العمل' },
  ];

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-center items-center pt-28 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Subtle CAD Radar Overlay Graphic */}
      <div className="absolute w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full border border-cyan-500/10 pointer-events-none -top-24 sm:-top-32 left-1/2 -translate-x-1/2 flex items-center justify-center animate-glow-pulse">
        <div className="w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] rounded-full border border-dashed border-cyan-500/15" />
        <div className="absolute w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] rounded-full border border-white/5" />
        {/* Radar Crosshair lines */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
      </div>

      <div className="relative max-w-5xl mx-auto text-center flex flex-col items-center z-10">
        {/* Tech Badge / Telemetry bar */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm font-mono mb-8 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.15)]">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span className="font-semibold tracking-wide">المنظومة الهندسية الموحدة</span>
          <span className="text-cyan-500/50">|</span>
          <span className="text-gray-400 hidden sm:inline">الإحداثيات: {coords.x}°N, {coords.y}°E</span>
        </div>

        {/* Main Epic Headline */}
        <div className="relative mb-6">
          {/* Subtle Decorative Technical Corner Markers */}
          <div className="absolute -top-6 -right-6 text-[10px] font-mono text-cyan-500/40 hidden sm:block">
            // INIT_SYS.ENGINEER
          </div>
          <div className="absolute -bottom-4 -left-6 text-[10px] font-mono text-cyan-500/40 hidden sm:block">
            COORD [01.06.26]
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white leading-[1.12]">
            {settings.heroTitle.includes(settings.heroHighlight) ? (
              <>
                {settings.heroTitle.split(settings.heroHighlight)[0]}
                <span className="relative inline-block">
                  <span className="animate-shimmer">{settings.heroHighlight}</span>
                  <svg className="absolute -bottom-2 inset-x-0 w-full text-cyan-400/40 h-3" viewBox="0 0 100 12" preserveAspectRatio="none">
                    <path d="M0,8 Q50,0 100,8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 3" />
                  </svg>
                </span>{' '}
                {settings.heroTitle.split(settings.heroHighlight)[1]}
              </>
            ) : (
              settings.heroTitle
            )}
          </h1>
        </div>

        {/* Manifesto Sub-headline */}
        <p className="max-w-2xl text-lg sm:text-xl md:text-2xl text-gray-300 font-light leading-relaxed mb-10 text-balance">
          {settings.heroSubheadline1}
          <br />
          <span className="text-cyan-300 font-normal">{settings.heroSubheadline2}</span>
        </p>


        {/* Interactive Floating Micro-indicators (Floating CAD specs around title) */}
        <div className="hidden md:flex items-center justify-center gap-6 mb-10 text-xs font-mono text-gray-400">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>نظم برمجية وصناعية</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5">
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            <span>ذكاء اصطناعي وأمن سيبراني</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>عمارة ومدن ذكية</span>
          </div>
        </div>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <button
            onClick={() => {
              sound.playClick();
              onJoinClick();
            }}
            onMouseEnter={() => sound.playHover()}
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base text-[#07090e] bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-300 hover:from-cyan-300 hover:to-cyan-200 shadow-[0_0_35px_rgba(0,240,255,0.4)] hover:shadow-[0_0_45px_rgba(0,240,255,0.6)] transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer group"
          >
            <span>انضم للنادي وابدأ مسيرتك</span>
            <ArrowLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" />
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onExploreClick();
            }}
            onMouseEnter={() => sound.playHover()}
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-medium text-base text-gray-200 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/40 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>استكشف الكليات والمسارات</span>
          </button>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-right">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`p-4 sm:p-5 rounded-2xl glass-panel transition-all duration-300 cad-corner ${
                activeMetric === idx
                  ? 'border-cyan-500/40 shadow-[0_0_25px_rgba(0,240,255,0.12)]'
                  : 'hover:border-white/20'
              }`}
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {stat.number}
                </span>
                <span className="font-mono text-[11px] text-cyan-400/80">0{idx + 1}</span>
              </div>
              <div className="text-sm font-bold text-gray-200">{stat.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
