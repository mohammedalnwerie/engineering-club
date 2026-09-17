import React, { useState } from 'react';
import { Edit3 } from 'lucide-react';
import type { College, Major } from '../../types';

const DEFAULT_AVATAR = '/brand/emblem.png';

// Colleges and majors tab — read-only cards plus an edit button for each.

export interface CollegesPanelProps {
  colleges: College[];
  majors: Major[];
  onEditCollege: (college: College) => void;
  onEditMajor: (major: Major) => void;
}

export const CollegesPanel: React.FC<CollegesPanelProps> = ({ colleges, majors, onEditCollege, onEditMajor }) => {
  const [collegeSubTab, setCollegeSubTab] = useState<'colleges' | 'majors'>('colleges');

  return (
<div className="flex-1 overflow-y-auto p-6 space-y-6">
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h3 className="text-base font-bold text-white">إدارة الكليات والتخصصات الهندسية</h3>
      <p className="text-xs text-gray-400 mt-0.5">
        تعديل أسماء الكليات، بيانات المنسقين الأكاديميين، المختبرات، والتوصيفات التقنية للتخصصات.
      </p>
    </div>

    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
      <button
        onClick={() => setCollegeSubTab('colleges')}
        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
          collegeSubTab === 'colleges'
            ? 'bg-cyan-400 text-black shadow-sm'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        الكليات ({colleges.length})
      </button>
      <button
        onClick={() => setCollegeSubTab('majors')}
        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
          collegeSubTab === 'majors'
            ? 'bg-cyan-400 text-black shadow-sm'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        التخصصات ({majors.length})
      </button>
    </div>
  </div>

  {/* Sub Tab: Colleges */}
  {collegeSubTab === 'colleges' && (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {colleges.map((col) => (
        <div
          key={col.id}
          className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                {col.code}
              </span>
              <span className="font-mono text-xs text-gray-400">
                {col.labsCount} مختبرات متطورة
              </span>
            </div>

            <h4 className="text-base font-bold text-white mb-1">{col.name}</h4>
            <p className="text-xs text-gray-300 mb-3 line-clamp-2">{col.description}</p>

            {/* Coordinator Cardlet */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3 mb-3">
              <img
                src={col.coordinator.avatar || DEFAULT_AVATAR}
                alt={col.coordinator.name}
                className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400">منسق الكلية:</div>
                <div className="text-xs font-bold text-white truncate">{col.coordinator.name}</div>
                <div className="text-xs text-cyan-400 truncate">{col.coordinator.title}</div>
              </div>
            </div>

            <div className="text-xs text-gray-400 mb-3">
              <span className="text-cyan-400 font-bold">الإنجاز الأبرز:</span> {col.flagshipAchievement}
            </div>
          </div>

          <button
            onClick={() => onEditCollege(col)}
            className="w-full py-2 rounded-xl bg-white/[0.05] hover:bg-cyan-400 hover:text-black text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>تعديل بيانات الكلية والمنسق</span>
          </button>
        </div>
      ))}
    </div>
  )}

  {/* Sub Tab: Majors */}
  {collegeSubTab === 'majors' && (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {majors.map((maj) => (
        <div
          key={maj.id}
          className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                {maj.code}
              </span>
              <span className="text-xs text-gray-400 truncate max-w-[150px]">
                {maj.collegeName}
              </span>
            </div>

            <h4 className="text-sm font-bold text-white mb-1">{maj.name}</h4>
            <div className="text-xs text-cyan-400 font-medium mb-2">{maj.tagline}</div>
            <p className="text-xs text-gray-300 mb-3 line-clamp-2">{maj.description}</p>

            <div className="mb-3">
              <div className="text-xs text-gray-500 font-mono mb-1">التقنيات والأدوات:</div>
              <div className="flex flex-wrap gap-1">
                {maj.techStack.map((tech, tIdx) => (
                  <span
                    key={tIdx}
                    className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => onEditMajor(maj)}
            className="w-full py-2 rounded-xl bg-white/[0.05] hover:bg-cyan-400 hover:text-black text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>تعديل بيانات التخصص</span>
          </button>
        </div>
      ))}
    </div>
  )}
</div>
  );
};
