import api from './api';
import { ApiResponse, AppSettings, Role, Permission, ColumnDefinition } from '../types';

export const settingsService = {
  getSettings: () => api.get<ApiResponse<AppSettings>>('/settings/app'),
  getAppSettings: () => api.get<ApiResponse<AppSettings>>('/settings/app'),
  updateSettings: (formData: FormData) =>
    api.put<ApiResponse<AppSettings>>('/settings/app', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateAppSettings: (data: Partial<AppSettings>) => api.put<ApiResponse>('/settings/app', data),
  uploadLogo: (formData: FormData) =>
    api.post<ApiResponse<{ logoPath: string }>>('/settings/app/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadFont: (formData: FormData) =>
    api.post<ApiResponse<{ fontName: string; fontPath: string }>>('/settings/app/font', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Roles
  getRoles: () => api.get<ApiResponse<Role[]>>('/settings/roles'),
  createRole: (data: any) => api.post<ApiResponse<Role>>('/settings/roles', data),
  updateRole: (id: string, data: any) => api.put<ApiResponse<Role>>(`/settings/roles/${id}`, data),
  deleteRole: (id: string) => api.delete<ApiResponse>(`/settings/roles/${id}`),
  cloneRole: (id: string, name?: string) => api.post<ApiResponse<Role>>(`/settings/roles/${id}/clone`, { name }),
  getPermissions: () => api.get<ApiResponse<Permission[]>>('/settings/permissions'),

  // Columns
  getColumns: (module?: string) =>
    api.get<ApiResponse<ColumnDefinition[]>>('/settings/columns', { params: { module } }),
  createColumn: (data: Partial<ColumnDefinition>) =>
    api.post<ApiResponse<ColumnDefinition>>('/settings/columns', data),
  updateColumn: (id: string, data: Partial<ColumnDefinition>) =>
    api.put<ApiResponse<ColumnDefinition>>(`/settings/columns/${id}`, data),
  deleteColumn: (id: string) => api.delete<ApiResponse>(`/settings/columns/${id}`),
  reorderColumns: (columns: { id: string; order: number }[]) =>
    api.put<ApiResponse>('/settings/columns/reorder', { columns }),

  // Audit
  getAuditLogs: (params: any) => api.get<ApiResponse<any[]>>('/settings/audit', { params }),

  // Notifications
  getNotifications: () => api.get<ApiResponse<any[]>>('/settings/notifications'),
  markRead: (id: string) => api.patch<ApiResponse>(`/settings/notifications/${id}/read`),
  markAllRead: () => api.patch<ApiResponse>('/settings/notifications/read-all'),
};
