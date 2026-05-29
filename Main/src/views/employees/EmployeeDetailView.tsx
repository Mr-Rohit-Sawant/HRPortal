import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Briefcase, Calendar, Building2, CreditCard, User } from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import { formatDate, cn } from '../../utils/helpers';
import CopyButton from '../../components/common/CopyButton';

function InfoRowCopy({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-400 dark:text-slate-500">{label}</span>
      <span className="flex items-center gap-1.5 text-sm text-slate-800 dark:text-slate-200">
        {value}<CopyButton value={value} />
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-400 dark:text-slate-500">{label}</span>
      <span className="text-sm text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  );
}

export default function EmployeeDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await employeeService.getEmployeeById(id!);
      return res.data.data;
    },
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-slate-100 dark:bg-slate-700" />)}
    </div>
  );

  if (!data) return <div className="text-center py-16 text-slate-400">Employee not found</div>;

  const initials = `${data.firstName?.[0] || ''}${data.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/employees')} className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <ArrowLeft size={18} />
          </button>
          <h1 className="page-title">{data.firstName} {data.lastName}</h1>
        </div>
        <Link to={`/employees/${id}/edit`} className="btn-primary">
          <Edit size={16} /> Edit
        </Link>
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          {data.profilePhoto ? (
            <img src={`/uploads/${data.profilePhoto}`} alt="" className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 text-2xl font-bold flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{data.firstName} {data.lastName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{data.designation || 'No designation'} {data.department ? `· ${data.department}` : ''}</p>
            <div className="flex flex-wrap gap-4 mt-3">
              {data.email && <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300"><Mail size={14} />{data.email}<CopyButton value={data.email} /></span>}
              {data.phone && <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300"><Phone size={14} />{data.phone}<CopyButton value={data.phone} /></span>}
              {(data.city || data.country) && <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300"><MapPin size={14} />{[data.city, data.country].filter(Boolean).join(', ')}</span>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={cn('badge', data.status === 'ACTIVE' ? 'badge-success' : 'badge-danger')}>{data.status}</span>
            <span className="text-xs font-mono text-slate-400">{data.employeeId}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Work Info */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
            <Briefcase size={15} /> Work Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Role" value={data.role?.name} />
            <InfoRow label="Department" value={data.department} />
            <InfoRow label="Designation" value={data.designation} />
            <InfoRow label="Employee ID" value={data.employeeId} />
            <InfoRow label="Joining Date" value={data.joiningDate ? formatDate(data.joiningDate) : null} />
            <InfoRow label="Salary" value={data.salary ? `₹${Number(data.salary).toLocaleString('en-IN')}` : null} />
          </div>
        </div>

        {/* Personal Info */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
            <User size={15} /> Personal Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Username" value={data.username} />
            <InfoRowCopy label="Email" value={data.email} />
            <InfoRowCopy label="Phone" value={data.phone} />
            <InfoRow label="Address" value={data.address} />
            <InfoRow label="City" value={data.city} />
            <InfoRow label="State" value={data.state} />
            <InfoRow label="Country" value={data.country} />
          </div>
        </div>

        {/* Account Info */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
            <CreditCard size={15} /> Account Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Status" value={data.status} />
            <InfoRow label="Last Login" value={data.lastLoginAt ? formatDate(data.lastLoginAt) : 'Never'} />
            <InfoRow label="Created" value={formatDate(data.createdAt)} />
            <InfoRow label="Business" value={data.business?.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
