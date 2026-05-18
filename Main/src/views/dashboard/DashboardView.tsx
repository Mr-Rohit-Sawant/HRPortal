import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, Briefcase, Building2, FileText, Receipt, TrendingUp,
  AlertCircle, ChevronRight, Star, Clock
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { dashboardService } from '../../services/dashboardService';
import { formatCurrency, formatDate, getStatusColor, getPriorityColor, timeAgo } from '../../utils/helpers';
import { motion } from 'framer-motion';

export default function DashboardView() {
  const [chartPeriod, setChartPeriod] = useState<'6months' | '12months'>('6months');

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await dashboardService.getStats();
      return res.data.data;
    },
    refetchInterval: 60000,
  });

  const { data: recruitmentData } = useQuery({
    queryKey: ['recruitment-chart', chartPeriod],
    queryFn: async () => {
      const res = await dashboardService.getRecruitmentChart(chartPeriod);
      return res.data.data || [];
    },
  });

  const { data: revenueData } = useQuery({
    queryKey: ['revenue-chart', chartPeriod],
    queryFn: async () => {
      const res = await dashboardService.getRevenueChart(chartPeriod);
      return res.data.data || [];
    },
  });

  const stats = statsData?.stats;
  const priorityJobs = statsData?.priorityJobs || [];
  const recentActivities = statsData?.recentActivities || [];

  const statCards = [
    {
      label: 'Total Employees',
      value: stats?.totalEmployees ?? '—',
      sub: `${stats?.activeEmployees ?? 0} active`,
      icon: <Users size={20} />,
      color: 'bg-blue-500',
      link: '/employees',
    },
    {
      label: 'Active Jobs',
      value: stats?.activeJobs ?? '—',
      sub: `${stats?.totalJobs ?? 0} total`,
      icon: <Briefcase size={20} />,
      color: 'bg-violet-500',
      link: '/job-openings',
    },
    {
      label: 'Candidates',
      value: stats?.totalCandidates ?? '—',
      sub: `${stats?.priorityCandidates ?? 0} priority`,
      icon: <FileText size={20} />,
      color: 'bg-cyan-500',
      link: '/cv-database',
    },
    {
      label: 'Clients',
      value: stats?.activeClients ?? '—',
      sub: `${stats?.totalClients ?? 0} total`,
      icon: <Building2 size={20} />,
      color: 'bg-emerald-500',
      link: '/clients',
    },
    {
      label: 'Invoice Revenue',
      value: stats?.invoices?.paid?.amount ? formatCurrency(stats.invoices.paid.amount) : '₹0',
      sub: `${stats?.invoices?.paid?.count ?? 0} paid`,
      icon: <Receipt size={20} />,
      color: 'bg-orange-500',
      link: '/invoices',
    },
    {
      label: 'Pending Invoices',
      value: stats?.invoices?.sent?.count ?? '—',
      sub: stats?.invoices?.sent?.amount ? formatCurrency(stats.invoices.sent.amount) : '₹0 pending',
      icon: <TrendingUp size={20} />,
      color: 'bg-rose-500',
      link: '/invoices',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 h-24 animate-pulse bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={card.link} className="stats-card hover:shadow-card-hover transition-shadow group">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${card.color}`}>
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{card.label}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{card.sub}</p>
              </div>
              <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recruitment Chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Recruitment Pipeline</h3>
            <div className="flex gap-1">
              {(['6months', '12months'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                    chartPeriod === p
                      ? 'bg-primary-800 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {p === '6months' ? '6M' : '12M'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={recruitmentData || []}>
              <defs>
                <linearGradient id="colorAdded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="added" stroke="#3B82F6" fill="url(#colorAdded)" name="Added" strokeWidth={2} />
              <Area type="monotone" dataKey="hired" stroke="#10B981" fill="url(#colorHired)" name="Hired" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Revenue Analytics</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="invoiced" fill="#6366F1" name="Invoiced" radius={[4, 4, 0, 0]} />
              <Bar dataKey="collected" fill="#10B981" name="Collected" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority Jobs & Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Priority Job Openings */}
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-orange-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Priority Job Openings</h3>
            </div>
            <Link to="/job-openings" className="text-xs text-primary-600 hover:underline font-medium">View all</Link>
          </div>
          {priorityJobs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No priority jobs found</p>
          ) : (
            <div className="space-y-2">
              {priorityJobs.map((job: any) => (
                <Link
                  key={job.id}
                  to={`/job-openings/${job.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={16} className="text-primary-700 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 dark:text-white truncate group-hover:text-primary-700">
                      {job.jobTitle}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{job.client?.companyName}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge text-xs ${getPriorityColor(job.priority)}`}>{job.priority}</span>
                    {job.workLocation && (
                      <span className="text-xs text-slate-400 hidden sm:block">{job.workLocation}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-slate-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
          </div>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.slice(0, 8).map((activity: any) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-primary-700 dark:text-primary-400">
                    {activity.user?.firstName?.[0]}{activity.user?.lastName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-medium">{activity.user?.firstName} {activity.user?.lastName}</span>
                      {' '}{activity.action.toLowerCase()}d a {activity.module}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{timeAgo(activity.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
