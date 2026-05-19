import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cvService } from '../../services/cvService';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cn } from '../../utils/helpers';

type FileStatus = 'pending' | 'processing' | 'success' | 'error';

interface FileItem {
  file: File;
  status: FileStatus;
  progress: number;
  candidateName?: string;
  confidence?: number;
  error?: string;
}

export default function CVBulkImportView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 50,
    disabled: isProcessing,
    onDrop: (accepted) => {
      setFiles(accepted.map((f) => ({ file: f, status: 'pending', progress: 0 })));
    },
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Poll for bulk import status
  useEffect(() => {
    if (!jobId || isComplete) return;

    const interval = setInterval(async () => {
      try {
        const res = await cvService.getBulkImportStatus(jobId);
        const { status, results } = res.data.data!;

        if (status === 'completed') {
          setIsComplete(true);
          clearInterval(interval);

          // Update file statuses
          setFiles((prev) =>
            prev.map((f, i) => {
              const result = results[i];
              if (!result) return f;
              return {
                ...f,
                status: result.status === 'success' ? 'success' : 'error',
                progress: 100,
                candidateName: result.candidateName,
                confidence: result.confidence,
                error: result.error,
              };
            })
          );

          const successCount = results.filter((r: any) => r.status === 'success').length;
          const errorCount = results.filter((r: any) => r.status === 'error').length;

          toast.success(`Import complete: ${successCount} imported${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
          queryClient.invalidateQueries({ queryKey: ['candidates'] });
          setIsProcessing(false);
        } else {
          // Still processing — simulate per-file progress
          setFiles((prev) =>
            prev.map((f, i) => {
              if (f.status === 'success' || f.status === 'error') return f;
              const processed = results.length;
              if (i < processed) {
                const result = results[i];
                return {
                  ...f,
                  status: result.status === 'success' ? 'success' : 'error',
                  progress: 100,
                  candidateName: result.candidateName,
                  confidence: result.confidence,
                  error: result.error,
                };
              }
              if (i === processed) {
                return { ...f, status: 'processing', progress: Math.min(90, f.progress + 20) };
              }
              return f;
            })
          );
        }
      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, isComplete, queryClient]);

  // Prevent tab close during processing
  useEffect(() => {
    if (!isProcessing) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'CV import is in progress. Are you sure you want to leave?';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isProcessing]);

  const handleImport = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setIsComplete(false);

    const fd = new FormData();
    files.forEach((f) => fd.append('files', f.file));

    // Set all as processing
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'processing', progress: 10 })));

    try {
      const res = await cvService.bulkImport(fd, (p) => setUploadProgress(p));
      const { jobId: newJobId } = res.data.data!;
      setJobId(newJobId);

      // Update first file as active
      setFiles((prev) =>
        prev.map((f, i) => (i === 0 ? { ...f, progress: 30 } : f))
      );
    } catch {
      setIsProcessing(false);
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'error', error: 'Upload failed' })));
    }
  };

  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const processingCount = files.filter((f) => f.status === 'processing').length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => {
            if (isProcessing) {
              if (!window.confirm('Import in progress. Leave anyway?')) return;
            }
            navigate('/cv-database');
          }}
          className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Bulk CV Import</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload multiple CVs — AI will extract candidate details automatically
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="xl:col-span-2 space-y-5">
          {!isProcessing && (
            <div className="card p-6">
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all',
                  isDragActive
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.01]'
                    : 'border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                )}
              >
                <input {...getInputProps()} />
                <Upload size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-base font-medium text-slate-700 dark:text-slate-300">
                  {isDragActive ? 'Drop CVs here...' : 'Drag & drop CV files here'}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  or <span className="text-primary-600 font-medium cursor-pointer">browse files</span>
                </p>
                <p className="text-xs text-slate-400 mt-3">PDF or Word documents only • Up to 50 files • 10MB each</p>
              </div>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="card">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  Files ({files.length})
                </span>
                {isComplete && (
                  <div className="flex gap-3 text-xs">
                    <span className="text-green-600 font-medium">{successCount} imported</span>
                    {errorCount > 0 && <span className="text-red-600 font-medium">{errorCount} failed</span>}
                  </div>
                )}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-96 overflow-y-auto">
                {files.map((f, i) => (
                  <div key={i} className="p-4 flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {f.status === 'pending' && <FileText size={20} className="text-slate-400" />}
                      {f.status === 'processing' && <Loader2 size={20} className="text-blue-500 animate-spin" />}
                      {f.status === 'success' && <CheckCircle size={20} className="text-green-500" />}
                      {f.status === 'error' && <AlertCircle size={20} className="text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                          {f.status === 'processing' ? (
                            <span>File {i + 1} Processing... {f.candidateName && `— ${f.candidateName}`}</span>
                          ) : f.status === 'success' ? (
                            <span className="text-green-700 dark:text-green-400">
                              {f.candidateName || f.file.name}
                            </span>
                          ) : f.status === 'error' ? (
                            <span className="text-red-600">{f.file.name}</span>
                          ) : (
                            f.file.name
                          )}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {f.confidence && f.status === 'success' && (
                            <span className="text-xs text-green-600 font-medium">{f.confidence}%</span>
                          )}
                          {f.status === 'pending' && !isProcessing && (
                            <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500">
                              <X size={14} />
                            </button>
                          )}
                          {f.status === 'processing' && (
                            <span className="text-xs text-blue-500 font-medium">{f.progress}%</span>
                          )}
                        </div>
                      </div>
                      {f.status === 'processing' && (
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${f.progress}%` }}
                          />
                        </div>
                      )}
                      {f.error && <p className="text-xs text-red-500 mt-0.5">{f.error}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Summary */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Import Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Files</span>
                <span className="font-medium">{files.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Pending</span>
                <span className="font-medium text-slate-600">{pendingCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Processing</span>
                <span className="font-medium text-blue-600">{processingCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Imported</span>
                <span className="font-medium text-green-600">{successCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Failed</span>
                <span className="font-medium text-red-600">{errorCount}</span>
              </div>
            </div>

            {isProcessing && !isComplete && (
              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-1">Upload Progress: {uploadProgress}%</p>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">How It Works</h3>
            <ol className="space-y-2">
              {[
                'Upload PDF or Word CV files',
                'AI reads each CV carefully',
                'Extracts all candidate details',
                'Creates candidate profiles automatically',
                'Original files attached to profiles',
              ].map((step, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {!isComplete ? (
              <button
                onClick={handleImport}
                disabled={files.length === 0 || isProcessing}
                className="btn-primary justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Start Import ({files.length} {files.length === 1 ? 'file' : 'files'})
                  </>
                )}
              </button>
            ) : (
              <button onClick={() => navigate('/cv-database')} className="btn-primary justify-center">
                <CheckCircle size={16} />
                View Imported Candidates
              </button>
            )}
            {!isProcessing && (
              <button onClick={() => navigate('/cv-database')} className="btn-secondary justify-center">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
