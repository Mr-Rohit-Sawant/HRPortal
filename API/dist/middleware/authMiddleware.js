"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSuperAdmin = exports.requirePermission = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const errorMiddleware_1 = require("./errorMiddleware");
const app_1 = require("../app");
const authenticate = async (req, _res, next) => {
    try {
        const token = req.cookies?.access_token;
        if (!token)
            throw new errorMiddleware_1.AppError('Authentication required', 401);
        const payload = (0, jwt_1.verifyAccessToken)(token);
        const user = await app_1.prisma.user.findUnique({
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
            throw new errorMiddleware_1.AppError('Account is inactive or not found', 401);
        }
        const permissions = user.role.permissions.map((rp) => `${rp.permission.module}:${rp.permission.action}`);
        req.user = { ...payload, permissions };
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.authenticate = authenticate;
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
const requireSuperAdmin = (req, _res, next) => {
    if (!req.user?.isSuperAdmin) {
        return next(new errorMiddleware_1.AppError('Super Admin access required', 403));
    }
    next();
};
exports.requireSuperAdmin = requireSuperAdmin;
//# sourceMappingURL=authMiddleware.js.map