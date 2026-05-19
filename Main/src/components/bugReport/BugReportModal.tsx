import { useState } from 'react';
import { X, Loader2, Upload, Trash2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { bugReportService } from '../../services/bugReportService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenshot: Blob | null;
}

const MAX_TOTAL = 10 * 1024 * 1024; // 10MB

export default function BugReportModal({ isOpen, onClose, screenshot }: BugReportModalProps) {
  const { user } = useAuthStore();
  const [type, setType] = useState('Bug');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [extraFiles, setExtraFiles] = useState<File[]>([]);

  const screenshotUrl = screenshot ? URL.createObjectURL(screenshot) : null;

  const submitMutation = useMutation({
    mutationFn: (fd: FormData) => bugReportService.create(fd),
    onSuccess: () => {
      toast.success('Thanks! Your report has been submitted.');
      resetAndClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to submit report'),
  });

  const resetAndClose = () => {
    setType('Bug');
    setPriority('medium');
    setDescription('');
    setExtraFiles([]);
    onClose();
  };

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    const all = [...extraFiles, ...picked];
    const total = all.reduce((s, f) => s + f.size, 0) + (screenshot?.size || 0);
    if (total > MAX_TOTAL) {
      toast.error('Total attachments must be under 10MB');
      return;
    }
    setExtraFiles(all);
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      toast.error('Please describe the issue');
      return;
    }
    const fd = new FormData();
    fd.append('type', type);
    fd.append('priority', priority);
    fd.append('description', description.trim());
    if (user) {
      fd.append('reportedByEmail', user.email);
      fd.append('reportedByName', `${user.firstName} ${user.lastName}`.trim());
    }
    if (screenshot) {
      fd.append('files', screenshot, 'screenshot.png');
    }
    extraFiles.forEach((f) => fd.append('files', f));
    submitMutation.mutate(fd);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50" onClick={resetAndClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
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
              <label className="form-label">Captured Screenshot</label>
              <img src={screenshotUrl} alt="screenshot" className="rounded-lg border border-slate-200 dark:border-slate-700 max-h-[200px] object-contain w-full bg-slate-50 dark:bg-slate-800" />
            </div>
          )}

          {user && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Name:</span> {user.firstName} {user.lastName}</p>
            </div>
          )}

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

          <div>
            <label className="form-label">Description *</label>
            <textarea
              className="form-input min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue or suggestion in detail…"
            />
          </div>

          <div>
            <label className="form-label">Attachments (images/videos, max 10MB total)</label>
            <label className="flex items-center gap-2 text-sm text-primary-600 cursor-pointer hover:underline">
              <Upload size={14} /> Add files
              <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleAddFiles} />
            </label>
            {extraFiles.length > 0 && (
              <ul className="mt-2 space-y-1">
                {extraFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded px-2 py-1">
                    <span className="truncate">{f.name}</span>
                    <button onClick={() => setExtraFiles(extraFiles.filter((_, idx) => idx !== i))} className="text-red-500 ml-2">
                      <Trash2 size={12} />
                    </button>
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
