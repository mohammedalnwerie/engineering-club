import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { College } from '../types';
import { Award, FlaskConical, BookOpen, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';

const majorsCountLabel = (n: number) => {
  if (n === 1) return 'تخصص واحد';
  if (n === 2) return 'تخصصان';
  if (n >= 3 && n <= 10) return `${n} تخصصات`;
  return `${n} تخصصاً`;
};

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
    setSelectedCollegeId(id);
  };


  return (
    <section id="colleges" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>الكليات المشاركة في النادي</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              كليات المنظومة الهندسية
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base text-gray-400 font-light">
            ثلاث كليات تجمع البرمجيات والذكاء الاصطناعي، وتكنولوجيا المعلومات، والهندسة التطبيقية والتخطيط العمراني تحت مظلة نادٍ واحد.
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

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-gray-400">
                  <span>{majorsCountLabel(college.majors.length)}</span>
                  <span className="text-cyan-400">بيئة تدريبية ومشاريع</span>
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Main Info Column */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 font-mono text-xs mb-4">
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
                    <div className="text-xs font-mono text-cyan-400 uppercase font-bold">رسالة ومسار الكلية</div>
                    <div className="text-sm text-gray-200 mt-0.5">{activeCollege.flagshipAchievement}</div>
                  </div>
                </div>

                {/* Majors under this college */}
                <div className="mb-8">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>تخصصات الكلية:</span>
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

            {/* College Roadmap & Action Card */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* College Club Roadmap Card */}
              <div className="p-6 sm:p-7 rounded-2xl bg-white/[0.02] border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-mono uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>مسار الكلية داخل النادي</span>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                    متاح للجميع
                  </span>
                </div>

                <h4 className="text-lg font-bold text-white mb-2">
                  بيئة تمكين وتطوير لطلبة {activeCollege.shortName}
                </h4>

                <p className="text-xs text-gray-300 leading-relaxed mb-5">
                  يوفر النادي الهندسي لطلبة الكلية مساحة متكاملة للنمو الأكاديمي والمهني، عبر ربط المعرفة النظرية بالمشاريع التطبيقية وتوفير الإرشاد اللازم من الفكرة حتى التخرج.
                </p>

                <div className="space-y-2.5 mb-6">
                  {[
                    'ورش عمل تقنية متخصصة تواكب متطلبات سوق العمل',
                    'تشكيل فرق طلابية للمشاركة في الهاكاثونات والمسابقات',
                    'حاضنة لدعم أفكار مشاريع التخرج وتوفير الاستشارات',
                    'فرص تمثيل الكلية والمشاركة في اللجان التنظيمية'
                  ].map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  <span>عضوية مسار الكلية مفتوحة لجميع طلبة جامعة فلسطين بمختلف المستويات الدراسية.</span>
                </div>

                {/* Primary CTA */}
                <button
                  onClick={() => {
                    const target = document.querySelector('#join');
                    target?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 hover:from-emerald-400 hover:to-cyan-400 hover:text-black border border-cyan-400/40 text-xs sm:text-sm font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.15)] group"
                >
                  <span>انضم لمسار الكلية في النادي الآن</span>
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
