import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Trash2, ChevronUp, ChevronDown, Plus, X, Calendar,
  MapPin, FileText, AlignLeft, Tag, Star, Hash, ToggleLeft,
  Link, Mail, Phone, ChevronRight, Check, Loader2, Pencil,
  SlidersHorizontal, GripVertical, ChevronLeft, Copy, AlertTriangle,
  Layers, Download, Users, UserCheck, ExternalLink, Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { settingsService } from '../../services/settingsService';
import { ColumnDefinition, ColumnDataType } from '../../types';
import { cn, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FixedColumn {
  key: string;
  label: string;
  width?: number;
  sortable?: boolean;
  render: (row: any) => React.ReactNode;
  csvValue?: (row: any) => string;
}

export interface ActionButton {
  icon?: React.ReactNode;
  label: string;
  onClick: (row: any) => void;
  className?: string | ((row: any) => string);
  show?: (row: any) => boolean;
  render?: (row: any) => React.ReactNode;
}

interface DynamicTableProps {
  module: string;
  entityApiPath: string;
  data: any[];
  isLoading?: boolean;
  fixedColumns: FixedColumn[];
  actionButtons: ActionButton[];
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (field: string, dir: 'asc' | 'desc') => void;
  extraFilters?: React.ReactNode;
  onCustomFiltersChange?: (customFilters: Record<string, string>) => void;
  queryKey: string[];
  excludeColumnNames?: string[];
  onBulkDelete?: (ids: string[]) => void;
  onRowExpand?: (row: any) => void;
  expandedRowId?: string | null;
  onSelectionChange?: (ids: string[]) => void;
}

// ─── Column type config ───────────────────────────────────────────────────────

const COLUMN_TYPE_DEFS: { type: ColumnDataType; icon: React.ReactNode }[] = [
  { type: 'STATUS',     icon: <ToggleLeft size={16} />  },
  { type: 'DROPDOWN',   icon: <ChevronRight size={16} /> },
  { type: 'TEXT',       icon: <AlignLeft size={16} />   },
  { type: 'DATE',       icon: <Calendar size={16} />    },
  { type: 'LOCATION',   icon: <MapPin size={16} />      },
  { type: 'FILES',      icon: <FileText size={16} />    },
  { type: 'PRIORITY',   icon: <Star size={16} />        },
  { type: 'LABEL',      icon: <Tag size={16} />         },
  { type: 'NUMBER',     icon: <Hash size={16} />        },
  { type: 'URL',        icon: <Link size={16} />        },
  { type: 'EMAIL',      icon: <Mail size={16} />        },
  { type: 'PHONE',      icon: <Phone size={16} />       },
  { type: 'CANDIDATES', icon: <Users size={16} />       },
  { type: 'EMPLOYEE',   icon: <UserCheck size={16} />   },
];

// ─── Color palettes ───────────────────────────────────────────────────────────

// Default colors per option index (hex for inline styles)
const OPTION_COLORS = [
  '#64748b', '#f59e0b', '#f87171', '#10b981',
  '#3b82f6', '#a855f7', '#fb923c', '#f472b6',
  '#14b8a6', '#6366f1',
];

// Color picker palette
const COLOR_PICKER_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#64748b', '#334155',
];

// ─── Add Column Popup ─────────────────────────────────────────────────────────

interface AddColumnPopupProps {
  module: string;
  insertAfterOrder: number;
  anchorRect: DOMRect;
  onClose: () => void;
  onCreated: () => void;
}

