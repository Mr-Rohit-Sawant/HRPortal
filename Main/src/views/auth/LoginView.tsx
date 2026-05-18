import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Sun, Moon, LogIn, Lock, Mail } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const schema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LoginView() {
  const [showPassword, setShowPassword] = useState(false);
  const { setUser } = useAuthStore();
  const { t } = useTranslation();
  const { isDark, toggleDark, appName, appLogo } = useThemeStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (res) => {
      const user = res.data.data?.user;
      if (user) {
        setUser(user);
        queryClient.setQueryData(['me'], user);
        toast.success(`Welcome back, ${user.firstName}!`);
        navigate('/dashboard');
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Invalid credentials'),
  });

  const onSubmit = (data: FormData) => loginMutation.mutate(data);

  return (
    <div className={`min-h-screen flex ${isDark ? 'dark' : ''}`}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-900 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-lg">HR</span>
            </div>
            <span className="text-white font-semibold text-xl">{appName || 'HR Recruitment System'}</span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Streamline Your<br />HR Operations
            </h2>
            <p className="text-blue-200 text-lg">
              Manage recruitment, employees, clients, and invoices from one powerful platform.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Active Candidates', value: '2,400+' },
            { label: 'Job Openings', value: '350+' },
            { label: 'Clients Served', value: '120+' },
            { label: 'Placements', value: '1,800+' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-blue-300 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white dark:bg-slate-900">
        {/* Dark mode toggle */}
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleDark}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary-800 flex items-center justify-center">
              <span className="text-white font-bold text-sm">HR</span>
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">{appName || 'HR System'}</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('auth.welcomeBack')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">{t('auth.login')}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="form-label">{t('auth.email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('email')}
                  type="text"
                  placeholder="Enter your email"
                  className="form-input pl-10"
                  autoComplete="username"
                />
              </div>
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label">{t('auth.password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="form-input pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input {...register('rememberMe')} type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary-600" />
                <span className="text-sm text-slate-600 dark:text-slate-400">{t('auth.rememberMe')}</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-700 dark:text-primary-400 hover:underline font-medium"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loginMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  {t('auth.login')}
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
            HR Recruitment Management System v1.0.0
          </p>
        </motion.div>
      </div>
    </div>
  );
}
