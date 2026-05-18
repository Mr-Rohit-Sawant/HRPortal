import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, RefreshCw, KeyRound, Copy, Check } from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import Modal from '../common/Modal';
import { cn } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
}

function generatePassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const nums = '0123456789';
  const syms = '@#$!';
  const pool = upper + lower + nums + syms;
  let pwd = upper[Math.floor(Math.random() * upper.length)]
    + lower[Math.floor(Math.random() * lower.length)]
    + nums[Math.floor(Math.random() * nums.length)]
    + syms[Math.floor(Math.random() * syms.length)];
  for (let i = 4; i < 10; i++) pwd += pool[Math.floor(Math.random() * pool.length)];
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

export default function ResetPasswordModal({ isOpen, onClose, employeeId, employeeName }: Props) {
  const [generateMode, setGenerateMode] = useState(true);
  const [generatedPwd, setGeneratedPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGeneratedPwd(generatePassword());
      setNewPwd('');
      setConfirmPwd('');
      setGenerateMode(true);
      setShowNew(false);
      setShowConfirm(false);
      setCopied(false);
    }
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: (password: string) => employeeService.resetPassword(employeeId, password),
    onSuccess: () => {
      toast.success(`Password updated for ${employeeName}`);
      onClose();
    },
  });

  const handleSubmit = () => {
    if (generateMode) {
      mutation.mutate(generatedPwd);
      return;
    }
    if (newPwd.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (newPwd !== confirmPwd) { toast.error('Passwords do not match'); return; }
    mutation.mutate(newPwd);
  };

  const handleCopy = () => {
    const pwd = generateMode ? generatedPwd : newPwd;
    navigator.clipboard.writeText(pwd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activePassword = generateMode ? generatedPwd : newPwd;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Password" size="sm">
      <div className="space-y-5">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Set a new password for <span className="font-semibold text-slate-700 dark:text-slate-300">{employeeName}</span>.
        </p>

        {/* Generate toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Generate Password</p>
            <p className="text-xs text-slate-400 mt-0.5">Auto-create a strong random password</p>
          </div>
          <button
            type="button"
            onClick={() => setGenerateMode((v) => !v)}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors flex-shrink-0',
              generateMode ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600',
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
              generateMode ? 'translate-x-5' : 'translate-x-0.5',
            )} />
          </button>
        </div>

        {/* New Password field */}
        <div>
          <label className="form-label">New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={generateMode ? generatedPwd : newPwd}
              readOnly={generateMode}
              onChange={generateMode ? undefined : (e) => setNewPwd(e.target.value)}
              placeholder={generateMode ? '' : 'Enter new password'}
              className={cn(
                'form-input pr-20 font-mono',
                generateMode && 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400',
              )}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              {generateMode && (
                <button
                  type="button"
                  title="Regenerate"
                  onClick={() => setGeneratedPwd(generatePassword())}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <RefreshCw size={13} className="text-slate-400" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                {showNew ? <EyeOff size={13} className="text-slate-400" /> : <Eye size={13} className="text-slate-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Confirm Password field */}
        <div>
          <label className="form-label">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={generateMode ? generatedPwd : confirmPwd}
              readOnly={generateMode}
              onChange={generateMode ? undefined : (e) => setConfirmPwd(e.target.value)}
              placeholder={generateMode ? '' : 'Confirm new password'}
              className={cn(
                'form-input pr-10 font-mono',
                generateMode && 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400',
                !generateMode && confirmPwd && newPwd !== confirmPwd && 'border-red-400 focus:ring-red-400',
                !generateMode && confirmPwd && newPwd === confirmPwd && 'border-green-400 focus:ring-green-400',
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {showConfirm ? <EyeOff size={13} className="text-slate-400" /> : <Eye size={13} className="text-slate-400" />}
            </button>
          </div>
          {!generateMode && confirmPwd && newPwd !== confirmPwd && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
        </div>

        {/* Copy button */}
        {activePassword && (
          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 text-sm py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Password'}
          </button>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="btn-primary flex-1 justify-center"
          >
            {mutation.isPending
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <KeyRound size={15} />}
            Set Password
          </button>
        </div>
      </div>
    </Modal>
  );
}
