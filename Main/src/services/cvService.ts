import api from './api';
import { ApiResponse, Candidate } from '../types';

export const cvService = {
  getCandidates: (params: Record<string, any>) =>
    api.get<ApiResponse<Candidate[]>>('/cv', { params }),

  getCandidateById: (id: string) =>
    api.get<ApiResponse<Candidate>>(`/cv/${id}`),

  createCandidate: (formData: FormData) =>
    api.post<ApiResponse<Candidate>>('/cv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateCandidate: (id: string, formData: FormData) =>
    api.put<ApiResponse<Candidate>>(`/cv/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteCandidate: (id: string) =>
    api.delete<ApiResponse>(`/cv/${id}`),

  togglePriority: (id: string) =>
    api.patch<ApiResponse<{ isPriority: boolean }>>(`/cv/${id}/priority`),

  bulkImport: (formData: FormData, onProgress?: (progress: number) => void) =>
    api.post<ApiResponse<{ jobId: string; total: number }>>('/cv/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
      timeout: 300000,
    }),

  getBulkImportStatus: (jobId: string) =>
    api.get<ApiResponse<{ status: string; results: any[] }>>(`/cv/bulk-status/${jobId}`),

  downloadCV: (id: string) =>
    api.get(`/cv/${id}/download`, { responseType: 'blob' }),
};
