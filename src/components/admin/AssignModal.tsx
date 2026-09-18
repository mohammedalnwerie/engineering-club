import React, { useState } from 'react';
import { UserCog, ShieldCheck } from 'lucide-react';
import type { StoredApplication } from '../../types';
import { COMMITTEES, effectiveCommittee, findCommittee } from '../../data/committees';
import { Button, Field, inputClass } from './ui';

// Moving a member between committees and giving them the title printed on the
// committee card — reachable from the row menu, not buried in the full profile.

export const AssignModal: React.FC<{
  app: StoredApplication;
  onClose: () => void;
  onSave: (assignment: { assignedCommittee: string; organizationalRole: string }) => void;
}> = ({ app, onClose, onSave }) => {
  const [committee, setCommittee] = useState(() => findCommittee(effectiveCommittee(app))?.name || effectiveCommittee(app));
  const [role, setRole] = useState(app.organizationalRole || '');
  const suggestions = findCommittee(committee)?.roles || [];

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="تعيين اللجنة والمسمى"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#120A36] p-5 text-right shadow-2xl space-y-4"
      >
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 shrink-0">
            <UserCog className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white truncate">تعيين {app.fullName}</h3>
            <p className="text-sm text-gray-400 mt-1">
              طلب الانضمام إلى: <span className="text-gray-200">{app.targetCommittee}</span>
            </p>
          </div>
        </div>

        <Field label="اللجنة" hint="غيّرها لنقل العضو من العضوية العامة إلى لجنة، أو بين اللجان">
          <select value={committee} onChange={(e) => setCommittee(e.target.value)} className={inputClass}>
            {!findCommittee(committee) && committee && <option value={committee}>{committee}</option>}
            {COMMITTEES.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="المسمى على الكرت" hint="مثال: مصور، مسؤول تصميم، رئيس اللجنة — أو اتركه فارغاً">
          <input
            type="text"
            value={role}
            maxLength={40}
            onChange={(e) => setRole(e.target.value)}
            placeholder="اختر من الاقتراحات أو اكتب مسمى"
            className={inputClass}
          />
        </Field>

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${
                  role === r
                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-100'
                    : 'bg-white/[0.03] border-white/10 text-gray-300 hover:border-cyan-400/40'
                }`}
              >
                {r}
              </button>
            ))}
            {role && (
              <button
                type="button"
                onClick={() => setRole('')}
                className="px-2.5 py-1.5 rounded-lg text-xs border border-white/10 text-gray-400 hover:text-white cursor-pointer"
              >
                بدون مسمى
              </button>
            )}
          </div>
        )}

        {(role.includes('رئيس') || role.includes('ممثل') || role.includes('منسق') || role.includes('صندوق') || role.includes('نائب')) && (
          <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>سيتم إدراج الطالب تلقائياً في الكادر القيادي والهيكل التنظيمي للنادي عند الحفظ ✓</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button onClick={onClose}>إلغاء</Button>
          <Button
            variant="primary"
            onClick={() => {
              onSave({ assignedCommittee: committee, organizationalRole: role.trim() });
              onClose();
            }}
          >
            حفظ التعيين
          </Button>
        </div>
      </div>
    </div>
  );
};
