import api from './api';

const base = '/bug-reports';

export const bugReportService = {
  getAll: (params?: Record<string, unknown>) => api.get(base, { params }),
  create: (data: FormData) =>
    api.post(base, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: Record<string, unknown>) => api.patch(`${base}/${id}`, data),
  delete: (id: string) => api.delete(`${base}/${id}`),
  getSettings: () => api.get(`${base}/settings`),
  updateSettings: (data: { disabledAll?: boolean; disabledSuperAdmin?: boolean }) =>
    api.put(`${base}/settings`, data),
};
