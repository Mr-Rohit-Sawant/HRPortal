import api from './api';
import { ApiResponse, Client } from '../types';

export const clientService = {
  getClients: (params: Record<string, any>) =>
    api.get<ApiResponse<Client[]>>('/clients', { params }),

  getClientById: (id: string) =>
    api.get<ApiResponse<Client>>(`/clients/${id}`),

  getDropdown: () =>
    api.get<ApiResponse<{ id: string; companyName: string }[]>>('/clients/dropdown'),

  createClient: (data: Partial<Client>) =>
    api.post<ApiResponse<Client>>('/clients', data),

  updateClient: (id: string, data: Partial<Client>) =>
    api.put<ApiResponse<Client>>(`/clients/${id}`, data),

  toggleStatus: (id: string) =>
    api.patch<ApiResponse<{ isActive: boolean }>>(`/clients/${id}/status`),

  deleteClient: (id: string) => api.delete<ApiResponse>(`/clients/${id}`),
};
