import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Trophy,
  Users,
  UserCheck,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { normalizeCode } from '../utils/validation';
import { dataService } from '../services/dataService';
import { memberService, type MemberProfile, type PublicEvent } from '../services/memberService';
import type { HackathonRegistrationData } from '../types';

interface HackathonRegisterModalProps {
  event: PublicEvent;
  profile: MemberProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (status: 'registered' | 'waitlisted', alreadyRegistered: boolean) => void;
}

interface MemberInputState {
  studentId: string;
  role: string;
  fullName: string;
  major: string;
  status: 'idle' | 'checking' | 'valid' | 'invalid';
  errorMessage?: string;
}

export const HackathonRegisterModal: React.FC<HackathonRegisterModalProps> = ({
  event,
  profile,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const minTeamSize = event.minTeamSize || 2;
  const maxTeamSize = event.maxTeamSize || 5;
  // Leader counts as 1 member, so additional members needed:
  const minAdditional = Math.max(0, minTeamSize - 1);
  const maxAdditional = Math.max(0, maxTeamSize - 1);

  const [participationType, setParticipationType] = useState<'team' | 'solo'>('team');
  const [teamName, setTeamName] = useState('');
  const [track, setTrack] = useState<string>(event.tracks?.[0] || '');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectSummary, setProjectSummary] = useState('');
  const [links, setLinks] = useState('');

  // Solo fields
  const [primarySkill, setPrimarySkill] = useState('');
  const [desiredRole, setDesiredRole] = useState('');
  const [soloTrack, setSoloTrack] = useState<string>(event.tracks?.[0] || '');

  // Members list (excluding the logged-in leader)
  const [members, setMembers] = useState<MemberInputState[]>(() => {
    const initial: MemberInputState[] = [];
    for (let i = 0; i < Math.min(1, minAdditional); i++) {
      initial.push({
        studentId: '',
        role: '',
        fullName: '',
        major: '',
        status: 'idle',
      });
    }
    return initial;
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Keyboard shortcut: close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddMember = () => {
    if (members.length >= maxAdditional) return;
    setMembers((prev) => [
      ...prev,
      {
        studentId: '',
        role: '',
        fullName: '',
        major: '',
        status: 'idle',
      },
    ]);
  };

  const handleRemoveMember = (index: number) => {
    setMembers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMemberRoleChange = (index: number, role: string) => {
    setMembers((prev) =>
      prev.map((m, idx) => (idx === index ? { ...m, role } : m))
    );
  };

  const verifyMemberId = async (index: number, rawId: string) => {
    const clean = normalizeCode(rawId);
    if (!clean) {
      setMembers((prev) =>
        prev.map((m, idx) =>
          idx === index
            ? { ...m, studentId: '', status: 'idle', fullName: '', major: '', errorMessage: undefined }
            : m
        )
      );
      return;
    }

    // Check if it's the leader's ID
    if (clean === normalizeCode(profile.studentId)) {
      setMembers((prev) =>
        prev.map((m, idx) =>
          idx === index
            ? {
                ...m,
                studentId: clean,
                status: 'invalid',
                fullName: '',
                major: '',
                errorMessage: 'أنت قائد الفريق، لا يمكنك إضافة نفسك كعضو إضافي.',
              }
            : m
        )
      );
      return;
    }

    // Check duplicate among other members
    const duplicate = members.some((m, idx) => idx !== index && normalizeCode(m.studentId) === clean);
    if (duplicate) {
      setMembers((prev) =>
        prev.map((m, idx) =>
          idx === index
            ? {
                ...m,
                studentId: clean,
                status: 'invalid',
                fullName: '',
                major: '',
                errorMessage: 'هذا العضو مكرر في قائمة الفريق.',
              }
            : m
        )
      );
      return;
    }

    // Begin check
    setMembers((prev) =>
      prev.map((m, idx) => (idx === index ? { ...m, studentId: clean, status: 'checking', errorMessage: undefined } : m))
    );

    try {
      const found = await dataService.verifyMember(clean);
      if (!found) {
        setMembers((prev) =>
          prev.map((m, idx) =>
            idx === index
              ? {
                  ...m,
                  status: 'invalid',
                  fullName: '',
                  major: '',
                  errorMessage: 'الرقم غير مسجل في النادي. يجب أن يكون العضو منتسباً للنادي.',
                }
              : m
          )
        );
        return;
      }

      if (found.status !== 'تم القبول') {
        setMembers((prev) =>
          prev.map((m, idx) =>
            idx === index
              ? {
                  ...m,
                  status: 'invalid',
                  fullName: found.fullName,
                  major: found.major || found.college || '',
                  errorMessage: `طلب العضو غير معتمد بعد (الحالة: ${found.status}).`,
                }
              : m
          )
        );
        return;
      }

      if (found.suspendedAt) {
        setMembers((prev) =>
          prev.map((m, idx) =>
            idx === index
              ? {
                  ...m,
                  status: 'invalid',
                  fullName: found.fullName,
                  major: found.major || found.college || '',
                  errorMessage: 'عضوية هذا الطالب معلّقة حالياً.',
                }
              : m
          )
        );
        return;
      }

      // Valid club member!
      setMembers((prev) =>
        prev.map((m, idx) =>
          idx === index
            ? {
                ...m,
                status: 'valid',
                fullName: found.fullName,
                major: found.major || found.college || 'هندسة وتكنولوجيا المعلومات',
                errorMessage: undefined,
              }
            : m
        )
      );
    } catch {
      setMembers((prev) =>
        prev.map((m, idx) =>
          idx === index
            ? {
                ...m,
                status: 'invalid',
                errorMessage: 'تعذر التحقق من العضو حالياً، حاول مجدداً.',
              }
            : m
        )
      );
    }
  };

  const totalMembers = 1 + members.length;
  const isTeamValid =
    teamName.trim().length >= 2 &&
    projectTitle.trim().length >= 3 &&
    projectSummary.trim().length >= 10 &&
    totalMembers >= minTeamSize &&
    totalMembers <= maxTeamSize &&
    members.every((m) => m.status === 'valid' && m.role.trim().length > 0);

  const isSoloValid = primarySkill.trim().length >= 2 && desiredRole.trim().length >= 2;

  const canSubmit = participationType === 'team' ? isTeamValid : isSoloValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!canSubmit) {
      if (participationType === 'team') {
        if (totalMembers < minTeamSize) {
          return setFormError(`الحد الأدنى للفريق هو ${minTeamSize} أعضاء.`);
        }
        if (members.some((m) => m.status !== 'valid')) {
          return setFormError('يجب التحقق من جميع أعضاء الفريق والتأكد من انتسابهم للنادي.');
        }
        if (members.some((m) => !m.role.trim())) {
          return setFormError('يرجى تحديد دور كل عضو في الفريق.');
        }
      }
      return setFormError('يرجى إكمال جميع الحقول المطلوبة بشكل صحيح.');
    }

    setSubmitting(true);
    try {
      const teamData: HackathonRegistrationData =
        participationType === 'team'
          ? {
              participationType: 'team',
              teamName: teamName.trim(),
              track: track.trim() || undefined,
              projectTitle: projectTitle.trim(),
              projectSummary: projectSummary.trim(),
              members: members.map((m) => ({
                studentId: normalizeCode(m.studentId),
                fullName: m.fullName,
                major: m.major,
                role: m.role.trim(),
              })),
              links: links.trim() || undefined,
            }
          : {
              participationType: 'solo',
              primarySkill: primarySkill.trim(),
              desiredRole: desiredRole.trim(),
              track: soloTrack.trim() || undefined,
              links: links.trim() || undefined,
            };

      const res = await memberService.registerForEvent(event.id, teamData);
      onSuccess(res.status, res.alreadyRegistered);
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'تعذر إتمام التسجيل');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0F172A] border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl text-right my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 mb-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                تسجيل هاكاثون
              </span>
              {event.scope && event.scope !== 'club' && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {event.scope === 'university' ? 'جامعة فلسطين' : event.scope === 'local' ? 'محلي (فلسطين)' : 'دولي'}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">{event.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="p-2 rounded-xl text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors shrink-0 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prizes Announcement */}
        {event.prizes && (
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm font-semibold mb-5">
            <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="text-amber-300 font-bold ml-1">الجوائز المرصودة:</span>
              <span>{event.prizes}</span>
            </div>
          </div>
        )}

        {/* Participation Type Switcher */}
        {event.allowSolo !== false && (
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => setParticipationType('team')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-2 ${
                participationType === 'team'
                  ? 'bg-gradient-to-r from-[#7F1AB2] to-[#6F3993] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>تسجيل فريق عمل</span>
            </button>
            <button
              type="button"
              onClick={() => setParticipationType('solo')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-2 ${
                participationType === 'solo'
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>مشارك فردي (يبحث عن فريق)</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {participationType === 'team' ? (
            <>
              {/* Leader Box */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="text-xs text-gray-400 font-bold mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>قائد الفريق (أنت):</span>
                </div>
                <div className="text-sm font-black text-white">{profile.fullName}</div>
                <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-x-3">
                  <span>الرقم الجامعي: <strong className="text-gray-200" dir="ltr">{profile.studentId}</strong></span>
                  {profile.major && <span>التخصص: <strong className="text-gray-200">{profile.major}</strong></span>}
                </div>
              </div>

              {/* Team Name & Track */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    اسم الفريق <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="مثال: روّاد الخوارزميات"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#3FE7E3] focus:outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">مسار الهاكاثون</label>
                  {event.tracks && event.tracks.length > 0 ? (
                    <select
                      value={track}
                      onChange={(e) => setTrack(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#3FE7E3] focus:outline-none min-h-[44px]"
                    >
                      {event.tracks.map((tr, idx) => (
                        <option key={idx} value={tr}>
                          {tr}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={track}
                      onChange={(e) => setTrack(e.target.value)}
                      placeholder="المسار التقني المختار..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#3FE7E3] focus:outline-none min-h-[44px]"
                    />
                  )}
                </div>
              </div>

              {/* Project Title */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  عنوان فكرة المشروع <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="مثال: نظام ذكي للري بالتنقيط يعتمد على الذكاء الاصطناعي"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#3FE7E3] focus:outline-none min-h-[44px]"
                />
              </div>

              {/* Project Summary */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  نبذة عن فكرة المشروع والمشكلة والحل المقترح <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={projectSummary}
                  onChange={(e) => setProjectSummary(e.target.value)}
                  placeholder="اشرح بإيجاز: ما هي المشكلة الحقيقية التي يعالجها مشروعكم؟ وما هو الحل الهندسي أو البرمجي المبتكر؟"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#3FE7E3] focus:outline-none"
                />
              </div>

              {/* Members Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#3FE7E3]" />
                      <span>أعضاء الفريق الإضافيون</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      حجم الفريق المطلوب: من {minTeamSize} إلى {maxTeamSize} أعضاء (مع القائد). يجب أن يكون العضو مقبولاً بالنادي.
                    </p>
                  </div>
                  {members.length < maxAdditional && (
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-cyan-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-cyan-400/20 cursor-pointer min-h-[36px]"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>إضافة عضو</span>
                    </button>
                  )}
                </div>

                {members.length === 0 && (
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-gray-400">
                    لم تقم بإضافة أعضاء بعد. إذا كان الحد الأدنى {minTeamSize} فما فوق، يرجى إضافة أعضاء فريقك.
                  </div>
                )}

                <div className="space-y-3">
                  {members.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
                        <span>العضو #{idx + 2}</span>
                        {members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(idx)}
                            className="text-red-400 hover:text-red-300 transition-colors p-1 cursor-pointer"
                            title="إزالة العضو"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">الرقم الجامعي للعضو</label>
                          <input
                            type="text"
                            value={m.studentId}
                            onChange={(e) => verifyMemberId(idx, e.target.value)}
                            placeholder="أدخل الرقم الجامعي..."
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-[#3FE7E3] focus:outline-none min-h-[44px]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">دور العضو في الفريق</label>
                          <input
                            type="text"
                            value={m.role}
                            onChange={(e) => handleMemberRoleChange(idx, e.target.value)}
                            placeholder="مثال: مبرمج الذكاء، مصمم UI/UX..."
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-[#3FE7E3] focus:outline-none min-h-[44px]"
                          />
                        </div>
                      </div>

                      {/* Status Feedback */}
                      {m.status === 'checking' && (
                        <div className="flex items-center gap-1.5 text-xs text-cyan-300">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>جاري التحقق من عضوية الطالب في النادي...</span>
                        </div>
                      )}

                      {m.status === 'valid' && (
                        <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <span className="font-bold">{m.fullName}</span>
                            <span className="text-emerald-400/80 mr-2">({m.major}) — عضو معتمد ✓</span>
                          </div>
                        </div>
                      )}

                      {m.status === 'invalid' && (
                        <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <span>{m.errorMessage || 'الرقم غير مسجل كعضو معتمد بالنادي.'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  روابط داعمة (GitHub, Figma, Google Drive - اختياري)
                </label>
                <input
                  type="url"
                  value={links}
                  onChange={(e) => setLinks(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#3FE7E3] focus:outline-none min-h-[44px]"
                />
              </div>
            </>
          ) : (
            /* Solo Mode */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-xs leading-relaxed">
                التسجيل الفردي يتيح لك المشاركة في فعاليات ومسارات الهاكاثون، وسيتم ربطك ومطابقتك مع فرق تحتاج مهاراتك قبل انطلاق الفعالية.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  مهارتك التقنية الأساسية <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={primarySkill}
                  onChange={(e) => setPrimarySkill(e.target.value)}
                  placeholder="مثال: برمجة بايثون والذكاء الاصطناعي، برمجة تطبيقات Flutter، تصميم واجهات، دوائر عتاد..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#3FE7E3] focus:outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  الدور المرغوب في الفريق <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={desiredRole}
                  onChange={(e) => setDesiredRole(e.target.value)}
                  placeholder="مثال: Full-Stack Developer، AI Specialist، Hardware Designer..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#3FE7E3] focus:outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">المسار التقني المفضل</label>
                {event.tracks && event.tracks.length > 0 ? (
                  <select
                    value={soloTrack}
                    onChange={(e) => setSoloTrack(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#3FE7E3] focus:outline-none min-h-[44px]"
                  >
                    {event.tracks.map((tr, idx) => (
                      <option key={idx} value={tr}>
                        {tr}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={soloTrack}
                    onChange={(e) => setSoloTrack(e.target.value)}
                    placeholder="المسار الذي تفضل العمل ضمنه..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#3FE7E3] focus:outline-none min-h-[44px]"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  رابط معرض الأعمال أو حسابك على GitHub (اختياري)
                </label>
                <input
                  type="url"
                  value={links}
                  onChange={(e) => setLinks(e.target.value)}
                  placeholder="https://github.com/your-username"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#3FE7E3] focus:outline-none min-h-[44px]"
                />
              </div>
            </div>
          )}

          {formError && (
            <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Submit / Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer min-h-[44px]"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#7F1AB2] to-[#6F3993] hover:from-[#9D38D3] hover:to-[#7F1AB2] disabled:from-white/10 disabled:to-white/10 disabled:text-gray-500 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg min-h-[44px] flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تسجيل الفريق…</span>
                </>
              ) : (
                <span>تأكيد التسجيل في الهاكاثون</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
