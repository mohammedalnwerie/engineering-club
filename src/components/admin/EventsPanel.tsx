import React, { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Download,
  RefreshCw,
  ArrowRight,
  Check,
  CalendarDays,
  MapPin,
  Trophy,
  Image as ImageIcon,
  Upload,
  X,
  Sparkles,
} from 'lucide-react';
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
import { compressImageFile } from '../../utils/image';
import type { EventScope } from '../../types';

const STATUS_LABELS: Record<EventRow['status'], { label: string; tone: 'gray' | 'green' | 'red' | 'purple' }> = {
  draft: { label: 'مسودة', tone: 'gray' },
  published: { label: 'منشورة', tone: 'green' },
  cancelled: { label: 'ملغاة', tone: 'red' },
  completed: { label: 'منتهية', tone: 'purple' },
};

export const EVENT_SCOPE_LABELS: Record<EventScope, string> = {
  club: 'خاص بالنادي (داخلي)',
  internal: 'خاص بالنادي (داخلي)',
  university: 'على مستوى جامعة فلسطين',
  local: 'محلي (فلسطين / قطاع غزة)',
  international: 'دولي / إقليمي',
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
  cover_image: null,
  scope: 'club',
  prizes: '',
  min_team_size: 2,
  max_team_size: 5,
  tracks: [],
  allow_solo: true,
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
          <li key={event.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              {event.cover_image && (
                <img
                  src={event.cover_image}
                  alt={event.title}
                  className="w-16 h-12 rounded-xl object-cover border border-white/10 shrink-0 hidden sm:block"
                />
              )}
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="purple">{EVENT_TYPE_LABELS[event.event_type]}</Badge>
                  <Badge tone={status.tone}>{status.label}</Badge>
                  {event.scope && event.scope !== 'club' && event.scope !== 'internal' && (
                    <Badge tone="cyan">{EVENT_SCOPE_LABELS[event.scope] || event.scope}</Badge>
                  )}
                  {event.committee_only && <Badge tone="cyan">لأعضاء {event.committee}</Badge>}
                  {event.prizes && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      <span>جوائز</span>
                    </span>
                  )}
                </div>
                <div className="font-bold text-white text-base">{event.title}</div>
                <div className="text-sm text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-cyan-400" />
                    {whenLabel(event)}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      {event.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-400" />
                    {c.registered}
                    {event.capacity ? ` / ${event.capacity}` : ''} مسجّل
                    {c.waitlisted > 0 && ` · ${c.waitlisted} انتظار`}
                    {c.attended > 0 && ` · ${c.attended} حضور`}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button size="sm" variant="primary" icon={<Users className="w-4 h-4" />} onClick={() => setViewing(event)}>
                المسجلون والفرق
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
        title="الفعاليات والهاكاثونات"
        description={
          role === 'media'
            ? 'فعاليات اللجنة الإعلامية. التسجيل متاح لأعضاء النادي بعضوية فعّالة.'
            : 'إدارة الورش والدورات والهاكاثونات والمسابقات، وتحديد مسارات الفرق والجوائز.'
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
// Event Form (Create / Edit)
// ---------------------------------------------------------------------------

const EventForm: React.FC<{
  initial: EventInput;
  role: AdminRole | null;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}> = ({ initial, role, onCancel, onSaved }) => {
  const [form, setForm] = useState<EventInput>({
    ...initial,
    scope: initial.scope || 'club',
    min_team_size: initial.min_team_size ?? 2,
    max_team_size: initial.max_team_size ?? 5,
    tracks: initial.tracks || [],
    allow_solo: initial.allow_solo ?? true,
  });
  const [tracksInput, setTracksInput] = useState<string>((initial.tracks || []).join('، '));
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof EventInput>(key: K, value: EventInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setError(null);
    try {
      const b64 = await compressImageFile(file, 1200, 675, 0.85);
      set('cover_image', b64);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر ضغط ورفع الصورة');
    } finally {
      setImageUploading(false);
    }
  };

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
      const parsedTracks = tracksInput
        .split(/[,،]/)
        .map((t) => t.trim())
        .filter(Boolean);

      await saveAdminEvent({
        ...form,
        title: form.title.trim(),
        committee: role === 'media' ? MEDIA_COMMITTEE : form.committee,
        tracks: parsedTracks,
        min_team_size: form.min_team_size ? Number(form.min_team_size) : 2,
        max_team_size: form.max_team_size ? Number(form.max_team_size) : 5,
      });
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
            <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} className={inputClass} placeholder="اسم الفعالية أو الهاكاثون..." />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="النوع">
              <select value={form.event_type} onChange={(e) => set('event_type', e.target.value as EventType)} className={inputClass}>
                {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="نطاق الفعالية">
              <select
                value={form.scope || 'club'}
                onChange={(e) => set('scope', e.target.value as EventScope)}
                className={inputClass}
              >
                <option value="club">خاص بالنادي (داخلي)</option>
                <option value="university">على مستوى جامعة فلسطين</option>
                <option value="local">محلي (فلسطين / قطاع غزة)</option>
                <option value="international">دولي / إقليمي</option>
              </select>
            </Field>

            <Field label="المكان">
              <input type="text" value={form.location || ''} onChange={(e) => set('location', e.target.value)} className={inputClass} placeholder="مثال: قاعة المؤتمرات / أونلاين" />
            </Field>
          </div>

          <Field label="الوصف">
            <textarea rows={4} value={form.description || ''} onChange={(e) => set('description', e.target.value)} className={inputClass} placeholder="تفاصيل الفعالية، المحاور، الجمهور المستهدف..." />
          </Field>

          {/* صورة الغلاف */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#3FE7E3]" />
                <span>صورة غلاف الفعالية (اختيارية)</span>
              </label>
              <span className="text-xs text-gray-400">المقاس الموصى به: 16:9 (1200×675 بكسل)</span>
            </div>

            {form.cover_image && (
              <div className="relative w-full aspect-video max-h-48 rounded-xl overflow-hidden border border-white/15 bg-black/40">
                <img src={form.cover_image} alt="معاينة الغلاف" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => set('cover_image', null)}
                  className="absolute top-2 left-2 p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
                  title="حذف الصورة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/20 hover:border-[#3FE7E3] bg-white/[0.03] text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>{imageUploading ? 'جاري ضغط الصورة…' : 'رفع صورة من جهازك'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageUpload}
                  disabled={imageUploading}
                  className="hidden"
                />
              </label>
              <input
                type="url"
                value={form.cover_image || ''}
                onChange={(e) => set('cover_image', e.target.value || null)}
                placeholder="أو الصق رابط الصورة مباشرة https://..."
                className={inputClass}
              />
            </div>
          </div>

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
            <Field label="عدد المقاعد / الفرق" hint="فارغ = بدون حد. بعد اكتمال المقاعد يُضاف المسجلون لقائمة الانتظار">
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

          {/* خانة الهاكاثون والمسابقات المتقدمة */}
          {form.event_type === 'hackathon' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-[#3FE7E3]/30 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>إعدادات الهاكاثون والفرق البرمجية</span>
              </div>

              <Field label="مسارات الهاكاثون (افصل بينها بفاصلة)">
                <input
                  type="text"
                  value={tracksInput}
                  onChange={(e) => setTracksInput(e.target.value)}
                  placeholder="مثال: الذكاء الاصطناعي، إنترنت الأشياء والعتاد، تطبيقات الهواتف، الطاقة والمدن الذكية"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="الحد الأدنى لأعضاء الفريق">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.min_team_size ?? 2}
                    onChange={(e) => set('min_team_size', Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
                <Field label="الحد الأقصى لأعضاء الفريق">
                  <input
                    type="number"
                    min={form.min_team_size || 2}
                    max={15}
                    value={form.max_team_size ?? 5}
                    onChange={(e) => set('max_team_size', Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="الجوائز والمكافآت (اختياري)">
                <input
                  type="text"
                  value={form.prizes || ''}
                  onChange={(e) => set('prizes', e.target.value)}
                  placeholder="مثال: المركز الأول 1500$ + درع الابتكار، المركز الثاني 1000$، احتضان وتطوير المشاريع"
                  className={inputClass}
                />
              </Field>

              <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.allow_solo ?? true}
                  onChange={(e) => set('allow_solo', e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded"
                />
                <span>السماح بالتسجيل الفردي للطلبة الذين يبحثون عن فريق للمطابقة لاحقاً</span>
              </label>
            </div>
          )}

          {form.event_type !== 'hackathon' && (
            <Field label="الجوائز أو الشهادات الممنوحة (اختياري)">
              <input
                type="text"
                value={form.prizes || ''}
                onChange={(e) => set('prizes', e.target.value)}
                placeholder="مثال: شهادة حضور معتمدة من النادي الهندسي + هدايا عينية للمشاركين"
                className={inputClass}
              />
            </Field>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
            <input type="checkbox" checked={form.committee_only} onChange={(e) => set('committee_only', e.target.checked)} className="w-4 h-4 accent-cyan-400 rounded" />
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
          <div className="flex gap-2 pt-2">
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
// Registrations & Attendees View (Teams & Individuals)
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
    if (event.event_type === 'hackathon') {
      downloadCsv(
        `hackathon_${event.title.slice(0, 30)}`,
        [
          'نوع المشاركة',
          'اسم الفريق',
          'المسار',
          'عنوان المشروع',
          'قائد الفريق',
          'الرقم الجامعي للقائد',
          'جوال القائد',
          'إيميل القائد',
          'أعضاء الفريق (الاسم - الرقم - التخصص - الدور)',
          'ملخص الفكرة والحل',
          'الروابط المرفقة',
          'الحالة',
          'حضور القائد',
          'وقت التسجيل',
        ],
        active.map((r) => [
          r.team_data?.participationType === 'team'
            ? 'فريق عمل'
            : r.team_data?.participationType === 'solo'
              ? 'مشارك فردي'
              : 'فردي',
          r.team_data?.teamName || '',
          r.team_data?.track || '',
          r.team_data?.projectTitle || '',
          r.club_applications?.full_name,
          r.club_applications?.student_id,
          r.club_applications?.phone || '',
          r.club_applications?.email || '',
          r.team_data?.members?.map((m) => `${m.fullName} (${m.studentId} - ${m.major || ''} - ${m.role || ''})`).join(' | ') || '',
          r.team_data?.projectSummary || '',
          r.team_data?.links || '',
          r.status === 'registered' ? 'مسجّل' : 'انتظار',
          r.checked_in_at ? 'حضر' : '',
          formatDateTime(r.created_at),
        ])
      );
    } else {
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
    }
    showToast('تم تصدير قائمة المسجلين');
  };

  const renderHackathonRows = (list: RegistrationRow[]) => (
    <ul className="divide-y divide-white/5 space-y-4 p-2">
      {list.map((r, i) => {
        const t = r.team_data;
        return (
          <li key={r.id} className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 font-mono w-5">#{i + 1}</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      t?.participationType === 'team'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {t?.participationType === 'team' ? 'فريق عمل' : 'مشارك فردي'}
                  </span>
                  {t?.track && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      مسار: {t.track}
                    </span>
                  )}
                  <h4 className="text-base font-black text-white">
                    {t?.participationType === 'team' ? t.teamName : r.club_applications?.full_name}
                  </h4>
                </div>
                {t?.projectTitle && (
                  <div className="text-sm text-cyan-300 mt-1 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>المشروع: {t.projectTitle}</span>
                  </div>
                )}
              </div>

              {r.status === 'registered' && (
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => void toggle(r)}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                    r.checked_in_at
                      ? 'bg-emerald-500 text-black border-emerald-400'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:border-emerald-400/50'
                  }`}
                >
                  {r.checked_in_at ? '✓ حضر القائد' : 'تسجيل حضور القائد'}
                </button>
              )}
            </div>

            {/* قائد الفريق / مقدم الطلب */}
            <div className="text-xs text-gray-300 bg-black/30 p-3 rounded-xl border border-white/5 flex flex-wrap gap-x-6 gap-y-2">
              <div>
                <span className="text-gray-500">القائد: </span>
                <strong className="text-white">{r.club_applications?.full_name}</strong> ({r.club_applications?.student_id})
              </div>
              {r.club_applications?.phone && (
                <div>
                  <span className="text-gray-500">الجوال: </span>
                  <span dir="ltr">{r.club_applications.phone}</span>
                </div>
              )}
              {r.club_applications?.email && (
                <div>
                  <span className="text-gray-500">الإيميل: </span>
                  <span dir="ltr">{r.club_applications.email}</span>
                </div>
              )}
            </div>

            {/* فكرة المشروع */}
            {t?.projectSummary && (
              <div className="text-xs text-gray-300 bg-white/[0.02] p-3 rounded-xl border border-white/5 leading-relaxed">
                <div className="text-gray-400 font-bold mb-1">فكرة المشروع والمشكلة والحل:</div>
                <p className="whitespace-pre-line text-gray-200">{t.projectSummary}</p>
              </div>
            )}

            {/* أعضاء الفريق */}
            {t?.members && t.members.length > 0 && (
              <div>
                <div className="text-xs font-bold text-gray-400 mb-2">
                  أعضاء الفريق ({t.members.length + 1} عضواً مع القائد):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {t.members.map((m, idx) => (
                    <div key={idx} className="text-xs p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-white">{m.fullName}</div>
                        <div className="text-gray-400 flex items-center gap-2">
                          <span dir="ltr">{m.studentId}</span>
                          {m.major && <span>• {m.major}</span>}
                        </div>
                      </div>
                      {m.role && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200 border border-purple-500/30 shrink-0">
                          {m.role}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* مشارك فردي */}
            {t?.participationType === 'solo' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {t.primarySkill && (
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-gray-400">المهارة الأساسية: </span>
                    <span className="text-white font-semibold">{t.primarySkill}</span>
                  </div>
                )}
                {t.desiredRole && (
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-gray-400">الدور المرغوب: </span>
                    <span className="text-white font-semibold">{t.desiredRole}</span>
                  </div>
                )}
              </div>
            )}

            {/* روابط إضافية */}
            {t?.links && (
              <div className="text-xs text-cyan-300">
                <span className="text-gray-400">الروابط المرفقة: </span>
                <a href={t.links} target="_blank" rel="noopener noreferrer" className="underline hover:text-cyan-200 break-all">
                  {t.links}
                </a>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  const renderStandardRows = (list: RegistrationRow[]) => (
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
          <div className="text-sm text-gray-400">
            {event.event_type === 'hackathon' ? 'فرق ومشاركون' : 'مسجّلون'}
          </div>
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
          <Panel className="overflow-hidden">
            {registered.length ? (
              event.event_type === 'hackathon' ? (
                renderHackathonRows(registered)
              ) : (
                renderStandardRows(registered)
              )
            ) : (
              <EmptyState title="لا يوجد مسجلون بعد" />
            )}
          </Panel>
          {waitlisted.length > 0 && (
            <section>
              <h3 className="text-base font-bold text-white mb-2">قائمة الانتظار</h3>
              <Panel className="overflow-hidden">
                {event.event_type === 'hackathon' ? renderHackathonRows(waitlisted) : renderStandardRows(waitlisted)}
              </Panel>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
