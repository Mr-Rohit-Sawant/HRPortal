import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '../../utils/helpers';

// ── Dial code data ────────────────────────────────────────────────────────────

export interface DialCode {
  code: string;   // e.g. "+91"
  country: string;
  flag: string;
  digits: number; // expected subscriber-number length
}

export const DIAL_CODES: DialCode[] = [
  { code: '+91',  country: 'India',        flag: '🇮🇳', digits: 10 },
  { code: '+1',   country: 'USA / Canada', flag: '🇺🇸', digits: 10 },
  { code: '+44',  country: 'UK',           flag: '🇬🇧', digits: 10 },
  { code: '+61',  country: 'Australia',    flag: '🇦🇺', digits: 9  },
  { code: '+971', country: 'UAE',          flag: '🇦🇪', digits: 9  },
  { code: '+65',  country: 'Singapore',    flag: '🇸🇬', digits: 8  },
  { code: '+49',  country: 'Germany',      flag: '🇩🇪', digits: 11 },
  { code: '+33',  country: 'France',       flag: '🇫🇷', digits: 9  },
  { code: '+81',  country: 'Japan',        flag: '🇯🇵', digits: 10 },
  { code: '+82',  country: 'South Korea',  flag: '🇰🇷', digits: 10 },
  { code: '+86',  country: 'China',        flag: '🇨🇳', digits: 11 },
  { code: '+60',  country: 'Malaysia',     flag: '🇲🇾', digits: 9  },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', digits: 9  },
  { code: '+974', country: 'Qatar',        flag: '🇶🇦', digits: 8  },
  { code: '+973', country: 'Bahrain',      flag: '🇧🇭', digits: 8  },
  { code: '+968', country: 'Oman',         flag: '🇴🇲', digits: 8  },
  { code: '+965', country: 'Kuwait',       flag: '🇰🇼', digits: 8  },
  { code: '+27',  country: 'South Africa', flag: '🇿🇦', digits: 9  },
  { code: '+31',  country: 'Netherlands',  flag: '🇳🇱', digits: 9  },
  { code: '+41',  country: 'Switzerland',  flag: '🇨🇭', digits: 9  },
  { code: '+64',  country: 'New Zealand',  flag: '🇳🇿', digits: 9  },
  { code: '+55',  country: 'Brazil',       flag: '🇧🇷', digits: 11 },
  { code: '+7',   country: 'Russia',       flag: '🇷🇺', digits: 10 },
  { code: '+34',  country: 'Spain',        flag: '🇪🇸', digits: 9  },
  { code: '+39',  country: 'Italy',        flag: '🇮🇹', digits: 10 },
];

const DEFAULT_DIAL = DIAL_CODES[0]; // India +91

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse a combined phone string (e.g. "+919876543210") into { dial, number }. */
function parseValue(value: string): { dial: DialCode; number: string } {
  if (!value) return { dial: DEFAULT_DIAL, number: '' };

  if (value.startsWith('+')) {
    // Try longest match first (e.g. +971 before +97)
    const sorted = [...DIAL_CODES].sort((a, b) => b.code.length - a.code.length);
    for (const d of sorted) {
      if (value.startsWith(d.code)) {
        return { dial: d, number: value.slice(d.code.length).replace(/\D/g, '') };
      }
    }
  }

  // No known dial code prefix — assume default and keep raw digits
  return { dial: DEFAULT_DIAL, number: value.replace(/\D/g, '') };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function PhoneInput({
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  className,
}: PhoneInputProps) {
  const parsed = parseValue(value);
  const [selectedDial, setSelectedDial] = useState<DialCode>(parsed.dial);
  const [number, setNumber] = useState(parsed.number);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Sync when parent resets the value (e.g. edit mode prefill)
  useEffect(() => {
    const p = parseValue(value);
    setSelectedDial(p.dial);
    setNumber(p.number);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const maxDigits = selectedDial.digits;
  const isOverLimit = number.length > maxDigits;
  const isUnderLimit = number.length > 0 && number.length < maxDigits;

  const handleDialSelect = (dial: DialCode) => {
    setSelectedDial(dial);
    setOpen(false);
    setSearch('');
    // Recompose and notify parent
    const trimmed = number.slice(0, dial.digits);
    setNumber(trimmed);
    onChange(trimmed ? `${dial.code}${trimmed}` : '');
  };

  const handleNumberChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, maxDigits);
    setNumber(digits);
    onChange(digits ? `${selectedDial.code}${digits}` : '');
  };

  const filtered = search.trim()
    ? DIAL_CODES.filter(
        (d) =>
          d.country.toLowerCase().includes(search.toLowerCase()) ||
          d.code.includes(search),
      )
    : DIAL_CODES;

  const hasError = !!error || isOverLimit;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className={cn(
        'form-input flex items-center gap-0 !p-0 overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent',
        hasError && '!border-red-500 dark:!border-red-500',
        disabled && 'opacity-60 cursor-not-allowed',
      )}>
        {/* Dial code selector */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 h-full border-r border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors flex-shrink-0 text-sm',
            disabled && 'pointer-events-none',
          )}
        >
          <span className="text-base leading-none">{selectedDial.flag}</span>
          <span className="text-slate-600 dark:text-slate-300 font-medium tabular-nums">{selectedDial.code}</span>
          <ChevronDown size={12} className={cn('text-slate-400 transition-transform duration-150', open && 'rotate-180')} />
        </button>

        {/* Number input */}
        <input
          type="tel"
          inputMode="numeric"
          value={number}
          onChange={(e) => handleNumberChange(e.target.value)}
          placeholder={placeholder ?? `${maxDigits} digit number`}
          disabled={disabled}
          maxLength={maxDigits}
          className="flex-1 px-3 py-2 bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400 min-w-0"
        />

        {/* Digit counter */}
        {number.length > 0 && (
          <span className={cn(
            'px-2 text-xs tabular-nums flex-shrink-0 font-medium',
            isOverLimit ? 'text-red-500' : isUnderLimit ? 'text-amber-500 dark:text-amber-400' : 'text-green-600 dark:text-green-400',
          )}>
            {number.length}/{maxDigits}
          </span>
        )}
      </div>

      {/* Error / hint */}
      {error && <p className="form-error mt-1">{error}</p>}
      {!error && isUnderLimit && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
          {selectedDial.country} numbers need exactly {maxDigits} digits ({maxDigits - number.length} more)
        </p>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-[100] flex flex-col max-h-64">
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country..."
                className="w-full pl-7 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary-400/50"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-400 text-center">No results</p>
            ) : (
              filtered.map((d) => (
                <button
                  key={d.code}
                  type="button"
                  onClick={() => handleDialSelect(d)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                    selectedDial.code === d.code
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60',
                  )}
                >
                  <span className="text-base w-6 text-center leading-none">{d.flag}</span>
                  <span className="flex-1 text-left">{d.country}</span>
                  <span className="font-mono text-xs text-slate-400 tabular-nums">{d.code}</span>
                  <span className="text-xs text-slate-300 dark:text-slate-600">{d.digits}d</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
