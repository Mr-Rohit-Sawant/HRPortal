import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Trash2, Bug, Filter, X, ChevronUp, ChevronDown, SlidersHorizontal,
  Settings, Search, RotateCcw, PanelRight,
} from 'lucide-react';
import { bugReportService } from '../../services/bugReportService';
import { useAuthStore } from '../../stores/authStore';
import { formatDateTime, timeAgo, cn } from '../../utils/helpers';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DynamicTable, { FixedColumn, ActionButton } from '../../components/common/DynamicTable';
import BugDetailPanel from '../../components/bugReport/BugDetailPanel';
import ScreenshotLightbox from '../../components/bugReport/ScreenshotLightbox';
import BugStatusManager from '../../components/bugReport/BugStatusManager';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

const QUERY_KEY = ['bug-reports'];

interface BugFile { url: string; mimeType?: string; originalName?: string; }
interface BugReport {
  id: string; type: string; description: string;
  status: string; priority: string; severity?: string;
  module?: string; browser?: string; environment?: string;
  reportedByEmail: string; reportedByName?: string | null;
  businessId?: string | null; businessName?: string | null;
  files?: BugFile[] | null; createdAt: string; updatedAt: string;
  business?: { id: string; name: string };
  assignedTo?: { id: string; firstName: string; lastName: string };
}
interface StatusLabel { id: string; name: string; color: string; }

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500', medium: 'bg-yellow-500', low: 'bg-green-500',
};
const TYPE_BADGE: Record<string, string> = {
  Bug: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Improvement: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'New Requirement': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};
const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700', major: 'bg-orange-100 text-orange-700',
  minor: 'bg-yellow-100 text-yellow-700', trivial: 'bg-slate-100 text-slate-600',
};

interface Filters {
  search: string; status: string; priority: string; severity: string;
  type: string; module: string; browser: string; environment: string;
  dateFrom: string; dateTo: string; hasAttachment: string;
}
const EMPTY_FILTERS: Filters = {
  search: '', status: '', priority: '', severity: '', type: '',
  module: '', browser: '', environment: '', dateFrom: '', dateTo: '', hasAttachment: '',
};

function SortIcon({ field, sortField, sortDir }: { field: string; sortField: string; sortDir: string }) {
  if (sortField !== field) return <ChevronUp size={11} className="opacity-20" />;
  return sortDir === 'asc' ? <ChevronUp size={11} className="text-primary-500" /> : <ChevronDown size={11} className="text-primary-500" />;
}

