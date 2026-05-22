import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Upload, Download, Search, Filter, MapPin, Clock,
  Trash2, Eye, Edit, ChevronDown, PanelRight, X, ExternalLink, Loader2, Users, Copy,
} from 'lucide-react';
import { jobService } from '../../services/jobService';
import { employeeService } from '../../services/employeeService';
import { useAuthStore } from '../../stores/authStore';
import { JobOpening, User } from '../../types';
import { formatDate, getStatusColor, getPriorityColor, getInitials, cn } from '../../utils/helpers';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DynamicTable, { FixedColumn, ActionButton } from '../../components/common/DynamicTable';
import JobDetailContent from './JobDetailContent';
import JobCSVImportModal from '../../components/job-openings/JobCSVImportModal';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

const QUERY_KEY = ['jobs'];

// ── Clubbed Avatars ───────────────────────────────────────────────────────────

function ClubbedAvatars({ assignees }: { assignees: Partial<User>[] }) {
  if (!assignees || assignees.length === 0) return null;

  const visible = assignees.slice(0, 2);
  const extra = assignees.length - 2;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visible.map((a) => (
          <div
            key={a.id}
            className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-slate-800 flex-shrink-0 overflow-hidden"
          >
            {a.profilePhoto ? (
              <img src={`/uploads/${a.profilePhoto}`} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 text-[9px] font-bold">
                {getInitials(a.firstName || '', a.lastName)}
              </div>
            )}
          </div>
        ))}
        {extra > 0 && (
          <div className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-slate-800 bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
            +{extra}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Recruiter Cell (tooltip + click to manage) ────────────────────────────────

function RecruiterCell({ row, onManage }: { row: JobOpening; onManage: () => void }) {
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const names = (row.assignees || [])
    .map((a) => [a.firstName, a.lastName].filter(Boolean).join(' '))
    .filter(Boolean);

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!names.length) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ x: r.left + r.width / 2, y: r.top });
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); onManage(); }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setTip(null)}
        className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
        title=""
      >
        {names.length > 0 ? (
          <ClubbedAvatars assignees={row.assignees || []} />
        ) : (
          <span className="text-xs text-primary-500 font-medium hover:text-primary-600">+ Assign</span>
        )}
      </button>

      {tip && names.length > 0 && (
        <div
          style={{
            position: 'fixed',
            left: tip.x,
            top: tip.y - 8,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
          }}
          className="pointer-events-none bg-slate-900 dark:bg-slate-700 text-white rounded-lg px-3 py-2 shadow-xl"
        >
          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Recruiters</p>
          <p className="text-xs leading-relaxed max-w-[220px]">{names.join(', ')}</p>
          <div
            style={{ position: 'absolute', left: '50%', bottom: -4, transform: 'translateX(-50%)' }}
            className="w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45"
          />
        </div>
      )}
    </>
  );
}

// ── Manage Recruiters Modal ───────────────────────────────────────────────────

