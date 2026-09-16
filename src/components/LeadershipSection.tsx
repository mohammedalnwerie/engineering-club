import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { LeaderMember } from '../types';
import { sound } from '../utils/soundEngine';
import { Shield } from 'lucide-react';

export const LeadershipSection: React.FC = () => {
  const [leadershipList, setLeadershipList] = useState<LeaderMember[]>([]);
  const [activeTier, setActiveTier] = useState<'all' | 'executive' | 'committee-lead'>('all');
  

  useEffect(() => {
    setLeadershipList(dataService.getLeadership());
    const unsub = dataService.subscribe(() => {
      setLeadershipList(dataService.getLeadership());
    });
    return () => unsub();
  }, []);

  const tiers = [
    { label: 'الهيكل الكامل (All)', value: 'all' },
    { label: 'الرئاسة والهيئة الإدارية والتنفيذية', value: 'executive' },
    { label: 'رؤساء اللجان المتخصصة', value: 'committee-lead' },
  ];

  const filteredMembers = leadershipList.filter((m) => {
    if (activeTier === 'all') return true;
    return m.tier === activeTier;
  });

  const president = leadershipList.find((m) => m.id === 'pres-1' || m.role.includes('رئيس النادي') || m.role.includes('رئيس مجلس إدارة'));
  const executives = leadershipList.filter((m) => m.tier === 'executive' && m.id !== president?.id);
  const committees = leadershipList.filter((m) => m.tier === 'committee-lead');

  return (
    <section id="leadership" className="py-28 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#08041D]/80">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>LEADERSHIP & GOVERNANCE // HIERARCHY</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              الهيكل القيادي والتنظيمي
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base text-gray-400 font-light">
            حوكمة طلابية مرنة ومسارات قرار واضحة تقود أنشطة النادي وتنسق المبادرات عبر الهيئة الإدارية والتنفيذية واللجان.
          </p>
        </div>

        {/* Tier Selector Buttons */}
        <div className="flex flex-wrap gap-2 mb-12">
          {tiers.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                sound.playClick();
                setActiveTier(t.value as any);
              }}
              onMouseEnter={() => sound.playHover()}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTier === t.value
                  ? 'bg-cyan-400 text-black font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Visual Organizational Hierarchy Tree */}
        {activeTier === 'all' ? (
          <div className="flex flex-col items-center gap-10 relative">
            {/* Visual Connecting Tree Vertical Line */}
            <div className="hidden lg:block absolute inset-y-12 left-1/2 w-[1px] bg-gradient-to-b from-cyan-400 via-blue-500 to-amber-400 -translate-x-1/2 pointer-events-none opacity-40" />

            {/* LEVEL 1: PRESIDENT */}
            {president && (
              <div className="w-full max-w-md z-10">
                <div className="text-center font-mono text-[11px] text-cyan-400 mb-2 uppercase tracking-wider">
                  [LEVEL 01 // PRESIDENT • رئاسة النادي]
                </div>
                <div className="rounded-3xl glass-panel border border-cyan-400/50 p-6 text-center relative overflow-hidden shadow-[0_10px_35px_-10px_rgba(0,240,255,0.25)] group">
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <img
                      src={president.avatar}
                      alt={president.name}
                      className="w-full h-full rounded-2xl object-cover border-2 border-cyan-400 shadow-md"
                    />
                    <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-cyan-400 text-black">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xl font-extrabold text-white mb-1">{president.name}</h3>
                  <div className="text-xs text-cyan-400 font-semibold mb-3">{president.role}</div>
                  <p className="text-xs text-gray-300 italic mb-4">"{president.quote}"</p>
                  <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                    {president.skills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded bg-white/5 text-[10px] text-gray-300 font-mono border border-white/5">
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Official Contact Footer */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-gray-400">
                    <span className="text-gray-500">البريد الرسمي:</span>
                    <a href={`mailto:${president.email}`} className="text-cyan-300 hover:text-cyan-200 hover:underline">
                      {president.email}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* LEVEL 2: EXECUTIVE BOARD (VICE PRESIDENTS & TREASURER) */}
            <div className="w-full max-w-5xl z-10">
              <div className="text-center font-mono text-[11px] text-blue-400 mb-3 uppercase tracking-wider">
                [LEVEL 02 // EXECUTIVE BOARD • الهيئة الإدارية والتنفيذية]
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {executives.map((exec) => (
                  <div
                    key={exec.id}
                    className="rounded-2xl glass-panel border border-blue-500/30 p-5 text-right relative overflow-hidden hover:border-blue-400/60 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-3.5 mb-3">
                        <img
                          src={exec.avatar}
                          alt={exec.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-blue-400/40 shrink-0 shadow-md"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white leading-snug break-words">{exec.name}</h4>
                          <div className="text-xs text-blue-400 font-semibold leading-snug mt-1 break-words">{exec.role}</div>
                          <div className="text-[11px] text-gray-400 mt-1 font-mono break-all">{exec.email}</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 italic mb-3">"{exec.quote}"</p>
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-1 py-2 border-t border-white/5 mb-3">
                        {exec.skills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-gray-400 font-mono">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-gray-500">البريد الرسمي:</span>
                        <a href={`mailto:${exec.email}`} className="text-blue-300 hover:text-cyan-300 hover:underline transition-colors truncate">
                          {exec.email}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LEVEL 3: COMMITTEES (EVENTS, RELATIONS & TRAINING, MEDIA) */}
            <div className="w-full max-w-5xl z-10">
              <div className="text-center font-mono text-[11px] text-amber-400 mb-3 uppercase tracking-wider">
                [LEVEL 03 // COMMITTEES • اللجان التنفيذية]
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {committees.map((comm) => (
                  <div
                    key={comm.id}
                    className="rounded-2xl glass-panel border border-amber-500/30 p-5 text-right relative overflow-hidden hover:border-amber-400/60 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-3 mb-3">
                        <img
                          src={comm.avatar}
                          alt={comm.name}
                          className="w-13 h-13 rounded-2xl object-cover border border-amber-400/40 shrink-0 shadow-md"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white leading-snug break-words">{comm.name}</h4>
                          <div className="text-[11px] text-amber-400 mt-1 font-semibold leading-snug break-words">{comm.role}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{comm.department}</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 italic mb-3">"{comm.quote}"</p>
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-1 py-2 border-t border-white/5 mb-3">
                        {comm.skills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-gray-400 font-mono">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-gray-500">البريد الرسمي:</span>
                        <a href={`mailto:${comm.email}`} className="text-amber-300 hover:text-cyan-300 hover:underline transition-colors truncate">
                          {comm.email}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LEVEL 4: GENERAL MEMBERS */}
            <div className="w-full max-w-xl z-10 text-center p-6 rounded-2xl bg-black/40 border border-white/10">
              <div className="text-center font-mono text-[11px] text-gray-400 uppercase tracking-wider mb-1">
                [LEVEL 04 // ACTIVE GUILD MEMBERS]
              </div>
              <div className="text-lg font-bold text-white mb-1">أعضاء وفرق عمل اللجان التنفيذية</div>
              <div className="text-xs text-gray-400 leading-relaxed">
                الكوادر الطلابية المنضمة إلى لجان الفعاليات والأنشطة، العلاقات والتدريب، واللجنة الإعلامية لإنجاح كافة مبادرات النادي.
              </div>
            </div>
          </div>
        ) : (
          /* Filtered Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="rounded-2xl glass-panel border border-white/10 p-6 text-right relative overflow-hidden hover:border-cyan-400/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-400/40"
                    />
                    <div>
                      <h4 className="text-base font-bold text-white">{member.name}</h4>
                      <div className="text-xs text-cyan-400 font-medium">{member.role}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{member.department}</div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 italic mb-4 leading-relaxed">
                    "{member.quote}"
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {member.skills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded bg-white/5 text-[11px] text-gray-300 font-mono">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-white/5 text-xs font-mono text-gray-400 mb-4">
                    {member.email}
                  </div>
                </div>


              </div>
            ))}
          </div>
        )}


      </div>
    </section>
  );
};
