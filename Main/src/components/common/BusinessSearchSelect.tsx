import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronDown, X } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { cn } from '../../utils/helpers';

interface Business { id: string; name: string; code: string; adminEmail?: string; }

interface Props {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function BusinessSearchSelect({ value, onChange, disabled, placeholder = '— Choose a business —' }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: businesses = [] } = useQuery<Business[]>({
    queryKey: ['businesses-dropdown'],
    queryFn: async () => { const res = await businessService.getDropdown(); return res.data.data || []; },
  });

  const selected = businesses.find(b => b.id === value);

  const filtered = query.trim()
    ? businesses.filter(b => {
        const q = query.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          (b.adminEmail?.toLowerCase().includes(q) ?? false)
        );
      })
    : businesses;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (b: Business) => {
    onChange(b.id);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          'form-input w-full text-left flex items-center justify-between gap-2 text-sm py-1.5 pr-8',
          !selected && 'text-slate-400 dark:text-slate-500',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        <span className="truncate">
          {selected ? `${selected.name} (${selected.code})` : placeholder}
        </span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {selected && !disabled && (
            <span onClick={handleClear} className="p-0.5 hover:text-red-500 text-slate-400">
              <X size={12} />
            </span>
          )}
          <ChevronDown size={13} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {open && (
        <div className="absolute z-[60] mt-1 w-full min-w-[260px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search name, email, phone, ID..."
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-400 text-center">No businesses found</li>
            ) : filtered.map(b => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(b)}
                  className={cn(
                    'w-full text-left px-3 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors',
                    b.id === value && 'bg-primary-50 dark:bg-primary-900/30'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800 dark:text-white truncate">{b.name}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{b.code}</span>
                  </div>
                  {b.adminEmail && (
                    <div className="mt-0.5">
                      <span className="text-xs text-slate-400 truncate">{b.adminEmail}</span>
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
