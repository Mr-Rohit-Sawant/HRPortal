import api from './api';

const base = '/bug-reports';

export const bugReportService = {
  getAll: (params?: Record<string, unknown>) => api.get(base, { params }),
  getById: (id: string) => api.get(`${base}/${id}`),
  create: (data: FormData) =>
    api.post(base, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: Record<string, unknown>) => api.patch(`${base}/${id}`, data),
  delete: (id: string) => api.delete(`${base}/${id}`),
  getSettings: () => api.get(`${base}/settings`),
  updateSettings: (data: { disabledAll?: boolean; disabledSuperAdmin?: boolean }) =>
    api.put(`${base}/settings`, data),
  // Status labels
  getStatusLabels: (params?: { businessId?: string }) =>
    api.get(`${base}/status-labels`, { params }),
  createStatusLabel: (data: { name: string; color: string; businessId?: string }) =>
    api.post(`${base}/status-labels`, data),
  updateStatusLabel: (id: string, data: Partial<{ name: string; color: string; order: number; isArchived: boolean }>) =>
    api.patch(`${base}/status-labels/${id}`, data),
  deleteStatusLabel: (id: string) => api.delete(`${base}/status-labels/${id}`),
};
