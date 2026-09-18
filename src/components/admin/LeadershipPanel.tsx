import React, { useState } from 'react';
import {
  Award,
  Camera,
  CreditCard,
  Crown,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  Plus,
  Search,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';
import type { LeaderMember, StoredApplication } from '../../types';

const DEFAULT_AVATAR = '/brand/emblem.png';

// The leadership tab: the cards for the club's officers plus the roster of
// accepted committee members. Lives here so AdminDashboard stays readable.

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
}) => {
  const [leaderFilter, setLeaderFilter] = useState<'all' | 'executive' | 'committee-lead' | 'college-lead'>('all');
  const [leaderSearch, setLeaderSearch] = useState('');

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
      <p className="text-xs text-gray-400 mt-1">
        التحكم ببيانات وصور رئيس النادي، الهيئة الإدارية (نائب الشؤون الإدارية، نائب الشؤون التنفيذية، أمين الصندوق)، ورؤساء اللجان.
      </p>
    </div>

    <button
      onClick={onAdd}
      className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.25)] shrink-0"
    >
      <Plus className="w-4 h-4" />
      <span>إضافة قائد / مهندس جديد</span>
    </button>
  </div>

  {/* Quick Stats / Hierarchy Summary */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
      <div>
        <div className="text-xs font-mono text-amber-300/80">رئاسة ومجلس الإدارة</div>
        <div className="text-base font-bold text-white mt-0.5">
          {leadership.filter((l) => l.tier === 'executive').length} قيادات
        </div>
      </div>
      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
        <Crown className="w-4 h-4" />
      </div>
    </div>

    <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between">
      <div>
        <div className="text-xs font-mono text-cyan-300/80">ممثلو الكليات الهندسية</div>
        <div className="text-base font-bold text-white mt-0.5">
          {leadership.filter((l) => l.tier === 'college-lead').length} كليات
        </div>
      </div>
      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
        <GraduationCap className="w-4 h-4" />
      </div>
    </div>

    <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between">
      <div>
        <div className="text-xs font-mono text-purple-300/80">رؤساء اللجان التنفيذية</div>
        <div className="text-base font-bold text-white mt-0.5">
          {leadership.filter((l) => l.tier === 'committee-lead').length} لجان
        </div>
      </div>
      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
        <Zap className="w-4 h-4" />
      </div>
    </div>

    <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
      <div>
        <div className="text-xs font-mono text-emerald-300/80">كوادر وفرق اللجان</div>
        <div className="text-base font-bold text-white mt-0.5">
          {applications.filter((a) => a.status === 'تم القبول' && a.targetCommittee && !a.targetCommittee.includes('عامة')).length} عضواً
        </div>
      </div>
      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
        <Users className="w-4 h-4" />
      </div>
    </div>
  </div>

  {/* Filters & Search Toolbar */}
  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 rounded-2xl bg-black/40 border border-white/10">
    <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
      <button
        onClick={() => setLeaderFilter('all')}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
          leaderFilter === 'all'
            ? 'bg-cyan-400 text-black shadow-sm'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        الكل ({leadership.length})
      </button>
      <button
        onClick={() => setLeaderFilter('executive')}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
          leaderFilter === 'executive'
            ? 'bg-amber-400 text-black shadow-sm'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        الرئاسة والإدارة ({leadership.filter((l) => l.tier === 'executive').length})
      </button>
      <button
        onClick={() => setLeaderFilter('college-lead')}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
          leaderFilter === 'college-lead' ? 'bg-cyan-300 text-black shadow-sm' : 'text-gray-400 hover:text-white'
        }`}
      >
        ممثلو الكليات ({leadership.filter((l) => l.tier === 'college-lead').length})
      </button>
      <button
        onClick={() => setLeaderFilter('committee-lead')}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
          leaderFilter === 'committee-lead'
            ? 'bg-purple-400 text-black shadow-sm'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        رؤساء اللجان ({leadership.filter((l) => l.tier === 'committee-lead').length})
      </button>
    </div>

    <div className="relative w-full sm:w-64">
      <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        placeholder="ابحث بالاسم أو المسمى أو القسم..."
        value={leaderSearch}
        onChange={(e) => setLeaderSearch(e.target.value)}
        className="w-full pl-3 pr-9 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono"
      />
    </div>
  </div>

  {/* Leader Cards Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {leadership
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
      })
      .map((leader) => {
        const isPresident = leader.id === 'pres-1' || leader.role.includes('رئيس النادي');
        return (
          <div
            key={leader.id}
            className={`p-5 rounded-2xl bg-black/40 border transition-all flex flex-col justify-between group ${
              isPresident
                ? 'border-amber-500/40 hover:border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                : leader.tier === 'executive'
                ? 'border-blue-500/30 hover:border-blue-400/60'
                : 'border-white/10 hover:border-cyan-500/40'
            }`}
          >
            <div>
              <div className="flex items-start gap-3.5 mb-3">
                {/* Avatar with Direct Upload & Delete Actions */}
                <div className="relative group/avatar shrink-0">
                  <img
                    src={leader.avatar || DEFAULT_AVATAR}
                    alt={leader.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white/10 shadow-md group-hover/avatar:border-cyan-400/60 transition-all"
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

                  {/* Delete Photo / Set Default Button */}
                  <button
                    type="button"
                    onClick={() => onResetAvatar(leader)}
                    className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-red-950/90 hover:bg-red-800 border border-red-500/60 text-red-400 hover:text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    title="حذف الصورة واستعادة الصورة الافتراضية"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm truncate">
                    {leader.name || <span className="text-gray-500">بدون اسم</span>}
                  </h4>
                  {leader.hidden && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-950/50 border border-amber-500/40 rounded-md px-1.5 py-0.5 mt-1">
                      <EyeOff className="w-3 h-3" /> مخفي عن الموقع
                    </span>
                  )}
                  <div className="text-xs text-cyan-400 font-medium truncate mt-0.5">
                    {leader.role}
                  </div>
                  <span
                    className={`inline-block font-mono text-xs px-2 py-0.5 rounded-md mt-1.5 border ${
                      isPresident
                        ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                        : leader.tier === 'executive'
                        ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                        : leader.tier === 'college-lead'
                        ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                        : 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                    }`}
                  >
                    {isPresident
                      ? 'رئيس النادي'
                      : leader.tier === 'executive'
                      ? 'الهيئة الإدارية'
                      : leader.tier === 'college-lead'
                      ? 'ممثلو الكليات / منسق الكلية'
                      : 'رئيس لجنة تنفيذي'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-300 italic bg-white/[0.02] p-2.5 rounded-xl border border-white/5 mb-3 line-clamp-2">
                "{leader.quote}"
              </div>

              <div className="space-y-1 text-xs text-gray-400 mb-3 font-mono">
                <div className="truncate">
                  <span className="text-gray-500">القسم:</span> {leader.department}
                </div>
                <div className="truncate text-xs text-gray-400">
                  <span className="text-gray-500">البريد:</span> {leader.email}
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mb-4">
                {leader.skills.slice(0, 4).map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => onViewLeaderBadge(leader)}
                className="py-1.5 px-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                title="عرض وطباعة بطاقة التكليف والاعتماد القيادي"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>بطاقة التكليف</span>
              </button>
              <button
                onClick={() => onEdit(leader)}
                className="flex-1 py-1.5 rounded-xl bg-white/[0.05] hover:bg-cyan-400 hover:text-black text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل البطاقة والصورة</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleVisibility(leader)}
                className={`p-2 rounded-xl text-xs transition-colors cursor-pointer border ${
                  leader.hidden
                    ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-500/40'
                    : 'bg-white/[0.05] hover:bg-white/10 text-gray-300 border-white/10'
                }`}
                title={leader.hidden ? 'إظهار البطاقة في الموقع' : 'إخفاء البطاقة عن الموقع'}
              >
                {leader.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => onDelete(leader.id, leader.name)}
                className="p-2 rounded-xl bg-red-950/30 hover:bg-red-950 text-red-400 text-xs transition-colors cursor-pointer"
                title="حذف القائد"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
  </div>

  {/* Certified Committee Taskforce Section */}
  <div className="mt-12 pt-8 border-t border-white/10">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-mono text-xs mb-1.5">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>فرق عمل اللجان</span>
        </div>
        <h4 className="text-base font-bold text-white">كوادر وأعضاء اللجان التنفيذية المعتمدين</h4>
        <p className="text-xs text-gray-400">
          الطلبة المقبولون رسمياً في اللجان التنفيذية (فعاليات، علاقات وتدريب، إعلام) مع إمكانية استخراج كروت العضوية الرسمية لكل عضو.
        </p>
      </div>

      <div className="text-xs text-gray-400 font-mono bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
        إجمالي الأعضاء باللجان: <span className="text-cyan-400 font-bold">{applications.filter((a) => a.status === 'تم القبول' && a.targetCommittee && !a.targetCommittee.includes('عامة')).length}</span>
      </div>
    </div>

    {/* Committees Roster */}
    {['لجنة الفعاليات', 'لجنة العلاقات والتدريب', 'اللجنة الإعلامية'].map((commGroup) => {
      const isEvt = commGroup.includes('الفعاليات');
      const isRel = commGroup.includes('العلاقات');
      const isMed = commGroup.includes('الإعلامية');

      const members = applications.filter((a) => {
        if (a.status !== 'تم القبول') return false;
        const c = a.targetCommittee || '';
        if (isEvt) return c.includes('فعاليات') || c.includes('events');
        if (isRel) return c.includes('علاقات') || c.includes('تدريب') || c.includes('training');
        if (isMed) return c.includes('إعلام') || c.includes('media');
        return false;
      });

      const commTitle = isEvt
        ? 'لجنة الفعاليات والأنشطة الهندسية'
        : isRel
        ? 'لجنة العلاقات العامة والتدريب'
        : 'اللجنة الإعلامية والإنتاج المرئي';

      const borderAccent = isEvt
        ? 'border-cyan-500/30'
        : isRel
        ? 'border-blue-500/30'
        : 'border-purple-500/30';

      return (
        <div key={commGroup} className={`mb-6 p-4 sm:p-5 rounded-2xl bg-black/40 border ${borderAccent}`}>
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <h5 className="font-bold text-white text-sm flex items-center gap-2">
              <span>{commTitle}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 text-gray-300">
                {members.length} أعضاء
              </span>
            </h5>
            <span className="text-xs text-gray-400 font-mono hidden sm:inline">
              {isEvt ? 'EVENTS & HACKATHONS' : isRel ? 'RELATIONS & TRAINING' : 'MEDIA & CONTENT'}
            </span>
          </div>

          {members.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">
              لا يوجد أعضاء معتمدين بعد في هذه اللجنة. يمكنك قبول طلبات الانضمام وتعيينهم في اللجان من قسم طلبات الانضمام.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-400/50 transition-all flex flex-col justify-between"
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
                    <div className="text-xs text-gray-300 truncate">{member.major}</div>
                    <div className="text-xs text-gray-400 truncate mb-3">{member.college} — {member.academicYear}</div>
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
