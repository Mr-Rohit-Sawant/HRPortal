import api from './api';
import { ApiResponse, Invoice } from '../types';

export const invoiceService = {
  getInvoices: (params: Record<string, any>) =>
    api.get<ApiResponse<Invoice[]>>('/invoices', { params }),

  getInvoiceById: (id: string) =>
    api.get<ApiResponse<Invoice>>(`/invoices/${id}`),

  createInvoice: (data: any) =>
    api.post<ApiResponse<Invoice>>('/invoices', data),

  updateStatus: (id: string, data: any) =>
    api.patch<ApiResponse<Invoice>>(`/invoices/${id}/status`, data),

  sendToClient: (id: string) =>
    api.post<ApiResponse>(`/invoices/${id}/send`),

  downloadPDF: async (id: string, invoiceNumber: string) => {
    const response = await api.get(`/invoices/${id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  deleteInvoice: (id: string) => api.delete<ApiResponse>(`/invoices/${id}`),
};
