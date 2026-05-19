import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../app';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { setAuthCookies, clearAuthCookies, sanitizeUser, generateResetToken } from '../utils/helpers';
import { AppError } from '../middleware/errorMiddleware';
import { sendPasswordResetEmail } from '../services/emailService';

export const login = async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;
  console.log('LOGIN ATTEMPT:', { email, passwordLen: password?.length });

  const user = await prisma.user.findFirst({
    where: { OR: [{ email }, { username: email }] },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });

  console.log('USER FOUND:', !!user, user?.status);
  if (user) {
    const match = await bcrypt.compare(password, user.passwordHash);
    console.log('BCRYPT MATCH:', match, '| hash prefix:', user.passwordHash?.substring(0, 15));
  }

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: { increment: 1 } },
      });
    }
    throw new AppError('Invalid credentials', 401);
  }

  if (user.status !== 'ACTIVE') throw new AppError('Account is inactive', 403);

  const payload = {
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.name,
    isSuperAdmin: user.isSuperAdmin,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken,
      lastLoginAt: new Date(),
      lastLoginIp: req.ip,
      loginAttempts: 0,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userEmail: user.email,
      action: 'LOGIN',
      module: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  setAuthCookies(res, accessToken, refreshToken, !!rememberMe);

  const permissions = user.role.permissions.map(
    (rp) => `${rp.permission.module}:${rp.permission.action}`
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: { user: { ...sanitizeUser({ ...user, role: user.role }), permissions } },
  });
};

export const logout = async (req: Request, res: Response) => {
  if (req.user) {
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { refreshToken: null },
    });
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        userEmail: req.user.email,
        action: 'LOGOUT',
        module: 'auth',
        ipAddress: req.ip,
      },
    });
  }
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out successfully' });
};

export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies?.refresh_token;
  if (!token) throw new AppError('Refresh token required', 401);

  const payload = verifyRefreshToken(token);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { role: true },
  });

  if (!user || user.refreshToken !== token) throw new AppError('Invalid refresh token', 401);
  if (user.status !== 'ACTIVE') throw new AppError('Account inactive', 403);

  const newPayload = {
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.name,
    isSuperAdmin: user.isSuperAdmin,
  };

  const newAccessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  });

  setAuthCookies(res, newAccessToken, newRefreshToken);
  res.json({ success: true, message: 'Token refreshed' });
};

export const getMe = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: {
      role: {
        include: { permissions: { include: { permission: true } } },
      },
    },
  });
  if (!user) throw new AppError('User not found', 404);

  const permissions = user.role.permissions.map(
    (rp) => `${rp.permission.module}:${rp.permission.action}`
  );

  res.json({ success: true, data: { ...sanitizeUser(user), permissions } });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = generateResetToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiresAt: expires },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, `${user.firstName} ${user.lastName}`, resetLink);
  }

  res.json({ success: true, message: 'If this email exists, a reset link has been sent' });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiresAt: { gt: new Date() },
    },
  });

  if (!user) throw new AppError('Invalid or expired reset token', 400);

  const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      refreshToken: null,
    },
  });

  clearAuthCookies(res);
  res.json({ success: true, message: 'Password reset successfully' });
};

export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) throw new AppError('User not found', 404);

  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new AppError('Current password is incorrect', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  await prisma.auditLog.create({
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
