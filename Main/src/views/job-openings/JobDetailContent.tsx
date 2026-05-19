import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, MapPin, Users, Calendar, Search, X, ChevronRight, ChevronDown,
  Check, Loader2, AlignLeft, Hash, Tag, Pencil, Trash2,
  Lock, Clock, Briefcase, Building2, DollarSign, FileText, Upload, ExternalLink, RefreshCw,
} from 'lucide-react';
import { jobService } from '../../services/jobService';
import { formatDate, getStatusColor, getPriorityColor, cn } from '../../utils/helpers';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const RESULT_MAP: Record<string, { label: string; color: string }> = {
  PENDING:  { label: 'None',     color: '#94a3b8' },
  SELECTED: { label: 'Selected', color: '#22c55e' },
  REJECTED: { label: 'Rejected', color: '#ef4444' },
  ON_HOLD:  { label: 'Hold',     color: '#f59e0b' },
};

const RESULT_OPTIONS = [
  { value: 'PENDING',  label: 'None',     color: '#94a3b8' },
  { value: 'SELECTED', label: 'Selected', color: '#22c55e' },
  { value: 'REJECTED', label: 'Rejected', color: '#ef4444' },
  { value: 'ON_HOLD',  label: 'Hold',     color: '#f59e0b' },
];

const PSR_STATUSES = [
  { value: 'PENDING',          label: 'Pending',             color: '#94a3b8' },
  { value: 'OFFER_RELEASED',   label: 'Offer Released',      color: '#3b82f6' },
  { value: 'OFFER_ACCEPTED',   label: 'Offer Accepted',      color: '#8b5cf6' },
  { value: 'JOINED',           label: 'Candidate Joined',    color: '#22c55e' },
  { value: 'CONFIRMED',        label: 'Candidate Confirmed', color: '#10b981' },
];

const COL_TYPES = [
  { type: 'TEXT',     icon: <AlignLeft size={13} />, label: 'Text' },
  { type: 'NUMBER',   icon: <Hash size={13} />,      label: 'Number' },
  { type: 'DROPDOWN', icon: <Tag size={13} />,        label: 'Dropdown' },
  { type: 'DATE',     icon: <Calendar size={13} />,   label: 'Date' },
];

const DEFAULT_ROUND_COLS = [
  { name: 'phone',  label: 'Phone',            isDefault: true },
  { name: 'email',  label: 'Email',            isDefault: true },
  { name: 'status', label: 'Selection Status', isDefault: true },
  { name: 'remark', label: 'Remark',           isDefault: true },
];

// ─── Assigned Employees Bar ───────────────────────────────────────────────────

