import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users, Download, RefreshCw, ArrowRight, Check, CalendarDays, MapPin } from 'lucide-react';
import {
  listAdminEvents,
  saveAdminEvent,
  deleteAdminEvent,
  listRegistrations,
  registrationCounts,
  setCheckIn,
  hasFullAccess,
  MEDIA_COMMITTEE,
  type AdminRole,
  type EventInput,
  type EventRow,
  type RegistrationRow,
} from './adminApi';
import {
  Badge,
  Button,
  EmptyState,
  ErrorNote,
  Field,
  LoadingRows,
  PageHeader,
  Panel,
  formatDate,
  formatDateTime,
  fromLocalInput,
  inputClass,
  toLocalInput,
} from './ui';
import { EVENT_TYPE_LABELS, type EventType } from '../../services/memberService';
import { COMMITTEES } from '../../data/committees';
import { downloadCsv } from '../../utils/security';

const STATUS_LABELS: Record<EventRow['status'], { label: string; tone: 'gray' | 'green' | 'red' | 'purple' }> = {
  draft: { label: 'مسودة', tone: 'gray' },
  published: { label: 'منشورة', tone: 'green' },
  cancelled: { label: 'ملغاة', tone: 'red' },
  completed: { label: 'منتهية', tone: 'purple' },
};

/** "الموعد يُعلن لاحقاً" when there is no date, day only when the hour is not set. */
const whenLabel = (event: { starts_at: string | null; time_tbd?: boolean }) => {
  if (!event.starts_at) return 'الموعد يُعلن لاحقاً';
  return event.time_tbd ? formatDate(event.starts_at) : formatDateTime(event.starts_at);
};

const emptyEvent = (role: AdminRole | null): EventInput => ({
  title: '',
  event_type: 'workshop',
  description: '',
  location: '',
  starts_at: null,
  time_tbd: false,
  ends_at: null,
  registration_deadline: null,
  capacity: 30,
  committee: role === 'media' ? MEDIA_COMMITTEE : null,
  committee_only: false,
  status: 'draft',
});

