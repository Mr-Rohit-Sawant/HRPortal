import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Edit2, Bug, Clock, User, Building2,
         Monitor, Globe, Cpu, RefreshCw, Tag, ChevronDown, Image } from 'lucide-react';
import { bugReportService } from '../../services/bugReportService';
import { formatDateTime, timeAgo, cn } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface BugFile { url: string; mimeType?: string; originalName?: string; }
interface BugReport {
  id: string; type: string; description: string; status: string;
  priority: string; severity?: string; module?: string; browser?: string;
  environment?: string; device?: string; reproducibility?: string;
  tags?: string[]; resolution?: string; assignedToId?: string;
  reportedByEmail: string; reportedByName?: string;
  businessId?: string; businessName?: string;
  files?: BugFile[]; createdAt: string; updatedAt: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
  assignedTo?: { id: string; firstName: string; lastName: string; email: string };
  business?: { id: string; name: string };
}
interface StatusLabel { id: string; name: string; color: string; }

interface Props {
  bugId: string;
  onClose: () => void;
  onOpenLightbox: (imgs: BugFile[], index: number) => void;
  statusLabels: StatusLabel[];
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  low: 'text-green-600 bg-green-50 dark:bg-green-900/20',
};
const TYPE_COLORS: Record<string, string> = {
  Bug: 'bg-red-100 text-red-700',
  Improvement: 'bg-blue-100 text-blue-700',
  'New Requirement': 'bg-green-100 text-green-700',
};

