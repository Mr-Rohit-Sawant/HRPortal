import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { AppError } from './errorMiddleware';
import { prisma } from '../app';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload & { permissions?: string[] };
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) throw new AppError('Authentication required', 401);

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Account is inactive or not found', 401);
    }

    const permissions = user.role.permissions.map(
      (rp) => `${rp.permission.module}:${rp.permission.action}`
    );

    req.user = { ...payload, permissions };
    next();
  } catch (err) {
    next(err);
  }
};

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
