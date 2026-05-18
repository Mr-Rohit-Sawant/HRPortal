import crypto from 'crypto';
import { Response } from 'express';

export const generateEmployeeId = (counter: number): string => {
  return `EMP-${String(counter).padStart(4, '0')}`;
};

export const generateInvoiceNumber = (prefix: string, counter: number): string => {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(counter).padStart(4, '0')}`;
};

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const paginate = (page: number, limit: number): { skip: number; take: number } => {
  const skip = (Math.max(1, page) - 1) * limit;
  return { skip, take: limit };
};

export const buildPaginationMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string, rememberMe = false) => {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    // rememberMe: 30 days; otherwise session cookie (expires when browser closes)
    ...(rememberMe ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
    path: '/api/auth/refresh',
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
};

export const sanitizeUser = (user: any) => {
  const { passwordHash, refreshToken, twoFactorSecret, ...safe } = user;
  return safe;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

export const slugify = (text: string): string => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
};
