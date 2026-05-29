import { useState } from 'react';
import { FileText, Download, ChevronLeft, ChevronRight, File, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/helpers';

export interface DocFile {
  url: string;       // e.g. "/uploads/cvs/abc.pdf"
  name: string;      // display name, e.g. "Resume_John.pdf"
}

interface Props {
  files: DocFile[];
  initialIndex?: number;
  height?: number;          // fixed px height (overrides aspectRatio)
  aspectRatio?: string;     // e.g. "16/9" — scales with container width
  fillViewport?: boolean;   // sticky full-height mode — covers remaining screen on scroll
  viewportOffset?: number;  // px to subtract from 100vh (default 120)
  className?: string;
}

function getExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function isPDF(name: string) { return getExt(name) === 'pdf'; }
function isWord(name: string) { return ['doc', 'docx'].includes(getExt(name)); }

export default function DocumentViewer({ files, initialIndex = 0, height, aspectRatio = '16/9', fillViewport = false, viewportOffset = 120, className }: Props) {
  const [activeIdx, setActiveIdx] = useState(() => Math.min(initialIndex, files.length - 1));

  if (!files.length) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 text-slate-400', className)}>
        <FileText size={32} className="mb-2 opacity-30" />
        <p className="text-sm">No documents attached</p>
      </div>
    );
  }

  const file = files[activeIdx];
  const ext  = getExt(file.name);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    a.click();
  };

  return (
    <div className={cn('flex flex-col', fillViewport && 'sticky top-0', className)}>
      {/* File switcher tabs — only shown when multiple files */}
      {files.length > 1 && (
        <div className="flex items-center gap-1 px-1 pb-2 overflow-x-auto flex-shrink-0">
          {files.map((f, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0',
                i === activeIdx
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              )}
            >
              <FileText size={11} />
              <span className="max-w-[120px] truncate">{f.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-t-xl border border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={14} className="text-primary-500 flex-shrink-0" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 uppercase font-bold flex-shrink-0">{ext}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {files.length > 1 && (
            <>
              <button
                onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
                disabled={activeIdx === 0}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 text-slate-600 dark:text-slate-300"
                title="Previous file"
              ><ChevronLeft size={14} /></button>
              <span className="text-xs text-slate-500">{activeIdx + 1}/{files.length}</span>
              <button
                onClick={() => setActiveIdx(i => Math.min(files.length - 1, i + 1))}
                disabled={activeIdx === files.length - 1}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 text-slate-600 dark:text-slate-300"
                title="Next file"
              ><ChevronRight size={14} /></button>
            </>
          )}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
            title="Download"
          >
            <Download size={12} /> Download
          </button>
        </div>
      </div>

      {/* Viewer area */}
      <div
        className="border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-xl overflow-hidden bg-slate-50 dark:bg-slate-900 w-full"
        style={fillViewport
          ? { height: `calc(100vh - ${viewportOffset}px)` }
          : height ? { height } : { aspectRatio }
        }
      >
        {isPDF(file.name) ? (
          <iframe
            key={file.url}          /* remount on file change */
            src={`${file.url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
            className="w-full h-full border-0"
            title={file.name}
          />
        ) : isWord(file.name) ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
            <File size={48} className="text-blue-400" />
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{file.name}</p>
              <p className="text-xs text-slate-400 mt-1">Word documents cannot be previewed in the browser.</p>
            </div>
            <button
              onClick={handleDownload}
              className="btn-primary text-sm px-4 py-2"
            >
              <Download size={14} /> Download to View
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
            <AlertCircle size={36} className="text-slate-300" />
            <p className="text-sm text-slate-500">Preview not available for this file type</p>
            <button onClick={handleDownload} className="btn-secondary text-xs">
              <Download size={12} /> Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
