import React, { useCallback, useEffect, useState } from 'react';
import { UserPlus, RefreshCw, Trash2, Mail } from 'lucide-react';
import {
  listTeam,
  inviteTeamMember,
  updateTeamRole,
  removeTeamMember,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  type AdminRole,
  type TeamMember,
} from './adminApi';
import { Badge, Button, EmptyState, ErrorNote, Field, LoadingRows, PageHeader, Panel, formatDateTime, inputClass } from './ui';
import { validateEmail } from '../../utils/validation';

const ASSIGNABLE: AdminRole[] = ['vp_admin', 'tech_support', 'media', 'owner'];

export const TeamPanel: React.FC<{ myRole: AdminRole | null; myEmail: string; showToast: (m: string) => void }> = ({
  myRole,
  myEmail,
  showToast,
}) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<AdminRole>('media');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTeam(await listTeam());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر التحميل');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateEmail(email);
    if (problem) return setInviteError(problem);
    setInviting(true);
    setInviteError(null);
    try {
      const result = await inviteTeamMember(email.trim().toLowerCase(), role, name.trim());
      showToast(result.warning || `تم إرسال الدعوة إلى ${email}`);
      setEmail('');
      setName('');
      await load();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'تعذر إرسال الدعوة');
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (member: TeamMember, newRole: AdminRole) => {
    if (newRole === member.role) return;
    setBusy(member.userId);
    setError(null);
    try {
      await updateTeamRole(member.userId, newRole);
      showToast(`صلاحية ${member.email} أصبحت: ${ROLE_LABELS[newRole]}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تغيير الصلاحية');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (member: TeamMember) => {
    if (!window.confirm(`إزالة ${member.email} من فريق الإدارة؟ لن يتمكن من دخول لوحة التحكم.`)) return;
    setBusy(member.userId);
    setError(null);
    try {
      await removeTeamMember(member.userId);
      showToast(`تمت إزالة ${member.email}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الإزالة');
    } finally {
      setBusy(null);
    }
  };

  const assignable = ASSIGNABLE.filter((r) => r !== 'owner' || myRole === 'owner');

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="فريق الإدارة"
        description="أضف أعضاء الهيئة الإدارية واللجان إلى لوحة التحكم، وحدد صلاحية كل واحد."
        actions={
          <Button icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={() => void load()}>
            تحديث
          </Button>
        }
      />

      <Panel className="p-5">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-cyan-300" />
          <span>دعوة عضو جديد</span>
        </h3>
        <form onSubmit={invite} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="الإيميل">
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setInviteError(null);
                }}
                className={`${inputClass} text-left`}
              />
            </Field>
            <Field label="الاسم (اختياري)">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <fieldset>
            <legend className="text-sm text-gray-300 mb-2">الصلاحية</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {assignable.map((r) => (
                <label
                  key={r}
                  className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                    role === r ? 'border-cyan-400/60 bg-cyan-400/10' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
                  <div className="font-bold text-white text-sm">{ROLE_LABELS[r]}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{ROLE_DESCRIPTIONS[r]}</div>
                </label>
              ))}
            </div>
          </fieldset>
          <ErrorNote message={inviteError} />
          <Button type="submit" variant="primary" loading={inviting} icon={<Mail className="w-4 h-4" />}>
            إرسال الدعوة
          </Button>
          <p className="text-xs text-gray-500">يصله إيميل من إيميل النادي فيه رابط لتعيين كلمة المرور والدخول.</p>
        </form>
      </Panel>

      <section>
        <h3 className="text-base font-bold text-white mb-2">الأعضاء الحاليون ({team.length})</h3>
        <ErrorNote message={error} />
        {loading ? (
          <LoadingRows rows={3} />
        ) : team.length === 0 ? (
          <Panel>
            <EmptyState title="لا يوجد أعضاء" />
          </Panel>
        ) : (
          <Panel className="overflow-hidden">
            <ul className="divide-y divide-white/5">
              {team.map((m) => {
                const isMe = m.email?.toLowerCase() === myEmail.toLowerCase();
                const locked = m.role === 'owner' && myRole !== 'owner';
                return (
                  <li key={m.userId} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white">{m.displayName || m.email}</span>
                        {isMe && <Badge tone="cyan">أنت</Badge>}
                        {m.pending && <Badge tone="amber">لم يدخل بعد</Badge>}
                      </div>
                      <div className="text-sm text-gray-400 mt-0.5" dir="ltr">
                        {m.displayName ? m.email : ''}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {m.lastSignInAt ? `آخر دخول ${formatDateTime(m.lastSignInAt)}` : `أُضيف ${formatDateTime(m.createdAt)}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={m.role}
                        disabled={locked || isMe || busy === m.userId}
                        onChange={(e) => void changeRole(m, e.target.value as AdminRole)}
                        className={`${inputClass} w-52`}
                        aria-label={`صلاحية ${m.email}`}
                      >
                        {ASSIGNABLE.filter((r) => r !== 'owner' || myRole === 'owner' || m.role === 'owner').map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<Trash2 className="w-4 h-4" />}
                        disabled={locked || isMe || busy === m.userId}
                        onClick={() => void remove(m)}
                        aria-label={`إزالة ${m.email}`}
                      >
                        إزالة
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}
      </section>
    </div>
  );
};
