import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { listTrash, restoreTrashItem, deleteTrashItem, purgeOldTrash, type TrashRow } from './adminApi';
import { Badge, Button, EmptyState, ErrorNote, LoadingRows, PageHeader, Panel, formatDateTime } from './ui';
import { dataService } from '../../services/dataService';
import type { LeaderMember, ProjectCaseStudy, FaqItem } from '../../types';

const TYPE_LABELS: Record<string, string> = {
  application: 'طلب انضمام',
  complaint: 'شكوى',
  event: 'فعالية',
  project: 'مشروع',
  leader: 'عضو قيادة',
  faq: 'سؤال شائع',
};

const daysUntilPurge = (deletedAt: string) => Math.max(0, 30 - Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86_400_000));

export const TrashPanel: React.FC<{ showToast: (m: string) => void; onRestored: () => void }> = ({ showToast, onRestored }) => {
  const [rows, setRows] = useState<TrashRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await purgeOldTrash().catch(() => 0);
      setRows(await listTrash());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر التحميل');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const restore = async (row: TrashRow) => {
    setBusy(row.id);
    setError(null);
    try {
      const result = await restoreTrashItem(row.id);
      // Content items are restored into their JSON list by the app.
      if (result.payload && result.entityType === 'project') dataService.saveProject(result.payload as unknown as ProjectCaseStudy);
      if (result.payload && result.entityType === 'leader') dataService.saveLeader(result.payload as unknown as LeaderMember);
      if (result.payload && result.entityType === 'faq') dataService.saveFaq(result.payload as unknown as FaqItem);
      showToast(`تمت استعادة ${row.title}`);
      onRestored();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الاستعادة');
    } finally {
      setBusy(null);
    }
  };

  const destroy = async (row: TrashRow) => {
    if (!window.confirm(`حذف «${row.title}» نهائياً؟ لا يمكن التراجع عن هذا.`)) return;
    setBusy(row.id);
    setError(null);
    try {
      await deleteTrashItem(row.id);
      showToast('تم الحذف النهائي');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الحذف');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="سلة المحذوفات"
        description="أي طلب أو شكوى أو فعالية أو مشروع يُحذف يبقى هنا 30 يوماً قبل حذفه نهائياً."
        actions={
          <Button icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={() => void load()}>
            تحديث
          </Button>
        }
      />
      <ErrorNote message={error} />
      {loading ? (
        <LoadingRows />
      ) : rows.length === 0 ? (
        <Panel>
          <EmptyState title="السلة فارغة" />
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <ul className="divide-y divide-white/5">
            {rows.map((row) => {
              const left = daysUntilPurge(row.deleted_at);
              return (
                <li key={row.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{TYPE_LABELS[row.entity_type] || row.entity_type}</Badge>
                      <span className="font-bold text-white">{row.title}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3">
                      <span>حُذف {formatDateTime(row.deleted_at)}</span>
                      {row.deleted_by_email && <span dir="ltr">{row.deleted_by_email}</span>}
                      <span className={left <= 3 ? 'text-red-300' : ''}>يُحذف نهائياً بعد {left} يوم</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="success" icon={<RotateCcw className="w-4 h-4" />} loading={busy === row.id} onClick={() => void restore(row)}>
                      استعادة
                    </Button>
                    <Button size="sm" variant="danger" icon={<Trash2 className="w-4 h-4" />} disabled={busy === row.id} onClick={() => void destroy(row)}>
                      حذف نهائي
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
};
