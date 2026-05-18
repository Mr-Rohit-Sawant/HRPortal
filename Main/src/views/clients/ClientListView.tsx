import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Mail, Phone, Eye,
  PanelRight, X, ExternalLink, Loader2, MapPin, Globe, Briefcase,
} from 'lucide-react';
import { clientService } from '../../services/clientService';
import { Client } from '../../types';
import { formatDate, cn } from '../../utils/helpers';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DynamicTable, { FixedColumn, ActionButton } from '../../components/common/DynamicTable';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

const QUERY_KEY = ['clients'];

// ── Client Quick Panel ────────────────────────────────────────────────────────

function ClientQuickPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => { const res = await clientService.getClientById(id); return res.data.data; },
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
        <span className="text-sm font-semibold text-slate-900 dark:text-white">Client Details</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => navigate(`/clients/${id}`)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title="Open full detail">
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
            {/* Hero */}
            <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-xl flex-shrink-0">
                  {data.companyName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{data.companyName}</h2>
                  {data.industry && <p className="text-sm text-slate-500 dark:text-slate-400">{data.industry}</p>}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={cn('badge text-xs', data.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600')}>
                      {data.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {(data as any)._count?.jobOpenings > 0 && (
                      <span className="flex items-center gap-1 badge bg-blue-100 text-blue-700 text-xs">
                        <Briefcase size={9} /> {(data as any)._count.jobOpenings} jobs
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-700/60 border-b border-slate-100 dark:border-slate-700/60">
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Contact</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{data.contactPerson}</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Contract End</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{data.contractEndDate ? formatDate(data.contractEndDate) : '—'}</p>
              </div>
            </div>

            {/* Contact details */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 space-y-2.5">
              {data.email && (
                <a href={`mailto:${data.email}`} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 truncate">
                  <Mail size={13} className="text-slate-400 flex-shrink-0" />{data.email}
                </a>
              )}
              {data.phone && (
                <a href={`tel:${data.phone}`} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600">
                  <Phone size={13} className="text-slate-400 flex-shrink-0" />{data.phone}
                </a>
              )}
              {data.website && (
                <a href={data.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 truncate">
                  <Globe size={13} className="text-slate-400 flex-shrink-0" />{data.website}
                </a>
              )}
              {(data.city || data.state || data.country) && (
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                  {[data.city, data.state, data.country].filter(Boolean).join(', ')}
                </div>
              )}
            </div>

            {/* Tax info */}
            {(data.gstNumber || data.panNumber) && (
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Tax Info</p>
                {data.gstNumber && <p className="text-sm text-slate-600 dark:text-slate-300 font-mono">GST: {data.gstNumber}</p>}
                {data.panNumber && <p className="text-sm text-slate-600 dark:text-slate-300 font-mono mt-1">PAN: {data.panNumber}</p>}
              </div>
            )}
          </>
        )}
      </div>

      {data && (
        <div className="flex items-center gap-2 px-5 py-3.5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-900">
          <button onClick={() => navigate(`/clients/${id}/edit`)} className="btn-secondary flex-1 justify-center text-xs py-1.5">
            <Edit size={13} /> Edit
          </button>
          <button onClick={() => navigate(`/clients/${id}`)} className="btn-primary flex-1 justify-center text-xs py-1.5">
            <ExternalLink size={13} /> Full Detail
          </button>
        </div>
      )}
    </div>
  );
}

export default function ClientListView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sort, setSort] = useState({ field: '', dir: 'asc' as 'asc' | 'desc' });
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 400);
  const { t } = useTranslation();

  const handleExpandRow = useCallback((row: Client) => {
    setExpandedClientId((prev) => (prev === row.id ? null : row.id));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEY, page, limit, debouncedSearch, sort],
    queryFn: async () => {
      const res = await clientService.getClients({ page, limit, search: debouncedSearch });
      return res.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: clientService.toggleStatus,
    onSuccess: () => { toast.success('Status updated'); queryClient.invalidateQueries({ queryKey: QUERY_KEY }); },
  });

  const deleteMutation = useMutation({
    mutationFn: clientService.deleteClient,
    onSuccess: () => { toast.success('Client deleted'); queryClient.invalidateQueries({ queryKey: QUERY_KEY }); setDeleteId(null); },
  });

  const clients: Client[] = data?.data || [];
  const meta = data?.meta;

  // ── Fixed columns ─────────────────────────────────────────────────────────
  const fixedColumns: FixedColumn[] = [
    {
      key: 'company',
      label: 'Company',
      width: 220,
      sortable: true,
      render: (row: Client) => {
        const isExpanded = expandedClientId === row.id;
        return (
          <div className="flex items-center gap-2.5 group/company">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-xs flex-shrink-0">
              {row.companyName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{row.companyName}</p>
              <p className="text-xs text-slate-400 truncate">{row.industry || 'N/A'}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleExpandRow(row); }}
              title="Quick view"
              className={cn(
                'flex-shrink-0 p-1 rounded-md transition-all ml-1',
                isExpanded
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 opacity-100'
                  : 'text-slate-400 opacity-0 group-hover/company:opacity-100 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20',
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
      render: (row: Client) => (
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 select-all">
          CLT-{row.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'contactPerson',
      label: 'Contact',
      width: 160,
      sortable: true,
      render: (row: Client) => (
        <div>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{row.contactPerson}</p>
          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
            <Mail size={10} />
            <span className="truncate max-w-28">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      width: 120,
      render: (row: Client) => (
        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
          <Phone size={11} className="text-slate-400 flex-shrink-0" />
          {row.phone || '—'}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 80,
      render: (row: Client) => (
        <span className={cn('badge text-xs', row.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400')}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'jobs',
      label: 'Jobs',
      width: 60,
      render: (row: Client) => (
        <span className="text-xs text-slate-500">{(row as any)._count?.jobOpenings ?? 0}</span>
      ),
    },
    {
      key: 'contractEndDate',
      label: 'Contract End',
      width: 110,
      sortable: true,
      render: (row: Client) => (
        <span className="text-xs text-slate-500">{row.contractEndDate ? formatDate(row.contractEndDate) : '—'}</span>
      ),
    },
  ];

  // ── Action buttons ────────────────────────────────────────────────────────
  const actionButtons: ActionButton[] = [
    {
      icon: <Eye size={14} />,
      label: 'View',
      onClick: (row: Client) => navigate(`/clients/${row.id}`),
    },
    {
      icon: <Edit size={14} />,
      label: 'Edit',
      onClick: (row: Client) => navigate(`/clients/${row.id}/edit`),
    },
    {
      label: 'Toggle Status',
      onClick: (row: Client) => toggleMutation.mutate(row.id),
      render: (row: Client) => (
        <button
          onClick={() => toggleMutation.mutate(row.id)}
          title={row.isActive ? 'Deactivate' : 'Activate'}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            row.isActive
              ? 'text-orange-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
              : 'text-green-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
          )}
        >
          {row.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
        </button>
      ),
    },
    {
      icon: <Trash2 size={14} />,
      label: 'Delete',
      onClick: (row: Client) => setDeleteId(row.id),
      className: 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('clients.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{meta?.total ?? 0} {t('clients.company').toLowerCase()}s</p>
        </div>
        <button onClick={() => navigate('/clients/add')} className="btn-primary">
          <Plus size={16} /> {t('clients.addClient')}
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by company, contact, email, phone..."
            className="form-input pl-9"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <DynamicTable
          module="clients"
          entityApiPath="/clients"
          data={clients}
          isLoading={isLoading}
          fixedColumns={fixedColumns}
          actionButtons={actionButtons}
          sortField={sort.field}
          sortDir={sort.dir}
          onSort={(field, dir) => setSort({ field, dir })}
          queryKey={QUERY_KEY}
          onRowExpand={handleExpandRow}
          expandedRowId={expandedClientId}
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
        title="Delete Client"
        message="Are you sure? Clients with active job openings cannot be deleted."
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
      />

      {expandedClientId && (
        <ClientQuickPanel id={expandedClientId} onClose={() => setExpandedClientId(null)} />
      )}
    </div>
  );
}
