import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

// Small shared building blocks so the newer dashboard sections look and behave the same.

export const PageHeader: React.FC<{ title: string; description?: string; actions?: React.ReactNode }> = ({
  title,
  description,
  actions,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
    <div>
      <h2 className="text-xl sm:text-2xl font-black text-white">{title}</h2>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

export const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-2xl bg-white/[0.03] border border-white/10 ${className}`}>{children}</div>
);

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-[#7F1AB2] to-[#6F3993] hover:from-[#A26CC6] hover:to-[#7F1AB2] text-white',
  secondary: 'bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white',
  danger: 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-200',
  success: 'bg-emerald-500 hover:bg-emerald-400 text-black',
  ghost: 'hover:bg-white/5 text-gray-300 hover:text-white',
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; icon?: React.ReactNode; loading?: boolean; size?: 'sm' | 'md' }
>(({ variant = 'secondary', icon, loading, size = 'md', children, className = '', disabled, ...rest }, ref) => (
  <button
    ref={ref}
    type="button"
    disabled={disabled || loading}
    className={`${BUTTON_STYLES[variant]} ${
      size === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'
    } rounded-xl font-bold whitespace-nowrap inline-flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    {...rest}
  >
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
    {children}
  </button>
));
Button.displayName = 'Button';

const BADGE_TONES = {
  gray: 'bg-white/5 text-gray-300 border-white/10',
  green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  red: 'bg-red-500/10 text-red-300 border-red-500/30',
  cyan: 'bg-cyan-500/10 text-cyan-200 border-cyan-500/30',
  purple: 'bg-[#7F1AB2]/20 text-[#D1B5E3] border-[#7F1AB2]/40',
};

export const Badge: React.FC<{ tone?: keyof typeof BADGE_TONES; children: React.ReactNode }> = ({ tone = 'gray', children }) => (
  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${BADGE_TONES[tone]}`}>
    {children}
  </span>
);

export const ErrorNote: React.FC<{ message: string | null | undefined }> = ({ message }) =>
  message ? (
    <p role="alert" className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm flex items-start gap-2">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span className="leading-relaxed">{message}</span>
    </p>
  ) : null;

export const EmptyState: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <div className="py-12 text-center">
    <div className="text-base font-bold text-gray-200">{title}</div>
    {description && <div className="text-sm text-gray-500 mt-1">{description}</div>}
  </div>
);

export const LoadingRows: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="space-y-2" aria-busy="true">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
    ))}
  </div>
);

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode; className?: string }> = ({
  label,
  hint,
  children,
  className = '',
}) => (
  <label className={`block ${className}`}>
    <span className="block text-sm text-gray-300 mb-1.5">{label}</span>
    {children}
    {hint && <span className="block text-xs text-gray-500 mt-1">{hint}</span>}
  </label>
);

export const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm';

export const formatDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

/** Converts an ISO date to the value format of <input type="datetime-local"> in local time. */
export const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

export const SidebarNavItem: React.FC<{
  active: boolean;
  collapsed: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
  onClick: () => void;
}> = ({ active, collapsed, icon, label, badge, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-current={active ? 'page' : undefined}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-xs transition-all cursor-pointer min-h-[42px] ${
      active
        ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/35 shadow-[0_2px_12px_rgba(0,240,255,0.08)] font-bold'
        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent font-medium'
    }`}
  >
    <span className={`shrink-0 transition-colors ${active ? 'text-cyan-400' : 'text-slate-400'}`}>{icon}</span>
    {!collapsed && (
      <>
        <span className="flex-1 text-right truncate">{label}</span>
        {badge}
      </>
    )}
  </button>
);

