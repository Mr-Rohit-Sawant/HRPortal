import { useState } from 'react';
import { X, Loader2, Upload, Trash2, ChevronDown, Pencil } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { bugReportService } from '../../services/bugReportService';
import { useAuthStore } from '../../stores/authStore';
import ScreenshotAnnotator from './ScreenshotAnnotator';
import toast from 'react-hot-toast';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenshot: Blob | null;
}

const MAX_TOTAL = 10 * 1024 * 1024;

export default function BugReportModal({ isOpen, onClose, screenshot }: BugReportModalProps) {
  const { user } = useAuthStore();
  const [type, setType]           = useState('Bug');
  const [priority, setPriority]   = useState('medium');
  const [severity, setSeverity]   = useState('');
  const [description, setDescription] = useState('');
  const [module, setModule]       = useState('');
  const [browser, setBrowser]     = useState('');
  const [environment, setEnvironment] = useState('');
  const [device, setDevice]       = useState('');
  const [reproducibility, setReproducibility] = useState('');
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [annotatorOpen, setAnnotatorOpen] = useState(false);
  const [annotatedBlob, setAnnotatedBlob] = useState<Blob | null>(null);

  const activeScreenshot = annotatedBlob ?? screenshot;
  const screenshotUrl = activeScreenshot ? URL.createObjectURL(activeScreenshot) : null;
  const annotatorSrc  = screenshot ? URL.createObjectURL(annotatedBlob ?? screenshot) : null;

  const submitMutation = useMutation({
    mutationFn: (fd: FormData) => bugReportService.create(fd),
    onSuccess: () => {
      toast.success('Thanks! Your report has been submitted.');
      resetAndClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to submit report'),
  });

  const resetAndClose = () => {
    setType('Bug'); setPriority('medium'); setSeverity('');
    setDescription('');
    setModule(''); setBrowser(''); setEnvironment(''); setDevice(''); setReproducibility('');
    setExtraFiles([]); setShowAdvanced(false);
    setAnnotatedBlob(null); setAnnotatorOpen(false);
    onClose();
  };

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    const all = [...extraFiles, ...picked];
    const total = all.reduce((s, f) => s + f.size, 0) + (screenshot?.size || 0);
    if (total > MAX_TOTAL) { toast.error('Total attachments must be under 10MB'); return; }
    setExtraFiles(all);
  };

  const handleSubmit = () => {
    if (!description.trim()) { toast.error('Please describe the issue'); return; }
    const fd = new FormData();
    fd.append('type', type);
    fd.append('priority', priority);
    fd.append('description', description.trim());
    if (severity) fd.append('severity', severity);
    if (module.trim()) fd.append('module', module.trim());
    if (browser.trim()) fd.append('browser', browser.trim());
    if (environment.trim()) fd.append('environment', environment.trim());
    if (device.trim()) fd.append('device', device.trim());
    if (reproducibility) fd.append('reproducibility', reproducibility);
    if (user) {
      fd.append('reportedByEmail', user.email);
      fd.append('reportedByName', `${user.firstName} ${user.lastName}`.trim());
    }
    if (activeScreenshot) fd.append('files', activeScreenshot, 'screenshot.png');
    extraFiles.forEach((f) => fd.append('files', f));
    submitMutation.mutate(fd);
  };

  if (!isOpen) return null;

  if (annotatorOpen && annotatorSrc) {
    return (
      <ScreenshotAnnotator
        imageSrc={annotatorSrc}
        onSave={blob => { setAnnotatedBlob(blob); setAnnotatorOpen(false); }}
        onClose={() => setAnnotatorOpen(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50" onClick={resetAndClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Report a Bug / Suggestion</h2>
          <button onClick={resetAndClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {screenshotUrl && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="form-label mb-0">Captured Screenshot</label>
                <button
                  type="button"
                  onClick={() => setAnnotatorOpen(true)}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                  title="Annotate screenshot"
                >
                  <Pencil size={12} /> Edit & Annotate
                </button>
              </div>
              <div className="relative group">
                <img src={screenshotUrl} alt="screenshot" className="rounded-lg border border-slate-200 dark:border-slate-700 max-h-[180px] object-contain w-full bg-slate-50 dark:bg-slate-800" />
                <button
                  type="button"
                  onClick={() => setAnnotatorOpen(true)}
                  className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 group-hover:bg-black/30 transition-colors opacity-0 group-hover:opacity-100"
                  title="Annotate screenshot"
                >
                  <span className="flex items-center gap-1.5 text-white text-xs font-semibold bg-black/50 px-3 py-1.5 rounded-full">
                    <Pencil size={13} /> Annotate
                  </span>
                </button>
                {annotatedBlob && (
                  <span className="absolute top-1.5 right-1.5 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-medium">Annotated</span>
                )}
              </div>
            </div>
          )}

          {user && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Name:</span> {user.firstName} {user.lastName}</p>
            </div>
          )}

          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Type</label>
              <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="Bug">Bug</option>
                <option value="Improvement">Improvement</option>
                <option value="New Requirement">New Requirement</option>
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select className="form-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Description *</label>
            <textarea
              className="form-input min-h-[90px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue or suggestion in detail…"
            />
          </div>

          {/* Advanced fields toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <ChevronDown size={13} className={showAdvanced ? 'rotate-180' : ''} />
            {showAdvanced ? 'Hide' : 'Show'} additional details
          </button>

          {showAdvanced && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Severity</label>
                  <select className="form-input" value={severity} onChange={e => setSeverity(e.target.value)}>
                    <option value="">— None —</option>
                    <option value="critical">Critical</option>
                    <option value="major">Major</option>
                    <option value="minor">Minor</option>
                    <option value="trivial">Trivial</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Reproducibility</label>
                  <select className="form-input" value={reproducibility} onChange={e => setReproducibility(e.target.value)}>
                    <option value="">— None —</option>
                    <option value="always">Always</option>
                    <option value="sometimes">Sometimes</option>
                    <option value="rarely">Rarely</option>
                    <option value="unable">Unable to reproduce</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Module / Page</label>
                  <input className="form-input" value={module} onChange={e => setModule(e.target.value)} placeholder="e.g. Candidates" />
                </div>
                <div>
                  <label className="form-label">Browser</label>
                  <input className="form-input" value={browser} onChange={e => setBrowser(e.target.value)} placeholder="e.g. Chrome 120" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Environment</label>
                  <input className="form-input" value={environment} onChange={e => setEnvironment(e.target.value)} placeholder="e.g. Production" />
                </div>
                <div>
                  <label className="form-label">Device / OS</label>
                  <input className="form-input" value={device} onChange={e => setDevice(e.target.value)} placeholder="e.g. Windows 11" />
                </div>
              </div>
            </div>
          )}

          {/* Attachments */}
          <div>
            <label className="form-label">Attachments <span className="text-slate-400 font-normal">(images/videos, max 10MB)</span></label>
            <label className="flex items-center gap-2 text-sm text-primary-600 cursor-pointer hover:underline">
              <Upload size={14} /> Add files
              <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleAddFiles} />
            </label>
            {extraFiles.length > 0 && (
              <ul className="mt-2 space-y-1">
                {extraFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded px-2 py-1">
                    <span className="truncate">{f.name}</span>
                    <button onClick={() => setExtraFiles(extraFiles.filter((_, idx) => idx !== i))} className="text-red-500 ml-2"><Trash2 size={12} /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={resetAndClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
