import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Upload, Download, Search, Filter, MapPin, Users, Clock,
  Trash2, Eye, Edit, ChevronDown, PanelRight, X, ExternalLink, Loader2,
} from 'lucide-react';
import { jobService } from '../../services/jobService';
import { JobOpening } from '../../types';
import { formatDate, getStatusColor, getPriorityColor, cn } from '../../utils/helpers';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DynamicTable, { FixedColumn, ActionButton } from '../../components/common/DynamicTable';
import JobDetailContent from './JobDetailContent';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';
import Papa from 'papaparse';

const QUERY_KEY = ['jobs'];

// ── Job Quick Panel ───────────────────────────────────────────────────────────

function JobQuickPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => { const res = await jobService.getJobById(id); return res.data.data; },
    enabled: !!id,
  });

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['job', id] });
  }, [id, queryClient]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-y-0 right-0 w-full md:w-[50vw] max-w-3xl bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-700"
      style={{ animation: 'slideInPanel 0.22s ease-out' }}
    >
      <style>{`@keyframes slideInPanel { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }`}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{data?.jobTitle || 'Job Details'}</p>
          {data?.client && <p className="text-xs text-slate-400 truncate">{data.client.companyName}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
          <button onClick={() => navigate(`/job-openings/${id}/edit`)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title="Edit">
            <Edit size={15} />
          </button>
          <button onClick={() => navigate(`/job-openings/${id}`)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title="Open full detail">
            <ExternalLink size={15} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Content — same as detail page, compact layout */}
      <div className="flex-1 overflow-y-auto p-5">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : !data ? (
          <p className="text-center py-16 text-slate-400">Not found</p>
        ) : (
          <JobDetailContent data={data} jobId={id} onRefresh={onRefresh} compact={true} />
        )}
      </div>
    </div>
  );
}

export default function JobOpeningsView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState({ field: '', dir: 'asc' as 'asc' | 'desc' });
  const [filters, setFilters] = useState({ status: '', priority: '', clientId: '' });
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const handleExpandRow = useCallback((row: JobOpening) => {
    setExpandedJobId((prev) => (prev === row.id ? null : row.id));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEY, page, limit, debouncedSearch, filters, sort],
    queryFn: async () => {
      const params = {
        page, limit, search: debouncedSearch,
        ...(sort.field ? { sortBy: sort.field, sortDir: sort.dir } : {}),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      };
      const res = await jobService.getJobs(params);
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: jobService.deleteJob,
    onSuccess: () => {
      toast.success('Job opening deleted');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteId(null);
    },
  });

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await jobService.importJobsCSV(results.data as any[]);
          const { created, errors } = res.data.data;
          toast.success(`${created} jobs imported${errors.length > 0 ? `, ${errors.length} failed` : ''}`);
          queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        } catch { toast.error('Import failed'); }
      },
    });
  };

  const jobs: JobOpening[] = data?.data || [];
  const meta = data?.meta;

  // ── Fixed columns ─────────────────────────────────────────────────────────
  const fixedColumns: FixedColumn[] = [
    {
      key: 'jobTitle',
      label: 'Job Title',
      width: 220,
      sortable: true,
      render: (row: JobOpening) => {
        const isExpanded = expandedJobId === row.id;
        return (
          <div className="flex items-center gap-2 group/job">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{row.jobTitle}</p>
              <p className="text-xs text-slate-400">{row.client?.companyName}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleExpandRow(row); }}
              title="Quick view"
              className={cn(
                'flex-shrink-0 p-1 rounded-md transition-all',
                isExpanded
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 opacity-100'
                  : 'text-slate-400 opacity-0 group-hover/job:opacity-100 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20',
              )}
            >
              <PanelRight size={13} />
            </button>
          </div>
        );
      },
    },
    {
      key: '_id',
      label: 'ID',
      width: 100,
      render: (row: JobOpening) => (
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 select-all">
          JOB-{row.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 100,
      sortable: true,
      render: (row: JobOpening) => (
        <span className={cn('badge text-xs', getStatusColor(row.status))}>{row.status}</span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      width: 90,
      sortable: true,
      render: (row: JobOpening) => (
        <span className={cn('badge text-xs', getPriorityColor(row.priority))}>{row.priority}</span>
      ),
    },
    {
      key: 'workLocation',
      label: 'Location',
      width: 130,
      sortable: true,
      render: (row: JobOpening) => (
        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
          {row.workLocation ? <><MapPin size={11} className="text-slate-400" />{row.workLocation}</> : '—'}
        </div>
      ),
    },
    {
      key: 'applicants',
      label: 'Applicants',
      width: 90,
      render: (row: JobOpening) => (
        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
          <Users size={11} className="text-slate-400" />
          {(row as any)._count?.applications ?? 0}
        </div>
      ),
    },
    {
      key: 'closingDate',
      label: 'Closing Date',
      width: 110,
      sortable: true,
      render: (row: JobOpening) => (
        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
          {row.closingDate ? <><Clock size={11} className="text-slate-400" />{formatDate(row.closingDate)}</> : '—'}
        </div>
      ),
    },
  ];

  // ── Action buttons ────────────────────────────────────────────────────────
  const actionButtons: ActionButton[] = [
    {
      icon: <Eye size={14} />,
      label: 'View',
      onClick: (row: JobOpening) => navigate(`/job-openings/${row.id}`),
    },
    {
      icon: <Edit size={14} />,
      label: 'Edit',
      onClick: (row: JobOpening) => navigate(`/job-openings/${row.id}/edit`),
    },
    {
      icon: <Trash2 size={14} />,
      label: 'Delete',
      onClick: (row: JobOpening) => setDeleteId(row.id),
      className: 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('jobs.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{meta?.total ?? 0} total openings</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={jobService.downloadCSVTemplate} className="btn-secondary text-xs">
            <Download size={14} /> CSV Template
          </button>
          <label className="btn-secondary text-xs cursor-pointer">
            <Upload size={14} /> Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          </label>
          <button onClick={() => navigate('/job-openings/new')} className="btn-primary">
            <Plus size={16} /> {t('jobs.addJob')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-60">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search job title, location, skills..."
              className="form-input pl-9"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn('btn-secondary', showFilters && 'border-primary-500 text-primary-700')}
          >
            <Filter size={16} />
            Filters
            <ChevronDown size={14} className={cn('transition-transform', showFilters && 'rotate-180')} />
          </button>
        </div>
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="form-label text-xs">Status</label>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="form-input">
                <option value="">All</option>
                {['ACTIVE', 'CLOSED', 'ON_HOLD', 'DRAFT'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Priority</label>
              <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className="form-input">
                <option value="">All</option>
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => setFilters({ status: '', priority: '', clientId: '' })} className="btn-secondary w-full">
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <DynamicTable
          module="jobs"
          entityApiPath="/jobs"
          data={jobs}
          isLoading={isLoading}
          fixedColumns={fixedColumns}
          actionButtons={actionButtons}
          sortField={sort.field}
          sortDir={sort.dir}
          onSort={(field, dir) => setSort({ field, dir })}
          queryKey={QUERY_KEY}
          excludeColumnNames={['status', 'priority', 'work_location', 'closing_date']}
          onRowExpand={handleExpandRow}
          expandedRowId={expandedJobId}
        />

        {meta && meta.total > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Job Opening"
        message="Are you sure you want to delete this job opening? All interview rounds and applications will also be deleted."
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
      />

      {expandedJobId && (
        <JobQuickPanel id={expandedJobId} onClose={() => setExpandedJobId(null)} />
      )}
    </div>
  );
}
