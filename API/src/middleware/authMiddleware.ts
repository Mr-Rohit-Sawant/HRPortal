import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { AppError } from './errorMiddleware';
import { prisma } from '../app';
import { authCache, AUTH_TTL } from '../utils/cache';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload & { permissions?: string[]; businessId?: string | null };
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) throw new AppError('Authentication required', 401);

    const payload = verifyAccessToken(token);

    // Cache hit — skip all DB queries for this request
    const cached = authCache.get(`auth:${token}`);
    if (cached) {
      req.user = cached;
      return next();
    }

    // Cache miss — fetch user + permissions + business (one DB round-trip each)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true, status: true, businessId: true,
        role: { select: { name: true, permissions: { select: { permission: { select: { module: true, action: true } } } } } },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Account is inactive or not found', 401);
    }

    const permissions = user.role.permissions.map(
      (rp) => `${rp.permission.module}:${rp.permission.action}`
    );

    // Check business status for non-super-admins
    if (!payload.isSuperAdmin && user.businessId) {
      const business = await prisma.business.findUnique({
        where: { id: user.businessId },
        select: { status: true, deletedAt: true },
      });
      if (business?.status === 'INACTIVE') {
        throw new AppError('Business account is disabled. Contact your administrator.', 403);
      }
      if (business?.deletedAt) {
        throw new AppError('Business account has been removed.', 403);
      }
    }

    const userData = { ...payload, permissions, businessId: user.businessId ?? null };
    authCache.set(`auth:${token}`, userData, AUTH_TTL);
    req.user = userData;
    next();
  } catch (err) {
    next(err);
  }
};

// Call on logout to immediately invalidate the cached session
export const invalidateAuthToken = (token: string) => authCache.del(`auth:${token}`);

export const requirePermission = (module: string, action: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Authentication required', 401));
    if (req.user.isSuperAdmin) return next();

    const hasPermission = req.user.permissions?.includes(`${module}:${action}`);
    if (!hasPermission) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

export const requireSuperAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user?.isSuperAdmin) {
    return next(new AppError('Super Admin access required', 403));
  }
  next();
};

export const requireAdminOrSuperAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user?.isSuperAdmin && req.user?.roleName !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};
