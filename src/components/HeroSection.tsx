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

  const membership = dataService.getMembershipSettings();
  const collegesCount = dataService.getColleges().length;
  const majorsCount = dataService.getMajors().length;
  const committeesCount = Object.keys(dataService.getRecruitmentSettings().committees).filter((id) => id !== 'general').length;

  const stats = [
    { number: String(collegesCount), label: 'كليات مشاركة', sub: 'برمجيات، تكنولوجيا معلومات، هندسة تطبيقية' },
    { number: String(majorsCount), label: 'تخصصات', sub: 'من البرمجة والذكاء الاصطناعي إلى العمارة والمدني' },
    { number: String(committeesCount), label: 'لجان عمل', sub: 'فعاليات، علاقات وتدريب، إعلام' },
    { number: `${membership.semesterFee} ${membership.currency}`, label: 'العضوية الفصلية', sub: `بعد بطاقة مؤقتة لمدة ${membership.trialDays} يوماً` },
  ];

  const renderTitle = () => {
    const { heroTitle, heroHighlight } = settings;
    if (!heroHighlight || !heroTitle.includes(heroHighlight)) {
      return heroTitle;
    }
    const [before, after] = heroTitle.split(heroHighlight);
    return (
      <>
        {before.trim() && <span className="text-white">{before.trim()} </span>}
        {/* padding-bottom keeps Arabic dots below the baseline inside the gradient clip */}
        <span className="inline-block pb-[0.18em] -mb-[0.18em] text-transparent bg-clip-text bg-gradient-to-l from-[#3FE7E3] via-[#98F7F1] to-[#D1B5E3]">
          {heroHighlight}
        </span>
        {after.trim() && <span className="text-white"> {after.trim()}</span>}
      </>
    );
  };

  return (
    <section className="relative min-h-[88vh] flex flex-col justify-center items-center pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="relative max-w-6xl mx-auto text-center flex flex-col items-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#532B6E]/40 border border-[#3FE7E3]/30 text-sm mb-8 backdrop-blur-md">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          <span className="font-bold text-white">{settings.clubNameAr || 'النادي الهندسي'}</span>
          <span className="text-[#3FE7E3]/50">•</span>
          <span className="font-semibold text-[#3FE7E3]">{settings.universityNameAr || 'جامعة فلسطين'}</span>
        </div>

        <h1 className="text-[2.6rem] sm:text-6xl lg:text-7xl font-black leading-[1.3] text-center mb-6 text-balance">
          {renderTitle()}
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-gray-300 font-light leading-relaxed mb-10 text-balance">
          {settings.heroSubheadline1}
          <br />
          <span className="text-[#3FE7E3] font-normal">{settings.heroSubheadline2}</span>
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto mb-16">
          <button
            onClick={onJoinClick}
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base text-white bg-gradient-to-r from-[#7F1AB2] to-[#6F3993] hover:from-[#A26CC6] hover:to-[#7F1AB2] shadow-[0_10px_30px_rgba(127,26,178,0.35)] transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer group"
          >
            <span>انضم للنادي</span>
            <ArrowLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" />
          </button>

          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-medium text-base text-gray-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#3FE7E3]/40 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#3FE7E3]" />
            <span>استكشف الكليات والتخصصات</span>
          </button>
        </div>

        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-right">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#7F1AB2]/40 transition-all duration-300 backdrop-blur-sm"
            >
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">{stat.number}</div>
              <div className="text-base font-bold text-gray-100 mb-1">{stat.label}</div>
              <div className="text-sm text-gray-400 leading-relaxed">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
