import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  X,
  Download,
  RefreshCw,
  Save,
  Search,
  Image as ImageIcon,
  CalendarPlus,
  PauseCircle,
  PlayCircle,
  KeyRound,
  Copy,
} from 'lucide-react';
import {
  listMembers,
  listPaymentRequests,
  reviewPaymentRequest,
  activateSemesterManually,
  applyTrialEndToMembers,
  setMembershipSuspended,
  extendMembership,
  resetMemberPassword,
  type MemberRow,
  type PaymentRequestRow,
} from './adminApi';
import { Badge, Button, EmptyState, ErrorNote, Field, LoadingRows, PageHeader, Panel, formatDate, formatDateTime, inputClass } from './ui';
import { dataService } from '../../services/dataService';
import { downloadCsv } from '../../utils/security';
import type { MembershipSettings } from '../../types';

type View = 'payments' | 'members' | 'settings';

const stateOf = (m: MemberRow): 'temporary' | 'semester' | 'expired' | 'suspended' => {
  if (m.suspended_at) return 'suspended';
  if (!m.valid_until || new Date(m.valid_until).getTime() < Date.now()) return 'expired';
  return m.membership_type === 'semester' ? 'semester' : 'temporary';
};

const daysLeft = (iso: string | null) => (iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000) : null);

