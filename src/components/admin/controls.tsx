import React from 'react';
import { AlertCircle, MoreVertical } from 'lucide-react';
import { Button } from './ui';

// Shared controls for the dashboard tables: a labelled row menu, a confirm
// dialog that replaces window.confirm, and the selection checkbox.

export interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  hidden?: boolean;
}

export const ActionMenu: React.FC<{ items: ActionItem[]; label?: string; align?: 'start' | 'end' }> = ({
  items,
  label = 'إجراءات أخرى',
  align = 'start',
}) => {
  const [open, setOpen] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const visible = items.filter((i) => !i.hidden);

  React.useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!visible.length) return null;

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-gray-200 inline-flex items-center justify-center transition-colors cursor-pointer"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-40 mt-1 min-w-[230px] rounded-xl border border-white/10 bg-[#120A36] shadow-2xl overflow-hidden ${
            align === 'end' ? 'left-0' : 'right-0'
          }`}
        >
          {visible.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`w-full px-3.5 py-3 text-right text-sm flex items-center gap-2.5 transition-colors cursor-pointer ${
                item.danger ? 'text-red-300 hover:bg-red-500/15' : 'text-gray-200 hover:bg-white/[0.08]'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmOptions & { onResolve: (ok: boolean) => void }> = ({
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  danger,
  onResolve,
}) => {
  const confirmRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onResolve(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onResolve]);

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => onResolve(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#120A36] p-5 text-right shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className={`p-2 rounded-xl shrink-0 ${danger ? 'bg-red-500/15 text-red-300' : 'bg-cyan-500/15 text-cyan-300'}`}>
            <AlertCircle className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white leading-snug">{title}</h3>
            {message && <p className="text-sm text-gray-300 mt-1.5 leading-relaxed">{message}</p>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <Button onClick={() => onResolve(false)}>{cancelLabel}</Button>
          <Button ref={confirmRef} variant={danger ? 'danger' : 'primary'} onClick={() => onResolve(true)}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

/** `const { confirm, confirmDialog } = useConfirm()` — render confirmDialog once, then `await confirm({...})`. */
export function useConfirm() {
  const [state, setState] = React.useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);

  const confirm = React.useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ ...options, resolve })),
    []
  );

  const confirmDialog = state ? (
    <ConfirmDialog
      {...state}
      onResolve={(ok) => {
        state.resolve(ok);
        setState(null);
      }}
    />
  ) : null;

  return { confirm, confirmDialog };
}

export const CheckBox: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void; label: string }> = ({
  checked,
  indeterminate,
  onChange,
  label,
}) => (
  <input
    type="checkbox"
    aria-label={label}
    checked={checked}
    ref={(el) => {
      if (el) el.indeterminate = Boolean(indeterminate) && !checked;
    }}
    onChange={onChange}
    className="w-4 h-4 rounded border-white/30 bg-black/40 accent-cyan-400 cursor-pointer"
  />
);
