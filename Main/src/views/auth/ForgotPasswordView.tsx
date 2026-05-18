import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function ForgotPasswordView() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: () => { setSent(true); toast.success('Reset email sent if account exists'); },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-8">
          <ArrowLeft size={16} /> Back to login
        </Link>

        <div className="card p-8">
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-6">
            <Mail size={24} className="text-primary-700" />
          </div>

          {!sent ? (
            <>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Forgot Password</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Enter your email and we'll send a password reset link.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="form-input"
                  />
                </div>
                <button
                  onClick={() => mutation.mutate(email)}
                  disabled={!email || mutation.isPending}
                  className="btn-primary w-full justify-center"
                >
                  {mutation.isPending ? 'Sending...' : <><Send size={16} /> Send Reset Link</>}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <Mail size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Check your email</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                We sent a reset link to {email}. Check your inbox and follow the instructions.
              </p>
              <Link to="/login" className="btn-primary inline-flex">Back to Login</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
