import api from './api';
import { ApiResponse, JobOpening } from '../types';

export const jobService = {
  getJobs: (params: Record<string, any>) =>
    api.get<ApiResponse<JobOpening[]>>('/jobs', { params }),

  getJobById: (id: string) =>
    api.get<ApiResponse<JobOpening>>(`/jobs/${id}`),

  createJob: (formData: FormData) =>
    api.post<ApiResponse<JobOpening>>('/jobs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateJob: (id: string, formData: FormData) =>
    api.put<ApiResponse<JobOpening>>(`/jobs/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteJob: (id: string) => api.delete<ApiResponse>(`/jobs/${id}`),

  duplicateJob: (id: string) => api.post<ApiResponse<JobOpening>>(`/jobs/${id}/duplicate`),

  // Assignees
  toggleAssignee: (jobId: string, employeeId: string, action: 'add' | 'remove') =>
    api.patch<ApiResponse>(`/jobs/${jobId}/assignees`, { employeeId, action }),

  // Close job / replacement
  closeJob: (jobId: string, selectedCandidateIds: string[], processGroup = 'main') =>
    api.post<ApiResponse>(`/jobs/${jobId}/close`, { selectedCandidateIds, processGroup }),

  startReplacement: (jobId: string) =>
    api.post<ApiResponse>(`/jobs/${jobId}/start-replacement`),

  // Post Selection Records
  updatePostSelectionRecord: (recordId: string, data: any) =>
    api.patch<ApiResponse>(`/jobs/psr/${recordId}`, data),

  uploadOfferLetter: (recordId: string, file: File) => {
    const fd = new FormData();
    fd.append('offerLetter', file);
    return api.post<ApiResponse>(`/jobs/psr/${recordId}/offer-letter`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  updatePSRColumns: (jobId: string, columns: any[]) =>
    api.patch<ApiResponse>(`/jobs/${jobId}/psr-columns`, { columns }),

  // Interview Rounds
  addRound: (jobId: string, data: any) =>
    api.post<ApiResponse>(`/jobs/${jobId}/rounds`, data),

  renameRound: (roundId: string, roundName: string) =>
    api.patch<ApiResponse>(`/jobs/rounds/${roundId}`, { roundName }),

  updateRoundColumns: (roundId: string, customColumns: any[]) =>
    api.patch<ApiResponse>(`/jobs/rounds/${roundId}/columns`, { customColumns }),

  // Slots
  updateSlot: (slotId: string, data: any) =>
    api.patch<ApiResponse>(`/jobs/slots/${slotId}`, data),

  updateSlotCustomField: (slotId: string, fieldName: string, value: any) =>
    api.patch<ApiResponse>(`/jobs/slots/${slotId}/custom-fields`, { fieldName, value }),

  bulkUpdateSlots: (roundId: string, slotIds: string[], updates: { result?: string; remark?: string }) =>
    api.patch<ApiResponse>(`/jobs/rounds/${roundId}/slots/bulk`, { slotIds, ...updates }),

  addCandidateToRound: (roundId: string, candidateId: string) =>
    api.post<ApiResponse>(`/jobs/rounds/${roundId}/candidates`, { candidateId }),

  removeCandidateFromRound: (roundId: string, candidateId: string) =>
    api.delete<ApiResponse>(`/jobs/rounds/${roundId}/candidates/${candidateId}`),

  importJobsCSV: (rows: any[], businessId?: string) =>
    api.post<ApiResponse>('/jobs/import-csv', { rows, businessId }),

  downloadCSVTemplate: () => {
    const headers = ['jobTitle', 'clientName', 'description', 'requiredSkills', 'experienceMin', 'workLocation', 'status', 'priority'];
    const csv = headers.join(',') + '\n' + 'Example Job Title,Client Company Name,Job Description,"React,Node.js",2,Mumbai,ACTIVE,MEDIUM\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'job_openings_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  },
};
