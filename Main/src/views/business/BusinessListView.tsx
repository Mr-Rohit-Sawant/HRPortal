import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Trash2, Building2, Users, Briefcase, FileText,
  PanelRight, X, ExternalLink, Loader2,
  RotateCcw, Mail, Calendar, KeyRound,
} from 'lucide-react';
import { businessService } from '../../services/businessService';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import DynamicTable, { FixedColumn, ActionButton } from '../../components/common/DynamicTable';
import ResetPasswordModal from '../../components/employees/ResetPasswordModal';
import { formatDate, cn } from '../../utils/helpers';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';

const QUERY_KEY = ['businesses'];

interface Business {
  id: string;
  name: string;
  code: string;
  adminEmail: string | null;
  status: string;
  deleteScheduledAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  _count: { users: number; candidates: number; clients: number; jobOpenings: number };
}

interface BusinessUser { id: string; firstName: string; lastName: string; email: string; }
type BusinessFull = Business & { users?: BusinessUser[] };

interface CreateForm {
  name: string;
  code: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
}

const EMPTY: CreateForm = { name: '', code: '', adminEmail: '', adminPassword: '', adminFirstName: '', adminLastName: '' };

// ── Business Quick Panel ──────────────────────────────────────────────────────

function BusinessQuickPanel({ id, onClose, onEdit, onDelete }: { id: string; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  const navigate = useNavigate();
  const [resetPwOpen, setResetPwOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['business', id],
    queryFn: async () => { const res = await businessService.getById(id); return res.data.data as BusinessFull; },
    enabled: !!id,
  });

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[40vw] max-w-xl bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-700"
      style={{ animation: 'slideInPanel 0.22s ease-out' }}>
      <style>{`@keyframes slideInPanel { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }`}</style>

      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <span className="text-sm font-semibold text-slate-900 dark:text-white">Business Details</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => navigate(`/business/${id}`)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title="Open full detail">
            <ExternalLink size={15} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><X size={15} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
        ) : !data ? (
          <p className="text-center py-16 text-slate-400">Not found</p>
        ) : (
          <>
            <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 flex-shrink-0">
                  <Building2 size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{data.name}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{data.code}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={cn('badge text-xs', data.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600')}>
                      {data.status}
                    </span>
                    {data.deleteScheduledAt && (
                      <span className="badge text-xs bg-yellow-100 text-yellow-700">Pending deletion</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 space-y-2.5">
              {data.adminEmail && (
                <a href={`mailto:${data.adminEmail}`} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 truncate">
                  <Mail size={13} className="text-slate-400 flex-shrink-0" />{data.adminEmail}
                </a>
              )}
              <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                <Calendar size={13} className="text-slate-400 flex-shrink-0" />Created {formatDate(data.createdAt)}
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-700/60 border-b border-slate-100 dark:border-slate-700/60">
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Users</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{data._count?.users ?? 0}</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Jobs</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{data._count?.jobOpenings ?? 0}</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Candidates</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{data._count?.candidates ?? 0}</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Clients</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{data._count?.clients ?? 0}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {data && (
        <div className="border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-900">
          {/* Reset password row */}
          {data.users && data.users.length > 0 && (() => {
            const adminUser = data.users!.find(u => u.email === data.adminEmail) ?? data.users![0];
            return (
              <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-700/60">
                <button
                  onClick={() => setResetPwOpen(true)}
                  className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                >
                  <KeyRound size={13} />
                  Reset Admin Password ({adminUser.email})
                </button>
                <ResetPasswordModal
                  isOpen={resetPwOpen}
                  onClose={() => setResetPwOpen(false)}
                  employeeId={adminUser.id}
                  employeeName={`${adminUser.firstName} ${adminUser.lastName}`}
                />
              </div>
            );
          })()}
          <div className="flex items-center gap-2 px-5 py-3.5">
            <button onClick={onEdit} className="btn-secondary flex-1 justify-center text-xs py-1.5">
              Edit
            </button>
            <button onClick={onDelete} className="flex-1 justify-center text-xs py-1.5 flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export default function BusinessListView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; adminEmail: string }>({ name: '', adminEmail: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateForm>(EMPTY);
  const [sort, setSort] = useState({ field: '', dir: 'asc' as 'asc' | 'desc' });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const handleExpandRow = useCallback((row: Business) => {
    setExpandedId((prev) => (prev === row.id ? null : row.id));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEY, page, limit, debouncedSearch, statusFilter, sort],
    queryFn: async () => {
      const res = await businessService.getAll({
        page, limit,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      });
      return res.data as { data: Business[]; meta: any };
    },
  });

  const createMutation = useMutation({
    mutationFn: (d: CreateForm) => businessService.create(d),
    onSuccess: () => {
      toast.success('Business created');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setCreateOpen(false);
      setForm(EMPTY);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create business'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => businessService.update(id, payload),
    onSuccess: () => {
      toast.success('Business updated');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setEditId(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update business'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => businessService.delete(id),
    onSuccess: () => {
      toast.success('Business scheduled for deletion in 24 hours');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteId(null);
    },
  });

  const undoMutation = useMutation({
    mutationFn: (id: string) => businessService.undoDelete(id),
    onSuccess: () => {
      toast.success('Deletion cancelled');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => businessService.toggleStatus(id),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const businesses = data?.data ?? [];
  const meta = data?.meta;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code || !form.adminEmail || !form.adminPassword || !form.adminFirstName || !form.adminLastName) {
      toast.error('All fields are required');
      return;
    }
    createMutation.mutate(form);
  };

  const openEdit = (b: Business) => {
    setEditId(b.id);
    setEditForm({ name: b.name, adminEmail: b.adminEmail || '' });
  };

  // ── Fixed columns ───────────────────────────────────────────────────────────
  const fixedColumns: FixedColumn[] = [
    {
      key: 'name',
      label: 'Name',
      width: 260,
      sortable: true,
      render: (row: Business) => {
        const isExpanded = expandedId === row.id;
        return (
          <div className="flex items-center gap-2.5 group/name">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 flex-shrink-0">
              <Building2 size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/business/${row.id}`); }}
                className="text-sm font-medium text-slate-900 dark:text-white truncate hover:text-primary-600 hover:underline text-left"
              >
                {row.name}
              </button>
              {row.deleteScheduledAt && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-yellow-600 dark:text-yellow-500">Pending deletion</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); undoMutation.mutate(row.id); }}
                    className="text-xs text-yellow-700 dark:text-yellow-400 underline hover:no-underline font-medium"
                  >
                    Undo
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleExpandRow(row); }}
              title="Quick view"
              className={cn(
                'flex-shrink-0 p-1 rounded-md transition-all ml-1',
                isExpanded
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 opacity-100'
                  : 'text-slate-400 opacity-0 group-hover/name:opacity-100 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20',
              )}
            >
              <PanelRight size={13} />
            </button>
          </div>
        );
      },
    },
    {
      key: 'code',
      label: 'Code',
      width: 110,
      sortable: true,
      render: (row: Business) => (
        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">{row.code}</span>
      ),
    },
    {
      key: 'adminEmail',
      label: 'Admin Email',
      width: 200,
      render: (row: Business) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{row.adminEmail || '—'}</span>
      ),
    },
    {
      key: 'data',
      label: 'Data',
      width: 150,
      render: (row: Business) => (
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1" title="Users"><Users size={12} /> {row._count?.users ?? 0}</span>
          <span className="flex items-center gap-1" title="Jobs"><Briefcase size={12} /> {row._count?.jobOpenings ?? 0}</span>
          <span className="flex items-center gap-1" title="CVs"><FileText size={12} /> {row._count?.candidates ?? 0}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 110,
      render: (row: Business) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggleMutation.mutate(row.id); }}
          title={row.status === 'ACTIVE' ? 'Click to disable' : 'Click to enable'}
          className={cn(
            'badge text-xs cursor-pointer transition-opacity hover:opacity-75 select-none',
            row.status === 'ACTIVE'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
          )}
        >
          {row.status === 'ACTIVE' ? 'Active' : 'Inactive'}
        </button>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      width: 110,
      sortable: true,
      render: (row: Business) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">{formatDate(row.createdAt)}</span>
      ),
    },
  ];

  // ── Action buttons ──────────────────────────────────────────────────────────
  const actionButtons: ActionButton[] = [
    {
      icon: <Trash2 size={14} />,
      label: 'Delete',
      onClick: (row: Business) => setDeleteId(row.id),
      show: (row: Business) => !row.deleteScheduledAt,
      className: 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Business</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{meta?.total ?? 0} businesses</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus size={16} /> Create Business
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, code, admin email…"
            className="form-input pl-9"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <DynamicTable
          module="businesses"
          entityApiPath="/businesses"
          data={businesses}
          isLoading={isLoading}
          fixedColumns={fixedColumns}
          actionButtons={actionButtons}
          sortField={sort.field}
          sortDir={sort.dir}
          onSort={(field, dir) => setSort({ field, dir })}
          queryKey={QUERY_KEY}
          onRowExpand={handleExpandRow}
          expandedRowId={expandedId}
          extraFilters={
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="form-input text-xs py-1.5 w-auto"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          }
        />

        {meta && meta.total > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={limit} onPageChange={setPage} onLimitChange={l => { setLimit(l); setPage(1); }} />
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => { setCreateOpen(false); setForm(EMPTY); }} title="Create Business" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Business Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <label className="form-label">Business Code *</label>
              <input className="form-input uppercase" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. ACM001" />
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide pt-1">Admin Account</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name *</label>
              <input className="form-input" value={form.adminFirstName} onChange={e => setForm(f => ({ ...f, adminFirstName: e.target.value }))} placeholder="First name" />
            </div>
            <div>
              <label className="form-label">Last Name *</label>
              <input className="form-input" value={form.adminLastName} onChange={e => setForm(f => ({ ...f, adminLastName: e.target.value }))} placeholder="Last name" />
            </div>
          </div>
          <div>
            <label className="form-label">Admin Email *</label>
            <input type="email" className="form-input" value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} placeholder="admin@business.com" />
          </div>
          <div>
            <label className="form-label">Admin Password *</label>
            <input type="password" className="form-input" value={form.adminPassword} onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))} placeholder="Min 8 characters" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setCreateOpen(false); setForm(EMPTY); }} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create Business'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editId} onClose={() => setEditId(null)} title="Edit Business" size="sm">
        <div className="space-y-4">
          <div>
            <label className="form-label">Business Name</label>
            <input className="form-input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Admin Email</label>
            <input type="email" className="form-input" value={editForm.adminEmail} onChange={e => setEditForm(f => ({ ...f, adminEmail: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditId(null)} className="btn-secondary">Cancel</button>
            <button
              type="button"
              className="btn-primary"
              disabled={updateMutation.isPending}
              onClick={() => editId && updateMutation.mutate({ id: editId, payload: { name: editForm.name } })}
            >
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Business"
        message="This business will be permanently deleted after 24 hours. You can undo the deletion any time within the grace period."
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
      />

      {expandedId && (
        <BusinessQuickPanel
          id={expandedId}
          onClose={() => setExpandedId(null)}
          onEdit={() => {
            const b = businesses.find(x => x.id === expandedId);
            if (b) openEdit(b);
          }}
          onDelete={() => { setDeleteId(expandedId); }}
        />
      )}
    </div>
  );
}
