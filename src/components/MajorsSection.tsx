import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { Major } from '../types';
import { sound } from '../utils/soundEngine';
import { Terminal, Cpu, BrainCircuit, ShieldCheck, Compass, Building2, ChevronLeft, Layers, ArrowUpRight, Sparkles } from 'lucide-react';

const ICONS_MAP: Record<string, React.ElementType> = {
  Terminal,
  Cpu,
  BrainCircuit,
  ShieldCheck,
  Compass,
  Building2,
};

export const MajorsSection: React.FC = () => {
  const [majorsList, setMajorsList] = useState<Major[]>([]);
  const [activeMajorId, setActiveMajorId] = useState<string>('');

  useEffect(() => {
    const list = dataService.getMajors();
    setMajorsList(list);
    if (list.length > 0 && !activeMajorId) {
      setActiveMajorId(list[0].id);
    }
    const unsub = dataService.subscribe(() => {
      const updated = dataService.getMajors();
      setMajorsList(updated);
    });
    return () => unsub();
  }, [activeMajorId]);

  const activeMajor = majorsList.find((m) => m.id === activeMajorId) || majorsList[0] || {
    id: 'default',
    code: 'ENG',
    name: 'هندسة البرمجيات',
    collegeId: 'industrial-software',
    collegeName: 'كلية الهندسة',
    tagline: '',
    description: '',
    iconName: 'Terminal',
    accentColor: '#00F0FF',
    techStack: [],
    careerPaths: [],
    keyCourses: [],
    featuredProjectTitle: ''
  };
  const ActiveIcon = ICONS_MAP[activeMajor.iconName] || Terminal;

  const handleSelectMajor = (id: string) => {
    sound.playClick();
    setActiveMajorId(id);
  };


  return (
    <section id="majors" className="py-28 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#07090e]/60">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/40 border border-blue-500/30 text-blue-400 text-xs font-mono mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>DISCIPLINES & PATHWAYS // 6 MAJORS</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              التخصصات والمسارات الهندسية
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base text-gray-400 font-light">
            تعرف على الأدوات، المهارات التقنية، والمستقبل الوظيفي لكل مسار هندسي داخل منظومتنا الأكاديمية.
          </p>
        </div>

        {/* 6 Majors Horizontal Interactive Selector Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {majorsList.map((major) => {
            const isSelected = major.id === activeMajorId;

            const Icon = ICONS_MAP[major.iconName] || Terminal;

            return (
              <button
                key={major.id}
                onClick={() => handleSelectMajor(major.id)}
                onMouseEnter={() => sound.playHover()}
                className={`p-4 rounded-2xl border text-right transition-all duration-300 relative overflow-hidden cursor-pointer flex flex-col justify-between h-36 ${
                  isSelected
                    ? 'glass-panel border-cyan-400/80 shadow-[0_0_25px_rgba(0,240,255,0.2)] bg-cyan-950/30'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-500 bg-white/5'
                    }`}
                  >
                    {major.code}
                  </span>
                  <Icon
                    className={`w-5 h-5 transition-transform duration-300 ${
                      isSelected ? 'text-cyan-400 scale-110' : 'text-gray-400'
                    }`}
                  />
                </div>

                <div>
                  <h4
                    className={`text-sm font-bold leading-tight transition-colors ${
                      isSelected ? 'text-white' : 'text-gray-300'
                    }`}
                  >
                    {major.name}
                  </h4>
                  <div className="font-mono text-[10px] text-gray-500 mt-1 truncate">
                    {major.collegeName.split(' ')[0]}
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-cyan-400 shadow-[0_0_10px_#00f0ff]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Deep Dive Interactive Major Showcase Stage */}
        <div className="rounded-3xl glass-panel p-6 sm:p-10 border border-white/10 relative overflow-hidden">
          {/* Blueprint Wireframe Background */}
          <div className="absolute inset-0 bg-blueprint-grid opacity-30 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Header and Overview */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-cyan-950/60 border border-cyan-400/40 text-cyan-400 shadow-md">
                    <ActiveIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="font-mono text-xs text-cyan-400 uppercase tracking-wider">
                      SPEC CODE: {activeMajor.code} // {activeMajor.collegeName}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                      {activeMajor.name}
                    </h3>
                  </div>
                </div>

                <p className="text-base text-gray-300 leading-relaxed mb-6 font-light">
                  {activeMajor.description}
                </p>

                {/* Key Courses */}
                <div className="mb-6">
                  <h5 className="font-mono text-xs uppercase tracking-wider text-gray-400 mb-3">
                    // المقررات والموضوعات الجوهرية:
                  </h5>
                  <div className="space-y-2">
                    {activeMajor.keyCourses.map((course, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs sm:text-sm text-gray-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span>{course}</span>
                        </div>
                        <span className="font-mono text-[10px] text-gray-500">MOD-{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Technical Stack & Career Trajectory */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              {/* Tech Stack Chips */}
              <div className="p-6 rounded-2xl bg-black/30 border border-white/10">
                <h5 className="font-mono text-xs uppercase tracking-wider text-cyan-400 mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>الأدوات والتقنيات المعتمدة (Tech Stack):</span>
                </h5>
                <div className="flex flex-wrap gap-2">
                  {activeMajor.techStack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono font-medium text-cyan-300 shadow-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Career Horizons */}
              <div className="p-6 rounded-2xl bg-black/30 border border-white/10">
                <h5 className="font-mono text-xs uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>المسارات والمسميات الوظيفية المستقبلية:</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeMajor.careerPaths.map((career, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs sm:text-sm text-gray-200 flex items-center gap-2"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{career}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Featured Outcome Spotlight */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/30 via-cyan-950/20 to-transparent border border-blue-500/30 flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] text-blue-400 uppercase">مشروع طلابي بارز في المسار</div>
                  <div className="text-sm font-bold text-white mt-0.5">{activeMajor.featuredProjectTitle}</div>
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    const target = document.querySelector('#projects');
                    target?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-cyan-400 hover:text-black text-xs font-bold transition-all text-gray-200 flex items-center gap-1 cursor-pointer"
                >
                  <span>استعراض</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
