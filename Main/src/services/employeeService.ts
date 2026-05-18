import api from './api';
import { ApiResponse, User } from '../types';

export const employeeService = {
  getEmployees: (params: Record<string, any>) =>
    api.get<ApiResponse<User[]>>('/employees', { params }),

  getEmployeeById: (id: string) =>
    api.get<ApiResponse<User>>(`/employees/${id}`),

  createEmployee: (formData: FormData) =>
    api.post<ApiResponse<User>>('/employees', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateEmployee: (id: string, formData: FormData) =>
    api.put<ApiResponse<User>>(`/employees/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateProfile: (formData: FormData) =>
    api.put<ApiResponse<User>>('/employees/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  toggleStatus: (id: string) =>
    api.patch<ApiResponse<{ status: string }>>(`/employees/${id}/status`),

  resetPassword: (id: string) =>
    api.patch<ApiResponse<{ newPassword: string }>>(`/employees/${id}/reset-password`),

  deleteEmployee: (id: string) => api.delete<ApiResponse>(`/employees/${id}`),

  getDropdown: () =>
    api.get<ApiResponse<{ id: string; firstName: string; lastName: string }[]>>('/employees?limit=200'),
};
