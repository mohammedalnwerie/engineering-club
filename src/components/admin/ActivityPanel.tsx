import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, PlusCircle, Pencil, Trash2, RotateCcw, Download } from 'lucide-react';
import { listActivity, type ActivityRow } from './adminApi';
import { EmptyState, ErrorNote, LoadingRows, PageHeader, Panel, Button, formatDateTime, inputClass } from './ui';
import { downloadCsv } from '../../utils/security';

const TYPE_LABELS: Record<string, string> = {
  application: 'الطلبات',
  complaint: 'الشكاوى',
  content: 'محتوى الموقع',
  event: 'الفعاليات',
  registration: 'الحضور',
  payment: 'المدفوعات',
  admin: 'الفريق',
};

const ACTION_ICONS = {
  create: <PlusCircle className="w-4 h-4 text-emerald-300" />,
  update: <Pencil className="w-4 h-4 text-cyan-300" />,
  delete: <Trash2 className="w-4 h-4 text-red-300" />,
  restore: <RotateCcw className="w-4 h-4 text-amber-300" />,
};

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'اليوم';
  if (d.toDateString() === yesterday.toDateString()) return 'أمس';
  return d.toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' });
};

export const ActivityPanel: React.FC = () => {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [actor, setActor] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listActivity());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر التحميل');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const actors = useMemo(() => [...new Set(rows.map((r) => r.actor_email).filter(Boolean))] as string[], [rows]);

  const shown = rows.filter(
    (r) =>
      (type === 'all' || r.entity_type === type) &&
      (actor === 'all' || r.actor_email === actor) &&
      (!search.trim() || r.summary.includes(search.trim()))
  );

  const groups = shown.reduce<{ day: string; items: ActivityRow[] }[]>((acc, row) => {
    const day = dayLabel(row.created_at);
    const last = acc[acc.length - 1];
    if (last && last.day === day) last.items.push(row);
    else acc.push({ day, items: [row] });
    return acc;
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="سجل النشاط"
        description="كل عملية يقوم بها أي مشرف تُسجَّل هنا تلقائياً: من قبل من، ومن عدّل ماذا ومتى."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              icon={<Download className="w-4 h-4" />}
              onClick={() => {
                const headers = ['التاريخ والوقت', 'المشرف', 'القسم', 'نوع الإجراء', 'ملخص العملية'];
                const csvRows = shown.map((r) => [
                  r.created_at,
                  r.actor_email || '—',
                  TYPE_LABELS[r.entity_type] || r.entity_type,
                  r.action,
                  r.summary,
                ]);
                downloadCsv(`UP-Activity-Log-${new Date().toISOString().slice(0, 10)}`, headers, csvRows);
              }}
              disabled={shown.length === 0}
            >
              تصدير السجل (CSV)
            </Button>
            <Button icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={() => void load()}>
              تحديث
            </Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <input type="search" placeholder="بحث في السجل" value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputClass} pr-9`} />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className={`${inputClass} sm:w-44`}>
          <option value="all">كل الأقسام</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select value={actor} onChange={(e) => setActor(e.target.value)} className={`${inputClass} sm:w-56`}>
          <option value="all">كل المشرفين</option>
          {actors.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <ErrorNote message={error} />
      {loading ? (
        <LoadingRows rows={6} />
      ) : groups.length === 0 ? (
        <Panel>
          <EmptyState title="لا يوجد نشاط مسجل" description="تظهر هنا العمليات بعد تشغيل تحديث قاعدة البيانات." />
        </Panel>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.day}>
              <h3 className="text-sm font-bold text-gray-400 mb-2">{g.day}</h3>
              <Panel className="overflow-hidden">
                <ul className="divide-y divide-white/5">
                  {g.items.map((r) => (
                    <li key={r.id} className="p-3 sm:p-4 flex items-start gap-3">
                      <span className="mt-0.5 shrink-0">{ACTION_ICONS[r.action] || ACTION_ICONS.update}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-white leading-relaxed">{r.summary}</div>
                        <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-3">
                          <span dir="ltr">{r.actor_email || '—'}</span>
                          <span>{TYPE_LABELS[r.entity_type] || r.entity_type}</span>
                        </div>
                      </div>
                      <time className="text-xs text-gray-500 shrink-0" dateTime={r.created_at}>
                        {new Date(r.created_at).toLocaleTimeString('ar', { hour: 'numeric', minute: '2-digit' })}
                      </time>
                    </li>
                  ))}
                </ul>
              </Panel>
            </section>
          ))}
          <p className="text-xs text-gray-500 text-center">يعرض آخر 300 عملية · {formatDateTime(rows[rows.length - 1]?.created_at)}</p>
        </div>
      )}
    </div>
  );
};
