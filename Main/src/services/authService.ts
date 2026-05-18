import api from './api';
import { ApiResponse, User, LoginCredentials } from '../types';

export const authService = {
  login: (credentials: LoginCredentials) =>
    api.post<ApiResponse<{ user: User }>>('/auth/login', credentials),

  logout: () => api.post<ApiResponse>('/auth/logout'),

  getMe: () => api.get<ApiResponse<User>>('/auth/me'),

  forgotPassword: (email: string) =>
    api.post<ApiResponse>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse>('/auth/reset-password', { token, password }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<ApiResponse>('/auth/change-password', { currentPassword, newPassword }),
};
