import React, { useState } from 'react';
import {
  CreditCard,
  Edit3,
  FlaskConical,
  GraduationCap,
  LayoutGrid,
  List,
  ShieldCheck,
} from 'lucide-react';
import type { College, Major } from '../../types';

const DEFAULT_AVATAR = '/brand/emblem.png';

// Colleges and majors tab — hierarchical cards with nested majors, view switcher, and coordinator badges.

export interface CollegesPanelProps {
  colleges: College[];
  majors: Major[];
  onEditCollege: (college: College) => void;
  onEditMajor: (major: Major) => void;
  onViewCoordinatorBadge?: (college: College) => void;
}

export const CollegesPanel: React.FC<CollegesPanelProps> = ({
  colleges,
  majors,
  onEditCollege,
  onEditMajor,
  onViewCoordinatorBadge,
}) => {
  const [collegeSubTab, setCollegeSubTab] = useState<'colleges' | 'majors'>('colleges');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getCollegeMajors = (col: College) =>
    majors.filter(
      (m) =>
        m.collegeName === col.name ||
        m.collegeName.includes(col.shortName) ||
        col.name.includes(m.collegeName) ||
        (col.id === 'it' && (m.collegeName.includes('IT') || m.collegeName.includes('تكنولوجيا'))) ||
        (col.id === 'eng' && (m.collegeName.includes('برمجيات') || m.collegeName.includes('ذكاء'))) ||
        (col.id === 'applied' && (m.collegeName.includes('تطبيقية') || m.collegeName.includes('عمراني')))
    );

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header and Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">إدارة الكليات والتخصصات الهندسية</h3>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
              {colleges.length} كليات • {majors.length} تخصص
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            تعديل بيانات الكليات، المنسقين الأكاديميين المعتمدين، التخصصات المندرجة تحت كل كلية، والمختبرات.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Subtab Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setCollegeSubTab('colleges')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                collegeSubTab === 'colleges'
                  ? 'bg-cyan-400 text-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الكليات ({colleges.length})
            </button>
            <button
              type="button"
              onClick={() => setCollegeSubTab('majors')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                collegeSubTab === 'majors'
                  ? 'bg-cyan-400 text-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              التخصصات التفصيلية ({majors.length})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-cyan-400 text-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="عرض البطاقات (Grid)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-cyan-400 text-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="عرض القائمة المصغرة (List)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub Tab: Colleges */}
      {collegeSubTab === 'colleges' && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {colleges.map((col) => {
              const isNamedCoordinator = Boolean(
                col.coordinator.name &&
                col.coordinator.name.trim() &&
                col.coordinator.name !== 'ممثلو الكلية في النادي'
              );
              const colMajors = getCollegeMajors(col);

              return (
                <div
                  key={col.id}
                  className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xs border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* College Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-cyan-950/70 text-cyan-300 border border-cyan-500/35">
                        {col.code}
                      </span>
                      <span className="font-mono text-xs text-slate-400 flex items-center gap-1">
                        <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{col.labsCount} مختبرات معتمدة</span>
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white mb-1">{col.name}</h4>
                    <p className="text-xs text-slate-300 mb-4 line-clamp-2 leading-relaxed">{col.description}</p>

                    {/* Coordinator Cardlet */}
                    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-3 mb-4">
                      <img
                        src={col.coordinator.avatar || DEFAULT_AVATAR}
                        alt={col.coordinator.name}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0 shadow-xs"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs text-slate-400">منسق وممثل الكلية:</span>
                          {isNamedCoordinator && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-1.5 py-0.5 rounded">
                              <ShieldCheck className="w-3 h-3 text-cyan-400" /> معتمد بالكادر
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-white truncate mt-0.5">{col.coordinator.name}</div>
                        <div className="text-xs text-cyan-400 truncate">{col.coordinator.title}</div>
                      </div>
                    </div>

                    {/* Nested Majors inside College Card */}
                    <div className="mb-4 p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                          <span>التخصصات التابعة للكلية</span>
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">{colMajors.length} تخصص</span>
                      </div>
                      {colMajors.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {colMajors.map((maj) => (
                            <button
                              key={maj.id}
                              type="button"
                              onClick={() => onEditMajor(maj)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/40 text-[11px] font-medium transition-all cursor-pointer group/chip"
                              title={`تعديل بيانات تخصص ${maj.name}`}
                            >
                              <span className="font-mono text-[10px] text-cyan-400 group-hover/chip:text-cyan-300">{maj.code}</span>
                              <span className="truncate max-w-[130px]">{maj.name}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 italic">لا توجد تخصصات مسجلة تحت اسم هذه الكلية</div>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 mb-3">
                      <span className="text-cyan-400 font-bold">الإنجاز الأبرز:</span> {col.flagshipAchievement}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                    {onViewCoordinatorBadge && (
                      <button
                        type="button"
                        onClick={() => onViewCoordinatorBadge(col)}
                        className="py-2 px-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/35 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                        title="عرض وطباعة بطاقة التمثيل والاعتماد القيادي لمنسق الكلية"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>بطاقة التمثيل</span>
                      </button>
                    )}
                    <button
                      onClick={() => onEditCollege(col)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل بيانات الكلية والمنسق</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View for Colleges */
          <div className="space-y-3">
            {colleges.map((col) => {
              const colMajors = getCollegeMajors(col);
              return (
                <div
                  key={col.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-cyan-950/70 text-cyan-300 border border-cyan-500/35 shrink-0">
                      {col.code}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm truncate">{col.name}</h4>
                        <span className="text-slate-500">•</span>
                        <span className="text-xs text-cyan-400 truncate">{col.coordinator.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                        <span>{colMajors.length} تخصصات مسجلة</span>
                        <span className="text-slate-600">•</span>
                        <span>{col.labsCount} مختبرات</span>
                        <span className="text-slate-600">•</span>
                        <span className="truncate max-w-sm">{col.flagshipAchievement}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {onViewCoordinatorBadge && (
                      <button
                        type="button"
                        onClick={() => onViewCoordinatorBadge(col)}
                        className="py-1.5 px-3 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>بطاقة التمثيل</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEditCollege(col)}
                      className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Sub Tab: Majors */}
      {collegeSubTab === 'majors' && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {majors.map((maj) => (
              <div
                key={maj.id}
                className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xs border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                      {maj.code}
                    </span>
                    <span className="text-xs text-slate-400 truncate max-w-[150px]">
                      {maj.collegeName}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1">{maj.name}</h4>
                  <div className="text-xs text-cyan-400 font-medium mb-2">{maj.tagline}</div>
                  <p className="text-xs text-slate-300 mb-3 line-clamp-2 leading-relaxed">{maj.description}</p>

                  <div className="mb-3">
                    <div className="text-xs text-slate-500 font-mono mb-1">التقنيات والأدوات:</div>
                    <div className="flex flex-wrap gap-1">
                      {maj.techStack.map((tech, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onEditMajor(maj)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2 border border-slate-700"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل بيانات التخصص</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* List View for Majors */
          <div className="space-y-3">
            {majors.map((maj) => (
              <div
                key={maj.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 shrink-0">
                    {maj.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm truncate">{maj.name}</h4>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs text-slate-400 truncate">{maj.collegeName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                      <span className="text-cyan-400 font-medium">{maj.tagline}</span>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-[11px] text-slate-400">{maj.techStack.slice(0, 4).join(', ')}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onEditMajor(maj)}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer shrink-0 self-end md:self-center"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل التخصص</span>
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

