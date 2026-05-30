import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Mail, Paperclip, X, Send, CheckCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsService } from '../../services/settingsService';

type Mode = 'custom' | 'welcome';

export default function TestEmailView() {
  const [mode, setMode] = useState<Mode>('custom');

  // Custom email state
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('Test Email from HR Portal');
  const [body, setBody] = useState('<p>This is a test email sent from the HR Portal.</p>');
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Welcome email state
  const [welcomeTo, setWelcomeTo] = useState('');

  const [sent, setSent] = useState(false);

  const markSent = () => {
    setSent(true);
    toast.success('Email sent successfully');
    setTimeout(() => setSent(false), 4000);
  };

  const customMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('to', to);
      if (cc.trim()) fd.append('cc', cc.trim());
      fd.append('subject', subject);
      fd.append('body', body);
      if (attachment) fd.append('attachment', attachment);
      return settingsService.sendTestEmail(fd);
    },
    onSuccess: markSent,
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to send email'),
  });

  const welcomeMutation = useMutation({
    mutationFn: () => settingsService.sendTestWelcomeEmail(welcomeTo),
    onSuccess: markSent,
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to send email'),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <Mail size={18} className="text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Test Email</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Send a test email using the configured SMTP settings</p>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="card p-1 flex gap-1">
        {([['custom', 'Custom Email'], ['welcome', 'Test Welcome Email']] as [Mode, string][]).map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => setMode(val)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              mode === val
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom Email Form */}
      {mode === 'custom' && (
        <div className="card space-y-4">
          <div>
            <label className="form-label">To *</label>
            <input type="email" className="form-input" placeholder="recipient@example.com" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div>
            <label className="form-label">CC <span className="text-slate-400 font-normal">(optional)</span></label>
            <input type="text" className="form-input" placeholder="cc1@example.com, cc2@example.com" value={cc} onChange={e => setCc(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Subject *</label>
            <input type="text" className="form-input" placeholder="Email subject" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Body *</label>
            <textarea
              className="form-input min-h-[160px] resize-y font-mono text-sm"
              placeholder="Email body (HTML supported)"
              value={body}
              onChange={e => setBody(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-400">HTML is supported — e.g. <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">&lt;b&gt;bold&lt;/b&gt;</code></p>
          </div>
          <div>
            <label className="form-label">Attachment <span className="text-slate-400 font-normal">(optional, max 10 MB)</span></label>
            {attachment ? (
              <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                <Paperclip size={14} className="text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1">{attachment.name}</span>
                <span className="text-xs text-slate-400 flex-shrink-0">{(attachment.size / 1024).toFixed(0)} KB</span>
                <button type="button" onClick={() => { setAttachment(null); if (fileRef.current) fileRef.current.value = ''; }} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="mt-1 flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors w-full">
                <Paperclip size={14} /> Click to attach a file
              </button>
            )}
            <input ref={fileRef} type="file" className="hidden" onChange={e => setAttachment(e.target.files?.[0] ?? null)} />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
            {sent && <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400"><CheckCircle size={15} /> Sent</span>}
            <button type="button" className="btn-primary flex items-center gap-2" disabled={!to || !subject || !body || customMutation.isPending} onClick={() => customMutation.mutate()}>
              <Send size={15} />
              {customMutation.isPending ? 'Sending…' : 'Send Email'}
            </button>
          </div>
        </div>
      )}

      {/* Test Welcome Email Form */}
      {mode === 'welcome' && (
        <div className="card space-y-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">Preview the Welcome Email</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Sends the welcome email template with dummy data (name: John Doe, password: Demo@1234) to the address you enter below.</p>
          </div>
          <div>
            <label className="form-label">Send to *</label>
            <input
              type="email"
              className="form-input"
              placeholder="recipient@example.com"
              value={welcomeTo}
              onChange={e => setWelcomeTo(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
            {sent && <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400"><CheckCircle size={15} /> Sent</span>}
            <button type="button" className="btn-primary flex items-center gap-2" disabled={!welcomeTo || welcomeMutation.isPending} onClick={() => welcomeMutation.mutate()}>
              <Send size={15} />
              {welcomeMutation.isPending ? 'Sending…' : 'Send Welcome Email'}
            </button>
          </div>
        </div>
      )}

      {/* SMTP Info */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-1">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Current SMTP Config</p>
        <p className="text-xs text-slate-600 dark:text-slate-300"><span className="text-slate-400">Host:</span> Configured on server</p>
        <p className="text-xs text-slate-600 dark:text-slate-300"><span className="text-slate-400">From:</span> Configured via SMTP_FROM_NAME / SMTP_FROM_EMAIL env vars on server</p>
      </div>
    </div>
  );
}
