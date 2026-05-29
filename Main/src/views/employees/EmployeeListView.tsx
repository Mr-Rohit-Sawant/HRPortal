import { useState, useEffect, useCallback } from 'react';
import CopyButton from '../../components/common/CopyButton';
import { usePanelResize } from '../../hooks/usePanelResize';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Upload, Search, Edit, Trash2, ToggleLeft, ToggleRight, RefreshCw, Eye,
  PanelRight, X, Mail, Phone, MapPin, Briefcase, ExternalLink, Loader2,
  Calendar, Shield, KeyRound,
} from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import ResetPasswordModal from '../../components/employees/ResetPasswordModal';
import EmployeeCSVImportModal from '../../components/employees/EmployeeCSVImportModal';
import { User } from '../../types';
import { formatDate, getStatusColor, getInitials, cn } from '../../utils/helpers';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DynamicTable, { FixedColumn, ActionButton } from '../../components/common/DynamicTable';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

const QUERY_KEY = ['employees'];

// ── Employee Quick Panel ───────────────────────────────────────────────────────

function EmployeeQuickPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const navigate = useNavigate();
  const { panelStyle, dragHandleProps, dragging } = usePanelResize();
  const { user: currentUser } = useAuthStore();
  const canResetPassword = currentUser?.isSuperAdmin || currentUser?.role?.name === 'admin';
  const [resetPwOpen, setResetPwOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await employeeService.getEmployeeById(id);
      return res.data.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-y-0 right-0 w-full md:w-[40vw] max-w-xl bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-700 !m-0"
      style={{ animation: 'slideInPanel 0.22s ease-out', ...panelStyle }}
    >
      <div {...dragHandleProps} className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 flex items-center justify-center group ${dragging ? 'bg-primary-400/40' : 'hover:bg-primary-400/20'}`}>
        <div className={`w-0.5 h-10 rounded-full transition-colors ${dragging ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-primary-400'}`} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <span className="text-sm font-semibold text-slate-900 dark:text-white">Employee Details</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => navigate(`/employees/${id}`)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title="Open full profile">
            <ExternalLink size={15} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : !data ? (
          <p className="text-center py-16 text-slate-400">Not found</p>
        ) : (
          <>
            {/* Profile hero */}
            <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-start gap-4">
                {data.profilePhoto ? (
                  <img src={`/uploads/${data.profilePhoto}`} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-xl flex-shrink-0">
                    {getInitials(data.firstName, data.lastName)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{data.firstName} {data.lastName}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{data.designation || 'No designation'}</p>
                  {data.department && <p className="text-xs text-slate-400 mt-0.5">{data.department}</p>}
                  <div className="flex items-center flex-wrap gap-1.5 mt-2">
                    <span className={cn('badge text-xs', getStatusColor(data.status))}>{data.status}</span>
                    {data.role && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium capitalize">
                        <Shield size={9} /> {data.role.name?.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 space-y-2.5">
              {data.email && (
                <div className="flex items-center gap-1.5">
                  <a href={`mailto:${data.email}`} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 truncate">
                    <Mail size={13} className="text-slate-400 flex-shrink-0" />{data.email}
                  </a>
                  <CopyButton value={data.email} />
                </div>
              )}
              {data.phone && (
                <div className="flex items-center gap-1.5">
                  <a href={`tel:${data.phone}`} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600">
                    <Phone size={13} className="text-slate-400 flex-shrink-0" />{data.phone}
                  </a>
                  <CopyButton value={data.phone} />
                </div>
              )}
              {(data.city || data.state || data.country) && (
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                  {[data.city, data.state, data.country].filter(Boolean).join(', ')}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700/60 border-b border-slate-100 dark:border-slate-700/60">
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Emp ID</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white font-mono">{data.employeeId || '—'}</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Joined</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{data.joiningDate ? formatDate(data.joiningDate) : '—'}</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Salary</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {data.salary ? `₹${Number(data.salary).toLocaleString()}` : '—'}
                </p>
              </div>
            </div>

            {/* Work info */}
            {(data.department || data.designation) && (
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 space-y-2.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Work</p>
                {data.designation && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <Briefcase size={13} className="text-slate-400 flex-shrink-0" />{data.designation}
                  </div>
                )}
                {data.department && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <Calendar size={13} className="text-slate-400 flex-shrink-0" />Dept: {data.department}
                  </div>
                )}
              </div>
            )}

          </>
        )}
      </div>

      {data && (
        <div className="flex flex-col gap-2 px-5 py-3.5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(`/employees/${id}/edit`)} className="btn-secondary flex-1 justify-center text-xs py-1.5">
              <Edit size={13} /> Edit
            </button>
            <button onClick={() => navigate(`/employees/${id}/edit`)} className="btn-primary flex-1 justify-center text-xs py-1.5">
              <ExternalLink size={13} /> Full Profile
            </button>
          </div>
          {canResetPassword && (
            <button
              onClick={() => setResetPwOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <KeyRound size={13} /> Reset Password
            </button>
          )}
        </div>
      )}

      {data && (
        <ResetPasswordModal
          isOpen={resetPwOpen}
          onClose={() => setResetPwOpen(false)}
          employeeId={id}
          employeeName={`${data.firstName} ${data.lastName}`}
        />
      )}
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export default function EmployeeListView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canAccess, user: currentUser } = useAuthStore();
  const isSuperAdmin = !!currentUser?.isSuperAdmin;
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetPwId, setResetPwId] = useState<string | null>(null);
  const [sort, setSort] = useState({ field: '', dir: 'asc' as 'asc' | 'desc' });
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEY, page, limit, debouncedSearch, sort],
    queryFn: async () => {
      const res = await employeeService.getEmployees({
        page, limit, search: debouncedSearch,
        ...(sort.field ? { sortBy: sort.field, sortDir: sort.dir } : {}),
      });
      return res.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: employeeService.toggleStatus,
    onSuccess: () => { toast.success('Status updated'); queryClient.invalidateQueries({ queryKey: QUERY_KEY }); },
  });

  const deleteMutation = useMutation({
    mutationFn: employeeService.deleteEmployee,
    onSuccess: () => { toast.success('Employee deleted'); queryClient.invalidateQueries({ queryKey: QUERY_KEY }); setDeleteId(null); },
  });

  const handleExpandRow = useCallback((row: User) => {
    setExpandedEmployeeId((prev) => (prev === row.id ? null : row.id));
  }, []);

  const employees: User[] = data?.data || [];
  const meta = data?.meta;

  // ── Fixed columns ─────────────────────────────────────────────────────────
  const fixedColumns: FixedColumn[] = [
    {
      key: 'name',
      label: 'Employee',
      width: 220,
      sortable: true,
      render: (row: User) => {
        const isExpanded = expandedEmployeeId === row.id;
        return (
          <div className="flex items-center gap-2.5 group/name">
            {row.profilePhoto ? (
              <img src={`/uploads/${row.profilePhoto}`} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 text-xs font-semibold flex-shrink-0">
                {getInitials(row.firstName, row.lastName)}
              </div>
            )}
            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/employees/${row.id}`)}>
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate hover:text-primary-600 dark:hover:text-primary-400">{row.firstName} {row.lastName}</p>
              <p className="text-xs text-slate-400 truncate">{row.email}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleExpandRow(row); }}
              title="Quick view"
              className={cn(
                'flex-shrink-0 p-1 rounded-md transition-all ml-1',
                isExpanded
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 opacity-100'
                  : 'text-slate-400 dark:text-slate-500 opacity-0 group-hover/name:opacity-100 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20',
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
      render: (row: User) => (
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 select-all">
          {row.employeeId ? `EMP-${row.employeeId}` : `EMP-${row.id.slice(0, 6).toUpperCase()}`}
        </span>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      width: 130,
      sortable: true,
      render: (row: User) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">{row.department || '—'}</span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      width: 110,
      render: (row: User) => (
        <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs capitalize">
          {row.role?.name?.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'joiningDate',
      label: 'Joined',
      width: 100,
      sortable: true,
      render: (row: User) => (
        <span className="text-xs text-slate-500">{formatDate(row.joiningDate)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 80,
      sortable: true,
      render: (row: User) => (
        <span className={cn('badge text-xs', getStatusColor(row.status))}>{row.status}</span>
      ),
    },
    ...(isSuperAdmin ? [{
      key: 'business',
      label: 'Business',
      width: 130,
      render: (row: any) => row.business ? (
        <button onClick={() => navigate('/business/' + row.businessId)}
          className="text-xs text-primary-600 hover:underline">
          {row.business.name}
        </button>
      ) : <span className="text-xs text-slate-400">—</span>,
    }] : []),
  ];

  // ── Action buttons ────────────────────────────────────────────────────────
  const finalActions: ActionButton[] = [
    {
      icon: <Eye size={14} />,
      label: 'View',
      onClick: (row: User) => navigate(`/employees/${row.id}`),
    },
    ...(canAccess('employees:update') ? [{
      icon: <Edit size={14} />,
      label: 'Edit',
      onClick: (row: User) => navigate(`/employees/${row.id}/edit`),
    }] : []),
    ...(canAccess('employees:update') ? [{
      label: 'Toggle Status',
      onClick: (row: User) => toggleMutation.mutate(row.id),
      render: (row: User) => (
        <button
          onClick={() => toggleMutation.mutate(row.id)}
          title={row.status === 'ACTIVE' ? 'Disable' : 'Enable'}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            row.status === 'ACTIVE'
              ? 'text-orange-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
              : 'text-green-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20',
          )}
        >
          {row.status === 'ACTIVE' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
        </button>
      ),
    }] : []),
    ...(canAccess('employees:delete') ? [{
      icon: <RefreshCw size={14} />,
      label: 'Reset Password',
      onClick: (row: User) => { if (row.id !== currentUser?.id) { setResetPwId(row.id); } },
      show: (row: User) => row.id !== currentUser?.id,
    }, {
      icon: <Trash2 size={14} />,
      label: 'Delete',
      onClick: (row: User) => setDeleteId(row.id),
      show: (row: User) => row.id !== currentUser?.id,
      className: 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
    }] : []),
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('employees.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{meta?.total ?? 0} {t('employees.title').toLowerCase()}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canAccess('employees:create') && (
            <button onClick={() => setCsvImportOpen(true)} className="btn-secondary text-xs">
              <Upload size={14} /> Import CSV
            </button>
          )}
          {canAccess('employees:create') && (
            <button onClick={() => navigate('/employees/add')} className="btn-primary">
              <Plus size={16} /> {t('employees.addEmployee')}
            </button>
          )}
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, phone, employee ID..."
            className="form-input pl-9"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <DynamicTable
          module="employees"
          entityApiPath="/employees"
          data={employees}
          isLoading={isLoading}
          fixedColumns={fixedColumns}
          actionButtons={finalActions}
          sortField={sort.field}
          sortDir={sort.dir}
          onSort={(field, dir) => setSort({ field, dir })}
          queryKey={QUERY_KEY}
          onRowExpand={handleExpandRow}
          expandedRowId={expandedEmployeeId}
        />

        {meta && meta.total > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={limit} onPageChange={setPage} onLimitChange={setLimit} />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Employee"
        message="This will permanently delete the employee account. This action cannot be undone."
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
      />

      {resetPwId && (() => {
        const emp = employees.find(e => e.id === resetPwId);
        return (
          <ResetPasswordModal
            isOpen
            onClose={() => setResetPwId(null)}
            employeeId={resetPwId}
            employeeName={emp ? `${emp.firstName} ${emp.lastName}` : ''}
          />
        );
      })()}

      {expandedEmployeeId && (
        <EmployeeQuickPanel id={expandedEmployeeId} onClose={() => setExpandedEmployeeId(null)} />
      )}

      {csvImportOpen && <EmployeeCSVImportModal onClose={() => setCsvImportOpen(false)} />}
    </div>
  );
}
