import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { ProjectCaseStudy } from '../types';
import { sound } from '../utils/soundEngine';
import { ArrowUpRight, ExternalLink, X, Award, Users, Cpu, Sparkles, ArrowLeft } from 'lucide-react';

export const ProjectsSection: React.FC = () => {
  const [projectsList, setProjectsList] = useState<ProjectCaseStudy[]>([]);
  const [filter, setFilter] = useState<'all' | 'ai' | 'architecture' | 'software'>('all');
  const [activeModalProject, setActiveModalProject] = useState<ProjectCaseStudy | null>(null);

  const [isVisible, setIsVisible] = useState<boolean>(() => {
    return dataService.getSettings().showProjectsSection !== false;
  });

  useEffect(() => {
    setProjectsList(dataService.getProjects());
    setIsVisible(dataService.getSettings().showProjectsSection !== false);
    const unsub = dataService.subscribe(() => {
      setProjectsList(dataService.getProjects());
      setIsVisible(dataService.getSettings().showProjectsSection !== false);
    });
    return () => unsub();
  }, []);

  const filteredProjects = projectsList.filter((p) => {
    if (filter === 'all') return true;
    return p.category === filter;
  });

  const openProjectModal = (proj: ProjectCaseStudy) => {
    sound.playModalOpen();
    setActiveModalProject(proj);
  };

  const closeModal = () => {
    sound.playClick();
    setActiveModalProject(null);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <section id="projects" className="py-28 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>STUDENT INNOVATION HUB // حاضنة المشاريع الهندسية</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              حاضنة المشاريع والمبادرات الطلابية
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base text-gray-400 font-light leading-relaxed">
            بيئة حاضنة لتمكين طلبة جامعة فلسطين من تحويل أفكارهم الهندسية إلى نماذج وحلول ملموسة تخدم البيئة الجامعية والمجتمع.
          </p>
        </div>

        {/* 4-Stage Project Lifecycle Roadmap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {[
            {
              step: '01',
              title: 'طرح الفكرة والفرز',
              desc: 'تقديم مقترح المشروع أو المبادرة عبر النادي لمناقشة الجدوى والأثر الهندسي.',
              color: 'text-cyan-400',
              borderColor: 'border-cyan-500/30',
              bg: 'bg-cyan-950/20'
            },
            {
              step: '02',
              title: 'تشكيل الفريق والإرشاد',
              desc: 'ربط أصحاب الأفكار بزملائهم من مختلف التخصصات وتعيين مرشدين أكاديميين وطلابيين.',
              color: 'text-blue-400',
              borderColor: 'border-blue-500/30',
              bg: 'bg-blue-950/20'
            },
            {
              step: '03',
              title: 'النمذجة والتطوير',
              desc: 'العمل في ورش العمل واستخدام أدوات المحاكاة والبرمجة لبناء النموذج الأولي (Prototype).',
              color: 'text-emerald-400',
              borderColor: 'border-emerald-500/30',
              bg: 'bg-emerald-950/20'
            },
            {
              step: '04',
              title: 'المعارض والتمثيل',
              desc: 'عرض النماذج في معارض الجامعة والمنافسة بها في الهاكاثونات والمسابقات الهندسية.',
              color: 'text-amber-400',
              borderColor: 'border-amber-500/30',
              bg: 'bg-amber-950/20'
            }
          ].map((stage, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl ${stage.bg} border ${stage.borderColor} relative overflow-hidden transition-all duration-300 hover:border-white/30`}
            >
              <div className={`font-mono text-2xl font-extrabold ${stage.color} mb-2`}>{stage.step}</div>
              <h4 className="text-base font-bold text-white mb-1.5">{stage.title}</h4>
              <p className="text-xs text-gray-300 leading-relaxed">{stage.desc}</p>
            </div>
          ))}
        </div>

        {/* Initiatives Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">المبادرات والمشاريع قيد التأسيس في النادي</h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              نماذج ومبادرات طلابية مفتوحة للمساهمة والانضمام لكافة طلبة الكليات الهندسية والـ IT
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'الكل', value: 'all' },
              { label: 'البرمجيات والأنظمة', value: 'software' },
              { label: 'الذكاء الاصطناعي والتنظيم', value: 'ai' },
              { label: 'العمارة والتخطيط', value: 'architecture' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  sound.playClick();
                  setFilter(tab.value as any);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  filter === tab.value
                    ? 'bg-cyan-400 text-black font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                    : 'bg-white/[0.04] text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-3xl glass-panel border border-white/10 hover:border-cyan-400/50 p-6 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden"
            >
              {/* Subtle top indicator */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent group-hover:via-cyan-400 transition-all duration-500" />

              <div>
                {/* Header Meta: Category & Status */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-white/[0.04] border border-white/10 text-cyan-300">
                    {project.collegeName.split(' ')[0]} // {project.category.toUpperCase()}
                  </span>
                  <span
                    className={`font-mono text-xs px-2.5 py-0.5 rounded-full border ${
                      project.status === 'Deployed'
                        ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30'
                        : project.status === 'Prototyped'
                        ? 'border-cyan-500/40 text-cyan-400 bg-cyan-950/30'
                        : 'border-amber-500/40 text-amber-400 bg-amber-950/30'
                    }`}
                  >
                    ● {project.status === 'Deployed' ? 'مشروع نشط' : project.status === 'Prototyped' ? 'مرحلة النمذجة' : 'قيد التأسيس'}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {project.title}
                </h3>

                {/* Tagline */}
                <p className="text-xs sm:text-sm text-gray-400 mb-5 line-clamp-2">
                  {project.tagline}
                </p>

                {/* Metrics Preview */}
                <div className="grid grid-cols-2 gap-2 mb-5 p-3 rounded-xl bg-black/30 border border-white/5">
                  {project.impactMetrics.slice(0, 2).map((metric, i) => (
                    <div key={i}>
                      <div className="font-mono text-sm sm:text-base font-extrabold text-cyan-400">{metric.value}</div>
                      <div className="text-[10px] text-gray-400">{metric.label}</div>
                    </div>
                  ))}
                </div>

                {/* Tech Stack Badges */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {project.techStack.slice(0, 3).map((tech, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-[10px] font-mono text-gray-300"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.techStack.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.03] text-[10px] font-mono text-gray-500">
                      +{project.techStack.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={() => openProjectModal(project)}
                  className="text-xs sm:text-sm font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>تفاصيل المبادرة (Overview)</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                {project.award && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
                    <Award className="w-3 h-3" />
                    <span>معتمد</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action for Student Projects */}
        <div className="rounded-3xl p-6 sm:p-10 bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-blue-950/30 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <div className="max-w-2xl text-right">
            <div className="inline-flex items-center gap-2 font-mono text-xs text-cyan-300 mb-2 uppercase">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>حاضنة مشاريع جامعة فلسطين // OPEN CALL FOR IDEAS</span>
            </div>
            <h3 className="text-xl sm:text-3xl font-extrabold text-white mb-2">
              لديك فكرة مشروع أو مبادرة هندسية؟
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              لا تبدأ وحيداً! النادي الهندسي يوفر لك بيئة العمل، الشركاء والزملاء من مختلف التخصصات، والإرشاد الأكاديمي لتحويل فكرتك إلى مشروع واقعي نفتخر به جميعاً.
            </p>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              const target = document.querySelector('#join');
              target?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-bold text-xs sm:text-sm hover:from-emerald-300 hover:to-cyan-300 shadow-[0_0_25px_rgba(0,240,255,0.3)] transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>قدّم فكرة مشروعك / انضم للنادي</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Detailed Case Study Modal */}
        {activeModalProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-xl">
            <div
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel border border-cyan-500/30 p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200 text-right"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-6 left-6 p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                    {activeModalProject.collegeName}
                  </span>
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                    الحالة: {activeModalProject.status === 'Deployed' ? 'مشروع نشط' : activeModalProject.status === 'Prototyped' ? 'مرحلة النمذجة' : 'قيد التأسيس'}
                  </span>
                  {activeModalProject.award && (
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      <span>{activeModalProject.award}</span>
                    </span>
                  )}
                </div>

                <h3 className="text-xl sm:text-3xl font-extrabold text-white mb-2">
                  {activeModalProject.title}
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed font-light">
                  {activeModalProject.tagline}
                </p>
              </div>

              {/* Problem & Solution Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Problem */}
                <div className="p-5 rounded-2xl bg-black/40 border border-red-500/20">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase text-red-400 mb-2">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span>الحاجة والدافع للمشروع:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    {activeModalProject.problem}
                  </p>
                </div>

                {/* Solution */}
                <div className="p-5 rounded-2xl bg-black/40 border border-cyan-500/20">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase text-cyan-400 mb-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>الحل الهندسي المقترح:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    {activeModalProject.solution}
                  </p>
                </div>
              </div>

              {/* Schematic Architecture preview */}
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 mb-6 font-mono text-xs text-cyan-300 flex items-center gap-3">
                <Cpu className="w-5 h-5 shrink-0 text-cyan-400" />
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">المخطط التدفقي للمشروع (Workflow / Pipeline):</div>
                  <div className="font-semibold text-white mt-0.5">{activeModalProject.schematicType}</div>
                </div>
              </div>

              {/* Impact Metrics */}
              <div className="mb-6">
                <h4 className="font-mono text-xs uppercase tracking-wider text-gray-400 mb-3">
                  // مؤشرات ومستهدفات المشروع:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {activeModalProject.impactMetrics.map((m, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                      <div className="font-mono text-lg font-extrabold text-cyan-400">{m.value}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack & Team */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Tech Stack */}
                <div className="p-5 rounded-2xl bg-black/30 border border-white/5">
                  <h4 className="font-mono text-xs uppercase text-cyan-400 mb-3">
                    // التقنيات والأدوات:
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeModalProject.techStack.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Team Roles */}
                <div className="p-5 rounded-2xl bg-black/30 border border-white/5">
                  <h4 className="font-mono text-xs uppercase text-emerald-400 mb-3 flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>فريق العمل والمسؤوليات:</span>
                  </h4>
                  <div className="space-y-2">
                    {activeModalProject.team.map((member, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{member.name}</span>
                        <span className="text-gray-400">{member.role} ({member.major})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                {activeModalProject.githubUrl && (
                  <a
                    href={activeModalProject.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-mono text-white flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>مستودع المشروع على GitHub</span>
                  </a>
                )}
                {activeModalProject.demoUrl && (
                  <a
                    href={activeModalProject.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-xs font-mono text-black font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>معاينة الرابط الحي</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
