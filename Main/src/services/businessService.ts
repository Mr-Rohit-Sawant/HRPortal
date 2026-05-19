import api from './api';

const base = '/businesses';

export const businessService = {
  getAll: (params?: Record<string, unknown>) => api.get(base, { params }),
  getDropdown: () => api.get(`${base}/dropdown`),
  getById: (id: string) => api.get(`${base}/${id}`),
  create: (data: Record<string, unknown> | object) => api.post(base, data),
  update: (id: string, data: Record<string, unknown>) => api.put(`${base}/${id}`, data),
  delete: (id: string) => api.delete(`${base}/${id}`),
  undoDelete: (id: string) => api.post(`${base}/${id}/undo-delete`),
  toggleStatus: (id: string) => api.patch(`${base}/${id}/toggle-status`),
};
