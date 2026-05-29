"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminOrSuperAdmin = exports.requireSuperAdmin = exports.requireAnyPermission = exports.requirePermission = exports.invalidateAuthToken = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const errorMiddleware_1 = require("./errorMiddleware");
const app_1 = require("../app");
const cache_1 = require("../utils/cache");
const authenticate = async (req, _res, next) => {
    try {
        const token = req.cookies?.access_token;
        if (!token)
            throw new errorMiddleware_1.AppError('Authentication required', 401);
        const payload = (0, jwt_1.verifyAccessToken)(token);
        // Cache hit — skip all DB queries for this request
        const cached = cache_1.authCache.get(`auth:${token}`);
        if (cached) {
            req.user = cached;
            return next();
        }
        // Cache miss — fetch user + permissions + business (one DB round-trip each)
        const user = await app_1.prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true, status: true, businessId: true,
                role: { select: { name: true, permissions: { select: { permission: { select: { module: true, action: true } } } } } },
            },
        });
        if (!user || user.status !== 'ACTIVE') {
            throw new errorMiddleware_1.AppError('Account is inactive or not found', 401);
        }
        const permissions = user.role.permissions.map((rp) => `${rp.permission.module}:${rp.permission.action}`);
        // Check business status for non-super-admins
        if (!payload.isSuperAdmin && user.businessId) {
            const business = await app_1.prisma.business.findUnique({
                where: { id: user.businessId },
                select: { status: true, deletedAt: true },
            });
            if (business?.status === 'INACTIVE') {
                throw new errorMiddleware_1.AppError('Business account is disabled. Contact your administrator.', 403);
            }
            if (business?.deletedAt) {
                throw new errorMiddleware_1.AppError('Business account has been removed.', 403);
            }
        }
        const userData = { ...payload, permissions, businessId: user.businessId ?? null };
        cache_1.authCache.set(`auth:${token}`, userData, cache_1.AUTH_TTL);
        req.user = userData;
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.authenticate = authenticate;
// Call on logout to immediately invalidate the cached session
const invalidateAuthToken = (token) => cache_1.authCache.del(`auth:${token}`);
exports.invalidateAuthToken = invalidateAuthToken;
const requirePermission = (module, action) => {
    return (req, _res, next) => {
        if (!req.user)
            return next(new errorMiddleware_1.AppError('Authentication required', 401));
        if (req.user.isSuperAdmin)
            return next();
        const hasPermission = req.user.permissions?.includes(`${module}:${action}`);
        if (!hasPermission) {
            return next(new errorMiddleware_1.AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
exports.requirePermission = requirePermission;
// Passes if user has ANY of the listed module:action permissions (or is super admin)
const requireAnyPermission = (...permissions) => {
    return (req, _res, next) => {
        if (!req.user)
            return next(new errorMiddleware_1.AppError('Authentication required', 401));
        if (req.user.isSuperAdmin)
            return next();
        const userPerms = req.user.permissions ?? [];
        const has = permissions.some((p) => userPerms.includes(p));
        if (!has)
            return next(new errorMiddleware_1.AppError('You do not have permission to perform this action', 403));
        next();
    };
};
exports.requireAnyPermission = requireAnyPermission;
const requireSuperAdmin = (req, _res, next) => {
    if (!req.user?.isSuperAdmin) {
        return next(new errorMiddleware_1.AppError('Super Admin access required', 403));
    }
    next();
};
exports.requireSuperAdmin = requireSuperAdmin;
const requireAdminOrSuperAdmin = (req, _res, next) => {
    if (!req.user?.isSuperAdmin && req.user?.roleName !== 'admin') {
        return next(new errorMiddleware_1.AppError('Admin access required', 403));
    }
    next();
};
exports.requireAdminOrSuperAdmin = requireAdminOrSuperAdmin;
//# sourceMappingURL=authMiddleware.js.map