export const EventsPanel: React.FC<{ role: AdminRole | null; showToast: (msg: string) => void }> = ({ role, showToast }) => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [counts, setCounts] = useState<Record<string, { registered: number; waitlisted: number; attended: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EventInput | null>(null);
  const [viewing, setViewing] = useState<EventRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [e, c] = await Promise.all([listAdminEvents(), registrationCounts()]);
      setEvents(e);
      setCounts(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر التحميل');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (event: EventRow) => {
    if (!window.confirm(`حذف «${event.title}» وكل تسجيلاتها؟ ستنتقل الفعالية إلى سلة المحذوفات.`)) return;
    try {
      await deleteAdminEvent(event.id);
      showToast('نُقلت الفعالية إلى سلة المحذوفات');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الحذف');
    }
  };

  if (viewing) {
    return <RegistrationsView event={viewing} onBack={() => { setViewing(null); void load(); }} showToast={showToast} />;
  }

  if (editing) {
    return (
      <EventForm
        initial={editing}
        role={role}
        onCancel={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          showToast('تم حفظ الفعالية');
          await load();
        }}
      />
    );
  }

  // A date-less event is still upcoming: its date has not been announced yet.
  const isPast = (e: EventRow) => {
    const when = e.ends_at || e.starts_at;
    return Boolean(when) && new Date(when as string).getTime() < Date.now();
  };
  const upcoming = events.filter((e) => !isPast(e));
  const past = events.filter(isPast);

  const renderList = (list: EventRow[]) => (
    <ul className="divide-y divide-white/5">
      {list.map((event) => {
        const c = counts[event.id] || { registered: 0, waitlisted: 0, attended: 0 };
        const status = STATUS_LABELS[event.status];
        return (
          <li key={event.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="purple">{EVENT_TYPE_LABELS[event.event_type]}</Badge>
                <Badge tone={status.tone}>{status.label}</Badge>
                {event.committee_only && <Badge tone="cyan">لأعضاء {event.committee}</Badge>}
              </div>
              <div className="font-bold text-white text-base">{event.title}</div>
              <div className="text-sm text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  {whenLabel(event)}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {c.registered}
                  {event.capacity ? ` / ${event.capacity}` : ''} مسجّل
                  {c.waitlisted > 0 && ` · ${c.waitlisted} انتظار`}
                  {c.attended > 0 && ` · ${c.attended} حضور`}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button size="sm" variant="primary" icon={<Users className="w-4 h-4" />} onClick={() => setViewing(event)}>
                المسجلون والحضور
              </Button>
              <Button size="sm" icon={<Pencil className="w-4 h-4" />} onClick={() => setEditing(event)}>
                تعديل
              </Button>
              <Button size="sm" variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => void remove(event)}>
                حذف
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="الفعاليات والتسجيل"
        description={
          role === 'media'
            ? 'فعاليات اللجنة الإعلامية. التسجيل متاح لأعضاء النادي بعضوية فعّالة.'
            : 'الورش والدورات والهاكاثونات. التسجيل متاح لأعضاء النادي بعضوية فعّالة، مع قائمة انتظار تلقائية.'
        }
        actions={
          <>
            <Button icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={() => void load()}>
              تحديث
            </Button>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setEditing(emptyEvent(role))}>
              فعالية جديدة
            </Button>
          </>
        }
      />
      <ErrorNote message={error} />

      {loading ? (
        <LoadingRows />
      ) : events.length === 0 ? (
        <Panel>
          <EmptyState title="لا توجد فعاليات بعد" description="أنشئ أول فعالية، واحفظها كمسودة أو انشرها مباشرة." />
        </Panel>
      ) : (
        <div className="space-y-6">
          <section>
            <h3 className="text-base font-bold text-white mb-2">القادمة ({upcoming.length})</h3>
            <Panel className="overflow-hidden">{upcoming.length ? renderList(upcoming) : <EmptyState title="لا توجد فعاليات قادمة" />}</Panel>
          </section>
          {past.length > 0 && (
            <section>
              <h3 className="text-base font-bold text-gray-300 mb-2">السابقة ({past.length})</h3>
              <Panel className="overflow-hidden">{renderList(past)}</Panel>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

const EventForm: React.FC<{
  initial: EventInput;
  role: AdminRole | null;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}> = ({ initial, role, onCancel, onSaved }) => {
  const [form, setForm] = useState<EventInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof EventInput>(key: K, value: EventInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('اكتب عنوان الفعالية');
    if (form.ends_at && form.starts_at && new Date(form.ends_at) < new Date(form.starts_at)) {
      return setError('موعد النهاية قبل موعد البداية');
    }
    if (form.registration_deadline && form.starts_at && new Date(form.registration_deadline) > new Date(form.starts_at)) {
      return setError('آخر موعد للتسجيل يجب أن يكون قبل بداية الفعالية');
    }
    if (form.committee_only && !form.committee) return setError('اختر اللجنة لقصر التسجيل على أعضائها');
    setSaving(true);
    setError(null);
    try {
      await saveAdminEvent({ ...form, title: form.title.trim(), committee: role === 'media' ? MEDIA_COMMITTEE : form.committee });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <button type="button" onClick={onCancel} className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 mb-4 cursor-pointer">
        <ArrowRight className="w-4 h-4" />
        <span>رجوع للفعاليات</span>
      </button>
      <PageHeader title={initial.id ? 'تعديل الفعالية' : 'فعالية جديدة'} />

      <Panel className="p-5">
        <form onSubmit={submit} className="space-y-4">
          <Field label="العنوان">
            <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} className={inputClass} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="النوع">
              <select value={form.event_type} onChange={(e) => set('event_type', e.target.value as EventType)} className={inputClass}>
                {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="المكان">
              <input type="text" value={form.location || ''} onChange={(e) => set('location', e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="الوصف">
            <textarea rows={4} value={form.description || ''} onChange={(e) => set('description', e.target.value)} className={inputClass} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field
              label="البداية (اختياري)"
              hint={form.starts_at ? undefined : 'اتركه فارغاً وسيظهر «الموعد يُعلن لاحقاً»'}
            >
              <input
                type={form.time_tbd ? 'date' : 'datetime-local'}
                value={form.time_tbd ? (form.starts_at || '').slice(0, 10) : toLocalInput(form.starts_at)}
                onChange={(e) =>
                  set(
                    'starts_at',
                    form.time_tbd
                      ? e.target.value
                        ? new Date(`${e.target.value}T09:00`).toISOString()
                        : null
                      : fromLocalInput(e.target.value)
                  )
                }
                className={inputClass}
              />
              <label className="flex items-center gap-2 text-xs text-gray-300 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.time_tbd}
                  onChange={(e) => set('time_tbd', e.target.checked)}
                  className="w-4 h-4 accent-cyan-400"
                />
                <span>اليوم فقط — الساعة تُحدد لاحقاً</span>
              </label>
            </Field>
            <Field label="النهاية (اختياري)">
              <input
                type="datetime-local"
                value={toLocalInput(form.ends_at)}
                onChange={(e) => set('ends_at', fromLocalInput(e.target.value))}
                className={inputClass}
              />
            </Field>
            <Field label="آخر موعد للتسجيل" hint="فارغ = حتى بداية الفعالية">
              <input
                type="datetime-local"
                value={toLocalInput(form.registration_deadline)}
                onChange={(e) => set('registration_deadline', fromLocalInput(e.target.value))}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="عدد المقاعد" hint="فارغ = بدون حد. بعد اكتمال المقاعد يُضاف المسجلون لقائمة الانتظار">
              <input
                type="number"
                min={1}
                value={form.capacity ?? ''}
                onChange={(e) => set('capacity', e.target.value ? Number(e.target.value) : null)}
                className={inputClass}
              />
            </Field>
            <Field label="اللجنة المنظِّمة">
              <select
                value={role === 'media' ? MEDIA_COMMITTEE : form.committee || ''}
                disabled={!hasFullAccess(role)}
                onChange={(e) => set('committee', e.target.value || null)}
                className={inputClass}
              >
                <option value="">النادي (عام)</option>
                {COMMITTEES.filter((c) => c.id !== 'general').map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
            <input type="checkbox" checked={form.committee_only} onChange={(e) => set('committee_only', e.target.checked)} className="w-4 h-4" />
            <span>التسجيل لأعضاء هذه اللجنة فقط</span>
          </label>
          <Field label="الحالة">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_LABELS) as EventRow['status'][]).map((s) => (
                <Button key={s} size="sm" variant={form.status === s ? 'primary' : 'ghost'} onClick={() => set('status', s)}>
                  {STATUS_LABELS[s].label}
                </Button>
              ))}
            </div>
          </Field>
          <p className="text-xs text-gray-500">المسودة لا تظهر على الموقع. «منشورة» تفتح التسجيل للأعضاء.</p>

          <ErrorNote message={error} />
          <div className="flex gap-2">
            <Button type="submit" variant="primary" loading={saving} icon={<Check className="w-4 h-4" />}>
              حفظ
            </Button>
            <Button onClick={onCancel}>إلغاء</Button>
          </div>
        </form>
      </Panel>
    </div>
  );
};

// ---------------------------------------------------------------------------

const RegistrationsView: React.FC<{ event: EventRow; onBack: () => void; showToast: (m: string) => void }> = ({ event, onBack, showToast }) => {
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listRegistrations(event.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر التحميل');
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (row: RegistrationRow) => {
    setBusy(row.id);
    try {
      await setCheckIn(row.id, !row.checked_in_at);
      setRows((list) => list.map((r) => (r.id === row.id ? { ...r, checked_in_at: r.checked_in_at ? null : new Date().toISOString() } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الحفظ');
    } finally {
      setBusy(null);
    }
  };

  const active = rows.filter((r) => r.status !== 'cancelled');
  const registered = active.filter((r) => r.status === 'registered');
  const waitlisted = active.filter((r) => r.status === 'waitlisted');

  const exportCsv = () => {
    downloadCsv(
      `registrations_${event.title.slice(0, 30)}`,
      ['الاسم', 'الرقم الجامعي', 'الجوال', 'الإيميل', 'اللجنة', 'الحالة', 'الحضور', 'وقت التسجيل'],
      active.map((r) => [
        r.club_applications?.full_name,
        r.club_applications?.student_id,
        r.club_applications?.phone || '',
        r.club_applications?.email || '',
        r.club_applications?.data?.assignedCommittee || r.club_applications?.data?.targetCommittee || '',
        r.status === 'registered' ? 'مسجّل' : 'انتظار',
        r.checked_in_at ? 'حضر' : '',
        formatDateTime(r.created_at),
      ])
    );
    showToast('تم تصدير قائمة المسجلين');
  };

  const renderRows = (list: RegistrationRow[]) => (
    <ul className="divide-y divide-white/5">
      {list.map((r, i) => (
        <li key={r.id} className="p-3 sm:p-4 flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3">
            <span className="text-sm text-gray-500 w-6 text-center shrink-0">{i + 1}</span>
            <div className="min-w-0">
              <div className="font-bold text-white truncate">{r.club_applications?.full_name}</div>
              <div className="text-sm text-gray-400 flex flex-wrap gap-x-3">
                <span dir="ltr">{r.club_applications?.student_id}</span>
                {r.club_applications?.phone && <span dir="ltr">{r.club_applications.phone}</span>}
              </div>
            </div>
          </div>
          {r.status === 'registered' && (
            <button
              type="button"
              disabled={busy === r.id}
              onClick={() => void toggle(r)}
              aria-pressed={Boolean(r.checked_in_at)}
              className={`shrink-0 min-w-[96px] px-3 py-2 rounded-xl text-sm font-bold border cursor-pointer transition-colors disabled:opacity-50 ${
                r.checked_in_at
                  ? 'bg-emerald-500 text-black border-emerald-400'
                  : 'bg-white/5 text-gray-300 border-white/10 hover:border-emerald-400/50'
              }`}
            >
              {r.checked_in_at ? '✓ حضر' : 'تسجيل حضور'}
            </button>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="p-4 sm:p-6">
      <button type="button" onClick={onBack} className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 mb-4 cursor-pointer">
        <ArrowRight className="w-4 h-4" />
        <span>رجوع للفعاليات</span>
      </button>
      <PageHeader
        title={event.title}
        description={`${whenLabel(event)}${event.location ? ` — ${event.location}` : ''}`}
        actions={
          <>
            <Button icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={() => void load()}>
              تحديث
            </Button>
            <Button icon={<Download className="w-4 h-4" />} onClick={exportCsv} disabled={active.length === 0}>
              تصدير Excel
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-3 mb-5">
        <Panel className="p-4">
          <div className="text-sm text-gray-400">مسجّلون</div>
          <div className="text-2xl font-black text-white">
            {registered.length}
            {event.capacity ? <span className="text-base text-gray-500"> / {event.capacity}</span> : null}
          </div>
        </Panel>
        <Panel className="p-4">
          <div className="text-sm text-gray-400">حضروا</div>
          <div className="text-2xl font-black text-emerald-300">{registered.filter((r) => r.checked_in_at).length}</div>
        </Panel>
        <Panel className="p-4">
          <div className="text-sm text-gray-400">قائمة الانتظار</div>
          <div className="text-2xl font-black text-amber-300">{waitlisted.length}</div>
        </Panel>
      </div>

      <ErrorNote message={error} />
      {loading ? (
        <LoadingRows />
      ) : (
        <div className="space-y-5">
          <Panel className="overflow-hidden">{registered.length ? renderRows(registered) : <EmptyState title="لا يوجد مسجلون بعد" />}</Panel>
          {waitlisted.length > 0 && (
            <section>
              <h3 className="text-base font-bold text-white mb-2">قائمة الانتظار</h3>
              <Panel className="overflow-hidden">{renderRows(waitlisted)}</Panel>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
