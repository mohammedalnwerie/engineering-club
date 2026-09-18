import React, { useEffect, useState } from 'react';
import { Building2, Layers } from 'lucide-react';
import { dataService } from '../services/dataService';
import { CollegesSection } from './CollegesSection';
import { MajorsSection } from './MajorsSection';

type AcademicsTab = 'colleges' | 'majors';

/**
 * Colleges and majors used to be two near-identical sections one after the
 * other. They answer the same question — "what can I study here?" — so they
 * share one header and one anchor, with a tab to switch between them.
 */
export const AcademicsSection: React.FC = () => {
  const [tab, setTab] = useState<AcademicsTab>('colleges');
  const [counts, setCounts] = useState({ colleges: 0, majors: 0 });

  useEffect(() => {
    const read = () => setCounts({ colleges: dataService.getColleges().length, majors: dataService.getMajors().length });
    read();
    return dataService.subscribe(read);
  }, []);

  // Old links (#majors in the nav and footer) still land on the right tab.
  useEffect(() => {
    const syncFromHash = () => {
      if (window.location.hash === '#majors') setTab('majors');
      if (window.location.hash === '#colleges') setTab('colleges');
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const tabs: { id: AcademicsTab; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'colleges', label: 'الكليات', count: counts.colleges, icon: <Building2 className="w-4 h-4" /> },
    { id: 'majors', label: 'التخصصات', count: counts.majors, icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <section id="colleges" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 relative z-10">
      <span id="majors" className="block h-0 -mt-24 pt-24" aria-hidden="true" />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>المنظومة الأكاديمية للنادي</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              وين بتدرس وشو بتدرس
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base text-gray-400 font-light leading-relaxed">
            {counts.colleges} كليات و{counts.majors} تخصصات تحت مظلة نادٍ واحد — اختر الكلية لتعرف مختبراتها ومنسقها، أو
            التخصص لتعرف أدواته ومساره الوظيفي.
          </p>
        </div>

        <div className="flex gap-1.5 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 w-fit mb-8" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer flex items-center gap-2 ${
                tab === t.id ? 'bg-cyan-400 text-black shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              <span className={`text-xs font-mono ${tab === t.id ? 'text-black/60' : 'text-gray-500'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {tab === 'colleges' ? <CollegesSection embedded /> : <MajorsSection embedded />}
      </div>
    </section>
  );
};