function AddColumnPopup({ module, insertAfterOrder, anchorRect, onClose, onCreated }: AddColumnPopupProps) {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<ColumnDataType | null>(null);
  const [dropdownOptions, setDropdownOptions] = useState<string[]>(['']);
  const popupRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(anchorRect.bottom + 8, window.innerHeight - 380),
    left: Math.min(anchorRect.left - 100, window.innerWidth - 320),
    zIndex: 9999,
    width: 300,
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 100);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const createMutation = useMutation({
    mutationFn: (data: any) => settingsService.createColumn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', module] });
      toast.success('Column added');
      onCreated();
      onClose();
    },
    onError: () => toast.error('Failed to add column'),
  });

  const handleSave = () => {
    if (!name.trim()) { toast.error('Column name is required'); return; }
    if (!selectedType) { toast.error('Select a column type'); return; }
    const slug = name.trim().toLowerCase().replace(/\s+/g, '_');
    const config = ['DROPDOWN', 'LABEL'].includes(selectedType)
      ? { options: dropdownOptions.filter(Boolean) }
      : undefined;
    createMutation.mutate({
      module, name: slug, label: name.trim(), dataType: selectedType,
      order: insertAfterOrder + 1, isVisible: true, isSortable: true,
      isFilterable: true, isEditable: true, config,
    });
  };

  return (
    <div ref={popupRef} style={style} className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <span className="text-sm font-semibold text-slate-900 dark:text-white">{t('common.addColumn')}</span>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md">
          <X size={14} className="text-slate-500" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">{t('common.columnName')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Department" className="form-input w-full text-sm" autoFocus />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">{t('common.columnType')}</label>
          <div className="grid grid-cols-3 gap-1.5">
            {COLUMN_TYPE_DEFS.map((colType) => (
              <button key={colType.type} onClick={() => setSelectedType(colType.type)}
                className={cn('flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all',
                  selectedType === colType.type
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400'
                )}>
                {colType.icon}
                {t(`columnTypes.${colType.type}`)}
              </button>
            ))}
          </div>
        </div>
        {selectedType && ['DROPDOWN', 'LABEL'].includes(selectedType) && (
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">{t('common.options')}</label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {dropdownOptions.map((opt, i) => (
                <div key={i} className="flex gap-1.5">
                  <input value={opt} onChange={(e) => { const next = [...dropdownOptions]; next[i] = e.target.value; setDropdownOptions(next); }}
                    placeholder={`Option ${i + 1}`} className="form-input flex-1 text-xs py-1" />
                  {dropdownOptions.length > 1 && (
                    <button onClick={() => setDropdownOptions(dropdownOptions.filter((_, j) => j !== i))} className="p-1 text-red-400 hover:text-red-600"><X size={12} /></button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setDropdownOptions([...dropdownOptions, ''])} className="mt-1.5 text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
              <Plus size={12} /> {t('common.addOption')}
            </button>
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1 text-xs py-1.5">{t('common.cancel')}</button>
          <button onClick={handleSave} disabled={createMutation.isPending} className="btn-primary flex-1 text-xs py-1.5 justify-center">
            {createMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Linked record cell (Candidate / Employee) ───────────────────────────────

function LinkedRecordCell({
  col, row, entityApiPath, queryKey, linkedType, selectedIds, onBulkSave,
}: {
  col: ColumnDefinition; row: any; entityApiPath: string; queryKey: string[];
  linkedType: 'CANDIDATES' | 'EMPLOYEE';
  selectedIds?: Set<string>; onBulkSave?: (colName: string, val: any, ids: string[]) => void;
}) {
  const navigate = useNavigate();
  const isMulti = col.config?.selectionMode === 'multi';
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; sub: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const queryClient = useQueryClient();

  // Parse stored value — always normalise to array internally
  const storedItems: { id: string; name: string }[] = (() => {
    const raw = row.customFields?.[col.name];
    if (!raw) return [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) return parsed;
      if (parsed?.id) return [parsed];
      return [];
    } catch { return []; }
  })();

  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setEditing(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const endpoint = linkedType === 'CANDIDATES' ? '/cv' : '/employees';
        const res = await api.get(endpoint, { params: { search, limit: 10 } });
        const items = res.data?.data || [];
        setResults(
          items.map((p: any) => ({
            id: p.id,
            name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
            sub: linkedType === 'CANDIDATES'
              ? (p.currentDesignation || p.currentCompany || '')
              : (p.designation || p.department || ''),
          }))
        );
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, editing, linkedType]);

  const saveMutation = useMutation({
    mutationFn: (val: any) =>
      api.patch(`${entityApiPath}/${row.id}/custom-fields`, { fieldName: col.name, value: val }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error('Failed to save'),
  });

  const save = (val: any) => {
    saveMutation.mutate(val);
    if (selectedIds && selectedIds.has(row.id) && selectedIds.size > 1 && onBulkSave) {
      onBulkSave(col.name, val, [...selectedIds].filter(id => id !== row.id));
    }
  };

  const handleSelect = (item: { id: string; name: string }) => {
    if (isMulti) {
      const already = storedItems.some(s => s.id === item.id);
      if (!already) save([...storedItems, { id: item.id, name: item.name }]);
      // keep picker open in multi mode
    } else {
      setEditing(false);
      save({ id: item.id, name: item.name });
    }
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isMulti) {
      const next = storedItems.filter(s => s.id !== id);
      save(next.length ? next : null);
    } else {
      save(null);
    }
  };

  const openPanel = (ref: React.RefObject<HTMLElement | null>) => {
    if (!col.isEditable) return;
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPanelPos({ top: rect.bottom + 6, left: rect.left });
    }
    setSearch('');
    setEditing(true);
  };

  const Icon = linkedType === 'CANDIDATES' ? Users : UserCheck;
  const label = linkedType === 'CANDIDATES' ? 'candidate' : 'employee';

  return (
    <div className="inline-flex flex-wrap gap-1 max-w-full items-center">
      {/* Chips for each linked item */}
      {storedItems.map((item) => (
        <div key={item.id} className="flex items-center gap-1 group/chip">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium max-w-[110px]">
            <Icon size={10} className="flex-shrink-0" />
            <span className="truncate">{item.name}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(linkedType === 'CANDIDATES' ? `/cv-database` : `/employees/${item.id}`); }}
            className="p-0.5 text-slate-300 hover:text-indigo-500 opacity-0 group-hover/chip:opacity-100 transition-all"
            title="Open record"
          >
            <ExternalLink size={9} />
          </button>
          <button
            onClick={(e) => handleRemove(e, item.id)}
            className="p-0.5 text-slate-300 hover:text-red-400 opacity-0 group-hover/chip:opacity-100 transition-all"
            title="Remove"
          >
            <X size={9} />
          </button>
        </div>
      ))}

      {/* Add button — always show in multi, show when empty in single */}
      {(isMulti || storedItems.length === 0) && (
        <button
          ref={addBtnRef}
          onClick={() => openPanel(addBtnRef)}
          className="text-xs text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
        >
          {storedItems.length === 0
            ? <><Icon size={12} /><span>Link {label}</span></>
            : <><Plus size={11} /><span className="sr-only">Add</span></>
          }
        </button>
      )}

      {/* Search picker panel */}
      {editing && panelPos && (
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: Math.min(panelPos.top, window.innerHeight - 300), left: Math.min(panelPos.left, window.innerWidth - 240), zIndex: 9999, width: 232 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-2 py-1.5">
              <Search size={12} className="text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${label}s…`}
                className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-400"
              />
              {loading && <Loader2 size={11} className="animate-spin text-slate-400 flex-shrink-0" />}
            </div>
          </div>
          {/* Selected chips in multi mode */}
          {isMulti && storedItems.length > 0 && (
            <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-700">
              {storedItems.map((item) => (
                <span key={item.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium">
                  {item.name}
                  <button onClick={(e) => handleRemove(e, item.id)} className="hover:text-red-400 transition-colors"><X size={9} /></button>
                </span>
              ))}
            </div>
          )}
          <div className="max-h-48 overflow-y-auto py-1">
            {results.length === 0 && !loading && (
              <p className="text-xs text-slate-400 text-center py-4">
                {search ? 'No results found' : 'Type to search…'}
              </p>
            )}
            {results.map((item) => {
              const alreadySelected = storedItems.some(s => s.id === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  disabled={alreadySelected}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-left',
                    alreadySelected
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {item.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                    {item.sub && <p className="text-[10px] text-slate-400 truncate">{item.sub}</p>}
                  </div>
                  {alreadySelected && <Check size={11} className="text-indigo-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
          {isMulti && (
            <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-700">
              <button onClick={() => setEditing(false)} className="btn-primary w-full text-xs py-1.5 justify-center">Done</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Cell renderer ────────────────────────────────────────────────────────────

function CustomCell({
  col, row, entityApiPath, queryKey, selectedIds, onBulkSave,
}: {
  col: ColumnDefinition; row: any; entityApiPath: string; queryKey: string[];
  selectedIds?: Set<string>; onBulkSave?: (colName: string, val: any, ids: string[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<any>(() => {
    const cf = row.customFields as Record<string, any> | null;
    return cf?.[col.name] ?? '';
  });
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  // dropdown mode: 'select' = pick a value, 'edit' = manage labels
  const [dropdownMode, setDropdownMode] = useState<'select' | 'edit'>('select');
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editColors, setEditColors] = useState<string[]>([]);
  const [colorPickerIdx, setColorPickerIdx] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();

  // Close dropdown on outside click
  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setEditing(false);
        setColorPickerIdx(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [editing]);

  const saveMutation = useMutation({
    mutationFn: (val: any) =>
      api.patch(`${entityApiPath}/${row.id}/custom-fields`, { fieldName: col.name, value: val }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error('Failed to save'),
  });

  const saveLabelsMutation = useMutation({
    mutationFn: () => settingsService.updateColumn(col.id, {
      config: { options: editOptions.filter(Boolean), optionColors: editColors },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', col.module] });
      toast.success('Labels updated');
      setDropdownMode('select');
    },
    onError: () => toast.error('Failed to update labels'),
  });

  const handleSave = (val: any) => {
    setValue(val);
    setEditing(false);
    saveMutation.mutate(val);
    // If this row is selected, propagate to all other selected rows
    if (selectedIds && selectedIds.has(row.id) && selectedIds.size > 1 && onBulkSave) {
      const otherIds = [...selectedIds].filter(id => id !== row.id);
      onBulkSave(col.name, val, otherIds);
    }
  };

  const displayValue = row.customFields?.[col.name] ?? '';

  // ── STATUS / DROPDOWN / LABEL ──────────────────────────────────────────────
  if (col.dataType === 'STATUS' || col.dataType === 'DROPDOWN' || col.dataType === 'LABEL') {
    const options: string[] = col.config?.options || [];
    const savedColors: string[] = col.config?.optionColors || [];
    const getColor = (idx: number) => savedColors[idx] || OPTION_COLORS[idx % OPTION_COLORS.length];

    const valueIdx = options.indexOf(displayValue);
    const triggerBg = valueIdx >= 0 ? getColor(valueIdx) : null;

    const openDropdown = () => {
      if (!col.isEditable) return;
      if (!editing && triggerBtnRef.current) {
        const rect = triggerBtnRef.current.getBoundingClientRect();
        setPanelPos({ top: rect.bottom + 6, left: rect.left });
      }
      setDropdownMode('select');
      setEditing((v) => !v);
    };

    const enterEditMode = () => {
      setEditOptions([...options]);
      setEditColors([...savedColors]);
      setColorPickerIdx(null);
      setDropdownMode('edit');
    };

    const handleDrop = (toIdx: number) => {
      if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setDragOverIdx(null); return; }
      const nextOpts = [...editOptions];
      const nextCols = [...editColors];
      const [movedOpt] = nextOpts.splice(dragIdx, 1);
      const [movedCol] = nextCols.splice(dragIdx, 1);
      nextOpts.splice(toIdx, 0, movedOpt);
      nextCols.splice(toIdx, 0, movedCol);
      setEditOptions(nextOpts);
      setEditColors(nextCols);
      setDragIdx(null);
      setDragOverIdx(null);
    };

    const setEditColor = (idx: number, color: string) => {
      const next = [...editColors];
      while (next.length <= idx) next.push(OPTION_COLORS[next.length % OPTION_COLORS.length]);
      next[idx] = color;
      setEditColors(next);
    };

    return (
      <div ref={dropdownRef} className="inline-block">
        {/* Trigger badge */}
        <button
          ref={triggerBtnRef}
          onClick={openDropdown}
          style={triggerBg ? { backgroundColor: triggerBg } : undefined}
          className={cn(
            'px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-all',
            triggerBg
              ? `text-white ${editing ? 'ring-2 ring-offset-1 ring-white/50' : 'hover:opacity-90'}`
              : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600',
          )}
        >
          {displayValue || '—'}
        </button>

        {/* Unified panel — stays at same position in both modes */}
        {editing && panelPos && (
          <div
            style={{ position: 'fixed', top: panelPos.top, left: panelPos.left, zIndex: 9999, minWidth: 192 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {dropdownMode === 'select' ? (
              /* ── SELECT MODE ────────────────────────────── */
              <>
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Select</span>
                  <button
                    onClick={enterEditMode}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <Pencil size={10} /> Edit
                  </button>
                </div>
                <div className="py-1.5 max-h-56 overflow-y-auto">
                  {options.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-4 px-3">
                      No options. Click <strong>Edit</strong> to add.
                    </p>
                  ) : (
                    options.map((opt, idx) => {
                      const color = getColor(idx);
                      const isSelected = displayValue === opt;
                      return (
                        <div key={opt} className="px-2 py-0.5">
                          <button
                            onClick={() => handleSave(opt)}
                            style={{ backgroundColor: color }}
                            className={cn(
                              'w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-white text-center transition-all',
                              isSelected ? 'ring-2 ring-white/50' : 'opacity-80 hover:opacity-100'
                            )}
                          >
                            {opt}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              /* ── EDIT MODE ──────────────────────────────── */
              <>
                <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => { setDropdownMode('select'); setColorPickerIdx(null); }}
                    className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="text-xs font-semibold text-slate-800 dark:text-white flex-1">Edit Labels</span>
                </div>

                <div className="py-1 max-h-52 overflow-y-auto">
                  {editOptions.map((opt, idx) => {
                    const color = editColors[idx] || OPTION_COLORS[idx % OPTION_COLORS.length];
                    return (
                      <div
                        key={idx}
                        draggable
                        onDragStart={() => setDragIdx(idx)}
                        onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
                        onDrop={() => handleDrop(idx)}
                        onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                        className={cn(
                          'flex items-center gap-1.5 mx-1.5 px-1.5 py-1.5 rounded-lg border transition-all cursor-grab active:cursor-grabbing',
                          dragOverIdx === idx && dragIdx !== idx
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-dashed border-primary-400 dark:border-primary-600'
                            : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60',
                          dragIdx === idx ? 'opacity-40' : '',
                        )}
                      >
                        <GripVertical size={11} className="text-slate-300 dark:text-slate-500 flex-shrink-0" />

                        {/* Color dot + picker */}
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setColorPickerIdx(colorPickerIdx === idx ? null : idx); }}
                            style={{ backgroundColor: color }}
                            className="w-3.5 h-3.5 rounded-sm cursor-pointer hover:scale-110 transition-transform ring-offset-1 ring-white"
                          />
                          {colorPickerIdx === idx && (
                            <div
                              className="absolute left-full top-0 ml-2 p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700"
                              style={{ zIndex: 10000, width: 120 }}
                            >
                              <div className="grid grid-cols-4 gap-1">
                                {COLOR_PICKER_PALETTE.map((c) => (
                                  <button
                                    key={c}
                                    onClick={(e) => { e.stopPropagation(); setEditColor(idx, c); setColorPickerIdx(null); }}
                                    style={{ backgroundColor: c }}
                                    className={cn(
                                      'w-6 h-6 rounded-md hover:scale-110 transition-transform',
                                      (editColors[idx] || '') === c && 'ring-2 ring-white ring-offset-1 ring-offset-slate-800'
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Label input */}
                        <input
                          value={opt}
                          onChange={(e) => { const n = [...editOptions]; n[idx] = e.target.value; setEditOptions(n); }}
                          className="flex-1 text-xs bg-transparent text-slate-800 dark:text-slate-200 outline-none min-w-0 placeholder:text-slate-300"
                          placeholder="Label name"
                        />

                        {/* Delete */}
                        <button
                          onClick={() => { setEditOptions(editOptions.filter((_, i) => i !== idx)); setEditColors(editColors.filter((_, i) => i !== idx)); }}
                          className="flex-shrink-0 p-0.5 text-slate-300 dark:text-slate-500 hover:text-red-400 rounded transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                  {editOptions.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-3">No labels yet</p>
                  )}
                </div>

                {/* New label */}
                <div className="px-1.5 pb-1">
                  <button
                    onClick={() => setEditOptions([...editOptions, ''])}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                  >
                    <Plus size={11} /> New label
                  </button>
                </div>

                {/* Apply */}
                <div className="px-2.5 py-2 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => saveLabelsMutation.mutate()}
                    disabled={saveLabelsMutation.isPending}
                    className="btn-primary w-full text-xs py-1.5 justify-center gap-1.5"
                  >
                    {saveLabelsMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                    Apply
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── DATE ───────────────────────────────────────────────────────────────────
  if (col.dataType === 'DATE') {
    if (editing) {
      return (
        <input type="date" autoFocus value={value} onChange={(e) => setValue(e.target.value)}
          onBlur={(e) => handleSave(e.target.value)} className="form-input text-xs py-1 w-full" />
      );
    }
    return (
      <div onClick={() => col.isEditable && setEditing(true)} className="cursor-pointer text-xs text-slate-600 dark:text-slate-300">
        {displayValue ? formatDate(displayValue) : <span className="text-slate-300 dark:text-slate-600">—</span>}
      </div>
    );
  }

  // ── PRIORITY ───────────────────────────────────────────────────────────────
  if (col.dataType === 'PRIORITY') {
    const levels = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const colors: Record<string, string> = {
      LOW: 'bg-slate-100 text-slate-600', MEDIUM: 'bg-yellow-100 text-yellow-700',
      HIGH: 'bg-orange-100 text-orange-700', URGENT: 'bg-red-100 text-red-700',
    };
    if (editing) {
      return (
        <select autoFocus value={value} onChange={(e) => handleSave(e.target.value)} onBlur={() => setEditing(false)} className="form-input text-xs py-1 w-full">
          <option value="">—</option>
          {levels.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      );
    }
    return (
      <div onClick={() => col.isEditable && setEditing(true)} className="cursor-pointer">
        {displayValue
          ? <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', colors[displayValue] || 'bg-slate-100 text-slate-600')}>{displayValue}</span>
          : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
      </div>
    );
  }

  // ── FILES ──────────────────────────────────────────────────────────────────
  if (col.dataType === 'FILES') {
    const files: { name: string; path: string; size: number }[] = (() => {
      try { return JSON.parse(displayValue || '[]'); } catch { return []; }
    })();
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files;
      if (!selected || !selected.length) return;
      setUploading(true);
      try {
        const fd = new FormData();
        Array.from(selected).forEach((f) => fd.append('files', f));
        const res = await api.post('/settings/upload-custom-files', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        const uploaded: { name: string; path: string; size: number }[] = res.data.data;
        const next = [...files, ...uploaded];
        handleSave(JSON.stringify(next));
      } catch { toast.error('Upload failed'); }
      finally { setUploading(false); }
      e.target.value = '';
    };

    const removeFile = (idx: number) => {
      const next = files.filter((_, i) => i !== idx);
      handleSave(JSON.stringify(next));
    };

    const getFileIcon = (name: string) => {
      const ext = name.split('.').pop()?.toLowerCase() || '';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️';
      if (ext === 'pdf') return '📄';
      if (['doc', 'docx'].includes(ext)) return '📝';
      if (['ppt', 'pptx'].includes(ext)) return '📊';
      if (['xls', 'xlsx'].includes(ext)) return '📊';
      return '📎';
    };

    const [overlayOpen, setOverlayOpen] = useState(false);
    const [overlayPos, setOverlayPos] = useState<{ top: number; left: number } | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!overlayOpen) return;
      const h = (e: MouseEvent) => {
        if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) setOverlayOpen(false);
      };
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }, [overlayOpen]);

    const openOverlay = (e: React.MouseEvent) => {
      e.stopPropagation();
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setOverlayPos({ top: r.bottom + 6, left: r.left });
      setOverlayOpen((v) => !v);
    };

    const extra = files.length - 1;

    return (
      <div className="flex items-center gap-1.5 w-full" ref={triggerRef}>
        {files.length === 0 ? (
          <>
            {col.isEditable ? (
              <label className={cn('flex items-center gap-1 text-[10px] text-primary-500 hover:text-primary-700 cursor-pointer', uploading && 'opacity-50 pointer-events-none')}>
                {uploading ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                {uploading ? 'Uploading…' : 'Attach files'}
                <input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.svg,.xlsx,.xls,.txt" className="hidden" onChange={handleFileSelect} disabled={uploading} />
              </label>
            ) : (
              <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
            )}
          </>
        ) : (
          <>
            {/* First file chip */}
            <a
              href={`/uploads/${files[0].path}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 truncate max-w-[110px]"
              title={files[0].name}
            >
              <span>{getFileIcon(files[0].name)}</span>
              <span className="truncate">{files[0].name}</span>
            </a>

            {/* +N bubble */}
            {extra > 0 && (
              <button
                onClick={openOverlay}
                className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-[10px] font-semibold flex items-center justify-center hover:bg-primary-100 dark:hover:bg-primary-900/40 hover:text-primary-700 transition-colors"
              >
                +{extra}
              </button>
            )}

            {/* Attach more */}
            {col.isEditable && (
              <label className={cn('flex-shrink-0 flex items-center cursor-pointer text-slate-400 hover:text-primary-500 transition-colors', uploading && 'opacity-50 pointer-events-none')}>
                {uploading ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                <input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.svg,.xlsx,.xls,.txt" className="hidden" onChange={handleFileSelect} disabled={uploading} />
              </label>
            )}
          </>
        )}

        {/* Overlay with all files */}
        {overlayOpen && overlayPos && (
          <div
            ref={overlayRef}
            style={{ position: 'fixed', top: overlayPos.top, left: overlayPos.left, zIndex: 9999, minWidth: 220 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{files.length} file{files.length > 1 ? 's' : ''}</span>
              <button onClick={() => setOverlayOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={12} /></button>
            </div>
            <div className="py-1 max-h-56 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 group/of">
                  <span className="text-sm flex-shrink-0">{getFileIcon(f.name)}</span>
                  <a
                    href={`/uploads/${f.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-700 dark:text-slate-200 hover:text-primary-600 truncate flex-1"
                    title={f.name}
                  >
                    {f.name}
                  </a>
                  {col.isEditable && (
                    <button
                      onClick={() => { removeFile(i); if (files.length <= 1) setOverlayOpen(false); }}
                      className="opacity-0 group-hover/of:opacity-100 text-slate-300 hover:text-red-400 transition-all flex-shrink-0"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── LOCATION ───────────────────────────────────────────────────────────────
  if (col.dataType === 'LOCATION') {
    const locOptions: string[] = col.config?.options || [];
    const [locSearch, setLocSearch] = useState('');
    const [locAddMode, setLocAddMode] = useState(false);
    const [newLoc, setNewLoc] = useState('');
    const locRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!editing) return;
      const h = (e: MouseEvent) => { if (locRef.current && !locRef.current.contains(e.target as Node)) setEditing(false); };
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }, [editing]);

    const filtered = locOptions.filter((o) => o.toLowerCase().includes(locSearch.toLowerCase()));

    const addNewLocation = async () => {
      const loc = newLoc.trim();
      if (!loc || locOptions.includes(loc)) return;
      await settingsService.updateColumn(col.id, { config: { ...(col.config || {}), options: [...locOptions, loc] } });
      queryClient.invalidateQueries({ queryKey: ['columns', col.module] });
      handleSave(loc);
      setLocAddMode(false);
      setNewLoc('');
    };

    if (editing) {
      return (
        <div ref={locRef} className="relative">
          <input
            autoFocus
            value={locSearch}
            onChange={(e) => setLocSearch(e.target.value)}
            className="form-input text-xs py-1 w-full"
            placeholder="Search location…"
          />
          <div
            style={{ position: 'fixed', zIndex: 9999 }}
            className="mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            ref={(el) => {
              if (el && locRef.current) {
                const r = locRef.current.getBoundingClientRect();
                el.style.top = `${r.bottom + 4}px`;
                el.style.left = `${r.left}px`;
                el.style.width = `${Math.max(r.width, 180)}px`;
              }
            }}
          >
            <div className="max-h-44 overflow-y-auto py-1">
              {filtered.length === 0 && !locAddMode && (
                <p className="text-xs text-slate-400 text-center py-3">No matches</p>
              )}
              {filtered.map((opt) => (
                <button
                  key={opt}
                  onMouseDown={(e) => { e.preventDefault(); handleSave(opt); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left"
                >
                  <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                  {opt}
                </button>
              ))}
            </div>
            {locAddMode ? (
              <div className="px-2 py-2 border-t border-slate-100 dark:border-slate-700 flex gap-1.5">
                <input
                  autoFocus
                  value={newLoc}
                  onChange={(e) => setNewLoc(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addNewLocation(); if (e.key === 'Escape') setLocAddMode(false); }}
                  className="form-input text-xs py-1 flex-1"
                  placeholder="New location name"
                />
                <button onMouseDown={(e) => { e.preventDefault(); addNewLocation(); }} className="btn-primary text-xs px-2 py-1">Add</button>
              </div>
            ) : (
              <button
                onMouseDown={(e) => { e.preventDefault(); setLocAddMode(true); }}
                className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 border-t border-slate-100 dark:border-slate-700"
              >
                <Plus size={11} /> Add new location
              </button>
            )}
          </div>
        </div>
      );
    }
    return (
      <div onClick={() => col.isEditable && setEditing(true)} className="cursor-pointer flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
        {displayValue ? <><MapPin size={11} className="text-slate-400 flex-shrink-0" />{displayValue}</> : <span className="text-slate-300 dark:text-slate-600">—</span>}
      </div>
    );
  }

  // ── CANDIDATES / EMPLOYEE linked record picker ────────────────────────────
  if (col.dataType === 'CANDIDATES' || col.dataType === 'EMPLOYEE') {
    return (
      <LinkedRecordCell
        col={col} row={row} entityApiPath={entityApiPath} queryKey={queryKey}
        linkedType={col.dataType}
        selectedIds={selectedIds} onBulkSave={onBulkSave}
      />
    );
  }

  // ── EMAIL ──────────────────────────────────────────────────────────────────
  if (col.dataType === 'EMAIL') {
    const [err, setErr] = useState('');
    const validateAndSave = (v: string) => {
      if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setErr('Invalid email'); return; }
      setErr('');
      handleSave(v);
    };
    if (editing) return (
      <div>
        <input autoFocus type="email" value={value} onChange={(e) => { setValue(e.target.value); setErr(''); }}
          onBlur={(e) => validateAndSave(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') validateAndSave(value); if (e.key === 'Escape') setEditing(false); }}
          className={cn('form-input text-xs py-1 w-full', err && 'border-red-400')} placeholder="email@example.com" />
        {err && <p className="text-[10px] text-red-500 mt-0.5">{err}</p>}
      </div>
    );
    return (
      <div onClick={() => col.isEditable && setEditing(true)} className="cursor-pointer flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 truncate">
        {displayValue ? <><Mail size={10} className="text-slate-400 flex-shrink-0" />{displayValue}</> : <span className="text-slate-300 dark:text-slate-600">—</span>}
      </div>
    );
  }

  // ── URL ────────────────────────────────────────────────────────────────────
  if (col.dataType === 'URL') {
    const [err, setErr] = useState('');
    const validateAndSave = (v: string) => {
      if (v) {
        try { new URL(v.startsWith('http') ? v : `https://${v}`); }
        catch { setErr('Invalid URL'); return; }
      }
      setErr('');
      handleSave(v);
    };
    if (editing) return (
      <div>
        <input autoFocus type="url" value={value} onChange={(e) => { setValue(e.target.value); setErr(''); }}
          onBlur={(e) => validateAndSave(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') validateAndSave(value); if (e.key === 'Escape') setEditing(false); }}
          className={cn('form-input text-xs py-1 w-full', err && 'border-red-400')} placeholder="https://example.com" />
        {err && <p className="text-[10px] text-red-500 mt-0.5">{err}</p>}
      </div>
    );
    return (
      <div onClick={() => col.isEditable && setEditing(true)} className="cursor-pointer flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 truncate">
        {displayValue
          ? <a href={displayValue.startsWith('http') ? displayValue : `https://${displayValue}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-primary-600 hover:underline truncate"><Link size={10} className="flex-shrink-0" />{displayValue}</a>
          : <span className="text-slate-300 dark:text-slate-600">—</span>}
      </div>
    );
  }

  // ── PHONE ──────────────────────────────────────────────────────────────────
  if (col.dataType === 'PHONE') {
    const [err, setErr] = useState('');
    const validateAndSave = (v: string) => {
      if (v && !/^[+\d][\d\s\-().]{6,19}$/.test(v)) { setErr('Invalid phone number'); return; }
      setErr('');
      handleSave(v);
    };
    if (editing) return (
      <div>
        <input autoFocus type="tel" value={value} onChange={(e) => { setValue(e.target.value); setErr(''); }}
          onBlur={(e) => validateAndSave(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') validateAndSave(value); if (e.key === 'Escape') setEditing(false); }}
          className={cn('form-input text-xs py-1 w-full', err && 'border-red-400')} placeholder="+91 98765 43210" />
        {err && <p className="text-[10px] text-red-500 mt-0.5">{err}</p>}
      </div>
    );
    return (
      <div onClick={() => col.isEditable && setEditing(true)} className="cursor-pointer flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
        {displayValue ? <><Phone size={10} className="text-slate-400 flex-shrink-0" />{displayValue}</> : <span className="text-slate-300 dark:text-slate-600">—</span>}
      </div>
    );
  }

  // ── NUMBER ─────────────────────────────────────────────────────────────────
  if (col.dataType === 'NUMBER') {
    const [err, setErr] = useState('');
    const validateAndSave = (v: string) => {
      if (v && isNaN(Number(v))) { setErr('Must be a number'); return; }
      setErr('');
      handleSave(v);
    };
    if (editing) return (
      <div>
        <input autoFocus type="number" value={value} onChange={(e) => { setValue(e.target.value); setErr(''); }}
          onBlur={(e) => validateAndSave(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') validateAndSave(value); if (e.key === 'Escape') setEditing(false); }}
          className={cn('form-input text-xs py-1 w-full', err && 'border-red-400')} placeholder="0" />
        {err && <p className="text-[10px] text-red-500 mt-0.5">{err}</p>}
      </div>
    );
    return (
      <div onClick={() => col.isEditable && setEditing(true)} className={cn('text-xs text-slate-600 dark:text-slate-300 cursor-pointer', col.isEditable && 'hover:underline decoration-dashed')}>
        {displayValue !== '' ? <span className="font-mono">{displayValue}</span> : <span className="text-slate-300 dark:text-slate-600">—</span>}
      </div>
    );
  }

  // ── Default: TEXT ──────────────────────────────────────────────────────────
  if (editing) {
    return (
      <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} onBlur={(e) => handleSave(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(value); if (e.key === 'Escape') setEditing(false); }}
        className="form-input text-xs py-1 w-full" />
    );
  }
  return (
    <div onClick={() => col.isEditable && setEditing(true)} className={cn('text-xs text-slate-600 dark:text-slate-300 cursor-pointer truncate', col.isEditable && 'hover:underline decoration-dashed')}>
      {displayValue || <span className="text-slate-300 dark:text-slate-600">—</span>}
    </div>
  );
}

// ─── Date bucket helper ───────────────────────────────────────────────────────

function getDateBucket(dateStr: string): string {
  if (!dateStr) return 'No Date';
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
    const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
    if (diff === -1) return 'Yesterday';
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff >= 2 && diff <= 7) return 'Next Week';
    if (diff > 7 && diff <= 30) return 'Upcoming';
    if (diff > 30) return 'Next Year';
    if (diff >= -7 && diff < -1) return 'Last Week';
    return 'Past Date';
  } catch { return 'No Date'; }
}

// ─── Main DynamicTable ────────────────────────────────────────────────────────

export default function DynamicTable({
  module, entityApiPath, data, isLoading, fixedColumns, actionButtons,
  sortField, sortDir, onSort, extraFilters, onCustomFiltersChange, queryKey,
  excludeColumnNames, onBulkDelete, onRowExpand, expandedRowId, onSelectionChange,
}: DynamicTableProps) {
  const { t } = useTranslation();

  // ── Row selection & bulk actions ───────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    onSelectionChange?.([...selectedIds]);
  }, [selectedIds]); // eslint-disable-line react-hooks/exhaustive-deps
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [rowCtxMenu, setRowCtxMenu] = useState<{ row: any; x: number; y: number } | null>(null);
  const rowCtxMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rowCtxMenu) return;
    const h = (e: MouseEvent) => { if (rowCtxMenuRef.current && !rowCtxMenuRef.current.contains(e.target as Node)) setRowCtxMenu(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [rowCtxMenu]);

  const toggleRow = (id: string) =>
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = (rows: any[]) =>
    setSelectedIds(prev => rows.every(r => prev.has(r.id)) ? new Set() : new Set(rows.map(r => r.id)));
  const clearSelection = () => setSelectedIds(new Set());

  // ── Panels & popups ────────────────────────────────────────────────────────
  const [addColAt, setAddColAt] = useState<{ order: number; rect: DOMRect } | null>(null);
  const [customFilters, setCustomFilters] = useState<Record<string, string>>(() => {
    try { return JSON.parse(sessionStorage.getItem(`dt_filters_${module}`) || '{}'); } catch { return {}; }
  });
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filterPanelPos, setFilterPanelPos] = useState<{ top: number; left: number } | null>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);

  // ── Group By ───────────────────────────────────────────────────────────────
  const [groupByColId, setGroupByColId] = useState<string | null>(() => {
    try { return sessionStorage.getItem(`dt_groupby_${module}`) || null; } catch { return null; }
  });
  const [groupByOpen, setGroupByOpen] = useState(false);
  const [groupByPos, setGroupByPos] = useState<{ top: number; left: number } | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const groupByBtnRef = useRef<HTMLButtonElement>(null);
  const groupByPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!groupByOpen) return;
    const h = (e: MouseEvent) => {
      if (groupByPanelRef.current && !groupByPanelRef.current.contains(e.target as Node)) setGroupByOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [groupByOpen]);

  // ── Column width resizing ──────────────────────────────────────────────────
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [resizeX, setResizeX] = useState<number | null>(null);
  const [resizeRange, setResizeRange] = useState<{ top: number; height: number } | null>(null);
  const resizeRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const { key, startX, startWidth } = resizeRef.current;
      setColWidths((prev) => ({ ...prev, [key]: Math.max(60, startWidth + e.clientX - startX) }));
      setResizeX(e.clientX);
    };
    const onUp = () => {
      if (resizeRef.current) { resizeRef.current = null; document.body.style.cursor = ''; setResizeX(null); setResizeRange(null); }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  const startResize = useCallback((key: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const th = (e.currentTarget as HTMLElement).closest('th') as HTMLElement;
    const thead = th.closest('thead') as HTMLElement;
    const thRect = th.getBoundingClientRect();
    const theadRect = thead ? thead.getBoundingClientRect() : thRect;
    resizeRef.current = { key, startX: e.clientX, startWidth: thRect.width };
    setResizeRange({ top: theadRect.top, height: theadRect.height });
    document.body.style.cursor = 'col-resize';
  }, []);

  // ── Column drag-to-reorder ─────────────────────────────────────────────────
  const [dragColId, setDragColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // ── Data & mutations ───────────────────────────────────────────────────────
  const queryClient = useQueryClient();
  const { data: colsData, refetch: refetchCols } = useQuery({
    queryKey: ['columns', module],
    queryFn: async () => { const res = await settingsService.getColumns(module); return res.data.data || []; },
  });

  const customCols: ColumnDefinition[] = useMemo(
    () => (colsData || []).filter((c: ColumnDefinition) => !excludeColumnNames?.includes(c.name)),
    [colsData, excludeColumnNames]
  );
  const visibleCustomCols = useMemo(() => customCols.filter(c => c.isVisible), [customCols]);

  const handleBulkSave = useCallback(async (colName: string, val: any, ids: string[]) => {
    await Promise.allSettled(
      ids.map(id => api.patch(`${entityApiPath}/${id}/custom-fields`, { fieldName: colName, value: val }))
    );
    queryClient.invalidateQueries({ queryKey });
  }, [entityApiPath, queryKey, queryClient]);

  const downloadCSV = useCallback(() => {
    const rows = data.filter(r => selectedIds.has(r.id));
    if (!rows.length) return;
    const headers = [...fixedColumns.map(c => c.label), ...visibleCustomCols.map(c => c.label)];
    const escape = (v: any) => {
      const s = (v == null ? '' : String(v)).replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    };
    const csvRows = rows.map(row => [
      ...fixedColumns.map(c => escape(c.csvValue ? c.csvValue(row) : row[c.key] ?? '')),
      ...visibleCustomCols.map(c => escape(row.customFields?.[c.name] ?? '')),
    ].join(','));
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `export_${module}_${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }, [data, selectedIds, fixedColumns, visibleCustomCols, module]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => settingsService.deleteColumn(id),
    onSuccess: () => { refetchCols(); toast.success('Column deleted'); },
  });
  const renameMutation = useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) => settingsService.updateColumn(id, { label }),
    onSuccess: () => refetchCols(),
  });
  const duplicateMutation = useMutation({
    mutationFn: async (col: ColumnDefinition) => {
      const { id, createdAt, updatedAt, ...rest } = col as any;
      return settingsService.createColumn({ ...rest, label: `${col.label} (Copy)`, name: `${col.name}_copy_${Date.now()}`, order: (col.order ?? 0) + 1 });
    },
    onSuccess: () => { refetchCols(); toast.success('Column duplicated'); },
  });
  const reorderMutation = useMutation({
    mutationFn: (cols: { id: string; order: number }[]) => settingsService.reorderColumns(cols),
    onSuccess: () => refetchCols(),
  });

  const configureColumnMutation = useMutation({
    mutationFn: ({ col, selectionMode }: { col: ColumnDefinition; selectionMode: 'single' | 'multi' }) =>
      settingsService.updateColumn(col.id, { config: { ...(col.config || {}), selectionMode } }),
    onSuccess: () => { refetchCols(); toast.success('Column configured'); },
  });

  // ── Column context menu + inline rename ────────────────────────────────────
  const [ctxMenu, setCtxMenu] = useState<{ col: ColumnDefinition; x: number; y: number } | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [deleteConfirmCol, setDeleteConfirmCol] = useState<ColumnDefinition | null>(null);
  const [showConfigSub, setShowConfigSub] = useState(false);
  const ctxMenuRef = useRef<HTMLDivElement>(null);
  const configBtnRef = useRef<HTMLButtonElement>(null);
  const configHideTimer = useRef<ReturnType<typeof setTimeout>>();
  const renameInputRef = useRef<HTMLInputElement>(null);

  const startHideConfig = () => { configHideTimer.current = setTimeout(() => setShowConfigSub(false), 120); };
  const cancelHideConfig = () => { clearTimeout(configHideTimer.current); };

  useEffect(() => {
    if (!ctxMenu) { setShowConfigSub(false); return; }
    const h = (e: MouseEvent) => { if (ctxMenuRef.current && !ctxMenuRef.current.contains(e.target as Node)) setCtxMenu(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ctxMenu]);

  useEffect(() => { if (renameId && renameInputRef.current) renameInputRef.current.select(); }, [renameId]);

  const openRename = (col: ColumnDefinition) => { setCtxMenu(null); setRenameId(col.id); setRenameVal(col.label); };
  const commitRename = (col: ColumnDefinition) => {
    const v = renameVal.trim();
    if (v && v !== col.label) renameMutation.mutate({ id: col.id, label: v });
    setRenameId(null);
  };

  // Persist groupBy + customFilters to sessionStorage
  useEffect(() => {
    try {
      if (groupByColId) sessionStorage.setItem(`dt_groupby_${module}`, groupByColId);
      else sessionStorage.removeItem(`dt_groupby_${module}`);
    } catch {}
  }, [groupByColId, module]);

  useEffect(() => {
    try { sessionStorage.setItem(`dt_filters_${module}`, JSON.stringify(customFilters)); } catch {}
  }, [customFilters, module]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const handleCustomFilterChange = useCallback((colName: string, val: string) => {
    const next = { ...customFilters, [colName]: val };
    if (!val) delete next[colName];
    setCustomFilters(next);
    onCustomFiltersChange?.(next);
  }, [customFilters, onCustomFiltersChange]);

  const handleSort = (field: string) => {
    if (!onSort) return;
    onSort(field, sortField === field ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc');
  };

  useEffect(() => {
    if (!filterPanelOpen) return;
    const h = (e: MouseEvent) => { if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) setFilterPanelOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [filterPanelOpen]);

  const clearAllFilters = () => { setCustomFilters({}); onCustomFiltersChange?.({}); };

  // ── Column drag handlers ───────────────────────────────────────────────────
  const handleColDragStart = (e: React.DragEvent, colId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragColId(colId);
  };
  const handleColDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    if (colId !== dragColId) setDragOverColId(colId);
  };
  const handleColDrop = (targetColId: string) => {
    if (!dragColId || dragColId === targetColId) { setDragColId(null); setDragOverColId(null); return; }
    const cols = [...visibleCustomCols];
    const fromIdx = cols.findIndex(c => c.id === dragColId);
    const toIdx = cols.findIndex(c => c.id === targetColId);
    if (fromIdx < 0 || toIdx < 0) { setDragColId(null); setDragOverColId(null); return; }
    const [moved] = cols.splice(fromIdx, 1);
    cols.splice(toIdx, 0, moved);
    reorderMutation.mutate(cols.map((c, i) => ({ id: c.id, order: i })));
    setDragColId(null); setDragOverColId(null);
  };

  // ── Group By logic ─────────────────────────────────────────────────────────
  const groupableCols = useMemo(() =>
    visibleCustomCols.filter(c => ['STATUS', 'DROPDOWN', 'LABEL', 'DATE', 'LOCATION'].includes(c.dataType)),
    [visibleCustomCols]
  );
  const groupByCol = useMemo(() =>
    groupByColId ? customCols.find(c => c.id === groupByColId) ?? null : null,
    [groupByColId, customCols]
  );
  const groupedData = useMemo(() => {
    if (!groupByCol) return null;
    const groups = new Map<string, any[]>();
    data.forEach(row => {
      const val = row.customFields?.[groupByCol.name];
      const key = groupByCol.dataType === 'DATE' ? getDateBucket(val) : (val || 'No Value');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    });
    return groups;
  }, [data, groupByCol]);

  const toggleGroup = (key: string) =>
    setCollapsedGroups(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  // ── Computed table width (fixes table-layout: fixed) ─────────────────────
  const tableWidth = useMemo(() => {
    const fw = fixedColumns.reduce((s, c) => s + (colWidths[c.key] ?? (c.width ?? 120)), 0);
    const cw = visibleCustomCols.reduce((s, c) => s + (colWidths[c.id] ?? (c.width ?? 120)), 0);
    return 40 + fw + cw + 40 + 42; // 40 = checkbox, 40 = delete, 42 = add-col
  }, [fixedColumns, visibleCustomCols, colWidths]);

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm"><tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
              {[...Array(fixedColumns.length + 3)].map((_, j) => (
                <td key={j} className="px-3 py-3"><div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /></td>
              ))}
            </tr>
          ))}
        </tbody></table>
      </div>
    );
  }

  const filterableCustomCols = customCols.filter(c => c.isFilterable);
  const activeFilterCount = Object.keys(customFilters).filter(k => customFilters[k]).length;

  // ── Header cells (reused in both grouped and flat views) ──────────────────
  const theadTr = (
    <tr className="border-b-2 border-slate-200 dark:border-slate-700/80">
      {/* Checkbox column */}
      <th className="px-2 py-2.5 sticky left-0 z-20 bg-slate-50 dark:bg-slate-800/80 border-r border-slate-100 dark:border-slate-700/40" style={{ width: 40 }}>
        <input
          type="checkbox"
          checked={data.length > 0 && data.every(r => selectedIds.has(r.id))}
          ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && !data.every(r => selectedIds.has(r.id)); }}
          onChange={() => toggleAll(data)}
          className="w-4 h-4 rounded border-slate-300 text-primary-600 cursor-pointer"
        />
      </th>
      {fixedColumns.map((col, i) => (
        <th
          key={col.key}
          className={cn(
            'relative group/col px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap select-none bg-slate-50 dark:bg-slate-800/80',
            i === 0 ? 'text-left sticky left-10 z-20 shadow-[2px_0_0_0_theme(colors.slate.100)] dark:shadow-[2px_0_0_0_theme(colors.slate.700/60)]' : 'text-center'
          )}
          style={{ width: colWidths[col.key] ?? col.width }}
        >
          <div className={cn('flex items-center gap-1.5', i > 0 && 'justify-center')}>
            {col.sortable && (
              <button onClick={() => handleSort(col.key)}
                className={cn('w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors opacity-0 group-hover/col:opacity-100',
                  sortField === col.key ? 'opacity-100 bg-primary-100 dark:bg-primary-900/40 text-primary-600' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                )}>
                {sortField === col.key && sortDir === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
              </button>
            )}
            <span className="truncate">{col.label}</span>
          </div>
          <div onMouseDown={(e) => startResize(col.key, e)}
            className="absolute right-0 top-0 h-full w-2.5 cursor-col-resize z-30 group/resize flex items-center justify-center">
            <div className="h-4/5 w-0.5 rounded-full transition-colors bg-transparent group-hover/resize:bg-[#00d4ff]" />
          </div>
        </th>
      ))}

      {visibleCustomCols.map((col) => (
        <th
          key={col.id}
          draggable
          onDragStart={(e) => handleColDragStart(e, col.id)}
          onDragOver={(e) => handleColDragOver(e, col.id)}
          onDrop={() => handleColDrop(col.id)}
          onDragEnd={() => { setDragColId(null); setDragOverColId(null); }}
          onDoubleClick={() => openRename(col)}
          onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ col, x: e.clientX, y: e.clientY }); }}
          className={cn(
            'relative group/col px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap select-none bg-slate-50 dark:bg-slate-800/80 cursor-grab active:cursor-grabbing',
            col.dataType === 'TEXT' ? 'text-left' : 'text-center',
            dragOverColId === col.id && dragColId !== col.id && 'border-l-2 border-[#00d4ff]',
            dragColId === col.id && 'opacity-40 bg-primary-50 dark:bg-primary-900/20',
          )}
          style={{ width: colWidths[col.id] ?? (col.width ?? 120) }}
        >
          <div className={cn('flex items-center gap-1', col.dataType !== 'TEXT' && 'justify-center')}>
            <GripVertical size={11} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover/col:opacity-100 flex-shrink-0 mr-0.5" />
            {col.isSortable && renameId !== col.id && (
              <button onClick={() => handleSort(col.name)}
                className={cn('w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors opacity-0 group-hover/col:opacity-100',
                  sortField === col.name ? 'opacity-100 bg-primary-100 dark:bg-primary-900/40 text-primary-600' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                )}>
                {sortField === col.name && sortDir === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
              </button>
            )}
            {renameId === col.id ? (
              <input ref={renameInputRef} value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                onBlur={() => commitRename(col)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitRename(col); if (e.key === 'Escape') setRenameId(null); e.stopPropagation(); }}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent border-b border-primary-500 outline-none text-xs font-semibold text-slate-800 dark:text-white w-full min-w-0"
              />
            ) : (
              <>
                <span className="truncate">{col.label}</span>
                {!col.isRequired && (
                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmCol(col); }}
                    className="ml-auto opacity-0 group-hover/col:opacity-100 p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-400 hover:text-red-600 transition-all flex-shrink-0">
                    <X size={10} />
                  </button>
                )}
              </>
            )}
          </div>
          <div onMouseDown={(e) => startResize(col.id, e)}
            className="absolute right-0 top-0 h-full w-2.5 cursor-col-resize z-30 group/resize flex items-center justify-center">
            <div className="h-4/5 w-0.5 rounded-full transition-colors bg-transparent group-hover/resize:bg-[#00d4ff]" />
          </div>
        </th>
      ))}

      {/* Delete column (no header label) */}
      <th className="px-2 py-2.5 sticky right-0 bg-slate-50 dark:bg-slate-800/80 whitespace-nowrap z-20 border-l border-slate-200 dark:border-slate-700/60" style={{ width: 40 }} />

      {/* Add column */}
      <th className="bg-slate-50 dark:bg-slate-800/80 border-l border-slate-200 dark:border-slate-700/40" style={{ width: 42 }}>
        <button
          onClick={(e) => setAddColAt({ order: fixedColumns.length + visibleCustomCols.length, rect: e.currentTarget.getBoundingClientRect() })}
          className="w-full flex items-center justify-center text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors py-2.5 rounded-sm"
          title="Add column"
        >
          <Plus size={14} />
        </button>
      </th>
    </tr>
  );

  // ── Data row renderer ─────────────────────────────────────────────────────
  const renderRows = (rows: any[]) => rows.map(row => {
    const isSelected = selectedIds.has(row.id);
    const isExpanded = expandedRowId === row.id;
    return (
      <tr
        key={row.id}
        onContextMenu={(e) => { e.preventDefault(); setRowCtxMenu({ row, x: e.clientX, y: e.clientY }); }}
        className={cn(
          'border-b border-slate-100 dark:border-slate-700/40 transition-colors group/row',
          isExpanded
            ? 'bg-primary-50 dark:bg-primary-900/15 ring-1 ring-inset ring-primary-200 dark:ring-primary-800'
            : isSelected
              ? 'bg-primary-50/60 dark:bg-primary-900/10'
              : 'hover:bg-slate-50/60 dark:hover:bg-slate-700/20',
        )}
      >
        {/* Checkbox */}
        <td className={cn(
          'px-2 py-2.5 sticky left-0 z-10 border-r border-slate-100 dark:border-slate-700/40',
          isExpanded || isSelected ? 'bg-primary-50 dark:bg-primary-900/15' : 'bg-white dark:bg-slate-800 group-hover/row:bg-slate-50 dark:group-hover/row:bg-slate-800'
        )} style={{ width: 40 }}>
          <input type="checkbox" checked={isSelected} onChange={() => toggleRow(row.id)}
            className="w-4 h-4 rounded border-slate-300 text-primary-600 cursor-pointer" />
        </td>
        {fixedColumns.map((col, i) => (
          <td key={col.key}
            className={cn('px-3 py-2.5 overflow-hidden',
              i === 0 ? cn(
                'sticky left-10 z-10 shadow-[2px_0_0_0_theme(colors.slate.100)] dark:shadow-[2px_0_0_0_theme(colors.slate.700/40)]',
                isExpanded || isSelected ? 'bg-primary-50 dark:bg-primary-900/15' : 'bg-white dark:bg-slate-800 group-hover/row:bg-slate-50 dark:group-hover/row:bg-slate-800'
              ) : ''
            )}
            style={{ width: colWidths[col.key] ?? col.width, maxWidth: colWidths[col.key] ?? col.width }}>
            {i === 0
              ? col.render(row)
              : <div className="flex items-center justify-center">{col.render(row)}</div>
            }
          </td>
        ))}
        {visibleCustomCols.map(col => (
          <td key={col.id}
            className="px-3 py-2.5 overflow-hidden"
            style={{ width: colWidths[col.id] ?? (col.width ?? 120), maxWidth: colWidths[col.id] ?? (col.width ?? 120) }}>
            {col.dataType !== 'TEXT'
              ? <div className="flex items-center justify-center">
                  <CustomCell col={col} row={row} entityApiPath={entityApiPath} queryKey={queryKey}
                    selectedIds={selectedIds} onBulkSave={handleBulkSave} />
                </div>
              : <CustomCell col={col} row={row} entityApiPath={entityApiPath} queryKey={queryKey}
                  selectedIds={selectedIds} onBulkSave={handleBulkSave} />
            }
          </td>
        ))}
        {/* Delete-only action cell */}
        <td className={cn(
          'px-2 py-2 sticky right-0 border-l border-slate-100 dark:border-slate-700/40 z-10',
          isExpanded || isSelected ? 'bg-primary-50 dark:bg-primary-900/15' : 'bg-white dark:bg-slate-800 group-hover/row:bg-slate-50 dark:group-hover/row:bg-slate-800'
        )} style={{ width: 40 }}>
          {deleteBtn && (!deleteBtn.show || deleteBtn.show(row)) && (
            <button onClick={() => deleteBtn.onClick(row)} title="Delete"
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 size={13} />
            </button>
          )}
        </td>
        <td className={cn(
          isExpanded || isSelected ? 'bg-primary-50 dark:bg-primary-900/15' : 'bg-white dark:bg-slate-800'
        )} style={{ width: 42 }} />
      </tr>
    );
  });

  // ── Table shell ───────────────────────────────────────────────────────────
  const tableStyle: React.CSSProperties = { tableLayout: 'fixed', width: tableWidth };

  const deleteBtn = actionButtons.find(b => b.label === 'Delete');
  const viewBtn = actionButtons.find(b => b.label === 'View');
  const editBtn = actionButtons.find(b => b.label === 'Edit');
  const duplicateBtn = actionButtons.find(b => b.label === 'Duplicate');

  return (
    <>
      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800">
          <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
            {selectedIds.size} selected
          </span>
          <div className="flex-1" />
          <button onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Download size={13} /> Download CSV
          </button>
          {onBulkDelete && (
            <button onClick={() => setBulkDeleteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
              <Trash2 size={13} /> Delete Selected
            </button>
          )}
          <button onClick={clearSelection}
            className="p-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 text-primary-500 dark:text-primary-400 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/50">
        {/* Filters */}
        {filterableCustomCols.length > 0 && (
          <div ref={filterPanelRef} className="relative">
            <button ref={filterBtnRef}
              onClick={() => {
                if (!filterPanelOpen && filterBtnRef.current) {
                  const r = filterBtnRef.current.getBoundingClientRect();
                  setFilterPanelPos({ top: r.bottom + 6, left: r.left });
                }
                setFilterPanelOpen(v => !v);
              }}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                activeFilterCount > 0
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              )}>
              <SlidersHorizontal size={13} />
              Filters
              {activeFilterCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-primary-600 text-white text-xs font-bold leading-none">{activeFilterCount}</span>}
            </button>
            {filterPanelOpen && filterPanelPos && (
              <div style={{ position: 'fixed', top: filterPanelPos.top, left: filterPanelPos.left, zIndex: 9999 }}
                className="w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Quick Filters</span>
                  {activeFilterCount > 0 && <button onClick={clearAllFilters} className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium">Clear all</button>}
                </div>
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                  {filterableCustomCols.map(col => (
                    <div key={col.id}>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{col.label}</label>
                      {['DROPDOWN', 'STATUS', 'LABEL', 'PRIORITY'].includes(col.dataType) ? (
                        <select value={customFilters[col.name] || ''} onChange={(e) => handleCustomFilterChange(col.name, e.target.value)} className="form-input text-xs">
                          <option value="">All</option>
                          {col.dataType === 'PRIORITY'
                            ? ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(o => <option key={o} value={o}>{o}</option>)
                            : (col.config?.options || []).map((o: string) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input value={customFilters[col.name] || ''} onChange={(e) => handleCustomFilterChange(col.name, e.target.value)} placeholder={`Search ${col.label}...`} className="form-input text-xs" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Group By */}
        {groupableCols.length > 0 && (
          <div ref={groupByPanelRef} className="relative">
            <button ref={groupByBtnRef}
              onClick={() => {
                if (!groupByOpen && groupByBtnRef.current) {
                  const r = groupByBtnRef.current.getBoundingClientRect();
                  setGroupByPos({ top: r.bottom + 6, left: r.left });
                }
                setGroupByOpen(v => !v);
              }}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                groupByColId
                  ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              )}>
              <Layers size={13} />
              Group By
              {groupByColId && groupByCol && (
                <>
                  <span className="px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 font-medium">{groupByCol.label}</span>
                  <button onClick={(e) => { e.stopPropagation(); setGroupByColId(null); setCollapsedGroups(new Set()); }}
                    className="hover:text-red-500 rounded p-0.5"><X size={11} /></button>
                </>
              )}
            </button>
            {groupByOpen && groupByPos && (
              <div style={{ position: 'fixed', top: groupByPos.top, left: groupByPos.left, zIndex: 9999 }}
                className="w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Group By</span>
                </div>
                <div className="py-1">
                  <button onClick={() => { setGroupByColId(null); setGroupByOpen(false); setCollapsedGroups(new Set()); }}
                    className={cn('w-full text-left px-4 py-2 text-xs transition-colors', !groupByColId ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60')}>
                    None
                  </button>
                  {groupableCols.map(col => (
                    <button key={col.id}
                      onClick={() => { setGroupByColId(col.id); setGroupByOpen(false); setCollapsedGroups(new Set()); }}
                      className={cn('w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between', groupByColId === col.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60')}>
                      <span>{col.label}</span>
                      <span className="text-slate-400 text-xs">{col.dataType}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {extraFilters}
      </div>

      {/* Table area */}
      <div className="overflow-x-auto">
        {groupedData ? (
          /* ── GROUPED VIEW ─────────────────────────────────────────────── */
          <div>
            {[...groupedData.entries()].map(([groupKey, groupRows]) => {
              const collapsed = collapsedGroups.has(groupKey);
              return (
                <div key={groupKey}>
                  {/* Group header row */}
                  <div
                    className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors select-none sticky left-0"
                    style={{ minWidth: tableWidth }}
                    onClick={() => toggleGroup(groupKey)}
                  >
                    <div className={cn('w-4 h-4 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-transform duration-150', !collapsed && 'rotate-90')}>
                      <ChevronRight size={13} />
                    </div>
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">{groupKey}</span>
                    <span className="text-xs text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">{groupRows.length}</span>
                  </div>
                  {/* Group table */}
                  {!collapsed && (
                    <table className="text-sm border-collapse border-b-2 border-slate-200 dark:border-slate-700/60" style={tableStyle}>
                      <thead>{theadTr}</thead>
                      <tbody>{renderRows(groupRows)}</tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ── FLAT VIEW ────────────────────────────────────────────────── */
          <table className="text-sm border-collapse" style={tableStyle}>
            <thead>{theadTr}</thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={fixedColumns.length + visibleCustomCols.length + 2} className="text-center py-16 text-slate-400 text-sm">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : renderRows(data)}
            </tbody>
          </table>
        )}
      </div>

      {/* Resize blue indicator line — limited to column header height */}
      {resizeX !== null && resizeRange !== null && (
        <div style={{ position: 'fixed', top: resizeRange.top, left: resizeX, width: 3, height: resizeRange.height, background: '#00d4ff', zIndex: 99999, pointerEvents: 'none', boxShadow: '0 0 8px #00d4ff' }} />
      )}

      {/* Add Column Popup */}
      {addColAt && (
        <AddColumnPopup module={module} insertAfterOrder={addColAt.order} anchorRect={addColAt.rect}
          onClose={() => setAddColAt(null)} onCreated={refetchCols} />
      )}

      {/* Column context menu */}
      {ctxMenu && (
        <div ref={ctxMenuRef} style={{ position: 'fixed', top: ctxMenu.y, left: ctxMenu.x, zIndex: 9999 }}
          className="w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden py-1">
          <button onClick={() => { duplicateMutation.mutate(ctxMenu.col); setCtxMenu(null); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-left">
            <Copy size={14} className="text-slate-400" /> Duplicate
          </button>
          <button onClick={() => openRename(ctxMenu.col)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-left">
            <Pencil size={14} className="text-slate-400" /> Rename
          </button>
          {(ctxMenu.col.dataType === 'CANDIDATES' || ctxMenu.col.dataType === 'EMPLOYEE') && (
            <button
              ref={configBtnRef}
              onMouseEnter={() => { cancelHideConfig(); setShowConfigSub(true); }}
              onMouseLeave={startHideConfig}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-left"
            >
              <SlidersHorizontal size={14} className="text-slate-400" />
              <span className="flex-1">Configure</span>
              <ChevronRight size={12} className="text-slate-300" />
            </button>
          )}
          {!ctxMenu.col.isRequired && (
            <>
              <div className="mx-3 my-1 border-t border-slate-100 dark:border-slate-700" />
              <button onClick={() => { setDeleteConfirmCol(ctxMenu.col); setCtxMenu(null); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left">
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Configure submenu (selection mode) */}
      {ctxMenu && showConfigSub && configBtnRef.current && (
        (() => {
          const rect = configBtnRef.current!.getBoundingClientRect();
          const currentMode = ctxMenu.col.config?.selectionMode || 'single';
          return (
            <div
              onMouseEnter={cancelHideConfig}
              onMouseLeave={startHideConfig}
              style={{ position: 'fixed', top: rect.top, left: rect.right + 4, zIndex: 10000 }}
              className="w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden py-1"
            >
              <p className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                Selection Mode
              </p>
              {(['single', 'multi'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { configureColumnMutation.mutate({ col: ctxMenu.col, selectionMode: mode }); setCtxMenu(null); setShowConfigSub(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-left"
                >
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${currentMode === mode ? 'border-primary-500 bg-primary-500' : 'border-slate-300 dark:border-slate-500'}`}>
                    {currentMode === mode && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  {mode === 'single' ? 'Single' : 'Multi Select'}
                </button>
              ))}
            </div>
          );
        })()
      )}

      {/* Row right-click context menu */}
      {rowCtxMenu && (
        <div ref={rowCtxMenuRef} style={{ position: 'fixed', top: rowCtxMenu.y, left: rowCtxMenu.x, zIndex: 9999 }}
          className="w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden py-1">
          {viewBtn && (
            <button onClick={() => { viewBtn.onClick(rowCtxMenu.row); setRowCtxMenu(null); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-left">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              View
            </button>
          )}
          {editBtn && (
            <button onClick={() => { editBtn.onClick(rowCtxMenu.row); setRowCtxMenu(null); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-left">
              <Pencil size={14} className="text-slate-400" /> Edit
            </button>
          )}
          {duplicateBtn && (
            <button onClick={() => { duplicateBtn.onClick(rowCtxMenu.row); setRowCtxMenu(null); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-left">
              <Copy size={14} className="text-slate-400" /> Duplicate
            </button>
          )}
          {deleteBtn && (!deleteBtn.show || deleteBtn.show(rowCtxMenu.row)) && (
            <>
              <div className="mx-3 my-1 border-t border-slate-100 dark:border-slate-700" />
              <button onClick={() => { deleteBtn.onClick(rowCtxMenu.row); setRowCtxMenu(null); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left">
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Bulk delete confirmation */}
      {bulkDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Delete {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'}?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  You are about to permanently delete <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedIds.size}</span> selected {selectedIds.size === 1 ? 'record' : 'records'}. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setBulkDeleteOpen(false)} className="btn-secondary text-sm py-1.5">Cancel</button>
              <button
                onClick={() => { onBulkDelete?.([...selectedIds]); setBulkDeleteOpen(false); clearSelection(); }}
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center gap-1.5">
                <Trash2 size={14} /> Delete {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete column confirmation */}
      {deleteConfirmCol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Delete Column</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Delete <span className="font-medium text-slate-700 dark:text-slate-200">"{deleteConfirmCol.label}"</span>? All data in this column will be lost and cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirmCol(null)} className="btn-secondary text-sm py-1.5">Cancel</button>
              <button onClick={() => { deleteMutation.mutate(deleteConfirmCol.id); setDeleteConfirmCol(null); }}
                disabled={deleteMutation.isPending}
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5">
                {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
