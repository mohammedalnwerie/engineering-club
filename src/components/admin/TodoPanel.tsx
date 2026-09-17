import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import type { ComplaintItem, StoredApplication } from '../../types';
import { listMembers, listPaymentRequests } from './adminApi';
import { Button, Panel } from './ui';

// "What needs you today": the overview used to show totals only, which never
// told anyone what to actually do next.

interface TodoRow {
  id: string;
  label: string;
  count: number;
  hint?: string;
  tab: string;
  tone: 'urgent' | 'normal';
}

const DAY = 86_400_000;

export const TodoPanel: React.FC<{
  applications: StoredApplication[];
  complaints: ComplaintItem[];
  fullAccess: boolean;
  onNavigate: (tab: string) => void;
}> = ({ applications, complaints, fullAccess, onNavigate }) => {
  const [pendingPayments, setPendingPayments] = useState(0);
  const [expiringSoon, setExpiringSoon] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadMemberCounts = useCallback(async () => {
    if (!fullAccess) return;
    setLoading(true);
    try {
      const [payments, members] = await Promise.all([listPaymentRequests(), listMembers()]);
      setPendingPayments(payments.filter((p) => p.status === 'pending').length);
      setExpiringSoon(
        members.filter((m) => {
          if (!m.valid_until) return false;
          const left = new Date(m.valid_until).getTime() - Date.now();
          return left > 0 && left < 3 * DAY;
        }).length
      );
    } catch {
      // The overview stays useful even if these two counts fail to load.
    } finally {
      setLoading(false);
    }
  }, [fullAccess]);

  useEffect(() => {
    void loadMemberCounts();
  }, [loadMemberCounts]);

  const newApplications = applications.filter((a) => a.status === 'قيد المراجعة').length;
  const scheduled = applications.filter((a) => a.status === 'مقابلة مجدولة').length;
  const acceptedWithoutEmail = applications.filter(
    (a) => a.status === 'تم القبول' && !a.acceptanceEmailSentAt
  ).length;
  const urgentComplaints = complaints.filter(
    (c) => c.priority === 'urgent' && (c.status === 'pending' || c.status === 'new')
  ).length;
  const stalledComplaints = complaints.filter(
    (c) =>
      (c.status === 'pending' || c.status === 'new') &&
      c.priority !== 'urgent' &&
      Date.now() - new Date(c.createdAt).getTime() > 3 * DAY
  ).length;

  const rows: TodoRow[] = ([
    {
      id: 'urgent-complaints',
      label: 'شكاوى عاجلة تنتظر الرد',
      count: urgentComplaints,
      hint: 'الطالب اختار «عاجل» ولم يصله رد بعد',
      tab: 'complaints',
      tone: 'urgent',
    },
    {
      id: 'new-apps',
      label: 'طلبات انضمام جديدة',
      count: newApplications,
      hint: 'بانتظار القبول أو تحديد مقابلة',
      tab: 'applications',
      tone: 'normal',
    },
    {
      id: 'accepted-no-email',
      label: 'مقبولون لم تصلهم رسالة القبول',
      count: acceptedWithoutEmail,
      hint: 'أرسل لهم الرمز والبطاقة من زر «إرسال القبول»',
      tab: 'applications',
      tone: 'urgent',
    },
    {
      id: 'payments',
      label: 'طلبات دفع بانتظار الاعتماد',
      count: pendingPayments,
      hint: 'راجع الحوالة ثم اعتمد العضوية الفصلية',
      tab: 'members',
      tone: 'normal',
    },
    {
      id: 'stalled-complaints',
      label: 'شكاوى بلا رد منذ أكثر من 3 أيام',
      count: stalledComplaints,
      tab: 'complaints',
      tone: 'normal',
    },
    {
      id: 'interviews',
      label: 'مقابلات مجدولة بدون قرار',
      count: scheduled,
      tab: 'applications',
      tone: 'normal',
    },
    {
      id: 'expiring',
      label: 'عضويات تنتهي خلال 3 أيام',
      count: expiringSoon,
      hint: 'ذكّرهم بتجديد العضوية الفصلية',
      tab: 'members',
      tone: 'normal',
    },
  ] as TodoRow[]).filter((row) => row.count > 0);

  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-base sm:text-lg font-black text-white">مهام اليوم</h2>
        <Button
          size="sm"
          variant="ghost"
          icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={() => void loadMemberCounts()}
        >
          تحديث
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="py-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <div className="text-sm font-bold text-gray-200">ما في إشي معلّق</div>
          <div className="text-xs text-gray-500 mt-1">كل الطلبات والشكاوى متابَعة. عمل ممتاز.</div>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onNavigate(row.tab)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-right transition-colors cursor-pointer ${
                  row.tone === 'urgent'
                    ? 'bg-red-500/[0.07] border-red-500/30 hover:bg-red-500/[0.12]'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07]'
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-black text-sm ${
                    row.tone === 'urgent' ? 'bg-red-500/20 text-red-200' : 'bg-cyan-500/15 text-cyan-200'
                  }`}
                >
                  {row.count}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-white flex items-center gap-1.5">
                    {row.tone === 'urgent' && <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" />}
                    {row.label}
                  </span>
                  {row.hint && <span className="block text-xs text-gray-400 mt-0.5">{row.hint}</span>}
                </span>
                <ArrowLeft className="w-4 h-4 text-gray-400 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};
