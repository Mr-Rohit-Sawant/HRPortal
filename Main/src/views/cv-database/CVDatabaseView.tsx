import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Upload, Search, Star, Download, Trash2,
  SlidersHorizontal, Eye, ChevronDown, FileSpreadsheet, Files,
  PanelRight, X, Mail, Phone, MapPin, Briefcase, GraduationCap,
  ExternalLink, Edit, Loader2,
} from 'lucide-react';
import CSVImportModal from './CSVImportModal';
import { cvService } from '../../services/cvService';
import { useAuthStore } from '../../stores/authStore';
import { Candidate } from '../../types';
import { formatCTC, formatExperience, getStatusColor, formatDate, cn } from '../../utils/helpers';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DynamicTable, { FixedColumn, ActionButton } from '../../components/common/DynamicTable';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

const STATUS_OPTIONS = ['NEW', 'SCREENING', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED', 'ON_HOLD', 'ACTIVE', 'INACTIVE', 'BLACKLIST'];
const GENDER_OPTIONS = ['MALE', 'FEMALE', 'OTHER'];
const QUERY_KEY = ['candidates'];
const SESSION_KEY = 'cvdb_state';

const DEFAULT_FILTERS = {
  gender: '', status: '', minExp: '', maxExp: '', minCTC: '', maxCTC: '',
  location: '', qualification: '', isPriority: '',
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ── Candidate Quick-View Panel ────────────────────────────────────────────────

function CandidateQuickPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => {
      const res = await cvService.getCandidateById(id);
      return res.data.data;
    },
    enabled: !!id,
  });

  const handleDownload = async () => {
    if (!data?.cvFile) return toast.error('No CV file attached');
    try {
      const res = await cvService.downloadCV(id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = data.cvOriginalName || 'cv.pdf'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[42vw] max-w-2xl bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-700"
      style={{ animation: 'slideInPanel 0.22s ease-out' }}>
      <style>{`@keyframes slideInPanel { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }`}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <span className="text-sm font-semibold text-slate-900 dark:text-white">Candidate Details</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(`/cv-database/${id}`)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
            title="Open full profile"
          >
            <ExternalLink size={15} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Content */}
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
                    {`${data.firstName[0]}${data.lastName?.[0] || ''}`.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{data.firstName} {data.lastName}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{data.currentDesignation || 'No designation'}</p>
                  {data.currentCompany && <p className="text-xs text-slate-400 mt-0.5">{data.currentCompany}</p>}
                  <div className="flex items-center flex-wrap gap-1.5 mt-2">
                    <span className={cn('badge text-xs', getStatusColor(data.status))}>{data.status.replace('_', ' ')}</span>
                    {data.isPriority && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                        <Star size={10} className="fill-current" /> Priority
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 space-y-2.5">
              {data.email && (
                <a href={`mailto:${data.email}`} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 truncate">
                  <Mail size={13} className="text-slate-400 flex-shrink-0" />{data.email}
                </a>
              )}
              {data.phone && (
                <a href={`tel:${data.phone}`} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400">
                  <Phone size={13} className="text-slate-400 flex-shrink-0" />{data.phone}
                </a>
              )}
              {data.currentLocation && (
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin size={13} className="text-slate-400 flex-shrink-0" />{data.currentLocation}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700/60 border-b border-slate-100 dark:border-slate-700/60">
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Experience</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {data.totalExperience != null ? formatExperience(data.totalExperience) : '—'}
                </p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Current CTC</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{formatCTC(data.currentCTC)}</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Notice</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {data.noticePeriod ? `${data.noticePeriod}d` : '—'}
                </p>
              </div>
            </div>

            {/* Skills */}
            {((data.skills?.length ?? 0) > 0 || (data.technologyStack?.length ?? 0) > 0) && (
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {[...(data.skills || []), ...(data.technologyStack || [])].slice(0, 10).map((s: string) => (
                    <span key={s} className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Latest experience */}
            {(data.experienceDetails?.length ?? 0) > 0 && (
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2.5">Experience</p>
                <div className="space-y-3">
                  {(data.experienceDetails || []).slice(0, 2).map((exp: any, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Briefcase size={12} className="text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{exp.designation}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{exp.company}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDate(exp.joiningDate)} – {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {(data.educationDetails?.length ?? 0) > 0 && (() => {
              const edu = (data.educationDetails as any[])[0];
              const degree = edu.qualification || edu.degree || '';
              const spec = edu.specialization || '';
              const inst = edu.university || edu.institution || '';
              const year = edu.passingYear || edu.year || '';
              return (
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2.5">Education</p>
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <GraduationCap size={12} className="text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">
                        {degree}{spec && ` – ${spec}`}
                      </p>
                      {inst && <p className="text-xs text-slate-500 dark:text-slate-400">{inst}</p>}
                      {year && <p className="text-xs text-slate-400">{year}</p>}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Notes */}
            {data.notes && (
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Notes</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{data.notes}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer actions */}
      {data && (
        <div className="flex items-center gap-2 px-5 py-3.5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-900">
          {data.cvFile && (
            <button onClick={handleDownload} className="btn-secondary flex-1 justify-center text-xs py-1.5">
              <Download size={13} /> Download CV
            </button>
          )}
          <Link to={`/cv-database/${id}/edit`} className="btn-secondary flex-1 justify-center text-xs py-1.5">
            <Edit size={13} /> Edit
          </Link>
          <Link to={`/cv-database/${id}`} className="btn-primary flex-1 justify-center text-xs py-1.5">
            <ExternalLink size={13} /> Full Profile
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export default function CVDatabaseView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { canAccess, user: currentUser } = useAuthStore();
  const isSuperAdmin = !!currentUser?.isSuperAdmin;
  const isMobile = useIsMobile();

  // ── Restore state from sessionStorage on mount ─────────────────────────────
  const [page, setPage] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}').page ?? 1; } catch { return 1; }
  });
  const [limit, setLimit] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}').limit ?? 10; } catch { return 10; }
  });
  const [search, setSearch] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}').search ?? ''; } catch { return ''; }
  });
  const [showAdvSearch, setShowAdvSearch] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}').showAdvSearch ?? false; } catch { return false; }
  });
  const [sort, setSort] = useState<{ field: string; dir: 'asc' | 'desc' }>(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}').sort ?? { field: '', dir: 'asc' }; } catch { return { field: '', dir: 'asc' }; }
  });
  const [filters, setFilters] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}').filters ?? DEFAULT_FILTERS; } catch { return DEFAULT_FILTERS; }
  });

  // Persist state to sessionStorage on change (except page reloads which reset it)
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ page, limit, search, showAdvSearch, sort, filters }));
    } catch {}
  }, [page, limit, search, showAdvSearch, sort, filters]);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);
  const bulkMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bulkMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) setBulkMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bulkMenuOpen]);

  // Close panel with Escape
  useEffect(() => {
    if (!expandedCandidateId) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpandedCandidateId(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [expandedCandidateId]);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEY, page, limit, debouncedSearch, filters, sort],
    queryFn: async () => {
      const params = {
        page, limit, search: debouncedSearch,
        ...(sort.field ? { sortBy: sort.field, sortDir: sort.dir } : {}),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      };
      const res = await cvService.getCandidates(params);
      return res.data;
    },
  });

  const togglePriorityMutation = useMutation({
    mutationFn: cvService.togglePriority,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: cvService.deleteCandidate,
    onSuccess: () => {
      toast.success('Candidate deleted');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteId(null);
    },
  });

  const handleBulkDelete = async (ids: string[]) => {
    await Promise.allSettled(ids.map(id => cvService.deleteCandidate(id)));
    toast.success(`${ids.length} candidate${ids.length > 1 ? 's' : ''} deleted`);
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  };

  const handleDownload = async (id: string, name: string) => {
    try {
      const res = await cvService.downloadCV(id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = name || 'cv.pdf'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Could not download CV'); }
  };

  const handleExpandRow = useCallback((row: Candidate) => {
    if (isMobile) {
      navigate(`/cv-database/${row.id}`);
    } else {
      setExpandedCandidateId(prev => prev === row.id ? null : row.id);
    }
  }, [isMobile, navigate]);

  const candidates: Candidate[] = data?.data || [];
  const meta = data?.meta;

  // ── Fixed columns ─────────────────────────────────────────────────────────
  const fixedColumns: FixedColumn[] = [
    {
      key: 'name',
      label: 'Candidate',
      width: 240,
      sortable: true,
      csvValue: (row: Candidate) => `${row.firstName} ${row.lastName || ''}`.trim(),
      render: (row: Candidate) => {
        const initials = `${row.firstName[0]}${row.lastName?.[0] || ''}`.toUpperCase();
        const isExpanded = expandedCandidateId === row.id;
        return (
          <div className="flex items-center gap-2.5 min-w-0 group/name">
            {row.profilePhoto ? (
              <img src={`/uploads/${row.profilePhoto}`} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-semibold text-xs flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {row.firstName} {row.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate">{row.currentDesignation || 'No designation'}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleExpandRow(row); }}
              title="Quick view"
              className={cn(
                'flex-shrink-0 p-1 rounded-md transition-all ml-1',
                isExpanded
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 opacity-100'
                  : 'text-slate-400 dark:text-slate-500 opacity-0 group-hover/name:opacity-100 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
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
      csvValue: (row: Candidate) => `CV-${row.id.slice(0, 8).toUpperCase()}`,
      render: (row: Candidate) => (
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 select-all">
          CV-{row.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 110,
      sortable: true,
      csvValue: (row: Candidate) => row.status,
      render: (row: Candidate) => (
        <span className={cn('badge text-xs', getStatusColor(row.status))}>
          {row.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'currentLocation',
      label: 'Location',
      width: 130,
      sortable: true,
      csvValue: (row: Candidate) => row.currentLocation || '',
      render: (row: Candidate) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">{row.currentLocation || '—'}</span>
      ),
    },
    {
      key: 'totalExperience',
      label: 'Exp.',
      width: 80,
      sortable: true,
      csvValue: (row: Candidate) => row.totalExperience != null ? String(row.totalExperience) : '',
      render: (row: Candidate) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {row.totalExperience != null ? formatExperience(row.totalExperience) : '—'}
        </span>
      ),
    },
    {
      key: 'currentCTC',
      label: 'CTC',
      width: 100,
      sortable: true,
      csvValue: (row: Candidate) => row.currentCTC != null ? String(row.currentCTC) : '',
      render: (row: Candidate) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">{formatCTC(row.currentCTC)}</span>
      ),
    },
    {
      key: 'isPriority',
      label: '★',
      width: 40,
      render: (row: Candidate) => (
        <button
          onClick={(e) => { e.stopPropagation(); togglePriorityMutation.mutate(row.id); }}
          className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <Star size={14} className={row.isPriority ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-600'} />
        </button>
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
  const actionButtons: ActionButton[] = [
    {
      icon: <Eye size={14} />,
      label: 'View',
      onClick: (row: Candidate) => navigate(`/cv-database/${row.id}`),
    },
    ...(canAccess('cv:download') ? [{
      icon: <Download size={14} />,
      label: 'Download CV',
      onClick: (row: Candidate) => handleDownload(row.id, row.cvOriginalName || `${row.firstName}_cv.pdf`),
      show: (row: Candidate) => !!row.cvFile,
    }] : []),
    ...(canAccess('cv:update') ? [{
      icon: <Edit size={14} />,
      label: 'Edit',
      onClick: (row: Candidate) => navigate(`/cv-database/${row.id}/edit`),
    }] : []),
    ...(canAccess('cv:delete') ? [{
      icon: <Trash2 size={14} />,
      label: 'Delete',
      onClick: (row: Candidate) => setDeleteId(row.id),
      className: 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
    }] : []),
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('cv.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{meta?.total ?? 0} {t('cv.candidate').toLowerCase()}s</p>
        </div>
        <div className="flex gap-2">
          {/* Bulk Import dropdown */}
          <div ref={bulkMenuRef} className="relative">
            <button onClick={() => setBulkMenuOpen((v) => !v)} className="btn-secondary gap-1.5">
              <Upload size={16} />
              {t('cv.bulkImport')}
              <ChevronDown size={14} className={`transition-transform duration-200 ${bulkMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {bulkMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-30">
                <button
                  onClick={() => { setCsvImportOpen(true); setBulkMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet size={16} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium leading-none mb-0.5">Upload Structured CSV</p>
                    <p className="text-xs text-slate-400">Fill template &amp; import data</p>
                  </div>
                </button>
                <div className="mx-3 border-t border-slate-100 dark:border-slate-700" />
                <button
                  onClick={() => { navigate('/cv-database/bulk-import'); setBulkMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <Files size={16} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium leading-none mb-0.5">Import Bulk CV's</p>
                    <p className="text-xs text-slate-400">Upload PDF / Word files</p>
                  </div>
                </button>
              </div>
            )}
          </div>
          <button onClick={() => navigate('/cv-database/add')} className="btn-primary">
            <Plus size={16} /> {t('cv.addCV')}
          </button>
        </div>
        {csvImportOpen && <CSVImportModal onClose={() => setCsvImportOpen(false)} />}
      </div>

      {/* Search & Filters */}
      <div className="card p-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-60">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={`${t('common.search')}...`}
              className="form-input pl-9 w-full"
            />
          </div>
          <button
            onClick={() => setShowAdvSearch(!showAdvSearch)}
            className={cn('btn-secondary', showAdvSearch && 'border-primary-500 text-primary-700')}
          >
            <SlidersHorizontal size={16} />
            Filters
            <ChevronDown size={14} className={cn('transition-transform', showAdvSearch && 'rotate-180')} />
          </button>
        </div>

        {showAdvSearch && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label className="form-label text-xs">Gender</label>
              <select value={filters.gender} onChange={(e) => { setFilters({ ...filters, gender: e.target.value }); setPage(1); }} className="form-input">
                <option value="">All</option>
                {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Status</label>
              <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }} className="form-input">
                <option value="">All</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Min Experience (yrs)</label>
              <input type="number" value={filters.minExp} onChange={(e) => { setFilters({ ...filters, minExp: e.target.value }); setPage(1); }} className="form-input" placeholder="e.g. 2" />
            </div>
            <div>
              <label className="form-label text-xs">Max Experience (yrs)</label>
              <input type="number" value={filters.maxExp} onChange={(e) => { setFilters({ ...filters, maxExp: e.target.value }); setPage(1); }} className="form-input" placeholder="e.g. 10" />
            </div>
            <div>
              <label className="form-label text-xs">Location</label>
              <input value={filters.location} onChange={(e) => { setFilters({ ...filters, location: e.target.value }); setPage(1); }} className="form-input" placeholder="e.g. Mumbai" />
            </div>
            <div>
              <label className="form-label text-xs">Qualification</label>
              <input value={filters.qualification} onChange={(e) => { setFilters({ ...filters, qualification: e.target.value }); setPage(1); }} className="form-input" placeholder="e.g. B.Tech" />
            </div>
            <div>
              <label className="form-label text-xs">Priority Only</label>
              <select value={filters.isPriority} onChange={(e) => { setFilters({ ...filters, isPriority: e.target.value }); setPage(1); }} className="form-input">
                <option value="">All</option>
                <option value="true">Priority Only</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => { setFilters(DEFAULT_FILTERS); setPage(1); }} className="btn-secondary w-full">
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <DynamicTable
          module="cv"
          entityApiPath="/cv"
          data={candidates}
          isLoading={isLoading}
          fixedColumns={fixedColumns}
          actionButtons={actionButtons}
          sortField={sort.field}
          sortDir={sort.dir}
          onSort={(field, dir) => setSort({ field, dir })}
          queryKey={QUERY_KEY}
          excludeColumnNames={['status', 'priority', 'current_location', 'current_ctc', 'total_experience']}
          onBulkDelete={handleBulkDelete}
          onRowExpand={handleExpandRow}
          expandedRowId={expandedCandidateId}
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
        title="Delete Candidate"
        message="Are you sure you want to delete this candidate? This action cannot be undone."
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
      />

      {/* Candidate Quick-View Panel */}
      {expandedCandidateId && (
        <CandidateQuickPanel
          id={expandedCandidateId}
          onClose={() => setExpandedCandidateId(null)}
        />
      )}
    </div>
  );
}
