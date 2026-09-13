import React, { useState, useEffect } from 'react';
import { LIVE_ACTIVITY_STREAM } from '../data/clubData';
import { dataService } from '../services/dataService';
import type { StudentSpotlightData } from '../types';
import { Activity, Star } from 'lucide-react';

export const LiveFeedSection: React.FC = () => {
  const [spotlight, setSpotlight] = useState<StudentSpotlightData>(dataService.getSpotlight());

  useEffect(() => {
    setSpotlight(dataService.getSpotlight());
    const unsub = dataService.subscribe(() => {
      setSpotlight(dataService.getSpotlight());
    });
    return () => unsub();
  }, []);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-white/5 bg-[#090d16]/80">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Student Spotlight of the Month */}
          <div className="lg:col-span-7 rounded-3xl glass-panel p-6 sm:p-10 border border-cyan-500/20 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 font-mono text-xs">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>مهندس الشهر المتميز // STUDENT SPOTLIGHT</span>
                </div>
                <span className="font-mono text-xs text-gray-500">OCTOBER 2026</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
                <img
                  src={spotlight.avatar}
                  alt={spotlight.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-cyan-400/50 shadow-xl"
                />
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-1">
                    {spotlight.name}
                  </h3>
                  <div className="text-xs font-mono text-cyan-400 font-semibold mb-3">
                    {spotlight.major}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-light">
                    {spotlight.achievement}
                  </p>
                </div>
              </div>

              {/* Student Quote */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs text-gray-300 italic mb-6">
                "{spotlight.quote}"
              </div>
            </div>

            {/* Achievement Counters */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div className="font-mono text-xl font-bold text-cyan-400">{spotlight.projectsCount}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">مشاريع مكتملة</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div className="font-mono text-xl font-bold text-amber-400">{spotlight.awardsCount}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">جوائز وهاكاثونات</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div className="font-mono text-xl font-bold text-emerald-400">{spotlight.publicationsCount}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">أوراق بحثية</div>
              </div>
            </div>
          </div>

          {/* Right: Real-time Live Activity Feed */}

          <div className="lg:col-span-5 rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">نبض النشاط اللحظي (Live Feed)</span>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                  REAL-TIME SYNC
                </span>
              </div>

              {/* Feed Stream */}
              <div className="space-y-4">
                {LIVE_ACTIVITY_STREAM.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-black/30 border border-white/5 hover:border-cyan-500/30 transition-all flex items-start gap-3"
                  >
                    <span className="font-mono text-[10px] px-2 py-1 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/20 shrink-0 mt-0.5">
                      {item.tag}
                    </span>

                    <div className="flex-1">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <h4 className="text-xs font-bold text-white">{item.title}</h4>
                        <span className="text-[10px] font-mono text-gray-500">{item.time}</span>
                      </div>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Industrial Partners Preview */}
            <div className="mt-8 pt-4 border-t border-white/10">
              <div className="text-[11px] font-mono uppercase text-gray-400 mb-2">
                // الشركاء الصناعيون والرعاة الأكاديميون:
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-gray-500">
                <span>ARAMCO LABS</span>
                <span>•</span>
                <span>NEOM TECH</span>
                <span>•</span>
                <span>SDAIA</span>
                <span>•</span>
                <span>SEC POWER</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
