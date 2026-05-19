import { useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';
import { jobService } from '../../services/jobService';
import JobDetailContent from './JobDetailContent';

export default function JobOpeningDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => { const res = await jobService.getJobById(id!); return res.data.data; },
    enabled: !!id,
  });

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['job', id] });
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  }, [id, queryClient]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-slate-400" /></div>;
  }
  if (!data) {
    return <div className="text-center py-24 text-slate-400">Job not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/job-openings')} className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">{data.jobTitle}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{data.client?.companyName}</p>
          </div>
        </div>
        <Link to={`/job-openings/${id}/edit`} className="btn-primary">
          <Edit size={16} /> Edit
        </Link>
      </div>

      {/* All content — shared with the quick panel */}
      <JobDetailContent data={data} jobId={id!} onRefresh={onRefresh} compact={false} />
    </div>
  );
}
