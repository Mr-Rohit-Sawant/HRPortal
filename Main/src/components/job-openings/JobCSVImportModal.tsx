import { useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { X, Download, Upload, CheckCircle, AlertCircle, Loader2, Building2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { jobService } from '../../services/jobService';
import { clientService } from '../../services/clientService';
import { settingsService } from '../../services/settingsService';
import { ColumnDefinition } from '../../types';
import { cn } from '../../utils/helpers';
import toast from 'react-hot-toast';
import api from '../../services/api';
import BusinessSearchSelect from '../common/BusinessSearchSelect';

const STANDARD_FIELDS = [
  { key: 'jobTitle',          label: 'Job Title' },
  { key: 'clientName',        label: 'Client Company Name' },
  { key: 'description',       label: 'Description' },
  { key: 'workLocation',      label: 'Work Location' },
  { key: 'workMode',          label: 'Work Mode (Remote/Hybrid/Onsite)' },
  { key: 'jobType',           label: 'Job Type (FULL_TIME/PART_TIME/CONTRACT)' },
  { key: 'experienceMin',     label: 'Experience Min (years)' },
  { key: 'experienceMax',     label: 'Experience Max (years)' },
  { key: 'salaryMin',         label: 'Salary Min' },
  { key: 'salaryMax',         label: 'Salary Max' },
  { key: 'numberOfOpenings',  label: 'Number of Openings' },
  { key: 'status',            label: 'Status (ACTIVE/CLOSED/ON_HOLD/DRAFT)' },
  { key: 'priority',          label: 'Priority (LOW/MEDIUM/HIGH/URGENT)' },
  { key: 'closingDate',       label: 'Closing Date (YYYY-MM-DD)' },
  { key: 'requiredSkills',    label: 'Required Skills (pipe-separated)' },
  { key: 'preferredSkills',   label: 'Preferred Skills (pipe-separated)' },
  { key: 'tags',              label: 'Tags (pipe-separated)' },
];

const STANDARD_KEYS = new Set(STANDARD_FIELDS.map(f => f.key));

const SAMPLE_VALUES: Record<string, string> = {
  jobTitle: 'Senior React Developer', clientName: 'Acme Corp',
  description: 'Looking for an experienced React developer',
  workLocation: 'Mumbai', workMode: 'Hybrid', jobType: 'FULL_TIME',
  experienceMin: '3', experienceMax: '8', salaryMin: '1000000', salaryMax: '2000000',
  numberOfOpenings: '2', status: 'ACTIVE', priority: 'HIGH',
  closingDate: '2025-12-31', requiredSkills: 'React|TypeScript|Node.js',
  preferredSkills: 'GraphQL|Docker', tags: 'urgent|remote-ok',
};

interface ImportResult { row: number; name: string; status: 'success' | 'error'; message?: string; }

export default function JobCSVImportModal({ onClose }: { onClose: () => void }) {
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.isSuperAdmin ?? false;
  const [selectedBusinessId, setSelectedBusinessId] = useState('');

  const { data: customColsData } = useQuery({
    queryKey: ['columns', 'jobs'],
    queryFn: async () => { const res = await settingsService.getColumns('jobs'); return (res.data.data || []) as ColumnDefinition[]; },
  });
  const customCols = useMemo(() => (customColsData || []).filter(c => c.isVisible), [customColsData]);

  const downloadTemplate = () => {
    const headers = [...STANDARD_FIELDS.map(f => f.label), ...customCols.map(c => c.label)];
    const sample = [...STANDARD_FIELDS.map(f => {
      const v = SAMPLE_VALUES[f.key] ?? '';
      return v.includes(',') ? `"${v}"` : v;
    }), ...customCols.map(() => '')];
    const csv = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'job_openings_import_template.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const labelToKey: Record<string, string> = {};
  STANDARD_FIELDS.forEach(f => { labelToKey[f.label] = f.key; });

  const processCSV = (file: File) => {
    setImporting(true); setResults([]); setProgress(0);
    const labelToCustomCol: Record<string, ColumnDefinition> = {};
    customCols.forEach(c => { labelToCustomCol[c.label] = c; });

    Papa.parse<Record<string, string>>(file, {
      header: true, skipEmptyLines: true,
      complete: async ({ data: rows }) => {
        setTotal(rows.length);
        if (!rows.length) { toast.error('CSV is empty'); setImporting(false); return; }
        const newResults: ImportResult[] = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const jobData: Record<string, any> = {};
          const customFieldValues: Record<string, string> = {};

          Object.entries(row).forEach(([header, val]) => {
            if (!val) return;
            const fieldKey = labelToKey[header] ?? (STANDARD_KEYS.has(header) ? header : null);
            const customCol = labelToCustomCol[header] ?? customCols.find(c => c.name === header);
            if (fieldKey) jobData[fieldKey] = val;
            else if (customCol) customFieldValues[customCol.name] = val;
          });

          const bizId = isSuperAdmin ? selectedBusinessId : (user?.businessId || '');

          const name = jobData.jobTitle || `Row ${i + 1}`;

          try {
            const res = await jobService.importJobsCSV([jobData], bizId || undefined);
            const { created, errors: errs } = res.data.data;
            if (created > 0) {
              newResults.push({ row: i + 1, name, status: 'success' });
            } else {
              newResults.push({ row: i + 1, name, status: 'error', message: errs[0]?.error || 'Import failed' });
            }
          } catch (err: any) {
            newResults.push({ row: i + 1, name, status: 'error', message: err.response?.data?.message || 'Import failed' });
          }

          setProgress(i + 1); setResults([...newResults]);
        }

        setImporting(false);
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        const ok = newResults.filter(r => r.status === 'success').length;
        if (ok > 0) toast.success(`${ok} job opening${ok > 1 ? 's' : ''} imported`);
      },
      error: () => { toast.error('Failed to parse CSV'); setImporting(false); },
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    maxFiles: 1, disabled: importing,
    onDrop: (accepted) => { if (accepted[0]) processCSV(accepted[0]); },
  });

  const isDone = !importing && results.length > 0;
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const totalCols = STANDARD_FIELDS.length + customCols.length;
  const canProceed = !isSuperAdmin || !!selectedBusinessId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg">
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Import Job Openings via CSV</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Download the template, fill job data, then upload</p>
          </div>
          <button onClick={onClose} disabled={importing} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          {isSuperAdmin && (
            <div className="flex items-center gap-3 p-3.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50">
              <Building2 size={16} className="text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Business *</p>
                <BusinessSearchSelect
                  value={selectedBusinessId}
                  onChange={setSelectedBusinessId}
                  disabled={importing}
                />
              </div>
            </div>
          )}

          {!canProceed ? (
            <p className="text-center text-sm text-slate-400 py-4">Select a business above to continue</p>
          ) : (<>
            <div className="flex items-center gap-3 p-3.5 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/50">
              <div className="w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-white">Download CSV Template</p>
                <p className="text-xs text-slate-500 mt-0.5">{totalCols} columns{customCols.length > 0 ? ` (${customCols.length} custom)` : ''} — Client Company Name must match an existing client</p>
              </div>
              <button onClick={downloadTemplate} className="btn-secondary text-xs py-1.5 flex-shrink-0 gap-1.5"><Download size={13} /> Template</button>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-white mb-2">Upload Filled CSV</p>
                {!importing && !isDone && (
                  <div {...getRootProps()} className={cn('border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors', isDragActive ? 'border-primary-400 bg-primary-50' : 'border-slate-200 dark:border-slate-600 hover:border-primary-300 hover:bg-slate-50 dark:hover:bg-slate-700/30')}>
                    <input {...getInputProps()} />
                    <Upload size={22} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Drop your CSV here or <span className="text-primary-600 font-medium">browse</span></p>
                    <p className="text-xs text-slate-400 mt-1">Only .csv · max 1 file</p>
                  </div>
                )}
                {importing && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5"><Loader2 size={12} className="animate-spin text-primary-600" />Importing jobs...</span>
                      <span className="font-medium">{progress} / {total}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-600 rounded-full transition-all duration-300" style={{ width: total ? `${(progress / total) * 100}%` : '0%' }} />
                    </div>
                  </div>
                )}
                {isDone && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-xs font-medium">
                      {successCount > 0 && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={12} />{successCount} imported</span>}
                      {errorCount > 0 && <span className="flex items-center gap-1 text-red-500"><AlertCircle size={12} />{errorCount} failed</span>}
                    </div>
                    <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                      {results.map(r => (
                        <div key={r.row} className={cn('flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg', r.status === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' : 'bg-red-50 dark:bg-red-900/20 text-red-600')}>
                          {r.status === 'success' ? <CheckCircle size={11} className="flex-shrink-0" /> : <AlertCircle size={11} className="flex-shrink-0" />}
                          <span className="font-medium truncate">{r.name}</span>
                          {r.message && <span className="ml-auto text-xs opacity-60 truncate max-w-[140px]">{r.message}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>)}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-400">{totalCols} columns{customCols.length > 0 && <span className="ml-1 text-primary-500">incl. {customCols.length} custom</span>}</p>
          <div className="flex gap-2">
            {isDone ? <button onClick={onClose} className="btn-primary text-sm py-1.5">Done</button>
              : <button onClick={onClose} disabled={importing} className="btn-secondary text-sm py-1.5">Cancel</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
