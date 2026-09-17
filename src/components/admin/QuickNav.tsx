import React from 'react';
import { Search, CornerDownLeft } from 'lucide-react';

// Ctrl+K jump list — 13 sidebar sections are too many to scan every time.

export interface QuickNavItem {
  id: string;
  label: string;
  group: string;
}

export const QuickNav: React.FC<{
  open: boolean;
  items: QuickNavItem[];
  onPick: (id: string) => void;
  onClose: () => void;
}> = ({ open, items, onPick, onClose }) => {
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q));
  }, [items, query]);

  React.useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      // Let the dialog mount before moving focus into it.
      const id = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  React.useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  const choose = (index: number) => {
    const item = results[index];
    if (item) {
      onPick(item.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[85] bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 pt-24" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="بحث سريع في الأقسام"
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#120A36] shadow-2xl overflow-hidden text-right"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                choose(active);
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="اكتب اسم القسم… مثلاً: الفعاليات"
            className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-gray-500"
          />
          <span className="text-xs font-mono text-gray-500 shrink-0">Esc</span>
        </div>

        <ul className="max-h-80 overflow-y-auto py-1">
          {results.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={`w-full px-4 py-3 flex items-center gap-2 text-right transition-colors cursor-pointer ${
                  index === active ? 'bg-cyan-500/15 text-white' : 'text-gray-300 hover:bg-white/[0.06]'
                }`}
              >
                <span className="flex-1 text-sm font-bold">{item.label}</span>
                <span className="text-xs text-gray-500">{item.group}</span>
                {index === active && <CornerDownLeft className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
              </button>
            </li>
          ))}
          {!results.length && <li className="px-4 py-6 text-center text-sm text-gray-500">لا يوجد قسم بهذا الاسم</li>}
        </ul>
      </div>
    </div>
  );
};
