import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { ProjectCaseStudy } from '../types';
import { sound } from '../utils/soundEngine';
import { ArrowUpRight, ExternalLink, X, Award, Users, Cpu } from 'lucide-react';

export const ProjectsSection: React.FC = () => {
  const [projectsList, setProjectsList] = useState<ProjectCaseStudy[]>([]);
  const [filter, setFilter] = useState<'all' | 'ai' | 'architecture' | 'robotics' | 'software'>('all');
  const [activeModalProject, setActiveModalProject] = useState<ProjectCaseStudy | null>(null);

  useEffect(() => {
    setProjectsList(dataService.getProjects());
    const unsub = dataService.subscribe(() => {
      setProjectsList(dataService.getProjects());
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


  return (
    <section id="projects" className="py-28 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>ENGINEERING CASE STUDIES // INNOVATION LAB</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              مشاريع وابتكارات المهندسين
            </h2>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'الكل', value: 'all' },
              { label: 'الذكاء الاصطناعي', value: 'ai' },
              { label: 'العمارة وBIM', value: 'architecture' },
              { label: 'الروبوتات', value: 'robotics' },
              { label: 'البرمجيات والأنظمة', value: 'software' },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-3xl glass-panel border border-white/10 hover:border-cyan-400/50 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden"
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
                        : 'border-cyan-500/40 text-cyan-400 bg-cyan-950/30'
                    }`}
                  >
                    ● {project.status}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {project.title}
                </h3>

                {/* Tagline */}
                <p className="text-sm text-gray-400 mb-6 line-clamp-2">
                  {project.tagline}
                </p>

                {/* Metrics Preview */}
                <div className="grid grid-cols-2 gap-3 mb-6 p-3 rounded-xl bg-black/30 border border-white/5">
                  {project.impactMetrics.slice(0, 2).map((metric, i) => (
                    <div key={i}>
                      <div className="font-mono text-lg font-extrabold text-cyan-400">{metric.value}</div>
                      <div className="text-[11px] text-gray-400">{metric.label}</div>
                    </div>
                  ))}
                </div>

                {/* Tech Stack Badges */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {project.techStack.slice(0, 4).map((tech, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded bg-white/[0.03] border border-white/5 text-[11px] font-mono text-gray-300"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.techStack.length > 4 && (
                    <span className="px-2 py-1 rounded bg-white/[0.03] text-[11px] font-mono text-gray-500">
                      +{project.techStack.length - 4}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={() => openProjectModal(project)}
                  className="text-sm font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>عرض دراسة الحالة كاملة (Case Study)</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                {project.award && (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                    <Award className="w-3.5 h-3.5" />
                    <span>مُكرَّم</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Case Study Modal */}
        {activeModalProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-xl">
            <div
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel border border-cyan-500/30 p-6 sm:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200"
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
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                    {activeModalProject.collegeName}
                  </span>
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                    حالة المشروع: {activeModalProject.status}
                  </span>
                  {activeModalProject.award && (
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      <span>{activeModalProject.award}</span>
                    </span>
                  )}
                </div>

                <h3 className="text-2xl sm:text-4xl font-extrabold text-white mb-3">
                  {activeModalProject.title}
                </h3>
                <p className="text-base text-gray-300 leading-relaxed font-light">
                  {activeModalProject.tagline}
                </p>
              </div>

              {/* Problem & Solution Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Problem */}
                <div className="p-6 rounded-2xl bg-black/40 border border-red-500/20">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase text-red-400 mb-2">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span>المشكلة والتحدي الهندسي:</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {activeModalProject.problem}
                  </p>
                </div>

                {/* Solution */}
                <div className="p-6 rounded-2xl bg-black/40 border border-cyan-500/20">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase text-cyan-400 mb-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>الحل الهندسي المبتكر:</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {activeModalProject.solution}
                  </p>
                </div>
              </div>

              {/* Schematic Architecture preview */}
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 mb-8 font-mono text-xs text-cyan-300 flex items-center gap-3">
                <Cpu className="w-5 h-5 shrink-0 text-cyan-400" />
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">المخطط التدفقي للنظام (System Pipeline):</div>
                  <div className="font-semibold text-white mt-0.5">{activeModalProject.schematicType}</div>
                </div>
              </div>

              {/* Impact Metrics */}
              <div className="mb-8">
                <h4 className="font-mono text-xs uppercase tracking-wider text-gray-400 mb-3">
                  // مؤشرات الأداء والنتائج المحققة (Impact Metrics):
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {activeModalProject.impactMetrics.map((m, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                      <div className="font-mono text-2xl font-extrabold text-cyan-400">{m.value}</div>
                      <div className="text-xs text-gray-400 mt-1">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack & Team */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Tech Stack */}
                <div className="p-6 rounded-2xl bg-black/30 border border-white/5">
                  <h4 className="font-mono text-xs uppercase text-cyan-400 mb-3">
                    // حزمة التقنيات المستخدمة:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeModalProject.techStack.map((tech, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Team Roles */}
                <div className="p-6 rounded-2xl bg-black/30 border border-white/5">
                  <h4 className="font-mono text-xs uppercase text-emerald-400 mb-3 flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>فريق العمل الطلابي:</span>
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
              <div className="flex flex-wrap gap-3 pt-6 border-t border-white/10">
                {activeModalProject.githubUrl && (
                  <a
                    href={activeModalProject.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-mono text-white flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <span>الكود المصدري في GitHub</span>
                  </a>
                )}
                {activeModalProject.demoUrl && (
                  <a
                    href={activeModalProject.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-xs font-mono text-black font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>استعراض النموذج الحي (Live Demo)</span>
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
