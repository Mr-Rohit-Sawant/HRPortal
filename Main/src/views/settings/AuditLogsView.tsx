import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Shield, ChevronDown, ChevronRight, Calendar, X } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { formatDateTime } from '../../utils/helpers';
import { useDebounce } from '../../hooks/useDebounce';
import Pagination from '../../components/common/Pagination';
import { cn } from '../../utils/helpers';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-purple-100 text-purple-700',
  LOGOUT: 'bg-slate-100 text-slate-600',
  EXPORT: 'bg-yellow-100 text-yellow-700',
  IMPORT: 'bg-orange-100 text-orange-700',
  SEND: 'bg-teal-100 text-teal-700',
};

const MODULES = ['', 'auth', 'candidates', 'jobs', 'employees', 'clients', 'invoices', 'settings'];
const ACTIONS = ['', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'SEND'];

export default function AuditLogsView() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const hasDateFilter = startDate || endDate;

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, limit, debouncedSearch, moduleFilter, actionFilter, startDate, endDate],
    queryFn: async () => {
      const res = await settingsService.getAuditLogs({
        page,
        limit,
        search: debouncedSearch || undefined,
        module: moduleFilter || undefined,
        action: actionFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      return res.data;
    },
  });

  const logs = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Audit Logs</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Complete record of all system activity</p>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by user, module or action..."
              className="form-input pl-9"
            />
          </div>
          <select
            value={moduleFilter}
            onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
            className="form-input w-40"
          >
            {MODULES.map((m) => <option key={m} value={m}>{m ? m.charAt(0).toUpperCase() + m.slice(1) : 'All Modules'}</option>)}
          </select>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="form-input w-36"
          >
            {ACTIONS.map((a) => <option key={a} value={a}>{a || 'All Actions'}</option>)}
          </select>
        </div>

        {/* Date range row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Calendar size={14} />
            <span>Date range:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="form-input w-40 text-sm"
              placeholder="Start date"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="form-input w-40 text-sm"
              placeholder="End date"
            />
          </div>
          {hasDateFilter && (
            <button
              onClick={clearDateFilter}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors"
            >
              <X size={12} /> Clear dates
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="table-header px-4 py-3 text-left w-6" />
                <th className="table-header px-4 py-3 text-left">User</th>
                <th className="table-header px-4 py-3 text-left hidden md:table-cell">Module</th>
                <th className="table-header px-4 py-3 text-left">Action</th>
                <th className="table-header px-4 py-3 text-left hidden lg:table-cell">Description</th>
                <th className="table-header px-4 py-3 text-left hidden xl:table-cell">IP Address</th>
                <th className="table-header px-4 py-3 text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Shield size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-400 text-sm">No audit logs found</p>
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <>
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3 text-slate-400">
                        {expandedRow === log.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {log.user ? `${log.user.firstName} ${log.user.lastName || ''}`.trim() : 'System'}
                          </p>
                          <p className="text-xs text-slate-500">{log.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">{log.module}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('badge text-xs', ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600')}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">{log.description}</p>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <code className="text-xs text-slate-500 font-mono">{log.ipAddress || '—'}</code>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</p>
                      </td>
                    </tr>
                    {expandedRow === log.id && (
                      <tr key={`${log.id}-detail`} className="bg-slate-50 dark:bg-slate-800/30">
                        <td colSpan={7} className="px-8 py-4">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="font-medium text-slate-500 mb-1">Description</p>
                              <p className="text-slate-900 dark:text-white">{log.description || '—'}</p>
                            </div>
                            <div>
                              <p className="font-medium text-slate-500 mb-1">IP Address / User Agent</p>
                              <p className="text-slate-900 dark:text-white font-mono">{log.ipAddress || '—'}</p>
                              <p className="text-slate-500 mt-0.5 truncate">{log.userAgent || '—'}</p>
                            </div>
                            {(log.oldValues || log.newValues) && (
                              <div className="col-span-2">
                                <p className="font-medium text-slate-500 mb-1">Changes</p>
                                <pre className="text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 overflow-auto max-h-32">
                                  {JSON.stringify({ old: log.oldValues, new: log.newValues }, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.total > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={limit} onPageChange={setPage} onLimitChange={setLimit} />
          </div>
        )}
      </div>
    </div>
  );
}
