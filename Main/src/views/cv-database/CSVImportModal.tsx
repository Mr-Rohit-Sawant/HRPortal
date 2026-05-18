import { useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { X, Download, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cvService } from '../../services/cvService';
import { settingsService } from '../../services/settingsService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDefinition } from '../../types';
import toast from 'react-hot-toast';
import { cn } from '../../utils/helpers';
import api from '../../services/api';

// ── Standard field definitions ────────────────────────────────────────────────
// { fieldName (used as CSV column key), label (human-readable header) }

const STANDARD_FIELDS: { key: string; label: string }[] = [
  { key: 'firstName',           label: 'First Name' },
  { key: 'lastName',            label: 'Last Name' },
  { key: 'email',               label: 'Email' },
  { key: 'phone',               label: 'Phone' },
  { key: 'alternatePhone',      label: 'Alternate Phone' },
  { key: 'gender',              label: 'Gender (MALE/FEMALE/OTHER)' },
  { key: 'dateOfBirth',         label: 'Date of Birth (YYYY-MM-DD)' },
  { key: 'nationality',         label: 'Nationality' },
  { key: 'religion',            label: 'Religion' },
  { key: 'caste',               label: 'Caste' },
  { key: 'country',             label: 'Country' },
  { key: 'state',               label: 'State' },
  { key: 'city',                label: 'City' },
  { key: 'currentLocation',     label: 'Current Location' },
  { key: 'totalExperience',     label: 'Total Experience (years)' },
  { key: 'currentCTC',          label: 'Current CTC (annual)' },
  { key: 'expectedCTC',         label: 'Expected CTC (annual)' },
  { key: 'noticePeriod',        label: 'Notice Period (days)' },
  { key: 'highestQualification',label: 'Highest Qualification' },
  { key: 'specialization',      label: 'Specialization' },
  { key: 'university',          label: 'University' },
  { key: 'passingYear',         label: 'Passing Year' },
  { key: 'skills',              label: 'Skills (pipe-separated: React|Node.js)' },
  { key: 'certifications',      label: 'Certifications (pipe-separated)' },
  { key: 'technologyStack',     label: 'Tech Stack (pipe-separated)' },
  { key: 'languages',           label: 'Languages (pipe-separated)' },
  { key: 'preferredLocations',  label: 'Preferred Locations (pipe-separated)' },
  { key: 'experienceDetails',   label: 'Experience Details (JSON array)' },
  { key: 'educationDetails',    label: 'Education Details (JSON array)' },
  { key: 'source',              label: 'Source' },
  { key: 'status',              label: 'Status' },
  { key: 'notes',               label: 'Notes' },
];

const STANDARD_KEYS = new Set(STANDARD_FIELDS.map(f => f.key));

const PIPE_FIELDS = new Set(['skills', 'certifications', 'technologyStack', 'languages', 'preferredLocations']);

const SAMPLE_VALUES: Record<string, string> = {
  firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com',
  phone: '+919876543210', alternatePhone: '',
  gender: 'MALE', dateOfBirth: '1990-01-15', nationality: 'Indian',
  religion: 'Hindu', caste: 'General / Open',
  country: 'India', state: 'Maharashtra', city: 'Mumbai',
  currentLocation: 'Mumbai, Maharashtra',
  totalExperience: '5.5', currentCTC: '800000', expectedCTC: '1200000', noticePeriod: '30',
  highestQualification: 'B.Tech/B.E.', specialization: 'Computer Science',
  university: 'Mumbai University', passingYear: '2015',
  skills: 'React|Node.js|TypeScript', certifications: 'AWS Certified',
  technologyStack: 'MERN', languages: 'English|Hindi',
  preferredLocations: 'Mumbai|Pune',
  experienceDetails: '[{"designation":"Software Engineer","company":"ABC Corp","joiningDate":"2020-01-01","endDate":"","currentlyWorking":true,"skills":["React","Node.js"]}]',
  educationDetails: '[{"qualification":"B.Tech/B.E.","specialization":"Computer Science","university":"Mumbai University","passingYear":"2015"}]',
  source: 'LinkedIn', status: 'ACTIVE', notes: '',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImportResult {
  row: number;
  name: string;
  status: 'success' | 'error';
  message?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CSVImportModal({ onClose }: { onClose: () => void }) {
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const queryClient = useQueryClient();

  // Fetch custom columns so we can include them in the template
  const { data: customColsData } = useQuery({
    queryKey: ['columns', 'cv'],
    queryFn: async () => {
      const res = await settingsService.getColumns('cv');
      return (res.data.data || []) as ColumnDefinition[];
    },
  });

  const customCols = useMemo(() =>
    (customColsData || []).filter(c => c.isVisible),
    [customColsData]
  );

  const downloadTemplate = () => {
    // Build headers: standard field labels + custom column labels
    const headers = [
      ...STANDARD_FIELDS.map(f => f.label),
      ...customCols.map(c => c.label),
    ];
    // Build sample row: standard sample values + empty custom values
    const sampleRow = [
      ...STANDARD_FIELDS.map(f => {
        const v = SAMPLE_VALUES[f.key] ?? '';
        // Wrap in quotes if value contains commas
        return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      }),
      ...customCols.map(() => ''),
    ];

    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'candidate_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const processCSV = (file: File) => {
    setImporting(true);
    setResults([]);
    setProgress(0);

    // Build a map from label → fieldKey for standard fields
    const labelToKey: Record<string, string> = {};
    STANDARD_FIELDS.forEach(f => { labelToKey[f.label] = f.key; });

    // Build a map from label → column for custom fields
    const labelToCustomCol: Record<string, ColumnDefinition> = {};
    customCols.forEach(c => { labelToCustomCol[c.label] = c; });

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data: rows }) => {
        setTotal(rows.length);
        if (rows.length === 0) {
          toast.error('CSV file is empty or has no valid rows');
          setImporting(false);
          return;
        }

        const newResults: ImportResult[] = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const formData = new FormData();
          const customFieldValues: Record<string, string> = {};

          Object.entries(row).forEach(([header, val]) => {
            if (val === undefined || val === '') return;

            // Map label-based header to field key (handles both label and key formats)
            const fieldKey = labelToKey[header] ?? (STANDARD_KEYS.has(header) ? header : null);
            const customCol = labelToCustomCol[header] ?? customCols.find(c => c.name === header);

            if (fieldKey) {
              if (PIPE_FIELDS.has(fieldKey)) {
                const arr = val.split('|').map((s: string) => s.trim()).filter(Boolean);
                formData.append(fieldKey, JSON.stringify(arr));
              } else {
                formData.append(fieldKey, val);
              }
            } else if (customCol) {
              customFieldValues[customCol.name] = val;
            }
          });

          try {
            const createRes = await cvService.createCandidate(formData);
            const createdId = (createRes.data as any)?.data?.id;

            // Save custom field values separately
            if (createdId && Object.keys(customFieldValues).length > 0) {
              await Promise.allSettled(
                Object.entries(customFieldValues).map(([fieldName, value]) =>
                  api.patch(`/cv/${createdId}/custom-fields`, { fieldName, value })
                )
              );
            }

            const firstName = row['First Name'] || row['firstName'] || '';
            const lastName = row['Last Name'] || row['lastName'] || '';
            newResults.push({
              row: i + 1,
              name: [firstName, lastName].filter(Boolean).join(' ') || `Row ${i + 1}`,
              status: 'success',
            });
          } catch (err: any) {
            const firstName = row['First Name'] || row['firstName'] || '';
            const lastName = row['Last Name'] || row['lastName'] || '';
            newResults.push({
              row: i + 1,
              name: [firstName, lastName].filter(Boolean).join(' ') || `Row ${i + 1}`,
              status: 'error',
              message: err.response?.data?.message || 'Import failed',
            });
          }

          setProgress(i + 1);
          setResults([...newResults]);
        }

        setImporting(false);
        queryClient.invalidateQueries({ queryKey: ['candidates'] });

        const ok = newResults.filter((r) => r.status === 'success').length;
        if (ok > 0) toast.success(`${ok} candidate${ok > 1 ? 's' : ''} imported`);
      },
      error: () => {
        toast.error('Failed to parse CSV — make sure it matches the template format');
        setImporting(false);
      },
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    maxFiles: 1,
    disabled: importing,
    onDrop: (accepted) => { if (accepted[0]) processCSV(accepted[0]); },
  });

  const isDone = !importing && results.length > 0;
  const successCount = results.filter((r) => r.status === 'success').length;
  const errorCount = results.filter((r) => r.status === 'error').length;
  const totalCols = STANDARD_FIELDS.length + customCols.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Upload Structured CSV</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Download the template, fill candidate data, then upload
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={importing}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Step 1 — Download template */}
          <div className="flex items-center gap-3 p-3.5 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/50">
            <div className="w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-white">Download CSV Template</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {totalCols} columns — {STANDARD_FIELDS.length} standard
                {customCols.length > 0 && ` + ${customCols.length} custom`}
              </p>
            </div>
            <button onClick={downloadTemplate} className="btn-secondary text-xs py-1.5 flex-shrink-0 gap-1.5">
              <Download size={13} /> Template
            </button>
          </div>

          {/* Step 2 — Upload filled CSV */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-white mb-2">Upload Filled CSV</p>

              {!importing && results.length === 0 && (
                <div
                  {...getRootProps()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                    isDragActive
                      ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload size={22} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Drop your CSV here or{' '}
                    <span className="text-primary-600 dark:text-primary-400 font-medium">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Only .csv files · max 1 file</p>
                </div>
              )}

              {importing && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin text-primary-600" />
                      Importing candidates...
                    </span>
                    <span className="font-medium">{progress} / {total}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all duration-300"
                      style={{ width: total ? `${(progress / total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              )}

              {isDone && (
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-xs font-medium">
                    {successCount > 0 && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle size={12} /> {successCount} imported
                      </span>
                    )}
                    {errorCount > 0 && (
                      <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                        <AlertCircle size={12} /> {errorCount} failed
                      </span>
                    )}
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                    {results.map((r) => (
                      <div
                        key={r.row}
                        className={cn(
                          'flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg',
                          r.status === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        )}
                      >
                        {r.status === 'success'
                          ? <CheckCircle size={11} className="flex-shrink-0" />
                          : <AlertCircle size={11} className="flex-shrink-0" />}
                        <span className="font-medium truncate">{r.name}</span>
                        {r.message && (
                          <span className="ml-auto text-xs opacity-60 truncate max-w-[140px]" title={r.message}>
                            {r.message}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-400">
            {totalCols} columns supported
            {customCols.length > 0 && <span className="ml-1 text-primary-500">incl. {customCols.length} custom</span>}
          </p>
          <div className="flex gap-2">
            {isDone ? (
              <button onClick={onClose} className="btn-primary text-sm py-1.5">Done</button>
            ) : (
              <button onClick={onClose} disabled={importing} className="btn-secondary text-sm py-1.5">Cancel</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
