import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Loader2, Building2, Users, Briefcase, FileText, Building,
  Mail, Calendar, KeyRound,
} from 'lucide-react';
import { businessService } from '../../services/businessService';
import ResetPasswordModal from '../../components/employees/ResetPasswordModal';
import { formatDate, cn } from '../../utils/helpers';

interface BusinessUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  createdAt: string;
  role?: { name: string };
}

interface BusinessDetail {
  id: string;
  name: string;
  code: string;
  adminEmail: string | null;
  logo: string | null;
  status: string;
  createdAt: string;
  _count: { users: number; candidates: number; clients: number; jobOpenings: number };
  users: BusinessUser[];
}

export default function BusinessDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'overview' | 'users'>('overview');
  const [resetPwUser, setResetPwUser] = useState<BusinessUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['business', id],
    queryFn: async () => { const res = await businessService.getById(id!); return res.data.data as BusinessDetail; },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-5">
        <button onClick={() => navigate('/business')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600">
          <ArrowLeft size={18} /> Back to Business
        </button>
        <p className="text-center py-16 text-slate-400">Business not found</p>
      </div>
    );
  }

  const stats = [
    { label: 'Users', value: data._count?.users ?? 0, icon: <Users size={18} />, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Job Openings', value: data._count?.jobOpenings ?? 0, icon: <Briefcase size={18} />, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Candidates', value: data._count?.candidates ?? 0, icon: <FileText size={18} />, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    { label: 'Clients', value: data._count?.clients ?? 0, icon: <Building size={18} />, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  ];

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/business')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600">
        <ArrowLeft size={18} /> Back to Business
      </button>

      {/* Info card */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          {data.logo ? (
            <img src={`/uploads/${data.logo}`} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 flex-shrink-0">
              <Building2 size={28} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{data.name}</h1>
              <span className={cn('badge text-xs', data.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400')}>
                {data.status}
              </span>
            </div>
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1">{data.code}</p>
            <div className="flex items-center gap-5 mt-3 flex-wrap text-sm text-slate-600 dark:text-slate-300">
              {data.adminEmail && (
                <span className="flex items-center gap-1.5"><Mail size={13} className="text-slate-400" />{data.adminEmail}</span>
              )}
              <span className="flex items-center gap-1.5"><Calendar size={13} className="text-slate-400" />Created {formatDate(data.createdAt)}</span>
            </div>
            {/* Reset admin password */}
            {data.users && data.users.length > 0 && (() => {
              const adminUser = data.users.find(u => u.email === data.adminEmail) ?? data.users[0];
              return (
                <button
                  onClick={() => setResetPwUser(adminUser)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                >
                  <KeyRound size={13} /> Reset Admin Password
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.color)}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reset Password Modal */}
      {resetPwUser && (
        <ResetPasswordModal
          isOpen={!!resetPwUser}
          onClose={() => setResetPwUser(null)}
          employeeId={resetPwUser.id}
          employeeName={`${resetPwUser.firstName} ${resetPwUser.lastName}`}
        />
      )}

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {(['users', 'overview'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-5 py-3 text-sm font-medium capitalize transition-colors',
                tab === t
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'overview' ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center py-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {data.users?.length === 0 ? (
                <p className="text-center py-12 text-slate-400 text-sm">No users in this business</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                      <th className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-400">Name</th>
                      <th className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-400">Email</th>
                      <th className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-400">Role</th>
                      <th className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                      <th className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-400">Joined</th>
                      <th className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {data.users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                        <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-white">{u.firstName} {u.lastName}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 text-xs">{u.email}</td>
                        <td className="px-3 py-2.5">
                          <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs capitalize">
                            {u.role?.name?.replace(/_/g, ' ') || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={cn('badge text-xs', u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600')}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 text-xs">{formatDate(u.createdAt)}</td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => setResetPwUser(u)}
                            title="Reset Password"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                          >
                            <KeyRound size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
