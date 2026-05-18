import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Plus, X, Search } from 'lucide-react';
import { cn } from '../../utils/helpers';

export interface SmartSelectOption {
  value: string;
  label: string;
}

interface SmartSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SmartSelectOption[];
  placeholder?: string;
  canAddNew?: boolean;
  onAddNew?: (label: string) => SmartSelectOption | void;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  searchable?: boolean;
}

export default function SmartSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  canAddNew = false,
  onAddNew,
  disabled = false,
  className,
  error,
  searchable = true,
}: SmartSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [localOptions, setLocalOptions] = useState<SmartSelectOption[]>(options);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
        setAddingNew(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, searchable]);

  const filtered = search.trim()
    ? localOptions.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : localOptions;

  const selected = localOptions.find((o) => o.value === value);

  const handleSelect = (opt: SmartSelectOption) => {
    onChange(opt.value);
    setOpen(false);
    setSearch('');
  };

  const handleAddNew = () => {
    const label = newLabel.trim();
    if (!label) return;
    const newVal = label.toLowerCase().replace(/\s+/g, '_');
    const newOpt: SmartSelectOption = { value: newVal, label };
    const result = onAddNew?.(label);
    const finalOpt = result ?? newOpt;
    setLocalOptions((prev) => [...prev, finalOpt]);
    onChange(finalOpt.value);
    setNewLabel('');
    setAddingNew(false);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          'form-input w-full flex items-center justify-between text-left',
          !selected && 'text-slate-400 dark:text-slate-500',
          error && 'border-red-500 focus:ring-red-500',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown size={14} className={cn('flex-shrink-0 text-slate-400 transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-[100] flex flex-col max-h-64">
          {searchable && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-7 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary-400/50"
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-400 text-center">No options found</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors',
                    value === opt.value
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60',
                  )}
                >
                  <Check size={13} className={cn('flex-shrink-0', value === opt.value ? 'opacity-100 text-primary-600' : 'opacity-0')} />
                  {opt.label}
                </button>
              ))
            )}
          </div>

          {canAddNew && (
            <div className="border-t border-slate-100 dark:border-slate-700 p-2">
              {addingNew ? (
                <div className="flex gap-1.5">
                  <input
                    autoFocus
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddNew(); }
                      if (e.key === 'Escape') setAddingNew(false);
                    }}
                    placeholder="New option..."
                    className="form-input flex-1 text-xs py-1"
                  />
                  <button type="button" onClick={handleAddNew} className="btn-primary px-2 py-1 text-xs">
                    <Check size={12} />
                  </button>
                  <button type="button" onClick={() => setAddingNew(false)} className="btn-secondary px-2 py-1 text-xs">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingNew(true)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  <Plus size={11} /> Add new option
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