function InlineEdit({ value, onSave, multiline = false, className = '' }: {
  value: string; onSave: (v: string) => void; multiline?: boolean; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value);

  useEffect(() => { setVal(value); }, [value]);

  const save = () => { setEditing(false); if (val !== value) onSave(val); };

  if (editing) {
    return multiline ? (
      <textarea
        autoFocus value={val} onChange={e => setVal(e.target.value)}
        onBlur={save}
        className={cn('form-input text-sm w-full min-h-[80px] resize-y', className)}
      />
    ) : (
      <input
        autoFocus value={val} onChange={e => setVal(e.target.value)}
        onBlur={save} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        className={cn('form-input text-sm w-full', className)}
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="group flex items-start gap-1.5 cursor-pointer rounded hover:bg-slate-50 dark:hover:bg-slate-700/40 px-1 py-0.5 -mx-1"
    >
      <span className={cn('text-sm text-slate-700 dark:text-slate-200 flex-1', !value && 'text-slate-400 italic')}>
        {value || 'Click to edit…'}
      </span>
      <Edit2 size={11} className="opacity-0 group-hover:opacity-60 flex-shrink-0 mt-0.5 text-slate-400" />
    </div>
  );
}

function SelectEdit({ value, options, onSave, className = '' }: {
  value: string; options: { value: string; label: string }[];
  onSave: (v: string) => void; className?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onSave(e.target.value)}
      className={cn('form-input text-sm py-1', className)}
    >
      <option value="">— None —</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export default function BugDetailPanel({ bugId, onClose, onOpenLightbox, statusLabels }: Props) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['bug-report', bugId],
    queryFn: async () => {
      const res = await bugReportService.getById(bugId);
      return res.data.data as BugReport;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => bugReportService.update(bugId, payload),
    onSuccess: (res) => {
      queryClient.setQueryData(['bug-report', bugId], res.data.data);
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
    },
    onError: () => toast.error('Failed to save'),
  });

  const save = (field: string) => (value: unknown) => updateMutation.mutate({ [field]: value });

  if (isLoading || !data) {
    return (
      <div className="fixed inset-y-0 right-0 z-40 w-[480px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const images = (data.files || []).filter(f => !f.mimeType || f.mimeType.startsWith('image/'));
  const otherFiles = (data.files || []).filter(f => f.mimeType && !f.mimeType.startsWith('image/'));
  const statusLabel = statusLabels.find(s => s.id === data.status || s.name.toLowerCase() === data.status.toLowerCase());

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[520px] max-w-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Bug size={16} className="text-primary-600 flex-shrink-0" />
          <span className="text-sm font-semibold text-slate-800 dark:text-white">Bug Report</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 flex-shrink-0">
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {/* Screenshots — pinned to top */}
        {images.length > 0 && (
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"><Image size={10} /> Screenshots ({images.length})</label>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => onOpenLightbox(images, idx)}
                  className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-primary-400 transition-colors group"
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status + Priority + Type row */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 items-center">
          {/* Status badge */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Status:</span>
            <div className="relative">
              <select
                value={data.status}
                onChange={e => save('status')(e.target.value)}
                className="appearance-none text-xs font-semibold px-2.5 py-1 rounded-full border-0 pr-6 cursor-pointer focus:ring-2 focus:ring-primary-500/30"
                style={{
                  backgroundColor: (statusLabel?.color || '#6B7280') + '20',
                  color: statusLabel?.color || '#6B7280',
                }}
              >
                {statusLabels.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                {!statusLabels.find(s => s.id === data.status) && (
                  <option value={data.status}>{data.status}</option>
                )}
              </select>
              <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: statusLabel?.color || '#6B7280' }} />
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Priority:</span>
            <select
              value={data.priority}
              onChange={e => save('priority')(e.target.value)}
              className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer capitalize', PRIORITY_COLORS[data.priority])}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Type */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Type:</span>
            <select
              value={data.type}
              onChange={e => save('type')(e.target.value)}
              className={cn('text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer', TYPE_COLORS[data.type] || 'bg-slate-100 text-slate-600')}
            >
              <option value="Bug">Bug</option>
              <option value="Improvement">Improvement</option>
              <option value="New Requirement">New Requirement</option>
            </select>
          </div>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Description</label>
            <InlineEdit value={data.description} onSave={save('description')} multiline />
          </div>

          {/* Resolution */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Resolution / Notes</label>
            <InlineEdit value={data.resolution || ''} onSave={save('resolution')} multiline />
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Severity</label>
              <SelectEdit value={data.severity || ''} onSave={save('severity')} options={[
                { value: 'critical', label: 'Critical' }, { value: 'major', label: 'Major' },
                { value: 'minor', label: 'Minor' },       { value: 'trivial', label: 'Trivial' },
              ]} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Reproducibility</label>
              <SelectEdit value={data.reproducibility || ''} onSave={save('reproducibility')} options={[
                { value: 'always', label: 'Always' }, { value: 'sometimes', label: 'Sometimes' },
                { value: 'rarely', label: 'Rarely' }, { value: 'unable', label: 'Unable to reproduce' },
              ]} />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1"><Monitor size={10} /> Environment</label>
              <InlineEdit value={data.environment || ''} onSave={save('environment')} />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1"><Globe size={10} /> Browser</label>
              <InlineEdit value={data.browser || ''} onSave={save('browser')} />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1"><Cpu size={10} /> Device</label>
              <InlineEdit value={data.device || ''} onSave={save('device')} />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1"><Tag size={10} /> Module</label>
              <InlineEdit value={data.module || ''} onSave={save('module')} />
            </div>
          </div>

          {/* Tags */}
          {data.tags && data.tags.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {data.tags.map((t, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Reporter + Assignee */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1"><User size={10} /> Reported By</label>
              <p className="text-xs text-slate-700 dark:text-slate-300">{data.reportedByName || data.reportedByEmail}</p>
              <p className="text-[10px] text-slate-400">{data.reportedByEmail}</p>
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1"><User size={10} /> Assigned To</label>
              {data.assignedTo
                ? <p className="text-xs text-slate-700 dark:text-slate-300">{data.assignedTo.firstName} {data.assignedTo.lastName}</p>
                : <p className="text-xs text-slate-400 italic">Unassigned</p>
              }
            </div>
          </div>

          {/* Business */}
          {data.business && (
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1"><Building2 size={10} /> Business</label>
              <p className="text-xs text-primary-600">{data.business.name}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Clock size={10} /> Created {timeAgo(data.createdAt)}</span>
            <span className="flex items-center gap-1"><RefreshCw size={10} /> Updated {timeAgo(data.updatedAt)}</span>
          </div>

          {/* Other files */}
          {otherFiles.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Attachments</label>
              <div className="space-y-1">
                {otherFiles.map((f, i) => (
                  <a key={i} href={f.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 transition-colors">
                    <span className="truncate">{f.originalName || f.url.split('/').pop()}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
        <span className="text-xs text-slate-400">{formatDateTime(data.createdAt)}</span>
        {updateMutation.isPending && <span className="text-xs text-primary-500 animate-pulse">Saving…</span>}
      </div>
    </div>
  );
}
