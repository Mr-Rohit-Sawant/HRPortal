"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.getMe = exports.refreshToken = exports.logout = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const app_1 = require("../app");
const jwt_1 = require("../utils/jwt");
const helpers_1 = require("../utils/helpers");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const emailService_1 = require("../services/emailService");
const authMiddleware_1 = require("../middleware/authMiddleware");
const login = async (req, res) => {
    const { email, password, rememberMe } = req.body;
    console.log('LOGIN ATTEMPT:', { email, passwordLen: password?.length });
    const user = await app_1.prisma.user.findFirst({
        where: { OR: [{ email }, { username: email }] },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    console.log('USER FOUND:', !!user, user?.status);
    if (user) {
        const match = await bcryptjs_1.default.compare(password, user.passwordHash);
        console.log('BCRYPT MATCH:', match, '| hash prefix:', user.passwordHash?.substring(0, 15));
    }
    if (!user || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
        if (user) {
            await app_1.prisma.user.update({
                where: { id: user.id },
                data: { loginAttempts: { increment: 1 } },
            });
        }
        throw new errorMiddleware_1.AppError('Invalid credentials', 401);
    }
    if (user.status !== 'ACTIVE')
        throw new errorMiddleware_1.AppError('Account is inactive', 403);
    const payload = {
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role.name,
        isSuperAdmin: user.isSuperAdmin,
    };
    const accessToken = (0, jwt_1.signAccessToken)(payload);
    const refreshToken = (0, jwt_1.signRefreshToken)(payload);
    await app_1.prisma.user.update({
        where: { id: user.id },
        data: {
            refreshToken,
            lastLoginAt: new Date(),
            lastLoginIp: req.ip,
            loginAttempts: 0,
        },
    });
    await app_1.prisma.auditLog.create({
        data: {
            userId: user.id,
            userEmail: user.email,
            action: 'LOGIN',
            module: 'auth',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        },
    });
    (0, helpers_1.setAuthCookies)(res, accessToken, refreshToken, !!rememberMe);
    const permissions = user.role.permissions.map((rp) => `${rp.permission.module}:${rp.permission.action}`);
    res.json({
        success: true,
        message: 'Login successful',
        data: { user: { ...(0, helpers_1.sanitizeUser)({ ...user, role: user.role }), permissions } },
    });
};
exports.login = login;
const logout = async (req, res) => {
    const accessToken = req.cookies?.access_token;
    if (accessToken)
        (0, authMiddleware_1.invalidateAuthToken)(accessToken);
    if (req.user) {
        await app_1.prisma.user.update({
            where: { id: req.user.userId },
            data: { refreshToken: null },
        });
        await app_1.prisma.auditLog.create({
            data: {
                userId: req.user.userId,
                userEmail: req.user.email,
                action: 'LOGOUT',
                module: 'auth',
                ipAddress: req.ip,
            },
        });
    }
    (0, helpers_1.clearAuthCookies)(res);
    res.json({ success: true, message: 'Logged out successfully' });
};
exports.logout = logout;
const refreshToken = async (req, res) => {
    const token = req.cookies?.refresh_token;
    if (!token)
        throw new errorMiddleware_1.AppError('Refresh token required', 401);
    const payload = (0, jwt_1.verifyRefreshToken)(token);
    const user = await app_1.prisma.user.findUnique({
        where: { id: payload.userId },
        include: { role: true },
    });
    if (!user || user.refreshToken !== token)
        throw new errorMiddleware_1.AppError('Invalid refresh token', 401);
    if (user.status !== 'ACTIVE')
        throw new errorMiddleware_1.AppError('Account inactive', 403);
    const newPayload = {
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role.name,
        isSuperAdmin: user.isSuperAdmin,
    };
    const newAccessToken = (0, jwt_1.signAccessToken)(newPayload);
    const newRefreshToken = (0, jwt_1.signRefreshToken)(newPayload);
    await app_1.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
    });
    (0, helpers_1.setAuthCookies)(res, newAccessToken, newRefreshToken);
    res.json({ success: true, message: 'Token refreshed' });
};
exports.refreshToken = refreshToken;
const getMe = async (req, res) => {
    const user = await app_1.prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
            role: {
                include: { permissions: { include: { permission: true } } },
            },
        },
    });
    if (!user)
        throw new errorMiddleware_1.AppError('User not found', 404);
    const permissions = user.role.permissions.map((rp) => `${rp.permission.module}:${rp.permission.action}`);
    res.json({ success: true, data: { ...(0, helpers_1.sanitizeUser)(user), permissions } });
};
exports.getMe = getMe;
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await app_1.prisma.user.findUnique({ where: { email } });
    if (user) {
        const token = (0, helpers_1.generateResetToken)();
        const expires = new Date(Date.now() + 60 * 60 * 1000);
        await app_1.prisma.user.update({
            where: { id: user.id },
            data: { passwordResetToken: token, passwordResetExpiresAt: expires },
        });
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        await (0, emailService_1.sendPasswordResetEmail)(user.email, `${user.firstName} ${user.lastName}`, resetLink);
    }
    res.json({ success: true, message: 'If this email exists, a reset link has been sent' });
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    const user = await app_1.prisma.user.findFirst({
        where: {
            passwordResetToken: token,
            passwordResetExpiresAt: { gt: new Date() },
        },
    });
    if (!user)
        throw new errorMiddleware_1.AppError('Invalid or expired reset token', 400);
    const passwordHash = await bcryptjs_1.default.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
    await app_1.prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash,
            passwordResetToken: null,
            passwordResetExpiresAt: null,
            refreshToken: null,
        },
    });
    (0, helpers_1.clearAuthCookies)(res);
    res.json({ success: true, message: 'Password reset successfully' });
};
exports.resetPassword = resetPassword;
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await app_1.prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user)
        throw new errorMiddleware_1.AppError('User not found', 404);
    if (!(await bcryptjs_1.default.compare(currentPassword, user.passwordHash))) {
        throw new errorMiddleware_1.AppError('Current password is incorrect', 400);
    }
    const passwordHash = await bcryptjs_1.default.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));
    await app_1.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await app_1.prisma.auditLog.create({
        data: {
            userId: user.id,
            userEmail: user.email,
            action: 'PASSWORD_CHANGE',
            module: 'auth',
            ipAddress: req.ip,
        },
    });
    res.json({ success: true, message: 'Password changed successfully' });
};
exports.changePassword = changePassword;
//# sourceMappingURL=authController.js.map