export const MembersPanel: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const [view, setView] = useState<View>('payments');
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [payments, setPayments] = useState<PaymentRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, p] = await Promise.all([listMembers(), listPaymentRequests()]);
      setMembers(m);
      setPayments(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر التحميل');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const stats = useMemo(() => {
    const s = { temporary: 0, semester: 0, expired: 0, suspended: 0, expiringSoon: 0 };
    for (const m of members) {
      const state = stateOf(m);
      s[state]++;
      const left = daysLeft(m.valid_until);
      if (state !== 'expired' && left !== null && left <= 3) s.expiringSoon++;
    }
    return s;
  }, [members]);

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="العضويات والمدفوعات"
        description="البطاقة الأولى تبدأ تلقائياً عند القبول، والعضوية الفصلية تتفعّل عند اعتماد الدفع."
        actions={
          <Button icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={() => void load()}>
            تحديث
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'طلبات دفع بانتظارك', value: pendingCount, tone: 'text-amber-300' },
          { label: 'عضوية فصلية', value: stats.semester, tone: 'text-emerald-300' },
          { label: 'بطاقة أولى', value: stats.temporary, tone: 'text-cyan-200', sub: stats.expiringSoon ? `${stats.expiringSoon} تنتهي خلال 3 أيام` : undefined },
          {
            label: 'منتهية',
            value: stats.expired,
            tone: 'text-red-300',
            sub: stats.suspended ? `${stats.suspended} عضوية معلّقة` : undefined,
          },
        ].map((s) => (
          <Panel key={s.label} className="p-4">
            <div className="text-sm text-gray-400">{s.label}</div>
            <div className={`text-2xl font-black mt-1 ${s.tone}`}>{s.value}</div>
            {s.sub && <div className="text-xs text-amber-300 mt-1">{s.sub}</div>}
          </Panel>
        ))}
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/10 w-fit mb-5" role="tablist">
        {(
          [
            ['payments', `طلبات الدفع${pendingCount ? ` (${pendingCount})` : ''}`],
            ['members', 'الأعضاء'],
            ['settings', 'إعدادات العضوية'],
          ] as [View, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors ${
              view === id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ErrorNote message={error} />

      {view === 'payments' && (loading ? <LoadingRows /> : <PaymentsList payments={payments} onChanged={load} showToast={showToast} />)}
      {view === 'members' && (loading ? <LoadingRows /> : <MembersList members={members} onChanged={load} showToast={showToast} />)}
      {view === 'settings' && <MembershipSettingsForm showToast={showToast} />}
    </div>
  );
};

// ---------------------------------------------------------------------------

const PaymentsList: React.FC<{ payments: PaymentRequestRow[]; onChanged: () => Promise<void>; showToast: (m: string) => void }> = ({
  payments,
  onChanged,
  showToast,
}) => {
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);

  const shown = payments.filter((p) => filter === 'all' || p.status === 'pending');

  const review = async (p: PaymentRequestRow, approve: boolean) => {
    if (!approve && !notes[p.id]?.trim() && !window.confirm('رفض الطلب بدون ذكر السبب؟')) return;
    setBusy(p.id);
    setError(null);
    try {
      await reviewPaymentRequest(p.id, approve, notes[p.id] || '');
      showToast(approve ? `تم اعتماد العضوية الفصلية لـ ${p.club_applications?.full_name}` : 'تم رفض الطلب');
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الحفظ');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button size="sm" variant={filter === 'pending' ? 'primary' : 'ghost'} onClick={() => setFilter('pending')}>
          بانتظار المراجعة
        </Button>
        <Button size="sm" variant={filter === 'all' ? 'primary' : 'ghost'} onClick={() => setFilter('all')}>
          كل الطلبات
        </Button>
      </div>
      <ErrorNote message={error} />

      {shown.length === 0 ? (
        <Panel>
          <EmptyState title={filter === 'pending' ? 'لا توجد طلبات دفع بانتظارك' : 'لا توجد طلبات دفع بعد'} />
        </Panel>
      ) : (
        shown.map((p) => (
          <Panel key={p.id} className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-white">{p.club_applications?.full_name || '—'}</span>
                  <span className="text-sm text-gray-400" dir="ltr">
                    {p.club_applications?.student_id}
                  </span>
                  {p.status === 'pending' && <Badge tone="amber">بانتظار المراجعة</Badge>}
                  {p.status === 'approved' && <Badge tone="green">معتمد</Badge>}
                  {p.status === 'rejected' && <Badge tone="red">مرفوض</Badge>}
                </div>
                <div className="text-sm text-gray-300">
                  <strong className="text-white">{p.amount} ₪</strong> — {p.method}
                  {p.semester_label && <span className="text-gray-500"> · {p.semester_label}</span>}
                </div>
                {p.reference && (
                  <div className="text-sm text-gray-300">
                    المرجع: <span className="text-white">{p.reference}</span>
                  </div>
                )}
                {p.note && <div className="text-sm text-gray-400">ملاحظة الطالب: {p.note}</div>}
                {p.admin_note && <div className="text-sm text-gray-400">ملاحظة الإدارة: {p.admin_note}</div>}
                <div className="text-xs text-gray-500">أُرسل {formatDateTime(p.created_at)}</div>
              </div>

              <div className="flex flex-col gap-2 lg:w-72 shrink-0">
                {p.receipt_image && (
                  <Button size="sm" icon={<ImageIcon className="w-4 h-4" />} onClick={() => setReceipt(p.receipt_image)}>
                    عرض صورة الإيصال
                  </Button>
                )}
                {p.status === 'pending' && (
                  <>
                    <input
                      type="text"
                      placeholder="ملاحظة (اختياري، تظهر للطالب)"
                      value={notes[p.id] || ''}
                      onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })}
                      className={inputClass}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="success" icon={<Check className="w-4 h-4" />} loading={busy === p.id} onClick={() => void review(p, true)}>
                        اعتماد
                      </Button>
                      <Button variant="danger" icon={<X className="w-4 h-4" />} disabled={busy === p.id} onClick={() => void review(p, false)}>
                        رفض
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Panel>
        ))
      )}

      {receipt && (
        <div className="fixed inset-0 z-[80] bg-black/85 flex items-start justify-center p-3 sm:p-4 overflow-y-auto" onClick={() => setReceipt(null)}>
          <img src={receipt} alt="صورة الإيصال" className="max-w-full max-h-[90vh] rounded-2xl" />
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

const MembersList: React.FC<{ members: MemberRow[]; onChanged: () => Promise<void>; showToast: (m: string) => void }> = ({
  members,
  onChanged,
  showToast,
}) => {
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<'all' | 'temporary' | 'semester' | 'expired' | 'suspended'>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccessModal, setResetSuccessModal] = useState<{ name: string; memberCode: string; studentId: string } | null>(null);
  const settings = dataService.getMembershipSettings();

  const counts = useMemo(() => {
    const c = { all: members.length, semester: 0, temporary: 0, expired: 0, suspended: 0 };
    for (const m of members) {
      c[stateOf(m)]++;
    }
    return c;
  }, [members]);

  const shown = members.filter((m) => {
    const q = search.trim().toLowerCase();
    const matches = !q || m.full_name.toLowerCase().includes(q) || m.student_id.includes(q) || (m.member_code || '').toLowerCase().includes(q);
    return matches && (stateFilter === 'all' || stateOf(m) === stateFilter);
  });

  const act = async (id: string, op: () => Promise<unknown>, message: string) => {
    setBusy(id);
    setError(null);
    try {
      await op();
      showToast(message);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الحفظ');
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = () =>
    downloadCsv(
      `members_${new Date().toISOString().split('T')[0]}`,
      ['الاسم', 'الرقم الجامعي', 'الإيميل', 'الجوال', 'اللجنة', 'نوع العضوية', 'صالحة حتى', 'رمز العضو'],
      shown.map((m) => [
        m.full_name,
        m.student_id,
        m.email || '',
        m.phone || '',
        m.data?.assignedCommittee || m.data?.targetCommittee || '',
        { temporary: 'أولى', semester: 'فصلية', expired: 'منتهية', suspended: 'معلّقة' }[stateOf(m)],
        formatDate(m.valid_until),
        m.member_code || '',
      ])
    );

  return (
    <div className="space-y-3">
      {/* Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        {[
          { id: 'all', label: 'كل الأعضاء', count: counts.all },
          { id: 'semester', label: 'عضوية فصلية', count: counts.semester, tone: 'text-emerald-300' },
          { id: 'temporary', label: 'بطاقة أولى سارية', count: counts.temporary, tone: 'text-cyan-300' },
          { id: 'expired', label: 'منتهية', count: counts.expired, tone: 'text-red-300' },
          { id: 'suspended', label: 'معلّقة', count: counts.suspended, tone: 'text-amber-300' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStateFilter(tab.id as typeof stateFilter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stateFilter === tab.id
                ? 'bg-white/15 text-white shadow-sm border border-white/20'
                : 'bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.07] border border-white/5'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[11px] bg-black/40 ${tab.tone || 'text-gray-300'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            placeholder="بحث بالاسم أو الرقم الجامعي أو الرمز"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pr-9`}
          />
        </div>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value as typeof stateFilter)} className={`${inputClass} sm:w-44`}>
          <option value="all">كل الأعضاء ({counts.all})</option>
          <option value="semester">فصلية ({counts.semester})</option>
          <option value="temporary">بطاقة أولى ({counts.temporary})</option>
          <option value="expired">منتهية ({counts.expired})</option>
          <option value="suspended">معلّقة ({counts.suspended})</option>
        </select>
        <Button icon={<Download className="w-4 h-4" />} onClick={exportCsv} disabled={shown.length === 0}>
          تصدير
        </Button>
      </div>
      <ErrorNote message={error} />

      <Panel className="overflow-hidden">
        {shown.length === 0 ? (
          <EmptyState title="لا يوجد أعضاء بهذا البحث" />
        ) : (
          <ul className="divide-y divide-white/5">
            {shown.map((m) => {
              const state = stateOf(m);
              const left = daysLeft(m.valid_until);
              return (
                <li key={m.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white">{m.full_name}</span>
                      {state === 'semester' && <Badge tone="green">فصلية</Badge>}
                      {state === 'temporary' && <Badge tone="cyan">سارية</Badge>}
                      {state === 'expired' && <Badge tone="red">منتهية</Badge>}
                      {state === 'suspended' && <Badge tone="amber">معلّقة</Badge>}
                    </div>
                    <div className="text-sm text-gray-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <span dir="ltr">{m.student_id}</span>
                      <span>{m.data?.assignedCommittee || m.data?.targetCommittee}</span>
                      <span>
                        {state === 'expired' ? 'انتهت' : 'حتى'} {formatDate(m.valid_until)}
                        {state !== 'expired' && left !== null && ` (${left} يوم)`}
                      </span>
                      {m.member_code && (
                        <span className="font-mono text-cyan-300" dir="ltr">
                          {m.member_code}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button
                      size="sm"
                      icon={state === 'suspended' ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                      disabled={busy === m.id}
                      onClick={() => {
                        if (state === 'suspended') {
                          dataService.updateApplicationSuspended(m.id, false);
                          void act(m.id, () => setMembershipSuspended(m.id, false), `تم رفع التعليق عن ${m.full_name}`);
                          return;
                        }
                        const reason = window.prompt(`سبب تعليق عضوية ${m.full_name}؟ (اختياري)`);
                        if (reason === null) return;
                        dataService.updateApplicationSuspended(m.id, true, reason);
                        void act(m.id, () => setMembershipSuspended(m.id, true, reason), `تم تعليق عضوية ${m.full_name}`);
                      }}
                    >
                      {state === 'suspended' ? 'رفع التعليق' : 'تعليق'}
                    </Button>
                    {state !== 'semester' && state !== 'suspended' && (
                      <Button
                        size="sm"
                        variant="success"
                        loading={busy === m.id}
                        onClick={() =>
                          window.confirm(`تفعيل العضوية الفصلية لـ ${m.full_name} (دفع نقداً) حتى ${formatDate(settings.semesterEndsAt)}؟`) &&
                          void act(m.id, () => activateSemesterManually(m.id, settings.semesterEndsAt), `تم تفعيل العضوية الفصلية لـ ${m.full_name}`)
                        }
                      >
                        تفعيل فصلي (دفع نقداً)
                      </Button>
                    )}
                    <Button
                      size="sm"
                      icon={<CalendarPlus className="w-4 h-4" />}
                      disabled={busy === m.id}
                      onClick={() => {
                        const base = m.valid_until && new Date(m.valid_until).getTime() > Date.now() ? new Date(m.valid_until) : new Date();
                        base.setDate(base.getDate() + 7);
                        void act(m.id, () => extendMembership(m.id, base.toISOString()), `تم تمديد عضوية ${m.full_name} 7 أيام`);
                      }}
                    >
                      تمديد 7 أيام
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<KeyRound className="w-4 h-4 text-cyan-400" />}
                      disabled={busy === m.id}
                      title="تصفير كلمة المرور لتمكين العضو من الدخول برمز بطاقته وتعيين كلمة مرور جديدة"
                      onClick={() => {
                        if (window.confirm(`هل تريد تصفير كلمة المرور لـ (${m.full_name})؟\nسيعود العضو قادراً على تسجيل الدخول فوراً باستخدام رمز بطاقته وتعيين كلمة مرور جديدة.`)) {
                          void act(m.id, async () => {
                            await resetMemberPassword(m.id);
                            setResetSuccessModal({
                              name: m.full_name,
                              memberCode: m.member_code || '',
                              studentId: m.student_id,
                            });
                          }, `تم تصفير كلمة المرور لـ ${m.full_name}`);
                        }
                      }}
                    >
                      تصفير كلمة المرور
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {/* Reset password success & copy helper */}
      {resetSuccessModal && (
        <div className="fixed inset-0 z-[85] bg-black/80 flex items-start justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl glass-panel border border-cyan-500/30 p-5 space-y-4 text-right shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                <span>تم تصفير كلمة المرور بنجاح</span>
              </h4>
              <button
                onClick={() => setResetSuccessModal(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              تم تصفير كلمة المرور للعضو <strong className="text-white">{resetSuccessModal.name}</strong>. يمكنه الآن تسجيل الدخول مباشرة برمز بطاقته وتعيين كلمة مرور جديدة.
            </p>
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 text-xs text-gray-300 space-y-1.5" dir="rtl">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">رمز البطاقة:</span>
                <span className="font-mono text-cyan-300 font-bold text-sm" dir="ltr">{resetSuccessModal.memberCode || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">الرقم الجامعي:</span>
                <span className="font-mono text-white" dir="ltr">{resetSuccessModal.studentId}</span>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                className="w-full justify-center"
                icon={<Copy className="w-4 h-4" />}
                onClick={() => {
                  const msg = `أهلاً بك يا ${resetSuccessModal.name}،\nتم تصفير كلمة المرور الخاصة بحسابك في النادي الهندسي بنجاح.\nيمكنك الآن تسجيل الدخول مباشرة باستخدام رمز بطاقتك:\n${resetSuccessModal.memberCode}\nثم تعيين كلمة مرور جديدة لحسابك عبر الرابط:\nhttps://engineering-club-phi.vercel.app/?member=1`;
                  navigator.clipboard.writeText(msg);
                  showToast('تم نسخ رسالة إشعار الطالب للحافظة');
                }}
              >
                نسخ رسالة واتساب لإرسالها للطالب
              </Button>
              <Button variant="ghost" className="w-full justify-center" onClick={() => setResetSuccessModal(null)}>
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

const MembershipSettingsForm: React.FC<{ showToast: (m: string) => void }> = ({ showToast }) => {
  const [form, setForm] = useState<MembershipSettings>(dataService.getMembershipSettings());
  const [methodsText, setMethodsText] = useState(form.paymentMethods.join('\n'));
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const methods = methodsText.split('\n').map((m) => m.trim()).filter(Boolean);
    dataService.saveMembershipSettings({ ...form, paymentMethods: methods.length ? methods : form.paymentMethods });
    showToast('تم حفظ إعدادات العضوية');
  };

  // Re-issues the cards that were already sent, using the end date configured above.
  const applyToIssued = async () => {
    if (!window.confirm('تحديث صلاحية كل البطاقات الأولى الصادرة حسب الإعدادات المحفوظة؟')) return;
    setApplying(true);
    setApplyError(null);
    try {
      const changed = await applyTrialEndToMembers();
      showToast(`تم تحديث ${changed} بطاقة`);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'تعذر التحديث');
    } finally {
      setApplying(false);
    }
  };

  return (
    <Panel className="p-5 max-w-2xl">
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="مدة البطاقة الأولى (أيام)" hint="تُحسب من تاريخ قبول الطالب">
            <input
              type="number"
              min={1}
              max={120}
              value={form.trialDays}
              onChange={(e) => setForm({ ...form, trialDays: Number(e.target.value) || 14 })}
              className={inputClass}
              disabled={Boolean(form.trialEndsAt)}
            />
          </Field>
          <Field label="رسوم العضوية الفصلية">
            <input
              type="number"
              min={0}
              value={form.semesterFee}
              onChange={(e) => setForm({ ...form, semesterFee: Number(e.target.value) || 0 })}
              className={inputClass}
            />
          </Field>
          <Field label="العملة">
            <input type="text" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputClass} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="اسم الفصل الحالي">
            <input
              type="text"
              value={form.semesterLabel}
              onChange={(e) => setForm({ ...form, semesterLabel: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field
            label="تاريخ ثابت لنهاية البطاقة الأولى"
            hint={form.trialEndsAt ? 'كل البطاقات الجديدة صالحة حتى نهاية هذا اليوم' : 'اتركه فارغاً لاستخدام عدد الأيام أعلاه'}
            className="sm:col-span-2"
          >
            <div className="flex gap-2">
              <input
                type="date"
                value={form.trialEndsAt || ''}
                onChange={(e) => setForm({ ...form, trialEndsAt: e.target.value })}
                className={inputClass}
              />
              {form.trialEndsAt && (
                <Button onClick={() => setForm({ ...form, trialEndsAt: '' })}>مسح</Button>
              )}
            </div>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="نهاية الفصل" hint="العضوية الفصلية تبقى صالحة حتى نهاية هذا اليوم">
            <input
              type="date"
              value={form.semesterEndsAt}
              onChange={(e) => setForm({ ...form, semesterEndsAt: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="طرق الدفع" hint="طريقة في كل سطر">
          <textarea rows={3} value={methodsText} onChange={(e) => setMethodsText(e.target.value)} className={inputClass} />
        </Field>
        <Field label="تعليمات الدفع للطالب">
          <textarea
            rows={3}
            value={form.paymentInstructions}
            onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })}
            className={inputClass}
          />
        </Field>
        <ErrorNote message={applyError} />
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void applyToIssued()} loading={applying} icon={<CalendarPlus className="w-4 h-4" />}>
            تطبيق على البطاقات الصادرة
          </Button>
          <p className="text-xs text-gray-500 flex-1 min-w-[220px]">
            الإعدادات تسري على الأعضاء الجدد تلقائياً. اضغط الزر بعد الحفظ لتحديث بطاقات الأعضاء الحاليين أيضاً.
          </p>
        </div>
        <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
          حفظ الإعدادات
        </Button>
      </form>
    </Panel>
  );
};
