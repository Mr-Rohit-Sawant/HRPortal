import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2, Globe, FileText, Calendar, CreditCard, Briefcase } from 'lucide-react';
import { clientService } from '../../services/clientService';
import { formatDate, cn } from '../../utils/helpers';
import { useAuthStore } from '../../stores/authStore';
import CopyButton from '../../components/common/CopyButton';

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-400 dark:text-slate-500">{label}</span>
      <span className="text-sm text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  );
}

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

export default function ClientDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canAccess, user: currentUser } = useAuthStore();
  const canViewContacts = canAccess('clients:view_contacts') || canAccess('clients:update') || currentUser?.role?.name?.toLowerCase() === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const res = await clientService.getClientById(id!);
      return res.data.data;
    },
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-slate-100 dark:bg-slate-700" />)}
    </div>
  );

  if (!data) return <div className="text-center py-16 text-slate-400">Client not found</div>;

  const initials = data.companyName?.slice(0, 2).toUpperCase() || 'CL';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/clients')} className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <ArrowLeft size={18} />
          </button>
          <h1 className="page-title">{data.companyName}</h1>
        </div>
        <Link to={`/clients/${id}/edit`} className="btn-primary">
          <Edit size={16} /> Edit
        </Link>
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 text-2xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{data.companyName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{data.industry || 'No industry'} {data.business ? `· ${data.business.name}` : ''}</p>
            <div className="flex flex-wrap gap-4 mt-3">
              {data.email && <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300"><Mail size={14} />{data.email}{canViewContacts && <CopyButton value={data.email} />}</span>}
              {data.phone && <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300"><Phone size={14} />{data.phone}{canViewContacts && <CopyButton value={data.phone} />}</span>}
              {(data.city || data.country) && <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300"><MapPin size={14} />{[data.city, data.country].filter(Boolean).join(', ')}</span>}
              {data.website && <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300"><Globe size={14} />{data.website}<CopyButton value={data.website} /></span>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={cn('badge', data.isActive ? 'badge-success' : 'badge-danger')}>{data.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
            {data._count && (
              <div className="flex gap-3 text-xs text-slate-400">
                <span>{data._count.jobOpenings} jobs</span>
                <span>{data._count.invoices} invoices</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Contact Info */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
            <Phone size={15} /> Contact Information
          </h3>
          {canViewContacts ? (
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Contact Person" value={data.contactPerson} />
              <InfoRowCopy label="Email" value={data.email} />
              <InfoRowCopy label="Phone" value={data.phone} />
              <InfoRowCopy label="Alternate Phone" value={data.alternatePhone} />
              <InfoRowCopy label="Website" value={data.website} />
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">You don't have permission to view contact details.</p>
          )}
        </div>

        {/* Address */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
            <MapPin size={15} /> Address
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Address" value={data.address} />
            <InfoRow label="City" value={data.city} />
            <InfoRow label="State" value={data.state} />
            <InfoRow label="Country" value={data.country} />
            <InfoRow label="Pincode" value={data.pincode} />
          </div>
        </div>

        {/* Business & Tax */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
            <CreditCard size={15} /> Business & Tax Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Industry" value={data.industry} />
            <InfoRow label="GST Number" value={data.gstNumber} />
            <InfoRow label="PAN Number" value={data.panNumber} />
            <InfoRow label="Business" value={data.business?.name} />
          </div>
        </div>

        {/* Contract Info */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
            <Calendar size={15} /> Contract & Notes
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Contract Start" value={data.contractStartDate ? formatDate(data.contractStartDate) : null} />
            <InfoRow label="Contract End" value={data.contractEndDate ? formatDate(data.contractEndDate) : null} />
            <InfoRow label="Created" value={formatDate(data.createdAt)} />
          </div>
          {data.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-400 dark:text-slate-500">Notes</span>
              <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">{data.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