function AssignedEmployeesBar({ jobId, assignees, onRefresh }: { jobId: string; assignees: any[]; onRefresh: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/employees', { params: { search, limit: 10 } });
        setResults(res.data?.data || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [search, open]);

  const toggleMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'add' | 'remove' }) =>
      jobService.toggleAssignee(jobId, id, action),
    onSuccess: () => {
      onRefresh();
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: () => toast.error('Failed to update'),
  });

  const openPanel = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPanelPos({ top: r.bottom + 6, left: Math.min(r.left, window.innerWidth - 232) });
    }
    setSearch('');
    setOpen(true);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap mb-5">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Assigned Recruiters</span>
      {assignees.map((emp: any) => (
        <div key={emp.id} className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 group/emp">
          <div className="w-5 h-5 rounded-full bg-indigo-200 dark:bg-indigo-700 flex items-center justify-center text-[9px] font-bold">
            {emp.firstName?.[0]}{emp.lastName?.[0]}
          </div>
          <button
            onClick={() => navigate(`/employees/${emp.id}`)}
            className="text-xs font-medium hover:underline"
          >
            {emp.firstName} {emp.lastName}
          </button>
          <button onClick={() => toggleMutation.mutate({ id: emp.id, action: 'remove' })}
            className="opacity-0 group-hover/emp:opacity-100 text-indigo-400 hover:text-red-500 transition-all">
            <X size={11} />
          </button>
        </div>
      ))}
      <button ref={btnRef} onClick={openPanel}
        className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-slate-300 dark:border-slate-600 text-xs text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
        <Plus size={12} /> Add Recruiter
      </button>

      {open && panelPos && (
        <div ref={panelRef} style={{ position: 'fixed', top: panelPos.top, left: panelPos.left, zIndex: 9999, width: 224 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-2 py-1.5">
              <Search size={12} className="text-slate-400 flex-shrink-0" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search employees…"
                className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-400" />
              {loading && <Loader2 size={11} className="animate-spin text-slate-400" />}
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {results.length === 0 && !loading && (
              <p className="text-xs text-slate-400 text-center py-4">{search ? 'No results' : 'Type to search…'}</p>
            )}
            {results.map((emp: any) => {
              const isAssigned = assignees.some(a => a.id === emp.id);
              return (
                <button key={emp.id} onClick={() => toggleMutation.mutate({ id: emp.id, action: isAssigned ? 'remove' : 'add' })}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-left">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{emp.firstName} {emp.lastName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{emp.designation || emp.email}</p>
                  </div>
                  {isAssigned && <Check size={12} className="text-indigo-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Selection Status Cell ────────────────────────────────────────────────────

function StatusCell({ slot, round, onSave }: {
  slot: any; round: any;
  onSave: (result: string, customStatus?: string, newLabel?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'select' | 'edit'>('select');
  const [newLabel, setNewLabel] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const customOptions: { label: string; color: string }[] = round.customColumns?.selectionOptions || [];
  const customStatus = slot.customFields?.customStatus as string | undefined;

  let display = RESULT_MAP[slot.result] || RESULT_MAP.PENDING;
  if (customStatus) {
    const found = customOptions.find((o: any) => o.label === customStatus);
    display = found ? { label: found.label, color: found.color } : { label: customStatus, color: '#6366f1' };
  }

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setMode('select'); }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const openDropdown = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: Math.min(r.bottom + 4, window.innerHeight - 280), left: Math.min(r.left, window.innerWidth - 192) });
    }
    setMode('select');
    setOpen(v => !v);
  };

  return (
    <div ref={ref} className="inline-block">
      <button ref={btnRef} onClick={openDropdown}
        style={{ backgroundColor: display.color }}
        className="px-2.5 py-0.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity whitespace-nowrap">
        {display.label}
      </button>

      {open && pos && (
        <div style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, minWidth: 180 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {mode === 'select' ? (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-xs text-slate-400 font-medium">Status</span>
                <button onClick={() => setMode('edit')} className="text-xs text-slate-400 hover:text-primary-600 flex items-center gap-1">
                  <Pencil size={10} /> Add label
                </button>
              </div>
              <div className="py-1.5">
                {RESULT_OPTIONS.map(opt => (
                  <div key={opt.value} className="px-2 py-0.5">
                    <button onClick={() => { onSave(opt.value); setOpen(false); }}
                      style={{ backgroundColor: opt.color }}
                      className={cn('w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-white text-center transition-all',
                        slot.result === opt.value && !customStatus ? 'ring-2 ring-white/40' : 'opacity-80 hover:opacity-100')}>
                      {opt.label}
                    </button>
                  </div>
                ))}
                {customOptions.map((opt: any) => (
                  <div key={opt.label} className="px-2 py-0.5">
                    <button onClick={() => { onSave('PENDING', opt.label); setOpen(false); }}
                      style={{ backgroundColor: opt.color }}
                      className={cn('w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-white text-center transition-all',
                        customStatus === opt.label ? 'ring-2 ring-white/40' : 'opacity-80 hover:opacity-100')}>
                      {opt.label}
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-slate-100 dark:border-slate-700">
                <button onClick={() => setMode('select')} className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400">
                  <ChevronRight size={13} className="rotate-180" />
                </button>
                <span className="text-xs font-semibold text-slate-800 dark:text-white flex-1">Add Custom Label</span>
              </div>
              <div className="p-3">
                <input autoFocus value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  placeholder="Label name…" className="form-input text-xs py-1.5 w-full"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && newLabel.trim()) {
                      onSave('PENDING', newLabel.trim(), newLabel.trim());
                      setNewLabel(''); setMode('select');
                    }
                    if (e.key === 'Escape') setMode('select');
                  }} />
                <p className="text-[10px] text-slate-400 mt-1.5">Press Enter to add</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PSR Status Cell ──────────────────────────────────────────────────────────

function PSRStatusCell({ record, onSave }: { record: any; onSave: (status: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const current = PSR_STATUSES.find(s => s.value === record.status) || PSR_STATUSES[0];

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div ref={ref} className="inline-block">
      <button ref={btnRef} onClick={() => {
        if (btnRef.current) {
          const r = btnRef.current.getBoundingClientRect();
          setPos({ top: Math.min(r.bottom + 4, window.innerHeight - 240), left: Math.min(r.left, window.innerWidth - 200) });
        }
        setOpen(v => !v);
      }}
        style={{ backgroundColor: current.color }}
        className="px-2.5 py-0.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity whitespace-nowrap">
        {current.label}
      </button>
      {open && pos && (
        <div style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, minWidth: 190 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden py-1.5">
          {PSR_STATUSES.map(opt => (
            <div key={opt.value} className="px-2 py-0.5">
              <button onClick={() => { onSave(opt.value); setOpen(false); }}
                style={{ backgroundColor: opt.color }}
                className={cn('w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-white text-center',
                  record.status === opt.value ? 'ring-2 ring-white/40' : 'opacity-80 hover:opacity-100')}>
                {opt.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Inline Remark Cell ───────────────────────────────────────────────────────

function RemarkCell({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  useEffect(() => { setVal(value); }, [value]);

  if (editing) {
    return (
      <input autoFocus value={val} onChange={e => setVal(e.target.value)}
        onBlur={() => { onSave(val); setEditing(false); }}
        onKeyDown={e => { if (e.key === 'Enter') { onSave(val); setEditing(false); } if (e.key === 'Escape') { setVal(value); setEditing(false); } }}
        className="form-input text-xs py-1 w-full min-w-[120px]" placeholder="Add remark…" />
    );
  }
  return (
    <div onClick={() => setEditing(true)} className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:underline decoration-dashed truncate max-w-[140px]">
      {value || <span className="text-slate-300 dark:text-slate-600">—</span>}
    </div>
  );
}

// ─── Custom Column Cell ───────────────────────────────────────────────────────

function CustomColCell({ col, slot, onSave }: { col: any; slot: any; onSave: (fieldName: string, val: any) => void }) {
  const rawVal = slot.customFields?.[col.name] ?? '';
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(rawVal);
  useEffect(() => { setVal(rawVal); }, [rawVal]);

  if (col.dataType === 'DROPDOWN') {
    return (
      <select value={rawVal} onChange={e => onSave(col.name, e.target.value)}
        className="text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-0.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 max-w-[120px]">
        <option value="">—</option>
        {(col.config?.options || []).map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (col.dataType === 'DATE') {
    return (
      <input type="date" value={rawVal} onChange={e => onSave(col.name, e.target.value)}
        className="text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-0.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
    );
  }
  if (editing) {
    return (
      <input autoFocus type={col.dataType === 'NUMBER' ? 'number' : 'text'} value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => { onSave(col.name, val); setEditing(false); }}
        onKeyDown={e => { if (e.key === 'Enter') { onSave(col.name, val); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
        className="form-input text-xs py-1 w-full min-w-[80px]" />
    );
  }
  return (
    <div onClick={() => setEditing(true)} className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:underline decoration-dashed truncate max-w-[120px]">
      {rawVal || <span className="text-slate-300 dark:text-slate-600">—</span>}
    </div>
  );
}

// ─── Add Custom Column Popup ──────────────────────────────────────────────────

function AddColPopup({ anchorRect, onClose, onAdd }: {
  anchorRect: DOMRect; onClose: () => void; onAdd: (col: any) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [opts, setOpts] = useState(['']);
  const ref = useRef<HTMLDivElement>(null);

  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(anchorRect.bottom + 6, window.innerHeight - 340),
    left: Math.min(anchorRect.left, window.innerWidth - 260),
    zIndex: 9999, width: 248,
  };

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    setTimeout(() => document.addEventListener('mousedown', h), 100);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const handleAdd = () => {
    if (!name.trim() || !type) { toast.error('Name and type required'); return; }
    onAdd({ name: name.trim().toLowerCase().replace(/\s+/g, '_'), label: name.trim(), dataType: type, config: type === 'DROPDOWN' ? { options: opts.filter(Boolean) } : undefined });
    onClose();
  };

  return (
    <div ref={ref} style={style} className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <span className="text-sm font-semibold text-slate-900 dark:text-white">Add Column</span>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"><X size={13} className="text-slate-400" /></button>
      </div>
      <div className="p-4 space-y-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Column name" className="form-input text-sm w-full" autoFocus />
        <div className="grid grid-cols-2 gap-1.5">
          {COL_TYPES.map(ct => (
            <button key={ct.type} onClick={() => setType(ct.type)}
              className={cn('flex items-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all',
                type === ct.type
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300')}>
              {ct.icon} {ct.label}
            </button>
          ))}
        </div>
        {type === 'DROPDOWN' && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Options</label>
            {opts.map((o, i) => (
              <div key={i} className="flex gap-1.5">
                <input value={o} onChange={e => { const n = [...opts]; n[i] = e.target.value; setOpts(n); }}
                  placeholder={`Option ${i + 1}`} className="form-input text-xs py-1 flex-1" />
                {opts.length > 1 && <button onClick={() => setOpts(opts.filter((_, j) => j !== i))} className="text-red-400"><X size={12} /></button>}
              </div>
            ))}
            <button onClick={() => setOpts([...opts, ''])} className="text-xs text-primary-600 flex items-center gap-1"><Plus size={11} /> Add option</button>
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1 text-xs py-1.5">Cancel</button>
          <button onClick={handleAdd} className="btn-primary flex-1 text-xs py-1.5 justify-center"><Check size={12} /> Add</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Candidates Modal ─────────────────────────────────────────────────────

function AddCandidatesModal({ roundId, existingIds, onClose, onRefresh }: {
  roundId: string; existingIds: string[]; onClose: () => void; onRefresh: () => void;
}) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/cv', { params: { search, limit: 20 } });
        setResults(res.data?.data || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleAdd = async () => {
    setSaving(true);
    try {
      await Promise.all([...selected].map(cid => jobService.addCandidateToRound(roundId, cid)));
      toast.success(`${selected.size} candidate(s) added`);
      onRefresh();
      onClose();
    } catch { toast.error('Failed to add candidates'); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">Add Candidates</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X size={16} /></button>
        </div>
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, designation, skills…"
              className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-400" />
            {loading && <Loader2 size={13} className="animate-spin text-slate-400" />}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {results.map(c => {
            const isExisting = existingIds.includes(c.id);
            const isSelected = selected.has(c.id);
            return (
              <label key={c.id} className={cn('flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-700/50',
                isExisting ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40',
                isSelected && 'bg-primary-50 dark:bg-primary-900/20')}>
                <input type="checkbox" checked={isSelected} disabled={isExisting} onChange={() => !isExisting && toggle(c.id)}
                  className="w-4 h-4 rounded border-slate-300 accent-primary-600" />
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">
                  {c.firstName?.[0]}{c.lastName?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-slate-400 truncate">{c.currentDesignation || c.currentCompany || c.email}</p>
                </div>
                {isExisting && <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">Already added</span>}
              </label>
            );
          })}
          {results.length === 0 && !loading && (
            <p className="text-sm text-slate-400 text-center py-8">{search ? 'No candidates found' : 'Type to search…'}</p>
          )}
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-slate-700">
          <span className="text-sm text-slate-500">{selected.size > 0 ? `${selected.size} selected` : 'Select candidates'}</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary text-sm py-1.5">Cancel</button>
            <button onClick={handleAdd} disabled={selected.size === 0 || saving} className="btn-primary text-sm py-1.5 justify-center">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add {selected.size > 0 ? `(${selected.size})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Round Panel ──────────────────────────────────────────────────────────────

function RoundPanel({ round, jobId, isFirst, processGroup = 'main', onRefresh }: {
  round: any; jobId: string; isFirst: boolean; processGroup?: string; onRefresh: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(isFirst);
  const [renaming, setRenaming] = useState(false);
  const [roundName, setRoundName] = useState(round.roundName);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [addColRect, setAddColRect] = useState<DOMRect | null>(null);
  const [addCandidateOpen, setAddCandidateOpen] = useState(false);
  const addColBtnRef = useRef<HTMLButtonElement>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Normalise customColumns: ensure default columns are included
  const rawCols: any[] = round.customColumns || [];
  const hasDefaults = rawCols.some((c: any) => c.isDefault);
  const allColumns: any[] = hasDefaults
    ? rawCols
    : [...DEFAULT_ROUND_COLS, ...rawCols.filter((c: any) => c.name)];
  const customCols = allColumns.filter((c: any) => !c.isDefault && c.name);

  const renameMutation = useMutation({
    mutationFn: () => jobService.renameRound(round.id, roundName),
    onSuccess: () => { setRenaming(false); onRefresh(); },
    onError: () => toast.error('Failed to rename'),
  });

  const updateSlotMutation = useMutation({
    mutationFn: ({ slotId, data }: { slotId: string; data: any }) => jobService.updateSlot(slotId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job', jobId] }),
  });

  const updateCustomFieldMutation = useMutation({
    mutationFn: ({ slotId, fieldName, value }: { slotId: string; fieldName: string; value: any }) =>
      jobService.updateSlotCustomField(slotId, fieldName, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job', jobId] }),
  });

  const bulkMutation = useMutation({
    mutationFn: (data: { result?: string }) => jobService.bulkUpdateSlots(round.id, [...selectedSlots], data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['job', jobId] }); setSelectedSlots(new Set()); toast.success('Updated'); },
    onError: () => toast.error('Bulk update failed'),
  });

  const updateColumnsMutation = useMutation({
    mutationFn: (cols: any[]) => jobService.updateRoundColumns(round.id, cols),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job', jobId] }),
  });

  const removeCandidateMutation = useMutation({
    mutationFn: (cid: string) => jobService.removeCandidateFromRound(round.id, cid),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['job', jobId] }); toast.success('Candidate removed'); },
  });

  const handleSaveStatus = (slot: any, result: string, customStatus?: string, newCustomLabel?: string) => {
    updateSlotMutation.mutate({ slotId: slot.id, data: { result } });
    updateCustomFieldMutation.mutate({ slotId: slot.id, fieldName: 'customStatus', value: customStatus ?? null });

    if (newCustomLabel) {
      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
      const selOpts: any[] = round.customColumns?.selectionOptions || [];
      if (!selOpts.find((o: any) => o.label === newCustomLabel)) {
        updateColumnsMutation.mutate([
          ...allColumns,
          { selectionOptions: [...selOpts, { label: newCustomLabel, color: colors[selOpts.length % colors.length] }] },
        ]);
      }
    }
  };

  // Drag-and-drop column reordering
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData('colIdx', String(idx));
  };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    const fromIdx = parseInt(e.dataTransfer.getData('colIdx'));
    if (fromIdx === toIdx) { setDragOverIdx(null); return; }
    const newCols = [...allColumns];
    const [moved] = newCols.splice(fromIdx, 1);
    newCols.splice(toIdx, 0, moved);
    updateColumnsMutation.mutate(newCols);
    setDragOverIdx(null);
  };

  const allSelected = round.slots.length > 0 && round.slots.every((s: any) => selectedSlots.has(s.id));
  const toggleAll = () => {
    if (allSelected) setSelectedSlots(new Set());
    else setSelectedSlots(new Set(round.slots.map((s: any) => s.id)));
  };

  const renderColCell = (col: any, slot: any) => {
    const c = slot.candidate;
    if (col.name === 'phone') return <td key="phone" className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{c?.phone || '—'}</td>;
    if (col.name === 'email') return <td key="email" className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{c?.email || '—'}</td>;
    if (col.name === 'status') return (
      <td key="status" className="px-3 py-2.5">
        <StatusCell slot={slot} round={round}
          onSave={(result, customStatus, newLabel) => handleSaveStatus(slot, result, customStatus, newLabel)} />
      </td>
    );
    if (col.name === 'remark') return (
      <td key="remark" className="px-3 py-2.5">
        <RemarkCell value={slot.remark || ''} onSave={v => updateSlotMutation.mutate({ slotId: slot.id, data: { remark: v } })} />
      </td>
    );
    return (
      <td key={col.name} className="px-3 py-2.5">
        <CustomColCell col={col} slot={slot}
          onSave={(fn, v) => updateCustomFieldMutation.mutate({ slotId: slot.id, fieldName: fn, value: v })} />
      </td>
    );
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
        <button onClick={() => setExpanded(v => !v)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
          {expanded ? <ChevronRight size={16} className="text-slate-500 rotate-90" /> : <ChevronRight size={16} className="text-slate-500" />}
        </button>
        <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-xs flex-shrink-0">
          {round.roundNumber}
        </div>
        {renaming ? (
          <input autoFocus value={roundName} onChange={e => setRoundName(e.target.value)}
            onBlur={() => renameMutation.mutate()}
            onKeyDown={e => { if (e.key === 'Enter') renameMutation.mutate(); if (e.key === 'Escape') { setRoundName(round.roundName); setRenaming(false); } }}
            className="form-input text-sm py-0.5 flex-1 max-w-xs" />
        ) : (
          <span onDoubleClick={() => setRenaming(true)} className="font-semibold text-sm text-slate-900 dark:text-white cursor-text flex-1" title="Double-click to rename">
            {round.roundName}
          </span>
        )}
        <span className="text-xs text-slate-400">{round.slots.length} candidate{round.slots.length !== 1 ? 's' : ''}</span>
        <button onClick={() => setRenaming(true)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          <Pencil size={13} />
        </button>
      </div>

      {expanded && (
        <div className="overflow-x-auto">
          {selectedSlots.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800">
              <span className="text-xs font-medium text-primary-700 dark:text-primary-400">{selectedSlots.size} selected</span>
              <div className="flex items-center gap-1.5">
                {RESULT_OPTIONS.slice(1).map(opt => (
                  <button key={opt.value} onClick={() => bulkMutation.mutate({ result: opt.value })}
                    style={{ backgroundColor: opt.color }}
                    className="px-2.5 py-0.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity">
                    {opt.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setSelectedSlots(new Set())} className="ml-auto text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X size={13} />
              </button>
            </div>
          )}

          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="w-8 px-3 py-2.5">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-3.5 h-3.5 rounded border-slate-300 accent-primary-600" />
                </th>
                <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Candidate</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">ID</th>
                {allColumns.map((col: any, idx: number) => (
                  <th
                    key={col.name}
                    draggable
                    onDragStart={e => handleDragStart(e, idx)}
                    onDragOver={e => handleDragOver(e, idx)}
                    onDrop={e => handleDrop(e, idx)}
                    onDragLeave={() => setDragOverIdx(null)}
                    className={cn(
                      'px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap cursor-grab select-none',
                      dragOverIdx === idx && 'bg-primary-50 dark:bg-primary-900/20',
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {!col.isDefault && (
                        <button onClick={() => updateColumnsMutation.mutate(allColumns.filter((c: any) => c.name !== col.name))}
                          className="text-slate-300 hover:text-red-400 transition-colors"><X size={10} /></button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2.5 w-8">
                  <button ref={addColBtnRef}
                    onClick={() => { if (addColBtnRef.current) setAddColRect(addColBtnRef.current.getBoundingClientRect()); }}
                    className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" title="Add column">
                    <Plus size={13} />
                  </button>
                </th>
                <th className="px-3 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {round.slots.length === 0 ? (
                <tr>
                  <td colSpan={5 + allColumns.length} className="text-center text-sm text-slate-400 py-6">
                    No candidates yet. Click "Add Candidates" below.
                  </td>
                </tr>
              ) : round.slots.map((slot: any) => {
                const c = slot.candidate;
                const isSelected = selectedSlots.has(slot.id);
                return (
                  <tr key={slot.id} className={cn('transition-colors', isSelected ? 'bg-primary-50/60 dark:bg-primary-900/10' : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/20')}>
                    <td className="px-3 py-2.5">
                      <input type="checkbox" checked={isSelected}
                        onChange={() => setSelectedSlots(prev => { const n = new Set(prev); n.has(slot.id) ? n.delete(slot.id) : n.add(slot.id); return n; })}
                        className="w-3.5 h-3.5 rounded border-slate-300 accent-primary-600" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">
                          {c?.firstName?.[0]}{c?.lastName?.[0]}
                        </div>
                        <button
                          onClick={() => navigate(`/cv-database/${c?.id}`)}
                          className="text-xs font-medium text-slate-900 dark:text-white whitespace-nowrap hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                        >
                          {c?.firstName} {c?.lastName}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs text-slate-500 font-mono">CV-{c?.id?.slice(-6)?.toUpperCase()}</span>
                    </td>
                    {allColumns.map((col: any) => renderColCell(col, slot))}
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5">
                      <button onClick={() => removeCandidateMutation.mutate(c?.id)}
                        className="p-1 text-slate-300 hover:text-red-400 rounded transition-colors" title="Remove">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
            <button onClick={() => setAddCandidateOpen(true)} className="btn-secondary text-xs py-1.5">
              <Plus size={13} /> Add Candidates
            </button>
          </div>
        </div>
      )}

      {addColRect && (
        <AddColPopup anchorRect={addColRect} onClose={() => setAddColRect(null)}
          onAdd={col => updateColumnsMutation.mutate([...allColumns, col])} />
      )}

      {addCandidateOpen && (
        <AddCandidatesModal roundId={round.id} existingIds={round.slots.map((s: any) => s.candidateId)}
          onClose={() => setAddCandidateOpen(false)} onRefresh={onRefresh} />
      )}
    </div>
  );
}

// ─── Closure Modal ────────────────────────────────────────────────────────────

function ClosureModal({ job, processGroup = 'main', onClose, onRefresh }: {
  job: any; processGroup?: string; onClose: () => void; onRefresh: () => void;
}) {
  const rounds = ((job.rounds as any[]) || []).filter((r: any) => r.processGroup === processGroup);
  const lastRound = rounds[rounds.length - 1];
  const slots = lastRound?.slots || [];
  const [selected, setSelected] = useState<Set<string>>(
    new Set(slots.filter((s: any) => s.result === 'SELECTED').map((s: any) => s.candidateId))
  );
  const [saving, setSaving] = useState(false);

  const toggle = (cid: string) => setSelected(prev => { const n = new Set(prev); n.has(cid) ? n.delete(cid) : n.add(cid); return n; });

  const handleClose = async () => {
    setSaving(true);
    try {
      await jobService.closeJob(job.id, [...selected], processGroup);
      toast.success(processGroup === 'main' ? 'Job closed successfully' : 'Replacement process closed');
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to close');
    }
    setSaving(false);
  };

  const title = processGroup === 'main' ? 'Close Job Opening' : `Close ${processGroup.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <Lock size={16} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-xs text-slate-500">Select candidates to mark as final hires</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X size={15} /></button>
        </div>

        {slots.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No candidates in the last round</p>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            {slots.map((slot: any) => {
              const c = slot.candidate;
              const isSelected = selected.has(slot.candidateId);
              return (
                <label key={slot.id} className={cn('flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-700/50',
                  'hover:bg-slate-50 dark:hover:bg-slate-700/40', isSelected && 'bg-green-50 dark:bg-green-900/10')}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggle(slot.candidateId)}
                    className="w-4 h-4 rounded border-slate-300 accent-green-600" />
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {c?.firstName?.[0]}{c?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{c?.firstName} {c?.lastName}</p>
                    <p className="text-xs text-slate-400 truncate">{c?.currentDesignation || c?.email}</p>
                  </div>
                  <div style={{ backgroundColor: RESULT_MAP[slot.result]?.color || '#94a3b8' }}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-white whitespace-nowrap">
                    {RESULT_MAP[slot.result]?.label || 'None'}
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-slate-700">
          <span className="text-sm text-slate-500">{selected.size} selected as hired</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary text-sm py-1.5">Cancel</button>
            <button onClick={handleClose} disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              {processGroup === 'main' ? 'Close Job' : 'Close Process'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Post Selection Section ───────────────────────────────────────────────────

function PostSelectionSection({ job, jobId, processGroup = 'main', onRefresh }: {
  job: any; jobId: string; processGroup?: string; onRefresh: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission, user } = useAuthStore();
  const canInvoice = user?.isSuperAdmin || hasPermission('invoices', 'create');

  const [collapsed, setCollapsed] = useState(false);
  const [addColRect, setAddColRect] = useState<DOMRect | null>(null);
  const addColBtnRef = useRef<HTMLButtonElement>(null);

  const psrColumns: any[] = (job.customFields as any)?.psrColumns || [];
  const records: any[] = (job.postSelectionRecords || []).filter((r: any) => r.processGroup === processGroup);

  const updateRecordMutation = useMutation({
    mutationFn: ({ recordId, data }: { recordId: string; data: any }) =>
      jobService.updatePostSelectionRecord(recordId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job', jobId] }),
    onError: () => toast.error('Failed to update'),
  });

  const uploadLetterMutation = useMutation({
    mutationFn: ({ recordId, file }: { recordId: string; file: File }) =>
      jobService.uploadOfferLetter(recordId, file),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['job', jobId] }); toast.success('Offer letter uploaded'); },
    onError: () => toast.error('Upload failed'),
  });

  const updateColumnsMutation = useMutation({
    mutationFn: (cols: any[]) => jobService.updatePSRColumns(jobId, cols),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job', jobId] }),
  });

  if (records.length === 0) return null;

  const sectionTitle = processGroup === 'main'
    ? 'Post Selection Process'
    : `Post Selection — ${processGroup.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}`;

  return (
    <div className="card border-emerald-200 dark:border-emerald-800">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Check size={15} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">{sectionTitle}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{records.length} selected candidate{records.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => setCollapsed(v => !v)}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500">
          {collapsed ? <ChevronDown size={16} /> : <ChevronRight size={16} className="rotate-90" />}
        </button>
      </div>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">Candidate</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">ID</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">Phone</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">Email</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">Status</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">CTC Offered</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">Offer Letter</th>
                {psrColumns.map((col: any) => (
                  <th key={col.name} className="px-3 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      <button onClick={() => updateColumnsMutation.mutate(psrColumns.filter((c: any) => c.name !== col.name))}
                        className="text-slate-300 hover:text-red-400"><X size={10} /></button>
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2.5 w-8">
                  <button ref={addColBtnRef}
                    onClick={() => { if (addColBtnRef.current) setAddColRect(addColBtnRef.current.getBoundingClientRect()); }}
                    className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors">
                    <Plus size={13} />
                  </button>
                </th>
                {canInvoice && <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">Invoice</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {records.map((record: any) => {
                const c = record.candidate;
                const letters: any[] = record.offerLetters || [];
                return (
                  <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                          {c?.firstName?.[0]}{c?.lastName?.[0]}
                        </div>
                        <button
                          onClick={() => navigate(`/cv-database/${c?.id}`)}
                          className="text-xs font-medium text-slate-900 dark:text-white hover:text-primary-600 hover:underline whitespace-nowrap"
                        >
                          {c?.firstName} {c?.lastName}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs text-slate-500 font-mono">CV-{c?.id?.slice(-6)?.toUpperCase()}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{c?.phone || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{c?.email || '—'}</td>
                    <td className="px-3 py-2.5">
                      <PSRStatusCell record={record}
                        onSave={status => updateRecordMutation.mutate({ recordId: record.id, data: { status } })} />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        defaultValue={record.ctcOffered || ''}
                        placeholder="—"
                        className="text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-0.5 bg-white dark:bg-slate-800 w-24"
                        onBlur={e => updateRecordMutation.mutate({ recordId: record.id, data: { ctcOffered: e.target.value } })}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {letters.map((l: any, i: number) => (
                          <a key={i} href={`/${l.path}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[10px] rounded-full hover:bg-blue-100">
                            <FileText size={9} /> {l.name}
                            <ExternalLink size={8} />
                          </a>
                        ))}
                        <label className="flex items-center gap-1 px-2 py-0.5 border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 text-[10px] rounded-full cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-colors">
                          <Upload size={9} /> Add
                          <input type="file" className="hidden" accept=".pdf,.doc,.docx"
                            onChange={e => { if (e.target.files?.[0]) uploadLetterMutation.mutate({ recordId: record.id, file: e.target.files[0] }); }} />
                        </label>
                      </div>
                    </td>
                    {psrColumns.map((col: any) => (
                      <td key={col.name} className="px-3 py-2.5">
                        <CustomColCell col={col} slot={{ customFields: record.customFields }}
                          onSave={(fn, v) => {
                            const cf = { ...(record.customFields || {}), [fn]: v };
                            updateRecordMutation.mutate({ recordId: record.id, data: { customFields: cf } });
                          }} />
                      </td>
                    ))}
                    <td className="px-3 py-2.5" />
                    {canInvoice && (
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => {
                            const params = new URLSearchParams({
                              clientId: job.clientId || '',
                              jobTitle: job.jobTitle || '',
                              candidateName: `${c?.firstName || ''} ${c?.lastName || ''}`.trim(),
                              ctcOffered: String(record.ctcOffered || ''),
                            });
                            navigate(`/invoices/generate?${params.toString()}`);
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs rounded-lg hover:bg-primary-100 transition-colors whitespace-nowrap">
                          <FileText size={11} /> Generate Invoice
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {addColRect && (
        <AddColPopup anchorRect={addColRect} onClose={() => setAddColRect(null)}
          onAdd={col => updateColumnsMutation.mutate([...psrColumns, col])} />
      )}
    </div>
  );
}

// ─── Interview Process Group ──────────────────────────────────────────────────

function InterviewProcessGroup({ job, jobId, processGroup = 'main', label, onRefresh }: {
  job: any; jobId: string; processGroup?: string; label: string; onRefresh: () => void;
}) {
  const queryClient = useQueryClient();
  const rounds = ((job.rounds as any[]) || []).filter((r: any) => r.processGroup === processGroup);
  const cf = (job.customFields as any) || {};
  const closedGroups = cf.closedGroups || {};
  const isGroupClosed = !!closedGroups[processGroup];
  const [collapsed, setCollapsed] = useState(isGroupClosed);
  const [closureOpen, setClosureOpen] = useState(false);
  const [closureGroup, setClosureGroup] = useState<string>('main');

  const addRoundMutation = useMutation({
    mutationFn: () => jobService.addRound(jobId, { processGroup }),
    onSuccess: () => { toast.success('Round added'); onRefresh(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Cannot add round — ensure all candidates in the previous round have a status'),
  });

  // Stats
  const allCandidateIds = new Set(rounds.flatMap((r: any) => (r.slots || []).map((s: any) => s.candidateId)));
  const latestRound = rounds[rounds.length - 1];
  const inProcessIds = new Set((latestRound?.slots || []).filter((s: any) => s.result !== 'REJECTED').map((s: any) => s.candidateId));
  const selectedCount = isGroupClosed
    ? (closedGroups[processGroup]?.candidateIds?.length ?? (processGroup === 'main' ? cf.closedCandidateIds?.length : 0) ?? 0)
    : null;

  const statLabel = processGroup === 'main' ? '' : processGroup.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' ';

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <button onClick={() => setCollapsed(v => !v)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
              {collapsed ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500 rotate-90" />}
            </button>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">{label}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {rounds.length} round{rounds.length !== 1 ? 's' : ''} · {allCandidateIds.size} candidates total
              </p>
            </div>
          </div>

          {/* Stats chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {statLabel}Total: <strong>{allCandidateIds.size}</strong>
            </span>
            <span className="text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
              In Process: <strong>{inProcessIds.size}</strong>
            </span>
            {selectedCount !== null && (
              <span className="text-xs px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                Selected: <strong>{selectedCount}</strong>
              </span>
            )}

            {!isGroupClosed ? (
              <button onClick={() => { setClosureGroup(processGroup); setClosureOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors">
                <Lock size={13} /> Close {processGroup === 'main' ? 'Job' : 'Process'}
              </button>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                <Lock size={13} /> Closed · {selectedCount} hired
              </span>
            )}
          </div>
        </div>

        {!collapsed && (
          <div className="p-5 space-y-5">
            {processGroup === 'main' && (
              <AssignedEmployeesBar jobId={jobId} assignees={job.assignees || []} onRefresh={onRefresh} />
            )}

            {rounds.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm text-slate-400 mb-4">No interview rounds yet</p>
                {!isGroupClosed && (
                  <button onClick={() => addRoundMutation.mutate()} disabled={addRoundMutation.isPending} className="btn-primary text-sm">
                    {addRoundMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Add First Round
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {rounds.map((round: any, i: number) => (
                  <RoundPanel key={round.id} round={round} jobId={jobId} isFirst={i === 0} processGroup={processGroup} onRefresh={onRefresh} />
                ))}
              </div>
            )}

            {!isGroupClosed && rounds.length > 0 && (
              <div className="flex items-center justify-between pt-2">
                <button onClick={() => addRoundMutation.mutate()} disabled={addRoundMutation.isPending} className="btn-secondary text-sm">
                  {addRoundMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Add Round
                </button>
                <p className="text-xs text-slate-400">All candidates in previous round must have a status</p>
              </div>
            )}
          </div>
        )}
      </div>

      {closureOpen && (
        <ClosureModal
          job={job}
          processGroup={closureGroup}
          onClose={() => setClosureOpen(false)}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
}

// ─── Shared Job Detail Content ────────────────────────────────────────────────

export interface JobDetailContentProps {
  data: any;
  jobId: string;
  onRefresh: () => void;
  compact?: boolean;
}

export default function JobDetailContent({ data, jobId, onRefresh, compact = false }: JobDetailContentProps) {
  const queryClient = useQueryClient();

  const startReplacementMutation = useMutation({
    mutationFn: () => jobService.startReplacement(jobId),
    onSuccess: () => { toast.success('Replacement process started'); onRefresh(); },
    onError: () => toast.error('Failed to start replacement'),
  });

  const isClosed = data.status === 'CLOSED';
  const cf = (data.customFields as any) || {};
  const replacements: any[] = cf.replacements || [];
  const closedGroups = cf.closedGroups || {};

  // Stats computed from rounds
  const mainRounds = ((data.rounds as any[]) || []).filter((r: any) => r.processGroup === 'main');
  const allMainCandidateIds = new Set(mainRounds.flatMap((r: any) => (r.slots || []).map((s: any) => s.candidateId)));
  const latestMainRound = mainRounds[mainRounds.length - 1];
  const mainInProcess = new Set((latestMainRound?.slots || []).filter((s: any) => s.result !== 'REJECTED').map((s: any) => s.candidateId));
  const mainSelectedCount = isClosed ? (closedGroups['main']?.candidateIds?.length ?? cf.closedCandidateIds?.length ?? 0) : null;

  // Post-selection records exist?
  const anyGroupClosed = isClosed || replacements.some((r: any) => r.status === 'closed');
  const psrRecords: any[] = data.postSelectionRecords || [];

  // Last replacement active?
  const lastReplacement = replacements[replacements.length - 1];
  const canStartReplacement = isClosed && (!lastReplacement || lastReplacement.status === 'closed');

  return (
    <div className="space-y-5">
      {/* ── Overview ──────────────────────────────────────────────────────── */}
      <div className={cn('grid gap-5', compact ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-3')}>
        <div className={cn('space-y-5', !compact && 'xl:col-span-2')}>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className={cn('badge', getStatusColor(data.status))}>{data.status}</span>
              <span className={cn('badge', getPriorityColor(data.priority))}>{data.priority}</span>
              {data.jobType && <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{data.jobType.replace('_', ' ')}</span>}
            </div>

            {data.description && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</h3>
                <p className={cn('text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap', compact && 'line-clamp-4')}>{data.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.workLocation && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <MapPin size={13} className="text-slate-400 flex-shrink-0" />{data.workLocation}
                  {data.workMode && <span className="text-xs text-slate-400">({data.workMode})</span>}
                </div>
              )}
              {(data.experienceMin !== undefined || data.experienceMax !== undefined) && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Briefcase size={13} className="text-slate-400 flex-shrink-0" />{data.experienceMin ?? 0}–{data.experienceMax ?? '?'} yrs
                </div>
              )}
              {data.numberOfOpenings && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Users size={13} className="text-slate-400 flex-shrink-0" />{data.numberOfOpenings} opening{data.numberOfOpenings !== 1 ? 's' : ''}
                </div>
              )}
              {data.closingDate && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Clock size={13} className="text-slate-400 flex-shrink-0" />Closes {formatDate(data.closingDate)}
                </div>
              )}
              {(data.salaryMin || data.salaryMax) && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <DollarSign size={13} className="text-slate-400 flex-shrink-0" />
                  {data.salaryMin ? `₹${Number(data.salaryMin).toLocaleString()}` : '?'} – {data.salaryMax ? `₹${Number(data.salaryMax).toLocaleString()}` : '?'}
                </div>
              )}
            </div>

            {((data.requiredSkills as string[] | null | undefined) || []).length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">REQUIRED SKILLS</p>
                <div className="flex flex-wrap gap-1.5">
                  {(data.requiredSkills as string[]).map((s: string) => (
                    <span key={s} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-lg font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar stats — only in full view */}
        {!compact && (
          <div className="space-y-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-slate-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Candidates</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Total Candidates</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{allMainCandidateIds.size}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">In Process</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{mainInProcess.size}</span>
                </div>
                {mainSelectedCount !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Selected</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">{mainSelectedCount}</span>
                  </div>
                )}
              </div>
            </div>
            {isClosed && (
              <div className="card p-4 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
                <div className="flex items-center gap-2 mb-1">
                  <Lock size={14} className="text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-green-800 dark:text-green-400 text-sm">Job Closed</h3>
                </div>
                <p className="text-xs text-green-700 dark:text-green-500">{mainSelectedCount ?? 0} candidate(s) hired</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Post Selection Process (above Interview Process, visible when closed) ── */}
      {anyGroupClosed && psrRecords.length > 0 && (
        <div className="space-y-4">
          {/* Main process PSR */}
          {isClosed && <PostSelectionSection job={data} jobId={jobId} processGroup="main" onRefresh={onRefresh} />}
          {/* Replacement PSR sections */}
          {replacements.filter((r: any) => r.status === 'closed').map((r: any) => (
            <PostSelectionSection key={r.id} job={data} jobId={jobId} processGroup={r.id} onRefresh={onRefresh} />
          ))}
        </div>
      )}

      {/* ── Main Interview Process ─────────────────────────────────────────── */}
      <InterviewProcessGroup
        job={data}
        jobId={jobId}
        processGroup="main"
        label="Interview Process"
        onRefresh={onRefresh}
      />

      {/* ── Replacement Process Sections ───────────────────────────────────── */}
      {replacements.map((rep: any) => (
        <InterviewProcessGroup
          key={rep.id}
          job={data}
          jobId={jobId}
          processGroup={rep.id}
          label={`${rep.name} Interview Process`}
          onRefresh={onRefresh}
        />
      ))}

      {/* ── Start Replacement Button ────────────────────────────────────────── */}
      {canStartReplacement && (
        <div className="card p-5 border-dashed">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {replacements.length === 0 ? 'Start Replacement' : `Start Replacement ${replacements.length + 1}`}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Begin a new interview process for replacement hiring</p>
            </div>
            <button
              onClick={() => startReplacementMutation.mutate()}
              disabled={startReplacementMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {startReplacementMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Start Replacement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
