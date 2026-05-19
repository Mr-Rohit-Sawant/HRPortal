import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { jobService } from '../../services/jobService';
import { clientService } from '../../services/clientService';
import { useAuthStore } from '../../stores/authStore';
import BusinessSelector from '../../components/common/BusinessSelector';
import toast from 'react-hot-toast';

const schema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  clientId: z.string().min(1, 'Client is required'),
  description: z.string().optional(),
  experienceMin: z.string().optional(),
  experienceMax: z.string().optional(),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  jobType: z.string().optional(),
  workLocation: z.string().optional(),
  workMode: z.string().optional(),
  numberOfOpenings: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  closingDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function JobOpeningFormView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const { user } = useAuthStore();
  const isSuperAdmin = user?.isSuperAdmin ?? false;
  const [selectedBusinessId, setSelectedBusinessId] = useState('');

  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [prefInput, setPrefInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const { data: clientsData } = useQuery({
    queryKey: ['clients-dropdown'],
    queryFn: async () => { const res = await clientService.getDropdown(); return res.data.data || []; },
  });

  const { data: existingJob } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => { const res = await jobService.getJobById(id!); return res.data.data; },
    enabled: isEdit,
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'ACTIVE', priority: 'MEDIUM', jobType: 'FULL_TIME', numberOfOpenings: '1' },
  });

  useEffect(() => {
    if (existingJob) {
      reset({
        jobTitle: existingJob.jobTitle,
        clientId: existingJob.clientId,
        description: existingJob.description || '',
        experienceMin: existingJob.experienceMin?.toString() || '',
        experienceMax: existingJob.experienceMax?.toString() || '',
        salaryMin: existingJob.salaryMin?.toString() || '',
        salaryMax: existingJob.salaryMax?.toString() || '',
        jobType: existingJob.jobType,
        workLocation: existingJob.workLocation || '',
        workMode: existingJob.workMode || '',
        numberOfOpenings: existingJob.numberOfOpenings.toString(),
        status: existingJob.status,
        priority: existingJob.priority,
        closingDate: existingJob.closingDate ? existingJob.closingDate.split('T')[0] : '',
      });
      setRequiredSkills(existingJob.requiredSkills || []);
      setPreferredSkills(existingJob.preferredSkills || []);
      setTags(existingJob.tags || []);
      if (existingJob.businessId) setSelectedBusinessId(existingJob.businessId);
    }
  }, [existingJob, reset]);

  const createMutation = useMutation({
    mutationFn: jobService.createJob,
    onSuccess: () => { toast.success('Job opening created'); queryClient.invalidateQueries({ queryKey: ['jobs'] }); navigate('/job-openings'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }: { id: string; fd: FormData }) => jobService.updateJob(id, fd as any),
    onSuccess: () => { toast.success('Job updated'); queryClient.invalidateQueries({ queryKey: ['jobs'] }); navigate('/job-openings'); },
  });

  const onSubmit = (data: FormData) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v) fd.append(k, v as string); });
    fd.append('requiredSkills', JSON.stringify(requiredSkills));
    fd.append('preferredSkills', JSON.stringify(preferredSkills));
    fd.append('tags', JSON.stringify(tags));
    if (isSuperAdmin && selectedBusinessId) fd.append('businessId', selectedBusinessId);

    if (isEdit) updateMutation.mutate({ id: id!, fd: fd as any });
    else createMutation.mutate(fd);
  };

  const addTag = (v: string, list: string[], setList: (l: string[]) => void, setInput: (s: string) => void) => {
    const t = v.trim();
    if (t && !list.includes(t)) { setList([...list, t]); setInput(''); }
  };

  const TagField = ({ value, onChange, list, onAdd, onRemove, placeholder }: any) => (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {list.map((item: string) => (
          <span key={item} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs rounded-full">
            {item} <button type="button" onClick={() => onRemove(item)}><X size={11} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd(value); } }} placeholder={placeholder} className="form-input flex-1 text-sm" />
        <button type="button" onClick={() => onAdd(value)} className="btn-secondary px-3"><Plus size={14} /></button>
      </div>
    </div>
  );

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/job-openings')} className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
          <ArrowLeft size={18} />
        </button>
        <h1 className="page-title">{isEdit ? 'Edit Job Opening' : 'New Job Opening'}</h1>
      </div>

      {isSuperAdmin && (
        <BusinessSelector value={selectedBusinessId} onChange={setSelectedBusinessId} className="mb-6" />
      )}

      {(!isSuperAdmin || selectedBusinessId) && (
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Job Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full sm:col-span-2">
                  <label className="form-label">Job Title *</label>
                  <input {...register('jobTitle')} className="form-input" placeholder="Senior React Developer" />
                  {errors.jobTitle && <p className="form-error">{errors.jobTitle.message}</p>}
                </div>
                <div className="col-span-full sm:col-span-2">
                  <label className="form-label">Client *</label>
                  <select {...register('clientId')} className="form-input">
                    <option value="">Select Client</option>
                    {clientsData?.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                  </select>
                  {errors.clientId && <p className="form-error">{errors.clientId.message}</p>}
                </div>
                <div className="col-span-full sm:col-span-2">
                  <label className="form-label">Job Description</label>
                  <textarea {...register('description')} rows={5} className="form-input resize-none" placeholder="Describe the role, responsibilities, and requirements..." />
                </div>
                <div>
                  <label className="form-label">Work Location</label>
                  <input {...register('workLocation')} className="form-input" placeholder="Mumbai / Remote / Hybrid" />
                </div>
                <div>
                  <label className="form-label">Work Mode</label>
                  <select {...register('workMode')} className="form-input">
                    <option value="">Select</option>
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Employment Type</label>
                  <select {...register('jobType')} className="form-input">
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="FREELANCE">Freelance</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Number of Openings</label>
                  <input {...register('numberOfOpenings')} type="number" min="1" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Experience Min (years)</label>
                  <input {...register('experienceMin')} type="number" step="0.5" className="form-input" placeholder="2" />
                </div>
                <div>
                  <label className="form-label">Experience Max (years)</label>
                  <input {...register('experienceMax')} type="number" step="0.5" className="form-input" placeholder="8" />
                </div>
                <div>
                  <label className="form-label">Salary Min (₹/year)</label>
                  <input {...register('salaryMin')} type="number" className="form-input" placeholder="500000" />
                </div>
                <div>
                  <label className="form-label">Salary Max (₹/year)</label>
                  <input {...register('salaryMax')} type="number" className="form-input" placeholder="1200000" />
                </div>
              </div>

              {/* Skills */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Required Skills</label>
                  <TagField
                    value={skillInput} onChange={setSkillInput} list={requiredSkills}
                    onAdd={(v: string) => addTag(v, requiredSkills, setRequiredSkills, setSkillInput)}
                    onRemove={(v: string) => setRequiredSkills(requiredSkills.filter((s) => s !== v))}
                    placeholder="e.g. React"
                  />
                </div>
                <div>
                  <label className="form-label">Preferred Skills</label>
                  <TagField
                    value={prefInput} onChange={setPrefInput} list={preferredSkills}
                    onAdd={(v: string) => addTag(v, preferredSkills, setPreferredSkills, setPrefInput)}
                    onRemove={(v: string) => setPreferredSkills(preferredSkills.filter((s) => s !== v))}
                    placeholder="e.g. TypeScript"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="mt-4">
                <label className="form-label">Tags</label>
                <TagField
                  value={tagInput} onChange={setTagInput} list={tags}
                  onAdd={(v: string) => addTag(v, tags, setTags, setTagInput)}
                  onRemove={(v: string) => setTags(tags.filter((t) => t !== v))}
                  placeholder="e.g. urgent, remote"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Status & Priority</h3>
              <div className="space-y-3">
                <div>
                  <label className="form-label">Status</label>
                  <select {...register('status')} className="form-input">
                    <option value="ACTIVE">Active</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Priority</label>
                  <select {...register('priority')} className="form-input">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Closing Date</label>
                  <input {...register('closingDate')} type="date" className="form-input" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button type="submit" disabled={isLoading} className="btn-primary justify-center">
                {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                {isEdit ? 'Update Job' : 'Create Job Opening'}
              </button>
              <button type="button" onClick={() => navigate('/job-openings')} className="btn-secondary justify-center">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
      )}
    </div>
  );
}
