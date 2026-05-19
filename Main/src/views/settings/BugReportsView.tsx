import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Bug } from 'lucide-react';
import { bugReportService } from '../../services/bugReportService';
import { useAuthStore } from '../../stores/authStore';
import { formatDateTime, timeAgo, cn } from '../../utils/helpers';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DynamicTable, { FixedColumn, ActionButton } from '../../components/common/DynamicTable';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

const QUERY_KEY = ['bug-reports'];

interface BugFile { url: string; mimeType?: string; originalName?: string; }
interface BugReport {
  id: string;
  type: string;
  description: string;
  priority: string;
  reportedByEmail: string;
  reportedByName: string | null;
  businessId: string | null;
  businessName: string | null;
  files: BugFile[] | null;
  createdAt: string;
}

const TYPE_BADGE: Record<string, string> = {
  Bug: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Improvement: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'New Requirement': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

export default function BugReportsView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = !!user?.isSuperAdmin;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sort, setSort] = useState({ field: '', dir: 'asc' as 'asc' | 'desc' });
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEY, page, limit, debouncedSearch, sort],
    queryFn: async () => {
      const res = await bugReportService.getAll({ page, limit, search: debouncedSearch || undefined });
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
    onSuccess: () => {
      toast.success('Settings updated');
      queryClient.invalidateQueries({ queryKey: ['bug-report-settings'] });
    },
  });

  const priorityMutation = useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: string }) =>
      bugReportService.update(id, { priority }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEY }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bugReportService.delete(id),
    onSuccess: () => {
      toast.success('Bug report deleted');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteId(null);
    },
  });

  const noop = useCallback(() => {}, []);

  if (!isSuperAdmin) {
    return <p className="text-center py-16 text-slate-400">Super Admin access required.</p>;
  }

  const reports = data?.data ?? [];
  const meta = data?.meta;

  const fixedColumns: FixedColumn[] = [
    {
      key: 'description',
      label: 'Description',
      width: 280,
      render: (row: BugReport) => (
        <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{row.description}</p>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      width: 130,
      render: (row: BugReport) => (
        <span className={cn('badge text-xs', TYPE_BADGE[row.type] || 'bg-slate-100 text-slate-600')}>
          {row.type}
        </span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      width: 120,
      render: (row: BugReport) => (
        <div className="flex items-center gap-1.5">
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', PRIORITY_DOT[row.priority] || 'bg-slate-400')} />
          <select
            value={row.priority}
            onChange={(e) => priorityMutation.mutate({ id: row.id, priority: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="text-xs bg-transparent border-none focus:ring-0 text-slate-600 dark:text-slate-300 capitalize cursor-pointer"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Reported',
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
      width: 180,
      render: (row: BugReport) => (
        <div>
          <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{row.reportedByEmail}</p>
          {row.reportedByName && <p className="text-[10px] text-slate-400 truncate">{row.reportedByName}</p>}
        </div>
      ),
    },
    {
      key: 'business',
      label: 'Business',
      width: 130,
      render: (row: BugReport) => (
        row.businessName ? (
          <button
            onClick={() => row.businessId && navigate(`/business/${row.businessId}`)}
            className="text-xs text-primary-600 hover:underline"
          >
            {row.businessName}
          </button>
        ) : <span className="text-xs text-slate-400">—</span>
      ),
    },
    {
      key: 'screenshot',
      label: 'Screenshot',
      width: 90,
      render: (row: BugReport) => {
        const imgs = (row.files || []).filter(f => !f.mimeType || f.mimeType.startsWith('image/'));
        if (imgs.length === 0) return <span className="text-xs text-slate-400">—</span>;
        return (
          <div className="relative w-12 h-12">
            <img src={imgs[0].url} alt="" className="w-12 h-12 rounded object-cover border border-slate-200 dark:border-slate-700" />
            {imgs.length > 1 && (
              <span className="absolute -top-1.5 -right-1.5 bg-slate-800 text-white text-[10px] rounded-full px-1.5 py-0.5">
                +{imgs.length - 1}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  const actionButtons: ActionButton[] = [
    {
      icon: <Trash2 size={14} />,
      label: 'Delete',
      onClick: (row: BugReport) => setDeleteId(row.id),
      className: 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Bug size={20} /> Bug Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{meta?.total ?? 0} reports</p>
        </div>
      </div>

      {/* Toggles */}
      <div className="card p-4 flex flex-col sm:flex-row gap-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!settings?.disabledAll}
            onChange={(e) => settingsMutation.mutate({ disabledAll: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">Disable for All Users</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!settings?.disabledSuperAdmin}
            onChange={(e) => settingsMutation.mutate({ disabledSuperAdmin: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">Disable for Super Admin</span>
        </label>
      </div>

      <div className="card p-4">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by description or email…"
          className="form-input"
        />
      </div>

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
          onSort={(field, dir) => setSort({ field, dir })}
          queryKey={QUERY_KEY}
          onRowExpand={noop}
        />

        {meta && meta.total > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={limit} onPageChange={setPage} onLimitChange={l => { setLimit(l); setPage(1); }} />
          </div>
        )}
      </div>

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
