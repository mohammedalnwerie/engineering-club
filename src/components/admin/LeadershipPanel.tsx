import React, { useState } from 'react';
import {
  Award,
  Camera,
  CreditCard,
  Crown,
  Download,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  LayoutGrid,
  List,
  Plus,
  Search,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';
import type { LeaderMember, StoredApplication } from '../../types';
import { downloadCsv } from '../../utils/security';

const DEFAULT_AVATAR = '/brand/emblem.png';

// The leadership tab: hierarchical organogram + grid/list switcher + committee roster.
export interface LeadershipPanelProps {
  leadership: LeaderMember[];
  applications: StoredApplication[];
  onAdd: () => void;
  onEdit: (leader: LeaderMember) => void;
  onDelete: (id: string, name: string) => void;
  onToggleVisibility: (leader: LeaderMember) => void;
  onAvatarUpload: (leader: LeaderMember, file: File) => void;
  onResetAvatar: (leader: LeaderMember) => void;
  onViewLeaderBadge: (leader: LeaderMember) => void;
  onViewCommitteeCard: (app: StoredApplication) => void;
  onShowToast?: (msg: string) => void;
}

export const LeadershipPanel: React.FC<LeadershipPanelProps> = ({
  leadership,
  applications,
  onAdd,
  onEdit,
  onDelete,
  onToggleVisibility,
  onAvatarUpload,
  onResetAvatar,
  onViewLeaderBadge,
  onViewCommitteeCard,
  onShowToast,
}) => {
  const [leaderFilter, setLeaderFilter] = useState<'all' | 'executive' | 'committee-lead' | 'college-lead'>('all');
  const [leaderSearch, setLeaderSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredLeaders = leadership
    .filter((l) => {
      if (leaderFilter === 'executive') return l.tier === 'executive';
      if (leaderFilter === 'committee-lead') return l.tier === 'committee-lead';
      if (leaderFilter === 'college-lead') return l.tier === 'college-lead';
      return true;
    })
    .filter((l) => {
      if (!leaderSearch.trim()) return true;
      const q = leaderSearch.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.role.toLowerCase().includes(q) ||
        l.department.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
      );
    });

  const isHierarchicalView = leaderFilter === 'all' && !leaderSearch.trim();
  const executiveLeaders = filteredLeaders.filter((l) => l.tier === 'executive');
  const collegeLeaders = filteredLeaders.filter((l) => l.tier === 'college-lead');
  const committeeLeaders = filteredLeaders.filter((l) => l.tier === 'committee-lead');

  // Render a single leader card for Grid View
  const renderLeaderCard = (leader: LeaderMember) => {
    const isPresident = leader.id === 'pres-1' || (leader.role.includes('رئيس النادي') && !leader.role.includes('نائب'));
    const isVicePresident = leader.role.includes('نائب رئيس') || leader.role.includes('نائب');
    return (
      <div
        key={leader.id}
        className={`p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xs border transition-all flex flex-col justify-between group min-h-[310px] ${
          isPresident
            ? 'border-amber-500/40 hover:border-amber-400/70 shadow-[0_0_20px_rgba(245,158,11,0.06)]'
            : isVicePresident || leader.tier === 'executive'
            ? 'border-blue-500/30 hover:border-blue-400/50'
            : leader.tier === 'college-lead'
            ? 'border-cyan-500/30 hover:border-cyan-400/50'
            : 'border-slate-800 hover:border-purple-500/40'
        }`}
      >
        <div>
          <div className="flex items-start gap-3.5 mb-3">
            {/* Avatar with Direct Upload & Delete Actions */}
            <div className="relative group/avatar shrink-0">
              <img
                src={leader.avatar || DEFAULT_AVATAR}
                alt={leader.name}
                className="w-15 h-15 rounded-2xl object-cover border border-slate-700 shadow-sm group-hover/avatar:border-cyan-400/50 transition-all"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                }}
              />
              {/* Upload Camera Button */}
              <label
                className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black flex items-center justify-center shadow-lg border border-cyan-100 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                title="تغيير الصورة من جهازك فوراً"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = '';
                  }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onAvatarUpload(leader, file);
                    }
                  }}
                />
              </label>

              {/* Delete Photo / Set Default Button — only if custom photo exists */}
              {leader.avatar && leader.avatar !== DEFAULT_AVATAR && (
                <button
                  type="button"
                  onClick={() => onResetAvatar(leader)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-950/90 hover:bg-red-800 border border-red-500/60 text-red-400 hover:text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
                  title="استعادة الصورة الافتراضية"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-sm truncate">
                {leader.name || <span className="text-gray-500">قريباً يُعلن</span>}
              </h4>
              {leader.hidden && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/50 border border-amber-500/40 rounded px-1.5 py-0.5 mt-1">
                  <EyeOff className="w-3 h-3" /> مخفي عن الموقع
                </span>
              )}
              <div className="text-xs text-cyan-400 font-medium truncate mt-0.5">
                {leader.role}
              </div>
              <span
                className={`inline-block font-mono text-[11px] px-2 py-0.5 rounded-md mt-1.5 border ${
                  isPresident
                    ? 'bg-amber-950/50 text-amber-300 border-amber-500/40'
                    : isVicePresident
                    ? 'bg-blue-950/50 text-blue-300 border-blue-500/40'
                    : leader.tier === 'executive'
                    ? 'bg-indigo-950/50 text-indigo-300 border-indigo-500/40'
                    : leader.tier === 'college-lead'
                    ? 'bg-cyan-950/50 text-cyan-300 border-cyan-500/40'
                    : 'bg-purple-950/50 text-purple-300 border-purple-500/40'
                }`}
              >
                {isPresident
                  ? 'رئيس النادي'
                  : isVicePresident
                  ? 'نائب رئيس النادي'
                  : leader.tier === 'executive'
                  ? 'الهيئة الإدارية'
                  : leader.tier === 'college-lead'
                  ? 'ممثلو الكليات'
                  : 'مسؤول لجنة تنفيذي'}
              </span>
            </div>
          </div>

          {leader.quote && (
            <div className="text-xs text-slate-300 italic bg-white/[0.02] p-2.5 rounded-xl border border-white/5 mb-3 line-clamp-2">
              "{leader.quote}"
            </div>
          )}

          <div className="space-y-1 text-xs text-slate-400 mb-3 font-mono">
            {leader.department && (
              <div className="truncate">
                <span className="text-slate-500">القسم:</span> {leader.department}
              </div>
            )}
            {leader.email ? (
              <div className="truncate text-xs text-slate-400">
                <span className="text-slate-500">البريد:</span> {leader.email}
              </div>
            ) : null}
          </div>

          {/* Skills */}
          {leader.skills && leader.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {leader.skills.slice(0, 4).map((skill, sIdx) => (
                <span
                  key={sIdx}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => onViewLeaderBadge(leader)}
            className="py-1.5 px-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/35 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
            title="عرض وطباعة بطاقة التكليف والاعتماد القيادي"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>بطاقة التكليف</span>
          </button>
          <button
            type="button"
            onClick={() => onEdit(leader)}
            className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>تعديل</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleVisibility(leader)}
            className={`p-2 rounded-xl text-xs transition-colors cursor-pointer border ${
              leader.hidden
                ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={leader.hidden ? 'إظهار البطاقة في الموقع' : 'إخفاء البطاقة عن الموقع'}
          >
            {leader.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onDelete(leader.id, leader.name)}
            className="p-2 rounded-xl bg-red-950/30 hover:bg-red-950 text-red-400 text-xs transition-colors cursor-pointer border border-red-900/40"
            title="حذف القائد"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  // Render a single leader row for List View
  const renderLeaderRow = (leader: LeaderMember) => {
    const isPresident = leader.id === 'pres-1' || (leader.role.includes('رئيس النادي') && !leader.role.includes('نائب'));
    const isVicePresident = leader.role.includes('نائب رئيس') || leader.role.includes('نائب');
    return (
      <div
        key={leader.id}
        className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <img
              src={leader.avatar || DEFAULT_AVATAR}
              alt={leader.name}
              className="w-11 h-11 rounded-xl object-cover border border-slate-700 shadow-xs"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
              }}
            />
            <label
              className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110"
              title="تغيير الصورة فوراً"
            >
              <Camera className="w-2.5 h-2.5" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onClick={(e) => {
                  (e.target as HTMLInputElement).value = '';
                }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onAvatarUpload(leader, file);
                }}
              />
            </label>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm truncate">{leader.name || 'قريباً يُعلن'}</span>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                  isPresident
                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                    : isVicePresident
                    ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                    : leader.tier === 'executive'
                    ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                    : leader.tier === 'college-lead'
                    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                    : 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                }`}
              >
                {isPresident
                  ? 'رئيس النادي'
                  : isVicePresident
                  ? 'نائب رئيس النادي'
                  : leader.tier === 'executive'
                  ? 'الهيئة الإدارية'
                  : leader.tier === 'college-lead'
                  ? 'ممثلو الكليات'
                  : 'رئيس لجنة'}
              </span>
              {leader.hidden && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/50 border border-amber-500/40 rounded px-1.5 py-0.5">
                  <EyeOff className="w-2.5 h-2.5" /> مخفي
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-0.5 flex-wrap">
              <span className="text-cyan-400 font-medium">{leader.role}</span>
              <span className="text-slate-600">•</span>
              <span>{leader.department}</span>
              {leader.email && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-slate-400 text-[11px]">{leader.email}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
          <button
            type="button"
            onClick={() => onViewLeaderBadge(leader)}
            className="py-1 px-2.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
            title="عرض وطباعة بطاقة التكليف والاعتماد"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>بطاقة التكليف</span>
          </button>
          <button
            type="button"
            onClick={() => onEdit(leader)}
            className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
            title="تعديل البطاقة والبيانات"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>تعديل</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleVisibility(leader)}
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer border ${
              leader.hidden
                ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={leader.hidden ? 'إظهار في الموقع' : 'إخفاء عن الموقع'}
          >
            {leader.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onDelete(leader.id, leader.name)}
            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 text-xs transition-colors cursor-pointer"
            title="حذف القائد"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const exportLeadershipCsv = () => {
    const headers = [
      'الاسم الكامل',
      'المسمى الإداري والقيادي',
      'المستوى التنظيمي',
      'القسم / الكلية',
      'البريد الإلكتروني',
      'رابط لينكد إن',
      'رابط جيت هاب',
      'الرؤية / الاقتباس',
      'المهارات والاهتمامات',
      'حالة العرض في الموقع',
    ];

    const rows = filteredLeaders.map((l) => [
      l.name,
      l.role,
      l.id === 'pres-1' || (l.role.includes('رئيس النادي') && !l.role.includes('نائب'))
        ? 'رئيس النادي'
        : l.role.includes('نائب')
        ? 'نائب رئيس النادي'
        : l.tier === 'executive'
        ? 'الهيئة الإدارية'
        : l.tier === 'college-lead'
        ? 'ممثلو الكليات'
        : 'رؤساء اللجان',
      l.department || '—',
      l.email || '—',
      l.linkedin || '—',
      l.github || '—',
      l.quote || '—',
      (l.skills || []).join(' · '),
      l.hidden ? 'مخفي عن الموقع' : 'معروض في الموقع',
    ]);

    downloadCsv(`UP-Leadership-${new Date().toISOString().slice(0, 10)}`, headers, rows);
    onShowToast?.(`تم تصدير ${filteredLeaders.length} قيادي كملف Excel (CSV) بنجاح`);
  };

  const exportCommitteesCsv = () => {
    const committeeMembers = applications.filter(
      (a) => a.status === 'تم القبول' && a.targetCommittee && !a.targetCommittee.includes('عامة')
    );
    const headers = [
      'الاسم الكامل',
      'الرقم الجامعي',
      'اللجنة المعتمدة',
      'المسمى التنظيمي',
      'التخصص',
      'الكلية',
      'السنة الدراسية',
      'البريد الإلكتروني',
      'رقم الجوال',
      'رمز العضوية',
    ];
    const rows = committeeMembers.map((m) => [
      m.fullName,
      m.studentId,
      m.targetCommittee,
      m.organizationalRole || 'عضو لجنة',
      m.major,
      m.college,
      m.academicYear,
      m.email || '—',
      m.phone || '—',
      m.memberCode || '—',
    ]);
    downloadCsv(`UP-Committee-Taskforce-${new Date().toISOString().slice(0, 10)}`, headers, rows);
    onShowToast?.(`تم تصدير ${committeeMembers.length} عضو لجنة كملف Excel (CSV) بنجاح`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">إدارة الكادر القيادي والهيكل التنظيمي</h3>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
              {leadership.length} قيادي
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            التحكم ببيانات وصور رئيس النادي، الهيئة الإدارية (نائب الشؤون الإدارية، نائب الشؤون التنفيذية، أمين الصندوق)، وممثلي الكليات، ورؤساء اللجان.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={exportLeadershipCsv}
            disabled={filteredLeaders.length === 0}
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="تصدير بيانات الكادر القيادي كملف Excel (CSV)"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>تصدير القيادات (CSV)</span>
          </button>
          <button
            type="button"
            onClick={onAdd}
            className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.2)] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة قائد / مهندس جديد</span>
          </button>
        </div>
      </div>

      {/* Quick Stats / Hierarchy Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-amber-500/25 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-amber-300/90">رئاسة ومجلس الإدارة</div>
            <div className="text-base font-bold text-white mt-0.5">
              {leadership.filter((l) => l.tier === 'executive').length} قيادات
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Crown className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-cyan-500/25 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-cyan-300/90">ممثلو الكليات الهندسية</div>
            <div className="text-base font-bold text-white mt-0.5">
              {leadership.filter((l) => l.tier === 'college-lead').length} كليات
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <GraduationCap className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-purple-500/25 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-purple-300/90">مسؤولو اللجان التنفيذية</div>
            <div className="text-base font-bold text-white mt-0.5">
              {leadership.filter((l) => l.tier === 'committee-lead').length} لجان
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-emerald-500/25 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-emerald-300/90">كوادر وفرق اللجان</div>
            <div className="text-base font-bold text-white mt-0.5">
              {applications.filter((a) => a.status === 'تم القبول' && a.targetCommittee && !a.targetCommittee.includes('عامة')).length} عضواً
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filters, Search & View Switcher Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-2 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => setLeaderFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              leaderFilter === 'all'
                ? 'bg-cyan-400 text-black shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الهيكل التنظيمي كاملاً ({leadership.length})
          </button>
          <button
            onClick={() => setLeaderFilter('executive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              leaderFilter === 'executive'
                ? 'bg-amber-400 text-black shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الرئاسة والإدارة ({leadership.filter((l) => l.tier === 'executive').length})
          </button>
          <button
            onClick={() => setLeaderFilter('college-lead')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              leaderFilter === 'college-lead' ? 'bg-cyan-300 text-black shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            ممثلو الكليات ({leadership.filter((l) => l.tier === 'college-lead').length})
          </button>
          <button
            onClick={() => setLeaderFilter('committee-lead')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              leaderFilter === 'committee-lead'
                ? 'bg-purple-400 text-black shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            مسؤولو اللجان ({leadership.filter((l) => l.tier === 'committee-lead').length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث بالاسم أو المسمى أو القسم..."
              value={leaderSearch}
              onChange={(e) => setLeaderSearch(e.target.value)}
              className="w-full pl-3 pr-9 py-1.5 rounded-xl bg-black/40 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-black/40 border border-slate-700 rounded-xl shrink-0">
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

      {/* Main Content Area */}
      {isHierarchicalView ? (
        /* Hierarchical Organogram Display */
        <div className="space-y-8">
          {/* Tier 1: Executive Council */}
          {executiveLeaders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">مجلس الإدارة والأمانة العامة</h4>
                    <p className="text-[11px] text-slate-400">الرئاسة والتخطيط الاستراتيجي والإشراف العام على شؤون النادي</p>
                  </div>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-amber-950/50 text-amber-300 border border-amber-500/30">
                  {executiveLeaders.length} قيادات
                </span>
              </div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {executiveLeaders.map(renderLeaderCard)}
                </div>
              ) : (
                <div className="space-y-2.5">{executiveLeaders.map(renderLeaderRow)}</div>
              )}
            </div>
          )}

          {/* Tier 2: Academic Colleges Leads */}
          {collegeLeaders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">ممثلو ومنسقو الكليات الهندسية</h4>
                    <p className="text-[11px] text-slate-400">التنسيق الأكاديمي والمتابعة المباشرة مع كليات الهندسة وتخصصاتها</p>
                  </div>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-cyan-950/50 text-cyan-300 border border-cyan-500/30">
                  {collegeLeaders.length} كليات
                </span>
              </div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collegeLeaders.map(renderLeaderCard)}
                </div>
              ) : (
                <div className="space-y-2.5">{collegeLeaders.map(renderLeaderRow)}</div>
              )}
            </div>
          )}

          {/* Tier 3: Executive Committee Directors */}
          {committeeLeaders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">مسؤولو اللجان التنفيذية</h4>
                    <p className="text-[11px] text-slate-400">القيادة التشغيلية والميدانية لمسارات الفعاليات، العلاقات، والإعلام</p>
                  </div>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-purple-950/50 text-purple-300 border border-purple-500/30">
                  {committeeLeaders.length} لجان
                </span>
              </div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {committeeLeaders.map(renderLeaderCard)}
                </div>
              ) : (
                <div className="space-y-2.5">{committeeLeaders.map(renderLeaderRow)}</div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Filtered or Searched Display */
        <div>
          {filteredLeaders.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
              <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="text-white font-bold text-sm">لا يوجد قادة مطابقون للبحث</h4>
              <p className="text-xs text-slate-400 mt-1">جرّب البحث بكلمات مختلفة أو اختر تصنيفاً آخر.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeaders.map(renderLeaderCard)}
            </div>
          ) : (
            <div className="space-y-2.5">{filteredLeaders.map(renderLeaderRow)}</div>
          )}
        </div>
      )}

      {/* Certified Committee Taskforce Section */}
      <div className="mt-12 pt-8 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-xs mb-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>فرق عمل اللجان</span>
            </div>
            <h4 className="text-base font-bold text-white">كوادر وأعضاء اللجان التنفيذية المعتمدين</h4>
            <p className="text-xs text-slate-400">
              الطلبة المقبولون رسمياً في اللجان التنفيذية (فعاليات، علاقات وتدريب، إعلام) مع إمكانية استخراج كروت العضوية الرسمية لكل عضو.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={exportCommitteesCsv}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="تصدير أعضاء اللجان كملف Excel (CSV)"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>تصدير كوادر اللجان (CSV)</span>
            </button>
            <div className="text-xs text-slate-400 font-mono bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
              إجمالي الأعضاء باللجان: <span className="text-cyan-400 font-bold">{applications.filter((a) => a.status === 'تم القبول' && a.targetCommittee && !a.targetCommittee.includes('عامة')).length}</span>
            </div>
          </div>
        </div>

        {/* Committees Roster */}
        {['لجنة الأنشطة والبرامج', 'لجنة العلاقات والشراكات', 'لجنة الإعلام والاتصال'].map((commGroup) => {
          const isEvt = commGroup.includes('الأنشطة') || commGroup.includes('الفعاليات');
          const isRel = commGroup.includes('العلاقات');

          const members = applications.filter((a) => {
            if (a.status !== 'تم القبول') return false;
            const c = a.targetCommittee || '';
            if (isEvt) return c.includes('أنشطة') || c.includes('برامج') || c.includes('فعاليات') || c.includes('events');
            if (isRel) return c.includes('علاقات') || c.includes('شراكات') || c.includes('تدريب') || c.includes('training');
            return c.includes('إعلام') || c.includes('اعلام') || c.includes('اتصال') || c.includes('media');
          });

          const commTitle = isEvt
            ? 'لجنة الأنشطة والبرامج'
            : isRel
            ? 'لجنة العلاقات والشراكات'
            : 'لجنة الإعلام والاتصال';

          const borderAccent = isEvt
            ? 'border-cyan-500/30'
            : isRel
            ? 'border-blue-500/30'
            : 'border-purple-500/30';

          return (
            <div key={commGroup} className={`mb-6 p-4 sm:p-5 rounded-2xl bg-slate-900/50 border ${borderAccent}`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <span>{commTitle}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300">
                    {members.length} أعضاء
                  </span>
                </h5>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  {isEvt ? 'EVENTS & HACKATHONS' : isRel ? 'RELATIONS & TRAINING' : 'MEDIA & CONTENT'}
                </span>
              </div>

              {members.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  لا يوجد أعضاء معتمدين بعد في هذه اللجنة. يمكنك قبول طلبات الانضمام وتعيينهم في اللجان من قسم طلبات الانضمام.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-cyan-400/50 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white truncate max-w-[160px]">
                            {member.fullName}
                          </span>
                          <span className="text-xs font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                            {member.studentId}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 truncate">{member.major}</div>
                        <div className="text-xs text-slate-400 truncate mb-3">{member.college} — {member.academicYear}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onViewCommitteeCard(member);
                        }}
                        className="w-full py-1.5 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>عرض كرت عضو اللجنة</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

