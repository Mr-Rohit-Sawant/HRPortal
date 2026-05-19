import api from './api';

const base = '/user-notifications';

export const notificationService = {
  getAll: (params?: Record<string, unknown>) => api.get(base, { params }),
  create: (formData: FormData) =>
    api.post(base, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: Record<string, unknown>) => api.put(`${base}/${id}`, data),
  delete: (id: string) => api.delete(`${base}/${id}`),
  markRead: (id: string) => api.post(`${base}/${id}/read`),
  getPermissions: () => api.get(`${base}/permissions`),
  updatePermissions: (data: unknown) => api.put(`${base}/permissions`, data),
};
