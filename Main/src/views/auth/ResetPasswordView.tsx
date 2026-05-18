import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function ResetPasswordView() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => authService.resetPassword(token, password),
    onSuccess: () => {
      toast.success('Password reset successfully');
      navigate('/login');
    },
  });

  const valid = password.length >= 8 && password === confirm;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 mb-8">
          <ArrowLeft size={16} /> Back to login
        </Link>
        <div className="card p-8">
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-6">
            <Lock size={24} className="text-primary-700" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Reset Password</h1>
          <p className="text-slate-500 text-sm mb-6">Enter your new password below.</p>

          {!token ? (
            <p className="text-red-500 text-sm">Invalid or expired reset link. Please request a new one.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="form-label">New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="form-input pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="form-input"
                />
                {confirm && password !== confirm && <p className="form-error">Passwords do not match</p>}
              </div>
              <button
                onClick={() => mutation.mutate()}
                disabled={!valid || mutation.isPending}
                className="btn-primary w-full justify-center"
              >
                {mutation.isPending ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
