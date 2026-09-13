import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { College } from '../types';
import { sound } from '../utils/soundEngine';
import { ExternalLink, Mail, Award, FlaskConical, BookOpen } from 'lucide-react';

export const CollegesSection: React.FC = () => {
  const [collegesList, setCollegesList] = useState<College[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');

  useEffect(() => {
    const list = dataService.getColleges();
    setCollegesList(list);
    if (list.length > 0 && !selectedCollegeId) {
      setSelectedCollegeId(list[0].id);
    }
    const unsub = dataService.subscribe(() => {
      const updated = dataService.getColleges();
      setCollegesList(updated);
    });
    return () => unsub();
  }, [selectedCollegeId]);

  const activeCollege = collegesList.find((c) => c.id === selectedCollegeId) || collegesList[0] || {
    id: 'default',
    code: 'ENG-01',
    name: 'كلية الهندسة',
    shortName: 'الهندسة',
    tagline: '',
    description: '',
    accentColor: '#00F0FF',
    gradient: '',
    coordinator: { name: '', role: '', title: '', avatar: '', email: '' },
    majors: [],
    labsCount: 0,
    studentsCount: 0,
    projectsCount: 0,
    featuredLabs: [],
    flagshipAchievement: ''
  };

  const handleSelect = (id: string) => {
    sound.playClick();
    setSelectedCollegeId(id);
  };


  return (
    <section id="colleges" className="py-28 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>COLLEGES ARCHITECTURE // 01-03</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              كليات المنظومة الهندسية
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base text-gray-400 font-light">
            ثلاث قلاع أكاديمية متكاملة تدمج النظم الصناعية، البرمجية، السيبرانية، والعمرانية لتكوين مهندس شامل.
          </p>
        </div>

        {/* 3 Interactive College Selector Buttons / Navigation Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {collegesList.map((college, idx) => {
            const isActive = college.id === selectedCollegeId;

            return (
              <button
                key={college.id}
                onClick={() => handleSelect(college.id)}
                onMouseEnter={() => sound.playHover()}
                className={`text-right p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer group ${
                  isActive
                    ? 'glass-panel border-cyan-400/60 shadow-[0_10px_35px_-10px_rgba(0,240,255,0.25)] bg-cyan-950/20 scale-[1.02]'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                {/* Active Indicator Top Glow Line */}
                {isActive && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                )}

                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-gray-400 group-hover:text-cyan-400 transition-colors">
                    {college.code}
                  </span>
                  <span
                    className={`font-mono text-xs px-2 py-0.5 rounded-full border ${
                      isActive
                        ? 'border-cyan-400/40 text-cyan-300 bg-cyan-950/80'
                        : 'border-white/10 text-gray-500'
                    }`}
                  >
                    0{idx + 1}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug group-hover:text-cyan-300 transition-colors">
                  {college.name}
                </h3>

                <p className="text-xs text-gray-400 line-clamp-2">
                  {college.tagline}
                </p>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <span>{college.studentsCount} طالب/طالبة</span>
                  <span className="text-cyan-400">{college.labsCount} معامل تخصصية</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Detailed College Exhibition Panel */}
        <div
          className="rounded-3xl glass-panel p-6 sm:p-10 lg:p-12 border border-cyan-500/20 relative overflow-hidden transition-all duration-500"
          style={{
            background: `radial-gradient(circle at 10% 20%, rgba(0, 240, 255, 0.04), transparent 40%), rgba(13, 19, 31, 0.85)`,
          }}
        >
          {/* Subtle blueprint accents */}
          <div className="absolute top-4 left-6 font-mono text-xs text-cyan-500/30 hidden sm:block">
            ACTIVE_SPEC :: {activeCollege.code}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Main Info Column */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 font-mono text-xs mb-4">
                  <span>كود الكلية: {activeCollege.code}</span>
                  <span className="text-cyan-500/50">|</span>
                  <span>{activeCollege.shortName}</span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
                  {activeCollege.name}
                </h3>

                <p className="text-base sm:text-lg text-gray-300 font-light leading-relaxed mb-8">
                  {activeCollege.description}
                </p>

                {/* Flagship Achievement Badge */}
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 mb-8 flex items-start gap-3.5">
                  <Award className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-mono text-cyan-400 uppercase font-bold">أبرز إنجازات الكلية</div>
                    <div className="text-sm text-gray-200 mt-0.5">{activeCollege.flagshipAchievement}</div>
                  </div>
                </div>

                {/* Majors under this college */}
                <div className="mb-8">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>التخصصات المعتمدة تحت الكلية:</span>
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {activeCollege.majors.map((major, i) => (
                      <span
                        key={i}
                        className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-sm font-medium text-cyan-200 hover:border-cyan-400/50 transition-colors"
                      >
                        {major}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Laboratories */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                    <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                    <span>المعامل ومراكز الأبحاث التابعة:</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeCollege.featuredLabs.map((lab, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-black/20 border border-white/5 text-xs sm:text-sm text-gray-300 flex items-center gap-2.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>{lab}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Coordinator Card & College Stats */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* College Coordinator Card */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/40 transition-all duration-300">
                <div className="text-xs font-mono uppercase text-gray-400 mb-4 tracking-wider">
                  // منسق الكلية الأكاديمي
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={activeCollege.coordinator.avatar}
                    alt={activeCollege.coordinator.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400/40 shadow-md"
                  />
                  <div>
                    <h4 className="text-base font-bold text-white">{activeCollege.coordinator.name}</h4>
                    <p className="text-xs text-cyan-400 font-medium">{activeCollege.coordinator.role}</p>
                    <p className="text-xs text-gray-400 mt-1">{activeCollege.coordinator.title}</p>
                  </div>
                </div>

                <a
                  href={`mailto:${activeCollege.coordinator.email}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{activeCollege.coordinator.email}</span>
                </a>
              </div>

              {/* College Metrics Dashboard */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                  <div className="font-mono text-2xl font-extrabold text-cyan-400">{activeCollege.studentsCount}+</div>
                  <div className="text-[11px] text-gray-400 mt-1">طالب مسجل</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                  <div className="font-mono text-2xl font-extrabold text-blue-400">{activeCollege.projectsCount}</div>
                  <div className="text-[11px] text-gray-400 mt-1">مشروع نشط</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                  <div className="font-mono text-2xl font-extrabold text-emerald-400">{activeCollege.labsCount}</div>
                  <div className="text-[11px] text-gray-400 mt-1">معامل بحثية</div>
                </div>
              </div>

              {/* Quick Action */}
              <button
                onClick={() => {
                  sound.playClick();
                  const target = document.querySelector('#projects');
                  target?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-3.5 rounded-xl bg-white/[0.04] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/40 text-sm font-bold text-gray-200 hover:text-cyan-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>استعراض مشاريع {activeCollege.shortName}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
