import api from './api';
import { ApiResponse, DashboardStats } from '../types';

export const dashboardService = {
  getStats: () => api.get<ApiResponse<{ stats: DashboardStats; priorityJobs: any[]; recentActivities: any[] }>>('/dashboard/stats'),
  getRecruitmentChart: (period?: string) => api.get<ApiResponse<any[]>>('/dashboard/recruitment-chart', { params: { period } }),
  getRevenueChart: (period?: string) => api.get<ApiResponse<any[]>>('/dashboard/revenue-chart', { params: { period } }),
};
