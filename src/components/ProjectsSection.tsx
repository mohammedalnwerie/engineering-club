import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { dataService } from '../services/dataService';
import type { ProjectCaseStudy } from '../types';
import { ArrowUpRight, ExternalLink, X, Award, Users, Cpu, Sparkles, ArrowLeft } from 'lucide-react';

const PROJECT_CATEGORY_LABELS: Record<string, string> = {
  software: 'البرمجيات والأنظمة',
  ai: 'الذكاء الاصطناعي',
  architecture: 'العمارة والتخطيط',
};

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
    setActiveModalProject(proj);
  };

  const closeModal = () => {
    setActiveModalProject(null);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <section id="projects" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>حاضنة المشاريع الهندسية</span>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-16">
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
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent group-hover:via-cyan-400 transition-all duration-500 z-10" />

              {/* Optional Project Cover Image */}
              {project.imageUrl && (
                <div className="relative -mx-6 -mt-6 mb-4 h-48 sm:h-52 overflow-hidden bg-black/40">
                  <img
                    src={project.imageUrl}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0624] via-transparent to-black/20" />
                </div>
              )}

              <div>
                {/* Header Meta: Category & Status */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-white/[0.04] border border-white/10 text-cyan-300">
                    {PROJECT_CATEGORY_LABELS[project.category] || project.category}
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
                      <div className="text-xs text-gray-400">{metric.label}</div>
                    </div>
                  ))}
                </div>

                {/* Tech Stack Badges */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {project.techStack.slice(0, 3).map((tech, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-xs font-mono text-gray-300"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.techStack.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.03] text-xs font-mono text-gray-500">
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
                  <span>تفاصيل المبادرة</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>

              </div>
            </div>
          ))}
        </div>

        {/* Call to Action for Student Projects */}
        <div className="rounded-3xl p-6 sm:p-10 bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-blue-950/30 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <div className="max-w-2xl text-right">
            <div className="inline-flex items-center gap-2 font-mono text-xs text-cyan-300 mb-2 uppercase">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>باب الأفكار مفتوح</span>
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
        {activeModalProject &&
          createPortal(
            <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 sm:p-6 pt-20 sm:pt-24 pb-8 overflow-y-auto bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
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
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 leading-tight">
                    {activeModalProject.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light">
                    {activeModalProject.tagline}
                  </p>
                </div>

                {/* Optional Project Cover Image */}
                {activeModalProject.imageUrl && (
                  <div className="mb-6 rounded-2xl overflow-hidden border border-white/10 max-h-80 bg-black/40 shadow-xl">
                    <img
                      src={activeModalProject.imageUrl}
                      alt={activeModalProject.title}
                      className="w-full h-full max-h-80 object-cover"
                    />
                  </div>
                )}

                {/* Architecture Schema / Blueprint Visualizer */}
                <div className="mb-8 p-5 rounded-2xl bg-black/40 border border-white/10 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs text-gray-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      <span>المخطط الهندسي والمعماري للمشروع ({activeModalProject.schematicType})</span>
                    </span>
                    <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                      معتمد من حاضنة النادي
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#08041D]/90 border border-cyan-500/20 text-center font-mono text-xs text-cyan-300">
                    <Sparkles className="w-5 h-5 mx-auto mb-2 text-cyan-400 animate-pulse" />
                    <p className="text-xs text-gray-300">
                      تم تصميم بنية هذا الحل الهندسي وفق معايير الجودة الأكاديمية والمهنية داخل مختبرات كلية {activeModalProject.collegeName}.
                    </p>
                  </div>
                </div>

                {/* Problem vs Solution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/20">
                    <h4 className="text-sm font-bold text-red-400 mb-2">المشكلة والتحدي الهندسي:</h4>
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                      {activeModalProject.problem}
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
                    <h4 className="text-sm font-bold text-emerald-400 mb-2">الحل المبتكر والأثر:</h4>
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                      {activeModalProject.solution}
                    </p>
                  </div>
                </div>

                {/* Impact Metrics */}
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-white mb-3">مؤشرات الأداء والأثر الميداني:</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {activeModalProject.impactMetrics.map((metric, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                        <div className="font-mono text-lg sm:text-xl font-extrabold text-cyan-400 mb-1">
                          {metric.value}
                        </div>
                        <div className="text-[11px] text-gray-400 font-light">
                          {metric.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-white mb-3">حزمة الأدوات والتقنيات المستخدمة:</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeModalProject.techStack.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-xs font-mono text-gray-200"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Team */}
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>فريق العمل الطلابي:</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {activeModalProject.team.map((member, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center font-bold text-xs text-cyan-300 shrink-0">
                          {member.name.slice(0, 1)}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-white truncate">{member.name}</div>
                          <div className="text-[10px] text-gray-400 truncate">{member.role} • {member.major}</div>
                        </div>
                      </div>
                    ))}
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
            </div>,
            document.body
          )}
      </div>
    </section>
  );
};
