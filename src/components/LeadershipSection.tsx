import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { LeaderMember } from '../types';
import { sound } from '../utils/soundEngine';
import { Mail, ShieldCheck, Award } from 'lucide-react';

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
    { label: 'كافة القيادات والمراكز', value: 'all' },
    { label: 'الهيئة الإدارية والرئاسة', value: 'executive' },
    { label: 'رؤساء اللجان المتخصصة', value: 'committee-lead' },
  ];

  const filteredMembers = leadershipList.filter((m) => {
    if (activeTier === 'all') return true;
    return m.tier === activeTier;
  });

  const getTierLabel = (tier: string, role: string) => {
    if (role.includes('رئيس النادي') && !role.includes('نائب')) return 'رئاسة النادي';
    if (tier === 'executive') return 'الهيئة الإدارية';
    return 'قيادة اللجان';
  };

  const getTierBadgeStyle = (tier: string, role: string) => {
    if (role.includes('رئيس النادي') && !role.includes('نائب')) {
      return 'bg-[#7F1AB2]/30 text-[#B991D4] border-[#7F1AB2]/50 shadow-[0_0_12px_rgba(127,26,178,0.25)]';
    }
    if (tier === 'executive') {
      return 'bg-blue-950/70 text-blue-300 border-blue-500/40';
    }
    return 'bg-[#3FE7E3]/15 text-[#3FE7E3] border-[#3FE7E3]/35';
  };

  return (
    <section id="leadership" className="py-28 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#08041D]/85 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#532B6E]/40 border border-[#3FE7E3]/30 text-[#3FE7E3] text-xs font-mono mb-3">
              <ShieldCheck className="w-4 h-4 text-[#3FE7E3]" />
              <span>الهيكل القيادي والتنظيمي المعتمد</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              قيادة النادي الهندسي
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base text-gray-300 font-light leading-relaxed">
            حوكمة طلابية مرنة ومسارات قرار واضحة تقود أنشطة ومبادرات النادي الهندسي بجامعة فلسطين نحو التميز والأثر.
          </p>
        </div>

        {/* Tier Selector Filter Buttons */}
        <div className="flex flex-wrap gap-2.5 mb-10">
          {tiers.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                sound.playClick();
                setActiveTier(t.value as any);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTier === t.value
                  ? 'bg-gradient-to-r from-[#7F1AB2] to-[#532B6E] text-white shadow-[0_0_18px_rgba(127,26,178,0.35)] border border-[#3FE7E3]/30'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Unified Cards Grid - Exactly Equal Dimensions for All Members & Positions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredMembers.map((member) => {
            const isPresident = member.role.includes('رئيس النادي') && !member.role.includes('نائب');
            const tierLabel = getTierLabel(member.tier, member.role);
            const tierBadge = getTierBadgeStyle(member.tier, member.role);

            return (
              <div
                key={member.id}
                className="rounded-3xl glass-panel p-6 sm:p-7 border border-[#7F1AB2]/25 hover:border-[#3FE7E3]/40 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group shadow-[0_10px_35px_-10px_rgba(8,4,29,0.9)] hover:shadow-[0_15px_40px_-10px_rgba(63,231,227,0.15)] h-full"
              >
                {/* Subtle Ambient Light */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#7F1AB2]/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  {/* Card Header: Prominent Club Logo & University Identity */}
                  <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <img
                        src="/brand/emblem.png"
                        alt="شعار النادي الهندسي"
                        className="w-9 h-9 object-contain drop-shadow"
                      />
                      <div>
                        <div className="text-xs font-bold text-white tracking-wide">
                          النادي الهندسي
                        </div>
                        <div className="text-[10px] text-gray-400 font-sans">
                          جامعة فلسطين
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border font-semibold ${tierBadge}`}>
                      {tierLabel}
                    </span>
                  </div>

                  {/* Leader Photo & Identity */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative shrink-0">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#7F1AB2]/40 group-hover:border-[#3FE7E3] transition-colors shadow-md"
                      />
                      {isPresident && (
                        <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#7F1AB2] text-white shadow">
                          <Award className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug break-words">
                        {member.name}
                      </h3>
                      <div className="text-xs sm:text-sm font-bold text-[#3FE7E3] mt-1 leading-snug break-words">
                        {member.role}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                        {member.department}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clean, Official Contact Footer */}
                <div className="pt-3.5 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400 text-[11px]">البريد الرسمي:</span>
                  <a
                    href={`mailto:${member.email}`}
                    className="text-[#3FE7E3] hover:text-white transition-colors truncate max-w-[180px] flex items-center gap-1.5"
                    dir="ltr"
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span>{member.email}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
