import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  value: string;
  className?: string;
}

export default function CopyButton({ value, className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handle}
      title={copied ? 'Copied!' : 'Copy'}
      className={`flex-shrink-0 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${className}`}
    >
      {copied
        ? <Check size={12} className="text-green-500" />
        : <Copy size={12} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />}
    </button>
  );
}