export default function BugReportsView() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = !!user?.isSuperAdmin;

  const [page, setPage]   = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort]   = useState({ field: 'createdAt', dir: 'desc' as 'asc' | 'desc' });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);
  const [lightbox, setLightbox]   = useState<{ images: BugFile[]; index: number } | null>(null);
  const [statusMgrOpen, setStatusMgrOpen] = useState(false);

  const debouncedSearch = useDebounce(filters.search, 400);

  const activeFilterCount = useMemo(() =>
    Object.entries(filters).filter(([k, v]) => k !== 'search' && v !== '').length,
    [filters]
  );

  // Status labels
  const { data: statusLabels = [] } = useQuery<StatusLabel[]>({
    queryKey: ['bug-status-labels'],
    queryFn: async () => {
      const res = await bugReportService.getStatusLabels();
      return res.data.data || [];
    },
  });

  const getStatusLabel = useCallback((status: string) =>
    statusLabels.find(s => s.id === status || s.name.toLowerCase() === status.toLowerCase()),
    [statusLabels]
  );

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEY, page, limit, debouncedSearch, filters, sort],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page, limit, sortField: sort.field, sortDir: sort.dir,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.status      && { status: filters.status }),
        ...(filters.priority    && { priority: filters.priority }),
        ...(filters.severity    && { severity: filters.severity }),
        ...(filters.type        && { type: filters.type }),
        ...(filters.module      && { module: filters.module }),
        ...(filters.browser     && { browser: filters.browser }),
        ...(filters.environment && { environment: filters.environment }),
        ...(filters.dateFrom    && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo      && { dateTo: filters.dateTo }),
        ...(filters.hasAttachment && { hasAttachment: filters.hasAttachment }),
      };
      const res = await bugReportService.getAll(params);
      return res.data as { data: BugReport[]; meta: any };
    },
    enabled: isSuperAdmin,
  });

  const { data: settings } = useQuery({
    queryKey: ['bug-report-settings'],
    queryFn: async () => {
      const res = await bugReportService.getSettings();
      return res.data.data as { disabledAll: boolean; disabledSuperAdmin: boolean };
    },
  });

  const settingsMutation = useMutation({
    mutationFn: (payload: { disabledAll?: boolean; disabledSuperAdmin?: boolean }) =>
      bugReportService.updateSettings(payload),
    onSuccess: () => { toast.success('Settings updated'); queryClient.invalidateQueries({ queryKey: ['bug-report-settings'] }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      bugReportService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: () => toast.error('Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bugReportService.delete(id),
    onSuccess: () => {
      toast.success('Bug report deleted');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteId(null);
      if (selectedBugId === deleteId) setSelectedBugId(null);
    },
  });

  const setFilter = (key: keyof Filters) => (value: string) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => { setFilters(EMPTY_FILTERS); setPage(1); };

  const handleSort = (field: string) => {
    setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(1);
  };

  if (!isSuperAdmin) {
    return <p className="text-center py-16 text-slate-400">Super Admin access required.</p>;
  }

  const reports: BugReport[] = data?.data ?? [];
  const meta = data?.meta;

  // ── Fixed columns ─────────────────────────────────────────────────────────
  const fixedColumns: FixedColumn[] = [
    {
      key: 'description',
      label: (
        <button onClick={() => handleSort('description')} className="flex items-center gap-1 hover:text-primary-600">
          Description <SortIcon field="description" sortField={sort.field} sortDir={sort.dir} />
        </button>
      ) as any,
      width: 280,
      render: (row: BugReport) => {
        const isExpanded = selectedBugId === row.id;
        return (
          <div className="flex items-start gap-2 group/desc">
            <div className="flex-1 space-y-0.5 min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{row.description}</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setSelectedBugId(prev => prev === row.id ? null : row.id); }}
              title="Open detail panel"
              className={cn(
                'flex-shrink-0 p-1 rounded-md transition-all',
                isExpanded
                  ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 opacity-100'
                  : 'text-slate-400 opacity-0 group-hover/desc:opacity-100 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20',
              )}
            >
              <PanelRight size={13} />
            </button>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: (
        <button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-primary-600">
          Status <SortIcon field="status" sortField={sort.field} sortDir={sort.dir} />
        </button>
      ) as any,
      width: 130,
      render: (row: BugReport) => {
        const lbl = getStatusLabel(row.status);
        return (
          <select
            value={row.status}
            onChange={e => { e.stopPropagation(); updateMutation.mutate({ id: row.id, data: { status: e.target.value } }); }}
            onClick={e => e.stopPropagation()}
            className="text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer w-full max-w-[120px] focus:ring-0"
            style={{
              backgroundColor: (lbl?.color || '#6B7280') + '20',
              color: lbl?.color || '#6B7280',
            }}
          >
            {statusLabels.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            {!statusLabels.find(s => s.id === row.status) && (
              <option value={row.status}>{row.status}</option>
            )}
          </select>
        );
      },
    },
    {
      key: 'type',
      label: (
        <button onClick={() => handleSort('type')} className="flex items-center gap-1 hover:text-primary-600">
          Type <SortIcon field="type" sortField={sort.field} sortDir={sort.dir} />
        </button>
      ) as any,
      width: 130,
      render: (row: BugReport) => (
        <select
          value={row.type}
          onChange={e => { e.stopPropagation(); updateMutation.mutate({ id: row.id, data: { type: e.target.value } }); }}
          onClick={e => e.stopPropagation()}
          className={cn('text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-0 w-full max-w-[130px]', TYPE_BADGE[row.type] || 'bg-slate-100 text-slate-600')}
        >
          <option value="Bug">Bug</option>
          <option value="Improvement">Improvement</option>
          <option value="New Requirement">New Requirement</option>
        </select>
      ),
    },
    {
      key: 'priority',
      label: (
        <button onClick={() => handleSort('priority')} className="flex items-center gap-1 hover:text-primary-600">
          Priority <SortIcon field="priority" sortField={sort.field} sortDir={sort.dir} />
        </button>
      ) as any,
      width: 110,
      render: (row: BugReport) => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', PRIORITY_DOT[row.priority] || 'bg-slate-400')} />
          <select
            value={row.priority}
            onChange={e => updateMutation.mutate({ id: row.id, data: { priority: e.target.value } })}
            className="text-xs bg-transparent border-none focus:ring-0 text-slate-600 dark:text-slate-300 capitalize cursor-pointer p-0"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      ),
    },
    {
      key: 'severity',
      label: (
        <button onClick={() => handleSort('severity')} className="flex items-center gap-1 hover:text-primary-600">
          Severity <SortIcon field="severity" sortField={sort.field} sortDir={sort.dir} />
        </button>
      ) as any,
      width: 100,
      render: (row: BugReport) => row.severity
        ? <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', SEVERITY_BADGE[row.severity] || 'bg-slate-100 text-slate-600')}>{row.severity}</span>
        : <span className="text-xs text-slate-400">—</span>,
    },
    {
      key: 'module',
      label: 'Module',
      width: 110,
      render: (row: BugReport) => row.module
        ? <span className="text-xs text-slate-600 dark:text-slate-300 truncate block">{row.module}</span>
        : <span className="text-xs text-slate-400">—</span>,
    },
    {
      key: 'createdAt',
      label: (
        <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1 hover:text-primary-600">
          Reported <SortIcon field="createdAt" sortField={sort.field} sortDir={sort.dir} />
        </button>
      ) as any,
      width: 150,
      render: (row: BugReport) => (
        <div>
          <p className="text-xs text-slate-600 dark:text-slate-300">{timeAgo(row.createdAt)}</p>
          <p className="text-[10px] text-slate-400">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'reportedBy',
      label: 'Reported By',
      width: 170,
      render: (row: BugReport) => (
        <div>
          <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{row.reportedByName || row.reportedByEmail}</p>
          {row.reportedByName && <p className="text-[10px] text-slate-400 truncate">{row.reportedByEmail}</p>}
        </div>
      ),
    },
    {
      key: 'business',
      label: 'Business',
      width: 120,
      render: (row: BugReport) => row.businessName
        ? <span className="text-xs text-primary-600 truncate block">{row.businessName}</span>
        : <span className="text-xs text-slate-400">—</span>,
    },
    {
      key: 'screenshot',
      label: 'Screenshot',
      width: 90,
      render: (row: BugReport) => {
        const imgs = (row.files || []).filter(f => !f.mimeType || f.mimeType.startsWith('image/'));
        if (!imgs.length) return <span className="text-xs text-slate-400">—</span>;
        return (
          <button
            onClick={e => { e.stopPropagation(); setLightbox({ images: imgs, index: 0 }); }}
            className="relative w-12 h-10 rounded overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-primary-400 transition-colors group"
          >
            <img src={imgs[0].url} alt="" className="w-full h-full object-cover" />
            {imgs.length > 1 && (
              <span className="absolute -top-1 -right-1 bg-slate-800 text-white text-[9px] rounded-full px-1 py-px">{imgs.length}</span>
            )}
          </button>
        );
      },
    },
  ];

  const actionButtons: ActionButton[] = [
    {
      icon: <PanelRight size={14} />,
      label: 'View',
      onClick: (row: BugReport) => setSelectedBugId(prev => prev === row.id ? null : row.id),
    },
    {
      icon: <Trash2 size={14} />,
      label: 'Delete',
      onClick: (row: BugReport) => setDeleteId(row.id),
      className: 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Bug size={20} /> Bug Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{meta?.total ?? 0} reports</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setStatusMgrOpen(true)} className="btn-secondary text-xs gap-1.5">
            <SlidersHorizontal size={13} /> Manage Statuses
          </button>
          <button
            onClick={() => setFiltersOpen(f => !f)}
            className={cn('btn-secondary text-xs gap-1.5', filtersOpen && 'ring-2 ring-primary-400')}
          >
            <Filter size={13} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-primary-600 text-white text-[10px] rounded-full px-1.5 py-px">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Settings toggles */}
      <div className="card p-4 flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
          <Settings size={13} /> Visibility:
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={!!settings?.disabledAll}
            onChange={e => settingsMutation.mutate({ disabledAll: e.target.checked })} className="w-4 h-4 rounded" />
          <span className="text-sm text-slate-700 dark:text-slate-300">Disable for All Users</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={!!settings?.disabledSuperAdmin}
            onChange={e => settingsMutation.mutate({ disabledSuperAdmin: e.target.checked })} className="w-4 h-4 rounded" />
          <span className="text-sm text-slate-700 dark:text-slate-300">Disable for Super Admin</span>
        </label>
      </div>

      {/* Search bar */}
      <div className="card p-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={e => setFilter('search')(e.target.value)}
            placeholder="Search by title, description, email, module…"
            className="form-input pl-9"
          />
          {filters.search && (
            <button onClick={() => setFilter('search')('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Advanced Filters</p>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                <RotateCcw size={11} /> Reset all
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Status</label>
              <select value={filters.status} onChange={e => setFilter('status')(e.target.value)} className="form-input text-sm py-1.5">
                <option value="">All</option>
                {statusLabels.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Priority</label>
              <select value={filters.priority} onChange={e => setFilter('priority')(e.target.value)} className="form-input text-sm py-1.5">
                <option value="">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Severity</label>
              <select value={filters.severity} onChange={e => setFilter('severity')(e.target.value)} className="form-input text-sm py-1.5">
                <option value="">All</option>
                <option value="critical">Critical</option>
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="trivial">Trivial</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Type</label>
              <select value={filters.type} onChange={e => setFilter('type')(e.target.value)} className="form-input text-sm py-1.5">
                <option value="">All</option>
                <option value="Bug">Bug</option>
                <option value="Improvement">Improvement</option>
                <option value="New Requirement">New Requirement</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Module</label>
              <input value={filters.module} onChange={e => setFilter('module')(e.target.value)} placeholder="Any module" className="form-input text-sm py-1.5" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Browser</label>
              <input value={filters.browser} onChange={e => setFilter('browser')(e.target.value)} placeholder="Any browser" className="form-input text-sm py-1.5" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Environment</label>
              <input value={filters.environment} onChange={e => setFilter('environment')(e.target.value)} placeholder="Any environment" className="form-input text-sm py-1.5" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Has Screenshot</label>
              <select value={filters.hasAttachment} onChange={e => setFilter('hasAttachment')(e.target.value)} className="form-input text-sm py-1.5">
                <option value="">All</option>
                <option value="true">With screenshot</option>
                <option value="false">Without screenshot</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">From Date</label>
              <input type="date" value={filters.dateFrom} onChange={e => setFilter('dateFrom')(e.target.value)} className="form-input text-sm py-1.5" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">To Date</label>
              <input type="date" value={filters.dateTo} onChange={e => setFilter('dateTo')(e.target.value)} className="form-input text-sm py-1.5" />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <DynamicTable
          module="bug-reports"
          entityApiPath="/bug-reports"
          data={reports}
          isLoading={isLoading}
          fixedColumns={fixedColumns}
          actionButtons={actionButtons}
          sortField={sort.field}
          sortDir={sort.dir}
          onSort={handleSort}
          queryKey={QUERY_KEY}
          expandedRowId={selectedBugId}
          onRowExpand={(row: BugReport) => setSelectedBugId(prev => prev === row.id ? null : row.id)}
        />
        {meta && meta.total > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <Pagination
              page={page} totalPages={meta.totalPages} total={meta.total}
              limit={limit} onPageChange={setPage}
              onLimitChange={l => { setLimit(l); setPage(1); }}
            />
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedBugId && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setSelectedBugId(null)} />
          <BugDetailPanel
            bugId={selectedBugId}
            onClose={() => setSelectedBugId(null)}
            onOpenLightbox={(imgs, idx) => setLightbox({ images: imgs, index: idx })}
            statusLabels={statusLabels}
          />
        </>
      )}

      {/* Screenshot lightbox */}
      {lightbox && (
        <ScreenshotLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Status manager modal */}
      {statusMgrOpen && <BugStatusManager onClose={() => setStatusMgrOpen(false)} />}

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Bug Report"
        message="This will permanently delete the bug report. This action cannot be undone."
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
