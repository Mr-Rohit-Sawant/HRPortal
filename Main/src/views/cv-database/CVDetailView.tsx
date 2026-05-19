import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, Download, MapPin, Mail, Phone, Briefcase, GraduationCap, Star, Calendar } from 'lucide-react';
import { cvService } from '../../services/cvService';
import { formatDate, formatCTC, formatExperience, getStatusColor, cn } from '../../utils/helpers';
import DocumentViewer, { DocFile } from '../../components/common/DocumentViewer';
import toast from 'react-hot-toast';

export default function CVDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => {
      const res = await cvService.getCandidateById(id!);
      return res.data.data;
    },
    enabled: !!id,
  });

  const handleDownload = async () => {
    if (!data?.cvFile) return toast.error('No CV file attached');
    try {
      const res = await cvService.downloadCV(id!);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = data.cvOriginalName || 'cv.pdf'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-slate-100 dark:bg-slate-700" />)}
    </div>
  );

  if (!data) return <div className="text-center py-16 text-slate-400">Candidate not found</div>;

  const initials = `${data.firstName[0]}${data.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/cv-database')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <ArrowLeft size={18} />
          </button>
          <h1 className="page-title">{data.firstName} {data.lastName}</h1>
        </div>
        <div className="flex gap-2">
          {data.cvFile && (
            <button onClick={handleDownload} className="btn-secondary">
              <Download size={16} /> Download CV
            </button>
          )}
          <Link to={`/cv-database/${id}/edit`} className="btn-primary">
            <Edit size={16} /> Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card p-6 text-center">
          {data.profilePhoto ? (
            <img src={`/uploads/${data.profilePhoto}`} alt="" className="w-24 h-24 rounded-full object-cover mx-auto mb-4" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-primary-700 dark:text-primary-400">
              {initials}
            </div>
          )}
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{data.firstName} {data.lastName}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{data.currentDesignation || 'No designation'}</p>
          <p className="text-xs text-slate-400">{data.currentCompany}</p>

          <div className="flex justify-center gap-2 mt-3">
            <span className={cn('badge', getStatusColor(data.status))}>{data.status.replace('_', ' ')}</span>
            {data.isPriority && (
              <span className="badge bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                <Star size={11} className="fill-current mr-1" /> Priority
              </span>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2.5 text-left">
            {data.email && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Mail size={14} className="text-slate-400" />
                <a href={`mailto:${data.email}`} className="hover:text-primary-600 truncate">{data.email}</a>
              </div>
            )}
            {data.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Phone size={14} className="text-slate-400" />
                <a href={`tel:${data.phone}`} className="hover:text-primary-600">{data.phone}</a>
              </div>
            )}
            {data.currentLocation && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <MapPin size={14} className="text-slate-400" />
                <span>{data.currentLocation}</span>
              </div>
            )}
            {data.totalExperience !== undefined && data.totalExperience !== null && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Briefcase size={14} className="text-slate-400" />
                <span>{formatExperience(data.totalExperience)} experience</span>
              </div>
            )}
            {data.highestQualification && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <GraduationCap size={14} className="text-slate-400" />
                <span>{data.highestQualification} {data.specialization && `- ${data.specialization}`}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Calendar size={14} className="text-slate-400" />
              <span>Added {formatDate(data.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="xl:col-span-2 space-y-5">
          {/* Professional Summary */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Compensation & Availability</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoItem label="Current CTC" value={formatCTC(data.currentCTC)} />
              <InfoItem label="Expected CTC" value={formatCTC(data.expectedCTC)} />
              <InfoItem label="Notice Period" value={data.noticePeriod ? `${data.noticePeriod} days` : '—'} />
              <InfoItem label="Currently Employed" value={data.currentlyEmployed === true ? 'Yes' : data.currentlyEmployed === false ? 'No' : '—'} />
              <InfoItem label="Gender" value={data.gender?.replace('_', ' ') || '—'} />
              <InfoItem label="Source" value={data.source || '—'} />
            </div>
          </div>

          {/* Skills */}
          {(data.skills?.length || data.technologyStack?.length || data.certifications?.length) && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Skills & Expertise</h3>
              {(data.skills?.length ?? 0) > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">SKILLS</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(data.skills ?? []).map((skill: string) => (
                      <span key={skill} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-lg font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(data.technologyStack?.length ?? 0) > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">TECH STACK</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(data.technologyStack ?? []).map((t: string) => (
                      <span key={t} className="px-2.5 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 text-xs rounded-lg font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(data.certifications?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">CERTIFICATIONS</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(data.certifications ?? []).map((c: string) => (
                      <span key={c} className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-lg font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Languages & Locations */}
          {(data.languages?.length || data.preferredLocations?.length) && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Languages & Location Preference</h3>
              {(data.languages?.length ?? 0) > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">LANGUAGES</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(data.languages ?? []).map((l: string) => (
                      <span key={l} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg">{l}</span>
                    ))}
                  </div>
                </div>
              )}
              {(data.preferredLocations?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">PREFERRED LOCATIONS</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(data.preferredLocations ?? []).map((l: string) => (
                      <span key={l} className="badge bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400">{l}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {data.notes && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Notes</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{data.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer — below the profile grid */}
      {data.cvFile && (() => {
        const docFiles: DocFile[] = [{ url: `/${data.cvFile}`, name: data.cvOriginalName || data.cvFile.split('/').pop() || 'document' }];
        return (
          <div className="card p-4 mt-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Briefcase size={15} className="text-primary-500" /> CV / Resume
            </h3>
            <DocumentViewer files={docFiles} height={680} />
          </div>
        );
      })()}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">{value}</p>
    </div>
  );
}