function ManageRecruitersModal({
  job, bulkJobIds, onClose,
}: {
  job: JobOpening;
  bulkJobIds?: string[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isBulk = !!bulkJobIds && bulkJobIds.length > 1;

  // In single mode show existing assignees; in bulk mode no pre-state (mixed)
  const [localAssignees, setLocalAssignees] = useState<Partial<User>[]>(
    isBulk ? [] : (job.assignees || [])
  );
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [empSearch, setEmpSearch] = useState('');

  const { data: allEmployees = [], isLoading: empLoading } = useQuery({
    queryKey: ['employees-modal'],
    queryFn: async () => {
      const res = await employeeService.getEmployees({ limit: 500 });
      return (res.data.data || []) as User[];
    },
    staleTime: 0,
  });

  const filteredEmployees = empSearch.trim()
    ? allEmployees.filter((e) =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(empSearch.toLowerCase())
      )
    : allEmployees;

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const toggle = async (emp: Partial<User> & { id: string }) => {
    const isAssigned = localAssignees.some((a) => a.id === emp.id);
    const action = isAssigned ? 'remove' : 'add';

    // Optimistic local update
    setLocalAssignees((prev) =>
      isAssigned ? prev.filter((a) => a.id !== emp.id) : [...prev, emp]
    );
    setLoadingIds((prev) => new Set(prev).add(emp.id));

    const targetIds = isBulk ? bulkJobIds! : [job.id];

    try {
      await Promise.all(targetIds.map((jid) => jobService.toggleAssignee(jid, emp.id, action)));
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    } catch {
      // Revert optimistic update
      setLocalAssignees((prev) =>
        isAssigned ? [...prev, emp] : prev.filter((a) => a.id !== emp.id)
      );
      toast.error('Failed to update recruiter');
    } finally {
      setLoadingIds((prev) => { const n = new Set(prev); n.delete(emp.id); return n; });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg shadow-2xl flex flex-col"
        style={{ animation: 'slideInPanel 0.18s ease-out', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Manage Recruiters</h3>
            {isBulk ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full px-2 py-0.5">
                  <Users size={10} /> {bulkJobIds!.length} jobs selected
                </span>
                <span className="text-[10px] text-slate-400">— applies to all</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 truncate mt-0.5">{job.jobTitle}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 flex-shrink-0 ml-3">
            <X size={15} />
          </button>
        </div>

        {/* Currently assigned chips — single mode only */}
        {!isBulk && localAssignees.length > 0 && (
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 flex-shrink-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Assigned</p>
            <div className="flex flex-wrap gap-1.5">
              {localAssignees.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs font-medium rounded-full pl-2.5 pr-1 py-0.5 border border-primary-200 dark:border-primary-800/40"
                >
                  {a.firstName} {a.lastName}
                  <button
                    onClick={() => a.id && toggle({ id: a.id, firstName: a.firstName, lastName: a.lastName, profilePhoto: a.profilePhoto })}
                    disabled={loadingIds.has(a.id!)}
                    className="w-4 h-4 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 flex items-center justify-center transition-colors"
                  >
                    {loadingIds.has(a.id!) ? <Loader2 size={9} className="animate-spin" /> : <X size={9} />}
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="px-4 pt-3 pb-2 flex-shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={empSearch}
              onChange={(e) => setEmpSearch(e.target.value)}
              placeholder="Search by name..."
              className="form-input pl-8 py-1.5 text-sm w-full"
              autoFocus
            />
            {empSearch && (
              <button
                onClick={() => setEmpSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* All employees grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {empLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">No employees found</p>
          ) : (
            <>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                {empSearch ? `${filteredEmployees.length} result${filteredEmployees.length !== 1 ? 's' : ''}` : 'Click to assign or remove'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {filteredEmployees.map((emp) => {
                  const isAssigned = localAssignees.some((a) => a.id === emp.id);
                  const isPending = loadingIds.has(emp.id);
                  return (
                    <button
                      key={emp.id}
                      onClick={() => toggle(emp)}
                      disabled={isPending}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 transition-all text-left w-full',
                        isAssigned
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50',
                        isPending && 'opacity-60 cursor-not-allowed',
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          {emp.profilePhoto ? (
                            <img src={`/uploads/${emp.profilePhoto}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-[10px]">
                              {getInitials(emp.firstName, emp.lastName)}
                            </div>
                          )}
                        </div>
                        {isPending && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-800/70 rounded-full">
                            <Loader2 size={11} className="animate-spin text-primary-500" />
                          </div>
                        )}
                        {isAssigned && !isPending && (
                          <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary-500 flex items-center justify-center">
                            <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                              <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {/* Name */}
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate leading-tight">
                        {emp.firstName} {emp.lastName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-end flex-shrink-0">
          <button onClick={onClose} className="btn-primary text-sm">Done</button>
        </div>
      </div>
    </div>
  );
}

// ── Recruiter Filter Picker ───────────────────────────────────────────────────

function RecruiterPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['employees-dropdown'],
    queryFn: async () => {
      const res = await employeeService.getEmployees({ limit: 200 });
      return (res.data.data || []) as User[];
    },
    staleTime: 60000,
  });

  const recruiters = data || [];

  const filtered = search.trim()
    ? recruiters.filter((r) =>
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        (r.designation || '').toLowerCase().includes(search.toLowerCase())
      )
    : recruiters;

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div className="space-y-2 pt-1">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search names, roles or teams"
          className="form-input pl-8 py-1.5 text-sm w-full"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={13} />
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={18} className="animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No people found</p>
      ) : (
        <div className="max-h-52 overflow-y-auto -mx-1">
          {selected.length > 0 && (
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1">
              Suggested people
            </p>
          )}
          {filtered.map((r) => {
            const isSelected = selected.includes(r.id);
            return (
              <button
                key={r.id}
                onClick={() => toggle(r.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors text-left',
                  isSelected
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                )}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  {r.profilePhoto ? (
                    <img src={`/uploads/${r.profilePhoto}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-xs">
                      {getInitials(r.firstName, r.lastName)}
                    </div>
                  )}
                </div>
                {/* Name + role */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                    {r.firstName} {r.lastName}
                    {r.designation && (
                      <span className="font-normal text-slate-400 dark:text-slate-500 ml-1">
                        ({r.designation.length > 22 ? r.designation.slice(0, 22) + '…' : r.designation})
                      </span>
                    )}
                  </p>
                </div>
                {/* Checkmark */}
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                    <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
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

// ── Main View ─────────────────────────────────────────────────────────────────

export default function JobOpeningsView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { canAccess, user: currentUser } = useAuthStore();
  const isSuperAdmin = !!currentUser?.isSuperAdmin;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<'filters' | 'recruiters'>('filters');
  const [sort, setSort] = useState({ field: '', dir: 'asc' as 'asc' | 'desc' });
  const [filters, setFilters] = useState({ status: '', priority: '', clientId: '' });
  const [selectedRecruiters, setSelectedRecruiters] = useState<string[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [manageRecruitersJob, setManageRecruitersJob] = useState<JobOpening | null>(null);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const handleExpandRow = useCallback((row: JobOpening) => {
    setExpandedJobId((prev) => (prev === row.id ? null : row.id));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEY, page, limit, debouncedSearch, filters, sort, selectedRecruiters],
    queryFn: async () => {
      const params: Record<string, any> = {
        page, limit, search: debouncedSearch,
        ...(sort.field ? { sortBy: sort.field, sortDir: sort.dir } : {}),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      };
      if (selectedRecruiters.length > 0) params.assigneeIds = selectedRecruiters.join(',');
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

  const duplicateMutation = useMutation({
    mutationFn: jobService.duplicateJob,
    onSuccess: () => {
      toast.success('Job duplicated as Draft');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: () => toast.error('Failed to duplicate job'),
  });

  const jobs: JobOpening[] = data?.data || [];
  const meta = data?.meta;

  const activeFilterCount =
    Object.values(filters).filter(Boolean).length + selectedRecruiters.length;

  // ── Fixed columns ────────────────────────────────────────────────────────
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
            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/job-openings/${row.id}`)}>
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate hover:text-primary-600 dark:hover:text-primary-400">{row.jobTitle}</p>
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
      key: 'recruiters',
      label: 'Recruiters',
      width: 110,
      render: (row: JobOpening) => (
        <RecruiterCell
          row={row}
          onManage={() => setManageRecruitersJob(row)}
        />
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

  const actionButtons: ActionButton[] = [
    { icon: <Eye size={14} />, label: 'View', onClick: (row: JobOpening) => navigate(`/job-openings/${row.id}`) },
    ...(canAccess('jobs:update') ? [{ icon: <Edit size={14} />, label: 'Edit', onClick: (row: JobOpening) => navigate(`/job-openings/${row.id}/edit`) }] : []),
    ...(canAccess('jobs:create') ? [{ icon: <Copy size={14} />, label: 'Duplicate', onClick: (row: JobOpening) => duplicateMutation.mutate(row.id) }] : []),
    ...(canAccess('jobs:delete') ? [{ icon: <Trash2 size={14} />, label: 'Delete', onClick: (row: JobOpening) => setDeleteId(row.id), className: 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' }] : []),
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('jobs.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{meta?.total ?? 0} total openings</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCsvImportOpen(true)} className="btn-secondary text-xs">
            <Upload size={14} /> Import CSV
          </button>
          <button onClick={() => navigate('/job-openings/new')} className="btn-primary">
            <Plus size={16} /> {t('jobs.addJob')}
          </button>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="card p-4 space-y-4">
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
            onClick={() => { setShowFilters(!showFilters); setActiveFilterTab('filters'); }}
            className={cn('btn-secondary relative', showFilters && activeFilterTab === 'filters' && 'border-primary-500 text-primary-700')}
          >
            <Filter size={16} />
            Filters
            {Object.values(filters).filter(Boolean).length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary-500 text-white text-[9px] flex items-center justify-center font-bold">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
            <ChevronDown size={14} className={cn('transition-transform', showFilters && activeFilterTab === 'filters' && 'rotate-180')} />
          </button>
          <button
            onClick={() => { setShowFilters(!showFilters || activeFilterTab !== 'recruiters'); setActiveFilterTab('recruiters'); }}
            className={cn('btn-secondary relative', showFilters && activeFilterTab === 'recruiters' && 'border-primary-500 text-primary-700')}
          >
            <Users size={16} />
            Recruiter
            {selectedRecruiters.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary-500 text-white text-[9px] flex items-center justify-center font-bold">
                {selectedRecruiters.length}
              </span>
            )}
            <ChevronDown size={14} className={cn('transition-transform', showFilters && activeFilterTab === 'recruiters' && 'rotate-180')} />
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setFilters({ status: '', priority: '', clientId: '' }); setSelectedRecruiters([]); }}
              className="btn-secondary text-red-500 hover:text-red-600"
            >
              <X size={14} /> Clear all
            </button>
          )}
        </div>

        {/* Status / Priority filters */}
        {showFilters && activeFilterTab === 'filters' && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="form-label text-xs">Status</label>
              <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }} className="form-input">
                <option value="">All</option>
                {['ACTIVE', 'CLOSED', 'ON_HOLD', 'DRAFT'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Priority</label>
              <select value={filters.priority} onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }} className="form-input">
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

        {/* Recruiter picker */}
        {showFilters && activeFilterTab === 'recruiters' && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Select recruiters to filter jobs — multiple selection allowed
              </p>
              {selectedRecruiters.length > 0 && (
                <button onClick={() => setSelectedRecruiters([])} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                  <X size={11} /> Clear ({selectedRecruiters.length})
                </button>
              )}
            </div>
            <RecruiterPicker selected={selectedRecruiters} onChange={(ids) => { setSelectedRecruiters(ids); setPage(1); }} />
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
          excludeColumnNames={['status', 'priority', 'work_location', 'closing_date', 'assigned_employees']}
          onRowExpand={handleExpandRow}
          expandedRowId={expandedJobId}
          onSelectionChange={setSelectedJobIds}
        />
        {meta && meta.total > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={limit} onPageChange={setPage} onLimitChange={setLimit} />
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

      {manageRecruitersJob && (
        <ManageRecruitersModal
          job={manageRecruitersJob}
          bulkJobIds={
            selectedJobIds.length > 1 && selectedJobIds.includes(manageRecruitersJob.id)
              ? selectedJobIds
              : undefined
          }
          onClose={() => setManageRecruitersJob(null)}
        />
      )}

      {csvImportOpen && <JobCSVImportModal onClose={() => setCsvImportOpen(false)} />}
    </div>
  );
}
