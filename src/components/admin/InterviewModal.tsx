import React, { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import type { StoredApplication } from '../../types';
import { Button, Field, inputClass } from './ui';

// Picking the interview day when moving an application to "مقابلة مجدولة".
// The hour is optional: plenty of interviews are booked as "يوم الأحد" first.

const toLocalDay = (iso?: string) => (iso ? iso.slice(0, 10) : '');
const toLocalDateTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const InterviewModal: React.FC<{
  app: StoredApplication;
  onClose: () => void;
  onSave: (interviewAt: string | null, timeTbd: boolean) => void;
}> = ({ app, onClose, onSave }) => {
  const [timeTbd, setTimeTbd] = useState(Boolean(app.interviewTimeTbd || !app.interviewAt));
  const [day, setDay] = useState(toLocalDay(app.interviewAt));
  const [dateTime, setDateTime] = useState(toLocalDateTime(app.interviewAt));

  const save = () => {
    if (timeTbd) {
      onSave(day ? new Date(`${day}T09:00`).toISOString() : null, true);
    } else {
      onSave(dateTime ? new Date(dateTime).toISOString() : null, false);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="موعد المقابلة"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#120A36] p-5 text-right shadow-2xl space-y-4"
      >
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 shrink-0">
            <CalendarClock className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-white">موعد مقابلة {app.fullName}</h3>
            <p className="text-sm text-gray-400 mt-1">حدد اليوم، والساعة إن كانت معروفة. تقدر تتركه فارغاً وتحدده لاحقاً.</p>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
          <input type="checkbox" checked={timeTbd} onChange={(e) => setTimeTbd(e.target.checked)} className="w-4 h-4 accent-cyan-400" />
          <span>اليوم فقط — الساعة تُحدد لاحقاً</span>
        </label>

        {timeTbd ? (
          <Field label="يوم المقابلة">
            <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className={inputClass} />
          </Field>
        ) : (
          <Field label="يوم وساعة المقابلة">
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className={inputClass}
            />
          </Field>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button onClick={onClose}>إلغاء</Button>
          <Button variant="primary" onClick={save}>
            حفظ الموعد
          </Button>
        </div>
      </div>
    </div>
  );
};
