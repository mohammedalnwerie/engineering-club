import React from 'react';
import { Eye, Send, CreditCard, Award, CheckCircle, Clock, Trash2, XCircle } from 'lucide-react';
import type { StoredApplication } from '../../types';
import { effectiveCommittee } from '../../data/committees';
import { ActionMenu, CheckBox, type ActionItem } from './controls';
import { Button, EmptyState } from './ui';

// The applications list: one labelled primary action plus a named menu, so no
// row is a line of unlabelled icons any more. Cards on phones, table on desktop.

export interface ApplicationsTableProps {
  apps: StoredApplication[];
  selected: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onInspect: (app: StoredApplication) => void;
  onDispatch: (app: StoredApplication) => void;
  onBadge: (app: StoredApplication) => void;
  onCommitteeBadge: (app: StoredApplication) => void;
  onStatus: (app: StoredApplication, status: StoredApplication['status']) => void;
  onDelete: (app: StoredApplication) => void;
}

const STATUS_STYLES: Record<string, string> = {
  'تم القبول': 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
  'مقابلة مجدولة': 'bg-blue-950 text-blue-300 border-blue-500/30',
  مرفوض: 'bg-red-950 text-red-300 border-red-500/30',
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
      STATUS_STYLES[status] || 'bg-amber-950 text-amber-300 border-amber-500/30'
    }`}
  >
    {status}
  </span>
);

export const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  apps,
  selected,
  onToggle,
  onToggleAll,
  onInspect,
  onDispatch,
  onBadge,
  onCommitteeBadge,
  onStatus,
  onDelete,
}) => {
  const selectedSet = React.useMemo(() => new Set(selected), [selected]);
  const allChecked = apps.length > 0 && apps.every((a) => selectedSet.has(a.id));

  const menuFor = (app: StoredApplication): ActionItem[] => {
    const accepted = app.status === 'تم القبول';
    const inCommittee = Boolean(app.targetCommittee) && !app.targetCommittee.includes('عامة');
    return [
      {
        label: 'إرسال رسالة القبول والبطاقة',
        icon: <Send className="w-4 h-4 text-emerald-300" />,
        onClick: () => onDispatch(app),
        hidden: !accepted,
      },
      {
        label: 'بطاقة العضوية الرقمية',
        icon: <CreditCard className="w-4 h-4 text-cyan-300" />,
        onClick: () => onBadge(app),
        hidden: !accepted,
      },
      {
        label: 'كرت عضو اللجنة',
        icon: <Award className="w-4 h-4 text-emerald-300" />,
        onClick: () => onCommitteeBadge(app),
        hidden: !accepted || !inCommittee,
      },
      {
        label: 'قبول الطالب',
        icon: <CheckCircle className="w-4 h-4 text-emerald-300" />,
        onClick: () => onStatus(app, 'تم القبول'),
        hidden: accepted,
      },
      {
        label: 'تحديد موعد مقابلة',
        icon: <Clock className="w-4 h-4 text-blue-300" />,
        onClick: () => onStatus(app, 'مقابلة مجدولة'),
        hidden: app.status === 'مقابلة مجدولة',
      },
      {
        label: 'رفض الطلب',
        icon: <XCircle className="w-4 h-4 text-amber-300" />,
        onClick: () => onStatus(app, 'مرفوض'),
        hidden: app.status === 'مرفوض',
      },
      {
        label: 'حذف الطلب',
        icon: <Trash2 className="w-4 h-4" />,
        onClick: () => onDelete(app),
        danger: true,
      },
    ];
  };

  const primaryFor = (app: StoredApplication) =>
    app.status === 'تم القبول' ? (
      <Button size="sm" variant="success" icon={<Send className="w-4 h-4" />} onClick={() => onDispatch(app)}>
        إرسال القبول
      </Button>
    ) : (
      <Button size="sm" variant="primary" icon={<CheckCircle className="w-4 h-4" />} onClick={() => onStatus(app, 'تم القبول')}>
        قبول
      </Button>
    );

  if (!apps.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30">
        <EmptyState title="لا توجد طلبات مطابقة" description="جرّب تغيير البحث أو الفلاتر." />
      </div>
    );
  }

  return (
    <>
      {/* Phones: one card per application */}
      <ul className="md:hidden space-y-3">
        {apps.map((app) => (
          <li key={app.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-start gap-3">
              <span className="pt-1">
                <CheckBox
                  checked={selectedSet.has(app.id)}
                  onChange={() => onToggle(app.id)}
                  label={`تحديد ${app.fullName}`}
                />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{app.fullName}</div>
                    <div className="text-xs text-gray-400 font-mono truncate" dir="ltr">
                      {app.studentId}
                    </div>
                  </div>
                  <StatusPill status={app.status} />
                </div>
                <div className="text-xs text-gray-300 mt-2 leading-relaxed">
                  {app.major} — {effectiveCommittee(app)}
                  {app.organizationalRole ? ` · ${app.organizationalRole}` : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              {primaryFor(app)}
              <Button size="sm" icon={<Eye className="w-4 h-4" />} onClick={() => onInspect(app)}>
                معاينة
              </Button>
              <span className="mr-auto">
                <ActionMenu items={menuFor(app)} label={`إجراءات ${app.fullName}`} align="end" />
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl border border-white/10 overflow-hidden bg-black/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead className="bg-white/[0.04] text-gray-400 text-xs border-b border-white/10">
              <tr>
                <th className="p-3 w-[44px] text-center font-medium">
                  <CheckBox
                    checked={allChecked}
                    indeterminate={selected.length > 0}
                    onChange={onToggleAll}
                    label="تحديد كل الطلبات الظاهرة"
                  />
                </th>
                <th className="p-3 text-right font-medium">اسم المتقدم</th>
                <th className="p-3 text-right font-medium w-[130px]">الرقم الجامعي</th>
                <th className="p-3 text-right font-medium">التخصص والكلية</th>
                <th className="p-3 text-right font-medium">اللجنة والمسمى</th>
                <th className="p-3 text-center font-medium w-[120px]">حالة الطلب</th>
                <th className="p-3 text-center font-medium w-[230px]">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {apps.map((app) => (
                <tr key={app.id} className={`transition-colors ${selectedSet.has(app.id) ? 'bg-cyan-500/[0.06]' : 'hover:bg-white/[0.02]'}`}>
                  <td className="p-3 text-center">
                    <CheckBox
                      checked={selectedSet.has(app.id)}
                      onChange={() => onToggle(app.id)}
                      label={`تحديد ${app.fullName}`}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <div className="font-bold text-white truncate">{app.fullName}</div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5 truncate" dir="ltr">
                      {app.email}
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono text-cyan-300 font-semibold" dir="ltr">
                    {app.studentId}
                  </td>
                  <td className="p-3 text-right">
                    <div className="truncate text-gray-200">{app.major}</div>
                    <div className="text-xs text-gray-400">{app.academicYear}</div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="text-cyan-300 font-medium truncate">{effectiveCommittee(app)}</div>
                    <div className={`text-xs truncate ${app.organizationalRole ? 'text-emerald-300' : 'text-gray-500'}`}>
                      {app.organizationalRole || 'بدون مسمى'}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <StatusPill status={app.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      {primaryFor(app)}
                      <Button size="sm" icon={<Eye className="w-4 h-4" />} onClick={() => onInspect(app)}>
                        معاينة
                      </Button>
                      <ActionMenu items={menuFor(app)} label={`إجراءات ${app.fullName}`} align="end" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
